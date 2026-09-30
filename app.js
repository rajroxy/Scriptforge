/* ═══════════════════════════════════════════════════════════
   app.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · app.js
     · pages-fix.js
     · no-pager.js
     · plugin-panels.js
     · ai-extras.js
     · autosave.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ app.js ══════════ */
// Add to boot() in app.js, or just paste these lines at the end:

// Wire corner buttons + logo + pages
// Open Project — opens the editor for a project. Declared as a callable so the
// recent-project rows can open a project on double-click as well.
function openProjectById(pid){
  const d = D();
  let proj = (d.projects || []).find(p => p.id === pid);
  if(!proj){
    Object.keys(S.modes || {}).some(function(modeId){
      const found = ((S.modes[modeId] && S.modes[modeId].projects) || []).find(p => p.id === pid);
      if(found){ proj = found; return true; }
      return false;
    });
  }
  if(!proj){ console.warn('[open-project] not found:', pid); return; }

  // Set the mode to match the project
  if(proj.mode && proj.mode !== S.mode){
    S.mode = proj.mode;
    document.body.setAttribute('data-writing-mode', proj.mode);
  }

  // Make sure the mode data bucket exists
  if(!S.modes[S.mode]) S.modes[S.mode] = freshModeData();
  const md = S.modes[S.mode];

  // Every project owns its own Views · Reference · Workflow data
  if(!proj.chapters || !proj.chapters.length){
    proj.chapters = [{ id: uid(), title: 'Chapter 1', content: '', children: [], collapsed: false }];
  }
  /* every project's own Views · Reference · Workflow (chapters, drafts,
     ideas, notes, beats, references, timeline, bible, kanban) */
  useProjectData(proj);
  md.currentChapter = proj.chapters[0].id;

  save();

  // Close the panels
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof hideInfoPanel === 'function') hideInfoPanel();

  // Novel projects keep the Idea landing page; screenplay projects open the
  // actual Script surface (the manuscript page is its script implementation).
  if(typeof renderModePills === 'function') renderModePills();
  if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
  goPage(S.mode === 'screenplay' ? 'manuscript' : 'inspire');

  toast('Opened: ' + proj.name);
}

document.addEventListener('click', e => {
  const t = e.target;

    // Dropdown: Menu → toggle modes panel
  if(t.closest('[data-act="open-menu"]')){
    e.preventDefault();
    document.getElementById('logoDrop')?.classList.remove('open');
    const panel = document.getElementById('modesPanel');
    const isOpen = panel && panel.classList.contains('open');
    if(isOpen){
      if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
    } else {
      if(typeof renderModesPanel === 'function') renderModesPanel();
      if(typeof toggleModesPanel === 'function') toggleModesPanel(true);
    }
    return;
  }

  // Click outside logo-wrap → close dropdown
  if(!t.closest('.logo-wrap')){
    document.getElementById('logoDrop')?.classList.remove('open');
  }

  // Pages button (top bar) → toggle pages overlay
  if(t.closest('[data-act="pages"]')){ e.preventDefault(); togglePagesOverlay(); return; }
  
    // Home page actions
  if(t.closest('[data-act="go-write"]')){ e.preventDefault(); goPage('write'); return; }
  if(t.closest('[data-act="go-new"]')){ e.preventDefault(); if(window.TOOLS?.newProject) TOOLS.newProject(); return; }
  if(t.closest('[data-act="go-stats"]')){ e.preventDefault(); goPage('stats'); return; }
if(t.closest('[data-act="go-overview"]')){
  e.preventDefault();
  if(typeof goPage === 'function') goPage('overview');
  return;
}
// Dashboard mode toggle — the one at the workspace card's top left. It
// carries the OTHER mode's id, so clicking it swaps and stays on the page.
if(t.closest('[data-home-mode]')){
  e.preventDefault();
  const want = t.closest('[data-home-mode]').dataset.homeMode;
  if(want && want !== S.mode && typeof switchMode === 'function') switchMode(want);
  return;
}

  // ── Dashboard search: one magnifier, one toggle. It opens the field, and
  //    the same button in the same spot closes it again (which also drops
  //    the filter). Typing is handled by the input listener further down,
  //    not here — a click is not an edit.
  if(t.closest('[data-home-search-toggle]')){
    e.preventDefault();
    if(typeof toggleHomeSearch === 'function') toggleHomeSearch();
    return;
  }

  // ─── Export project (from Write toolbar) ───
  if(t.closest('[data-act="export-project"]')){
    e.preventDefault();
    if(typeof IO?.exportProject === 'function') IO.exportProject();
    return;
  }

  // ─── Show in folder (project expand) ───
  const projShow = t.closest('[data-proj-showfolder]');
  if(projShow){
    e.preventDefault();
    e.stopPropagation();
    const pid = projShow.dataset.projShowfolder;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;

    if(proj.savedPath){
      if(typeof FS?.isElectron === 'function' && FS.isElectron() && window.electronAPI?.showInFolder){
        window.electronAPI.showInFolder(proj.savedPath);
      } else {
        toast('Saved at: ' + proj.savedPath);
      }
    } else {
      toast('Not saved to disk yet. Click Export to save it first.', 'warn');
    }
    return;
  }

  // ─── Dashboard card: page through the complete project list ───
  const homePage = t.closest('[data-home-page]');
  if(homePage){
    e.preventDefault();
    e.stopPropagation();
    const mode = homePage.dataset.homePageMode;
    const current = parseInt(homePage.dataset.homePageIndex, 10) || 0;
    const delta = homePage.dataset.homePage === 'next' ? 1 : -1;
    if(typeof setHomeProjectPage === 'function') setHomeProjectPage(mode, current + delta);
    return;
  }

  // ─── Dashboard card: a recent-project row selects it — the card's stats ·
  //     progress halves fill in above the list. Double-click opens. ───
  const homePickEl = t.closest('[data-home-pick]');
  if(homePickEl){
    e.preventDefault();
    e.stopPropagation();
    if(typeof setHomePick === 'function') setHomePick(homePickEl.dataset.homePick);
    return;
  }

  // ─── Dashboard card: Open project — the one selected in that card's list ───
  const homeOpenSel = t.closest('[data-home-open-sel]');
  if(homeOpenSel){
    e.preventDefault();
    e.stopPropagation();
    const pid = (typeof getHomePick === 'function') ? getHomePick(homeOpenSel.dataset.homeOpenSel) : null;
    if(!pid){ toast('Click a project in the list first, then Open', 'warn'); return; }
    openProjectById(pid);
    return;
  }

  // ─── Dashboard card: New project on the card that is not the active mode
  //     switches to that mode first, then uses its own New project button ───
  const homeNew = t.closest('[data-home-new]');
  if(homeNew){
    e.preventDefault();
    e.stopPropagation();
    const want = homeNew.dataset.homeNew;
    if(want && want !== S.mode && typeof switchMode === 'function') switchMode(want);
    const btn = document.querySelector('.home-pane.on [data-cat-new]');
    if(btn) btn.click();
    return;
  }

  // ─── Project row: select (stats) / double-click to open ───
  const projToggle = t.closest('[data-proj-toggle]');
  if(projToggle){
    e.preventDefault();
    const pid = projToggle.dataset.projToggle;
    const d = D();

    // A single click selects the project and shows its stats; open it with
    // the Open button on the row instead of double-clicking.
    if(typeof setStatsProject === 'function') setStatsProject(pid);
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    if(typeof renderProjectStatsPanel === 'function') renderProjectStatsPanel();
    // The second click of a double-click also arrives as a click event;
    // keep the row selectable on click and open it on the second click.
    if(e.detail >= 2){
      openProjectById(pid);
    }
    return;
  } 

  // Project: Open (single click on the open button opens the project)
  const projOpenBtn = t.closest('[data-proj-open-btn]');
  if(projOpenBtn){
    e.preventDefault();
    e.stopPropagation();
    openProjectById(projOpenBtn.dataset.projOpenBtn);
    return;
  }

  // Project: Pin / unpin (pinned rows sit at the top of the recents list)
  const projPin = t.closest('[data-proj-pin]');
  if(projPin){
    e.preventDefault();
    e.stopPropagation();
    const pid = projPin.dataset.projPin;
    if(typeof togglePinnedProject === 'function') togglePinnedProject(pid);
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(D().currentCategory);
    if(typeof refreshHomeCards === 'function') refreshHomeCards();
    return;
  }

  // Projects head: Open the project currently selected in the list
  const projOpenSel = t.closest('[data-proj-open-sel]');
  if(projOpenSel){
    e.preventDefault();
    e.stopPropagation();
    const pid = (typeof getStatsProject === 'function') ? getStatsProject() : null;
    if(!pid){ toast('Click a project in the list first, then Open', 'warn'); return; }
    openProjectById(pid);
    return;
  }

  // Project: Rename
  const projRename = t.closest('[data-proj-rename]');
  if(projRename){
    e.preventDefault();
    e.stopPropagation();
    const pid = projRename.dataset.projRename;
    const d = D();
    /* Dashboard rows can belong to either mode. D() is only the active mode,
       so looking there made screenplay rename buttons silently do nothing. */
    let owner = null;
    Object.keys(S.modes || {}).forEach(function(modeId){
      const list = (S.modes[modeId] && S.modes[modeId].projects) || [];
      const found = list.find(x => x.id === pid);
      if(found) owner = found;
    });
    const proj = owner || (d.projects || []).find(x => x.id === pid);
    if(!proj) return;
    const newName = prompt('Rename project:', proj.name);
    const cleanName = newName == null ? '' : newName.trim();
    if(!cleanName || cleanName === proj.name) return;
    proj.name = cleanName;
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    if(typeof renderProjectStatsPanel === 'function') renderProjectStatsPanel();
    if(typeof refreshHomeCards === 'function') refreshHomeCards();
    toast('Renamed');
    return;
  }

  // Project: Change folder
  const projFolder = t.closest('[data-proj-folder]');
  if(projFolder){
    e.preventDefault();
    e.stopPropagation();
    const pid = projFolder.dataset.projFolder;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;
    const categories = (currentMode()?.categories) || [];
    const list = categories.map(c => c.name).join(' / ');
    const pick = prompt('Move to which category? (' + list + ')', getCatName(proj.category));
    if(!pick) return;
    const match = categories.find(c => c.name.toLowerCase() === pick.toLowerCase());
    if(!match){ toast('Unknown category', 'warn'); return; }
    proj.category = match.id;
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    toast('Moved to ' + match.name);
    return;
  }

  // Project: Delete
  const projDel = t.closest('[data-proj-del]');
  if(projDel){
    e.preventDefault();
    e.stopPropagation();
    const pid = projDel.dataset.projDel;
    const d = D();
    const proj = d.projects.find(x => x.id === pid);
    if(!proj) return;
    if(!confirm('Delete project "' + proj.name + '"? Cannot be undone.')) return;
    d.projects = d.projects.filter(x => x.id !== pid);
    if(d.currentProject === pid) d.currentProject = d.projects[0]?.id || null;
    d._expandedProject = null;
    // If the deleted project was the one shown in the stats card, empty it
    if(typeof getStatsProject === 'function' && getStatsProject() === pid){
      if(typeof setStatsProject === 'function') setStatsProject(null);
    }
    save();
    if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(d.currentCategory);
    if(typeof refreshHomeCards === 'function') refreshHomeCards();
    toast('Project deleted');
    return;
  }

     // Stats page actions — Export
  if(t.closest('[data-act="stats-export"]')){
    e.preventDefault();
    const novelCat = S.config.statsNovel || 'none';
    const screenCat = S.config.statsScreenplay || 'none';
    let modeId = null, catId = null;
    if(novelCat !== 'none'){ modeId = 'novel'; catId = novelCat; }
    else if(screenCat !== 'none'){ modeId = 'screenplay'; catId = screenCat; }

    const modeData = modeId ? (S.modes[modeId] || {}) : {};
    const projs = catId ? (modeData.projects || []).filter(p => p.category === catId) : [];
    let totalWords = 0, totalSections = 0;
    projs.forEach(p => {
      totalSections += (p.chapters ? flatChs(p.chapters).length : 0);
      totalWords += (p.chapters ? p.chapters.reduce((a, c) => a + wordCount(c.content), 0) : 0);
    });

    let report = 'Statistics Report\n';
    report += 'Generated: ' + new Date().toLocaleString() + '\n';
    report += 'Mode: ' + (modeId || '(none)') + '\n';
    report += 'Category: ' + (catId || '(none)') + '\n\n';
    report += 'Projects: ' + projs.length + '\n';
    report += 'Sections: ' + totalSections + '\n';
    report += 'Words: ' + totalWords + '\n';

    const blob = new Blob([report], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'statistics-' + Date.now() + '.txt';
    a.click();
    toast('Report exported');
    return;
  }
    // Topbar: Command palette
  if(t.closest('[data-act="command-palette"]')){
    e.preventDefault();
    if(typeof openCommandPalette === 'function') openCommandPalette();
    else toast('Command palette coming soon', 'warn');
    return;
  }

  // Topbar: Settings
  if(t.closest('[data-act="open-settings"]')){
    e.preventDefault();
    if(typeof SETTINGS?.open === 'function') SETTINGS.open();
    else toast('Settings opening...', 'warn');
    return;
  }
  
  if(t.closest('[data-act="close-pages"]')){ e.preventDefault(); togglePagesOverlay(false); return; }
  
  
  // Mode pill click → open overlay for that mode
  const pillEl = t.closest('[data-mode-pill]');
if(pillEl){
  e.preventDefault();
  const newMode = pillEl.dataset.modePill;
  /* inside an overlay pane the pill switches that pane's mode and opens the
     projects panel inside the pane (never the parent's) */
  if(window.SF_VIEW === true){
    if(newMode !== S.mode) switchMode(newMode);
    D().currentCategory = null;
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);
    return;
  }
  const overlay = document.getElementById('pagesOverlay');
  const isOpen = !!(overlay && overlay.classList.contains('open'));
  // clicking the pill again closes the panel; switching modes opens it
  if(isOpen && newMode === S.mode){
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
    return;
  }
  if(newMode !== S.mode) switchMode(newMode);
  D().currentCategory = null;
  renderPagesOverlay();
  togglePagesOverlay(true);
  return;
}

  // Category "+ New" button
  const catNew = t.closest('[data-cat-new]');
  if(catNew){
    e.preventDefault();
    e.stopPropagation();
    const catId = catNew.dataset.catNew;
    const name = prompt('Project name:', 'Untitled');
    if(!name) return;
    const d = D();
    // Duplicate names within a category are not allowed
    if((d.projects || []).some(p => p.category === catId && p.name.toLowerCase() === name.trim().toLowerCase())){
      toast('A project named "' + name.trim() + '" already exists in this category', 'warn');
      return;
    }
    const id = uid();
       const firstChapterId = uid();
    const freshProject = {
      id, name, category: catId, mode: S.mode, created: Date.now(),
      chapters: [{id: firstChapterId, title:'Chapter 1', content:'', children:[], collapsed:false}],
      bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
      notes: [],
      kanban: { columns:[
        {id:'k1', title:'Ideas', cards:[]},
        {id:'k2', title:'Drafting', cards:[]},
        {id:'k3', title:'Editing', cards:[]},
        {id:'k4', title:'Done', cards:[]}
      ]}
    };
    d.projects.unshift(freshProject);
    /* the new project gets its own Views · Reference · Workflow right away */
    useProjectData(freshProject);
    d.currentCategory = catId;
    d.currentChapter = firstChapterId;
    save();
    togglePagesOverlay(false);
    goPage('home');             // creating a project keeps you on the dashboard
    toast('Project created');
    return;
  }

  // Category "Open" button
  const catOpen = t.closest('[data-cat-open]');
  if(catOpen){
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.html,.docx,.rtf';
    input.onchange = async ev => {
      const f = ev.target.files[0];
      if(!f) return;
      const text = await f.text();
      const d = D();
      const catId = catOpen.dataset.catOpen;
      const id = uid();
      const imported = {
        id, name: f.name.replace(/\.[^.]+$/, ''), category: catId,
        mode: S.mode, created: Date.now(),
        chapters: [{id: uid(), title:'Section 1', content: text.replace(/\n/g,'<br>'), children:[], collapsed:false}],
        currentChapter: null
      };
      if(!Array.isArray(d.projects)) d.projects = [];
      d.projects.unshift(imported);
      useProjectData(imported);
      d.currentCategory = catId;
      save();
      togglePagesOverlay(false);
      goPage('home');             // imported projects stay on the dashboard
      toast('Project imported');
    };
    input.click();
    return;
  }
  // Category tile click
  const catEl = t.closest('[data-cat-pick]');
  if(catEl){
    e.preventDefault();
    D().currentCategory = catEl.dataset.catPick;
    // Switching category clears the stats card (it describes a project, and
    // the project list below belongs to the previous category).
    if(typeof setStatsProject === 'function') setStatsProject(null);
    save();
    renderPagesOverlay();
    return;
  }
  
  if(t.closest('[data-act="close-modes"]')){ e.preventDefault(); toggleModesPanel(false); return; }
  
  // Breadcrumb mode → open modes
  
});


/* The dashboard's search box filters the workspace card as the writer types.
   A click on the box is not an edit, so a click handler would never see a
   letter — this is an input listener. The value lives in pages.js and is
   written back into the input on every repaint, which is what lets a search
   survive clicking a row, the toggle or another page, and why the caret has
   to be put back afterwards. */
(function(){
  let timer = 0;
  document.addEventListener('input', function(e){
    const el = e.target;
    if(!el || !el.dataset || el.dataset.homeSearch === undefined) return;
    const at = el.selectionStart;
    clearTimeout(timer);
    timer = setTimeout(function(){
      if(typeof setHomeSearch === 'function') setHomeSearch(el.value);
      const now = document.querySelector('#page-home [data-home-search]');
      if(!now) return;
      now.focus();
      try{ now.setSelectionRange(at, at); }catch(err){}
    }, 140);
  });
  document.addEventListener('keydown', function(e){
    const el = e.target;
    if(!el || !el.dataset || el.dataset.homeSearch === undefined) return;
    if(e.key === 'Enter'){
      e.preventDefault();
      clearTimeout(timer);
      if(typeof setHomeSearch === 'function') setHomeSearch(el.value);
    }else if(e.key === 'Escape'){
      e.preventDefault();
      clearTimeout(timer);
      if(typeof clearHomeSearch === 'function') clearHomeSearch();
    }
  });
})();

/* A recent-project row on a dashboard card: the single click above only
   selects it, so opening it is a double-click — or the card's Open button. */
document.addEventListener('dblclick', function(e){
  const row = e.target.closest('[data-home-pick]');
  if(!row) return;
  e.preventDefault();
  openProjectById(row.dataset.homePick);
});

// Modes list needs click handlers — mode click opens pages panel on right
document.addEventListener('click', e => {
  const mi = e.target.closest('.mode-item');
  if(mi && mi.dataset.modeSwitch){
    e.preventDefault();
    const isOpen = document.getElementById('pagesOverlay')?.classList.contains('open');
    const sameMode = (mi.dataset.modeSwitch === S.mode);

    // If clicking the same mode while panel is open → just close panel
    if(sameMode && isOpen){
      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
      if(typeof hideInfoPanel === 'function') hideInfoPanel();
      return;
    }

    // Otherwise switch mode + open panel
    if(!sameMode){
      switchMode(mi.dataset.modeSwitch);
    }
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);
    if(typeof hideInfoPanel === 'function') hideInfoPanel();
  }
}, true);

// Menu bar contents
function buildMenubar(){
  const mb = document.querySelector('.menubar');
  if(!mb || mb.dataset.built) return;
  mb.dataset.built = '1';
  const MENUS = [
    {label:'File', items:[
      {icon:'file-plus', label:'New project', act:() => TOOLS.newProject()},
      {icon:'folder', label:'Open project', act:() => togglePagesOverlay()},
      {icon:'save', label:'Save', hint:'Ctrl+S', act:() => { save(); toast('Saved'); }},
      {sep:true},
      {icon:'box-arrow-in-down', label:'Import', act:() => goPage('import')},
      {icon:'box-arrow-up', label:'Export', act:() => goPage('import')},
      {sep:true},
      {icon:'printer', label:'Print', hint:'Ctrl+P', act:() => IO.printDoc()},
      {icon:'download', label:'Full backup', act:() => IO.exportFullBackup()},
      {sep:true},
      {icon:'sliders', label:'Settings', act:() => SETTINGS.open()}
    ]},
    {label:'Edit', items:[
      {icon:'arrow-counterclockwise', label:'Undo', hint:'Ctrl+Z', act:() => runCmd('undo')},
      {icon:'arrow-clockwise', label:'Redo', hint:'Ctrl+Y', act:() => runCmd('redo')},
      {sep:true},
      {icon:'search', label:'Find & replace', hint:'Ctrl+F', act:() => openFind()},
      {sep:true},
      {icon:'scissors', label:'Cut', act:() => document.execCommand('cut')},
      {icon:'copy', label:'Copy', act:() => document.execCommand('copy')},
      {icon:'clipboard', label:'Paste', act:() => document.execCommand('paste')},
      {sep:true},
      {icon:'check2-all', label:'Select all', hint:'Ctrl+A', act:() => document.execCommand('selectAll')}
    ]},
    {label:'View', items:[
      {icon:'grid-1x2', label:'Pages panel', act:() => togglePagesOverlay()},
      {icon:'collection', label:'Modes panel', act:() => { renderModesPanel(); toggleModesPanel(); }},
      {sep:true},
      {icon:'bullseye', label:'Focus mode', hint:'Ctrl+Shift+F', act:() => toggleFocus()},
      {icon:'arrows-fullscreen', label:'Fullscreen', act:() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }}
    ]},
    {label:'Format', items:[
      {icon:'type-bold', label:'Bold', hint:'Ctrl+B', act:() => runCmd('bold')},
      {icon:'type-italic', label:'Italic', hint:'Ctrl+I', act:() => runCmd('italic')},
      {icon:'type-underline', label:'Underline', hint:'Ctrl+U', act:() => runCmd('underline')},
      {icon:'type-strikethrough', label:'Strike', act:() => runCmd('strikeThrough')},
      {sep:true},
      {icon:'text-left', label:'Align left', act:() => runCmd('justifyLeft')},
      {icon:'text-center', label:'Center', act:() => runCmd('justifyCenter')},
      {icon:'text-right', label:'Align right', act:() => runCmd('justifyRight')},
      {icon:'text-paragraph', label:'Justify', act:() => runCmd('justifyFull')},
      {sep:true},
      {icon:'list-ul', label:'Bullet list', act:() => runCmd('insertUnorderedList')},
      {icon:'list-ol', label:'Numbered list', act:() => runCmd('insertOrderedList')},
      {sep:true},
      {icon:'eraser', label:'Clear formatting', act:() => runCmd('removeFormat')}
    ]},
    {label:'Insert', items:[
      {icon:'hr', label:'Divider', act:() => insertHTML('<hr>')},
      {icon:'info-square', label:'Callout', act:() => insertHTML('<div style="border-left:3px solid var(--accent);padding:10px 14px;background:var(--surface-2);border-radius:6px;margin:12px 0;"><strong>Note:</strong> </div>')},
      {icon:'emoji-smile', label:'Icon library', act:() => openIconLibrary()},
      {sep:true},
      {icon:'calendar-event', label:'Date', act:() => insertHTML(new Date().toLocaleDateString())},
      {icon:'clock', label:'Time', act:() => insertHTML(new Date().toLocaleTimeString())}
    ]},
    {label:'AI', items:[
      {icon:'stars', label:'Toggle AI panel', hint:'Ctrl+I', act:() => toggleAIPanel()},
      {sep:true},
      {icon:'magic', label:'Fix grammar', act:() => AI_FNS.fixGrammar()},
      {icon:'translate', label:'Translate', act:() => AI_FNS.translate()},
      {icon:'stars', label:'Improve', act:() => AI_FNS.improve()},
      {icon:'arrow-right-circle', label:'Continue writing', act:() => AI_FNS.continue()},
      {icon:'arrows-angle-expand', label:'Expand', act:() => AI_FNS.expand()},
      {icon:'card-text', label:'Summarize', act:() => AI_FNS.summarize()},
      {icon:'arrow-repeat', label:'Rewrite', act:() => AI_FNS.rewrite()}
    ]},
    {label:'Help', items:[
      {icon:'keyboard', label:'Keyboard shortcuts', act:() => openShortcuts()},
      {icon:'book', label:'About', act:() => SETTINGS.open()}
    ]}
  ];

  MENUS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.textContent = m.label;
    btn.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll('.menu-drop').forEach(x => x.remove());
      document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('open'));
      btn.classList.add('open');
      const drop = document.createElement('div');
      drop.className = 'menu-drop';
      const rect = btn.getBoundingClientRect();
      drop.style.left = rect.left + 'px';
      drop.style.top = (rect.bottom + 4) + 'px';
      m.items.forEach(item => {
        if(item.sep){
          const s = document.createElement('div');
          s.className = 'menu-sep';
          drop.appendChild(s);
          return;
        }
        const bi = document.createElement('button');
        bi.className = 'menu-item';
        bi.innerHTML = `<i class="mi-icon bi bi-${item.icon}"></i><span>${item.label}</span>${item.hint ? `<span class="mi-hint">${item.hint}</span>` : ''}`;
        bi.onclick = () => { drop.remove(); btn.classList.remove('open'); item.act(); };
        drop.appendChild(bi);
      });
      document.body.appendChild(drop);
    };
    mb.appendChild(btn);
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-drop').forEach(x => x.remove());
    document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('open'));
  });
}

function openShortcuts(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  const shortcuts = [
    ['Save','Ctrl+S'], ['Find','Ctrl+F'], ['Bold','Ctrl+B'], ['Italic','Ctrl+I'],
    ['Underline','Ctrl+U'], ['Command palette','Ctrl+K'], ['AI panel','Ctrl+I'],
    ['Focus mode','Ctrl+Shift+F'], ['Cycle theme','Ctrl+T'], ['New project','Ctrl+N']
  ];
  scrim.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <div class="modal-head">
        <h2><i class="bi bi-keyboard"></i> Shortcuts</h2>
        <button class="icon-btn" data-act="close-modal-shortcuts"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        ${shortcuts.map(([label, key]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface-2);border-radius:8px;margin-bottom:6px;font-size:12.5px;">
            <span>${label}</span><kbd style="font-family:var(--mono);font-size:11px;padding:2px 8px;background:var(--surface-3);border-radius:4px;">${key}</kbd>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  root.appendChild(scrim);
  scrim.querySelector('[data-act="close-modal-shortcuts"]')?.addEventListener('click', () => closeModal());
  scrim.addEventListener('click', e => { if(e.target === scrim) closeModal(); });
}

document.addEventListener('click', e => {
  const t = e.target;

  // ─── Pager ───
  if(t.closest('[data-act="mp-prev-page"]')){
    e.preventDefault();
    if(Music.page > 0){
      Music.page--;
      renderMusicPlayer();
    }
    return;
  }
  if(t.closest('[data-act="mp-next-page"]')){
    e.preventDefault();
  const perPage = Music.perPage || 5;
  const maxPages = Music.maxPages || 50;
  const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(Music.playlist.length / perPage)));
  if(Music.page < totalPages - 1){
    Music.page++;
    renderMusicPlayer();
  }
    return;
  }

  // Play button — plays the track in that row immediately
 const pb = t.closest('[data-mp-play]');
 if(pb){
   e.preventDefault();
   e.stopPropagation();
   const pi = parseInt(pb.dataset.mpPlay);
   if(isNaN(pi) || pi < 0 || pi >= Music.playlist.length) return;
   if(typeof musicPlay === 'function') musicPlay(pi);
   return;
 }

 // ─── Delete track (BEFORE play — delete button lives inside the row) ───
 const rn = t.closest('[data-mp-rename]');
 if(rn && rn.dataset.mode === 'save') return;  // save click handled by rn.onclick
if(rn){
  e.preventDefault();
  e.stopPropagation();
  const i = parseInt(rn.dataset.mpRename);
  if(isNaN(i) || i < 0 || i >= Music.playlist.length) return;

  const row = rn.closest('.mv-item');
  const titleEl = row ? row.querySelector('.mv-item-name') : null;
  if(!titleEl) return;

  const track = Music.playlist[i];
  const originalName = track.name;

  // Replace title with input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mv-item-name-edit';
  input.value = originalName;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  // Replace pencil with tick
  rn.innerHTML = '<i class="bi bi-check-lg"></i>';
  rn.classList.add('mv-item-rename-active');
  rn.dataset.mode = 'save';
  rn.dataset.mpRename = i; // keep index for the save click

  let finished = false;

  function commit(){
    if(finished) return;
    finished = true;
    const newName = input.value.trim();
    if(newName && newName !== originalName){
      track.name = newName;
      S.config.musicPlaylist = Music.playlist;
      save();
      toast('Renamed');
    }
    renderMusicPlayer();
    renderMusicMini();
  }

  function cancel(){
    if(finished) return;
    finished = true;
    renderMusicPlayer();
  }

  // The tick click also commits
  rn.onclick = function(ev){
    ev.stopPropagation();
    commit();
  };

  input.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter'){ ev.preventDefault(); commit(); }
    if(ev.key === 'Escape'){ ev.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', function(){
    setTimeout(function(){
      // Only commit via blur if we're not mid-clicking the tick
      if(document.activeElement !== rn) commit();
    }, 80);
  });

  return;
}
  const del = t.closest('[data-mp-del]');
  if(del){
    e.preventDefault();
    e.stopPropagation();
    const i = parseInt(del.dataset.mpDel);
    if(isNaN(i) || i < 0 || i >= Music.playlist.length) return;

    const wasPlaying = (i === Music.currentIndex);
    Music.playlist.splice(i, 1);

    if(wasPlaying){
      Music.audio.pause();
      Music.audio.removeAttribute('src');
      Music.audio.load();
      Music.currentIndex = -1;
      setPlayIcon(false);
      updateMusicArt(null);
    } else if(i < Music.currentIndex){
      Music.currentIndex--;
    }

  const perPage = Music.perPage || 5;
  const maxPages = Music.maxPages || 50;
  const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(Music.playlist.length / perPage)));
  if(Music.page >= totalPages) Music.page = totalPages - 1;

    S.config.musicPlaylist = Music.playlist;
    S.config.musicCurrent  = Music.currentIndex;
    save();
    renderMusicPlayer();
    renderMusicMini();
    toast('Track removed');
    return;
  }

// In app.js, inside the document.addEventListener('click', ...) block

// Legacy entry point — no longer rendered in the project list, kept for safety
const projOpen = t.closest('[data-proj-open]');
if(projOpen){
  e.preventDefault();
  e.stopPropagation();
  openProjectById(projOpen.getAttribute('data-proj-open'));
  return;
}
// ─── Play row ───
// Clicking a playlist row only selects it — playback starts from the row's
// Play button or the player's play/pause control.
const item = t.closest('[data-mp-index]');
if(item){
    e.preventDefault();
    const index = parseInt(item.dataset.mpIndex);

    // Selecting a row only highlights it — playback starts from the row's
    // Play button or the player's play/pause control.
    Music.currentIndex = index;
    
    // Update visual state immediately so user sees selection
    renderMusicPlayer(); 
    renderMusicMini();
    
    // Save selection preference
    S.config.musicCurrent = index;
    save();
    return;
}
}); // <--- THIS CLOSES THE MAIN CLICK LISTENER PROPERLY
  
// ═══════════════════════════════════════════════════════════
//   BOOT
// ═══════════════════════════════════════════════════════════
function boot(){
  try{
    load();   
    
         // Set mode attribute first — before anything else needs it
    document.body.setAttribute('data-style', 'vercel');
    
    // Apply theme
    if(typeof applyThemeNow === 'function') applyThemeNow();
    if(typeof applyAllConfig === 'function') applyAllConfig();
    /* the interface language (Settings → Language) applies before the first
       paint, so page names and text direction are right from the start */
    if(typeof applyLang === 'function') applyLang();
    document.body.setAttribute('data-layout', S.config.layout || 'classic');

    buildMenubar();

    if(typeof renderModesPanel === 'function') renderModesPanel();
        // Always start on Dashboard
    if(typeof goPage === 'function') goPage('home');

    // Overlay panes open straight onto the page / player they asked for
    try{
      const qp = new URLSearchParams(location.search);
      const wantPage  = qp.get('sfPage');
      const wantPanel = qp.get('sfPanel');
      if(wantPage && wantPage !== 'home' && typeof goPage === 'function') goPage(wantPage);
      if(wantPanel === 'music' && typeof openMusicPanel === 'function') openMusicPanel();
      if(wantPanel === 'video' && typeof openVideoPanel === 'function') openVideoPanel();
    }catch(e){}

    // Past this point any goPage() is the writer navigating, not booting —
    // an overlay pane uses it to tell its parent window what it's showing.
    window.SF_NAV_READY = true;

    // Bring back the overlay pane in the main window if it was left open
    if(window.SF_VIEW !== true && S.config.overlay && S.config.overlay.open && typeof overlayShow === 'function'){
      overlayShow(true);
    }

    if(window.PLUGINS?.initVoice) PLUGINS.initVoice();
    if(window.initAIDrag) initAIDrag();

    if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
    if(typeof renderModePills === 'function') renderModePills();
    if(typeof updateStatusBar === 'function') updateStatusBar();

       console.log('%c ✓ App booted', 'color:#10b981;font-weight:700;');
  }catch(e){
    console.error('Boot failed:', e);
    const stage = document.getElementById('stage');
    if(stage){
      stage.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:monospace;">Boot error: ' + e.message + '<br><br>Check browser console for details.</div>';
    }
      // Apply status bar + FAB visibility for initial page
  const isDash = (S.page === 'home' || S.page === 'stats' || S.page === 'overview');
  const sb = document.getElementById('statusbar');
  if(sb) sb.hidden = isDash;
  const fab = document.getElementById('fabWrap');
  if(fab) fab.style.display = isDash ? 'none' : '';
  }

  // Boot animation — skipped inside an overlay pane
  if(window.SF_VIEW !== true && typeof runBootAnimation === 'function') runBootAnimation();
}

// Toggle theme in top bar
document.addEventListener('click', e => {
  if(e.target.closest('[data-act="cycle-theme"]')){
    e.preventDefault();
    const idx = THEMES.findIndex(t => t.id === S.config.theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    if(typeof setTheme === 'function') setTheme(next.id);
    else { S.config.theme = next.id; applyThemeVars(next.id); save(); }
    toast('Theme: ' + next.name);   // one pane button, two seats — see overlay.js
  }
});

// ═══════════════════════════════════════════════════════════
//   FLOATING IMPORT BUTTON — dual behavior (fab extras appended at file end)
//   Left click  → GitHub import panel
//   Right click → local file picker
// ═══════════════════════════════════════════════════════════

(function wireFloatingImport(){
  const btn = document.getElementById('floatingImport');
  if(!btn) return;

  // Left click → GitHub panel
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if(typeof openGitHubPanel === 'function') openGitHubPanel();
    else toast('GitHub panel not loaded', 'err');
  }, true);

  // Right click → file picker
  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown,.json,.html,.htm,.fountain,.spmd,.doc,.docx,.rtf';
    input.multiple = false;
    input.onchange = async ev => {
      const file = ev.target.files && ev.target.files[0];
      if(!file) return;

      const text = await file.text();
      const d = D();
      const chapterId = uid();

      // Convert plain text → HTML paragraphs
      const html = text
        .split(/\n{2,}/)
        .map(block => `<p>${esc(block).replace(/\n/g, '<br>')}</p>`)
        .join('');

      d.chapters.push({
        id: chapterId,
        title: file.name.replace(/\.[^.]+$/, ''),
        content: html,
        children: [],
        collapsed: false
      });
      d.currentChapter = chapterId;
      save();

      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
      if(typeof goPage === 'function') goPage('inspire');
      toast('Imported: ' + file.name);
    };
    input.click();
  }, true);
})();

// ═══════════════════════════════════════════════════════════
//   SWITCH MODE
// ═══════════════════════════════════════════════════════════
function switchMode(modeId){
  const m = MODES.find(x => x.id === modeId);
  if(!m){
    console.warn('[switchMode] unknown mode:', modeId);
    return;
  }
  S.mode = modeId;
document.body.setAttribute('data-mode', modeId);           // ← CSS hook
document.body.setAttribute('data-writing-mode', modeId);   // keep if other code reads it
if(!S.modes[modeId]) S.modes[modeId] = freshModeData();
// Land on the dashboard for the new mode — the caller opens the mode's
// categories panel; never jump straight into the editor.
S.page = 'home';
if(typeof goPage === 'function') goPage(S.page);
}

window.switchMode = switchMode;

// ═══════════════════════════════════════════════════════════
//   INFO PANEL — slides in from right on page/project click
// ═══════════════════════════════════════════════════════════

function showPageInfo(pageId){
  const panel = $('infoPanel');
  const title = $('infoTitle');
  const body = $('infoBody');
  if(!panel || !title || !body) return;

  const def = PAGE_META[pageId] || {name: pageId, icon: 'file'};
  const pageName = (window.pname ? pname(pageId) : def.name);
  const count = (typeof pageCount === 'function') ? pageCount(pageId) : null;

  title.innerHTML = `<i class="bi bi-${def.icon}"></i> ${pageName}`;
  body.innerHTML = `
    <div class="info-section">
      <div class="info-label">Page</div>
      <div class="info-value">
        <strong>${pageName}</strong><br>
        Part of <strong>${currentMode()?.name || 'Novel'}</strong> mode.
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Stats</div>
      <div class="info-stats">
        ${count !== null ? `
          <div class="info-stat">
            <div class="info-stat-val">${count}</div>
            <div class="info-stat-lbl">Items</div>
          </div>
        ` : ''}
        <div class="info-stat">
          <div class="info-stat-val">${currentMode()?.pages?.length || 0}</div>
          <div class="info-stat-lbl">Pages</div>
        </div>
      </div>
    </div>
    <button class="info-open" data-info-open-page="${pageId}">
      <i class="bi bi-box-arrow-in-right"></i> Open ${pageName}
    </button>
  `;

  panel.classList.add('open');
  panel.dataset.page = pageId;
}

function showProjectInfo(projectId){
  const panel = $('infoPanel');
  const title = $('infoTitle');
  const body = $('infoBody');
  if(!panel || !title || !body) return;

  const d = D();
  const proj = d.projects.find(p => p.id === projectId);
  if(!proj){ return; }

  const chapters = proj.chapters ? flatChs(proj.chapters).length : 0;
  const words = proj.chapters ? proj.chapters.reduce((a, c) => a + wordCount(c.content), 0) : 0;
  const created = new Date(proj.created).toLocaleDateString();

  title.innerHTML = `<i class="bi bi-folder-fill"></i> ${esc(proj.name)}`;
  body.innerHTML = `
    <div class="info-section">
      <div class="info-label">Project</div>
      <div class="info-value">
        <strong>${esc(proj.name)}</strong>
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Stats</div>
      <div class="info-stats">
        <div class="info-stat">
          <div class="info-stat-val">${chapters}</div>
          <div class="info-stat-lbl">Sections</div>
        </div>
        <div class="info-stat">
          <div class="info-stat-val">${words}</div>
          <div class="info-stat-lbl">Words</div>
        </div>
      </div>
    </div>
    <div class="info-section">
      <div class="info-label">Created</div>
      <div class="info-value">${created}</div>
    </div>
    <div class="info-section">
      <div class="info-label">Actions</div>
      <div class="info-actions">
        <button data-info-rename="${proj.id}"><i class="bi bi-pencil"></i> Rename</button>
        ${d.projects.length > 1 ? `<button class="danger" data-info-del="${proj.id}"><i class="bi bi-trash"></i> Delete</button>` : ''}
      </div>
    </div>
    <button class="info-open" data-info-open-project="${proj.id}">
      <i class="bi bi-box-arrow-in-right"></i> Open Project
    </button>
  `;

  panel.classList.add('open');
  panel.dataset.page = 'proj:' + projectId;
}

function hideInfoPanel(){
  const panel = $('infoPanel');
  if(panel) panel.classList.remove('open');
}

// Info panel click routing
document.addEventListener('click', e => {
  const t = e.target;

  // Close info panel
  if(t.closest('[data-act="info-close"]')){ hideInfoPanel(); return; }
     // Logo click → go Home
  if(t.closest('.logo-btn')){
    e.preventDefault();
    if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
    if(typeof hideInfoPanel === 'function') hideInfoPanel();
    if(typeof goPage === 'function') goPage('home');
    return;
  }
  

  // Open page from info panel
const openPage = t.closest('[data-info-open-page]');
if(openPage){
  const pid = openPage.dataset.infoOpenPage;
  hideInfoPanel();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
  if(typeof goPage === 'function') goPage(pid);
  return;
}
  // Open project from info panel
  const openProj = t.closest('[data-info-open-project]');
if(openProj){
  const pid = openProj.dataset.infoOpenProject;
  hideInfoPanel();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof toggleModesPanel === 'function') toggleModesPanel(false);
  if(typeof TOOLS?.openProject === 'function'){
    TOOLS.openProject(pid);
  } else if(typeof IO?.openProject === 'function'){
    IO.openProject(pid);
  }
  return;
}

  // Rename project
  const renameProj = t.closest('[data-info-rename]');
  if(renameProj){
    const pid = renameProj.dataset.infoRename;
    const d = D();
    const proj = d.projects.find(p => p.id === pid);
    if(!proj) return;
    const newName = prompt('Rename project:', proj.name);
    if(!newName || newName === proj.name) return;
    proj.name = newName.trim();
    save();
    if(typeof renderProjectsList === 'function') renderProjectsList();
    showProjectInfo(pid);
    return;
  }

  // Delete project
  const delProj = t.closest('[data-info-del]');
  if(delProj){
    const pid = delProj.dataset.infoDel;
    const d = D();
    const proj = d.projects.find(p => p.id === pid);
    if(!proj) return;
    if(!confirm(`Delete project "${proj.name}"? Cannot be undone.`)) return;
    d.projects = d.projects.filter(p => p.id !== pid);
    if(d.currentProject === pid && d.projects[0]){
      d.currentProject = d.projects[0].id;
    }
    save();
    if(typeof renderProjectsList === 'function') renderProjectsList();
    hideInfoPanel();
    return;
  }

 // Click on page tile — toggle info panel
const pageTile = t.closest('[data-page-pick]');
if(pageTile){
  e.preventDefault();
  e.stopPropagation();
  const pid = pageTile.dataset.pagePick;
  const panel = document.getElementById('infoPanel');
  if(!panel) return;

  const isOpen = panel.classList.contains('open');
  const samePage = panel.dataset.page === pid;

  // If panel is showing THIS page already → close it
  if(isOpen && samePage){
    hideInfoPanel();
    return;
  }

  // Otherwise show (whether opening fresh or switching pages)
  showPageInfo(pid);
  return;
}

  // Click on project row in overlay → show info panel
  const projRow = t.closest('[data-open-project]');
if(projRow){
  e.preventDefault();
  e.stopPropagation();
  const projId = projRow.dataset.openProject;
  const panel = document.getElementById('infoPanel');
  if(!panel) return;
  const isOpen = panel.classList.contains('open');
  const sameProj = panel.dataset.page === 'proj:' + projId;
  if(isOpen && sameProj){ hideInfoPanel(); return; }
  showProjectInfo(projId);
  return;
}
}, true);  // capture phase so it fires before other handlers

window.showPageInfo = showPageInfo;
window.showProjectInfo = showProjectInfo;
window.hideInfoPanel = hideInfoPanel;

// ═══════════════════════════════════════════════════════════
//   COMMAND PALETTE
// ═══════════════════════════════════════════════════════════
function openCommandPalette(){
  const root = $('modalRoot');
  if(!root) return;
  root.innerHTML = '';
  root.classList.add('open');

  const commands = [
    {group:'File', items:[
      {icon:'house-door', label:'Home', act:() => { closeModal(); goPage('home'); }},
      {icon:'plus-circle', label:'New project', act:() => { closeModal(); TOOLS.newProject(); }},
      {icon:'save', label:'Save', act:() => { closeModal(); save(); toast('Saved'); }},
      {icon:'download', label:'Export', act:() => { closeModal(); goPage('import'); }},
      {icon:'upload', label:'Import', act:() => { closeModal(); goPage('import'); }}
    ]},
    {group:'View', items:[
      {icon:'grid-1x2', label:'Pages panel', act:() => { closeModal(); togglePagesOverlay(true); }},
      {icon:'list', label:'Modes panel', act:() => { closeModal(); renderModesPanel(); toggleModesPanel(true); }},
      {icon:'bullseye', label:'Focus mode', act:() => { closeModal(); document.body.classList.toggle('focus'); }},
      {icon:'graph-up', label:'Statistics', act:() => { closeModal(); goPage('stats'); }},
      {icon:'gear', label:'Settings', act:() => { closeModal(); if(typeof SETTINGS?.open === 'function') SETTINGS.open(); }}
    ]},
    {group:'Edit', items:[
      {icon:'arrow-counterclockwise', label:'Undo', act:() => { closeModal(); runCmd('undo'); }},
      {icon:'arrow-clockwise', label:'Redo', act:() => { closeModal(); runCmd('redo'); }},
      {icon:'search', label:'Find & replace', act:() => { closeModal(); openFind(); }}
    ]},
    {group:'AI', items:[
      {icon:'stars', label:'Toggle AI panel', act:() => { closeModal(); if(typeof toggleAIPanel === 'function') toggleAIPanel(); }},
      {icon:'magic', label:'Fix grammar', act:() => { closeModal(); AI_FNS.fixGrammar(); }},
      {icon:'translate', label:'Translate', act:() => { closeModal(); AI_FNS.translate(); }},
      {icon:'arrow-repeat', label:'Improve', act:() => { closeModal(); AI_FNS.improve(); }}
    ]}
  ];

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim cp-scrim';
  scrim.style.cssText = 'align-items:flex-start;padding-top:15vh;';
  scrim.innerHTML = `
    <div class="modal cp-modal" style="max-width:560px;width:90%;">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line);">
        <i class="bi bi-search" style="color:var(--ink-4);font-size:16px;"></i>
        <input id="cpInput" placeholder="Type a command or search..." style="flex:1;background:none;border:none;font-size:14px;color:var(--ink);outline:none;">
        <kbd style="font-family:var(--mono);font-size:10.5px;padding:2px 6px;background:var(--surface-3);border-radius:4px;color:var(--ink-3);">Esc</kbd>
      </div>
      <div id="cpList" style="max-height:400px;overflow-y:auto;padding:8px;">
        ${commands.map(g => `
          <div class="cp-group" data-cp-group="${g.group.toLowerCase()}">
            <div style="padding:6px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-4);">${g.group}</div>
            ${g.items.map(it => `
              <button class="menu-item cp-item" data-cp-label="${esc(it.label.toLowerCase())}">
                <i class="mi-icon bi bi-${it.icon}"></i>
                <span>${it.label}</span>
              </button>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  root.appendChild(scrim);

  const input = $('cpInput');
  const list = $('cpList');

  // Wire each item click
  let idx = 0;
  const allItems = () => Array.from(scrim.querySelectorAll('.cp-item'));
  const items = commands.flatMap(g => g.items);

  allItems().forEach((el, i) => {
    el.addEventListener('click', () => {
      const label = el.dataset.cpLabel;
      const found = commands.flatMap(g => g.items).find(x => x.label.toLowerCase() === label);
      if(found) found.act();
    });
  });

  // Keyboard navigation
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    allItems().forEach(el => {
      const match = !q || el.dataset.cpLabel.includes(q);
      el.style.display = match ? '' : 'none';
    });
    scrim.querySelectorAll('.cp-group').forEach(g => {
      const visible = Array.from(g.querySelectorAll('.cp-item')).some(e => e.style.display !== 'none');
      g.style.display = visible ? '' : 'none';
    });
  });

  input.addEventListener('keydown', e => {
    const visible = allItems().filter(el => el.style.display !== 'none');
    if(e.key === 'Escape'){ closeModal(); return; }
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      idx = Math.min(idx + 1, visible.length - 1);
      visible.forEach((el, i) => el.classList.toggle('active', i === idx));
      visible[idx]?.scrollIntoView({block:'nearest'});
    }
    if(e.key === 'ArrowUp'){
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      visible.forEach((el, i) => el.classList.toggle('active', i === idx));
      visible[idx]?.scrollIntoView({block:'nearest'});
    }
    if(e.key === 'Enter'){
      e.preventDefault();
      visible[idx]?.click();
    }
  });

  setTimeout(() => input.focus(), 30);
}
window.openCommandPalette = openCommandPalette;

// ═══════════════════════════════════════════════════════════
//   COMMAND BOX — Super / Shift+` trigger, dropdown above pill
// ═══════════════════════════════════════════════════════════

// Shortcut key per FAB view (Inspire is the “Idea” page)
const CMD_PAGE_KEYS = {
  inspire:'id', draft:'df', outline:'ol', plan:'pl', manuscript:'ms', bible:'bl', kanban:'kb',
  mindmap:'cv'
};

// No fixed page commands — the box mirrors the current mode’s FAB menu.
const CMD_DEFAULTS = {};

// The command box lists exactly the pages in the current mode’s FAB menu,
// each with its shortcut, so the box stays in sync with the menu.
function cmdPageCommands(){
  const mode = (typeof currentMode === 'function') ? currentMode() : null;
  const groups = mode && mode.fabGroups;
  if(!groups) return {};
  const out = {};
  groups.forEach(function(g){
    (g.views || []).forEach(function(v){
      const pid  = (typeof v === 'string') ? v : v.id;
      const name = (typeof window.pname === 'function') ? pname(pid) : ((typeof v === 'string' || !v.name) ? pid : v.name);
      const icon = (typeof v === 'string' || !v.icon) ? 'file' : v.icon;
      const key  = CMD_PAGE_KEYS[pid] || pid.slice(0, 2);
      out[key] = { label:name, icon:icon, run:function(){ goPage(pid); } };
    });
  });
  return out;
}

function getCmdMap(){
  // FAB menu pages + any user overrides
  const userMap = S.config.commandKeys || {};
  return Object.assign({}, cmdPageCommands(), userMap);
}

function openCmdBox(){
  const box = $('cmdBox');
  const input = $('cmdInput');
  if(!box || !input) return;
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('open'));
  input.value = '';
  const list = $('cmdList');
  if(list) list.innerHTML = '';
  setTimeout(() => input.focus(), 30);
}

function closeCmdBox(){
  const box = $('cmdBox');
  if(!box) return;
  box.classList.remove('open');
  setTimeout(() => { box.hidden = true; }, 180);
}

function renderCmdList(query){
  const list = $('cmdList');
  if(!list) return;
  const map = getCmdMap();
  const q = (query || '').trim().toLowerCase();
    
    // Empty query → show nothing (Spotlight style)
  if(!q){
    list.innerHTML = '';
    return;
  }

  // Group by rough category
  const groups = {
    'Pages':  [],
    'Modes':  [],
    'File':   [],
    'View':   [],
    'App':    []
  };

  const items = Object.entries(map).map(([key, def]) => ({ key, ...def }));

  const filtered = q
    ? items.filter(it =>
        it.key.includes(q) ||
        it.label.toLowerCase().includes(q))
    : items;

  filtered.forEach(it => {
    // Sort into groups by key heuristic
    if(['id','df','ol','pl','ms','bl','kb','kr','gt','q7','zk','ph','rb','ns','jp'].includes(it.key)) groups.Pages.push(it);
    else if(['im','y4'].includes(it.key)) groups.Modes.push(it);
    else if(['86','mo'].includes(it.key)) groups.File.push(it);
    else if(['hm','pw','fo'].includes(it.key)) groups.View.push(it);
    else groups.App.push(it);
  });

  list.innerHTML = '';
  let total = 0;
  Object.keys(groups).forEach(g => {
    if(!groups[g].length) return;
    const lbl = document.createElement('div');
    lbl.className = 'cmd-group-label';
    lbl.textContent = g;
    list.appendChild(lbl);
    groups[g].forEach(it => {
      total++;
      const btn = document.createElement('button');
      btn.className = 'cmd-item';
      btn.innerHTML = `
        <i class="bi bi-${it.icon}"></i>
        <span class="cmd-label">${esc(it.label)}</span>
        <span class="cmd-key">${esc(it.key)}</span>
      `;
      btn.addEventListener('click', () => runCmdByKey(it.key));
      list.appendChild(btn);
    });
  });

  if(!total){
    list.innerHTML = `<div class="cmd-empty">No matching commands</div>`;
  }
}

function runCmdByKey(key){
  const map = getCmdMap();
  const def = map[key];
  if(!def){ toast('Unknown command: ' + key, 'err'); return; }
  closeCmdBox();
  try{ def.run(); }
  catch(e){ console.error('Command failed', key, e); toast('Command failed', 'err'); }
}

// Keyboard: Enter runs first match, Up/Down navigates
document.addEventListener('keydown', e => {
    // Trigger: Shift+` only
  // Disabled on Dashboard and Statistics
  const onDashboardOrStats = (S.page === 'home' || S.page === 'stats');

  /* Shift + ` is the only way in — Super no longer opens the box */
  if(!onDashboardOrStats && e.shiftKey && e.key === '~'){
    e.preventDefault();
    openCmdBox();
    return;
  }

  const box = $('cmdBox');
  if(!box || box.hidden) return;

  const input = $('cmdInput');
  if(!input) return;

  if(e.key === 'Escape'){
    e.preventDefault();
    closeCmdBox();
    return;
  }

  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    const items = Array.from(box.querySelectorAll('.cmd-item'));
    if(!items.length) return;
    let idx = items.findIndex(x => x.classList.contains('active'));
    items.forEach(x => x.classList.remove('active'));
    idx = e.key === 'ArrowDown'
      ? Math.min(idx + 1, items.length - 1)
      : Math.max(idx - 1, 0);
    if(idx < 0) idx = 0;
    items[idx].classList.add('active');
    items[idx].scrollIntoView({block:'nearest'});
    return;
  }

  if(e.key === 'Enter'){
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    const items = Array.from(box.querySelectorAll('.cmd-item'));

    // Exact key match first
    const map = getCmdMap();
    if(map[q]){
      runCmdByKey(q);
      return;
    }

    // Otherwise, first visible item
    const active = items.find(x => x.classList.contains('active'));
    if(active){
      const keyEl = active.querySelector('.cmd-key');
      if(keyEl) runCmdByKey(keyEl.textContent);
    }
  }
}, true);

// Input: re-render on type
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'cmdInput'){
    renderCmdList(e.target.value);
  }
}, true);

// Pill click → open box
document.addEventListener('click', e => {
  if(e.target.closest('#cmdPill')){
    e.preventDefault();
    openCmdBox();
    return;
  }
  // Click outside → close
  const box = $('cmdBox');
  if(box && !box.hidden && !e.target.closest('#cmdBox') && !e.target.closest('#cmdPill')){
    closeCmdBox();
  }
}, true);

window.openCmdBox = openCmdBox;
window.closeCmdBox = closeCmdBox;
window.runCmdByKey = runCmdByKey;
window.CMD_DEFAULTS = CMD_DEFAULTS;

// ═══════════════════════════════════════════════════════════
//   MUSIC PLAYER
// ═══════════════════════════════════════════════════════════

const Music = {
  audio: null,
  playlist: [],
  currentIndex: -1,
  shuffle: false,
  repeat: false,
  page: 0,
  perPage: 5,
  maxPages: 50
};

// ─── Volume button — tap/hold like the video player ───
const MVOL_TAP        = 0.01;   // 1% per tap
const MVOL_TICK_MS    = 100;
const MVOL_RAMP_AFTER = 400;    // accelerate after 400ms held
const MVOL_SLOW       = 0.02;   // 2% per tick
const MVOL_MED        = 0.05;   // 5% per tick (fast)
const MVOL_HOLD_DELAY = 250;    // ramp starts after this long held

let _mVolHoldTimer = null;
let _mVolHoldStart = 0;

function getMusicVolume(){
  return (S.config.musicVolume !== undefined && S.config.musicVolume !== null) ? S.config.musicVolume : 0.8;
}

function updateMusicVolumeUi(vol){
  const icon = document.getElementById('mpVolIcon');
  if(icon){
    if(vol === 0)      icon.className = 'bi bi-volume-mute';
    else if(vol < 0.5) icon.className = 'bi bi-volume-down';
    else               icon.className = 'bi bi-volume-up';
  }
  const pct = document.getElementById('mpVolPct');
  if(pct) pct.textContent = Math.round(vol * 100) + '%';
  const slider = document.getElementById('mpVol');
  if(slider) slider.value = Math.round(vol * 100);
}

function setMusicVolume(vol){
  vol = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
  if(Music.audio) Music.audio.volume = vol;
  S.config.musicVolume = vol;
  updateMusicVolumeUi(vol);
  save();
}

function startMusicVolHold(dir){
  stopMusicVolHold();
  _mVolHoldStart = Date.now();

  // 1) immediate tap — always fires
  setMusicVolume(getMusicVolume() + dir * MVOL_TAP);

  // 2) ramp starts after MVOL_HOLD_DELAY ms
  _mVolHoldTimer = setTimeout(function(){
    _mVolHoldTimer = setInterval(function(){
      const elapsed = Date.now() - _mVolHoldStart;
      const step = (elapsed > MVOL_RAMP_AFTER) ? MVOL_MED : MVOL_SLOW;
      const next = getMusicVolume() + dir * step;
      if(next <= 0 || next >= 1){
        setMusicVolume(next);
        stopMusicVolHold();
        return;
      }
      setMusicVolume(next);
    }, MVOL_TICK_MS);
  }, MVOL_HOLD_DELAY);
}

function stopMusicVolHold(){
  if(_mVolHoldTimer){
    clearInterval(_mVolHoldTimer);
    clearTimeout(_mVolHoldTimer);
    _mVolHoldTimer = null;
  }
}

document.addEventListener('mousedown', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  if(e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  startMusicVolHold(e.button === 2 ? +1 : -1);
}, true);

document.addEventListener('mouseup', function(){
  if(_mVolHoldTimer) stopMusicVolHold();
}, true);

document.addEventListener('click', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

document.addEventListener('contextmenu', function(e){
  if(!e.target.closest('#mpVolBtn')) return;
  e.preventDefault();
  e.stopPropagation();
}, true);

window.addEventListener('load', function(){
  setTimeout(function(){ updateMusicVolumeUi(getMusicVolume()); }, 150);
});

function resolveMusicUrl(url){
  // Electron with webSecurity:false plays cross-origin audio directly.
  // No proxy needed.
  return url;
}

// Readable reason for a failed load/play, so the player never fails silently.
function mediaErrorMessage(err, track){
  const name  = (err && err.name) || '';
  const url   = (track && track.url) || '';
  const label = (track && track.name) || url.split('/').pop() || 'this track';
  if(name === 'NotAllowedError') return 'Press play again to start ' + label;
  if(/^file:\/\//i.test(url) && !(window.electronPath && window.electronPath.getPathForFile)){
    return 'Local files play in the desktop app only \u2014 add "' + label + '" by URL instead';
  }
  if(name === 'NotSupportedError') return 'Cannot play "' + label + '" \u2014 unsupported format or blocked source';
  return 'Cannot play "' + label + '"';
}

function musicInit(){
  if(Music._initialized) return;
  Music._initialized = true;
  Music.audio = $('mpAudio');
  if(!Music.audio) return;

  Music.playlist = S.config.musicPlaylist || [];
  Music.shuffle  = !!S.config.musicShuffle;
  Music.repeat   = !!S.config.musicRepeat;
  Music.currentIndex = -1;
  // Prune dead blob URLs from previous sessions
Music.playlist = Music.playlist.filter(function(track){
  if(track.url && track.url.startsWith('blob:')){
    // Blob URLs are session-scoped; they're always dead after reload
    return false;
  }
  return true;
});
S.config.musicPlaylist = Music.playlist;

  document.querySelector('[data-act="mp-shuffle"]')?.classList.toggle('active', Music.shuffle);
  const repBtn = document.querySelector('[data-act="mp-repeat"]');
  if(repBtn){
    repBtn.classList.toggle('active', Music.repeat);
    const repIcon = repBtn.querySelector('i');
    if(repIcon) repIcon.className = Music.repeat ? 'bi bi-repeat-1' : 'bi bi-repeat';
  }

  const vol = S.config.musicVolume ?? 0.8;
  Music.audio.volume = vol;
  const volSlider = $('mpVol');
  if(volSlider) volSlider.value = vol * 100;

  Music.audio.addEventListener('timeupdate', () => {
    const cur = Music.audio.currentTime;
    const dur = Music.audio.duration || 0;
    if(dur){
      const seek = $('mpSeek');
      if(seek) seek.value = (cur / dur) * 100;
      const curEl = $('mpCur');
      if(curEl) curEl.textContent = fmtTime(cur);
      const durEl = $('mpDur');
      if(durEl) durEl.textContent = fmtTime(dur);
    }
  });

  Music.audio.addEventListener('ended', () => {
    if(Music.repeat){
      Music.audio.currentTime = 0;
      Music.audio.play();
    } else {
      musicAdvanceNext();
    }
  });

  Music.audio.addEventListener('loadedmetadata', () => {
    const durEl = $('mpDur');
    if(durEl) durEl.textContent = fmtTime(Music.audio.duration);
  });

  Music.audio.addEventListener('play',  () => setPlayIcon(true));
  Music.audio.addEventListener('pause', () => setPlayIcon(false));

  // A source that fails to load fires 'error' — report it instead of silence
  Music.audio.addEventListener('error', function(){
    const src = Music.audio.currentSrc || Music.audio.src || '';
    if(!src) return;
    const cur = Music.playlist[Music.currentIndex] || { url: src, name: src.split('/').pop() };
    setPlayIcon(false);
    updateMusicArt(null);
    toast(mediaErrorMessage({ name: 'NotSupportedError' }, cur), 'err');
  });

  renderMusicPlayer();
  renderMusicMini();
}

// Mini bar (bottom-right) — song title, play state, and visibility.
// Called from renderMusicPlayer, the transport, and the add/remove paths.
function renderMusicMini(){
  const mini   = document.getElementById('musicMini');
  const song   = document.getElementById('miniSong');
  const icon   = document.getElementById('miniPlayIcon');
  const playing = Music.audio ? !Music.audio.paused : false;
  const cur = (Music.currentIndex >= 0 && Music.playlist[Music.currentIndex])
    ? Music.playlist[Music.currentIndex] : null;

  if(song) song.textContent = cur ? cur.name : 'No track';
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
  const dot = document.getElementById('miniDot');
  if(dot) dot.hidden = !playing;
  // Mini player removed everywhere.
  if(mini) mini.hidden = true;
}

function promptModal(title, defaultValue){ /* modal prompt */
  return new Promise(function(resolve){
    const root = $('modalRoot');
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.style.cssText = 'align-items:flex-start;padding-top:20vh;z-index:400;';
    scrim.innerHTML = `
      <div class="modal" style="max-width:420px;width:90%;">
        <div class="modal-head">
          <h2>${esc(title)}</h2>
        </div>
        <div class="modal-body">
          <input class="tb-input" id="promptModalInput" style="width:100%;padding:10px 14px;font-size:14px;" value="${esc(defaultValue || '')}">
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-pm-cancel>Cancel</button>
          <button class="btn btn-primary" data-pm-ok>OK</button>
        </div>
      </div>
    `;
    root.appendChild(scrim);
    root.classList.add('open');

    const input = scrim.querySelector('#promptModalInput');
    const okBtn = scrim.querySelector('[data-pm-ok]');
    const cancelBtn = scrim.querySelector('[data-pm-cancel]');

    setTimeout(function(){ input.focus(); input.select(); }, 30);

    function cleanup(){
      scrim.remove();
      if(!root.children.length) root.classList.remove('open');
    }
    function submit(){
      const val = input.value;
      cleanup();
      resolve(val);
    }
    function cancel(){
      cleanup();
      resolve(null);
    }

    okBtn.onclick = submit;
    cancelBtn.onclick = cancel;
    input.onkeydown = function(e){
      if(e.key === 'Enter'){ e.preventDefault(); submit(); }
      if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
    };
    scrim.addEventListener('click', function(e){
      if(e.target === scrim) cancel();
    });
  });
}
window.promptModal = promptModal;

function setPlayIcon(playing){
  const icon = $('mpPlayIcon');
  if(icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
  const miniIcon = $('miniPlayIcon');
  if(miniIcon) miniIcon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';

  const viz = document.querySelector('.mv-visualizer');
  if(viz) viz.classList.toggle('playing', playing);
}

function fmtTime(sec){
  if(!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function updateMusicArt(track){
  const viz = document.querySelector('.mv-visualizer');
  if(!viz) return;
  const isPlaying = Music.audio ? !Music.audio.paused : false;
  viz.classList.toggle('playing', !!track && isPlaying);
}

function renderMusicPlayer(){
    const wrap    = $('mpPlaylist');
    const range   = $('mpRange'); // ✅ Properly defined here
    const prevBtn = document.querySelector('[data-act="mp-prev-page"]');
    const nextBtn = document.querySelector('[data-act="mp-next-page"]');
    
    if(!wrap) return;
    
    if(!Music.playlist.length){
        wrap.innerHTML = '<div class="mv-empty">Click + to add.</div>';
        if(range) range.textContent = '1';
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        return;
    }
    
    const total = Music.playlist.length;
    const perPage = Music.perPage || 4;
    const maxPages = Music.maxPages || 50;
    const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(total / perPage)));
    
    if(Music.page >= totalPages) Music.page = totalPages - 1;
    if(Music.page < 0) Music.page = 0;
    
    const start = Music.page * perPage;
    const end = Math.min(start + perPage, total);
    
    wrap.innerHTML = '';
    
    for(let i = start; i < end; i++){
        const track = Music.playlist[i];
        // Highlight based on SELECTION (currentIndex), not play state
        const isSelected = (i === Music.currentIndex); 
        
        const item = document.createElement('div');
        item.className = 'mv-item' + (isSelected ? ' active' : '');
        item.dataset.mpIndex = i;
        
        // Icon logic: Volume icon only if SELECTED AND PLAYING
        const isPlaying = Music.audio && !Music.audio.paused && isSelected;
        
        item.innerHTML = `
          <div class="mv-item-body">
            <div class="mv-item-name" title="${esc(track.name)}">${esc(track.name)}</div>
            <div class="mv-item-source">${track.source === 'url' ? 'External' : track.source === 'file' ? 'Internal' : 'Unknown'}</div>
          </div>
          <button class="mv-item-rename" data-mp-rename="${i}" title="Rename">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="mv-item-del" data-mp-del="${i}" title="Remove">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>`;
          
        wrap.appendChild(item);
    }
    // ✅ Now 'range' is safely accessible
    if(range){
        const pageNum = Music.page + 1;
        const last = Math.min(pageNum * perPage, total);
        range.textContent = pageNum + '-' + last;
    }
    
    if(prevBtn) prevBtn.disabled = (Music.page === 0);
    if(nextBtn) nextBtn.disabled = (Music.page >= totalPages - 1);
}
  function musicPlay(index){
    // If no index provided, use the currently selected one
    if(index === undefined || index < 0) {
        index = Music.currentIndex;
    }
    
    // Safety check
    if(index < 0 || index >= Music.playlist.length) return;
    
    const track = Music.playlist[index];
    
    // Force-clean previous source to prevent glitches
    try{
        Music.audio.pause();
        Music.audio.removeAttribute('src');
        Music.audio.load();
    }catch(e){ /* ignore */ }
    
    // Load new track.
    // Never force CORS mode: a plain <audio> has to be able to play URLs that
    // send no Access-Control-Allow-Origin header (most media hosts don't).
    Music.audio.removeAttribute('crossorigin');
    Music.audio.src = track.url;
    // Remember which playlist row is actually loaded, so play/pause can tell
    // "resume" apart from "play the newly selected row".
    Music.loadedIndex = index;

    // The beat visualizer routes this element through a Web Audio graph, and a
    // suspended context would make it play silently.
    if(_audioCtx && _audioCtx.state === 'suspended' && _audioCtx.resume) _audioCtx.resume();
    
    // Play and handle errors
    const playPromise = Music.audio.play();
    if(playPromise && playPromise.catch){
        playPromise.catch(function(e){
            if(e && e.name === 'AbortError') return;
            console.warn('Play failed:', e);
            setPlayIcon(false);
            updateMusicArt(null);
            toast(mediaErrorMessage(e, track), 'err');
        });
    }
    
    // Update UI states
    setPlayIcon(true);
    updateMusicArt(track);
    renderMusicPlayer();
    renderMusicMini();
    
    // Persist current playing index
    S.config.musicCurrent = index;
    save();
}

function musicToggle(){
  if(!Music.audio) return;
  if(Music.audio.paused){
    if(Music.currentIndex < 0 && Music.playlist.length) musicPlay(0);
    else Music.audio.play();
  } else {
    Music.audio.pause();
  }
}

function musicNext(){
  if(!Music.playlist.length) return;
  let next;
  if(Music.shuffle){
    next = Math.floor(Math.random() * Music.playlist.length);
  } else {
    next = (Music.currentIndex + 1) % Music.playlist.length;
  }
  musicPlay(next);
}

function musicPrev(){
  if(!Music.playlist.length) return;
  const prev = (Music.currentIndex - 1 + Music.playlist.length) % Music.playlist.length;
  musicPlay(prev);
}

function closeMusicPlayer(){
  const el = $('musicPlayer');
  if(el) el.hidden = true;
}

function musicAddURL(url){
  if(!url) return;
  if(Music.playlist.some(t => t.url === url)){
    toast('Already in playlist', 'warn');
    return;
  }
  const cap = Music.perPage * Music.maxPages;
  if(Music.playlist.length >= cap){
    toast('Playlist full (max ' + cap + ' tracks)', 'warn');
    return;
  }
  // In Electron, use the filename from URL as the default name — no prompt
  const name = url.split('/').pop().replace(/\.[^.]+$/, '') || 'Untitled';
  Music.playlist.push({ name, url, source: 'url' });
  S.config.musicPlaylist = Music.playlist;
  save();
  renderMusicPlayer();
  renderMusicMini();
  toast('Track added: ' + name);
}

function musicAddFiles(files){
  const cap = Music.perPage * Music.maxPages;
  Array.from(files).forEach(f => {
    if(Music.playlist.length >= cap) return;

    let url = null;
    let source = 'file';

    // Electron: get the real file path via preload bridge
    if(window.electronPath && window.electronPath.getPathForFile){
      const p = window.electronPath.getPathForFile(f);
      if(p) url = 'file://' + p;
    }
    // Older Electron fallback
    if(!url && f.path){
      url = 'file://' + f.path;
    }
    // Browser fallback: blob URL (session-only)
    if(!url){
      url = URL.createObjectURL(f);
      source = 'blob';
    }

    Music.playlist.push({
      name: f.name.replace(/\.[^.]+$/, ''),
      url,
      source
    });
  });
  S.config.musicPlaylist = Music.playlist;
  save();
  renderMusicPlayer();
  renderMusicMini();
  toast(files.length + ' track(s) added');
}

// Start beat visualizer when panel is visible
if(document.getElementById('musicPanel') && !document.getElementById('musicPanel').hidden){
  startBeatVisualizer();
}

window.Music = Music;
window.musicInit = musicInit;
window.closeMusicPlayer = closeMusicPlayer;
window.musicAddURL = musicAddURL;
window.musicAddFiles = musicAddFiles;
window.updateMusicArt = updateMusicArt;

function hideMusicAddModal(){
  const m = document.getElementById('musicAddModal');
  if(m) m.hidden = true;
}

/* ── Visualizer — hands off to motion.js ── */
function applyVisualizerAlign(){
  if(window.MOTION && typeof MOTION.sync === 'function') MOTION.sync();
}
window.applyVisualizerAlign = applyVisualizerAlign;

// Seek slider

document.addEventListener('input', e => {
  if(e.target.id === 'mpSeek' && Music.audio && Music.audio.duration){
    Music.audio.currentTime = (parseFloat(e.target.value) / 100) * Music.audio.duration;
  }
  if(e.target.id === 'mpVol' && Music.audio){
    const v = parseFloat(e.target.value) / 100;
    Music.audio.volume = v;
    S.config.musicVolume = v;
    save();
  }
}, true);

// Init music on load
window.addEventListener('load', () => {
  if(typeof musicInit === 'function') musicInit();
  if(typeof applyVisualizerAlign === 'function') applyVisualizerAlign();
});

// Auto-restore last playing track name
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if(typeof musicInit === 'function') musicInit();
  }, 100);
});

// ═══════════════════════════════════════════════════════════
//   BEAT ANALYZER — Web Audio frequency-driven visualizer
// ═══════════════════════════════════════════════════════════

let _audioCtx = null;
let _analyser = null;
let _dataArray = null;
let _sourceNode = null;
let _vizRafId = null;

function initBeatAnalyser(){
  if(_audioCtx && _analyser) return true;
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return false;
    _audioCtx = new AudioCtx();
    _analyser = _audioCtx.createAnalyser();
    _analyser.fftSize = 128;
    _analyser.smoothingTimeConstant = 0.75;
    _dataArray = new Uint8Array(_analyser.frequencyBinCount);

    try{
      _sourceNode = _audioCtx.createMediaElementSource(Music.audio);
      _sourceNode.connect(_analyser);
      _analyser.connect(_audioCtx.destination);
    }catch(e){
      // Already connected to a different context — fine
      console.warn('Audio node already connected');
    }
    return true;
  }catch(e){
    console.warn('Web Audio init failed:', e.message);
    return false;
  }
}

function startBeatVisualizer(){
  const viz = document.querySelector('.mv-visualizer');
  if(!viz) return;
  const bars = viz.querySelectorAll('span');
  if(!bars.length) return;
  if(!Music.audio || Music.audio.paused || !Music.audio.src){ viz.classList.remove('beat-active'); return; }

  if(!initBeatAnalyser()){
    viz.classList.remove('beat-active');
    return;
  }

  viz.classList.add('beat-active');

  // Resume audio context if it was suspended (browser policy)
  if(_audioCtx.state === 'suspended') _audioCtx.resume();

  if(_vizRafId) cancelAnimationFrame(_vizRafId);

  const BAR_COUNT = bars.length;

    let _silentFrames = 0;

   function frame(){
    if(viz.classList.contains('motion-on')){ _vizRafId = 0; return; }
    if(!_analyser) return;
    const audioPaused = Music.audio ? Music.audio.paused : true;

    if(audioPaused){
      bars.forEach(function(b){ b.style.height = ''; });
      _silentFrames = 0;
    } else {
      _analyser.getByteFrequencyData(_dataArray);
      const maxVal = Math.max.apply(null, Array.from(_dataArray));

      if(maxVal === 0){
        _silentFrames++;
        if(_silentFrames >= 10){
          viz.classList.remove('beat-active');
          bars.forEach(function(b){ b.style.height = ''; });
          _silentFrames = 0;
          return;
        }
      } else {
        _silentFrames = 0;
        const usable = Math.floor(_dataArray.length * 0.75);
        for(let i = 0; i < BAR_COUNT; i++){
          const idx = Math.floor((i / BAR_COUNT) * usable);
          const v = _dataArray[idx] || 0;
          const h = 4 + (v / 255) * 50;
          bars[i].style.height = h.toFixed(1) + 'px';
        }
      }
    }
    _vizRafId = requestAnimationFrame(frame);
  }
  frame();
}
window.startBeatVisualizer = startBeatVisualizer;
window.resolveMusicUrl = resolveMusicUrl;

// ═══════════════════════════════════════════════════════════
//   BOOT ANIMATION
// ═══════════════════════════════════════════════════════════
function runBootAnimation(){
  const overlay = document.getElementById('bootOverlay');
  const fill = document.getElementById('bootFill');
  const status = document.getElementById('bootStatus');
  if(!overlay || !fill) return;

  const steps = [
    {pct: 20, msg: 'Loading state…',  delay: 150},
    {pct: 45, msg: 'Loading modes…',  delay: 200},
    {pct: 70, msg: 'Loading pages…',  delay: 200},
    {pct: 90, msg: 'Almost ready…',   delay: 200},
    {pct: 100,msg: 'Ready',           delay: 250}
  ];

  let i = 0;
  const next = () => {
    if(i >= steps.length){
      setTimeout(() => {
        overlay.classList.add('hide');
        setTimeout(() => { overlay.style.display = 'none'; }, 450);
      }, 150);
      return;
    }
    const step = steps[i++];
    fill.style.width = step.pct + '%';
    if(status) status.textContent = step.msg;
    setTimeout(next, step.delay);
  };

  setTimeout(next, 100);
}
window.runBootAnimation = runBootAnimation;


// ═══════════════════════════════════════════════════════════
//   START THE APP
// ═══════════════════════════════════════════════════════════
if(typeof boot === 'function'){
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

// ═══════════════════════════════════════════════════════════
//   FAB
// ═══════════════════════════════════════════════════════════

function renderFabMenu(){
  const views = $('fabMenuViews');
  if(!views) return;
  const mode = currentMode();
  if(!mode) return;

  const viewList = mode.editorViews || [];

  views.innerHTML = viewList.map(function(pid){
    const meta = PAGE_META[pid] || { name: pid, icon: 'file' };
    const sep = (pid === 'kanban') ? '<div class="fab-divider"></div>' : '';
    return sep + '<button class="fab-item' + (S.page === pid ? ' active' : '') +
      '" data-fab-go="' + pid + '"><i class="bi bi-' + meta.icon + '"></i><span>' + (window.pname ? pname(pid) : meta.name) + '</span></button>';
  }).join('');
}


function toggleFabMenu(force){
  const menu = $('fabMenu');
  const ai = $('fabAI');
  const wrap = $('fabWrap');
  if(!menu) return;
  if(ai) ai.hidden = true;
  const open = force !== undefined ? force : menu.hidden;
  if(open){
    renderFabMenu();
    menu.hidden = false;
    if(wrap) wrap.classList.add('menu-open');
  } else {
    menu.hidden = true;
    if(wrap) wrap.classList.remove('menu-open');
  }
}

function toggleFabAI(force){
  const ai = $('fabAI');
  const menu = $('fabMenu');
  const wrap = $('fabWrap');
  if(!ai) return;
  if(menu) menu.hidden = true;
  const open = force !== undefined ? force : ai.hidden;
  if(open){
    renderFabAI();
    ai.hidden = false;
    if(wrap) wrap.classList.add('menu-open');
  } else {
    ai.hidden = true;
    if(wrap) wrap.classList.remove('menu-open');
  }
}

function renderFabAI(){
  const body = $('fabAIBody');
  if(!body) return;

  const editorActions = [
    { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
    { fn:'improve',    icon:'stars',               label:'Improve' },
    { fn:'continue',   icon:'arrow-right-circle',  label:'Continue' },
    { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
    { fn:'summarize',  icon:'card-text',           label:'Summarize' },
    { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' }
  ];
  const actions = editorActions.concat([
    { fn:'translate', icon:'translate', label:'Translate' }
  ]);
  body.innerHTML = actions.map(function(a){
    return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' +
      a.icon + '"></i> ' + a.label + '</button>';
  }).join('');
}

// ══ Right-click FAB AI assistant → Google-Translate-style popup panel ══
// Every AI option and the full translation flow live in one popup:
// source text on the left, result on the right, language grid beneath.
// The Hinglish conversions only appear when the experimental toggle is on.
document.addEventListener('click', function(e){
  const chip = e.target.closest('.fab-ai .ai-chip[data-ai]');
  if(!chip) return;
  const fn = chip.dataset.ai;
  if(fn === 'translate'){ openFabTranslate(); }
  else { toggleFabAI(false); AI_FNS[fn] && AI_FNS[fn](); }
}, true);

function openFabTranslate(){
  const fab = $('fabAI');
  const body = $('fabAIBody');
  if(!fab || !body) return;

  const langs = allLangs();
  const sel = window.getSelection();
  const srcText = (sel && sel.toString().trim() && $('editor') && $('editor').contains(sel.anchorNode))
    ? sel.toString() : ($('editor') ? $('editor').innerText.trim() : '');

  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fab-translate';
  wrap.innerHTML = `
    <div class="ft-bar">
      <div class="ft-cell">
        <span class="ft-lang">Detect language</span>
        <div class="ft-text">${srcText ? esc(srcText) : '<span style="color:var(--ink-4)">Editor is empty</span>'}</div>
      </div>
      <div class="ft-cell">
        <span class="ft-lang" id="ftDstName">English</span>
        <div class="ft-text" id="ftDst"><span style="color:var(--ink-4)">Translation</span></div>
      </div>
    </div>
    <div class="ft-search"><i class="bi bi-search"></i><input id="ftQuery" placeholder="Search languages…"></div>
    <div class="ft-grid" id="ftGrid"></div>
    ${S.config.expHinglish ? `
      <div class="ft-hg">
        <button class="ai-chip" data-ai="hinglishToHindi"><i class="bi bi-arrow-return-right"></i> Hinglish → हिन्दी</button>
        <button class="ai-chip" data-ai="hinglishToEnglish"><i class="bi bi-arrow-return-right"></i> Hinglish → English</button>
      </div>` : ''}
  `;
  body.appendChild(wrap);

  const grid = wrap.querySelector('#ftGrid');
  const dstName = wrap.querySelector('#ftDstName');
  const dst = wrap.querySelector('#ftDst');
  let current = S.config.defaultLang || 'en';

  function renderGrid(q){
    const needle = (q || '').toLowerCase();
    grid.innerHTML = langs.filter(l =>
      !needle || l.name.toLowerCase().includes(needle) ||
      (l.native && l.native.toLowerCase().includes(needle))
    ).map(l =>
      '<button class="ft-lang-btn' + (l.code === current ? ' on' : '') + '" data-lang="' + l.code + '">' +
      '<span class="ft-flag">' + (l.flag || '') + '</span><span>' + esc(l.name) +
      (l.native ? ' <em>' + esc(l.native) + '</em>' : '') + '</span></button>'
    ).join('') || '<div class="ft-empty">No language found</div>';
  }
  renderGrid('');

  wrap.querySelector('#ftQuery').addEventListener('input', function(){ renderGrid(this.value); });

  grid.addEventListener('click', async function(ev){
    const btn = ev.target.closest('[data-lang]');
    if(!btn) return;
    current = btn.dataset.lang;
    const lang = langs.find(l => l.code === current);
    dstName.textContent = lang ? lang.name : current;
    renderGrid(wrap.querySelector('#ftQuery').value);
    if(!srcText){ dst.innerHTML = '<span style="color:var(--ink-4)">Nothing to translate</span>'; return; }
    dst.innerHTML = '<span class="ft-busy">Translating…</span>';
    S.config.defaultLang = current; save();
    try{
      const res = await callAI('Translate the text below into ' + lang.name +
        '. Preserve tone, meaning and paragraphs. Return only the translation.' +
        '\n\n"""\n' + srcText + '\n"""');
      dst.textContent = res.trim() || 'No response';
    }catch(err){
      dst.innerHTML = '<span style="color:var(--ink-3)">' + esc(err.message) + '</span>';
    }
  });
}


document.addEventListener('click', function(e){
  const t = e.target;
  if(t.closest('#fabBtn')){ e.preventDefault(); toggleFabMenu(); return; }
  const fabGo = t.closest('[data-fab-go]');
  if(fabGo){
    e.preventDefault();
    const pid = fabGo.dataset.fabGo;
    toggleFabMenu(false);
    if(typeof goPage === 'function') goPage(pid);
    return;
  }
  if(t.closest('[data-act="fab-ai-close"]')){ e.preventDefault(); toggleFabAI(false); return; }
  if(!t.closest('#fabWrap')){
    const m = $('fabMenu'), a = $('fabAI');
    if(m) m.hidden = true;
    if(a) a.hidden = true;
    $('fabWrap')?.classList.remove('menu-open');
  }
}, true);

document.addEventListener('contextmenu', function(e){
  if(e.target.closest('#fabBtn')){
    e.preventDefault();
    /* Kanban keeps the round button a round button. The board already has its
       own right-click menu on the cards (plan-boards.js), and a second one on
       the button was one menu too many there. Off on that page only - every
       other page still gets the panel. */
    if(typeof S !== 'undefined' && S.page === 'kanban') return;
    toggleFabAI();
  }
}, true);

window.renderFabMenu = renderFabMenu;

// Listen for system theme changes when mode is auto
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){
  if(S.config.mode === 'auto' && typeof applyThemeNow === 'function') applyThemeNow();
});

// ═══════════════════════════════════════════════════════════
//   FLOATING IMPORT BUTTON
//   Left click  → GitHub import panel
//   Right click → local file picker
// ═══════════════════════════════════════════════════════════
function attachFloatingImport(){
  const btn = document.getElementById('floatingImport');
  if(!btn){ console.warn('[import] button not found'); return; }
  if(btn.dataset.wired === '1') return;
  btn.dataset.wired = '1';

  btn.addEventListener('click', function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('[import] LEFT click → openGitHubPanel');
    if(typeof openGitHubPanel === 'function') openGitHubPanel();
    else console.error('[import] openGitHubPanel missing');
  }, true);

  btn.addEventListener('contextmenu', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  console.log('[import] RIGHT click → JSON project import');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.multiple = false;

  input.onchange = async function(ev){
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.json')){
      toast('Only .json project files are supported', 'err');
      return;
    }

    let parsed;
    try{
      const text = await file.text();
      parsed = JSON.parse(text);
    }catch(err){
      toast('Invalid JSON file', 'err');
      return;
    }

    importJSONProject(parsed, file.name);
  };

  input.click();
}, true);

  console.log('[import] button wired ✓');
}

// Attach now if DOM is ready, otherwise wait for it
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', attachFloatingImport);
} else {
  attachFloatingImport();
}
window.attachFloatingImport = attachFloatingImport;

// ═══════════════════════════════════════════════════════════
//   JSON PROJECT IMPORT — routed by name keywords
//   Name must contain: novel | screenplay
//   Category:          fiction
// ═══════════════════════════════════════════════════════════

function classifyProjectName(rawName){
  const name = (rawName || '').toLowerCase();

  // ─── Mode keyword (required) ───
  let mode = null;
  if(/\bscreenplay\b/.test(name) || /\bscript\b/.test(name)){
    mode = 'screenplay';
  } else if(/\bnovel\b/.test(name)){
    mode = 'novel';
  }

  // ─── Category keyword (required) ───
  let category = null;
  if(/\bfiction\b/.test(name)){
    category = 'fiction';
  }

  return { mode, category };
}

function importJSONProject(parsed, filename){
  const src = parsed.project || parsed;

  if(!src || typeof src !== 'object'){
    toast('File does not contain a project', 'err');
    return;
  }

  // ─── Display title ───
// Use the JSON's internal name if present (nicer to read in the list),
// otherwise fall back to the filename.
const projectName = (filename || '').replace(/\.json$/i, '') || src.name || 'Untitled';

// ─── Routing key ───
// ALWAYS classify by the filename. Never by JSON content.
const routingKey = (filename || '').replace(/\.json$/i, '') || '';

const cls = classifyProjectName(routingKey);
const mode     = cls.mode;
const category = cls.category;

  // ═══════════════════════════════════════════════════════
  //   STRICT GUARDS — nothing below runs unless both present
  // ═══════════════════════════════════════════════════════
  if(!mode && !category){
    toast('Project name must contain "novel" or "screenplay", and "fiction"', 'err');
    return;
  }
  if(!mode){
    toast('Project name must contain "novel" or "screenplay"', 'err');
    return;
  }
  if(!category){
    toast('Project name must contain "fiction"', 'err');
    return;
  }

  // From here on, both are guaranteed non-null strings
  const modeDef = MODES.find(m => m.id === mode);
  if(!modeDef){
    toast('Unknown mode "' + mode + '"', 'err');
    return;
  }
  const catExists = modeDef.categories && modeDef.categories.some(c => c.id === category);
  if(!catExists){
    toast('Category "' + category + '" not valid for ' + mode, 'err');
    return;
  }

  if(!S.modes[mode]) S.modes[mode] = freshModeData();
  const targetData = S.modes[mode];

  const newId = uid();
  const chapters = Array.isArray(src.chapters) && src.chapters.length
    ? src.chapters
    : [{ id: uid(), title: 'Chapter 1', content: '', children: [], collapsed: false }];

  const newProject = {
    id: newId,
    name: projectName,
    category: category,
    mode: mode,
    created: src.created || Date.now(),
    chapters: chapters,
    notes: src.notes || [],
    beats: src.beats || [],
    cast: src.cast || [],
    bible: src.bible || { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
    references: src.references || [],
    timeline: src.timeline || [],
    kanban: src.kanban || null,
    drafts: src.drafts || [],
    versions: src.versions || [],
    _importedFrom: filename,
    _importSource: 'internal'
  };

  if(!Array.isArray(targetData.projects)) targetData.projects = [];

  const dupe = targetData.projects.find(p =>
    p.category === category &&
    p.name.toLowerCase() === newProject.name.toLowerCase()
  );
  if(dupe){
    toast('A project named "' + newProject.name + '" already exists in this category', 'warn');
    return;
  }

  // Cap each category at 5 recent projects
  const catCount = targetData.projects.filter(p => p.category === category).length;
  if(catCount >= 5){
    toast('Category is full — 5 recent projects max', 'warn');
    return;
  }

  targetData.projects.unshift(newProject);
  targetData.currentCategory = category;
  targetData.currentProject = newId;
  targetData.currentChapter = chapters[0].id;

  save();

  if(typeof closeGitHubPanel === 'function') closeGitHubPanel();
  if(typeof hideInfoPanel === 'function') hideInfoPanel();

  if(S.mode !== mode && typeof switchMode === 'function'){
    switchMode(mode);
  }

  setTimeout(function(){
    if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
    if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);

    const row = document.querySelector('[data-proj-toggle="' + newId + '"]');
    if(row){
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const prev = row.style.background;
      row.style.background = 'var(--surface-4)';
      setTimeout(function(){ row.style.background = prev; }, 900);
    }
  }, 60);

  toast('Imported "' + newProject.name + '" → ' + modeDef.name + ' · ' + category);
}

window.importJSONProject = importJSONProject;


/* ══════════ pages-fix.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — small fixes layered on top of pages.js / app.js.

   The layer exists because pages.js / app.js carry a lot of history; each
   block below is self-contained and only replaces what it must.

   1  · FAB menu — grouped Views · Reference · Workflow, with tooltips.
   2  · Draft page — the pager sits at the bottom of the list.
   3+4· Kanban + Outline — one chevron pager each; Outline is one panel
        with the toolbar inside it, exactly like the Draft list.
   5  · Bible head — T + New on the left, category tabs in line right.
   6  · Plan tools — Add act · Add scene · Clear (Preset is gone).
   6b · Idea — prompt card + saved-prompt panel.
   7  · Icons — close is bi-x-lg, delete is bi-trash, colour chips painted.
   10 · The T (type) panel — no close button, placed beside its button.
   8  · A new or opened project always lands on the Idea view.
   11 · Kanban — a remove button on every list, an “All lists” switch, and
        every list on screen while a card is in the air.
   12 · Swipe — the window edge pages the active view (off on the board).
   13 · Settings — right-click opens the quick Advanced panel.
   14 · Plan — the visual beat board (renderBeats is replaced).
   ═══════════════════════════════════════════════════════════ */

/* ── 1 · FAB menu ── */
(function(){
  window.renderFabMenu = function(){
    const views = document.getElementById('fabMenuViews');
    if(!views) return;
    const mode = (typeof currentMode === 'function') ? currentMode() : null;
    if(!mode) return;

    const groups = mode.fabGroups ||
      [{ label:'Views', views:(mode.editorViews || []).map(function(id){ return { id:id }; }) }];
    const keys = (typeof CMD_PAGE_KEYS !== 'undefined') ? CMD_PAGE_KEYS : {};

    views.innerHTML = groups.map(function(g, gi){
      const items = (g.views || []).map(function(v){
        const pid  = (typeof v === 'string') ? v : v.id;
        const meta = (typeof PAGE_META !== 'undefined' && PAGE_META[pid]) || { name:pid, icon:'file' };
        const name = (typeof v === 'string' || !v.name) ? meta.name : v.name;
        const icon = (typeof v === 'string' || !v.icon) ? meta.icon : v.icon;
        /* every item carries a tooltip: the view’s name and its command-box key */
        const tip  = name + (keys[pid] ? '  ·  shortcut ' + keys[pid] : '');
        return '<button class="fab-item' + (S.page === pid ? ' active' : '') +
          '" data-fab-go="' + pid + '" title="' + esc(tip) + '" aria-label="' + esc(name) + '">' +
          '<i class="bi bi-' + icon + '"></i><span>' + esc(name) + '</span></button>';
      }).join('');
      const divider = gi ? '<div class="fab-divider"></div>' : '';
      return divider + '<div class="fab-menu-head">' + esc(g.label) + '</div>' + items;
    }).join('');
  };
})();

/* ── 2 · Draft page ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.draft !== 'function') return;
  const orig = PAGE_RENDERERS.draft;

  PAGE_RENDERERS.draft = function(root){
    orig(root);

    /* the pager lives at the bottom of the list, like the players' bars */
    const pager = root.querySelector('.draft-pager');
    const list  = root.querySelector('.draft-list');
    if(pager && list && pager.parentElement !== list) list.appendChild(pager);

    /* the page's own type (set from the T panel) drives the writing surface */
    if(typeof typoApply === 'function') typoApply('draft', root);
  };
})();

/* ── 3 + 4 · one chevron bar, bottom-right, for Kanban and Outline ──
   Kanban pages its lists; the Outline keeps the whole chapter list exactly
   as it was — there the chevrons page the panel itself. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const PG = { kb:0 };

  const KB_PER = function(){
    const w = window.innerWidth || 1200;
    return w > 1100 ? 4 : (w > 720 ? 2 : 1);      /* mirrors the board's breakpoints */
  };

  const bar = function(root){
    let b = root.querySelector('.pg-pager');
    if(!b){
      b = document.createElement('div');
      b.className = 'pg-pager';
      root.appendChild(b);
    }
    return b;
  };
  const shell = function(root, kind, label, prevOff, nextOff){
    const b = bar(root);
    b.dataset.pg = kind;
    b.innerHTML =
      '<button class="mv-pager-btn" data-pg-step="-1" title="Previous"' + (prevOff ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-left"></i></button>'
      + '<span class="vpl-range">' + label + '</span>'
      + '<button class="mv-pager-btn" data-pg-step="1" title="Next"' + (nextOff ? ' disabled' : '') + '>'
        + '<i class="bi bi-chevron-right"></i></button>';
    return b;
  };
  const drop = function(root){
    const b = root.querySelector('.pg-pager');
    if(b) b.parentElement.removeChild(b);
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-pg-step]');
    if(!btn) return;
    const b = btn.closest('.pg-pager');
    if(!b || !b.dataset.pg) return;
    e.preventDefault();
    const dir = parseInt(btn.dataset.pgStep, 10) || 1;

    if(b.dataset.pg === 'ol'){
      /* the chevrons turn the page — a screenful of chapters at a time, the
         way the Draft list and the Bible page their rows. Scrolling never
         moved anything on: the next page is the next chapters. */
      const root = document.getElementById('page-outline');
      if(root && typeof root.__olStep === 'function') root.__olStep(dir);
      return;
    }

    PG.kb = Math.max(0, (PG.kb || 0) + dir);
    const root = document.getElementById('page-kanban');
    if(root && typeof PAGE_RENDERERS.kanban === 'function') PAGE_RENDERERS.kanban(root);
  }, true);

  /* ── Kanban: no ghost tile, one page of lists at a time ── */
  if(typeof PAGE_RENDERERS.kanban === 'function'){
    const orig = PAGE_RENDERERS.kanban;
    PAGE_RENDERERS.kanban = function(root){
      orig(root);
      if(!root || !root.querySelector) return;

      const ghost = root.querySelector('.kb-addlist');
      if(ghost && ghost.parentElement) ghost.parentElement.removeChild(ghost);

      const board = root.querySelector('#kbBoard');
      if(!board){ drop(root); return; }
      const cols = Array.prototype.slice.call(board.children).filter(function(x){
        return x.classList && x.classList.contains('kb-col');
      });
      if(!cols.length){ drop(root); return; }

      /* no pager on the board — every list is on screen and the board
         scrolls sideways (and downwards) instead of paging */
      cols.forEach(function(c){ if(c.style.display === 'none') c.style.display = ''; });
      drop(root);

      /* the head already carries the grey “New list” button (pages.js), so
         nothing is added here — only the pager above was taken away */
    };
  }

  /* ── Outline: one panel, exactly like the Draft list — the toolbar
     (T · New chapter · New subchapter · Expand · Collapse) rides INSIDE
     the panel at the top and the chapter list fills it.

     There are NO chevrons on this page: the list scrolls inside its own
     panel, with its own scrollbar, exactly as it did before. Paging it a
     screenful at a time was what hid the subchapters — a subchapter that
     fell past the page break could not be reached at all. Scrolling shows
     every chapter and every subchapter there is. ── */
  if(typeof PAGE_RENDERERS.outline === 'function'){
    const orig = PAGE_RENDERERS.outline;

    PAGE_RENDERERS.outline = function(root){
      orig(root);
      if(!root || !root.querySelector) return;

      /* no pager on this page, and no row left hidden by an older build */
      drop(root);
      Array.prototype.slice.call(root.querySelectorAll('.ol-node')).forEach(function(r){
        if(r.style.display === 'none') r.style.display = '';
      });
      root.__olStep = null;
      root.__olSync  = null;
    };
  }
})();

/* ── 5 · Bible head — T + New left, category tabs in line on the right ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.bible !== 'function') return;
  const orig = PAGE_RENDERERS.bible;

  PAGE_RENDERERS.bible = function(root){
    orig(root);
    const head = root.querySelector('.page-head');
    const tabs = root.querySelector('#bbTabs');
    if(!head || !tabs || tabs.parentElement === head) return;

    Array.prototype.slice.call(head.children).forEach(function(c){
      if(c !== tabs && !(c.classList && c.classList.contains('ol-actions'))) c.remove();
    });
    const acts = head.querySelector('.ol-actions');
    if(acts){ acts.classList.remove('ol-actions'); acts.classList.add('ol-head-left'); }
    head.appendChild(tabs);

    /* the New button is not the white primary pill any more */
    const add = head.querySelector('[data-bb="add"]');
    if(add) add.classList.remove('ol-btn-primary');
  };
})();

/* ── 6 · Plan tools — the Preset button is gone; these replace it. The
   Plan page itself is the visual beat board (see §14). ── */
(function(){
  const beats = function(){
    const d = (typeof D === 'function') ? D() : null;
    if(!d) return null;
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };
  const redraw = function(){
    if(typeof save === 'function') save();
    if(typeof renderBeats === 'function') renderBeats();
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-act="add-act"]')){
      e.preventDefault();
      const b = beats(); if(!b) return;
      b.push({ id: uid(), text:'New act', level:0, type:'act' });
      redraw();
      return;
    }
    if(t.closest('[data-act="add-scene"]')){
      e.preventDefault();
      const b = beats(); if(!b) return;
      b.push({ id: uid(), text:'New scene', level:0, type:'scene' });
      redraw();
      return;
    }
    if(t.closest('[data-act="clear-beats"]')){
      e.preventDefault();
      const b = beats(); if(!b || !b.length) return;
      if(!confirm('Remove all ' + b.length + ' beats?')) return;
      b.length = 0;
      redraw();
      return;
    }
  }, true);
})();

/* ── 6b · Idea — a page worth looking at: a prompt card you can shuffle,
   copy and keep, with a saved-prompt panel beside it (head inside the
   panel, chevrons pinned at its bottom — the Draft list’s layout). ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.inspire !== 'function') return;

  const POOLS = {
    any: [
      'Write a scene that takes place entirely in a single elevator ride.',
      'Describe a character only through what they carry in their pockets.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'A letter that was never meant to be sent.',
      'Write the same scene twice — once as comedy, once as tragedy.',
      'Write a scene where the weather is a character.'
    ],
    scene: [
      'Open on the last five seconds of a conversation we never hear.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'Write a scene where the weather is a character.',
      'A character arrives somewhere they swore they would never return to.',
      'The scene ends on the one line nobody wanted said out loud.',
      'Two rivals forced to cooperate. Neither will speak first.'
    ],
    character: [
      'Describe a character only through what they carry in their pockets.',
      'A character discovers they’ve been misremembering a pivotal event.',
      'Write a character’s morning in five objects, no adjectives.',
      'Show a character’s worst quality as their best quality, misapplied.',
      'A character rehearses a lie until it turns into the truth.',
      'Describe someone by how they treat a stranger who cannot help them.'
    ],
    dialogue: [
      'Write a conversation where neither person says what they actually mean.',
      'Two rivals forced to cooperate. Neither will speak first.',
      'A confession told entirely in questions.',
      'An argument where both people are right.',
      'Someone says goodbye without ever using the word.',
      'Write a scene where the real dialogue happens in the pauses.'
    ],
    structure: [
      'Write the same scene twice — once as comedy, once as tragedy.',
      'Sketch a midpoint that reverses what the hero wants.',
      'Write an opening image and a closing image that mirror each other.',
      'Outline a subplot that quietly argues against your main theme.',
      'Write the “all is lost” moment without a single tear.',
      'Write the scene that proves the hero has changed — with no dialogue.'
    ]
  };

  const CHIPS = [
    { id:'any',       name:'Any',       icon:'shuffle' },
    { id:'scene',     name:'Scene',     icon:'camera-reels' },
    { id:'character', name:'Character', icon:'person' },
    { id:'dialogue',  name:'Dialogue',  icon:'chat-quote' },
    { id:'structure', name:'Structure', icon:'diagram-3' }
  ];

  let pool = 'any';
  let page = 0;
  let currentPrompt = '';

  const saved = function(){
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts;
  };

  const pick = function(){
    const list = POOLS[pool] || POOLS.any;
    let next = list[Math.floor(Math.random() * list.length)];
    if(list.length > 1 && next === currentPrompt) next = list[(list.indexOf(next) + 1) % list.length];
    currentPrompt = next;
    return next;
  };

  const showPrompt = function(){
    const box = document.getElementById('inspireBox');
    if(box) box.innerHTML = '<p>' + esc(currentPrompt) + '</p>';
  };

  const perPage = function(){
    const rows = document.getElementById('ideaRows');
    const h = (rows && rows.clientHeight) || 0;
    return Math.max(2, Math.floor(h / 62) || 5);
  };

  const renderSaved = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    const list = saved();
    const per  = perPage();
    const pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const from = page * per;
    const slice = list.slice(from, from + per);

    box.innerHTML = slice.length
      ? slice.map(function(txt, k){
          const i = from + k;
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-text">' + esc(txt) + '</span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>';

    const count = document.getElementById('ideaCount');
    if(count) count.textContent = String(list.length);
    const range = document.getElementById('ideaRange');
    /* The dashboard's own numbering: the page you are on, then the row that
       PAGE ends at - 1-10, 2-20, 3-30 - not the first row it shows. */
    if(range) range.textContent = list.length ? ((page + 1) + '-' + Math.min((page + 1) * per, list.length)) : '0';
    const prev = document.querySelector('#page-inspire [data-idea-page="-1"]');
    const next = document.querySelector('#page-inspire [data-idea-page="1"]');
    if(prev) prev.disabled = page <= 0;
    if(next) next.disabled = page >= pages - 1;
  };

  const paintChips = function(){
    document.querySelectorAll('#page-inspire .idea-chip').forEach(function(c){
      c.classList.toggle('on', c.dataset.ideaChip === pool);
    });
  };

  const copyText = function(txt){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        if(typeof toast === 'function') toast('Copied');
        return;
      }
    }catch(e){ /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); if(typeof toast === 'function') toast('Copied'); }catch(e){}
    ta.remove();
  };

  PAGE_RENDERERS.inspire = function(root){
    root.innerHTML =
      '<div class="idea-wrap">'
      + '<section class="idea-main">'
      +   '<div class="idea-bar">'
      +     '<div class="idea-chips">'
      +       CHIPS.map(function(c){
                return '<button class="idea-chip' + (c.id === pool ? ' on' : '') + '" data-idea-chip="' + c.id + '">'
                  + '<i class="bi bi-' + c.icon + '"></i><span>' + c.name + '</span></button>';
              }).join('')
      +     '</div>'
      +     '<div class="idea-tools">'
      +       '<button class="ol-btn" data-idea="new" title="Another prompt"><i class="bi bi-shuffle"></i> New prompt</button>'
      +       '<button class="ol-btn" data-idea="copy" title="Copy this prompt"><i class="bi bi-clipboard"></i> Copy</button>'
      +       '<button class="ol-btn" data-idea="save" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i> Save</button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="idea-cards" id="inspireBox"></div>'
      + '</section>'
      + '<aside class="idea-side">'
      +   '<div class="idea-side-head"><i class="bi bi-bookmark"></i><span>Saved prompts</span></div>'
      +   '<div class="bb-search">'
      +     '<i class="bi bi-search"></i>'
      +     '<input id="ideaQuery" placeholder="Filter…" autocomplete="off">'
      +   '</div>'
      +   '<div class="idea-rows" id="ideaRows"></div>'
      +   '<div class="idea-pager">'
      +     '<button class="mv-pager-btn" data-idea-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>'
      +     '<span class="vpl-range" id="ideaRange">0</span>'
      +     '<button class="mv-pager-btn" data-idea-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>'
      +   '</div>'
      + '</aside>'
      + '</div>';

    if(!currentPrompt) currentPrompt = pick();
    paintChips();
    showPrompt();
    renderSaved();
  };

  /* The click wiring for this first version of the page lives in §17 below,
     which replaces PAGE_RENDERERS.inspire outright. Leaving these handlers
     registered made every Idea click fire twice, so they are gone. */
})();

/* ── 7 · Icons — close is always bi-x-lg, delete is always bi-trash ── */
(function(){
  const CLOSE_TIP = /^\s*(close|dismiss)\b/i;
  const DEL_TIP   = /^\s*(delete|remove|discard|trash)\b/i;
  const SKIP      = '#editor, .editor-doc, [contenteditable="true"], svg';

  const isClose = function(el){
    if(el.classList && el.classList.contains('v-close')) return true;
    const tip = (el.getAttribute('title') || '') + ' | ' + (el.getAttribute('aria-label') || '');
    if(CLOSE_TIP.test(tip)) return true;
    const at = el.attributes || [];
    for(let i = 0; i < at.length; i++){
      const a = at[i];
      if(a.name.indexOf('data-') !== 0) continue;
      if(/-close(-|$)/.test(a.name)) return true;      /* data-typo-close, data-act="…-close" */
      if(/close/i.test(a.value)) return true;
    }
    return false;
  };

  const isDel = function(el){
    const at = el.attributes || [];
    /* editor commands (bold, unlink, removeFormat…) keep their own icons */
    for(let i = 0; i < at.length; i++){
      if(/-cmd$|-cmd-/i.test(at[i].name)) return false;
    }
    const tip = (el.getAttribute('title') || '') + ' | ' + (el.getAttribute('aria-label') || '');
    if(DEL_TIP.test(tip)) return true;
    for(let i = 0; i < at.length; i++){
      const a = at[i];
      if(a.name.indexOf('data-') !== 0) continue;
      if(/-(del|delete|remove|kill|trash)(-[a-z0-9]+)?$/.test(a.name)) return true;
      if(a.name === 'data-act' || a.name === 'data-ovl'){
        if(/^(.*-)?(del|delete|remove|trash)(-[a-z0-9]+)*$/i.test(a.value)) return true;
      }
    }
    return false;
  };

  const setIcon = function(el, cls){
    if(el.children.length > 1) return;                 /* only real icon buttons */
    const svg = el.querySelector('svg');
    if(svg){
      const i = document.createElement('i');
      i.className = 'bi ' + cls;
      svg.replaceWith(i);
      return;
    }
    const i = el.querySelector('i.bi');
    if(i){
      if((' ' + i.className + ' ').indexOf(' ' + cls + ' ') < 0) i.className = 'bi ' + cls;
      return;
    }
    if(!(el.textContent || '').trim()) el.insertAdjacentHTML('afterbegin', '<i class="bi ' + cls + '"></i>');
  };

  const scan = function(node){
    if(!node || node.nodeType !== 1) return;
    const all = [node];
    if(node.querySelectorAll) all.push.apply(all, node.querySelectorAll('*'));
    for(let k = 0; k < all.length; k++){
      const el = all[k];
      if(!el.tagName || el.tagName.toLowerCase() === 'svg') continue;
      if(el.closest && el.closest(SKIP)) continue;
      if(isClose(el)) setIcon(el, 'bi-x-lg');
      else if(isDel(el)) setIcon(el, 'bi-trash');
    }
  };

  /* ── the manuscript toolbar's colour chips are painted by write.js, but
     they start empty when the toolbar re-renders — keep them coloured ── */
  const paintChips = function(){
    if(typeof window.paintSwatches !== 'function') return;
    const fills = document.querySelectorAll('.tb-swatch-fill');
    for(let i = 0; i < fills.length; i++){
      if(!fills[i].style.background){ window.paintSwatches(); return; }
    }
  };

  /* ── the Bible's two panel empty-states lose their “Add …” buttons —
     the New button in the head is the only one that stays ── */
  const stripBibleAdds = function(){
    const btns = document.querySelectorAll(
      '.bb-list [data-bb="add"], #bbRows [data-bb="add"],' +
      '.bb-detail [data-bb="add"], #bbDetail [data-bb="add"]');
    for(let i = 0; i < btns.length; i++){
      if(btns[i].parentElement) btns[i].parentElement.removeChild(btns[i]);
    }
  };

  /* ── the Bible's left panel keeps its own scrollbar ── */
  /* The Bible's list scrolls inside its own panel, with its own scrollbar,
     exactly as it did before — no chevrons. Every entry is reachable, which
     paging was getting wrong for entries past the page break. */
  const pageBibleRows = function(){
    const list = document.querySelector('#page-bible .bb-list');
    const box  = document.getElementById('bbRows');
    if(!list || !box) return;

    Array.prototype.slice.call(box.querySelectorAll('.bb-row')).forEach(function(r){
      if(r.style.display === 'none') r.style.display = '';
    });
  };

  /* the T panel has no close button — clicking outside (or Escape) closes it */
  const stripTypoClose = function(){
    const btns = document.querySelectorAll('[data-typo-panel] [data-typo-close]');
    for(let i = 0; i < btns.length; i++){
      if(btns[i].parentElement) btns[i].parentElement.removeChild(btns[i]);
    }
  };

  /* The Bible's Category field is one of the app's dropdowns, not a bare
     native select: renderBbDetail() rebuilds the detail card on every pick,
     so the new <select class="sel"> is handed to the same enhancer the
     Settings and Idea pages use. Already-enhanced selects are skipped, so
     running on every mutation costs nothing. */
  const bbDropdown = function(){
    const box = document.getElementById('bbDetail');
    if(box && typeof window.enhanceSelects === 'function') window.enhanceSelects(box);
  };

  const tidy = function(){ paintChips(); stripBibleAdds(); pageBibleRows(); bbDropdown(); stripTypoClose(); };

  const pending = [];
  let scheduled = false;
  const flush = function(){
    scheduled = false;
    const nodes = pending.splice(0, pending.length);
    nodes.forEach(scan);
    tidy();
  };
  const enqueue = function(node){
    pending.push(node);
    if(scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function(f){ setTimeout(f, 16); })(flush);
  };

  const start = function(){
    scan(document.body);
    tidy();
    document.addEventListener('click', tidy, true);
    /* The Bible's own pager buttons are wired by pages.js, beside the
       renderer that draws them (see the [data-bb-page] branch in its click
       handler). This layer carried a copy that stepped a BB_PAGE it never
       declared and then called pageBibleRows(), which no longer pages -
       so with the pager back it threw BB_PAGE is not defined on every
       click. Removed; pageBibleRows() is now only the row un-hider. */
    if(typeof MutationObserver !== 'function') return;
    new MutationObserver(function(muts){
      for(let i = 0; i < muts.length; i++){
        const added = muts[i].addedNodes;
        for(let j = 0; j < added.length; j++) enqueue(added[j]);
      }
    }).observe(document.body, { childList:true, subtree:true });
  };

  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();

/* ── 10 · the T (type) panel: no close button, placed properly ──
   It opens beside the button that owns it — level with it, to the right
   when there is room, otherwise aligned with the button; always fully on
   screen. Clicking outside (or Escape) closes it. ── */
(function(){
  if(typeof window.typoOpen !== 'function') return;
  const orig = window.typoOpen;

  const place = function(p, anchor){
    if(!p || !anchor || !anchor.getBoundingClientRect) return;
    const r  = anchor.getBoundingClientRect();
    const vw = window.innerWidth  || 1200;
    const vh = window.innerHeight || 800;
    const w  = p.offsetWidth  || 236;
    const h  = p.offsetHeight || 220;

    /* always drop straight below the T button, left-aligned with it */
    let left = r.left;
    if(left + w > vw - 8) left = vw - w - 8;     /* pin to the right edge if needed */

    let top = r.bottom + 6;
    if(top + h > vh - 8) top = r.top - h - 6;    /* no room below → open above it */
    if(top < 8) top = Math.max(8, vh - h - 8);

    p.style.left = Math.max(8, Math.round(left)) + 'px';
    p.style.top  = Math.max(8, Math.round(top))  + 'px';
  };

  window.typoOpen = function(page, anchor){
    orig(page, anchor);
    const p = document.querySelector('[data-typo-panel="' + page + '"]');
    if(!p) return;                               /* it was toggled shut */
    const x = p.querySelector('[data-typo-close]');
    if(x && x.parentElement) x.parentElement.removeChild(x);
    place(p, anchor);
  };

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(typeof window.typoClose === 'function') window.typoClose();
  }, true);
})();

/* ── 8 · creating or opening a project always lands on the Idea view ──
   (belt and braces: whatever route created it, the Idea page is the one
   the writer sees next) ── */
(function(){
  const toIdea = function(){
    if(typeof goPage === 'function' && S.page !== 'inspire') goPage('inspire');
  };

  if(typeof window.openProjectById === 'function'){
    const origOpen = window.openProjectById;
    window.openProjectById = function(){
      const r = origOpen.apply(this, arguments);
      toIdea();
      return r;
    };
  }

  if(window.TOOLS && typeof window.TOOLS.newProject === 'function'){
    const origNew = window.TOOLS.newProject;
    window.TOOLS.newProject = async function(){
      const before = ((D() && D().projects) || []).length;
      const r = await origNew.apply(this, arguments);
      const after  = ((D() && D().projects) || []).length;
      if(after > before) toIdea();
      return r;
    };
  }
})();

/* ── 11 · Kanban — every list can be removed, and a card can be dropped on
   a list that lives on another page of the board. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.kanban !== 'function') return;
  const orig = PAGE_RENDERERS.kanban;
  let KB_ALL = false;                 /* “All lists” — every list on one screen */

  PAGE_RENDERERS.kanban = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    /* every list is always on the board, so the old All-lists switch is gone */
    const allSw = root.querySelector('[data-kb-all]');
    if(allSw && allSw.parentElement) allSw.parentElement.removeChild(allSw);

    /* a remove button on every list — the four defaults included */
    Array.prototype.slice.call(root.querySelectorAll('.kb-col')).forEach(function(col){
      const tools = col.querySelector('.kb-col-tools');
      const id = col.dataset.kbCol;
      if(!tools || !id || tools.querySelector('[data-kb-kill]')) return;
      const b = document.createElement('button');
      b.className = 'ol-tool';
      b.dataset.kbKill = id;
      b.title = 'Remove list';
      b.innerHTML = '<i class="bi bi-trash"></i>';
      tools.appendChild(b);
    });
  };

  document.addEventListener('click', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('[data-kb-all]')) return;
    e.preventDefault();
    KB_ALL = !KB_ALL;
    const root = document.getElementById('page-kanban');
    if(root) PAGE_RENDERERS.kanban(root);
  }, true);
})();

/* removing a list is allowed now — keep the board from going empty */
(function(){
  if(typeof window.kbDeleteList !== 'function') return;

  window.kbDeleteList = function(colId){
    const cols = (typeof kbColumns === 'function') ? kbColumns() : [];
    const col  = cols.filter(function(c){ return c.id === colId; })[0];
    if(!col) return;
    if(cols.length <= 1){
      if(typeof toast === 'function') toast('Keep at least one list on the board', 'warn');
      return;
    }
    if(!confirm('Remove the list “' + col.name + '”? Its cards go back to ' + cols[0].name + '.')) return;

    const proj = (typeof kbProj === 'function') ? kbProj() : null;
    if(proj){
      proj.kbCols = cols.filter(function(c){ return c.id !== colId; });
      Object.keys(proj.kanban || {}).forEach(function(k){ if(proj.kanban[k] === colId) delete proj.kanban[k]; });
    }
    if(typeof save === 'function') save();
    const r = document.getElementById('page-kanban');
    if(r) PAGE_RENDERERS.kanban(r);
  };
})();

/* while a card is in the air every list is on screen, so it can be dropped
   on a list that normally sits on the next page of the board */
(function(){
  document.addEventListener('dragstart', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('.kb-card')) return;
    const board = document.getElementById('kbBoard');
    if(!board) return;
    board.classList.add('kb-dragging');
    Array.prototype.slice.call(board.querySelectorAll('.kb-col')).forEach(function(c){ c.style.display = ''; });
  }, true);

  document.addEventListener('dragend', function(e){
    if(!e.target || !e.target.closest || !e.target.closest('.kb-card')) return;
    const board = document.getElementById('kbBoard');
    if(board) board.classList.remove('kb-dragging');
    const root = document.getElementById('page-kanban');
    if(root) setTimeout(function(){ PAGE_RENDERERS.kanban(root); }, 0);
  }, true);
})();

/* ── 12 · swipe between pages ──
   Push the pointer to the right edge of the window and the paged view moves
   on a page; the left edge goes back. On a touch screen a horizontal swipe
   does the same. Works on every view that has a chevron pager — Draft,
   Outline, Kanban, Bible and Idea. ── */
(function(){
  const EDGE = 22;        /* how close to the window edge the pointer must get */
  const COOL = 620;       /* ms between two steps */
  const NEXT = '[data-pg-step="1"], [data-draft-page="1"], [data-bb-page="1"], [data-idea-page="1"]';
  const PREV = '[data-pg-step="-1"], [data-draft-page="-1"], [data-bb-page="-1"], [data-idea-page="-1"]';

  const active = function(){
    return document.querySelector('.page.active') || document.querySelector('.page.on');
  };
  const busy = function(){
    const modal = document.getElementById('modalRoot');
    if(modal && modal.classList.contains('open')) return true;
    const ov = document.querySelector('.pages-overlay');
    if(ov && !ov.hidden && ov.offsetParent !== null) return true;
    /* never swipe out from under a drag */
    if(document.body.classList.contains('ol-dragging')) return true;
    const board = document.getElementById('kbBoard');
    if(board && board.classList.contains('kb-dragging')) return true;
    return false;
  };

  let last = 0, armed = true;
  const step = function(dir){
    const now = Date.now();
    if(now - last < COOL) return;
    if(busy()) return;
    const page = active();
    if(!page) return;
    /* the board is paged by its own chevrons — swiping it fought with
       dragging a card onto the next page of lists */
    if(page.id === 'page-kanban') return;
    const btn = page.querySelector(dir > 0 ? NEXT : PREV);
    if(!btn || btn.disabled) return;
    last = now;
    btn.click();
  };

  document.addEventListener('mousemove', function(e){
    const w = window.innerWidth || 1200;
    const x = e.clientX;
    const right = x >= w - EDGE;
    const left  = x <= EDGE;
    if(!right && !left){ armed = true; return; }
    if(!armed) return;
    armed = false;
    step(right ? 1 : -1);
  }, true);

  let tx = 0, ty = 0, tt = 0;
  document.addEventListener('touchstart', function(e){
    if(!e.touches || e.touches.length !== 1) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now();
  }, { passive:true, capture:true });

  document.addEventListener('touchend', function(e){
    const t = e.changedTouches && e.changedTouches[0];
    if(!t) return;
    if(Date.now() - tt > 700) return;
    const dx = t.clientX - tx;
    const dy = t.clientY - ty;
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    step(dx < 0 ? 1 : -1);
  }, { passive:true, capture:true });
})();

/* ── 13 · Settings button — left-click opens Settings, and that is all it
   does now. Its right-click used to drop the four-switch Advanced panel
   built further down; that is retired, so the right-click is swallowed
   (nothing opens, and the browser's own menu cannot drop over the app).
   The panel's own code is left where it is, unbuilt: the features behind
   its four switches are untouched, they simply have no switch on the gear
   any more. ── */
(function(){
  const applyCfg = function(k){
    try{ if(typeof applyConfig === 'function') applyConfig(k); }catch(e){}
  };

  const ROWS = [
    { icon:'layout-split', name:'Overlay',               desc:'Floating pane over the whole app',
      get:function(){ return !!S.config.expOverlay; },
      set:function(v){ S.config.expOverlay = v; },
      apply:function(){ applyCfg('expOverlay'); } },
    { icon:'list-nested',  name:'Remixing',              desc:'Tidy your text into proper paragraphs',
      get:function(){ return !!S.config.expOrganize; },
      set:function(v){ S.config.expOrganize = v; },
      apply:null },
    { icon:'translate',    name:'What you like',         desc:'Hindi ⇄ English',
      get:function(){ return !!(S.config.plugins && S.config.plugins.hinglish); },
      set:function(v){ S.config.plugins = S.config.plugins || {}; S.config.plugins.hinglish = v; },
      apply:null },
    { icon:'fonts',        name:'Intermixing',           desc:'Your three fonts take turns as you type',
      get:function(){ return !!S.config.expMixedFonts; },
      set:function(v){ S.config.expMixedFonts = v; },
      apply:function(){ applyCfg('expMixedFonts'); } }
  ];

  /* The inline settings that live under each switch — a switch alone is
     not enough: each feature gets its real controls right here. */
  const SUBS = [
    { /* Overlay */
      html:function(){
        return '<span class="sf-adv-sub-label">Overlay settings</span>'
          + '<div class="sf-adv-sub-row"><label>Width</label>'
          + '<select class="sel" data-adv-w="1">'
          + [480,560,640,760,900].map(function(w){
              return '<option value="'+w+'"'+((S.config.overlay&&S.config.overlay.w)===w?' selected':'')+'>'+w+' px</option>';
            }).join('')
          + '</select></div>'
          + '<div class="sf-adv-sub-row"><label>Height</label>'
          + '<select class="sel" data-adv-h="1">'
          + [320,420,500,600].map(function(h){
              return '<option value="'+h+'"'+((S.config.overlay&&S.config.overlay.h)===h?' selected':'')+'>'+h+' px</option>';
            }).join('')
          + '</select></div>'
          + '<button type="button" class="sf-adv-sub-btn" data-adv-fix="1"><i class="bi bi-arrow-clockwise"></i> Reset position to screen centre</button>';
      } },
    { /* Remixing */
      html:function(){
        return '<span class="sf-adv-sub-label">Remixing</span>'
          + '<p class="sf-adv-sub-note">Runs on the text in the editor — your own words, just tidied into clear paragraphs.</p>'
          + '<button type="button" class="sf-adv-sub-btn" data-adv-org="1"><i class="bi bi-list-nested"></i> Organise the text now</button>';
      } },
    { /* What you like */
      html:function(){
        const t = (S.config.liveBarTarget === 'english') ? 'english' : 'devanagari';
        return '<span class="sf-adv-sub-label">What you like</span>'
          + '<div class="sf-adv-sub-row"><label>Transliterate into</label>'
          + '<select class="sel" data-adv-live="1">'
          + '<option value="devanagari"'+(t==='devanagari'?' selected':'')+'>Hindi (देवनागरी)</option>'
          + '<option value="english"'+(t==='english'?' selected':'')+'>English</option>'
          + '</select></div>';
      } },
    { /* Intermixing */
      html:function(){
        if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['','',''];
        const opts = function(cur){
          return '<option value="">Editor font</option>'
            + (window.FONTS || []).map(function(f){
                return '<option value="'+f.name+'"'+(f.name===cur?' selected':'')+'>'+f.name+'</option>';
              }).join('');
        };
        /* three ways only, in this order: letter · word · sentence */
        const SCOPES = ['letter','word','sentence'];
        let sc = S.config.mixedFontScope;
        if(SCOPES.indexOf(sc) < 0) sc = 'letter';
        if(sc !== S.config.mixedFontScope) S.config.mixedFontScope = sc;
        const sel4 = function(v){ return sc === v ? ' selected' : ''; };
        return '<span class="sf-adv-sub-label">Intermixing</span>'
          + '<p class="sf-adv-sub-note">Your three fonts take turns as you type.</p>'
          + [0,1,2].map(function(i){
              return '<div class="sf-adv-sub-row"><label>Font '+(i+1)+'</label>'
                + '<select class="sel" data-adv-font="'+i+'">'+opts(S.config.mixedFonts[i])+'</select></div>';
            }).join('')
          + '<div class="sf-adv-sub-row"><label>Rotate by</label>'
          + '<select class="sel" data-adv-scope="1">'
          + '<option value="letter"'+sel4('letter')+'>Letter randomisation</option>'
          + '<option value="word"'+sel4('word')+'>Word randomisation</option>'
          + '<option value="sentence"'+sel4('sentence')+'>Sentence randomisation</option>'
          + '</select></div>';
      } }
  ];

  /* Working options — none: the switches carry their settings above */
  const OPTS = [];

  let panel = null;
  const openSub = {};

  const build = function(){
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'sf-adv';
    panel.id = 'sfAdv';
    panel.hidden = true;
    panel.innerHTML =
      '<div class="sf-adv-head"><i class="bi bi-sliders"></i><span></span></div>'
      + '<div class="sf-adv-body">' + ROWS.map(function(r, i){
          const sub = SUBS[i] ? SUBS[i].html() : '';
          return '<button type="button" class="sf-adv-row' + (openSub[i] ? ' open' : '') + '" data-adv="' + i + '">'
            + '<span class="sf-adv-ic"><i class="bi bi-' + r.icon + '"></i></span>'
            + '<span class="sf-adv-txt"><b>' + r.name + '</b><em>' + r.desc + '</em></span>'
            + '<span class="sf-adv-caret"><i class="bi bi-chevron-down"></i></span>'
            + '<span class="sf-adv-tgl"></span></button>'
          + '<div class="sf-adv-sub" data-adv-sub="' + i + '">' + sub + '</div>';
        }).join('') + '</div>'
      + (OPTS.length
          ? '<div class="sf-adv-sep"></div>'
            + '<div class="sf-adv-opts">' + OPTS.map(function(o, i){
                return '<button type="button" class="sf-adv-opt" data-adv-opt="' + i + '">'
                  + '<span class="sf-adv-ic"><i class="bi bi-' + o.icon + '"></i></span>'
                  + '<span class="sf-adv-txt"><b>' + o.label + '</b><em>' + o.hint + '</em></span>'
                  + '<span class="sf-adv-go"><i class="bi bi-arrow-right"></i></span></button>';
              }).join('') + '</div>'
          : '');
    document.body.appendChild(panel);
    return panel;
  };

  const paint = function(){
    if(!panel) return;
    ROWS.forEach(function(r, i){
      const row = panel.querySelector('[data-adv="' + i + '"]');
      if(row) row.classList.toggle('on', !!r.get());
    });
  };

  const place = function(anchor){
    const p = build();
    const r = anchor.getBoundingClientRect();
    p.hidden = false;
    const w = p.offsetWidth || 296;
    const vw = window.innerWidth || 1200;
    let left = Math.round(r.right - w);
    left = Math.max(8, Math.min(left, vw - w - 8));
    p.style.left = left + 'px';
    p.style.top  = Math.round(r.bottom + 8) + 'px';
    paint();
  };

  /* the gear's right-click: swallowed, and nothing opens behind it */
  document.addEventListener('contextmenu', function(e){
    const b = e.target && e.target.closest && e.target.closest('[data-act="open-settings"]');
    if(!b) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('click', function(e){
    /* the panel is never built now, so this looks it up instead of making
       it: with nothing to open it, a click anywhere used to create an
       empty hidden #sfAdv and leave it on the page */
    const p = document.getElementById('sfAdv');
    if(!p || p.hidden) return;
    const t = e.target;
    if(!t || !t.closest) return;

    const caret = t.closest('.sf-adv-caret');
    if(caret){
      e.preventDefault();
      e.stopPropagation();
      const row = caret.closest('[data-adv]');
      if(row){
        const i = parseInt(row.dataset.adv, 10);
        openSub[i] = !openSub[i];
        row.classList.toggle('open', !!openSub[i]);
        const sub = panel.querySelector('[data-adv-sub="' + i + '"]');
        if(sub && SUBS[i]) sub.innerHTML = SUBS[i].html();
      }
      return;
    }
    const row = t.closest('[data-adv]');
    if(row){
      e.preventDefault();
      e.stopPropagation();
      const r = ROWS[parseInt(row.dataset.adv, 10)];
      if(!r) return;
      r.set(!r.get());
      if(r.apply) r.apply();
      if(typeof save === 'function') save();
      paint();
      if(typeof renderChapterControls === 'function'){ try{ renderChapterControls(); }catch(err){} }
      return;
    }
    const opt = t.closest('[data-adv-opt]');
    if(opt){
      e.preventDefault();
      e.stopPropagation();
      const o = OPTS[parseInt(opt.dataset.advOpt, 10)];
      if(o){ p.hidden = true; o.run(); }
      return;
    }
    const subBtn = t.closest('[data-adv-fix],[data-adv-org]');
    if(subBtn){
      e.preventDefault(); e.stopPropagation();
      if(subBtn.hasAttribute('data-adv-fix')){
        if(S.config.overlay){ S.config.overlay.x = null; S.config.overlay.y = null; }
        if(typeof save === 'function') save();
        if(window.overlayShow){ overlayShow(true); }
        if(typeof toast === 'function') toast('Overlay re-centred');
      } else {
        p.hidden = true;
        if(window.AI_FNS && window.AI_FNS.organize){ window.AI_FNS.organize(); }
        else if(typeof toast === 'function') toast('Open the editor first', 'warn');
      }
      return;
    }
    if(!t.closest('#sfAdv')) p.hidden = true;
  }, true);

  /* selects inside the inline settings live on change, not click */
  document.addEventListener('change', function(e){
    const t = e.target;
    if(!t || !t.dataset || !panel || panel.hidden) return;
    const saveCfg = function(){ if(typeof save === 'function') save(); };
    if(t.dataset.advW){
      S.config.overlay = S.config.overlay || {};
      S.config.overlay.w = parseInt(t.value, 10) || 640;
      saveCfg(); if(window.overlayShow) overlayShow(true);
    } else if(t.dataset.advH){
      S.config.overlay = S.config.overlay || {};
      S.config.overlay.h = parseInt(t.value, 10) || 420;
      saveCfg(); if(window.overlayShow) overlayShow(true);
    } else if(t.dataset.advLive){
      S.config.liveBarTarget = t.value;
      saveCfg();
    } else if(t.dataset.advFont !== undefined && t.dataset.advFont !== ''){
      const fi = parseInt(t.dataset.advFont, 10);
      if(!Array.isArray(S.config.mixedFonts)) S.config.mixedFonts = ['','',''];
      S.config.mixedFonts[fi] = t.value;
      saveCfg();
    } else if(t.dataset.advScope){
      /* only the three real modes — “random from the three” is gone */
      const ok = ['letter','word','sentence'];
      S.config.mixedFontScope = ok.indexOf(t.value) >= 0 ? t.value : 'word';
      saveCfg();
      if(typeof renderChapterControls === 'function'){ try{ renderChapterControls(); }catch(err){} }
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel && !panel.hidden) panel.hidden = true;
  }, true);
})();

/* ── 14 · Plan — a visual beat board ──
   Index cards in a grid, one per beat, colour-coded by type — the beat
   board / scene board for a novel or a screenplay. Drag a card to move it.
   `renderBeats()` is replaced, so every existing beat command (add, type,
   text, delete, act, scene, clear) redraws the board. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const TYPES = ['beat','scene','chapter','act','subplot','reveal','action'];
  const TONES = {
    act:'#8b5cf6', scene:'#22c55e', chapter:'#eab308', subplot:'#38bdf8',
    reveal:'#f97316', action:'#f43f5e', beat:'#7c8899'
  };

  const beats = function(){
    const d = (typeof D === 'function') ? D() : null;
    if(!d) return [];
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };

  window.renderBeats = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    const list = beats();

    if(!list.length){
      board.innerHTML = '<div class="beat-empty"><i class="bi bi-columns-gap"></i>'
        + '<div>No beats yet — press <b>Add beat</b> to start the board.</div></div>';
      return;
    }

    board.innerHTML = list.map(function(b, i){
      const tone = TONES[b.type] || TONES.beat;
      return '<article class="beat-card" data-beat-card="' + i + '" style="--beat-tone:' + tone + '">'
        + '<div class="beat-card-head">'
        +   '<span class="beat-grab" title="Drag to move this beat"><i class="bi bi-grip-vertical"></i></span>'
        +   '<span class="beat-index">' + String(i + 1).padStart(2, '0') + '</span>'
        +   '<select class="beat-type" data-beat-type="' + i + '">'
        +     TYPES.map(function(t){
                return '<option value="' + t + '"' + (b.type === t ? ' selected' : '') + '>' + t + '</option>';
              }).join('')
        +   '</select>'
        +   '<button class="beat-del" data-beat-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
        + '</div>'
        + '<textarea class="beat-input" data-beat-text="' + i + '" placeholder="What happens in this beat…">'
        +   esc(b.text || '')
        + '</textarea>'
        + '</article>';
    }).join('');
  };

  /* ── drag a card to a new place on the board ── */
  let dragEl = null, dragIdx = null, dragging = false, sx = 0, sy = 0;

  const cardAt = function(x, y){
    const el = document.elementFromPoint ? document.elementFromPoint(x, y) : null;
    return (el && el.closest) ? el.closest('.beat-card') : null;
  };
  const clearMarks = function(){
    document.querySelectorAll('.beat-card.beat-dragging, .beat-card.beat-over').forEach(function(c){
      c.classList.remove('beat-dragging');
      c.classList.remove('beat-over');
    });
    document.body.classList.remove('ol-dragging');
  };

  const wireBoard = function(root){
    const board = root.querySelector('#beatList');
    if(!board) return;

    board.addEventListener('pointerdown', function(e){
      const t = e.target;
      if(!t || !t.closest) return;
      if(t.closest('select, button, textarea, option, .beat-del')) return;
      const card = t.closest('.beat-card');
      if(!card) return;
      dragEl = card;
      dragIdx = parseInt(card.dataset.beatCard, 10);
      dragging = false;
      sx = e.clientX; sy = e.clientY;
      try{ card.setPointerCapture(e.pointerId); }catch(err){}
    });

    board.addEventListener('pointermove', function(e){
      if(!dragEl) return;
      if(!dragging){
        if(Math.abs(e.clientX - sx) < 5 && Math.abs(e.clientY - sy) < 5) return;
        dragging = true;
        dragEl.classList.add('beat-dragging');
        document.body.classList.add('ol-dragging');
      }
      if(e.cancelable) e.preventDefault();
      const over = cardAt(e.clientX, e.clientY);
      document.querySelectorAll('.beat-card.beat-over').forEach(function(c){ if(c !== over) c.classList.remove('beat-over'); });
      if(over && over !== dragEl) over.classList.add('beat-over');
    });

    const finish = function(e, cancelled){
      if(!dragEl) return;
      const wasDragging = dragging;
      const over = (!cancelled && wasDragging) ? cardAt(e.clientX, e.clientY) : null;
      const from = dragIdx;
      const to   = over ? parseInt(over.dataset.beatCard, 10) : null;
      dragEl = null; dragIdx = null; dragging = false;
      clearMarks();
      if(cancelled || !wasDragging || to == null || from == null || from === to || isNaN(to)) return;
      const list = beats();
      const moved = list.splice(from, 1)[0];
      list.splice(Math.max(0, Math.min(to, list.length)), 0, moved);
      if(typeof save === 'function') save();
      window.renderBeats();
    };

    board.addEventListener('pointerup', function(e){ finish(e, false); });
    board.addEventListener('pointercancel', function(e){ finish(e, true); });
  };

  PAGE_RENDERERS.plan = function(root){
    /* The head is the page's own bar — the same box Draft and Idea wear —
       and it sits above the board card, not inside it. */
    root.innerHTML =
      '<div class="page-head ol-head plan-head">'
      +   '<div class="ol-head-left">'
      +     '<button class="ol-btn ol-btn-icon" data-typop="plan" title="Font, size and leading"><i class="bi bi-fonts"></i></button>'
      +     '<button class="ol-btn" data-act="add-beat" title="Add a beat card"><i class="bi bi-plus-lg"></i> Add beat</button>'
      +   '</div>'
      +   '<div class="ol-actions plan-tools">'
      +     '<button class="ol-btn" data-act="add-act" title="Add an act heading"><i class="bi bi-bookmark-star"></i> Add act</button>'
      +     '<button class="ol-btn" data-act="add-scene" title="Add a scene beat"><i class="bi bi-film"></i> Add scene</button>'
      +     '<button class="ol-btn" data-act="clear-beats" title="Remove every beat"><i class="bi bi-eraser"></i> Clear</button>'
      +   '</div>'
      + '</div>'
      + '<div class="plan-wrap">'
      +   '<div class="beat-board" id="beatList"></div>'
      + '</div>';

    renderBeats();
    wireBoard(root);
    if(typeof typoApply === 'function') typoApply('plan', root);
  };
})();

/* ── 15 · Bible tab ──
   This used to force the Bible open on its Timeline tab. There is no
   Timeline tab any more, so the panel opens on the first category it has. */

/* ── 16 · A menu that knows where you are ──
   The FAB's right-click AI panel used to be the same seven buttons on every
   page. Now each page gets the options that belong to it — Outline titles,
   Idea prompts, Bible memory, board production help, Plan beats — each one
   carrying the whole project as context so the answer is never generic. ── */

/* the project, as the AI needs to see it */
function sfProjectBrief(){
  const d = (typeof D === 'function') ? D() : {};
  const proj = (typeof kbProj === 'function') ? kbProj() : null;
  const out = [];

  out.push('TITLE: ' + ((proj && proj.name) || 'Untitled') +
           '  |  FORM: ' + (S.mode === 'screenplay' ? 'screenplay / script' : 'novel'));

  const structure = [];
  (d.chapters || []).forEach(function(c, i){
    structure.push((i + 1) + '. ' + (c.title || 'Untitled'));
    (c.children || []).forEach(function(s){ structure.push('      - ' + (s.title || 'Untitled')); });
  });
  if(structure.length) out.push('STRUCTURE (chapters and subchapters):\n' + structure.join('\n'));

  const names = function(arr){
    return (arr || []).slice(0, 24).map(function(e){ return e.name || e.title || ''; })
      .filter(Boolean).join(', ');
  };
  const bag = (typeof bbBag === 'function') ? bbBag() : (d.bible || {});
  const bible = [];
  if(names(bag.characters).length) bible.push('Characters: '    + names(bag.characters));
  if(names(bag.locations).length)  bible.push('Locations: '     + names(bag.locations));
  if(names(bag.items).length)      bible.push('Items: '         + names(bag.items));
  if(names(bag.concepts).length)   bible.push('Concepts: '      + names(bag.concepts));
  if(names(d.timeline).length)     bible.push('Timeline: '      + names(d.timeline));
  if(bible.length) out.push('BIBLE:\n' + bible.join('\n'));

  const beats = (d.beats || []).slice(0, 30)
    .map(function(b, i){ return (i + 1) + '. [' + (b.type || 'beat') + '] ' + (b.text || ''); }).join('\n');
  if(beats) out.push('PLAN / BEAT BOARD:\n' + beats);

  const cur = (typeof curCh === 'function') ? curCh() : null;
  if(cur && cur.content){
    const body = String(cur.content).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, 1800);
    if(body) out.push('CURRENT SECTION — "' + (cur.title || 'Untitled') + '":\n' + body);
  }
  return out.join('\n\n');
}

function sfAsk(title, sub, prompt){
  if(typeof runAI === 'function') runAI(prompt, title, sub);
}

/* one line of the FAB menu, with its description under it */
const SF_FAB_OPT = function(o){
  return '<button class="fab-ai-opt" data-fabai="' + o.fn + '" title="' + esc(o.desc) + '">'
    + '<span class="fa-ic"><i class="bi bi-' + o.icon + '"></i></span>'
    + '<span class="fa-txt"><b>' + esc(o.label) + '</b><em>' + esc(o.desc) + '</em></span>'
    + '</button>';
};

const SF_FAB_AI = {
  /* The Outline page names its units by the form you are writing: a novel has
     chapters and subchapters, a screenplay has scenes and sub-scenes. The
     novel is the list here and the fallback; fab-fix.js re-writes these four
     labels in the form's own words as the panel is drawn.

     Two of the four are the TITLE jobs and two are the DESCRIPTION jobs, and
     they are separate jobs on purpose: a title is a name, a description is
     what the section is for. The two here are the titles — the outline's own
     rows carry the descriptions, and the description jobs (olChapterSubs ·
     olSubSubs, added by outline-menu.js) sit right under each of these. */
  outline: [
    { fn:'olChapterTitles', icon:'bookmark-fill', label:'Chapter titles',
      desc:'A name for every chapter, from your outline' },
    { fn:'olSubTitles', icon:'signpost-2', label:'Subchapter titles',
      desc:'A name for every subchapter' },
    { fn:'olStructure', icon:'list-nested', label:'Check the order',
      desc:'Is the chapter order working? What should move?' }
  ],
  inspire: [
    { fn:'ideaPromptMe', icon:'lightbulb-fill', label:'Prompt me',
      desc:'A fresh prompt built from this project' },
    { fn:'ideaDevelop', icon:'diagram-3', label:'Develop this idea',
      desc:'Turn the prompt on screen into a scene plan' },
    { fn:'ideaToScene', icon:'camera-reels', label:'Turn into a scene',
      desc:'Write the first paragraphs of the scene' }
  ],
  bible: [
    { fn:'bibleRemember', icon:'journal-bookmark', label:'Remember the whole story',
      desc:'Summarise characters, places, concepts and the timeline' },
    { fn:'bibleGaps', icon:'question-circle', label:'Find the gaps',
      desc:'What does the Bible still not explain?' },
    { fn:'bibleTimeline', icon:'git', label:'Tidy the timeline',
      desc:'Put the timeline entries in a workable order' }
  ],
  kanban: [
    { fn:'kbNext', icon:'kanban', label:'What to write next',
      desc:'Production help — pick the next card from the board' },
    { fn:'kbStatus', icon:'clipboard-check', label:'Board status',
      desc:'Where the draft really stands, list by list' },
    { fn:'kbScenes', icon:'film', label:'Scene order',
      desc:'Arrange the cards into a shooting / writing order' }
  ],
  plan: [
    { fn:'planBeats', icon:'list-check', label:'Beat ideas',
      desc:'Suggest the beats this board is still missing' },
    { fn:'planStructure', icon:'diagram-3', label:'Check the structure',
      desc:'Read the board back — does the story hold?' }
  ]
};

const SF_FAB_DEFAULT = [
  { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
  { fn:'improve',    icon:'stars',               label:'Improve' },
  { fn:'continue',   icon:'arrow-right-circle',  label:'Continue' },
  { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
  { fn:'summarize',  icon:'card-text',           label:'Summarize' },
  { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' }
];

window.renderFabAI = function(){
  const body = document.getElementById('fabAIBody');
  if(!body) return;
  const opts = SF_FAB_AI[S.page];

  if(!opts){
    body.innerHTML = SF_FAB_DEFAULT.map(function(a){
      return '<button class="ai-chip" data-ai="' + a.fn + '"><i class="bi bi-' + a.icon + '"></i> ' + a.label + '</button>';
    }).join('') + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>';
    return;
  }

  body.innerHTML =
    '<div class="fab-ai-sec">For this page</div>'
    + opts.map(SF_FAB_OPT).join('')
    + (S.page === 'bible'
        ? '<div class="fab-ai-ask"><input class="ai-input" data-fabai-input placeholder="Ask about a character, place or event…">'
          + '<button class="ai-chip primary" data-fabai-ask><i class="bi bi-send"></i></button></div>'
        : '')
    + '<div class="fab-ai-sec">Text</div>'
    + '<button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>';
};

document.addEventListener('click', function(e){
  const t = e.target;
  if(!t || !t.closest) return;

  const opt = t.closest('[data-fabai]');
  if(opt){
    e.preventDefault();
    const fn = opt.dataset.fabai;
    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    if(window.AI_FNS && window.AI_FNS[fn]) window.AI_FNS[fn]();
    return;
  }
  const ask = t.closest('[data-fabai-ask]');
  if(ask){
    e.preventDefault();
    const box = document.querySelector('[data-fabai-input]');
    const q = box ? box.value.trim() : '';
    if(!q) return;
    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    if(window.AI_FNS && window.AI_FNS.bibleAsk) window.AI_FNS.bibleAsk(q);
  }
}, true);

/* ── the page-aware actions themselves ── */
(function(){
  const F = (window.AI_FNS = window.AI_FNS || {});

  F.olChapterTitles = function(){
    sfAsk('Chapter titles', 'From your outline',
      'You are a story editor helping a writer name their chapters.\n\n' +
      sfProjectBrief() + '\n\n' +
      'Task: suggest one strong, specific chapter title for EVERY chapter in the structure above.\n' +
      'Rules: 2–5 words each, evocative, no numbers in the title, same voice across all of them, and do not invent chapters that are not listed.\n' +
      'Reply as a plain list — "chapter number. title" — and nothing else.');
  };

  F.olSubTitles = function(){
    sfAsk('Subchapter titles', 'From your outline',
      'You are a story editor helping a writer name their subchapters (the scenes inside each chapter).\n\n' +
      sfProjectBrief() + '\n\n' +
      'Task: for every chapter above that has subchapters, suggest a title for each subchapter.\n' +
      'Rules: 2–5 words, concrete, in the same voice; keep them in the order they appear.\n' +
      'Reply as a plain list — "chapter — subchapter: title" — and nothing else.');
  };

  F.olStructure = function(){
    sfAsk('Structure check', 'Outline',
      'You are a developmental editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: read the chapter and subchapter order above and tell the writer, plainly and briefly:\n' +
      '1. what is working in the order,\n2. which chapter or subchapter is in the wrong place, and where it should go,\n3. the single change that would help most.\n' +
      'Keep it under 250 words. No praise padding.');
  };

  F.ideaDevelop = function(){
    const idea = (window.SF_IDEA && window.SF_IDEA.current()) || '';
    sfAsk('Developing the idea', 'Idea → scene plan',
      'You are a story developer.\n\n' + sfProjectBrief() + '\n\n' +
      'The idea on the table is:\n"' + (idea || '(none yet — propose one)') + '"\n\n' +
      'Task: turn it into a short scene plan for THIS project — who is in it, what they want, what goes wrong, how it ends.\n' +
      'Use the characters and places already in the Bible wherever you can. Under 250 words.');
  };

  F.ideaToScene = function(){
    const idea = (window.SF_IDEA && window.SF_IDEA.current()) || '';
    sfAsk('Writing the scene', 'Idea → draft',
      'You are a novelist drafting prose in the writer\'s own project.\n\n' + sfProjectBrief() + '\n\n' +
      'Write the opening of a scene based on this idea:\n"' + (idea || '(choose something that fits the story)') + '"\n\n' +
      'Rules: plain, concrete prose; no headings; about 300 words; leave the scene mid-motion.');
  };

  F.bibleRemember = function(){
    sfAsk('The whole story', 'Bible',
      'You are the keeper of this story\'s bible.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: write a compact memory of this story that another writer could pick up:\n' +
      'the cast (one line each), the places that matter, the timeline in order, and the threads still open.\n' +
      'Only use what is above — never invent a name that is not there. Under 400 words.');
  };

  F.bibleGaps = function(){
    sfAsk('Gaps in the Bible', 'Bible',
      'You are a continuity editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: list what this story bible still does not explain — unnamed characters who matter, places with no description,\n' +
      'timeline holes, motives missing for anyone in the cast. Give each gap as one line, most important first.');
  };

  F.bibleTimeline = function(){
    sfAsk('Timeline order', 'Bible',
      'You are a continuity editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: take the timeline entries above and return them in the order the reader should learn them,\n' +
      'then note any entry that contradicts another. Keep it short and concrete.');
  };

  F.bibleAsk = function(q){
    sfAsk('Answering from the Bible', 'Your question',
      'You are answering a writer about their own story bible.\n\n' + sfProjectBrief() + '\n\n' +
      'Question: ' + q + '\n\n' +
      'Answer from the bible above. If the answer is not in it, say what is missing and suggest the entry to add.\n' +
      'Never invent established facts. Be brief.');
  };

  F.kbNext = function(){
    sfAsk('What to write next', 'Production',
      'You are a production editor for this book.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: from the board and the structure above, name the ONE section the writer should work on next and why (two lines),\n' +
      'then three things to do in it. Be decisive — give one answer, not a menu.');
  };

  F.kbStatus = function(){
    sfAsk('Board status', 'Kanban',
      'You are a production editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: report where this draft actually stands — what is done, what is stuck, what has not been started,\n' +
      'and where the bottleneck is. Under 250 words, plain sentences.');
  };

  F.kbScenes = function(){
    sfAsk('Scene order', 'Kanban',
      'You are a story editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: arrange the sections above into the order they should be written (not read), grouping them so that\n' +
      'each writing session has a clear goal. Give the list, then one line of reasoning.');
  };

  F.planBeats = function(){
    sfAsk('Missing beats', 'Plan',
      'You are a story editor working on a beat board.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: name the beats this board is still missing — the turn, the midpoint, the low point, the resolution —\n' +
      'and for each one say in a line what should happen. Match the beat types already on the board.');
  };

  F.planStructure = function(){
    sfAsk('Structure check', 'Plan',
      'You are a story editor.\n\n' + sfProjectBrief() + '\n\n' +
      'Task: read the beat board back to the writer and say whether the story holds — what escalates, what repeats,\n' +
      'what is missing. End with the one beat to add next. Under 250 words.');
  };
})();

/* ── 17 · Idea — the prompt is written for THIS project ──
   The five category chips are gone from the page; they moved into the small
   AI settings popover beside “Prompt me”. Saved prompts now carry a title. ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const FOCUS = [
    { id:'any',       name:'Any',       icon:'shuffle' },
    { id:'scene',     name:'Scene',     icon:'camera-reels' },
    { id:'character', name:'Character', icon:'person' },
    { id:'dialogue',  name:'Dialogue',  icon:'chat-quote' },
    { id:'structure', name:'Structure', icon:'diagram-3' }
  ];
  const TONES = ['Creative','Dramatic','Playful','Poetic','Simple','Dark'];

  const cfg = function(){
    if(!S.config.ideaAI) S.config.ideaAI = {};
    if(!S.config.ideaAI.focus) S.config.ideaAI.focus = 'any';
    if(!S.config.ideaAI.tone)  S.config.ideaAI.tone  = 'Creative';
    return S.config.ideaAI;
  };

  const saved = function(){
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts.map(function(p){
      return (typeof p === 'string') ? { title:'', text:p } : p;
    });
  };

  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '…' : t) || 'Untitled prompt';
  };

  let current = '';
  let page = 0;
  window.SF_IDEA = { current:function(){ return current; } };

  const showPrompt = function(){ if(SF_IDEA_DRAW) SF_IDEA_DRAW(); };

  let SF_IDEA_DRAW = null;

  const copyText = function(txt){
    txt = String(txt || '');
    if(!txt) return;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        if(typeof toast === 'function') toast('Copied');
        return;
      }
    }catch(e){}
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); if(typeof toast === 'function') toast('Copied'); }catch(e){}
    ta.remove();
  };

  /* How many rows fit is read from the column itself — and that read is the
     whole reason the list used to stop short of the bottom. It ran while
     the page was still being laid out, so the column reported a height it
     did not end up with: nine prompts in a tall column were cut at seven,
     the pager read 1–7, and the rest went to page two with empty space
     under the rows. The pass runs again on the next frame, when the
     height is real, and again whenever the column is resized. */
  /* ── HOW MANY ROWS FIT ──
     A row of this list is a 44px line. The count used to divide the
     column by 62, which is 18px more than a row: a 575px column holds
     thirteen of them and the count was asking for nine, so nine prompts
     were shown, the other three went to page two, and the bottom 177px
     of the column stood empty. The row's own height is measured now, and
     the count is what the column can really hold. */
  const perPage = function(){
    const rows = document.getElementById('ideaRows');
    if(!rows) return 10;
    const cs = getComputedStyle(rows);
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const gap = parseFloat(cs.rowGap) || 3;
    const room = Math.max(0, rows.clientHeight - pad);
    /* AS MANY AS THE COLUMN HOLDS - the Bible's own left card is the
       reference. A row here is the dashboard project card's own 38px line
       (34px on a short window), and the page is the column divided by that
       line, so a page fills the card from its top to its foot. A cap of ten
       is what used to leave the bottom of the card standing empty under the
       tenth row. Nothing stretches a page: the height of a row on screen IS
       the line the list is drawn with, it is read back, and the count
       follows what the column really holds. */
    /* The line a row is drawn on is read from the grid's own track, not
       from whichever row happens to be on screen: on the first pass a row
       can still be undressed and report the 34px it has before the page's
       own styles have landed - that asked for fifteen rows in a column
       that holds fourteen, and the fifteenth was clipped at the card's
       foot. The track is the number the rows are actually drawn with. */
    const track = parseFloat(cs.gridAutoRows);
    const one = rows.querySelector('.idea-row');
    const ROW = (track > 0) ? track : ((one && one.offsetHeight) ? one.offsetHeight : 38);
    return Math.max(2, Math.floor((room + gap) / (ROW + gap)) || 10);
  };
  /* What the column was last laid out FOR is the number of rows, not its
     height: a pass that re-drew the list whenever the height moved redrew
     it once more the moment New prompt had opened its name field, and the
     field went with the rows. Only a real change of capacity redraws. */
  let renderedPer = -1;
  let settlePasses = 0;
  const settleList = function(){
    const rows = document.getElementById('ideaRows');
    if(!rows){ settlePasses = 0; return; }
    /* a row being named holds the list still */
    if(document.querySelector('#page-inspire .idea-rename')) return;
    if(perPage() === renderedPer){ settlePasses = 0; return; }
    /* the column can grow a step at a time as the rest of the page settles,
       so one redraw is not enough — it looks again until the capacity stops
       moving, and never chases it further than a handful of steps */
    if(++settlePasses > 6){ settlePasses = 0; return; }
    renderSaved();
    soonSettle();
  };
  const soonSettle = function(){
    if(typeof requestAnimationFrame !== 'function'){ setTimeout(settleList, 0); return; }
    requestAnimationFrame(function(){ requestAnimationFrame(settleList); });
  };
  /* and one more look a beat later. The column finishes settling AFTER the
     frame the list was drawn in - the head, the pager and the fonts all
     land in their own time - and the count has to be the one the box ends
     up wearing, not the one it had while it was still being measured. The
     page settles into the same count on every later look, so this is one
     extra pass and not a loop: a pass that finds the count already right
     schedules nothing. */
  const laterSettle = function(){
    settlePasses = 0;
    [260, 900, 2400].forEach(function(ms){ setTimeout(soonSettle, ms); });
  };
  window.addEventListener('resize', soonSettle);
  /* the column's own size, watched: the rest of the page settles in steps
     after the first paint (the strip, the pickers, the fonts), so the list
     is told again whenever the room it has to fill actually moves */
  let watchedRows = null, rowsObserver = null;
  const watchRowsBox = function(box){
    if(!box || box === watchedRows || typeof ResizeObserver !== 'function') return;
    if(!rowsObserver) rowsObserver = new ResizeObserver(function(){ settlePasses = 0; soonSettle(); });
    if(watchedRows) rowsObserver.unobserve(watchedRows);
    watchedRows = box;
    rowsObserver.observe(box);
  };

  const renderSaved = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    watchRowsBox(box);
    /* The filter box above the list narrows it before it is cut into pages,
       the way the Bible's box does, so the pager and the count describe what
       is really on screen. `all` stays the whole list: every row and every
       tool carries an index into savedPrompts (data-idea-open, -copy, -del),
       so the index a row is drawn with has to survive the filter. */
    const all  = saved();
    const qEl  = document.getElementById('ideaQuery');
    const q    = (qEl && qEl.value ? qEl.value : '').trim().toLowerCase();
    const list = q
      ? all.filter(function(p){
          return String(p.title || '').toLowerCase().indexOf(q) >= 0
              || String(p.text  || '').toLowerCase().indexOf(q) >= 0;
        })
      : all;
    const per  = perPage();
    renderedPer = per;              /* what this pass was laid out for */
    const pages = Math.max(1, Math.ceil(list.length / per));
    page = Math.max(0, Math.min(page, pages - 1));
    const from = page * per;
    const slice = list.slice(from, from + per);
    /* Every row keeps the dashboard project card's own 38px line and no
       page is ever stretched: the rows are packed from the top of the list
       and the count above is what the column really holds, so the last row
       sits on the bottom edge of the list, at the pager - this is how the
       Bible's own left card fills itself, and the Bible's card is what the
       list is measured against. Stretching a page's rows to share the
       column instead came out 55px tall with the title floating in the
       middle of each one, which does not read as a list of prompts. */
    if(from > 0 && !slice.length && list.length){ page = 0; return renderSaved(); }

    box.innerHTML = slice.length
      ? slice.map(function(p){
          const i = all.indexOf(p);
          const t = p.title || titleOf(p.text);
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-txt"><b>' + esc(t) + '</b>'
            +   '<em>' + esc(p.text) + '</em></span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : (q
          ? '<div class="idea-empty">No saved prompt matches this filter.</div>'
          : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>');

    const count = document.getElementById('ideaCount');
    if(count) count.textContent = String(list.length);
    const range = document.getElementById('ideaRange');
    /* The dashboard's own numbering: the page you are on, then the row that
       PAGE ends at - 1-10, 2-20, 3-30 - not the first row it shows. */
    if(range) range.textContent = list.length ? ((page + 1) + '-' + Math.min((page + 1) * per, list.length)) : '0';
    const prev = document.querySelector('#page-inspire [data-idea-page="-1"]');
    const next = document.querySelector('#page-inspire [data-idea-page="1"]');
    if(prev) prev.disabled = page <= 0;
    if(next) next.disabled = page >= pages - 1;

    /* The column can still be moving while the count above is read - the
       head, the pager, the pickers and the fonts all settle it in steps -
       and a pass that drew more rows than the box then has room for leaves
       the last of them clipped at the card's foot. The rows just drawn are
       measured against the box they were drawn in: a pass that ran over is
       asked for again, and the count it is asked for is the one the box
       really holds. (The Bible's list has the same guard by construction:
       its page size is the column divided by the row.) */
    if(slice.length && box.scrollHeight - box.clientHeight > 1){
      renderedPer = -1;
      soonSettle();
    }
    laterSettle();
  };

  /* the filter box above the list - the Bible's own box, same behaviour */
  document.addEventListener('input', function(e){
    if(e.target && e.target.id === 'ideaQuery'){ page = 0; renderSaved(); }
  }, true);

  const AISET = function(){
    const c = cfg();
    return '<div class="idea-ai-pop" id="ideaAIPop" hidden>'
      + '<div class="iap-head"><i class="bi bi-sliders"></i><span>Prompt AI</span></div>'
      + '<div class="iap-row"><label>Focus</label>'
      + '<select class="sel" data-iap-focus>'
      + FOCUS.map(function(f){ return '<option value="' + f.id + '"' + (c.focus === f.id ? ' selected' : '') + '>' + f.name + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="iap-row"><label>Tone</label>'
      + '<select class="sel" data-iap-tone>'
      + TONES.map(function(t){ return '<option' + (c.tone === t ? ' selected' : '') + '>' + t + '</option>'; }).join('')
      + '</select></div>'
      + '<p class="iap-note">Used only by <b>Prompt me</b> on this page — the global AI settings and the Draft chat are untouched.</p>'
      + '</div>';
  };

  PAGE_RENDERERS.inspire = function(root){
    root.innerHTML =
      '<div class="idea-wrap">'
      + '<section class="idea-main">'
      +   '<div class="idea-bar">'
      +     '<div class="idea-bar-left">'
      +       '<button class="ol-btn ol-btn-go" data-idea="prompt" title="Ask the AI for a prompt built from this project">'
      +         '<i class="bi bi-stars"></i> Prompt me</button>'
      +       '<div class="idea-ai-wrap">'
      +         '<button class="ol-btn ol-btn-icon" data-idea="ai-set" title="Prompt AI settings"><i class="bi bi-sliders"></i></button>'
      +         AISET()
      +       '</div>'
      +     '</div>'
      +     '<div class="idea-tools">'
      +       '<button class="ol-btn ol-btn-icon" data-idea="copy" title="Copy this prompt"><i class="bi bi-clipboard"></i></button>'
      +       '<button class="ol-btn ol-btn-icon" data-idea="save" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i></button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="idea-card" id="inspireBox"></div>'
      + '</section>'
      + '<aside class="idea-side">'
      +   '<div class="idea-side-head"><i class="bi bi-bookmark"></i><span>Saved prompts</span></div>'
      +   '<div class="bb-search">'
      +     '<i class="bi bi-search"></i>'
      +     '<input id="ideaQuery" placeholder="Filter…" autocomplete="off">'
      +   '</div>'
      +   '<div class="idea-rows" id="ideaRows"></div>'
      +   '<div class="idea-pager">'
      +     '<button class="mv-pager-btn" data-idea-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>'
      +     '<span class="vpl-range" id="ideaRange">0</span>'
      +     '<button class="mv-pager-btn" data-idea-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>'
      +   '</div>'
      + '</aside>'
      + '</div>';

    if(!current) current = window.SF_PICK || '';
    showPrompt();
    renderSaved();
    soonSettle();
  };

  /* draw the card (and keep a plain-text copy of what is on it) */
  let paint = function(){};
  paint = function(){
    const box = document.getElementById('inspireBox');
    if(!box) return;
    box.innerHTML = current
      ? '<p>' + esc(current) + '</p>'
      : '<p class="idea-ghost">Press <b>Prompt me</b> — the AI writes a prompt from your own outline, bible and draft.</p>';
  };
  SF_IDEA_DRAW = paint;

  const ask = async function(){
    const box = document.getElementById('inspireBox');
    const c = cfg();
    const focus = (FOCUS.filter(function(f){ return f.id === c.focus; })[0] || FOCUS[0]).name;
    if(box) box.innerHTML = '<p class="idea-busy"><i class="bi bi-stars"></i> Thinking…</p>';
    try{
      const res = await callAI(
        'You write writing prompts for one specific project.\n\n' + sfProjectBrief() + '\n\n' +
        'Task: write ONE fresh, specific prompt for this writer.\n' +
        'Focus: ' + focus + '.  Tone: ' + c.tone + '.\n' +
        'Rules: under 40 words, one idea only, no numbering, no preamble, use the names and places from the project when they fit.\n' +
        'Return only the prompt.');
      current = res.trim();
    }catch(err){
      current = '';
      if(box) box.innerHTML = '<p class="idea-err"><i class="bi bi-exclamation-triangle"></i> ' + esc(err.message) + '</p>';
      return;
    }
    paint();
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-idea="prompt"]')){ e.preventDefault(); ask(); return; }

    if(t.closest('[data-idea="ai-set"]')){
      e.preventDefault();
      const pop = document.getElementById('ideaAIPop');
      if(pop) pop.hidden = !pop.hidden;
      return;
    }
    if(t.closest('#page-inspire') && !t.closest('.idea-ai-wrap')){
      const pop = document.getElementById('ideaAIPop');
      if(pop && !pop.hidden) pop.hidden = true;
    }

    if(t.closest('[data-idea-page]')){
      e.preventDefault();
      page = Math.max(0, page + (parseInt(t.closest('[data-idea-page]').dataset.ideaPage, 10) || 1));
      renderSaved();
      return;
    }
    if(t.closest('[data-idea="copy"]')){ e.preventDefault(); copyText(current); return; }
    if(t.closest('[data-idea="save"]')){
      e.preventDefault();
      if(!current){ if(typeof toast === 'function') toast('Nothing to save yet', 'warn'); return; }
      const list = saved();
      if(list.some(function(p){ return p.text === current; })){ if(typeof toast === 'function') toast('Already saved'); return; }
      list.unshift({ title:titleOf(current), text:current });
      S.config.savedPrompts = list;
      page = 0;
      if(typeof save === 'function') save();
      renderSaved();
      if(typeof toast === 'function') toast('Prompt saved');
      return;
    }
    const cp = t.closest('[data-idea-copy]');
    if(cp){
      e.preventDefault(); e.stopPropagation();
      const p = saved()[parseInt(cp.dataset.ideaCopy, 10)];
      if(p) copyText(p.text);
      return;
    }
    const del = t.closest('[data-idea-del]');
    if(del){
      e.preventDefault(); e.stopPropagation();
      const list = saved();
      list.splice(parseInt(del.dataset.ideaDel, 10), 1);
      S.config.savedPrompts = list;
      if(typeof save === 'function') save();
      renderSaved();
      return;
    }
    const open = t.closest('[data-idea-open]');
    if(open){
      e.preventDefault();
      const p = saved()[parseInt(open.dataset.ideaOpen, 10)];
      if(p){ current = p.text; paint(); }
    }
  }, true);

  document.addEventListener('change', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;
    if(t.dataset.iapFocus){ cfg().focus = t.value; if(typeof save === 'function') save(); }
    if(t.dataset.iapTone){  cfg().tone  = t.value; if(typeof save === 'function') save(); }
  }, true);
})();

/* ── 18 · Plan — the head keeps only T and Board ── */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;
  const orig = PAGE_RENDERERS.plan;

  /* every beat-type select wears the app’s dropdown skin */
  const skin = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    Array.prototype.slice.call(board.querySelectorAll('select.beat-type')).forEach(function(s){
      s.classList.add('tb-select');
    });
  };
  if(typeof window.renderBeats === 'function'){
    const rb = window.renderBeats;
    window.renderBeats = function(){
      const r = rb.apply(this, arguments);
      skin();
      return r;
    };
  }

  PAGE_RENDERERS.plan = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    /* the three tool buttons and Clear are gone; a single grey Board
       button sits to the right of T and adds the next card */
    const left = root.querySelector('.plan-head .ol-head-left') || root.querySelector('.ol-head-left');
    const toRight = root.querySelector('.plan-head .ol-actions') || root.querySelector('.plan-tools');
    if(toRight) toRight.remove();
    if(left){
      Array.prototype.slice.call(left.children).forEach(function(c){
        if(!c.hasAttribute('data-typop')) c.remove();
      });
      if(!left.querySelector('[data-act="add-beat"]')){
        const b = document.createElement('button');
        b.className = 'ol-btn';
        b.setAttribute('data-act', 'add-beat');
        b.title = 'Add the next card to the board';
        b.innerHTML = '<i class="bi bi-columns-gap"></i> Board';
        left.appendChild(b);
      }
    }
    skin();
  };
})();

/* ── 19 · Kanban — the All-lists switch has nothing left to do ── */
(function(){
  const drop2 = function(){
    const sw = document.querySelector('[data-kb-all]');
    if(sw && sw.parentElement) sw.parentElement.removeChild(sw);
  };
  drop2();
  document.addEventListener('click', drop2, true);
})();


/* ══════════ no-pager.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Writer — the Outline's chevron pager is gone; the Outline scrolls.
   The Draft, Bible and Idea pagers were taken out here too and are back:
   asked for, in the dashboard's own shape (the skin is in final-fix.js).
   What is left of this layer is the Outline, which still scrolls, plus the
   row un-hider below for builds that left rows behind a page break.

   The Outline and the Bible were dealt with in pages-fix.js. These two
   are drawn by pages.js itself, so they are finished off here:

   · DRAFT — the list is filled by renderDrafts(), which windows the drafts
             by draftPerPage(). Returning a number nothing can reach makes
             it draw every draft, and the pager is taken out of the head.

   · IDEA  — the saved-prompt column is filled by a renderer whose
             per-page count lives inside a closure, so it cannot be turned
             off from here. The column is re-filled with every saved prompt
             instead, using the very same row markup and the same indices,
             so the page's own delegated clicks (open · copy · remove) keep
             working on the rows this draws.

   Every pass is guarded against the box it just wrote, so the mutation
   observer cannot loop.
   ═══════════════════════════════════════════════════════════ */
(function(){
  /* ── DRAFT ── */
  /* draftPerPage() is pages.js's own - it measures the panel and returns the
     rows that fit, which is exactly what the pager at the foot of the list
     pages by. It used to be pinned to Number.MAX_SAFE_INTEGER here so every
     draft was drawn at once; that override is gone with the pager's return. */

  /* Every chevron pager the app draws for a LIST is taken out, wherever it
     was put and by whichever script put it there: Draft, Idea, Outline and
     Bible all scroll instead. Removing them is idempotent, so the sweep can
     run on every repaint. */
  const PAGERS = '#page-outline .pg-pager';
  const clearPagers = function(){
    Array.prototype.forEach.call(document.querySelectorAll(PAGERS), function(p){
      if(p.parentElement) p.parentElement.removeChild(p);
    });
    /* an older build also left rows hidden behind a page break */
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-outline .ol-node, #page-bible .bb-row'),
      function(r){ if(r.style.display === 'none') r.style.display = ''; }
    );
  };

  const refillDrafts = function(){
    const rows = document.getElementById('draftRows');
    if(!rows) return;
    const d = (typeof D === 'function') ? D() : null;
    const n = (d && Array.isArray(d.drafts)) ? d.drafts.length : 0;
    if(rows.querySelectorAll('.draft-row').length === n) return;
    if(typeof window.renderDrafts === 'function') window.renderDrafts();
  };

  /* ── IDEA ── */
  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '\u2026' : t) || 'Untitled prompt';
  };
  const savedPrompts = function(){
    const list = (typeof S !== 'undefined' && S.config && Array.isArray(S.config.savedPrompts))
      ? S.config.savedPrompts : [];
    return list.map(function(p){ return (typeof p === 'string') ? { title:'', text:p } : p; });
  };

  const refillIdeaRows = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    const list = savedPrompts();
    if(box.querySelectorAll('.idea-row').length === list.length) return;   /* already all there */

    box.innerHTML = list.length
      ? list.map(function(p, i){
          const t = p.title || titleOf(p.text);
          return '<div class="idea-row" data-idea-open="' + i + '">'
            + '<span class="idea-row-txt"><b>' + esc(t) + '</b>'
            +   '<em>' + esc(p.text) + '</em></span>'
            + '<button class="ol-tool" data-idea-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>'
            + '<button class="ol-tool" data-idea-del="' + i + '" title="Remove"><i class="bi bi-trash"></i></button>'
            + '</div>';
        }).join('')
      : '<div class="idea-empty">No saved prompts yet.<br>Press <b>Save</b> to keep one here.</div>';
  };

  const sweep = function(){
    clearPagers();
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
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();


/* ══════════ plugin-panels.js ══════════ */
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


/* ══════════ ai-extras.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — AI panel extras.

   Loaded after app.js / pages-fix.js.

   The FAB's right-click card closes from its own bi-x-lg button, and
   Escape shuts it too — but only when no modal or command box wants
   the key first.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const closeAI = function(){
    const ai = document.getElementById('fabAI');
    if(ai) ai.hidden = true;
    const mn = document.getElementById('fabMenu');
    if(mn) mn.hidden = true;
    const fw = document.getElementById('fabWrap');
    if(fw) fw.classList.remove('menu-open');
  };

  /* the panel's own close button */
  document.addEventListener('click', function(e){
    const x = e.target.closest && e.target.closest('[data-fab-ai-close]');
    if(!x) return;
    e.preventDefault();
    e.stopPropagation();
    closeAI();
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;

    const ai = document.getElementById('fabAI');
    const mn = document.getElementById('fabMenu');
    if(!((ai && !ai.hidden) || (mn && !mn.hidden))) return;
    if(document.querySelector('.modal-scrim')) return;
    const cb = document.getElementById('cmdBox');
    if(cb && !cb.hidden) return;

    if(typeof toggleFabAI === 'function') toggleFabAI(false);
    closeAI();
  }, true);
})();


/* ══════════ autosave.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — snapshots & auto-backup

   The three options in Settings → General, made real:

     Auto-save      · save() every few seconds (S.config.autoSave)
     Auto-snapshot  · a restorable in-app snapshot every 10 minutes
                      (S.config.autoVersion)
     JSON backup    · a JSON copy every 10 minutes, replacing the
                      previous one (S.config.autoJson)

   Snapshots live on the project (D().versions) and can be restored
   with TOOLS.restoreSnapshot(i). The JSON copy goes to the file the
   writer linked once (File System Access API) — so it is overwritten
   in place — and falls back to the browser's Downloads folder.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const VERSION_MAX = 25;
  const TEN_MIN = 10 * 60 * 1000;
  const STAMP_KEY = 'sf6_auto_last';

  const clones = function(v){
    try{ return JSON.parse(JSON.stringify(v)); }catch(e){ return null; }
  };

  /* ── the payload a snapshot holds ── */
  const LISTS = ['chapters','drafts','ideas','notes','beats','references','timeline','cast','canvasElements'];
  const capture = function(){
    const d = D();
    const out = {};
    LISTS.forEach(function(k){ out[k] = clones(d[k] || []) || []; });
    out.bible  = clones(d.bible  || {}) || {};
    out.kanban = clones(d.kanban || {}) || {};
    if(d.planBoards)  out.planBoards  = clones(d.planBoards)  || [];
    if(d.canvasLinks) out.canvasLinks = clones(d.canvasLinks) || [];
    return out;
  };

  /* ── restore into the live arrays (they are shared with the project) ── */
  const putArr = function(arr, src){ if(!Array.isArray(arr) || !Array.isArray(src)) return; arr.length = 0; src.forEach(function(x){ arr.push(x); }); };
  const putObj = function(obj, src){
    if(!obj || typeof obj !== 'object' || !src || typeof src !== 'object') return;
    Object.keys(obj).forEach(function(k){ delete obj[k]; });
    Object.keys(src).forEach(function(k){ obj[k] = src[k]; });
  };

  const TOOLS = window.TOOLS || (window.TOOLS = {});

  TOOLS.snapshot = function(auto){
    const d = D();
    if(!Array.isArray(d.versions)) d.versions = [];
    d.versions.unshift({
      id: (typeof uid === 'function' ? uid() : 'v' + Date.now()),
      at: Date.now(),
      auto: !!auto,
      label: auto ? 'Automatic' : 'Manual',
      data: capture()
    });
    if(d.versions.length > VERSION_MAX) d.versions.length = VERSION_MAX;
    save();
    if(!auto) toast('Snapshot saved · ' + d.versions.length + ' kept');
    return d.versions.length;
  };

  TOOLS.restoreSnapshot = function(i){
    const d = D();
    const v = (d.versions || [])[i];
    if(!v || !v.data) return;
    LISTS.forEach(function(k){ putArr(d[k], v.data[k]); });
    putObj(d.bible,  v.data.bible);
    putObj(d.kanban, v.data.kanban);
    if(Array.isArray(v.data.planBoards))  putArr(d.planBoards  || (d.planBoards = []),  v.data.planBoards);
    if(Array.isArray(v.data.canvasLinks)) putArr(d.canvasLinks || (d.canvasLinks = []), v.data.canvasLinks);
    save();
    if(typeof paintPage === 'function') paintPage();
    else if(typeof goPage === 'function') goPage(S.page);
    toast('Snapshot restored');
  };

  /* ── the JSON copy ── */
  const payload = function(){
    const d = D();
    const proj = (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    return {
      app: 'ScriptForge',
      version: 1,
      exportedAt: new Date().toISOString(),
      mode: S.mode,
      category: d.currentCategory || null,
      project: proj ? {
        id: proj.id, name: proj.name, created: proj.created,
        chapters: proj.chapters || [], notes: proj.notes || [],
        beats: proj.beats || [], cast: proj.cast || [],
        references: proj.references || [], timeline: proj.timeline || [],
        kanban: proj.kanban || null, bible: proj.bible || null
      } : null
    };
  };

  const projOf = function(){
    const d = D();
    return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
  };

  /* One name per project, and the very same name every pass — the copy is
     rewritten in place instead of arriving as “untitled (1).json”. */
  const fileName = function(){
    const proj = projOf();
    /* an unnamed project must not arrive as “untitled (1).json” every pass:
       it gets one stable name, and the linked file is rewritten in place */
    let raw = String((proj && proj.name) || '').trim();
    if(!raw || /^untitled/i.test(raw)) raw = 'project';
    const base = raw.replace(/[^a-z0-9\-_ ]/gi, '_').replace(/\s+/g, ' ').trim() || 'project';
    return base + '-autosave.json';
  };

  /* ── the desktop app writes the file itself, straight to
        Documents\ScriptForge Backups, overwriting the previous pass ── */
  const desk = function(){
    return (window.sfDesktop && typeof window.sfDesktop.saveBackup === 'function') ? window.sfDesktop : null;
  };
  const writeToDesktop = async function(text, name){
    const d = desk();
    if(!d) return false;
    try{
      const res = await d.saveBackup(name, text);
      return !!(res && res.ok);
    }catch(e){ return false; }
  };

  let handle = null;                       /* the linked file, when there is one */

  const writeToHandle = async function(text){
    if(!handle) return false;
    try{
      if(handle.queryPermission){
        let p = await handle.queryPermission({ mode:'readwrite' });
        if(p !== 'granted') p = await handle.requestPermission({ mode:'readwrite' });
        if(p !== 'granted') return false;
      }
      const w = await handle.createWritable();
      await w.write(text);
      await w.close();
      return true;
    }catch(e){
      return false;
    }
  };

  /* ── the folder a browser can be handed: one file per project, rewritten
        in place every pass, and remembered across reloads — a page may not
        overwrite a download, and localStorage cannot hold a handle, so the
        handle lives in IndexedDB ── */
  const IDB_NAME = 'sf6_files', IDB_STORE = 'handles';

  const idbOpen = function(){
    return new Promise(function(ok){
      try{
        if(!window.indexedDB) return ok(null);
        const r = window.indexedDB.open(IDB_NAME, 1);
        r.onupgradeneeded = function(){ try{ r.result.createObjectStore(IDB_STORE); }catch(e){} };
        r.onsuccess = function(){ ok(r.result); };
        r.onerror = function(){ ok(null); };
      }catch(e){ ok(null); }
    });
  };
  const idbGet = async function(key){
    const db = await idbOpen();
    if(!db) return null;
    return new Promise(function(ok){
      try{
        const rq = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
        rq.onsuccess = function(){ ok(rq.result || null); };
        rq.onerror = function(){ ok(null); };
      }catch(e){ ok(null); }
    });
  };
  const idbSet = async function(key, val){
    const db = await idbOpen();
    if(!db) return;
    try{ db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(val, key); }catch(e){}
  };

  let dirHandle = null;                    /* the folder, in a browser */
  const canFolder = function(){ return typeof window.showDirectoryPicker === 'function'; };

  /* A folder can only be used from the top-level page: an embedded frame
     (the hosted preview, for instance) is refused by the browser, and the
     call then fails without ever drawing a picker. Telling the writer that
     up front beats a button that looks dead. */
  const folderBlocked = function(){
    try{ if(window.self !== window.top) return true; }catch(e){ return true; }
    return !window.isSecureContext;
  };

  const dirGranted = async function(h, ask){
    try{
      if(!h || !h.queryPermission) return true;
      let p = await h.queryPermission({ mode:'readwrite' });
      if(p === 'granted') return true;
      if(!ask) return false;
      p = await h.requestPermission({ mode:'readwrite' });
      return p === 'granted';
    }catch(e){ return false; }
  };

  const writeToDir = async function(text, name, ask){
    if(!dirHandle) return false;
    try{
      if(!(await dirGranted(dirHandle, ask))) return false;
      const fh = await dirHandle.getFileHandle(name, { create:true });
      const w = await fh.createWritable();
      await w.write(text);
      await w.close();
      return true;
    }catch(e){ return false; }
  };

  /* the button that says where the copy goes, kept honest */
  const esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  const paintWhere = function(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-auto-where]'), function(el){
      el.innerHTML = '<i class="bi bi-folder2-open"></i> ' +
        esc((window.SF_AUTO && window.SF_AUTO.where) ? window.SF_AUTO.where() : 'Choose folder');
    });
  };

  const download = function(text, name){
    try{
      const blob = new Blob([text], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
      return true;
    }catch(e){ return false; }
  };

  const backup = async function(){
    const text = JSON.stringify(payload(), null, 2);
    const name = fileName();
    if(await writeToDesktop(text, name)) return 'desktop';
    if(await writeToHandle(text)) return 'file';
    if(download(text, name)) return 'download';
    return 'none';
  };

  window.SF_AUTO = {
    where: function(){
      if(desk()) return 'Backups folder';      /* the desktop app owns the file */
      if(dirHandle) return dirHandle.name;     /* the folder the writer picked */
      if(handle) return handle.name;
      /* a page that cannot link a folder must not promise one */
      return (canFolder() && !folderBlocked()) ? 'Choose folder' : 'Save a copy';
    },
    canFolder: function(){ return canFolder() && !folderBlocked(); },
    linked: function(){ return !!desk() || !!dirHandle || !!handle; },
    isDesktop: function(){ return !!desk(); },
    hasFolder: function(){ return !!dirHandle; },
    saveToFolder: async function(text, name){ return await writeToDir(text, name, true); },
    backup: backup,
    /* Settings → General, ONE button. It writes the copy where the app is
       already writing — the linked folder, one file per project, rewritten
       — and when no folder can be linked it hands over the same JSON as a
       download. (The old pair of buttons, “Choose folder” and “Download a
       copy”, were two names for this one job.) */
    saveNow: async function(){
      const text = JSON.stringify(payload(), null, 2);
      const name = fileName();
      if(desk() || dirHandle || handle){
        const where = await backup();
        if(where !== 'none'){
          if(typeof toast === 'function') toast('Saved ' + name);
          return true;
        }
      }
      if(canFolder() && !folderBlocked() && !dirHandle){
        await window.SF_AUTO.link();      /* the picker is the way in */
        return true;
      }
      return window.SF_AUTO.fallbackDownload();
    },
    downloadCopy: function(){ return window.SF_AUTO.fallbackDownload(); },

    /* The honest last resort: a page can never write a file behind the
       writer's back, so if no picker is available it hands over one JSON
       copy — the same name every time — instead of doing nothing at all. */
    fallbackDownload: function(){
      const ok = download(JSON.stringify(payload(), null, 2), fileName());
      if(typeof toast === 'function'){
        toast(ok ? 'Saved ' + fileName() + ' to your Downloads folder'
                 : 'Could not save the backup', ok ? undefined : 'err');
      }
      return ok;
    },

    link: async function(){
      /* in the desktop app the folder already exists — just show it */
      if(desk()){
        try{ await desk().revealBackups(); toast('Backups folder opened'); }
        catch(e){ toast('The backups folder could not be opened', 'warn'); }
        return;
      }

      let picked = false;      /* did the writer actually choose a folder? */

      /* a folder is the honest target in a browser: one file per project,
         rewritten every pass instead of a new “(1)”, “(2)”, “(3)” each time */
      if(canFolder() && !folderBlocked()){
        try{
          const h = await window.showDirectoryPicker({ id:'sf-backups', mode:'readwrite' });
          dirHandle = h;
          picked = true;
          await idbSet('dir', h);
          await dirGranted(h, true);
          const wrote = await writeToDir(JSON.stringify(payload(), null, 2), fileName(), true);
          paintWhere();
          if(typeof toast === 'function'){
            toast(wrote ? 'Backing up to “' + h.name + '” — one file per project, rewritten'
                        : 'Folder linked — the copy will be written on the next pass',
                  wrote ? undefined : 'warn');
          }
          return;
        }catch(e){
          if(String((e && e.name) || '') === 'AbortError') return;   /* dismissed on purpose */
          /* blocked — an embedded frame or a browser that will not allow
             it — so say so and still hand over the file below */
          if(typeof toast === 'function'){
            toast('This browser will not let the app write to a folder here', 'warn');
          }
        }
      }

      if(typeof window.showSaveFilePicker === 'function'){
        try{
          handle = await window.showSaveFilePicker({
            suggestedName: fileName(),
            types: [{ description:'JSON backup', accept: { 'application/json': ['.json'] } }]
          });
          picked = true;
          const text = JSON.stringify(payload(), null, 2);
          if(await writeToHandle(text)){ toast('Backing up to ' + handle.name); paintWhere(); return; }
        }catch(e){
          if(String((e && e.name) || '') === 'AbortError') return;   /* dismissed */
        }
      }

      /* nothing could be linked — a real copy, right now, is better than a
         button that appears to do nothing */
      if(!picked){
        if(folderBlocked() && typeof toast === 'function'){
          toast('A folder cannot be linked from inside an embedded page — saving a copy instead', 'warn');
        }
        window.SF_AUTO.fallbackDownload();
      }
    }
  };

  /* bring back the folder, and the single FILE, the writer linked last time.
     Both handles are remembered; a fresh visit may need one click for the
     permission, which the first gesture below asks for. */
  const rememberDir = async function(){
    try{
      const h = await idbGet('dir');
      if(h && h.queryPermission){ dirHandle = h; paintWhere(); }
    }catch(e){}
    try{
      const f = await idbGet('file');
      if(f && f.queryPermission){ handle = f; paintWhere(); }
    }catch(e){}
  };

  /* ══════════════════════════════════════════════════════════
     ONE FILE, REWRITTEN — the writer's own complaint, answered

     A download can never overwrite: the browser hands over
     “project-autosave.json”, then “(1)”, then “(2)”, one per pass, forever.
     The File System Access API CAN rewrite the same file, but a page may
     only open its picker from the writer's own click — never from a timer.
     So the app watches for the first real interaction after a pass finds
     nothing linked, asks for the file ONE time, remembers the handle, and
     from then on every pass writes straight into that same file. A reload
     keeps it: the handle is in IndexedDB, and the first click of the new
     visit restores the permission.

     Where the API does not exist (an embedded preview, Firefox, Safari)
     the picker is impossible and nothing is pretended; that case keeps the
     one-copy-per-session behaviour and says so once.
     ══════════════════════════════════════════════════════════ */
  let pendingLink = false;
  let linking = false;

  const pickFile = async function(){
    if(typeof window.showSaveFilePicker !== 'function') return null;
    try{
      return await window.showSaveFilePicker({
        id: 'sf-backup',
        suggestedName: fileName(),
        types: [{ description:'JSON backup', accept: { 'application/json': ['.json'] } }]
      });
    }catch(e){
      return null;                     /* dismissed, or refused */
    }
  };

  const gesture = async function(){
    if(linking) return;
    linking = true;
    try{
      /* 1 · a pass wanted a file and could not ask for one itself */
      if(pendingLink){
        pendingLink = false;
        const h = await pickFile();
        if(!h){ pendingLink = true; return; }        /* dismissed — ask again later */
        handle = h;
        await idbSet('file', h);
        const wrote = await writeToHandle(JSON.stringify(payload(), null, 2));
        if(wrote){
          sessionFile = true;                        /* no downloads from here on */
          paintWhere();
          if(typeof toastLeft === 'function') toastLeft('Backups rewrite ' + h.name + ' — same file every pass');
        }else{
          pendingLink = true;
        }
        return;
      }
      /* 2 · a remembered file, whose permission this visit has not been
             granted yet: one click gives it back, then writing resumes */
      if(handle){
        const wrote = await writeToHandle(JSON.stringify(payload(), null, 2));
        if(wrote) paintWhere();
        return;
      }
      /* 3 · a remembered folder, same story */
      if(dirHandle){
        const wrote = await writeToDir(JSON.stringify(payload(), null, 2), fileName(), true);
        if(wrote) paintWhere();
        return;
      }
    }catch(e){
      /* never let a backup attempt break the click it rode in on */
    }finally{
      linking = false;
    }
  };

  document.addEventListener('pointerdown', function(){ gesture(); }, true);
  document.addEventListener('keydown', function(){ gesture(); }, true);
  rememberDir();

  /* ── the timers ── */
  const last = function(){ const n = parseInt(localStorage.getItem(STAMP_KEY) || '0', 10); return isNaN(n) ? 0 : n; };
  const stamp = function(){ try{ localStorage.setItem(STAMP_KEY, String(Date.now())); }catch(e){} };

  /* ── writing activity — a backup only happens for a window in which
        something was actually written, even one word. Opening a project
        and leaving it alone writes nothing. ── */
  let lastWrite = 0;
  let wroteSomething = false;
  let quick = 0;
  const markWrite = function(){
    lastWrite = Date.now(); wroteSomething = true;
    /* A SHORT SESSION IS NOT AN EMPTY ONE.
       The ten-minute cadence is for the file, but the first writing of a
       session used to wait for the next ten-second tick before anything was
       kept — and if the page could not write a file at all, less than ten
       minutes of writing left nothing behind. The first write now earns its
       pass within a couple of seconds, so writing for one minute and closing
       the window still leaves a snapshot to come back to. */
    if(sessionSnap || quick) return;
    quick = setTimeout(function(){ quick = 0; tick(); }, 2000);
  };

  /* Only the writing surfaces count. Settings fields, the command box, the
     search panels and the plugin cards are not the writer working on the
     project, so they must never trigger a backup on their own. Neither
     are the Idea page's cards: a prompt is not the manuscript, and a
     backup that landed as the tick was pressed read as the tick's own
     doing. */
  const WRITES = '#editor, .editor-doc, .write-doc, [contenteditable="true"], textarea, input';
  const writing = function(t){
    if(!t || !t.closest) return false;
    if(t.closest('.modal-scrim, #cmdBox, #fabAI, #fabMenu, .sf-plugin, .sf-tip, .toast-area, .set-shell, #page-inspire')) return false;
    if(!t.matches || !t.matches(WRITES)) return false;
    if(t.tagName === 'INPUT' && /^(checkbox|radio|color|file)$/i.test(t.type || '')) return false;
    return true;
  };

  document.addEventListener('input', function(e){
    if(writing(e.target)) markWrite();
  }, true);
  document.addEventListener('keydown', function(e){
    const t = e.target;
    if(!t || !t.isContentEditable) return;
    if(!writing(t)) return;
    if(e.key && e.key.length === 1) markWrite();         /* a real character */
  }, true);

  const wroteInWindow = function(){
    const wrote = wroteSomething && (Date.now() - lastWrite) <= TEN_MIN;
    wroteSomething = false;                              /* the window is spent either way */
    return wrote;
  };

  /* auto-save — a real save every few seconds while the switch is on */
  setInterval(function(){
    if(S.config.autoSave === false || typeof save !== 'function') return;
    save();
  }, 5000);

  const SNAPSHOT_EVERY = 10 * 60 * 1000;      /* the in-app snapshot: every 10 min */
  let lastSnapshot = 0;

  /* A session that lasts less than ten minutes used to leave nothing at
     all behind: the snapshot waited for the full ten minutes, and a plain
     browser never writes a file. The first writing of a session now earns
     both — one snapshot, and (when nothing is linked) one real copy — and
     the ten-minute cadence carries on from there. */
  let sessionSnap = false;
  let sessionFile = false;

  /* The note that points at the folder button is said ONCE, ever — not once
     per session and not every ten minutes, which is what made it feel like a
     broken record. The one button in Settings → General does that same job —
     it writes into the folder when there is one, and hands over the file
     when the browser will not let the app write to a folder. */
  const NAG_KEY = 'sf6_backup_note';
  const askedOnce = function(msg){
    msg = msg || 'Backups stay in the app (Tools → Snapshots) until you link a folder — Settings → General, then the folder button';
    let said = false;
    try{ said = localStorage.getItem(NAG_KEY) === '1'; }catch(e){}
    if(said) return;
    try{ localStorage.setItem(NAG_KEY, '1'); }catch(e){}
    if(typeof toastLeft === 'function') toastLeft(msg);
    else if(typeof toast === 'function') toast(msg, 'warn');
  };

  /* the file: rewritten in place every 10 seconds, as soon as anything new
     has been written since the last pass */
  const tick = async function(){
    if(S.config.autoVersion === false && S.config.autoJson === false) return;
    if(!wroteInWindow()) return;                        /* nothing new → nothing saved */

    const now = Date.now();

    if(S.config.autoVersion !== false && (!sessionSnap || now - lastSnapshot >= SNAPSHOT_EVERY)){
      const first = !sessionSnap;
      sessionSnap = true;
      lastSnapshot = now;
      try{ TOOLS.snapshot(true); }catch(e){}
      /* say so, once a session: the writer has to be able to see that the
         under-ten-minute backup actually happened */
      if(first && typeof toastLeft === 'function') toastLeft('Snapshot kept — Tools → Snapshots (restore any of the last 25)');
    }

    /* the JSON copy — only when its own switch is on */
    if(S.config.autoJson === false) return;

    /* the desktop app: one file per project, rewritten in place every pass */
    if(desk()){
      if(await writeToDesktop(JSON.stringify(payload(), null, 2), fileName())
         && now - lastWrite < 20000) toastLeft('Saved ' + fileName());
      return;
    }

    /* a file the writer linked by hand: rewritten in place, never a copy */
    if(handle){
      const wrote = await writeToHandle(JSON.stringify(payload(), null, 2));
      if(wrote && now - lastWrite < 20000) toastLeft('Saved ' + handle.name);
      else if(!wrote) askedOnce();
      return;
    }

    /* The folder the writer linked, when there is one: the same file, over
       and over. */
    if(dirHandle){
      const wrote = await writeToDir(JSON.stringify(payload(), null, 2), fileName(), false);
      if(wrote && now - lastWrite < 20000) toastLeft('Saved ' + fileName());
      /* the folder is still linked — it is the permission that lapsed, and
         one click on the folder button in Settings → General brings it back */
      else if(!wrote) askedOnce('“' + dirHandle.name + '” needs permission again — Settings → General → the folder button');
      return;
    }

    /* Nothing linked, in a browser. A page can never overwrite a download,
       so a copy on every pass only piles up “project-autosave(1).json”,
       “(2)”, “(3)” … The writer still gets ONE real copy the first time
       they write in a session — a short session is not an empty one — and
       after that the in-app snapshots carry the backup, with the note
       said once. */
    /* THE FILE THE WRITER ALREADY PICKED WINS, ALWAYS.
       A page cannot open the picker from a timer, so when there is nothing
       linked and the API exists, the app remembers that a file is wanted
       and takes the writer's next click to ask for it — once. Every pass
       after that rewrites that same file, so “(1)”, “(2)”, “(3)” can never
       appear again. The one-download fallback is only for pages where the
       API does not exist at all. */
    if(typeof window.showSaveFilePicker === 'function' && !folderBlocked()){
      if(!pendingLink){
        pendingLink = true;
        if(!sessionFile){
          sessionFile = true;
          askedOnce('One click links your backup file — after that every save rewrites it instead of leaving “(1)”, “(2)” in Downloads');
        }
      }
      return;
    }

    if(!sessionFile){
      sessionFile = true;
      /* An embedded page — the hosted preview — can neither link a folder
         nor deliver a download the browser will accept, so no copy is
         pretended: the snapshot above is the backup there, and the note
         says where it is. */
      if(folderBlocked()){ askedOnce(); return; }
      try{ if(!window.SF_AUTO.fallbackDownload()) askedOnce(); }catch(e){ askedOnce(); }
    }else{
      askedOnce();
    }
  };

  window.SF_AUTO.touched = markWrite;

  setInterval(tick, 10 * 1000);            /* the file is rewritten every 10 seconds */
  setTimeout(tick, 10 * 1000);
})();

/* ═══════════════════════════════════════════════════════════
   PAGE BARS, THE IDEA PAGE, THE DASHBOARD, THE PLAN HEAD

   Everything below was the tail of app.js from the start; it used to sit
   in its own files (page-bars.js, idea-cards.js, dash.js, plan-head.js)
   and was merged in here, in its original load order, so the app is one
   script instead of five. Nothing below was rewritten.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ the page bars ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — page bars

   One bar for every page, the same box the Idea page uses:

     Draft    · New draft · New Chat                   (build here)
     Outline  · T · New chapter · New subchapter       … Expand / Collapse
     Plan     · T · Add beat                           … Add act / scene / Clear
     Bible    · T · New entry                          … category tabs
     Kanban   · T · New list                           … Reset board
     Canvas   · New card · Fit                         … zoom · Clear

   Draft has no header of its own, so its bar is built here. The other
   five already have a header row — that row is renamed into a bar: it
   gets the bar classes and a small label in front, and every page keeps
   its own buttons (nothing is re-wired, the handlers are delegated).
   ═══════════════════════════════════════════════════════════ */

/* ── the five pages whose own header row becomes a bar ── */
(function(){
  const HEADS = {
    outline: { label:'Outline', icon:'list-nested' },
    plan:    { label:'Plan',    icon:'list-check' },
    bible:   { label:'Bible',   icon:'journal-bookmark' },
    kanban:  { label:'Kanban',  icon:'kanban' },
    mindmap: { label:'Canvas',  icon:'diagram-3' }
  };

  const bar = function(page){
    const root = document.getElementById('page-' + page);
    if(!root) return;
    const head = root.querySelector('.page-head');
    if(!head) return;

    head.classList.add('sf-bar-page');
    /* the page's own title block is not part of a bar */
    Array.prototype.forEach.call(head.querySelectorAll('.page-title, .page-sub'), function(el){
      el.style.display = 'none';
    });

    /* the page's name is not written on the bar — the bar holds the
       page's own buttons and nothing else */
    Array.prototype.forEach.call(head.querySelectorAll('.sf-bar-label'), function(el){ el.remove(); });
  };

  const sweep = function(){ Object.keys(HEADS).forEach(bar); };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; sweep(); });
  };

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('resize', schedule);
  document.addEventListener('click', schedule, true);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();

(function(){
  const PAGE = 'draft';   /* The bar holds New draft while you are writing, and New Chat while
     the draft chat is up — the same slot, one at a time. New draft calls the
     app's own action directly: the old delegated click pointed at a + this bar
     had already replaced. While an AI panel or the chat is up, the bar stays
     and New draft steps aside. */
  const ACTS = [
    { icon:'plus-lg',   t:'New draft', act:'tools:addDraft' },
    { icon:'chat-dots', t:'New Chat',  act:'chat:new', chat:true }
  ];

  const build = function(){
    const bar = document.createElement('div');
    bar.className = 'sf-bar';
    bar.dataset.sfBar = PAGE;
    bar.innerHTML =
      ACTS.map(function(a){
          return '<button class="ol-btn"' + (a.chat ? ' data-sfbar-chat="1"' : '') + ' data-sfbar="' + a.act + '">'
               + '<i class="bi bi-' + a.icon + '"></i> ' + a.t + '</button>';
        }).join('');
    return bar;
  };

  const apply = function(){
    const page = (typeof S !== 'undefined' && S.page) || '';
    const root = document.getElementById('page-' + page);

    /* The bar this file builds only ever lives on its own page. It must
       NOT touch another layer's bar: the script page builds its own bar
       with the same .sf-bar class, and a sweep that removed every .sf-bar
       off this page deleted the script's bar on every repaint. Only the
       bars carrying data-sf-bar are this file's. */
    Array.prototype.slice.call(document.querySelectorAll('.sf-bar[data-sf-bar]')).forEach(function(b){
      if(page !== PAGE || b.parentElement !== root) b.remove();
    });
    if(page !== PAGE || !root) return;
    if(root.querySelector(':scope > .sf-bar')) return;
    root.insertBefore(build(), root.firstChild);
  };

  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; apply(); });
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-sfbar]');
    if(!btn) return;
    e.preventDefault();
    const what = btn.dataset.sfbar;
    if(what.indexOf('ai:') === 0){
      const fn = what.slice(3);
      if(window.AI_FNS && window.AI_FNS[fn]) window.AI_FNS[fn]();
      else if(typeof toast === 'function') toast('That action is not available here', 'warn');
      return;
    }
    if(what === 'tools:addDraft'){
      /* New draft goes through the app's OWN action — the one behind the “+”
         on the page — so the new draft is the selected one and the title is
         focused, exactly as it is when the page's own button is used. The
         action is bound to a hidden stand-in; the bar's button only asks. */
      const ghost = document.createElement('button');
      ghost.type = 'button';
      ghost.setAttribute('data-act', 'add-draft');
      ghost.style.display = 'none';
      document.body.appendChild(ghost);
      ghost.click();
      ghost.remove();
      return;
    }
    if(what.indexOf('tools:') === 0){
      const fn = what.slice(6);
      const T = window.TOOLS;
      if(T && typeof T[fn] === 'function') T[fn]();
      else if(typeof toast === 'function') toast('That action is not available here', 'warn');
      return;
    }
    if(what.indexOf('chat:') === 0){
      const fn = what.slice(5);
      const DC = window.DraftChat;
      if(!DC){ toast && toast('The draft chat is not available here', 'warn'); return; }
      const on = !!(document.querySelector('#page-draft.dc-on') ||
                    document.querySelector('#page-draft [data-dc="1"]'));
      if(fn === 'new'){
        if(!on && DC.open) DC.open();      /* the chat view has to exist first */
        if(DC.newChat) DC.newChat();
        if(DC.render) DC.render();
        return;
      }
      if(fn === 'toggle'){ if(on && DC.close) DC.close(); else if(DC.open) DC.open(); }
      else if(fn === 'open' && DC.open) DC.open();
      return;
    }
    const target = document.querySelector(what.slice(6));
    if(target) target.click();
  }, true);

  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);
})();


/* ══════════ the Idea page ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Idea page.

   · Six cards, and every one of them is the writer’s own: write your prompt
     in a card. Nothing is written for you and nothing is sent anywhere —
     there is no AI on this page. The page’s AI is the round button’s
     right-click, which is the app’s own panel.
   · A card is a VIEW. The prompt sits there to be read, not typed over; the
     pencil on the card opens it for writing and it closes again the moment
     you click away. What you write lives with the project, so the cards are
     still full when you come back to them.
   · Copy and paste are one right-click, anywhere in the app:
       right-click a saved prompt   → its label is copied
       right-click a prompt in a card → the prompt is copied
       right-click an empty box     → what was copied goes in
     The app’s own writing menu and the browser’s own menu still open
     wherever there is nothing of ours to do.
   · Saving asks for a name first — the title typed in that little window is
     what the Saved prompts column shows.
   · Every row in the column is a prompt of its own and holds ALL SIX cards:
     a click opens that prompt — the grid on the right becomes its six cards,
     with the row you are on marked the way the draft list marks its own — the
     row’s pencil renames it, and Remove stays where it was.
   · New prompt adds one: a fresh prompt with six empty cards, its name asked
     for the way New draft asks for a draft’s.
   · The bar carries Genres · Tags, and Clear at its right end — Clear takes
     the prompt out of the card you are on.
   · Every dropdown on the Plan board (each beat’s type) wears the app’s own
     dropdown card.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.inspire !== 'function') return;

  const CARDS = 6;                    /* six cards to write in */
  let sel = 0;                        /* the card you are on */
  let editing = -1;                   /* the card open for writing (−1 = none) */
  let clip = '';                      /* what the right-click last copied */

  const esc2 = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
  };

  const toastIt = function(msg, kind){
    try{ if(typeof toast === 'function') toast(msg, kind); }catch(e){}
  };
  const saveIt = function(){ try{ if(typeof save === 'function') save(); }catch(e){} };

  /* ── EVERY PROMPT OWNS ALL SIX CARDS ──
     One row in the left card is one prompt, and the grid on the right is
     whatever that row holds: click a row and its own six cards come up.
     savedPrompts stays the list itself — the rows, the filter and the pager
     are drawn from it by other layers — so the six cards ride on the entry,
     and an entry written before a prompt owned its cards ({ title, text })
     reads as a prompt whose first card is that text. Nothing is lost. */
  let cur = 0;                        /* the prompt you are on, a row of the left card */

  const cardsOf = function(entry){
    if(!entry || typeof entry !== 'object') return null;
    if(!Array.isArray(entry.cards)){
      entry.cards = [];
      for(let i = 0; i < CARDS; i++) entry.cards[i] = '';
      if(entry.text) entry.cards[0] = String(entry.text);
    }
    /* A prompt STARTS with six cards and keeps as many as it has: the bin on
       a card takes that card away, so a list shorter than six is a prompt the
       writer has cut down and it is left exactly as it is here. This used to
       fill every list out to six, which put a deleted card straight back —
       the bin looked dead. Only a slot holding something that is not a string
       is repaired, and a prompt with no cards at all is left empty: the grid
       says so and the row's Add card makes one. */
    for(let i = 0; i < entry.cards.length; i++){
      if(typeof entry.cards[i] !== 'string') entry.cards[i] = '';
    }
    return entry.cards;
  };

  const blank = function(){
    return { title:'', text:'', cards: new Array(CARDS).fill('') };
  };

  /* The prompts are settled once, before the left card is drawn from them:
     a profile written before a prompt owned its cards brings the six this
     page was holding into the list as a prompt of its own, so nothing
     already written is lost. NOTHING ELSE here makes a prompt - not the
     pencil, not a keystroke, not Clear. Only New prompt does, and that is
     the writer's own press. */
  /* ── TEN PROMPTS TO START WITH ──
     The left card is a page of ten, the way the dashboard is a page of ten
     projects, and an empty shelf shows none of what it is for. A profile that
     does not yet hold ten prompts is topped up to ten, once — names the
     writer can keep, rename or bin. */
  const STARTERS = [
    'The opening image', 'The inciting incident', 'Who wants what',
    'The first obstacle', 'A secret kept', 'The midpoint turn',
    'What it costs them', 'The lowest point', 'The choice they make',
    'The closing image'
  ];
  const seedStarters = function(){
    if(typeof S === 'undefined' || !S.config) return;
    if(S.config.ideaStarters) return;
    S.config.ideaStarters = true;
    const list = savedEntries();
    /* ONLY a shelf with nothing on it is filled. This used to top a short
       list up to ten, which pushed the starters that were missing from the
       END of STARTERS onto a list the writer had already written: open the
       page with seven prompts of your own and three prompts nobody asked
       for were added, so the count went 7 -> 10 in one step. A list that
       already holds anything is left exactly as it is, and the flag above
       means a shelf the writer empties stays empty. */
    if(list.length) return;
    for(let i = 0; i < STARTERS.length; i++){
      const entry = blank();
      entry.title = STARTERS[i];
      list.push(entry);
    }
  };

  const migrate = function(){
    if(typeof S === 'undefined' || !S.config) return;
    seedStarters();
    if(!S.config.ideaSeeded){
      S.config.ideaSeeded = true;
      const old = Array.isArray(S.config.ideaCards) ? S.config.ideaCards : null;
      if(old && old.some(function(v){ return String(v || '').trim(); })){
        savedEntries().unshift({ title:'', text:'', cards: old.slice(0, CARDS) });
      }
    }
    clampCur();
  };

  const clampCur = function(){
    const list = savedEntries();
    Array.prototype.forEach.call(list, cardsOf);
    if(cur >= list.length) cur = list.length - 1;
    if(cur < -1) cur = -1;
    return list;
  };

  /* the prompt's own text stays its cards put together, so the row's label,
     the filter and anything else reading a prompt still reads it */
  const syncText = function(list, entry){
    if(!list) return;
    const e = entry || savedEntries()[cur];
    if(!e) return;
    e.text = list.filter(function(v){ return String(v || '').trim(); }).join('\n\n');
  };

  const store = function(){
    if(typeof S === 'undefined') return null;
    if(!S.config) S.config = {};
    const list = clampCur();
    const entry = list[cur];
    if(!entry) return null;
    const cards = cardsOf(entry);
    syncText(cards, entry);
    return cards;
  };

  /* the row you are on is the row the grid belongs to */
  const markRows = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-inspire #ideaRows [data-idea-open]'),
      function(row){
        row.classList.toggle('on', parseInt(row.dataset.ideaOpen, 10) === cur);
      });
  };

  const saveSoon = (typeof debounce === 'function')
    ? debounce(function(){ saveIt(); }, 400)
    : saveIt;

  /* the card’s own text — the prompt, exactly as the writer wrote it */
  const wordsOf = function(i){
    const list = store();
    return list ? String(list[i] || '').trim() : '';
  };

  const titleOf = function(txt){
    const words = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
    const t = words.slice(0, 6).join(' ');
    return (words.length > 6 ? t + '\u2026' : t) || 'Untitled prompt';
  };

  /* ═══ COPY & PASTE, BY RIGHT-CLICK ═══
     One clipboard of our own holds what the writer last copied; the system
     clipboard is written too, so a paste into another app still works. */
  const copyBlock = function(txt, what){
    txt = String(txt == null ? '' : txt);
    if(!txt.trim()){ toastIt('Nothing to copy', 'warn'); return; }
    clip = txt;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
    }catch(e){ /* the app’s own clipboard is enough for our paste */ }
    toastIt('Copied ' + what);
  };

  const copyText = function(txt){
    txt = String(txt == null ? '' : txt);
    if(!txt.trim()){ toastIt('Write something first', 'warn'); return; }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        toastIt('Copied');
        return;
      }
    }catch(e){ /* fall through to the old path */ }
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toastIt('Copied'); }catch(e){}
    ta.remove();
  };

  /* the box a paste may land in: a plain field, never one that is read-only
     (a card in view mode is read-only, and that is the whole point) */
  const PLAIN = /^(text|search|url|email|tel|password|number|)$/i;
  const fieldOf = function(el){
    if(!el || !el.tagName) return null;
    if(el.isContentEditable) return el;
    if(el.tagName === 'TEXTAREA') return el;
    if(el.tagName === 'INPUT' && PLAIN.test(el.type || '')) return el;
    return null;
  };
  const isBlank = function(el){
    if(!el) return false;
    if(el.isContentEditable) return !String(el.textContent || '').trim();
    return !String(el.value || '').trim();
  };
  const pasteInto = function(el, txt){
    if(el.isContentEditable){
      try{
        el.focus();
        document.execCommand('insertText', false, txt);
        return true;
      }catch(e){ return false; }
    }
    const v = String(el.value || '');
    const from = (typeof el.selectionStart === 'number') ? el.selectionStart : v.length;
    const to   = (typeof el.selectionEnd   === 'number') ? el.selectionEnd   : from;
    el.value = v.slice(0, from) + txt + v.slice(to);
    const at = from + txt.length;
    try{ el.setSelectionRange(at, at); }catch(e){}
    try{ el.focus(); }catch(e){}
    try{ el.dispatchEvent(new Event('input',  { bubbles:true })); }catch(e){}
    try{ el.dispatchEvent(new Event('change', { bubbles:true })); }catch(e){}
    return true;
  };

  /* ═══ THE SAVED PROMPTS LIST ═══
     One line per prompt — its title and nothing else — and two things are
     done by hand: the row’s own button is the Rename pencil (copying a row
     is the right-click), and the prompt itself is never printed there.

     Two other layers draw these rows (pages-fix.js writes them, no-pager.js
     re-fills them), so the dressing runs again on every change to the column
     and is written to be harmless the second time. */
  const savedEntries = function(){
    if(typeof S === 'undefined') return [];
    if(!S.config) S.config = {};
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    return S.config.savedPrompts;
  };

  const entryText = function(entry){
    if(entry == null) return '';
    return (typeof entry === 'string') ? entry : String(entry.text || '');
  };
  const entryTitle = function(entry){
    if(entry == null) return '';
    return (typeof entry === 'string') ? titleOf(entry) : (entry.title || titleOf(entry.text));
  };

  const dressRow = function(row){
    /* the prompt itself is not shown in the list — its title is the row */
    const txt = row.querySelector('.idea-row-txt');
    if(txt){
      Array.prototype.forEach.call(txt.querySelectorAll('em, .idea-row-text'), function(el){ el.remove(); });
    }
    /* the row’s button becomes the Rename pencil: a copy of the row is a
       right-click now, so the button that used to copy has nothing to do */
    Array.prototype.forEach.call(row.querySelectorAll('[data-idea-copy]'), function(b){
      b.removeAttribute('data-idea-copy');
      b.setAttribute('data-idea-ren', '1');
      b.title = 'Rename';
      const ic = b.querySelector('i');
      if(ic) ic.className = 'bi bi-pencil';
    });

    /* and the row's own Add card, ahead of the pencil: a card joins THIS
       prompt, to the right of the ones it has, and opens in the writing
       pane ready to type in. (The pencil on a card opens a card that is
       already there; this one is the way a prompt gains one.) */
    Array.prototype.forEach.call(
      row.querySelectorAll('[data-idea-edit]'),
      function(b){ if(b.parentNode) b.parentNode.removeChild(b); });
    const ren = row.querySelector('[data-idea-ren]');
    if(ren && !row.querySelector('[data-idea-newcard]')){
      const add = document.createElement('button');
      add.className = 'ol-tool';
      add.setAttribute('data-idea-newcard', row.dataset.ideaOpen || '');
      add.title = 'Add card';
      add.innerHTML = '<i class="bi bi-file-earmark-plus"></i>';
      ren.parentNode.insertBefore(add, ren);
    }
    row.setAttribute('title', 'Right-click to copy its label · Click to open this prompt, with its six cards');
  };

  const dressList = function(){
    Array.prototype.forEach.call(
      document.querySelectorAll('#page-inspire #ideaRows [data-idea-open]'), dressRow);
    markRows();
    /* every prompt removed: the cards on the right are nobody's, so they are
       drawn as they are without one - inert, and saying how to start */
    if(!savedEntries().length && document.querySelector('#page-inspire #ideaCards .idea-slot-acts')) paint();

    /* prompts are made by New prompt now, not by keeping a card */
    const hint = document.querySelector('#page-inspire #ideaRows .idea-empty');
    if(hint && hint.dataset.sfHint !== '1'){
      hint.dataset.sfHint = '1';
      hint.innerHTML = 'No prompts yet.<br>Press <b>New prompt</b> to start one.';
    }
  };

  let listSeen = null, listWatch = null;
  const watchList = function(){
    const box = document.getElementById('ideaRows');
    if(!box) return;
    if(box !== listSeen){
      if(listWatch) listWatch.disconnect();
      listSeen = box;
      if(typeof MutationObserver === 'function'){
        listWatch = new MutationObserver(dressList);
        listWatch.observe(box, { childList:true, subtree:true });
      }
    }
    dressList();
  };

  /* ── rename: the row’s pencil edits its title in place ── */
  const startRename = function(row){
    if(!row || row.querySelector('.idea-rename')) return;
    const i = parseInt(row.dataset.ideaOpen, 10);
    if(isNaN(i)) return;
    const b = row.querySelector('b');
    if(!b) return;
    const cur = entryTitle(savedEntries()[i]);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'idea-rename';
    input.value = cur;
    input.setAttribute('data-idea-ren-input', String(i));
    b.parentNode.replaceChild(input, b);
    input.focus();
    input.select();
  };

  const endRename = function(input, revert){
    if(!input || input.dataset.ideaRenDone) return;
    input.dataset.ideaRenDone = '1';
    const i = parseInt(input.dataset.ideaRenInput, 10);
    const entry = savedEntries()[i];
    let title = '';

    if(entry !== undefined && !isNaN(i)){
      const text = entryText(entry);
      if(!revert){
        title = String(input.value || '').replace(/\s+/g, ' ').trim();
        /* ONE PROMPT, ONE NAME. A name already on the left card is refused
           rather than made twice — the writer is told, and the row keeps the
           name it had. */
        if(title && nameUsed(title, i)){
          toastIt('"' + title + '" is already a prompt here', 'warn');
          title = '';
        }
        if(title){
          if(typeof entry === 'string') savedEntries()[i] = { title:title, text:text };
          else entry.title = title;
          saveIt();
          toastIt('Renamed');
        }
      }
      if(!title) title = entryTitle(entry);
    }

    /* put the title back in the row exactly where the field was */
    const b = document.createElement('b');
    b.textContent = title || 'Untitled prompt';
    if(input.parentNode) input.parentNode.replaceChild(b, input);
  };

  /* ═══ SAVING — the writer names the prompt ═══
     The card’s Save asks what the prompt should be called before anything is
     written down, and that typed title is what the right-hand column shows:
     the list reads as the writer’s own shelf of prompts instead of six
     truncated first lines. Cancelling the little window keeps nothing. */
  const savePrompt = function(title, txt){
    if(typeof S === 'undefined') return;
    /* the card you kept becomes a prompt of its own — all six cards come
       with it, the one you kept holding what was in it */
    const entry = blank();
    entry.title = title;
    entry.cards[0] = String(txt || '');
    entry.text = entry.cards[0];
    savedEntries().unshift(entry);
    cur = 0;
    saveIt();
    toastIt('Prompt saved');

    /* repaint the page so the left card carries the new prompt */
    const root = document.getElementById('page-inspire');
    if(root && typeof PAGE_RENDERERS.inspire === 'function') PAGE_RENDERERS.inspire(root);
    else paint();
  };

  const askTitle = async function(txt){
    txt = String(txt || '');
    if(!txt.trim()){ toastIt('Write something first', 'warn'); return; }
    const list = savedEntries();
    const has = list.some(function(p){ return entryText(p) === txt; });
    if(has){ toastIt('Already saved'); return; }

    let title = titleOf(txt);
    if(typeof window.askPrompt === 'function'){
      /* the app’s own little window, so it matches every other named thing */
      const answer = await window.askPrompt('Name this prompt', title);
      if(answer == null) return;
      title = String(answer).replace(/\s+/g, ' ').trim() || titleOf(txt);
    }
    savePrompt(title, txt);
  };

  /* ── the cards ── */
  const cardHTML = function(i, noOwner){
    const open = !noOwner && (i === editing);
    const ph = noOwner ? 'Press New prompt to start one'
             : (open ? 'Write your prompt…' : 'Click the pencil to write a prompt…');
    return '<article class="idea-slot idea-slot-brief' + (!noOwner && i === sel ? ' on' : '') + '"'
      + ' data-ic-slot="' + i + '" data-ic-mode="' + (open ? 'edit' : 'view') + '">'
      + '<textarea class="idea-brief-input" data-ic-input="' + i + '" rows="3" spellcheck="false"'
      +   (open ? '' : ' readonly')
      +   ' placeholder="' + ph + '">'
      +   esc2(wordsOf(i)) + '</textarea>'
      /* Two buttons on a card: the pencil, which turns into a tick while the
         card is open for writing, and the bin beside it, which takes that one
         card away. Keeping a card as a prompt of its own went with the shelf:
         every prompt is in the left card already. */
      + (noOwner ? '' : '<div class="idea-slot-acts">'
        +   '<button class="ol-tool" data-ic-edit="' + i + '" title="Edit this card"><i class="bi bi-pencil-square"></i></button>'
        +   '<button class="ol-tool" data-ic-del="' + i + '" title="Delete this card"><i class="bi bi-trash"></i></button>'
        + '</div>')
      + '</article>';
  };

  const paint = function(){
    const box = document.getElementById('ideaCards');
    if(!box) return;
    const list = store();
    /* every card of this prompt deleted: the grid says so rather than
       standing blank, and the row's Add card puts one back */
    if(list && !list.length){
      box.innerHTML = '<article class="idea-slot idea-slot-ghost">'
        + '<span class="idea-ghost">No cards on this prompt.<br>'
        + 'Press <b>Add card</b> on its row to make one.</span></article>';
      return;
    }
    const n = list ? list.length : CARDS;
    let html = '';
    for(let i = 0; i < n; i++) html += cardHTML(i, !list);
    box.innerHTML = html;
  };

  /* ── ONE PROMPT, ONE NAME ──
     The left card is a shelf of prompts, so two rows may not wear the same
     name. Renaming to a name that is already there is refused (and said), and
     a prompt made by New prompt takes the next free “Untitled prompt”, so
     pressing it five times cannot leave five rows that read the same. */
  const nameUsed = function(name, except){
    const want = String(name || '').trim().toLowerCase();
    if(!want) return false;
    return savedEntries().some(function(p, i){
      return i !== except && entryTitle(p).trim().toLowerCase() === want;
    });
  };

  const freeTitle = function(base){
    base = String(base || '').trim() || 'Untitled prompt';
    if(!nameUsed(base, -1)) return base;
    let n = 2;
    while(nameUsed(base + ' ' + n, -1)) n++;
    return base + ' ' + n;
  };

  const mark = function(){
    const cards = document.querySelectorAll('#ideaCards [data-ic-slot]');
    Array.prototype.forEach.call(cards, function(c){
      c.classList.toggle('on', parseInt(c.dataset.icSlot, 10) === sel);
    });
  };

  /* ── the pencil opens a card for writing; clicking away closes it again ──
     The two modes are switched on the card that is already on screen rather
     than by drawing the grid again: the button the writer is pressing has to
     survive the click that follows the press, and a fresh grid would take it
     out of the page first. */
  const viewCard = function(i, mode){
    const slot = document.querySelector('#ideaCards [data-ic-slot="' + i + '"]');
    if(!slot) return null;
    const open = (mode === 'edit');
    slot.setAttribute('data-ic-mode', open ? 'edit' : 'view');
    const ta = slot.querySelector('[data-ic-input]');
    if(ta){
      if(open) ta.removeAttribute('readonly');
      else ta.setAttribute('readonly', 'readonly');
      ta.placeholder = open ? 'Write your prompt…' : 'Click the pencil to write a prompt…';
    }
    /* the button that opened the card becomes the tick that closes it */
    const btn = slot.querySelector('[data-ic-edit]');
    if(btn){
      btn.setAttribute('title', open ? 'Done' : 'Edit this prompt');
      if(open) btn.setAttribute('data-ic-done', '1');
      else btn.removeAttribute('data-ic-done');
      const ic = btn.querySelector('i');
      if(ic) ic.className = open ? 'bi bi-check2' : 'bi bi-pencil-square';
    }
    return ta;
  };

  /* the card's own pencil does not write in the 306px card any more: it
     opens that card in the writing pane, the width of the column */
  const openCard = function(i){
    openFull(i);
  };

  const closeCard = function(){
    if(editing < 0) return;
    viewCard(editing, 'view');
    editing = -1;
  };

  /* ── A ROW'S OWN ADD CARD ──
     One more card joins the prompt that row stands for, to the right of the
     ones it has. A prompt starts with six and can hold more; nothing else on
     the page adds one. The card does NOT open: it lands empty in the grid,
     where its own pencil opens it, so pressing Add card never throws the
     page into the writing column. A pane that is already open is put away
     first - what was typed in it is committed to the card it belongs to,
     because the page is about to move to the prompt this card joins and
     text left in the open pane would otherwise land on the wrong card. */
  const addCardTo = function(i){
    const all = savedEntries();
    if(isNaN(i) || i < 0 || i >= all.length) return;
    const openPane = document.querySelector('#page-inspire .idea-write:not([hidden])');
    if(openPane) closeFull();
    const list = cardsOf(all[i]);
    if(!list) return;
    cur = i;
    list.push('');
    syncText(list, all[i]);
    saveIt();
    paint();
    markRows();
    /* the card that was just made is the one thing the press was for, and
       with the columns keeping their size it lands a column further right,
       behind the grid's scrollbar: the grid is taken to that end so the new
       card is the one in view. */
    const box = document.getElementById('ideaCards');
    if(box) box.scrollLeft = box.scrollWidth - box.clientWidth;
  };

  /* the prompt in view is taken out of the card you are on */
  const clearCard = function(){
    const list = store();
    if(!list) return;
    if(!String(list[sel] || '').trim()){ toastIt('Nothing to clear', 'warn'); return; }
    list[sel] = '';
    editing = -1;
    paint();
    saveSoon();
    toastIt('Cleared');
  };

  /* ── the bin on a card ──
     The bin takes the card AWAY — the card itself, not only what is written
     in it — and the ones behind it close up, so a prompt can be cut down to
     the cards it really uses. Clear (on the bar) is what empties a card in
     place; this is the one that removes it. Cutting the last card away is
     allowed too: the grid says the prompt has none, and the row's own Add
     card puts one back. */
  const deleteCard = function(i){
    const list = store();
    if(!list) return;
    if(isNaN(i) || i < 0 || i >= list.length) return;
    list.splice(i, 1);
    const entry = savedEntries()[cur];
    if(entry) syncText(list, entry);
    if(editing >= list.length) editing = -1;
    if(sel >= list.length) sel = Math.max(0, list.length - 1);
    saveIt();
    paint();
    mark();
    markRows();
    toastIt('Card deleted');
  };

  /* ── the row you are on ──
     A click on the left card's row opens that prompt: the six cards on the
     right become its own. It is the draft list's own gesture. A click on
     the row you are ALREADY on lets it go (-1): the six cards go back to
     being nobody's, exactly as they are on a page with no prompt. */
  const openPrompt = function(i){
    const list = savedEntries();
    if(isNaN(i) || i >= list.length) return;
    cur = i;
    editing = -1;
    paint();
    markRows();
    saveSoon();
  };

  /* ── New card is gone ──
     A prompt holds its six cards and nothing here adds a seventh: the row
     of cards never runs past the column, so there is no sideways scrollbar
     under it. A card is written by opening it in the pane. */

  /* ── New prompt ──
     A prompt of its own joins the left card with all six cards empty and
     ready, and it is asked for its name the way New draft asks for a
     draft's. Nothing already written is touched. */
  const newPrompt = function(){
    const list = savedEntries();
    const entry = blank();
    /* the new row is named the moment it is made, and never with a name that
       is already on the shelf */
    entry.title = freeTitle('Untitled prompt');
    list.unshift(entry);
    cur = 0;
    editing = -1;
    saveIt();
    const root = document.getElementById('page-inspire');
    if(root && typeof PAGE_RENDERERS.inspire === 'function') PAGE_RENDERERS.inspire(root);
    else paint();
    const row = document.querySelector('#page-inspire #ideaRows [data-idea-open="0"]');
    if(row) startRename(row);
    toastIt('New prompt');
  };

  /* ── the page ── */
  const orig = PAGE_RENDERERS.inspire;
  PAGE_RENDERERS.inspire = function(root){
    /* The prompts are settled BEFORE the left card is drawn from them: an
       entry written before a prompt owned its cards and the cards this page
       was holding both turn into prompts here, so the rows the renderer
       paints are the rows that exist - and the row you are on is the one the
       grid belongs to. */
    if(root && typeof S !== 'undefined' && S.config) migrate();
    orig(root);
    if(!root || !root.querySelector) return;

    editing = -1;

    /* one big card → the six-card grid. The grid is the page's ONLY surface,
       with or without a prompt: it is what is on the right the moment the
       page opens, and it stays there. */
    const box = root.querySelector('#inspireBox');
    if(box){
      box.hidden = true;
      box.id = 'inspireBoxOld';
      box.className = '';
      const grid = document.createElement('div');
      grid.className = 'idea-cards';
      grid.id = 'ideaCards';
      box.parentNode.insertBefore(grid, box);
    }

    /* The bar's left slot is the page's own AI door — “Prompt me” and the
       settings that fed it. This page does not write prompts: the cards are
       the writer's, and the app's AI is the round button's right-click. */
    const aiDoor = root.querySelector('.idea-bar-left')
      || root.querySelector('.idea-bar [data-idea="prompt"], .idea-bar [data-ic-prompt]');
    if(aiDoor && aiDoor.parentNode) aiDoor.parentNode.removeChild(aiDoor);

    /* ═══ The bar is the page's strip ═══
       It used to sit inside the writing card, over that one column. It is
       the page's own row now: the SAME element, lifted out of .idea-main and
       made the page's first child, so it runs the full width of the page
       above BOTH cards — the strip the Draft page's .sf-bar and the
       Bible's .page-head are. No markup is rebuilt and no handler is
       re-bound: only the parent changes, and every repaint of the page
       moves it again. */
    const barEl = root.querySelector('.idea-bar');
    if(barEl && barEl.parentNode !== root) root.insertBefore(barEl, root.firstChild);

    /* the bar's left end: this page's own type (T) and New prompt, in the
       order the Canvas bar uses them (mindmap.js:452). New card has left the
       bar — a card is written from the prompt's own row. */
    if(barEl && !barEl.querySelector('.idea-head-left')){
      const left = document.createElement('div');
      left.className = 'idea-head-left';
      left.innerHTML =
        '<button class="ol-btn ol-btn-icon" data-typop="inspire" title="Font, size and leading"><i class="bi bi-fonts"></i></button>'
        + '<button class="ol-btn idea-new" data-ic-new="1"><i class="bi bi-plus-lg"></i> <span>New prompt</span></button>';
      barEl.insertBefore(left, barEl.firstChild);
    }

    /* The bar's Copy belongs to the old single prompt; it acts on the card
       you are on now, so it is taken off the page's own wiring before the
       page can read it as its own. The Save beside it — “Keep this prompt” —
       is gone: a prompt is made by New prompt, and every card is already in
       the left column. */
    Array.prototype.forEach.call(
      root.querySelectorAll('.idea-tools [data-idea="save"]'),
      function(b){ if(b.parentNode) b.parentNode.removeChild(b); });
    Array.prototype.forEach.call(
      root.querySelectorAll('.idea-tools [data-idea="copy"]'),
      function(b){
        b.removeAttribute('data-idea');
        b.setAttribute('data-ic-bar-copy', '1');
      });

    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(root);
    paint();
    watchList();

    /* the T on the bar is this page's own type, the way it is on every other
       page: the six cards' prompt text reads the --pg-* the panel writes.
       Seeded at 12px - what the cards already wear - so the panel opens on
       the page as it looks now instead of moving the words a step on its
       first apply. */
    if(typeof S !== 'undefined' && S.config){
      if(!S.config.typo || typeof S.config.typo !== 'object') S.config.typo = {};
      if(!S.config.typo.inspire) S.config.typo.inspire = { font:'', size:12, lh:1.6, weight:'400' };
    }
    if(typeof typoApply === 'function') typoApply('inspire', root);
  };

  /* ═══ THE WRITING PANE ═══
     A card is WRITTEN in the column, not in the 306px card it is shown in:
     the pane is the Draft page's own writing surface — the same
     --surface-1 card, the same 1px line, the same rounded corner — at the
     width and height the six cards take. The six step aside while it is
     open; the tick writes what was written back into the card it was
     opened for and the six come back exactly as they were. A prompt's own
     row opens it too (Edit this prompt), on that prompt's first card. */
  const paneRoot = function(){
    const main = document.querySelector('#page-inspire .idea-main');
    if(!main) return null;
    let pane = main.querySelector('.idea-write');
    if(!pane){
      pane = document.createElement('div');
      pane.className = 'idea-write';
      pane.hidden = true;
      pane.innerHTML =
        '<div class="idea-write-head">'
        +   '<span class="idea-write-num"></span>'
        +   '<button class="ol-btn idea-write-done" data-ic-wdone="1" title="Done — keep this card">'
        +     '<i class="bi bi-check2"></i><span>Done</span></button>'
        + '</div>'
        + '<textarea class="idea-write-body" spellcheck="false" placeholder="Write your prompt…"></textarea>';
      main.appendChild(pane);
    }
    return pane;
  };

  const openFull = function(i){
    const list = store();
    if(!list){ toastIt('Pick a prompt on the left first', 'warn'); return; }
    if(isNaN(i) || i < 0 || i >= list.length) return;
    const pane = paneRoot();
    if(!pane) return;
    sel = i;
    editing = i;
    const ta = pane.querySelector('.idea-write-body');
    const num = pane.querySelector('.idea-write-num');
    const entry = savedEntries()[cur];
    /* "of" is the prompt's OWN card count - the six it starts with, or more
       once the row's Add card has made a seventh */
    if(num) num.textContent = 'Card ' + (i + 1) + ' of ' + list.length + (entry ? ' \u00b7 ' + entryTitle(entry) : '');
    if(ta) ta.value = String(list[i] || '');
    const grid = document.getElementById('ideaCards');
    pane.hidden = false;
    if(grid) grid.classList.add('ic-away');
    markRows();
    if(!ta) return;
    try{ ta.focus(); }catch(e){}
    try{ const at = ta.value.length; ta.setSelectionRange(at, at); }catch(e){}
  };

  /* the tick: what was written goes into that card, and the six come back */
  const closeFull = function(){
    const pane = document.querySelector('#page-inspire .idea-write');
    if(!pane || pane.hidden) return;
    const ta = pane.querySelector('.idea-write-body');
    const list = store();
    if(list && editing >= 0 && ta){
      list[editing] = ta.value;
      const entry = savedEntries()[cur];
      if(entry) syncText(list, entry);
      saveIt();
    }
    pane.hidden = true;
    const grid = document.getElementById('ideaCards');
    if(grid) grid.classList.remove('ic-away');
    editing = -1;
    paint();
    mark();
    markRows();
  };

  /* the button that opened the pane must not steal focus on the press */
  document.addEventListener('mousedown', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('[data-ic-wdone]')) e.preventDefault();
  }, true);

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('[data-ic-wdone]')){
      e.preventDefault();
      e.stopPropagation();
      closeFull();
    }
  }, true);

  /* every keystroke in the pane is the card's own text, kept with the project */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.classList || !t.classList.contains('idea-write-body')) return;
    const list = store();
    if(!list || editing < 0) return;
    list[editing] = t.value;
    const entry = savedEntries()[cur];
    if(entry) syncText(list, entry);
    saveSoon();
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    const pane = document.querySelector('#page-inspire .idea-write');
    if(pane && !pane.hidden){ e.preventDefault(); closeFull(); }
  }, true);

  /* ── the card's own button must not steal focus ──
     A press on the pencil (or on the tick it becomes) would otherwise blur
     the field the card is written in, and blurring closes the card: the tick
     would shut it a beat before the click that follows opened it again, so
     the tick looked dead. The press no longer moves focus, and the click
     alone decides which way the card goes. */
  document.addEventListener('mousedown', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('#ideaCards [data-ic-edit], #ideaCards [data-ic-del]')) e.preventDefault();
  }, true);

  /* ── clicks ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    /* Clear — the prompt leaves the card it is shown in */
    const cl = t.closest('[data-sf-clear]');
    if(cl){ e.preventDefault(); e.stopPropagation(); clearCard(); return; }

    /* New prompt makes a prompt — its own row in the left card, with all
       six cards empty and ready */
    if(t.closest('[data-ic-new]')){
      e.preventDefault(); e.stopPropagation();
      newPrompt();
      return;
    }

    /* the bar's Copy and Save, acting on the card you are on */
    if(t.closest('[data-ic-bar-copy]')){
      e.preventDefault(); e.stopPropagation();
      copyText(wordsOf(sel));
      return;
    }
    if(t.closest('[data-ic-bar-save]')){
      e.preventDefault(); e.stopPropagation();
      askTitle(wordsOf(sel));
      return;
    }

    /* the bin on a card: that one card leaves the prompt */
    const dl = t.closest('#ideaCards [data-ic-del]');
    if(dl){
      e.preventDefault(); e.stopPropagation();
      deleteCard(parseInt(dl.getAttribute('data-ic-del'), 10));
      return;
    }

    const ed = t.closest('#ideaCards [data-ic-edit]');
    if(ed){
      e.preventDefault(); e.stopPropagation();
      const i = parseInt(ed.dataset.icEdit, 10);
      if(isNaN(i)) return;
      /* the tick closes the card the pencil opened */
      if(ed.hasAttribute('data-ic-done') || i === editing) closeCard();
      else openCard(i);
      return;
    }


    /* a row's own Add card: one more card on THAT prompt, opened in the
       writing pane */
    const nw = t.closest('#page-inspire #ideaRows [data-idea-newcard]');
    if(nw){
      e.preventDefault(); e.stopPropagation();
      addCardTo(parseInt(nw.getAttribute('data-idea-newcard'), 10));
      return;
    }

    /* a prompt opened: the grid becomes ITS six cards */
    const row = t.closest('[data-idea-open]');
    if(row){
      if(t.closest('.ol-tool')) return;             /* its own edit / rename / remove */
      const i = parseInt(row.dataset.ideaOpen, 10);
      /* a second click on the row you are on lets it go - the same gesture
         the dashboard's project card has */
      openPrompt(i === cur ? -1 : i);
      return;
    }

    /* the card itself — never preventDefault, the field needs the caret */
    const sl = t.closest('[data-ic-slot]');
    if(sl){
      const i = parseInt(sl.dataset.icSlot, 10);
      if(!isNaN(i)){
        sel = i;
        mark();
      }
    }
  }, true);

  /* ── right-click: copy, and paste ── */
  document.addEventListener('contextmenu', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    /* a saved prompt — its label goes onto the clipboard */
    const row = t.closest('#page-inspire #ideaRows [data-idea-open]');
    if(row && !t.closest('.ol-tool')){
      e.preventDefault(); e.stopPropagation();
      const i = parseInt(row.dataset.ideaOpen, 10);
      if(!isNaN(i)) copyBlock(entryTitle(savedEntries()[i]), 'the label');
      return;
    }

    /* the prompt in a card, while the card is a view — the prompt itself */
    const slot = t.closest('#ideaCards [data-ic-slot]');
    if(slot && !t.closest('.idea-slot-acts') && parseInt(slot.dataset.icSlot, 10) !== editing){
      const txt = wordsOf(parseInt(slot.dataset.icSlot, 10));
      if(txt){ e.preventDefault(); e.stopPropagation(); copyBlock(txt, 'the prompt'); }
      return;
    }

    /* an empty box on any page — what was copied goes in.
       Nothing of ours to do when the app (or the browser) already has the
       right-click: the manuscript's own editor keeps its writing menu, and
       so does any handler that has already answered this one. */
    if(!clip || e.defaultPrevented) return;
    if(t.closest('#editor, .write-canvas, .editor-doc')) return;
    const field = fieldOf(t);
    if(!field || field.readOnly || field.disabled || !isBlank(field)) return;
    if(!pasteInto(field, clip)) return;
    e.preventDefault();
    e.stopPropagation();
    toastIt('Pasted');
  }, true);

  /* the write is closed by clicking away, and by Escape */
  document.addEventListener('blur', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.icInput === 'undefined') return;
    if(parseInt(t.dataset.icInput, 10) === editing) closeCard();
  }, true);

  document.addEventListener('keydown', function(e){
    const t = e.target;
    if(!t || !t.dataset) return;

    if(e.key === 'Escape' && typeof t.dataset.icInput !== 'undefined' && parseInt(t.dataset.icInput, 10) === editing){
      e.preventDefault();
      closeCard();
      return;
    }

    if(typeof t.dataset.ideaRenInput === 'undefined') return;
    if(e.key === 'Enter'){ e.preventDefault(); endRename(t, false); }
    else if(e.key === 'Escape'){ e.preventDefault(); endRename(t, true); }
  }, true);

  document.addEventListener('blur', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.ideaRenInput === 'undefined') return;
    endRename(t, false);                     /* clicking away keeps it too */
  }, true);

  /* ── the row’s pencil renames it ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    const ren = t.closest('[data-idea-ren]');
    if(!ren) return;
    e.preventDefault();
    e.stopPropagation();
    startRename(ren.closest('[data-idea-open]'));
  }, true);

  /* every keystroke is the writer’s own text, kept with the project */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(!t || !t.dataset || typeof t.dataset.icInput === 'undefined') return;
    if(t.readOnly) return;
    const i = parseInt(t.dataset.icInput, 10);
    if(isNaN(i)) return;
    const list = store();
    if(!list) return;
    list[i] = t.value;
    syncText(list);
    sel = i;
    mark();
    saveSoon();
  }, true);

  /* ── Plan board — every beat’s type picker wears the app’s dropdown card.
     The dropdown component is wired to <select class="sel">, so the board’s
     selects get that class before they are enhanced. ── */
  const skinBoard = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    Array.prototype.slice.call(board.querySelectorAll('select.beat-type')).forEach(function(s){
      s.classList.add('sel');
    });
    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(board);
  };

  if(typeof window.renderBeats === 'function'){
    const rb = window.renderBeats;
    window.renderBeats = function(){
      const r = rb.apply(this, arguments);
      skinBoard();
      return r;
    };
  }

  /* the board’s own click handler redraws it — keep that path skinned too */
  document.addEventListener('change', function(e){
    if(e.target && e.target.classList && e.target.classList.contains('beat-type')) setTimeout(skinBoard, 0);
  }, true);

  /* ── keep the open list fully visible ──
     The board scrolls and the cards are small, so an open dropdown raises its
     own card and flips the list above the title when there is no room below. ── */
  document.addEventListener('click', function(e){
    const board = document.getElementById('beatList');
    if(!board) return;
    const t = e.target;

    if(!t || !t.closest || !t.closest('#beatList .dd-card')){
      Array.prototype.slice.call(board.querySelectorAll('.beat-card.beat-open')).forEach(function(c){
        c.classList.remove('beat-open');
      });
      return;
    }

    setTimeout(function(){
      const bRect = board.getBoundingClientRect();
      Array.prototype.slice.call(board.querySelectorAll('.beat-card')).forEach(function(cardEl){
        const card = cardEl.querySelector('.dd-card');
        if(!card) return;
        const open = card.classList.contains('open');
        cardEl.classList.toggle('beat-open', open);
        if(!open){ card.classList.remove('dd-up'); return; }
        const roomBelow = bRect.bottom - card.getBoundingClientRect().bottom;
        card.classList.toggle('dd-up', roomBelow < 190);
      });
    }, 0);
  }, true);
})();


/* ══════════ the dashboard ══════════ */
/* ═══════════════════════════════════════════════════════════
   Dashboard — no players on it.

   While the dashboard is the page, both player panels (Music and
   Video), the video playlist and both mini players stay hidden. The
   Player button is gone from the dashboard's top bar too (index.html).
   Everywhere else — the writer, the FAB menu, the overlay — nothing
   changes.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const mark = function(id){
    if(!document.body) return;
    document.body.classList.toggle('sf-dash', id === 'home');
  };

  /* follow the router */
  if(typeof window.goPage === 'function' && !window.goPage.__dashWrapped){
    const orig = window.goPage;
    const wrapped = function(id){
      const out = orig.apply(this, arguments);
      try{ mark(id); }catch(e){ /* never break navigation over a class */ }
      return out;
    };
    wrapped.__dashWrapped = true;
    window.goPage = wrapped;
  }

  const start = function(){ mark((window.S && S.page) || 'home'); };
  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();


/* ══════════ the Plan page’s head ══════════ */
/* ═══════════════════════════════════════════════════════════
   Plan — the head.

   · T stays on the left, with “New board” right after it.
   · Top right: an “All boards” switch, then Reset.
       – All boards  : on, the board tightens up so every card is on
                       screen at once instead of scrolling.
       – Reset       : clears the board (the app's own confirm first —
                       it reuses the clear-beats action).
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const on = function(){ return !!(S.config && S.config.planAll); };

  const paintSwitch = function(btn){
    if(!btn) return;
    btn.classList.toggle('on', on());
    btn.setAttribute('aria-pressed', on() ? 'true' : 'false');
  };

  const orig = PAGE_RENDERERS.plan;
  PAGE_RENDERERS.plan = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    const head = root.querySelector('.plan-head') || root.querySelector('.page-head');
    if(!head) return;

    /* ── the buttons are the page's own; plan-boards.js places them.
       Add beat is not renamed: starting a board is the picker's own ＋. ── */

    /* ── right: All boards, then Reset ── */
    let right = head.querySelector('.plan-actions');
    if(!right){
      right = document.createElement('div');
      right.className = 'ol-actions plan-actions';
      head.appendChild(right);
    }

    let allSw = right.querySelector('[data-act="plan-all"]');
    if(!allSw){
      allSw = document.createElement('button');
      allSw.className = 'ol-btn plan-allsw';
      allSw.setAttribute('data-act', 'plan-all');
      allSw.title = 'Fit every board on screen at once';
      allSw.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> All boards';
      right.insertBefore(allSw, right.firstChild || null);
    }
    paintSwitch(allSw);

    /* one Clear for the board — the page already draws one, so only add it
       when this head has none at all */
    if(!head.querySelector('[data-act="clear-beats"]')){
      const reset = document.createElement('button');
      reset.className = 'ol-btn';
      reset.setAttribute('data-act', 'clear-beats');
      reset.title = 'Clear the cards off this board';
      reset.innerHTML = '<i class="bi bi-eraser"></i> Clear';
      right.appendChild(reset);
    }

    /* the switch's state lives on the page */
    root.classList.toggle('plan-all', on());
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="plan-all"]')) return;
    e.preventDefault();
    if(!S.config) S.config = {};
    S.config.planAll = !S.config.planAll;
    if(typeof save === 'function') save();
    paintSwitch(t.closest('[data-act="plan-all"]'));
    const root = document.getElementById('page-plan');
    if(root) root.classList.toggle('plan-all', on());
  }, true);
})();

