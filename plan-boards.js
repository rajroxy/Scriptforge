/* ═══════════════════════════════════════════════════════════
   Plan — real boards

   A beat board is a board of cards. This layer makes that true:

     · every card belongs to a BOARD, and the boards are named
     · the head carries a board picker (T · board ▾ · New board ·
       Rename · Remove · Add beat) with All boards and Reset on the right
     · “All boards” shows every board at once, each under its own
       heading; off, it shows the board you picked
     · Remove deletes the board you are on together with its cards, so a
       project keeps at least one board
     · Reset clears the board you are on (with the app's confirm)
     · boards live on the project, so each book keeps its own

   Cards are drawn by the app's own renderBeats; this layer only
   decides which of them are on screen and how they are numbered.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const data = function(){ return (typeof D === 'function') ? D() : null; };
  const list = function(){
    const d = data();
    if(!d) return [];
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };
  const boards = function(){
    const d = data();
    if(!d) return [{ id:'b1', name:'Board 1' }];
    if(!Array.isArray(d.planBoards) || !d.planBoards.length) d.planBoards = [{ id:'b1', name:'Board 1' }];
    return d.planBoards;
  };
  const current = function(){
    const d = data();
    const all = boards();
    if(!d) return all[0].id;
    if(!d.planBoard || !all.some(function(b){ return b.id === d.planBoard; })) d.planBoard = all[0].id;
    return d.planBoard;
  };
  const nameOf = function(id){
    const hit = boards().filter(function(b){ return b.id === id; })[0];
    return hit ? hit.name : 'Board';
  };
  const allMode = function(){ return !!(S.config && S.config.planAll); };

  /* a beat that predates boards joins the board you are on */
  const adopt = function(){
    const cur = current();
    list().forEach(function(b){ if(!b.board) b.board = cur; });
  };

  const saveNow = function(){ if(typeof save === 'function') save(); };

  /* ═══ which cards are on screen ═══ */
  const paint = function(){
    const host = document.getElementById('beatList');
    if(!host) return;

    const all = boards();
    const cur = current();
    const beats = list();
    const every = allMode();

    Array.prototype.slice.call(host.querySelectorAll('.plan-board-sep, .plan-board-note')).forEach(function(n){ n.remove(); });

    const cards = Array.prototype.slice.call(host.querySelectorAll('.beat-card'));
    let shown = 0;
    let lastBoard = null;

    cards.forEach(function(card, i){
      const b = beats[i];
      if(!b) return;
      const bid = b.board || cur;

      if(!every && bid !== cur){ card.hidden = true; return; }
      card.hidden = false;
      shown++;

      if(every){
        if(bid !== lastBoard){
          const head = document.createElement('div');
          head.className = 'plan-board-sep';
          head.innerHTML = '<i class="bi bi-columns-gap"></i><span>' + esc(nameOf(bid)) + '</span>';
          host.insertBefore(head, card);
          lastBoard = bid;
        }
        const tag = card.querySelector('.beat-index');
        if(tag) tag.textContent = '·';
      }else{
        const tag = card.querySelector('.beat-index');
        if(tag) tag.textContent = String(shown).padStart(2, '0');
      }
    });

    if(!shown && !every){
      const note = document.createElement('div');
      note.className = 'beat-empty plan-board-note';
      note.innerHTML = '<i class="bi bi-columns-gap"></i><div><b>' + esc(nameOf(cur))
        + '</b> is empty — press <b>Add beat</b> to start this board.</div>';
      host.insertBefore(note, host.firstChild);
    }
  };

  /* ═══ the board always ends on screen ═══
     However the page around it is sized, the board is never allowed to run
     past the bottom of the window: its height is measured from where it
     starts down to the page's own bottom edge, so a third or fourth row of
     cards can always be scrolled into view. A board that is shorter than the
     room keeps its natural height — this only ever caps it. */
  const fit = function(){
    const host = document.getElementById('beatList');
    const page = document.getElementById('page-plan');
    if(!host || !page || !host.getBoundingClientRect || !page.getBoundingClientRect) return;

    const pr = page.getBoundingClientRect();
    if(pr.height < 40) return;                       /* the page is not on screen */
    const hr = host.getBoundingClientRect();
    if(hr.height < 1) return;

    const bottom = Math.min(pr.bottom, window.innerHeight);
    const room = Math.max(160, Math.round(bottom - hr.top - 12));
    const now = host.style.getPropertyValue('max-height');
    if(now !== room + 'px') host.style.setProperty('max-height', room + 'px', 'important');
  };

  const refit = function(){
    if(typeof requestAnimationFrame !== 'function'){ fit(); return; }
    requestAnimationFrame(function(){ fit(); });
  };

  window.renderBeats = (function(prev){
    return function(){
      adopt();
      const r = (typeof prev === 'function') ? prev.apply(this, arguments) : undefined;
      try{ paint(); }catch(e){ console.warn('board paint failed:', e); }
      refit();
      return r;
    };
  })(window.renderBeats);

  window.addEventListener('resize', refit);
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('#page-plan')) refit();
  }, true);

  /* ═══ the head ═══
     One row, two groups and nothing doubled:

       left   T · Add beat                       (the page's writing tools)
       right  ＋ · ✎ · 🗑 · which board · count · All boards · Clear

     Add beat sits beside T, where the writer adds a card; the board's own
     controls — start one, rename it, remove it, and the picker that says
     which board you are on — end the row on the right. Every button the
     app drew is re-used; this only places and orders them. */
  const head = function(root){
    if(!root || !root.querySelector) return;
    const bar = root.querySelector('.page-head');
    if(!bar) return;

    adopt();
    const all = boards();
    const cur = current();

    /* the beat adder keeps its own name — New board is a different button */
    const addBeat = bar.querySelector('[data-act="add-beat"]');
    if(addBeat){
      addBeat.innerHTML = '<i class="bi bi-plus-lg"></i> Add beat';
      addBeat.title = 'Add a card to this board';
    }

    const left = bar.querySelector('.ol-head-left') || bar;

    /* ── the right group holds every board action, once ──
       (plan-head.js may have added a second Clear button — the board keeps
       one and drops the rest) */
    let right = bar.querySelector('.plan-actions');
    if(!right){
      right = document.createElement('div');
      right.className = 'ol-actions plan-actions';
      bar.appendChild(right);
    }
    const clears = Array.prototype.slice.call(bar.querySelectorAll('[data-act="clear-beats"]'));
    clears.forEach(function(b, i){ if(i) b.remove(); });
    const clear = clears[0] || null;
    if(clear){
      clear.className = 'ol-btn plan-btn-clear';
      clear.innerHTML = '<i class="bi bi-eraser"></i> Clear';
    }

    /* ── Add beat stays on the LEFT, right after T ──
       It is the page's writing tool: it adds a card to the board you are
       on, so it belongs with the type button, not with the board's own
       commands. */
    if(addBeat && left !== bar && left.firstElementChild){
      const typo = left.querySelector('[data-typop]');
      left.appendChild(addBeat);
      if(typo && left.firstElementChild !== typo) left.insertBefore(typo, left.firstChild);
    }

    /* one home for the page's own switches, in the order they read
       (appendChild moves a node that is already there, so this is also the
       sort). Add act / Add scene were taken off the bar long ago. */
    [bar.querySelector('[data-act="plan-all"]'),
     clear].forEach(function(b){
      if(b) right.appendChild(b);
    });

    /* ── the board cluster ends the row: ＋ · rename · remove · picker ──
       It is placed BEFORE All boards and Clear, so those stay the last
       thing on the bar and the board's own controls read as one cluster. */

    /* the page's old action group is empty now — it goes */
    Array.prototype.forEach.call(bar.querySelectorAll('.plan-tools'), function(g){
      if(!g.children.length) g.remove();
    });

    /* the typography button stays at the far left, before the picker */
    const typo = bar.querySelector('[data-typop]');
    if(typo && left.firstElementChild !== typo) left.insertBefore(typo, left.firstChild);

    /* rebuilt every render: the app's dropdown card draws this select, so a
       fresh node is the only way to be sure the label is right */
    const old = bar.querySelector('[data-plan-picker]');
    if(old) old.remove();
    {
      const picker = document.createElement('span');
      picker.className = 'plan-picker';
      picker.setAttribute('data-plan-picker', '1');
      picker.innerHTML =
          '<button class="ol-btn ol-btn-icon plan-board-new" data-plan-new title="Add board — start a new one"><i class="bi bi-plus-lg"></i></button>'
        + '<button class="ol-btn ol-btn-icon plan-board-ren" data-plan-ren title="Rename this board"><i class="bi bi-pencil"></i></button>'
        + '<button class="ol-btn ol-btn-icon plan-board-del" data-plan-del title="Remove this board"'
        +   (all.length < 2 ? ' disabled' : '') + '><i class="bi bi-trash3"></i></button>'
        + '<select class="sel plan-board-sel" data-plan-board title="Which board to show">'
        + all.map(function(b){
            return '<option value="' + esc(b.id) + '"' + (b.id === cur ? ' selected' : '') + '>'
              + esc(b.name) + '</option>';
          }).join('')
        + '</select>'
        + '<span class="plan-board-count" data-plan-count>' + all.length + ' board' + (all.length === 1 ? '' : 's') + '</span>';
      /* the cluster ends the row, before All boards and Clear */
      if(right.firstChild) right.insertBefore(picker, right.firstChild);
      else right.appendChild(picker);
      if(typeof window.enhanceSelects === 'function') window.enhanceSelects(picker);
    }

    /* the right side keeps All boards · Clear, with a clearer word each */
    const allSw = bar.querySelector('[data-act="plan-all"]');
    if(allSw){
      allSw.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> All boards';
      allSw.title = 'Show every board at once';
      allSw.classList.toggle('on', allMode());
    }
    const reset = bar.querySelector('[data-act="clear-beats"]');
    if(reset){
      reset.title = allMode() ? 'Clear every board' : 'Clear ' + nameOf(cur);
    }
  };

  const wrap = PAGE_RENDERERS.plan;
  PAGE_RENDERERS.plan = function(root){
    const r = wrap.call(this, root);
    try{ head(root); }catch(e){ console.warn('board head failed:', e); }
    return r;
  };

  /* keep the picker alive when the board redraws itself */
  const rerender = function(){ try{ window.renderBeats(); }catch(e){} };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-plan-new]')){
      e.preventDefault();
      const d = data();
      const all = boards();
      let n = all.length + 1;
      while(all.some(function(b){ return b.name === 'Board ' + n; })) n++;
      const id = 'b' + Date.now().toString(36);
      all.push({ id: id, name: 'Board ' + n });
      if(d) d.planBoard = id;
      saveNow();
      if(typeof goPage === 'function') goPage('plan');
      else { const root = document.getElementById('page-plan'); if(root && PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root); }
      if(typeof toast === 'function') toast('Board ' + n + ' started');
      return;
    }

    /* remove the board you are on, together with its cards */
    if(t.closest('[data-plan-del]')){
      e.preventDefault();
      const d = data();
      const all = boards();
      if(all.length < 2){
        if(typeof toast === 'function') toast('A project keeps at least one board', 'warn');
        return;
      }
      const cur = current();
      const name = nameOf(cur);
      const mine = list().filter(function(b){ return b.board === cur; }).length;
      if(!confirm('Remove “' + name + '”'
        + (mine ? ' and its ' + mine + ' card' + (mine === 1 ? '' : 's') : '') + '?')) return;

      /* its cards go with it; every other board is untouched */
      const keep = list().filter(function(b){ return b.board !== cur; });
      list().length = 0;
      keep.forEach(function(b){ list().push(b); });

      const rest = all.filter(function(b){ return b.id !== cur; });
      if(d) d.planBoards = rest;
      if(d) d.planBoard = rest[0].id;
      saveNow();
      rerender();
      const root = document.getElementById('page-plan');
      if(root){
        if(PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root);
        else head(root);
      }
      if(typeof toast === 'function') toast('“' + name + '” removed');
      return;
    }

    if(t.closest('[data-plan-ren]')){
      e.preventDefault();
      const cur = current();
      const board = boards().filter(function(b){ return b.id === cur; })[0];
      if(!board) return;
      const name = prompt('Board name', board.name);
      if(name === null) return;
      const clean = String(name).trim();
      if(!clean) return;
      board.name = clean.slice(0, 40);
      saveNow();
      const root = document.getElementById('page-plan');
      if(root && PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root);
      return;
    }
  }, true);

  document.addEventListener('change', function(e){
    const sel = e.target;
    if(!sel || !sel.dataset || sel.dataset.planBoard === undefined) return;
    const d = data();
    if(!d) return;
    d.planBoard = sel.value;
    saveNow();
    rerender();
    const root = document.getElementById('page-plan');
    if(root) head(root);
  }, true);

  /* All boards flips the filter with it */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="plan-all"]')) return;
    setTimeout(function(){
      rerender();
      const root = document.getElementById('page-plan');
      if(root) head(root);
    }, 0);
  }, true);

  /* Reset clears the board you are on, not every board — unless you are
     looking at all of them. Registered on the window so it runs before the
     app's own capture handler for the same button. */
  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="clear-beats"]')) return;
    if(boards().length < 2) return;                       /* one board → the app's clear is fine */

    e.preventDefault();
    e.stopPropagation();
    const d = data();
    const cur = current();

    if(allMode()){
      const n = list().length;
      if(!n) return;
      if(!confirm('Remove all ' + n + ' cards from every board?')) return;
      list().length = 0;
      saveNow();
      rerender();
      return;
    }

    const mine = list().filter(function(b){ return b.board === cur; }).length;
    if(!mine) return;
    if(!confirm('Remove all ' + mine + ' cards from “' + nameOf(cur) + '”?')) return;
    const keep = list().filter(function(b){ return b.board !== cur; });
    list().length = 0;
    keep.forEach(function(b){ list().push(b); });
    saveNow();
    rerender();
  }, true);
})();
