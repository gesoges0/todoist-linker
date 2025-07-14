document.addEventListener('DOMContentLoaded', async function() {
  const apiToken = await getApiToken();
  
  if (!apiToken) {
    showSetup();
  } else {
    await showTaskForm();
    await loadProjects();
  }
  
  setupEventListeners();
});

async function getApiToken() {
  const result = await chrome.storage.local.get(['todoistApiToken']);
  return result.todoistApiToken;
}

async function saveApiToken(token) {
  await chrome.storage.local.set({ todoistApiToken: token });
}

function showSetup() {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('taskForm').style.display = 'none';
}

function showTaskForm() {
  document.getElementById('setup').style.display = 'none';
  document.getElementById('taskForm').style.display = 'block';
}

function setupEventListeners() {
  // APIトークン保存
  document.getElementById('saveToken').addEventListener('click', async function() {
    const token = document.getElementById('apiToken').value.trim();
    if (token) {
      await saveApiToken(token);
      showStatus('APIトークンが保存されました', 'success');
      setTimeout(() => {
        showTaskForm();
        loadProjects();
      }, 1000);
    } else {
      showStatus('APIトークンを入力してください', 'error');
    }
  });

  // 優先度選択
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // タスク追加
  document.getElementById('addTask').addEventListener('click', addTask);

  // フォームクリア
  document.getElementById('clearForm').addEventListener('click', clearForm);

  // Enterキーでタスク追加
  document.getElementById('taskTitle').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });
}

async function loadProjects() {
  try {
    const token = await getApiToken();
    const response = await fetch('https://api.todoist.com/rest/v2/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const projects = await response.json();
      const projectSelect = document.getElementById('projectSelect');
      
      // 既存のオプションをクリア（受信トレイ以外）
      projectSelect.innerHTML = '<option value="">受信トレイ</option>';
      
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('プロジェクトの読み込みに失敗しました:', error);
  }
}

async function addTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) {
    showStatus('タスク名を入力してください', 'error');
    return;
  }

  const description = document.getElementById('taskDescription').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const priority = document.querySelector('.priority-btn.active').dataset.priority;
  const projectId = document.getElementById('projectSelect').value;

  try {
    const token = await getApiToken();
    const taskData = {
      content: title,
      priority: parseInt(priority)
    };

    if (description) {
      taskData.description = description;
    }

    if (dueDate) {
      taskData.due_date = dueDate;
    }

    if (projectId) {
      taskData.project_id = projectId;
    }

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      showStatus('タスクが追加されました！', 'success');
      clearForm();
      
      // 現在のページのタイトルとURLを取得して、タスクに関連付ける
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          // コンテンツスクリプトにメッセージを送信
          chrome.tabs.sendMessage(tab.id, { 
            action: 'taskAdded', 
            task: { title, url: tab.url } 
          });
        }
      } catch (error) {
        console.log('コンテンツスクリプトとの通信に失敗しました:', error);
      }
      
    } else {
      const errorData = await response.json();
      showStatus('エラー: ' + (errorData.message || 'タスクの追加に失敗しました'), 'error');
    }
  } catch (error) {
    showStatus('ネットワークエラーが発生しました', 'error');
    console.error('タスク追加エラー:', error);
  }
}

function clearForm() {
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('dueDate').value = '';
  document.getElementById('projectSelect').value = '';
  
  // 優先度を普通にリセット
  document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.priority-btn[data-priority="2"]').classList.add('active');
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
