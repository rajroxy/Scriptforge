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
      return handle ? handle.name : 'Choose file';
    },
    linked: function(){ return !!desk() || !!handle; },
    isDesktop: function(){ return !!desk(); },
    backup: backup,
    link: async function(){
      /* in the desktop app the folder already exists — just show it */
      if(desk()){
        try{ await desk().revealBackups(); toast('Backups folder opened'); }
        catch(e){ toast('The backups folder could not be opened', 'warn'); }
        return;
      }
      if(typeof window.showSaveFilePicker !== 'function'){
        toast('This browser cannot link a file — the copy goes to Downloads', 'warn');
        return;
      }
      try{
        handle = await window.showSaveFilePicker({
          suggestedName: fileName(),
          types: [{ description:'JSON backup', accept: { 'application/json': ['.json'] } }]
        });
        const text = JSON.stringify(payload(), null, 2);
        if(await writeToHandle(text)) toast('Backing up to ' + handle.name);
      }catch(e){ /* dismissed */ }
    }
  };

  /* ── the timers ── */
  const last = function(){ const n = parseInt(localStorage.getItem(STAMP_KEY) || '0', 10); return isNaN(n) ? 0 : n; };
  const stamp = function(){ try{ localStorage.setItem(STAMP_KEY, String(Date.now())); }catch(e){} };

  /* ── writing activity — a backup only happens for a window in which
        something was actually written, even one word. Opening a project
        and leaving it alone writes nothing. ── */
  let lastWrite = 0;
  let wroteSomething = false;
  const markWrite = function(){ lastWrite = Date.now(); wroteSomething = true; };

  /* Only the writing surfaces count. Settings fields, the command box, the
     search panels and the plugin cards are not the writer working on the
     project, so they must never trigger a backup on their own. */
  const WRITES = '#editor, .editor-doc, .write-doc, [contenteditable="true"], textarea, input';
  const writing = function(t){
    if(!t || !t.closest) return false;
    if(t.closest('.modal-scrim, #cmdBox, #fabAI, #fabMenu, .sf-plugin, .sf-tip, .toast-area, .set-shell')) return false;
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
  const DOWNLOAD_EVERY = 10 * 60 * 1000;      /* no linked file → one download per 10 min */
  let lastSnapshot = 0, lastDownload = 0;

  /* the file: rewritten in place every 10 seconds, as soon as anything new
     has been written since the last pass */
  const tick = async function(){
    if(S.config.autoVersion === false && S.config.autoJson === false) return;
    if(!wroteInWindow()) return;                        /* nothing new → nothing saved */

    const now = Date.now();

    if(S.config.autoVersion !== false && now - lastSnapshot >= SNAPSHOT_EVERY){
      lastSnapshot = now;
      try{ TOOLS.snapshot(true); }catch(e){}
    }

    /* the JSON copy — only when its own switch is on */
    if(S.config.autoJson === false) return;

    /* the desktop app: one file per project, rewritten in place every pass */
    if(desk()){
      if(await writeToDesktop(JSON.stringify(payload(), null, 2), fileName())
         && now - lastWrite < 20000) toastLeft('Saved ' + fileName());
      return;
    }

    if(handle){
      const how = await backup();
      if(how === 'file' && now - lastWrite < 20000) toastLeft('Saved ' + handle.name);
      return;
    }

    /* no file linked yet, in a browser: the copy goes to Downloads, but only
       occasionally — a browser cannot overwrite its own download */
    if(now - lastDownload >= DOWNLOAD_EVERY){
      lastDownload = now;
      download(JSON.stringify(payload(), null, 2), fileName());
      toastLeft('Downloaded ' + fileName() + ' — press Choose file to rewrite one file instead');
    }
  };

  window.SF_AUTO.touched = markWrite;

  setInterval(tick, 10 * 1000);            /* the file is rewritten every 10 seconds */
  setTimeout(tick, 10 * 1000);
})();
