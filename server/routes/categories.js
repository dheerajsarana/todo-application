// =============================================
// routes/categories.js - Custom Categories CRUD
//
// Lets users create and manage their own
// custom categories beyond the built-in defaults.
//
// Routes:
//   GET    /api/categories        - list all categories for the user
//   POST   /api/categories        - create a new category
//   PUT    /api/categories/:id    - rename a category
//   DELETE /api/categories/:id    - delete a category
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/categories ----
// Returns both built-in defaults and user-created categories
router.get('/', (req, res) => {
  const custom = db.prepare(`
    SELECT * FROM categories
    WHERE userId = ?
    ORDER BY name ASC
  `).all(req.user.userId);

  res.json(custom);
});

// ---- POST /api/categories ----
// Create a new custom category
router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const trimmed = name.trim();

  // Prevent duplicates per user
  const exists = db.prepare(
    'SELECT id FROM categories WHERE userId = ? AND name = ?'
  ).get(req.user.userId, trimmed);

  if (exists) {
    return res.status(409).json({ message: 'A category with that name already exists.' });
  }

  const result = db.prepare(
    'INSERT INTO categories (userId, name) VALUES (?, ?)'
  ).run(req.user.userId, trimmed);

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// ---- PUT /api/categories/:id ----
// Rename an existing category
router.put('/:id', (req, res) => {
  const { name } = req.body;
  const catId = req.params.id;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const category = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND userId = ?'
  ).get(catId, req.user.userId);

  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), catId);

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(catId);
  res.json(updated);
});

// ---- DELETE /api/categories/:id ----
// Delete a custom category
router.delete('/:id', (req, res) => {
  const catId = req.params.id;

  const category = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND userId = ?'
  ).get(catId, req.user.userId);

  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(catId);
  res.json({ message: 'Category deleted.' });
});

module.exports = router;
