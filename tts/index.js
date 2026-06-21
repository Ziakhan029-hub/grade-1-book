'use strict';

const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

/**
 * Build a TTS client from env vars.
 *
 * Priority:
 *   1. GCLOUD_TTS_KEY_JSON  – raw service-account JSON string (good for CI/CD)
 *   2. GOOGLE_APPLICATION_CREDENTIALS – path to a JSON key file (standard GCP default)
 */
function buildClient() {
  const raw = process.env.GCLOUD_TTS_KEY_JSON;
  if (raw) {
    const credentials = JSON.parse(raw);
    return new textToSpeech.TextToSpeechClient({ credentials });
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS automatically when no options passed.
  return new textToSpeech.TextToSpeechClient();
}

/**
 * Synthesise Arabic text with the ar-XA-Wavenet-D voice and write an MP3.
 *
 * @param {string} text       Arabic text to speak.
 * @param {string} outputPath Destination file path (will be created/overwritten).
 * @returns {Promise<string>} Resolves with the absolute output path.
 */
async function synthesize(text, outputPath) {
  if (!text || !text.trim()) throw new Error('text must not be empty');

  const client = buildClient();

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'ar-XA',
      name: 'ar-XA-Wavenet-D',
      ssmlGender: 'FEMALE',
    },
    audioConfig: { audioEncoding: 'MP3' },
  });

  const abs = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, response.audioContent, 'binary');
  return abs;
}

module.exports = { synthesize };
