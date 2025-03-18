// Popup script that handles the extension's settings UI

// DOM elements
const languageSelect = document.getElementById("language");
const autoCapitalizeCheckbox = document.getElementById("autoCapitalize");
const punctuationEnabledCheckbox = document.getElementById("punctuationEnabled");
const saveSettingsButton = document.getElementById("saveSettings");
const startDictationButton = document.getElementById("startDictation");
const statusDiv = document.getElementById("status");

// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["language", "autoCapitalize", "punctuationEnabled"],
    (result) => {
      languageSelect.value = result.language || "en-US";
      autoCapitalizeCheckbox.checked = result.autoCapitalize !== false;
      punctuationEnabledCheckbox.checked = result.punctuationEnabled !== false;
    }
  );
});

// Save settings
saveSettingsButton.addEventListener("click", () => {
  const settings = {
    language: languageSelect.value,
    autoCapitalize: autoCapitalizeCheckbox.checked,
    punctuationEnabled: punctuationEnabledCheckbox.checked
  };
  
  chrome.storage.sync.set(settings, () => {
    statusDiv.textContent = "Settings saved!";
    statusDiv.className = "status success";
    
    // Hide status message after 2 seconds
    setTimeout(() => {
      statusDiv.textContent = "";
      statusDiv.className = "status";
    }, 2000);
  });
});

// Start dictation
startDictationButton.addEventListener("click", () => {
  // Save settings first
  saveSettingsButton.click();
  
  // Check if browser supports Web Speech API
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    statusDiv.textContent = "Your browser doesn't support speech recognition. Please use Chrome or Edge.";
    statusDiv.className = "status error";
    return;
  }
  
  // Send message to start dictation
  chrome.runtime.sendMessage({ action: "startDictation" }, (response) => {
    statusDiv.textContent = "Dictation started in Gmail tab";
    statusDiv.className = "status success";
    
    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);
  });
});