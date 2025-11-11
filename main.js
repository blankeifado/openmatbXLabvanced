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
  function onReady() {
    window.MATB.resman = new Resman(window.MATB.cfg.resman);
    window.MATB.sysmon = new Sysmon(window.MATB.cfg.sysmon);

    // wire UI buttons
    //const startBtn = document.getElementById('start-btn');
    //const stopBtn = document.getElementById('stop-btn');
    const statusText = document.getElementById('status-text');
    let running = false;
    let startTs = 0;
    let tickHandle = null;

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();


// --- Communication bridge: listen for parent commands ---
window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !data.command) return;

  switch (data.command) {
    case "start":
      console.log("[MATB] Start command received");
      startTasks();  // function that triggers RESMAN + SYSMON
      window.parent.postMessage({ task: "MATB", event: "started", timestamp: performance.now() }, "*");
      break;
    case "stop":
      console.log("[MATB] Stop command received");
      stopTasks();   // function that stops both tasks
      window.parent.postMessage({ task: "MATB", event: "stopped", timestamp: performance.now() }, "*");
      break;
    default:
      console.warn("[MATB] Unknown command:", data.command);
  }
});

function startTasks() {
  //resman.start();
  //sysmon.start();

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
    if (now - startTs > sessionDur) {
      stopBtn.click();
    }
  }, TICK_MS);
}

function stopTasks() {
  //resman.stop();
  //sysmon.stop();

  if (!running) return;
  running = false;
  statusText.textContent = 'stopped';
  clearInterval(tickHandle);
  window.MATB.resman.stop();
  window.MATB.sysmon.stop();
  window.MATB.emit({ task: 'SESSION', event: 'end', timestamp: performance.now() });
}

