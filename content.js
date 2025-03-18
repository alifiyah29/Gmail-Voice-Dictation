// Wait for the page to fully load
window.addEventListener("load", initializeExtension);

// Initialize the extension
function initializeExtension() {
  console.log("Gmail Voice Dictation: Extension initialized");

  // Initial check for compose areas
  checkForComposeAreas();

  // Set up a mutation observer to detect when new compose areas appear
  const observer = new MutationObserver(function (mutations) {
    checkForComposeAreas();
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also set up an interval as a fallback method
  setInterval(checkForComposeAreas, 2000);
}

// Check for compose areas in Gmail
function checkForComposeAreas() {
  // Gmail uses various selectors for compose areas
  const composeSelectors = [
    ".Am.Al.editable",
    '.Ar.Au div[role="textbox"]',
    'div[aria-label="Message Body"][role="textbox"]',
    'div[g_editable="true"][role="textbox"]',
  ];

  // Try each selector
  for (const selector of composeSelectors) {
    const composeAreas = document.querySelectorAll(selector);

    if (composeAreas.length > 0) {
      composeAreas.forEach((area) => {
        if (!area.getAttribute("data-dictation-added")) {
          console.log(
            "Gmail Voice Dictation: Compose area found, adding buttons"
          );
          addDictationButtons(area);
        }
      });
    }
  }
}

// Add dictation buttons to a compose area
function addDictationButtons(composeArea) {
  composeArea.setAttribute("data-dictation-added", "true");

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "dictation-buttons";
  buttonContainer.style.position = "absolute";
  buttonContainer.style.right = "10px";
  buttonContainer.style.top = "10px";
  buttonContainer.style.zIndex = "999";
  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "column";
  buttonContainer.style.alignItems = "center";

  const startButton = document.createElement("button");
  startButton.className = "dictation-btn start-btn";
  startButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;
  startButton.title = "Start Voice Dictation";

  const stopButton = document.createElement("button");
  stopButton.className = "dictation-btn stop-btn";
  stopButton.style.display = "none";
  stopButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
    </svg>
  `;
  stopButton.title = "Stop Voice Dictation";

  buttonContainer.appendChild(startButton);
  buttonContainer.appendChild(stopButton);

  let parentElement = composeArea.parentElement;
  parentElement.style.position = "relative";
  parentElement.appendChild(buttonContainer);

  console.log("Gmail Voice Dictation: Buttons added to compose area");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error(
      "Gmail Voice Dictation: SpeechRecognition not supported in this browser"
    );
    showError(
      buttonContainer,
      "Speech recognition not supported in this browser"
    );
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

    const indicator = document.createElement("div");
    indicator.className = "recording-indicator";
    indicator.textContent = "Recording...";
    buttonContainer.appendChild(indicator);

    console.log("Gmail Voice Dictation: Recognition started");
  };

  recognition.onend = () => {
    isListening = false;
    startButton.style.display = "block";
    stopButton.style.display = "none";

    const indicator = buttonContainer.querySelector(".recording-indicator");
    if (indicator) buttonContainer.removeChild(indicator);

    console.log("Gmail Voice Dictation: Recognition ended");
  };

  recognition.onresult = (event) => {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;

    if (event.results[resultIndex].isFinal) {
      let processedText = processPunctuation(transcript);
      insertTextIntoComposeArea(composeArea, processedText);
      currentInterimResult = "";
      console.log("Gmail Voice Dictation: Final result processed");
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
      try {
        recognition.start();
      } catch (error) {
        console.error(
          "Gmail Voice Dictation: Error starting recognition:",
          error
        );
        showError(buttonContainer, "Error starting recognition");
      }
    }
  });

  stopButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    }
  });
}

function processPunctuation(transcript) {
  if (transcript.trim().toLowerCase() === "backspace") {
    return "backspace";
  }

  let processedText = transcript
    .replace(/\bperiod\b/gi, ".")
    .replace(/\bfull stop\b/gi, ".")
    .replace(/\bcomma\b/gi, ",")
    .replace(/\bquestion mark\b/gi, "?")
    .replace(/\bexclamation mark\b/gi, "!")
    .replace(/\bexclamation point\b/gi, "!")
    .replace(/\bcolon\b/gi, ":")
    .replace(/\bsemicolon\b/gi, ";")
    .replace(/\bnew line\b/gi, "\n")
    .replace(/\bnewline\b/gi, "\n")
    .replace(/\bnew paragraph\b/gi, "\n\n")
    .replace(/\bopen parenthesis\b/gi, "(")
    .replace(/\bclose parenthesis\b/gi, ")")
    .replace(/\bopen bracket\b/gi, "[")
    .replace(/\bclose bracket\b/gi, "]")
    .replace(/\bopen quotes\b/gi, '"')
    .replace(/\bclose quotes\b/gi, '"')
    .replace(/\bhyphen\b/gi, "-")
    .replace(/\bdash\b/gi, "-")
    .replace(/\bat sign\b/gi, "@")
    .replace(/\bampersand\b/gi, "&")
    .replace(/\bpercent\b/gi, "%")
    .replace(/\bplus\b/gi, "+")
    .replace(/\bequals\b/gi, "=");

  processedText = processedText.replace(/(?<=^|[.!?]\s+)[a-z]/g, (match) =>
    match.toUpperCase()
  );

  return processedText;
}

function insertTextIntoComposeArea(composeArea, text) {
  try {
    if (text === "backspace") {
      const currentText = composeArea.innerText || composeArea.textContent;
      const newText = currentText.slice(0, -1);
      composeArea.innerText = newText;
      return;
    }

    const processedText = text.replace(/\n/g, "<br>");

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const tempElement = document.createElement("span");
    tempElement.innerHTML = processedText;

    range.deleteContents();
    range.insertNode(tempElement);

    range.setStartAfter(tempElement);
    range.setEndAfter(tempElement);
    selection.removeAllRanges();
    selection.addRange(range);

    const inputEvent = new Event("input", { bubbles: true });
    composeArea.dispatchEvent(inputEvent);
  } catch (error) {
    console.error("Gmail Voice Dictation: Error inserting text:", error);

    composeArea.innerHTML += processedText + " ";

    const range = document.createRange();
    range.selectNodeContents(composeArea);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function showError(container, message) {
  const errorElement = document.createElement("div");
  errorElement.className = "dictation-error";
  errorElement.textContent = message;
  errorElement.style.backgroundColor = "rgba(234, 67, 53, 0.9)";
  errorElement.style.color = "white";
  errorElement.style.padding = "5px 10px";
  errorElement.style.borderRadius = "4px";
  errorElement.style.fontSize = "12px";
  errorElement.style.marginTop = "5px";

  container.appendChild(errorElement);

  setTimeout(() => {
    container.removeChild(errorElement);
  }, 5000);
}
