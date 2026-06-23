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

const Q = 'كم كرة في الصندوق الأول؟ وكم كرة في الصندوق الثاني؟ اركل كرة المجموع';
const WORDS = {2:'اثنان',3:'ثلاثة',4:'أربعة',5:'خمسة',6:'ستة',7:'سبعة',8:'ثمانية',9:'تسعة',10:'عشرة'};

const DONE = 'أحسنت! لقد أكملت جميع المستويات! أنت بطل!';
const ITEMS = [{key:'q', text:Q}, {key:'done', text:DONE}];
for (const n of Object.keys(WORDS)) ITEMS.push({key:n, text:'أحسنت! '+WORDS[n]});

const hash = t => crypto.createHash('md5').update(t).digest('hex').slice(0,8);

function speak(txt){
  return new Promise((res,rej)=>{
    const out = path.join(AUDIO_DIR, hash(txt)+'.mp3');
    if (fs.existsSync(out)) { console.log('  skip '+hash(txt)+'.mp3'); return res(); }
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
  for (const it of ITEMS) await speak(it.text);
  // print the JS NARR map for embedding
  const ok = Object.keys(WORDS).map(n=>n+":'../audio/"+hash('أحسنت! '+WORDS[n])+".mp3'").join(',');
  console.log('\n--- EMBED THIS ---');
  console.log("const NARR={q:'../audio/"+hash(Q)+".mp3',ok:{"+ok+"}};");
  console.log('Done.');
})();
