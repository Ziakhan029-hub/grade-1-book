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

const AUDIO_DIR = path.join(__dirname, '..', 'audio');

// Chapter 4 · Lesson 4 — read & write 9 and 10 (FatimaNeural)
const TEXTS = [
  // step prompts (st.say)
  'ضع تسع نحلات في المربعات ثم اكتب العدد تسعة',
  'ضع عشر فراشات في المربعات ثم اكتب العدد عشرة',
  'عُدَّ وحيدات القرن ثم اكتب العدد',
  'عُدَّ الزرافات ثم اكتب العدد',
  'عُدَّ أفراس النهر ثم اكتب العدد',
  'عُدَّ الفِيَلة ثم اكتب العدد',
  // spoken count words (AR_COUNT) + AR_WORD
  'واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة',
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
  // emit the text -> path map (to stdout) for wiring into the lesson
  const map = {};
  for (const t of TEXTS){ map[t] = '../audio/'+hash(t)+'.mp3'; }
  process.stdout.write('MAP_JSON='+JSON.stringify(map)+'\n');
})().catch(e=>{ console.error('FAILED:', e.message); process.exit(1); });
