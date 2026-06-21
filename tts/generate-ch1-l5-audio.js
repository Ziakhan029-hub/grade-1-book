'use strict';
require('dotenv').config();
const sdk    = require('microsoft-cognitiveservices-speech-sdk');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = 'uaenorth';
const VOICE  = 'ar-AE-FatimaNeural';

if (!KEY) { console.error('Set AZURE_SPEECH_KEY in .env'); process.exit(1); }

const ROOT      = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const MAP_PATH  = path.join(__dirname, 'audio-map.json');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

const PROMPTS = [
  'اضغط على المجموعة الأكبر عدداً',
  'اضغط على المجموعة الأقل عدداً',
];

function speak(txt) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5').update(txt).digest('hex').slice(0, 8);
    const outPath = path.join(AUDIO_DIR, hash + '.mp3');
    if (fs.existsSync(outPath)) { console.log(`  skip (exists): ${hash}.mp3`); return resolve({ txt, hash }); }

    const cfg  = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn  = new sdk.SpeechSynthesizer(cfg, null);
    syn.speakTextAsync(txt,
      result => {
        syn.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          fs.writeFileSync(outPath, Buffer.from(result.audioData));
          console.log(`  OK: ${hash}.mp3  "${txt}"`);
          resolve({ txt, hash });
        } else {
          reject(new Error(`TTS failed: ${result.errorDetails}`));
        }
      },
      err => { syn.close(); reject(err); }
    );
  });
}

(async () => {
  const globalMap = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) : {};
  let changed = false;

  for (const txt of PROMPTS) {
    const { hash } = await speak(txt);
    const rel = 'audio/' + hash + '.mp3';
    if (globalMap[txt] !== rel) { globalMap[txt] = rel; changed = true; }
  }

  if (changed) fs.writeFileSync(MAP_PATH, JSON.stringify(globalMap, null, 2));

  // Patch the __NARR_AUDIO__ map in ch1 L5
  const L5 = path.join(ROOT, 'Interactive book for elementary school chapter 1', 'moosa-lesson-classify 5.html');
  let src = fs.readFileSync(L5, 'utf8');

  // Build the relative paths for the two prompts (relative from ch1 folder → audio/ is one level up)
  const additions = {};
  for (const txt of PROMPTS) {
    const hash = crypto.createHash('md5').update(txt).digest('hex').slice(0, 8);
    additions[txt] = '../audio/' + hash + '.mp3';
  }

  // Insert into the existing __NARR_AUDIO__ object (before the closing })
  const sentinel = 'window.__NARR_AUDIO__=';
  const start = src.indexOf(sentinel);
  if (start !== -1) {
    const objStart = src.indexOf('{', start);
    const objEnd   = src.indexOf('};', objStart);
    if (objEnd !== -1) {
      const existing = JSON.parse(src.slice(objStart, objEnd + 1));
      Object.assign(existing, additions);
      const newMap = 'window.__NARR_AUDIO__=' + JSON.stringify(existing) + ';';
      src = src.slice(0, start) + newMap + src.slice(objEnd + 2);
      fs.writeFileSync(L5, src);
      console.log('\nPatched __NARR_AUDIO__ in moosa-lesson-classify 5.html');
    }
  }

  console.log('\nDone.');
})();
