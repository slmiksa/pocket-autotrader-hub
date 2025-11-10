// Pocket Option AI Assistant - Content Script
console.log('🤖 Pocket Option AI Assistant محمل');

// Configuration
const SUPABASE_URL = 'https://ujguqvyshjnrxnmsvsdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ3VxdnlzaGpucnhubXN2c2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODMxNTAsImV4cCI6MjA3Nzc1OTE1MH0.utRPrAN2qr78HVvob3-1cA1mH0l4-SZveZcWWFB8Dj0';

let autoAnalysisInterval = null;
let isAutoAnalysisEnabled = false;
let currentTimeframe = '5m';
let currentAnalysisType = 'recommendation';
let lastAnalysis = null;
let analysisPanel = null;

// Initialize the analysis panel on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    createAnalysisPanel();
    loadSettings();
  }, 2000);
});

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAutoAnalysis') {
    toggleAutoAnalysis(request.enabled);
    sendResponse({ success: true });
  } else if (request.action === 'updateSettings') {
    currentTimeframe = request.timeframe || '5m';
    currentAnalysisType = request.analysisType || 'recommendation';
    chrome.storage.local.set({ timeframe: currentTimeframe, analysisType: currentAnalysisType });
    sendResponse({ success: true });
  } else if (request.action === 'captureNow') {
    captureAndAnalyze();
    sendResponse({ success: true });
  } else if (request.action === 'executeSignal') {
    executeTradeOnPocketOption(request.signal);
    sendResponse({ received: true });
  }
  return true;
});

function loadSettings() {
  chrome.storage.local.get(['autoAnalysisEnabled', 'timeframe', 'analysisType'], (result) => {
    isAutoAnalysisEnabled = result.autoAnalysisEnabled || false;
    currentTimeframe = result.timeframe || '5m';
    currentAnalysisType = result.analysisType || 'recommendation';
    
    if (isAutoAnalysisEnabled) {
      startAutoAnalysis();
    }
  });
}

function createAnalysisPanel() {
  if (analysisPanel) return;
  
  analysisPanel = document.createElement('div');
  analysisPanel.id = 'ai-analysis-panel';
  analysisPanel.style.cssText = `
    position: fixed;
    top: 80px;
    left: 20px;
    width: 380px;
    max-height: calc(100vh - 100px);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 999999;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: white;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  analysisPanel.innerHTML = `
    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">🤖</span>
          <span>المحلل الذكي</span>
        </h3>
        <button id="close-panel-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">×</button>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div id="auto-status" style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: 8px; font-size: 12px;">
          <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #6b7280;"></span>
          <span>متوقف</span>
        </div>
        <button id="capture-now-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">📸 تحليل الآن</button>
      </div>
    </div>
    
    <div id="analysis-content" style="flex: 1; overflow-y: auto; padding: 16px;">
      <div style="text-align: center; padding: 40px 20px; opacity: 0.6;">
        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
        <p style="margin: 0; font-size: 14px;">في انتظار التحليل...</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">قم بتفعيل التحليل التلقائي من الأيقونة أعلى اليمين</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(analysisPanel);
  
  // Event listeners
  document.getElementById('close-panel-btn').addEventListener('click', () => {
    analysisPanel.style.display = 'none';
  });
  
  document.getElementById('capture-now-btn').addEventListener('click', () => {
    captureAndAnalyze();
  });
}

async function captureAndAnalyze() {
  updatePanelStatus('جاري التقاط الشارت...', 'loading');
  
  try {
    // Find the chart element
    const chartElement = document.querySelector('canvas') || 
                        document.querySelector('.chart-container') ||
                        document.querySelector('[class*="chart"]');
    
    if (!chartElement) {
      throw new Error('لم يتم العثور على الشارت');
    }
    
    // Capture the chart area
    const screenshot = await captureChartArea(chartElement);
    
    updatePanelStatus('جاري التحليل بالذكاء الاصطناعي...', 'loading');
    
    // Send to analysis
    const analysis = await analyzeChart(screenshot);
    
    lastAnalysis = {
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      result: analysis,
      timeframe: currentTimeframe,
      type: currentAnalysisType
    };
    
    displayAnalysis(lastAnalysis);
    updatePanelStatus('تم التحليل بنجاح', 'success');
    
    // Show notification
    showNotification('✅ تم التحليل', 'تم تحليل الشارت بنجاح', 'success');
    
  } catch (error) {
    console.error('خطأ في التحليل:', error);
    updatePanelStatus('فشل التحليل: ' + error.message, 'error');
    showNotification('❌ خطأ', error.message, 'error');
  }
}

async function captureChartArea(element) {
  return new Promise((resolve, reject) => {
    // Get element position and size
    const rect = element.getBoundingClientRect();
    
    // Use Chrome API to capture visible tab
    chrome.runtime.sendMessage({
      action: 'captureVisibleTab'
    }, async (response) => {
      if (response && response.dataUrl) {
        // Crop to chart area
        const croppedImage = await cropImage(response.dataUrl, rect);
        resolve(croppedImage);
      } else {
        reject(new Error('فشل التقاط الشاشة'));
      }
    });
  });
}

async function cropImage(dataUrl, rect) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to chart area
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Draw cropped portion
      ctx.drawImage(
        img,
        rect.left * window.devicePixelRatio,
        rect.top * window.devicePixelRatio,
        rect.width * window.devicePixelRatio,
        rect.height * window.devicePixelRatio,
        0,
        0,
        rect.width,
        rect.height
      );
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

async function analyzeChart(imageData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-chart-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      image: imageData,
      timeframe: currentTimeframe,
      analysisType: currentAnalysisType
    })
  });
  
  if (!response.ok) {
    throw new Error('فشل الاتصال بخدمة التحليل');
  }
  
  const data = await response.json();
  return data.analysis;
}

function displayAnalysis(analysisData) {
  const content = document.getElementById('analysis-content');
  if (!content) return;
  
  const typeLabel = analysisData.type === 'support-resistance' ? '📍 الدعوم والارتدادات' : '🎯 توصية مباشرة';
  
  content.innerHTML = `
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; color: #10b981; font-weight: 600;">${typeLabel}</span>
        <span style="font-size: 11px; opacity: 0.6;">⏰ ${analysisData.timestamp}</span>
      </div>
      <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">
        <strong>⏱️ الفترة الزمنية:</strong> ${analysisData.timeframe}
      </div>
    </div>
    
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.8; white-space: pre-wrap;">
      ${formatAnalysis(analysisData.result)}
    </div>
    
    <div style="margin-top: 12px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
      <div style="font-size: 11px; color: #fbbf24; line-height: 1.6;">
        ⚠️ <strong>تنبيه:</strong> هذا التحليل استرشادي فقط. تداول بحذر والتزم بإدارة المخاطر.
      </div>
    </div>
  `;
}

function formatAnalysis(text) {
  // Format markdown-style text
  return text
    .replace(/## (.*?)$/gm, '<div style="font-size: 15px; font-weight: bold; color: #10b981; margin: 16px 0 8px 0;">$1</div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fbbf24;">$1</strong>')
    .replace(/- (.*?)$/gm, '<div style="margin: 6px 0 6px 16px;">• $1</div>')
    .replace(/→/g, '<span style="color: #10b981;">→</span>');
}

function updatePanelStatus(message, type = 'info') {
  const statusEl = document.getElementById('auto-status');
  if (!statusEl) return;
  
  const dot = statusEl.querySelector('.status-dot');
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    loading: '#fbbf24',
    info: '#6b7280'
  };
  
  dot.style.background = colors[type] || colors.info;
  
  if (type === 'loading') {
    dot.style.animation = 'pulse 1.5s infinite';
  } else {
    dot.style.animation = 'none';
  }
}

function toggleAutoAnalysis(enabled) {
  isAutoAnalysisEnabled = enabled;
  chrome.storage.local.set({ autoAnalysisEnabled: enabled });
  
  if (enabled) {
    startAutoAnalysis();
  } else {
    stopAutoAnalysis();
  }
}

function startAutoAnalysis() {
  if (autoAnalysisInterval) return;
  
  const statusEl = document.getElementById('auto-status');
  if (statusEl) {
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('span:last-child');
    dot.style.background = '#10b981';
    dot.style.animation = 'pulse 2s infinite';
    text.textContent = 'نشط';
  }
  
  // Initial capture
  captureAndAnalyze();
  
  // Set interval (every 30 seconds)
  autoAnalysisInterval = setInterval(() => {
    captureAndAnalyze();
  }, 30000);
  
  showNotification('✅ تم التفعيل', 'التحليل التلقائي نشط الآن', 'success');
}

function stopAutoAnalysis() {
  if (autoAnalysisInterval) {
    clearInterval(autoAnalysisInterval);
    autoAnalysisInterval = null;
  }
  
  const statusEl = document.getElementById('auto-status');
  if (statusEl) {
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('span:last-child');
    dot.style.background = '#6b7280';
    dot.style.animation = 'none';
    text.textContent = 'متوقف';
  }
  
  showNotification('⏸️ تم الإيقاف', 'التحليل التلقائي متوقف', 'info');
}

async function executeTradeOnPocketOption(signal) {
  console.log('تنفيذ إشارة:', signal);

  try {
    // Parse timeframe to get duration in seconds
    const duration = parseTimeframe(signal.timeframe);
    
    // Find the trading interface elements
    const tradeExecuted = await attemptTradeExecution(signal, duration);
    
    if (tradeExecuted) {
      console.log('✅ تم تنفيذ الصفقة بنجاح');
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'signalExecuted',
        signalId: signal.id,
        tradeId: Date.now().toString()
      });
      
      // Show notification on page
      showNotification('تم تنفيذ الصفقة', `${signal.asset} - ${signal.direction} - ${signal.timeframe}`, 'success');
    } else {
      console.error('❌ فشل تنفيذ الصفقة');
      chrome.runtime.sendMessage({
        action: 'signalFailed',
        signalId: signal.id
      });
      showNotification('فشل التنفيذ', 'لم يتم العثور على واجهة التداول', 'error');
    }
  } catch (error) {
    console.error('خطأ في تنفيذ الصفقة:', error);
    chrome.runtime.sendMessage({
      action: 'signalFailed',
      signalId: signal.id
    });
    showNotification('خطأ', error.message, 'error');
  }
}

function parseTimeframe(timeframe) {
  // Convert timeframe like "1m", "5m", "15m" to seconds
  const match = timeframe.match(/(\d+)([smh])/);
  if (!match) return 60; // default 1 minute
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  if (unit === 'h') return value * 3600;
  
  return 60;
}

async function attemptTradeExecution(signal, duration) {
  // Wait for page to be fully loaded
  await waitForElement('.chart-container', 10000);
  
  // Method 1: Try to interact with the trading panel
  const success = await tryDirectTrading(signal, duration);
  
  if (success) return true;
  
  // Method 2: Try WebSocket injection
  return await tryWebSocketTrading(signal, duration);
}

async function tryDirectTrading(signal, duration) {
  try {
    // 1. Set the asset
    const assetSelector = await waitForElement('[data-test="asset-selector"]', 5000);
    if (assetSelector) {
      // Click to open asset dropdown
      assetSelector.click();
      await sleep(500);
      
      // Find and click the asset
      const assetOption = Array.from(document.querySelectorAll('[data-test="asset-option"]'))
        .find(el => el.textContent.includes(signal.asset));
      
      if (assetOption) {
        assetOption.click();
        await sleep(500);
      }
    }
    
    // 2. Set the amount
    const amountInput = await waitForElement('[data-test="trade-amount-input"]', 5000);
    if (amountInput) {
      amountInput.value = signal.amount;
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(300);
    }
    
    // 3. Set the timeframe
    const timeSelector = await waitForElement('[data-test="time-selector"]', 5000);
    if (timeSelector) {
      timeSelector.click();
      await sleep(500);
      
      const timeOption = Array.from(document.querySelectorAll('[data-test="time-option"]'))
        .find(el => el.textContent.includes(signal.timeframe));
      
      if (timeOption) {
        timeOption.click();
        await sleep(500);
      }
    }
    
    // 4. Click the trade button (UP or DOWN)
    const tradeButton = signal.direction.toLowerCase() === 'call' 
      ? await waitForElement('[data-test="trade-up-button"]', 5000)
      : await waitForElement('[data-test="trade-down-button"]', 5000);
    
    if (tradeButton) {
      tradeButton.click();
      await sleep(1000);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ في التداول المباشر:', error);
    return false;
  }
}

async function tryWebSocketTrading(signal, duration) {
  // This requires injecting code into the page context to access WebSocket
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          // Find the WebSocket connection
          const ws = window.__pocketOptionWebSocket;
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Send trade request
            const tradeRequest = {
              action: 'trade',
              asset: '${signal.asset}',
              amount: ${signal.amount},
              direction: '${signal.direction.toLowerCase() === 'call' ? 'up' : 'down'}',
              duration: ${duration}
            };
            
            ws.send(JSON.stringify(tradeRequest));
            window.postMessage({ type: 'TRADE_EXECUTED', success: true }, '*');
          } else {
            window.postMessage({ type: 'TRADE_EXECUTED', success: false }, '*');
          }
        } catch (error) {
          window.postMessage({ type: 'TRADE_EXECUTED', success: false, error: error.message }, '*');
        }
      })();
    `;
    
    document.documentElement.appendChild(script);
    script.remove();
    
    // Listen for response
    const listener = (event) => {
      if (event.data.type === 'TRADE_EXECUTED') {
        window.removeEventListener('message', listener);
        resolve(event.data.success);
      }
    };
    
    window.addEventListener('message', listener);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('message', listener);
      resolve(false);
    }, 5000);
  });
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: Arial, sans-serif;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);