// =============================================
// routes/profile.js - User Profile Module
//
// Lets users view and update their profile,
// and change their password.
//
// Routes:
//   GET  /api/profile            - get current user's profile
//   PUT  /api/profile            - update display name
//   PUT  /api/profile/password   - change password
//   DELETE /api/profile          - delete account and all data
// =============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/profile ----
// Returns the current user's non-sensitive profile info
router.get('/', (req, res) => {
  const user = db.prepare(
    'SELECT id, email, displayName, createdAt FROM users WHERE id = ?'
  ).get(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json(user);
});

// ---- PUT /api/profile ----
// Update display name
router.put('/', (req, res) => {
  const { displayName } = req.body;

  if (!displayName || displayName.trim() === '') {
    return res.status(400).json({ message: 'Display name is required.' });
  }

  db.prepare(
    'UPDATE users SET displayName = ? WHERE id = ?'
  ).run(displayName.trim(), req.user.userId);

  const updated = db.prepare(
    'SELECT id, email, displayName, createdAt FROM users WHERE id = ?'
  ).get(req.user.userId);

  res.json(updated);
});

// ---- PUT /api/profile/password ----
// Change the user's password
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.userId);

  res.json({ message: 'Password updated successfully.' });
});

// ---- DELETE /api/profile ----
// Permanently delete the account and all associated data
router.delete('/', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required to delete your account.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  const uid = req.user.userId;

  // Delete in dependency order
  db.prepare(`
    DELETE FROM todo_tags WHERE todoId IN (SELECT id FROM todos WHERE userId = ?)
  `).run(uid);
  db.prepare('DELETE FROM comments WHERE userId = ?').run(uid);
  db.prepare('DELETE FROM tags WHERE userId = ?').run(uid);
  db.prepare('DELETE FROM categories WHERE userId = ?').run(uid);
  db.prepare('DELETE FROM todos WHERE userId = ?').run(uid);
  db.prepare('DELETE FROM users WHERE id = ?').run(uid);

  res.json({ message: 'Account deleted.' });
});

module.exports = router;
