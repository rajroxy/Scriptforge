/* ═══════════════════════════════════════════════════════════
   welcome.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · welcome.js
     · stats-fix.js
     · keys-fix.js
     · autocomplete.js
     · workspaces.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ welcome.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Welcome — the name the app greets you by

   A download link can carry the name the reader signed in with:

       https://your-site.example/?name=Riya

   The first time the app opens from that link the name is
   remembered, so every “Welcome back” afterwards says whose app
   this is. Nothing else about the link matters.

   Where the name comes from, in order:

     · the link     ?name= · ?user= · ?u= · ?author=
     · the writer   Settings → the name the books are signed with
     · GitHub       the account the app is signed into

   The Import page gets one button that hands out such a link.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const cfg = function(){
    return (typeof S !== 'undefined' && S.config) ? S.config : null;
  };
  const clean = function(s){
    return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 40);
  };
  const keep = function(){ if(typeof save === 'function'){ try{ save(); }catch(e){} } };

  /* the name the link was built with */
  const fromLink = function(){
    try{
      const q = new URLSearchParams(location.search);
      return clean(q.get('name') || q.get('user') || q.get('u') || q.get('author') || '');
    }catch(e){ return ''; }
  };

  /* the GitHub account this app is signed into, if any */
  const fromGitHub = function(){
    try{
      const raw = localStorage.getItem('sf_github_user');
      if(raw){
        const u = JSON.parse(raw);
        const n = clean(u && (u.name || u.login));
        if(n) return n;
      }
    }catch(e){}
    try{
      if(window.GitHub && window.GitHub.user){
        return clean(GitHub.user.name || GitHub.user.login);
      }
    }catch(e){}
    return '';
  };

  /* ── remember the name the link carried ── */
  const remember = function(){
    const c = cfg();
    if(!c) return;

    const link = fromLink();
    if(link){
      if(c.userName !== link){
        c.userName = link;
        if(!clean(c.authorName)) c.authorName = link;   /* books get signed too */
        keep();
      }
      /* the link has done its job — keep it out of the address bar */
      try{
        const u = new URL(location.href);
        ['name', 'user', 'u', 'author'].forEach(function(k){ u.searchParams.delete(k); });
        history.replaceState(null, '', u.pathname + (u.search || '') + (u.hash || ''));
      }catch(e){}
      return;
    }

    const gh = fromGitHub();
    if(gh && c.userName !== gh){ c.userName = gh; keep(); }
  };

  const userName = function(){
    const c = cfg() || {};
    return clean(c.userName) || fromGitHub() || clean(c.authorName) || '';
  };
  window.sfUserName = userName;

  /* ── the greeting: “Welcome back, Riya” ── */
  const paint = function(){
    const page = document.getElementById('page-home');
    if(!page) return;
    const head = page.querySelector('h1');
    if(!head) return;
    const name = userName();

    /* TWO LINES: “Welcome back”, and the name UNDER it — never the two run
       together as one sentence. The name keeps the display face and a step
       more of the page's own colour, so the dashboard reads as the writer's
       own desk rather than a generic app. */
    if(String(head.textContent || '').trim() !== 'Welcome back') head.textContent = 'Welcome back';
    head.removeAttribute('title');

    let line = page.querySelector('#sfWelcomeName');
    if(!line){
      line = document.createElement('div');
      line.id = 'sfWelcomeName';
      line.className = 'sf-welcome-name';
      (head.parentElement || page).appendChild(line);
    }
    const want = name || '';
    if(String(line.textContent || '') !== want) line.textContent = want;
    line.hidden = !name;
    if(name) line.setAttribute('title', 'Signed in as ' + name);
  };
  /* Settings → General edits the name; the greeting follows at once */
  window.sfWelcomeRefresh = function(){ try{ paint(); }catch(e){} };

  /* ── the first run: the name, asked for once ──────────────────
     A download link can carry a name, and so can GitHub or an export — but
     a writer who simply opened the app has nothing to be greeted by. One
     small panel asks for it, once, before the dashboard is read. */
  const GATE_KEY = 'sf6_name_asked';
  const askedAlready = function(){ try{ return localStorage.getItem(GATE_KEY) === '1'; }catch(e){ return false; } };
  const markAsked = function(){ try{ localStorage.setItem(GATE_KEY, '1'); }catch(e){} };

  const gate = function(){
    /* RETIRED — nothing asks the writer for a name any more: the dashboard no
       longer greets by it and Settings no longer carries a row for it. A name
       still arrives from a ?name= link, from GitHub or from an export, and it
       still signs one. Delete this line to bring the one-time prompt back. */
    return;
    if(userName() || askedAlready() || window.sfNameGateOpen) return;
    /* once the app has painted a page at all — whatever page it opened on,
       so the name is asked for on the way in, not when the dashboard is
       finally visited */
    if(!document.querySelector('.page.active')) return;
    window.sfNameGateOpen = true;

    const box = document.createElement('div');
    box.className = 'sf-namegate';
    box.innerHTML =
        '<div class="sf-namegate-card">'
      + '<div class="sf-namegate-ic"><i class="bi bi-pen-fill"></i></div>'
      + '<h2>What should the app call you?</h2>'
      + '<p>The dashboard greets you by this name and your exports are signed with it. '
      +   'You can change it whenever you like.</p>'
      + '<div class="sf-namegate-row">'
      +   '<input type="text" id="sfNameGateInput" maxlength="40" placeholder="Your name" autocomplete="off" spellcheck="false">'
      +   '<button type="button" class="btn btn-primary" id="sfNameGateGo">Enter</button>'
      + '</div>'
      + '<button type="button" class="sf-namegate-skip" id="sfNameGateSkip">Skip for now</button>'
      + '</div>';
    document.body.appendChild(box);

    const input = box.querySelector('#sfNameGateInput');
    if(input) setTimeout(function(){ try{ input.focus(); }catch(e){} }, 80);

    const done = function(raw){
      const typed = clean(raw);
      const c = cfg();
      if(typed && c){
        c.userName = typed;
        if(!clean(c.authorName)) c.authorName = typed;
        keep();
      }
      markAsked();
      window.sfNameGateOpen = false;
      box.remove();
      try{ paint(); }catch(e){}
      if(typed && typeof toast === 'function') toast('Welcome, ' + typed);
    };

    const go = box.querySelector('#sfNameGateGo');
    const skip = box.querySelector('#sfNameGateSkip');
    if(go) go.addEventListener('click', function(){ done(input ? input.value : ''); });
    if(skip) skip.addEventListener('click', function(){ done(''); });
    if(input) input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); done(input.value); }
      else if(e.key === 'Escape'){ e.preventDefault(); done(''); }
    });
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      try{ paint(); }catch(e){}
      try{ gate(); }catch(e){}
    });
  };

  /* ── a link that carries the name ── */
  const freshName = function(){
    let typed = '';
    /* the desktop build has no prompt(), so ask only where one exists */
    try{
      if(typeof prompt === 'function') typed = clean(prompt('The name the app should greet them by', userName()));
    }catch(e){ typed = ''; }
    if(!typed){
      if(typeof toast === 'function') toast('A name is needed before the link can carry one', 'warn');
      return '';
    }
    const c = cfg();
    if(c){
      c.userName = typed;
      if(!clean(c.authorName)) c.authorName = typed;
      keep();
    }
    schedule();
    return typed;
  };

  const downloadLink = function(){
    const name = userName() || freshName();
    if(!name) return '';
    try{
      const u = new URL(location.href);
      u.search = '';
      u.hash = '';
      u.searchParams.set('name', name);
      return u.href;
    }catch(e){
      return location.origin + location.pathname + '?name=' + encodeURIComponent(name);
    }
  };

  const copy = function(text){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text);
        return true;
      }
    }catch(e){}
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    }catch(e){ return false; }
  };

  /* ── the Import page's card ── */
  const card = function(root){
    if(!root || !root.querySelector || root.querySelector('[data-sf-welcome-card]')) return;
    const host = root.querySelector('.set-card');
    if(!host) return;
    const box = document.createElement('div');
    box.className = 'set-card';
    box.setAttribute('data-sf-welcome-card', '1');
    box.innerHTML =
      '<div class="set-card-title"><i class="bi bi-send"></i> A link that knows your name</div>'
      + '<div class="tiny muted" style="margin:-2px 0 8px">'
      +   'Hand this app out with your name already in the link — the reader downloads, opens it, '
      +   'and the app greets them by the name they signed in with instead of a blank “Welcome back”.'
      + '</div>'
      + '<div class="chips"><button class="chip" data-sf-welcome-link><i class="bi bi-link-45deg"></i> Copy my download link</button></div>';
    host.parentElement.insertBefore(box, host.nextSibling);
  };

  if(typeof PAGE_RENDERERS !== 'undefined' && typeof PAGE_RENDERERS.import === 'function'){
    const orig = PAGE_RENDERERS.import;
    PAGE_RENDERERS.import = function(root){
      const r = orig.apply(this, arguments);
      try{ card(root); }catch(e){}
      return r;
    };
  }

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-sf-welcome-link]')) return;
    e.preventDefault();
    const link = downloadLink();
    if(!link) return;
    if(copy(link) && typeof toast === 'function') toast('Link copied — it greets them by name');
    else if(typeof toast === 'function') toast('Could not copy the link', 'warn');
  }, true);

  /* ── start ── */
  const start = function(){
    try{ remember(); }catch(e){}
    schedule();

    /* every page change: the greeting follows the dashboard */
    if(typeof window.goPage === 'function' && !window.goPage.__welcomeWrapped){
      const orig = window.goPage;
      const wrapped = function(){
        const out = orig.apply(this, arguments);
        schedule();
        return out;
      };
      wrapped.__welcomeWrapped = true;
      window.goPage = wrapped;
    }

    /* the GitHub name arrives after a sign-in — pick it up when it does */
    setInterval(function(){
      try{
        const c = cfg();
        const gh = fromGitHub();
        if(c && gh && clean(c.userName) !== gh){ c.userName = gh; keep(); schedule(); }
      }catch(e){}
    }, 4000);

    if(typeof MutationObserver === 'function' && document.body){
      new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();


/* ══════════ stats-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — "Failed to render stats.", fixed
   and the Statistics categories: Fiction only

   THE BUG
   pages.js declares two helpers inside the Statistics page's own renderer:

       const catName  = function(id){ … }      ← line ~2861, inside stats
       const catItems = function(modeId){ … }

   and then, further down the same file, a FUNCTION-SCOPE function draws
   the stats body:

       function renderStatsBody(){ … catName(activeCatId) … }

   renderStatsBody is not nested in the renderer, so its scope chain is the
   file's, where catName does not exist. The first time a category is picked
   in the Statistics dropdown (Novel → Fiction), that call throws
   “catName is not defined”, and because the page renderer calls
   renderStatsBody() while drawing, the whole page is replaced by

       Failed to render stats.

   THE FIX
   pages.js is a classic script — no strict mode — so an identifier it
   never declared is looked up on the global object. Defining catName and
   catItems here, with the same logic and the same MODES, is all it takes
   for the call inside renderStatsBody to resolve. Nothing in pages.js is
   touched, so no other behaviour can shift.

   Loaded last, after state.js (which owns MODES) and after pages.js.

   ── NON-FICTION, OUT OF THE STATISTICS LISTS ──
   The two dropdowns are built from the mode's own categories, so both
   offered Non-fiction as well. This page measures the fiction side of a
   mode and nothing else, so the entry is taken back out of the lists —
   and a category that was picked before it left falls back to None,
   instead of sitting in the label with no item left to match it.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const modesOf = function(){
    try{ if(typeof MODES !== 'undefined' && Array.isArray(MODES)) return MODES; }catch(e){}
    try{ if(window.MODES && Array.isArray(window.MODES)) return window.MODES; }catch(e){}
    return [];
  };

  /* the one category the Statistics page has no use for */
  const HIDDEN = 'nonfiction';
  const shown = function(c){ return !!c && c.id !== HIDDEN; };

  /* the name a category id stands for — Fiction, Non-fiction — read from
     the modes themselves, so it can never drift from what a project can be
     filed as. A hidden category has no name here: the label reads None. */
  const catName = function(id){
    if(id === HIDDEN) return '';
    let name = '';
    modesOf().forEach(function(m){
      (m.categories || []).forEach(function(c){ if(c.id === id && shown(c)) name = c.name; });
    });
    return name;
  };

  /* the same lookup for a whole mode's categories, as markup — the shape
     the dropdowns are built from */
  const catItems = function(modeId){
    const m = modesOf().filter(function(x){ return x.id === modeId; })[0];
    return '<button class="stats-cat-item" data-value="none"><span>None</span><i class="bi bi-check2"></i></button>'
      + (((m && m.categories) || []).filter(shown).map(function(c){
          return '<button class="stats-cat-item" data-value="' + c.id + '"><span>' + c.name + '</span><i class="bi bi-check2"></i></button>';
        }).join(''));
  };

  window.catName  = catName;
  window.catItems = catItems;
})();

/* ═══════════════════════════════════════════════════════════
   The dropdowns themselves.

   pages.js paints its two lists from its own copy of catItems, which is
   local to the renderer and cannot be reached from here — so the entry is
   taken out of the lists as they land. The click handling is delegated on
   each box, so a list with one item fewer behaves exactly as before.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const ITEM = '[data-stats-novel] .stats-cat-item[data-value="nonfiction"],'
             + '[data-stats-screenplay] .stats-cat-item[data-value="nonfiction"]';
  const KEYS = ['statsNovel', 'statsScreenplay'];

  const configOf = function(){
    try{ return (typeof S !== 'undefined' && S.config) ? S.config : null; }catch(e){ return null; }
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  const strip = function(){
    let took = false;

    Array.prototype.forEach.call(document.querySelectorAll(ITEM), function(el){
      if(el && el.parentNode){ el.parentNode.removeChild(el); took = true; }
    });

    /* a category picked before it left the lists cannot stay picked */
    const c = configOf();
    if(c){
      KEYS.forEach(function(key){
        if(c[key] === 'nonfiction'){ c[key] = 'none'; saveIt(); took = true; }
      });
    }

    /* and a label left reading Non-fiction follows it back to None */
    Array.prototype.forEach.call(document.querySelectorAll('.stats-cat-value'), function(v){
      if(/^\s*non-fiction\s*$/i.test(v.textContent || '')){ v.textContent = 'None'; took = true; }
    });

    /* the body follows the boxes: a page that was showing Non-fiction has
       nothing left to show, so it is drawn again — empty, not stale */
    if(took && c && KEYS.every(function(k){ return c[k] === 'none'; })){
      try{ if(typeof renderStatsBody === 'function') renderStatsBody(); }catch(e){}
    }
    return took;
  };

  /* every paint of the page, and everything that can bring an item back */
  let raf = 0;
  const soon = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; strip(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(soon).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', soon, true);
  window.addEventListener('resize', soon);
  setInterval(strip, 1000);
  if(document.body) strip();
  else document.addEventListener('DOMContentLoaded', strip);
})();


/* ══════════ keys-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — two keys, put where they belong

   · Shift + / — the block panel. It is the writing page's own panel and
     belongs to the manuscript (and its script mode) and nowhere else. It
     used to open on any page with something editable on screen — the
     reader, a canvas card — which is what made it feel like it came from
     nowhere. pages.js still opens it, so this closes it again inside the
     same keystroke, before anything paints.

   · Shift + @ — the element menu, claimed EARLY (see the window listener
     below). On the Script page the source pane is a <textarea>, not a
     contenteditable, so the writing page's own menu found no editable and
     the keystroke went nowhere useful: the Insert list — scene heading ·
     action · character · parenthetical · dialogue · transition, written as
     Fountain — is what the writer wants there. On the novel manuscript the
     writing page's own element menu (Paragraph · Heading 1-3 · Quote ·
     Epigraph · Scene break) is the right one, and it is opened from here so
     a single handler owns the key.

   Loaded last, so anything bound on `document` runs after pages.js's; the
   Shift + @ handler therefore binds on `window` instead, where the capture
   phase runs before `document`'s and the keystroke can be settled once.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const page = function(){
    try{ return (typeof S !== 'undefined' && S.page) || ''; }catch(e){ return ''; }
  };

  const isSlash = function(e){
    return e.key === '?' || (e.code === 'Slash' && e.shiftKey);
  };
  const isAt = function(e){
    return e.key === '@' || (e.key === '2' && e.shiftKey) || (e.code === 'Digit2' && e.shiftKey);
  };

  /* ── Shift + @ ──
     One handler, bound on `window` in the capture phase so it runs before
     the writing page's own `document` listener and can stop the event there:

       · Script page — a visible .fnt-src pane: open the script's own Insert
         list (the page's panel, so it works whether or not a bar button for
         it is on screen).
       · Novel manuscript — open the writing page's element menu, which is
         what write.js would have done, exactly once.
       · Every other page — untouched. */
  const onScreen = function(el){
    if(!el) return false;
    if(el.getClientRects) return el.getClientRects().length > 0;
    return el.offsetParent !== null;
  };

  const scriptRoot = function(){
    const active = document.querySelector('.sf-script-page.active');
    if(active && active.querySelector('.fnt-src')) return active;
    const any = document.querySelector('.fnt-src');
    if(any && onScreen(any)) return any.closest('.page') || document;
    return null;
  };

  const openInsert = function(root){
    const panel = root.querySelector('.fnt-insert');
    if(!panel) return false;
    if(!panel.hidden) return true;                    /* already open — Esc closes it */
    Array.prototype.forEach.call(root.querySelectorAll('.fnt-jump'), function(p){ p.hidden = true; });
    panel.hidden = false;
    const first = panel.querySelector('.fnt-jump-i');
    if(first) setTimeout(function(){ try{ first.focus(); }catch(e){} }, 30);
    return true;
  };

  window.addEventListener('keydown', function(e){
    if(!isAt(e)) return;
    if(page() !== 'manuscript') return;

    const root = scriptRoot();
    if(root){
      if(openInsert(root)){
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }
      const btn = root.querySelector('[data-fnt-insert]');
      if(btn){
        e.preventDefault(); e.stopImmediatePropagation();
        btn.click();
        return;
      }
    }

    /* the novel manuscript — the writing page's own element menu */
    const menu = document.getElementById('sfElemMenu');
    if(menu && !menu.hidden){
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    if(typeof window.sfOpenMenu === 'function'){
      e.preventDefault(); e.stopImmediatePropagation();
      window.sfOpenMenu();
    }
  }, true);

  const advPanel = function(){ return document.getElementById('advPanel'); };

  const closeAdv = function(){
    const p = advPanel();
    if(!p || p.hidden) return;
    p.hidden = true;
    try{ if(typeof window.advToggle === 'function') window.advToggle(false); }catch(e){}
  };

  /* pages.js opens the panel on any page whose guard finds no caret to
     check, so watching the panel itself is the surest way to keep it off
     the pages it does not belong to: the instant it is shown anywhere but
     the manuscript, it goes away again — no click, no navigation needed. */
  const watchPanel = function(){
    const p = advPanel();
    if(!p || p.dataset.sfOwned === '1') return;
    p.dataset.sfOwned = '1';
    if(typeof MutationObserver !== 'function') return;
    new MutationObserver(function(){
      if(!p.hidden && page() !== 'manuscript') closeAdv();
    }).observe(p, { attributes:true, attributeFilter:['hidden', 'style', 'class'] });
  };

  /* the script page's own source pane — the textarea, not the rich editor */
  const scriptSrc = function(){
    const a = document.activeElement;
    if(a && a.classList && a.classList.contains('fnt-src')) return a;
    return document.querySelector('.sf-script-page.active .fnt-src');
  };

  document.addEventListener('keydown', function(e){
    if(isSlash(e)){
      if(page() === 'manuscript') return;    /* its own page — pages.js owns it */
      closeAdv();
      return;
    }

    if(!isAt(e)) return;
    if(page() !== 'manuscript') return;

    /* the Fountain pane is the only writing surface in a scripted mode, so
       its presence is what makes this the script page — in a novel there is
       no such field and write.js keeps its own menu */
    const root = document.querySelector('.sf-script-page.active') || document;
    if(!root.querySelector('.fnt-src')) return;

    e.preventDefault();
    e.stopPropagation();

    /* the panel first: it is the same list whether the bar's Insert item is
       on screen, inside the ⋯ overflow, or not drawn at all */
    const panel = root.querySelector('.fnt-insert');
    if(panel){
      const wasHidden = panel.hidden;
      root.querySelectorAll('.fnt-jump').forEach(function(p){ p.hidden = true; });
      panel.hidden = !wasHidden;
      const first = panel.querySelector('.fnt-jump-i');
      if(first) setTimeout(function(){ try{ first.focus(); }catch(err){} }, 30);
      return;
    }

    const btn = root.querySelector('[data-fnt-insert]');
    if(btn) btn.click();
  }, true);

  /* the panel cannot outlive the page it belongs to */
  let raf = 0;
  const sweep = function(){
    watchPanel();
    if(page() !== 'manuscript') closeAdv();
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      if(page() !== 'manuscript') closeAdv();
    });
  };

  document.addEventListener('click', sweep, true);
  window.addEventListener('resize', sweep);
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(sweep).observe(document.body, { childList:true, subtree:true });
  }
  if(document.body) sweep();
})();


/* ══════════ autocomplete.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — word autocomplete

   Settings → Autocomplete has carried a switch for this for a while
   (S.config.autocomplete), but nothing ever read it. This is the thing
   that reads it.

   WHERE IT WORKS — every surface the writer actually writes in:
     · the manuscript editor     #editor / .write-doc (contenteditable)
     · the draft editor          .editor-doc (contenteditable)
     · the script source pane    .fnt-src (textarea)

   WHAT IT SUGGESTS — the writer's own vocabulary first. Every word in the
   project (chapters, subchapters, drafts, the script source) is counted,
   so a character's name, a made-up place, a recurring verb comes back
   before anything generic; a small list of everyday words sits under it
   so the first sentence of a new project still completes.

   HOW IT BEHAVES
     · three letters starts it, and it only offers a word longer than what
       is typed — never a repeat of the word you already have
     · Tab or → takes the suggestion, Enter takes it too, Esc dismisses
     · typing keeps narrowing it; it never inserts on its own
     · off entirely when Settings → Autocomplete → Word suggestions is off
   ═══════════════════════════════════════════════════════════ */
(function(){
  const MIN = 3;              /* characters before anything is offered */
  const MAX_SUGGESTIONS = 3;

  /* Everyday words — the floor under the project's own vocabulary, so a
     brand-new project still completes on its first line. */
  const COMMON = ('the and you that was for are with his they this have from one had word what' +
    ' when your which their said each she there use how will other about out many then them these' +
    ' some her would make like him into time has look two more write see number way could people' +
    ' than first water been call who oil its now find long down day did get come made may part' +
    ' over new sound take only little work know place year live back give most very after thing' +
    ' our just name good sentence man think say great where help through much before line right' +
    ' too mean old any same tell boy follow came want show also around form three small set put' +
    ' end does another well large must big even such because turn here why ask went men read need' +
    ' land different home move try kind hand picture again change off play spell air away animal' +
    ' house point page letter mother answer found study still learn should world high every near' +
    ' add food between own below country plant last school father keep tree never start city earth' +
    ' eye light thought head under story saw left few while along might close something seem next' +
    ' hard open example begin life always those both paper together got group often run important' +
    ' until children side feet car mile night walk white sea began grow took river four carry state' +
    ' once book hear stop without second later miss idea enough eat face watch far really almost' +
    ' let above girl sometimes mountain cut young talk soon list song being leave family voice' +
    ' suddenly because though however perhaps already nothing everything someone somewhere' +
    ' against behind beside within between toward towards himself herself myself yourself' +
    ' looked turned walked asked wanted needed felt knew seen heard held stood sat kept left' +
    ' breath silence window street room door hand eyes face voice heart morning evening night').split(' ');

  const cfg = function(){
    try{ return !(typeof S !== 'undefined' && S.config && S.config.autocomplete === false); }
    catch(e){ return true; }
  };

  /* ── the dictionary ─────────────────────────────────────────── */
  const DICT = { sig:'', map:null };

  const projectText = function(){
    const out = [];
    const d = (typeof D === 'function') ? D() : null;
    const take = function(list){
      if(!Array.isArray(list)) return;
      list.forEach(function(x){
        if(!x || typeof x !== 'object') return;
        if(typeof x.content === 'string') out.push(x.content);
        if(typeof x.text   === 'string') out.push(x.text);
        if(typeof x.title  === 'string') out.push(x.title);
        if(typeof x.value  === 'string') out.push(x.value);
        if(typeof x.note    === 'string') out.push(x.note);
        if(Array.isArray(x.children)) take(x.children);
        if(Array.isArray(x.cards)) take(x.cards);
      });
    };
    if(d){
      ['chapters','drafts','ideas','notes','beats','references','cast','timeline','versions'].forEach(function(k){ take(d[k]); });
      if(d.bible && typeof d.bible === 'object'){
        Object.keys(d.bible).forEach(function(k){ take(d.bible[k]); });
      }
    }
    /* the script source is the writer's text too */
    Array.prototype.forEach.call(document.querySelectorAll('.fnt-src'), function(ta){
      if(ta.value) out.push(ta.value);
    });
    return out.join('\n');
  };

  const build = function(){
    const text = projectText();
    /* a cheap signature: the project's identity plus how much there is.
       Rebuilding only when the writing has grown by ~2k keeps the read of
       a long book off the keystroke path. */
    let who = '';
    try{ who = (typeof S !== 'undefined' && S.mode) + ':' + String((D() || {}).currentProject || ''); }catch(e){}
    const sig = who + ':' + Math.floor(text.length / 2000);
    if(DICT.map && DICT.sig === sig) return DICT.map;

    const map = new Map();
    COMMON.forEach(function(w){ map.set(w, 1); });
    const words = text.toLowerCase().match(/[a-z][a-z'\u2019-]{1,}/g) || [];
    for(let i = 0; i < words.length; i++){
      const w = words[i].replace(/[\u2019']/g, '');
      if(w.length < 3 || w.length > 24) continue;
      map.set(w, (map.get(w) || 0) + 8);
    }
    DICT.sig = sig;
    DICT.map = map;
    return map;
  };

  /* ── the popup ──────────────────────────────────────────────── */
  let box = null;
  const el = function(){
    if(box) return box;
    box = document.createElement('div');
    box.className = 'sf-complete';
    box.id = 'sfComplete';
    box.hidden = true;
    document.body.appendChild(box);
    return box;
  };

  let items = [];
  let active = -1;
  let target = null;        /* the surface the popup is answering */
  let wordAt = null;        /* { start, end, word } */

  const hide = function(){
    if(box){ box.hidden = true; }
    items = [];
    active = -1;
    target = null;
    wordAt = null;
  };

  const surface = function(node){
    if(!node || !node.closest) return null;
    const el2 = node.nodeType === 3 ? node.parentNode : node;
    return (el2 && el2.closest) ? el2.closest('#editor, .write-doc, .editor-doc, .fnt-src') : null;
  };

  const isField = function(s){ return !!s && s.tagName === 'TEXTAREA'; };

  /* the word being typed, right before the caret */
  const wordBefore = function(s){
    if(isField(s)){
      const i = s.selectionStart;
      if(i == null || s.selectionEnd !== i) return null;
      const before = s.value.slice(0, i);
      const m = /[A-Za-z][A-Za-z'\u2019-]*$/.exec(before);
      if(!m) return null;
      return { start: i - m[0].length, end: i, word: m[0] };
    }
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if(node.nodeType !== 3) return null;
    const before = node.textContent.slice(0, range.startOffset);
    const m = /[A-Za-z][A-Za-z'\u2019-]*$/.exec(before);
    if(!m) return null;
    return { start: range.startOffset - m[0].length, end: range.startOffset, word: m[0], node: node };
  };

  const candidates = function(word){
    const map = build();
    const key = word.toLowerCase();
    const out = [];
    map.forEach(function(count, w){
      if(w.length <= key.length) return;
      if(w.lastIndexOf(key, 0) !== 0) return;
      out.push({ w: w, n: count });
    });
    out.sort(function(a, b){ return (b.n - a.n) || (a.w.length - b.w.length) || (a.w < b.w ? -1 : 1); });
    return out.slice(0, MAX_SUGGESTIONS);
  };

  /* where to put the popup: the caret's own pixel spot */
  const caretRect = function(s){
    if(isField(s)){
      /* the textarea caret has no rect, so a mirror of the field's own
         metrics is measured at the caret — the standard trick, and the
         only one that follows a wrapped line */
      const cs = window.getComputedStyle(s);
      const mirror = document.createElement('div');
      const st = mirror.style;
      ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','textTransform',
       'wordSpacing','lineHeight','paddingTop','paddingRight','paddingBottom','paddingLeft',
       'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing'].forEach(function(k){
        st[k] = cs[k];
      });
      st.position = 'absolute';
      st.visibility = 'hidden';
      st.whiteSpace = 'pre-wrap';
      st.wordWrap = 'break-word';
      st.width = s.clientWidth + 'px';
      st.top = '0'; st.left = '0';
      mirror.textContent = s.value.slice(0, s.selectionStart);
      const mark = document.createElement('span');
      mark.textContent = '\u200b';
      mirror.appendChild(mark);
      document.body.appendChild(mirror);
      const r = s.getBoundingClientRect();
      const x = r.left + mark.offsetLeft - s.scrollLeft;
      const y = r.top + mark.offsetTop - s.scrollTop;
      const h = parseFloat(cs.lineHeight) || 18;
      mirror.remove();
      return { left: x, top: y + h, bottom: y + h };
    }
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount) return null;
    const rects = sel.getRangeAt(0).getClientRects();
    const r = rects.length ? rects[rects.length - 1] : sel.getRangeAt(0).getBoundingClientRect();
    if(!r || (!r.left && !r.top)) return null;
    return { left: r.left, top: r.bottom, bottom: r.bottom };
  };

  const paint = function(){
    const b = el();
    b.innerHTML = items.map(function(it, i){
      return '<button type="button" class="sf-complete-item' + (i === active ? ' on' : '') + '" data-sf-comp="' + i + '">'
        + '<b>' + escHtml(it.label) + '</b>'
        + '<span>' + escHtml(it.w) + '</span></button>';
    }).join('');
  };

  const escHtml = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const show = function(s, wordAtNow){
    const list = candidates(wordAtNow.word);
    if(!list.length){ hide(); return; }
    const typed = wordAtNow.word;
    const upper = typed[0] === typed[0].toUpperCase() && typed[0] !== typed[0].toLowerCase();
    items = list.map(function(c){
      const rest = c.w.slice(typed.length);
      const label = typed + rest + '\u200b';
      return { w: c.w, rest: rest, label: label, insert: upper ? rest.charAt(0).toUpperCase() + rest.slice(1) : rest,
               cap: upper ? (c.w.charAt(0).toUpperCase() + c.w.slice(1)) : c.w };
    });
    active = 0;
    wordAt = wordAtNow;
    target = s;
    paint();

    const b = el();
    const at = caretRect(s);
    if(!at){ hide(); return; }
    b.hidden = false;
    const w = b.offsetWidth, h = b.offsetHeight;
    let left = at.left, top = at.top + 6;
    if(left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if(top + h > window.innerHeight - 8) top = Math.max(8, (at.top || at.bottom) - h - (at.bottom - at.top) - 6);
    b.style.left = Math.round(left) + 'px';
    b.style.top  = Math.round(top) + 'px';
  };

  const accept = function(i){
    if(!target || !wordAt) return;
    const it = items[i];
    if(!it) return;
    const s = target;
    const rest = it.insert;
    hide();

    if(isField(s)){
      const end = s.selectionStart;
      try{
        s.setRangeText(rest, end, end, 'end');
        s.dispatchEvent(new Event('input', { bubbles:true }));
      }catch(e){}
    }else{
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount) return;
      let ok = false;
      try{ ok = document.execCommand('insertText', false, rest); }catch(e){ ok = false; }
      if(!ok && wordAt.node && wordAt.node.parentNode){
        const node = wordAt.node;
        const range = document.createRange();
        range.setStart(node, Math.max(0, Math.min(node.textContent.length, wordAt.end)));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        const text = node.textContent;
        node.textContent = text.slice(0, wordAt.end) + rest + text.slice(wordAt.end);
        const r2 = document.createRange();
        const pos = wordAt.end + rest.length;
        r2.setStart(node, Math.min(node.textContent.length, pos));
        r2.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r2);
      }
      try{ if(typeof onInput === 'function') onInput(); }catch(e){}
    }
  };

  /* ── events ─────────────────────────────────────────────────── */

  /* a suggestion must never re-open the instant it was taken */
  let justAccepted = false;

  document.addEventListener('input', function(e){
    const s = surface(e.target);
    if(!s || !cfg()){ hide(); return; }
    if(justAccepted){ justAccepted = false; hide(); return; }
    const info = wordBefore(s);
    if(!info || info.word.length < MIN){ hide(); return; }
    /* never offer what is already there, character for character */
    const list = candidates(info.word);
    if(!list.length){ hide(); return; }
    show(s, info);
  }, true);

  /* Registered on WINDOW, in the capture phase: the capture path runs
     window → document → …, so this sees Tab and Enter BEFORE the editor's
     own document-level handlers. That is what stops Tab from inserting
     four spaces and then accepting on the same press. */
  window.addEventListener('keydown', function(e){
    if(!box || box.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); hide(); return; }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); e.stopPropagation();
      active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      paint();
      return;
    }
    if(e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowRight'){
      const it = items[active];
      if(!it) return;
      /* only take the caret keys when there is something to accept */
      e.preventDefault(); e.stopPropagation();
      justAccepted = true;
      setTimeout(function(){ justAccepted = false; }, 0);
      accept(active);
    }
  }, true);

  document.addEventListener('click', function(e){
    const it = e.target.closest && e.target.closest('[data-sf-comp]');
    if(it){
      e.preventDefault(); e.stopPropagation();
      justAccepted = true;
      accept(parseInt(it.dataset.sfComp, 10) || 0);
      return;
    }
    if(!(e.target.closest && e.target.closest('#sfComplete'))) hide();
  }, true);

  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  document.addEventListener('blur', hide, true);
})();


/* ══════════ workspaces.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — workspaces

   FIVE PER PROJECT, and they are the same pages, empty.

   A workspace is not a second app: it is the project's own content — the
   chapters, the drafts, the outline, the plan, the board, the Bible, the
   canvas, the chats — five times over. Workspace 1 holds what you have
   written; 2 to 5 start empty and stay out of 1's way, so a rewrite, an
   alternate cut or a spin-off can be written without unpicking the book
   that already exists. The reference page and the board are workspaces'
   own too, and the AI remembers each one separately, because the brief is
   built from whatever the active workspace holds.

   HOW IT WORKS, and why nothing else in the app had to change

   Every page already reads the project's lists by name — `proj.chapters`,
   `proj.drafts`, `proj.kanban` — and `useProjectData()` points the page at
   them. So the project's content keys are re-pointed once, here, as
   accessors onto `proj.wsList[proj.wsActive]`. Every existing read and write
   anywhere in the app lands in the active workspace without knowing
   workspaces exist. The accessors are deliberately NOT enumerable, so
   `JSON.stringify` stores only `wsList` — the content is saved once, not
   twice, and a reload reads it back from the workspaces it belongs to.

   THE ROUND BUTTON DOES THREE THINGS

     left click    the page list (unchanged)
     right click   the AI assistant (unchanged)
     hover + ← →   the previous / next workspace
     hover + wheel the same, a notch at a time

   A switch says so — "Workspace 3 of 5 · Act two" — and the page slides
   the way you moved. The name of each workspace is set in
   Settings → Custom → Workspaces.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const COUNT = 5;

  /* everything a workspace owns. Anything a page reads off the PROJECT
     belongs here; the project's own identity (name, mode, category, the
     project list, wsActive) does not. */
  const KEYS = [
    'chapters', 'drafts', 'ideas', 'notes', 'beats', 'references',
    'timeline', 'cast', 'versions', 'aiChats',
    'bible', 'kanban', 'kbCols', 'mindmap', 'canvasElements'
  ];

  const toastIt = function(msg, kind){
    try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){}
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  /* ═══ names ═══ */
  const labelList = function(){
    try{
      if(!Array.isArray(S.config.wsLabels)) S.config.wsLabels = [];
      while(S.config.wsLabels.length < COUNT) S.config.wsLabels.push('');
      return S.config.wsLabels;
    }catch(e){ return ['', '', '', '', '']; }
  };
  const nameOf = function(i){
    const custom = labelList()[i];
    return (custom && String(custom).trim()) || ('Workspace ' + (i + 1));
  };
  window.sfWsName = nameOf;
  window.sfWsCount = function(){ return COUNT; };

  /* ═══ the storage ═══ */
  const blank = function(){ return { id:'ws' + Math.random().toString(36).slice(2, 7) }; };

  const ensure = function(proj){
    if(!proj || typeof proj !== 'object') return proj;

    if(!Array.isArray(proj.wsList) || proj.wsList.length !== COUNT){
      /* MIGRATION: a project written before workspaces keeps everything it
         has, in workspace 1. The keys are lifted off the project first, so
         nothing is copied twice and nothing is left behind. */
      const carry = {};
      KEYS.forEach(function(k){
        if(Object.prototype.hasOwnProperty.call(proj, k)){
          carry[k] = proj[k];
          try{ delete proj[k]; }catch(e){}
        }
      });
      proj.wsList = [];
      for(let i = 0; i < COUNT; i++) proj.wsList.push(blank());
      Object.keys(carry).forEach(function(k){ proj.wsList[0][k] = carry[k]; });
    }

    if(typeof proj.wsActive !== 'number' || !(proj.wsActive >= 0 && proj.wsActive < COUNT)){
      proj.wsActive = 0;
    }

    KEYS.forEach(function(k){
      const d = Object.getOwnPropertyDescriptor(proj, k);
      if(d && typeof d.get === 'function') return;      /* already ours */
      Object.defineProperty(proj, k, {
        configurable: true,
        enumerable: false,                              /* stored once, in wsList */
        get: function(){
          const w = proj.wsList[proj.wsActive] || proj.wsList[0];
          return w ? w[k] : undefined;
        },
        set: function(v){
          const w = proj.wsList[proj.wsActive] || proj.wsList[0];
          if(w) w[k] = v;
        }
      });
    });
    return proj;
  };
  window.sfWsEnsure = ensure;

  /* every project is put through it the moment it becomes the working set */
  if(typeof window.useProjectData === 'function' && !window.useProjectData.__sfWs){
    const orig = window.useProjectData;
    const wrapped = function(proj){
      try{ ensure(proj); }catch(e){}
      return orig.apply(this, arguments);
    };
    wrapped.__sfWs = true;
    window.useProjectData = wrapped;
  }

  /* ═══ and on every read of the saved state ═══
     AFTER A RELOAD the content is only inside `wsList`: the accessors are
     rebuilt, never stored. `load()` replaces the whole state object, so a
     project exists for a moment with no `chapters` at the top level — and
     the app's own boot body checks exactly that property and would helpfully
     write a fresh, empty “Chapter 1” over a real book. Routing every load
     through here means the workspaces are in place before that check runs. */
  const ensureAll = function(){
    try{
      const modes = (typeof S !== 'undefined' && S.modes) || {};
      Object.keys(modes).forEach(function(m){
        const box = modes[m];
        if(!box || !Array.isArray(box.projects)) return;
        box.projects.forEach(function(p){ try{ ensure(p); }catch(e){} });
      });
    }catch(e){}
  };
  window.sfWsEnsureAll = ensureAll;

  if(typeof window.load === 'function' && !window.load.__sfWs){
    const origLoad = window.load;
    const wrappedLoad = function(){
      const r = origLoad.apply(this, arguments);
      try{ ensureAll(); }catch(e){}
      return r;
    };
    wrappedLoad.__sfWs = true;
    window.load = wrappedLoad;
  }

  const currentProj = function(){
    try{
      const d = D();
      return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };
  window.sfWsProj = currentProj;
  window.sfWsActive = function(){
    const p = currentProj();
    return p ? (p.wsActive || 0) : 0;
  };

  /* ═══ the switch ═══ */
  const flash = function(dir, i){
    const wrap = document.getElementById('fabWrap');
    const stage = document.getElementById('stage');
    const cls = dir > 0 ? 'ws-slide-fwd' : 'ws-slide-back';
    [wrap, stage].forEach(function(el){
      if(!el || !el.classList) return;
      el.classList.remove('ws-slide-fwd', 'ws-slide-back');
      /* re-add on the next frame, so the animation replays every time */
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(function(){ el.classList.remove(cls); }, 460);
    });
    badge(i);
  };

  const badge = function(i){
    const wrap = document.getElementById('fabWrap');
    if(!wrap) return;
    let b = wrap.querySelector('.fab-ws-badge');
    if(!b){
      b = document.createElement('span');
      b.className = 'fab-ws-badge';
      b.setAttribute('aria-hidden', 'true');
      wrap.appendChild(b);
    }
    const n = (typeof i === 'number') ? i : window.sfWsActive();
    b.textContent = (n + 1) + '/' + COUNT;
    b.title = nameOf(n);
  };

  const goTo = function(i, dir){
    const proj = currentProj();
    if(!proj){
      toastIt('Open a project first', 'warn');
      return false;
    }
    ensure(proj);
    const n = ((Math.round(i) % COUNT) + COUNT) % COUNT;
    if(n === proj.wsActive){
      toastIt('Already on ' + nameOf(n));
      return false;
    }

    /* the outgoing workspace is written down BEFORE the pointer moves: `save`
       reads the editor through the active workspace, and by the time the
       page has been re-rendered it belongs to the new one — saving after the
       move would put the old workspace's page into the new workspace. */
    saveIt();

    proj.wsActive = n;
    try{ if(typeof useProjectData === 'function') useProjectData(proj); }catch(e){}
    try{ if(typeof goPage === 'function') goPage(S.page); }catch(e){}
    try{ if(typeof renderModePills === 'function') renderModePills(); }catch(e){}
    try{ if(typeof updateBreadcrumb === 'function') updateBreadcrumb(); }catch(e){}
    saveIt();

    flash(dir || 1, n);
    toastIt('Workspace ' + (n + 1) + ' of ' + COUNT + ' · ' + nameOf(n));
    return true;
  };
  window.sfWsGo = function(i){ return goTo(i, (i > window.sfWsActive()) ? 1 : -1); };
  window.sfWsStep = function(dir){
    const at = window.sfWsActive();
    return goTo(at + (dir >= 0 ? 1 : -1), dir >= 0 ? 1 : -1);
  };
  window.sfWsCycle = function(){ return window.sfWsStep(1); };

  /* ═══ the round button's third job ═══ */
  let hovering = false;
  let wheelLock = false;

  const bind = function(){
    const wrap = document.getElementById('fabWrap');
    if(!wrap || wrap.__sfWsBound) return;
    wrap.__sfWsBound = true;

    wrap.addEventListener('mouseenter', function(){
      hovering = true;
      wrap.classList.add('ws-hover');
      badge();
    });
    wrap.addEventListener('mouseleave', function(){
      hovering = false;
      wrap.classList.remove('ws-hover');
    });
    /* the wheel over the button: a notch is one workspace either way */
    wrap.addEventListener('wheel', function(e){
      if(!wrap.classList.contains('ws-hover')) return;
      e.preventDefault();
      e.stopPropagation();
      if(wheelLock) return;
      wheelLock = true;
      setTimeout(function(){ wheelLock = false; }, 320);
      window.sfWsStep(e.deltaY > 0 ? 1 : -1);
    }, { passive:false });

    wrap.addEventListener('focusin', function(){ hovering = true; wrap.classList.add('ws-hover'); badge(); });
    wrap.addEventListener('focusout', function(){ hovering = false; wrap.classList.remove('ws-hover'); });
    badge();
  };

  /* ← and → while the pointer is on the button. Nothing else uses them there:
     the button has no caret, and the pages are one click each. */
  document.addEventListener('keydown', function(e){
    if(!hovering) return;
    if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    /* a panel or the command box on top of the app keeps its own arrows */
    const open = document.querySelector('.settings-panel.open, .modal.open, .cmd-box.open, .fab-menu:not([hidden]), .fab-ai:not([hidden])');
    if(open) return;
    e.preventDefault();
    e.stopPropagation();
    window.sfWsStep(e.key === 'ArrowRight' ? 1 : -1);
  }, true);

  /* the badge counts on every repaint of the page, so it can never be stale */
  if(typeof window.goPage === 'function' && !window.goPage.__sfWs){
    const origGo = window.goPage;
    const wrappedGo = function(){
      const r = origGo.apply(this, arguments);
      setTimeout(function(){ badge(); }, 0);
      return r;
    };
    wrappedGo.__sfWs = true;
    window.goPage = wrappedGo;
  }

  /* ═══ Settings → Custom → Workspaces ═══ */
  try{
    if(typeof SETTINGS === 'object' && SETTINGS.renderers && typeof SETTINGS.renderers.custom === 'function'){
      const origCustom = SETTINGS.renderers.custom;
      SETTINGS.renderers.custom = function(root){
        const r = origCustom.apply(this, arguments);
        try{ settingsCard(root); }catch(e){ console.warn('workspace settings failed:', e); }
        return r;
      };
    }
  }catch(e){}

  function settingsCard(root){
    if(!root || typeof card !== 'function' || typeof row !== 'function') return;

    const c = card('Workspaces', 'collection');

    const head = function(){
      const p = currentProj();
      return p ? nameOf(p.wsActive || 0) : 'No project open';
    };

    /* which workspace you are naming */
    const pick = document.createElement('select');
    pick.className = 'sel';
    for(let i = 0; i < COUNT; i++){
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = (i + 1) + '. ' + nameOf(i);
      if(i === window.sfWsActive()) o.selected = true;
      pick.appendChild(o);
    }

    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.className = 'inp';
    nameInp.maxLength = 40;
    nameInp.style.minWidth = '180px';
    nameInp.placeholder = 'Name this workspace';
    nameInp.value = labelList()[Number(pick.value) || 0] || '';

    const repaintPicks = function(){
      Array.prototype.forEach.call(pick.options, function(o, i){
        o.textContent = (i + 1) + '. ' + nameOf(i);
      });
    };

    pick.onchange = function(){
      nameInp.value = labelList()[Number(pick.value) || 0] || '';
      nameInp.focus();
    };
    const commit = function(){
      const i = Number(pick.value) || 0;
      const typed = String(nameInp.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      labelList()[i] = typed;
      saveIt();
      repaintPicks();
      badge();
      if(typeof renderFabMenu === 'function') renderFabMenu();
      toastIt(typed ? 'Workspace ' + (i + 1) + ' is “' + typed + '”' : 'Workspace ' + (i + 1) + ' keeps its number');
    };
    nameInp.onchange = commit;
    nameInp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); commit(); nameInp.blur(); } });

    c.appendChild(row('Workspace label', 'The name shown when you switch — this project’s 1 to 5', [pick, nameInp]));

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn btn-ghost';
    goBtn.innerHTML = '<i class="bi bi-collection"></i> Go to it';
    goBtn.onclick = function(){ goTo(Number(pick.value) || 0, 1); badge(); };
    c.appendChild(row('Switch', 'Or hover the round button and press ← → , or scroll a notch over it', [goBtn]));

    root.appendChild(c);
  }

  /* ═══ boot ═══ */
  const boot = function(){
    ensureAll();
    bind();
    badge();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();

