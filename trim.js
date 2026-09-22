/* ═══════════════════════════════════════════════════════════
   ScriptForge — the prompt page's top-left corner

   The generate button keeps its meaning and loses its words: one
   stars icon, no label (the button still says what it does on hover).
   Any older “New prompt” button that survived a re-render is removed.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const trim = function(){
    const page = document.getElementById('page-inspire');
    if(!page) return;

    Array.prototype.forEach.call(page.querySelectorAll('.idea-bar button, .idea-tools button'), function(b){
      if(/^\s*new prompt\s*$/i.test((b.textContent || '').trim())) b.remove();
    });

    /* the generate button is gone from the top-left: the sixth card takes
       anything you type, and the right-click AI menu still has Prompt me */
    Array.prototype.forEach.call(
      page.querySelectorAll('.idea-bar [data-ic-prompt], .idea-bar [data-idea="prompt"]'),
      function(b){ b.remove(); }
    );
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
