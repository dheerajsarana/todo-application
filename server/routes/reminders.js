// =============================================
// routes/reminders.js - Reminders & Notifications Module
//
// Routes:
//   GET    /api/reminders          - list all reminders for user
//   POST   /api/reminders          - create a reminder
//   PUT    /api/reminders/:id      - update a reminder
//   DELETE /api/reminders/:id      - delete a reminder
//   GET    /api/reminders/due      - get undismissed reminders whose time has passed
//   PUT    /api/reminders/:id/dismiss - mark a reminder as dismissed
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/reminders/due ----
// Must be registered BEFORE /:id so "due" isn't treated as an id
router.get('/due', (req, res) => {
  const due = db.prepare(`
    SELECT r.*, t.text AS todoText
    FROM reminders r
    LEFT JOIN todos t ON t.id = r.todoId
    WHERE r.userId = ? AND r.dismissed = 0 AND r.remindAt <= datetime('now')
    ORDER BY r.remindAt ASC
  `).all(req.user.userId);

  res.json(due);
});

// ---- GET /api/reminders ----
router.get('/', (req, res) => {
  const reminders = db.prepare(`
    SELECT r.*, t.text AS todoText
    FROM reminders r
    LEFT JOIN todos t ON t.id = r.todoId
    WHERE r.userId = ?
    ORDER BY r.remindAt ASC
  `).all(req.user.userId);

  res.json(reminders);
});

// ---- POST /api/reminders ----
router.post('/', (req, res) => {
  const { title, remindAt, todoId } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Reminder title is required.' });
  }
  if (!remindAt) {
    return res.status(400).json({ message: 'Reminder date/time is required.' });
  }

  // If a todoId is provided, verify it belongs to this user
  if (todoId) {
    const todo = db.prepare('SELECT id FROM todos WHERE id = ? AND userId = ?').get(todoId, req.user.userId);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found.' });
    }
  }

  const result = db.prepare(`
    INSERT INTO reminders (userId, title, remindAt, todoId)
    VALUES (?, ?, ?, ?)
  `).run(req.user.userId, title.trim(), remindAt, todoId || null);

  const created = db.prepare(`
    SELECT r.*, t.text AS todoText FROM reminders r
    LEFT JOIN todos t ON t.id = r.todoId
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(created);
});

// ---- PUT /api/reminders/:id ----
router.put('/:id', (req, res) => {
  const reminder = db.prepare(
    'SELECT * FROM reminders WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!reminder) {
    return res.status(404).json({ message: 'Reminder not found.' });
  }

  const { title, remindAt, todoId } = req.body;

  db.prepare(`
    UPDATE reminders SET title = ?, remindAt = ?, todoId = ?, dismissed = 0
    WHERE id = ?
  `).run(
    title ? title.trim() : reminder.title,
    remindAt || reminder.remindAt,
    todoId !== undefined ? todoId : reminder.todoId,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT r.*, t.text AS todoText FROM reminders r
    LEFT JOIN todos t ON t.id = r.todoId
    WHERE r.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// ---- PUT /api/reminders/:id/dismiss ----
router.put('/:id/dismiss', (req, res) => {
  const reminder = db.prepare(
    'SELECT * FROM reminders WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!reminder) {
    return res.status(404).json({ message: 'Reminder not found.' });
  }

  db.prepare('UPDATE reminders SET dismissed = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Reminder dismissed.' });
});

// ---- DELETE /api/reminders/:id ----
router.delete('/:id', (req, res) => {
  const reminder = db.prepare(
    'SELECT * FROM reminders WHERE id = ? AND userId = ?'
  ).get(req.params.id, req.user.userId);

  if (!reminder) {
    return res.status(404).json({ message: 'Reminder not found.' });
  }

  db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Reminder deleted.' });
});

module.exports = router;
