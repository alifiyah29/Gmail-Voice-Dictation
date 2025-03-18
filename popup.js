document.addEventListener('DOMContentLoaded', function() {
    const activateBtn = document.getElementById('activateBtn');
    const statusSpan = document.getElementById('status');
    
    // Check if the extension is already active
    chrome.storage.local.get(['isActive'], function(result) {
      if (result.isActive) {
        statusSpan.textContent = 'Active';
        statusSpan.style.color = 'green';
        activateBtn.textContent = 'Disable in Gmail';
      }
    });
    
    // Toggle activation when button is clicked
    activateBtn.addEventListener('click', function() {
      chrome.storage.local.get(['isActive'], function(result) {
        const newState = !result.isActive;
        
        // Update storage
        chrome.storage.local.set({isActive: newState}, function() {
          // Update UI
          if (newState) {
            statusSpan.textContent = 'Active';
            statusSpan.style.color = 'green';
            activateBtn.textContent = 'Disable in Gmail';
          } else {
            statusSpan.textContent = 'Not active';
            statusSpan.style.color = 'black';
            activateBtn.textContent = 'Enable in Gmail';
          }
          
          // Send message to content script
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleDictation', isActive: newState});
          });
        });
      });
    });
  });