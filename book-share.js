/* ═══════════════════════════════════════════════════════════
   ScriptForge — the Book panel does the publishing

   · the Import / Export page keeps ONE format: the JSON project file
   · the Book panel gains two buttons:
       EPUB        — a real .epub of the whole book, built here
       Share link  — the book as Markdown, published online, with a URL

   The EPUB is written by hand (a ZIP with stored entries), so no
   library and no network are needed — it works offline, which is the
   point of the app.

   The shareable link uses the GitHub account the app is already signed
   into: a public gist first (readable and rendered), and if that token
   has no gist scope, a Markdown file in the repo you have open.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  const esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  const say = function(msg, kind){
    if(typeof toast === 'function') toast(msg, kind || 'ok');
  };
  const plain = function(html){
    const d = document.createElement('div');
    d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, ' ');
    return String(d.textContent || '').replace(/\s+/g, ' ').trim();
  };

  const project = function(){
    try{
      if(typeof nbProj === 'function'){ const p = nbProj(); if(p) return p; }
    }catch(e){}
    const d = (typeof D === 'function') ? D() : null;
    if(!d) return null;
    return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
  };
  const bookName = function(){
    const p = project();
    const raw = String((p && p.name) || '').trim();
    return (!raw || /^untitled/i.test(raw)) ? 'Book' : raw;
  };

  /* ═══════════════════════════════════════════════════════════
     1 · EPUB — a ZIP written by hand, no library
     ═══════════════════════════════════════════════════════════ */
  const CRC = (function(){
    const t = new Uint32Array(256);
    for(let n = 0; n < 256; n++){
      let c = n;
      for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = function(bytes){
    let c = 0xFFFFFFFF;
    for(let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  const zip = function(entries){
    const enc = new TextEncoder();
    const parts = [];
    const dir = [];
    let offset = 0;

    const u16 = function(n){ return [n & 255, (n >>> 8) & 255]; };
    const u32 = function(n){ return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; };

    entries.forEach(function(e){
      const name = enc.encode(e.name);
      const data = (e.data instanceof Uint8Array) ? e.data : enc.encode(String(e.data));
      const crc = crc32(data);

      const head = []
        .concat([0x50, 0x4b, 0x03, 0x04])
        .concat(u16(20), u16(0), u16(0), u16(0), u16(0))
        .concat(u32(crc), u32(data.length), u32(data.length))
        .concat(u16(name.length), u16(0));

      parts.push(new Uint8Array(head), name, data);
      dir.push({ name: name, crc: crc, size: data.length, offset: offset });
      offset += head.length + name.length + data.length;
    });

    const dirStart = offset;
    dir.forEach(function(d){
      const head = []
        .concat([0x50, 0x4b, 0x01, 0x02])
        .concat(u16(20), u16(20), u16(0), u16(0), u16(0), u16(0))
        .concat(u32(d.crc), u32(d.size), u32(d.size))
        .concat(u16(d.name.length), u16(0), u16(0), u16(0), u16(0))
        .concat(u32(0))
        .concat(u32(d.offset));
      parts.push(new Uint8Array(head), d.name);
      offset += head.length + d.name.length;
    });

    const end = []
      .concat([0x50, 0x4b, 0x05, 0x06])
      .concat(u16(0), u16(0), u16(dir.length), u16(dir.length))
      .concat(u32(offset - dirStart), u32(dirStart), u16(0));
    parts.push(new Uint8Array(end));

    let total = 0;
    parts.forEach(function(p){ total += p.length; });
    const out = new Uint8Array(total);
    let at = 0;
    parts.forEach(function(p){ out.set(p, at); at += p.length; });
    return out;
  };

  /* keep only what an e-reader understands */
  const cleanHtml = function(html){
    const box = document.createElement('div');
    box.innerHTML = String(html || '');

    const walk = function(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 8){ n.remove(); return; }                       /* comments */
        if(n.nodeType !== 1){ return; }
        const tag = n.tagName.toLowerCase();
        if(/^(script|style|iframe|input|button|svg|audio|video)$/.test(tag)){ n.remove(); return; }
        walk(n);
        if(n.attributes){
          Array.prototype.slice.call(n.attributes).forEach(function(a){
            if(a.name !== 'href') n.removeAttribute(a.name);
          });
        }
        const keep = ['p','br','em','strong','i','b','u','h1','h2','h3','blockquote','ul','ol','li','hr'];
        if(keep.indexOf(tag) < 0){
          const span = document.createElement(tag === 'div' ? 'p' : 'span');
          while(n.firstChild) span.appendChild(n.firstChild);
          n.parentNode.replaceChild(span, n);
        }
      });
    };
    walk(box);
    return box.innerHTML || '<p></p>';
  };

  const xhtml = function(title, body){
    return '<?xml version="1.0" encoding="utf-8"?>\n'
      + '<!DOCTYPE html>\n'
      + '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">\n'
      + '<head><meta charset="utf-8"/><title>' + esc(title) + '</title>'
      + '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
      + '<body>\n' + body + '\n</body>\n</html>\n';
  };

  const buildEpub = function(){
    const p = project();
    if(!p){ say('Open a project first', 'warn'); return null; }

    const title = bookName();
    const author = ((typeof S !== 'undefined' && S.config && S.config.authorName) || '').trim() || 'Unknown';
    const id = 'urn:uuid:' + (p.id || Date.now()) + '-scriptforge';
    const chapters = (p.chapters || []);

    /* ── one XHTML file per chapter, subchapters inside it ── */
    const files = [];
    const nav = [];
    const spine = [];

    const addChapter = function(ch, n, depth){
      const name = 'chapter-' + n + '.xhtml';
      const body = '<h1>' + esc(ch.title || 'Untitled') + '</h1>\n' + cleanHtml(ch.content);
      files.push({ name: 'OEBPS/' + name, data: xhtml(ch.title || title, body) });
      nav.push({ title: ch.title || 'Untitled', href: name, depth: depth });
      spine.push(name);
      let i = 0;
      (ch.children || []).forEach(function(sub){
        i++;
        const sname = 'chapter-' + n + '-' + i + '.xhtml';
        const sbody = '<h2>' + esc(sub.title || 'Untitled') + '</h2>\n' + cleanHtml(sub.content);
        files.push({ name: 'OEBPS/' + sname, data: xhtml(sub.title || 'Untitled', sbody) });
        nav.push({ title: sub.title || 'Untitled', href: sname, depth: depth + 1 });
        spine.push(sname);
      });
    };
    chapters.forEach(function(ch, i){ addChapter(ch, i + 1, 0); });

    if(!files.length){
      files.push({ name: 'OEBPS/chapter-1.xhtml', data: xhtml(title, '<h1>' + esc(title) + '</h1><p>This book is still empty.</p>') });
      nav.push({ title: title, href: 'chapter-1.xhtml', depth: 0 });
      spine.push('chapter-1.xhtml');
    }

    /* ── the reading stylesheet ── */
    const css = [
      'body{font-family:Georgia,serif;line-height:1.6;margin:1em 1.2em;color:#111;}',
      'h1{font-size:1.5em;margin:1.2em 0 .6em;}',
      'h2{font-size:1.15em;margin:1.1em 0 .5em;font-weight:600;}',
      'h3{font-size:1em;margin:1em 0 .5em;}',
      'p{margin:0 0 .85em;text-indent:1.2em;}',
      'h1+p,h2+p,h3+p{text-indent:0;}',
      'blockquote{margin:1em 1.6em;font-style:italic;}',
      '.scene-heading{text-transform:uppercase;font-weight:700;text-indent:0;margin-top:1.4em;}',
      '.character-name{text-align:center;text-indent:0;margin:1em 0 0;font-weight:700;text-transform:uppercase;}',
      '.dialogue{margin:0 2.2em .7em;text-indent:0;}',
      '.parenthetical{margin:0 2.8em .7em;font-style:italic;text-indent:0;}',
      '.transition{text-align:right;text-transform:uppercase;text-indent:0;margin:1.2em 0;}'
    ].join('\n');

    files.push({ name: 'OEBPS/style.css', data: css });

    const navList = nav.map(function(n){
      return '<li><a href="' + n.href + '">' + esc(n.title) + '</a></li>';
    }).join('');
    files.push({
      name: 'OEBPS/nav.xhtml',
      data: xhtml('Contents',
        '<nav xmlns:epub="http://www.idpf.org/2007/ops" epub:type="toc" id="toc">'
        + '<h1>Contents</h1><ol>' + navList + '</ol></nav>')
    });
    files.push({
      name: 'OEBPS/toc.ncx',
      data: '<?xml version="1.0" encoding="utf-8"?>\n'
        + '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
        + '<head><meta name="dtb:uid" content="' + esc(id) + '"/></head>'
        + '<docTitle><text>' + esc(title) + '</text></docTitle>'
        + '<navMap>' + nav.map(function(n, i){
            return '<navPoint id="n' + i + '" playOrder="' + (i + 1) + '">'
              + '<navLabel><text>' + esc(n.title) + '</text></navLabel>'
              + '<content src="' + n.href + '"/></navPoint>';
          }).join('') + '</navMap></ncx>'
    });
    files.push({
      name: 'OEBPS/content.opf',
      data: '<?xml version="1.0" encoding="utf-8"?>\n'
        + '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">\n'
        + '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
        + '<dc:identifier id="bookid">' + esc(id) + '</dc:identifier>\n'
        + '<dc:title>' + esc(title) + '</dc:title>\n'
        + '<dc:language>en</dc:language>\n'
        + '<dc:creator>' + esc(author) + '</dc:creator>\n'
        + '<meta property="dcterms:modified">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</meta>\n'
        + '</metadata>\n<manifest>\n'
        + '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n'
        + '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n'
        + '<item id="css" href="style.css" media-type="text/css"/>\n'
        + files.filter(function(f){ return /\.xhtml$/.test(f.name) && !/nav\.xhtml$/.test(f.name); })
            .map(function(f, i){
              return '<item id="c' + i + '" href="' + f.name.replace('OEBPS/', '') + '" media-type="application/xhtml+xml"/>';
            }).join('\n')
        + '\n</manifest>\n<spine toc="ncx">\n'
        + spine.map(function(h, i){ return '<itemref idref="c' + i + '"/>'; }).join('\n')
        + '\n</spine>\n</package>\n'
    });
    files.push({
      name: 'META-INF/container.xml',
      data: '<?xml version="1.0" encoding="utf-8"?>\n'
        + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        + '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>'
        + '</container>\n'
    });

    /* the mimetype entry must be first and stored, per the EPUB spec */
    const entries = [{ name: 'mimetype', data: 'application/epub+zip' }].concat(files);
    return { bytes: zip(entries), name: title.replace(/[^a-z0-9\-_ ]/gi, '_').replace(/\s+/g, ' ') + '.epub' };
  };

  const saveBlob = function(bytes, name, type){
    try{
      const blob = new Blob([bytes], { type: type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
      return true;
    }catch(e){ return false; }
  };

  const exportEpub = function(){
    const built = buildEpub();
    if(!built) return;
    if(saveBlob(built.bytes, built.name, 'application/epub+zip')) say('EPUB saved — ' + built.name);
    else say('Could not save the EPUB', 'err');
  };

  /* ═══════════════════════════════════════════════════════════
     2 · the shareable link — Markdown, published on GitHub
     ═══════════════════════════════════════════════════════════ */
  const md = function(html){
    const box = document.createElement('div');
    box.innerHTML = String(html || '');
    const out = [];
    Array.prototype.slice.call(box.children).forEach(function(el){
      const cls = (el.className || '');
      const tag = el.tagName.toLowerCase();
      let inner = el.innerHTML
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
        .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
        .replace(/<u>([\s\S]*?)<\/u>/gi, '_$1_')
        .replace(/<li[^>]*>/gi, '\n- ')
        .replace(/<\/?(ul|ol)[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ');
      inner = inner.replace(/\n{3,}/g, '\n\n').trim();
      if(!inner) return;
      if(tag === 'h1'){ out.push('# ' + plain(inner)); return; }
      if(tag === 'h2'){ out.push('## ' + plain(inner)); return; }
      if(tag === 'h3'){ out.push('### ' + plain(inner)); return; }
      if(/scene-heading/.test(cls)){ out.push('**' + plain(inner).toUpperCase() + '**'); return; }
      if(/character-name/.test(cls)){ out.push('**' + plain(inner).toUpperCase() + '**'); return; }
      if(/transition/.test(cls)){ out.push('_' + plain(inner).toUpperCase() + '_'); return; }
      if(/parenthetical/.test(cls)){ out.push('*' + plain(inner) + '*'); return; }
      if(/dialogue/.test(cls)){ out.push('> ' + inner.replace(/\n/g, '\n> ')); return; }
      out.push(inner);
    });
    return out.join('\n\n');
  };

  const markdown = function(){
    const p = project();
    if(!p){ say('Open a project first', 'warn'); return null; }
    const title = bookName();
    const author = ((typeof S !== 'undefined' && S.config && S.config.authorName) || '').trim();
    const lines = ['# ' + title];
    if(author) lines.push('*by ' + author + '*');
    lines.push('', '---', '');
    (p.chapters || []).forEach(function(ch){
      lines.push('## ' + (ch.title || 'Untitled'), '', md(ch.content), '');
      (ch.children || []).forEach(function(sub){
        lines.push('### ' + (sub.title || 'Untitled'), '', md(sub.content), '');
      });
    });
    return {
      text: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n',
      file: title.replace(/[^a-z0-9\-_ ]/gi, '_').replace(/\s+/g, ' ') + '.md',
      title: title
    };
  };

  const b64 = function(str){
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for(let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  const ghToken = function(){
    try{
      return (window.GitHub && GitHub.token && GitHub.token.access_token) || '';
    }catch(e){ return ''; }
  };

  const publish = async function(){
    const book = markdown();
    if(!book) return;

    const token = ghToken();
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if(!token){
      say('Connect GitHub in the GitHub panel to get a link — copying the book instead', 'warn');
      copy(book.text);
      return;
    }

    /* ── a public gist: the closest thing to a share page ── */
    try{
      const r = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({
          description: book.title + ' — shared from the app',
          public: true,
          files: (function(){ const o = {}; o[book.file] = { content: book.text }; return o; })()
        })
      });
      if(r.ok){
        const j = await r.json();
        const link = j.html_url;
        say('Shared — link copied');
        copy(link);
        try{ window.open(link, '_blank'); }catch(e){}
        return;
      }
    }catch(e){ /* fall through to the repo path */ }

    /* ── otherwise: a Markdown file in the repo the app already has open ── */
    let repo = null;
    try{ repo = window.GitHub && GitHub.currentRepo; }catch(e){ repo = null; }
    if(!repo || !repo.full_name){
      say('No gist scope and no repository open — the book is on the clipboard instead', 'warn');
      copy(book.text);
      return;
    }

    try{
      const branch = (function(){
        try{ return GitHub.currentBranch || repo.default_branch || 'main'; }catch(e){ return 'main'; }
      })();
      const path = 'share/' + book.file;
      const url = 'https://api.github.com/repos/' + repo.full_name + '/contents/' + encodeURIComponent(path);

      let sha = null;
      try{
        const g = await fetch(url + '?ref=' + encodeURIComponent(branch), { headers: headers });
        if(g.ok){ const j = await g.json(); sha = j.sha; }
      }catch(e){}

      const body = { message: 'Share ' + book.title, content: b64(book.text), branch: branch };
      if(sha) body.sha = sha;

      const r = await fetch(url, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(body)
      });
      if(!r.ok) throw new Error('GitHub said no (' + r.status + ')');

      const link = 'https://github.com/' + repo.full_name + '/blob/' + branch + '/' + path;
      copy(link);
      say('Shared — link copied');
      try{ window.open(link, '_blank'); }catch(e){}
    }catch(err){
      copy(book.text);
      say('Could not publish (' + ((err && err.message) || 'no access') + ') — the book is on the clipboard', 'err');
    }
  };

  const copy = function(text){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text); return true; }
    }catch(e){}
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    }catch(e){ return false; }
  };

  /* ═══════════════════════════════════════════════════════════
     3 · the Book panel's two buttons
     ═══════════════════════════════════════════════════════════ */
  const buttons = function(){
    const acts = document.querySelector('#page-notebook .draft-list-head .draft-list-acts');
    if(!acts || acts.querySelector('[data-sf-epub]')) return;
    const mk = function(attr, icon, title){
      const b = document.createElement('button');
      b.className = 'icon-btn-sm';
      b.setAttribute(attr, '1');
      b.title = title;
      b.innerHTML = '<i class="bi bi-' + icon + '"></i>';
      acts.appendChild(b);
    };
    mk('data-sf-epub', 'book', 'Export this book as EPUB');
    mk('data-sf-share', 'link-45deg', 'Publish online and copy the link');
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;
    if(t.closest('[data-sf-epub]')){ e.preventDefault(); e.stopPropagation(); exportEpub(); return; }
    if(t.closest('[data-sf-share]')){ e.preventDefault(); e.stopPropagation(); publish(); return; }
  }, true);

  /* ═══════════════════════════════════════════════════════════
     4 · Import / Export — the JSON file, and nothing else
     ═══════════════════════════════════════════════════════════ */
  PAGE_RENDERERS.import = function(root){
    root.innerHTML =
      '<div class="page-head"><div>'
      +   '<h1 class="page-title"><i class="bi bi-box-arrow-in-down"></i> Project file</h1>'
      +   '<div class="page-sub">One format: the JSON file this app writes</div>'
      + '</div></div>'
      + '<div class="set-card">'
      +   '<div class="set-card-title"><i class="bi bi-box-arrow-up"></i> Export</div>'
      +   '<div class="tiny muted" style="margin:-2px 0 8px">Everything the project holds — chapters, subchapters, notes, beats, cast, references, timeline, kanban and the canvas — in one file you can keep forever.</div>'
      +   '<div class="chips"><button class="chip" data-sf-json-out="1"><i class="bi bi-filetype-json"></i> Save the project as JSON</button></div>'
      + '</div>'
      + '<div class="set-card">'
      +   '<div class="set-card-title"><i class="bi bi-box-arrow-in-down"></i> Import</div>'
      +   '<div class="tiny muted" style="margin:-2px 0 8px">Open a JSON project file — it comes back as a project of its own, nothing already here is touched.</div>'
      +   '<div class="chips"><button class="chip" data-sf-json-in="1"><i class="bi bi-folder2-open"></i> Open a JSON project file</button></div>'
      + '</div>'
      + '<div class="set-card">'
      +   '<div class="set-card-title"><i class="bi bi-book"></i> A finished book</div>'
      +   '<div class="tiny muted" style="margin:-2px 0 8px">'
      +     'EPUB and the online share link live with the book itself: open the <b>Book</b> panel (the bookmark button in the chapter bar) and use the ' 
      +     '<b>book</b> and <b>link</b> buttons there.'
      +   '</div>'
      + '</div>';

    root.querySelector('[data-sf-json-out]').addEventListener('click', function(e){
      e.preventDefault();
      if(window.IO && typeof IO.exportProject === 'function') IO.exportProject();
      else say('The exporter is not available', 'err');
    });

    root.querySelector('[data-sf-json-in]').addEventListener('click', function(e){
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', function(){
        const file = input.files && input.files[0];
        if(!file){ input.remove(); return; }
        const fr = new FileReader();
        fr.onload = function(){
          input.remove();
          try{
            const parsed = JSON.parse(String(fr.result || ''));
            if(typeof window.importJSONProject === 'function') window.importJSONProject(parsed, file.name);
            else say('The importer is not available', 'err');
          }catch(err){ say('That file is not JSON this app can read', 'err'); }
        };
        fr.onerror = function(){ input.remove(); say('Could not read that file', 'err'); };
        fr.readAsText(file);
      });
      input.click();
    });
  };

  /* keep the Book buttons on screen through every repaint */
  let raf = 0;
  const schedule = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; buttons(); });
  };
  if(typeof MutationObserver === 'function' && document.body){
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  if(document.body) schedule();
  else document.addEventListener('DOMContentLoaded', schedule);

  window.SF_BOOK = { epub: exportEpub, share: publish, markdown: markdown, buildEpub: buildEpub };
})();
