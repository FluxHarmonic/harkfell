// Headless acceptance check against the staged /play/ tree and hashed R2 URL.
// Uses Chrome's offline emulation, with the HTTP cache disabled.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const root = path.resolve(process.argv[2] || "build/site");
const updates = process.argv.includes("--updates");
let revision = 0;
let offlineGate = false;
const profile = fs.mkdtempSync("/tmp/harkfell-pwa-");
const types = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const requests = [];
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  requests.push(pathname);
  // Chrome's browser-level worker update checks are outside the page's
  // network emulation. Deny all network bytes as an additional control.
  if (offlineGate) { res.writeHead(503).end(); return; }
  const file = path.resolve(root, "." + pathname + (pathname.endsWith("/") ? "index.html" : ""));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    // Serve two coherent releases without changing the staged files: the
    // old metadata/worker first, then this release's metadata/new worker.
    if (updates && pathname === "/play/sw.js") {
      bytes = Buffer.from(bytes.toString().replace(/const VERSION = "([^"]+)";/,
        (_, stamp) => `const VERSION = "${stamp}-acceptance-${revision}";`));
    }
    if (updates && revision === 0 && pathname === "/play/version.json") {
      const info = JSON.parse(bytes);
      info.version = "0.2.0";
      info.summary = "Glasswood and the third harmonic.";
      bytes = Buffer.from(JSON.stringify(info));
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store", "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp", "Cross-Origin-Resource-Policy": "same-origin" });
    res.end(bytes);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
spawnSync("sh", ["-c", "pactl list short sinks 2>/dev/null | grep -q worker-null || pactl load-module module-null-sink sink_name=worker-null >/dev/null 2>&1 || true"]);
const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=1000,760", "about:blank"],
{ detached: true, stdio: "ignore", env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(predicate, label, timeout = 90000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await predicate()) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}
let ws;
const lines = [], errors = [];
const networkURLs = new Map(), networkFailures = [];
let id = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression: `(async () => (${expression}))()`, awaitPromise: true, returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
try {
  await wait(() => fs.existsSync(path.join(profile, "DevToolsActivePort")), "Chrome debugger", 20000);
  const port = fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0];
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const p = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) p.reject(new Error(JSON.stringify(message.error)));
      else p.resolve(message.result);
    } else if (message.method === "Runtime.consoleAPICalled") {
      const line = message.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      lines.push(line);
      if (message.params.type === "error") errors.push(line);
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    else if (message.method === "Network.requestWillBeSent") networkURLs.set(message.params.requestId, message.params.request.url);
    else if (message.method === "Network.loadingFailed") networkFailures.push({
      url: networkURLs.get(message.params.requestId), ...message.params
    });
  });
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  async function boot(query = "trace&frame=off&test-room") {
    lines.length = 0;
    await send("Page.navigate", { url: `${origin}/play/?${query}` });
    await wait(() => lines.some((line) => line.startsWith("harkfell: boot")), "game boot");
    await wait(() => evaluate("!!navigator.serviceWorker.controller"), "worker controlling first load");
    await wait(() => lines.some((line) => line.startsWith("harkfell: sound cues-moving")), "movement cues ready");
  }
  await boot();
  assert.equal(await evaluate("(await navigator.serviceWorker.ready).scope"), origin + "/play/");
  const wasm = fs.readFileSync(path.join(root, "play/index.html"), "utf8").match(/data-wasm="([^"]+)"/)[1] + ".wasm";
  assert.match(wasm, /^w\/[a-f0-9]{16}\/harkfell.wasm$/);
  const cache = await evaluate(`(async () => {
    const names = (await caches.keys()).filter(n => n.startsWith('harkfell-play-'));
    const cache = await caches.open(names[0]);
    return { names, urls: (await cache.keys()).map(r => new URL(r.url).pathname) };
  })()`);
  assert.equal(cache.names.length, 1);
  assert(cache.urls.includes("/play/" + wasm));
  assert(cache.urls.some((url) => url.endsWith("assets/sigil-wasm-audio.js")));
  const manifest = await evaluate("(await fetch('assets/manifest.webmanifest')).json()");
  assert.equal(manifest.name, "Harkfell");
  assert.equal(new URL(manifest.scope, origin + "/play/assets/manifest.webmanifest").pathname, "/play/");
  const installability = await send("Page.getInstallabilityErrors");
  assert.deepEqual(installability.installabilityErrors, []);
  for (const icon of manifest.icons) {
    assert.equal(await evaluate(`(async () => {
      const response = await fetch('assets/' + ${JSON.stringify(icon.src)});
      await response.arrayBuffer();
      return response.status;
    })()`), 200);
  }
  const before = requests.length;
  offlineGate = true;
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await boot();
  assert.equal(await evaluate("crossOriginIsolated"), true);
  // Fetch every precached item offline, including tunes not used in the first room.
  const misses = await evaluate(`(async () => {
    const cache = await caches.open(${JSON.stringify(cache.names[0])});
    const misses = [];
    for (const request of await cache.keys()) {
      try {
        const response = await fetch(request.url);
        await response.arrayBuffer();
        if (!response.ok) misses.push({ url: request.url, status: response.status });
      } catch (error) {
        misses.push({ url: request.url, error: error.message, cached: !!(await cache.match(request)) });
      }
    }
    return misses;
  })()`);
  assert.deepEqual(misses, []);
  async function where() {
    const first = lines.length;
    await evaluate("SigilWebApp.dispatch('where', '')");
    await wait(() => lines.slice(first).some((line) => line.startsWith("harkfell: at ")), "body position", 5000);
    return Number(lines.slice(first).find((line) => line.startsWith("harkfell: at ")).split(" ")[2]);
  }
  const x = await where();
  await evaluate("SigilWebApp.dispatch('keydown', 'ArrowRight')");
  await sleep(600);
  await evaluate("SigilWebApp.dispatch('keyup', 'ArrowRight')");
  assert((await where()) > x + 5, "body moves while offline");
  assert.deepEqual(requests.slice(before).filter((url) => url !== "/play/sw.js"), [],
    "offline gameplay requests no uncached resources");
  assert.deepEqual(errors, []);
  console.log(`PASS offline: first load installs /play/ worker; hashed R2 wasm and ${cache.urls.length} resources cached; offline reload, isolation and movement succeed with HTTP cache disabled`);
  if (updates) {
    offlineGate = false;
    await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    // First public/first-ever launch is quiet. Drawing it records 0.2.0.
    await boot("trace&frame=on&new");
    await wait(() => evaluate("localStorage.getItem('update-seen') === '\"0.2.0\"'"), "first launch baseline");
    let first = lines.length;
    await evaluate("SigilWebApp.dispatch('update-lines', '')");
    assert(!lines.slice(first).some((line) => line.startsWith("harkfell: update-line")));
    revision = 1;
    await evaluate("harkfellUpdate.check()");
    await wait(() => evaluate("harkfellUpdate.state === 'waiting'"), "new worker waiting");
    first = lines.length;
    await evaluate("SigilWebApp.dispatch('update-lines', '')");
    assert(lines.slice(first).some((line) => line.includes("A new version is ready. Reload to step into it.")));
    assert.equal(await evaluate("harkfellUpdate.info.version"), "0.2.0", "old page keeps its own release metadata");
    // The waiting line is drawn at view y=116; take it through a real tap.
    const point = await evaluate(`(() => {
      const c = document.getElementById('stage'), b = c.getBoundingClientRect();
      const s = Math.max(1, Math.floor(Math.min(c.width / 400, c.height / 176)));
      return { x: b.left + c.width / 2 * b.width / c.width,
        y: b.top + ((c.height - 176 * s) / 2 + 113 * s) * b.height / c.height };
    })()`);
    await wait(() => evaluate(`SigilWebApp.dispatch('update-tap', '${point.x},${point.y}') === 1`), "reload line hit target", 20000);
    lines.length = 0;
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point });
    await wait(() => lines.some((line) => line.startsWith("harkfell: boot")), "reload on chosen update");
    await wait(() => evaluate("localStorage.getItem('update-seen') === '\"0.3.0\"'"), "updated launch marked seen");
    first = lines.length;
    await evaluate("SigilWebApp.dispatch('update-lines', '')");
    const info = JSON.parse(fs.readFileSync(path.join(root, "version.json")));
    assert.equal(info.version, "0.3.0");
    assert(lines.slice(first).some((line) => line.includes(`New in 0.3.0: ${info.summary}`)));
    assert(!lines.some((line) => line.includes("frame start-out")), "reload tap does not step into the opening");
    const names = await evaluate("(await caches.keys()).filter(n => n.startsWith('harkfell-play-'))");
    assert.equal(names.length, 1);
    assert(names[0].endsWith("-acceptance-1"), "activation drops the old cache");
    await sleep(1500);  // capture the quiet line after its normal fade-in
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(root, "..", "update-start-screen.png"), Buffer.from(shot.data, "base64"));
    await boot("trace&frame=on&new");
    await wait(() => lines.some((line) => line.includes("frame words")), "second launch start words");
    first = lines.length;
    await evaluate("SigilWebApp.dispatch('update-lines', '')");
    assert(!lines.slice(first).some((line) => line.includes("New in")), "announcement is once per version");
    assert.deepEqual(errors, []);
    console.log("PASS updates: waiting line; tap applies worker and reloads without stepping in; New in 0.3.0 uses version.json, persists once, and old cache is removed");
  }
} catch (error) {
  console.error(error.stack);
  console.error(lines.slice(-20).join("\n"));
  console.error(JSON.stringify(networkFailures, null, 2));
  process.exitCode = 1;
} finally {
  ws?.close();
  server.closeAllConnections();
  server.close();
  try { process.kill(-chrome.pid, "SIGTERM"); } catch {}
  await sleep(1000);
  try { process.kill(-chrome.pid, "SIGKILL"); } catch {}
  fs.rmSync(profile, { recursive: true, force: true });
}
