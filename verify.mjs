// verify.mjs - A0's browser arm for the web build.
//
//   node verify.mjs [build/web] [--port N] [--cdp N] [--legs a,b,...]
//                   [--record-replay PATH] [--replay-fixture PATH] [--shot PNG]
//
// Serves the build dir on 127.0.0.1 with COOP/COEP (the page is served
// isolated everywhere else too), launches google-chrome headless with
// software WebGL (SwiftShader), drives the page over the DevTools Protocol
// (Node's built-in WebSocket, no puppeteer). The harness shape (the leak
// guard, the process-group kill, the CDP plumbing) is Crash The Stack's
// verify.mjs at master e737d21, much reduced.
//
// Legs, each printing PASS / FAIL <leg>: <detail>; any FAIL exits 1, a wait
// that runs out prints TIMED-OUT <leg> with what it collected and exits 2:
//
//   boot       a fresh profile boots the default stick, "harkfell: boot stick
//              fixed"; ?stick=float boots "harkfell: boot stick float"
//   render     the canvas holds the room: pixels in at least four color bins
//              (sky, rock, rough rock, water, the body), read in the frame the
//              game drew
//   replay     ?replay: the trace, line for line, equals the web recording
//              (test/fixtures/replay-web.txt); --record-replay writes it instead
//   envelope   ?envelope: the measured envelope on the wasm build is the
//              design target (gap standing 2, moving 3; ledge held 3, tap < 3)
//   keys       ArrowRight held 0.5 s moves the body right
//   float      ?stick=float: a touch in the lower-left quarter OUTSIDE the ring
//              re-centres the stick there: touch-down reads no direction, a
//              drag LEFT reads w (from home it would read e), the body moves
//              left, and the latency lines carry numbers for IN and MOVE; a
//              reload with no ?stick then boots float (the store answered,
//              not the fixed default)
//   fixed      ?stick=fixed: the same touch outside the ring does nothing (the
//              body stays put: the float leg's control), and a touch inside
//              the ring with the same drag moves it
//   jump       a touch on the right half is the jump button: the body rises,
//              and the JUMP latency carries a number
//   two        two fingers: the stick held right and the jump button pressed
//              while it stays down: the body rises, and the game reads the
//              stick as held through the jump finger's lift (its trace)
//   timing     a note, not an assertion: the rAF interval and how long after
//              its timeStamp a synthetic touch reaches the page (headless
//              Chrome delivers CDP touches ~90 ms late, so the latency legs
//              prove the readout works, not what a phone measures)
//   world      (A1) the page hands over the baked world and it loads clean:
//              "harkfell: world 39 files, 0 problems" (A4: 36 rooms, two maps
//              and world.sgl), and a plain boot enters the world's start
//              (hollow:4,3)
//   door       (A1) ?room=reedfen:10,4 boots into that room ("harkfell: room
//              reedfen:10,4") with the body inside the room's slot; a room that
//              does not exist answers "harkfell: no-room"; &at=4,7 stands the
//              body in cell (4,7) of the Reed Bridge, and &at=4,9 (rock) is
//              refused
//   atlas      (A1) ?atlas shows every room at quarter scale ("harkfell: view
//              atlas 1736 186": x 1..17, y 2..5); a click on the Drowned Channel's picture enters
//              it ("harkfell: room reedfen:9,4") and play resumes
//   atlas2     (A1) the atlas at devicePixelRatio 2 on a 200x150 CSS viewport
//              (a 400x300 canvas): the fit is not a whole scale ('sharp'), and a
//              click mapped through CSS pixels, device pixels and the fractional
//              fit still enters the Drowned Channel
//   sheet      (A1) ?sheet=reedfen: the region's rooms at full scale ("harkfell:
//              view sheet:reedfen 4044 544": x 8..17, y 3..5)
//   frame      (A4) a plain boot (?frame=on&new) runs the frame: the start
//              screen waits for a gesture (no "frame start-out" in 5 s) and its
//              words land together ("frame words", playtest 1 #1), then a key
//              goes on, and start-out, card, hold, dawn and play follow in
//              that order; the played room draws in at least four colour bins
//   save       (A4) after the frame leg: the save is in localStorage, and a
//              reload with no ?new continues from it ("harkfell: save continue
//              ..."); then a door (?room=) walked elsewhere leaves it unchanged
//   fullscreen (D39) the corner button: shown on the start screen and not
//              faded; a click asks for fullscreen and the game container
//              (#game) takes it without stepping in; F leaves it; in play it
//              fades after 2.5 s and a mouse move brings it back; with the
//              Fullscreen API removed (iPhone Safari) it is hidden and F asks
//              for nothing
//   pause      (D40) a blur pauses (a held key moves nothing) and a focus resumes;
//              the game says audio hold / release, and every AudioContext on
//              the page is running before the blur, suspended while held and
//              running after (0.1.1)
//   cues       (0.1.1) walking plays step cues: by default through the audio
//              bridge's worklet (mode worklet, a lag readout), and with
//              ?sound=cues:ring through the old cue sink (a ring-depth readout);
//              the worklet's wait is under the ring's. Both figures leave out the
//              device's output latency
//   errors     no console error and no exception in any leg
//
// Every leg but frame, save and fullscreen boots with &frame=off (open()
// adds it): the frame is theirs to skip, and a door skips it anyway.
//
// A0's control legs (keys, float, fixed, jump, two, timing) run in A0's test
// room (&test-room): they measure the controls, and their geometry (the
// chimney, the first pit) is that room's.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp", "--legs", "--record-replay", "--replay-fixture", "--shot"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const PORT = parseInt(opt("--port", "8199"), 10);
const CDP = parseInt(opt("--cdp", "9299"), 10);
const RECORD = opt("--record-replay", null);
const FIXTURE = opt("--replay-fixture", "test/fixtures/replay-web.txt");
const ALL_LEGS = ["boot", "render", "world", "door", "atlas", "atlas2", "sheet", "replay", "envelope", "keys", "float", "fixed", "jump", "two", "timing", "frame", "save", "fullscreen", "pause", "over", "cues", "errors"];
const LEGS = (opt("--legs", null) || ALL_LEGS.join(",")).split(",");

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: ${ROOT}/index.html missing; build --config web first`); process.exit(2); }
const stamp = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/version: "([^"]*)"/) || [])[1];
const wasmStat = fs.statSync(path.join(ROOT, "harkfell.wasm"));
console.log(`subject: ${ROOT} version ${stamp} harkfell.wasm ${wasmStat.size} bytes mtime ${wasmStat.mtime.toISOString()}`);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ---- no leaked chrome (Crash's guard) ----------------------------------------
function leakedChromes() {
  const out = [];
  for (const pid of fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n))) {
    let cmd = "";
    try { cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").join(" "); } catch { continue; }
    if (/--user-data-dir=\/tmp\/harkfell-verify-/.test(cmd) && /chrome/.test(cmd) && !/--type=/.test(cmd)) out.push(pid);
  }
  return out;
}
{ const l = leakedChromes(); if (l.length) { console.log(`SETUP-FAILED: a harkfell-verify chrome is still alive: pids ${l.join(" ")}`); process.exit(2); } }

const udd = fs.mkdtempSync("/tmp/harkfell-verify-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 1500);
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
setTimeout(() => { console.log(`TIMED-OUT whole run; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, 600000).unref();

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch { /* not up */ }
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target after 20 s"); shutdown(2); }

const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
let lines = [];
const errors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    lines.push(text);
    if (msg.params.type === "error") errors.push("console.error: " + text);
  }
  if (msg.method === "Runtime.exceptionThrown") errors.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

const results = [];
const ran = new Set();
let failed = false;
function pass(leg, detail) { results.push(`PASS ${leg}: ${detail}`); console.log(`PASS ${leg}: ${detail}`); }
function fail(leg, detail) { failed = true; results.push(`FAIL ${leg}: ${detail}`); console.log(`FAIL ${leg}: ${detail}`); }
function notRun() { return LEGS.filter((l) => !ran.has(l)); }
function dump() { console.log("--- last console lines ---"); for (const l of lines.slice(-30)) console.log("  " + l.slice(0, 200)); for (const e of errors) console.log("  ERR " + e.slice(0, 200)); }

async function waitFor(pred, ms, leg) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = pred(); if (v) return v; await sleep(50); }
  console.log(`TIMED-OUT ${leg} after ${ms} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2);
  await sleep(10000);
}
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

async function open(query) {
  lines = [];
  // A4: the frame (start screen, card, opening) is the frame and save legs'
  // business; every other leg skips it
  const q = query.includes("frame=") ? query : query + "&frame=off";
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?${q}` });
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: boot")), 60000, "open " + query);
  await sleep(300);
}
async function where() {
  const before = lines.length;
  await evaluate(`SigilWebApp.dispatch("where", "")`);
  const l = await waitFor(() => lines.slice(before).find((x) => x.startsWith("harkfell: at ")), 5000, "where");
  const [, , x, y, mode] = l.split(" ");
  return { x: Number(x), y: Number(y), mode };
}
async function latency() {
  const before = lines.length;
  await evaluate(`SigilWebApp.dispatch("latency", "")`);
  return await waitFor(() => lines.slice(before).find((x) => x.startsWith("harkfell: latency ")), 5000, "latency");
}
const touch = (type, pts) => send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
const W = await evaluate("window.innerWidth"), H = await evaluate("window.innerHeight");

// ---- the legs -------------------------------------------------------------------
if (LEGS.includes("boot")) {
  ran.add("boot");
  // a fresh profile with no ?stick: the default form, fixed (David's pick)
  await open("trace&touch");
  const d = lines.find((l) => l.startsWith("harkfell: boot"));
  d === "harkfell: boot stick fixed" ? pass("boot", `default: ${d}`) : fail("boot", `default: ${d}`);
  await open("trace&touch&stick=float&ms");
  const b = lines.find((l) => l.startsWith("harkfell: boot"));
  b === "harkfell: boot stick float" ? pass("boot", b) : fail("boot", b);
}

if (LEGS.includes("render")) {
  ran.add("render");
  if (!LEGS.includes("boot")) await open("trace");
  const bins = await evaluate(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const gl = c.getContext("webgl2");
    const px = new Uint8Array(4 * c.width * c.height);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const seen = new Set();
    for (let i = 0; i < px.length; i += 4 * 97) seen.add((px[i] >> 4) + "," + (px[i + 1] >> 4) + "," + (px[i + 2] >> 4));
    resolve([seen.size, c.width, c.height]);
  }))`);
  bins[0] >= 4 ? pass("render", `${bins[0]} color bins on a ${bins[1]}x${bins[2]} canvas`) : fail("render", `only ${bins[0]} color bins`);
  const SHOT = opt("--shot", null);
  if (SHOT) {
    const png = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(SHOT, Buffer.from(png.data, "base64"));
    console.log(`note: screenshot ${SHOT}`);
  }
}

if (LEGS.includes("world")) {
  ran.add("world");
  await open("trace");
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: room ")), 10000, "world");
  const w = lines.find((l) => l.startsWith("harkfell: world "));
  const r = lines.find((l) => l.startsWith("harkfell: room "));
  (w === "harkfell: world 39 files, 0 problems" && r === "harkfell: room hollow:4,3" ? pass : fail)("world", `${w}; ${r}`);
}

if (LEGS.includes("door")) {
  ran.add("door");
  await open("trace&room=reedfen:10,4");
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: room ")), 10000, "door");
  const r = lines.find((l) => l.startsWith("harkfell: room "));
  const at = await where();
  // reedfen:10,4 is the tenth room across (the map starts at x 1) and the third down (at y 2)
  const inside = at.x >= 9 * 400 && at.x < 10 * 400 && at.y >= 2 * 176 && at.y < 3 * 176;
  await open("trace&room=reedfen:40,40");
  // wait for the answer (a fixed 500 ms missed it on a loaded box: the
  // integration run at b7b0944)
  const none = await waitFor(() => lines.find((l) => l.startsWith("harkfell: no-room")), 10000, "door no-room");
  // &at: cell (4,7) of reedfen:9,3 (the ninth room across, the second down)
  await open("trace&room=reedfen:9,3&at=4,7");
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: room ")), 10000, "door at");
  const a2 = await where();
  const inCell = Math.floor((a2.x + 4) / 16) === 8 * 25 + 4 && Math.floor((a2.y + 7) / 16) === 11 + 7;
  await open("trace&room=reedfen:9,3&at=4,9");
  const rock = await waitFor(() => lines.find((l) => l.startsWith("harkfell: no-room")), 10000, "door rock");
  (r === "harkfell: room reedfen:10,4" && inside && none === "harkfell: no-room reedfen:40,40" && inCell && rock === "harkfell: no-room reedfen:9,3@4,9" ? pass : fail)("door", `${r}; body at ${at.x},${at.y} inside the room's slot: ${inside}; ${none}; &at=4,7 body at ${a2.x},${a2.y} in cell (4,7): ${inCell}; &at=4,9 (rock): ${rock}`);
}

// A click at canvas pixel (cx, cy) as a real mouse event (the page maps it).
async function clickCanvas(cx, cy) {
  const r = await evaluate(`(() => { const c = document.getElementById("stage"); const b = c.getBoundingClientRect(); return [b.left, b.top, b.width / c.width, b.height / c.height]; })()`);
  const x = r[0] + cx * r[2], y = r[1] + cy * r[3];
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

if (LEGS.includes("atlas")) {
  ran.add("atlas");
  await open("trace&atlas");
  const v = await waitFor(() => lines.find((l) => l.startsWith("harkfell: view atlas")), 10000, "atlas");
  const [, , , vw, vh] = v.split(" ").map((x, i) => (i >= 3 ? Number(x) : x));
  // the game fits the atlas at the largest whole scale, centred, or (A4: the
  // 36-room atlas is wider than the canvas) at a fractional 'sharp' fit
  // ((engine view): the whole scale k if k/s >= 0.8, else the float fit s)
  const cw = await evaluate("document.getElementById('stage').width"), ch = await evaluate("document.getElementById('stage').height");
  const sc = Math.min(cw / vw, ch / vh), kk = Math.floor(sc);
  const k = (kk >= 1 && kk / sc >= 0.8) ? kk : sc;
  const ox = Math.floor((cw - Math.floor(vw * k)) / 2), oy = Math.floor((ch - Math.floor(vh * k)) / 2);
  // the Drowned Channel, x9y4: column 8 and row 2 of 102x46 cells (a 2 px gap, rooms at 1/4; the atlas starts at x1 y2)
  const px = 2 + 102 * 8 + 50, py = 2 + 46 * 2 + 22;
  const before = lines.length;
  await clickCanvas(ox + px * k, oy + py * k);
  await waitFor(() => lines.slice(before).find((l) => l.startsWith("harkfell: room ")), 5000, "atlas click");
  const r = lines.slice(before).find((l) => l.startsWith("harkfell: room "));
  const a = await where(); await sleep(400); const b = await where();
  (v === "harkfell: view atlas 1736 186" && r === "harkfell: room reedfen:9,4" ? pass : fail)("atlas", `${v}; clicked canvas ${ox + px * k},${oy + py * k} (scale ${k}); ${r}; body at ${b.x},${b.y}`);
}

if (LEGS.includes("atlas2")) {
  ran.add("atlas2");
  await send("Emulation.setDeviceMetricsOverride", { width: 200, height: 150, deviceScaleFactor: 2, mobile: false });
  await open("trace&atlas");
  const v = await waitFor(() => lines.find((l) => l.startsWith("harkfell: view atlas")), 10000, "atlas2");
  await sleep(500);
  const [vw, vh] = v.split(" ").slice(3).map(Number);
  const cw = await evaluate("document.getElementById('stage').width"), ch = await evaluate("document.getElementById('stage').height");
  // (engine view): the whole scale k if k/s >= 0.8, else the float fit s (sharp)
  const sc = Math.min(cw / vw, ch / vh), k = Math.floor(sc);
  const sharp = !(k >= 1 && k / sc >= 0.8);
  const f = sharp ? sc : k;
  const w = Math.floor(f * vw), h = Math.floor(f * vh);
  const ox = Math.floor((cw - w) / 2), oy = Math.floor((ch - h) / 2);
  const px = 2 + 102 * 8 + 50, py = 2 + 46 * 2 + 22;
  const before = lines.length;
  await clickCanvas(ox + px * (w / vw), oy + py * (h / vh));
  await waitFor(() => lines.slice(before).find((l) => l.startsWith("harkfell: room ")), 5000, "atlas2 click");
  const r = lines.slice(before).find((l) => l.startsWith("harkfell: room "));
  await send("Emulation.clearDeviceMetricsOverride");
  (sharp && cw === 400 && r === "harkfell: room reedfen:9,4" ? pass : fail)("atlas2", `canvas ${cw}x${ch} at dpr 2, fit ${sharp ? "sharp " + sc.toFixed(3) : "whole " + k}; ${r}`);
}

if (LEGS.includes("sheet")) {
  ran.add("sheet");
  await open("trace&sheet=reedfen");
  const v = await waitFor(() => lines.find((l) => l.startsWith("harkfell: view sheet")), 10000, "sheet");
  (v === "harkfell: view sheet:reedfen 4044 544" ? pass : fail)("sheet", v);
}

if (LEGS.includes("replay")) {
  ran.add("replay");
  await open("trace&replay");
  const done = await waitFor(() => lines.find((l) => l.startsWith("harkfell: replay-done")), 120000, "replay");
  const trace = lines.filter((l) => l.startsWith("harkfell: replay ")).map((l) => l.slice("harkfell: replay ".length));
  const text = trace.join("\n") + "\n";
  if (RECORD) {
    fs.writeFileSync(RECORD, text);
    pass("replay", `recorded ${trace.length} lines to ${RECORD} (${done})`);
  } else if (!fs.existsSync(FIXTURE)) {
    fail("replay", `no recording at ${FIXTURE}; run with --record-replay first`);
  } else {
    const want = fs.readFileSync(FIXTURE, "utf8").split("\n").filter((l) => l.length);
    let first = -1;
    for (let i = 0; i < Math.max(want.length, trace.length); i++) if (want[i] !== trace[i]) { first = i; break; }
    if (trace.length === 1800 && first < 0) pass("replay", `${trace.length} ticks identical to ${FIXTURE}`);
    else fail("replay", `${trace.length} lines; first difference at line ${first + 1}: got "${trace[first]}" want "${want[first]}"`);
  }
}

if (LEGS.includes("envelope")) {
  ran.add("envelope");
  await open("trace&envelope");
  await waitFor(() => lines.find((l) => l === "harkfell: envelope-done"), 180000, "envelope");
  const fig = {};
  for (const l of lines.filter((x) => x.startsWith("harkfell: envelope "))) { const [, , name, value] = l.split(" "); fig[name] = Number(value); }
  const ok = fig["gap-standing"] === 2 && fig["gap-moving"] === 3 && fig["ledge-held"] === 3 && fig["ledge-tap"] < 3;
  (ok ? pass : fail)("envelope", JSON.stringify(fig));
}

if (LEGS.includes("keys")) {
  ran.add("keys");
  await open("trace&test-room");
  const a = await where();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(500);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  const b = await where();
  b.x > a.x + 8 ? pass("keys", `x ${a.x} -> ${b.x}`) : fail("keys", `x ${a.x} -> ${b.x}`);
}

// the ring's home and radius as the page placed it
async function ring() {
  return await evaluate(`(() => { const r = document.getElementById("ring").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; })()`);
}

// A touch at (x, y), a drag of dx over steps, held, then lifted. Returns
// where the body is 150 ms into the hold: from the entry a walk right
// reaches the first pit in about 0.75 s of game time, and under load a
// hold lasts much longer than asked, so a sample at the end could be in
// the pit or back at the entry after the soft return.
async function drag(x, y, dx, ms) {
  await touch("touchStart", [[x, y, 1]]);
  for (let i = 1; i <= 6; i++) { await touch("touchMove", [[x + (dx * i) / 6, y, 1]]); await sleep(16); }
  await sleep(150);
  const mid = await where();
  await sleep(ms);
  await touch("touchEnd", [[x + dx, y, 1]]);
  return mid;
}

// Both stick legs read the game's own trace ("harkfell: stick e") as the
// verdict, and check only that the body moved at all: a longer hold walks
// the body into the first pit under load, and a soft return would put it
// back at the entry.
if (LEGS.includes("float")) {
  ran.add("float");
  await open("trace&touch&stick=float&test-room");
  const g = await ring();
  // lower-left quarter, well outside the ring and its slack, 2.2 radii right
  // of home. Re-centring is what makes a drag LEFT from here read w: measured
  // from home instead, the finger would still be right of it and read e.
  const x = Math.min(W / 2 - 20, g.x + 2.2 * g.r), y = Math.max(H / 2 + 20, g.y - 0.3 * g.r);
  const outside = Math.hypot(x - g.x, y - g.y) > 1.5 * g.r;
  const a = await where();
  const t0 = lines.length;
  await touch("touchStart", [[x, y, 1]]);
  await sleep(100);
  const t1 = lines.length;
  for (let i = 1; i <= 6; i++) { await touch("touchMove", [[x - (g.r * 0.8 * i) / 6, y, 1]]); await sleep(16); }
  await sleep(300);
  const b = await where();
  await touch("touchEnd", [[x - g.r * 0.8, y, 1]]);
  const quietDown = !lines.slice(t0, t1).some((l) => l.startsWith("harkfell: stick"));
  const read = lines.slice(t1).includes("harkfell: stick w");
  const wrong = lines.slice(t1).includes("harkfell: stick e");
  const lat = await latency();
  const m = lat.match(/in (\d+) .*move (\d+) /);
  if (outside && quietDown && read && !wrong && b.x < a.x && m) pass("float", `touch at ${Math.round(x)},${Math.round(y)} (outside the ring) re-centred: no direction on touch-down, stick w on the drag left; x ${a.x} -> ${b.x}; ${lat}`);
  else fail("float", `outside ${outside}; quiet on touch-down ${quietDown}; stick w ${read}; stick e (not re-centred) ${wrong}; x ${a.x} -> ${b.x}; ${lat}`);
  // the stored form: a reload with no ?stick keeps float, not the fixed
  // default (so the store, not the default, is what answered)
  await open("trace&touch");
  const s = lines.find((l) => l.startsWith("harkfell: boot"));
  s === "harkfell: boot stick float" ? pass("float", `stored: ${s}`) : fail("float", `stored form: ${s}`);
}

if (LEGS.includes("fixed")) {
  ran.add("fixed");
  await open("trace&touch&stick=fixed&test-room");
  const g = await ring();
  const x = Math.min(W / 2 - 20, g.x + 2.2 * g.r), y = Math.max(H / 2 + 20, g.y - 0.3 * g.r);
  const a = await where();
  const t0 = lines.length;
  const b = await drag(x, y, g.r * 0.8, 100);
  const t1 = lines.length;
  const c = await drag(g.x, g.y, g.r * 0.8, 100);
  const outsideRead = lines.slice(t0, t1).some((l) => l.startsWith("harkfell: stick"));
  const insideRead = lines.slice(t1).includes("harkfell: stick e");
  if (!outsideRead && b.x === a.x && insideRead && c.x > b.x) pass("fixed", `outside the ring: no stick read, x stays ${a.x}; inside: stick e, x ${b.x} -> ${c.x}`);
  else fail("fixed", `outside: read ${outsideRead}, x ${a.x} -> ${b.x}; inside: read ${insideRead}, x -> ${c.x}`);
}

if (LEGS.includes("jump")) {
  ran.add("jump");
  await open("trace&touch&stick=float&test-room");
  const a = await where();
  await touch("touchStart", [[W * 0.85, H * 0.8, 2]]);
  await sleep(180);
  const b = await where();
  await sleep(200);
  await touch("touchEnd", []);
  await sleep(600);
  const lat = await latency();
  const m = lat.match(/jump (\d+) /);
  if (b.y < a.y - 10 && m) pass("jump", `y ${a.y} -> ${b.y} after 180 ms; ${lat}`);
  else fail("jump", `y ${a.y} -> ${b.y}; ${lat}`);
}

if (LEGS.includes("two")) {
  ran.add("two");
  await open("trace&touch&stick=float&test-room");
  const g = await ring();
  const a = await where();
  // finger 1 on the stick, dragged LEFT and held (the body presses into the
  // room's edge, where the chimney is open above it: dragged right, under
  // load the body walked under the pillar before the jump and bonked its
  // underside, 2 px above the head); finger 2 on the jump
  // button while finger 1 stays down; finger 2 lifted, then finger 1. The
  // game's own trace says what it read: the stick went w before the jump
  // went down, the body rose, and the stick stayed w (no "stick none")
  // from the jump finger's lift until the stick finger's.
  const at = () => lines.length;
  await touch("touchStart", [[g.x, g.y, 1]]);
  for (let i = 1; i <= 3; i++) { await touch("touchMove", [[g.x - (g.r * 0.8 * i) / 3, g.y, 1]]); await sleep(16); }
  const t0 = at();
  await touch("touchStart", [[g.x - g.r * 0.8, g.y, 1], [W * 0.85, H * 0.8, 2]]);
  await sleep(150);
  const b = await where();
  await touch("touchEnd", [[W * 0.85, H * 0.8, 2]]);   // CDP lifts the points LISTED (measured): the jump finger
  await sleep(300);
  const t1 = at();
  await touch("touchEnd", [[g.x - g.r * 0.8, g.y, 1]]);
  await sleep(100);
  const before = lines.slice(0, t0), during = lines.slice(t0, t1), after = lines.slice(t1);
  const e = before.includes("harkfell: stick w");
  const down = during.includes("harkfell: jump down"), up = during.includes("harkfell: jump up");
  const held = !during.includes("harkfell: stick none");
  const released = after.includes("harkfell: stick none");
  if (e && down && up && held && released && b.y < a.y - 10) pass("two", `stick w, jump down with it held, rose y ${a.y} -> ${b.y}, jump up with the stick still w, stick none only when its own finger lifted`);
  else fail("two", `stick w ${e}, jump down ${down}, up ${up}, stick held through ${held}, released after ${released}, y ${a.y} -> ${b.y}`);
}

if (LEGS.includes("timing")) {
  ran.add("timing");
  await open("trace&touch");
  const iv = await evaluate(`new Promise((resolve) => { const ts = []; function f(t) { ts.push(t); if (ts.length < 61) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]); d.sort((a, b) => a - b); resolve([d[0], d[30], d[59]]); } } requestAnimationFrame(f); })`);
  await evaluate(`(() => { window.__lag = []; document.getElementById("touch").addEventListener("pointerdown", (e) => window.__lag.push(performance.now() - e.timeStamp), true); })()`);
  await touch("touchStart", [[W * 0.85, H * 0.8, 3]]); await sleep(100); await touch("touchEnd", []);
  const lag = await evaluate("window.__lag");
  console.log(`note: timing: rAF interval min/median/max ${iv.map((x) => x.toFixed(1)).join("/")} ms; pointerdown handled ${lag.map((x) => x.toFixed(1)).join(",")} ms after its timeStamp`);
  pass("timing", "measured (a note, not an assertion)");
}

// A canvas's colour bins (the render leg's measure), in the frame the game drew.
const colourBins = () => evaluate(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const gl = c.getContext("webgl2");
    const px = new Uint8Array(4 * c.width * c.height);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const seen = new Set();
    for (let i = 0; i < px.length; i += 4 * 97) seen.add((px[i] >> 4) + "," + (px[i + 1] >> 4) + "," + (px[i + 2] >> 4));
    resolve(seen.size);
  }))`);

if (LEGS.includes("frame")) {
  ran.add("frame");
  await open("trace&frame=on&new");
  await waitFor(() => lines.find((l) => l === "harkfell: frame start"), 10000, "frame start");
  await sleep(5000);
  const waited = !lines.find((l) => l === "harkfell: frame start-out");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "x", code: "KeyX" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "x", code: "KeyX" });
  await waitFor(() => lines.find((l) => l === "harkfell: frame play"), 30000, "frame play");
  const order = lines.filter((l) => l.startsWith("harkfell: frame ")).map((l) => l.slice(16)).join(" ");
  await sleep(500);
  const bins = await colourBins();
  (waited && order === "start words start-out card hold dawn play" && bins >= 4 ? pass : fail)("frame",
    `waited for the gesture: ${waited}; phases: ${order}; ${bins} colour bins in play`);
}

if (LEGS.includes("save")) {
  ran.add("save");
  if (!LEGS.includes("frame")) {
    await open("trace&frame=on&new");
    await waitFor(() => lines.find((l) => l === "harkfell: frame start"), 10000, "save: frame start");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "x", code: "KeyX" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "x", code: "KeyX" });
    await waitFor(() => lines.find((l) => l === "harkfell: frame play"), 30000, "save: frame play");
  }
  await sleep(1000);
  const saved = await evaluate("localStorage.getItem('save')");
  await open("trace&frame=on");
  const cont = await waitFor(() => lines.find((l) => l.startsWith("harkfell: save ")), 10000, "save: continue");
  // the save's place, carry and stones, without the time played (leaving a page
  // hides it, and a hidden tab rewrites the save with the time so far)
  const place = (s) => (s || "").replace(/\(played [^)]*\)/, "");
  await open("trace&room=reedfen:10,4");
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: room ")), 10000, "save: door");
  const atDoor = await evaluate("localStorage.getItem('save')");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft" });
  await sleep(4000);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft" });
  await sleep(500);
  const walked = await where();
  const after = await evaluate("localStorage.getItem('save')");
  // reedfen:10,4 spans x 3600..4000 (the map starts at x1); walking west leaves it
  (saved && saved.startsWith("(harkfell-save 1") && cont && cont.startsWith("harkfell: save continue") &&
   atDoor && place(after) === place(atDoor) && walked.x < 9 * 400 ? pass : fail)("save",
    `saved: ${saved ? saved.slice(0, 60) : saved}; reload: ${cont}; after a door and a walk west to x ${walked.x}: the place is unchanged ${place(after) === place(atDoor)}`);
}

// D40: a lost focus pauses the game and its return resumes it. A key held
// through the pause moves nothing; after the focus is back, the same key
// walks. (The page lets every key go on a blur, so the walk after is a
// fresh press.)
if (LEGS.includes("pause")) {
  ran.add("pause");
  await open("trace&test-room");
  // 0.1.1: the page's AudioContexts themselves (SOUND's open item): a key is
  // the gesture that starts them (the control: running before the blur),
  // the hold suspends every one, the release resumes them
  const states = () => evaluate(`(window.HARKFELL_CONTEXTS || []).map((c) => c.state).join(",")`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await sleep(500);
  const ctxBefore = await states();
  await evaluate(`window.dispatchEvent(new Event("blur"))`);
  const a = await where();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(600);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  const b = await where();
  const ctxHeld = await states();
  await evaluate(`window.dispatchEvent(new Event("focus"))`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(500);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  const c = await where();
  // SOUND's hold and release (the page suspends and resumes its audio on them)
  const held = lines.includes("harkfell: audio hold"), released = lines.includes("harkfell: audio release");
  const ctxAfter = await states();
  const all = (s, want) => s.length > 0 && s.split(",").every((x) => x === want);
  (b.x === a.x && b.y === a.y && c.x > b.x + 8 && held && released &&
   all(ctxBefore, "running") && all(ctxHeld, "suspended") && all(ctxAfter, "running") ? pass : fail)("pause",
    `blurred, a held key: x ${a.x} -> ${b.x}; focused again: -> ${c.x}; audio hold ${held}, release ${released}; ` +
    `contexts before [${ctxBefore}], held [${ctxHeld}], after [${ctxAfter}]`);
}

// D40: with a save, the start screen's R held 1.5 s wipes it and begins a
// new game (through the card to play, a new save at the start); a short R
// first does nothing, not even step in.
if (LEGS.includes("over")) {
  ran.add("over");
  await open("trace&room=reedfen:9,3");
  await waitFor(() => lines.find((l) => l.startsWith("harkfell: room ")), 10000, "over: door");
  await evaluate(`localStorage.setItem("save", "(harkfell-save 1 (room reedfen 9 3) (cell 4 7) (carry 2) (stones) (moments) (played 100) (revealed #f))")`);
  await open("trace&frame=on");
  const cont = await waitFor(() => lines.find((l) => l.startsWith("harkfell: save ")), 10000, "over: continue");
  await waitFor(() => lines.find((l) => l === "harkfell: frame start"), 10000, "over: frame start");
  await sleep(1500);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "r", code: "KeyR" });
  await sleep(500);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "r", code: "KeyR" });
  await sleep(1500);
  const shortKept = await evaluate("localStorage.getItem('save')");
  const shortStayed = !lines.find((l) => l === "harkfell: frame start-out");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "r", code: "KeyR" });
  await sleep(2200);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "r", code: "KeyR" });
  const wiped = lines.find((l) => l === "harkfell: frame start-over") ? await evaluate("localStorage.getItem('save')") : "no start-over";
  await waitFor(() => lines.find((l) => l === "harkfell: frame play"), 30000, "over: frame play");
  await sleep(1000);
  const fresh = await evaluate("localStorage.getItem('save')");
  const order = lines.filter((l) => l.startsWith("harkfell: frame ")).map((l) => l.slice(16)).join(" ");
  (cont && cont.startsWith("harkfell: save continue") && shortKept && shortStayed && wiped === null &&
   /^start (words )?start-over start-out card hold dawn play$/.test(order) &&
   fresh && fresh.includes("(room hollow 4 3)") && fresh.includes("(carry)") ? pass : fail)("over",
    `continue: ${cont}; a short R kept the save ${!!shortKept} and stayed ${shortStayed}; held: wiped ${wiped === null}; phases: ${order}; the new save: ${fresh ? fresh.slice(0, 80) : fresh}`);
}

// D39: the fullscreen button. On the start screen it shows and stays; a
// click on it asks for fullscreen and goes there, without stepping in (not a
// gesture to the game); F goes back. In play it fades after 2.5 s and a mouse
// move brings it back. With the Fullscreen API taken away (as on iPhone
// Safari) it is hidden and F asks for nothing.
async function fsState() {
  return await evaluate(`(() => { const b = document.getElementById("fs"); const r = b.getBoundingClientRect();
    return { hidden: b.hidden, faded: b.classList.contains("faded"), on: b.classList.contains("on"),
             x: r.left + r.width / 2, y: r.top + r.height / 2, full: !!document.fullscreenElement,
             el: document.fullscreenElement ? document.fullscreenElement.id : "" }; })()`);
}
if (LEGS.includes("fullscreen")) {
  ran.add("fullscreen");
  await open("trace&frame=on&new");
  await waitFor(() => lines.find((l) => l === "harkfell: frame start"), 10000, "fullscreen: frame start");
  await sleep(3200);
  const start = await fsState();
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x, y: start.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: start.x, y: start.y, button: "left", clickCount: 1 });
  const onLine = await waitFor(() => lines.find((l) => l === "harkfell: page fullscreen on" || l.startsWith("harkfell: page fullscreen refused")), 10000, "fullscreen: on");
  const asked = !!lines.find((l) => l === "harkfell: page fullscreen request");
  await sleep(300);
  const full = await fsState();
  await sleep(700);
  const stayed = !lines.find((l) => l === "harkfell: frame start-out");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "f", code: "KeyF", text: "f" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "f", code: "KeyF" });
  const offLine = await waitFor(() => lines.find((l) => l === "harkfell: page fullscreen off"), 10000, "fullscreen: off");
  const left = await fsState();
  const stayed2 = !lines.find((l) => l === "harkfell: frame start-out");
  // step in; in play the button fades, and the mouse brings it back
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "x", code: "KeyX" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "x", code: "KeyX" });
  await waitFor(() => lines.find((l) => l === "harkfell: frame play"), 30000, "fullscreen: frame play");
  await sleep(3300);
  const idle = await fsState();
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 200, y: 200 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 210, y: 205 });
  await sleep(200);
  const woken = await fsState();
  // no Fullscreen API
  const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", { source:
    "delete Element.prototype.requestFullscreen; delete Element.prototype.webkitRequestFullscreen;" });
  await open("trace&frame=on&new");
  await sleep(500);
  const none = await fsState();
  const n0 = lines.length;
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "f", code: "KeyF", text: "f" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "f", code: "KeyF" });
  await sleep(500);
  const noAsk = !lines.slice(n0).find((l) => l.startsWith("harkfell: page fullscreen"));
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  (!start.hidden && !start.faded && asked && onLine === "harkfell: page fullscreen on" && full.full && full.el === "game" && full.on &&
   stayed && offLine && !left.full && !left.on && stayed2 && idle.faded && !woken.faded && none.hidden && noAsk ? pass : fail)("fullscreen",
    `start screen: shown ${!start.hidden}, not faded after 3 s ${!start.faded}; click: asked ${asked}, ${onLine}, fullscreen element #${full.el}; ` +
    `start screen kept ${stayed}; F: ${offLine}, fullscreen ${left.full}; kept ${stayed2}; play: faded after 3.3 s ${idle.faded}, back on a mouse move ${!woken.faded}; ` +
    `no API: hidden ${none.hidden}, F asks nothing ${noAsk}`);
}

// 0.1.1: the cues' latency, one build, both paths. Walking in the Climb Back
// plays step cues. By default they are the bridge's (mixed in the
// AudioWorklet): the readout gives the last play's wait for its first render
// quantum. With ?sound=cues:ring they go the old way, into the cue sink: the
// readout gives the queue ahead of the last cue. Both leave out the device's
// output latency, so the two are comparable; this box is not a phone.
async function cueLine() {
  const before = lines.length;
  await evaluate(`SigilWebApp.dispatch("cues", "")`);
  const l = await waitFor(() => lines.slice(before).find((x) => x.startsWith("harkfell: cues ")), 5000, "cues");
  const w = l.split(" ");
  const num = (k) => { const i = w.indexOf(k); return i >= 0 && w[i + 1] !== "-" ? Number(w[i + 1]) : null; };
  return { line: l, path: w[2], mode: w[3], plays: num("plays"), ring: num("ring-ms"), lag: num("lag-ms") };
}
async function walkUntil(pred, ms) {
  const t0 = Date.now();
  let k = 0;
  while (Date.now() - t0 < ms) {
    const key = k++ % 2 ? ["ArrowLeft", 37] : ["ArrowRight", 39];
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: key[0], code: key[0], windowsVirtualKeyCode: key[1] });
    await sleep(700);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: key[0], code: key[0], windowsVirtualKeyCode: key[1] });
    const c = await cueLine();
    if (pred(c)) return c;
  }
  return await cueLine();
}
if (LEGS.includes("cues")) {
  ran.add("cues");
  await open("trace&room=reedfen:10,4");
  const br = await walkUntil((c) => c.plays >= 3 && c.lag !== null, 60000);
  await open("trace&room=reedfen:10,4&sound=cues:ring");
  const rg = await walkUntil((c) => c.ring !== null, 60000);
  (br.path === "bridge" && br.mode === "worklet" && br.plays >= 3 && br.lag !== null &&
   rg.path === "ring" && rg.ring !== null && br.lag < rg.ring ? pass : fail)("cues",
    `bridge: ${br.line.slice(15)}; ring: ${rg.line.slice(15)}`);
}

if (LEGS.includes("errors")) {
  ran.add("errors");
  errors.length === 0 ? pass("errors", "no console error or exception") : fail("errors", errors.slice(0, 5).join(" | "));
}

console.log(failed ? "RESULT: FAIL" : "RESULT: PASS");
shutdown(failed ? 1 : 0);
