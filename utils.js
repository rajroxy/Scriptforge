/* ═══════════════════════════════════════════════════════════
   ScriptForge — Utilities
   A small popup of everyday apps, grouped into tabs and opened from
   the editor toolbar:
     Time    · Clock · Stopwatch · Sprint timer
     Plan    · Calendar · Word goal
     Text    · Word counter · Case converter
     Numbers · Calculator · Unit converter · Random picker
   ═══════════════════════════════════════════════════════════ */

const UTIL_GROUPS = [
  { id:'time', label:'Time', icon:'clock',
    tools:[ { id:'clock',     label:'Clock',        icon:'clock' },
            { id:'stopwatch', label:'Stopwatch',    icon:'hourglass-split' },
            { id:'sprint',    label:'Sprint timer', icon:'stopwatch' } ] },
  { id:'plan', label:'Plan', icon:'calendar3',
    tools:[ { id:'calendar', label:'Calendar',  icon:'calendar3' },
            { id:'goal',     label:'Word goal', icon:'bullseye' } ] },
  { id:'text', label:'Text', icon:'type',
    tools:[ { id:'counter',  label:'Word counter',   icon:'file-text' },
            { id:'caseconv', label:'Case converter', icon:'text-capitalize' } ] },
  { id:'numbers', label:'Numbers', icon:'calculator',
    tools:[ { id:'calc',  label:'Calculator',     icon:'calculator' },
            { id:'units', label:'Unit converter', icon:'arrow-left-right' },
            { id:'pick',  label:'Random picker',  icon:'shuffle' } ] },
  { id:'lookup', label:'Lookup', icon:'book',
    tools:[ { id:'dictionary', label:'Dictionary', icon:'book' } ] }
];

function notesRender(){
  const el = notesEls();
  const list = noteList();
  if(!list.length){
    el.body.innerHTML = '<div class="notes-empty"><i class="bi bi-sticky"></i><br>No notes yet.<br>Tap + to start one.</div>';
    return;
  }
  el.body.innerHTML = list.map(function(n, i){
    const when = new Date(n.created || Date.now()).toLocaleString();
    return '<div class="note-card" data-note-index="' + i + '">' +
        '<div class="note-card-top">' +
          '<button class="notes-mini note-grab" data-note-grab="' + i + '" title="Drag to move"><i class="bi bi-grip-vertical"></i></button>' +
          '<input class="note-title-inp" data-note-title="' + i + '" value="' + esc(n.title || '') + '" placeholder="Note title">' +
          '<button class="notes-mini" data-note-rename="' + i + '" title="Rename note"><i class="bi bi-pencil"></i></button>' +
          '<button class="notes-mini" data-note-del="' + i + '" title="Delete note"><i class="bi bi-trash"></i></button>' +
        '</div>' +
        '<input class="note-sub-inp" data-note-sub="' + i + '" value="' + esc(n.sub || '') + '" placeholder="Subtitle">' +
        '<textarea class="note-body-inp" data-note-body="' + i + '" placeholder="Note text…">' + esc(n.body || '') + '</textarea>' +
        '<div class="note-meta">' + when + '</div>' +
      '</div>';
  }).join('');
}

function utilCfg(){
  if(!S.config.util || typeof S.config.util !== 'object') S.config.util = {};
  const u = S.config.util;
  if(!u.group || !UTIL_GROUPS.some(g => g.id === u.group)) u.group = UTIL_GROUPS[0].id;
  const group = UTIL_GROUPS.find(g => g.id === u.group);
  if(!u.tool || !group.tools.some(t => t.id === u.tool)) u.tool = group.tools[0].id;
  if(typeof u.open !== 'boolean') u.open = false;
  if(u.x === undefined) u.x = null;
  if(u.y === undefined) u.y = null;
  return u;
}

/* ── the panel itself (built once, on first open) ── */
let _utilEls = null;
function utilEls(){
  if(_utilEls && document.body.contains(_utilEls.panel)) return _utilEls;
  const panel = document.createElement('div');
  panel.className = 'util-panel';
  panel.id = 'utilPanel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="util-head" id="utilHead">
      <button class="util-close" data-util="close" title="Close"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="util-tabs" id="utilTabs"></div>
    <div class="util-tools" id="utilTools"></div>
    <div class="util-body" id="utilBody"></div>`;
  document.body.appendChild(panel);
  _utilEls = {
    panel,
    head:  panel.querySelector('#utilHead'),
    tabs:  panel.querySelector('#utilTabs'),
    tools: panel.querySelector('#utilTools'),
    body:  panel.querySelector('#utilBody')
  };
  return _utilEls;
}

/* ── a short chime when a sprint ends ── */
function utilBeep(){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.12;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => { try{ osc.stop(); ctx.close && ctx.close(); }catch(e){} }, 650);
  }catch(e){}
}

/* ═══════════════════════════════════════════════════════════
   THE APPS — each one renders into host and returns a cleanup fn
   ═══════════════════════════════════════════════════════════ */
const UTIL_TOOLS = {};

/* ── Clock ── */
UTIL_TOOLS.clock = function(host){
  host.innerHTML = `
    <div class="util-big" id="utilClockTime">--:--:--</div>
    <div class="util-sub" id="utilClockDate"></div>
    <div class="util-sub" id="utilClockZone" style="color:var(--ink-4);"></div>`;
  const t = host.querySelector('#utilClockTime');
  const d = host.querySelector('#utilClockDate');
  const z = host.querySelector('#utilClockZone');
  if(z){
    try{ z.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
  }
  function tick(){
    const now = new Date();
    if(t) t.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    if(d) d.textContent = now.toLocaleDateString([], { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  tick();
  const iv = setInterval(tick, 1000);
  return () => clearInterval(iv);
};

/* ── Stopwatch — counts up, with laps ── */
UTIL_TOOLS.stopwatch = function(host){
  let acc = 0, startedAt = 0, iv = null, laps = [];

  host.innerHTML = `
    <div class="util-sprint-num" id="utilSwNum">0:00.0</div>
    <div class="util-actions">
      <button class="util-btn primary" id="utilSwGo"><i class="bi bi-play-fill"></i> Start</button>
      <button class="util-btn" id="utilSwLap"><i class="bi bi-flag"></i> Lap</button>
      <button class="util-btn" id="utilSwReset"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
    </div>
    <div class="util-note" id="utilSwLaps" style="margin-top:10px;line-height:1.7;">No laps yet.</div>`;

  const numEl  = host.querySelector('#utilSwNum');
  const goEl   = host.querySelector('#utilSwGo');
  const lapsEl = host.querySelector('#utilSwLaps');

  const total = () => acc + (iv ? Date.now() - startedAt : 0);
  function fmt(ms){
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = Math.floor((ms % 1000) / 100);
    return m + ':' + (s < 10 ? '0' + s : s) + '.' + t;
  }

  function paint(){
    numEl.textContent = fmt(total());
    goEl.innerHTML = iv ? '<i class="bi bi-pause-fill"></i> Pause'
                        : (total() > 0 ? '<i class="bi bi-play-fill"></i> Resume'
                                       : '<i class="bi bi-play-fill"></i> Start');
    lapsEl.innerHTML = laps.length ? laps.map((l, i) => 'Lap ' + (i + 1) + ' · ' + fmt(l)).join('<br>') : 'No laps yet.';
  }

  function stop(){ if(iv){ clearInterval(iv); iv = null; } }

  goEl.onclick = function(){
    if(iv){ acc = total(); stop(); paint(); return; }
    startedAt = Date.now();
    iv = setInterval(paint, 100);
    paint();
  };

  host.querySelector('#utilSwLap').onclick = function(){
    if(total() === 0) return;
    laps.unshift(total());
    if(laps.length > 12) laps.pop();
    paint();
  };

  host.querySelector('#utilSwReset').onclick = function(){
    stop(); acc = 0; laps = []; paint();
  };

  paint();
  return stop;
};

/* ── Word goal — today's words against the daily target ── */
UTIL_TOOLS.goal = function(host){
  host.innerHTML = `
    <div class="util-big" id="utilGoalWords">0</div>
    <div class="util-sub" id="utilGoalSub"></div>
    <div class="util-bar" style="margin:12px 0 14px;"><span id="utilGoalFill"></span></div>
    <div class="util-row">
      <span class="util-note">Daily goal</span>
      <input class="util-inp" id="utilGoalSet" type="number" min="0" step="50">
      <button class="util-btn" id="utilGoalSave">Save</button>
    </div>
    <div class="util-note" style="margin-top:10px;" id="utilGoalWeek"></div>`;

  const wordsEl = host.querySelector('#utilGoalWords');
  const subEl   = host.querySelector('#utilGoalSub');
  const fillEl  = host.querySelector('#utilGoalFill');
  const setEl   = host.querySelector('#utilGoalSet');
  const weekEl  = host.querySelector('#utilGoalWeek');

  function paint(){
    const log   = S.config.writingLog || {};
    const today = new Date().toISOString().split('T')[0];
    const words = log[today] || 0;
    const goal  = S.config.dailyGoal || 500;
    const pct   = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;

    wordsEl.textContent = words.toLocaleString();
    subEl.textContent = goal > 0
      ? pct + '% of ' + goal.toLocaleString() + ' words today'
      : 'No daily goal set';
    fillEl.style.width = pct + '%';
    setEl.value = goal;

    let sum = 0, days = 0;
    for(let i = 0; i < 7; i++){
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const k = dt.toISOString().split('T')[0];
      if(log[k] > 0){ sum += log[k]; days++; }
    }
    weekEl.textContent = days
      ? 'Last 7 days · ' + sum.toLocaleString() + ' words across ' + days + (days === 1 ? ' day' : ' days')
      : 'No writing logged yet this week.';
  }

  host.querySelector('#utilGoalSave').onclick = function(){
    const n = parseInt(setEl.value, 10);
    S.config.dailyGoal = isFinite(n) && n >= 0 ? n : 500;
    save();
    paint();
    toast('Daily goal: ' + S.config.dailyGoal.toLocaleString() + ' words');
  };

  paint();
};

/* ── Case converter — clean up text without leaving the editor ── */
UTIL_TOOLS.caseconv = function(host){
  const CASES = [
    { id:'upper',   label:'UPPER' },
    { id:'lower',   label:'lower' },
    { id:'title',   label:'Title Case' },
    { id:'sentence',label:'Sentence case' },
    { id:'camel',   label:'camelCase' },
    { id:'snake',   label:'snake_case' },
    { id:'kebab',   label:'kebab-case' },
    { id:'trim',    label:'Trim spaces' }
  ];

  host.innerHTML = `
    <textarea class="util-inp" id="utilCaseText" placeholder="Paste or type text…" spellcheck="false"></textarea>
    <div class="util-presets" style="justify-content:flex-start;flex-wrap:wrap;gap:4px;margin-top:8px;">
      ${CASES.map(c => `<button class="util-btn" data-case="${c.id}">${c.label}</button>`).join('')}
    </div>
    <div class="util-row" style="margin-top:8px;">
      <button class="util-btn" id="utilCaseCopy"><i class="bi bi-clipboard"></i> Copy</button>
      <button class="util-btn" id="utilCaseClear"><i class="bi bi-x-circle"></i> Clear</button>
      <span class="util-spacer"></span>
      <span class="util-note" id="utilCaseCount"></span>
    </div>`;

  const ta = host.querySelector('#utilCaseText');
  const count = host.querySelector('#utilCaseCount');
  const words = s => (s.trim().match(/\S+/g) || []);

  function applyCase(id, s){
    switch(id){
      case 'upper':    return s.toUpperCase();
      case 'lower':    return s.toLowerCase();
      case 'title':    return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      case 'sentence': return s.toLowerCase().replace(/(^\s*\w|[.!?…]\s+\w)/g, m => m.toUpperCase());
      case 'camel':    return words(s).map((w, i) => {
                         const c = w.toLowerCase();
                         return i === 0 ? c : c.charAt(0).toUpperCase() + c.slice(1);
                       }).join('');
      case 'snake':    return words(s).map(w => w.toLowerCase()).join('_');
      case 'kebab':    return words(s).map(w => w.toLowerCase()).join('-');
      case 'trim':     return s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      default:         return s;
    }
  }

  function paintCount(){ count.textContent = words(ta.value).length + ' words'; }
  ta.addEventListener('input', paintCount);

  host.addEventListener('click', function(e){
    const b = e.target.closest('[data-case]');
    if(b){
      if(!ta.value.trim()){ toast('Add some text first', 'warn'); return; }
      ta.value = applyCase(b.dataset.case, ta.value);
      paintCount();
      return;
    }
    if(e.target.closest('#utilCaseClear')){ ta.value = ''; paintCount(); return; }
    if(e.target.closest('#utilCaseCopy')){
      if(!ta.value){ toast('Nothing to copy', 'warn'); return; }
      try{ navigator.clipboard.writeText(ta.value); toast('Copied'); }catch(err){ toast('Copy failed', 'err'); }
    }
  });

  paintCount();
};

/* ── Unit converter — length, weight, volume, temperature ── */
UTIL_TOOLS.units = function(host){
  const TABLES = {
    Length:      { m:1, km:1000, cm:.01, mm:.001, mi:1609.344, yd:.9144, ft:.3048, in:.0254 },
    Weight:      { kg:1, g:.001, mg:1e-6, lb:.45359237, oz:.028349523125, st:6.35029318 },
    Volume:      { L:1, mL:.001, gal:3.785411784, qt:.946352946, cup:.2365882365, floz:.0295735296 },
    Temperature: { '°C':1, '°F':1, K:1 }
  };
  const CATS = Object.keys(TABLES);

  host.innerHTML = `
    <div class="util-row" style="margin-bottom:8px;">
      <span class="util-note">Category</span>
      <select class="util-inp" id="utilUnitCat">${CATS.map(c => `<option>${c}</option>`).join('')}</select>
    </div>
    <div class="util-row" style="margin-bottom:8px;">
      <input class="util-inp" id="utilUnitVal" type="number" step="any" value="1" inputmode="decimal">
      <select class="util-inp" id="utilUnitFrom"></select>
    </div>
    <div class="util-row" style="margin-bottom:10px;">
      <span class="util-spacer"></span>
      <button class="util-btn" id="utilUnitSwap" title="Swap units"><i class="bi bi-arrow-down-up"></i> Swap</button>
      <span class="util-spacer"></span>
    </div>
    <div class="util-row" style="margin-bottom:10px;">
      <select class="util-inp" id="utilUnitTo"></select>
    </div>
    <div class="util-display"><div class="val" id="utilUnitOut">—</div></div>`;

  const catEl  = host.querySelector('#utilUnitCat');
  const valEl  = host.querySelector('#utilUnitVal');
  const fromEl = host.querySelector('#utilUnitFrom');
  const toEl   = host.querySelector('#utilUnitTo');
  const outEl  = host.querySelector('#utilUnitOut');

  function toCelsius(v, u){ return u === '°C' ? v : (u === '°F' ? (v - 32) * 5 / 9 : v - 273.15); }
  function fromCelsius(c, u){ return u === '°C' ? c : (u === '°F' ? c * 9 / 5 + 32 : c + 273.15); }

  function units(){ return Object.keys(TABLES[catEl.value]); }

  function fillUnits(keep){
    const us = units();
    const [a, b] = keep || [us[0], us[1] || us[0]];
    fromEl.innerHTML = us.map(u => `<option${u === a ? ' selected' : ''}>${u}</option>`).join('');
    toEl.innerHTML   = us.map(u => `<option${u === b ? ' selected' : ''}>${u}</option>`).join('');
  }

  function paint(){
    const v = parseFloat(valEl.value);
    if(!isFinite(v)){ outEl.textContent = '—'; return; }
    const cat = catEl.value, from = fromEl.value, to = toEl.value;
    let out;
    if(cat === 'Temperature'){
      out = fromCelsius(toCelsius(v, from), to);
    } else {
      out = v * TABLES[cat][from] / TABLES[cat][to];
    }
    const shown = Math.abs(out) >= 1e6 || (Math.abs(out) < 1e-4 && out !== 0)
      ? out.toExponential(4)
      : String(Math.round(out * 1e6) / 1e6);
    outEl.textContent = shown;
  }

  catEl.onchange = function(){ fillUnits(); paint(); };
  fromEl.onchange = paint;
  toEl.onchange = paint;
  valEl.oninput = paint;
  host.querySelector('#utilUnitSwap').onclick = function(){
    const a = fromEl.value, b = toEl.value;
    fillUnits([b, a]);
    paint();
  };

  fillUnits();
  paint();
};

/* ── Sprint timer ── */
UTIL_TOOLS.sprint = function(host){
  const PRESETS = [5, 10, 15, 25, 45];
  let mins  = parseInt(S.config.utilSprintMin, 10) || 25;
  let left  = mins * 60;
  let iv    = null;
  let done  = false;

  host.innerHTML = `
    <div class="util-sprint-num" id="utilSprintNum">${mins}:00</div>
    <div class="util-note" style="text-align:center;margin-bottom:8px;">Just you and the page — no edits, no browser.</div>
    <div class="util-presets" id="utilSprintPresets">
      ${PRESETS.map(m => `<button class="util-btn" data-sprint-min="${m}">${m}m</button>`).join('')}
    </div>
    <div class="util-actions">
      <button class="util-btn primary" id="utilSprintGo"><i class="bi bi-play-fill"></i> Start</button>
      <button class="util-btn" id="utilSprintReset"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
    </div>`;

  const num = host.querySelector('#utilSprintNum');
  const go  = host.querySelector('#utilSprintGo');

  function paint(){
    const m = Math.floor(left / 60), s = left % 60;
    num.textContent = m + ':' + (s < 10 ? '0' + s : s);
    num.style.color = done ? 'var(--accent-2)' : '';
    go.innerHTML = iv ? '<i class="bi bi-pause-fill"></i> Pause' : (done ? '<i class="bi bi-play-fill"></i> Again' : '<i class="bi bi-play-fill"></i> Start');
  }

  function stop(){ if(iv){ clearInterval(iv); iv = null; } }

  function finish(){
    stop();
    done = true;
    paint();
    utilBeep();
    toast('Sprint complete — ' + mins + ' minutes written');
  }

  function tick(){
    left--;
    if(left <= 0){ left = 0; paint(); finish(); return; }
    paint();
  }

  go.onclick = function(){
    if(iv){ stop(); paint(); return; }
    if(done || left <= 0){ left = mins * 60; done = false; }
    iv = setInterval(tick, 1000);
    paint();
  };

  host.querySelector('#utilSprintReset').onclick = function(){
    stop(); done = false; left = mins * 60; paint();
  };

  host.addEventListener('click', function(e){
    const b = e.target.closest('[data-sprint-min]');
    if(!b) return;
    stop();
    mins = parseInt(b.dataset.sprintMin, 10) || 25;
    S.config.utilSprintMin = mins;
    save();
    left = mins * 60;
    done = false;
    paint();
  });

  paint();
  return stop;
};

/* ── Calendar — a month of days, with the days you opened ScriptForge filled ── */
UTIL_TOOLS.calendar = function(host){
  const log = S.config.openLog || {};
  const keyOf = dt => (typeof dayKey === 'function' ? dayKey(dt) : dt.toDateString());
  let view = new Date();
  view.setDate(1);

  host.innerHTML = `
    <div class="util-cal-head">
      <button class="util-btn" data-cal="-1" title="Previous month"><i class="bi bi-chevron-left"></i></button>
      <span class="util-cal-month" id="utilCalMonth"></span>
      <span class="util-spacer"></span>
      <button class="util-btn" data-cal="today">Today</button>
      <button class="util-btn" data-cal="1" title="Next month"><i class="bi bi-chevron-right"></i></button>
    </div>
    <div class="util-cal-grid" id="utilCalGrid"></div>
    <div class="util-note" style="margin-top:8px;">Filled days are days you opened ScriptForge.</div>`;

  const monthEl = host.querySelector('#utilCalMonth');
  const gridEl  = host.querySelector('#utilCalGrid');

  function paint(){
    const y = view.getFullYear(), m = view.getMonth();
    monthEl.textContent = view.toLocaleDateString([], { month:'long', year:'numeric' });

    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;   // Monday first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const today = new Date();
    const sameDay = dt => dt.getFullYear() === today.getFullYear()
                       && dt.getMonth() === today.getMonth()
                       && dt.getDate() === today.getDate();

    let html = ['M','T','W','T','F','S','S']
      .map(d => '<div class="util-cal-dow">' + d + '</div>').join('');

    for(let i = startDow - 1; i >= 0; i--){
      html += '<div class="util-cal-day dim">' + (prevDays - i) + '</div>';
    }
    for(let d = 1; d <= daysInMonth; d++){
      const dt = new Date(y, m, d);
      const opened = !!log[keyOf(dt)];
      const cls = 'util-cal-day' + (sameDay(dt) ? ' today' : '') + (opened ? ' on' : '');
      const label = dt.toLocaleDateString([], { weekday:'long', day:'numeric', month:'long' });
      html += '<div class="' + cls + '" title="' + label + (opened ? ' — opened' : '') + '">' + d + '</div>';
    }
    const pad = (7 - ((startDow + daysInMonth) % 7)) % 7;
    for(let i = 1; i <= pad; i++) html += '<div class="util-cal-day dim">' + i + '</div>';

    gridEl.innerHTML = html;
  }

  host.addEventListener('click', function(e){
    const b = e.target.closest('[data-cal]');
    if(!b) return;
    if(b.dataset.cal === 'today'){ view = new Date(); view.setDate(1); }
    else view.setMonth(view.getMonth() + parseInt(b.dataset.cal, 10));
    paint();
  });

  paint();
};

/* ── Word counter ── */
UTIL_TOOLS.counter = function(host){
  host.innerHTML = `
    <textarea class="util-inp" id="utilCountText" placeholder="Paste or type text…" spellcheck="false"></textarea>
    <div class="util-row" style="margin-top:8px;gap:12px;flex-wrap:wrap;" id="utilCountOut"></div>`;
  const ta  = host.querySelector('#utilCountText');
  const out = host.querySelector('#utilCountOut');

  function paint(){
    const s = ta.value;
    const words  = (s.trim().match(/\S+/g) || []).length;
    const chars  = s.length;
    const tight  = s.replace(/\s/g, '').length;
    const sents  = (s.match(/[^.!?…]+[.!?…]+/g) || []).length;
    const paras  = s.split(/\n{2,}/).filter(p => p.trim()).length;
    const read   = Math.max(1, Math.round(words / 200));
    const cell = (n, l) =>
      '<div style="min-width:60px;"><div class="util-big" style="font-size:18px;">' + n +
      '</div><div class="util-note">' + l + '</div></div>';
    out.innerHTML = cell(words, 'words') + cell(chars, 'characters') + cell(tight, 'no spaces')
                  + cell(sents, 'sentences') + cell(paras, 'paragraphs') + cell(read + ' min', 'read time');
  }

  ta.addEventListener('input', paint);
  paint();
};

/* ── Calculator ── */
UTIL_TOOLS.calc = function(host){
  const LAYOUT = ['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
  let expr = '', justDone = false;

  host.innerHTML = `
    <div class="util-display">
      <div class="ex" id="utilCalcEx"></div>
      <div class="val" id="utilCalcVal">0</div>
    </div>
    <div class="util-keys" id="utilCalcKeys"></div>`;

  const keysEl = host.querySelector('#utilCalcKeys');
  const exEl   = host.querySelector('#utilCalcEx');
  const valEl  = host.querySelector('#utilCalcVal');

  keysEl.innerHTML = LAYOUT.map(k => {
    const op = /[÷×−+%C⌫]/.test(k);
    const cls = 'util-key' + (k === '=' ? ' eq' : (op ? ' op' : ''));
    const span = k === '=' ? ' style="grid-column:span 2;"' : '';
    return '<button type="button" class="' + cls + '" data-key="' + k + '"' + span + '>' + k + '</button>';
  }).join('');

  function evaluate(src){
    if(!src) return '';
    if(!/^[0-9+\-*/(). %]+$/.test(src)) return 'Error';
    try{
      const v = Function('"use strict";return (' + src + ')')();
      if(typeof v !== 'number' || !isFinite(v)) return 'Error';
      return String(Math.round(v * 1e10) / 1e10);
    }catch(e){ return 'Error'; }
  }

  function paint(){
    valEl.textContent = expr || '0';
    const v = expr ? evaluate(expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')) : '';
    exEl.textContent = (v && v !== 'Error') ? '= ' + v : '';
  }

  function press(k){
    if(k === 'C'){ expr = ''; justDone = false; }
    else if(k === '⌫'){ expr = expr.slice(0, -1); justDone = false; }
    else if(k === '='){
      const v = evaluate(expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'));
      if(v === 'Error'){ toast('That expression does not add up', 'err'); return; }
      expr = v;
      justDone = true;
    } else {
      if(justDone && /[0-9.]/.test(k)) expr = '';
      justDone = false;
      expr += k;
    }
    paint();
  }

  keysEl.addEventListener('click', function(e){
    const b = e.target.closest('[data-key]');
    if(b) press(b.dataset.key);
  });

  /* The keyboard drives the calculator only while the pointer is over it or it
     owns focus — so typing in the editor is never hijacked. */
  function onKey(e){
    const panel = utilEls().panel;
    if(!panel.matches(':hover') && !panel.contains(document.activeElement)) return;
    const el = document.activeElement;
    if(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    const alias = { '*':'×', '/':'÷', '-':'−', 'x':'×' };
    if(/^[0-9.]$/.test(e.key)){ e.preventDefault(); press(e.key); }
    else if(['+','-','*','/','%'].indexOf(e.key) !== -1){ e.preventDefault(); press(alias[e.key] || e.key); }
    else if(e.key === 'Enter' || e.key === '='){ e.preventDefault(); press('='); }
    else if(e.key === 'Backspace'){ e.preventDefault(); press('⌫'); }
  }
  document.addEventListener('keydown', onKey);

  paint();
  return () => document.removeEventListener('keydown', onKey);
};

/* ── Random picker — a number in a range, or one line from a list ── */
UTIL_TOOLS.pick = function(host){
  host.innerHTML = `
    <div class="util-row">
      <input class="util-inp" id="utilPickMin" type="number" value="1" inputmode="numeric">
      <span class="util-note">to</span>
      <input class="util-inp" id="utilPickMax" type="number" value="100" inputmode="numeric">
      <button class="util-btn primary" id="utilPickRoll"><i class="bi bi-dice-5"></i> Roll</button>
    </div>
    <div class="util-big" id="utilPickNum" style="margin:8px 0 14px;">—</div>
    <div class="util-note" style="margin-bottom:5px;">Or pick one line at random:</div>
    <textarea class="util-inp" id="utilPickList" placeholder="One option per line…" spellcheck="false"></textarea>
    <div class="util-row" style="margin-top:8px;">
      <button class="util-btn" id="utilPickLine"><i class="bi bi-shuffle"></i> Pick a line</button>
      <span id="utilPickItem" style="font-weight:600;"></span>
    </div>`;

  const minEl  = host.querySelector('#utilPickMin');
  const maxEl  = host.querySelector('#utilPickMax');
  const numEl  = host.querySelector('#utilPickNum');
  const listEl = host.querySelector('#utilPickList');
  const itemEl = host.querySelector('#utilPickItem');

  function intOf(el, fallback){
    const n = parseInt(el.value, 10);
    return isFinite(n) ? n : fallback;
  }

  host.querySelector('#utilPickRoll').onclick = function(){
    let lo = intOf(minEl, 1), hi = intOf(maxEl, 100);
    if(lo > hi){ const t = lo; lo = hi; hi = t; }
    minEl.value = lo; maxEl.value = hi;
    numEl.textContent = String(lo + Math.floor(Math.random() * (hi - lo + 1)));
    numEl.style.color = 'var(--accent-2)';
  };

  host.querySelector('#utilPickLine').onclick = function(){
    const lines = listEl.value.split('\n').map(s => s.trim()).filter(Boolean);
    if(!lines.length){ toast('Add some lines first', 'warn'); return; }
    itemEl.textContent = lines[Math.floor(Math.random() * lines.length)];
    itemEl.style.color = 'var(--accent-2)';
  };
};

/* ═══════════════════════════════════════════════════════════
   OPEN · CLOSE · RENDER
   ═══════════════════════════════════════════════════════════ */
let utilCleanup = null;

function utilPlace(){
  const el = utilEls();
  const u  = utilCfg();
  if(!isFinite(u.x)) u.x = null;
  if(!isFinite(u.y)) u.y = null;
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = el.panel.offsetWidth || 320;
  const h = el.panel.offsetHeight || 380;
  if(u.x == null) u.x = Math.max(12, vw - w - 24);
  if(u.y == null) u.y = 76;
  u.x = Math.max(8, Math.min(u.x, Math.max(8, vw - w - 8)));
  u.y = Math.max(52, Math.min(u.y, Math.max(52, vh - h - 8)));
  el.panel.style.left = u.x + 'px';
  el.panel.style.top  = u.y + 'px';
}

function utilRender(){
  const el = utilEls();
  const u  = utilCfg();

  el.tabs.innerHTML = UTIL_GROUPS.map(g =>
    '<button type="button" class="util-chip' + (g.id === u.group ? ' active' : '') + '" data-util-group="' + g.id + '">' +
      '<i class="bi bi-' + g.icon + '"></i>' + g.label +
    '</button>').join('');

    const group = UTIL_GROUPS.find(g => g.id === u.group);
  /* one tool in the group = the group chip already names it — no second row */
  const single = group.tools.length < 2;
  el.tools.style.display = single ? 'none' : '';
  el.tools.innerHTML = single ? '' : group.tools.map(t =>
    '<button type="button" class="util-chip' + (t.id === u.tool ? ' active' : '') + '" data-util-tool="' + t.id + '">' +
      '<i class="bi bi-' + t.icon + '"></i>' + t.label +
    '</button>').join('');


  if(utilCleanup){ try{ utilCleanup(); }catch(e){} utilCleanup = null; }
  el.body.innerHTML = '';
  const mount = UTIL_TOOLS[u.tool];
  if(mount) utilCleanup = mount(el.body) || null;
}

function utilShow(on){
  const el = utilEls();
  const u  = utilCfg();
  u.open = !!on;
  el.panel.hidden = !on;
  document.querySelectorAll('[data-act="util-open"]').forEach(b => b.classList.toggle('active', !!on));
  if(on){
    utilPlace();
    utilRender();
    utilPlace();                      // re-clamp now that the body has height
  } else {
    if(utilCleanup){ try{ utilCleanup(); }catch(e){} utilCleanup = null; }
    el.body.innerHTML = '';
  }
  save();
}

function utilToggle(){ utilShow(!utilCfg().open); }
window.utilToggle = utilToggle;
window.utilOpen   = function(){ utilShow(true); };

/* ── drag by the header ── */
(function utilDrag(){
  let drag = null;
  document.addEventListener('mousedown', function(e){
    const head = e.target.closest('#utilHead');
    if(!head || e.target.closest('button')) return;
    const panel = utilEls().panel;
    const r = panel.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!drag) return;
    const u = utilCfg();
    u.x = e.clientX - drag.dx;
    u.y = e.clientY - drag.dy;
    utilPlace();
  });
  document.addEventListener('mouseup', function(){
    if(!drag) return;
    drag = null;
    document.body.style.userSelect = '';
    save();
  });
})();

/* ── wiring ── */
document.addEventListener('click', function(e){
  if(e.target.closest('[data-act="util-open"]')){ e.preventDefault(); utilToggle(); return; }
  if(e.target.closest('[data-util="close"]')){ e.preventDefault(); utilShow(false); return; }

  const g = e.target.closest('[data-util-group]');
  if(g){
    e.preventDefault();
    const u = utilCfg();
    u.group = g.dataset.utilGroup;
    const group = UTIL_GROUPS.find(x => x.id === u.group);
    if(group && !group.tools.some(t => t.id === u.tool)) u.tool = group.tools[0].id;
    save();
    utilRender();
    utilPlace();
    return;
  }
  const t = e.target.closest('[data-util-tool]');
  if(t){
    e.preventDefault();
    utilCfg().tool = t.dataset.utilTool;
    save();
    utilRender();
    return;
  }
}, true);

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && utilCfg().open && !$('modalRoot')?.classList.contains('open')) utilShow(false);
});

window.addEventListener('resize', function(){ if(utilCfg().open) utilPlace(); });

/* ── Dictionary — the same free API the Dictionary page uses ── */
/* ── Dictionary — definition · synonyms · rhymes ── */
UTIL_TOOLS.dictionary = function(host){
  let mode = 'define';

  host.innerHTML = `
    <div class="util-row">
      <input class="util-inp" id="udWord" placeholder="Type a word…" autocomplete="off" spellcheck="false">
      <button class="util-btn" id="udGo"><i class="bi bi-search"></i> Look up</button>
    </div>
    <div class="util-tabs" id="udTabs" style="padding:8px 0 2px;">
      <button class="util-chip active" data-ud="define"><i class="bi bi-book"></i>Definition</button>
      <button class="util-chip" data-ud="syn"><i class="bi bi-shuffle"></i>Synonyms</button>
      <button class="util-chip" data-ud="rhy"><i class="bi bi-music-note"></i>Rhymes</button>
    </div>
    <div id="udOut" class="util-sub" style="margin-top:8px;max-height:280px;overflow-y:auto;">Type a word and press Enter.</div>`;

  const inp  = host.querySelector('#udWord');
  const out  = host.querySelector('#udOut');
  const tabs = host.querySelector('#udTabs');

  const strip = s => String(s || '').replace(/<[^>]*>/g, '');
  const chips = arr => arr.slice(0, 24).map(function(x){
    const w = (typeof x === 'string') ? x : x.word;
    return '<button class="util-chip" data-ud-use="' + esc(w) + '" style="margin:0 4px 4px 0;">' + esc(w) + '</button>';
  }).join('');

  async function getJSON(url){
    const r = await fetch(url);
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  /* 1st source: dictionaryapi.dev · 2nd source: Wiktionary */
  async function define(w){
    try{
      const d = await getJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w));
      if(d && d[0] && d[0].meanings && d[0].meanings.length){
        const phon = d[0].phonetic || '';
        return (phon ? '<div style="color:var(--ink-4)">' + esc(phon) + '</div>' : '') +
          d[0].meanings.slice(0,4).map(function(m){
            return '<div style="margin:8px 0"><b>' + esc(m.partOfSpeech || '') + '</b>' +
              (m.definitions || []).slice(0,4).map(function(x){
                return '<div style="margin-top:3px">• ' + esc(x.definition) +
                  (x.example ? '<div style="color:var(--ink-4);padding-left:12px">“' + esc(x.example) + '”</div>' : '') +
                '</div>';
              }).join('') + '</div>';
          }).join('');
      }
    }catch(e){}

    try{
      const j = await getJSON('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(w));
      const en = j.en || j[Object.keys(j)[0]];
      if(Array.isArray(en) && en.length){
        return en.slice(0,4).map(function(p){
          return '<div style="margin:8px 0"><b>' + esc(p.partOfSpeech || '') + '</b>' +
            (p.definitions || []).slice(0,4).map(function(x){
              return '<div style="margin-top:3px">• ' + esc(strip(x.definition)) + '</div>';
            }).join('') + '</div>';
        }).join('');
      }
    }catch(e){}
    return '';
  }

  async function run(){
    const w = (inp.value || '').trim();
    if(!w){ out.textContent = 'Type a word first.'; return; }
    out.textContent = 'Looking up “' + w + '”…';
    try{
      if(mode === 'syn'){
        const d = await getJSON('https://api.datamuse.com/words?ml=' + encodeURIComponent(w) + '&max=24');
        out.innerHTML = d && d.length
          ? '<b>Synonyms of ' + esc(w) + '</b><div style="margin-top:6px">' + chips(d) + '</div>'
          : 'No synonyms found.';
        return;
      }
      if(mode === 'rhy'){
        const d = await getJSON('https://api.datamuse.com/words?rel_rhy=' + encodeURIComponent(w) + '&max=24');
        out.innerHTML = d && d.length
          ? '<b>Rhymes with ' + esc(w) + '</b><div style="margin-top:6px">' + chips(d) + '</div>'
          : 'No rhymes found.';
        return;
      }
      const html = await define(w);
      out.innerHTML = html || ('<b>' + esc(w) + '</b> — no definition found. Try the base form (e.g. <i>run</i> instead of <i>running</i>).');
    }catch(e){
      out.innerHTML = 'Lookup failed — check your connection.';
    }
  }

  host.querySelector('#udGo').addEventListener('click', run);
  inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') run(); });

  /* tab switching + click a word chip to look it up */
  host.addEventListener('click', function(e){
    const b = e.target.closest('[data-ud]');
    if(b){
      mode = b.dataset.ud;
      Array.prototype.forEach.call(tabs.querySelectorAll('[data-ud]'), function(x){ x.classList.toggle('active', x === b); });
      if((inp.value || '').trim()) run();
      return;
    }
    const u = e.target.closest('[data-ud-use]');
    if(u){ inp.value = u.dataset.udUse; run(); }
  });

  inp.focus();
};
