/* ═══════════════════════════════════════════════════════════
   ScriptForge — "Failed to render stats.", fixed
   and the Statistics categories: Fiction only

   THE BUG
   pages.js declares two helpers inside the Statistics page's own renderer:

       const catName  = function(id){ … }      ← line ~2861, inside stats
       const catItems = function(modeId){ … }

   and then, further down the same file, a FUNCTION-SCOPE function draws
   the stats body:

       function renderStatsBody(){ … catName(activeCatId) … }

   renderStatsBody is not nested in the renderer, so its scope chain is the
   file's, where catName does not exist. The first time a category is picked
   in the Statistics dropdown (Novel → Fiction), that call throws
   “catName is not defined”, and because the page renderer calls
   renderStatsBody() while drawing, the whole page is replaced by

       Failed to render stats.

   THE FIX
   pages.js is a classic script — no strict mode — so an identifier it
   never declared is looked up on the global object. Defining catName and
   catItems here, with the same logic and the same MODES, is all it takes
   for the call inside renderStatsBody to resolve. Nothing in pages.js is
   touched, so no other behaviour can shift.

   Loaded last, after state.js (which owns MODES) and after pages.js.

   ── NON-FICTION, OUT OF THE STATISTICS LISTS ──
   The two dropdowns are built from the mode's own categories, so both
   offered Non-fiction as well. This page measures the fiction side of a
   mode and nothing else, so the entry is taken back out of the lists —
   and a category that was picked before it left falls back to None,
   instead of sitting in the label with no item left to match it.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const modesOf = function(){
    try{ if(typeof MODES !== 'undefined' && Array.isArray(MODES)) return MODES; }catch(e){}
    try{ if(window.MODES && Array.isArray(window.MODES)) return window.MODES; }catch(e){}
    return [];
  };

  /* the one category the Statistics page has no use for */
  const HIDDEN = 'nonfiction';
  const shown = function(c){ return !!c && c.id !== HIDDEN; };

  /* the name a category id stands for — Fiction, Non-fiction — read from
     the modes themselves, so it can never drift from what a project can be
     filed as. A hidden category has no name here: the label reads None. */
  const catName = function(id){
    if(id === HIDDEN) return '';
    let name = '';
    modesOf().forEach(function(m){
      (m.categories || []).forEach(function(c){ if(c.id === id && shown(c)) name = c.name; });
    });
    return name;
  };

  /* the same lookup for a whole mode's categories, as markup — the shape
     the dropdowns are built from */
  const catItems = function(modeId){
    const m = modesOf().filter(function(x){ return x.id === modeId; })[0];
    return '<button class="stats-cat-item" data-value="none"><span>None</span><i class="bi bi-check2"></i></button>'
      + (((m && m.categories) || []).filter(shown).map(function(c){
          return '<button class="stats-cat-item" data-value="' + c.id + '"><span>' + c.name + '</span><i class="bi bi-check2"></i></button>';
        }).join(''));
  };

  window.catName  = catName;
  window.catItems = catItems;
})();

/* ═══════════════════════════════════════════════════════════
   The dropdowns themselves.

   pages.js paints its two lists from its own copy of catItems, which is
   local to the renderer and cannot be reached from here — so the entry is
   taken out of the lists as they land. The click handling is delegated on
   each box, so a list with one item fewer behaves exactly as before.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const ITEM = '[data-stats-novel] .stats-cat-item[data-value="nonfiction"],'
             + '[data-stats-screenplay] .stats-cat-item[data-value="nonfiction"]';
  const KEYS = ['statsNovel', 'statsScreenplay'];

  const configOf = function(){
    try{ return (typeof S !== 'undefined' && S.config) ? S.config : null; }catch(e){ return null; }
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  const strip = function(){
    let took = false;

    Array.prototype.forEach.call(document.querySelectorAll(ITEM), function(el){
      if(el && el.parentNode){ el.parentNode.removeChild(el); took = true; }
    });

    /* a category picked before it left the lists cannot stay picked */
    const c = configOf();
    if(c){
      KEYS.forEach(function(key){
        if(c[key] === 'nonfiction'){ c[key] = 'none'; saveIt(); took = true; }
      });
    }

    /* and a label left reading Non-fiction follows it back to None */
    Array.prototype.forEach.call(document.querySelectorAll('.stats-cat-value'), function(v){
      if(/^\s*non-fiction\s*$/i.test(v.textContent || '')){ v.textContent = 'None'; took = true; }
    });

    /* the body follows the boxes: a page that was showing Non-fiction has
       nothing left to show, so it is drawn again — empty, not stale */
    if(took && c && KEYS.every(function(k){ return c[k] === 'none'; })){
      try{ if(typeof renderStatsBody === 'function') renderStatsBody(); }catch(e){}
    }
    return took;
  };

  /* every paint of the page, and everything that can bring an item back */
  let raf = 0;
  const soon = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; strip(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(soon).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', soon, true);
  window.addEventListener('resize', soon);
  setInterval(strip, 1000);
  if(document.body) strip();
  else document.addEventListener('DOMContentLoaded', strip);
})();
