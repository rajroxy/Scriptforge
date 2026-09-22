/* ═══════════════════════════════════════════════════════════
   ScriptForge — AI panel extras.

   Loaded after app.js / pages-fix.js / translate.js.

   The FAB's right-click card closes from its own bi-x-lg button, and
   Escape shuts it too — but only when no modal or command box wants
   the key first.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const closeAI = function(){
    const ai = document.getElementById('fabAI');
    if(ai) ai.hidden = true;
    const mn = document.getElementById('fabMenu');
    if(mn) mn.hidden = true;
    const fw = document.getElementById('fabWrap');
    if(fw) fw.classList.remove('menu-open');
  };

  /* the panel's own close button */
  document.addEventListener('click', function(e){
    const x = e.target.closest && e.target.closest('[data-fab-ai-close]');
    if(!x) return;
    e.preventDefault();
    e.stopPropagation();
    closeAI();
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;

    const ai = document.getElementById('fabAI');
    const mn = document.getElementById('fabMenu');
    if(!((ai && !ai.hidden) || (mn && !mn.hidden))) return;
    if(document.querySelector('.modal-scrim')) return;
    const cb = document.getElementById('cmdBox');
    if(cb && !cb.hidden) return;

    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    closeAI();
  }, true);
})();
