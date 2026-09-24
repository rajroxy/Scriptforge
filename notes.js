/* ═══════════════════════════════════════════════════════════
   notes.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · notes.js
     · sounds.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ notes.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Notes
   A popup panel, opened from the editor toolbar, that keeps the notes for
   the mode you're writing in to hand. It floats over the editor, drags by
   its header and remembers where you left it.

   The Notes page renders the same data, so both stay in step — editing in
   one shows up in the other.
   ═══════════════════════════════════════════════════════════ */

function noteList(){
  if(typeof D !== 'function') return [];
  const d = D();
  if(!Array.isArray(d.notes)) d.notes = [];
  return d.notes;
}

function notesCfg(){
  if(!S.config.notesPanel || typeof S.config.notesPanel !== 'object') S.config.notesPanel = {};
  const c = S.config.notesPanel;
  if(typeof c.open !== 'boolean') c.open = false;
  if(c.x === undefined) c.x = null;
  if(c.y === undefined) c.y = null;
  return c;
}

/* ── the panel (built once, on first open) ── */
let _notesEls = null;
function notesEls(){
  if(_notesEls && document.body.contains(_notesEls.panel)) return _notesEls;
  const panel = document.createElement('div');
  panel.className = 'notes-panel';
  panel.id = 'notesPanel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="notes-head" id="notesHead">
      <button class="notes-mini" data-notes="new" title="New note"><i class="bi bi-plus-lg"></i></button>
      <button class="notes-mini" data-notes="close" title="Close"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="notes-body" id="notesBody"></div>`;
  document.body.appendChild(panel);
  _notesEls = {
    panel,
    head: panel.querySelector('#notesHead'),
    body: panel.querySelector('#notesBody')
  };
  return _notesEls;
}

const notesDelayedSave = (typeof debounce === 'function')
  ? debounce(function(){ save(); }, 700)
  : function(){ save(); };

let noteDrag = null;

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
          '<button class="notes-mini" data-note-del="' + i + '" title="Delete note"><i class="bi bi-trash"></i></button>' +
        '</div>' +
        '<input class="note-sub-inp" data-note-sub="' + i + '" value="' + esc(n.sub || '') + '" placeholder="Subtitle">' +
        '<textarea class="note-body-inp" data-note-body="' + i + '" placeholder="Note text…">' + esc(n.body || '') + '</textarea>' +
        '<div class="note-meta">' + when + '</div>' +
      '</div>';
  }).join('');
}


function notesPlace(){
  const el = notesEls();
  const c  = notesCfg();
  const vw = window.innerWidth, vh = window.innerHeight;
  const w  = el.panel.offsetWidth  || 340;
  const h  = el.panel.offsetHeight || 380;
  if(c.x == null) c.x = Math.max(12, vw - w - 24);
  if(c.y == null) c.y = 76;
  c.x = Math.max(8, Math.min(c.x, Math.max(8, vw - w - 8)));
  c.y = Math.max(52, Math.min(c.y, Math.max(52, vh - h - 8)));
  el.panel.style.left = c.x + 'px';
  el.panel.style.top  = c.y + 'px';
}

function notesShow(on){
  const el = notesEls();
  const c  = notesCfg();
    if(!isFinite(c.x)) c.x = null;
  if(!isFinite(c.y)) c.y = null;

  c.open = !!on;
  el.panel.hidden = !on;
  document.querySelectorAll('[data-act="notes-open"]').forEach(function(b){
    b.classList.toggle('active', !!on);
  });
  if(on){ notesRender(); notesPlace(); notesPlace(); }
  save();
}

function notesToggle(){ notesShow(!notesCfg().open); }
window.notesToggle = notesToggle;

/* Add a note. When the Notes page is on screen, refresh it as well. */
function notesNew(){
  const list = noteList();
  list.unshift({ id: uid(), title: '', body: '', created: Date.now() });
  save();
  notesRender();
  if(S.page === 'notes' && typeof goPage === 'function') goPage('notes');
  const first = notesEls().body.querySelector('.note-title-inp');
  if(first) first.focus();
}

function notesDelete(i){
  const list = noteList();
  if(!list[i]) return;
  if(!confirm('Delete "' + (list[i].title || 'this note') + '"? Cannot be undone.')) return;
  list.splice(i, 1);
  save();
  notesRender();
  /* the page's own markup carries stale indexes — re-render it if it's up */
  if(S.page === 'notes' && typeof goPage === 'function') goPage('notes');
  toast('Note deleted');
}

/* ── drag by the header ── */
(function notesDrag(){
  let drag = null;
  document.addEventListener('mousedown', function(e){
    const head = e.target.closest('#notesHead');
    if(!head || e.target.closest('button')) return;
    const r = notesEls().panel.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!drag) return;
    const c = notesCfg();
    c.x = e.clientX - drag.dx;
    c.y = e.clientY - drag.dy;
    notesPlace();
  });
  document.addEventListener('mouseup', function(){
    if(!drag) return;
    drag = null;
    document.body.style.userSelect = '';
    save();
  });
})();

/* ── drag a note to move it — live reorder + auto-scroll ── */
(function notesReorder(){
  let drag = null, raf = 0, lastY = 0;

  const idxAt = function(x, y){
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest('#notesBody .note-card');
    return c ? parseInt(c.dataset.noteIndex, 10) : -1;
  };

  function tick(){                      // keeps scrolling while you hold near an edge
    if(!drag){ raf = 0; return; }
    const body = notesEls().body;
    const r = body.getBoundingClientRect(), EDGE = 30, STEP = 8;
    if(lastY < r.top + EDGE) body.scrollTop -= STEP;
    else if(lastY > r.bottom - EDGE) body.scrollTop += STEP;
    raf = requestAnimationFrame(tick);
  }

  document.addEventListener('pointerdown', function(e){
    const grab = e.target.closest('[data-note-grab]');
    if(!grab) return;
    const card = grab.closest('.note-card');
    if(!card) return;
    drag = { i: parseInt(card.dataset.noteIndex, 10) };
    lastY = e.clientY;
    card.classList.add('is-dragging');
    if(!raf) raf = requestAnimationFrame(tick);
    e.preventDefault();
  });

  document.addEventListener('pointermove', function(e){
    if(!drag) return;
    lastY = e.clientY;                  // this is what makes it scroll
    const over = idxAt(e.clientX, e.clientY);
    if(over < 0 || over === drag.i) return;
    const list = noteList();
    list.splice(over, 0, list.splice(drag.i, 1)[0]);
    drag.i = over;
    save();
    notesRender();
    const card = document.querySelector('#notesBody .note-card[data-note-index="' + over + '"]');
    if(card) card.classList.add('is-dragging');
  });

  function done(){
    if(!drag) return;
    drag = null;
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    save();
    notesRender();
  }
  document.addEventListener('pointerup', done);
  document.addEventListener('pointercancel', done);
})();


/* ── wiring ── */
document.addEventListener('click', function(e){
  if(e.target.closest('[data-act="notes-open"]')){ e.preventDefault(); notesToggle(); return; }

  const hp = e.target.closest('[data-notes]');
  if(hp){
    e.preventDefault();
    if(hp.dataset.notes === 'close') notesShow(false);
    else if(hp.dataset.notes === 'new') notesNew();
    return;
  }

  const nb = e.target.closest('[data-act="add-note"]');
  if(nb){ e.preventDefault(); notesNew(); return; }
  
  const ren = e.target.closest('[data-note-rename]');
  if(ren){
    e.preventDefault();
    const i = ren.dataset.noteRename;
    const inp = document.querySelector('.note-title-inp[data-note-title="' + i + '"]');
    if(inp){ inp.focus(); inp.select(); }
    return;
  }

  const del = e.target.closest('[data-note-del]');
  if(del){ e.preventDefault(); notesDelete(parseInt(del.dataset.noteDel, 10)); return; }
}, true);

/* both the panel and the Notes page write through here */
document.addEventListener('input', function(e){
  const t = e.target;
  if(!t || !t.dataset) return;
  if(t.dataset.noteTitle !== undefined){
    const n = noteList()[parseInt(t.dataset.noteTitle, 10)];
    if(n){ n.title = t.value; notesDelayedSave(); }
    return;
  }
  if(t.dataset.noteSub !== undefined){
    const n = noteList()[parseInt(t.dataset.noteSub, 10)];
    if(n){ n.sub = t.value; notesDelayedSave(); }
    return;
  }
  if(t.dataset.noteBody !== undefined){
    const n = noteList()[parseInt(t.dataset.noteBody, 10)];
    if(n){ n.body = t.value; notesDelayedSave(); }
  }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && notesCfg().open && !$('modalRoot')?.classList.contains('open')) notesShow(false);
});

window.addEventListener('resize', function(){ if(notesCfg().open) notesPlace(); });

/* ═══ CARD DETAIL PANEL — one note or draft. Title · subtitle · font · size.
       No formatting toolbar, no chapter controls. ═══ */

/* ═══ FLOATING DETAIL PANEL — note or draft.
       Draft: title · font · size · body. Note: also subtitle.
       No formatting toolbar, no chapter controls. ═══ */

function cardList(kind){
  if(kind === 'draft'){
    const d = D();
    if(!Array.isArray(d.drafts)) d.drafts = [];
    return d.drafts;
  }
  return noteList();
}

let _ncEls = null, ncState = null;

function ncCfg(){
  if(!S.config.noteCardPanel || typeof S.config.noteCardPanel !== 'object') S.config.noteCardPanel = {};
  const c = S.config.noteCardPanel;
  if(typeof c.open !== 'boolean') c.open = false;
  if(c.x === undefined) c.x = null;
  if(c.y === undefined) c.y = null;
  return c;
}

const NC_SIZES = [12,13,14,15,16,18,20,22,24,28];

function ncEls(){
  if(_ncEls && document.body.contains(_ncEls.panel)) return _ncEls;
  const p = document.createElement('div');
  p.className = 'notecard-panel'; p.id = 'noteDetail'; p.hidden = true;
  p.innerHTML = `
    <div class="notecard-head" id="notecardHead">
      <span class="notecard-kind" id="ncKind">Draft</span>
      <span class="notecard-acts">
        <button class="notes-mini" data-nc="to-chapter" title="Send to a chapter"><i class="bi bi-box-arrow-in-right"></i></button>
        <button class="notes-mini" data-nc="del" title="Delete"><i class="bi bi-trash"></i></button>
        <button class="notes-mini" data-nc="close" title="Close"><i class="bi bi-trash"></i></button>
      </span>
    </div>
    <div class="notecard-body">
      <input class="notecard-title" id="ncTitle" placeholder="Title" autocomplete="off">
      <input class="notecard-sub" id="ncSub" placeholder="Subtitle" autocomplete="off">
      <div class="notecard-tools">
        <label class="notecard-tool">
          <i class="bi bi-fonts"></i>
          <select class="notecard-sel" id="ncFont">${(typeof FONTS !== 'undefined' ? FONTS : [])
            .map(f => `<option value="${esc(f.f)}">${esc(f.name)}</option>`).join('')}</select>
        </label>
        <label class="notecard-tool">
          <i class="bi bi-textarea-resize"></i>
          <select class="notecard-sel small" id="ncSize">${NC_SIZES
            .map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        </label>
      </div>
      <div class="notecard-text" id="ncText" contenteditable="true" spellcheck="true"></div>
    </div>
    <div class="notecard-foot"><span id="ncCount">0 words</span><span id="ncHint">Esc to close</span></div>`;
  document.body.appendChild(p);
  _ncEls = { panel:p, head:p.querySelector('#notecardHead'), kind:p.querySelector('#ncKind'),
    title:p.querySelector('#ncTitle'), sub:p.querySelector('#ncSub'),
    subRow:p.querySelector('#ncSub'), font:p.querySelector('#ncFont'), size:p.querySelector('#ncSize'),
    text:p.querySelector('#ncText'), count:p.querySelector('#ncCount') };
  const el = _ncEls;
  el.title.addEventListener('input', ncSaveNow);
  el.sub.addEventListener('input', ncSaveNow);
  el.text.addEventListener('input', function(){ ncPaint(); ncSaveNow(); });
  el.font.addEventListener('change', function(){ ncPaint(); ncSaveNow(); });
  el.size.addEventListener('change', function(){ ncPaint(); ncSaveNow(); });
  return _ncEls;
}

function ncPaint(){
  const el = ncEls();
  const fam = el.font.value || 'inherit';
  const px = parseInt(el.size.value, 10) || 14;
  el.text.style.fontFamily = fam;   el.text.style.fontSize = px + 'px';
  el.title.style.fontFamily = fam;
  const t = (el.text.innerText || '').trim();
  el.count.textContent = (t ? t.split(/\s+/).length : 0) + ' words';
}

function ncPlace(){
  const el = ncEls(), c = ncCfg();
  if(!isFinite(c.x)) c.x = null;
  if(!isFinite(c.y)) c.y = null;
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = el.panel.offsetWidth || 560, h = el.panel.offsetHeight || 520;
  if(c.x == null) c.x = Math.max(12, Math.round((vw - w) / 2));
  if(c.y == null) c.y = Math.max(52, Math.round((vh - h) / 2));
  c.x = Math.max(8, Math.min(c.x, Math.max(8, vw - w - 8)));
  c.y = Math.max(52, Math.min(c.y, Math.max(52, vh - h - 8)));
  el.panel.style.left = c.x + 'px';
  el.panel.style.top  = c.y + 'px';
}

function ncSaveNow(){
  if(!ncState) return;
  const el = ncEls();
  const n = cardList(ncState.kind)[ncState.i];
  if(!n) return;
  n.title = el.title.value;
  if(ncState.kind !== 'draft') n.sub = el.sub.value;
  else n.sub = n.sub || '';
  n.body = el.text.innerText;
  n.font = el.font.value;
  n.size = parseInt(el.size.value, 10) || 14;
  n.updated = Date.now();
  save();
}

function sfCardOpen(kind, i){
  if(!kind || isNaN(i) || i < 0) return;
  const n = cardList(kind)[i];
  if(!n) return;
  ncState = { kind:kind, i:i };
  ncCfg().open = true;
  const el = ncEls();
  el.panel.hidden = false;
  el.panel.dataset.kind = kind;
  el.kind.textContent = kind === 'draft' ? 'Draft' : 'Note';
  el.sub.style.display = kind === 'draft' ? 'none' : '';
  el.panel.querySelector('[data-nc="to-chapter"]').style.display = kind === 'draft' ? '' : 'none';

  el.title.value = n.title || '';
  el.sub.value   = n.sub   || '';
  el.text.textContent = n.body || '';

  const opts = Array.prototype.map.call(el.font.options, function(o){ return o.value; });
  el.font.value = (n.font && opts.indexOf(n.font) !== -1) ? n.font : (opts[0] || '');
  el.size.value = String(n.size || 14);
  if(!el.size.value) el.size.value = '14';

  ncPaint(); ncPlace(); ncPlace();
  try{ el.title.focus(); }catch(e){}
  save();
}
window.sfCardOpen = sfCardOpen;

function ncClose(){
  if(ncState) ncSaveNow();
  ncCfg().open = false; ncState = null;
  ncEls().panel.hidden = true;
  if(typeof renderNotes  === 'function') renderNotes();
  if(typeof renderDrafts === 'function') renderDrafts();
  save();
}

document.addEventListener('click', function(e){
  const tile = e.target.closest('[data-card-open]');
  if(tile){ e.preventDefault(); sfCardOpen(tile.dataset.cardOpen, parseInt(tile.dataset.cardI, 10)); return; }

  const b = e.target.closest('[data-nc]');
  if(!b) return;
  e.preventDefault();

  if(b.dataset.nc === 'close'){ ncClose(); return; }

  if(b.dataset.nc === 'to-chapter'){
    if(!ncState || ncState.kind !== 'draft') return;
    ncSaveNow();
    const d = cardList('draft')[ncState.i];
    if(!d) return;
    const ch = (typeof curCh === 'function') ? curCh() : null;
    if(!ch){ toast('Open a chapter first', 'warn'); return; }
    ch.content = (ch.content || '') + (d.body || '');
    toast(d.title ? ('“' + d.title + '” sent to ' + (ch.title || 'the chapter')) : 'Sent to the chapter');
    if(typeof onInput === 'function') onInput();
    save();
    return;
  }

  if(b.dataset.nc === 'del'){
    if(!ncState) return;
    const list = cardList(ncState.kind), n = list[ncState.i];
    if(!confirm('Delete "' + ((n && n.title) || ('this ' + ncState.kind)) + '"? Cannot be undone.')) return;
    list.splice(ncState.i, 1);
    ncState = null; ncCfg().open = false; ncEls().panel.hidden = true;
    save();
    if(typeof renderNotes  === 'function') renderNotes();
    if(typeof renderDrafts === 'function') renderDrafts();
    if(typeof toast === 'function') toast('Deleted');
  }
}, true);

(function ncDrag(){
  let drag = null;
  document.addEventListener('mousedown', function(e){
    const head = e.target.closest('#notecardHead');
    if(!head || e.target.closest('button')) return;
    const r = ncEls().panel.getBoundingClientRect();
    drag = { dx:e.clientX - r.left, dy:e.clientY - r.top };
    document.body.style.userSelect = 'none'; e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!drag) return;
    const c = ncCfg(); c.x = e.clientX - drag.dx; c.y = e.clientY - drag.dy; ncPlace();
  });
  document.addEventListener('mouseup', function(){
    if(!drag) return; drag = null; document.body.style.userSelect = ''; save();
  });
})();

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && ncState && !$('modalRoot')?.classList.contains('open')) ncClose();
});
window.addEventListener('resize', function(){ if(ncState) ncPlace(); });


/* ══════════ sounds.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Sound
   Master volume · typing clicks · generated ambience.
   Everything is synthesised with WebAudio, so there are no audio
   files to ship and it works offline.
   ═══════════════════════════════════════════════════════════ */

const SOUND = {};

SOUND.cfg = function(){
  if(!S.config.sound || typeof S.config.sound !== 'object')
    S.config.sound = { volume:.6, typing:false, typingVol:.35, ambience:null, ambVol:.45 };
  const c = S.config.sound;
  if(c.volume == null) c.volume = .6;
  if(c.typing == null) c.typing = false;
  if(c.typingVol == null) c.typingVol = .35;
  if(c.ambVol == null) c.ambVol = .45;
  if(c.ambience === undefined) c.ambience = null;
  return c;
};

SOUND.ctx = function(){
  if(!SOUND._ctx){
    const C = window.AudioContext || window.webkitAudioContext;
    if(!C) return null;
    SOUND._ctx = new C();
    SOUND._master = SOUND._ctx.createGain();
    SOUND._master.gain.value = SOUND.cfg().volume;
    SOUND._master.connect(SOUND._ctx.destination);
  }
  if(SOUND._ctx.state === 'suspended') SOUND._ctx.resume();
  return SOUND._ctx;
};

SOUND.volume = function(v){
  const c = SOUND.cfg();
  if(v != null) c.volume = Math.max(0, Math.min(1, v));
  if(SOUND._master) SOUND._master.gain.value = c.volume;
  return c.volume;
};

/* 2 s of noise — 'white' or 'brown' */
SOUND._noise = function(ctx, kind){
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for(let i = 0; i < len; i++){
    const w = Math.random() * 2 - 1;
    if(kind === 'brown'){ last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
    else d[i] = w * .5;
  }
  return buf;
};

/* ── typing click: a 25 ms filtered burst ── */
SOUND.click = function(){
  if(window.SF_VIEW) return;
  const ctx = SOUND.ctx(); if(!ctx) return;
  const c = SOUND.cfg();
  const src = ctx.createBufferSource(); src.buffer = SOUND._noise(ctx, 'white');
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.4;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002, c.typingVol * c.volume * .5), t + .004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + .045);
  src.connect(bp); bp.connect(g); g.connect(SOUND._master);
  src.start(t); src.stop(t + .06);
};

/* ── ambience: rain · wind · fire · cafe ── */
SOUND.AMBIENCE = ['Rain', 'Wind', 'Fire', 'Cafe'];

SOUND.stopAmbience = function(){
  if(!SOUND._amb) return;
  try{ SOUND._amb.src.stop(); }catch(e){}
  try{ SOUND._amb.gain.disconnect(); }catch(e){}
  if(SOUND._amb.timer) clearInterval(SOUND._amb.timer);
  SOUND._amb = null;
};

SOUND.ambience = function(name){
  SOUND.stopAmbience();
  SOUND.cfg().ambience = name || null;
  if(!name) return;
  const ctx = SOUND.ctx(); if(!ctx) return;

  const src = ctx.createBufferSource();
  src.buffer = SOUND._noise(ctx, name === 'Rain' ? 'white' : 'brown');
  src.loop = true;

  const filt = ctx.createBiquadFilter();
  if(name === 'Rain'){ filt.type = 'highpass'; filt.frequency.value = 900; }
  else if(name === 'Wind'){ filt.type = 'lowpass'; filt.frequency.value = 520; }
  else if(name === 'Fire'){ filt.type = 'lowpass'; filt.frequency.value = 1100; }
  else { filt.type = 'bandpass'; filt.frequency.value = 480; filt.Q.value = .7; }

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  src.connect(filt); filt.connect(gain); gain.connect(SOUND._master);
  src.start();

  const c = SOUND.cfg();
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, c.ambVol * .5), ctx.currentTime + 1.2);

  SOUND._amb = { src:src, gain:gain, name:name, timer:null };

  /* fire crackles · a slow swell for wind */
  if(name === 'Fire'){
    SOUND._amb.timer = setInterval(function(){
      if(!SOUND._amb || !SOUND._ctx) return;
      const t = SOUND._ctx.currentTime;
      const g2 = SOUND._ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(.08, t + .01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + .12);
      const o = SOUND._ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = 90 + Math.random() * 160;
      o.connect(g2); g2.connect(SOUND._master);
      o.start(t); o.stop(t + .14);
    }, 420);
  }
  if(name === 'Wind'){
    let up = true;
    SOUND._amb.timer = setInterval(function(){
      if(!SOUND._amb || !SOUND._ctx) return;
      const g = SOUND._amb.gain, t = SOUND._ctx.currentTime;
      up = !up;
      g.gain.exponentialRampToValueAtTime(up ? Math.max(.0002, c.ambVol * .6) : Math.max(.0002, c.ambVol * .28), t + 3);
    }, 3000);
  }
};

SOUND.ambVolume = function(v){
  const c = SOUND.cfg();
  if(v != null) c.ambVol = Math.max(0, Math.min(1, v));
  if(SOUND._amb && SOUND._ctx)
    SOUND._amb.gain.gain.exponentialRampToValueAtTime(Math.max(.0002, c.ambVol * .5), SOUND._ctx.currentTime + .3);
  return c.ambVol;
};

/* ── keystrokes in the editor ── */
document.addEventListener('keydown', function(e){
  const c = SOUND.cfg();
  if(!c.typing || window.SF_VIEW) return;
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  const inEd = t && (t.id === 'editor' || (t.closest && t.closest('#editor')));
  if(!inEd) return;
  if(e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ' || e.key.length === 1) SOUND.click();
}, true);

/* ═══ Settings tab ═══ */
function sndRow(label, sub, control){
  const r = document.createElement('div');
  r.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0;';
  r.innerHTML = '<div style="min-width:0"><div style="font-size:12.5px;color:var(--ink);">' + label +
    '</div><div style="font-size:10.5px;color:var(--ink-4);margin-top:2px;">' + sub + '</div></div>';
  r.appendChild(control);
  return r;
}
function sndToggle(id, get, set){
  const b = document.createElement('button');
  b.type = 'button'; b.id = id; b.className = 'tgl';
  const paint = () => b.classList.toggle('on', !!get());
  paint();
  b.addEventListener('click', function(){ set(!get()); paint(); save(); });
  return b;
}
function sndRange(val, set, w){
  const i = document.createElement('input');
  i.type = 'range'; i.min = 0; i.max = 100; i.value = Math.round(val() * 100);
  i.style.cssText = 'width:' + (w || 140) + 'px;';
  i.addEventListener('input', function(){ set(i.value / 100); });
  i.addEventListener('change', function(){ save(); });
  return i;
}

SETTINGS.renderers.sound = function(root){
  const c = SOUND.cfg();

  const c1 = card('Master', 'volume-up');
  c1.appendChild(sndRow('Volume', 'Applies to every sound in the app',
    sndRange(function(){ return c.volume; }, function(v){ c.volume = v; SOUND.volume(v); })));
  root.appendChild(c1);

  const c2 = card('Typing', 'keyboard');
  c2.appendChild(sndRow('Typing sound', 'A soft click for every keystroke',
    sndToggle('sndType', function(){ return c.typing; }, function(v){ c.typing = v; })));
  c2.appendChild(sndRow('Click volume', '', sndRange(function(){ return c.typingVol; },
    function(v){ c.typingVol = v; if(SOUND._master) SOUND.volume(c.volume); })));
  const test = document.createElement('button');
  test.className = 'btn btn-ghost'; test.style.marginTop = '10px';
  test.innerHTML = '<i class="bi bi-play-fill"></i> Test click';
  test.addEventListener('click', function(){ SOUND.click(); });
  c2.appendChild(test);
  root.appendChild(c2);
};

/* Ambience no longer has a control, so it is never resumed — a sound you
   couldn't switch off would be worse than one that resets on reload. */
(function(){ SOUND.stopAmbience(); })();

