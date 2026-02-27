// =============================================
// middleware/auth.js - Checks if the user is logged in
//
// Middleware is code that runs BEFORE your route handler.
// This middleware checks the request for a valid login token.
// If there's no valid token, it blocks the request.
// =============================================

const jwt = require('jsonwebtoken');

function requireLogin(req, res, next) {
  // The token is sent in the "Authorization" header like:
  // Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  // If there is no Authorization header, reject the request
  if (!authHeader) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  // The header looks like "Bearer abc123...", so we split it
  // and take the second part (the actual token)
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing.' });
  }

  // Verify the token using our secret key
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request so routes can use it
    req.user = decoded;

    // Call next() to move on to the actual route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired. Please log in again.' });
  }
}

module.exports = requireLogin;
