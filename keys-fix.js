/* ═══════════════════════════════════════════════════════════
   ScriptForge — two keys, put where they belong

   · Shift + / — the block panel. It is the writing page's own panel and
     belongs to the manuscript (and its script mode) and nowhere else. It
     used to open on any page with something editable on screen — the
     reader, a canvas card — which is what made it feel like it came from
     nowhere. pages.js still opens it, so this closes it again inside the
     same keystroke, before anything paints.

   · Shift + @ — the element menu. It never reached the script page: the
     script's source pane is a <textarea>, not a contenteditable, so the
     menu's own guard found no editable and gave up. Here it opens the
     script's own Insert list instead — the same scene heading · action ·
     character · parenthetical · transition list, written as Fountain. The
     list itself is a panel of the script page, so the shortcut opens it
     directly, whether or not anything in the bar is on screen.

   Loaded last, so its capture listeners run after pages.js's.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const page = function(){
    try{ return (typeof S !== 'undefined' && S.page) || ''; }catch(e){ return ''; }
  };

  const isSlash = function(e){
    return e.key === '?' || (e.code === 'Slash' && e.shiftKey);
  };
  const isAt = function(e){
    return e.key === '@' || (e.key === '2' && e.shiftKey) || (e.code === 'Digit2' && e.shiftKey);
  };

  const advPanel = function(){ return document.getElementById('advPanel'); };

  const closeAdv = function(){
    const p = advPanel();
    if(!p || p.hidden) return;
    p.hidden = true;
    try{ if(typeof window.advToggle === 'function') window.advToggle(false); }catch(e){}
  };

  /* pages.js opens the panel on any page whose guard finds no caret to
     check, so watching the panel itself is the surest way to keep it off
     the pages it does not belong to: the instant it is shown anywhere but
     the manuscript, it goes away again — no click, no navigation needed. */
  const watchPanel = function(){
    const p = advPanel();
    if(!p || p.dataset.sfOwned === '1') return;
    p.dataset.sfOwned = '1';
    if(typeof MutationObserver !== 'function') return;
    new MutationObserver(function(){
      if(!p.hidden && page() !== 'manuscript') closeAdv();
    }).observe(p, { attributes:true, attributeFilter:['hidden', 'style', 'class'] });
  };

  /* the script page's own source pane — the textarea, not the rich editor */
  const scriptSrc = function(){
    const a = document.activeElement;
    if(a && a.classList && a.classList.contains('fnt-src')) return a;
    return document.querySelector('.sf-script-page.active .fnt-src');
  };

  document.addEventListener('keydown', function(e){
    if(isSlash(e)){
      if(page() === 'manuscript') return;    /* its own page — pages.js owns it */
      closeAdv();
      return;
    }

    if(!isAt(e)) return;
    if(page() !== 'manuscript') return;

    /* the Fountain pane is the only writing surface in a scripted mode, so
       its presence is what makes this the script page — in a novel there is
       no such field and write.js keeps its own menu */
    const root = document.querySelector('.sf-script-page.active') || document;
    if(!root.querySelector('.fnt-src')) return;

    e.preventDefault();
    e.stopPropagation();

    /* the panel first: it is the same list whether the bar's Insert item is
       on screen, inside the ⋯ overflow, or not drawn at all */
    const panel = root.querySelector('.fnt-insert');
    if(panel){
      const wasHidden = panel.hidden;
      root.querySelectorAll('.fnt-jump').forEach(function(p){ p.hidden = true; });
      panel.hidden = !wasHidden;
      const first = panel.querySelector('.fnt-jump-i');
      if(first) setTimeout(function(){ try{ first.focus(); }catch(err){} }, 30);
      return;
    }

    const btn = root.querySelector('[data-fnt-insert]');
    if(btn) btn.click();
  }, true);

  /* the panel cannot outlive the page it belongs to */
  let raf = 0;
  const sweep = function(){
    watchPanel();
    if(page() !== 'manuscript') closeAdv();
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      if(page() !== 'manuscript') closeAdv();
    });
  };

  document.addEventListener('click', sweep, true);
  window.addEventListener('resize', sweep);
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(sweep).observe(document.body, { childList:true, subtree:true });
  }
  if(document.body) sweep();
})();
