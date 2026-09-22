/* ═══════════════════════════════════════════════════════════
   ScriptForge — Tools
   Voice · Dictionary · Web · Canvas · Projects · Snapshots
   ═══════════════════════════════════════════════════════════ */

const TOOLS = {};

// ═══════════════════════════════════════════════════════════
//   VOICE DICTATION (fixed)
// ═══════════════════════════════════════════════════════════

TOOLS.initVoice = function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    S.voiceSupported = false;
    return;
  }
  S.voiceSupported = true;
  S.voiceRecog = new SR();
  S.voiceRecog.continuous = true;
  S.voiceRecog.interimResults = true;
  S.voiceRecog.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
  S.voiceRecog.onresult = e => {
    let transcript = '';
    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal) transcript += e.results[i][0].transcript;
    }
    if(transcript){
      const ed = $('editor');
      if(ed){
        ed.focus();
        document.execCommand('insertText', false, transcript + ' ');
        onEditorInput();
      }
    }
  };
  S.voiceRecog.onerror = e => {
    S.voiceListening = false;
    if(e.error === 'not-allowed') toast('Microphone access denied', 'err');
    else if(e.error === 'no-speech') toast('No speech detected', 'warn');
    else toast('Voice error: ' + e.error, 'err');
  };
  S.voiceRecog.onend = () => {
    S.voiceListening = false;
  };
};

TOOLS.toggleVoice = function(){
  if(!S.voiceSupported){
    toast('Voice not supported. Try Chrome or Edge.', 'err');
    return;
  }
  if(!S.voiceRecog) TOOLS.initVoice();
  try{
    if(S.voiceListening){
      S.voiceRecog.stop();
      S.voiceListening = false;
      toast('Voice stopped');
    } else {
      S.voiceRecog.start();
      S.voiceListening = true;
      toast('Listening… speak now');
    }
  }catch(e){ toast('Already listening', 'warn'); }
};

// ═══════════════════════════════════════════════════════════
//   WEB SEARCH — INLINE (not in browser)
// ═══════════════════════════════════════════════════════════

TOOLS.openWebSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:800px;">
      <div class="modal-head">
        <h2><i class="bi bi-globe2" style="color:var(--accent-2);"></i> Web research</h2>
        <button class="icon-btn" data-act="ws-close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="wsQuery" placeholder="Search…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-primary" data-act="ws-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
          <button class="chip" data-ws-src="duckduckgo"><i class="bi bi-search"></i> DuckDuckGo</button>
          <button class="chip" data-ws-src="wikipedia"><i class="bi bi-book"></i> Wikipedia</button>
          <button class="chip" data-ws-src="dictionary"><i class="bi bi-file-text"></i> Dictionary</button>
          <button class="chip" data-ws-src="thesaurus"><i class="bi bi-shuffle"></i> Thesaurus</button>
          <button class="chip" data-ws-src="wolfram"><i class="bi bi-calculator"></i> Wolfram</button>
        </div>
        <div id="wsResults" style="min-height:200px;background:var(--surface-2);border-radius:10px;padding:16px;font-size:13px;color:var(--ink-2);">
          Type a query, then click a source — or the search button.
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  $('wsQuery')?.focus();
  $('wsQuery')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); runSearch('duckduckgo'); }
  });
  document.querySelectorAll('[data-ws-src]').forEach(b => {
    b.addEventListener('click', () => runSearch(b.dataset.wsSrc));
  });
};

async function runSearch(source){
  const q = $('wsQuery')?.value.trim();
  if(!q){ toast('Enter a query', 'warn'); return; }
  const box = $('wsResults');
  if(!box) return;
  box.innerHTML = '<div class="spin" style="display:inline-block;width:20px;height:20px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;"></div> Loading…';

  try{
    if(source === 'wikipedia'){
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if(!r.ok) throw new Error('Not found');
      const d = await r.json();
      box.innerHTML = `
        <div style="font-weight:700;font-size:15px;color:var(--ink);margin-bottom:8px;">${esc(d.title)}</div>
        ${d.thumbnail ? `<img src="${esc(d.thumbnail.source)}" style="max-width:100%;border-radius:8px;margin-bottom:12px;">` : ''}
        <div style="line-height:1.7;">${esc(d.extract)}</div>
        <div style="margin-top:14px;font-size:11.5px;">
          <a href="${esc(d.content_urls?.desktop?.page || '')}" target="_blank" rel="noopener">Open full article on Wikipedia →</a>
        </div>
      `;
    } else if(source === 'dictionary'){
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
      if(!r.ok) throw new Error('Not found');
      const d = await r.json();
      const w = d[0];
      let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);margin-bottom:4px;">${esc(w.word)}</div>`;
      if(w.phonetic) html += `<div style="color:var(--ink-3);margin-bottom:12px;">${esc(w.phonetic)}</div>`;
      w.meanings.slice(0, 3).forEach(m => {
        html += `<div style="margin-top:10px;font-weight:600;color:var(--ink);">${esc(m.partOfSpeech)}</div>`;
        m.definitions.slice(0, 3).forEach(d => {
          html += `<div style="margin-top:4px;line-height:1.6;">• ${esc(d.definition)}</div>`;
        });
      });
      box.innerHTML = html;
    } else if(source === 'thesaurus'){
      const r = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=25`);
      const d = await r.json();
      const r2 = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=20`);
      const d2 = await r2.json();
      let html = `<div style="font-size:18px;font-weight:700;color:var(--accent-2);margin-bottom:14px;">${esc(q)}</div>`;
      if(d.length){
        html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">Synonyms</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">`;
        d.slice(0, 20).forEach(s => html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`);
        html += `</div>`;
      }
      if(d2.length){
        html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">Rhymes</div><div style="display:flex;gap:6px;flex-wrap:wrap;">`;
        d2.slice(0, 15).forEach(s => html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`);
        html += `</div>`;
      }
      box.innerHTML = html;
    } else if(source === 'wolfram'){
      box.innerHTML = `<div style="line-height:1.7;">Wolfram Alpha needs a free AppID. <a href="https://developer.wolframalpha.com/" target="_blank">Get one here</a>, then paste it in Settings → AI.</div>`;
    } else {
      // DuckDuckGo Instant Answer API (JSON, no key required)
      const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
      const d = await r.json();
      let html = '';
      if(d.AbstractText){
        html += `<div style="font-weight:700;color:var(--ink);margin-bottom:6px;">${esc(d.Heading || q)}</div>`;
        html += `<div style="line-height:1.7;margin-bottom:14px;">${esc(d.AbstractText)}</div>`;
        if(d.AbstractURL) html += `<a href="${esc(d.AbstractURL)}" target="_blank" rel="noopener">Read full page →</a>`;
      }
      if(d.RelatedTopics?.length){
        html += `<div style="font-weight:600;color:var(--ink);margin:16px 0 8px;">Related</div>`;
        d.RelatedTopics.slice(0, 6).forEach(rt => {
          if(rt.Text){
            html += `<div style="padding:8px 0;border-bottom:1px solid var(--line);">
              <a href="${esc(rt.FirstURL || '#')}" target="_blank" rel="noopener" style="font-weight:600;">${esc(rt.Text.split(' - ')[0])}</a>
              <div style="font-size:11.5px;color:var(--ink-3);margin-top:2px;">${esc((rt.Text.split(' - ')[1] || '').slice(0, 160))}</div>
            </div>`;
          }
        });
      }
      if(!html){
        html = `<div class="muted">No instant answer for "<strong>${esc(q)}</strong>".</div>
                <div style="margin-top:12px;"><a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Open in DuckDuckGo →</a></div>`;
      }
      box.innerHTML = html;
    }
  }catch(e){
    box.innerHTML = `<div style="color:var(--err);">${esc(e.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════
//   IMAGE SEARCH — INLINE gallery
// ═══════════════════════════════════════════════════════════

TOOLS.openImageSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:840px;">
      <div class="modal-head">
        <h2><i class="bi bi-image" style="color:var(--accent-2);"></i> Insert image</h2>
        <button class="icon-btn" data-act="img-close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="imgQuery" placeholder="Search Unsplash…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-primary" data-act="img-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="imgUrl" placeholder="Or paste image URL…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-ghost" data-act="img-url"><i class="bi bi-check-lg"></i> Insert URL</button>
        </div>
        <div id="imgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;max-height:400px;overflow-y:auto;">
          <div class="muted" style="grid-column:1/-1;text-align:center;padding:40px;">Search for images above, or paste a URL.</div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  $('imgQuery')?.focus();
  $('imgQuery')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); runImageSearch(); }
  });
};

async function runImageSearch(){
  const q = $('imgQuery')?.value.trim();
  if(!q) return toast('Enter a search term', 'warn');
  const g = $('imgGrid');
  if(!g) return;
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:24px;height:24px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';

  // Use Wikimedia Commons search — free, CORS-friendly
  try{
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=18&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query?.pages ? Object.values(d.query.pages) : [];
    if(!pages.length) throw new Error('No results');
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo?.[0];
      if(!info) return;
      const img = document.createElement('img');
      img.src = info.thumburl;
      img.style.cssText = 'width:100%;height:140px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 140ms;border:2px solid transparent;';
      img.onmouseenter = () => img.style.transform = 'scale(1.04)';
      img.onmouseleave = () => img.style.transform = '';
      img.onclick = () => {
        insertHTML(`<img src="${info.url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
        closeModal();
        toast('Image inserted');
      };
      g.appendChild(img);
    });
  }catch(e){
    g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--err);">${esc(e.message)}</div>
      <div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;">
        <a href="https://unsplash.com/s/photos/${encodeURIComponent(q)}" target="_blank">Open Unsplash →</a>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════════════
//   CANVAS — freehand drawing
// ═══════════════════════════════════════════════════════════

let cx = {
  tool:'pen',
  color:'#7c5cff',
  drawing:false,
  curStroke:null,
  canvas:null,
  ctx:null,
  dpr:1
};

TOOLS.initCanvas = function(){
  const stage = $('cxStage');
  const canvas = $('cxCanvas');
  if(!stage || !canvas) return;

  cx.canvas = canvas;
  cx.ctx = canvas.getContext('2d');
  cx.dpr = window.devicePixelRatio || 1;

  const resize = () => {
    const r = stage.getBoundingClientRect();
    canvas.width = r.width * cx.dpr;
    canvas.height = r.height * cx.dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    cx.ctx.setTransform(cx.dpr, 0, 0, cx.dpr, 0, 0);
    redrawCanvas();
  };
  resize();
  window.addEventListener('resize', resize);

  const colorInput = $('cxColor');
  if(colorInput){
    cx.color = colorInput.value;
    colorInput.addEventListener('input', e => { cx.color = e.target.value; });
  }

  document.querySelectorAll('[data-cx-tool]').forEach(b => {
    b.addEventListener('click', () => {
      cx.tool = b.dataset.cxTool;
      document.querySelectorAll('[data-cx-tool]').forEach(x => x.classList.remove('btn-primary'));
      if(cx.tool !== 'text') b.classList.add('btn-primary');
      canvas.style.cursor = cx.tool === 'text' ? 'text' : 'crosshair';
    });
  });

  document.querySelector('[data-cx-clear]')?.addEventListener('click', () => {
    if(!confirm('Clear the canvas?')) return;
    S.canvasElements = [];
    redrawCanvas();
    save();
  });

  document.querySelector('[data-cx-export]')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'canvas-' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  const getPos = e => {
    const r = canvas.getBoundingClientRect();
    return {x: (e.clientX - r.left), y: (e.clientY - r.top)};
  };

  canvas.addEventListener('mousedown', e => {
    if(cx.tool === 'select') return;
    if(cx.tool === 'text'){
      const txt = prompt('Text:');
      if(txt){
        const p = getPos(e);
        S.canvasElements.push({type:'text', x:p.x, y:p.y, text:txt, color:cx.color, size:16});
        redrawCanvas();
        save();
      }
      return;
    }
    if(cx.tool === 'pen' || cx.tool === 'arrow'){
      cx.drawing = true;
      cx.curStroke = {
        type: cx.tool === 'pen' ? 'line' : 'arrow',
        points:[getPos(e)],
        color: cx.color,
        width: 2
      };
      S.canvasElements.push(cx.curStroke);
    }
  });

  canvas.addEventListener('mousemove', e => {
    if(!cx.drawing || !cx.curStroke) return;
    cx.curStroke.points.push(getPos(e));
    redrawCanvas();
  });

  canvas.addEventListener('mouseup', () => {
    if(cx.drawing){
      cx.drawing = false;
      cx.curStroke = null;
      save();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if(cx.drawing){
      cx.drawing = false;
      cx.curStroke = null;
      save();
    }
  });

  redrawCanvas();
};

function redrawCanvas(){
  if(!cx.ctx || !cx.canvas) return;
  const ctx = cx.ctx;
  const w = cx.canvas.width / cx.dpr;
  const h = cx.canvas.height / cx.dpr;
  ctx.clearRect(0, 0, w, h);

  (S.canvasElements || []).forEach(el => {
    ctx.strokeStyle = el.color || '#7c5cff';
    ctx.fillStyle = el.color || '#7c5cff';
    ctx.lineWidth = el.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if(el.type === 'line'){
      ctx.beginPath();
      el.points.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } else if(el.type === 'arrow' && el.points.length >= 2){
      ctx.beginPath();
      el.points.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      const p1 = el.points[el.points.length - 2];
      const p2 = el.points[el.points.length - 1];
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const len = 12;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - len * Math.cos(ang - Math.PI/6), p2.y - len * Math.sin(ang - Math.PI/6));
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - len * Math.cos(ang + Math.PI/6), p2.y - len * Math.sin(ang + Math.PI/6));
      ctx.stroke();
    } else if(el.type === 'text'){
      ctx.font = `${el.size || 16}px Inter, sans-serif`;
      ctx.textBaseline = 'top';
      el.text.split('\n').forEach((line, i) => {
        ctx.fillText(line, el.x, el.y + i * (el.size || 16) * 1.3);
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════
//   PROJECTS & SNAPSHOTS
// ═══════════════════════════════════════════════════════════

TOOLS.newProject = async function(){
  const name = await askPrompt('Project name:', 'Untitled');
  if(!name) return;

  const d  = D();
  const id = uid();
  const chapterId = uid();
  const category = d.currentCategory || currentMode()?.categories?.[0]?.id || 'fiction';

  // Duplicate names within a category are not allowed
  if((d.projects || []).some(p => p.category === category && p.name.toLowerCase() === name.trim().toLowerCase())){
    toast('A project named "' + name.trim() + '" already exists in this category', 'warn');
    return;
  }
  // Cap each category at 5 recent projects
  const catProjects = (d.projects || []).filter(p => p.category === category);
  if(catProjects.length >= 5){
    toast('Category is full — 5 recent projects max', 'warn');
    return;
  }

  const project = {
    id, name, category, mode: S.mode, created: Date.now(),
    chapters: [{ id: chapterId, title: 'Chapter 1', content: '', children: [], collapsed: false }],
    notes: [], beats: [], cast: [], references: [], timeline: [],
    bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
    kanban: { columns: [
      {id:'k1', title:'Ideas', cards:[]}, {id:'k2', title:'Drafting', cards:[]},
      {id:'k3', title:'Editing', cards:[]}, {id:'k4', title:'Done', cards:[]}
    ]}
  };

  if(!Array.isArray(d.projects)) d.projects = [];
  d.projects.unshift(project);
  d.currentProject  = id;
  d.currentCategory = category;
  d.chapters        = project.chapters;
  d.currentChapter  = chapterId;

  save();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof hideInfoPanel === 'function') hideInfoPanel();
  goPage('manuscript');
  toast('Project created');
};


function askPrompt(msg, def = ''){
  return new Promise(resolve => {
    const root = $('modalRoot');
    root.innerHTML = '';
    root.classList.add('open');
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-head"><h2>${esc(msg)}</h2></div>
        <div class="modal-body">
          <input class="tb-input" id="askInput" style="width:100%;padding:10px 12px;font-size:13.5px;">
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" id="askCancel">Cancel</button>
          <button class="btn btn-primary" id="askOk">OK</button>
        </div>
      </div>`;
    root.appendChild(scrim);
    const inp = $('askInput');
    inp.value = def; inp.focus(); inp.select();
    const done = v => { root.innerHTML = ''; root.classList.remove('open'); resolve(v); };
    $('askOk').onclick     = () => done(inp.value.trim() || null);
    $('askCancel').onclick = () => done(null);
    inp.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); done(inp.value.trim() || null); }
      if(e.key === 'Escape'){ e.preventDefault(); done(null); }
    });
  });
}
window.askPrompt = askPrompt;


// ═══════════════════════════════════════════════════════════
//   REFERENCES
// ═══════════════════════════════════════════════════════════

TOOLS.addUrl = async function(){
  const url = prompt('URL to reference:');
  if(!url) return;
  toast('Fetching…');
  let title = url, content = '';
  try{
    const r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url));
    const d = await r.json();
    const tmp = document.createElement('div');
    tmp.innerHTML = d.contents || '';
    tmp.querySelectorAll('script,style,nav,footer,header').forEach(n => n.remove());
    title = (tmp.querySelector('title')?.textContent || url).trim();
    content = (tmp.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 20000);
  }catch(e){
    content = '[Could not fetch content]';
  }
  S.references.push({id: uid(), type:'url', title, url, content, created: Date.now()});
  save();
  renderReferences();
  toast('Reference added');
};

TOOLS.addRefFromNote = function(){
  if(!S.notes.length) return toast('No notes available', 'warn');
  const list = S.notes.map((n, i) => `${i+1}. ${n.title || 'Untitled'}`).join('\n');
  const pick = parseInt(prompt('Link a note:\n' + list + '\n\nEnter number:'));
  if(!pick || pick < 1 || pick > S.notes.length) return;
  const n = S.notes[pick - 1];
  S.references.push({
    id: uid(), type:'note', title: n.title || 'Note',
    content: n.content || '', created: Date.now()
  });
  save();
  renderReferences();
  toast('Note linked');
};

TOOLS.viewReference = function(i){
  const r = S.references[i];
  if(!r) return;
  showResult(r.title, r.url || 'Reference', r.content || '(empty)');
};

TOOLS.deleteReference = function(i){
  if(!confirm('Delete this reference?')) return;
  S.references.splice(i, 1);
  save();
  renderReferences();
};

// ═══════════════════════════════════════════════════════════
//   DRAFT / NOTE / IDEA HELPERS
// ═══════════════════════════════════════════════════════════

TOOLS.addDraft = function(){
  S.drafts.unshift({
    id: uid(), title:'', body:'',
    created: Date.now()
  });
  save();
  renderDrafts();
};

TOOLS.draftToChapter = function(i){
  const d = S.drafts[i];
  if(!d) return;
  const title = d.title || 'From draft';
  S.chapters.push({
    id: uid(),
    title,
    content: d.body.split('\n\n').map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join(''),
    children:[], collapsed:false
  });
  save();
  toast('Draft moved to chapter');
};

// ═══════════════════════════════════════════════════════════
//   EVENT WIRING (all tool-related clicks)
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;

  // Voice
  if(t.closest('[data-act="toggle-voice"]')){ e.preventDefault(); TOOLS.toggleVoice(); return; }

  // Web search / images
  if(t.closest('[data-act="search-web"]')){ e.preventDefault(); TOOLS.openWebSearch(); return; }
  if(t.closest('[data-act="search-images"]')){ e.preventDefault(); TOOLS.openImageSearch(); return; }
  if(t.closest('[data-act="ws-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="ws-run"]')){ e.preventDefault(); runSearch('duckduckgo'); return; }
  if(t.closest('[data-act="img-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="img-run"]')){ e.preventDefault(); runImageSearch(); return; }
  if(t.closest('[data-act="img-url"]')){
    const u = $('imgUrl')?.value.trim();
    if(u){ insertHTML(`<img src="${esc(u)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); closeModal(); toast('Image inserted'); }
    return;
  }

  // Projects & snapshots
  if(t.closest('[data-act="new-project"]')){ e.preventDefault(); TOOLS.newProject(); return; }
  if(t.closest('[data-act="snapshot"]')){ e.preventDefault(); TOOLS.snapshot(); return; }

  const projEl = t.closest('[data-open-project]');
  if(projEl){ e.preventDefault(); TOOLS.openProject(projEl.dataset.openProject); return; }

  const rsEl = t.closest('[data-snap-restore]');
  if(rsEl){ e.preventDefault(); TOOLS.restoreSnapshot(parseInt(rsEl.dataset.snapRestore)); return; }
  const rdEl = t.closest('[data-snap-del]');
  if(rdEl){
    const i = parseInt(rdEl.dataset.snapDel);
    if(confirm('Delete this snapshot?')){
      S.versions.splice(i, 1);
      save();
      renderSnapshots();
    }
    return;
  }

  // Drafts
  if(t.closest('[data-act="add-draft"]')){ e.preventDefault(); TOOLS.addDraft(); return; }
  const ddEl = t.closest('[data-draft-del]');
  if(ddEl){
    S.drafts.splice(parseInt(ddEl.dataset.draftDel), 1);
    save();
    renderDrafts();
    return;
  }
  const dchEl = t.closest('[data-draft-to-ch]');
  if(dchEl){ e.preventDefault(); TOOLS.draftToChapter(parseInt(dchEl.dataset.draftToCh)); return; }

  // References
  if(t.closest('[data-act="add-url"]')){ e.preventDefault(); TOOLS.addUrl(); return; }
  if(t.closest('[data-act="add-ref-note"]')){ e.preventDefault(); TOOLS.addRefFromNote(); return; }
  const rvEl = t.closest('[data-ref-view]');
  if(rvEl){ e.preventDefault(); TOOLS.viewReference(parseInt(rvEl.dataset.refView)); return; }
  const rdEl2 = t.closest('[data-ref-del]');
  if(rdEl2){ e.preventDefault(); TOOLS.deleteReference(parseInt(rdEl2.dataset.refDel)); return; }

  // Beats
  if(t.closest('[data-act="add-beat"]')){
    S.beats.push({id:uid(), text:'', level:0, type:'beat'});
    save(); renderBeats(); return;
  }
  const biEl = t.closest('[data-beat-indent]');
  if(biEl){ S.beats[parseInt(biEl.dataset.beatIndent)].level = Math.min(5, (S.beats[parseInt(biEl.dataset.beatIndent)].level || 0) + 1); save(); renderBeats(); return; }
  const boEl = t.closest('[data-beat-outdent]');
  if(boEl){ S.beats[parseInt(boEl.dataset.beatOutdent)].level = Math.max(0, (S.beats[parseInt(boEl.dataset.beatOutdent)].level || 0) - 1); save(); renderBeats(); return; }
  const bdEl = t.closest('[data-beat-del]');
  if(bdEl){ S.beats.splice(parseInt(bdEl.dataset.beatDel), 1); save(); renderBeats(); return; }

  // Timeline
  if(t.closest('[data-act="add-event"]')){
    const title = prompt('Event title:'); if(!title) return;
    const date = prompt('Date marker (optional):') || '';
    const desc = prompt('Description (optional):') || '';
    S.timeline.push({id:uid(), title, date, desc});
    save(); renderTimeline(); return;
  }
  const teEl = t.closest('[data-event-edit]');
  if(teEl){
    const i = parseInt(teEl.dataset.eventEdit);
    const ev = S.timeline[i];
    const title = prompt('Title:', ev.title); if(title === null) return;
    ev.title = title;
    const date = prompt('Date:', ev.date || ''); if(date !== null) ev.date = date;
    const desc = prompt('Description:', ev.desc || ''); if(desc !== null) ev.desc = desc;
    save(); renderTimeline(); return;
  }
  const tdEl = t.closest('[data-event-del]');
  if(tdEl){
    const i = parseInt(tdEl.dataset.eventDel);
    if(confirm('Delete event?')){ S.timeline.splice(i, 1); save(); renderTimeline(); }
    return;
  }

  // Cast
  if(t.closest('[data-act="add-cast"]')){
    S.bible.push({id:uid(), name:'', type:'character', details:''});
    save(); renderCast(); return;
  }
  const cdEl = t.closest('[data-cast-del]');
  if(cdEl){ S.bible.splice(parseInt(cdEl.dataset.castDel), 1); save(); renderCast(); return; }

  // Kanban
  if(t.closest('[data-act="add-column"]')){
    const title = prompt('Column name:', 'New Column'); if(!title) return;
    S.kanban.columns.push({id:uid(), title, cards:[]});
    save(); renderKanban(); return;
  }
  const ccEl = t.closest('[data-col-del]');
  if(ccEl){
    const i = S.kanban.columns.findIndex(c => c.id === ccEl.dataset.colDel);
    if(i >= 0 && confirm('Delete column and its cards?')){ S.kanban.columns.splice(i, 1); save(); renderKanban(); }
    return;
  }
  const caEl = t.closest('[data-card-add]');
  if(caEl){
    const col = S.kanban.columns.find(c => c.id === caEl.dataset.cardAdd);
    if(!col) return;
    const title = prompt('Card title:'); if(!title) return;
    col.cards.push({id:uid(), title, desc:''});
    save(); renderKanban(); return;
  }
  const ceEl = t.closest('[data-card-edit]');
  if(ceEl){
    const cardId = ceEl.dataset.cardEdit;
    let found = null;
    S.kanban.columns.forEach(c => { const k = c.cards.find(x => x.id === cardId); if(k) found = k; });
    if(!found) return;
    const title = prompt('Title:', found.title); if(title === null) return;
    found.title = title;
    const desc = prompt('Description:', found.desc || ''); if(desc !== null) found.desc = desc;
    save(); renderKanban(); return;
  }
  const cddEl = t.closest('[data-card-del]');
  if(cddEl){
    const cardId = cddEl.dataset.cardDel;
    S.kanban.columns.forEach(c => { c.cards = c.cards.filter(x => x.id !== cardId); });
    save(); renderKanban(); return;
  }
}, true);

// ═══ Drag drop for kanban ═══
function moveCard(cardId, fromCol, toCol){
  if(fromCol === toCol) return;
  const f = S.kanban.columns.find(c => c.id === fromCol);
  const t = S.kanban.columns.find(c => c.id === toCol);
  if(!f || !t) return;
  const i = f.cards.findIndex(c => c.id === cardId);
  if(i < 0) return;
  const [card] = f.cards.splice(i, 1);
  t.cards.push(card);
  save();
  renderKanban();
}

// ═══ Input delegation for editable fields ═══
document.addEventListener('input', e => {
  const t = e.target;

  const dt = t.closest('[data-draft-title]');
  if(dt){ S.drafts[parseInt(dt.dataset.draftTitle)].title = t.value; debouncedSave(); return; }
  const db = t.closest('[data-draft-body]');
  if(db){ S.drafts[parseInt(db.dataset.draftBody)].body = t.value; debouncedSave(); return; }

  const cn = t.closest('[data-cast-name]');
  if(cn){ S.bible[parseInt(cn.dataset.castName)].name = t.value; debouncedSave(); return; }
  const cd = t.closest('[data-cast-details]');
  if(cd){ S.bible[parseInt(cd.dataset.castDetails)].details = t.value; debouncedSave(); return; }

  const bt = t.closest('[data-beat-text]');
  if(bt){ S.beats[parseInt(bt.dataset.beatText)].text = t.value; debouncedSave(); return; }

  const ct = t.closest('[data-col-title]');
  if(ct){
    const c = S.kanban.columns.find(x => x.id === ct.dataset.colTitle);
    if(c){ c.title = t.value; debouncedSave(); }
    return;
  }
});

const debouncedSave = debounce(() => save(), 800);

// ═══ Selects ═══
document.addEventListener('change', e => {
  const t = e.target;
  const ct = t.closest('[data-cast-type]');
  if(ct){ S.bible[parseInt(ct.dataset.castType)].type = t.value; save(); return; }
  const bt = t.closest('[data-beat-type]');
  if(bt){ S.beats[parseInt(bt.dataset.beatType)].type = t.value; save(); return; }
});

// ═══ Close modal helper ═══
function closeModal(){
  const root = $('modalRoot');
  root.classList.remove('open');
  root.innerHTML = '';
}

// ═══ Expose ═══
window.TOOLS = TOOLS;
window.runSearch = runSearch;
window.runImageSearch = runImageSearch;
window.redrawCanvas = redrawCanvas;
window.moveCard = moveCard;
window.closeModal = closeModal;

console.log('%c ✓ tools.js loaded', 'color:#10b981;font-weight:600;');
