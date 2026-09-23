/* ═══════════════════════════════════════════════════════════
   Outline · Manuscript — right-click, and the AI names your sections

   Right-click anywhere on the Outline page — or on the Manuscript
   page, outside the writing area — and the menu carries the four
   naming jobs, in the app's own menu language:

     Chapter titles        a name for every chapter
     Chapter subtitles     one line under each chapter name
     Subchapter titles     a name for every subchapter
     Subchapter subtitles  one line under each subchapter name
     ———
     Check the order       does the structure hold?

   The manuscript adds Scene headings (a script's slug lines).
   The same jobs also join the right-click assistant's menu on these
   pages, and the manuscript's own text menu carries them too, so the
   FAB, the page and the editor agree.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const F = window.AI_FNS || (window.AI_FNS = {});
  const ask = function(title, sub, prompt){
    if(typeof window.sfAsk === 'function'){ window.sfAsk(title, sub, prompt); return; }
    if(typeof runAI === 'function') runAI(prompt, title, sub);
  };
  const brief = function(){
    try{ return String((typeof sfProjectBrief === 'function') ? sfProjectBrief() : ''); }
    catch(e){ return ''; }
  };

  /* ── the two new jobs ── */
  F.olChapterSubs = function(){
    ask('Chapter subtitles', 'Outline',
      'You name chapters for a living.\n\n' + brief() + '\n\n' +
      'Task: give EVERY chapter in the structure above a SUBTITLE — a single line that sits\n' +
      'under the chapter name, the way a subtitle does on a book page.\n' +
      'Rules: 3–9 words each, evocative but plain, never a repeat of the chapter title,\n' +
      'the same voice across all of them, no numbers, no quotes, no punctuation at the end.\n' +
      'Reply as a plain list — "chapter number — subtitle" — and nothing else.');
  };

  F.olSubSubs = function(){
    ask('Subchapter subtitles', 'Outline',
      'You name scenes inside chapters.\n\n' + brief() + '\n\n' +
      'Task: for every subchapter in the structure above, write a SUBTITLE — one line under\n' +
      'its name, the turn the scene takes.\n' +
      'Rules: 3–9 words, concrete, same voice, in order, no numbering in the line itself.\n' +
      'Reply as a plain list — "chapter — subchapter: subtitle" — and nothing else.');
  };

  /* ── the menu ── */
  const NAMING = [
    { fn:'olChapterTitles', icon:'bookmark-fill', label:'Chapter titles' },
    { fn:'olChapterSubs',   icon:'text-paragraph', label:'Chapter subtitles' },
    { fn:'olSubTitles',     icon:'signpost-2',    label:'Subchapter titles' },
    { fn:'olSubSubs',       icon:'text-indent-left', label:'Subchapter subtitles' }
  ];
  const ITEMS = {
    outline: NAMING.concat([
      null,
      { fn:'olStructure', icon:'list-nested', label:'Check the order' }
    ]),
    manuscript: NAMING.concat([
      null,
      { fn:'msSceneHeading', icon:'film', label:'Scene headings' },
      { fn:'olStructure',    icon:'list-nested', label:'Check the order' }
    ])
  };

  /* the ids each host page answers to, in the order they are checked.
     The manuscript is opened under 'manuscript' AND under the alias 'write'
     (the chapter strip and the chapter buttons navigate there), and the
     mode-specific writing pages draw the same thing — every one of them
     carries the naming jobs. */
  const HOSTS = {
    outline:    ['outline'],
    manuscript: ['manuscript', 'write', 'chapters', 'scenes', 'episodes', 'acts', 'stanzas', 'verses']
  };
  const activeHost = function(){
    const keys = Object.keys(HOSTS);
    for(let i = 0; i < keys.length; i++){
      const list = HOSTS[keys[i]];
      for(let j = 0; j < list.length; j++){
        const el = document.getElementById('page-' + list[j]);
        if(el && el.classList.contains('active')) return { id: keys[i], el: el };
      }
    }
    return null;
  };

  let menu = null;
  const close = function(){
    if(menu){ menu.remove(); menu = null; }
  };

  const build = function(host, x, y){
    close();
    menu = document.createElement('div');
    menu.className = 'menu sf-ctx';
    menu.innerHTML = (ITEMS[host] || ITEMS.outline).map(function(it){
      if(!it) return '<div class="menu-sep"></div>';
      return '<button class="menu-item" data-sfctx="' + it.fn + '">'
        + '<i class="mi-icon bi bi-' + it.icon + '"></i>' + it.label + '</button>';
    }).join('');
    document.body.appendChild(menu);

    const w = menu.offsetWidth || 220, h = menu.offsetHeight || 200;
    const vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
    menu.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
    menu.style.top  = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
  };

  document.addEventListener('contextmenu', function(e){
    const host = activeHost();
    if(!host) return;
    const t = e.target;
    if(!t || !t.closest) return;
    if(!host.el.contains(t)) return;
    /* typing keeps its own menu — except the Fountain source on the script
       page, where this menu is the only way to reach the naming jobs */
    if(t.closest('input, textarea, [contenteditable="true"]') && !t.closest('.fnt-src')) return;
    e.preventDefault();
    build(host.id, e.clientX, e.clientY);
  }, true);

  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('[data-sfctx]')){
      e.preventDefault();
      const fn = t.closest('[data-sfctx]').dataset.sfctx;
      close();
      if(F[fn]) F[fn]();
      else if(typeof toast === 'function') toast('That action is not available', 'warn');
      return;
    }
    if(menu && t !== menu && !(menu.contains && menu.contains(t))) close();
  }, true);

  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); }, true);
  window.addEventListener('blur', close);
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);

  /* the right-click assistant's menu on these pages says the same things:
     the two subtitle jobs are added where the page's own names are used */
  const FAB_SUBS = {
    outline: [
      { fn:'olChapterSubs', after:'olChapterTitles', icon:'text-paragraph',
        label:'Chapter subtitles', desc:'One line under every chapter name' },
      { fn:'olSubSubs', after:'olSubTitles', icon:'text-indent-left',
        label:'Subchapter subtitles', desc:'One line under every subchapter name' }
    ],
    manuscript: [
      { fn:'msChapterSubs', after:'msChapterTitles', icon:'text-paragraph',
        label:'Chapter subtitles', desc:'One line under every chapter name' },
      { fn:'msSubSubs', after:'msSubTitles', icon:'text-indent-left',
        label:'Subchapter subtitles', desc:'One line under every subchapter name' }
    ]
  };
  if(typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI){
    Object.keys(FAB_SUBS).forEach(function(page){
      const list = SF_FAB_AI[page];
      if(!Array.isArray(list)) return;
      FAB_SUBS[page].forEach(function(o){
        if(list.some(function(x){ return x.fn === o.fn; })) return;
        const at = list.findIndex(function(x){ return x.fn === o.after; });
        /* each one sits right under the job it belongs to */
        if(at < 0) list.push(o);
        else list.splice(at + 1, 0, o);
      });
    });
  }
})();
