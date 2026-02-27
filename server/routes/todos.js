// =============================================
// routes/todos.js - Todo CRUD routes
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();

// All routes in this file require the user to be logged in
router.use(requireLogin);

// Valid values for priority and category
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_CATEGORIES = ['General', 'Work', 'Personal', 'Shopping', 'Health'];

// ---- GET /api/todos ----
// Get all todos for the logged-in user
router.get('/', (req, res) => {
  const todos = db.prepare(`
    SELECT * FROM todos
    WHERE userId = ?
    ORDER BY createdAt DESC
  `).all(req.user.userId);

  // Convert completed from 0/1 (SQLite) to true/false (JavaScript)
  const formatted = todos.map(function (todo) {
    return { ...todo, completed: todo.completed === 1 };
  });

  res.json(formatted);
});

// ---- POST /api/todos ----
// Create a new todo
router.post('/', (req, res) => {
  const { text, due_date, priority, category } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Todo text is required.' });
  }

  // Use provided values or fall back to defaults
  const todoPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';
  const todoCategory = VALID_CATEGORIES.includes(category) ? category : 'General';

  const result = db.prepare(`
    INSERT INTO todos (userId, text, due_date, priority, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.userId, text.trim(), due_date || null, todoPriority, todoCategory);

  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ ...newTodo, completed: newTodo.completed === 1 });
});

// ---- PUT /api/todos/:id ----
// Update an existing todo
router.put('/:id', (req, res) => {
  const todoId = req.params.id;
  const { text, due_date, completed, priority, category } = req.body;

  // Make sure this todo belongs to the logged-in user
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(todoId, req.user.userId);
  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  const todoPriority = VALID_PRIORITIES.includes(priority) ? priority : todo.priority;
  const todoCategory = VALID_CATEGORIES.includes(category) ? category : todo.category;
  const completedValue = completed ? 1 : 0;

  db.prepare(`
    UPDATE todos
    SET text = ?, due_date = ?, completed = ?, priority = ?, category = ?
    WHERE id = ?
  `).run(
    text || todo.text,
    due_date !== undefined ? due_date : todo.due_date,
    completedValue,
    todoPriority,
    todoCategory,
    todoId
  );

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId);
  res.json({ ...updated, completed: updated.completed === 1 });
});

// ---- DELETE /api/todos/:id ----
// Delete a todo
router.delete('/:id', (req, res) => {
  const todoId = req.params.id;

  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(todoId, req.user.userId);
  if (!todo) {
    return res.status(404).json({ message: 'Todo not found.' });
  }

  db.prepare('DELETE FROM todos WHERE id = ?').run(todoId);
  res.json({ message: 'Todo deleted.' });
});

module.exports = router;
