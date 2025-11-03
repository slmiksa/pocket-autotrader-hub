// Popup script
let isEnabled = false;

// Load initial status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response) {
    updateUI(response.enabled);
  }
});

// Toggle switch click handler
document.getElementById('toggleSwitch').addEventListener('click', () => {
  isEnabled = !isEnabled;
  
  chrome.runtime.sendMessage({
    action: 'toggleAutoTrade',
    enabled: isEnabled
  }, (response) => {
    if (response && response.success) {
      updateUI(isEnabled);
    }
  });
});

function updateUI(enabled) {
  isEnabled = enabled;
  
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const switchElement = document.getElementById('switch');
  
  if (enabled) {
    statusText.textContent = 'التداول التلقائي نشط';
    statusIndicator.classList.add('active');
    statusIndicator.classList.remove('inactive');
    switchElement.classList.add('active');
  } else {
    statusText.textContent = 'التداول التلقائي متوقف';
    statusIndicator.classList.add('inactive');
    statusIndicator.classList.remove('active');
    switchElement.classList.remove('active');
  }
}