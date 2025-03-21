// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::sqlite::SqlitePoolOptions;
use dotenv::dotenv;
use sqlx::Row;

mod lib;

#[tokio::main]
async fn main() {
    dotenv().ok();

    // Connect to the SQLite database with foreign key support enabled
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename("../db.sqlite")
                .create_if_missing(true)
                .foreign_keys(true), // Enable foreign key support
        )
        .await
        .expect("Failed to connect to database");

    // Verify that foreign keys are enabled
    let row = sqlx::query("PRAGMA foreign_keys;")
        .fetch_one(&pool)
        .await
        .expect("Failed to check foreign keys");
    let foreign_keys_enabled: i32 = row.get(0);
    if foreign_keys_enabled == 1 {
        println!("Foreign keys are enabled.");
    } else {
        eprintln!("Foreign keys are NOT enabled!");
    }

    // Initialize the database
    lib::init_db(&pool).await;

    // Build and run the app with the database connection
    lib::app()
        .manage(pool)
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}