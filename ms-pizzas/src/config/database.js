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

    // IMPORTANT: Activer les clés étrangères
    db.run('PRAGMA foreign_keys = ON');
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

// Table de liaison pizza-ingredients
const pizzaIngredientsTableSql = `
    CREATE TABLE IF NOT EXISTS pizza_ingredients (
         pizza_id INTEGER NOT NULL,
         ingredient_id INTEGER NOT NULL,
         PRIMARY KEY (pizza_id, ingredient_id),
        FOREIGN KEY (pizza_id) REFERENCES pizzas(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        );
`;

db.serialize(() => {
    db.run(pizzasTableSql, (err) => {
        if (err) {
            console.error('Failed to create pizzas table', err);
            process.exit(1);
        }
    });


    db.run(pizzaIngredientsTableSql, (err) => {
        if (err) {
            console.error('Failed to create pizza_ingredients table', err);
            process.exit(1);
        }
    });
});

module.exports = db;