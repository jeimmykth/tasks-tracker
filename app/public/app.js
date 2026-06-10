// @ts-check
'use strict';

const API = '/api/tasks';
let currentFilter = 'all';

// ── Helpers ────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showToast(msg, isError = false) {
  const el = $('toast');
  el.textContent = msg;
  el.style.borderColor = isError ? '#ef4444' : '#22c55e';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function statusLabel(s) {
  return { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada', cancelled: 'Cancelada' }[s] ?? s;
}

// ── API calls ──────────────────────────────────────────────
async function fetchTasks() {
  const res = await fetch(API);
  return res.json();
}

async function fetchMetrics() {
  const res = await fetch(`${API}/metrics`);
  return res.json();
}

async function createTask(title, description) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function deleteTask(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('No se pudo eliminar la tarea');
}

// ── Render ─────────────────────────────────────────────────
function renderMetrics(m) {
  $('m-total').textContent     = m.total;
  $('m-pending').textContent   = m.byStatus.pending;
  $('m-inprogress').textContent= m.byStatus.in_progress;
  $('m-completed').textContent = m.byStatus.completed;
  $('m-rate').textContent      = `${m.completionRate}%`;
  $('m-avg').textContent       = m.avgCompletionTimeHuman;
  $('m-today').textContent     = m.completedToday;
  $('m-week').textContent      = m.completedThisWeek;
}

function renderTasks(tasks) {
  const list = $('task-list');
  const filtered = currentFilter === 'all' ? tasks : tasks.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty">No hay tareas en esta categoría.</p>';
    return;
  }

  list.innerHTML = filtered.map(task => `
    <div class="task-card" data-id="${task.id}">
      <div class="task-body">
        <div class="task-title">
          <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
          ${escHtml(task.title)}
        </div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span>Creada: ${formatDate(task.created_at)}</span>
          ${task.completed_at ? `<span>Completada: ${formatDate(task.completed_at)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <select class="status-select" data-id="${task.id}">
          <option value="pending"     ${task.status==='pending'?'selected':''}>Pendiente</option>
          <option value="in_progress" ${task.status==='in_progress'?'selected':''}>En progreso</option>
          <option value="completed"   ${task.status==='completed'?'selected':''}>Completada</option>
          <option value="cancelled"   ${task.status==='cancelled'?'selected':''}>Cancelada</option>
        </select>
        <button class="btn btn-danger" data-delete="${task.id}">✕</button>
      </div>
    </div>
  `).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Refresh ────────────────────────────────────────────────
async function refresh() {
  const [tasks, metrics] = await Promise.all([fetchTasks(), fetchMetrics()]);
  renderMetrics(metrics);
  renderTasks(tasks);
}

// ── Events ─────────────────────────────────────────────────
$('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = /** @type {HTMLFormElement} */ (e.target);
  const title = form.elements.namedItem('title').value.trim();
  const description = form.elements.namedItem('description').value.trim();
  try {
    await createTask(title, description);
    form.reset();
    showToast('Tarea creada');
    await refresh();
  } catch (err) {
    showToast(err.message, true);
  }
});

$('task-list').addEventListener('change', async (e) => {
  const sel = /** @type {HTMLSelectElement|null} */ (e.target.closest('.status-select'));
  if (!sel) return;
  try {
    await updateStatus(sel.dataset.id, sel.value);
    showToast('Estado actualizado');
    await refresh();
  } catch (err) {
    showToast(err.message, true);
  }
});

$('task-list').addEventListener('click', async (e) => {
  const btn = /** @type {HTMLElement|null} */ (e.target.closest('[data-delete]'));
  if (!btn) return;
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    await deleteTask(btn.dataset.delete);
    showToast('Tarea eliminada');
    await refresh();
  } catch (err) {
    showToast(err.message, true);
  }
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    refresh();
  });
});

// ── Init ───────────────────────────────────────────────────
$('header-date').textContent = new Date().toLocaleDateString('es-MX', { dateStyle: 'full' });
refresh();
