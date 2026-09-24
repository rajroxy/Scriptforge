/* ═══════════════════════════════════════════════════════════
   final-fix.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · fab-fix.js
     · context-fix.js
     · final-fix.js
     · font-pack.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ fab-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the round button's menus, corrected

   Loaded after pages-fix.js and polish.js, so everything it changes is
   theirs to change and it only has to say what is different:

     1 NAMES BY FORM    the Outline page names its units the way the form
                        does — a novel has chapters and subchapters, a
                        screenplay has scenes and sub-scenes — and its four
                        naming jobs keep two pairs apart: the TITLE jobs
                        name a section, the DESCRIPTION jobs say what the
                        section is for.

     2 THE PLAN BOARD   "Beat ideas" is "Beat the board": it fills the board
                        you are looking at with the beats it is missing.

     3 TEXT & LANGUAGE  the writing actions and Translate are on every page
                        now: the round button's right-click opens the
                        manuscript's own panel wherever it is asked, so
                        nothing takes the Text or the Language section off a
                        page any more.

     4 WHICH PAGE       the two outline jobs know which page and which form
                        they were asked from, so a screenplay gets scenes.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const F  = function(){ return window.AI_FNS || (window.AI_FNS = {}); };
  const modeId = function(){
    try{ if(S.mode) return S.mode; }catch(e){}
    try{ return document.body.getAttribute('data-writing-mode') || 'novel'; }catch(e){}
    return 'novel';
  };
  /* the form that writes in scenes rather than chapters */
  const isScreenplay = function(){
    return ['screenplay', 'tv', 'stage', 'script'].indexOf(modeId()) >= 0;
  };
  /* the pages whose unit is a SCENE in the form's own language */
  const units = function(){
    if(isScreenplay()) return { one:'Scene', many:'Scenes', sub:'Sub-scene', subs:'Sub-scenes' };
    return { one:'Chapter', many:'Chapters', sub:'Subchapter', subs:'Subchapters' };
  };

  /* ═══ 1 · NAMES BY FORM ═══
     SF_FAB_AI is the app's own table and the option objects inside it are
     plain objects, so its labels are re-written in place on every render —
     no second copy of the menu to drift out of step. */
  const relabel = function(){
    let table = null;
    try{ table = SF_FAB_AI; }catch(e){ table = null; }
    if(!table) return;
    const u = units();

    /* ── outline ──
       Four naming jobs, two pairs: the titles NAME a section and the
       descriptions say what it is FOR. Each pair takes the form's own word
       — Chapter/Subchapter in a novel, Scene/Sub-scene in a screenplay —
       so a screenplay is never offered “Chapter titles” and a novel is
       never offered “Scene description”. */
    if(Array.isArray(table.outline)){
      table.outline.forEach(function(o){
        if(!o || !o.fn) return;
        if(o.fn === 'olChapterTitles'){
          o.label = u.one + ' titles';
          o.desc  = 'A name for every ' + u.one.toLowerCase() + ', from your outline';
        }else if(o.fn === 'olSubTitles'){
          o.label = u.sub + ' titles';
          o.desc  = 'A name for every ' + u.sub.toLowerCase();
        }else if(o.fn === 'olChapterSubs'){
          o.label = u.one + ' description';
          o.desc  = 'Describe what every ' + u.one.toLowerCase() + ' covers, from your outline';
        }else if(o.fn === 'olSubSubs'){
          o.label = u.sub + ' description';
          o.desc  = 'Describe what happens in each ' + u.sub.toLowerCase();
        }else if(o.fn === 'olStructure'){
          o.desc = 'Is the ' + u.one.toLowerCase() + ' order working? What should move?';
        }
      });
    }

    /* ── plan ── */
    if(Array.isArray(table.plan)){
      table.plan.forEach(function(o){
        if(!o || o.fn !== 'planBeats') return;
        o.label = 'Beat the board';
        o.desc  = 'Fill this board — the beats it is still missing, in order';
      });
    }
  };

  /* ═══ 3 · TEXT & LANGUAGE ═══
     Nothing is taken off a page any more. The round button's right-click is
     the manuscript's own panel wherever it opens (polish.js), so the Text
     section and Translate are meant to be there on every page; the trim that
     used to remove them from the plan board, the Bible, the canvas and the
     board is gone with the page-specific menus it belonged to. */

  /* ── wrap the renderer ── */
  if(typeof window.renderFabAI === 'function'){
    const orig = window.renderFabAI;
    const wrapped = function(){
      relabel();
      return orig.apply(this, arguments);
    };
    window.renderFabAI = wrapped;
  }

  document.addEventListener('DOMContentLoaded', relabel);
  relabel();

  /* ═══ 4 · THE TWO DESCRIPTION JOBS ═══
     A title and a description are not the same job, and the app keeps both:
     the title jobs NAME a section, the description jobs say what it is FOR.
     What went wrong before was that the description was hung on the title
     jobs — “Chapter description” where “Chapter titles” had been — so the
     writer lost the naming job and, in the right-click menu, pressed a
     button that said “Chapter titles” and got prose back.

     These two functions are the DESCRIPTION side, in the form's own words
     and with the project in front of them. They are put on olChapterSubs
     and olSubSubs — the pair outline-menu.js adds under each title job —
     and the title jobs are left alone: olChapterTitles and olSubTitles stay
     pages-fix.js's own, which return names and nothing else. */
  const brief = function(){
    try{ return (typeof sfProjectBrief === 'function') ? sfProjectBrief() : ''; }catch(e){ return ''; }
  };
  const ask = function(title, sub, prompt){
    try{
      if(typeof sfAsk === 'function') return sfAsk(title, sub, prompt);
    }catch(e){}
  };

  const olChapter = function(){
    const u = units();
    ask(u.one + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: write a short DESCRIPTION of what each ' + u.one.toLowerCase() +
      ' covers, one per ' + u.one.toLowerCase() + ' listed in the structure above.\n' +
      'Rules:\n' +
      '- Two or three sentences each: what happens, and what it is for in the whole.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where the outline is still empty for a ' + u.one.toLowerCase() + ', write "not yet planned" and nothing more.\n' +
      '- No titles, no numbering of your own, no praise.\n' +
      'Reply as a plain list — "' + u.one + ' 1 — description" — and nothing else.');
  };

  const olSub = function(){
    const u = units();
    ask(u.sub + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: for every ' + u.one.toLowerCase() + ' above that has ' + u.subs.toLowerCase() +
      ', write a short DESCRIPTION of each ' + u.sub.toLowerCase() + '.\n' +
      'Rules:\n' +
      '- One or two sentences each: what happens in it, in order.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where one is still empty, write "not yet planned".\n' +
      '- No titles, no praise, no suggestions.\n' +
      'Reply as a plain list — "' + u.one + ' — ' + u.sub + ': description" — and nothing else.');
  };

  /* the order check speaks in the form's own words too, and reads the whole
     project before it judges the order */
  const olOrder = function(){
    const u = units();
    const one = u.one.toLowerCase(), subs = u.subs.toLowerCase();
    ask('Structure check', 'Outline',
      'You are a developmental editor.\n\n' + brief() + '\n\n' +
      'Task: read the ' + one + ' and ' + subs + ' order above against everything you were given — the plan, the Bible, the drafts — and tell the writer, plainly:\n' +
      '1. what the order is doing well, in one or two lines,\n' +
      '2. which ' + one + ' or ' + u.sub.toLowerCase() + ' is in the wrong place, and where it should go,\n' +
      '3. the single change that would help most.\n' +
      'Judge only from what is actually in the project. If the outline is too thin to judge, say so in one line instead of inventing structure.\n' +
      'Under 250 words. No praise padding.');
  };

  /* swapped onto the shared table, so the panel, the keyboard and anything
     else that calls them by name all reach the same two functions */
  F().olChapterSubs = olChapter;      /* Chapter description    */
  F().olSubSubs     = olSub;          /* Subchapter description */
  F().olStructure   = olOrder;        /* Check the order        */
})();


/* ══════════ context-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — what the assistant already knows

   Every AI request carries the project, in the order the writer built it:

       the prompt page  →  the drafts (and the chat on them)  →
       the outline  →  the plan / beat board  →  the board  →
       the reference page  →  the Bible  →  what is on screen now

   so the answer at each stage is written by something that has read the
   stages before it. The Outline page sees the drafts and the chat about
   them; the Plan sees the outline; the manuscript sees the plan. The board
   and the reference page are always carried, because they are the record
   the rest of the book is checked against.

   It is built fresh from the ACTIVE project and the ACTIVE workspace on
   every request, and nothing is cached — so a second project, or a second
   workspace inside this one, is a different book to the assistant, with no
   way for one to leak into the other.

   This layer only adds to the brief the app already builds (sfProjectBrief
   in pages-fix.js, which carries the title, the form, the structure, the
   Bible, the beats and the current section). It runs after every other
   script, and both AI doors — callAI, and the Draft chat's own request
   builder — read the result.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const CAP = 5200;                 /* the chain's own ceiling, in characters */

  const data = function(){
    try{ return (typeof D === 'function') ? (D() || null) : null; }catch(e){ return null; }
  };
  const projOf = function(){
    try{
      const d = D();
      return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };
  const flat = function(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  const cut = function(s, n){
    const t = flat(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  const html = function(s){ return flat(String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')); };
  const words = function(s){
    try{ if(typeof olWords === 'function') return olWords(s); }catch(e){}
    return flat(s).split(' ').filter(Boolean).length;
  };

  /* ── the drafts, with their prose: what the writing actually says ── */
  const drafts = function(d){
    const list = (d && Array.isArray(d.drafts)) ? d.drafts : [];
    if(!list.length) return '';
    return list.slice(0, 8).map(function(x, i){
      const body = html(x.body);
      return (i + 1) + '. ' + cut(x.title || 'Untitled', 60) + ' (' + words(body).toLocaleString() + ' words)' +
             (body ? '\n   "' + cut(body, 240) + '"' : '');
    }).join('\n');
  };

  /* ── what has already been said about it, on the draft page ── */
  const chat = function(d){
    const list = (d && Array.isArray(d.aiChats)) ? d.aiChats : [];
    if(!list.length) return '';
    /* the chat the writer is in, or the one used most recently */
    let c = d.aiChatActive ? list.filter(function(x){ return x && x.id === d.aiChatActive; })[0] : null;
    if(!c) c = list[list.length - 1];
    if(!c || !Array.isArray(c.messages) || !c.messages.length) return '';
    const tail = c.messages.slice(-8).map(function(m){
      return (m.role === 'user' ? 'Writer: ' : 'Assistant: ') + cut(m.text, 260);
    }).join('\n');
    const name = c.title ? '“' + cut(c.title, 50) + '”' : 'the chat';
    return name + ':\n' + tail;
  };

  /* ── the board: which list each piece stands in ──
     The cards are the same ones the Board page draws: every chapter and
     every subchapter, in the list it has been moved to. */
  const board = function(d){
    let proj = null, cols = [], state = {};
    try{ proj = (typeof kbProj === 'function') ? kbProj() : null; }catch(e){}
    try{ cols = (typeof kbColumns === 'function') ? kbColumns() : []; }catch(e){}
    try{
      state = (proj && proj.kanban) || {};
      if(state && Array.isArray(state.columns)) state = {};       /* the old shape */
    }catch(e){ state = {}; }
    if(!proj || !cols.length) return '';

    const cards = [];
    ((d && d.chapters) || []).forEach(function(c, i){
      cards.push({ id:c.id, title:c.title || ('Chapter ' + (i + 1)), body:c.content });
      (c.children || []).forEach(function(x, j){
        cards.push({ id:x.id, title:x.title || ('Subchapter ' + (j + 1)), body:x.content });
      });
    });
    if(!cards.length) return '';

    /* a card with no explicit list sits where the app would put it: drafted
       once it has words, in the first list before that */
    const auto = cols[0] ? cols[0].id : '';
    const drafted = cols[1] ? cols[1].id : auto;
    const out = [];
    cols.forEach(function(col){
      const inCol = cards.filter(function(c){
        const st = state[c.id];
        const at = (st && cols.some(function(x){ return x.id === st; })) ? st
                 : (words(c.body) > 0 ? drafted : auto);
        return at === col.id;
      });
      if(!inCol.length) return;
      out.push(col.name + ': ' + inCol.slice(0, 14).map(function(c){
        return cut(c.title, 50) + (words(c.body) ? ' (' + words(c.body) + 'w)' : '');
      }).join(', '));
    });
    return out.join('\n');
  };

  /* ── the reference page: what the writer looked up and kept ── */
  const refs = function(d){
    const list = (d && Array.isArray(d.references)) ? d.references : [];
    if(!list.length) return '';
    return list.slice(0, 20).map(function(r){
      const t = cut(r.title || r.name || r.url || 'Reference', 70);
      const note = cut(r.note || r.summary || r.text || '', 90);
      return '- ' + t + (note ? ' — ' + note : '');
    }).join('\n');
  };

  /* ── the plan, when the beads are not already in the brief ── */
  const plan = function(d){
    const list = (d && Array.isArray(d.beats)) ? d.beats : [];
    if(!list.length) return '';
    return list.slice(0, 30).map(function(b, i){
      return (i + 1) + '. [' + (b.type || 'beat') + '] ' + cut(b.text || b.title || '', 110);
    }).join('\n');
  };

  const chain = function(){
    const d = data();
    if(!d) return '';
    const out = [];
    const push = function(head, body){ if(body) out.push(head + ':\n' + body); };

    push('DRAFTS IN THIS PROJECT', drafts(d));
    push('WHAT HAS ALREADY BEEN SAID ABOUT IT (the draft page chat)', chat(d));
    /* the structure, the beats and the Bible are in the brief above; the
       plan gets its own lines here when the brief could not carry them all */
    push('PLAN — BEAT BOARD', plan(d));
    push('THE BOARD (which list each piece stands in)', board(d));
    push('REFERENCE PAGE — kept by the writer', refs(d));

    let text = out.join('\n\n');
    if(text.length > CAP) text = text.slice(0, CAP - 1) + '…';
    return text;
  };

  const head = '\n\nTHE PROJECT SO FAR — the stages this one comes after, each one a ' +
               'separate part of the same book. Use it. Do not invent anything that ' +
               'contradicts it, and do not restate it back to the writer.\n';

  if(typeof window.sfProjectBrief === 'function' && !window.sfProjectBrief.__sfChain){
    const orig = window.sfProjectBrief;
    const wrapped = function(){
      let base = '';
      try{ base = String(orig.apply(this, arguments) || ''); }catch(e){ base = ''; }
      let more = '';
      try{ more = chain(); }catch(e){ more = ''; }
      return more ? (base + head + more) : base;
    };
    wrapped.__sfChain = true;
    window.sfProjectBrief = wrapped;
  }
})();


/* ══════════ final-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the last pass

   Loaded after every other script, so its wrappers run after theirs.
   Six jobs:

     1 DARK, AND ONLY DARK     the app is dark. The Light mode that
                               settings.js can paint is unreachable: the
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
     settings.js owns setThemeMode and the light palettes. This pins the
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


/* ══════════ font-pack.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the faces the two font pickers offer

   THE THING THAT DID NOT HAPPEN
   Settings → Font → App font offers 67 families and the writing toolbar
   offers the same 67. Picking one set a font-family and nothing else —
   because not one @font-face for those families was ever in the app. The
   sheet that was meant to carry them, vendor/webfonts/fonts.css, is
   linked from index.html and is not in the build, so every family
   resolved to the first fallback the browser could find:

     · in the writing face that is a generic serif, so all 26 serif picks
       looked like each other, and like the default;
     · in the interface it was `system-ui` — which is what the app
       already uses — so “App font” could be set to anything at all and
       the app went on looking exactly the same.

   THE FIX, in four parts

     1 · A TRUTHFUL STACK. FONTS carries each family's own stack, generic
         and all (`'Merriweather',serif`, `'Space Mono',monospace`), so
         the name is turned into that stack rather than into a hairline
         family with a serif tail glued on. A serif pick now falls back
         to serif and a mono pick to monospace: the pick changes the app
         even before a font file arrives, and what is missing is the face,
         not the choice.

     2 · THE FACE ITSELF, on demand. The chosen family is fetched once and
         only the chosen one — never all 67 — with the link added rather
         than waited on, so the app keeps painting and the type sharpens
         when the file lands. Two requests go out per family: the 400/700
         pair (real bold instead of a synthesised one), and the bare
         family, because a family that publishes no 700 — Patrick Hand is
         one — answers the first with an error and would stay missing.

     2b · THE APP'S OWN FOUR FACES, too. theme.css names Inter for the
         interface, Fraunces for display type, JetBrains Mono for source
         and Merriweather for the page you write on — and this build
         ships no file for any of them either. So the app has never been
         drawn in its own face: the interface fell to system-ui, and the
         two serif tokens to Georgia. Those four come down once, on boot,
         with the same pass, so the app is itself before anything is
         picked — and a pick is a change from that, not from a fallback.

     3 · THE APP'S OWN COPY WINS. If a build did ship
         vendor/webfonts/fonts.css, the sheet is in the document and names
         real faces, and nothing is fetched at all: the offline desktop
         build keeps its own fonts. With no network and no local copy the
         stack in (1) is what shows, which is a real face's fallback
         rather than the default under a different name.

   Both pickers are followed — the app face and the writing face — because
   they read the same table of faces.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const configOf = function(){
    try{ return (typeof S !== 'undefined' && S.config) ? S.config : null; }catch(e){ return null; }
  };
  const faces = function(){
    try{ return (typeof FONTS !== 'undefined' && Array.isArray(FONTS)) ? FONTS : []; }catch(e){ return []; }
  };

  /* ═══ 1 · the stack a family name stands for ═══
     The table is the only place that knows which generic a face belongs
     to. An unknown name is quoted and left to the browser, which is what
     the app did for every name before this file. */
  const stackOf = function(name){
    if(!name) return '';
    const f = faces().filter(function(x){ return x && x.name === name; })[0];
    return (f && f.f) ? f.f : '"' + String(name) + '"';
  };
  /* what a setting writes when it wants that face, generic and all */
  window.sfFontStack = function(name){ return stackOf(name); };

  /* ═══ 2 · the app's own copy, when the build shipped one ═══
     index.html links vendor/webfonts/fonts.css. A sheet that answered
     with rules is the app's own copy and is the end of the question; a
     sheet that 404'd has no rules, which is how this file knows the
     families have to come from somewhere. */
  let local = null;
  const vendored = function(){
    if(local !== null) return local;
    local = false;
    const sheets = document.styleSheets || [];
    for(let i = 0; i < sheets.length; i++){
      let href = '';
      try{ href = String(sheets[i].href || ''); }catch(e){ continue; }
      if(href.indexOf('webfonts/fonts.css') < 0) continue;
      try{
        if(sheets[i].cssRules && sheets[i].cssRules.length){ local = true; return true; }
      }catch(e){}
    }
    return false;
  };

  /* ═══ 3 · the face itself, once, and only the one in use ═══ */
  const asked = {};
  const url = function(name, axes){
    return 'https://fonts.googleapis.com/css2?family='
      + encodeURIComponent(name).replace(/%20/g, '+') + axes + '&display=swap';
  };
  const tag = function(name, axes){
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = url(name, axes);
    el.setAttribute('data-sf-face', name);
    document.head.appendChild(el);
    return el;
  };
  const load = function(name){
    if(!name || asked[name]) return;
    asked[name] = 1;
    if(vendored()) return;                       /* the build carries them */
    tag(name, ':wght@400;700');                  /* regular, and real bold */
    tag(name, '');                               /* the regular alone */
  };

  /* the four faces theme.css's own tokens name — the interface, the two
     kinds of display type and the page. With no file shipped for them the
     app wears its fallbacks everywhere, which is what makes a pick in the
     App font select look like the app it already was. Fetched once, on
     boot, and a no-op the moment a build carries the folder again. */
  const OWN = ['Inter', 'Fraunces', 'JetBrains Mono', 'Merriweather'];
  const ownFaces = function(){
    for(let i = 0; i < OWN.length; i++) load(OWN[i]);
  };

  /* ═══ 4 · the app face ═══
     `--ui` is the family across the whole interface (theme.css holds the
     default, here it is replaced or handed back). A face is written as
     its whole stack, so an interface in a serif face really is a serif
     interface — and says so even where the file is still coming. */
  const paintUi = function(){
    const c = configOf();
    const stack = c ? stackOf(c.uiFont) : '';
    try{
      const root = document.documentElement;
      if(stack) root.style.setProperty('--ui', stack);
      else root.style.removeProperty('--ui');
    }catch(e){}
  };

  /* ═══ 5 · follow both settings ═══
     The two change in four places — the Appearance selects, the toolbar's
     own font list, a split pane, and a project switch (a project carries
     its own writing face), so the settings are read rather than the
     controls hooked: anything that writes S.config is caught. */
  const last = { f:null, u:null };
  const sync = function(){
    const c = configOf();
    if(!c) return;
    if(c.font !== last.f){
      last.f = c.font;
      load(c.font);
    }
    if(c.uiFont !== last.u){
      last.u = c.uiFont;
      paintUi();
      load(c.uiFont);
    }
  };
  window.sfFontSync = sync;

  /* the two calls the app already makes, answered at once rather than on
     the next tick of the watch below */
  const wrap = function(name, after){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfFaces) return;
    const fn = function(){
      const r = orig.apply(this, arguments);
      try{ after.apply(null, arguments); }catch(e){}
      return r;
    };
    fn.__sfFaces = true;
    window[name] = fn;
  };
  wrap('applyConfig', function(key){ if(key === 'font' || key === 'uiFont') sync(); });
  wrap('applyAllConfig', sync);

  /* The writing page's own font control (and its keyboard step) ends in
     write.js's applyFont, which writes the bare family with a serif tail:
     a mono or sans pick would fall to a serif while the file is on its way.
     That one line cannot be reached from here, so the face is said again,
     whole, right after it runs — the same value the line was aiming for. */
  wrap('applyFont', function(){
    const c = configOf();
    load(c && c.font);
    const stack = stackOf(c && c.font);
    if(!stack) return;
    const ed = document.getElementById('editor');
    if(ed) ed.style.fontFamily = stack;
  });

  /* and the net under them: a slow read of the two settings, so a path
     this file never heard of still lands. It writes only on a change. */
  setInterval(function(){ try{ sync(); }catch(e){} }, 1500);

  ownFaces();
  if(document.body) sync();
  else document.addEventListener('DOMContentLoaded', sync);
  setTimeout(function(){ try{ sync(); }catch(e){} }, 400);
})();

