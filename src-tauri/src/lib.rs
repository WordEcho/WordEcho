/**********************************************************************
This project's backend has been primarily written with the help of AI
due to my limited experience and familiarity with the Rust programming language.
While I have made some manual adjustments and tweaks where necessary,
much of the code is AI-generated. My current focus was on getting the
project up and running rather than mastering Rust, so some parts of the
implementation may not reflect best practices or optimal solutions.
Use this project with the understanding that it relies heavily on AI assistance,
and any issues or inefficiencies may stem from this approach. If i ever
find the time to get more experience with Rust then i will come back
and refactor the codebase.
**********************************************************************/

use tauri::Manager;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::FromRow;
use serde::{Serialize, Deserialize};
use dotenv::dotenv;
use lazy_static::lazy_static;
use regex::Regex;
use chrono::Utc;

use base64::{Engine as _, engine::general_purpose};
use flate2::write::GzEncoder;
use flate2::read::GzDecoder;
use flate2::Compression;
use std::io::{Write, Read};

lazy_static! {
    static ref NOW: chrono::DateTime<Utc> = Utc::now();
}

lazy_static! {
    // Regex to remove specific punctuation: . , " ' / [ ( ) ]
    static ref PUNCTUATION_REGEX: Regex = Regex::new("[.,:!’?\"!“.”'’,,’’…/\\[\\](){}<>«'»-]").unwrap();
}

#[derive(Serialize, Deserialize, Debug)]
struct Text {
    id: i64, // SQLite INTEGER maps to i64 in Rust
    title: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug, FromRow)]
struct Word {
    id: i64,
    word: String,
    status: Option<String>, 
    meaning: Option<String>, // Nullable field
    stability: Option<f64>,  // Stability parameter from FSRS
    difficulty: Option<f64>, // Difficulty parameter from FSRS
    last_review_date: Option<String>, // Timestamp of the last review (ISO 8601)
    next_review_date: Option<String>, // Timestamp for the next review (ISO 8601)
}

#[derive(Serialize, Deserialize, Debug)]
struct TextWord {
    text_id: i64,
    word_id: i64,
}

#[derive(Serialize, Deserialize, Debug)]
struct UserPreference {
    id: i64,
    country_code: String,
}

// Structure to hold all database content for export/import
#[derive(Serialize, Deserialize, Debug)]
struct DatabaseExport {
    texts: Vec<Text>,
    words: Vec<Word>,
    text_words: Vec<TextWord>,
    user_preferences: Vec<UserPreference>,
    version: String, // For future compatibility
}

const BASE_STABILITY: f64 = 0.5; // Initial stability for new words
const BASE_DIFFICULTY: f64 = 0.3; // Initial difficulty (0-1 scale, lower means harder)

const EASY_BONUS: f64 = 1.3; // Additional boost for "Easy" rating
const HARD_PENALTY: f64 = 0.5; // Penalty for "Hard" rating
const AGAIN_RESET_PCT: f64 = 0.2; // How much stability is retained after "Again"
const MIN_INTERVAL: i64 = 1; // Minimum interval in days
const MAX_INTERVAL: i64 = 365 * 10; // Maximum interval (10 years)
const INTERVAL_MODIFIER: f64 = 1.0; // Global scaling factor

const TARGET_RETENTION: f64 = 0.85; // Target probability of recall

#[tauri::command]
async fn generate_sync_key(state: tauri::State<'_, SqlitePool>) -> Result<String, String> {
    // 1. Extract all data from the database
    let db_export = export_database(&state).await?;
    
    // 2. Serialize to JSON
    let json_data = serde_json::to_string(&db_export)
        .map_err(|e| format!("Failed to serialize database: {}", e))?;
    
    // 3. Compress and encode
    let sync_key = compress_and_encode(&json_data)
        .map_err(|e| format!("Failed to compress data: {}", e))?;
    
    Ok(sync_key)
}

#[tauri::command]
async fn apply_sync_key(
    state: tauri::State<'_, SqlitePool>, 
    sync_key: String
) -> Result<(), String> {
    // 1. Decode and decompress
    let json_data = decode_and_decompress(&sync_key)
        .map_err(|e| format!("Failed to decode sync key: {}", e))?;
    
    // 2. Deserialize
    let db_export: DatabaseExport = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to deserialize database: {}", e))?;
    
    // 3. Import into database (this will overwrite existing data)
    import_database(&state, db_export).await?;
    
    Ok(())
}

async fn export_database(state: &SqlitePool) -> Result<DatabaseExport, String> {
    // Fetch all texts
    let texts = sqlx::query_as!(
        Text,
        r#"SELECT id, title, content FROM texts"#
    )
    .fetch_all(state)
    .await
    .map_err(|e| format!("Failed to fetch texts: {}", e.to_string()))?;

    // Fetch all words
    let words = sqlx::query_as!(
        Word,
        r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date FROM words"#
    )
    .fetch_all(state)
    .await
    .map_err(|e| format!("Failed to fetch words: {}", e.to_string()))?;

    // Fetch all text_words relationships
    let text_words = sqlx::query_as!(
        TextWord,
        r#"SELECT text_id, word_id FROM text_words"#
    )
    .fetch_all(state)
    .await
    .map_err(|e| format!("Failed to fetch text_words: {}", e.to_string()))?;

    // Fetch user preferences
    let user_preferences = sqlx::query_as!(
        UserPreference,
        r#"SELECT id, country_code FROM user_preferences"#
    )
    .fetch_all(state)
    .await
    .map_err(|e| format!("Failed to fetch user preferences: {}", e.to_string()))?;

    // Create the export structure
    let export = DatabaseExport {
        texts,
        words,
        text_words,
        user_preferences,
        version: "1.0".to_string(), // For future compatibility
    };

    Ok(export)
}

async fn import_database(state: &SqlitePool, db_export: DatabaseExport) -> Result<(), String> {
    // Begin a transaction
    let mut tx = state.begin().await.map_err(|e| e.to_string())?;

    // Clear existing tables
    sqlx::query!("DELETE FROM text_words")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear text_words: {}", e))?;

    sqlx::query!("DELETE FROM texts")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear texts: {}", e))?;

    sqlx::query!("DELETE FROM words")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear words: {}", e))?;

    sqlx::query!("DELETE FROM user_preferences")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear user_preferences: {}", e))?;

    // Insert texts
    for text in &db_export.texts {
        sqlx::query!(
            r#"INSERT INTO texts (id, title, content) VALUES (?, ?, ?)"#,
            text.id,
            text.title,
            text.content
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert text: {}", e))?;
    }

    // Insert words
    for word in &db_export.words {
        sqlx::query!(
            r#"INSERT INTO words (id, word, status, meaning, stability, difficulty, last_review_date, next_review_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
            word.id,
            word.word,
            word.status,
            word.meaning,
            word.stability,
            word.difficulty,
            word.last_review_date,
            word.next_review_date
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert word: {}", e))?;
    }

    // Insert text_words relationships
    for text_word in &db_export.text_words {
        sqlx::query!(
            r#"INSERT INTO text_words (text_id, word_id) VALUES (?, ?)"#,
            text_word.text_id,
            text_word.word_id
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert text_word relationship: {}", e))?;
    }

    // Insert user preferences
    for pref in &db_export.user_preferences {
        sqlx::query!(
            r#"INSERT INTO user_preferences (id, country_code) VALUES (?, ?)"#,
            pref.id,
            pref.country_code
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert user preference: {}", e))?;
    }

    // Commit the transaction
    tx.commit().await.map_err(|e| format!("Failed to commit transaction: {}", e))?;

    // Reset SQLite sequences
    sqlx::query!("UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM texts) WHERE name = 'texts'")
        .execute(state)
        .await
        .map_err(|e| format!("Failed to reset texts sequence: {}", e))?;

    sqlx::query!("UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM words) WHERE name = 'words'")
        .execute(state)
        .await
        .map_err(|e| format!("Failed to reset words sequence: {}", e))?;

    sqlx::query!("UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM user_preferences) WHERE name = 'user_preferences'")
        .execute(state)
        .await
        .map_err(|e| format!("Failed to reset user_preferences sequence: {}", e))?;

    Ok(())
}

fn compress_and_encode(data: &str) -> Result<String, std::io::Error> {
    // Create a gzip encoder with high compression level
    let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
    
    // Write data to the encoder
    encoder.write_all(data.as_bytes())?;
    
    // Finish compression and get the compressed data
    let compressed_data = encoder.finish()?;
    
    // Encode to base64 for easy transfer
    let encoded = general_purpose::URL_SAFE.encode(compressed_data);
    
    Ok(encoded)
}

fn decode_and_decompress(encoded: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Decode from base64
    let compressed_data = general_purpose::URL_SAFE.decode(encoded)?;
    
    // Create a gzip decoder
    let mut decoder = GzDecoder::new(&compressed_data[..]);
    
    // Read decompressed data
    let mut decompressed_data = String::new();
    decoder.read_to_string(&mut decompressed_data)?;
    
    Ok(decompressed_data)
}

#[tauri::command]
async fn get_text_with_words(
    state: tauri::State<'_, SqlitePool>,
    id: i64,
) -> Result<(Text, Vec<Word>), String> {
    // Fetch the text
    let text = sqlx::query_as!(
        Text,
        r#"SELECT id, title, content FROM texts WHERE id = ?"#,
        id
    )
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?
    .ok_or("Text not found")?;

    // Remove punctuation from the content and split into words
    let cleaned_content = PUNCTUATION_REGEX.replace_all(&text.content, "").to_string();
    let words: Vec<&str> = cleaned_content.split_whitespace().collect();

    // Fetch the corresponding words from the database
    let mut word_data = Vec::new();
    for word in words {
        let word_record = sqlx::query_as::<_, Word>(
            r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date 
            FROM words 
            WHERE word = ?"#,
        )
        .bind(word)
        .fetch_optional(&*state)
        .await
        .map_err(|e| e.to_string())?;
        if let Some(w) = word_record {
            word_data.push(w);
        }
    }

    // println!("Fetched words: {:?}", word_data);
    Ok((text, word_data))
}

#[tauri::command]
async fn get_texts(state: tauri::State<'_, SqlitePool>) -> Result<Vec<Text>, String> {
    let texts = sqlx::query_as!(
        Text,
        r#"SELECT id, title, content FROM texts"#
    )
    .fetch_all(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok(texts)
}

#[tauri::command]
async fn get_text_by_id(
    state: tauri::State<'_, SqlitePool>,
    id: i64,
) -> Result<Option<Text>, String> {
    let text = sqlx::query_as!(
        Text,
        r#"SELECT id, title, content FROM texts WHERE id = ?"#,
        id
    )
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok(text)
}

#[tauri::command]
async fn create_text(
    state: tauri::State<'_, SqlitePool>,
    title: String,
    content: String,
) -> Result<Text, String> {
    let text = sqlx::query_as!(
        Text,
        r#"INSERT INTO texts (title, content) VALUES (?, ?) RETURNING id, title, content"#,
        title,
        content
    )
    .fetch_one(&*state)
    .await
    .map_err(|e| e.to_string())?;
    println!("Inserted text with ID: {}", text.id);

    let re = Regex::new(r"\b\p{L}+\b").unwrap();
    let words: Vec<&str> = re.find_iter(&content).map(|mat| mat.as_str()).collect();

    for word in words {
        let existing_word = sqlx::query_as::<_, Word>(
            r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date FROM words WHERE word = ?"#,
        )
        .bind(word)
        .fetch_optional(&*state)
        .await
        .map_err(|e| e.to_string())?;

        let word_id = if let Some(existing) = existing_word {
            existing.id
        } else {
            let inserted_word = sqlx::query!(
                r#"INSERT INTO words (word, status, meaning, stability, difficulty, last_review_date, next_review_date) 
                VALUES (?, 'new', NULL, 1.0, 5.0, NULL, NULL) RETURNING id"#,
                word
            )
            .fetch_one(&*state)
            .await
            .map_err(|e| e.to_string())?;
            inserted_word.id
        };

        sqlx::query!(
            r#"INSERT OR IGNORE INTO text_words (text_id, word_id) VALUES (?, ?)"#,
            text.id,
            word_id
        )
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(text)
}

#[tauri::command]
async fn get_text_word_counts(
    state: tauri::State<'_, SqlitePool>,
    text_id: i64,
) -> Result<(i64, i64, i64), String> {
    let counts = sqlx::query!(
        r#"
        SELECT
            COALESCE(SUM(CASE WHEN w.status = 'new' THEN 1 ELSE 0 END), 0) AS new_count,
            COALESCE(SUM(CASE WHEN w.status = 'seen' THEN 1 ELSE 0 END), 0) AS seen_count,
            COALESCE(SUM(CASE WHEN w.status = 'known' THEN 1 ELSE 0 END), 0) AS known_count
        FROM text_words tw
        JOIN words w ON tw.word_id = w.id
        WHERE tw.text_id = ?
        "#,
        text_id
    )
    .fetch_one(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok((
        counts.new_count,
        counts.seen_count,
        counts.known_count,
    ))
}

#[tauri::command]
async fn update_text(
    state: tauri::State<'_, SqlitePool>,
    id: i64,
    title: String,
    content: String,
) -> Result<(), String> {
    // Update the text's title and content
    sqlx::query!(
        r#"UPDATE texts SET title = ?, content = ? WHERE id = ?"#,
        title,
        content,
        id
    )
    .execute(&*state)
    .await
    .map_err(|e| e.to_string())?;

    println!("Updated text with ID: {}", id);

    // Use a Unicode-aware regex to extract words
    let re = Regex::new(r"\b\p{L}+\b").unwrap(); // Matches whole words with Unicode letters
    let words: Vec<&str> = re.find_iter(&content).map(|mat| mat.as_str()).collect();

    println!("Extracted words: {:?}", words);

    for word in words {
        // Check if the word already exists in the database
        let existing_word = sqlx::query_as::<_, Word>(
            r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date FROM words WHERE word = ?"#,
        )
        .bind(word)
        .fetch_optional(&*state)
        .await
        .map_err(|e| e.to_string())?;

        let word_id = if let Some(existing) = existing_word {
            println!("Found existing word: {} (ID: {})", word, existing.id);
            existing.id // Use the existing word's ID
        } else {
            // Insert the word if it doesn't exist
            println!("Inserting new word: {}", word);
            let inserted_word = sqlx::query!(
                r#"INSERT INTO words (word, status, meaning, stability, difficulty, last_review_date, next_review_date) 
                VALUES (?, 'new', NULL, 1.0, 5.0, NULL, NULL) RETURNING id"#,
                word
            )
            .fetch_one(&*state)
            .await
            .map_err(|e| e.to_string())?;
            println!("Inserted word: {} (ID: {})", word, inserted_word.id);
            inserted_word.id
        };

        // Link the word to the text in the `text_words` table
        println!("Linking word ID {} to text ID {}", word_id, id);
        sqlx::query!(
            r#"INSERT OR IGNORE INTO text_words (text_id, word_id) VALUES (?, ?)"#,
            id,
            word_id
        )
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn delete_text(
    state: tauri::State<'_, SqlitePool>,
    text_id: i64,
) -> Result<(), String> {
    println!("Attempting to delete text with ID: {}", text_id);

    // Begin a transaction to ensure atomicity
    let mut tx = state.begin().await.map_err(|e| {
        println!("Error beginning transaction: {}", e);
        e.to_string()
    })?;

    // Delete rseted rows from the text_words table
    sqlx::query!("DELETE FROM text_words WHERE text_id = ?", text_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            println!("Error deleting from text_words: {}", e);
            e.to_string()
        })?;
    println!("Deleted related rows from text_words for text ID: {}", text_id);

    // Delete the text from the texts table
    sqlx::query!("DELETE FROM texts WHERE id = ?", text_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            println!("Error deleting from texts: {}", e);
            e.to_string()
        })?;
    println!("Deleted text with ID: {}", text_id);

    // Commit the transaction
    tx.commit().await.map_err(|e| {
        println!("Error committing transaction: {}", e);
        e.to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn mark_word_as_known(
    state: tauri::State<'_, SqlitePool>,
    word_id: i64,
) -> Result<(), String> {
    // Update the status to "known" and clear the `next_review_date`
    match sqlx::query!(
        r#"UPDATE words SET status = 'known', next_review_date = NULL WHERE id = ?"#,
        word_id
    )
    .execute(&*state)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                Err("Word ID not found".to_string())
            } else {
                Ok(())
            }
        }
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

#[tauri::command]
async fn update_word_meaning(
    state: tauri::State<'_, SqlitePool>,
    word_id: i64,
    meaning: String,
) -> Result<(), String> {
    let now_iso = chrono::Utc::now().to_rfc3339(); // Current timestamp as ISO 8601

    // Update both `meaning`, `status`, and `next_review_date`
    match sqlx::query!(
        r#"UPDATE words SET meaning = ?, status = 'seen', next_review_date = ? WHERE id = ?"#,
        meaning,
        now_iso, // Set `next_review_date` to the current time
        word_id
    )
    .execute(&*state)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                Err("Word ID not found".to_string())
            } else {
                Ok(())
            }
        }
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

#[tauri::command]
async fn get_random_word(state: tauri::State<'_, SqlitePool>) -> Result<Word, String> {
    // Get the current timestamp as an ISO 8601 string
    let now = chrono::Utc::now().to_rfc3339();

    // Fetch a random word due for review
    // We prioritize words that are most overdue (lowest retention probability)
    let word = sqlx::query_as::<_, Word>(
        r#"
        SELECT 
            id, word, status, meaning, stability, difficulty, 
            last_review_date, next_review_date 
        FROM words 
        WHERE 
            status = 'seen' AND 
            next_review_date <= ? 
        ORDER BY next_review_date ASC
        LIMIT 1
        "#,
    )
    .bind(now) // Bind the current timestamp to the query
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?;

    match word {
        Some(word) => Ok(word),
        None => Err("No words are due for review".to_string()),
    }
}

#[tauri::command]
async fn estimate_word_retention(
    state: tauri::State<'_, SqlitePool>,
    word_id: i64,
) -> Result<f64, String> {
    // Fetch the word from the database
    let word = sqlx::query_as::<_, Word>(
        r#"SELECT stability, last_review_date FROM words WHERE id = ?"#,
    )
    .bind(word_id)
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?
    .ok_or("Word not found")?;
    
    // If we don't have stability data, return default
    let stability = match word.stability {
        Some(s) => s,
        None => return Ok(0.0), // No retention data
    };
    
    // If no last review, assume 100% retention
    let last_review_date = match word.last_review_date {
        Some(date) => date,
        None => return Ok(1.0), // No decay yet
    };
    
    // Calculate days since last review
    let last_review = match chrono::DateTime::parse_from_rfc3339(&last_review_date) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(_) => return Err("Invalid last review date format".to_string()),
    };
    
    let now = chrono::Utc::now();
    let days_elapsed = now.signed_duration_since(last_review).num_days().max(0) as f64;
    
    // Calculate current retention using exponential forgetting curve
    // R = e^(-d/S) where d is days since last review and S is stability
    let retention = (-days_elapsed / stability).exp();
    
    Ok(retention)
}

#[tauri::command]
async fn save_selected_country_code(
    state: tauri::State<'_, SqlitePool>,
    country_code: String,
) -> Result<(), String> {
    // Clear the existing preference (if any) and insert the new one
    sqlx::query!("DELETE FROM user_preferences")
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query!(
        r#"INSERT INTO user_preferences (country_code) VALUES (?)"#,
        country_code
    )
    .execute(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn update_word_parameters(
    stability: f64,
    difficulty: f64,
    last_interval: Option<i64>,
    rating: &str,
) -> (f64, f64, i64, f64) {
    let mut new_stability = stability;
    let mut new_difficulty = difficulty;
    let default_last_interval = 1;
    let last_interval = last_interval.unwrap_or(default_last_interval);
    
    // Calculate retrievability (theoretical probability of recall)
    // R = e^(-d/S) where d is days since last review and S is stability
    let retrievability = (-1.0 * (last_interval as f64) / stability).exp();
    
    // Update difficulty based on performance vs expected
    match rating {
        "Again" => {
            // Lapse: reset stability but keep some memory trace
            new_stability = stability * AGAIN_RESET_PCT;
            // If you failed despite high retrievability, increase difficulty
            let expected_success = retrievability;
            let actual_success = 0.0; // Failed
            new_difficulty = (new_difficulty + (expected_success - actual_success) * 0.2)
                .clamp(0.1, 1.0);
        }
        "Hard" => {
            // Succeeded but with difficulty
            let memory_strength = HARD_PENALTY;
            new_stability = stability * (1.0 + memory_strength * (1.0 - retrievability));
            
            // Adjust difficulty (if it was hard despite high retrievability, increase difficulty)
            let expected_success = retrievability;
            let actual_success = 0.6; // Partial success
            new_difficulty = (new_difficulty + (expected_success - actual_success) * 0.15)
                .clamp(0.1, 1.0);
        }
        "Good" => {
            // Standard success
            let memory_strength = 1.0;
            new_stability = stability * (1.0 + memory_strength * (1.0 - retrievability));
            
            // Adjust difficulty
            let expected_success = retrievability;
            let actual_success = 1.0; // Full success
            new_difficulty = (new_difficulty + (expected_success - actual_success) * 0.1)
                .clamp(0.1, 1.0);
        }
        "Easy" => {
            // Easy success
            let memory_strength = EASY_BONUS;
            new_stability = stability * (1.0 + memory_strength * (1.0 - retrievability));
            
            // Reduce difficulty
            let expected_success = retrievability;
            let actual_success = 1.0; // Very easy success
            new_difficulty = (new_difficulty + (expected_success - actual_success) * 0.08)
                .clamp(0.1, 1.0);
        }
        _ => {}
    }
    
    // Calculate optimal interval based on stability, target retention and difficulty
    // Solve for t in: e^(-t/S) = R where R is target retention
    // t = -S * ln(R)
    let optimal_days = -new_stability * TARGET_RETENTION.ln();
    
    // Apply difficulty modifier (higher difficulty = shorter intervals)
    let difficulty_modifier = 1.0 - (new_difficulty - 0.3) * 0.5;
    
    // Calculate scheduled days with global interval modifier
    let scheduled_days = (optimal_days * difficulty_modifier * INTERVAL_MODIFIER).round() as i64;
    
    // Ensure scheduled days is within bounds
    let scheduled_days = scheduled_days.clamp(MIN_INTERVAL, MAX_INTERVAL);
    
    // For debugging: calculate actual predicted retention at review time
    let predicted_retention = (-1.0 * (scheduled_days as f64) / new_stability).exp();
    
    (new_stability, new_difficulty, scheduled_days, predicted_retention)
}

#[tauri::command]
async fn get_selected_country_code(
    state: tauri::State<'_, SqlitePool>,
) -> Result<Option<String>, String> {
    let preference = sqlx::query!(
        r#"SELECT country_code FROM user_preferences LIMIT 1"#
    )
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok(preference.map(|p| p.country_code))
}

#[tauri::command]
async fn review_word(
    state: tauri::State<'_, SqlitePool>,
    word_id: i64,
    rating: String,
) -> Result<(), String> {
    // Fetch the word from the database
    let word = sqlx::query_as::<_, Word>(
        r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date FROM words WHERE id = ?"#,
    )
    .bind(word_id)
    .fetch_optional(&*state)
    .await
    .map_err(|e| e.to_string())?
    .ok_or("Word not found")?;

    // Make sure we have valid stability and difficulty values
    let stability = word.stability.unwrap_or(BASE_STABILITY);
    let difficulty = word.difficulty.unwrap_or(BASE_DIFFICULTY);
    
    // Calculate days since last review (default to 1 if first review)
    let days_since_last_review = if let Some(last_date) = &word.last_review_date {
        let last_review = match chrono::DateTime::parse_from_rfc3339(last_date) {
            Ok(dt) => dt.with_timezone(&chrono::Utc),
            Err(_) => return Err("Invalid last review date format".to_string()),
        };
        
        let now = chrono::Utc::now();
        let duration = now.signed_duration_since(last_review);
        duration.num_days().max(1) // At least 1 day
    } else {
        1 // First review
    };

    println!(
        "Review - Word: {}, Initial Stability: {}, Difficulty: {}, Days Since Last: {}",
        word.word,
        stability,
        difficulty,
        days_since_last_review
    );

    // Parse the rating
    if !["Again", "Hard", "Good", "Easy"].contains(&rating.as_str()) {
        return Err("Invalid rating".to_string());
    }

    // Update stability, difficulty, and scheduled days
    let (updated_stability, updated_difficulty, scheduled_days, predicted_retention) = 
        update_word_parameters(
            stability,
            difficulty,
            Some(days_since_last_review),
            &rating,
        );

    println!(
        "Updated Stability: {}, Difficulty: {}, Scheduled Days: {}, Predicted Retention: {:.1}%",
        updated_stability, 
        updated_difficulty, 
        scheduled_days,
        predicted_retention * 100.0
    );

    // Calculate the next review date
    let now = chrono::Utc::now();
    let next_review = now + chrono::Duration::days(scheduled_days);
    let next_review_iso = next_review.to_rfc3339();
    let now_iso = now.to_rfc3339();

    // Update the word in the database
    sqlx::query!(
        r#"
        UPDATE words
        SET
            stability = ?,
            difficulty = ?,
            last_review_date = ?,
            next_review_date = ?
        WHERE id = ?
        "#,
        updated_stability,
        updated_difficulty,
        now_iso,         // Current timestamp as ISO 8601
        next_review_iso, // Next review date as ISO 8601
        word_id
    )
    .execute(&*state)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_all_words(state: tauri::State<'_, SqlitePool>) -> Result<Vec<Word>, String> {
    let words = sqlx::query_as::<_, Word>(
        r#"SELECT id, word, status, meaning, stability, difficulty, last_review_date, next_review_date FROM words"#
    )
    .fetch_all(&*state)
    .await
    .map_err(|e| e.to_string())?;
    Ok(words)
}

#[tauri::command]
async fn delete_word(
    state: tauri::State<'_, SqlitePool>,
    word_id: i64,
) -> Result<(), String> {
    println!("Attempting to delete word with ID: {}", word_id);

    // Begin a transaction to ensure atomicity
    let mut tx = state.begin().await.map_err(|e| {
        println!("Error beginning transaction: {}", e);
        e.to_string()
    })?;

    // Delete related rows from the text_words table
    sqlx::query!("DELETE FROM text_words WHERE word_id = ?", word_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            println!("Error deleting from text_words: {}", e);
            e.to_string()
        })?;
    println!("Deleted related rows from text_words for word ID: {}", word_id);

    // Delete the word from the words table
    let result = sqlx::query!("DELETE FROM words WHERE id = ?", word_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            println!("Error deleting from words: {}", e);
            e.to_string()
        })?;

    if result.rows_affected() == 0 {
        return Err("Word ID not found".to_string());
    }

    println!("Deleted word with ID: {}", word_id);

    // Commit the transaction
    tx.commit().await.map_err(|e| {
        println!("Error committing transaction: {}", e);
        e.to_string()
    })?;

    Ok(())
}

// Create a function to initialize the database
pub async fn init_db(pool: &SqlitePool) {
    let schema = include_str!("../schema.sql");
    sqlx::query(schema)
        .execute(pool)
        .await
        .expect("Failed to initialize database");
}

// Create a function that sets up the application with all the commands
pub fn app() -> tauri::Builder<tauri::Wry> {
    dotenv().ok();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_texts,
            create_text,
            get_text_with_words,
            get_text_by_id,
            update_text,
            delete_text,
            update_word_meaning,
            mark_word_as_known,
            get_text_word_counts,
            get_random_word,
            save_selected_country_code,
            get_selected_country_code,
            review_word,
            get_all_words,
            delete_word,
            generate_sync_key,
            apply_sync_key,
            estimate_word_retention,
        ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tokio::runtime::Runtime::new().unwrap().block_on(async {
        // Build the Tauri app and extract the app handle
        let app = tauri::Builder::default()
            .build(tauri::generate_context!())
            .expect("Failed to build Tauri app");

        let app_handle = app.app_handle();

        // Determine the database path based on the platform
        let db_path = if cfg!(target_os = "android") {
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            app_dir.join("db.sqlite").to_str().unwrap().to_string()
        } else if cfg!(target_os = "ios") {
            let docs_dir = app_handle
                .path()
                .document_dir()
                .expect("Failed to get documents directory");
            docs_dir.join("db.sqlite").to_str().unwrap().to_string()
        } else {
            "../db.sqlite".to_string()
        };

        println!("Using database path: {}", db_path);

        // Connect to the SQLite database with foreign key support enabled
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(
                sqlx::sqlite::SqliteConnectOptions::new()
                    .filename(db_path)
                    .create_if_missing(true)
                    .foreign_keys(true),
            )
            .await
            .expect("Failed to connect to database");

        // Initialize the database asynchronously
        init_db(&pool).await;

        // Run the app with the database connection pool
        tauri::Builder::default()
            .manage(pool) // Attach the database connection pool
            .setup(|_app| {
                // Additional setup logic can go here
                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                get_texts,
                create_text,
                get_text_with_words,
                get_text_by_id,
                update_text,
                delete_text,
                update_word_meaning,
                mark_word_as_known,
                get_text_word_counts,
                get_random_word,
                save_selected_country_code,
                get_selected_country_code,
                review_word,
                get_all_words,
                delete_word,
                generate_sync_key,
                apply_sync_key,
                estimate_word_retention,
            ])
            .run(tauri::generate_context!())
            .expect("Error while running Tauri application");
    });
}