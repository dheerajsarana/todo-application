// =============================================
// categories.js — Categories page logic
// =============================================

const API_URL = 'http://localhost:8080/api';
let categories  = [];
let editingId   = null;
let renameModal = null;

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'index.html'; return; }
  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || '';
  renameModal = new bootstrap.Modal(document.getElementById('renameModal'));
  loadCategories();
});

async function loadCategories() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    categories = await res.json();
    renderCategories();
  } catch (e) {
    console.error('Could not load categories:', e);
  }
}

function renderCategories() {
  const el = document.getElementById('categoriesList');

  if (categories.length === 0) {
    el.innerHTML = '<p class="text-muted small mb-0">No custom categories yet. Add one above.</p>';
    return;
  }

  el.innerHTML = categories.map(function (cat) {
    return `
      <div class="item-row" id="cat-${cat.id}">
        <i class="bi bi-folder" style="color:var(--primary); font-size:1rem;"></i>
        <span class="item-name">${escapeHtml(cat.name)}</span>
        <button class="action-btn" onclick="openRename(${cat.id}, '${escapeAttr(cat.name)}')" title="Rename">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="action-btn delete" onclick="deleteCategory(${cat.id})" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

async function addCategory(event) {
  event.preventDefault();
  const input = document.getElementById('categoryInput');
  const name  = input.value.trim();
  if (!name) return;

  const errorEl = document.getElementById('addError');
  errorEl.classList.add('d-none');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/categories`, {
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
    loadCategories();
  } catch (e) {
    errorEl.textContent = 'Could not connect to server.';
    errorEl.classList.remove('d-none');
  }
}

function openRename(id, currentName) {
  editingId = id;
  document.getElementById('renameInput').value = currentName;
  renameModal.show();
  setTimeout(function () { document.getElementById('renameInput').focus(); }, 300);
}

async function saveRename() {
  const name = document.getElementById('renameInput').value.trim();
  if (!name || !editingId) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/categories/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      renameModal.hide();
      editingId = null;
      loadCategories();
    }
  } catch (e) {
    console.error('Could not rename category:', e);
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) loadCategories();
  } catch (e) {
    console.error('Could not delete category:', e);
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

function escapeAttr(text) {
  return String(text).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
