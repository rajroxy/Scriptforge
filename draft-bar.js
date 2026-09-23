/* ═══════════════════════════════════════════════════════════
   Draft — the bar's three buttons

   · New draft is the bar while you are writing. It calls the app's own
     New draft action; the writing actions live in the right-click menu.
   · While an AI panel is on screen — the right-click assistant, the
     draft chat, or the AI result sheet — the bar stays, New draft steps
     aside, and the AI chat button takes its place in the same slot.
     Everything is back the moment the panel closes.

   The buttons are the app's own; this only places and hides them.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const shown = function(el){
    if(!el || el.hidden) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };

  const chatOpen = function(){
    if(shown(document.getElementById('fabAI'))) return true;      /* right-click assistant */
    const modal = document.getElementById('modalRoot');           /* the AI result sheet */
    if(modal && modal.classList.contains('open')) return true;
    const draft = document.getElementById('page-draft');
    if(!draft) return false;
    if(draft.classList.contains('dc-on')) return true;            /* the draft chat view */
    return !!draft.querySelector('[data-dc="1"]');                /* or its panel in the pane */
  };

  const paint = function(){
    const open = chatOpen();
    if(document.body.classList.contains('sf-ai-open') !== open){
      document.body.classList.toggle('sf-ai-open', open);
    }
    const bar = document.querySelector('#page-draft .sf-bar');
    if(bar && bar.classList.contains('sf-bar-hidden') !== open){
      bar.classList.toggle('sf-bar-hidden', open);
    }
  };

  setInterval(paint, 200);
  document.addEventListener('click', paint, true);
  document.addEventListener('keyup', paint, true);
  window.addEventListener('resize', paint);
  if(document.body) paint();
})();
