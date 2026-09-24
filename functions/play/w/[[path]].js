// /play/w/<sha16>/harkfell.wasm, served from R2 at the page's own origin.
// Crash The Stack's web/r2-wasm.js (master 262a0e0), inlined for the one route
// Harkfell has.
//
// WHY THIS EXISTS. Cloudflare Pages refuses a file over 25 MiB (26,214,400
// bytes), and Harkfell's wasm is past it: 26.5 to 29.4 MB across the A4
// builds of 2026-09-24. So the wasm lives in the R2 bucket harkfell-wasm
// (the WASM binding in wrangler.jsonc) and this Function serves it.
//
// WHY SAME-ORIGIN AND NOT THE BUCKET'S OWN URL. /play/ is cross-origin
// isolated (site/_headers) because the audio bridge needs SharedArrayBuffer
// for its AudioWorklet path. An isolated page only loads subresources that
// agree to be embedded, and an r2.dev URL is another origin.
//
// WHY THE HASH IS IN THE PATH. scripts/stage-web points the page at
// w/<first 16 hex of the wasm's sha256>/harkfell.wasm, so a page can only
// ever load the wasm it was built with, and every object is immutable.
//
// _headers does not apply to a Function's response, so CORP and COEP are set
// here, or the isolated page refuses the wasm and the game never boots.
const IMMUTABLE = "public, max-age=31536000, immutable";

function headersFor(object) {
  const h = new Headers();
  object.writeHttpMetadata(h);
  h.set("content-type", "application/wasm");
  h.set("cache-control", IMMUTABLE);
  h.set("etag", object.httpEtag);
  h.set("cross-origin-resource-policy", "same-origin");
  h.set("cross-origin-embedder-policy", "require-corp");
  h.set("x-content-type-options", "nosniff");
  return h;
}

async function serveWasm(context, withBody) {
  const { params, env, request } = context;
  const parts = Array.isArray(params.path) ? params.path : [params.path];
  const tail = parts.join("/");
  // <sha16>/harkfell.wasm and nothing else: no traversal, no general read-through
  if (!/^[0-9a-f]{16}\/harkfell\.wasm$/.test(tail)) {
    return new Response("not found\n", { status: 404 });
  }
  const object = await env.WASM.get(`play/w/${tail}`, { onlyIf: request.headers });
  if (!object) return new Response("not found\n", { status: 404 });
  if (!("body" in object)) {
    // a conditional request the object satisfies: metadata, no body
    return new Response(null, { status: 304, headers: headersFor(object) });
  }
  return new Response(withBody ? object.body : null, { headers: headersFor(object) });
}

export const onRequestGet = (context) => serveWasm(context, true);
export const onRequestHead = (context) => serveWasm(context, false);
