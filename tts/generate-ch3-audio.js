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
const CH3_DIR   = path.join(ROOT, 'Interactive book for elementary school chapter 3');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

/* ── Per-lesson prompts (emoji-stripped, exactly as narrator will look them up) ── */

const L1_PROMPTS = [
  'أين الموز؟ ضع كلّ قرد في صندوقه',
  'اسحب كلّ قرد إلى الصندوق الصحيح',
  'أيّ سمكة فوق النبتة؟',
  'أيّ سمكة تحت النبتة؟',
  'اُنظر إلى الصورة',
];

const L2_NOUNS     = ['القطعة','الصندوق','الزهرة','القبعة','الوسادة','العلبة'];
const L2_POSITIONS = ['الأعلى','الوسط','الأسفل'];
const L2_PROMPTS   = [];
for (const noun of L2_NOUNS)
  for (const pos of L2_POSITIONS)
    L2_PROMPTS.push('اضغط على ' + noun + ' في ' + pos);

const L3_PROMPTS = [
  'اضغط على الديك الذي يسير قبل الكتكوت؟',
  'اضغط على الطائر الذي يسير بعد الكتكوت؟',
  'اضغط على الطير الذي يسير قبل الضفدع؟',
  'اضغط على الحيوان الذي يسير بعد الضفدع؟',
  'اضغط على الحيوان الذي يسير قبل الماعز؟',
  'اضغط على الحيوان الذي يسير بعد الماعز؟',
  'اضغط على الخروف الذي يسير قبل الخروف الأسود؟',
  'اضغط على الخروف الذي يسير بعد الخروف الأسود؟',
  'اضغط على الطائر الذي يطير قبل الطائر الأزرق؟',
  'اضغط على الطائر الذي يطير بعد الطائر الأزرق؟',
  'اضغط على الحصان الذي يجري قبل الأحصنة الأخرى؟',
  'اضغط على الحصان الذي يجري بعد الأحصنة الأخرى؟',
];

const L4_PROMPTS = [
  'لوّن المربعات مثل النمط: أخضر، أزرق',
  'أنشئ النمط: أصفر، أحمر',
  'لوّن المربعات مثل النمط: أزرق، أصفر',
  'أنشئ النمط: أخضر، أحمر',
  'أنشئ النمط: بنفسجي، برتقالي',
];

const L5_PROMPTS = [
  'انظر إلى النمط وأنشئه في المربعات أدناه',
];

const L6_PROMPTS = [
  'انظر إلى النمط ثم لوّن البيوت لتعرضه بطريقة أخرى',
  'انظر إلى النمط ثم لوّن النجوم لتعرضه بطريقة أخرى',
  'انظر إلى النمط ثم لوّن الدوائر لتعرضه بطريقة أخرى',
];

const LESSONS_MAP = [
  { file: 'moosa-chp 3-lesson 1.html', prompts: L1_PROMPTS },
  { file: 'moosa-chp 3-lesson 2.html', prompts: L2_PROMPTS },
  { file: 'moosa-chp 3-lesson 3.html', prompts: L3_PROMPTS },
  { file: 'moosa-chp 3-lesson 4.html', prompts: L4_PROMPTS },
  { file: 'moosa-chp 3-lesson 5.html', prompts: L5_PROMPTS },
  { file: 'moosa-chp 3-lesson 6.html', prompts: L6_PROMPTS },
];

/* ── Narrator IIFE (injected once into each lesson) ── */
// Strips emoji/symbols before lookup so banners with emoji (lesson 1) still match.
const NARRATOR_IIFE = `(function(){
  var _lTxt='',_au=null,debT=null,retryT=null,_spk=false;
  var SELS=['.q-banner','.tray-lbl'];
  function _strip(t){return t.replace(/[^\\u0600-\\u06FF\\u0020-\\u007E]/g,'').replace(/\\s+/g,' ').trim();}
  function speak(raw){
    var txt=_strip(raw);
    if(!txt||txt===_lTxt)return;
    _lTxt=txt;_spk=true;clearInterval(retryT);
    if(_au){_au.pause();_au=null;}
    var src=(window.__NARR_AUDIO__||{})[txt];
    if(src){_au=new Audio(src);_au.play().catch(function(){});}
    else{var u=new SpeechSynthesisUtterance(txt);u.lang='ar-AE';u.pitch=1.2;u.rate=0.9;speechSynthesis.cancel();speechSynthesis.speak(u);}
  }
  function readQ(){
    if(document.querySelector('.win-overlay.show'))return;
    for(var i=0;i<SELS.length;i++){var el=document.querySelector(SELS[i]);if(el&&el.textContent.trim().length>2){speak(el.textContent.trim());return;}}
  }
  window.addEventListener('load',function(){
    var btn=document.createElement('button');btn.textContent='\\uD83D\\uDD0A';
    btn.setAttribute('aria-label','\\u0627\\u0633\\u062A\\u0645\\u0639 \\u0645\\u062C\\u062F\\u062F\\u0627\\u064B');
    btn.style.cssText='position:fixed;bottom:20px;right:16px;z-index:9999;background:linear-gradient(135deg,#FCD34D,#F59E0B);border:none;border-radius:50%;width:48px;height:48px;font-size:24px;cursor:pointer;box-shadow:0 4px 0 #B45309,0 6px 16px rgba(180,100,0,.28);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;';
    btn.addEventListener('click',function(){_lTxt='';_spk=false;readQ();});
    document.body.appendChild(btn);
    setTimeout(readQ,300);setTimeout(readQ,900);setTimeout(readQ,2200);
    retryT=setInterval(function(){if(_spk){clearInterval(retryT);return;}_lTxt='';readQ();},650);
    setTimeout(function(){clearInterval(retryT);},9000);
  });
  var root=document.querySelector('.ml-widget')||document.body,_lp='';
  try{new MutationObserver(function(){clearTimeout(debT);debT=setTimeout(function(){var el=document.querySelector(SELS.join(','));var nt=el?el.textContent.trim():'';if(nt&&nt!==_lp){_lp=nt;speak(nt);}},420);}).observe(root,{childList:true,subtree:true,characterData:true});}catch(e){}
})();`;

/* ── TTS synthesizer ── */
function speak(txt) {
  return new Promise((resolve, reject) => {
    const hash    = crypto.createHash('md5').update(txt).digest('hex').slice(0, 8);
    const outPath = path.join(AUDIO_DIR, hash + '.mp3');
    if (fs.existsSync(outPath)) {
      console.log(`  skip: ${hash}.mp3  "${txt}"`);
      return resolve({ txt, hash });
    }
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
          reject(new Error('TTS failed: ' + result.errorDetails));
        }
      },
      err => { syn.close(); reject(err); }
    );
  });
}

/* ── Patch a lesson file ── */
function patchLesson(lessonFile, audioMap) {
  const filePath = path.join(CH3_DIR, lessonFile);
  let src = fs.readFileSync(filePath, 'utf8');

  // 1. Patch __NARR_AUDIO__
  const sentinel = 'window.__NARR_AUDIO__=';
  const start    = src.indexOf(sentinel);
  if (start !== -1) {
    const objStart = src.indexOf('{', start);
    const objEnd   = src.indexOf('};', objStart);
    if (objEnd !== -1) {
      let existing = {};
      try { existing = JSON.parse(src.slice(objStart, objEnd + 1)); } catch(e) {}
      Object.assign(existing, audioMap);
      src = src.slice(0, start) + 'window.__NARR_AUDIO__=' + JSON.stringify(existing) + ';' + src.slice(objEnd + 2);
    }
  }

  // 2. Inject narrator IIFE after the __NARR_AUDIO__ <script> closing tag (once only)
  if (!src.includes('_lTxt=')) {
    const narAudioClose = src.indexOf('</script>', src.indexOf('window.__NARR_AUDIO__'));
    if (narAudioClose !== -1) {
      const narTag = `\n<script>\n${NARRATOR_IIFE}\n</script>`;
      src = src.slice(0, narAudioClose + 9) + narTag + src.slice(narAudioClose + 9);
    }
  }

  fs.writeFileSync(filePath, src);
  console.log(`  patched: ${lessonFile}`);
}

/* ── Main ── */
(async () => {
  const globalMap = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) : {};

  // Collect all unique prompts
  const allSet = new Set();
  for (const { prompts } of LESSONS_MAP) prompts.forEach(p => allSet.add(p));
  const allPrompts = [...allSet];

  console.log(`Generating ${allPrompts.length} audio files (FatimaNeural)...\n`);
  const hashMap = {};
  for (const txt of allPrompts) {
    const { hash } = await speak(txt);
    hashMap[txt] = hash;
    globalMap[txt] = 'audio/' + hash + '.mp3';
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(globalMap, null, 2));
  console.log('\nPatching ch3 lessons...');

  for (const { file, prompts } of LESSONS_MAP) {
    const lessonAudio = {};
    for (const txt of prompts) {
      if (hashMap[txt]) lessonAudio[txt] = '../audio/' + hashMap[txt] + '.mp3';
    }
    patchLesson(file, lessonAudio);
  }

  console.log('\nDone — all ch3 lessons now have FatimaNeural narration.');
})();
