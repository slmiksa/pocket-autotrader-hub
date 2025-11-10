// Pocket Option AI Assistant - Background Service Worker
const SUPABASE_URL = 'https://ujguqvyshjnrxnmsvsdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ3VxdnlzaGpucnhubXN2c2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODMxNTAsImV4cCI6MjA3Nzc1OTE1MH0.utRPrAN2qr78HVvob3-1cA1mH0l4-SZveZcWWFB8Dj0';

let isAutoTradeEnabled = false;
let checkInterval = null;

// Load settings on startup
chrome.storage.local.get(['autoTradeEnabled'], (result) => {
  isAutoTradeEnabled = result.autoTradeEnabled || false;
  if (isAutoTradeEnabled) {
    startMonitoring();
  }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAutoTrade') {
    isAutoTradeEnabled = request.enabled;
    chrome.storage.local.set({ autoTradeEnabled: isAutoTradeEnabled });
    
    if (isAutoTradeEnabled) {
      startMonitoring();
      sendResponse({ success: true, message: 'تم تفعيل التداول التلقائي' });
    } else {
      stopMonitoring();
      sendResponse({ success: true, message: 'تم إيقاف التداول التلقائي' });
    }
  } else if (request.action === 'getStatus') {
    sendResponse({ enabled: isAutoTradeEnabled });
  } else if (request.action === 'captureVisibleTab') {
    // Capture the visible tab for AI analysis
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('خطأ في التقاط الشاشة:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'signalExecuted') {
    updateSignalStatus(request.signalId, 'executed', request.tradeId);
  } else if (request.action === 'signalFailed') {
    updateSignalStatus(request.signalId, 'failed');
  }
  return true;
});

function startMonitoring() {
  if (checkInterval) return;
  
  console.log('بدء مراقبة الإشارات...');
  checkForPendingSignals(); // Check immediately
  
  // Check every 5 seconds
  checkInterval = setInterval(() => {
    checkForPendingSignals();
  }, 5000);
}

function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  console.log('تم إيقاف مراقبة الإشارات');
}

async function checkForPendingSignals() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/signals?status=eq.pending&order=received_at.desc&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('فشل جلب الإشارات:', response.status);
      return;
    }

    const signals = await response.json();
    
    if (signals.length > 0) {
      console.log(`تم العثور على ${signals.length} إشارة معلقة`);
      
      // Send signals to content script
      const tabs = await chrome.tabs.query({ url: 'https://pocketoption.com/*' });
      
      if (tabs.length > 0) {
        for (const signal of signals) {
          // Check if signal is ready to execute
          if (shouldExecuteSignal(signal)) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'executeSignal',
              signal: signal
            });
          }
        }
      } else {
        console.log('لم يتم العثور على تبويب Pocket Option مفتوح');
      }
    }
  } catch (error) {
    console.error('خطأ في فحص الإشارات:', error);
  }
}

function shouldExecuteSignal(signal) {
  // If entry_time is specified, check if we're within 1 minute of it
  if (signal.entry_time) {
    const now = new Date();
    const entryTime = new Date(signal.entry_time);
    const diffMinutes = Math.abs(now - entryTime) / 60000;
    
    // Execute if within 1 minute of entry time
    return diffMinutes <= 1;
  }
  
  // If no entry_time, execute immediately
  return true;
}

// Mark signal as executed
async function updateSignalStatus(signalId, status, tradeId = null) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/signals?id=eq.${signalId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: status })
      }
    );

    if (response.ok) {
      console.log(`تم تحديث حالة الإشارة ${signalId} إلى ${status}`);
    }
  } catch (error) {
    console.error('خطأ في تحديث حالة الإشارة:', error);
  }
}