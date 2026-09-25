// verify-site.mjs - the browser arm for harkfell.com's staged deploy tree:
// the landing at /, the game at /play/.
//
//   node verify-site.mjs DIR [--port N] [--cdp N] [--shot-dir D]
//
// DIR is what scripts/stage-web staged (with DIR.manifest beside it). The
// tree is served by scripts/serve-site.mjs's handler, which applies the
// tree's own _headers and answers a missing path with 404.html the way
// Cloudflare Pages does, to headless Chrome (SwiftShader) on loopback.
//
// Legs, PASS / FAIL <name>: <detail>:
//   manifest  DIR still hashes to DIR.manifest (the tree was not touched
//             since stage-web), and the Function and wrangler.jsonc too
//   tree      the files: play/index.html's data-wasm names w/<sha16>/harkfell
//             and that file hashes to sha16; it is the only wasm; nothing else
//             is over Pages' 25 MiB cap; _headers isolates /play/* and not /;
//             the fonts ship with OFL.txt; 404.html exists; no em dash in the
//             landing's or the 404's text (customer copy); every region the
//             landing names (data-regions) is in the staged game's world
//   landing   / in Chrome: the title, the three IM Fell faces loaded (not a
//             fallback), every image decoded, the Play link resolving to
//             /play/, the licence and source links, NOT cross-origin
//             isolated; every request 2xx
//   carousel  the hero changes picture by itself, a click on a dot shows that
//             picture, one shows at a time, and under prefers-reduced-motion
//             nothing changes by itself
//   contrast  the Play button's text against its background, plain and with
//             :hover, :focus-visible and :active forced: at least 4.5:1
//   play      a click on Play: /play/ loads, IS cross-origin isolated, the
//             wasm comes from /play/w/<sha16>/harkfell.wasm as application/
//             wasm, the game says "harkfell: world N files, 0 problems", the
//             canvas holds drawn pixels, and every request the page made was
//             2xx (a file the stage left out shows up here)
//   news      /news/ lists every post newest first; each post page answers
//             with its title, date and version; no em dash (D38)
//   feeds     /news/feed.xml (RSS 2.0, parsed by the browser) and feed.json
//             (JSON Feed 1.1) list every post as /news/ does, newest first,
//             with every URL absolute under https://harkfell.com (bodies
//             included); <link rel="alternate"> on / and /news/; an RSS link
//   version   /version.json parses, has exactly its five fields, names the
//             staged game's stamp and package.sgl's version, points at that
//             version's post and carries its summary, which is printable
//             ASCII (what the game can draw until the runtime glyph atlas)
//             and at most 120 characters; served no-store as JSON (D38)
//   missing   a missing page, a missing file under /play/ and a wasm hash
//             nobody published all answer 404 (with the site's 404 page), never a 200 index.html
//   console   no console error and no exception over the run
//
// Any FAIL exits 1; SETUP-FAILED or a timeout exits 2. On ALL PASS it writes
// DIR.verified: the manifest's sha256, the sha256 of each gate file as it
// was when the run started, HEAD and the tree's cleanliness then, which is
// what scripts/publish-web requires. Any other outcome deletes DIR.verified.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { createHandler } from "./scripts/serve-site.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp", "--shot-dir"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
if (!positional[0]) { console.log("usage: node verify-site.mjs DIR [--port N] [--cdp N] [--shot-dir D]"); process.exit(2); }
const DIR = path.resolve(positional[0]);
const MANIFEST = DIR + ".manifest";
const VERIFIED = DIR + ".verified";
const PORT = parseInt(opt("--port", "8807"), 10);
const CDP = parseInt(opt("--cdp", "9807"), 10);
const SHOT_DIR = opt("--shot-dir", null);
const CAP = 26214400;
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
// Any crash is exit 2 with its stack, from the first line on: an uncaught
// throw exits 1 by default, which reads as a verdict (a sabotage leg once
// scored a crash on a missing 404.html as "red"). Replaced by shutdown()
// once Chrome is up.
let bail = (code) => process.exit(code);
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); bail(2); });
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); bail(2); });

// Whatever happens next, an old stamp must not outlive this run.
fs.rmSync(VERIFIED, { force: true });
// The gate's identity, taken NOW, before anything runs: every file whose
// behaviour decides the verdict (this arm, the Pages emulation it serves
// through, the manifest it checks against), HEAD, and whether the checkout had
// tracked changes. publish-web compares each with the disk at publish time; a
// gate edited, run, and restored is not the gate on disk.
const GATE_FILES = ["verify-site.mjs", "scripts/serve-site.mjs", "scripts/tree-manifest"];
const gate = GATE_FILES.map((g) => [g, sha256(fs.readFileSync(g))]);
const gateHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const gateClean = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { encoding: "utf8" }).trim() === "";
for (const f of ["index.html", "play/index.html", "_headers", "version.json", "news/index.html"]) {
  if (!fs.existsSync(path.join(DIR, f))) { console.log(`SETUP-FAILED: ${DIR}/${f} missing (scripts/stage-web builds the tree)`); process.exit(2); }
}
if (!fs.existsSync(MANIFEST)) { console.log(`SETUP-FAILED: ${MANIFEST} missing (scripts/stage-web writes it)`); process.exit(2); }
const manifestText = fs.readFileSync(MANIFEST, "utf8");
const header = Object.fromEntries(manifestText.split("\n").filter((l) => l.startsWith("# ")).map((l) => { const [k, ...v] = l.slice(2).split(" "); return [k, v.join(" ")]; }));
console.log(`subject: ${DIR} (web-stamp ${header["web-stamp"]}, head ${(header.head || "").slice(0, 12)}, manifest ${sha256(manifestText).slice(0, 16)})`);

const results = []; let failed = 0;
const pass = (n, d) => { results.push(`PASS ${n}`); console.log(`PASS ${n}: ${d}`); };
const fail = (n, d) => { results.push(`FAIL ${n}`); console.log(`FAIL ${n}: ${d}`); failed++; };
const text = (p) => fs.readFileSync(path.join(DIR, p), "utf8");

// ---- manifest (no browser) ----------------------------------------------------
{
  const want = manifestText.split("\n").filter((l) => l && !l.startsWith("#")).join("\n");
  let got = "";
  try { got = execFileSync("scripts/tree-manifest", [DIR], { encoding: "utf8" }).trim(); } catch (e) { got = `(tree-manifest failed: ${e.message})`; }
  if (got === want) pass("manifest", `${want.split("\n").length} entries, the tree and the Function as staged`);
  else {
    const a = new Set(want.split("\n")), b = new Set(got.split("\n"));
    const changed = [...b].filter((l) => !a.has(l)).map((l) => l.split("  ")[1]).concat([...a].filter((l) => !b.has(l)).map((l) => l.split("  ")[1]));
    fail("manifest", `the tree differs from ${path.basename(MANIFEST)}: ${[...new Set(changed)].slice(0, 5).join(", ")}; restage`);
  }
}

// ---- tree (no browser) ---------------------------------------------------------
let SHA16 = null;
{
  const detail = [];
  const page = text("play/index.html");
  const m = page.match(/data-wasm="w\/([0-9a-f]{16})\/harkfell"/g);
  if (!m || m.length !== 1) detail.push(`play/index.html has ${m ? m.length : 0} data-wasm="w/<sha16>/harkfell" (want 1)`);
  else {
    SHA16 = m[0].match(/[0-9a-f]{16}/)[0];
    const wp = path.join(DIR, "play/w", SHA16, "harkfell.wasm");
    if (!fs.existsSync(wp)) detail.push(`play/w/${SHA16}/harkfell.wasm missing`);
    else if (sha256(fs.readFileSync(wp)).slice(0, 16) !== SHA16) detail.push(`play/w/${SHA16}/harkfell.wasm does not hash to its name`);
  }
  const all = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : all.push(path.relative(DIR, p)); } };
  walk(DIR);
  const wasms = all.filter((f) => f.endsWith(".wasm"));
  if (wasms.length !== 1) detail.push(`${wasms.length} wasm files: ${wasms.join(", ")}`);
  const big = all.filter((f) => !f.endsWith(".wasm") && fs.statSync(path.join(DIR, f)).size > CAP);
  if (big.length) detail.push(`over the 25 MiB cap: ${big.join(", ")}`);
  const h = text("_headers");
  if (!/^\/play\/\*\s*\n(\s+.+\n)*\s+Cross-Origin-Embedder-Policy: require-corp/m.test(h)) detail.push("_headers does not give /play/* COEP require-corp");
  if (/^\/\*/m.test(h)) detail.push("_headers has a /* rule (the landing would be isolated too)");
  if (!fs.existsSync(path.join(DIR, "fonts/OFL.txt"))) detail.push("fonts/OFL.txt missing (IM Fell ships with its licence)");
  if (!fs.existsSync(path.join(DIR, "404.html"))) detail.push("404.html missing (Pages would answer a missing path with the landing, 200)");
  for (const f of ["index.html", "404.html"].filter((f) => fs.existsSync(path.join(DIR, f)))) {
    const visible = text(f).replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ");
    if (/—|&mdash;|&#8212;/.test(visible) || /—/.test(text(f))) detail.push(`${f} has an em dash`);
  }
  // The landing says which regions the game has (data-regions on its
  // .early paragraph, and the carousel shows them); the staged game must bake
  // every one of them into its world, or the page makes a false claim.
  const claim = (text("index.html").match(/data-regions="([^"]+)"/) || [])[1];
  const baked = [...page.matchAll(/"world\/regions\/([a-z0-9-]+)\.map"/g)].map((m) => m[1]);
  if (!claim) detail.push("index.html names no data-regions (the claim this leg checks)");
  else for (const r of claim.split(/\s+/)) if (!baked.includes(r)) detail.push(`the landing claims the region "${r}", and the staged game's world has only: ${[...new Set(baked)].join(", ") || "none"}`);
  for (const bad of ["play/bin", "play/native", "play/_headers", "play/harkfell.wasm", "play/assets/refs"]) if (fs.existsSync(path.join(DIR, bad))) detail.push(`${bad} is staged`);
  if (detail.length) fail("tree", detail.join("; "));
  else pass("tree", `${all.length} files; wasm ${SHA16} (${fs.statSync(path.join(DIR, "play/w", SHA16, "harkfell.wasm")).size} bytes) is the only one and hashes to its name; /play/* isolated, / not; OFL.txt, 404.html; no em dash; the regions the landing names (${claim}) are all in the game's world`);
}

// ---- the browser -----------------------------------------------------------------
const requests = [];   // [method, path, status] as served
const server = http.createServer(createHandler(DIR, (m, p, s) => requests.push([m, p, s])));
await new Promise((r, j) => { server.once("error", j); server.listen(PORT, "127.0.0.1", r); }).catch((e) => { console.log(`SETUP-FAILED: port ${PORT}: ${e.message}`); process.exit(2); });
const origin = `http://127.0.0.1:${PORT}`;

const udd = fs.mkdtempSync("/tmp/harkfell-verify-site-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=1000,800", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  process.exitCode = code;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 1500).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
bail = shutdown;
// the whole run is bounded; a hang says what it had and exits 2
setTimeout(() => { console.log(`TIMED-OUT: after 180 s; results so far: ${results.join(", ") || "none"}; ${requests.length} requests served`); shutdown(2); }, 180000).unref();

let pageWs = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); const page = list.find((t) => t.type === "page"); if (page) pageWs = page.webSocketDebuggerUrl; } catch { /* not up */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s (google-chrome on PATH?)"); shutdown(2); await new Promise(() => {}); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = []; const consoleErrors = [];
const net = new Map();   // requestId -> {url, status, mime, failed}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  const p = msg.params || {};
  if (msg.method === "Runtime.consoleAPICalled") {
    const t = (p.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    consoleLines.push(t);
    if (p.type === "error") consoleErrors.push("console.error: " + t);
  }
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  if (msg.method === "Log.entryAdded" && p.entry.level === "error") consoleErrors.push(`log: ${p.entry.text} ${p.entry.url || ""}`);
  if (msg.method === "Network.requestWillBeSent") net.set(p.requestId, { url: p.request.url, status: null, mime: null, failed: null });
  if (msg.method === "Network.responseReceived") { const r = net.get(p.requestId) || { url: p.response.url }; r.status = p.response.status; r.mime = p.response.mimeType; net.set(p.requestId, r); }
  if (msg.method === "Network.loadingFailed") { const r = net.get(p.requestId) || {}; r.failed = p.errorText; net.set(p.requestId, r); }
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Log.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn().catch(() => null); if (v) return v; await sleep(150); } return null; }
async function shot(name) {
  if (!SHOT_DIR) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(SHOT_DIR, name), Buffer.from(r.data, "base64"));
}
const netSince = (from) => [...net.values()].slice(from);
// A URL is bad when no request for it succeeded. A request the page itself
// abandoned (net::ERR_ABORTED) and then made again successfully is not a
// missing file; those are counted and reported, not failed.
const ok = (r) => !r.failed && r.status !== null && r.status >= 200 && r.status < 400;
const badRequests = (list) => {
  const good = new Set(list.filter(ok).map((r) => r.url));
  return list.filter((r) => !ok(r) && !good.has(r.url) && !/^data:/.test(r.url || ""));
};
const retried = (list) => { const good = new Set(list.filter(ok).map((r) => r.url)); return list.filter((r) => !ok(r) && good.has(r.url)).length; };

// ---- landing --------------------------------------------------------------------
{
  const mark = net.size;
  await send("Page.navigate", { url: `${origin}/` });
  const ready = await waitFor(() => evalJS("document.readyState === 'complete' && document.fonts.status === 'loaded'"), 15000);
  await sleep(500);
  const detail = [];
  if (!ready) detail.push("the page or its fonts did not finish loading in 15 s");
  const facts = await evalJS(`(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].map((f) => f.family.replace(/"/g, "") + "/" + f.style + "/" + f.status);
    const imgs = [...document.images].map((i) => [i.getAttribute("src"), i.complete && i.naturalWidth > 0, i.naturalWidth + "x" + i.naturalHeight]);
    const play = document.querySelector(".play a");
    const links = [...document.querySelectorAll("a")].map((a) => a.href);
    const h1 = document.querySelector("h1");
    return { title: document.title, faces, imgs, play: play && play.href, links,
             h1: h1 && h1.textContent.trim(), h1font: h1 && getComputedStyle(h1).fontFamily,
             isolated: self.crossOriginIsolated, text: document.body.innerText };
  })()`);
  if (facts.title !== "Harkfell") detail.push(`title "${facts.title}"`);
  if (facts.h1 !== "Harkfell") detail.push(`h1 "${facts.h1}"`);
  if (!/^"?IM Fell English SC"?/.test(facts.h1font || "")) detail.push(`the h1 is set in ${facts.h1font}`);
  for (const want of ["IM Fell English/normal/loaded", "IM Fell English/italic/loaded", "IM Fell English SC/normal/loaded"]) {
    if (!facts.faces.includes(want)) detail.push(`font ${want.split("/").slice(0, 2).join(" ")} not loaded (${facts.faces.join(", ")})`);
  }
  const badImgs = facts.imgs.filter((i) => !i[1]);
  if (facts.imgs.length < 6) detail.push(`${facts.imgs.length} images (want the carousel's five and the mark)`);
  if (badImgs.length) detail.push(`images not decoded: ${badImgs.map((i) => i[0]).join(", ")}`);
  if (facts.play !== `${origin}/play/`) detail.push(`the Play link resolves to ${facts.play}`);
  for (const want of ["https://github.com/FluxHarmonic/harkfell", "https://creativecommons.org/licenses/by/4.0/", `${origin}/fonts/OFL.txt`, `${origin}/news/`]) {
    if (!facts.links.includes(want)) detail.push(`no link to ${want}`);
  }
  if (!facts.links.some((l) => /LICENSE$/.test(l))) detail.push("no link to the code's licence");
  if (facts.isolated !== false) detail.push(`the landing is cross-origin isolated (${facts.isolated}); only /play/ should be`);
  if (/—/.test(facts.text)) detail.push("an em dash in the rendered text");
  const bad = badRequests(netSince(mark));
  if (bad.length) detail.push(`requests not 2xx: ${bad.map((r) => `${r.url} ${r.status ?? ""}${r.failed ?? ""}`).join(", ")}`);
  await shot("landing.png");
  if (detail.length) fail("landing", detail.join("; "));
  else pass("landing", `title and h1 Harkfell; ${facts.faces.length} faces loaded (IM Fell roman, italic, SC); ${facts.imgs.length} images decoded (${facts.imgs.map((i) => i[2]).join(" ")}); Play -> /play/; source and licence links; not isolated; ${netSince(mark).length} requests, all 2xx`);
}

// ---- carousel -------------------------------------------------------------------
// The hero crossfades by itself, a dot picks a picture, one picture shows at
// a time, and a reader who asked for reduced motion gets no automatic change.
{
  const detail = [];
  const state = () => evalJS(`(() => { const c = document.querySelector(".carousel"); if (!c) return null;
    const imgs = [...c.querySelectorAll(".frames img")];
    return { live: c.classList.contains("live"), n: imgs.length,
             shown: imgs.map((i, k) => i.classList.contains("shown") ? k : -1).filter((k) => k >= 0),
             visible: imgs.map((i, k) => getComputedStyle(i).opacity === "1" ? k : -1).filter((k) => k >= 0),
             current: [...c.querySelectorAll(".dots button")].map((b, k) => b.getAttribute("aria-current") === "true" ? k : -1).filter((k) => k >= 0),
             alts: imgs.every((i) => (i.getAttribute("alt") || "").length > 10),
             every: Number(c.getAttribute("data-interval")) }; })()`);
  const s0 = await state();
  if (!s0) detail.push("no .carousel on the landing");
  else {
    if (!s0.live) detail.push("the carousel's script did not run (no .live)");
    if (s0.n < 3) detail.push(`${s0.n} pictures in the carousel`);
    if (s0.shown.join() !== "0" || s0.current.join() !== "0") detail.push(`at load: shown ${s0.shown}, dot ${s0.current} (want 0, 0)`);
    if (!s0.alts) detail.push("a carousel picture without a real alt text");
    const moved = await waitFor(async () => { const s = await state(); return s.shown.length === 1 && s.shown[0] !== 0 ? s : null; }, s0.every + 3000);
    if (!moved) detail.push(`no automatic change within ${s0.every + 3000} ms`);
    // a real click on the fourth dot
    const xy = await evalJS(`(() => { const b = document.querySelectorAll(".carousel .dots button")[3]; b.scrollIntoView({block: "center"}); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: xy[0], y: xy[1], button: "left", clickCount: 1 });
    await sleep(1800);   // past the 1.4 s fade
    const s1 = await state();
    if (s1.shown.join() !== "3" || s1.current.join() !== "3" || s1.visible.join() !== "3") detail.push(`after a click on dot 4: shown ${s1.shown}, dot ${s1.current}, opaque ${s1.visible} (want 3)`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    // reduced motion: reload under the media feature; nothing moves
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await send("Page.navigate", { url: `${origin}/` });
    await waitFor(() => evalJS("document.readyState === 'complete'"), 10000);
    await sleep(s0.every + 2000);
    const s2 = await state();
    if (s2.shown.join() !== "0") detail.push(`under prefers-reduced-motion the picture changed to ${s2.shown}`);
    await send("Emulation.setEmulatedMedia", { features: [] });
    if (!detail.length) pass("carousel", `${s0.n} pictures, one shown; moved to ${moved.shown[0]} on its own within ${s0.every + 3000} ms; dot 4 shows picture 4; still under reduced motion for ${s0.every + 2000} ms`);
  }
  if (detail.length) fail("carousel", detail.join("; "));
}

// ---- contrast -------------------------------------------------------------------
// The Play button's text against its background, in each state, forced through
// DevTools (the site-wide a:hover once turned it cream on cream).
{
  const detail = [];
  await send("DOM.enable"); await send("CSS.enable");
  const { root } = await send("DOM.getDocument", { depth: 1 });
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: ".play a" });
  const got = [];
  for (const st of [[], ["hover"], ["focus", "focus-visible"], ["active", "hover"]]) {
    await send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: st });
    const c = await evalJS(`(() => {
      const a = document.querySelector(".play a"), cs = getComputedStyle(a);
      const rgb = (s) => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
      const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const L1 = lum(rgb(cs.color)), L2 = lum(rgb(cs.backgroundColor));
      return { color: cs.color, bg: cs.backgroundColor, ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) };
    })()`);
    const name = st.length ? st.join("+") : "plain";
    got.push(`${name} ${c.ratio.toFixed(1)}`);
    if (!(c.ratio >= 4.5)) detail.push(`${name}: text ${c.color} on ${c.bg} is ${c.ratio.toFixed(2)}:1 (want 4.5)`);
  }
  await send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
  if (detail.length) fail("contrast", detail.join("; "));
  else pass("contrast", `Play's text against its background: ${got.join(", ")} (:1, want >= 4.5)`);
}

// ---- play -----------------------------------------------------------------------
{
  const mark = net.size;
  const lineMark = consoleLines.length;
  const detail = [];
  // a real click on the link, as a visitor gets there
  const box = await evalJS(`(() => { const a = document.querySelector(".play a"); a.scrollIntoView({block: "center"}); const r = a.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  await sleep(200);
  const box2 = await evalJS(`(() => { const r = document.querySelector(".play a").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: box2[0], y: box2[1], button: "left", clickCount: 1 });
  const at = await waitFor(async () => { const h = await evalJS("location.href"); return h === `${origin}/play/` ? h : null; }, 10000);
  if (!at) detail.push(`the click did not land on /play/ (at ${await evalJS("location.href").catch(() => "?")}, link at ${box})`);
  const world = await waitFor(async () => consoleLines.slice(lineMark).find((l) => /^harkfell: world \d+ files, \d+ problems/.test(l)), 60000);
  if (!world) detail.push("the game never said \"harkfell: world ...\" within 60 s");
  else if (!/, 0 problems/.test(world)) detail.push(`the world loaded with problems: ${world}`);
  // Settle: the page abandons fetches in flight during its first frames and
  // tries a tune again 2 s later (index.template.html, fetchTune: three tries).
  // Wait until every URL it asked for has succeeded, or 15 s, before judging.
  const settled = await waitFor(async () => badRequests(netSince(mark)).length === 0, 15000);
  await sleep(1000);
  const isolated = await evalJS("self.crossOriginIsolated").catch(() => null);
  if (isolated !== true) detail.push(`/play/ is not cross-origin isolated (${isolated})`);
  const bins = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.querySelector("canvas");
    if (!c) return resolve([0, 0, 0]);
    const gl = c.getContext("webgl2");
    if (!gl) return resolve([-1, c.width, c.height]);
    const px = new Uint8Array(4 * c.width * c.height);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const seen = new Set();
    for (let i = 0; i < px.length; i += 4 * 97) seen.add((px[i] >> 4) + "," + (px[i + 1] >> 4) + "," + (px[i + 2] >> 4));
    resolve([seen.size, c.width, c.height]);
  }))`).catch((e) => [-2, String(e).slice(0, 80), 0]);
  if (!(bins[0] >= 2)) detail.push(`the canvas holds ${bins[0]} colour bins (${bins[1]}x${bins[2]}); nothing drawn`);
  const list = netSince(mark);
  const wasmUrl = `${origin}/play/w/${SHA16}/harkfell.wasm`;
  const wasmReq = list.find((r) => r.url === wasmUrl);
  if (!wasmReq) detail.push(`no request for ${wasmUrl} (asked for: ${list.filter((r) => /\.wasm/.test(r.url)).map((r) => r.url).join(", ") || "no wasm"})`);
  else if (wasmReq.status !== 200 || wasmReq.mime !== "application/wasm") detail.push(`the wasm answered ${wasmReq.status} ${wasmReq.mime}`);
  const bad = badRequests(list);
  if (bad.length) detail.push(`requests not 2xx: ${bad.map((r) => `${r.url.replace(origin, "")} ${r.status ?? ""}${r.failed ?? ""}`).join(", ")}`);
  const served = requests.filter(([, p]) => p.startsWith("/play/")).length;
  await shot("play.png");
  if (detail.length) fail("play", detail.join("; "));
  else pass("play", `a click on Play loads /play/, isolated; "${world}"; the wasm from /play/w/${SHA16}/harkfell.wasm (200 application/wasm); canvas ${bins[1]}x${bins[2]} with ${bins[0]} colour bins; ${list.length} requests (${served} under /play/), every URL answered 2xx${retried(list) ? ` (${retried(list)} aborted by the page and fetched again)` : ""}`);
}

// ---- news -----------------------------------------------------------------------
// /news/ (D38): every post listed newest first, each post page there with its
// title, date and version, no em dash anywhere in it.
const newsPosts = [];
{
  const detail = [];
  const r = await fetch(`${origin}/news/`);
  const html = await r.text();
  if (r.status !== 200) detail.push(`/news/ answered ${r.status}`);
  const items = [...html.matchAll(/<li data-version="([^"]+)"><a href="(\/news\/[a-z0-9-]+\/)">([\s\S]*?)<\/a>\s*<time datetime="([^"]+)">[\s\S]*?<p>([\s\S]*?)<\/p><\/li>/g)]
    .map((m) => ({ version: m[1], href: m[2], title: m[3], date: m[4], summary: m[5] }));
  if (!items.length) detail.push("/news/ lists no posts");
  const order = items.map((i) => i.date + i.version);
  if (order.join() !== [...order].sort().reverse().join()) detail.push(`/news/ is not newest first: ${items.map((i) => i.date).join(" ")}`);
  for (const it of items) {
    const p = await fetch(origin + it.href);
    const body = await p.text();
    if (p.status !== 200) { detail.push(`${it.href} answered ${p.status}`); continue; }
    if (!body.includes(`data-version="${it.version}"`)) detail.push(`${it.href} is not the post for ${it.version}`);
    if (!/<h1>[^<]+<\/h1>/.test(body) || !body.includes(`<time datetime="${it.date}">`)) detail.push(`${it.href} lacks its title or date`);
    newsPosts.push(it);
  }
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const newsFiles = fs.existsSync(path.join(DIR, "news")) ? walk(path.join(DIR, "news")) : [];
  for (const f of newsFiles) if (/—|&mdash;|&#8212;/.test(fs.readFileSync(f, "utf8"))) detail.push(`${path.relative(DIR, f)} has an em dash`);
  if (detail.length) fail("news", detail.join("; "));
  else pass("news", `/news/ lists ${items.length} post(s) newest first (${items.map((i) => `${i.version} ${i.date}`).join(", ")}); each post page answers with its title, date and version; no em dash`);
}

// ---- feeds ----------------------------------------------------------------------
// /news/feed.xml (RSS 2.0) and /news/feed.json (JSON Feed 1.1), Crash's shape:
// both parse, both list every post /news/ lists, newest first, with RFC 822 /
// RFC 3339 dates, and every URL in them (the channel's, each entry's, and
// every link inside an entry's body) is absolute under https://harkfell.com.
// The pages point at them (<link rel="alternate"> on / and /news/), and /news/
// shows a visible RSS link.
{
  const detail = [];
  const SITE = "https://harkfell.com";
  const xr = await fetch(`${origin}/news/feed.xml`);
  const xmlText = await xr.text();
  if (xr.status !== 200) detail.push(`/news/feed.xml answered ${xr.status}`);
  // the browser's own XML parser: a real parse, not a regex
  const rss = await evalJS(`(() => {
    const d = new DOMParser().parseFromString(${JSON.stringify(xmlText)}, "application/xml");
    const err = d.querySelector("parsererror");
    if (err) return { error: err.textContent.slice(0, 160) };
    const rssEl = d.documentElement;
    const ch = d.querySelector("channel");
    const t = (el, sel) => { const e = el && el.getElementsByTagName(sel)[0]; return e ? e.textContent : null; };
    const self = ch && [...ch.getElementsByTagName("atom:link")].map((e) => e.getAttribute("href"))[0];
    return { root: rssEl.tagName, version: rssEl.getAttribute("version"), link: t(ch, "link"), self,
             items: [...d.getElementsByTagName("item")].map((i) => ({ title: t(i, "title"), link: t(i, "link"), guid: t(i, "guid"), pubDate: t(i, "pubDate"), description: t(i, "description") })) };
  })()`);
  let jf = null;
  const jr = await fetch(`${origin}/news/feed.json`);
  try { jf = JSON.parse(await jr.text()); } catch (e) { detail.push(`/news/feed.json does not parse: ${e.message}`); }
  if (jr.status !== 200) detail.push(`/news/feed.json answered ${jr.status}`);
  const want = newsPosts.map((p) => `${SITE}${p.href}`);
  const abs = (u, where) => { if (typeof u !== "string" || !u.startsWith(`${SITE}/`)) detail.push(`${where}: "${u}" is not an absolute ${SITE}/ URL`); };
  const bodyUrls = (html, where) => { for (const m of (html || "").matchAll(/(?:href|src)="([^"]*)"/g)) if (!/^mailto:/.test(m[1]) && !/^https:\/\/(?!harkfell\.com)/.test(m[1])) abs(m[1], `${where} body link`); };
  if (rss.error) detail.push(`feed.xml does not parse as XML: ${rss.error}`);
  else {
    if (rss.root !== "rss" || rss.version !== "2.0") detail.push(`feed.xml is <${rss.root} version="${rss.version}">, not RSS 2.0`);
    abs(rss.link, "RSS channel link"); abs(rss.self, "RSS atom:link self");
    if (rss.self !== `${SITE}/news/feed.xml`) detail.push(`RSS self link is ${rss.self}`);
    const got = rss.items.map((i) => i.link);
    if (got.join() !== want.join()) detail.push(`RSS items ${got.join(", ")} are not /news/'s posts in its order (${want.join(", ")})`);
    for (const i of rss.items) {
      abs(i.link, "RSS item link"); abs(i.guid, "RSS item guid");
      if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} \+0000$/.test(i.pubDate || "")) detail.push(`RSS pubDate "${i.pubDate}" is not RFC 822`);
      if (!i.description || i.description.length < 40) detail.push(`RSS item ${i.link} has no body`);
      bodyUrls(i.description, `RSS ${i.link}`);
    }
    const dates = rss.items.map((i) => Date.parse(i.pubDate));
    if (dates.some((d, k) => k > 0 && d > dates[k - 1])) detail.push("RSS items are not newest first");
  }
  if (jf) {
    if (jf.version !== "https://jsonfeed.org/version/1.1") detail.push(`feed.json version "${jf.version}"`);
    abs(jf.home_page_url, "JSON home_page_url"); abs(jf.feed_url, "JSON feed_url");
    if (jf.feed_url !== `${SITE}/news/feed.json`) detail.push(`JSON feed_url is ${jf.feed_url}`);
    const got = (jf.items || []).map((i) => i.url);
    if (got.join() !== want.join()) detail.push(`JSON items ${got.join(", ")} are not /news/'s posts in its order`);
    for (const i of jf.items || []) {
      abs(i.id, "JSON item id"); abs(i.url, "JSON item url");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(i.date_published || "")) detail.push(`JSON date_published "${i.date_published}" is not RFC 3339`);
      if (!i.content_html || i.content_html.length < 40) detail.push(`JSON item ${i.url} has no body`);
      const post = newsPosts.find((p) => `${SITE}${p.href}` === i.url);
      if (post && i.summary !== post.summary.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"")) detail.push(`JSON item ${i.url} summary differs from /news/'s`);
      bodyUrls(i.content_html, `JSON ${i.url}`);
    }
    const dates = (jf.items || []).map((i) => Date.parse(i.date_published));
    if (dates.some((d, k) => k > 0 && d > dates[k - 1])) detail.push("JSON items are not newest first");
    for (const i of jf.items || []) if (!fs.existsSync(path.join(DIR, new URL(i.url).pathname, "index.html"))) detail.push(`${i.url} has no page in the tree`);
  }
  for (const p of ["/", "/news/"]) {
    const html = await (await fetch(origin + p)).text();
    if (!/<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/news\/feed\.xml"/.test(html)) detail.push(`${p} has no <link rel="alternate"> to the RSS feed`);
    if (!/<link rel="alternate" type="application\/feed\+json"[^>]*href="\/news\/feed\.json"/.test(html)) detail.push(`${p} has no <link rel="alternate"> to the JSON feed`);
  }
  if (!/<a href="\/news\/feed\.xml">RSS<\/a>/.test(await (await fetch(`${origin}/news/`)).text())) detail.push("/news/ shows no visible RSS link");
  if (detail.length) fail("feeds", [...new Set(detail)].join("; "));
  else pass("feeds", `feed.xml (RSS 2.0, parsed by the browser) and feed.json (JSON Feed 1.1) list ${want.length} post(s) as /news/ does, newest first, RFC 822 / RFC 3339 dates, every URL absolute under ${SITE}/ (bodies included); <link rel="alternate"> on / and /news/; the RSS link on /news/`);
}

// ---- version ---------------------------------------------------------------------
// /version.json (D38): generated into this tree by stage-web; the game's update
// line reads it, so it must name this build, this version, that version's post,
// and a summary the game can draw.
//
// DRAWABLE is the characters the start screen can draw at run time. Printable
// ASCII until the runtime glyph atlas lands in sigil-graphics (the leader,
// 2026-09-25, with LOOK); then this becomes that atlas's set.
const DRAWABLE = /^[\x20-\x7e]*$/;
const SUMMARY_MAX = 120;   // one line under "Press any key to step in."; LOOK owns the real width
{
  const detail = [];
  let vj = null;
  try { vj = JSON.parse(text("version.json")); } catch (e) { detail.push(`version.json does not parse: ${e.message}`); }
  if (vj) {
    const keys = Object.keys(vj).sort().join(",");
    if (keys !== "build,date,news,summary,version") detail.push(`version.json has the fields ${keys} (want build, date, news, summary, version)`);
    if (vj.build !== header["web-stamp"]) detail.push(`build "${vj.build}" is not the staged game's stamp ${header["web-stamp"]}`);
    const pkg = (fs.readFileSync("package.sgl", "utf8").match(/^  version: "([0-9.]+)"/m) || [])[1];
    if (vj.version !== pkg) detail.push(`version "${vj.version}" is not package.sgl's ${pkg}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vj.date || "")) detail.push(`date "${vj.date}" is not YYYY-MM-DD`);
    const post = newsPosts.find((p) => p.version === vj.version);
    if (!post) detail.push(`no news post for version ${vj.version} (posts: ${newsPosts.map((p) => p.version).join(", ") || "none"}); the game would announce it with nothing to say`);
    else {
      if (vj.news !== `https://harkfell.com${post.href}`) detail.push(`news "${vj.news}" is not the post's URL https://harkfell.com${post.href}`);
      const listed = post.summary.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/<[^>]+>/g, "");
      if (vj.summary !== listed) detail.push(`summary differs from the post's: "${vj.summary}" against "${listed}"`);
    }
    if (!vj.summary) detail.push("the summary is empty");
    if (!DRAWABLE.test(vj.summary || "")) detail.push(`the summary has characters the game cannot draw: ${[...(vj.summary || "")].filter((c) => !DRAWABLE.test(c)).map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`);
    if ((vj.summary || "").length > SUMMARY_MAX) detail.push(`the summary is ${vj.summary.length} characters (at most ${SUMMARY_MAX})`);
  }
  const r = await fetch(`${origin}/version.json`);
  await r.arrayBuffer();
  if (!/no-store/.test(r.headers.get("cache-control") || "")) detail.push(`/version.json is served with cache-control "${r.headers.get("cache-control")}", not no-store`);
  if (!/^application\/json/.test(r.headers.get("content-type") || "")) detail.push(`/version.json is served as ${r.headers.get("content-type")}`);
  if (detail.length) fail("version", detail.join("; "));
  else pass("version", `version.json ${vj.version} ${vj.date} build ${vj.build} -> ${vj.news}; summary ${vj.summary.length} chars, printable ASCII; served no-store as application/json`);
}

// ---- missing --------------------------------------------------------------------
{
  const detail = [];
  // (/_headers is not probed here: serve-site.mjs answers it 404 by fiat, so
  // the probe could not fail; verify-live.mjs asks real Pages.)
  const probes = ["/no-such-page/", "/play/no-such-file.js", `/play/w/${"0".repeat(16)}/harkfell.wasm`, "/play/harkfell.wasm"];
  const got = [];
  for (const p of probes) {
    const r = await fetch(origin + p);
    const body = await r.text();
    got.push(`${p} ${r.status}`);
    if (r.status !== 404) detail.push(`${p} answered ${r.status}, not 404`);
    else if (!/Nothing here but the wind/.test(body)) detail.push(`${p} is 404 but not the site's 404 page`);
  }
  if (detail.length) fail("missing", detail.join("; "));
  else pass("missing", got.join(", ") + ", each the site's 404 page");
}

// ---- console --------------------------------------------------------------------
{
  if (consoleErrors.length) fail("console", `${consoleErrors.length} error(s): ${consoleErrors.slice(0, 4).join(" | ")}`);
  else pass("console", `${consoleLines.length} console lines, 0 errors, 0 exceptions`);
}

console.log(`RESULT: ${results.length - failed} passed, ${failed} failed`);
if (failed === 0) {
  fs.writeFileSync(VERIFIED, [
    `manifest-sha256 ${sha256(manifestText)}`,
    ...gate.map(([g, h]) => `gate ${h} ${g}`),
    `gate-head ${gateHead}`,
    `gate-clean ${gateClean ? "yes" : "no"}`,
    `legs ${results.map((r) => r.split(" ")[1]).join(" ")}`,
    `at ${new Date().toISOString()}`,
    "",
  ].join("\n"));
  console.log(`verified: wrote ${VERIFIED} (manifest ${sha256(manifestText).slice(0, 16)})`);
}
shutdown(failed ? 1 : 0);
