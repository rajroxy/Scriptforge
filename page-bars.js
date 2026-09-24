/* ═══════════════════════════════════════════════════════════
   page-bars.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · page-bars.js
     · idea-cards.js
     · dash.js
     · plan-head.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ page-bars.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — page bars

   One bar for every page, the same box the Idea page uses:

     Draft    · New draft · New Chat                   (build here)
     Outline  · T · New chapter · New subchapter       … Expand / Collapse
     Plan     · T · Add beat                           … Add act / scene / Clear
     Bible    · T · New entry                          … category tabs
     Kanban   · T · New list                           … Reset board
     Canvas   · New card · Fit                         … zoom · Clear

   Draft has no header of its own, so its bar is built here. The other
   five already have a header row — that row is renamed into a bar: it
   gets the bar classes and a small label in front, and every page keeps
   its own buttons (nothing is re-wired, the handlers are delegated).
   ═══════════════════════════════════════════════════════════ */

/* ── the five pages whose own header row becomes a bar ── */
(function(){
  const HEADS = {
    outline: { label:'Outline', icon:'list-nested' },
    plan:    { label:'Plan',    icon:'list-check' },
    bible:   { label:'Bible',   icon:'journal-bookmark' },
    kanban:  { label:'Kanban',  icon:'kanban' },
    mindmap: { label:'Canvas',  icon:'diagram-3' }
  };

  const bar = function(page){
    const root = document.getElementById('page-' + page);
    if(!root) return;
    const head = root.querySelector('.page-head');
    if(!head) return;

    head.classList.add('sf-bar-page');
    /* the page's own title block is not part of a bar */
    Array.prototype.forEach.call(head.querySelectorAll('.page-title, .page-sub'), function(el){
      el.style.display = 'none';
    });

    /* the page's name is not written on the bar — the bar holds the
       page's own buttons and nothing else */
    Array.prototype.forEach.call(head.querySelectorAll('.sf-bar-label'), function(el){ el.remove(); });
  };

  const sweep = function(){ Object.keys(HEADS).forEach(bar); };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; sweep(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('resize', schedule);
  document.addEventListener('click', schedule, true);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();

(function(){
  const PAGE = 'draft';   /* The bar holds New draft while you are writing, and New Chat while
     the draft chat is up — the same slot, one at a time. New draft calls the
     app's own action directly: the old delegated click pointed at a + this bar
     had already replaced. While an AI panel or the chat is up, the bar stays
     and New draft steps aside. */
  const ACTS = [
    { icon:'plus-lg',   t:'New draft', act:'tools:addDraft' },
    { icon:'chat-dots', t:'New Chat',  act:'chat:new', chat:true }
  ];

  const build = function(){
    const bar = document.createElement('div');
    bar.className = 'sf-bar';
    bar.dataset.sfBar = PAGE;
    bar.innerHTML =
      ACTS.map(function(a){
          return '<button class="ol-btn"' + (a.chat ? ' data-sfbar-chat="1"' : '') + ' data-sfbar="' + a.act + '">'
               + '<i class="bi bi-' + a.icon + '"></i> ' + a.t + '</button>';
        }).join('');
    return bar;
  };

  const apply = function(){
    const page = (typeof S !== 'undefined' && S.page) || '';
    const root = document.getElementById('page-' + page);

    /* The bar this file builds only ever lives on its own page. It must
       NOT touch another layer's bar: the script page builds its own bar
       with the same .sf-bar class, and a sweep that removed every .sf-bar
       off this page deleted the script's bar on every repaint. Only the
       bars carrying data-sf-bar are this file's. */
    Array.prototype.slice.call(document.querySelectorAll('.sf-bar[data-sf-bar]')).forEach(function(b){
      if(page !== PAGE || b.parentElement !== root) b.remove();
    });
    if(page !== PAGE || !root) return;
    if(root.querySelector(':scope > .sf-bar')) return;
    root.insertBefore(build(), root.firstChild);
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; apply(); });
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-sfbar]');
    if(!btn) return;
    e.preventDefault();
    const what = btn.dataset.sfbar;
    if(what.indexOf('ai:') === 0){
      const fn = what.slice(3);
      if(window.AI_FNS && window.AI_FNS[fn]) window.AI_FNS[fn]();
      else if(typeof toast === 'function') toast('That action is not available here', 'warn');
      return;
    }
    if(what === 'tools:addDraft'){
      /* New draft goes through the app's OWN action — the one behind the “+”
         on the page — so the new draft is the selected one and the title is
         focused, exactly as it is when the page's own button is used. The
         action is bound to a hidden stand-in; the bar's button only asks. */
      const ghost = document.createElement('button');
      ghost.type = 'button';
      ghost.setAttribute('data-act', 'add-draft');
      ghost.style.display = 'none';
      document.body.appendChild(ghost);
      ghost.click();
      ghost.remove();
      return;
    }
    if(what.indexOf('tools:') === 0){
      const fn = what.slice(6);
      const T = window.TOOLS;
      if(T && typeof T[fn] === 'function') T[fn]();
      else if(typeof toast === 'function') toast('That action is not available here', 'warn');
      return;
    }
    if(what.indexOf('chat:') === 0){
      const fn = what.slice(5);
      const DC = window.DraftChat;
      if(!DC){ toast && toast('The draft chat is not available here', 'warn'); return; }
      const on = !!(document.querySelector('#page-draft.dc-on') ||
                    document.querySelector('#page-draft [data-dc="1"]'));
      if(fn === 'new'){
        if(!on && DC.open) DC.open();      /* the chat view has to exist first */
        if(DC.newChat) DC.newChat();
        if(DC.render) DC.render();
        return;
      }
      if(fn === 'toggle'){ if(on && DC.close) DC.close(); else if(DC.open) DC.open(); }
      else if(fn === 'open' && DC.open) DC.open();
      return;
    }
    const target = document.querySelector(what.slice(6));
    if(target) target.click();
  }, true);

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();


/* ══════════ idea-cards.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Idea page.

   · Six cards, and every one of them is the writer’s own: write your prompt
     in a card. Nothing is written for you and nothing is sent anywhere —
     there is no AI on this page. The page’s AI is the round button’s
     right-click, which is the app’s own panel.
   · A card is a VIEW. The prompt sits there to be read, not typed over; the
     pencil on the card opens it for writing and it closes again the moment
     you click away. What you write lives with the project, so the cards are
     still full when you come back to them.
   · Copy and paste are one right-click, anywhere in the app:
       right-click a saved prompt   → its label is copied
       right-click a prompt in a card → the prompt is copied
       right-click an empty box     → what was copied goes in
     The app’s own writing menu and the browser’s own menu still open
     wherever there is nothing of ours to do.
   · Saving asks for a name first — the title typed in that little window is
     what the Saved prompts column shows.
   · In the column, a click opens a prompt in the card you are on, the row’s
     own pencil renames it, and Remove stays where it was.
   · The bar carries Genres · Tags, and Clear at its right end — Clear takes
     the prompt out of the card you are on.
   · Every dropdown on the Plan board (each beat’s type) wears the app’s own
     dropdown card.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.inspire !== 'function') return;

  const CARDS = 6;                    /* six cards to write in */
  let sel = 0;                        /* the card you are on */
  let editing = -1;                   /* the card open for writing (−1 = none) */
  let clip = '';                      /* what the right-click last copied */

  const esc2 = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
  };

  const toastIt = function(msg, kind){
    try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){}
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  /* ── what is written in the cards lives with the project ── */
  const store = function(){
    if(typeof S === 'undefined') return null;
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.ideaCards)) S.config.ideaCards = [];
    for(let i = 0; i < CARDS; i++){
      if(typeof S.config.ideaCards[i] !== 'string') S.config.ideaCards[i] = '';
    }
    return S.config.ideaCards;
  };

  const saveSoon = (typeof debounce === 'function')
    ? debounce(function(){ saveIt(); }, 400)
    : saveIt;

  /* the card’s own text — the prompt, exactly as the writer wrote it */
  const wordsOf = function(i){
    const list = store();
    return list ? String(list[i] || '').trim() : '';
  };

  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '\u2026' : t) || 'Untitled prompt';
  };

  /* ═══ COPY & PASTE, BY RIGHT-CLICK ═══
     One clipboard of our own holds what the writer last copied; the system
     clipboard is written too, so a paste into another app still works. */
  const copyBlock = function(txt, what){
    txt = String(txt == null ? '' : txt);
    if(!txt.trim()){ toastIt('Nothing to copy', 'warn'); return; }
    clip = txt;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
    }catch(e){ /* the app’s own clipboard is enough for our paste */ }
    toastIt('Copied ' + what);
  };

  const copyText = function(txt){
    txt = String(txt == null ? '' : txt);
    if(!txt.trim()){ toastIt('Write something first', 'warn'); return; }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        toastIt('Copied');
        return;
      }
    }catch(e){ /* fall through to the old path */ }
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toastIt('Copied'); }catch(e){}
    ta.remove();
  };

  /* the box a paste may land in: a plain field, never one that is read-only
     (a card in view mode is read-only, and that is the whole point) */
  const PLAIN = /^(text|search|url|email|tel|password|number|)$/i;
  const fieldOf = function(el){
    if(!el || !el.tagName) return null;
    if(el.isContentEditable) return el;
    if(el.tagName === 'TEXTAREA') return el;
    if(el.tagName === 'INPUT' && PLAIN.test(el.type || '')) return el;
    return null;
  };
  const isBlank = function(el){
    if(!el) return false;
    if(el.isContentEditable) return !String(el.textContent || '').trim();
    return !String(el.value || '').trim();
  };
  const pasteInto = function(el, txt){
    if(el.isContentEditable){
      try{
        el.focus();
        document.execCommand('insertText', false, txt);
        return true;
      }catch(e){ return false; }
    }
    const v = String(el.value || '');
    const from = (typeof el.selectionStart === 'number') ? el.selectionStart : v.length;
    const to   = (typeof el.selectionEnd   === 'number') ? el.selectionEnd   : from;
    el.value = v.slice(0, from) + txt + v.slice(to);
    const at = from + txt.length;
    try{ el.setSelectionRange(at, at); }catch(e){}
    try{ el.focus(); }catch(e){}
    try{ el.dispatchEvent(new Event('input',  { bubbles:true })); }catch(e){}
    try{ el.dispatchEvent(new Event('change', { bubbles:true })); }catch(e){}
    return true;
  };

  /* ═══ THE SAVED PROMPTS LIST ═══
     One line per prompt — its title and nothing else — and two things are
     done by hand: the row’s own button is the Rename pencil (copying a row
     is the right-click), and the prompt itself is never printed there.

     Two other layers draw these rows (pages-fix.js writes them, no-pager.js
     re-fills them), so the dressing runs again on every change to the column
     and is written to be harmless the second time. */
  const savedEntries = function(){
    if(typeof S === 'undefined') return [];
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts;
  };

  const entryText = function(entry){
    if(entry == null) return '';
    return (typeof entry === 'string') ? entry : String(entry.text || '');
  };
  const entryTitle = function(entry){
    if(entry == null) return '';
    return (typeof entry === 'string') ? titleOf(entry) : (entry.title || titleOf(entry.text));
  };

  const dressRow = function(row){
    /* the prompt itself is not shown in the list — its title is the row */
    const txt = row.querySelector('.idea-row-txt');
    if(txt){
      Array.prototype.forEach.call(txt.querySelectorAll('em, .idea-row-text'), function(el){ el.remove(); });
    }
    /* the row’s button becomes the Rename pencil: a copy of the row is a
       right-click now, so the button that used to copy has nothing to do */
    Array.prototype.forEach.call(row.querySelectorAll('[data-idea-copy]'), function(b){
      b.removeAttribute('data-idea-copy');
      b.setAttribute('data-idea-ren', '1');
      b.title = 'Rename';
      const ic = b.querySelector('i');
      if(ic) ic.className = 'bi bi-pencil';
    });
    row.setAttribute('title', 'Right-click to copy its label · Click to open it in the card');
  };

  const dressList = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-inspire #ideaRows [data-idea-open]'), dressRow);
  };

  let listSeen = null, listWatch = null;
  const watchList = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    if(box !== listSeen){
      if(listWatch) listWatch.disconnect();
      listSeen = box;
      if(typeof MutationObserver === 'function'){
        listWatch = new MutationObserver(dressList);
        listWatch.observe(box, { childList:true, subtree:true });
      }
    }
    dressList();
  };

  /* ── rename: the row’s pencil edits its title in place ── */
  const startRename = function(row){
    if(!row || row.querySelector('.idea-rename')) return;
    const i = parseInt(row.dataset.ideaOpen, 10);
    if(isNaN(i)) return;
    const b = row.querySelector('b');
    if(!b) return;
    const cur = entryTitle(savedEntries()[i]);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'idea-rename';
    input.value = cur;
    input.setAttribute('data-idea-ren-input', String(i));
    b.parentNode.replaceChild(input, b);
    input.focus();
    input.select();
  };

  const endRename = function(input, revert){
    if(!input || input.dataset.ideaRenDone) return;
    input.dataset.ideaRenDone = '1';
    const i = parseInt(input.dataset.ideaRenInput, 10);
    const entry = savedEntries()[i];
    let title = '';

    if(entry !== undefined && !isNaN(i)){
      const text = entryText(entry);
      if(!revert){
        title = String(input.value || '').replace(/\s+/g, ' ').trim();
        if(title){
          if(typeof entry === 'string') savedEntries()[i] = { title:title, text:text };
          else entry.title = title;
          saveIt();
          toastIt('Renamed');
        }
      }
      if(!title) title = entryTitle(entry);
    }

    /* put the title back in the row exactly where the field was */
    const b = document.createElement('b');
    b.textContent = title || 'Untitled prompt';
    if(input.parentNode) input.parentNode.replaceChild(b, input);
  };

  /* ═══ SAVING — the writer names the prompt ═══
     The card’s Save asks what the prompt should be called before anything is
     written down, and that typed title is what the right-hand column shows:
     the list reads as the writer’s own shelf of prompts instead of six
     truncated first lines. Cancelling the little window keeps nothing. */
  const savePrompt = function(title, txt){
    if(typeof S === 'undefined') return;
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    S.config.savedPrompts.unshift({ title:title, text:txt });
    saveIt();
    toastIt('Prompt saved');

    /* repaint the page so the Saved prompts column carries the new entry */
    const root = document.getElementById('page-inspire');
    if(root) PAGE_RENDERERS.inspire(root);
    else paint();
  };

  const askTitle = async function(txt){
    txt = String(txt || '');
    if(!txt.trim()){ toastIt('Write something first', 'warn'); return; }
    const list = savedEntries();
    const has = list.some(function(p){ return entryText(p) === txt; });
    if(has){ toastIt('Already saved'); return; }

    let title = titleOf(txt);
    if(typeof window.askPrompt === 'function'){
      /* the app’s own little window, so it matches every other named thing */
      const answer = await window.askPrompt('Name this prompt', title);
      if(answer == null) return;
      title = String(answer).replace(/\s+/g, ' ').trim() || titleOf(txt);
    }
    savePrompt(title, txt);
  };

  /* ── the cards ── */
  const cardHTML = function(i){
    const open = (i === editing);
    return '<article class="idea-slot idea-slot-brief' + (i === sel ? ' on' : '') + '"'
      + ' data-ic-slot="' + i + '" data-ic-mode="' + (open ? 'edit' : 'view') + '">'
      + '<textarea class="idea-brief-input" data-ic-input="' + i + '" rows="3" spellcheck="false"'
      +   (open ? '' : ' readonly')
      +   ' placeholder="' + (open ? 'Write your prompt…' : 'Click the pencil to write a prompt…') + '">'
      +   esc2(wordsOf(i)) + '</textarea>'
      + '<div class="idea-slot-acts">'
      +   '<button class="ol-tool" data-ic-edit="' + i + '" title="Edit this prompt"><i class="bi bi-pencil"></i></button>'
      +   '<button class="ol-tool" data-ic-save="' + i + '" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i></button>'
      + '</div>'
      + '</article>';
  };

  const paint = function(){
    const box = document.getElementById('ideaCards');
    if(!box) return;
    let html = '';
    for(let i = 0; i < CARDS; i++) html += cardHTML(i);
    box.innerHTML = html;
  };

  const mark = function(){
    const cards = document.querySelectorAll('#ideaCards [data-ic-slot]');
    Array.prototype.forEach.call(cards, function(c){
      c.classList.toggle('on', parseInt(c.dataset.icSlot, 10) === sel);
    });
  };

  /* ── the pencil opens a card for writing; clicking away closes it again ──
     The two modes are switched on the card that is already on screen rather
     than by drawing the grid again: the button the writer is pressing has to
     survive the click that follows the press, and a fresh grid would take it
     out of the page first. */
  const viewCard = function(i, mode){
    const slot = document.querySelector('#ideaCards [data-ic-slot="' + i + '"]');
    if(!slot) return null;
    const open = (mode === 'edit');
    slot.setAttribute('data-ic-mode', open ? 'edit' : 'view');
    const ta = slot.querySelector('[data-ic-input]');
    if(ta){
      if(open) ta.removeAttribute('readonly');
      else ta.setAttribute('readonly', 'readonly');
      ta.placeholder = open ? 'Write your prompt…' : 'Click the pencil to write a prompt…';
    }
    return ta;
  };

  const openCard = function(i){
    if(i < 0 || i >= CARDS) return;
    if(editing >= 0 && editing !== i) viewCard(editing, 'view');
    sel = i;
    editing = i;
    mark();
    const ta = viewCard(i, 'edit');
    if(!ta) return;
    try{ ta.focus(); }catch(e){}
    try{
      const at = ta.value.length;
      ta.setSelectionRange(at, at);
    }catch(e){}
  };

  const closeCard = function(){
    if(editing < 0) return;
    viewCard(editing, 'view');
    editing = -1;
  };

  /* the prompt in view is taken out of the card you are on */
  const clearCard = function(){
    const list = store();
    if(!list) return;
    if(!String(list[sel] || '').trim()){ toastIt('Nothing to clear', 'warn'); return; }
    list[sel] = '';
    editing = -1;
    paint();
    saveSoon();
    toastIt('Cleared');
  };

  /* ── the page ── */
  const orig = PAGE_RENDERERS.inspire;
  PAGE_RENDERERS.inspire = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    editing = -1;

    /* one big card → the six-card grid */
    const box = root.querySelector('#inspireBox');
    if(box){
      box.hidden = true;
      box.id = 'inspireBoxOld';
      box.className = '';
      const grid = document.createElement('div');
      grid.className = 'idea-cards';
      grid.id = 'ideaCards';
      box.parentNode.insertBefore(grid, box);
    }

    /* The bar's left slot is the page's own AI door — “Prompt me” and the
       settings that fed it. This page does not write prompts: the cards are
       the writer's, and the app's AI is the round button's right-click. */
    const aiDoor = root.querySelector('.idea-bar-left')
      || root.querySelector('.idea-bar [data-idea="prompt"], .idea-bar [data-ic-prompt]');
    if(aiDoor && aiDoor.parentNode) aiDoor.parentNode.removeChild(aiDoor);

    /* The bar's Copy and Save belong to the old single prompt; they act on
       the card you are on now, so they are taken off the page's own wiring
       before it can read them as its own. */
    Array.prototype.forEach.call(
      root.querySelectorAll('.idea-tools [data-idea="copy"], .idea-tools [data-idea="save"]'),
      function(b){
        const was = b.getAttribute('data-idea');
        b.removeAttribute('data-idea');
        b.setAttribute(was === 'copy' ? 'data-ic-bar-copy' : 'data-ic-bar-save', '1');
      });

    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(root);
    paint();
    watchList();
  };

  /* ── clicks ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    /* Clear — the prompt leaves the card it is shown in */
    const cl = t.closest('[data-sf-clear]');
    if(cl){ e.preventDefault(); e.stopPropagation(); clearCard(); return; }

    /* the bar's Copy and Save, acting on the card you are on */
    if(t.closest('[data-ic-bar-copy]')){
      e.preventDefault(); e.stopPropagation();
      copyText(wordsOf(sel));
      return;
    }
    if(t.closest('[data-ic-bar-save]')){
      e.preventDefault(); e.stopPropagation();
      askTitle(wordsOf(sel));
      return;
    }

    const ed = t.closest('#ideaCards [data-ic-edit]');
    if(ed){
      e.preventDefault(); e.stopPropagation();
      const i = parseInt(ed.dataset.icEdit, 10);
      if(!isNaN(i)) openCard(i);
      return;
    }

    const sv = t.closest('[data-ic-save]');
    if(sv){
      e.preventDefault(); e.stopPropagation();
      askTitle(wordsOf(parseInt(sv.dataset.icSave, 10)));
      return;
    }

    /* a saved prompt opened: it drops into the card you are on, as words */
    const row = t.closest('[data-idea-open]');
    if(row){
      if(t.closest('.ol-tool')) return;             /* its own rename / remove */
      const i = parseInt(row.dataset.ideaOpen, 10);
      const txt = entryText(savedEntries()[i]);
      const list = store();
      if(txt && list && !isNaN(i)){
        list[sel] = txt;
        editing = -1;
        paint();
        saveSoon();
      }
      return;
    }

    /* the card itself — never preventDefault, the field needs the caret */
    const sl = t.closest('[data-ic-slot]');
    if(sl){
      const i = parseInt(sl.dataset.icSlot, 10);
      if(!isNaN(i)){
        sel = i;
        mark();
      }
    }
  }, true);

  /* ── right-click: copy, and paste ── */
  document.addEventListener('contextmenu', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    /* a saved prompt — its label goes onto the clipboard */
    const row = t.closest('#page-inspire #ideaRows [data-idea-open]');
    if(row && !t.closest('.ol-tool')){
      e.preventDefault(); e.stopPropagation();
      const i = parseInt(row.dataset.ideaOpen, 10);
      if(!isNaN(i)) copyBlock(entryTitle(savedEntries()[i]), 'the label');
      return;
    }

    /* the prompt in a card, while the card is a view — the prompt itself */
    const slot = t.closest('#ideaCards [data-ic-slot]');
    if(slot && !t.closest('.idea-slot-acts') && parseInt(slot.dataset.icSlot, 10) !== editing){
      const txt = wordsOf(parseInt(slot.dataset.icSlot, 10));
      if(txt){ e.preventDefault(); e.stopPropagation(); copyBlock(txt, 'the prompt'); }
      return;
    }

    /* an empty box on any page — what was copied goes in.
       Nothing of ours to do when the app (or the browser) already has the
       right-click: the manuscript's own editor keeps its writing menu, and
       so does any handler that has already answered this one. */
    if(!clip || e.defaultPrevented) return;
    if(t.closest('#editor, .write-canvas, .editor-doc')) return;
    const field = fieldOf(t);
    if(!field || field.readOnly || field.disabled || !isBlank(field)) return;
    if(!pasteInto(field, clip)) return;
    e.preventDefault();
    e.stopPropagation();
    toastIt('Pasted');
  }, true);

  /* the write is closed by clicking away, and by Escape */
  document.addEventListener('blur', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.icInput === 'undefined') return;
    if(parseInt(t.dataset.icInput, 10) === editing) closeCard();
  }, true);

  document.addEventListener('keydown', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;

    if(e.key === 'Escape' && typeof t.dataset.icInput !== 'undefined' && parseInt(t.dataset.icInput, 10) === editing){
      e.preventDefault();
      closeCard();
      return;
    }

    if(typeof t.dataset.ideaRenInput === 'undefined') return;
    if(e.key === 'Enter'){ e.preventDefault(); endRename(t, false); }
    else if(e.key === 'Escape'){ e.preventDefault(); endRename(t, true); }
  }, true);

  document.addEventListener('blur', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.ideaRenInput === 'undefined') return;
    endRename(t, false);                     /* clicking away keeps it too */
  }, true);

  /* ── the row’s pencil renames it ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const ren = t.closest('[data-idea-ren]');
    if(!ren) return;
    e.preventDefault();
    e.stopPropagation();
    startRename(ren.closest('[data-idea-open]'));
  }, true);

  /* every keystroke is the writer’s own text, kept with the project */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.icInput === 'undefined') return;
    if(t.readOnly) return;
    const i = parseInt(t.dataset.icInput, 10);
    if(isNaN(i)) return;
    const list = store();
    if(!list) return;
    list[i] = t.value;
    sel = i;
    mark();
    saveSoon();
  }, true);

  /* ── Plan board — every beat’s type picker wears the app’s dropdown card.
     The dropdown component is wired to <select class="sel">, so the board’s
     selects get that class before they are enhanced. ── */
  const skinBoard = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    Array.prototype.slice.call(board.querySelectorAll('select.beat-type')).forEach(function(s){
      s.classList.add('sel');
    });
    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(board);
  };

  if(typeof window.renderBeats === 'function'){
    const rb = window.renderBeats;
    window.renderBeats = function(){
      const r = rb.apply(this, arguments);
      skinBoard();
      return r;
    };
  }

  /* the board’s own click handler redraws it — keep that path skinned too */
  document.addEventListener('change', function(e){
    if(e.target && e.target.classList && e.target.classList.contains('beat-type')) setTimeout(skinBoard, 0);
  }, true);

  /* ── keep the open list fully visible ──
     The board scrolls and the cards are small, so an open dropdown raises its
     own card and flips the list above the title when there is no room below. ── */
  document.addEventListener('click', function(e){
    const board = document.getElementById('beatList');
    if(!board) return;
    const t = e.target;

    if(!t || !t.closest || !t.closest('#beatList .dd-card')){
      Array.prototype.slice.call(board.querySelectorAll('.beat-card.beat-open')).forEach(function(c){
        c.classList.remove('beat-open');
      });
      return;
    }

    setTimeout(function(){
      const bRect = board.getBoundingClientRect();
      Array.prototype.slice.call(board.querySelectorAll('.beat-card')).forEach(function(cardEl){
        const card = cardEl.querySelector('.dd-card');
        if(!card) return;
        const open = card.classList.contains('open');
        cardEl.classList.toggle('beat-open', open);
        if(!open){ card.classList.remove('dd-up'); return; }
        const roomBelow = bRect.bottom - card.getBoundingClientRect().bottom;
        card.classList.toggle('dd-up', roomBelow < 190);
      });
    }, 0);
  }, true);
})();


/* ══════════ dash.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Dashboard — no players on it.

   While the dashboard is the page, both player panels (Music and
   Video), the video playlist and both mini players stay hidden. The
   Player button is gone from the dashboard's top bar too (index.html).
   Everywhere else — the writer, the FAB menu, the overlay — nothing
   changes.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const mark = function(id){
    if(!document.body) return;
    document.body.classList.toggle('sf-dash', id === 'home');
  };

  /* follow the router */
  if(typeof window.goPage === 'function' && !window.goPage.__dashWrapped){
    const orig = window.goPage;
    const wrapped = function(id){
      const out = orig.apply(this, arguments);
      try{ mark(id); }catch(e){ /* never break navigation over a class */ }
      return out;
    };
    wrapped.__dashWrapped = true;
    window.goPage = wrapped;
  }

  const start = function(){ mark((window.S && S.page) || 'home'); };
  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();


/* ══════════ plan-head.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Plan — the head.

   · T stays on the left, with “New board” right after it.
   · Top right: an “All boards” switch, then Reset.
       – All boards  : on, the board tightens up so every card is on
                       screen at once instead of scrolling.
       – Reset       : clears the board (the app's own confirm first —
                       it reuses the clear-beats action).
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const on = function(){ return !!(S.config && S.config.planAll); };

  const paintSwitch = function(btn){
    if(!btn) return;
    btn.classList.toggle('on', on());
    btn.setAttribute('aria-pressed', on() ? 'true' : 'false');
  };

  const orig = PAGE_RENDERERS.plan;
  PAGE_RENDERERS.plan = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    const head = root.querySelector('.plan-head') || root.querySelector('.page-head');
    if(!head) return;

    /* ── the buttons are the page's own; plan-boards.js places them.
       Add beat is not renamed: starting a board is the picker's own ＋. ── */

    /* ── right: All boards, then Reset ── */
    let right = head.querySelector('.plan-actions');
    if(!right){
      right = document.createElement('div');
      right.className = 'ol-actions plan-actions';
      head.appendChild(right);
    }

    let allSw = right.querySelector('[data-act="plan-all"]');
    if(!allSw){
      allSw = document.createElement('button');
      allSw.className = 'ol-btn plan-allsw';
      allSw.setAttribute('data-act', 'plan-all');
      allSw.title = 'Fit every board on screen at once';
      allSw.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> All boards';
      right.insertBefore(allSw, right.firstChild || null);
    }
    paintSwitch(allSw);

    /* one Clear for the board — the page already draws one, so only add it
       when this head has none at all */
    if(!head.querySelector('[data-act="clear-beats"]')){
      const reset = document.createElement('button');
      reset.className = 'ol-btn';
      reset.setAttribute('data-act', 'clear-beats');
      reset.title = 'Clear the cards off this board';
      reset.innerHTML = '<i class="bi bi-eraser"></i> Clear';
      right.appendChild(reset);
    }

    /* the switch's state lives on the page */
    root.classList.toggle('plan-all', on());
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="plan-all"]')) return;
    e.preventDefault();
    if(!S.config) S.config = {};
    S.config.planAll = !S.config.planAll;
    if(typeof save === 'function') save();
    paintSwitch(t.closest('[data-act="plan-all"]'));
    const root = document.getElementById('page-plan');
    if(root) root.classList.toggle('plan-all', on());
  }, true);
})();

