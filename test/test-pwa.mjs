// Deterministic controls for the first-install/controllerchange race.
// Actual worker installation, rendering, reload and persistence are covered
// separately by scripts/verify-pwa.mjs --updates in headless Chrome.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";

const source = fs.readFileSync(process.env.HARKFELL_PWA_SOURCE || "web/pwa.js", "utf8");

async function page(controlled) {
  const window = new EventTarget();
  const document = new EventTarget();
  const serviceWorker = new EventTarget();
  serviceWorker.controller = controlled ? {} : null;
  const registration = new EventTarget();
  const worker = new EventTarget();
  worker.state = "installing";
  registration.installing = worker;
  registration.waiting = null;
  const messages = [];
  worker.postMessage = message => messages.push(message);
  serviceWorker.register = async () => registration;
  registration.update = async () => {};
  const updates = [];
  window.SigilWebApp = { started: true, dispatch: (...args) => updates.push(args) };
  let announcements = 0;
  window.addEventListener("harkfell-update-waiting", () => announcements++);
  let reloads = 0;
  vm.runInNewContext(source, {
    window, document, navigator: { serviceWorker }, Event,
    location: { reload: () => reloads++ }, console: { log() {} },
    fetch: async () => ({ ok: false })
  });
  await new Promise(setImmediate);
  function install() {
    registration.waiting = worker;
    worker.state = "installed";
    worker.dispatchEvent(new Event("statechange"));
  }
  return { window, serviceWorker, worker, install, messages, updates,
    announcements: () => announcements, reloads: () => reloads };
}

test("first install stays quiet even if clients.claim wins the installed callback race", async () => {
  const p = await page(false);
  p.serviceWorker.controller = {};
  p.serviceWorker.dispatchEvent(new Event("controllerchange"));
  p.install();
  assert.notEqual(p.window.harkfellUpdate.state, "waiting");
  assert.equal(p.announcements(), 0);
  assert(!p.updates.some(args => args[0] === "update"));
});

test("a controlled page announces the waiting update once, and reloads only when applied", async () => {
  const p = await page(true);
  p.install();
  p.worker.dispatchEvent(new Event("statechange"));
  assert.equal(p.window.harkfellUpdate.state, "waiting");
  assert.equal(p.announcements(), 1);
  assert.deepEqual(p.updates.filter(args => args[0] === "update"), [["update", "waiting"]]);
  p.serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(p.reloads(), 0);
  p.window.harkfellUpdate.apply();
  p.window.harkfellUpdate.apply();
  assert.equal(p.messages.length, 1);
  assert.equal(p.messages[0].type, "SKIP_WAITING");
  p.serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(p.reloads(), 1);
});

// 0.3.3: installed as an app (the manifest's fullscreen, standalone, or the
// iOS home screen) the game is already full screen, so the page shows no
// fullscreen button; a browser tab keeps it. This runs the page's own
// installedApp, cut from the template, against each display mode.
const pageSource = fs.readFileSync(process.env.HARKFELL_PAGE_SOURCE || "index.template.html", "utf8");

function installedApp() {
  const m = pageSource.match(/\n( *)function installedApp\(w, nav\) \{\n[\s\S]*?\n\1\}\n/);
  assert(m, "index.template.html defines installedApp");
  return vm.runInNewContext(`(${m[0].trim()})`, {});
}

function display(mode, standalone) {
  const window = { matchMedia: (query) => ({ matches: query === `(display-mode: ${mode})` }) };
  return [window, standalone === undefined ? {} : { standalone }];
}

test("the installed app has no fullscreen button; a browser tab keeps it", () => {
  const f = installedApp();
  assert.equal(f(...display("fullscreen")), true, "manifest display: fullscreen");
  assert.equal(f(...display("standalone")), true, "standalone window");
  assert.equal(f(...display("browser", true)), true, "iOS home screen");
  assert.equal(f(...display("browser")), false, "browser tab");
  assert.equal(f(...display("browser", false)), false, "iOS Safari tab");
  assert.equal(f({}, {}), false, "no matchMedia");
  // the button is shown only where fsOK holds, and fsOK needs a tab
  assert.match(pageSource, /var fsInstalled = installedApp\(window, navigator\);/);
  assert.match(pageSource, /var fsOK = !fsInstalled && /);
  assert.match(pageSource, /if \(fsOK\) \{\n *fsEl\.hidden = false;/);
});
