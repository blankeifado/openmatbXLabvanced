// main.js — bootstrap, scheduler, and event emitter
(async function () {
  const cfg = await fetch('config.json').then(r => r.json()).catch(() => ({}));
  const TICK_MS = cfg.tick_ms || 250;
  //const sessionDur = (cfg.session_duration_s || 300) * 1000;

  // small helper: emit to parent and also to local console & UI log
  function emitEvent(obj) {
    const envelope = { type: 'MATB_EVENT', payload: obj };
    try { window.parent.postMessage(envelope, '*'); } catch (e) { }
    console.log('MATB_EVENT', envelope);
    const la = document.getElementById('log-area');
    if (la) la.textContent = JSON.stringify(envelope.payload);
  }

  // expose globally for modules
  window.MATB = window.MATB || {};
  window.MATB.emit = emitEvent;
  window.MATB.cfg = cfg;

  // Instantiate tasks after DOM content
  let initialized = false;
  let running = false;
  let startTs = 0;
  let tickHandle = null;

  // keep common UI refs in closure so control functions can access them
  let statusText = null;
  let startBtn = null;
  let stopBtn = null;


  function onReady() {
    if (initialized) return;
    initialized = true;
    window.MATB.resman = new Resman(window.MATB.cfg.resman);
    window.MATB.sysmon = new Sysmon(window.MATB.cfg.sysmon);

  // wire UI buttons (store refs in closure scope)
  startBtn = document.getElementById('start-btn');
  stopBtn = document.getElementById('stop-btn');
  statusText = document.getElementById('status-text');


    /*startBtn.onclick = () => {
      if (running) return;
      running = true; startTs = performance.now();
      statusText.textContent = 'running';
      window.MATB.emit({ task: 'SESSION', event: 'start', timestamp: performance.now() });
      // start both tasks
      window.MATB.resman.start();
      window.MATB.sysmon.start();
      // scheduler
      tickHandle = setInterval(() => {
        const now = performance.now();
        window.MATB.resman.update(TICK_MS / 1000);
        window.MATB.sysmon.update(TICK_MS / 1000);
        // stop after duration
        //if (now - startTs > sessionDur) {
        //  stopBtn.click();
        //}
      }, TICK_MS);
    };

    stopBtn.onclick = () => {
      if (!running) return;
      running = false;
      statusText.textContent = 'stopped';
      clearInterval(tickHandle);
      window.MATB.resman.stop();
      window.MATB.sysmon.stop();
      window.MATB.emit({ task: 'SESSION', event: 'end', timestamp: performance.now() });
    };*/

    // start in editor only if user wants
  }

  // Always try immediately:
  if (document.readyState === "complete" || document.readyState === "interactive") {
    onReady();
  } else {
    document.addEventListener("DOMContentLoaded", onReady);
    window.addEventListener("load", onReady);
  }

  // expose programmatic control that closes over the IIFE variables (running, tickHandle, etc.)
  window.startTasks = function () {
    if (running) return;
    running = true; startTs = performance.now();
    if (statusText) statusText.textContent = 'running';
    window.MATB.emit({ task: 'SESSION', event: 'start', timestamp: performance.now() });
    try { window.MATB.resman.start(); } catch (e) { }
    try { window.MATB.sysmon.start(); } catch (e) { }
    tickHandle = setInterval(() => {
      const now = performance.now();
      try { window.MATB.resman.update(TICK_MS / 1000); } catch (e) { }
      try { window.MATB.sysmon.update(TICK_MS / 1000); } catch (e) { }
      /*if (now - startTs > sessionDur) {
        if (stopBtn) stopBtn.click(); else window.stopTasks();
      }*/
    }, TICK_MS);
  };

  window.stopTasks = function () {
    if (!running) return;
    running = false;
    if (statusText) statusText.textContent = 'stopped';
    clearInterval(tickHandle);
    try { window.MATB.resman.stop(); } catch (e) { }
    try { window.MATB.sysmon.stop(); } catch (e) { }
    window.MATB.emit({ task: 'SESSION', event: 'end', timestamp: performance.now() });
  };

})();


// --- Communication bridge: listen for parent commands ---
window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !data.command) return;

  switch (data.command) {
    case "start":
      console.log("[MATB] Start command received");
      if (window.startTasks) window.startTasks();  // use exposed control
      else console.warn('startTasks not available yet');
      window.parent.postMessage({ task: "MATB", event: "started", timestamp: performance.now() }, "*");
      break;
    case "stop":
      console.log("[MATB] Stop command received");
      if (window.stopTasks) window.stopTasks();
      else console.warn('stopTasks not available yet');
      window.parent.postMessage({ task: "MATB", event: "stopped", timestamp: performance.now() }, "*");
      break;
    default:
      console.warn("[MATB] Unknown command:", data.command);
  }
});

// startTasks/stopTasks are provided by the IIFE as window.startTasks/window.stopTasks

