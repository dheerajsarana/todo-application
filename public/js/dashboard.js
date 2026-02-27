// =============================================
// dashboard.js — Dashboard page logic
// =============================================

const API_URL = 'http://localhost:8080/api';

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'index.html'; return; }
  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || '';
  loadDashboard();
});

async function loadDashboard() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    renderDashboard(data);
  } catch (e) {
    console.error('Could not load dashboard:', e);
  }
}

function renderDashboard(data) {
  document.getElementById('statTotal').textContent     = data.total;
  document.getElementById('statPending').textContent   = data.pending;
  document.getElementById('statCompleted').textContent = data.completed;
  document.getElementById('statOverdue').textContent   = data.overdue;
  document.getElementById('statToday').textContent     = data.dueToday;

  const rate = data.completionRate;
  document.getElementById('completionBar').style.width   = rate + '%';
  document.getElementById('completionRate').textContent  = rate + '%';

  // Priority breakdown
  const priorityColors = { high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };
  const priorityEl = document.getElementById('priorityBreakdown');
  if (data.byPriority.length === 0) {
    priorityEl.innerHTML = '<p class="text-muted small mb-0">No tasks yet.</p>';
  } else {
    priorityEl.innerHTML = data.byPriority.map(function (row) {
      const pct   = data.total > 0 ? Math.round((row.count / data.total) * 100) : 0;
      const color = priorityColors[row.priority] || 'var(--primary)';
      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="breakdown-label">${capitalize(row.priority)}</span>
            <span class="breakdown-count">${row.count}</span>
          </div>
          <div class="progress" style="height:6px; border-radius:20px;">
            <div class="progress-bar" style="width:${pct}%; background:${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Category breakdown
  const categoryEmoji = { General: '📋', Work: '💼', Personal: '🏠', Shopping: '🛒', Health: '💪' };
  const categoryEl = document.getElementById('categoryBreakdown');
  if (data.byCategory.length === 0) {
    categoryEl.innerHTML = '<p class="text-muted small mb-0">No tasks yet.</p>';
  } else {
    categoryEl.innerHTML = data.byCategory.map(function (row) {
      const pct   = data.total > 0 ? Math.round((row.count / data.total) * 100) : 0;
      const emoji = categoryEmoji[row.category] || '📋';
      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="breakdown-label">${emoji} ${escapeHtml(row.category)}</span>
            <span class="breakdown-count">${row.count}</span>
          </div>
          <div class="progress" style="height:6px; border-radius:20px;">
            <div class="progress-bar bg-primary" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Recent todos
  const recentEl = document.getElementById('recentTodos');
  if (data.recentTodos.length === 0) {
    recentEl.innerHTML = '<p class="text-muted small mb-0">No tasks yet.</p>';
    return;
  }

  const priorityDotColor = { high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };
  recentEl.innerHTML = data.recentTodos.map(function (t) {
    const doneStyle = t.completed ? 'style="text-decoration:line-through; color:var(--text-muted);"' : '';
    const dotColor  = priorityDotColor[t.priority] || 'var(--medium)';
    return `
      <div class="recent-todo-row">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor}; flex-shrink:0;"></span>
        <span ${doneStyle}>${escapeHtml(t.text)}</span>
        <span class="ms-auto" style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">${t.category || 'General'}</span>
      </div>
    `;
  }).join('');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}
