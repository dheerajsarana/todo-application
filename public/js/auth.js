// =============================================
// auth.js - Login and Sign Up logic for index.html
// =============================================

// The URL where our Express server is running
const API_URL = 'http://localhost:8080/api';


// ---- On Page Load ----

// When the page loads, check if the user is already logged in.
// If they are, skip the login page and go straight to the app.
window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'app.html';
  }
});


// ---- Tab Switching ----

// Show either the login or signup form based on which tab was clicked
function showTab(tabName) {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab   = document.getElementById('loginTab');
  const signupTab  = document.getElementById('signupTab');

  // Hide any existing messages when switching tabs
  hideMessages();

  if (tabName === 'login') {
    // Show login, hide signup
    loginForm.classList.remove('d-none');
    signupForm.classList.add('d-none');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');

  } else {
    // Show signup, hide login
    signupForm.classList.remove('d-none');
    loginForm.classList.add('d-none');
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
  }
}


// ---- Login ----

// Runs when the user submits the login form
async function handleLogin(event) {
  // Stop the form from refreshing the page (default browser behavior)
  event.preventDefault();

  // Read values from the form fields
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const button   = document.getElementById('loginButton');

  // Show a loading state while we wait for the server
  button.disabled    = true;
  button.textContent = 'Logging in...';
  hideMessages();

  try {
    // Send a POST request to the server with email and password
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Read the JSON response from the server
    const data = await response.json();

    if (response.ok) {
      // Login was successful
      // Save the token and email to localStorage so we stay logged in
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email);

      // Go to the main app page
      window.location.href = 'app.html';

    } else {
      // Server returned an error (e.g. wrong password)
      showError(data.message || 'Login failed. Please try again.');
    }

  } catch (error) {
    // This happens if the server is not running
    showError('Could not connect to the server. Make sure it is running.');
  }

  // Re-enable the button
  button.disabled    = false;
  button.textContent = 'Login';
}


// ---- Sign Up ----

// Runs when the user submits the sign up form
async function handleSignup(event) {
  event.preventDefault();

  const email    = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const button   = document.getElementById('signupButton');

  button.disabled    = true;
  button.textContent = 'Creating account...';
  hideMessages();

  try {
    // Send a POST request to create a new account
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Account created — show a success message and switch to login
      showSuccess('Account created! You can now log in.');
      showTab('login');

      // Pre-fill the email on the login form for convenience
      document.getElementById('loginEmail').value = email;

    } else {
      showError(data.message || 'Sign up failed. Please try again.');
    }

  } catch (error) {
    showError('Could not connect to the server. Make sure it is running.');
  }

  button.disabled    = false;
  button.textContent = 'Create Account';
}


// ---- Helper Functions ----

// Display a red error message on the page
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

// Display a green success message on the page
function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.classList.remove('d-none');
}

// Hide both message boxes
function hideMessages() {
  document.getElementById('errorMessage').classList.add('d-none');
  document.getElementById('successMessage').classList.add('d-none');
}
