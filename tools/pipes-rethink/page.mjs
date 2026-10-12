// Write the Pipes sound rethink's Stage 1 listening page beside the review WAVs:
//   node tools/pipes-rethink/page.mjs [build/pipes-rethink/review]
// Measures each WAV with ffmpeg (length, integrated loudness, sample peak) into
// manifest.json, and how far H4's finding tone stands out in its own band in each
// Long Pipe mix (the mix with the tone against its no-tone twin, 293.7 Hz, Q 30).
// Refuses if a WAV is missing. Nothing is published.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'build/pipes-rethink/review';
const clips = (k) => [
  [`${k}-hook`, 'The hook'],
  [`${k}-moment-r`, 'R · The Long Pipe (first visit)'],
  [`${k}-bed-b`, 'Bed · B, Wind\'s Mouth'],
  [`${k}-bed-n`, 'Bed · N, The Drip Bowl'],
];
const sections = [
  {
    id: 'now', title: 'Now: the Pipes as shipped in 0.3',
    body: [
      'The bed is fine as a bed. The trouble is that the moments never step out of it:',
      '• The moments use the bed\'s own two instruments: the same drip, and the same breath with a quicker swell. They play the same notes (breaths on A3, C4, E4 and F4; drips on A5, C6 and E6) and the same slow pace. In play, a moment sounds like more of the bed.',
      '• The Long Pipe\'s moment is three breath notes and two drips over 36 seconds: no harmony, no rhythm, and no tune beyond the falling E, C, A. The other four Pipes pieces are built the same way.',
      '• On its own it measures {now-hook} LUFS. The game\'s other moments measure −19.7 to −22.2 rendered the same way, so it is 9 to 12 dB quieter than every moment around it.',
      '• The breaths sit either side of D4, the note of H4\'s finding tone (E4 a step above, C4 a step below), and in R that tone is one room away.',
      '• The bed is louder than the other beds measured so far: {now-bed-b} LUFS in B, its loudest room, against −26.5 in Glasswood\'s crowns, −26.7 in Cloudstair\'s windiest room and −29.4 at Reedfen\'s Reed Bridge.',
      'The "hook" clip below is the Long Pipe\'s moment alone: the falling breath the finale\'s Pipes verse quotes now.',
    ],
  },
  {
    id: 'pa', title: 'A · Breath into song',
    body: [
      'What changes: the breath stays the lead voice, but it sings an eight-bar tune an octave higher (E5 C5 A4, G4 A4 C5, B♭4 A4, then an answer that comes down to E4 and back to A). A soft pitched core under the breath makes each note clear. A pad and a low line move under it through Am, F, C, Gm and Dm: the finale\x27s pad and the low line every homecoming uses. The drips\' two returns fall in time, on the eighth notes.',
      'The bed keeps its notes and timing. Its breath is narrower, so it reads as a pitch rather than a hiss, and it sits about 2 dB under the old bed in B.',
      'Why: the smallest step from what you have. It keeps the falling E, C, A you already know, so the finale\'s Pipes verse only moves up an octave and gains its answering phrase.',
      'The cost: a breath through stone is still a noisy voice, so of the three this is the least clear tune and the most austere. And its low line plays D3 under the Dm chords, whose second harmonic is D4: the finding tone stands {tone:pa-moment-r} dB above this mix in its own band, the least of the three (now: {tone:now-moment-r}). Easy to fix by voicing those chords without D3.',
    ],
  },
  {
    id: 'pb', title: 'B · The stone organ',
    body: [
      'What changes: the carved pipes are an organ nobody plays, and the wind sounds whole chords on it. The tune is on a flue-like voice (an FM tone whose modulator runs at twice the note, which leaves only odd harmonics, like a stopped organ pipe), with wind on its lip and a quieter rank an octave above. Chords swell and breathe under it, with a pedal line. The tune is an octave leap, A3 to A4, that falls back G, F, E and stops on C4, one step under D4. It never lands on D. The moment ends on a C major chord; in R the finding tone\'s D4 is the note that resolves it.',
      'The bed\'s pipe channel becomes one stone rank holding long notes (A3, F3, C4, E4, G3, never D4) that rise and fall with the wind.',
      'Why: it ties the music to H4 the way the other regions tie theirs. Glasswood\'s moments resolve to A, H3\'s note; Cloudstair\'s hold back F#, H5\'s note, until you bring it home. H4 is the octave, so the Pipes\' tune reaches for D4 and can\'t get there until you carry it. At home, hollow-octave would make the leap D3 to D4 and land. In the finale, the Pipes verse can land on D4 at last, because the fused drone carries it.',
      'The cost: the biggest change of the three, and the most solemn. The tune sits in the finding tone\x27s own register, A3 to A4. Measured in the tone\x27s own band, the tone stands {tone:pb-moment-r} dB above this mix, against {tone:now-moment-r} dB now.',
    ],
  },
  {
    id: 'pc', title: 'C · Echoes',
    body: [
      'What changes: the cave answers. A pan pipe (motif\'s fm4-pipe, softened) plays a short tune, A C E, D C A. A bar later its first return comes in, quieter and further back; a bar after that, the second. The tune becomes a round, the way a drip comes back twice. The drips become a slow water clock, with their returns on the eighth notes. Pad and low line stay light.',
      'In the bed, the water carries the texture: drops in short runs of two or three, and fewer, shorter breaths.',
      'Why: the most singable tune of the three, a voice that names the region (pan pipes are pipes blown by breath), and the round is the Pipes\' own acoustic: the bible\'s drips that answer twice. The finale\'s Pipes verse would quote it as a round, which is easy to recognise among the other regions\' verses.',
      'The finding tone stands out most here: {tone:pc-moment-r} dB above the mix in its own band. The cost: the most rhythmic and the least dark. The pan pipe would be a new voice in the score: the other regions\x27 flutes and the finale\x27s glass flute are all softer, plainer flutes.',
    ],
  },
];

const measure = (f) => String(spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'ebur128=peak=sample', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');
const band = (f) => {
  const o = String(spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'bandpass=f=293.66:width_type=q:width=30,bandpass=f=293.66:width_type=q:width=30,astats=measure_perchannel=none:measure_overall=RMS_level', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');
  const m = o.match(/RMS level dB:\s+(-?[\d.]+)/g);
  return m ? +m.pop().match(/-?[\d.]+/)[0] : null;
};
const manifest = {};
for (const s of sections) for (const [n] of clips(s.id)) {
  const f = path.join(dir, n + '.wav');
  if (!fs.existsSync(f)) throw Error('Missing recording ' + n);
  const frames = fs.readFileSync(f).readUInt32LE(40) / 8;
  const o = measure(f);
  const I = (o.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const P = (o.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  manifest[n] = { seconds: +(frames / 32000).toFixed(2), lufs: I ? +I.match(/-?[\d.]+/)[0] : null, peak_dbfs: P ? +P.match(/-?[\d.]+/)[0] : null };
}
for (const s of sections) {
  const withTone = band(path.join(dir, `${s.id}-moment-r.wav`));
  const without = band(path.join(dir, `${s.id}-moment-r-notone.wav`));
  if (withTone === null || without === null) throw Error('band measure failed for ' + s.id);
  manifest[`${s.id}-moment-r`].tone_band_db = +(withTone - without).toFixed(1);
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const fill = (s) => s.replace(/\{(tone:)?([\w-]+)\}/g, (m, t, k) => { if (!manifest[k]) throw Error('no figure ' + k); const v = t ? manifest[k].tone_band_db : manifest[k].lufs; if (v === undefined || v === null) throw Error('no value ' + m); return String(v).replace('-', '−'); });
const clipText = {
  hook: { now: 'The Long Pipe\'s moment alone: E4, C4, A3 on the breath, two drips. This is what the finale\'s Pipes verse quotes now.', pa: 'The breath and its core, alone, with a drip: the first four bars.', pb: 'The leap and the fall to C4 on the flue and its octave rank, with a drip.', pc: 'The tune and its two returns, with the water clock.' },
  'moment-r': 'Over R\'s bed, ducked 6 dB as in play, carrying H2, with H4\'s finding tone one room away (without the director\'s distance low-pass, so the tone is a little brighter here than in play).',
  'bed-b': 'Near the way in: wind 0.5, pipes 0.9.', 'bed-n': 'The wet room: water 0.8, pipes 0.4.',
};
const meta = (n) => { const m = manifest[n]; return `${m.seconds} s · ${String(m.lufs).replace('-', '−')} LUFS · peak ${String(m.peak_dbfs).replace('-', '−')} dBFS${m.tone_band_db !== undefined ? ` · the finding tone stands ${m.tone_band_db} dB above this mix in its own band` : ''}`; };
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>The Pipes · sound rethink</title>
<style>
body{max-width:46rem;margin:2.5rem auto;padding:0 1rem;background:#191815;color:#ece6d6;font:17px/1.55 system-ui,sans-serif}
h1{font-size:1.9rem;margin-bottom:.2rem}h2{font-size:1.3rem;margin:2.6rem 0 .4rem;color:#9fb8de}
.lede,.sec{color:#c4bdab}p{margin:.35rem 0}article{padding:.7rem 0;border-top:1px solid #3a372f}
h3{font-size:1rem;margin:0}.m{color:#857f70;font-size:.8rem}audio{width:100%;margin-top:.35rem}
nav a{color:#9fb8de;margin-right:1rem}
</style>
<h1>The Pipes · sound rethink</h1>
<p class="lede">What the Pipes sound like now, and three directions for them. Each direction has its hook (the region's tune, which the finale's Pipes verse would quote), the Long Pipe's moment in R as you'd hear it in play, and the bed in two rooms. These are sketches. The other Pipes pieces (Wind's Mouth, the Drip Bowl, the two wandering pieces and the H4 homecoming) would be written in whichever direction you pick, and parts of two directions can be combined: B's moments with C's round for the Drip Bowl, for example.</p>
<p class="lede">Every clip is mono, 32 kHz, made by the game's own instruments through a harness at the 0.22.10 lock, at in-play gains, and not loudness-normalised. Try a steady volume first, then a phone speaker.</p>
<nav>${sections.map((s) => `<a href="#${s.id}">${esc(s.title.split(':')[0])}</a>`).join('')}</nav>
${sections.map((s) => `<h2 id="${s.id}">${esc(s.title)}</h2>${s.body.map((p) => `<p class="sec">${esc(fill(p))}</p>`).join('')}${clips(s.id).map(([n, title]) => {
  const kind = n.slice(s.id.length + 1);
  const d = typeof clipText[kind] === 'string' ? clipText[kind] : clipText[kind][s.id];
  return `<article><h3>${esc(title)}</h3><p>${esc(d)}</p><audio controls preload="none" src="${n}.mp3"></audio><p class="m">${meta(n)}</p></article>`;
}).join('')}`).join('')}
<h2>What I'd pick</h2>
<p class="sec">B, with C's round for the Drip Bowl, where the bible already has a drop answering twice. B is the only direction where the Pipes' music is about H4, and that is how Glasswood and Cloudstair work. It also gives the finale's Pipes verse somewhere to go: a tune that has reached for D4 all through the region lands on it under the fused drone. In stage 2 I'd take D3 out of the low line wherever the finding tone can be heard, as A's figures show. I chose all of this by reading scores and measuring renders, not by listening, so please decide by ear.</p>
<p class="sec">Whichever you pick, three fixes come with it: the moments use voices the bed doesn't, they are set to the other regions' moment level, and the Pipes verse in the finale quotes the new hook.</p>
<h2>For comparison</h2>
<p class="sec">The game\'s other moments measure −19.7 to −22.2 LUFS on their own through this renderer (Cloudstair\'s review); Blue Hall measures −22.1 and the H3 homecoming −21.3. Each sketched moment measures about −20 on its own and −19.1 to −19.4 in R with its bed and the finding tone.</p>
<p class="m">Generated by tools/pipes-rethink/review.sh from tools/pipes-rethink/review.jobs and compose.mjs, on branch pipes/sound-rethink. Nothing here is published.</p>
</html>`;
// the hostable page: index.html and mono 128 kbps MP3s (low-bandwidth mode), in DIR/page
const pageDir = path.join(dir, 'page');
fs.mkdirSync(pageDir, { recursive: true });
for (const n of Object.keys(manifest)) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(dir, n + '.wav'), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', path.join(pageDir, n + '.mp3')], { encoding: 'utf8' });
  if (r.status !== 0) throw Error('mp3 encode failed for ' + n + ': ' + r.stderr);
}
fs.writeFileSync(path.join(pageDir, 'index.html'), html);
console.log(path.resolve(dir, 'page', 'index.html'), Object.keys(manifest).length, 'recordings');
