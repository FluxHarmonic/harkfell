// Generate the local review page beside tools/pipes-recordings.sgl's WAVs.
// node tools/pipes-listening.mjs [artifact directory]
import fs from 'node:fs';
import path from 'node:path';
const dir=process.argv[2] || 'build/pipes-listening';
const tracks=[
 ['bed-full-cycle-mono','Full bed · 100 seconds','A3, E4, C4, a quieter occasional F4, then A3 again across the loop.'],
 ['bed-h2-mono','Bed with H2','Compare with the next two clips at the same volume.'],
 ['bed-h2-h4-mono','Bed with H2 and H4','The D4 octave joins the carried voice, without needing H3.'],
 ['bed-h2-h3-h4-mono','Bed with all three','Check that H4 remains audible beneath the H3 fifth.'],
 ['search-j-mono','H4 search near J','Mono comparison at the estimated J distance; stop and listen in play for final acceptance.'],
 ['wind-in-stone','B · Wind in Stone','First visit.'], ['three-echoes','N · Three Echoes','After eight seconds still.'],
 ['the-pipes-breathe','R · The Pipes Breathe','First visit.'], ['air-below','Air Below','Wanders where pipes ≥ 0.6.'],
 ['seep-song','Seep Song','Wanders where water ≥ 0.6.'], ['hollow-octave','Home · Hollow Octave','H4 homecoming, ordered after the existing moments.'],
 ['pickup-h4','H4 pickup','D4 and its rising partials.'], ['snail-scrape','Snail before H4','Quiet chalk scrape.'],
 ['snail-h4','Snail after H4','Short D4 shell response.'], ['static-crackle','Static · dry warning','Compare this crisp source with the water echoes; warning persists under moments.'],
 ['warning-under-moment-mono','Static beneath a moment','The dry source stays present while Wind in Stone plays.'],
 ['exit-low','Low opening','Unpitched hollow air.'], ['exit-high','High opening','Unpitched thin hiss.']
];
for(const [name] of tracks)if(!fs.existsSync(path.join(dir,name+'.wav')))throw Error('Missing recording '+name);
const provenance=fs.existsSync(path.join(dir,'provenance.txt'))?fs.readFileSync(path.join(dir,'provenance.txt'),'utf8'):'Renderer provenance pending.';
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pipes · sound review</title><style>body{max-width:48rem;margin:3rem auto;padding:0 1rem;background:#151513;color:#eee9d8;font:18px/1.5 system-ui}h1{font-size:2rem}article{padding:1rem 0;border-top:1px solid #555}h2{font-size:1.1rem;margin:0}p{color:#c8c4b9}audio{width:100%}pre{font-size:.8rem;white-space:pre-wrap}</style><h1>The Pipes · sound review</h1><p>Local, mono recordings for David. Use a steady playback volume, then try a phone speaker. The three bed clips share the same room mix and synthesis start. No clip is loudness normalized. Standalone moments and cues demonstrate their materials; their in-game gain, hush and spatial routing still need a play audition.</p><p>Listen for dry static before the jump, the low/high exit contrast, water answering twice or three times, and H4 remaining distinct at J and after pickup. These recordings do not certify the no-H3 route or phone performance.</p><details><summary>Renderer and source provenance</summary><pre>${escape(provenance)}</pre></details>${tracks.map(([n,t,d])=>`<article><h2>${t}</h2><p>${d}</p><audio controls preload="none" src="${n}.wav"></audio></article>`).join('')}<p>Open this file locally, or serve this directory with a local static server. Nothing has been published.</p></html>`);
console.log(path.resolve(dir,'index.html'));
