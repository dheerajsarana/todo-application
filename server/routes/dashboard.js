// =============================================
// routes/dashboard.js - Analytics & Stats Module
//
// Returns a summary of the logged-in user's
// todo data — useful for a dashboard view.
//
// Routes:
//   GET /api/dashboard        - full stats summary
// =============================================

const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// ---- GET /api/dashboard ----
router.get('/', (req, res) => {
  const uid = req.user.userId;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Total counts
  const total = db.prepare('SELECT COUNT(*) AS count FROM todos WHERE userId = ?').get(uid).count;
  const completed = db.prepare('SELECT COUNT(*) AS count FROM todos WHERE userId = ? AND completed = 1').get(uid).count;
  const pending = total - completed;

  // Overdue: due_date is in the past and not completed
  const overdue = db.prepare(`
    SELECT COUNT(*) AS count FROM todos
    WHERE userId = ? AND completed = 0 AND due_date IS NOT NULL AND due_date < ?
  `).get(uid, today).count;

  // Due today: not completed and due today
  const dueToday = db.prepare(`
    SELECT COUNT(*) AS count FROM todos
    WHERE userId = ? AND completed = 0 AND due_date = ?
  `).get(uid, today).count;

  // Breakdown by priority
  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) AS count FROM todos
    WHERE userId = ?
    GROUP BY priority
  `).all(uid);

  // Breakdown by category
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS count FROM todos
    WHERE userId = ?
    GROUP BY category
  `).all(uid);

  // Completion rate (percentage)
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Recent activity: last 5 todos created
  const recentTodos = db.prepare(`
    SELECT id, text, completed, priority, category, due_date, createdAt
    FROM todos
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 5
  `).all(uid).map(t => ({ ...t, completed: t.completed === 1 }));

  res.json({
    total,
    completed,
    pending,
    overdue,
    dueToday,
    completionRate,
    byPriority,
    byCategory,
    recentTodos,
  });
});

module.exports = router;
