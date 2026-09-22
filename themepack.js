/* ═══════════════════════════════════════════════════════════
   THEME PACK — light · dark · nine palettes

   Every colour theme ships one palette that works in both modes:
   the dark palette the theme was built with, and a light palette
   derived from it (same hue, flipped surfaces and ink). The Mode
   switch in Settings → Appearance picks which one is painted.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof THEMES === 'undefined' || !Array.isArray(THEMES)) return;

  /* ── 1 · the ninth theme ── */
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

  /* ── 2 · colour maths ── */
  const toRgb = function(col){
    const s = String(col == null ? '' : col).trim();
    let m = /^#([0-9a-f]{3})$/i.exec(s);
    if(m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    m = /^#([0-9a-f]{6})$/i.exec(s);
    if(m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    m = /rgba?\(([^)]+)\)/i.exec(s);
    if(m){
      const p = m[1].split(',').map(function(x){ return parseFloat(x); });
      return [p[0] || 0, p[1] || 0, p[2] || 0];
    }
    return null;
  };

  const rgbToHsl = function(rgb){
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if(max !== min){
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if(max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if(max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };

  const hslHex = function(h, s, l){
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (((h % 360) + 360) % 360) / 60;
    const x = c * (1 - Math.abs(hp % 2 - 1));
    let r = 0, g = 0, b = 0;
    if(hp < 1){ r = c; g = x; }
    else if(hp < 2){ r = x; g = c; }
    else if(hp < 3){ g = c; b = x; }
    else if(hp < 4){ g = x; b = c; }
    else if(hp < 5){ r = x; b = c; }
    else { r = c; b = x; }
    const m = l - c / 2;
    const to = function(v){ return Math.round((v + m) * 255); };
    return '#' + [to(r), to(g), to(b)].map(function(v){ return ('0' + v.toString(16)).slice(-2); }).join('');
  };

  const mixAcc = function(col, dl){
    const rgb = toRgb(col);
    if(!rgb) return col;
    const hsl = rgbToHsl(rgb);
    const s = hsl[1] < .12 ? hsl[1] : Math.min(.92, Math.max(.35, hsl[1]));   /* near-greys stay grey */
    return hslHex(hsl[0], s, Math.max(.22, Math.min(.62, hsl[2] + dl)));
  };

  /* ── light palettes: nine separate ones, one per theme ──
     [ paper hue, paper saturation, accent, paper lightness ].
     The paper gives the page its own character — warm sand, cream, cool
     grey, plain white, blue-grey, blush, sage, neutral, lilac — and the
     accent is that theme's own colour, darkened until it reads as ink. */
  const LIGHT_SPEC = {
    night:    [ 28, .62, '#b9611f', .9520 ],   /* warm sand, terracotta */
    lamp:     [ 40, .78, '#9c6a12', .9660 ],   /* cream, amber */
    ink:      [212, .26, '#2a6795', .9605 ],   /* cool grey, steel blue */
    noir:     [  0, .00, '#18181b', .9880 ],   /* plain white, near-black */
    midnight: [226, .52, '#3350c4', .9590 ],   /* blue-grey, blue */
    ember:    [ 14, .58, '#b83f26', .9610 ],   /* blush, ember red */
    forest:   [148, .40, '#256b47', .9585 ],   /* sage, pine green */
    graphite: [220, .10, '#48525d', .9650 ],   /* neutral, slate */
    plum:     [268, .52, '#6f45c8', .9600 ]    /* lilac, violet */
  };
  const LIGHT_FALLBACK = LIGHT_SPEC.graphite;

  /* the same theme, flipped to a light page of its own */
  const lightPalette = function(id, p){
    const spec = LIGHT_SPEC[id] || LIGHT_FALLBACK;
    const hue = spec[0];
    const sat = spec[1];
    const acc = spec[2];
    const base = spec[3] != null ? spec[3] : .962;      /* the paper's own lightness */
    const acc2 = mixAcc(acc, -.07);
    const aRgb = toRgb(acc) || [0, 0, 0];
    const a = aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2];
    const ps = Math.min(sat, .80) * 1.05;               /* how strongly the page is tinted */
    const is = Math.min(.16, sat * .34);                /* a whisper of the same hue in the ink */
    const n = function(dl, s){ return hslHex(hue, s, Math.max(.78, Math.min(.995, base + dl))); };

    return {
      bg:   n(0, ps),
      s1:   n(-.014, ps * .96),
      s2:   n(-.030, ps * .92),
      s3:   n(-.052, ps * .88),
      s4:   n(-.078, ps * .84),
      s5:   n(-.108, ps * .80),
      ov:   'rgba(17,17,22,.045)',
      ovs:  'rgba(17,17,22,.075)',
      ink:  n(-.815, is),
      ink2: n(-.665, is * .9),
      ink3: n(-.525, is * .8),
      ink4: n(-.390, is * .7),
      line:  n(-.055, ps * .84),
      line2: n(-.098, ps * .84),
      line3: n(-.190, ps * .84),
      acc: acc, acc2: acc2, accInk: '#ffffff',
      accSoft: 'rgba(' + a + ',.12)',
      accLine: 'rgba(' + a + ',.34)',
      grad: 'linear-gradient(135deg,' + acc + ' 0%,' + acc2 + ' 100%)',
      docBg:  n(0, ps * .55),
      docInk: n(-.775, is),
      caret: acc, sel: acc, selInk: '#ffffff'
    };
  };

  /* ── 2b · NINE LIGHT THEMES — their own set, for light mode ──
     Not the dark themes flipped: light mode gets its own nine palettes,
     each with its own paper and its own accent. ── */
  const LP = function(bg, s1, s2, s3, s4, s5, ink, ink2, ink3, ink4, line, line2, line3, acc, acc2, docBg, docInk, sel){
    const hex = function(c){ const r = toRgb(c) || [0,0,0]; return r[0] + ',' + r[1] + ',' + r[2]; };
    return {
      bg:bg, s1:s1, s2:s2, s3:s3, s4:s4, s5:s5,
      ov:'rgba(17,18,24,.045)', ovs:'rgba(17,18,24,.075)',
      ink:ink, ink2:ink2, ink3:ink3, ink4:ink4,
      line:line, line2:line2, line3:line3,
      acc:acc, acc2:acc2, accInk:'#ffffff',
      accSoft:'rgba(' + hex(acc) + ',.12)', accLine:'rgba(' + hex(acc) + ',.34)',
      grad:'linear-gradient(135deg,' + acc + ' 0%,' + acc2 + ' 100%)',
      docBg:docBg, docInk:docInk, caret:acc, sel:sel, selInk:'#ffffff'
    };
  };

  const LIGHT_THEMES = [
    { id:'paper', light:true, name:'Paper', note:'Plain white — quiet, neutral, blue accent',
      palette: LP('#fbfbfd','#f7f7f9','#f1f1f4','#e9e9ee','#e0e0e6','#d5d5dd',
                  '#16171b','#3c3f47','#5c6068','#8b8f98',
                  '#e6e6ea','#dcdce2','#c9c9d2','#2f6dd0','#245bb3','#ffffff','#191b20','#2f6dd0') },

    { id:'cream', light:true, name:'Cream', note:'Warm cream — amber accent, easy on the eyes',
      palette: LP('#fdf9f0','#faf3e6','#f6ecd9','#f0e3c9','#e8d8b8','#dfcba5',
                  '#241c11','#4b3d29','#6d5c42','#9a8a70',
                  '#ecdfc6','#e3d3b4','#d3be97','#9a6b12','#7d550c','#fffdf7','#2a2113','#9a6b12') },

    { id:'sand', light:true, name:'Sand', note:'Warm sand — terracotta accent',
      palette: LP('#fdf6ef','#f9eee4','#f5e5d7','#eedac7','#e5cdb5','#dbc0a2',
                  '#2a1c12','#54402f','#77604a','#a08a75',
                  '#ecd9c6','#e3cbb4','#d3b699','#b9611f','#96501a','#fffaf5','#322216','#b9611f') },

    { id:'fog', light:true, name:'Fog', note:'Cool grey — steel blue accent',
      palette: LP('#f8fafc','#f2f6f9','#ebf0f5','#e2e9f0','#d7e0e9','#c9d4e0',
                  '#141a20','#3a4650','#5b6a78','#8a99a8',
                  '#e0e8ef','#d5dfe8','#c1cedb','#2a6795','#215376','#fdfeff','#171e25','#2a6795') },

    { id:'mist', light:true, name:'Mist', note:'Pale blue — indigo accent',
      palette: LP('#f7f8fd','#f1f3fa','#e9ecf7','#dfe4f2','#d3d9ec','#c3cbe4',
                  '#161a2b','#3b415e','#5b6484','#8b93b0',
                  '#dee3f2','#d2d9ec','#bcc5de','#3350c4','#2a42a4','#fdfdff','#191d31','#3350c4') },

    { id:'blush', light:true, name:'Blush', note:'Warm pink paper — crimson accent',
      palette: LP('#fdf7f7','#faefef','#f6e6e6','#f0dada','#e8cbcb','#ddb9b9',
                  '#2b1717','#573535','#7c5353','#a88383',
                  '#efd9d9','#e7cbcb','#d9b3b3','#b83f26','#96331e','#fffafa','#311a1a','#b83f26') },

    { id:'sage', light:true, name:'Sage', note:'Soft green paper — pine accent',
      palette: LP('#f7faf7','#f0f6f0','#e7f0e7','#dceadd','#cee1cf','#bcd5be',
                  '#152018','#37463b','#556a58','#839785',
                  '#dceadd','#cee1cf','#b7cdb9','#256b47','#1d5638','#fbfdfb','#18231b','#256b47') },

    { id:'lilac', light:true, name:'Lilac', note:'Soft violet paper — violet accent',
      palette: LP('#faf8fd','#f4f1fa','#ede9f7','#e4def2','#d8d0ec','#c9bfe4',
                  '#1d1630','#413a5c','#615a81','#8f88ac',
                  '#e3ddf2','#d8d0ec','#c3b8de','#6f45c8','#5c37ab','#fdfcff','#201836','#6f45c8') },

    { id:'slate', light:true, name:'Slate', note:'Neutral graphite paper — slate accent',
      palette: LP('#f9fafb','#f3f5f7','#eceff2','#e3e7eb','#d8dde3','#cbd1d8',
                  '#161a1e','#3d464e','#5f6a74','#8e98a2',
                  '#e2e7ec','#d6dce3','#c3cad2','#48525d','#39424b','#fdfefe','#191d22','#48525d') }
  ];

  window.sfLightThemes = function(){ return LIGHT_THEMES; };
  window.sfLightThemeById = function(id){
    return LIGHT_THEMES.filter(function(t){ return t.id === id; })[0] || LIGHT_THEMES[0];
  };

  /* ── 3 · tokens ── */
  const tokensFor = function(p, dark){
    return {
      '--bg':p.bg, '--surface-1':p.s1, '--surface-2':p.s2, '--surface-3':p.s3,
      '--surface-4':p.s4, '--surface-5':p.s5,
      '--overlay':p.ov, '--overlay-strong':p.ovs,
      '--ink':p.ink, '--ink-2':p.ink2, '--ink-3':p.ink3, '--ink-4':p.ink4,
      '--line':p.line, '--line-2':p.line2, '--line-3':p.line3,
      '--accent':p.acc, '--accent-2':p.acc2, '--accent-soft':p.accSoft,
      '--accent-line':p.accLine, '--accent-ink':p.accInk, '--grad':p.grad,
      '--doc-bg':p.docBg, '--doc-ink':p.docInk,
      '--caret':p.caret, '--sel':p.sel, '--sel-ink':p.selInk,
      '--e-1': dark ? '0 1px 2px rgba(0,0,0,.40)'   : '0 1px 2px rgba(0,0,0,.06)',
      '--e-2': dark ? '0 4px 12px rgba(0,0,0,.45)'  : '0 4px 12px rgba(0,0,0,.08)',
      '--e-3': dark ? '0 8px 24px rgba(0,0,0,.50)'  : '0 8px 24px rgba(0,0,0,.10)',
      '--e-4': dark ? '0 16px 40px rgba(0,0,0,.55)' : '0 16px 40px rgba(0,0,0,.14)'
    };
  };

  /* ── 4 · the mode ── */
  const modeOf = function(){
    return (window.S && S.config && S.config.themeMode === 'light') ? 'light' : 'dark';
  };
  window.sfThemeMode = modeOf;
  window.sfThemeIsLight = function(){ return modeOf() === 'light'; };

  /* the swatch a theme tile shows, in the mode you are in */
  window.sfThemeSwatch = function(t){
    if(!t) return { c1:'#333', c2:'#888' };
    if(t.light) return { c1:t.palette.s3, c2:t.palette.acc };      /* a light theme is already light */
    if(modeOf() !== 'light' || !t.palette) return { c1:t.c1, c2:t.c2 };
    const lp = lightPalette(t.id, t.palette);
    return { c1:lp.s3, c2:lp.acc };
  };

  /* the theme that should be painted right now */
  window.sfActiveTheme = function(){
    if(modeOf() === 'light') return window.sfLightThemeById(S.config.themeLight || 'paper');
    return themeById(S.config.theme || 'night');
  };

  window.setThemeMode = function(m){
    if(!S.config) S.config = {};
    S.config.themeMode = (m === 'light') ? 'light' : 'dark';
    if(typeof save === 'function') save();
    if(typeof applyThemeVars === 'function'){
      applyThemeVars(S.config.themeMode === 'light'
        ? (S.config.themeLight || 'paper')
        : (S.config.theme || 'night'));
    }
  };

  /* ── 5 · teach the theme system about the mode ── */
  const origTokens = window.themeTokens;
  window.themeTokens = function(t){
    if(!t || !t.palette) return origTokens.apply(this, arguments);
    if(t.light) return tokensFor(t.palette, false);
    if(modeOf() === 'light') return tokensFor(lightPalette(t.id, t.palette), false);
    return tokensFor(t.palette, !!t.dark);
  };

  const origApply = window.applyThemeVars;
  window.applyThemeVars = function(id){
    const html = document.documentElement, body = document.body;

    /* light mode paints one of the nine light themes */
    if(modeOf() === 'light'){
      const lt = window.sfLightThemeById((S.config && S.config.themeLight) || 'paper');
      const toks = window.themeTokens(lt);
      Object.keys(toks).forEach(function(k){
        html.style.setProperty(k, toks[k]);
        body.style.setProperty(k, toks[k]);
      });
      html.style.colorScheme = 'light';
      body.style.colorScheme = 'light';
      body.setAttribute('data-theme', lt.id);
      body.setAttribute('data-theme-resolved', lt.id);
      body.setAttribute('data-theme-mode', 'light');
      try{
        localStorage.setItem('sf6_theme', JSON.stringify({
          id: lt.id, resolved: lt.id, dark: false, scheme: 'light', tokens: toks
        }));
      }catch(e){}
      return lt;
    }

    const t = origApply.apply(this, arguments);
    const scheme = 'dark';
    html.style.colorScheme = scheme;
    body.style.colorScheme = scheme;
    body.setAttribute('data-theme-mode', scheme);
    try{
      localStorage.setItem('sf6_theme', JSON.stringify({
        id: id || (S.config && S.config.theme) || 'night',
        resolved: (t && t.id) || id,
        dark: true,
        scheme: scheme,
        tokens: window.themeTokens(t)
      }));
    }catch(e){}
    return t;
  };
})();
