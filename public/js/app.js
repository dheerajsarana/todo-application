// =============================================
// app.js — Main todo app logic
// =============================================

const API_URL = 'http://localhost:8080/api';

// Master list of all todos fetched from the server
let todos = [];

// Current filter + sort state
let statusFilter   = 'all';     // 'all' | 'active' | 'completed'
let categoryFilter = 'all';     // 'all' | 'General' | 'Work' | ...
let priorityFilter = 'all';     // 'all' | 'high' | 'medium' | 'low'
let sortBy         = 'newest';  // 'newest' | 'oldest' | 'priority' | 'due_date'


// ---- Page Load ----

window.addEventListener('load', function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('userEmail').textContent = localStorage.getItem('userEmail');
  loadTodos();
});


// ---- Load todos from server ----

async function loadTodos() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/todos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) { logout(); return; }

    todos = await response.json();
    applyFiltersAndSort();

  } catch (error) {
    showError('Could not load tasks. Is the server running?');
  }
}


// ---- Filter + Sort + Render (all in one) ----

function applyFiltersAndSort() {
  // Read current filter/sort selections from the page
  categoryFilter = document.getElementById('filterCategory').value;
  priorityFilter = document.getElementById('filterPriority').value;
  sortBy         = document.getElementById('sortBy').value;

  // Step 1: filter the todos array
  let filtered = todos.filter(function (todo) {

    // Status filter
    if (statusFilter === 'active'    &&  todo.completed) return false;
    if (statusFilter === 'completed' && !todo.completed) return false;

    // Category filter
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;

    return true;
  });

  // Step 2: sort the filtered list
  filtered = sortTodos(filtered);

  // Step 3: render the result
  renderTodos(filtered);
}


// ---- Sort Todos ----

function sortTodos(list) {
  // Priority order: high = 0, medium = 1, low = 2 (lower number = sorted first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return list.slice().sort(function (a, b) {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'priority') {
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    }
    if (sortBy === 'due_date') {
      // Todos with no due date go to the bottom
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return 0;
  });
}


// ---- Status Tab Filter ----

function setStatusFilter(status) {
  statusFilter = status;

  // Update active tab style
  document.querySelectorAll('.status-tab').forEach(function (btn) {
    btn.classList.remove('active');
  });
  document.getElementById('tab-' + status).classList.add('active');

  applyFiltersAndSort();
}


// ---- Render Todos ----

function renderTodos(list) {
  const todoList   = document.getElementById('todoList');
  const emptyState = document.getElementById('emptyState');

  // Update stats using the full todos array (not filtered)
  const totalCount  = todos.length;
  const doneCount   = todos.filter(function (t) { return t.completed; }).length;
  const activeCount = totalCount - doneCount;

  document.getElementById('statTotal').textContent  = totalCount;
  document.getElementById('statActive').textContent = activeCount;
  document.getElementById('statDone').textContent   = doneCount;
  document.getElementById('pageSubtitle').textContent =
    `${doneCount} of ${totalCount} tasks completed`;

  // Clear current list
  todoList.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');

  list.forEach(function (todo) {
    todoList.appendChild(createTodoCard(todo));
  });
}


// ---- Create Todo Card ----

function createTodoCard(todo) {
  const card = document.createElement('div');
  card.className = 'todo-card' + (todo.completed ? ' completed' : '');
  card.id = 'todo-' + todo.id;

  // Due date badge
  let dueBadgeHTML = '';
  if (todo.due_date) {
    const today     = new Date().toISOString().split('T')[0];
    const isOverdue = todo.due_date < today && !todo.completed;
    const cls       = isOverdue ? 'due-badge overdue' : 'due-badge';
    const prefix    = isOverdue ? 'Overdue · ' : '';
    dueBadgeHTML = `<span class="${cls}">${prefix}${formatDate(todo.due_date)}</span>`;
  }

  // Category emoji map
  const categoryEmoji = {
    General: '📋', Work: '💼', Personal: '🏠', Shopping: '🛒', Health: '💪'
  };
  const emoji = categoryEmoji[todo.category] || '📋';

  card.innerHTML = `
    <!-- Coloured left bar showing priority -->
    <div class="priority-bar ${todo.priority || 'medium'}"></div>

    <div class="todo-inner">

      <!-- Checkbox -->
      <input
        type="checkbox"
        class="todo-checkbox"
        ${todo.completed ? 'checked' : ''}
        onchange="toggleComplete(${todo.id}, this.checked)"
        title="Mark complete"
      >

      <!-- Text + meta -->
      <div class="todo-body">
        <div
          class="todo-text"
          id="text-${todo.id}"
          ondblclick="startEditing(${todo.id})"
          title="Double-click to edit"
        >${escapeHtml(todo.text)}</div>
        <div class="todo-meta">
          <span class="category-tag">${emoji} ${todo.category || 'General'}</span>
          <span class="priority-badge ${todo.priority || 'medium'}">${todo.priority || 'medium'}</span>
          ${dueBadgeHTML}
        </div>
      </div>

      <!-- Actions -->
      <div class="todo-actions">
        <button class="action-btn"        onclick="startEditing(${todo.id})" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="action-btn delete" onclick="deleteTodo(${todo.id})"  title="Delete"><i class="bi bi-trash"></i></button>
      </div>

    </div>
  `;

  return card;
}


// ---- Add Todo ----

async function handleAddTodo(event) {
  event.preventDefault();

  const textInput     = document.getElementById('newTodoText');
  const priorityInput = document.getElementById('newTodoPriority');
  const categoryInput = document.getElementById('newTodoCategory');
  const dueDateInput  = document.getElementById('newTodoDueDate');
  const token         = localStorage.getItem('token');

  const text     = textInput.value.trim();
  const priority = priorityInput.value;
  const category = categoryInput.value;
  const dueDate  = dueDateInput.value;

  if (!text) return;

  const body = { text, priority, category };
  if (dueDate) body.due_date = dueDate;

  try {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      textInput.value    = '';
      dueDateInput.value = '';
      loadTodos();
    } else {
      const data = await response.json();
      showError(data.message || 'Could not add task.');
    }
  } catch (error) {
    showError('Could not connect to the server.');
  }
}


// ---- Toggle Complete ----

async function toggleComplete(todoId, isChecked) {
  const token = localStorage.getItem('token');
  const todo  = todos.find(function (t) { return t.id === todoId; });
  if (!todo) return;

  try {
    const response = await fetch(`${API_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text:      todo.text,
        due_date:  todo.due_date,
        priority:  todo.priority,
        category:  todo.category,
        completed: isChecked
      })
    });

    if (response.ok) loadTodos();

  } catch (error) {
    showError('Could not update task.');
  }
}


// ---- Inline Editing ----

function startEditing(todoId) {
  const todo = todos.find(function (t) { return t.id === todoId; });
  if (!todo) return;

  const textEl = document.getElementById('text-' + todoId);

  textEl.innerHTML = `
    <input
      type="text"
      class="edit-input"
      id="edit-input-${todoId}"
      value="${escapeHtml(todo.text)}"
    >
  `;

  const input = document.getElementById('edit-input-' + todoId);
  input.focus();
  input.select();

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  saveEdit(todoId);
    if (e.key === 'Escape') applyFiltersAndSort(); // cancel
  });

  input.addEventListener('blur', function () {
    saveEdit(todoId);
  });
}

async function saveEdit(todoId) {
  const input = document.getElementById('edit-input-' + todoId);
  if (!input) return;

  const newText = input.value.trim();
  if (!newText) { applyFiltersAndSort(); return; }

  const todo  = todos.find(function (t) { return t.id === todoId; });
  if (!todo) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text:      newText,
        due_date:  todo.due_date,
        priority:  todo.priority,
        category:  todo.category,
        completed: todo.completed
      })
    });

    if (response.ok) loadTodos();

  } catch (error) {
    showError('Could not save changes.');
  }
}


// ---- Delete Todo ----

async function deleteTodo(todoId) {
  if (!confirm('Delete this task?')) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/todos/${todoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) loadTodos();

  } catch (error) {
    showError('Could not delete task.');
  }
}


// ---- Logout ----

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}


// ---- Helpers ----

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showError(message) {
  const el = document.getElementById('errorMessage');
  el.textContent = message;
  el.classList.remove('d-none');
  setTimeout(function () { el.classList.add('d-none'); }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
