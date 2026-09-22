/* ═══════════════════════════════════════════════════════════
   ScriptForge — Electron main process

   One command opens the whole app as a desktop program:

       bun run desktop        (or: npm run desktop)

   What it does:
     · serves the app itself on 127.0.0.1 through desktop-server.cjs, so
       /api/dict and /api/publish keep working with nothing installed
       (set SF_APP_URL to point it at a dev server instead)
     · remembers window size and position between launches
     · a native menu with the usual Edit / View roles
     · window buttons, native save/open dialogs and the JSON backup
       folder for the renderer, through preload.cjs
   ═══════════════════════════════════════════════════════════ */
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const { startServer } = require('./desktop-server.cjs');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3187);
const BACKUP_DIR = path.join(app.getPath('documents'), 'ScriptForge Backups');

let localServer = null;
let mainWindow = null;

/* ── window size + position, remembered between launches ── */
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function readState(){
  try{ return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); }catch(e){ return {}; }
}
let state = {};
let saveStateTimer = null;
function remember(){
  if(!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) return;
  const b = mainWindow.getNormalBounds ? mainWindow.getNormalBounds() : mainWindow.getBounds();
  state = { x: b.x, y: b.y, width: b.width, height: b.height, maximized: mainWindow.isMaximized() };
  if(saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(function(){
    try{ fs.writeFileSync(stateFile(), JSON.stringify(state)); }catch(e){}
  }, 400);
}

/* ── the server behind the window ──
   SF_APP_URL points the window at a dev server (bun run dev) when you want
   hot reload; otherwise the app serves itself, with no dependencies. */
async function ensureServer(){
  if(process.env.SF_APP_URL) return process.env.SF_APP_URL;
  try{
    localServer = await startServer({
      root:    ROOT,
      dataDir: app.getPath('userData'),          /* published books survive updates */
      port:    PORT,
      mwKey:   process.env.MW_API_KEY || ''
    });
    return localServer.url;
  }catch(e){
    console.error('server failed to start:', e && e.message);
    return null;                                 /* fall back to the plain file */
  }
}

function stopServer(){
  if(localServer && typeof localServer.close === 'function'){
    try{ localServer.close(); }catch(e){}
  }
  localServer = null;
}

/* ── the window ── */
async function createWindow(){
  state = readState();
  const url = await ensureServer();

  mainWindow = new BrowserWindow({
    width:  state.width  || 1280,
    height: state.height || 820,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0b0d10',
    title: '',                                  /* the page owns the title */
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(ROOT, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      webSecurity: true
    }
  });

  if(state.maximized) mainWindow.maximize();

  mainWindow.once('ready-to-show', function(){ mainWindow.show(); });

  if(url){
    mainWindow.loadURL(url);
  }else{
    mainWindow.loadFile(path.join(ROOT, 'index.html'));
  }

  /* links leave the app, the app itself never navigates away */
  mainWindow.webContents.setWindowOpenHandler(function(details){
    if(/^https?:/i.test(details.url)) shell.openExternal(details.url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', function(e, target){
    const here = url || 'file://';
    if(target.split('#')[0] === here.split('#')[0]) return;
    if(/^https?:/i.test(target) && url && target.indexOf(url.split('/index.html')[0]) !== 0){
      e.preventDefault();
      shell.openExternal(target);
    }
  });

  ['resize', 'move', 'maximize', 'unmaximize'].forEach(function(ev){
    mainWindow.on(ev, remember);
  });
  mainWindow.on('closed', function(){ mainWindow = null; });
  return mainWindow;
}

/* ── the menu ── */
function buildMenu(){
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [
        { label: 'Backups folder…', click: () => { fs.mkdirSync(BACKUP_DIR, { recursive: true }); shell.openPath(BACKUP_DIR); } },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ] },
    { label: 'Edit', submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'pasteAndMatchStyle' }, { role: 'selectAll' }
      ] },
    { label: 'View', submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { label: 'Developer tools', accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => { if(mainWindow) mainWindow.webContents.toggleDevTools(); } },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ] },
    { label: 'Window', submenu: [ { role: 'minimize' }, { role: 'zoom' } ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ── the renderer bridge ── */
function wireIpc(){
  ipcMain.on('window-minimize', () => { if(mainWindow) mainWindow.minimize(); });
  ipcMain.on('window-maximize', () => {
    if(!mainWindow) return;
    if(mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
  });
  ipcMain.on('window-close', () => { if(mainWindow) mainWindow.close(); });
  ipcMain.handle('window-is-maximized', () => !!(mainWindow && mainWindow.isMaximized()));

  /* the app's own save / open dialogs */
  ipcMain.handle('save-file', async (_e, payload) => {
    const data = payload || {};
    const name = data.filename || 'untitled.json';
    const text = String(data.content == null ? '' : data.content);

    /* a file that already has a home is rewritten in place: no dialog, and
       never a second copy called “untitled (1).json” */
    const known = data.path ? String(data.path) : '';
    if(known && !data.ask){
      try{
        if(fs.existsSync(known)){
          await fsp.writeFile(known, text, 'utf8');
          return { path: known, replaced: true };
        }
      }catch(e){ /* the file moved or is locked — ask again below */ }
    }

    const res = await dialog.showSaveDialog(mainWindow, {
      defaultPath: known || path.join(app.getPath('documents'), name),
      filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'All files', extensions: ['*'] }]
    });
    if(res.canceled || !res.filePath) throw new Error('cancelled');
    await fsp.writeFile(res.filePath, text, 'utf8');
    return { path: res.filePath, replaced: !!known && res.filePath === known };
  });

  ipcMain.handle('open-file', async (_e, opts) => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: (opts && opts.filters) || [{ name: 'All files', extensions: ['json', 'txt', 'md', 'html', '*'] }]
    });
    if(res.canceled || !res.filePaths.length) return null;
    const file = res.filePaths[0];
    const content = await fsp.readFile(file, 'utf8');
    return { name: path.basename(file), path: file, content, size: content.length };
  });

  ipcMain.handle('show-in-folder', (_e, p) => {
    if(!p) return false;
    try{ shell.showItemInFolder(String(p)); return true; }catch(e){ return false; }
  });

  /* the JSON backup — one file per project, rewritten in place */
  ipcMain.handle('backup-write', async (_e, payload) => {
    const data = payload || {};
    const name = String(data.name || 'backup.json').replace(/[\\/:*?"<>|]/g, '_');
    try{
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const file = path.join(BACKUP_DIR, name);
      await fsp.writeFile(file, String(data.text == null ? '' : data.text), 'utf8');
      return { ok: true, path: file };
    }catch(e){
      return { ok: false, error: e.message };
    }
  });
  ipcMain.handle('backup-dir', () => { try{ fs.mkdirSync(BACKUP_DIR, { recursive: true }); return BACKUP_DIR; }catch(e){ return null; } });
  ipcMain.handle('backup-reveal', () => { try{ fs.mkdirSync(BACKUP_DIR, { recursive: true }); shell.openPath(BACKUP_DIR); return true; }catch(e){ return false; } });
}

/* ── lifecycle ── */
if(!app.requestSingleInstanceLock()){
  app.quit();
}else{
  app.on('second-instance', function(){
    if(mainWindow){ if(mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });

  app.whenReady().then(function(){
    buildMenu();
    wireIpc();
    createWindow();
    app.on('activate', function(){
      if(BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function(){
    remember();
    stopServer();
    if(process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', function(){ stopServer(); });
}
