/* ═══════════════════════════════════════════════════════════
   ScriptForge — Translate

   The translator used to draw itself inside the FAB's right-click
   card, which scrolls and clips — so it looked like nothing happened
   when you clicked Translate.

   This one is its own floating card beside the FAB. Clicking
   Translate in that menu (or the Translate chip anywhere) opens it,
   with English ↔ हिन्दी as the first two buttons and the whole
   language grid underneath.

   Loaded after app.js, and it takes over window.openFabTranslate.
   ═══════════════════════════════════════════════════════════ */
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
