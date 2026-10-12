// Write the Wrongwater sound review page beside tools/wrongwater-render.sgl's WAVs:
//   node tools/wrongwater-review-page.mjs [build/wrongwater-listening]
// Run by tools/wrongwater-review.sh. Measures each WAV with ffmpeg (length,
// sample peak, integrated loudness) into manifest.json; refuses if a WAV is missing.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'build/wrongwater-listening';
// the page's audio: the WAVs, or (AUDIO_EXT=ogg) their Opus encodings, made
// beside them by tools/wrongwater-review-encode.sh after this measures the WAVs
const EXT = process.env.AUDIO_EXT || 'wav';
const sections = [
  ['The Ice Well door', 'Standing still by the rising drip (David\'s ruling 1: it has to make you stop and anticipate). From 1 s of stillness the harmonic series of D climbs out of the crack, D4 E4 F#4, the 11th, A4, the 13th, each note held and a little louder, closer and closer together like the drop\'s rings, and lands on H7 at 5 s, when the drop falls into the crack with one plain drip and the door sinks. In play the climb follows the door\'s own count, so it cannot land early or late. The drip\'s H7 hum is under it here at a fixed level; in play it also swells by 6 dB over the five seconds.', [
    ['door-opens', 'The door opens (the climb soft: the default)', 'Still from 0 s: the climb from 1 s, H7 and the stone at 5 s, the drop at 5.3 s. The bible calls the climb a soft cue; here it sits about 5 dB over the recess.'],
    ['door-opens-moment', 'The door opens (the climb as loud as a moment)', 'The same, the first take: the climb at moment loudness. Choose by ear; in the game ?sound=climb:moment plays this one, climb:soft the other.'],
    ['door-moved-at-3s', 'You move at 3 s', 'The climb falls away over half a second. Stand still again and it starts from the beginning.'],
    ['door-climb-alone', 'The climb alone', 'Notes at 0, 0.9, 1.7, 2.4, 3.0, 3.5 and 4.0 s.'],
  ]],
  ['Wrongwater\'s rooms', 'The bed in the harmonic series of D (partials 8 to 16, decision 4: "Let\'s try it and see how it sounds"). Still air with no wind; drops played backwards, swelling and cut short, on the series\' notes; the hanging lakes\' slow hum on the 7th and the 11th; the drone. Carrying H2, H3 and H4, moving, at the levels the rooms set.', [
    ['ww-bed-a-under-the-well', 'A · Under the Well', 'Water 0.5, hang 0.35.'],
    ['ww-bed-b-hanging-tarn', 'B · The Hanging Tarn', 'Hang 0.6: the lake overhead.'],
    ['ww-bed-e-rain-rising', 'E · Rain Rising', 'Water 0.7: the rising rain.'],
    ['ww-bed-c-still-without-h7', 'C · standing still, before H7', 'Compare with the next clip at the same volume.'],
    ['ww-bed-c-still-with-h7', 'C · standing still, carrying H7', 'H7 has joined the drone.'],
  ]],
  ['The moment', 'E, Rain Rising, after 6 s still. The rain rises into music: scattered drops climb and fall into a pulse up the overtone chord, then a glass voice sings over D, A major (12:15:18), the series\' own wrong chord (9:11:13, E G# B-flat) and the overtone chord itself (4:5:6:7), and comes to rest on C6, H7\'s octave, the drip\'s own note. About 23 s. H7 does not dip under this one.', [
    ['moment-e-rain-rising', 'Rain Rising, in E, before H7', 'Bed ducked 6 dB, as in play.'],
    ['moment-e-rain-rising-with-h7', 'Rain Rising, in E, carrying H7', 'The same, with H7 in the drone under it.'],
    ['alone-rain-rising', 'Rain Rising alone', 'The music without the bed.'],
  ]],
  ['Finding H7, and the cues', 'H7\'s finding tone sounds only inside Wrongwater (decision 2). The cues at their in-play gains.', [
    ['find-h7-from-a', 'From A, two rooms from C, standing still', 'The tone forward 4 dB, the bed down 6. It comes from above and east.'],
    ['cue-pickup-h7', 'H7 taken', 'Its own partials rising, 7 14 21 28 35 42 times D2 (C5 C6 G6 C7 E7 G7), at their just tuning.'],
    ['cue-pickup-h7-into-bed', 'H7 taken, into C\'s bed', 'Then H7 blooms into the drone on its own slow attack.'],
    ['cue-drip-fall', 'The drop falling the right way', 'One plain drip, no echo. Once the door is open the crack drips like this now and then, quietly.'],
    ['hint-icicle-answers', 'Behind the Fall, carrying H7: the icicle answers', 'Passing the upward icicle with H7, a short phrase answers from it (at most once every 12 s). Here both answers, 6 s apart, over Glasswood\'s bed and the icicle\'s faint hum.'],
    ['cue-answer-h7-a', 'Answer a', 'A5 rising to C6: the 24th and 28th partials, a 7:6 third landing on H7\'s octave.'],
    ['cue-answer-h7-b', 'Answer b', 'The 11th, the 13th, then H7\'s octave: Wrongwater\'s tuning heard outside it.'],
  ]],
  ['H7 in every region\'s drone', 'Ruling 5: H7 joining the drone is fine "as long as it doesn\'t sound oddly dissonant while you carry it". Every bed\'s H7 voice is now darker (fewer upper partials), a step quieter (volume 15 against H5\'s 19) and breathes down to 0.12 on a slower cycle. Measured over a minute, H7 sits 6 to 7 dB under H5 in every bed. Each pair: standing still (the drone up), carrying H2 to H5, then H2 to H5 and H7. This is the listening check the bible asks you to make; the in-game version with ?carry= and &moment is still the real test, on a phone speaker, laptop speakers and headphones.', [
    ['h7-hollow-without', 'The Hollow · without H7', ''], ['h7-hollow-with', 'The Hollow · with H7', ''],
    ['h7-reedfen-without', 'Reedfen · without H7', ''], ['h7-reedfen-with', 'Reedfen · with H7', ''],
    ['h7-glasswood-without', 'Glasswood · without H7', ''], ['h7-glasswood-with', 'Glasswood · with H7', ''],
    ['h7-pipes-without', 'The Pipes · without H7', ''], ['h7-pipes-with', 'The Pipes · with H7', ''],
    ['h7-cloudstair-without', 'Cloudstair · without H7', ''], ['h7-cloudstair-with', 'Cloudstair · with H7', ''],
  ]],
  ['H7 under other regions\' moments', 'Almost every moment outside Wrongwater plays an equal-tempered C (31 cents sharp of H7, so they beat) or a C# (a rough near-semitone above it). So while any moment but Wrongwater\'s own plays, H7 drops 20 dB, nearly silent, and comes back with the bed afterwards. Each clip carries all five harmonics.', [
    ['dip-hollow-answers', 'The Hollow · hollow-answers', ''],
    ['dip-reedfen-first-open-water', 'Reedfen · first-open-water', ''],
    ['nodip-reedfen-first-open-water', 'Reedfen · first-open-water, H7 NOT dipped', 'For comparison only: what the dip prevents.'],
    ['dip-glasswood-singing-ice', 'Glasswood · singing-ice', ''],
    ['dip-pipes-the-pipes-breathe', 'The Pipes · the-pipes-breathe', ''],
    ['dip-cloudstair-above-the-cloud', 'Cloudstair · above-the-cloud', ''],
  ]],
];

const measure = (f) => {
  // ffmpeg reports on stderr
  const r = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'ebur128=peak=sample', '-f', 'null', '-'], { encoding: 'utf8' });
  return String(r.stderr || '');
};
const old = fs.existsSync(path.join(dir, 'manifest.json')) ? Object.fromEntries(JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')).map((m) => [m.name, m])) : {};
const manifest = [];
for (const [, , tracks] of sections) for (const [n] of tracks) {
  const f = path.join(dir, n + '.wav');
  if (!fs.existsSync(f)) {
    if (old[n] && fs.existsSync(path.join(dir, n + '.' + EXT))) { manifest.push(old[n]); continue; }
    throw Error('Missing recording ' + n);
  }
  const b = fs.readFileSync(f);
  const frames = b.readUInt32LE(40) / 2;   // 16-bit mono
  const o = measure(f);
  const I = (o.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const P = (o.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  manifest.push({ name: n, seconds: +(frames / 32000).toFixed(2), lufs: I ? +I.match(/-?[\d.]+/)[0] : null, peak_dbfs: P ? +P.match(/-?[\d.]+/)[0] : null });
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const meta = Object.fromEntries(manifest.map((m) => [m.name, m]));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Wrongwater · sound review</title>
<style>
body{max-width:46rem;margin:2.5rem auto;padding:0 1rem;background:#1b1e24;color:#e9e7df;font:17px/1.55 system-ui,sans-serif}
h1{font-size:1.9rem;margin-bottom:.2rem}h2{font-size:1.25rem;margin:2.4rem 0 .3rem;color:#dcae5c}
.lede,.sec{color:#b9bcc4}article{padding:.8rem 0;border-top:1px solid #353a44}
h3{font-size:1rem;margin:0}p{margin:.25rem 0}.m{color:#7f8590;font-size:.8rem}audio{width:100%;margin-top:.35rem}
</style>
<h1>Wrongwater · sound review</h1>
<p class="lede">Under the Ice Well, in the harmonic series of D, and H7 in every region's drone. Every clip is mono, 32 kHz, synthesised by the game's own instruments through a harness built at the 0.22.10 lock, mixed at in-play gains, not loudness-normalised. Try a steady volume first, then a phone speaker and laptop speakers.</p>
<p class="lede">What this cannot show: the climb following your own stillness in play, the drip's hum swelling, the director's distance low-pass on the finding tone, and the phone's performance. Those need the game.</p>
${sections.map(([t, d, tracks]) => `<h2>${esc(t)}</h2><p class="sec">${esc(d)}</p>${tracks.map(([n, title, desc]) => `<article><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}<audio controls preload="none" src="${n}.${EXT}"></audio><p class="m">${meta[n].seconds} s · ${meta[n].lufs ?? '-'} LUFS · peak ${meta[n].peak_dbfs ?? '-'} dBFS</p></article>`).join('')}`).join('')}
<p class="m">Generated by tools/wrongwater-review.sh from tools/wrongwater-review.jobs. Nothing here is published.</p>
</html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(path.resolve(dir, 'index.html'), manifest.length, 'recordings');
