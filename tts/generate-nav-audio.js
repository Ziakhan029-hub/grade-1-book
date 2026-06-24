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

// Navigation / splash / hub narration (FatimaNeural)
const TEXTS = [
  'هيا نلعب!',                 // splash mascot / welcome
  'اختر لعبةً لنلعب!',          // hub welcome
  'هذه اللعبة قريباً',          // unit 5 coming-soon
  'المقارنة والتصنيف',         // unit 1
  'الأعداد حتى خمسة',          // unit 2
  'الموقع والنمط',             // unit 3
  'الأعداد حتى عشرة',          // unit 4
  'الأعداد حتى عشرين',         // unit 5 (name)
  'الجمع',                     // unit 6
];

const hash = t => crypto.createHash('md5').update(t).digest('hex').slice(0,8);

function speak(txt){
  return new Promise((res,rej)=>{
    const out = path.join(AUDIO_DIR, hash(txt)+'.mp3');
    if (fs.existsSync(out)) { console.log('  skip '+hash(txt)+'  '+txt); return res(); }
    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn = new sdk.SpeechSynthesizer(cfg, null);
    syn.speakTextAsync(txt, r=>{ syn.close();
      if (r.reason===sdk.ResultReason.SynthesizingAudioCompleted){ fs.writeFileSync(out, Buffer.from(r.audioData)); console.log('  OK '+hash(txt)+'  '+txt); res(); }
      else rej(new Error(r.errorDetails)); }, e=>{ syn.close(); rej(e); });
  });
}

(async ()=>{
  for (const t of TEXTS) await speak(t);
  console.log('\n--- MAP ---');
  console.log(JSON.stringify(Object.fromEntries(TEXTS.map(t=>[t,'../audio/'+hash(t)+'.mp3'])), null, 0));
})();
