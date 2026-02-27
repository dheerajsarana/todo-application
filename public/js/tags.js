// =============================================
// tags.js — Tags page logic
// =============================================

const API_URL = 'http://localhost:8080/api';
let tags = [];

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'index.html'; return; }
  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || '';
  loadTags();
});

async function loadTags() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/tags`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    tags = await res.json();
    renderTags();
  } catch (e) {
    console.error('Could not load tags:', e);
  }
}

function renderTags() {
  const listEl  = document.getElementById('tagsList');
  const emptyEl = document.getElementById('tagsEmpty');

  if (tags.length === 0) {
    listEl.innerHTML = '';
    listEl.classList.add('d-none');
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');
  listEl.classList.remove('d-none');

  listEl.innerHTML = `
    <div class="d-flex flex-wrap gap-2 pt-1">
      ${tags.map(function (tag) {
        return `
          <span class="tag-chip" id="tag-${tag.id}">
            <i class="bi bi-tag-fill" style="font-size:0.7rem;"></i>
            ${escapeHtml(tag.name)}
            <button class="chip-delete" onclick="deleteTag(${tag.id})" title="Delete tag">
              <i class="bi bi-x"></i>
            </button>
          </span>
        `;
      }).join('')}
    </div>
  `;
}

async function addTag(event) {
  event.preventDefault();
  const input = document.getElementById('tagInput');
  const name  = input.value.trim();
  if (!name) return;

  const errorEl = document.getElementById('addError');
  errorEl.classList.add('d-none');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.message;
      errorEl.classList.remove('d-none');
      return;
    }
    input.value = '';
    loadTags();
  } catch (e) {
    errorEl.textContent = 'Could not connect to server.';
    errorEl.classList.remove('d-none');
  }
}

async function deleteTag(id) {
  if (!confirm('Delete this tag? It will be removed from all tasks.')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) loadTags();
  } catch (e) {
    console.error('Could not delete tag:', e);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}
