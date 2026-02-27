// =============================================
// comments.js — Comments modal logic
// (included in app.html)
// =============================================

const COMMENTS_API = 'http://localhost:8080/api/comments';

let currentTodoId    = null;
let commentsModal    = null;
let editingCommentId = null;

// Called after Bootstrap is loaded
window.addEventListener('load', function () {
  commentsModal = new bootstrap.Modal(document.getElementById('commentsModal'));
});

// ---- Open comments for a todo ----

function openComments(todoId, todoText) {
  currentTodoId    = todoId;
  editingCommentId = null;

  document.getElementById('commentsTodoTitle').textContent = todoText ? ' — ' + todoText : '';
  document.getElementById('commentInput').value = '';
  document.getElementById('commentsList').innerHTML = '<p class="text-muted small mb-0">Loading…</p>';

  commentsModal.show();
  loadComments(todoId);
}

// ---- Load comments ----

async function loadComments(todoId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${COMMENTS_API}/todo/${todoId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { return; }
    const comments = await res.json();
    renderComments(comments);
  } catch (e) {
    document.getElementById('commentsList').innerHTML = '<p class="text-muted small">Could not load notes.</p>';
  }
}

// ---- Render comments ----

function renderComments(comments) {
  const el = document.getElementById('commentsList');

  if (comments.length === 0) {
    el.innerHTML = '<p class="text-muted small mb-0">No notes yet. Add one below.</p>';
    return;
  }

  el.innerHTML = comments.map(function (c) {
    const date = new Date(c.createdAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="comment-item" id="comment-${c.id}">
        <div class="d-flex align-items-start gap-2">
          <div class="flex-grow-1">
            <div class="comment-text" id="comment-text-${c.id}">${escapeHtml(c.text)}</div>
            <div class="comment-date">${date}</div>
          </div>
          <div class="comment-actions">
            <button class="action-btn" onclick="startEditComment(${c.id}, '${escapeAttr(c.text)}')" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="action-btn delete" onclick="deleteComment(${c.id})" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Add comment ----

async function addComment(event) {
  event.preventDefault();
  const input = document.getElementById('commentInput');
  const text  = input.value.trim();
  if (!text || !currentTodoId) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${COMMENTS_API}/todo/${currentTodoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      input.value = '';
      loadComments(currentTodoId);
    }
  } catch (e) {
    console.error('Could not add comment:', e);
  }
}

// ---- Edit comment ----

function startEditComment(id, currentText) {
  editingCommentId = id;
  const textEl = document.getElementById('comment-text-' + id);
  textEl.innerHTML = `
    <input
      type="text"
      class="form-control form-control-sm"
      id="comment-edit-input-${id}"
      value="${escapeAttr(currentText)}"
    >
  `;
  const input = document.getElementById('comment-edit-input-' + id);
  input.focus();
  input.select();

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  saveEditComment(id);
    if (e.key === 'Escape') loadComments(currentTodoId);
  });
  input.addEventListener('blur', function () {
    saveEditComment(id);
  });
}

async function saveEditComment(id) {
  const input = document.getElementById('comment-edit-input-' + id);
  if (!input) return;

  const text = input.value.trim();
  if (!text) { loadComments(currentTodoId); return; }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${COMMENTS_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    if (res.ok) loadComments(currentTodoId);
  } catch (e) {
    console.error('Could not update comment:', e);
  }
}

// ---- Delete comment ----

async function deleteComment(id) {
  if (!confirm('Delete this note?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${COMMENTS_API}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) loadComments(currentTodoId);
  } catch (e) {
    console.error('Could not delete comment:', e);
  }
}

// ---- Helpers ----

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

function escapeAttr(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
