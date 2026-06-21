#!/usr/bin/env python3
"""
Fix three narrator bugs across all lesson files:
  1. narEl.style.display='none' → narEl.remove() + null (so speaking-class refs die cleanly)
  2. Remove unlock() touchstart/click listeners (first tap was replaying audio)
  3. MutationObserver now guards on actual question-text change (drag/drop no longer replays)
"""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = [
    "Interactive book for elementary school chapter 1/moosa-lesson-classify 1.html",
    "Interactive book for elementary school chapter 1/moosa-lesson-classify 2.html",
    "Interactive book for elementary school chapter 1/moosa-lesson-classify 3.html",
    "Interactive book for elementary school chapter 1/moosa-lesson-classify 4.html",
    "Interactive book for elementary school chapter 1/moosa-lesson-classify 5.html",
    "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 1.html",
    "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 2.html",
    "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 4.html",
    "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 5.html",
    "Interactive book for elementary school chapter 2/moosa-chp 2-lesson 6.html",
]

# ── Fix 1: hide → remove + null ──────────────────────────────────────────────
OLD_HIDE = "if(narEl) narEl.style.display='none';"
NEW_HIDE = "if(narEl){narEl.remove();narEl=null;}"

# ── Fix 2: remove unlock listeners (exact 3-line block) ──────────────────────
OLD_UNLOCK = (
    "  function unlock(){setTimeout(function(){lastTxt='';readQ();},150);}\n"
    "  document.addEventListener('touchstart',unlock,{once:true,passive:true});\n"
    "  document.addEventListener('click',unlock,{once:true});\n"
)
NEW_UNLOCK = ""  # delete entirely

# ── Fix 3: smart MutationObserver (only re-narrates when question text changes) ──
OLD_MO = (
    "  var root=document.querySelector('.ml-widget')||document.body;\n"
    "  try{new MutationObserver(function(){clearTimeout(debT);debT=setTimeout(function(){lastTxt='';spoken=false;readQ();},400);"
    "}).observe(root,{childList:true,subtree:true,characterData:true});}catch(e){}"
)
NEW_MO = (
    "  var root=document.querySelector('.ml-widget')||document.body;\n"
    "  var _lp='';\n"
    "  try{new MutationObserver(function(){clearTimeout(debT);debT=setTimeout(function(){"
    "var pEl=document.querySelector(SELS.join(','));var nt=pEl?pEl.textContent.replace(/\\s+/g,' ').trim():'';"
    "if(nt&&nt!==_lp){_lp=nt;lastTxt='';spoken=false;readQ();}},400);"
    "}).observe(root,{childList:true,subtree:true,characterData:true});}catch(e){}"
)

PATCHES = [
    ("narEl hide → remove", OLD_HIDE, NEW_HIDE),
    ("unlock listeners removed", OLD_UNLOCK, NEW_UNLOCK),
    ("MutationObserver guarded", OLD_MO, NEW_MO),
]

total_changed = 0

for rel in FILES:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f"  SKIP (not found): {rel}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    dst = src
    applied = []
    for label, old, new in PATCHES:
        if old in dst:
            dst = dst.replace(old, new)
            applied.append(label)
    if dst != src:
        with open(path, "w", encoding="utf-8") as f:
            f.write(dst)
        print(f"  PATCHED: {os.path.basename(rel)}")
        for a in applied:
            print(f"    ✓ {a}")
        total_changed += 1
    else:
        # Check which patches were missing
        for label, old, _ in PATCHES:
            if old not in src:
                print(f"  NOTE: '{label}' pattern not found in {os.path.basename(rel)}")
        print(f"  NO CHANGE: {os.path.basename(rel)}")

print(f"\nDone — {total_changed}/{len(FILES)} files updated.")
