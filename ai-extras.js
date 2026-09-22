/* ═══════════════════════════════════════════════════════════
   ScriptForge — AI panel extras.

   Loaded after app.js / pages-fix.js.

   1 · Translate — the FAB's right-click translator gets the four
       quick pairs everyone actually uses (English, Hindi, Hinglish),
       right at the top of the popup, above the full language grid.
   ═══════════════════════════════════════════════════════════ */

/* ── 1 · quick translation pairs ── */
(function(){
  if(typeof window.openFabTranslate !== 'function') return;
  const orig = window.openFabTranslate;

  const PAIRS = [
    { label:'English → हिन्दी',    from:'English', to:'Hindi, written in Devanagari script' },
    { label:'हिन्दी → English',    from:'Hindi',   to:'English' },
    { label:'English → Hinglish',  from:'English', to:'Hinglish — Hindi written in Roman script, the way people actually type it' },
    { label:'Hinglish → English',  from:'Hinglish', to:'English' }
  ];

  const sourceText = function(){
    try{
      if(typeof ctxTxt === 'function') return ctxTxt();
    }catch(e){}
    const cell = document.querySelector('.fab-ai .fab-translate .ft-text');
    const t = cell ? cell.textContent.trim() : '';
    return (t === 'Editor is empty') ? '' : t;
  };

  const run = async function(p, dst, nameEl){
    const txt = sourceText();
    if(nameEl) nameEl.textContent = p.label;
    if(!txt){
      if(dst) dst.innerHTML = '<span style="color:var(--ink-4)">Nothing to translate</span>';
      return;
    }
    if(dst) dst.innerHTML = '<span class="ft-busy">Translating…</span>';
    try{
      const res = await callAI(
        'Translate the text below from ' + p.from + ' into ' + p.to + '.\n' +
        'Preserve the tone, the meaning and the paragraph breaks. Do not explain, do not add notes — ' +
        'return only the translation.\n\n"""\n' + txt + '\n"""');
      if(dst) dst.textContent = (res || '').trim() || 'No response';
    }catch(err){
      if(dst) dst.innerHTML = '<span style="color:var(--ink-3)">' + esc(err.message) + '</span>';
    }
  };

  window.openFabTranslate = function(){
    orig.apply(this, arguments);

    const wrap = document.querySelector('.fab-ai .fab-translate');
    if(!wrap || wrap.querySelector('.ft-pairs')) return;

    const row = document.createElement('div');
    row.className = 'ft-pairs';
    row.innerHTML =
      '<span class="ft-pairs-label">Quick translate</span>'
      + '<div class="ft-pairs-row">'
      + PAIRS.map(function(p, i){
          return '<button class="ft-pair" data-ftpair="' + i + '">' + p.label + '</button>';
        }).join('')
      + '</div>';

    wrap.insertBefore(row, wrap.firstChild);

    row.addEventListener('click', function(e){
      const b = e.target.closest('[data-ftpair]');
      if(!b) return;
      e.preventDefault();
      const p = PAIRS[parseInt(b.dataset.ftpair, 10)];
      if(!p) return;
      run(p, wrap.querySelector('#ftDst'), wrap.querySelector('#ftDstName'));
    });
  };
})();
