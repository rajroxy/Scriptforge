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
