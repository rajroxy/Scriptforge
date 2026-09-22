/* ═══════════════════════════════════════════════════════════
   ScriptForge — Overlay screen · Split screen
   One pane, two presentations, both keeping a page, the dashboard or a
   player open while you write:

     · Split screen — the plain, always-available version. The pane is
       docked to the right edge as a real column of the app grid, so the
       editor shrinks to sit beside it. Drag the edge to resize.
     · Overlay screen — the floating version (Settings → Experimental).
       Drag it by its header, resize it from the corner grip, and it
       remembers where you left it.

   Each pane loads the app in a read-only view (?sfView=1), so a pane can
   never write over the document open in the main window.
   ═══════════════════════════════════════════════════════════ */

const OVERLAY_PLAYERS = [
  { id:'music', label:'Music player' },
  { id:'video', label:'Video player' }
];

function overlayCfg(){
  if(!S.config.overlay || typeof S.config.overlay !== 'object'){
    S.config.overlay = { open:false, page:'home', x:null, y:null, w:640, h:420 };
  }
  const o = S.config.overlay;
  if(typeof o.open !== 'boolean') o.open = false;
  /* the pane always starts on the dashboard when the app loads — the source
     you last picked is a session choice, not a remembered one */
  if(!window.__ovlPageInit){
    window.__ovlPageInit = true;
    o.page = 'home';
    o.hist = ['home'];
    o.hidx = 0;
  }
  if(!o.page) o.page = 'home';
  if(o.w == null) o.w = 640;
  if(o.h == null) o.h = 420;
  if(o.x === undefined) o.x = null;
  if(o.y === undefined) o.y = null;
  // back / forward history — the same idea as a browser's
  if(!Array.isArray(o.hist) || !o.hist.length || o.hist.indexOf(o.page) === -1) o.hist = [o.page];
  if(typeof o.hidx !== 'number' || o.hidx < 0 || o.hidx >= o.hist.length) o.hidx = o.hist.length - 1;
  return o;
}

/* A readable name for every page a pane can host. Most ids carry their name
   in PAGE_META; the extra mode pages below only exist in the page list, so
   they get a proper label here instead of showing a raw id. */
const OVERLAY_LABELS = {
  write:'Editor', read:'Reader', draft:'Draft', notes:'Notes', plan:'Plan',
  board:'Board', timeline:'Timeline', cast:'Characters', research:'Research',
  dictionary:'Dictionary', canvas:'Canvas', inspire:'Inspiration',
  notebook:'Book', format:'Formatting', import:'Import',
  chapters:'Chapters', characters:'Characters', arcs:'Arcs', scenes:'Scenes',
  beatsheet:'Beat sheet', shots:'Shot list', episodes:'Episodes',
  seasonarc:'Season arc', acts:'Acts', blocking:'Blocking', cues:'Cues',
};
function overlayLabel(id){
  const meta = window.PAGE_META || {};
  if(window.pname) return pname(id);
  if(meta[id] && meta[id].name) return meta[id].name;
  if(OVERLAY_LABELS[id]) return OVERLAY_LABELS[id];
  return String(id).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* Everything that can be shown in a pane: the universal pages, the pages of
   the mode you're writing in, then the two players. */
function overlaySources(){
  const out = [], seen = {};
  const push = (id, label) => {
    if(!id || seen[id]) return;
    seen[id] = 1;
    out.push({ id, label: label || overlayLabel(id) });
  };
  ['home', 'stats', 'overview', 'reader'].forEach(id => push(id));
  let pages = [];
  try{ pages = (typeof modePages === 'function') ? modePages() : []; }catch(e){ pages = []; }
  pages.forEach(id => push(id));
  OVERLAY_PLAYERS.forEach(p => push('player:' + p.id, p.label));
  return out;
}

function overlayUrl(src){
  let href = location.href;
  try{
    const u = new URL(href);
    const q = new URLSearchParams('sfView=1');
    if(String(src).indexOf('player:') === 0) q.set('sfPanel', String(src).slice(7));
    else q.set('sfPage', String(src));
    u.search = '?' + q.toString();
    u.hash = '';
    return u.href;
  }catch(e){
    return href.split('?')[0] + '?sfView=1&sfPage=' + encodeURIComponent(String(src).replace('player:', ''));
  }
}

function overlayEls(){
  return {
    wrap:  document.getElementById('ovlWrap'),
    panel: document.getElementById('ovlPanel'),
    head:  document.getElementById('ovlHead'),
    title: document.getElementById('ovlTitle'),
    sel:   document.getElementById('ovlSource'),
    frame: document.getElementById('ovlFrame'),
    grip:  document.getElementById('ovlGrip'),
    edge:  document.getElementById('ovlEdge'),
    back:  document.querySelector('[data-ovl="back"]'),
    fwd:   document.querySelector('[data-ovl="fwd"]')
  };
}

function overlayFillSources(){
  const el = overlayEls();
  if(!el.sel) return;
  const o = overlayCfg();
  const srcs = overlaySources();
  el.sel.innerHTML = srcs.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
  if(srcs.some(s => s.id === o.page)) el.sel.value = o.page;
  else o.page = el.sel.value = (srcs[0] ? srcs[0].id : 'home');
}

function overlayTitleFor(src){
  const el = overlayEls();
  if(el.sel){
    const opt = Array.prototype.slice.call(el.sel.options).find(x => x.value === src);
    if(opt) return opt.textContent;
  }
  const p = OVERLAY_PLAYERS.find(x => 'player:' + x.id === src);
  return p ? p.label : overlayLabel(src);
}

/* Back / forward only light up when there is somewhere to go */
function overlayPaintNav(){
  const el = overlayEls();
  const o = overlayCfg();
  if(el.back) el.back.disabled = o.hidx <= 0;
  if(el.fwd)  el.fwd.disabled  = o.hidx >= o.hist.length - 1;
}

/* Paint the selected source (used on open and on Reload) */
function overlayLoad(){
  const el = overlayEls();
  const o = overlayCfg();
  if(!el.frame) return;
  if(el.sel && el.sel.value) o.page = el.sel.value;
  el.frame.src = overlayUrl(o.page);
  if(el.title) el.title.textContent = overlayTitleFor(o.page);
  overlayPaintNav();
}

/* Navigate the pane — push a new entry unless we're stepping through history */
function overlayGo(src, push){
  const o = overlayCfg();
  if(!src) return;
  if(push !== false){
    o.hist = o.hist.slice(0, o.hidx + 1);
    if(o.hist[o.hist.length - 1] !== src) o.hist.push(src);
    o.hidx = o.hist.length - 1;
  }
  o.page = src;
  const el = overlayEls();
  if(el.sel && Array.prototype.slice.call(el.sel.options).some(x => x.value === src)) el.sel.value = src;
  overlayLoad();
  save();
}

function overlayStep(delta){
  const o = overlayCfg();
  const i = o.hidx + delta;
  if(i < 0 || i >= o.hist.length) return;
  o.hidx = i;
  overlayGo(o.hist[i], false);
}

/* The pane told us it navigated on its own (a click inside it). Record the
   move without reloading it, so Back and Forward follow what you actually saw. */
function overlayRecord(src){
  const o = overlayCfg();
  const el = overlayEls();
  if(!src || src === o.page) return;
  o.hist = o.hist.slice(0, o.hidx + 1);
  o.hist.push(src);
  o.hidx = o.hist.length - 1;
  o.page = src;
    if(el.sel) el.sel.value = src;
  if(el.title) el.title.textContent = overlayTitleFor(src);
  overlayPaintNav();
  save();
}

window.overlayGo = overlayGo;

window.addEventListener('message', e => {
  try{
    if(e.origin !== location.origin) return;
    if(!sfOverlayMessageIsFromPane(e)) return;

    const d = e.data;
    if(!d || !d.sf) return;

    /* ── Text edit from overlay pane ── */
    if(d.sf === 'edit'){
      if(typeof d.mode !== 'string') return;
      if(typeof d.projectId !== 'string') return;
      if(typeof d.chapterId !== 'string') return;
      if(typeof d.html !== 'string') return;

      /*
        Safety guard:
        never let the overlay overwrite the same mode + project
        currently being edited by the main window.
      */
      if(
        d.mode === String(S.mode) &&
        d.projectId === String(D().currentProject || '')
      ){
        return;
      }

      /* Do not load or switch modes in the parent. */
      const modeData = S.modes && S.modes[d.mode];
      if(!modeData) return;

      const project = (modeData.projects || [])
        .find(p => String(p.id) === d.projectId);

      /* Unknown/stale project ID. */
      if(!project || !Array.isArray(project.chapters)) return;

      const chapter = sfOverlayFindChapter(
        project.chapters,
        d.chapterId
      );

      /* Unknown/stale chapter ID. */
      if(!chapter) return;

      chapter.content = d.html;
      project.updated = Date.now();

      /*
        save() writes the parent's complete S.modes object.
        It does not reload the iframe and does not post a message back.
      */
      save();
      return;
    }

    /* ── New/rename/delete section from overlay pane ── */
    if(d.sf === 'structure'){
      if(typeof d.mode !== 'string') return;
      if(typeof d.projectId !== 'string') return;
      if(!Array.isArray(d.chapters)) return;

      /*
        Apply structure only when it is a different mode/project.
        Same mode + project is intentionally protected from conflicts.
      */
      if(
        d.mode === String(S.mode) &&
        d.projectId === String(D().currentProject || '')
      ){
        return;
      }

      const modeData = S.modes && S.modes[d.mode];
      if(!modeData) return;

      const project = (modeData.projects || [])
        .find(p => String(p.id) === d.projectId);

      if(!project) return;

      const chapters = JSON.parse(JSON.stringify(d.chapters));
      project.chapters = chapters;

      /*
        If that mode already has this project selected internally,
        keep its working chapter list synchronized too.
      */
      if(String(modeData.currentProject || '') === d.projectId){
        modeData.chapters = project.chapters;
      }

      project.updated = Date.now();
      save();
      return;
    }

    /* ── Existing pane navigation relay ── */
    if(d.sf === 'nav' && d.page){
      overlayRecord(String(d.page));
    }
  }catch(err){
    console.warn('[overlay relay]', err);
  }
});


function sfOverlayFindChapter(list, id){
  for(const ch of (list || [])){
    if(!ch) continue;
    if(String(ch.id) === String(id)) return ch;

    const nested = sfOverlayFindChapter(ch.children, id);
    if(nested) return nested;
  }

  return null;
}

function sfOverlayMessageIsFromPane(e){
  const frame = overlayEls().frame;
  return !!(
    frame &&
    e.source === frame.contentWindow &&
    overlayCfg().open
  );
}


function overlayClamp(){
  const o = overlayCfg();
  const vw = window.innerWidth, vh = window.innerHeight;
  o.w = Math.max(300, Math.min(o.w || 640, Math.max(300, vw - 24)));
  o.h = Math.max(200, Math.min(o.h || 420, Math.max(200, vh - 24)));
  if(o.x == null) o.x = Math.max(12, vw - o.w - 28);
  if(o.y == null) o.y = 84;
  o.x = Math.max(6, Math.min(o.x, Math.max(6, vw - o.w - 6)));
    o.y = Math.max(6, Math.min(o.y, Math.max(6, vh - o.h - 6)));
  return o;
}

/* ── Split screen ─────────────────────────────────────────────
   The docked iframe split is gone — the writing split is split.js.
   The pane is always the floating overlay now. */
function overlayIsSplit(){ return false; }

function splitCfg(){
  if(!S.config.split || typeof S.config.split !== 'object') S.config.split = { w:420 };
  const s = S.config.split;
  if(s.w == null) s.w = 420;
  return s;
}

/* Keep the docked column sane: wide enough to read, always leaving the
   editor a workable strip of its own. */
function splitClampW(){
  const s = splitCfg();
  const vw = window.innerWidth;
  const max = Math.max(280, Math.min(760, vw - 380));
  s.w = Math.max(280, Math.min(s.w || 420, max));
  return s.w;
}

function overlayApplyMode(){
  const el = overlayEls();
  if(el.wrap)  el.wrap.classList.remove('ovl-docked');
  if(el.panel) el.panel.classList.remove('ovl-docked');
  if(el.grip)  el.grip.title = 'Drag to resize';
  document.body.classList.remove('split-open');
}


function overlayGeometry(){
  const el = overlayEls();
  if(!el.panel) return;
  if(overlayIsSplit()){
    // the app grid places the docked column — no floating geometry at all
    overlayApplyMode();
    el.panel.style.left = el.panel.style.top = '';
    el.panel.style.width = el.panel.style.height = '';
    return;
  }
  const o = overlayClamp();
  el.panel.style.left   = o.x + 'px';
  el.panel.style.top    = o.y + 'px';
  el.panel.style.width  = o.w + 'px';
  el.panel.style.height = o.h + 'px';
}
window.overlayApplyMode = overlayApplyMode;

function overlayShow(on, mode){
  const el = overlayEls();
  const o = overlayCfg();
  if(mode) o.mode = mode;

  o.open = !!on;
  el.wrap.hidden = !on;
  overlayApplyMode();
  document.body.classList.toggle('overlay-open', !!on);
  if(on){
    overlayFillSources();
    overlayGeometry();
    const opts = el.sel ? Array.prototype.slice.call(el.sel.options) : [];
    if(el.sel && opts.some(x => x.value === o.page)) el.sel.value = o.page;
    if(o.hist[o.hidx] !== o.page){ o.hist = [o.page]; o.hidx = 0; }
    overlayLoad();
  } else if(el.frame){
    el.frame.src = 'about:blank';            // stop the pane's timers/audio
  }
  save();
}

function overlayToggle(){ overlayShow(!overlayCfg().open); }
window.overlayToggle = overlayToggle;
window.overlayShow   = overlayShow;

// ═══ Drag by the header, resize from the corner grip ═══
(function overlayMove(){
  const el = overlayEls();
  if(!el.panel) return;
  let mode = null, sx = 0, sy = 0, ox = 0, oy = 0, ow = 0, oh = 0;

  function start(kind, e){
    if(e.button != null && e.button !== 0) return;
    if(kind === 'move' && e.target.closest('button, select, input')) return;
    if(kind === 'move' && overlayIsSplit()) return;      // a docked column doesn't move
    const o = overlayClamp();
    mode = kind;
    sx = e.clientX; sy = e.clientY;
    ox = o.x; oy = o.y; oh = o.h;
    ow = overlayIsSplit() ? splitCfg().w : o.w;
    document.body.classList.add('ovl-dragging');
    e.preventDefault();
  }

  function move(e){
    if(!mode) return;
    const o = overlayCfg();
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if(mode === 'move'){
      o.x = ox + dx;
      o.y = oy + dy;
    } else if(overlayIsSplit()){
      splitCfg().w = ow - dx;      // drag the edge left to widen the split
    } else if(mode === 'width'){
      o.w = ow + dx;                       // the right-hand edge: width only
    } else {
      o.w = ow + dx;
      o.h = oh + dy;
    }
    overlayGeometry();
    e.preventDefault();
  }

  function end(){
    if(!mode) return;
    mode = null;
    document.body.classList.remove('ovl-dragging');
    save();
  }

  if(el.head) el.head.addEventListener('mousedown', e => start('move', e));
  if(el.grip) el.grip.addEventListener('mousedown', e => start('size', e));
  if(el.edge) el.edge.addEventListener('mousedown', e => start('width', e));
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  window.addEventListener('resize', () => { if(overlayCfg().open) overlayGeometry(); });
})();

/* What the pane is really showing. The pane is the same origin, so its own
   S.page is the truth — a click inside the pane moves it without telling
   o.page, and a swap must trade places with the page you can actually see. */
function overlayPanePage(){
  const o = overlayCfg();
  let page = o.page;
  try{
    const frame = overlayEls().frame;
    const w = frame && frame.contentWindow;
    const live = w && w.S && w.S.page;
    if(live) page = String(live);
  }catch(e){ /* the pane may still be loading — o.page is the fallback */ }
  return page;
}

function overlaySwap(){
  const panePage = overlayPanePage();
  const mainPage = S.page;
  if(!panePage || String(panePage).indexOf('player:') === 0){
    if(typeof toast === 'function') toast('The pane is on a player — swap works with pages', 'warn');
    return;
  }
  if(panePage === mainPage){
    if(typeof toast === 'function') toast('The pane is already on ' + overlayTitleFor(mainPage));
    return;
  }
  if(typeof goPage !== 'function') return;

  /* the pane takes what the app had; the app takes what the pane had */
  overlayGo(mainPage);
  goPage(panePage);
  save();
  if(typeof toast === 'function') toast('Swapped — ' + overlayTitleFor(panePage) + ' is on the app screen');
}

// ═══ Wiring ═══
document.addEventListener('click', e => {
  if(e.target.closest('[data-act="overlay-open"]')){
    e.preventDefault();
    overlayToggle();
    return;
  }

  if(e.target.closest('[data-act="split-open"]')){
    e.preventDefault();
    if(window.ScriptForgeSplit) window.ScriptForgeSplit.toggle();
    return;
  }

  const btn = e.target.closest('[data-ovl]');
  if(!btn) return;
  const act = btn.dataset.ovl;
  const el = overlayEls();
  if(act === 'close'){ e.preventDefault(); overlayShow(false); return; }
  if(act === 'home'){ e.preventDefault(); overlayGo('home'); return; }
  if(act === 'back'){ e.preventDefault(); overlayStep(-1); return; }
  if(act === 'fwd'){  e.preventDefault(); overlayStep(1);  return; }
  if(act === 'reload'){
    e.preventDefault();
    if(el.frame) el.frame.src = overlayUrl(overlayCfg().page);
    return;
  }
  if(act === 'popout'){
    e.preventDefault();
    window.open(overlayUrl(overlayCfg().page), '_blank', 'noopener');
    return;
  }
  if(act === 'swap'){ e.preventDefault(); overlaySwap(); return; }
}, true);


document.addEventListener('change', e => {
  if(e.target && e.target.id === 'ovlSource') overlayGo(e.target.value);
});

/* Seat the pane in whichever mode the experimental flag asks for, before it
   is ever opened — the toolbar button and the docked width follow from it. */
(function overlayBoot(){
  const run = () => { try{ overlayApplyMode(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
