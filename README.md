# Moosa Academy – Interactive Book

Arabic interactive book for Grade 1 students, built as a progressive web app.

## Audio narration

All question prompts are pre-generated as MP3s using the **ar-AE-FatimaNeural** (Azure, Arabic UAE female) voice and stored in `audio/`. Each lesson page plays the matching file automatically when a question loads, with the browser's Web Speech API as a silent fallback.

No API keys or external services are needed to run the project.

## Adding new questions

If you add questions with new prompt text:

1. Generate the new MP3s (requires Azure credentials in `.env`):
   ```bash
   npm install microsoft-cognitiveservices-speech-sdk dotenv
   node tts/generate-audio.js
   ```
2. Re-patch the lesson HTML files:
   ```bash
   node tts/patch-lessons.js
   ```
3. Commit the new files in `audio/` and the updated HTML files.
