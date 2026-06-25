'use strict';require('dotenv').config();
const sdk=require('microsoft-cognitiveservices-speech-sdk'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const KEY=process.env.AZURE_SPEECH_KEY,REGION='uaenorth',VOICE='ar-AE-FatimaNeural';if(!KEY){console.error('no key');process.exit(1);}
const AD=path.join(__dirname,'..','audio');
const T=['عُدّ القرود في الصورة، اضغط على كل واحد','عُدّ الفقمات في الصورة، اضغط على كل واحدة','عُدّ الحيوانات في الصورة، اضغط على كل واحد','عُدّ صولجانات المهرّج، اضغط على كل واحد','عُدّ القبعات الملوّنة، اضغط على كل واحدة','عُدّ قطع البسكويت، اضغط على كل واحدة'];
const h=t=>crypto.createHash('md5').update(t).digest('hex').slice(0,8);
function sp(t){return new Promise((res,rej)=>{const o=path.join(AD,h(t)+'.mp3');if(fs.existsSync(o)){console.error('skip '+t);return res();}const c=sdk.SpeechConfig.fromSubscription(KEY,REGION);c.speechSynthesisVoiceName=VOICE;c.speechSynthesisOutputFormat=sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;const sy=new sdk.SpeechSynthesizer(c,null);sy.speakTextAsync(t,r=>{sy.close();if(r.reason===sdk.ResultReason.SynthesizingAudioCompleted){fs.writeFileSync(o,Buffer.from(r.audioData));console.error('OK '+t);res();}else rej(new Error(r.errorDetails));},e=>{sy.close();rej(e);});});}
(async()=>{for(const t of T)await sp(t);const m={};for(const t of T)m[t]='../audio/'+h(t)+'.mp3';process.stdout.write('MAP_JSON='+JSON.stringify(m)+'\n');})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
