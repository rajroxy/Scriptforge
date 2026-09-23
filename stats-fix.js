/* ═══════════════════════════════════════════════════════════
   ScriptForge — "Failed to render stats.", fixed

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
   ═══════════════════════════════════════════════════════════ */
(function(){
  const modesOf = function(){
    try{ if(typeof MODES !== 'undefined' && Array.isArray(MODES)) return MODES; }catch(e){}
    try{ if(window.MODES && Array.isArray(window.MODES)) return window.MODES; }catch(e){}
    return [];
  };

  /* the name a category id stands for — Fiction, Non-fiction — read from
     the modes themselves, so it can never drift from what a project can be
     filed as */
  const catName = function(id){
    let name = '';
    modesOf().forEach(function(m){
      (m.categories || []).forEach(function(c){ if(c.id === id) name = c.name; });
    });
    return name;
  };

  /* the same lookup for a whole mode's categories, as markup — the shape
     the dropdowns are built from */
  const catItems = function(modeId){
    const m = modesOf().filter(function(x){ return x.id === modeId; })[0];
    return '<button class="stats-cat-item" data-value="none"><span>None</span><i class="bi bi-check2"></i></button>'
      + (((m && m.categories) || []).map(function(c){
          return '<button class="stats-cat-item" data-value="' + c.id + '"><span>' + c.name + '</span><i class="bi bi-check2"></i></button>';
        }).join(''));
  };

  window.catName  = catName;
  window.catItems = catItems;
})();
