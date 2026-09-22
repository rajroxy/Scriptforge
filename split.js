/* ═══ ScriptForge — Zen-style writing split ═══ */
(function(){
  'use strict';
  const MIN = .20, MAX = .80;
  const V = { open:false, active:'left', ratio:.50, ids:{left:null,right:null},
              ranges:{left:null,right:null}, modeKey:null, style:{left:null,right:null} };

  const canvas = () => document.getElementById('writeCanvas');
  const allSections = () => flatChs(D().chapters || []);
  const getSection = id => { const f = id ? findCh(id) : null; return f ? f.ch : null; };
  const modeKey = () => String(S.mode||'') + '|' + String(D().currentProject||'');
  const editor = side => document.querySelector('#writeCanvas [data-sf-split-editor="'+side+'"]');
  const esc = v => String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  /* savedRange is a top-level `let` in write.js — same global scope, so writable */
  function putSaved(r){ try{ savedRange = r ? r.cloneRange() : null; }catch(e){} }

  function okRange(r, ed){
    return !!(r && ed && r.startContainer && r.endContainer &&
      ed.contains(r.startContainer) && ed.contains(r.endContainer) &&
      r.startContainer.isConnected !== false && r.endContainer.isConnected !== false);
  }
  function remember(side){
    const ed = editor(side), sel = window.getSelection();
    if(!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)){
      V.ranges[side] = null;
      if(side === V.active) putSaved(null);
      return;
    }
    const r = sel.getRangeAt(0).cloneRange();
    V.ranges[side] = r;
    if(side === V.active) putSaved(r);
  }
  function focusRestore(side){
    const ed = editor(side); if(!ed) return;
    try{ ed.focus({preventScroll:true}); }catch(e){ ed.focus(); }
    const sel = window.getSelection(), r = V.ranges[side];
    if(okRange(r, ed)){ sel.removeAllRanges(); sel.addRange(r.cloneRange()); putSaved(r); return; }
    const end = document.createRange();
    end.selectNodeContents(ed); end.collapse(false);
    sel.removeAllRanges(); sel.addRange(end);
    V.ranges[side] = end.cloneRange(); putSaved(end);
  }
  function saveSide(side){
    const ed = editor(side), ch = getSection(V.ids[side]);
    if(ed && ch) ch.content = ed.innerHTML;
  }
  function saveBoth(){
    saveSide('left'); saveSide('right');
    if(V.ids[V.active]) D().currentChapter = V.ids[V.active];
    if(typeof save === 'function') save();
  }
  function pair(){
    const list = allSections(); if(list.length < 2) return null;
    const ids = list.map(x => x.ch.id), has = id => ids.indexOf(id) !== -1;
    const a = V.active === 'right' ? 'right' : 'left', b = a === 'left' ? 'right' : 'left';
    let cur = D().currentChapter; if(!has(cur)) cur = list[0].ch.id;
    let other = V.ids[b];
    if(!has(other) || other === cur){
      const alt = list.find(x => x.ch.id !== cur); other = alt ? alt.ch.id : null;
    }
    if(!other) return null;
    return { active:a, ids: a === 'left' ? {left:cur,right:other} : {left:other,right:cur} };
  }
  function applyRatio(grid, r){
    V.ratio = Math.max(MIN, Math.min(MAX, r));
    if(grid) grid.style.setProperty('--sf-split-left', (V.ratio*100)+'%');
  }
  function options(sel){
    return allSections().map(it => '<option value="'+esc(it.ch.id)+'"'+
      (it.ch.id===sel?' selected':'')+'>'+
      esc((it.depth?'— '.repeat(it.depth):'') + (it.ch.title||'Untitled'))+'</option>').join('');
  }
  /* ── per-half type ──
     Each half keeps its own font + size, exactly the way each half keeps its
     own chapter. Clicking a half loads its type into the toolbar; changing the
     font/size in the toolbar writes it back to that half only. */
  function styleStore(){
    if(!S.config.splitStyle || typeof S.config.splitStyle !== 'object') S.config.splitStyle = {};
    const d = S.config.splitStyle;
    ['left','right'].forEach(function(k){
      if(!d[k] || typeof d[k] !== 'object') d[k] = { font:S.config.font || '', size:S.config.fontSize || 17 };
      if(typeof d[k].size !== 'number') d[k].size = S.config.fontSize || 17;
      if(d[k].font == null) d[k].font = S.config.font || '';
    });
    return d;
  }
  function applyPaneStyle(side){
    const ed = editor(side); if(!ed) return;
    const st = styleStore()[side];
    ed.style.fontFamily = st.font ? "'" + st.font + "', serif" : '';
    ed.style.fontSize   = st.size ? st.size + 'px' : '';
  }
  function applyPaneStyles(){ applyPaneStyle('left'); applyPaneStyle('right'); }
  /* the toolbar shows the type of the half you are in */
  function toolbarToPane(side){
    const st = styleStore()[side]; if(!st) return;
    S.config.font = st.font; S.config.fontSize = st.size;
    const inp = document.querySelector('[data-tb="fontSize"]');
    if(inp) inp.value = st.size;
    const val = document.querySelector('.tb-drop[data-drop="font"] .tb-drop-value');
    if(val) val.textContent = st.font || 'Default';
    const list = document.querySelectorAll('.tb-drop[data-drop="font"] [data-font-value], .tb-drop[data-drop="font"] .tb-drop-item');
    Array.prototype.forEach.call(list, function(b){
      const v = b.dataset ? (b.dataset.fontValue || b.dataset.value || '') : '';
      if(v) b.classList.toggle('on', v === (st.font || ''));
    });
  }
  /* font / size changed in the toolbar → keep it on the ACTIVE half */
  function paneStyleChanged(){
    const st = styleStore()[V.active];
    st.font = S.config.font || '';
    st.size = S.config.fontSize || 17;
    applyPaneStyle(V.active);
    if(typeof save === 'function') save();
  }

  function changeSection(side, id, select){
    const other = side==='left' ? 'right' : 'left';
    if(id === V.ids[other]){ if(select) select.value = V.ids[side];
      if(typeof toast==='function') toast('Pick a different section','warn'); return; }
    const next = getSection(id); if(!next) return;
    saveBoth(); V.ids[side] = id; V.ranges[side] = null;
    const ed = editor(side); if(ed) ed.innerHTML = next.content || '';
    activate(side, true);
  }
  function makePane(side, id, seed){
    const pane = document.createElement('section');
    pane.className = 'sf-split-pane'; pane.dataset.sfSplitPane = side;
    const head = document.createElement('div');
    head.className = 'sf-split-pane-head';
    head.addEventListener('pointerdown', () => activate(side, false));
    const ed = seed || document.createElement('div');
    ed.removeAttribute('id');
    ed.dataset.sfSplitEditor = side;
    ed.classList.add('write-doc','sf-split-editor');
    ed.setAttribute('contenteditable','true');
    ed.setAttribute('spellcheck','false');
    if(!seed){ const ch = getSection(id); ed.innerHTML = ch ? (ch.content||'') : ''; }
    pane.appendChild(head); pane.appendChild(ed);
    bind(ed, side);
    return pane;
  }
  function bind(ed, side){
    ed.addEventListener('pointerdown', () => activate(side,false), true);
    ed.addEventListener('focus',       () => activate(side,true),  true);
    ed.addEventListener('input', () => {
      if(V.active !== side) activate(side,false);
      D().currentChapter = V.ids[side];
      if(typeof onInput === 'function') onInput(); else { saveSide(side); save(); }
      remember(side);
    });
    ed.addEventListener('keyup', () => { if(V.active===side){ saveSel(); remember(side); } });
    ed.addEventListener('mouseup', () => { if(V.active===side){ saveSel(); remember(side); } });
    ed.addEventListener('blur', () => remember(side));
    ed.addEventListener('contextmenu', e => { if(typeof onCtx==='function') onCtx(e); });
    ed.addEventListener('keydown', e => {
      if((e.key===' '||e.key==='Enter') && typeof mixedFontApply==='function') mixedFontApply();
    });
  }
  function activate(side, focus){
    if(!V.open) return;
    const target = editor(side); if(!target) return;
    const changed = V.active !== side;
    if(changed){ remember(V.active); saveSide(V.active); V.active = side; }
    D().currentChapter = V.ids[side];
    document.querySelectorAll('[data-sf-split-editor]').forEach(el => {
      el.removeAttribute('id');
      const p = el.closest('.sf-split-pane'); if(p) p.classList.remove('is-active');
    });
    target.id = 'editor';
    const ap = target.closest('.sf-split-pane'); if(ap) ap.classList.add('is-active');
    if(typeof renderChapterControls === 'function') renderChapterControls();
    if(typeof updateCounts === 'function') updateCounts();
    putSaved(V.ranges[side]);
    if(focus) focusRestore(side);
    if(changed && typeof save === 'function') save();
    toolbarToPane(side);
  }
  function wireDivider(grid, div){
    let drag = false;
    const move = e => { if(!drag) return; const r = grid.getBoundingClientRect();
      if(!r.width) return; applyRatio(grid, (e.clientX-r.left)/r.width); e.preventDefault(); };
    const end = e => { if(!drag) return; drag = false;
      try{ if(e.pointerId!=null) div.releasePointerCapture(e.pointerId); }catch(x){}
      document.body.classList.remove('sf-split-resizing'); save(); };
    div.addEventListener('pointerdown', e => { drag = true;
      document.body.classList.add('sf-split-resizing');
      try{ div.setPointerCapture(e.pointerId); }catch(x){}
      move(e); e.preventDefault(); });
    div.addEventListener('pointermove', move);
    div.addEventListener('pointerup', end);
    div.addEventListener('pointercancel', end);
    div.addEventListener('keydown', e => {
      if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
      applyRatio(grid, V.ratio + (e.key==='ArrowLeft' ? -.02 : .02)); save(); e.preventDefault();
    });
  }
  function mount(seed){
    const host = canvas(); if(!host) return false;
    const p = pair(); if(!p) return false;
    V.active = p.active; V.ids = p.ids; V.ranges = {left:null,right:null};
    const seedFor = { left:null, right:null };
    seedFor[V.active] = seed ? seed.cloneNode(true) : null;
    const grid = document.createElement('div'); grid.className = 'sf-split-editors';
    const div = document.createElement('div');
    div.className = 'sf-split-divider';
    div.setAttribute('role','separator'); div.setAttribute('tabindex','0');
    div.setAttribute('aria-label','Resize split');
    div.innerHTML = '<i class="bi bi-grip-vertical"></i>';
    grid.appendChild(makePane('left',  V.ids.left,  seedFor.left));
    grid.appendChild(div);
    grid.appendChild(makePane('right', V.ids.right, seedFor.right));
    host.classList.add('sf-split-canvas');
    while(host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(grid);
    V.open = true; V.modeKey = modeKey();
    document.body.classList.add('sf-writing-split');
    applyRatio(grid, V.ratio); wireDivider(grid, div);
    applyPaneStyles();
    activate(V.active, true);
    toolbarToPane(V.active);
    return true;
  }
  function open(){
    if(V.open) return true;
    const list = allSections();
    if(list.length < 2){ toast('Create at least two sections first','warn'); return false; }
    const cur = getSection(D().currentChapter) || list[0].ch;
    const other = list.find(x => x.ch.id !== cur.id);
    V.active = 'left'; V.ids = {left:cur.id, right:other.ch.id};
    V.ranges = {left:null,right:null}; V.modeKey = modeKey();
    if(!mount(document.getElementById('editor'))){ V.open = false; return false; }
    return true;
  }
  function close(){
    if(!V.open) return;
    saveBoth();
    const host = canvas(), act = editor(V.active);
    V.open = false;
    document.body.classList.remove('sf-writing-split','sf-split-resizing');
    if(host && act){
      act.removeAttribute('data-sf-split-editor');
      act.classList.remove('sf-split-editor');
      act.id = 'editor';
      while(host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(act);
      /* the surviving half keeps the type it was given */
      const st0 = styleStore()[V.active];
      act.style.fontFamily = st0.font ? "'" + st0.font + "', serif" : '';
      act.style.fontSize   = st0.size ? st0.size + 'px' : '';
      if(typeof renderChapterControls==='function') renderChapterControls();
      if(typeof updateCounts==='function') updateCounts();
    }
    V.ids = {left:null,right:null}; V.ranges = {left:null,right:null};
    save();
  }
  function afterRender(){
    if(!V.open) return;
    const host = canvas(); if(!host) return;
    if(V.modeKey !== modeKey()){ V.ids={left:null,right:null}; V.ranges={left:null,right:null}; V.modeKey = modeKey(); }
    if(host.querySelector('[data-sf-split-editor="left"]') &&
       host.querySelector('[data-sf-split-editor="right"]')) return;
    if(!mount(host.querySelector('#editor'))){
      V.open = false; document.body.classList.remove('sf-writing-split');
    }
  }
  document.addEventListener('selectionchange', () => {
    if(!V.open) return;
    const ed = editor(V.active);
    if(ed && document.activeElement === ed) remember(V.active);
  });
  window.ScriptForgeSplit = { open, close, toggle(){ return V.open ? close() : open(); },
                              afterRender, isOpen(){ return V.open; },
                              paneStyleChanged: paneStyleChanged,
                              applyPaneStyles: applyPaneStyles,
                              toolbarToPane: function(s){ toolbarToPane(s || V.active); } };
})();
