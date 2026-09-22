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
