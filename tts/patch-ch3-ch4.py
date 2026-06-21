#!/usr/bin/env python3
"""
Patches ch3/ch4 lesson files:
  1. Removes fNarrator CSS block, div, and old IIFE
  2. Adds speaker button script in their place
  3. Upgrades mlSpeak() to MP3-first
"""
import os, glob, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = sorted(
    glob.glob(os.path.join(BASE, "Interactive book for elementary school chapter 3", "*.html")) +
    glob.glob(os.path.join(BASE, "Interactive book for elementary school chapter 4", "*.html"))
)

# ── Pieces to find and remove/replace ────────────────────────────────────────

# f-narrator CSS block — starts after this comment, ends at closing fnWave keyframe
CSS_START = "/* ── Female Narrator indicator ── */"
CSS_END   = "@keyframes fnWave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}"

# fNarrator div block
DIV_OLD = """<!-- Arabic Female Narrator + animated guide -->
<div id="fNarrator" class="f-narrator" aria-live="polite" aria-label="المرشدة الصوتية">
  <span class="f-narrator-icon">🧕</span>
  <div class="f-narrator-waves">
    <span></span><span></span><span></span><span></span><span></span>
  </div>
</div>"""

# Old narrator IIFE (Web Speech only)
IIFE_OLD = """<script>
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
    for(var i=0;i<SELS.length;i++){var el=document.querySelector(SELS[i]);if(el){var t=el.textContent.replace(/\\s+/g,' ').trim();if(t.length>2){speak(t);return;}}}
  }
  function unlock(){if(unlocked)return;unlocked=true;speechSynthesis.cancel();setTimeout(readQ,200);}
  document.addEventListener('touchstart',unlock,{once:true,passive:true});
  document.addEventListener('click',unlock,{once:true});
  var root=document.querySelector('.ml-widget')||document.body;
  try{new MutationObserver(function(){clearTimeout(debT);debT=setTimeout(readQ,400);}).observe(root,{childList:true,subtree:true,characterData:true});}catch(e){}
  window.addEventListener('load',function(){narEl=document.getElementById('fNarrator');setTimeout(readQ,500);setTimeout(readQ,1500);});
})();
</script>"""

# NEW: minimal speaker button script (replaces the fNarrator div + old IIFE together)
SPEAKER_BTN = """<script>
(function(){
  var n=document.getElementById('fNarrator');if(n)n.remove();
  window.addEventListener('load',function(){
    if(document.getElementById('mlSpeakerBtn'))return;
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
</script>"""

# Use proper Unicode for the emoji in the actual string
SPEAKER_BTN = SPEAKER_BTN.replace('🔊', '🔊').replace(
    'استمع مجدداً', 'استمع مجدداً')

# ── mlSpeak upgrade ───────────────────────────────────────────────────────────
OLD_MLSPEAK = """function mlSpeak(txt){
 try{
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='ar-SA'; if(mlVoice) u.voice=mlVoice;
  u.rate=.88; u.pitch=1.05;
  speechSynthesis.speak(u);
 }catch(e){}
}"""

NEW_MLSPEAK = """function mlSpeak(txt){
  if(!txt)return;
  var _src=(window.__NARR_AUDIO__||{})[txt];
  if(_src){var _a=new Audio(_src);_a.onerror=function(){_mlWsSpeak(txt);};_a.play().catch(function(){_mlWsSpeak(txt);});return;}
  _mlWsSpeak(txt);
}
function _mlWsSpeak(txt){
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='ar-SA';if(typeof mlVoice!=='undefined'&&mlVoice)u.voice=mlVoice;u.rate=.88;u.pitch=1.05;speechSynthesis.speak(u);}catch(e){}
}"""

# ── Process each file ─────────────────────────────────────────────────────────
total = 0

for f in FILES:
    src = open(f, encoding='utf-8').read()
    dst = src
    applied = []

    # 1. Remove f-narrator CSS block (from CSS_START to CSS_END inclusive)
    i_start = dst.find(CSS_START)
    i_end   = dst.find(CSS_END)
    if i_start != -1 and i_end != -1:
        # Remove the whole block including surrounding newlines
        block = dst[i_start : i_end + len(CSS_END)]
        dst = dst.replace(block, '', 1)
        applied.append('f-narrator CSS removed')

    # 2. Remove fNarrator div
    if DIV_OLD in dst:
        dst = dst.replace(DIV_OLD, '', 1)
        applied.append('fNarrator div removed')

    # 3. Replace old narrator IIFE with speaker button
    if IIFE_OLD in dst:
        dst = dst.replace(IIFE_OLD, SPEAKER_BTN, 1)
        applied.append('narrator IIFE → speaker button')

    # 4. Upgrade mlSpeak if present
    if OLD_MLSPEAK in dst:
        dst = dst.replace(OLD_MLSPEAK, NEW_MLSPEAK)
        applied.append('mlSpeak → MP3-first')

    if dst != src:
        open(f, 'w', encoding='utf-8').write(dst)
        print(f"PATCHED: {os.path.basename(f)}")
        for a in applied: print(f"  ✓ {a}")
        total += 1
    else:
        missing = []
        if CSS_START not in src: missing.append('CSS_START')
        if DIV_OLD   not in src: missing.append('fNarrator div')
        if IIFE_OLD  not in src: missing.append('IIFE')
        print(f"NO CHANGE: {os.path.basename(f)}" + (f"  (missing: {', '.join(missing)})" if missing else ""))

print(f"\nDone — {total}/{len(FILES)} files patched.")
