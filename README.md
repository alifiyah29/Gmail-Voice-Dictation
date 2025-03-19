# Gmail Voice Dictation Extension

A Chrome extension that adds voice dictation functionality to Gmail's compose area. The extension allows users to dictate text into Gmail, with features to enhance punctuation, capitalization, and formatting. It also provides basic backspace functionality that positions the cursor correctly after deleting the last word.

## Features

- **Voice Dictation**: Dictate text directly into Gmail's compose area.
- **Punctuation Handling**: Automatically converts verbal commands for punctuation marks like periods, commas, question marks, and exclamation points into their respective symbols.
- **Capitalization Enhancement**: Capitalizes the first word of the text and the first word after a punctuation mark or new line.
- **Backspace Handling**: Deletes the last word and places the cursor at the end of the previous word, rather than returning to the start.
- **User Interface**: Adds a simple "Start" and "Stop" button for initiating and halting the voice dictation. Buttons are dynamically injected into the compose area when detected.
- **Error Handling**: Displays error messages if speech recognition isn't supported or if there are any issues with the voice dictation process.

## Installation

1. Download or clone the repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top-right corner.
4. Click on **Load unpacked** and select the folder where the extension's files are located.
5. Once installed, the extension will activate automatically when you open Gmail.

## How to Use

1. **Start Voice Dictation**: Click the "🎤" button in the Gmail compose area to start voice dictation.
2. **Stop Voice Dictation**: Click the "■" button to stop the dictation.
3. **Use Voice Commands**:
   - To add punctuation: say "period", "comma", "question mark", "exclamation point", etc.
   - To create a new line: say "new line" or "newline".
   - To create a new paragraph: say "new paragraph".
   - To insert a bullet point: say "bullet point" or "list item".
   - To delete the last word: say "backspace".

## Backspace Functionality

The backspace feature allows you to delete the last word and move the cursor to the end of the remaining word. This ensures that the cursor does not jump to the beginning of the text, making it easier to continue dictating.

## Future Work

- **Multi-Language Support**: Add support for multiple languages for voice dictation.
- **Punctuation Improvements**: Implement more advanced punctuation handling, such as different types of quotes or parentheses.
- **Text Formatting**: Allow the user to specify bold, italics, or underline formatting through voice commands.
- **Voice Feedback**: Provide voice feedback for each recognized command to ensure users know what the extension is doing.
- **Mobile Compatibility**: Adapt the extension for mobile use within Gmail's mobile version.
- **Customizable Commands**: Allow users to customize voice commands for specific actions (e.g., setting up custom punctuation words).

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -am 'Add feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Create a new Pull Request.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Acknowledgments

- Thanks to the Chrome Extensions documentation and [Google Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) for helping with the development of this extension.
- Special thanks to the open-source community for their contributions and resources.

---

*Created by Alifiyah Shahid - March 2025*
