/* ═══════════════════════════════════════════════════════════
   ScriptForge — Electron preload

   The only door between the page and the desktop: window buttons,
   native save/open dialogs and the JSON backup folder. Everything is
   plain invoke/send — the page never sees Node.
   ═══════════════════════════════════════════════════════════ */
const { contextBridge, ipcRenderer, webUtils } = require('electron');

/* the real path of a dropped file — the app uses this for drag & drop */
contextBridge.exposeInMainWorld('electronPath', {
  getPathForFile: (file) => {
    try{
      return webUtils.getPathForFile(file);
    }catch(e){
      return null;
    }
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,

  /* window buttons (renderer.js sends these) */
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  /* files — FS.saveFile() / FS.openFile() pick these up automatically.
     opts.path rewrites that same file; opts.ask forces the dialog again. */
  saveFile: (filename, content, opts) => ipcRenderer.invoke('save-file', {
    filename: filename,
    content: content,
    path: (opts && opts.path) || null,
    ask: !!(opts && opts.ask)
  }),
  openFile: (opts) => ipcRenderer.invoke('open-file', opts),
  showInFolder: (p) => ipcRenderer.invoke('show-in-folder', p)
});

/* the backup bridge — the autosave section of app.js prefers this over a download */
contextBridge.exposeInMainWorld('sfDesktop', {
  isDesktop: true,
  platform: process.platform,
  saveBackup: (name, text) => ipcRenderer.invoke('backup-write', { name, text }),
  backupsDir: () => ipcRenderer.invoke('backup-dir'),
  revealBackups: () => ipcRenderer.invoke('backup-reveal')
});
