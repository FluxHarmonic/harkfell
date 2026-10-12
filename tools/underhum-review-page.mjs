// Write the Underhum sound review page beside the WAVs that
// tools/underhum-render.sgl and tools/cloudstair-render.sgl (with
// tools/underhum-review.jobs) wrote:
//   node tools/underhum-review-page.mjs [build/underhum-listening]
// Run by tools/underhum-review.sh. Measures each WAV with ffmpeg (length,
// sample peak, integrated loudness) into manifest.json, reads each ending's
// .sections into chapter marks, and refuses if a recording is missing.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'build/underhum-listening';
const NAMES = {
  fuse: 'the fuse', theme: 'theme: the way home', hold: 'hold (the chamber, waiting)', rise: 'verse 1: Reedfen',
  glass: 'verse 2: Glasswood', pipes: 'verse 3: the Pipes', sky: 'verse 4: Cloudstair', home: 'home: the second chorus',
  close: 'close: under the credits', dawn: 'the dawn', after: 'the ending is over',
};
const sections = [
  ['The ending, as the game plays it',
    'Rendered through the game\'s own sound director and instruments, not assembled by hand: the chamber\'s bed fades and closes at the fuse, the four drone voices fall into one breath, the fundamental enters, and the piece follows the player by its marks. The rooms here are walked on a schedule (the map\'s climb: the chamber, the lift to the Ringing Stair, the gallery, the Throat, up through the heart into the bowl). Click a section to jump to it. Stereo, 32 kHz, at in-play gains, not loudness-normalised.', [
    ['ending', 'The ending, carrying H2 to H5', 'You stand still in the chamber 6 s after arriving and the fuse starts. You step into the column as the theme ends, climb through one pass of the Cloudstair verse, and come up into the bowl, where the piece jumps to home. Then close, the voices leaving one by one (H5, H4, H3, H2), the fundamental alone, and the dawn: the Hollow\'s wind comes back.', true],
    ['ending-h7', 'The ending, carrying H7 too', 'The same climb. A fifth voice locks into the breath last, 31 cents flat C, with a fifth bell; every D chord from the fuse on carries the seventh; the last grass\'s call at the top of the Cloudstair verse rises to H7 itself; and in close H7 is the voice left, held longer than anything, unresolved.', true],
    ['ending-slow', 'A slow player', 'Stays in the chamber after the theme, so hold loops, a quiet passage written so the theme does not repeat. Then climbs through the Cloudstair verse twice: it repeats for as long as you are still climbing.', true],
    ['ending-fast', 'A fast player', 'Up the lift the moment the fuse sounds and into the bowl 14 s later. The fuse is never cut (it carries the fundamental\'s arrival), so home lands exactly where it ends.', true],
  ]],
  ['The chamber', 'The Underhum\'s bed: no wind at all for the first time in the game, the fundamental (D2, the bowl\'s own hum voice), the hollow\'s slow ring on D, and the drone. Carrying H2 to H5.', [
    ['bed-chamber-moving', 'The chamber, moving', 'The drone at its moving level.'],
    ['bed-chamber-still', 'The chamber, standing still', 'The bed dips and the drone swells, as everywhere. In play this is when the fuse starts.'],
    ['bed-chamber-h7', 'The chamber, standing still, carrying H7', 'H7 on channel 8, the line Wrongwater\'s sound owns for every bed.'],
    ['chamber-listening-place', 'The listening place', 'The sparkling tile\'s motes chime the drone\'s four notes high and sparse (D, A, D and F# three octaves up, at the drone\'s own tunings), the way the moths chime in the Blue Hall. Heard from the chamber\'s door; it stops at the fuse.'],
    ['bed-roots', 'The Roots of the Hum (E)', 'The one room with water: a single distant drip in the dark.'],
  ]],
  ['The heart, in the bowl', 'The fifth stone, keyed to all four.', [
    ['bowl-heart-calling', 'The heart calling', 'Once all four are carried: not the fundamental (a phone cannot play 73 Hz) but its four overtones, pulsing together, so the ear hears the missing D under them. Here over the bowl\'s bed beside the stone.'],
    ['bowl-heart-opens', 'The heart opens', 'It rings (the four harmonics bloom up from D3, as the card\'s did), the stones answer with the chord at 0.67 s, and it sinks.'],
    ['cue-ring-heart', 'Its ring alone', ''], ['cue-miss-heart', 'Its near miss (carrying some of the four)', 'It shivers, and stays shut.'],
    ['cue-heart-sink', 'Its sinking alone', ''], ['heart-call-alone', 'Its call alone', ''],
  ]],
  ['After the ending', '', [
    ['after-bed-chamber', 'The chamber after the ending', 'The same bed, but the drone breathes as one: the chord you heard fuse stays fused. No piece.'],
    ['coda', 'The late finders\' coda', 'A player who ended without H7 comes back with it: once, the stones ring up the series to a fifth notch, H7, and the glass flute falls to C and is left hanging. About 30 s.'],
  ]],
  ['The piece alone', 'Straight through, without the drone and without following anyone (hold plays once, the Cloudstair verse once).', [
    ['alone-the-fundamental', 'the-fundamental', ''],
    ['listening-chimes-alone', 'The listening place\'s chimes alone', ''],
  ]],
];

const measure = (f) => String(spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', f, '-af', 'ebur128=peak=sample', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');
const manifest = [];
for (const [, , tracks] of sections) for (const [n] of tracks) {
  const f = path.join(dir, n + '.wav');
  if (!fs.existsSync(f)) throw Error('Missing recording ' + n);
  const b = fs.readFileSync(f);
  const ch = b.readUInt16LE(22), frames = b.readUInt32LE(40) / (4 * ch);
  const o = measure(f);
  const I = (o.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const P = (o.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  const secFile = path.join(dir, n + '.sections');
  const marks = fs.existsSync(secFile) ? fs.readFileSync(secFile, 'utf8').trim().split('\n').map((l) => { const [t, s] = l.split(' '); return { t: +t, s }; }).filter((m) => m.s !== '#f') : [];
  // the page plays an MP3 (VBR about 190 kbit/s): David listens over a phone
  // hotspot, and the WAVs are about 300 MB. The figures are the WAV's.
  const mp3 = path.join(dir, n + '.mp3');
  if (!fs.existsSync(mp3) || fs.statSync(mp3).mtimeMs < fs.statSync(f).mtimeMs) {
    const r = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-y', '-i', f, '-codec:a', 'libmp3lame', '-q:a', '2', mp3], { encoding: 'utf8' });
    if (r.status !== 0) throw Error('mp3 failed for ' + n + ': ' + String(r.stderr).slice(-300));
  }
  manifest.push({ name: n, seconds: +(frames / 32000).toFixed(2), lufs: I ? +I.match(/-?[\d.]+/)[0] : null, peak_dbfs: P ? +P.match(/-?[\d.]+/)[0] : null, sections: marks });
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const meta = Object.fromEntries(manifest.map((m) => [m.name, m]));
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const chapters = (n) => meta[n].sections.length ? `<p class="ch">${meta[n].sections.map((m) => `<a href="#" data-a="${n}" data-t="${m.t}">${mmss(m.t)} ${esc(NAMES[m.s] || m.s)}</a>`).join(' · ')}</p>` : '';
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>The Underhum · the ending's sound</title>
<style>
body{max-width:46rem;margin:2.5rem auto;padding:0 1rem;background:#15161b;color:#e9e7df;font:17px/1.55 system-ui,sans-serif}
h1{font-size:1.9rem;margin-bottom:.2rem}h2{font-size:1.25rem;margin:2.4rem 0 .3rem;color:#e8e2cf}
.lede,.sec{color:#b9bcc4}article{padding:.8rem 0;border-top:1px solid #31343d}
h3{font-size:1rem;margin:0}p{margin:.25rem 0}.m{color:#7f8590;font-size:.8rem}audio{width:100%;margin-top:.35rem}
.ch{font-size:.85rem}.ch a{color:#a47ce0;text-decoration:none}.ch a:hover{text-decoration:underline}
li{margin:.3rem 0;color:#b9bcc4}
</style>
<h1>The Underhum · the ending's sound</h1>
<p class="lede">The finale: one song in D at 72 bpm made of the world's moments, with the Hollow's homecoming as its chorus and a verse for each region in the order the climb passes them (Reedfen, Glasswood, the Pipes, Cloudstair). Synthesised by the game's own instruments through a harness at the 0.22.10 lock. The players stream MP3s (about 190 kbit/s); the figures under each are measured on the full-quality WAV it was made from. Try a steady volume first, then a phone speaker and laptop speakers.</p>
<p class="lede">What this cannot show: the orbs, the white stone and the credits over the climb (those are the look's), your own timing in the rooms, and the phone's performance (the ending is two players, 14 voices, with the bed closed).</p>
${sections.map(([t, d, tracks]) => `<h2>${esc(t)}</h2>${d ? `<p class="sec">${esc(d)}</p>` : ''}${tracks.map(([n, title, desc]) => `<article><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}<audio id="${n}" controls preload="none" src="${n}.mp3"></audio>${chapters(n)}<p class="m">${meta[n].seconds} s · ${meta[n].lufs ?? '-'} LUFS · peak ${meta[n].peak_dbfs ?? '-'} dBFS</p></article>`).join('')}`).join('')}
<h2>For you to decide</h2>
<ul>
<li><b>The credits</b> are your seven cards (D52): Harkfell / Made by David Wilson / With Claude and Codex / Built with Sigil / Inspired by Knytt, by Nifflas / IM Fell types by Igino Marini / Thank you for listening. They start with the first verse, one every 20 s, each held 12 s, and the last waits for the dawn.</li>
<li><b>Hold</b> is new: a quiet looping passage after the theme for a player who stays in the chamber. The bible says the first verse starts at the column but not what plays until then.</li>
<li><b>The fused breath is faster than the bed's.</b> The drone's voices normally swell every 30 to 50 s, too slow to hear four of them lock in eight seconds, so at the fuse each one pulses on its own 3 to 5 s cycle and they lock onto one breath a bar long, then slow to two bars under the piece.</li>
<li><b>The Pipes verse</b> quotes the current Pipes moment (the falling breath E, C, A and a drip). If the Pipes moments are rewritten first, it quotes the new hook.</li>
</ul>
<p class="m">Generated by tools/underhum-review.sh. Nothing here is published.</p>
<script>document.querySelectorAll('.ch a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const p=document.getElementById(a.dataset.a);p.currentTime=+a.dataset.t;p.play();}));</script>
</html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(path.resolve(dir, 'index.html'), manifest.length, 'recordings');
