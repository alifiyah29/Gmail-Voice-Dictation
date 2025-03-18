// Content script that runs in the context of Gmail and handles voice dictation using Web Speech API

// Global variables
let isRecording = false;
let recognition = null;
let targetElement = null;
let dictationButton = null;
let interimResultsDiv = null;
let settings = {
  language: "en-US",
  autoCapitalize: true,
  punctuationEnabled: true
};

// Initialize the extension when the page is loaded
function initialize() {
  console.log("Gmail Voice Dictation content script initialized");
  
  // Load settings from storage
  chrome.storage.sync.get(
    ["language", "autoCapitalize", "punctuationEnabled"],
    (result) => {
      settings = { ...settings, ...result };
      
      // Convert language code to Web Speech API format if needed
      if (settings.language && settings.language.length === 2) {
        // Map common 2-letter codes to full codes
        const langMap = {
          "en": "en-US",
          "es": "es-ES",
          "fr": "fr-FR",
          "de": "de-DE",
          "it": "it-IT",
          "pt": "pt-BR",
          "ru": "ru-RU",
          "zh": "zh-CN",
          "ja": "ja-JP",
          "ko": "ko-KR"
        };
        settings.language = langMap[settings.language] || `${settings.language}-${settings.language.toUpperCase()}`;
      }
    }
  );
  
  // Add message listener for communication with background script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === "START_DICTATION") {
      createDictationButton();
    } else if (event.data.type === "TOGGLE_DICTATION") {
      toggleDictation();
    }
  });
}

// Create and inject the dictation button into Gmail interface
function createDictationButton() {
  // Check if button already exists
  if (dictationButton) return;
  
  // Create the button element
  dictationButton = document.createElement("div");
  dictationButton.className = "gmail-voice-dictation-btn";
  dictationButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor"/>
    </svg>
    <span class="tooltip">Start Dictation</span>
  `;
  
  // Add click event listener to toggle dictation
  dictationButton.addEventListener("click", toggleDictation);
  
  // Find the Gmail compose area and insert the button
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const composeArea = document.querySelector(".Am.Al.editable");
        if (composeArea && !document.querySelector(".gmail-voice-dictation-btn")) {
          const toolbar = composeArea.closest("div").querySelector("[role='toolbar']");
          if (toolbar) {
            toolbar.appendChild(dictationButton);
            observer.disconnect();
            break;
          }
        }
      }
    }
  });
  
  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Toggle dictation on/off
function toggleDictation() {
  if (isRecording) {
    stopDictation();
  } else {
    startDictation();
  }
}

// Start voice dictation
function startDictation() {
  try {
    // Find the current active compose field
    targetElement = document.querySelector(".Am.Al.editable:focus") || 
                    document.querySelector(".Am.Al.editable");
    
    if (!targetElement) {
      alert("Please click inside a Gmail compose area first");
      return;
    }
    
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition. Please use Chrome or Edge.");
      return;
    }
    
    // Update button state
    dictationButton.classList.add("recording");
    dictationButton.querySelector(".tooltip").textContent = "Stop Dictation";
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = settings.language;
    
    // Create interim results display
    interimResultsDiv = document.createElement("div");
    interimResultsDiv.className = "gmail-voice-interim-results";
    document.body.appendChild(interimResultsDiv);
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    // Handle recognition results
    recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          // Process the final transcript
          let processedText = finalTranscript.trim();
          
          if (settings.autoCapitalize) {
            // Capitalize first letter of the sentence
            processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
            
            // Capitalize after periods, question marks, and exclamation marks
            processedText = processedText.replace(/([.!?]\s+)([a-z])/g, 
              (match, p1, p2) => p1 + p2.toUpperCase()
            );
          }
          
          // Insert the processed text at cursor
          insertTextAtCursor(processedText);
          
          // Reset final transcript for next sentence
          finalTranscript = '';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results
      interimResultsDiv.textContent = interimTranscript;
      
      // Position the interim results near the cursor
      positionInterimResults();
    };
    
    // Handle end of recognition
    recognition.onend = () => {
      if (isRecording) {
        // If stopped unexpectedly, restart
        recognition.start();
      }
    };
    
    // Handle errors
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      // Display error message
      if (event.error === 'no-speech') {
        alert("No speech detected. Please try speaking more clearly.");
      } else if (event.error === 'audio-capture') {
        alert("No microphone detected. Please check your microphone settings.");
      } else if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
      
      stopDictation();
    };
    
    // Start recognition
    recognition.start();
    isRecording = true;
    
  } catch (error) {
    console.error("Error starting dictation:", error);
    alert("Could not start speech recognition. Please check your browser settings.");
  }
}

// Stop voice dictation
function stopDictation() {
  if (recognition) {
    recognition.stop();
  }
  
  isRecording = false;
  
  // Update button state
  dictationButton.classList.remove("recording");
  dictationButton.querySelector(".tooltip").textContent = "Start Dictation";
  
  // Remove interim results display
  if (interimResultsDiv) {
    interimResultsDiv.remove();
    interimResultsDiv = null;
  }
}

// Position interim results near the cursor
function positionInterimResults() {
  if (!interimResultsDiv || !targetElement) return;
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (rect) {
      interimResultsDiv.style.position = 'fixed';
      interimResultsDiv.style.top = `${rect.bottom + 10 + window.scrollY}px`;
      interimResultsDiv.style.left = `${rect.left + window.scrollX}px`;
      interimResultsDiv.style.maxWidth = '80%';
      interimResultsDiv.style.zIndex = '9999';
    }
  }
}

// Insert text at the cursor position or append to the compose area
function insertTextAtCursor(text) {
  if (!targetElement || !text) return;
  
  // Focus the element
  targetElement.focus();
  
  // Check if we need to add spacing
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (range.commonAncestorContainer === targetElement || 
        targetElement.contains(range.commonAncestorContainer)) {
      
      // Get the current text at the cursor position
      const cursorText = range.startContainer.textContent || '';
      const cursorOffset = range.startOffset;
      
      // Determine if we need to add spaces or line breaks
      const needsSpace = cursorOffset > 0 && 
                         cursorText.charAt(cursorOffset - 1) !== ' ' && 
                         cursorText.charAt(cursorOffset - 1) !== '\n';
      
      let insertText = text;
      if (needsSpace) {
        insertText = ' ' + insertText;
      }
      
      // Insert the text
      document.execCommand('insertText', false, insertText);
      return;
    }
  }
  
  // Fallback: append to the end if no specific cursor position
  const currentContent = targetElement.textContent || '';
  const needsSpace = currentContent.length > 0 && 
                     !currentContent.endsWith(' ') && 
                     !currentContent.endsWith('\n');
  
  if (needsSpace) {
    targetElement.textContent += ' ' + text;
  } else {
    targetElement.textContent += text;
  }
}

// Initialize the content script
initialize();