/* ═══════════════════════════════════════════════════════════
   utils.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · overlay.js
     · utils.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ overlay.js ══════════ */
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

  /* The pane opens tucked under the top bar, a touch higher than it used
     to: it reads as part of the app rather than something dropped on it.
     A position saved by an older build is lifted once, so an existing
     pane moves up with it instead of staying where it was left. */
  if(o.y != null && !S.config.ovlLift){
    S.config.ovlLift = true;
    o.y = o.y - 26;
  }
  /* a second, smaller lift: the pane now opens right under the top bar, over
     the top of the page rather than level with its heading. A pane left at
     the older height is raised once, so nobody has to drag it. */
  if(o.y != null && !S.config.ovlLift2){
    S.config.ovlLift2 = true;
    o.y = o.y - 20;
  }

  o.w = Math.max(300, Math.min(o.w || 640, Math.max(300, vw - 24)));
  o.h = Math.max(200, Math.min(o.h || 420, Math.max(200, vh - 24)));
  if(o.x == null) o.x = Math.max(12, vw - o.w - 28);
  if(o.y == null) o.y = 48;
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


/* ══════════ utils.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Utilities
   A small popup of everyday apps, grouped into tabs and opened from
   the editor toolbar:
     Time    · Clock · Stopwatch · Sprint timer
     Plan    · Calendar · Word goal
     Text    · Word counter · Case converter
     Numbers · Calculator · Unit converter · Random picker
   ═══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   STORY TYPE — what kind of writing this is

   The writer works in registers the mainstream does not: tragedy,
   avant-garde, the emotional rather than the commercial. This is the
   vocabulary for saying so, once, and having every AI request carry it.
   The choice is a list (pick as many as apply) and lives in
   S.config.storyTypes.

   Nothing here suggests a fix or a rewrite: the note that travels with
   the prompt tells the model to keep the work in the writer's own
   register instead of steering it toward a conventional shape.
   ══════════════════════════════════════════════════════════════ */
const SF_STORY_TYPES = [
  { id:'unconventional', label:'Unconventional',  note:'outside the mainstream on purpose' },
  { id:'tragedy',        label:'Tragedy',         note:'no rescue, the fall is the point' },
  { id:'avantgarde',     label:'Avant-garde',     note:'form first — break it deliberately' },
  { id:'experimental',   label:'Experimental',    note:'the structure itself is an argument' },
  { id:'emotional',      label:'Emotional',       note:'feeling over plot mechanics' },
  { id:'melancholy',     label:'Melancholy',      note:'quiet, elegiac, unresolved' },
  { id:'surreal',        label:'Surreal',         note:'dream logic, not literal sense' },
  { id:'absurdist',      label:'Absurdist',       note:'meaning withheld on purpose' },
  { id:'metafiction',    label:'Metafiction',     note:'the writing knows it is writing' },
  { id:'psychological',  label:'Psychological',   note:'interior life is the plot' },
  { id:'stream',         label:'Stream of consciousness', note:'thought as it happens' },
  { id:'minimalist',     label:'Minimalist',      note:'spare, unadorned' },
  { id:'fragmentary',    label:'Fragmentary',     note:'pieces, not a whole arc' },
  { id:'gothic',         label:'Gothic',          note:'decay, dread, inheritance' },
  { id:'noir',           label:'Noir',            note:'doomed and moral' },
  { id:'mythic',         label:'Mythic / fable',  note:'older than the novel' },
  { id:'darkcomedy',     label:'Dark comedy',     note:'funny and unforgiving' },
  { id:'body',           label:'Visceral / body horror', note:'uncomfortable on purpose' },
  { id:'philosophical',  label:'Philosophical',   note:'an idea argued through people' },
  { id:'slowburn',       label:'Slow burn',       note:'withheld, patient' },
  { id:'domestic',       label:'Domestic realism', note:'small rooms, real stakes' },
  { id:'speculative',    label:'Speculative / slipstream', note:'one step sideways from now' },
  { id:'magical',        label:'Magical realism', note:'the impossible treated as ordinary' },
  { id:'literary',       label:'Literary',        note:'sentence as the instrument' },
  { id:'dystopia',       label:'Dystopia',        note:'a system that has already won' },
  { id:'postapoc',       label:'Post-apocalyptic',note:'what is left after the end' },
  { id:'uncanny',        label:'Uncanny',         note:'familiar, and wrong' },
  { id:'liminal',        label:'Liminal',         note:'thresholds and waiting rooms' },
  { id:'antinovel',      label:'Anti-novel',      note:'refuses the arc on purpose' },
  { id:'autofiction',    label:'Autofiction',     note:'the self, slightly rearranged' },
  { id:'epistolary',     label:'Epistolary',      note:'documents, letters, fragments' },
  { id:'hysterical',     label:'Hysterical realism', note:'too much world, too many facts' },
  { id:'elegiac',        label:'Elegiac',         note:'mourning as the mode' },
  { id:'workingclass',   label:'Working class',   note:'labour, money, exhaustion' },
  { id:'folkloric',      label:'Folkloric',       note:'told aloud, not written' },
  { id:'harrowing',      label:'Harrowing',       note:'unbearable, and meant to be' },
  { id:'quiet',          label:'Quiet / nothing happens', note:'the drama is entirely interior' }
];
window.SF_STORY_TYPES = SF_STORY_TYPES;

function sfStoryTypes(){ return Array.isArray(window.SF_STORY_TYPES) ? window.SF_STORY_TYPES : []; }
function sfStoryChosen(){
  const on = (S && S.config && Array.isArray(S.config.storyTypes)) ? S.config.storyTypes : [];
  const known = {};
  sfStoryTypes().forEach(function(t){ known[t.id] = t; });
  return on.filter(function(id){ return !!known[id]; });
}
function sfStoryToggle(id){
  if(!S.config) S.config = {};
  if(!Array.isArray(S.config.storyTypes)) S.config.storyTypes = [];
  const list = S.config.storyTypes;
  const i = list.indexOf(id);
  if(i < 0) list.push(id); else list.splice(i, 1);
  if(typeof save === 'function') save();
  return i < 0;
}

/* the lines every AI request carries — see callAI() in ai.js and compose()
   in draft-chat.js. Plain text, because it is a prompt. */
function sfStoryStyleLine(){
  const ids = sfStoryChosen();
  if(!ids.length) return '';
  const byId = {};
  sfStoryTypes().forEach(function(t){ byId[t.id] = t; });
  const named = ids.map(function(id){
    const t = byId[id];
    return t.label + (t.note ? ' (' + t.note + ')' : '');
  }).join('; ');
  return 'WHAT THE WRITER IS WRITING — their own register, chosen deliberately: ' + named + '.\n' +
    'Write inside that register and take it seriously. Do not push the work toward a conventional, '
    + 'commercial or mainstream shape, do not "fix" what is unconventional about it, and do not offer '
    + 'to make it more accessible unless the writer asks. If a request is a translation, transliteration '
    + 'or a lookup, ignore this paragraph and answer it faithfully.';
}
window.sfStoryStyleLine = sfStoryStyleLine;
window.sfStoryChosen = sfStoryChosen;
window.sfStoryToggle = sfStoryToggle;

/* the same chips in Settings → AI and in the draft chat's Assistant panel */
function sfStoryChips(){
  const wrap = document.createElement('div');
  wrap.className = 'sf-story-chips';
  const chosen = sfStoryChosen();
  sfStoryTypes().forEach(function(t){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sf-story-chip' + (chosen.indexOf(t.id) >= 0 ? ' on' : '');
    b.dataset.storyType = t.id;
    b.title = t.note || '';
    b.textContent = t.label;
    wrap.appendChild(b);
  });
  wrap.addEventListener('click', function(e){
    const b = e.target.closest('[data-story-type]');
    if(!b) return;
    e.preventDefault();
    const on = sfStoryToggle(b.dataset.storyType);
    b.classList.toggle('on', on);
    if(typeof toast === 'function') toast(on ? b.textContent + ' added to your story type' : b.textContent + ' removed');
  });
  return wrap;
}
window.sfStoryChips = sfStoryChips;

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
            { id:'caseconv', label:'Case converter', icon:'text-capitalize' },
            { id:'repeat',   label:'Repeated words', icon:'arrow-repeat' } ] },
  { id:'draft', label:'Draft', icon:'pencil-square',
    tools:[ { id:'names',    label:'Name generator', icon:'person-vcard' } ] },
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

/* ── Calendar — a month of days: the days you opened the app, the days you
   pinned, and every project's target date. Click a day to pin it; give a
   project a target and it shows on the day it is due. ── */
UTIL_TOOLS.calendar = function(host){
  const log = S.config.openLog || {};
  const keyOf = dt => (typeof dayKey === 'function' ? dayKey(dt) : dt.toDateString());

  /* pinned dates — a session-transcending list of day keys */
  const pins = function(){
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.pinnedDates)) S.config.pinnedDates = [];
    return S.config.pinnedDates;
  };
  const isPinned = k => pins().indexOf(k) >= 0;
  const togglePin = function(k){
    const list = pins(), i = list.indexOf(k);
    if(i >= 0){ list.splice(i, 1); if(typeof toast === 'function') toast('Unpinned ' + k); }
    else { list.push(k); list.sort(); if(typeof toast === 'function') toast('Pinned ' + k); }
    if(typeof save === 'function') save();
  };

  /* every project that carries a target date */
  const projects = function(){
    const d = (typeof D === 'function') ? D() : {};
    return (d.projects || []).filter(function(p){ return p && p.id; });
  };
  const withTarget = () => projects().filter(function(p){ return p.targetDate; })
                                   .sort(function(a, b){ return String(a.targetDate).localeCompare(String(b.targetDate)); });
  const targetsOn = k => withTarget().filter(function(p){ return p.targetDate === k; });

  const todayKey = keyOf(new Date());
  let view = new Date();
  view.setDate(1);
  let picked = '';   /* the project chosen in the target row */

  host.innerHTML = `
    <div class="util-cal-head">
      <button class="util-btn" data-cal="-1" title="Previous month"><i class="bi bi-chevron-left"></i></button>
      <span class="util-cal-month" id="utilCalMonth"></span>
      <span class="util-spacer"></span>
      <button class="util-btn" data-cal="today">Today</button>
      <button class="util-btn" data-cal="1" title="Next month"><i class="bi bi-chevron-right"></i></button>
    </div>
    <div class="util-cal-grid" id="utilCalGrid"></div>
    <div class="util-cal-keys">
      <span><i class="bi bi-circle-fill"></i> opened</span>
      <span><i class="bi bi-pin-angle-fill"></i> pinned</span>
      <span><i class="bi bi-bullseye"></i> project target</span>
    </div>
    <div class="util-cal-sec">
      <div class="util-cal-sec-head"><i class="bi bi-bullseye"></i> Project targets</div>
      <div class="util-cal-set" id="utilCalSet"></div>
      <div class="util-cal-list" id="utilCalTargets"></div>
    </div>
    <div class="util-cal-sec">
      <div class="util-cal-sec-head"><i class="bi bi-pin-angle"></i> Pinned dates</div>
      <div class="util-cal-list" id="utilCalPins"></div>
    </div>`;

  const monthEl  = host.querySelector('#utilCalMonth');
  const gridEl   = host.querySelector('#utilCalGrid');
  const setEl    = host.querySelector('#utilCalSet');
  const targEl   = host.querySelector('#utilCalTargets');
  const pinEl    = host.querySelector('#utilCalPins');

  const niceDate = function(k){
    const parts = String(k).split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return isNaN(dt.getTime()) ? k : dt.toLocaleDateString([], { day:'numeric', month:'short', year:'numeric' });
  };
  const daysTo = function(k){
    const parts = String(k).split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return Math.round((dt - new Date(todayKey.split('-')[0], todayKey.split('-')[1] - 1, todayKey.split('-')[2])) / 86400000);
  };

  function paintGrid(){
    const y = view.getFullYear(), m = view.getMonth();
    monthEl.textContent = view.toLocaleDateString([], { month:'long', year:'numeric' });

    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;   // Monday first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();

    let html = ['M','T','W','T','F','S','S']
      .map(d => '<div class="util-cal-dow">' + d + '</div>').join('');

    for(let i = startDow - 1; i >= 0; i--){
      html += '<div class="util-cal-day dim">' + (prevDays - i) + '</div>';
    }
    for(let d = 1; d <= daysInMonth; d++){
      const dt = new Date(y, m, d);
      const k  = keyOf(dt);
      const opened = !!log[k];
      const pin    = isPinned(k);
      const tgs    = targetsOn(k);
      let cls = 'util-cal-day' + (k === todayKey ? ' today' : '')
              + (opened ? ' on' : '') + (pin ? ' pin' : '') + (tgs.length ? ' target' : '');
      const bits = [dt.toLocaleDateString([], { weekday:'long', day:'numeric', month:'long' })];
      if(opened) bits.push('opened');
      if(pin) bits.push('pinned');
      tgs.forEach(function(p){ bits.push('target: ' + p.name + (p.targetLabel ? ' — ' + p.targetLabel : '')); });
      html += '<button type="button" class="' + cls + '" data-cal-pin="' + k + '" title="' + esc(bits.join(' · ')) + '">' + d + '</button>';
    }
    const pad = (7 - ((startDow + daysInMonth) % 7)) % 7;
    for(let i = 1; i <= pad; i++) html += '<div class="util-cal-day dim">' + i + '</div>';

    gridEl.innerHTML = html;
  }

  function paintSet(){
    const list = projects();
    if(!picked || !list.some(function(p){ return p.id === picked; })) picked = (list[0] && list[0].id) || '';
    setEl.innerHTML =
      '<select class="util-inp" data-cal-proj>' +
        (list.length
          ? list.map(function(p){
              const cur = p.targetDate ? '  ·  ' + niceDate(p.targetDate) : '';
              return '<option value="' + esc(p.id) + '"' + (p.id === picked ? ' selected' : '') + '>' + esc(p.name || 'Untitled') + cur + '</option>';
            }).join('')
          : '<option value="">No projects yet</option>') +
      '</select>' +
      '<input class="util-inp" type="date" data-cal-date value="' + (todayKey) + '">' +
      '<button class="util-btn primary" data-cal-set="1" title="Give this project a target date"><i class="bi bi-bullseye"></i> Set target</button>';
  }

  function paintTargets(){
    const list = withTarget();
    targEl.innerHTML = list.length
      ? list.map(function(p){
          const k = p.targetDate, diff = daysTo(k);
          const when = diff === 0 ? 'today' : (diff > 0 ? 'in ' + diff + ' day' + (diff === 1 ? '' : 's') : Math.abs(diff) + ' day' + (diff === -1 ? '' : 's') + ' ago');
          return '<div class="util-cal-row' + (k === todayKey ? ' is-today' : '') + '">' +
              '<span class="util-cal-row-name"><i class="bi bi-bullseye"></i>' + esc(p.name || 'Untitled') + '</span>' +
              '<span class="util-cal-row-when">' + esc(niceDate(k)) + ' · ' + when + '</span>' +
              '<button class="util-btn" data-cal-clear="' + esc(p.id) + '" title="Clear this target"><i class="bi bi-x-lg"></i></button>' +
            '</div>';
        }).join('')
      : '<div class="util-note">No project has a target date yet. Pick one above.</div>';
  }

  function paintPins(){
    const list = pins().slice().sort();
    pinEl.innerHTML = list.length
      ? list.map(function(k){
          const diff = daysTo(k);
          const when = diff === 0 ? 'today' : (diff > 0 ? 'in ' + diff + 'd' : Math.abs(diff) + 'd ago');
          return '<div class="util-cal-row' + (k === todayKey ? ' is-today' : '') + '">' +
              '<span class="util-cal-row-name"><i class="bi bi-pin-angle-fill"></i>' + esc(niceDate(k)) + '</span>' +
              '<span class="util-cal-row-when">' + when + '</span>' +
              '<button class="util-btn" data-cal-unpin="' + k + '" title="Unpin"><i class="bi bi-x-lg"></i></button>' +
            '</div>';
        }).join('')
      : '<div class="util-note">Click any day above to pin it — a deadline, a submission, a birthday.</div>';
  }

  function paint(){ paintGrid(); paintSet(); paintTargets(); paintPins(); }

  /* keep the project select in step with what is chosen */
  host.addEventListener('change', function(e){
    const s = e.target.closest('[data-cal-proj]');
    if(s) picked = s.value;
  });

  host.addEventListener('click', function(e){
    const t = e.target;

    const day = t.closest('[data-cal-pin]');
    if(day){ togglePin(day.dataset.calPin); paint(); return; }

    const unpin = t.closest('[data-cal-unpin]');
    if(unpin){ togglePin(unpin.dataset.calUnpin); paint(); return; }

    const clear = t.closest('[data-cal-clear]');
    if(clear){
      const p = projects().filter(function(x){ return x.id === clear.dataset.calClear; })[0];
      if(p){ delete p.targetDate; if(typeof save === 'function') save(); if(typeof toast === 'function') toast('Target cleared'); }
      paint();
      return;
    }

    const set = t.closest('[data-cal-set]');
    if(set){
      const sel   = host.querySelector('[data-cal-proj]');
      const dateEl= host.querySelector('[data-cal-date]');
      const id    = sel && sel.value;
      const k     = dateEl && dateEl.value;
      const p     = projects().filter(function(x){ return x.id === id; })[0];
      if(!p){ toast('Pick a project first', 'warn'); return; }
      if(!k){ toast('Pick a date first', 'warn'); return; }
      p.targetDate = k;
      if(!p.targetLabel) p.targetLabel = '';
      if(typeof save === 'function') save();
      if(typeof toast === 'function') toast((p.name || 'Project') + ' → ' + niceDate(k));
      paint();
      return;
    }

    const b = t.closest('[data-cal]');
    if(!b) return;
    if(b.dataset.cal === 'today'){ view = new Date(); view.setDate(1); }
    else view.setMonth(view.getMonth() + parseInt(b.dataset.cal, 10));
    paintGrid();
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

/* ── Repeated words — the words a draft leans on too hard ── */
UTIL_TOOLS.repeat = function(host){
  const STOP = ('the a an and or but of to in on at for with is was were be been being it its it’s that this these those '
    + 'he she they them his her their you your i me my we our as by from not no so if then than there here what which who '
    + 'when where why how all any both each few more most other some such only own same too very can will just don should now')
    .split(' ');
  const stop = {};
  STOP.forEach(function(w){ stop[w] = 1; });

  host.innerHTML = `
    <div class="util-row" style="gap:6px;margin-bottom:8px;">
      <button class="util-btn primary" data-rep="editor"><i class="bi bi-file-text"></i> Scan the editor</button>
      <button class="util-btn" data-rep="sel"><i class="bi bi-textarea-t"></i> Scan the selection</button>
    </div>
    <div class="util-row" style="gap:6px;margin-bottom:8px;">
      <select class="util-inp" data-rep-min>
        <option value="4">4+ times</option>
        <option value="6" selected>6+ times</option>
        <option value="10">10+ times</option>
        <option value="15">15+ times</option>
      </select>
      <select class="util-inp" data-rep-len>
        <option value="3">3+ letters</option>
        <option value="5" selected>5+ letters</option>
        <option value="7">7+ letters</option>
      </select>
    </div>
    <div class="util-note" style="margin-bottom:6px;">The words below repeat a lot — a clue that a sentence can be tightened.</div>
    <div id="utilRepOut" class="util-rep"></div>`;

  const out = host.querySelector('#utilRepOut');

  const source = function(which){
    if(which === 'sel'){
      try{ return String(window.getSelection() || ''); }catch(e){ return ''; }
    }
    const ed = document.getElementById('editor');
    return ed ? (ed.innerText || ed.textContent || '') : '';
  };

  const scan = function(which){
    const text = source(which);
    if(!text.trim()){ out.innerHTML = '<div class="util-note">Nothing to scan — write or select some text first.</div>'; return; }
    const min = parseInt((host.querySelector('[data-rep-min]') || {}).value || '6', 10);
    const len = parseInt((host.querySelector('[data-rep-len]') || {}).value || '5', 10);

    const counts = {};
    (text.toLowerCase().match(/[a-zà-ÿ’'-]+/g) || []).forEach(function(w){
      const t = w.replace(/^[’'-]+|[’'-]+$/g, '');
      if(t.length < len || stop[t]) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    const rows = Object.keys(counts).filter(function(w){ return counts[w] >= min; })
      .sort(function(a, b){ return counts[b] - counts[a] || a.localeCompare(b); })
      .slice(0, 60);

    const words = (text.trim().match(/\S+/g) || []).length;
    if(!rows.length){
      out.innerHTML = '<div class="util-note">No word repeats ' + min + '+ times in ' + words.toLocaleString() + ' words. Clean.</div>';
      return;
    }
    out.innerHTML = '<div class="util-rep-head">' + rows.length + ' words in ' + words.toLocaleString() + ' words</div>'
      + rows.map(function(w){
          const pct = Math.round((counts[w] / words) * 10000) / 100;
          return '<button type="button" class="util-rep-row" data-rep-find="' + esc(w) + '" title="Count every match in the text">'
            + '<span>' + esc(w) + '</span>'
            + '<span class="util-rep-bar"><i style="width:' + Math.min(100, Math.max(6, pct * 12)) + '%"></i></span>'
            + '<span class="util-rep-n">' + counts[w] + '×</span>'
            + '</button>';
        }).join('');
  };

  host.addEventListener('click', function(e){
    const row = e.target.closest('[data-rep]');
    if(row){ scan(row.dataset.rep); return; }
    const find = e.target.closest('[data-rep-find]');
    if(!find) return;
    const word = find.dataset.repFind;
    const ed = document.getElementById('editor');
    if(!ed) return;
    const text = ed.innerText || '';
    const hits = (text.match(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')) || []).length;
    if(typeof toast === 'function') toast('“' + word + '” appears ' + hits + '×');
  });

  scan('editor');
};

/* ── Name generator — names for people and places, built offline ── */
UTIL_TOOLS.names = function(host){
  const GIVEN = {
    english: ['Ada','Bram','Clara','Dorian','Edith','Felix','Greta','Hugo','Iris','Jonas','Kira','Lorne','Mira','Nell','Otto','Perrin','Quinn','Rosalind','Soren','Tamsin','Ulric','Vesna','Wren','Yara'],
    indian:  ['Aarav','Anaya','Bhavesh','Chitra','Devika','Ishaan','Jaya','Kabir','Leela','Mihir','Naina','Omkar','Priya','Rohan','Sanya','Tejas','Uma','Varun','Yash','Zoya'],
    slavic:  ['Aleksy','Bohdan','Cveta','Dragan','Elena','Fyodor','Goran','Ivana','Katarina','Luka','Milena','Nikolai','Oksana','Petar','Radka','Svetlana','Tomas','Vera','Zoran'],
    japanese:['Akari','Daichi','Emi','Haruki','Isamu','Jun','Kaede','Kenji','Mio','Nao','Ren','Sakura','Takeshi','Yui']
  };
  const FAMILY = {
    english: ['Ashcroft','Bellamy','Carrow','Dunmore','Ellery','Fairweather','Grimshaw','Hollis','Ives','Larkspur','Merrick','Norwood','Pemberton','Quill','Ravenscroft','Thorne'],
    indian:  ['Agarwal','Bhatt','Chatterjee','Deshmukh','Iyer','Joshi','Kapoor','Mehta','Nair','Patel','Rao','Sharma','Singh','Verma'],
    slavic:  ['Andric','Baranov','Chernov','Dragunov','Filipovic','Horvat','Ivanov','Kovac','Morozov','Novak','Petrovic','Sokolov','Vasiliev'],
    japanese:['Aoki','Fujimoto','Hasegawa','Ishikawa','Kobayashi','Matsuda','Nakamura','Okada','Sato','Takahashi','Yamamoto']
  };
  const PLACES = {
    A: ['Ash','Amber','Arden','Alder'],  B: ['Brack','Brindle','Black','Bramble'],
    C: ['Cold','Cinder','Crane','Copper'], D: ['Dun','Duskmere','Drake','Dove'],
    E: ['Ever','Ember','Elm','Elder'], F: ['Fen','Frost','Fallow','Fox'],
    G: ['Grey','Gale','Granite','Glass'], H: ['Harrow','Hollow','Hazel','Hearth'],
    I: ['Iron','Ivy','Isle','Ink'], J: ['Juniper','Jade','Jarrow','Jet'],
    K: ['Kestrel','Kite','Kell','Karrow'], L: ['Lark','Lantern','Low','Linden'],
    M: ['Marrow','Mist','Moss','Mill'], N: ['Nettle','North','Night','Nook'],
    O: ['Oak','Orin','Owl','Ochre'], P: ['Pine','Pike','Pell','Pyre'],
    Q: ['Quarry','Quill','Quiet','Quest'], R: ['Rook','Rush','Ridge','Raven'],
    S: ['Salt','Storm','Slate','Sparrow'], T: ['Thorn','Tide','Tallow','Tarn'],
    U: ['Umber','Ulla','Und','Ursa'], V: ['Vale','Vesper','Vine','Voss'],
    W: ['Willow','Wick','Winter','Wold'], X: ['Xan','Xero','Xis','Xul'],
    Y: ['Yew','Yarn','Yarrow','Yonder'], Z: ['Zephyr','Zinc','Zora','Zell']
  };
  const PLACE_SUF = ['field','ford','gate','hall','haven','hold','mere','moor','port','reach','ridge','stead','stone','vale','wick','wood'];
  const TITLE = ['Captain','Doctor','Father','Lady','Lord','Major','Mother','Sergeant','Sister','Widow','Master','Madam'];
  const EPITHET = ['the Quiet','the Younger','the Unready','of the Marsh','the Grey','Twice-Born','the Kind','the Last','who Waits','the Bright'];

  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  let culture = 'english';

  host.innerHTML = `
    <div class="util-row" style="gap:6px;margin-bottom:8px;">
      <select class="util-inp" data-nm-culture>
        <option value="english">English</option>
        <option value="indian">Indian</option>
        <option value="slavic">Slavic</option>
        <option value="japanese">Japanese</option>
      </select>
      <button class="util-btn primary" data-nm="person"><i class="bi bi-person"></i> Person</button>
      <button class="util-btn" data-nm="place"><i class="bi bi-geo-alt"></i> Place</button>
      <button class="util-btn" data-nm="title"><i class="bi bi-award"></i> Title</button>
    </div>
    <div class="util-note" style="margin-bottom:6px;">Click a name to copy it. Everything is generated on this machine.</div>
    <div id="utilNmOut" class="util-rep"></div>`;

  const out = host.querySelector('#utilNmOut');

  const person = function(){
    const g = pickOne(GIVEN[culture]), f = pickOne(FAMILY[culture]);
    let n = g + ' ' + f;
    if(Math.random() < 0.18) n = pickOne(TITLE) + ' ' + n;
    if(Math.random() < 0.16) n = n + ' ' + pickOne(EPITHET);
    return n;
  };
  const place = function(){
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const head = pickOne(PLACES[letter] || PLACES.A);
    return Math.random() < 0.5 ? cap(head) + pickOne(PLACE_SUF) : cap(head) + ' ' + pickOne(['Cross','Bay','Hill','Row','End','Bridge','Court','Green']);
  };

  const fill = function(kind){
    const rows = [];
    for(let i = 0; i < 12; i++) rows.push(kind === 'place' ? place() : (kind === 'title' ? pickOne(TITLE) + ' ' + person() : person()));
    out.innerHTML = rows.map(function(n){
      return '<button type="button" class="util-rep-row" data-nm-copy="' + esc(n) + '" title="Copy">'
        + '<span>' + esc(n) + '</span><span class="util-rep-n"><i class="bi bi-clipboard"></i></span></button>';
    }).join('');
  };

  host.addEventListener('change', function(e){
    const s = e.target.closest('[data-nm-culture]');
    if(s){ culture = s.value; fill('person'); }
  });

  host.addEventListener('click', function(e){
    const b = e.target.closest('[data-nm]');
    if(b){ fill(b.dataset.nm); return; }
    const copy = e.target.closest('[data-nm-copy]');
    if(copy){
      const txt = copy.dataset.nmCopy;
      const copyText = (typeof window.copyText === 'function') ? window.copyText : null;
      if(copyText) copyText(txt);
      else { try{ navigator.clipboard.writeText(txt); }catch(x){} }
      if(typeof toast === 'function') toast('Copied “' + txt + '”');
    }
  });

  fill('person');
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

