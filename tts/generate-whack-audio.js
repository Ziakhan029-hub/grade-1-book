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

// Chapter-7 subtraction "pop the balls" game. ok/done/number clips are shared & already exist.
const LINES = [
  'كم كرة بقيت في الصندوق؟',            // question (NARR.q)
  'انقُر الكرات لإخراجها من الصندوق'    // play-phase instruction (NARR.play)
];

const hash = t => crypto.createHash('md5').update(t).digest('hex').slice(0,8);

function speak(txt){
  return new Promise((res,rej)=>{
    const out = path.join(AUDIO_DIR, hash(txt)+'.mp3');
    if (fs.existsSync(out)) { console.log('  skip '+hash(txt)+'.mp3  "'+txt+'"'); return res(); }
    const cfg = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const syn = new sdk.SpeechSynthesizer(cfg, null);
    syn.speakTextAsync(txt, r=>{ syn.close();
      if (r.reason===sdk.ResultReason.SynthesizingAudioCompleted){ fs.writeFileSync(out, Buffer.from(r.audioData)); console.log('  OK '+hash(txt)+'.mp3  "'+txt+'"'); res(); }
      else rej(new Error(r.errorDetails)); }, e=>{ syn.close(); rej(e); });
  });
}

(async ()=>{
  for (const l of LINES) { await speak(l); }
  console.log('\nmap:');
  for (const l of LINES) { console.log('  "'+l+'" -> ../../audio/'+hash(l)+'.mp3'); }
  console.log('Done.');
})();
