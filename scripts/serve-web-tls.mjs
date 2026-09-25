#!/usr/bin/env node
// COPIED from Crash The Stack master e737d21 (scripts/serve-web-tls.mjs),
// changed only by this header and by A2's --log (one line per request on
// stdout, and GET /bench-report?LINE answered 204: the page's ?bench sends
// its measurement lines there, so they land in the host log). Harkfell hosts on wg0 8797 (https) with
// --isolate; the S0 sketchbook runs its own instance on 8795.
// Host a build directory over HTTPS on the WireGuard address, for the phone.
//
//   node scripts/serve-web-tls.mjs DIR PORT [--isolate]
//
// A phone's Chrome allows AudioWorklet (and a service worker) only on a
// secure context, and the plain-http wg0 host is not one, so a read there
// measures the ScriptProcessor path whatever the bridge can do (David's
// phone, 2026-09-22). This serves the same directory over TLS with a
// self-signed certificate for the wg0 address (build/tls/{key,cert}.pem,
// made with openssl: req -x509 -newkey rsa:2048 -nodes -subj /CN=ADDR
// -addext subjectAltName=IP:ADDR; the phone taps through the warning
// once). Without --isolate the page gets the bridge's worklet-msg mode
// (a worklet, no SharedArrayBuffer): the path a non-isolated https host
// gets; with --isolate it sends COOP/COEP and gets worklet-sab, the
// published site's path. Binds to wg0 only, as scripts/serve-web does
// (decision D10); the address is read from the interface at run time.
//
// Playtest 1, #1 (a slow load on the phone): the wasm is ~31 MB, and was
// sent as is: about 34 s on a 4G link before the game could boot. Text and
// wasm now go brotli- or gzip-encoded when the browser accepts it (brotli
// ~1.95 MB, gzip ~3.6 MB for that wasm), each file compressed once and kept
// in memory until its mtime or size changes; the wasm is compressed when
// the server starts, so the first phone does not wait for it. Each answer
// carries an ETag (mtime, size, encoding), so a reload of an unchanged
// build revalidates to 304 instead of fetching it again.
import https from "node:https";
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const [dir, portArg, ...flags] = process.argv.slice(2);
if (!dir || !portArg) { console.error("usage: serve-web-tls.mjs DIR PORT [--isolate]"); process.exit(2); }
const port = Number(portArg);
const isolate = flags.includes("--isolate");
const logging = flags.includes("--log");
const root = path.resolve(dir);
if (!fs.existsSync(path.join(root, "index.html"))) { console.error(`serve-web-tls: ${root}/index.html missing`); process.exit(1); }

let host = "";
try { host = execSync("ip -4 -o addr show dev wg0", { encoding: "utf8" }).match(/inet (\d+\.\d+\.\d+\.\d+)/)?.[1] || ""; } catch { host = ""; }
if (!host || host === "0.0.0.0") { console.error("serve-web-tls: no wg0 address; refusing to bind elsewhere"); process.exit(1); }

const key = fs.readFileSync("build/tls/key.pem"), cert = fs.readFileSync("build/tls/cert.pem");
const MIME = { html: "text/html; charset=utf-8", js: "text/javascript", mjs: "text/javascript", wasm: "application/wasm", json: "application/json",
  css: "text/css", cts: "text/plain; charset=utf-8", png: "image/png", svg: "image/svg+xml", webmanifest: "application/manifest+json", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8" };
const PACKABLE = new Set(["html", "js", "mjs", "wasm", "json", "css", "cts", "svg", "webmanifest", "txt", "md"]);
const packed = new Map();   // fp -> { stamp, br, gz } (Promises of Buffers)
function pack(fp, buf, st) {
  const stamp = st.mtimeMs + ":" + st.size;
  let p = packed.get(fp);
  if (!p || p.stamp !== stamp) {
    p = { stamp,
          br: new Promise((ok, no) => zlib.brotliCompress(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9,
                                                                            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } },
                                                         (e, out) => e ? no(e) : ok(out))),
          gz: new Promise((ok, no) => zlib.gzip(buf, { level: 9 }, (e, out) => e ? no(e) : ok(out))) };
    packed.set(fp, p);
  }
  return p;
}
function warm(fp) { fs.stat(fp, (e, st) => { if (!e) fs.readFile(fp, (e2, buf) => { if (!e2) pack(fp, buf, st); }); }); }
const server = https.createServer({ key, cert }, (req, res) => {
  if (logging) console.log(new Date().toISOString() + " " + req.socket.remoteAddress + " " + req.method + " " + req.url);
  const urlPath = decodeURIComponent(new URL(req.url, "https://x").pathname);
  if (urlPath === "/bench-report") { res.writeHead(204, { "cache-control": "no-store" }); res.end(); return; }
  let fp = path.normalize(path.join(root, urlPath));
  if (!fp.startsWith(root)) { res.writeHead(403); res.end(); return; }
  try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, "index.html"); } catch { /* falls to the read */ }
  fs.stat(fp, (serr, st) => fs.readFile(fp, (err, buf) => {
    if (err || serr) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(fp).slice(1);
    const headers = { "content-type": MIME[ext] || "application/octet-stream", "cache-control": "no-cache" };
    if (isolate) { headers["cross-origin-opener-policy"] = "same-origin"; headers["cross-origin-embedder-policy"] = "require-corp"; }
    const accept = String(req.headers["accept-encoding"] || "");
    const enc = !PACKABLE.has(ext) ? null : /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gz" : null;
    // a reload revalidates (no-cache) and, unchanged, gets 304, not the bytes
    const etag = '"' + Math.floor(st.mtimeMs).toString(36) + "-" + st.size.toString(36) + (enc ? "-" + enc : "") + '"';
    headers["etag"] = etag;
    if (enc) headers["vary"] = "accept-encoding";
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); res.end(); return; }
    if (!enc) { res.writeHead(200, headers); res.end(buf); return; }
    pack(fp, buf, st)[enc].then((out) => {
      headers["content-encoding"] = enc === "br" ? "br" : "gzip";
      res.writeHead(200, headers);
      res.end(out);
    }, () => { res.writeHead(200, headers); res.end(buf); });
  }));
});
for (const f of fs.readdirSync(root)) if (/\.wasm$/.test(f)) warm(path.join(root, f));
server.listen(port, host, () => {
  console.log(`serve-web-tls: https://${host}:${port}/ serving ${root}${isolate ? " (COOP/COEP: isolated)" : " (not isolated)"}`);
});
