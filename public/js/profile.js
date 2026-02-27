// =============================================
// profile.js — Profile page logic
// =============================================

const API_URL = 'http://localhost:8080/api';

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'index.html'; return; }
  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || '';
  loadProfile();
});

async function loadProfile() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    const user = await res.json();

    document.getElementById('profileEmail').value = user.email;
    document.getElementById('displayNameInput').value = user.displayName || '';

    // Format createdAt date
    const date = new Date(user.createdAt);
    document.getElementById('profileCreatedAt').value = date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error('Could not load profile:', e);
  }
}

// ---- Save display name ----

async function saveDisplayName(event) {
  event.preventDefault();
  const displayName = document.getElementById('displayNameInput').value.trim();
  const msgEl       = document.getElementById('nameMsg');

  msgEl.className = 'alert d-none mb-3';

  if (!displayName) {
    showMsg(msgEl, 'danger', 'Please enter a display name.');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ displayName })
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(msgEl, 'success', 'Display name saved.');
    } else {
      showMsg(msgEl, 'danger', data.message || 'Could not save name.');
    }
  } catch (e) {
    showMsg(msgEl, 'danger', 'Could not connect to server.');
  }
}

// ---- Change password ----

async function changePassword(event) {
  event.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword     = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const msgEl           = document.getElementById('passwordMsg');

  msgEl.className = 'alert d-none mb-3';

  if (newPassword !== confirmPassword) {
    showMsg(msgEl, 'danger', 'New passwords do not match.');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(msgEl, 'success', 'Password updated successfully.');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value     = '';
      document.getElementById('confirmPassword').value = '';
    } else {
      showMsg(msgEl, 'danger', data.message || 'Could not update password.');
    }
  } catch (e) {
    showMsg(msgEl, 'danger', 'Could not connect to server.');
  }
}

// ---- Delete account ----

function showDeleteConfirm() {
  document.getElementById('deleteConfirm').classList.remove('d-none');
}

async function deleteAccount() {
  const password = document.getElementById('deletePassword').value;
  const msgEl    = document.getElementById('deleteMsg');

  msgEl.classList.add('d-none');

  if (!password) {
    msgEl.textContent = 'Please enter your password.';
    msgEl.classList.remove('d-none');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      window.location.href = 'index.html';
    } else {
      const data = await res.json();
      msgEl.textContent = data.message || 'Could not delete account.';
      msgEl.classList.remove('d-none');
    }
  } catch (e) {
    msgEl.textContent = 'Could not connect to server.';
    msgEl.classList.remove('d-none');
  }
}

// ---- Helpers ----

function showMsg(el, type, text) {
  el.textContent = text;
  el.className   = `alert alert-${type} mb-3`;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}
