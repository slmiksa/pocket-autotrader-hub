// Pocket Option Auto Trader - Content Script
console.log('Pocket Option Auto Trader محمل');

// Listen for signals from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeSignal') {
    executeTradeOnPocketOption(request.signal);
    sendResponse({ received: true });
  }
  return true;
});

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