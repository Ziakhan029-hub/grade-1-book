'use strict';
/**
 * Generates Arabic MP3s for ch3 & ch4 lesson prompts using Azure TTS
 * (ar-AE-FatimaNeural, uaenorth region).
 *
 * Usage:
 *   AZURE_SPEECH_KEY=<key> node tts/generate-ch3-ch4-audio.js
 * or put AZURE_SPEECH_KEY in a .env file.
 */

require('dotenv').config();
const sdk   = require('microsoft-cognitiveservices-speech-sdk');
const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');

const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = 'uaenorth';
const VOICE  = 'ar-AE-FatimaNeural';

if (!KEY) { console.error('Set AZURE_SPEECH_KEY in env or .env'); process.exit(1); }

const ROOT     = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const MAP_PATH  = path.join(__dirname, 'audio-map.json');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

// ── All new prompts for ch3 and ch4 ──────────────────────────────────────────
const PROMPTS = [
  // ch3 L2 — press-zone spot lessons (prompt-line texts)
  'اضغط على القطعة في',
  'اضغط على الصندوق في',
  'اضغط على الزهرة في',
  'اضغط على القبعة في',
  'اضغط على الوسادة في',
  'اضغط على العلبة في',
  // ch3 L2 — sayPrompt sub-prompts (mlSpeak calls)
  'اضغط على الأعلى',
  'اضغط على الوسط',
  'اضغط على الأسفل',

  // ch3 L3 — before/after animal prompts (full assembled strings)
  'اضغط على الديك الذي يسير قبل الكتكوت',
  'اضغط على الطائر الذي يسير بعد الكتكوت',
  'اضغط على الطير الذي يسير قبل الضفدع',
  'اضغط على الحيوان الذي يسير بعد الضفدع',
  'اضغط على الحيوان الذي يسير قبل الماعز',
  'اضغط على الحيوان الذي يسير بعد الماعز',
  'اضغط على الخروف الذي يسير قبل الخروف الأسود',
  'اضغط على الخروف الذي يسير بعد الخروف الأسود',
  'اضغط على الطائر الذي يطير قبل الطائر الأزرق',
  'اضغط على الطائر الذي يطير بعد الطائر الأزرق',
  'اضغط على الحصان الذي يجري قبل الأحصنة الأخرى',
  'اضغط على الحصان الذي يجري بعد الأحصنة الأخرى',

  // ch3 L4 — colour pattern prompts
  'لوّن المربعات مثل النمط: أزرق، أصفر',
  'أنشئ النمط: بنفسجي، برتقالي',
  'أنشئ النمط: أخضر، أحمر',
  'لوّن المربعات مثل النمط: أخضر، أزرق',
  'أنشئ النمط: أصفر، أحمر',

  // ch3 L5 — button pattern prompts
  'ما الزر التالي في النمط؟',
  'أنشئ النمط بالأزرار: مربع أصفر، دائرة زرقاء',

  // ch3 L6 — colour-another-way prompts
  'انظر إلى النمط ثم لوّن الدوائر لتعرضه بطريقة أخرى',
  'انظر إلى النمط ثم لوّن النجوم لتعرضه بطريقة أخرى',

  // ch4 L1 — count and choose/colour (6-8)
  'عُدَّ البالونات ثم اختر العدد',
  'عُدَّ الأطباق ثم أكمل ليصبح عددها ثمانية',
  'عُدَّ الأبواق ثم اختر العدد',
  'عُدَّ الهدايا ثم اختر العدد',
  'عُدَّ العلب ثم لوّن المربعات حسب عددها',
  'عُدَّ القبعات ثم لوّن المربعات حسب عددها',
  'عُدَّ الأكواب ثم لوّن المربعات حسب عددها',

  // ch4 L2 — count and write (6-8)
  'عُدَّ أقراص البسكويت ثم اكتب العدد',
  'عُدَّ الأقلام ثم اكتب العدد',
  'عُدَّ قطع الحلوى ثم اكتب العدد',
  'ارسم ثماني كرات في المربعات ثم اكتب العدد ثمانية',
  'ارسم سبع كرات في المربعات ثم اكتب العدد سبعة',
  'ارسم ست كرات في المربعات ثم اكتب العدد ستة',
  'عُدَّ مشابك الشعر ثم اكتب العدد',

  // ch4 L3 — count and circle (9-10)
  'عُدَّ الديدان في كل صف',
  'عُدَّ الأعشاش في كل صف',
  'عُدَّ الجِمال في كل مجموعة',
  'عُدَّ الريشات في كل مجموعة',
  'عُدَّ المظلات ثم أكمل ليصبح عددها عشرة',
  'عُدَّ الأشجار ثم أكمل ليصبح عددها تسعة',
  'عُدَّ بيوت الطيور في كل مجموعة',
  'حوّط المجموعة التي عددها ستة',
  'حوّط المجموعة التي عددها سبعة',
  'حوّط المجموعة التي عددها ثمانية',
  'حوّط المجموعة التي عددها تسعة',
  'حوّط المجموعة التي عددها عشرة',

  // Number confirmations (AR_WORD + '! أحسنت')
  'ستة! أحسنت',
  'سبعة! أحسنت',
  'ثمانية! أحسنت',
  'تسعة! أحسنت',
  'عشرة! أحسنت',
  'ستة!',
  'سبعة!',
  'ثمانية!',
  'تسعة!',
  'عشرة!',

  // Shared praise
  'أحسنت! رائع!',
  'أحسنت! رائع جداً!',
];

const existingMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

function synthesize(text) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
    const outPath = path.join(AUDIO_DIR, `${hash}.mp3`);
    const relPath = `audio/${hash}.mp3`;

    if (fs.existsSync(outPath)) {
      console.log(`  SKIP (exists): ${hash} — ${text.slice(0, 40)}`);
      return resolve({ text, relPath });
    }

    const cfg  = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    cfg.speechSynthesisVoiceName = VOICE;
    cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synth = new sdk.SpeechSynthesizer(cfg, sdk.AudioConfig.fromAudioFileOutput(outPath));
    synth.speakTextAsync(text,
      result => {
        synth.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log(`  OK: ${hash} — ${text.slice(0, 50)}`);
          resolve({ text, relPath });
        } else {
          fs.existsSync(outPath) && fs.unlinkSync(outPath);
          reject(new Error(`Azure error: ${result.errorDetails}`));
        }
      },
      err => { synth.close(); reject(err); }
    );
  });
}

(async () => {
  const toGenerate = PROMPTS.filter(p => !existingMap[p]);
  console.log(`Generating ${toGenerate.length} new MP3s (${PROMPTS.length - toGenerate.length} already cached)...`);

  for (const text of toGenerate) {
    try {
      const { relPath } = await synthesize(text);
      existingMap[text] = relPath;
      fs.writeFileSync(MAP_PATH, JSON.stringify(existingMap, null, 2), 'utf8');
    } catch (e) {
      console.error(`  FAIL: ${text}\n  ${e.message}`);
    }
  }
  console.log(`\nDone. audio-map.json updated with ${Object.keys(existingMap).length} entries.`);
})();
