// =============================================
// routes/tags.js - Tags Module
//
// Users can create tags and attach them to todos
// for flexible, cross-category labelling.
//
// Routes:
//   GET    /api/tags              - list all tags for the user
//   POST   /api/tags              - create a new tag
//   DELETE /api/tags/:id          - delete a tag
//   POST   /api/tags/:id/todos/:todoId    - attach a tag to a todo
//   DELETE /api/tags/:id/todos/:todoId    - detach a tag from a todo
//   GET    /api/tags/todo/:todoId         - get all tags on a todo
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/tags ----
router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT * FROM tags WHERE userId = ? ORDER BY name ASC
  `).all(req.user.userId);
  res.json(tags);
});

// ---- POST /api/tags ----
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Tag name is required.' });
  }

  const trimmed = name.trim();
  const exists = db.prepare(
    'SELECT id FROM tags WHERE userId = ? AND name = ?'
  ).get(req.user.userId, trimmed);

  if (exists) {
    return res.status(409).json({ message: 'A tag with that name already exists.' });
  }

  const result = db.prepare(
    'INSERT INTO tags (userId, name) VALUES (?, ?)'
  ).run(req.user.userId, trimmed);

  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tag);
});

// ---- DELETE /api/tags/:id ----
router.delete('/:id', (req, res) => {
  const tag = db.prepare(
    'SELECT * FROM tags WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!tag) {
    return res.status(404).json({ message: 'Tag not found.' });
  }

  // Also remove all associations with todos
  db.prepare('DELETE FROM todo_tags WHERE tagId = ?').run(req.params.id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tag deleted.' });
});

// ---- POST /api/tags/:id/todos/:todoId ----
// Attach a tag to a todo
router.post('/:id/todos/:todoId', (req, res) => {
  const { id: tagId, todoId } = req.params;

  // Verify tag belongs to user
  const tag = db.prepare(
    'SELECT * FROM tags WHERE id = ? AND userId = ?'
  ).get(tagId, req.user.userId);
  if (!tag) {
    return res.status(404).json({ message: 'Tag not found.' });
  }

  // Verify todo belongs to user
  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND userId = ?'
  ).get(todoId, req.user.userId);
  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  // Check if already attached
  const link = db.prepare(
    'SELECT * FROM todo_tags WHERE tagId = ? AND todoId = ?'
  ).get(tagId, todoId);
  if (link) {
    return res.status(409).json({ message: 'Tag is already attached to this todo.' });
  }

  db.prepare('INSERT INTO todo_tags (tagId, todoId) VALUES (?, ?)').run(tagId, todoId);
  res.status(201).json({ message: 'Tag attached.' });
});

// ---- DELETE /api/tags/:id/todos/:todoId ----
// Detach a tag from a todo
router.delete('/:id/todos/:todoId', (req, res) => {
  const { id: tagId, todoId } = req.params;

  const link = db.prepare(
    'SELECT * FROM todo_tags WHERE tagId = ? AND todoId = ?'
  ).get(tagId, todoId);
  if (!link) {
    return res.status(404).json({ message: 'Tag is not attached to this todo.' });
  }

  db.prepare('DELETE FROM todo_tags WHERE tagId = ? AND todoId = ?').run(tagId, todoId);
  res.json({ message: 'Tag detached.' });
});

// ---- GET /api/tags/todo/:todoId ----
// Get all tags on a specific todo
router.get('/todo/:todoId', (req, res) => {
  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND userId = ?'
  ).get(req.params.todoId, req.user.userId);
  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN todo_tags tt ON tt.tagId = t.id
    WHERE tt.todoId = ?
    ORDER BY t.name ASC
  `).all(req.params.todoId);

  res.json(tags);
});

module.exports = router;
