/* ═══════════════════════════════════════════════════════════
   ScriptForge — two keys, put where they belong

   · Shift + / — the block panel. It is the writing page's own panel and
     belongs to the manuscript (and its script mode) and nowhere else. It
     used to open on any page with something editable on screen — the
     reader, a canvas card — which is what made it feel like it came from
     nowhere. pages.js still opens it, so this closes it again inside the
     same keystroke, before anything paints.

   · Shift + @ — the element menu, claimed EARLY (see the window listener
     below). On the Script page the source pane is a <textarea>, not a
     contenteditable, so the writing page's own menu found no editable and
     the keystroke went nowhere useful: the Insert list — scene heading ·
     action · character · parenthetical · dialogue · transition, written as
     Fountain — is what the writer wants there. On the novel manuscript the
     writing page's own element menu (Paragraph · Heading 1-3 · Quote ·
     Epigraph · Scene break) is the right one, and it is opened from here so
     a single handler owns the key.

   Loaded last, so anything bound on `document` runs after pages.js's; the
   Shift + @ handler therefore binds on `window` instead, where the capture
   phase runs before `document`'s and the keystroke can be settled once.
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

  /* ── Shift + @ ──
     One handler, bound on `window` in the capture phase so it runs before
     the writing page's own `document` listener and can stop the event there:

       · Script page — a visible .fnt-src pane: open the script's own Insert
         list (the page's panel, so it works whether or not a bar button for
         it is on screen).
       · Novel manuscript — open the writing page's element menu, which is
         what write.js would have done, exactly once.
       · Every other page — untouched. */
  const onScreen = function(el){
    if(!el) return false;
    if(el.getClientRects) return el.getClientRects().length > 0;
    return el.offsetParent !== null;
  };

  const scriptRoot = function(){
    const active = document.querySelector('.sf-script-page.active');
    if(active && active.querySelector('.fnt-src')) return active;
    const any = document.querySelector('.fnt-src');
    if(any && onScreen(any)) return any.closest('.page') || document;
    return null;
  };

  const openInsert = function(root){
    const panel = root.querySelector('.fnt-insert');
    if(!panel) return false;
    if(!panel.hidden) return true;                    /* already open — Esc closes it */
    Array.prototype.forEach.call(root.querySelectorAll('.fnt-jump'), function(p){ p.hidden = true; });
    panel.hidden = false;
    const first = panel.querySelector('.fnt-jump-i');
    if(first) setTimeout(function(){ try{ first.focus(); }catch(e){} }, 30);
    return true;
  };

  window.addEventListener('keydown', function(e){
    if(!isAt(e)) return;
    if(page() !== 'manuscript') return;

    const root = scriptRoot();
    if(root){
      if(openInsert(root)){
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }
      const btn = root.querySelector('[data-fnt-insert]');
      if(btn){
        e.preventDefault(); e.stopImmediatePropagation();
        btn.click();
        return;
      }
    }

    /* the novel manuscript — the writing page's own element menu */
    const menu = document.getElementById('sfElemMenu');
    if(menu && !menu.hidden){
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    if(typeof window.sfOpenMenu === 'function'){
      e.preventDefault(); e.stopImmediatePropagation();
      window.sfOpenMenu();
    }
  }, true);

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
