/* ═══════════════════════════════════════════════════════════
   plan-boards.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · book-share.js
     · plan-boards.js
     · draft-bar.js
     · outline-menu.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ book-share.js ══════════ */
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


/* ══════════ plan-boards.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Plan — real boards

   A beat board is a board of cards. This layer makes that true:

     · every card belongs to a BOARD, and the boards are named
     · the head carries a board picker (T · board ▾ · New board ·
       Rename · Remove · Add beat) with All boards and Reset on the right
     · “All boards” shows every board at once, each under its own
       heading; off, it shows the board you picked
     · Remove deletes the board you are on together with its cards, so a
       project keeps at least one board
     · Reset clears the board you are on (with the app's confirm)
     · boards live on the project, so each book keeps its own

   Cards are drawn by the app's own renderBeats; this layer only
   decides which of them are on screen and how they are numbered.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.plan !== 'function') return;

  const data = function(){ return (typeof D === 'function') ? D() : null; };
  const list = function(){
    const d = data();
    if(!d) return [];
    if(!Array.isArray(d.beats)) d.beats = [];
    return d.beats;
  };
  const boards = function(){
    const d = data();
    if(!d) return [{ id:'b1', name:'Board 1' }];
    if(!Array.isArray(d.planBoards) || !d.planBoards.length) d.planBoards = [{ id:'b1', name:'Board 1' }];
    return d.planBoards;
  };
  const current = function(){
    const d = data();
    const all = boards();
    if(!d) return all[0].id;
    if(!d.planBoard || !all.some(function(b){ return b.id === d.planBoard; })) d.planBoard = all[0].id;
    return d.planBoard;
  };
  const nameOf = function(id){
    const hit = boards().filter(function(b){ return b.id === id; })[0];
    return hit ? hit.name : 'Board';
  };
  const allMode = function(){ return !!(S.config && S.config.planAll); };

  /* a beat that predates boards joins the board you are on */
  const adopt = function(){
    const cur = current();
    list().forEach(function(b){ if(!b.board) b.board = cur; });
  };

  const saveNow = function(){ if(typeof save === 'function') save(); };

  /* ═══ which cards are on screen ═══ */
  const paint = function(){
    const host = document.getElementById('beatList');
    if(!host) return;

    const all = boards();
    const cur = current();
    const beats = list();
    const every = allMode();

    Array.prototype.slice.call(host.querySelectorAll('.plan-board-sep, .plan-board-note')).forEach(function(n){ n.remove(); });

    const cards = Array.prototype.slice.call(host.querySelectorAll('.beat-card'));
    let shown = 0;
    let lastBoard = null;

    cards.forEach(function(card, i){
      const b = beats[i];
      if(!b) return;
      const bid = b.board || cur;

      if(!every && bid !== cur){ card.hidden = true; return; }
      card.hidden = false;
      shown++;

      if(every){
        if(bid !== lastBoard){
          const head = document.createElement('div');
          head.className = 'plan-board-sep';
          head.innerHTML = '<i class="bi bi-columns-gap"></i><span>' + esc(nameOf(bid)) + '</span>';
          host.insertBefore(head, card);
          lastBoard = bid;
        }
        const tag = card.querySelector('.beat-index');
        if(tag) tag.textContent = '·';
      }else{
        const tag = card.querySelector('.beat-index');
        if(tag) tag.textContent = String(shown).padStart(2, '0');
      }
    });

    if(!shown && !every){
      const note = document.createElement('div');
      note.className = 'beat-empty plan-board-note';
      note.innerHTML = '<i class="bi bi-columns-gap"></i><div><b>' + esc(nameOf(cur))
        + '</b> is empty — press <b>Add beat</b> to start this board.</div>';
      host.insertBefore(note, host.firstChild);
    }
  };

  /* ═══ the board always ends on screen ═══
     However the page around it is sized, the board is never allowed to run
     past the bottom of the window: its height is measured from where it
     starts down to the page's own bottom edge, so a third or fourth row of
     cards can always be scrolled into view. A board that is shorter than the
     room keeps its natural height — this only ever caps it. */
  const fit = function(){
    const host = document.getElementById('beatList');
    const page = document.getElementById('page-plan');
    if(!host || !page || !host.getBoundingClientRect || !page.getBoundingClientRect) return;

    const pr = page.getBoundingClientRect();
    if(pr.height < 40) return;                       /* the page is not on screen */
    const hr = host.getBoundingClientRect();
    if(hr.height < 1) return;

    const bottom = Math.min(pr.bottom, window.innerHeight);
    const room = Math.max(160, Math.round(bottom - hr.top - 12));
    const now = host.style.getPropertyValue('max-height');
    if(now !== room + 'px') host.style.setProperty('max-height', room + 'px', 'important');
  };

  const refit = function(){
    if(typeof requestAnimationFrame !== 'function'){ fit(); return; }
    requestAnimationFrame(function(){ fit(); });
  };

  window.renderBeats = (function(prev){
    return function(){
      adopt();
      const r = (typeof prev === 'function') ? prev.apply(this, arguments) : undefined;
      try{ paint(); }catch(e){ console.warn('board paint failed:', e); }
      refit();
      return r;
    };
  })(window.renderBeats);

  window.addEventListener('resize', refit);
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('#page-plan')) refit();
  }, true);

  /* ═══ the head ═══
     One row, two groups and nothing doubled:

       left   T · Add beat                       (the page's writing tools)
       right  ＋ · ✎ · 🗑 · which board · count · All boards · Clear

     Add beat sits beside T, where the writer adds a card; the board's own
     controls — start one, rename it, remove it, and the picker that says
     which board you are on — end the row on the right. Every button the
     app drew is re-used; this only places and orders them. */
  const head = function(root){
    if(!root || !root.querySelector) return;
    const bar = root.querySelector('.page-head');
    if(!bar) return;

    adopt();
    const all = boards();
    const cur = current();

    /* the beat adder keeps its own name — New board is a different button */
    const addBeat = bar.querySelector('[data-act="add-beat"]');
    if(addBeat){
      addBeat.innerHTML = '<i class="bi bi-plus-lg"></i> Add beat';
      addBeat.title = 'Add a card to this board';
    }

    const left = bar.querySelector('.ol-head-left') || bar;

    /* ── the right group holds every board action, once ──
       (plan-head.js may have added a second Clear button — the board keeps
       one and drops the rest) */
    let right = bar.querySelector('.plan-actions');
    if(!right){
      right = document.createElement('div');
      right.className = 'ol-actions plan-actions';
      bar.appendChild(right);
    }
    const clears = Array.prototype.slice.call(bar.querySelectorAll('[data-act="clear-beats"]'));
    clears.forEach(function(b, i){ if(i) b.remove(); });
    const clear = clears[0] || null;
    if(clear){
      clear.className = 'ol-btn plan-btn-clear';
      clear.innerHTML = '<i class="bi bi-eraser"></i> Clear';
    }

    /* ── Add beat stays on the LEFT, right after T ──
       It is the page's writing tool: it adds a card to the board you are
       on, so it belongs with the type button, not with the board's own
       commands. */
    if(addBeat && left !== bar && left.firstElementChild){
      const typo = left.querySelector('[data-typop]');
      left.appendChild(addBeat);
      if(typo && left.firstElementChild !== typo) left.insertBefore(typo, left.firstChild);
    }

    /* one home for the page's own switches, in the order they read
       (appendChild moves a node that is already there, so this is also the
       sort). Add act / Add scene were taken off the bar long ago. */
    [bar.querySelector('[data-act="plan-all"]'),
     clear].forEach(function(b){
      if(b) right.appendChild(b);
    });

    /* ── the board cluster ends the row: ＋ · rename · remove · picker ──
       It is placed BEFORE All boards and Clear, so those stay the last
       thing on the bar and the board's own controls read as one cluster. */

    /* the page's old action group is empty now — it goes */
    Array.prototype.forEach.call(bar.querySelectorAll('.plan-tools'), function(g){
      if(!g.children.length) g.remove();
    });

    /* the typography button stays at the far left, before the picker */
    const typo = bar.querySelector('[data-typop]');
    if(typo && left.firstElementChild !== typo) left.insertBefore(typo, left.firstChild);

    /* rebuilt every render: the app's dropdown card draws this select, so a
       fresh node is the only way to be sure the label is right */
    const old = bar.querySelector('[data-plan-picker]');
    if(old) old.remove();
    {
      const picker = document.createElement('span');
      picker.className = 'plan-picker';
      picker.setAttribute('data-plan-picker', '1');
      picker.innerHTML =
          '<button class="ol-btn ol-btn-icon plan-board-new" data-plan-new title="Add board — start a new one"><i class="bi bi-plus-lg"></i></button>'
        + '<button class="ol-btn ol-btn-icon plan-board-ren" data-plan-ren title="Rename this board"><i class="bi bi-pencil"></i></button>'
        + '<button class="ol-btn ol-btn-icon plan-board-del" data-plan-del title="Remove this board"'
        +   (all.length < 2 ? ' disabled' : '') + '><i class="bi bi-trash3"></i></button>'
        + '<select class="sel plan-board-sel" data-plan-board title="Which board to show">'
        + all.map(function(b){
            return '<option value="' + esc(b.id) + '"' + (b.id === cur ? ' selected' : '') + '>'
              + esc(b.name) + '</option>';
          }).join('')
        + '</select>'
        + '<span class="plan-board-count" data-plan-count>' + all.length + ' board' + (all.length === 1 ? '' : 's') + '</span>';
      /* the cluster ends the row, before All boards and Clear */
      if(right.firstChild) right.insertBefore(picker, right.firstChild);
      else right.appendChild(picker);
      if(typeof window.enhanceSelects === 'function') window.enhanceSelects(picker);
    }

    /* the right side keeps All boards · Clear, with a clearer word each */
    const allSw = bar.querySelector('[data-act="plan-all"]');
    if(allSw){
      allSw.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> All boards';
      allSw.title = 'Show every board at once';
      allSw.classList.toggle('on', allMode());
    }
    const reset = bar.querySelector('[data-act="clear-beats"]');
    if(reset){
      reset.title = allMode() ? 'Clear every board' : 'Clear ' + nameOf(cur);
    }
  };

  const wrap = PAGE_RENDERERS.plan;
  PAGE_RENDERERS.plan = function(root){
    const r = wrap.call(this, root);
    try{ head(root); }catch(e){ console.warn('board head failed:', e); }
    return r;
  };

  /* keep the picker alive when the board redraws itself */
  const rerender = function(){ try{ window.renderBeats(); }catch(e){} };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    if(t.closest('[data-plan-new]')){
      e.preventDefault();
      const d = data();
      const all = boards();
      let n = all.length + 1;
      while(all.some(function(b){ return b.name === 'Board ' + n; })) n++;
      const id = 'b' + Date.now().toString(36);
      all.push({ id: id, name: 'Board ' + n });
      if(d) d.planBoard = id;
      saveNow();
      if(typeof goPage === 'function') goPage('plan');
      else { const root = document.getElementById('page-plan'); if(root && PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root); }
      if(typeof toast === 'function') toast('Board ' + n + ' started');
      return;
    }

    /* remove the board you are on, together with its cards */
    if(t.closest('[data-plan-del]')){
      e.preventDefault();
      const d = data();
      const all = boards();
      if(all.length < 2){
        if(typeof toast === 'function') toast('A project keeps at least one board', 'warn');
        return;
      }
      const cur = current();
      const name = nameOf(cur);
      const mine = list().filter(function(b){ return b.board === cur; }).length;
      if(!confirm('Remove “' + name + '”'
        + (mine ? ' and its ' + mine + ' card' + (mine === 1 ? '' : 's') : '') + '?')) return;

      /* its cards go with it; every other board is untouched */
      const keep = list().filter(function(b){ return b.board !== cur; });
      list().length = 0;
      keep.forEach(function(b){ list().push(b); });

      const rest = all.filter(function(b){ return b.id !== cur; });
      if(d) d.planBoards = rest;
      if(d) d.planBoard = rest[0].id;
      saveNow();
      rerender();
      const root = document.getElementById('page-plan');
      if(root){
        if(PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root);
        else head(root);
      }
      if(typeof toast === 'function') toast('“' + name + '” removed');
      return;
    }

    if(t.closest('[data-plan-ren]')){
      e.preventDefault();
      const cur = current();
      const board = boards().filter(function(b){ return b.id === cur; })[0];
      if(!board) return;
      const name = prompt('Board name', board.name);
      if(name === null) return;
      const clean = String(name).trim();
      if(!clean) return;
      board.name = clean.slice(0, 40);
      saveNow();
      const root = document.getElementById('page-plan');
      if(root && PAGE_RENDERERS.plan) PAGE_RENDERERS.plan(root);
      return;
    }
  }, true);

  document.addEventListener('change', function(e){
    const sel = e.target;
    if(!sel || !sel.dataset || sel.dataset.planBoard === undefined) return;
    const d = data();
    if(!d) return;
    d.planBoard = sel.value;
    saveNow();
    rerender();
    const root = document.getElementById('page-plan');
    if(root) head(root);
  }, true);

  /* All boards flips the filter with it */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="plan-all"]')) return;
    setTimeout(function(){
      rerender();
      const root = document.getElementById('page-plan');
      if(root) head(root);
    }, 0);
  }, true);

  /* Reset clears the board you are on, not every board — unless you are
     looking at all of them. Registered on the window so it runs before the
     app's own capture handler for the same button. */
  window.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-act="clear-beats"]')) return;
    if(boards().length < 2) return;                       /* one board → the app's clear is fine */

    e.preventDefault();
    e.stopPropagation();
    const d = data();
    const cur = current();

    if(allMode()){
      const n = list().length;
      if(!n) return;
      if(!confirm('Remove all ' + n + ' cards from every board?')) return;
      list().length = 0;
      saveNow();
      rerender();
      return;
    }

    const mine = list().filter(function(b){ return b.board === cur; }).length;
    if(!mine) return;
    if(!confirm('Remove all ' + mine + ' cards from “' + nameOf(cur) + '”?')) return;
    const keep = list().filter(function(b){ return b.board !== cur; });
    list().length = 0;
    keep.forEach(function(b){ list().push(b); });
    saveNow();
    rerender();
  }, true);
})();


/* ══════════ draft-bar.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Draft — the bar's three buttons

   · New draft is the bar while you are writing. It calls the app's own
     New draft action; the writing actions live in the right-click menu.
   · While an AI panel is on screen — the right-click assistant, the
     draft chat, or the AI result sheet — the bar stays and New draft
     steps aside. Everything is back the moment the panel closes.
   · New Chat takes New draft's slot, and only while the draft chat is
     the thing on screen: the chat's own way in, in the bar.

   · The chat's AI settings button rides at the bar's right end, and only
     while a chat is open. It is the page's own top bar, not the app
     header, and not the chat card.

   The buttons are the app's own; this only places and hides them.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const shown = function(el){
    if(!el || el.hidden) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };

  /* the draft chat itself — the view or its panel in the pane */
  const chatView = function(){
    if(typeof S !== 'undefined' && S.page && S.page !== 'draft') return false;
    const draft = document.getElementById('page-draft');
    if(!draft) return false;
    if(draft.classList.contains('dc-on')) return true;
    return !!draft.querySelector('[data-dc="1"]');
  };

  /* the chat's own AI settings view is open — the button that opens it has
     done its job, so it steps aside while that panel is on screen */
  const chatInSettings = function(){
    return !!document.querySelector('#page-draft .draft-split[data-dcset="1"]');
  };

  const chatOpen = function(){
    if(shown(document.getElementById('fabAI'))) return true;      /* right-click assistant */
    const modal = document.getElementById('modalRoot');           /* the AI result sheet */
    if(modal && modal.classList.contains('open')) return true;
    return chatView();
  };

  /* The AI chat's settings button belongs in the Draft page's own top bar,
     at its right end — not in the app header, and not on the chat card.
     The chat card has no head of its own any more, so this is the single
     sliders icon: it appears beside New Chat while the chat is open. */
  const settingsBtn = function(bar){
    let b = bar.querySelector('[data-sfbar-chat-settings]');
    if(!b){
      b = document.createElement('button');
      b.className = 'ol-btn ol-btn-icon sf-bar-end';
      b.setAttribute('data-sfbar-chat-settings', '1');
      b.title = 'Chat AI settings';
      b.innerHTML = '<i class="bi bi-sliders"></i>';
      bar.appendChild(b);
    }
    return b;
  };
  const syncTopbar = function(){
    const bar = document.querySelector('#page-draft .sf-bar');
    if(!bar) return;
    const b = settingsBtn(bar);
    const on = chatView() && !chatInSettings();
    if(b.hidden === on) b.hidden = !on;
  };

  const paint = function(){
    syncTopbar();
    const open = chatOpen();
    if(document.body.classList.contains('sf-ai-open') !== open){
      document.body.classList.toggle('sf-ai-open', open);
    }
    /* the bar swaps New draft for New Chat when the chat is the thing on
       screen — the chat's own presence, not any AI panel */
    const inChat = chatView();
    if(document.body.classList.contains('sf-chat-open') !== inChat){
      document.body.classList.toggle('sf-chat-open', inChat);
    }
    if(document.body.classList.contains('sf-chat-set') !== chatInSettings()){
      document.body.classList.toggle('sf-chat-set', chatInSettings());
    }
    const bar = document.querySelector('#page-draft .sf-bar');
    if(bar && bar.classList.contains('sf-bar-hidden') !== open){
      bar.classList.toggle('sf-bar-hidden', open);
    }
  };

  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest || !t.closest('[data-sfbar-chat-settings]')) return;
    e.preventDefault();
    const DC = window.DraftChat;
    if(DC && typeof DC.settings === 'function') DC.settings();
    else if(typeof toast === 'function') toast('The draft chat is not available here', 'warn');
  }, true);

  setInterval(paint, 200);
  document.addEventListener('click', paint, true);
  document.addEventListener('keyup', paint, true);
  window.addEventListener('resize', paint);
  if(document.body) paint();
})();


/* ══════════ outline-menu.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   Outline · Manuscript — right-click, and the AI names your sections

   Right-click anywhere on the Outline page — or on the Manuscript
   page, outside the writing area — and the menu carries the four
   naming jobs, in the app's own menu language:

     Chapter titles        a name for every chapter
     Chapter description   what every chapter covers
     Subchapter titles     a name for every subchapter
     Subchapter description  what happens in each subchapter
     ———
     Check the order       does the structure hold?

   The two pairs are DIFFERENT jobs and stay different: a title is a name
   (2–5 words, dropped on the outline row), a description is what the
   section is for (a sentence or two, for the writer and the assistant
   rather than for the reader). They were called “subtitles”, which put
   them next to the title jobs and made them read like a second name —
   the app says “description” now, which is what they write.

   The naming jobs live on the Outline page and nowhere else: the
   manuscript is a writing page, so its right-click carries the writing
   and the language actions plus the structure check, and no naming.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const F = window.AI_FNS || (window.AI_FNS = {});
  const ask = function(title, sub, prompt){
    if(typeof window.sfAsk === 'function'){ window.sfAsk(title, sub, prompt); return; }
    if(typeof runAI === 'function') runAI(prompt, title, sub);
  };
  const brief = function(){
    try{ return String((typeof sfProjectBrief === 'function') ? sfProjectBrief() : ''); }
    catch(e){ return ''; }
  };

  /* ── the two description jobs ──
     The pair that used to ask for a SUBTITLE: one line of atmosphere under
     a name, which is a second title by another route. What the writer wants
     there is what the section IS — so these ask for a description, which is
     a sentence or two about what happens and what the section is for. */
  F.olChapterSubs = function(){
    ask('Chapter description', 'Outline',
      'You write reference notes on other writers\u2019 outlines.\n\n' + brief() + '\n\n' +
      'Task: write a short DESCRIPTION of what EVERY chapter in the structure above covers —\n' +
      'what happens in it and what it is for in the whole.\n' +
      'Rules: two or three sentences each, plain and concrete; use only what the outline, the plan,\n' +
      'the Bible and the drafts actually say and never invent events, names or places; where a\n' +
      'chapter is still empty, write "not yet planned" and nothing more. No titles, no praise.\n' +
      'Reply as a plain list — "chapter number — description" — and nothing else.');
  };

  F.olSubSubs = function(){
    ask('Subchapter description', 'Outline',
      'You write reference notes on other writers\u2019 outlines.\n\n' + brief() + '\n\n' +
      'Task: for every subchapter in the structure above, write a short DESCRIPTION — one or two\n' +
      'sentences on what happens in it, in order.\n' +
      'Rules: plain and concrete; use only what the project actually says and never invent events,\n' +
      'names or places; where one is still empty, write "not yet planned". No titles, no praise.\n' +
      'Reply as a plain list — "chapter — subchapter: description" — and nothing else.');
  };

  /* ── the menu ── */
  const NAMING = [
    { fn:'olChapterTitles', icon:'bookmark-fill',    label:'Chapter titles' },
    { fn:'olChapterSubs',   icon:'text-paragraph',   label:'Chapter description' },
    { fn:'olSubTitles',     icon:'signpost-2',       label:'Subchapter titles' },
    { fn:'olSubSubs',       icon:'text-indent-left', label:'Subchapter description' }
  ];
  /* the writing actions — the same ones the editor's own menu carries, so the
     manuscript's right-click says the same thing wherever you click it */
  const TEXT_ACTIONS = [
    { fn:'fixGrammar', icon:'magic',               label:'Fix grammar' },
    { fn:'improve',    icon:'stars',               label:'Improve' },
    { fn:'rewrite',    icon:'arrow-repeat',        label:'Rewrite' },
    { fn:'continue',   icon:'arrow-right-circle',  label:'Continue writing' },
    { fn:'expand',     icon:'arrows-angle-expand', label:'Expand' },
    { fn:'summarize',  icon:'card-text',           label:'Summarize' }
  ];
  const LANGUAGE = [
    { fn:'translate',        icon:'translate', label:'Translate' },
    { fn:'hinglishToHindi',  icon:'translate', label:'Hinglish → हिन्दी' },
    { fn:'hinglishToEnglish',icon:'translate', label:'Hinglish → English' }
  ];

  const ITEMS = {
    /* the naming jobs belong to the Outline page — the manuscript carries the
       writing and the language actions, and nothing that names its sections */
    outline: NAMING.concat([
      null,
      { fn:'olStructure', icon:'list-nested', label:'Check the order' }
    ]),
    manuscript: [ { fn:'olStructure', icon:'list-nested', label:'Check the order' } ]
      .concat([ null ], TEXT_ACTIONS, [ null ], LANGUAGE)
  };

  /* the ids each host page answers to, in the order they are checked.
     The manuscript is opened under 'manuscript' AND under the alias 'write'
     (the chapter strip and the chapter buttons navigate there), and the
     mode-specific writing pages draw the same thing — every one of them
     carries the naming jobs. */
  const HOSTS = {
    outline:    ['outline'],
    manuscript: ['manuscript', 'write', 'chapters', 'scenes', 'episodes', 'acts', 'stanzas', 'verses']
  };
  const activeHost = function(){
    const keys = Object.keys(HOSTS);
    for(let i = 0; i < keys.length; i++){
      const list = HOSTS[keys[i]];
      for(let j = 0; j < list.length; j++){
        const el = document.getElementById('page-' + list[j]);
        if(el && el.classList.contains('active')) return { id: keys[i], el: el };
      }
    }
    return null;
  };

  let menu = null;
  const close = function(){
    if(menu){ menu.remove(); menu = null; }
  };

  const build = function(host, x, y){
    close();
    menu = document.createElement('div');
    menu.className = 'menu sf-ctx';
    menu.innerHTML = (ITEMS[host] || ITEMS.outline).map(function(it){
      if(!it) return '<div class="menu-sep"></div>';
      return '<button class="menu-item" data-sfctx="' + it.fn + '">'
        + '<i class="mi-icon bi bi-' + it.icon + '"></i>' + it.label + '</button>';
    }).join('');
    document.body.appendChild(menu);

    const w = menu.offsetWidth || 220, h = menu.offsetHeight || 200;
    const vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
    menu.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
    menu.style.top  = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
  };

  document.addEventListener('contextmenu', function(e){
    const host = activeHost();
    if(!host) return;
    const t = e.target;
    if(!t || !t.closest) return;
    if(!host.el.contains(t)) return;
    /* typing keeps its own menu — except the Fountain source on the script
       page, where this menu is the only way to reach the naming jobs */
    if(t.closest('input, textarea, [contenteditable="true"]') && !t.closest('.fnt-src')) return;
    e.preventDefault();
    build(host.id, e.clientX, e.clientY);
  }, true);

  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('[data-sfctx]')){
      e.preventDefault();
      const fn = t.closest('[data-sfctx]').dataset.sfctx;
      close();
      if(F[fn]) F[fn]();
      else if(typeof toast === 'function') toast('That action is not available', 'warn');
      return;
    }
    if(menu && t !== menu && !(menu.contains && menu.contains(t))) close();
  }, true);

  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); }, true);
  window.addEventListener('blur', close);
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);

  /* the right-click assistant's menu on these pages says the same things:
     each description job is added under the title job it belongs to. The
     labels here are the novel ones — fab-fix.js re-writes them in the
     form's own words (Scene · Sub-scene) as the panel is drawn. */
  const FAB_SUBS = {
    outline: [
      { fn:'olChapterSubs', after:'olChapterTitles', icon:'text-paragraph',
        label:'Chapter description', desc:'Describe what every chapter covers, from your outline' },
      { fn:'olSubSubs', after:'olSubTitles', icon:'text-indent-left',
        label:'Subchapter description', desc:'Describe what happens in each subchapter' }
    ]
  };
  if(typeof SF_FAB_AI !== 'undefined' && SF_FAB_AI){
    Object.keys(FAB_SUBS).forEach(function(page){
      const list = SF_FAB_AI[page];
      if(!Array.isArray(list)) return;
      FAB_SUBS[page].forEach(function(o){
        if(list.some(function(x){ return x.fn === o.fn; })) return;
        const at = list.findIndex(function(x){ return x.fn === o.after; });
        /* each one sits right under the job it belongs to */
        if(at < 0) list.push(o);
        else list.splice(at + 1, 0, o);
      });
    });
  }
})();

