# Moosa Academy – Interactive Book

Arabic interactive book for Grade 1 students, built as a progressive web app.

---

## Azure Text-to-Speech

The `tts/` module generates high-quality Arabic MP3s using the **ar-AE-FatimaNeural** (female) voice via Azure Cognitive Services Speech.

### Prerequisites

An Azure Cognitive Services Speech resource. Get your key and region from:
**portal.azure.com → your Speech resource → Keys and Endpoint**

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your credentials
cp .env.example .env
```

Edit `.env`:

```
AZURE_SPEECH_KEY=your-key-here
AZURE_SPEECH_REGION=uaenorth
```

> **Never commit `.env` or any key files.** They are in `.gitignore`.

### Usage

```bash
# Via npm script
npm run tts "مرحبا بالعالم" output/hello.mp3

# Directly
node tts/cli.js "مرحبا بالعالم" output/hello.mp3
```

### Module API

```js
const { synthesize } = require('./tts');

await synthesize('مرحبا بالعالم', 'output/hello.mp3');
// → writes MP3 to output/hello.mp3
```

Voice: `ar-AE-FatimaNeural` (Arabic UAE, female neural), MP3 output at 16 kHz / 32 kbps.
