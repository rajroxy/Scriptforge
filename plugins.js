/* ═══════════════════════════════════════════════════════════
   ScriptForge — Plugins
   Wolfram · Dictionary · Image · Web · More
   Everything renders inline (no browser tabs)
   ═══════════════════════════════════════════════════════════ */

const PLUGINS = {};

// ═══════════════════════════════════════════════════════════
//   WEB SEARCH — inline results
// ═══════════════════════════════════════════════════════════

PLUGINS.openWebSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-head modal-head-bare">
        <h2 class="sr-only">Text search</h2>
        <button class="icon-btn v-close" data-act="ws-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input class="tb-input" id="wsQuery" placeholder="Search the web…" style="flex:1;">
          <button class="btn btn-primary" data-act="ws-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div class="chips" style="margin-bottom:16px;">
          <button class="chip on" data-ws-src="ddg"><i class="bi bi-search"></i> DuckDuckGo</button>
          <button class="chip" data-ws-src="wiki"><i class="bi bi-book"></i> Wikipedia</button>
          <button class="chip" data-ws-src="dict"><i class="bi bi-file-text"></i> Dictionary</button>
          <button class="chip" data-ws-src="thes"><i class="bi bi-shuffle"></i> Thesaurus</button>
          <button class="chip" data-ws-src="wolf"><i class="bi bi-calculator"></i> Wolfram</button>
          <button class="chip" data-ws-src="idiom"><i class="bi bi-chat-quote"></i> Idioms</button>
          <button class="chip" data-ws-src="quote"><i class="bi bi-quote"></i> Quotes</button>
          <button class="chip" data-ws-src="images"><i class="bi bi-image"></i> Images</button>
        </div>
        <div id="wsResults">
          Type a query and click a source. Results appear here — never leaves the app.
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  const srcBtns = scrim.querySelectorAll('[data-ws-src]');
  srcBtns.forEach(b => {
    b.addEventListener('click', () => {
      srcBtns.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      PLUGINS._wsSrc = b.dataset.wsSrc;
      if($('wsQuery')?.value.trim()) PLUGINS.runSearch(b.dataset.wsSrc);
    });
  });
  PLUGINS._wsSrc = 'ddg';
  $('wsQuery').focus();
  $('wsQuery').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); PLUGINS.runSearch(PLUGINS._wsSrc); }
  });
};

PLUGINS.runSearch = async function(src){
  const q = $('wsQuery')?.value.trim();
  if(!q){ toast('Enter a query', 'warn'); return; }
  const box = $('wsResults');
  if(!box) return;
  if(src === 'images'){ return PLUGINS.renderImagesInline(q, box); }
  box.innerHTML = '<div class="spin" style="display:inline-block;width:22px;height:22px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;"></div> Searching…';

  try{
    if(src === 'wiki') return PLUGINS.renderWiki(q, box);
    if(src === 'dict') return PLUGINS.renderDict(q, box);
    if(src === 'thes') return PLUGINS.renderThes(q, box);
    if(src === 'wolf') return PLUGINS.renderWolfram(q, box);
    if(src === 'idiom') return PLUGINS.renderIdioms(q, box);
    if(src === 'quote') return PLUGINS.renderQuotes(q, box);
    return PLUGINS.renderDDG(q, box);
  }catch(e){
    box.innerHTML = `<div style="color:var(--err);">${esc(e.message)}</div>`;
  }
};

PLUGINS.renderWiki = async function(q, box){
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
  if(!r.ok) throw new Error('Not found');
  const d = await r.json();
  box.innerHTML = `
    <div style="font-size:18px;font-weight:700;color:var(--ink);margin-bottom:8px;">${esc(d.title)}</div>
    ${d.thumbnail ? `<img src="${esc(d.thumbnail.source)}" style="max-width:200px;border-radius:8px;margin-bottom:12px;">` : ''}
    <div style="line-height:1.75;">${esc(d.extract)}</div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;gap:10px;font-size:11.5px;">
      <button class="btn btn-ghost" data-ref-from-wiki="${esc(d.title)}"><i class="bi bi-bookmark-plus"></i> Save as reference</button>
      <a href="${esc(d.content_urls?.desktop?.page || '#')}" target="_blank" rel="noopener" style="color:var(--info);display:flex;align-items:center;gap:4px;">
        <i class="bi bi-box-arrow-up-right"></i> Open full article
      </a>
    </div>
  `;
  const saveBtn = box.querySelector('[data-ref-from-wiki]');
  if(saveBtn){
    saveBtn.addEventListener('click', () => {
      D().references.push({
        id: uid(), type: 'url', title: d.title,
        url: d.content_urls?.desktop?.page || '',
        content: d.extract, created: Date.now()
      });
      save();
      toast('Reference saved');
      closeModal();
    });
  }
};

PLUGINS.renderDict = async function(q, box){
  // Try dictionaryapi.dev first
  try{
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
    if(r.ok){
      const d = await r.json();
      const w = d[0];
      let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);">${esc(w.word)}</div>`;
      if(w.phonetic) html += `<div class="muted" style="margin-bottom:10px;">${esc(w.phonetic)}</div>`;
      w.meanings.slice(0, 4).forEach(m => {
        html += `<div style="margin-top:12px;font-weight:600;color:var(--ink);">${esc(m.partOfSpeech)}</div>`;
        m.definitions.slice(0, 3).forEach(def => {
          html += `<div style="margin-top:5px;line-height:1.6;">• ${esc(def.definition)}</div>`;
          if(def.example) html += `<div style="margin-left:14px;font-style:italic;color:var(--ink-3);font-size:12px;">"${esc(def.example)}"</div>`;
        });
      });
      box.innerHTML = html;
      return;
    }
  }catch(e){}
  // Fallback: Wiktionary
  const r2 = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(q)}`);
  if(!r2.ok) throw new Error('Word not found');
  const d2 = await r2.json();
  const en = d2.en?.[0];
  if(!en) throw new Error('Not in Wiktionary');
  let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);margin-bottom:10px;">${esc(q)}</div>`;
  html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">${esc(en.partOfSpeech)}</div>`;
  (en.definitions || []).slice(0, 5).forEach(def => {
    html += `<div style="margin-top:5px;line-height:1.6;">• ${esc(def.definition.replace(/<[^>]+>/g, ''))}</div>`;
  });
  box.innerHTML = html;
};

PLUGINS.renderThes = async function(q, box){
  const [syn, rhy, ant] = await Promise.all([
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=30`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=25`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(q)}&max=15`).then(r => r.json())
  ]);
  let html = `<div style="font-size:18px;font-weight:700;color:var(--accent-2);margin-bottom:16px;">${esc(q)}</div>`;
  if(syn.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Synonyms</div>
      <div class="chips" style="margin-bottom:18px;">
        ${syn.slice(0, 24).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(ant.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Antonyms</div>
      <div class="chips" style="margin-bottom:18px;">
        ${ant.slice(0, 12).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(rhy.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Rhymes</div>
      <div class="chips">
        ${rhy.slice(0, 20).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(!syn.length && !rhy.length && !ant.length) html += `<div class="muted">No results.</div>`;
  box.innerHTML = html;
};

PLUGINS.renderWolfram = async function(q, box){
  const appId = S.config.wolframAppId;
  if(!appId){
    box.innerHTML = `
      <div style="padding:12px;background:var(--surface-3);border-radius:10px;border-left:3px solid var(--warn);">
        <div style="font-weight:700;color:var(--warn);margin-bottom:6px;"><i class="bi bi-exclamation-triangle"></i> Wolfram AppID required</div>
        <div style="line-height:1.6;margin-bottom:12px;">Wolfram Alpha is free but needs an AppID. Get yours at <a href="https://developer.wolframalpha.com/" target="_blank" rel="noopener">developer.wolframalpha.com</a> → sign up → get AppID.</div>
        <div style="display:flex;gap:8px;">
          <input class="tb-input" id="wolfIdInput" placeholder="Paste your AppID..." style="flex:1;padding:8px 12px;font-size:12px;">
          <button class="btn btn-primary" id="wolfSave">Save</button>
        </div>
      </div>`;
    $('wolfSave')?.addEventListener('click', () => {
      const v = $('wolfIdInput')?.value.trim();
      if(!v) return;
      S.config.wolframAppId = v;
      save();
      toast('AppID saved');
      PLUGINS.renderWolfram(q, box);
    });
    return;
  }
  const url = `https://api.wolframalpha.com/v1/result?i=${encodeURIComponent(q)}&appid=${appId}`;
  const r = await fetch(url);
  if(r.status === 501){ box.innerHTML = `<div class="muted">Wolfram couldn't interpret that. Try a different query.</div>`; return; }
  if(r.status === 403){ box.innerHTML = `<div style="color:var(--err);">Invalid AppID. Check your Wolfram AppID in Settings → AI.</div>`; return; }
  if(!r.ok) throw new Error(`Wolfram error ${r.status}`);
  const txt = await r.text();
  box.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--ink-3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Wolfram result</div>
    <div style="font-size:17px;line-height:1.6;color:var(--ink);">${esc(txt)}</div>
  `;
};

PLUGINS.renderIdioms = async function(q, box){
  // Use Datamuse to find similar words, then show idiomatic
  const [syn, tags] = await Promise.all([
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=20`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q + ' idiom')}&max=10`).then(r => r.json())
  ]);
  let html = `<div style="font-size:16px;font-weight:700;color:var(--accent-2);margin-bottom:14px;">Related to "${esc(q)}"</div>`;
  html += `<div class="chips">`;
  [...syn.slice(0, 15), ...tags.slice(0, 8)].forEach(s => {
    html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`;
  });
  html += `</div>`;
  box.innerHTML = html;
};

PLUGINS.renderQuotes = async function(q, box){
  // Quotes: use ZenQuotes API (free, CORS-friendly)
  try{
    const r = await fetch('https://zenquotes.io/api/random');
    const d = await r.json();
    if(Array.isArray(d) && d[0]){
      box.innerHTML = `
        <div style="font-size:16px;line-height:1.7;font-style:italic;color:var(--ink);margin-bottom:14px;">"${esc(d[0].q)}"</div>
        <div style="font-size:13px;color:var(--ink-3);">— ${esc(d[0].a)}</div>
        <div style="margin-top:16px;">
          <button class="btn btn-ghost" id="qNew"><i class="bi bi-shuffle"></i> Another quote</button>
        </div>`;
      $('qNew')?.addEventListener('click', () => PLUGINS.renderQuotes(q, box));
      return;
    }
  }catch(e){}
  // Fallback: static set
  const fallback = [
    {q:'The scariest moment is always just before you start.', a:'Stephen King'},
    {q:'There is nothing to writing. All you do is sit down at a typewriter and bleed.', a:'Ernest Hemingway'},
    {q:'You can always edit a bad page. You can\'t edit a blank page.', a:'Jodi Picoult'},
    {q:'If there\'s a book that you want to read, but it hasn\'t been written yet, then you must write it.', a:'Toni Morrison'},
    {q:'Start writing, no matter what. The water does not flow until the faucet is turned on.', a:'Louis L\'Amour'}
  ];
  const pick = fallback[Math.floor(Math.random() * fallback.length)];
  box.innerHTML = `
    <div style="font-size:16px;line-height:1.7;font-style:italic;color:var(--ink);margin-bottom:14px;">"${esc(pick.q)}"</div>
    <div style="font-size:13px;color:var(--ink-3);">— ${esc(pick.a)}</div>
    <div style="margin-top:16px;">
      <button class="btn btn-ghost" id="qNew"><i class="bi bi-shuffle"></i> Another quote</button>
    </div>`;
  $('qNew')?.addEventListener('click', () => PLUGINS.renderQuotes(q, box));
};

/* Images tab — the image-search gallery, inline in the web search panel */
PLUGINS.renderImagesInline = async function(q, box){
  box.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';
  const oldImg = PLUGINS._imgGridSave;
  try{
    // reuse the existing image-search pipeline against a temp grid
    const tmp = document.createElement('div');
    tmp.id = 'imgGrid';
    tmp.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;';
    box.innerHTML = '';
    box.appendChild(tmp);
    // runImageSearch reads #imgQuery and #imgGrid — provide them
    let qi = $('imgQuery');
    const created = !qi;
    if(created){
      qi = document.createElement('input');
      qi.id = 'imgQuery';
      qi.style.display = 'none';
      document.body.appendChild(qi);
    }
    qi.value = q;
    const realGrid = $('imgGrid');
    await PLUGINS.runImageSearchInto(tmp, q);
    if(created) qi.remove();
  }catch(e){
    box.innerHTML = '<div class="muted" style="padding:20px;">Image search failed: ' + esc(e.message) + '</div>';
  }
};

/* Core of runImageSearch that writes into any given grid element */
PLUGINS.runImageSearchInto = async function(g, q){
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';
  try{
    // Wikimedia commons search
    const src = PLUGINS._imgSrc || 'commons';
    if(src === 'unsplash'){
      g.innerHTML = '';
      for(let i = 0; i < 12; i++){
        const url = `https://source.unsplash.com/400x300/?${encodeURIComponent(q)}&sig=${Date.now() + i}`;
        const card = document.createElement('div');
        card.style.cssText = 'border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;';
        card.innerHTML = `<img src="${url}" loading="lazy" style="width:100%;height:110px;object-fit:cover;display:block;">`;
        card.onclick = () => { insertHTML(`<img src="${url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); toast('Inserted'); };
        g.appendChild(card);
      }
      return;
    }
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap%20${encodeURIComponent(q)}&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query && d.query.pages ? Object.values(d.query.pages) : [];
    if(!pages.length){ g.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px;">No images found.</div>'; return; }
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo && p.imageinfo[0];
      if(!info) return;
      const url = info.thumburl || info.url;
      const card = document.createElement('div');
      card.style.cssText = 'border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;';
      card.innerHTML = `<img src="${esc(url)}" loading="lazy" style="width:100%;height:110px;object-fit:cover;display:block;">`;
      card.onclick = () => { insertHTML(`<img src="${esc(url)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); toast('Inserted'); };
      g.appendChild(card);
    });
  }catch(e){
    g.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px;">Image search failed: ' + esc(e.message) + '</div>';
  }
};

PLUGINS.renderDDG = async function(q, box){
  const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
  const d = await r.json();
  let html = '';
  if(d.AbstractText){
    html += `<div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:8px;">${esc(d.Heading || q)}</div>`;
    html += `<div style="line-height:1.75;margin-bottom:14px;">${esc(d.AbstractText)}</div>`;
    if(d.AbstractSource) html += `<div class="tiny muted" style="margin-bottom:12px;">Source: ${esc(d.AbstractSource)}</div>`;
    if(d.AbstractURL) html += `<a href="${esc(d.AbstractURL)}" target="_blank" rel="noopener" style="color:var(--info);font-size:12px;display:inline-flex;align-items:center;gap:4px;margin-bottom:14px;"><i class="bi bi-box-arrow-up-right"></i> Read full</a>`;
  }
  if(d.RelatedTopics?.length){
    html += `<div style="font-weight:600;color:var(--ink);margin:16px 0 10px;">Related</div>`;
    d.RelatedTopics.slice(0, 8).forEach(rt => {
      if(rt.Text){
        const title = rt.Text.split(' - ')[0];
        const snippet = rt.Text.split(' - ')[1] || '';
        html += `<div style="padding:10px 0;border-bottom:1px solid var(--line);">
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">${esc(title)}</div>
          ${snippet ? `<div style="font-size:12px;color:var(--ink-3);">${esc(snippet.slice(0, 160))}</div>` : ''}
          ${rt.FirstURL ? `<a href="${esc(rt.FirstURL)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--info);margin-top:4px;display:inline-block;">${esc(rt.FirstURL.slice(0, 50))}…</a>` : ''}
        </div>`;
      }
    });
  }
  if(!html){
    html = '<div class="muted" style="padding:20px;text-align:center;">No instant answer for "' + esc(q) + '". Try Wikipedia or another source above.</div>';
  }
  box.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════
//   IMAGE SEARCH — inline gallery, insert directly
// ═══════════════════════════════════════════════════════════

PLUGINS.openImageSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-head modal-head-bare">
        <h2 class="sr-only">Image search</h2>
        <button class="icon-btn v-close" data-act="img-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input class="tb-input" id="imgQuery" placeholder="Search images…" style="flex:1;">
          <button class="btn btn-primary" data-act="img-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div class="chips" style="margin-bottom:14px;">
          <button class="chip on" data-img-src="commons"><i class="bi bi-globe"></i> Wikimedia</button>
          <button class="chip" data-img-src="unsplash"><i class="bi bi-image"></i> Unsplash</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input class="tb-input" id="imgUrl" placeholder="Or paste an image URL…" style="flex:1;">
          <button class="btn btn-ghost" data-act="img-url"><i class="bi bi-check-lg"></i> Insert URL</button>
        </div>
        <div id="imgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
          <div class="muted" style="grid-column:1/-1;text-align:center;padding:32px 12px;font-size:12.5px;color:var(--ink-4);">Search or paste a URL above.</div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  PLUGINS._imgSrc = 'commons';
  scrim.querySelectorAll('[data-img-src]').forEach(b => {
    b.addEventListener('click', () => {
      scrim.querySelectorAll('[data-img-src]').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      PLUGINS._imgSrc = b.dataset.imgSrc;
    });
  });
  $('imgQuery').focus();
  $('imgQuery').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); PLUGINS.runImageSearch(); }
  });
};

PLUGINS.runImageSearch = async function(){
  const q = $('imgQuery')?.value.trim();
  if(!q) return toast('Enter search term', 'warn');
  const g = $('imgGrid');
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';

  try{
    if(PLUGINS._imgSrc === 'unsplash'){
      // Unsplash source (no key) — direct URLs
      g.innerHTML = '';
      for(let i = 0; i < 12; i++){
        const url = `https://source.unsplash.com/400x300/?${encodeURIComponent(q)}&sig=${Math.random()}`;
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:100%;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 160ms;';
        img.onmouseenter = () => img.style.transform = 'scale(1.04)';
        img.onmouseleave = () => img.style.transform = '';
        img.onclick = () => {
          insertHTML(`<img src="${url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
          closeModal();
          toast('Image inserted');
        };
        g.appendChild(img);
      }
      return;
    }
    // Wikimedia Commons (reliable)
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query?.pages ? Object.values(d.query.pages) : [];
    if(!pages.length) throw new Error('No results');
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo?.[0];
      if(!info) return;
      const img = document.createElement('img');
      img.src = info.thumburl;
      img.style.cssText = 'width:100%;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 160ms;border:2px solid transparent;';
      img.onmouseenter = () => { img.style.transform = 'scale(1.04)'; img.style.borderColor = 'var(--accent)'; };
      img.onmouseleave = () => { img.style.transform = ''; img.style.borderColor = 'transparent'; };
      img.onclick = () => {
        insertHTML(`<img src="${info.url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
        closeModal();
        toast('Image inserted');
      };
      g.appendChild(img);
    });
  }catch(e){
    g.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--err);">
        ${esc(e.message)}
      </div>
      <div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;">
        <a href="https://unsplash.com/s/photos/${encodeURIComponent(q)}" target="_blank" rel="noopener">Open Unsplash →</a>
      </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
//   HINGLISH TRANSLITERATION (rules-based, offline)
// ═══════════════════════════════════════════════════════════

const HING_MAP = {
  'namaste':'नमस्ते','kaise':'कैसे','kya':'क्या','kyun':'क्यों','hai':'है','hain':'हैं',
  'tha':'था','thi':'थी','the':'थे','main':'मैं','hum':'हम','tum':'तुम','aap':'आप',
  'woh':'वह','yeh':'यह','mera':'मेरा','meri':'मेरी','aur':'और','lekin':'लेकिन',
  'bhi':'भी','bahut':'बहुत','thoda':'थोड़ा','achha':'अच्छा','khana':'खाना','pani':'पानी',
  'dost':'दोस्त','pyaar':'प्यार','dil':'दिल','zindagi':'ज़िंदगी','khushi':'खुशी',
  'aaj':'आज','kal':'कल','abhi':'अभी','phir':'फिर','baad':'बाद','pehle':'पहले',
  'ek':'एक','do':'दो','teen':'तीन','char':'चार','paanch':'पाँच','das':'दस',
  'sab':'सब','kuch':'कुछ','koi':'कोई','har':'हर','naam':'नाम','baat':'बात',
  'ghar':'घर','shahar':'शहर','kitab':'किताब','kalam':'कलम','paisa':'पैसा'
};

const DEV_MATRA = {'aa':'ा','ee':'ी','ii':'ी','oo':'ू','uu':'ू','ai':'ै','au':'ौ','a':'','i':'ि','u':'ु','e':'े','o':'ो'};
const DEV_CONS = {'kh':'ख','gh':'घ','chh':'छ','ch':'च','jh':'झ','th':'थ','dh':'ध','ph':'फ','bh':'भ','sh':'श','ksh':'क्ष','tr':'त्र','gy':'ज्ञ','k':'क','g':'ग','c':'च','j':'ज','t':'त','d':'द','n':'न','p':'प','f':'फ़','b':'ब','m':'म','y':'य','r':'र','l':'ल','v':'व','w':'व','s':'स','h':'ह','z':'ज़','q':'क़','x':'क्स'};
const DEV_VOW = {'aa':'आ','ai':'ऐ','au':'औ','ee':'ई','ii':'ई','oo':'ऊ','uu':'ऊ','a':'अ','i':'इ','u':'उ','e':'ए','o':'ओ'};

function hinglishToDev(text){
  if(!text) return '';
  return text.split(/(\s+)/).map(tok => {
    if(/^\s+$/.test(tok)) return tok;
    const m = tok.match(/^([^\w]*)(.*?)([^\w]*)$/);
    if(!m) return tok;
    const [, pre, core, suf] = m;
    if(!core) return tok;
    const lower = core.toLowerCase();
    if(HING_MAP[lower]) return pre + HING_MAP[lower] + suf;
    return pre + transWord(lower) + suf;
  }).join('');
}

function transWord(word){
  let r = '', i = 0;
  while(i < word.length){
    let ok = false;
    for(const len of [3, 2, 1]){
      const c = word.substr(i, len);
      if(DEV_CONS[c]){
        r += DEV_CONS[c]; i += len;
        let hasV = false;
        for(const vl of [3, 2, 1]){
          const v = word.substr(i, vl);
          if(DEV_MATRA[v] !== undefined){ r += DEV_MATRA[v]; i += vl; hasV = true; break; }
        }
        if(!hasV && i < word.length && !/\s/.test(word[i])){
          const nc = word.substr(i, 2);
          if(DEV_CONS[nc] || DEV_CONS[word[i]]) r += '्';
        }
        ok = true; break;
      }
      if(DEV_VOW[c] && i === 0){ r += DEV_VOW[c]; i += len; ok = true; break; }
    }
    if(!ok){ r += word[i]; i++; }
  }
  return r;
}

function updateLivePreview(text){
  const p = $('livePreview');
  if(!p) return;
  if(!text.trim()){ p.textContent = 'Waiting for input...'; p.classList.add('empty'); return; }
  const target = S.config.liveBarTarget;
  p.textContent = target === 'devanagari' ? hinglishToDev(text) : text;
  p.classList.remove('empty');
}

PLUGINS.openLiveBar = function(){
  if(!S.config.plugins.hinglish) return toast('Hinglish plugin is off', 'warn');
  S.config.liveBarActive = true;
  $('liveBar')?.classList.add('visible');
};
PLUGINS.closeLiveBar = function(){
  S.config.liveBarActive = false;
  $('liveBar')?.classList.remove('visible');
  S.liveBuffer = '';
  updateLivePreview('');
};
PLUGINS.toggleLiveBar = function(){
  S.config.liveBarActive ? PLUGINS.closeLiveBar() : PLUGINS.openLiveBar();
};
PLUGINS.cycleLiveTarget = function(){
  S.config.liveBarTarget = S.config.liveBarTarget === 'devanagari' ? 'english' : 'devanagari';
  const el = $('liveTarget');
  if(el) el.textContent = S.config.liveBarTarget === 'devanagari' ? 'देवनागरी' : 'English';
  updateLivePreview(S.liveBuffer || '');
};
PLUGINS.acceptLive = function(){
  if(!S.liveBuffer?.trim()) return toast('Nothing to insert', 'warn');
  const out = S.config.liveBarTarget === 'devanagari' ? hinglishToDev(S.liveBuffer) : S.liveBuffer;
  insertHTML(out);
  S.liveBuffer = '';
  updateLivePreview('');
  toast('Inserted');
};

// ═══════════════════════════════════════════════════════════
//   VOICE
// ═══════════════════════════════════════════════════════════

PLUGINS.initVoice = function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ S.voiceSupported = false; return; }
  S.voiceSupported = true;
  S.voiceRecog = new SR();
  S.voiceRecog.continuous = true;
  S.voiceRecog.interimResults = true;
  S.voiceRecog.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
  S.voiceRecog.onresult = e => {
    let txt = '';
    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal) txt += e.results[i][0].transcript;
    }
    if(txt) insertHTML(txt + ' ');
  };
  S.voiceRecog.onerror = e => {
    S.voiceListening = false;
    if(e.error === 'not-allowed') toast('Microphone denied', 'err');
    else if(e.error !== 'no-speech') toast('Voice error: ' + e.error, 'err');
  };
  S.voiceRecog.onend = () => { S.voiceListening = false; };
};

PLUGINS.toggleVoice = function(){
  if(S.config.plugins && S.config.plugins.voice === false){ toast('Voice dictation is off', 'warn'); return; }
  if(!S.voiceSupported){ toast('Voice not supported. Try Chrome.', 'err'); return; }
  if(!S.voiceRecog) PLUGINS.initVoice();
  try{
    if(S.voiceListening){ S.voiceRecog.stop(); S.voiceListening = false; toast('Voice stopped'); }
    else { S.voiceRecog.start(); S.voiceListening = true; toast('Listening…'); }
  }catch(e){ toast('Already listening', 'warn'); }
};

// ═══════════════════════════════════════════════════════════
//   TEXT-TO-SPEECH — read a passage, the selection, or the editor
// ═══════════════════════════════════════════════════════════

PLUGINS.speak = function(text){
  if(!('speechSynthesis' in window)){ toast('Speech not supported in this build', 'err'); return false; }
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if(!t){ toast('Nothing to read', 'warn'); return false; }
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t.slice(0, 8000));
    u.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
    u.rate = 1; u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ toast('Could not read aloud', 'err'); return false; }
};

PLUGINS.stopSpeaking = function(){
  try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
};

PLUGINS.speakEditor = function(){
  if(S.config.plugins && S.config.plugins.tts === false){ toast('Text-to-speech is off', 'warn'); return; }
  if(window.speechSynthesis && window.speechSynthesis.speaking){ PLUGINS.stopSpeaking(); toast('Stopped'); return; }
  const ed = $('editor');
  const sel = window.getSelection();
  let text = '';
  if(sel && !sel.isCollapsed && ed && ed.contains(sel.anchorNode)) text = sel.toString();
  if(!text && ed) text = (ed.innerText || ed.textContent || '');
  if(PLUGINS.speak(text)) toast('Reading aloud');
};

// ═══════════════════════════════════════════════════════════
//   EVENT WIRING
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;
  if(t.closest('[data-act="web-search"]')){ e.preventDefault(); PLUGINS.openWebSearch(); return; }
  if(t.closest('[data-act="image-search"]')){ e.preventDefault(); PLUGINS.openImageSearch(); return; }
  if(t.closest('[data-act="ws-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="ws-run"]')){ e.preventDefault(); PLUGINS.runSearch(PLUGINS._wsSrc || 'ddg'); return; }
  if(t.closest('[data-act="img-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="img-run"]')){ e.preventDefault(); PLUGINS.runImageSearch(); return; }
  if(t.closest('[data-act="img-url"]')){
    const u = $('imgUrl')?.value.trim();
    if(u){ insertHTML(`<img src="${esc(u)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); closeModal(); toast('Inserted'); }
    return;
  }
  if(t.closest('[data-act="dict-go"]')){ e.preventDefault(); runDictLookup(); return; }
  if(t.closest('[data-act="rhyme-go"]')){
    e.preventDefault();
    const q = $('rhymeQuery')?.value.trim();
    if(q){
      fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=25`)
        .then(r => r.json())
        .then(d => {
          $('rhymeResults').innerHTML = d.length
            ? `<div class="chips">${d.map(x => `<span class="chip" style="cursor:default;">${esc(x.word)}</span>`).join('')}</div>`
            : '<div class="muted">No rhymes found.</div>';
        });
    }
    return;
  }
  if(t.closest('[data-act="toggle-voice"]')){ e.preventDefault(); PLUGINS.toggleVoice(); return; }
  if(t.closest('[data-act="toggle-tts"]')){ e.preventDefault(); PLUGINS.speakEditor(); return; }
  if(t.closest('[data-act="toggle-live"]')){ e.preventDefault(); PLUGINS.toggleLiveBar(); return; }
  if(t.closest('[data-act="live-cycle"]')){ e.preventDefault(); PLUGINS.cycleLiveTarget(); return; }
  if(t.closest('[data-act="live-accept"]')){ e.preventDefault(); PLUGINS.acceptLive(); return; }
  if(t.closest('[data-act="live-close"]')){ e.preventDefault(); PLUGINS.closeLiveBar(); return; }
  if(t.closest('[data-act="new-prompt"]')){
    e.preventDefault();
    const prompts = [
      'Write a scene that takes place entirely in a single elevator ride.',
      'Describe a character only through what they carry in their pockets.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'Write a conversation where neither person says what they actually mean.',
      'A letter that was never meant to be sent.',
      'Describe a place you\'ve never been, but feel you remember.',
      'Write the same scene twice — once as comedy, once as tragedy.',
      'A character discovers they\'ve been misremembering a pivotal event.',
      'Write a scene where the weather is a character.',
      'Two rivals forced to cooperate. Neither will speak first.'
    ];
    $('inspireBox').innerHTML = `<div style="font-size:16px;line-height:1.75;color:var(--ink);">${prompts[Math.floor(Math.random() * prompts.length)]}</div>`;
    return;
  }
}, true);

// Voice preview during typing
document.addEventListener('input', e => {
  const ed = $('editor');
  if(e.target !== ed) return;
  if(!S.config.plugins.hinglish || !S.config.liveBarActive) return;
  const sel = window.getSelection();
  if(!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if(node.nodeType !== 3) return;
  const before = node.textContent.slice(0, range.startOffset);
  const lastLine = before.split(/\n/).pop() || '';
  const words = lastLine.split(/\s+/).slice(-8).join(' ');
  S.liveBuffer = words;
  updateLivePreview(words);
});

// ═══════════════════════════════════════════════════════════
//   EXPORT
// ═══════════════════════════════════════════════════════════

window.PLUGINS = PLUGINS;
window.hinglishToDev = hinglishToDev;
window.updateLivePreview = updateLivePreview;

console.log('%c ✓ plugins.js loaded', 'color:#10b981;font-weight:600;');
