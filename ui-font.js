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

   Loaded last. Nothing here reaches into a page.
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
