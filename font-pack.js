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
