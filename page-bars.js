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
