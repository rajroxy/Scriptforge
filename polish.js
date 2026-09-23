/* ═══════════════════════════════════════════════════════════
   ScriptForge — final polish layer

   Loaded last, so it can adjust what the layers under it draw:

     · FONT SIZE      one number that always lands — the CSS token,
                      the editor, the panes, and the toolbar's own box
     · SMALL FACTS    the draft card's + (the bar's New draft owns it),
                      the “Book” label, the statistics tile's label
     · FAB AI         the manuscript and the canvas get their own
                      right-click options, and a divider before Translate
     · PROMPT PAGE    Prompt me on the left, one button at the right that
                      opens Genres · Tags · Themes — and no settings button

   No page is re-rendered from here: it changes what is on screen.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ═══ 1 · FONT SIZE ═══ */
  const paintSize = function(px){
    px = Math.max(10, Math.min(60, Math.round(+px || 17)));
    try{ document.documentElement.style.setProperty('--doc-size', px + 'px'); }catch(e){}
    try{ document.body.style.setProperty('--doc-size', px + 'px'); }catch(e){}
    Array.prototype.forEach.call(
      document.querySelectorAll('#editor, .write-doc, .editor-doc, .sf-split-doc'),
      function(el){ el.style.fontSize = px + 'px'; }
    );
    return px;
  };

  if(typeof setFontSize === 'function'){
    const orig = window.setFontSize;
    window.setFontSize = function(px){
      const out = orig.apply(this, arguments);
      paintSize((typeof S !== 'undefined' && S.config && S.config.fontSize) || px);
      return out;
    };
  }

  /* the size box applies while you type */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset || t.dataset.tb !== 'fontSize') return;
    const px = parseInt(t.value, 10);
    if(isNaN(px)) return;
    if(typeof S !== 'undefined' && S.config) S.config.fontSize = Math.max(10, Math.min(60, px));
    paintSize(px);
    if(typeof save === 'function') save();
  }, true);

  /* and it survives every repaint of a page */
  if(typeof paintPage === 'function'){
    const op = window.paintPage;
    window.paintPage = function(){
      const r = op.apply(this, arguments);
      setTimeout(function(){
        paintSize((typeof S !== 'undefined' && S.config && S.config.fontSize) || 17);
      }, 0);
      return r;
    };
  }
  paintSize((typeof S !== 'undefined' && S.config && S.config.fontSize) || 17);

  /* ═══ 2 · SMALL FACTS ON THE PAGES ═══ */
  /* The tile the writer actually wants: the estimate of PAGES sits where
     Sections used to be, and Sections steps into the fourth tile. */
  const statsLabel = function(){
    const grid = document.querySelector('.stats-grid-kpi');
    if(!grid) return;
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.stat-card-lg'));
    if(cards.length < 4) return;
    if(cards[1].dataset.sfPages === '1') return;                      /* already done */

    const words = parseInt(String((cards[0].querySelector('.stat-big') || {}).textContent || '').replace(/[^0-9]/g, ''), 10) || 0;
    const pages = Math.max(1, Math.round(words / 250));

    /* keep what the four cards showed, then re-letter them */
    const secondVal = (cards[1].querySelector('.stat-big') || {}).textContent || '0';
    const fourthVal = (cards[3].querySelector('.stat-big') || {}).textContent || '';
    const fourthLbl = (cards[3].querySelector('.stat-lbl') || {}).textContent || '';

    const setCard = function(card, icon, value, label, title){
      const ic = card.querySelector('.stat-ico i'); if(ic) ic.className = 'bi bi-' + icon;
      const big = card.querySelector('.stat-big'); if(big) big.textContent = value;
      const lbl = card.querySelector('.stat-lbl'); if(lbl) lbl.textContent = label;
      if(title) card.setAttribute('title', title);
    };

    /* second tile → Pages */
    setCard(cards[1], 'file-earmark', pages.toLocaleString(), 'Pages', 'About 250 words a page');
    cards[1].dataset.sfPages = '1';

    /* fourth tile → Sections (with the count it was moved from) */
    if(/reading time/i.test(fourthLbl)){
      setCard(cards[3], 'file-earmark-text', secondVal, 'Sections', '');
    }else{
      setCard(cards[3], 'file-earmark-text', (fourthVal || secondVal), 'Sections', '');
    }
    cards[3].dataset.sfSections = '1';
  };

  const sweep = function(){
    /* the draft card's + — the bar's own New draft button is the way in now */
    Array.prototype.forEach.call(
      document.querySelectorAll('.draft-list-head [data-act="add-draft"]'),
      function(el){ el.remove(); }
    );

    /* the notebook's left card no longer wears a “Book” label */
    Array.prototype.forEach.call(
      document.querySelectorAll('#nbBookTitle'),
      function(el){ el.remove(); }
    );

    statsLabel();
    promptPage();
    draftTypo();
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; sweep(); });
  };
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  /* ═══ 3 · FAB AI — the manuscript and the canvas ═══ */
  /* The draft page's Typography button sits at the left of its bar, before
     New draft — the same place T takes on every other page. Idempotent, and
     it follows the button through every repaint of the page. */
  const draftTypo = function(){
    const page = document.getElementById('page-draft');
    if(!page) return;
    const bar = page.querySelector('.sf-bar');
    if(!bar) return;
    const t = page.querySelector('[data-typop="draft"]');
    if(!t || bar.firstElementChild === t) return;
    bar.insertBefore(t, bar.firstElementChild);
  };

  const canvasBrief = function(){
    let st = null;
    try{
      const proj = (typeof kbProj === 'function') ? kbProj() : null;
      const d = (typeof D === 'function') ? D() : null;
      st = (proj && proj.mindmap) || (d && d.mindmap) || null;
    }catch(e){ st = null; }
    if(!st || !Array.isArray(st.nodes) || !st.nodes.length) return 'CANVAS: (still empty — no cards yet)';

    const one = function(id){
      const n = st.nodes.filter(function(x){ return x.id === id; })[0];
      return n ? String(n.text || 'untitled').split('\n')[0].slice(0, 48) : '?';
    };
    const cards = st.nodes.map(function(n, i){
      return (i + 1) + '. ' + String(n.text || 'untitled').replace(/\s+/g, ' ').slice(0, 90);
    }).join('\n');
    const links = (st.links || []).map(function(l){ return one(l.a) + '  →  ' + one(l.b); }).join('\n');
    return 'CANVAS CARDS:\n' + cards + (links ? '\n\nCANVAS LINKS:\n' + links : '');
  };

  const ask = function(title, sub, prompt){
    if(typeof window.sfAsk === 'function'){ window.sfAsk(title, sub, prompt); return; }
    if(typeof runAI === 'function') runAI(prompt, title, sub);
  };

  /* the canvas options, dropped into the page-aware menu. The manuscript
     carries no naming jobs of its own: those belong to the Outline page, and
     the manuscript's right-click is text and structure-checking only. */
  const EXTRA = {
    mindmap: [
      { fn:'mmGrow', icon:'diagram-3', label:'Grow this canvas',
        desc:'The next cards and links this map is missing' },
      { fn:'mmGaps', icon:'question-circle', label:'What is missing',
        desc:'Read the cards and name the holes in the story' },
      { fn:'mmThreads', icon:'share', label:'Connect the threads',
        desc:'Which cards should be linked, and why' }
    ]
  };

  /* The page lists are set unconditionally: a stale or empty key here is what
     used to make a page's menu disappear. The manuscript deliberately has no
     entry — it is a writing page, not a naming one. */
  if(typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI){
    Object.keys(EXTRA).forEach(function(k){ SF_FAB_AI[k] = EXTRA[k]; });
    if(!SF_FAB_AI.canvas) SF_FAB_AI.canvas = EXTRA.mindmap;
    /* and nothing naming-shaped is left on the manuscript, whatever another
       layer may have put there */
    ['manuscript', 'write', 'chapters', 'scenes', 'episodes', 'acts', 'stanzas', 'verses']
      .forEach(function(k){ delete SF_FAB_AI[k]; });
    /* the prompt page's right-click panel carries one option — Prompt me.
       The bar's own button is only kept in the document for this to click,
       since the generator lives in the page's own closure. */
    ['inspire', 'idea'].forEach(function(k){
      SF_FAB_AI[k] = [{ fn:'ideaPromptMe', icon:'lightbulb-fill', label:'Prompt me',
                        desc:'A fresh prompt built from this project' }];
    });
  }

  /* What the page on screen offers. For the canvas this file owns the list, so
     the panel can never come up without it; every other page is read from the
     shared table. */
  const pageOptions = function(){
    const ids = (typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI) ? SF_FAB_AI : {};
    if(ids[S.page] && ids[S.page].length) return ids[S.page];
    if(S.page === 'canvas' || S.page === 'mindmap') return EXTRA.mindmap;
    return null;
  };

  const F = window.AI_FNS || (window.AI_FNS = {});

  /* Prompt me on the prompt page. The generator belongs to the page's own
     code, so this clicks its button — from anywhere in the app, landing on
     the prompt page first if needed. */
  F.ideaPromptMe = function(){
    const find = function(){
      return document.querySelector('#page-inspire [data-idea="prompt"], #page-inspire [data-ic-prompt]');
    };
    const b = find();
    if(b){ b.click(); return; }
    if(typeof goPage === 'function'){
      goPage('inspire');
      setTimeout(function(){ const n = find(); if(n) n.click(); }, 140);
      return;
    }
    if(typeof toast === 'function') toast('Open the Idea page to use this', 'warn');
  };

  F.mmGrow = function(){
    ask('Growing the canvas', 'Canvas',
      'You are a story architect helping a writer build a visual map of their story.\n\n' +
      sfProjectBrief() + '\n\n' + canvasBrief() + '\n\n' +
      'Task: propose the NEXT cards and links this map is missing.\n' +
      'Reply as plain lines only — "New card: <text>" or "Link: <card> → <card>" —\n' +
      'at most twelve lines, no preamble, using the cards above as the existing map.');
  };
  F.mmGaps = function(){
    ask('What is missing', 'Canvas',
      'You are a developmental editor looking at a writer\'s relationship map.\n\n' +
      sfProjectBrief() + '\n\n' + canvasBrief() + '\n\n' +
      'Task: name the holes — who or what is not on the map and should be,\n' +
      'what relationship is implied but never drawn. Under 200 words, plain lines.');
  };
  F.mmThreads = function(){
    ask('Connecting the threads', 'Canvas',
      'You are a story architect.\n\n' + sfProjectBrief() + '\n\n' + canvasBrief() + '\n\n' +
      'Task: list the links that SHOULD exist between these cards and why each matters.\n' +
      'Reply as plain lines — "<card> → <card>: why" — at most twelve, nothing else.');
  };

  /* put the thread of the story, the canvas and the prompt-page choices in
     front of every right-click AI use */
  if(typeof window.sfProjectBrief === 'function'){
    const origBrief = window.sfProjectBrief;
    window.sfProjectBrief = function(){
      let out = '';
      try{ out = String(origBrief.apply(this, arguments) || ''); }catch(e){ out = ''; }
      try{
        if(S.page === 'mindmap') out += '\n\n' + canvasBrief();
      }catch(e){}
      return out;
    };
  }

  /* the writing actions every page keeps — the same six the editor's own
     right-click menu carries, so the two menus never disagree */
  const TEXT_ACTIONS = [
    { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
    { fn:'improve',    icon:'stars',               label:'Improve' },
    { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' },
    { fn:'continue',   icon:'arrow-right-circle',  label:'Continue' },
    { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
    { fn:'summarize',  icon:'card-text',           label:'Summarize' }
  ];
  const textChips = function(){
    return TEXT_ACTIONS.map(function(a){
      return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
    }).join('');
  };

  /* The build this file is, written quietly onto the document element — it
     matches the polish.js version in index.html and is what the reload guard
     below compares. Nothing is drawn on screen for it. */
  const BUILD = 'v17';

  /* This app is a single page that never reloads itself, so a tab left open
     keeps running the code it was opened with — fixes included. When the build
     on the server is not the one this tab last ran, take the new one: once per
     tab, and only just after the page has settled, so nothing is mid-keystroke.
     The app autosaves on every edit, so a reload here cannot lose writing. */
  try{
    const KEY = 'sf_build_seen';
    const seen = localStorage.getItem(KEY);
    const took = sessionStorage.getItem('sf_build_taken');
    if(seen && seen !== BUILD && !took){
      localStorage.setItem(KEY, BUILD);
      sessionStorage.setItem('sf_build_taken', BUILD);
      setTimeout(function(){ location.reload(); }, 1200);
    } else if(seen !== BUILD){
      localStorage.setItem(KEY, BUILD);
    }
  }catch(e){}

  const stampBuild = function(){
    try{ document.documentElement.setAttribute('data-sf-build', BUILD); }catch(e){}
  };

  /* the menu itself: page options, then the writing actions, then Translate */
  window.renderFabAI = function(){
    stampBuild();
    const body = document.getElementById('fabAIBody');
    if(!body) return;
    const defs = (typeof SF_FAB_DEFAULT !== 'undefined' && SF_FAB_DEFAULT) ? SF_FAB_DEFAULT : TEXT_ACTIONS;
    const opts = pageOptions();

    /* Two panels are their options and nothing else:
         · the prompt page  — Prompt me alone, no headings at all
         · the outline page — the naming jobs, no subtitle under an option
                              and no writing or language actions
       Both draw the row without its description line. */
    const optionsOnly = (S.page === 'inspire' || S.page === 'idea' || S.page === 'outline');
    if(optionsOnly && opts && opts.length){
      body.innerHTML =
        (S.page === 'outline' || S.page === 'inspire' || S.page === 'idea'
          ? '<div class="fab-ai-sec">For this page</div>'
          : '')
        + opts.map(function(o){
            return '<button class="fab-ai-opt" data-fabai="' + o.fn + '" title="' + esc(o.desc) + '">'
              + '<span class="fa-ic"><i class="bi bi-' + o.icon + '"></i></span>'
              + '<span class="fa-txt"><b>' + esc(o.label) + '</b></span>'
              + '</button>';
          }).join('');
      return;
    }

    const line = function(o){
      return '<button class="fab-ai-opt" data-fabai="' + o.fn + '" title="' + esc(o.desc) + '">'
        + '<span class="fa-ic"><i class="bi bi-' + o.icon + '"></i></span>'
        + '<span class="fa-txt"><b>' + esc(o.label) + '</b><em>' + esc(o.desc) + '</em></span>'
        + '</button>';
    };

    body.innerHTML =
      (opts
        ? '<div class="fab-ai-sec">For this page</div>' + opts.map(line).join('')
          + (S.page === 'bible'
              ? '<div class="fab-ai-ask"><input class="ai-input" data-fabai-input placeholder="Ask about a character, place or event…">'
                + '<button class="ai-chip primary" data-fabai-ask><i class="bi bi-send"></i></button></div>'
              : '')
          + '<div class="fab-ai-sec">Text</div>' + textChips()
        : defs.map(function(a){
            return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
          }).join(''))
      + '<div class="fab-ai-sec">' + (opts ? 'Language' : 'Text') + '</div>'
      + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>';
  };

  /* The panel's own options are handled by the app's listener, which is
     registered earlier; this is the net under it, so a page option can never
     be a button that does nothing. */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const opt = t.closest('[data-fabai]');
    if(!opt || e.defaultPrevented) return;
    e.preventDefault();
    const fn = opt.dataset.fabai;
    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    if(window.AI_FNS && window.AI_FNS[fn]) window.AI_FNS[fn]();
    else if(typeof toast === 'function') toast('That action is not available', 'warn');
  }, true);

  /* ═══ 4 · THE PROMPT PAGE ═══ */
  const GENRES = ['Any genre','Literary','Thriller','Mystery','Crime','Romance','Fantasy',
                  'Science fiction','Horror','Historical','Western','Comedy','Adventure',
                  'Coming of age','Speculative'];
  const TAGS   = ['Any tag','Slow burn','Heist','Revenge','Family','Found family','Redemption',
                  'Survival','Political','Domestic','Supernatural','Road trip','Courtroom',
                  'War','School','Workplace','Enemies to lovers','Second chance',
                  'Secret identity','Underdog','Reluctant hero','Fish out of water',
                  'Locked room','Whodunit','Amnesia','Time loop','Dystopia','Cyberpunk',
                  'Antihero','Small town','Mentor and student','Rivalry','Coming home',
                  'Haunted house','Court intrigue','Deep space','Prison break'];
  const THEMES = ['Any theme','Love and loss','Power','Identity','Memory','Grief','Freedom',
                  'Betrayal','Hope','Justice','Obsession','Belonging','Time','Faith','Technology',
                  'Duty and desire','Truth and lies','Guilt','Forgiveness','Courage','Loneliness',
                  'Tradition and change','Fate and free will','Ambition','Sacrifice','Legacy',
                  'Exile','Mortality','Art and the artist','Science and ethics',
                  'Nature of evil','Class and money','War and peace','Beauty','Home',
                  'Coming of age','Sisterhood and brotherhood','Nature and progress'];

  function promptPage(){
    const root = document.getElementById('page-inspire');
    if(!root) return;
    const bar = root.querySelector('.idea-bar');
    if(!bar) return;

    /* the AI settings button — and the popover it opens — are off this page:
       the bar is Prompt me and the three pickers, nothing else */
    Array.prototype.forEach.call(root.querySelectorAll('.idea-ai-wrap'), function(el){ el.remove(); });

    if(bar.querySelector('[data-sf-picks]')) return;   /* already built */

    if(!S.config.ideaAI) S.config.ideaAI = {};
    const cfg = S.config.ideaAI;

    /* the three pickers sit in the bar itself: Themes then Tags on the left,
       Genres at the right end of the card's top bar */
    const box = document.createElement('div');
    box.className = 'idea-picks';
    box.setAttribute('data-sf-picks', '1');
    box.innerHTML =
      [['theme', 'Themes', THEMES, cfg.theme, ''],
       ['tag',   'Tags',   TAGS,   cfg.tag,   ''],
       ['genre', 'Genres', GENRES, cfg.genre, ' idea-pick-end']]
        .map(function(p){
          return '<label class="idea-pick' + p[4] + '">'
            + '<span>' + p[1] + '</span>'
            + '<select class="sel" data-sf-pick="' + p[0] + '">'
            + p[2].map(function(v){
                return '<option value="' + esc(v) + '"' + ((p[3] || p[2][0]) === v ? ' selected' : '') + '>' + esc(v) + '</option>';
              }).join('')
            + '</select></label>';
        }).join('');

    bar.appendChild(box);

    box.addEventListener('change', function(e){
      const sel = e.target.closest('[data-sf-pick]');
      if(!sel) return;
      S.config.ideaAI[sel.dataset.sfPick] = sel.value;
      if(typeof save === 'function') save();
      if(typeof toast === 'function') toast(sel.value.indexOf('Any') === 0 ? 'Cleared' : sel.value);
    }, true);

    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(box);
  }

  /* the choices ride along with the project brief the AI already gets */
  if(typeof window.sfProjectBrief === 'function'){
    const withCanvas = window.sfProjectBrief;
    window.sfProjectBrief = function(){
      let out = '';
      try{ out = String(withCanvas.apply(this, arguments) || ''); }catch(e){ out = ''; }
      try{
        const c = (S.config && S.config.ideaAI) || {};
        const picks = [];
        if(c.genre && c.genre.indexOf('Any') !== 0) picks.push('genre: ' + c.genre);
        if(c.tag   && c.tag.indexOf('Any')   !== 0) picks.push('tags: '  + c.tag);
        if(c.theme && c.theme.indexOf('Any') !== 0) picks.push('themes: '+ c.theme);
        if(picks.length) out += '\n\nCHOSEN ON THE PROMPT PAGE:\n' + picks.join('\n');
      }catch(e){}
      return out;
    };
  }

  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();
