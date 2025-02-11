const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// Create popup HTML for the extension
chrome.action.setPopup({
  popup: 'popup.html'
});

// Initialize display mode if not set
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('displayMode');
  if (!result.displayMode) {
    await chrome.storage.local.set({ displayMode: 'realName' });
  }
});

// Replace localStorage with chrome.storage.local
chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get('showingRealNames');
  let showingRealNames = result.showingRealNames;
  if (showingRealNames === undefined) {
    showingRealNames = true;
  }
  showingRealNames = !showingRealNames;
  await chrome.storage.local.set({ showingRealNames });
  chrome.tabs.sendMessage(tab.id, { action: 'toggle', showingRealNames });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get-showingRealNames") {
    chrome.storage.local.get('showingRealNames').then(result => {
      let showingRealNames = result.showingRealNames;
      if (showingRealNames === undefined) {
        showingRealNames = true;
      }
      sendResponse({ showingRealNames });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === "get-display-mode") {
    chrome.storage.local.get('displayMode').then(result => {
      sendResponse({ displayMode: result.displayMode || 'realName' });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'get-real-name') {
    chrome.storage.local.get(`user:${request.username}`).then(result => {
      const cached = result[`user:${request.username}`];
      if (cached && cached.timestamp > Date.now() - ONE_WEEK) {
        sendResponse({ cached: cached.realName });
      } else {
        sendResponse({ cached: null });
      }
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'set-real-name') {
    chrome.storage.local.set({
      [`user:${request.username}`]: {
        realName: request.realName,
        timestamp: Date.now()
      }
    }).then(() => {
      sendResponse({});
    });
    return true; // Will respond asynchronously
  }
});
