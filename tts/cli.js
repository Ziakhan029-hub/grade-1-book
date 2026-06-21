#!/usr/bin/env node
'use strict';

/**
 * CLI entry point for the Arabic TTS module.
 *
 * Usage:
 *   node tts/cli.js <arabic-text> <output.mp3>
 *   node tts/cli.js "مرحبا بالعالم" audio/hello.mp3
 *
 * The script reads GCLOUD_TTS_KEY_JSON or GOOGLE_APPLICATION_CREDENTIALS
 * from the environment (or a .env file if dotenv is present).
 */

// Load .env if dotenv is installed (optional – won't crash if missing)
try { require('dotenv').config(); } catch (_) {}

const { synthesize } = require('./index');

const [,, text, outputPath] = process.argv;

if (!text || !outputPath) {
  console.error('Usage: node tts/cli.js "<arabic text>" <output.mp3>');
  process.exit(1);
}

synthesize(text, outputPath)
  .then(abs => console.log(`Written: ${abs}`))
  .catch(err => { console.error('TTS error:', err.message); process.exit(1); });
