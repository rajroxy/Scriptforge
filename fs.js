/* ═══════════════════════════════════════════════════════════
   fs.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · fs.js
     · io.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ fs.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — File System
   Unified save/open for browser + Electron

   Saving is *one file per name*: the first save asks where it goes,
   and every save after that rewrites that same file in place — never a
   second copy called “untitled (1).json”.
     · desktop app  → the path the writer picked is remembered and
                      rewritten directly, with no dialog
     · browser      → the file handle is kept and reused
     · no picker    → the browser forces a download (a page is never
                      allowed to overwrite one), so the result says so
   ═══════════════════════════════════════════════════════════ */

const FS = {};

// ═══ Detect environment ═══
FS.isElectron = () => !!(window.electronAPI && window.electronAPI.saveFile);
FS.hasFilePicker = () => typeof window.showSaveFilePicker === 'function';
FS.hasDirectoryPicker = () => typeof window.showDirectoryPicker === 'function';

// ═══ The files this session has already written, by name ═══
const handles = {};                       /* browser: name → FileSystemFileHandle */
const paths   = {};                       /* desktop: name → absolute path */

// ═══ Save a file to disk — rewriting the same one when we know it ═══
FS.saveFile = async function(filename, content, mimeType, opts){
  mimeType = mimeType || 'application/json';
  opts = opts || {};
  const known = opts.path || paths[filename] || null;

  // 1. Electron native dialog (skipped once the file has a home)
  if(FS.isElectron() && typeof window.electronAPI.saveFile === 'function'){
    try{
      const res = await window.electronAPI.saveFile(filename, content,
        { path: known, ask: !!opts.ask });
      const p = (res && res.path) || known || null;
      if(p) paths[filename] = p;
      return { ok: true, path: p, replaced: !!(res && res.replaced), method: 'electron' };
    }catch(e){
      if(String((e && e.message) || '').indexOf('cancelled') >= 0) return { ok: false, error: 'cancelled' };
      return { ok: false, error: e.message };
    }
  }

  // 2. Chrome/Edge showSaveFilePicker — the handle is kept and reused
  if(FS.hasFilePicker()){
    const linked = handles[filename];
    if(linked && !opts.ask){
      try{
        const perm = linked.queryPermission ? await linked.queryPermission({ mode:'readwrite' }) : 'granted';
        if(perm === 'granted'){
          const w = await linked.createWritable();
          await w.write(content);
          await w.close();
          return { ok: true, path: linked.name, replaced: true, method: 'handle' };
        }
      }catch(e){ /* the handle went stale — ask for the file again */ }
    }
    try{
      const ext = '.' + String(filename).split('.').pop();
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        startIn: linked || undefined,
        types: [{ description: 'Project file', accept: { [mimeType]: [ext] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      handles[filename] = handle;
      return { ok: true, path: handle.name, replaced: !!linked, method: 'picker' };
    }catch(e){
      if(e.name === 'AbortError') return { ok: false, error: 'cancelled' };
      // no picker (a framed page cannot open one) — fall through to download
    }
  }

  // 3. Browser fallback — a download; the browser names it, never us
  try{
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, path: '~/Downloads/' + filename, method: 'download', download: true, replaced: false };
  }catch(e){
    return { ok: false, error: e.message };
  }
};

// ═══ Open a file from disk ═══
FS.openFile = function(accept){
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '.json,.txt,.md,.html';
    input.onchange = async ev => {
      const f = ev.target.files[0];
      if(!f){ resolve(null); return; }
      try{
        const text = await f.text();
        resolve({ name: f.name, content: text, size: f.size });
      }catch(e){ reject(e); }
    };
    input.click();
  });
};

window.FS = FS;

console.log('%c ✓ fs.js loaded', 'color:#10b981;font-weight:600;');


/* ══════════ io.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Import / Export
   ═══════════════════════════════════════════════════════════ */

const IO = {};

// ═══ Export current project as JSON ═══
IO.exportProject = async function(){
  const d = D();
  const proj = (d.projects || []).find(p => p.id === d.currentProject);
  if(!proj){
    toast('No project open', 'warn');
    return;
  }

  const payload = {
    app: 'ScriptForge',
    version: 1,
    exportedAt: new Date().toISOString(),
    mode: S.mode,
    category: proj.category,
    project: {
      id: proj.id,
      name: proj.name,
      created: proj.created,
      chapters: proj.chapters || [],
      notes: proj.notes || [],
      beats: proj.beats || [],
      cast: proj.cast || [],
      references: proj.references || [],
      timeline: proj.timeline || [],
      kanban: proj.kanban || null
    }
  };

  const filename = (proj.name || 'project').replace(/[^a-z0-9\-_ ]/gi, '_') + '.json';
  const json = JSON.stringify(payload, null, 2);

  /* the file keeps its home, so the next export rewrites it instead of
     arriving beside it as “name (1).json” */
  const res = await FS.saveFile(filename, json, 'application/json', { path: proj.savedPath || null });
  if(res.ok){
    if(res.method !== 'download' && res.path) proj.savedPath = res.path;
    save();
    if(res.download){
      toast('Downloaded ' + filename + ' — the browser names a download, so it cannot be overwritten here', 'warn');
    }else{
      toast((res.replaced ? 'Updated ' : 'Saved ') + (res.path || filename));
    }
    const infoEl = document.getElementById('projectSavedPath');
    if(infoEl) infoEl.textContent = proj.savedPath || '';
  } else if(res.error && res.error !== 'cancelled'){
    toast('Export failed: ' + res.error, 'err');
  }
};

// ═══ Import a project from a JSON file ═══
IO.importProject = async function(){
  const file = await FS.openFile('.json');
  if(!file) return;

  let parsed;
  try{
    parsed = JSON.parse(file.content);
  }catch(e){
    toast('Invalid JSON file', 'err');
    return;
  }

  // Validate — look for project object
  const src = parsed.project || parsed;
  if(!src || typeof src !== 'object'){
    toast('File does not contain a project', 'err');
    return;
  }

  // Import into the current mode
  const d = D();
  const newId = uid();
  const catId = src.category || d.currentCategory || currentMode()?.categories?.[0]?.id;

  const newProj = {
    id: newId,
    name: (src.name || file.name.replace(/\.[^.]+$/, '')) + ' (imported)',
    category: catId,
    mode: S.mode,
    created: src.created || Date.now(),
    chapters: src.chapters || [{id: uid(), title:'Section 1', content:'', children:[], collapsed:false}],
    notes: src.notes || [],
    beats: src.beats || [],
    cast: src.cast || [],
    references: src.references || [],
    timeline: src.timeline || [],
    kanban: src.kanban || null
  };

  if(!Array.isArray(d.projects)) d.projects = [];
  d.projects.push(newProj);
  useProjectData(newProj);           // the import gets its own Views · Reference · Workflow
  d.currentCategory = catId;
  d.currentChapter = newProj.chapters[0]?.id || null;
  save();

  toast('Imported: ' + newProj.name);

  // Refresh UI
  if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(catId);
  if(typeof goPage === 'function') goPage('inspire');   // land on the Idea view
};

window.IO = IO;

console.log('%c ✓ io.js loaded', 'color:#10b981;font-weight:600;');

