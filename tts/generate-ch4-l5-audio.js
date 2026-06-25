'use strict';
require('dotenv').config();
const sdk=require('microsoft-cognitiveservices-speech-sdk'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const KEY=process.env.AZURE_SPEECH_KEY,REGION='uaenorth',VOICE='ar-AE-FatimaNeural';
if(!KEY){console.error('no key');process.exit(1);}
const AUDIO_DIR=path.join(__dirname,'..','audio');
const TEXTS=[
 'ارسم ثمانية أشياء، المس اللوحة',
 'ارسم تسعة أشياء، المس اللوحة',
 'ارسم عشرة أشياء، المس اللوحة',
 'ارسم سبعة أشياء، المس اللوحة',
 'ارسم ستة أشياء، المس اللوحة',
];
const hash=t=>crypto.createHash('md5').update(t).digest('hex').slice(0,8);
function speak(txt){return new Promise((res,rej)=>{const out=path.join(AUDIO_DIR,hash(txt)+'.mp3');
 if(fs.existsSync(out)){console.error('skip '+txt);return res();}
 const cfg=sdk.SpeechConfig.fromSubscription(KEY,REGION);cfg.speechSynthesisVoiceName=VOICE;
 cfg.speechSynthesisOutputFormat=sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
 const syn=new sdk.SpeechSynthesizer(cfg,null);
 syn.speakTextAsync(txt,r=>{syn.close();if(r.reason===sdk.ResultReason.SynthesizingAudioCompleted){fs.writeFileSync(out,Buffer.from(r.audioData));console.error('OK '+txt);res();}else rej(new Error(r.errorDetails));},e=>{syn.close();rej(e);});});}
(async()=>{for(const t of TEXTS)await speak(t);const m={};for(const t of TEXTS)m[t]='../audio/'+hash(t)+'.mp3';process.stdout.write('MAP_JSON='+JSON.stringify(m)+'\n');})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
