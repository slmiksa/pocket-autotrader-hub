// Popup script
let isEnabled = false;
let currentTimeframe = '5m';
let currentAnalysisType = 'recommendation';

// Load initial status and settings
chrome.storage.local.get(['autoAnalysisEnabled', 'timeframe', 'analysisType'], (result) => {
  isEnabled = result.autoAnalysisEnabled || false;
  currentTimeframe = result.timeframe || '5m';
  currentAnalysisType = result.analysisType || 'recommendation';
  
  updateUI(isEnabled);
  document.getElementById('timeframe').value = currentTimeframe;
  document.getElementById('analysisType').value = currentAnalysisType;
});

// Toggle switch click handler
document.getElementById('toggleSwitch').addEventListener('click', () => {
  isEnabled = !isEnabled;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleAutoAnalysis',
        enabled: isEnabled
      }, (response) => {
        if (response && response.success) {
          updateUI(isEnabled);
          chrome.storage.local.set({ autoAnalysisEnabled: isEnabled });
        }
      });
    }
  });
});

// Settings change handlers
document.getElementById('timeframe').addEventListener('change', (e) => {
  currentTimeframe = e.target.value;
  updateSettings();
});

document.getElementById('analysisType').addEventListener('change', (e) => {
  currentAnalysisType = e.target.value;
  updateSettings();
});

function updateSettings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateSettings',
        timeframe: currentTimeframe,
        analysisType: currentAnalysisType
      });
    }
  });
}

function updateUI(enabled) {
  isEnabled = enabled;
  
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const switchElement = document.getElementById('switch');
  
  if (enabled) {
    statusText.textContent = 'التحليل التلقائي نشط';
    statusIndicator.classList.add('active');
    statusIndicator.classList.remove('inactive');
    switchElement.classList.add('active');
  } else {
    statusText.textContent = 'التحليل التلقائي متوقف';
    statusIndicator.classList.add('inactive');
    statusIndicator.classList.remove('active');
    switchElement.classList.remove('active');
  }
}