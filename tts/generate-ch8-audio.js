'use strict';
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sdk    = require('microsoft-cognitiveservices-speech-sdk');
const fs     = require('fs');
const crypto = require('crypto');

const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = 'uaenorth';
const VOICE  = 'ar-AE-FatimaNeural';
if (!KEY) { console.error('Set AZURE_SPEECH_KEY'); process.exit(1); }

const AUDIO_DIR = path.join(__dirname, '..', 'audio');

// Chapter 8 — طرائق الجمع والطرح: lesson prompts + the unit name + praise.
// Number words (واحد…اثنا عشر) and ممتاز already exist and are reused; the
// hash() is deterministic so any pre-existing file is simply skipped.
const TEXTS = [
  'اجمع بالعدّ التصاعدي',                 // L1
  'استعمل خط الأعداد للجمع',              // L2
  'اطرح بالعدّ التنازلي',                  // L3
  'اقرأ المسألة ثم اكتب الجملة العددية',  // L4
  'استعمل خط الأعداد للطرح',              // L5
  'طرائق الجمع والطرح',                   // unit name (hub)
  'أحسنت',                                 // win praise
];

const hash = t => crypto.createHash('md5').update(t).digest('hex').slice(0,8);

function speak(txt){
  return new Promise((res,rej)=>{
    const out = path.join(AUDIO_DIR, hash(txt)+'.mp3');
    if (fs.existsSync(out)) { console.error('  skip '+hash(txt)+'  '+txt); return res(); }
    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn = new sdk.SpeechSynthesizer(cfg, null);
    syn.speakTextAsync(txt, r=>{ syn.close();
      if (r.reason===sdk.ResultReason.SynthesizingAudioCompleted){ fs.writeFileSync(out, Buffer.from(r.audioData)); console.error('  OK   '+hash(txt)+'  '+txt); res(); }
      else rej(new Error(r.errorDetails||('reason '+r.reason))); }, e=>{ syn.close(); rej(e); });
  });
}

(async()=>{
  for (const t of TEXTS){ await speak(t); }
  const map = {};
  for (const t of TEXTS){ map[t] = '../audio/'+hash(t)+'.mp3'; }
  process.stdout.write('MAP_JSON='+JSON.stringify(map)+'\n');
})().catch(e=>{ console.error('FAILED:', e.message); process.exit(1); });
