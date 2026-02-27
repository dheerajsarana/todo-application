// =============================================
// reminders.js — Reminders page logic
// =============================================

const API_URL = 'http://localhost:8080/api';
let allReminders = [];
let editingId    = null;
let editModal    = null;

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'index.html'; return; }
  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || '';

  editModal = new bootstrap.Modal(document.getElementById('editModal'));

  // Default the new reminder time to 1 hour from now
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  document.getElementById('reminderTime').value = toLocalDatetimeInput(soon);

  checkNotifBanner();
  loadTodosForSelect();
  loadReminders();
});

// ---- Notification permission banner ----

function checkNotifBanner() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const banner = document.getElementById('notifBanner');
    banner.classList.remove('d-none');
    banner.classList.add('alert-warning');
  }
}

async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  if (permission === 'granted' || permission === 'denied') {
    document.getElementById('notifBanner').classList.add('d-none');
  }
}

// ---- Load todos for the linked-task dropdown ----

async function loadTodosForSelect() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/todos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const todos = await res.json();
    const select = document.getElementById('reminderTodo');
    todos
      .filter(function (t) { return !t.completed; })
      .forEach(function (t) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.text.length > 60 ? t.text.slice(0, 60) + '…' : t.text;
        select.appendChild(opt);
      });
  } catch (e) { /* silently ignore */ }
}

// ---- Load all reminders ----

async function loadReminders() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/reminders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    allReminders = await res.json();
    renderReminders();
  } catch (e) {
    console.error('Could not load reminders:', e);
  }
}

// ---- Render upcoming + past lists ----

function renderReminders() {
  const now      = new Date();
  const upcoming = allReminders.filter(function (r) { return !r.dismissed && new Date(r.remindAt) > now; });
  const past     = allReminders.filter(function (r) { return r.dismissed  || new Date(r.remindAt) <= now; });

  renderList('upcomingList', 'upcomingEmpty', upcoming, false);
  renderList('pastList',     'pastEmpty',     past,     true);
}

function renderList(listId, emptyId, items, isPast) {
  const listEl  = document.getElementById(listId);
  const emptyEl = document.getElementById(emptyId);

  if (items.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');

  listEl.innerHTML = items.map(function (r) {
    const dt        = new Date(r.remindAt);
    const isOverdue = !r.dismissed && dt <= new Date();
    const dateStr   = dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const linkedTask = r.todoText
      ? `<span class="reminder-task-link"><i class="bi bi-check2-square"></i> ${escapeHtml(r.todoText)}</span>`
      : '';

    const statusBadge = r.dismissed
      ? `<span class="reminder-badge dismissed">Dismissed</span>`
      : isOverdue
        ? `<span class="reminder-badge overdue">Due</span>`
        : `<span class="reminder-badge upcoming">Upcoming</span>`;

    const actions = isPast
      ? `<button class="action-btn delete" onclick="deleteReminder(${r.id})" title="Delete"><i class="bi bi-trash"></i></button>`
      : `
          <button class="action-btn" onclick="openEdit(${r.id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="action-btn delete" onclick="deleteReminder(${r.id})" title="Delete"><i class="bi bi-trash"></i></button>
        `;

    return `
      <div class="reminder-row${isOverdue && !r.dismissed ? ' reminder-overdue' : ''}" id="reminder-${r.id}">
        <div class="reminder-icon">
          <i class="bi bi-bell${r.dismissed ? '-slash' : isOverdue ? '-fill' : ''}"></i>
        </div>
        <div class="reminder-body">
          <div class="reminder-title">${escapeHtml(r.title)}</div>
          <div class="reminder-meta">
            <span class="reminder-time"><i class="bi bi-clock"></i> ${dateStr}</span>
            ${linkedTask}
            ${statusBadge}
          </div>
        </div>
        <div class="reminder-actions">
          ${actions}
        </div>
      </div>
    `;
  }).join('');
}

// ---- Add reminder ----

async function addReminder(event) {
  event.preventDefault();
  const title    = document.getElementById('reminderTitle').value.trim();
  const remindAt = document.getElementById('reminderTime').value;
  const todoId   = document.getElementById('reminderTodo').value || null;
  const errorEl  = document.getElementById('addError');
  errorEl.classList.add('d-none');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, remindAt, todoId })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.message;
      errorEl.classList.remove('d-none');
      return;
    }
    document.getElementById('reminderTitle').value = '';
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    document.getElementById('reminderTime').value = toLocalDatetimeInput(soon);
    document.getElementById('reminderTodo').value = '';
    loadReminders();
  } catch (e) {
    errorEl.textContent = 'Could not connect to server.';
    errorEl.classList.remove('d-none');
  }
}

// ---- Edit reminder ----

function openEdit(id) {
  const r = allReminders.find(function (x) { return x.id === id; });
  if (!r) return;
  editingId = id;
  document.getElementById('editTitle').value = r.title;
  document.getElementById('editTime').value  = toLocalDatetimeInput(new Date(r.remindAt));
  editModal.show();
}

async function saveEdit() {
  if (!editingId) return;
  const title    = document.getElementById('editTitle').value.trim();
  const remindAt = document.getElementById('editTime').value;
  if (!title || !remindAt) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/reminders/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, remindAt })
    });
    if (res.ok) {
      editModal.hide();
      editingId = null;
      loadReminders();
    }
  } catch (e) {
    console.error('Could not update reminder:', e);
  }
}

// ---- Delete reminder ----

async function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/reminders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) loadReminders();
  } catch (e) {
    console.error('Could not delete reminder:', e);
  }
}

// ---- Helpers ----

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}

function toLocalDatetimeInput(date) {
  // Returns a string like "2026-02-27T14:30" for datetime-local inputs
  const pad = function (n) { return String(n).padStart(2, '0'); };
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}
