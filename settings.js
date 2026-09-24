/* ═══════════════════════════════════════════════════════════
   ScriptForge — Settings
   Modal settings · Per-mode format page
   ═══════════════════════════════════════════════════════════ */

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
      // and the sheets are scoped to them (see styles-pack.js / .css)
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
  /* ── YOUR NAME ──
     The dashboard greets the writer by it (welcome.js), and it signs the
     exports. It can be typed here, or handed in with a ?name= link, or
     picked up from GitHub — all three write the same setting. */
  const cName = card('Your name', 'person-badge');
  const nameInp = document.createElement('input');
  nameInp.type = 'text';
  nameInp.className = 'inp';
  nameInp.maxLength = 40;
  nameInp.placeholder = 'Your name';
  nameInp.value = S.config.userName || '';
  nameInp.style.minWidth = '200px';
  const nameSet = function(){
    const typed = String(nameInp.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    S.config.userName = typed;
    if(typed && !String(S.config.authorName || '').trim()) S.config.authorName = typed;
    save();
    /* the greeting follows immediately — no reload, no page change */
    try{ if(typeof window.sfWelcomeRefresh === 'function') window.sfWelcomeRefresh(); }catch(e){}
    if(typeof toast === 'function') toast(typed ? 'The app will greet you as ' + typed : 'The greeting is back to plain “Welcome back”');
  };
  nameInp.onchange = nameSet;
  nameInp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); nameSet(); nameInp.blur(); } });
  cName.appendChild(row('Your name', 'Shown under “Welcome back” on the dashboard, and used to sign your exports', nameInp));
  root.appendChild(cName);

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
