'use strict';
require('dotenv').config();
const sdk    = require('microsoft-cognitiveservices-speech-sdk');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = 'uaenorth';
const VOICE  = 'ar-AE-FatimaNeural';
if (!KEY) { console.error('Set AZURE_SPEECH_KEY'); process.exit(1); }

const ROOT      = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');

const PROMPTS = [
  'انظر إلى النمط ثم لوّن البيوت لتعرضه بطريقة أخرى',
  'انظر إلى النمط ثم لوّن النجوم لتعرضه بطريقة أخرى',
  'انظر إلى النمط ثم لوّن الدوائر لتعرضه بطريقة أخرى',
];

function speak(txt) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5').update(txt).digest('hex').slice(0, 8);
    const outPath = path.join(AUDIO_DIR, hash + '.mp3');
    if (fs.existsSync(outPath)) { console.log('  skip ' + hash + '.mp3'); return resolve(); }
    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn = new sdk.SpeechSynthesizer(cfg, null);
    syn.speakTextAsync(txt, r => {
      syn.close();
      if (r.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        fs.writeFileSync(outPath, Buffer.from(r.audioData));
        console.log('  OK ' + hash + '.mp3  "' + txt + '"');
        resolve();
      } else reject(new Error(r.errorDetails));
    }, e => { syn.close(); reject(e); });
  });
}

(async () => { for (const t of PROMPTS) await speak(t); console.log('Done.'); })();
