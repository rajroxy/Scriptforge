/* ═══════════════════════════════════════════════════════════
   ScriptForge — Write
   Editor · Full toolbar · Icon library · Per-mode inserts
   ═══════════════════════════════════════════════════════════ */

const WRITE = {};

// Saved selection — CRITICAL for formatting to work
let savedRange = null;
function saveSel(){
  const sel = window.getSelection();
  const ed = $('editor');
  if(sel.rangeCount && ed && ed.contains(sel.anchorNode)){
    savedRange = sel.getRangeAt(0).cloneRange();
  }
}
function restoreSel(){
  if(!savedRange) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
}

/* ═══ Overlay pane → main window edit relay ═══ */
let sfPaneTimer = 0;
function sfPanePostEdit(editor){
  if(window.SF_VIEW !== true || !window.parent || window.parent === window) return;
  const d = D();
  if(!d.currentProject || !d.currentChapter) return;
  clearTimeout(sfPaneTimer);
  sfPaneTimer = setTimeout(() => {
    window.parent.postMessage({
      sf:'edit',
      mode: String(S.mode),
      projectId: String(d.currentProject),
      chapterId: String(d.currentChapter),
      html: editor.innerHTML
    }, location.origin);
  }, 250);
}

/* Relay section structure after new/rename/delete actions. */
function sfPanePostStructure(){
  if(window.SF_VIEW !== true) return;
  if(!window.parent || window.parent === window) return;

  const d = D();
  const project = (d.projects || [])
    .find(p => String(p.id) === String(d.currentProject));

  if(!project) return;

  const chapters = Array.isArray(project.chapters)
    ? project.chapters
    : d.chapters;

  if(!Array.isArray(chapters)) return;

  window.parent.postMessage({
    sf: 'structure',
    mode: String(S.mode),
    projectId: String(d.currentProject),
    chapters: JSON.parse(JSON.stringify(chapters))
  }, location.origin);
}

/* Delegated listener survives editor replacement/re-rendering. */
if(window.SF_VIEW === true){
  document.addEventListener('input', e => {
    const editor = e.target.closest && e.target.closest('#editor');
    if(editor && editor.isContentEditable){
      sfPanePostEdit(editor);
    }
  }, true);

  document.addEventListener('click', e => {
    const structural = e.target.closest && e.target.closest(
      '[data-act="new-chapter"],' +
      '[data-act="new-subchapter"],' +
      '[data-act="rename-chapter"],' +
      '[data-act="rename-subchapter"],' +
      '[data-act="delete-chapter"],' +
      '[data-act="delete-subchapter"]'
    );

    if(structural){
      /* Let chapter-buttons.js finish first. */
      setTimeout(sfPanePostStructure, 0);
    }
  }, true);
}

// ═══════════════════════════════════════════════════════════
//   PER-MODE INSERT BUTTONS
// ═══════════════════════════════════════════════════════════

const MODE_TOOLS = {
  novel: [
    {ins:'sceneBreak', icon:'three-dots', label:'Scene break'},
  ],
  screenplay: [
    {ins:'scene', icon:'camera-reels', label:'Scene heading', key:'⌘1'},
    {ins:'action', icon:'lightning', label:'Action', key:'⌘2'},
    {ins:'character', icon:'person', label:'Character', key:'⌘3'},
    {ins:'paren', icon:'chat-quote', label:'Parenthetical', key:'⌘4'},
    {ins:'dialogue', icon:'chat-dots', label:'Dialogue', key:'⌘5'},
    {ins:'transition', icon:'arrow-right-square', label:'Transition', key:'⌘6'}
  ],
  tv: [
    {ins:'teaser', icon:'play-circle', label:'Teaser'},
    {ins:'actbreak', icon:'pause-circle', label:'Act break'},
    {ins:'scene', icon:'camera-reels', label:'Scene heading', key:'⌘1'},
    {ins:'character', icon:'person', label:'Character', key:'⌘3'},
    {ins:'dialogue', icon:'chat-dots', label:'Dialogue', key:'⌘5'}
  ],
  stage: [
    {ins:'act', icon:'layers', label:'Act'},
    {ins:'scene', icon:'signpost-2', label:'Scene', key:'⌘1'},
    {ins:'stageDir', icon:'signpost', label:'Stage direction'},
    {ins:'character', icon:'person', label:'Character', key:'⌘3'},
    {ins:'dialogue', icon:'chat-dots', label:'Dialogue', key:'⌘5'}
  ],
  poetry: [
    {ins:'stanza', icon:'text-indent-right', label:'Stanza'},
    {ins:'haiku', icon:'flower1', label:'Haiku'},
    {ins:'sonnet', icon:'heart', label:'Sonnet'},
    {ins:'freeverse', icon:'wind', label:'Free verse'},
    {ins:'limerick', icon:'emoji-laughing', label:'Limerick'}
  ],
  song: [
    {ins:'verse', icon:'music-note', label:'Verse'},
    {ins:'chorus', icon:'megaphone', label:'Chorus'},
    {ins:'bridge', icon:'bezier2', label:'Bridge'},
    {ins:'prechorus', icon:'caret-up-square', label:'Pre-chorus'},
    {ins:'outro', icon:'music-note-beamed', label:'Outro'}
  ],
  essay: [
    {ins:'thesis', icon:'bullseye', label:'Thesis'},
    {ins:'argument', icon:'chat-left-text', label:'Argument'},
    {ins:'evidence', icon:'file-earmark-text', label:'Evidence'},
    {ins:'citation', icon:'quote', label:'Citation'},
    {ins:'counter', icon:'shield-exclamation', label:'Counter'},
    {ins:'conclusion', icon:'flag', label:'Conclusion'}
  ],
  research: [
    {ins:'abstract', icon:'file-text', label:'Abstract'},
    {ins:'intro', icon:'book', label:'Introduction'},
    {ins:'method', icon:'gear', label:'Methods'},
    {ins:'results', icon:'bar-chart', label:'Results'},
    {ins:'discussion', icon:'chat-square-text', label:'Discussion'},
    {ins:'refs', icon:'journals', label:'References'}
  ],
  academic: [
    {ins:'abstract', icon:'file-text', label:'Abstract'},
    {ins:'keywords', icon:'tags', label:'Keywords'},
    {ins:'citation', icon:'quote', label:'Citation'},
    {ins:'footnote', icon:'1-circle', label:'Footnote'}
  ],
  journal: [
    {ins:'date', icon:'calendar-event', label:'Date'},
    {ins:'mood', icon:'emoji-smile', label:'Mood'},
    {ins:'gratitude', icon:'heart', label:'Gratitude'},
    {ins:'reflect', icon:'arrow-repeat', label:'Reflection'}
  ],
  blog: [
    {ins:'hook', icon:'megaphone', label:'Hook'},
    {ins:'h2', icon:'type-h2', label:'Subheading'},
    {ins:'bullets', icon:'list-ul', label:'Bullets'},
    {ins:'quote', icon:'quote', label:'Quote'},
    {ins:'cta', icon:'cursor', label:'CTA'}
  ],
  news: [
    {ins:'headline', icon:'newspaper', label:'Headline'},
    {ins:'dateline', icon:'geo-alt', label:'Dateline'},
    {ins:'lead', icon:'chat-left-quote', label:'Lead'},
    {ins:'byline', icon:'person-badge', label:'Byline'}
  ],
  comic: [
    {ins:'panel', icon:'grid-3x3', label:'Panel'},
    {ins:'caption', icon:'card-text', label:'Caption'},
    {ins:'bubble', icon:'chat-square-text', label:'Bubble'},
    {ins:'sfx', icon:'lightning-charge', label:'SFX'}
  ],
  children: [
    {ins:'once', icon:'book-half', label:'Once upon'},
    {ins:'sound', icon:'volume-up', label:'Sound word'},
    {ins:'repeat', icon:'arrow-repeat', label:'Repetition'},
    {ins:'end', icon:'flag', label:'The end'}
  ],
  code: [
    {ins:'html', icon:'filetype-html', label:'HTML'},
    {ins:'js', icon:'braces', label:'Function'},
    {ins:'comment', icon:'chat-left-text', label:'Comment'},
    {ins:'todo', icon:'check2-square', label:'TODO'}
  ],
  memoir: [
    {ins:'sceneBreak', icon:'three-dots', label:'Scene break'},
    {ins:'chapter', icon:'bookmark', label:'Chapter'},
    {ins:'timelineRef', icon:'clock-history', label:'Timeline marker'}
  ],
  speech: [
    {ins:'cue', icon:'card-text', label:'Cue'},
    {ins:'pause', icon:'pause-circle', label:'Pause'},
    {ins:'emphasis', icon:'stars', label:'Emphasis'}
  ],
  recipe: [
    {ins:'ingredient', icon:'basket', label:'Ingredient'},
    {ins:'step', icon:'list-ol', label:'Step'},
    {ins:'tip', icon:'lightbulb', label:'Tip'}
  ],
  scripture: [
    {ins:'verse', icon:'book', label:'Verse'},
    {ins:'note', icon:'chat-left-text', label:'Note'},
    {ins:'cross', icon:'link-45deg', label:'Cross-ref'}
  ],
  interview: [
    {ins:'question', icon:'question-circle', label:'Question'},
    {ins:'answer', icon:'chat-left-dots', label:'Answer'},
    {ins:'followup', icon:'arrow-return-right', label:'Follow-up'}
  ]
};

// ═══════════════════════════════════════════════════════════
//   INSERT TEMPLATES
// ═══════════════════════════════════════════════════════════

const INSERTS = {
  // Universal
  hr:'<hr>',
  sceneBreak:'<p style="text-align:center;color:var(--ink-3);letter-spacing:1em;">* * *</p>',
  chapter:'<h2>Chapter</h2>',
  timejump:'<p style="text-align:center;font-style:italic;color:var(--ink-3);">Later…</p>',
  // Screenplay
  scene:'<p class="scene-heading">INT. LOCATION - DAY</p>',
  action:'<p class="action">Action description...</p>',
  character:'<p class="character-name">CHARACTER</p>',
  dialogue:'<p class="dialogue">Dialogue...</p>',
  paren:'<p class="parenthetical">(beat)</p>',
  transition:'<p class="transition">CUT TO:</p>'
};


// ═══════════════════════════════════════════════════════════
//   INIT — called when Write page renders
// ═══════════════════════════════════════════════════════════

WRITE.init = function(){
  const ed = $('editor');
  if(!ed) return;

  const c = curCh();
  if(c) ed.innerHTML = c.content || '';

  const placeholders = {
    novel:'Start your story...', screenplay:'FADE IN:\n\nINT. LOCATION - DAY',
    tv:'TEASER\n\nFADE IN:', stage:'ACT I\n\nSCENE 1',
  };
  ed.setAttribute('data-placeholder', placeholders[S.mode] || 'Start writing...');

  renderToolbar();

  // Remove old listeners by cloning (safe)
  ed.replaceWith(ed.cloneNode(true));
  const newEd = $('editor');
  newEd.innerHTML = c ? (c.content || '') : '';

  newEd.addEventListener('input', onInput);
  newEd.addEventListener('keyup', saveSel);
  newEd.addEventListener('mouseup', saveSel);
  newEd.addEventListener('contextmenu', onCtx);
  // experimental: the last word typed wears the next of your three fonts
  newEd.addEventListener('keydown', e => {
    if(e.key === ' ' || e.key === 'Enter') mixedFontApply();
  });

  document.addEventListener('selectionchange', () => {
    if(document.activeElement === newEd) saveSel();
  });

  /* the font and the size are re-applied to the fresh editor — the inline
     style is lost every time the page repaints, which is why the size
     setting looked like it did nothing */
  if(typeof applyConfig === 'function'){
    try{ applyConfig('font'); applyConfig('fontSize'); }catch(e){}
  }

  if(window.TOOLS?.initVoice) window.TOOLS.initVoice();
  updateCounts();
  
    if(document.getElementById('splitEditor')){
    if(typeof WRITE.initSplit === 'function') WRITE.initSplit();
    return;
  }
};

// ═══ CHAPTER CONTROLS ═══
const CH_LABELS = {
  novel:      { ch:'Chapter', sub:'Subchapter' },
  screenplay: { ch:'Scene',   sub:'Subscene'   }
};
function chLabels(){ return CH_LABELS[S.mode] || CH_LABELS.novel; }

function renderChapterControls(){
  const el = $('chapterControls');
  if(!el) return;

  const d = D();
  const current = (typeof curCh === 'function') ? curCh() : null;
  const chapters = d.chapters || [];
  const parent = chapters.find(ch => ch.id === (current && current.id))
              || chapters.find(ch => (ch.children || []).some(x => x.id === (current && current.id)))
              || chapters[0];
  const L = chLabels();

  /* The strip carries the two dropdowns and nothing else — adding, renaming
     and deleting sections lives on the Outline page, where you can see the
     whole structure at once. */
  el.innerHTML = `
    <div class="chapter-control">
      <select class="tb-select" data-chapter-select title="${L.ch}">
        ${chapters.map(ch => `<option value="${ch.id}" ${ch.id === (parent && parent.id) ? 'selected' : ''}>${esc(ch.title || 'Untitled')}</option>`).join('')}
      </select>
    </div>
    <span class="cc-sep"></span>
        <div class="chapter-control">
      <select class="tb-select" data-subchapter-select title="${L.sub}">
        ${((parent && parent.children) || []).map(ch => `<option value="${ch.id}" ${ch.id === (current && current.id) ? 'selected' : ''}>${esc(ch.title || 'Untitled')}</option>`).join('')}
      </select>
    </div>

    <span class="cc-sep"></span>
    <div class="chapter-control cc-tools">
      <button class="icon-btn-sm" data-act="notes-open" title="Notes — a scratchpad panel"><i class="bi bi-sticky"></i></button>
      <button class="icon-btn-sm" data-act="go-page" data-page="notebook" title="Book — projects and snapshots"><i class="bi bi-journal-bookmark"></i></button>
    </div>
    <span class="cc-sep"></span>
    <div class="chapter-control cc-tools">
      <button class="icon-btn-sm" data-act="util-open" title="Utilities — clock, calendar, calculator and more"><i class="bi bi-grid-3x3-gap"></i></button>
    </div>
    <span class="cc-sep"></span>
    <div class="chapter-control cc-right">
      ${S.page === 'manuscript'
        ? '<button class="icon-btn-sm" data-act="split-open" title="Split screen"><i class="bi bi-layout-sidebar-inset-reverse"></i></button>'
        : ''}
      ${S.config.expOverlay
        ? '<button class="icon-btn-sm" data-act="overlay-open" title="Overlay screen"><i class="bi bi-layout-split"></i></button>'
        : ''}
      <span class="cc-sep"></span>
      <button class="icon-btn-sm" data-act="find-open" title="Find &amp; replace (Ctrl+F)"><i class="bi bi-search"></i></button>
    </div>`;

  // chapter + subchapter selects → the Settings-style stats dropdown card
  if(typeof window.enhanceSelects === 'function') window.enhanceSelects(el);

  /* the two mini players in the bar show what is actually playing */
  if(typeof ccMiniRefresh === 'function') ccMiniRefresh();
  paintSwatches();
}

/* ═══════════════════════════════════════════════════════════
   MINI PLAYERS — music + video, living in the chapter bar
   They drive the very same players (mp-toggle, video-toggle, …)
   so there is only ever one source of truth for playback.
   ═══════════════════════════════════════════════════════════ */
function ccMiniNameOf(item, fallback){
  if(!item) return fallback;
  return item.name || item.title || item.label || fallback;
}
function ccMiniRefresh(){
  const M = window.Music;
  const mName = document.querySelector('[data-mini-name="music"]');
  if(mName){
    const i = (M && M.currentIndex != null) ? M.currentIndex : -1;
    const t = (M && Array.isArray(M.playlist) && i >= 0 && i < M.playlist.length) ? M.playlist[i] : null;
    mName.textContent = t ? ccMiniNameOf(t, 'Track ' + (i + 1)) : 'No tracks yet';
  }
  const mIcon = document.querySelector('[data-mini="music"] [data-mini-icon]');
  if(mIcon){
    const playing = !!(M && M.audio && !M.audio.paused);
    mIcon.className = 'bi ' + (playing ? 'bi-pause-fill' : 'bi-play-fill');
  }
  const vName = document.querySelector('[data-mini-name="video"]');
  if(vName){
    const list = (S.config && Array.isArray(S.config.videoPlaylist)) ? S.config.videoPlaylist : [];
    const i = (typeof videoCurrentPlaylistIndex === 'function') ? videoCurrentPlaylistIndex() : -1;
    const v = (i >= 0 && list[i]) ? list[i] : null;
    vName.textContent = v ? ccMiniNameOf(v, 'Video ' + (i + 1))
                          : (list.length ? 'No video open' : 'No videos yet');
  }
  const vIcon = document.querySelector('[data-mini="video"] [data-mini-icon]');
  if(vIcon){
    const ve = document.querySelector('#videoPanel video, #vpVideo, video.vp-video');
    vIcon.className = 'bi ' + (ve && !ve.paused ? 'bi-pause-fill' : 'bi-play-fill');
  }
  /* the little clocks — music and video alike */
  ['music','video'].forEach(function(kind){
    const t = document.querySelector('[data-mini-time="' + kind + '"]');
    if(!t) return;
    let el = (kind === 'music')
      ? ((M && M.audio) ? M.audio : null)
      : document.querySelector('#videoPanel video, #vpVideo, video.vp-video');
    const secs = (el && isFinite(el.currentTime)) ? Math.floor(el.currentTime) : 0;
    t.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  });
  /* the mini seek bars — read from the real players, so they never drift */
  ['music','video'].forEach(function(kind){
    const bar = document.querySelector('[data-mini-seekbar="' + kind + '"]');
    if(!bar) return;
    let el = null;
    if(kind === 'music') el = (M && M.audio) ? M.audio : null;
    else el = document.querySelector('#videoPanel video, #vpVideo, video.vp-video');
    const dur = (el && isFinite(el.duration) && el.duration > 0) ? el.duration : 0;
    const pct = dur ? Math.max(0, Math.min(100, (el.currentTime / dur) * 100)) : 0;
    bar.style.width = pct + '%';
  });

  /* the mini popups' playlist strips — repainted only when the list or the
     current row actually changed, so the 1.2s tick stays cheap */
  ['music','video'].forEach(function(k){
    const box = document.getElementById('ccMiniQueue-' + k);
    if(!box || box.closest('[hidden]')) return;
    const cfg = CC_MINI_LIST[k];
    if(!cfg) return;
    const stamp = (cfg.list() || []).length + ':' + cfg.index();
    if(box.dataset.stamp === stamp) return;
    box.dataset.stamp = stamp;
    ccMiniQueue(k);
  });

  /* keep the icons honest even when the panels are shut */
  ['music','video'].forEach(function(kind){
    const bar = document.querySelector('[data-act="mini-' + kind + '"] i');
    if(!bar) return;
    const on = (kind === 'music')
      ? !!(M && M.audio && !M.audio.paused)
      : !!(document.querySelector('#videoPanel video') && !document.querySelector('#videoPanel video').paused);
    bar.className = 'bi bi-' + (kind === 'music' ? 'music-note-beamed' : 'film') + (on ? ' cc-mini-on' : '');
  });
}

/* ═══════════════════════════════════════════════════════════
   MINI PLAYERS — an icon in the chapter bar opens a small popup,
   exactly like the utilities and notes buttons.
   ═══════════════════════════════════════════════════════════ */
const CC_MINI = {
  music: { title:'Music player', icon:'music-note-beamed', toggle:'mp-toggle', empty:'No tracks yet' },
  video: { title:'Video player', icon:'film',             toggle:'video-toggle', empty:'No videos yet' }
};
function ccMiniPos(kind){
  if(!S.config.ccMiniPos || typeof S.config.ccMiniPos !== 'object') S.config.ccMiniPos = {};
  const p = S.config.ccMiniPos[kind];
  return (p && typeof p.x === 'number' && typeof p.y === 'number') ? p : null;
}
function ccMiniPanel(kind){
  return document.getElementById('ccMini-' + kind);
}
function ccMiniBuild(kind){
  const c = CC_MINI[kind];
  const p = document.createElement('div');
  p.className = 'cc-mini-panel';
  p.id = 'ccMini-' + kind;
  p.hidden = true;
  const act = function(a, icon, title){
    return '<button type="button" class="cc-mini-btn" data-mini-click="' + a + '" title="' + title + '"><i class="bi bi-' + icon + '"></i></button>';
  };
  p.innerHTML =
      '<div class="cc-mini-head" data-mini-head="' + kind + '">'
    +   '<i class="bi bi-' + c.icon + ' cc-mini-ic"></i><span>' + c.title + '</span>'
    +   '<button type="button" class="cc-mini-x" data-mini-close="' + kind + '" title="Close">'
    +     '<svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div class="cc-mini-body">'
    +   '<div class="cc-mini-now" data-mini-name="' + kind + '">' + c.empty + '</div>'
    +   '<div class="cc-mini-seek" data-mini-seek="' + kind + '"><span data-mini-seekbar="' + kind + '"></span></div>'
    +   '<div class="cc-mini-queue" id="ccMiniQueue-' + kind + '"></div>'
    +   '<div class="cc-mini-row">'
    +     act(kind === 'music' ? 'mp-prev' : 'video-prev', 'skip-start-fill', kind === 'music' ? 'Previous track' : 'Previous video')
    +     '<button type="button" class="cc-mini-btn cc-mini-play" data-mini-click="' + c.toggle + '" title="Play / pause"><i class="bi bi-play-fill" data-mini-icon></i></button>'
    +     act(kind === 'music' ? 'mp-next' : 'video-next', 'skip-end-fill', kind === 'music' ? 'Next track' : 'Next video')
    +     '<span class="cc-mini-time" data-mini-time="' + kind + '">0:00</span>'
    +     '<span class="cc-mini-spacer"></span>'
    +   '</div>'
    + '</div>';
  document.body.appendChild(p);
  ccMiniPlace(kind);
  return p;
}
function ccMiniPlace(kind, anchor){
  const p = ccMiniPanel(kind); if(!p) return;
  const pos = ccMiniPos(kind);
  if(pos){
    p.style.left = Math.round(pos.x) + 'px';
    p.style.top  = Math.round(pos.y) + 'px';
    return;
  }
  /* no saved spot yet → open right under the icon that was clicked
     (a popup parked in the top-left corner looked broken) */
  const vw = window.innerWidth, vh = window.innerHeight;
  const w  = p.offsetWidth || 268;
  const h  = p.offsetHeight || 120;
  let left = 24, top = 96;
  if(anchor && anchor.getBoundingClientRect){
    const r = anchor.getBoundingClientRect();
    left = r.right - w;
    top  = r.bottom + 8;
  } else {
    left = (vw - w) / 2;
    top  = vh - h - 84;
  }
  left = Math.max(8, Math.min(left, vw - w - 8));
  top  = Math.max(48, Math.min(top, vh - h - 8));
  p.style.left = Math.round(left) + 'px';
  p.style.top  = Math.round(top) + 'px';
}
/* the mini popups carry the playlist strip, exactly like the full players */
const CC_MINI_LIST = {
  music: {
    list: function(){ return (window.Music && Array.isArray(Music.playlist)) ? Music.playlist : []; },
    index: function(){ return (window.Music && Music.currentIndex >= 0) ? Music.currentIndex : -1; },
    play: function(i){ if(typeof musicPlay === 'function') musicPlay(i); },
    empty: 'No tracks yet'
  },
  video: {
    list: function(){ return (S.config && S.config.videoPlaylist) || []; },
    index: function(){ return (typeof videoCurrentPlaylistIndex === 'function') ? videoCurrentPlaylistIndex() : -1; },
    play: function(i){ if(typeof playFromVideoPlaylist === 'function') playFromVideoPlaylist(i); },
    empty: 'No videos yet'
  }
};
function ccMiniQueue(kind){
  const box = document.getElementById('ccMiniQueue-' + kind);
  const cfg = CC_MINI_LIST[kind];
  if(!box || !cfg) return;
  const list = cfg.list() || [];
  const cur = cfg.index();
  if(!list.length){
    box.innerHTML = '<div class="cc-mini-qempty">' + cfg.empty + '</div>';
    return;
  }
  const from = Math.max(0, Math.min(Math.max(0, list.length - 5), (cur > 2 ? cur - 2 : 0)));
  box.innerHTML = list.slice(from, from + 5).map(function(t, i){
    const idx = from + i;
    const name = ccMiniNameOf(t, (kind === 'music' ? 'Track ' : 'Video ') + (idx + 1));
    return '<button type="button" class="cc-mini-q' + (idx === cur ? ' on' : '') + '" data-mini-queue="' + kind + '" data-mini-index="' + idx + '" title="' + esc(name) + '">'
      + '<i class="bi bi-' + (idx === cur ? 'play-fill' : 'music-note-beamed') + '"></i><span>' + esc(name) + '</span></button>';
  }).join('');
}
window.ccMiniQueue = ccMiniQueue;

function ccMiniToggle(kind, force, anchor){
  const p = ccMiniPanel(kind) || ccMiniBuild(kind);
  const open = (force !== undefined) ? force : p.hidden;
  if(open){
    ['music','video'].forEach(function(k){
      const o = ccMiniPanel(k);
      if(o && k !== kind) o.hidden = true;
    });
    p.hidden = false;
    ccMiniPlace(kind, anchor);
    ccMiniRefresh();
  } else {
    p.hidden = true;
  }
}
window.ccMiniToggle = ccMiniToggle;

/* drag the popup by its header — the same feel as the utilities panel */
document.addEventListener('pointerdown', function(e){
  const head = e.target.closest ? e.target.closest('[data-mini-head]') : null;
  if(!head || e.target.closest('button')) return;
  const kind = head.dataset.miniHead;
  const p = ccMiniPanel(kind); if(!p) return;
  const r = p.getBoundingClientRect();
  const drag = { dx:e.clientX - r.left, dy:e.clientY - r.top, w:r.width };
  try{ p.setPointerCapture(e.pointerId); }catch(err){}
  document.body.classList.add('nb-pub-moving');
  const move = function(ev){
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(drag.w, vw - 12);
    const x = Math.max(6, Math.min(ev.clientX - drag.dx, vw - w - 6));
    const y = Math.max(6, Math.min(ev.clientY - drag.dy, vh - 38));
    p.style.left = Math.round(x) + 'px';
    p.style.top  = Math.round(y) + 'px';
  };
  const end = function(){
    document.removeEventListener('pointermove', move, true);
    document.removeEventListener('pointerup', end, true);
    document.body.classList.remove('nb-pub-moving');
    const rr = p.getBoundingClientRect();
    if(!S.config.ccMiniPos) S.config.ccMiniPos = {};
    S.config.ccMiniPos[kind] = { x:Math.round(rr.left), y:Math.round(rr.top) };
    if(typeof save === 'function') save();
  };
  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', end, true);
  e.preventDefault();
}, true);
window.ccMiniRefresh = ccMiniRefresh;

document.addEventListener('click', function(e){
  const op = e.target.closest('[data-act="mini-music"], [data-act="mini-video"]');
  if(op){
    e.preventDefault(); e.stopPropagation();
    ccMiniToggle(op.dataset.act === 'mini-music' ? 'music' : 'video', undefined, op);
    return;
  }
  const sk = e.target.closest('[data-mini-seek]');
  if(sk){
    e.preventDefault(); e.stopPropagation();
    const kind = sk.dataset.miniSeek;
    const r = sk.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
    const el = (kind === 'music')
      ? (window.Music && Music.audio)
      : document.querySelector('#videoPanel video, #vpVideo, video.vp-video');
    if(el && isFinite(el.duration) && el.duration > 0) el.currentTime = el.duration * ratio;
    setTimeout(ccMiniRefresh, 40);
    return;
  }
  const q = e.target.closest('[data-mini-queue]');
  if(q){
    e.preventDefault(); e.stopPropagation();
    const kind = q.dataset.miniQueue, idx = parseInt(q.dataset.miniIndex, 10);
    const cfg = CC_MINI_LIST[kind];
    if(cfg && idx >= 0) cfg.play(idx);
    setTimeout(ccMiniRefresh, 80);
    return;
  }
  const cl = e.target.closest('[data-mini-close]');
  if(cl){ e.preventDefault(); e.stopPropagation(); ccMiniToggle(cl.dataset.miniClose, false); return; }
  const c = e.target.closest('[data-mini-click]');
  if(c){
    e.preventDefault(); e.stopPropagation();
    const real = document.querySelector('[data-act="' + c.dataset.miniClick + '"]');
    if(real) real.click();
    setTimeout(ccMiniRefresh, 60);
    return;
  }
}, true);

/* keep the names, clocks, seek bars, queues and play icons honest — while the
   chapter bar is on screen OR a mini popup is open (icon-only bars used to
   starve this loop, which is why the video popup showed no seek or playlist) */
setInterval(function(){
  if(document.hidden) return;
  if(document.querySelector('.cc-mini') || document.querySelector('.cc-mini-panel:not([hidden])')) ccMiniRefresh();
}, 1200);


// ═══════════════════════════════════════════════════════════
//   TOOLBAR
// ═══════════════════════════════════════════════════════════

function renderToolbar(){
  const tb = $('writeToolbar');
  if(!tb) return;

  const modeTools = MODE_TOOLS[S.mode] || [];

  // ── font list, grouped by family ──
  const groups = {};
  FONTS.forEach(f => { (groups[f.g] = groups[f.g] || []).push(f); });
  const fontGroupList = Object.keys(groups).map(g => ({
    label: g,
    items: groups[g].map(f => ({ value: f.name, label: f.name, font: f.f.replace(/"/g, '&quot;') }))
  }));

  // ── dropdown builder (declared here so it can never be out of scope) ──
  function tbDropdown(o){
    const gl = o.groups || [{ items: o.items || [] }];
    const list = gl.map(g =>
      (g.label ? `<div class="tb-drop-group">${g.label}</div>` : '') +
      g.items.map(it => `
        <button type="button" class="tb-drop-item${it.value === o.value ? ' active' : ''}"
                data-drop-item="${o.id}" data-value="${it.value}">
          <span${it.font ? ` style="font-family:${it.font}"` : ''}>${it.label}</span>
          <i class="bi bi-check2"></i>
        </button>`).join('')
    ).join('');

    return `
      <div class="tb-drop" data-drop="${o.id}">
        <button type="button" class="tb-drop-title" title="${o.title || ''}">
          <i class="bi bi-${o.icon}"></i>
          <span class="tb-drop-value">${o.valueLabel || o.value || ''}</span>
          <i class="bi bi-chevron-down tb-drop-caret"></i>
        </button>
        <div class="tb-drop-list">${list}</div>
      </div>`;
  }

  tb.innerHTML = `
    <div class="tb-group">
      ${tbDropdown({
        id:'font', icon:'fonts', title:'Font',
        value: S.config.font, valueLabel: S.config.font || 'Default',
        groups: fontGroupList
      })}
      <input type="number" class="tb-input" data-tb="fontSize" min="10" max="60" value="${S.config.fontSize}" title="Font size">
      <button class="tb-btn" data-tb="fontPlus"  title="Increase size"><i class="bi bi-plus"></i></button>
      <button class="tb-btn" data-tb="fontMinus" title="Decrease size"><i class="bi bi-dash"></i></button>
    </div>

    <div class="tb-group">
      ${tbDropdown({
        id:'heading', icon:'paragraph', title:'Block style',
        value:'p', valueLabel:'Paragraph',
        items:[
          { value:'p',          label:'Paragraph' },
          { value:'h1',         label:'H1' },
          { value:'h2',         label:'H2' },
          { value:'h3',         label:'H3' },
          { value:'h4',         label:'H4' },
          { value:'blockquote', label:'Quote' },
          { value:'pre',        label:'Code' }
        ]
      })}
    </div>

    <div class="tb-group">
      <button class="tb-btn" data-cmd="bold"          title="Bold (Ctrl+B)"><i class="bi bi-type-bold"></i></button>
      <button class="tb-btn" data-cmd="italic"        title="Italic (Ctrl+I)"><i class="bi bi-type-italic"></i></button>
      <button class="tb-btn" data-cmd="underline"     title="Underline (Ctrl+U)"><i class="bi bi-type-underline"></i></button>
      <button class="tb-btn" data-cmd="strikeThrough" title="Strikethrough"><i class="bi bi-type-strikethrough"></i></button>
      <button class="tb-btn" data-cmd="superscript"   title="Superscript"><i class="bi bi-superscript"></i></button>
      <button class="tb-btn" data-cmd="subscript"     title="Subscript"><i class="bi bi-subscript"></i></button>
    </div>

    <div class="tb-group">
      <label class="tb-swatch" data-swatch="color" title="Text colour">
        <input type="color" class="tb-color" data-tb="color" value="#111111">
        <span class="tb-swatch-fill" data-swatch-fill="color"></span>
      </label>
      <label class="tb-swatch" data-swatch="highlight" title="Highlight">
        <input type="color" class="tb-color" data-tb="highlight" value="#7c5cff">
        <span class="tb-swatch-fill" data-swatch-fill="highlight"></span>
      </label>
      <button class="tb-btn" data-cmd="removeFormat" title="Clear formatting"><i class="bi bi-eraser"></i></button>
    </div>

    <div class="tb-group">
      <button class="tb-btn" data-cmd="justifyLeft"   title="Align left"><i class="bi bi-text-left"></i></button>
      <button class="tb-btn" data-cmd="justifyCenter" title="Align centre"><i class="bi bi-text-center"></i></button>
      <button class="tb-btn" data-cmd="justifyRight"  title="Align right"><i class="bi bi-text-right"></i></button>
      <button class="tb-btn" data-cmd="justifyFull"   title="Justify"><i class="bi bi-text-paragraph"></i></button>
    </div>

    <div class="tb-group">
      <button class="tb-btn" data-cmd="insertUnorderedList" title="Bullet list"><i class="bi bi-list-ul"></i></button>
      <button class="tb-btn" data-cmd="insertOrderedList"   title="Numbered list"><i class="bi bi-list-ol"></i></button>
      <button class="tb-btn" data-cmd="outdent"             title="Outdent"><i class="bi bi-text-indent-left"></i></button>
      <button class="tb-btn" data-cmd="indent"              title="Indent"><i class="bi bi-text-indent-right"></i></button>
    </div>

    <!-- divider lives in the Shift + / panel now (Shift + @ · Insert · Rule) -->


      <button class="tb-btn tb-push-right" data-act="icon-lib" title="Icon library"><i class="bi bi-emoji-smile"></i></button>
    </div>
  `;
  paintSwatches();
}
// ═══════════════════════════════════════════════════════════
//   COMMANDS
// ═══════════════════════════════════════════════════════════

function runCmd(cmd, val){
  const ed = $('editor');
  if(!ed) return;
  ed.focus();
  restoreSel();
  try{ document.execCommand(cmd, false, val); }
  catch(e){ console.warn('cmd', cmd, e); }
  saveSel();
  onInput();
}

function insertHTML(html){
  const ed = $('editor');
  if(!ed) return;
  ed.focus();
  restoreSel();
  document.execCommand('insertHTML', false, html);
  saveSel();
  onInput();
}

// ═══════════════════════════════════════════════════════════
//   INPUT
// ═══════════════════════════════════════════════════════════

function onInput(){
  const ed = $('editor');
  if(!ed) return;
  const c = curCh();
  if(c) c.content = ed.innerHTML;
  updateCounts();
  scheduleSave();
  if(window.AI?.onEditorChange) window.AI.onEditorChange();
  sfPanePostEdit(ed);            // ← 3b: hand the edit to the main window
}


// ═══════════════════════════════════════════════════════════
//   MIXED FONTS (experimental) — three fonts, a word at a time
//   Word 1 wears font 1, word 2 font 2, word 3 font 3, then round again.
//   Choosing a font from the toolbar is untouched — that still sets the
//   selection's font normally.
// ═══════════════════════════════════════════════════════════

let mixedFontTurn = 0;
let mixedFontAnchor = null;   // text node + offset where the current unit started

function mixedFontList(){
  return (S.config.mixedFonts || []).filter(f => f && String(f).trim());
}

// the font's real CSS stack (FONTS carries it), so the word renders exactly
// like the same font picked from the toolbar
function mixedFontStack(name){
  const list = (typeof FONTS !== 'undefined' && Array.isArray(FONTS)) ? FONTS : [];
  const f = list.find(x => x.name === name);
  return f ? f.f : `'${name}', serif`;
}

/* Wrap [node start..end] in the given font without breaking the caret. */
function mixedFontWrap(node, from, to, fontName){
  const ed = $('editor');
  const sel = window.getSelection();
  if(!ed || !sel || !sel.rangeCount) return false;
  const r = sel.getRangeAt(0);
  if(!r.collapsed || r.startContainer !== node) return false;

  const word = document.createRange();
  word.setStart(node, from);
  word.setEnd(node, to);
  const span = document.createElement('span');
  span.style.fontFamily = mixedFontStack(fontName);
  try{ word.surroundContents(span); }
  catch(err){ return false; }

  const after = document.createRange();
  after.setStartAfter(span);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);
  saveSel();
  return true;
}

function mixedFontScope(){
  const s = S.config.mixedFontScope;
  return (s === 'sentence' || s === 'random' || s === 'letter') ? s : 'word';
}

/* Wrap every letter of [from..to] in its own span, each taking a random
   font from the three — the "letter randomisation" mode. */
function mixedFontWrapLetters(node, from, to){
  const ed = $('editor');
  const sel = window.getSelection();
  const fonts = mixedFontList();
  if(!ed || !node || !sel || !sel.rangeCount || !fonts.length) return false;
  const r = sel.getRangeAt(0);
  if(!r.collapsed || r.startContainer !== node) return false;
  const word = node.textContent.slice(from, to);
  if(!word) return false;

  const frag = document.createDocumentFragment();
  for(let i = 0; i < word.length; i++){
    const ch = word[i];
    if(/\s/.test(ch)){ frag.appendChild(document.createTextNode(ch)); continue; }
    const s = document.createElement('span');
    s.style.fontFamily = mixedFontStack(fonts[Math.floor(Math.random() * fonts.length)]);
    s.textContent = ch;
    frag.appendChild(s);
  }
  const last = frag.lastChild;

  const range = document.createRange();
  range.setStart(node, from);
  range.setEnd(node, to);
  try{
    range.deleteContents();
    range.insertNode(frag);
  }catch(err){ return false; }
  if(!last || !last.parentNode) return false;

  const after = document.createRange();
  after.setStartAfter(last);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);
  saveSel();
  return true;
}

/* Wrap the word that was just typed in the next font of the rotation. */
function mixedFontApply(){
  if(!S.config.expMixedFonts) return;
  const fonts = mixedFontList();
  if(!fonts.length) return;
  const ed = $('editor');
  if(!ed) return;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if(!r.collapsed) return;
  const node = r.startContainer;
  if(!node || node.nodeType !== 3 || !ed.contains(node)) return;

  const scope = mixedFontScope();

  // ── sentence mode: accumulate until the sentence ends, then restyle it ──
  if(scope === 'sentence'){
    const upto = node.textContent.slice(0, r.startOffset);
    const m = /([\p{L}\p{M}][\p{L}\p{M}\d''\-]*)$/u.exec(upto);
    if(!m) return;
    if(!mixedFontAnchor || mixedFontAnchor.node !== node){
      mixedFontAnchor = { node: node, start: r.startOffset - m[1].length };
    }
    const endsSentence = /[.!?…]["')\]]?\s*$/.test(upto);
    if(endsSentence){
      const start = Math.max(0, mixedFontAnchor.start);
      if(r.startOffset > start){
        mixedFontWrap(node, start, r.startOffset, fonts[mixedFontTurn % fonts.length]);
        mixedFontTurn++;
      }
      mixedFontAnchor = null;
    }
    return;
  }

  // ── word mode / random mode: wrap the word that just ended ──
  const upto = node.textContent.slice(0, r.startOffset);
  const m = /([\p{L}\p{M}][\p{L}\p{M}\d''\-]*)$/u.exec(upto);
  if(!m) return;

  // ── letter mode: each letter of the word takes a random font ──
  if(scope === 'letter'){
    if(mixedFontWrapLetters(node, r.startOffset - m[1].length, r.startOffset)){
      mixedFontTurn++;
    }
    return;
  }

  let font;
  if(scope === 'random'){
    font = fonts[Math.floor(Math.random() * fonts.length)];
  } else {
    font = fonts[mixedFontTurn % fonts.length];
  }
  if(mixedFontWrap(node, r.startOffset - m[1].length, r.startOffset, font)){
    mixedFontTurn++;
  }
}

const scheduleSave = debounce(() => {
  save();
  const el = $('sbSaved');
  if(el) el.textContent = 'Saved ' + new Date().toLocaleTimeString();
}, 900);

function updateCounts(){
  const ed = $('editor');
  if(!ed) return;
  if(window.updateStatusBar) window.updateStatusBar();
}

// ═══════════════════════════════════════════════════════════
//   CONTEXT MENU
// ═══════════════════════════════════════════════════════════

function onCtx(e){
  e.preventDefault();
  saveSel();
  let m = $('editCtx');
  if(m) m.remove();
  m = document.createElement('div');
  m.id = 'editCtx';
  m.style.cssText = `
    position:fixed;left:${e.clientX}px;top:${e.clientY}px;
    background:var(--surface-2);border:1px solid var(--line-2);
    border-radius:10px;padding:5px;min-width:200px;
    box-shadow:var(--e-3);z-index:300;
  `;
  m.innerHTML = `
    <button class="menu-item" data-cmd="bold"><i class="mi-icon bi bi-type-bold"></i>Bold</button>
    <button class="menu-item" data-cmd="italic"><i class="mi-icon bi bi-type-italic"></i>Italic</button>
    <button class="menu-item" data-cmd="underline"><i class="mi-icon bi bi-type-underline"></i>Underline</button>
    <div class="menu-sep"></div>
    <button class="menu-item" data-ai="fixGrammar"><i class="mi-icon bi bi-magic"></i>Fix grammar</button>
    <button class="menu-item" data-ai="translate"><i class="mi-icon bi bi-translate"></i>Translate</button>
    <button class="menu-item" data-ai="hinglishToHindi"><i class="mi-icon bi bi-translate"></i>Hinglish → हिन्दी</button>
    <button class="menu-item" data-ai="hinglishToEnglish"><i class="mi-icon bi bi-translate"></i>Hinglish → English</button>
    <button class="menu-item" data-ai="improve"><i class="mi-icon bi bi-stars"></i>Improve</button>
    ${S.config.expOrganize ? '<button class="menu-item" data-ai="organize"><i class="mi-icon bi bi-list-nested"></i>Organise my words</button>' : ''}
    ${S.page === 'manuscript' ? `
    <div class="menu-sep"></div>
    <button class="menu-item" data-ai="msChapterTitles"><i class="mi-icon bi bi-bookmark-fill"></i>Chapter titles</button>
    <button class="menu-item" data-ai="msChapterSubs"><i class="mi-icon bi bi-text-paragraph"></i>Chapter subtitles</button>
    <button class="menu-item" data-ai="msSubTitles"><i class="mi-icon bi bi-signpost-2"></i>Subchapter titles</button>
    <button class="menu-item" data-ai="msSubSubs"><i class="mi-icon bi bi-text-indent-left"></i>Subchapter subtitles</button>
    ` : ''}
    <div class="menu-sep"></div>
    <button class="menu-item" data-ins="link"><i class="mi-icon bi bi-link-45deg"></i>Insert link</button>
    <button class="menu-item" data-cmd="removeFormat"><i class="mi-icon bi bi-eraser"></i>Clear format</button>
  `;
  document.body.appendChild(m);
  const close = ev => { if(!m.contains(ev.target)){ m.remove(); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 10);
}

// ═══════════════════════════════════════════════════════════
//   ICON LIBRARY — picker
// ═══════════════════════════════════════════════════════════

const ICON_CATEGORIES = {
  'Popular': ['star','star-fill','heart','heart-fill','bookmark','bookmark-fill','lightning','lightning-fill','fire','check-circle','check-circle-fill','x-circle','info-circle','question-circle','exclamation-triangle','lightbulb','lightbulb-fill','emoji-smile','emoji-wink','emoji-heart-eyes'],
  'Arrows': ['arrow-up','arrow-down','arrow-left','arrow-right','arrow-up-right','arrow-down-right','chevron-up','chevron-down','chevron-left','chevron-right','arrow-return-left','arrow-return-right','arrow-repeat','arrow-clockwise','arrow-counterclockwise','caret-up','caret-down','caret-left','caret-right'],
  'Files': ['file','file-text','file-pdf','file-word','file-excel','file-ppt','file-zip','file-earmark','file-earmark-text','folder','folder-fill','folder-open','folder-plus','archive','inbox','save','download','upload'],
  'People': ['person','person-fill','person-circle','people','people-fill','person-badge','person-plus','person-check','emoji-smile','emoji-frown','hand-thumbs-up','hand-thumbs-down'],
  'Media': ['camera','camera-reels','camera-video','image','images','film','tv','music-note','music-note-beamed','headphones','speaker','volume-up','volume-mute','mic','mic-fill','play-circle','pause-circle','stop-circle','record-circle'],
  'Actions': ['pencil','pencil-fill','pencil-square','trash','trash-fill','plus','plus-circle','plus-square','dash','dash-circle','x','x-circle','check','check-lg','search','zoom-in','zoom-out','filter','sort-down','sort-up','shuffle','repeat'],
  'Communication': ['chat','chat-dots','chat-fill','chat-left-text','chat-left-quote','chat-square','chat-square-text','envelope','envelope-fill','send','send-fill','telephone','telephone-fill','bell','bell-fill','megaphone'],
  'UI': ['gear','sliders','list','grid','grid-3x3','layout-sidebar','layout-text-window','layout-text-sidebar','columns','layout-three-columns','fullscreen','arrows-fullscreen','arrows-angle-expand','arrows-angle-contract','dash-square','x-square','three-dots','three-dots-vertical'],
  'Nature': ['sun','sun-fill','moon','moon-fill','moon-stars','cloud','cloud-fill','cloud-rain','cloud-snow','snow','wind','droplet','droplet-fill','flower1','flower2','flower3','tree','tree-fill','globe','globe2','geo','geo-alt','geo-alt-fill','map','map-fill','compass','signpost','signpost-2'],
  'Time': ['clock','clock-fill','clock-history','calendar','calendar-event','calendar-check','calendar-plus','stopwatch','hourglass','hourglass-split','alarm','alarm-fill'],
  'Symbols': ['circle','circle-fill','square','square-fill','triangle','triangle-fill','diamond','diamond-fill','hexagon','hexagon-fill','star-half','heart-half','bookmark-star','bookmark-heart','bookmark-check','patch-check','shield-check','shield-fill','award','award-fill','trophy','trophy-fill','gem'],
  'Creative': ['palette','palette-fill','brush','brush-fill','pen','pen-fill','vector-pen','scissors','magic','wand','wand2','stars','sparkles','dribbble','behance','brush'],
  'Code': ['code','code-slash','code-square','braces','terminal','terminal-fill','filetype-js','filetype-py','filetype-html','filetype-css','filetype-json','filetype-yml','git','github','cpu','cpu-fill','hdd','hdd-fill','server'],
  'Books': ['book','book-fill','book-half','bookmark','bookmark-fill','journal','journal-text','journal-bookmark','journal-bookmark-fill','journals','newspaper','newspaper-fill','library','mortarboard','mortarboard-fill','pencil-square'],
  'Words': ['quote','type','type-bold','type-italic','type-underline','type-strikethrough','font','fonts','textarea','textarea-t','paragraph','text-paragraph','text-left','text-center','text-right','text-indent-left','text-indent-right','list-nested','list-ol','list-ul','list-check','check2-square','check2-all'],
  'Transport': ['car','car-fill','truck','airplane','airplane-fill','train','train-front','rocket','rocket-fill','bicycle','bus-front','taxi-front'],
  'Shapes': ['circle','circle-fill','square','square-fill','triangle','triangle-fill','pentagon','hexagon','octagon','diamond','star','star-fill','suit-club','suit-diamond','suit-heart','suit-spade','infinity','record-circle','bullseye','circle-half']
};

function openIconLibrary(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:760px;">
      <div class="modal-head">
        <h2><i class="bi bi-emoji-smile"></i> Icon library</h2>
        <button class="icon-btn" data-act="icon-close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <input class="tb-input" id="iconSearch" placeholder="Search icons..." style="width:100%;padding:10px 14px;font-size:13.5px;margin-bottom:14px;">
        <div id="iconGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(50px,1fr));gap:6px;max-height:400px;overflow-y:auto;padding:4px;"></div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  renderIconGrid('');
  $('iconSearch').addEventListener('input', e => renderIconGrid(e.target.value));
  $('iconSearch').focus();
}

function renderIconGrid(filter){
  const g = $('iconGrid');
  if(!g) return;
  g.innerHTML = '';
  const all = [];
  Object.entries(ICON_CATEGORIES).forEach(([cat, list]) => {
    list.forEach(icon => all.push({cat, icon}));
  });
  const filtered = filter
    ? all.filter(x => x.icon.includes(filter.toLowerCase()) || x.cat.toLowerCase().includes(filter.toLowerCase()))
    : all;
  const unique = [];
  const seen = new Set();
  filtered.forEach(x => { if(!seen.has(x.icon)){ seen.add(x.icon); unique.push(x); } });
  unique.slice(0, 300).forEach(x => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width:100%;aspect-ratio:1;border-radius:8px;
      background:var(--surface-2);border:1px solid var(--line);
      color:var(--ink-2);font-size:22px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:all 140ms;
    `;
    btn.title = x.icon;
    btn.innerHTML = `<i class="bi bi-${x.icon}"></i>`;
    btn.onmouseenter = () => { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; btn.style.borderColor = 'transparent'; btn.style.transform = 'scale(1.05)'; };
    btn.onmouseleave = () => { btn.style.background = 'var(--surface-2)'; btn.style.color = 'var(--ink-2)'; btn.style.borderColor = 'var(--line)'; btn.style.transform = ''; };
    btn.onclick = () => {
      insertHTML(`<i class="bi bi-${x.icon}"></i>`);
      closeModal();
      toast('Icon inserted');
    };
    g.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════════════════
//   FIND & REPLACE
// ═══════════════════════════════════════════════════════════

function frTarget(){
  const visible = function(el){ return !!(el && el.isContentEditable && el.offsetParent !== null); };
  const a = document.activeElement;
  if(visible(a)) return a;
  const nb = $('nbReaderBody');
  if(visible(nb)) return nb;
  const draft = $('draftBody');
  if(draft && draft.offsetParent !== null) return draft;
  const ed = $('editor');
  return (ed && ed.isContentEditable) ? ed : null;
}
function frEscape(q){ return String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function frIsArea(el){ return !!(el && el.tagName === 'TEXTAREA'); }
function frText(ed){
  if(!ed) return '';
  return frIsArea(ed) ? String(ed.value || '') : String(ed.innerText || ed.textContent || '');
}
function frCount(){
  const q = $('findInput') ? $('findInput').value : '';
  const el = $('findCount');
  if(!el) return;
  if(!q){ el.textContent = '0'; return; }
  const ed = frTarget();
  const t = frText(ed);
  const m = t.match(new RegExp(frEscape(q), 'gi'));
  el.textContent = m ? String(m.length) : '0';
}
function findNext(){ frStep(1); }
function findPrev(){ frStep(-1); }
/* walk the target's text for the next hit and select it (no window.find, which
   used to grab text anywhere on the page) */
function frStep(dir){
  const ed = frTarget(); const q = $('findInput') ? $('findInput').value : '';
  if(!ed || !q) return;
  const text = frText(ed);
  if(frIsArea(ed)){
    /* a textarea selects with the plain string API */
    const lower = text.toLowerCase(), needle = q.toLowerCase();
    const at = ed.selectionEnd || 0;
    let i = (dir > 0) ? lower.indexOf(needle, at) : lower.lastIndexOf(needle, Math.max(0, (ed.selectionStart || 0) - 1));
    if(i < 0) i = (dir > 0) ? lower.indexOf(needle) : lower.lastIndexOf(needle);
    if(i < 0){ if(typeof toast === 'function') toast('No matches', 'warn'); return; }
    ed.focus();
    ed.setSelectionRange(i, i + q.length);
    return;
  }
  const sel = window.getSelection();
  let idx = -1;
  const lower = text.toLowerCase(), needle = q.toLowerCase();
  if(dir > 0){
    let at = 0;
    if(sel && sel.rangeCount && ed.contains(sel.anchorNode)){
      const r = sel.getRangeAt(0);
      at = frOffsetOf(ed, r.endContainer, r.endOffset);
    }
    idx = lower.indexOf(needle, at);
    if(idx < 0) idx = lower.indexOf(needle);
  } else {
    let at = text.length;
    if(sel && sel.rangeCount && ed.contains(sel.anchorNode)){
      const r = sel.getRangeAt(0);
      at = frOffsetOf(ed, r.startContainer, r.startOffset);
    }
    idx = lower.lastIndexOf(needle, Math.max(0, at - 1));
    if(idx < 0) idx = lower.lastIndexOf(needle);
  }
  if(idx < 0){ if(typeof toast === 'function') toast('No matches', 'warn'); return; }
  const range = frRangeAt(ed, idx, idx + q.length);
  if(range){
    sel.removeAllRanges();
    sel.addRange(range);
    ed.focus();
  }
}
function frOffsetOf(root, node, offset){
  const r = document.createRange();
  r.selectNodeContents(root);
  try{ r.setEnd(node, offset); }catch(e){ return 0; }
  return r.toString().length;
}
function frRangeAt(root, start, end){
  let pos = 0, range = document.createRange(), started = false;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let n;
  while((n = walk.nextNode())){
    const len = n.nodeValue.length;
    if(!started && pos + len >= start){
      range.setStart(n, Math.max(0, start - pos));
      started = true;
    }
    if(started && pos + len >= end){
      range.setEnd(n, Math.max(0, end - pos));
      return range;
    }
    pos += len;
  }
  return started ? range : null;
}
function frReplaceSelected(withText){
  const ed = frTarget(); if(!ed) return false;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return false;
  const r = sel.getRangeAt(0);
  if(!ed.contains(r.startContainer)) return false;
  r.deleteContents();
  r.insertNode(document.createTextNode(withText));
  return true;
}
function replaceOne(){
  const q = $('findInput') ? $('findInput').value : '';
  const rep = $('replaceInput') ? $('replaceInput').value : '';
  if(!q) return;
  const ed = frTarget(); if(!ed) return;
  if(frIsArea(ed)){
    const picked = String(ed.value).slice(ed.selectionStart, ed.selectionEnd);
    if(picked.toLowerCase() === q.toLowerCase()){
      const a = ed.selectionStart;
      ed.setRangeText(rep, a, ed.selectionEnd, 'end');
      ed.dispatchEvent(new Event('input', { bubbles:true }));
      frCount();
    } else frStep(1);
    return;
  }
  const sel = window.getSelection();
  const picked = sel && sel.rangeCount && String(sel.toString()).toLowerCase() === q.toLowerCase();
  if(picked) frReplaceSelected(rep);
  else frStep(1);
  frSave(ed);
  frCount();
}
function replaceAll(){
  const q = $('findInput') ? $('findInput').value : '';
  const rep = $('replaceInput') ? $('replaceInput').value : '';
  if(!q) return;
  const ed = frTarget(); if(!ed) return;
  if(frIsArea(ed)){
    const hits = (String(ed.value).match(new RegExp(frEscape(q), 'gi')) || []).length;
    ed.value = String(ed.value).replace(new RegExp(frEscape(q), 'gi'), rep);
    ed.dispatchEvent(new Event('input', { bubbles:true }));
    frCount();
    if(typeof toast === 'function') toast(hits ? ('Replaced ' + hits) : 'No matches', hits ? 'ok' : 'warn');
    return;
  }
  let hits = 0;
  const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let n;
  while((n = walk.nextNode())) nodes.push(n);
  nodes.forEach(function(node){
    const rx = new RegExp(frEscape(q), 'gi');
    if(rx.test(node.nodeValue)){
      hits += (node.nodeValue.match(new RegExp(frEscape(q), 'gi')) || []).length;
      node.nodeValue = node.nodeValue.replace(new RegExp(frEscape(q), 'gi'), rep);
    }
  });
  frSave(ed);
  frCount();
  if(typeof toast === 'function') toast(hits ? ('Replaced ' + hits) : 'No matches', hits ? 'ok' : 'warn');
}
function frSave(ed){
  if(!ed) return;
  if(ed.id === 'editor' && typeof onInput === 'function'){ saveSel(); onInput(); return; }
  if(ed.id === 'nbReaderBody' && typeof nbFindCh === 'function'){
    const c = nbFindCh(D()._nbOpenCh);
    if(c){ c.content = ed.innerHTML; save(); }
    return;
  }
  if(ed.id === 'draftBody'){
    const d = (D().drafts || [])[_draftSel];
    if(d){ d.text = ed.value; save(); }
  }
}

/* A floating card, like every other panel in the app — it no longer depends on
   the write page being the one on screen, so it works in a book chapter too. */
function openFind(){
  const existing = $('findBar');
  if(existing){ existing.remove(); return; }
  const bar = document.createElement('div');
  bar.id = 'findBar';
  bar.className = '';          /* in-flow, under the toolbar — not a floating card */
  bar.innerHTML = ''
    + '<div class="find-row">'
    +   '<input type="text" id="findInput" placeholder="Find in this text…" autocomplete="off" spellcheck="false">'
    +   '<span id="findCount">0</span>'
    +   '<button type="button" class="find-nav" data-act="find-prev" title="Previous"><i class="bi bi-chevron-up"></i></button>'
    +   '<button type="button" class="find-nav" data-act="find-next" title="Next"><i class="bi bi-chevron-down"></i></button>'
    +   '<button type="button" class="find-x" data-act="find-close" title="Close">'
    +     '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div class="find-row">'
    +   '<input type="text" id="replaceInput" placeholder="Replace with…" autocomplete="off" spellcheck="false">'
    +   '<button type="button" class="find-btn" data-act="replace-one">Replace</button>'
    +   '<button type="button" class="find-btn find-btn-primary" data-act="replace-all">Replace all</button>'
    + '</div>';
  /* back where it lived before: inside the writing area, under the toolbar.
     If this page has no write-wrap (a book chapter, a draft), it falls back
     to the floating card so the feature is never unavailable. */
  const wrap = document.querySelector('.write-wrap');
  if(wrap && wrap.children[1]) wrap.insertBefore(bar, wrap.children[1]);
  else document.body.appendChild(bar);
  const qi = $('findInput');
  qi.focus();
  qi.addEventListener('input', frCount);
  qi.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); findNext(); }
    if(e.key === 'Escape'){ e.preventDefault(); bar.remove(); }
  });
  const ri = $('replaceInput');
  ri.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); replaceOne(); }
    if(e.key === 'Escape'){ e.preventDefault(); bar.remove(); }
  });
  frCount();
}

// ═══════════════════════════════════════════════════════════
//   GLOBAL EVENT WIRING
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;

  // Toolbar buttons
  const cmdEl = t.closest('[data-cmd]');
  if(cmdEl){ e.preventDefault(); runCmd(cmdEl.dataset.cmd); return; }

  const insEl = t.closest('[data-ins]');
  if(insEl){
    e.preventDefault();
    const k = insEl.dataset.ins;
    if(k === 'link'){ const u = prompt('URL:'); if(u) runCmd('createLink', u); return; }
    if(k === 'image'){ const u = prompt('Image URL:'); if(u) insertHTML(`<img src="${esc(u)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); return; }
    if(k === 'table'){
      const r = parseInt(prompt('Rows:', '3')) || 3;
      const c = parseInt(prompt('Columns:', '3')) || 3;
      let h = '<table style="border-collapse:collapse;width:100%;margin:12px 0;">';
      for(let i = 0; i < r; i++){ h += '<tr>'; for(let j = 0; j < c; j++) h += '<td style="border:1px solid var(--line-2);padding:8px;">&nbsp;</td>'; h += '</tr>'; }
      h += '</table><p></p>';
      insertHTML(h); return;
    }
    if(k === 'callout'){ insertHTML('<div style="border-left:3px solid var(--accent);padding:10px 14px;background:var(--surface-2);border-radius:6px;margin:12px 0;"><strong>Note:</strong> </div>'); return; }
    if(k === 'emoji'){ insertHTML('😀'); return; }
    if(INSERTS[k]){ insertHTML(INSERTS[k]); return; }
  }

  // Find
  if(t.closest('[data-act="find-open"]')){ e.preventDefault(); openFind(); return; }
  if(t.closest('[data-act="find-close"]')){ e.preventDefault(); $('findBar')?.remove(); return; }
  if(t.closest('[data-act="find-next"]')){ e.preventDefault(); findNext(); return; }
  if(t.closest('[data-act="find-prev"]')){ e.preventDefault(); findPrev(); return; }
  if(t.closest('[data-act="replace-one"]')){ e.preventDefault(); replaceOne(); return; }
  if(t.closest('[data-act="replace-all"]')){ e.preventDefault(); replaceAll(); return; }

  // Page shortcuts — Notes · Notebook
  const goEl = t.closest('[data-act="go-page"]');
  if(goEl){
    e.preventDefault();
    const p = goEl.dataset.page;
    if(p && typeof goPage === 'function') goPage(p);
    return;
  }

  // Icon library
  if(t.closest('[data-act="icon-lib"]')){ e.preventDefault(); openIconLibrary(); return; }
  if(t.closest('[data-act="icon-close"]')){ closeModal(); return; }

    // Font size buttons
  const tbEl = t.closest('[data-tb]');
  if(tbEl){
    if(tbEl.dataset.tb === 'fontPlus'){ e.preventDefault(); setFontSize((S.config.fontSize || 17) + 1); return; }
    if(tbEl.dataset.tb === 'fontMinus'){ e.preventDefault(); setFontSize((S.config.fontSize || 17) - 1); return; }
  }

  // Toolbar dropdowns (Font · Block style)
  const dropTitle = t.closest('.tb-drop-title');
  if(dropTitle){
    e.preventDefault();
    const drop = dropTitle.closest('.tb-drop');
    const wasOpen = drop.classList.contains('open');
    document.querySelectorAll('.tb-drop.open').forEach(d => d.classList.remove('open'));
    if(!wasOpen) drop.classList.add('open');
    return;
  }
  const dropItem = t.closest('.tb-drop-item');
  if(dropItem){ e.preventDefault(); pickDropItem(dropItem); return; }
}, true);


document.addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.tb === 'fontSize'){ setFontSize(parseInt(t.value) || 17); return; }
});
// Handle a pick in a toolbar dropdown
function pickDropItem(btn){
  const drop = btn.closest('.tb-drop');
  const id = btn.dataset.dropItem;
  const val = btn.dataset.value;

  // Reflect the choice on the button + the row you clicked
  drop.querySelectorAll('.tb-drop-item').forEach(x => x.classList.toggle('active', x === btn));
  const shown = drop.querySelector('.tb-drop-value');
  if(shown) shown.textContent = btn.querySelector('span').textContent;
  drop.classList.remove('open');

  if(id === 'font'){ S.config.font = val; applyFont(); save(); return; }
  if(id === 'heading'){ runCmd('formatBlock', val); return; }
}

// Close open dropdowns on outside click — bound once, not per render
if(!document.__tbDropBound){
  document.__tbDropBound = true;
  document.addEventListener('click', e => {
    if(e.target.closest('.tb-drop')) return;
    document.querySelectorAll('.tb-drop.open').forEach(d => d.classList.remove('open'));
  });
}

// Keep the editor selection alive when the click lands on the dropdown
document.addEventListener('mousedown', e => {
  if(e.target.closest('.tb-drop-title, .tb-drop-item')) saveSel();
}, true);

/* paint the chip itself — the native colour input is invisible behind it */
function paintSwatches(){
  document.querySelectorAll('.tb-color').forEach(function(inp){
    const key = inp.dataset.tb;
    const fill = document.querySelector('[data-swatch-fill="' + key + '"]');
    if(fill) fill.style.background = inp.value;
  });
}
window.paintSwatches = paintSwatches;

document.addEventListener('input', e => {
  const t = e.target;
  if(t.dataset.tb === 'color'){ paintSwatches(); runCmd('foreColor', t.value); return; }
  if(t.dataset.tb === 'highlight'){ paintSwatches(); runCmd('hiliteColor', t.value); return; }
});

function applyFont(){
  const f = S.config.font;
  if(!f) return;
  /* in split screen this lands on the half you clicked in — and stays there */
  if(window.ScriptForgeSplit && ScriptForgeSplit.isOpen()){ ScriptForgeSplit.paneStyleChanged(); return; }
  const ed = $('editor');
  if(ed) ed.style.fontFamily = `'${f}', serif`;
}

function setFontSize(px){
  px = Math.max(10, Math.min(60, px));
  S.config.fontSize = px;
  if(window.ScriptForgeSplit && ScriptForgeSplit.isOpen()){
    const inp0 = document.querySelector('[data-tb="fontSize"]'); if(inp0) inp0.value = px;
    ScriptForgeSplit.paneStyleChanged();
    return;
  }
  const ed = $('editor');
  if(ed) ed.style.fontSize = px + 'px';
  const inp = document.querySelector('[data-tb="fontSize"]');
  if(inp) inp.value = px;
  save();
}

// Keyboard
document.addEventListener('keydown', e => {
  const ed = $('editor');
  if(!ed) return;
  const inEd = document.activeElement === ed || ed.contains(document.activeElement);
  if(e.key === 'Tab' && inEd){ e.preventDefault(); document.execCommand('insertText', false, '    '); return; }
  const ctrl = e.ctrlKey || e.metaKey;
  if(!ctrl) return;
  const k = e.key.toLowerCase();
  if(k === 's'){ e.preventDefault(); save(); toast('Saved'); return; }
  if(k === 'f'){ e.preventDefault(); openFind(); return; }
  if(k === 'i' && !e.shiftKey){ e.preventDefault(); if(window.toggleAIPanel) window.toggleAIPanel(); return; }
  if(inEd){
    if(k === 'b'){ e.preventDefault(); runCmd('bold'); }
    if(k === 'i'){ e.preventDefault(); runCmd('italic'); }
    if(k === 'u'){ e.preventDefault(); runCmd('underline'); }
  }
});

// ═══════════════════════════════════════════════════════════
//   EXPORT
// ═══════════════════════════════════════════════════════════

window.WRITE = WRITE;
window.runCmd = runCmd;
window.insertHTML = insertHTML;
window.saveSel = saveSel;
window.restoreSel = restoreSel;
window.openFind = openFind;
window.findNext = findNext;
window.findPrev = findPrev;
window.replaceOne = replaceOne;
window.replaceAll = replaceAll;
window.openIconLibrary = openIconLibrary;
window.INSERTS = INSERTS;
window.MODE_TOOLS = MODE_TOOLS;
window.onInput = onInput;
window.updateCounts = updateCounts;

console.log('%c ✓ write.js loaded', 'color:#10b981;font-weight:600;');

// ═══ SCREENWRITING KEYBOARD — Enter advances the element, Tab cycles it ═══
const SF_ORDER = ['scene-heading','action','character-name','parenthetical','dialogue','transition'];
const SF_NEXT  = {
  'scene-heading':'action', 'action':'action',
  'character-name':'dialogue', 'parenthetical':'dialogue',
  'dialogue':'dialogue', 'transition':'action'
};

function sfScriptMode(){ return S.mode === 'screenplay' || S.mode === 'tv' || S.mode === 'stage'; }

/* the editables the element menu can work on: the write editor and a
   book chapter / scene while it is open for editing in the reader pane */
function sfEditables(){
  const out = [];
  const ed = $('editor');       if(ed) out.push(ed);
  const nb = $('nbReaderBody');  if(nb && nb.isContentEditable) out.push(nb);
  return out;
}
function sfActiveEd(){
  const list = sfEditables();
  const sel = window.getSelection();
  const node = (sel && sel.rangeCount) ? sel.anchorNode : null;
  if(node) for(let i = 0; i < list.length; i++) if(list[i].contains(node)) return list[i];
  return sfVisibleEd() || list[0] || null;
}
/* the editable that is actually on screen right now */
function sfVisibleEd(){
  const list = sfEditables();
  for(let i = 0; i < list.length; i++){
    if(list[i].getClientRects && list[i].getClientRects().length) return list[i];
  }
  return null;
}
/* the editable the caret is actually inside right now, or null */
function sfInEditable(){
  const ed = sfActiveEd(); if(!ed) return null;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return null;
  return ed;
}
function sfCurBlock(){
  const ed = sfActiveEd(); if(!ed) return null;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return null;
  let n = sel.anchorNode;
  if(n && n.nodeType === 3) n = n.parentNode;
  while(n && n.parentNode && n.parentNode !== ed) n = n.parentNode;
  return (n && n !== ed) ? n : null;
}
function sfBlockType(el){
  const c = String((el && el.className) || '');
  for(let i = 0; i < SF_ORDER.length; i++) if(c.indexOf(SF_ORDER[i]) !== -1) return SF_ORDER[i];
  return 'action';
}
/* ═══ Shift + @ — the element menu ═══
   Screenplay: Scene heading · Action · Character · Parenthetical · Dialogue · Transition
   Novel:      Paragraph · Heading 1-3 · Quote · Scene break                    */
/* a `null` in the list is a divider */
const SF_MENU_SCRIPT = [
  ['scene-heading','Scene heading','camera-reels'],
  ['action','Action','lightning'],
  ['character-name','Character','person'],
  null,
  ['parenthetical','Parenthetical','chat-quote'],
  ['dialogue','Dialogue','chat-dots'],
  null,
  ['transition','Transition','arrow-right-square']
];
const SF_MENU_PROSE = [
  ['p','Paragraph','paragraph'],
  ['h1','Chapter title','type-h2'],
  ['h2','Section head','type-h2'],
  ['h3','Sub-section','type-h2'],
  ['blockquote','Quote','quote'],
  ['epigraph','Epigraph','bookmark-star'],
  ['break','Scene break','three-dots']
];

function sfMenuEl(){
  let m = document.getElementById('sfElemMenu');
  if(!m){
    m = document.createElement('div');
    m.id = 'sfElemMenu';
    m.className = 'sf-elem-menu';
    m.hidden = true;
    document.body.appendChild(m);
  }
  return m;
}
function sfMenuClose(){
  const m = document.getElementById('sfElemMenu');
  if(m) m.hidden = true;
}

function sfOpenMenu(target){
  const ed = target || sfActiveEd();
  if(!ed) return;
  const script = sfScriptMode();
  const items = script ? SF_MENU_SCRIPT : SF_MENU_PROSE;
  const block = sfCurBlock();
  const curTag = block ? String(block.tagName || '').toLowerCase() : '';
  const cur = script ? sfBlockType(block) : curTag;

  const m = sfMenuEl();
  m.innerHTML = '<div class="sf-elem-head">' + (script ? 'Screenplay element' : 'Paragraph style')
      + '<span class="sf-elem-hint">↑↓ · Enter</span></div>'
    + items.map(function(it){
        if(!it) return '<span class="sf-elem-sep"></span>';
        return '<button type="button" class="sf-elem-item' + (it[0] === cur ? ' on' : '') + '" data-sf-elem="' + it[0] + '">'
          + '<i class="bi bi-' + it[2] + '"></i><span>' + it[1] + '</span></button>';
      }).join('');
  m.hidden = false;

  /* park it under the caret */
  let rect = null;
  const sel = window.getSelection();
  if(sel && sel.rangeCount){
    const r = sel.getRangeAt(0).getBoundingClientRect();
    if(r && (r.width || r.height)) rect = r;
  }
  if(!rect){
    const r = ed.getBoundingClientRect();
    rect = { left:r.left + 28, top:r.top + 70, bottom:r.top + 94 };
  }
  const mw = m.offsetWidth  || 220;
  const mh = m.offsetHeight || 200;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - mw - 12));
  const top = (rect.bottom + 8 + mh > window.innerHeight) ? Math.max(8, rect.top - mh - 8) : rect.bottom + 8;
  m.style.left = Math.round(left) + 'px';
  m.style.top  = Math.round(top) + 'px';
  sfMenuMove(0);
}
window.sfOpenMenu = sfOpenMenu;

/* ── the menu is fully usable from the keyboard: ↑ ↓ move, Enter applies ── */
function sfMenuButtons(){
  const m = document.getElementById('sfElemMenu');
  return m ? Array.prototype.slice.call(m.querySelectorAll('.sf-elem-item')) : [];
}
function sfMenuMove(step){
  const b = sfMenuButtons(); if(!b.length) return;
  let i = b.findIndex(function(x){ return x.classList.contains('sf-elem-active'); });
  if(i < 0) i = b.findIndex(function(x){ return x.classList.contains('on'); });
  if(i < 0) i = 0;
  i = (i + step + b.length) % b.length;
  b.forEach(function(x){ x.classList.remove('sf-elem-active'); });
  b[i].classList.add('sf-elem-active');
  if(b[i].scrollIntoView) b[i].scrollIntoView({ block:'nearest' });
}
function sfMenuCurrent(){
  const b = sfMenuButtons(); if(!b.length) return null;
  return b.find(function(x){ return x.classList.contains('sf-elem-active'); })
      || b.find(function(x){ return x.classList.contains('on'); }) || b[0];
}
/* the mouse highlights what it is over, so ↑ ↓ continue from there */
document.addEventListener('mousemove', function(e){
  const m = document.getElementById('sfElemMenu');
  if(!m || m.hidden) return;
  const it = e.target && e.target.closest ? e.target.closest('.sf-elem-item') : null;
  if(!it) return;
  sfMenuButtons().forEach(function(x){ x.classList.toggle('sf-elem-active', x === it); });
}, true);

/* keep the caret while an option is pressed */
document.addEventListener('mousedown', function(e){
  if(e.target.closest('.sf-elem-menu')) e.preventDefault();
}, true);

document.addEventListener('click', function(e){
  const it = e.target.closest('[data-sf-elem]');
  if(!it) return;
  e.preventDefault();
  const val = it.dataset.sfElem;
  sfApply(val);
  sfMenuClose();
}, true);

/* put the block into the chosen element / paragraph style — in whichever
   editable it lives (editor, or a book chapter open for editing) */
function sfApply(val){
  const ed = sfActiveEd(); if(!ed) return;
  const book = ed.id === 'nbReaderBody';
  const b    = sfCurBlock();

  /* screenplay: scene heading · action · character · paren · dialogue · transition */
  if(sfScriptMode() && val !== 'break'){
    if(b) sfSetType(b, val);
    if(book) ed.dispatchEvent(new Event('input', { bubbles:true }));
    else saveSel();
    return;
  }

  /* scene break */
  if(val === 'break'){
    if(book){
      const p  = document.createElement('p'); p.className = 'scene-break'; p.textContent = '* * *';
      const af = document.createElement('p'); af.innerHTML = '<br>';
      if(b && b.parentNode){
        b.parentNode.insertBefore(p, b.nextSibling);
        b.parentNode.insertBefore(af, p.nextSibling);
      } else { ed.appendChild(p); ed.appendChild(af); }
      ed.dispatchEvent(new Event('input', { bubbles:true }));
    } else {
      insertHTML(INSERTS.sceneBreak + '<p><br></p>');
    }
    return;
  }

  /* novel styles inside a book chapter */
  if(book){
    if(!b) return;
    const tag = (val === 'blockquote' || val === 'epigraph') ? 'p' : val;
    if(String(b.tagName || '').toLowerCase() === tag && val !== 'blockquote' && val !== 'epigraph') return;
    const nn = document.createElement(tag);
    nn.innerHTML = b.innerHTML;
    if(val === 'epigraph')       nn.className = 'epigraph';
    else if(val === 'blockquote') nn.className = 'quote';
    b.parentNode.replaceChild(nn, b);
    const r = document.createRange(); r.selectNodeContents(nn); r.collapse(false);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    ed.dispatchEvent(new Event('input', { bubbles:true }));
    return;
  }

  /* novel styles in the write editor */
  if(val === 'blockquote' || val === 'epigraph'){
    runCmd('formatBlock', '<blockquote>');
    const nb = sfCurBlock();
    if(nb){
      nb.classList.remove('epigraph','quote');
      nb.classList.add(val === 'epigraph' ? 'epigraph' : 'quote');
      saveSel();
    }
    return;
  }
  runCmd('formatBlock', '<' + val + '>');
}
window.sfApply = sfApply;

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') sfMenuClose();
}, true);

function sfSetType(el, t){
  el.className = String(el.className || '')
    .replace(/\b(scene-heading|action|character-name|parenthetical|dialogue|transition)\b/g, '')
    .trim() + ' ' + t;
}

document.addEventListener('keydown', e => {
  /* Shift + @ — tolerant of keyboard-layout variants */
  const atKey = (e.key === '@') || (e.key === '2' && e.shiftKey) || (e.code === 'Digit2' && e.shiftKey);

  /* while the element menu is open it owns the keyboard */
  const menu = document.getElementById('sfElemMenu');
  if(menu && !menu.hidden){
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); sfMenuClose(); return; }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); e.stopPropagation();
      sfMenuMove(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if(e.key === 'Enter' || e.key === 'Tab'){
      const it = sfMenuCurrent();
      e.preventDefault(); e.stopPropagation();
      if(it){ sfApply(it.dataset.sfElem); sfMenuClose(); }
      return;
    }
    if(atKey){ e.preventDefault(); e.stopPropagation(); return; }   /* stays open — Esc closes */
  }
  const ed = sfInEditable();
  if(!ed){
    /* the caret isn't in an editable — Shift + @ still opens the menu
       whenever one is on screen (e.g. a chapter opened for editing) */
    const vis = sfVisibleEd();
    if(atKey && vis){
      e.preventDefault(); e.stopPropagation();
      sfOpenMenu(vis);
    }
    return;
  }
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return;

  /* Ctrl/⌘+Enter → scene break in prose modes (the novel "equivalent") */
  if(!sfScriptMode()){
    if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      e.preventDefault(); e.stopPropagation();
      insertHTML(INSERTS.sceneBreak + '<p><br></p>');
      return;
    }
    /* novel: ⌘/Ctrl + 1-3 → Heading 1-3, ⌘/Ctrl + 0 → back to paragraph */
    if((e.ctrlKey || e.metaKey) && /^[0-3]$/.test(e.key)){
      e.preventDefault(); e.stopPropagation();
      runCmd('formatBlock', e.key === '0' ? '<p>' : '<h' + e.key + '>');
      return;
    }
    /* Shift + @ → the same element menu, carrying the prose options */
    if(atKey){
      e.preventDefault(); e.stopPropagation();
      sfOpenMenu();
      return;
    }
    return;
  }

  /* screenplay: ⌘/Ctrl + 1-6 → set the element outright, same as the buttons */
  if((e.ctrlKey || e.metaKey) && /^[1-6]$/.test(e.key)){
    const b = sfCurBlock();
    if(b){
      e.preventDefault(); e.stopPropagation();
      sfSetType(b, SF_ORDER[parseInt(e.key, 10) - 1]);
      saveSel();
      return;
    }
  }

  const block = sfCurBlock();
  const type  = sfBlockType(block);
  const empty = !String(block ? block.textContent : '').trim();

  /* Shift + @ → the element menu: Scene heading · Action · Character · Paren · Dialogue · Transition */
  if(atKey){
    e.preventDefault(); e.stopPropagation();
    sfOpenMenu();
    return;
  }

  /* Tab — cycle the element: Scene → Action → Character → Paren → Dialogue → Transition */
  if(e.key === 'Tab'){
    e.preventDefault(); e.stopPropagation();
    if(!block) return;
    const i = SF_ORDER.indexOf(type);
    sfSetType(block, SF_ORDER[(i + 1) % SF_ORDER.length]);
    saveSel();
    return;
  }

  /* Enter — new line in the RIGHT element type */
  if(e.key === 'Enter' && !e.shiftKey){
    let next = SF_NEXT[type] || 'action';
    if(type === 'dialogue'       && empty) next = 'character-name';   /* empty line → next speaker */
    if(type === 'character-name' && empty) next = 'action';           /* empty name → back to action */
    setTimeout(() => {
      const b = sfCurBlock();
      if(b && b !== block) sfSetType(b, next);
      saveSel();
    }, 0);
  }
}, true);


/* ═══════════════════════════════════════════════════════════════
   Chapter / Subchapter → tb-drop
   Wraps the native selects so they look like Font / Block.
   The <select> is never removed — it still holds the value and
   still fires 'change', so all existing code keeps working.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  const SCOPE = '.write-wrap';       // ← if nothing shows up, change to 'body'
  const SEL   = 'select.tb-select';  // ← the chapter + subchapter selects
  const ICON  = { chapter:'bookmark', subchapter:'signpost-2' };

  let seq = 0;
  const esc2 = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ── markup for one dropdown ──
  function markup(sel, id, icon){
    const opts  = Array.from(sel.options).filter(o => o.value !== '');
    const cur   = sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : '';
    const empty = opts.length === 0;

    return `
      <button type="button" class="tb-drop2-title" ${empty ? 'disabled' : ''}>
        <i class="bi bi-${icon}"></i>
        <span class="tb-drop2-value">${esc2(empty ? 'No subchapters' : cur)}</span>
        <i class="bi bi-chevron-down tb-drop2-caret"></i>
      </button>
      <div class="tb-drop2-list">
        ${opts.map(o => `
          <button type="button" class="tb-drop2-item${o.value === sel.value ? ' active' : ''}"
                  data-pick="${id}" data-value="${esc2(o.value)}">
            <span>${esc2(o.textContent)}</span><i class="bi bi-check2"></i>
          </button>`).join('')}
      </div>`;
  }

  // ── 1. wrap any select that isn't wrapped yet ──
  function upgrade(){
    document.querySelectorAll(SCOPE + ' ' + SEL + ':not([data-upped])').forEach(sel => {
      const id = sel.dataset.tb || sel.id || (seq++ === 0 ? 'chapter' : 'subchapter');
      sel.dataset.upped = id;
      sel.classList.add('tb-native-hidden');

      const drop = document.createElement('div');
      drop.className = 'tb-drop';
      drop.dataset.pick = id;
      drop.dataset.icon = ICON[id] || 'bookmark';
      drop.innerHTML = markup(sel, id, drop.dataset.icon);

      sel.insertAdjacentElement('afterend', drop);
    });
  }

  // ── 2. refresh labels/options when the app re-renders ──
  function sync(){
    document.querySelectorAll(SCOPE + ' .tb-drop[data-pick]').forEach(drop => {
      const sel = drop.previousElementSibling;
      if(!sel || sel.tagName !== 'SELECT'){ drop.remove(); return; }
      const html = markup(sel, drop.dataset.pick, drop.dataset.icon);
      if(drop.__html !== html){ drop.__html = html; drop.innerHTML = html; }
    });
  }

  // ── 3. open / pick / close ──
  document.addEventListener('click', e => {
    const title = e.target.closest('.tb-drop2-title');
    if(title){
      const drop = title.closest('.tb-drop[data-pick]');
      if(!drop) return;
      e.preventDefault();
      if(title.disabled) return;
      const wasOpen = drop.classList.contains('open');
      document.querySelectorAll('.tb-drop.open').forEach(d => d.classList.remove('open'));
      drop.classList.toggle('open', !wasOpen);
      return;
    }

    const item = e.target.closest('.tb-drop2-item[data-pick]');
    if(item){
      const drop = item.closest('.tb-drop');
      const sel  = drop.previousElementSibling;
      e.preventDefault();
      drop.classList.remove('open');
      if(sel && sel.tagName === 'SELECT'){
        sel.value = item.dataset.value;
        // let the app's own change handler run, untouched
        sel.dispatchEvent(new Event('change', { bubbles:true }));
      }
      sync();
      return;
    }

    if(!e.target.closest('.tb-drop[data-pick]')){
      document.querySelectorAll('.tb-drop[data-pick].open').forEach(d => d.classList.remove('open'));
    }
  });

  // ── 4. re-run after any re-render (busy-flag prevents a loop) ──
  let raf = 0, busy = false;
  function run(){ if(busy) return; busy = true; try{ upgrade(); sync(); } finally { setTimeout(() => busy = false, 0); } }
  function schedule(){ if(raf) return; raf = requestAnimationFrame(() => { raf = 0; run(); }); }

  new MutationObserver(muts => {
    if(busy) return;
    for(const m of muts){
      if(m.target.nodeType === 1 && m.target.closest('#editor')) continue;  // ignore typing
      schedule(); return;
    }
  }).observe(document.body, { childList:true, subtree:true });

  run();
})();

/* ── Chapter controls: working buttons + dropdown switching ── */
document.addEventListener('click', function(e){
  // Section creation (and the dropdown switching) lives in chapter-buttons.js,
  // which names things per mode — Chapter/Subchapter, or Scene/Subscene in
  // screenplay. A second handler here used to fire the same click as well, so
  // one press of "new chapter" created two sections ("Chapter 2" + "Chapter 1").
}, true);

document.addEventListener('change', function(e){
  const t = e.target;
  if(!t || t.tagName !== 'SELECT') return;
  if(!t.matches('[data-chapter-select], [data-subchapter-select]')) return;
  if(!t.value) return;
  if($('editor') && typeof onInput === 'function') onInput();
  D().currentChapter = t.value;
  save(); goPage('write');
});
