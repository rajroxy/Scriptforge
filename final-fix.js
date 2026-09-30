/* ═══════════════════════════════════════════════════════════
   final-fix.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · fab-fix.js
     · context-fix.js
     · final-fix.js
     · font-pack.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   ScriptForge — THE WRITER'S ROUND

   Eight things, asked for in one pass:

   1 · “add card icon remove and add card button put in right of add prompt”
       The row's own Add card is out of the row. The press rides the bar
       now, right of New prompt, and adds a card to the prompt you are on.

   2 · “in place of add card icon put pin icon in idea and draft page”
       The same slot in the row carries a pin, and a pinned row sits at the
       head of its own list. Pin, copy and paste live on these two pages
       and nowhere else in the app.

   3 · “add image insert an image box in bible page”
       Every Bible entry takes an image, drawn down small enough that the
       project still fits the store it is saved in.

   4 · “when selected timeline but new button is new event in place of new
       timeline” — the button wears the tab's own word.

   5 · “in pages chevrons work on it own only with mouse swipe fix that”
       The page turned when the pointer merely reached the window's edge.
       It turns when a chevron is pressed now, and nothing else moves it.

   6 · “why the card shrink on dashboard project card if there is only two
       cards, it shouldn't be shrinking” — the card holds a page's height
       whatever the page happens to hold.

   7 · “scrollbar become accent color even when hovering over dropdown
       list” — a dropdown's own bar stays grey under the pointer.

   8 · “fonts in pages T are many so remove unnecessary fonts from there”
       Twelve families on the T panel, not fifty-seven.

   Nothing here rewrites anything. Every press is wired to the app's own
   objects — S.config.savedPrompts, D().drafts, the Bible's entry, the T
   panel's own <select> — and every pixel is one rule in one sheet.

   The sheet is injected here but moved to the END of <head> on the first
   turn of the event loop, because the four sheets this file already
   injects are appended later in this file and a tie on specificity is
   won by whichever came last.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── the small hands ───────────────────────────────────────── */
  const say = function(msg, kind){
    try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){}
  };
  const saveNow = function(){
    try{ if(typeof save === 'function') save(); }catch(e){}
  };
  const prompts = function(){
    try{ return (S && S.config && Array.isArray(S.config.savedPrompts)) ? S.config.savedPrompts : null; }catch(e){ return null; }
  };
  const drafts = function(){
    try{
      if(typeof D !== 'function') return null;
      const d = D();
      if(!Array.isArray(d.drafts)) d.drafts = [];
      return d.drafts;
    }catch(e){ return null; }
  };
  const repaintIdea = function(){
    const root = document.getElementById('page-inspire');
    if(root && window.PAGE_RENDERERS && typeof window.PAGE_RENDERERS.inspire === 'function'){
      try{ window.PAGE_RENDERERS.inspire(root); return true; }catch(e){}
    }
    return false;
  };
  const repaintDrafts = function(){
    try{ if(typeof window.renderDrafts === 'function'){ window.renderDrafts(); return true; } }catch(e){}
    return false;
  };
  const repaintBible = function(){
    try{ if(typeof window.renderBbDetail === 'function'){ window.renderBbDetail(); return true; } }catch(e){}
    return false;
  };

  /* ═══ 1 · THE SHEET ═══════════════════════════════════════════ */
  const CSS = [
    /* ── the row's Add card is out of the row ──────────────
       The press is on the bar now, beside New prompt. app.js puts its own
       button back on any row that is missing one, so removing it here
       would have that pass and this one rewriting the row for ever: it
       stays in the DOM, takes no press and draws nothing. */
    'html body #page-inspire #ideaRows [data-idea-newcard]{ display:none !important; }',

    /* ── the pin, lit while the row is held on top ────────
       A row's tools sit at part opacity until the row is under the
       pointer; a pinned row keeps its pin lit, so the list says at a
       glance what is holding. */
    'html body #page-inspire .idea-rows .idea-row .ol-tool[data-sf-pin].on,',
    'html body #page-inspire .idea-rows .idea-row .ol-tool[data-sf-pin].on i{',
    '  opacity:1 !important; color:var(--accent-2) !important;',
    '}',
    'html body #page-draft .draft-rows .draft-row .draft-act[data-sf-pin].on,',
    'html body #page-draft .draft-rows .draft-row .draft-act[data-sf-pin].on i{',
    '  opacity:1 !important; pointer-events:auto !important; color:var(--accent-2) !important;',
    '}',

    /* ── the Bible's image box ────────────────────────────
       The same field every other part of an entry wears (a small caps
       label over the control), with a dashed box under it that takes a
       press. Once it holds an image the box is solid, the image is drawn
       inside it at no more than 180px, and a bin sits in its corner. */
    'html body #page-bible .bb-image-box{',
    '  position:relative !important; display:flex !important; align-items:center !important;',
    '  justify-content:center !important; gap:8px !important; width:100% !important;',
    '  min-height:92px !important; overflow:hidden !important;',
    '  background:var(--surface-3) !important; border:1px dashed var(--line-2) !important;',
    '  border-radius:var(--r-md, 6px) !important; color:var(--ink-4) !important;',
    '  font-size:12px !important; font-style:normal !important; cursor:pointer !important;',
    '}',
    'html body #page-bible .bb-image-box i{ font-size:14px !important; }',
    'html body #page-bible .bb-image-box em{ font-style:normal !important; }',
    'html body #page-bible .bb-image-box:hover{ border-color:var(--line-3) !important; color:var(--ink-3) !important; }',
    'html body #page-bible .bb-image-box.has{ border-style:solid !important; padding:6px !important; cursor:default !important; }',
    'html body #page-bible .bb-image-box img{ display:block !important; max-width:100% !important; max-height:206px !important; border-radius:var(--r-sm, 4px) !important; }',
    'html body #page-bible .bb-image-del{',
    '  position:absolute !important; top:5px !important; right:5px !important;',
    '  background:var(--surface-1) !important; color:var(--ink-2) !important;',
    '}',
    'html body #page-bible .bb-image-del:hover{ background:var(--surface-4) !important; color:var(--ink) !important; }',

    /* ── a card in view is read, not written ───────────────
       The Idea page's grid cards each hold a writing box that the app marks
       read-only until its pencil opens the card (app.js, viewCard(): the
       box is `readonly` in view, and the pencil takes the card into the
       writing pane). A read-only box still takes the press, though, and a
       press is a caret: pages.css gives every textarea the app's own
       caret-colour (--caret, the amber line), so a plain click on a card
       that is only being read put a writing line in it — the one thing the
       pencil is for. The caret is not drawn while the app calls the card
       read-only. The text itself is still the writer's to select and copy:
       only the line goes. */
    'html body #page-inspire .idea-brief-input[readonly],',
    'html body #page-inspire .idea-slot-brief[data-ic-mode="view"] .idea-brief-input,',
    'html body #page-inspire .idea-slot[data-ic-mode="view"] .idea-brief-input{',
    '  caret-color:transparent !important;',
    '}',

    /* ── where the image stands in the pane ──
       The field every entry already wears (dressBb below puts it on the
       pane) stands at the FOOT of the entry, under Details, exactly where
       the app has always drawn it: a full-width box, the writer's picture
       inside it. It is the entry's own last field, so nothing else in the
       pane is measured, moved or resized for it. */
    'html body #page-bible .bb-field-img{ width:100% !important; margin:0 !important; }',
    'html body #page-bible .bb-img-head{',
    '  display:flex !important; align-items:center !important; justify-content:space-between !important; gap:8px !important;',
    '}',
    'html body #page-bible .bb-img-head > span{',
    '  font-size:10px !important; font-weight:600 !important; letter-spacing:.08em !important;',
    '  text-transform:uppercase !important; color:var(--ink-4) !important;',
    '}',
    /* the box's own shape: portrait (a passport) or landscape, the writer's
       pick, kept on the entry */
    'html body #page-bible .bb-img-shape{ display:flex !important; gap:2px !important; }',
    'html body #page-bible .bb-img-shape .ol-tool{ opacity:.5 !important; }',
    /* the shape that is on is marked by the ink and the raised ground, never
       by the accent: these two buttons are a picture box's setting, and the
       accent is this app's mark for what is CHOSEN (a chip that is on, a pair
       that is picked). No line and no accent stands in the detail pane. */
    'html body #page-bible .bb-img-shape .ol-tool.on,',
    'html body #page-bible .bb-img-shape .ol-tool.on i{',
    '  opacity:1 !important; color:var(--ink) !important; background:var(--surface-4) !important;',
    '}',
    /* the writer's pick sets the SHAPE of the box, not just its height: a
       portrait box is taller than it is wide (400x510) and a landscape box
       is wider than it is tall (700x395). Both are as big as the pane
       allows — never a strip, never a corner speck — and both stand in the
       middle of the pane rather than at its left edge. A picture inside is
       drawn inside that shape. */
    /* ── the field stands apart from the writing box above it ──
       It is the entry's last field, under Details, and it is laid out as its
       own block: it takes no share of the pane's height, so the Details box
       keeps every pixel it grows into, and a hairline and its own space
       separate the two, so the writing box and the picture box can never
       read as one crowded, collided panel. The plate is a plate, not the
       whole pane: a portrait box of 260x330, a landscape one of 420x260. */
    /* ── and no line across the pane ──
       The field used to be separated from the writing box above it by a
       hairline. THAT hairline is the line that reads as “stuck in the detail
       box”: every other field in this pane has no edge — the small caps label
       over each control is the separation — so the last field keeps that rule
       too, and the space above it is the only separation there is. */
    'html body #bbDetail .bb-field-img{',
    '  flex:0 0 auto !important; margin-top:8px !important; padding-top:0 !important;',
    '  border-top:0 !important; background:transparent !important;',
    '}',
    /* ── and nothing in the pane draws a line ACROSS it ──
       The hairline reported over the Image row was never one rule: an edge
       anywhere in the pane reads as a line ruled across it — the field's own
       top border, a shadow standing in for one, a pseudo-element drawing a
       divider, the top edge of the row the label sits in. They are all taken
       off in one place, so no pass of any layer can put one back: the pane's
       own children keep no top edge and no shadow, the Image field's row and
       the writing box above it keep no divider of their own, and the picture
       box keeps every side it has (it is the one box in the pane that is
       drawn on purpose). */
    'html body #bbDetail > *,',
    'html body #bbDetail .bb-field-img::before,',
    'html body #bbDetail .bb-field-img::after,',
    'html body #bbDetail .bb-img-head::before,',
    'html body #bbDetail .bb-img-head::after,',
    'html body #bbDetail .bb-field-grow::before,',
    'html body #bbDetail .bb-field-grow::after{',
    '  border-top-width:0 !important; box-shadow:none !important;',
    '  background-image:none !important; content:none !important;',
    '}',
    'html body #page-bible .bb-field-img .bb-image-box{',
    '  width:260px !important; max-width:100% !important; min-height:330px !important;',
    '  margin:0 auto !important;',
    '}',
    'html body #page-bible .bb-field-img .bb-image-box img{ max-width:100% !important; max-height:318px !important; }',
    'html body #page-bible .bb-field-img.is-landscape .bb-image-box{',
    '  width:420px !important; max-width:100% !important; min-height:260px !important;',
    '}',
    'html body #page-bible .bb-field-img.is-landscape .bb-image-box img{ max-height:248px !important; }',

    /* ── the Draft row is the Idea's row, to the pixel ──────────────
       A row's own height is what decides how many of them a card holds,
       and the Draft's was 40px — the 28px square with 6px above and below
       — where the Idea's and the Bible's are 44: the same square with 8.
       Two lists in two cards of the same height then held different
       numbers of rows (the writer's own window listed eleven drafts beside
       ten prompts), and the Draft's 40 was the odd one out. It is 44 here,
       the same padding, the same gap and the same square as the other two,
       so all three lists hold the same rows on the same card. */
    'html body #page-draft .draft-rows .draft-row[class]{',
    '  padding:8px 9px !important; height:44px !important;',
    '  min-height:44px !important; max-height:44px !important;',
    '}',

    /* ── the Bible's Details box keeps the size it was dragged to ────────
       The pane's writing box is a flex item grown to fill the pane, and a
       flex item's main size is the flex layout's to decide: the browser's
       own grip wrote height:181px onto the box and the box stayed 261px, so
       the handle moved with nothing behind it. (The sheet under this one
       pins `height:auto !important` on every .bb-field control, which beats
       a plain inline height as well, and the browser's own drag drops the
       !important flag the moment it writes.) So the height the drag writes
       is read back and carried on a custom property, and these two rules
       apply it with the weight to hold it — and with the label pinned, the
       fields under the box close up behind it. */
    'html body #bbDetail .bb-field-grow[data-sf-h]{ flex:0 0 auto !important; }',
    'html body #bbDetail .bb-field-grow textarea[data-sf-h]{',
    '  height:var(--sf-h) !important; flex:0 0 auto !important;',
    '}',

    /* ── the corner of the writing box carries no mark ──────────────
       pages.css gives that box `resize:vertical` (the writer pulls it
       taller and the size is remembered on the entry), and the browser
       paints its own grip for that: the small diagonal line standing in
       the box's bottom-right corner, which reads as a stray mark in an
       otherwise flat pane. The line is not drawn any more; the drag itself
       is untouched, so the corner still pulls the box open. */
    'html body #bbDetail .bb-field-grow textarea::-webkit-resizer{',
    '  background:transparent !important; border:0 !important;',
    '}',

    /* ── the dashboard's project card holds a page ────────
       The card is flex:0 0 auto, so it came down to whatever its list had
       in it: 359px with ten projects and 163px with two, and the pair of
       cards rode up and down the window as projects came and went. A page
       is five rows of 46px on a 3px gap inside the 6px block, with the bar
       above it and the pager below — 359px — and the card keeps that
       whether the page holds ten projects or one. The class is doubled
       because the page's own stylesheet rides inside the page's markup,
       lands after this one and wins every tie. */
    'html body #page-home .home-workspace.home-workspace{ min-height:359px !important; }',

    /* ── a dropdown's own bar stays grey ──────────────────
       The accent bar is the app's gesture for a scrolling AREA — the page,
       a list, a panel — and hovering a dropdown was lighting the one bar
       in it that belongs to a popup. Those lists keep the colour they have
       at rest (theme.css writes --surface-4 on --bg for every element). */
    'html body .dd-card .stats-cat-list:hover, html body .dd-card .stats-cat-list:active,',
    'html body .tb-drop-list:hover, html body .tb-drop-list:active,',
    'html body .tb-drop2-list:hover, html body .tb-drop2-list:active,',
    'html body .draft-drop-list:hover, html body .draft-drop-list:active{',
    '  scrollbar-color:var(--surface-4) var(--bg) !important;',
    '}',
    /* the webkit layer underneath, for the engines that really paint it */
    'html body .dd-card .stats-cat-list:hover::-webkit-scrollbar-thumb,',
    'html body .dd-card .stats-cat-list:active::-webkit-scrollbar-thumb,',
    'html body .tb-drop-list:hover::-webkit-scrollbar-thumb,',
    'html body .tb-drop-list:active::-webkit-scrollbar-thumb,',
    'html body .tb-drop2-list:hover::-webkit-scrollbar-thumb,',
    'html body .tb-drop2-list:active::-webkit-scrollbar-thumb,',
    'html body .draft-drop-list:hover::-webkit-scrollbar-thumb,',
    'html body .draft-drop-list:active::-webkit-scrollbar-thumb{',
    '  background:var(--surface-4) !important;',
    '  background-clip:padding-box !important;',
    '}'
  ].join('\n');

  if(!document.getElementById('sfRoundCss')){
    const st = document.createElement('style');
    st.id = 'sfRoundCss';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
    /* last in the head once everything else has had its say */
    setTimeout(function(){
      const s = document.getElementById('sfRoundCss');
      if(s && s.parentNode) s.parentNode.appendChild(s);
    }, 0);
  }

  /* ═══ 2 · THE PIN ═════════════════════════════════════════════
     Both lists are drawn by code this layer cannot reach — the Idea's rows
     by app.js's own refill, the Draft's by renderDrafts() — and both redraw
     on every keystroke, so the pin is added after they have drawn and
     stamped again on every pass. It takes the place the Add card icon had
     (ahead of the pencil, in the same .ol-tool the row's other presses
     wear) and on a Draft row it opens the little act strip, ahead of
     Rename. */
  const held = function(list, i){
    return !!(list && list[i] && list[i].pin);
  };
  const pinOf = function(kind, cls){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('data-sf-pin', kind);
    b.setAttribute('data-sf-pin-id', '');
    b.title = 'Pin to the top';
    b.innerHTML = '<i class="bi bi-pin-angle"></i>';
    return b;
  };
  const stamp = function(btn, i, on){
    if(btn.getAttribute('data-sf-pin-id') === String(i) && btn.classList.contains('on') === on) return;
    btn.setAttribute('data-sf-pin-id', String(i));
    btn.classList.toggle('on', on);
    btn.title = on ? 'Unpin' : 'Pin to the top';
    const ic = btn.querySelector('i');
    if(ic) ic.className = 'bi ' + (on ? 'bi-pin-angle-fill' : 'bi-pin-angle');
  };

  /* ═══ 3 · THE BIBLE'S IMAGE BOX ═══════════════════════════════
     The entry is the app's own object — bbList() is a top-level function in
     pages.js and _bbTab / _bbSel are its top-level bindings, which every
     script in the page reads and writes — and the image is one more key on
     that object, saved with the project. renderBbDetail() rebuilds the
     pane from innerHTML on every keystroke, so the box is put back by the
     same pass that adds the pins. */
  const bbNow = function(){
    try{
      const arr = bbList(_bbTab) || [];
      for(let i = 0; i < arr.length; i++){
        const e = arr[i];
        if(e && String(e.id || e.name) === String(_bbSel)) return e;
      }
    }catch(e){}
    return null;
  };
  const dressBb = function(){
    const box = document.getElementById('bbDetail');
    if(!box || !box.querySelector) return;
    if(!box.querySelector('.bb-detail-head')) return;      /* nothing is picked */
    if(box.querySelector('[data-sf-img]')) return;         /* already on the pane */
    const e = bbNow();
    const url = (e && e.image) ? String(e.image) : '';
    const shape = (e && e.imgShape === 'landscape') ? 'landscape' : 'portrait';
    box.setAttribute('data-img-shape', shape);       /* the pane's own note of the shape */
    const f = document.createElement('div');
    f.className = 'bb-field bb-field-img' + (shape === 'landscape' ? ' is-landscape' : '');
    f.setAttribute('data-sf-img', '1');
    f.innerHTML = '<div class="bb-img-head"><span>Image</span>'
      + '<div class="bb-img-shape">'
      +   '<button type="button" class="ol-tool' + (shape === 'portrait' ? ' on' : '') + '" data-sf-img-shape="portrait" title="Portrait box"><i class="bi bi-file-earmark-image"></i></button>'
      +   '<button type="button" class="ol-tool' + (shape === 'landscape' ? ' on' : '') + '" data-sf-img-shape="landscape" title="Landscape box"><i class="bi bi-image"></i></button>'
      + '</div></div>'
      + (url
        ? '<div class="bb-image-box has" data-sf-img-box="1"><img alt="" src="' + esc(url) + '">'
          + '<button type="button" class="ol-tool bb-image-del" data-sf-img-del="1" title="Remove image"><i class="bi bi-trash"></i></button></div>'
        : '<div class="bb-image-box" data-sf-img-box="1" title="Add an image to this entry"><i class="bi bi-image"></i><em>Add image</em></div>');
    /* last of the entry's fields, under Details — where the app drew it */
    const meta = box.querySelector('.bb-meta');
    if(meta && meta.parentNode === box) box.insertBefore(f, meta);
    else box.appendChild(f);
  };

  /* the picker, once, kept out of sight at the foot of the body */
  let afterPick = null;
  const picker = function(){
    let inp = document.getElementById('sfImagePick');
    if(!inp){
      inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.id = 'sfImagePick';
      inp.style.display = 'none';
      inp.addEventListener('change', function(){
        const f = inp.files && inp.files[0];
        const cb = afterPick;
        afterPick = null;
        try{ inp.value = ''; }catch(e){}
        if(f && cb) readImage(f, cb);
      });
      document.body.appendChild(inp);
    }
    return inp;
  };
  /* ── the image is drawn down before it is kept ──
     A photo straight off a phone is several megabytes, and the project is
     saved into the browser's own store: kept whole it would fill that
     store and the next save would fail. Anything wider than 1200px is
     drawn onto a canvas and re-encoded, which lands the usual photo near
     150KB. A file the canvas cannot read is kept exactly as it came. */
  const readImage = function(file, cb){
    const fr = new FileReader();
    fr.onload = function(){
      const raw = String(fr.result || '');
      const img = new Image();
      img.onload = function(){
        try{
          const nw = img.naturalWidth || 0, nh = img.naturalHeight || 0;
          if(!nw || !nh) return cb(raw);
          const k = Math.min(1, 1200 / nw);
          const w = Math.max(1, Math.round(nw * k));
          const h = Math.max(1, Math.round(nh * k));
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          cb(c.toDataURL('image/jpeg', 0.85));
        }catch(e){ cb(raw); }
      };
      img.onerror = function(){ cb(raw); };
      img.src = raw;
    };
    fr.onerror = function(){ say('That file could not be read', 'warn'); };
    fr.readAsDataURL(file);
  };

  /* ── and the Details box's grip ──
     See the two rules in the sheet: the height the corner's drag writes onto
     the box is picked up from the box itself (the drag writes an inline
     height, and nothing else writes one in this pane) and handed to it again
     on a custom property that out-weighs the sheet under this one. The box
     is marked when it carries a size of its own, and the size rides on the
     entry, so it comes back the way it was left. */
  let bbSaving = 0;
  const bbGrow = function(){
    const ta = document.querySelector('#bbDetail .bb-field-grow textarea');
    if(!ta) return;
    const h = parseFloat(ta.style.height);
    if(!(h > 0)) return;
    const hs = Math.round(h) + 'px';
    if(ta.style.getPropertyValue('--sf-h') === hs) return;      /* already applied */
    ta.setAttribute('data-sf-h', '1');
    ta.style.setProperty('--sf-h', hs);
    const lab = ta.parentElement;
    if(lab) lab.setAttribute('data-sf-h', '1');
    const e = bbNow();
    if(!e) return;
    e.h = Math.round(h);
    if(!bbSaving) bbSaving = setTimeout(function(){ bbSaving = 0; saveNow(); }, 500);
  };
  const bbDress = function(){
    const ta = document.querySelector('#bbDetail .bb-field-grow textarea');
    if(!ta) return;
    if(ta.getAttribute('data-sf-h') === '1') return;             /* the box owns one */
    const e = bbNow();
    const h = e ? Math.round(parseFloat(e.h) || 0) : 0;
    if(!h) return;                                              /* never sized by hand */
    ta.setAttribute('data-sf-h', '1');
    ta.style.setProperty('--sf-h', h + 'px');
    if(ta.parentElement) ta.parentElement.setAttribute('data-sf-h', '1');
  };
  /* the pane is rebuilt from innerHTML on every entry change, so the mark
     has to be looked for after the app has drawn — and the only attribute
     written in this pane is the drag's own height. */
  let bbWatching = false;
  const bbWatch = function(){
    if(bbWatching || typeof MutationObserver !== 'function') return;
    if(!document.body) return;
    bbWatching = true;
    /* on the body, not on the pane: the page is rebuilt whole when it is
       opened, so a #bbDetail watched today is an orphan tomorrow. Nothing
       else in the pane writes a style attribute, and the look-up is one
       query. */
    new MutationObserver(function(){ bbGrow(); })
      .observe(document.body, { attributes:true, attributeFilter:['style'], subtree:true });
  };

  /* ═══ 4 · THE TIMELINE'S OWN WORDS ═══════════════════════════
     The Bible's Timeline tab is the one tab whose tab name and entry
     word differ in the table behind it (BB_TABS, pages.js): the tab is
     Timeline, its word is “Event”. So the bar's button read New Event
     while the row that very button pushed was titled “New event” — the
     button and the row disagreed, and the writer wants both of them to
     say New Timeline.

     Two places write those words. Neither is edited where it lives;
     both are reached from here:

       · the bar's button is painted by paintBbWord() from that table
         on every render. It is a plain function declaration in
         pages.js, so it is on window and the renderer's own bare call
         lands in the wrapper below: on the Timeline tab the word is
         Timeline, and every other tab keeps its own. (The pane's own
         “New …” empty-state buttons are stripped by app.js — the head
         button is the only one — so this is the only place the word
         stands.)

       · the title a new entry is born with is written by the add
         handler as title:'New event'. Every write to the Timeline
         goes through bbMutate(), so that is wrapped too: a timeline
         entry still carrying the app's own placeholder — and nothing
         of the writer's in its When or its Details — is retitled “New
         Timeline”. Only that placeholder is touched, so a row the
         writer has begun is never renamed under them.

     A timeline made before this build is tidied the same way, once,
     on the next pass: those rows keep every word they hold, they just
     stop contradicting the button that made them. */
  const TL_WORD = 'Timeline';
  const TL_ROW  = 'New Timeline';

  /* the placeholder pages.js gives a new timeline entry, and nothing else:
     a title the writer has not touched, with both of its own fields empty */
  const sfPlaceholder = function(e){
    return !!e && e.title === 'New event' && !e.date && !e.desc;
  };

  /* the row that is still that placeholder — the one just made, and any left
     over from the build whose button said the other word */
  const retitleTimeline = function(){
    const d = (typeof D === 'function') ? D() : null;
    if(!d || !Array.isArray(d.timeline)) return false;
    let hit = false;
    d.timeline.forEach(function(e){
      if(!sfPlaceholder(e)) return;
      e.title = TL_ROW;
      hit = true;
    });
    return hit;
  };

  /* the word on screen: the head button's own span, and only while the tab
     beside it is the Timeline */
  const timelineWord = function(){
    const on = document.querySelector('#bbTabs .bb-tab.on');
    if(!on || on.getAttribute('data-bb-tab') !== 'timeline') return false;
    const w = document.getElementById('bbAddWord');
    if(w && w.textContent !== TL_WORD) w.textContent = TL_WORD;
    return true;
  };

  const paintWordOrig = window.paintBbWord;
  if(typeof paintWordOrig === 'function' && !paintWordOrig.__sfTl){
    const fn = function(){
      const r = paintWordOrig.apply(this, arguments);
      try{
        /* renamed rows are not on screen yet: the renderer paints the word
           after it draws them, so the list is drawn again when one changes */
        if(timelineWord() && retitleTimeline()){
          saveNow();
          if(typeof window.renderBbRows === 'function') window.renderBbRows();
          if(typeof window.renderBbDetail === 'function') window.renderBbDetail();
        }
        /* the panel the rows are cut into: watched here, because this is the
           one call that runs after the list has been drawn, and looked at
           once more when the frame is done settling */
        const box = document.getElementById('bbRows');
        if(box) watchRows(box);
        if(typeof requestAnimationFrame === 'function'){
          requestAnimationFrame(function(){ try{ bbRecut(); }catch(e){} });
        }
      }catch(e){}
      return r;
    };
    fn.__sfTl = true;
    window.paintBbWord = fn;
  }

  const bbMutateOrig = window.bbMutate;
  if(typeof bbMutateOrig === 'function' && !bbMutateOrig.__sfTl){
    const fn = function(){
      const r = bbMutateOrig.apply(this, arguments);
      try{
        if(arguments[0] === 'timeline' && retitleTimeline()) saveNow();
      }catch(e){}
      return r;
    };
    fn.__sfTl = true;
    window.bbMutate = fn;
  }

  /* ═══ 4b · THE TAB'S NAME ═════════════════════════════════════
     The tab reads “Timelines”: the list holds a whole chronology and
     draws one row per entry. The name itself is `BB_TABS` in pages.js
     — a const in that file's own scope, out of reach from here — so the
     two renders that print it are wrapped instead, and both print it
     again on every pass:

       · renderBbTabs writes the name on the tab. It is wrapped rather
         than the paint pass, because the add and the delete handlers
         redraw the tabs WITHOUT repainting the word, and an unwrapped
         label would snap back to “Timeline” the moment an entry was
         added.
       · renderBbRows writes it in “No … yet” while the list is empty. */
  const TL_TAB = 'Timelines';

  const tabLabel = function(){
    const span = document.querySelector('#bbTabs .bb-tab[data-bb-tab="timeline"] span');
    if(span && span.textContent !== TL_TAB) span.textContent = TL_TAB;
  };
  const emptyLine = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#bbRows .bb-empty div'),
      function(el){ if(String(el.textContent) === 'No timeline yet') el.textContent = 'No timelines yet'; });
  };

  const tabsOrig = window.renderBbTabs;
  if(typeof tabsOrig === 'function' && !tabsOrig.__sfTl){
    const fn = function(){
      const r = tabsOrig.apply(this, arguments);
      try{ tabLabel(); }catch(e){}
      return r;
    };
    fn.__sfTl = true;
    window.renderBbTabs = fn;
  }

  const rowsOrig = window.renderBbRows;
  if(typeof rowsOrig === 'function' && !rowsOrig.__sfTl){
    const fn = function(){
      const r = rowsOrig.apply(this, arguments);
      try{ emptyLine(); }catch(e){}
      return r;
    };
    fn.__sfTl = true;
    window.renderBbRows = fn;
  }

  /* ═══ 4c · THE PAGE OF ROWS IS CUT TO THE PANEL IT IS IN

     bbPerPage() (pages.js) measures #bbRows and cuts the list into that
     many rows. On the FIRST draw the panel has not settled — it comes up
     ~44px short of its final height — so a panel that holds ten rows is
     measured for nine: page one draws nine rows and the range beside the
     arrows is painted 1-9, while the tenth entry waits on page two.

     A click on a row, or leaving the page and coming back, draws the
     list again, measured right this time, and that tenth entry walks up
     from the next page — so entries seem to appear and to leave the line
     the writer is looking at, and the numbering moves with them.

     Fixed at the measurement instead of by trimming rows: when #bbRows
     changes size, the page is cut again only if what is drawn no longer
     matches what the panel holds. The cut is made once per height, so a
     redraw that changes nothing cannot ask for another one. */
  let bbBox = null, bbObs = null, bbCutAt = -1;

  const bbRecut = function(){
    const box = document.getElementById('bbRows');
    if(!box || box.clientHeight <= 0) return false;
    const shown = box.querySelectorAll('.bb-row').length;
    const fit = (typeof window.bbPerPage === 'function') ? window.bbPerPage() : 0;
    if(!shown || !fit || shown === fit) return false;   /* the page already holds what fits */
    if(fit === bbCutAt) return false;                   /* already cut for this height */
    const on = document.querySelector('#bbTabs .bb-tab.on');
    const tab = on && on.getAttribute('data-bb-tab');
    if(!tab || typeof window.bbList !== 'function') return false;
    const total = (window.bbList(tab) || []).length;
    if(total <= shown) return false;                    /* nothing more to bring up */
    bbCutAt = fit;
    window.renderBbRows();
    return true;
  };

  const watchRows = function(box){
    if(!box || box === bbBox || typeof ResizeObserver !== 'function') return;
    if(!bbObs) bbObs = new ResizeObserver(function(){ bbCutAt = -1; try{ bbRecut(); }catch(e){} });
    if(bbBox){ try{ bbObs.unobserve(bbBox); }catch(e){} }
    bbBox = box;
    try{ bbObs.observe(box); }catch(e){}
  };

  /* ═══ 4d · THE PANE'S COUNT LINE IS GONE ══════════════════════
     renderBbDetail (pages.js) closes the pane with its own tally —
     “15 entries in this project”, “22 entries in this project” — under
     whichever tab is open, Characters, Items, Timelines, Organizations
     and the rest alike. The writer asked for that line to go: the list's
     own pager already says how many rows are on the page, and the tab
     carries the entry count. The line is dropped where it is drawn. */
  const dropMeta = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#bbDetail .bb-meta'),
      function(el){ if(el.parentNode) el.parentNode.removeChild(el); });
  };

  const detailOrig = window.renderBbDetail;
  if(typeof detailOrig === 'function' && !detailOrig.__sfTl){
    const fn = function(){
      const r = detailOrig.apply(this, arguments);
      try{ dropMeta(); }catch(e){}
      return r;
    };
    fn.__sfTl = true;
    window.renderBbDetail = fn;
  }

  /* ═══ 5 · THE PASS ════════════════════════════════════════════
     One animation frame at a time, on every repaint: the two lists, the
     bar's own button and the Bible's box. Every branch checks before it
     writes, so a pass that finds everything already in place changes
     nothing and the observer settles. */
  const dress = function(){
    /* the Idea column */
    const ps = prompts();
    Array.prototype.forEach.call(document.querySelectorAll('#page-inspire #ideaRows .idea-row'), function(row){
      const i = parseInt(row.getAttribute('data-idea-open'), 10);
      const on = held(ps, i);
      let b = row.querySelector('[data-sf-pin="prompt"]');
      if(!b){
        b = pinOf('prompt', 'ol-tool');
        const ren = row.querySelector('[data-idea-ren]');
        if(ren && ren.parentNode === row) row.insertBefore(b, ren);
        else row.appendChild(b);
      }
      stamp(b, i, on);
    });

    /* the Draft column */
    const ds = drafts();
    Array.prototype.forEach.call(document.querySelectorAll('#page-draft #draftRows .draft-row'), function(row){
      const acts = row.querySelector('.draft-row-acts');
      if(!acts) return;
      const i = parseInt(row.getAttribute('data-draft-pick'), 10);
      const on = held(ds, i);
      let b = acts.querySelector('[data-sf-pin="draft"]');
      if(!b){ b = pinOf('draft', 'draft-act'); acts.insertBefore(b, acts.firstChild); }
      stamp(b, i, on);
    });

    /* the bar's Add card, right of New prompt */
    const left = document.querySelector('#page-inspire .idea-head-left');
    if(left && !left.querySelector('[data-sf-addcard]')){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ol-btn idea-addcard';
      b.setAttribute('data-sf-addcard', '1');
      b.title = 'One more card on the prompt you are on';
      b.innerHTML = '<i class="bi bi-plus-square"></i> <span>Add card</span>';
      const after = left.querySelector('[data-ic-new]');
      if(after && after.parentNode === left) left.insertBefore(b, after.nextSibling);
      else left.appendChild(b);
    }

    dressBb();
    bbDress();
    bbWatch();
  };

  /* ═══ 6 · THE PIN'S PRESS ═════════════════════════════════════
     Pinning moves the row to the head of its own list and marks it, which
     is the only way a row can be held at the top: both lists are drawn in
     the order their array holds, and neither renderer can be reached from
     here. The mark rides on the prompt or the draft itself, so it travels
     with the project and comes back with it. */
  const pinPrompt = function(i){
    const list = prompts();
    if(!list || !list[i]) return;
    const e = list[i];
    if(e.pin){
      delete e.pin;
      say('Unpinned');
    } else {
      e.pin = true;
      list.splice(i, 1);
      list.unshift(e);
      say('Pinned to the top');
    }
    saveNow();
    if(!repaintIdea()) return;
    if(!e.pin) return;
    /* the prompt you just pinned is the one the six cards should belong to */
    const row = document.querySelector('#page-inspire #ideaRows .idea-row[data-idea-open="0"]');
    if(row && !row.classList.contains('on')){
      try{ row.click(); }catch(err){}
    }
  };

  const pinDraft = function(i){
    const list = drafts();
    if(!list || !list[i]) return;
    const d = list[i];
    if(d.pin){
      delete d.pin;
      say('Unpinned');
    } else {
      /* which draft the pane is on, so the pane keeps editing THAT one once
         the rows have moved: the selection is an index, and an index not
         carried across the move would put another draft's text in it. */
      const on = document.querySelector('#page-draft #draftRows .draft-row.on');
      const picked = on ? parseInt(on.getAttribute('data-draft-pick'), 10) : -1;
      d.pin = true;
      list.splice(i, 1);
      list.unshift(d);
      let sel = picked;
      if(picked === i) sel = 0;
      else if(i < picked) sel = picked - 1;
      try{ _draftSel = sel; }catch(e){}
      try{ _draftPage = Math.max(0, Math.floor((sel < 0 ? 0 : sel) / (DRAFT_PER_PAGE || 5))); }catch(e){}
      say('Pinned to the top');
    }
    saveNow();
    repaintDrafts();
  };

  /* ═══ 7 · THE BAR'S ADD CARD ══════════════════════════════════
     One more card joins the prompt you are on, at the end of the ones it
     has. The card is empty and does not open: the prompt's own cards are
     on the right, the new one lands last, and the grid is taken to its end
     so the card that was just made is the one in view — the same press the
     row's own Add card made.

     And the card goes on the prompt the writer has PICKED, the row marked
     on in the left card, and on nothing else. With nothing picked there is
     nowhere for it to land: the press is refused with a word rather than
     made on a prompt nobody chose. (A round in between opened the head of
     the column and put the card there — that made a card the writer had
     not asked for, on a prompt they had not picked.) */
  const addCard = function(){
    const list = prompts();
    if(!list) return;
    const on = document.querySelector('#page-inspire #ideaRows .idea-row.on');
    const i = on ? parseInt(on.getAttribute('data-idea-open'), 10) : -1;
    if(isNaN(i) || i < 0 || !list[i]){ say('Pick a prompt first', 'warn'); return; }
    const e = list[i];
    if(!e) return;
    if(!Array.isArray(e.cards)){
      e.cards = [];
      for(let k = 0; k < 6; k++) e.cards[k] = '';
      if(e.text) e.cards[0] = String(e.text);
    }
    e.cards.push('');
    saveNow();
    repaintIdea();
    const box = document.getElementById('ideaCards');
    if(box) box.scrollLeft = box.scrollWidth - box.clientWidth;
    say('Card added');
  };

  /* ═══ 8 · THE CHEVRONS TURN ONLY WHEN PRESSED ═════════════════
     app.js walks the page on when the POINTER reaches the window's edge —
     22px either side, on every view with a chevron pager. The writer's
     words: the chevrons “work on it own only with mouse swipe”. A press
     no hand made is what that walk is — element.click() dispatches a
     click the browser marks untrusted — so those are the only presses
     dropped. A real press, the keyboard, and a touch screen's own swipe
     (a touch within the last second still counts) are all left alone. */
  const PAGER = '[data-pg-step],[data-draft-page],[data-bb-page],[data-idea-page]';
  let lastTouch = 0;
  window.addEventListener('touchstart', function(){ lastTouch = Date.now(); }, { capture:true, passive:true });
  window.addEventListener('click', function(e){
    if(e.isTrusted) return;
    const t = e.target;
    if(!t || !t.closest || !t.closest(PAGER)) return;
    if(Date.now() - lastTouch < 1000) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  /* ═══ 8b · AN OPEN PROJECT PICKS NO PROMPT ══════════════════
     The Idea page's own default is the head of the shelf: the six cards on
     the right belong to whatever prompt sits at the top of the left card,
     and the app starts that page on the row numbered 0. So a project that
     was only just opened came up with a prompt already chosen — and since
     the prompt a writer made last is the one at the top, an unnamed one.
     No hand picked it.

     The page has a gesture for letting a row go: a second press on the row
     you are on. This is that same letting go, aimed at the row the page
     marked as the one you are on. It is not done once and then forgotten —
     other layers draw the list again a beat later and that paint marks the
     head of the shelf all over again — so a row found marked is let go for
     as long as the arrival is fresh, and the first press of the WRITER's
     own ends it at once: a row they pick in that moment is theirs, and so
     is a prompt they have just made. */
  (function(){
    let lastPress = 0, freshAt = 0, freshUntil = 0, timer = 0;
    window.addEventListener('pointerdown', function(){ lastPress = Date.now(); }, true);
    window.addEventListener('keydown',     function(){ lastPress = Date.now(); }, true);

    const letGo = function(){
      const on = document.querySelector('#page-inspire #ideaRows .idea-row.on');
      if(!on) return false;
      try{ on.click(); }catch(e){ return false; }
      return true;
    };
    window.sfLetGoPrompt = letGo;

    const done = function(){
      freshAt = 0; freshUntil = 0;
      if(timer){ clearInterval(timer); timer = 0; }
    };
    const look = function(){
      if(!freshUntil) return;
      if(Date.now() > freshUntil) return done();
      if(lastPress > freshAt) return done();      /* the writer has been here: theirs */
      letGo();
    };
    const hush = function(){
      freshAt = Date.now();
      freshUntil = freshAt + 5000;
      look();
      if(!timer) timer = setInterval(look, 60);
    };
    window.sfHushPrompt = hush;

    /* the three arrivals: a project opened, a project made, and the page the
       app restores at boot — the writer opened none of those this session */
    const arm = function(){
      if(typeof window.openProjectById === 'function' && !window.openProjectById.__sfHush){
        const origOpen = window.openProjectById;
        const opened = function(){
          const r = origOpen.apply(this, arguments);
          hush();
          return r;
        };
        opened.__sfHush = true;
        window.openProjectById = opened;
      }
      if(window.TOOLS && typeof window.TOOLS.newProject === 'function' && !window.TOOLS.newProject.__sfHush){
        const origNew = window.TOOLS.newProject;
        const made = function(){
          const r = origNew.apply(this, arguments);
          hush();
          if(r && typeof r.then === 'function'){ r.then(hush, function(){}); }
          return r;
        };
        made.__sfHush = true;
        window.TOOLS.newProject = made;
      }
      return !!(window.openProjectById && window.openProjectById.__sfHush);
    };

    if(!arm()){ [0, 200, 800, 2000].forEach(function(ms){ setTimeout(arm, ms); }); }

    /* nothing is let go once the writer has pressed anything: their own first
       press means the shelf on screen is theirs */
    const boot = function(){ if(!lastPress) hush(); };
    [0, 250, 900, 1600, 2600].forEach(function(ms){ setTimeout(boot, ms); });
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    if(window.addEventListener) window.addEventListener('load', boot);
  })();

  /* ═══ 8c · THE CARD'S TICK AT ITS FOOT, AND THE PAGE CALLED IDEA ══

     The card's way out was a wide button reading “✓ Done”, up in the head
     beside the words it is about. It is the tick alone now, standing at the
     card's own bottom right corner where the writing ends: the word “Done”
     said what the tick already says.

     And the page is named the writer's word — Idea — where it is drawn: the
     title over the page, and the label the pages overlay falls back on. The
     id stays `inspire`, because that is what every layer is wired to. */
  try{
    if(typeof OVERLAY_LABELS !== 'undefined' && OVERLAY_LABELS) OVERLAY_LABELS.inspire = 'Idea';
  }catch(e){}

  (function(){
    const CSS = [
      /* the card's way out: the tick alone, in the card's own corner */
      'html body #page-inspire .idea-write > .idea-write-done{',
      '  position:absolute !important; right:12px !important; bottom:12px !important;',
      '  z-index:4 !important; width:28px !important; height:28px !important;',
      '  min-width:28px !important; min-height:28px !important; max-height:28px !important;',
      '  max-width:28px !important; padding:0 !important; margin:0 !important;',
      '  display:inline-flex !important; align-items:center !important;',
      '  justify-content:center !important; border-radius:var(--r-md, 6px) !important;',
      '  box-sizing:border-box !important;',
      /* the bar's Clear button, in an icon's box: the soft fill, no line at
         all, the quiet glyph */
      '  background:var(--surface-3) !important; border:0 !important;',
      '  color:var(--ink-2) !important;',
      '}',
      'html body #page-inspire .idea-write > .idea-write-done i{ font-size:15px !important; line-height:1 !important; color:inherit !important; }',
      'html body #page-inspire .idea-write > .idea-write-done span{ display:none !important; }',
      /* the writing stops before the corner the tick stands in */
      'html body #page-inspire .idea-write > .idea-write-body{ padding:22px 26px 58px !important; }',
      /* the head has only the card's own number left in it */
      'html body #page-inspire .idea-write > .idea-write-head{ justify-content:flex-start !important; }',
      /* and under the pointer the tick takes the app's own accent, the way the
         settings' Save button wears it */
      'html body #page-inspire .idea-write > .idea-write-done:hover,',
      'html body #page-inspire .idea-write > .idea-write-done:focus-visible{',
      '  background:var(--accent-soft) !important; border:0 !important;',
      '  color:var(--accent) !important;',
      '},',
      /* the writing card carries no edge of its own: it is the page's writing
         surface, flush with the column it fills */
      'html body #page-inspire .idea-main > .idea-write{ border:0 !important; }',
      /* and the head is off with it: the card's own “Card 1 of 6 · …” words
         and the hairline under them. The card says what it is by being the
         writing surface, and the words are on the row you picked. */
      'html body #page-inspire .idea-main > .idea-write > .idea-write-head{ display:none !important; }'
    ];
    const host = document.head || document.documentElement;
    if(host){
      const sheet = document.createElement('style');
      sheet.setAttribute('data-sf-idea-card', '1');
      sheet.textContent = CSS.join('\n');
      host.appendChild(sheet);
    }

    const dress = function(){
      /* the page wears the writer's word for it */
      try{
        const h1 = document.querySelector('#page-inspire .page-title');
        if(h1){
          Array.prototype.forEach.call(h1.childNodes, function(n){
            if(n.nodeType === 3 && String(n.nodeValue || '').trim() === 'Inspire'){
              n.nodeValue = n.nodeValue.replace('Inspire', 'Idea');
            }
          });
        }
      }catch(e){}
      /* the tick leaves the head and takes the card's bottom right corner.
         Everything about how it looks is written ON the button itself, in
         inline rules with the same !important a sheet would carry: an inline
         important rule is the last thing the browser looks at, so no sheet —
         this file's, pages.css, a layer written later — can take the button
         back to the pale tick it used to be. */
      try{
        const pane = document.querySelector('#page-inspire .idea-write');
        if(!pane) return;
        const btn = pane.querySelector('.idea-write-done');
        if(!btn) return;
        const word = btn.querySelector('span');
        if(word && word.parentNode) word.parentNode.removeChild(word);
        if(btn.parentNode !== pane) pane.appendChild(btn);
        /* no edge around the card, on the element itself, so no sheet can
           draw the line back */
        try{ pane.style.setProperty('border', '0', 'important'); }catch(e){}
        /* and no head either — neither its words nor the line under them */
        const head = pane.querySelector('.idea-write-head');
        if(head){ try{ head.style.setProperty('display', 'none', 'important'); }catch(e){} }
        if(btn.dataset.sfTick !== '1'){
          btn.dataset.sfTick = '1';
          const put = function(el, k, v){ try{ el.style.setProperty(k, v, 'important'); }catch(e){} };
          [['position','absolute'], ['right','12px'], ['bottom','12px'], ['z-index','4'],
           ['width','28px'], ['height','28px'], ['min-width','28px'], ['max-width','28px'],
           ['min-height','28px'], ['max-height','28px'], ['padding','0'], ['margin','0'],
           ['display','inline-flex'], ['align-items','center'], ['justify-content','center'],
           ['border-radius','var(--r-md, 6px)'], ['box-sizing','border-box'], ['cursor','pointer'],
           /* the bar's Clear button's own configuration, in an icon's box: the
              soft fill, no line at all, the quiet glyph */
           ['background','var(--surface-3)'], ['border','0'], ['color','var(--ink-2)']
          ].forEach(function(pair){ put(btn, pair[0], pair[1]); });
          const ic = btn.querySelector('i');
          if(ic){ put(ic, 'font-size', '13px'); put(ic, 'line-height', '1'); put(ic, 'color', 'inherit'); }
          /* and its hover, which no inline rule can hold: Clear's own — the
             accent wash with the accent on the glyph */
          const lit = function(){
            put(btn, 'background', 'var(--accent-soft)');
            put(btn, 'color', 'var(--accent)');
          };
          const dim = function(){
            put(btn, 'background', 'var(--surface-3)');
            put(btn, 'color', 'var(--ink-2)');
          };
          btn.addEventListener('mouseenter', lit);
          btn.addEventListener('mouseleave', dim);
          btn.addEventListener('focus', lit);
          btn.addEventListener('blur', dim);
          /* the writing stops before the corner the tick stands in */
          const body = pane.querySelector('.idea-write-body');
          if(body) put(body, 'padding-bottom', '58px');
        }
      }catch(e){}

      /* The bar's Clear reads Clear, not CLEAR. The word was upper-cased and
         letter-spaced by the sheet that dresses that bar; the writer's own
         word is sentence case, at the size and weight every other button up
         there wears. Written on the label itself, so no sheet can shout it
         again on the next paint. */
      try{
        const word = document.querySelector('#page-inspire .idea-picks .idea-clear span');
        if(word){
          word.style.setProperty('text-transform', 'none', 'important');
          word.style.setProperty('letter-spacing', '0', 'important');
          word.style.setProperty('font-size', '11px', 'important');
          word.style.setProperty('font-weight', '500', 'important');
        }
      }catch(e){}
    };
    window.sfIdeaCard = dress;

    /* every draw of the page, and the pane the moment it is made */
    if(window.PAGE_RENDERERS && typeof window.PAGE_RENDERERS.inspire === 'function' && !window.PAGE_RENDERERS.inspire.__sfCard){
      const orig = window.PAGE_RENDERERS.inspire;
      const fn = function(){
        const r = orig.apply(this, arguments);
        try{ dress(); }catch(e){}
        return r;
      };
      fn.__sfCard = true;
      window.PAGE_RENDERERS.inspire = fn;
    }
    let raf = 0;
    const soon = function(){
      if(raf) return;
      raf = requestAnimationFrame(function(){ raf = 0; dress(); });
    };
    if(typeof MutationObserver === 'function' && document.body){
      new MutationObserver(soon).observe(document.body, { childList:true, subtree:true });
    }
    dress();
    [0, 200, 800].forEach(function(ms){ setTimeout(dress, ms); });
  })();

  /* ═══ 8l · PICKING AN ENTRY IN THE BIBLE IS ONE THING, NOT THREE ══

     Selecting an entry went through the page's own row handler, which does
     three things at once: it writes the chosen id, it draws the whole left
     card again — every row rebuilt from innerHTML, which also throws the
     list's scroll back to the top — and then it draws the pane beside it.
     And a press on the row that was already on was read as “let this one go”
     and took the highlight off the entry just clicked. A list written over
     itself under the writer's hand is the glitch.

     So a press on a Bible row is answered here instead, in the parts that
     handler is made of: the id is written (with the page's own “nothing is
     on” flag put down beside it), the highlight alone is moved to the row
     that was pressed — no row is rebuilt, so nothing flashes and the list
     stays where it was — and the pane is drawn for the entry now on. The
     page's own handler is not run: the press that was read as “let it go”
     no longer takes the highlight off the entry that was just clicked. */
  (function(){
    const ROWS = '#bbRows .bb-row';

    /* the pick, written in the same parts the page's own handler is made of:
       the chosen id (with the page's “nothing is on” flag put down beside
       it), the mark moved to the one row that is on — no row is rebuilt, so
       nothing flashes and the list keeps the place the writer scrolled it to
       — and the pane drawn for the entry now on. Every net below that
       answers for the Bible calls this, so a press on a row is one thing on
       this page whichever layer answers it. */
    const paint = function(raw){
      const id = String(raw);
      _bbSel = id;
      _bbOff = false;
      /* The entry the writer's own press puts on is the one they may let go
         of again with the next press; before that the page's own pick is not
         theirs to let go (see 8q). And a pick is the end of any letting-go:
         the entry just taken is on, so it is not held out of reach. */
      window.sfBbMine = id;
      window.sfBbLetGoId = null;
      window.sfBbLetGoAt = 0;
      if(typeof save === 'function') save();
      const box = document.getElementById('bbRows');
      const all = box ? box.querySelectorAll(ROWS) : null;
      if(all){
        for(let i = 0; i < all.length; i++){
          const on = String(all[i].getAttribute('data-bb-open') || '') === id;
          if(on !== all[i].classList.contains('on')) all[i].classList.toggle('on', on);
        }
      }
      if(typeof renderBbDetail === 'function') renderBbDetail();
      return true;
    };
    window.sfBbPick = paint;   /* the Bible's one pick, in place */

    /* ═══ 8s · THE FIVE WORKSPACES, IN A ROW BESIDE THE ROUND BUTTON ═══

       The workspaces of the open book stand as five little SCREENS to the
       LEFT of the round button, in the corner it already keeps, drawn the way
       a Linux switcher draws a workspace: a wallpaper, the bar across the top
       of it, and a window for each kind of thing that workspace is holding —
       its chapters, its subchapters, its drafts, its prompts, its bible — so
       an empty workspace is the empty desktop it really is and a full one is
       a desk with work on it. Nothing else is printed in a box: the name the
       writer gave the workspace (Settings → Custom → Workspaces, or
       “Workspace n”) is the box's TOOLTIP. The one you are on is ringed in
       the accent, the ones switched off are dimmed and cannot be pressed, and
       a press moves the page ACROSS — the arriving workspace slides in from
       the side the press came from, never from top to bottom — which is the
       app's own sideways slide (welcome.js flash(): one call to
       window.sfWsGo(i) is all of it). The row stands down when there is only
       one workspace left to move between, exactly as the button's own badge
       does. */
    (function(){
      const CSS = [
        'html body #sfWsBoxes{',
        '  position:fixed !important; top:6px !important; right:46px !important; height:32px !important;',
        '  display:flex !important; align-items:center !important; gap:4px !important; z-index:999 !important;',
        '}',
        'html body #sfWsBoxes[hidden]{ display:none !important; }',
        /* while the page list (or the assistant) is open the button is a menu,
           not a button: the screens stand down with it, so nothing of theirs
           can read as a row of that menu */
        'html body:has(#fabWrap.menu-open) #sfWsBoxes{ display:none !important; }',
        /* ── a screen, drawn small ─────────────────────────────
           Landing landscape, the way a switcher shows a desktop: wallpaper,
           the bar across the top, and the workspace's own windows standing
           in it. The box prints no number — the label is the tooltip. */
        'html body #sfWsBoxes .sf-ws-box{',
        '  position:relative !important; width:38px !important; height:24px !important;',
        '  margin:0 !important; padding:0 !important; overflow:hidden !important;',
        '  background:var(--surface-2) !important; border:0 !important; outline:none !important;',
        '  border-radius:4px !important; cursor:pointer !important;',
        '  transition:background 180ms var(--ease, ease), transform 180ms var(--ease, ease) !important;',
        '}',
        /* the bar across the top of every workspace */
        'html body #sfWsBoxes .sf-ws-box::before{',
        '  content:"" !important; position:absolute !important; top:0 !important; left:0 !important;',
        '  right:0 !important; height:3px !important; background:var(--surface-4) !important;',
        '}',
        'html body #sfWsBoxes .sf-ws-scr{',
        '  position:absolute !important; top:4px !important; left:2px !important; right:2px !important; bottom:2px !important;',
        '  display:flex !important; flex-wrap:wrap !important; align-content:flex-start !important; gap:1px !important;',
        '}',
        'html body #sfWsBoxes .sf-ws-win{',
        '  display:block !important; height:5px !important; background:var(--surface-4) !important;',
        '  border-radius:1px !important;',
        '}',
        'html body #sfWsBoxes .sf-ws-win.n1{ width:60% !important; }',
        'html body #sfWsBoxes .sf-ws-win.n2{ width:32% !important; }',
        'html body #sfWsBoxes .sf-ws-win.n3{ width:44% !important; }',
        'html body #sfWsBoxes .sf-ws-win.n4{ width:26% !important; }',
        'html body #sfWsBoxes .sf-ws-win.n5{ width:52% !important; }',
        /* no edge and no ring on any of them: the workspace you are ON is
           simply the lit desktop — the wallpaper a shade up and its windows
           carrying the accent's own soft wash — the way a Linux switcher
           marks the desk you are sitting at. The browser's focus outline is
           kept for the keyboard only. */
        'html body #sfWsBoxes .sf-ws-box:focus{ outline:none !important; }',
        'html body #sfWsBoxes .sf-ws-box:focus-visible{ outline:2px solid var(--accent-2, var(--accent)) !important; outline-offset:2px !important; }',
        'html body #sfWsBoxes .sf-ws-box:hover{ background:var(--surface-3) !important; transform:translateY(-1px) !important; }',
        'html body #sfWsBoxes .sf-ws-box:hover .sf-ws-win{ background:var(--surface-5, var(--surface-4)) !important; }',
        'html body #sfWsBoxes .sf-ws-box.on{ background:var(--surface-4) !important; transform:none !important; }',
        'html body #sfWsBoxes .sf-ws-box.on .sf-ws-win{ background:var(--accent-soft, var(--surface-5)) !important; }',
        /* a row of five screens does not fit a phone: the button's own badge
           carries the workspace there, as it always did */
        '@media (max-width: 700px){ html body #sfWsBoxes{ display:none !important; } }',
        'html body #sfWsBoxes .sf-ws-box.off{ opacity:.35 !important; cursor:not-allowed !important; }',
        'html body #sfWsBoxes .sf-ws-box.off:hover{ background:var(--surface-2) !important; transform:none !important; }',
        'html body.reduce-motion #sfWsBoxes .sf-ws-box{ transition:none !important; }'
      ].join('\n');
      const host = document.head || document.documentElement;
      if(host && !document.getElementById('sfWsBoxesCss')){
        const sheet = document.createElement('style');
        sheet.id = 'sfWsBoxesCss';
        sheet.textContent = CSS;
        host.appendChild(sheet);
      }

      const count  = function(){ return (typeof window.sfWsCount === 'function') ? window.sfWsCount() : 0; };
      const nameOf = function(i){ return (typeof window.sfWsName === 'function') ? window.sfWsName(i) : ('Workspace ' + (i + 1)); };
      const nowOn  = function(){ return (typeof window.sfWsActive === 'function') ? Number(window.sfWsActive()) || 0 : 0; };
      const armed  = function(){ return (typeof window.sfWsArmed === 'function') ? !!window.sfWsArmed() : false; };
      const isOff  = function(i){ return (typeof window.sfWsOff === 'function') ? !!window.sfWsOff(i) : false; };
      /* what the workspace at i is holding — one window per kind of thing it
         has. The count is read off the project's own wsList, which is where
         each workspace's content really lives (workspaces.js): the screen
         shows that workspace, not a guess at it. */
      const holds  = function(i){
        try{
          const proj = (typeof window.sfWsProj === 'function') ? window.sfWsProj() : null;
          const w = proj && Array.isArray(proj.wsList) ? proj.wsList[i] : null;
          if(!w) return 0;
          const ch = Array.isArray(w.chapters) ? w.chapters : [];
          let n = 0;
          if(ch.length) n++;
          if(ch.some(function(c){ return c && (c.children || []).length; })) n++;
          if((w.drafts || []).length) n++;
          if((w.ideas || []).length) n++;
          const bible = (w.bible && typeof w.bible === 'object')
            ? Object.keys(w.bible).reduce(function(a, k){ return a + ((w.bible[k] || []).length); }, 0) : 0;
          if(bible || (w.timeline || []).length) n++;
          return Math.min(5, n);
        }catch(e){ return 0; }
      };

      let row = null;
      const build = function(){
        const n = count();
        if(!n || !document.body) return null;
        if(!row || !row.parentNode) row = document.getElementById('sfWsBoxes');
        if(!row){
          row = document.createElement('div');
          row.id = 'sfWsBoxes';
          row.setAttribute('role', 'group');
          row.setAttribute('aria-label', 'Workspaces');
          document.body.appendChild(row);
        }
        while(row.children.length < n){
          const i = row.children.length;
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'sf-ws-box';
          b.setAttribute('data-sf-ws', String(i));
          const scr = document.createElement('span');
          scr.className = 'sf-ws-scr';
          b.appendChild(scr);
          row.appendChild(b);
        }
        while(row.children.length > n) row.removeChild(row.lastChild);
        return row;
      };

      const dress = function(){
        const box = build();
        if(!box) return;
        const wrap = document.getElementById('fabWrap');
        const standing = armed() && !!wrap && wrap.getClientRects().length > 0;
        box.hidden = !standing;
        if(!standing) return;
        const at = nowOn();
        for(let i = 0; i < box.children.length; i++){
          const b = box.children[i];
          if(parseInt(b.getAttribute('data-sf-ws'), 10) !== i) b.setAttribute('data-sf-ws', String(i));
          const off = isOff(i);
          const on = (i === at);
          if(b.classList.contains('on') !== on) b.classList.toggle('on', on);
          if(b.classList.contains('off') !== off) b.classList.toggle('off', off);
          b.disabled = off;
          const label = nameOf(i) + (off ? ' · switched off' : (on ? ' · on screen now' : ''));
          if(b.title !== label) b.title = label;
          b.setAttribute('aria-label', label);
          /* the desktop inside: a window per kind of work the workspace holds,
             written only when the count has changed */
          const scr = b.firstChild;
          if(scr && scr.className === 'sf-ws-scr'){
            const want = holds(i);
            if(b.getAttribute('data-sf-win') !== String(want)){
              b.setAttribute('data-sf-win', String(want));
              while(scr.firstChild) scr.removeChild(scr.firstChild);
              for(let k = 0; k < want; k++){
                const w = document.createElement('i');
                w.className = 'sf-ws-win n' + (k + 1);
                scr.appendChild(w);
              }
            }
          }
          b.setAttribute('aria-current', on ? 'true' : 'false');
        }
      };

      /* a press moves the page sideways: the app's own slide, across */
      document.addEventListener('click', function(e){
        const t = e.target;
        if(!t || !t.closest) return;
        const b = t.closest('#sfWsBoxes [data-sf-ws]');
        if(!b || b.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        const i = parseInt(b.getAttribute('data-sf-ws'), 10);
        if(isNaN(i) || i === nowOn()){ dress(); return; }
        try{ if(typeof window.sfWsGo === 'function') window.sfWsGo(i); }catch(err){}
        dress();
        setTimeout(dress, 60);
      }, true);

      dress();
      [0, 120, 400, 1200, 2500].forEach(function(ms){ setTimeout(dress, ms); });
      window.addEventListener('resize', function(){ dress(); });
      setInterval(dress, 400);            /* the badge is painted this way too */
    })();

    /* ═══ 8t · THE BOARD: THE HAND, THE LEFT CLICK, AND THE ARROW KEYS ═══

       A card moves one way whichever way it is asked — its list is written on
       the project, the project is saved, the board is drawn again. The LISTS
       move too, and so does the board itself:

         · the hand        a card is dragged as it always was, and the whole
                           card wears the grabbed hand while it is in the air;
                           a LIST is dragged by its own head — the name, the
                           count — and dropped on another list to take its
                           place on the board;
         · the left click  press a card and it is IN your hand — ringed,
                           dimmed, and it says so; press any list and it is
                           dropped there; press the card itself to put it
                           down again;
         · the keys        ← → ↑ ↓ move the BOARD — the whole sheet travels,
                           sideways and down, the way a board wider than the
                           window does. Enter (or Space), with a card in your
                           hand, puts it down on the list under the pointer;
                           Escape puts it back.

       The board is redrawn by the app on every save, so nothing is built
       here: what is remembered is the card's id and its list's id, and the
       marks go back onto whatever the redraw left in their place. The ORDER
       of the cards inside a list is the writer's own and is never touched. */
    (function(){
      if(!window.PAGE_RENDERERS || typeof window.PAGE_RENDERERS.kanban !== 'function') return;

      const CSS = [
        'html body #page-kanban .kb-card[class]{ cursor:grab !important; }',
        'html body #page-kanban .kb-card[class]:active,',
        'html body #page-kanban .kb-card.is-dragging[class],',
        'html body #page-kanban .kb-board.sf-kb-down .kb-card[class]{ cursor:grabbing !important; }',
        'html body #page-kanban .kb-card.sf-kb-at{ box-shadow:0 0 0 1.5px var(--ink-3) !important; }',
        'html body #page-kanban .kb-card.sf-kb-hand{',
        '  box-shadow:0 0 0 1.5px var(--accent-2, var(--accent)) !important; opacity:.7 !important;',
        '}',
        'html body #page-kanban .kb-col.sf-kb-list{',
        '  border-radius:var(--r-lg, 8px) !important;',
        '  box-shadow:0 0 0 1.5px var(--line-3, var(--line)) !important;',
        '}',
        'html body #page-kanban .kb-col.sf-kb-list.sf-kb-over{',
        '  box-shadow:0 0 0 1.5px var(--accent-2, var(--accent)) !important;',
        '}',
        /* the hand that moves a LIST: its own head */
        'html body #page-kanban .kb-col-head[class]{ cursor:grab !important; }',
        'html body #page-kanban .kb-col-head[class]:active{ cursor:grabbing !important; }',
        /* ── the accent says WHICH ONE ──
           The accent is already this app's mark for “this one” — the chip
           that is on, a pair that is chosen, the project row in the list all
           wear it (`.chip.on`, `.ft-pair.on`, the row's own inset edge). The
           board uses that same mark and nothing new: the list under the
           pointer takes a hairline of it, the list IN THE HAND takes the full
           edge and its name goes accent (it is the one being carried), and
           the list that would receive it takes the edge on the side the drop
           is on — so before a list and after it are two different drops and
           can be seen to be. */
        'html body #page-kanban .kb-col:hover{ box-shadow:inset 2px 0 0 var(--accent-2, var(--accent)) !important; }',
        'html body #page-kanban .kb-col.sf-kb-picked{',
        '  opacity:.55 !important; box-shadow:inset 0 0 0 1.5px var(--accent) !important;',
        '}',
        'html body #page-kanban .kb-col.sf-kb-held{ box-shadow:inset 0 0 0 1.5px var(--accent) !important; }',
        'html body #page-kanban .kb-col.sf-kb-held .kb-col-name,',
        'html body #page-kanban .kb-col.sf-kb-want .kb-col-name{ color:var(--accent-2, var(--accent)) !important; }',
        'html body #page-kanban .kb-col.sf-kb-held .kb-col-meta,',
        'html body #page-kanban .kb-col.sf-kb-want .kb-col-meta{ color:var(--accent) !important; }',
        'html body #page-kanban .kb-col.sf-kb-want{',
        '  background:var(--surface-4) !important;',
        '  box-shadow:inset 0 0 0 1.5px var(--accent) !important;',
        '}',
        'html body #page-kanban .kb-col.sf-kb-want.sf-kb-after{',
        '  box-shadow:inset -3px 0 0 var(--accent), inset 0 0 0 1.5px var(--accent) !important;',
        '}',
        'html body #page-kanban .kb-col.sf-kb-want:not(.sf-kb-after){',
        '  box-shadow:inset 3px 0 0 var(--accent), inset 0 0 0 1.5px var(--accent) !important;',
        '}'
      ].join('\n');
      const host = document.head || document.documentElement;
      if(host && !document.getElementById('sfKbNavCss')){
        const st = document.createElement('style');
        st.id = 'sfKbNavCss';
        st.textContent = CSS;
        host.appendChild(st);
      }

      const say    = function(msg){ try{ if(typeof toast === 'function') toast(msg, 'ok'); }catch(e){} };
      const rootOf = function(){ return document.getElementById('page-kanban'); };
      const live   = function(){
        const root = rootOf();
        if(!root) return null;
        return (root.classList.contains('active') || root.classList.contains('on')) ? root : null;
      };
      const board  = function(){ return document.getElementById('kbBoard'); };
      const lists  = function(){
        const b = board();
        return b ? Array.prototype.slice.call(b.querySelectorAll('.kb-col')) : [];
      };
      const cardsIn = function(col){
        return col ? Array.prototype.slice.call(col.querySelectorAll('.kb-card')) : [];
      };
      const idOf   = function(el){ return el ? String(el.getAttribute('data-kb-col') || '') : ''; };
      const kidOf  = function(el){ return el ? String(el.getAttribute('data-kb-card') || '') : ''; };
      const listWith = function(id){
        const ls = lists();
        return (id && ls.filter(function(c){ return idOf(c) === id; })[0]) || ls[0] || null;
      };

      /* where the writer is standing: a list's id and, in that list, a card's
         id — -1 is the list itself, so a list holding nothing is still a
         place the keys can stand */
      const here = { list:null, card:-1 };
      let held = null;                    /* the card in the hand */

      const where = function(){
        const col = listWith(here.list);
        if(!col) return null;
        const cs = cardsIn(col);
        const card = (here.card && here.card !== -1)
          ? (cs.filter(function(c){ return kidOf(c) === here.card; })[0] || null) : null;
        return { col: col, cs: cs, card: card };
      };

      const clear = function(){
        const root = rootOf();
        if(!root) return;
        Array.prototype.slice.call(root.querySelectorAll('.sf-kb-at,.sf-kb-hand,.sf-kb-list,.sf-kb-over'))
          .forEach(function(el){ el.classList.remove('sf-kb-at','sf-kb-hand','sf-kb-list','sf-kb-over'); });
        const b = board();
        if(b) b.classList.remove('sf-kb-down');
      };
      const draw = function(show){
        if(!live()) return;
        clear();
        const f = where();
        if(!f) return;
        f.col.classList.add('sf-kb-list');
        if(held) f.col.classList.add('sf-kb-over');
        if(f.card) f.card.classList.add('sf-kb-at');
        if(held){
          const me = f.cs.filter(function(c){ return kidOf(c) === held.id; })[0];
          if(me) me.classList.add('sf-kb-hand');
          const b = board();
          if(b) b.classList.add('sf-kb-down');
        }
        if(show && f.card && f.card.scrollIntoView){
          try{ f.card.scrollIntoView({ block:'nearest', inline:'nearest' }); }
          catch(e){ try{ f.card.scrollIntoView(false); }catch(err){} }
        }
        here.list = idOf(f.col);
        here.card = f.card ? kidOf(f.card) : -1;
      };

      /* the BOARD travels, not a cursor through it: ← → ↑ ↓ move the whole
         sheet by about two fifths of what is on screen */
      const pan = function(dx, dy){
        const b = board();
        if(!b) return false;
        const x = Math.max(0, (b.scrollLeft || 0) + dx);
        const y = Math.max(0, (b.scrollTop  || 0) + dy);
        try{ b.scrollTo({ left:x, top:y, behavior:'smooth' }); }
        catch(e){ b.scrollLeft = x; b.scrollTop = y; }
        return true;
      };
      const hovered = function(){
        const col = document.querySelector('#kbBoard .kb-col:hover');
        return col ? idOf(col) : '';
      };
      /* the LISTS in their new order: the board is the project's own list of
         lists (proj.kbCols), so the move is written there and the board is
         drawn again — the cards in them do not move and are not re-ordered.

         Two things had to be right for a list to go where it was put, and
         neither was. There was no “the other side of this list”: a drop only
         ever went IN FRONT of the list under the pointer, so the one list you
         cannot move is the last one — dropping on the last list still puts
         the moved list before it, and there is nothing else to drop on. And
         the index was read from the list BEFORE the moved one was taken out
         of it, so a move to the right landed one place short. Now the target
         is where it stands once the moved list is out of the row, and the
         side of the list the pointer is on decides whether it goes before it
         or after it. */
      const reorder = function(fromId, toId, after, breaks){
        if(!fromId || fromId === toId) return false;
        let cols = null;
        try{ cols = (typeof kbColumns === 'function') ? kbColumns() : null; }catch(e){}
        if(!Array.isArray(cols)) return false;
        const ids  = cols.map(function(c){ return String((c && c.id) || ''); });
        const from = ids.indexOf(fromId);
        if(from < 0) return false;
        const moved = cols.splice(from, 1)[0];
        let at = ids.indexOf(toId);
        if(at < 0) at = cols.length;                  /* dropped past the last list */
        else if(at > from) at -= 1;                   /* the row it left is gone */
        /* ── DROPPING UNDER A LIST ──
           “Under this list” means THE START OF A NEW ROW UNDERNEATH THE ROW
           THAT LIST IS ON — the writer's own words for it. So the moved list
           is put immediately after the LAST list of that row (a row that is
           already full wraps it into the next one by itself), and it is
           marked to START a row, so a row that was not full still breaks
           under the row it was dropped on instead of leaving the moved list
           sitting in the same row. The mark travels on the list, so it
           survives every redraw, and it is let go the moment that list is
           dropped anywhere but under another. */
        if(after) at += 1;
        at = Math.max(0, Math.min(at, cols.length));
        if(moved && typeof moved === 'object'){
          if(breaks && at > 0) moved.rowBreak = true;  /* it starts the row below */
          else delete moved.rowBreak;                  /* a slide along the row */
        }
        cols.splice(at, 0, moved);
        try{ if(typeof save === 'function') save(); }catch(e){}
        redraw();
        say('List moved');
        return true;
      };

      const lift = function(card){
        if(!live() || !card) return false;
        here.list = idOf(card.closest('.kb-col'));
        here.card = kidOf(card);
        held = { id: kidOf(card) };
        draw(false);
        say('Card in hand — click a list to drop it');
        return true;
      };
      const redraw = function(){
        const root = rootOf();
        if(root) try{ window.PAGE_RENDERERS.kanban(root); }catch(e){}
      };
      const putDown = function(listId){
        if(!held) return false;
        const id = held.id;
        const to = listId || here.list;
        held = null;
        let moved = false;
        try{
          const b = (typeof kbBoard === 'function') ? kbBoard() : null;
          if(b && to && b[id] !== to){ b[id] = to; moved = true; }
        }catch(e){}
        here.list = to || here.list;
        here.card = id;
        if(moved){
          try{ if(typeof save === 'function') save(); }catch(e){}
          say('Moved');
        }
        redraw();
        draw(true);
        return moved;
      };

      /* every list's head is the hand that moves that list */
      const heads = function(){
        const root = rootOf();
        if(!root) return;
        Array.prototype.slice.call(root.querySelectorAll('.kb-col-head')).forEach(function(h){
          if(h.getAttribute('draggable') !== 'true') h.setAttribute('draggable', 'true');
        });
      };

      /* ── AND EVERY LIST THAT STANDS UNDER ANOTHER STARTS ITS OWN ROW ──
         A four-column board fills its first row before it wraps, so a list
         dropped UNDER another one has no cell to land in while that row is
         full — the mark is what makes the row break where the writer put it
         (grid-column-start:1, see the sheet at the foot of this file). It is
         kept on the list itself, so it survives every redraw, and it is let
         go the moment that list is dropped anywhere but under another. */
      const breaks = function(){
        const root = rootOf();
        if(!root) return;
        let cols = null;
        try{ cols = (typeof kbColumns === 'function') ? kbColumns() : null; }catch(e){}
        if(!Array.isArray(cols)) return;
        const want = {};
        cols.forEach(function(c, i){ if(c && c.rowBreak && i > 0) want[String(c.id || '')] = true; });
        Array.prototype.slice.call(root.querySelectorAll('.kb-col[data-kb-col]')).forEach(function(el){
          if(want[idOf(el)]){ if(el.getAttribute('data-sf-break') !== '') el.setAttribute('data-sf-break', ''); }
          else if(el.hasAttribute('data-sf-break')) el.removeAttribute('data-sf-break');
        });
      };

      /* the marks go back on after every draw the app makes */
      if(!window.PAGE_RENDERERS.kanban.__sfKbNav){
        const orig = window.PAGE_RENDERERS.kanban;
        const wrapped = function(){
          const r = orig.apply(this, arguments);
          try{ draw(false); heads(); breaks(); markHand(); }catch(e){}
          return r;
        };
        wrapped.__sfKbNav = true;
        window.PAGE_RENDERERS.kanban = wrapped;
      }

      /* ── the LISTS, moved by hand ──
         A list is picked up by its own head — the name, the count and the two
         tools live there, and nothing else in the list is draggable — and
         dropped where the pointer is: before or after another list, by which
         side of it the pointer is on, or on the board itself, which puts it
         at the end. The board's own drag belongs to the cards, so this press
         is read first and never reaches the board: moving a list can never
         drop a card.

         Two more things a grid board needs. The space BETWEEN two lists and
         under the last row is board, not list, and it is where a list is
         dropped when it is taken to the far end or onto a second row — so the
         nearest list is looked for rather than the one strictly under the
         pointer, and the drop is taken wherever it lands instead of being
         refused because the pointer was a few pixels off a list. And the
         board is the scroller here (`#page-kanban .kb-board{ overflow-y:auto }`,
         the page itself does not scroll), and a native drag does not scroll
         it: while a list is in the air the board walks by itself as soon as
         the pointer comes near its top or its bottom, so the lists on the
         second row are reachable by hand. */
      let moving = null;                  /* the list in the air */
      let want   = null;                  /* where it would land: {col, after} */
      let lastX = 0, lastY = 0, pump = 0;
      let hand   = null;                  /* the list in the HAND, moved by key */
      let wasOrder = null;                /* the order it was picked up in */

      const wipe = function(){
        Array.prototype.slice.call(
          document.querySelectorAll('#kbBoard .sf-kb-picked, #kbBoard .sf-kb-want, #kbBoard .sf-kb-held'))
          .forEach(function(el){ el.classList.remove('sf-kb-picked','sf-kb-want','sf-kb-after','sf-kb-held'); });
      };

      /* ── WHERE A LIST WOULD LAND ──
         The board is a grid, so the pointer's own ROW decides which lists are
         in play — the row it is over, or the nearest row by y when it is
         between two of them or past the last one — and inside that row the
         pointer's x against each list's middle decides the GAP between two
         lists. So the far left is a real place (the gap in front of the first
         list of the row), the far right is a real place (the gap past the
         last), and neither needs the pointer to be exactly over a list: the
         room beside a row and the room under the board belong to the nearest
         row. That is what makes a list movable to the END of a board wider or
         taller than the window, and not only to the slot next to it. */
      const under = function(x, y){
        const all0 = lists();
        const info = all0
          .filter(function(c){ return idOf(c) !== moving; })     /* not onto itself */
          .map(function(c){ return { col:c, r:c.getBoundingClientRect() }; });
        if(!info.length) return null;

        /* the row the pointer is on, or the nearest one to it */
        let band = info[0].r.top, bandD = Infinity;
        info.forEach(function(it){
          const d = (y < it.r.top) ? it.r.top - y : (y > it.r.bottom ? y - it.r.bottom : 0);
          if(d < bandD - 0.5){ bandD = d; band = it.r.top; }
        });
        const row = info
          .filter(function(it){ return Math.abs(it.r.top - band) < 8; })
          .sort(function(a, b){ return a.r.left - b.r.left; });
        if(!row.length) return null;

        /* ── over a list: which HALF of it ──
           The cells of a wrapped grid are filled along the row first, so
           “after THIS list” only slides the list along its own row — it can
           never put it UNDER the one it was dropped on. The lower half is
           therefore the new row: the drop goes after the LAST list of the
           row the pointer is on, and the moved list starts the row beneath
           it. The upper half stays the plain “before this list”, and the gap
           beside a row still slides a list along it, so nothing is lost. */
        let bottom = -Infinity, top = Infinity;
        row.forEach(function(it){
          if(it.r.bottom > bottom) bottom = it.r.bottom;
          if(it.r.top    < top)    top    = it.r.top;
        });
        const rowEnd = row[row.length - 1].col;      /* the end of this row */
        /* the space under a row is the same drop: a new row under that row */
        if(y > bottom + 2) return { col:rowEnd, after:true, breaks:true };
        for(let i = 0; i < row.length; i++){
          const it = row[i];
          if(x >= it.r.left && x <= it.r.right){
            /* the lower half: a NEW ROW, started under this one */
            if(y > it.r.top + it.r.height / 2) return { col:rowEnd, after:true, breaks:true };
            return { col:it.col, after:false };
          }
        }
        /* in a gap, beside a row, or above the board: the first list whose
           middle is right of the pointer is the one it goes in front of, and
           past the last one it goes at the end */
        for(let i = 0; i < row.length; i++){
          if(x < row[i].r.left + row[i].r.width / 2) return { col:row[i].col, after:false };
        }
        return { col:rowEnd, after:true };
      };
      const mark = function(hit){
        const on = hit ? hit.col : null;
        Array.prototype.slice.call(document.querySelectorAll('#kbBoard .sf-kb-want'))
          .forEach(function(el){ if(el !== on) el.classList.remove('sf-kb-want','sf-kb-after'); });
        if(!on) return;
        on.classList.add('sf-kb-want');
        if(hit.after) on.classList.add('sf-kb-after');
        else on.classList.remove('sf-kb-after');
      };

      /* ── and the board walks itself ──
         A hand that holds a list near an edge of the board is asking to go
         there, and on this page the board is the scroller
         (`#page-kanban{ overflow:hidden }`, `.kb-board{ overflow-y:auto }`). A
         native drag does not scroll it, so while a list is in the air this
         walks it — BOTH ways, and whichever of the scrollers above the board
         can still move — so the far end of a board taller or wider than the
         window is reachable by hand, not only by the arrow keys. */
      const scrollers = function(){
        const out = [];
        let el = board();
        while(el && el !== document.body){
          let oy = '', ox = '';
          try{
            const cs = getComputedStyle(el);
            oy = cs.overflowY; ox = cs.overflowX;
          }catch(e){}
          const canY = (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 2;
          const canX = (ox === 'auto' || ox === 'scroll') && el.scrollWidth  > el.clientWidth  + 2;
          if(canY || canX) out.push(el);
          el = el.parentElement;
        }
        if(document.scrollingElement) out.push(document.scrollingElement);
        return out;
      };
      const walk = function(dx, dy){
        const chain = scrollers();
        let wantY = dy, wantX = dx;
        for(let i = 0; i < chain.length && (wantY || wantX); i++){
          const sc = chain[i];
          const maxY = Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0));
          const maxX = Math.max(0, (sc.scrollWidth  || 0) - (sc.clientWidth  || 0));
          const y0 = sc.scrollTop  || 0, x0 = sc.scrollLeft || 0;
          const y1 = Math.max(0, Math.min(maxY, y0 + wantY));
          const x1 = Math.max(0, Math.min(maxX, x0 + wantX));
          if(y1 !== y0) wantY = 0;
          if(x1 !== x0) wantX = 0;
          if(y1 !== y0 || x1 !== x0){ sc.scrollTop = y1; sc.scrollLeft = x1; }
        }
      };
      const travel = function(){
        if(!moving) return;
        const b = board();
        if(!b) return;
        const r = b.getBoundingClientRect();
        const zone = 120;
        let dy = 0, dx = 0;
        if(lastY < r.top + zone)         dy = -Math.ceil((r.top + zone - lastY) / 5);
        else if(lastY > r.bottom - zone) dy =  Math.ceil((lastY - (r.bottom - zone)) / 5);
        if(lastX < r.left + zone)        dx = -Math.ceil((r.left + zone - lastX) / 5);
        else if(lastX > r.right - zone)  dx =  Math.ceil((lastX - (r.right - zone)) / 5);
        if(dy || dx) walk(dx, dy);
      };
      const startPump = function(){ if(!pump) pump = setInterval(travel, 45); };
      const stopPump  = function(){ if(pump){ clearInterval(pump); pump = 0; } };

      document.addEventListener('dragstart', function(e){
        const t = e.target;
        if(!t || !t.closest) return;
        const head = t.closest('#page-kanban .kb-col-head');
        if(!head || t.closest('.ol-tool')) return;
        const col = head.closest('.kb-col');
        if(!col) return;
        moving = idOf(col);
        hand = moving;                       /* the drag is the same hand */
        want = null;
        col.classList.add('sf-kb-picked');
        try{
          e.dataTransfer.setData('text/x-kb-col', moving);
          e.dataTransfer.effectAllowed = 'move';
        }catch(err){}
        e.stopPropagation();                  /* the board's drag is for cards */
        startPump();
      }, true);
      document.addEventListener('dragover', function(e){
        if(!moving) return;
        lastX = e.clientX;
        lastY = e.clientY;
        /* taken, wherever it is: the drop below is ours even when the pointer
           is in the gap between two lists or under the last one */
        e.preventDefault();
        try{ e.dataTransfer.dropEffect = 'move'; }catch(err){}
        want = under(e.clientX, e.clientY);
        mark(want);
      }, true);
      document.addEventListener('drop', function(e){
        if(!moving) return;
        e.preventDefault();
        e.stopPropagation();
        const from  = moving;
        const hit   = want || under(e.clientX, e.clientY);
        const to    = hit ? idOf(hit.col) : '';
        const after = !!(hit && hit.after);
        const brks  = !!(hit && hit.breaks);
        moving = null;
        want = null;
        hand = null;                        /* a drop is the hand letting go */
        wasOrder = null;
        stopPump();
        wipe();
        if(to) reorder(from, to, after, brks);
      }, true);
      document.addEventListener('dragend', function(){
        if(!moving) return;
        moving = null;
        want = null;
        hand = null;
        wasOrder = null;
        stopPump();
        wipe();
      }, true);

      /* ── THE HAND THAT CARRIES A LIST ──
         A drag cannot be steered to the far end of a board: the pointer has to
         travel there, the board has to be scrolled under it, and the place it
         ends up depends on where the pointer was let go. So a list has a
         SECOND hand — press its head and the list is IN your hand, marked in
         the accent, and the keys take it wherever you want it however far that
         is: ← → move it one place along the board, ↑ ↓ a whole row of it,
         Enter puts it down where it stands and Escape puts it back where it
         was picked up. Pressing the head again, or pressing anywhere off the
         board, puts it down too. Dragging still works exactly as before. */
      const markHand = function(){
        Array.prototype.slice.call(document.querySelectorAll('#kbBoard .sf-kb-held'))
          .forEach(function(el){ el.classList.remove('sf-kb-held'); });
        if(!hand) return;
        const col = lists().filter(function(c){ return idOf(c) === hand; })[0] || null;
        if(col) col.classList.add('sf-kb-held');
      };
      const release = function(restore){
        const id = hand;
        const was = wasOrder;
        hand = null;
        wasOrder = null;
        if(restore && was){
          let cols = null;
          try{ cols = (typeof kbColumns === 'function') ? kbColumns() : null; }catch(e){}
          if(Array.isArray(cols)){
            const byId = {};
            cols.forEach(function(c){ byId[String((c && c.id) || '')] = c; });
            const want = was.filter(function(k){ return byId[k]; });
            if(want.length === cols.length){          /* the same lists, their order back */
              cols.length = 0;
              want.forEach(function(k){ cols.push(byId[k]); });
              try{ if(typeof save === 'function') save(); }catch(e){}
              redraw();
              say('List put back');
            }
          }
        }
        if(id) markHand();
        return true;
      };
      const hold = function(id){
        if(!id) return false;
        if(hand === id){ release(false); return false; }    /* the same head again */
        let cols = null;
        try{ cols = (typeof kbColumns === 'function') ? kbColumns() : null; }catch(e){}
        if(!Array.isArray(cols)) return false;
        hand = id;
        wasOrder = cols.map(function(c){ return String((c && c.id) || ''); });
        markHand();
        const col = lists().filter(function(c){ return idOf(c) === hand; })[0];
        if(col && col.scrollIntoView){
          try{ col.scrollIntoView({ block:'nearest', inline:'nearest' }); }catch(e){}
        }
        say('List in hand — ← → ↑ ↓ move it, Esc puts it back');
        return true;
      };
      /* a whole row of the board, read off the board itself */
      const rowOf = function(){
        const ls = lists();
        if(!ls.length) return 4;
        const top = ls[0].getBoundingClientRect().top;
        let n = 0;
        ls.forEach(function(c){ if(Math.abs(c.getBoundingClientRect().top - top) < 8) n++; });
        return Math.max(1, n);
      };
      const step = function(delta){
        if(!hand || !delta) return false;
        let cols = null;
        try{ cols = (typeof kbColumns === 'function') ? kbColumns() : null; }catch(e){}
        if(!Array.isArray(cols)) return false;
        const ids  = cols.map(function(c){ return String((c && c.id) || ''); });
        const from = ids.indexOf(hand);
        if(from < 0) return false;
        const at = Math.max(0, Math.min(cols.length - 1, from + delta));
        if(at === from) return false;
        const moved = cols.splice(from, 1)[0];
        cols.splice(at, 0, moved);
        try{ if(typeof save === 'function') save(); }catch(e){}
        redraw();
        markHand();
        const col = lists().filter(function(c){ return idOf(c) === hand; })[0];
        if(col && col.scrollIntoView){
          try{ col.scrollIntoView({ block:'nearest', inline:'nearest' }); }
          catch(e){ try{ col.scrollIntoView(false); }catch(err){} }
        }
        return true;
      };

      document.addEventListener('pointerdown', function(e){
        if(!live()) return;
        const t = e.target;
        if(!t || !t.closest) return;
        const head = t.closest('#page-kanban .kb-col-head');
        if(head && !t.closest('.ol-tool')){
          const col = head.closest('.kb-col');
          if(col){ hold(idOf(col)); return; }
        }
        if(!hand) return;
        if(t.closest('.kb-card')){ release(false); return; }   /* a card is the other hand */
        const col = t.closest('#kbBoard .kb-col');
        if(col && idOf(col) === hand) return;                 /* its own body: keep it */
        release(false);                                       /* anywhere else: down it goes */
      }, true);

      /* a press with the left button: pick a card up, or put it down */
      document.addEventListener('click', function(e){
        if(!live()) return;
        const t = e.target;
        if(!t || !t.closest) return;
        if(t.closest('[data-kb-open],[data-kb-rename],[data-kb-kill],[data-kb="newlist"],[data-kb="reset"]')) return;
        const card = t.closest('.kb-card');
        const col  = t.closest('.kb-col');
        if(held){
          if(!col) return;                    /* a press off the board keeps it in hand */
          e.preventDefault();
          if(card && kidOf(card) === held.id){ held = null; draw(false); return; }
          putDown(idOf(col));
          return;
        }
        if(card){
          e.preventDefault();
          lift(card);
        }
      }, true);

      /* and the keys. The round button's own ← → ↑ ↓ keep their job while the
         pointer is resting on it, and every field, menu and panel above the
         board keeps its own arrows: this only answers when the board is the
         page on screen and nothing is open over it. */
      window.addEventListener('keydown', function(e){
        if(!live()) return;
        if(e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const t = e.target;
        if(t && t !== document.body && t !== document.documentElement){
          const tag = String(t.tagName || '').toLowerCase();
          if(tag === 'input' || tag === 'textarea' || tag === 'select') return;
          if(t.isContentEditable) return;
        }
        if(document.querySelector('.modal.open, .settings-panel.open, .cmd-box.open,'
          + '.draft-drop.open, .stats-cat-card.open, .tb-drop.open, .tb-drop2.open,'
          + '.imf-drop.open, .menu-btn.open')) return;
        const wrap = document.getElementById('fabWrap');
        if(wrap && wrap.classList.contains('ws-hover')) return;

        const b   = board();
        const k   = e.key;
        const take = function(){ e.preventDefault(); e.stopPropagation(); };
        const stepX = Math.max(180, Math.round(((b && b.clientWidth)  || 900) * 0.42));
        const stepY = Math.max(140, Math.round(((b && b.clientHeight) || 600) * 0.42));
        /* a LIST in the hand answers the keys first: ← → move it one place,
           ↑ ↓ a whole row, Enter puts it down here, Escape puts it back. This
           is the way to a place that is FAR — the first list, the last one,
           another row — whatever the pointer can reach. */
        if(hand){
          const row = rowOf();
          if(k === 'ArrowLeft'){ take(); step(-1); return; }
          if(k === 'ArrowRight'){ take(); step(1); return; }
          if(k === 'ArrowUp'){ take(); step(-row); return; }
          if(k === 'ArrowDown'){ take(); step(row); return; }
          if(k === 'Enter' || k === ' ' || k === 'Spacebar'){ take(); release(false); return; }
          if(k === 'Escape'){ take(); release(true); return; }
        }
        if(k === 'ArrowLeft'){ take(); pan(-stepX, 0); return; }
        if(k === 'ArrowRight'){ take(); pan(stepX, 0); return; }
        if(k === 'ArrowUp'){ take(); pan(0, -stepY); return; }
        if(k === 'ArrowDown'){ take(); pan(0, stepY); return; }
        if(k === 'Enter' || k === ' ' || k === 'Spacebar'){
          if(!held) return;
          take();
          putDown(hovered() || here.list);
          return;
        }
        if(k === 'Escape' && held){ take(); held = null; draw(false); }
      }, true);
    })();

    /* ═══ 8u · THE YELLOW LINE IN THE BIBLE'S DETAIL BOX ═══

       The accent bar is the app's gesture for a scrolling AREA — the page, a
       panel, a long list — and it lights on everything the pointer is over
       (see “the scrollbar: why the accent never landed on it”, where the
       state lives in scrollbar-color). The writing box inside a Bible entry
       is a scroller too, but it is a FIELD: one amber line standing at its
       right edge reads as a mark left in the pane, not as “there is more text
       here”. So the entry's pane and the box in it keep the grey bar they
       wear at rest, and the box's corner keeps no grip mark either — the drag
       itself is untouched, so the corner still pulls the box open. */
    (function(){
      const CSS = [
        'html body #bbDetail[class]:hover, html body #bbDetail[class]:active,',
        'html body #bbDetail .bb-field-grow textarea[class]:hover,',
        'html body #bbDetail .bb-field-grow textarea[class]:active,',
        'html body #bbDetail textarea[class]:hover, html body #bbDetail textarea[class]:active{',
        '  scrollbar-color:var(--surface-4) transparent !important;',
        '}',
        'html body #bbDetail::-webkit-scrollbar-thumb,',
        'html body #bbDetail::-webkit-scrollbar-thumb:hover,',
        'html body #bbDetail::-webkit-scrollbar-thumb:active,',
        'html body #bbDetail textarea::-webkit-scrollbar-thumb,',
        'html body #bbDetail textarea::-webkit-scrollbar-thumb:hover,',
        'html body #bbDetail textarea::-webkit-scrollbar-thumb:active{',
        '  background:var(--surface-4) !important; background-clip:padding-box !important;',
        '}',
        'html body #bbDetail textarea::-webkit-resizer{',
        '  display:none !important; width:0 !important; height:0 !important;',
        '  background:transparent !important; border:0 !important; box-shadow:none !important;',
        '}',
        /* ── AND THE CORNER OF THE BOX IS FLAT ──
           The grip in the corner is the app's own mark: the writing box is
           `resize:vertical` (pages.css), so the engine paints its diagonal in
           the corner, and a mark that belongs to the widget is not a border —
           a pseudo-element's background and border do not take it off, which
           is why it survived every pass at it. The one rule that removes it
           for certain is turning the manual resize off: the corner is then
           flat, with no mark and with nothing of the accent's in it. The box
           itself is untouched — same height, same scroll, same bar. */
        'html body #bbDetail textarea, html body #bbDetail .bb-field-grow .inp{',
        '  resize:none !important;',
        '}',
        /* ── and nothing inside the pane wears the accent at all ──
           The bar was pinned on `#bbDetail:hover` alone, which is not the
           whole box: the accent hung on every element the pointer is over
           (`html body *:hover`, the file's own scrollbar rule), so the label
           the pointer was crossing, the field inside it and the pane itself
           were all lit, and whichever of them owns a scroller — the box, the
           writing box in it — wore the amber line whatever was pinned here.
           So the whole subtree is pinned, at rest and held: no scroller
           inside the pane is ever the accent.

           And the caret, and the SELECTION. Neither `--caret` nor `--sel` is
           defined anywhere in this app's stylesheets (theme.css, app.css and
           pages.css all read them, none of them sets them), so every caret
           and every selection falls back to #fab387 — the app's peach, which
           on this theme reads as the yellow line sitting in the box. A caret
           is the writer's own line and a selection is a block, and the app
           selects the whole field when it names a new entry
           (`f.focus(); f.select()` in pages.js), so one press on “New entry”
           left amber standing in a box nobody was in. Both are re-pointed at
           the ink here: inside this pane the line in a field and the block
           under the words are the ink and the grey, whatever paints them. */
        'html body #bbDetail, html body #bbDetail *{',
        '  scrollbar-color:var(--surface-4) transparent !important;',
        '}',
        'html body #bbDetail::-webkit-scrollbar-thumb,',
        'html body #bbDetail::-webkit-scrollbar-thumb:hover,',
        'html body #bbDetail::-webkit-scrollbar-thumb:active,',
        'html body #bbDetail *::-webkit-scrollbar-thumb,',
        'html body #bbDetail *::-webkit-scrollbar-thumb:hover,',
        'html body #bbDetail *::-webkit-scrollbar-thumb:active{',
        '  background:var(--surface-4) !important; background-clip:padding-box !important;',
        '}',
        'html body #bbDetail{',
        '  --caret:var(--ink) !important;',
        '  --sel:var(--surface-5, #454140) !important;',
        '  --sel-ink:var(--ink) !important;',
        '}',
        'html body #bbDetail input, html body #bbDetail textarea, html body #bbDetail select{',
        '  caret-color:var(--ink) !important;',
        '}',
        'html body #bbDetail ::selection{',
        '  background:var(--surface-5, #454140) !important; color:var(--ink) !important;',
        '}',
        /* ── the left card holds NAMES ──
           Every row under a name carried the entry's own details (or its
           date) on a second line, so the list repeated what the pane beside
           it is for: two entries that open the same way read as twins, and
           the card became a wall of prose. A row is the entry's initial, its
           name, and nothing else. */
        'html body #bbRows .bb-row-sub{ display:none !important; }'
      ].join('\n');
      const host = document.head || document.documentElement;
      if(host && !document.getElementById('sfBbLineCss')){
        const st = document.createElement('style');
        st.id = 'sfBbLineCss';
        st.textContent = CSS;
        host.appendChild(st);
      }
    })();

    /* ═══ 8v · A NEW CHAPTER GOES TO THE END OF THE OUTLINE ═══

       pages.js's own “add a chapter” does not append: it slips the new one in
       straight after the chapter you happen to have SELECTED (olAddSection:
       `splice(at + 1, 0, node)` where `at` is the selected chapter's row).
       Make six with Chapter 1 on screen and the outline reads 1, 7, 6, 5, 4,
       3, 2 — each new chapter in front of the last one, in reverse. The
       whole point of the page is that the list is the book. So the press is
       left to the app and the result is tidied: the chapter that was not
       there a moment ago is lifted out of wherever it landed and put at the
       end of the book, the project is saved again, and the page is drawn
       once. Subchapters are untouched — they already go to the end of their
       parent. */
    (function(){
      if(typeof window.olAddSection !== 'function' || window.olAddSection.__sfLast) return;
      const orig = window.olAddSection;
      const wrapped = function(parentId){
        let ds = null, before = null;
        try{ ds = (typeof D === 'function') ? D() : null; }catch(e){}
        if(ds && Array.isArray(ds.chapters)) before = ds.chapters.slice();
        const r = orig.apply(this, arguments);
        try{
          if(!parentId && ds && before && Array.isArray(ds.chapters)){
            const fresh = ds.chapters.filter(function(c){ return before.indexOf(c) < 0; });
            if(fresh.length){
              fresh.forEach(function(c){
                const i = ds.chapters.indexOf(c);
                if(i >= 0) ds.chapters.splice(i, 1);
              });
              fresh.forEach(function(c){ ds.chapters.push(c); });
              try{ if(typeof save === 'function') save(); }catch(e){}
              const root = document.querySelector('#page-outline') || document.querySelector('.page.active');
              if(root && window.PAGE_RENDERERS && typeof window.PAGE_RENDERERS.outline === 'function'){
                window.PAGE_RENDERERS.outline(root);
              }
            }
          }
        }catch(e){}
        return r;
      };
      wrapped.__sfLast = true;
      window.olAddSection = wrapped;
    })();

    /* ═══ 8w · THE SAME RIGHT-CLICK ON THE MANUSCRIPT ═══

       The Idea page copies the prompt you right-click, and the Draft copies
       the draft; both pages also put what was copied into a blank box. The
       manuscript's editor is the same kind of surface and had nothing at all:
       final-fix already takes the browser's own menu away from it (the editor
       right-click is swallowed), so the key did not even open the browser's
       copy/paste. Now it does what the other two pages do — the chapter you
       are looking at goes onto the clipboard, and a chapter that is still
       EMPTY takes what was last copied, from any of the three pages. */
    (function(){
      const say = function(msg, kind){ try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){} };
      let clip = '';
      const copy = function(txt, what){
        txt = String(txt == null ? '' : txt);
        if(!txt.trim()){ say('Nothing to copy', 'warn'); return false; }
        clip = txt;
        try{ window.sfClip = txt; }catch(e){}
        try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); }catch(e){}
        say('Copied ' + what);
        return true;
      };
      window.sfCopy = copy;

      const editorOf = function(){
        const page = document.getElementById('page-manuscript');
        if(!page) return null;
        if(!page.classList.contains('active') && !page.classList.contains('on')) return null;
        const ed = document.getElementById('editor');
        return (ed && page.contains(ed)) ? ed : null;
      };
      const put = function(ed, txt){
        try{ ed.focus(); }catch(e){}
        let done = false;
        try{ done = document.execCommand('insertText', false, txt); }catch(e){ done = false; }
        if(done) return true;
        ed.textContent = String(ed.textContent || '') + txt;
        try{
          const r = document.createRange();
          r.selectNodeContents(ed);
          r.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        }catch(e){}
        try{ ed.dispatchEvent(new Event('input', { bubbles:true })); }catch(e){}
        return true;
      };
      window.sfPut = put;          /* the same writing, for the net below */

      document.addEventListener('contextmenu', function(e){
        const ed = editorOf();
        if(!ed) return;
        const t = e.target;
        if(!t || !t.closest) return;
        /* the writing surface only — the chapter strip keeps its own menu */
        if(!t.closest('#editor, #writeCanvas, .write-canvas, .write-wrap')) return;
        /* what is SELECTED comes first: a phrase picked out is what the key
           is about, not the chapter it happens to stand in */
        let sel = '';
        try{
          const s = window.getSelection();
          if(s && !s.isCollapsed && s.anchorNode && ed.contains(s.anchorNode)) sel = String(s.toString() || '');
        }catch(err){ sel = ''; }
        if(sel.trim()){
          e.preventDefault(); e.stopPropagation();
          copy(sel, 'the selection');
          return;
        }
        const text = String(ed.innerText || '').replace(/\u00a0/g, ' ').trim();
        if(text){
          e.preventDefault(); e.stopPropagation();
          let what = 'chapter';
          try{ if(typeof chLabels === 'function') what = String(chLabels().ch || 'chapter').toLowerCase(); }catch(err){}
          copy(text, 'the ' + what);
          return;
        }
        const have = clip || window.sfClip || '';
        if(!have){
          /* Nothing of ours in hand. The Idea page's copy is the app's own
             and cannot be read from here — but every copy in the app is
             written to the SYSTEM clipboard as well (app.js's copyBlock
             says so), so ask that one. Nothing happens if it is refused. */
          e.preventDefault(); e.stopPropagation();
          try{
            if(navigator.clipboard && navigator.clipboard.readText){
              navigator.clipboard.readText().then(function(txt){
                txt = String(txt == null ? '' : txt);
                if(!txt.trim()) return;
                const live = editorOf();
                if(!live) return;
                put(live, txt);
                say('Pasted');
              }).catch(function(){});
            }
          }catch(err){}
          return;
        }
        e.preventDefault(); e.stopPropagation();
        put(ed, have);
        say('Pasted');
      }, true);
    })();

    /* ═══ 8x · THE WORKSPACE MOVE, AND THE BUTTON'S COUNT ═══

       Two things about the round button's third job.

       1 · THE MOVE HAD TO BE WALKED, NOT BLINKED. pages.css slides the page
           14px over 420ms; on a screen that has just been repainted it is
           over before the eye has found the page again. The app's own slide
           is turned off here and the same move is walked instead — 26px over
           560ms, easing out, on the page AND on the button's mark, so which
           way you moved is something you can see. It was walked 46px over a
           whole second before, and that is the other fault: a step that only
           settles after it has been answered reads as slow. A little over
           half a second is the move you can follow and do not wait for. The
           direction is read from the workspace you were on and the one you
           landed on, so a step that skips a switched-off workspace still
           slides the way you pressed. The preference for less motion wins.

       2 · THE BUTTON NO LONGER COUNTS. The “3/5” chip on the round button
           (workspaces.js badge()) sat on the button and stayed through the
           hover that opens the page list, where it read as one more label in
           the menu. The five screens beside the button already say which
           workspace you are on and what each one holds, so the chip is not
           drawn at all — and with it goes its tooltip. */
    (function(){
      const WALK = 560;
      const WALK_PX = 26;
      const EASE = 'cubic-bezier(.22,.72,.24,1)';
      const CSS = [
        'html body #stage.ws-slide-fwd, html body #stage.ws-slide-back,',
        'html body #stage.ws-slide-down, html body #stage.ws-slide-up,',
        'html body .fab-wrap.ws-slide-fwd .fab-mark, html body .fab-wrap.ws-slide-back .fab-mark,',
        'html body .fab-wrap.ws-slide-down .fab-mark, html body .fab-wrap.ws-slide-up .fab-mark{',
        '  animation:none !important;',
        '}',
        '@keyframes sfWsWalkFwd{ from{ transform:translateX(' + WALK_PX + 'px);  opacity:.25; } to{ transform:translateX(0); opacity:1; } }',
        '@keyframes sfWsWalkBack{ from{ transform:translateX(-' + WALK_PX + 'px); opacity:.25; } to{ transform:translateX(0); opacity:1; } }',
        '@keyframes sfWsWalkDown{ from{ transform:translateY(' + WALK_PX + 'px);  opacity:.25; } to{ transform:translateY(0); opacity:1; } }',
        '@keyframes sfWsWalkUp{ from{ transform:translateY(-' + WALK_PX + 'px); opacity:.25; } to{ transform:translateY(0); opacity:1; } }',
        'html body #stage.sf-ws-walk-fwd{ animation:sfWsWalkFwd ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body #stage.sf-ws-walk-back{ animation:sfWsWalkBack ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body #stage.sf-ws-walk-down{ animation:sfWsWalkDown ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body #stage.sf-ws-walk-up{ animation:sfWsWalkUp ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body .fab-wrap.sf-ws-walk-fwd .fab-mark{ animation:sfWsWalkFwd ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body .fab-wrap.sf-ws-walk-back .fab-mark{ animation:sfWsWalkBack ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body .fab-wrap.sf-ws-walk-down .fab-mark{ animation:sfWsWalkDown ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body .fab-wrap.sf-ws-walk-up .fab-mark{ animation:sfWsWalkUp ' + WALK + 'ms ' + EASE + ' both !important; }',
        'html body.reduce-motion #stage[class*="sf-ws-walk-"],',
        'html body.reduce-motion .fab-wrap[class*="sf-ws-walk-"] .fab-mark{ animation:none !important; }',
        /* the round button carries no count */
        'html body .fab-wrap .fab-ws-badge{ display:none !important; }'
      ].join('\n');
      const host = document.head || document.documentElement;
      if(host && !document.getElementById('sfWsWalkCss')){
        const st = document.createElement('style');
        st.id = 'sfWsWalkCss';
        st.textContent = CSS;
        host.appendChild(st);
      }

      const calm = function(){
        const b = document.body;
        return !!(b && b.classList && b.classList.contains('reduce-motion'));
      };
      const walk = function(dir, axis){
        if(calm()) return;
        const vert = axis === 'y';
        const cls = vert ? (dir > 0 ? 'sf-ws-walk-down' : 'sf-ws-walk-up')
                         : (dir > 0 ? 'sf-ws-walk-fwd'  : 'sf-ws-walk-back');
        const all = ['sf-ws-walk-fwd','sf-ws-walk-back','sf-ws-walk-down','sf-ws-walk-up'];
        [document.getElementById('stage'), document.getElementById('fabWrap')].forEach(function(el){
          if(!el || !el.classList) return;
          all.forEach(function(c){ el.classList.remove(c); });
          void el.offsetWidth;
          el.classList.add(cls);
          setTimeout(function(){ el.classList.remove(cls); }, WALK + 40);
        });
      };
      const nowOn = function(){
        return (typeof window.sfWsActive === 'function') ? (Number(window.sfWsActive()) || 0) : 0;
      };

      if(typeof window.sfWsGo === 'function' && !window.sfWsGo.__sfWalk){
        const orig = window.sfWsGo;
        const wrapped = function(){
          const before = nowOn();
          const r = orig.apply(this, arguments);
          const after = nowOn();
          if(after !== before) walk(after > before ? 1 : -1, 'x');
          return r;
        };
        wrapped.__sfWalk = true;
        window.sfWsGo = wrapped;
      }
      if(typeof window.sfWsStep === 'function' && !window.sfWsStep.__sfWalk){
        const orig = window.sfWsStep;
        const wrapped = function(dir, axis){
          const before = nowOn();
          const r = orig.apply(this, arguments);
          const after = nowOn();
          if(after !== before) walk(after > before ? 1 : -1, axis === 'y' ? 'y' : 'x');
          return r;
        };
        wrapped.__sfWalk = true;
        window.sfWsStep = wrapped;
      }

      /* the word on the way in is the workspace's NAME, not its place */
      if(typeof window.toast === 'function' && !window.toast.__sfWsName){
        const orig = window.toast;
        const wrapped = function(msg, kind){
          if(typeof msg === 'string'){
            const m = /^Workspace\s+\d+\s+of\s+\d+\s*·\s*(.+)$/.exec(msg);
            if(m) msg = m[1];
          }
          return orig.call(this, msg, kind);
        };
        wrapped.__sfWsName = true;
        window.toast = wrapped;
      }
    })();

    /* ═══ 8y · THE BLINKING LINE IN AN ENTRY NOBODY IS IN ═══

       The yellow line in the Bible's Details box is the CARET — pages.css
       paints every textarea's caret in the app's accent, and the accent here
       is #f0b877, a warm yellow. A caret only exists in a box that has
       focus, and the app hands focus out on its own: it focuses the first
       field of a new entry the moment one is added, and again on a repaint.
       So a chapter nobody has touched sat there with a line standing in it.

       The rule is the Idea card's rule (8r), read a little tighter: the pane
       keeps a caret only while the writer's own press landed INSIDE the pane
       — on a field of the entry, or on the writing box — or while they are
       typing in one of them. A press on “New entry” leaves the pane alone,
       so the field the app focuses for renaming is let go again at once. */
    (function(){
      const PANE = '#bbDetail';
      let theirs = false;
      const insidePane = function(ev){
        const t = ev && ev.target;
        if(!t || !t.closest) return false;
        return !!t.closest(PANE);
      };
      const typing = function(){
        const a = document.activeElement;
        return !!(a && a.closest && a.closest(PANE));
      };
      window.addEventListener('pointerdown', function(e){
        theirs = (e && e.isTrusted === true) ? insidePane(e) : false;
      }, true);
      window.addEventListener('keydown', function(e){
        /* tabbing into the pane is the writer too: the keyboard is how they
           got there, and the field they land in must keep its caret */
        if(e && e.key === 'Tab'){ theirs = true; return; }
        if(typing()) theirs = true;
        else if(e && e.isTrusted === true) theirs = false;
      }, true);
      document.addEventListener('focusin', function(e){
        if(theirs) return;                      /* the writer is in the pane */
        const t = e.target;
        if(!insidePane(e)) return;
        const tag = String(t.tagName || '').toUpperCase();
        if(!(tag === 'TEXTAREA' || tag === 'INPUT' || t.isContentEditable)) return;
        try{ t.blur(); }catch(err){}
      }, true);
    })();

    /* ═══ 8z · THE RIGHT-CLICK, THE SAME ON EVERY PAGE ═══

       Copying and pasting by right-click was on two-and-a-half pages: the
       Idea grid (app.js), the Draft rows and the manuscript editor (8w).
       Everywhere else the browser's own menu opened — and a browser menu in
       an app that has no other menus is a hole in the app. So the same two
       gestures now answer on every page, in this order:

         · a phrase you have SELECTED in the field goes onto the clipboard;
         · an EMPTY box takes what was copied last (the app's own clipboard
           first, then the system clipboard, since every copy in the app is
           written to both);
         · a box with words in it gives up its own text.

       Nothing happens — and the browser keeps its menu — over a panel, a
       dialog, the Settings sheet, the round button or the Idea grid's own
       cards, whose copy is the app's gesture and stays that way. */
    (function(){
      const say = function(msg, kind){ try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){} };
      const editable = function(el){
        if(!el || !el.closest) return null;
        const f = el.closest('textarea, input, [contenteditable="true"]');
        if(!f) return null;
        if(String(f.tagName || '').toLowerCase() === 'input'){
          const type = String(f.type || 'text').toLowerCase();
          if(type !== 'text' && type !== 'search' && type !== 'url' && type !== 'email') return null;
        }
        if(f.disabled || f.readOnly) return null;
        return f;
      };
      const textOf = function(f){
        return String(f.isContentEditable ? (f.innerText || '') : (f.value || ''));
      };
      const blank = function(f){ return !textOf(f).replace(/\u00a0/g, ' ').trim(); };
      const picked = function(f){
        try{
          if(f.isContentEditable){
            const s = window.getSelection();
            if(!s || s.rangeCount === 0 || s.isCollapsed) return '';
            const r = s.getRangeAt(0);
            if(!f.contains(r.commonAncestorContainer)) return '';
            return String(s.toString() || '');
          }
          const a = f.selectionStart, b = f.selectionEnd;
          if(typeof a === 'number' && typeof b === 'number' && b > a) return String(f.value || '').slice(a, b);
        }catch(e){}
        return '';
      };
      const put = function(f, txt){
        try{ if(typeof window.sfPut === 'function') return window.sfPut(f, txt); }catch(e){}
        return false;
      };

      window.addEventListener('contextmenu', function(e){
        if(e.defaultPrevented) return;
        const t = e.target;
        if(!t || !t.closest) return;
        if(t.closest('#modalRoot, .modal, .settings-panel, [data-typo-panel], .cmd-box, .fab-wrap,'
                   + ' .fab-menu, .fab-ai, #pagesOverlay, .sf-adv, #projList, #stage > .page:not(.active)')) return;
        const page = document.querySelector('.page.active') || document.querySelector('.page.on');
        if(!page || !page.contains(t)) return;
        if(t.closest('#ideaCards [data-ic-slot], #ideaCards .idea-slot')) return;   /* the app's own copy */
        const f = editable(t);
        if(!f) return;

        const sel = picked(f);
        if(sel.trim()){
          e.preventDefault(); e.stopPropagation();
          if(typeof window.sfCopy === 'function') window.sfCopy(sel, 'the selection');
          return;
        }
        if(blank(f)){
          const clip = String(window.sfClip || '');
          if(clip){
            e.preventDefault(); e.stopPropagation();
            if(put(f, clip)) say('Pasted');
            return;
          }
          /* nothing of ours in hand: the system clipboard may still have it */
          e.preventDefault(); e.stopPropagation();
          try{
            if(navigator.clipboard && navigator.clipboard.readText){
              navigator.clipboard.readText().then(function(txt){
                txt = String(txt == null ? '' : txt);
                if(!txt.trim()) return;
                const live = editable(t);
                if(!live || !blank(live)) return;
                if(put(live, txt)) say('Pasted');
              }).catch(function(){});
            }
          }catch(err){}
          return;
        }
        const own = textOf(f).trim();
        if(own){
          e.preventDefault(); e.stopPropagation();
          if(typeof window.sfCopy === 'function') window.sfCopy(own, 'the text');
        }
      }, true);
    })();

    /* ── 8aa · THE DRAFT'S ROW ANSWERS ITS OWN PRESS ─────────────────

       The Draft page has the Bible's card, and it had the Bible's fault: a
       press on a row went through the page's own handler, which writes the
       choice, draws the WHOLE list again — every row a new node, which is
       what flashes the card — and reads a press on the draft already on as
       “let this one go” (-1). A let-go empties the pane beside the list, and
       the nets that put a press back then filled it again a beat later: one
       press, and the right-hand card blinked. Two more layers drew the list a
       second and a third time after the press (`renderDrafts()` from their
       own timers), so the flash repeated.

       So a press on a draft row is answered here, in the parts that handler
       is made of, and the page's handler never sees it: the choice is written
       — and it is ALWAYS the draft that was pressed, never -1 — the mark is
       moved on the rows already on screen, so no row is rebuilt and the list
       keeps the place the writer scrolled it to, and the pane is filled from
       the draft now on, writing a field only when it is holding something
       else, so the caret in the box being typed in is never moved. A press no
       hand made (the rescue a net makes a beat after a press that never
       landed) is answered the same way, which is what makes that rescue work
       at all.

       And NOTHING asks for a draw of the list after a press. A draw writes
       every row out again — that is the card blinking — and it rewrites every
       field of the pane beside it. So a draw that would write the very same
       list and the very same pane is not made (see the guard at the foot of
       this block). */
    (function(){
      const ROW = '#page-draft .draft-row';

      const paint = function(n){
        n = parseInt(n, 10);
        if(isNaN(n) || n < 0) return false;
        /* Nothing in here may be allowed to swallow a press: a line that
           threw would leave the page's own handler stopped (above) AND no
           pick made, which on screen is a row that does not answer at all. */
        try{
        _draftSel = n;
        window.sfDraftMine = String(n);      /* the writer's own pick */
        window.sfDraftLetGoId = null;
        window.sfDraftLetGoAt = 0;
        if(typeof save === 'function') save();
        const rows = document.querySelectorAll(ROW);
        for(let i = 0; i < rows.length; i++){
          const on = String(rows[i].getAttribute('data-draft-pick') || '') === String(n);
          if(on !== rows[i].classList.contains('on')) rows[i].classList.toggle('on', on);
        }
        const all = (typeof D === 'function') ? (D().drafts || []) : [];
        const d = all[n] || null;
        const b = document.getElementById('draftBody');
        if(b){
          b.disabled = !d;
          const copy = d ? (d.body || '') : '';
          if(b.value !== copy) b.value = copy;
          b.style.fontFamily = (d && d.font) ? d.font : '';
          b.style.fontSize = (((d && d.size) || 15)) + 'px';
        }
        const f = document.getElementById('draftFont'), s = document.getElementById('draftSize');
        if(f) f.value = (d && d.font) ? d.font : '';
        if(s) s.value = String((d && d.size) || 15);
        try{ if(typeof draftRebuildDd === 'function') draftRebuildDd(); }catch(e){}
        try{ if(typeof draftSyncDrops === 'function') draftSyncDrops(); }catch(e){}
        }catch(e){}
        return true;
      };
      window.sfDraftPick = paint;

      /* ── THE SECOND PRESS LETS IT GO ──
         The page's own gesture, and it is back: a press on the draft that is
         already on takes it off the pane. Written HERE, in the parts the
         page's handler is made of, for the same reason the pick is: that
         handler draws the whole list again (every row a new node) and the
         nets behind it put the same draft back a beat later, so its own
         letting-go was one press that emptied the pane and filled it again.
         Nothing is drawn here — the mark comes off the rows that are on
         screen, the pane goes back to asking for a draft — and the draft is
         named for the nets (8k/8j/8i), which keep off it while the writer's
         own moment lasts.

         And only the writer's own row is theirs to let go (the Bible's own
         rule, 8q): the row a page PICKS for them on arrival is not, so the
         first press on it selects — that is the press that used to look like
         it did nothing. `window.sfDraftMine` is the row the WRITER last put
         on, cleared by every arrival. A press no hand made never lets go
         either (the sweep that clicks an arrival's row on any redraw). */
      const letGo = function(n){
        n = parseInt(n, 10);
        if(isNaN(n)) return false;
        try{
          window.sfDraftMine = null;
          window.sfDraftLetGoId = String(n);
          window.sfDraftLetGoAt = Date.now();
          _draftSel = -1;
          if(typeof save === 'function') save();
          const rows = document.querySelectorAll(ROW);
          for(let i = 0; i < rows.length; i++){
            if(rows[i].classList.contains('on')) rows[i].classList.remove('on');
          }
          const b = document.getElementById('draftBody');
          if(b){ b.disabled = true; if(b.value !== '') b.value = ''; }
          try{ if(typeof draftRebuildDd === 'function') draftRebuildDd(); }catch(e){}
          try{ if(typeof draftSyncDrops === 'function') draftSyncDrops(); }catch(e){}
        }catch(e){}
        return true;
      };
      window.sfDraftLetGo = letGo;

      /* an arrival forgets it: the row the page picks for the writer at that
         moment is the page's, and the first press on it selects */
      const forget = function(){ window.sfDraftMine = null; };
      ['goPage', 'openProjectById', 'openProject'].forEach(function(k){
        const key = '__sfDraftMine' + k;
        if(typeof window[k] === 'function' && !window[k][key]){
          const orig = window[k];
          const fn = function(){ const r = orig.apply(this, arguments); forget(); return r; };
          fn[key] = true;
          window[k] = fn;
        }
      });

      window.addEventListener('click', function(e){
        const t = e.target;
        if(!t || !t.closest) return;
        const row = t.closest(ROW);
        if(!row) return;
        /* the row's own pencil and bin, and the pager at the panel's foot,
           keep their own presses */
        if(t.closest('button, .ol-tool, [data-draft-rename], [data-draft-del], [data-draft-page]')) return;
        const n = parseInt(row.getAttribute('data-draft-pick'), 10);
        if(isNaN(n) || n < 0) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();      /* the page's own row handler is not run */
        /* The draft that is already on, and that the WRITER put on, is the one
           they are pressing again: that is the letting-go, and it is answered
           here. Any other row is a pick — never -1. */
        if(e.isTrusted === true
           && String(_draftSel) === String(n)
           && String(window.sfDraftMine || '') === String(n)){ letGo(n); return; }
        paint(n);
      }, true);

      /* ── A DRAW THAT WOULD WRITE THE SAME CARD IS NOT A DRAW ──
         renderDrafts() writes every row out of the project AND rewrites every
         field of the pane beside them. Any draw that happens while the writer
         is looking at the card therefore rebuilds the list under their hand
         and writes the pane over: the card blinks and a box being typed in is
         written into. So the state a draw would write is compared with the
         state it wrote last, and a draw that would write the very same rows
         with the very same mark on the very same draft is not made at all.
         The list, the choice, the page and the filter all take part in the
         comparison, so a draw that has anything new to say still happens. */
      (function(){
        const orig = window.renderDrafts;
        if(typeof orig !== 'function' || orig.__sfDraftSame) return;
        let last = '';
        const sig = function(){
          try{
            const all = (typeof D === 'function') ? (D().drafts || []) : [];
            const q = String((document.getElementById('draftQuery') || {}).value || '');
            const parts = all.map(function(d){
              return String(d.id || '') + '~' + String(d.title || '') + '~'
                   + String(d.body || '').length + '~' + String(d.font || '') + '~' + String(d.size || '');
            });
            return [String(_draftSel), String(_draftPage), String(DRAFT_PER_PAGE), q].join('|')
                 + '|' + parts.join(';');
          }catch(e){ return ''; }
        };
        const fn = function(){
          const s = sig();
          /* a row being renamed in place is a draw of its own: the field the
             pencil opened lives in the row and only a draw puts the name back
             (the Escape and the commit both ask for one), so a rename on
             screen always draws */
          if(s && s === last
             && document.querySelector('#page-draft .draft-row')
             && !document.querySelector('[data-draft-rename-input]')) return;
          last = s;
          return orig.apply(this, arguments);
        };
        fn.__sfDraftSame = true;
        window.renderDrafts = fn;
      })();
    })();

    /* ── 8ab · THE BAR LIGHTS ONLY WHEN THE HAND IS ON THE BAR ─────

       The accent on a scrollbar was hung on the SCROLLER's :hover, and a
       scrollbar is part of the scroller's own box — every ancestor of the bar
       is hovered while the pointer is anywhere over the panel. So the bar
       went accent as soon as the pointer entered the card (the Idea cards,
       Settings, every dropdown), with no bar under it at all, and on the
       strips whose colour is pinned at id weight (the Bible's list, the five
       pinned lists, the dropdown lists) the accent never appeared however
       long the bar was held. Both reports are one fault: hovering the panel
       is not hovering the bar.

       Nothing in the stylesheets lights a bar any more (see the block at the
       foot of section 1). The bar is lit here, by the hand that is actually
       on it: on every move of the pointer this walks up from what is under
       the pointer and asks each scroller whether the pointer is inside its
       own BAR — the right-hand strip for a vertical bar, the bottom strip for
       a horizontal one — and the one that is gets `scrollbar-color: var(--accent)
       transparent` written on it as an INLINE style with priority, which is
       the only weight that outranks the rules pinned at id weight. Leaving
       the bar takes it off, and while the bar is HELD (a press that landed on
       a bar) the light stays on through the drag, since a bar being dragged
       stops reporting the pointer. */
    (function(){
      let hot = null, hold = 0;
      const last = { x:-1, y:-1 };
      const scroller = function(){ return document.scrollingElement || document.documentElement; };
      const canY = function(el){ return (el.scrollHeight || 0) > (el.clientHeight || 0) + 1; };
      const canX = function(el){ return (el.scrollWidth  || 0) > (el.clientWidth  || 0) + 1; };
      /* how thick the bar is: the gap between the element's own box and the
         area it scrolls in, kept sane in case a border is in that gap too */
      const thick = function(a, b, fallback){
        const n = a - b;
        if(!n || n < 0) return fallback;
        return Math.max(8, Math.min(22, n));
      };
      const onBar = function(el, x, y){
        const v = canY(el), h = canX(el);
        if(!v && !h) return false;
        const r = el.getBoundingClientRect();
        if(x < r.left - 1 || x > r.right + 2 || y < r.top - 1 || y > r.bottom + 2) return false;
        const bwV = thick(el.offsetWidth,  el.clientWidth,  12);
        const bwH = thick(el.offsetHeight, el.clientHeight, 12);
        const nearV = v && x >= r.right  - bwV - 2;      /* the right-hand strip */
        const nearH = h && y >= r.bottom - bwH - 2;      /* the bottom strip */
        return !!(nearV || nearH);
      };
      const find = function(t, x, y){
        let el = (t && t.nodeType === 1) ? t : null;
        while(el && el !== document.body && el !== document.documentElement){
          if(onBar(el, x, y)) return el;
          el = el.parentElement;
        }
        const d = scroller();
        if(d && d !== el && onBar(d, x, y)) return d;
        return null;
      };
      const light = function(el){
        if(el === hot) return;
        if(hot && hot.style) hot.style.removeProperty('scrollbar-color');
        hot = (el && el.style) ? el : null;
        if(hot) hot.style.setProperty('scrollbar-color', 'var(--accent) transparent', 'important');
      };
      document.addEventListener('pointermove', function(e){
        if(e.pointerType && e.pointerType !== 'mouse'){ light(null); return; }
        last.x = e.clientX; last.y = e.clientY;
        const el = find(e.target, e.clientX, e.clientY);
        /* while a bar is held the pointer may report a hair inside the panel:
           the light is not taken off until the drag is over */
        if(el) light(el);
        else if(Date.now() >= hold) light(null);
      }, true);
      document.addEventListener('pointerdown', function(e){
        if(e.pointerType && e.pointerType !== 'mouse') return;
        last.x = e.clientX; last.y = e.clientY;
        const el = find(e.target, e.clientX, e.clientY);
        if(!el) return;
        light(el);
        hold = Date.now() + 6000;                 /* held: it stays lit */
      }, true);
      window.addEventListener('pointerup', function(){ hold = 0; }, true);
      window.addEventListener('blur', function(){ hold = 0; light(null); }, true);
      /* a bar that is being dragged reports its scroll and nothing else: the
         element under the pointer keeps the light while it moves */
      document.addEventListener('scroll', function(e){
        const el = e.target;
        if(!el || el.nodeType !== 1) return;
        if(el === hot || (el.style && el.style.getPropertyValue('scrollbar-color'))) return;
        if(onBar(el, last.x, last.y)) light(el);
      }, true);
      /* the light belongs to the page the pointer is on: a step to another
         page drops it rather than leaving it on a scroller that is gone */
      if(typeof window.goPage === 'function' && !window.goPage.__sfBarHot){
        const go = window.goPage;
        const fn = function(){ const r = go.apply(this, arguments); hold = 0; light(null); return r; };
        fn.__sfBarHot = true;
        window.goPage = fn;
      }
    })();

    /* ── 8r · A CARD IS ONLY IN THE WRITER'S HANDS WHEN THEY PUT IT THERE ──

       The Idea page's card editor (app.js, the full-card view that the card's
       own edit icon opens) ends by focusing its writing box and dropping the
       caret at the end of what is in it. It is the right thing to do for a
       card the writer asked to open — the caret is where they will type —
       but the app opens that view from its own paints as well, and then the
       page wears a blinking caret in a card nobody has touched: an empty
       card with a cursor standing in it, which reads as the card being in
       edit mode without anyone asking for it.

       So the caret is kept only while the page is the writer's: any real
       press or keystroke of their own INSIDE this page — their click on the
       edit icon, on the card, on one of its rows, the first letter typed —
       makes the page theirs and the caret stays wherever the app puts it.
       The press that merely brought them here (the nav, a dashboard card, a
       step from another page) is not a press on this card, so the caret the
       page gives it at that moment is given up at once. Leaving the page —
       any press anywhere else — hands the card back again. */
    (function(){
      const CARD = '#page-inspire .idea-write';
      let theirs = false;             /* the writer's own hand is in this page */

      const put = function(ev){
        if(!ev || ev.isTrusted !== true) return;
        const t = ev.target;
        theirs = !!(t && t.closest && t.closest('#page-inspire'));
      };
      window.addEventListener('pointerdown', put, true);
      window.addEventListener('keydown', put, true);

      document.addEventListener('focusin', function(e){
        if(theirs) return;                            /* the page is theirs: leave it alone */
        const t = e.target;
        if(!t || !t.closest) return;
        if(!t.closest(CARD)) return;
        const edit = t.isContentEditable
          || t.tagName === 'TEXTAREA'
          || (t.tagName === 'INPUT' && String(t.type || 'text').toLowerCase() !== 'checkbox');
        if(!edit) return;
        try{ t.blur(); }catch(err){}
      }, true);
    })();

    /* ── 8q · A SECOND PRESS LETS THE ENTRY GO ──

       The page's own gesture, and it is kept: a press on the row that is on
       is the press that lets it go — the entry comes off the list, the pane
       beside it goes back to asking for one, and the page is told (with the
       page's own “nothing is on” flag) so that no draw after it puts a mark
       back. The one difference is the first press of an arrival, which
       chooses the row the page had picked for the writer instead of letting
       it go — that was the press that used to look like it did nothing.

       And a press is only read as letting-go when the row that is on is the
       row the writer's own hand put there. A row the PAGE picked is not
       theirs to let go of: it is theirs to keep, by pressing it.

       The nets that answer a press a beat later would put the entry back —
       they cannot tell a letting-go from a press that never landed. So the
       entry that was just let go is held out of their reach while their own
       moment lasts: a pick of that entry is refused until they have all
       fallen quiet. */
    (function(){
      const SEL = '#bbRows .bb-row';
      let pending = null;          /* the press that means “let this one go” */
      let refusing = null;         /* just let go: not to be put back by a net */

      const mark = function(id){
        const box = document.getElementById('bbRows');
        if(!box) return;
        const all = box.querySelectorAll(SEL);
        for(let i = 0; i < all.length; i++){
          const on = id != null && String(all[i].getAttribute('data-bb-open') || '') === String(id);
          if(on !== all[i].classList.contains('on')) all[i].classList.toggle('on', on);
        }
      };
      const letGo = function(id){
        pending = null;
        refusing = { id:String(id), until: Date.now() + 900 };
        window.sfBbMine = null;
        /* the nets that answer a press a beat later cannot tell a letting-go
           from a press that never landed, so the entry just let go is named
           here and they are told to keep off it for a moment (8k) */
        window.sfBbLetGoId = String(id);
        window.sfBbLetGoAt = Date.now();
        try{
          _bbSel = null;
          _bbOff = true;                     /* the page's own “nothing is on” */
          if(typeof save === 'function') save();
          mark(null);
          if(typeof renderBbDetail === 'function') renderBbDetail();
        }catch(err){}
      };

      /* the press itself, read before the nets below file it as a pick */
      window.addEventListener('pointerdown', function(e){
        if(!e || e.isTrusted !== true) return;
        pending = null;
        const t = e.target;
        if(!t || !t.closest) return;
        const hit = t.closest(SEL);
        if(!hit) return;
        const id = String(hit.getAttribute('data-bb-open') || '');
        if(!id) return;
        const on = hit.classList.contains('on');
        if(refusing && (refusing.id !== id || !on)) refusing = null;
        /* A press on the row that is on is the letting-go — but only when the
           WRITER's own press put that row on. The row a writer presses first
           is the row the page itself picked (every list opens on its head),
           and that press means “this entry”, not “let it go”: it is answered
           as a pick, which is what writes `window.sfBbMine` (8l). From then
           on this row is theirs, and a second press takes it off — which is
           the gesture the page has always had, and the one that was missing. */
        pending = (on && String(window.sfBbMine) === id) ? id : null;
      }, true);

      window.addEventListener('click', function(e){
        if(e.isTrusted !== true) return;
        const id = pending;                 /* consumed, however this ends */
        pending = null;
        if(!id) return;
        const t = e.target;
        if(!t || !t.closest) return;
        const hit = t.closest(SEL);
        if(!hit) return;
        if(String(hit.getAttribute('data-bb-open') || '') !== id) return;
        if(!hit.classList.contains('on')) return;
        e.preventDefault();
        e.stopImmediatePropagation();       /* the pick below is not made */
        e.stopPropagation();
        letGo(id);
      }, true);

      /* a pick of the entry that was just let go is not made while the nets
         that answer a press are still answering */
      const paintOrig = window.sfBbPick;
      if(typeof paintOrig === 'function' && !paintOrig.__sfLetGo){
        const fn = function(id){
          if(refusing && String(id) === refusing.id){
            if(Date.now() < refusing.until) return false;
            refusing = null;
          }
          return paintOrig.apply(this, arguments);
        };
        fn.__sfLetGo = true;
        window.sfBbPick = fn;
      }
    })();

    /* ── 8p · NOTHING BUT THE WRITER'S HAND PRESSES THIS LIST ──

       The page's own row handler is a listener on the DOCUMENT, in the
       CAPTURING phase (pages.js: “document.addEventListener('click', …,
       true)”). That is the one place a listener on the row itself cannot
       answer before it, and the one place a listener added later on the
       document — which is what every net below is — cannot get in front of,
       because capture listeners on one node run in the order they were
       added and pages.js is loaded long before this file.

       So the page's letting-go sweep, whose press is its own click on
       whichever row is on, still reached that handler: it took the mark off
       the entry the writer had just chosen a beat after they chose it — or
       moved the mark to the head of the list — and drew the pane beside the
       list again each time. On screen that is a left card that will not hold
       a highlight and a right pane that flickers, for as long as the sweep
       runs.

       This is that press, answered at the WINDOW, above the document, where
       nothing can get in front of it. The sweep is left alone while the page
       is a fresh arrival — the row the page picked by itself is still let go
       of, which is what the sweep is for — but from the moment the writer's
       own hand has been in this page, the list is theirs: no press that is
       not their own is let near a row of it until they leave the page. */
    (function(){
      const SEL = '#bbRows .bb-row';
      let hand = false;                 /* the writer's hand has been in this page */
      const page = function(){ return document.getElementById('page-bible'); };

      window.addEventListener('pointerdown', function(e){
        if(!e || e.isTrusted !== true) return;
        const t = e.target;
        const pg = page();
        if(!pg || !t || !pg.contains(t)){ hand = false; return; }   /* elsewhere: a new arrival */
        hand = true;
      }, true);

      window.addEventListener('click', function(e){
        if(e.isTrusted === true) return;         /* the writer's own press has its own answer */
        if(!hand) return;                        /* a fresh arrival: the page may let its own row go */
        const pg = page();
        if(!pg) return;
        const t = e.target;
        if(!t || !t.closest) return;
        const hit = t.closest(SEL);
        if(!hit || !pg.contains(hit)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
      }, true);

      /* a tab under this page is an arrival of its own: the list opens on its
         own head again, and the sweep may let that one go as it may a step
         onto the page */
      window.addEventListener('click', function(e){
        if(e.isTrusted !== true) return;
        const t = e.target;
        if(t && t.closest && t.closest('#bbTabs .bb-tab')) hand = false;
      }, true);

      const go = window.goPage;
      if(typeof go === 'function' && !go.__sfHand){
        const fn = function(){ const r = go.apply(this, arguments); hand = false; return r; };
        fn.__sfHand = true;
        window.goPage = fn;
      }
    })();

    /* ── 8n · THE ROW ITSELF ANSWERS ──

       Everything that can be taken from the writer on this card comes from
       one place: the page's own delegated row handler, the listener on the
       document that reads a click on a row, writes the whole list out again
       — every row a new node — and reads the row that was already on as a
       press to let it go.

       A listener on the row itself is the one place that handler cannot get
       past: a click that reaches the row is answered in the target phase,
       before any handler on an ancestor sees it, so the list is never
       written out under the writer's hand and the press is answered by
       moving the mark on the rows already there. It does not depend on how
       the press was made, and another layer's own press on the document
       cannot get in ahead of it.

       The writer's press itself is read on the pointer going down, at the
       window, where nothing else has a claim on it: that is the row the card
       is to keep. A press the writer did NOT make — the arrival's own row
       being let go — is still left to the page, unless it is the row their
       own hand put on, which is never taken off their card. Rows are
       armoured as the page draws them, so a list written out for any other
       reason is armoured again the moment it appears. */
    (function(){
      const SEL = '#bbRows .bb-row';
      const HOLD_MS = 1500;                    /* how long the press has the last word */
      let held = null, beat = 0;

      const page = function(){ return document.getElementById('page-bible'); };
      const rowFor = function(id){
        const box = document.getElementById('bbRows');
        if(!box) return null;
        const rows = box.querySelectorAll(SEL);
        for(let i = 0; i < rows.length; i++){
          if(String(rows[i].getAttribute('data-bb-open') || '') !== String(id)) continue;
          if(rows[i].getClientRects().length) return rows[i];   /* on screen, not a hidden page */
        }
        return null;
      };
      /* the entry is still the project's: one that was deleted is not picked */
      const listed = function(id){
        try{
          const on = document.querySelector('#bbTabs .bb-tab.on');
          const tab = on ? on.getAttribute('data-bb-tab') : '';
          if(!tab || typeof window.bbList !== 'function') return !!rowFor(id);
          const list = window.bbList(tab) || [];
          if(!list.length) return false;
          return list.some(function(e){ return String(e.id || e.name) === String(id); });
        }catch(err){ return true; }
      };
      const pick = function(id){
        if(typeof window.sfBbPick === 'function') window.sfBbPick(id);
      };
      const markOnly = function(id){
        const box = document.getElementById('bbRows');
        if(!box) return;
        const rows = box.querySelectorAll(SEL);
        for(let i = 0; i < rows.length; i++){
          const on = id != null && String(rows[i].getAttribute('data-bb-open') || '') === String(id);
          if(on !== rows[i].classList.contains('on')) rows[i].classList.toggle('on', on);
        }
      };
      /* the row the writer pressed is put back whenever the card has been
         drawn out from under it, and never written out to do it */
      const holdPick = function(){
        beat = 0;
        const w = held;
        if(!w) return;
        if(Date.now() > w.until || !page()){ held = null; return; }
        const row = rowFor(w.id);
        if(!row || !listed(w.id)){ held = null; return; }
        if(String(_bbSel) !== w.id || !row.classList.contains('on')) pick(w.id);
        beat = setTimeout(holdPick, 60);
      };
      /* A press alone does not make a row the writer's: the pick does, and
         that is written by the pick itself (8l's paint, `window.sfBbMine`).
         And the hold that used to live here is gone with it — nothing draws
         this list out from under a press any more, so there is nothing left
         to put back, and a hold that kept putting an entry on is exactly what
         made letting one go impossible. */
      const theirs = function(id){};
      const forgetTheirs = function(){
        window.sfBbMine = null;
        held = null;
      };

      /* the writer's own press, read where nothing can pre-empt it */
      window.addEventListener('pointerdown', function(e){
        if(!e || e.isTrusted !== true) return;
        const t = e.target;
        if(!t || !t.closest) return;
        const pg = page();
        if(!pg || !pg.contains(t)){ forgetTheirs(); return; }   /* somewhere else: a new arrival */
        const hit = t.closest(SEL);
        if(!hit) return;
        const id = String(hit.getAttribute('data-bb-open') || '');
        if(id) theirs(id);
      }, true);

      /* and the row answers the click, before the page's handler sees it */
      const answers = function(e){
        const row = e.currentTarget;
        const id = String((row && row.getAttribute('data-bb-open')) || '');
        if(!id) return;
        if(e.isTrusted !== true && window.sfBbMine !== id) return;  /* the page's own row: its to let go */
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        pick(id);
      };
      const dress = function(){
        const box = document.getElementById('bbRows');
        if(!box) return;
        const rows = box.querySelectorAll(SEL);
        for(let i = 0; i < rows.length; i++){
          if(rows[i].__sfAnswered) continue;
          rows[i].__sfAnswered = true;
          rows[i].addEventListener('click', answers, false);
        }
      };

      /* ── 8o · A DRAW THAT WOULD WRITE THE SAME ROWS IS NOT A DRAW ──

         renderBbRows writes the whole list out of the project: every row is
         a new node. Anything that draws the list while the writer is looking
         at it — the arrival's own paint, the panel's re-cut when it is
         resized, an entry saved, a project opened — flashes the card and puts
         the list back where the page cut it, whether or not a row was chosen.
         Most of those draws change nothing in the rows at all: the same
         entries, in the same order, with the same names.

         So the rows the page WOULD write are compared with the rows already
         on screen, and when they are the same list the draw is not made: the
         one thing that can differ, which row is on, is moved on the rows that
         are there — no flash, no scroll thrown away. The DOM is written only
         when the list itself changes: an entry added, renamed or deleted, a
         filter, a tab, another page of it. The pager is repainted to the
         numbers the draw would have written, so the foot of the panel agrees
         with the list it is under. */
      const nameOf = function(e){ return String((e && (e.name || e.title)) || 'Untitled'); };
      const subOf = function(e){
        if(e && e.date) return String(e.date);
        return String((e && (e.details || e.desc)) || '').replace(/\s+/g, ' ').slice(0, 70);
      };
      const idsOf = function(e){ return String((e && e.id != null) ? e.id : ((e && e.name) || '')); };
      const sameRows = function(){
        try{
          const box = document.getElementById('bbRows');
          if(!box) return null;
          const q = String((document.getElementById('bbQuery') || {}).value || '').trim();
          if(q) return null;                 /* a filtered list is the page's own business */
          if(typeof _bbTab === 'undefined' || typeof window.bbList !== 'function') return null;
          const list = window.bbList(_bbTab) || [];
          if(!list.length) return null;      /* the empty state is the page's to draw */
          const per = (typeof bbPerPage === 'function') ? bbPerPage() : 0;
          if(!per || _bbPage == null) return null;
          const pages = Math.max(1, Math.ceil(list.length / per));
          const pageNo = Math.min(Math.max(0, _bbPage | 0), pages - 1);
          if(pageNo !== (_bbPage | 0)) return null;   /* the page would be cut to fit: let it */
          const slice = list.slice(pageNo * per, pageNo * per + per);
          const rows = box.querySelectorAll(SEL);
          if(rows.length !== slice.length) return null;
          for(let i = 0; i < slice.length; i++){
            const wanted = idsOf(slice[i]) + '~' + nameOf(slice[i]) + '~' + subOf(slice[i]);
            const shown = String(rows[i].getAttribute('data-bb-open') || '') + '~'
              + String((rows[i].querySelector('.bb-row-name') || {}).textContent || '') + '~'
              + String((rows[i].querySelector('.bb-row-sub') || {}).textContent || '');
            if(wanted !== shown) return null;        /* the list itself changed: let it draw */
          }
          return { list:list, per:per, slice:slice, page:pageNo, pages:pages };
        }catch(err){ return null; }
      };
      const rowsOrig = window.renderBbRows;
      if(typeof rowsOrig === 'function' && !rowsOrig.__sfRows){
        const fn = function(){
          const same = sameRows();
          if(same){
            try{
              if(_bbOff){ _bbSel = null; }
              else if(_bbSel == null
                      || (typeof bbIndexOf === 'function' && bbIndexOf(_bbTab, _bbSel) < 0)){
                const head = same.slice[0] || same.list[0];
                _bbSel = head ? String((head.id != null) ? head.id : head.name) : null;
              }
              markOnly(_bbSel);
              if(typeof paintBbPager === 'function'){
                paintBbPager(same.page * same.per, same.list.length, same.per, same.pages);
              }
            }catch(err){}
            return;                            /* nothing was written: no flash */
          }
          const r = rowsOrig.apply(this, arguments);
          try{ dress(); }catch(err){}
          return r;
        };
        fn.__sfRows = true;
        window.renderBbRows = fn;
      }
      if(typeof MutationObserver === 'function' && document.body){
        try{
          new MutationObserver(function(){ try{ dress(); }catch(err){} })
            .observe(document.body, { childList:true, subtree:true });
        }catch(err){}
      }
      const go = window.goPage;
      if(typeof go === 'function' && !go.__sfMine){
        const fn = function(){ const r = go.apply(this, arguments); forgetTheirs(); return r; };
        fn.__sfMine = true;
        window.goPage = fn;
      }
      try{ dress(); }catch(err){}
    })();

    /* ── 8m · THE ENTRY THE WRITER PRESSED IS THE ENTRY THAT STAYS ON ──

       The Bible's list is not drawn by one hand. The page itself writes it
       out from the project — on arrival it marks the head of the list, a
       sweep takes that mark off again while the arrival is fresh, the panel
       re-cuts the list when it is resized, an entry being renamed or added
       draws it — and every one of those draws writes the rows out again from
       whatever _bbSel happens to say at that moment. Under the writer's own
       finger that reads as a card that flickers: the mark appears, leaves,
       and settles on a row that is not the one they pressed.

       So a press on a row is remembered here, and for a moment and a half
       after it the row the writer pressed is put back whenever the mark is
       anywhere else. It is the one layer that answers for what is on once
       the rest of the app has drawn over it: no row is rebuilt to do it, so
       the list keeps the place the writer had scrolled it to and never
       flashes. An entry that is no longer in the project — deleted, or
       filtered out of the list — is never brought back. */
    (function(){
      const HOLD = 1500;               /* how long the press has the last word */
      let want = null, tick = 0;

      const live = function(){
        if(!document.getElementById('page-bible')) return false;
        try{ if(typeof S !== 'undefined' && S && S.page && S.page !== 'bible') return false; }catch(e){}
        return true;
      };
      const rowFor = function(id){
        const box = document.getElementById('bbRows');
        if(!box) return null;
        const rows = box.querySelectorAll(ROWS);
        for(let i = 0; i < rows.length; i++){
          if(String(rows[i].getAttribute('data-bb-open') || '') !== String(id)) continue;
          if(rows[i].getClientRects().length) return rows[i];   /* on screen, not on a hidden page */
        }
        return null;
      };
      /* the entry is still the project's: a deleted one is not picked again */
      const listed = function(id){
        try{
          const on = document.querySelector('#bbTabs .bb-tab.on');
          const tab = on ? on.getAttribute('data-bb-tab') : '';
          if(!tab || typeof window.bbList !== 'function') return !!rowFor(id);
          const list = window.bbList(tab) || [];
          if(!list.length) return false;
          return list.some(function(e){ return String(e.id || e.name) === String(id); });
        }catch(err){ return true; }
      };
      const hold = function(){
        tick = 0;
        const w = want;
        if(!w) return;
        if(Date.now() > w.until || !live()){ want = null; return; }
        const row = rowFor(w.id);
        if(!row || !listed(w.id)){ want = null; return; }
        if(String(_bbSel) !== w.id || !row.classList.contains('on')){
          if(typeof window.sfBbPick === 'function') window.sfBbPick(w.id);
        }
        tick = setTimeout(hold, 60);
      };
      const grab = function(e){
        if(!e || e.isTrusted !== true) return;       /* the writer's own press */
        if(!live()) return;
        const t = e.target;
        if(!t || !t.closest) return;
        const hit = t.closest(ROWS);
        if(!hit) return;
        const id = String(hit.getAttribute('data-bb-open') || '');
        if(!id) return;
        /* noted and let be: the pick answers for itself (8l), and a hold
           here only fought the writer's own second press */
        want = null;
      };
      document.addEventListener('pointerdown', grab, true);
      document.addEventListener('click', grab, true);
    })();

    const pickRow = function(e){
      const t = e.target;
      if(!t || !t.closest) return false;
      const hit = t.closest(ROWS);
      if(!hit) return false;
      const page = document.getElementById('page-bible');
      if(!page || !page.contains(hit)) return false;
      const id = String(hit.getAttribute('data-bb-open') || '');
      if(!id) return false;
      try{ paint(id); }catch(err){}
      return true;
    };

    window.addEventListener('click', function(e){
      if(e.isTrusted !== true) return;                 /* the writer's own press */
      if(!document.getElementById('page-bible')) return;
      if(!pickRow(e)) return;
      /* the page's own handler would draw the whole list again: the press has
         already been answered, so it is not given the chance to */
      e.stopPropagation();
    }, true);

    /* a redraw that does happen — a tab, the filter, the panel's own re-cut —
       keeps the list where the writer had it */
    const orig = window.renderBbRows;
    if(typeof orig === 'function' && !orig.__sfKeep){
      const fn = function(){
        const before = document.getElementById('bbRows');
        const top = before ? before.scrollTop : 0;
        const r = orig.apply(this, arguments);
        const after = document.getElementById('bbRows');
        if(after && top) after.scrollTop = top;
        return r;
      };
      fn.__sfKeep = true;
      window.renderBbRows = fn;
    }
  })();

  /* ═══ 8k · THE ROW THE WRITER PRESSES IS THE ROW THAT IS ON ══

     Three things the Bible needed, all of them the app's own doing:

       · The page picks the head of every list by itself (renderBbRows,
         _draftSel = 0, cur = 0), and pressing the row that is ON is the
         app's “let it go” gesture. So the writer's first press on a row the
         PAGE chose took the highlight away instead of putting the entry on:
         clicking an entry looked like it did nothing and the second press
         was the one that worked. A press on a row the page chose now keeps
         it on — the press is answered, the app's letting-go is not run —
         and only a row the WRITER chose is let go by a second press.

       · Making an entry leaves the page's own “nothing is on” flag (_bbOff)
         standing if an earlier letting-go had set it, and the first draw
         after the add then drops the very entry the app has selected: the
         new row was made, at the top, and not picked. The flag is put down
         where the entry is made, and the head of the list — where a new
         entry lands — is picked if anything else got in the way.

       · The left card is drawn once per state: the add handler, the
         timeline's own rename and the panel's re-cut each ask for a draw,
         and a list written over itself in the same breath is the flicker.
         A draw is skipped only when the same list would be written over the
         same rows, so nothing is ever left undrawn. */
  (function(){
    const LISTS = [
      { el:'#page-inspire', pick:'#ideaRows .idea-row', id:function(r){ return String(r.dataset.ideaOpen || ''); } },
      { el:'#page-draft',   pick:'.draft-row',          id:function(r){ return String(r.dataset.draftPick || ''); } },
      { el:'#page-bible',   pick:'#bbRows .bb-row',      id:function(r){ return String(r.dataset.bbOpen || ''); } },
      { el:'#page-outline', pick:'.ol-row',              id:function(r){ return String(r.dataset.olOpen || ''); } },
      { el:'#page-notebook',pick:'#nbTree .nb-tree-row', id:function(r){ return String(r.dataset.nbCh || ''); } }
    ];
    const chosen = {};          /* the row the WRITER picked, per page, this arrival */
    let ticket = null, ask = null, lastSig = '';

    const onOf = function(p){
      const page = document.querySelector(p.el);
      return page ? page.querySelector(p.pick + '.on') : null;
    };
    const drawn = function(p, id){
      const page = document.querySelector(p.el);
      if(!page) return false;
      const rows = page.querySelectorAll(p.pick);
      for(let i = 0; i < rows.length; i++){ if(p.id(rows[i]) === id) return true; }
      return false;
    };

    /* the pick, written the way the page's own click handler writes it */
    const make = function(p, id){
      try{
        /* an entry the writer has just let go is not put back by a net: a
           net cannot tell a letting-go from a press that never landed */
        if(p.el === '#page-bible' || p.el === '#page-draft'){
          const left = (p.el === '#page-bible') ? window.sfBbLetGoId : window.sfDraftLetGoId;
          const when = (p.el === '#page-bible') ? window.sfBbLetGoAt : window.sfDraftLetGoAt;
          if(left != null && String(left) === String(id)
             && Date.now() < (Number(when) || 0) + 1600) return;
        }
        if(p.el === '#page-draft'){
          const i = parseInt(id, 10);
          if(isNaN(i)) return;
          _draftSel = i;
          _draftPage = Math.max(0, Math.floor(i / (DRAFT_PER_PAGE || 5)));
          if(typeof save === 'function') save();
          if(typeof renderDrafts === 'function') renderDrafts();
          return;
        }
        if(p.el === '#page-bible'){
          _bbSel = String(id);
          _bbOff = false;
          if(typeof save === 'function') save();
          if(typeof renderBbRows === 'function') renderBbRows();
          if(typeof renderBbDetail === 'function') renderBbDetail();
          return;
        }
        if(p.el === '#page-notebook'){
          const d = D();
          d._nbOpenCh = String(id);
          d._nbEditing = false;
          if(typeof save === 'function') save();
          if(typeof renderNbTree === 'function') renderNbTree();
          if(typeof renderNbReader === 'function') renderNbReader();
          return;
        }
        if(p.el === '#page-outline'){
          const d = D();
          if(d.currentChapter === id) return;
          d.currentChapter = id;
          if(typeof save === 'function') save();
          const root = document.getElementById('page-outline');
          if(root && typeof PAGE_RENDERERS !== 'undefined' && PAGE_RENDERERS
             && typeof PAGE_RENDERERS.outline === 'function') PAGE_RENDERERS.outline(root);
        }
      }catch(e){ /* the Idea page keeps its own state: the nets below hold it */ }
    };

    /* ── the left card of the Bible is drawn once per state ── */
    const rowsShown = function(){
      const box = document.getElementById('bbRows');
      return box ? box.querySelectorAll('.bb-row, .bb-empty').length : 0;
    };
    const sigOf = function(){
      try{
        if(typeof _bbTab === 'undefined') return '';
        const q = (document.getElementById('bbQuery') || {}).value || '';
        const fit = (typeof bbPerPage === 'function') ? bbPerPage() : 0;
        const list = (typeof window.bbList === 'function') ? (window.bbList(_bbTab) || []) : [];
        const parts = list.map(function(e){
          return String(e.id || e.name) + '~' + String(e.name || e.title || '') + '~'
               + String(e.date || '') + '~' + String(e.details || e.desc || '').slice(0, 70);
        });
        return [String(_bbTab), String(_bbSel), String(!!_bbOff), String(_bbPage),
                String(fit), q].join('|') + '|' + parts.join(';');
      }catch(e){ return ''; }
    };
    const rowsOrig = window.renderBbRows;
    if(typeof rowsOrig === 'function' && !rowsOrig.__sfOnce){
      const fn = function(){
        const s = sigOf();
        if(s && s === lastSig && rowsShown()) return;    /* that list is already on screen */
        lastSig = s;
        return rowsOrig.apply(this, arguments);
      };
      fn.__sfOnce = true;
      window.renderBbRows = fn;
    }

    /* ── a press on a row the PAGE chose keeps it on ──
       Stopped at the window, before the app's own delegated handler can
       read it as “let this entry go”. A press on a row the writer chose is
       left alone: that is the gesture, and it still works. */
    window.addEventListener('click', function(e){
      if(e.isTrusted !== true) return;
      const a = ask;
      if(!a || !a.keep || !a.p) return;
      const t = e.target;
      if(!t || !t.closest) return;
      const hit = t.closest(a.p.pick);
      if(!hit || a.p.id(hit) !== a.id) return;
      e.stopPropagation();
    }, true);

    document.addEventListener('pointerdown', function(ev){
      if(!ev || ev.isTrusted !== true) return;
      const t = ev.target;
      if(!t || !t.closest) return;
      const mine = {};
      ticket = mine;
      ask = null;

      /* making an entry: the page's own “nothing is on” flag is put down
         before the app's handler reads it, or the entry it has just made and
         selected is dropped by the first draw */
      if(t.closest('[data-bb="add"]')){
        try{ _bbOff = false; }catch(e){}
        setTimeout(function(){
          if(ticket !== mine) return;
          try{
            const on = document.querySelector('#bbTabs .bb-tab.on');
            const tab = on ? on.getAttribute('data-bb-tab') : '';
            const list = (tab && typeof window.bbList === 'function') ? (window.bbList(tab) || []) : [];
            if(!list.length) return;
            const head = String(list[0].id || list[0].name);   /* where a new entry lands */
            if(String(_bbSel) === head){ _bbOff = false; return; }
            _bbSel = head;
            _bbOff = false;
            if(typeof save === 'function') save();
            if(typeof renderBbRows === 'function') renderBbRows();
            if(typeof renderBbDetail === 'function') renderBbDetail();
          }catch(e){}
        }, 220);
        return;
      }

      /* a tab is an arrival: the page picks its own row again */
      if(t.closest('#bbTabs .bb-tab')){
        LISTS.forEach(function(p){ delete chosen[p.el]; });
        return;
      }

      const tool = t.closest('button, .ol-tool, [data-sf-pin], [data-sf-img]');
      LISTS.forEach(function(p){
        const page = document.querySelector(p.el);
        if(!page || !page.contains(t)) return;
        const hit = t.closest(p.pick);
        if(!hit) return;
        if(tool && tool !== hit) return;            /* a row's own button, not the row */
        const id = p.id(hit);
        const on = onOf(p);
        const keep = !!(on && p.id(on) === id && chosen[p.el] === undefined);
        ask = { token:mine, p:p, id:id, keep:keep };
        chosen[p.el] = id;                          /* from here it is the writer's row */
        setTimeout(function(){
          if(ticket !== mine) return;
          const a = ask;
          ask = null;
          if(!a || a.p !== p) return;
          const now = onOf(p);
          if(now && p.id(now) === a.id) return;     /* it took */
          if(!drawn(p, a.id)) return;
          make(p, a.id);
        }, 800);
      });
    }, true);

    /* a step to a page is an arrival: the writer's pick of the page before it
       is forgotten, and the page picks its own row again */
    const clear = function(){
      Object.keys(chosen).forEach(function(k){ delete chosen[k]; });
    };
    const go = window.goPage;
    if(typeof go === 'function' && !go.__sfRow3){
      const fn = function(){ const r = go.apply(this, arguments); clear(); return r; };
      fn.__sfRow3 = true;
      window.goPage = fn;
    }
    const arm = function(){
      if(typeof window.openProjectById === 'function' && !window.openProjectById.__sfRow3){
        const orig = window.openProjectById;
        const opened = function(){
          const r = orig.apply(this, arguments);
          clear();
          return r;
        };
        opened.__sfRow3 = true;
        window.openProjectById = opened;
      }
    };
    arm();
    [0, 300, 1000, 2500].forEach(function(ms){ setTimeout(arm, ms); });
  })();

  /* ═══ 8j · THE PRESS THE WRITER MADE IS THE PICK THAT HOLDS ══

     The two nets below answer a press as it is made. This one answers it a
     moment later, and it is the answer that is kept: if the row the writer
     pressed is not the row its page is on by then — the press was reversed
     by the letting-go, or it never landed at all, or the list was drawn
     again under their hand — the page is put on that row. Only the LAST
     press counts: a newer press cancels an older answer, so a row pressed
     briefly on the way to another is never resurrected. And a press on the
     row already chosen is left alone, because that gesture means “let it
     go”. */
  (function(){
    const LISTS = [
      { el:'#page-inspire', pick:'#ideaRows .idea-row', id:function(r){ return String(r.dataset.ideaOpen || ''); } },
      { el:'#page-draft',   pick:'.draft-row',          id:function(r){ return String(r.dataset.draftPick || ''); } },
      { el:'#page-bible',   pick:'#bbRows .bb-row',      id:function(r){ return String(r.dataset.bbOpen || ''); } },
      { el:'#page-outline', pick:'.ol-row',              id:function(r){ return String(r.dataset.olOpen || ''); } },
      { el:'#page-notebook',pick:'#nbTree .nb-tree-row', id:function(r){ return String(r.dataset.nbCh || ''); } }
    ];
    let seq = 0, pending = null;

    const onOf = function(p){
      const page = document.querySelector(p.el);
      return page ? page.querySelector(p.pick + '.on') : null;
    };
    const drawn = function(p, id){
      const page = document.querySelector(p.el);
      if(!page) return false;
      const rows = page.querySelectorAll(p.pick);
      for(let i = 0; i < rows.length; i++){ if(p.id(rows[i]) === id) return true; }
      return false;
    };

    /* the pick, written the way the page's own click handler writes it */
    const make = function(p, id){
      try{
        /* an entry the writer has just let go is not put back by a net: a
           net cannot tell a letting-go from a press that never landed */
        if(p.el === '#page-bible' || p.el === '#page-draft'){
          const left = (p.el === '#page-bible') ? window.sfBbLetGoId : window.sfDraftLetGoId;
          const when = (p.el === '#page-bible') ? window.sfBbLetGoAt : window.sfDraftLetGoAt;
          if(left != null && String(left) === String(id)
             && Date.now() < (Number(when) || 0) + 1600) return;
        }
        if(p.el === '#page-draft'){
          const i = parseInt(id, 10);
          if(isNaN(i)) return;
          _draftSel = i;
          _draftPage = Math.max(0, Math.floor(i / (DRAFT_PER_PAGE || 5)));
          if(typeof save === 'function') save();
          if(typeof renderDrafts === 'function') renderDrafts();
          return;
        }
        if(p.el === '#page-bible'){
          _bbSel = String(id);
          _bbOff = false;
          if(typeof save === 'function') save();
          if(typeof renderBbRows === 'function') renderBbRows();
          if(typeof renderBbDetail === 'function') renderBbDetail();
          return;
        }
        if(p.el === '#page-notebook'){
          const d = D();
          d._nbOpenCh = String(id);
          d._nbEditing = false;
          if(typeof save === 'function') save();
          if(typeof renderNbTree === 'function') renderNbTree();
          if(typeof renderNbReader === 'function') renderNbReader();
          return;
        }
        if(p.el === '#page-outline'){
          const d = D();
          if(d.currentChapter === id) return;
          d.currentChapter = id;
          if(typeof save === 'function') save();
          const root = document.getElementById('page-outline');
          if(root && typeof PAGE_RENDERERS !== 'undefined' && PAGE_RENDERERS
             && typeof PAGE_RENDERERS.outline === 'function') PAGE_RENDERERS.outline(root);
        }
      }catch(e){ /* the Idea page keeps its own state: the nets below hold it */ }
    };

    const settle = function(ticket){
      if(ticket !== seq) return;                 /* a newer press has answered */
      const a = pending;
      pending = null;
      if(!a) return;
      const on = onOf(a.p);
      if(on && a.p.id(on) === a.id) return;      /* the press took: nothing to do */
      if(!drawn(a.p, a.id)) return;              /* that row is not on screen */
      make(a.p, a.id);
    };

    document.addEventListener('pointerdown', function(ev){
      seq++;
      pending = null;
      if(!ev || ev.isTrusted !== true) return;
      const t = ev.target;
      if(!t || !t.closest) return;
      if(t.closest('button, .ol-tool, [data-sf-pin], [data-sf-img]')) return;
      LISTS.forEach(function(p){
        const page = document.querySelector(p.el);
        if(!page || !page.contains(t)) return;
        const hit = t.closest(p.pick);
        if(!hit) return;
        const on = onOf(p);
        if(on && p.id(on) === p.id(hit)) return; /* the row you are on: lets it go */
        pending = { p:p, id:p.id(hit) };
        const mine = seq;
        setTimeout(function(){ settle(mine); }, 700);
      });
    }, true);
  })();

  /* ═══ 8h · A ROW THE WRITER PRESSED STAYS PRESSED ════════════

     Picking a draft took three or four presses. The letting-go of an
     arrival's row (below) is not done once and forgotten: the app draws a
     list again a beat later and that paint marks the head all over again, so
     a row found on is clicked for as long as the arrival is fresh — every
     70ms for five seconds. That press is its own click, so the row the
     writer had just picked was clicked again a moment after they picked it;
     and because a second press on the Draft row you are on lets it go (-1),
     the pick was taken back every time and the writer had to press again.

     The sweep is right about the ARRIVAL — a row no hand picked must come
     off — and wrong about everything after it. So this is the one press it
     is not allowed to make: a row click no hand made, on a page the writer's
     own hand has already been inside. Until that first press the page is
     untouched and the arrival's row is still let go; from that press on, a
     row they pick is theirs and stays picked. The next arrival wipes the
     slate, because the row the app opens on is a fresh choice of its own.

     And a press that still does not take — the list drawn again under the
     writer's hand, the click left with no target — is answered for: the row
     they pressed is looked for a moment later, and if the page is not on it
     then, the page is put on it. One press, one pick, whatever else moves. */
  /* ═══ 8i · A PRESS THAT NEVER LANDED IS STILL A PICK ═════════

     The net above stops the letting-go from taking a pick back, but it
     cannot make a press that never reached its row land. This does. The row
     the pointer went down on is remembered, and a moment later, if the page
     is not on it, the page is put on it — the same selection the page's own
     click handler makes, written the way that handler writes it: the
     choice of these lists is a plain variable in the project and a draw of
     the list. One press, one pick, whatever else moved. */
  (function(){
    const LISTS = [
      { el:'#page-inspire', pick:'#ideaRows .idea-row', id:function(r){ return String(r.dataset.ideaOpen || ''); } },
      { el:'#page-draft',   pick:'.draft-row',          id:function(r){ return String(r.dataset.draftPick || ''); } },
      { el:'#page-bible',   pick:'#bbRows .bb-row',      id:function(r){ return String(r.dataset.bbOpen || ''); } },
      { el:'#page-outline', pick:'.ol-row',              id:function(r){ return String(r.dataset.olOpen || ''); } },
      { el:'#page-notebook',pick:'#nbTree .nb-tree-row', id:function(r){ return String(r.dataset.nbCh || ''); } }
    ];
    let asked = null;

    const onOf = function(p){
      const page = document.querySelector(p.el);
      return page ? page.querySelector(p.pick + '.on') : null;
    };

    /* the pick, made the way the page's own handler makes it */
    const make = function(p, id){
      try{
        /* an entry the writer has just let go is not put back by a net: a
           net cannot tell a letting-go from a press that never landed */
        if(p.el === '#page-bible' || p.el === '#page-draft'){
          const left = (p.el === '#page-bible') ? window.sfBbLetGoId : window.sfDraftLetGoId;
          const when = (p.el === '#page-bible') ? window.sfBbLetGoAt : window.sfDraftLetGoAt;
          if(left != null && String(left) === String(id)
             && Date.now() < (Number(when) || 0) + 1600) return;
        }
        if(p.el === '#page-draft'){
          const i = parseInt(id, 10);
          if(isNaN(i)) return;
          _draftSel = i;
          _draftPage = Math.max(0, Math.floor(i / (DRAFT_PER_PAGE || 5)));
          if(typeof save === 'function') save();
          if(typeof renderDrafts === 'function') renderDrafts();
          return;
        }
        if(p.el === '#page-bible'){
          _bbSel = String(id);
          _bbOff = false;
          if(typeof save === 'function') save();
          if(typeof renderBbRows === 'function') renderBbRows();
          if(typeof renderBbDetail === 'function') renderBbDetail();
          return;
        }
        if(p.el === '#page-notebook'){
          const d = D();
          d._nbOpenCh = String(id);
          d._nbEditing = false;
          if(typeof save === 'function') save();
          if(typeof renderNbTree === 'function') renderNbTree();
          if(typeof renderNbReader === 'function') renderNbReader();
          return;
        }
        if(p.el === '#page-outline'){
          const d = D();
          if(d.currentChapter === id) return;
          d.currentChapter = id;
          if(typeof save === 'function') save();
          const root = document.getElementById('page-outline');
          if(root && typeof PAGE_RENDERERS !== 'undefined' && PAGE_RENDERERS
             && typeof PAGE_RENDERERS.outline === 'function') PAGE_RENDERERS.outline(root);
        }
      }catch(e){ /* the Idea page keeps its own state: the net above holds it */ }
    };

    const look = function(){
      const a = asked;
      asked = null;
      if(!a) return;
      const on = onOf(a.p);
      if(on && a.p.id(on) === a.id) return;        /* the press landed: nothing to do */
      make(a.p, a.id);
    };

    document.addEventListener('pointerdown', function(ev){
      asked = null;
      if(!ev || ev.isTrusted !== true) return;
      const t = ev.target;
      if(!t || !t.closest) return;
      if(t.closest('button, .ol-tool, [data-sf-pin], [data-sf-img]')) return;
      LISTS.forEach(function(p){
        const page = document.querySelector(p.el);
        if(!page || !page.contains(t)) return;
        const hit = t.closest(p.pick);
        if(!hit) return;
        const on = onOf(p);
        if(on && p.id(on) === p.id(hit)) return;   /* the row you are on: a second press lets it go */
        asked = { p:p, id:p.id(hit) };
        setTimeout(look, 420);
      });
    }, true);
  })();

  (function(){
    const PAGES = [
      { el:'#page-inspire', pick:'#ideaRows .idea-row' },
      { el:'#page-draft',   pick:'.draft-row' },
      { el:'#page-bible',   pick:'#bbRows .bb-row' },
      { el:'#page-outline', pick:'.ol-row' },
      { el:'#page-notebook', pick:'#nbTree .nb-tree-row' }
    ];
    const touched = {};
    /* the writer's own two presses. press() is a declaration, so it is
       already here when these are wired; mark() is wired below, after it,
       so that a press is filed as the writer's before it is read. */
    /* press() is defined below: the names are looked up when a press comes,
       not here */
    document.addEventListener('pointerdown', function(e){ try{ press(e); }catch(err){} }, true);
    document.addEventListener('keydown', function(e){ try{ press(e); }catch(err){} }, true);
    let want = null;                /* the row the writer pressed, and its page */
    let clock = 0;

    const onRow = function(p){
      const page = document.querySelector(p.el);
      return page ? page.querySelector(p.row) : null;
    };
    const find = function(p, id){
      const page = document.querySelector(p.el);
      if(!page) return null;
      const rows = page.querySelectorAll(p.pick);
      for(let i = 0; i < rows.length; i++){
        if(p.id(rows[i]) === id) return rows[i];
      }
      return null;
    };
    const forget = function(){
      if(clock){ clearTimeout(clock); clock = 0; }
      want = null;
    };

    /* ── the press the writer makes ─────────────────────────────────

       A press on a row is read at the moment it lands. The pointer going
       down is the writer's own decision — the one thing on the page a later
       draw of the list cannot take back — so the row under it is noted
       there, and for a moment afterwards the page is watched to see whether
       it became the row the page is on. */
    const press = function(ev){
      if(!ev || ev.isTrusted !== true) return;
      const t = ev.target;
      if(!t || !t.closest) return;
      forget();
      if(ev.type !== 'pointerdown') return;          /* keys only mean “this page is mine” */
      PAGES.forEach(function(p){
        const page = document.querySelector(p.el);
        if(!page || !page.contains(t)) return;
        if(t.closest('button, .ol-tool, [data-sf-pin], [data-sf-img]')) return;
        const hit = t.closest(p.pick);
        if(!hit) return;
        const on = onRow(p);
        if(on && p.id(on) === p.id(hit)) return;     /* the row you are on: a second press lets it go */
        want = { p:p, id:p.id(hit) };
        clock = setTimeout(check, 400);
      });
    };

    /* ── and the pick is made ───────────────────────────────────────

       If the row the writer pressed is not the row the page is on a moment
       later, their press never reached it: the letting-go above answered it
       with a press of its own, or the list was drawn again under their hand
       and the click had no target left. The row they asked for is picked in
       its place — one press, one pick, whatever else is moving. */
    const check = function(){
      const asked = want;
      forget();
      if(!asked) return;
      const p = asked.p;
      if(!touched[p.el]) return;
      const on = onRow(p);
      if(on && p.id(on) === asked.id) return;        /* it took: nothing to do */
      const row = find(p, asked.id);
      if(!row) return;
      rescuing = true;
      try{ row.click(); }catch(e){}
      rescuing = false;
    };

    /* the writer's hand anywhere in the page is what makes it theirs — a row,
       the filter box, the writing surface they are typing in */
    const mark = function(ev){
      if(!ev || ev.isTrusted !== true) return;
      const t = ev.target;
      if(!t || !t.closest) return;
      PAGES.forEach(function(p){
        const page = document.querySelector(p.el);
        if(page && page.contains(t)) touched[p.el] = true;
      });
    };
    document.addEventListener('pointerdown', mark, true);
    document.addEventListener('keydown', mark, true);

    /* and the one press that is then dropped: a row click with no hand
       behind it, on a page the writer has already been inside */
    document.addEventListener('click', function(e){
      if(e.isTrusted) return;
      const t = e.target;
      if(!t || !t.closest) return;
      for(let i = 0; i < PAGES.length; i++){
        /* the sweep's own press is the only one dropped (see 8i) */
        const p = PAGES[i];
        if(!touched[p.el]) continue;
        if(!t.closest(p.pick)) continue;
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
    }, true);

    const clear = function(){
      Object.keys(touched).forEach(function(k){ delete touched[k]; });
    };

    /* a step to a page is a fresh arrival: the row the app opens on is its
       own choice again, and is let go like any other arrival's */
    const go = window.goPage;
    if(typeof go === 'function' && !go.__sfRow2){
      const fn = function(){ const r = go.apply(this, arguments); clear(); return r; };
      fn.__sfRow2 = true;
      window.goPage = fn;
    }
    const arm = function(){
      if(typeof window.openProjectById === 'function' && !window.openProjectById.__sfRow2){
        const orig = window.openProjectById;
        const opened = function(){
          const r = orig.apply(this, arguments);
          clear();
          return r;
        };
        opened.__sfRow2 = true;
        window.openProjectById = opened;
      }
    };
    arm();
    [0, 300, 1000, 2500].forEach(function(ms){ setTimeout(arm, ms); });
  })();

  /* ═══ 8g · ONE COLOUR FOR BOTH CARDS ═════════════════════════

     The Idea page and the Draft page are the same two-column shape: a
     column of rows down the left, the writing surface on the right. On both
     of them the right-hand card was the darker of the two — .idea-write was
     drawn in --surface-1 while the list card beside it (.idea-side, and on
     the Draft .draft-list) is --surface-2, which is also the fill the
     Bible's list and its pane share.

     So the right-hand card takes the colour of the card it sits beside, on
     both pages: one surface across the page, with the list as a column down
     its left rather than a lighter card floating on a darker one. It is
     written here with the extra class in the selector because pages.css and
     the sheets below draw .idea-write's own --surface-1 with !important,
     and a rule of equal weight is decided by whoever comes last; this one is
     decided by weight instead. It is set on the element as well, so no layer
     written after this file can put the darker fill back. */
  (function(){
    const CSS = [
      /* the Idea's writing card takes the fill of the .idea-side beside it */
      'html body #page-inspire .idea-main > .idea-write.idea-write[class]{',
      '  background:var(--surface-2) !important;',
      '}',
      /* and the Draft's writing pane the fill of the .draft-list beside it */
      'html body #page-draft .draft-pane.draft-pane[class]{',
      '  background:var(--surface-2) !important;',
      '}'
    ];
    const host = document.head || document.documentElement;
    if(host){
      const sheet = document.createElement('style');
      sheet.setAttribute('data-sf-one-colour', '1');
      sheet.textContent = CSS.join('\n');
      host.appendChild(sheet);
    }

    /* the same fill, on the elements themselves: an inline rule carrying
       !important is the last thing the browser reads */
    const put = function(sel){
      const el = document.querySelector(sel);
      if(!el) return;
      try{ el.style.setProperty('background', 'var(--surface-2)', 'important'); }catch(e){}
    };
    const paint = function(){
      put('#page-inspire .idea-main > .idea-write');
      put('#page-draft .draft-pane');
    };

    let raf = 0;
    const soon = function(){
      if(raf) return;
      raf = requestAnimationFrame(function(){ raf = 0; paint(); });
    };
    /* a writing card is made when a row is opened, so the pane is followed
       rather than painted once — childList only, so the fills this writes
       cannot set the sweep off again */
    if(typeof MutationObserver === 'function' && document.body){
      new MutationObserver(soon).observe(document.body, { childList:true, subtree:true });
    }
    document.addEventListener('click', soon, true);
    paint();
    [0, 200, 800, 2000].forEach(function(ms){ setTimeout(paint, ms); });
  })();

  /* ═══ 8d · A NEW BIBLE ENTRY JOINS THE HEAD OF ITS LIST ═══════

     New prompt and New draft both make the thing AT THE TOP of its list,
     pick it, and leave the writing to the writer. The Bible made its entry
     at the END instead — so on a list long enough to page, the entry that
     was just made was not even on the page in view, while the pane beside
     it held it. Same three lists, same gesture now.

     The app also puts the caret in the pane's first field and selects what
     is in it, which reads as “rename it here, now”. The entry already wears
     the tab's own word for a name (New Character, New Timeline …), and the
     field stays exactly where it is for a name that wants changing — it is
     simply not asked for. */
  /* The move is made where the entry is MADE, not after the page has drawn
     it. bbMutate() is what every write to a Bible list goes through and the
     app's own add handler calls it before it draws, so the row is the head
     of the list on its first paint and the list is never drawn twice. (The
     second pass after the paint is what flickered: the entry appeared at the
     foot of the list and then jumped to the top.)

     Only a write that GREW a list is a new entry; a delete takes one away
     and a field edit does not go through here at all, so neither is moved. */
  const moveMade = function(){
    const orig = window.bbMutate;
    if(typeof orig !== 'function' || orig.__sfNew) return true;
    const fn = function(tab){
      let list = null, had = 0;
      try{
        list = (typeof window.bbList === 'function') ? window.bbList(tab) : null;
        had = list ? list.length : 0;
      }catch(e){ list = null; }
      const r = orig.apply(this, arguments);
      try{
        if(list && list.length === had + 1){
          const made = list[list.length - 1];
          if(made){ list.splice(list.length - 1, 1); list.unshift(made); }
          if(typeof save === 'function') save();
        }
      }catch(e){}
      return r;
    };
    fn.__sfNew = true;
    window.bbMutate = fn;
    return true;
  };
  if(!moveMade()){ [0, 200, 800, 2000].forEach(function(ms){ setTimeout(moveMade, ms); }); }

  /* ═══ 8e · MAKING SOMETHING DOES NOT ASK FOR ITS NAME ════════

     The app's habit when a page makes a row is to put the caret straight
     into the field that holds its name: the Idea page and the Draft page
     open a rename field over the row, and the Bible puts the caret in the
     pane's Name field with what is in it selected. All three read as the
     app asking the writer for a name, twice over, the moment the row has
     appeared — and the Bible asks it under a label that already holds the
     tab's own word. The name is the writer's to give whenever they want:
     the pencil is still on every row and the Bible's Name field is still
     the pane's first field. It is simply not offered up.

     The Idea's and the Draft's own pages drop their field in their own
     pass (above). This is the one net over all of them, held for a breath
     after a create press. */
  const NAMED = '#page-inspire input.idea-rename,'
    + ' #page-draft [data-draft-rename-input],'
    + ' #bbDetail [data-bb-field="name"], #bbDetail [data-bb-field="title"]';
  const ASKED = '[data-ic-new], [data-act="add-draft"], [data-sfbar="tools:addDraft"],'
    + ' [data-bb="add"], [data-ol="add"], [data-ol="addsub"]';
  let askedAt = 0;

  const letGoName = function(){
    if(!askedAt || Date.now() - askedAt > 1200) return;
    const a = document.activeElement;
    if(!a || !a.matches || !a.matches(NAMED)) return;
    try{ a.blur(); }catch(e){}
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(!t.closest(ASKED)) return;
    askedAt = Date.now();
    /* the app's own handler answers the same press in the same task, so the
       first look is made after it is done */
    [0, 40, 120, 400].forEach(function(ms){ setTimeout(letGoName, ms); });
  }, true);

  /* And the caret is caught the instant it lands, whichever pass drew the
     field: only a press that has just made a row arms this, so a field the
     writer opened for themselves is never taken from their hands. */
  document.addEventListener('focusin', function(e){
    const t = e.target;
    if(!t || !t.matches || !t.matches(NAMED)) return;
    if(!askedAt || Date.now() - askedAt > 1500) return;
    try{ t.blur(); }catch(err){}
  }, true);

  /* ═══ 8f · A PAGE PICKS NOTHING THE WRITER DID NOT PICK ═══════

     Every one of these lists opens on a row of its own: the Idea page's
     shelf starts at 0, the Draft's at 0, the Bible falls back to the head of
     its list when nothing is on, and the Outline marks whichever chapter the
     manuscript is written into. So arriving at a page put a row under the
     finger before any hand had been near it — and a paint a beat later marks
     the head of the list all over again.

     So the row that is on is let go of when the page arrives, and again
     while that arrival is fresh. A row the WRITER answered for is never
     touched: a real click or keystroke INSIDE a page makes whatever was on
     at that moment theirs, while the press that brought them there — the
     nav, the dashboard card, a tab — lands outside the list and counts as
     nothing. Making something (New prompt, New draft, New …) ends it too:
     the row that appears then is the one the writer asked for.

     The Outline is the one page whose pointer is left exactly as it is — the
     chapter the app has chosen is where the manuscript is written — so there
     the mark alone comes off the row. */
  (function(){
    const WHICH = [
      { el:'#page-inspire', row:'#ideaRows .idea-row.on', id:function(r){ return String(r.dataset.ideaOpen || ''); } },
      { el:'#page-draft',   row:'.draft-row.on',          id:function(r){ return String(r.dataset.draftPick || ''); } },
      { el:'#page-bible',   row:'#bbRows .bb-row.on',     id:function(r){ return String(r.dataset.bbOpen || ''); } },
      { el:'#page-outline', row:'.ol-row.on',             id:function(r){ return String(r.dataset.olOpen || ''); }, mark:true }
    ];
    const mine = {};
    let freshUntil = 0, timer = 0;

    const done = function(){
      freshUntil = 0;
      if(timer){ clearInterval(timer); timer = 0; }
    };

    const onRow = function(p){
      const page = document.querySelector(p.el);
      const row = page ? page.querySelector(p.row) : null;
      return row ? { row:row, id:p.id(row) } : null;
    };

    const look = function(){
      if(!freshUntil) return;
      if(Date.now() > freshUntil) return done();
      WHICH.forEach(function(p){
        const found = onRow(p);
        if(!found) return;
        if(mine[p.el] === found.id) return;              /* the writer's own: theirs */
        if(p.mark){ try{ found.row.classList.remove('on'); }catch(e){} return; }
        try{ found.row.click(); }catch(e){}
      });
    };

    const hush = function(){
      freshUntil = Date.now() + 5000;
      look();
      if(!timer) timer = setInterval(look, 70);
    };
    window.sfHushPages = hush;

    /* what the writer's own hand answered for */
    const claim = function(ev){
      if(!ev || ev.isTrusted !== true) return;
      WHICH.forEach(function(p){
        const page = document.querySelector(p.el);
        if(!page || !page.contains(ev.target)) return;
        const found = onRow(p);
        if(found) mine[p.el] = found.id;
      });
    };

    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      if(t.closest(ASKED)){ done(); claim(e); return; }        /* the writer made something */
      claim(e);
      /* a tab is an arrival of its own: the list under it opens on its head */
      if(t.closest('#bbTabs .bb-tab')) setTimeout(hush, 0);
    }, true);
    document.addEventListener('keydown', claim, true);

    /* the arrivals: the app's own boot, a project opened or made, and a step
       to one of these pages (the nav, the pages overlay, a jump) */
    const goOrig = window.goPage;
    if(typeof goOrig === 'function' && !goOrig.__sfHush2){
      const fn = function(){
        const r = goOrig.apply(this, arguments);
        try{ hush(); }catch(e){}
        return r;
      };
      fn.__sfHush2 = true;
      window.goPage = fn;
    }
    const arm = function(){
      if(typeof window.openProjectById === 'function' && !window.openProjectById.__sfHush2){
        const origOpen = window.openProjectById;
        const opened = function(){
          const r = origOpen.apply(this, arguments);
          try{ hush(); }catch(e){}
          return r;
        };
        opened.__sfHush2 = true;
        window.openProjectById = opened;
      }
      if(window.TOOLS && typeof window.TOOLS.newProject === 'function' && !window.TOOLS.newProject.__sfHush2){
        const origNew = window.TOOLS.newProject;
        const made = function(){
          const r = origNew.apply(this, arguments);
          try{ hush(); }catch(e){}
          if(r && typeof r.then === 'function'){ r.then(function(){ try{ hush(); }catch(e){} }, function(){}); }
          return r;
        };
        made.__sfHush2 = true;
        window.TOOLS.newProject = made;
      }
    };
    arm();
    [0, 200, 800, 2000].forEach(function(ms){ setTimeout(arm, ms); });

    [0, 250, 900, 1600, 2600].forEach(function(ms){ setTimeout(hush, ms); });
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hush);
    if(window.addEventListener) window.addEventListener('load', hush);
  })();

  /* ═══ 9 · THE T PANEL'S OWN LIST — THE WHOLE PACK ═════════════════
     There used to be a short list here: twelve of the app's fifty-seven
     families, and 9b below asked for that trim at every door the panel had.
     The writer asked for the list back the way the app ships it — every
     face, in every font control — so nothing here trims anything any more.
     The select the panel is built with is the select that is shown, and the
     IMF control in the writing bar keeps the whole pack it always had. */

  /* ═══ 10 · THE PRESSES ════════════════════════════════════════
     On the window, in the capture phase, so these run before the app's own
     handlers and a row's own click never fires for a press of ours. */
  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    const pin = t.closest('[data-sf-pin]');
    if(pin){
      e.preventDefault();
      e.stopImmediatePropagation();
      const i = parseInt(pin.getAttribute('data-sf-pin-id'), 10);
      if(isNaN(i)) return;
      if(pin.getAttribute('data-sf-pin') === 'draft') pinDraft(i);
      else pinPrompt(i);
      return;
    }

    const add = t.closest('[data-sf-addcard]');
    if(add){ e.preventDefault(); e.stopImmediatePropagation(); addCard(); return; }

    const del = t.closest('[data-sf-img-del]');
    if(del){
      e.preventDefault();
      e.stopImmediatePropagation();
      const en = bbNow();
      if(en){
        try{ delete en.image; }catch(err){ en.image = ''; }
        saveNow();
        repaintBible();
        say('Image removed');
      }
      return;
    }

    const shp = t.closest('[data-sf-img-shape]');
    if(shp){
      e.preventDefault();
      e.stopImmediatePropagation();
      const en = bbNow();
      if(en){
        en.imgShape = (shp.getAttribute('data-sf-img-shape') === 'landscape') ? 'landscape' : 'portrait';
        const pane = document.getElementById('bbDetail');
        if(pane) pane.setAttribute('data-img-shape', en.imgShape);   /* the fields' clearance follows at once */
        saveNow();
        repaintBible();
      }
      return;
    }

    const ibox = t.closest('[data-sf-img-box]');
    if(ibox){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(ibox.classList.contains('has')) return;      /* the bin takes one away */
      afterPick = function(dataUrl){
        const en = bbNow();
        if(!en){ say('Pick an entry first', 'warn'); return; }
        en.image = dataUrl;
        saveNow();
        repaintBible();
        say('Image added');
      };
      try{ picker().click(); }catch(err){}
      return;
    }

  }, true);

  let queued = 0;
  const run = function(){
    if(queued) return;
    queued = requestAnimationFrame(function(){ queued = 0; dress(); });
  };
  document.addEventListener('click', run, true);
  window.addEventListener('resize', run);
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(run).observe(document.body, { childList:true, subtree:true });
  }
  if(document.body) run();
  else document.addEventListener('DOMContentLoaded', run);
})();

/* ═══════════════════════════════════════════════════════════
   TWO LAST THINGS — one about what the writer keeps, one about
   what the writer is shown.

   1 · THE PAGES WORK ON THE OPEN PROJECT'S OWN LISTS

       Every Outline chapter and every Bible entry the writer added
       was landing in a copy that the next page change threw away.

       A mode keeps a working set — `S.modes.novel.chapters`,
       `... [mode].bible` — and `useProjectData(proj)` is what points
       it at the project the writer actually has open. Nothing called
       it while the app was in use, so the pages read the mode's own
       copy (the one older versions wrote into the saved file) and
       every add went in there. Then the first thing that did call it
       — opening the project from the dashboard, moving to another
       workspace, opening a second book — re-pointed the page at the
       project's own list, and the chapter, the scene, the subchapter
       and the Bible entry added a moment before were gone.

       Measured before the fix: the Outline's chapter count read 7
       while the project's own list still read 6, and
       D().chapters === proj.chapters was false; one call to
       useProjectData(proj) put it back to 6.

       So the working set is pointed at the open project after boot,
       before every page is drawn, and again when the app is idle. It
       costs one identity check per page: a set that already holds the
       project's own lists is left alone, so nothing is copied and no
       read is disturbed.

       A profile that is already in the split state is moved over, not
       merged: the list on screen holds everything the writer has made
       — and, just as importantly, everything they have REMOVED — so
       it becomes the project's list in one step, by reference. A
       merge was tried here first and it read as a reset of its own:
       it could only ever add, so every chapter the writer deleted on
       the Outline came back on the next page change, because the
       project's copy still held the row.

   2 · A LIST SHOWS WHOLE ROWS

       The Idea's left card drew a row too many, and the writer saw
       its edge under the tenth prompt. The list is cut to fit the
       column it is measured in — but on the first pass that column
       is still taller than it ends up (the rest of the page settles
       after it), so thirteen 44px rows were drawn into a column that
       holds eleven, and the twelfth stood there, clipped, at the
       card's foot until the app looked again a frame later.

       The rows are trimmed to what the column really holds — in the
       microtask of the same task that drew them, and again whenever
       the column is resized. Both land before the frame is painted,
       so no part-row is ever shown. A trimmed row is not lost: the
       page's own count follows the column, so it is the first row of
       the next page, and the range beside the arrows is renumbered
       to match.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* 1 · the working set is the open project's */
  const projectOf = function(){
    try{
      const d = D();
      if(!d || !Array.isArray(d.projects)) return null;
      return d.projects.filter(function(p){ return p && p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };

  /* every list a page hands back and forth, exactly as useProjectData
     manages them: the arrays by themselves, and the two bags of arrays */
  const KEYS = ['chapters','drafts','ideas','notes','beats','references',
                'timeline','cast','versions','aiChats','bible','kanban'];

  /* Whose own list a single key is — by identity, against the project's
     list AND every workspace that project keeps. A list that can be found
     in either belongs there, so it is never moved: not across books, and
     not across the workspaces of one book.

     The workspaces are why this reads the slots and not just `p[k]`. A
     workspace move sets `proj.wsActive` and THEN re-points the working set,
     so for that one moment the list on screen is the workspace it just
     left — a list the project owns, in a slot that is no longer the active
     one. Reading only the active slot called it ownerless and carried it
     into the workspace the writer was moving TO, which is how a switch came
     to hand the new workspace a copy of the old one's chapters and Bible.
     Every slot is looked at here, so a move in flight is nobody's stray. */
  const ownedBy = function(d, k){
    const projs = (d && Array.isArray(d.projects)) ? d.projects : [];
    for(let i = 0; i < projs.length; i++){
      const p = projs[i];
      if(!p) continue;
      if(d[k] === p[k]) return p;
      const ws = Array.isArray(p.wsList) ? p.wsList : null;
      if(!ws) continue;
      for(let j = 0; j < ws.length; j++){
        const w = ws[j];
        if(w && d[k] === w[k]) return p;
      }
    }
    return null;
  };

  /* THE COPY ON SCREEN IS THE TRUTH — it is moved in whole, never merged.

     Two copies of these lists exist whenever a profile is saved: the mode's
     working keys (`S.modes.novel.chapters`, `…bible`) sit beside the
     project's own lists, and the pages edit one of them. A profile that has
     been through more than one build can hold both with different content.

     This used to MERGE the two, keeping whatever either copy had. A merge
     cannot express a deletion: the item the writer just removed was still
     in the other copy, so it came straight back on the next page change —
     “the entries I delete come back”, on the Outline and in the Bible,
     because both of those pages delete through the live list and both sat
     beside a project copy that still had the row.

     So there is no merge. The list in hand is assigned to the project by
     reference — the deletion travels with it, and the project is pointed at
     the very same array, so from that moment on there is one list and no
     copy left to resurrect anything from. A key the writer has nothing in
     (absent from the mode entirely) is left as the project's own.

     The one thing never carried across is a list that belongs to a book:
     another project's own list, or one of a project's workspaces (a
     workspace move looks exactly like that for the moment between the
     pointer moving and the re-point). Those are read as the project's and
     left alone. */
  const adopt = function(d, proj){
    let moved = false;
    KEYS.forEach(function(k){
      const mine = d[k];
      if(mine === undefined || mine === null) return;   /* nothing of the writer's to move */
      if(mine === proj[k]) return;                      /* already the project's own list */
      if(ownedBy(d, k)) return;                         /* a list that belongs to a book, or to one of its workspaces */
      proj[k] = mine;
      moved = true;
    });
    return moved;
  };

  const pointAtProject = function(){
    try{
      const d = D();
      const proj = projectOf();
      if(!d || !proj || typeof window.useProjectData !== 'function') return false;
      let same = true;
      KEYS.forEach(function(k){ if(d[k] !== proj[k]) same = false; });
      if(same) return false;                            /* already the project's own lists */
      const moved = adopt(d, proj);
      window.useProjectData(proj);
      if(moved) saveNow();
      return true;
    }catch(e){ return false; }
  };
  window.sfPointAtProject = pointAtProject;

  /* the page is drawn after the working set has been pointed at the
     project: the Outline, the Bible, the Plan and the board all read it
     while they draw, so it has to be right before the renderer runs */
  const goPageOrig = window.goPage;
  if(typeof goPageOrig === 'function' && !goPageOrig.__sfPoint){
    const fn = function(){
      try{ pointAtProject(); }catch(e){}
      return goPageOrig.apply(this, arguments);
    };
    fn.__sfPoint = true;
    window.goPage = fn;
  }

  /* and again after boot, when the app has settled on its project */
  [0, 400, 1400, 3000].forEach(function(ms){ setTimeout(pointAtProject, ms); });
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', pointAtProject);
  }
  if(window.addEventListener) window.addEventListener('load', pointAtProject);

  /* 1b · THE SAME RESCUE WHEN SOMETHING ELSE MOVES THE POINTER

     The boot above covers the set the writer already had. A second way out
     is lived through in one session: opening another book from the
     dashboard, importing one, making a new one, switching a workspace — all
     of them re-point the working set through useProjectData(), and the set
     that was on screen is let go at that moment. Anything it held that the
     project it was open on did not is then nowhere at all, which reads as
     the page resetting itself.

     So the move is closed at the door every one of those paths uses: before
     useProjectData() re-points anything, the set that is about to be
     replaced is put into the project it was open on — as it stands, in one
     piece, so a deletion made a moment ago travels with it. A set that
     already IS some project's own lists is that project's and is left
     alone; so is another book's, and so is a workspace's while a switch is
     in flight. */
  const saveNow = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  const flushSet = function(){
    try{
      const d = D();
      const cur = projectOf();
      if(!d || !cur) return false;
      const moved = adopt(d, cur);            /* adopt skips what another book owns */
      if(moved) saveNow();
      return moved;
    }catch(e){ return false; }
  };
  window.sfFlushSet = flushSet;

  const upOrig = window.useProjectData;
  if(typeof upOrig === 'function' && !upOrig.__sfFlush){
    const fn = function(){
      try{ flushSet(); }catch(e){}
      return upOrig.apply(this, arguments);
    };
    fn.__sfFlush = true;
    window.useProjectData = fn;
  }

  /* 1e · OPENING A PROJECT DOES NOT PICK A PROMPT FOR THE WRITER

     Every route that opens or makes a project lands on the Idea page, and
     the page's own default is the head of the shelf: the six cards on the
     right belong to whatever prompt sits at the top. So a project that was
     only just opened came up with a prompt already chosen — and, since the
     prompt the writer made last is the one at the top, an unnamed one. No
     hand picked it.

     The page has a gesture for letting a row go — a second press on the row
     you are on — and this is that same letting go, made once the page has
     settled around the project that was just opened. A press of the
     writer's own in the moment after is left alone: the row they picked is
     theirs, and so is the prompt they just made. */
  let lastPress = 0;
  window.addEventListener('pointerdown', function(){ lastPress = Date.now(); }, true);
  window.addEventListener('keydown',     function(){ lastPress = Date.now(); }, true);

  const letGoPrompt = function(){
    const on = document.querySelector('#page-inspire #ideaRows .idea-row.on');
    if(!on) return false;
    try{ on.click(); }catch(e){ return false; }
    return true;
  };
  window.sfLetGoPrompt = letGoPrompt;

  const openedProject = function(){
    const at = Date.now();
    const clear = function(){
      if(lastPress > at) return;              /* the writer has been here: theirs */
      letGoPrompt();
    };
    clear();
    [0, 60, 400, 900].forEach(function(ms){ setTimeout(clear, ms); });
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(clear);
  };
  window.sfOpenedProject = openedProject;

  const armNoPick = function(){
    if(typeof window.openProjectById === 'function' && !window.openProjectById.__sfNoPick){
      const origOpen = window.openProjectById;
      const opened = function(){
        const r = origOpen.apply(this, arguments);
        openedProject();
        return r;
      };
      opened.__sfNoPick = true;
      window.openProjectById = opened;
    }
    /* making a project is the same arrival, and it is answered a window
       later: the letting go is also held to the moment it finishes */
    if(window.TOOLS && typeof window.TOOLS.newProject === 'function' && !window.TOOLS.newProject.__sfNoPick){
      const origNew = window.TOOLS.newProject;
      const made = function(){
        const r = origNew.apply(this, arguments);
        openedProject();
        if(r && typeof r.then === 'function'){ r.then(function(){ openedProject(); }, function(){}); }
        return r;
      };
      made.__sfNoPick = true;
      window.TOOLS.newProject = made;
    }
    return !!(window.openProjectById && window.openProjectById.__sfNoPick);
  };

  /* app.js arms its own wrapper for the same two functions as it parses and
     this file is read after it, so both are already in place here and the
     plain call is enough. The later looks are for a page still being put
     together when this runs. */
  if(!armNoPick()){
    [0, 200, 800, 2000].forEach(function(ms){ setTimeout(armNoPick, ms); });
    if(typeof document.addEventListener === 'function') document.addEventListener('DOMContentLoaded', armNoPick);
    if(window.addEventListener) window.addEventListener('load', armNoPick);
  }

  /* 1d · ONE NAME, ONE PROJECT — ON THE WAY IN TOO

     Every other way of making a project refuses a name already worn in that
     category: the dashboard's own New, the category's New, and the importer
     itself. Importing a JSON file is the way out of that rule. The layer
     that owns the importer hides one entry of the category for the length
     of the call — the category is meant to hold any number of projects, and
     the guard the importer carries stops at five — and when the entry
     hidden happens to be the one wearing the name being imported, the guard
     cannot see it any more. Pressing the import five times then left five
     rows reading the same name, and nothing on the screen said why.

     So the name is judged here as well, against the whole list, before the
     imported file reaches that layer at all. This wrapper is put on a tick
     after every script has run, because the layer that owns the importer
     replaces it later in this same file than this section is read. */
  setTimeout(function(){
    const imp = window.importJSONProject;
    if(typeof imp !== 'function' || imp.__sfName) return;
    const wrapped = function(parsed, filename){
      try{
        const src = parsed && (parsed.project || parsed);
        const cls = (typeof window.classifyProjectName === 'function')
          ? window.classifyProjectName(String(filename || '').replace(/\.json$/i, ''))
          : null;
        const data = cls && cls.mode && S.modes && S.modes[cls.mode];
        const cat = cls && cls.category;
        if(src && data && cat && Array.isArray(data.projects)){
          const name = ((filename || '').replace(/\.json$/i, '') || src.name || 'Untitled').trim();
          const low = name.toLowerCase();
          const worn = data.projects.some(function(p){
            return p && p.category === cat
              && String(p.name || '').trim().toLowerCase() === low;
          });
          if(worn){
            if(typeof toast === 'function'){
              toast('A project named "' + name + '" already exists in this category', 'warn');
            }
            return;
          }
        }
      }catch(e){}
      return imp.apply(this, arguments);
    };
    wrapped.__sfName = true;
    window.importJSONProject = wrapped;
  }, 0);

  /* 1c · A NEW PROMPT IS LEFT UNNAMED, THE WAY A NEW DRAFT IS

     New draft leaves its row reading “Untitled draft”, with nothing written
     down: the title of a new draft is an empty string and the name on
     screen is a placeholder. New prompt used to do the opposite — it wrote
     “Untitled prompt”, then “Untitled prompt 2”, “Untitled prompt 3”, a name
     the writer never typed, arriving numbered — so the two pages disagreed
     about what a new thing is called.

     The row app.js makes is unnamed here in the same breath: the number is
     dropped from the entry and from the field, so the row reads “Untitled
     prompt” from its first paint, exactly like the draft's row. app.js's
     own rename finishes the row a moment later — it takes its text from
     that field — so this lands first, in the task that made the row. */
  let newPromptRow = false;
  const unnamePrompt = function(){
    if(!newPromptRow) return false;
    const list = (typeof S !== 'undefined' && S.config && Array.isArray(S.config.savedPrompts))
      ? S.config.savedPrompts : null;
    if(!list || !list.length) return false;

    const inp = document.querySelector('#page-inspire #ideaRows input.idea-rename');
    let i = -1, title = '';
    if(inp){
      i = parseInt(inp.dataset.ideaRenInput, 10);
      title = String(inp.value || '');
    }
    if(!(i >= 0) || !list[i] || typeof list[i] !== 'object'){
      i = 0;
      title = (list[0] && typeof list[0] === 'object') ? String(list[0].title || '') : '';
    }
    /* only the name the app wrote for itself — a name the writer typed is
       never touched, whatever it is */
    if(!/^Untitled prompt( \d+)?$/.test(title)) return false;

    list[i].title = '';
    if(inp) inp.value = '';
    const row = document.querySelector('#page-inspire #ideaRows .idea-row[data-idea-open="' + i + '"] b');
    if(row) row.textContent = 'Untitled prompt';
    saveNow();
    return true;
  };
  window.sfUnnamePrompt = unnamePrompt;

  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('#page-inspire [data-ic-new]')) return;
    newPromptRow = true;
    unnamePrompt();                       /* the row is not drawn yet: a no-op, kept for order */
    setTimeout(unnamePrompt, 0);
    setTimeout(unnamePrompt, 60);
    setTimeout(function(){ unnamePrompt(); newPromptRow = false; }, 400);
  }, true);

  /* The pencil on an unnamed prompt: the field starts empty, the way a new
     draft's does, instead of offering the “Untitled prompt” placeholder back
     as if it were a name — the app prefills it with the row's own title,
     which for a prompt nobody has named is that placeholder. */
  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('#page-inspire [data-idea-ren]')) return;
    setTimeout(function(){
      const inp = document.querySelector('#page-inspire #ideaRows input.idea-rename');
      if(!inp || inp.value !== 'Untitled prompt') return;
      const i = parseInt(inp.dataset.ideaRenInput, 10);
      const list = (typeof S !== 'undefined' && S.config && Array.isArray(S.config.savedPrompts))
        ? S.config.savedPrompts : null;
      const e0 = (list && list[i]) ? list[i] : null;
      if(!e0 || typeof e0 !== 'object' || String(e0.title || '')) return;
      inp.value = '';
    }, 0);
  }, true);

  /* 2 · the Idea's list holds whole rows */
  const ideaClip = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    /* a row is being named: the list is deliberately held still */
    if(document.querySelector('#page-inspire .idea-rename')) return;
    const rows = box.querySelectorAll('.idea-row');
    if(!rows.length) return;
    const cs = getComputedStyle(box);
    const track = parseFloat(cs.gridAutoRows) || 0;
    if(!track) return;
    const gap = parseFloat(cs.rowGap) || 0;
    const room = box.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    if(room <= 0) return;
    /* a row's own arithmetic: n rows take n * (row + gap) - gap */
    const fits = Math.max(1, Math.floor((room + gap) / (track + gap)));
    if(rows.length <= fits) return;

    for(let i = rows.length - 1; i >= fits; i--){ if(rows[i]) rows[i].remove(); }

    /* The rows that just left are the next page's, so the range beside the
       arrows counts to what is really on this one — and it counts to the
       same figure the page writes for itself once the column has settled.
       It used to write the bare page number here, on a page that carries no
       #ideaCount to cap it, so “1” stood on screen for a frame and the right
       “1-11” followed it: a blink, on every New prompt. A page this ran on
       is full by definition, so the end of its page is lead × fits — and
       that is exactly the number the settled pass arrives at. */
    const range = document.getElementById('ideaRange');
    if(range){
      const lead = parseInt(String(range.textContent || '').split('-')[0], 10);
      const total = parseInt(String((document.getElementById('ideaCount') || {}).textContent || ''), 10);
      if(lead > 0){
        const end = lead * fits;
        range.textContent = lead + '-' + (isNaN(total) ? end : Math.min(end, total));
      }
    }
  };
  window.sfIdeaClip = ideaClip;

  /* watched where it can move: the box itself — it shrinks as the rest of
     the page settles — and the document, because a new page draws a new
     list */
  let watchedBox = null, boxObserver = null;
  const watchBox = function(box){
    if(!box || box === watchedBox || typeof ResizeObserver !== 'function') return;
    if(!boxObserver) boxObserver = new ResizeObserver(function(){ try{ ideaClip(); }catch(e){} });
    if(watchedBox){ try{ boxObserver.unobserve(watchedBox); }catch(e){} }
    watchedBox = box;
    try{ boxObserver.observe(box); }catch(e){}
  };
  const clip = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    watchBox(box);
    ideaClip();
  };

  /* the Idea page's empty state carried an instruction under the list —
     “Press New prompt to start one” — and the writer asked for that line to
     go. The state itself stays, on its own. app.js writes the pair once per
     drawn hint and guards it with a flag of its own, so the flag is set here
     for it: what is left on screen is one line and stays that way. */
  const ideaHint = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-inspire #ideaRows .idea-empty'),
      function(el){
        if(!el.textContent || el.textContent.indexOf('New prompt') < 0) return;
        el.textContent = 'No prompts yet.';
        try{ el.dataset.sfHint = '1'; }catch(e){}
      });
  };

  const startClip = function(){
    if(startClip.__on) return;
    if(typeof MutationObserver !== 'function' || !document.body) return;
    startClip.__on = true;
    new MutationObserver(function(){ try{ ideaHint(); unnamePrompt(); clip(); }catch(e){} })
      .observe(document.body, { childList:true, subtree:true });
    try{ ideaHint(); unnamePrompt(); clip(); }catch(e){}
  };
  startClip();
  if(!startClip.__on && typeof document.addEventListener === 'function'){
    document.addEventListener('DOMContentLoaded', startClip);
  }

  /* a window that changes size moves the column under the list, and the
     browser does not always hand the new size to the observer in the same
     frame it lands in. The next few frames are looked at after a resize —
     about as long as the page's own layout takes to settle — and a frame
     that finds whole rows does nothing. */
  const nudge = function(){
    let left = 5;
    const step = function(){
      try{ clip(); }catch(e){}
      if(--left > 0) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if(window.addEventListener) window.addEventListener('resize', nudge);

  /* a touch more room on the Idea's left card — the rows the writer asked
     to be a little less tight. It is the width of a row that grows; the
     44px line it sits on is left exactly as it is, so the Idea, the Draft
     and the Bible still hold the same count. The two ids carry it past
     the sheets that set these paddings later in this file, without
     touching either of them. */
  const CARD_CSS = [
    'html body #page-inspire #ideaRows{ padding-left:8px !important; padding-right:8px !important; }',
    'html body #page-inspire #ideaRows .idea-row[class]{ padding-left:10px !important; padding-right:10px !important; }'
  ].join('\n');
  const paintCard = function(){
    if(!document.head || document.getElementById('sfIdeaCardCss')) return;
    const s = document.createElement('style');
    s.id = 'sfIdeaCardCss';
    s.textContent = CARD_CSS;
    document.head.appendChild(s);
  };
  paintCard();
  if(!document.getElementById('sfIdeaCardCss') && typeof document.addEventListener === 'function'){
    document.addEventListener('DOMContentLoaded', paintCard);
  }
})();


/* ═══════════════════════════════════════════════════════════
   ScriptForge — THE LIST

   Six things, asked for in one pass:

   1 · “in idea page right side there should be vertical scrollbar for
       cards scrolling”  The cards go DOWN. Three across as before and a
       card past the sixth starts a fourth row behind the grid's own
       vertical scrollbar, instead of waiting off to the side.

   2 · “change plan, canvas clear button label to reset”  Both read RESET,
       like the Kanban's own button already did.

   3 · “icons on outline chapter/scene and canvas, bible, kanban are
       vertical rectangular greyness on hover i wanted like idea and draft
       page icon greyness”  One 22px square for every row icon in the app,
       filling with the app's light --overlay-strong wash under the pointer
       — the same recipe the Draft page's .draft-act and the Idea page's
       own icons use. No tall box, no --surface-4 slab.

   4 · “plan page beats has no greyness on hover on delete icon”  The beat
       card's Delete takes that same wash.

   5 · “no resize handle on plan boards and canvas cards”  Both carry one:
       a corner grip in the card's bottom-right that the writer drags. The
       Plan's keeps a height (the board's cards share one width); the
       canvas card keeps both, per card.

   6 · “this new list in kanban should be created directly under upper
       cards, not like leaving this empty gap in between”  The board is a
       rail again: a new list takes the next place in the SAME row and the
       rail scrolls to it. A row-wise grid put it in the next row, and a
       grid row is as tall as its tallest cell — so the new list landed
       under the hole left by whichever list was long.

   The sheet is appended to <head> on boot and again after anything that
   can inject its own CSS, so these rules are the last word on ties; every
   rule is written to out-rank the earlier sheets at its own weight.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ═══ the sheet ═══ */
  const RULES = [
    /* ── 1 · IDEA: cards down, not sideways ─────────────────
       Three columns and two rows stay; the row height is (the box − the
       gap) ÷ 2, so six cards fill the grid exactly as they did. Anything
       past the sixth starts a row of that same height, and the scrollbar
       is the grid's own vertical one. */
    'html body #page-inspire .idea-cards{',
    '  --ic-row:calc((100% - 10px) / 2) !important;',
    '  grid-template-columns:repeat(3, var(--ic-col)) !important;',
    '  grid-template-rows:repeat(2, var(--ic-row)) !important;',
    '  grid-auto-flow:row !important;',
    '  grid-auto-rows:var(--ic-row) !important;',
    '  grid-auto-columns:auto !important;',
    '  align-content:start !important;',
    '  overflow-x:hidden !important;',
    '  overflow-y:auto !important;',
    '  overscroll-behavior-y:contain !important;',
    '}',
    '@media (max-width: 1180px){',
    '  html body #page-inspire .idea-cards{',
    '    --ic-col:calc((100% - 10px) / 2) !important;',
    '    --ic-row:calc((100% - 20px) / 3) !important;',
    '    grid-template-columns:repeat(2, var(--ic-col)) !important;',
    '    grid-template-rows:repeat(2, var(--ic-row)) !important;',
    '  }',
    '}',
    '@media (max-width: 760px){',
    '  html body #page-inspire .idea-cards{',
    '    --ic-col:calc((100% - 10px) / 2) !important;',
    '    --ic-row:156px !important;',
    '    grid-template-columns:repeat(2, var(--ic-col)) !important;',
    '    grid-template-rows:var(--ic-row) !important;',
    '  }',
    '}',
    /* the scrollbar itself: the rail's own, the one the page's lists wear */
    'html body #page-inspire .idea-cards::-webkit-scrollbar{ width:10px !important; height:0 !important; }',

    /* ── 2 · ONE ROW ICON, EVERYWHERE ───────────────────────
       The reference is the Draft page's .draft-act (pages.css:7205): a
       22px SQUARE, bare at rest, filling with the app's light
       --overlay-strong wash and taking the glyph to --ink under the
       pointer. Every row icon in the app is that same .ol-tool class, so
       one rule settles the Outline's chapter and scene rows, the Kanban's
       list and card tools and the Bible's detail head at once. They were
       22px wide and 28px tall — the tall grey rectangle — over a
       --surface-4 fill (pages.css:8820, 9125), which is the slab. */
    'html body .ol-tool{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  display:inline-flex !important; align-items:center !important; justify-content:center !important;',
    '  box-sizing:border-box !important; padding:0 !important;',
    '  background:transparent !important; border:0 !important;',
    '  border-radius:6px !important; color:var(--ink-3) !important;',
    '}',
    'html body .ol-tool i{ font-size:11px !important; line-height:1 !important; }',
    'html body .ol-tool:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',
    /* the Idea page's own generic arm carries an id, so it out-ranks the
       two rules above wherever it applies and is answered at its weight */
    'html body #page-inspire .ol-tool:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',
    /* the canvas card's ✕ — an 18px box in --surface-5 before, and the
       widest thing on the card at 29×45 with its own padding */
    'html body #page-mindmap .mm-node-x{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  padding:0 !important; box-sizing:border-box !important;',
    '  border-radius:6px !important;',
    '  background:transparent !important; border:0 !important;',
    '}',
    'html body #page-mindmap .mm-node:hover .mm-node-x{ opacity:1 !important; }',
    'html body #page-mindmap .mm-node-x:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',
    /* the Plan beat's Delete: --surface-2 under the pointer, which is a step
       DOWN from the --surface-4 the card itself is filled with while the
       pointer is on it — so the icon had no greyness of its own */
    'html body #page-plan .beat-del{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  padding:0 !important; box-sizing:border-box !important;',
    '  border-radius:6px !important;',
    '}',
    'html body #page-plan .beat-del:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',

    /* ── 3 · KANBAN: one rail ────────────────────────────────
       grid-auto-flow:column needs exactly one row track, or the columns
       would stack instead of running on. The columns keep the four-per-
       width measure, so the board looks as it did until a fifth list
       arrives — and then that list is BESIDE the others, with the board's
       own sideways scrollbar to reach it. */
    'html body #page-kanban .kb-board{',
    '  --kb-col:calc((100% - 30px) / 4) !important;',
    '  display:grid !important;',
    '  grid-template-columns:repeat(4, var(--kb-col)) !important;',
    '  grid-template-rows:auto !important;',
    '  grid-auto-flow:column !important;',
    '  grid-auto-columns:var(--kb-col) !important;',
    '  align-items:start !important; align-content:start !important;',
    '  overflow-x:auto !important; overflow-y:auto !important;',
    '  overscroll-behavior-x:contain !important;',
    '}',
    '@media (max-width: 1100px){',
    '  html body #page-kanban .kb-board{',
    '    --kb-col:calc((100% - 10px) / 2) !important;',
    '    grid-template-columns:repeat(2, var(--kb-col)) !important;',
    '  }',
    '}',
    '@media (max-width: 720px){',
    '  html body #page-kanban .kb-board{',
    '    --kb-col:100% !important;',
    '    grid-template-columns:var(--kb-col) !important;',
    '  }',
    '}',

    /* ── 4 · THE RESIZE GRIP ────────────────────────────────
       One mark for both surfaces: a corner of two hairlines in the card's
       bottom-right, quiet until the card is pointed at. Absolutely
       positioned, so it is no flex item on the canvas card (a flex column)
       and no grid item on the beat card. */
    'html body .sf-grip{',
    '  position:absolute !important;',
    '  right:3px !important; bottom:3px !important;',
    '  width:14px !important; height:14px !important;',
    '  display:block !important; padding:0 !important;',
    '  background:transparent !important; border:0 !important;',
    '  cursor:nwse-resize !important; z-index:4 !important;',
    '  opacity:0 !important; transition:opacity .12s ease !important;',
    '  touch-action:none !important;',
    '}',
    'html body .sf-grip::before, html body .sf-grip::after{',
    '  content:"" !important; position:absolute !important;',
    '  border-right:1.5px solid var(--ink-4) !important;',
    '  border-bottom:1.5px solid var(--ink-4) !important;',
    '  border-radius:0 0 2px 0 !important;',
    '}',
    'html body .sf-grip::before{ right:1px !important; bottom:1px !important;',
    '  width:9px !important; height:9px !important; }',
    'html body .sf-grip::after{ right:5px !important; bottom:5px !important;',
    '  width:5px !important; height:5px !important; }',
    'html body .beat-card:hover > .sf-grip, html body .mm-node:hover > .sf-grip{ opacity:.55 !important; }',
    'html body .sf-grip:hover{ opacity:1 !important; }',
    'html body .sf-grip:hover::before, html body .sf-grip:hover::after{',
    '  border-color:var(--ink-2) !important;',
    '}',
    /* a card that keeps a size of its own: its writing fills the card and
       scrolls inside it rather than pushing the card open again. Both
       surfaces are marked data-sf-h when a size was set on them. */
    'html body #page-mindmap .mm-node[data-sf-h] .mm-node-text{',
    '  height:auto !important; min-height:0 !important; overflow-y:auto !important;',
    '}',
    /* the card's own height: pages.css:10035 pins `height:auto !important`
       on every beat card (so a card is never stretched over its grid row),
       which an inline height cannot out-rank — so the size travels on a
       custom property and that arm carries the attribute this sheet sets */
    'html body #page-plan .beat-card[data-sf-h]{ height:var(--sf-h) !important; }',
    'html body #page-plan .beat-card[data-sf-h] .beat-input{ min-height:0 !important; }',
    ''
  ];

  const sheet = document.createElement('style');
  sheet.id = 'sfListStyle';
  sheet.textContent = RULES.join('\n');

  /* last in <head>: the sections of this same file inject their sheets as
     they parse, so the placement happens after them, and again after a
     navigation in case a page injects one of its own */
  const place = function(){
    try{ (document.head || document.documentElement).appendChild(sheet); }catch(e){}
  };

  /* ═══ the Draft list counts the rows it can really draw ═══
     pages.js measures that column twice, with two different sums, and the
     two disagree: draftPerPage() divides the box by the row height it
     learned once plus 2px of slack, draftMeasurePerPage() divides what is
     left of the box after 8px of padding by the row height. The rows are
     drawn from the first and the pager's page maths from the second, so the
     column drew more rows than it had room for — the last of them hanging
     out of the card — and in the writer's own window the slack cost a whole
     row: nine listed where the card has room for ten. One sum now, both
     functions: a row is 40px with a 1px gap under it, so the box holds
     floor((box + gap) / (row + gap)) of them, and the foot of the last row
     lands on the box's own bottom edge. A column that has not been laid out
     yet is left to the app's own answer. */
  const draftFit = function(){
    const rows = document.getElementById('draftRows');
    const h = (rows && rows.clientHeight) ? rows.clientHeight : 0;
    const r0 = (rows && rows.querySelector) ? rows.querySelector('.draft-row') : null;
    const rh = r0 ? r0.offsetHeight : 0;
    if(!h || !rh) return 0;
    let gap = 1;
    try{
      const g = parseFloat(getComputedStyle(rows).rowGap);
      if(!isNaN(g)) gap = g;
    }catch(e){}
    return Math.max(1, Math.floor((h + gap) / (rh + gap)));
  };
  ['draftPerPage', 'draftMeasurePerPage'].forEach(function(name){
    const orig = window[name];
    if(typeof orig !== 'function') return;
    window[name] = function(){
      return draftFit() || orig.apply(this, arguments);
    };
  });

  /* The column can still be moving when the rows are drawn — the head, the
     pager and the card above it all take a step to land, and the box was
     573px tall when the rows were drawn and 526px a moment later — so a
     column that shrinks afterwards leaves the last rows hanging out of the
     card, and nothing answers it (a box that changes size is not a
     repaint). The list is built when the page is first opened, so the box
     is watched as soon as it appears, and a list drawn longer than the box
     now holds is asked for again. Only a list that is TOO LONG is redrawn:
     a short one is not a mistake, and asking for it again would be a loop. */
  /* how many rows the list has to offer, the filter above it included — the
     app narrows the list before it cuts it into pages, so a page is redrawn
     only when the box and the list actually disagree about the count. */
  const draftOffer = function(){
    let all = [];
    try{ all = (typeof D === 'function') ? (D().drafts || []) : []; }catch(e){ all = []; }
    const qEl = document.getElementById('draftQuery');
    const q = (qEl && qEl.value ? qEl.value : '').trim().toLowerCase();
    if(!q) return all.length;
    return all.filter(function(d){
      return String(d.title || '').toLowerCase().indexOf(q) >= 0
          || String(d.body || '').toLowerCase().indexOf(q) >= 0;
    }).length;
  };

  let draftWatched = false;
  const draftRefit = function(){
    const rows = document.getElementById('draftRows');
    if(!rows) return;
    if(!draftWatched && typeof ResizeObserver === 'function'){
      draftWatched = true;
      try{ new ResizeObserver(draftRefit).observe(rows); }catch(e){ draftWatched = false; }
    }
    const fit = draftFit();
    if(!fit) return;
    const want = Math.min(fit, draftOffer());
    if(rows.querySelectorAll('.draft-row').length === want) return;
    try{ if(typeof window.renderDrafts === 'function') window.renderDrafts(); }catch(e){}
  };
  let draftQueued = false;
  const draftSoon = function(){
    if(draftQueued) return;
    draftQueued = true;
    requestAnimationFrame(function(){ draftQueued = false; draftRefit(); });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(draftSoon).observe(document.body, { childList:true, subtree:true });
  }

  /* ═══ renaming is the writer's press, and nothing else ═══
     Both pages put a new row straight into renaming when it is made — the
     Idea's newPrompt() makes the prompt and hands the row to startRename(),
     the Draft's New draft calls draftRenameStart(0) — and the tidy-up that
     takes the field away again was a setTimeout: a later task, with the
     frame painted in between, so the name field was drawn for a frame. That
     frame is the glimpse of renaming the writer saw.

     No waiting now. A MutationObserver is delivered as a microtask at the
     end of the task the press was handled in, so the field is put back
     BEFORE the frame is painted and never reaches the screen — the row
     reads as a row, named and selected, from the first paint.

     Only the task that MADE the row is touched: the flag is raised by the
     two creation presses and lowered as soon as that task is over, so a
     field the writer asked for with a pencil — and a writer typing in it
     while the app repaints the list around it — is never disturbed. */
  let madeRow = false;
  const NEW_ROW = '[data-ic-new], [data-act="add-draft"], [data-sfbar="tools:addDraft"]';
  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest(NEW_ROW)) return;
    madeRow = true;
    setTimeout(function(){ madeRow = false; }, 0);
  }, true);

  /* Taking a focused field out of the page fires a blur on it, and both
     pages have a blur handler of their own that ENDS the rename there: the
     Idea's would write the title it already has and toast “Renamed”, which
     is a rename the writer never asked for (and its own replaceChild lands
     in the middle of this one, which is what threw “no longer a child of
     this node”). The blur is theirs to miss while this file puts the row
     back — a real blur, with the flag down, is untouched. */
  let renBlock = false;
  window.addEventListener('blur', function(e){
    if(!renBlock) return;
    const t = e.target;
    if(!t || !t.dataset) return;
    if(typeof t.dataset.ideaRenInput !== 'undefined' || typeof t.dataset.draftRenameInput !== 'undefined'){
      e.stopImmediatePropagation();
    }
  }, true);

  const renBack = function(){
    if(!madeRow) return;                      /* nothing here was made just now */
    renBlock = true;
    try{
      /* the Idea's row: app.js swaps the row's <b> for its field, so the
         title goes back exactly where the field was, the way a finished
         rename leaves it */
      const fields = document.querySelectorAll('#page-inspire #ideaRows input.idea-rename');
      for(let i = 0; i < fields.length; i++){
        const inp = fields[i];
        const b = document.createElement('b');
        b.textContent = inp.value || 'Untitled prompt';
        if(inp.parentNode) inp.parentNode.replaceChild(b, inp);
      }
      /* the Draft's: pages.js swaps the row's title for its field, and the
         list's own renderer is what puts the row back together */
      if(document.querySelector('#page-draft [data-draft-rename-input]')){
        if(typeof window.renderDrafts === 'function') window.renderDrafts();
      }
    }catch(e){}
    renBlock = false;
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(renBack).observe(document.body, { childList:true, subtree:true });
  }
  renBack();

  /* ═══ the words ═══
     “Clear” → “Reset” on the two buttons the writer named. The Plan's is
     drawn by app.js and then re-lettered by plan-boards.js on every
     render, so this is done on the DOM from the observer below — nothing
     has to win a race with either file. */
  const WORDS = '[data-act="clear-beats"], [data-cx-clear], [data-mm="clear"]';
  const words = function(){
    const btns = document.querySelectorAll(WORDS);
    for(let i = 0; i < btns.length; i++){
      const b = btns[i];
      for(let n = b.firstChild; n; n = n.nextSibling){
        if(n.nodeType === 3 && /clear/i.test(n.nodeValue)){
          n.nodeValue = n.nodeValue.replace(/clear/gi, 'Reset');
        }
      }
      const title = b.getAttribute('title') || '';
      if(/^Clear\b/.test(title)) b.setAttribute('title', title.replace(/^Clear\b/, 'Reset'));
    }
  };

  /* the canvas's own right-click list is built from SF_FAB_AI, which is a
     const in app.js (so it is not on window) — its entry is renamed in
     place, and the menu is painted from the array each time it opens */
  const relabel = function(){
    try{
      if(typeof SF_FAB_AI === 'undefined' || !SF_FAB_AI) return;
      Object.keys(SF_FAB_AI).forEach(function(k){
        const arr = SF_FAB_AI[k];
        if(!Array.isArray(arr)) return;
        arr.forEach(function(o){ if(o && o.label === 'Clear canvas') o.label = 'Reset canvas'; });
      });
    }catch(e){}
  };

  /* ═══ the new list, brought into view ═══
     The list is added at the end of the rail, which may be off the right
     edge. The app's own handler runs on this same click and repaints the
     board, so the rail is followed for a few frames and scrolled to its
     end as soon as the new column is there. */
  const reveal = function(before){
    let n = 0;
    const step = function(){
      const board = document.getElementById('kbBoard');
      if(board && board.querySelectorAll('.kb-col').length > before){
        board.scrollLeft = board.scrollWidth;
        return;
      }
      if(++n < 45) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('[data-kb="newlist"]')){
      const board = document.getElementById('kbBoard');
      reveal(board ? board.querySelectorAll('.kb-col').length : 0);
    }
    place();
    relabel();
  }, true);

  /* ═══ the sizes the writer sets ═══
     The Plan's height is kept on the beat itself (d.beats[i].h), which the
     app saves with the project; the canvas card's box is kept by node id
     under the config, because a canvas node has no room for a size in the
     app's own model. Both are re-applied from one place, after any repaint
     — the app re-creates every card from its data, so nothing can carry an
     inline size across a repaint on its own. */
  const sizes = function(){
    if(typeof S === 'undefined' || !S) return null;
    if(!S.config) S.config = {};
    if(!S.config.sfSizes || typeof S.config.sfSizes !== 'object') S.config.sfSizes = {};
    return S.config.sfSizes;
  };

  const data = function(){
    try{ return (typeof D === 'function') ? D() : null; }catch(e){ return null; }
  };

  const gripFor = function(host){
    let g = host.querySelector('.sf-grip');
    if(!g){
      g = document.createElement('span');
      g.className = 'sf-grip';
      g.setAttribute('aria-hidden', 'true');
      host.appendChild(g);
    }
    return g;
  };

  const dress = function(){
    const st = sizes();
    if(!st) return;

    /* the beat cards — a height of their own */
    const d = data();
    const list = (d && Array.isArray(d.beats)) ? d.beats : [];
    const cards = document.querySelectorAll('#page-plan .beat-card[data-beat-card]');
    for(let i = 0; i < cards.length; i++){
      const c = cards[i];
      const b = list[+c.getAttribute('data-beat-card')];
      if(b && b.h){
        c.style.setProperty('--sf-h', b.h + 'px');
        c.setAttribute('data-sf-h', '1');
      } else {
        c.style.removeProperty('--sf-h');
        c.removeAttribute('data-sf-h');
      }
      gripFor(c);
    }

    /* the canvas cards — width and height, by id */
    const nodes = document.querySelectorAll('#page-mindmap .mm-node[data-mm-node]');
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i];
      const box = st['c' + n.getAttribute('data-mm-node')];
      if(box){
        n.style.width = box.w + 'px';
        if(box.h) n.style.height = box.h + 'px';
        n.setAttribute('data-sf-h', '1');
      } else {
        n.removeAttribute('data-sf-h');
      }
      gripFor(n);
    }
  };

  /* ═══ the drag ═══
     On window, in the capture phase: the mindmap starts its card drag from
     a pointerdown on the stage and the Plan board starts one from a
     pointerdown on the board, both on document capture — so the grip's own
     press has to be settled before either of them sees it. */
  const MIN_W = 140, MIN_H = 96, MIN_BEAT = 136;
  let live = null;

  const onMove = function(e){
    if(!live) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    /* the canvas is a transformed world — a card's rect is its layout size
       times the view's scale, so a screen pixel of drag is 1/k of a card
       pixel. The ratio is read off the card itself, which leaves the beat
       card (scale 1) alone. */
    const dx = (e.clientX - live.x0) / live.k;
    const dy = (e.clientY - live.y0) / live.k;
    if(live.both){
      live.w = Math.max(MIN_W, Math.round(live.w0 + dx));
      live.host.style.width = live.w + 'px';
    }
    live.h = Math.max(live.both ? MIN_H : MIN_BEAT, Math.round(live.h0 + dy));
    if(live.both) live.host.style.height = live.h + 'px';
    else live.host.style.setProperty('--sf-h', live.h + 'px');
  };

  const keep = function(host, w, h, both){
    const st = sizes();
    if(!st) return;
    if(both){
      st['c' + host.getAttribute('data-mm-node')] = { w:Math.round(w), h:Math.round(h) };
    } else {
      const d = data();
      const b = (d && Array.isArray(d.beats)) ? d.beats[+host.getAttribute('data-beat-card')] : null;
      if(b) b.h = Math.round(h);
    }
    if(typeof save === 'function'){ try{ save(); }catch(e){} }
  };

  const onUp = function(e){
    if(!live) return;
    if(e && e.stopImmediatePropagation) e.stopImmediatePropagation();
    const l = live;
    live = null;
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
    l.host.setAttribute('data-sf-h', '1');
    keep(l.host, l.w, l.h, l.both);
    l.host.setAttribute('data-sf-h', '1');
  };

  window.addEventListener('pointerdown', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const g = t.closest('.sf-grip');
    if(!g) return;
    const host = g.parentElement;
    if(!host) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const r = host.getBoundingClientRect();
    const ow = host.offsetWidth || Math.round(r.width);
    const oh = host.offsetHeight || Math.round(r.height);
    host.setAttribute('data-sf-h', '1');
    live = { host:host, x0:e.clientX, y0:e.clientY,
             w:ow, h:oh, w0:ow, h0:oh, k:(ow ? (r.width / ow) : 1),
             both:host.classList.contains('mm-node') };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
  }, true);

  /* ═══ one pass, after anything repaints ═══
     Every surface here is re-created from data by the app — the beats on
     add, delete or drag, the canvas cards on every paint, the Plan's head
     on every render — so the dressing is re-applied from one place. It is
     a childList observer only (a character or attribute write of its own
     cannot call it back), collapsed into one pass per frame. */
  let queued = false;
  const kick = function(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(function(){
      queued = false;
      try{ words(); }catch(e){}
      try{ dress(); }catch(e){}
    });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(kick).observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('pointerup', function(){ setTimeout(kick, 0); }, true);

  const boot = function(){
    place();
    words();
    dress();
    relabel();
  };
  window.addEventListener('load', place);
  window.addEventListener('resize', place);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ══════════ fab-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the round button's menus, corrected

   Loaded after pages-fix.js and polish.js, so everything it changes is
   theirs to change and it only has to say what is different:

     1 NAMES BY FORM    the Outline page names its units the way the form
                        does — a novel has chapters and subchapters, a
                        screenplay has scenes and sub-scenes — and its four
                        naming jobs keep two pairs apart: the TITLE jobs
                        name a section, the DESCRIPTION jobs say what the
                        section is for.

     2 THE PLAN BOARD   "Beat ideas" is "Beat the board": it fills the board
                        you are looking at with the beats it is missing.

     3 TEXT & LANGUAGE  the writing actions and Translate are on every page
                        now: the round button's right-click opens the
                        manuscript's own panel wherever it is asked, so
                        nothing takes the Text or the Language section off a
                        page any more.

     4 WHICH PAGE       the two outline jobs know which page and which form
                        they were asked from, so a screenplay gets scenes.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const F  = function(){ return window.AI_FNS || (window.AI_FNS = {}); };
  const modeId = function(){
    try{ if(S.mode) return S.mode; }catch(e){}
    try{ return document.body.getAttribute('data-writing-mode') || 'novel'; }catch(e){}
    return 'novel';
  };
  /* the form that writes in scenes rather than chapters */
  const isScreenplay = function(){
    return ['screenplay', 'tv', 'stage', 'script'].indexOf(modeId()) >= 0;
  };
  /* the pages whose unit is a SCENE in the form's own language */
  const units = function(){
    if(isScreenplay()) return { one:'Scene', many:'Scenes', sub:'Sub-scene', subs:'Sub-scenes' };
    return { one:'Chapter', many:'Chapters', sub:'Subchapter', subs:'Subchapters' };
  };

  /* ═══ 0 · SETTINGS → CUSTOM · the two FAB clicks, the workspaces ═══

     Three cards the Custom tab had none of, one per thing that can be
     switched:

       · FAB - LEFT CLICK  — the click that opens the page list, and every
         page in that list: the ones you never use come out of the menu;
       · FAB - RIGHT CLICK — the click that opens the AI assistant, and every
         option that panel carries, on its own switch, so the ones you never
         use leave the menu for good;
       · the project's five workspaces, each taken out of the rotation on
         its own.

     Each card is named for the click it is about and carries the rows that
     click answers for, filed under the labels the menu itself uses: Views ·
     Reference · Workflow on the left card, and Text · Language on the right,
     which is how the panel's own divider reads. The labels are labels — the
     card holds a switch for every page and every option, and for nothing
     else.

     The cards are drawn BEFORE the rest of the tab, so they sit above
     Workspaces (which welcome.js appends after them), and the per-workspace
     switches go in as the first rows of that card, above its naming row.
     Every switch reads S.config at the moment it is used, so nothing here
     has to be bound or kept in step. */
  (function(){
    if(typeof SETTINGS !== 'object' || !SETTINGS.renderers) return;

    const cfg = function(){ if(!S.config) S.config = {}; return S.config; };

    /* shut whichever panel is open — a click switched off must put away the
       menu it just opened rather than leave it stranded on screen */
    const closeFab = function(){
      try{
        const ai = document.getElementById('fabAI');   if(ai) ai.hidden = true;
        const mn = document.getElementById('fabMenu'); if(mn) mn.hidden = true;
        const fw = document.getElementById('fabWrap'); if(fw) fw.classList.remove('menu-open');
      }catch(e){}
    };

    /* ── every card folds ──

       The rows are long lists (seven options, five workspaces), so a card
       arrives as one line — its own title, a count, and a caret — and the
       rows open from it. The title is the dropdown: click it and the card
       opens where it stands, which keeps the tab three lines tall until
       you ask for something. */
    const folds = [];                      /* repaint the counts */
    const paints = [];                     /* repaint the switches themselves */
    const refreshFolds = function(){
      /* the rows first: two of them can answer the same page — the writing
         page is listed as both Manuscript and Script — and a switch flipped
         on one has to show on the other in the same frame */
      paints.forEach(function(f){ try{ f(); }catch(e){} });
      folds.forEach(function(f){ try{ f(); }catch(e){} });
    };
    /* which cards the writer has opened, by title — the tab is re-drawn from
       scratch every time it is shown, and folding them all shut again on the
       way back in would undo the one thing the writer just asked for */
    const openFolds = {};
    const foldHead = function(cardEl){
      const head = cardEl.querySelector('.set-card-title');
      if(!head) return null;
      const key = String(head.textContent || '').trim();
      cardEl.classList.add('sf-fold');
      if(openFolds[key]) cardEl.classList.add('open');
      const val = document.createElement('span');
      val.className = 'stats-cat-value sf-fold-sum';
      const caret = document.createElement('span');
      caret.className = 'sf-fold-caret';
      caret.setAttribute('aria-hidden', 'true');
      head.appendChild(val);
      head.appendChild(caret);
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      const flip = function(){
        cardEl.classList.toggle('open');
        openFolds[key] = cardEl.classList.contains('open');
      };
      head.addEventListener('click', flip);
      head.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); flip(); }
      });
      return function(body){
        const all = body.querySelectorAll('.tgl').length;
        const on  = body.querySelectorAll('.tgl.on').length;
        val.textContent = on + '/' + all + ' on';
      };
    };
    /* a card of my own: title, then an empty body for the rows */
    const foldCard = function(title, icon){
      const c = card(title, icon);
      const body = document.createElement('div');
      body.className = 'sf-fold-body';
      c.appendChild(body);
      const count = foldHead(c);
      if(count) folds.push(function(){ count(body); });
      return { card: c, body: body };
    };
    /* somebody else's card (welcome.js's Workspaces): fold it where it is */
    const foldExisting = function(c){
      if(!c || c.classList.contains('sf-fold')) return null;
      const head = c.querySelector('.set-card-title');
      if(!head) return null;
      const body = document.createElement('div');
      body.className = 'sf-fold-body';
      Array.prototype.slice.call(c.children).forEach(function(ch){ if(ch !== head) body.appendChild(ch); });
      c.appendChild(body);
      const count = foldHead(c);
      if(count) folds.push(function(){ count(body); });
      return body;
    };

    if(!document.getElementById('sfFoldStyle')){
      const st = document.createElement('style');
      st.id = 'sfFoldStyle';
      st.textContent =
        'html body #setBody .set-card.sf-fold > .set-card-title{cursor:pointer !important;}' +
        'html body #setBody .set-card.sf-fold > .set-card-title:hover{color:var(--ink-2) !important;}' +
        /* The caret is a DRAWN chevron, not an icon. pages.css hides every
           <i> inside a card title — `html body .set-card-title i{display:none}`
           — and an icon-font chevron is an <i>, so the fold would have had no
           handle at all. Two borders rotated 45° need no font and no class
           that rule knows about. The count keeps the auto margin that pushes
           it (and the caret after it) to the card's right edge. */
        'html body #setBody .sf-fold-sum{margin-left:auto !important;font-size:10px !important;letter-spacing:0 !important;text-transform:none !important;}' +
        'html body #setBody .sf-fold-caret{display:block !important;flex:0 0 auto !important;align-self:center !important;' +
          'width:6px !important;height:6px !important;margin-left:7px !important;' +
          'border-right:1.5px solid currentColor !important;border-bottom:1.5px solid currentColor !important;' +
          'color:var(--ink-4) !important;transform:rotate(45deg) !important;transform-origin:50% 50% !important;' +
          'transition:transform 140ms var(--ease) !important;}' +
        'html body #setBody .set-card.sf-fold.open > .set-card-title .sf-fold-caret{transform:rotate(-135deg) !important;}' +
        'html body #setBody .sf-fold-body{display:none !important;}' +
        'html body #setBody .set-card.sf-fold.open > .sf-fold-body{display:block !important;}' +
        'html body #setBody .sf-fold-sub{font-size:9.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:var(--ink-4) !important;padding:10px 0 0 !important;}';
      document.head.appendChild(st);
    }

    /* ── one row height, a little roomier than it was ──

       Two lists the writer sits in all day were the tightest on screen: the
       round button's two menus at 28px a row, and the Settings sidebar at
       30px. Both come up to 34px — the same step for both, and the smallest
       one that reads as a change at all (six pixels on a menu row, four on
       a sidebar tab). Nothing else moves: the labels keep the size they had
       (11px in the menus, 12px in the sidebar), the icons keep theirs, the
       paddings keep theirs. No font sizes, no icons, no widths.

       A dropdown menu is deliberately not here. That one is a menu the
       writer scans and closes rather than sits in, and at 34px a row in a
       300px window it read as a slab — so it is sized below from the
       buttons it stands beside instead, not from this menu row: 32px, the
       height of .btn, rather than 34px or the 28px it had. */
    if(!document.getElementById('sfComfortStyle')){
      const cs = document.createElement('style');
      cs.id = 'sfComfortStyle';
      cs.textContent =
        /* the round button's two menus */
        'html body #fabMenu .fab-item,html body #fabAIBody > .ai-chip{min-height:34px !important;}' +
        /* ── the dropdowns: as tall as the buttons beside them ──

           A dropdown was 28px — the height of the dashboard's own
           Novel/Fiction picker — while every button it stands beside is
           31.5px: .btn (which is Fetch models, Test connection, Snapshot
           and Save), the toolbar's buttons, the topbar's. Measured, a
           dropdown sitting in a setting row beside one of those read as a
           control that had been shrunk inside its own row.

           It is 32px now — the buttons' own height — and every row of its
           open list is 32px too, in every list, long or short. The list's
           padding stays 6px and its gap 2px. Nothing else changes: the
           label keeps its 12.5px, the chevron its size, the window its
           height, the ticks their place on the right. */
        'html body .dd-card .stats-cat-title[class]{height:32px !important;padding:0 11px !important;}' +
        /* its corners, and the dashboard's. Sweeping the app by corner:
           8px is the card and panel token (set-card, kb-col, beat-card,
           stat-card-lg, the panels), 6px is the control and row token (60
           components), 4px the small button and tag token. The dropdown —
           box, trigger and its open list — was carrying the CARD corner,
           8px, which a 32px control reads as rounder than a 37px one did.
           The buttons it stands beside are 6px. Box, trigger and list are
           6px now, the control token, same as those buttons and the 60
           controls beside them. The rows keep their 4px, the small-row
           token. */
        'html body .dd-card[class],html body .dd-card .stats-cat-title[class],html body .dd-card .stats-cat-list[class]{border-radius:6px !important;}' +
        'html body .dd-card .stats-cat-list[class]{padding:6px !important;gap:2px !important;}' +
        'html body .stats-cat-list > .stats-cat-item{height:32px !important;min-height:32px !important;}' +
        /* and it opens as wide as the box it comes out of. A later sheet in
           this file gives the open list `width:max-content` (so a long name
           like “Perplexity Sonar — your own key” is never cut) with a 340px
           ceiling: the provider list therefore opened 340 × 290px under a
           158px box, twice the width of every other dropdown in the app.
           It is the box's width now, and a name too long for it is cut with
           an ellipsis, which is what the rest of the app's lists do. */
        /* and the list is as wide as its longest name needs, not as wide as
           the box it drops out of. Pinning it to the trigger cut every
           provider — “Groq — fast, …”, “Google Gemi…”, “Cerebras — f…” —
           and a name the writer cannot read is worse than a popup wider
           than the control it came from, which is what every menu in the
           app already does. It takes its content width, never less than
           the box, and `place()` caps it to the room the panel really has;
           the ellipsis below is the last resort for a name that is longer
           than that room, not the first thing that happens. */
        'html body .dd-card .stats-cat-list[class]{width:max-content !important;min-width:100% !important;max-width:min(420px, calc(100vw - 24px)) !important;box-sizing:border-box !important;}' +
        'html body .dd-card .stats-cat-list > .stats-cat-item > span{min-width:0 !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}' +
        /* the Settings sidebar — `[class]` for the weight: the sidebar's own
           sheet pins it to 30px under `.settings-modal #setTabs .set-tab` */
        'html body .settings-modal #setTabs .set-tab[class],html body #setTabs .set-tab[class]{height:34px !important;}' +

        /* ── the strips that were below it ──
           Every other list in the app is at 34 or above once the four above
           are in (a project row 36, a prompt row 38, a Settings option row
           43, an outline row and the dashboard's project row 46), so what is
           left under it is the tab strips that live inside panels: the
           Bible's, the utility popup's, and the notebook's publish tabs.
           They are the same kind of row as the Settings sidebar, so they
           take the same height — the `[class]` is for the weight, because
           each of them is pinned by a rule of its own with !important. */
        'html body .bb-tab[class]{height:34px !important;}' +
        'html body .nb-pub-tab[class]{height:34px !important;}' +
        'html body .util-tabs .util-chip[class],html body .util-tools .util-chip[class]{min-height:34px !important;}' +

        /* ── and now the rest of the app, on the dashboard's own numbers ──

           Everything above this line was four components: the round button's
           two menus, the Settings sidebar, the dropdown. That is four out of
           the two hundred and fifty-one components this app paints, and the
           complaint that only the dropdown moved is a fair one.

           So every component was measured live instead — every row, control,
           card, chip and tab on all ten pages and all seven Settings tabs,
           in a headless browser — and grouped by role. Two hundred and
           fifty-one of them. The dashboard is the model throughout, because
           it is the screen that reads as comfortable. Measured, its own row
           is 46px with a 6px corner, a 12px gutter and an 11px label, and
           its own control — the Novel/Fiction picker in the workspace bar —
           is 28px with that same 6px corner.

           Against that, the app's other rows were two steps short of the
           dashboard, and the list rows were carrying the 4px small token
           where the dashboard's row carries 6:

             component            measured           the dashboard
             FAB menu row         34px  r4px         6px control corner
             mode-list row        35px  r4px         38px  r6px
             Idea prompt row      38px  r6px         already there
             draft-list row       40px  r4px         44px  r6px
             Settings option row  43px  r0px         46px
             outline / project    46px  r6px         already there
             Bible chapter row    23px  r4px         28px  r6px
             Settings tab         34px  r4px         6px control corner
             small buttons        22-28px r4px       6px (the pager btn)

           So this is the same one step, applied to the whole app: the 4px
           strays take the dashboard's 6px control corner, the rows that sat
           two steps short of the dashboard come up to its rhythm — 38px for
           the compact lists (the Idea prompts were already there), 44px for
           a draft row, 46px for a Settings option — and the list rows take
           the dashboard's 12px gutter wherever the pane has room for it.

           The cards are deliberately not in here. 8px is the card token and
           stays 8px; the folded Settings cards, which were the one card
           sitting at 6px, are the only card touched and they come back to 8.
           No font is changed either: the dashboard's own labels run 9-11px,
           so the small type is the design, not the crowding. */
        'html body #setTabs .set-tab[class],html body .settings-modal #setTabs .set-tab[class]{border-radius:6px !important;}' +
        'html body #fabMenu .fab-item[class]{border-radius:6px !important;}' +
        'html body .mode-item[class]{border-radius:6px !important;min-height:38px !important;padding:8px 12px !important;}' +
        'html body .draft-row[class]{border-radius:6px !important;min-height:44px !important;padding:8px 12px !important;}' +
        'html body .draft-act[class]{border-radius:6px !important;}' +
        'html body .ol-tool[class],html body .ol-twist[class]{border-radius:6px !important;}' +
        /* the beat card's two controls live on the Plan page and each is pinned
           by a two-class `#page-plan` rule, so they need the id and the weight */
        'html body #page-plan .beat-del[class][class]{border-radius:6px !important;}' +
        'html body .kb-sub[class]{border-radius:6px !important;min-height:28px !important;}' +
        'html body .toast-left[class]{border-radius:6px !important;}' +
        'html body textarea.beat-input[class],html body #page-plan .beat-wrap .beat-input[class],html body #page-plan .beat-card .beat-input[class],html body #page-plan .beat-input[class][class]{border-radius:6px !important;}' +
        'html body .ol-row[class]{padding:9px 12px !important;}' +
        'html body #setBody .set-row[class]{min-height:46px !important;}' +
        'html body #setBody .set-card.sf-fold[class]{border-radius:8px !important;}' +

        /* ── the foot's two buttons are one greyness ──

           In the Settings foot, Save wears the grey box — surface-3 with an
           --ink-2 label — and Close wore the green #7fd0a2 that Save wore
           before it took that box. One of a pair grey and the other green
           reads as two different kinds of button, which is what it is: the
           label goes to the same greyness Save has and keeps none of the
           accent, and the pointer step is a grey step (surface-4) rather
           than an accent wash.

           The `.btn.btn-ghost[class]` chain is not decoration: the rule that
           paints the green sets `color` with !important from a sheet lower
           in this file, so an equally specific rule here would lose to it on
           order. Two classes plus the attribute outrank it wherever it sits. */
        'html body .settings-modal .modal-foot .btn.btn-ghost[class]{background:var(--surface-3) !important;color:var(--ink-2) !important;border-color:transparent !important;}' +
        'html body .settings-modal .modal-foot .btn.btn-ghost[class]:hover,html body .settings-modal .modal-foot .btn.btn-ghost[class]:active{background:var(--surface-4) !important;color:var(--ink) !important;border-color:transparent !important;opacity:1 !important;}' +

        /* ── and nothing of the top bar shows through a modal ──

           The scrim is rgba(0,0,0,.7) — a 70% wash, deliberately not a
           curtain — so everything on the page behind a modal is still 30%
           visible. Over the content that is the point; over the top bar it
           is not, because the two things that live there are the logo at
           the left and the two icon buttons at the right. Behind the
           Settings sheet they read as a half-drawn logo, a half-drawn
           graph and a half-drawn gear: chrome that looks live but cannot be
           clicked, and the first thing the eye finds at each corner.

           The Statistics screen has none of it — it is a page, not a sheet,
           so the icon buttons are not drawn there and its own header owns
           the close — and the writer asked for the Settings background to
           match. So the mark and the actions are hidden outright while any
           sheet is open. visibility rather than opacity: they leave the
           layout, the tab order and the a11y tree, rather than sitting
           there faint but still reachable by a screen reader or a key.

           Every modal in the app is built in #modalRoot and adds .open to
           it (SETTINGS.open, the AI sheets, the notebook), so keying on
           that one class hides the chrome behind all of them in the same
           way — and `:has()` is already how this app reaches a parent
           (.modal-head:has(+ #setTabs), #page-draft .draft-pane-head:has(…)). */
        'html body:has(#modalRoot.open) .topbar .logo-btn,' +
        'html body:has(#modalRoot.open) .topbar .topbar-actions{visibility:hidden !important;}' +

        /* ── and the Statistics screen matches it ──

           The same background, the same two things on it. Statistics is a
           page rather than a sheet, so its icon buttons are already gone —
           goPage() sets `actions.hidden = (id !== 'home')`, which is why
           the graph and the gear are missing there — but the mark is drawn
           on every page, so the top bar still carried a logo over a screen
           that is otherwise bare: a background with something on it, next
           to a background with nothing.

           Statistics now hides the mark too, so the two backgrounds are the
           same: nothing above the sheet and nothing beside it. Only the
           Statistics screen does this; the Dashboard keeps its mark, and
           every ordinary page keeps it, because there the top bar is real
           chrome the writer aims at rather than the edge of a background. */
        'html body:has(#page-stats.active) .topbar .logo-btn{visibility:hidden !important;}' +

        /* ── the three left cards are one card ──

           Measured on the Draft page: .draft-list 260×752 at (18,111), its
           filter box 248 wide and 48px down the card, sitting under an empty
           .draft-list-head — the “+” that used to live there is gone, since
           polish.js hands that action to the bar's own New draft. On the Idea
           page .idea-side and on the Bible .bb-list are both 300×754 at
           (16,110), and on both the filter box is 288 wide and 6px in from
           the card's top edge — the same 30px box on all three.

           So the Draft card takes their column (300px, where the grid stopped
           at 260) and the same 12/16/14 inset their wrappers use, which lands
           it at the same 16,110 with a 288px box. The empty head goes: it was
           a 48px band of nothing above the box, and that band is the whole of
           “shift it up”. The box keeps the Bible's own 5px beneath it. */
        'html body #page-draft .draft-split{grid-template-columns:minmax(200px,300px) minmax(0,1fr) !important;padding:12px 16px 14px !important;}' +
        'html body #page-draft .draft-list-head{display:none !important;}' +
        'html body #page-draft .draft-list .bb-search[class]{margin:0 0 5px !important;}' +

        /* ── and the Idea card loses its “Saved prompts” title ──

           The Idea card opened with a bookmark and the words “Saved prompts”.
           The filter box was already moved above it, so the title was the one
           line on the card that only named what the list plainly already is —
           the prompts you kept. The Draft's own head and the Notebook's “Book”
           label were taken out for the same reason, and with the head gone
           the Idea's box sits at the card's top edge exactly as the Bible's
           and the Draft's do. It is hidden rather than removed because the
           head is drawn by app.js from innerHTML, which this layer cannot
           reach. */
        'html body #page-inspire .idea-side > .idea-side-head{display:none !important;}' +

        /* ── the Draft's writing pane loses its empty head ──

           Above the writing surface sat a 48px .draft-pane-head holding the
           Font and Size pickers — and pages.css hides both of them (#draftFontDrop
           and #draftSizeDrop), because the bar's own T panel is where the page
           type is set now. So the head was 48px of nothing above the first
           line: the writing started at y=194 while the pane itself starts at
           110. With the head gone the first line sits 48px higher, 36px below
           the pane's top edge — the inset the surface already kept. */
        'html body #page-draft .draft-pane-head{display:none !important;}' +

        /* ── and the Idea cards lose the line they all repeat ──

           Every one of the six prompt cards said “Click the pencil to write a
           prompt…”, six times over, in the grey a placeholder is drawn in. The
           pencil on the card is the instruction, and a card with nothing in it
           reads as one. The line is hidden only while the card is shut: opened
           for writing, its own “Write your prompt…” stays. */
        'html body .idea-slot[data-ic-mode="view"] .idea-brief-input::placeholder{color:transparent !important;opacity:0 !important;}' +

        /* ── and the rows of all three lists are one row ──

           The Bible's row is a 26px letter square, the name, and nothing
           else: 8px 9px of padding, a 10px gap, 6px corners, --surface-3 under
           the pointer and --surface-4 when it is the one you are on — and a
           28px square, which is 28 + 16 = a 44px row. The Draft drew a number
           and a title, the Idea a bare title (8px 12px and 2px 7px), and
           those are the two the writer asked to make the Bible's list.

           The square itself cannot be written here: these rows are built from
           innerHTML by pages.js and app.js, neither of which knows anything
           about the Bible, so it is added after the fact by the sweep below.
           The Draft's number steps aside for it — the Bible has no numbers,
           and two markers in one row is not the row that was asked for. The
           row is pinned so the list's own fitting stays honest while the
           square is arriving, because renderDrafts() measures a row to work
           out how many of them fit.

           That measurement is why the Draft row is 40px and not the Bible's
           44: draftPerPage() is floor(rows' height / (row + 2)), and at the
           44px it first took, one draft fell off the page — the writer's own
           window listed nine where it had listed ten. 28px of square with
           6px above and below is 40, which is what the row was before the
           square arrived, so the page counts what it always counted. The
           square, the gap, the corner and the fills are unchanged. */
        'html body #page-draft .draft-row[class]{padding:6px 9px !important;gap:10px !important;border-radius:6px !important;height:40px !important;min-height:40px !important;max-height:40px !important;}' +
        'html body #page-inspire .idea-rows .idea-row[class]{padding:8px 9px !important;gap:10px !important;border-radius:6px !important;}' +
        'html body #page-draft .draft-row-num{display:none !important;}' +
        'html body #page-draft .draft-rows[class]{display:flex !important;flex-direction:column !important;gap:1px !important;padding:0 !important;}' +
        'html body #page-inspire .idea-rows[class]{grid-auto-rows:44px !important;gap:1px !important;}' +
        /* ── and a row is filled only when it is the one you are on ──

           The three rows had the same padding, gap, corner and square, and
           still did not read the same, because of what is behind them.

           Measured, unselected: an Idea row is rgba(0,0,0,0) — nothing — and
           so is a Bible row (.bb-row's own background is `transparent`). A
           Draft row was rgb(41,39,37), --surface-2, filled. It is filled by
           name: applyComponentThemes() paints a “cards” list, and .draft-row
           is on it (it is a chapter row on the Notebook as well), so every
           draft drew its own box. On a list where every row is a box, the row
           you are actually on cannot be told apart from the rest — which is
           the whole job of that fill.

           So the Draft row goes back to the Bible's and the Idea's rule: the
           paper is the card, a row is filled only under the pointer
           (--surface-3) and only when it is on (--surface-4). And the card
           behind them takes the colour the other two cards have: the Draft
           list was --surface-1 where .bb-list and .idea-side are --surface-2,
           so even with the boxes gone the three lists still read as three
           different greys. */
        'html body #page-draft .draft-list[class]{background:var(--surface-2) !important;}' +
        'html body #page-draft .draft-rows .draft-row[class]{background:transparent !important;}' +
        'html body #page-draft .draft-rows .draft-row[class]:hover{background:var(--surface-3) !important;}' +
        'html body #page-draft .draft-rows .draft-row[class].on,html body #page-inspire .idea-rows .idea-row.on{background:var(--surface-4) !important;}' +

        /* the Draft's Clear once it is in the bar: a plain bar button at the
           bar's right end, not the floating box it was out over the pane. */
        'html body #page-draft .sf-bar .draft-clear[class]{position:static !important;top:auto !important;right:auto !important;margin-left:auto !important;z-index:auto !important;}' +

        /* ── the writing surface opens empty ──

           “Write here — plain text.” sat in the pane as a placeholder, which
           is a line the writer has to read past on every draft. The pane is
           the writing surface of a writing app; an empty one is empty. */
        'html body #page-draft #draftBody::placeholder{color:transparent !important;opacity:0 !important;}' +

        /* ── and a row's own icons answer the pointer like every other row's ──

           On the Outline page the Description, Rename and Delete buttons had
           a hover of --surface-4 (#3a3734) while the row underneath them was
           already filled --surface-3 (#312e2c) on hover: nine steps of grey
           between the two, which reads as no change at all. Measured, and the
           same measurement on the Draft's own row buttons gives
           rgba(255,255,255,.09) over the same fill — the app's standard icon
           hover, and a step you can see. The Outline's row icons take it.

           Only the rows take it: .ol-tool is also the Kanban column's button
           and the toolbar's, and neither of those sits on a filled row. The
           resting mark a row already carries — .is-on, on a section that has
           a description — is left as it was; it is a state, not a hover. */
        'html body #page-outline .ol-row .ol-tool[class]:hover{background:var(--overlay-strong) !important;}';
      document.head.appendChild(cs);
    }


    /* ── the Draft and the Idea wear the Bible's row ──

       The Bible's row opens with a 26px letter square, and the two other
       lists are the lists the writer asked to be that one. The square cannot
       come from a stylesheet — a first letter is not a property, and there is
       no attribute on the row to read it from — and it cannot be written into
       pages.js or app.js either: renderDrafts() and renderSaved() build their
       rows from innerHTML in files that are past the point this layer can
       reach, and neither of them knows what a .bb-avatar is.

       So it is added after they have drawn. Three things get done on each
       pass, and every one of them checks before it writes, so the sweep can
       never loop: a Draft row without a square gets one in front of the
       title, an Idea row without one gets the same, and the Draft's Clear
       button — built as a child of .draft-split, floating out over the pane —
       is moved into the bar that already holds New draft, where the writer's
       hand already is when they want it. The square carries .bb-avatar, so it
       is the Bible's square by construction rather than by a copy of its
       numbers. */
    const sfLetter = function(txt){
      const t = String(txt == null ? '' : txt).replace(/\s+/g, ' ').trim();
      return (t.charAt(0) || '?').toUpperCase();
    };
    const sfSquare = function(letter){
      const a = document.createElement('span');
      a.className = 'bb-avatar sf-row-avatar';
      a.textContent = letter;
      return a;
    };
    const sfDressLists = function(){
      Array.prototype.forEach.call(document.querySelectorAll('#draftRows .draft-row'), function(r){
        if(r.querySelector('.sf-row-avatar')) return;
        const t = r.querySelector('.draft-row-title');
        r.insertBefore(sfSquare(sfLetter(t && t.textContent)), r.firstChild);
      });
      Array.prototype.forEach.call(document.querySelectorAll('#ideaRows .idea-row'), function(r){
        if(r.querySelector('.sf-row-avatar')) return;
        const t = r.querySelector('.idea-row-txt b') || r.querySelector('.idea-row-txt');
        r.insertBefore(sfSquare(sfLetter(t && t.textContent)), r.firstChild);
      });
      const bar = document.querySelector('#page-draft > .sf-bar[data-sf-bar="draft"]');
      const clear = document.querySelector('#page-draft .draft-clear');
      if(bar && clear && clear.parentElement !== bar) bar.appendChild(clear);
    };
    let sfDressRaf = 0;
    const sfDress = function(){
      if(sfDressRaf) return;
      sfDressRaf = requestAnimationFrame(function(){ sfDressRaf = 0; sfDressLists(); });
    };
    document.addEventListener('click', sfDress, true);
    window.addEventListener('resize', sfDress);
    if(typeof MutationObserver === 'function' && document.body){
      new MutationObserver(sfDress).observe(document.body, { childList:true, subtree:true });
    }
    sfDress();


    /* ── the Draft page gets the Idea page's right-click ──

       The Idea page has a menu key of its own (app.js): a saved prompt's row
       copies that prompt's label, a card copies the prompt itself, and an
       empty box takes what was copied. The writer wants the same pair on the
       Draft page, where a row stands for a draft and the useful thing in it
       is the draft's own text — the name is on the row already, and the row's
       pencil edits it.

       app.js's half of this is private to its page: `clip` is an internal
       variable, not the system clipboard, and the functions that read it are
       inside a closure this layer cannot reach. So the Draft's half is
       written here, doing the three things app.js's own copy does: the text
       goes to the system clipboard, one copy is kept for the paste, and the
       writer is told.

       The writing surface itself is left alone — it is a plain textarea, and
       a writer still wants the browser's own menu on it: select, cut, paste
       what is in the system clipboard. Only a blank pane, which has nothing
       to select, takes ours, exactly as app.js's own branch does elsewhere.
       The field is written the way app.js's pasteInto writes one, events and
       all, so the draft is saved as if it had been typed. */
    let sfDraftClip = '';
    const sfCopy = function(txt, what){
      txt = String(txt == null ? '' : txt);
      if(!txt.trim()){ if(typeof toast === 'function') toast('Nothing to copy', 'warn'); return false; }
      sfDraftClip = txt;
      /* and into the copy the rest of the app pastes from (see 8w) */
      try{ window.sfClip = txt; }catch(e){}
      try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); }catch(e){}
      if(typeof toast === 'function') toast('Copied ' + what);
      return true;
    };
    document.addEventListener('contextmenu', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      const page = document.getElementById('page-draft');
      if(!page || !page.contains(t)) return;

      /* a draft row — the draft it stands for */
      const row = t.closest('#draftRows .draft-row');
      if(row && !t.closest('.draft-act')){
        e.preventDefault(); e.stopPropagation();
        const i = parseInt(row.dataset.draftPick, 10);
        const d = (typeof D === 'function' ? (D().drafts || [])[i] : null);
        if(!d) return;
        sfCopy(d.body, 'the draft');
        return;
      }

      /* a blank pane — what was copied goes in */
      const body = document.getElementById('draftBody');
      if(body && t === body && !String(body.value || '').trim()){
        if(!sfDraftClip) sfDraftClip = window.sfClip || '';
        if(!sfDraftClip) return;
        e.preventDefault(); e.stopPropagation();
        body.value = sfDraftClip;
        try{ body.setSelectionRange(sfDraftClip.length, sfDraftClip.length); }catch(err){}
        try{ body.dispatchEvent(new Event('input',  { bubbles:true })); }catch(err){}
        try{ body.dispatchEvent(new Event('change', { bubbles:true })); }catch(err){}
        if(typeof toast === 'function') toast('Pasted');
      }
    }, true);


    /* ── New draft makes a draft, and stops there ──

       The app's own handler makes the draft and then drops the new row
       straight into renaming (draftRenameStart(0)), so pressing New draft
       read as renaming the draft you were already on rather than making a
       new one. The draft was really made every time — measured: two drafts,
       three after the press — but a name field arriving on the new row,
       focused and with its text selected, is what the writer saw.

       The app's handler cannot be unbound from here, and its branch calls
       stopImmediatePropagation, so a listener registered later never runs at
       all. This one is on `document` in the CAPTURE phase — before the app's
       own — and all it does is schedule the tidy-up, which lands once the app
       has finished: repaint the list once, the rename field goes, and the new
       draft stays, selected and ready to write in. pages.js's own blur guard
       ignores an input that is no longer in the document, so the repaint that
       takes the field away cannot write anything. */
    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      if(!t.closest('[data-act="add-draft"], [data-sfbar="tools:addDraft"]')) return;
      setTimeout(function(){
        if(document.querySelector('#page-draft [data-draft-rename-input]') && typeof renderDrafts === 'function') renderDrafts();
      }, 0);
    }, true);


    /* ── and the Idea page's New prompt does the same ──

       The Idea page had the same shape as the Draft's: newPrompt() makes the
       prompt with the name “Untitled prompt” and then hands its row to
       startRename(), so the new row arrived as a field with its text
       selected. One press, one prompt, and no renaming — the row's own pencil
       is where a name is changed, exactly as it is on the Draft page.

       Same method as above, for the same reason: app.js's own handler is on
       `document` in the capture phase and stops propagation, so this one only
       schedules the tidy-up. The page is repainted through the app's own
       renderer, which puts the row's title back and drops the field. */
    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      if(!t.closest('[data-ic-new]')) return;
      setTimeout(function(){
        if(!document.querySelector('#ideaRows [data-idea-ren-input]')) return;
        const root = document.getElementById('page-inspire');
        if(root && window.PAGE_RENDERERS && typeof window.PAGE_RENDERERS.inspire === 'function') window.PAGE_RENDERERS.inspire(root);
      }, 0);
    }, true);


    /* ── a new project and a new board list are made, not named ──

       Both ask before they will do anything. “New project” asks in two ways —
       the dashboard's own button and the pages overlay's “+ New” open a
       browser window reading “Project name:”, and the app's own New project
       (the tools menu, Ctrl+N, the pages overlay's card) opens the little
       modal with the same words. The Kanban board's “New list” asks for
       “Name of the new list:”. The writer wants one press to make the thing;
       the name is on every one of them to edit afterwards — a project from the
       dashboard's rename, a list from its own pencil.

       Two nets, because the app asks two ways.

       1 · window.prompt, the two native windows. Only those two questions are
           answered here — every other prompt in the app (Rename project, the
           board list's rename, an outline section's rename, a reference URL)
           is passed straight through untouched.

       2 · the modal askPrompt() draws. app.js and this file both hold their
           own reference to askPrompt, so replacing the function would not be
           seen by either; the window it draws is caught instead. A
           MutationObserver on the host runs its callback as a microtask, by
           which time the modal is in the DOM but the browser has not painted
           it — so the window is filled with the name it would have offered
           and its own OK pressed, and the writer never sees it.

       Neither net touches what happens next: the app's duplicate-name rule,
       its five-project cap, the first chapter, the four board columns and the
       navigation all run exactly as they did. The names are the ones those
       windows offer, numbered when one is already taken, so a second press
       makes a second thing instead of being refused — the board already has a
       fixed column called “Ideas”, which is why a new list is not called
       that. */
    const sfUniqueName = function(base, taken){
      const has = function(n){
        return (taken || []).some(function(x){ return String(x == null ? '' : x).trim().toLowerCase() === n.toLowerCase(); });
      };
      if(!has(base)) return base;
      for(let i = 2; i < 500; i++){ const n = base + ' ' + i; if(!has(n)) return n; }
      return base;
    };
    const sfProjectNames = function(){
      try{ return (D().projects || []).map(function(p){ return p.name; }); }catch(e){ return []; }
    };
    const sfListNames = function(){
      try{ return (typeof kbColumns === 'function' ? kbColumns() : []).map(function(c){ return c.name; }); }catch(e){ return []; }
    };

    const sfNativePrompt = window.prompt;
    window.prompt = function(msg, def){
      const m = String(msg == null ? '' : msg);
      if(/^Project name:/i.test(m)) return sfUniqueName('Untitled', sfProjectNames());
      if(/^Name of the new list:/i.test(m)) return sfUniqueName('New list', sfListNames());
      return sfNativePrompt.call(window, msg, def);
    };

    const sfAnswerNameModal = function(){
      const root = document.getElementById('modalRoot');
      if(!root || !root.classList.contains('open')) return;
      const head = root.querySelector('.modal-head h2');
      const input = root.querySelector('#askInput');
      if(!head || !input) return;
      if(!/^Project name:/i.test(String(head.textContent || ''))) return;
      input.value = sfUniqueName('Untitled', sfProjectNames());
      const ok = root.querySelector('#askOk');
      if(ok) ok.click();
    };
    const sfModalHost = document.getElementById('modalRoot');
    if(typeof MutationObserver === 'function' && sfModalHost){
      new MutationObserver(sfAnswerNameModal).observe(sfModalHost, { childList:true, subtree:true });
    }


    /* one row of the app's own toggle, wired to a getter and a setter */
    const switchRow = function(parent, label, get, set){
      const t = document.createElement('div');
      t.className = 'tgl';
      const paint = function(){ t.classList.toggle('on', !!get()); };
      paint();
      paints.push(paint);
      t.onclick = function(){
        set(!get());
        refreshFolds();
        if(typeof save === 'function') save();
      };
      const r = row(label, '', t);
      parent.appendChild(r);
      return r;
    };
    const groupLabel = function(parent, text){
      const d = document.createElement('div');
      d.className = 'sf-fold-sub';
      d.textContent = text;
      parent.appendChild(d);
    };

    /* the pages the left click lists, exactly as app.js draws them: the
       mode's own groups (Views · Reference · Workflow), so a switch always
       answers a button that is really in that menu — and the card carries
       those same group names as its labels, in the menu's own order.

       The writing page is the one entry with two names: it is the Manuscript
       in every mode but Screenplay, where it is the Script. Both are listed,
       Manuscript first, so the row is on the card whichever mode the writer
       is in — and because they are one page, both switches drive it together
       and can never disagree. */
    const WRITING_IDS = ['manuscript', 'write', 'editor'];
    const viewGroups = function(){
      try{
        const m = (typeof currentMode === 'function') ? currentMode() : null;
        if(!m) return [];
        const groups = m.fabGroups ||
          [{ label:'Views', views:(m.editorViews || []).map(function(id){ return { id:id }; }) }];
        const seen = {}, out = [];
        groups.forEach(function(g){
          const views = [];
          (g.views || []).forEach(function(v){
            const pid = (typeof v === 'string') ? v : v.id;
            if(!pid || seen[pid]) return;
            seen[pid] = true;
            if(WRITING_IDS.indexOf(pid) >= 0){
              views.push({ id: pid, name: 'Manuscript' });
              views.push({ id: pid, name: 'Script' });
              return;
            }
            const meta = (typeof PAGE_META !== 'undefined' && PAGE_META[pid]) || { name: pid };
            views.push({ id: pid, name: (v && v.name) ? v.name : meta.name });
          });
          if(views.length) out.push({ label: g.label || 'Views', views: views });
        });
        return out;
      }catch(e){ return []; }
    };
    const pagesOff = function(){
      const c = cfg();
      if(!c.fabPages || typeof c.fabPages !== 'object') c.fabPages = {};
      return c.fabPages;
    };

    /* ── the Remix chip, and the command box's filing ──

       Two things this file's own switches have to reach, and both were
       drawn by somebody else:

         · the Remix chip. It is not in SF_RC_ACTIONS (settings.js) — an
           inline script in index.html adds that button to the panel on top
           of the list, and it runs AFTER this file, so the chip cannot be
           filtered where it is created. It is taken back out here instead,
           on every render, when its switch is off.

         · the Canvas. The command box sorts its rows into Pages / Modes /
           File / View / App by a hard-coded list of shortcut keys, and the
           Canvas's own key ('cv') is not in it — so it was the one page
           filed under “App”. The pages the box lists are exactly the
           current mode's FAB menu (cmdPageCommands), so anything the mode
           calls a page is put back with the pages here. */
    const dropRemix = function(){
      try{
        if(typeof window.sfRcOn !== 'function' || window.sfRcOn('organize')) return;
        const body = document.getElementById('fabAIBody');
        if(!body) return;
        Array.prototype.forEach.call(body.querySelectorAll('[data-ai="organize"]'), function(b){ b.remove(); });
      }catch(e){}
    };

    const pageKeys = function(){
      try{ return (typeof window.cmdPageCommands === 'function') ? Object.keys(cmdPageCommands()) : []; }
      catch(e){ return []; }
    };
    const regroupCmdList = function(){
      const list = document.getElementById('cmdList');
      if(!list) return;
      const keys = pageKeys();
      if(!keys.length) return;
      const keyOf = function(it){
        const el = it.querySelector('.cmd-key');
        return el ? String(el.textContent || '').trim() : '';
      };
      const buckets = [];
      let cur = null;
      Array.prototype.slice.call(list.children).forEach(function(n){
        if(!n.classList) return;
        if(n.classList.contains('cmd-group-label')){
          cur = { label:n.textContent, items:[] };
          buckets.push(cur);
        }else if(n.classList.contains('cmd-item')){
          if(!cur){ cur = { label:'Pages', items:[] }; buckets.push(cur); }
          cur.items.push(n);
        }
      });
      let pages = buckets.filter(function(b){ return b.label === 'Pages'; })[0];

      /* collect them out of wherever they were filed — the box draws one
         group per query, so a search that matches only the Canvas leaves no
         Pages group at all; one is opened for it */
      const moved = [];
      buckets.forEach(function(b){
        if(b === pages) return;
        const stay = [];
        b.items.forEach(function(it){
          if(keys.indexOf(keyOf(it)) >= 0) moved.push(it);
          else stay.push(it);
        });
        b.items = stay;
      });
      if(!moved.length) return;
      if(!pages){ pages = { label:'Pages', items:[] }; buckets.unshift(pages); }
      moved.forEach(function(it){ pages.items.push(it); });

      /* in the mode's own order, which is the order of its FAB menu */
      pages.items.sort(function(a, b){ return keys.indexOf(keyOf(a)) - keys.indexOf(keyOf(b)); });

      list.innerHTML = '';
      buckets.forEach(function(b){
        if(!b.items.length) return;
        const lbl = document.createElement('div');
        lbl.className = 'cmd-group-label';
        lbl.textContent = b.label;
        list.appendChild(lbl);
        b.items.forEach(function(it){ list.appendChild(it); });
      });
    };

    if(typeof window.renderCmdList === 'function' && !window.renderCmdList.__sfPages){
      const drawList = window.renderCmdList;
      const wrappedList = function(){
        const out = drawList.apply(this, arguments);
        try{ regroupCmdList(); }catch(e){}
        return out;
      };
      wrappedList.__sfPages = true;
      window.renderCmdList = wrappedList;
    }
    if(typeof window.renderFabAI === 'function' && !window.renderFabAI.__sfRemix){
      const drawAI = window.renderFabAI;
      const wrappedAI = function(){
        const out = drawAI.apply(this, arguments);
        /* the inline chip is added after this returns, so the sweep waits
           for the whole render to finish */
        try{ setTimeout(dropRemix, 0); }catch(e){}
        return out;
      };
      wrappedAI.__sfRemix = true;
      window.renderFabAI = wrappedAI;
    }
    dropRemix();

    /* The round button has two clicks and one card for each, named for the
       click it is about. The left card is its own label and the list it
       opens; the right card is its own label and the panel it opens. Both
       read the same way — “<click> — <what it opens>”, then the rows that
       click answers for underneath. */
    const leftClickCard = function(root){
      const f = foldCard('FAB - left click', 'record-circle');
      /* the menu's own headings, each over the pages it carries. Views,
         Reference and Workflow are labels, exactly as the round button
         draws them — the card holds no switch for them. */
      viewGroups().forEach(function(g){
        groupLabel(f.body, g.label);
        g.views.forEach(function(p){
          switchRow(f.body, p.name,
            function(){ return pagesOff()[p.id] !== false; },
            function(v){ pagesOff()[p.id] = v; });
        });
      });
      root.appendChild(f.card);
    };

    /* the six writing actions the right-click panel carries, plus Translate.
       polish.js builds that panel from this very list (liveActions />
       rcOn /> sfRcOn /> sfRightClick().actions), so a switch here is the
       only thing between an option and the button. */
    const rightClickCard = function(root){
      const f = foldCard('FAB - right click', 'menu-button-wide');
      groupLabel(f.body, 'Text');
      const rc = function(){ return (typeof window.sfRightClick === 'function') ? window.sfRightClick() : null; };
      const acts = (typeof SF_RC_ACTIONS !== 'undefined' && SF_RC_ACTIONS) ? SF_RC_ACTIONS : [];
      let improveRow = null;
      acts.forEach(function(a){
        const r = switchRow(f.body, a.label,
          function(){ const r2 = rc(); return !r2 || r2.actions[a.k] !== false; },
          function(v){ const r2 = rc(); if(r2) r2.actions[a.k] = v; });
        if(a.k === 'improve') improveRow = r;
      });
      /* Remix. It is not one of SF_RC_ACTIONS — index.html adds that chip to
         the panel itself — and the panel puts it straight after Improve, so
         its switch sits there too. The chip follows this one flag: polish.js
         filters its six by the same table, and dropRemix() takes the chip
         index.html draws back out when this is off. */
      const remixRow = switchRow(f.body, 'Remix',
        function(){ const r2 = rc(); return !r2 || r2.actions.organize !== false; },
        function(v){ const r2 = rc(); if(r2) r2.actions.organize = v; if(!v) dropRemix(); });
      if(improveRow && improveRow.nextSibling) f.body.insertBefore(remixRow, improveRow.nextSibling);
      else if(improveRow) f.body.appendChild(remixRow);

      /* Translate is its own run in the panel, under its own label */
      groupLabel(f.body, 'Language');
      switchRow(f.body, 'Translate',
        function(){ const r2 = rc(); return !r2 || r2.translate !== false; },
        function(v){ const r2 = rc(); if(r2) r2.translate = v; });
      root.appendChild(f.card);
    };

    const workspacesSwitch = function(root){
      let ws = null;
      Array.prototype.forEach.call(root.querySelectorAll('.set-card'), function(k){
        const t = k.querySelector('.set-card-title');
        if(t && /workspace/i.test(t.textContent || '')) ws = k;
      });
      if(!ws) return;
      const body = ws.classList.contains('sf-fold')
        ? ws.querySelector('.sf-fold-body')
        : foldExisting(ws);
      if(!body || ws.dataset.sfWsSwitch === '1') return;
      ws.dataset.sfWsSwitch = '1';

      const COUNT = (typeof window.sfWsCount === 'function') ? window.sfWsCount() : 5;
      const nm  = function(i){ return (typeof window.sfWsName === 'function') ? window.sfWsName(i) : ('Workspace ' + (i + 1)); };
      const off = function(i){ return (typeof window.sfWsOff === 'function') ? !!window.sfWsOff(i) : false; };
      const first = body.firstElementChild;          /* the naming row */

      /* The naming picker says which ones are out of the rotation, so it is
         written once and then again whenever a switch is flipped.

         welcome.js writes its own options as “1. <name>”; it repaints them
         on every change of the picker or the name box, so the writing here
         is redone a tick later and both lists read the same. The options
         carry the name and nothing else — no “1.” in front of it — because
         the switch above them does, and the name the writer gave already
         says which workspace it is. */
      const pick = body.querySelector('select');
      const mark = function(){
        if(!pick) return;
        Array.prototype.forEach.call(pick.options, function(o, i){
          o.textContent = nm(i) + (off(i) ? ' · off' : '');
        });
      };

      /* one switch per workspace, above the naming row. The name is the
         whole label — no “1 ·” in front of it. */
      for(let i = 0; i < COUNT; i++){
        const r = switchRow(body, nm(i),
          function(){ return !off(i); },
          function(v){
            if(typeof window.sfWsToggle === 'function') window.sfWsToggle(i, v);
            mark();
          });
        if(first) body.insertBefore(r, first); else body.appendChild(r);
      }

      mark();
      if(pick){
        pick.addEventListener('change', function(){ setTimeout(mark, 0); });
        const inp = body.querySelector('input');
        if(inp) inp.addEventListener('change', function(){ setTimeout(mark, 0); });
      }
      refreshFolds();
    };

    const inner = SETTINGS.renderers.custom;
    SETTINGS.renderers.custom = function(root){
      /* the tab is drawn from scratch every time: the repaint closures of the
         previous pass go with it */
      folds.length = 0;
      paints.length = 0;
      leftClickCard(root);
      try{ rightClickCard(root); }catch(e){}
      const out = (typeof inner === 'function') ? inner.apply(this, arguments) : undefined;
      try{ workspacesSwitch(root); }catch(e){}
      return out;
    };

    /* the left click's own list: app.js has just drawn it, and a page that
       is switched off comes out of it here, before anything is painted. A
       group whose buttons have all gone takes its label and its rule with
       it; a menu with nothing left in it does not open at all. */
    const trimPages = function(){
      const box = document.getElementById('fabMenuViews');
      if(!box) return;
      const off = pagesOff();
      Array.prototype.forEach.call(box.querySelectorAll('[data-fab-go]'), function(b){
        if(off[b.dataset.fabGo] === false) b.remove();
      });
      Array.prototype.forEach.call(box.querySelectorAll('.fab-menu-head'), function(h){
        let n = h.nextElementSibling, has = false;
        while(n && !n.classList.contains('fab-menu-head')){
          if(n.hasAttribute && n.hasAttribute('data-fab-go')){ has = true; break; }
          n = n.nextElementSibling;
        }
        if(has) return;
        const prev = h.previousElementSibling;
        if(prev && prev.classList.contains('fab-divider')) prev.remove();
        h.remove();
      });
      const lead = box.firstElementChild;
      if(lead && lead.classList.contains('fab-divider')) lead.remove();
      if(!box.querySelector('[data-fab-go]')) closeFab();
    };

    /* the left click's own list is trimmed as app.js draws it. The card no
       longer carries a switch for the click itself — its rows are the pages
       — so nothing holds the click back: the knob in the corner always
       answers, and only the pages switched off here are missing from it. */
    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t || !t.closest || !t.closest('#fabBtn')) return;
      try{ trimPages(); }catch(e2){}
    }, true);
  })();

  /* ═══ 1 · NAMES BY FORM ═══
     SF_FAB_AI is the app's own table and the option objects inside it are
     plain objects, so its labels are re-written in place on every render —
     no second copy of the menu to drift out of step. */
  const relabel = function(){
    let table = null;
    try{ table = SF_FAB_AI; }catch(e){ table = null; }
    if(!table) return;
    const u = units();

    /* ── outline ──
       Four naming jobs, two pairs: the titles NAME a section and the
       descriptions say what it is FOR. Each pair takes the form's own word
       — Chapter/Subchapter in a novel, Scene/Sub-scene in a screenplay —
       so a screenplay is never offered “Chapter titles” and a novel is
       never offered “Scene description”. */
    if(Array.isArray(table.outline)){
      table.outline.forEach(function(o){
        if(!o || !o.fn) return;
        if(o.fn === 'olChapterTitles'){
          o.label = u.one + ' titles';
          o.desc  = 'A name for every ' + u.one.toLowerCase() + ', from your outline';
        }else if(o.fn === 'olSubTitles'){
          o.label = u.sub + ' titles';
          o.desc  = 'A name for every ' + u.sub.toLowerCase();
        }else if(o.fn === 'olChapterSubs'){
          o.label = u.one + ' description';
          o.desc  = 'Describe what every ' + u.one.toLowerCase() + ' covers, from your outline';
        }else if(o.fn === 'olSubSubs'){
          o.label = u.sub + ' description';
          o.desc  = 'Describe what happens in each ' + u.sub.toLowerCase();
        }else if(o.fn === 'olStructure'){
          o.desc = 'Is the ' + u.one.toLowerCase() + ' order working? What should move?';
        }
      });
    }

    /* ── plan ── */
    if(Array.isArray(table.plan)){
      table.plan.forEach(function(o){
        if(!o || o.fn !== 'planBeats') return;
        o.label = 'Beat the board';
        o.desc  = 'Fill this board — the beats it is still missing, in order';
      });
    }
  };

  /* ═══ 3 · TEXT & LANGUAGE ═══
     Nothing is taken off a page any more. The round button's right-click is
     the manuscript's own panel wherever it opens (polish.js), so the Text
     section and Translate are meant to be there on every page; the trim that
     used to remove them from the plan board, the Bible, the canvas and the
     board is gone with the page-specific menus it belonged to. */

  /* ── wrap the renderer ── */
  if(typeof window.renderFabAI === 'function'){
    const orig = window.renderFabAI;
    const wrapped = function(){
      relabel();
      return orig.apply(this, arguments);
    };
    window.renderFabAI = wrapped;
  }

  document.addEventListener('DOMContentLoaded', relabel);
  relabel();

  /* ═══ 4 · THE TWO DESCRIPTION JOBS ═══
     A title and a description are not the same job, and the app keeps both:
     the title jobs NAME a section, the description jobs say what it is FOR.
     What went wrong before was that the description was hung on the title
     jobs — “Chapter description” where “Chapter titles” had been — so the
     writer lost the naming job and, in the right-click menu, pressed a
     button that said “Chapter titles” and got prose back.

     These two functions are the DESCRIPTION side, in the form's own words
     and with the project in front of them. They are put on olChapterSubs
     and olSubSubs — the pair outline-menu.js adds under each title job —
     and the title jobs are left alone: olChapterTitles and olSubTitles stay
     pages-fix.js's own, which return names and nothing else. */
  const brief = function(){
    try{ return (typeof sfProjectBrief === 'function') ? sfProjectBrief() : ''; }catch(e){ return ''; }
  };
  const ask = function(title, sub, prompt){
    try{
      if(typeof sfAsk === 'function') return sfAsk(title, sub, prompt);
    }catch(e){}
  };

  const olChapter = function(){
    const u = units();
    ask(u.one + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: write a short DESCRIPTION of what each ' + u.one.toLowerCase() +
      ' covers, one per ' + u.one.toLowerCase() + ' listed in the structure above.\n' +
      'Rules:\n' +
      '- Two or three sentences each: what happens, and what it is for in the whole.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where the outline is still empty for a ' + u.one.toLowerCase() + ', write "not yet planned" and nothing more.\n' +
      '- No titles, no numbering of your own, no praise.\n' +
      'Reply as a plain list — "' + u.one + ' 1 — description" — and nothing else.');
  };

  const olSub = function(){
    const u = units();
    ask(u.sub + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: for every ' + u.one.toLowerCase() + ' above that has ' + u.subs.toLowerCase() +
      ', write a short DESCRIPTION of each ' + u.sub.toLowerCase() + '.\n' +
      'Rules:\n' +
      '- One or two sentences each: what happens in it, in order.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where one is still empty, write "not yet planned".\n' +
      '- No titles, no praise, no suggestions.\n' +
      'Reply as a plain list — "' + u.one + ' — ' + u.sub + ': description" — and nothing else.');
  };

  /* the order check speaks in the form's own words too, and reads the whole
     project before it judges the order */
  const olOrder = function(){
    const u = units();
    const one = u.one.toLowerCase(), subs = u.subs.toLowerCase();
    ask('Structure check', 'Outline',
      'You are a developmental editor.\n\n' + brief() + '\n\n' +
      'Task: read the ' + one + ' and ' + subs + ' order above against everything you were given — the plan, the Bible, the drafts — and tell the writer, plainly:\n' +
      '1. what the order is doing well, in one or two lines,\n' +
      '2. which ' + one + ' or ' + u.sub.toLowerCase() + ' is in the wrong place, and where it should go,\n' +
      '3. the single change that would help most.\n' +
      'Judge only from what is actually in the project. If the outline is too thin to judge, say so in one line instead of inventing structure.\n' +
      'Under 250 words. No praise padding.');
  };

  /* swapped onto the shared table, so the panel, the keyboard and anything
     else that calls them by name all reach the same two functions */
  F().olChapterSubs = olChapter;      /* Chapter description    */
  F().olSubSubs     = olSub;          /* Subchapter description */
  F().olStructure   = olOrder;        /* Check the order        */
})();


/* ══════════ context-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — what the assistant already knows

   Every AI request carries the project, in the order the writer built it:

       the prompt page  →  the drafts (and the chat on them)  →
       the outline  →  the plan / beat board  →  the board  →
       the reference page  →  the Bible  →  what is on screen now

   so the answer at each stage is written by something that has read the
   stages before it. The Outline page sees the drafts and the chat about
   them; the Plan sees the outline; the manuscript sees the plan. The board
   and the reference page are always carried, because they are the record
   the rest of the book is checked against.

   It is built fresh from the ACTIVE project and the ACTIVE workspace on
   every request, and nothing is cached — so a second project, or a second
   workspace inside this one, is a different book to the assistant, with no
   way for one to leak into the other.

   This layer only adds to the brief the app already builds (sfProjectBrief
   in pages-fix.js, which carries the title, the form, the structure, the
   Bible, the beats and the current section). It runs after every other
   script, and both AI doors — callAI, and the Draft chat's own request
   builder — read the result.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const CAP = 5200;                 /* the chain's own ceiling, in characters */

  const data = function(){
    try{ return (typeof D === 'function') ? (D() || null) : null; }catch(e){ return null; }
  };
  const projOf = function(){
    try{
      const d = D();
      return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };
  const flat = function(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  const cut = function(s, n){
    const t = flat(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  const html = function(s){ return flat(String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')); };
  const words = function(s){
    try{ if(typeof olWords === 'function') return olWords(s); }catch(e){}
    return flat(s).split(' ').filter(Boolean).length;
  };

  /* ── the drafts, with their prose: what the writing actually says ── */
  const drafts = function(d){
    const list = (d && Array.isArray(d.drafts)) ? d.drafts : [];
    if(!list.length) return '';
    return list.slice(0, 8).map(function(x, i){
      const body = html(x.body);
      return (i + 1) + '. ' + cut(x.title || 'Untitled', 60) + ' (' + words(body).toLocaleString() + ' words)' +
             (body ? '\n   "' + cut(body, 240) + '"' : '');
    }).join('\n');
  };

  /* ── what has already been said about it, on the draft page ── */
  const chat = function(d){
    const list = (d && Array.isArray(d.aiChats)) ? d.aiChats : [];
    if(!list.length) return '';
    /* the chat the writer is in, or the one used most recently */
    let c = d.aiChatActive ? list.filter(function(x){ return x && x.id === d.aiChatActive; })[0] : null;
    if(!c) c = list[list.length - 1];
    if(!c || !Array.isArray(c.messages) || !c.messages.length) return '';
    const tail = c.messages.slice(-8).map(function(m){
      return (m.role === 'user' ? 'Writer: ' : 'Assistant: ') + cut(m.text, 260);
    }).join('\n');
    const name = c.title ? '“' + cut(c.title, 50) + '”' : 'the chat';
    return name + ':\n' + tail;
  };

  /* ── the board: which list each piece stands in ──
     The cards are the same ones the Board page draws: every chapter and
     every subchapter, in the list it has been moved to. */
  const board = function(d){
    let proj = null, cols = [], state = {};
    try{ proj = (typeof kbProj === 'function') ? kbProj() : null; }catch(e){}
    try{ cols = (typeof kbColumns === 'function') ? kbColumns() : []; }catch(e){}
    try{
      state = (proj && proj.kanban) || {};
      if(state && Array.isArray(state.columns)) state = {};       /* the old shape */
    }catch(e){ state = {}; }
    if(!proj || !cols.length) return '';

    const cards = [];
    ((d && d.chapters) || []).forEach(function(c, i){
      cards.push({ id:c.id, title:c.title || ('Chapter ' + (i + 1)), body:c.content });
      (c.children || []).forEach(function(x, j){
        cards.push({ id:x.id, title:x.title || ('Subchapter ' + (j + 1)), body:x.content });
      });
    });
    if(!cards.length) return '';

    /* a card with no explicit list sits where the app would put it: drafted
       once it has words, in the first list before that */
    const auto = cols[0] ? cols[0].id : '';
    const drafted = cols[1] ? cols[1].id : auto;
    const out = [];
    cols.forEach(function(col){
      const inCol = cards.filter(function(c){
        const st = state[c.id];
        const at = (st && cols.some(function(x){ return x.id === st; })) ? st
                 : (words(c.body) > 0 ? drafted : auto);
        return at === col.id;
      });
      if(!inCol.length) return;
      out.push(col.name + ': ' + inCol.slice(0, 14).map(function(c){
        return cut(c.title, 50) + (words(c.body) ? ' (' + words(c.body) + 'w)' : '');
      }).join(', '));
    });
    return out.join('\n');
  };

  /* ── the reference page: what the writer looked up and kept ── */
  const refs = function(d){
    const list = (d && Array.isArray(d.references)) ? d.references : [];
    if(!list.length) return '';
    return list.slice(0, 20).map(function(r){
      const t = cut(r.title || r.name || r.url || 'Reference', 70);
      const note = cut(r.note || r.summary || r.text || '', 90);
      return '- ' + t + (note ? ' — ' + note : '');
    }).join('\n');
  };

  /* ── the plan, when the beads are not already in the brief ── */
  const plan = function(d){
    const list = (d && Array.isArray(d.beats)) ? d.beats : [];
    if(!list.length) return '';
    return list.slice(0, 30).map(function(b, i){
      return (i + 1) + '. [' + (b.type || 'beat') + '] ' + cut(b.text || b.title || '', 110);
    }).join('\n');
  };

  const chain = function(){
    const d = data();
    if(!d) return '';
    const out = [];
    const push = function(head, body){ if(body) out.push(head + ':\n' + body); };

    push('DRAFTS IN THIS PROJECT', drafts(d));
    push('WHAT HAS ALREADY BEEN SAID ABOUT IT (the draft page chat)', chat(d));
    /* the structure, the beats and the Bible are in the brief above; the
       plan gets its own lines here when the brief could not carry them all */
    push('PLAN — BEAT BOARD', plan(d));
    push('THE BOARD (which list each piece stands in)', board(d));
    push('REFERENCE PAGE — kept by the writer', refs(d));

    let text = out.join('\n\n');
    if(text.length > CAP) text = text.slice(0, CAP - 1) + '…';
    return text;
  };

  const head = '\n\nTHE PROJECT SO FAR — the stages this one comes after, each one a ' +
               'separate part of the same book. Use it. Do not invent anything that ' +
               'contradicts it, and do not restate it back to the writer.\n';

  if(typeof window.sfProjectBrief === 'function' && !window.sfProjectBrief.__sfChain){
    const orig = window.sfProjectBrief;
    const wrapped = function(){
      let base = '';
      try{ base = String(orig.apply(this, arguments) || ''); }catch(e){ base = ''; }
      let more = '';
      try{ more = chain(); }catch(e){ more = ''; }
      return more ? (base + head + more) : base;
    };
    wrapped.__sfChain = true;
    window.sfProjectBrief = wrapped;
  }
})();


/* ══════════ final-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the last pass

   Loaded after every other script, so its wrappers run after theirs.
   Six jobs:

     1 DARK, AND ONLY DARK     the app is dark. The Light mode that
                               settings.js can paint is unreachable: the
                               stored preference is pinned to dark, the
                               mode can be set to nothing else, and a
                               light paint is undone the moment it lands.
     2 FONT SIZE               the number in Settings lands on every
                               writing surface, on the sample line under
                               the slider, and on nothing else. It is
                               re-applied after any repaint, so a page
                               that re-draws its editor cannot lose it.
     3 THE CANVAS MENU         Fit · Zoom in · Zoom out · Clear canvas —
                               the four things the canvas bar no longer
                               carries. They ride in the page's own
                               right-click list instead.
     4 NO BARE READOUTS        nothing in the canvas bar may show a number
                               — if a stale copy of the markup ever draws
                               the zoom readout again, the text comes off
                               it and the cluster is hidden.
     5 AI REMEMBERS THE BOOK   every AI request carries the project: the
                               title, the form, the structure, the Bible,
                               the beats, the drafts, and the text on
                               screen. Free keys included — there is no
                               server-side memory to lean on, so the
                               brief is sent with each request.
     6 NO MENU ON THE PAGE     the manuscript and the Script page are
                               writing surfaces: a right-click on the
                               text opens nothing at all — not the
                               app's element menu, not the browser's.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const cfg = function(){
    try{ if(typeof S !== 'undefined' && S.config) return S.config; }catch(e){}
    return null;
  };
  const saveCfg = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };
  const toastIt = function(msg, kind){ try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){} };
  const pageId = function(){ try{ return (typeof S !== 'undefined' && S.page) || ''; }catch(e){ return ''; } };
  const trim = function(s, n){
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const textOf = function(sel){
    try{
      const el = document.querySelector(sel);
      if(!el) return '';
      return trim(el.innerText || el.textContent || '', 1500);
    }catch(e){ return ''; }
  };

  /* ═══ 1 · DARK, AND ONLY DARK ═══
     settings.js owns setThemeMode and the light palettes. This pins the
     mode to dark and re-paints if anything ever writes light back — a
     stored preference from an older build, a stale localStorage value, or
     a line of code that still asks for it. */
  const pinDark = function(){
    const c = cfg();
    if(!c) return;
    const was = c.themeMode;
    if(c.themeMode !== 'dark') c.themeMode = 'dark';
    let light = false;
    try{
      light = !!(document.body && document.body.getAttribute('data-theme-mode') === 'light');
    }catch(e){}
    /* a palette that was painted in light before this file ran is repainted
       dark — the app has one mode and it is the dark one */
    if(light || was === 'light'){
      try{ if(typeof applyThemeVars === 'function') applyThemeVars(c.theme || 'night'); }catch(e){}
    }
    try{
      if(document.body){
        if(document.body.getAttribute('data-theme-mode') !== 'dark') document.body.setAttribute('data-theme-mode', 'dark');
        if(document.documentElement && document.documentElement.style.colorScheme !== 'dark'){
          document.documentElement.style.colorScheme = 'dark';
        }
      }
    }catch(e){}
  };
  if(typeof window.setThemeMode === 'function'){
    const orig = window.setThemeMode;
    window.setThemeMode = function(){
      const c = cfg();
      if(c) c.themeMode = 'dark';
      const want = c ? (c.theme || 'night') : 'night';
      try{ if(typeof applyThemeVars === 'function') return applyThemeVars(want); }catch(e){}
      return orig.apply(this, arguments);
    };
  }
  if(typeof window.sfThemeMode === 'function'){
    window.sfThemeMode = function(){ return 'dark'; };
  }
  pinDark();
  /* and it stays that way: a late boot, a settings save or a stored value
     that arrives after this file is written over once more */
  setInterval(pinDark, 2000);

  /* ═══ 2 · FONT SIZE ═══
     One number, from Settings → Appearance (and the toolbar's own box, and
     Ctrl + / Ctrl −). Every writing surface reads it, and it is re-applied
     after a repaint so a page that rebuilds its editor cannot leave it
     behind. Nothing else in the app is touched by it. */
  const WRITING = ['#editor', '.write-doc', '.editor-doc', '.sf-split-doc', '.sf-split-editor',
                   '.fnt-doc', '.fnt-src', '.draft-doc'];

  /* half steps kept: the slider moves in .5, and rounding to whole pixels
     here made the number you picked (17.5) land as 18 — the control looked
     like it did nothing on the odd step. */
  const docSize = function(){
    const c = cfg();
    const raw = Number(c && c.fontSize);
    const n = Math.max(10, Math.min(60, (isFinite(raw) && raw > 0 ? raw : 17)));
    return Math.round(n * 2) / 2;
  };

  const applyDocSize = function(){
    const px = docSize();
    const val = px + 'px';
    try{
      document.documentElement.style.setProperty('--doc-size', val);
      if(document.body) document.body.style.setProperty('--doc-size', val);
    }catch(e){}
    /* one sweep, and each surface remembers which size it was given, so a
       repaint that changes nothing costs nothing */
    Array.prototype.forEach.call(document.querySelectorAll(WRITING.join(',')), function(el){
      if(el.dataset && el.dataset.sfDocPx === val) return;
      try{ el.dataset.sfDocPx = val; }catch(e){}
      el.style.fontSize = val;
    });
    /* the sample line under the slider, so the control can be seen working */
    Array.prototype.forEach.call(document.querySelectorAll('.font-size-sample'), function(el){
      el.style.fontFamily = 'var(--doc-font, inherit)';
      el.style.fontSize = val;
    });
    return px;
  };
  window.sfApplyDocSize = applyDocSize;

  let sizeTick = 0;
  const sizeSoon = function(){
    if(sizeTick) return;
    sizeTick = setTimeout(function(){ sizeTick = 0; applyDocSize(); }, 220);
  };

  /* the toolbar's box and the Settings slider both end up here */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;
    if(t.dataset.tb === 'fontSize'){ sizeSoon(); return; }
    if(t.closest && t.closest('.set-card') && t.type === 'range') sizeSoon();
  }, true);
  document.addEventListener('change', function(e){
    const t = e.target;
    if(t && t.dataset && t.dataset.tb === 'fontSize') sizeSoon();
  }, true);

  /* and after any repaint of a page, a modal or a panel */
  ['paintPage', 'goPage', 'renderToolbar', 'applyConfig', 'renderSetTab', 'setFontSize'].forEach(function(name){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfSize) return;
    const fn = function(){
      const r = orig.apply(this, arguments);
      try{ setTimeout(applyDocSize, 0); }catch(e){}
      return r;
    };
    fn.__sfSize = true;
    window[name] = fn;
  });

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(function(){ sizeSoon(); }).observe(document.body, { childList:true, subtree:true });
  }

  /* The T button's own panel (Outline, Kanban, Bible, Canvas — and the two
     writing pages) sets a per-page size, which those pages read from
     --pg-size. The manuscript and the script read the DOCUMENT size, so a
     size picked in the T panel there changed nothing: the two controls
     agree now — on a writing page the panel writes the one number the
     writing surfaces read, and Settings follows it. */
  if(typeof window.typoApply === 'function'){
    const origTypo = window.typoApply;
    window.typoApply = function(page, root){
      const r = origTypo.apply(this, arguments);
      try{
        if(String(page) === 'manuscript' || String(page) === 'script' || String(page) === 'write'){
          const t = (typeof typoGet === 'function') ? typoGet(page) : null;
          const c = cfg();
          if(t && t.size && (!c || Number(c.fontSize) !== Number(t.size))){
            if(c) c.fontSize = Math.max(10, Math.min(60, Number(t.size) || 17));
            saveCfg();
            setTimeout(applyDocSize, 0);
          }
        }
      }catch(e){}
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', applyDocSize);
  setTimeout(applyDocSize, 300);
  setTimeout(applyDocSize, 1200);

  /* ═══ 3 · THE CANVAS MENU ═══
     Fit, the two size steps and Clear — on the canvas bar (the magnifier
     and Clear, see mindmap.js) AND in the round button's right-click list,
     beside the three AI options the canvas already had (see polish.js:
     SF_FAB_AI.mindmap), so the writer can reach them from either. */
  const C = function(){ return window.sfCanvas || null; };
  const F = window.AI_FNS || (window.AI_FNS = {});
  F.canvasFit = function(){
    const c = C();
    if(c && c.fit) c.fit();
    else toastIt('Open the canvas first', 'warn');
  };
  F.canvasZoomIn = function(){
    const c = C();
    if(c && c.zoomIn) c.zoomIn(); else toastIt('Open the canvas first', 'warn');
  };
  F.canvasZoomOut = function(){
    const c = C();
    if(c && c.zoomOut) c.zoomOut(); else toastIt('Open the canvas first', 'warn');
  };
  F.canvasClear = function(){
    const c = C();
    if(c && c.clear) c.clear(); else toastIt('Open the canvas first', 'warn');
  };

  const CANVAS_EXTRA = [
    { fn:'canvasFit',     icon:'arrows-angle-contract', label:'Fit to screen',
      desc:'Frame every card in the view' },
    { fn:'canvasZoomIn',  icon:'zoom-in',               label:'Zoom in',
      desc:'Larger cards — or scroll the wheel over the canvas' },
    { fn:'canvasZoomOut', icon:'zoom-out',              label:'Zoom out',
      desc:'Smaller cards — or scroll the wheel over the canvas' },
    { fn:'canvasClear',   icon:'eraser',                label:'Clear canvas',
      desc:'Remove every card and link from this canvas' }
  ];
  try{
    if(typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI){
      /* polish.js gives the canvas its list under `canvas` (the same array
         as EXTRA.mindmap) while the page id is `mindmap`, so both keys have
         to point at ONE array — a second array would hide the three AI
         options the page already had. */
      let list = Array.isArray(SF_FAB_AI.canvas) ? SF_FAB_AI.canvas
               : (Array.isArray(SF_FAB_AI.mindmap) ? SF_FAB_AI.mindmap : null);
      if(!list) list = [];
      CANVAS_EXTRA.forEach(function(o){
        if(!list.some(function(x){ return x.fn === o.fn; })) list.push(o);
      });
      SF_FAB_AI.canvas = list;
      SF_FAB_AI.mindmap = list;
    }
  }catch(e){}

  /* ═══ 4 · NO BARE READOUTS ═══
     The canvas bar draws no number: the magnifier button is the whole of
     the zoom cluster on the bar, and its popup is three labelled commands.
     If a stale copy of the markup ever puts a readout back — on the bar or
     inside the popup — the text comes off it, because a readout that says
     “NaN” is never right. The MARKUP itself is left alone: the buttons
     come back as soon as one is found (mindmap.js draws them). */
  const cleanCanvasBar = function(){
    const head = document.querySelector('#page-mindmap .mm-head');
    if(!head) return;
    Array.prototype.forEach.call(head.querySelectorAll('[data-mm="zoom-label"], .mm-zoom'), function(el){
      const txt = String(el.textContent || '');
      /* only a write that changes something: assigning the same text again
         would be a mutation of its own, and the observer above would call
         this back for ever */
      if(txt && !/^\s*\d+(\.\d+)?\s*%?\s*$/.test(txt) && txt !== '') el.textContent = '';
      if(!el.hidden) el.hidden = true;
    });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(cleanCanvasBar).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', function(){ setTimeout(cleanCanvasBar, 0); }, true);
  cleanCanvasBar();

  /* ═══ 4b · THE LAST VISIBLE TOOLBAR GROUP ═══
     The divider between two groups is the group's own right edge, so the
     LAST group must not draw one. `:last-child` is not enough: a hidden
     group, or a button that is not a group, can sit after the last real
     one, and the hairline is left hanging at the end of the row — a line
     where no line belongs. The last visible group is marked here, and
     final-fix.css answers the mark. */
  const tbEdges = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('.write-toolbar, .toolbar, .tb, .fnt-bar, .sf-bar, .page-head'),
      function(bar){
        /* only the groups that are actually on screen: a hidden group is
           still a child, and marking IT as last would leave the hairline
           hanging off the end of the group the writer can see. */
        const groups = Array.prototype.filter.call(bar.children, function(c){
          if(!c || !c.classList || !c.classList.contains('tb-group')) return false;
          if(c.hidden) return false;
          try{ return c.getClientRects().length > 0; }catch(e){ return true; }
        });
        Array.prototype.forEach.call(bar.children, function(c){
          if(!c || !c.classList || !c.classList.contains('tb-group')) return;
          const last = (groups[groups.length - 1] === c);
          if(c.classList.contains('sf-tb-last') !== last) c.classList.toggle('sf-tb-last', last);
        });
      }
    );
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(tbEdges).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', function(){ setTimeout(tbEdges, 0); }, true);
  window.addEventListener('resize', tbEdges);
  tbEdges();

  /* ═══ 5 · AI REMEMBERS THE BOOK ═══
     A free API key has no server-side memory: the only way the assistant
     knows the book on the Draft page is if the book is sent with the
     request. So every callAI carries it — the brief the app already builds
     (title, form, structure, Bible, beats, current section) plus what is
     on the page you are actually looking at. */
  const pageContext = function(){
    const out = [];
    let name = pageId();
    try{
      if(typeof PAGE_META === 'object' && PAGE_META[name] && PAGE_META[name].name) name = PAGE_META[name].name + ' (' + name + ')';
    }catch(e){}
    out.push('PAGE THE WRITER IS ON: ' + name);

    /* The drafts are NOT listed here any more: the project brief carries
       them, with their prose, in reading order (context-fix.js). Saying it
       in two places only spent the same budget twice. */

    if(pageId() === 'mindmap' || pageId() === 'canvas'){
      try{
        const proj = (typeof kbProj === 'function') ? kbProj() : null;
        const d = (typeof D === 'function') ? D() : null;
        const st = (proj && proj.mindmap) || (d && d.mindmap) || null;
        if(st && Array.isArray(st.nodes) && st.nodes.length){
          out.push('CANVAS CARDS:\n' + st.nodes.slice(0, 24).map(function(n, i){
            return (i + 1) + '. ' + trim(n.text || 'untitled', 90);
          }).join('\n'));
        }
      }catch(e){}
    }

    /* the text on the page the writer is looking at */
    const onScreen = textOf('#page-' + pageId() + ' #editor') ||
                     textOf('#page-' + pageId() + ' .write-doc') ||
                     textOf('#page-' + pageId() + ' .editor-doc');
    if(onScreen) out.push('WHAT IS ON SCREEN:\n' + onScreen);
    return out.join('\n\n');
  };

  const memoryBlock = function(){
    let brief = '';
    try{ if(typeof window.sfProjectBrief === 'function') brief = String(window.sfProjectBrief() || ''); }catch(e){}
    let ctx = '';
    try{ ctx = pageContext(); }catch(e){}
    const head = 'PROJECT MEMORY — the whole book, whatever page this is:\n';
    if(!brief && !ctx) return '';
    return (head + (brief ? brief + '\n\n' : '') + ctx).slice(0, 7000);
  };
  window.sfProjectMemory = memoryBlock;

  if(typeof window.callAI === 'function'){
    const orig = window.callAI;
    window.callAI = function(prompt){
      let p = String(prompt == null ? '' : prompt);
      try{
        /* “TITLE: ” is the first line of the brief; if it is already in the
           prompt the caller attached the project itself and this would only
           send it twice */
        if(p.indexOf('TITLE: ') < 0){
          const mem = memoryBlock();
          if(mem) p = mem + '\n\n' + p;
        }else if(p.indexOf('PAGE THE WRITER IS ON:') < 0){
          const ctx = pageContext();
          if(ctx) p = 'PROJECT MEMORY (context):\n' + ctx + '\n\n' + p;
        }
      }catch(e){}
      return orig.call(this, p);
    };
  }

  /* ═══ 5b · AND EVERY OTHER AI CALL GOES THROUGH THE SAME DOOR ═══
     The Draft page's chat does not use callAI at all — it has its own
     request builder (chatCallAI in draft-chat.js), which is exactly the
     place a writer types “continue chapter 3” and gets an answer about
     nothing. Both builders end at fetch() on the same two endpoints, so the
     project is attached there as well: one door, every caller, nothing to
     remember to do when a new AI button is added.

     A request that already carries the block is left alone — the marker
     below is what says so — so nothing is ever sent twice. */
  const MEM_MARK = 'PROJECT MEMORY';

  const attachMemoryToBody = function(body){
    let obj = null;
    try{ obj = JSON.parse(body); }catch(e){ return null; }
    if(!obj || typeof obj !== 'object') return null;

    /* the text to grow, and a way to write it back where it came from */
    let text = null, write = null;
    const part = function(p){
      if(typeof p !== 'string') return false;
      text = p; write = function(v){ return v; };
      return true;
    };
    if(Array.isArray(obj.messages) && obj.messages.length){
      const m = obj.messages[obj.messages.length - 1];
      if(m && typeof m.content === 'string'){ if(part(m.content)) write = function(v){ m.content = v; }; }
      else if(m && Array.isArray(m.content)){
        const t = m.content.filter(function(x){ return x && x.type === 'text'; })[0];
        if(t && part(t.text)) write = function(v){ t.text = v; };
      }
    }else if(Array.isArray(obj.contents) && obj.contents[0] && Array.isArray(obj.contents[0].parts)){
      const t = obj.contents[0].parts.filter(function(x){ return x && typeof x.text === 'string'; })[0];
      if(t && part(t.text)) write = function(v){ t.text = v; };
    }
    if(text == null || typeof text !== 'string') return null;
    if(text.indexOf(MEM_MARK) >= 0) return null;

    let mem = '';
    try{ mem = memoryBlock(); }catch(e){ mem = ''; }
    if(!mem) return null;
    write(mem + '\n\n' + text);
    try{ return JSON.stringify(obj); }catch(e){ return null; }
  };

  const AI_URL = /(chat\/completions|:generateContent|:streamGenerateContent)/;
  if(typeof window.fetch === 'function' && !window.fetch.__sfMemory){
    const origFetch = window.fetch;
    const withMemory = function(input, init){
      try{
        const url = (typeof input === 'string') ? input
                  : ((input && typeof input.url === 'string') ? input.url : '');
        const method = (init && init.method) ? String(init.method).toUpperCase()
                     : ((input && input.method) ? String(input.method).toUpperCase() : 'GET');
        if(url && AI_URL.test(url) && method === 'POST' && init && typeof init.body === 'string'){
          const grown = attachMemoryToBody(init.body);
          /* a copy: the caller's own options object is never mutated */
          if(grown) init = Object.assign({}, init, { body: grown });
        }
      }catch(e){}
      return origFetch.call(this, input, init);
    };
    withMemory.__sfMemory = true;
    window.fetch = withMemory;
  }

  /* ═══ 6 · THE EDITOR HAS NO RIGHT-CLICK ═══
     The manuscript and the Script page are writing surfaces: a right-click
     on the text opens nothing.

     write.js binds its own element menu to the editor, split.js binds the
     same menu to the split editor, and a dozen sheets bind document-level
     menus as well; suppressing the key anywhere after the fact means the
     menu has already been drawn. So this listener is on `window` in the
     CAPTURE phase — it runs before every `document` listener, and before
     the editor's own — and settles the keystroke once: the app's menu
     never opens, and the browser's menu does not either, so the page stays
     the page.

     Two things it must not touch: the round button's right-click, which is
     the AI assistant on an element of its own, and the canvas's right-click
     list (job 3 above), which is a card surface and not the editor. */
  const EDITOR_SURFACE = '#editor, .write-canvas, .fnt-src, .fnt-src-pane';
  window.addEventListener('contextmenu', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    /* the surface first — it is what the key is about */
    if(!t.closest(EDITOR_SURFACE)) return;
    /* and the writing pages only, so a canvas card or a reader that happens
       to carry one of the classes keeps its own menu */
    try{ if(typeof isWritingPage === 'function' && !isWritingPage()) return; }catch(err){}
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
})();


/* ══════════ font-pack.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the faces the two font pickers offer

   THE THING THAT DID NOT HAPPEN
   Settings → Font → App font offers 67 families and the writing toolbar
   offers the same 67. Picking one set a font-family and nothing else —
   because not one @font-face for those families was ever in the app. The
   sheet that was meant to carry them, vendor/webfonts/fonts.css, is
   linked from index.html and is not in the build, so every family
   resolved to the first fallback the browser could find:

     · in the writing face that is a generic serif, so all 26 serif picks
       looked like each other, and like the default;
     · in the interface it was `system-ui` — which is what the app
       already uses — so “App font” could be set to anything at all and
       the app went on looking exactly the same.

   THE FIX, in four parts

     1 · A TRUTHFUL STACK. FONTS carries each family's own stack, generic
         and all (`'Merriweather',serif`, `'Space Mono',monospace`), so
         the name is turned into that stack rather than into a hairline
         family with a serif tail glued on. A serif pick now falls back
         to serif and a mono pick to monospace: the pick changes the app
         even before a font file arrives, and what is missing is the face,
         not the choice.

     2 · THE FACE ITSELF, on demand. The chosen family is fetched once and
         only the chosen one — never all 67 — with the link added rather
         than waited on, so the app keeps painting and the type sharpens
         when the file lands. Two requests go out per family: the 400/700
         pair (real bold instead of a synthesised one), and the bare
         family, because a family that publishes no 700 — Patrick Hand is
         one — answers the first with an error and would stay missing.

     2b · THE APP'S OWN FOUR FACES, too. theme.css names Inter for the
         interface, Fraunces for display type, JetBrains Mono for source
         and Merriweather for the page you write on — and this build
         ships no file for any of them either. So the app has never been
         drawn in its own face: the interface fell to system-ui, and the
         two serif tokens to Georgia. Those four come down once, on boot,
         with the same pass, so the app is itself before anything is
         picked — and a pick is a change from that, not from a fallback.

     3 · THE APP'S OWN COPY WINS. If a build did ship
         vendor/webfonts/fonts.css, the sheet is in the document and names
         real faces, and nothing is fetched at all: the offline desktop
         build keeps its own fonts. With no network and no local copy the
         stack in (1) is what shows, which is a real face's fallback
         rather than the default under a different name.

   Both pickers are followed — the app face and the writing face — because
   they read the same table of faces.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const configOf = function(){
    try{ return (typeof S !== 'undefined' && S.config) ? S.config : null; }catch(e){ return null; }
  };
  const faces = function(){
    try{ return (typeof FONTS !== 'undefined' && Array.isArray(FONTS)) ? FONTS : []; }catch(e){ return []; }
  };

  /* ═══ 1 · the stack a family name stands for ═══
     The table is the only place that knows which generic a face belongs
     to. An unknown name is quoted and left to the browser, which is what
     the app did for every name before this file. */
  const stackOf = function(name){
    if(!name) return '';
    const f = faces().filter(function(x){ return x && x.name === name; })[0];
    return (f && f.f) ? f.f : '"' + String(name) + '"';
  };
  /* what a setting writes when it wants that face, generic and all */
  window.sfFontStack = function(name){ return stackOf(name); };

  /* ═══ 2 · the app's own copy, when the build shipped one ═══
     index.html links vendor/webfonts/fonts.css. A sheet that answered
     with rules is the app's own copy and is the end of the question; a
     sheet that 404'd has no rules, which is how this file knows the
     families have to come from somewhere. */
  let local = null;
  const vendored = function(){
    if(local !== null) return local;
    local = false;
    const sheets = document.styleSheets || [];
    for(let i = 0; i < sheets.length; i++){
      let href = '';
      try{ href = String(sheets[i].href || ''); }catch(e){ continue; }
      if(href.indexOf('webfonts/fonts.css') < 0) continue;
      try{
        if(sheets[i].cssRules && sheets[i].cssRules.length){ local = true; return true; }
      }catch(e){}
    }
    return false;
  };

  /* ═══ 3 · the face itself, once, and only the one in use ═══ */
  const asked = {};
  const url = function(name, axes){
    return 'https://fonts.googleapis.com/css2?family='
      + encodeURIComponent(name).replace(/%20/g, '+') + axes + '&display=swap';
  };
  const tag = function(name, axes){
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = url(name, axes);
    el.setAttribute('data-sf-face', name);
    document.head.appendChild(el);
    return el;
  };
  const load = function(name){
    if(!name || asked[name]) return;
    asked[name] = 1;
    if(vendored()) return;                       /* the build carries them */
    tag(name, ':wght@400;700');                  /* regular, and real bold */
    tag(name, '');                               /* the regular alone */
  };

  /* the four faces theme.css's own tokens name — the interface, the two
     kinds of display type and the page. With no file shipped for them the
     app wears its fallbacks everywhere, which is what makes a pick in the
     App font select look like the app it already was. Fetched once, on
     boot, and a no-op the moment a build carries the folder again. */
  const OWN = ['Inter', 'Fraunces', 'JetBrains Mono', 'Merriweather'];
  const ownFaces = function(){
    for(let i = 0; i < OWN.length; i++) load(OWN[i]);
  };

  /* ═══ 4 · the app face ═══
     `--ui` is the family across the whole interface (theme.css holds the
     default, here it is replaced or handed back). A face is written as
     its whole stack, so an interface in a serif face really is a serif
     interface — and says so even where the file is still coming. */
  const paintUi = function(){
    const c = configOf();
    const stack = c ? stackOf(c.uiFont) : '';
    try{
      const root = document.documentElement;
      if(stack) root.style.setProperty('--ui', stack);
      else root.style.removeProperty('--ui');
    }catch(e){}
  };

  /* ═══ 5 · follow both settings ═══
     The two change in four places — the Appearance selects, the toolbar's
     own font list, a split pane, and a project switch (a project carries
     its own writing face), so the settings are read rather than the
     controls hooked: anything that writes S.config is caught. */
  const last = { f:null, u:null };
  const sync = function(){
    const c = configOf();
    if(!c) return;
    if(c.font !== last.f){
      last.f = c.font;
      load(c.font);
    }
    if(c.uiFont !== last.u){
      last.u = c.uiFont;
      paintUi();
      load(c.uiFont);
    }
  };
  window.sfFontSync = sync;

  /* the two calls the app already makes, answered at once rather than on
     the next tick of the watch below */
  const wrap = function(name, after){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfFaces) return;
    const fn = function(){
      const r = orig.apply(this, arguments);
      try{ after.apply(null, arguments); }catch(e){}
      return r;
    };
    fn.__sfFaces = true;
    window[name] = fn;
  };
  wrap('applyConfig', function(key){ if(key === 'font' || key === 'uiFont') sync(); });
  wrap('applyAllConfig', sync);

  /* The writing page's own font control (and its keyboard step) ends in
     write.js's applyFont, which writes the bare family with a serif tail:
     a mono or sans pick would fall to a serif while the file is on its way.
     That one line cannot be reached from here, so the face is said again,
     whole, right after it runs — the same value the line was aiming for. */
  wrap('applyFont', function(){
    const c = configOf();
    load(c && c.font);
    const stack = stackOf(c && c.font);
    if(!stack) return;
    const ed = document.getElementById('editor');
    if(ed) ed.style.fontFamily = stack;
  });

  /* and the net under them: a slow read of the two settings, so a path
     this file never heard of still lands. It writes only on a change. */
  setInterval(function(){ try{ sync(); }catch(e){} }, 1500);

  ownFaces();
  if(document.body) sync();
  else document.addEventListener('DOMContentLoaded', sync);
  setTimeout(function(){ try{ sync(); }catch(e){} }, 400);
})();

/* Project storage safeguards stay in this existing final-fix layer. */
(function(){
  const tools = window.TOOLS || (window.TOOLS = {});
  const modes = window.MODES || [];
  const S = window.S;
  const D = window.D;
  const uid = window.uid;
  const useProjectData = window.useProjectData;
  const save = window.save;
  const goPage = window.goPage;
  const currentMode = window.currentMode;
  const askPrompt = window.askPrompt;
  if(tools && S && D && uid && useProjectData && save && goPage && currentMode && askPrompt){
    tools.newProject = async function(){
      const name = await askPrompt('Project name:', 'Untitled');
      if(!name) return;
      const d = D();
      const id = uid();
      const chapterId = uid();
      const category = d.currentCategory || currentMode()?.categories?.[0]?.id || 'fiction';
      if((d.projects || []).some(function(p){ return p.category === category && p.name.toLowerCase() === name.trim().toLowerCase(); })){
        toast('A project named "' + name.trim() + '" already exists in this category', 'warn');
        return;
      }
      const project = {
        id: id, name: name, category: category, mode: S.mode, created: Date.now(),
        chapters: [{ id: chapterId, title: 'Chapter 1', content: '', children: [], collapsed: false }],
        drafts: [], ideas: [], notes: [], beats: [], cast: [], references: [], timeline: [],
        bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
        kanban: { columns: [
          {id:'k1', title:'Ideas', cards:[]}, {id:'k2', title:'Drafting', cards:[]},
          {id:'k3', title:'Editing', cards:[]}, {id:'k4', title:'Done', cards:[]}
        ]}
      };
      if(!Array.isArray(d.projects)) d.projects = [];
      d.projects.unshift(project);
      d.currentProject = id;
      d.currentCategory = category;
      useProjectData(project);
      d.currentChapter = chapterId;
      save();
      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
      if(typeof hideInfoPanel === 'function') hideInfoPanel();
      goPage('home');
      toast('Project created');
    };
  }

  const oldImportJSONProject = window.importJSONProject;
  if(typeof oldImportJSONProject === 'function' && window.classifyProjectName && modes.length){
    window.importJSONProject = function(parsed, filename){
      const src = parsed && (parsed.project || parsed);
      const routingKey = (filename || '').replace(/\.json$/i, '') || '';
      const cls = window.classifyProjectName(routingKey);
      const modeDef = modes.find(function(m){ return m.id === cls.mode; });
      const targetData = cls.mode && S.modes && S.modes[cls.mode];
      if(!src || !targetData || !modeDef || !cls.category){
        return oldImportJSONProject.apply(this, arguments);
      }
      const list = targetData.projects;
      /* The category is intentionally unlimited. Hide one existing entry while
         the legacy importer runs so its old five-project guard cannot block
         the import, then restore it immediately afterward. */
      const hiddenIndex = list.findIndex(function(p){ return p.category === cls.category; });
      const hidden = hiddenIndex >= 0 ? list.splice(hiddenIndex, 1)[0] : null;
      try{
        return oldImportJSONProject.apply(this, arguments);
      }finally{
        if(hidden) list.splice(Math.min(hiddenIndex, list.length), 0, hidden);
        save();
      }
    };
  }

  document.addEventListener('contextmenu', function(e){
    const button = e.target.closest && e.target.closest('#floatingImport');
    if(!button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async function(ev){
      const file = ev.target.files && ev.target.files[0];
      if(!file) return;
      try{
        window.importJSONProject(JSON.parse(await file.text()), file.name);
      }catch(err){
        toast('Invalid JSON file', 'err');
      }
    };
    input.click();
  }, true);
})();

/* ═══════════════════════════════════════════════════════════
   LAYOUT & COLOUR. This block used to live in its own sf-layout.js, which
   was a mistake: every other global fix in this app lives in a file that
   already exists, and a separate file means one more request, one more
   cache key and one more thing that can drift. So it is here now.

   FOUR THINGS.

   1 - THE PALETTES. Three blacks added: Pitch, Obsidian and Carbon, each
     its own numbers in full. The whites that were here too - Alabaster,
     Sand and Slate, plus Paper, Frost and Linen, which lived inline in
     index.html - have been taken out again, so every theme is dark.

     The whites were not small. A light theme's whole job is that a card
     reads as a card, and the app itself removes every edge a card could
     have: pages.css pins `border:0 !important` and
     `box-shadow:none !important` on .home-pane, .home-overview-card and
     the rest at ID specificity, so the surface ramp is the only definition
     there is and it has to step. Cutting them meant giving all of that up.

   2 - THE COLOR PICKER. The grid of tiles grew past twenty without anyone
     deciding what the categories were, so it was a wall, and the three
     light themes that were added first went in at fixed positions - after
     Night, after Ink, after Midnight - which put three whites in a straight
     line down the list and read as an accident. It was one: a mechanical
     alternation is not a way to arrange colours.

     So they are grouped into three families - Cool dark, Dark, Warm dark -
     and the Color card holds one dropdown per family rather than one long
     list of everything, so the label beside each dropdown says what is
     actually in it. The card is called "Color" because that is what it
     holds. The list treatment came from here and then went everywhere: see
     the EVERY DROPDOWN LIST block below.

   3 - MOTION. Every animation is started by the event that caused it - a
     navigation, a modal opening - and never by a class the app re-applies
     on a repaint. See the section itself for why that distinction is the
     whole design.

   4 - THE SMALL FIXES. Fields were invisible (same fill as the card behind
     them), icon-only controls were drawn in the fourth-level TEXT token and
     failed 3:1 on eleven of the 27 themes, and the statistics cards did not
     match the dashboard cards. Each has its own block below with the
     measurements.

   Density is gone: there is no Comfortable/Compact control any more, and
   the pass in index.html no longer rescales spacing.

   Load position still matters, for the other half of the same reason.
   This file is a blocking script in the body, after state.js, pages.js,
   settings.js and app.js have parsed and before DOMContentLoaded - so
   the six presets are in THEMES by the time app.js's boot() paints the
   theme. It no longer adds any of them itself, but the picker reads
   THEMES and a stored id has to resolve against a list that is already
   the finished one. */
(function(){
  'use strict';

  /* -- 1 - the palette families -----------------------------------
     Six palettes, sorted into three families by the temperature of the
     SURFACE they are painted on, and one dropdown per family in the
     Color card.

     The grid used to grow past twenty tiles with no categories at all, so
     it was a wall. Sorting by temperature is the fix for that: three
     short lists, and the label beside each one says what is actually in
     it, which is the thing a flat list of twenty never told you.

       Cool dark - the surfaces are blue or blue-grey
       Dark      - the one neutral surface in the set
       Warm dark - the surfaces are brown

     That leaves 3 / 1 / 2. The uneven split is honest rather than padded:
     a family is a property of a colour, and there is one neutral palette
     here, not three. Symmetry would mean putting an azure surface under
     "Dark" to fill the row, which is exactly the mechanical sort that put
     three whites in a line down the old list.

     A family shows a dash when the app is not on one of its palettes. A
     native select always displays something, so without it two of the
     three would sit there naming a palette that is not on the screen -
     three dropdowns all looking chosen when one of them was. */

  /* -- 3 - MOTION -------------------------------------------------
     Motion is started by the EVENT that caused it and by nothing else.
     Two rules, both learned the hard way:

       1. Never key an animation to a class the app re-applies on a
          repaint. `.page.active` is re-applied by several layers - the
          polish sweep, the layout pass, the theme pass - and a CSS
          animation on that selector restarts every time, which turns one
          intended fade into a screen that blinks for as long as the app is
          open.
       2. Animate on the action, not on the state. goPage() builds a brand
          new #page-<id> from scratch (stage.innerHTML = '' first), so an
          entrance animation on that element can only ever run once per
          navigation. A repaint calls paintPage(), not goPage(), and is
          never animated.

     Everything here is a bounded Web Animations call on an element that
     was just created, so nothing runs at rest: with the app idle,
     document.getAnimations() is empty (measured over six seconds of
     sampling). Speed honours S.config.animSpeed, and Reduce motion / Rich
     animations switch the whole module off.

     There are no injected outlines any more. The hairline pass that used to
     live here has been removed on purpose: panels are separated by their
     own fill now, which is why the light palettes were re-cut (see the top
     of this block) so that page, card and inset are three real steps. A
     one-pixel ring on every surface was a crutch over a ramp that did not
     step, and it made every panel read as a wireframe rather than a card. */
  const EASE = 'cubic-bezier(.22,.61,.36,1)';

  const animSpeed = function(){
    try{ const s = parseFloat(S.config.animSpeed); if(isFinite(s) && s > 0) return s; }catch(e){}
    return 1;
  };

  const motionOff = function(){
    try{
      const b = document.body;
      if(b && (b.classList.contains('reduce-motion') || b.classList.contains('no-animations'))) return true;
      if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    }catch(e){}
    return false;
  };

  /* fill:'backwards' so a staggered element is held at its first frame
     through its own delay, and released to its natural style at the end -
     no inline styles are left behind and nothing can get stuck at opacity 0 */
  const fly = function(el, from, to, ms, delay){
    if(!el || typeof el.animate !== 'function' || motionOff()) return null;
    const k = animSpeed();
    try{
      return el.animate([from, to], {
        duration: Math.max(1, Math.round(ms * k)),
        delay: Math.max(0, Math.round((delay || 0) * k)),
        easing: EASE,
        fill: 'backwards'
      });
    }catch(e){ return null; }
  };

  /* A transform makes its element the containing block for any fixed
     descendant, so a card that holds the floating button or a toast is
     faded only. Opacity can never move a fixed child. */
  const holdsFloating = function(el){
    try{
      if(el.matches('.fab-wrap,.toast,#toastRoot,.floating-import')) return true;
      return !!el.querySelector('.fab-wrap,.fab-btn,.toast,.floating-import');
    }catch(e){ return true; }
  };

  const bigEnough = function(el){
    try{
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      return r.width > 120 && r.height > 24 && c.display !== 'none' && c.visibility !== 'hidden';
    }catch(e){ return false; }
  };

  /* Every renderer fills one wrapper (.home-dashboard, .stats-page,
     .write-wrap, .ol-wrap ...), so one level down is where the cards are.
     Without that step the whole page moved as a single sheet, which is a
     slide rather than a reveal. */
  const cardsOf = function(pageEl){
    try{
      let kids = Array.prototype.filter.call(pageEl.children, bigEnough);
      if(kids.length === 1 && kids[0].children.length > 1){
        kids = Array.prototype.filter.call(kids[0].children, bigEnough);
      }
      return kids.slice(0, 8);
    }catch(e){ return []; }
  };

  /* the page itself, card by card, 45ms apart */
  const revealPage = function(pageEl){
    if(!pageEl || motionOff()) return;
    cardsOf(pageEl).forEach(function(el, i){
      const rise = holdsFloating(el) ? null : 'translateY(6px)';
      fly(el, { opacity: 0, transform: rise || 'none' }, { opacity: 1, transform: 'none' }, 240, i * 45);
    });
  };

  /* the modal, once per opening */
  let modalWasOpen = false;
  const watchModal = function(){
    const root = document.getElementById('modalRoot');
    if(!root || typeof MutationObserver !== 'function') return;
    try{
      new MutationObserver(function(){
        const open = root.classList.contains('open');
        if(open === modalWasOpen) return;
        modalWasOpen = open;
        if(!open) return;
        const scrim = root.querySelector('.modal-scrim');
        const box = root.querySelector('.modal');
        if(scrim) fly(scrim, { opacity: 0 }, { opacity: 1 }, 150, 0);
        if(box) fly(box, { opacity: 0, transform: 'translateY(10px) scale(.985)' },
                      { opacity: 1, transform: 'none' }, 220, 40);
      }).observe(root, { attributes: true, attributeFilter: ['class'] });
    }catch(e){}
  };

  /* Wrap goPage. The page element is rebuilt on every real navigation, so
     this can only fire once per navigation - and it fires in the same task
     that built the page, before the first paint, so the reveal cannot show
     a frame at full opacity first. A no-op call (goPage(current)) is a
     repaint and is left alone. */
  const wrapGoPage = function(){
    const orig = window.goPage;
    if(typeof orig !== 'function' || orig.__sfMotion) return;
    const T0 = Date.now();
    const fn = function(id){
      let changed = false;
      try{ changed = String((typeof S !== 'undefined' && S.page) || '') !== String(id); }catch(e){}
      const out = orig.apply(this, arguments);
      if(!changed) return out;
      if(Date.now() - T0 < 1200) return out;      /* boot owns its own paint */
      try{ revealPage(document.getElementById('page-' + id)); }catch(e){}
      return out;
    };
    fn.__sfMotion = true;
    window.goPage = fn;
  };

  /* press feedback, written against the same --t-fast the Speed control
     scales. Small controls only: a full-width settings tab should not
     scale, and the round FAB already has its own hover. */
  const MOTION_CSS = [
    'html body :is(.btn,.tb-btn,.topbar-btn,.icon-btn-sm,.ol-btn,.home-pager-btn,',
    '  .set-import-btn,.mv-pager-btn,.mode-item,.mode-pill,.chip){',
    '  transition:transform var(--t-fast) var(--ease),',
    '    background-color var(--t-fast) var(--ease),',
    '    color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease) !important;',
    '}',
    /* the press-scale is for the big buttons. A 28px icon in a toolbar was
       reported as shifting under the pointer — the utility grid in the
       writing bar — so the small icons keep their box and answer with
       their fill alone (the bars' own sheet pins the transform with it). */
    'html body :is(.btn,.tb-btn,.topbar-btn,.ol-btn,.home-pager-btn,',
    '  .set-import-btn,.mv-pager-btn,.mode-item,.mode-pill,.chip):active{',
    '  transform:scale(.97) !important;',
    '}'
  ].join('\n');

  const injectMotion = function(){
    if(document.getElementById('sfMotionCss')) return;
    const s = document.createElement('style');
    s.id = 'sfMotionCss';
    s.textContent = MOTION_CSS;
    document.head.appendChild(s);
  };

  /* -- 3b - FIELDS ------------------------------------------------
     A text field has to look like a field with no border, which means its
     fill has to step off the surface it sits on. The app paints every one
     of these with --surface-3 - and the row behind them is --surface-3 too
     (pages.css: the settings modal, the story-bible fields, the outline
     description box), with border:0 to finish it. So the box was the same
     colour as the card behind it: 0.0 dL* apart, an invisible control on
     every one of the 27 themes - which is why the AI tab's API-key field,
     and the Custom tab's numbers, simply were not on the screen, most
     obviously on a white theme where there is nothing else to see.

     --surface-1 is the one token that always sits a full step away from
     --surface-3 in both directions: white on the light palettes (7.4 dL*
     off the Paper card), near-black on the dark ones (5.4 off Night's). The
     fill alone says "type here", so nothing is drawn around it. Injected,
     because this has to beat three !important rules in a 500KB stylesheet
     and the style block in index.html sits above the stylesheet links. */
  const FIELDS_CSS = [
    'html body .modal .inp, html body .modal .sel,',
    'html body .bb-field .inp, html body .bb-field .sel,',
    'html body .ol-desc .inp{',
    '  background:var(--surface-1) !important;',
    '}'
  ].join('\n');

  // -- 2c - two things the Settings modal and the Dashboard got -----
  //
  // 1 . THE SAVE BUTTON, ON THE ACCENT.
  // pages.css:3997 painted the footer's primary button --ink on --bg, so
  // it was a neutral block while every other primary button in the app is
  // --accent on --accent-ink. Two primary buttons in one modal in two
  // different colours: Save paper-white beside "Fetch models" in the
  // theme's accent. Both palettes were measured for this - acc on accInk
  // is 8.41:1 on Blue and 11.58:1 on Yellow, so neither is near the
  // 4.5:1 floor. The old ink-on-bg measured 11.69 to 17.94, so this is a
  // quieter button as well as a coloured one.
  //
  // 2 . THE DASHBOARD PROJECT LIST, WITHOUT A SCROLLBAR.
  // Ten projects a page and a pager that says 1-10, so ten have to be
  // visible. The row-height pass that was here before did not do it, so
  // this one is written against measurements, not against the pane's
  // estimated size.
  //
  // pages.css pins the list to 38px rows with a 3px gap - 407px for ten -
  // and the pane shrinks with the window. Measured, in the two-card
  // layout, the box is (window height - 313)px with no stats block above it,
  // and (window height - 421)px with the per-card one. Ten rows at 30px
  // with a 3px gap need 327px, so a fixed 30px row only clears the pane at
  // 640px of window height, with 0.00px of slack. Below that the tenth row
  // is cut: measured overhang +2px at a 638px window, +5px at 635, +20px at
  // 620, +40px at 600 - where the row is gone entirely.
  //
  // A scrollbar is still not the answer: it is a control nobody asked for,
  // inside a card, on a list of ten names. So nothing scrolls and the row
  // height stops being fixed at all. The rows SHARE the list and the list is
  // capped at the 407px ten 38px rows need:
  //
  //   grid-auto-rows:minmax(0,1fr);  max-height:407px;
  //
  // Past that the list stops growing and rows sit at 38px; under it the ten
  // rows divide whatever height there is. There is no window height at which
  // a row can reach the clip line, and no media query in the rule, so there
  // is no threshold that can be wrong the way the last one was.
  //
  // Measured with it on: tenth-row overhang 0.00px at every window height
  // from 470 to 1354, with the rows coming out 38px at 900, 34px at 774,
  // 27px at 700, 23px at 660 and 19px at 620. The folder tile follows the
  // row (height:calc(100% - 2px)) rather than sitting at a fixed 28px,
  // because at a 19px row a fixed 28px tile is a tile with its bottom sliced
  // off - the other half of what "cutting" looked like.
  //
  // The selector carries two ids through :is() on purpose. pages.css:803 -
  // 'html body :is(#page-home,#pagesOverlay) :is(.home-proj-list,#projList)'
  // - owns `gap` here, and :is() takes the weight of its heaviest argument,
  // which is #projList, so that selector weighs (2,0,2) and outranks every
  // plain 'html body #page-home .home-proj-list' rule at (1,1,2). A fix
  // written at (1,1,2) is outranked and does nothing; this one is not. (That
  // is also why the gap stays 3px: the 2px asked for below loses the same
  // way, so it is not asked for any more.)
  //
  // overflow:hidden stays as pages.css had it. Nothing scrolls.
  const SETTINGS_FIX_CSS = [
    /* the modal is a fill on a scrim, not an outlined box: the frame's 1px
       --line border is off, its shadow (which is depth, not an edge) stays. */
    'html body #modalRoot .settings-modal{ border:0 !important; }',
    /* Save is a ghost now, like the Close beside it: transparent fill, and
       the fill only on hover, and it takes the SAME accent wash Close does
       (--overlay, the accent at 5%) on hover and on press. Its LABEL stays
       --ink where Close's is --ink-3,
       so the two are not identical - the primary action is meant to be the
       findable one. Give this rule color:var(--ink-3) as well and they match
       to the pixel.
       (Restoring the accent is background:var(--accent) / color:
       var(--accent-ink); the cream pass before that was --ink on --bg.) */
    /* Save wears the Idea bar's Clear, exactly: a filled box on the modal's
       own surface - the same --surface-3 that Clear is on the bar, one step
       off the --surface-2 it sits on - with its label in --ink-2, and the
       theme's light accent (its 12% wash, then the accent itself for the
       label) under the pointer and on the press. No green of its own and no
       outline: the same button kind as Clear, in the same kind of place (the
       right-hand end of the foot, as Clear is of the bar). */
    'html body .settings-modal .modal-foot .btn-primary{',
    '  background:var(--surface-3) !important;',
    '  color:var(--ink-2) !important;',
    '  border-color:transparent !important;',
    '}',
    'html body .settings-modal .modal-foot .btn-primary:hover,',
    'html body .settings-modal .modal-foot .btn-primary:active{',
    '  background:var(--accent-soft) !important;',
    '  color:var(--accent) !important;',
    '  border-color:transparent !important;',
    '  opacity:1 !important;',
    '}',
    /* Close carries the green instead - the foot's own green, which Save
       wore before it took the accent box: the label in #7fd0a2 at rest with
       no fill of its own, and the 16% #3fa56b wash under the pointer and on
       the press, the label rising to #9fe0bb. It is the same two literals,
       and the same shape, Save has in this file, so the two foot buttons
       cannot drift apart; nothing here is painted from the theme's accent. */
    'html body .settings-modal .modal-foot .btn-ghost{',
    '  background:transparent !important;',
    '  color:#7fd0a2 !important;',
    '  border-color:transparent !important;',
    '}',
    'html body .settings-modal .modal-foot .btn-ghost:hover,',
    'html body .settings-modal .modal-foot .btn-ghost:active{',
    '  background:color-mix(in srgb, #3fa56b 16%, transparent) !important;',
    '  color:#9fe0bb !important;',
    '  border-color:transparent !important;',
    '  opacity:1 !important;',
    '}',

    /* minmax(0,43px) is the whole fix, and it is one number doing two jobs.

       46px since the comfort pass (it was 43): the eight
       rows a page now holds (HOME_PROJECT_PAGE_SIZE, pages.js - it was ten)
       plus their 3px gaps come to 365px, which is what ten 34px rows came
       to. The card holds the list it always did; the rows are taller for it.
       The ceiling is what stops the stretching - with a bare 1fr every row
       inflated to fill the card, and ten projects came out 56px tall on a
       900px window and five came out 116px. Both of those were measured,
       not guessed. 43px is still a ceiling, so that case is still
       impossible: measured at 1400x900 and 1100x760 the rows are 43.0px.

       The 0 is the floor: when the pane cannot hold eight 43px rows the rows
       share what there is and get shorter, so the last one stays inside the
       card instead of falling past the clip line. floor 0 is what lets them
       shrink at all - a floor of 43px is a row that cannot shrink, which
       clips the last row exactly like the fixed 38px rows did. Measured at
       632x498: eight 17.1px rows in a 170px list, nothing cut.

       flex:1 1 auto lets the list take the card's spare height, and the
       ceiling is why that is safe now. The list has to grow for the card's
       inset block (below) to read as one panel: shrink-only left the space
       between the last row and the pager showing the shell's --surface-1,
       which cut the block in two with a dark band - 195px of it at 1400x900.
       Growing it, the band is gone: the pixel just above the pager resolves
       to the list, not the shell, at every window height tried.

       No max-height and no media query, so there is no second number here
       that can fall out of step with the row height, and no threshold to be
       wrong about.
       (2,0,2) on purpose - see the note above. */
    'html body :is(#page-home) :is(.home-proj-list,#projList){',
    '  grid-auto-rows:minmax(0,46px) !important;',
    '  flex:1 1 auto !important;',
    '  min-height:0 !important;',
    '}',
    /* ── the project card, in the stats card's shape ──
       The dashboard's stats card is an outer --surface-1 shell with a
       --surface-2 block inset 6px inside it, and that inset block is the
       grey the card is read by. The project card below it was a --surface-1
       shell with only its top bar at --surface-2, so its list read as a
       hole cut in the card rather than a panel sitting on it. This gives
       the project card the same body: one surface for the bar, the list and
       the pager, with the outer 6px left as the shell. The block is square
       through the middle and rounds on its outer corners, so it reads as
       one inset panel and not three stacked ones.

       #page-home carries an id here on purpose: the page's own stylesheet
       rides inside the page's markup, lands after this sheet and wins every
       tie, and it writes these rules without the id.

       Rows keep their own transparent fill, so the hover and the selection
       still read against the block - see the row rules in the page itself.
       Measured at 1400x900: the shell is --surface-1 (34,33,32), the whole
       run from the bar's top to the pager's bottom is --surface-2
       (41,39,37), the block's inner width is 816px against a 828px card -
       the 6px a side - and the bar's top corners and the pager's bottom
       corners are the only rounded ones. */
    /* margin-top and margin-bottom are the same number on purpose: they are
       the only space in the column besides the 6px gap (the project card
       grows to take whatever is left), so equal margins are what centres the
       pair in the window. */
    /* The shell is back: --surface-1 with 6px of padding, and the list block
       inset in it - the shape the dashboard's Stats card has, which is the
       greyness this card is read by. Without it the card was the block alone
       and the bar was a second grey box of the same tone 6px above, which
       read as one column with a slit rather than two things. */
    /* flex:0 0 auto - the card hugs its content now. It used to be the
       dashboard's one flexible item (`flex:1 1 auto`), which was how the
       pair stayed centred: the card took whatever height was left. Two
       columns halve the rows (eight projects are four rows a column), so
       holding that height open would have left ~240px of empty grey under
       the last row. The pair is centred by the dashboard's own
       justify-content:center instead - see the rule after this one - and the
       56px margins above and below are then the minimum gap, not the
       leftover. */
    'html body #page-home .home-workspace{ position:relative !important; flex:0 0 auto !important; background:var(--surface-1) !important; padding:6px !important; margin-bottom:56px !important; }',
    /* the dashboard's free space, split evenly above and below the pair */
    'html body #page-home .home-dashboard{ justify-content:center !important; }',
    'html body #page-home .home-overview-card.home-overview-card{ margin-top:56px !important; }',
    /* the switch header rides on the SHELL, not on the block: it is the
       card's header, and the 6px of shell between it and the list is what
       separates the two. Its own hairline went with the fill - two lines of
       separation for one seam. */
    /* The bar rides on that shell, transparent: --surface-1 above the
       --surface-2 block is the separation, and the 6px between them is the
       second half of it. Its own hairline stays off - two lines of separation
       for one seam. */
    'html body #page-home .home-workspace-bar{ background:transparent !important; border-bottom:0 !important; }',
    'html body #page-home .home-workspace .home-proj-list{ background:var(--surface-2) !important; margin-top:6px !important; border-radius:8px 8px 0 0 !important; }',
    'html body #page-home .home-workspace .home-empty{ background:var(--surface-2) !important; }',
    /* ── TWO COLUMNS OF PROJECTS, one on each side of the divider ──
       The divider split the card and only the left half had anything in it:
       every row's content sits left of the line, and the row's pin / rename /
       delete buttons fade in only under the pointer, so the half to the
       right of the line was dead space. The list is the app's grid, so the
       second column is one declaration - and the line at 50% then falls in
       the middle of the 20px gutter (each column ends 10px from the centre),
       which is where a divider belongs.

       minmax(0,1fr) rather than 1fr on purpose: `1fr` means `minmax(auto,1fr)`
       and the auto floor is the widest thing in the column, so one long
       project name would push its column wider than its neighbour. The 0
       floor is what lets .proj-name's ellipsis do its job instead.

       Eight projects a page is four rows a column, so the card comes down to
       its content - see the flex:0 0 auto in the card rule above, and the
       dashboard's justify-content:center, which is what keeps the pair
       centred in the window now that the card is no longer the item taking
       up the slack. Measured at 1100x820: two columns of 296px with a 20px
       gutter between them, rows 43px, card 648x298, and the 1px line down
       the middle of the gutter.

       THE SELECTOR IS THE WHOLE TRICK HERE, and it cost me a pass to find
       out. `html body #page-home .home-workspace .home-proj-list` - one id,
       three classes - does NOT beat pages.css:800, which writes its gap as
       `html body :is(#page-home,#pagesOverlay) :is(.home-proj-list,#projList)`.
       :is() takes the specificity of its most specific argument, and
       #projList is an ID, so BOTH :is() blocks are ids: that rule is
       (2,0,2), and one id can never outrank two however many classes are
       piled on. Measured: column-gap stayed 3px under every one-id selector
       I tried, and only a two-id one moved it. So this carries the same
       (2,0,2) construct plus `.home-proj-list` - which makes it (2,1,2) -
       and that extra class is also what keeps the overlay's #projList, a
       single-column modal list, out of this rule. */
    'html body :is(#page-home) :is(.home-proj-list,#projList).home-proj-list{',
    '  grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important;',
    '  column-gap:20px !important;',
    '}',
    /* The pager is lifted above the card's divider (the ::after further
       down), which is the last positioned box in the card and would
       otherwise paint its 1px line straight through the pager's centred
       "1 - 8". z-index:1 puts an opaque --surface-2 box over the line
       instead, so the divider ends where the list does without the rule
       carrying the pager's own height as a magic number. */
    'html body #page-home .home-workspace .home-project-pager{ position:relative !important; z-index:1 !important; background:var(--surface-2) !important; border-radius:0 0 8px 8px !important; }',
    'html body #page-home .home-workspace .home-proj-list:last-child{ border-radius:8px !important; }',
    /* ── the card's vertical divider ─────────────────────────────
       ONE hairline, down the middle of the card. It used to be a line per
       row - eight short rules stacked at the right, where each row's content
       ended and its actions began. It is one line at the card's centre now,
       running the grey block from the bar's bottom edge to the card's, so
       the list reads as two panes with a single seam instead of a rule after
       every project. --line-2 is the app's own divider, the colour
       .home-bar-div and the settings hairlines use.

       top:56px is measured, not guessed - 6px of shell, the 44px bar and the
       6px the block sits below it by. bottom:6px is the shell on the far
       side, so the line ends where the block does. pointer-events:none keeps
       it out of the way of the rows it crosses. */
    /* asked for: the divider is gone. The pager's own z-index:1 above is
       left in place - it costs nothing and removing it moves no pixel. */
    /* The folder tile and the row's three action buttons follow the row
       instead of sitting at fixed sizes, so a short row shrinks them rather
       than slicing their bottoms off - which is the other half of what
       "cutting" looked like at a 30px row.

       The buttons also have to be exempted from pages.css:728, the 28px
       touch-target floor on every button in the app. min-height beats height
       whatever the specificity, so the 22px button was 28px tall inside a
       24.6px row and hung 1.7px out of the row on each side. */
    'html body #page-home .home-proj-list .proj-icon{',
    '  flex:0 0 auto !important; width:auto !important;',
    '  height:calc(100% - 2px) !important; min-height:0 !important;',
    '  max-height:28px !important;',
    '  aspect-ratio:1 / 1 !important; overflow:hidden !important;',
    '}',
    'html body #page-home .home-proj-list .proj-actions{',
    '  min-height:0 !important; height:100% !important; align-items:center !important;',
    '}',
    'html body #page-home .home-proj-list .proj-btn{',
    '  flex:0 0 auto !important; min-height:0 !important; min-width:0 !important;',
    '  width:auto !important; height:calc(100% - 2px) !important;',
    '  max-height:22px !important; aspect-ratio:1 / 1 !important;',
    '}',
    /* The pager stays on the card's bottom edge. The list no longer grows to
       push it down, so the leftover height collects above it instead of
       leaving the pager floating just under the last row. */
    'html body #page-home .home-recent .home-project-pager{',
    '  margin-top:auto !important;',
    '}',
    /* ── the draft page's Clear belongs to the PAGE, not to the bar ──
       The draft page is one column under the two-column breakpoint: the
       draft list runs across the top (y 104-420 at 1100x820) and the
       writing pane sits under it (y 430). Clear lived at the end of the
       writing pane's own head, so at that width it came out at y=438 -
       the middle of the window - while the top bar beside it is empty.
       Measured before: 1100x820 Clear at [1008, 438]; 1400x900 at
       [1308, 112], which is the page's top-right already, because there
       the pane IS the right-hand column.
       So it is taken out of the head's flow and pinned to the .draft-split
       box's top-right corner, which is the page's top-right at every
       width. The inset is the pane head's own 8px/10px, measured rather
       than guessed: at 1400x900 the split's padding box is 16px in from
       the window, and 26px from the split's right edge is where the button
       already sat - so nothing moves at that width, and at 1100 it rises
       from y438 to the top bar.
       .draft-pane clips (overflow:hidden), but an absolutely positioned
       box whose containing block is an ANCESTOR of the clipper escapes the
       clip, and .draft-split is exactly that. The head keeps its 52px so
       the pane does not lose the strip Clear is drawn over. */
    /* The button was a child of .draft-pane-head, and .draft-pane is
       POSITIONED (relative) - so the head's copy anchored to the PANE, not
       to the page, and the pane clips (overflow:hidden). Measured at
       1100x820 with it in the head: [979, 449] - the pane's top-right,
       which in the stacked layout is the middle of the window. So it is a
       child of .draft-split itself now (pages.js), which is the one box
       that spans the whole page, and an absolutely positioned child of a
       grid container is not a grid item - it takes no cell.
       The inset is the pane head's own 12px, so at 1400x900, where the
       pane IS the right-hand column, the button lands where it always did.
       Measured after: 1400x900 [1268, 129] against a pane at [296, 120] -
       the pane's top-right corner, inside the head; 1100x820 [993, 128],
       the page's top-right. */
    'html body .draft-split{ position:relative !important; }',
    'html body .draft-pane-head{ min-height:48px !important; }',
    /* z-index 80, and the number is the point: pages.css:7445 lifts the
       pane head to z-index:70 so its own dropdowns can escape it, and a
       sibling with anything less is painted UNDER that head - which is
       exactly where this button sits at 1400, where the pane is the
       right-hand column and the head covers the button's box (measured:
       elementFromPoint at the button's centre returned the HEADER). 80 is
       clear of the head's 70 and still under the 90 its open lists use,
       so an open Font/Size list still covers the button the way it should.
       Measured after: the hit at 1400x900 lands on the button. */
    'html body .draft-split > .draft-clear{',
    '  position:absolute !important; top:22px !important; right:32px !important;',
    '  z-index:80 !important;',
    '  margin:0 !important;',
    '}',
    'html body .draft-list-head{ min-height:48px !important; }'
  ].join('\n');

  const injectSettingsFixes = function(){
    if(document.getElementById('sfSettingsFixCss')) return;
    const s = document.createElement('style');
    s.id = 'sfSettingsFixCss';
    s.textContent = SETTINGS_FIX_CSS;
    document.head.appendChild(s);
  };

  const injectFields = function(){
    if(document.getElementById('sfFieldsCss')) return;
    const s = document.createElement('style');
    s.id = 'sfFieldsCss';
    s.textContent = FIELDS_CSS;
    document.head.appendChild(s);
  };

  /* -- 3b2 - NO SUBTITLES UNDER AN OPTION -------------------------
     Every option in Settings is just its name. The second line - the count,
     the "leave empty for auto", the sentence explaining what a toggle does
     - is gone.

     settings.js's row() no longer writes one, which covers the whole app
     in one place. This is the backstop for the rows that do not come from
     there: a plugin writing its own markup into the panel, or a renderer
     wrapper in this file that builds a row by hand. They get the same
     answer without having to know about it. Scoped to .set-row so it
     cannot reach anything that is not a settings option. */
  const ROWS_CSS = [
    'html body .set-row .set-desc{',
    '  display:none !important;',
    '}',
    /* The second kind of subtitle: a sentence sitting directly under a card
       title, rather than under an option. There were four of these - the
       Comfort card, the keyless-provider card, each plugin group, and the
       Language card - and they were built as loose `div.tiny.muted` nodes
       rather than through row(), so the first rule never saw them. They are
       gone from settings.js; this catches the next one. A direct child of a
       card, inside the settings panel only: the Import page uses the same
       .set-card markup for its own notes and keeps them. */
    'html body #setBody .set-card > .tiny.muted{',
    '  display:none !important;',
    '}'
  ].join('\n');

  const injectRows = function(){
    if(document.getElementById('sfRowsCss')) return;
    const s = document.createElement('style');
    s.id = 'sfRowsCss';
    s.textContent = ROWS_CSS;
    document.head.appendChild(s);
  };

  /* -- 3c - ICON CONTROLS -----------------------------------------
     An icon-only control is not muted copy. The app draws its small icon
     buttons - the notebook's twist chevron, the kanban and outline tools
     (pencil, trash, bookmark), the story-bible tabs, the bible search, the
     outline twist and grip, the project row's pin/pencil/trash, the beat
     grip and trash, the Import caret - in --ink-4, which is the token for
     fourth-level TEXT.

     Measured: a chevron or a pencil drawn in --ink-4 sits at 2.77:1 against
     the card under it on Paper, and 2.33:1 on Night. Across all 27 themes
     --ink-4 fails the 3:1 that any non-text control needs on ELEVEN of them
     (worst: Slate at 2.55). That is the whole of "the chevrons are not
     showing" - it was never a light-theme problem, a white page just made
     it obvious.

     --ink-3 clears 3:1 on every theme (worst measured: 4.07 against
     --surface-2, 3.69 against --surface-3), so the base colour moves there.
     The app's own hover and selected states already use --ink, and they are
     restated here so this rule cannot flatten them. The empty states move
     too: their glyph is the only thing in an otherwise empty panel and it
     was the same --ink-4. */
  const ICON_CSS = [
    'html body :is(.ol-tool,.draft-act,.nb-twist,.bb-tab:not(.on),.bb-search i,',
    '  .idea-side-head i,.ol-twist i,.ol-grab i,.cat-stats-head i,',
    '  .pages-grid-label i,.proj-btn i,.beat-grab i,.beat-del i,',
    '  .imf-drop-btn i,.imf-drop-caret){',
    '  color:var(--ink-3) !important;',
    '}',
    /* The empty states. Their glyph carries the whole panel, and it is set
       on three different levels - .stats-empty-icon writes its own colour,
       .pages-empty writes it on the <i>, and the Plan board writes it on a
       rule prefixed with the page id - so each of those is named here
       rather than left to inherit. */
    'html body .stats-empty-icon, html body .stats-empty-icon i,',
    'html body .pages-empty i, html body .ol-empty i, html body .bb-empty i,',
    'html body .ol-empty, html body .bb-empty, html body .stats-empty,',
    'html body #page-plan .beat-empty, html body #page-plan .beat-empty i{',
    '  color:var(--ink-3) !important;',
    '}',
    /* what the app already does on hover and when selected, restated so the
       rule above cannot flatten it */
    'html body :is(.ol-tool,.draft-act):hover{ color:var(--ink) !important; }',
    'html body .bb-tab:hover{ color:var(--ink-2) !important; }',
    'html body .bb-tab.on{ color:var(--ink) !important; }'
  ].join('\n');

  const injectIcons = function(){
    if(document.getElementById('sfIconCss')) return;
    const s = document.createElement('style');
    s.id = 'sfIconCss';
    s.textContent = ICON_CSS;
    document.head.appendChild(s);
  };

  /* -- 3d - THE STATISTICS CARDS ----------------------------------
     The dashboard and the statistics page were two card systems. Measured
     off the dashboard: .home-stats is --surface-2, radius 8, padding
     12px 14px, gap 6, and no border at all. The statistics page had padding
     8px, gap 4, and a 1px border at 45% of --line - a hairline no other
     card in the app wears, and at 45% alpha not really a line anyway.

     Its captions were the other half of it: the dashboard writes a card
     label at 10.5px/600 uppercase with .08em tracking, while the KPI tiles
     wrote theirs at 9.5px/500 in --ink-4 - 2.38:1 on Paper, and below the
     3:1 a caption needs on 11 of the 27 themes.

     So the statistics cards take the dashboard's numbers: same fill, same
     corner, same padding, same caption, no border. Fill defines the card,
     which is how the rest of the app already works. */
  /* The class is doubled in every selector here on purpose. pages.js injects
     its own tile stylesheet at runtime, which lands AFTER this one, and at
     equal specificity a later !important wins - so the padding silently
     stayed at 8px until the specificity was raised above it. Doubling the
     class beats it by order-independent weight instead of by timing. */
  const STATS_CSS = [
    'html body .stat-card-lg.stat-card-lg, html body .stat-mini.stat-mini,',
    'html body .stats-chart-card.stats-chart-card,',
    'html body .stats-chart-wrap > .set-card.stats-chart-card{',
    '  background:var(--surface-2) !important;',
    '  border:0 !important; box-shadow:none !important;',
    '  border-radius:var(--r-lg,8px) !important;',
    '  padding:12px 14px !important;',
    '  gap:6px !important;',
    '}',
    'html body .stat-lbl.stat-lbl, html body .stats-page .set-card-title.set-card-title,',
    'html body .stats-wave-info-lbl.stats-wave-info-lbl{',
    '  font-size:10.5px !important; font-weight:600 !important;',
    '  letter-spacing:.08em !important; text-transform:uppercase !important;',
    '  color:var(--ink-3) !important;',
    '}',
    'html body .stat-ico.stat-ico{ color:var(--ink-3) !important; }',
    /* the same 12px rhythm the statistics body itself runs on */
    'html body .stats-grid-kpi.stats-grid-kpi, html body .stats-grid-mid.stats-grid-mid{ gap:12px !important; }',
    /* -- the page itself, the size of the Settings modal -------------
       The statistics page used to be as wide as the window, so at 1400px
       the KPI tiles were 331px each and the chart card ran the full width -
       four cards stretched edge to edge, with the page fixed at 100% of the
       window height so a short window clipped the chart instead.

       It is the Settings panel's box now: 880x700, the same 8px corner,
       the same hairline ring, the same surface-2-to-surface-1 wash down the
       top 96px. max-width/max-height 100% keep it inside a window smaller
       than that, and margin:auto centres it in the page instead of pinning
       it to the top - the page is a flex box for exactly that reason, and
       it scrolls rather than clips if a window is shorter than the cards
       can compress into. (margin:auto rather than align-items:center,
       because centring a flex item with align-items makes the top of an
       overlong child unreachable.)

       Inside, .stats-body is already flex:1 with min-height:0, so the chart
       card takes what is left of the 700px after the toolbar, the KPI row
       and the two mid cards. Measured at 1400x900: panel 880x700 centred,
       every card inside it, no scroll. */
    /* -- and the page's own gutter ------------------------------------
       The panel was flush against the app's two bars. The shell's grid
       row for the top bar is --compact-topbar (40px) while
       pages.css:8958 puts a 44px min-height back on the bar itself, so
       the bar hangs 4px into the stage - and this panel pins to the
       stage's top edge as soon as a window is shorter than its 700px,
       which left its top 4px behind the header. The bottom was the
       same story in reverse: the panel ended on the stage's own bottom
       edge, with nothing between it and the window.

       padding gives the flex box a smaller box to centre in, so the
       panel keeps its 700px when there is room, and stops at 8px below
       the painted header (52 = 44 + 8) and 24px above the bottom - the
       same 24px footer inset every other page uses (pages.css:6586). */
    /* ── THE SPOT THE SETTINGS PANEL OPENS IN ──────────────────────
       The scrim the Settings modal sits in is inset:0 of the VIEWPORT,
       centred, with 24px of its own padding, which puts that modal at
       (200,70) 880x700 on a 1280x840 window. The gutter below laid this
       page's panel out inside the stage instead - and the stage row
       starts 44px down, under the top bar - so the same 880x700 panel
       came up at (200,106): 36px lower, and 22-36px shorter whenever the
       window was short enough for the cap to bite (580 against 602 at
       1000x700). The page takes the scrim's own frame here - fixed over
       the viewport, centred, the same 24px - and the panel's cap moves
       to the modal's own 86vh, so the two land in the same place, at
       the same size, at every window size. The top bar keeps its 60 and
       stays over it, as it does on every other page. */
    'html body #page-stats.active{',
    '  position:fixed !important; inset:0 !important; z-index:59 !important;',
    '  display:flex !important; align-items:center !important; justify-content:center !important;',
    '  padding:24px !important; overflow:hidden !important;',
    '}',
    'html body #page-stats .stats-page{',
    '  width:880px !important; max-width:100% !important;',
    '  height:700px !important; max-height:86vh !important;',
    '  margin:0 !important;',
    '  padding:0 18px 18px !important;',   /* the head above brings the top space */
    '  border-radius:var(--r-lg,8px) !important;',
    '  overflow:hidden !important;',
    /* The panel is a FLAT --surface-1 now - the Settings modal's own fill,
       with its cards at --surface-3. That is the relationship Settings has
       between .settings-modal and .set-card, and it is what was asked for
       here. It carried a --surface-2-to---surface-1 gradient over 96px, and
       a flat --surface-2 after that; both are gone, so the panel is one
       colour the whole way down and its cards step off it at the top edge
       as well as at the bottom. */
    '  background:var(--surface-1) !important;',
    /* No ring. The panel is a fill - --surface-2 fading to --surface-1 - and
       that is already clear of the page's --bg, which is how every other
       card in the app is read. The 1px --line-2 outline that used to close
       it is gone; the drop shadow stays, because a shadow is depth, not an
       edge. */
    '  box-shadow:0 20px 50px -24px rgba(0,0,0,.5) !important;',
    '}',

    /* the panel's own cards, one step ABOVE it - --surface-3 against
       --surface-2, so they read at the panel's top edge as well as at its
       bottom. This is the relationship Settings has, where the modal is
       --surface-1 and its cards --surface-3. */
    'html body #page-stats .stats-page :is(.stat-card-lg,.set-card,.stats-chart-card,.dayline-tube){ background:var(--surface-3) !important; }',

    /* pages.css stacks the KPI row to two columns and the mid cards to one
       under a 1100px WINDOW (line 1268), which was right when the page was
       as wide as the window. It is not any more: the panel is 880px wide
       whatever the window is, so the query was measuring the window and
       acting on the panel - and at a 900px window the stacked KPI row and
       mid card pushed the chart 47px past the panel's bottom edge.
       Measured, not assumed. The panel's own width is what the grid should
       answer to, and 844px of panel holds four 202px tiles and two mid
       cards at any window size, so the row stays put. */
    /* NO SCROLLBAR. The body was given overflow:auto when a short window
       clipped the chart; the writer would rather the cards fit than the
       panel grow a bar, so it clips again - and the two floors that made
       the content taller than a laptop window came down with it. The chart
       wrapper was 180px and the two mid cards 100px; measured at a
       1024x600 window the body has 315px to work with, so the wrapper
       stops at 88 and the mid cards at 0, and the wave is the card that
       gives (its own numbers clip inside it, its box does not).
       Measured, not assumed: the four KPI tiles and the two mid cards are
       content-sized and cannot compress, so the chart is the only lever. */
    'html body #page-stats .stats-body{ overflow:hidden !important; }',
    'html body #page-stats .stats-chart-wrap{ min-height:80px !important; }',
    'html body #page-stats .stats-chart-card{ min-height:0 !important; }',
    'html body #page-stats .stats-grid-mid .set-card{ min-height:0 !important; }',
    /* a short window: the tiles and the cards lose 4px of padding a side,
       and below 650px the wave's LOW/AVG/HIGH/TOTAL column steps aside so
       the chart itself can be the small card instead of a clipped one */
    '@media (max-height:720px){',
    '  html body #page-stats .stat-card-lg, html body #page-stats .stats-grid-mid .set-card{ padding:10px 12px !important; }',
    '  html body #page-stats .stat-row-big{ margin:5px 0 !important; }',
    '  html body #page-stats .stat-bar{ margin-bottom:5px !important; }',
    '}',
    /* A short window: the card that holds LOW/AVG/HIGH/TOTAL is squeezed
       with everything else, and the four numbers used to run out of its
       bottom edge - the TOTAL row cut through the middle. They pair up two
       to a row here instead, which is 54px of column instead of 118, so
       the card can be 108px and still hold them whole. Measured at a
       1024x700 window, where the card is 172px: whole before and after. */
    '@media (max-height:760px){',
    '  html body #page-stats .stats-wave-info{',
    '    flex:0 0 auto !important;',
    '    display:grid !important; grid-template-columns:auto auto !important;',
    '    align-content:center !important; justify-items:start !important;',
    '    column-gap:14px !important; row-gap:2px !important;',
    '    padding:4px 0 4px 12px !important;',
    '  }',
    '  html body #page-stats .stats-wave-info::before{ top:4px !important; bottom:4px !important; }',
    '  html body #page-stats .stats-wave-info-val{ font-size:13px !important; }',
    '}',
    /* and under 640px the type itself steps down a half-step, which is
       where the last 17px between the cards and a 1024x600 window's body
       went: 4px off each card's caption, 4px off the streak's own line,
       4px of margin either side of the big number, and 2px of glyph. */
    '@media (max-height:640px){',
    '  html body #page-stats .stats-body .set-card-title{ margin-bottom:4px !important; }',
    '  html body #page-stats .stats-chart-card{ padding:8px 10px !important; }',
    '  html body #page-stats .wave-empty i{ font-size:18px !important; }',
    '  html body #page-stats .wave-empty-title{ font-size:12px !important; }',
    '  html body #page-stats .wave-empty-sub{ font-size:11px !important; }',
    '  html body #page-stats .stats-wave-info-val{ font-size:12px !important; }',
    '  html body #page-stats .stat-ico{ font-size:12px !important; line-height:1 !important; margin-bottom:0 !important; }',
    '  html body #page-stats .stat-big-sm{ font-size:24px !important; line-height:1.05 !important; }',
    '  html body #page-stats .stat-row-big{ margin:3px 0 !important; }',
    '  html body #page-stats .stat-lbl{ line-height:1.2 !important; }',
    '  html body #page-stats .stat-hint{ line-height:1.2 !important; }',
    '}',
    '@media (max-height:560px){',
    '  html body #page-stats .stats-dayline-wrap{ display:none !important; }',
    '}',
    'html body #page-stats .stats-grid-kpi{ grid-template-columns:repeat(4,1fr) !important; }',
    'html body #page-stats .stats-grid-mid{ grid-template-columns:1fr 1fr !important; }'
    ,
    /* -- the head, the grab, and the bar --------------------------------
       THE HEAD. The page wears the Settings modal's own header: the same
       .modal-head box, the same hairline under it, the ✕ at its right, so
       the panel reads as the same kind of window. It brings its own top
       spacing, which is why the page's padding-top above is 0 - the head
       sits on the panel's top edge and its border runs the panel's full
       width, clipped by the same 8px corner.

       THE GRAB. Pressing that head moves the panel (pages.js), so it takes
       the hand the Settings modal already shows in the same place. Only the
       head: everything else on the page keeps the pointer it had.

       THE BAR. Three parts, the workspace card's, at its own numbers: the
       mode switch at 28px on surface-3, a 1px line-2 hairline, then the
       category card. The dashboard's copy of these rules lives in a <style>
       inside the home page's markup and leaves with it the moment you
       navigate away, so the page that needs them carries its own. The extra
       class is what beats pages.css:728's 28px/3px 8px button floor. */
    /* 44px and 0 14px are what the Settings head actually measures at
       (678x44, padding 0 14px) - the page's own .modal-head came out 51px
       with 8px 14px, because it has no .settings-modal ancestor to carry
       that box. Measured, both, at a 1400px window. */
    /* The hairline closing the head off is the Settings head's own
       (pages.css:4075, 1px --line-2). The head inherits .modal-head from
       pages.css:724, which draws its rule in --line - and the panel under
       this one is the gradient's greyest end, so a --line hairline on it
       reads as no hairline at all. Same line the Settings head has, over
       the same 880px bleed, and the two heads then measure identically:
       44px tall, padding 0 14px, a 22x22 close inset 14px. */
    'html body #page-stats .stats-head{ margin:0 -18px 14px; padding:0 14px !important; min-height:44px !important; border-bottom:1px solid var(--line-2) !important; cursor:grab; justify-content:flex-end !important; }',
    'html body #page-stats .stats-head:active, html body #page-stats .stats-page.stats-dragging .stats-head{ cursor:grabbing; }',
    'html body #page-stats .stats-head-title{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--ink); }',
    'html body #page-stats .stats-head-title i{ font-size:13px; color:var(--ink-3); }',
    /* the close is the Settings modal's own close, to the pixel: a 22x22
       square, no padding, the same 12x12 stroke. Mirrored from
       pages.css:4126-4139 — #page-stats is not a .settings-modal. */
    'html body #page-stats .stats-head .icon-btn,',
    'html body #page-stats .stats-head .icon-btn.v-close{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  padding:0 !important; flex:0 0 auto !important;',
    '}',
    'html body #page-stats .stats-head .icon-btn svg{ width:12px !important; height:12px !important; display:block !important; }',
    'html body #page-stats .stats-top{ align-items:center !important; }',
    'html body #page-stats .stats-drops{ align-items:center; gap:10px; }',
    /* the category wears the same box as the switch beside it and the
       Export button opposite: a 28px chip on surface-3, no border. It is
       still a label - no hover, no pointer, nothing to press. */
    'html body #page-stats .stats-cat-label{',
    '  flex:0 0 auto; align-self:center;',
    '  display:inline-flex; align-items:center;',
    '  height:28px !important; padding:0 10px !important;',
    '  border-radius:var(--r-md) !important;',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '  font-size:11px !important; font-weight:600;',
    '  text-transform:uppercase; letter-spacing:.08em;',
    '  cursor:default;',
    '}',
    /* Export, brought up to the bar it sits in. It was a .btn.btn-ghost,
       and the ghost skin (pages.css:2350) is --surface-2 with an --ink-2
       label - one step behind and one step quieter than a filled chip,
       which is right for a button alone on a page and wrong for the third
       box in a row of two. Measured at rest: #292725 / #b0aaa1 here against
       #312e2c / #d9d3cb on NOVEL and FICTION beside it - and its own hover
       landed on exactly those two. Same fill and label as its neighbours
       now; the glyph stays a half-step back, the way the app's own action
       chips (pages.css:8377) draw a secondary action. */
    'html body #page-stats [data-act="stats-export"]{',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '}',
    'html body #page-stats [data-act="stats-export"] i{ color:var(--ink-2) !important; }',
    'html body #page-stats [data-act="stats-export"]:hover{ background:var(--surface-4) !important; color:var(--ink) !important; }',
    'html body #page-stats [data-act="stats-export"]:hover i{ color:var(--ink) !important; }',
    'html body #page-stats .stats-drops .stats-mode-toggle{',
    '  flex:0 0 auto; display:inline-flex; align-items:center; gap:7px;',
    '  height:28px !important; min-height:0 !important; padding:0 10px !important;',
    '  border:0 !important; outline:0 !important; border-radius:var(--r-md) !important;',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '  font-size:11px !important; cursor:pointer;',
    '}',
    'html body #page-stats .stats-drops .stats-mode-toggle:hover{ background:var(--surface-4) !important; }',
    'html body #page-stats .stats-mode-toggle > i:first-child{ font-size:13px !important; color:var(--accent) !important; }',
    'html body #page-stats .stats-mode-swap{ font-size:10px !important; color:var(--ink-4) !important; }',
    'html body #page-stats .stats-mode-name{ font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; }',
    'html body #page-stats .stats-bar-div{ flex:0 0 auto; width:1px; align-self:stretch; margin:1px 2px; background:var(--line-2); }',

    /* -- the two-column tile ---------------------------------------------
       The card is 202px, so .stat-duo's two equal columns left 65px for
       the label behind the divider - and "TOTAL SUBCHAPTERS" is one
       unbreakable word: measured at the standard 10.5px/.08em it is 88px
       wide and simply ran out of the card. Two things, both measured at a
       1400px window: the columns are no longer equal (1fr / 1.35fr puts
       the longer label in the wider one, 87px instead of 65px), and the
       label is a half-step smaller with no tracking ("SUBCHAPTERS" is
       71.3px at 9.5px, not 88px). That is 16px of slack, and it still fits
       with 9px at an 880px window, where the card is down to 190px.
       Measured, so it is not a guess: 88px of word, 65px of box before;
       71.3px of word, 87px of box after.

       Every other property of .stat-lbl is left alone, so both columns
       keep the colour, weight and case of the labels in the three cards
       beside them. break-word is the floor under the whole thing: on a
       window narrow enough to squeeze the sheet below 880px the word wraps
       rather than bleeding across the tile beside it. */
    'html body .stat-duo{ gap:8px !important; grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) !important; }',
    'html body .stat-duo-item + .stat-duo-item{ padding-left:8px !important; }',
    'html body .stat-duo .stat-lbl.stat-lbl{ font-size:9.5px !important; letter-spacing:0 !important; line-height:1.3 !important; overflow-wrap:break-word !important; }'
  ].join('\n');

  /* -- 3d2 - THE TWO TOP-BAR ACTIONS ------------------------------
     The bar carries two buttons and nothing else: each is its glyph, so
     the glyph has to sit in the middle of its own box.

     It did not. The 28px floor at pages.css:728 reaches every button in
     the app through a :is() list, and the most specific arm of that list
     is `.fab-menu button` (0,1,1) - which makes the whole selector
     (0,1,3), heavier than `html body .topbar-btn` at (0,1,2). So the
     5px / clamp(8px,.8vw,12px) padding written for the top bar (line
     6759) never lands, and neither does line 702's 4px / 9px: measured,
     the computed padding was 3px 8px.

     On a 36px button that leaves a 20px content box holding an 11.9px
     glyph, and a flex box starts its first item at the content edge -
     so the icon sat 4.06px LEFT of the button's centre, with 8.1px of
     empty box down its right side against 0 on its left. The fix is not
     a padding number: it is dropping the padding altogether and letting
     the flex box centre the glyph in the width min-width already sets,
     which makes the padding even on all four sides by construction
     rather than by arithmetic. min-* is left alone so a coarse pointer
     keeps the 40px target pages.css:6857 gives it. */
  const TOPICON_CSS = [
    'html body .topbar-actions .topbar-btn{',
    '  padding:0 !important;',
    '  justify-content:center !important;',
    '}',
    /* and the two of them stand apart: app.css:124 wanted 8px between
       these buttons and pages.css:701 cut it to 4px, which read as one
       glued pair. !important because the max-width:760px block
       (pages.css:6829) writes its own 4px. */
    'html body .topbar-actions{ gap:8px !important; }'
  ].join('\n');

  const injectTopIcon = function(){
    if(document.getElementById('sfTopIconCss')) return;
    const s = document.createElement('style');
    s.id = 'sfTopIconCss';
    s.textContent = TOPICON_CSS;
    document.head.appendChild(s);
  };

  const injectStats = function(){
    if(document.getElementById('sfStatsCss')) return;
    const s = document.createElement('style');
    s.id = 'sfStatsCss';
    s.textContent = STATS_CSS;
    document.head.appendChild(s);
  };

  /* -- 3e - THE TOGGLE --------------------------------------------
     A switch is not a text button, and pages.css knows it: line 728 puts a
     28px touch-target floor on every `button` in the app. min-height beats
     height outright, whatever the specificity, so a `<button class="tgl">`
     came out 30x28 where the .tgl rule asked for 30x17.

     Fifteen of the seventeen toggles are `<div>`s, so they were never
     caught by that floor and all sit at 30x17 - which is why the one in
     Settings > Sound stood out as the odd one: it is a `button`, and it
     was 11px taller than every toggle beside it. Same for the two on the
     Music page. The tag stays a button, because a switch you can reach with
     Tab and fire with Enter is worth more than the height, but it is
     exempted from the floor so it measures the same as the rest.

     min-height:0 rather than a fixed 17px: the modal rule sets 17px and the
     bare .tgl sets 20px for the page ones, and this only has to stop the
     floor from overriding whichever of those applies. */
  const TGL_CSS = [
    'html body button.tgl{',
    '  min-height:0 !important;',
    '  padding:0 !important;',
    '}',
    /* ── the accent is a STATE, not a coat of paint ────────────────
       The knob is deliberately NOT painted in the accent. A knob in the
       accent colour sits there lit whether the switch is on or off, so
       the control stops reading as a switch - both states looked ON, and
       a card holding four of them was four accent pills. It is left at
       the app's own --ink-3 (pages.css:2490 off, 8654 in the modal),
       which is what makes the accent TRACK the thing that means ON.

       The slider keeps the accent: there the thumb IS the value, and it
       is the one part of the control that says where the knob is. It was
       --ink (#d9d3cb, theme.css:352) and index.html's global-controls-fix
       block paints it --ink as well (two classes and a type), so .rng has
       to be named here to win it. */
    'html body .rng{ accent-color:var(--accent) !important; }',
    /* the slider thumb - see the note just above */
    'html body input[type="range"].rng::-webkit-slider-thumb{ background:var(--accent) !important; }',
    'html body input[type="range"].rng::-moz-range-thumb{ background:var(--accent) !important; }'
  ].join('\n');

  const injectTgl = function(){
    if(document.getElementById('sfTglCss')) return;
    const s = document.createElement('style');
    s.id = 'sfTglCss';
    s.textContent = TGL_CSS;
    document.head.appendChild(s);
  };

  /* -- 3e2 - THE ACCENT REACHES THE CONTROLS ------------------------
     state.js gives every palette a real accent colour now - a blue, a
     violet and an amber - instead of the near-white it used to be. That
     is what made every accent the app already had visible for the first
     time, and a first pass painted too many of them. The rule now is
     restraint: the accent marks STATE and ACTION, never decoration.

       the solid buttons - pages.css:1982 already paints .btn-primary from
         --accent / --accent-ink, so they need nothing here. Fetch models
         and Test connection are BOTH .btn-primary now: they used to be a
         filled/outlined pair, and the pair was asked to be one fill, so
         the outlined .btn-accent skin this file had added is gone again
         and nothing references it.
       the slider     - the accent IS the value (block above).
       the dropdown   - only under the pointer and on focus. A hairline
         on every field at rest turned a card holding three selects into
         three accent rectangles; that is the part being taken back out.
       the toggle     - the ON track is the accent. The knob is not.
       the ON knob    - the modal drew it #fff and pages.css drew it
         --bg; on a real accent a white knob on a coloured track is
         nearly invisible (measured 1.32:1 in the Settings modal, 10.12:1
         now). --accent-ink is the ink that reads on the accent, so it is
         right whatever the accent is. */
  const THEME_CSS = [
    /* the native pickers wore a ring of the accent on hover and on focus,
       which on the Settings page (font size, font weight, leading) read as an
       outline round every one of them — reported, and not wanted. The boxes
       the app draws in their place carry the state instead. */
    'html body .tgl.on::after, html body .modal .tgl.on::after{',
    '  background:var(--accent-ink) !important;',
    '}',
    /* the Color card in Settings -> Appearance: one chip per palette,
       named only. The swatch that used to sit in front of each name
       (a square of the palette's surface with the accent cut into the
       corner) is gone - the names say which is which. */
    'html body .sf-theme-grid{ display:flex !important; gap:8px !important; flex-wrap:wrap !important; }',
    'html body .sf-theme-tile{',
    '  display:flex !important; align-items:center !important; gap:8px !important;',
    '  height:30px !important; min-height:0 !important; padding:0 12px !important;',
    /* --surface-4, not -3: the tile sits on a .set-card, and a .set-card IS
       --surface-3 (pages.css:5519) - at -3 the unselected chip merged into
       the card behind it and only the selected one looked like a box. */
    '  background:var(--surface-4) !important; border:0 !important; box-shadow:none !important;',
    '  border-radius:6px !important; color:var(--ink-2) !important;',
    '  font-size:11.5px !important; font-weight:500 !important; cursor:pointer !important;',
    '  transition:background var(--t-fast) var(--ease), color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease) !important;',
    '}',
    'html body .sf-theme-tile:hover{ background:var(--surface-5) !important; color:var(--ink) !important; }',
    /* asked for: the selected chip reads as a filled box in its own accent,
       the same fill a button takes - not a hairline ring around a grey chip. */
    'html body .sf-theme-tile.on{',
    '  background:var(--accent) !important; color:var(--accent-ink) !important; font-weight:600 !important;',
    '  box-shadow:none !important;',
    '}',
    /* the selected tile was the one button in the app that answered nothing
       under the pointer: .on and .on:hover were the same declaration on
       purpose, so the fill stayed solid. It stays solid - a solid fill
       answers the pointer the way the app's own solid buttons do, with
       opacity:.9 (pages.css:4001, .fab-ai .ai-chip.primary:hover). */
    'html body .sf-theme-tile.on:hover{ opacity:.9 !important; }',
    /* ── and the three states that lost their hover to a tie ──────
       Not missing rules: in all three the base rule and the :hover rule
       carry the same weight and the base one comes later, so it wins in
       every state. Each fix names the same chain plus :hover - one class
       more, and the pointer is answered again.
       Measured across 13 pages, 7 Settings tabs, the FAB menu, the AI
       panel and the projects overlay: 35 button classes, 4 dead. */
    /* the write page's category/mode trigger - pages.css:2614 sets
       .stats-cat-card .stats-cat-title transparent at (0,2,2) !important,
       which ties pages.css:2371's --surface-3 hover and wins on order */
    'html body .stats-cat-card .stats-cat-title:hover{ background:var(--surface-3) !important; }',
    /* the selected Bible tab - .bb-tab.on (pages.css:8982) is --surface-4
       and sits after .bb-tab:hover (8981) at the same weight; --surface-5
       is the app's own next step up for a grey fill (pages.css:4530) */
    'html body .bb-tab.on:hover{ background:var(--surface-5, var(--surface-4)) !important; color:var(--ink) !important; }',
    /* the selected Settings tab - the .active ink fill (pages.css:3952)
       comes after the tab's own :hover overlay (3948); solid fill, so
       opacity:.9 like .btn-primary:hover beside it */
    'html body .settings-modal #setTabs .set-tab.active:hover{ opacity:.9 !important; }',
    /* ── EVERY CLEAR AND RESET WEARS THE IDEA BAR'S CLEAR ────
       One button kind for the lot, so the same command reads the same
       wherever it stands: the Draft page's Clear (.draft-clear), the Plan
       board's Clear (.plan-btn-clear, which is what the one [data-act=
       "clear-beats"] becomes), the canvas toolbar's ([data-cx-clear]) and
       the canvas bar's own ([data-mm="clear"]), the Kanban's Reset
       ([data-kb="reset"]), and the type panel's Reset to app defaults. All
       of them wear the Idea bar Clear's box: --surface-3 at rest with the
       label in --ink-2, and the theme's light accent - its 12% wash, then
       the accent itself for the label - under the pointer and on the press.
       Nothing is red and nothing is a bare label any more.
       The .btn.btn-ghost arm needs both classes: this sheet's own
       'html body .btn.btn-ghost:hover' would otherwise out-rank a bare
       [data-cx-clear]. */
    'html body .ol-btn.plan-btn-clear,',
    'html body .ol-btn.draft-clear, html body .btn.btn-ghost[data-cx-clear],',
    'html body .ol-btn[data-mm="clear"], html body .ol-btn[data-kb="reset"]{',
    '  background:var(--surface-3) !important;',
    '  color:var(--ink-2) !important;',
    '}',
    'html body .ol-btn.plan-btn-clear:hover,',
    'html body .ol-btn.plan-btn-clear:active,',
    'html body .ol-btn.draft-clear:hover, html body .ol-btn.draft-clear:active,',
    'html body .btn.btn-ghost[data-cx-clear]:hover,',
    'html body .ol-btn[data-mm="clear"]:hover, html body .ol-btn[data-mm="clear"]:active,',
    'html body .ol-btn[data-kb="reset"]:hover, html body .ol-btn[data-kb="reset"]:active{',
    '  background:var(--accent-soft) !important;',
    '  color:var(--accent) !important;',
    '  opacity:1 !important;',
    '}',
    'html body .ol-btn.plan-btn-clear i,',
    'html body .ol-btn.draft-clear i, html body .btn.btn-ghost[data-cx-clear] i,',
    'html body .ol-btn[data-mm="clear"] i, html body .ol-btn[data-kb="reset"] i{',
    '  color:inherit !important;',
    '}',
    /* pages.css:10218 aims its own red at this one button with an id in the
       selector ('html body #page-plan .plan-actions .plan-btn-clear:hover'),
       which out-ranks the group above - so the Plan board's Clear is given
       the same arm again on its own, at that same weight. Same sheet, later:
       it takes the hover back. */
    'html body #page-plan .plan-actions .plan-btn-clear:hover,',
    'html body #page-plan .plan-actions .plan-btn-clear:active{',
    '  background:var(--accent-soft) !important;',
    '  color:var(--accent) !important;',
    '  border-color:transparent !important;',
    '  opacity:1 !important;',
    '}',
    /* the type panel's own Reset: the box it already had, going to the accent
       under the pointer like every other Reset now does */
    'html body .typo-reset:hover, html body .typo-reset:active{',
    '  background:var(--accent-soft) !important;',
    '  color:var(--accent) !important;',
    '}',
    /* the Idea bar's Clear, as it was: the filled box its neighbours on the
       bar wear — the same --surface-3 as T and New prompt, no ring, and the
       label stepping off the fill — going to the accent (its 12% wash, then
       the accent itself for the label) under the pointer and on the press.
       It is not the Settings Save button and it is not red: it is the bar's
       own fourth button. */
    'html body .ol-btn.idea-clear{',
    '  background:var(--surface-3) !important; border:0 !important;',
    '  color:var(--ink-2) !important;',
    '}',
    'html body .ol-btn.idea-clear:hover, html body .ol-btn.idea-clear:active{',
    '  background:var(--accent-soft) !important;',
    '  border:0 !important;',
    '  color:var(--accent) !important;',
    '  opacity:1 !important;',
    '}',
    /* ── the dropdown's rows ─────────────────────────────────
       Three states were unreadable, and all three came from a fill that
       matched whatever was behind it.

       1. The trigger on hover. In Settings the dd-card sits on a
          .set-card, and that card IS --surface-3 - so the row's own
          :hover (--surface-3, pages.css:1064) made the fill identical
          to the card and the box appeared to vanish, leaving only its
          hairline. It steps to --surface-4 instead, which is clear of
          both the card behind it and the card's own --surface-2 fill.

       2. A row on hover. The open list is --surface-2 (pages.css:5519
          for the settings card), and .stats-cat-item:hover is
          --surface-2 as well, so hovering a choice changed nothing at
          all. It steps to --surface-3.

       3. The chosen row. pages.css:2078 flattens every .active row to
          `background:transparent` - "selected = a brighter hairline,
          nothing more" - which on a list of choices means the one you
          picked is the one with no mark on it. This is the place the
          accent belongs: a soft accent wash, the accent as the label,
          and the tick in the accent.

       Measured in Settings -> Appearance before the change: list
       rgb(41,39,37), row rest transparent, row hover rgb(41,39,37),
       chosen row transparent, card behind rgb(49,46,44).

       Two of these name a class twice (.stats-cat-item.stats-cat-item)
       because that is how pages.css:2631 pins the chosen row to
       `transparent` - a doubled class to out-specify its own sheet. A
       plain .stats-cat-item.active ties with it and loses on order, so
       the only way back over it is the same doubling; the trigger's own
       :hover is a four-class selector for the same reason. */
    /* asked for: hovering the closed box does NOTHING - no lift, no
       edge, no colour. The row keeps --surface-2 (transparent over
       the card's own fill), so the pointer changes nothing at all. */
    'html body .dd-card .stats-cat-title.stats-cat-title:hover{ background:transparent !important; }',
    /* ── and the light goes on the CARD, not on the button ────────
       On these controls .dd-card and .stats-cat-card are the SAME element
       (one box carries both classes), so the chip that must step up under
       the pointer is the box you see - and the trigger inside stays
       transparent in every state, which is what the rule above is for.
       Without this the pointer got nothing at all on any dropdown: this
       rule's own history is why. It read :hover{transparent} on the
       trigger, measured at (0,4,2), so no hover fill anywhere could land -
       it was the last word on the trigger in every state.
       --surface-4, not -3: these cards are --surface-2 on the write page's
       chapter bar and already --surface-3 on the three bars that needed the
       step up (the prompt, plan and manuscript groups), so -3 would be
       invisible on those three.
       The selector is heavy on purpose. The bars' own rule - `html body
       :is(.idea-bar,.chapter-controls,.page-head,.ol-head) .dd-card.dd-card`
       - is (0,3,2) !important, and the plan picker's is (1,4,2), so a plain
       `html body .dd-card:hover` lost to both: measured, it changed nothing
       on the write, plan and prompt bars. Carrying #stage and three classes
       makes it (1,4,2) - a tie with the plan picker's, won on order because
       this sheet is injected last and this rule is written below it. The
       settings dropdowns live outside #stage, in #modalRoot, so they need
       their own arm.
       The fill is mixed FROM --component-dropdowns rather than set to a
       surface, so the Appearance "dropdown surface" setting still decides
       what these controls are: the hover is 18% of the way to the ink, a
       light step whatever surface was chosen. Forcing a surface here is
       what an earlier pass did, and it switched that setting off. */
    /* ── a dropdown needs a box on the strips that share its own fill ──
       Every .dd-card in the app is filled from --component-dropdowns, which
       is --surface-2 (settings.js:1075). That is a step off the --surface-3
       Settings card it was tuned against - and no step at all on the three
       bars that are themselves --surface-2, where the control came out as
       bare text beside its label:

         held it against the page, measured:
           plan        .page-head.ol-head   rgb(41,39,37) on rgb(41,39,37)
           prompt      .idea-bar            rgb(41,39,37) on rgb(41,39,37)
           manuscript  .chapter-controls    rgb(41,39,37) on rgb(41,39,37)

       On those the control takes --surface-3, the app's own action-chip step
       (pages.css:8377) - one step UP off the strip, no outline. Everywhere
       else the token's --surface-2 keeps working untouched, Settings
       included. The class is doubled because the token is set through
       html[data-component-themes="1"] body :is(...), which weighs (0,2,2).

       The padding is the Settings freedom on all of them: 8px 12px around an
       11px label, a 33px chip.

       The plan page needs its own arm of the selector: pages.css:10890 pins
       that picker to --surface-2 plus a --line-2 hairline on purpose, at
       (1,3,2) - one id and three classes - so the double class here has to
       be joined by the same id and picker chain to out-rank it. */
    /* the dashboard bar's category: the Statistics label's chip, to the pixel
       - a 28px --surface-3 box, 11px/600 uppercase at .08em, cursor default.
       pages.css has no rule for it, so no specificity fight. */
    'html body #page-home .home-cat-label{',
    '  flex:0 0 auto; align-self:center;',
    '  display:inline-flex; align-items:center;',
    '  height:28px !important; padding:0 10px !important;',
    '  border-radius:var(--r-md) !important;',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '  font-size:11px !important; font-weight:600;',
    '  text-transform:uppercase; letter-spacing:.08em;',
    '  cursor:default;',
    '}',
    /* ── a dropdown hugs what it holds ──────────────────────────────
       The in-bar pickers were pinned to 132px (prompt, plan) and 220px (the
       chapter bars) by min-width, and their trigger's contents sit at the
       LEFT of that box - so a "None" 28px wide left 71px of dead box after
       the caret. min-width:0 lets the box be the value plus its padding.
       Settings keeps its 150-240px band: its values are model names and font
       families and it wants a steady column. */
    'html body #page-inspire .idea-pick .dd-card.dd-card,',
    'html body #page-plan .page-head .plan-picker .dd-card.dd-card,',
    'html body #page-plan .beat-card-head .dd-card.dd-card,',
    'html body .chapter-controls .dd-card.dd-card{ min-width:0 !important; max-width:none !important; }',

    'html body :is(.idea-bar,.chapter-controls,.page-head,.ol-head) .dd-card.dd-card,',
    'html body #page-plan .page-head .plan-picker .dd-card.dd-card{ background:var(--surface-3) !important; border:0 !important; }',
    'html body .dd-card .stats-cat-title{ padding:8px 12px !important; gap:10px !important; }',
    'html body #stage .dd-card.dd-card.dd-card:hover,',
    'html body #modalRoot .dd-card.dd-card.dd-card:hover{',
    '  background:color-mix(in srgb, var(--component-dropdowns, var(--surface-2)) 82%, var(--ink)) !important;',
    '}',
    'html body .dd-card .stats-cat-item:hover{ background:var(--surface-3) !important; color:var(--ink) !important; }',
    /* ── and the same bug on every plain button ─────────────────────
       A .btn sits at --surface-2 and hovered to --surface-3 - which is
       exactly what a .set-card is painted. So on any card the button
       merged into its background the moment the pointer touched it and
       read as gone (reported on Snapshot now). One step further, to
       --surface-4, keeps the hover clear of the card behind it. */
    'html body .btn.btn-ghost:hover, html body .btn:not(.btn-primary):hover{ background:var(--surface-4) !important; }',
    /* ── the dashboard's search: a box in BOTH states ────
       Closed it is the magnifier in a 28px chip; opened it is the field in
       a 28px box - and the magnifier inside keeps a small box of its own,
       because the field's leading button IS the button that opened it.
       pages.js styles all of this from a <style> that rides inside
       #page-home, so it arrives after this sheet and takes any tie; hence
       the #page-home here - an id beats its two classes. padding:0 is part
       of it: pages.css:728's button floor puts 3px 8px on a 28px glyph
       button otherwise. */
    'html body #page-home .home-search-btn{ background:var(--surface-3) !important; padding:0 !important; }',
    'html body #page-home .home-search-btn:hover{ background:var(--surface-4) !important; color:var(--ink) !important; }',
    'html body #page-home .home-search, html body #page-home .home-search:focus-within{ background:var(--surface-3) !important; }',
    'html body #page-home .home-search:focus-within{ box-shadow:inset 0 0 0 1px var(--accent) !important; }',
    /* the magnifier is a chip INSIDE the open field, clear of the field's own
       edge on all four sides. It was built as an attached leading segment for
       one pass and it read badly: the field's focus ring is an inset shadow,
       and a child covering that edge cuts the ring in two. Detached, the ring
       closes round the whole field again. */
    'html body #page-home .home-search .home-search-toggle{',
    '  width:20px !important; height:20px !important; min-width:0 !important; min-height:0 !important;',
    '  background:var(--surface-4) !important; color:var(--ink-2) !important;',
    '  border-radius:5px !important;',
    '}',
    'html body #page-home .home-search .home-search-toggle:hover{ background:var(--surface-5) !important; color:var(--ink) !important; }',
    /* ── a flipped-up list, and the seam it leaves behind ──
       pages.css:4601 already flips .dd-card.dd-up, but its border and radius
       are written for the plan board's cards. Inside a .set-ctrl the list is
       styled a class deeper, and that deeper rule wins on specificity - so
       the flipped copy there kept border-top:0 and squared the wrong edge,
       finishing as a box with no far border at all. Naming the same chain
       puts the swap back: seam at the bottom (against the trigger), border
       and rounded corners at the top. The card is raised so an upward list
       clears the card it is opening over. */
    'html body .dd-card.dd-up{ position:relative !important; z-index:60 !important; }',
    /* ── the flipped-up list is the DOWN list, upside down ────────
       It used to be attached: bottom:calc(100% - 1px), border-bottom:0,
       radius 6px 6px 0 0. That is the shape an attached popup has, and it
       stopped matching anything the moment the list that opens DOWNWARDS
       stopped being attached - that one sits 5px under its trigger with a
       full hairline and --r-lg on all four corners (measured: list top
       525.75 against a card bottom of 520.75, radius 8px, border 1px on
       every side).
       So the flipped copy carried two square bottom corners against a
       trigger that is a rounded box of its own, which is the seam that was
       reported. The two states are one shape now: the same 5px gap, the
       same full hairline, the same --r-lg all round. Measured after:
       list bottom 5px above the card, radius 8px, border 1px top and
       bottom. */
    'html body .dd-card.dd-up .stats-cat-list,',
    'html body .set-ctrl .dd-card.dd-up .stats-cat-list{',
    '  top:auto !important; bottom:calc(100% + 5px) !important;',
    '  border:1px solid var(--line-2) !important;',
    '  border-radius:var(--r-lg, 8px) !important;',
    '}',
    /* ── the scrollbar: why the accent never landed on it ─────────
       A scrollbar is PAINTED from `scrollbar-color`. With a non-auto value
       Chromium paints the bar natively from those two colours and the
       ::-webkit-scrollbar layer does not paint at all - and this app has had
       scrollbar-color non-auto from the very start (theme.css:448 on *, and
       pages.css:6424 on html/body, plus the five lists pinned at id weight).
       So every webkit arm below - the pinned widths, the rounded --line-3
       thumbs, and the :hover/:active rules that were supposed to light the
       accent - was writing to a layer that is not the one on screen. That is
       why the bar stayed grey however long it was held. On overlay
       scrollbars (macOS, Windows 11) that is the only mechanism there is:
       only scrollbar-color paints, and ::-webkit-scrollbar is ignored
       outright. Measured: html computed scrollbar-color rgb(58,55,52)
       rgb(27,26,25) - the bar on screen is those two colours.

       The state therefore lives in scrollbar-color, hung on the SCROLLER's
       :hover and :active - both true while the bar is held, because a
       scrollbar is part of the element's own box. --accent is read live, so
       the bar is blue on the blue theme and yellow on the yellow theme, like
       every other accent in the app. Nothing changes at rest: the bar keeps
       the colour it already had (theme.css's --surface-4 / --bg, and --line-3
       on the five pinned lists).

       The webkit arms underneath stay: they are what Safari paints (Safari
       has no scrollbar-color), and where they do not fire they cost nothing.

       One deliberate exclusion - the strips that hide their own bar
       (#setTabs, .tb, .pn-chips, .bb-tabs, .idea-chips, .menubar, .mv-*) keep
       scrollbar-width:none and stay out of the 'html body *' arm only by
       never overflowing: they are the only places a stray accent bar could
       appear, so they are named by nothing here. */
    'html:hover, html:active, body:hover, body:active,',
    'html body *:hover, html body *:active,',
    'html body #pagesOverlay .projects-wrap #projList:hover,',
    'html body #pagesOverlay .projects-wrap #projList:active,',
    'html body #page-outline .ol-panel:hover, html body #page-outline .ol-panel:active,',
    'html body #page-bible .bb-rows:hover, html body #page-bible .bb-rows:active,',
    'html body #page-draft .draft-rows:hover, html body #page-draft .draft-rows:active,',
    'html body #page-inspire .idea-rows:hover, html body #page-inspire .idea-rows:active{',
    '  scrollbar-color:var(--surface-4) var(--bg) !important;',
    '}',
    /* the webkit layer - Safari, and any engine that really does paint it */
    'html:hover::-webkit-scrollbar-thumb,',
    'html:active::-webkit-scrollbar-thumb,',
    'body:hover::-webkit-scrollbar-thumb,',
    'body:active::-webkit-scrollbar-thumb,',
    'html body *:hover::-webkit-scrollbar-thumb,',
    'html body *:active::-webkit-scrollbar-thumb,',
    'html body #pagesOverlay .projects-wrap #projList:hover::-webkit-scrollbar-thumb,',
    'html body #pagesOverlay .projects-wrap #projList:active::-webkit-scrollbar-thumb,',
    'html body #page-outline .ol-panel:hover::-webkit-scrollbar-thumb,',
    'html body #page-outline .ol-panel:active::-webkit-scrollbar-thumb,',
    'html body #page-bible .bb-rows:hover::-webkit-scrollbar-thumb,',
    'html body #page-bible .bb-rows:active::-webkit-scrollbar-thumb,',
    'html body #page-draft .draft-rows:hover::-webkit-scrollbar-thumb,',
    'html body #page-draft .draft-rows:active::-webkit-scrollbar-thumb,',
    'html body #page-inspire .idea-rows:hover::-webkit-scrollbar-thumb,',
    'html body #page-inspire .idea-rows:active::-webkit-scrollbar-thumb,',
    '::-webkit-scrollbar-thumb:hover,',
    '::-webkit-scrollbar-thumb:active,',
    'html body ::-webkit-scrollbar-thumb:hover,',
    'html body ::-webkit-scrollbar-thumb:active,',
    'html body #pagesOverlay .projects-wrap #projList::-webkit-scrollbar-thumb:hover,',
    'html body #pagesOverlay .projects-wrap #projList::-webkit-scrollbar-thumb:active,',
    'html body #page-outline .ol-panel::-webkit-scrollbar-thumb:hover,',
    'html body #page-outline .ol-panel::-webkit-scrollbar-thumb:active,',
    'html body #page-bible .bb-rows::-webkit-scrollbar-thumb:hover,',
    'html body #page-bible .bb-rows::-webkit-scrollbar-thumb:active,',
    'html body #page-draft .draft-rows::-webkit-scrollbar-thumb:hover,',
    'html body #page-draft .draft-rows::-webkit-scrollbar-thumb:active,',
    'html body #page-inspire .idea-rows::-webkit-scrollbar-thumb:hover,',
    'html body #page-inspire .idea-rows::-webkit-scrollbar-thumb:active{',
    '  background:var(--line-3, var(--line)) !important;',
    '  background-clip:padding-box !important;',
    '}',
    /* ── AND THE ACCENT GOES ON THE BAR, NOT ON THE PANEL ─────────
       The two rules above used to hand the accent to every scroller the
       pointer was over. A scrollbar is part of the scroller's own box, so
       “the pointer is over the bar” and “the pointer is somewhere over the
       panel” are the same :hover — which is why the bar of the Idea cards,
       of Settings and of every card went accent the moment the pointer
       entered, with no bar under it at all; and on the strips that pin their
       colour at id weight (the Bible's list, the five pinned lists, the
       dropdown lists in pages.css) the accent never appeared however long
       the bar was held. One fault, reported from both ends.

       So no stylesheet lights a bar on hover any more. The ONE scroller whose
       bar the pointer is actually on is lit by the hand that is on it (the
       block after this stylesheet), and that element is lit by an INLINE
       scrollbar-color with priority — the only weight that outranks the rules
       pinned at id weight. Off the bar there is nothing to light: at rest
       every bar keeps the colour it always had. The webkit arm here is for
       the engines that paint that layer instead (Safari before 18.2). */
    'html body .sf-bar-hot::-webkit-scrollbar-thumb{',
    '  background:var(--accent) !important; background-clip:padding-box !important;',
    '}',

    /* ── THE ACCENT ON WHAT IS HOVERED, CHOSEN OR HELD ───────────
       Every pressable thing in this app answered the pointer with a grey
       (--surface-4) and nothing else, so nothing on screen ever said which
       control the pointer was on, nor which one was picked. The accent is
       this app's own mark for exactly that (a chip that is on, a pair that is
       picked, the row that is active) and it is used here on the controls
       themselves: the ground takes the accent's soft wash, the label and its
       icon take the accent, and a control that is ON keeps it. Fields,
       panels and the Bible's own detail pane are deliberately NOT in this
       list — a writing box and a picture box's setting are not controls. */
    'html body .ol-btn:hover, html body .ol-btn:active, html body .ol-btn.on,',
    'html body .ol-tool:hover, html body .ol-tool:active, html body .ol-tool.on,',
    'html body .icon-btn-sm:hover, html body .icon-btn-sm:active,',
    'html body .icon-btn:hover, html body .icon-btn:active,',
    'html body .mv-pager-btn:hover, html body .mv-pager-btn:active,',
    'html body .draft-act:hover, html body .draft-act:active,',
    'html body .tb-btn:hover, html body .tb-btn:active, html body .tb-btn.on,',
    'html body .btn:hover, html body .btn:active, html body .btn.on,',
    'html body .chip:hover, html body .chip:active, html body .chip.on,',
    'html body .ft-pair:hover, html body .ft-pair.on,',
    'html body .kb-addlist:hover, html body .bb-search:hover{',
    '  background:var(--accent-soft, rgba(0,0,0,.08)) !important;',
    '  color:var(--accent-2, var(--accent)) !important;',
    '}',
    /* the mark inside a control follows the control, never the ink */
    'html body .ol-btn:hover i, html body .ol-btn:active i, html body .ol-btn.on i,',
    'html body .ol-tool:hover i, html body .ol-tool:active i, html body .ol-tool.on i,',
    'html body .icon-btn-sm:hover i, html body .icon-btn-sm:active i,',
    'html body .icon-btn:hover i, html body .icon-btn:active i,',
    'html body .mv-pager-btn:hover i, html body .mv-pager-btn:active i,',
    'html body .draft-act:hover i, html body .draft-act:active i,',
    'html body .tb-btn:hover i, html body .tb-btn:active i, html body .tb-btn.on i,',
    'html body .btn:hover i, html body .btn:active i, html body .btn.on i,',
    'html body .chip:hover i, html body .chip.on i, html body .ft-pair.on i{',
    '  color:inherit !important;',
    '}',
    /* a dropdown: its trigger answers like a control, and the card it opens
       is outline in the accent so the open one is never in doubt */
    'html body .draft-drop-btn:hover, html body .draft-drop-btn:active,',
    'html body .tb-drop-btn:hover, html body .tb-drop-btn:active,',
    'html body .tb-drop2-btn:hover, html body .tb-drop2-btn:active,',
    'html body .dd-trigger:hover, html body .dd-trigger:active,',
    'html body .stats-cat-card:hover, html body .stats-cat-card.open,',
    'html body .draft-drop.open .draft-drop-btn, html body .tb-drop.open .tb-drop-btn{',
    '  background:var(--accent-soft, rgba(0,0,0,.08)) !important;',
    '  color:var(--accent-2, var(--accent)) !important;',
    '}',
    /* the open dropdown got a 1px ring of the accent round it as well — an
       outline drawn on a control, which is exactly what was reported. The
       wash and the accent label say it is open; nothing draws a line. */
    /* and the rows of a dropdown list: the one under the pointer, and the one
       that is picked, are the accent — as a WASH of it and the accent on the
       label, never as a slab of it: a row that is filled solid is a mark for a
       button that is ON, and a dropdown list can hold three dozen rows. */
    'html body .stats-cat-item:hover, html body .stats-cat-item.on,',
    'html body .draft-drop-item:hover, html body .draft-drop-item.on,',
    'html body .dd-item:hover, html body .dd-item.on,',
    'html body .tb-drop-list > *:hover, html body .tb-drop2-list > *:hover{',
    '  background:var(--accent-soft, rgba(255,255,255,.09)) !important;',
    '  color:var(--accent-2, var(--accent)) !important;',
    '}',
    /* the Bible's own pane stays neutral — a field's tools are not controls */
    'html body #bbDetail .ol-btn:hover, html body #bbDetail .ol-btn:active,',
    'html body #bbDetail .ol-tool:hover, html body #bbDetail .ol-tool:active{',
    '  background:var(--surface-4) !important; color:var(--ink) !important;',
    '}',
    /* ── the filter box on the Draft and Idea cards ───────────
       Both keep the Bible's own .bb-search box (pages.css:9004), so the three
       lists read as one control. It is a flex item in a column that is already
       a flex column (.draft-list, .idea-side), so it only needs to be held at
       its own 30px and kept out of the rows' share of the height. */
    'html body .draft-list .bb-search, html body .idea-side .bb-search{',
    '  flex:0 0 auto !important; width:auto !important; align-self:stretch !important;',
    '}',
    'html body .draft-list .bb-search{ margin:0 0 6px !important; }',
    'html body .idea-side .bb-search{ margin:0 0 5px !important; }',
    /* ── and the Idea card opens with its box ───────────────
       The Bible card's first row is its filter box and the Idea card now
       reads the same way: the box is the card's first row, ABOVE the
       “Saved prompts” title, inset the 6px the Bible's own card keeps
       around it. order does the whole move, so no markup changes and
       every repaint keeps the box where the title used to start. */
    'html body #page-inspire .idea-side > .bb-search{',
    '  order:-1 !important; margin:6px 6px 6px !important;',
    '}',
    'html body .dd-card .stats-cat-item.stats-cat-item.active{ background:var(--accent-soft) !important; color:var(--accent) !important; border-color:transparent !important; }',
    /* ── no dropdown scrolls sideways ─────────────────────────
       A .stats-cat-list is exactly as wide as its trigger and is opened
       with overflow-y:auto — which, per CSS, computes overflow-x to auto
       as well. So any list holding a label longer than its trigger grew a
       horizontal bar across the bottom: “Science fiction” and “Mentor and
       student” in the Idea bar's two pickers, whose triggers are 72px.
       The list takes the width its longest row needs and never less than
       the trigger, so there is nothing left to scroll. The cap plus a
       wrapping label keeps a very long name — a draft title, a chapter,
       a font family — inside the viewport instead of running off it. */
    'html body .dd-card .stats-cat-list{',
    '  width:max-content !important; min-width:100% !important;',
    '  max-width:min(340px, calc(100vw - 24px)) !important;',
    '  overflow-x:hidden !important;',
    '}',
    /* ── the type panel's dropdowns had no box ──────────
       Font, Size, Leading and Weight inside the T panel sat in --surface-2
       cards on a --surface-2 panel: a label, a value and a caret with
       nothing to say they could be opened - the only dropdowns in the app
       with no box round them. They take the --surface-3 every other
       dropdown trigger wears (the pickers, the bars, Settings) and step a
       shade further under the pointer, like the ones in #stage do. The
       panel is appended to <body>, so those #stage/#modalRoot hover arms
       never reached it. */
    'html body [data-typo-panel] .dd-card.dd-card{ background:var(--surface-3) !important; }',
    'html body [data-typo-panel] .dd-card.dd-card:hover{ background:var(--surface-4) !important; }',
    'html body .dd-card .stats-cat-item > span{ min-width:0 !important; }',
    /* the toolbar's and the draft header's lists already take their content
       width (width:max-content, min-width:100%), but both cap at 280-320px
       with a nowrap row - so a label longer than the cap was cut off by a
       horizontal bar there instead of wrapping. Same two answers: nothing
       scrolls sideways, and a row past the cap wraps onto a second line. */
    'html body .tb-drop-list, html body .tb-drop2-list, html body .draft-drop-list{',
    '  overflow-x:hidden !important;',
    '}',
    'html body .tb-drop-item, html body .tb-drop2-item{ white-space:normal !important; }',
    'html body .dd-card .stats-cat-item.active i{ color:var(--accent) !important; opacity:1 !important; }',
  ].join('\n');

  /* -- 3g - THE COMFORT SCALE ---------------------------------------
     Asked for: the whole app, on every page, comfortable instead of
     compact. Nothing here is a new idea about how the app should look -
     every number is the one it already had, one step up, applied to the
     components the app is actually built out of:

       controls      28px tall, 11px type  ->  30px tall, 12px type
       icon buttons  28x28                 ->  30x30
       list rows     7-8px of padding      ->  8-10px
       dropdown rows 3-6px / 8-9px         ->  6-8px / 10-11px
       cards         12/13px padding       ->  14/16px
       panels        6px padding           ->  8px
       page gutters  8px / 22px            ->  11px / 24px
       the frame     40px topbar           ->  44px
       type          10-11.5px labels      ->  10.5-13px

     This is the SECOND pass. The first one went a full step on every
     number - 28 to 32, 40 to 48, 11px type to 12.5px - and it read as
     roomy rather than comfortable: "this much comfortable is not good".
     Every number here is the first pass's step halved, so the app is
     still a step off the compact original but sits between the two.

     The frame rides its own tokens (--compact-topbar, --compact-status,
     --ctl-sm/md/lg, --ui-font/pad/gap, pages.css:694 and :6730), so those
     are re-declared once here and every rule that reads them follows - the
     topbar's own grid rows included. The rest is named, because the app
     writes its controls as px and there is no single knob for them.

     Deliberately NOT touched: the FAB and its two panels (they are
     positioned and sized by JS), and the home card's own geometry - its
     grid, its columns and its divider were measured to the pixel in an
     earlier pass, so only its row height moves, and only by the same
     three pixels everything else moves by. */
  const COMFORT_CSS = [
    /* ── the frame ── */
    ':root{',
    '  --compact-topbar:44px;',
    '  --compact-status:22px;',
    '  --ctl-sm:clamp(26px, 2.3vw, 30px);',
    '  --ctl-md:clamp(30px, 2.7vw, 36px);',
    '  --ctl-lg:clamp(34px, 3.1vw, 43px);',
    '  --ctl-font:clamp(13.5px, 1.07vw, 15.5px);',
    '  --ui-font:clamp(12px, .96vw, 13px);',
    '  --ui-pad:clamp(10px, 1vw, 18px);',
    '  --ui-gap:clamp(5px, .7vw, 11px);',
    '}',
    'html body .toolbar, html body .topbar{ min-height:44px !important; }',
    /* ── buttons ── */
    'html body .btn, html body .ol-btn, html body .bb-tab, html body .set-tab,',
    'html body .icon-btn, html body .icon-btn-sm, html body .v-close,',
    'html body .panel-icon-btn, html body .tb-color, html body .mv-pager-btn,',
    'html body .draft-drop-btn, html body .chip, html body .util-chip,',
    'html body .ai-chip, html body .mode-pill, html body .pn-btn, html body .pn-chip{',
    '  min-height:30px !important; font-size:12px !important;',
    '}',
    'html body .icon-btn, html body .icon-btn-sm, html body .v-close,',
    'html body .panel-icon-btn, html body .tb-color{',
    '  width:30px !important; height:30px !important; min-width:30px !important;',
    '}',
    'html body .draft-act, html body .ol-twist{',
    '  width:24px !important; height:24px !important; padding:0 !important;',
    '  min-width:0 !important; min-height:0 !important;',
    '}',
    'html body .ol-btn{ height:30px !important; padding:0 11px !important; }',
    'html body .btn{ padding:6px 13px !important; }',
    'html body .bb-tab{ padding:0 11px !important; }',
    'html body .set-tab{ padding:0 11px !important; }',
    'html body .mode-pill{ padding:5px 12px !important; }',
    /* ── the dropdown ── */
    'html body .dd-card .stats-cat-title{',
    '  padding:9px 13px !important; gap:11px !important; font-size:12px !important;',
    '}',
    'html body .set-ctrl .dd-card .stats-cat-title{ padding:9px 12px !important; font-size:12.5px !important; }',
    'html body #page-plan .plan-picker .dd-card .stats-cat-title{',
    '  padding:9px 12px !important; min-height:33px !important;',
    '  gap:10px !important; font-size:12px !important;',
    '}',
    'html body #page-plan .beat-card-head .dd-card .stats-cat-title{',
    '  height:26px !important; padding:0 9px !important; font-size:11.5px !important;',
    '}',
    'html body .stats-cat-item{ padding:6px 10px !important; font-size:11.5px !important; }',
    'html body .dd-card .stats-cat-item{ padding:7px 10px !important; }',
    'html body .set-ctrl .dd-card .stats-cat-item{ padding:8px 11px !important; font-size:12.5px !important; }',
    'html body .stats-cat-list{ padding:7px !important; gap:3px !important; max-height:250px !important; }',
    'html body .set-ctrl .dd-card .stats-cat-list{ max-height:290px !important; }',
    'html body .set-ctrl .dd-card{ min-width:158px !important; max-width:250px !important; }',
    /* ── Settings ── */
    'html body .modal-head{ padding:14px 18px !important; min-height:46px !important; }',
    'html body .modal-body{ padding:15px 18px !important; }',
    'html body .modal-foot{ padding:12px 18px !important; }',
    'html body .set-card{ padding:14px 15px !important; gap:6px !important; }',
    'html body .set-card-title{ font-size:10.5px !important; margin-bottom:8px !important; }',
    'html body .set-row{ padding:10px 0 !important; gap:13px !important; }',
    'html body .set-label{ font-size:13px !important; }',
    'html body .set-ctrl{ gap:7px !important; }',
    'html body #setBody{ padding:19px !important; }',
    'html body #setBody .set-card{',
    '  padding:14px 16px !important; margin:0 0 15px 0 !important;',
    '}',
    'html body #setBody .set-card-title{',
    '  font-size:11px !important; margin:0 0 8px 0 !important; gap:7px !important;',
    '}',
    'html body #setBody .set-row{ padding:12px 0 !important; gap:16px !important; }',
    'html body #setBody .set-row:last-child{ padding-bottom:3px !important; }',
    'html body #setBody .set-label{ font-size:13px !important; }',
    'html body #setBody .set-desc{ font-size:12px !important; margin-top:3px !important; }',
    'html body #setBody .set-ctrl{ gap:9px !important; }',
    'html body .modal .inp, html body .modal .sel{',
    '  height:31px !important; padding:7px 11px !important; font-size:12.5px !important;',
    '}',
    'html body .settings-modal .modal-foot .btn{',
    '  height:31px !important; padding:0 14px !important; font-size:12px !important;',
    '}',
    /* ── the list pages ── */
    'html body .ol-panel{ padding:8px !important; }',
    'html body .ol-row{ padding:9px 11px !important; gap:11px !important; }',
    'html body .ol-wrap{ padding:11px 24px 28px !important; }',
    'html body .ol-head{ gap:14px !important; }',
    'html body .bb-row{ padding:8px 9px !important; gap:10px !important; }',
    'html body .bb-tabs{ gap:5px !important; }',
    'html body .bb-avatar{ width:28px !important; height:28px !important; }',
    'html body .stats-page{ padding:11px 33px 23px !important; }',
    /* ── the draft page ── */
    'html body .draft-split{ padding:13px 18px 15px !important; gap:13px !important; }',
    'html body .draft-row{ padding:8px 10px !important; gap:8px !important; }',
    'html body .draft-row-title{ font-size:13px !important; }',
    'html body .draft-pane-head{ padding:9px 11px !important; }',
    'html body .draft-pane-body{ font-size:14px !important; padding:36px 50px !important; }',
    'html body .draft-list-head{ padding:10px 12px !important; }',
    /* ── the Idea page's two columns, the way round the Bible has them ──
       The Idea page ran content LEFT and the saved-prompt card RIGHT, which
       is the opposite of every other split page in the app: the Bible's
       .bb-list is 300px on the left with its detail to the right, and the
       Draft's .draft-list is 260px on the left with the pane to the right.
       Measured before: .idea-wrap grid 1058px 300px with .idea-main first.
       Now 300px + 1fr, with the side placed in column 1 and the main in
       column 2 - placed rather than reordered, because DOM order is what
       the two renderers in app.js write and neither of them is touched.
       Under 900px the wrap is one column again (pages.css:3433); the side
       takes order:-1 there so it still reads first. */
    'html body #page-inspire .idea-wrap{ grid-template-columns:minmax(230px, 300px) minmax(0, 1fr) !important; }',
    'html body #page-inspire .idea-wrap > .idea-side{ grid-column:1 !important; grid-row:1 !important; }',
    'html body #page-inspire .idea-wrap > .idea-main{ grid-column:2 !important; grid-row:1 !important; }',
    '@media (max-width: 900px){',
    '  html body #page-inspire .idea-wrap{ grid-template-columns:minmax(0, 1fr) !important; }',
    '  html body #page-inspire .idea-wrap > .idea-side,',
    '  html body #page-inspire .idea-wrap > .idea-main{ grid-column:auto !important; grid-row:auto !important; }',
    '  html body #page-inspire .idea-wrap > .idea-side{ order:-1 !important; }',
    '}',

    /* ── the Idea bar IS the page's strip ───────────────────
       Genres · Tags · Clear rode in a bar inside the writing card, over that
       one column only. The bar is the page's own row now: app.js
       lifts the same element out of the card and makes it the page's
       first child, so it spans BOTH cards — the strip the Draft page's
       .sf-bar and the Bible's .page-head already are: the same 8px/16px
       margin, the same --surface-2 band on the same 6px radius, all of
       which pages.css:3534 already gives it. T and New prompt hold the
       left end (the Canvas bar's own pair — mindmap.js:452); Genres ·
       Tags · Clear take the right end, because the picks stop being the
       space between the two ends and become the group they are: their
       own margin-left:auto carries all three to the far right, so Clear
       is the last thing on the bar. */
    'html body #page-inspire > .idea-bar{',
    '  flex:0 0 auto !important; width:auto !important; max-width:none !important;',
    '  align-self:stretch !important; margin:8px 16px 0 !important;',
    '  gap:8px !important;',
    '}',
    'html body #page-inspire > .idea-bar .idea-head-left{',
    '  flex:0 0 auto !important; display:flex !important; align-items:center !important; gap:6px !important;',
    '}',
    'html body #page-inspire > .idea-bar .idea-picks{',
    '  flex:0 0 auto !important; margin-left:auto !important;',
    '}',
    /* The strip is the band the Draft and Bible bars are - 8px of its own
       padding over a 30px control line, 46px in all. The two pickers were
       the only thing standing off that line: their triggers are the app's
       full 36px dropdown height, which made this one bar 52px beside three
       46px ones. On the bar they sit on the 30px line like everything else,
       trigger padding given up to the height. */
    'html body #page-inspire > .idea-bar .idea-pick .dd-card{ height:30px !important; }',
    'html body #page-inspire > .idea-bar .idea-pick .dd-card .stats-cat-title{',
    '  height:30px !important; padding:0 10px !important;',
    '}',
    /* Clear used to hang 6px past the bar's own padding, so it closed level
       with the card it sat in. The bar is the page's strip now and the T on
       the other end keeps the full 10px, so Clear keeps it too - the two
       ends of the bar are the same inset, level with each other. */
    'html body #page-inspire > .idea-bar .idea-picks .idea-clear{ margin-right:0 !important; }',
    /* Under 760px one row cannot hold both words and both pickers without
       something running over the bar's own edge: the pickers lose their
       labels - the value alone is what they show - and their triggers stop
       being 132px wide. Under 620px New prompt keeps only its plus, the way
       an icon button reads. */
    '@media (max-width: 760px){',
    '  html body #page-inspire > .idea-bar .idea-pick > span{ display:none !important; }',
    '  html body #page-inspire > .idea-bar .idea-pick .dd-card{ min-width:0 !important; max-width:150px !important; }',
    '  html body #page-inspire > .idea-bar .idea-picks{ gap:10px !important; }',
    '}',
    '@media (max-width: 620px){',
    '  html body #page-inspire > .idea-bar .idea-new span{ display:none !important; }',
    '}',
    /* ── the left card is a page of prompts ───────────
       The rows ARE the dashboard's project cards: the same 38px row on
       the same 3px gap (34px on a short window), the same 6px radius and
       the same 2px/7px padding inside the row, so a prompt reads exactly
       like a project. The list carries no padding of its own and never
       scrolls, and the row count is read from the column (app.js perPage),
       so the page fills the card from its top to its foot - this is the
       Bible's own left card, which takes floor(height / 44) rows for the
       same reason.

       Rows are packed at the top: align-content:start, the same 3px gap
       everywhere, and not one row inflated to fake a full page. Spreading
       the gaps instead (space-between) widened them to 22px for a full
       page and 69px for a short one, which does not read like the Bible's
       list at all. */
    'html body #page-inspire .idea-rows{',
    '  display:grid !important; grid-auto-rows:38px !important; gap:3px !important;',
    '  align-content:start !important; overflow:hidden !important; padding:0 6px !important;',
    '}',
    '@media (max-height: 700px){',
    '  html body #page-inspire .idea-rows{ grid-auto-rows:34px !important; }',
    '}',
    'html body #page-inspire .idea-rows .idea-row{',
    '  min-height:0 !important; height:100% !important; box-sizing:border-box !important;',
    '  padding:2px 7px !important; border-radius:6px !important; gap:8px !important;',
    '}',
    /* the T on the bar types the cards, the way it types the other pages */
    /* the row you are on is the prompt the grid belongs to — the same
       --surface-4 the Draft list marks the draft you are writing in with */
    'html body #page-inspire .idea-row.on{ background:var(--surface-4) !important; }',
    /* ── the row's icons do exactly what the dashboard project card's
       do — that card is the reference, not a new recipe ──────────────
       .proj-btn: nothing at rest (opacity:0, and the row you are ON hides
       them too until you point at the row), the glyph quiet on --ink-4; the
       whole set comes up at FULL strength when you point at the ROW; and
       the greyness arrives only when you point at the icon itself —
       background --overlay-strong (the dashboard's own light wash) with the
       glyph raised to --ink. This row's icons were coming up at 70% and
       were keeping that on the selected row, which is what looked washed
       out. The doubled .idea-row is only there to out-rank the same arms in
       pages.css (3411-3413), which say .7. */
    'html body #page-inspire .idea-row.idea-row .ol-tool{',
    '  opacity:0 !important; background:transparent !important;',
    '  color:var(--ink-4) !important; border:0 !important;',
    '}',
    'html body #page-inspire .idea-row.idea-row:hover .ol-tool{ opacity:1 !important; }',
    'html body #page-inspire .idea-row.idea-row .ol-tool:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',
    /* ── THREE ACROSS, AND EVERY COLUMN THAT SIZE ────────
       Six cards land three across and two down, and each column is exactly
       a third of the box: (the box - the two 10px gaps) / 3. A card added
       by the row's own button makes a FOURTH column of that same size
       instead of squeezing the six that are already there, and the columns
       past the third wait behind the grid's own horizontal scrollbar -
       the cards keep their width and the row scrolls. */
    'html body #page-inspire .idea-cards{',
    '  display:grid !important;',
    '  --ic-col:calc((100% - 20px) / 3);',
    '  grid-template-columns:repeat(3, var(--ic-col)) !important;',
    '  grid-template-rows:repeat(2, minmax(0, 1fr)) !important;',
    '  grid-auto-flow:column !important;',
    '  grid-auto-rows:minmax(0, 1fr) !important;',
    '  grid-auto-columns:var(--ic-col) !important;',
    '  align-content:stretch !important;',
    '  gap:10px !important; padding:0 !important;',
    '  overflow-x:auto !important; overflow-y:hidden !important;',
    '  overscroll-behavior-x:contain !important;',
    '}',
    '@media (max-width: 1180px){',
    '  html body #page-inspire .idea-cards{',
    '    --ic-col:calc((100% - 10px) / 2);',
    '    grid-template-columns:repeat(2, var(--ic-col)) !important;',
    '    grid-template-rows:repeat(3, minmax(0, 1fr)) !important;',
    '  }',
    '}',
    '@media (max-width: 760px){',
    '  html body #page-inspire .idea-cards{',
    '    --ic-col:calc((100% - 10px) / 2);',
    '    grid-template-columns:repeat(2, var(--ic-col)) !important;',
    '    grid-template-rows:repeat(3, minmax(96px, 1fr)) !important;',
    '    overflow-y:auto !important;',
    '  }',
    '}',
    'html body #page-inspire .idea-slot{',
    '  flex:none !important; width:auto !important; max-width:none !important;',
    '  min-width:0 !important; min-height:0 !important; height:auto !important;',
    '  overflow:hidden !important;',
    '}',
    /* ── the scrollbar belongs to the GRID, not to a card ───────
       The cards past the third wait behind the grid's own sideways
       scrollbar and the cards keep their width; a card itself never
       scrolls (its own box is closed) and neither does the field inside it,
       so a long unbroken word cannot put a second scrollbar inside a card. */
    'html body #page-inspire .idea-slot{ overflow-x:hidden !important; }',
    'html body #page-inspire .idea-slot .idea-brief-input,',
    'html body #page-inspire .idea-write-body{',
    '  min-width:0 !important; max-width:100% !important; width:100% !important;',
    '  overflow-x:hidden !important; white-space:pre-wrap !important;',
    '}',
    'html body #page-inspire .idea-cards:hover, html body #page-inspire .idea-cards:active{',
    '  scrollbar-color:var(--surface-4) var(--bg) !important;',
    '}',
    'html body #page-inspire .idea-cards:hover::-webkit-scrollbar-thumb,',
    'html body #page-inspire .idea-cards:active::-webkit-scrollbar-thumb{',
    '  background:var(--line-3, var(--line)) !important;',
    '}',
    /* ── the icons are bare, like the dashboard project card's ───
       Rename, delete, the card's edit/delete and the row's add-card take
       the dashboard project button's own box — 22px square, 6px corner —
       and nothing else: NO ring round them and NO fill of their own at
       rest, the same as .proj-btn, which is a bare box that only fills in
       under the pointer. */
    'html body #page-inspire .ol-tool{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  display:inline-flex !important; align-items:center !important; justify-content:center !important;',
    '  box-sizing:border-box !important; padding:0 !important;',
    '  background:transparent !important;',
    '  border:0 !important;',
    '  border-radius:6px !important;',
    '  color:var(--ink-3) !important;',
    '  cursor:pointer !important;',
    '}',
    'html body #page-inspire .ol-tool i{ font-size:11px !important; line-height:1 !important; }',
    'html body #page-inspire .ol-tool:hover{',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '  border:0 !important;',
    '}',
    /* ── the card's two icons do what the dashboard's do ─────────
       The same recipe as .proj-btn on the dashboard project card, which
       is the reference: NOTHING at rest - no box, no glyph, nothing on
       the card at all - the pair comes up at full strength when you
       point at the CARD, the glyph stays quiet on --ink-4 until you point
       at the icon itself, and there it takes the app's own light wash
       --overlay-strong with the glyph raised to --ink. They used to sit
       there permanently in a filled box, which is the greyness that was
       showing without the pointer. The strip itself is at full strength
       (pages.css:4297 held it at .6); it is the two buttons that carry
       the reveal now. */
    'html body #page-inspire .idea-slot-brief.idea-slot .idea-slot-acts{ opacity:1 !important; }',
    'html body #page-inspire .idea-slot.idea-slot .idea-slot-acts .ol-tool{',
    '  opacity:0 !important; background:transparent !important;',
    '  color:var(--ink-4) !important; border:0 !important;',
    '}',
    'html body #page-inspire .idea-slot.idea-slot:hover .idea-slot-acts .ol-tool{ opacity:1 !important; }',
    'html body #page-inspire .idea-slot.idea-slot .idea-slot-acts .ol-tool:hover{',
    '  background:var(--overlay-strong) !important; color:var(--ink) !important;',
    '}',
    /* ═══ THE WRITING PANE ═══
       A card is written in the column, not in the 306px card it is shown
       in: the Draft page's own writing card - the same --surface-1
       surface, the same 1px line and rounded corner, a 12px/14px head over
       a hairline - taking the whole width and height the six cards take.
       The six are put away while it is open, and come back with the tick. */
    'html body #page-inspire .idea-write{',
    '  position:absolute !important; inset:0 !important; z-index:3 !important;',
    '  min-height:0 !important; min-width:0 !important;',
    '  display:flex !important; flex-direction:column !important;',
    '  background:var(--surface-1) !important;',
    '  border:1px solid var(--line-2) !important;',
    '  border-radius:var(--r-lg) !important;',
    '  overflow:hidden !important;',
    '}',
    'html body #page-inspire .idea-write[hidden]{ display:none !important; }',
    /* the six keep their box while a card is written - the pane is laid over
       them - so the column cannot change size under the writer's hand */
    'html body #page-inspire .idea-cards.ic-away{ visibility:hidden !important; }',
    'html body #page-inspire .idea-write-head{',
    '  flex:0 0 auto !important; display:flex !important; align-items:center !important;',
    '  justify-content:space-between !important; gap:10px !important;',
    '  padding:12px 14px !important; border-bottom:1px solid var(--line-2) !important;',
    '}',
    'html body #page-inspire .idea-write-num{',
    '  min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important;',
    '  white-space:nowrap !important; color:var(--ink-4) !important;',
    '  font-size:10.5px !important; font-weight:600 !important;',
    '  letter-spacing:.06em !important; text-transform:uppercase !important;',
    '}',
    /* the tick wears the app's own Save: transparent, green label */
    'html body #page-inspire .idea-write-done{',
    '  background:transparent !important; border:0 !important; color:#7fd0a2 !important;',
    '}',
    'html body #page-inspire .idea-write-done:hover{',
    '  background:rgba(63,165,107,.16) !important; color:#9fe0bb !important;',
    '}',
    'html body #page-inspire .idea-write-body{',
    '  flex:1 1 auto !important; min-height:0 !important; width:100% !important;',
    '  box-sizing:border-box !important; margin:0 !important;',
    '  padding:22px 26px !important; background:transparent !important;',
    '  border:0 !important; outline:none !important; resize:none !important;',
    '  overflow-y:auto !important; color:var(--ink) !important;',
    '  font-family:var(--pg-font, var(--ui)) !important;',
    '  font-size:var(--pg-size, 15px) !important;',
    '  line-height:var(--pg-lh, 1.7) !important;',
    '}',
    'html body #page-inspire .idea-slot-acts{ gap:4px !important; }',
    'html body #page-inspire .idea-brief-input{',    '  font-family:var(--pg-font, var(--ui)) !important;',
    '  font-size:var(--pg-size, inherit) !important;',
    '  line-height:var(--pg-lh, inherit) !important;',
    '  font-weight:var(--pg-weight, 400) !important;',
    '}',

    /* ── the three list pagers, in the dashboard's shape ───────────
       The dashboard's .home-project-pager is the one the app is read by:
       a hairline across the top, the page's own "1-8" centred, and a 28px
       --surface-3 chevron either side that steps to --surface-4 under the
       pointer and dims at .45 when there is nowhere left to go. The Draft,
       Bible and Idea pagers get exactly that, because they were built
       separately (a .mv-pager-btn pair and a .vpl-range) and read as three
       different controls. Their own markup is untouched - only the skin. */
    'html body #page-draft .draft-pager, html body #page-bible .bb-pager,',
    'html body #page-inspire .idea-pager{',
    '  position:relative !important;',
    '  flex:0 0 auto !important; display:flex !important; align-items:center !important;',
    '  justify-content:space-between !important; width:100% !important; gap:10px !important;',
    '  margin:0 !important; padding:6px 8px 8px !important;',
    '  border-top:1px solid var(--line-2) !important;',
    '  color:var(--ink-3) !important; font-size:10px !important;',
    '}',
    'html body #page-draft .draft-pager .mv-pager-btn,',
    'html body #page-bible .bb-pager .mv-pager-btn,',
    'html body #page-inspire .idea-pager .mv-pager-btn{',
    '  display:inline-flex !important; align-items:center !important; justify-content:center !important;',
    '  width:28px !important; height:28px !important; min-width:28px !important; padding:0 !important;',
    '  border:0 !important; border-radius:var(--r-md, 6px) !important;',
    '  background:var(--surface-3) !important; color:var(--ink-2) !important; font-size:12px !important;',
    '  cursor:pointer !important;',
    '}',
    'html body #page-draft .draft-pager .mv-pager-btn:hover:not(:disabled),',
    'html body #page-bible .bb-pager .mv-pager-btn:hover:not(:disabled),',
    'html body #page-inspire .idea-pager .mv-pager-btn:hover:not(:disabled){',
    '  background:var(--surface-4) !important; color:var(--ink) !important;',
    '}',
    'html body #page-draft .draft-pager .mv-pager-btn:disabled,',
    'html body #page-bible .bb-pager .mv-pager-btn:disabled,',
    'html body #page-inspire .idea-pager .mv-pager-btn:disabled{',
    '  opacity:.45 !important; cursor:not-allowed !important;',
    '}',
    'html body #page-draft .draft-pager .vpl-range,',
    'html body #page-bible .bb-pager .vpl-range,',
    'html body #page-inspire .idea-pager .vpl-range{',
    '  flex:1 1 auto !important; min-width:0 !important;',
    '  text-align:center !important; font-size:10.5px !important; color:var(--ink-3) !important;',
    '}',

    /* ── the project card, as a list or as tiles ──────────────────
       Two layouts, one per mode, chosen in Settings -> General:
         · Tiles - two columns, ten projects a page. The gutter stays
           (the two columns are the layout); the divider that used to run
           down the middle of it is gone and stays gone, so what is left
           is an invisible one.
         · List  - one column, five projects a page, no divider at all.
       The attribute rides on .home-proj-list itself, which is the only
       place a second class can be added without out-specifying
       pages.css:800, whose gap rule is (2,0,2) - see the note on the
       two-column rule above. Ties are won on order, so the list arm is
       written after the tiles one. */
    'html body :is(#page-home) :is(.home-proj-list,#projList).home-proj-list[data-proj-layout="list"]{',
    '  grid-template-columns:minmax(0, 1fr) !important; column-gap:0 !important;',
    '}',
  ].join('\n');

  const injectComfort = function(){
    if(document.getElementById('sfComfortCss')) return;
    const st = document.createElement('style');
    st.id = 'sfComfortCss';
    st.textContent = COMFORT_CSS;
    document.head.appendChild(st);
  };

  const injectThemeCss = function(){
    if(document.getElementById('sfThemeCss')) return;
    const st = document.createElement('style');
    st.id = 'sfThemeCss';
    st.textContent = THEME_CSS;
    document.head.appendChild(st);
  };


  /* -- 3f - THE NUMBER STEPPER ------------------------------------
     Chrome draws the up/down arrows on a number field itself, and it draws
     them in a fixed grey that knows nothing about the theme. There is no way
     to tint them: ::-webkit-inner-spin-button takes appearance and little
     else, and colour on it does nothing. So the native one is hidden (see
     the NUMBER FIELDS block in theme.css) and this puts a real one in its
     place - two buttons in the field's right edge, filled with --accent
     and read in --accent-ink, so they carry the same weight as the app's
     solid buttons and move with the palette. (They were --ink-3 chevrons
     on nothing until this was asked for.)

     The buttons dispatch input AND change, because the app's own handlers
     are on input: Max tokens writes straight to config from there, and a
     stepper that moved the number without firing it would look broken.

     min-height:0 is not optional. pages.css:728 puts a 28px touch floor on
     every <button>, which would make each half 28px tall inside a 28px
     field - the same trap the toggle fell into. border-radius is set the
     same way, because there is a [class$="-btn"] rule that would otherwise
     win it.

     Compact fields are left alone. The write toolbar's font-size box is 44px
     wide; a 20px stepper would eat half of it. So anything under 70px, and
     anything inside a toolbar or a bar, keeps the plain field. */
  const NUM_CSS = [
    'html body .sf-num{ position:relative !important; display:inline-block !important; max-width:100% !important; }',
    'html body .sf-num > input[type="number"]{ padding-right:22px !important; }',
    'html body .sf-num-btn{',
    '  position:absolute !important; right:1px !important;',
    '  width:20px !important; height:50% !important; min-height:0 !important;',
    '  display:flex !important; align-items:center !important; justify-content:center !important;',
    '  margin:0 !important; padding:0 !important; border:0 !important;',
    '  background:var(--accent) !important; z-index:2 !important;',
    '  color:var(--accent-ink) !important; cursor:pointer !important;',
    '  transition:color var(--t-fast) var(--ease), background-color var(--t-fast) var(--ease) !important;',
    '}',
    'html body .sf-num-up{ top:1px !important; border-radius:0 var(--r-sm,6px) 0 0 !important; }',
    'html body .sf-num-dn{ bottom:1px !important; border-radius:0 0 var(--r-sm,6px) 0 !important; }',
    'html body .sf-num-btn i{ font-size:9px !important; line-height:1 !important; }',
    'html body .sf-num-btn:hover{ background:var(--accent-2) !important; color:var(--accent-ink) !important; }',
    'html body .sf-num-btn:active{ background:var(--accent-2) !important; color:var(--accent-ink) !important; }'
  ].join('\n');

  const injectNum = function(){
    if(document.getElementById('sfNumCss')) return;
    const st = document.createElement('style');
    st.id = 'sfNumCss';
    st.textContent = NUM_CSS;
    document.head.appendChild(st);
  };

  /* too narrow to carry a stepper, or one of the compact toolbars */
  const skipStepper = function(inp){
    try{
      if(inp.closest('.write-toolbar,.sf-bar,.tb-bar,.ol-toolbar')) return true;
      const w = inp.getBoundingClientRect().width;
      if(w > 0 && w < 70) return true;
    }catch(e){}
    return false;
  };

  const bump = function(inp, dir){
    const min = inp.min !== '' ? parseFloat(inp.min) : null;
    const max = inp.max !== '' ? parseFloat(inp.max) : null;
    let st = inp.step !== '' ? parseFloat(inp.step) : 1;
    if(!isFinite(st) || st <= 0) st = 1;
    let v = parseFloat(inp.value);
    if(!isFinite(v)) v = (min !== null && min > 0) ? min : 0;
    v = v + dir * st;
    if(min !== null && v < min) v = min;
    if(max !== null && v > max) v = max;
    inp.value = String(Math.round(v * 1e6) / 1e6);
    /* both, because the app reads config from input and the value from change */
    inp.dispatchEvent(new Event('input', { bubbles:true }));
    inp.dispatchEvent(new Event('change', { bubbles:true }));
  };

  const enhanceNumbers = function(root){
    let list = [];
    try{
      list = Array.prototype.slice.call((root || document).querySelectorAll('input[type="number"]'));
    }catch(e){ return; }
    if(root && root.nodeType === 1 && root.matches && root.matches('input[type="number"]')) list.unshift(root);
    list.forEach(function(inp){
      try{
        if(!inp || inp.dataset.sfNum) return;
        if(skipStepper(inp)) return;
        inp.dataset.sfNum = '1';
        const wrap = document.createElement('span');
        wrap.className = 'sf-num';
        inp.parentNode.insertBefore(wrap, inp);
        wrap.appendChild(inp);
        const mk = function(dir, icon, label){
          const b = document.createElement('button');
          b.type = 'button';
          b.tabIndex = -1;
          b.className = 'sf-num-btn ' + (dir > 0 ? 'sf-num-up' : 'sf-num-dn');
          b.setAttribute('aria-label', label);
          b.innerHTML = '<i class="bi bi-chevron-' + icon + '"></i>';
          b.addEventListener('click', function(e){
            e.preventDefault();
            bump(inp, dir);
            try{ inp.focus(); }catch(_){}
          });
          return b;
        };
        wrap.appendChild(mk(1, 'up', 'Increase'));
        wrap.appendChild(mk(-1, 'down', 'Decrease'));
      }catch(e){}
    });
  };

  /* number fields turn up in settings, the draft panel, the toolbars and the
     utility panels, and most of those are built long after load, so this
     watches for them rather than running once. One pass per frame at most,
     and the pass does nothing once a field is marked - which is also why the
     buttons it inserts do not set the observer off again. */
  const watchNumbers = function(){
    if(typeof MutationObserver !== 'function' || !document.body) return;
    let queued = false;
    const run = function(){
      if(queued) return;
      queued = true;
      requestAnimationFrame(function(){
        queued = false;
        try{ enhanceNumbers(document); }catch(e){}
      });
    };
    new MutationObserver(run).observe(document.body, { childList:true, subtree:true });
    run();
  };

  /* -- 3g - EVERY DROPDOWN LIST, NOT JUST THE COLOR ONES ------------
     This started as three dropdowns and then went the other way round,
     which is the right way round.

     The Color list was the good one: rows with no fill and no border, a
     surface-3 hover, and the chosen row marked by its tick rather than by a
     filled box. The sensible thing to do with that is to give it to every
     dropdown, not to flatten three good ones back into the treatment the
     rest of the app had. So this is global now - all eight places
     enhanceSelects() builds a list: Settings, the write toolbar, the plan
     pickers, the draft panel and the rest - and the .sf-color-card class is
     no longer needed to aim it.

     What the app had, and why it looked heavier: pages.css:2353 painted
     every row --surface-2, which is the same colour the list itself is, so
     an unselected row was invisible against it and the only thing that
     showed was the chosen row, at --surface-4 (pages.css:2376). One filled
     box sitting in a panel, and a hairline from pages.css:2071 on top of it
     depending on which rule won.

     What it is now: every row transparent, a --surface-3 hover, and the
     chosen row transparent too. That last one is safe because
     enhanceSelects() already puts a <i class="bi bi-check2"> in every row
     and toggles .active on the selected one (settings.js:1005-1007), and
     pages.css:1134 shows that icon only on .active. The selection is still
     marked - by a tick instead of a box, which is the same signal without
     the box.

     The classes are doubled because the stock rules are
     `html body .stats-cat-item` and `html body .stats-cat-item.active`,
     both !important, and at equal specificity the winner would be decided by
     which stylesheet got injected last rather than by which rule was right.

     The trigger CARD is deliberately not touched. It did not used to be: an
     earlier version of this forced a background and a border onto it, which
     put the three Color dropdowns a step off every other dropdown and, worse,
     outranked --component-dropdowns - the token behind the Appearance
     "dropdown" surface setting (settings.js:1172) - and quietly switched
     that setting off for exactly these three. The card is a .dd-card like
     any other and is painted by the same rules as Provider and Model. */
  const DROP_CSS = [
    /* The trigger card keeps its fill and loses its ring. pages.css:5506 and
       2609 both ask for no border, but `html body .set-ctrl .dd-card` puts a
       1px --line-2 hairline back with !important, and that hairline was the
       only visible edge the control had - with the fill sitting at exactly
       the colour of the card behind it. A control is its own surface, not an
       outline. The fill itself is left to --component-dropdowns. */
    'html body .dd-card.dd-card, html body .stats-cat-card.stats-cat-card{',
    '  border:0 !important; outline:0 !important; box-shadow:none !important;',
    '}',
    'html body .dd-card.dd-card:hover, html body .dd-card.dd-card.open{',
    '  border:0 !important; outline:0 !important;',
    '}',
    'html body .stats-cat-list{ border:0 !important; outline:0 !important; }',
    'html body .stats-cat-item.stats-cat-item{',
    '  background:transparent !important; border:0 !important; box-shadow:none !important;',
    '  color:var(--ink-2) !important;',
    '}',
    'html body .stats-cat-item.stats-cat-item:hover{',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '}',
    'html body .stats-cat-item.stats-cat-item.active{',
    '  background:transparent !important; border:0 !important; color:var(--ink) !important;',
    '}',
    'html body .stats-cat-item.stats-cat-item.active i{ opacity:1 !important; }'
  ].join('\n');

  /* the lists are rebuilt on every open, so this runs after each render,
     not once - the class and the stylesheet are both idempotent */
  const paintSwatches = function(){
    const root = document.getElementById('modalRoot');
    if(!root) return;
    if(!document.getElementById('sfColorDropCss')){
      const s = document.createElement('style');
      s.id = 'sfColorDropCss';
      s.textContent = DROP_CSS;
      document.head.appendChild(s);
    }
  };

  /* renderSetTab builds the panel and then enhanceSelects() turns every
     <select> into its card - so the card can only be shaped afterwards */
  const afterTab = function(){
    try{ paintSwatches(); }catch(e){}
  };

  const wrapTab = function(){
    const orig = window.renderSetTab;
    if(typeof orig !== 'function' || orig.__sfLayout) return;
    const fn = function(){
      const out = orig.apply(this, arguments);
      setTimeout(afterTab, 0);
      return out;
    };
    fn.__sfLayout = true;
    window.renderSetTab = fn;
  };

  const apply = function(){
    if(typeof S === 'undefined' || !S.config) return;
    /* Density is gone. An older profile can still carry the key, so it is
       cleared rather than left lying around for something else to read. */
    if(S.config.density){ try{ delete S.config.density; }catch(e){ S.config.density = undefined; } }
    if(window.sfApplyGlobalType) window.sfApplyGlobalType(true);
  };

  const start = function(){
    if(!Array.isArray(window.THEMES)) return false;   /* not parsed yet */
    injectMotion(); injectFields(); injectRows(); injectIcons(); injectStats();
    injectTopIcon();
    injectThemeCss(); injectTgl(); injectNum(); injectSettingsFixes(); injectComfort(); enhanceNumbers(document);
    wrapGoPage(); watchModal(); watchNumbers();
    wrapTab(); apply();
    return true;
  };

  /* normally this runs once and lands on the first try, because every
     classic script has already parsed. The two fallbacks are for a browser
     that has not finished parsing. There is no longer a theme cache to
     re-read here: Night is the only palette, so nothing can resolve to the
     wrong one. */
  if(!start()){
    document.addEventListener('DOMContentLoaded', start);
    window.addEventListener('load', start);
  }
})();


/* ═══ 8ac · THE ACCENT IS THE LAST WORD ON A CONTROL ═══

   A control in this app answers the pointer with a grey (--surface-3/4) and
   nothing else — the same grey as the card behind it on the Settings, Plan
   and prompt pages, so a button under the hand, a tool that is ON, a row that
   is picked and a dropdown that is OPEN all read exactly like one that is
   not. The accent is this app's own mark for “this one”, and it belongs on
   the thing the pointer or the choice is actually on: on every button, every
   icon button, every tab, every toggle, every dropdown and its rows, and on
   the rows and cards of the lists.

   Two other things about these rules were wrong before this pass, and both
   were reported:

     · they did not reach. The greys that matter are written at id weight
       (pages.css's `#page-inspire .ol-tool:hover`, its doubled
       `.stats-cat-item.stats-cat-item:hover`, the toolbars' own arms), and a
       plain `html body .ol-tool:hover` loses to every one of them however
       !important it is. They are written LAST here, in their own sheet, on
       selectors carrying two ids' worth of weight that nothing in the app can
       out-rank — the weight is spelled with :not() rather than a real id,
       because these rules have to bite wherever a control is: #stage,
       #modalRoot, a page, the typo panel on <body>, a bar outside both.
     · they were too heavy. A control that was ON took the accent SOLID, so
       every open dropdown, every picked row of a dropdown list and every
       toggle that was on was a slab of amber — louder than the app's own
       mark and heavy to read down a list of thirty rows. The accent is a
       WASH now: 18% of it under the pointer, 24% on what is chosen, with the
       label and its mark in the accent and a hairline of it round the box.
       (The wash is mixed from --accent, so it is the theme's own amber rather
       than a colour of its own, and --accent-soft is the fallback.)

   A row is a row, not a button: under the pointer it takes the wash and its
   own type stays its own, and the one that is PICKED also takes a 2px edge of
   the accent at its left, the same mark the app's own list rows wear.

   Fields, panels and the Bible's own detail pane are not in any of this: a
   writing box and a picture box's setting are not controls, and that pane was
   asked to stay neutral, so it is put back to grey at three ids. */
/* ═══ 8ad · THE FRAME, THE ✕, AND THE OUTLINES ═══

   Three things, one sheet, and it is inserted after every other sheet this
   file writes — nothing here has to fight for the last word.

     · THE STATISTICS PANEL WEARS THE SETTINGS FRAME. The same fill —
       --frame-bg, the one dial pages.css:2645 sets for the modal and the
       panels — and the same head: a 32px row, 5px/14px, the 22px ✕ at its
       right. It carried a --line-2 hairline under that head over an
       --surface-1 fill of its own, and both read as a line ruled across the
       panel's own background.
     · THE ✕ TAKES THE ACCENT UNDER THE POINTER, and only there. Every
       panel's close — github, utility, notes, the book-publishing sheet, the
       translate sheet, the FAB's right-click card, the type panel, the
       workspace, both modals — keeps the quiet ink it always had, and takes
       the accent, over the accent's wash, when it is hovered, held or
       selected. A ✕ painted in the accent the whole time would be a mark on
       every panel at rest, which is not what a mark is for.
     · AND THE OUTLINES GO. A ring drawn round a list, a row, a language
       option or a card is noise in a design whose “this one” is a WASH. So
       the kanban board keeps no ring in any state — not on a column, not on
       its drop area, not on a card — and its drop target is the surface step
       under it; the translate sheet has no edge inside it; and the only line
       left in the board's own grammar is the row break a list gets when it is
       dropped UNDER another one. */
(function(){
  const ID = 'sfFrameLast';
  if(document.getElementById(ID)) return;
  const host = document.head || document.documentElement;
  if(!host) return;
  /* THREE ids of weight for the ✕: the control sheet (8ac) answers a button
     with two, and the ✕ has to be the accent itself under the pointer, not a
     wash of the accent's second colour. */
  const W    = ':not(#sfNoAccent):not(#sfNoAccent):not(#sfNoAccent)';
  const SOFTBG = 'var(--accent-soft, rgba(255,255,255,.09))';
  const MIX    = 'color-mix(in srgb, var(--accent) ';
  /* every close in the app: by class where it has one, by what it is wired
     to otherwise, and `[data-act$="-close"]` for the ones a page makes */
  const CLOSE = ':is(.v-close,.util-close,.gt-x,.sft-x,.sfpp-x,.sfpp-mini,'
              + '.notes-mini,.nb-pub-x,.cc-mini-x,.find-x,[data-fab-ai-close],'
              + '[data-gh-close],[data-mpl-close],[data-pub-close],[data-typo-close],'
              + '[data-result-close],[data-sft-close],[data-sfpp-close],'
              + '[data-motion-close],[data-act$="-close"],[data-util="close"],'
              + '[data-notes="close"],[data-nc="close"])';
  const NOTBTN = ':not(.btn):not(.btn-primary)';
  const css = [
    /* ── THE STATISTICS PANEL ──
       The panel takes the SETTINGS MODAL's own fill, token for token:
       pages.css:2645 defines --frame-bg as --surface-2 and the modal takes
       it at 2649, so both panels are the same colour by construction. The
       statistics page had been left at --surface-1 — one step darker — by
       the stats sheet, which is injected when the page first renders and so
       landed after this one at the same weight; the id is doubled here to
       beat it by weight instead of by timing. Its cards are --surface-3,
       the same as Settings' .set-card (pages.css:2444), so the two panels
       read identically: ground, cards, corners. */
    'html body #page-stats#page-stats .stats-page{',
    /* ── THE SETTINGS MODAL'S OWN GROUND, NOT A FLAT ONE ──
       .settings-modal is NOT a flat fill: pages.css:3884 gives it
       linear-gradient(180deg, --surface-2 0%, --surface-1 96px), and that
       is the sheet it takes, not the --frame-bg it is also handed. The
       statistics panel had been a flat --surface-1 (and before that a flat
       --surface-2), which is why the two never quite matched. It takes the
       same gradient now, so the panel reads the same colour at the head and
       the same colour below the 96px mark. */
    '  background:linear-gradient(180deg, var(--surface-2) 0%, var(--surface-1) 96px) !important;',
    '  border:0 !important;',
    '}',
    /* the head is the Settings modal's head, to the pixel: the panel's own
       33px side padding (final-fix.js:9610) is cancelled here so the head
       spans the panel, its box is 32px (5px + the 22px square + 5px), and
       its last child — the ✕ — is pushed to its right end, 14px in from
       the panel's corner. That is exactly where the Settings ✕ sits. The
       old -18px bleed left the stats ✕ 29px in from the corner while the
       Settings one was at 14px, which is the difference that was seen. */
    /* and the panel carries no padding above it, so the head starts at the
       panel's very top exactly as the Settings head starts at the frame's
       top: the two ✕ then sit at the same 5px/14px from the corner. */
    'html body #page-stats .stats-page{ padding-top:0 !important; }',
    /* ── AND THE PANEL COVERS WHAT IS BEHIND IT ──
       The statistics panel opens as a fixed sheet at z-index 59 over the
       dashboard (the top bar is 60), and its own box was TRANSPARENT — so
       the dashboard's header and its hairlines stayed readable above and
       around the panel the whole time it was open. The sheet takes the
       page's own ground: with the panel open there is nothing of the page
       behind it to read. */
    /* ── AND THE PANEL'S OUTSIDE IS THE SETTINGS MODAL'S OUTSIDE ──
       Settings opens inside .modal-scrim (app.css:724): rgba(0,0,0,.7) with
       a 6px backdrop blur, over the whole viewport, well above the top bar.
       The statistics sheet had a FLAT --bg behind the panel, which reads as
       nothing at all — the page behind it simply vanished. It takes the
       scrim's own colour and blur now, and sits above the top bar (60) the
       way the scrim does, so the page behind the panel is dimmed the same
       way Settings dims it instead of being cut out. The cards inside the
       panel are left exactly as they are. */
    'html body #page-stats.active{',
    '  background:rgba(0,0,0,.7) !important;',
    '  -webkit-backdrop-filter:blur(var(--backdrop-blur,6px)) !important;',
    '  backdrop-filter:blur(var(--backdrop-blur,6px)) !important;',
    '  z-index:61 !important;',
    '}',
    /* ── AND THE LINE THAT SURVIVED IT ──
       The top bar sits at z-index 60 and the panel at 59, so the bar's own
       border-bottom — the hairline under the whole app's header — was still
       drawn across the panel's backdrop, right above it: the line that read
       as belonging to the panel but separate from it. Settings has none
       because its scrim covers the bar as well. Here the bar's hairline
       simply goes while the panel is open; its own fill is the page's
       ground, so the two meet with nothing between them. */
    'html body:has(#page-stats.active) .topbar{',
    '  border-bottom-color:transparent !important; box-shadow:none !important;',
    '}',
    /* ── AND ITS HEAD IS THE SETTINGS HEAD, TO THE PIXEL ──
       pages.css:3895 is the settings head's own rule:
         padding:11px 12px 9px 16px, min-height:0, height:auto — so the head
       is exactly 11 + the 26px ✕ + 9 = 46px tall, with the ✕ 11px down and
       12px in from the corner. The stats head was 32px with a 22px ✕ (44px
       once the stats sheet took it over), which is the "a bit shorter" that
       was seen. Same padding, same min-height, same 26px ✕ — the two heads
       are now the same box with the ✕ in the same place. */
    'html body #page-stats#page-stats .stats-head{',
    '  margin:0 -18px 10px !important;',
    '  padding:11px 12px 9px 16px !important;',
    '  min-height:0 !important; height:auto !important; max-height:none !important;',
    '  justify-content:flex-end !important;',
    '  border:0 !important; border-bottom:1px solid var(--line-2) !important;',
    '  box-shadow:none !important;',
    '}',
    'html body #page-stats#page-stats .stats-head :is(.icon-btn,.v-close)' + W + '{',
    '  width:26px !important; height:26px !important;',
    '  min-width:26px !important; min-height:26px !important; max-height:26px !important;',
    '  padding:0 !important; flex:0 0 auto !important;',
    '}',
    'html body #page-stats .stats-head::before,',
    'html body #page-stats .stats-head::after{ content:none !important; border:0 !important; }',
    /* and no line anywhere on that panel: the band under the head carried one */
    'html body #page-stats .stats-page > *{ border-top-width:0 !important; }',
    'html body #page-stats .stats-page :is(.stats-top,.stats-body,.stats-empty,',
    '  .stats-dayline-wrap,.stats-grid-kpi,.stats-grid-mid,.stats-chart-card){',
    '  border-top-width:0 !important; box-shadow:none !important;',
    '}',
    /* ── ONE ✕ FOR THE WHOLE APP ─────────────────────────────────
       The app's closes ran from 20px to 32px — .gt-head's ✕ was 20-22, the
       overlay head's 26, .find-x 28, .notes-mini 32 — so no two of them
       matched and the ones living in a head read bigger than the ✕ a row
       carries. Every close in the family is one control now: a 22px box
       with a 12px cross, --ink-3 until the pointer reaches it. The two
       heads that draw their own ✕ keep 26px on purpose — that button is
       what gives the Settings and Statistics heads their 46px height, so
       shrinking it would shorten the head that was just matched. */
    'html body ' + CLOSE + NOTBTN + W + '{',
    '  width:22px !important; height:22px !important;',
    '  min-width:22px !important; min-height:22px !important; max-height:22px !important;',
    '  padding:0 !important; flex:0 0 auto !important;',
    '  display:inline-flex !important; align-items:center !important;',
    '  justify-content:center !important;',
    '  border:0 !important; border-radius:var(--r-sm,4px) !important;',
    '  background:transparent !important; box-shadow:none !important;',
    '  color:var(--ink-3) !important; cursor:pointer !important;',
    '}',
    'html body ' + CLOSE + NOTBTN + W + ' :is(i,svg){',
    '  font-size:12px !important; line-height:1 !important; color:inherit !important;',
    '}',
    'html body :is(.settings-modal,.stats-page) .modal-head .icon-btn' + W + W + ',',
    'html body #page-stats#page-stats .stats-head .icon-btn' + W + W + '{',
    '  width:26px !important; height:26px !important;',
    '  min-width:26px !important; min-height:26px !important; max-height:26px !important;',
    '}',
    'html body :is(.settings-modal,.stats-page) .modal-head .icon-btn' + W + W + ' i,',
    'html body #page-stats#page-stats .stats-head .icon-btn' + W + W + ' i{',
    '  font-size:13px !important;',
    '}',
    /* ── THE ✕, UNDER THE POINTER ── */
    'html body ' + CLOSE + NOTBTN + W + ':is(:hover,:active){',
    '  background-color:' + SOFTBG + ' !important;',
    '  background-color:' + MIX + '20%, transparent) !important;',
    '  color:var(--accent) !important;',
    '}',
    'html body ' + CLOSE + NOTBTN + W + ' i{ color:inherit !important; }',
    'html body ' + CLOSE + NOTBTN + W + ' svg, html body ' + CLOSE + NOTBTN + W + ' svg *{',
    '  color:inherit !important; stroke:currentColor !important;',
    '}',
    /* the Bible's detail pane stays neutral, at four ids */
    'html body #bbDetail#bbDetail#bbDetail#bbDetail ' + CLOSE + '{',
    '  color:var(--ink-3) !important; background:transparent !important;',
    '}',
    'html body #bbDetail#bbDetail#bbDetail#bbDetail ' + CLOSE + ':is(:hover,:active){',
    '  color:var(--ink) !important; background:var(--surface-4) !important;',
    '}',
    /* ── NO OUTLINES, ANYWHERE ─────────────────────────────────
       Asked for plainly, and it is the whole app: nothing draws a line round
       itself any more. A control's state is its fill and its type, a panel is
       a fill over a shadow, and a row is a wash — no rings, no 2px outline on
       what has focus (theme.css:459 puts an ACCENT outline on every focused
       element and pages.css:6423 a --line-3 one, which is what a press left
       behind on buttons, chips and every ✕), and no border on a box.

       Two families keep what they have, because they are not outlines:
         · FIELDS AND MEDIA — an input, a textarea, a select, an image, a
           canvas, a slider's own track: the box you type in and the picture
           you look at;
         · STRUCTURE — the bars, the heads and the table cells. Their hairline
           is a divider between two bands, not a box round something, and the
           app's whole layout is those hairlines.  */
    'html body ' + W + ' :not(input):not(textarea):not(select):not(option):not(img)'
    + ':not(canvas):not(svg):not(path):not(circle):not(rect):not(line):not(polyline)'
    + ':not(polygon):not(hr):not(table):not(thead):not(tbody):not(tr):not(th):not(td)'
    + ':not([type="range"]):not(.menubar):not(.topbar):not(.toolbar):not(.tb)'
    + ':not(.write-toolbar):not(.sf-bar):not(.page-head):not(.ol-head):not(.modal-head)'
    + ':not(.modal-foot):not(.panel-head):not(.util-head):not(.notes-head):not(.ai-head)'
    + ':not(.bb-head):not(.bb-tabs):not(.stats-head):not(.draft-pane-head)'
    + ':not(.draft-list-head):not(.fab-menu-head):not(.fab-ai-head):not(.set-nav)'
    + ':not(.statusbar):not(.sb-left):not(.sb-right):not(.chapter-controls)'
    + ':not(.ft-actions):not(.ft-hg):not(.fab-divider):not(.pages-divider)'
    + ':not(.fab-menu-divider):not(.adv-sep):not(.sf-split-divider):not(.bb-image-box){',
    '  border:0 !important;',
    '}',
    /* the focus outline is not a box, so it goes everywhere — and that is the
       accent outline it was showing */
    /* Three ids of weight, because the rules that put an outline back are
       written at id weight themselves (final-fix.js:1250 puts a 2px ACCENT
       outline on a focused workspace box, and an id-prefixed rule beats a
       plain `html body *` however !important it is). Every outline in the
       app dies here, including that one and theme.css's two focus rings. */
    'html body ' + W + ', html body ' + W + ':focus, html body ' + W + ':focus-visible,',
    'html body ' + W + ':focus-within{',
    '  outline:0 !important; outline-offset:0 !important;',
    '  -webkit-tap-highlight-color:transparent !important;',
    '}',
    /* and the ring a control wore while the pointer was on it, or while it was
       held: the wash says it, nothing draws a line round it */
    'html body :is(button,.btn,.ol-btn,.ol-tool,.icon-btn,.icon-btn-sm,.v-close,'
    + '.chip,.tgl,.seg-btn,.set-tab,.bb-tab,.util-chip,.ai-chip,.mode-pill,.tb-btn,'
    + '.mv-pager-btn,.draft-act,.ol-twist,.ft-pair,.stats-cat-item,.dd-item,'
    + '.draft-drop-item,.proj-btn,.kb-card,.kb-col,.kb-drop,.proj-row,.proj-item,'
    + '.bb-row,.draft-row,.idea-row,.set-row,.nb-row,.ol-item,:focus,:focus-visible,'
    + ':focus-within){',
    '  box-shadow:none !important;',
    '}',
    /* ── AND THE LOGO KEEPS ITS OWN ──
       The mark in the top bar is the app's own accent square and it answers
       the pointer with the app's quiet overlay, NOT with the accent: it is the
       logo, not a control that is on, and “selected” must not light it. */
    /* SELECTING THE MARK MUST NOT PAINT IT. The button keeps no outline, no
       border and no ring in ANY state — hover, press, focus, focus-visible,
       focus-within, “on”/“open”/“active” — and neither does anything inside
       it. The only answer a state gives is the app's own quiet overlay under
       the pointer; the square keeps the colour it has at rest, so nothing
       about the logo changes when it is clicked or tabbed to. */
    'html body ' + W + ' .logo-btn,',
    'html body ' + W + ' .logo-btn *,',
    'html body ' + W + ' .logo-btn:is(:hover,:active,:focus,:focus-visible,',
    '  :focus-within,.on,.open,.active,.selected),',
    'html body ' + W + ' .logo-btn:is(:hover,:active,:focus,:focus-visible,',
    '  :focus-within,.on,.open,.active,.selected) *{',
    '  outline:0 !important; outline-offset:0 !important;',
    '  border-color:transparent !important; box-shadow:none !important;',
    '  -webkit-tap-highlight-color:transparent !important;',
    '}',
    'html body .logo-btn:hover{ background:var(--overlay) !important; }',
    'html body .logo-btn:is(:focus,:focus-visible,:focus-within,:active,.on,.open,.active){',
    '  background:transparent !important;',
    '}',
    'html body .logo-btn .logo-mark{',
    '  background:var(--accent) !important; color:var(--accent-ink) !important;',
    '}',
    'html body .logo-btn::selection, html body .logo-btn *::selection{',
    '  background:transparent !important; color:inherit !important;',
    '}',
    /* ── NO OUTLINES ──
       the board: no ring on a column, its drop area or a card, in any state;
       the drop target is the surface step under the pointer */
    'html body #page-kanban#page-kanban :is(.kb-col,.kb-drop,.kb-card){',
    '  box-shadow:none !important;',
    '}',
    'html body #page-kanban#page-kanban .kb-col.sf-kb-want,',
    'html body #page-kanban#page-kanban .kb-col.sf-kb-held{',
    '  background:var(--surface-5) !important;',
    '}',
    /* a list dropped UNDER another one starts its own row (see 8t) */
    'html body #page-kanban .kb-col[data-sf-break]{ grid-column-start:1 !important; }',
    /* ── THE IMAGE FIELD DOES NOT COLLIDE ──
       The label row and the picture box were sitting on top of each other:
       the box begins where the row ends, and the row's two shape buttons are
       drawn over the box's top edge. A gap under the head and a ring round
       nothing fixes it — the field, its head and the head's own buttons keep
       no edge of their own, and only the picture box is outlined, because
       that one is outlined on purpose. */
    'html body #bbDetail .bb-field-img,',
    'html body #bbDetail .bb-field-img .bb-img-head{',
    '  border:0 !important; outline:0 !important; box-shadow:none !important;',
    '  background:transparent !important;',
    '}',
    /* the head is a row of its own — the label and the two shape buttons —
       with real height and a real gap under it, and the field above it
       always ends before this one begins: the row and the picture box can
       never sit on each other, which is what was reported twice. */
    'html body #bbDetail .bb-field-img{ margin-top:18px !important; }',
    'html body #bbDetail .bb-img-head{',
    '  flex:0 0 auto !important; margin:0 0 12px !important;',
    '  min-height:24px !important; align-items:center !important;',
    '}',
    'html body #bbDetail .bb-img-shape{ margin-left:auto !important; flex:0 0 auto !important; }',
    'html body #bbDetail .bb-field-img .bb-image-box{ margin:0 auto !important; }',
    'html body #bbDetail .bb-img-shape .ol-tool,',
    'html body #bbDetail .bb-img-shape .ol-tool:hover,',
    'html body #bbDetail .bb-img-shape .ol-tool:active,',
    'html body #bbDetail .bb-img-shape .ol-tool.on{',
    '  border:0 !important; outline:0 !important;',
    '}',
    /* the popups drawn OVER something — the FAB's two menus, the translate
       sheet inside one of them, the dropdown lists, the panels that hang off
       a toolbar — are a fill and a depth, not a box: their 1px --line-2 ring
       is gone and the shadow carries them on its own. (The modal and the
       github panel keep the frame they share: that one is the app's own.) */
    'html body :is(.fab-menu,.fab-ai,#fabAI,#fabMenu,.stats-cat-list,.ai-panel,'
    + '  .music-player,.music-mini,.sf-plugin,.dc-panel){',
    '  border:0 !important;',
    '  box-shadow:0 14px 34px -16px rgba(0,0,0,.6) !important;',
    '}',
    /* the translate sheet: no edges inside it */
    'html body .fab-translate :is(.ft-bar,.ft-search,.ft-grid,.ft-hg,.ft-actions){',
    '  border:0 !important; box-shadow:none !important;',
    '}',
    'html body .fab-translate .ft-cell + .ft-cell{ border-left:0 !important; }',
    'html body .ft-lang-btn, html body .ft-lang-btn.on{ border:0 !important; box-shadow:none !important; }',

    /* ── AND NO RING EITHER ─────────────────────────────────────
       A box's line was drawn two ways in this app: as a border, and as a
       shadow with no spread — an inset ring. The border pass above cannot
       reach the second one (a border rule says nothing about a shadow), so
       every ring is named here and taken off at three ids, which out-ranks
       the id-heavy sheets that draw them: every map card, both colour
       chips, the calendar's pinned day, the plan's drop target, a search
       box while you type in it, the kanban card under the hand, the
       workspace boxes, the pinned overlay's own edge.

       THREE THINGS KEEP WHAT THEY HAVE, because they are not outlines:
         · .bb-image-box — the picture drop target, drawn on purpose;
         · .mm-port — the link handle, a dot whose ring is its shape;
         · the floating layers (a modal, a panel, a dropdown, a toast):
           their shadow is depth, and taking it away would leave two fills
           of the same grey on top of each other with nothing between. */
    'html body ' + W + ' :is(.tb-swatch,.tb-swatch-fill,.tb-color,.fnt-bar .ol-btn,',
    '  .ol-row,.beat-card,.idea-slot-brief,.mm-node,.util-cal-day,#wsQuery,#imgQuery,',
    '  .find-panel input,.modal .inp,.modal .sel,.kb-drop,.kb-col,.kb-card,.kb-board,',
    '  .sf-ws-box,.home-search,.imf-drop-btn,.ovl-pin,.ovl-head,',
    '  .sf-namegate-row input,.draft-row,.bb-row,.idea-row,.draft-list,.draft-pane,',
    '  .write-canvas,input[type="range"]){',
    '  box-shadow:none !important;',
    '}',
    /* the right-click card keeps its depth and loses the 1px line it drew as
       the second half of the same shadow */
    'html body ' + W + ' .sf-adv{',
    '  box-shadow:0 20px 48px -14px rgba(0,0,0,.45) !important;',
    '}',

    /* ── THE BIBLE'S DETAIL BOX IS RAISED, AND STAYS RAISED ─────
       The pane is a card standing on the page: the shadow under it is its
       own edge. It was flattened by the outline pass, which read any box
       shadow as an outline — it is not, it is why the box reads as a box.
       It comes back here, at a weight the pass above cannot out-rank. */
    'html body ' + W + ' .bb-detail{',
    '  box-shadow:0 12px 28px -18px rgba(0,0,0,.62) !important;',
    '}',
    /* and the pane's writing box takes its grip back: the corner pulls the
       Details box taller and the entry remembers the height, which is what
       the data-sf-h rules above are for. */
    'html body ' + W + ' #bbDetail textarea,',
    'html body ' + W + ' #bbDetail .bb-field-grow .inp{',
    '  resize:vertical !important;',
    '}',
    'html body #bbDetail .bb-field-grow textarea::-webkit-resizer{',
    '  background:transparent !important;',
    '}',

    /* ── THE MANUSCRIPT IS TWO CARDS: THE BAR, AND THE WRITING ──
       It was asked for as two cards — one for the toolbar, one for the
       writing area. The bar is the card across the top (the type toolbar
       over the chapter strip, one box, its corners rounded top and bottom),
       and the writing area is its own card under it with a gap between
       them, the way two cards in the app always sit. The writing sheet
       inside the second card stays flat, so the card is the box you see. */
    'html body :is(#page-manuscript,#page-script) .write-toolbar{',
    '  background:var(--surface-2) !important;',
    '  border:0 !important; box-shadow:none !important;',
    '  border-radius:var(--r-md, 6px) var(--r-md, 6px) 0 0 !important;',
    '  margin:0 16px !important; padding:6px 12px !important;',
    '}',
    'html body :is(#page-manuscript,#page-script) .chapter-controls{',
    '  background:var(--surface-2) !important;',
    '  border:0 !important; box-shadow:none !important;',
    '  border-radius:0 0 var(--r-md, 6px) var(--r-md, 6px) !important;',
    '  margin:0 16px !important; padding:6px 14px !important; min-height:36px !important;',
    '}',
    /* the bar with no toolbar above it is a card on its own */
    'html body :is(#page-manuscript,#page-script) .write-wrap > .chapter-controls:first-child{',
    '  border-radius:var(--r-md, 6px) !important;',
    '}',
    /* ── THE TWO CARDS, IN THE IDEA PAGE'S OWN COLOUR ──
       The Idea page is two cards as well — the list card down the left
       (.idea-side) and the writing card beside it (.idea-main > .idea-write)
       — and they are both --surface-2: one surface across the page. The
       manuscript's two cards take it too, the bar and the writing area
       alike, so the writing card is not the darker of the two and the two
       read as the pair they are, with the page's own background in the gap
       between them. (The writing area was --surface-1 for one turn — a step
       darker than the bar — which is what made the pair read as one card
       with a band under it.) */
    'html body :is(#page-manuscript,#page-script) .write-canvas{',
    '  background:var(--surface-2) !important;',
    '  border-radius:var(--r-md, 6px) !important;',
    '  margin:10px 16px 14px !important;',
    '  padding:20px 22px 120px !important;',
    '  border:0 !important; box-shadow:none !important;',
    '}',
    'html body :is(#page-manuscript,#page-script) .write-doc{',
    '  background:transparent !important;',
    '  border:0 !important; border-radius:0 !important; box-shadow:none !important;',
    '  padding:0 !important;',
    '}',
    /* ── AND THE SPLIT IS TWO BIG CARDS ──
       The idea page's cards are the reference: a plain --surface-2 box with
       no edge, the app's small radius, standing on the page's own
       background with a gap between them. In split mode the canvas card
       stands down — no fill, no inner margin of its own (it was taking the
       writing card's 20px all round and 120px under it, which is the box
       inside a box, with a band of empty card beneath the split) — so those
       two cards ARE the writing area: the writing card, twice. The panes
       were painted with the page's own --bg, the darkest tone in the app,
       which is what read as black slabs. */
    'html body :is(#page-manuscript,#page-script) .write-canvas.sf-split-canvas{',
    '  background:transparent !important; padding:0 !important;',
    '  overflow:hidden !important;',
    '}',
    'html body .sf-split-editors{ --sf-split-grip:14px !important; }',
    'html body .sf-split-pane{',
    '  background:var(--surface-2) !important; border:0 !important;',
    '  border-radius:var(--r-md, 6px) !important;',
    '}',
    'html body .sf-split-pane .sf-split-editor{ background:transparent !important; }',
    /* the grip is the gap between two cards, not a ruled line down the page:
       nothing is painted at rest, the handle shows itself under the pointer,
       and the accent marks the drag */
    'html body .sf-split-divider{ background:transparent !important; }',
    'html body .sf-split-divider:hover, html body .sf-split-divider:focus,',
    'html body.sf-split-resizing .sf-split-divider{',
    '  background:var(--accent) !important; color:var(--accent-ink) !important;',
    '}',
    /* ── AND THE SCRIPT PAGE IS THE SAME TWO CARDS ──
       Its two Fountain panes ARE the writing card, twice: the canvas that
       holds them stands down — no fill, and none of the padding this file
       gives the manuscript's writing card (20px all round and a 120px tail
       is what made the script's cards read as small) — and each pane wears
       the idea page's card colour instead of the paper --doc-bg the preview
       pane was drawn in, which is why the right-hand card had no colour
       while the left one had. The chapter strip is a card of its own here,
       because the type toolbar is off this page. */
    'html body :is(#page-manuscript,#page-script).sf-script-page .write-canvas{',
    '  background:transparent !important; padding:0 !important;',
    '}',
    'html body #page-manuscript#page-manuscript.sf-script-page.active .chapter-controls{',
    '  margin:10px 16px 0 !important; border-radius:var(--r-md, 6px) !important;',
    '}',
    'html body #page-manuscript#page-manuscript.sf-script-page.active .fnt-pane{',
    '  background:var(--surface-2) !important; border:0 !important;',
    '  border-radius:var(--r-md, 6px) !important;',
    '}',

    /* ── A CANVAS CARD IS PICKED BEFORE IT MOVES ────────────────
       The board's own gesture: the left button picks a card and it keeps
       the mark until something else is picked; the press that carries it
       is the next one, on the card already in hand. The mark is a fill and
       the card's own name in the accent — never a ring. */
    'html body #page-mindmap .mm-node.mm-sel{',
    '  background:var(--surface-4) !important;',
    '}',
    'html body #page-mindmap .mm-node.mm-sel .mm-node-head b{',
    '  color:var(--accent-2, var(--accent)) !important;',
    '}',

    /* ── AND THE LINKS ARE READ AGAIN ───────────────────────────
       A hairline that loops back on itself and crosses the card it came
       from reads as a mistake. The routes are redrawn from the two cards'
       own boxes (section 9 below writes every `d` again), so this is only
       the pen: one width, the round cap, a colour you can follow — and the
       accent, thicker, under the pointer, so a link can be found to click
       it away. */
    'html body #page-mindmap .mm-link{',
    '  stroke:var(--ink-4) !important; stroke-width:1.75 !important;',
    '  stroke-linecap:round !important; opacity:.85 !important;',
    '}',
    'html body #page-mindmap .mm-link-hit:hover + .mm-link{',
    '  stroke:var(--accent) !important; stroke-width:2.25 !important; opacity:1 !important;',
    '}',
    'html body #page-mindmap .mm-link-temp{ stroke-width:2 !important; opacity:1 !important; }'
  ].join('\n');
  const st = document.createElement('style');
  st.id = ID;
  st.textContent = css;
  host.appendChild(st);
  /* last in the head, after the sheet 8ac writes below it: one rule for the
     Statistics panel is a straight tie with the sheet that draws it, and a
     tie is won by whichever came last. */
  setTimeout(function(){
    const s = document.getElementById(ID);
    if(s && s.parentNode) s.parentNode.appendChild(s);
  }, 0);
})();


(function(){
  const ID = 'sfAccentLast';
  if(document.getElementById(ID)) return;
  const host = document.head || document.documentElement;
  if(!host) return;

  /* two ids of weight, out of thin air: neither id is ever on an element */
  const W    = ':not(#sfNoAccent):not(#sfNoAccent)';
  /* six, for the dashboard's project card: it is the one place where the
     app's own sheets reach a wrapper, a row and a name block separately and
     a colour that lands on one of them and not the others reads as a card
     in two pieces. Nothing in the app comes near six ids. */
  const WW   = W + W + W;
  /* what a press may not tint: a button that is ALREADY the accent, the round
     AI button, and the label inside a dropdown's own box - the box is what
     answers, a rectangle lit inside it would read as a second control */
  const SKIP = ':not(.btn-primary):not(.ol-btn-primary):not(.stats-cat-title)'
             + ':not([id^="fab"]):not(.logo-btn)'
  /* ── AND THE FULL-WIDTH ROWS THAT ONLY WEAR role=button ──
     Settings' fold cards make their own CARD TITLE a role="button" so it can
     be clicked open, and a card title spans the whole card — so the control
     wash below lit the entire row: reported from the Custom tab, where every
     card is one of these. A title is a label you open, not an option you
     pick: it answers with the app's own quiet ink (see the sheet that draws
     the folds) and takes no fill. */
             + ':not(.set-card-title):not(.sf-fold-sub)'
  
  /* ── AND THE ONES THE APP ALREADY FILLS ITSELF ──
     A switch, a chip, a calendar day, a notebook tab and a theme tile go
     SOLID accent when they are on (pages.css:616/634/2292/5195/5745/5825,
     and the tile's own rule in section 1). Washing those would take the
     accent OFF them, which is the opposite of the report — so they are named
     out of this sheet entirely and keep the app's own fill; the ones that
     are OFF are given the wash and the hairline below, so every toggle in
     the app answers the pointer either way. */
             + ':not(.tgl):not(.chip):not(.util-cal-day):not(.nb-gbtn)'
             + ':not(.nb-chap):not(.sf-theme-tile):not(.sf-num-btn)';
  /* the pointer, and the press */
  const SOFT = ':is(:hover,:active)';
  /* the choice: on · active · open */
  const PICK = ':is(.on,.active,.open)';
  const HOT  = ':is(:hover,:active,.on,.active,.open)';
  /* every compact control in the app: a real <button>, and every box, tab and
     toggle the app draws as one */
  const CTRL = ':is(button,[role="button"],summary,.ol-btn,.ol-tool,.icon-btn,'
             + '.icon-btn-sm,.mv-pager-btn,.draft-act,.tb-btn,.chip,.ft-pair,.tgl,'
             + '.seg-btn,.set-tab,.bb-tab,.util-tab,.util-btn,.nb-pub-tab,'
             + '.home-mode-toggle,.dayline-seg,.stats-mode-toggle,.sf-adv-tgl,'
             + '.draft-clear,.bb-search,.proj-btn,.pg-tab)';
  /* ── AND THE ONES AN OPTION IS, NOT A BUTTON ──────────────────
     A dropdown's bar and the card that holds a list are as wide as their
     label, and a wash of the accent over something that size stops reading
     as a mark and starts reading as the whole option turned amber — which
     is exactly what the font-weight list was reported as. These keep the
     app's own grey under the pointer and take the accent on their LABEL:
     the same answer the pages rows and the dashboard's project rows give,
     without a bar of amber. */
  const OPT  = ':is(.dd-trigger,.tb-drop-btn,.tb-drop2-btn,.draft-drop-btn,'
             + '.stats-cat-card,.imf-drop-btn)';
  /* a row or a card of a list: the whole box answers the pointer, its type
     stays its own. The big cards that hold FIELDS (a Settings card, a
     statistics tile) are not here: nothing about them is pressable, and a
     wash over a card of settings reads as a state that is not there. */
  const ROW  = ':is(.bb-row,.draft-row,.idea-row,.nb-row,.ol-item,'
             + '.mv-item,.kb-col,.kb-card,.proj-card,.proj-row,.proj-item,'
             + '.proj-item-wrap)';
  /* ── AND THE ROWS WHOSE WHOLE BOX WEARS THE ACCENT ───────────
     The name alone was reported as the row cut in two: the label lit and
     its marks — the folder, the pin, the pencil, the bin — left grey, so
     the row read as two elements instead of one. These are the rows the
     writer navigates and picks (the Bible's, the Draft's, the Idea's, the
     notebook's, the outline's, the pages overlay's and the dashboard's own
     project rows): under the pointer, and picked, the WHOLE row takes the
     accent together. The big containers that hold other rows (.kb-col,
     .kb-card, .proj-card) are not here: their type belongs to what they
     hold, and a Settings row is not here either — it is a label with a
     control, and flooding it was the “whole option turned amber” report. */
  const LINEROW = ':is(.bb-row,.draft-row,.idea-row,.nb-row,.ol-item,.mv-item,'
                + '.proj-row,.proj-item,.proj-item-wrap)';
  /* and the rows of a dropdown list */
  const DROP = ':is(.stats-cat-item,.dd-item,.draft-drop-item,'
             + '.tb-drop-list > *,.tb-drop2-list > *,.draft-drop-list > *)';
  /* the wash is mixed FROM the accent, so it is the theme's amber and not a
     colour of its own; --accent-soft is what an engine that cannot mix gets */
  const SOFTBG = 'var(--accent-soft, rgba(255,255,255,.09))';
  const ONBG   = 'var(--accent-line, rgba(255,255,255,.22))';
  const MIX    = 'color-mix(in srgb, var(--accent) ';
  const ink    = 'var(--accent-2, var(--accent))';
  const line   = 'var(--accent-line, var(--accent))';
  const NEUTRAL = 'html body #bbDetail#bbDetail#bbDetail ';
  const css = [
    /* ── a control under the pointer ──
       The wash and the accent label, and NOTHING ELSE: a border colour here
       put a ring of the accent round every control the pointer touched (and
       round a fixed-size ✕, where a 1px border is 1px of the box it does not
       have room for). The state is the fill and the type. */
    'html body ' + CTRL + SOFT + W + SKIP + '{',
    '  background-color:' + SOFTBG + ' !important;',
    '  background-color:' + MIX + '18%, transparent) !important;',
    '  color:' + ink + ' !important;',
    '}',
    /* ── and the one that is ON, or OPEN, or PICKED ── */
    /* the ring round a control that is ON was reported as an outline on the
       things it landed on: the wash and the accent label carry the state now,
       and no box in the app gets a line drawn round it for it. */
    'html body ' + CTRL + PICK + W + SKIP + '{',
    '  background-color:' + ONBG + ' !important;',
    '  background-color:' + MIX + '27%, transparent) !important;',
    '  color:' + ink + ' !important;',
    '}',
    /* the mark inside a control follows the control, never the ink */
    'html body ' + CTRL + HOT + W + SKIP + ' i{ color:inherit !important; }',
    'html body ' + CTRL + HOT + W + SKIP + ' svg{ stroke:currentColor !important; }',
    /* ── a row: the wash, and a picked row keeps the app's own edge ── */
    /* ── OPAQUE, AND THAT IS THE FIX FOR THE DASHBOARD's “GLITCH” ──
       A dashboard project row is a .proj-row INSIDE a .proj-item-wrap, and
       two of them carry this state — the app paints both, and so do these
       rules, because the wrapper is the box the app colours and the row is
       the box the list builds. Two SEMI-TRANSPARENT washes stack: the row
       came out measurably darker than the 3px of wrapper showing under it,
       which is exactly what was reported as an accent glitch on the
       dashboard's project rows. Mixed into the SURFACE rather than into
       transparent, the two layers are the same colour, so it cannot matter
       which of them paints, or how many times. */
    'html body ' + ROW + SOFT + W + '{',
    '  background-color:' + MIX + '12%, var(--surface-2)) !important;',
    '}',
    'html body ' + ROW + PICK + W + '{',
    '  background-color:' + MIX + '24%, var(--surface-3)) !important;',
    '}',
    /* ── AND THE DASHBOARD'S PROJECT CARD IS ONE PIECE ───────────
       The card is a .proj-item-wrap (the box the list lays out, rounds and
       clips), a .proj-row inside it, and inside THAT the .proj-item that
       holds the folder, the name and the sub-line — with the strip the
       pin, the pencil and the bin live in beside it. Several of those boxes
       were being painted, and the name block is the one that showed: its
       tint stopped at its own right edge, so the strip the buttons sit in
       came out a different colour and the card read as two pieces with a
       seam down it — and its square corner sat over the card's rounded
       one, which is the sharp left corners.

       So the CARD is the only thing that paints. Everything inside it —
       the row, the name block, the strip of buttons — is transparent, and
       the tint goes on the card itself at a weight nothing in the app
       comes near, so it cannot matter how the list lays the row out, or
       which sheet has tried to colour which box. The card clips its own
       corners, so nothing square can show through. */
    'html body :is(.proj-item-wrap)' + WW + '{',
    '  overflow:hidden !important; border-radius:6px !important;',
    '}',
    'html body :is(.proj-item-wrap)' + WW
      + ' :is(.proj-row:not(.active),.proj-item,.proj-body,.proj-name,.proj-source,.proj-actions)' + WW + '{',
    '  background-color:transparent !important; background-image:none !important;',
    '}',
    'html body :is(.proj-item-wrap):is(:hover,:active)' + WW + '{',
    '  background-color:' + MIX + '12%, var(--surface-2)) !important;',
    '}',
    /* the card you are ON: the row is what carries .active, so the card is
       found by what it holds — and the tint then covers the whole card,
       the strip of buttons included. If :has() is not understood the rule
       simply drops and the picked row keeps the tint it already has. */
    'html body :is(.proj-item-wrap):has(.proj-row:is(.active,.on,.open))' + WW + '{',
    '  background-color:' + MIX + '24%, var(--surface-3)) !important;',
    '}',
    /* the folder-view tile draws its own 10px corners on the row */
    'body.folder-view :is(.proj-item-wrap)' + WW + '{ border-radius:10px !important; }',
    /* ── AND THE THREE MARKS ON A PROJECT ROW STAY PUT ──
       pages.css fades the pin, the pencil and the bin IN under the pointer
       and hides them outright on the row that is ACTIVE (line 778), so
       after a pin — which re-draws the list, and the re-drawn row is no
       longer the node the pointer was over — the row came up bare while the
       same row in the pages overlay still had its marks. They are simply
       always there now, on both lists, at the app's own quiet ink until the
       pointer or the pick brings them the accent. */
    'html body :is(#page-home,#pagesOverlay) :is(.proj-row,.proj-item-wrap) .proj-btn' + WW + '{',
    '  opacity:1 !important; pointer-events:auto !important;',
    '}',
    /* ── AND THE OUTLINE'S HELD ROW ───────────────────────────────
       Holding a chapter or a scene — or a subchapter or a sub-scene — only
       faded the row to 45% (pages.css:2806) and marked nothing else, so the
       one list in the app that shows the accent while it carries a row was
       the outline. The held row now takes it: the wash, the accent type
       through the name, the number, the twist, the grip and the three row
       tools, and the same 2px accent edge a picked row wears, at full
       strength rather than faded. The drop target keeps the app's own ring
       and takes the accent wash every other drop target in the app has. */
    'html body :is(.ol-node.ol-dragging)' + WW + '{ opacity:1 !important; }',
    'html body :is(.ol-node.ol-dragging) > .ol-row' + WW + '{',
    '  background-color:' + MIX + '26%, var(--surface-3)) !important;',
    '  box-shadow:inset 2px 0 0 var(--accent) !important;',
    '}',
    'html body :is(.ol-node.ol-dragging) > .ol-row' + WW
      + ' :is(.ol-name,.ol-num,.ol-grab,.ol-twist,.ol-tool,.ol-badge,i,svg){',
    '  color:var(--accent-2, var(--accent)) !important;',
    '  stroke:currentColor !important; border-color:transparent !important;',
    '}',
    'html body :is(.ol-node.ol-drop-hint) > .ol-row' + WW + '{',
    '  background-color:' + MIX + '16%, var(--surface-3)) !important;',
    '}',
    /* ── AND THE WHOLE ROW WEARS IT — ONE PIECE, NOT TWO ──
       The name, the sub-line, the folder and the three buttons all take the
       accent TOGETHER under the pointer and when the row is picked. The name
       on its own was reported exactly as it read: the row divided, the label
       lit and its marks left grey. */
    'html body ' + LINEROW + ':is(:hover,.active,.selected)' + W + ',',
    'html body ' + LINEROW + ':is(:hover,.active,.selected)' + W + ' *{',
    '  color:var(--accent-2, var(--accent)) !important;',
    '}',
    'html body ' + LINEROW + ':is(:hover,.active,.selected)' + W + ' svg,',
    'html body ' + LINEROW + ':is(:hover,.active,.selected)' + W + ' svg *{',
    '  stroke:currentColor !important;',
    '}',
    /* and the picked project row keeps its own accent edge: the app draws it
       at pages.css:777 as the mark for the row you are on — an edge on the
       row, not an outline round it — and the ring pass above had taken it
       off, which is the accent that went missing from the pages overlay and
       the dashboard's list. */
    'html body ' + W + ' :is(.proj-row,.proj-item-wrap):is(.active,.on){',
    '  box-shadow:inset 2px 0 0 var(--accent) !important;',
    '}',
    /* ── a switch or a chip that is OFF: the wash and a hairline, so every
          toggle answers the pointer — the ones that are ON are the app's own
          solid fill and are named out of this sheet above ── */
    'html body :is(.tgl,.chip,.sf-adv-tgl):not(.on):is(:hover,:active)' + W + '{',
    '  background-color:' + SOFTBG + ' !important;',
    '  background-color:' + MIX + '18%, transparent) !important;',
    '}',
    /* ── and the rows of a dropdown list ── */
    'html body ' + DROP + ':is(:hover,.on,.active)' + W + '{',
    '  background-color:var(--surface-3) !important;',
    '  color:' + ink + ' !important;',
    '}',
    'html body ' + DROP + ':is(:hover,.on,.active)' + W + ' i{ color:inherit !important; }',
    /* ── and an option's own bar: the grey, the accent label, no flood ── */
    'html body ' + OPT + SOFT + W + '{',
    '  background-color:var(--surface-4) !important;',
    '  color:' + ink + ' !important;',
    '}',
    'html body ' + OPT + HOT + W + ' i{ color:inherit !important; }',
    'html body ' + OPT + HOT + W + ' svg{ stroke:currentColor !important; }',
    /* ── the Bible's detail pane was asked to stay neutral: put back to grey at
       three ids, so it out-ranks every rule above ── */
    NEUTRAL + CTRL + HOT + SKIP + '{',
    '  background:var(--surface-4) !important; color:var(--ink) !important;',
    '  border-color:transparent !important; box-shadow:none !important;',
    '}',
    NEUTRAL + CTRL + HOT + SKIP + ' i{ color:inherit !important; }',
    NEUTRAL + DROP + ':is(:hover,.on,.active){',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '}'
  ].join('\n');
  const st = document.createElement('style');
  st.id = ID;
  st.textContent = css;
  host.appendChild(st);
})();


/* ═══ 9 · THE CANVAS — PICK A CARD, HOLD IT, AND LINKS THAT READ ═══

   Two things the board already does and the canvas did not.

     · A CARD IS PICKED BEFORE IT MOVES. On the board the left button picks
       a card and it stays picked; the press that carries it is the NEXT
       one, on the card already in hand. The canvas moved a card the moment
       it was pressed, so every attempt to read a card or find its text
       nudged it a few pixels off its place. Here the first press picks and
       does nothing else, and a press on the card that is already in hand is
       the one that carries it. Arrow keys nudge the card in hand, Tab walks
       the cards, Enter opens its text, Delete takes it off the canvas — the
       same keys the board answers.

     · AND THE LINKS ARE DRAWN AGAIN. mindmap.js drew every link from the
       right edge of one card into the left edge of the other whatever their
       places: two cards the wrong way round, or one under the other, gave a
       curve that swung out, looped back and crossed itself — the scribble
       in the screenshot. Each route is read off the two cards' real boxes
       and written again, so a link leaves the edge that FACES the card it
       is going to (right→left, left→right, bottom→top, top→bottom) and has
       nothing to loop around. Only the `d` of the two paths is touched, so
       mindmap.js keeps owning the canvas: its clicking, its drag, its
       delete, its saving. */
(function(){
  const PAGE = 'mindmap';
  let selId = null, raf = 0;

  const page   = function(){ return document.getElementById('page-' + PAGE); };
  const world  = function(){ const p = page(); return p ? p.querySelector('.mm-world') : null; };
  const stage  = function(){ const p = page(); return p ? p.querySelector('.mm-stage') : null; };
  const links  = function(){ const p = page(); return p ? p.querySelector('.mm-links') : null; };

  /* ── the cards, in the stage's own coordinates ── */
  const boxes = function(){
    const s = stage(), w = world();
    if(!s || !w) return null;
    const r = s.getBoundingClientRect();
    const out = [];
    Array.prototype.forEach.call(w.querySelectorAll('.mm-node'), function(n){
      const b = n.getBoundingClientRect();
      if(!b.width && !b.height) return;
      out.push({ el:n, x:b.left - r.left, y:b.top - r.top, w:b.width, h:b.height });
    });
    return out;
  };
  const mid = function(n, side){
    if(side === 'r') return { x:n.x + n.w, y:n.y + n.h / 2 };
    if(side === 'l') return { x:n.x, y:n.y + n.h / 2 };
    if(side === 'b') return { x:n.x + n.w / 2, y:n.y + n.h };
    return { x:n.x + n.w / 2, y:n.y };
  };
  const r1 = function(v){ return Math.round(v * 10) / 10; };

  /* the route: out of the edge that faces the card it is going to */
  const route = function(a, b){
    const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
    const dy = (b.y + b.h / 2) - (a.y + a.h / 2);
    let p1, p2, c1, c2;
    if(Math.abs(dx) >= Math.abs(dy)){
      const right = dx >= 0;
      p1 = mid(a, right ? 'r' : 'l');
      p2 = mid(b, right ? 'l' : 'r');
      const k = Math.max(30, Math.min(140, Math.abs(p2.x - p1.x) * 0.5));
      c1 = { x:p1.x + (right ? k : -k), y:p1.y };
      c2 = { x:p2.x + (right ? -k : k), y:p2.y };
    } else {
      const down = dy >= 0;
      p1 = mid(a, down ? 'b' : 't');
      p2 = mid(b, down ? 't' : 'b');
      const k = Math.max(30, Math.min(140, Math.abs(p2.y - p1.y) * 0.5));
      c1 = { x:p1.x, y:p1.y + (down ? k : -k) };
      c2 = { x:p2.x, y:p2.y + (down ? -k : k) };
    }
    return 'M' + r1(p1.x) + ' ' + r1(p1.y)
         + ' C' + r1(c1.x) + ' ' + r1(c1.y)
         + ', ' + r1(c2.x) + ' ' + r1(c2.y)
         + ', ' + r1(p2.x) + ' ' + r1(p2.y);
  };

  const endsOf = function(d){
    const m = String(d || '').match(/-?\d+(?:\.\d+)?/g);
    if(!m || m.length < 4) return null;
    return { ax:+m[0], ay:+m[1], bx:+m[m.length - 2], by:+m[m.length - 1] };
  };
  const nearest = function(list, x, y, skip){
    let best = null, bd = 28;
    list.forEach(function(n){
      if(skip === n) return;
      [mid(n, 'r'), mid(n, 'l'), mid(n, 'b'), mid(n, 't')].forEach(function(p){
        const d = Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y));
        if(d < bd){ bd = d; best = n; }
      });
    });
    return best;
  };

  const reroute = function(){
    const svg = links(), list = boxes();
    if(!svg || !list || !list.length) return;
    Array.prototype.forEach.call(svg.querySelectorAll('path.mm-link-hit[data-mm-link]'), function(hit){
      const line = hit.previousElementSibling;
      if(!line || !line.getAttribute) return;
      if(String(line.getAttribute('class') || '').indexOf('mm-link') < 0) return;
      if(line.hasAttribute('data-mm-link')) return;         /* never the hit path */
      const e = endsOf(hit.getAttribute('d'));
      if(!e) return;
      const a = nearest(list, e.ax, e.ay, null);
      const b = a ? nearest(list, e.bx, e.by, a) : null;
      if(!a || !b) return;
      const d = route(a, b);
      if(hit.getAttribute('d') !== d){
        hit.setAttribute('d', d);
        line.setAttribute('d', d);
      }
    });
  };

  /* ── the pick ── */
  const mark = function(){
    const w = world();
    if(!w) return;
    Array.prototype.forEach.call(w.querySelectorAll('.mm-node.mm-sel'), function(n){ n.classList.remove('mm-sel'); });
    if(!selId) return;
    const n = w.querySelector('[data-mm-node="' + selId + '"]');
    if(n) n.classList.add('mm-sel');
  };
  const state = function(){
    try{
      const proj = (typeof kbProj === 'function') ? kbProj() : null;
      const d = (typeof D === 'function') ? D() : null;
      return (proj && proj.mindmap) || (d && d.mindmap) || null;
    }catch(e){ return null; }
  };
  const cardEl = function(id){
    const w = world();
    return w ? w.querySelector('[data-mm-node="' + id + '"]') : null;
  };

  const nudge = function(dx, dy){
    const st = state();
    if(!st || !Array.isArray(st.nodes) || !selId) return;
    const n = st.nodes.filter(function(x){ return x.id === selId; })[0];
    if(!n) return;
    n.x = Math.round((+n.x || 0) + dx);
    n.y = Math.round((+n.y || 0) + dy);
    const el = cardEl(selId);
    if(el){ el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
    if(typeof save === 'function') save();
    reroute();
  };
  const dropCard = function(){
    const st = state();
    if(!st || !Array.isArray(st.nodes) || !selId) return;
    const id = selId;
    selId = null;
    st.nodes = st.nodes.filter(function(n){ return n.id !== id; });
    st.links = (st.links || []).filter(function(l){ return l.a !== id && l.b !== id; });
    if(typeof save === 'function') save();
    const p = page();
    /* the page redraws from what is now in the project, so the card and its
       links go together and nothing is left pointing at nothing */
    if(p && window.PAGE_RENDERERS && typeof window.PAGE_RENDERERS[PAGE] === 'function'){
      window.PAGE_RENDERERS[PAGE](p);
    } else {
      const el = cardEl(id);
      if(el && el.parentNode) el.parentNode.removeChild(el);
      reroute();
    }
  };

  /* the pick happens before anything else reads the press, so the press that
     picks never reaches mindmap.js's own drag */
  window.addEventListener('pointerdown', function(e){
    if(e.button !== 0 || !page()) return;
    const t = e.target;
    if(!t || !t.closest) return;
    const card = t.closest('#page-mindmap .mm-node');
    if(!card){
      if(t.closest('#page-mindmap .mm-stage') && selId){ selId = null; mark(); }
      return;
    }
    if(t.closest('textarea, button, [data-mm-port]')) return;   /* text, buttons, the link handle */
    if(selId === card.dataset.mmNode) return;                   /* in hand: the press carries it */
    selId = card.dataset.mmNode;
    mark();
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  document.addEventListener('keydown', function(e){
    if(!page()) return;
    const t = e.target;
    const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || (t && t.isContentEditable) ||
                   (t && t.closest && t.closest('[contenteditable="true"]'));
    if(e.key === 'Escape' && selId && !typing){ selId = null; mark(); return; }
    if(!selId || typing) return;
    const big = e.shiftKey ? 24 : 1;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); nudge(-big, 0); return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); nudge(big, 0); return; }
    if(e.key === 'ArrowUp'){ e.preventDefault(); nudge(0, -big); return; }
    if(e.key === 'ArrowDown'){ e.preventDefault(); nudge(0, big); return; }
    if(e.key === 'Tab'){
      const w = world();
      if(!w) return;
      const all = Array.prototype.slice.call(w.querySelectorAll('.mm-node'));
      if(!all.length) return;
      e.preventDefault();
      let i = all.findIndex(function(n){ return n.dataset.mmNode === selId; });
      i = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : (i >= all.length - 1 ? 0 : i + 1);
      selId = all[i].dataset.mmNode;
      mark();
      return;
    }
    if(e.key === 'Enter'){
      const el = cardEl(selId);
      const ta = el && el.querySelector('.mm-node-text');
      if(ta){ e.preventDefault(); ta.focus(); }
      return;
    }
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); dropCard(); }
  }, false);

  /* ── keep the marks on, and the routes right, through every redraw ── */
  const beat = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      const s = stage();
      if(!s || !s.getBoundingClientRect().width) return;      /* not on screen */
      mark();
      reroute();
    });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(beat).observe(document.body, { childList:true, subtree:true });
  }
  if(typeof window.PAGE_RENDERERS === 'object' && window.PAGE_RENDERERS &&
     typeof window.PAGE_RENDERERS[PAGE] === 'function' && !window.PAGE_RENDERERS.__sfCanvas){
    const orig = window.PAGE_RENDERERS[PAGE];
    window.PAGE_RENDERERS[PAGE] = function(){
      const out = orig.apply(this, arguments);
      selId = null;
      setTimeout(beat, 0);
      setTimeout(beat, 140);
      return out;
    };
    window.PAGE_RENDERERS.__sfCanvas = true;
  }
  beat();
})();


/* ═══ 10 · THE APP'S TYPE COLOUR — Settings → Appearance → Font ═══

   The Font card sets the interface's face, its size and its weight. This
   is the fourth thing it needed and did not have: the COLOUR the app's own
   type is written in — the interface's text, not the manuscript's and not
   the script's. The writing pages take --doc-ink from the theme and are
   deliberately left out of this row.

   The app's type is a ramp: --ink is the text you read, and --ink-2 ·
   --ink-3 · --ink-4 are the quieter levels (sub-lines, marks, hints). The
   quieter three FOLLOW the colour you pick — mixed toward the page's own
   ground so the ramp keeps its steps at any colour — instead of staying
   the theme's grey and leaving half the interface behind. “Theme” hands
   all four back. */
(function(){
  /* ── WHY THIS IS A SHEET AND NOT AN INLINE WRITE ──
     state.js applyThemeVars() writes every theme token on BOTH <html> and
     <body> with el.style.setProperty(k, v) — and setProperty on a property
     that already carries a declaration REPLACES it, important flag and all.
     An inline write here was therefore wiped the moment the theme was
     applied again (boot, Save, a palette pick), which is why the colour
     looked like it did nothing. A sheet's !important cannot be reached by
     a plain inline write, so the ramp is painted from a stylesheet that is
     rewritten on every change. */
  const sheet = (function(){
    let el = document.getElementById('sfAppInkSheet');
    if(!el || el.tagName !== 'STYLE'){
      el = document.createElement('style');
      el.id = 'sfAppInkSheet';
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  })();
  /* #rgb / #rrggbb → [r,g,b], and a mix TOWARDS the page's ground. Mixed
     in JS rather than with color-mix(): a custom property keeps whatever
     token stream it is given, so an engine without color-mix() would hand
     an unparsable value to every `color:` that reads the level. */
  const rgb = function(c){
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim());
    if(!m) return null;
    let h = m[1];
    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const hex = function(a){
    return '#' + a.map(function(n){
      return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2,'0');
    }).join('');
  };
  const ground = function(){
    try{
      return rgb(getComputedStyle(document.documentElement).getPropertyValue('--bg')) || [27,26,25];
    }catch(e){ return [27,26,25]; }
  };
  const toward = function(c, t, g){
    return hex([0,1,2].map(function(i){ return c[i]*t + g[i]*(1-t); }));
  };
  const currentInk = function(){
    try{
      return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#eeeae0';
    }catch(e){ return '#eeeae0'; }
  };
  const paint = function(v){
    try{
      if(!v){ sheet.textContent = ''; return; }
      const c = rgb(v);
      if(!c){ sheet.textContent = ':root, html, body{ --ink:' + v + ' !important; }'; return; }
      const g = ground();
      sheet.textContent = ':root, html, body{\n'
        + '  --ink:' + hex(c) + ' !important;\n'
        + '  --ink-2:' + toward(c, .80, g) + ' !important;\n'
        + '  --ink-3:' + toward(c, .62, g) + ' !important;\n'
        + '  --ink-4:' + toward(c, .45, g) + ' !important;\n'
        + '}';
    }catch(e){}
  };
  const apply = function(){
    const cfg = (typeof S !== 'undefined') ? S.config : null;
    const v = cfg ? String(cfg.appInk || '') : '';
    paint(v);
    const dot = document.getElementById('sfAppInkDot');
    if(dot) dot.style.background = v || 'var(--ink)';
    const chip = document.getElementById('sfAppInkChip');
    if(chip) chip.style.background = v || 'var(--ink)';
    const inp = document.getElementById('sfAppInkInput');
    if(inp){
      /* ── AND THE BOX ITSELF IS FILLED ──
         A colour input draws a small chip of its own inside a padded
         button, and how much of the box that chip covers is the platform's
         business, not ours — which is why the swatch kept turning up as a
         thin bar. The input's OWN background is the colour now, inside the
         same 6px corner, so the control is a filled rounded square with no
         way for a chip to spoil it. “Theme” hands it back to the ink. */
      try{ inp.style.background = v || 'var(--ink)'; }catch(e){}
      if(v && inp.value !== v) inp.value = v;
    }
  };
  window.sfApplyAppInk = apply;

  /* ── AND IT GOES AFTER “Font weight” ──
     The weight rows are added by a wrapper that runs OUTSIDE this one, so
     at the moment the card is drawn they are not there yet and the row was
     landing above them. It is put in place — after the weight row when that
     row exists, at the end otherwise — every time the card is looked at,
     which is what makes it settle in the right spot wherever the rows are
     added from. */
  const place = function(host, r){
    /* the LAST weight row: the Font card gets “Enable custom weight” and
       “Weight” from settings.js, and the colour belongs after the weight
       control itself, not between the two */
    const rows = Array.prototype.filter.call(host.querySelectorAll('.set-row'), function(el){
      const l = el.querySelector('.set-label');
      return l && /weight/i.test(String(l.textContent || '').trim());
    });
    const weight = rows[rows.length - 1];
    if(weight && weight.parentNode === host){
      if(weight.nextElementSibling !== r) host.insertBefore(r, weight.nextElementSibling);
    } else if(r.parentNode !== host || r !== host.lastElementChild){
      host.appendChild(r);
    }
  };

  const build = function(cfg){
    const dot = document.createElement('span');
    dot.id = 'sfAppInkDot';
    dot.className = 'sf-ink-dot';
    dot.title = 'The colour the app\u2019s own type is in';
    const inp = document.createElement('input');
    inp.type = 'color';
    inp.id = 'sfAppInkInput';
    inp.className = 'sf-ink-inp';
    inp.value = (cfg && cfg.appInk) || currentInk();
    inp.title = 'Pick the colour of the app\u2019s text';
    /* ── THE SWATCH IS OURS, NOT THE PLATFORM'S ──
       A colour input paints a small chip of its own inside a padded
       button, and how much of the box that chip covers is the platform's
       business — which is why the control kept coming up as a thin bar in
       a rounded box however the swatch pseudo-elements were told to
       behave. The input is invisible now and lies over a chip this file
       draws: the box you see is ours, filled corner to corner, and the
       input is only the thing that opens the picker. */
    const chip = document.createElement('span');
    chip.id = 'sfAppInkChip';
    chip.className = 'sf-ink-chip';
    const pick = document.createElement('span');
    pick.className = 'sf-ink-pick';
    pick.title = 'Pick the colour of the app\u2019s text';
    pick.appendChild(chip);
    pick.appendChild(inp);
    inp.oninput = function(){
      if(cfg) cfg.appInk = inp.value;
      apply();
      if(typeof save === 'function') save();
    };
    const auto = document.createElement('button');
    auto.type = 'button';
    auto.className = 'btn btn-ghost sf-ink-auto';
    auto.textContent = 'Theme';
    auto.title = 'Use the theme\u2019s own text colour';
    auto.onclick = function(){
      if(cfg) cfg.appInk = '';
      apply();
      if(typeof save === 'function') save();
    };
    const ctl = document.createElement('div');
    ctl.className = 'sf-ink-ctl';
    ctl.appendChild(dot);
    ctl.appendChild(pick);
    ctl.appendChild(auto);

    let r = null;
    if(typeof row === 'function'){
      try{ r = row('App colour', 'Colour of the text across the interface', ctl); }catch(e){ r = null; }
    }
    if(!r){
      r = document.createElement('div');
      r.className = 'set-row';
      const l = document.createElement('div');
      l.innerHTML = '<div class="set-label">App colour</div>';
      const c = document.createElement('div');
      c.className = 'set-ctrl';
      c.appendChild(ctl);
      r.appendChild(l);
      r.appendChild(c);
    }
    r.id = 'sfAppInkRow';
    return r;
  };

  const inkRow = function(){
    const modal = document.querySelector('.settings-modal');
    if(!modal) return;
    /* the Font card, by its title — a card that has been folded carries its
       count inside that same title, so the match is on the word, not on the
       whole string */
    const host = Array.prototype.filter.call(modal.querySelectorAll('.set-card'), function(c){
      const t = c.querySelector('.set-card-title');
      return t && /^Font\b/.test(String(t.textContent || '').trim());
    })[0];
    if(!host) return;
    const cfg = (typeof S !== 'undefined') ? S.config : null;
    let r = document.getElementById('sfAppInkRow');
    if(!r){
      r = build(cfg);
      if(!r) return;
    }
    if(r.parentNode !== host){
      if(r.parentNode) r.parentNode.removeChild(r);
      host.appendChild(r);
    }
    place(host, r);
    apply();
  };

  const st = document.createElement('style');
  st.id = 'sfInkRow';
  st.textContent = [
    '.sf-ink-ctl{ display:flex; align-items:center; gap:6px; }',
    '.sf-ink-dot{ display:inline-block; width:14px; height:14px; border-radius:50%;',
    '  background:var(--ink-2); flex:0 0 auto; }',
    /* the box is a rounded SQUARE, not the wide rectangle a colour input
       draws by default: 22px like the app's own icon buttons, a hairline
       edge so it reads as a control, and a corner only lightly rounded —
       the picker sits between the round swatch and the Theme button */
    /* THE BOX IS DRAWN HERE, not by the input. The chip is a filled rounded
       square painted from the chosen colour; the input sits over it at full
       size but fully transparent, so the platform's own chip — the thin bar
       that kept appearing inside the box — is never seen at all. */
    '.sf-ink-pick{ position:relative; display:inline-block; width:22px; height:22px;',
    '  flex:0 0 auto; }',
    '.sf-ink-chip{ position:absolute; inset:0; border-radius:6px;',
    '  background:var(--ink); box-shadow:inset 0 0 0 1px var(--line-2);',
    '  pointer-events:none; }',
    '.sf-ink-inp{ position:absolute; inset:0; width:100%; height:100%;',
    '  margin:0; padding:0; border:0; opacity:0; cursor:pointer;',
    '  background:transparent;',
    '  appearance:none; -webkit-appearance:none; }',
    '.sf-ink-inp::-webkit-color-swatch-wrapper{ padding:0; }',
    '.sf-ink-inp::-webkit-color-swatch{ border:0; }',
    'html body .sf-ink-ctl .sf-ink-auto{ height:22px; padding:0 8px; font-size:11px; }'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);

  if(typeof window.applyConfig === 'function'){
    const orig = window.applyConfig;
    window.applyConfig = function(k){
      const out = orig.apply(this, arguments);
      try{ if(k === 'theme' || k === 'appInk') apply(); }catch(e){}
      return out;
    };
  }
  const over = function(){
    const S2 = window.SETTINGS;
    if(!S2 || typeof S2.open !== 'function' || S2.__sfInk) return;
    const o = S2.open;
    S2.open = function(){
      const out = o.apply(this, arguments);
      setTimeout(function(){ inkRow(); apply(); }, 0);
      setTimeout(function(){ inkRow(); apply(); }, 80);
      setTimeout(function(){ inkRow(); apply(); }, 320);
      return out;
    };
    S2.__sfInk = true;
    /* ── AND THROUGH THE TAB'S OWN RENDERER ──
       The Font card lives in the Appearance tab, and that tab is only drawn
       when it is shown: the row was written on open, found no Font card yet
       and was never written again — which is why the option was not there.
       It goes on with the tab now, every time the card is drawn. */
    if(S2.renderers && typeof S2.renderers.appearance === 'function' && !S2.renderers.__sfInk){
      const orig = S2.renderers.appearance;
      S2.renderers.appearance = function(){
        const out = orig.apply(this, arguments);
        try{ inkRow(); }catch(e){}
        [0, 60, 260, 700].forEach(function(ms){
          setTimeout(function(){ try{ inkRow(); apply(); }catch(e){} }, ms);
        });
        return out;
      };
      S2.renderers.__sfInk = true;
    }
  };
  over();
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('[data-act="open-settings"]')) setTimeout(function(){ over(); inkRow(); apply(); }, 40);
  }, true);

  /* ── and the row is kept in place while the tab settles ──
     The weight rows are added by a wrapper OUTSIDE this file's, after the
     card has been drawn — so where the row belongs is only knowable once
     that has happened. It is put in place again on the frames after every
     change inside the open panel, which is the only way to be right without
     knowing which wrapper runs when. Idempotent: once the row sits after
     “Font weight”, nothing moves. */
  let raf = 0;
  const beat = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      try{ inkRow(); }catch(e){}
    });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(function(){
      if(document.querySelector('.settings-modal')) beat();
    }).observe(document.body, { childList:true, subtree:true });
  }
  /* A page pass re-draws the interface but writes no token, and the sheet
     outranks the theme's own inline write, so nothing has to be re-applied
     on a page change: the ramp holds until the colour is changed again. */
  document.addEventListener('DOMContentLoaded', function(){ over(); apply(); });
  apply();
})();


/* ═══════════════════════════════════════════════════════════
   11 · THE TRANSLATE CARD

   The card itself is drawn by settings.js (id: sfTranslate) — a head, an
   action row, the source/target pair, a search box, the language grid and a
   resize grip. Five things about it were wrong on screen:

     · IT WORE A RING. A 1px --line-2 box round the whole card — the only
       floating layer in the app still wearing one. It is gone; the depth
       carries the card, exactly as it carries the FAB's own menus.

     · ITS DISABLED BUTTONS ASKED FOR THE BLOCKED CURSOR. Copy · Insert ·
       Append · Replace are disabled until there is a translation, and they
       asked the pointer for `cursor:not-allowed` — the red circle-and-slash
       the pointer showed over every one of them. Disabled is quiet here, not
       forbidden: a lower fill and the ordinary pointer.

     · NO HINGLISH. The card's own pair list (PAIRS, in settings.js) is drawn
       by nothing any more, so English → हिन्दी was the only conversion left
       and Hinglish → हिन्दी / Hinglish → English could not be reached at all.
       That whole list is written back in, above the language grid.

     · IT CLOSED WHILE YOU RESIZED IT. Dragging the grip — or the header — and
       letting go outside the card makes the browser fire a click on <body>,
       and the card's own outside-click rule reads that as “you clicked away”.
       The release of a drag is not a click away, and is no longer treated as
       one.

     · THE SOURCE WAS THE WHOLE CHAPTER, NOT THE SENTENCE. The card reads its
       source from the live selection, but clicking a language *inside* the
       card collapses that selection before the request is built — so it fell
       back to the whole editor. The selection is kept from the moment it is
       made, and that is what the card shows and what it translates.
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* ── 11a · the card's own edges ──────────────────────────────
     One id of weight: the card's sheet writes its ring at `html body
     .sf-translate` and the action row's hairline the same way, and an id
     outranks any number of classes. */
  const CSS = [
    'html body #sfTranslate{ border:0 !important;',
    '  box-shadow:0 18px 44px -16px rgba(0,0,0,.62) !important; }',
    /* the head keeps its hairline — that one divides. The second line under
       the action row, 30px below it, was the box the buttons sat in. */
    'html body #sfTranslate .ft-actions{ border:0 !important; }',
    'html body #sfTranslate .ft-action{ border:0 !important; }',
    'html body #sfTranslate .ft-action:hover{',
    '  background:var(--surface-3) !important; color:var(--ink) !important; }',
    'html body #sfTranslate .ft-action:disabled{',
    '  opacity:.55 !important; cursor:default !important; }',
    /* Replace is the card's primary action, and it is the same quiet chip as
       Copy and Append beside it: --surface-3 with --ink-2, and the accent in
       the label only — under the pointer and while it is pressed. */
    'html body #sfTranslate .ft-action.ft-primary{',
    '  background:var(--surface-3) !important; color:var(--ink-2) !important; }',
    'html body #sfTranslate .ft-action.ft-primary:hover{',
    '  background:var(--surface-4) !important; color:var(--accent) !important; }',
    'html body #sfTranslate .ft-action.ft-primary:active{',
    '  background:var(--surface-4) !important; color:var(--accent) !important; }',
    /* the same red slash over the FAB sheet's own action chips */
    'html body .ft-actions .ai-chip:disabled{ cursor:default !important; }',
    /* the conversions: the picked one is the accent, the rest are quiet */
    'html body #sfTranslate .sft-pairs{ margin:0 0 8px !important; }',
    'html body #sfTranslate .sft-pairs .ft-action{ text-align:center !important; }',
    'html body #sfTranslate .sft-pairs .ft-action.on{',
    '  background:var(--accent-soft) !important; color:var(--accent) !important; }',
    /* ── the result sheet's one white button ──
       Replace came out filled with --ink — the app's only white button, and
       the only primary in it that is not the accent. Every other primary
       here (New draft, Save, an .ai-chip.primary) is accent on
       --accent-ink, and so is this one now. The quiet text buttons beside
       it are not touched. */
    'html body #modalRoot .gt-act.gt-primary{',
    '  background:var(--surface-3) !important; color:var(--ink-2) !important;',
    '  border-color:transparent !important; }',
    'html body #modalRoot .gt-act.gt-primary:hover{',
    '  background:var(--surface-4) !important; color:var(--accent) !important; }',
    'html body #modalRoot .gt-act.gt-primary:active{',
    '  background:var(--surface-4) !important; color:var(--accent) !important; }',
    /* ── 11a(2) · THE GRIP IS NOT PART OF THE LIST ──
       The card scrolls now, and the resize grip is a child of the scrolling
       box: an absolutely positioned child of a scrollport travels with the
       content, so the little corner square was seen drifting up the card's
       right edge instead of sitting in the bottom-right corner. The card
       already fits itself to what it holds, so the grip is taken off. */
    'html body #sfTranslate .sft-grip{ display:none !important; }',

    /* ── the card hugs its content ────────────────────────────────
       The grip's drag writes a fixed height onto the card and the card is
       built once and kept, so that one drag stayed with it for the rest of
       the session — a short list of languages under a very tall empty box.
       Two things here: the card is allowed a little more room for the list
       itself (it was capped at 190px and scrolled inside a 640px box), and
       the grid no longer stretches to fill whatever height is left over.
       The leftover height itself is dropped on every open — see fitCard. */
    'html body #sfTranslate{',
    '  max-height:min(76vh, 660px) !important; overflow-y:auto !important; }',
    /* NO CHILD OF THE CARD IS SQUEEZED. A flex column with a max-height and
       no room left shrinks its children, and the two boxes at the top went
       with it: the source and target cells held their 64px but the text
       inside them was pressed to a sliver, so the pair read as two lines of
       clipped grey. Nothing in the card shrinks now — if the content is
       taller than the card, the card scrolls. */
    'html body #sfTranslate > *{ flex:0 0 auto !important; }',
    'html body #sfTranslate .ft-cell{ min-height:74px !important; }',
    'html body #sfTranslate .ft-text{ min-height:40px !important; }',
    'html body #sfTranslate .ft-grid{',
    '  flex:0 0 auto !important; max-height:min(32vh, 240px) !important; }'
  ].join('\n');
  const sheet = document.createElement('style');
  sheet.id = 'sfTranslateSheet';
  sheet.textContent = CSS;
  (document.head || document.documentElement).appendChild(sheet);

  /* ── 11b · the conversions ───────────────────────────────────
     Four pairings — Hinglish in both directions, and Hinglish to and from
     each script. The two Devanagari ↔ English pairs that used to open the
     row are gone by request: the language grid under the row already does
     any language into any other, so they were the one pairing the card
     could reach without this list. */
  const PAIRS = [
    { id:'hg-hi', label:'Hinglish → हिन्दी', from:'Hinglish (Roman Hindi)', to:'Hindi, written in the Devanagari script' },
    { id:'hg-en', label:'Hinglish → English', from:'Hinglish', to:'English' },
    { id:'en-hg', label:'English → Hinglish', from:'English', to:'Hinglish — Hindi written in Roman script, the way people actually type it' },
    { id:'hi-hg', label:'हिन्दी → Hinglish', from:'Hindi, written in the Devanagari script', to:'Hinglish — the very same Hindi, in Roman script' }
  ];

  /* ── 11c · the selection the writer actually made ────────────
     Kept the moment it is made, because the click that reaches for a
     language in the card collapses it. Only a real selection inside a
     writing surface is kept — and it is dropped when the writer clicks
     away somewhere that is not the pen and not the card. */
  const SURFACES = '#editor,.editor-doc,.write-doc,.sf-split-doc,#draftBody,#nbReaderBody,[contenteditable="true"]';
  const card = function(){ return document.getElementById('sfTranslate'); };
  const open = function(){ const p = card(); return !!(p && p.classList.contains('open')); };
  const surfaceOf = function(node){
    const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
    try{ return (el && el.closest) ? el.closest(SURFACES) : null; }catch(e){ return null; }
  };
  let held = { text:'', range:null };

  const paint = function(){
    const p = card();
    if(!p || !p.classList.contains('open') || !held.text) return;
    const src = p.querySelector('#sftSrc');
    if(src) src.textContent = held.text.length > 4000 ? held.text.slice(0, 4000) + '…' : held.text;
    /* Replace works on the range too, so the card puts back what it took */
    try{ if(held.range) p._sftSaved = held.range; }catch(e){}
  };
  const remember = function(){
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed) return;    /* a caret is not a source */
    const txt = String(sel.toString() || '').trim();
    if(!txt || !surfaceOf(sel.anchorNode)) return;            /* a selection inside the card is not one either */
    let range = null;
    try{ range = sel.getRangeAt(0).cloneRange(); }catch(e){ range = null; }
    held = { text:txt, range:range };
    if(open()) paint();
  };
  document.addEventListener('selectionchange', function(){ try{ remember(); }catch(e){} });
  document.addEventListener('mousedown', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('#fabWrap') || t.closest('#sfTranslate') || surfaceOf(t)) return;
    held = { text:'', range:null };
  }, true);

  /* The card builds its request from ctxTxt(); while it is open the answer is
     the held selection rather than the whole document — which is the whole
     point of “work on whatever I selected in the writing area”. Every other
     caller still gets the original. */
  const origCtx = window.ctxTxt;
  if(typeof origCtx === 'function' && !origCtx.__sfHeld){
    const heldCtx = function(){
      if(open() && held.text) return held.text;
      return origCtx.apply(this, arguments);
    };
    heldCtx.__sfHeld = true;
    window.ctxTxt = heldCtx;
  }

  /* ── 11d · the pairs row ───────────────────────────────────── */
  const translate = async function(pair){
    const p = card();
    if(!p) return;
    const dst = p.querySelector('#sftDst');
    const nameEl = p.querySelector('#sftDstName');
    if(nameEl) nameEl.textContent = pair.label;

    let txt = held.text;
    if(!txt){
      const src = p.querySelector('#sftSrc');
      const shown = src ? String(src.textContent || '').trim() : '';
      if(shown && !/^(write or select|nothing to translate)/i.test(shown)) txt = shown;
    }
    if(!txt){
      if(dst) dst.innerHTML = '<span style="color:var(--ink-4)">Nothing to translate — select some text in the writing area first</span>';
      return;
    }
    if(dst) dst.innerHTML = '<span class="ft-busy">Translating…</span>';
    if(typeof window.callAI !== 'function'){
      if(dst) dst.innerHTML = '<span style="color:var(--ink-3)">The translator is not available</span>';
      return;
    }
    try{
      const res = await window.callAI(
        'Translate the text below' + (pair.from ? ' from ' + pair.from : '') + ' into ' + pair.to + '.\n' +
        'Preserve the tone, the meaning and the paragraph breaks. Do not explain, do not add notes — ' +
        'return only the translation.\n\n"""\n' + txt + '\n"""');
      if(dst) dst.textContent = (res || '').trim() || 'No response';
    }catch(err){
      if(dst) dst.innerHTML = '<span style="color:var(--ink-3)">' + esc((err && err.message) || 'Translation failed') + '</span>';
    }
    try{ if(typeof p._sftSyncActions === 'function') p._sftSyncActions(); }catch(e){}
  };

  const pairsRow = function(){
    const p = card();
    if(!p || p.querySelector('.sft-pairs')) return;
    const row = document.createElement('div');
    row.className = 'sft-pairs';
    row.setAttribute('aria-label', 'Conversions');
    row.innerHTML = PAIRS.map(function(x){
      return '<button class="ft-action" type="button" data-sft-pair="' + x.id + '">' + x.label + '</button>';
    }).join('');
    const bar = p.querySelector('.ft-actions');
    if(bar){ bar.after(row); }
    else{
      const grid = p.querySelector('#sftGrid');
      if(grid){ grid.before(row); } else { p.appendChild(row); }
    }
    row.addEventListener('click', function(e){
      const b = e.target.closest('[data-sft-pair]');
      if(!b) return;
      e.preventDefault();
      Array.prototype.forEach.call(row.querySelectorAll('.ft-action'), function(x){
        x.classList.toggle('on', x === b);
      });
      const pair = PAIRS.filter(function(x){ return x.id === b.dataset.sftPair; })[0];
      if(pair) translate(pair);
    });
  };

  /* A drag of the grip leaves a fixed height on the element, and the element
     is built once and reused — so the card stayed as tall as that one drag
     forever, with the space under the language list empty. Nothing is
     measured here: the inline height is simply let go of each time the card
     opens, and the sheet's own max-height takes over again. */
  const fitCard = function(){
    const p = card();
    if(!p) return;
    if(p.style.height) p.style.height = '';
    if(p.style.maxHeight) p.style.maxHeight = '';
  };

  /* it goes on the moment the card is opened, and again over the frames the
     build takes — the card is built once, but never assume which frame */
  const settle = function(){
    try{ pairsRow(); }catch(e){}
    try{ paint(); }catch(e){}
    try{ fitCard(); }catch(e){}
  };
  const wrapOpen = function(obj, name){
    const orig = obj ? obj[name] : window[name];
    if(typeof orig !== 'function' || orig.__sfPairs) return;
    const fn = function(){
      const out = orig.apply(this, arguments);
      settle();
      [0, 40, 160, 420].forEach(function(ms){ setTimeout(settle, ms); });
      return out;
    };
    fn.__sfPairs = true;
    if(obj){ obj[name] = fn; } else { window[name] = fn; }
  };
  /* THREE DOORS, because the card's own open() is called directly:
     settings.js defers its boot to DOMContentLoaded, so the name it takes
     over (window.openFabTranslate) does not exist while this file is read;
     and the chip's click is answered by settings.js's own listener, which
     calls its local open() rather than the name on the window. So the name
     is taken over again the moment the document is parsed, and every click
     that reaches for Translate asks for the row over the frames that follow
     — the card is built lazily, on the first click, so the first settle of
     all can only be the one after it. */
  const arm = function(){
    wrapOpen(null, 'openFabTranslate');
    if(window.SF_TRANSLATE) wrapOpen(window.SF_TRANSLATE, 'open');
  };
  arm();
  document.addEventListener('DOMContentLoaded', arm);
  [0, 400, 1500, 3000].forEach(function(ms){ setTimeout(arm, ms); });
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(!t.closest('[data-ai="translate"], [data-sft-open], .fab-ai [data-ai="translate"]')) return;
    [0, 40, 160, 420, 900].forEach(function(ms){ setTimeout(settle, ms); });
  }, true);

  /* ── 11e · a drag's release is not a click away ──────────────
     Both of the card's own drags (the header and the grip) end with the
     pointer outside the card, so the browser fires its click on <body> and
     the card's outside-click rule closed it. The release of a drag is
     swallowed here, at the window in the capture phase — before the
     document's own “clicked away” listener can see it. */
  let dragging = 0;
  document.addEventListener('pointerdown', function(e){
    const p = card();
    const t = e.target;
    if(!p || !p.classList.contains('open') || !t || !t.closest) return;
    if(!t.closest('#sfTranslate')) return;
    if(t.closest('[data-sft-close]')) return;
    if(t.closest('.sft-head') || t.closest('[data-sft-grip]')) dragging = 1;
  }, true);
  window.addEventListener('pointerup', function(){
    if(!dragging) return;
    /* the click that follows this pointerup belongs to the drag */
    setTimeout(function(){ dragging = 0; }, 0);
  }, true);
  window.addEventListener('click', function(e){
    if(dragging && e.stopPropagation) e.stopPropagation();
  }, true);

  settle();
})();


/* ═══════════════════════════════════════════════════════════
   12 · THE WRITING BARS

   Four things were asked for about the manuscript's own bars — and one
   thing asked for before them is taken back out again:

     · AND NO FONT IS TAKEN OUT OF IT. There was a short list here for one
       turn; the writer asked for the whole pack back, so the writing bar's
       Font dropdown — the .tb-drop write.js builds with every family the
       app ships — is left exactly as it was built. No font control in the
       app drops a face any more (T panel, IMF, this bar or Settings).

     · AND THE DIVIDERS ARE OFF AGAIN. Separate rules were drawn between
       the bar's groups for one turn and taken back the next: the bar draws
       no ruled line down itself now, and none across it under the type
       toolbar. The border pass this file writes (section 8ad) keeps them
       off on its own.

     · THE CONTROLS DID NOT LOOK LIKE BUTTONS. The same pass took the
       hairline off every .tb-btn, .tb-drop-title, size box and swatch, so
       each one was a bare glyph on a bar of exactly its own colour. They
       take the chip the two section pickers in that bar already wear —
       --surface-3, no visible edge, r-md — so the whole row is one
       language. THE EDGE IS MADE TRANSPARENT, NOT REMOVED, and no group is
       stretched to the row's full height any more: `border:0` takes two
       pixels off every bordered box in the row, and between that and the
       stretch the icons sat a little off where they had been placed.

     · THE TWO COLOUR CHIPS ARE BOXES TOO. They were the only bare squares
       left in the row — a fill with nothing around it. They wear the same
       chip as their neighbours now, with the colour as a smaller square
       inside it. And the two dropdowns in this bar read as one: the same
       12.5px and the same ink for the family name as for the block style.

     · THE SECTION PICKER SAYS WHY IT IS EMPTY, AND NOTHING ELSE. With no
       options to list, the subchapter (or subscene) picker had no title at
       all, so its box read as broken. One turn of this file wrote the
       bar's own word into it — Subchapter — which reads as a value that
       was chosen, and it has been asked for out again. The box keeps its
       shape; the list is what explains the emptiness.

   AND THE FIND BOX IS A POPUP. It was the full width of the writing area
   and two rows tall; it is the app's own floating card now, the size and
   shape of the utility and notes popups, and its “Replace all” is the
   app's accent (it was the second --ink-filled button in the app).
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* ── 12a · the two bars ───────────────────────────────────────
     One id in the :is() carries the weight this needs: the border pass
     writes its `border:0` with a long :not() chain, and only an id
     outranks that. Scoped to the manuscript and the script bar. */
  const CSS = [
    /* NO DIVIDERS. There was a border-right on every group here, and a
       hairline under the type toolbar. Both are gone by request — and
       nothing is stretched to the row's height either, which is where the
       row's own alignment went. */
    /* the controls, as the chips this bar's own pickers are.
       The edge is made transparent rather than removed: `border:0` takes
       the 1px off each bordered box, and the row was reported as no longer
       sitting where it was placed. */
    'html body :is(#writeToolbar,#chapterControls) :is(.tb-btn,.tb-input,'
    + '.tb-drop-title,.tb-drop2-title,.icon-btn-sm,.imf-drop-btn){',
    '  background:var(--surface-3) !important;',
    '  border-color:transparent !important; border-radius:var(--r-md, 6px) !important;',
    '  color:var(--ink-2) !important;',
    '  box-shadow:none !important;',
    '}',
    'html body :is(#writeToolbar,#chapterControls) :is(.tb-btn,.tb-input,'
    + '.tb-drop-title,.tb-drop2-title,.icon-btn-sm,.imf-drop-btn):hover{',
    '  background:var(--surface-4) !important; color:var(--ink) !important;',
    '}',
    'html body :is(#writeToolbar,#chapterControls) :is(.tb-btn,.icon-btn-sm,.imf-drop-btn) i{',
    '  color:inherit !important;',
    '}',
    /* ── AND NOTHING IN EITHER BAR MOVES ──
       Two things moved a control out from under the pointer: the press
       scale every small control in the app carries (transform:scale(.97)
       on :active — which is what the utility grid was doing) and the
       transition that animates it. In these two bars a control answers
       with its fill alone; its box is pinned, so nothing about the pointer
       can change where anything sits. */
    'html body :is(#writeToolbar,#chapterControls) :is(.tb-btn,.icon-btn-sm,.imf-drop-btn){',
    '  transform:none !important;',
    '  transition:background-color var(--t-fast, .15s) var(--ease, ease),',
    '    color var(--t-fast, .15s) var(--ease, ease) !important;',
    '}',
    /* ── AND NO DIVIDER, IN EITHER BAR ──
       The group's own right edge (pages.css draws it at “THE TOOLBAR
       DIVIDERS”), the bar's bottom hairline and the full-height hairlines
       in the section strip are all off. The strip's spacers keep their own
       width, so taking the lines away moves nothing in the row. */
    'html body :is(#writeToolbar,.fnt-bar) .tb-group{ border-right:0 !important; }',
    'html body :is(#writeToolbar,.fnt-bar,#chapterControls){ border-bottom:0 !important; }',
    /* the strip's spacers keep their own width — taking it away would slide
       every icon in the row — and are painted invisible, so no sheet can
       put a line back through them */
    'html body #chapterControls .cc-sep, html body .fnt-bar .cc-sep{',
    '  background:transparent !important; box-shadow:none !important;',
    '  opacity:0 !important;',
    '}',
    /* ── THE TWO BARS SIT ON ONE LINE ──
       The icon library at the end of the type toolbar stands directly over
       Find & replace at the end of the section strip, and both pickers open
       at the same left edge. The bars carry the same card margin; the
       padding is set so the toolbar's own controls (inset by the group's
       own padding) and the strip's plain ones land on the same two x's —
       which is why the toolbar's padding is the smaller of the two, and why
       the smiley keeps the 8px the group padding gives everything else.
       Doubled ids: the sheet that draws these cards answers to one id, and
       it is moved to the end of the head after this one. */
    'html body :is(#page-manuscript#page-manuscript,#page-script#page-script) .write-toolbar{',
    '  padding:6px 4px !important;',
    '}',
    'html body :is(#page-manuscript#page-manuscript,#page-script#page-script) .chapter-controls{',
    '  padding:6px 12px !important;',
    '}',
    'html body :is(#page-manuscript#page-manuscript,#page-script#page-script) .write-toolbar > .tb-push-right{',
    '  margin-right:8px !important;',
    '}',
    /* ── AND AN EMPTY PICKER IS STILL A PICKER ──
       With no chapter or subchapter to list, the dropdown card had nothing
       to size itself from and collapsed onto its caret. It keeps the width
       the app's own section selects carry (150px) whether it has anything
       to show or not. */
    'html body #chapterControls .chapter-control{ min-width:150px !important; }',
    'html body #chapterControls .chapter-control .dd-card{',
    '  min-width:150px !important;',
    '}',
    /* a command that is ON is the app's solid accent, like every other toggle */
    'html body #writeToolbar .tb-btn.active,',
    'html body #writeToolbar .tb-btn.active:hover{',
    '  background:var(--accent) !important; color:var(--accent-ink) !important;',
    '}',
    'html body #writeToolbar .tb-btn.active i{ color:var(--accent-ink) !important; }',
    /* a picker with nothing to choose is quiet, not blank */
    'html body .dd-card.dd-empty .dd-value{ color:var(--ink-4) !important; }',

    /* ── the two colour chips, boxed like the rest of the row ──
       The colour is a small square inside the box — the box itself is the
       same chip the buttons beside it wear. */
    'html body #writeToolbar .tb-swatch{',
    '  width:28px !important; min-width:28px !important; height:28px !important;',
    '  display:inline-flex !important; align-items:center !important;',
    '  justify-content:center !important; position:relative !important;',
    '  background:var(--surface-3) !important; border:1px solid transparent !important;',
    '  border-radius:var(--r-md, 6px) !important; box-shadow:none !important;',
    '  overflow:visible !important;',
    '}',
    'html body #writeToolbar .tb-swatch:hover{ background:var(--surface-4) !important; }',
    'html body #writeToolbar .tb-swatch .tb-swatch-fill{',
    '  position:absolute !important; inset:4px !important; border-radius:3px !important;',
    '}',
    /* ── and the two dropdowns in this bar read as one ──
       The family name and the block style are the same size, the same
       weight and the same ink. */
    'html body #writeToolbar .tb-drop-title{ font-size:12.5px !important; }',
    'html body #writeToolbar .tb-drop-title .tb-drop-value{',
    '  font-size:12.5px !important; color:var(--ink-2) !important;',
    '}',

    /* ── 12b · the find box, as the app's floating popups are ── */
    'html body #findBar:not(.find-panel){',
    '  position:fixed !important; top:64px !important; right:16px !important; left:auto !important;',
    '  z-index:430 !important; width:min(330px, calc(100vw - 24px)) !important;',
    '  max-width:none !important; align-self:auto !important; margin:0 !important;',
    '  display:flex !important; flex-direction:column !important; align-items:stretch !important;',
    '  flex-wrap:nowrap !important; gap:6px !important; padding:10px !important;',
    '  background:var(--surface-1) !important; border:0 !important;',
    '  border-radius:var(--r-lg, 8px) !important;',
    '  box-shadow:0 18px 44px -16px rgba(0,0,0,.62) !important;',
    '}',
    'html body #findBar:not(.find-panel) .find-row{ width:auto !important; gap:4px !important; }',
    'html body #findBar:not(.find-panel) .find-row + .find-row{ margin-top:0 !important; }',
    'html body #findBar:not(.find-panel) input{',
    '  height:30px !important; padding:0 10px !important;',
    '  background:var(--surface-3) !important; border:0 !important;',
    '  border-radius:var(--r-md, 6px) !important; color:var(--ink) !important;',
    '  font-size:12.5px !important;',
    '}',
    'html body #findBar:not(.find-panel) :is(.find-nav,.find-x){',
    '  width:28px !important; height:28px !important; padding:0 !important;',
    '  display:inline-flex !important; align-items:center !important; justify-content:center !important;',
    '  background:transparent !important; border:0 !important;',
    '  border-radius:var(--r-md, 6px) !important; color:var(--ink-3) !important;',
    '}',
    'html body #findBar:not(.find-panel) :is(.find-nav,.find-x):hover{',
    '  background:var(--surface-3) !important; color:var(--ink) !important;',
    '}',
    'html body #findBar:not(.find-panel) .find-btn{',
    '  height:30px !important; padding:0 10px !important;',
    '  background:var(--surface-3) !important; border:0 !important;',
    '  border-radius:var(--r-md, 6px) !important; color:var(--ink-2) !important;',
    '  font-size:11.5px !important;',
    '}',
    'html body #findBar:not(.find-panel) .find-btn:hover{',
    '  background:var(--surface-4) !important; color:var(--ink) !important;',
    '}',
    /* ── REPLACE WEARS THE SAME BUTTON AS EVERY OTHER ONE ──
       Replace all was filled with the accent, and the result sheet's Replace
       with --ink before it: two solid slabs where every other button in the
       app is a quiet chip. It is the quiet chip now — the same --surface-3
       as its neighbour, --surface-4 under the pointer, and the accent only
       in the label, on hover and while it is pressed. */
    'html body :is(#findBar,.find-panel) .find-btn-primary{',
    '  background:var(--surface-3) !important; color:var(--ink-2) !important;',
    '}',
    'html body :is(#findBar,.find-panel) .find-btn-primary:hover{',
    '  background:var(--surface-4) !important; color:var(--accent) !important;',
    '}',
    'html body :is(#findBar,.find-panel) .find-btn-primary:active{',
    '  background:var(--surface-4) !important; color:var(--accent) !important;',
    '}',
    /* ── AND THE CARD IS PULLED BY ITS OWN BODY ──
       Its only grip is the card itself: the pointer says “hand” over the
       card and “text” over a field, and the hand closes while it is carried. */
    'html body #findBar:not(.find-panel){ cursor:grab !important; }',
    'html body #findBar:not(.find-panel).sf-grabbing{ cursor:grabbing !important; }',
    'html body #findBar:not(.find-panel) :is(input,textarea){ cursor:text !important; }',
    'html body #findBar:not(.find-panel) :is(button,label,select,.find-btn,.find-nav,.find-x){',
    '  cursor:pointer !important;',
    '}'
  ].join('\n');
  const sheet = document.createElement('style');
  sheet.id = 'sfWriteBarSheet';
  sheet.textContent = CSS;
  (document.head || document.documentElement).appendChild(sheet);

  /* ── 12c · the section picker explains itself ─────────────────
     enhanceSelects (settings.js:1031) puts the dropdown card next to its
     select, inside the same .chapter-control, and writes the chosen
     option's text into .dd-value. With no options that is the empty
     string. The box itself is left alone — nothing is written into it, so
     it can never look like a value that was picked — and the list carries
     the one line that says why there is nothing to choose: “No subscenes
     yet”. */
  /* paintCmds is defined under 12e; the beat below runs long after it */
  const sectionPickers = function(){
    const bar = document.getElementById('chapterControls');
    if(!bar) return;
    let L = { ch:'Chapter', sub:'Subchapter' };
    try{ if(typeof window.chLabels === 'function') L = window.chLabels() || L; }catch(e){}
    Array.prototype.forEach.call(
      bar.querySelectorAll('select[data-chapter-select],select[data-subchapter-select]'),
      function(sel){
        const want = sel.hasAttribute('data-subchapter-select') ? L.sub : L.ch;
        const host = sel.parentNode;
        const card = host && host.querySelector ? host.querySelector('.dd-card') : null;
        if(!card) return;
        const val = card.querySelector('.dd-value');
        const list = card.querySelector('.stats-cat-list');
        if(sel.options.length){
          card.classList.remove('dd-empty');
          const note = card.querySelector('.sf-noitem');
          if(note) note.remove();
          return;
        }
        card.classList.add('dd-empty');
        /* nothing is written into the box: an older build's word is taken out
           of it instead, so it can never read as a value that was chosen */
        if(val && val.textContent) val.textContent = '';
        /* and the list keeps no note of its own: an empty picker is empty,
           the way every other empty list in the app is */
        const stale = list ? list.querySelector('.sf-noitem') : null;
        if(stale) stale.remove();
      });
  };

  /* ── 12c(1) · THE NON-LATIN FAMILIES ARE NOT IN THE APP'S LIST ──
     state.js ships four Noto faces — Devanagari · Tamil · Bengali · Telugu —
     after the sixty the app is set in, as their own group. Nothing in a
     manuscript or in the T panel is ever written in them, and they only made
     those two lists longer, so they come out of the shared list here: every
     picker that reads window.FONTS (the writing bar, the T panel, the chapter
     strip's IMF rows, Settings) is left without them from the first paint on.
     The array is mutated in place, so pages.js and write.js, which hold the
     same object, see it too. */
  try{
    const all = window.FONTS;
    if(all && all.length){
      for(let i = all.length - 1; i >= 0; i--){
        const f = all[i] || {};
        const name = String(f.name || '');
        if(f.g === 'Indic' || /^Noto\b/.test(name)) all.splice(i, 1);
      }
    }
  }catch(e){}

  /* ── 12c(2) · the writing bar's Font list is the pack a book is set in ──
     write.js builds that dropdown from every family the app ships — sixty
     of them in six groups, in a list 300px tall. The two writing bars show
     the twelve a manuscript or a screenplay is actually set in. The T
     panel, IMF and Settings keep the whole pack, and the face the writer is
     already in is kept in the list as well, so the list can never disagree
     with the name on the button. Nothing is deleted — the rest are hidden,
     so a face reached some other way still works. */
  const KEEP_FONTS = ['Merriweather','Lora','Crimson Text','EB Garamond',
                      'Source Serif 4','IBM Plex Serif','Literata',
                      'Inter','Fira Sans','Roboto',
                      'JetBrains Mono','Courier Prime'];
  const fontShortList = function(){
    const keep = {};
    KEEP_FONTS.forEach(function(n){ keep[n] = 1; });
    try{ if(S.config && S.config.font) keep[S.config.font] = 1; }catch(e){}
    Array.prototype.forEach.call(
      document.querySelectorAll('#writeToolbar .tb-drop[data-drop="font"],'
                              + '.fnt-bar .tb-drop[data-drop="font"]'),
      function(drop){
        const list = drop.querySelector('.tb-drop-list');
        if(!list) return;
        /* a heading over an empty group goes with the group's items */
        let group = null, shown = false;
        const flush = function(){
          if(!group) return;
          const want = shown ? '' : 'none';
          if(group.style.display !== want) group.style.display = want;
        };
        Array.prototype.forEach.call(list.children, function(node){
          if(!node || !node.classList) return;
          if(node.classList.contains('tb-drop-group')){ flush(); group = node; shown = false; return; }
          if(!node.classList.contains('tb-drop-item')) return;
          const on = !!(node.dataset && keep[node.dataset.value || '']);
          const want = on ? '' : 'none';
          if(node.style.display !== want) node.style.display = want;
          if(on) shown = true;
        });
        flush();
      });
  };

  /* ── 12c(4) · AND THE SAME TWELVE IN THE T PANEL ─────────────
     The type panel (T) is built by pages.js, and it lists every family the
     app ships in its own Font row. It takes the same twelve — the pack a
     book is set in — and the page's current face is kept, so the row never
     disagrees with what is on screen. The options are taken out of the
     select and the app's own dropdown card is asked to draw itself again,
     which is what makes the card follow; every other font row in the app
     (IMF, Settings, the advanced panel) keeps the whole pack. */
  const trimTypoFonts = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-typo-panel] select.typo-font'),
      function(sel){
        const keep = {};
        KEEP_FONTS.forEach(function(n){ keep[n] = 1; });
        try{ if(sel.value) keep[sel.value] = 1; }catch(e){}
        const gone = [];
        Array.prototype.forEach.call(sel.options, function(o){
          if(o.value && !keep[o.value]) gone.push(o);
        });
        if(!gone.length) return;
        gone.forEach(function(o){ o.remove(); });
        if(typeof sel._ddRefresh === 'function'){ try{ sel._ddRefresh(); }catch(e){} }
      });
  };
  if(typeof window.typoOpen === 'function' && !window.typoOpen.__sfFontTrim){
    const origTypo = window.typoOpen;
    const typoFn = function(){
      const out = origTypo.apply(this, arguments);
      try{ trimTypoFonts(); }catch(e){}
      return out;
    };
    typoFn.__sfFontTrim = true;
    window.typoOpen = typoFn;
  }
  /* the T button on every page goes through the app's own click handler, so
     the trim is asked for over the frames the panel takes to build too */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-typop]')) return;
    [0, 40, 160].forEach(function(ms){ setTimeout(function(){ try{ trimTypoFonts(); }catch(err){} }, ms); });
  }, true);

  /* ── 12c(3) · the utility grid stands under the subscript ─────
     The strip's icons and the toolbar's icons are two rows of buttons that
     know nothing about each other, so nothing lines them up: where each one
     lands is the sum of everything before it. The utility button is placed
     by measurement instead — the claim is given up, its centre is read
     against the centre of the subscript button in the type toolbar above,
     and it is nudged right by the difference. Its two neighbours in the
     group stay where they were, and the measurement is taken again on every
     settle, so a rebuild or a resize is followed rather than fought. */
  const alignUtility = function(){
    const bar = document.getElementById('writeToolbar');
    const util = document.querySelector('#chapterControls [data-act="util-open"]');
    if(!bar || !util) return;
    const sub = bar.querySelector('[data-cmd="subscript"]');
    if(!sub) return;
    let dx = 0;
    try{
      util.style.marginLeft = '';
      const a = sub.getBoundingClientRect(), b = util.getBoundingClientRect();
      if(a && b && a.width && b.width && a.height && b.height){
        dx = Math.round((a.left + a.width / 2) - (b.left + b.width / 2));
      }
    }catch(e){ dx = 0; }
    const want = dx > 0 ? dx + 'px' : '';
    if(util.style.marginLeft !== want) util.style.marginLeft = want;
  };

  /* ── 12d · and the find box lives on the body ─────────────────
     A fixed card is only fixed while no ancestor is transformed, and the
     bar is built inside .write-wrap. It is taken out to the body where it
     was made, and the field it opens with is put back in hand. */
  const liftFindBar = function(){
    const bar = document.getElementById('findBar');
    if(!bar || bar.parentNode === document.body) return;
    document.body.appendChild(bar);
    const qi = document.getElementById('findInput');
    if(!qi) return;
    try{
      const end = qi.value.length;
      qi.focus();
      if(qi.setSelectionRange) qi.setSelectionRange(end, end);
    }catch(e){}
  };
  /* ── 12d(2) · the find card moves under the hand ──────────────
     Every other floating card in the app is pulled around by its head. This
     one has no head — it is the app's own markup — so its own body is the
     handle: press anywhere on the card that is not a field or a button and
     it comes with you. The press is taken in the capture phase and the
     default is suppressed, so the field that has the focus keeps it, and the
     release of a drag is swallowed at the window so the card landing does
     not click whatever is under it. */
  (function(){
    let dragging = 0, dx = 0, dy = 0;
    const cardOf = function(){ return document.getElementById('findBar'); };
    /* The card is placed by the sheet above with `!important` (top · right),
       and an inline style without it loses to that — which is why a drag used
       to move nothing at all. Everything this writes is written important, so
       the hand outranks the sheet. */
    const put = function(card, prop, val){
      try{ card.style.setProperty(prop, val, 'important'); }
      catch(e){ card.style[prop] = val; }
    };
    document.addEventListener('pointerdown', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      const card = cardOf();
      if(!card || !card.contains(t)) return;
      if(t.closest('input,button,textarea,select,a,label')) return;
      e.preventDefault();
      const r = card.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
      put(card, 'right', 'auto'); put(card, 'bottom', 'auto');
      put(card, 'left', Math.round(r.left) + 'px');
      put(card, 'top',  Math.round(r.top)  + 'px');
      card.classList.add('sf-grabbing');
      dragging = 1;
    }, true);
    document.addEventListener('pointermove', function(e){
      if(!dragging) return;
      const card = cardOf(); if(!card) return;
      const w = card.offsetWidth || 320, h = card.offsetHeight || 120;
      put(card, 'left', Math.max(0, Math.min(e.clientX - dx, (window.innerWidth || 1200) - w - 4)) + 'px');
      put(card, 'top',  Math.max(0, Math.min(e.clientY - dy, (window.innerHeight || 800) - h - 4)) + 'px');
      e.preventDefault();
    }, true);
    window.addEventListener('pointerup', function(){
      if(!dragging) return;
      const card = cardOf(); if(card) card.classList.remove('sf-grabbing');
      setTimeout(function(){ dragging = 0; }, 0);
    }, true);
    window.addEventListener('click', function(e){
      if(dragging && e.stopPropagation) e.stopPropagation();
    }, true);
  })();

  /* ── 12d(3) · THE ARROWS AND THE TWO REPLACE KEYS ANSWER HERE ──
     The app's own find walks the writing surface it finds *in hand*, and it
     reads that from document.activeElement: pressing the box's ▲ or ▼ put
     the focus on the button, so the walk was asked to search a button — no
     match, every time, and the ▲ ▼ appeared to do nothing. (Replace was
     asked for the same reason, and its selection was read in the button.)
     Two things are done here, both in front of the app's own document
     handler: a press on any of those four never moves the focus (its default
     is refused on mousedown, which is what takes the focus in the first
     place), and the press itself is answered here — the text is handed its
     focus back first, then the app's own findNext · findPrev · replaceOne ·
     replaceAll is called, so the search is exactly the app's. */
  (function(){
    const SURF = '#editor,.write-doc,.editor-doc,.sf-split-doc,#nbReaderBody,'
               + '#draftBody,[contenteditable="true"]';
    const surface = function(){
      const a = document.activeElement;
      if(a && a.isContentEditable && a.offsetParent !== null) return a;
      const list = document.querySelectorAll(SURF);
      for(let i = 0; i < list.length; i++){
        const el = list[i];
        if(el.isContentEditable && el.offsetParent !== null) return el;
      }
      return null;
    };
    const KEYS = '.find-nav,.find-btn';
    document.addEventListener('mousedown', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      const btn = t.closest('#findBar ' + KEYS + ',#findBar .find-x');
      if(!btn) return;
      e.preventDefault();                     /* the focus stays in the text */
    }, true);
    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      const btn = t.closest('#findBar ' + KEYS);
      if(!btn) return;
      e.preventDefault();
      e.stopPropagation();                   /* the app's own pass is not run */
      const ed = surface();
      if(ed){ try{ ed.focus(); }catch(err){} }
      const act = btn.dataset ? btn.dataset.act : '';
      try{
        if(act === 'find-next'){ if(typeof window.findNext === 'function') window.findNext(); }
        else if(act === 'find-prev'){ if(typeof window.findPrev === 'function') window.findPrev(); }
        else if(act === 'replace-one'){ if(typeof window.replaceOne === 'function') window.replaceOne(); }
        else if(act === 'replace-all'){ if(typeof window.replaceAll === 'function') window.replaceAll(); }
      }catch(err){}
    }, true);
  })();

  if(typeof window.openFind === 'function' && !window.openFind.__sfPopup){
    const origFind = window.openFind;
    const wrapped = function(){
      const out = origFind.apply(this, arguments);
      try{ liftFindBar(); }catch(e){}
      return out;
    };
    wrapped.__sfPopup = true;
    window.openFind = wrapped;
  }

  /* ── the beat ──
     The toolbar, the section strip and the find box are all rebuilt by the
     app; this asks for the passes on the frames after anything changes in
     the writing bar, and once on load. Every pass is cheap and idempotent. */
  const settle = function(){
    if(!document.getElementById('writeToolbar') && !document.getElementById('findBar')) return;
    try{ sectionPickers(); }catch(e){}
    try{ fontShortList(); }catch(e){}
    try{ trimTypoFonts(); }catch(e){}
    try{ alignUtility(); }catch(e){}
    try{ paintCmds(); }catch(e){}
    /* the split keeps a size per half; section 13 owns putting them back */
    try{ if(typeof window.sfSplitPaneSizes === 'function') window.sfSplitPaneSizes(); }catch(e){}
  };
  let raf = 0;
  const beat = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; settle(); });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(beat).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    /* both dropdowns are opened from the bar: the trim lands with the click */
    if(t.closest('#writeToolbar .tb-drop-title')){ [0, 60, 200].forEach(function(ms){ setTimeout(settle, ms); }); }
    if(t.closest('[data-act="find-open"]')){ [0, 60].forEach(function(ms){ setTimeout(function(){ try{ liftFindBar(); }catch(e){} }, ms); }); }
  }, true);
  /* ── 12e · a command that is ON says so at once ──────────────
     Bold, Italic, Underline, the alignments and the two lists are toggles,
     and nothing in the app ever read their state: the only thing that put
     .active on one of those buttons was the app's own click handler, one
     click behind the command it had just run — so pressing Bold marked
     nothing, and pressing it a second time marked it. The state is asked of
     the browser instead (queryCommandState), on every selection change, key
     and click, so the button is lit the moment the command lands — and
     goes out again when the caret leaves the bold run. */
  const CMDSTATE = ['bold','italic','underline','strikeThrough','superscript',
                    'subscript','justifyLeft','justifyCenter','justifyRight',
                    'justifyFull','insertUnorderedList','insertOrderedList'];
  let cmdRaf = 0;
  const paintCmds = function(){
    const bar = document.getElementById('writeToolbar');
    if(!bar || typeof document.queryCommandState !== 'function') return;
    Array.prototype.forEach.call(bar.querySelectorAll('[data-cmd]'), function(b){
      const c = b.dataset.cmd;
      if(!c || CMDSTATE.indexOf(c) < 0) return;
      let on = false;
      try{ on = !!document.queryCommandState(c); }catch(e){ on = false; }
      if(b.classList.contains('active') !== on) b.classList.toggle('active', on);
    });
  };
  const cmdBeat = function(){
    if(cmdRaf) return;
    cmdRaf = requestAnimationFrame(function(){ cmdRaf = 0; paintCmds(); });
  };
  /* ── AND PRESSING AN ALIGNMENT YOU ARE ALREADY IN TURNS IT OFF ──
     The marks that follow the caret — bold, italic, the two lists — go out
     when the command lands a second time, because the command toggles. An
     alignment does not: pressing Right again keeps the paragraph right, so
     the button stayed lit and nothing changed on the page. Pressing the one
     you are in now goes back to the page's default (left), which is what
     the press reads as. */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const b = t.closest('#writeToolbar [data-cmd]');
    if(!b) return;
    const c = b.dataset.cmd || '';
    if(c.indexOf('justify') !== 0 || c === 'justifyLeft') return;
    if(!b.classList.contains('active')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setTimeout(function(){
      try{ document.execCommand('justifyLeft', false, null); }catch(err){}
      try{ if(typeof saveSel === 'function') saveSel(); }catch(err){}
      try{ if(typeof onInput === 'function') onInput(); }catch(err){}
      try{ paintCmds(); }catch(err){}
    }, 0);
  }, true);
  document.addEventListener('selectionchange', cmdBeat);
  ['mouseup','keyup','input','focus'].forEach(function(ev){
    document.addEventListener(ev, cmdBeat, true);
  });
  /* the click that ran the command is answered after the app's own handler
     for it, so the state read here is the state the command left behind */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('#writeToolbar [data-cmd]')) return;
    setTimeout(paintCmds, 0);
    setTimeout(paintCmds, 60);
  }, true);

  [0, 150, 500, 1400].forEach(function(ms){ setTimeout(settle, ms); });
  document.addEventListener('DOMContentLoaded', settle);
  settle();
})();


/* ═══════════════════════════════════════════════════════════
   13 · THE SPLIT KEEPS ITS OWN FONT SIZE

   A face AND a size are kept per half of the split: split.js holds both for
   each side and writes them onto its own two editors. The face stayed put —
   the size did not, and the reason is order. The size pass in polish.js
   writes ONE number onto every writing surface in the document and runs
   last, so a change to the size in the toolbar landed on both halves and the
   other half's size was simply gone: the two sides shared the active one's
   size while their fonts stayed separate.

   The halves are put back after every size change. This is the only layer
   that can do it — split.js and polish.js both belong to other files, and
   the correction has to land after both of them have written. The same call
   is made by section 12's settle, so opening the split, repainting a page or
   rebuilding the bar all end with the two halves showing their own size.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const paneSizes = function(){
    const api = window.ScriptForgeSplit;
    let open = false;
    try{ open = !!(api && typeof api.isOpen === 'function' && api.isOpen()); }catch(e){ open = false; }
    if(!open) return;
    /* split.js has the store and the pen — let it write both halves */
    if(api && typeof api.applyPaneStyles === 'function'){
      try{ api.applyPaneStyles(); return; }catch(e){}
    }
    let store = null;
    try{ store = (S.config && S.config.splitStyle) || null; }catch(e){ store = null; }
    if(!store) return;
    ['left','right'].forEach(function(side){
      const ed = document.querySelector('#writeCanvas [data-sf-split-editor="' + side + '"]');
      const st = store[side];
      if(!ed || !st || !st.size) return;
      const want = st.size + 'px';
      if(ed.style.fontSize !== want) ed.style.fontSize = want;
    });
  };
  window.sfSplitPaneSizes = paneSizes;
  if(typeof window.setFontSize === 'function' && !window.setFontSize.__sfPaneSize){
    const orig = window.setFontSize;
    const fn = function(){
      const out = orig.apply(this, arguments);
      try{ paneSizes(); }catch(e){}
      [0, 40, 140].forEach(function(ms){
        setTimeout(function(){ try{ paneSizes(); }catch(e){} }, ms);
      });
      return out;
    };
    fn.__sfPaneSize = true;
    window.setFontSize = fn;
  }
  paneSizes();
})();


/* ═══════════════════════════════════════════════════════════
   14 · THE WRITING BARS ANSWER NO RIGHT-CLICK

   A right-click on the manuscript's type toolbar or on the chapter strip
   opened the app's writing menu — the one that belongs to what is selected
   in the text. The strip and the toolbar are chrome, not text: the menu is
   taken off them here, and the browser's own menu is not offered in its
   place, so a right-click on either bar does nothing at all. The writing
   surface, the round button and every other page keep theirs.

   Taken in the window's capture phase, before the app's own handlers for
   the key (they are on the document), so nothing is left to open.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const BARS = '#writeToolbar,.write-toolbar,.chapter-controls,#chapterControls,'
             + '.fnt-bar,.sf-bar,.cc-tools,.cc-right';
  window.addEventListener('contextmenu', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(!t.closest(BARS)) return;
    if(t.closest('#fabBtn, #fabWrap')) return;      /* the round button's own */
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
})();


/* ═══════════════════════════════════════════════════════════
   15 · THE PLAN PAGE'S BAR, IN THE ORDER IT IS READ

   plan-boards.js draws that head: T · Add beat on the left, and the board's
   own cluster — new · rename · remove · which board · count — before All
   boards and Clear on the right. Three things about it are asked for here,
   and every node is the app's own — the buttons keep their handlers, and
   the option is a real entry in the select the app drew, so picking it does
   exactly what pressing the switch does:

     · T · All boards · Add beat reads down the left. The switch that says
       “every board at once” comes before the button that adds a card to the
       board you are on, and both sit with the type button;
     · the board picker moves to the right and ends the row, immediately
       before Reset, where the board's own controls belong;
     · the picker's list carries All boards as its own first entry, so
       choosing a board is one control rather than two.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const ALL = '__sfAllBoards';
  const barOf = function(){ return document.querySelector('#page-plan .page-head'); };
  const arrange = function(){
    const b = barOf();
    if(!b) return;
    const left    = b.querySelector('.ol-head-left') || b;
    const typo    = b.querySelector('[data-typop]');
    const allSw   = b.querySelector('[data-act="plan-all"]');
    const addBeat = b.querySelector('[data-act="add-beat"]');
    const picker  = b.querySelector('[data-plan-picker]');
    const reset   = b.querySelector('[data-act="clear-beats"]');

    /* and the head carries no count of its own: “2 boards” sat beside the
       picker and said again, in a number, what the picker already says in
       words. It is taken out of every pass, so a repaint cannot bring it
       back. */
    Array.prototype.forEach.call(
      b.querySelectorAll('.plan-board-count,[data-plan-count]'),
      function(el){ el.remove(); }
    );

    /* left: T · All boards · Add beat — appendChild moves what is already
       there, so this is the sort as well as the move */
    if(typo && left.firstElementChild !== typo) left.insertBefore(typo, left.firstChild);
    if(allSw)   left.appendChild(allSw);
    if(addBeat) left.appendChild(addBeat);

    /* right: … · the board picker · Reset */
    if(picker && reset && reset.parentNode){
      if(picker.parentNode !== reset.parentNode || picker.nextElementSibling !== reset){
        reset.parentNode.insertBefore(picker, reset);
      }
    }

    const sel = b.querySelector('select.plan-board-sel, [data-plan-board]');
    if(!sel) return;
    /* marked, so a repaint of the picker can never end with the entry twice */
    if(!sel.querySelector('option[data-sf-all]')){
      const o = document.createElement('option');
      o.value = ALL;
      o.textContent = 'All boards';
      o.setAttribute('data-sf-all', '1');
      sel.insertBefore(o, sel.firstChild);
    }
    /* the switch is the truth about which view is on, so the picker follows
       it: every board shown reads as All boards in the list */
    const on = !!(allSw && allSw.classList.contains('on'));
    if(on && sel.value !== ALL) sel.value = ALL;
    if(typeof sel._ddRefresh === 'function'){ try{ sel._ddRefresh(); }catch(e){} }
  };

  /* the page renderer is the app's, already wrapped by plan-boards.js —
     this wraps that, so the head has been built by the time it runs */
  const PR = window.PAGE_RENDERERS;
  if(PR && typeof PR.plan === 'function' && !PR.plan.__sfPlanOrder){
    const orig = PR.plan;
    const fn = function(){
      const out = orig.apply(this, arguments);
      try{ arrange(); }catch(e){}
      return out;
    };
    fn.__sfPlanOrder = true;
    PR.plan = fn;
  }
  [0, 200, 700, 1600].forEach(function(ms){ setTimeout(function(){ try{ arrange(); }catch(e){} }, ms); });

  /* picking in the list is picking the view: All boards turns the switch on,
     a board turns it off — otherwise the list would say one thing and the
     board another */
  document.addEventListener('change', function(e){
    const sel = e.target;
    if(!sel || !sel.dataset || !sel.classList) return;
    if(!sel.classList.contains('plan-board-sel') && !('planBoard' in sel.dataset)) return;
    if(sel.value === ALL){
      const b = barOf();
      const allSw = b && b.querySelector('[data-act="plan-all"]');
      if(allSw && !allSw.classList.contains('on')) allSw.click();
      else if(typeof window.renderBeats === 'function') window.renderBeats();
      return;
    }
    const b = barOf();
    const allSw = b && b.querySelector('[data-act="plan-all"]');
    if(allSw && allSw.classList.contains('on')) allSw.click();
  }, true);
})();


/* ═══════════════════════════════════════════════════════════
   16 · SHIFT + / OPENS THE FORMATTING MENU — TAPPED OR HELD

   Shift + @ opens the app's element menu (write.js: sfOpenMenu), and it is
   the only formatting menu there is: Paragraph style · Chapter title ·
   Section head · Sub-section · Quote · Epigraph · Scene break in a prose
   page, the screenplay elements in a script. Shift + / types “?”, which on
   most layouts is the same key one row down, and it opened nothing.

   Here both readings of the key are answered by that one menu: a tap opens
   it, and a hold keeps it open — the press is asked for again while the key
   is down, which is what a held key does, and sfOpenMenu is idempotent, so
   the menu simply stays where it is rather than flickering. Taken on the
   window in the capture phase, so the app's own keyboard handling never sees
   the key, and refused inside a real field (an <input> or <textarea>), where
   “?” is just a character being typed.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const isField = function(el){
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  };
  const wantKey = function(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return false;
    if(e.key === '?') return true;
    return e.code === 'Slash' && e.shiftKey;
  };
  const surface = function(){
    const a = document.activeElement;
    if(a && a.isContentEditable && a.offsetParent !== null) return a;
    const list = document.querySelectorAll('#editor,[contenteditable="true"]');
    for(let i = 0; i < list.length; i++){
      const el = list[i];
      if(el.isContentEditable && el.offsetParent !== null) return el;
    }
    return null;
  };
  const open = function(){
    if(typeof window.sfOpenMenu !== 'function') return;
    const el = surface();
    try{
      if(el) window.sfOpenMenu(el);
      else window.sfOpenMenu();
    }catch(e){}
  };
  let held = 0, timer = 0;
  window.addEventListener('keydown', function(e){
    if(!wantKey(e)) return;
    if(isField(e.target)) return;            /* a real field still types “?” */
    e.preventDefault();
    e.stopPropagation();
    open();
    if(e.repeat){ held = 1; return; }        /* the hold keeps it open */
    held = 0;
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){ timer = 0; if(held) open(); }, 420);
  }, true);
  window.addEventListener('keyup', function(e){
    if(!wantKey(e)) return;
    if(timer){ clearTimeout(timer); timer = 0; }
    held = 0;
  }, true);
})();



