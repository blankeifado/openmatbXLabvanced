\# MATB-lite (RESMAN + SYSMON)



This repo contains a small browser-hostable implementation of two MATB-II subtasks: RESMAN and SYSMON.



\## Files

\- `index.html` — Main page to host.

\- `style.css` — Styles.

\- `config.json` — Tuning parameters (tick, pump strength, alarm intervals, duration).

\- `main.js` — Scheduler + event emitter.

\- `resman.js` — RESMAN logic and UI.

\- `sysmon.js` — SYSMON logic and UI.

\- `labvanced\_listener.js` — Example listener for the parent frame.



\## Deploy (GitHub Pages)

1\. Create a new repository (e.g., `matb-lite`).

2\. Copy the files into the repo and push.

3\. In GitHub Settings → Pages, choose branch `main` and folder `/` (or use `gh-pages` branch with `/docs`).

4\. After a minute your site will be available at `https://<username>.github.io/<repo>`.



\## Embed in Labvanced

Add an `<iframe>` with the published URL in a Labvanced frame. Use a `Run JavaScript` action in Labvanced to listen for `message` events from the iframe and call Labvanced's variable API to save events.



Example Labvanced listener (attach to Frame Start):



```js

const iframe = document.getElementById('openmatb\_iframe');

window.addEventListener('message', (e)=>{

&nbsp; if (!e.data || e.data.type !== 'MATB\_EVENT') return;

&nbsp; const p = e.data.payload;

&nbsp; // Map to Labvanced variables (example)

&nbsp; // lv.setVariable('MATB\_event\_time', p.timestamp);

&nbsp; // lv.setVariable('MATB\_event\_json', JSON.stringify(p));

});



// To send start config to iframe

iframe.addEventListener('load', ()=>{

&nbsp; iframe.contentWindow.postMessage({type:'LABVANCED\_INIT', payload:{subjectId:'S001'}}, '\*');

});



