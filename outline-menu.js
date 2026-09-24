/* ═══════════════════════════════════════════════════════════
   Outline · Manuscript — right-click, and the AI names your sections

   Right-click anywhere on the Outline page — or on the Manuscript
   page, outside the writing area — and the menu carries the four
   naming jobs, in the app's own menu language:

     Chapter titles        a name for every chapter
     Chapter description   what every chapter covers
     Subchapter titles     a name for every subchapter
     Subchapter description  what happens in each subchapter
     ———
     Check the order       does the structure hold?

   The two pairs are DIFFERENT jobs and stay different: a title is a name
   (2–5 words, dropped on the outline row), a description is what the
   section is for (a sentence or two, for the writer and the assistant
   rather than for the reader). They were called “subtitles”, which put
   them next to the title jobs and made them read like a second name —
   the app says “description” now, which is what they write.

   The naming jobs live on the Outline page and nowhere else: the
   manuscript is a writing page, so its right-click carries the writing
   and the language actions plus the structure check, and no naming.
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

  /* ── the two description jobs ──
     The pair that used to ask for a SUBTITLE: one line of atmosphere under
     a name, which is a second title by another route. What the writer wants
     there is what the section IS — so these ask for a description, which is
     a sentence or two about what happens and what the section is for. */
  F.olChapterSubs = function(){
    ask('Chapter description', 'Outline',
      'You write reference notes on other writers\u2019 outlines.\n\n' + brief() + '\n\n' +
      'Task: write a short DESCRIPTION of what EVERY chapter in the structure above covers —\n' +
      'what happens in it and what it is for in the whole.\n' +
      'Rules: two or three sentences each, plain and concrete; use only what the outline, the plan,\n' +
      'the Bible and the drafts actually say and never invent events, names or places; where a\n' +
      'chapter is still empty, write "not yet planned" and nothing more. No titles, no praise.\n' +
      'Reply as a plain list — "chapter number — description" — and nothing else.');
  };

  F.olSubSubs = function(){
    ask('Subchapter description', 'Outline',
      'You write reference notes on other writers\u2019 outlines.\n\n' + brief() + '\n\n' +
      'Task: for every subchapter in the structure above, write a short DESCRIPTION — one or two\n' +
      'sentences on what happens in it, in order.\n' +
      'Rules: plain and concrete; use only what the project actually says and never invent events,\n' +
      'names or places; where one is still empty, write "not yet planned". No titles, no praise.\n' +
      'Reply as a plain list — "chapter — subchapter: description" — and nothing else.');
  };

  /* ── the menu ── */
  const NAMING = [
    { fn:'olChapterTitles', icon:'bookmark-fill',    label:'Chapter titles' },
    { fn:'olChapterSubs',   icon:'text-paragraph',   label:'Chapter description' },
    { fn:'olSubTitles',     icon:'signpost-2',       label:'Subchapter titles' },
    { fn:'olSubSubs',       icon:'text-indent-left', label:'Subchapter description' }
  ];
  /* the writing actions — the same ones the editor's own menu carries, so the
     manuscript's right-click says the same thing wherever you click it */
  const TEXT_ACTIONS = [
    { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
    { fn:'improve',    icon:'stars',               label:'Improve' },
    { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' },
    { fn:'continue',   icon:'arrow-right-circle',  label:'Continue writing' },
    { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
    { fn:'summarize',  icon:'card-text',           label:'Summarize' }
  ];
  const LANGUAGE = [
    { fn:'translate',        icon:'translate', label:'Translate' },
    { fn:'hinglishToHindi',  icon:'translate', label:'Hinglish → हिन्दी' },
    { fn:'hinglishToEnglish',icon:'translate', label:'Hinglish → English' }
  ];

  const ITEMS = {
    /* the naming jobs belong to the Outline page — the manuscript carries the
       writing and the language actions, and nothing that names its sections */
    outline: NAMING.concat([
      null,
      { fn:'olStructure', icon:'list-nested', label:'Check the order' }
    ]),
    manuscript: [ { fn:'olStructure', icon:'list-nested', label:'Check the order' } ]
      .concat([ null ], TEXT_ACTIONS, [ null ], LANGUAGE)
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
     each description job is added under the title job it belongs to. The
     labels here are the novel ones — fab-fix.js re-writes them in the
     form's own words (Scene · Sub-scene) as the panel is drawn. */
  const FAB_SUBS = {
    outline: [
      { fn:'olChapterSubs', after:'olChapterTitles', icon:'text-paragraph',
        label:'Chapter description', desc:'Describe what every chapter covers, from your outline' },
      { fn:'olSubSubs', after:'olSubTitles', icon:'text-indent-left',
        label:'Subchapter description', desc:'Describe what happens in each subchapter' }
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
