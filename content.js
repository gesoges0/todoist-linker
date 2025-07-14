// コンテンツスクリプト - ページ内でタスクが追加されたときの処理

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'taskAdded') {
    // タスクが追加されたときの視覚的フィードバック
    showTaskAddedNotification(request.task);
    sendResponse({ success: true });
  }
});

function showTaskAddedNotification(task) {
  // 通知要素を作成
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #e44332;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background-color: #e44332; border-radius: 50%;"></div>
      </div>
      <div>
        <div style="font-weight: 600;">タスクが追加されました</div>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">${task.title}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // アニメーションで表示
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // 3秒後に自動で削除
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ページが読み込まれたときにページ情報を取得できるようにする
function getPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    selectedText: window.getSelection().toString().trim()
  };
}

// 右クリックコンテキストメニューでテキストを選択してタスクを作成する機能
document.addEventListener('mouseup', function() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    // 選択されたテキストを保存（必要に応じて）
    chrome.runtime.sendMessage({
      action: 'textSelected',
      text: selectedText,
      url: window.location.href
    });
  }
});

// キーボードショートカット（Ctrl+Shift+T）でタスク追加ポップアップを開く
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    // ポップアップを開くメッセージを送信
    chrome.runtime.sendMessage({
      action: 'openPopup',
      pageInfo: getPageInfo()
    });
  }
});
