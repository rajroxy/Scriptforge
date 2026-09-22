/* ═══════════════════════════════════════════════════════════
   Writer — the chapter bar sits on the toolbar's columns.

   Two rows, two jobs:

   · ICONS   Notes → Bold · Book → Italic · Utilities → Subscript
             each icon slides on its own so its centre lands on the
             centre of the toolbar button it belongs under.

   · DIVIDERS
             the hairline BEFORE the note icon lines up with the
             toolbar's divider before Bold, and the hairline AFTER the
             utility icon lines up with the toolbar's divider after
             Subscript — so the two rows read as one grid.

   Re-measured whenever either bar redraws and on resize. Every shift
   is wiped before each pass, so a redraw can never stack two shifts.
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* [ the tool in the chapter bar , the toolbar button it sits under ] */
  const PAIRS = [
    ['[data-act="notes-open"]',                      '[data-cmd="bold"]'],
    ['[data-act="go-page"][data-page="notebook"]',   '[data-cmd="italic"]'],
    ['[data-act="util-open"]',                       '[data-cmd="subscript"]']
  ];

  const groupOf = function(tb, sel){
    const btn = tb.querySelector(sel);
    return btn ? btn.closest('.tb-group') : null;
  };

  /* the .cc-sep immediately before / after the group holding a button */
  const sepNear = function(bar, sel, side){
    const btn = bar.querySelector(sel);
    if(!btn) return null;
    const group = btn.closest('.chapter-control') || btn.parentElement;
    if(!group) return null;
    const s = side === 'before' ? group.previousElementSibling : group.nextElementSibling;
    return (s && s.classList && s.classList.contains('cc-sep')) ? s : null;
  };

  /* [ the chapter-bar hairline , where it must land in the toolbar ] */
  const DIVIDERS = [
    { sep: function(bar){ return sepNear(bar, '[data-act="notes-open"]', 'before'); },
      at:  function(tb){ const g = groupOf(tb, '[data-cmd="bold"]');      return g ? g.getBoundingClientRect().left  - 0.5 : null; } },
    { sep: function(bar){ return sepNear(bar, '[data-act="util-open"]',  'after');  },
      at:  function(tb){ const g = groupOf(tb, '[data-cmd="subscript"]'); return g ? g.getBoundingClientRect().right - 0.5 : null; } }
  ];

  const shift = function(el, dx){
    if(!el || Math.abs(dx) < 0.5) return;
    const d = Math.max(-520, Math.min(520, dx));
    el.setAttribute('data-align-shift', '1');
    el.style.transform = 'translateX(' + (Math.round(d * 10) / 10) + 'px)';
  };

  const align = function(){
    const bar = document.getElementById('chapterControls');
    const tb  = document.getElementById('writeToolbar');
    if(!bar || !tb) return;
    if(!bar.getBoundingClientRect().height || !tb.getBoundingClientRect().height) return;

    /* wipe last pass's shifts before measuring */
    Array.prototype.slice.call(bar.querySelectorAll('[data-align-shift]')).forEach(function(el){
      el.style.transform = '';
      el.removeAttribute('data-align-shift');
    });

    /* 1 · the icons, centre to centre */
    PAIRS.forEach(function(p){
      const icon = bar.querySelector(p[0]);
      const ref  = tb.querySelector(p[1]);
      if(!icon || !ref) return;
      const g = icon.getBoundingClientRect();
      const r = ref.getBoundingClientRect();
      if(!g.width || !r.width) return;
      shift(icon, (r.left + r.width / 2) - (g.left + g.width / 2));
    });

    /* 2 · the hairlines, line to line */
    DIVIDERS.forEach(function(d){
      const sep = d.sep(bar);
      if(!sep) return;
      const at = d.at(tb);
      if(at == null) return;
      const g = sep.getBoundingClientRect();
      if(!g.width) return;
      shift(sep, at - (g.left + g.width / 2));
    });
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; align(); });
  };
  window.SF_ALIGN_CHAPTER = schedule;

  window.addEventListener('resize', schedule);

  if(typeof MutationObserver === 'function' && document.body){
    /* childList only — our own inline transforms must not re-trigger this */
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  const start = function(){ schedule(); setTimeout(schedule, 120); setTimeout(schedule, 400); };
  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
