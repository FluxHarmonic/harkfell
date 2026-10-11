// Write the Cloudstair sound review page beside tools/cloudstair-render.sgl's WAVs:
//   node tools/cloudstair-review-page.mjs [build/cloudstair-listening-opus]
// Run by tools/cloudstair-review.sh. Measures each WAV with ffmpeg (length,
// sample peak, integrated loudness) into manifest.json; refuses if a WAV is missing.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'build/cloudstair-listening-opus';
const sections = [
  ['The moments', 'Each as heard in play: the room\'s bed ducked 6 dB under it. D Mixolydian with its third held back: no F# sounds in Cloudstair before H5 is found, because F# is H5\'s note. The third arrives in the bowl\'s homecoming, at H5\'s own tuning.', [
    ['moment-s-above-the-cloud', 'S · Above the Cloud (first visit)', 'The lift\'s air thins while sun bells climb out of the cloud, then a high flute in 3/4 over Dsus2, C/D, G/D, C, Am7, G, C, Dsus4, C, D. The second phrase climbs to C6, the flat seventh, at the top of the sky, and lands on an open D.'],
    ['moment-q-the-last-grass', 'Q · The Last Grass (first visit)', 'A short wind phrase. The wind comes up over the grass, a near flute calls into the open sky, and a far flute across the gap answers its last figure as the wind returns. Settles on D through C, the Mixolydian cadence.'],
    ['moment-n-low-cloud', 'N · Low Cloud (after 8 s still)', 'The cloud\'s breath swells over the hollow; a few slow bells come and go like sun on the stone over a soft chorale on a D pedal, with seed-harp figures falling under them. The cloud passes once more at the end.'],
    ['wander-thermals', 'Thermals (wandering, open-sky rooms)', 'Seeds circling up on warm air: a seed harp turns up and down each chord in 6/8, a flute sings over it, and a second flute takes up its first phrase a fourth lower a bar behind, a canon.'],
    ['home-hollow-third', 'The bowl · hollow-third (H5 homecoming)', 'After hollow-octave, carrying H5 (here with H2, H3, H4). Stone bells ring up H5\'s own series (F#4 F#5 C#6 F#6), then a glass flute sings D, G, Em, G, D and rises to rest on F#5, the third. Every F# is at H5\'s just tuning, so it sits on the carried drone without beating.'],
    ['home-hollow-third-no-h3', 'The bowl · hollow-third without H3', 'The same, carrying H2, H4 and H5 only. The homecoming plays no A anywhere, so a player without H3 hears no H3 reward.'],
  ]],
  ['The gust', 'One 10 s cycle on the simulation\'s clock: calm, then a narrow breath drawn in and rising for the last second of calm (the warning, the same everywhere), then a broad rush for the four seconds of gust. In play the source starts at the physics\' phase: walk in mid-gust and you hear the rush, not a warning. Here the source is at its in-play gain over each room\'s bed.', [
    ['gust-m-lift', 'M · the pulsed lift, three cycles', 'Wait on the shelf; listen for the in-breath at 5 s, 15 s and 25 s, and launch with the rush. Measured: the warning clears this bed by about 7 dB.'],
    ['gust-i-gap', 'I · the eastward gust over the gap, with the gap\'s draught', 'The rush here is lower and buffeting, with a high streaming hiss. Under it, near the bank, the deep gap breathes a low steady draught in both phases. The warning clears this windier bed by about 4 dB.'],
    ['moment-s-with-gust', 'S · the warning under Above the Cloud', 'The hardest case: the warning has to be heard through S\'s moment. In play the moment also dips 3 dB for the warning and the rush\'s first second; this mix has the moment 1.4 dB down throughout instead. Listen for the in-breath at 5, 15, 25 and 35 s.'],
    ['gust-lift-cycle', 'The lifts\' cycle alone', 'Warning at 5.0 s, rush at 6.0 s, released as calm returns.'],
    ['gust-east-cycle', 'The gaps\' cycle alone', 'The same warning; a different rush.'],
    ['gap-depth', 'The deep gaps\' draught alone', 'Steady, low and narrow, where the gust is broad, bright and timed.'],
  ]],
  ['The bed', 'Wind over the cliffs, falls far below the cloud, and the air rising in the lift columns, a breath resonating on a slowly changing note (E5 G5 B5 D6 E6; never F#, never A, so nothing in it passes for a finding tone). The drone is the same five voices as every region\'s. Carrying H2 and H4, the drone at its moving level unless noted.', [
    ['bed-q-open', 'Q · open: the last grass', 'Wind 0.8, air 0.5.'],
    ['bed-n-sheltered', 'N · sheltered: low cloud', 'Wind 0.3, no air. The quietest room in the region.'],
    ['bed-m-h2-h4', 'M · standing still, H2 and H4', 'Compare with the next clip at the same volume.'],
    ['bed-m-h2-h4-h5', 'M · standing still, H2, H4 and H5', 'The major third enters the carried hum.'],
    ['bed-full-loop', 'The whole 90 s loop, in M', 'The column air changes note five times; it should read as air in the rock, not a tune.'],
  ]],
  ['Finding H5', 'The rose note from V, by the existing straight-line rule (a tone fades to nothing between 3 and 3.5 rooms). H is about 2.8 rooms from V, S about 3. These mixes leave out the director\'s distance low-pass, so the tone here is brighter than in play.', [
    ['search-h-moving', 'H · moving', 'The tone at its gain 2.8 rooms away, the bed at full.'],
    ['search-h-still', 'H · standing still', 'Bed down 6 dB, the tone forward 4 dB, the drone up: the stillness that raises the ears.'],
    ['search-s-still', 'S · standing still', 'Three rooms away, above the cloud.'],
  ]],
  ['The seeds and the cues', 'Each cue at its in-play gain.', [
    ['seeds-before-h5', 'K · seeds before H5', 'Sparse dry husk clicks and an airy chirr.'],
    ['seeds-after-h5', 'K · seeds after H5', 'Now and then a brief answer, F#5 to A5 or back, at H5\'s tuning, above the finding register.'],
    ['cue-pickup-h5', 'H5 taken', 'H5\'s own partials rising, 5 10 15 20 25 30 times D2, at their just tuning.'],
    ['cue-down-settles', 'The down settles (the Cattails, after H2)', 'A breath lifts the tuft, and a soft flute answers. No harmonic call: the gift has none.'],
    ['cue-glide-open', 'The down opening as a glide starts', 'A movement sound, under the world like the jump.'],
    ['cue-seed-click', 'A seed click', ''], ['cue-seed-chirr', 'A seed chirr', ''],
    ['cue-seed-answer-a', 'A seed answer, rising', ''], ['cue-seed-answer-b', 'A seed answer, falling', ''],
    ['cue-ring-h5', 'The rose stone rings (this branch)', 'Re-voiced so it sounds at H5\'s pitch. motif\'s bell kind ignores cents:, so the shipped ring sounded at equal-tempered F#4, 13.7 cents sharp of the drone and the finding tone. Separate commit; can be dropped.'],
    ['cue-ring-h5-before', 'The rose stone rings (before)', 'For comparison: the same notes at equal temperament.'],
    ['cue-miss-h5', 'The rose stone\'s near miss (this branch)', ''], ['cue-miss-h5-before', 'The near miss (before)', ''],
  ]],
  ['The moments alone', 'Without the bed, for the music itself.', [
    ['alone-above-the-cloud', 'Above the Cloud', ''], ['alone-the-last-grass', 'The Last Grass', ''], ['alone-low-cloud', 'Low Cloud', ''],
    ['alone-thermals', 'Thermals', ''], ['alone-hollow-third', 'hollow-third', ''],
  ]],
];

const measure = (f) => {
  // ffmpeg reports on stderr
  const r = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'ebur128=peak=sample', '-f', 'null', '-'], { encoding: 'utf8' });
  return String(r.stderr || '');
};
const manifest = [];
for (const [, , tracks] of sections) for (const [n] of tracks) {
  const f = path.join(dir, n + '.wav');
  if (!fs.existsSync(f)) throw Error('Missing recording ' + n);
  const b = fs.readFileSync(f);
  const frames = b.readUInt32LE(40) / 8;
  const o = measure(f);
  const I = (o.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const P = (o.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  manifest.push({ name: n, seconds: +(frames / 32000).toFixed(2), lufs: I ? +I.match(/-?[\d.]+/)[0] : null, peak_dbfs: P ? +P.match(/-?[\d.]+/)[0] : null });
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const meta = Object.fromEntries(manifest.map((m) => [m.name, m]));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Cloudstair · sound review (Opus take)</title>
<style>
body{max-width:46rem;margin:2.5rem auto;padding:0 1rem;background:#1b1e24;color:#e9e7df;font:17px/1.55 system-ui,sans-serif}
h1{font-size:1.9rem;margin-bottom:.2rem}h2{font-size:1.25rem;margin:2.4rem 0 .3rem;color:#dcae5c}
.lede,.sec{color:#b9bcc4}article{padding:.8rem 0;border-top:1px solid #353a44}
h3{font-size:1rem;margin:0}p{margin:.25rem 0}.m{color:#7f8590;font-size:.8rem}audio{width:100%;margin-top:.35rem}
</style>
<h1>Cloudstair · sound review</h1>
<p class="lede">The Opus take, for the blind comparison. Every clip is mono, 32 kHz, synthesised by the game's own instruments through a harness built at the 0.22.10 lock, mixed at in-play gains, not loudness-normalised. Try a steady volume first, then a phone speaker and laptop speakers.</p>
<p class="lede">What this cannot show: the warning's timing against your hands in play, the director's distance low-pass on the finding tone, and the phone's performance. Those need the game.</p>
${sections.map(([t, d, tracks]) => `<h2>${esc(t)}</h2><p class="sec">${esc(d)}</p>${tracks.map(([n, title, desc]) => `<article><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}<audio controls preload="none" src="${n}.wav"></audio><p class="m">${meta[n].seconds} s · ${meta[n].lufs ?? '-'} LUFS · peak ${meta[n].peak_dbfs ?? '-'} dBFS</p></article>`).join('')}`).join('')}
<p class="m">Generated by tools/cloudstair-review.sh from tools/cloudstair-review.jobs. Nothing here is published.</p>
</html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(path.resolve(dir, 'index.html'), manifest.length, 'recordings');
