// verify-live.mjs - what only a real deployment can answer: does harkfell.com
// (or a preview) serve, byte for byte, the tree verify-site.mjs verified?
//
//   node scripts/verify-live.mjs https://<hash>.harkfell.pages.dev build/site
//   node scripts/verify-live.mjs https://harkfell.com build/site
//
// DIR.manifest lists every staged file with its sha256. This fetches each one
// from the deployment and compares, which catches the failure Pages hides: a
// file missing from the deploy is answered with a page, not a 404, when the
// tree has no 404.html (topics/cloudflare-pages-serves-index-for-a-missing-
// path). The wasm comes through the Pages Function from R2, so the same sweep
// proves the Function, the binding and the upload together. Then:
//   wasm-headers  the Function's response: application/wasm, immutable cache,
//                 CORP same-origin, COEP require-corp (an isolated page refuses
//                 the wasm without them), and whether the wire was compressed
//   isolation     /play/ carries COOP same-origin + COEP require-corp; / does not
//   missing       a missing page, an unpublished wasm hash and /_headers are 404
//
// Exits 0 when every check passes, 1 otherwise, 2 on bad arguments.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

// --wrangler-dev: the target is `wrangler pages dev` (scripts/pages-dev-check),
// whose local asset server answers /_headers with 502 (it looks for
// _headers/index.html). That one answer is then allowed, and said.
const WDEV = process.argv.includes("--wrangler-dev");
const pos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const base = (pos[0] || "").replace(/\/$/, "");
const dir = (pos[1] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base) || !dir) { console.log("usage: verify-live.mjs https://origin STAGED-DIR"); process.exit(2); }
const manifest = path.resolve(dir) + ".manifest";
if (!fs.existsSync(manifest)) { console.log(`SETUP-FAILED: ${manifest} missing`); process.exit(2); }
const entries = fs.readFileSync(manifest, "utf8").split("\n")
  .filter((l) => l && !l.startsWith("#") && !l.includes("  @"))
  .map((l) => { const i = l.indexOf("  "); return { sha: l.slice(0, i), file: l.slice(i + 2) }; })
  // consumed by Pages, never served
  // consumed by Pages, never served; 404.html is checked as the body of a 404
  // below (Pages strips .html, so /404.html itself is not a stable URL)
  .filter((e) => e.file !== "_headers" && e.file !== "_redirects" && e.file !== "404.html");
const notFoundSha = (fs.readFileSync(manifest, "utf8").split("\n").find((l) => l.endsWith("  404.html")) || "").split("  ")[0];
console.log(`subject: ${base} against ${manifest} (${entries.length} served files)`);

let failed = 0;
const pass = (n, d) => console.log(`PASS ${n}: ${d}`);
const fail = (n, d) => { failed++; console.log(`FAIL ${n}: ${d}`); };
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
// Pages serves /x/index.html at /x/ (and redirects the long form there)
const urlFor = (file) => `${base}/${file.endsWith("index.html") ? file.slice(0, -"index.html".length) : file}`;

async function get(url, init) {
  for (let i = 0; i < 3; i++) {
    try { return await fetch(url, init); } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 1000 * (i + 1))); }
  }
}

// ---- every file ------------------------------------------------------------------
{
  const bad = [];
  let bytes = 0;
  const queue = [...entries];
  async function worker() {
    while (queue.length) {
      const e = queue.shift();
      const url = urlFor(e.file);
      try {
        const r = await get(url);
        const buf = Buffer.from(await r.arrayBuffer());
        bytes += buf.length;
        if (r.status !== 200) bad.push(`${e.file}: ${r.status}`);
        else if (sha256(buf) !== e.sha) bad.push(`${e.file}: served ${buf.length} bytes hashing ${sha256(buf).slice(0, 12)}, staged ${e.sha.slice(0, 12)} (${r.headers.get("content-type")})`);
      } catch (err) { bad.push(`${e.file}: ${err.message}`); }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  if (bad.length) fail("files", `${bad.length} of ${entries.length} differ: ${bad.slice(0, 6).join("; ")}`);
  else pass("files", `all ${entries.length} staged files served byte for byte (${bytes} bytes)`);
}

// ---- the wasm's headers -----------------------------------------------------------
const wasm = entries.find((e) => /^play\/w\/[0-9a-f]{16}\/harkfell\.wasm$/.test(e.file));
if (!wasm) fail("wasm-headers", "the manifest names no play/w/<sha16>/harkfell.wasm");
else {
  const r = await get(`${base}/${wasm.file}`, { headers: { "accept-encoding": "br, gzip" } });
  await r.arrayBuffer();
  const h = (n) => r.headers.get(n) || "";
  const detail = [];
  if (!h("content-type").startsWith("application/wasm")) detail.push(`content-type "${h("content-type")}"`);
  if (!/immutable/.test(h("cache-control")) || !/max-age=\d{7,}/.test(h("cache-control"))) detail.push(`cache-control "${h("cache-control")}"`);
  if (h("cross-origin-resource-policy") !== "same-origin") detail.push(`CORP "${h("cross-origin-resource-policy")}"`);
  if (h("cross-origin-embedder-policy") !== "require-corp") detail.push(`COEP "${h("cross-origin-embedder-policy")}"`);
  if (detail.length) fail("wasm-headers", detail.join("; "));
  else pass("wasm-headers", `${h("content-type")}, ${h("cache-control")}, CORP same-origin, COEP require-corp, wire ${h("content-encoding") || "identity (uncompressed: worth a look)"}`);
}

// ---- isolation ----------------------------------------------------------------------
{
  const play = await get(`${base}/play/`); await play.arrayBuffer();
  const root = await get(`${base}/`); await root.arrayBuffer();
  const detail = [];
  if (play.headers.get("cross-origin-opener-policy") !== "same-origin") detail.push(`/play/ COOP "${play.headers.get("cross-origin-opener-policy")}"`);
  if (play.headers.get("cross-origin-embedder-policy") !== "require-corp") detail.push(`/play/ COEP "${play.headers.get("cross-origin-embedder-policy")}"`);
  if (root.headers.get("cross-origin-embedder-policy")) detail.push(`/ carries COEP "${root.headers.get("cross-origin-embedder-policy")}"`);
  if (detail.length) fail("isolation", detail.join("; "));
  else pass("isolation", "/play/ COOP same-origin + COEP require-corp; / not isolated");
}

// ---- missing ---------------------------------------------------------------------------
{
  const probes = ["/no-such-page/", "/play/no-such-file.js", `/play/w/${"0".repeat(16)}/harkfell.wasm`, "/play/harkfell.wasm", "/_headers"];
  const got = [];
  // Every probe but the wasm path must answer with the site's own 404 page,
  // byte for byte; the wasm path is the Function's, which answers its own 404.
  const notPage = [];
  for (const p of probes) {
    const r = await get(base + p);
    const buf = Buffer.from(await r.arrayBuffer());
    got.push(`${p} ${r.status}`);
    const allowed502 = WDEV && p === "/_headers" && r.status === 502;
    if (!p.startsWith("/play/w/") && !allowed502 && !(r.status === 404 && notFoundSha && sha256(buf) === notFoundSha)) notPage.push(p);
  }
  const pages = probes.length - 1 - notPage.length - (WDEV && got.includes("/_headers 502") ? 1 : 0);
  const bad = got.filter((g) => !/ 404$/.test(g) && !(WDEV && g === "/_headers 502"));
  if (!notFoundSha) fail("missing", "the manifest lists no 404.html");
  else if (bad.length) fail("missing", `not 404: ${bad.join(", ")}`);
  else if (notPage.length) fail("missing", `404, but not the site's 404 page: ${notPage.join(", ")}`);
  else pass("missing", `${got.join(", ")}${WDEV && got.includes("/_headers 502") ? " (/_headers 502: wrangler's local asset server, allowed under --wrangler-dev)" : ""}; ${pages} of ${probes.length} with the staged 404.html byte for byte (the Function answers its own 404 for a wasm path)`);
}

console.log(`RESULT: ${failed ? "FAIL" : "PASS"} (${failed} failed)`);
process.exit(failed ? 1 : 0);
