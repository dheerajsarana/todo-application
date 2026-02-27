// =============================================
// routes/auth.js - Login and Signup routes
//
// These routes handle creating new accounts
// and logging in to existing ones.
// =============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// ---- POST /api/auth/register ----
// Create a new user account
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Make sure both fields were sent
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  // Check if this email is already registered
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  // Hash the password before saving it
  // We NEVER store plain text passwords — only the hash
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save the new user to the database
  const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);

  res.status(201).json({ message: 'Account created successfully!' });
});

// ---- POST /api/auth/login ----
// Log in with email and password, get back a token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Make sure both fields were sent
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Look up the user by email
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  // Compare the entered password with the hashed one in the database
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  // Create a JWT token that proves the user is logged in
  // The token expires in 7 days
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;
