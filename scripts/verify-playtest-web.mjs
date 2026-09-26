#!/usr/bin/env node
// scripts/verify-playtest-web.mjs [BUILD-DIR] - Substratic's playtest reports
// on Harkfell's web build, in headless Chrome:
//
//   off        without ?playtest, F2 opens no note
//   report     with ?playtest, F2 opens the note over the canvas, focused;
//              typed key by key and Enter, Substratic's tools/serve.mjs
//              writes report.json (the note, the room REGION:X,Y, the cell,
//              the position, the save datum, the input log from the room's
//              entry, platform web) and a PNG the size of the canvas, not blank
//   keys       F2 reaches the game's dispatch (the spy's control) and no key
//              typed into the note does
//   resumes    before the report ArrowLeft held 1.2 s moves the body over
//              10 px left (the control; the body starts against a stone on
//              its right); after it ArrowRight held 1.2 s moves it back over
//              3 px, into the ground the control cleared (a game left
//              waiting on the report moves it 0). A hold's distance under
//              headless SwiftShader scatters (0.5 s: 2 to 42 px, on the
//              pre-port build too), hence the long hold and low bars
//   discard    F2 then Escape: "playtest discarded", nothing written
//   console    no uncaught error, no console.error
//
// The server is Substratic's tools/serve.mjs (SUBSTRATIC_SERVE, or the one in
// the locked substratic under ~/.sigil/deps), not isolated: the page's audio
// takes its worklet-msg path. Chrome over the DevTools protocol with Node's
// own WebSocket. One PASS/FAIL per check, then GREEN / RED (exit 1), or
// SETUP-FAILED (exit 2).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const buildDir = path.resolve(process.argv[2] || "build/web");
const PORT = Number(process.env.PORT || 8215);
const CDP_PORT = Number(process.env.CDP_PORT || 9355);
const CHROME = process.env.CHROME || "google-chrome";
const work = fs.mkdtempSync(path.join(os.tmpdir(), "harkfell-verify-playtest-web-"));
const reports = path.join(work, "reports");
let fails = 0;
const say = (s) => console.log(`verify-playtest-web: ${s}`);
const pass = (name) => say(`PASS ${name}`);
const fail = (name, why) => { say(`FAIL ${name} (${why})`); fails++; };
const procs = [];
function cleanup() { for (const p of procs) { try { process.kill(-p.pid, "SIGKILL"); } catch { try { p.kill("SIGKILL"); } catch {} } } }
function setupFailed(why) { say(`SETUP-FAILED ${why}`); cleanup(); process.exit(2); }
process.on("exit", cleanup);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findServe() {
  if (process.env.SUBSTRATIC_SERVE) return process.env.SUBSTRATIC_SERVE;
  const lock = fs.readFileSync("sigil.lock", "utf8");
  const m = lock.match(/name: "substratic"[^)]*?sha: "([0-9a-f]{40})"/);
  if (!m) setupFailed("no substratic sha in sigil.lock (set SUBSTRATIC_SERVE)");
  return path.join(os.homedir(), ".sigil/deps", `github-substratic-substratic-${m[1]}`, "tools/serve.mjs");
}
const SERVE = findServe();
if (!fs.existsSync(SERVE)) setupFailed(`no ${SERVE}`);
if (!fs.existsSync(path.join(buildDir, "index.html"))) setupFailed(`no ${buildDir}/index.html`);
if (!fs.existsSync(path.join(buildDir, "assets/substratic/substratic.js"))) setupFailed("the build has no assets/substratic/substratic.js");

const server = spawn("node", [SERVE, buildDir, String(PORT), "--reports", reports], { detached: true, stdio: ["ignore", "pipe", "pipe"] });
procs.push(server);
let serverLog = "";
server.stdout.on("data", (d) => { serverLog += d; });
server.stderr.on("data", (d) => { serverLog += d; });
for (let i = 0; !serverLog.includes("serving"); i++) { if (i > 50) setupFailed(`server: ${serverLog}`); await sleep(100); }

// The audio rule (worker-instructions): a null sink as well as --mute-audio.
spawnSync("sh", ["-c", "pactl list short sinks 2>/dev/null | grep -q worker-null || pactl load-module module-null-sink sink_name=worker-null >/dev/null 2>&1 || true"]);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${path.join(work, "chrome")}`,
                              "--no-first-run", "--no-default-browser-check", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                              "--window-size=1280,720", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "about:blank"],
                     { detached: true, stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
procs.push(chrome);
let target = null;
for (let i = 0; i < 100 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* not up yet */ }
  if (!target) await sleep(200);
}
if (!target) setupFailed("no Chrome page target");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1;
const waiting = new Map();
let lines = [];
const errors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); return; }
  if (m.method === "Runtime.consoleAPICalled") {
    const text = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
    lines.push(text);
    if (m.params.type === "error") errors.push(`console.error: ${text}`);
  }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
};
function cdp(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => waiting.set(id, res));
}
async function evaluate(expr) { return (await cdp("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value; }
async function waitLine(pred, ms, from = 0) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const l = lines.slice(from).find(pred); if (l) return l; await sleep(100); }
  return null;
}
async function key(k, code, vk) {
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
}
async function open(query) {
  lines = [];
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/?${query}` });
  if (!(await waitLine((l) => l.startsWith("harkfell: boot"), 60000))) { console.log(lines.slice(-20).join("\n")); setupFailed(`?${query}: no boot line`); }
  await sleep(1500);
  // the loader's key dispatches, watched below the game
  await evaluate(`(() => { const a = globalThis.SigilWebApp; window.__keys = []; const d = a.dispatch.bind(a);
    a.dispatch = function (t, p) { if (t === "keydown") window.__keys.push(p); return d(t, p); }; return true; })()`);
}
async function where() {
  const from = lines.length;
  await evaluate(`SigilWebApp.dispatch("where", ""), true`);
  const l = await waitLine((x) => x.startsWith("harkfell: at "), 5000, from);
  if (!l) return null;
  const [, , x, y, mode] = l.split(" ");
  return { x: Number(x), y: Number(y), mode };
}
// An arrow held MS; answers [x before, x after] from the where probe.
async function walk(arrow, ms) {
  const vk = arrow === "ArrowLeft" ? 37 : 39;
  const a = await where();
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: arrow, code: arrow, windowsVirtualKeyCode: vk });
  await sleep(ms);
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: arrow, code: arrow, windowsVirtualKeyCode: vk });
  await sleep(300);
  const b = await where();
  return [a && a.x, b && b.x];
}
const noteOpen = () => evaluate("(() => { const n = document.getElementById('sub-note'); return !!n && n.style.display === 'block' && document.activeElement === n.querySelector('input'); })()");

await cdp("Runtime.enable");
await cdp("Page.enable");

// ---- off: no ?playtest, no note -------------------------------------------------------
await open("trace&frame=off&new");   // ?trace: the boot line
await key("F2", "F2", 113);
await sleep(1500);
if (!(await noteOpen()) && !lines.some((l) => l.startsWith("substratic: playtest capture "))) pass("off (no ?playtest: F2 opened nothing)");
else fail("off", "F2 opened the note without ?playtest");

// ---- report ----------------------------------------------------------------------------------
await open("playtest&frame=off&new&trace");
const NOTE = "reeds too thick";
let rep = null;
{
  const [c1, c2] = await walk("ArrowLeft", 1200);
  if (c1 != null && c2 != null && c2 < c1 - 10) pass(`resumes control (before the report, ArrowLeft moved the body x ${c1} -> ${c2})`);
  else fail("resumes control", `x ${c1} -> ${c2}`);
  const c0 = lines.length;
  await key("F1", "F1", 112);
  await sleep(500);
  await key("F2", "F2", 113);
  const cap = await waitLine((l) => l.startsWith("substratic: playtest capture "), 5000, c0);
  await sleep(300);
  if (cap && (await noteOpen())) pass("F2 opened the note, focused");
  else fail("report", cap ? "the note is not open and focused" : "no capture line");
  for (const c of NOTE) {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: c, text: c, unmodifiedText: c });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: c });
  }
  await key("Enter", "Enter", 13);
  const got = await waitLine((l) => l.startsWith("substratic: playtest report "), 8000, c0);
  if (got) {
    const dir = path.join(reports, path.basename(got.slice("substratic: playtest report ".length).trim()));
    try { rep = { dir, json: JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8")) }; } catch (e) { fail("report", `report.json: ${e.message}`); }
  } else fail("report", `no report line; server: ${serverLog.slice(-300)}`);
}
if (rep) {
  const j = rep.json, loc = j.location || {};
  if (j.note === NOTE) pass("report note"); else fail("report note", JSON.stringify(j.note));
  if (j.platform === "web" && j.game === "harkfell") pass("report platform web, game harkfell"); else fail("report", `platform ${j.platform}, game ${j.game}`);
  if (/^[a-z-]+:\d+,\d+$/.test(loc.room || "")) pass(`report room (${loc.room})`); else fail("report room", JSON.stringify(loc.room));
  if (Array.isArray(loc.cell) && loc.cell.length === 2 && Array.isArray(loc.position) && loc.position.length === 2) pass(`report cell ${JSON.stringify(loc.cell)} and position`);
  else fail("report cell/position", JSON.stringify(loc));
  if (typeof j["state-sexp"] === "string" && j["state-sexp"].startsWith("(")) pass("report state (the save datum)"); else fail("report state", "no state-sexp");
  if (typeof (j.input || {})["room-entered-tick"] === "number") pass("input log from the room's entry"); else fail("input", JSON.stringify(j.input));
  const canvas = await evaluate("(() => { const c = document.querySelector('canvas'); return [c.width, c.height]; })()");
  const info = pngInfo(fs.readFileSync(path.join(rep.dir, "screenshot.png")));
  if (info.w === canvas[0] && info.h === canvas[1]) pass(`screenshot ${info.w}x${info.h}, the canvas's size`); else fail("screenshot", `${info.w}x${info.h} against ${canvas}`);
  if (info.lit > 0.01) pass(`screenshot not blank (${(info.lit * 100).toFixed(1)}% lit)`); else fail("screenshot", `${(info.lit * 100).toFixed(2)}% lit`);
}
{
  const keys = await evaluate("window.__keys") || [];
  if (keys.includes("F2")) pass("F2 reached the game's dispatch (the spy works)"); else fail("keys", "the control: F2 never reached the dispatch");
  const leaked = keys.filter((k) => k.length === 1);
  if (leaked.length === 0) pass("the note's typing never reached the game"); else fail("keys", `leaked: ${leaked.join("")}`);
}

// ---- resumes ---------------------------------------------------------------------------------
{
  await sleep(500);
  const [a, b] = await walk("ArrowRight", 1200);
  if (a != null && b != null && b > a + 3) pass(`resumes (after the report, ArrowRight moved the body x ${a} -> ${b})`);
  else fail("resumes", `x ${a} -> ${b}`);
}

// ---- discard ---------------------------------------------------------------------------------
{
  const n = fs.readdirSync(reports).length;
  const c0 = lines.length;
  await key("F2", "F2", 113);
  await waitLine((l) => l.startsWith("substratic: playtest capture "), 5000, c0);
  await sleep(300);
  await key("Escape", "Escape", 27);
  const d = await waitLine((l) => l === "substratic: playtest discarded", 3000, c0);
  await sleep(500);
  if (d) pass("discard closed the note (the game said so)"); else fail("discard", "no discarded line");
  if (fs.readdirSync(reports).length === n) pass("discard wrote nothing"); else fail("discard", "a report was written");
  if (!(await noteOpen())) pass("the note is gone"); else fail("discard", "the note is still open");
}

if (errors.length === 0) pass("no uncaught error, no console.error"); else fail("console", errors.slice(0, 3).join(" | "));
say(`artifacts in ${work}`);
if (fails === 0) { say("GREEN"); process.exit(0); } else { say(`RED (${fails})`); process.exit(1); }

function pngInfo(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return { w: 0, h: 0, lit: 0 };
  let off = 8, w = 0, h = 0, bpp = 4; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bpp = data[9] === 6 ? 4 : 3; }
    if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp, cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  let lit = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i], a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      cur[i] = (x + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
    for (let i = 0; i < stride; i += bpp) if (cur[i] + cur[i + 1] + cur[i + 2] > 30) lit++;
    cur.copy(prev);
  }
  return { w, h, lit: lit / (w * h) };
}
