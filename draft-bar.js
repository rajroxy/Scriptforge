/* ═══════════════════════════════════════════════════════════
   Draft — the bar's three buttons

   · New draft stays on the left; Fix grammar and Improve sit on the
     right, where the writing actions belong.
   · While an AI panel is on screen — the right-click assistant, the
     draft chat, or the AI result sheet — every button in the bar steps
     out of the way, so the panel has the page to itself. The bar comes
     back the moment the panel closes.
   · Whenever the draft page is showing, nothing else in its bar is
     allowed through either.

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
