#!/usr/bin/env python3
"""
Replaces the progress-dots bar with clickable LESSON numbers.
Clicking a number navigates to that lesson in the same chapter.

Current-lesson detection: window.location.pathname.split('/').pop()
so the same renderDots body works for all lessons in a chapter.
"""
import os, re, glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── chapter lesson lists ──────────────────────────────────────────────────────
CH1_LESSONS = ['moosa-lesson-classify 1.html','moosa-lesson-classify 2.html',
                'moosa-lesson-classify 3.html','moosa-lesson-classify 4.html',
                'moosa-lesson-classify 5.html']

CH2_LESSONS = ['moosa-chp 2-lesson 1.html','moosa-chp 2-lesson 2.html',
                'moosa-chp 2-lesson 3.html','moosa-chp 2-lesson 4.html',
                'moosa-chp 2-lesson 5.html','moosa-chp 2-lesson 6.html']

CH3_LESSONS = ['moosa-chp 3-lesson 1.html','moosa-chp 3-lesson 2.html',
                'moosa-chp 3-lesson 3.html','moosa-chp 3-lesson 4.html',
                'moosa-chp 3-lesson 5.html','moosa-chp 3-lesson 6.html']

CH4_LESSONS = ['moosa-chp 4-lesson 1.html','moosa-chp 4-lesson 2.html',
                'moosa-chp 4-lesson 3.html']

# ── CSS override (injected once; unchanged from previous patch) ───────────────
CSS_SENTINEL = '/* progress number buttons */'
CSS_OVERRIDE = """<style>
/* progress number buttons */
.dot,.ml-dot,.round-dot{
  width:auto!important;min-width:28px!important;height:28px!important;
  border-radius:7px!important;
  background:rgba(61,38,16,.12)!important;
  font-size:13px!important;font-weight:700!important;
  color:rgba(61,38,16,.45)!important;
  cursor:pointer!important;
  border:2px solid transparent!important;
  display:inline-flex!important;
  align-items:center!important;justify-content:center!important;
  padding:0 5px!important;
  transform:none!important;
}
.dot.active,.ml-dot.active,.round-dot.active{
  background:#F59E0B!important;color:#fff!important;
  border-color:#B45309!important;transform:scale(1.08)!important;
}
.dot.done,.ml-dot.done,.round-dot.done{
  background:#10B981!important;color:#fff!important;opacity:1!important;
}
.dot:hover,.ml-dot:hover,.round-dot:hover{transform:scale(1.12)!important;}
</style>"""

# ── helper: extract the complete renderDots function from source ──────────────
def extract_render_dots(src):
    """Return (start, end) char positions of the renderDots function body."""
    m = re.search(r'function renderDots\s*\(\s*\)\s*\{', src)
    if not m:
        return None, None
    depth = 0
    i = m.start()
    for j in range(m.start(), len(src)):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                return m.start(), j + 1
    return None, None

# ── build new renderDots body for each file ───────────────────────────────────
def make_render_dots(el_expr, dot_class, lessons, extra_tail=''):
    """
    el_expr   – JS expression that returns the container element
    dot_class – CSS class name for each button ('dot', 'ml-dot', 'round-dot')
    lessons   – list of filenames (same chapter)
    extra_tail – any extra JS to append inside the function (e.g. score update)
    """
    ls_js = repr(lessons).replace("'", "'")   # keep single quotes
    # build as a clean multi-line string
    return (
        "function renderDots(){"
        f"var _c={el_expr};_c.innerHTML='';"
        f"var _l={ls_js};"
        "var _cur=window.location.pathname.split('/').pop();"
        "var _ci=_l.indexOf(_cur);"
        "for(var _i=0;_i<_l.length;_i++){"
        "(function(lf,i){"
        f"var b=document.createElement('button');"
        f"b.className='{dot_class}'+(i===_ci?' active':i<_ci?' done':'');"
        "b.textContent=i+1;"
        "b.addEventListener('click',function(){window.location.href=lf;});"
        "_c.appendChild(b);"
        "})(_l[_i],_i);}"
        + extra_tail +
        "}"
    )

# ── per-file configuration ────────────────────────────────────────────────────
# (glob_pattern, el_expr, dot_class, lessons, extra_tail)
FILE_CONFIGS = [
    # ch1 classify 2 — el('dots') / dot
    (
        "Interactive book for elementary school chapter 1/moosa-lesson-classify 2.html",
        "el('dots')", "dot", CH1_LESSONS, ""
    ),
    # ch2 L1 — el('dots') / dot  +  score update
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 1.html",
        "el('dots')", "dot", CH2_LESSONS,
        "el('scoreVal').textContent=toAr(score);"
    ),
    # ch2 L2, L4, L6 — g('dots') / ml-dot
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 2.html",
        "g('dots')", "ml-dot", CH2_LESSONS, ""
    ),
    # ch2 L3 — el('dots') / dot
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 3.html",
        "el('dots')", "dot", CH2_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 4.html",
        "g('dots')", "ml-dot", CH2_LESSONS, ""
    ),
    # ch2 L5 — roundRow / round-dot
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 5.html",
        "document.getElementById('roundRow')", "round-dot", CH2_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 6.html",
        "g('dots')", "ml-dot", CH2_LESSONS, ""
    ),
    # ch3 L2-6 — mlEl('mlDots') / dot
    (
        "Interactive book for elementary school chapter 3/moosa-chp 3-lesson 2.html",
        "mlEl('mlDots')", "dot", CH3_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 3/moosa-chp 3-lesson 3.html",
        "mlEl('mlDots')", "dot", CH3_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 3/moosa-chp 3-lesson 4.html",
        "mlEl('mlDots')", "dot", CH3_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 3/moosa-chp 3-lesson 5.html",
        "mlEl('mlDots')", "dot", CH3_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 3/moosa-chp 3-lesson 6.html",
        "mlEl('mlDots')", "dot", CH3_LESSONS, ""
    ),
    # ch4 L1-3 — mlEl('mlDots') / dot
    (
        "Interactive book for elementary school chapter 4/moosa-chp 4-lesson 1.html",
        "mlEl('mlDots')", "dot", CH4_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 4/moosa-chp 4-lesson 2.html",
        "mlEl('mlDots')", "dot", CH4_LESSONS, ""
    ),
    (
        "Interactive book for elementary school chapter 4/moosa-chp 4-lesson 3.html",
        "mlEl('mlDots')", "dot", CH4_LESSONS, ""
    ),
]

# ── process files ─────────────────────────────────────────────────────────────
total = 0

for rel, el_expr, dot_class, lessons, extra_tail in FILE_CONFIGS:
    fpath = os.path.join(BASE, rel)
    if not os.path.exists(fpath):
        print(f"SKIP (not found): {os.path.basename(rel)}")
        continue

    src = open(fpath, encoding='utf-8').read()
    applied = []

    # 1. Replace renderDots
    start, end = extract_render_dots(src)
    if start is not None:
        new_fn = make_render_dots(el_expr, dot_class, lessons, extra_tail)
        src = src[:start] + new_fn + src[end:]
        applied.append('renderDots → lesson navigation')
    else:
        print(f"WARN: renderDots not found in {os.path.basename(rel)}")

    # 2. Inject CSS override if not already present
    if CSS_SENTINEL not in src:
        if '</body>' in src:
            src = src.replace('</body>', CSS_OVERRIDE + '\n</body>', 1)
        else:
            src = src.rstrip() + '\n' + CSS_OVERRIDE + '\n'
        applied.append('CSS override injected')

    open(fpath, 'w', encoding='utf-8').write(src)
    print(f"PATCHED: {os.path.basename(fpath)}")
    for a in applied:
        print(f"  ✓ {a}")
    total += 1

print(f"\nDone — {total}/15 files patched.")
