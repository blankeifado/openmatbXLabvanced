// sysmon.js — gauge drift + alarms
function Sysmon(cfg) {
  cfg = cfg || {};
  this.gCount = cfg.gauge_count || 4;
  this.gauges = [];
  this.alarmMin = (cfg.alarm_interval_min_s || 20) * 1000;
  this.alarmMax = (cfg.alarm_interval_max_s || 40) * 1000;
  this.ackTimeout = (cfg.alarm_ack_timeout_s || 5) * 1000;
  this._timers = [];

  for (let i = 0; i < this.gCount; i++) {
    // each gauge has a value 0..1 and a safe range (centered)
    const safeCenter = 0.5 + (Math.random() - 0.5) * 0.1;
    const tol = 0.2 + Math.random() * 0.08;
    this.gauges.push({ id: i, value: safeCenter, safe: [safeCenter - tol / 2, safeCenter + tol / 2], alarm: false, ackDeadline: 0 });
  }
  this._createUI();
}

Sysmon.prototype._createUI = function () {
  const gaugesEl = document.getElementById('gauges'); gaugesEl.innerHTML = '';
  const btns = document.getElementById('sysmon-buttons'); btns.innerHTML = '';

  this.gauges.forEach(g => {
    const ge = document.createElement('div'); ge.className = 'gauge'; ge.id = 'gauge-' + g.id;
    ge.innerHTML = `<div>G${g.id + 1}</div><div class="bar" id="gbar-${g.id}"><div class="marker" id="gmark-${g.id}" style="left:${(g.value * 100).toFixed(1)}%"></div></div><div class="meta" id="gval-${g.id}">${g.value.toFixed(2)}</div>`;
    ge.onclick = () => {
      // clicking acknowledges if alarm active
      if (g.alarm) {
        g.alarm = false; g.ackDeadline = 0;
        document.getElementById('gauge-' + g.id).classList.remove('alarm');
        window.MATB.emit({ task: 'SYSMON', event: 'alarm_ack', gauge: g.id + 1, timestamp: performance.now() });
      }
    };
    gaugesEl.appendChild(ge);

    // also add explicit acknowledge button
    const b = document.createElement('button'); b.textContent = 'Ack G' + (g.id + 1);
    b.onclick = () => { if (g.alarm) { g.alarm = false; g.ackDeadline = 0; document.getElementById('gauge-' + g.id).classList.remove('alarm'); window.MATB.emit({ task: 'SYSMON', event: 'alarm_ack', gauge: g.id + 1, timestamp: performance.now() }); } };
    btns.appendChild(b);
  });
};

Sysmon.prototype._scheduleNextAlarm = function () {
  const dt = this.alarmMin + Math.random() * (this.alarmMax - this.alarmMin);
  const id = setTimeout(() => {
    // pick a random gauge that is not currently alarming
    const avail = this.gauges.filter(g => !g.alarm);
    if (avail.length === 0) { this._scheduleNextAlarm(); return; }
    const g = avail[Math.floor(Math.random() * avail.length)];
    // push gauge outside its safe range rapidly
    const pushTo = (g.safe[1] + 0.18 + Math.random() * 0.12);
    g.value = Math.min(1, pushTo);
    g.alarm = true;
    g.ackDeadline = performance.now() + this.ackTimeout;
    const ge = document.getElementById('gauge-' + g.id);
    if (ge) ge.classList.add('alarm');
    window.MATB.emit({ task: 'SYSMON', event: 'alarm_start', gauge: g.id + 1, value: g.value, timestamp: performance.now() });

    // schedule check for ack timeout
    const watchId = setTimeout(() => {
      if (g.alarm) {
        // ack missed
        g.alarm = false; g.ackDeadline = 0;
        const ge2 = document.getElementById('gauge-' + g.id); if (ge2) ge2.classList.remove('alarm');
        window.MATB.emit({ task: 'SYSMON', event: 'alarm_missed', gauge: g.id + 1, timestamp: performance.now() });
      }
    }, this.ackTimeout);
    this._timers.push(watchId);

    // schedule next alarm
    this._scheduleNextAlarm();
  }, dt);
  this._timers.push(id);
};

Sysmon.prototype.start = function () {
  // seed some small oscillation intervals if needed
  this._scheduleNextAlarm();
};
Sysmon.prototype.stop = function () {
  // clear timers
  this._timers.forEach(t => clearTimeout(t)); this._timers.length = 0;
};

Sysmon.prototype.update = function (dt) {
  // gentle random drift when not alarming
  this.gauges.forEach(g => {
    if (!g.alarm) {
      g.value += (Math.random() - 0.5) * 0.01 * dt * 10; // small slow noise
      if (g.value < 0) g.value = 0; if (g.value > 1) g.value = 1;
      // update UI
      const mark = document.getElementById('gmark-' + g.id);
      const val = document.getElementById('gval-' + g.id);
      if (mark) mark.style.left = (g.value * 100).toFixed(1) + '%';
      if (val) val.textContent = g.value.toFixed(2);
    } else {
      // when alarming, leave marker at pushed value
      const mark = document.getElementById('gmark-' + g.id);
      const val = document.getElementById('gval-' + g.id);
      if (mark) mark.style.left = (g.value * 100).toFixed(1) + '%';
      if (val) val.textContent = g.value.toFixed(2);
    }
  });
};