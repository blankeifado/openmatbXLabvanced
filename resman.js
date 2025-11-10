// resman.js — two tanks + pumps
function Resman(cfg) {
  cfg = cfg || {};
  this.tanks = (cfg.tanks || [{ name: 'Tank A', init: 0.5, min: 0.25, max: 0.75 }, { name: 'Tank B', init: 0.5, min: 0.25, max: 0.75 }]).map(t => ({
    name: t.name, level: (t.init || 0.5), min: t.min, max: t.max, violating: false
  }));
  this.consumption = cfg.consumption_rate || 0.2; // units per second (split across tanks)
  this.pumpStrength = cfg.pump_strength || 0.28; // units per second added when pump on
  this.pumpCount = cfg.pump_count || 4;

  // create UI
  this.pumpStates = new Array(this.pumpCount).fill(false);
  this._createUI();
}

Resman.prototype._createUI = function () {
  const tanksEl = document.getElementById('tanks');
  const pumpsEl = document.getElementById('pumps');
  tanksEl.innerHTML = '';
  pumpsEl.innerHTML = '';

  this.tanks.forEach((t, idx) => {
    const te = document.createElement('div'); te.className = 'tank';
    te.innerHTML = `
      <div class="bar"><div class="level" id="tank-level-${idx}" style="height:${(t.level * 100).toFixed(1)}%"></div></div>
      <div class="meta">${t.name}</div>
      <div class="meta">Level: <span id="tank-val-${idx}">${t.level.toFixed(2)}</span></div>
    `;
    tanksEl.appendChild(te);
  });

  for (let i = 0; i < this.pumpCount; i++) {
    const b = document.createElement('button');
    b.className = 'pump'; b.textContent = 'Pump ' + (i + 1);
    b.id = 'pump-btn-' + i;
    b.onclick = () => {
      this.pumpStates[i] = !this.pumpStates[i];
      b.classList.toggle('on', this.pumpStates[i]);
      window.MATB.emit({ task: 'RESMAN', event: 'pump_toggle', pump: i + 1, state: this.pumpStates[i] ? 'ON' : 'OFF', timestamp: performance.now() });
    };
    pumpsEl.appendChild(b);
  }
};

Resman.prototype.start = function () {
  // nothing special now
};
Resman.prototype.stop = function () {
  // nothing
};

Resman.prototype.update = function (dt) {
  // dt in seconds
  // consumption applies equally across tanks
  const consPerTank = (this.consumption / this.tanks.length) * dt;
  for (let i = 0; i < this.tanks.length; i++) {
    const t = this.tanks[i];
    t.level -= consPerTank;
  }

  // pumps: simple distribution: pumps 1..N affect tanks with patterns
  for (let p = 0; p < this.pumpCount; p++) {
    if (!this.pumpStates[p]) continue;
    // distribute pump effect across tanks: alternating add/subtract to create tradeoffs
    for (let i = 0; i < this.tanks.length; i++) {
      // pattern: even pumps favor tank 0, odd pumps favor tank 1
      const sign = (p % 2 === 0) ? (i === 0 ? 1 : -0.45) : (i === 1 ? 1 : -0.45);
      this.tanks[i].level += this.pumpStrength * sign * dt;
    }
  }

  // enforce bounds and detect violations
  this.tanks.forEach((t, idx) => {
    if (t.level < 0) t.level = 0;
    if (t.level > 1) t.level = 1;
    // update UI
    const levEl = document.getElementById('tank-level-' + idx);
    const valEl = document.getElementById('tank-val-' + idx);
    if (levEl) levEl.style.height = (t.level * 100).toFixed(1) + '%';
    if (valEl) valEl.textContent = t.level.toFixed(2);

    const out = (t.level < t.min) || (t.level > t.max);
    if (out && !t.violating) {
      t.violating = true;
      window.MATB.emit({ task: 'RESMAN', event: 'violation_start', tank: t.name, level: t.level, timestamp: performance.now() });
    }
    if (!out && t.violating) {
      t.violating = false;
      window.MATB.emit({ task: 'RESMAN', event: 'violation_end', tank: t.name, level: t.level, timestamp: performance.now() });
    }
  });
};