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
  'اُنظر جيداً إلى الصورة',
  'كم عدد القوارب في الحمام؟',
  'كم عدد البطّات الصفراء؟',
  'كم عدد الأسماك البرتقاليّة؟',
  'كم عدد الحيتان الزرقاء؟',
  'كم عدد صناديق الفواكه؟',
  'كم عدد عبوات الحليب؟',
  'كم عدد التفاحات الحمراء؟',
  'كم عدد القمصان المعلّقة؟',
  'كم عدد كرات القدم؟',
  'كم عدد كرات السلّة؟',
];

function speak(txt) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5').update(txt).digest('hex').slice(0, 8);
    const outPath = path.join(AUDIO_DIR, hash + '.mp3');
    if (fs.existsSync(outPath)) { console.log(`  skip (exists): ${hash}.mp3  "${txt}"`); return resolve({ txt, hash }); }

    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn = new sdk.SpeechSynthesizer(cfg, null);
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
  const additions = {};

  for (const txt of PROMPTS) {
    const { hash } = await speak(txt);
    const rel = 'audio/' + hash + '.mp3';
    if (globalMap[txt] !== rel) { globalMap[txt] = rel; }
    additions[txt] = '../audio/' + hash + '.mp3';
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(globalMap, null, 2));

  // Patch __NARR_AUDIO__ in ch2 L1
  const L1 = path.join(ROOT, 'Interactive book for elementary school chapter 2', 'moosa-chp 2-lesson 1.html');
  let src = fs.readFileSync(L1, 'utf8');

  const sentinel = 'window.__NARR_AUDIO__=';
  const start = src.indexOf(sentinel);
  if (start !== -1) {
    const objStart = src.indexOf('{', start);
    const objEnd   = src.indexOf('};', objStart);
    if (objEnd !== -1) {
      const existing = JSON.parse(src.slice(objStart, objEnd + 1));
      Object.assign(existing, additions);
      src = src.slice(0, start) + 'window.__NARR_AUDIO__=' + JSON.stringify(existing) + ';' + src.slice(objEnd + 2);
      fs.writeFileSync(L1, src);
      console.log('\nPatched __NARR_AUDIO__ in moosa-chp 2-lesson 1.html');
    }
  }

  console.log('Done.');
})();
