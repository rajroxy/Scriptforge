/* ═══════════════════════════════════════════════════════════
   ScriptForge — small fixes layered on top of pages.js / app.js.

   The layer exists because pages.js / app.js carry a lot of history; each
   block below is self-contained and only replaces what it must.

   1  · FAB menu — grouped Views · Reference · Workflow, with tooltips.
   2  · Draft page — the pager sits at the bottom of the list.
   3+4· Kanban + Outline — one chevron pager each; Outline is one panel
        with the toolbar inside it, exactly like the Draft list.
   5  · Bible head — T + New on the left, category tabs in line right.
   6  · Plan tools — Add act · Add scene · Clear (Preset is gone).
   6b · Idea — prompt card + saved-prompt panel.
   7  · Icons — close is bi-x-lg, delete is bi-trash, colour chips painted.
   10 · The T (type) panel — no close button, placed beside its button.
   8  · A new or opened project always lands on the Idea view.
   11 · Kanban — a remove button on every list, an “All lists” switch, and
        every list on screen while a card is in the air.
   12 · Swipe — the window edge pages the active view (off on the board).
   13 · Settings — right-click opens the quick Advanced panel.
   14 · Plan — the visual beat board (renderBeats is replaced).
   ═══════════════════════════════════════════════════════════ */

/* ── 1 · FAB menu ── */
(function(){
  window.renderFabMenu = function(){
    const views = document.getElementById('fabMenuViews');
    if(!views) return;
    const mode = (typeof currentMode === 'function') ? currentMode() : null;
    if(!mode) return;

    const groups = mode.fabGroups ||
      [{ label:'Views', views:(mode.editorViews || []).map(function(id){ return { id:id }; }) }];
    const keys = (typeof CMD_PAGE_KEYS !== 'undefined') ? CMD_PAGE_KEYS : {};

    views.innerHTML = groups.map(function(g, gi){
      const items = (g.views || []).map(function(v){
        const pid  = (typeof v === 'string') ? v : v.id;
        const meta = (typeof PAGE_META !== 'undefined' && PAGE_META[pid]) || { name:pid, icon:'file' };
        const name = (typeof v === 'string' || !v.name) ? meta.name : v.name;
        const icon = (typeof v === 'string' || !v.icon) ? meta.icon : v.icon;
        /* every item carries a tooltip: the view’s name and its command-box key */
        const tip  = name + (keys[pid] ? '  ·  shortcut ' + keys[pid] : '');
        return '<button class="fab-item' + (S.page === pid ? ' active' : '') +
          '" data-fab-go="' + pid + '" title="' + esc(tip) + '" aria-label="' + esc(name) + '">' +
          '<i class="bi bi-' + icon + '"></i><span>' + esc(name) + '</span></button>';
      }).join('');
      const divider = gi ? '<div class="fab-divider"></div>' : '';
      return divider + '<div class="fab-menu-head">' + esc(g.label) + '</div>' + items;
    }).join('');
  };
})();

/* ── 2 · Draft page ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.draft !== 'function') return;
  const orig = PAGE_RENDERERS.draft;

  PAGE_RENDERERS.draft = function(root){
    orig(root);

    /* the pager lives at the bottom of the list, like the players' bars */
    const pager = root.querySelector('.draft-pager');
    const list  = root.querySelector('.draft-list');
    if(pager && list && pager.parentElement !== list) list.appendChild(pager);

    /* the page's own type (set from the T panel) drives the writing surface */
    if(typeof typoApply === 'function') typoApply('draft', root);
  };
})();

/* ── 3 + 4 · one chevron bar, bottom-right, for Kanban and Outline ──
   Kanban pages its lists; the Outline keeps the whole chapter list exactly
   as it was — there the chevrons page the panel itself. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const PG = { kb:0 };

  const KB_PER = function(){
    const w = window.innerWidth || 1200;
    return w > 1100 ? 4 : (w > 720 ? 2 : 1);      /* mirrors the board's breakpoints */
  };

  const bar = function(root){
    let b = root.querySelector('.pg-pager');
    if(!b){
      b = document.createElement('div');
      b.className = 'pg-pager';
      root.appendChild(b);
    }
    return b;
  };
  const shell = function(root, kind, label, prevOff, nextOff){
    const b = bar(root);
    b.dataset.pg = kind;
    b.innerHTML =
      '<button class="mv-pager-btn" data-pg-step="-1" title="Previous"' + (prevOff ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-left"></i></button>'
      + '<span class="vpl-range">' + label + '</span>'
      + '<button class="mv-pager-btn" data-pg-step="1" title="Next"' + (nextOff ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-right"></i></button>';
    return b;
  };
  const drop = function(root){
    const b = root.querySelector('.pg-pager');
    if(b) b.parentElement.removeChild(b);
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-pg-step]');
    if(!btn) return;
    const b = btn.closest('.pg-pager');
    if(!b || !b.dataset.pg) return;
    e.preventDefault();
    const dir = parseInt(btn.dataset.pgStep, 10) || 1;

    if(b.dataset.pg === 'ol'){
      /* the whole list stays on the page — the chevrons scroll the panel */
      const root = document.getElementById('page-outline');
      const panel = root && (root.querySelector('.ol-panel') || root.querySelector('.ol-wrap'));
      if(!panel) return;
      panel.scrollBy({ top: dir * Math.max(90, panel.clientHeight - 60), behavior:'smooth' });
      setTimeout(function(){ if(root && root.__olSync) root.__olSync(); }, 420);
      return;
    }

    PG.kb = Math.max(0, (PG.kb || 0) + dir);
    const root = document.getElementById('page-kanban');
    if(root && typeof PAGE_RENDERERS.kanban === 'function') PAGE_RENDERERS.kanban(root);
  }, true);

  /* ── Kanban: no ghost tile, one page of lists at a time ── */
  if(typeof PAGE_RENDERERS.kanban === 'function'){
    const orig = PAGE_RENDERERS.kanban;
    PAGE_RENDERERS.kanban = function(root){
      orig(root);
      if(!root || !root.querySelector) return;

      const ghost = root.querySelector('.kb-addlist');
      if(ghost && ghost.parentElement) ghost.parentElement.removeChild(ghost);

      const board = root.querySelector('#kbBoard');
      if(!board){ drop(root); return; }
      const cols = Array.prototype.slice.call(board.children).filter(function(x){
        return x.classList && x.classList.contains('kb-col');
      });
      if(!cols.length){ drop(root); return; }

      /* no pager on the board — every list is on screen and the board
         scrolls sideways (and downwards) instead of paging */
      cols.forEach(function(c){ if(c.style.display === 'none') c.style.display = ''; });
      drop(root);

      /* the head already carries the grey “New list” button (pages.js), so
         nothing is added here — only the pager above was taken away */
    };
  }

  /* ── Outline: one panel, exactly like the Draft list — the toolbar
     (T · New chapter · New subchapter · Expand · Collapse) rides INSIDE
     the panel at the top, the chapter list fills it, and the chevrons
     are its footer. Every row renders; nothing is hidden. ── */
  if(typeof PAGE_RENDERERS.outline === 'function'){
    const orig = PAGE_RENDERERS.outline;
    PAGE_RENDERERS.outline = function(root){
      orig(root);
      if(!root || !root.querySelector) return;

      const wrap  = root.querySelector('.ol-wrap');
      const panel = root.querySelector('.ol-panel');
      if(!wrap || !panel){ drop(root); return; }

      /* The toolbar is the page's own bar now — the same box Draft and Idea
         wear — so it stays at page level and the panel holds only the list
         and its chevron footer. */

      const rows = Array.prototype.slice.call(panel.querySelectorAll('.ol-node'))
        .filter(function(r){ return r.parentElement === panel; });
      if(!rows.length){ drop(root); return; }

      /* the whole chapter list always renders — no row is ever hidden */
      rows.forEach(function(r){ if(r.style.display === 'none') r.style.display = ''; });

      const sync = function(){
        const b = root.querySelector('.pg-pager');
        if(!b) return;
        const wr = panel.getBoundingClientRect();
        let first = 0, last = rows.length - 1;
        rows.forEach(function(r, i){
          const rr = r.getBoundingClientRect();
          if(rr.bottom <= wr.top + 2) first = i + 1;
          if(rr.top < wr.bottom - 2) last = i;
        });
        if(first > last) first = last;
        const range = b.querySelector('.vpl-range');
        if(range) range.textContent = (first + 1) + '–' + (last + 1);
        const prev = b.querySelector('[data-pg-step="-1"]');
        const next = b.querySelector('[data-pg-step="1"]');
        if(prev) prev.disabled = panel.scrollTop <= 2;
        if(next) next.disabled = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
      };
      root.__olSync = sync;

      const b = shell(root, 'ol', '1–' + rows.length, true, true);
      if(b && b.parentElement !== wrap) wrap.appendChild(b);

      panel.addEventListener('scroll', sync, { passive:true });
      if(window.requestAnimationFrame) requestAnimationFrame(sync); else sync();
    };
  }
})();

/* ── 5 · Bible head — T + New left, category tabs in line on the right ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.bible !== 'function') return;
  const orig = PAGE_RENDERERS.bible;

  PAGE_RENDERERS.bible = function(root){
    orig(root);
    const head = root.querySelector('.page-head');
    const tabs = root.querySelector('#bbTabs');
    if(!head || !tabs || tabs.parentElement === head) return;

    Array.prototype.slice.call(head.children).forEach(function(c){
      if(c !== tabs && !(c.classList && c.classList.contains('ol-actions'))) c.remove();
    });
    const acts = head.querySelector('.ol-actions');
    if(acts){ acts.classList.remove('ol-actions'); acts.classList.add('ol-head-left'); }
    head.appendChild(tabs);

    /* the New button is not the white primary pill any more */
    const add = head.querySelector('[data-bb="add"]');
    if(add) add.classList.remove('ol-btn-primary');
  };
})();

/* ── 6 · Plan tools — the Preset button is gone; these replace it. The
   Plan page itself is the visual beat board (see §14). ── */
(function(){
  const beats = function(){
    const d = (typeof D === 'function') ? D() : null;
    if(!d) return null;
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };
  const redraw = function(){
    if(typeof save === 'function') save();
    if(typeof renderBeats === 'function') renderBeats();
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-act="add-act"]')){
      e.preventDefault();
      const b = beats(); if(!b) return;
      b.push({ id: uid(), text:'New act', level:0, type:'act' });
      redraw();
      return;
    }
    if(t.closest('[data-act="add-scene"]')){
      e.preventDefault();
      const b = beats(); if(!b) return;
      b.push({ id: uid(), text:'New scene', level:0, type:'scene' });
      redraw();
      return;
    }
    if(t.closest('[data-act="clear-beats"]')){
      e.preventDefault();
      const b = beats(); if(!b || !b.length) return;
      if(!confirm('Remove all ' + b.length + ' beats?')) return;
      b.length = 0;
      redraw();
      return;
    }
  }, true);
})();

/* ── 6b · Idea — a page worth looking at: a prompt card you can shuffle,
   copy and keep, with a saved-prompt panel beside it (head inside the
   panel, chevrons pinned at its bottom — the Draft list’s layout). ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.inspire !== 'function') return;

  const POOLS = {
    any: [
      'Write a scene that takes place entirely in a single elevator ride.',
      'Describe a character only through what they carry in their pockets.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'A letter that was never meant to be sent.',
      'Write the same scene twice — once as comedy, once as tragedy.',
      'Write a scene where the weather is a character.'
    ],
    scene: [
      'Open on the last five seconds of a conversation we never hear.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'Write a scene where the weather is a character.',
      'A character arrives somewhere they swore they would never return to.',
      'The scene ends on the one line nobody wanted said out loud.',
      'Two rivals forced to cooperate. Neither will speak first.'
    ],
    character: [
      'Describe a character only through what they carry in their pockets.',
      'A character discovers they’ve been misremembering a pivotal event.',
      'Write a character’s morning in five objects, no adjectives.',
      'Show a character’s worst quality as their best quality, misapplied.',
      'A character rehearses a lie until it turns into the truth.',
      'Describe someone by how they treat a stranger who cannot help them.'
    ],
    dialogue: [
      'Write a conversation where neither person says what they actually mean.',
      'Two rivals forced to cooperate. Neither will speak first.',
      'A confession told entirely in questions.',
      'An argument where both people are right.',
      'Someone says goodbye without ever using the word.',
      'Write a scene where the real dialogue happens in the pauses.'
    ],
    structure: [
      'Write the same scene twice — once as comedy, once as tragedy.',
      'Sketch a midpoint that reverses what the hero wants.',
      'Write an opening image and a closing image that mirror each other.',
      'Outline a subplot that quietly argues against your main theme.',
      'Write the “all is lost” moment without a single tear.',
      'Write the scene that proves the hero has changed — with no dialogue.'
    ]
  };

  const CHIPS = [
    { id:'any',       name:'Any',       icon:'shuffle' },
    { id:'scene',     name:'Scene',     icon:'camera-reels' },
    { id:'character', name:'Character', icon:'person' },
    { id:'dialogue',  name:'Dialogue',  icon:'chat-quote' },
    { id:'structure', name:'Structure', icon:'diagram-3' }
  ];

  let pool = 'any';
  let page = 0;
  let currentPrompt = '';

  const saved = function(){
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts;
  };

  const pick = function(){
    const list = POOLS[pool] || POOLS.any;
    let next = list[Math.floor(Math.random() * list.length)];
    if(list.length > 1 && next === currentPrompt) next = list[(list.indexOf(next) + 1) % list.length];
    currentPrompt = next;
    return next;
  };

  const showPrompt = function(){
    const box = document.getElementById('inspireBox');
    if(box) box.innerHTML = '<p>' + esc(currentPrompt) + '</p>';
  };

  const perPage = function(){
    const rows = document.getElementById('ideaRows');
    const h = (rows && rows.clientHeight) || 0;
    return Math.max(2, Math.floor(h / 62) || 5);
  };

  const renderSaved = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    const list = saved();
    const per  = perPage();
    const pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const from = page * per;
    const slice = list.slice(from, from + per);

    box.innerHTML = slice.length
      ? slice.map(function(txt, k){
          const i = from + k;
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-text">' + esc(txt) + '</span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>';

    const count = document.getElementById('ideaCount');
    if(count) count.textContent = String(list.length);
    const range = document.getElementById('ideaRange');
    if(range) range.textContent = list.length ? ((from + 1) + '–' + Math.min(from + per, list.length)) : '0';
    const prev = document.querySelector('#page-inspire [data-idea-page="-1"]');
    const next = document.querySelector('#page-inspire [data-idea-page="1"]');
    if(prev) prev.disabled = page <= 0;
    if(next) next.disabled = page >= pages - 1;
  };

  const paintChips = function(){
    document.querySelectorAll('#page-inspire .idea-chip').forEach(function(c){
      c.classList.toggle('on', c.dataset.ideaChip === pool);
    });
  };

  const copyText = function(txt){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        if(typeof toast === 'function') toast('Copied');
        return;
      }
    }catch(e){ /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); if(typeof toast === 'function') toast('Copied'); }catch(e){}
    ta.remove();
  };

  PAGE_RENDERERS.inspire = function(root){
    root.innerHTML =
      '<div class="idea-wrap">'
      + '<section class="idea-main">'
      +   '<div class="idea-bar">'
      +     '<div class="idea-chips">'
      +       CHIPS.map(function(c){
                return '<button class="idea-chip' + (c.id === pool ? ' on' : '') + '" data-idea-chip="' + c.id + '">'
                  + '<i class="bi bi-' + c.icon + '"></i><span>' + c.name + '</span></button>';
              }).join('')
      +     '</div>'
      +     '<div class="idea-tools">'
      +       '<button class="ol-btn" data-idea="new" title="Another prompt"><i class="bi bi-shuffle"></i> New prompt</button>'
      +       '<button class="ol-btn" data-idea="copy" title="Copy this prompt"><i class="bi bi-clipboard"></i> Copy</button>'
      +       '<button class="ol-btn" data-idea="save" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i> Save</button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="idea-cards" id="inspireBox"></div>'
      + '</section>'
      + '<aside class="idea-side">'
      +   '<div class="idea-side-head"><i class="bi bi-bookmark"></i><span>Saved prompts</span><em id="ideaCount">0</em></div>'
      +   '<div class="idea-rows" id="ideaRows"></div>'
      +   '<div class="idea-pager">'
      +     '<button class="mv-pager-btn" data-idea-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>'
      +     '<span class="vpl-range" id="ideaRange">0</span>'
      +     '<button class="mv-pager-btn" data-idea-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>'
      +   '</div>'
      + '</aside>'
      + '</div>';

    if(!currentPrompt) currentPrompt = pick();
    paintChips();
    showPrompt();
    renderSaved();
  };

  /* The click wiring for this first version of the page lives in §17 below,
     which replaces PAGE_RENDERERS.inspire outright. Leaving these handlers
     registered made every Idea click fire twice, so they are gone. */
})();

/* ── 7 · Icons — close is always bi-x-lg, delete is always bi-trash ── */
(function(){
  const CLOSE_TIP = /^\s*(close|dismiss)\b/i;
  const DEL_TIP   = /^\s*(delete|remove|discard|trash)\b/i;
  const SKIP      = '#editor, .editor-doc, [contenteditable="true"], svg';

  const isClose = function(el){
    if(el.classList && el.classList.contains('v-close')) return true;
    const tip = (el.getAttribute('title') || '') + ' | ' + (el.getAttribute('aria-label') || '');
    if(CLOSE_TIP.test(tip)) return true;
    const at = el.attributes || [];
    for(let i = 0; i < at.length; i++){
      const a = at[i];
      if(a.name.indexOf('data-') !== 0) continue;
      if(/-close(-|$)/.test(a.name)) return true;      /* data-typo-close, data-act="…-close" */
      if(/close/i.test(a.value)) return true;
    }
    return false;
  };

  const isDel = function(el){
    const at = el.attributes || [];
    /* editor commands (bold, unlink, removeFormat…) keep their own icons */
    for(let i = 0; i < at.length; i++){
      if(/-cmd$|-cmd-/i.test(at[i].name)) return false;
    }
    const tip = (el.getAttribute('title') || '') + ' | ' + (el.getAttribute('aria-label') || '');
    if(DEL_TIP.test(tip)) return true;
    for(let i = 0; i < at.length; i++){
      const a = at[i];
      if(a.name.indexOf('data-') !== 0) continue;
      if(/-(del|delete|remove|kill|trash)(-[a-z0-9]+)?$/.test(a.name)) return true;
      if(a.name === 'data-act' || a.name === 'data-ovl'){
        if(/^(.*-)?(del|delete|remove|trash)(-[a-z0-9]+)*$/i.test(a.value)) return true;
      }
    }
    return false;
  };

  const setIcon = function(el, cls){
    if(el.children.length > 1) return;                 /* only real icon buttons */
    const svg = el.querySelector('svg');
    if(svg){
      const i = document.createElement('i');
      i.className = 'bi ' + cls;
      svg.replaceWith(i);
      return;
    }
    const i = el.querySelector('i.bi');
    if(i){
      if((' ' + i.className + ' ').indexOf(' ' + cls + ' ') < 0) i.className = 'bi ' + cls;
      return;
    }
    if(!(el.textContent || '').trim()) el.insertAdjacentHTML('afterbegin', '<i class="bi ' + cls + '"></i>');
  };

  const scan = function(node){
    if(!node || node.nodeType !== 1) return;
    const all = [node];
    if(node.querySelectorAll) all.push.apply(all, node.querySelectorAll('*'));
    for(let k = 0; k < all.length; k++){
      const el = all[k];
      if(!el.tagName || el.tagName.toLowerCase() === 'svg') continue;
      if(el.closest && el.closest(SKIP)) continue;
      if(isClose(el)) setIcon(el, 'bi-x-lg');
      else if(isDel(el)) setIcon(el, 'bi-trash');
    }
  };

  /* ── the manuscript toolbar's colour chips are painted by write.js, but
     they start empty when the toolbar re-renders — keep them coloured ── */
  const paintChips = function(){
    if(typeof window.paintSwatches !== 'function') return;
    const fills = document.querySelectorAll('.tb-swatch-fill');
    for(let i = 0; i < fills.length; i++){
      if(!fills[i].style.background){ window.paintSwatches(); return; }
    }
  };

  /* ── the Bible's two panel empty-states lose their “Add …” buttons —
     the New button in the head is the only one that stays ── */
  const stripBibleAdds = function(){
    const btns = document.querySelectorAll(
      '.bb-list [data-bb="add"], #bbRows [data-bb="add"],' +
      '.bb-detail [data-bb="add"], #bbDetail [data-bb="add"]');
    for(let i = 0; i < btns.length; i++){
      if(btns[i].parentElement) btns[i].parentElement.removeChild(btns[i]);
    }
  };

  /* ── the Bible's left panel gets the Draft list's chevron pager at its
     bottom: the panel pages its entries instead of scrolling forever ── */
  let BB_PAGE = 0, BB_ROW_H = 34;
  const pageBibleRows = function(){
    const list = document.querySelector('#page-bible .bb-list');
    const box  = document.getElementById('bbRows');
    if(!list || !box) return;

    let bar = list.querySelector('.bb-pager');
    if(!bar){
      bar = document.createElement('div');
      bar.className = 'bb-pager';
      list.appendChild(bar);
    }

    const rows = box.querySelectorAll('.bb-row');
    if(bar.style.display === 'none') bar.style.display = '';

    /* no entries yet — the bar still shows, like the Draft list's “0” */
    if(!rows.length){
      if(bar.dataset.sig !== 'empty'){
        bar.dataset.sig = 'empty';
        bar.innerHTML =
          '<button class="mv-pager-btn" data-bb-page="-1" title="Previous" disabled>'
            + '<i class="bi bi-chevron-left"></i></button>'
          + '<span class="vpl-range">0</span>'
          + '<button class="mv-pager-btn" data-bb-page="1" title="Next" disabled>'
            + '<i class="bi bi-chevron-right"></i></button>';
      }
      return;
    }

    for(let i = 0; i < rows.length; i++){
      const rh = rows[i].getBoundingClientRect().height;
      if(rh > 0){ BB_ROW_H = rh + 1; break; }
    }
    const per   = Math.max(3, Math.floor(((box.clientHeight || 300) - 6) / (BB_ROW_H || 34)));
    const pages = Math.max(1, Math.ceil(rows.length / per));
    BB_PAGE = Math.max(0, Math.min(BB_PAGE, pages - 1));
    const from = BB_PAGE * per;

    for(let i = 0; i < rows.length; i++){
      const want = (i >= from && i < from + per) ? '' : 'none';
      if(rows[i].style.display !== want) rows[i].style.display = want;
    }

    const sig = [from, per, rows.length, BB_PAGE].join('|');
    if(bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    bar.innerHTML =
      '<button class="mv-pager-btn" data-bb-page="-1" title="Previous"' + (BB_PAGE <= 0 ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-left"></i></button>'
      + '<span class="vpl-range">' + ((from + 1) + '–' + Math.min(from + per, rows.length)) + '</span>'
      + '<button class="mv-pager-btn" data-bb-page="1" title="Next"' + (BB_PAGE >= pages - 1 ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-right"></i></button>';
  };

  /* the T panel has no close button — clicking outside (or Escape) closes it */
  const stripTypoClose = function(){
    const btns = document.querySelectorAll('[data-typo-panel] [data-typo-close]');
    for(let i = 0; i < btns.length; i++){
      if(btns[i].parentElement) btns[i].parentElement.removeChild(btns[i]);
    }
  };

  const tidy = function(){ paintChips(); stripBibleAdds(); pageBibleRows(); stripTypoClose(); };

  const pending = [];
  let scheduled = false;
  const flush = function(){
    scheduled = false;
    const nodes = pending.splice(0, pending.length);
    nodes.forEach(scan);
    tidy();
  };
  const enqueue = function(node){
    pending.push(node);
    if(scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function(f){ setTimeout(f, 16); })(flush);
  };

  const start = function(){
    scan(document.body);
    tidy();
    document.addEventListener('click', tidy, true);
    document.addEventListener('click', function(e){
      const b = e.target.closest('[data-bb-page]');
      if(!b) return;
      e.preventDefault();
      BB_PAGE = Math.max(0, BB_PAGE + (parseInt(b.dataset.bbPage, 10) || 1));
      pageBibleRows();
    }, true);
    if(typeof MutationObserver !== 'function') return;
    new MutationObserver(function(muts){
      for(let i = 0; i < muts.length; i++){
        const added = muts[i].addedNodes;
        for(let j = 0; j < added.length; j++) enqueue(added[j]);
      }
    }).observe(document.body, { childList:true, subtree:true });
  };

  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();

/* ── 10 · the T (type) panel: no close button, placed properly ──
   It opens beside the button that owns it — level with it, to the right
   when there is room, otherwise aligned with the button; always fully on
   screen. Clicking outside (or Escape) closes it. ── */
(function(){
  if(typeof window.typoOpen !== 'function') return;
  const orig = window.typoOpen;

  const place = function(p, anchor){
    if(!p || !anchor || !anchor.getBoundingClientRect) return;
    const r  = anchor.getBoundingClientRect();
    const vw = window.innerWidth  || 1200;
    const vh = window.innerHeight || 800;
    const w  = p.offsetWidth  || 236;
    const h  = p.offsetHeight || 220;

    /* always drop straight below the T button, left-aligned with it */
    let left = r.left;
    if(left + w > vw - 8) left = vw - w - 8;     /* pin to the right edge if needed */

    let top = r.bottom + 6;
    if(top + h > vh - 8) top = r.top - h - 6;    /* no room below → open above it */
    if(top < 8) top = Math.max(8, vh - h - 8);

    p.style.left = Math.max(8, Math.round(left)) + 'px';
    p.style.top  = Math.max(8, Math.round(top))  + 'px';
  };

  window.typoOpen = function(page, anchor){
    orig(page, anchor);
    const p = document.querySelector('[data-typo-panel="' + page + '"]');
    if(!p) return;                               /* it was toggled shut */
    const x = p.querySelector('[data-typo-close]');
    if(x && x.parentElement) x.parentElement.removeChild(x);
    place(p, anchor);
  };

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(typeof window.typoClose === 'function') window.typoClose();
  }, true);
})();

/* ── 8 · creating or opening a project always lands on the Idea view ──
   (belt and braces: whatever route created it, the Idea page is the one
   the writer sees next) ── */
(function(){
  const toIdea = function(){
    if(typeof goPage === 'function' && S.page !== 'inspire') goPage('inspire');
  };

  if(typeof window.openProjectById === 'function'){
    const origOpen = window.openProjectById;
    window.openProjectById = function(){
      const r = origOpen.apply(this, arguments);
      toIdea();
      return r;
    };
  }

  if(window.TOOLS && typeof window.TOOLS.newProject === 'function'){
    const origNew = window.TOOLS.newProject;
    window.TOOLS.newProject = async function(){
      const before = ((D() && D().projects) || []).length;
      const r = await origNew.apply(this, arguments);
      const after  = ((D() && D().projects) || []).length;
      if(after > before) toIdea();
      return r;
    };
  }
})();

/* ── 11 · Kanban — every list can be removed, and a card can be dropped on
   a list that lives on another page of the board. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.kanban !== 'function') return;
  const orig = PAGE_RENDERERS.kanban;
  let KB_ALL = false;                 /* “All lists” — every list on one screen */

  PAGE_RENDERERS.kanban = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    /* every list is always on the board, so the old All-lists switch is gone */
    const allSw = root.querySelector('[data-kb-all]');
    if(allSw && allSw.parentElement) allSw.parentElement.removeChild(allSw);

    /* a remove button on every list — the four defaults included */
    Array.prototype.slice.call(root.querySelectorAll('.kb-col')).forEach(function(col){
      const tools = col.querySelector('.kb-col-tools');
      const id = col.dataset.kbCol;
      if(!tools || !id || tools.querySelector('[data-kb-kill]')) return;
      const b = document.createElement('button');
      b.className = 'ol-tool';
      b.dataset.kbKill = id;
      b.title = 'Remove list';
      b.innerHTML = '<i class="bi bi-trash"></i>';
      tools.appendChild(b);
    });
  };

  document.addEventListener('click', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('[data-kb-all]')) return;
    e.preventDefault();
    KB_ALL = !KB_ALL;
    const root = document.getElementById('page-kanban');
    if(root) PAGE_RENDERERS.kanban(root);
  }, true);
})();

/* removing a list is allowed now — keep the board from going empty */
(function(){
  if(typeof window.kbDeleteList !== 'function') return;

  window.kbDeleteList = function(colId){
    const cols = (typeof kbColumns === 'function') ? kbColumns() : [];
    const col  = cols.filter(function(c){ return c.id === colId; })[0];
    if(!col) return;
    if(cols.length <= 1){
      if(typeof toast === 'function') toast('Keep at least one list on the board', 'warn');
      return;
    }
    if(!confirm('Remove the list “' + col.name + '”? Its cards go back to ' + cols[0].name + '.')) return;

    const proj = (typeof kbProj === 'function') ? kbProj() : null;
    if(proj){
      proj.kbCols = cols.filter(function(c){ return c.id !== colId; });
      Object.keys(proj.kanban || {}).forEach(function(k){ if(proj.kanban[k] === colId) delete proj.kanban[k]; });
    }
    if(typeof save === 'function') save();
    const r = document.getElementById('page-kanban');
    if(r) PAGE_RENDERERS.kanban(r);
  };
})();

/* while a card is in the air every list is on screen, so it can be dropped
   on a list that normally sits on the next page of the board */
(function(){
  document.addEventListener('dragstart', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('.kb-card')) return;
    const board = document.getElementById('kbBoard');
    if(!board) return;
    board.classList.add('kb-dragging');
    Array.prototype.slice.call(board.querySelectorAll('.kb-col')).forEach(function(c){ c.style.display = ''; });
  }, true);

  document.addEventListener('dragend', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('.kb-card')) return;
    const board = document.getElementById('kbBoard');
    if(board) board.classList.remove('kb-dragging');
    const root = document.getElementById('page-kanban');
    if(root) setTimeout(function(){ PAGE_RENDERERS.kanban(root); }, 0);
  }, true);
})();

/* ── 12 · swipe between pages ──
   Push the pointer to the right edge of the window and the paged view moves
   on a page; the left edge goes back. On a touch screen a horizontal swipe
   does the same. Works on every view that has a chevron pager — Draft,
   Outline, Kanban, Bible and Idea. ── */
(function(){
  const EDGE = 22;        /* how close to the window edge the pointer must get */
  const COOL = 620;       /* ms between two steps */
  const NEXT = '[data-pg-step="1"], [data-draft-page="1"], [data-bb-page="1"], [data-idea-page="1"]';
  const PREV = '[data-pg-step="-1"], [data-draft-page="-1"], [data-bb-page="-1"], [data-idea-page="-1"]';

  const active = function(){
    return document.querySelector('.page.active') || document.querySelector('.page.on');
  };
  const busy = function(){
    const modal = document.getElementById('modalRoot');
    if(modal && modal.classList.contains('open')) return true;
    const ov = document.querySelector('.pages-overlay');
    if(ov && !ov.hidden && ov.offsetParent !== null) return true;
    /* never swipe out from under a drag */
    if(document.body.classList.contains('ol-dragging')) return true;
    const board = document.getElementById('kbBoard');
    if(board && board.classList.contains('kb-dragging')) return true;
    return false;
  };

  let last = 0, armed = true;
  const step = function(dir){
    const now = Date.now();
    if(now - last < COOL) return;
    if(busy()) return;
    const page = active();
    if(!page) return;
    /* the board is paged by its own chevrons — swiping it fought with
       dragging a card onto the next page of lists */
    if(page.id === 'page-kanban') return;
    const btn = page.querySelector(dir > 0 ? NEXT : PREV);
    if(!btn || btn.disabled) return;
    last = now;
    btn.click();
  };

  document.addEventListener('mousemove', function(e){
    const w = window.innerWidth || 1200;
    const x = e.clientX;
    const right = x >= w - EDGE;
    const left  = x <= EDGE;
    if(!right && !left){ armed = true; return; }
    if(!armed) return;
    armed = false;
    step(right ? 1 : -1);
  }, true);

  let tx = 0, ty = 0, tt = 0;
  document.addEventListener('touchstart', function(e){
    if(!e.touches || e.touches.length !== 1) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now();
  }, { passive:true, capture:true });

  document.addEventListener('touchend', function(e){
    const t = e.changedTouches && e.changedTouches[0];
    if(!t) return;
    if(Date.now() - tt > 700) return;
    const dx = t.clientX - tx;
    const dy = t.clientY - ty;
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    step(dx < 0 ? 1 : -1);
  }, { passive:true, capture:true });
})();

/* ── 13 · Settings button — left-click opens Settings, right-click opens
   the Advanced panel: the four writer switches plus working options that
   jump into the matching places of the big Settings sheet. ── */
(function(){
  const applyCfg = function(k){
    try{ if(typeof applyConfig === 'function') applyConfig(k); }catch(e){}
  };

  const ROWS = [
    { icon:'layout-split', name:'Overlay',               desc:'Floating pane over the whole app',
      get:function(){ return !!S.config.expOverlay; },
      set:function(v){ S.config.expOverlay = v; },
      apply:function(){ applyCfg('expOverlay'); } },
    { icon:'list-nested',  name:'Remixing',              desc:'Tidy your text into proper paragraphs',
      get:function(){ return !!S.config.expOrganize; },
      set:function(v){ S.config.expOrganize = v; },
      apply:null },
    { icon:'translate',    name:'What you like',         desc:'Hindi ⇄ English',
      get:function(){ return !!(S.config.plugins && S.config.plugins.hinglish); },
      set:function(v){ S.config.plugins = S.config.plugins || {}; S.config.plugins.hinglish = v; },
      apply:null },
    { icon:'fonts',        name:'Intermixing',           desc:'Your three fonts take turns as you type',
      get:function(){ return !!S.config.expMixedFonts; },
      set:function(v){ S.config.expMixedFonts = v; },
      apply:function(){ applyCfg('expMixedFonts'); } }
  ];

  /* The inline settings that live under each switch — a switch alone is
     not enough: each feature gets its real controls right here. */
  const SUBS = [
    { /* Overlay */
      html:function(){
        return '<span class="sf-adv-sub-label">Overlay settings</span>'
          + '<div class="sf-adv-sub-row"><label>Width</label>'
          + '<select class="sel" data-adv-w="1">'
          + [480,560,640,760,900].map(function(w){
              return '<option value="'+w+'"'+((S.config.overlay&&S.config.overlay.w)===w?' selected':'')+'>'+w+' px</option>';
            }).join('')
          + '</select></div>'
          + '<div class="sf-adv-sub-row"><label>Height</label>'
          + '<select class="sel" data-adv-h="1">'
          + [320,420,500,600].map(function(h){
              return '<option value="'+h+'"'+((S.config.overlay&&S.config.overlay.h)===h?' selected':'')+'>'+h+' px</option>';
            }).join('')
          + '</select></div>'
          + '<button type="button" class="sf-adv-sub-btn" data-adv-fix="1"><i class="bi bi-arrow-clockwise"></i> Reset position to screen centre</button>';
      } },
    { /* Remixing */
      html:function(){
        return '<span class="sf-adv-sub-label">Remixing</span>'
          + '<p class="sf-adv-sub-note">Runs on the text in the editor — your own words, just tidied into clear paragraphs.</p>'
          + '<button type="button" class="sf-adv-sub-btn" data-adv-org="1"><i class="bi bi-list-nested"></i> Organise the text now</button>';
      } },
    { /* What you like */
      html:function(){
        const t = (S.config.liveBarTarget === 'english') ? 'english' : 'devanagari';
        return '<span class="sf-adv-sub-label">What you like</span>'
          + '<div class="sf-adv-sub-row"><label>Transliterate into</label>'
          + '<select class="sel" data-adv-live="1">'
          + '<option value="devanagari"'+(t==='devanagari'?' selected':'')+'>Hindi (देवनागरी)</option>'
          + '<option value="english"'+(t==='english'?' selected':'')+'>English</option>'
          + '</select></div>';
      } },
    { /* Intermixing */
      html:function(){
        if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['','',''];
        const opts = function(cur){
          return '<option value="">Editor font</option>'
            + (window.FONTS || []).map(function(f){
                return '<option value="'+f.name+'"'+(f.name===cur?' selected':'')+'>'+f.name+'</option>';
              }).join('');
        };
        /* three ways only, in this order: letter · word · sentence */
        const SCOPES = ['letter','word','sentence'];
        let sc = S.config.mixedFontScope;
        if(SCOPES.indexOf(sc) < 0) sc = 'letter';
        if(sc !== S.config.mixedFontScope) S.config.mixedFontScope = sc;
        const sel4 = function(v){ return sc === v ? ' selected' : ''; };
        return '<span class="sf-adv-sub-label">Intermixing</span>'
          + '<p class="sf-adv-sub-note">Your three fonts take turns as you type.</p>'
          + [0,1,2].map(function(i){
              return '<div class="sf-adv-sub-row"><label>Font '+(i+1)+'</label>'
                + '<select class="sel" data-adv-font="'+i+'">'+opts(S.config.mixedFonts[i])+'</select></div>';
            }).join('')
          + '<div class="sf-adv-sub-row"><label>Rotate by</label>'
          + '<select class="sel" data-adv-scope="1">'
          + '<option value="letter"'+sel4('letter')+'>Letter randomisation</option>'
          + '<option value="word"'+sel4('word')+'>Word randomisation</option>'
          + '<option value="sentence"'+sel4('sentence')+'>Sentence randomisation</option>'
          + '</select></div>';
      } }
  ];

  /* Working options — none: the switches carry their settings above */
  const OPTS = [];

  let panel = null;
  const openSub = {};

  const build = function(){
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'sf-adv';
    panel.id = 'sfAdv';
    panel.hidden = true;
    panel.innerHTML =
      '<div class="sf-adv-head"><i class="bi bi-sliders"></i><span></span></div>'
      + '<div class="sf-adv-body">' + ROWS.map(function(r, i){
          const sub = SUBS[i] ? SUBS[i].html() : '';
          return '<button type="button" class="sf-adv-row' + (openSub[i] ? ' open' : '') + '" data-adv="' + i + '">'
            + '<span class="sf-adv-ic"><i class="bi bi-' + r.icon + '"></i></span>'
            + '<span class="sf-adv-txt"><b>' + r.name + '</b><em>' + r.desc + '</em></span>'
            + '<span class="sf-adv-caret"><i class="bi bi-chevron-down"></i></span>'
            + '<span class="sf-adv-tgl"></span></button>'
          + '<div class="sf-adv-sub" data-adv-sub="' + i + '">' + sub + '</div>';
        }).join('') + '</div>'
      + (OPTS.length
          ? '<div class="sf-adv-sep"></div>'
            + '<div class="sf-adv-opts">' + OPTS.map(function(o, i){
                return '<button type="button" class="sf-adv-opt" data-adv-opt="' + i + '">'
                  + '<span class="sf-adv-ic"><i class="bi bi-' + o.icon + '"></i></span>'
                  + '<span class="sf-adv-txt"><b>' + o.label + '</b><em>' + o.hint + '</em></span>'
                  + '<span class="sf-adv-go"><i class="bi bi-arrow-right"></i></span></button>';
              }).join('') + '</div>'
          : '');
    document.body.appendChild(panel);
    return panel;
  };

  const paint = function(){
    if(!panel) return;
    ROWS.forEach(function(r, i){
      const row = panel.querySelector('[data-adv="' + i + '"]');
      if(row) row.classList.toggle('on', !!r.get());
    });
  };

  const place = function(anchor){
    const p = build();
    const r = anchor.getBoundingClientRect();
    p.hidden = false;
    const w = p.offsetWidth || 296;
    const vw = window.innerWidth || 1200;
    let left = Math.round(r.right - w);
    left = Math.max(8, Math.min(left, vw - w - 8));
    p.style.left = left + 'px';
    p.style.top  = Math.round(r.bottom + 8) + 'px';
    paint();
  };

  document.addEventListener('contextmenu', function(e){
    const b = e.target && e.target.closest && e.target.closest('[data-act="open-settings"]');
    if(!b) return;
    e.preventDefault();
    e.stopPropagation();
    const p = build();
    if(!p.hidden){ p.hidden = true; return; }
    place(b);
  }, true);

  document.addEventListener('click', function(e){
    const p = build();
    if(p.hidden) return;
    const t = e.target;
    if(!t || !t.closest) return;

    const caret = t.closest('.sf-adv-caret');
    if(caret){
      e.preventDefault();
      e.stopPropagation();
      const row = caret.closest('[data-adv]');
      if(row){
        const i = parseInt(row.dataset.adv, 10);
        openSub[i] = !openSub[i];
        row.classList.toggle('open', !!openSub[i]);
        const sub = panel.querySelector('[data-adv-sub="' + i + '"]');
        if(sub && SUBS[i]) sub.innerHTML = SUBS[i].html();
      }
      return;
    }
    const row = t.closest('[data-adv]');
    if(row){
      e.preventDefault();
      e.stopPropagation();
      const r = ROWS[parseInt(row.dataset.adv, 10)];
      if(!r) return;
      r.set(!r.get());
      if(r.apply) r.apply();
      if(typeof save === 'function') save();
      paint();
      if(typeof renderChapterControls === 'function'){ try{ renderChapterControls(); }catch(err){} }
      return;
    }
    const opt = t.closest('[data-adv-opt]');
    if(opt){
      e.preventDefault();
      e.stopPropagation();
      const o = OPTS[parseInt(opt.dataset.advOpt, 10)];
      if(o){ p.hidden = true; o.run(); }
      return;
    }
    const subBtn = t.closest('[data-adv-fix],[data-adv-org]');
    if(subBtn){
      e.preventDefault(); e.stopPropagation();
      if(subBtn.hasAttribute('data-adv-fix')){
        if(S.config.overlay){ S.config.overlay.x = null; S.config.overlay.y = null; }
        if(typeof save === 'function') save();
        if(window.overlayShow){ overlayShow(true); }
        if(typeof toast === 'function') toast('Overlay re-centred');
      } else {
        p.hidden = true;
        if(window.AI_FNS && window.AI_FNS.organize){ window.AI_FNS.organize(); }
        else if(typeof toast === 'function') toast('Open the editor first', 'warn');
      }
      return;
    }
    if(!t.closest('#sfAdv')) p.hidden = true;
  }, true);

  /* selects inside the inline settings live on change, not click */
  document.addEventListener('change', function(e){
    const t = e.target;
    if(!t || !t.dataset || !panel || panel.hidden) return;
    const saveCfg = function(){ if(typeof save === 'function') save(); };
    if(t.dataset.advW){
      S.config.overlay = S.config.overlay || {};
      S.config.overlay.w = parseInt(t.value, 10) || 640;
      saveCfg(); if(window.overlayShow) overlayShow(true);
    } else if(t.dataset.advH){
      S.config.overlay = S.config.overlay || {};
      S.config.overlay.h = parseInt(t.value, 10) || 420;
      saveCfg(); if(window.overlayShow) overlayShow(true);
    } else if(t.dataset.advLive){
      S.config.liveBarTarget = t.value;
      saveCfg();
    } else if(t.dataset.advFont !== undefined && t.dataset.advFont !== ''){
      const fi = parseInt(t.dataset.advFont, 10);
      if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['','',''];
      S.config.mixedFonts[fi] = t.value;
      saveCfg();
    } else if(t.dataset.advScope){
      /* only the three real modes — “random from the three” is gone */
      const ok = ['letter','word','sentence'];
      S.config.mixedFontScope = ok.indexOf(t.value) >= 0 ? t.value : 'word';
      saveCfg();
      if(typeof renderChapterControls === 'function'){ try{ renderChapterControls(); }catch(err){} }
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel && !panel.hidden) panel.hidden = true;
  }, true);
})();

/* ── 14 · Plan — a visual beat board ──
   Index cards in a grid, one per beat, colour-coded by type — the beat
   board / scene board for a novel or a screenplay. Drag a card to move it.
   `renderBeats()` is replaced, so every existing beat command (add, type,
   text, delete, act, scene, clear) redraws the board. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const TYPES = ['beat','scene','chapter','act','subplot','reveal','action'];
  const TONES = {
    act:'#8b5cf6', scene:'#22c55e', chapter:'#eab308', subplot:'#38bdf8',
    reveal:'#f97316', action:'#f43f5e', beat:'#7c8899'
  };

  const beats = function(){
    const d = (typeof D === 'function') ? D() : null;
    if(!d) return [];
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };

  window.renderBeats = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    const list = beats();

    if(!list.length){
      board.innerHTML = '<div class="beat-empty"><i class="bi bi-columns-gap"></i>'
        + '<div>No beats yet — press <b>Add beat</b> to start the board.</div></div>';
      return;
    }

    board.innerHTML = list.map(function(b, i){
      const tone = TONES[b.type] || TONES.beat;
      return '<article class="beat-card" data-beat-card="' + i + '" style="--beat-tone:' + tone + '">'
        + '<div class="beat-card-head">'
        +   '<span class="beat-grab" title="Drag to move this beat"><i class="bi bi-grip-vertical"></i></span>'
        +   '<span class="beat-index">' + String(i + 1).padStart(2, '0') + '</span>'
        +   '<select class="beat-type" data-beat-type="' + i + '">'
        +     TYPES.map(function(t){
                return '<option value="' + t + '"' + (b.type === t ? ' selected' : '') + '>' + t + '</option>';
              }).join('')
        +   '</select>'
        +   '<button class="beat-del" data-beat-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
        + '</div>'
        + '<textarea class="beat-input" data-beat-text="' + i + '" placeholder="What happens in this beat…">'
        +   esc(b.text || '')
        + '</textarea>'
        + '</article>';
    }).join('');
  };

  /* ── drag a card to a new place on the board ── */
  let dragEl = null, dragIdx = null, dragging = false, sx = 0, sy = 0;

  const cardAt = function(x, y){
    const el = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
    return (el && el.closest) ? el.closest('.beat-card') : null;
  };
  const clearMarks = function(){
    document.querySelectorAll('.beat-card.beat-dragging, .beat-card.beat-over').forEach(function(c){
      c.classList.remove('beat-dragging');
      c.classList.remove('beat-over');
    });
    document.body.classList.remove('ol-dragging');
  };

  const wireBoard = function(root){
    const board = root.querySelector('#beatList');
    if(!board) return;

    board.addEventListener('pointerdown', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      if(t.closest('select, button, textarea, option, .beat-del')) return;
      const card = t.closest('.beat-card');
      if(!card) return;
      dragEl = card;
      dragIdx = parseInt(card.dataset.beatCard, 10);
      dragging = false;
      sx = e.clientX; sy = e.clientY;
      try{ card.setPointerCapture(e.pointerId); }catch(err){}
    });

    board.addEventListener('pointermove', function(e){
      if(!dragEl) return;
      if(!dragging){
        if(Math.abs(e.clientX - sx) < 5 && Math.abs(e.clientY - sy) < 5) return;
        dragging = true;
        dragEl.classList.add('beat-dragging');
        document.body.classList.add('ol-dragging');
      }
      if(e.cancelable) e.preventDefault();
      const over = cardAt(e.clientX, e.clientY);
      document.querySelectorAll('.beat-card.beat-over').forEach(function(c){ if(c !== over) c.classList.remove('beat-over'); });
      if(over && over !== dragEl) over.classList.add('beat-over');
    });

    const finish = function(e, cancelled){
      if(!dragEl) return;
      const wasDragging = dragging;
      const over = (!cancelled && wasDragging) ? cardAt(e.clientX, e.clientY) : null;
      const from = dragIdx;
      const to   = over ? parseInt(over.dataset.beatCard, 10) : null;
      dragEl = null; dragIdx = null; dragging = false;
      clearMarks();
      if(cancelled || !wasDragging || to == null || from == null || from === to || isNaN(to)) return;
      const list = beats();
      const moved = list.splice(from, 1)[0];
      list.splice(Math.max(0, Math.min(to, list.length)), 0, moved);
      if(typeof save === 'function') save();
      window.renderBeats();
    };

    board.addEventListener('pointerup', function(e){ finish(e, false); });
    board.addEventListener('pointercancel', function(e){ finish(e, true); });
  };

  PAGE_RENDERERS.plan = function(root){
    /* The head is the page's own bar — the same box Draft and Idea wear —
       and it sits above the board card, not inside it. */
    root.innerHTML =
      '<div class="page-head ol-head plan-head">'
      +   '<div class="ol-head-left">'
      +     '<button class="ol-btn ol-btn-icon" data-typop="plan" title="Font, size and leading"><i class="bi bi-fonts"></i></button>'
      +     '<button class="ol-btn" data-act="add-beat" title="Add a beat card"><i class="bi bi-plus-lg"></i> Add beat</button>'
      +   '</div>'
      +   '<div class="ol-actions plan-tools">'
      +     '<button class="ol-btn" data-act="add-act" title="Add an act heading"><i class="bi bi-bookmark-star"></i> Add act</button>'
      +     '<button class="ol-btn" data-act="add-scene" title="Add a scene beat"><i class="bi bi-film"></i> Add scene</button>'
      +     '<button class="ol-btn" data-act="clear-beats" title="Remove every beat"><i class="bi bi-eraser"></i> Clear</button>'
      +   '</div>'
      + '</div>'
      + '<div class="plan-wrap">'
      +   '<div class="beat-board" id="beatList"></div>'
      + '</div>';

    renderBeats();
    wireBoard(root);
    if(typeof typoApply === 'function') typoApply('plan', root);
  };
})();

/* ── 15 · Bible opens on the Timeline ── */
(function(){
  try{ _bbTab = 'timeline'; }catch(e){ /* the binding lives in pages.js */ }
})();

/* ── 16 · A menu that knows where you are ──
   The FAB's right-click AI panel used to be the same seven buttons on every
   page. Now each page gets the options that belong to it — Outline titles,
   Idea prompts, Bible memory, board production help, Plan beats — each one
   carrying the whole project as context so the answer is never generic. ── */

/* the project, as the AI needs to see it */
function sfProjectBrief(){
  const d = (typeof D === 'function') ? D() : {};
  const proj = (typeof kbProj === 'function') ? kbProj() : null;
  const out = [];

  out.push('TITLE: ' + ((proj && proj.name) || 'Untitled') +
           '  |  FORM: ' + (S.mode === 'screenplay' ? 'screenplay / script' : 'novel'));

  const structure = [];
  (d.chapters || []).forEach(function(c, i){
    structure.push((i + 1) + '. ' + (c.title || 'Untitled'));
    (c.children || []).forEach(function(s){ structure.push('      - ' + (s.title || 'Untitled')); });
  });
  if(structure.length) out.push('STRUCTURE (chapters and subchapters):\n' + structure.join('\n'));

  const names = function(arr){
    return (arr || []).slice(0, 24).map(function(e){ return e.name || e.title || ''; })
      .filter(Boolean).join(', ');
  };
  const bag = (typeof bbBag === 'function') ? bbBag() : (d.bible || {});
  const bible = [];
  if(names(bag.characters).length) bible.push('Characters: '    + names(bag.characters));
  if(names(bag.locations).length)  bible.push('Locations: '     + names(bag.locations));
  if(names(bag.items).length)      bible.push('Items: '         + names(bag.items));
  if(names(bag.concepts).length)   bible.push('Concepts: '      + names(bag.concepts));
  if(names(d.timeline).length)     bible.push('Timeline: '      + names(d.timeline));
  if(bible.length) out.push('BIBLE:\n' + bible.join('\n'));

  const beats = (d.beats || []).slice(0, 30)
    .map(function(b, i){ return (i + 1) + '. [' + (b.type || 'beat') + '] ' + (b.text || ''); }).join('\n');
  if(beats) out.push('PLAN / BEAT BOARD:\n' + beats);

  const cur = (typeof curCh === 'function') ? curCh() : null;
  if(cur && cur.content){
    const body = String(cur.content).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, 1800);
    if(body) out.push('CURRENT SECTION — "' + (cur.title || 'Untitled') + '":\n' + body);
  }
  return out.join('\n\n');
}

function sfAsk(title, sub, prompt){
  if(typeof runAI === 'function') runAI(prompt, title, sub);
}

/* one line of the FAB menu, with its description under it */
const SF_FAB_OPT = function(o){
  return '<button class="fab-ai-opt" data-fabai="' + o.fn + '" title="' + esc(o.desc) + '">'
    + '<span class="fa-ic"><i class="bi bi-' + o.icon + '"></i></span>'
    + '<span class="fa-txt"><b>' + esc(o.label) + '</b><em>' + esc(o.desc) + '</em></span>'
    + '</button>';
};

const SF_FAB_AI = {
  outline: [
    { fn:'olChapterTitles', icon:'bookmark-fill', label:'Chapter titles',
      desc:'Suggest a title for every chapter, from your outline' },
    { fn:'olSubTitles', icon:'signpost-2', label:'Subchapter titles',
      desc:'Name the subchapters inside each chapter' },
    { fn:'olStructure', icon:'list-nested', label:'Check the order',
      desc:'Is the chapter order working? What should move?' }
  ],
  inspire: [
    { fn:'ideaPromptMe', icon:'lightbulb-fill', label:'Prompt me',
      desc:'A fresh prompt built from this project' },
    { fn:'ideaDevelop', icon:'diagram-3', label:'Develop this idea',
      desc:'Turn the prompt on screen into a scene plan' },
    { fn:'ideaToScene', icon:'camera-reels', label:'Turn into a scene',
      desc:'Write the first paragraphs of the scene' }
  ],
  bible: [
    { fn:'bibleRemember', icon:'journal-bookmark', label:'Remember the whole story',
      desc:'Summarise characters, places, concepts and the timeline' },
    { fn:'bibleGaps', icon:'question-circle', label:'Find the gaps',
      desc:'What does the Bible still not explain?' },
    { fn:'bibleTimeline', icon:'git', label:'Tidy the timeline',
      desc:'Put the timeline entries in a workable order' }
  ],
  kanban: [
    { fn:'kbNext', icon:'kanban', label:'What to write next',
      desc:'Production help — pick the next card from the board' },
    { fn:'kbStatus', icon:'clipboard-check', label:'Board status',
      desc:'Where the draft really stands, list by list' },
    { fn:'kbScenes', icon:'film', label:'Scene order',
      desc:'Arrange the cards into a shooting / writing order' }
  ],
  plan: [
    { fn:'planBeats', icon:'list-check', label:'Beat ideas',
      desc:'Suggest the beats this board is still missing' },
    { fn:'planStructure', icon:'diagram-3', label:'Check the structure',
      desc:'Read the board back — does the story hold?' }
  ]
};

const SF_FAB_DEFAULT = [
  { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
  { fn:'improve',    icon:'stars',               label:'Improve' },
  { fn:'continue',   icon:'arrow-right-circle',  label:'Continue' },
  { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
  { fn:'summarize',  icon:'card-text',           label:'Summarize' },
  { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' }
];

window.renderFabAI = function(){
  const body = document.getElementById('fabAIBody');
  if(!body) return;
  const opts = SF_FAB_AI[S.page];

  if(!opts){
    body.innerHTML = SF_FAB_DEFAULT.map(function(a){
      return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
    }).join('') + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>';
    return;
  }

  body.innerHTML =
    '<div class="fab-ai-sec">For this page</div>'
    + opts.map(SF_FAB_OPT).join('')
    + (S.page === 'bible'
        ? '<div class="fab-ai-ask"><input class="ai-input" data-fabai-input placeholder="Ask about a character, place or event…">'
          + '<button class="ai-chip primary" data-fabai-ask><i class="bi bi-send"></i></button></div>'
        : '')
    + '<div class="fab-ai-sec">Text</div>'
    + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>';
};

document.addEventListener('click', function(e){
  const t = e.target;
  if(!t || !t.closest) return;

  const opt = t.closest('[data-fabai]');
  if(opt){
    e.preventDefault();
    const fn = opt.dataset.fabai;
    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    if(window.AI_FNS && window.AI_FNS[fn]) window.AI_FNS[fn]();
    return;
  }
  const ask = t.closest('[data-fabai-ask]');
  if(ask){
    e.preventDefault();
    const box = document.querySelector('[data-fabai-input]');
    const q = box ? box.value.trim() : '';
    if(!q) return;
    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    if(window.AI_FNS && window.AI_FNS.bibleAsk) window.AI_FNS.bibleAsk(q);
  }
}, true);

/* ── the page-aware actions themselves ── */
(function(){
  const F = (window.AI_FNS = window.AI_FNS || {});

  F.olChapterTitles = function(){
    sfAsk('Chapter titles', 'From your outline',
      'You are a story editor helping a writer name their chapters.\n\n' +
      sfProjectBrief() + '\n\n' +
      'Task: suggest one strong, specific chapter title for EVERY chapter in the structure above.\n' +
      'Rules: 2–5 words each, evocative, no numbers in the title, same voice across all of them, and do not invent chapters that are not listed.\n' +
      'Reply as a plain list — "chapter number. title" — and nothing else.');
  };

  F.olSubTitles = function(){
    sfAsk('Subchapter titles', 'From your outline',
      'You are a story editor helping a writer name their subchapters (the scenes inside each chapter).\n\n' +
      sfProjectBrief() + '\n\n' +
      'Task: for every chapter above that has subchapters, suggest a title for each subchapter.\n' +
      'Rules: 2–5 words, concrete, in the same voice; keep them in the order they appear.\n' +
      'Reply as a plain list — "chapter — subchapter: title" — and nothing else.');
  };

  F.olStructure = function(){
    sfAsk('Structure check', 'Outline',
      'You are a developmental editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: read the chapter and subchapter order above and tell the writer, plainly and briefly:\n' +
      '1. what is working in the order,\n2. which chapter or subchapter is in the wrong place, and where it should go,\n3. the single change that would help most.\n' +
      'Keep it under 250 words. No praise padding.');
  };

  F.ideaDevelop = function(){
    const idea = (window.SF_IDEA && window.SF_IDEA.current()) || '';
    sfAsk('Developing the idea', 'Idea → scene plan',
      'You are a story developer.\n\n' + sfProjectBrief() + '\n\n' +
      'The idea on the table is:\n"' + (idea || '(none yet — propose one)') + '"\n\n' +
      'Task: turn it into a short scene plan for THIS project — who is in it, what they want, what goes wrong, how it ends.\n' +
      'Use the characters and places already in the Bible wherever you can. Under 250 words.');
  };

  F.ideaToScene = function(){
    const idea = (window.SF_IDEA && window.SF_IDEA.current()) || '';
    sfAsk('Writing the scene', 'Idea → draft',
      'You are a novelist drafting prose in the writer\'s own project.\n\n' + sfProjectBrief() + '\n\n' +
      'Write the opening of a scene based on this idea:\n"' + (idea || '(choose something that fits the story)') + '"\n\n' +
      'Rules: plain, concrete prose; no headings; about 300 words; leave the scene mid-motion.');
  };

  F.bibleRemember = function(){
    sfAsk('The whole story', 'Bible',
      'You are the keeper of this story\'s bible.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: write a compact memory of this story that another writer could pick up:\n' +
      'the cast (one line each), the places that matter, the timeline in order, and the threads still open.\n' +
      'Only use what is above — never invent a name that is not there. Under 400 words.');
  };

  F.bibleGaps = function(){
    sfAsk('Gaps in the Bible', 'Bible',
      'You are a continuity editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: list what this story bible still does not explain — unnamed characters who matter, places with no description,\n' +
      'timeline holes, motives missing for anyone in the cast. Give each gap as one line, most important first.');
  };

  F.bibleTimeline = function(){
    sfAsk('Timeline order', 'Bible',
      'You are a continuity editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: take the timeline entries above and return them in the order the reader should learn them,\n' +
      'then note any entry that contradicts another. Keep it short and concrete.');
  };

  F.bibleAsk = function(q){
    sfAsk('Answering from the Bible', 'Your question',
      'You are answering a writer about their own story bible.\n\n' + sfProjectBrief() + '\n\n' +
      'Question: ' + q + '\n\n' +
      'Answer from the bible above. If the answer is not in it, say what is missing and suggest the entry to add.\n' +
      'Never invent established facts. Be brief.');
  };

  F.kbNext = function(){
    sfAsk('What to write next', 'Production',
      'You are a production editor for this book.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: from the board and the structure above, name the ONE section the writer should work on next and why (two lines),\n' +
      'then three things to do in it. Be decisive — give one answer, not a menu.');
  };

  F.kbStatus = function(){
    sfAsk('Board status', 'Kanban',
      'You are a production editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: report where this draft actually stands — what is done, what is stuck, what has not been started,\n' +
      'and where the bottleneck is. Under 250 words, plain sentences.');
  };

  F.kbScenes = function(){
    sfAsk('Scene order', 'Kanban',
      'You are a story editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: arrange the sections above into the order they should be written (not read), grouping them so that\n' +
      'each writing session has a clear goal. Give the list, then one line of reasoning.');
  };

  F.planBeats = function(){
    sfAsk('Missing beats', 'Plan',
      'You are a story editor working on a beat board.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: name the beats this board is still missing — the turn, the midpoint, the low point, the resolution —\n' +
      'and for each one say in a line what should happen. Match the beat types already on the board.');
  };

  F.planStructure = function(){
    sfAsk('Structure check', 'Plan',
      'You are a story editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: read the beat board back to the writer and say whether the story holds — what escalates, what repeats,\n' +
      'what is missing. End with the one beat to add next. Under 250 words.');
  };
})();

/* ── 17 · Idea — the prompt is written for THIS project ──
   The five category chips are gone from the page; they moved into the small
   AI settings popover beside “Prompt me”. Saved prompts now carry a title. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const FOCUS = [
    { id:'any',       name:'Any',       icon:'shuffle' },
    { id:'scene',     name:'Scene',     icon:'camera-reels' },
    { id:'character', name:'Character', icon:'person' },
    { id:'dialogue',  name:'Dialogue',  icon:'chat-quote' },
    { id:'structure', name:'Structure', icon:'diagram-3' }
  ];
  const TONES = ['Creative','Dramatic','Playful','Poetic','Simple','Dark'];

  const cfg = function(){
    if(!S.config.ideaAI) S.config.ideaAI = {};
    if(!S.config.ideaAI.focus) S.config.ideaAI.focus = 'any';
    if(!S.config.ideaAI.tone)  S.config.ideaAI.tone  = 'Creative';
    return S.config.ideaAI;
  };

  const saved = function(){
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts.map(function(p){
      return (typeof p === 'string') ? { title:'', text:p } : p;
    });
  };

  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '…' : t) || 'Untitled prompt';
  };

  let current = '';
  let page = 0;
  window.SF_IDEA = { current:function(){ return current; } };

  const showPrompt = function(){ if(SF_IDEA_DRAW) SF_IDEA_DRAW(); };

  let SF_IDEA_DRAW = null;

  const copyText = function(txt){
    txt = String(txt || '');
    if(!txt) return;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        if(typeof toast === 'function') toast('Copied');
        return;
      }
    }catch(e){}
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); if(typeof toast === 'function') toast('Copied'); }catch(e){}
    ta.remove();
  };

  const perPage = function(){
    const rows = document.getElementById('ideaRows');
    return Math.max(2, Math.floor(((rows && rows.clientHeight) || 0) / 62) || 5);
  };

  const renderSaved = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    const list = saved();
    const per  = perPage();
    const pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const from = page * per;
    const slice = list.slice(from, from + per);

    if(from > 0 && !slice.length && list.length){ page = 0; return renderSaved(); }

    box.innerHTML = slice.length
      ? slice.map(function(p, k){
          const i = from + k;
          const t = p.title || titleOf(p.text);
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-txt"><b>' + esc(t) + '</b>'
            +   '<em>' + esc(p.text) + '</em></span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>';

    const count = document.getElementById('ideaCount');
    if(count) count.textContent = String(list.length);
    const range = document.getElementById('ideaRange');
    if(range) range.textContent = list.length ? ((from + 1) + '–' + Math.min(from + per, list.length)) : '0';
    const prev = document.querySelector('#page-inspire [data-idea-page="-1"]');
    const next = document.querySelector('#page-inspire [data-idea-page="1"]');
    if(prev) prev.disabled = page <= 0;
    if(next) next.disabled = page >= pages - 1;
  };

  const AISET = function(){
    const c = cfg();
    return '<div class="idea-ai-pop" id="ideaAIPop" hidden>'
      + '<div class="iap-head"><i class="bi bi-sliders"></i><span>Prompt AI</span></div>'
      + '<div class="iap-row"><label>Focus</label>'
      + '<select class="sel" data-iap-focus>'
      + FOCUS.map(function(f){ return '<option value="' + f.id + '"' + (c.focus === f.id ? ' selected' : '') + '>' + f.name + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="iap-row"><label>Tone</label>'
      + '<select class="sel" data-iap-tone>'
      + TONES.map(function(t){ return '<option' + (c.tone === t ? ' selected' : '') + '>' + t + '</option>'; }).join('')
      + '</select></div>'
      + '<p class="iap-note">Used only by <b>Prompt me</b> on this page — the global AI settings and the Draft chat are untouched.</p>'
      + '</div>';
  };

  PAGE_RENDERERS.inspire = function(root){
    root.innerHTML =
      '<div class="idea-wrap">'
      + '<section class="idea-main">'
      +   '<div class="idea-bar">'
      +     '<div class="idea-bar-left">'
      +       '<button class="ol-btn ol-btn-go" data-idea="prompt" title="Ask the AI for a prompt built from this project">'
      +         '<i class="bi bi-stars"></i> Prompt me</button>'
      +       '<div class="idea-ai-wrap">'
      +         '<button class="ol-btn ol-btn-icon" data-idea="ai-set" title="Prompt AI settings"><i class="bi bi-sliders"></i></button>'
      +         AISET()
      +       '</div>'
      +     '</div>'
      +     '<div class="idea-tools">'
      +       '<button class="ol-btn ol-btn-icon" data-idea="copy" title="Copy this prompt"><i class="bi bi-clipboard"></i></button>'
      +       '<button class="ol-btn ol-btn-icon" data-idea="save" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i></button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="idea-card" id="inspireBox"></div>'
      + '</section>'
      + '<aside class="idea-side">'
      +   '<div class="idea-side-head"><i class="bi bi-bookmark"></i><span>Saved prompts</span><em id="ideaCount">0</em></div>'
      +   '<div class="idea-rows" id="ideaRows"></div>'
      +   '<div class="idea-pager">'
      +     '<button class="mv-pager-btn" data-idea-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>'
      +     '<span class="vpl-range" id="ideaRange">0</span>'
      +     '<button class="mv-pager-btn" data-idea-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>'
      +   '</div>'
      + '</aside>'
      + '</div>';

    if(!current) current = window.SF_PICK || '';
    showPrompt();
    renderSaved();
  };

  /* draw the card (and keep a plain-text copy of what is on it) */
  let paint = function(){};
  paint = function(){
    const box = document.getElementById('inspireBox');
    if(!box) return;
    box.innerHTML = current
      ? '<p>' + esc(current) + '</p>'
      : '<p class="idea-ghost">Press <b>Prompt me</b> — the AI writes a prompt from your own outline, bible and draft.</p>';
  };
  SF_IDEA_DRAW = paint;

  const ask = async function(){
    const box = document.getElementById('inspireBox');
    const c = cfg();
    const focus = (FOCUS.filter(function(f){ return f.id === c.focus; })[0] || FOCUS[0]).name;
    if(box) box.innerHTML = '<p class="idea-busy"><i class="bi bi-stars"></i> Thinking…</p>';
    try{
      const res = await callAI(
        'You write writing prompts for one specific project.\n\n' + sfProjectBrief() + '\n\n' +
        'Task: write ONE fresh, specific prompt for this writer.\n' +
        'Focus: ' + focus + '.  Tone: ' + c.tone + '.\n' +
        'Rules: under 40 words, one idea only, no numbering, no preamble, use the names and places from the project when they fit.\n' +
        'Return only the prompt.');
      current = res.trim();
    }catch(err){
      current = '';
      if(box) box.innerHTML = '<p class="idea-err"><i class="bi bi-exclamation-triangle"></i> ' + esc(err.message) + '</p>';
      return;
    }
    paint();
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-idea="prompt"]')){ e.preventDefault(); ask(); return; }

    if(t.closest('[data-idea="ai-set"]')){
      e.preventDefault();
      const pop = document.getElementById('ideaAIPop');
      if(pop) pop.hidden = !pop.hidden;
      return;
    }
    if(t.closest('#page-inspire') && !t.closest('.idea-ai-wrap')){
      const pop = document.getElementById('ideaAIPop');
      if(pop && !pop.hidden) pop.hidden = true;
    }

    if(t.closest('[data-idea-page]')){
      e.preventDefault();
      page = Math.max(0, page + (parseInt(t.closest('[data-idea-page]').dataset.ideaPage, 10) || 1));
      renderSaved();
      return;
    }
    if(t.closest('[data-idea="copy"]')){ e.preventDefault(); copyText(current); return; }
    if(t.closest('[data-idea="save"]')){
      e.preventDefault();
      if(!current){ if(typeof toast === 'function') toast('Nothing to save yet', 'warn'); return; }
      const list = saved();
      if(list.some(function(p){ return p.text === current; })){ if(typeof toast === 'function') toast('Already saved'); return; }
      list.unshift({ title:titleOf(current), text:current });
      S.config.savedPrompts = list;
      page = 0;
      if(typeof save === 'function') save();
      renderSaved();
      if(typeof toast === 'function') toast('Prompt saved');
      return;
    }
    const cp = t.closest('[data-idea-copy]');
    if(cp){
      e.preventDefault(); e.stopPropagation();
      const p = saved()[parseInt(cp.dataset.ideaCopy, 10)];
      if(p) copyText(p.text);
      return;
    }
    const del = t.closest('[data-idea-del]');
    if(del){
      e.preventDefault(); e.stopPropagation();
      const list = saved();
      list.splice(parseInt(del.dataset.ideaDel, 10), 1);
      S.config.savedPrompts = list;
      if(typeof save === 'function') save();
      renderSaved();
      return;
    }
    const open = t.closest('[data-idea-open]');
    if(open){
      e.preventDefault();
      const p = saved()[parseInt(open.dataset.ideaOpen, 10)];
      if(p){ current = p.text; paint(); }
    }
  }, true);

  document.addEventListener('change', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;
    if(t.dataset.iapFocus){ cfg().focus = t.value; if(typeof save === 'function') save(); }
    if(t.dataset.iapTone){  cfg().tone  = t.value; if(typeof save === 'function') save(); }
  }, true);
})();

/* ── 18 · Plan — the head keeps only T and Board ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;
  const orig = PAGE_RENDERERS.plan;

  /* every beat-type select wears the app’s dropdown skin */
  const skin = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    Array.prototype.slice.call(board.querySelectorAll('select.beat-type')).forEach(function(s){
      s.classList.add('tb-select');
    });
  };
  if(typeof window.renderBeats === 'function'){
    const rb = window.renderBeats;
    window.renderBeats = function(){
      const r = rb.apply(this, arguments);
      skin();
      return r;
    };
  }

  PAGE_RENDERERS.plan = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    /* the three tool buttons and Clear are gone; a single grey Board
       button sits to the right of T and adds the next card */
    const left = root.querySelector('.plan-head .ol-head-left') || root.querySelector('.ol-head-left');
    const toRight = root.querySelector('.plan-head .ol-actions') || root.querySelector('.plan-tools');
    if(toRight) toRight.remove();
    if(left){
      Array.prototype.slice.call(left.children).forEach(function(c){
        if(!c.hasAttribute('data-typop')) c.remove();
      });
      if(!left.querySelector('[data-act="add-beat"]')){
        const b = document.createElement('button');
        b.className = 'ol-btn';
        b.setAttribute('data-act', 'add-beat');
        b.title = 'Add the next card to the board';
        b.innerHTML = '<i class="bi bi-columns-gap"></i> Board';
        left.appendChild(b);
      }
    }
    skin();
  };
})();

/* ── 19 · Kanban — the All-lists switch has nothing left to do ── */
(function(){
  const drop2 = function(){
    const sw = document.querySelector('[data-kb-all]');
    if(sw && sw.parentElement) sw.parentElement.removeChild(sw);
  };
  drop2();
  document.addEventListener('click', drop2, true);
})();
