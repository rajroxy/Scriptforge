/* ═══════════════════════════════════════════════════════════
   Plan — the head.

   · T stays on the left, with “New board” right after it.
   · Top right: an “All boards” switch, then Reset.
       – All boards  : on, the board tightens up so every card is on
                       screen at once instead of scrolling.
       – Reset       : clears the board (the app's own confirm first —
                       it reuses the clear-beats action).
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const on = function(){ return !!(S.config && S.config.planAll); };

  const paintSwitch = function(btn){
    if(!btn) return;
    btn.classList.toggle('on', on());
    btn.setAttribute('aria-pressed', on() ? 'true' : 'false');
  };

  const orig = PAGE_RENDERERS.plan;
  PAGE_RENDERERS.plan = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    const head = root.querySelector('.plan-head') || root.querySelector('.page-head');
    if(!head) return;

    /* ── the buttons are the page's own; plan-boards.js places them.
       Add beat is not renamed: starting a board is the picker's own ＋. ── */

    /* ── right: All boards, then Reset ── */
    let right = head.querySelector('.plan-actions');
    if(!right){
      right = document.createElement('div');
      right.className = 'ol-actions plan-actions';
      head.appendChild(right);
    }

    let allSw = right.querySelector('[data-act="plan-all"]');
    if(!allSw){
      allSw = document.createElement('button');
      allSw.className = 'ol-btn plan-allsw';
      allSw.setAttribute('data-act', 'plan-all');
      allSw.title = 'Fit every board on screen at once';
      allSw.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> All boards';
      right.insertBefore(allSw, right.firstChild || null);
    }
    paintSwitch(allSw);

    /* one Clear for the board — the page already draws one, so only add it
       when this head has none at all */
    if(!head.querySelector('[data-act="clear-beats"]')){
      const reset = document.createElement('button');
      reset.className = 'ol-btn';
      reset.setAttribute('data-act', 'clear-beats');
      reset.title = 'Clear the cards off this board';
      reset.innerHTML = '<i class="bi bi-eraser"></i> Clear';
      right.appendChild(reset);
    }

    /* the switch's state lives on the page */
    root.classList.toggle('plan-all', on());
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="plan-all"]')) return;
    e.preventDefault();
    if(!S.config) S.config = {};
    S.config.planAll = !S.config.planAll;
    if(typeof save === 'function') save();
    paintSwitch(t.closest('[data-act="plan-all"]'));
    const root = document.getElementById('page-plan');
    if(root) root.classList.toggle('plan-all', on());
  }, true);
})();
