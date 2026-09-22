/* ═══════════════════════════════════════════════════════════
   ScriptForge — Draft Chat
   Right-click the FAB on the Draft page: the draft split itself
   becomes an AI chat. Chats left, conversation right. Attach
   files, voice input, reply language, per chat-AI settings.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const KEEP = 10;
  const X_SVG = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">' +
    '<path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    const saveSoon = (typeof debounce === 'function')
    ? debounce(function(){ persist(); }, 500) : function(){ persist(); };
  function persist(){ try{ save(); }catch(e){} }

  function loadLib(url){


    if(document.querySelector('script[src="'+url+'"]')) return Promise.resolve();
    return new Promise(function(ok,no){ const s=document.createElement('script');
      s.src=url; s.onload=ok; s.onerror=no; document.head.appendChild(s); });
  }
  async function extractText(f){
    const ext = (f.name.split('.').pop()||'').toLowerCase();
    if(ext === 'pdf')  return extractPdf(f);
    if(ext === 'epub') return extractEpub(f);
    return await f.text();
  }
  async function extractPdf(f){
    await loadLib('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
    let out = '';
    for(let i=1; i<=pdf.numPages; i++){
      const c = await (await pdf.getPage(i)).getTextContent();
      out += c.items.map(function(x){ return x.str; }).join(' ') + '\n\n';
      if(out.length > 20000) break;
    }
    return out;
  }
  async function extractEpub(f){
    await loadLib('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    const zip = await JSZip.loadAsync(f);
    const cf = zip.file('META-INF/container.xml');
    const ctr = cf ? await cf.async('string') : '';
    const m = ctr.match(/full-path="([^"]+)"/);
    if(!m) throw new Error('Not a valid EPUB');
    const opfPath = m[1];
    const dir = opfPath.indexOf('/') !== -1 ? opfPath.replace(/[^/]+$/,'') : '';
    const opf = await zip.file(opfPath).async('string');
    const ids = (opf.match(/<itemref[^>]+idref="([^"]+)"/g) || [])
      .map(function(s){ return s.replace(/.*idref="([^"]+)".*/, '$1'); });
    const items = {};
    (opf.match(/<item[^>]*>/g) || []).forEach(function(tag){
      const id = tag.match(/id="([^"]+)"/), href = tag.match(/href="([^"]+)"/);
      if(id && href) items[id[1]] = href[1];
    });
    let out = '';
    for(const id of ids){
      const href = items[id]; if(!href) continue;
      const file = zip.file(dir + decodeURIComponent(href)); if(!file) continue;
      const html = await file.async('string');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      out += (doc.body ? doc.body.textContent : '').replace(/[ \t]+/g,' ').trim() + '\n\n';
      if(out.length > 20000) break;
    }
    return out;
  }
  function resizeImage(f){
    return new Promise(function(ok,no){
      const img = new Image();
      img.onload = function(){
        let w = img.width, h = img.height, m = 1600;
        if(Math.max(w,h) > m){ const s = m/Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        ok(c.toDataURL('image/jpeg', .85));
      };
      img.onerror = no;
      img.src = URL.createObjectURL(f);
    });
  }
  const VISION_RE = /(gemini|gpt-4o|gpt-4\.1|gpt-4-turbo|vision|llava|llama-3\.2|llama-4|pixtral|mistral-small-3|claude-3|claude-4|qwen2?[\d.]*-?vl|internvl|moondream)/i;
  function isVision(){ const c = chatCfg(); return c.provider === 'gemini' || VISION_RE.test(chatModelFor() || ''); }

  /* ── characters ── */
  const DC_CHARS = {
    novel: {
      reader:{label:'Reader & fan',text:'a devoted novel reader and lifelong fan. You react as a reader, not an editor. Listen first and show real interest. Ask curious questions about the characters, the world and what happens next. Share what excites you. Never point out problems, plot holes or weaknesses unless the writer explicitly asks for critique.'},
      editor:{label:'Line editor',text:'a sharp line editor. Tighten prose, cut flab, fix rhythm and word choice — constructive notes about the writing itself.'},
      coach:{label:'Writing coach',text:'an encouraging writing coach. Ask questions that help the writer find the story themselves, and cheer their progress.'},
      muse:{label:'Idea muse',text:'a wildly imaginative brainstormer. Throw out bold, varied ideas without worrying whether they are practical.'},
      critic:{label:'Critic',text:'a tough, honest critic. Find weak spots, plot holes, flat characters and slow passages, and say so plainly.'},
      worldbuilder:{label:'Worldbuilder',text:'a worldbuilding and lore specialist. Help with setting, rules, history, culture and consistency.'},
      custom:{label:'Custom',text:''}
    },
    screenplay: {
      reader:{label:'Audience member',text:'a movie lover watching as an audience member. React to the scenes as you watch and say what you feel. Ask curious questions. Do not give notes, problems or fixes unless the writer explicitly asks.'},
      editor:{label:'Script doctor',text:'a script doctor who polishes scenes. Tighten action lines, sharpen dialogue, fix formatting.'},
      coach:{label:'Story consultant',text:'a story consultant and mentor. Ask questions that help the writer find the scene and structure themselves.'},
      muse:{label:'Pitch partner',text:'a pitch partner full of big ideas — loglines, set-pieces, reversals, sequences.'},
      critic:{label:'Coverage reader',text:'a studio coverage reader. Blunt and honest about structure, character, pacing and dialogue.'},
      worldbuilder:{label:'Production designer',text:'a production designer and worldbuilder — locations, look, tone, props and how the world reads on screen.'},
      custom:{label:'Custom',text:''}
    }
  };
  function charsFor(){
    const m = (typeof S !== 'undefined' && S.mode) || 'novel';
    return (m === 'screenplay' || m === 'tv' || m === 'stage') ? DC_CHARS.screenplay : DC_CHARS.novel;
  }
  const DC_LEVELS = {
    beginner:{label:'Beginner',text:'The writer is new to this — explain plainly and avoid jargon.'},
    intermediate:{label:'Intermediate',text:'The writer knows the basics — be direct and use normal craft terms.'},
    advanced:{label:'Advanced',text:'The writer is experienced — be concise, skip basics, get to craft detail.'}
  };
  const DC_TONES = {
    neutral:{label:'Neutral',text:'Use a neutral tone.'}, warm:{label:'Warm',text:'Use a warm tone.'},
    casual:{label:'Casual',text:'Keep it casual and easygoing, like talking with a friend.'},
    friendly:{label:'Friendly',text:'Be friendly and supportive.'}, blunt:{label:'Blunt',text:'Be blunt and direct.'},
    playful:{label:'Playful',text:'Keep it playful and light.'}
  };
  const DC_LENGTH = {
    short:{label:'Short',text:'Keep every reply short — one to three sentences.'},
    medium:{label:'Medium',text:'Keep replies to a short paragraph.'},
    long:{label:'Long',text:'Give as much detail as the question needs.'}
  };
   const DC_LANGS = {
    auto:{label:'Auto (match the draft)'},
    en:{label:'English'},
    hi:{label:'Hindi (हिन्दी)'}
  };
  

  const DC_PRESET_PROVIDER = { free:'groq', paid:'openai', local:'ollama' };

  function dcCfg(){
    if(!S.config.dc || typeof S.config.dc !== 'object') S.config.dc = {};
    const c = S.config.dc, chars = charsFor();
    if(!['free','paid','local'].includes(c.preset)) c.preset = 'free';
    if(!chars[c.persona]) c.persona = 'reader';
    if(!DC_LEVELS[c.level]) c.level = 'intermediate';
    if(!DC_TONES[c.tone])   c.tone  = 'friendly';
    if(!DC_LENGTH[c.length]) c.length = 'medium';
    if(!DC_LANGS[c.lang])    c.lang   = 'auto';
    if(typeof c.custom !== 'string') c.custom = '';
    if(typeof c.critique !== 'boolean') c.critique = false;
    return c;
  }

  /* session-only — never persisted, so a reload shows the Draft page */
  let _dcOpen = false, _dcSettings = false;
  const dcOn       = () => _dcOpen;
  const settingsOn = () => _dcSettings;

  /* ── chat-only AI config (separate from Settings → AI) ── */
  function chatCfg(){
    if(!S.config.chatAI || typeof S.config.chatAI !== 'object') S.config.chatAI = {};
    const c = S.config.chatAI;
    if(!c.provider) c.provider = S.config.provider || 'groq';
    if(!c.keys   || typeof c.keys   !== 'object') c.keys   = {};
    if(!c.bases  || typeof c.bases  !== 'object') c.bases  = {};
    if(!c.models || typeof c.models !== 'object') c.models = {};
    if(c.temperature == null) c.temperature = (S.config.temperature != null ? S.config.temperature : 0.7);
    if(c.maxTokens   == null) c.maxTokens   = (S.config.maxTokens   != null ? S.config.maxTokens   : 1024);
    return c;
  }
  function chatProvider(){ return aiProvider(chatCfg().provider); }
  function chatKeyFor(id){ const c = chatCfg(), p = id || c.provider; return c.keys[p]   || aiKeyFor(p); }
  function chatBaseFor(id){ const c = chatCfg(), p = id || c.provider; return c.bases[p]  || aiBaseFor(p); }
  function chatModelFor(id){ const c = chatCfg(), p = id || c.provider; return c.models[p] || aiModelFor(p); }

       async function chatCallAI(prompt, images){
    const c = chatCfg(), p = aiProvider(c.provider), key = chatKeyFor();
    if(!key && !p.keyless) throw new Error('No API key for ' + p.name + '. Open the chat\u2019s AI settings.');
    images = images || [];
    if(p.gemini){
      const base = chatBaseFor() || 'https://generativelanguage.googleapis.com/v1beta';
      const r = await fetch(base + '/models/' + chatModelFor() + ':generateContent?key=' + key, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          contents:[{ parts:[{ text:prompt }].concat(images.map(function(im){
            return { inline_data:{ mime_type:'image/jpeg', data: im.dataUrl.split(',')[1] } };
          })) }],
          generationConfig:{ temperature:c.temperature, maxOutputTokens:c.maxTokens }
        })
      });
      if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error((e.error && e.error.message) || ('HTTP ' + r.status)); }
      const d = await r.json();
      const t = d.candidates && d.candidates[0] && d.candidates[0].content
             && d.candidates[0].content.parts && d.candidates[0].content.parts[0].text;
      if(t) return t;
      throw new Error('No response');
    }


    const base = chatBaseFor();
    if(!base) throw new Error('No endpoint set for ' + p.name + '. Open the chat\u2019s AI settings.');
    const headers = { 'Content-Type':'application/json' };
    if(key) headers['Authorization'] = 'Bearer ' + key;
    if(p.id === 'openrouter') headers['HTTP-Referer'] = location.href;
    const r = await fetch(base + '/chat/completions', {
      method:'POST', headers,
      body: JSON.stringify({ model: chatModelFor(), temperature: c.temperature, max_tokens: c.maxTokens,
                messages:[{ role:'user', content: images.length ? [{ type:'text', text:prompt }].concat(images.map(function(im){ return { type:'image_url', image_url:{ url: im.dataUrl } }; })) : prompt }] })

    });
    if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error((e.error && e.error.message) || ('HTTP ' + r.status)); }
    const d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || 'No response';
  }

  async function chatFetchModels(){
    const c = chatCfg(), p = aiProvider(c.provider), key = chatKeyFor(), base = chatBaseFor();
    if(!key && !p.keyless){ toast('Enter an API key first', 'err'); return []; }
    if(!base){ toast('Set an endpoint first', 'err'); return []; }
    try{
      let models = [];
      if(p.gemini){
        const r = await fetch(base + '/models?key=' + key); const d = await r.json();
        models = (d.models || []).filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1)
          .map(m => ({ id:m.name.replace('models/',''), n:m.displayName || m.name }));
      } else {
        const headers = {}; if(key) headers['Authorization'] = 'Bearer ' + key;
        if(p.id === 'openrouter') headers['HTTP-Referer'] = location.href;
        const r = await fetch(base + '/models', { headers }); const d = await r.json();
        models = (d.data || []).map(m => ({ id:m.id, n:m.name || m.id }));
        if(p.freeOnly) models = models.filter(m => m.id.indexOf(':free') !== -1);
        models = models.slice(0, 120);
      }
      if(!models.length) throw new Error('No models');
      c.available = c.available || {}; c.available[p.id] = models; save();
      toast('Loaded ' + models.length + ' models');
      return models;
    }catch(e){ toast('Failed: ' + e.message, 'err'); return []; }
  }
  async function chatTestConn(){
    try{ await chatCallAI('Say "ok" in one word.'); toast('Chat AI works ✓'); return true; }
    catch(e){ toast(e.message, 'err'); return false; }
  }

  /* ── store ── */
  function chats(){ const d = D(); if(!Array.isArray(d.aiChats)) d.aiChats = []; return d.aiChats; }
  function activeChat(){
    const list = chats(), d = D();
    let c = list.find(x => x.id === d.aiChatActive) || list[0] || null;
    if(c) d.aiChatActive = c.id;
    return c;
  }
  let _dcPage = 0;
  function newChat(){
    const list = chats();
    const c = { id:(typeof uid === 'function' ? uid() : String(Date.now())), title:'', messages:[], created:Date.now() };
    list.unshift(c); D().aiChatActive = c.id; _dcPage = 0; saveSoon();
    return c;
  }

  const splitEl = () => document.querySelector('#page-draft .draft-split[data-dc="1"]');
  const q = sel => { const s = splitEl(); return s ? s.querySelector(sel) : null; };

  /* ── attachments + voice (module state) ── */
  let _files = [];
  let _rec = null;

  /* ── markup ── */
  function chatMarkup(){
    return '' +
        '<aside class="draft-list">' +
      '<div class="draft-list-head">' +
        '<button class="icon-btn-sm" data-dc="new" title="New chat"><i class="bi bi-plus-lg"></i></button>' +
      '</div>' +
      '<div class="draft-rows" id="dcList"></div>' +
      '<footer class="dc-pager">' +
        '<button class="dc-pager-btn" data-dc-page="-1" title="Previous"><i class="bi bi-chevron-left"></i></button>' +
        '<span class="dc-pager-range" id="dcRange">0</span>' +
        '<button class="dc-pager-btn" data-dc-page="1" title="Next"><i class="bi bi-chevron-right"></i></button>' +
      '</footer>' +
    '</aside>' +

    '<section class="draft-pane">' +
      '<header class="draft-pane-head">' +
        '<span class="dc-pane-title" id="dcTitle">New chat</span>' +
        '<span class="draft-list-acts">' +
          '<button class="icon-btn-sm" data-dc="settings" title="Chat AI settings"><i class="bi bi-sliders"></i></button>' +
        '</span>' +
      '</header>' +
      '<div class="dc-msgs" id="dcMsgs"></div>' +
      '<div class="dc-files" id="dcFiles" hidden></div>' +
      '<div class="dc-input-row">' +
        '<button class="icon-btn-sm dc-ibtn" data-dc="attach" title="Attach files"><i class="bi bi-paperclip"></i></button>' +
        '<textarea class="dc-input" id="dcInput" rows="1" placeholder="Message the AI…  (Enter to send · Shift+Enter for a new line)"></textarea>' +
        '<button class="icon-btn-sm dc-ibtn" data-dc="mic" title="Voice input"><i class="bi bi-mic"></i></button>' +
        '<button class="dc-send" data-dc="send" title="Send"><i class="bi bi-send"></i></button>' +
      '</div>' +
    '</section>';
  }

  function rowActions(id){
    return '<span class="draft-row-acts">' +
      '<button class="draft-act" data-dc-rename="' + esc(id) + '" title="Rename"><i class="bi bi-pencil"></i></button>' +
      '<button class="draft-act" data-dc-del-chat="' + esc(id) + '" title="Remove">' + X_SVG + '</button>' +
      '</span>';
  }

  let _dcRowH = 0;
  function dcPerPage(){
    const box = document.getElementById('dcList');
    const h = (box && box.clientHeight) ? box.clientHeight : 0;
    if(!h) return 8;
    return Math.max(1, Math.floor(h / (_dcRowH || 34)));
  }
  function renderList(){
    const box = q('#dcList'); if(!box) return;
    const list = chats(), cur = activeChat();
    const per = dcPerPage();
    const pages = Math.max(1, Math.ceil(list.length / per));
    _dcPage = Math.max(0, Math.min(_dcPage, pages - 1));
    const from = _dcPage * per;
    box.innerHTML = list.slice(from, from + per).length
      ? list.slice(from, from + per).map(function(c){
          const title = c.title || (c.messages[0] ? c.messages[0].text : 'New chat');
          return '<div class="draft-row' + (cur && c.id === cur.id ? ' on' : '') + '" data-dc-open="' + esc(c.id) + '">' +
            '<span class="draft-row-title">' + esc(title.slice(0, 42)) + '</span>' + rowActions(c.id) + '</div>';
        }).join('')
      : '<div class="draft-empty">No chats yet</div>';
    if(!_dcRowH){ const r0 = box.querySelector('.draft-row'); if(r0) _dcRowH = r0.offsetHeight + 2; }
    const range = document.getElementById('dcRange');
    if(range) range.textContent = list.length ? ((from + 1) + '–' + Math.min(from + per, list.length)) : '0';
    const prev = document.querySelector('[data-dc-page="-1"]');
    const next = document.querySelector('[data-dc-page="1"]');
    if(prev) prev.disabled = _dcPage <= 0;
    if(next) next.disabled = _dcPage >= pages - 1;
  }

  function msgHtml(m, i){
    const acts = m.role === 'user'
      ? '<div class="dc-acts">' +
          '<button class="icon-btn-sm" data-dc-edit="' + i + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
          '<button class="icon-btn-sm" data-dc-del-msg="' + i + '" title="Delete">' + X_SVG + '</button>' +
        '</div>'
      : '<div class="dc-acts">' +
          '<button class="icon-btn-sm" data-dc-copy="' + i + '" title="Copy"><i class="bi bi-clipboard"></i></button>' +
          '<button class="icon-btn-sm" data-dc-regen="' + i + '" title="Regenerate"><i class="bi bi-arrow-clockwise"></i></button>' +
          '<button class="icon-btn-sm" data-dc-del-msg="' + i + '" title="Delete">' + X_SVG + '</button>' +
        '</div>';
    return '<div class="dc-msg dc-' + (m.role === 'user' ? 'me' : 'ai') + '" data-dc-msg="' + i + '">' +
      '<div class="dc-bubble">' + esc(m.text) + '</div>' + acts + '</div>';
  }

  function renderMsgs(){
    const box = q('#dcMsgs'); if(!box) return;
    const c = activeChat();
    box.innerHTML = (c && c.messages.length)
      ? c.messages.map(msgHtml).join('')
      : '<div class="dc-empty"><i class="bi bi-chat-square-text"></i>Start typing — the AI will help you draft.</div>';
    box.scrollTop = box.scrollHeight;
    const t = q('#dcTitle');
    if(t) t.textContent = (c && (c.title || (c.messages[0] && c.messages[0].text))) || 'New chat';
  }
  function renderAll(){
    renderList(); renderMsgs(); renderFiles();
    const inp = q('#dcInput'); if(inp) inp.disabled = !activeChat();
  }

  /* ── attachments ── */
    function pickFiles(){
    const inp = document.createElement('input');
    inp.type = 'file'; inp.multiple = true;
    inp.accept = '.txt,.md,.markdown,.json,.csv,.pdf,.epub,image/*';
    inp.onchange = async function(){
      const list = Array.prototype.slice.call(inp.files || []);
      for(const f of list){
        const isImg = (f.type || '').indexOf('image/') === 0;
        const a = { name:f.name, text:'', img:isImg, dataUrl:null, err:null };
        try{
          if(isImg){ a.dataUrl = await resizeImage(f); }
          else { a.text = (await extractText(f)).slice(0, 20000); }
        }catch(e){ a.err = e.message || 'failed'; }
        _files.push(a);
      }
      renderFiles();
      if(list.length) toast(list.length + ' file' + (list.length > 1 ? 's' : '') + ' attached');
    };
    inp.click();
  }
  function renderFiles(){
    const box = q('#dcFiles'); if(!box) return;
    box.innerHTML = _files.map(function(f, i){
      return '<span class="dc-file"><i class="bi bi-' + (f.img ? 'image' : 'file-earmark-text') + '"></i>' +
        esc(f.name) + (f.err ? ' <em style="color:var(--err)">failed</em>' : '') +
        '<button class="dc-file-x" data-dc-unfile="' + i + '" title="Remove">' + X_SVG + '</button></span>';
    }).join('');
    box.hidden = !_files.length;
  }

  function attachmentsBlock(){
    if(!_files.length) return '';
    const parts = _files.map(function(f){
      if(f.img) return '--- ' + f.name + ' --- (image attached — say if you cannot read it)';
      return '--- ' + f.name + ' ---\n' + String(f.text || '').slice(0, 6000);
    });
    return 'Attached files:\n' + parts.join('\n\n') + '\n\n';
  }

  /* ── voice ── */
  function micToggle(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ toast('Voice not supported in this browser', 'err'); return; }
    const inp = q('#dcInput'); if(!inp) return;
    if(_rec && _rec._on){ try{ _rec.stop(); }catch(e){} _rec._on = false; micPaint(false); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = false;
    const lang = dcCfg().lang;
    r.lang = (lang === 'hi' ? 'hi-IN' : 'en-US');
    r.onresult = function(e){
      let t = '';
      for(let i = e.resultIndex; i < e.results.length; i++){ if(e.results[i].isFinal) t += e.results[i][0].transcript; }
      if(t){ inp.value = (inp.value ? inp.value.replace(/\s*$/, '') + ' ' : '') + t.trim(); inp.dispatchEvent(new Event('input', { bubbles:true })); inp.focus(); }
    };
    r.onend = function(){ _rec._on = false; micPaint(false); };
    r.onerror = function(){ _rec._on = false; micPaint(false); };
    try{ r.start(); }catch(e){ toast('Microphone busy', 'warn'); return; }
    _rec = r; _rec._on = true; micPaint(true);
  }
  function micPaint(on){ const b = q('[data-dc="mic"]'); if(b) b.classList.toggle('on', !!on); }

  /* ── prompt ── */
  function currentDraftBody(){
    const b = document.getElementById('draftBody');
    const i = b ? parseInt(b.getAttribute('data-draft-body'), 10) : NaN;
    const list = D().drafts || [];
    return (Number.isInteger(i) && list[i]) ? (list[i].body || '') : '';
  }
  function compose(c){
    const cfg = dcCfg(), chars = charsFor();
    const who = cfg.persona === 'custom'
      ? (cfg.custom.trim() || 'a helpful writing partner')
      : (chars[cfg.persona] || chars.reader).text;
    const lang = (cfg.lang === 'auto')
      ? 'Reply in the same language the writer is using.'
      : ('Reply in ' + (DC_LANGS[cfg.lang] ? DC_LANGS[cfg.lang].label : cfg.lang) + '.');
    const sys = [
      'You are ' + who + '.',
      lang,
      (DC_LEVELS[cfg.level] || {}).text || '',
      (DC_TONES[cfg.tone] || {}).text || '',
      (DC_LENGTH[cfg.length] || {}).text || '',
      cfg.critique ? 'You may offer critique proactively.' : 'Do not criticise unless explicitly asked.',
      (cfg.persona !== 'custom' && cfg.custom.trim() ? 'Extra instructions: ' + cfg.custom.trim() : '')
    ].filter(Boolean).join(' ');
    const hist = c.messages.slice(-KEEP).map(m => (m.role === 'user' ? 'Writer: ' : 'Assistant: ') + m.text).join('\n');
    const body = currentDraftBody();
    return sys + '\n\n' + attachmentsBlock() +
      (body ? 'Current draft:\n"""\n' + body.slice(-2000) + '\n"""\n\n' : '') +
      'Conversation:\n' + hist + '\nAssistant:';
  }

  async function respond(c){
    const split = splitEl(); if(!split) return;
    const sendBtn = split.querySelector('[data-dc="send"]');
    const msgs = split.querySelector('#dcMsgs');
    if(sendBtn) sendBtn.disabled = true;
    const typing = document.createElement('div');
    typing.className = 'dc-msg dc-ai dc-typing';
    typing.textContent = 'Thinking…';
    if(msgs){ msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight; }
       try{
            const imgs = _files.filter(f => f.img && f.dataUrl).map(f => ({ name:f.name, dataUrl:f.dataUrl }));
      if(imgs.length && !isVision()) toast('Image skipped — ' + chatModelFor() + ' is text-only', 'warn');

      const reply = await chatCallAI(compose(c), imgs);
      _files.length = 0; renderFiles();

      typing.remove();
      c.messages.push({ role:'assistant', text:(reply || '').trim() });
    }catch(err){
      typing.remove();
      c.messages.push({ role:'assistant', text:'⚠ ' + ((err && err.message) || 'Request failed') });
    }
    if(sendBtn) sendBtn.disabled = false;
    renderAll(); persist();

  }
  function send(){
    const inp = q('#dcInput'); if(!inp) return;
    const text = (inp.value || '').trim();
    if(!text && !_files.length) return;
    let c = activeChat(); if(!c) c = newChat();
    c.messages.push({ role:'user', text: text || '(see attached files)' });
    if(!c.title) c.title = (text || _files[0].name || 'New chat').slice(0, 48);
    inp.value = ''; inp.style.height = 'auto';
    _files = []; renderFiles();
    renderList(); renderMsgs(); persist();
    respond(c);
  }

  function openChat(id){ const c = chats().find(x => x.id === id); if(!c) return; D().aiChatActive = c.id; saveSoon(); renderAll(); }
  function delChat(id){
    const list = chats(), i = list.findIndex(x => x.id === id);
    if(i < 0 || !confirm('Delete this chat?')) return;
    list.splice(i, 1);
    if(D().aiChatActive === id) D().aiChatActive = list[0] ? list[0].id : null;
    if(!list.length) newChat();
    saveSoon(); renderAll();
  }
  function delMsg(i){ const c = activeChat(); if(!c) return; c.messages.splice(i, 1); persist(); renderAll(); }
  function regen(i){ const c = activeChat(); if(!c || !c.messages[i]) return; c.messages = c.messages.slice(0, i); persist(); renderAll(); respond(c); }
  function editMsg(i){
    const c = activeChat(); if(!c || !c.messages[i] || c.messages[i].role !== 'user') return;
    const node = q('[data-dc-msg="' + i + '"] .dc-bubble'); if(!node) return;
    node.innerHTML = '<textarea class="dc-edit">' + esc(c.messages[i].text) + '</textarea>' +
      '<div class="dc-edit-acts">' +
        '<button class="icon-btn-sm" data-dc-edit-save="' + i + '" title="Save &amp; regenerate"><i class="bi bi-check-lg"></i></button>' +
        '<button class="icon-btn-sm" data-dc-edit-cancel="1" title="Cancel">' + X_SVG + '</button>' +
      '</div>';
    const ta = node.querySelector('.dc-edit');
    if(ta){ ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }
  function editSave(i){
    const c = activeChat(); const ta = q('[data-dc-msg="' + i + '"] .dc-edit'); if(!ta) return;
    const text = (ta.value || '').trim(); if(!text) return;
    c.messages[i].text = text; c.messages = c.messages.slice(0, i + 1);
    persist(); renderAll(); respond(c);
  }
  function renameStart(id){
    const row = q('.draft-row[data-dc-open="' + id + '"]'); if(!row) return;
    const c = chats().find(x => x.id === id); if(!c) return;
    const span = row.querySelector('.draft-row-title');
    span.outerHTML = '<input class="draft-row-title dc-rename" value="' + esc(c.title || '') + '" data-dc-rename-input="' + esc(id) + '" placeholder="Chat name">';
    const inp = row.querySelector('.dc-rename'); if(inp){ inp.focus(); inp.select(); }
  }
  function renameCommit(id, val){
    const c = chats().find(x => x.id === id); if(!c) return;
    c.title = (val || '').trim(); saveSoon(); renderList();
  }

  /* ── mount chat view ── */
    function mountSplit(root){
    let split = root.querySelector('.draft-split');
    if(!split){
      root.innerHTML = '';
      split = document.createElement('div');
      split.className = 'draft-split';
      root.appendChild(split);
    }
    split.setAttribute('data-dc', '1');

    split.innerHTML = chatMarkup();
    if(!chats().length) newChat();
    if(!activeChat()) newChat();
    renderAll();

    split.addEventListener('click', function(ev){
      const t = ev.target;
      if(t.closest('[data-dc="new"]')){ newChat(); renderAll(); const i = q('#dcInput'); if(i) i.focus(); return; }
      if(t.closest('[data-dc="settings"]')){ _dcSettings = true; rerender(); return; }
      if(t.closest('[data-dc="send"]')){ send(); return; }
      if(t.closest('[data-dc="attach"]')){ pickFiles(); return; }
      if(t.closest('[data-dc="mic"]')){ micToggle(); return; }

      const uf = t.closest('[data-dc-unfile]'); if(uf){ _files.splice(parseInt(uf.dataset.dcUnfile, 10), 1); renderFiles(); return; }
      const pg = t.closest('[data-dc-page]');   if(pg){ _dcPage = Math.max(0, _dcPage + (parseInt(pg.dataset.dcPage, 10) || 0)); renderList(); return; }

      const rn = t.closest('[data-dc-rename]');   if(rn){ ev.stopPropagation(); renameStart(rn.dataset.dcRename); return; }
      const dc = t.closest('[data-dc-del-chat]'); if(dc){ ev.stopPropagation(); delChat(dc.dataset.dcDelChat); return; }
      const op = t.closest('[data-dc-open]');     if(op){ openChat(op.dataset.dcOpen); return; }

      const ed = t.closest('[data-dc-edit]');      if(ed){ editMsg(parseInt(ed.dataset.dcEdit, 10)); return; }
      const es = t.closest('[data-dc-edit-save]'); if(es){ editSave(parseInt(es.dataset.dcEditSave, 10)); return; }
      if(t.closest('[data-dc-edit-cancel]')){ renderMsgs(); return; }
      const dm = t.closest('[data-dc-del-msg]');   if(dm){ delMsg(parseInt(dm.dataset.dcDelMsg, 10)); return; }
      const rg = t.closest('[data-dc-regen]');     if(rg){ regen(parseInt(rg.dataset.dcRegen, 10)); return; }
      const cp = t.closest('[data-dc-copy]');      if(cp){ const c = activeChat(); const m = c && c.messages[parseInt(cp.dataset.dcCopy, 10)]; if(m) navigator.clipboard.writeText(m.text).then(() => toast('Copied')); return; }
    });
    split.addEventListener('keydown', function(e){
      const ri = e.target.closest('[data-dc-rename-input]');
      if(ri && (e.key === 'Enter' || e.key === 'Escape')){
        e.preventDefault();
        const cur = (chats().find(c => c.id === ri.dataset.dcRenameInput) || {}).title || '';
        renameCommit(ri.dataset.dcRenameInput, e.key === 'Escape' ? cur : ri.value);
        return;
      }
      if(e.target.closest('#dcInput') && e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); }
    });
    split.addEventListener('change', function(e){
      const ri = e.target.closest('[data-dc-rename-input]'); if(ri) renameCommit(ri.dataset.dcRenameInput, ri.value);
    });
    split.addEventListener('input', function(e){
      const ta = e.target.closest('#dcInput');
      if(ta){ ta.style.height = 'auto'; ta.style.height = Math.min(150, ta.scrollHeight) + 'px'; }
    });
  }

  /* ── Chat AI settings — a split, same as the chat ── */
  let _dcSetSection = 'connection';
  function setSections(){
    return [
      { id:'connection', label:'Connection', icon:'cloud' },
      { id:'assistant',  label:'Assistant',  icon:'personality' },
      { id:'replies',    label:'Replies',    icon:'chat-left-text' }
    ];
  }
  function mountSettings(root){
    root.innerHTML = '';
    const split = document.createElement('div');
    split.className = 'draft-split';
    split.setAttribute('data-dc', '1');
    split.setAttribute('data-dcset', '1');
    split.innerHTML =
      '<aside class="draft-list">' +
        '<div class="draft-list-head">' +
          '<span class="draft-list-label">Chat AI</span>' +
          '<button class="icon-btn-sm" data-dc="back" title="Back to chat"><i class="bi bi-arrow-left"></i></button>' +
        '</div>' +
        '<div class="draft-rows" id="dcSetNav"></div>' +
      '</aside>' +
      '<section class="draft-pane">' +
        '<header class="draft-pane-head"><span class="dc-pane-title" id="dcSetTitle">Connection</span></header>' +
        '<div class="dc-set-body" id="dcSetBody"></div>' +
      '</section>';
    root.appendChild(split);
    renderSetNav();
    renderSetSection(root);
    split.addEventListener('click', function(ev){
      const t = ev.target;
      if(t.closest('[data-dc="back"]')){ _dcSettings = false; rerender(); return; }
      const nv = t.closest('[data-dc-sec]');
      if(nv){ _dcSetSection = nv.dataset.dcSec; renderSetNav(); renderSetSection(root); }
    });
  }
  function renderSetNav(){
    const box = document.getElementById('dcSetNav'); if(!box) return;
    box.innerHTML = setSections().map(s =>
      '<div class="draft-row' + (s.id === _dcSetSection ? ' on' : '') + '" data-dc-sec="' + s.id + '">' +
        '<span class="draft-row-title">' + s.label + '</span></div>').join('');
  }
  function renderSetSection(root){
    const body = document.getElementById('dcSetBody'); if(!body) return;
    const sec = setSections().find(s => s.id === _dcSetSection) || setSections()[0];
    const title = document.getElementById('dcSetTitle'); if(title) title.textContent = sec.label;
    body.innerHTML = '';
    if(_dcSetSection === 'connection') buildConnection(body, root);
    else if(_dcSetSection === 'assistant') buildAssistant(body);
    else buildReplies(body);
    if(typeof enhanceSelects === 'function') enhanceSelects(body);
  }

  function buildConnection(body, root){
    const cfg = dcCfg(), ai = chatCfg();
    const c0 = card('How you connect', 'cloud');
    const presets = document.createElement('div'); presets.className = 'dc-presets';
    [['free','Free API user','Free tiers — Groq, Gemini, OpenRouter…'],
     ['paid','Paid API user','Bring your own key — OpenAI, DeepSeek, xAI…'],
     ['local','Local AI','Ollama or LM Studio on your machine']].forEach(function(p){
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dc-preset' + (cfg.preset === p[0] ? ' on' : '');
      b.dataset.dcPreset = p[0];
      b.innerHTML = '<span class="dc-preset-name">' + p[1] + '</span><span class="dc-preset-sub">' + p[2] + '</span>';
      presets.appendChild(b);
    });
    c0.appendChild(presets);
    body.appendChild(c0);

    const prov = chatProvider();
    const c1 = card('Provider', 'cpu');
    const provSel = document.createElement('select'); provSel.className = 'sel'; provSel.style.minWidth = '240px';
    const byGroup = {};
    AI_PROVIDERS.forEach(p => { (byGroup[p.group] = byGroup[p.group] || []).push(p); });
    Object.keys(byGroup).forEach(function(g){
      const og = document.createElement('optgroup'); og.label = g;
      byGroup[g].forEach(function(p){
        const o = document.createElement('option'); o.value = p.id; o.textContent = p.name;
        if(p.id === ai.provider) o.selected = true; og.appendChild(o);
      });
      provSel.appendChild(og);
    });
    provSel.onchange = function(){ ai.provider = provSel.value; save(); renderSetSection(root); };
    c1.appendChild(row('Provider', 'Chat-only · free tiers, local, bring your own key', provSel));

    if(prov.keyless){
      const note = document.createElement('div'); note.className = 'tiny muted';
      note.textContent = 'No API key needed — this provider runs on your own machine.';
      c1.appendChild(note);
    } else {
      const inp = document.createElement('input'); inp.type = 'password'; inp.className = 'inp';
      inp.placeholder = prov.keyPh || ''; inp.value = ai.keys[prov.id] || ''; inp.style.minWidth = '220px';
      inp.oninput = function(){ ai.keys[prov.id] = inp.value.trim(); save(); };
      c1.appendChild(row(prov.keyLabel || 'API key', 'Stored for the chat only', inp));
    }
    const base = document.createElement('input'); base.type = 'text'; base.className = 'inp';
    base.style.minWidth = '220px'; base.placeholder = prov.base || 'https://your-endpoint/v1';
    base.value = ai.bases[prov.id] || '';
    base.oninput = function(){ ai.bases[prov.id] = base.value.trim(); save(); };
    c1.appendChild(row('Endpoint', prov.custom ? 'Required — OpenAI-compatible base URL' : 'Only for a proxy or self-hosted server', base));

    const modelSel = document.createElement('select'); modelSel.className = 'sel'; modelSel.style.minWidth = '200px';
    ((ai.available && ai.available[prov.id]) || prov.models || []).forEach(function(m){
      const o = document.createElement('option'); o.value = m.id; o.textContent = m.n || m.id;
      if(m.id === chatModelFor(prov.id)) o.selected = true; modelSel.appendChild(o);
    });
    modelSel.onchange = function(){ ai.models[prov.id] = modelSel.value; save(); };
    c1.appendChild(row('Model', 'Fetch to load models from your provider', modelSel));

    const acts = document.createElement('div'); acts.className = 'dc-set-acts';
    const fetchBtn = document.createElement('button'); fetchBtn.className = 'btn btn-ghost';
    fetchBtn.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Fetch models';
    fetchBtn.onclick = async function(){ await chatFetchModels(); renderSetSection(root); };
    const testBtn = document.createElement('button'); testBtn.className = 'btn btn-ghost';
    testBtn.innerHTML = '<i class="bi bi-plug"></i> Test connection';
    testBtn.onclick = function(){ chatTestConn(); };
    acts.appendChild(fetchBtn); acts.appendChild(testBtn);
    c1.appendChild(acts);
    body.appendChild(c1);

    body.addEventListener('click', function(ev){
      const pr = ev.target.closest('[data-dc-preset]'); if(!pr) return;
      cfg.preset = pr.dataset.dcPreset;
      ai.provider = DC_PRESET_PROVIDER[cfg.preset] || ai.provider;
      save(); renderSetSection(root);
    });
  }

  function buildAssistant(body){
    const cfg = dcCfg();
    const c = card('Assistant profile', 'personality');
    c.appendChild(selRow('Character', 'How the AI behaves in this mode', charsFor(), cfg.persona, 'persona'));
    c.appendChild(selRow('Experience level', 'How much jargon to use', DC_LEVELS, cfg.level, 'level'));
    c.appendChild(selRow('Tone', 'How it sounds', DC_TONES, cfg.tone, 'tone'));
    const crit = document.createElement('button');
    crit.type = 'button'; crit.className = 'tgl' + (cfg.critique ? ' on' : '');
    crit.onclick = function(){ cfg.critique = !cfg.critique; crit.classList.toggle('on', cfg.critique); save(); };
    c.appendChild(row('Critique behaviour', 'Off = listen first, critique only when asked', crit));
    const ta = document.createElement('textarea'); ta.className = 'inp dc-set-textarea';
    ta.rows = 2; ta.placeholder = 'With Character = Custom this text IS the AI; otherwise it is extra guidance.';
    ta.value = cfg.custom;
    ta.oninput = function(){ cfg.custom = ta.value; saveSoon(); };
    c.appendChild(row('Custom character / extra instructions', 'e.g. “a cynical noir editor who hates clichés”', ta));
    body.appendChild(c);
    body.addEventListener('change', function(ev){
      const el = ev.target.closest('[data-dc-set]'); if(!el) return;
      cfg[el.getAttribute('data-dc-set')] = el.value; save();
    });
  }

  function buildReplies(body){
    const cfg = dcCfg(), ai = chatCfg();
    const c = card('Replies', 'chat-left-text');
    c.appendChild(selRow('Reply language', 'The language the AI answers in', DC_LANGS, cfg.lang, 'lang'));
    c.appendChild(selRow('Reply length', 'Short · Medium · Long', DC_LENGTH, cfg.length, 'length'));
    const temp = document.createElement('input'); temp.type = 'range'; temp.className = 'rng'; temp.min = 0; temp.max = 100;
    temp.value = Math.round(ai.temperature * 100);
    const tempVal = document.createElement('span'); tempVal.className = 'tiny muted'; tempVal.textContent = temp.value + '%';
    temp.oninput = function(){ ai.temperature = temp.value / 100; tempVal.textContent = temp.value + '%'; save(); };
    const tw = document.createElement('span'); tw.style.display = 'flex'; tw.style.alignItems = 'center'; tw.style.gap = '8px';
    tw.appendChild(temp); tw.appendChild(tempVal);
    c.appendChild(row('Temperature', 'Lower is steadier, higher is more inventive', tw));
    const tok = document.createElement('input'); tok.type = 'number'; tok.className = 'inp'; tok.style.width = '90px';
    tok.value = ai.maxTokens;
    tok.oninput = function(){ ai.maxTokens = parseInt(tok.value, 10) || 1024; save(); };
    c.appendChild(row('Maximum reply tokens', 'Caps how long a single reply can be', tok));
    body.appendChild(c);
    body.addEventListener('change', function(ev){
      const el = ev.target.closest('[data-dc-set]'); if(!el) return;
      cfg[el.getAttribute('data-dc-set')] = el.value; save();
    });
  }


  function selRow(label, desc, map, cur, key){
    const sel = document.createElement('select'); sel.className = 'sel'; sel.style.minWidth = '180px';
    Object.keys(map).forEach(function(k){
      const o = document.createElement('option'); o.value = k; o.textContent = map[k].label;
      if(k === cur) o.selected = true; sel.appendChild(o);
    });
    sel.setAttribute('data-dc-set', key);
    return row(label, desc, sel);
  }

    /* ── page wiring ── */
  function draftRoot(){ return document.getElementById('page-draft'); }

  function rerender(){
    const root = draftRoot();
    if(root && window.PAGE_RENDERERS && PAGE_RENDERERS.draft) PAGE_RENDERERS.draft(root);
  }
  function mountInto(root){
    if(!root) return;
    if(_dcSettings){ mountSettings(root); return; }
    if(root.querySelector('[data-dc="1"]')) return;
    mountSplit(root);
  }
  function wrapDraftRenderer(){
    const cur = window.PAGE_RENDERERS && PAGE_RENDERERS.draft;
    if(!cur || cur.__dcWrapped) return;
    const base = cur;
    const wrapped = function(root){
      root.classList.toggle('dc-on', dcOn());
      base.call(this, root);
      if(dcOn()) mountInto(root);
    };
    wrapped.__dcWrapped = true;
    PAGE_RENDERERS.draft = wrapped;
  }
  wrapDraftRenderer();

  function setOn(on){
    _dcOpen = !!on;
    if(!on) _dcSettings = false;
    wrapDraftRenderer();
    if(_dcOpen) mountInto(draftRoot());
    else rerender();
  }

  /* right-click the FAB on Draft → this chat */
  let gestureAt = 0;
  function fabRight(e){
    if(typeof S === 'undefined') return;
    if(!(S.page === 'draft' || document.getElementById('draftBody'))) return;
    if(!(e.target && e.target.closest && e.target.closest('#fabBtn'))) return;
    if(e.type !== 'contextmenu' && e.button !== 2) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const ai = document.getElementById('fabAI');  if(ai) ai.hidden = true;
    const mn = document.getElementById('fabMenu'); if(mn) mn.hidden = true;
    const fw = document.getElementById('fabWrap'); if(fw) fw.classList.remove('menu-open');
    if(e.type === 'contextmenu'){
      const now = Date.now();
      if(now - gestureAt > 350){ gestureAt = now; setOn(!dcOn()); }
      [0, 60, 200].forEach(function(ms){
        setTimeout(function(){
          const a = document.getElementById('fabAI');  if(a) a.hidden = true;
          const m = document.getElementById('fabMenu'); if(m) m.hidden = true;
        }, ms);
      });
    }
  }
  ['pointerdown','mousedown','pointerup','mouseup','auxclick','contextmenu']
    .forEach(function(t){ window.addEventListener(t, fabRight, true); });

  window.DraftChat = { open: () => setOn(true), close: () => setOn(false), newChat, render: renderAll };
})();
