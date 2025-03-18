// Background script that handles initialization and messaging between components

// Listen for installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Voice Dictation extension installed");
  
  // Initialize default settings
  chrome.storage.sync.set({
    apiKey: "",
    language: "en",
    autoCapitalize: true,
    punctuationEnabled: true
  });
});

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle messages from content script or popup
  if (request.action === "startDictation") {
    // Inject the content script if it's not already there
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          // This function is injected into the page
          if (!window.dictationInitialized) {
            window.postMessage({ type: "START_DICTATION" }, "*");
            window.dictationInitialized = true;
          } else {
            window.postMessage({ type: "TOGGLE_DICTATION" }, "*");
          }
        }
      });
    });
    sendResponse({ status: "Starting dictation" });
    return true;
  }
  
  if (request.action === "saveSettings") {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ status: "Settings saved" });
    });
    return true;
  }
});