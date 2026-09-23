/* ═══════════════════════════════════════════════════════════
   Writer — the chevron pagers are gone; every list scrolls.

   The Outline and the Bible were dealt with in pages-fix.js. These two
   are drawn by pages.js itself, so they are finished off here:

   · DRAFT — the list is filled by renderDrafts(), which windows the drafts
             by draftPerPage(). Returning a number nothing can reach makes
             it draw every draft, and the pager is taken out of the head.

   · IDEA  — the saved-prompt column is filled by a renderer whose
             per-page count lives inside a closure, so it cannot be turned
             off from here. The column is re-filled with every saved prompt
             instead, using the very same row markup and the same indices,
             so the page's own delegated clicks (open · copy · remove) keep
             working on the rows this draws.

   Every pass is guarded against the box it just wrote, so the mutation
   observer cannot loop.
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* ── DRAFT ── */
  window.draftPerPage = function(){ return Number.MAX_SAFE_INTEGER; };

  /* Every chevron pager the app draws for a LIST is taken out, wherever it
     was put and by whichever script put it there: Draft, Idea, Outline and
     Bible all scroll instead. Removing them is idempotent, so the sweep can
     run on every repaint. */
  const PAGERS = '#page-draft .draft-pager, #page-inspire .idea-pager,' +
                 '#page-outline .pg-pager, #page-bible .bb-pager,' +
                 '#page-outline .draft-pager, #page-bible .draft-pager';
  const clearPagers = function(){
    Array.prototype.forEach.call(document.querySelectorAll(PAGERS), function(p){
      if(p.parentElement) p.parentElement.removeChild(p);
    });
    /* an older build also left rows hidden behind a page break */
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-outline .ol-node, #page-bible .bb-row'),
      function(r){ if(r.style.display === 'none') r.style.display = ''; }
    );
  };

  const refillDrafts = function(){
    const rows = document.getElementById('draftRows');
    if(!rows) return;
    const d = (typeof D === 'function') ? D() : null;
    const n = (d && Array.isArray(d.drafts)) ? d.drafts.length : 0;
    if(rows.querySelectorAll('.draft-row').length === n) return;
    if(typeof window.renderDrafts === 'function') window.renderDrafts();
  };

  /* ── IDEA ── */
  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '\u2026' : t) || 'Untitled prompt';
  };
  const savedPrompts = function(){
    const list = (typeof S !== 'undefined' && S.config && Array.isArray(S.config.savedPrompts))
      ? S.config.savedPrompts : [];
    return list.map(function(p){ return (typeof p === 'string') ? { title:'', text:p } : p; });
  };

  const refillIdeaRows = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    const list = savedPrompts();
    if(box.querySelectorAll('.idea-row').length === list.length) return;   /* already all there */

    box.innerHTML = list.length
      ? list.map(function(p, i){
          const t = p.title || titleOf(p.text);
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-txt"><b>' + esc(t) + '</b>'
            +   '<em>' + esc(p.text) + '</em></span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>';
  };

  const sweep = function(){
    clearPagers();
    refillDrafts();
    refillIdeaRows();
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; sweep(); });
  };

  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();
