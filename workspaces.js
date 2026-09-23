/* ═══════════════════════════════════════════════════════════
   ScriptForge — workspaces

   FIVE PER PROJECT, and they are the same pages, empty.

   A workspace is not a second app: it is the project's own content — the
   chapters, the drafts, the outline, the plan, the board, the Bible, the
   canvas, the chats — five times over. Workspace 1 holds what you have
   written; 2 to 5 start empty and stay out of 1's way, so a rewrite, an
   alternate cut or a spin-off can be written without unpicking the book
   that already exists. The reference page and the board are workspaces'
   own too, and the AI remembers each one separately, because the brief is
   built from whatever the active workspace holds.

   HOW IT WORKS, and why nothing else in the app had to change

   Every page already reads the project's lists by name — `proj.chapters`,
   `proj.drafts`, `proj.kanban` — and `useProjectData()` points the page at
   them. So the project's content keys are re-pointed once, here, as
   accessors onto `proj.wsList[proj.wsActive]`. Every existing read and write
   anywhere in the app lands in the active workspace without knowing
   workspaces exist. The accessors are deliberately NOT enumerable, so
   `JSON.stringify` stores only `wsList` — the content is saved once, not
   twice, and a reload reads it back from the workspaces it belongs to.

   THE ROUND BUTTON DOES THREE THINGS

     left click    the page list (unchanged)
     right click   the AI assistant (unchanged)
     hover + ← →   the previous / next workspace
     hover + wheel the same, a notch at a time

   A switch says so — "Workspace 3 of 5 · Act two" — and the page slides
   the way you moved. The name of each workspace is set in
   Settings → Custom → Workspaces.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const COUNT = 5;

  /* everything a workspace owns. Anything a page reads off the PROJECT
     belongs here; the project's own identity (name, mode, category, the
     project list, wsActive) does not. */
  const KEYS = [
    'chapters', 'drafts', 'ideas', 'notes', 'beats', 'references',
    'timeline', 'cast', 'versions', 'aiChats',
    'bible', 'kanban', 'kbCols', 'mindmap', 'canvasElements'
  ];

  const toastIt = function(msg, kind){
    try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){}
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  /* ═══ names ═══ */
  const labelList = function(){
    try{
      if(!Array.isArray(S.config.wsLabels)) S.config.wsLabels = [];
      while(S.config.wsLabels.length < COUNT) S.config.wsLabels.push('');
      return S.config.wsLabels;
    }catch(e){ return ['', '', '', '', '']; }
  };
  const nameOf = function(i){
    const custom = labelList()[i];
    return (custom && String(custom).trim()) || ('Workspace ' + (i + 1));
  };
  window.sfWsName = nameOf;
  window.sfWsCount = function(){ return COUNT; };

  /* ═══ the storage ═══ */
  const blank = function(){ return { id:'ws' + Math.random().toString(36).slice(2, 7) }; };

  const ensure = function(proj){
    if(!proj || typeof proj !== 'object') return proj;

    if(!Array.isArray(proj.wsList) || proj.wsList.length !== COUNT){
      /* MIGRATION: a project written before workspaces keeps everything it
         has, in workspace 1. The keys are lifted off the project first, so
         nothing is copied twice and nothing is left behind. */
      const carry = {};
      KEYS.forEach(function(k){
        if(Object.prototype.hasOwnProperty.call(proj, k)){
          carry[k] = proj[k];
          try{ delete proj[k]; }catch(e){}
        }
      });
      proj.wsList = [];
      for(let i = 0; i < COUNT; i++) proj.wsList.push(blank());
      Object.keys(carry).forEach(function(k){ proj.wsList[0][k] = carry[k]; });
    }

    if(typeof proj.wsActive !== 'number' || !(proj.wsActive >= 0 && proj.wsActive < COUNT)){
      proj.wsActive = 0;
    }

    KEYS.forEach(function(k){
      const d = Object.getOwnPropertyDescriptor(proj, k);
      if(d && typeof d.get === 'function') return;      /* already ours */
      Object.defineProperty(proj, k, {
        configurable: true,
        enumerable: false,                              /* stored once, in wsList */
        get: function(){
          const w = proj.wsList[proj.wsActive] || proj.wsList[0];
          return w ? w[k] : undefined;
        },
        set: function(v){
          const w = proj.wsList[proj.wsActive] || proj.wsList[0];
          if(w) w[k] = v;
        }
      });
    });
    return proj;
  };
  window.sfWsEnsure = ensure;

  /* every project is put through it the moment it becomes the working set */
  if(typeof window.useProjectData === 'function' && !window.useProjectData.__sfWs){
    const orig = window.useProjectData;
    const wrapped = function(proj){
      try{ ensure(proj); }catch(e){}
      return orig.apply(this, arguments);
    };
    wrapped.__sfWs = true;
    window.useProjectData = wrapped;
  }

  /* ═══ and on every read of the saved state ═══
     AFTER A RELOAD the content is only inside `wsList`: the accessors are
     rebuilt, never stored. `load()` replaces the whole state object, so a
     project exists for a moment with no `chapters` at the top level — and
     the app's own boot body checks exactly that property and would helpfully
     write a fresh, empty “Chapter 1” over a real book. Routing every load
     through here means the workspaces are in place before that check runs. */
  const ensureAll = function(){
    try{
      const modes = (typeof S !== 'undefined' && S.modes) || {};
      Object.keys(modes).forEach(function(m){
        const box = modes[m];
        if(!box || !Array.isArray(box.projects)) return;
        box.projects.forEach(function(p){ try{ ensure(p); }catch(e){} });
      });
    }catch(e){}
  };
  window.sfWsEnsureAll = ensureAll;

  if(typeof window.load === 'function' && !window.load.__sfWs){
    const origLoad = window.load;
    const wrappedLoad = function(){
      const r = origLoad.apply(this, arguments);
      try{ ensureAll(); }catch(e){}
      return r;
    };
    wrappedLoad.__sfWs = true;
    window.load = wrappedLoad;
  }

  const currentProj = function(){
    try{
      const d = D();
      return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };
  window.sfWsProj = currentProj;
  window.sfWsActive = function(){
    const p = currentProj();
    return p ? (p.wsActive || 0) : 0;
  };

  /* ═══ the switch ═══ */
  const flash = function(dir, i){
    const wrap = document.getElementById('fabWrap');
    const stage = document.getElementById('stage');
    const cls = dir > 0 ? 'ws-slide-fwd' : 'ws-slide-back';
    [wrap, stage].forEach(function(el){
      if(!el || !el.classList) return;
      el.classList.remove('ws-slide-fwd', 'ws-slide-back');
      /* re-add on the next frame, so the animation replays every time */
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(function(){ el.classList.remove(cls); }, 460);
    });
    badge(i);
  };

  const badge = function(i){
    const wrap = document.getElementById('fabWrap');
    if(!wrap) return;
    let b = wrap.querySelector('.fab-ws-badge');
    if(!b){
      b = document.createElement('span');
      b.className = 'fab-ws-badge';
      b.setAttribute('aria-hidden', 'true');
      wrap.appendChild(b);
    }
    const n = (typeof i === 'number') ? i : window.sfWsActive();
    b.textContent = (n + 1) + '/' + COUNT;
    b.title = nameOf(n);
  };

  const goTo = function(i, dir){
    const proj = currentProj();
    if(!proj){
      toastIt('Open a project first', 'warn');
      return false;
    }
    ensure(proj);
    const n = ((Math.round(i) % COUNT) + COUNT) % COUNT;
    if(n === proj.wsActive){
      toastIt('Already on ' + nameOf(n));
      return false;
    }

    /* the outgoing workspace is written down BEFORE the pointer moves: `save`
       reads the editor through the active workspace, and by the time the
       page has been re-rendered it belongs to the new one — saving after the
       move would put the old workspace's page into the new workspace. */
    saveIt();

    proj.wsActive = n;
    try{ if(typeof useProjectData === 'function') useProjectData(proj); }catch(e){}
    try{ if(typeof goPage === 'function') goPage(S.page); }catch(e){}
    try{ if(typeof renderModePills === 'function') renderModePills(); }catch(e){}
    try{ if(typeof updateBreadcrumb === 'function') updateBreadcrumb(); }catch(e){}
    saveIt();

    flash(dir || 1, n);
    toastIt('Workspace ' + (n + 1) + ' of ' + COUNT + ' · ' + nameOf(n));
    return true;
  };
  window.sfWsGo = function(i){ return goTo(i, (i > window.sfWsActive()) ? 1 : -1); };
  window.sfWsStep = function(dir){
    const at = window.sfWsActive();
    return goTo(at + (dir >= 0 ? 1 : -1), dir >= 0 ? 1 : -1);
  };
  window.sfWsCycle = function(){ return window.sfWsStep(1); };

  /* ═══ the round button's third job ═══ */
  let hovering = false;
  let wheelLock = false;

  const bind = function(){
    const wrap = document.getElementById('fabWrap');
    if(!wrap || wrap.__sfWsBound) return;
    wrap.__sfWsBound = true;

    wrap.addEventListener('mouseenter', function(){
      hovering = true;
      wrap.classList.add('ws-hover');
      badge();
    });
    wrap.addEventListener('mouseleave', function(){
      hovering = false;
      wrap.classList.remove('ws-hover');
    });
    /* the wheel over the button: a notch is one workspace either way */
    wrap.addEventListener('wheel', function(e){
      if(!wrap.classList.contains('ws-hover')) return;
      e.preventDefault();
      e.stopPropagation();
      if(wheelLock) return;
      wheelLock = true;
      setTimeout(function(){ wheelLock = false; }, 320);
      window.sfWsStep(e.deltaY > 0 ? 1 : -1);
    }, { passive:false });

    wrap.addEventListener('focusin', function(){ hovering = true; wrap.classList.add('ws-hover'); badge(); });
    wrap.addEventListener('focusout', function(){ hovering = false; wrap.classList.remove('ws-hover'); });
    badge();
  };

  /* ← and → while the pointer is on the button. Nothing else uses them there:
     the button has no caret, and the pages are one click each. */
  document.addEventListener('keydown', function(e){
    if(!hovering) return;
    if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    /* a panel or the command box on top of the app keeps its own arrows */
    const open = document.querySelector('.settings-panel.open, .modal.open, .cmd-box.open, .fab-menu:not([hidden]), .fab-ai:not([hidden])');
    if(open) return;
    e.preventDefault();
    e.stopPropagation();
    window.sfWsStep(e.key === 'ArrowRight' ? 1 : -1);
  }, true);

  /* the badge counts on every repaint of the page, so it can never be stale */
  if(typeof window.goPage === 'function' && !window.goPage.__sfWs){
    const origGo = window.goPage;
    const wrappedGo = function(){
      const r = origGo.apply(this, arguments);
      setTimeout(function(){ badge(); }, 0);
      return r;
    };
    wrappedGo.__sfWs = true;
    window.goPage = wrappedGo;
  }

  /* ═══ Settings → Custom → Workspaces ═══ */
  try{
    if(typeof SETTINGS === 'object' && SETTINGS.renderers && typeof SETTINGS.renderers.custom === 'function'){
      const origCustom = SETTINGS.renderers.custom;
      SETTINGS.renderers.custom = function(root){
        const r = origCustom.apply(this, arguments);
        try{ settingsCard(root); }catch(e){ console.warn('workspace settings failed:', e); }
        return r;
      };
    }
  }catch(e){}

  function settingsCard(root){
    if(!root || typeof card !== 'function' || typeof row !== 'function') return;

    const c = card('Workspaces', 'collection');

    const head = function(){
      const p = currentProj();
      return p ? nameOf(p.wsActive || 0) : 'No project open';
    };

    /* which workspace you are naming */
    const pick = document.createElement('select');
    pick.className = 'sel';
    for(let i = 0; i < COUNT; i++){
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = (i + 1) + '. ' + nameOf(i);
      if(i === window.sfWsActive()) o.selected = true;
      pick.appendChild(o);
    }

    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.className = 'inp';
    nameInp.maxLength = 40;
    nameInp.style.minWidth = '180px';
    nameInp.placeholder = 'Name this workspace';
    nameInp.value = labelList()[Number(pick.value) || 0] || '';

    const repaintPicks = function(){
      Array.prototype.forEach.call(pick.options, function(o, i){
        o.textContent = (i + 1) + '. ' + nameOf(i);
      });
    };

    pick.onchange = function(){
      nameInp.value = labelList()[Number(pick.value) || 0] || '';
      nameInp.focus();
    };
    const commit = function(){
      const i = Number(pick.value) || 0;
      const typed = String(nameInp.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      labelList()[i] = typed;
      saveIt();
      repaintPicks();
      badge();
      if(typeof renderFabMenu === 'function') renderFabMenu();
      toastIt(typed ? 'Workspace ' + (i + 1) + ' is “' + typed + '”' : 'Workspace ' + (i + 1) + ' keeps its number');
    };
    nameInp.onchange = commit;
    nameInp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); commit(); nameInp.blur(); } });

    c.appendChild(row('Workspace label', 'The name shown when you switch — this project’s 1 to 5', [pick, nameInp]));

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn btn-ghost';
    goBtn.innerHTML = '<i class="bi bi-collection"></i> Go to it';
    goBtn.onclick = function(){ goTo(Number(pick.value) || 0, 1); badge(); };
    c.appendChild(row('Switch', 'Or hover the round button and press ← → , or scroll a notch over it', [goBtn]));

    const hint = document.createElement('div');
    hint.className = 'tiny muted';
    hint.style.marginTop = '4px';
    hint.textContent = 'Five workspaces in every project. They share the pages — Views, Outline, Plan, Board, Bible, Canvas, Reference — and hold their own copy of everything in them, so an alternate cut or a rewrite stays out of the book you already have. The assistant remembers each workspace separately, and never carries one project’s work into another.';
    c.appendChild(hint);

    root.appendChild(c);
  }

  /* ═══ boot ═══ */
  const boot = function(){
    ensureAll();
    bind();
    badge();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();
