// =============================================
// index.js - The main server file
//
// This file starts the Express web server.
// Run it with: node server/index.js
// Or for auto-reload: npm run dev
// =============================================

// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our route files
const authRoutes       = require('./routes/auth');
const todoRoutes       = require('./routes/todos');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes       = require('./routes/tags');
const commentsRoutes   = require('./routes/comments');
const dashboardRoutes  = require('./routes/dashboard');
const profileRoutes    = require('./routes/profile');
const remindersRoutes  = require('./routes/reminders');

// Create the Express app
const app = express();

// ---- Middleware Setup ----
// These run on every request before the routes

// Allow requests from any origin (needed for the browser to talk to the server)
app.use(cors());

// Parse incoming JSON request bodies
// This lets us read req.body in our routes
app.use(express.json());

// Serve the frontend files from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Explicit route for "/" — sends the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ---- Routes ----
// Connect our route files to URL paths

// All auth routes: /api/auth/login and /api/auth/register
app.use('/api/auth', authRoutes);

// All todo routes: /api/todos
app.use('/api/todos', todoRoutes);

// Module routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags',       tagsRoutes);
app.use('/api/comments',   commentsRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/reminders',  remindersRoutes);

// ---- Start the Server ----
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`   Open your browser and go to http://localhost:${PORT}`);
});
