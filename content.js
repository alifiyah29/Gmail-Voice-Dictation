// Global variables
let isActive = false;
let recognition = null;
let dictationButton = null;
let dictationIndicator = null;
let targetElement = null;
let isListening = false;

// Initialize when the content script loads
function initialize() {
  // Check if the extension is active
  chrome.storage.local.get(['isActive'], function(result) {
    isActive = result.isActive;
    if (isActive) {
      setupDictationButton();
    }
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleDictation') {
      isActive = request.isActive;
      
      if (isActive) {
        setupDictationButton();
      } else {
        removeDictationButton();
      }
      
      // Update icon in background
      chrome.runtime.sendMessage({action: 'updateIcon', isActive: isActive});
    }
    return true;
  });
  
  // Monitor DOM changes to detect when compose window opens
  const observer = new MutationObserver(function(mutations) {
    if (isActive && document.querySelector('.Am.Al.editable')) {
      setupDictationButton();
    }
  });
  
  // Start observing document body for changes
  observer.observe(document.body, { childList: true, subtree: true });
}

// Create and add the dictation button to Gmail's compose toolbar
function setupDictationButton() {
  // Check if we're in Gmail compose view
  const composeBox = document.querySelector('.Am.Al.editable');
  if (!composeBox || dictationButton) return;
  
  // Find the toolbar
  const toolbar = document.querySelector('.oc.gU');
  if (!toolbar) return;
  
  // Create dictation button
  dictationButton = document.createElement('div');
  dictationButton.className = 'voice-dictation-btn';
  dictationButton.innerHTML = '🎤';
  dictationButton.title = 'Start voice dictation';
  dictationButton.style.cursor = 'pointer';
  dictationButton.style.fontSize = '20px';
  dictationButton.style.padding = '0 10px';
  dictationButton.style.display = 'flex';
  dictationButton.style.alignItems = 'center';
  
  // Create dictation indicator (initially hidden)
  dictationIndicator = document.createElement('div');
  dictationIndicator.className = 'voice-dictation-indicator';
  dictationIndicator.textContent = 'Listening...';
  dictationIndicator.style.display = 'none';
  dictationIndicator.style.backgroundColor = '#f44336';
  dictationIndicator.style.color = 'white';
  dictationIndicator.style.padding = '5px 10px';
  dictationIndicator.style.borderRadius = '4px';
  dictationIndicator.style.position = 'absolute';
  dictationIndicator.style.bottom = '50px';
  dictationIndicator.style.right = '20px';
  dictationIndicator.style.zIndex = '9999';
  
  // Add click event to toggle dictation
  dictationButton.addEventListener('click', toggleDictation);
  
  // Append elements
  toolbar.appendChild(dictationButton);
  document.body.appendChild(dictationIndicator);
}

// Remove dictation button when extension is deactivated
function removeDictationButton() {
  if (dictationButton) {
    dictationButton.remove();
    dictationButton = null;
  }
  
  if (dictationIndicator) {
    dictationIndicator.remove();
    dictationIndicator = null;
  }
  
  stopDictation();
}

// Toggle dictation on/off
function toggleDictation() {
  const composeBox = document.querySelector('.Am.Al.editable');
  if (!composeBox) return;
  
  if (!isListening) {
    targetElement = composeBox;
    startDictation();
  } else {
    stopDictation();
  }
}

// Initialize and start speech recognition
function startDictation() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Your browser does not support speech recognition. Please use Chrome browser.');
    return;
  }
  
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  // Focus on compose box
  targetElement.focus();
  
  // Show indicator
  if (dictationIndicator) {
    dictationIndicator.style.display = 'block';
  }
  
  // Change button appearance
  if (dictationButton) {
    dictationButton.style.color = 'red';
    dictationButton.title = 'Stop voice dictation';
  }
  
  // Variable to store interim results
  let finalTranscript = '';
  
  // Handle speech recognition results
  recognition.onresult = function(event) {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript = processTranscript(transcript);
        
        // Insert the text at cursor position
        insertTextAtCursor(targetElement, finalTranscript + ' ');
        finalTranscript = '';
      } else {
        interimTranscript += transcript;
      }
    }
  };
  
  // Handle errors
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    stopDictation();
  };
  
  // Handle end of dictation
  recognition.onend = function() {
    isListening = false;
    if (dictationButton) {
      dictationButton.style.color = 'black';
      dictationButton.title = 'Start voice dictation';
    }
    if (dictationIndicator) {
      dictationIndicator.style.display = 'none';
    }
  };
  
  // Start recognition
  recognition.start();
  isListening = true;
}

// Stop speech recognition
function stopDictation() {
  if (recognition) {
    recognition.stop();
    recognition = null;
    isListening = false;
    
    if (dictationButton) {
      dictationButton.style.color = 'black';
      dictationButton.title = 'Start voice dictation';
    }
    
    if (dictationIndicator) {
      dictationIndicator.style.display = 'none';
    }
  }
}

// Process transcript to handle proper nouns
function processTranscript(transcript) {
  // Basic capitalization of proper nouns (names, places, companies)
  // This is a simplified approach - a real solution might use NLP
  
  // Capitalize first letter of sentences
  transcript = transcript.replace(/(^\s*\w|[.!?]\s*\w)/g, function(match) {
    return match.toUpperCase();
  });
  
  // List of common proper nouns to capitalize (you can expand this)
  const properNouns = [
    'john', 'mary', 'google', 'microsoft', 'apple', 'amazon', 'facebook',
    'new york', 'london', 'paris', 'monday', 'tuesday', 'wednesday', 
    'thursday', 'friday', 'saturday', 'sunday', 'january', 'february',
    'march', 'april', 'may', 'june', 'july', 'august', 'september',
    'october', 'november', 'december'
  ];
  
  // Capitalize proper nouns
  properNouns.forEach(noun => {
    const regex = new RegExp('\\b' + noun + '\\b', 'gi');
    transcript = transcript.replace(regex, function(match) {
      return match.charAt(0).toUpperCase() + match.slice(1);
    });
  });
  
  return transcript;
}

// Insert text at cursor position
function insertTextAtCursor(element, text) {
  // Focus on element
  element.focus();
  
  // Use execCommand to insert text
  document.execCommand('insertText', false, text);
}

// Start the extension
initialize();