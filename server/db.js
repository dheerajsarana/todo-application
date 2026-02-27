// =============================================
// db.js - Sets up the SQLite database
//
// SQLite is a simple database that saves data
// to a single file (todo-app.db) on your computer.
// No separate database server needed!
// =============================================

const Database = require('better-sqlite3');
const path = require('path');

// Create (or open) the database file
// It will be created in the root of the project
const dbFilePath = path.join(__dirname, '..', 'todo-app.db');
const db = new Database(dbFilePath);

// ---- Create Tables ----
// These SQL commands create the tables if they don't already exist.
// Think of tables like spreadsheets — rows and columns.

// The "users" table stores email and hashed passwords
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    createdAt TEXT    DEFAULT (datetime('now'))
  )
`);

// The "todos" table stores each task
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL,
    text      TEXT    NOT NULL,
    completed INTEGER DEFAULT 0,
    due_date  TEXT,
    createdAt TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

// ---- Migrate existing tables ----
// If the database already exists from before, we need to ADD
// the new columns without destroying existing data.
// SQLite's ALTER TABLE only supports adding columns, so we try
// each one and silently ignore the error if it already exists.

try { db.exec(`ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium'`); } catch (e) {}
try { db.exec(`ALTER TABLE todos ADD COLUMN category TEXT DEFAULT 'General'`); } catch (e) {}

// Export the database so other files can use it
module.exports = db;
