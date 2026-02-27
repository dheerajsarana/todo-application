// =============================================
// routes/comments.js - Comments/Notes Module
//
// Allows users to attach text notes/comments
// to individual todos for extra context.
//
// Routes:
//   GET    /api/comments/todo/:todoId   - list all comments on a todo
//   POST   /api/comments/todo/:todoId   - add a comment to a todo
//   PUT    /api/comments/:id            - edit a comment
//   DELETE /api/comments/:id            - delete a comment
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/comments/todo/:todoId ----
// List all comments on a todo (newest first)
router.get('/todo/:todoId', (req, res) => {
  // Verify the todo belongs to the logged-in user
  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND userId = ?'
  ).get(req.params.todoId, req.user.userId);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  const comments = db.prepare(`
    SELECT * FROM comments
    WHERE todoId = ?
    ORDER BY createdAt DESC
  `).all(req.params.todoId);

  res.json(comments);
});

// ---- POST /api/comments/todo/:todoId ----
// Add a new comment to a todo
router.post('/todo/:todoId', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  const todo = db.prepare(
    'SELECT * FROM todos WHERE id = ? AND userId = ?'
  ).get(req.params.todoId, req.user.userId);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  const result = db.prepare(`
    INSERT INTO comments (todoId, userId, text) VALUES (?, ?, ?)
  `).run(req.params.todoId, req.user.userId, text.trim());

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(comment);
});

// ---- PUT /api/comments/:id ----
// Edit an existing comment
router.put('/:id', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  const comment = db.prepare(
    'SELECT * FROM comments WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  db.prepare('UPDATE comments SET text = ? WHERE id = ?').run(text.trim(), req.params.id);

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ---- DELETE /api/comments/:id ----
// Delete a comment
router.delete('/:id', (req, res) => {
  const comment = db.prepare(
    'SELECT * FROM comments WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Comment deleted.' });
});

module.exports = router;
