/* ═══════════════════════════════════════════════════════════
   ScriptForge — the prompt page's top-left corner

   The bar keeps its own buttons: Prompt me sits at the left, where the
   writing starts, with the AI settings beside it. Only an older
   “New prompt” button that survived a re-render is cleared away.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const trim = function(){
    const page = document.getElementById('page-inspire');
    if(!page) return;

    Array.prototype.forEach.call(page.querySelectorAll('.idea-bar button, .idea-tools button'), function(b){
      if(/^\s*new prompt\s*$/i.test((b.textContent || '').trim())) b.remove();
    });
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; trim(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();
