// shot.mjs - one PNG of the web build's canvas, at exactly the size of what
// the game draws (one texel per view pixel, times --scale).
//
//   node scripts/shot.mjs BUILD OUT.png --query "room=reedfen:9,3&still"
//                         [--scale N] [--port N] [--cdp N] [--world DIR | --baked]
//
// The rooms drawn are the working tree's world/ (or --world DIR), handed to
// the page before it loads, so an edited room shows without rebuilding the
// wasm; --baked draws the world baked into build/web instead.
//
// Serves BUILD on loopback, boots headless Chrome (SwiftShader) on
// index.html?trace&QUERY, waits for the game to say what it is showing
// ("harkfell: world ..." then "harkfell: room ..." or "harkfell: view ... W
// H"), sets the viewport to W*scale x H*scale CSS pixels at a device pixel
// ratio of 1, so the game's whole-scale fit ((engine view)) lands exactly
// on the canvas, and reads the canvas in the frame the game draws it
// (preserveDrawingBuffer is off). The shape (the server, the process-group
// kill, the CDP plumbing) is Crash The Stack's scripts/shot-web.mjs at master
// e737d21, much reduced.
//
// Prints "shot -> OUT (W x H)"; SETUP-FAILED and exit 2 when the page never
// said what it shows, or printed a world problem (a shot of a broken world
// is not a shot of the room); TIMED-OUT and exit 2 after 120 s.
// Used by scripts/room-shot and scripts/region-sheet.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--query", "--scale", "--port", "--cdp", "--world"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const OUT = positional[1] || "/tmp/harkfell-shot.png";
const QUERY = opt("--query", "");
const SCALE = parseInt(opt("--scale", "2"), 10);
const PORT = parseInt(opt("--port", "8391"), 10);
const CDP = parseInt(opt("--cdp", "9391"), 10);

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: ${ROOT}/index.html missing; build --config web first`); process.exit(2); }
const stamp = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/version: "([^"]*)"/) || [])[1];
console.log(`subject: ${ROOT} version ${stamp}`);

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

const udd = fs.mkdtempSync("/tmp/harkfell-shot-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=800,400", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 800).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => shutdown(130));
const lines = [];
setTimeout(() => { console.log("TIMED-OUT after 120 s; console: " + JSON.stringify(lines.slice(0, 20))); shutdown(2); }, 120000).unref();

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch { /* not up yet */ }
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target"); shutdown(2); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") lines.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
  if (msg.method === "Runtime.exceptionThrown") lines.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 800, height: 352, deviceScaleFactor: 1, mobile: false });

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitLine(re, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (let i = 0; i < lines.length; i++) { const m = lines[i].match(re); if (m) return m; }
    await sleep(50);
  }
  return null;
}

// The working tree's world (the files (harkfell source) reads), handed to the
// page before it loads, so a shot shows the rooms as they are on disk now and
// not as they were when build/web was built. --baked uses the built page's.
// a world file, not an editor's lock or autosave (.#x.room): (harkfell source)'s rule
const worldName = (n, suf) => n.endsWith(suf) && !/^[.#]/.test(n);
function worldFiles(dir) {
  const out = [];
  if (fs.existsSync(path.join(dir, "world.sgl"))) out.push("world.sgl");
  const rd = path.join(dir, "regions");
  if (fs.existsSync(rd)) for (const n of fs.readdirSync(rd).sort()) if (worldName(n, ".map")) out.push("regions/" + n);
  const rm = path.join(dir, "rooms");
  if (fs.existsSync(rm)) for (const r of fs.readdirSync(rm).sort()) for (const n of fs.readdirSync(path.join(rm, r)).sort()) if (worldName(n, ".room")) out.push("rooms/" + r + "/" + n);
  return out.map((f) => ["world/" + f, fs.readFileSync(path.join(dir, f), "utf8")]);
}
if (!args.includes("--baked")) {
  const live = worldFiles(path.resolve(opt("--world", "world")));
  await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.HARKFELL_WORLD_LIVE = " + JSON.stringify(live) + ";" });
  console.log(`world: live, ${live.length} files from ${opt("--world", "world")}`);
} else console.log("world: baked into the page at build time");
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&${QUERY}` });
const world = await waitLine(/^harkfell: world (\d+) files, (\d+) problems/, 60000);
if (!world) { console.log("SETUP-FAILED: no world line in 60 s; console: " + JSON.stringify(lines.slice(0, 20))); shutdown(2); await new Promise(() => {}); }
if (world[2] !== "0") {
  await sleep(300);
  console.log("SETUP-FAILED: the world has problems:\n" + lines.filter((l) => l.startsWith("harkfell: problem")).join("\n"));
  shutdown(2); await new Promise(() => {});
}
const noRoom = lines.find((l) => l.startsWith("harkfell: no-room"));
if (noRoom) { console.log("SETUP-FAILED: " + noRoom); shutdown(2); await new Promise(() => {}); }
const view = await waitLine(/^harkfell: view \S+ (\d+) (\d+)$/, 1500);
const [w, h] = view ? [parseInt(view[1], 10), parseInt(view[2], 10)] : [400, 176];
await send("Emulation.setDeviceMetricsOverride", { width: w * SCALE, height: h * SCALE, deviceScaleFactor: 1, mobile: false });
await sleep(1200);
const data = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const c = document.getElementById("stage"); resolve([c.width, c.height, c.toDataURL("image/png")]);
})))`);
if (data[0] !== w * SCALE || data[1] !== h * SCALE) {
  console.log(`SETUP-FAILED: the canvas is ${data[0]}x${data[1]}, not ${w * SCALE}x${h * SCALE}`);
  shutdown(2); await new Promise(() => {});
}
fs.writeFileSync(OUT, Buffer.from(data[2].split(",")[1], "base64"));
const firstError = lines.findIndex((l) => /error|unbound|exception|trap|FATAL/i.test(l));
if (firstError >= 0) console.log("console error: " + lines.slice(Math.max(0, firstError - 2), firstError + 3).join(" | "));
console.log(`shot -> ${OUT} (${w * SCALE} x ${h * SCALE}; view ${w} x ${h} at ${SCALE}x)`);
shutdown(firstError >= 0 ? 1 : 0);
