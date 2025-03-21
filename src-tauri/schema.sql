CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'new',
    meaning TEXT, -- Nullable field
    stability REAL, -- Stability parameter from FSRS
    difficulty REAL, -- Difficulty parameter from FSRS
    last_review_date TEXT, -- Timestamp of the last review (ISO 8601)
    next_review_date TEXT -- Timestamp for the next review (ISO 8601)
);

CREATE TABLE IF NOT EXISTS texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS text_words (
    text_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    FOREIGN KEY (text_id) REFERENCES texts(id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(id),
    PRIMARY KEY (text_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL
);