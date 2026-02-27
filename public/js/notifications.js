// =============================================
// notifications.js — Background reminder polling
//
// Include this script on every page.
// It polls /api/reminders/due every minute and
// fires browser Notifications for due reminders.
// =============================================

const NOTIF_API = 'http://localhost:8080/api/reminders/due';
const NOTIF_DISMISS_API = 'http://localhost:8080/api/reminders';

// Check for due reminders immediately, then every 60 seconds
window.addEventListener('load', function () {
  checkDueReminders();
  setInterval(checkDueReminders, 60 * 1000);
});

async function checkDueReminders() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(NOTIF_API, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const due = await res.json();
    due.forEach(function (reminder) {
      showNotification(reminder);
      dismissReminder(reminder.id, token);
    });
  } catch (e) {
    // Silently ignore — server may not be ready yet
  }
}

function showNotification(reminder) {
  const title = reminder.title;
  const body  = reminder.todoText
    ? `Task: ${reminder.todoText}`
    : 'Your reminder is due.';

  // Try browser Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`🔔 ${title}`, {
        body: body,
        icon: '/favicon.ico',
        tag: `reminder-${reminder.id}`,   // prevents duplicates
      });
    } catch (e) { /* ignore in environments where Notification constructor fails */ }
  }

  // Also show an in-page toast as a fallback
  showToast(title, body);
}

async function dismissReminder(id, token) {
  try {
    await fetch(`${NOTIF_DISMISS_API}/${id}/dismiss`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) { /* ignore */ }
}

// ---- In-page toast notification ----

function showToast(title, body) {
  // Create a toast container if it doesn't exist
  let container = document.getElementById('notif-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notif-toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 320px;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #1D2433;
    color: #fff;
    border-radius: 10px;
    padding: 14px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: slideUp 0.3s ease;
  `;
  toast.innerHTML = `
    <span style="font-size:1.1rem; flex-shrink:0;">🔔</span>
    <div style="flex:1; min-width:0;">
      <div style="font-weight:700; font-size:0.875rem; margin-bottom:2px;">${escapeToastHtml(title)}</div>
      <div style="font-size:0.8125rem; opacity:0.75;">${escapeToastHtml(body)}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;opacity:0.6;cursor:pointer;padding:0;font-size:14px;flex-shrink:0;">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 8 seconds
  setTimeout(function () {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () { toast.remove(); }, 300);
    }
  }, 8000);
}

function escapeToastHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

// Inject the slide-up animation style once
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();
