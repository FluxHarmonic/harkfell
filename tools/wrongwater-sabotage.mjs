// Sabotage legs for Wrongwater's sound: each plants one defect in a committed
// file, checks the plant landed, runs the test file that should catch it, and
// requires the NAMED test to fail. Then it restores the file and checks it by hash.
//   node tools/wrongwater-sabotage.mjs [HARNESS] [LEG ...]
// HARNESS: an audio-capable harkfell-test at the task lock (default
// build/audio-harness/bin/harkfell-test; folio procedures/harkfell-look-review-harness).
// A leg is RED when its named test prints the failure marker "✗ NAME". The
// passing path prints "✓ NAME", so a pass cannot be scored as RED. Exit 0 only
// when every leg is RED. Nothing else may write in the tree while it runs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const H = process.argv[2] && !process.argv[2].startsWith('leg:') ? process.argv[2] : 'build/audio-harness/bin/harkfell-test';
const only = process.argv.slice(2).filter((a) => a.startsWith('leg:')).map((a) => a.slice(4));
const SOUND = 'src/harkfell/sound.sgl';
const AUDIO_T = 'test/test-wrongwater-audio.sgl';
const SOUND_T = 'test/test-wrongwater-sound.sgl';
const BEDS = ['hollow', 'reedfen', 'glasswood', 'pipes', 'cloudstair', 'wrongwater'].map((b) => `assets/tunes/${b}-bed.cts`);

// [name, [[file, from, to] ...], test file, the test that must fail]
const LEGS = [
  // the door's timing
  ['door-starts-early', [[SOUND, '(define DRIP-START-S 1.0)', '(define DRIP-START-S 0.5)']], AUDIO_T,
    'under DRIP-START-S of stillness, nothing'],
  ['climb-off-the-count', [[SOUND, '(when (and (not (vector-ref st 3)) (> (abs err) (* GUST-SNAP-S (mixer-rate))))', '(when (and #f (> (abs err) (* GUST-SNAP-S (mixer-rate))))']], AUDIO_T,
    'knocked 0.4 s off the count (a stall, a sink played out), it comes back'],
  ['climb-opens-from-zero', [[SOUND, '(vector-set! st 2 (+ (held->frame held) (source-lead s)))', '(vector-set! st 2 (source-lead s))']], AUDIO_T,
    'a climb that starts late (the count already at 3 s) starts where the count is'],
  ['h7-lands-late', [['assets/tunes/drip-climb.cts', '(row 40 (7 "C-5" 7 34 "000") (8 "C-6" 8 24 "000"))', '(row 44 (7 "C-5" 7 34 "000") (8 "C-6" 8 24 "000"))']], AUDIO_T,
    'the buffer: H7 sounds from 4.0 s, and not in the 0.15 s before'],
  ['climb-never-falls-away', [[SOUND, '((< held DRIP-START-S) (drip-fall-away! now))', '((< held -1.0) (drip-fall-away! now))']], AUDIO_T,
    'moving at 3 s, it falls away over DRIP-FALLBACK-S and is gone'],
  // the drip
  ['vanished-door-plays-on', [[SOUND, '(cond ((not d) (drip-fall-away! now))', '(cond ((not d) (vector-set! *drip* 5 #f))']], AUDIO_T,
    'a door that vanishes mid-climb (a world swap) takes the climb with it'],
  ['open-crack-silent', [[SOUND, "(due? 'open-drip now DRIP-OPEN-LO DRIP-OPEN-HI))", "#f)"]], AUDIO_T,
    'once the door is open it no longer hums, and the crack drips now and then'],
  ['open-crack-still-hums', [[SOUND, "(if (and d (eq? (car d) 'open))\n            (filter", "(if (and d (eq? (car d) 'never))\n            (filter"]], AUDIO_T,
    'once the door is open it no longer hums, and the crack drips now and then'],
  ['no-swell', [[SOUND, '(define DRIP-SWELL 2.0)', '(define DRIP-SWELL 1.0)']], AUDIO_T,
    'its hum swells with the count (about 6 dB by 5 s)'],
  ['drop-unrouted', [[SOUND, "((drip-fall) (gate-cue! 'drip-fall", "((drip-fall-x) (gate-cue! 'drip-fall"]], AUDIO_T,
    "the opening's news (drip-fall and sink, SYSTEMS') plays the drop and the stone"],
  ['adapter-ticks-not-seconds', [['src/harkfell/audio.sgl', '(/ (stone-listening st) 60.0)', '(* 1.0 (stone-listening st))']], AUDIO_T,
    'the stillness stone is the drip: shut, at the cell it listens at, its count in seconds'],
  // the answers and H7's tone
  ['answers-unrouted', [[SOUND, '((hint-answer) (answer! (caddr item) pl))', '((hint-answer-x) (answer! (caddr item) pl))']], AUDIO_T,
    'each (hint-answer 7 x y) plays an answer from the hint, a then b'],
  ['h7-tone-everywhere', [[SOUND, "(filter (lambda (t) (or (not (= (car t) 7)) (eq? (place-region pl) 'wrongwater)))", '(filter (lambda (t) #t)']], AUDIO_T,
    'half a room away in the Pipes or the glass caves: silent, the ears not turned'],
  // the dip
  ['dip-not-folded', [[SOUND, '(for-each (lambda (ch) (ramp-channel! ch (channel-level levels (car gc) ch) now secs))', '(for-each (lambda (ch) (ramp-channel! ch (channel-target levels (car gc)) now secs))']], AUDIO_T,
    'a room change during the moment keeps it dipped'],
  ['dip-under-rain-rising', [[SOUND, '(define H7-KEEPS \'("rain-rising" "underhum-coda"))', '(define H7-KEEPS \'("underhum-coda"))']], AUDIO_T,
    'under rain-rising (one of H7-KEEPS) it does not dip'],
  ['no-dip', [[SOUND, '(define H7-DIP 0.1)', '(define H7-DIP 1.0)']], AUDIO_T,
    'under the-ice-rings it drops to H7-DIP of the drone, the other drone channels untouched'],
  // the bed
  ['drops-quickened', [[SOUND, '(and a (number? (cdr a)) (< (cdr a) 1.0))', '(and a (number? (cdr a)) (< (cdr a) 0.1))']], AUDIO_T,
    'the drops played backwards keep their 0.45 s swell; the slow voices start at once'],
  // the tuning
  ['seventh-in-equal-temperament', [['assets/tunes/rain-rising.cts', 'name: "glass voice, C" patch: (drone-fm level: 0.35 index: 0.9 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.06 release: 0.9 cents: -31.174)', 'name: "glass voice, C" patch: (drone-fm level: 0.35 index: 0.9 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.06 release: 0.9)']], SOUND_T,
    "every pitched note in Wrongwater's tunes is a series degree of D"],
  ['a-bell-on-the-seventh', [['assets/tunes/wrongwater-bed.cts', 'name: "a drop backwards, the 7th" patch: (drone-fm level: 0.3', 'name: "a drop backwards, the 7th" patch: (bell level: 0.3']], SOUND_T,
    'an instrument that ignores cents: plays only D, A or E'],
  // H7 in every bed
  ['h7-line-differs', [['assets/tunes/hollow-bed.cts', 'bright: 4 cents: -31.174', 'bright: 5 cents: -31.174']], SOUND_T,
    "every bed's channel 8 is the same H7 voice, at the same note volume"],
  ['h7-at-volume-24', BEDS.flatMap((f) => [[f, 'seed: 7) volume: 15 gain: 2', 'seed: 7) volume: 24 gain: 2'], [f, '(8 "C-5" 8 15 "000")', '(8 "C-5" 8 24 "000")']]), SOUND_T,
    'in every bed, over a minute of breathing, H7 sits a step under H5'],
  // the assertion layer: the landing's expectation moved, the product untouched
  ['assertion-landing-moved', [[AUDIO_T, '(assert-true (< (abs (- (heard) 4.0)) 0.05))', '(assert-true (< (abs (- (heard) 4.5)) 0.05))']], AUDIO_T,
    "from DRIP-START-S it plays, on the count; at the door's 5.0 s it is heard at 4.0 s (H7)"],
];

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const count = (s, sub) => s.split(sub).length - 1;
const run = (file) => {
  const r = spawnSync('scripts/dev', [H, '--no-strict', file], { encoding: 'utf8', maxBuffer: 1 << 26 });
  return String(r.stdout || '') + String(r.stderr || '');
};
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

if (!fs.existsSync(H)) { console.log('SETUP-FAILED: no harness at', H); process.exit(2); }
// clean against HEAD, staged or not, untracked files included (a restore is
// a checkout of HEAD, so every planted file must be committed as it stands)
const dirty = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout.split('\n')
  .filter((l) => l && !l.startsWith('?? build/'));
if (dirty.length) { console.log('SETUP-FAILED: the tree is not clean against HEAD; commit first:\n' + dirty.slice(0, 5).join('\n')); process.exit(2); }
fs.mkdirSync('build', { recursive: true });

let bad = 0;
for (const [name, plants, testFile, mustFail] of LEGS) {
  if (only.length && !only.includes(name)) continue;
  const files = [...new Set(plants.map((p) => p[0]))];
  const before = Object.fromEntries(files.map((f) => [f, sha(f)]));
  let landed = true;
  let verdict = 'SETUP-FAILED';
  try {
  for (const [f, from, to] of plants) {
    const s = fs.readFileSync(f, 'utf8');
    if (count(s, from) !== 1) { console.log(`SETUP-FAILED ${name}: "${from.slice(0, 60)}" occurs ${count(s, from)} times in ${f}`); landed = false; break; }
    fs.writeFileSync(f, s.replace(from, to));
    if (!fs.readFileSync(f, 'utf8').includes(to)) { landed = false; break; }
  }
  for (const f of files) if (landed && sha(f) === before[f]) { console.log(`SETUP-FAILED ${name}: ${f} unchanged`); landed = false; }
  if (landed) {
    const out = strip(run(testFile));
    const failed = out.includes(`✗ ${mustFail}`);
    const loaded = /Files:\s+1 of 1 loaded/.test(out);
    verdict = !loaded ? 'SETUP-FAILED (did not load)' : failed ? 'RED' : 'NOT RED';
    fs.writeFileSync(`build/sabotage-${name}.log`, out);
  }
  } finally {
    // the plant leaves whatever happened (an exception, a failed write)
    spawnSync('git', ['checkout', 'HEAD', '--', ...files]);
  }
  const restored = files.every((f) => sha(f) === before[f]);
  if (!restored) { console.log(`RESTORE-FAILED ${name}`); process.exit(3); }
  if (verdict !== 'RED') bad++;
  console.log(`${verdict.padEnd(12)} ${name}  (${testFile}: ${mustFail})`);
}
console.log(bad === 0 ? 'SABOTAGE: every leg RED' : `SABOTAGE: ${bad} leg(s) not RED`);
process.exit(bad === 0 ? 0 : 1);
