/* ═══════════════════════════════════════════════════════════
   ScriptForge — the last pass

   Loaded after every other script, so its wrappers run after theirs.
   Six jobs:

     1 DARK, AND ONLY DARK     the app is dark. The Light mode that
                               themepack.js can paint is unreachable: the
                               stored preference is pinned to dark, the
                               mode can be set to nothing else, and a
                               light paint is undone the moment it lands.
     2 FONT SIZE               the number in Settings lands on every
                               writing surface, on the sample line under
                               the slider, and on nothing else. It is
                               re-applied after any repaint, so a page
                               that re-draws its editor cannot lose it.
     3 THE CANVAS MENU         Fit · Zoom in · Zoom out · Clear canvas —
                               the four things the canvas bar no longer
                               carries. They ride in the page's own
                               right-click list instead.
     4 NO BARE READOUTS        nothing in the canvas bar may show a number
                               — if a stale copy of the markup ever draws
                               the zoom readout again, the text comes off
                               it and the cluster is hidden.
     5 AI REMEMBERS THE BOOK   every AI request carries the project: the
                               title, the form, the structure, the Bible,
                               the beats, the drafts, and the text on
                               screen. Free keys included — there is no
                               server-side memory to lean on, so the
                               brief is sent with each request.
     6 NO MENU ON THE PAGE     the manuscript and the Script page are
                               writing surfaces: a right-click on the
                               text opens nothing at all — not the
                               app's element menu, not the browser's.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const cfg = function(){
    try{ if(typeof S !== 'undefined' && S.config) return S.config; }catch(e){}
    return null;
  };
  const saveCfg = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };
  const toastIt = function(msg, kind){ try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){} };
  const pageId = function(){ try{ return (typeof S !== 'undefined' && S.page) || ''; }catch(e){ return ''; } };
  const trim = function(s, n){
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const textOf = function(sel){
    try{
      const el = document.querySelector(sel);
      if(!el) return '';
      return trim(el.innerText || el.textContent || '', 1500);
    }catch(e){ return ''; }
  };

  /* ═══ 1 · DARK, AND ONLY DARK ═══
     themepack.js owns setThemeMode and the light palettes. This pins the
     mode to dark and re-paints if anything ever writes light back — a
     stored preference from an older build, a stale localStorage value, or
     a line of code that still asks for it. */
  const pinDark = function(){
    const c = cfg();
    if(!c) return;
    const was = c.themeMode;
    if(c.themeMode !== 'dark') c.themeMode = 'dark';
    let light = false;
    try{
      light = !!(document.body && document.body.getAttribute('data-theme-mode') === 'light');
    }catch(e){}
    /* a palette that was painted in light before this file ran is repainted
       dark — the app has one mode and it is the dark one */
    if(light || was === 'light'){
      try{ if(typeof applyThemeVars === 'function') applyThemeVars(c.theme || 'night'); }catch(e){}
    }
    try{
      if(document.body){
        if(document.body.getAttribute('data-theme-mode') !== 'dark') document.body.setAttribute('data-theme-mode', 'dark');
        if(document.documentElement && document.documentElement.style.colorScheme !== 'dark'){
          document.documentElement.style.colorScheme = 'dark';
        }
      }
    }catch(e){}
  };
  if(typeof window.setThemeMode === 'function'){
    const orig = window.setThemeMode;
    window.setThemeMode = function(){
      const c = cfg();
      if(c) c.themeMode = 'dark';
      const want = c ? (c.theme || 'night') : 'night';
      try{ if(typeof applyThemeVars === 'function') return applyThemeVars(want); }catch(e){}
      return orig.apply(this, arguments);
    };
  }
  if(typeof window.sfThemeMode === 'function'){
    window.sfThemeMode = function(){ return 'dark'; };
  }
  pinDark();
  /* and it stays that way: a late boot, a settings save or a stored value
     that arrives after this file is written over once more */
  setInterval(pinDark, 2000);

  /* ═══ 2 · FONT SIZE ═══
     One number, from Settings → Appearance (and the toolbar's own box, and
     Ctrl + / Ctrl −). Every writing surface reads it, and it is re-applied
     after a repaint so a page that rebuilds its editor cannot leave it
     behind. Nothing else in the app is touched by it. */
  const WRITING = ['#editor', '.write-doc', '.editor-doc', '.sf-split-doc', '.sf-split-editor',
                   '.fnt-doc', '.fnt-src', '.draft-doc'];

  /* half steps kept: the slider moves in .5, and rounding to whole pixels
     here made the number you picked (17.5) land as 18 — the control looked
     like it did nothing on the odd step. */
  const docSize = function(){
    const c = cfg();
    const raw = Number(c && c.fontSize);
    const n = Math.max(10, Math.min(60, (isFinite(raw) && raw > 0 ? raw : 17)));
    return Math.round(n * 2) / 2;
  };

  const applyDocSize = function(){
    const px = docSize();
    const val = px + 'px';
    try{
      document.documentElement.style.setProperty('--doc-size', val);
      if(document.body) document.body.style.setProperty('--doc-size', val);
    }catch(e){}
    /* one sweep, and each surface remembers which size it was given, so a
       repaint that changes nothing costs nothing */
    Array.prototype.forEach.call(document.querySelectorAll(WRITING.join(',')), function(el){
      if(el.dataset && el.dataset.sfDocPx === val) return;
      try{ el.dataset.sfDocPx = val; }catch(e){}
      el.style.fontSize = val;
    });
    /* the sample line under the slider, so the control can be seen working */
    Array.prototype.forEach.call(document.querySelectorAll('.font-size-sample'), function(el){
      el.style.fontFamily = 'var(--doc-font, inherit)';
      el.style.fontSize = val;
    });
    return px;
  };
  window.sfApplyDocSize = applyDocSize;

  let sizeTick = 0;
  const sizeSoon = function(){
    if(sizeTick) return;
    sizeTick = setTimeout(function(){ sizeTick = 0; applyDocSize(); }, 220);
  };

  /* the toolbar's box and the Settings slider both end up here */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;
    if(t.dataset.tb === 'fontSize'){ sizeSoon(); return; }
    if(t.closest && t.closest('.set-card') && t.type === 'range') sizeSoon();
  }, true);
  document.addEventListener('change', function(e){
    const t = e.target;
    if(t && t.dataset && t.dataset.tb === 'fontSize') sizeSoon();
  }, true);

  /* and after any repaint of a page, a modal or a panel */
  ['paintPage', 'goPage', 'renderToolbar', 'applyConfig', 'renderSetTab', 'setFontSize'].forEach(function(name){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfSize) return;
    const fn = function(){
      const r = orig.apply(this, arguments);
      try{ setTimeout(applyDocSize, 0); }catch(e){}
      return r;
    };
    fn.__sfSize = true;
    window[name] = fn;
  });

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(function(){ sizeSoon(); }).observe(document.body, { childList:true, subtree:true });
  }

  /* The T button's own panel (Outline, Kanban, Bible, Canvas — and the two
     writing pages) sets a per-page size, which those pages read from
     --pg-size. The manuscript and the script read the DOCUMENT size, so a
     size picked in the T panel there changed nothing: the two controls
     agree now — on a writing page the panel writes the one number the
     writing surfaces read, and Settings follows it. */
  if(typeof window.typoApply === 'function'){
    const origTypo = window.typoApply;
    window.typoApply = function(page, root){
      const r = origTypo.apply(this, arguments);
      try{
        if(String(page) === 'manuscript' || String(page) === 'script' || String(page) === 'write'){
          const t = (typeof typoGet === 'function') ? typoGet(page) : null;
          const c = cfg();
          if(t && t.size && (!c || Number(c.fontSize) !== Number(t.size))){
            if(c) c.fontSize = Math.max(10, Math.min(60, Number(t.size) || 17));
            saveCfg();
            setTimeout(applyDocSize, 0);
          }
        }
      }catch(e){}
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', applyDocSize);
  setTimeout(applyDocSize, 300);
  setTimeout(applyDocSize, 1200);

  /* ═══ 3 · THE CANVAS MENU ═══
     Fit, the two size steps and Clear — on the canvas bar (the magnifier
     and Clear, see mindmap.js) AND in the round button's right-click list,
     beside the three AI options the canvas already had (see polish.js:
     SF_FAB_AI.mindmap), so the writer can reach them from either. */
  const C = function(){ return window.sfCanvas || null; };
  const F = window.AI_FNS || (window.AI_FNS = {});
  F.canvasFit = function(){
    const c = C();
    if(c && c.fit) c.fit();
    else toastIt('Open the canvas first', 'warn');
  };
  F.canvasZoomIn = function(){
    const c = C();
    if(c && c.zoomIn) c.zoomIn(); else toastIt('Open the canvas first', 'warn');
  };
  F.canvasZoomOut = function(){
    const c = C();
    if(c && c.zoomOut) c.zoomOut(); else toastIt('Open the canvas first', 'warn');
  };
  F.canvasClear = function(){
    const c = C();
    if(c && c.clear) c.clear(); else toastIt('Open the canvas first', 'warn');
  };

  const CANVAS_EXTRA = [
    { fn:'canvasFit',     icon:'arrows-angle-contract', label:'Fit to screen',
      desc:'Frame every card in the view' },
    { fn:'canvasZoomIn',  icon:'zoom-in',               label:'Zoom in',
      desc:'Larger cards — or scroll the wheel over the canvas' },
    { fn:'canvasZoomOut', icon:'zoom-out',              label:'Zoom out',
      desc:'Smaller cards — or scroll the wheel over the canvas' },
    { fn:'canvasClear',   icon:'eraser',                label:'Clear canvas',
      desc:'Remove every card and link from this canvas' }
  ];
  try{
    if(typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI){
      /* polish.js gives the canvas its list under `canvas` (the same array
         as EXTRA.mindmap) while the page id is `mindmap`, so both keys have
         to point at ONE array — a second array would hide the three AI
         options the page already had. */
      let list = Array.isArray(SF_FAB_AI.canvas) ? SF_FAB_AI.canvas
               : (Array.isArray(SF_FAB_AI.mindmap) ? SF_FAB_AI.mindmap : null);
      if(!list) list = [];
      CANVAS_EXTRA.forEach(function(o){
        if(!list.some(function(x){ return x.fn === o.fn; })) list.push(o);
      });
      SF_FAB_AI.canvas = list;
      SF_FAB_AI.mindmap = list;
    }
  }catch(e){}

  /* ═══ 4 · NO BARE READOUTS ═══
     The canvas bar draws no number: the magnifier button is the whole of
     the zoom cluster on the bar, and its popup is three labelled commands.
     If a stale copy of the markup ever puts a readout back — on the bar or
     inside the popup — the text comes off it, because a readout that says
     “NaN” is never right. The MARKUP itself is left alone: the buttons
     come back as soon as one is found (mindmap.js draws them). */
  const cleanCanvasBar = function(){
    const head = document.querySelector('#page-mindmap .mm-head');
    if(!head) return;
    Array.prototype.forEach.call(head.querySelectorAll('[data-mm="zoom-label"], .mm-zoom'), function(el){
      const txt = String(el.textContent || '');
      /* only a write that changes something: assigning the same text again
         would be a mutation of its own, and the observer above would call
         this back for ever */
      if(txt && !/^\s*\d+(\.\d+)?\s*%?\s*$/.test(txt) && txt !== '') el.textContent = '';
      if(!el.hidden) el.hidden = true;
    });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(cleanCanvasBar).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', function(){ setTimeout(cleanCanvasBar, 0); }, true);
  cleanCanvasBar();

  /* ═══ 4b · THE LAST VISIBLE TOOLBAR GROUP ═══
     The divider between two groups is the group's own right edge, so the
     LAST group must not draw one. `:last-child` is not enough: a hidden
     group, or a button that is not a group, can sit after the last real
     one, and the hairline is left hanging at the end of the row — a line
     where no line belongs. The last visible group is marked here, and
     final-fix.css answers the mark. */
  const tbEdges = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('.write-toolbar, .toolbar, .tb, .fnt-bar, .sf-bar, .page-head'),
      function(bar){
        /* only the groups that are actually on screen: a hidden group is
           still a child, and marking IT as last would leave the hairline
           hanging off the end of the group the writer can see. */
        const groups = Array.prototype.filter.call(bar.children, function(c){
          if(!c || !c.classList || !c.classList.contains('tb-group')) return false;
          if(c.hidden) return false;
          try{ return c.getClientRects().length > 0; }catch(e){ return true; }
        });
        Array.prototype.forEach.call(bar.children, function(c){
          if(!c || !c.classList || !c.classList.contains('tb-group')) return;
          const last = (groups[groups.length - 1] === c);
          if(c.classList.contains('sf-tb-last') !== last) c.classList.toggle('sf-tb-last', last);
        });
      }
    );
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(tbEdges).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', function(){ setTimeout(tbEdges, 0); }, true);
  window.addEventListener('resize', tbEdges);
  tbEdges();

  /* ═══ 5 · AI REMEMBERS THE BOOK ═══
     A free API key has no server-side memory: the only way the assistant
     knows the book on the Draft page is if the book is sent with the
     request. So every callAI carries it — the brief the app already builds
     (title, form, structure, Bible, beats, current section) plus what is
     on the page you are actually looking at. */
  const pageContext = function(){
    const out = [];
    let name = pageId();
    try{
      if(typeof PAGE_META === 'object' && PAGE_META[name] && PAGE_META[name].name) name = PAGE_META[name].name + ' (' + name + ')';
    }catch(e){}
    out.push('PAGE THE WRITER IS ON: ' + name);

    /* The drafts are NOT listed here any more: the project brief carries
       them, with their prose, in reading order (context-fix.js). Saying it
       in two places only spent the same budget twice. */

    if(pageId() === 'mindmap' || pageId() === 'canvas'){
      try{
        const proj = (typeof kbProj === 'function') ? kbProj() : null;
        const d = (typeof D === 'function') ? D() : null;
        const st = (proj && proj.mindmap) || (d && d.mindmap) || null;
        if(st && Array.isArray(st.nodes) && st.nodes.length){
          out.push('CANVAS CARDS:\n' + st.nodes.slice(0, 24).map(function(n, i){
            return (i + 1) + '. ' + trim(n.text || 'untitled', 90);
          }).join('\n'));
        }
      }catch(e){}
    }

    /* the text on the page the writer is looking at */
    const onScreen = textOf('#page-' + pageId() + ' #editor') ||
                     textOf('#page-' + pageId() + ' .write-doc') ||
                     textOf('#page-' + pageId() + ' .editor-doc');
    if(onScreen) out.push('WHAT IS ON SCREEN:\n' + onScreen);
    return out.join('\n\n');
  };

  const memoryBlock = function(){
    let brief = '';
    try{ if(typeof window.sfProjectBrief === 'function') brief = String(window.sfProjectBrief() || ''); }catch(e){}
    let ctx = '';
    try{ ctx = pageContext(); }catch(e){}
    const head = 'PROJECT MEMORY — the whole book, whatever page this is:\n';
    if(!brief && !ctx) return '';
    return (head + (brief ? brief + '\n\n' : '') + ctx).slice(0, 7000);
  };
  window.sfProjectMemory = memoryBlock;

  if(typeof window.callAI === 'function'){
    const orig = window.callAI;
    window.callAI = function(prompt){
      let p = String(prompt == null ? '' : prompt);
      try{
        /* “TITLE: ” is the first line of the brief; if it is already in the
           prompt the caller attached the project itself and this would only
           send it twice */
        if(p.indexOf('TITLE: ') < 0){
          const mem = memoryBlock();
          if(mem) p = mem + '\n\n' + p;
        }else if(p.indexOf('PAGE THE WRITER IS ON:') < 0){
          const ctx = pageContext();
          if(ctx) p = 'PROJECT MEMORY (context):\n' + ctx + '\n\n' + p;
        }
      }catch(e){}
      return orig.call(this, p);
    };
  }

  /* ═══ 5b · AND EVERY OTHER AI CALL GOES THROUGH THE SAME DOOR ═══
     The Draft page's chat does not use callAI at all — it has its own
     request builder (chatCallAI in draft-chat.js), which is exactly the
     place a writer types “continue chapter 3” and gets an answer about
     nothing. Both builders end at fetch() on the same two endpoints, so the
     project is attached there as well: one door, every caller, nothing to
     remember to do when a new AI button is added.

     A request that already carries the block is left alone — the marker
     below is what says so — so nothing is ever sent twice. */
  const MEM_MARK = 'PROJECT MEMORY';

  const attachMemoryToBody = function(body){
    let obj = null;
    try{ obj = JSON.parse(body); }catch(e){ return null; }
    if(!obj || typeof obj !== 'object') return null;

    /* the text to grow, and a way to write it back where it came from */
    let text = null, write = null;
    const part = function(p){
      if(typeof p !== 'string') return false;
      text = p; write = function(v){ return v; };
      return true;
    };
    if(Array.isArray(obj.messages) && obj.messages.length){
      const m = obj.messages[obj.messages.length - 1];
      if(m && typeof m.content === 'string'){ if(part(m.content)) write = function(v){ m.content = v; }; }
      else if(m && Array.isArray(m.content)){
        const t = m.content.filter(function(x){ return x && x.type === 'text'; })[0];
        if(t && part(t.text)) write = function(v){ t.text = v; };
      }
    }else if(Array.isArray(obj.contents) && obj.contents[0] && Array.isArray(obj.contents[0].parts)){
      const t = obj.contents[0].parts.filter(function(x){ return x && typeof x.text === 'string'; })[0];
      if(t && part(t.text)) write = function(v){ t.text = v; };
    }
    if(text == null || typeof text !== 'string') return null;
    if(text.indexOf(MEM_MARK) >= 0) return null;

    let mem = '';
    try{ mem = memoryBlock(); }catch(e){ mem = ''; }
    if(!mem) return null;
    write(mem + '\n\n' + text);
    try{ return JSON.stringify(obj); }catch(e){ return null; }
  };

  const AI_URL = /(chat\/completions|:generateContent|:streamGenerateContent)/;
  if(typeof window.fetch === 'function' && !window.fetch.__sfMemory){
    const origFetch = window.fetch;
    const withMemory = function(input, init){
      try{
        const url = (typeof input === 'string') ? input
                  : ((input && typeof input.url === 'string') ? input.url : '');
        const method = (init && init.method) ? String(init.method).toUpperCase()
                     : ((input && input.method) ? String(input.method).toUpperCase() : 'GET');
        if(url && AI_URL.test(url) && method === 'POST' && init && typeof init.body === 'string'){
          const grown = attachMemoryToBody(init.body);
          /* a copy: the caller's own options object is never mutated */
          if(grown) init = Object.assign({}, init, { body: grown });
        }
      }catch(e){}
      return origFetch.call(this, input, init);
    };
    withMemory.__sfMemory = true;
    window.fetch = withMemory;
  }

  /* ═══ 6 · THE EDITOR HAS NO RIGHT-CLICK ═══
     The manuscript and the Script page are writing surfaces: a right-click
     on the text opens nothing.

     write.js binds its own element menu to the editor, split.js binds the
     same menu to the split editor, and a dozen sheets bind document-level
     menus as well; suppressing the key anywhere after the fact means the
     menu has already been drawn. So this listener is on `window` in the
     CAPTURE phase — it runs before every `document` listener, and before
     the editor's own — and settles the keystroke once: the app's menu
     never opens, and the browser's menu does not either, so the page stays
     the page.

     Two things it must not touch: the round button's right-click, which is
     the AI assistant on an element of its own, and the canvas's right-click
     list (job 3 above), which is a card surface and not the editor. */
  const EDITOR_SURFACE = '#editor, .write-canvas, .fnt-src, .fnt-src-pane';
  window.addEventListener('contextmenu', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    /* the surface first — it is what the key is about */
    if(!t.closest(EDITOR_SURFACE)) return;
    /* and the writing pages only, so a canvas card or a reader that happens
       to carry one of the classes keeps its own menu */
    try{ if(typeof isWritingPage === 'function' && !isWritingPage()) return; }catch(err){}
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
})();
