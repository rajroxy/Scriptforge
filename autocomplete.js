/* ═══════════════════════════════════════════════════════════
   ScriptForge — word autocomplete

   Settings → Autocomplete has carried a switch for this for a while
   (S.config.autocomplete), but nothing ever read it. This is the thing
   that reads it.

   WHERE IT WORKS — every surface the writer actually writes in:
     · the manuscript editor     #editor / .write-doc (contenteditable)
     · the draft editor          .editor-doc (contenteditable)
     · the script source pane    .fnt-src (textarea)

   WHAT IT SUGGESTS — the writer's own vocabulary first. Every word in the
   project (chapters, subchapters, drafts, the script source) is counted,
   so a character's name, a made-up place, a recurring verb comes back
   before anything generic; a small list of everyday words sits under it
   so the first sentence of a new project still completes.

   HOW IT BEHAVES
     · three letters starts it, and it only offers a word longer than what
       is typed — never a repeat of the word you already have
     · Tab or → takes the suggestion, Enter takes it too, Esc dismisses
     · typing keeps narrowing it; it never inserts on its own
     · off entirely when Settings → Autocomplete → Word suggestions is off
   ═══════════════════════════════════════════════════════════ */
(function(){
  const MIN = 3;              /* characters before anything is offered */
  const MAX_SUGGESTIONS = 3;

  /* Everyday words — the floor under the project's own vocabulary, so a
     brand-new project still completes on its first line. */
  const COMMON = ('the and you that was for are with his they this have from one had word what' +
    ' when your which their said each she there use how will other about out many then them these' +
    ' some her would make like him into time has look two more write see number way could people' +
    ' than first water been call who oil its now find long down day did get come made may part' +
    ' over new sound take only little work know place year live back give most very after thing' +
    ' our just name good sentence man think say great where help through much before line right' +
    ' too mean old any same tell boy follow came want show also around form three small set put' +
    ' end does another well large must big even such because turn here why ask went men read need' +
    ' land different home move try kind hand picture again change off play spell air away animal' +
    ' house point page letter mother answer found study still learn should world high every near' +
    ' add food between own below country plant last school father keep tree never start city earth' +
    ' eye light thought head under story saw left few while along might close something seem next' +
    ' hard open example begin life always those both paper together got group often run important' +
    ' until children side feet car mile night walk white sea began grow took river four carry state' +
    ' once book hear stop without second later miss idea enough eat face watch far really almost' +
    ' let above girl sometimes mountain cut young talk soon list song being leave family voice' +
    ' suddenly because though however perhaps already nothing everything someone somewhere' +
    ' against behind beside within between toward towards himself herself myself yourself' +
    ' looked turned walked asked wanted needed felt knew seen heard held stood sat kept left' +
    ' breath silence window street room door hand eyes face voice heart morning evening night').split(' ');

  const cfg = function(){
    try{ return !(typeof S !== 'undefined' && S.config && S.config.autocomplete === false); }
    catch(e){ return true; }
  };

  /* ── the dictionary ─────────────────────────────────────────── */
  const DICT = { sig:'', map:null };

  const projectText = function(){
    const out = [];
    const d = (typeof D === 'function') ? D() : null;
    const take = function(list){
      if(!Array.isArray(list)) return;
      list.forEach(function(x){
        if(!x || typeof x !== 'object') return;
        if(typeof x.content === 'string') out.push(x.content);
        if(typeof x.text   === 'string') out.push(x.text);
        if(typeof x.title  === 'string') out.push(x.title);
        if(typeof x.value  === 'string') out.push(x.value);
        if(typeof x.note    === 'string') out.push(x.note);
        if(Array.isArray(x.children)) take(x.children);
        if(Array.isArray(x.cards)) take(x.cards);
      });
    };
    if(d){
      ['chapters','drafts','ideas','notes','beats','references','cast','timeline','versions'].forEach(function(k){ take(d[k]); });
      if(d.bible && typeof d.bible === 'object'){
        Object.keys(d.bible).forEach(function(k){ take(d.bible[k]); });
      }
    }
    /* the script source is the writer's text too */
    Array.prototype.forEach.call(document.querySelectorAll('.fnt-src'), function(ta){
      if(ta.value) out.push(ta.value);
    });
    return out.join('\n');
  };

  const build = function(){
    const text = projectText();
    /* a cheap signature: the project's identity plus how much there is.
       Rebuilding only when the writing has grown by ~2k keeps the read of
       a long book off the keystroke path. */
    let who = '';
    try{ who = (typeof S !== 'undefined' && S.mode) + ':' + String((D() || {}).currentProject || ''); }catch(e){}
    const sig = who + ':' + Math.floor(text.length / 2000);
    if(DICT.map && DICT.sig === sig) return DICT.map;

    const map = new Map();
    COMMON.forEach(function(w){ map.set(w, 1); });
    const words = text.toLowerCase().match(/[a-z][a-z'\u2019-]{1,}/g) || [];
    for(let i = 0; i < words.length; i++){
      const w = words[i].replace(/[\u2019']/g, '');
      if(w.length < 3 || w.length > 24) continue;
      map.set(w, (map.get(w) || 0) + 8);
    }
    DICT.sig = sig;
    DICT.map = map;
    return map;
  };

  /* ── the popup ──────────────────────────────────────────────── */
  let box = null;
  const el = function(){
    if(box) return box;
    box = document.createElement('div');
    box.className = 'sf-complete';
    box.id = 'sfComplete';
    box.hidden = true;
    document.body.appendChild(box);
    return box;
  };

  let items = [];
  let active = -1;
  let target = null;        /* the surface the popup is answering */
  let wordAt = null;        /* { start, end, word } */

  const hide = function(){
    if(box){ box.hidden = true; }
    items = [];
    active = -1;
    target = null;
    wordAt = null;
  };

  const surface = function(node){
    if(!node || !node.closest) return null;
    const el2 = node.nodeType === 3 ? node.parentNode : node;
    return (el2 && el2.closest) ? el2.closest('#editor, .write-doc, .editor-doc, .fnt-src') : null;
  };

  const isField = function(s){ return !!s && s.tagName === 'TEXTAREA'; };

  /* the word being typed, right before the caret */
  const wordBefore = function(s){
    if(isField(s)){
      const i = s.selectionStart;
      if(i == null || s.selectionEnd !== i) return null;
      const before = s.value.slice(0, i);
      const m = /[A-Za-z][A-Za-z'\u2019-]*$/.exec(before);
      if(!m) return null;
      return { start: i - m[0].length, end: i, word: m[0] };
    }
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if(node.nodeType !== 3) return null;
    const before = node.textContent.slice(0, range.startOffset);
    const m = /[A-Za-z][A-Za-z'\u2019-]*$/.exec(before);
    if(!m) return null;
    return { start: range.startOffset - m[0].length, end: range.startOffset, word: m[0], node: node };
  };

  const candidates = function(word){
    const map = build();
    const key = word.toLowerCase();
    const out = [];
    map.forEach(function(count, w){
      if(w.length <= key.length) return;
      if(w.lastIndexOf(key, 0) !== 0) return;
      out.push({ w: w, n: count });
    });
    out.sort(function(a, b){ return (b.n - a.n) || (a.w.length - b.w.length) || (a.w < b.w ? -1 : 1); });
    return out.slice(0, MAX_SUGGESTIONS);
  };

  /* where to put the popup: the caret's own pixel spot */
  const caretRect = function(s){
    if(isField(s)){
      /* the textarea caret has no rect, so a mirror of the field's own
         metrics is measured at the caret — the standard trick, and the
         only one that follows a wrapped line */
      const cs = window.getComputedStyle(s);
      const mirror = document.createElement('div');
      const st = mirror.style;
      ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','textTransform',
       'wordSpacing','lineHeight','paddingTop','paddingRight','paddingBottom','paddingLeft',
       'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing'].forEach(function(k){
        st[k] = cs[k];
      });
      st.position = 'absolute';
      st.visibility = 'hidden';
      st.whiteSpace = 'pre-wrap';
      st.wordWrap = 'break-word';
      st.width = s.clientWidth + 'px';
      st.top = '0'; st.left = '0';
      mirror.textContent = s.value.slice(0, s.selectionStart);
      const mark = document.createElement('span');
      mark.textContent = '\u200b';
      mirror.appendChild(mark);
      document.body.appendChild(mirror);
      const r = s.getBoundingClientRect();
      const x = r.left + mark.offsetLeft - s.scrollLeft;
      const y = r.top + mark.offsetTop - s.scrollTop;
      const h = parseFloat(cs.lineHeight) || 18;
      mirror.remove();
      return { left: x, top: y + h, bottom: y + h };
    }
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount) return null;
    const rects = sel.getRangeAt(0).getClientRects();
    const r = rects.length ? rects[rects.length - 1] : sel.getRangeAt(0).getBoundingClientRect();
    if(!r || (!r.left && !r.top)) return null;
    return { left: r.left, top: r.bottom, bottom: r.bottom };
  };

  const paint = function(){
    const b = el();
    b.innerHTML = items.map(function(it, i){
      return '<button type="button" class="sf-complete-item' + (i === active ? ' on' : '') + '" data-sf-comp="' + i + '">'
        + '<b>' + escHtml(it.label) + '</b>'
        + '<span>' + escHtml(it.w) + '</span></button>';
    }).join('');
  };

  const escHtml = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const show = function(s, wordAtNow){
    const list = candidates(wordAtNow.word);
    if(!list.length){ hide(); return; }
    const typed = wordAtNow.word;
    const upper = typed[0] === typed[0].toUpperCase() && typed[0] !== typed[0].toLowerCase();
    items = list.map(function(c){
      const rest = c.w.slice(typed.length);
      const label = typed + rest + '\u200b';
      return { w: c.w, rest: rest, label: label, insert: upper ? rest.charAt(0).toUpperCase() + rest.slice(1) : rest,
               cap: upper ? (c.w.charAt(0).toUpperCase() + c.w.slice(1)) : c.w };
    });
    active = 0;
    wordAt = wordAtNow;
    target = s;
    paint();

    const b = el();
    const at = caretRect(s);
    if(!at){ hide(); return; }
    b.hidden = false;
    const w = b.offsetWidth, h = b.offsetHeight;
    let left = at.left, top = at.top + 6;
    if(left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if(top + h > window.innerHeight - 8) top = Math.max(8, (at.top || at.bottom) - h - (at.bottom - at.top) - 6);
    b.style.left = Math.round(left) + 'px';
    b.style.top  = Math.round(top) + 'px';
  };

  const accept = function(i){
    if(!target || !wordAt) return;
    const it = items[i];
    if(!it) return;
    const s = target;
    const rest = it.insert;
    hide();

    if(isField(s)){
      const end = s.selectionStart;
      try{
        s.setRangeText(rest, end, end, 'end');
        s.dispatchEvent(new Event('input', { bubbles:true }));
      }catch(e){}
    }else{
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount) return;
      let ok = false;
      try{ ok = document.execCommand('insertText', false, rest); }catch(e){ ok = false; }
      if(!ok && wordAt.node && wordAt.node.parentNode){
        const node = wordAt.node;
        const range = document.createRange();
        range.setStart(node, Math.max(0, Math.min(node.textContent.length, wordAt.end)));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        const text = node.textContent;
        node.textContent = text.slice(0, wordAt.end) + rest + text.slice(wordAt.end);
        const r2 = document.createRange();
        const pos = wordAt.end + rest.length;
        r2.setStart(node, Math.min(node.textContent.length, pos));
        r2.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r2);
      }
      try{ if(typeof onInput === 'function') onInput(); }catch(e){}
    }
  };

  /* ── events ─────────────────────────────────────────────────── */

  /* a suggestion must never re-open the instant it was taken */
  let justAccepted = false;

  document.addEventListener('input', function(e){
    const s = surface(e.target);
    if(!s || !cfg()){ hide(); return; }
    if(justAccepted){ justAccepted = false; hide(); return; }
    const info = wordBefore(s);
    if(!info || info.word.length < MIN){ hide(); return; }
    /* never offer what is already there, character for character */
    const list = candidates(info.word);
    if(!list.length){ hide(); return; }
    show(s, info);
  }, true);

  /* Registered on WINDOW, in the capture phase: the capture path runs
     window → document → …, so this sees Tab and Enter BEFORE the editor's
     own document-level handlers. That is what stops Tab from inserting
     four spaces and then accepting on the same press. */
  window.addEventListener('keydown', function(e){
    if(!box || box.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); hide(); return; }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); e.stopPropagation();
      active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      paint();
      return;
    }
    if(e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowRight'){
      const it = items[active];
      if(!it) return;
      /* only take the caret keys when there is something to accept */
      e.preventDefault(); e.stopPropagation();
      justAccepted = true;
      setTimeout(function(){ justAccepted = false; }, 0);
      accept(active);
    }
  }, true);

  document.addEventListener('click', function(e){
    const it = e.target.closest && e.target.closest('[data-sf-comp]');
    if(it){
      e.preventDefault(); e.stopPropagation();
      justAccepted = true;
      accept(parseInt(it.dataset.sfComp, 10) || 0);
      return;
    }
    if(!(e.target.closest && e.target.closest('#sfComplete'))) hide();
  }, true);

  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  document.addEventListener('blur', hide, true);
})();
