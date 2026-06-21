'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { synthesize } = require('./index');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(__dirname, '..');

// ── Extract all narrated strings from lesson files ──────────────────────────
const LESSON_FILES = [
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 1.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 2.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 3.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 4.html',
  'Interactive book for elementary school chapter 1/moosa-lesson-classify 5.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 1.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 2.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 3.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 4.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 5.html',
  'Interactive book for elementary school chapter 2/moosa-chp 2-lesson 6.html',
];

function extractTexts(src) {
  const texts = new Set();

  // Standalone prompts: prompt: 'text'
  for (const m of src.matchAll(/prompt\s*:\s*['"]([^'"]+)['"]/g)) texts.add(m[1]);

  // Drag combos: prompt + '. ' + rule  (lesson 3 pattern)
  const promptRuleRe = /prompt\s*:\s*['"]([^'"]+)['"][^}]*?rule\s*:\s*['"]([^'"]+)['"]/gs;
  for (const m of src.matchAll(promptRuleRe)) texts.add(`${m[1]}. ${m[2]}`);

  return texts;
}

const allTexts = new Set();
for (const rel of LESSON_FILES) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const t of extractTexts(src)) allTexts.add(t);
}

// ── Generate MP3s ────────────────────────────────────────────────────────────
const AUDIO_DIR = path.join(ROOT, 'audio');
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const map = {};

async function main() {
  const texts = [...allTexts];
  console.log(`Generating ${texts.length} audio files…\n`);

  for (const text of texts) {
    const hash = crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
    const filename = `${hash}.mp3`;
    const outPath  = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(outPath)) {
      console.log(`  skip  ${filename}  "${text}"`);
    } else {
      console.log(`  gen   ${filename}  "${text}"`);
      await synthesize(text, outPath);
    }
    map[text] = `audio/${filename}`;
  }

  const mapPath = path.join(__dirname, 'audio-map.json');
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
  console.log(`\nDone. ${texts.length} files in audio/  Map → tts/audio-map.json`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
