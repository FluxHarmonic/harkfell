// Write the Pipes' Stage 2 listening page (D53, the stone organ) beside tools/pipes-review.sh's WAVs:
//   node tools/pipes-review-page.mjs [build/pipes-listening-d53]
// Measures each WAV with ffmpeg (length, integrated loudness, sample peak) into manifest.json,
// encodes the page's MP3s (mono, 128 kbps; low-bandwidth mode) into DIR/page, and writes
// DIR/page/index.html. Refuses if a WAV is missing. Nothing is published.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'build/pipes-listening-d53';
const items = [
  ['The moments', 'Each as heard in play: the room\'s bed ducked 6 dB under the moment, carrying H2. Every piece is in D Aeolian on the stone organ, and none sounds a D4 before H4 is carried.', [
    ['moment-r', 'R · The Long Pipe (first visit)', 'The chorale, as chosen from sketch B: the tune leaps A3 to A4, falls back to C4 and rests there, then its answer comes down to C4 again over A minor, and the ranks move to a C major chord, held while H4\'s finding tone (one room below, at its in-play level) pulses the D4 the tune is missing.'],
    ['moment-b', 'B · Wind\'s Mouth (first visit)', 'The first Pipes music you hear. The wind rises alone, then fills the ranks one by one (Am, then F); the tune is said once over Dm, C, F/A; the ranks hold B♭ and C, and the wind takes it back to A minor.'],
    ['moment-n', 'N · The Drip Bowl (after 8 s still)', 'Three drops, each answered by a chord in the ranks, quieter each time (Am, F, Dm); then the long rank sings the tune\'s fall, G F E to C4, and a last drop answers. Standing still, so the drone is at its full level here.'],
    ['wander-air-below', 'Air Below (wandering, where the pipes are strong; here in L)', 'Air rising through the ranks: Am F C Gm Am F C Am, the wind on the lip drawing a high line, and the long rank making the leap once and holding it.'],
    ['wander-seep-song', 'Seep Song (wandering, where the water is strong; here in G)', 'The drops are the tune, a slow water clock whose returns fall on the eighth notes; the long rank answers with the fall to C4.'],
    ['home-hollow-octave', 'The bowl · the H4 homecoming', 'The Pipes\' tune made on D: D3 leaps to D4 and, after falling and climbing back, lands on D4 at last, with the stone bells ringing H4\'s own partials (D4 D5 D6). It plays no A and no F#, because you may bring H4 home without H3 or H5. Carrying H2 and H4.'],
  ]],
  ['The cue', 'At its in-play gain, two seconds into the bed of X, the Last Pipe, carrying H2 and H4.', [
    ['pickup-h4', 'H4 taken', 'The stone organ\'s ranks speak H4\'s own partials (D4 D5 A5 D6 F♯6 A6) at their just tuning, a stone bell striking the D4. The old cue\'s F♯6 was on a bell voice that ignores tuning, so it rang 13.7 cents sharp.'],
  ]],
  ['The bed', 'Only the pipe channel changed: a stone rank holding long notes (A3, then F3, C4, E4 and G3 around the loop; never D4) that swell and fade slowly on their own, in place of the noisy breaths. The wind is 2 dB lower, so the bed in B is 2.4 dB quieter than in 0.3, in line with the other regions\' beds. The drips and the drone are as they were.', [
    ['bed-b', 'B · Wind\'s Mouth', 'The loudest Pipes room: wind 0.5, pipes 0.9.'],
    ['bed-n', 'N · The Drip Bowl', 'The wet room: water 0.8, pipes 0.4.'],
  ]],
];

const measure = (f) => String(spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'ebur128=peak=sample', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');
const manifest = {};
const names = items.flatMap(([, , xs]) => xs.flatMap(([k]) => [`now-${k}`, `was-${k}`]));
for (const n of names) {
  const f = path.join(dir, n + '.wav');
  if (!fs.existsSync(f)) throw Error('Missing recording ' + n);
  const frames = fs.readFileSync(f).readUInt32LE(40) / 8;
  const o = measure(f);
  const I = (o.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const P = (o.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  if (!I || !P) throw Error('no measurement for ' + n);
  manifest[n] = { seconds: +(frames / 32000).toFixed(2), lufs: +I.match(/-?[\d.]+/)[0], peak_dbfs: +P.match(/-?[\d.]+/)[0] };
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const pageDir = path.join(dir, 'page');
fs.rmSync(pageDir, { recursive: true, force: true });
fs.mkdirSync(pageDir, { recursive: true });
for (const n of names) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(dir, n + '.wav'), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', path.join(pageDir, n + '.mp3')], { encoding: 'utf8' });
  if (r.status !== 0) throw Error('mp3 encode failed for ' + n + ': ' + r.stderr);
}
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const num = (v) => v.toFixed(1).replace('-', '−');
const meta = (n) => `${manifest[n].seconds} s · ${num(manifest[n].lufs)} LUFS · peak ${num(manifest[n].peak_dbfs)} dBFS`;
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>The Pipes · the stone organ</title>
<style>
body{max-width:46rem;margin:2.5rem auto;padding:0 1rem;background:#191815;color:#ece6d6;font:17px/1.55 system-ui,sans-serif}
h1{font-size:1.9rem;margin-bottom:.2rem}h2{font-size:1.3rem;margin:2.6rem 0 .4rem;color:#9fb8de}
.lede,.sec{color:#c4bdab}p{margin:.35rem 0}article{padding:.8rem 0;border-top:1px solid #3a372f}
h3{font-size:1rem;margin:0}.m{color:#857f70;font-size:.8rem}audio{width:100%;margin-top:.2rem}.v{font-size:.85rem;color:#a39c8a;margin-top:.4rem}
</style>
<h1>The Pipes · the stone organ</h1>
<p class="lede">Direction B, built (D53): every Pipes piece rewritten on the stone organ, the bed's pipe channel turned into a breathing stone rank, and the H4 pickup re-voiced. Each clip is the game's own tune file, rendered as in play, with the 0.3 version under it for comparison. The moments now measure −19.5 to −21.5 LUFS on their own (scripts/gate-pipes-sound), within the other regions' −19.7 to −22.2; in 0.3 they were about 10 dB under.</p>
<p class="lede">Every clip is mono, 32 kHz, made by the game's own instruments through a harness at the 0.22.10 lock, and not loudness-normalised. The finale's Pipes verse is being re-quoted by the Underhum sound worker. These renders leave out the director's distance low-pass on the finding tone, so in play the tone is a little darker than here.</p>
${items.map(([t, d, xs]) => `<h2>${esc(t)}</h2><p class="sec">${esc(d)}</p>${xs.map(([k, title, desc]) => `<article><h3>${esc(title)}</h3><p>${esc(desc)}</p><p class="v">Now</p><audio controls preload="none" src="now-${k}.mp3"></audio><p class="m">${meta('now-' + k)}</p><p class="v">In 0.3</p><audio controls preload="none" src="was-${k}.mp3"></audio><p class="m">${meta('was-' + k)}</p></article>`).join('')}`).join('')}
<p class="m">Generated by tools/pipes-review.sh from tools/pipes-review.jobs, on branch pipes/sound-rethink. The scores are in tools/pipes-compose.mjs. Nothing here is published.</p>
</html>`;
fs.writeFileSync(path.join(pageDir, 'index.html'), html);
console.log(path.resolve(pageDir, 'index.html'), names.length, 'recordings');
