/* ═══════════════════════════════════════════════════════════
   ScriptForge — GitHub Import
   OAuth device flow · browse repos · import files
   ═══════════════════════════════════════════════════════════ */

const GitHub = {
  token: null,           // { access_token, token_type }
  user: null,            // { login, avatar_url, name }
  repos: [],
  currentRepo: null,
  currentPath: '',
  currentBranch: null
};

// ═══════════════════════════════════════════════════════════
//   PANEL — open / close
// ═══════════════════════════════════════════════════════════

function openGitHubPanel(){
  var panel = document.getElementById('githubPanel');
  if(panel){ panel.hidden = false; return; }

  panel = document.createElement('div');
  panel.id = 'githubPanel';
  panel.className = 'github-panel';
  panel.innerHTML =
    '<div class="gh-head" id="githubPanelHead">' +
      '<div class="gh-title"><i class="bi bi-github"></i><span>Import from GitHub</span></div>' +
      '<button class="v-close" data-gh-close title="Close">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
          '<path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
    '</div>' +
    '<div class="gh-body" id="ghBody"></div>';
  document.body.appendChild(panel);

  restoreGitHubSession();
  renderGitHubBody();

  setTimeout(function(){
    initGitHubPanelDrag();
  }, 0);
}

function closeGitHubPanel(){
  const panel = document.getElementById('githubPanel');
  if(panel) panel.hidden = true;
}

function initGitHubPanelDrag(){
  var panel = document.getElementById('githubPanel');
  var head = document.getElementById('githubPanelHead');
  if(!panel || !head) return;
  if(head.dataset.dragWired === '1') return;
  head.dataset.dragWired = '1';

  var dragging = false;
  var offsetX = 0;
  var offsetY = 0;

  head.addEventListener('mousedown', function(e){
    if(e.target.closest('button')) return;
    if(e.target.closest('input')) return;
    if(e.target.closest('a')) return;

    dragging = true;

    var rect = panel.getBoundingClientRect();
    panel.style.transform = 'none';
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e){
    if(!dragging) return;
    var x = e.clientX - offsetX;
    var y = e.clientY - offsetY;

    var maxX = window.innerWidth - 60;
    var maxY = window.innerHeight - 60;
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));

    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
  });

  document.addEventListener('mouseup', function(){
    if(!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
  });
}

// ═══════════════════════════════════════════════════════════
//   SESSION — remember token across reloads
// ═══════════════════════════════════════════════════════════

function saveGitHubSession(){
  if(GitHub.token){
    localStorage.setItem('sf_github_token', JSON.stringify(GitHub.token));
    localStorage.setItem('sf_github_user', JSON.stringify(GitHub.user));
  }
}

function restoreGitHubSession(){
  try{
    const t = localStorage.getItem('sf_github_token');
    const u = localStorage.getItem('sf_github_user');
    if(t) GitHub.token = JSON.parse(t);
    if(u) GitHub.user  = JSON.parse(u);
  }catch(e){ /* ignore */ }
}

function clearGitHubSession(){
  GitHub.token = null;
  GitHub.user = null;
  GitHub.repos = [];
  GitHub.currentRepo = null;
  localStorage.removeItem('sf_github_token');
  localStorage.removeItem('sf_github_user');
}

// ═══════════════════════════════════════════════════════════
//   BODY — decides what to show based on auth state
// ═══════════════════════════════════════════════════════════

function renderGitHubBody(){
  const body = document.getElementById('ghBody');
  if(!body) return;

  if(!GitHub.token){
    body.innerHTML = renderSignInView();
    return;
  }

  if(GitHub.currentRepo){
    body.innerHTML = renderRepoBrowserView();
    return;
  }

  if(GitHub.repos.length){
    body.innerHTML = renderRepoListView();
    return;
  }

  body.innerHTML = renderLoadingView('Loading your repositories…');
  fetchUserRepos();
}

// ═══════════════════════════════════════════════════════════
//   VIEWS
// ═══════════════════════════════════════════════════════════

function renderSignInView(){
  return `
    <div class="gh-signin">
      <div class="gh-signin-icon"><i class="bi bi-github"></i></div>
      <div class="gh-signin-title">Sign in to GitHub</div>
      <div class="gh-signin-desc">
        Import files or whole repos directly from your GitHub account.
        Your token stays in this browser only.
      </div>
      <button class="btn btn-primary" data-gh-signin>
        <i class="bi bi-github"></i> Continue with GitHub
      </button>
      <div class="gh-signin-hint">
        Uses the GitHub Device Flow — no client secret stored in this app.
      </div>
    </div>
  `;
}

function renderRepoListView(){
  const list = GitHub.repos.map(r => `
    <button class="gh-repo-row" data-gh-repo="${esc(r.full_name)}">
      <i class="bi bi-${r.private ? 'lock-fill' : 'book'}"></i>
      <div class="gh-repo-body">
        <div class="gh-repo-name">${esc(r.name)}</div>
        <div class="gh-repo-desc">${esc(r.description || 'No description')}</div>
      </div>
      <div class="gh-repo-chevron"><i class="bi bi-chevron-right"></i></div>
    </button>
  `).join('');

  return `
    <div class="gh-user-bar">
      ${GitHub.user?.avatar_url ? `<img class="gh-avatar" src="${esc(GitHub.user.avatar_url)}">` : ''}
      <div class="gh-user-info">
        <div class="gh-user-name">${esc(GitHub.user?.name || GitHub.user?.login || '')}</div>
        <div class="gh-user-login">@${esc(GitHub.user?.login || '')}</div>
      </div>
      <button class="btn btn-ghost gh-small" data-gh-signout>Sign out</button>
    </div>

    <div class="gh-search-wrap">
      <i class="bi bi-search"></i>
      <input class="gh-search" id="ghRepoSearch" placeholder="Filter repositories…">
    </div>

    <div class="gh-repo-list" id="ghRepoList">${list || '<div class="gh-empty">No repositories.</div>'}</div>
  `;
}

function renderRepoBrowserView(){
  const r = GitHub.currentRepo;
  return `
    <div class="gh-breadcrumb">
      <button class="gh-crumb-btn" data-gh-back-to-repos>
        <i class="bi bi-chevron-left"></i> Repositories
      </button>
      <span class="gh-crumb-sep">/</span>
      <span class="gh-crumb-current">${esc(r.name)}</span>
      <button class="btn btn-ghost gh-small" style="margin-left:auto;" data-gh-import-whole>
        <i class="bi bi-download"></i> Import whole repo
      </button>
    </div>

    <div class="gh-path-bar">
      <i class="bi bi-folder2-open"></i>
      <span class="gh-path">${esc(GitHub.currentPath || '/')}</span>
      ${GitHub.currentPath ? `<button class="btn btn-ghost gh-small" data-gh-path-up>Up</button>` : ''}
    </div>

    <div class="gh-file-list" id="ghFileList">
      <div class="gh-loading"><div class="spin"></div> Loading…</div>
    </div>
  `;
}

function renderLoadingView(msg){
  return `<div class="gh-loading"><div class="spin"></div> ${esc(msg)}</div>`;
}

// ═══════════════════════════════════════════════════════════
//   DEVICE FLOW — sign in without a client secret
// ═══════════════════════════════════════════════════════════

// IMPORTANT: You must register a GitHub OAuth App with Device Flow enabled.
// https://github.com/settings/developers → New OAuth App → check "Enable Device Flow"
// Copy the Client ID below.
const GH_CLIENT_ID = 'Ov23ctDhQN3FbVvoES1D';
async function startGitHubSignIn(){
  const body = document.getElementById('ghBody');
  if(!body) return;

  if(GH_CLIENT_ID.startsWith('Ov23liXXXX')){
    body.innerHTML = `
      <div class="gh-error">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div>
          <div style="font-weight:600;margin-bottom:6px;">Client ID not configured</div>
          <div style="font-size:12px;line-height:1.6;">
            Open <code>github.js</code> and replace
            <code>GH_CLIENT_ID</code> with your OAuth App's Client ID.
            Enable <strong>Device Flow</strong> when creating the app at
            <a href="https://github.com/settings/developers" target="_blank">github.com/settings/developers</a>.
          </div>
        </div>
      </div>`;
    return;
  }

  try{
    const r = await fetch('https://github.com/login/device/code', {
      method:'POST',
      headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
      body: JSON.stringify({ client_id: GH_CLIENT_ID, scope: 'repo' })
    });
    const d = await r.json();
    if(!d.device_code) throw new Error(d.error_description || 'Could not start sign-in');

    body.innerHTML = `
      <div class="gh-device">
        <div class="gh-device-title">Enter this code on GitHub</div>
        <div class="gh-device-code">${esc(d.user_code)}</div>
        <a class="btn btn-primary" href="${esc(d.verification_uri)}" target="_blank" rel="noopener">
          <i class="bi bi-box-arrow-up-right"></i> Open GitHub
        </a>
        <div class="gh-device-hint">
          Waiting for authorization… this panel will update automatically.
        </div>
      </div>`;

    pollForToken(d.device_code, d.interval || 5, d.expires_in || 900);
  }catch(e){
    body.innerHTML = `<div class="gh-error"><i class="bi bi-exclamation-triangle-fill"></i> ${esc(e.message)}</div>`;
  }
}

async function pollForToken(deviceCode, interval, expiresIn){
  const started = Date.now();
  while(Date.now() - started < expiresIn * 1000){
    await new Promise(r => setTimeout(r, interval * 1000));
    try{
      const r = await fetch('https://github.com/login/oauth/access_token', {
        method:'POST',
        headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({
          client_id: GH_CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      });
      const d = await r.json();
      if(d.access_token){
        GitHub.token = { access_token: d.access_token, token_type: d.token_type || 'bearer' };
        await fetchUserInfo();
        saveGitHubSession();
        renderGitHubBody();
        return;
      }
      if(d.error === 'authorization_pending') continue;
      if(d.error === 'slow_down'){ interval += 5; continue; }
      if(d.error === 'access_denied'){ toast('Authorization denied', 'err'); renderGitHubBody(); return; }
      if(d.error === 'expired_token'){ toast('Code expired', 'err'); renderGitHubBody(); return; }
    }catch(e){ /* keep polling */ }
  }
  toast('Sign-in timed out', 'err');
  renderGitHubBody();
}

// ═══════════════════════════════════════════════════════════
//   API HELPERS
// ═══════════════════════════════════════════════════════════

function ghHeaders(){
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${GitHub.token.access_token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function fetchUserInfo(){
  const r = await fetch('https://api.github.com/user', { headers: ghHeaders() });
  if(r.ok) GitHub.user = await r.json();
}

async function fetchUserRepos(){
  try{
    const r = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers: ghHeaders() });
    if(!r.ok){
      if(r.status === 401){ clearGitHubSession(); renderGitHubBody(); return; }
      throw new Error('Could not load repos');
    }
    GitHub.repos = await r.json();
    renderGitHubBody();
  }catch(e){
    const body = document.getElementById('ghBody');
    if(body) body.innerHTML = `<div class="gh-error"><i class="bi bi-exclamation-triangle-fill"></i> ${esc(e.message)}</div>`;
  }
}

async function openRepo(fullName){
  const repo = GitHub.repos.find(r => r.full_name === fullName);
  if(!repo) return;
  GitHub.currentRepo = repo;
  GitHub.currentBranch = repo.default_branch || 'main';
  GitHub.currentPath = '';
  renderGitHubBody();
  loadRepoContents();
}

async function loadRepoContents(){
  const list = document.getElementById('ghFileList');
  if(!list) return;
  list.innerHTML = `<div class="gh-loading"><div class="spin"></div> Loading…</div>`;

  const { full_name, default_branch } = GitHub.currentRepo;
  const branch = GitHub.currentBranch || default_branch || 'main';
  const path = GitHub.currentPath;
  const url = `https://api.github.com/repos/${full_name}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;

  try{
    const r = await fetch(url, { headers: ghHeaders() });
    if(!r.ok) throw new Error('Could not list contents');
    let items = await r.json();
    if(!Array.isArray(items)) items = [items];

    // Folders first, then files
    items.sort((a, b) => {
      if(a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    list.innerHTML = items.map(it => `
      <button class="gh-file-row" data-gh-file="${esc(it.path)}" data-gh-type="${it.type}">
        <i class="bi bi-${it.type === 'dir' ? 'folder-fill' : fileIcon(it.name)}"></i>
        <span class="gh-file-name">${esc(it.name)}</span>
        ${it.type === 'file' ? `<span class="gh-file-size">${humanSize(it.size)}</span>` : ''}
        ${it.type === 'file' ? `<span class="gh-file-import">Import</span>` : `<i class="bi bi-chevron-right gh-file-chevron"></i>`}
      </button>
    `).join('') || '<div class="gh-empty">Folder is empty.</div>';
  }catch(e){
    list.innerHTML = `<div class="gh-error"><i class="bi bi-exclamation-triangle-fill"></i> ${esc(e.message)}</div>`;
  }
}

function fileIcon(name){
  const ext = (name.split('.').pop() || '').toLowerCase();
  if(['md','markdown'].includes(ext))       return 'markdown';
  if(['txt'].includes(ext))                 return 'file-text';
  if(['json'].includes(ext))                return 'filetype-json';
  if(['html','htm'].includes(ext))          return 'filetype-html';
  if(['js','mjs','cjs'].includes(ext))      return 'filetype-js';
  if(['ts'].includes(ext))                  return 'filetype-tsx';
  if(['css'].includes(ext))                 return 'filetype-css';
  if(['fountain','spmd'].includes(ext))     return 'film';
  if(['doc','docx'].includes(ext))          return 'file-word';
  if(['rtf'].includes(ext))                 return 'file-richtext';
  if(['pdf'].includes(ext))                 return 'file-pdf';
  return 'file-earmark-text';
}

function humanSize(bytes){
  if(bytes === undefined || bytes === null) return '';
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function importRepoFile(path){
  // Importing a single file: route by that FILE's name
  // (filename on GitHub — same idea as the JSON filename rule)
  const fileName = path.split('/').pop().replace(/\.[^.]+$/, '');

  const cls = classifyProjectName(fileName);
  if(!cls.mode || !cls.category){
    const missing = [];
    if(!cls.mode)     missing.push('"novel" or "screenplay"');
    if(!cls.category) missing.push('"fiction"');
    toast('File name must contain ' + missing.join(' and '), 'err');
    return;
  }

  const full = GitHub.currentRepo.full_name;
  const branch = GitHub.currentBranch || GitHub.currentRepo.default_branch || 'main';
  const url = 'https://api.github.com/repos/' + full + '/contents/' +
              encodeURIComponent(path) + '?ref=' + encodeURIComponent(branch);

  toast('Fetching file...');
  try {
    const r = await fetch(url, { headers: ghHeaders() });
    if(!r.ok) throw new Error('Could not fetch file');
    const d = await r.json();

    const bin = atob(d.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(bin.length);
    for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const decoded = new TextDecoder('utf-8').decode(bytes);

    // Build a single-chapter project
    const html = decoded.split(/\n{2,}/).map(function(block){
      return '<p>' + esc(block).replace(/\n/g, '<br>') + '</p>';
    }).join('');

    const modeDef = MODES.find(m => m.id === cls.mode);

    if(!S.modes[cls.mode]) S.modes[cls.mode] = freshModeData();
    const targetData = S.modes[cls.mode];

    const newProject = {
  id: newId,
  name: fileName,
  category: cls.category,
  mode: cls.mode,
  created: Date.now(),
  chapters: [{ id: uid(), title: fileName, content: html, children: [], collapsed: false }],
  notes: [], beats: [], cast: [],
  bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
  references: [], timeline: [], kanban: null, drafts: [], versions: [],
  _importedFrom: full + '/' + path,
  _importSource: 'external'
};

    if(!Array.isArray(targetData.projects)) targetData.projects = [];

    const dupe = targetData.projects.find(p =>
      p.category === cls.category &&
      p.name.toLowerCase() === newProject.name.toLowerCase()
    );
    if(dupe){
      toast('A project named "' + newProject.name + '" already exists in this category', 'warn');
      return;
    }

    // Cap each category at 5 recent projects
    const catCount = targetData.projects.filter(p => p.category === cls.category).length;
    if(catCount >= 5){
      toast('Category is full — 5 recent projects max', 'warn');
      return;
    }

    targetData.projects.unshift(newProject);
    targetData.currentCategory = cls.category;
    targetData.currentProject = newId;
    targetData.currentChapter = newProject.chapters[0].id;

    save();

    closeGitHubPanel();
    if(typeof hideInfoPanel === 'function') hideInfoPanel();

    if(S.mode !== cls.mode && typeof switchMode === 'function') switchMode(cls.mode);

    setTimeout(function(){
      if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);
    }, 60);

    toast('Imported "' + fileName + '" → ' + modeDef.name + ' · ' + cls.category);
  } catch(e){
    toast(e.message, 'err');
  }
}

async function importWholeRepo(){
  const repo = GitHub.currentRepo;
  if(!repo) return;

  // ─── Route by the REPO name ───
  const repoKey = repo.name;   // e.g. "novel fiction" or "screenplay-nonfiction"
  const cls = classifyProjectName(repoKey);

  if(!cls.mode || !cls.category){
    const missing = [];
    if(!cls.mode)     missing.push('"novel" or "screenplay"');
    if(!cls.category) missing.push('"fiction"');
    toast('Repo name must contain ' + missing.join(' and '), 'err');
    return;
  }

  if(!confirm('Import "' + repo.name + '" as one project in ' +
              (cls.mode === 'novel' ? 'Novel' : 'Screenplay') + ' · ' +
              cls.category + '?')) return;

  toast('Importing repo...');

  const full = repo.full_name;
  const branch = GitHub.currentBranch || repo.default_branch || 'main';

  try {
    const tr = await fetch('https://api.github.com/repos/' + full + '/git/trees/' +
                           encodeURIComponent(branch) + '?recursive=1',
                           { headers: ghHeaders() });
    if(!tr.ok) throw new Error('Could not read repo tree');
    const tree = await tr.json();

    const allowed = ['.md', '.markdown', '.txt', '.fountain', '.spmd', '.html', '.htm'];
    const files = (tree.tree || []).filter(function(item){
      if(item.type !== 'blob') return false;
      var lower = item.path.toLowerCase();
      if(item.path.indexOf('/node_modules/') >= 0) return false;
      if(item.path.indexOf('/.git/') >= 0) return false;
      for(var i = 0; i < allowed.length; i++){
        if(lower.indexOf(allowed[i], lower.length - allowed[i].length) !== -1) return true;
      }
      return false;
    });

    if(!files.length){
      toast('No importable text files found', 'warn');
      return;
    }

    const modeDef = MODES.find(m => m.id === cls.mode);
    if(!S.modes[cls.mode]) S.modes[cls.mode] = freshModeData();
    const targetData = S.modes[cls.mode];

    const newId = uid();
    const chapters = [];

    for(var k = 0; k < files.length; k++){
      var f = files[k];
      try {
        var r = await fetch('https://api.github.com/repos/' + full + '/contents/' +
                            encodeURIComponent(f.path) + '?ref=' + encodeURIComponent(branch),
                            { headers: ghHeaders() });
        if(!r.ok) continue;
        var payload = await r.json();
        var bin2 = atob(payload.content.replace(/\n/g, ''));
        var bytes2 = new Uint8Array(bin2.length);
        for(var j = 0; j < bin2.length; j++) bytes2[j] = bin2.charCodeAt(j);
        var decoded2 = new TextDecoder('utf-8').decode(bytes2);

        var title = f.path.split('/').pop().replace(/\.[^.]+$/, '');
        var html = decoded2.split(/\n{2,}/).map(function(block){
          return '<p>' + esc(block).replace(/\n/g, '<br>') + '</p>';
        }).join('');

        chapters.push({
          id: uid(),
          title: title,
          content: html,
          children: [],
          collapsed: false
        });
      } catch(e){}
    }

    if(!chapters.length){
      toast('No files could be downloaded', 'err');
      return;
    }

    const newProject = {
  id: newId,
  name: repo.name,
  category: cls.category,
  mode: cls.mode,
  created: Date.now(),
  chapters: chapters,
  notes: [], beats: [], cast: [],
  bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
  references: [], timeline: [], kanban: null, drafts: [], versions: [],
  _importedFrom: 'github:' + full,
  _importSource: 'external'
};

    if(!Array.isArray(targetData.projects)) targetData.projects = [];
    targetData.projects.unshift(newProject);
    targetData.currentCategory = cls.category;
    targetData.currentProject = newId;
    targetData.currentChapter = chapters[0].id;

    save();

    closeGitHubPanel();
    if(typeof hideInfoPanel === 'function') hideInfoPanel();

    if(S.mode !== cls.mode && typeof switchMode === 'function') switchMode(cls.mode);

    setTimeout(function(){
      if(typeof renderPagesOverlay === 'function') renderPagesOverlay();
      if(typeof togglePagesOverlay === 'function') togglePagesOverlay(true);

      const row = document.querySelector('[data-proj-toggle="' + newId + '"]');
      if(row){
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 60);

    toast('Imported "' + repo.name + '" → ' + modeDef.name + ' · ' + cls.category + ' (' + chapters.length + ' chapters)');
  } catch(e){
    toast(e.message, 'err');
  }
}
// ═══════════════════════════════════════════════════════════
//   EVENT WIRING
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;

  if(t.closest('[data-gh-close]')){ closeGitHubPanel(); return; }
  if(t.closest('[data-gh-signin]')){ e.preventDefault(); startGitHubSignIn(); return; }
  if(t.closest('[data-gh-signout]')){ clearGitHubSession(); renderGitHubBody(); return; }

  const repoRow = t.closest('[data-gh-repo]');
  if(repoRow){ openRepo(repoRow.dataset.ghRepo); return; }

  if(t.closest('[data-gh-back-to-repos]')){
    GitHub.currentRepo = null;
    GitHub.currentPath = '';
    renderGitHubBody();
    return;
  }

  if(t.closest('[data-gh-path-up]')){
    const parts = GitHub.currentPath.split('/').filter(Boolean);
    parts.pop();
    GitHub.currentPath = parts.join('/');
    renderGitHubBody();
    loadRepoContents();
    return;
  }

  if(t.closest('[data-gh-import-whole]')){
    importWholeRepo();
    return;
  }

  const fileRow = t.closest('[data-gh-file]');
  if(fileRow){
    const path = fileRow.dataset.ghFile;
    const type = fileRow.dataset.ghType;
    if(type === 'dir'){
      GitHub.currentPath = path;
      renderGitHubBody();
      loadRepoContents();
    } else {
      importRepoFile(path);
    }
    return;
  }
}, true);

// Live filter for repo list
document.addEventListener('input', e => {
  if(e.target.id !== 'ghRepoSearch') return;
  const q = e.target.value.trim().toLowerCase();
  const list = document.getElementById('ghRepoList');
  if(!list) return;
  list.querySelectorAll('.gh-repo-row').forEach(row => {
    const name = row.querySelector('.gh-repo-name')?.textContent.toLowerCase() || '';
    const desc = row.querySelector('.gh-repo-desc')?.textContent.toLowerCase() || '';
    row.style.display = (!q || name.includes(q) || desc.includes(q)) ? '' : 'none';
  });
});

// ═══════════════════════════════════════════════════════════
//   EXPORTS
// ═══════════════════════════════════════════════════════════

window.GitHub = GitHub;
window.openGitHubPanel = openGitHubPanel;
window.closeGitHubPanel = closeGitHubPanel;

console.log('%c ✓ github.js loaded', 'color:#10b981;font-weight:600;');
