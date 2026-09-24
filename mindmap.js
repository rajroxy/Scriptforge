/* ═══════════════════════════════════════════════════════════
   ScriptForge — Canvas (visual relationships)

   A canvas for visual relationships, in the spirit of Obsidian's canvas:
   cards you drag anywhere, links between them, pan and zoom, all saved
   with the project.

   · New card        — adds a card in the middle of the view
   · drag the card   — move it (drag its head or its body)
   · drag its dot    — onto another card to link the two
   · click a link    — removes it
   · empty space     — drag to pan, wheel to zoom, double-click to add
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const PAGE = 'mindmap';
  const ICON = 'diagram-3';
  const NAME = 'Canvas';
  const NODE_W = 220;

  /* ── the page exists everywhere: PAGE_META + each mode's FAB menu ──
     It used to be called “Mind map”; every stored entry is renamed here so
     the page menu, its tooltip and the command box all read “Canvas”. ── */
  try{
    if(typeof PAGE_META === 'object') PAGE_META[PAGE] = { name:NAME, icon:ICON };
    const rename = function(list){
      (list || []).forEach(function(v){
        if(v && typeof v === 'object' && v.id === PAGE) v.name = NAME;
      });
    };
    if(typeof MODES === 'object' && Array.isArray(MODES)){
      MODES.forEach(function(m){
        if(!Array.isArray(m.editorViews)) m.editorViews = [];
        if(m.editorViews.indexOf(PAGE) < 0) m.editorViews.push(PAGE);
        if(!Array.isArray(m.fabGroups)) m.fabGroups = [];
        let ref = m.fabGroups.filter(function(g){ return g && g.label === 'Reference'; })[0];
        if(!ref){ ref = { label:'Reference', views:[] }; m.fabGroups.push(ref); }
        if(!Array.isArray(ref.views)) ref.views = [];
        rename(ref.views);
        const has = ref.views.some(function(v){ return (typeof v === 'string' ? v : v.id) === PAGE; });
        if(!has) ref.views.push({ id:PAGE, name:NAME, icon:ICON });
      });
    }
  }catch(e){ /* the page still works, it just will not be listed */ }

  /* ── data — the project's own canvas when there is a project ── */
  const blank = function(){ return { nodes:[], links:[], view:{ x:0, y:0, k:1 } }; };

  const store = function(create){
    let proj = null;
    try{ proj = (typeof kbProj === 'function') ? kbProj() : null; }catch(e){ proj = null; }
    const d = (typeof D === 'function') ? D() : null;

    if(proj){
      if(!proj.mindmap && create) proj.mindmap = blank();
      if(proj.mindmap){ normalise(proj.mindmap); return proj.mindmap; }
    }
    if(!d) return null;
    if(!d.mindmap && create) d.mindmap = blank();
    if(!d.mindmap) return null;
    normalise(d.mindmap);
    return d.mindmap;
  };

  /* an old or hand-edited canvas must never break the page */
  function normalise(st){
    if(!Array.isArray(st.nodes)) st.nodes = [];
    if(!Array.isArray(st.links)) st.links = [];
    if(!st.view || typeof st.view !== 'object') st.view = { x:0, y:0, k:1 };
    /* a saved zoom is only kept when it is a real number — a hand-edited or
       half-written file must never leave the canvas on “NaN%” */
    const kn = +st.view.k;
    st.view.k = isFinite(kn) ? Math.max(0.35, Math.min(2.5, kn)) : 1;
    const xn = +st.view.x, yn = +st.view.y;
    st.view.x = isFinite(xn) ? xn : 0;
    st.view.y = isFinite(yn) ? yn : 0;
    st.nodes.forEach(function(n, i){
      n.id = n.id || ('n' + i + Math.random().toString(36).slice(2, 6));
      n.x = +n.x || 0; n.y = +n.y || 0;
      n.text = (n.text == null) ? '' : String(n.text);
    });
    st.links = st.links.filter(function(l){
      return l && st.nodes.some(function(n){ return n.id === l.a; }) && st.nodes.some(function(n){ return n.id === l.b; }) && l.a !== l.b;
    });
  }

  /* ── live page state ── */
  let stage = null, world = null, svg = null;
  let drag = null;        /* { kind:'pan'|'node'|'link', … } */
  let frame = 0;

  const el = function(sel){ return document.querySelector(sel); };
  const nodeById = function(st, id){
    return st.nodes.filter(function(n){ return n.id === id; })[0] || null;
  };

  /* the zoom readout, and the transform that goes with it, are always a
     real number — whatever the state holds */
  const num = function(v, fallback){ const n = +v; return isFinite(n) ? n : fallback; };
  const zoomText = function(k){ return Math.round(num(k, 1) * 100) + '%'; };

  const applyView = function(){
    const st = store(false);
    if(!st || !world) return;
    const k = num(st.view.k, 1), x = num(st.view.x, 0), y = num(st.view.y, 0);
    if(k !== st.view.k) st.view.k = k;
    if(x !== st.view.x) st.view.x = x;
    if(y !== st.view.y) st.view.y = y;
    world.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + k + ')';
    const label = el('[data-mm="zoom-label"]');
    if(label) label.textContent = zoomText(k);
    draw();
  };

  const draw = function(){
    const st = store(false);
    if(!st || !svg || !stage || !world) return;
    const sRect = stage.getBoundingClientRect();
    const at = function(id){
      const n = world.querySelector('[data-mm-node="' + id + '"]');
      if(!n) return null;
      const r = n.getBoundingClientRect();
      return { x:r.left - sRect.left, y:r.top - sRect.top, w:r.width, h:r.height };
    };
    const path = function(a, b){
      const ax = a.x + a.w, ay = a.y + a.h / 2;      /* out of the right edge */
      const bx = b.x,       by = b.y + b.h / 2;      /* into the left edge  */
      const dx = Math.max(36, Math.abs(bx - ax) * 0.5);
      return 'M' + ax + ' ' + ay + ' C' + (ax + dx) + ' ' + ay + ', ' + (bx - dx) + ' ' + by + ', ' + bx + ' ' + by;
    };

    let out = '';
    st.links.forEach(function(l){
      const a = at(l.a), b = at(l.b);
      if(!a || !b) return;
      const d = path(a, b);
      out += '<path class="mm-link" d="' + d + '"/>'
          +  '<path class="mm-link-hit" data-mm-link="' + l.id + '" d="' + d + '"/>';
    });
    if(drag && drag.kind === 'link'){
      const from = at(drag.from);
      if(from){
        const ax = from.x + from.w, ay = from.y + from.h / 2;
        const dx = Math.max(30, Math.abs(drag.px - ax) * 0.5);
        out += '<path class="mm-link mm-link-temp" d="M' + ax + ' ' + ay
            +  ' C' + (ax + dx) + ' ' + ay + ', ' + (drag.px - dx) + ' ' + drag.py + ', ' + drag.px + ' ' + drag.py + '"/>';
      }
    }
    svg.innerHTML = out;
  };

  const schedule = function(){
    if(frame) return;
    frame = requestAnimationFrame(function(){ frame = 0; draw(); });
  };

  /* ── nodes ── */
  const addNode = function(x, y, text){
    const st = store(true);
    if(!st) return null;
    const n = { id:'n' + Math.random().toString(36).slice(2, 8), x:Math.round(x), y:Math.round(y), text:text || '' };
    st.nodes.push(n);
    if(typeof save === 'function') save();
    return n;
  };

  const paint = function(){
    const st = store(true);
    if(!st || !world) return;
    world.innerHTML = st.nodes.map(function(n){
      return '<div class="mm-node" data-mm-node="' + n.id + '" style="left:' + n.x + 'px; top:' + n.y + 'px; width:' + NODE_W + 'px;">'
        + '<div class="mm-node-head">'
        +   '<i class="bi bi-grip-vertical"></i>'
        +   '<b>' + (n.text ? esc(n.text.slice(0, 22)) : 'New card') + '</b>'
        +   '<button class="mm-node-x" data-mm-del="' + n.id + '" title="Remove this card"><i class="bi bi-x-lg"></i></button>'
        + '</div>'
        + '<textarea class="mm-node-text" data-mm-text="' + n.id + '" rows="3" placeholder="Type a name, a person, a place, an idea\u2026">' + esc(n.text || '') + '</textarea>'
        + '<span class="mm-port" data-mm-port="' + n.id + '" title="Drag onto another card to link them"></span>'
        + '</div>';
    }).join('');

    /* textareas grow with their text */
    Array.prototype.slice.call(world.querySelectorAll('.mm-node-text')).forEach(function(ta){
      grow(ta);
    });

    /* No copy over the canvas: the empty state is the glyph alone. */
    if(!st.nodes.length){
      world.innerHTML = '<div class="mm-empty"><i class="bi ' + ICON + '"></i></div>';
    }
    applyView();
    /* the cards were re-created, so the arm's mark goes back on */
    if(armed) markArmed();
  };

  const grow = function(ta){
    if(!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.max(52, ta.scrollHeight) + 'px';
  };

  /* ── the stage ── */
  const stagePoint = function(e){
    const r = stage.getBoundingClientRect();
    return { x:e.clientX - r.left, y:e.clientY - r.top };
  };

  const centre = function(){
    const st = store(false);
    const p = { x:0, y:0 };
    if(!stage) return p;
    const r = stage.getBoundingClientRect();
    if(st) p.x = (r.width / 2 - num(st.view.x, 0)) / num(st.view.k, 1) - NODE_W / 2;
    if(st) p.y = (r.height / 2 - num(st.view.y, 0)) / num(st.view.k, 1) - 60;
    return { x:p.x + (st ? (st.nodes.length % 4) * 26 : 0), y:p.y + (st ? (st.nodes.length % 4) * 22 : 0) };
  };

  const fit = function(){
    const st = store(false);
    if(!st || !stage || !world) return;
    const nodes = Array.prototype.slice.call(world.querySelectorAll('.mm-node'));
    if(!nodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function(n){
      const x = parseFloat(n.style.left) || 0, y = parseFloat(n.style.top) || 0;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + n.offsetWidth); maxY = Math.max(maxY, y + n.offsetHeight);
    });
    const r = stage.getBoundingClientRect();
    const pad = 40;
    let k = Math.max(0.35, Math.min(1.6, Math.min((r.width - pad * 2) / Math.max(1, maxX - minX), (r.height - pad * 2) / Math.max(1, maxY - minY))));
    /* a card with no measurable box must not poison the view with NaN */
    if(!isFinite(k)) k = 1;
    let fx = pad - minX * k + Math.max(0, (r.width - pad * 2 - (maxX - minX) * k) / 2);
    let fy = pad - minY * k + Math.max(0, (r.height - pad * 2 - (maxY - minY) * k) / 2);
    st.view.k = k;
    st.view.x = isFinite(fx) ? fx : 0;
    st.view.y = isFinite(fy) ? fy : 0;
    if(typeof save === 'function') save();
    applyView();
  };

  /* ═══ the page ═══ */
  PAGE_RENDERERS[PAGE] = function(root){
    const st = store(true);
    if(!st) return;

    /* the head is the page's own bar (the same box Draft and Idea wear) —
       it sits above the canvas card, not inside it */
    root.innerHTML =
      '<div class="page-head ol-head mm-head">'
      +   '<div class="ol-head-left">'
      +     '<button class="ol-btn ol-btn-icon" data-typop="mindmap" title="Font, size and leading"><i class="bi bi-fonts"></i></button>'
      +     '<button class="ol-btn" data-mm="add"><i class="bi bi-plus-lg"></i> New card</button>'
      +   '</div>'
      /* The right end of the bar: the magnifier and Clear, in that order —
         Clear is the last thing on the bar, at its far right.

         Fit to screen is its OWN icon on the bar, between the magnifier
         and Clear — one click, no menu, the way it is used. The magnifier
         keeps the two size steps: they are the same action at two
         strengths and they stay open while you use them, so you can nudge
         the size more than once without reopening it. The trigger is the
         magnifier and nothing else, so no number is drawn on the bar —
         there is no readout to go stale or read “NaN”.

         Zooming is still the wheel over the canvas and the drag of empty
         space; the popup is the same two commands by name. */
      +   '<div class="ol-actions mm-actions">'
      +     '<div class="mm-zoomwrap">'
      +       '<button class="ol-btn ol-btn-icon" data-mm="zoom-panel" title="Zoom" aria-haspopup="true"><i class="bi bi-zoom-in"></i></button>'
      +       '<div class="mm-zoombox" data-mm="zoom-box" hidden>'
      +         '<button class="ol-btn" data-mm="zoom-in"><i class="bi bi-zoom-in"></i> Zoom in</button>'
      +         '<button class="ol-btn" data-mm="zoom-out"><i class="bi bi-zoom-out"></i> Zoom out</button>'
      +       '</div>'
      +     '</div>'
      +     '<button class="ol-btn ol-btn-icon" data-mm="fit" title="Fit to screen"><i class="bi bi-arrows-angle-contract"></i></button>'
      +     '<button class="ol-btn" data-mm="clear" title="Clear canvas"><i class="bi bi-eraser"></i> Clear</button>'
      +   '</div>'
      + '</div>'
      + '<div class="mm-wrap">'
      +   '<div class="mm-stage" data-mm="stage">'
      +     '<svg class="mm-links" data-mm="links" xmlns="http://www.w3.org/2000/svg"></svg>'
      +     '<div class="mm-world" data-mm="world"></div>'
      +   '</div>'
      + '</div>';

    stage = root.querySelector('[data-mm="stage"]');
    world = root.querySelector('[data-mm="world"]');
    svg   = root.querySelector('[data-mm="links"]');

    paint();
    /* the T button's type applies to the card text (see polish.css) */
    if(typeof typoApply === 'function') typoApply(PAGE, root);

    /* the page's own commands, for the menu that lists them (final-fix.js
       drops Fit · Zoom in · Zoom out · Clear canvas into the canvas's
       right-click list) */
    window.sfCanvas = {
      fit: function(){ try{ fit(); }catch(e){} },
      zoomIn: function(){ try{ zoomBy(1); }catch(e){} },
      zoomOut: function(){ try{ zoomBy(-1); }catch(e){} },
      clear: function(){
        const st = store(false);
        if(!st || !st.nodes.length) return;
        if(!confirm('Remove every card and link from this canvas?')) return;
        st.nodes = []; st.links = [];
        if(typeof save === 'function') save();
        paint();
        if(typeof toast === 'function') toast('Canvas cleared');
      },
      arm: armFrom,
      addCard: function(){ addNode(centre().x, centre().y); paint(); }
    };
    requestAnimationFrame(function(){
      paint();
      /* open centred: frame the cards if there are any, otherwise put the
         canvas origin in the middle so the first card lands dead centre */
      const st = store(false);
      if(st && st.nodes.length){ fit(); return; }
      if(st && stage && (st.view.x === 0 && st.view.y === 0)){
        const r = stage.getBoundingClientRect();
        st.view.x = Math.round(r.width / 2);
        st.view.y = Math.round(r.height / 2);
        if(typeof save === 'function') save();
        applyView();
      }
    });
  };

  /* the size steps, used by the bar, the menu and the wheel alike */
  const zoomBy = function(dir){
    const st = store(false);
    if(!st || !stage) return;
    const r = stage.getBoundingClientRect();
    const mx = r.width / 2, my = r.height / 2;
    const cur = num(st.view.k, 1);
    const wx = (mx - num(st.view.x, 0)) / cur, wy = (my - num(st.view.y, 0)) / cur;
    const next = cur * (dir > 0 ? 1.15 : 1 / 1.15);
    st.view.k = isFinite(next) ? Math.max(0.35, Math.min(2.5, next)) : cur;
    const nx = mx - wx * st.view.k, ny = my - wy * st.view.k;
    st.view.x = isFinite(nx) ? nx : 0;
    st.view.y = isFinite(ny) ? ny : 0;
    if(typeof save === 'function') save();
    applyView();
  };

  /* ═══ point-to-point linking by clicking ═══
     Drag the dot onto a card to link them (that still works). This is the
     other way: click the dot to arm the card, then click any number of
     cards to attach them to it — the arm stays on, so one card can be
     wired to many, one after another. Esc, a click on empty canvas or a
     click on the armed card itself ends it. */
  let armed = null;
  let movedAt = 0;
  const markArmed = function(){
    Array.prototype.forEach.call(document.querySelectorAll('.mm-node.mm-armed'), function(n){ n.classList.remove('mm-armed'); });
    if(!armed || !world) return;
    const n = world.querySelector('[data-mm-node="' + armed + '"]');
    if(n) n.classList.add('mm-armed');
  };
  function armFrom(id){
    armed = (armed === id) ? null : id;
    markArmed();
    return armed;
  }
  const connect = function(a, b){
    const st = store(false);
    if(!st || !a || !b || a === b) return false;
    const exists = st.links.some(function(l){
      return (l.a === a && l.b === b) || (l.a === b && l.b === a);
    });
    if(exists){ if(typeof toast === 'function') toast('Already linked', 'warn'); return false; }
    st.links.push({ id:'l' + Math.random().toString(36).slice(2, 8), a:a, b:b });
    if(typeof save === 'function') save();
    draw();
    return true;
  };
  window.sfCanvasLink = connect;

  /* ═══ buttons ═══ */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const page = document.getElementById('page-' + PAGE);
    if(!page) return;

    /* the armed port: click a card, it is linked — and the arm stays on */
    const port = t.closest('[data-mm-port]');
    if(port){
      e.preventDefault(); e.stopPropagation();
      const id = port.dataset.mmPort;
      armFrom(id);
      if(armed && typeof toast === 'function'){
        toast('Now click the cards to link — Esc when you are done');
      }
      return;
    }
    const nodeEl = t.closest('.mm-node');
    if(armed && nodeEl && !t.closest('textarea, button') && Date.now() - movedAt > 260){
      if(nodeEl.dataset.mmNode === armed){
        armFrom(armed);
      }else{
        const ok = connect(armed, nodeEl.dataset.mmNode);
        if(ok) markArmed();                    /* still armed: link another */
        e.preventDefault();
      }
      return;
    }
    if(armed && !nodeEl && !t.closest('[data-mm]')){
      armed = null; markArmed();
    }

    if(t.closest('[data-mm="add"]')){
      e.preventDefault();
      addNode(centre().x, centre().y);
      paint();
      return;
    }
    if(t.closest('[data-mm="zoom-panel"]')){
      e.preventDefault();
      const box = page.querySelector('[data-mm="zoom-box"]');
      if(box) box.hidden = !box.hidden;
      return;
    }
    /* Fit and the size steps all live in the popup and all leave it open,
       so you can fit and then nudge the size without reopening it. */
    if(t.closest('[data-mm="fit"]')){ e.preventDefault(); fit(); return; }
    if(t.closest('[data-mm="zoom-in"]')){ e.preventDefault(); zoomBy(1); return; }
    if(t.closest('[data-mm="zoom-out"]')){ e.preventDefault(); zoomBy(-1); return; }
    if(t.closest('[data-mm="clear"]')){
      e.preventDefault();
      if(window.sfCanvas) window.sfCanvas.clear();
      return;
    }

    const del = t.closest('[data-mm-del]');
    if(del){
      e.preventDefault(); e.stopPropagation();
      const st = store(false);
      const id = del.dataset.mmDel;
      st.nodes = st.nodes.filter(function(n){ return n.id !== id; });
      st.links = st.links.filter(function(l){ return l.a !== id && l.b !== id; });
      if(typeof save === 'function') save();
      paint();
      return;
    }

    const link = t.closest('[data-mm-link]');
    if(link){
      e.preventDefault(); e.stopPropagation();
      const st = store(false);
      st.links = st.links.filter(function(l){ return l.id !== link.dataset.mmLink; });
      if(typeof save === 'function') save();
      draw();
      if(typeof toast === 'function') toast('Link removed');
      return;
    }
  }, true);

  /* The zoom & fit popup closes the moment the pointer goes anywhere else,
     and on Escape. Registered after the handler above, so a click on its
     own trigger has already toggled it open by the time this runs. */
  const closeZoom = function(){
    Array.prototype.forEach.call(document.querySelectorAll('.mm-zoombox'), function(b){ b.hidden = true; });
  };
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('.mm-zoomwrap')) return;
    closeZoom();
  }, true);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      closeZoom();
      if(armed){ armed = null; markArmed(); }
    }
  }, true);

  /* ═══ text ═══ */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset || !t.dataset.mmText) return;
    const st = store(false);
    const n = st && nodeById(st, t.dataset.mmText);
    if(!n) return;
    n.text = t.value;
    grow(t);
    const head = t.parentElement && t.parentElement.querySelector('.mm-node-head b');
    if(head) head.textContent = n.text ? n.text.slice(0, 22) : 'New card';
    if(typeof save === 'function') save();
    schedule();
  }, true);

  /* ═══ pan · drag · link ═══ */
  const onDown = function(e){
    if(!stage || e.button !== 0) return;
    const t = e.target;
    if(!t || !t.closest) return;

    /* a card */
    const nodeEl = t.closest('.mm-node');
    if(nodeEl){
      const st = store(false);
      const n = st && nodeById(st, nodeEl.dataset.mmNode);
      if(!n) return;

      if(t.closest('[data-mm-port]')){
        drag = { kind:'link', from:n.id, px:0, py:0, to:null };
        const p = stagePoint(e);
        drag.px = p.x; drag.py = p.y;
        try{ stage.setPointerCapture(e.pointerId); }catch(err){}
        e.preventDefault();
        return;
      }
      if(t.closest('textarea, button')) return;      /* typing / buttons */

      const p = stagePoint(e);
      drag = { kind:'node', id:n.id, sx:p.x, sy:p.y, ox:n.x, oy:n.y, moved:false };
      try{ stage.setPointerCapture(e.pointerId); }catch(err){}
      nodeEl.classList.add('mm-held');
      e.preventDefault();
      return;
    }

    /* empty space → pan (and a double-click adds a card) */
    if(t.closest('.mm-node-text')) return;
    const p = stagePoint(e);
    drag = { kind:'pan', sx:p.x, sy:p.y, ox:store(false).view.x, oy:store(false).view.y, moved:false };
    try{ stage.setPointerCapture(e.pointerId); }catch(err){}
    stage.classList.add('mm-panning');
    e.preventDefault();
  };

  const onMove = function(e){
    if(!drag || !stage) return;
    const st = store(false);
    if(!st) return;
    const p = stagePoint(e);

    if(drag.kind === 'pan'){
      if(Math.abs(p.x - drag.sx) > 2 || Math.abs(p.y - drag.sy) > 2){ drag.moved = true; movedAt = Date.now(); }
      st.view.x = drag.ox + (p.x - drag.sx);
      st.view.y = drag.oy + (p.y - drag.sy);
      applyView();
      return;
    }

    if(drag.kind === 'node'){
      const n = nodeById(st, drag.id);
      if(!n) return;
      n.x = Math.round(drag.ox + (p.x - drag.sx) / num(st.view.k, 1));
      n.y = Math.round(drag.oy + (p.y - drag.sy) / num(st.view.k, 1));
      const nEl = world.querySelector('[data-mm-node="' + n.id + '"]');
      if(nEl){ nEl.style.left = n.x + 'px'; nEl.style.top = n.y + 'px'; }
      drag.moved = true; movedAt = Date.now();
      schedule();
      return;
    }

    if(drag.kind === 'link'){
      drag.px = p.x; drag.py = p.y;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const over = under && under.closest ? under.closest('.mm-node') : null;
      drag.to = (over && over.dataset.mmNode && over.dataset.mmNode !== drag.from) ? over.dataset.mmNode : null;
      schedule();
    }
  };

  const onUp = function(e){
    if(!drag || !stage) return;
    const st = store(false);
    const kind = drag.kind;
    const d = drag;
    drag = null;
    stage.classList.remove('mm-panning');
    Array.prototype.slice.call(stage.querySelectorAll('.mm-held')).forEach(function(n){ n.classList.remove('mm-held'); });
    if(!st) return;

    if(kind === 'link' && d.to) connect(d.from, d.to);

    if((kind === 'node' || kind === 'pan') && typeof save === 'function') save();
    draw();
  };

  const onWheel = function(e){
    if(!stage || !e.target.closest || !e.target.closest('.mm-stage')) return;
    const st = store(false);
    if(!st) return;
    e.preventDefault();
    const p = stagePoint(e);
    const cur = num(st.view.k, 1);
    const wx = (p.x - num(st.view.x, 0)) / cur, wy = (p.y - num(st.view.y, 0)) / cur;
    const k = cur * (1 - (+e.deltaY || 0) * 0.0015);
    st.view.k = isFinite(k) ? Math.max(0.35, Math.min(2.5, k)) : cur;
    st.view.x = p.x - wx * st.view.k;
    st.view.y = p.y - wy * st.view.k;
    if(!isFinite(st.view.x)) st.view.x = 0;
    if(!isFinite(st.view.y)) st.view.y = 0;
    applyView();
  };

  const onDbl = function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('.mm-stage')) return;
    if(t.closest('.mm-node')) return;
    const st = store(false);
    if(!st) return;
    const p = stagePoint(e);
    addNode((p.x - num(st.view.x, 0)) / num(st.view.k, 1) - NODE_W / 2,
            (p.y - num(st.view.y, 0)) / num(st.view.k, 1) - 30);
    paint();
    e.preventDefault();
  };

  /* bound once, on the stage itself — re-created with the page */
  document.addEventListener('pointerdown', function(e){
    if(e.target && e.target.closest && e.target.closest('.mm-stage')) onDown(e);
  }, true);
  document.addEventListener('pointermove', function(e){ if(drag) onMove(e); }, true);
  document.addEventListener('pointerup', function(e){ if(drag) onUp(e); }, true);
  document.addEventListener('pointercancel', function(e){ if(drag) onUp(e); }, true);
  document.addEventListener('wheel', function(e){
    if(e.target && e.target.closest && e.target.closest('.mm-stage')) onWheel(e);
  }, { passive:false, capture:true });
  document.addEventListener('dblclick', function(e){
    if(e.target && e.target.closest && e.target.closest('.mm-stage') && !e.target.closest('.mm-node')) onDbl(e);
  }, true);

  window.addEventListener('resize', schedule);
})();
