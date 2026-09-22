/* ═══════════════════════════════════════════════════════════
   FAB — one tooltip for both menus

   Left-click menu  → a page: its name, its command-box key and what
                      the page is for.
   Right-click menu → an AI option: its name and what it does.
   The FAB itself    → both gestures.

   The menus are scrolled cards, so a CSS tooltip would be clipped;
   this one floats beside the card. The item's own native title is
   removed on hover so only this tip shows.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const ABOUT = {
    home:       'The dashboard — Overview and Statistics',
    inspire:    'Prompts and exercises written from your own project',
    draft:      'Plain-text passes — the quick, unformatted work',
    outline:    'Chapters and subchapters, in the order you want',
    plan:       'A visual beat board for the story',
    manuscript: 'The writing view — formatted pages, chapter by chapter',
    script:     'The writing view — formatted script pages',
    bible:      'Characters, places, items, events and the timeline',
    kanban:     'A production board of your sections',
    mindmap:    'Canvas — cards you place freely and links between them',
    notebook:   'Projects, snapshots and everything you kept',
    reader:     'Read it back as a finished book',
    stats:      'Words, sessions and the day rail',
    overview:   'A guided tour of the whole app'
  };

  let tip = null;
  const box = function(){
    if(!tip){
      tip = document.createElement('div');
      tip.className = 'sf-tip';
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    return tip;
  };
  const hide = function(){ if(tip) tip.hidden = true; };

  const place = function(el, r){
    const w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
    let left = r.left - w - 10;
    if(left < 8) left = r.right + 10;                 /* no room left → go right */
    if(left + w > vw - 8) left = Math.max(8, vw - w - 8);
    const top = Math.min(Math.max(8, r.top + r.height / 2 - h / 2), vh - h - 8);
    el.style.left = Math.round(left) + 'px';
    el.style.top  = Math.round(top) + 'px';
  };

  /* left-click menu item */
  const pageTip = function(item){
    const id   = item.dataset.fabGo || '';
    const name = (item.querySelector('span') || {}).textContent || id;
    const keys = (typeof CMD_PAGE_KEYS !== 'undefined') ? CMD_PAGE_KEYS : {};
    const about = ABOUT[id] || '';
    return {
      html: '<b>' + esc(name) + (keys[id] ? '  ·  ' + esc(keys[id]) : '') + '</b>'
          + (about ? '<span>' + esc(about) + '</span>' : '')
    };
  };

  /* right-click AI option */
  const optTip = function(opt){
    const b  = opt.querySelector('b');
    const em = opt.querySelector('em');
    return { html: '<b>' + esc(b ? b.textContent : 'AI') + '</b>'
                 + (em ? '<span>' + esc(em.textContent) + '</span>' : '') };
  };

  const show = function(item, info){
    item.removeAttribute('title');                    /* no native tip on top of ours */
    const el = box();
    el.innerHTML = info.html;
    el.hidden = false;
    place(el, item.getBoundingClientRect());
  };

  document.addEventListener('mouseover', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    const page = t.closest('#fabMenu .fab-item[data-fab-go]');
    if(page){ show(page, pageTip(page)); return; }

    const opt = t.closest('#fabAI .fab-ai-opt');
    if(opt){ show(opt, optTip(opt)); return; }

    const chip = t.closest('#fabAI .ai-chip');
    if(chip){
      show(chip, { html: '<b>' + esc((chip.textContent || '').trim()) + '</b>' });
      return;
    }

    const fab = t.closest('#fabBtn');
    if(fab){
      const el = box();
      el.innerHTML = '<b>Pages menu  ·  left click</b><span>Every view of this project</span>'
                   + '<b style="margin-top:4px">AI assistant  ·  right click</b><span>Rewrite, continue, translate…</span>';
      el.hidden = false;
      place(el, fab.getBoundingClientRect());
      return;
    }

    hide();
  }, true);

  document.addEventListener('mouseout', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(!t.closest('#fabWrap')) return;
    const to = e.relatedTarget;
    if(!to || !to.closest || !to.closest('#fabWrap')) hide();   /* left the FAB area */
  }, true);

  document.addEventListener('click', hide, true);
  window.addEventListener('resize', hide);

  const labelFab = function(){
    const fab = document.getElementById('fabBtn');
    if(fab) fab.removeAttribute('title');
  };
  if(document.body) labelFab();
  else document.addEventListener('DOMContentLoaded', labelFab);
})();
