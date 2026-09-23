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
