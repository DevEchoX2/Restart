const CORE_IMPORTERS = {
  state: () => import("./core/state.js"),
  wm: () => import("./core/wm.js"),
  fs: () => import("./core/fs.js"),
  ui: () => import("./core/ui.js"),
};

async function loadCoreModules() {
  const entries = Object.entries(CORE_IMPORTERS);
  const loaded = {};

  for (const [key, importer] of entries) {
    try {
      loaded[key] = await importer();
    } catch (error) {
      console.warn(`[restart] Deferred core module unavailable: ${key}`, error);
      loaded[key] = null;
    }
  }

  return loaded;
}

function setBootClock() {
  const clock = document.getElementById("tray-clock");
  if (!clock) return;

  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  tick();
  window.setInterval(tick, 1000 * 30);
}

async function boot() {
  const modules = await loadCoreModules();
  document.body.dataset.bootState = "ready";
  document.body.dataset.loadedCoreModules = Object.keys(modules)
    .filter((name) => Boolean(modules[name]))
    .join(",");

  setBootClock();

  if (modules.ui?.initUI) {
    await modules.ui.initUI({ modules });
  }
}

boot().catch((error) => {
  console.error("[restart] Fatal boot error", error);
  document.body.dataset.bootState = "error";
});
