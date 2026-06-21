# Moosa Academy – Interactive Book

Arabic interactive book for Grade 1 students, built as a progressive web app.

---

## Google Cloud Text-to-Speech

The `tts/` module generates high-quality Arabic MP3s using the **ar-XA-Wavenet-D** (female) voice from Google Cloud TTS.

### Prerequisites

1. A Google Cloud project with the **Cloud Text-to-Speech API** enabled.
2. A service account with the `Cloud Text-to-Speech User` role and a downloaded JSON key.

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your credentials
cp .env.example .env
```

Edit `.env` and set **one** of the following:

| Variable | When to use |
|---|---|
| `GCLOUD_TTS_KEY_JSON` | Paste the entire service-account JSON as a string (CI/CD, no file needed) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a local JSON key file (standard local dev) |

> **Never commit `.env` or `*-credentials.json` files.** They are already in `.gitignore`.

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

Voice details: language `ar-XA`, name `ar-XA-Wavenet-D`, encoding `MP3`.
