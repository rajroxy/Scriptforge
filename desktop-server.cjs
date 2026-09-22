/* ═══════════════════════════════════════════════════════════
   ScriptForge — desktop server (CommonJS, no dependencies)

   The desktop app serves itself: this is the same surface as
   scripts/serve.ts, but in-process and dependency-free, so a packaged
   build needs nothing installed on the machine.

     GET  /                     the app (static files from the app root)
     GET  /api/env-check        which service keys the environment has
     GET  /api/dict?word=…      Merriam-Webster, key never leaves here
     POST /api/publish          store a published book
     GET  /api/publish/<id>     the stored payload
     GET  /r/<id>               the hosted reader page
   ═══════════════════════════════════════════════════════════ */
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8'
};

const esc = v => String(v == null ? '' : v)
  .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── Merriam-Webster ── */
const MW_BASE = 'https://dictionaryapi.com/api/v3/references/collegiate/json/';
const mwClean = v => String(v == null ? '' : v)
  .replace(/\{([^{}]*)\}/g, '$1').replace(/\{[a-z]+\}/gi, '')
  .replace(/\s+/g, ' ').trim();

async function mwLookup(word, key){
  const r = await fetch(MW_BASE + encodeURIComponent(word) + '?key=' + encodeURIComponent(key));
  if(!r.ok) return { ok:false, reason:'error', status:r.status };
  const data = await r.json();
  if(!Array.isArray(data) || !data.length) return { ok:false, reason:'not-found' };
  if(typeof data[0] === 'string') return { ok:false, reason:'not-found', suggestions:data.slice(0, 8) };

  const entries = [];
  for(const e of data.slice(0, 4)){
    const defs = [];
    for(const d of (e.shortdef || [])) defs.push({ def:mwClean(d) });
    for(const dt of (e.def || [])){
      for(const sseq of (dt && dt.sseq) || []){
        for(const pair of sseq || []){
          const sense = Array.isArray(pair) && pair[0] === 'sense' ? pair[1] : null;
          if(!sense) continue;
          const parts = sense.dt || [];
          const text = parts.map(x => mwClean(x[1])).join(' ').replace(/\s+/g, ' ').trim();
          if(text) defs.push({ def:text });
        }
      }
    }
    const seen = new Set(), uniq = [];
    for(const d of defs) if(d.def && !seen.has(d.def)){ seen.add(d.def); uniq.push(d); }
    entries.push({ pos:mwClean(e.fl || ''), defs:uniq.slice(0, 4) });
  }
  const prs = data[0].hwi && data[0].hwi.prs && data[0].hwi.prs[0] && data[0].hwi.prs[0].mw;
  return {
    ok:true, source:'Merriam-Webster',
    word: mwClean((data[0].hwi && data[0].hwi.hw) || word).replace(/\*/g, '·'),
    phonetic: prs ? '/' + mwClean(prs) + '/' : '',
    entries: entries.filter(e => e.defs.length)
  };
}

/* ── the hosted reader page ── */
function readerPage(book){
  const sections = Array.isArray(book.sections) ? book.sections : [];
  const nav = sections.map((s, i) =>
    '<li><a href="#s' + (i + 1) + '">' + esc(s.title || 'Section ' + (i + 1)) + '</a></li>').join('');
  const body = sections.map((s, i) =>
    '<section id="s' + (i + 1) + '"><h2 class="st">' + esc(s.title || 'Section ' + (i + 1)) + '</h2>' + (s.html || '') + '</section>').join('');
  return '<!doctype html><html lang="' + esc(book.language || 'en') + '"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + esc(book.title || 'Untitled') + '</title>'
    + '<style>body{margin:0;background:#141312;color:#e7e2da;font:16px/1.75 Georgia,serif}'
    + '.wrap{max-width:720px;margin:0 auto;padding:56px 24px 120px}h1{font-size:2.4rem}'
    + '.st{font-family:system-ui,sans-serif;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#8b847b}'
    + 'p{margin:0 0 1em;text-indent:1.4em}</style></head><body><div class="wrap">'
    + '<h1>' + esc(book.title || 'Untitled') + '</h1>'
    + (book.author ? '<p>' + esc(book.author) + '</p>' : '')
    + (nav ? '<ol>' + nav + '</ol>' : '') + body + '</div></body></html>';
}

function readBody(req){
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => {
      body += c;
      if(body.length > 24 * 1024 * 1024){ reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const send = (res, status, body, type) => {
  res.writeHead(status, { 'content-type': type || 'text/plain; charset=utf-8', 'cache-control':'no-store' });
  res.end(body);
};

/**
 * Start the desktop server.
 *   opts.root     the app directory (read-only inside a packaged build)
 *   opts.dataDir  where published books are stored (userData)
 *   opts.port     the port to try first
 *   opts.mwKey    the Merriam-Webster key from the environment
 * Resolves to { port, url, close() }.
 */
function startServer(opts){
  /* always absolute: the guard below compares against this exact prefix */
  const root    = path.resolve(opts.root || __dirname);
  const dataDir = opts.dataDir || root;
  const pubDir  = path.join(dataDir, '.published');
  const mwEnv   = opts.mwKey || '';

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const name = url.pathname;

    /* ── published books ── */
    if(req.method === 'POST' && name === '/api/publish'){
      try{
        const payload = JSON.parse(await readBody(req));
        const raw = String(payload.title || 'book').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'book';
        const id = raw + '-' + Math.random().toString(36).slice(2, 8);
        payload.publishedAt = new Date().toISOString();
        await fsp.mkdir(pubDir, { recursive:true });
        await fsp.writeFile(path.join(pubDir, id + '.json'), JSON.stringify(payload), 'utf8');
        return send(res, 200, JSON.stringify({ ok:true, id, url:'/r/' + id }), 'application/json; charset=utf-8');
      }catch(err){
        return send(res, 400, JSON.stringify({ ok:false, error:String(err && err.message || err) }), 'application/json; charset=utf-8');
      }
    }
    if(req.method === 'GET' && name.indexOf('/api/publish/') === 0){
      const id = name.slice('/api/publish/'.length).replace(/[^a-z0-9-]/gi, '');
      try{
        const raw = await fsp.readFile(path.join(pubDir, id + '.json'), 'utf8');
        return send(res, 200, raw, 'application/json; charset=utf-8');
      }catch(e){
        return send(res, 404, JSON.stringify({ ok:false, error:'not found' }), 'application/json; charset=utf-8');
      }
    }
    if(req.method === 'GET' && name.indexOf('/r/') === 0){
      const id = name.slice(3).replace(/[^a-z0-9-]/gi, '');
      try{
        const book = JSON.parse(await fsp.readFile(path.join(pubDir, id + '.json'), 'utf8'));
        return send(res, 200, readerPage(book), 'text/html; charset=utf-8');
      }catch(e){
        return send(res, 404, 'This read link does not exist (any more).');
      }
    }

    /* ── which service keys the environment provides (names only) ── */
    if(req.method === 'GET' && name === '/api/env-check'){
      const names = ['MW_API_KEY','GROQ_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','EXA_API_KEY','UNSPLASH_ACCESS_KEY'];
      const keys = {};
      names.forEach(n => { keys[n] = !!process.env[n]; });
      return send(res, 200, JSON.stringify({ ok:true, keys }), 'application/json; charset=utf-8');
    }

    /* ── the dictionary (the key stays here) ── */
    if(req.method === 'GET' && name === '/api/dict'){
      const word = (url.searchParams.get('word') || '').trim().slice(0, 60);
      const json = body => send(res, 200, JSON.stringify(body), 'application/json; charset=utf-8');
      if(!word) return json({ ok:false, reason:'no-word' });
      const key = mwEnv || (url.searchParams.get('key') || '').trim();
      if(!key) return json({ ok:false, reason:'no-key' });
      try{ return json(await mwLookup(word, key)); }
      catch(err){ return json({ ok:false, reason:'error', error:String(err && err.message || err) }); }
    }

    /* ── static files ── */
    const rel = decodeURIComponent(name).replace(/^\/+/, '');
    let file = path.resolve(path.join(root, rel || 'index.html'));
    if(file !== root && file.indexOf(root + path.sep) !== 0) return send(res, 403, 'Forbidden');
    try{
      const info = await fsp.stat(file);
      if(info.isDirectory()) file = path.join(file, 'index.html');
      const f = await fsp.stat(file);
      if(!f.isFile()) return send(res, 404, 'Not found');
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': f.size,
        'cache-control': 'no-store'
      });
      fs.createReadStream(file).pipe(res);
    }catch(e){
      send(res, 404, 'Not found: ' + name);
    }
  });

  return new Promise((resolve, reject) => {
    let tries = 0;
    const port0 = opts.port || 3187;
    const attempt = (port) => {
      server.once('error', (err) => {
        if(err && err.code === 'EADDRINUSE' && tries < 12){ tries += 1; attempt(port + 1); }
        else reject(err);
      });
      server.listen(port, '127.0.0.1', () => {
        const p = server.address().port;
        resolve({
          port: p,
          url: 'http://127.0.0.1:' + p + '/index.html',
          close: () => { try{ server.close(); }catch(e){} }
        });
      });
    };
    attempt(port0);
  });
}

module.exports = { startServer };
