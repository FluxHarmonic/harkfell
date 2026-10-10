// The worker owns update availability; the game owns the start-screen state.
(() => {
  const state = { state: "none", registration: null };
  window.harkfellUpdate = state;
  let applying = false;
  let app = null;
  function waiting(registration) {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;
    state.state = "waiting";
    app?.dispatch("update", "waiting");
    window.dispatchEvent(new Event("harkfell-update-waiting"));
  }
  state.apply = () => {
    if (!state.registration?.waiting || applying) return;
    applying = true;
    state.state = "applying";
    state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  state.check = () => state.registration?.update();
  function ready(a) {
    app = a;
    // This snapshot belongs to the cached page/wasm, not the latest site.
    // A failed metadata fetch leaves the start screen usable and quiet.
    fetch("version.json", { cache: "no-store" }).then(async (response) => {
      if (!response.ok || !/^application\/json\b/.test(response.headers.get("content-type") || "")) return;
      const text = await response.text();
      if (app.dispatch("update-info", text) === 1) state.info = JSON.parse(text);
    }).catch((error) => console.log("harkfell: version.json unavailable " + error.message));
    if (state.state === "waiting") app.dispatch("update", "waiting");
  }
  if (window.SigilWebApp?.started) ready(window.SigilWebApp);
  else document.addEventListener("sigil-web-app-ready", (event) => ready(event.detail), { once: true });
  // Clicking the drawn reload line takes the waiting worker. Capture it
  // before the game's gesture handler, so it never steps into the opening.
  window.addEventListener("pointerdown", (event) => {
    if (applying) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!app || state.state !== "waiting") return;
    const canvas = document.getElementById("stage");
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    if (app.dispatch("update-tap", x + "," + y) !== 1) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.apply();
  }, { capture: true, passive: false });
  ["pointerup", "touchend", "click", "keydown"].forEach((type) => {
    window.addEventListener(type, (event) => {
      if (!applying) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
  if (!("serviceWorker" in navigator)) { state.state = "unsupported"; return; }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (applying) location.reload();
  });
  async function register() {
    try {
      const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
      state.registration = registration;
      state.state = "registered";
      const watch = (worker) => worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") waiting(registration);
      });
      waiting(registration);
      watch(registration.installing);
      registration.addEventListener("updatefound", () => watch(registration.installing));
      console.log("harkfell: sw registered");
    } catch (error) {
      state.state = "failed";
      console.log("harkfell: sw refused " + error.message);
    }
  }
  // The boot's download gets the connection first, as in Crash.
  if (window.SigilWebApp?.started) register();
  else document.addEventListener("sigil-web-app-ready", register, { once: true });
})();
