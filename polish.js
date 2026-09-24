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

  /* ═══ KANBAN — a chapter card holds its subchapters

     The board used to draw one card per chapter AND one per subchapter, so
     a book of twelve chapters was forty loose cards and the structure was
     nowhere. Now a chapter is the card: its subchapters are listed inside
     it, each with its own count, and the card's subtitle reads
     “3 subchapters · 1,204 words”. Both are read from the project on every
     pass, so they follow whatever the chapter actually holds.

     Every write is compared with what is already on screen first, so the
     mutation sweep that triggers this can never loop. ─── */
  const kbFeet = function(){
    const board = document.getElementById('kbBoard');
    if(!board) return;
    const d = (typeof D === 'function') ? D() : null;
    if(!d || !Array.isArray(d.chapters)) return;
    if(typeof olWords !== 'function') return;

    const info = {}, childOf = {};
    d.chapters.forEach(function(c, i){
      const kids = c.children || [];
      info[c.id] = {
        title: c.title || ('Chapter ' + (i + 1)),
        words: olWords(c.content),
        kids:  kids.map(function(x, j){
          childOf[x.id] = true;
          return { id:x.id, title: x.title || ('Subchapter ' + (j + 1)), words: olWords(x.content) };
        })
      };
    });

    /* a subchapter is not a card of its own any more */
    Array.prototype.forEach.call(board.querySelectorAll('.kb-card'), function(card){
      if(childOf[card.dataset.kbCard]) card.remove();
    });

    Array.prototype.forEach.call(board.querySelectorAll('.kb-card'), function(card){
      const i = info[card.dataset.kbCard];
      if(!i) return;

      /* the subchapters, listed under the chapter's own title */
      const sig = i.kids.map(function(k){ return k.id + '|' + k.title + '|' + k.words; }).join('\u0001');
      let box = card.querySelector('.kb-subs');
      if(!box){
        box = document.createElement('div');
        box.className = 'kb-subs';
        const title = card.querySelector('.kb-card-title');
        if(title && title.parentNode === card) title.after(box);
        else card.insertBefore(box, card.firstChild);
      }
      if(box.dataset.sig !== sig){
        box.dataset.sig = sig;
        box.innerHTML = i.kids.length
          ? i.kids.map(function(k){
              return '<div class="kb-sub" data-kb-sub="' + esc(k.id) + '">'
                + '<span class="kb-sub-name">' + esc(k.title) + '</span>'
                + '<span class="kb-sub-words">' + k.words.toLocaleString() + 'w</span>'
                + '</div>';
            }).join('')
          : '';
        box.hidden = !i.kids.length;
      }

      /* the subtitle: how many subchapters, and how many words in all */
      const span = card.querySelector('.kb-card-foot span');
      if(span){
        const n = i.kids.length;
        const text = (n ? n + (n === 1 ? ' subchapter' : ' subchapters') + ' · ' : '')
                   + i.words.toLocaleString() + ' words';
        if(span.textContent !== text) span.textContent = text;
      }
    });
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
    kbFeet();
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

  /* The chapter strip's hairlines are placed by chapter-align.js alone.
     There used to be a second aligner here (a --sf-sep-x margin written on
     the first hairline) and the two fought over the same element: one moved
     it with a margin, the other with a transform, and because each measured
     the other's result the line flipped between two spots on every repaint
     — which read as a doubled divider beside the note icon. One owner now. */

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
    /* the Draft page's own menu. It is a writing page, so its actions are
       about the draft, not the writing-helpers: those belong to the
       manuscript and the screenplay (see keepsTextMenu below). */
    draft: [
      { fn:'fabDraftChat', icon:'chat-left-text', label:'Open the AI chat',
        desc:'The draft chat for this project' }
    ],
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
  /* Settings → Custom → Right-click menu decides which are offered at all */
  const rcOn = function(k){ return (typeof window.sfRcOn === 'function') ? window.sfRcOn(k) : true; };
  const liveActions = function(){
    return TEXT_ACTIONS.filter(function(a){ return rcOn(a.fn); });
  };
  const rcFlag = function(k){
    if(typeof window.sfRightClick !== 'function') return true;
    return window.sfRightClick()[k] !== false;
  };
  /* Only the manuscript — and the screenplay, whose writing view is that
     same page — keep the writing actions and Translate in this menu. Every
     other page's panel is its own options and nothing else. */
  const keepsTextMenu = function(){
    try{
      if(S.mode === 'screenplay') return true;
      if(['manuscript', 'script', 'screenplay', 'write'].indexOf(S.page) >= 0) return true;
    }catch(e){}
    return false;
  };
  /* the Draft page's one option, wired to the chat's own open() */
  F.fabDraftChat = function(){
    if(window.DraftChat && typeof window.DraftChat.open === 'function'){ window.DraftChat.open(); return; }
    if(typeof toast === 'function') toast('Open the Draft page to use the chat', 'warn');
  };
  const textChips = function(list){
    return (list || liveActions()).map(function(a){
      return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
    }).join('');
  };

  /* The build this file is, written quietly onto the document element — it
     matches the polish.js version in index.html and is what the reload guard
     below compares. Nothing is drawn on screen for it. */
  const BUILD = 'v24';

  /* The build this tab last ran is remembered, but the app no longer reloads
     itself onto a new one: that came up as the app loading twice on boot.
     A fresh load already asks for the new files — every script and stylesheet
     carries its own version in index.html — so this is a note, not a trigger. */
  try{
    const KEY = 'sf_build_seen';
    if(localStorage.getItem(KEY) !== BUILD) localStorage.setItem(KEY, BUILD);
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
    /* the page's own options, and the writing actions, as Settings →
       AI Assistance → Right-click menu leaves them */
    const opts = rcFlag('pageOptions') ? pageOptions() : null;
    const keepsMenu = keepsTextMenu();
    const acts = keepsMenu ? liveActions() : [];

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

    /* a page option is its label and its icon only — the description is a
       tooltip, never a subtitle under the row */
    const line = function(o){
      return '<button class="fab-ai-opt" data-fabai="' + o.fn + '" title="' + esc(o.desc) + '">'
        + '<span class="fa-ic"><i class="bi bi-' + o.icon + '"></i></span>'
        + '<span class="fa-txt"><b>' + esc(o.label) + '</b></span>'
        + '</button>';
    };

    body.innerHTML =
      (opts
        ? '<div class="fab-ai-sec">For this page</div>' + opts.map(line).join('')
          + (S.page === 'bible'
              ? '<div class="fab-ai-ask"><input class="ai-input" data-fabai-input placeholder="Ask about a character, place or event…">'
                + '<button class="ai-chip primary" data-fabai-ask><i class="bi bi-send"></i></button></div>'
              : '')
          + (acts.length ? '<div class="fab-ai-sec">Text</div>' + textChips(acts) : '')
        : (keepsMenu && acts.length
            ? '<div class="fab-ai-sec">Text</div>' + textChips(acts)
            : defs.filter(function(a){ return rcOn(a.fn); }).map(function(a){
                return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
              }).join('')))
      + ((keepsMenu && rcFlag('translate'))
          ? '<div class="fab-ai-sec">' + (opts || acts.length ? 'Language' : 'Text') + '</div>'
            + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>'
          : '');

    /* a page with no options of its own and no writing menu still gets a
       usable panel rather than a blank one */
    if(!body.innerHTML){
      body.innerHTML = defs.filter(function(a){ return rcOn(a.fn); }).map(function(a){
        return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
      }).join('');
    }
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
  const GENRES = ['None','Literary','Thriller','Mystery','Crime','Romance','Fantasy',
                  'Science fiction','Horror','Historical','Western','Comedy','Adventure',
                  'Coming of age','Speculative',
                  'Dystopian','Cyberpunk','Paranormal','Urban fantasy','Magical realism',
                  'Suspense','Noir','Satire','Fairy tale','Mythic','Steampunk','Space opera',
                  'Cozy mystery','Legal thriller','Political thriller','Psychological',
                  'Slice of life','Family saga','Young adult','New adult'];
  const TAGS   = ['None','Slow burn','Heist','Revenge','Family','Found family','Redemption',
                  'Survival','Political','Domestic','Supernatural','Road trip','Courtroom',
                  'War','School','Workplace','Enemies to lovers','Second chance',
                  'Secret identity','Underdog','Reluctant hero','Fish out of water',
                  'Locked room','Whodunit','Amnesia','Time loop','Dystopia','Cyberpunk',
                  'Antihero','Small town','Mentor and student','Rivalry','Coming home',
                  'Haunted house','Court intrigue','Deep space','Prison break'];
  const THEMES = ['None','Love and loss','Power','Identity','Memory','Grief','Freedom',
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
      if(typeof toast === 'function') toast(sel.value === 'None' ? 'Cleared' : sel.value);
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
        if(c.genre && c.genre !== 'None') picks.push('genre: ' + c.genre);
        if(c.tag   && c.tag   !== 'None') picks.push('tags: '  + c.tag);
        if(c.theme && c.theme !== 'None') picks.push('themes: '+ c.theme);
        if(picks.length) out += '\n\nCHOSEN ON THE PROMPT PAGE:\n' + picks.join('\n');
      }catch(e){}
      return out;
    };
  }

  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();
