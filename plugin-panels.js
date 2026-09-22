/* ═══════════════════════════════════════════════════════════
   ScriptForge — plugin panels

   ONE floating window per plugin — Wikipedia has its own, DuckDuckGo
   has its own, Books has its own. Nothing is shared and no chip row
   switches between them, so a panel is always the tool you asked for.

   Every panel:
     · is dragged by its header (grab hand)
     · resizes from the bottom-right grip
     · remembers where you left it, per plugin
     · has a ← back button (straight to Settings → Plugins) and a
       bi-x-lg close
     · opens every result link INSIDE itself — no browser tabs, ever
       (an in-panel reader with its own ← back)

   Loaded after plugins.js; takes over PLUGINS.openWebSearch and
   PLUGINS.openImageSearch so every existing entry point lands here.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PLUGINS === 'undefined') return;

  /* source → its own panel's name, icon and hint */
  const SOURCES = {
    ddg:    { name:'Web search',          icon:'search',      hint:'Search the web…' },
    wiki:   { name:'Wikipedia',           icon:'book',        hint:'Article or topic…' },
    dict:   { name:'Dictionary',          icon:'file-text',   hint:'Word to define…' },
    thes:   { name:'Thesaurus & rhymes',  icon:'shuffle',     hint:'Word to find…' },
    idiom:  { name:'Idioms',              icon:'chat-quote',  hint:'Phrase to explain…' },
    quote:  { name:'Quotes',              icon:'quote',       hint:'Subject to quote…' },
    images: { name:'Image search',        icon:'image',       hint:'Pictures of…' },
    books:  { name:'Public-domain books', icon:'book-half',   hint:'Title, author or subject…' },
    wolf:   { name:'Wolfram',             icon:'calculator',  hint:'Maths or units…' }
  };
  const RENDER = {
    ddg:'renderDDG', wiki:'renderWiki', dict:'renderDict', thes:'renderThes',
    wolf:'renderWolfram', idiom:'renderIdioms', quote:'renderQuotes',
    images:'renderImagesInline', books:'renderBooks'
  };

  /* where to send the writer when the panel cannot show the whole thing */
  const SOURCE_URL = {
    ddg:    function(q){ return 'https://duckduckgo.com/?q=' + encodeURIComponent(q); },
    wiki:   function(q){ return 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(q); },
    dict:   function(q){ return 'https://en.wiktionary.org/wiki/' + encodeURIComponent(q); },
    thes:   function(q){ return 'https://www.thesaurus.com/browse/' + encodeURIComponent(q); },
    idiom:  function(q){ return 'https://duckduckgo.com/?q=' + encodeURIComponent(q + ' idiom meaning'); },
    quote:  function(q){ return 'https://duckduckgo.com/?q=' + encodeURIComponent(q + ' quote'); },
    images: function(q){ return 'https://commons.wikimedia.org/w/index.php?search=' + encodeURIComponent(q); },
    books:  function(q){ return 'https://www.gutenberg.org/ebooks/search/?query=' + encodeURIComponent(q); },
    wolf:   function(q){ return 'https://www.wolframalpha.com/input?i=' + encodeURIComponent(q); }
  };
  const SOURCE_NAME = {
    ddg:'DuckDuckGo', wiki:'Wikipedia', dict:'Wiktionary', thes:'Thesaurus.com',
    idiom:'the web', quote:'the web', images:'Wikimedia Commons', books:'Project Gutenberg',
    wolf:'Wolfram Alpha'
  };

  /* the last page a panel opened, so the reader can come back */
  const opened = {};

  const spinner = '<div class="sf-pp-spin"><i class="bi bi-arrow-repeat"></i> Working…</div>';

  const selected = function(){
    try{
      const sel = window.getSelection();
      const txt = sel ? String(sel).trim() : '';
      return txt.split(/\s+/)[0] || '';
    }catch(e){ return ''; }
  };

  /* ── where each panel was left, remembered per plugin ── */
  const geom = function(src){
    if(!S.config.pluginPanels || typeof S.config.pluginPanels !== 'object') S.config.pluginPanels = {};
    if(!S.config.pluginPanels[src]) S.config.pluginPanels[src] = {};
    return S.config.pluginPanels[src];
  };
  const place = function(p, src){
    const g = geom(src);
    if(g.x != null){
      p.style.right = 'auto'; p.style.bottom = 'auto';
      p.style.left = Math.round(g.x) + 'px';
      p.style.top  = Math.round(g.y) + 'px';
    }
    if(g.w) p.style.width  = Math.round(g.w) + 'px';
    if(g.h) p.style.height = Math.round(g.h) + 'px';
  };
  const remember = function(p, src){
    const g = geom(src);
    const r = p.getBoundingClientRect();
    g.x = r.left; g.y = r.top; g.w = r.width; g.h = r.height;
    if(typeof save === 'function') save();
  };

  /* ── back to Settings → Plugins ── */
  const toSettings = function(){
    if(window.SETTINGS && typeof SETTINGS.openTab === 'function') SETTINGS.openTab('plugins');
    else if(window.SETTINGS && typeof SETTINGS.open === 'function'){
      SETTINGS.open();
      if(typeof renderSetTab === 'function') renderSetTab('plugins');
    }
  };

  /* ── the in-panel reader: the whole page, read right here ──
     Nothing is ever opened in a browser — the reader is inside the
     panel, with its own ← back to the results. */
  const reader = function(p, label, inner){
    const body = p.querySelector('.sfpp-body');
    if(!body) return null;
    body.classList.add('sfpp-reading');
    body.innerHTML =
      '<div class="sfpp-here">'
      +   '<button class="sfpp-mini" data-sfpp-back="1" title="Back to the results"><i class="bi bi-arrow-left"></i> Back</button>'
      +   '<span class="sfpp-here-url">' + esc(label) + '</span>'
      + '</div>' + inner;
    body.querySelector('[data-sfpp-back]').addEventListener('click', function(){ run(p); });
    return body;
  };

  const showPage = function(p, url, label){
    opened[p.dataset.src] = url;
    reader(p, label || url,
      '<iframe class="sfpp-frame" src="' + esc(url) + '" referrerpolicy="no-referrer" sandbox="allow-same-origin allow-scripts allow-popups"></iframe>');
  };

  /* write the full text into the reader the panel is already showing */
  const fillText = function(p, title, text){
    const body = p.querySelector('.sfpp-body');
    if(!body) return;
    body.innerHTML =
      '<div class="sfpp-here">'
      +   '<button class="sfpp-mini" data-sfpp-back="1" title="Back to the results"><i class="bi bi-arrow-left"></i> Back</button>'
      +   '<span class="sfpp-here-url">' + esc(title) + '</span>'
      + '</div>'
      + '<div class="sfpp-text">' + text.split(/\n{2,}/).map(function(par){
          return '<p>' + esc(par.replace(/\n/g, ' ').trim()) + '</p>';
        }).join('') + '</div>';
    body.querySelector('[data-sfpp-back]').addEventListener('click', function(){ run(p); });
  };

  /* the full text of a page, read here in the panel. Site APIs are asked
     first; anything that only speaks HTML comes back as readable text
     through a text reader. A browser tab is never opened. */
  const readFull = function(p, src, q){
    opened[src] = '';
    const label = (SOURCE_NAME[src] || 'The web') + ' · ' + q;

    /* 1 · the site's own text API */
    if(src === 'wiki' || src === 'dict'){
      const host = src === 'dict' ? 'en.wiktionary.org' : 'en.wikipedia.org';
      const url = 'https://' + host + '/w/api.php?action=query&format=json&origin=*'
        + '&prop=extracts&explaintext=1&redirects=1&titles=' + encodeURIComponent(q);
      reader(p, label, spinner);
      return fetch(url).then(function(r){ return r.json(); }).then(function(j){
        const pages = (j && j.query && j.query.pages) || {};
        const first = pages[Object.keys(pages)[0]];
        if(!first || !first.extract) throw new Error('Nothing came back for that page');
        opened[src] = 'https://' + host + '/wiki/' + encodeURIComponent(first.title || q);
        fillText(p, first.title || q, first.extract);
      }).catch(function(){
        /* the page itself, still inside the panel */
        showPage(p, 'https://' + host + '/wiki/' + encodeURIComponent(q), label);
      });
    }

    /* 2 · pages that refuse to be framed (the DuckDuckGo family) — read
       the readable text of the page the panel is about instead */
    if(src === 'ddg' || src === 'thes' || src === 'idiom' || src === 'quote'){
      const hit = p.querySelector('.sfpp-body a[href^="http"]');
      const direct = SOURCE_URL[src] ? SOURCE_URL[src](q) : '';
      const target = (src === 'ddg' && hit && hit.getAttribute('href')) || direct;
      if(!target){ toast('Nothing more to show here', 'warn'); return; }
      reader(p, label, spinner);
      return fetch('https://r.jina.ai/' + target)
        .then(function(r){ if(!r.ok) throw new Error('no text'); return r.text(); })
        .then(function(txt){
          txt = String(txt || '').replace(/^Title:.*$/m, '').replace(/^URL Source:.*$/m, '').trim();
          if(!txt) throw new Error('no text');
          fillText(p, target.replace(/^https?:\/\//, ''), txt);
        })
        .catch(function(){
          /* last resort: the page framed in here */
          showPage(p, target, label);
          toast('That page could not be read here — showing what it will share', 'warn');
        });
    }

    /* 3 · everything else frames happily inside the panel */
    const url = SOURCE_URL[src] ? SOURCE_URL[src](q) : '';
    if(!url){ toast('Nothing more to show here', 'warn'); return; }
    showPage(p, url, label);
  };

  /* open every link in the panel, not in a tab */
  const wireLinks = function(p){
    const body = p.querySelector('.sfpp-body');
    body.querySelectorAll('a[href]').forEach(function(a){
      a.setAttribute('target', '_self');
      a.addEventListener('click', function(e){
        e.preventDefault();
        const href = a.getAttribute('href');
        if(!href || href.charAt(0) === '#') return;
        showPage(p, href, a.textContent.trim() || href);
      });
    });
  };

  const paintHead = function(p, src){
    const s = SOURCES[src];
    p.querySelector('#sfppIcon').className = 'bi bi-' + s.icon;
    p.querySelector('#sfppName').textContent = s.name;
    const input = p.querySelector('#sfppQuery');
    if(input) input.placeholder = s.hint;
  };

  const run = async function(p){
    const src = p.dataset.src;
    const box = p.querySelector('.sfpp-body');
    box.classList.remove('sfpp-reading');
    const input = p.querySelector('#sfppQuery');
    const q = (input && input.value || '').trim();
    if(!q){ box.innerHTML = '<div class="sf-pp-note">Type something to look up.</div>'; return; }

    box.innerHTML = spinner;
    const fn = RENDER[src] || 'renderDDG';
    try{
      if(typeof PLUGINS[fn] !== 'function') throw new Error('That tool is not available');
      await PLUGINS[fn](q, box);
      if(!box.textContent.trim()) box.innerHTML = '<div class="sf-pp-note">Nothing came back.</div>';
      wireLinks(p);

      /* the panel shows the gist — the whole page reads right here */
      const out = document.createElement('button');
      out.type = 'button';
      out.className = 'sfpp-out';
      out.innerHTML = '<i class="bi bi-book"></i> Read the full page here';
      out.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        readFull(p, src, q);
      });
      const foot = document.createElement('div');
      foot.className = 'sfpp-full';
      foot.appendChild(out);
      box.appendChild(foot);
    }catch(err){
      box.innerHTML = '<div class="sf-pp-err"><i class="bi bi-exclamation-triangle"></i> '
        + esc((err && err.message) || 'That lookup failed') + '</div>';
    }
  };

  const build = function(src){
    const s = SOURCES[src];
    const p = document.createElement('div');
    p.className = 'sf-plugin';
    p.dataset.src = src;
    p.innerHTML =
      '<div class="sfpp-head">'
      +   '<button class="sfpp-mini" data-sfpp-backto title="Back to Settings → Plugins"><i class="bi bi-arrow-left"></i></button>'
      +   '<i class="bi bi-' + s.icon + '" id="sfppIcon"></i>'
      +   '<span id="sfppName">' + esc(s.name) + '</span>'
      +   '<button class="sfpp-x" data-sfpp-close title="Close"><i class="bi bi-x-lg"></i></button>'
      + '</div>'
      + '<div class="sfpp-bar">'
      +   '<input class="sfpp-input" id="sfppQuery" placeholder="' + esc(s.hint) + '" autocomplete="off">'
      +   '<button class="sfpp-go" data-sfpp-go title="Look it up"><i class="bi bi-arrow-right"></i></button>'
      + '</div>'
      + '<div class="sfpp-body"></div>'
      + '<span class="sfpp-grip" data-sfpp-grip title="Drag to resize"><i class="bi bi-textarea-resize"></i></span>';
    document.body.appendChild(p);
    place(p, src);

    p.querySelector('#sfppQuery').addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); run(p); }
    });
    p.querySelector('[data-sfpp-go]').addEventListener('click', function(e){ e.preventDefault(); run(p); });
    p.querySelector('[data-sfpp-close]').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); close(src); });
    p.querySelector('[data-sfpp-backto]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      close(src);
      toSettings();
    });

    /* ── drag by the header ── */
    const head = p.querySelector('.sfpp-head');
    head.addEventListener('pointerdown', function(e){
      if(e.target.closest('button')) return;
      e.preventDefault();
      const r = p.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      p.style.right = 'auto'; p.style.bottom = 'auto';
      p.style.left = Math.round(r.left) + 'px';
      p.style.top  = Math.round(r.top) + 'px';
      head.classList.add('dragging');
      const move = function(ev){
        p.style.left = Math.max(0, Math.min(ev.clientX - dx, (window.innerWidth || 1200) - p.offsetWidth - 4)) + 'px';
        p.style.top  = Math.max(0, Math.min(ev.clientY - dy, (window.innerHeight || 800) - 40)) + 'px';
      };
      const up = function(){
        head.classList.remove('dragging');
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
        remember(p, src);
      };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
    });

    /* ── resize from the bottom-right grip ── */
    const grip = p.querySelector('[data-sfpp-grip]');
    grip.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation();
      const r = p.getBoundingClientRect();
      p.style.right = 'auto'; p.style.bottom = 'auto';
      p.style.left = Math.round(r.left) + 'px';
      p.style.top  = Math.round(r.top) + 'px';
      const sx = e.clientX, sy = e.clientY, w0 = r.width, h0 = r.height;
      const move = function(ev){
        p.style.width  = Math.max(300, Math.round(w0 + ev.clientX - sx)) + 'px';
        p.style.height = Math.max(220, Math.round(h0 + ev.clientY - sy)) + 'px';
      };
      const up = function(){
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
        remember(p, src);
      };
      document.addEventListener('pointermove', move, true);
      document.addEventListener('pointerup', up, true);
    });

    return p;
  };

  const panels = {};
  const panelOf = function(src){
    if(!panels[src] || !document.body.contains(panels[src])) panels[src] = build(src);
    return panels[src];
  };

  /* ── open / close, by plugin ── */
  const open = function(src, query){
    if(!SOURCES[src]) src = 'ddg';
    const p = panelOf(src);
    paintHead(p, src);
    p.classList.add('open');

    const input = p.querySelector('#sfppQuery');
    const q = String(query || '').trim() || selected();
    if(input){
      if(q) input.value = q;
      if(!q.trim()) setTimeout(function(){ try{ input.focus(); }catch(e){} }, 30);
    }
    const box = p.querySelector('.sfpp-body');
    if(q) run(p);
    else if(box && !box.textContent.trim()){
      box.classList.remove('sfpp-reading');
      box.innerHTML = '<div class="sf-pp-note">Type a word and press Enter.</div>';
    }

    /* the FAB cards step aside */
    const ai = document.getElementById('fabAI');   if(ai) ai.hidden = true;
    const mn = document.getElementById('fabMenu'); if(mn) mn.hidden = true;
    const fw = document.getElementById('fabWrap'); if(fw) fw.classList.remove('menu-open');
    return true;
  };
  const close = function(src){
    const p = panels[src];
    if(p) p.classList.remove('open');
  };
  const closeAll = function(){
    Object.keys(panels).forEach(function(k){ close(k); });
  };

  window.SF_PLUGINS = {
    open: open, close: close, closeAll: closeAll, sources: SOURCES,
    has: function(src){ return !!SOURCES[src]; }
  };

  /* every existing entry point now opens that plugin's own panel */
  if(typeof PLUGINS.openWebSearch === 'function'){
    PLUGINS.openWebSearchModal = PLUGINS.openWebSearch;
    PLUGINS.openWebSearch = function(src){ open(SOURCES[src] ? src : 'ddg'); return true; };
  }
  if(typeof PLUGINS.openImageSearch === 'function'){
    PLUGINS.openImageSearchModal = PLUGINS.openImageSearch;
    PLUGINS.openImageSearch = function(query){ open('images', query); return true; };
  }

  /* click outside closes that panel (never while Settings is up) */
  document.addEventListener('click', function(e){
    const p = e.target.closest && e.target.closest('.sf-plugin');
    if(p) return;
    if(e.target.closest && e.target.closest('.modal-scrim')) return;
    closeAll();
  }, true);
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(document.querySelector('.modal-scrim')) return;
    const cb = document.getElementById('cmdBox');
    if(cb && !cb.hidden) return;
    closeAll();
  }, true);
})();
