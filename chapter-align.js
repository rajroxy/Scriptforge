/* ═══════════════════════════════════════════════════════════
   Writer — the chapter bar sits on the toolbar's columns.

   Two rows, two jobs:

   · ICONS   Notes → Bold · Book → Italic · Utilities → Subscript
             each icon takes its own transform until its centre lands on
             the centre of the toolbar button it belongs under.

   · DIVIDERS
             the hairline BEFORE the note icon lands on the toolbar's own
             divider before Bold, and the hairline AFTER the utility icon
             lands on the toolbar's divider after Subscript — so the two
             rows read as one grid down the page.

   WHY THE LINE WANDERED OFF ITS MARK

   A divider is placed with its left margin. The stylesheet declares
   `margin:0 10px !important` on .cc-sep, and an important stylesheet rule
   beats an inline style — so every margin this file wrote was thrown away
   and the hairline simply sat where the CSS left it. That is why the bar
   showed a divider of its own instead of the toolbar's. The margin is now
   written with !important too (setProperty with a priority), so it is the
   one that wins, and the line lands where it is aimed.

   A margin moves the line AND everything after it, so the row keeps its
   order and the icons are measured after the hairlines. The margin is
   clamped into the gap the line owns: it can never be dragged onto the
   selects on one side or onto the note icon on the other.

   Re-measured whenever either bar redraws and on resize. Every shift is
   wiped before each pass, so a redraw can never stack two of them.
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

  /* [ the chapter-bar hairline , where it must land in the toolbar ]
     A toolbar divider is the right border of the group before the next one,
     so the line to aim at is that group's right edge. */
  const DIVIDERS = [
    { sep: function(bar){ return sepNear(bar, '[data-act="notes-open"]', 'before'); },
      at:  function(tb){
        const g = groupOf(tb, '[data-cmd="bold"]');
        if(!g) return null;
        const before = g.previousElementSibling;
        return before ? before.getBoundingClientRect().right
                      : g.getBoundingClientRect().left;
      } },
    { sep: function(bar){ return sepNear(bar, '[data-act="util-open"]', 'after'); },
      at:  function(tb){
        const g = groupOf(tb, '[data-cmd="subscript"]');
        return g ? g.getBoundingClientRect().right : null;
      } }
  ];

  const SEP_BASE = 10;          /* the resting margin .cc-sep wears (polish.css) */
  const SEP_MAX  = 520;
  const SEP_MIN  = -160;        /* it may travel back a little too */

  const shift = function(el, dx){
    if(!el || Math.abs(dx) < 0.5) return;
    const d = Math.max(-520, Math.min(520, dx));
    el.setAttribute('data-align-shift', '1');
    el.style.transform = 'translateX(' + (Math.round(d * 10) / 10) + 'px)';
  };

  /* the margin has to be written with a priority, or the stylesheet's
     `margin:0 10px !important` wins and the line never moves (see above) */
  const setMargin = function(sep, px){
    try{ sep.style.setProperty('margin-left', px + 'px', 'important'); }
    catch(e){ sep.style.marginLeft = px + 'px'; }
  };

  /* one hairline: back to its resting margin, measure, then the margin that
     lands its centre on the toolbar's line — kept inside its own gap */
  const place = function(sep, at){
    if(!sep || at == null) return;
    setMargin(sep, SEP_BASE);
    const g = sep.getBoundingClientRect();
    if(!g.width) return;

    const dx = at - (g.left + g.width / 2);
    let m = SEP_BASE + dx;
    m = Math.max(SEP_MIN, Math.min(SEP_MAX, m));

    /* It may never be dragged onto the selects on its left. Moving right is
       always safe: its margin carries the whole rest of the row with it, so
       the space the line has on either side never shrinks. */
    const prev = sep.previousElementSibling;
    if(prev){
      const pr = prev.getBoundingClientRect().right;
      if(pr) m = Math.max(m, SEP_BASE + (pr + 2 - g.left));
    }
    m = Math.max(SEP_MIN, Math.min(SEP_MAX, m));
    setMargin(sep, Math.round(m * 10) / 10);
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
    Array.prototype.slice.call(bar.querySelectorAll('.cc-sep')).forEach(function(el){
      setMargin(el, SEP_BASE);
    });

    /* 1 · the hairlines first — a margin moves the layout, so the icons are
           measured after it, never before */
    DIVIDERS.forEach(function(d){ place(d.sep(bar), d.at(tb)); });

    /* 2 · the icons, centre to centre */
    PAIRS.forEach(function(p){
      const icon = bar.querySelector(p[0]);
      const ref  = tb.querySelector(p[1]);
      if(!icon || !ref) return;
      const g = icon.getBoundingClientRect();
      const r = ref.getBoundingClientRect();
      if(!g.width || !r.width) return;
      shift(icon, (r.left + r.width / 2) - (g.left + g.width / 2));
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
    /* childList only — our own inline margins must not re-trigger this */
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  const start = function(){ schedule(); setTimeout(schedule, 120); setTimeout(schedule, 400); };
  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
