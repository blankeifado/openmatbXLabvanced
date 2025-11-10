// sysmon.js — gauge drift + alarms
function Sysmon(cfg){
cfg = cfg || {};
this.gCount = cfg.gauge_count || 4;
this.gauges = [];
this.alarmMin = (cfg.alarm_interval_min_s||20) * 1000;
this.alarmMax = (cfg.alarm_interval_max_s||40) * 1000;
this.ackTimeout = (cfg.alarm_ack_timeout_s||5) * 1000;
this._timers = [];


for(let i=0;i<this.gCount;i++){
// each gauge has a value 0..1 and a safe range (centered)
const safeCenter = 0.5 + (Math.random()-0.5)*0.1;
const tol = 0.2 + Math.random()*0.08;
this.gauges.push({id:i, value:safeCenter, safe:[safeCenter - tol/2, safeCenter + tol/2], alarm:false, ackDeadline:0});
}
this._createUI();
}


Sysmon.prototype._createUI = function(){
const gaugesEl = document.getElementById('gauges'); gaugesEl.innerHTML='';
const btns = document.getElementById('sysmon-buttons'); btns.innerHTML='';