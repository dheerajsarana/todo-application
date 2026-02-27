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

// ---- Module: Profile ----
// Add displayName column to users table if not already present
try { db.exec(`ALTER TABLE users ADD COLUMN displayName TEXT`); } catch (e) {}

// ---- Module: Categories ----
// Stores user-created custom categories
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL,
    name      TEXT    NOT NULL,
    createdAt TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

// ---- Module: Tags ----
// User-defined labels that can be attached to todos
db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL,
    name      TEXT    NOT NULL,
    createdAt TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

// Join table linking tags to todos (many-to-many)
db.exec(`
  CREATE TABLE IF NOT EXISTS todo_tags (
    tagId  INTEGER NOT NULL,
    todoId INTEGER NOT NULL,
    PRIMARY KEY (tagId, todoId),
    FOREIGN KEY (tagId)  REFERENCES tags(id),
    FOREIGN KEY (todoId) REFERENCES todos(id)
  )
`);

// ---- Module: Comments ----
// Notes/comments attached to individual todos
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    todoId    INTEGER NOT NULL,
    userId    INTEGER NOT NULL,
    text      TEXT    NOT NULL,
    createdAt TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (todoId)  REFERENCES todos(id),
    FOREIGN KEY (userId)  REFERENCES users(id)
  )
`);

// ---- Module: Reminders ----
// Stores date/time reminders optionally linked to a todo
db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    userId     INTEGER NOT NULL,
    todoId     INTEGER,
    title      TEXT    NOT NULL,
    remindAt   TEXT    NOT NULL,
    dismissed  INTEGER DEFAULT 0,
    createdAt  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (userId)  REFERENCES users(id),
    FOREIGN KEY (todoId)  REFERENCES todos(id)
  )
`);

// Export the database so other files can use it
module.exports = db;
