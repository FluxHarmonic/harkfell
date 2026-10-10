// The worker owns update availability; the game owns the start-screen state.
(() => {
  const state = { state: "none", registration: null };
  window.harkfellUpdate = state;
  let applying = false;
  function waiting(registration) {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;
    state.state = "waiting";
    window.dispatchEvent(new Event("harkfell-update-waiting"));
  }
  state.apply = () => {
    if (!state.registration?.waiting || applying) return;
    applying = true;
    state.state = "applying";
    state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  state.check = () => state.registration?.update();
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
