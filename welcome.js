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
    const want = name ? 'Welcome back, ' + name : 'Welcome back';
    if(String(head.textContent || '').trim() === want) return;
    head.textContent = want;
    if(name) head.setAttribute('title', 'Signed in as ' + name);
    else head.removeAttribute('title');
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      try{ paint(); }catch(e){}
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
