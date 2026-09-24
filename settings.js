/* ═══════════════════════════════════════════════════════════
   settings.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · settings.js
     · panels.js
     · motion.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ settings.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Settings
   Modal settings · Per-mode format page
   ═══════════════════════════════════════════════════════════ */

/* ── merged in from themepack.js ──
   It used to be its own file, loaded right after state.js; it lives here
   now, ahead of everything in this file, because the palettes it adds and
   the mode it pins have to exist before Settings paints a theme. */
/* ═══════════════════════════════════════════════════════════
   THEME PACK — twelve palettes, and every one of them dark

   state.js ships nine. This file adds three more — Plum, Rosewood and
   Lagoon — in the same shape as the rest: one full token set, applied
   inline. A theme here is a palette, written out, and nothing else.

   ── NO LIGHT MODE, AND NOTHING DERIVED FROM A THEME ──
   Light mode used to be a second palette worked out from each dark one:
   same hue, surfaces flipped, the ink read down from the paper, the
   accent darkened until it read as ink. That derivation is gone, at both
   ends. The app has one mode and it is dark (final-fix.js pins it), and
   no theme is built from another any more.

   It is worth saying why, because a derived palette sounded like a
   bargain. A theme that only exists as a transformation of a different
   theme can never be tuned: change the dark palette and the light one
   moves, and there is no number to edit for the one that looks wrong.
   Worse, the two never quite match — a derived light page reads as a
   washed copy of the dark theme it came from, which is exactly what a
   picker full of themes is supposed to stop feeling like. So every theme
   is its own numbers, and the tile you see is the palette you get.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof THEMES === 'undefined' || !Array.isArray(THEMES)) return;

  /* ── 1 · Plum — the ninth palette ── */
  if(!THEMES.some(function(t){ return t.id === 'plum'; })){
    THEMES.push({
      id:'plum', name:'Plum', c1:'#151120', c2:'#c9b6ff', dark:true,
      note:'Soft violet dark — quiet, creative',
      palette:{
        bg:'#151120', s1:'#1c1729', s2:'#231d33', s3:'#2b243d', s4:'#342c49', s5:'#3f3557',
        ov:'rgba(201,182,255,.05)', ovs:'rgba(201,182,255,.09)',
        ink:'#ded8ee', ink2:'#b8b0cf', ink3:'#948cae', ink4:'#756d8c',
        line:'#2a2438', line2:'#372f49', line3:'#473d5d',
        acc:'#c9b6ff', acc2:'#a893f0', accInk:'#151120',
        accSoft:'rgba(201,182,255,.10)', accLine:'rgba(201,182,255,.28)',
        grad:'linear-gradient(135deg,#c9b6ff 0%,#8f78d8 100%)',
        docBg:'#1a1526', docInk:'#d6cfe8', caret:'#c9b6ff', sel:'#c9b6ff', selInk:'#151120'
      }
    });
  }

  /* ── 2 · Rosewood and Lagoon — the two more ──
     The picker had no rose and no true teal, so the warm-pink and
     cool-green sides of the wheel get a theme each. Same shape as every
     other theme — one full token set, applied inline. */
  if(!THEMES.some(function(t){ return t.id === 'rosewood'; })){
    THEMES.push({
      id:'rosewood', name:'Rosewood', c1:'#1a1013', c2:'#e8a7b0', dark:true,
      note:'Rose dark — dusty pink on deep maroon',
      palette:{
        bg:'#1a1013', s1:'#221619', s2:'#2a1c20', s3:'#332327', s4:'#3d2b30', s5:'#49353b',
        ov:'rgba(232,167,176,.05)', ovs:'rgba(232,167,176,.09)',
        ink:'#ecdfe2', ink2:'#c9b2b7', ink3:'#a08a8f', ink4:'#7c686d',
        line:'#2b1d21', line2:'#39272c', line3:'#4a343a',
        acc:'#e8a7b0', acc2:'#c97f8c', accInk:'#1a1013',
        accSoft:'rgba(232,167,176,.10)', accLine:'rgba(232,167,176,.28)',
        grad:'linear-gradient(135deg,#e8a7b0 0%,#b56274 100%)',
        docBg:'#1f1317', docInk:'#e3d4d8', caret:'#e8a7b0', sel:'#e8a7b0', selInk:'#1a1013'
      }
    });
  }
  if(!THEMES.some(function(t){ return t.id === 'lagoon'; })){
    THEMES.push({
      id:'lagoon', name:'Lagoon', c1:'#0b1618', c2:'#7fd8c8', dark:true,
      note:'Teal dark — cool water, soft cyan accent',
      palette:{
        bg:'#0b1618', s1:'#101d1f', s2:'#152427', s3:'#1b2d30', s4:'#22383c', s5:'#2c464a',
        ov:'rgba(127,216,200,.05)', ovs:'rgba(127,216,200,.09)',
        ink:'#d9e7e4', ink2:'#a9c0bc', ink3:'#7f9a96', ink4:'#5d7572',
        line:'#172527', line2:'#1f3033', line3:'#2b4044',
        acc:'#7fd8c8', acc2:'#4fb3a4', accInk:'#08191a',
        accSoft:'rgba(127,216,200,.10)', accLine:'rgba(127,216,200,.28)',
        grad:'linear-gradient(135deg,#7fd8c8 0%,#3d8e85 100%)',
        docBg:'#0e1b1d', docInk:'#d0e0dd', caret:'#7fd8c8', sel:'#7fd8c8', selInk:'#08191a'
      }
    });
  }

  /* ── 3 · the mode: one, and it is dark ──
     These two answer the questions the rest of the app asks about the
     mode. They answer with the only answer there is, so a caller that
     asks “is this light?” gets a plain no instead of a palette that would
     have to be mixed on the spot. */
  window.sfThemeMode = function(){ return 'dark'; };
  window.sfThemeIsLight = function(){ return false; };

  /* the swatch a theme tile shows: that theme's own two colours */
  window.sfThemeSwatch = function(t){
    if(!t) return { c1:'#333', c2:'#888' };
    return { c1:t.c1, c2:t.c2 };
  };

  /* the theme that should be painted right now */
  window.sfActiveTheme = function(){
    const id = (typeof S !== 'undefined' && S.config && S.config.theme) || 'night';
    return themeById(id);
  };

  window.setThemeMode = function(){
    if(typeof S !== 'undefined' && !S.config) S.config = {};
    try{ S.config.themeMode = 'dark'; }catch(e){}
    const want = (typeof S !== 'undefined' && S.config && S.config.theme) || 'night';
    if(typeof save === 'function') save();
    if(typeof applyThemeVars === 'function') applyThemeVars(want);
    return want;
  };

  /* ── 4 · painting ──
     themeTokens is state.js's own: every palette in the app is a dark one,
     so there is nothing left to resolve or to mix. This only records the
     mode the app is actually in — `data-theme-mode`, and colorScheme, the
     two things the sheets and the scrollbars read. */
  const origApply = window.applyThemeVars;
  window.applyThemeVars = function(){
    const t = origApply.apply(this, arguments);
    const html = document.documentElement, body = document.body;
    try{
      html.style.colorScheme = 'dark';
      body.style.colorScheme = 'dark';
      body.setAttribute('data-theme-mode', 'dark');
    }catch(e){}
    return t;
  };
})();

/* ═══════════════════════════════════════════════════════════
   Four blocks that used to be four files of their own —
   translate.js, trim.js, styles-pack.js and ui-font.js.

   All four are jobs about Settings: the theme marks Settings stamps, the
   interface size Settings sets, the language card the writing bar opens,
   the buttons Settings took away. They are kept here now, in the order
   they used to load in, and index.html carries no <script> tag for any of
   them any more.

   Only translate's moment of starting changed: it used to load after
   app.js, and app.js declares a plain openFabTranslate of its own, so that
   block waits for the document to finish parsing before it takes the name.
   The other three only stamp marks, walk stylesheets and wrap the app's
   own functions, so they do their work here, as the file is read.
   ═══════════════════════════════════════════════════════════ */

/* ── merged in from translate.js ── */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Translate

   The translator used to draw itself inside the FAB's right-click
   card, which scrolls and clips — so it looked like nothing happened
   when you clicked Translate.

   This one is its own floating card beside the FAB. Clicking
   Translate in that menu (or the Translate chip anywhere) opens it,
   with English ↔ हिन्दी as the first two buttons and the whole
   language grid underneath.

   It takes over window.openFabTranslate.
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* the body below is the file as it was, byte for byte; only the moment
     it is run changed — see the note above the four blocks */
  const boot = function(){
(function(){
  const PAIRS = [
    { id:'en-hi', label:'English → हिन्दी', from:'English', to:'Hindi, written in Devanagari script' },
    { id:'hi-en', label:'हिन्दी → English', from:'Hindi',   to:'English' },
    { id:'en-hg', label:'English → Hinglish', from:'English', to:'Hinglish — Hindi written in Roman script, the way people actually type it' },
    { id:'hg-en', label:'Hinglish → English', from:'Hinglish', to:'English' },
    { id:'hi-hg', label:'हिन्दी → Hinglish', from:'Hindi, written in Devanagari script', to:'Hinglish — the very same Hindi, in Roman script' },
    { id:'hg-hi', label:'Hinglish → हिन्दी', from:'Hinglish (Roman Hindi)', to:'Hindi, written in Devanagari script' }
  ];

  const sourceText = function(){
    try{ if(typeof ctxTxt === 'function'){ const t = ctxTxt(); if(t && String(t).trim()) return String(t).trim(); } }catch(e){}
    const ed = document.getElementById('editor');
    if(ed && (ed.innerText || '').trim()) return ed.innerText.trim();
    const dv = document.getElementById('draftBody');
    if(dv && (dv.value || '').trim()) return dv.value.trim();
    return '';
  };

  const run = async function(label, from, to){
    const p = document.getElementById('sfTranslate');
    if(!p) return;
    const dst = p.querySelector('#sftDst');
    const nameEl = p.querySelector('#sftDstName');
    if(nameEl) nameEl.textContent = label;

    const txt = sourceText();
    if(!txt){
      dst.innerHTML = '<span style="color:var(--ink-4)">Nothing to translate — write or select some text first</span>';
      return;
    }
    dst.innerHTML = '<span class="ft-busy">Translating…</span>';
    try{
      const res = await callAI(
        'Translate the text below' + (from ? ' from ' + from : '') + ' into ' + to + '.\n' +
        'Preserve the tone, the meaning and the paragraph breaks. Do not explain, do not add notes — ' +
        'return only the translation.\n\n"""\n' + txt + '\n"""');
      dst.textContent = (res || '').trim() || 'No response';
    }catch(err){
      dst.innerHTML = '<span style="color:var(--ink-3)">' + esc((err && err.message) || 'Translation failed') + '</span>';
    }
  };

  const build = function(){
    const p = document.createElement('div');
    p.className = 'sf-translate';
    p.id = 'sfTranslate';

    const langs = (typeof allLangs === 'function') ? allLangs() : [];
    p.innerHTML =
      '<div class="sft-head"><i class="bi bi-translate"></i><span>Translate</span>'
      +   '<button class="sft-x" data-sft-close title="Close"><i class="bi bi-x-lg"></i></button></div>'
      + '<div class="sft-pairs">'
      +   PAIRS.map(function(x, i){
            return '<button class="ft-pair' + (i === 0 ? ' on' : '') + '" data-ftpair="' + x.id + '">' + x.label + '</button>';
          }).join('')
      + '</div>'
      + '<div class="ft-bar">'
      +   '<div class="ft-cell"><span class="ft-lang">Source</span><div class="ft-text" id="sftSrc"></div></div>'
      +   '<div class="ft-cell"><span class="ft-lang" id="sftDstName">' + PAIRS[0].label + '</span>'
      +     '<div class="ft-text" id="sftDst"><span style="color:var(--ink-4)">Translation</span></div></div>'
      + '</div>'
      + '<div class="ft-search"><i class="bi bi-search"></i><input id="sftQuery" placeholder="Search languages…"></div>'
      + '<div class="ft-grid" id="sftGrid"></div>'
      + '<span class="sft-grip" data-sft-grip title="Drag to resize"><i class="bi bi-textarea-resize"></i></span>';
    document.body.appendChild(p);

    const grid = p.querySelector('#sftGrid');
    const render = function(q){
      const needle = (q || '').toLowerCase();
      const list = langs.filter(function(l){
        return !needle || (l.name || '').toLowerCase().indexOf(needle) >= 0
              || (l.native || '').toLowerCase().indexOf(needle) >= 0;
      });
      grid.innerHTML = list.map(function(l){
        return '<button class="ft-lang-btn" data-lang="' + l.code + '" data-name="' + esc(l.name) + '">'
             + '<span class="ft-flag">' + (l.flag || '') + '</span><span>' + esc(l.name)
             + (l.native ? ' <em>' + esc(l.native) + '</em>' : '') + '</span></button>';
      }).join('') || '<div class="ft-empty">No language found</div>';
    };
    render('');
    p.querySelector('#sftQuery').addEventListener('input', function(){ render(this.value); });

    p.querySelector('.sft-pairs').addEventListener('click', function(e){
      const b = e.target.closest('[data-ftpair]');
      if(!b) return;
      e.preventDefault();
      Array.prototype.slice.call(p.querySelectorAll('.ft-pair'))
        .forEach(function(x){ x.classList.toggle('on', x === b); });
      const pair = PAIRS.filter(function(x){ return x.id === b.dataset.ftpair; })[0];
      if(pair) run(pair.label, pair.from, pair.to);
    });

    grid.addEventListener('click', function(e){
      const b = e.target.closest('[data-lang]');
      if(!b) return;
      e.preventDefault();
      Array.prototype.slice.call(p.querySelectorAll('.ft-pair'))
        .forEach(function(x){ x.classList.remove('on'); });
      run(b.dataset.name, null, b.dataset.name);
    });

    /* ── close ── */
    p.querySelector('[data-sft-close]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      p.classList.remove('open');
    });

    /* ── move it by its header ── */
    const head = p.querySelector('.sft-head');
    head.addEventListener('pointerdown', function(e){
      if(e.target.closest('[data-sft-close]')) return;
      e.preventDefault();
      const r = p.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      p.style.right = 'auto'; p.style.bottom = 'auto';
      p.style.left = Math.round(r.left) + 'px';
      p.style.top  = Math.round(r.top) + 'px';
      p.style.width  = Math.round(r.width) + 'px';
      p.style.maxHeight = Math.round(r.height) + 'px';
      head.classList.add('dragging');
      const move = function(ev){
        const w = p.offsetWidth, h = p.offsetHeight;
        p.style.left = Math.max(0, Math.min(ev.clientX - dx, (window.innerWidth || 1200) - w - 4)) + 'px';
        p.style.top  = Math.max(0, Math.min(ev.clientY - dy, (window.innerHeight || 800) - 40)) + 'px';
      };
      const up = function(){
        head.classList.remove('dragging');
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
      };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
    });

    /* ── resize it from the bottom-right grip ── */
    const grip = p.querySelector('[data-sft-grip]');
    grip.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation();
      const r = p.getBoundingClientRect();
      p.style.right = 'auto'; p.style.bottom = 'auto';
      p.style.left = Math.round(r.left) + 'px';
      p.style.top  = Math.round(r.top) + 'px';
      const sx = e.clientX, sy = e.clientY, w0 = r.width, h0 = r.height;
      const move = function(ev){
        p.style.width = Math.max(280, Math.round(w0 + ev.clientX - sx)) + 'px';
        p.style.maxHeight = Math.max(240, Math.round(h0 + ev.clientY - sy)) + 'px';
        p.style.height = p.style.maxHeight;
      };
      const up = function(){
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
      };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
    });

    return p;
  };

  const open = function(){
    let p = document.getElementById('sfTranslate');
    if(!p) p = build();

    const src = p.querySelector('#sftSrc');
    const txt = sourceText();
    src.innerHTML = txt
      ? esc(txt.length > 4000 ? txt.slice(0, 4000) + '…' : txt)
      : '<span style="color:var(--ink-4)">Write or select some text first</span>';

    p.classList.add('open');

    const dst = p.querySelector('#sftDst');
    if(dst && !dst.textContent.trim()) run(PAIRS[0].label, PAIRS[0].from, PAIRS[0].to);

    /* the FAB card itself steps aside */
    const ai = document.getElementById('fabAI'); if(ai) ai.hidden = true;
    const mn = document.getElementById('fabMenu'); if(mn) mn.hidden = true;
    const fw = document.getElementById('fabWrap'); if(fw) fw.classList.remove('menu-open');
  };
  const close = function(){
    const p = document.getElementById('sfTranslate');
    if(p) p.classList.remove('open');
  };

  window.openFabTranslate = open;              /* the chip calls this name */
  window.SF_TRANSLATE = { open: open, close: close };

  /* the chip, caught here as well so it works whatever else is on the page */
  document.addEventListener('click', function(e){
    const chip = e.target && e.target.closest ? e.target.closest('.fab-ai .ai-chip[data-ai="translate"]') : null;
    if(!chip) return;
    e.preventDefault();
    open();
  }, true);

  /* click outside closes it; Escape too */
  document.addEventListener('click', function(e){
    const p = document.getElementById('sfTranslate');
    if(!p || !p.classList.contains('open')) return;
    if(e.target.closest('#sfTranslate') || e.target.closest('.fab-ai .ai-chip[data-ai="translate"]')) return;
    close();
  }, true);
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    const p = document.getElementById('sfTranslate');
    if(!p || !p.classList.contains('open')) return;
    if(document.querySelector('.modal-scrim')) return;
    const cb = document.getElementById('cmdBox');
    if(cb && !cb.hidden) return;
    close();
  }, true);
})();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

/* ── merged in from trim.js ── */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — what the writer asked to be taken out

   · The prompt page's top-left corner keeps its own buttons: Prompt me
     sits at the left, where the writing starts. Only an older “New
     prompt” button that survived a re-render is cleared away.

   · The research plugins (web search, Wikipedia, image search, quotes,
     public-domain books) are gone from the app. Their entry in Settings
     was removed with them, and this clears the last way in — the “Web
     search” button on the Research page.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const trim = function(){
    const page = document.getElementById('page-inspire');
    if(!page) return;

    Array.prototype.forEach.call(page.querySelectorAll('.idea-bar button, .idea-tools button'), function(b){
      if(/^\s*new prompt\s*$/i.test((b.textContent || '').trim())) b.remove();
    });
  };

  /* the research plugins' only remaining door */
  const researchOut = function(){
    const page = document.getElementById('page-research');
    if(!page) return;
    Array.prototype.forEach.call(page.querySelectorAll('[data-act="web-search"], [data-act="search-web"]'), function(b){
      b.remove();
    });
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; trim(); researchOut(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();

/* ── merged in from styles-pack.js ── */
/* ═══════════════════════════════════════════════════════════
   INTERFACE STYLE + ICON PACK

   ONE interface style: modern — the app exactly as it is, and no sheet of
   ours touches it. Flutter (Material 3, styles-pack.css) used to be the
   other one and it is gone: none of its selectors can match any more, so
   nothing can add a hairline, a radius or a shadow that the app itself
   did not draw.

   One icon set: Bootstrap Icons, shipped in the repository
   (vendor/bootstrap-icons) and nothing fetched, so it works offline and
   in the desktop build. The markup is written against it, so every
   glyph draws exactly as designed.

   This block's whole job is keeping those two attributes true.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const STYLES = ['modern'];
  const PACKS  = ['bootstrap'];

  const cfg = function(key, allowed, fallback){
    let v = '';
    try{ v = (S && S.config && S.config[key]) || ''; }catch(e){ v = ''; }
    return (allowed.indexOf(v) >= 0) ? v : fallback;
  };

  const stamp = function(){
    const el = document.documentElement;
    if(!el || !el.setAttribute) return;
    el.setAttribute('data-ui-style', cfg('uiStyle', STYLES, 'modern'));
    el.setAttribute('data-icons',    cfg('iconPack', PACKS, 'bootstrap'));
  };

  window.sfApplyUiStyle = stamp;
  window.sfUiStyles = STYLES;
  window.sfIconPacks = PACKS;
  window.sfUiStyle = function(){ return cfg('uiStyle', STYLES, 'modern'); };
  window.sfIconPack = function(){ return cfg('iconPack', PACKS, 'bootstrap'); };

  /* the app's own hooks repaint the theme; each one re-stamps the marks */
  const wrap = function(name){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfStyled) return;
    const fn = function(){
      const r = orig.apply(this, arguments);
      try{ stamp(); }catch(e){}
      return r;
    };
    fn.__sfStyled = true;
    window[name] = fn;
  };
  ['applyThemeNow', 'applyAllConfig', 'applyConfig', 'setThemeMode'].forEach(wrap);

  try{ stamp(); }catch(e){}
  document.addEventListener('DOMContentLoaded', function(){ try{ stamp(); }catch(e){} });
  /* a repaint can land before a settings save has been read back */
  let t = 0;
  document.addEventListener('click', function(){
    if(t) return;
    t = setTimeout(function(){ t = 0; try{ stamp(); }catch(e){} }, 250);
  }, true);
})();

/* ── merged in from ui-font.js ── */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — the interface's own text follows the writing size

   THE THING THAT DID NOT HAPPEN
   Settings → Appearance → Font size is the DOCUMENT's size. Increasing it
   grew the page you write on and nothing else, because every other size in
   the app is a fixed px in one of the stylesheets — 13.5px on the body,
   12.5px on a pill, 11px on a caption. There is no single number to turn.

   THE FIX
   The scale is the writing size against the 17px the interface was drawn
   for, and it is applied to the px font sizes in the stylesheets
   themselves:

       · only `font-size` (and a `font` shorthand) is rewritten, so nothing
         moves that is not text — no layout, no widths, no positions;
       · the two size TOKENS the chrome is written in are rewritten too.
         The top bar, the breadcrumbs, the mode pills and the toolbar
         buttons take their size from `--ui-font` and `--ctl-font` rather
         than from a font-size of their own, so a pass that only rewrote
         font-size would leave the whole top of the app at the size it
         started at — the visible half of “the font size does nothing”.
         A token is only taken when its NAME ends in `-font`, which is
         what keeps `--doc-size` (the document) and `--doc-font` (a
         typeface, no px in it anyway) out of the pass;
       · only stylesheets are touched. Inline styles are left exactly as
         they are, which is precisely right: the document and the writing
         panes (the editor, the draft split, the Fountain source) set their
         size inline, so the manuscript keeps the size you chose while the
         chrome around it grows with it;
       · each declaration remembers the px it started at, so a change of
         scale rescales from the original instead of multiplying whatever
         it wrote the last time.

   The scale is held between 0.85× and 1.6×: bars, cards and rows are built
   on fixed heights and fixed paddings, and text far past that would run out
   of its box.

   Nothing here reaches into a page.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const BASE = 17;                 /* the size the interface was drawn for */
  const MIN  = 0.85, MAX = 1.6;    /* past this, fixed-height rows clip */

  const configOf = function(){
    try{ return (typeof S !== 'undefined' && S.config) ? S.config : null; }catch(e){ return null; }
  };

  const scaleNow = function(){
    const c = configOf();
    const raw = Number(c && c.fontSize);
    const size = (isFinite(raw) && raw > 0) ? raw : BASE;
    return Math.max(MIN, Math.min(MAX, size / BASE));
  };

  /* the px tokens inside a value: 13.5px, and the bounds of a clamp() */
  const PX = /(\d+(?:\.\d+)?)px/g;

  /* The properties the interface's own type lives in: the two longhands,
     and the size tokens the responsive layer reads — `--ui-font` for the
     top bar, the breadcrumbs and the mode pills, `--ctl-font` for the
     toolbar buttons. Those two are the ones a font-size-only pass cannot
     reach. A custom property counts only when its name ENDS in `-font`,
     so `--doc-font` (a family) and `--doc-size` (the document) are never
     touched. */
  const isType = function(name){
    if(name === 'font-size' || name === 'font') return true;
    return name.length > 6 && name.charAt(0) === '-' && name.charAt(1) === '-'
        && name.slice(-5) === '-font';
  };

  /* what each declaration started at, so a second pass rescales the
     original and not the value this file wrote */
  const seen = new WeakMap();

  const scaleValue = function(value, k){
    if(value.indexOf('var(') >= 0) return null;         /* computed elsewhere */
    if(value.indexOf('px') < 0) return null;            /* em/rem/% follow their parent */
    let hit = false;
    const out = value.replace(PX, function(_, n){
      hit = true;
      return (Math.round(parseFloat(n) * k * 100) / 100) + 'px';
    });
    return hit ? out : null;
  };

  const paint = function(style, k){
    if(!style || typeof style.length !== 'number') return;
    let rec = seen.get(style);
    if(!rec){
      rec = [];
      for(let i = 0; i < style.length; i++){
        const name = style[i];
        if(!isType(name)) continue;
        const value = style.getPropertyValue(name);
        if(!value) continue;
        const at = style.getPropertyPriority(name);
        if(scaleValue(value, 1) === null) continue;      /* nothing in px to scale */
        rec.push({ name:name, value:value, prio:at });
      }
      if(rec.length) seen.set(style, rec);
    }
    for(let i = 0; i < rec.length; i++){
      const r = rec[i];
      const want = scaleValue(r.value, k);
      if(want === null) continue;
      try{
        if(style.getPropertyValue(r.name) !== want) style.setProperty(r.name, want, r.prio);
      }catch(e){}
    }
  };

  /* a rule, and the rules inside it (@media, @supports) */
  const walk = function(rule, k, depth){
    if(!rule || depth > 6) return;
    if(rule.cssRules && rule.cssRules.length){
      for(let i = 0; i < rule.cssRules.length; i++){
        try{ walk(rule.cssRules[i], k, depth + 1); }catch(e){}
      }
      /* an @media carries a style object too — usually empty */
      if(rule.style && rule.style.length) paint(rule.style, k);
      return;
    }
    if(rule.style) paint(rule.style, k);
  };

  let last = -1;

  const apply = function(force){
    const k = scaleNow();
    if(!force && k === last) return k;
    last = k;
    const sheets = document.styleSheets || [];
    for(let i = 0; i < sheets.length; i++){
      let rules = null;
      try{ rules = sheets[i].cssRules; }catch(e){ continue; }   /* another origin */
      if(!rules) continue;
      for(let r = 0; r < rules.length; r++){
        try{ walk(rules[r], k, 0); }catch(e){}
      }
    }
    return k;
  };
  window.sfApplyAppFont = apply;
  window.sfAppFontScale = scaleNow;

  /* the size is set in three places — the Appearance slider, the tab's own
     number box, and the toolbar — so all three ends are caught here */
  const wrap = function(name){
    const orig = window[name];
    if(typeof orig !== 'function' || orig.__sfAppFont) return;
    const fn = function(){
      const out = orig.apply(this, arguments);
      try{ apply(); }catch(e){}
      return out;
    };
    fn.__sfAppFont = true;
    window[name] = fn;
  };
  ['applyConfig', 'setFontSize', 'renderSetTab', 'paintPage', 'goPage'].forEach(wrap);

  /* a sheet that lands late is walked once more; a size that is read after
     boot is picked up by the same pass */
  let tick = 0;
  const soon = function(){
    if(tick) return;
    tick = setTimeout(function(){ tick = 0; apply(true); }, 120);
  };

  if(typeof MutationObserver === 'function' && document.head){
    new MutationObserver(soon).observe(document.head, { childList:true, subtree:true });
  }
  if(document.body) new MutationObserver(function(){ apply(); }).observe(document.body, { childList:true, subtree:true });
  window.addEventListener('load', soon);
  setInterval(function(){ apply(); }, 3000);

  apply(true);
  setTimeout(function(){ apply(true); }, 1500);
})();

const SETTINGS = {};

// ═══ Open settings modal ═══
// ═══ Open settings straight on a named tab (used by plugin panels' back button) ═══
SETTINGS.openTab = function(tab){
  SETTINGS.open();
  if(tab && typeof renderSetTab === 'function') renderSetTab(tab);
};

SETTINGS.open = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal settings-modal set-shell" style="max-width:1000px;">
      <aside class="set-side">
        <nav id="setTabs" class="set-nav"></nav>
      </aside>
      <div class="set-main">
        <div class="modal-head">
          <span class="set-head-actions" style="display:flex;align-items:center;">
            <button class="icon-btn v-close" data-act="set-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
          </span>
        </div>
        <div class="modal-body" id="setBody"></div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-act="set-close">Close</button>
          <button class="btn btn-primary" data-act="set-save">Save</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);

     const tabs = [
    {divider:true},
    {id:'ai',           icon:'stars',          label:'AI Assistance'},
    {id:'plugins',      icon:'puzzle',         label:'Plugins'},
    {divider:true},
    {id:'general',      icon:'gear',           label:'General'},
    {id:'appearance',   icon:'palette',        label:'Appearance'},
    {id:'typography',   icon:'fonts',          label:'Typography'},
    {id:'language',     icon:'translate',      label:'Language'},
    {id:'sound',        icon:'volume-up',      label:'Sound'},
    {divider:true},
    {id:'custom',       icon:'sliders',        label:'Custom'},
    {divider:true}
  ];
  const tabBar = $('setTabs');
  tabs.forEach(t => {
    if(t.divider){
      const d = document.createElement('span');
      d.className = 'set-tab-sep';
      tabBar.appendChild(d);
      return;
    }
    const b = document.createElement('button');
    b.className = 'set-tab' + (t.id === 'ai' ? ' active' : '');
    b.innerHTML = `<i class="bi bi-${t.icon}"></i> ${t.label}`;
    b.dataset.setTab = t.id;
    tabBar.appendChild(b);
  });

  /* ── IMPORT — the button that used to float over the dashboard now sits at
     the foot of this rail. It keeps both of the floating button's jobs, by
     driving that same button: click for GitHub, right-click for a file. */
  if(!document.getElementById('setImportStyle')){
    const st = document.createElement('style');
    st.id = 'setImportStyle';
    /* a BUTTON, not a tab: it never changes the pane beside it, so it must not
       look like the rail's other entries. margin-top:auto pins it to the foot. */
    st.textContent =
      'html body .settings-modal #setTabs .set-import-btn{' +
        'margin-top:auto !important;width:100% !important;height:32px !important;' +
        'display:flex !important;align-items:center !important;justify-content:center !important;gap:7px !important;' +
        'border:1px solid var(--line-2) !important;border-radius:var(--r-sm,4px) !important;' +
        'background:var(--surface-3) !important;color:var(--ink) !important;' +
        'font-size:12px !important;font-weight:600 !important;letter-spacing:0 !important;' +
        'cursor:pointer !important;transition:background .12s ease, border-color .12s ease !important;}' +
      'html body .settings-modal #setTabs .set-import-btn i{font-size:12px !important;}' +
      'html body .settings-modal #setTabs .set-import-btn:hover{' +
        'background:var(--surface-4) !important;border-color:var(--line-3) !important;}';
    document.head.appendChild(st);
  }
  const impBtn = document.createElement('button');
  impBtn.type = 'button';
  impBtn.className = 'set-import-btn';
  impBtn.id = 'setImportBtn';
  impBtn.title = 'Click: GitHub · Right-click: a file on this computer';
  impBtn.innerHTML = '<i class="bi bi-box-arrow-in-down"></i> Import';
  impBtn.addEventListener('click', function(e){
    e.preventDefault();
    if(typeof window.openGitHubPanel === 'function') window.openGitHubPanel();
    else if(typeof toast === 'function') toast('GitHub panel not loaded', 'err');
  });
  impBtn.addEventListener('contextmenu', function(e){
    e.preventDefault();
    const src = document.getElementById('floatingImport');
    if(src) src.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}));
  });
  tabBar.appendChild(impBtn);

  /* sidebar layout — nothing to mirror into the head any more */

  renderSetTab('ai');

};

function renderSetTab(id){
  document.querySelectorAll('[data-set-tab]').forEach(b => {
    const on = b.dataset.setTab === id;
    b.classList.toggle('active', on);
    b.style.borderBottomColor = '';
    b.style.color = '';
  });
  const body = $('setBody');
  if(!body) return;
  body.innerHTML = '';
  // two tabs are named differently to their renderer — without this they'd
  // open an empty panel
  const RENDER_ALIAS = { typography:'type' };
  const key = RENDER_ALIAS[id] || id;
  if(SETTINGS.renderers[key]) SETTINGS.renderers[key](body);
  enhanceSelects(body);
}

// ═══ Dropdowns — every <select class="sel"> opens as the Statistics-style
//     card (same .stats-cat-* look and theme tokens). The real <select>
//     stays in the DOM (visually hidden) so all existing value/change
//     handlers keep working untouched. ═══
function enhanceSelects(root){
  root.querySelectorAll('select.sel').forEach(function(sel){
    if(sel.dataset.dd) return;
    sel.dataset.dd = '1';
    sel.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'stats-cat-card dd-card';

    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'stats-cat-title';
    title.innerHTML = '<span class="dd-value"></span><i class="bi bi-chevron-down stats-cat-caret"></i>';

    const list = document.createElement('div');
    list.className = 'stats-cat-list';

    function sync(){
      const opt = sel.options[sel.selectedIndex];
      title.querySelector('.dd-value').textContent = opt ? opt.textContent : '';
    }

    function paint(){
      list.querySelectorAll('.stats-cat-item').forEach(function(it){
        it.classList.toggle('active', it.dataset.value === sel.value);
      });
    }

    function addItem(opt){
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'stats-cat-item';
      item.dataset.value = opt.value;
      const span = document.createElement('span');
      span.textContent = opt.textContent;
      item.appendChild(span);
      item.insertAdjacentHTML('beforeend', '<i class="bi bi-check2"></i>');
      item.onclick = function(){
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        paint();
        card.classList.remove('open');
      };
      list.appendChild(item);
    }

    // rebuild from the <select>'s current options — called again whenever
    // code refills the select (e.g. the provider → model list). The select's
    // grouping is kept too: each <optgroup> becomes a header row, the same
    // way the native list shows it (Free API tiers · Local · Bring your own key).
    function build(){
      list.innerHTML = '';
      const kids = sel.children.length ? Array.from(sel.children) : Array.from(sel.options);
      kids.forEach(function(n){
        if(n.tagName === 'OPTGROUP'){
          const h = document.createElement('div');
          h.className = 'dd-group';
          h.textContent = n.label;
          list.appendChild(h);
          Array.from(n.children).forEach(addItem);
        } else if(n.tagName === 'OPTION'){
          addItem(n);
        }
      });
      // a long list (AI providers, fonts) gets real room instead of a 150px slit
      card.classList.toggle('dd-long', sel.options.length > 12);
      sync();
      paint();
    }

    sel._ddRefresh = build;

    title.onclick = function(e){
      e.stopPropagation();
      document.querySelectorAll('.dd-card.open').forEach(function(c){ if(c !== card) c.classList.remove('open'); });
      card.classList.toggle('open');
    };

    // carry over an explicit width the renderer asked for (e.g. the font picker)
    if(sel.style.minWidth) card.style.minWidth = sel.style.minWidth;
    if(sel.style.width) card.style.width = sel.style.width;

    card.appendChild(title);
    card.appendChild(list);
    build();
    sel.parentNode.insertBefore(card, sel.nextSibling);
  });
}

// close any open dropdown on an outside click
document.addEventListener('click', function(e){
  if(e.target.closest('.dd-card')) return;
  document.querySelectorAll('.dd-card.open').forEach(function(c){ c.classList.remove('open'); });
}, true);

// ═══ Small helpers for building rows ═══
function row(label, desc, control){
  const r = document.createElement('div');
  r.className = 'set-row';
  const l = document.createElement('div');
  l.innerHTML = `<div class="set-label">${label}</div>${desc ? `<div class="set-desc">${desc}</div>` : ''}`;
  r.appendChild(l);
  const c = document.createElement('div');
  c.className = 'set-ctrl';
  if(typeof control === 'string') c.innerHTML = control;
    else if(control && control instanceof Node) c.appendChild(control);
  else if(Array.isArray(control)) control.forEach(function(n){ if(n && n instanceof Node) c.appendChild(n); });
  else if(control !== undefined && control !== null) c.appendChild(document.createTextNode(String(control)));
  r.appendChild(c);
  return r;
}

function card(title, icon){
  const d = document.createElement('div');
  d.className = 'set-card';
  d.innerHTML = `<div class="set-card-title"><i class="bi bi-${icon}"></i> ${title}</div>`;
  return d;
}

/* A toggle row that applies its change immediately — used by the tabs that
   inherited the experimental options. */
function cfgRow(cardEl, label, hint, key, after){
  const t = document.createElement('div');
  t.className = 'tgl';
  t.classList.toggle('on', !!S.config[key]);
  t.onclick = function(){
    S.config[key] = !S.config[key];
    t.classList.toggle('on', S.config[key]);
    applyConfig(key);
    save();
    if(typeof after === 'function') after(t);
  };
  cardEl.appendChild(row(label, hint, t));
  return t;
}
function classRow(cardEl, label, hint, key, cls, onWord, offWord){
  const t = document.createElement('div');
  t.className = 'tgl';
  t.classList.toggle('on', !!S.config[key]);
  t.onclick = function(){
    S.config[key] = !S.config[key];
    t.classList.toggle('on', S.config[key]);
    document.body.classList.toggle(cls, S.config[key]);
    save();
  };
  cardEl.appendChild(row(label, hint || (onWord || ''), t));
  return t;
}

function bindToggle(el, key){
  el.classList.toggle('on', !!S.config[key]);
  el.addEventListener('click', () => {
    S.config[key] = !S.config[key];
    el.classList.toggle('on', S.config[key]);
    applyConfig(key);
    save();
  });
}

// ═══ Config appliers ═══
function applyConfig(key){
  const c = S.config;
  const root = document.documentElement;
  switch(key){
    case 'theme': applyThemeVars(c.theme); break;
    case 'font': {
      /* the writing face, written as the whole stack it belongs to — a sans
         pick falls back to sans and a mono pick to mono, instead of every
         family in the list falling back to a generic serif. font-pack.js
         holds the table's stacks and fetches the chosen file. An empty
         choice hands the property back to theme.css, which is the app's
         own default face. */
      const stack = (typeof window.sfFontStack === 'function')
        ? window.sfFontStack(c.font)
        : (c.font ? `'${c.font}', serif` : '');
      root.style.setProperty('--doc-font', stack || '');
      const ed = $('editor'); if(ed) ed.style.fontFamily = stack || '';
      break;
    }
    case 'uiFont': {
      // the typeface used across the whole interface — the family's own
      // stack, so the App font select really does set the app's face (it
      // used to end in system-ui, which is what the default already is,
      // so every pick looked like no change at all)
      const stack = (typeof window.sfFontStack === 'function') ? window.sfFontStack(c.uiFont) : '';
      if(stack) root.style.setProperty('--ui', stack);
      else if(c.uiFont) root.style.setProperty('--ui', `'${c.uiFont}', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`);
      else root.style.removeProperty('--ui');
      break;
    }
    case 'fontSize':
      root.style.setProperty('--doc-size', c.fontSize + 'px');
      /* every writing surface, not only the manuscript: the draft/editor
         panes carry their own element, and a repaint re-creates it, so
         the token above plus this sweep is what actually lands */
      Array.prototype.forEach.call(
        document.querySelectorAll('#editor, .write-doc, .editor-doc, .sf-split-doc, .sf-split-editor'),
        function(el){ el.style.fontSize = c.fontSize + 'px'; }
      );
      break;
    case 'lineHeight':
      root.style.setProperty('--doc-line', c.lineHeight);
      const e3 = $('editor'); if(e3) e3.style.lineHeight = c.lineHeight;
      break;
    case 'letterSpacing':
      root.style.setProperty('--doc-track', c.letterSpacing + 'px');
      break;
    case 'wordSpacing':
      root.style.setProperty('--doc-word', c.wordSpacing + 'px');
      break;
    case 'paraSpacing':
      root.style.setProperty('--doc-para', c.paraSpacing + 'px');
      break;
    case 'editorWidth':
      root.style.setProperty('--doc-max', c.editorWidth);
      break;
    case 'uiScale':
      root.style.setProperty('--ui-scale', c.uiScale);
      document.body.style.zoom = c.uiScale;
      break;
    case 'eyeComfort':
      // a warm light filter across the whole app — independent of the theme
      document.body.classList.toggle('eye-comfort', !!c.eyeComfort);
      root.style.setProperty('--eye-amount', eyeComfortAlpha());
      break;
    case 'uiStyle':
    case 'iconPack':
      // the interface style and the icon set live as two marks on <html>,
      // and the sheets are scoped to them (see the interface-style block
      // above, which keeps both marks true)
      if(typeof window.sfApplyUiStyle === 'function') window.sfApplyUiStyle();
      break;
    case 'uiBrightness': {
      // how bright the whole interface is. 100% is the app untouched, and at
      // 100% the filter is not applied at all — so a writer who never touches
      // this slider gets exactly the app that was there before it existed.
      const b = Math.max(40, Math.min(160, Number(c.uiBrightness) || 100));
      root.style.setProperty('--ui-bright', String(b / 100));
      document.body.classList.toggle('ui-bright', b !== 100);
      break;
    }
    case 'expOverlay':
      // the editor toolbar carries one pane button: the docked split screen
      // normally, the floating overlay when this is on
      if(typeof renderToolbar === 'function') renderToolbar();
      if(typeof overlayApplyMode === 'function') overlayApplyMode();
      if(typeof overlayGeometry === 'function' && S.config.overlay && S.config.overlay.open) overlayGeometry();
      break;
    case 'expMixedFonts':
      document.body.classList.toggle('mixed-fonts', !!c.expMixedFonts);
      break;
    case 'expOrganize':
      // the assistant and the editor's right-click menu both grow the action
      if(typeof buildAIPanel === 'function') buildAIPanel();
      break;
    case 'expHinglish':
      if(typeof renderFabAI === 'function') renderFabAI();
      break;
  }
}

// 0–100 strength → a subtle overlay alpha (0 → 0.26)
function eyeComfortAlpha(){
  const lvl = Math.max(0, Math.min(100, Number(S.config.eyeComfortLevel ?? 40)));
  return String((lvl / 100) * 0.26);
}
window.eyeComfortAlpha = eyeComfortAlpha;

function applyAllConfig(){
  /* Shadows · Opacity · Blur · Glass UI are gone from Settings — the app runs
     flat and opaque, and any value left in storage from before is cleared so
     nothing looks glassy any more. */
  S.config.shadowIntensity = 0;
  S.config.surfaceOpacity  = 1;
  S.config.borderOpacity   = 1;
  S.config.backdropBlur    = 0;
  S.config.glassUI         = false;
  document.body.classList.remove('glass-ui');
  const rs = document.documentElement.style;
  rs.setProperty('--shadow-intensity', 0);
  rs.setProperty('--surface-opacity', 1);
  rs.setProperty('--border-opacity', 1);
  rs.setProperty('--backdrop-blur', '0px');
  ['theme','font','uiFont','fontSize','lineHeight','letterSpacing','wordSpacing','paraSpacing','editorWidth','uiScale','eyeComfort',
   'uiBrightness','uiStyle','iconPack','expMixedFonts','expOverlay'].forEach(applyConfig);
  if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
}

function applyVisualizerAlign(){
  const viz = document.querySelector('.mv-visualizer');
  if(viz) viz.style.alignItems = S.config.visualizerAlign || 'center';
}
window.applyVisualizerAlign = applyVisualizerAlign;

function hexToRgb(h){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return m ? {r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16)} : null;
}

// ═══ Renderers per tab ═══
SETTINGS.renderers = {};

// ═══ COLOR THEMES — one grid, used by both Appearance and Look ═══
function setTheme(id){
  S.config.theme = id;
  applyThemeVars(id);
  save();
}
window.setTheme = setTheme;

function buildThemeGrid(){
  const wrap = document.createElement('div');
  const grid = document.createElement('div');
  grid.className = 'grid-auto';

  /* EVERY theme, and every one of them dark. There is no second palette
     to swap in: a theme is the palette on its tile, with nothing derived
     from it, so the grid is the whole list and the pick falls to
     S.config.theme. */
  const list = THEMES;
  const active = S.config.theme || 'night';

  /* paint reads the LIVE pick, not the one the grid was built with. It used
     to close over `active`, so choosing a theme moved the palette but left
     the highlight on the tile that was selected when the tab was opened —
     pick Noir and the ring stayed on Neon City. */
  const paint = () => {
    const cur = S.config.theme || 'night';
    grid.querySelectorAll('[data-theme-pick]').forEach(x =>
      x.classList.toggle('on', x.dataset.themePick === cur));
  };

  list.forEach(t => {
    const sw = (typeof window.sfThemeSwatch === 'function') ? window.sfThemeSwatch(t) : { c1:t.c1, c2:t.c2 };
    const tile = document.createElement('div');
    tile.className = 'tile' + (t.id === active ? ' on' : '');
    tile.dataset.themePick = t.id;
    tile.innerHTML = `
      <div style="display:flex;height:40px;border-radius:8px;overflow:hidden;margin-bottom:8px;border:1px solid var(--line-2);">
        <div style="flex:1;background:${sw.c1}"></div>
        <div style="flex:1;background:${sw.c2}"></div>
      </div>
      <div style="font-size:11.5px;font-weight:600;">${t.name}</div>
      <div style="font-size:10.5px;color:var(--ink-4);margin-top:3px;line-height:1.4;">${t.note || ''}</div>
    `;
    grid.appendChild(tile);
  });

  grid.addEventListener('click', e => {
    const el = e.target.closest('[data-theme-pick]');
    if(!el) return;
    const id = el.dataset.themePick;

    setTheme(id);
    paint();
    toast('Theme: ' + themeById(resolveThemeId(id)).name);
  });

  wrap.appendChild(grid);
  return wrap;
}

// ═══ APPEARANCE ═══
SETTINGS.renderers.appearance = function(root){

  // ── COLOR THEME — the whole list, twelve dark palettes, one grid.
  /* Every theme here is a dark one and the app runs dark, always — the
     Light / Dark switch is gone, and setThemeMode is pinned in
     final-fix.js so nothing stored from before can bring light back.
     Nothing is derived from a theme either: no light palette is worked
     out of a dark one, so the tile is the palette you get. */
  const c0 = card('Color theme', 'palette2');
  c0.appendChild(buildThemeGrid());
  root.appendChild(c0);

  // ── EYE COMFORT — a toggle, not a theme, so it layers over any palette ──
  const cEye = card('Comfort', 'brightness-high');

  const eyeTgl = document.createElement('div');
  eyeTgl.className = 'tgl';
  bindToggle(eyeTgl, 'eyeComfort');
  cEye.appendChild(row('Eye comfort', 'Warm light filter over any theme — cuts blue light', eyeTgl));

  const eyeRng = document.createElement('input');
  eyeRng.type = 'range';
  eyeRng.className = 'rng';
  eyeRng.min = '0'; eyeRng.max = '100'; eyeRng.step = '5';
  eyeRng.value = S.config.eyeComfortLevel ?? 40;
  const eyeVal = document.createElement('span');
  eyeVal.className = 'rng-val';
  eyeVal.textContent = (S.config.eyeComfortLevel ?? 40) + '%';
  eyeRng.oninput = function(){
    S.config.eyeComfortLevel = parseInt(eyeRng.value, 10) || 0;
    eyeVal.textContent = S.config.eyeComfortLevel + '%';
    applyConfig('eyeComfort');
    save();
  };
  cEye.appendChild(row('Filter strength', 'How warm the filter is (0 = off)', [eyeRng, eyeVal]));

  // ── BRIGHTNESS — dim or lift the WHOLE interface, every theme included.
  //    100% is the app exactly as it is; below dims, above lifts.
  const brRng = document.createElement('input');
  brRng.type = 'range';
  brRng.className = 'rng';
  brRng.min = '40'; brRng.max = '160'; brRng.step = '5';
  brRng.value = S.config.uiBrightness ?? 100;
  const brVal = document.createElement('span');
  brVal.className = 'rng-val';
  brVal.textContent = (S.config.uiBrightness ?? 100) + '%';
  brRng.oninput = function(){
    S.config.uiBrightness = parseInt(brRng.value, 10) || 100;
    brVal.textContent = S.config.uiBrightness + '%';
    applyConfig('uiBrightness');
    save();
  };
  const brReset = document.createElement('button');
  brReset.type = 'button';
  brReset.className = 'btn btn-ghost';
  brReset.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>';
  brReset.title = 'Reset to 100%';
  brReset.onclick = function(){
    S.config.uiBrightness = 100;
    brRng.value = 100;
    brVal.textContent = '100%';
    applyConfig('uiBrightness');
    save();
  };
  cEye.appendChild(row('Brightness', 'Dim or lift the whole interface (100% = untouched)', [brRng, brVal, brReset]));

  const eyeHint = document.createElement('div');
  eyeHint.className = 'tiny muted';
  eyeHint.style.marginTop = '4px';
  eyeHint.textContent = 'Both layer over every theme and every light-on-dark surface — including the overlay screen and the players. Eye comfort tints warm; Brightness dims or lifts the whole interface.';
  cEye.appendChild(eyeHint);
  root.appendChild(cEye);

  // ── FONT — the typeface used across the whole app ──
  const cFont = card('Font', 'fonts');
  const appFontSel = document.createElement('select');
  appFontSel.className = 'sel';
  appFontSel.style.minWidth = '220px';
  const appFontDef = document.createElement('option');
  appFontDef.value = '';
  appFontDef.textContent = 'Default (Inter)';
  if(!S.config.uiFont) appFontDef.selected = true;
  appFontSel.appendChild(appFontDef);
  FONTS.forEach(f => {
    const o = document.createElement('option');
    o.value = f.name; o.textContent = f.name;
    if(f.name === S.config.uiFont) o.selected = true;
    appFontSel.appendChild(o);
  });
  appFontSel.onchange = function(){
    S.config.uiFont = appFontSel.value;
    applyConfig('uiFont');
    save();
  };
  cFont.appendChild(row('App font', 'Typeface used across the whole interface', appFontSel));

  /* the writing face's size and spacing live beside the face itself —
     Typography keeps the behaviour switches, not a second font setting */
  const metric = function(label, key, min, max, step, unit){
    const inp = document.createElement('input');
    inp.type = 'range'; inp.className = 'rng';
    inp.min = min; inp.max = max; inp.step = step;
    inp.value = S.config[key];
    const val = document.createElement('span');
    val.className = 'rng-val';
    val.textContent = S.config[key] + unit;
    inp.oninput = function(){
      S.config[key] = parseFloat(inp.value);
      val.textContent = S.config[key] + unit;
      applyConfig(key);
      save();
    };
    cFont.appendChild(row(label, '', [inp, val]));
  };
  metric('Font size', 'fontSize', 12, 40, .5, 'px');

  /* A sample line under the size slider, drawn in the writing face at the
     size you just picked: a size you cannot see is a size you cannot tell
     apart from a broken one. final-fix.js keeps it in step. */
  const sizeSample = document.createElement('div');
  sizeSample.className = 'font-size-sample';
  sizeSample.textContent = 'The rain has not stopped for a week.';
  cFont.appendChild(sizeSample);

  root.appendChild(cFont);

  // ── ANIMATION ──
  const c8 = card('Animation', 'lightning');

  const speedSel = document.createElement('select');
  speedSel.className = 'sel';
  [['0.7','Fast'],['1','Normal'],['1.5','Slow'],['2.5','Very slow']].forEach(function(p){
    const o = document.createElement('option');
    o.value = p[0]; o.textContent = p[1];
    if(p[0] === String(S.config.animSpeed || '1')) o.selected = true;
    speedSel.appendChild(o);
  });
  speedSel.onchange = function(){
    S.config.animSpeed = parseFloat(speedSel.value);
    document.documentElement.style.setProperty('--anim-speed', S.config.animSpeed);
    save();
  };
  c8.appendChild(row('Speed', 'Multiplier for all transitions', speedSel));

  const reduceMotion = document.createElement('div');
  reduceMotion.className = 'tgl';
  reduceMotion.classList.toggle('on', !!S.config.reduceMotion);
  reduceMotion.onclick = function(){
    S.config.reduceMotion = !S.config.reduceMotion;
    reduceMotion.classList.toggle('on', S.config.reduceMotion);
    document.body.classList.toggle('reduce-motion', S.config.reduceMotion);
    save();
  };
  c8.appendChild(row('Reduce motion', 'Minimize animations and transitions', reduceMotion));

  const richAnims = document.createElement('div');
  richAnims.className = 'tgl';
  richAnims.classList.toggle('on', S.config.richAnims !== false);
  richAnims.onclick = function(){
    S.config.richAnims = !(S.config.richAnims !== false);
    richAnims.classList.toggle('on', S.config.richAnims);
    document.body.classList.toggle('no-animations', !S.config.richAnims);
    save();
  };
  c8.appendChild(row('Rich animations', 'Extra transitions, spring easing, motion effects', richAnims));

  root.appendChild(c8);

  /* ── INTERFACE STYLE — there is one, and it is the app's own.
     Flutter (Material 3) used to be offered beside it; it is gone, so
     nothing can re-style a page, a bar, a card, a panel, a menu, a field
     or a row any more. Modern is what the app has always been: the CSS in
     theme.css / layout.css / pages.css, and nothing else. (styles-pack.js
     still stamps the mark, which is why nothing has to change there.)

     The icon set is Bootstrap Icons alone, shipped in the app
     (vendor/bootstrap-icons) — the markup is written against it, there is
     nothing to pick and nothing is fetched. */

};

// ═══ APPLY THEME IMMEDIATELY ═══
function applyThemeNow(){
  document.body.setAttribute('data-writing-mode', S.mode || 'novel');
  document.body.setAttribute('data-style', S.config.style || 'vercel');
  document.body.setAttribute('data-color', S.config.color || 'minimal');
  applyThemeVars(S.config.theme || 'night');
}
window.applyThemeNow = applyThemeNow;

SETTINGS.renderers.general = function(root){
  /* ── YOUR NAME — there is no Settings row for it any more, and nothing
     on the dashboard asks for it. The name is still honoured when one
     arrives from a ?name= link or from GitHub, and it still signs the
     exports. */

  const c1 = card('Core', 'gear');
  const autoSave = document.createElement('div');
  autoSave.className = 'tgl';
  bindToggle(autoSave, 'autoSave');
  c1.appendChild(row('Auto-save', 'Save changes every few seconds', autoSave));

  /* Auto-snapshot also keeps the JSON copy on disk: one switch, both jobs */
  const autoVer = document.createElement('div');
  autoVer.className = 'tgl';
  bindToggle(autoVer, 'autoVersion');

  /* ONE button. It saves a copy of the project file now — into the linked
     folder (one file per project, rewritten) when there is one, and as a
     download when the browser will not give the app a folder. “Choose
     folder” and “Download a copy” were the same job under two names. */
  const verFile = document.createElement('button');
  verFile.className = 'btn btn-ghost';
  /* autosave.js paints this — the label is where the copy actually goes */
  verFile.setAttribute('data-auto-where', '1');
  verFile.innerHTML = '<i class="bi bi-folder2-open"></i> ' +
    ((window.SF_AUTO && SF_AUTO.where) ? SF_AUTO.where() : 'Save a copy');
  verFile.onclick = function(){
    if(window.SF_AUTO && typeof SF_AUTO.saveNow === 'function') SF_AUTO.saveNow();
    else if(window.SF_AUTO && typeof SF_AUTO.link === 'function') SF_AUTO.link();
    else toast('Saving is not available in this browser', 'warn');
  };
  c1.appendChild(row('Auto-snapshot',
    'A restorable snapshot, and this same JSON file rewritten every 10 seconds as you write',
    [verFile, autoVer]));

  /* switching it on asks for the file once, so nothing lands as "(1)" or "(2)" */
  autoVer.addEventListener('click', function(){
    if(S.config.autoVersion && window.SF_AUTO && typeof SF_AUTO.link === 'function' && !SF_AUTO.linked()) SF_AUTO.link();
  });

  root.appendChild(c1);

  const c2 = card('Interface', 'display');
  const scale = document.createElement('input');
  scale.type = 'range';
  scale.className = 'rng';
  scale.min = .7; scale.max = 1.4; scale.step = .05;
  scale.value = S.config.uiScale;
  const scaleVal = document.createElement('span');
  scaleVal.className = 'rng-val';
  scaleVal.textContent = Math.round(S.config.uiScale*100) + '%';
  scale.addEventListener('input', e => {
    S.config.uiScale = parseFloat(e.target.value);
    scaleVal.textContent = Math.round(S.config.uiScale*100) + '%';
    applyConfig('uiScale');
  });
  c2.appendChild(row('UI scale', 'Zoom the whole interface', [scale, scaleVal]));

  root.appendChild(c2);

  const snap = document.createElement('button');
  snap.className = 'btn btn-ghost';
  snap.innerHTML = '<i class="bi bi-bookmark-plus"></i> Snapshot now';
  snap.onclick = function(){
    if(typeof TOOLS !== 'undefined' && typeof TOOLS.snapshot === 'function') TOOLS.snapshot();
    else toast('Snapshot not available', 'warn');
    closeModal();
  };
  c1.appendChild(row('Manual snapshot', 'Save a version right now', snap));
};

SETTINGS.renderers.ai = function(root){
  const prov = aiProvider(S.config.provider);

  const c1 = card('Provider', 'cloud');
  const provSel = document.createElement('select');
  provSel.className = 'sel';
  provSel.style.minWidth = '260px';
  // grouped: free cloud tiers · local · bring your own key
  const byGroup = {};
  AI_PROVIDERS.forEach(p => { (byGroup[p.group] = byGroup[p.group] || []).push(p); });
  Object.keys(byGroup).forEach(g => {
    const og = document.createElement('optgroup');
    og.label = g;
    byGroup[g].forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      if(p.id === S.config.provider) o.selected = true;
      og.appendChild(o);
    });
    provSel.appendChild(og);
  });
  provSel.onchange = () => {
    S.config.provider = provSel.value;
    save();
    renderSetTab('ai');           // key + endpoint + model follow the provider
  };
  const freeN = AI_PROVIDERS.filter(p => p.group === 'Free API tiers').length;
  const byokN = AI_PROVIDERS.filter(p => p.group === 'Bring your own key').length;
  c1.appendChild(row('AI provider',
    freeN + ' with a free API tier · ' + byokN + ' bring-your-own-key · ' + AI_PROVIDERS.length + ' in total',
    provSel));
  root.appendChild(c1);

  // ── KEY + ENDPOINT for the selected provider (BYOK lives here) ──
  const c2 = card('Key & endpoint', 'key');
  if(prov.keyless){
    const note = document.createElement('div');
    note.className = 'tiny muted';
    note.style.marginBottom = '6px';
    note.textContent = 'No API key needed — this provider runs on your own machine.';
    c2.appendChild(note);
  } else {
    const inp = document.createElement('input');
    inp.type = 'password';
    inp.className = 'inp';
    inp.placeholder = prov.keyPh || '';
    inp.value = aiKeyFor(prov.id) || '';
    inp.style.minWidth = '240px';
    inp.oninput = () => { aiSetKey(prov.id, inp.value.trim()); save(); };
    c2.appendChild(row(prov.keyLabel || 'API key', prov.keyHint || '', inp));
  }

  const base = document.createElement('input');
  base.type = 'text';
  base.className = 'inp';
  base.style.minWidth = '240px';
  base.placeholder = prov.base || 'https://your-endpoint/v1';
  base.value = (S.config.aiBases && S.config.aiBases[prov.id]) || prov.base || '';
  base.oninput = () => {
    if(!S.config.aiBases) S.config.aiBases = {};
    S.config.aiBases[prov.id] = base.value.trim();
    save();
  };
  c2.appendChild(row('Endpoint',
    prov.custom ? 'Required — any OpenAI-compatible base URL'
                : 'Only change this for a proxy or self-hosted server',
    base));
  root.appendChild(c2);

  const c3 = card('Model', 'cpu');
  const sel = document.createElement('select');
  sel.className = 'sel';
  sel.id = 'aiModelSelect';
  sel.style.minWidth = '200px';
  c3.appendChild(row('Model', 'Click Fetch to load models from your provider', sel));

  if(prov.custom){
    const mid = document.createElement('input');
    mid.type = 'text';
    mid.className = 'inp';
    mid.style.minWidth = '200px';
    mid.placeholder = 'e.g. my-model-v1';
    mid.value = aiModelFor('custom') || '';
    mid.oninput = () => { aiSetModel('custom', mid.value.trim()); save(); };
    c3.appendChild(row('Model id', 'Name your endpoint expects', mid));
  }

  const fetchBtn = document.createElement('button');
  fetchBtn.className = 'btn btn-primary';
  fetchBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Fetch models';
  fetchBtn.onclick = async () => {
    const models = await fetchModels();
    if(models.length){
      fillModelSelect(sel, models);
    }
  };
  c3.appendChild(row('Refresh list', 'Pull latest available models', fetchBtn));

  const testBtn = document.createElement('button');
  testBtn.className = 'btn btn-ghost';
  testBtn.innerHTML = '<i class="bi bi-wifi"></i> Test connection';
  const badge = document.createElement('span');
  badge.dataset.conn = '1';
  badge.style.cssText = 'font-size:11.5px;font-weight:600;margin-left:8px;';
  badge.textContent = 'Not tested';
  testBtn.onclick = testConn;
  c3.appendChild(row('Test', 'Verify your API key works', [testBtn, badge]));
  root.appendChild(c3);

  const c4 = card('Generation', 'sliders');
  const temp = document.createElement('input');
  temp.type = 'range';
  temp.className = 'rng';
  temp.min = 0; temp.max = 2; temp.step = .05;
  temp.value = S.config.temperature;
  const tval = document.createElement('span');
  tval.className = 'rng-val';
  tval.textContent = S.config.temperature;
  temp.oninput = () => {
    S.config.temperature = parseFloat(temp.value);
    tval.textContent = S.config.temperature;
    save();
  };
  c4.appendChild(row('Temperature', '0 = precise, 2 = creative', [temp, tval]));

  const mt = document.createElement('input');
  mt.type = 'number';
  mt.className = 'inp sm';
  mt.value = S.config.maxTokens;
  mt.oninput = () => { S.config.maxTokens = parseInt(mt.value) || 4096; save(); };
  c4.appendChild(row('Max tokens', 'Response length limit', mt));
  root.appendChild(c4);

  fillModelSelect(sel, S.config.availableModels[S.config.provider] || getDefaultModels());
};

function fillModelSelect(sel, models){
  sel.innerHTML = '';
  models.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.n || m.id;
    if(m.id === aiModelFor(S.config.provider)) o.selected = true;
    sel.appendChild(o);
  });
  if(!sel.value && models[0]) sel.value = models[0].id;
  sel.onchange = () => { aiSetModel(S.config.provider, sel.value); save(); };
}

function getDefaultModels(){
  const list = aiProvider(S.config.provider).models || [];
  return list.length ? list.slice() : [{ id:'', n:'Type a model id above' }];
}

function buildModelDropdown(){
  const sel = $('aiModelSelect');
  if(!sel) return;
  const models = S.config.availableModels[S.config.provider] || getDefaultModels();
  fillModelSelect(sel, models);
  if(typeof sel._ddRefresh === 'function') sel._ddRefresh();   // rebuild the dropdown card
}

SETTINGS.renderers.type = function(root){
  /* the font itself — face, size and spacing — lives in Appearance now;
     Typography is behaviour, not a second font setting. */

  /* ── Writing — behaviour that used to sit in Editor / Experimental ── */
  const c2 = card('Writing', 'pencil');
  classRow(c2, 'Typewriter scroll', 'Keep the cursor vertically centered while typing', 'typewriterMode', 'typewriter-mode');
  classRow(c2, 'Focus dimming', 'Dim everything except the current paragraph', 'focusDim', 'focus-dim');
  cfgRow(c2, 'Live readability', 'Show the Flesch-Kincaid score while typing', 'liveMetrics');
  root.appendChild(c2);

  /* ── Typing ── */
  const c3 = card('Typing', 'columns');
  const w = document.createElement('select');
  w.className = 'sel';
  [['narrow','Narrow'],['classic','Classic'],['wide','Wide'],['full','Full width']].forEach(function(p){
    const o = document.createElement('option');
    o.value = p[0]; o.textContent = p[1];
    if(p[0] === S.config.editorWidth) o.selected = true;
    w.appendChild(o);
  });
  w.onchange = function(){ S.config.editorWidth = w.value; applyConfig('editorWidth'); save(); };
  c3.appendChild(row('Canvas width', '', w));

  const spell = document.createElement('div');
  spell.className = 'tgl';
  spell.classList.toggle('on', S.config.spellCheck);
  spell.onclick = function(){
    S.config.spellCheck = !S.config.spellCheck;
    spell.classList.toggle('on', S.config.spellCheck);
    const ed = $('editor');
    if(ed) ed.setAttribute('spellcheck', S.config.spellCheck);
    save();
  };
  c3.appendChild(row('Spell check', 'Browser spell check in the editor', spell));

  const quotes = document.createElement('div');
  quotes.className = 'tgl';
  quotes.classList.toggle('on', S.config.smartQuotes);
  quotes.onclick = function(){
    S.config.smartQuotes = !S.config.smartQuotes;
    quotes.classList.toggle('on', S.config.smartQuotes);
    save();
  };
  c3.appendChild(row('Smart quotes', 'Convert straight quotes to curly', quotes));
  root.appendChild(c3);

  /* ── Autocomplete ── */
  const c4 = card('Autocomplete', 'magic');
  cfgRow(c4, 'Word suggestions', 'Complete the word as you type, from your own text — Tab or → takes it', 'autocomplete');
  cfgRow(c4, 'AI ghost text', 'Show the AI continuation as you pause', 'ghostText');
  cfgRow(c4, 'Suggestion chips', 'Quick actions along the bottom', 'suggestionChips');
  root.appendChild(c4);
};

/* ═══ Custom → Right-click menu ═══
   The AI menu that opens when you right-click the round button is the same
   seven buttons on every page; this is where you take out the ones you
   never use. (This card is NOT what the “Right-click” name in the sidebar
   is about — the Custom page itself holds your own writer switches.) */
const SF_RC_ACTIONS = [
  { k:'fixGrammar', label:'Fix grammar',   desc:'Tidy spelling, punctuation and agreement' },
  { k:'improve',    label:'Improve',       desc:'Rewrite the passage better' },
  { k:'rewrite',    label:'Rewrite',       desc:'Say the same thing another way' },
  { k:'continue',   label:'Continue',      desc:'Keep writing from where it stops' },
  { k:'expand',     label:'Expand',        desc:'Draw out what is already there' },
  { k:'summarize',  label:'Summarize',     desc:'Condense the passage' }
];

function sfRightClick(){
  if(!S.config.rightClick || typeof S.config.rightClick !== 'object') S.config.rightClick = {};
  const rc = S.config.rightClick;
  if(!rc.actions || typeof rc.actions !== 'object') rc.actions = {};
  if(typeof rc.translate   !== 'boolean') rc.translate   = true;
  if(typeof rc.pageOptions !== 'boolean') rc.pageOptions = true;
  if(typeof rc.chat         !== 'boolean') rc.chat        = true;
  return rc;
}
window.sfRightClick = sfRightClick;
window.sfRcOn = function(k){ return sfRightClick().actions[k] !== false; };

SETTINGS.renderers.custom = function(root){
  const rc = sfRightClick();

  /* ═══ YOUR SWITCHES ═══
     Overlay · Remixing · What you like · Intermixing. They used to live in
     the little panel that opens when you right-click the Settings button;
     they are Settings of their own now, with their controls beside them. */
  const applyCfg = function(k){ try{ if(typeof applyConfig === 'function') applyConfig(k); }catch(e){} };
  const wrap = function(){ const d = document.createElement('div'); d.className = 'cust-inline'; return d; };
  const tgl = function(on, fn){
    const t = document.createElement('div');
    t.className = 'tgl';
    t.classList.toggle('on', !!on);
    t.onclick = function(e){ e.stopPropagation(); fn(t); };
    return t;
  };
  const sel = function(pairs, value, onPick){
    const s = document.createElement('select');
    s.className = 'sel';
    pairs.forEach(function(p){
      const o = document.createElement('option');
      o.value = p[0]; o.textContent = p[1];
      if(String(p[0]) === String(value)) o.selected = true;
      s.appendChild(o);
    });
    s.onchange = function(){ onPick(s.value); save(); };
    return s;
  };
  const btn = function(icon, label, fn){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost';
    b.innerHTML = '<i class="bi bi-' + icon + '"></i> ' + label;
    b.onclick = fn;
    return b;
  };

  const c0 = card('Your switches', 'sliders');

  /* Overlay */
  const ovWrap = wrap();
  if(!S.config.overlay) S.config.overlay = {};
  ovWrap.appendChild(sel([[480,'480 px'],[560,'560 px'],[640,'640 px'],[760,'760 px'],[900,'900 px']],
    S.config.overlay.w || 640,
    function(v){ S.config.overlay.w = parseInt(v, 10) || 640; if(window.overlayShow) overlayShow(true); }));
  ovWrap.appendChild(sel([[320,'320 px'],[420,'420 px'],[500,'500 px'],[600,'600 px']],
    S.config.overlay.h || 420,
    function(v){ S.config.overlay.h = parseInt(v, 10) || 420; if(window.overlayShow) overlayShow(true); }));
  ovWrap.appendChild(btn('arrow-clockwise', 'Re-centre', function(){
    S.config.overlay.x = null; S.config.overlay.y = null;
    save();
    if(window.overlayShow) overlayShow(true);
    toast('Overlay re-centred');
  }));
  c0.appendChild(row('Overlay', 'A floating pane over the whole app — width, height and where it sits',
    [tgl(S.config.expOverlay, function(t){
        S.config.expOverlay = !S.config.expOverlay;
        t.classList.toggle('on', !!S.config.expOverlay);
        applyCfg('expOverlay'); save();
      }), ovWrap]));

  /* Remixing */
  c0.appendChild(row('Remixing', 'Tidy your own text into proper paragraphs as you write',
    [tgl(S.config.expOrganize, function(t){
        S.config.expOrganize = !S.config.expOrganize;
        t.classList.toggle('on', !!S.config.expOrganize);
        save();
      }),
     btn('list-nested', 'Organise now', function(){
       closeModal();
       if(window.AI_FNS && window.AI_FNS.organize) window.AI_FNS.organize();
       else toast('Open the editor first', 'warn');
     })]));

  /* What you like */
  if(!S.config.plugins) S.config.plugins = {};
  c0.appendChild(row('What you like', 'Type Hinglish, get Devanagari as you go',
    [tgl(S.config.plugins.hinglish !== false, function(t){
        S.config.plugins.hinglish = S.config.plugins.hinglish === false;
        t.classList.toggle('on', S.config.plugins.hinglish !== false);
        applyCfg('plugins'); save();
      }),
     sel([['devanagari','Hindi (देवनागरी)'],['english','English']],
         (S.config.liveBarTarget === 'english') ? 'english' : 'devanagari',
         function(v){ S.config.liveBarTarget = v; })]));

  /* Intermixing — three faces taking turns */
  if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['', '', ''];
  const mixWrap = wrap();
  mixWrap.classList.add('cust-mix-wrap');
  /* the three faces on one line, the rotation on its own line under them */
  const mixFaces = wrap();
  /* Hand-written faces (Caveat, Dancing Script — the script/manuscript
     faces) are left out on purpose: a script face taking its turn mid-word
     is unreadable, so Intermixing offers the reading faces only. */
  const fontPairs = [['','Editor font']].concat((window.FONTS || [])
    .filter(function(f){ return f.g !== 'Hand'; })
    .map(function(f){ return [f.name, f.name]; }));
  [0,1,2].forEach(function(i){
    mixFaces.appendChild(sel(fontPairs, S.config.mixedFonts[i] || '', function(v){
      S.config.mixedFonts[i] = v;
      paintMix();
    }));
  });
  mixWrap.appendChild(mixFaces);

  /* A live preview, because a font setting you cannot see is a setting you
     cannot tell apart from a broken one: the sample line below takes the
     turns exactly the way your typing will. */
  const mixPreview = document.createElement('div');
  mixPreview.className = 'mix-preview';
  const mixLegend = document.createElement('div');
  mixLegend.className = 'mix-legend';

  const fontList = function(){ return (window.FONTS || []); };
  const faceByName = function(name){
    return fontList().filter(function(x){ return x.name === name; })[0] || null;
  };
  function mixStack(name){
    if(!name) return '';
    const f = faceByName(name);
    return f ? f.f : "'" + name + "', serif";
  }
  /* The three faces the sample falls back on when a slot is left on
     “Editor font” (or names something that is no longer in the list): a
     serif, a sans and a mono, so the sample can never read as one face.
     A mix you cannot see is exactly what made this setting look broken. */
  const mixFallback = function(){
    const first = function(g){ const l = fontList().filter(function(f){ return f.g === g; }); return l[0] ? l[0].name : ''; };
    return [first('Serif'), first('Sans'), first('Mono')];
  };
  const mixFaces3 = function(){
    const fb = mixFallback();
    return [0,1,2].map(function(i){
      const chosen = (S.config.mixedFonts || [])[i];
      return (chosen && faceByName(chosen)) ? chosen : (fb[i] || 'Editor font');
    });
  };
  function paintMix(){
    if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['', '', ''];
    const sc = (S.config.mixedFontScope === 'word' || S.config.mixedFontScope === 'sentence')
      ? S.config.mixedFontScope : 'letter';
    const faces = mixFaces3();
    const stackAt = function(i){
      const s = mixStack(faces[i % 3]);
      return s ? 'font-family:' + s : 'font-family:inherit';
    };
    const one = 'The rain has not stopped for a week.';
    const two = 'You kept the receipt.';
    if(sc === 'word'){
      mixPreview.innerHTML = (one + ' ' + two).split(' ').map(function(w, i){
        return '<span style="' + stackAt(i) + '">' + w + '</span>';
      }).join(' ');
    }else if(sc === 'sentence'){
      mixPreview.innerHTML = '<span style="' + stackAt(0) + '">' + one + '</span> '
        + '<span style="' + stackAt(1) + '">' + two + '</span>';
    }else{
      mixPreview.innerHTML = one.split('').map(function(ch, i){
        return '<span style="' + stackAt(i) + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
      }).join('');
    }
    /* which face is which, so the sample can be read rather than guessed */
    mixLegend.innerHTML = faces.map(function(n, i){
      return '<span><b>' + (i + 1) + '</b> ' + esc(n) + '</span>';
    }).join('');
    const on = !!S.config.expMixedFonts;
    mixPreview.classList.toggle('off', !on);
    mixPreview.setAttribute('title', on
      ? 'This is what your typing does'
      : 'Switch Intermixing on to write with it');
  }

  const scopes = ['letter','word','sentence'];
  if(scopes.indexOf(S.config.mixedFontScope) < 0) S.config.mixedFontScope = 'letter';
  const mixScope = wrap();
  mixScope.appendChild(sel([['letter','Letter randomisation'],['word','Word randomisation'],['sentence','Sentence randomisation']],
    S.config.mixedFontScope,
    function(v){ S.config.mixedFontScope = v; paintMix(); }));
  mixWrap.appendChild(mixScope);
  mixWrap.appendChild(mixPreview);
  mixWrap.appendChild(mixLegend);
  paintMix();
  c0.appendChild(row('Intermixing', 'Three fonts take turns as you type, in the editor — the preview below shows it',      [tgl(S.config.expMixedFonts, function(t){
        S.config.expMixedFonts = !S.config.expMixedFonts;
        t.classList.toggle('on', !!S.config.expMixedFonts);
        applyCfg('expMixedFonts');
        paintMix();
        save();
      }), mixWrap]));
  root.appendChild(c0);
};

/* The round-button menu's switches (its actions, Translate, per-page
   options, the chat shortcut) are no longer offered in Settings: the
   panel shows everything the page has. The saved prefs and the
   sfRightClick() reader stay, so nothing that already chose them
   changes; there is simply no switch to turn them off any more. */

SETTINGS.renderers.plugins = function(root){
  /* the word the writer has selected, so a lookup opens on it */
  const pickedWord = function(){
    try{
      const sel = window.getSelection();
      const txt = sel ? String(sel).trim() : '';
      return txt.split(/\s+/)[0] || '';
    }catch(e){ return ''; }
  };

  /* open the plugin's own floating panel, pre-filled with the selection */
  const openTool = function(src, fallbackMessage){
    const word = pickedWord();

    /* the floating panel (plugin-panels.js) — one card per plugin */
    if(window.SF_PLUGINS && SF_PLUGINS.open){
      closeModal();
      SF_PLUGINS.open(src, word);
      return;
    }
    if(!(window.PLUGINS && PLUGINS.openWebSearch)){
      toast(fallbackMessage || 'That tool is not available', 'err');
      return;
    }
    closeModal();
    PLUGINS.openWebSearch();
    const q = document.getElementById('wsQuery');
    if(q && word){ q.value = word; q.focus(); }
    const chip = document.querySelector('[data-ws-src="' + src + '"]');
    if(chip){
      if(!chip.classList.contains('on')) chip.click();
      else if(word) PLUGINS.runSearch(src);
    }
  };

  const on = function(k){ return S.config.plugins[k] !== false; };
  const need = function(k, name){
    if(on(k)) return true;
    toast('Turn ' + name + ' on first', 'warn');
    return false;
  };

  /* ── the plugins, grouped the way the rest of Settings is grouped ──
     Only tools that are not already in the app live here: the Calculator
     (Utilities → Calculator), the word goal (Utilities → Word goal) and
     the reading-time readout (status bar) had their own homes. ── */
  /* The Research group (Web search · Wikipedia · Image search · Quotes ·
     Public-domain books) is gone — the writer asked for the research
     plugins out of the app. */
  const GROUPS = [
    { title:'Words', icon:'book',
      note:'Definitions and word-finding for the sentence in front of you.',
      items:[
        { k:'dictionary', name:'Dictionary',         src:'dict',  icon:'file-text',
          desc:'Definitions, phonetics, examples' },
        { k:'thesaurus',  name:'Thesaurus & rhymes', src:'thes',  icon:'shuffle',
          desc:'Synonyms, antonyms, rhymes' },
        { k:'idioms',     name:'Idioms',             src:'idiom', icon:'chat-quote',
          desc:'What a phrase actually means' }
      ] },
    { title:'Voice & reading', icon:'volume-up',
      note:'Dictate instead of type, and have the page read back to you.',
      items:[
        { k:'voice',      name:'Voice dictation',    icon:'mic',
          desc:'Speak instead of type',
          run:function(){
            if(!need('voice', 'Voice dictation')) return;
            if(!(window.PLUGINS && PLUGINS.toggleVoice)){ toast('Voice is not available', 'err'); return; }
            closeModal(); PLUGINS.toggleVoice();
          } },
        { k:'tts',        name:'Text-to-speech',     icon:'volume-up',
          desc:'Read the editor or your selection aloud',
          run:function(){
            if(!need('tts', 'Text-to-speech')) return;
            if(!(window.PLUGINS && PLUGINS.speakEditor)){ toast('Speech is not available', 'err'); return; }
            PLUGINS.speakEditor();
          } },
        { k:'hinglish',   name:'Live transliteration', icon:'keyboard',
          desc:'Type Hinglish, get Devanagari as you go',
          run:function(){
            if(!need('hinglish', 'Live transliteration')) return;
            if(!(window.PLUGINS && PLUGINS.openLiveBar)){ toast('The live bar is not available', 'err'); return; }
            closeModal(); PLUGINS.openLiveBar();
          } }
      ] }
  ];

  /* one switch per plugin, and the whole row opens that plugin's own
     floating panel — nothing to configure past on / off. */
  GROUPS.forEach(function(g){
    const c = card(g.title, g.icon);
    if(g.note){
      const n = document.createElement('div');
      n.className = 'tiny muted';
      n.style.margin = '-2px 0 6px';
      n.textContent = g.note;
      c.appendChild(n);
    }
    g.items.forEach(function(p){
      const t = document.createElement('div');
      t.className = 'tgl';
      t.classList.toggle('on', on(p.k));
      t.onclick = function(e){
        e.stopPropagation();
        S.config.plugins[p.k] = !on(p.k);
        t.classList.toggle('on', S.config.plugins[p.k]);
        save();
      };

      const open = function(){
        if(p.run){ p.run(); return; }
        if(!need(p.k, p.name)) return;
        if(window.SF_PLUGINS && SF_PLUGINS.open){ closeModal(); SF_PLUGINS.open(p.src); return; }
        closeModal();
        if(window.PLUGINS && PLUGINS.openWebSearch){
          PLUGINS.openWebSearch();
          const chip = document.querySelector('[data-ws-src="' + p.src + '"]');
          if(chip) chip.click();
        }
      };

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost';
      btn.title = 'Open ' + p.name;
      btn.innerHTML = '<i class="bi bi-' + (p.icon || 'box-arrow-up-right') + '"></i> Open';
      btn.onclick = open;

      const r = row(p.name, p.desc, [t, btn]);
      r.style.cursor = 'pointer';
      r.addEventListener('click', function(e){ if(e.target.closest('.tgl, button')) return; open(); });
      c.appendChild(r);
    });
    root.appendChild(c);
  });
};

// ═══ LANGUAGE — the interface language, the language you write in, and
//     the language AI answers in. ═══
SETTINGS.renderers.language = function(root){
  const ui = card('Interface language', 'translate');
  const uiSel = document.createElement('select');
  uiSel.className = 'sel';
  uiSel.style.minWidth = '220px';
  (window.UI_LANGS || []).forEach(function(l){
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = l.name + (l.native && l.native !== l.name ? ' — ' + l.native : '');
    if((S.config.uiLang || 'en') === l.code) o.selected = true;
    uiSel.appendChild(o);
  });
  uiSel.onchange = function(){
    S.config.uiLang = uiSel.value;
    S.config.uiRtl = (uiSel.value === 'ar' || uiSel.value === 'ur');
    save();
    if(window.applyLang) applyLang();
    renderSetTab('language');
    if(typeof goPage === 'function') goPage(S.page);
    const l = (window.UI_LANGS || []).find(function(x){ return x.code === S.config.uiLang; });
    toast('Interface language: ' + (l ? l.name : S.config.uiLang));
  };
  ui.appendChild(row('Language of the app', 'Page and menu names switch language, right-to-left included.', uiSel));

  const note = document.createElement('div');
  note.className = 'tiny muted';
  note.style.marginTop = '4px';
  note.textContent = 'Page names, the page menu and the breadcrumb follow this setting today. The writing tools, prompts and panels are still in English.';
  ui.appendChild(note);
  root.appendChild(ui);

  // ── the language you write in ──
  const wr = card('Writing language', 'pencil');
  const wrSel = document.createElement('select');
  wrSel.className = 'sel';
  wrSel.style.minWidth = '220px';
    const all = [].concat(window.LANGS_INDIA || [], (window.LANGS_INTL || []).filter(l => l.code === 'en'));

  const seen = {};
  all.forEach(function(l){
    if(seen[l.code]) return;
    seen[l.code] = 1;
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = (l.native ? l.native + ' — ' : '') + l.name;
    if((S.config.defaultLang || 'en') === l.code) o.selected = true;
    wrSel.appendChild(o);
  });
  wrSel.onchange = function(){
    S.config.defaultLang = wrSel.value;
    save();
    document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]').forEach(function(el){
      el.setAttribute('lang', S.config.defaultLang);
    });
    toast('Writing language set');
  };
  wr.appendChild(row('You write in', 'Used for spell check, the dictionary and the AI context.', wrSel));
  /* spell check lives in Typography only — not twice */
  root.appendChild(wr);

  // ── the language AI answers in ──
  const out = card('AI replies in', 'stars');
  const outSel = document.createElement('select');
  outSel.className = 'sel';
  outSel.style.minWidth = '220px';
      [ ['auto','Match the writing language'], ['en','English'], ['hi','हिन्दी — Hindi'] ].forEach(function(pair){

    const o = document.createElement('option');
    o.value = pair[0];
    o.textContent = pair[1];
    if((S.config.outputLang || 'auto') === pair[0]) o.selected = true;
    outSel.appendChild(o);
  });
  outSel.onchange = function(){ S.config.outputLang = outSel.value; save(); toast('AI reply language set'); };
  out.appendChild(row('Reply language', 'Improve, rewrite and translate follow this.', outSel));
  root.appendChild(out);
};

// ═══ Per-mode Format page ═══
SETTINGS.renderFormat = function(){
  const root = $('formatBody');
  if(!root) return;
  root.innerHTML = '';

  const mode = MODES.find(m => m.id === S.mode);
  const c1 = card('Writing mode', 'collection');
  const grid = document.createElement('div');
  grid.className = 'grid-auto';
  MODES.forEach(m => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (m.id === S.mode ? ' on' : '');
    tile.dataset.modeSwitch = m.id;
    tile.innerHTML = `<i class="bi bi-${m.icon}" style="font-size:24px;color:var(--accent-2);display:block;margin-bottom:8px;"></i>
      <div style="font-size:13px;font-weight:700;">${m.name}</div>
      <div style="font-size:10.5px;color:var(--ink-3);margin-top:2px;">${m.desc}</div>`;
    grid.appendChild(tile);
  });
  grid.addEventListener('click', e => {
    const el = e.target.closest('[data-mode-switch]');
    if(el) switchMode(el.dataset.modeSwitch);
  });
  c1.appendChild(grid);
  root.appendChild(c1);

  const c2 = card('Canvas layout', 'layout-text-window');
  const layouts = [
    ['classic', 'Classic', 'Centered 760px'],
    ['wide', 'Wide', 'Up to 1100px'],
    ['narrow', 'Narrow', 'Focused 540px'],
    ['fullbleed', 'Full bleed', 'Edge to edge'],
    ['typewriter', 'Typewriter', 'Cursor always centered'],
    ['twocolumn', 'Two column', 'Newspaper feel']
  ];
  const lg = document.createElement('div');
  lg.className = 'grid-auto';
  layouts.forEach(([id, name, desc]) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (id === S.config.layout ? ' on' : '');
    tile.dataset.layoutPick = id;
    tile.innerHTML = `<div style="font-size:13px;font-weight:700;">${name}</div>
      <div style="font-size:10.5px;color:var(--ink-3);margin-top:4px;">${desc}</div>`;
    lg.appendChild(tile);
  });
  lg.addEventListener('click', e => {
    const el = e.target.closest('[data-layout-pick]');
    if(!el) return;
    S.config.layout = el.dataset.layoutPick;
    document.body.setAttribute('data-layout', S.config.layout);
    document.querySelectorAll('[data-layout-pick]').forEach(x => x.classList.toggle('on', x.dataset.layoutPick === S.config.layout));
    save();
  });
  c2.appendChild(lg);
  root.appendChild(c2);

  const c3 = card('Font override', 'fonts');
  const fsel = document.createElement('select');
  fsel.className = 'sel';
  fsel.style.minWidth = '200px';
  const defaults = document.createElement('option');
  defaults.value = '';
  defaults.textContent = `Auto (${mode?.name || 'mode'} default)`;
  fsel.appendChild(defaults);
  FONTS.forEach(f => {
    const o = document.createElement('option');
    o.value = f.name; o.textContent = f.name;
    if(f.name === S.config.font) o.selected = true;
    fsel.appendChild(o);
  });
  fsel.onchange = () => { S.config.font = fsel.value; applyConfig('font'); save(); };
  c3.appendChild(row('Override font', 'Leave on Auto to use the mode default', fsel));

  const size = document.createElement('input');
  size.type = 'number';
  size.className = 'inp sm';
  size.value = S.config.fontSize;
  size.oninput = () => { S.config.fontSize = parseInt(size.value) || 17; applyConfig('fontSize'); save(); };
  c3.appendChild(row('Font size', '', size));
  root.appendChild(c3);

  const c4 = card('Quick access', 'lightning');
  const quick = document.createElement('div');
  quick.className = 'chips';
  ['write','read','draft','notebook','plan','board','timeline','cast','research','canvas'].forEach(pid => {
    const p = PAGES.find(x => x.id === pid);
    if(!p) return;
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.page = p.id;
    b.innerHTML = `<i class="bi bi-${p.icon}"></i> ${p.name}`;
    quick.appendChild(b);
  });
  c4.appendChild(quick);
  root.appendChild(c4);
};

// ═══ Global click delegation for settings ═══
document.addEventListener('click', e => {
  const t = e.target;

  const tabEl = t.closest('[data-set-tab]');
  if(tabEl){ renderSetTab(tabEl.dataset.setTab); return; }

  if(t.closest('[data-act="set-close"]')){ closeModal(); return; }

  if(t.closest('[data-act="set-save"]')){
    save();
    toast('Settings saved');
    closeModal();
    return;
  }

  // Format page shortcuts
  const pgEl = t.closest('[data-page]');
  if(pgEl && pgEl.classList.contains('chip')){ goPage(pgEl.dataset.page); return; }
}, true);

// ═══ Expose ═══
window.SETTINGS = SETTINGS;
window.enhanceSelects = enhanceSelects;
window.renderSetTab = renderSetTab;
window.applyConfig = applyConfig;
window.applyAllConfig = applyAllConfig;
window.buildModelDropdown = buildModelDropdown;
window.getDefaultModels = getDefaultModels;
window.row = row;
window.card = card;

console.log('%c ✓ settings.js loaded', 'color:#10b981;font-weight:600;');


/* ══════════ panels.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Panels
   Search modal · Video panel (Electron) · Music panel (Vercel-flat)
   ═══════════════════════════════════════════════════════════ */

function isElectron(){
  return !!(window.electronAPI || (typeof process !== 'undefined' && process.versions && process.versions.electron));
}

// ═══ Video panel ═══
function openVideoPanel(){
  const videoPanel = document.getElementById('videoPanel');
  const musicPanel = document.getElementById('musicPanel');
  const playlistPanel = document.getElementById('videoPlaylistPanel');
  if(musicPanel) musicPanel.hidden = true;
  if(playlistPanel) playlistPanel.hidden = true;
  if(!videoPanel) return;
  videoPanel.hidden = false;
  clampFloat(videoPanel);
  setTimeout(() => clampFloat(videoPanel), 60);
}

function closeVideoPanel(){
  const panel = document.getElementById('videoPanel');
  if(panel) panel.hidden = true;
}

// ═══ Music panel ═══
function openMusicPanel(){
  const musicPanel    = document.getElementById('musicPanel');
  const videoPanel    = document.getElementById('videoPanel');
  const playlistPanel = document.getElementById('videoPlaylistPanel');
  if(videoPanel)    videoPanel.hidden    = true;
  if(playlistPanel) playlistPanel.hidden = true;
  if(!musicPanel) return;
  musicPanel.hidden = false;
  if(typeof renderMusicPlayer === 'function') renderMusicPlayer();
  clampFloat(musicPanel);
  setTimeout(() => {
    clampFloat(musicPanel);
    if(typeof initPanelDrag === 'function') initPanelDrag('musicPanel', 'musicPanelHead');
    if(typeof initPanelResize === 'function') initPanelResize('musicPanel', 'musicResize');
    if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
    if(typeof startBeatVisualizer === 'function') startBeatVisualizer();
  }, 30);
}

function closeMusicPanel(){
  const panel = document.getElementById('musicPanel');
  if(panel) panel.hidden = true;
}
// ═══ URL validation ═══
function isPlayableUrl(input){
  if(!input) return false;
  if(input.startsWith('http://')) return true;
  if(input.startsWith('https://')) return true;
  if(input.startsWith('blob:')) return true;
  if(input.startsWith('file://') && isElectron()) return true;
  if(input.startsWith('/') && isElectron()) return true;
  return false;
}

// ═══ Keep a floating panel inside the viewport ═══
// Panels remember nothing about where they were opened, and inside an overlay
// pane / a small window a fixed-size player used to hang off the edge. This
// pulls it back in every time it opens.
function clampFloat(el, pad){
  if(!el || el.hidden) return;
  const p = pad || 10;
  const r = el.getBoundingClientRect();
  if(!r.width || !r.height) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = r.left, y = r.top, moved = false;
  if(r.right  > vw - p){ x = Math.max(p, vw - r.width  - p); moved = true; }
  if(r.bottom > vh - p){ y = Math.max(p, vh - r.height - p); moved = true; }
  if(x < p){ x = p; moved = true; }
  if(y < p){ y = p; moved = true; }
  if(!moved) return;
  el.style.transform = 'none';
  el.style.left = Math.round(x) + 'px';
  el.style.top  = Math.round(y) + 'px';
  el.style.right = 'auto';
}
window.clampFloat = clampFloat;

// ═══ Drag panel by header ═══
function initPanelDrag(panelId, headId){
  const panel = document.getElementById(panelId);
  const head = document.getElementById(headId);
  if(!panel || !head) return;
  let dragging = false, ox = 0, oy = 0;
  head.addEventListener('mousedown', (e) => {
    if(e.target.closest('button')) return;
    if(e.target.closest('input')) return;
    dragging = true;
    const r = panel.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    panel.style.transform = 'none';
    panel.style.left = r.left + 'px';
    panel.style.top = r.top + 'px';
    panel.style.right = 'auto';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if(!dragging) return;
    panel.style.left = Math.max(8, Math.min(window.innerWidth - 60, e.clientX - ox)) + 'px';
    panel.style.top = Math.max(8, Math.min(window.innerHeight - 40, e.clientY - oy)) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
}

// ═══ Resize panel by handle ═══
function initPanelResize(panelId, handleId){
  const panel = document.getElementById(panelId);
  const handle = document.getElementById(handleId);
  if(!panel || !handle) return;
  if(handle.dataset.resizeWired === '1') return;   // guard against double-binding
  handle.dataset.resizeWired = '1';

  let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if(!resizing) return;
    const minW = (panelId === 'musicPanel') ? 360 : 300;
    const minH = (panelId === 'musicPanel') ? 600 : 240;
    const newW = Math.max(minW, startW + (e.clientX - startX));
    const newH = Math.max(minH, startH + (e.clientY - startY));
    panel.style.width = newW + 'px';
    panel.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', () => {
    if(!resizing) return;
    resizing = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });
}

// ═══ Click routing ═══
// Player button — left = music panel, right = video panel
// (mousedown so a right-click open feels instant; context menu suppressed)
document.addEventListener('mousedown', (e) => {
  if(!e.target.closest('[data-act="open-music"]')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.button === 2) openVideoPanel();
  else               openMusicPanel();
}, true);

document.addEventListener('contextmenu', (e) => {
  if(!e.target.closest('[data-act="open-music"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('click', (e) => {
  const t = e.target;

    // Video panel close
  if(t.closest('[data-act="video-close"]')){ closeVideoPanel(); return; }

  // Music panel
  if(t.closest('[data-act="music-close"]')){ closeMusicPanel(); return; }

    if(t.closest('[data-act="music-plus"]')){
    const w = document.getElementById('musicUrlWrap');
    const inp = document.getElementById('musicUrlInput');
    if(!w) return;
    if(w.hidden){
      w.hidden = false;
      if(inp){ inp.value = ''; setTimeout(() => inp.focus(), 30); }
    } else {
      const u = inp?.value.trim() || '';
      w.hidden = true;
      if(inp) inp.value = '';               // clear BEFORE add so Enter can't double-fire
      if(isPlayableUrl(u)){
        if(typeof musicAddURL === 'function') musicAddURL(u);
        if(typeof renderMusicPlayer === 'function') renderMusicPlayer();
      } else if(u){
        toast('Not a valid URL', 'warn');
      }
    }
    return;
  }
}, true);

// Right-click on + → open file picker
document.addEventListener('contextmenu', (e) => {
  const t = e.target;
  const plusBtn = t.closest('[data-act="music-plus"]');
  if(plusBtn){
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = true;
    input.onchange = (ev) => {
      const files = ev.target.files;
      if(!files || !files.length) return;
      if(typeof musicAddFiles === 'function') musicAddFiles(files);
    };
    input.click();
    return;
  }
}, true);

// Right-click on video + → open file picker for video files
document.addEventListener('contextmenu', (e) => {
  const plusBtn = e.target.closest('[data-act="video-plus"]');
  if(!plusBtn) return;
  e.preventDefault();
  e.stopPropagation();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,.mkv,.avi,.mov,.webm,.m4v';
  input.multiple = false;
  input.onchange = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    videoPlayFile(file);
  };
  input.click();
}, true);

// Enter key on panel inputs
document.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter') return;
  if(e.target.id === 'musicUrlInput'){ e.preventDefault(); document.querySelector('[data-act="music-plus"]')?.click(); return; }
  if(e.target.id === 'videoSearchInput'){ e.preventDefault(); document.querySelector('[data-act="video-plus"]')?.click(); return; }
});

// Init drag + resize
setTimeout(() => {
  initPanelDrag('videoPanel', 'videoPanelHead');
  initPanelDrag('musicPanel', 'musicPanelHead');
  // Video panel is fixed landscape (880×560) — resize handle removed (640px is the playlist panel)
  initPanelResize('musicPanel', 'musicResize');
}, 500);

// Expose
window.openVideoPanel = openVideoPanel;
window.openMusicPanel = openMusicPanel;
window.closeMusicPanel = closeMusicPanel;
window.isElectron = isElectron;

console.log('%c ✓ panels.js loaded', 'color:#10b981;font-weight:600;');

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — persistent storage
// ═══════════════════════════════════════════════════════════

S.config.videoPlaylist = S.config.videoPlaylist || [];

// ═══════════════════════════════════════════════════════════
//   PLAYLIST DE-DUPE
//   One identity per item so the same song/video can't land in a playlist
//   twice, whether it was added from a URL or picked from the file manager.
// ═══════════════════════════════════════════════════════════

// Last path segment without query/hash, lower-cased; %xx escapes decoded so
// "my%20song.mp3" matches the same file picked from disk ("my song.mp3")
function playlistBaseName(src){
  const last = String(src || '').split(/[?#]/)[0].replace(/\\/g, '/').split('/').pop().trim();
  let out = last.toLowerCase();
  try { out = decodeURIComponent(out); } catch(e) { /* malformed escape — keep raw */ }
  return out;
}

// Real source when we can resolve one, else the plain file name
function playlistFileKey(file){
  if(!file) return '';
  let path = null;
  if(window.electronPath && window.electronPath.getPathForFile){
    const p = window.electronPath.getPathForFile(file);
    if(p) path = 'file://' + String(p).replace(/\\/g, '/');
  }
  if(!path && file.path) path = 'file://' + String(file.path).replace(/\\/g, '/');
  return path || file.name || '';
}

// Browser picks get a fresh object URL every time, so identity for those
// rests on the file itself: name + size + mtime.
function playlistFileStamp(file){
  if(!file) return '';
  return [file.name, file.size, file.lastModified].join(':');
}

// Is this source already in the list? Same URL/path, same file fingerprint,
// or the same media header — the file's own name (before any rename), with or
// without its extension. Renaming a row or pasting a URL under a different
// title can't sneak a copy in; the underlying file still recognises itself.
// Two real on-disk paths only match exactly, so same-named files in different
// folders stay distinct.
function playlistHeaderOf(entry){
  if(!entry) return '';
  const src = entry.srcKey || entry.url || '';
  const base = playlistBaseName(src);
  if(!base) return '';
  const noExt = base.replace(/\.[a-z0-9]{1,5}$/i, '');
  return noExt || base;
}

function playlistHasDuplicate(list, key, stamp, header){
  if(!list || !list.length || !key) return false;
  const keyIsPath = key.indexOf('file://') === 0;
  const base = playlistBaseName(key);
  const head = header || playlistHeaderOf({ srcKey: key });
  for(let i = 0; i < list.length; i++){
    const t = list[i] || {};
    const other = t.srcKey || t.url || '';
    if(other && other === key) return true;
    if(keyIsPath && other.indexOf('file://') === 0) continue;
    if(stamp && t.srcStamp && t.srcStamp === stamp) return true;
    if(head && other){
      const otherHead = t.srcHeader || playlistHeaderOf(t);
      if(otherHead && otherHead === head) return true;
    }
  }
  return false;
}

// The music add helpers live in app.js, which loads after this file, so wrap
// them once the DOM is ready — duplicates are refused from both doors (a
// pasted URL and the file manager) the same way the video playlist does it.
function installMusicDedupe(){
  if(typeof window.musicAddURL !== 'function' || window.musicAddURL.__dedupe) return;

  const addURL = window.musicAddURL;
  window.musicAddURL = function(url){
    if(!url) return;
    if(playlistHasDuplicate(Music.playlist, url)){
      toast('Duplicate', 'warn');
      return;
    }
    addURL(url);
  };
  window.musicAddURL.__dedupe = true;

  const addFiles = window.musicAddFiles;
  if(typeof addFiles === 'function'){
    window.musicAddFiles = function(files){
      const all = Array.from(files || []);
      const accepted = [];   // also check within the batch itself
      const fresh = all.filter(function(f){
        const key = playlistFileKey(f);
        const stamp = playlistFileStamp(f);
        if(playlistHasDuplicate(Music.playlist, key, stamp)) return false;
        for(let i = 0; i < accepted.length; i++){
          if(playlistHasDuplicate(accepted, key, stamp)) return false;
        }
        accepted.push({ srcKey: key, srcStamp: stamp });
        return true;
      });
      const dupes = all.length - fresh.length;
      if(!fresh.length){
        toast('Duplicate', 'warn');
        return;
      }
      const before = Music.playlist.length;
      addFiles(fresh);
      // Stamp the new rows so the same file is recognisable next time
      const added = Music.playlist.slice(before);
      for(let i = 0; i < added.length && i < fresh.length; i++){
        added[i].srcKey = playlistFileKey(fresh[i]);
        added[i].srcStamp = playlistFileStamp(fresh[i]);
        added[i].srcHeader = playlistHeaderOf({ srcKey: added[i].srcKey });
      }
      S.config.musicPlaylist = Music.playlist;
      save();
      if(dupes) toast(dupes + ' duplicate' + (dupes > 1 ? 's' : '') + ' skipped', 'warn');
    };
    window.musicAddFiles.__dedupe = true;
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', installMusicDedupe);
} else {
  installMusicDedupe();
}
// Catch-all for the case where app.js is still parsing when the DOM is ready
if(typeof window.addEventListener === 'function') window.addEventListener('load', installMusicDedupe);

function videoPlaylistAdd(url, name, source, srcKey, srcStamp){
  if(!url) return;
  const key = srcKey || url;
  if(playlistHasDuplicate(S.config.videoPlaylist, key, srcStamp)){
    toast('Duplicate', 'warn');
    return;
  }
  if(S.config.videoPlaylist.length >= VP_PER_PAGE * VP_MAX_PAGES){
    toast('Playlist full (max ' + (VP_PER_PAGE * VP_MAX_PAGES) + ' videos)', 'warn');
    return;
  }
  S.config.videoPlaylist.push({
    url: url,
    name: name || url.split('/').pop() || 'Untitled',
    source: source || 'url',
    srcKey: key,
    srcStamp: srcStamp || '',
    srcHeader: playlistHeaderOf({ srcKey: key }),
    added: Date.now()
  });
  save();
  renderVideoPlaylist();
  toast('Added to playlist');
}

function videoPlaylistRemove(index){
  S.config.videoPlaylist.splice(index, 1);
  save();
  renderVideoPlaylist();
}

// Shared look for the playlist row actions (rename · remove) — same ghost buttons
// the music playlist rows use: borderless, revealed on row hover
const VPL_ACTION_CSS =
  'width:22px;height:22px;display:flex;align-items:center;justify-content:center;' +
  'background:transparent;border:none;color:var(--ink-4);padding:0;' +
  'cursor:pointer;border-radius:var(--r-sm);opacity:0;pointer-events:none;flex-shrink:0;' +
  'transition:opacity 120ms var(--ease), background 100ms var(--ease), color 100ms var(--ease);';

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYER LOGIC
// ═══════════════════════════════════════════════════════════

// ─── Session playlist / history stack ───
const VideoHistory = {
  stack: [],
  index: -1,
  push(action){
    if(!action) return;
    const cur = this.stack[this.index];
    if(cur && cur.type === action.type && cur.value === action.value) return;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(action);
    this.index = this.stack.length - 1;
  },
  prev(){
    if(this.index <= 0) return;
    this.index--;
    replay(this.stack[this.index]);
  },
  next(){
    if(this.index >= this.stack.length - 1) return;
    this.index++;
    replay(this.stack[this.index]);
  },
  current(){
    return this.stack[this.index] || null;
  }
};

function replay(action){
  if(!action) return;
  if(action.type === 'url')  videoPlayDirect(action.value, true);
  if(action.type === 'file') videoPlayDirect(action.value, true);
}

// ─── Input router — direct video URLs only ───
function videoHandleInput(v){
  if(!v) return;
  if(/\.(mp4|webm|m3u8|ogg|mov|mkv|m4v)(\?.*)?$/i.test(v)){
    videoPlaylistAdd(v, null, 'url');
    return;
  }
  toast('Not a valid video URL', 'warn');
}

// ─── Play a direct video URL ───
function videoPlayDirect(url, silent){
  const stage = document.getElementById('videoStage');
  const body  = document.getElementById('videoBody');
  if(!stage) return;

  // Remove old video but keep the floating bar
  const oldV = stage.querySelector('video');
  if(oldV) oldV.remove();

  const v = document.createElement('video');
  v.autoplay = true;
  // No forced CORS mode — direct video URLs usually send no CORS headers,
  // and requesting them makes the browser refuse to load the media at all.
  v.removeAttribute('crossorigin');
  v.dataset.aspect = S.config.videoAspect || 'default';
  v.style.cssText = 'width:100%;height:100%;background:#000;display:block;';
  v.src = url;
  stage.insertBefore(v, stage.firstChild);

  // Hide the empty-state
  const emptyEl = stage.querySelector('.video-empty');
  if(emptyEl) emptyEl.style.display = 'none';

  if(body) body.classList.remove('no-video');

  // Restore volume
  v.volume = (S.config.videoVolume !== undefined) ? S.config.videoVolume : 0.8;
  updateVolumeIcon(v.volume);

  // Keep the selected-row pointer in sync with what is actually loaded, so a
  // stale selection can never hijack the play/pause button.
  const list = S.config.videoPlaylist || [];
  for(let k = 0; k < list.length; k++){
    if(list[k].url === url){ _vpSelectedIndex = k; break; }
  }

  v.play().catch(function(e){
    if(e && e.name === 'AbortError') return;
    console.warn('video:', e);
    setVideoPlayIcon(false);
    if(typeof mediaErrorMessage === 'function') toast(mediaErrorMessage(e, { url: url }), 'err');
  });

  v.addEventListener('timeupdate', function(){
    const dur = v.duration || 0;
    if(dur){
      const seek = document.getElementById('vpSeek');
      if(seek) seek.value = (v.currentTime / dur) * 100;
      const curEl = document.getElementById('vpCur');
      if(curEl) curEl.textContent = fmtTime(v.currentTime);
      const durEl = document.getElementById('vpDur');
      if(durEl) durEl.textContent = fmtTime(dur);
    }
  });
  v.addEventListener('loadedmetadata', function(){
    const durEl = document.getElementById('vpDur');
    if(durEl) durEl.textContent = fmtTime(v.duration);
  });
  v.addEventListener('play',  function(){ setVideoPlayIcon(true);  });
  v.addEventListener('pause', function(){ setVideoPlayIcon(false); });
  v.addEventListener('ended', function(){ setVideoPlayIcon(false); });
  v.addEventListener('volumechange', function(){ updateVolumeIcon(v.volume); });

  if(!silent) VideoHistory.push({ type:'url', value:url });
}

// ─── Play a local file ───
function videoPlayFile(file){
  if(!file) return;

  let url = null;
  let source = 'file';
  if(window.electronPath && window.electronPath.getPathForFile){
    const p = window.electronPath.getPathForFile(file);
    if(p) url = 'file://' + p.replace(/\\/g, '/');
  }
  if(!url && file.path) url = 'file://' + file.path.replace(/\\/g, '/');
  if(!url){ url = URL.createObjectURL(file); source = 'blob'; }

  videoPlaylistAdd(url, file.name.replace(/\.[^.]+$/, ''), source,
    playlistFileKey(file), playlistFileStamp(file));
}

// ─── Play icon ───
function setVideoPlayIcon(playing){
  const icon = document.getElementById('vpPlayIcon');
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
}

// ─── Volume icon + label ───
function updateVolumeIcon(vol){
  const icon = document.getElementById('vpVolIcon');
  if(icon){
    if(vol === 0)      icon.className = 'bi bi-volume-mute';
    else if(vol < 0.5) icon.className = 'bi bi-volume-down';
    else               icon.className = 'bi bi-volume-up';
  }
  const pct = document.getElementById('vpVolPct');
  if(pct) pct.textContent = Math.round(vol * 100) + '%';
}

// ─── Play / pause ───
function toggleVideoPlay(){
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  if(!v){ toast('Nothing loaded', 'warn'); return; }
  if(v.paused) v.play().catch(function(e){ console.warn(e); });
  else v.pause();
}

// ─── Fullscreen ───
function toggleVideoFullscreen(){
  // Fullscreen the video body (stage + docked control bar) so the controls stay reachable
  const el = document.getElementById('videoBody') || document.getElementById('videoStage');
  if(!el) return;
  // Exit native or fallback fullscreen first
  if(document.fullscreenElement){ document.exitFullscreen(); return; }
  if(el.classList.contains('vp-fs-fallback')){ el.classList.remove('vp-fs-fallback'); return; }
  if(el.requestFullscreen){
    el.requestFullscreen().catch(function(){
      // Browser rejected the request (e.g. right-click activation) — use CSS fullscreen instead
      el.classList.add('vp-fs-fallback');
    });
  } else {
    el.classList.add('vp-fs-fallback');
  }
}

// ═══════════════════════════════════════════════════════════
//   CLICK WIRING
// ═══════════════════════════════════════════════════════════

// ─── Left-click + → toggle search box, submit on second click ───
document.addEventListener('click', function(e){
  const plus = e.target.closest('[data-act="video-plus"]');
  if(!plus) return;
  e.preventDefault();
  e.stopPropagation();

  const w   = document.getElementById('videoSearchWrap');
  const inp = document.getElementById('videoSearchInput');
  if(!w) return;

  if(w.hidden){
    w.hidden = false;
    if(inp){ inp.value = ''; setTimeout(function(){ inp.focus(); }, 30); }
  } else {
    const v = (inp && inp.value || '').trim();
    w.hidden = true;
    if(inp) inp.value = '';
    if(v) videoHandleInput(v);
  }
}, true);

// ─── Right-click + → file picker ───
document.addEventListener('contextmenu', function(e){
  const plus = e.target.closest('[data-act="video-plus"]');
  if(!plus) return;
  e.preventDefault();
  e.stopPropagation();

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,.mkv,.avi,.mov,.webm,.m4v';
  input.multiple = false;
  input.onchange = function(ev){
    const file = ev.target.files && ev.target.files[0];
    if(file) videoPlayFile(file);
  };
  input.click();
}, true);

// ─── Enter in search input ───
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  if(e.target.id !== 'videoSearchInput') return;
  e.preventDefault();
  const v = (e.target.value || '').trim();
  const w = document.getElementById('videoSearchWrap');
  const inp = e.target;
  if(w) w.hidden = true;
  if(inp) inp.value = '';
  if(v) videoHandleInput(v);
});

// ─── Seek bar ───
document.addEventListener('input', function(e){
  if(e.target.id !== 'vpSeek') return;
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  if(v && v.duration) v.currentTime = (parseFloat(e.target.value) / 100) * v.duration;
}, true);

// ─── Volume slider ───
document.addEventListener('input', function(e){
  if(e.target.id !== 'vpVol') return;
  const stage = document.getElementById('videoStage');
  if(!stage) return;
  const v = stage.querySelector('video');
  const vol = parseFloat(e.target.value) / 100;
  if(v) v.volume = vol;
  S.config.videoVolume = vol;
  updateVolumeIcon(vol);
  save();
}, true);

// ─── Init ───
window.addEventListener('load', function(){
  setTimeout(function(){
    const body = document.getElementById('videoBody');
    const vol = document.getElementById('vpVol');
    if(vol) vol.value = ((S.config.videoVolume !== undefined ? S.config.videoVolume : 0.8) * 100);

    const cur = S.config.videoAspect || 'default';
    document.querySelectorAll('.vc-aspect-item').forEach(function(b){
      b.classList.toggle('active', b.dataset.aspect === cur);
    });
  }, 100);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO VOLUME — tap N% · hold to ramp
// ═══════════════════════════════════════════════════════════

const VOL_TAP        = 0.01;   // 1% per tap
const VOL_TICK_MS    = 100;    // 100ms between hold ticks
const VOL_RAMP_AFTER = 400;    // after 400ms, accelerate
const VOL_SLOW       = 0.02;   // 2% per tick (slow ramp)
const VOL_MED        = 0.05;   // 5% per tick (fast ramp)
const VOL_HOLD_DELAY = 250;    // don't ramp until held this long

let _volHoldTimer = null;
let _volHoldStart = 0;
let _volHoldDir   = 0;

function getVideoEl(){
  const stage = document.getElementById('videoStage');
  return stage ? stage.querySelector('video') : null;
}

function getVideoVolume(){
  return (S.config.videoVolume !== undefined) ? S.config.videoVolume : 0.8;
}

function setVideoVolume(vol){
  vol = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
  const v = getVideoEl();
  if(v) v.volume = vol;
  S.config.videoVolume = vol;
  updateVolumeIcon(vol);
  save();
}

function startVolHold(dir){
  stopVolHold();
  _volHoldStart = Date.now();
  _volHoldDir   = dir;

  // 1) immediate tap — always fires
  setVideoVolume(getVideoVolume() + dir * VOL_TAP);

  // 2) ramp starts after VOL_HOLD_DELAY ms
  _volHoldTimer = setTimeout(function(){
    _volHoldTimer = setInterval(function(){
      const elapsed = Date.now() - _volHoldStart;
      const step = (elapsed > VOL_RAMP_AFTER) ? VOL_MED : VOL_SLOW;

      const next = getVideoVolume() + dir * step;
      if(next <= 0 || next >= 1){
        setVideoVolume(next);
        stopVolHold();
        return;
      }
      setVideoVolume(next);
    }, VOL_TICK_MS);
  }, VOL_HOLD_DELAY);
}

function stopVolHold(){
  if(_volHoldTimer){
    clearInterval(_volHoldTimer);
    clearTimeout(_volHoldTimer);
    _volHoldTimer = null;
  }
  _volHoldDir = 0;
}

document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  startVolHold(e.button === 2 ? +1 : -1);
}, true);

document.addEventListener('mouseup', function(){
  if(_volHoldTimer) stopVolHold();
}, true);

document.addEventListener('click', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#vpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    setVideoVolume(getVideoVolume());
  }, 200);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — button + modal
// ═══════════════════════════════════════════════════════════

/* The Playlist button in the video bar opens the floating queue strip under
   the player — that lives in chapter-buttons.js. The full playlist panel is
   reached from the strip's expand button (and from openVideoPlaylist()), so
   the button no longer opens it directly and can't alternate between the two. */

document.addEventListener('click', function(e){
  if(!e.target.closest('[data-act="vpl-close"]')) return;
  e.preventDefault();
  e.stopPropagation();
  closeVideoPlaylist();
}, true);

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — draggable panel
// ═══════════════════════════════════════════════════════════

function openVideoPlaylist(){
  const panel = document.getElementById('videoPlaylistPanel');
  if(!panel) return;
  panel.hidden = false;
  renderVideoPlaylist();
  setTimeout(function(){
    initPanelDrag('videoPlaylistPanel', 'videoPlaylistHead');
    initPanelResize('videoPlaylistPanel', 'videoPlaylistResize');
  }, 30);
}

function closeVideoPlaylist(){
  const panel = document.getElementById('videoPlaylistPanel');
  if(panel) panel.hidden = true;
}

function renderVideoPlaylist(){
    const body = document.getElementById('videoPlaylistBody');
    if(!body) return;
    
    const list = S.config.videoPlaylist || [];
    const totalPages = Math.max(1, Math.ceil(list.length / VP_PER_PAGE));
    
    // Ensure current page is valid
    if(_vpPage >= totalPages) _vpPage = totalPages - 1;
    if(_vpPage < 0) _vpPage = 0;
    
    const start = _vpPage * VP_PER_PAGE;
    const end = Math.min(start + VP_PER_PAGE, list.length);
    
    // Clear existing content
    body.innerHTML = '';
    
    // Render empty state if no tracks
    if(!list.length){
        body.innerHTML =
            '<div class="panel-empty vpl-empty">' +
                '<div class="vpl-empty-hint">Click <span class="vpl-empty-key">+</span> to add.</div>' +
            '</div>';
        updateVplPager(0, 0, 0);
        return;
    }
    
    // Render track rows
    for(let i = start; i < end; i++){
        const t = list[i];
        const isCurrent = (t.url === (VideoHistory.current() ? VideoHistory.current().value : null));
        
        const row = document.createElement('div');
        row.className = 'vpl-row' + (isCurrent ? ' active' : '');
        row.style.cssText = 
            'display:flex;align-items:center;gap:10px;width:100%;' +
            'padding:8px 10px;border-radius:6px;cursor:pointer;' +
            'background:' + (isCurrent ? 'var(--surface-3)' : 'transparent') + ';' +
            'margin-bottom:2px;';
            
        // Origin label — same wording as the music playlist rows
        const srcLabel = (t.source === 'file' || t.source === 'blob') ? 'Internal' : 'External';

        row.innerHTML =
            '<span class="vpl-row-body" style="flex:1;min-width:0;text-align:left;overflow:hidden;">' +
                '<span class="vpl-row-name" title="' + esc(t.name) + '" ' +
                    'style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
                    'font-size:12.5px;line-height:1.35;color:' + (isCurrent ? 'var(--ink)' : 'var(--ink-2)') + ';">' +
                    esc(t.name) +
                '</span>' +
                '<span class="vpl-row-source" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
                    'font-size:10.5px;line-height:1.2;margin-top:1px;letter-spacing:.01em;color:' +
                    (isCurrent ? 'var(--ink-3)' : 'var(--ink-4)') + ';">' +
                    srcLabel +
                '</span>' +
            '</span>' +
            '<button class="vpl-rename" data-vpl-rename="' + i + '" title="Rename" ' +
                'style="' + VPL_ACTION_CSS + 'margin-right:2px;">' +
                '<i class="bi bi-pencil" style="font-size:11px;line-height:1;display:block;"></i>' +
            '</button>' +
            '<button class="vpl-del" data-vpl-del="' + i + '" title="Remove" ' +
                'style="' + VPL_ACTION_CSS + '">' +
                '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">' +
                    '<path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
                '</svg>' +
            '</button>';
            
        // Row actions (play · rename · remove) fade in on hover
        const showActions = function(on){
            const btns = row.querySelectorAll('.vpl-play, .vpl-rename, .vpl-del');
            for(let k = 0; k < btns.length; k++){
                btns[k].style.opacity = on ? '1' : '0';
                btns[k].style.pointerEvents = on ? 'auto' : 'none';
            }
        };

        row.addEventListener('mouseenter', function(){
            if(!isCurrent) row.style.background = 'var(--surface-3)';
        });
        row.addEventListener('mouseleave', function(){
            // Keep the actions visible while a rename field is open
            if(row.querySelector('.vpl-rename-edit')) return;
            row.style.background = isCurrent ? 'var(--surface-3)' : 'transparent';
            showActions(false);
        });
        row.addEventListener('mouseover', function(e){
            if(e.target.closest('.vpl-play') || e.target.closest('.vpl-rename') || e.target.closest('.vpl-del')) return;
            showActions(true);
        });

        // Row click only selects — playback happens via the row's Play button
        // or the player's play/pause control.
        row.addEventListener('click', function(e){
            if(e.target.closest('.vpl-play') || e.target.closest('.vpl-rename') || e.target.closest('.vpl-del')) return;
            if(e.target.closest('.vpl-rename-edit')) return;
            _vpSelectedIndex = i;
        });
        
        body.appendChild(row);
    }
    
    // Update the numbering pager (same system as the music panel: "<page>-<last item on page>")
    updateVplPager(_vpPage + 1, totalPages, list.length);
}

function playFromVideoPlaylist(index){
  const list = S.config.videoPlaylist || [];
  const t = list[index];
  if(!t) return;

  videoPlayDirect(t.url);
  VideoHistory.push({ type: t.source === 'file' ? 'file' : 'url', value: t.url, name: t.name });
  // The selection is now the playing row
  _vpSelectedIndex = index;
  renderVideoPlaylist();
  toast('Playing: ' + t.name);
}

// ─── Previous / next video from the saved playlist (wraps around) ───
function videoCurrentPlaylistIndex(){
  const list = S.config.videoPlaylist || [];
  const cur  = VideoHistory.current();
  if(!cur) return -1;
  for(let i = 0; i < list.length; i++){
    if(list[i].url === cur.value) return i;
  }
  return -1;
}

function videoAdvanceNext(){
  const list = S.config.videoPlaylist || [];
  if(!list.length){ toast('Playlist is empty', 'warn'); return; }
  const i = videoCurrentPlaylistIndex();
  playFromVideoPlaylist(i < 0 ? 0 : (i + 1) % list.length);
}

function videoAdvancePrev(){
  const list = S.config.videoPlaylist || [];
  if(!list.length){ toast('Playlist is empty', 'warn'); return; }
  const i = videoCurrentPlaylistIndex();
  playFromVideoPlaylist(i < 0 ? 0 : (i - 1 + list.length) % list.length);
}

function updateVplPager(page, totalPages, totalItems){
  const prev  = document.querySelector('[data-act="vpl-prev-page"]');
  const next  = document.querySelector('[data-act="vpl-next-page"]');
  const range = document.getElementById('vplRange');
  const pages = totalPages || 0;
  const items = totalItems || 0;
  if(prev) prev.disabled = (page <= 1);
  if(next) next.disabled = (pages < 1 || page >= pages);
  if(range){
    const last = Math.min(page * VP_PER_PAGE, items);
    // Empty playlist still has a single (empty) page, so it reads "1"
    range.textContent = items ? (page + '-' + last) : '1';
  }
}

// Play a playlist row directly from its Play button
document.addEventListener('click', function(e){
  const pb = e.target.closest('[data-vpl-play]');
  if(!pb) return;
  e.preventDefault();
  e.stopPropagation();
  playFromVideoPlaylist(parseInt(pb.dataset.vplPlay));
}, true);

// Delete from playlist
document.addEventListener('click', function(e){
  const del = e.target.closest('[data-vpl-del]');
  if(!del) return;
  e.preventDefault();
  e.stopPropagation();
  const i = parseInt(del.dataset.vplDel);
  videoPlaylistRemove(i);
}, true);

// ─── Rename a playlist row (inline edit — mirrors the music panel) ───
function commitVideoRename(input, index, commit){
  if(!input || !input.isConnected) return;   // already committed/cancelled
  const list = S.config.videoPlaylist || [];
  const track = list[index];
  if(!track) return;
  const name = input.value.trim();
  if(commit && name && name !== track.name){
    track.name = name;
    S.config.videoPlaylist = list;
    save();
    toast('Renamed');
  }
  renderVideoPlaylist();
}

document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-vpl-rename]');
  if(!btn) return;   // clicks inside the edit field fall through so the caret still moves
  e.preventDefault();
  e.stopPropagation();

  const row = btn.closest('.vpl-row');
  if(!row) return;
  const i = parseInt(btn.dataset.vplRename);
  const list = S.config.videoPlaylist || [];
  const track = list[i];
  if(!track) return;

  // Second press (tick) saves
  if(btn.dataset.mode === 'save'){
    commitVideoRename(row.querySelector('.vpl-rename-edit'), i, true);
    return;
  }

  const nameEl = row.querySelector('.vpl-row-name');
  if(!nameEl) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'vpl-rename-edit';
  input.value = track.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  // Pencil → tick, and keep both row actions visible
  btn.innerHTML = '<i class="bi bi-check-lg" style="font-size:11px;line-height:1;display:block;"></i>';
  btn.title = 'Save';
  btn.dataset.mode = 'save';
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  const del = row.querySelector('.vpl-del');
  if(del){ del.style.opacity = '1'; del.style.pointerEvents = 'auto'; }

  let done = false;
  const finish = function(commit){
    if(done) return;
    done = true;
    commitVideoRename(input, i, commit);
  };

  input.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter'){ ev.preventDefault(); finish(true); }
    else if(ev.key === 'Escape'){ ev.preventDefault(); finish(false); }
  });
  input.addEventListener('blur', function(){
    setTimeout(function(){
      // Don't commit when the blur was caused by pressing the tick
      if(document.activeElement !== btn) finish(true);
    }, 80);
  });
}, true);

// ═══════════════════════════════════════════════════════════
//   STRUCTURE GUARD — keep panels as direct children of <body>
// ═══════════════════════════════════════════════════════════

(function ensurePanelSiblings(){
  function fix(){
    ['videoPanel', 'videoPlaylistPanel', 'musicPanel'].forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      if(el.parentElement !== document.body){
        console.warn('[guard] reparenting #' + id + ' to <body>');
        document.body.appendChild(el);
      }
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', fix);
  } else {
    fix();
  }
})();

// ═══════════════════════════════════════════════════════════
//   VIDEO PLAYLIST — pager wiring
// ═══════════════════════════════════════════════════════════

let _vpPage = 0;
// Playlist row picked by clicking (not yet playing) — the player's play/pause
// button plays this row when the user presses it.
let _vpSelectedIndex = -1;
const VP_PER_PAGE = 10;
const VP_MAX_PAGES = 50;   // 10 × 50 = 500 videos max

document.addEventListener('click', function(e){
  if(e.target.closest('[data-act="vpl-prev-page"]')){
    e.preventDefault();
    e.stopPropagation();
    if(_vpPage > 0){ _vpPage--; renderVideoPlaylist(); }
    return;
  }
  if(e.target.closest('[data-act="vpl-next-page"]')){
    e.preventDefault();
    e.stopPropagation();
    const total = Math.max(1, Math.ceil((S.config.videoPlaylist || []).length / VP_PER_PAGE));
    if(_vpPage < total - 1){ _vpPage++; renderVideoPlaylist(); }
    return;
  }
}, true);

// ═══════════════════════════════════════════════════════════
//   VIDEO ASPECT — left/right click cycle
// ═══════════════════════════════════════════════════════════

const ASPECT_CYCLE = ['16:9', '4:3', '21:9', '1:1', '9:16'];

function aspectLabel(ratio){
  return ratio;
}

function applyAspect(ratio){
  S.config.videoAspect = ratio;
  save();

  const stage = document.getElementById('videoStage');
  if(stage){
    const v = stage.querySelector('video');
    if(v) v.dataset.aspect = ratio;
  }

  const label = document.getElementById('vpAspectLabel');
  if(label) label.textContent = aspectLabel(ratio);
}

function cycleAspect(dir){
  const cur = S.config.videoAspect || 'default';
  let idx = ASPECT_CYCLE.indexOf(cur);
  if(idx < 0) idx = 0;
  idx = (idx + dir + ASPECT_CYCLE.length) % ASPECT_CYCLE.length;

  const next = ASPECT_CYCLE[idx];
  applyAspect(next);
  toast('Aspect: ' + aspectLabel(next));
}

// Left-click → previous · Right-click → next
document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  cycleAspect(e.button === 2 ? +1 : -1);
}, true);

// Suppress OS context menu on the aspect button
document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Suppress plain click (we use mousedown)
document.addEventListener('click', function(e){
  if(!e.target.closest('#vpAspectBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Paint the label on load
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    applyAspect(S.config.videoAspect || 'default');
  }, 200);
});

// ═══════════════════════════════════════════════════════════
//   VIDEO TRANSPORT — tap = skip, hold = seek
// ═══════════════════════════════════════════════════════════

function videoPlay(){
  const v = getVideoEl();
  if(!v){ toast('Nothing loaded', 'warn'); return; }
  v.play().catch(function(e){ console.warn(e); });
  setVideoPlayIcon(true);   // ← add this
}

function videoPause(){
  const v = getVideoEl();
  if(!v) return;
  v.pause();
  setVideoPlayIcon(false);  // ← add this
}

// ─── Prev / Next — click plays the previous/next playlist video, hold seeks ───
const SEEK_TICK_MS    = 100;
const SEEK_HOLD_MS    = 400;   // held longer than this = seek instead of switching
const SEEK_RAMP_AFTER = 800;
const SEEK_SLOW       = 2;
const SEEK_FAST       = 6;

let _seekHoldTimer  = null;
let _seekHoldDir    = 0;
let _seekHoldStart  = 0;
let _seekMoved      = false;

function beginPrevNext(dir){
  // dir: -1 = prev, +1 = next
  _seekHoldDir   = dir;
  _seekHoldStart = Date.now();
  _seekMoved     = false;

  // holding the button keeps seeking the video that is already loaded
  _seekHoldTimer = setInterval(function(){
    const v = getVideoEl();
    if(!v || !v.duration) return;
    const elapsed = Date.now() - _seekHoldStart;
    if(!_seekMoved && elapsed < SEEK_HOLD_MS) return;   // still a click — don't move yet
    const step = (elapsed > SEEK_RAMP_AFTER) ? SEEK_FAST : SEEK_SLOW;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + dir * step));
    _seekMoved = true;
  }, SEEK_TICK_MS);
}

function endPrevNext(){
  if(_seekHoldTimer){
    clearInterval(_seekHoldTimer);
    _seekHoldTimer = null;
  }

  // nothing was scrubbed → the button was clicked, so play another video
  if(!_seekMoved){
    if(_seekHoldDir === -1) videoAdvancePrev();
    if(_seekHoldDir === +1) videoAdvanceNext();
  }

  _seekHoldDir = 0;
  _seekMoved   = false;
}

document.addEventListener('mousedown', function(e){
  const t = e.target;

  // Play / Pause — left click toggles
  if(t.closest('[data-act="video-toggle"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const v = getVideoEl();
    // A row selected in the playlist (but not yet playing) starts on play.
    if(_vpSelectedIndex >= 0 &&
       _vpSelectedIndex !== videoCurrentPlaylistIndex()){
      playFromVideoPlaylist(_vpSelectedIndex);
      _vpSelectedIndex = -1;
      return;
    }
    if(!v){ toast('Nothing loaded', 'warn'); return; }
    if(v.paused) videoPlay();
    else         videoPause();
    return;
  }

  // Prev
  if(t.closest('[data-act="video-prev"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginPrevNext(-1);
    return;
  }

  // Next
  if(t.closest('[data-act="video-next"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginPrevNext(+1);
    return;
  }

  // Fullscreen — left click toggles fullscreen (right click is menu-suppressed below)
  if(t.closest('[data-act="video-fullscreen"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    toggleVideoFullscreen();
    return;
  }

}, true);

document.addEventListener('mouseup', function(e){
  // Release on prev/next → finalize tap vs hold
  if(e.target.closest('[data-act="video-prev"]') ||
     e.target.closest('[data-act="video-next"]') ||
     _seekHoldDir !== 0){
    endPrevNext();
  }
}, true);

// Also catch release anywhere (in case user dragged off the button)
document.addEventListener('mouseup', function(){
  if(_seekHoldDir !== 0) endPrevNext();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('[data-act="video-toggle"]') &&
     !e.target.closest('[data-act="video-prev"]') &&
     !e.target.closest('[data-act="video-next"]') &&
     !e.target.closest('[data-act="video-fullscreen"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// Escape exits the CSS fallback fullscreen (no native fullscreen to exit)
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  const el = document.getElementById('videoBody');
  if(el && el.classList.contains('vp-fs-fallback')) el.classList.remove('vp-fs-fallback');
});

// ═══════════════════════════════════════════════════════════
//   MUSIC TRANSPORT — tap = skip, hold = seek
// ═══════════════════════════════════════════════════════════

// Music.currentIndex doubles as the selected row and the playing row, so it
// has to move with playback (app.js's musicPlay only swaps the audio source).
function playMusicIndex(i){
  if(i < 0 || i >= Music.playlist.length) return;
  Music.currentIndex = i;
  musicPlay(i);
}

function musicPlayExplicit(){
  if(!Music.audio) return;
  if(Music.currentIndex < 0 && Music.playlist.length) playMusicIndex(0);
  else Music.audio.play();
}

function musicPauseExplicit(){
  if(Music.audio) Music.audio.pause();
}

// One entry point for play/pause — used by the play buttons and by the row click.
let _lastMusicToggle = 0;
function musicTogglePlayback(){
  const a = Music.audio;
  if(!a) return;

  // A duplicated press event must not toggle straight back to where it started.
  const now = Date.now();
  if(now - _lastMusicToggle < 60) return;
  _lastMusicToggle = now;

  if(a.paused){
    // Nothing to play — an empty playlist must never start the visualizer
    if(!Music.playlist.length){ toast('Add a track first', 'warn'); return; }
    // A selected-but-not-yet-loaded row plays from the top when the user hits
    // the player's play button.
    if(Music.loadedIndex !== undefined && Music.loadedIndex !== null &&
       Music.loadedIndex !== Music.currentIndex){
      playMusicIndex(Music.currentIndex);
    } else if(Music.currentIndex < 0 && Music.playlist.length){
      playMusicIndex(0);
    } else if(!a.currentSrc && !a.src && Music.playlist.length){
      // Fresh session with a restored playlist — no source loaded yet
      playMusicIndex(Math.max(0, Music.currentIndex));
    } else {
      const pr = a.play();
      if(pr && pr.catch) pr.catch(function(e){
        if(e && e.name === 'AbortError') return;
        setPlayIcon(false);
        if(typeof mediaErrorMessage === 'function') toast(mediaErrorMessage(e, Music.playlist[Music.currentIndex]), 'err');
      });
    }
  } else {
    a.pause();
  }

  if(typeof renderMusicMini === 'function') renderMusicMini();
}

// Shuffle-aware advance — used by the transport buttons and by auto-advance.
function musicAdvanceNext(){
  const len = Music.playlist.length;
  if(!len) return;
  if(Music.currentIndex < 0 || Music.currentIndex >= len){ playMusicIndex(0); return; }

  let i;
  if(Music.shuffle && len > 1){
    // never shuffle straight back into the track that just played
    do { i = Math.floor(Math.random() * len); }
    while(i === Music.currentIndex);
  } else {
    i = (Music.currentIndex + 1) % len;
  }
  playMusicIndex(i);
}

function musicAdvancePrev(){
  const len = Music.playlist.length;
  if(!len) return;
  if(Music.currentIndex < 0 || Music.currentIndex >= len){ playMusicIndex(0); return; }
  playMusicIndex((Music.currentIndex - 1 + len) % len);
}

const MSEEK_TICK_MS    = 100;
const MSEEK_HOLD_MS    = 400;  // held longer than this = seek instead of skipping
const MSEEK_RAMP_AFTER = 800;
const MSEEK_SLOW       = 3;    // seconds per tick
const MSEEK_FAST       = 10;

let _mSeekTimer  = null;
let _mSeekDir    = 0;
let _mSeekStart  = 0;
let _mSeekMoved  = false;

// Click = previous/next song, hold = seek (same feel as the video player).
// The song switch waits for release so holding always seeks the track that is
// already loaded — a freshly loaded track has no duration, so seeking it stalls.
function beginMusicPrevNext(dir){
  _mSeekDir   = dir;
  _mSeekStart = Date.now();
  _mSeekMoved = false;

  _mSeekTimer = setInterval(function(){
    if(!Music.audio || !Music.audio.duration) return;
    const elapsed = Date.now() - _mSeekStart;
    if(!_mSeekMoved && elapsed < MSEEK_HOLD_MS) return;   // still a click — don't move yet
    const step = (elapsed > MSEEK_RAMP_AFTER) ? MSEEK_FAST : MSEEK_SLOW;
    Music.audio.currentTime = Math.max(0, Math.min(Music.audio.duration, Music.audio.currentTime + dir * step));
    _mSeekMoved = true;
  }, MSEEK_TICK_MS);
}

function endMusicPrevNext(){
  if(_mSeekTimer){
    clearInterval(_mSeekTimer);
    _mSeekTimer = null;
  }
  // nothing was scrubbed → the button was clicked, so switch song
  if(!_mSeekMoved){
    if(_mSeekDir === -1) musicAdvancePrev();
    if(_mSeekDir === +1) musicAdvanceNext();
  }
  _mSeekDir   = 0;
  _mSeekMoved = false;
}

// A press that loses focus (window blur, pointer dragged off-screen) must not
// leave the transport stuck in seek mode.
window.addEventListener('blur', function(){
  if(_mSeekTimer){ clearInterval(_mSeekTimer); _mSeekTimer = null; }
  _mSeekDir   = 0;
  _mSeekMoved = false;
  if(_seekHoldTimer){ clearInterval(_seekHoldTimer); _seekHoldTimer = null; }
  _seekHoldDir = 0;
  _seekMoved   = false;
});

document.addEventListener('mousedown', function(e){
  const t = e.target;

  // Play / Pause — left click toggles (same as the video player)
  if(t.closest('[data-act="mp-toggle"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    musicTogglePlayback();
    return;
  }

  // Prev — tap = previous, hold = seek back
  if(t.closest('[data-act="mp-prev"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginMusicPrevNext(-1);
    return;
  }

  // Next — tap = next, hold = seek forward
  if(t.closest('[data-act="mp-next"]')){
    if(e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginMusicPrevNext(+1);
    return;
  }
}, true);

document.addEventListener('mouseup', function(e){
  if(_mSeekDir !== 0) endMusicPrevNext();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('[data-act="mp-toggle"]') &&
     !e.target.closest('[data-act="mp-prev"]') &&
     !e.target.closest('[data-act="mp-next"]') &&
     !e.target.closest('[data-act="mp-shuffle"]') &&
     !e.target.closest('[data-act="mp-repeat"]')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

// ─── Shuffle / Loop — left click toggles, state is persisted ───
document.addEventListener('click', function(e){
  const sh = e.target.closest('[data-act="mp-shuffle"]');
  if(sh){
    e.preventDefault();
    e.stopPropagation();
    Music.shuffle = !Music.shuffle;
    S.config.musicShuffle = Music.shuffle;
    save();
    sh.classList.toggle('active', Music.shuffle);
    toast(Music.shuffle ? 'Shuffle on' : 'Shuffle off');
    return;
  }

  const rp = e.target.closest('[data-act="mp-repeat"]');
  if(rp){
    e.preventDefault();
    e.stopPropagation();
    Music.repeat = !Music.repeat;
    S.config.musicRepeat = Music.repeat;
    save();
    rp.classList.toggle('active', Music.repeat);
    const rpIcon = rp.querySelector('i');
    if(rpIcon) rpIcon.className = Music.repeat ? 'bi bi-repeat-1' : 'bi bi-repeat';
    toast(Music.repeat ? 'Loop on' : 'Loop off');
    return;
  }
}, true);

// ─── Playlist row subtitle ───
// Rows carry their origin as "URL"/"File"; the panel wording is External for
// links and Internal for files picked from disk, so relabel rows as they render.
function labelMusicRowSources(){
  const wrap = document.getElementById('mpPlaylist');
  if(!wrap) return;
  const labels = wrap.querySelectorAll('.mv-item-source');
  for(let i = 0; i < labels.length; i++){
    const el = labels[i];
    if(el.textContent === 'URL') el.textContent = 'External';
    else if(el.textContent === 'File' || el.textContent === 'Unknown') el.textContent = 'Internal';
  }
}

function watchMusicRowSources(){
  const wrap = document.getElementById('mpPlaylist');
  if(!wrap || typeof MutationObserver === 'undefined') return;
  new MutationObserver(labelMusicRowSources).observe(wrap, { childList: true, subtree: true });
  labelMusicRowSources();
}

// The playlist element is parsed after this script, so wait for the DOM.
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', watchMusicRowSources);
} else {
  watchMusicRowSources();
}

// ═══════════════════════════════════════════════════════════
//   TOPBAR BUTTONS — direct listeners (permanent)
// ═══════════════════════════════════════════════════════════

(function attachTopbarButtons(){
  function wireButton(selector, handler){
    const el = document.querySelector(selector);
    if(!el) return false;
    if(el.dataset.wired === '1') return true;
    el.dataset.wired = '1';
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      handler(e);
    }, true);
    return true;
  }

  function attachAll(){
    wireButton('[data-act="open-settings"]', function(){
      if(typeof SETTINGS !== 'undefined' && SETTINGS.open) SETTINGS.open();
    });
  }

  // Try immediately
  attachAll();

  // Re-run if the DOM changes
  const obs = new MutationObserver(attachAll);
  obs.observe(document.body, { childList: true, subtree: true });
})();



/* ══════════ motion.js ══════════ */
/* ============================================================
   MOTION
============================================================ */
const mainMotionStore = {};
const miniMotionStore = {};

function renderMotionEffect(c2, W, H, effect, speed, intensity, store, color){
    try {
        c2.clearRect(0, 0, W, H);
        if (effect === 'none' || !effect) return;
        const accent = color || '#fab387';
        const hexA = (h,a)=>{ try { const x=h.replace('#',''); return `rgba(${parseInt(x.substring(0,2),16)},${parseInt(x.substring(2,4),16)},${parseInt(x.substring(4,6),16)},${a})`; } catch(e){ return `rgba(201,168,106,${a})`; } };

        if (effect === 'waves'){
            store.waveOffset = (store.waveOffset || 0) + 0.04*speed;
            for (let layer = 0; layer < 3; layer++){
                c2.beginPath(); c2.strokeStyle = hexA(accent, 0.35*intensity); c2.lineWidth = 1.5;
                for (let x = 0; x <= W; x += 6){
                    const y = H/2 + Math.sin(x*0.012 + store.waveOffset + layer*0.8)*(18+layer*6);
                    x===0 ? c2.moveTo(x,y) : c2.lineTo(x,y);
                }
                c2.stroke();
            }
        } else if (['particles','sakura','fireflies','leaves','snow','stardust','ash','embers','sparks','mist','fog','haze','fireflies2','snow2'].includes(effect)){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = (effect === 'mist' || effect === 'fog' || effect === 'haze') ? 25 : 70;
                for (let i = 0; i < count; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2.5+0.5, vx:(Math.random()-0.5)*1.4, vy:(Math.random()-0.5)*1.4, a:Math.random()*0.7+0.2, size:Math.random()*4+1, rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.05, life: Math.random() });
            }
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed;
                if (p.x < -10) p.x = W+10; if (p.x > W+10) p.x = -10;
                if (p.y < -10) p.y = H+10; if (p.y > H+10) p.y = -10;
                if (effect === 'snow' || effect === 'snow2'){ p.vy = Math.max(0.3, Math.abs(p.vy)); p.vx = Math.sin(p.y*0.01)*0.5; }
                if (effect === 'stardust' || effect === 'sparks'){ p.life += 0.01*speed; if (p.life > 1) p.life = 0; }
                if (effect === 'ash' || effect === 'embers'){ p.vy = -Math.abs(p.vy)*0.6; }
                if (effect === 'mist' || effect === 'fog' || effect === 'haze'){ p.size = 60 + Math.random()*40; }
                c2.beginPath();
                if (effect === 'sakura' || effect === 'leaves'){
                    p.rot += p.rotSpeed;
                    c2.save(); c2.translate(p.x,p.y); c2.rotate(p.rot);
                    c2.fillStyle = effect === 'sakura' ? `rgba(244,114,182,${p.a})` : `rgba(52,211,153,${p.a})`;
                    c2.ellipse(0,0,p.size,p.size*0.5,0,0,Math.PI*2); c2.fill(); c2.restore();
                } else if (effect === 'snow' || effect === 'snow2'){
                    c2.fillStyle = `rgba(255,255,255,${p.a})`;
                    c2.arc(p.x, p.y, p.r, 0, Math.PI*2); c2.fill();
                } else if (effect === 'stardust' || effect === 'sparks'){
                    c2.fillStyle = hexA(accent, Math.sin(p.life*Math.PI));
                    c2.arc(p.x, p.y, p.r*2, 0, Math.PI*2); c2.fill();
                } else if (effect === 'ash' || effect === 'embers'){
                    c2.fillStyle = effect === 'embers' ? `rgba(251,146,60,${p.a})` : `rgba(120,120,120,${p.a})`;
                    c2.arc(p.x, p.y, p.r, 0, Math.PI*2); c2.fill();
                } else if (effect === 'mist' || effect === 'fog' || effect === 'haze'){
                    const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    const col = effect === 'mist' ? '200,220,240' : (effect === 'fog' ? '180,190,200' : '220,210,200');
                    grad.addColorStop(0, `rgba(${col},${p.a*0.15*intensity})`);
                    grad.addColorStop(1, `rgba(${col},0)`);
                    c2.fillStyle = grad;
                    c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
                } else {
                    c2.arc(p.x,p.y,p.r,0,Math.PI*2);
                    c2.fillStyle = effect === 'fireflies' || effect === 'fireflies2' ? `rgba(251,191,36,${p.a})` : hexA(accent, p.a);
                    c2.fill();
                }
            });
        } else if (effect === 'rain' || effect === 'rain2'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = effect === 'rain2' ? 150 : 80;
                for (let i = 0; i < count; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.5 });
            }
            c2.strokeStyle = `rgba(148,163,184,${0.55*intensity})`; c2.lineWidth = effect === 'rain2' ? 1.6 : 1.2;
            store.particles.forEach(p => {
                p.y += (p.r*3+2)*speed*2;
                if (p.y > H){ p.y = -10; p.x = Math.random()*W; }
                c2.beginPath(); c2.moveTo(p.x,p.y); c2.lineTo(p.x-1.5,p.y+12); c2.stroke();
            });
        } else if (effect === 'drops'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 40; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*30+20, t:Math.random()*Math.PI*2 });
            }
            c2.strokeStyle = hexA(accent, 0.4*intensity); c2.lineWidth = 1;
            store.particles.forEach(p => {
                p.t += 0.02 * speed;
                c2.beginPath();
                c2.arc(p.x, p.y, Math.abs(Math.sin(p.t))*p.r, 0, Math.PI*2); c2.stroke();
            });
        } else if (effect === 'ripple'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 6; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:0, t:Math.random() });
            }
            c2.strokeStyle = hexA(accent, 0.5*intensity);
            store.particles.forEach(p => {
                p.t += 0.005 * speed;
                if (p.t > 1){ p.t = 0; p.x = Math.random()*W; p.y = Math.random()*H; }
                c2.lineWidth = 2 * (1-p.t);
                c2.beginPath();
                c2.arc(p.x, p.y, p.t * Math.max(W,H)*0.5, 0, Math.PI*2); c2.stroke();
            });
        } else if (effect === 'matrix' || effect === 'digitalrain2' || effect === 'morse'){
            if (!store.matrixCols || store.matrixCols.length === 0){
                store.matrixCols = [];
                const cols = Math.floor(W/16);
                for (let i = 0; i < cols; i++) store.matrixCols.push({ x:i*16, y:Math.random()*H, speed:Math.random()*2+1, hue: Math.random()*360, chars:Array.from({length:20},()=>String.fromCharCode(0x30A0+Math.random()*96)) });
            }
            c2.font = '12px monospace';
            store.matrixCols.forEach(col => {
                col.y += col.speed*speed*2;
                if (col.y > H+100) col.y = -Math.random()*200;
                col.chars.forEach((ch,i) => {
                    const y = col.y + i*14;
                    if (y < 0 || y > H) return;
                    const a = i === 0 ? 0.95 : Math.max(0, 0.4 - i*0.02);
                    c2.fillStyle = effect === 'digitalrain2' ? `hsla(${col.hue},80%,60%,${a})` : (i === 0 ? hexA(accent, 0.95) : hexA(accent, a));
                    const char = effect === 'morse' ? (Math.random() > 0.5 ? '·' : '—') : col.chars[Math.floor(Math.random()*col.chars.length)];
                    c2.fillText(char, col.x, y);
                });
            });
        } else if (effect === 'circuits'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03*speed;
            const step = 30;
            c2.strokeStyle = hexA(accent, 0.3*intensity); c2.lineWidth = 1;
            for (let y = 0; y < H; y += step){
                for (let x = 0; x < W; x += step){
                    const pulse = Math.sin((x+y)*0.02 + store.waveOffset*3) > 0.7 ? 1 : 0;
                    if (pulse){
                        c2.beginPath();
                        c2.moveTo(x, y); c2.lineTo(x+step, y);
                        c2.moveTo(x, y); c2.lineTo(x, y+step);
                        c2.stroke();
                    }
                }
            }
        } else if (effect === 'aurora'){
            store.auroraOffset = (store.auroraOffset || 0) + 0.008*speed;
            for (let i = 0; i < 4; i++){
                const g = c2.createLinearGradient(0, H*0.3+i*30, W, H*0.7+i*30);
                g.addColorStop(0, `hsla(${180+i*30+Math.sin(store.auroraOffset+i)*20},80%,60%,${0.12*intensity})`);
                g.addColorStop(1, `hsla(${280+i*20},80%,60%,0)`);
                c2.fillStyle = g; c2.beginPath();
                for (let x = 0; x <= W; x += 10){
                    const y = H*0.45+i*25 + Math.sin(x*0.008+store.auroraOffset*2+i)*35;
                    x===0 ? c2.moveTo(x,y) : c2.lineTo(x,y);
                }
                c2.lineTo(W,H); c2.lineTo(0,H); c2.closePath(); c2.fill();
            }
        } else if (effect === 'thunder' || effect === 'lightning2'){
            if (Math.random() < (effect === 'lightning2' ? 0.04 : 0.015)*speed){
                c2.fillStyle = `rgba(200,220,255,${0.35*intensity})`;
                c2.fillRect(0,0,W,H);
                if (effect === 'lightning2'){
                    c2.strokeStyle = `rgba(255,255,255,${0.8*intensity})`;
                    c2.lineWidth = 2;
                    c2.beginPath();
                    let lx = Math.random()*W, ly = 0;
                    c2.moveTo(lx, ly);
                    while (ly < H){
                        lx += (Math.random()-0.5)*60;
                        ly += 20 + Math.random()*40;
                        c2.lineTo(lx, ly);
                    }
                    c2.stroke();
                }
            }
            c2.strokeStyle = `rgba(148,163,184,${0.4*intensity})`; c2.lineWidth = 1;
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 60; i++) store.particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.5 });
            }
            store.particles.forEach(p => {
                p.y += (p.r*3+4)*speed*2;
                if (p.y > H){ p.y = -10; p.x = Math.random()*W; }
                c2.beginPath(); c2.moveTo(p.x,p.y); c2.lineTo(p.x-2,p.y+16); c2.stroke();
            });
        } else if (effect === 'earthquake'){
            store.shakeT = (store.shakeT || 0) + 0.15*speed;
            const sx = Math.sin(store.shakeT*13)*4*intensity;
            const sy = Math.cos(store.shakeT*17)*3*intensity;
            c2.save(); c2.translate(sx,sy);
            c2.strokeStyle = `rgba(239,68,68,${0.3*intensity})`; c2.lineWidth = 1;
            for (let i = 0; i < 8; i++){
                c2.beginPath();
                c2.moveTo(0, (i/8)*H + Math.sin(store.shakeT+i)*8);
                c2.lineTo(W, (i/8)*H + Math.cos(store.shakeT+i)*8);
                c2.stroke();
            }
            c2.restore();
        } else if (effect === 'confetti'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 50; i++) store.particles.push({ x:Math.random()*W, y:-20, r:Math.random()*3+1, vx:(Math.random()-0.5)*1.5, vy:Math.random()*2+1, rot:Math.random()*6, rotSpeed:(Math.random()-0.5)*0.15, color:['#c9a86a','#f43f5e','#38bdf8','#34d399','#fbbf24','#a855f7'][Math.floor(Math.random()*6)] });
            }
            store.particles.forEach(p => {
                p.y += p.vy*speed; p.x += p.vx*speed;
                p.rot += p.rotSpeed;
                if (p.y > H+20){ p.y = -20; p.x = Math.random()*W; }
                c2.save(); c2.translate(p.x,p.y); c2.rotate(p.rot);
                c2.fillStyle = p.color;
                c2.fillRect(-p.r,-p.r*0.4,p.r*2,p.r*0.8);
                c2.restore();
            });
        } else if (effect === 'blackhole' || effect === 'galaxies'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                const count = effect === 'galaxies' ? 200 : 90;
                for (let i = 0; i < count; i++) store.particles.push({ angle: Math.random()*Math.PI*2, dist: 40 + Math.random()*Math.max(W,H), speed: 0.4 + Math.random()*0.8, size: Math.random()*2+0.5 });
            }
            const cx = W/2, cy = H/2;
            store.particles.forEach(p => {
                p.angle += (effect === 'galaxies' ? 0.008 : (1.2 - p.dist/400) * 0.02) * speed;
                p.dist += (effect === 'galaxies' ? -0.3 : -p.speed*1.5) * speed;
                if (effect === 'galaxies' && p.dist < 20) p.dist = Math.max(W,H);
                if (p.dist < 10){ p.dist = Math.max(W,H); p.angle = Math.random()*Math.PI*2; }
                const px = cx + Math.cos(p.angle)*p.dist;
                const py = cy + Math.sin(p.angle)*p.dist;
                const alpha = Math.min(1, (1 - p.dist/Math.max(W,H)) * intensity);
                c2.beginPath();
                c2.fillStyle = effect === 'galaxies' ? `hsla(${(p.angle*57)%360},80%,70%,${alpha})` : hexA(accent, alpha);
                c2.arc(px, py, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'hyperspace'){
            if (!store.stars || store.stars.length === 0){
                store.stars = [];
                for (let i = 0; i < 80; i++) store.stars.push({ angle: Math.random()*Math.PI*2, dist: Math.random()*Math.max(W,H), speed: 2 + Math.random()*4, len: 10 + Math.random()*30 });
            }
            const cx = W/2, cy = H/2;
            store.stars.forEach(s => {
                s.dist += s.speed * speed;
                if (s.dist > Math.max(W,H)){ s.dist = 5; s.angle = Math.random()*Math.PI*2; }
                const x1 = cx + Math.cos(s.angle)*s.dist;
                const y1 = cy + Math.sin(s.angle)*s.dist;
                const x2 = cx + Math.cos(s.angle)*(s.dist - s.len);
                const y2 = cy + Math.sin(s.angle)*(s.dist - s.len);
                c2.beginPath(); c2.strokeStyle = hexA(accent, Math.min(1, s.dist/300)*intensity);
                c2.lineWidth = 1.5;
                c2.moveTo(x1, y1); c2.lineTo(x2, y2); c2.stroke();
            });
        } else if (effect === 'vortex'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 70; i++) store.particles.push({ angle: Math.random()*Math.PI*2, radius: 20 + Math.random()*Math.max(W,H)/2, angularSpeed: 0.01 + Math.random()*0.03, size: Math.random()*2+0.5 });
            }
            const cx = W/2, cy = H/2;
            store.particles.forEach(p => {
                p.angle += p.angularSpeed * speed;
                p.radius -= 0.3 * speed;
                if (p.radius < 10) p.radius = Math.max(W,H)/2 + Math.random()*100;
                const px = cx + Math.cos(p.angle)*p.radius;
                const py = cy + Math.sin(p.angle)*p.radius;
                c2.beginPath(); c2.fillStyle = hexA(accent, intensity * 0.7);
                c2.arc(px, py, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'pulsegrid'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03 * speed;
            const gridSize = 24;
            for (let x = 0; x < W; x += gridSize){
                for (let y = 0; y < H; y += gridSize){
                    const dist = Math.sqrt((x-W/2)**2 + (y-H/2)**2);
                    const pulse = (Math.sin(dist*0.02 - store.waveOffset*3) + 1) / 2;
                    c2.strokeStyle = hexA(accent, pulse * 0.3 * intensity);
                    c2.lineWidth = 1;
                    c2.strokeRect(x, y, gridSize, gridSize);
                }
            }
        } else if (effect === 'plasma'){
            store.waveOffset = (store.waveOffset || 0) + 0.02 * speed;
            const t = store.waveOffset;
            for (let i = 0; i < 5; i++){
                const cx = W/2 + Math.sin(t + i*1.5) * W/3;
                const cy = H/2 + Math.cos(t * 0.8 + i*2) * H/3;
                const r = 60 + Math.sin(t + i) * 40;
                const grad = c2.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0, `hsla(${(i*60 + t*30) % 360}, 80%, 60%, ${0.3*intensity})`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(cx, cy, r, 0, Math.PI*2); c2.fill();
            }
        } else if (effect === 'breath' || effect === 'heartbeat'){
            store.waveOffset = (store.waveOffset || 0) + 0.02 * speed;
            const t = store.waveOffset;
            const scale = effect === 'heartbeat' 
                ? 1 + Math.pow(Math.max(0, Math.sin(t*3)), 8) * 0.4
                : 1 + Math.sin(t)*0.2;
            const grad = c2.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/2*scale);
            grad.addColorStop(0, hexA(accent, 0.25*intensity));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            c2.fillStyle = grad;
            c2.fillRect(0,0,W,H);
        } else if (effect === 'dna'){
            if (!store.waveOffset) store.waveOffset = 0;
            store.waveOffset += 0.03*speed;
            const t = store.waveOffset;
            c2.strokeStyle = hexA(accent, 0.6*intensity); c2.lineWidth = 2;
            for (let y = 0; y < H; y += 4){
                const a = Math.sin(y*0.05 + t*2)*40;
                c2.beginPath();
                c2.moveTo(W/2 + a, y);
                c2.lineTo(W/2, y);
                c2.lineTo(W/2 - a, y);
                c2.stroke();
            }
        } else if (effect === 'fire'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 60; i++) store.particles.push({ x: Math.random()*W, y: H - Math.random()*20, vy: -1 - Math.random()*3, vx: (Math.random()-0.5)*1.2, size: 8 + Math.random()*20, life: 1, hue: 20 + Math.random()*30 });
            }
            if (Math.random() < 0.6*speed){
                store.particles.push({ x: Math.random()*W, y: H - 5, vy: -1 - Math.random()*3, vx: (Math.random()-0.5)*1.2, size: 8 + Math.random()*20, life: 1, hue: 20 + Math.random()*30 });
            }
            if (store.particles.length > 120) store.particles.splice(0, store.particles.length - 120);
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed; p.life -= 0.015*speed;
                if (p.life <= 0 || p.y < -p.size){ p.life = 1; p.y = H - 5; p.x = Math.random()*W; }
                const alpha = Math.max(0, p.life);
                const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, `hsla(${p.hue},100%,70%,${alpha})`);
                grad.addColorStop(1, `hsla(${p.hue},100%,30%,0)`);
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
            });
        } else if (effect === 'smoke'){
            if (!store.particles || store.particles.length === 0){
                store.particles = [];
                for (let i = 0; i < 40; i++) store.particles.push({ x: Math.random()*W, y: H - Math.random()*30, vy: -0.5 - Math.random()*1.2, vx: (Math.random()-0.5)*0.6, size: 40 + Math.random()*50, life: 1 });
            }
            if (Math.random() < 0.3*speed){
                store.particles.push({ x: Math.random()*W, y: H - 5, vy: -0.5 - Math.random()*1.2, vx: (Math.random()-0.5)*0.6, size: 40 + Math.random()*50, life: 1 });
            }
            if (store.particles.length > 100) store.particles.splice(0, store.particles.length - 100);
            store.particles.forEach(p => {
                p.x += p.vx*speed; p.y += p.vy*speed; p.size += 0.2*speed; p.life -= 0.004*speed;
                if (p.life <= 0 || p.y < -p.size){ p.life = 1; p.y = H - 5; p.x = Math.random()*W; }
                const alpha = Math.max(0, p.life * 0.35 * intensity);
                const grad = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, `rgba(160,160,170,${alpha})`);
                grad.addColorStop(1, `rgba(80,80,90,0)`);
                c2.fillStyle = grad;
                c2.beginPath(); c2.arc(p.x, p.y, p.size, 0, Math.PI*2); c2.fill();
            });
        }
    } catch(e){ console.warn('motion error:', e); }
}

function drawMotion(){
    try {
        const W = motionCanvas.width, H = motionCanvas.height;
        if (state.motionDisplay !== 'none'){
            renderMotionEffect(ctx, W, H, state.motionEffect, state.motionSpeed, state.motionIntensity, mainMotionStore);
        } else ctx.clearRect(0,0,W,H);
    } catch(e){}
    requestAnimationFrame(drawMotion);
}
/* ═══════════════════════════════════════════════════════════
   MOTION — adapter: canvas + picker + lifecycle
   ═══════════════════════════════════════════════════════════ */

const MOTION = { store:{}, raf:0, running:false, canvas:null, ctx:null,
                 w:0, h:0, ro:null, effect:'', _wasOn:false };

MOTION.EFFECTS = ['waves','particles','leaves','sakura','rain','rain2','snow','snow2',
  'fireflies','fireflies2','stardust','sparks','ash','embers','mist','fog','haze',
  'drops','ripple','aurora','thunder','lightning2','confetti','blackhole','galaxies',
  'hyperspace','vortex','pulsegrid','digitalrain2','matrix','plasma','fire','smoke',
  'breath','heartbeat','dna','circuits','morse','earthquake','none'];

MOTION.cfg = function(){
  const c = S.config;
  if(c.motionOn === undefined) c.motionOn = true;   /* motion is ON by default */
  if(!c.motionEffect)          c.motionEffect = 'rain';
  if(!c.motionSpeed)           c.motionSpeed = 1;
  if(!c.motionIntensity)       c.motionIntensity = 1;
  if(!c.motionColor)           c.motionColor = '#fab387';
  if(c.motionSync === undefined)  c.motionSync = true;
  if(c.motionReact === undefined) c.motionReact = 1
  return c;
};

MOTION.panel = function(){ return document.getElementById('musicPanel'); };
MOTION.viz   = function(){ return document.querySelector('#musicPanel .mv-visualizer'); };
/* A track has to be actually playing — nothing animates on an idle player,
   and pressing play with no track loaded draws nothing. */
MOTION.playing = function(){
  const a = window.Music && window.Music.audio;
  return !!(a && !a.paused && (a.currentSrc || a.src));
};
MOTION.on    = function(){
  const c = MOTION.cfg(), p = MOTION.panel();
  return !!(c.motionOn && p && !p.hidden && MOTION.playing() && c.motionEffect && c.motionEffect !== 'none');
};

/* ── canvas ── */
MOTION.attach = function(){
  const viz = MOTION.viz();
  if(!viz) return null;
  let cv = viz.querySelector(':scope > canvas.mp-motion');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'mp-motion';
    viz.appendChild(cv);
  }
  if(cv !== MOTION.canvas){
    MOTION.canvas = cv;
    MOTION.ctx = cv.getContext('2d');
  }
  return cv;
};

MOTION.resize = function(){
  const cv = MOTION.canvas;
  if(!cv || !MOTION.ctx) return;
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  if(w < 2 || h < 2) return;                      /* hidden — keep last size */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if(cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)){
    cv.width  = Math.round(w*dpr);
    cv.height = Math.round(h*dpr);
  }
  MOTION.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  /* draw in CSS px */
  MOTION.w = w; MOTION.h = h;
};

MOTION.clear = function(){
  if(MOTION.ctx && MOTION.canvas && MOTION.w && MOTION.h){
    MOTION.ctx.clearRect(0, 0, MOTION.w, MOTION.h);
  }
};
/* ── audio reactivity ── */
MOTION.audio = { level:0, bass:0, pulse:0, floor:0.06 };

MOTION.resumeAudio = function(){
  if(_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume().catch(function(){});
};

MOTION.readAudio = function(){
  const a = MOTION.audio;
  const playing = window.Music && Music.audio && !Music.audio.paused;
  if(!playing || !_analyser || !_dataArray){
    a.level *= 0.7; a.bass *= 0.6; a.pulse *= 0.82;   /* decay to silence */
    return a;
  }
  _analyser.getByteFrequencyData(_dataArray);

  /* kick lives in bins 1–6 of a 64-bin frame (~under 400 Hz) */
  let sum = 0, low = 0, lowN = 0;
  for(let i = 0; i < _dataArray.length; i++){
    const v = _dataArray[i] / 255;
    sum += v;
    if(i >= 1 && i <= 6){ low += v; lowN++; }
  }
  const rawLevel = sum / _dataArray.length;
  const rawBass  = lowN ? low / lowN : 0;

  a.level = a.level * 0.7 + rawLevel * 0.3;
  a.bass  = a.bass  * 0.6 + rawBass  * 0.4;

  a.floor = a.floor * 0.98 + rawBass * 0.02;            /* adaptive noise floor */
  const kick = Math.max(0, rawBass - a.floor * 1.3) * 4;
  a.pulse = Math.max(a.pulse * 0.82, Math.min(kick, 1));/* decaying beat hit */
  return a;
};

/* ── one loop, start/stop idempotent ── */
MOTION.frame = function(){
  if(!MOTION.running) return;
  const c = MOTION.cfg();
  if(!MOTION.on()){ MOTION.stop(); MOTION.clear(); return; }
  if(MOTION.effect !== c.motionEffect){          /* effect changed → fresh store */
    MOTION.effect = c.motionEffect;
    MOTION.store = {};
  }
    MOTION.resize();

  const A = MOTION.readAudio();
  let spd  = c.motionSpeed;
  let ints = c.motionIntensity;
  if(c.motionSync){
    const k = c.motionReact;
    spd  = Math.min(c.motionSpeed * (1 + A.bass * 0.35 * k), 3);
    ints = Math.min(c.motionIntensity * (1 + A.level * 0.7 * k + A.pulse * 0.8 * k), 2.5);
  }

  renderMotionEffect(MOTION.ctx, MOTION.w, MOTION.h,
                     c.motionEffect, spd, ints,
                     MOTION.store, c.motionColor);

  MOTION.raf = requestAnimationFrame(MOTION.frame);
};

MOTION.start = function(){
  if(MOTION.running) return;
  if(window.Music && Music.audio && typeof initBeatAnalyser === 'function') initBeatAnalyser();
  MOTION.resumeAudio();
  MOTION.running = true;
  MOTION.raf = requestAnimationFrame(MOTION.frame);
};

MOTION.stop = function(){
  MOTION.running = false;
  if(MOTION.raf) cancelAnimationFrame(MOTION.raf);
  MOTION.raf = 0;
};

MOTION.watch = function(){
  if(MOTION.ro || typeof ResizeObserver !== 'function') return;
  const viz = MOTION.viz();
  if(!viz) return;
  MOTION.ro = new ResizeObserver(function(){ if(MOTION.on()) MOTION.resize(); });
  MOTION.ro.observe(viz);
};

/* ── motion controls — none in the UI; motion is toggled from Settings ── */
MOTION.buildControls = function(){
  const panel = MOTION.panel();
  if(!panel) return;
  /* the corner dot was removed — clean up any left-over instance */
  const old = panel.querySelector(':scope > #vizDot');
  if(old) old.remove();
};



/* ── picker ── */
MOTION.buildPicker = function(){
  if(document.getElementById('motionPicker')) return;
  const el = document.createElement('div');
  el.id = 'motionPicker';
  el.hidden = true;
  el.innerHTML =
    '<div class="motion-picker-head"><span>Motion effect</span>' +
    '<button data-act="motion-close" title="Close">✕</button></div>' +
    '<div class="motion-row"><span>Effect</span><select id="motionEffectSel"></select></div>' +
    '<div class="motion-row"><span>Speed</span><input type="range" id="motionSpeedRng" min="0.2" max="2.5" step="0.1"></div>' +
    '<div class="motion-row"><span>Intensity</span><input type="range" id="motionIntensityRng" min="0.2" max="2" step="0.1"></div>' +
    '<div class="motion-row"><span>Colour</span><input type="color" id="motionColorInp"></div>' +
    '<div class="motion-row"><span>Sync to music</span><button class="tgl" id="motionSyncTgl"></button></div>' +
    '<div class="motion-row"><span>Reactivity</span><input type="range" id="motionReactRng" min="0" max="2" step="0.1"></div>' +
    '<div class="motion-row"><span>On</span><button class="tgl" id="motionToggle"></button></div>';
  document.body.appendChild(el);

  const sel = el.querySelector('#motionEffectSel');
  MOTION.EFFECTS.forEach(function(id){
    const o = document.createElement('option');
    o.value = id; o.textContent = id;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function(){
    const c = MOTION.cfg();
    c.motionEffect = sel.value;
    if(c.motionEffect === 'none') c.motionOn = false;   /* none = the normal bars */
    save(); MOTION.sync();
  });
  el.querySelector('#motionSpeedRng').addEventListener('input', function(){
    MOTION.cfg().motionSpeed = parseFloat(this.value); save();
  });
  el.querySelector('#motionIntensityRng').addEventListener('input', function(){
    MOTION.cfg().motionIntensity = parseFloat(this.value); save();
  });
  el.querySelector('#motionColorInp').addEventListener('input', function(){
    MOTION.cfg().motionColor = this.value; save();
  });
  el.querySelector('#motionToggle').addEventListener('click', function(){ MOTION.toggle(); });
  el.querySelector('#motionSyncTgl').addEventListener('click', function(){
    const c = MOTION.cfg(); c.motionSync = !c.motionSync; save(); MOTION.fillPicker();
  });
  el.querySelector('#motionReactRng').addEventListener('input', function(){
    MOTION.cfg().motionReact = parseFloat(this.value); save();
  });
};

MOTION.fillPicker = function(){
  const el = document.getElementById('motionPicker');
  if(!el) return;
  const c = MOTION.cfg();
  el.querySelector('#motionEffectSel').value = c.motionEffect;
  el.querySelector('#motionSpeedRng').value = c.motionSpeed;
  el.querySelector('#motionIntensityRng').value = c.motionIntensity;
  el.querySelector('#motionColorInp').value = c.motionColor;
  el.querySelector('#motionSyncTgl').classList.toggle('on', !!c.motionSync);
  el.querySelector('#motionReactRng').value = c.motionReact;
  el.querySelector('#motionToggle').classList.toggle('on', !!c.motionOn);
};

MOTION.openPicker = function(){
  MOTION.buildPicker();
  MOTION.fillPicker();
  const el = document.getElementById('motionPicker');
  const dot = document.getElementById('vizDot');
  el.hidden = false;
  const r = dot ? dot.getBoundingClientRect() : null;
  if(r){
    el.style.left = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, r.right - el.offsetWidth)) + 'px';
    el.style.top  = Math.max(8, r.top - el.offsetHeight - 10) + 'px';
  }
};
MOTION.closePicker = function(){
  const el = document.getElementById('motionPicker');
  if(el) el.hidden = true;
};


MOTION.toggle = function(){
  const c = MOTION.cfg();
  c.motionOn = !c.motionOn;
  if(c.motionOn && c.motionEffect === 'none') c.motionEffect = 'rain';
  save(); MOTION.sync();
  toast(c.motionOn ? 'Motion: ' + c.motionEffect : 'Motion off');
};

/* ── the canvas follows the audio element, so play/pause drives it ── */
MOTION.bindAudio = function(){
  const a = window.Music && window.Music.audio;
  if(!a || a === MOTION._audio) return;
  MOTION._audio = a;
  ['play', 'playing', 'pause', 'ended', 'emptied', 'error'].forEach(function(ev){
    a.addEventListener(ev, function(){ MOTION.sync(); });
  });
};

/* ── the one entry point everything else calls ── */
MOTION.sync = function(){
  const c = MOTION.cfg();
  MOTION.attach();
  MOTION.bindAudio();
  MOTION.watch();
  MOTION.buildControls();
  MOTION.buildPicker();

  const on = MOTION.on();
  const viz = MOTION.viz();
  if(viz) viz.classList.toggle('motion-on', on);

  if(on){ MOTION.resize(); MOTION.start(); }
  else  { MOTION.stop(); MOTION.clear(); MOTION.closePicker(); }

  const dot = document.getElementById('vizDot');
  if(dot){
    dot.classList.toggle('active', !!c.motionOn);
    dot.setAttribute('aria-pressed', String(!!c.motionOn));
  }
  MOTION.fillPicker();

  /* hand the bars back to the audio analyser when motion goes off */
  if(!on && MOTION._wasOn && typeof startBeatVisualizer === 'function'){
    setTimeout(function(){ startBeatVisualizer(); }, 0);
  }
  MOTION._wasOn = on;
};
window.MOTION = MOTION;

/* ── clicks ── */
document.addEventListener('click', function(e){
  if(e.target.closest('#musicPanel .viz-dot')){
    e.preventDefault(); e.stopPropagation();
    MOTION.toggle();
    return;
  }
  if(e.target.closest('#musicPanel .viz-picker-btn')){
    e.preventDefault(); e.stopPropagation();
    const el = document.getElementById('motionPicker');
    if(el && !el.hidden) MOTION.closePicker(); else MOTION.openPicker();
    return;
  }
  if(e.target.closest('[data-act="motion-close"]')){
    e.preventDefault(); e.stopPropagation();
    MOTION.closePicker();
    return;
  }
  const el = document.getElementById('motionPicker');
  if(el && !el.hidden && !e.target.closest('#motionPicker')) MOTION.closePicker();
}, true);

/* right-click the dot also opens the picker */
document.addEventListener('contextmenu', function(e){
  if(e.target.closest('#musicPanel .viz-dot')){
    e.preventDefault();
    MOTION.openPicker();
  }
}, true);

/* re-measure when the panel is shown/hidden or the window resizes */
window.addEventListener('resize', function(){ if(MOTION.on()) MOTION.resize(); });
document.addEventListener('visibilitychange', function(){ if(document.hidden) MOTION.stop(); });

