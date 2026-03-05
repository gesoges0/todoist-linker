const API_BASE = 'https://api.todoist.com/api/v1';

let allTasks = [];
let allProjects = [];
let currentView = 'inbox'; // 'inbox' | 'today' | 'all' | project_id

// ── Init ──────────────────────────────────────────────

async function getApiToken() {
  const result = await chrome.storage.local.get(['todoistApiToken']);
  return result.todoistApiToken;
}

async function fetchAll(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

async function init() {
  const token = await getApiToken();
  if (!token) {
    showState('🔑', 'APIトークンが設定されていません。拡張機能のポップアップから設定してください。');
    return;
  }

  try {
    [allTasks, allProjects] = await Promise.all([
      fetchAll('/tasks', token),
      fetchAll('/projects', token),
    ]);
  } catch (e) {
    showState('⚠️', 'データの取得に失敗しました。APIトークンを確認してください。');
    console.error(e);
    return;
  }

  renderProjectNav();
  updateBadges();
  renderView();
}

// ── Navigation ────────────────────────────────────────

function renderProjectNav() {
  const nav = document.getElementById('nav-projects');
  nav.innerHTML = '';

  const colors = ['#db4035','#ff8c00','#fad000','#afb83b','#7ecc49','#299438',
                  '#6accbc','#158fad','#14aaf5','#96c3eb','#4073ff','#884dff',
                  '#af38eb','#eb96eb','#e05194','#ff8d85','#808080','#b8b8b8'];

  allProjects.forEach((proj, i) => {
    const count = allTasks.filter(t => t.project_id === proj.id).length;
    const dot = document.createElement('div');
    dot.className = 'nav-item';
    dot.dataset.view = proj.id;
    dot.innerHTML = `
      <span class="project-dot" style="background:${colors[i % colors.length]}"></span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(proj.name)}</span>
      <span class="nav-badge">${count || ''}</span>
    `;
    nav.appendChild(dot);
  });

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });
}

function updateBadges() {
  const today = todayStr();
  document.getElementById('badge-inbox').textContent = inboxTasks().length || '';
  document.getElementById('badge-today').textContent = todayTasks(today).length || '';
  document.getElementById('badge-all').textContent = allTasks.length || '';
}

function switchView(view) {
  currentView = view;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  const titles = { inbox: '受信トレイ', today: '今日', all: 'すべてのタスク' };
  if (titles[view]) {
    document.getElementById('view-title').textContent = titles[view];
  } else {
    const proj = allProjects.find(p => p.id === view);
    document.getElementById('view-title').textContent = proj ? proj.name : '';
  }

  renderView();
}

// ── Render ────────────────────────────────────────────

function getViewTasks() {
  const today = todayStr();
  if (currentView === 'inbox') return inboxTasks();
  if (currentView === 'today') return todayTasks(today);
  if (currentView === 'all')   return [...allTasks];
  return allTasks.filter(t => t.project_id === currentView);
}

function renderView() {
  const tasks = getViewTasks();
  const container = document.getElementById('task-list-container');

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="state-container">
        <div class="state-icon">🎉</div>
        <div class="state-text">タスクはありません</div>
      </div>`;
    return;
  }

  const today = todayStr();
  container.innerHTML = tasks.map(task => renderTask(task, today)).join('');

  container.querySelectorAll('.task-checkbox').forEach(el => {
    el.addEventListener('click', () => completeTask(el.dataset.id));
  });
}

function renderTask(task, today) {
  const p = task.priority ?? 1;
  const due = task.due?.date ?? null;
  const dueHtml = due ? renderDue(due, today) : '';
  const project = allProjects.find(pr => pr.id === task.project_id);
  const projectHtml = project
    ? `<span class="task-project">· ${escapeHtml(project.name)}</span>`
    : '';
  const descHtml = task.description
    ? `<div class="task-description">${escapeHtml(task.description)}</div>`
    : '';

  return `
    <div class="task-item" data-id="${task.id}">
      <div class="task-checkbox priority-${p}" data-id="${task.id}" title="完了にする"></div>
      <div class="task-body">
        <div class="task-content">${escapeHtml(task.content)}</div>
        ${descHtml}
        <div class="task-meta">
          ${dueHtml}
          ${projectHtml}
        </div>
      </div>
    </div>`;
}

function renderDue(dateStr, today) {
  let cls = 'future';
  let label = formatDate(dateStr);
  if (dateStr < today) { cls = 'overdue'; label = `⚠ ${label}`; }
  else if (dateStr === today) { cls = 'today'; label = `今日`; }
  return `<span class="task-due ${cls}">📅 ${label}</span>`;
}

// ── Complete task ──────────────────────────────────────

async function completeTask(taskId) {
  const token = await getApiToken();
  const checkbox = document.querySelector(`.task-checkbox[data-id="${taskId}"]`);
  if (checkbox) checkbox.classList.add('completing');

  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(res.status);

    allTasks = allTasks.filter(t => t.id !== taskId);
    updateBadges();
    renderProjectNav();
    renderView();
    showToast('タスクを完了しました');
  } catch (e) {
    if (checkbox) checkbox.classList.remove('completing');
    showToast('完了処理に失敗しました');
    console.error(e);
  }
}

// ── Helpers ───────────────────────────────────────────

function inboxTasks() {
  const inboxProject = allProjects.find(p => p.is_inbox_project);
  return allTasks.filter(t =>
    !t.project_id || (inboxProject && t.project_id === inboxProject.id)
  );
}

function todayTasks(today) {
  return allTasks.filter(t => t.due?.date === today);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function showState(icon, text) {
  document.getElementById('task-list-container').innerHTML = `
    <div class="state-container">
      <div class="state-icon">${icon}</div>
      <div class="state-text">${text}</div>
    </div>`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Events ────────────────────────────────────────────

document.querySelectorAll('#nav-fixed .nav-item').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

init();
