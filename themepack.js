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
