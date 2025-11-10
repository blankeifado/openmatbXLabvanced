// Example Labvanced listener: paste this into a Labvanced "Run JavaScript (Frame Start)"
// or keep it in the embedded page to debug. It shows how Labvanced can receive events.

window.addEventListener('message', (e)=>{
  if (!e.data || e.data.type !== 'MATB_EVENT') return;
  const payload = e.data.payload;
  // Example: map to Labvanced variable API if available
  // SAFE variant: simply log to console and set a global var
  console.log('LABVANCED_RECEIVE', payload);

  // If Labvanced exposes a JS API `lv` (hypothetical), you could do:
  // if (typeof lv !== 'undefined' && lv.setVariable){ lv.setVariable('MATB_lastEvent', JSON.stringify(payload)); }

  // In many Labvanced setups, it's easiest to have the parent frame (Labvanced) listen
  // for messages and then call its own `lv.setVariable()` there. See example in README.
});