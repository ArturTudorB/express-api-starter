// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'dev.sqlite');

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Could not connect to sqlite', err);
        process.exit(1);
    }
    console.log('Connected to sqlite database:', dbFile);
});

// Initialize pizzas table if not exists
const pizzasTableSql = `
CREATE TABLE IF NOT EXISTS pizzas (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT,
imageUrl TEXT,
price REAL NOT NULL,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
        );
`;

// Initialize ingredients table if not exists
const ingredientsTableSql = `
    CREATE TABLE IF NOT EXISTS ingredients (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
price REAL NOT NULL,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
        );
`;

db.serialize(() => {
    db.run(pizzasTableSql, (err) => {
        if (err) {
            console.error('Failed to create pizzas table', err);
            process.exit(1);
        }
    });

    db.run(ingredientsTableSql, (err) => {
        if (err) {
            console.error('Failed to create ingredients table', err);
            process.exit(1);
        }
    });
});

module.exports = db;