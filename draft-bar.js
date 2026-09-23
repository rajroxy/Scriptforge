/* ═══════════════════════════════════════════════════════════
   Draft — the bar's three buttons

   · New draft is the bar while you are writing. It calls the app's own
     New draft action; the writing actions live in the right-click menu.
   · While an AI panel is on screen — the right-click assistant, the
     draft chat, or the AI result sheet — the bar stays and New draft
     steps aside. Everything is back the moment the panel closes.
   · New Chat takes New draft's slot, and only while the draft chat is
     the thing on screen: the chat's own way in, in the bar.

   · The chat's AI settings button rides at the bar's right end, and only
     while a chat is open. It is the page's own top bar, not the app
     header, and not the chat card.

   The buttons are the app's own; this only places and hides them.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const shown = function(el){
    if(!el || el.hidden) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };

  /* the draft chat itself — the view or its panel in the pane */
  const chatView = function(){
    if(typeof S !== 'undefined' && S.page && S.page !== 'draft') return false;
    const draft = document.getElementById('page-draft');
    if(!draft) return false;
    if(draft.classList.contains('dc-on')) return true;
    return !!draft.querySelector('[data-dc="1"]');
  };

  /* the chat's own AI settings view is open — the button that opens it has
     done its job, so it steps aside while that panel is on screen */
  const chatInSettings = function(){
    return !!document.querySelector('#page-draft .draft-split[data-dcset="1"]');
  };

  const chatOpen = function(){
    if(shown(document.getElementById('fabAI'))) return true;      /* right-click assistant */
    const modal = document.getElementById('modalRoot');           /* the AI result sheet */
    if(modal && modal.classList.contains('open')) return true;
    return chatView();
  };

  /* The AI chat's settings button belongs in the Draft page's own top bar,
     at its right end — not in the app header, and not on the chat card.
     The chat card has no head of its own any more, so this is the single
     sliders icon: it appears beside New Chat while the chat is open. */
  const settingsBtn = function(bar){
    let b = bar.querySelector('[data-sfbar-chat-settings]');
    if(!b){
      b = document.createElement('button');
      b.className = 'ol-btn ol-btn-icon sf-bar-end';
      b.setAttribute('data-sfbar-chat-settings', '1');
      b.title = 'Chat AI settings';
      b.innerHTML = '<i class="bi bi-sliders"></i>';
      bar.appendChild(b);
    }
    return b;
  };
  const syncTopbar = function(){
    const bar = document.querySelector('#page-draft .sf-bar');
    if(!bar) return;
    const b = settingsBtn(bar);
    const on = chatView() && !chatInSettings();
    if(b.hidden === on) b.hidden = !on;
  };

  const paint = function(){
    syncTopbar();
    const open = chatOpen();
    if(document.body.classList.contains('sf-ai-open') !== open){
      document.body.classList.toggle('sf-ai-open', open);
    }
    /* the bar swaps New draft for New Chat when the chat is the thing on
       screen — the chat's own presence, not any AI panel */
    const inChat = chatView();
    if(document.body.classList.contains('sf-chat-open') !== inChat){
      document.body.classList.toggle('sf-chat-open', inChat);
    }
    if(document.body.classList.contains('sf-chat-set') !== chatInSettings()){
      document.body.classList.toggle('sf-chat-set', chatInSettings());
    }
    const bar = document.querySelector('#page-draft .sf-bar');
    if(bar && bar.classList.contains('sf-bar-hidden') !== open){
      bar.classList.toggle('sf-bar-hidden', open);
    }
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-sfbar-chat-settings]')) return;
    e.preventDefault();
    const DC = window.DraftChat;
    if(DC && typeof DC.settings === 'function') DC.settings();
    else if(typeof toast === 'function') toast('The draft chat is not available here', 'warn');
  }, true);

  setInterval(paint, 200);
  document.addEventListener('click', paint, true);
  document.addEventListener('keyup', paint, true);
  window.addEventListener('resize', paint);
  if(document.body) paint();
})();
