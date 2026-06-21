'use strict';

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');

/**
 * Synthesise Arabic text with the ar-AE-FatimaNeural voice and write an MP3.
 *
 * Reads credentials from:
 *   AZURE_SPEECH_KEY    – Azure Cognitive Services subscription key
 *   AZURE_SPEECH_REGION – Azure region (e.g. uaenorth)
 *
 * @param {string} text       Arabic text to speak.
 * @param {string} outputPath Destination file path (created/overwritten).
 * @returns {Promise<string>} Resolves with the absolute output path.
 */
function synthesize(text, outputPath) {
  if (!text || !text.trim()) throw new Error('text must not be empty');

  const key    = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set');
  }

  const abs = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = 'ar-AE-FatimaNeural';
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const audioConfig  = sdk.AudioConfig.fromAudioFileOutput(abs);
  const synthesizer  = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(abs);
        } else {
          reject(new Error(result.errorDetails || 'Synthesis failed'));
        }
      },
      err => { synthesizer.close(); reject(err); }
    );
  });
}

module.exports = { synthesize };
