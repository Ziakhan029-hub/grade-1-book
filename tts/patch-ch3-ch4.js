'use strict';
/**
 * Patches ch3 and ch4 lesson files:
 *  1. Removes old narrator (fNarrator CSS + HTML pill + old IIFE)
 *  2. Injects window.__NARR_AUDIO__ map before lesson script
 *  3. Upgrades mlSpeak() to try MP3 first, Web Speech API fallback
 *  4. Adds 🔊 speaker button (fixed, bottom-right)
 *
 * Run AFTER generate-ch3-ch4-audio.js has run.
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const MAP_PATH = path.join(__dirname, 'audio-map.json');

const globalMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

// Relative from ch3/ch4 subfolders → audio dir is two levels up
const relMap = {};
for (const [t, p] of Object.entries(globalMap)) relMap[t] = '../../' + p;
const MAP_JS = `window.__NARR_AUDIO__=${JSON.stringify(relMap)};`;

// ── OLD narrator block (exact, same in all ch3/ch4 files) ────────────────────
const OLD_NARRATOR = `<style>

/* ── Female Narrator indicator ── */
.f-narrator{
  position:fixed!important;bottom:18px!important;right:12px!important;
  top:auto!important;left:auto!important;
  z-index:9999;
  display:flex;align-items:center;gap:8px;
  background:linear-gradient(135deg,#FCD34D,#F59E0B);
  border:3px solid #fff;border-radius:999px;
  padding:8px 14px 8px 10px;
  box-shadow:0 4px 0 #B45309,0 6px 18px rgba(180,100,0,.28);
  direction:rtl;
  transition:opacity .3s;
}
.f-narrator-icon{font-size:20px;line-height:1;}
.f-narrator-waves{display:flex;align-items:center;gap:3px;height:18px;}
.f-narrator-waves span{
  display:inline-block;width:3px;border-radius:3px;
  background:#fff;opacity:.5;
  animation:fnWave 1.2s ease-in-out infinite;
}
.f-narrator-waves span:nth-child(1){height:6px;animation-delay:0s}
.f-narrator-waves span:nth-child(2){height:12px;animation-delay:.15s}
.f-narrator-waves span:nth-child(3){height:18px;animation-delay:.3s}
.f-narrator-waves span:nth-child(4){height:12px;animation-delay:.45s}
.f-narrator-waves span:nth-child(5){height:6px;animation-delay:.6s}
.f-narrator.speaking .f-narrator-waves span{opacity:1;background:#fff;}
@keyframes fnWave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}
/* ── Animated guide hand ── */
#mlGuideHand{position:fixed;z-index:9990;pointer-events:none;font-size:38px;opacity:0;transform-origin:bottom center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));will-change:left,top,opacity,transform;}
#mlGuideHand.appear{animation:guideAppear .4s ease forwards;}
@keyframes guideAppear{0%{opacity:0;transform:scale(.4) rotate(-30deg)}100%{opacity:1;transform:scale(1.2) rotate(-20deg)}}
</style>



<!-- Arabic Female Narrator + animated guide -->
<div id="fNarrator" class="f-narrator" aria-live="polite" aria-label="المرشدة الصوتية">
  <span class="f-narrator-icon">🧕</span>
  <div class="f-narrator-waves">
    <span></span><span></span><span></span><span></span><span></span>
  </div>
</div>
<script>
(function(){
  if(!('speechSynthesis' in window)) return;
  var lastTxt='',debT=null,unlocked=false,narEl=null,voiceReady=false;
  speechSynthesis.onvoiceschanged=function(){
    speechSynthesis.getVoices();
    if(!voiceReady){voiceReady=true;setTimeout(readQ,300);}
  };
  function getVoice(){
    var vs=speechSynthesis.getVoices();
    return vs.find(function(v){return v.lang.startsWith('ar')&&/female|أنثى|hoda|salma|laila|amira/i.test(v.name);})||vs.find(function(v){return v.lang.startsWith('ar');})||null;
  }
  function speak(txt){
    if(!txt||txt===lastTxt)return;
    lastTxt=txt;
    var u=new SpeechSynthesisUtterance(txt);
    u.lang='ar-SA';
    var v=getVoice();if(v)u.voice=v;
    u.onstart=function(){if(narEl)narEl.classList.add('speaking');};
    u.onend=function(){if(narEl)narEl.classList.remove('speaking');};
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }
  var SELS=['#ml-qPrompt','#ml-prompt','.q-prompt','.q-banner-text','.prompt-line','.tray-lbl','.count-reveal-label'];
  function readQ(){
    if(document.querySelector('.win-overlay.show'))return;
    for(var i=0;i<SELS.length;i++){var el=document.querySelector(SELS[i]);if(el){var t=el.textContent.replace(/\s+/g,' ').trim();if(t.length>2){speak(t);return;}}}
  }
  function unlock(){if(unlocked)return;unlocked=true;speechSynthesis.cancel();setTimeout(readQ,200);}
  document.addEventListener('touchstart',unlock,{once:true,passive:true});
  document.addEventListener('click',unlock,{once:true});
  var root=document.querySelector('.ml-widget')||document.body;
  try{new MutationObserver(function(){clearTimeout(debT);debT=setTimeout(readQ,400);}).observe(root,{childList:true,subtree:true,characterData:true});}catch(e){}
  window.addEventListener('load',function(){narEl=document.getElementById('fNarrator');setTimeout(readQ,500);setTimeout(readQ,1500);});
})();
</script>`;

// ── NEW: keep guide-hand CSS, add speaker button script only ─────────────────
const NEW_NARRATOR =
`<style>
/* ── Animated guide hand ── */
#mlGuideHand{position:fixed;z-index:9990;pointer-events:none;font-size:38px;opacity:0;transform-origin:bottom center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));will-change:left,top,opacity,transform;}
#mlGuideHand.appear{animation:guideAppear .4s ease forwards;}
@keyframes guideAppear{0%{opacity:0;transform:scale(.4) rotate(-30deg)}100%{opacity:1;transform:scale(1.2) rotate(-20deg)}}
</style>
<script>
(function(){
  var n=document.getElementById('fNarrator');if(n)n.remove();
  window.addEventListener('load',function(){
    var s=document.createElement('button');s.id='mlSpeakerBtn';s.textContent='🔊';
    s.setAttribute('aria-label','استمع مجدداً');
    s.style.cssText='position:fixed;bottom:20px;right:16px;z-index:9999;background:linear-gradient(135deg,#FCD34D,#F59E0B);border:none;border-radius:50%;width:48px;height:48px;font-size:24px;cursor:pointer;box-shadow:0 4px 0 #B45309,0 6px 16px rgba(180,100,0,.28);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;transition:transform .12s;';
    s.addEventListener('click',function(){
      var pEl=document.querySelector('#mlPromptLine,.prompt-line,#ml-qPrompt,#ml-prompt');
      if(pEl&&typeof window.mlSpeak==='function')window.mlSpeak(pEl.textContent.replace(/\\s+/g,' ').trim());
    });
    s.addEventListener('mouseenter',function(){s.style.transform='scale(1.08)';});
    s.addEventListener('mouseleave',function(){s.style.transform='';});
    document.body.appendChild(s);
  });
})();
</script>`;

// ── OLD mlSpeak (Web Speech only) ────────────────────────────────────────────
const OLD_MLSPEAK =
`function mlSpeak(txt){
 try{
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='ar-SA'; if(mlVoice) u.voice=mlVoice;
  u.rate=.88; u.pitch=1.05;
  speechSynthesis.speak(u);
 }catch(e){}
}`;

// ── NEW mlSpeak (MP3 first, Web Speech fallback) ─────────────────────────────
const NEW_MLSPEAK =
`function mlSpeak(txt){
  if(!txt)return;
  var _src=(window.__NARR_AUDIO__||{})[txt];
  if(_src){var _a=new Audio(_src);_a.onerror=function(){_mlWsSpeak(txt);};_a.play().catch(function(){_mlWsSpeak(txt);});return;}
  _mlWsSpeak(txt);
}
function _mlWsSpeak(txt){
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='ar-SA';if(typeof mlVoice!=='undefined'&&mlVoice)u.voice=mlVoice;u.rate=.88;u.pitch=1.05;speechSynthesis.speak(u);}catch(e){}
}`;

// ── Files to patch ────────────────────────────────────────────────────────────
const FILES = [
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 1.html',
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 2.html',
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 3.html',
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 4.html',
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 5.html',
  'Interactive book for elementary school chapter 3/moosa-chp 3-lesson 6.html',
  'Interactive book for elementary school chapter 4/moosa-chp 4-lesson 1.html',
  'Interactive book for elementary school chapter 4/moosa-chp 4-lesson 2.html',
  'Interactive book for elementary school chapter 4/moosa-chp 4-lesson 3.html',
];

let changed = 0;

for (const rel of FILES) {
  const fpath = path.join(ROOT, rel);
  if (!fs.existsSync(fpath)) { console.log(`SKIP (not found): ${path.basename(rel)}`); continue; }

  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;
  const applied = [];

  // 1. Replace old narrator with new
  if (src.includes(OLD_NARRATOR)) {
    src = src.replace(OLD_NARRATOR, NEW_NARRATOR);
    applied.push('narrator replaced with speaker button');
  } else {
    console.log(`  WARN: old narrator not found in ${path.basename(rel)}`);
  }

  // 2. Upgrade mlSpeak (only if file has it)
  if (src.includes(OLD_MLSPEAK)) {
    src = src.replaceAll(OLD_MLSPEAK, NEW_MLSPEAK);
    applied.push('mlSpeak upgraded to MP3-first');
  }

  // 3. Inject __NARR_AUDIO__ map once (before first <link> or <style> tag)
  const MAP_TAG = `<script>${MAP_JS}</script>`;
  if (!src.includes(MAP_TAG)) {
    // Inject at very start (before anything else in the file)
    src = MAP_TAG + '\n' + src;
    applied.push('__NARR_AUDIO__ map injected');
  }

  if (src !== orig) {
    fs.writeFileSync(fpath, src, 'utf8');
    console.log(`PATCHED: ${path.basename(rel)}`);
    applied.forEach(a => console.log(`  ✓ ${a}`));
    changed++;
  } else {
    console.log(`NO CHANGE: ${path.basename(rel)}`);
  }
}

console.log(`\nDone — ${changed}/${FILES.length} files patched.`);
