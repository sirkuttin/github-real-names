// Initialize radio buttons
chrome.storage.local.get('displayMode', (result) => {
  const displayMode = result.displayMode || 'realName';
  document.querySelector(`input[value="${displayMode}"]`).checked = true;
});

// Add change listener to radio buttons
document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
  radio.addEventListener('change', async (e) => {
    if (e.target.checked) {
      await chrome.storage.local.set({ displayMode: e.target.value });
      // Notify all tabs to update
      const tabs = await chrome.tabs.query({ url: 'https://github.com/*' });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateDisplayMode', 
          displayMode: e.target.value 
        });
      });
    }
  });
});
