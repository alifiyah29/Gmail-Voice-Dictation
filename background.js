// Initialize settings when the extension is installed
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({isActive: false}, function() {
      console.log("Gmail Voice Dictation extension initialized with default settings.");
    });
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateIcon') {
      // Update the extension icon based on active state
      const iconPath = request.isActive ? 'icons/icon_active_128.png' : 'icons/icon128.png';
      chrome.action.setIcon({path: iconPath});
    }
  });