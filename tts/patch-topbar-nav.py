#!/usr/bin/env python3
"""
Injects lesson-navigation buttons INTO the amber .top-bar for all lesson files.
- Hides the old dots bar (#ml-dots / #mlDots / .progress-dots) entirely
- Hides the score label/value (replaced by lesson buttons)
- Clears .top-bar and fills it with clickable lesson number buttons
- Skips files that already contain the sentinel /* lesson-topbar-nav */
- ch3 lesson 1 is a fragment (no top-bar); injects a fixed top-bar div first
"""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Sentinel (prevents double-patching) ──────────────────────────────────────
SENTINEL = '/* lesson-topbar-nav */'

# ── Shared CSS (same for all chapters) ───────────────────────────────────────
CSS_BLOCK = """<style>
/* lesson-topbar-nav */
.top-bar{
  padding:8px 12px!important;
  gap:8px!important;
  justify-content:center!important;
}
.top-bar .score-label,.top-bar .score-val{display:none!important;}
.top-bar .lsn-btn{
  min-width:32px;height:32px;
  border-radius:8px;
  background:rgba(255,255,255,.38);
  color:rgba(61,38,16,.75);
  font-size:15px;font-weight:700;font-family:inherit;
  border:2px solid transparent;
  cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;
  padding:0 7px;
  transition:transform .15s,background .15s;
}
.top-bar .lsn-btn.active{
  background:rgba(180,83,9,.22);
  color:#fff;
  border-color:rgba(120,53,5,.55);
  transform:scale(1.08);
}
.top-bar .lsn-btn.done{
  background:rgba(22,163,74,.28);
  color:#fff;
}
.top-bar .lsn-btn:hover{transform:scale(1.12);background:rgba(255,255,255,.55);}
/* hide dots bar entirely */
#ml-dots,#mlDots,.progress-dots{display:none!important;}
</style>"""

# ── JS template — LESSONS_JS_PLACEHOLDER replaced per chapter ────────────────
JS_TEMPLATE = """<script>
(function(){
  var L=LESSONS_JS_PLACEHOLDER;
  function build(){
    var bar=document.querySelector('.top-bar');
    if(bar){
      bar.innerHTML='';
      var cur=decodeURIComponent(window.location.pathname.split('/').pop());
      var ci=L.indexOf(cur);
      L.forEach(function(lf,i){
        var b=document.createElement('button');
        b.className='lsn-btn'+(i===ci?' active':i<ci?' done':'');
        b.textContent=i+1;
        b.addEventListener('click',function(){window.location.href=lf;});
        bar.appendChild(b);
      });
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',build);}
  else{build();}
})();
</script>"""

# ── Extra top-bar div for ch3 L1 (fragment file, no existing top-bar) ────────
CH3_L1_TOPBAR = """<div class="top-bar" style="position:fixed;top:0;left:0;width:100%;z-index:9999;background:linear-gradient(135deg,#F59E0B,#D97706);display:flex;align-items:center;justify-content:center;padding:8px 12px;gap:8px;box-shadow:0 2px 8px rgba(120,60,0,.18);"></div>"""

# ── Chapter lesson lists ──────────────────────────────────────────────────────
CH1 = ['moosa-lesson-classify 1.html','moosa-lesson-classify 2.html',
        'moosa-lesson-classify 3.html','moosa-lesson-classify 4.html',
        'moosa-lesson-classify 5.html']

CH2 = ['moosa-chp 2-lesson 1.html','moosa-chp 2-lesson 2.html',
        'moosa-chp 2-lesson 3.html','moosa-chp 2-lesson 4.html',
        'moosa-chp 2-lesson 5.html','moosa-chp 2-lesson 6.html']

CH3 = ['moosa-chp 3-lesson 1.html','moosa-chp 3-lesson 2.html',
        'moosa-chp 3-lesson 3.html','moosa-chp 3-lesson 4.html',
        'moosa-chp 3-lesson 5.html','moosa-chp 3-lesson 6.html']

CH4 = ['moosa-chp 4-lesson 1.html','moosa-chp 4-lesson 2.html',
        'moosa-chp 4-lesson 3.html']

# ── Files to patch: (relative_path, lesson_list, is_fragment) ────────────────
FILES = [
    # Ch1 L2-5
    ("Interactive book for elementary school chapter 1/moosa-lesson-classify 2.html", CH1, False),
    ("Interactive book for elementary school chapter 1/moosa-lesson-classify 3.html", CH1, False),
    ("Interactive book for elementary school chapter 1/moosa-lesson-classify 4.html", CH1, False),
    ("Interactive book for elementary school chapter 1/moosa-lesson-classify 5.html", CH1, False),
    # Ch2 L1-6
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 1.html", CH2, False),
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 2.html", CH2, False),
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 3.html", CH2, False),
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 4.html", CH2, False),
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 5.html", CH2, False),
    ("Interactive book for elementary school chapter 2/moosa-chp 2-lesson 6.html", CH2, False),
    # Ch3 L1 — fragment file, no top-bar
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 1.html", CH3, True),
    # Ch3 L2-6
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 2.html", CH3, False),
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 3.html", CH3, False),
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 4.html", CH3, False),
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 5.html", CH3, False),
    ("Interactive book for elementary school chapter 3/moosa-chp 3-lesson 6.html", CH3, False),
    # Ch4 L1-3
    ("Interactive book for elementary school chapter 4/moosa-chp 4-lesson 1.html", CH4, False),
    ("Interactive book for elementary school chapter 4/moosa-chp 4-lesson 2.html", CH4, False),
    ("Interactive book for elementary school chapter 4/moosa-chp 4-lesson 3.html", CH4, False),
]

def make_js(lessons):
    ls_js = repr(lessons)  # Python repr uses single quotes, matches JS
    return JS_TEMPLATE.replace('LESSONS_JS_PLACEHOLDER', ls_js)

total = 0

for rel, lessons, is_fragment in FILES:
    fpath = os.path.join(BASE, rel)
    if not os.path.exists(fpath):
        print(f"SKIP (not found): {os.path.basename(rel)}")
        continue

    src = open(fpath, encoding='utf-8').read()

    if SENTINEL in src:
        print(f"SKIP (already patched): {os.path.basename(rel)}")
        continue

    injection = CSS_BLOCK + '\n' + make_js(lessons)
    applied = []

    if is_fragment:
        # ch3 L1: inject top-bar div at start, then CSS+JS at end
        src = CH3_L1_TOPBAR + '\n' + src
        src = src.rstrip() + '\n' + injection + '\n'
        applied.append('top-bar div injected (fragment file)')
        applied.append('CSS + JS appended at end')
    else:
        # Normal files: inject CSS+JS before </body>
        body_pos = src.rfind('</body>')
        if body_pos != -1:
            src = src[:body_pos] + injection + '\n</body>' + src[body_pos + len('</body>'):]
            applied.append('CSS + JS injected before </body>')
        else:
            src = src.rstrip() + '\n' + injection + '\n'
            applied.append('CSS + JS appended (no </body> found)')

    open(fpath, 'w', encoding='utf-8').write(src)
    print(f"PATCHED: {os.path.basename(fpath)}")
    for a in applied:
        print(f"  + {a}")
    total += 1

print(f"\nDone — {total}/{len(FILES)} files patched.")
