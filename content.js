// Wait for the page to fully load
window.addEventListener("load", initializeExtension);

// Initialize the extension
function initializeExtension() {
  console.log("Gmail Voice Dictation: Extension initialized");

  // Initial check for compose areas
  checkForComposeAreas();

  // Set up a mutation observer to detect when new compose areas appear
  const observer = new MutationObserver(() => {
    checkForComposeAreas();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setInterval(checkForComposeAreas, 2000);
}

// Check for compose areas in Gmail
function checkForComposeAreas() {
  const composeSelectors = [
    ".Am.Al.editable",
    '.Ar.Au div[role="textbox"]',
    'div[aria-label="Message Body"][role="textbox"]',
    'div[g_editable="true"][role="textbox"]',
  ];

  for (const selector of composeSelectors) {
    document.querySelectorAll(selector).forEach((area) => {
      if (!area.getAttribute("data-dictation-added")) {
        console.log(
          "Gmail Voice Dictation: Compose area found, adding buttons"
        );
        addDictationButtons(area);
      }
    });
  }
}

// Add dictation buttons to a compose area
function addDictationButtons(composeArea) {
  composeArea.setAttribute("data-dictation-added", "true");

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "dictation-buttons";
  buttonContainer.style =
    "position:absolute; right:10px; top:10px; z-index:999; display:flex; flex-direction:column; align-items:center;";

  const startButton = document.createElement("button");
  startButton.className = "dictation-btn start-btn";
  startButton.innerHTML = "🎤";
  startButton.title = "Start Voice Dictation";

  const stopButton = document.createElement("button");
  stopButton.className = "dictation-btn stop-btn";
  stopButton.style.display = "none";
  stopButton.innerHTML = "■";
  stopButton.title = "Stop Voice Dictation";

  buttonContainer.append(startButton, stopButton);
  composeArea.parentElement.style.position = "relative";
  composeArea.parentElement.appendChild(buttonContainer);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("Gmail Voice Dictation: SpeechRecognition not supported");
    showError(buttonContainer, "Speech recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let isListening = false;
  let currentInterimResult = "";

  recognition.onstart = () => {
    isListening = true;
    startButton.style.display = "none";
    stopButton.style.display = "block";
    console.log("Gmail Voice Dictation: Recognition started");
  };

  recognition.onend = () => {
    isListening = false;
    startButton.style.display = "block";
    stopButton.style.display = "none";
    console.log("Gmail Voice Dictation: Recognition ended");
  };

  recognition.onresult = (event) => {
    const resultIndex = event.resultIndex;
    let transcript = event.results[resultIndex][0].transcript;

    if (event.results[resultIndex].isFinal) {
      transcript = processPunctuation(transcript);
      insertTextIntoComposeArea(composeArea, transcript);
      currentInterimResult = "";
    } else {
      currentInterimResult = transcript;
    }
  };

  recognition.onerror = (event) => {
    console.error(
      "Gmail Voice Dictation: Speech recognition error:",
      event.error
    );
    showError(buttonContainer, `Error: ${event.error}`);
    recognition.stop();
  };

  startButton.addEventListener("click", () => {
    if (!isListening) {
      recognition.start();
    }
  });

  stopButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    }
  });
}

// Process punctuation commands
function processPunctuation(transcript) {
  transcript = transcript
    .replace(/\b(period|full stop)\b/gi, ".")
    .replace(/\bcomma\b/gi, ",")
    .replace(/\bquestion mark\b/gi, "?")
    .replace(/\bexclamation (mark|point)\b/gi, "!")
    .replace(/\bcolon\b/gi, ":")
    .replace(/\b(new line|newline)\b/gi, "\n")
    .replace(/\bnew paragraph\b/gi, "\n\n");

  transcript = transcript.replace(/\b(Mr|Mrs|Dr|Ms)\s/gi, "$1.");

  transcript = transcript.replace(/\s([.,!?;:])/g, "$1");

  // Ensure new lines start with a capital letter
  transcript = transcript.replace(
    /(\n+)([a-z])/g,
    (match, p1, p2) => p1 + p2.toUpperCase()
  );

  // Ensure a period is not added if punctuation is already present in the previous line
  transcript = transcript.replace(/([.!?])\s*\n/g, "$1\n");

  return transcript;
}

// Insert transcribed text into the compose area
function insertTextIntoComposeArea(composeArea, text) {
  try {
    if (text.trim().toLowerCase() === "backspace") {
      let currentText = composeArea.innerText || composeArea.textContent;
      let words = currentText.trim().split(" ");
      words.pop();
      composeArea.innerText = words.join(" ") + " ";
      return;
    }

    text = text.replace(/\n/g, "<br>");

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const tempElement = document.createElement("span");
    tempElement.innerHTML = text;

    range.deleteContents();
    range.insertNode(tempElement);
    range.setStartAfter(tempElement);
    range.setEndAfter(tempElement);
    selection.removeAllRanges();
    selection.addRange(range);

    composeArea.dispatchEvent(new Event("input", { bubbles: true }));
  } catch (error) {
    console.error("Gmail Voice Dictation: Error inserting text:", error);
  }
}

// Show error messages in the UI
function showError(container, message) {
  const errorElement = document.createElement("div");
  errorElement.className = "dictation-error";
  errorElement.textContent = message;
  errorElement.style =
    "background-color: rgba(234, 67, 53, 0.9); color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; margin-top: 5px;";

  container.appendChild(errorElement);
  setTimeout(() => container.removeChild(errorElement), 5000);
}
