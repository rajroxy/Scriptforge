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

   This file's whole job is keeping those two attributes true.
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
