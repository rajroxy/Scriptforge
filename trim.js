/* ═══════════════════════════════════════════════════════════
   ScriptForge — what the writer asked to be taken out

   · The prompt page's top-left corner keeps its own buttons: Prompt me
     sits at the left, where the writing starts. Only an older “New
     prompt” button that survived a re-render is cleared away.

   · The research plugins (web search, Wikipedia, image search, quotes,
     public-domain books) are gone from the app. Their entry in Settings
     was removed with them, and this clears the last way in — the “Web
     search” button on the Research page.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const trim = function(){
    const page = document.getElementById('page-inspire');
    if(!page) return;

    Array.prototype.forEach.call(page.querySelectorAll('.idea-bar button, .idea-tools button'), function(b){
      if(/^\s*new prompt\s*$/i.test((b.textContent || '').trim())) b.remove();
    });
  };

  /* the research plugins' only remaining door */
  const researchOut = function(){
    const page = document.getElementById('page-research');
    if(!page) return;
    Array.prototype.forEach.call(page.querySelectorAll('[data-act="web-search"], [data-act="search-web"]'), function(b){
      b.remove();
    });
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; trim(); researchOut(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();
