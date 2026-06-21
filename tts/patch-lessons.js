'use strict';
/**
 * Patches all lesson HTML files to play pre-generated Azure MP3s first,
 * falling back to the browser Web Speech API if the audio is unavailable.
 *
 * Run AFTER generate-audio.js has produced tts/audio-map.json.
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const MAP_PATH = path.join(__dirname, 'audio-map.json');

if (!fs.existsSync(MAP_PATH)) {
  console.error('tts/audio-map.json not found — run generate-audio.js first.');
  process.exit(1);
}

const globalMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

// Lesson files live one directory below ROOT, so relative path is ../audio/X.mp3
const relativeMap = {};
for (const [text, p] of Object.entries(globalMap)) relativeMap[text] = '../' + p;

const MAP_JS = `window.__NARR_AUDIO__=${JSON.stringify(relativeMap)};`;

// ── Replacement strings ───────────────────────────────────────────────────────

// PATTERN B – compact speak() used in classify 2-5 and ch2 lessons 1,2,4,5,6
const OLD_SPEAK_B =
`function speak(txt){
    if(!txt) return;
    if(!speechSynthesis.getVoices().length) return;
    if(txt===lastTxt) return;
    lastTxt=txt;
    var u=new SpeechSynthesisUtterance(txt);
    u.lang='ar-SA';
    var v=getVoice();if(v)u.voice=v;u.pitch=1.3;
    u.onstart=function(){spoken=true;clearInterval(retryT);if(narEl)narEl.classList.add('speaking');};
    u.onend=function(){if(narEl)narEl.classList.remove('speaking');};
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }`;

const NEW_SPEAK_B =
`function speak(txt){
    if(!txt) return;
    if(txt===lastTxt) return;
    lastTxt=txt;
    var _src=(window.__NARR_AUDIO__||{})[txt];
    if(_src){spoken=true;clearInterval(retryT);var _a=new Audio(_src);_a.onplay=function(){if(narEl)narEl.classList.add('speaking');};_a.onended=function(){if(narEl)narEl.classList.remove('speaking');};_a.onerror=function(){spoken=false;lastTxt='';_wsSpeak(txt);};_a.play().catch(function(){spoken=false;lastTxt='';_wsSpeak(txt);});return;}
    _wsSpeak(txt);
  }
  function _wsSpeak(txt){
    if(!speechSynthesis.getVoices().length){lastTxt='';return;}
    var u=new SpeechSynthesisUtterance(txt);
    u.lang='ar-SA';
    var v=getVoice();if(v)u.voice=v;u.pitch=1.3;
    u.onstart=function(){spoken=true;clearInterval(retryT);if(narEl)narEl.classList.add('speaking');};
    u.onend=function(){if(narEl)narEl.classList.remove('speaking');};
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }`;

// PATTERN A – expanded speak() used in classify 1 (appears twice)
const OLD_SPEAK_A =
`  function speak(txt){
    if(!txt) return;
    if(!speechSynthesis.getVoices().length) return;
    if(txt === lastTxt) return;
    lastTxt = txt;
    var utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = 'ar-SA';
    var v = getVoice();
    if(v) utterance.voice = v;
    utterance.pitch = 1.3;
    utterance.onstart = function(){ spoken=true; clearInterval(retryT); if(narEl) narEl.classList.add('speaking'); };
    utterance.onend   = function(){ if(narEl) narEl.classList.remove('speaking'); };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }`;

const NEW_SPEAK_A =
`  function speak(txt){
    if(!txt) return;
    if(txt === lastTxt) return;
    lastTxt = txt;
    var _src = (window.__NARR_AUDIO__ || {})[txt];
    if(_src){
      spoken=true; clearInterval(retryT);
      var _a = new Audio(_src);
      _a.onplay  = function(){ if(narEl) narEl.classList.add('speaking'); };
      _a.onended = function(){ if(narEl) narEl.classList.remove('speaking'); };
      _a.onerror = function(){ spoken=false; lastTxt=''; _wsSpeak(txt); };
      _a.play().catch(function(){ spoken=false; lastTxt=''; _wsSpeak(txt); });
      return;
    }
    _wsSpeak(txt);
  }
  function _wsSpeak(txt){
    if(!speechSynthesis.getVoices().length){ lastTxt=''; return; }
    var utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = 'ar-SA';
    var v = getVoice();
    if(v) utterance.voice = v;
    utterance.pitch = 1.3;
    utterance.onstart = function(){ spoken=true; clearInterval(retryT); if(narEl) narEl.classList.add('speaking'); };
    utterance.onend   = function(){ if(narEl) narEl.classList.remove('speaking'); };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }`;

// PATTERN C – lesson 3's mlSpeak (unique structure)
const OLD_MLSPEAK =
`var _mlSpeakRetry = null, _mlSpeakSpoken = false;
function mlSpeak() {
  if (!window.speechSynthesis) return;
  const q = QUESTIONS[qIndex];
  let txt = q.prompt;
  if (q.type === 'drag') txt += '. ' + q.rule;
  _mlSpeakSpoken = false;
  clearInterval(_mlSpeakRetry);
  function _doSpeak() {
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar'));
    if (!voices.length) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'ar-SA'; u.rate = 0.9; u.pitch = 1.3;
    const fem = voices.find(v => /female|woman|فاطمة|Fatima|Layla|hoda|salma|laila|amira|zeina|dina|zara|rana|mona|yasmin|nour/i.test(v.name)) ||
                voices.find(v => !/male|ذكر|naayf|majed|omar|maged|tarik|nizar/i.test(v.name)) ||
                voices[0];
    if (fem) u.voice = fem;
    u.onstart = function(){ _mlSpeakSpoken = true; clearInterval(_mlSpeakRetry); };
    window.speechSynthesis.speak(u);
    return true;
  }
  if (!_doSpeak()) {
    _mlSpeakRetry = setInterval(function(){
      if (_mlSpeakSpoken) { clearInterval(_mlSpeakRetry); return; }
      _doSpeak();
    }, 400);
    setTimeout(function(){ clearInterval(_mlSpeakRetry); }, 8000);
  }
  speechSynthesis.onvoiceschanged = function(){ if(!_mlSpeakSpoken) _doSpeak(); };
}`;

const NEW_MLSPEAK =
`var _mlSpeakRetry = null, _mlSpeakSpoken = false;
function mlSpeak() {
  const q = QUESTIONS[qIndex];
  let txt = q.prompt;
  if (q.type === 'drag') txt += '. ' + q.rule;
  _mlSpeakSpoken = false;
  clearInterval(_mlSpeakRetry);
  var _src = (window.__NARR_AUDIO__ || {})[txt];
  if (_src) {
    _mlSpeakSpoken = true;
    var _a = new Audio(_src);
    _a.onerror = function(){ _mlSpeakSpoken = false; _mlWsSpeak(txt); };
    _a.play().catch(function(){ _mlSpeakSpoken = false; _mlWsSpeak(txt); });
    return;
  }
  _mlWsSpeak(txt);
}
function _mlWsSpeak(txt) {
  if (!window.speechSynthesis) return;
  function _doSpeak() {
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar'));
    if (!voices.length) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'ar-SA'; u.rate = 0.9; u.pitch = 1.3;
    const fem = voices.find(v => /female|woman|فاطمة|Fatima|Layla|hoda|salma|laila|amira|zeina|dina|zara|rana|mona|yasmin|nour/i.test(v.name)) ||
                voices.find(v => !/male|ذكر|naayf|majed|omar|maged|tarik|nizar/i.test(v.name)) ||
                voices[0];
    if (fem) u.voice = fem;
    u.onstart = function(){ _mlSpeakSpoken = true; clearInterval(_mlSpeakRetry); };
    window.speechSynthesis.speak(u);
    return true;
  }
  if (!_doSpeak()) {
    _mlSpeakRetry = setInterval(function(){
      if (_mlSpeakSpoken) { clearInterval(_mlSpeakRetry); return; }
      _doSpeak();
    }, 400);
    setTimeout(function(){ clearInterval(_mlSpeakRetry); }, 8000);
  }
  speechSynthesis.onvoiceschanged = function(){ if(!_mlSpeakSpoken) _doSpeak(); };
}`;

// ── Injection marker for window.__NARR_AUDIO__ ───────────────────────────────
// Inject the global map just before the narrator IIFE in each file
const IIFE_START = `(function(){\n  if(!('speechSynthesis' in window)) return;`;
const IIFE_START_A = `(function(){\n  if(!('speechSynthesis' in window)) return;`; // same

function injectMap(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) return src;
  return src.slice(0, idx) + `<script>${MAP_JS}</script>\n` + src.slice(idx);
}

// ── Process files ─────────────────────────────────────────────────────────────
const FILES_B = [
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 2.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 3.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 4.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 5.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 1.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 2.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 4.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 5.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 6.html',
];

for (const rel of FILES_B) {
  const fpath = path.join(ROOT, rel);
  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;

  if (!src.includes(OLD_SPEAK_B)) { console.log(`SKIP (no match): ${path.basename(rel)}`); continue; }
  src = src.replaceAll(OLD_SPEAK_B, NEW_SPEAK_B);

  // Inject map once (before first narrator IIFE)
  const injectMarker = `<script>\n${IIFE_START}`;
  const firstIdx = src.indexOf(injectMarker);
  if (firstIdx !== -1 && !src.includes(`<script>${MAP_JS}</script>`)) {
    src = src.slice(0, firstIdx) + `<script>${MAP_JS}</script>\n` + src.slice(firstIdx);
  }

  if (src !== orig) { fs.writeFileSync(fpath, src, 'utf8'); console.log(`SAVED: ${path.basename(rel)}`); }
}

// Pattern A – classify 1
(function() {
  const rel   = 'Interactive book for elementary school chapter 1/moosa-lesson-classify 1.html';
  const fpath = path.join(ROOT, rel);
  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;

  src = src.replaceAll(OLD_SPEAK_A, NEW_SPEAK_A);

  const injectMarker = `<script>\n${IIFE_START_A}`;
  const firstIdx = src.indexOf(injectMarker);
  if (firstIdx !== -1 && !src.includes(`<script>${MAP_JS}</script>`)) {
    src = src.slice(0, firstIdx) + `<script>${MAP_JS}</script>\n` + src.slice(firstIdx);
  }

  if (src !== orig) { fs.writeFileSync(fpath, src, 'utf8'); console.log(`SAVED: ${path.basename(rel)}`); }
  else console.log(`SKIP (no change): ${path.basename(rel)}`);
})();

// Pattern C – lesson 3
(function() {
  const rel   = 'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 3.html';
  const fpath = path.join(ROOT, rel);
  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;

  if (!src.includes(OLD_MLSPEAK)) { console.log(`SKIP (no match): ${path.basename(rel)}`); return; }
  src = src.replace(OLD_MLSPEAK, NEW_MLSPEAK);

  // Inject before the first <script> block that contains mlSpeak
  const marker = `\nvar _mlSpeakRetry`;
  const idx = src.indexOf(marker);
  if (idx !== -1 && !src.includes(`<script>${MAP_JS}</script>`)) {
    // find the opening <script> before this marker
    const scriptIdx = src.lastIndexOf('<script>', idx);
    if (scriptIdx !== -1) {
      src = src.slice(0, scriptIdx) + `<script>${MAP_JS}</script>\n` + src.slice(scriptIdx);
    }
  }

  if (src !== orig) { fs.writeFileSync(fpath, src, 'utf8'); console.log(`SAVED: ${path.basename(rel)}`); }
  else console.log(`SKIP (no change): ${path.basename(rel)}`);
})();

console.log('\nPatch complete.');
