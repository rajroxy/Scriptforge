/* ═══════════════════════════════════════════════════════════
   ScriptForge — the script page, written the Fountain way

   In a SCRIPT mode (screenplay / tv / stage) the writing page becomes
   a Fountain editor:

     left  · the Fountain source — plain text, exactly like a Fountain
             file you could hand to any other app
     right · the formatted script page, rendered by the app's own
             screenplay styles

   The app's real editor ( #editor ) is not replaced — it becomes the
   preview. So saving, word counts, find & replace, the AI menu, the
   exports and the autosave all keep working on the same DOM node they
   always did; only the way you type into it changes.

   NOVEL IS NOT TOUCHED: in novel mode nothing here runs.

   Fountain, in one breath:
     INT./EXT. LOCATION - DAY     a scene heading (a line starting with .)
     A line of action
     MAYA                         a character (a line in CAPS, or @Maya)
     (a beat)                     a parenthetical
     What she says.               dialogue
     CUT TO:                      a transition (or  >Cut to:)
     **bold**  *italic*  _underline_
     <a line in angle brackets>   is dropped as a note
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined') return;

  /* the app has one scripted mode: Screenplay. TV, stage and comic were
     formats it no longer offers, so the script page no longer answers to
     their ids. */
  const SCRIPT_MODES = ['screenplay'];
  const isScript = function(){
    try{ return SCRIPT_MODES.indexOf(S.mode) >= 0; }catch(e){ return false; }
  };
  const esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  const plain = function(html){
    const d = document.createElement('div');
    d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, ' ');
    return String(d.textContent || '').replace(/\s+/g, ' ').trim();
  };

  /* ═══ FOUNTAIN → HTML ═══ */
  const inline = function(s){
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(/_([^_]+)_/g, '<u>$1</u>');
  };

  const toHtml = function(text){
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let prev = '';
    let inDialogue = false;

    const put = function(type, s){
      out.push('<p class="' + type + '">' + (inline(s) || '<br>') + '</p>');
    };

    for(let i = 0; i < lines.length; i++){
      const s = lines[i].trim();

      if(!s){ prev = ''; inDialogue = false; continue; }          /* a block ends on a blank line */
      if(/^\[\[/.test(s)) continue;                                 /* [[note]] */
      if(/^={2,}/.test(s) || /^#{1,6}\s/.test(s)) continue;         /* section / synopsis */
      if(/^<.*>$/.test(s)) continue;                                /* a note in angle brackets */

      if(/^>/.test(s)){ put('transition', s.replace(/^>\s?/, '')); prev = 'transition'; inDialogue = false; continue; }
      if(/^\.(?![.\s])/.test(s)){ put('scene-heading', s.replace(/^\.\s?/, '')); prev = 'scene-heading'; inDialogue = false; continue; }
      if(/^@/.test(s)){ put('character-name', s.replace(/^@\s?/, '')); prev = 'character-name'; inDialogue = true; continue; }
      if(/^!/.test(s)){ put('action', s.replace(/^!\s?/, '')); prev = 'action'; inDialogue = false; continue; }
      if(/^~/.test(s)){ put('action', s.replace(/^~\s?/, '')); prev = 'action'; inDialogue = false; continue; }

      if(/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(s)){ put('scene-heading', s); prev = 'scene-heading'; inDialogue = false; continue; }
      if(/\bTO:\s*$/.test(s) && s === s.toUpperCase()){ put('transition', s); prev = 'transition'; inDialogue = false; continue; }

      if(/^\(.*\)$/.test(s) && (prev === 'character-name' || prev === 'dialogue' || prev === 'parenthetical')){
        put('parenthetical', s); prev = 'parenthetical'; inDialogue = true; continue;
      }

      const caps = s === s.toUpperCase() && /[A-Z]/.test(s) && s.length <= 45;
      if(caps && !inDialogue){ put('character-name', s); prev = 'character-name'; inDialogue = true; continue; }

      if(inDialogue){ put('dialogue', s); prev = 'dialogue'; continue; }

      put('action', s); prev = 'action';
    }
    return out.join('');
  };

  /* ═══ HTML → FOUNTAIN ═══ */
  const TYPE_OF = /\b(scene-heading|action|character-name|parenthetical|dialogue|transition)\b/;

  const toFountain = function(html){
    const box = document.createElement('div');
    box.innerHTML = String(html || '');
    const out = [];

    Array.prototype.slice.call(box.children).forEach(function(el){
      const tag = el.tagName;
      let text = el.innerHTML
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|h1|h2|h3|blockquote)>/gi, ' ');
      text = text
        .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
        .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
        .replace(/<u>([\s\S]*?)<\/u>/gi, '_$1_')
        .replace(/<[^>]+>/g, '');
      text = plain(text);
      if(!text) return;

      const m = (el.className || '').match(TYPE_OF);
      const type = (tag === 'P' && m) ? m[1] : 'action';

      if(type === 'scene-heading'){
        text = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(text) ? text.toUpperCase() : '.' + text;
      }else if(type === 'transition'){
        text = /\bTO:\s*$/i.test(text) ? text.toUpperCase() : '>' + text;
      }else if(type === 'character-name'){
        if(text !== text.toUpperCase()) text = '@' + text;
      }
      out.push(text, '');
    });

    return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
  };

  /* ═══ the page ═══ */
  let timer = 0;

  const currentChapter = function(){
    try{ return (typeof curCh === 'function') ? curCh() : null; }catch(e){ return null; }
  };

  /* the page that is actually on screen — an older render of the writing
     page may still sit in the DOM, and it must not be written to */
  const pageRoot = function(){
    const all = document.querySelectorAll('#page-manuscript, #page-write, #page-chapters');
    for(let i = 0; i < all.length; i++){
      if(all[i].classList.contains('active')) return all[i];
    }
    return null;
  };

  /* ═══ THE TITLE PAGE ═══

     Fountain's own front matter — Title / Credit / Author / Source /
     Draft date / Contact. It lives on the chapter, is drawn above the
     formatted script, and Copy / Export write it out as front matter so
     the .fountain file is complete. The source pane stays pure body
     text: the title page is never typed into it and never leaks into it.
     ═══════════════════════════════════════════════════════════ */
  const TITLE_FIELDS = [
    ['title',     'Title'],
    ['credit',    'Credit'],
    ['author',    'Author'],
    ['source',    'Source'],
    ['draftDate', 'Draft date'],
    ['contact',   'Contact']
  ];

  const titleData = function(){
    let t = null;
    try{ const c = currentChapter(); t = c && c.fntTitle; }catch(e){ t = null; }
    const out = {};
    TITLE_FIELDS.forEach(function(f){
      out[f[0]] = (t && typeof t[f[0]] === 'string') ? t[f[0]] : '';
    });
    return out;
  };

  const titleHas = function(t){
    return TITLE_FIELDS.some(function(f){ return String(t[f[0]] || '').trim(); });
  };

  /* the very same block, as Fountain front matter */
  const titleFountain = function(t){
    const lines = TITLE_FIELDS
      .filter(function(f){ return String(t[f[0]] || '').trim(); })
      .map(function(f){ return f[1] + ': ' + String(t[f[0]]).trim(); });
    return lines.length ? lines.join('\n') + '\n\n' : '';
  };

  const paintTitle = function(){
    const root = pageRoot();
    const pane = root && root.querySelector('.fnt-prev-pane');
    const ed = root && root.querySelector('#editor');
    if(!pane || !ed) return;
    let box = pane.querySelector('.fnt-titlepage');
    if(!box){
      box = document.createElement('div');
      box.className = 'fnt-titlepage';
      box.hidden = true;
      if(pane.contains(ed)) pane.insertBefore(box, ed); else pane.appendChild(box);
    }
    const t = titleData();
    if(!titleHas(t)){ box.hidden = true; box.innerHTML = ''; return; }
    const meta = [t.draftDate, t.contact]
      .filter(function(x){ return String(x || '').trim(); })
      .join('\n');
    box.innerHTML =
        '<div class="fnt-tp-title">' + esc(t.title || 'Untitled') + '</div>'
      + (t.credit ? '<div class="fnt-tp-credit">' + esc(t.credit) + '</div>' : '')
      + (t.author ? '<div class="fnt-tp-author">' + esc(t.author) + '</div>' : '')
      + (t.source ? '<div class="fnt-tp-source">' + esc(t.source) + '</div>' : '')
      + (meta ? '<div class="fnt-tp-meta">' + esc(meta) + '</div>' : '');
    box.hidden = false;
  };

  /* ═══ import a Fountain file, or print the script ═══ */
  const importScript = function(ta){
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.fountain,.txt,text/plain';
    inp.onchange = function(){
      const f = inp.files && inp.files[0];
      if(!f) return;
      const fr = new FileReader();
      fr.onload = function(){
        ta.value = String(fr.result == null ? '' : fr.result).replace(/\r\n?/g, '\n');
        sync();
        paintTitle();
        if(typeof save === 'function') save();
        if(typeof toast === 'function') toast('Imported ' + f.name);
      };
      fr.onerror = function(){
        if(typeof toast === 'function') toast('Could not read that file', 'warn');
      };
      fr.readAsText(f);
    };
    inp.click();
  };

  /* the browser's own print dialog — “Save as PDF” lives in it */
  const printScript = function(){
    setTimeout(function(){
      try{
        if(typeof window.print !== 'function') throw new Error('no print');
        window.print();
      }catch(e){
        if(typeof toast === 'function') toast('Printing is not available in this window', 'warn');
      }
    }, 120);
  };

  const install = function(root){
    if(!isScript() || !root) return;
    const canvas = root.querySelector('.write-canvas');
    const ed = root.querySelector('#editor');
    if(!canvas || !ed) return;

    /* one pair of panes, however often the page re-renders */
    if(!canvas.querySelector('.fnt-wrap')){
      const wrap = document.createElement('div');
      wrap.className = 'fnt-wrap';

      const srcPane = document.createElement('div');
      srcPane.className = 'fnt-pane fnt-src-pane';
      const ta = document.createElement('textarea');
      ta.className = 'fnt-src';
      ta.spellcheck = true;
      ta.setAttribute('wrap', 'off');
      ta.placeholder = 'INT. COFFEE SHOP - DAY\n\nThe rain has not stopped for a week.\n\nMAYA\n(a beat)\nYou kept the receipt.\n\nCUT TO:';
      srcPane.appendChild(ta);

      const prevPane = document.createElement('div');
      prevPane.className = 'fnt-pane fnt-prev-pane';
      const hint = document.createElement('div');
      hint.className = 'fnt-hint';
      hint.innerHTML = '<i class="bi bi-film"></i> Fountain — <b>INT./EXT.</b> scene · <b>CAPS</b> character · <b>(beat)</b> · dialogue · <b>CUT TO:</b>';
      prevPane.appendChild(hint);
      prevPane.appendChild(ed);

      wrap.appendChild(srcPane);
      wrap.appendChild(prevPane);
      canvas.appendChild(wrap);

      ed.setAttribute('contenteditable', 'false');
      ed.setAttribute('spellcheck', 'false');
      ed.classList.add('fnt-doc');

      /* the rich-text toolbar has nothing to do here */
      const tb = root.querySelector('.write-toolbar');
      if(tb) tb.style.display = 'none';

      /* typing in the source, parsed into the page below it */
      ta.addEventListener('input', function(){
        if(timer) clearTimeout(timer);
        timer = setTimeout(function(){ timer = 0; sync(); }, 220);
      }, true);
      ta.addEventListener('blur', function(){ if(timer){ clearTimeout(timer); timer = 0; } sync(); }, true);

      /* Enter on a caps line keeps the rhythm; Tab is four spaces */
      ta.addEventListener('keydown', function(e){
        /* the suggestion list owns the keys while it is open */
        if(window.SF_SUGGEST && SF_SUGGEST.open()) return;
        if(e.key === 'Tab'){
          /* Tab cycles the screenplay element of the line you are on —
             Action → Character → Parenthetical → Transition → Heading.
             Shift+Tab still indents, which a script needs for nothing
             else but the odd note. */
          e.preventDefault();
          if(e.shiftKey){
            const at = ta.selectionStart;
            ta.value = ta.value.slice(0, at) + '    ' + ta.value.slice(ta.selectionEnd);
            ta.selectionStart = ta.selectionEnd = at + 4;
            if(timer) clearTimeout(timer);
            timer = setTimeout(function(){ timer = 0; sync(); }, 220);
            return;
          }
          cycleElement(ta);
          return;
        }
        if(e.key === 'Enter' && !e.shiftKey){
          const before = ta.value.slice(0, ta.selectionStart);
          const line = before.slice(before.lastIndexOf('\n') + 1).trim();
          /* a scene heading or a character is always followed by a blank line */
          if(/^(INT|EXT|EST|I\/E)/i.test(line) || (line && line === line.toUpperCase() && /[A-Z]/.test(line) && line.length <= 45)){
            e.preventDefault();
            const at = ta.selectionStart;
            ta.value = ta.value.slice(0, at) + '\n\n' + ta.value.slice(ta.selectionEnd);
            ta.selectionStart = ta.selectionEnd = at + 2;
            if(timer) clearTimeout(timer);
            timer = setTimeout(function(){ timer = 0; sync(); }, 120);
          }
        }
      }, true);
    }

    load();
  };

  const sync = function(){
    const root = pageRoot();
    const ta = root && root.querySelector('.fnt-src');
    const ed = root && root.querySelector('#editor');
    if(!ta || !ed) return;

    const html = toHtml(ta.value);
    if(ed.innerHTML !== html) ed.innerHTML = html;
    paintTitle();

    const c = currentChapter();
    if(c) c.content = ed.innerHTML;
    try{ if(typeof onInput === 'function') onInput(); }catch(e){}
  };

  const load = function(){
    const root = pageRoot();
    if(!root || !root.classList.contains('active')) return;
    const ta = root.querySelector('.fnt-src');
    if(!ta) return;
    const c = currentChapter();
    const text = c ? toFountain(c.content) : '';
    if(ta.value !== text) ta.value = text;
    const ed = root.querySelector('#editor');
    if(ed && c) ed.innerHTML = c.content || '';
    paintTitle();
  };

  window.SF_FOUNTAIN = { toHtml: toHtml, toFountain: toFountain, sync: sync, load: load };

  /* install after every render of the writing pages */
  ['manuscript', 'write'].forEach(function(id){
    if(typeof PAGE_RENDERERS[id] !== 'function') return;
    const orig = PAGE_RENDERERS[id];
    PAGE_RENDERERS[id] = function(root){
      const r = orig.call(this, root);
      try{ install(root); }catch(e){ console.warn('fountain page failed:', e); }
      return r;
    };
  });

  /* switching chapter (or mode) reloads the source */
  if(typeof window.renderChapterControls === 'function'){
    const rc = window.renderChapterControls;
    window.renderChapterControls = function(){
      const r = rc.apply(this, arguments);
      setTimeout(function(){ try{ load(); }catch(e){} }, 0);
      return r;
    };
  }

  /* mode switches (Novel ⇄ Screenplay) repaint the page; load then too */
  document.addEventListener('click', function(e){
    if(!e.target || !e.target.closest) return;
    if(e.target.closest('[data-mode], .mode-pill, .modes-panel')) setTimeout(function(){ try{ load(); }catch(e){} }, 60);
  }, true);

  /* ═══════════════════════════════════════════════════════════
     THE SCRIPT BAR + FOUNTAIN AUTOCOMPLETE

     Under the source: how many scenes, characters, pages (in eighths,
     as a script is counted) and words — plus a Scenes menu to jump
     from heading to heading, and suggestions that offer a scene
     heading, a character name, a transition or a parenthetical as you
     type. Tab or Enter takes the offer, Esc drops it.
     ═══════════════════════════════════════════════════════════ */

  const HEADS = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i;
  const isHeading = s => HEADS.test(s) || /^\.[^\s]/.test(s);
  const isTransition = s => /^>/.test(s) || (/\bTO:\s*$/i.test(s) && s === s.toUpperCase());
  const isCharacter = function(s){
    const t = String(s || '').trim();
    if(/^@/.test(t)) return true;
    if(isHeading(t) || isTransition(t)) return false;
    if(!/^[A-Z][A-Z0-9 .'\-]{0,44}$/.test(t)) return false;
    return t === t.toUpperCase() && /[A-Z]/.test(t) && t.length <= 45;
  };

  /* A cue the way a writer actually types one.

     isCharacter() answers "is this line already a cue", which is what the
     formatter needs — it is all caps by definition there. The page's own
     tools need the other question: "is this line about to be a cue". A
     writer types `maya` as often as `MAYA`, and a page that only knew the
     second would call the scene silent, leave the name uncapped, and
     report a cast of one. So: caps, or a short name on its own line that
     is not a sentence, with speech (or a parenthetical) under it. */
  const cueish = function(s){
    const t = String(s || '').trim();
    if(!t || t.length > 45) return false;
    if(isHeading(t) || isTransition(t)) return false;
    if(/^\(.*\)$/.test(t)) return false;
    if(/[.!?;:,]$/.test(t)) return false;
    if(isCharacter(t)) return true;
    if(!/^[\p{L}\p{M}][\p{L}\p{M}'\- ]*$/u.test(t)) return false;
    const w = t.split(/\s+/);
    if(w.length === 1) return t.length >= 2;
    /* two or more words only count when each one is capitalised — that is
       the difference between `Maya Smith` and `He waits` */
    return w.length <= 4 && w.every(function(x){ return /^[A-Z@]/.test(x); });
  };
  /* a line that is a cue and has something to say under it */
  const isCueLine = function(s, next){
    if(!cueish(s)) return false;
    const n = String(next || '').trim();
    return !!n && !isHeading(n) && !isTransition(n);
  };

  const TIMES = ['DAY','NIGHT','DAWN','DUSK','MORNING','EVENING','CONTINUOUS','LATER'];
  const TRANSITIONS = ['CUT TO:','SMASH CUT TO:','DISSOLVE TO:','MATCH CUT TO:',
                       'FADE IN:','FADE OUT.','INTERCUT WITH:','HARD CUT TO:','BACK TO:'];
  const PLACES_FALLBACK = ['COFFEE SHOP','OFFICE','STREET','APARTMENT','CAR','KITCHEN',
                           'BEDROOM','PARK','ROOFTOP','HOSPITAL','SCHOOL','BAR'];
  const BEATS = ['(beat)',"(cont'd)",'(O.S.)','(V.O.)','(whispering)','(pause)','(to herself)','(laughing)'];

  const scriptStats = function(text){
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const heads = [], chars = [];
    let words = 0;
    lines.forEach(function(raw, i){
      const s = raw.trim();
      if(!s) return;
      words += s.split(/\s+/).length;
      if(isHeading(s)){ heads.push({ line:i, title: s.replace(/^\.\s?/, '') }); return; }
      if(isCharacter(s)){
        const n = s.replace(/^@\s?/, '').trim();
        if(n && chars.indexOf(n) < 0) chars.push(n);
      }
    });
    const n = lines.length;
    return {
      heads: heads, chars: chars, words: words,
      pages: Math.floor(n / 55),
      eighths: Math.round((n % 55) / 55 * 8)
    };
  };

  const bibleNames = function(key, fallback){
    const out = [];
    try{
      const d = (typeof D === 'function') ? D() : null;
      const b = (d && d.bible) || {};
      (b[key] || []).forEach(function(x){
        const n = String((x && (x.name || x.title)) || '').trim().toUpperCase();
        if(n && out.indexOf(n) < 0) out.push(n);
      });
    }catch(e){}
    if(!out.length && fallback) fallback.forEach(function(f){ if(out.indexOf(f) < 0) out.push(f); });
    return out;
  };

  /* the caret's pixel spot inside the textarea, mirroring its styles */
  const caretPoint = function(ta){
    const cs = window.getComputedStyle(ta);
    const mirror = document.createElement('div');
    ['fontFamily','fontSize','fontWeight','letterSpacing','lineHeight',
     'paddingTop','paddingRight','paddingBottom','paddingLeft','borderWidth',
     'boxSizing','textIndent','whiteSpace','wordWrap','overflowWrap','tabSize'].forEach(function(k){
      try{ mirror.style[k] = cs[k]; }catch(e){}
    });
    mirror.style.cssText += ';position:absolute;top:0;left:0;visibility:hidden;'
      + 'width:' + ta.clientWidth + 'px;white-space:pre-wrap;overflow:hidden;';
    mirror.textContent = ta.value.slice(0, ta.selectionStart);
    const mark = document.createElement('span');
    mark.textContent = '\u200b|';
    mirror.appendChild(mark);
    document.body.appendChild(mirror);
    const x = mark.offsetLeft, y = mark.offsetTop;
    mirror.remove();
    const lh = parseFloat(cs.lineHeight) || 20;
    return { x: x, y: y + lh - ta.scrollTop + 4 };
  };

  const autoOn = function(){ return S.config.fntAuto !== false; };
  const numbersOn = function(){ return S.config.fntNumbers === true; };
  const projectName = function(){
    try{
      const d = D();
      const p = (d.projects || []).filter(function(x){ return x.id === d.currentProject; })[0];
      return (p && p.name) || 'script';
    }catch(e){ return 'script'; }
  };

  const syncSwitch = function(btn, on){ if(btn) btn.classList.toggle('on', !!on); };

  /* the scene numbers are drawn by the stylesheet's counters, so switching
     them on never touches the text that gets saved */
  const paintNumbers = function(){
    const root = pageRoot();
    const ed = root && root.querySelector('#editor');
    if(ed) ed.classList.toggle('fnt-numbers', numbersOn());
  };

  /* ═══ Tab cycles the line's screenplay element ═══
     Action → Character → Parenthetical → Transition → Scene heading →
     back to Action. The line is rewritten in place and nothing else in
     the script moves, which is how every script editor's Tab behaves. */
  const ELEMENTS = ['action', 'character', 'parenthetical', 'transition', 'heading'];

  const stripMarks = function(s){
    return String(s == null ? '' : s).trim()
      .replace(/^[@>]\s*/, '')
      .replace(/^\.(?=\S)/, '')
      .replace(/^\((.*)\)$/s, '$1')
      .trim();
  };

  const asElement = function(kind, text){
    const t = stripMarks(text);
    if(kind === 'character'){
      const up = (t || 'CHARACTER').toUpperCase();
      return /^[A-Z][A-Z0-9 .'\-]{0,44}$/.test(up) ? up : '@' + (t || 'Character');
    }
    if(kind === 'parenthetical') return '(' + (t || 'beat') + ')';
    if(kind === 'transition'){
      const up = (t || 'CUT').toUpperCase();
      return '>' + (/[:.]$/.test(up) ? up : up + ' TO:');
    }
    if(kind === 'heading'){
      const up = (t || 'INT. LOCATION - DAY').toUpperCase();
      return /^(INT|EXT|EST|I\/E|INT\.\/EXT)[\.\s]/.test(up) ? up : 'INT. ' + up;
    }
    return t;                                   /* action */
  };

  const cycleElement = function(ta){
    const at = ta.selectionStart;
    const ls = ta.value.lastIndexOf('\n', Math.max(0, at - 1)) + 1;
    let le = ta.value.indexOf('\n', at);
    if(le < 0) le = ta.value.length;
    const line = ta.value.slice(ls, le);
    const tr = line.trim();

    let cur = 'action';
    if(isHeading(tr)) cur = 'heading';
    else if(isTransition(tr)) cur = 'transition';
    else if(/^\(.*\)$/.test(tr)) cur = 'parenthetical';
    else if(isCharacter(tr)) cur = 'character';

    const next = ELEMENTS[(ELEMENTS.indexOf(cur) + 1) % ELEMENTS.length];
    const out = asElement(next, tr);
    ta.value = ta.value.slice(0, ls) + out + ta.value.slice(le);
    ta.selectionStart = ta.selectionEnd = ls + out.length;
    if(timer){ clearTimeout(timer); timer = 0; }
    sync();
    if(typeof toast === 'function') toast('Element: ' + next);
  };

  /* ═══ the cast report — who speaks, and how much ═══ */
  const castReport = function(text){
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const map = {}, order = [];
    let who = null;
    lines.forEach(function(raw){
      const s = raw.trim();
      if(!s){ who = null; return; }
      if(isHeading(s) || isTransition(s)){ who = null; return; }
      if(isCharacter(s)){
        const n = s.replace(/^@\s?/, '').replace(/\(.*\)\s*$/, '').trim().toUpperCase();
        who = n;
        if(n && !map[n]){ map[n] = { name:n, speeches:0, words:0 }; order.push(n); }
        return;
      }
      if(/^\(.*\)$/.test(s)) return;              /* a beat is not a line */
      if(who && map[who]){
        map[who].speeches++;
        map[who].words += s.split(/\s+/).length;
      }
    });
    return order.map(function(k){ return map[k]; })
                .sort(function(a, b){ return b.speeches - a.speeches; });
  };

  /* ═══ copy the script, and save it as a .fountain file ═══ */
  function fallbackCopy(text){
    try{
      const t = document.createElement('textarea');
      t.value = String(text || '');
      t.setAttribute('readonly', 'readonly');
      t.style.position = 'fixed';
      t.style.top = '-1000px';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    }catch(e){ return false; }
  }

  const copyScript = function(text){
    /* the title page goes with it — a script without its title page is
       an incomplete script */
    const body = titleFountain(titleData()) + String(text || '');
    const ok = function(){
      if(typeof toast === 'function') toast('Script copied as Fountain text');
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(body).then(ok, function(){
        if(fallbackCopy(body)) ok();
        else if(typeof toast === 'function') toast('Could not copy', 'warn');
      });
      return;
    }
    if(fallbackCopy(body)) ok();
    else if(typeof toast === 'function') toast('Could not copy', 'warn');
  };

  const exportScript = async function(text){
    const name = projectName().replace(/[^a-z0-9\-_ ]/gi, '_') + '.fountain';
    const body = titleFountain(titleData())
      + (String(text || '').trim() ? String(text) : 'INT. LOCATION - DAY\n\n');
    try{
      if(window.FS && typeof FS.saveFile === 'function'){
        const res = await FS.saveFile(name, body, 'text/plain', {});
        if(res && res.ok){
          if(typeof toast === 'function') toast(res.download ? 'Downloaded ' + name : 'Saved ' + (res.path || name));
          return;
        }
        if(res && res.error && res.error !== 'cancelled'){
          if(typeof toast === 'function') toast('Export failed: ' + res.error, 'err');
        }
        return;                                   /* cancelled: say nothing */
      }
    }catch(e){}
    try{
      const url = URL.createObjectURL(new Blob([body], { type:'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
      if(typeof toast === 'function') toast('Exported ' + name);
    }catch(e){
      if(typeof toast === 'function') toast('Could not export the script', 'warn');
    }
  };

  /* ═══ the top bar — the SAME bar every other page wears ═══

     New scene, the scene list, the cast report, scene numbers, the
     suggestion switch, the counts and the export all live on one row,
     exactly like the bars on Outline, Plan, Bible, Kanban and Canvas.
     The suggestion list still hangs off the source pane, since it has
     to sit under the caret. */
  const mount = function(){
    /* the class is what makes the page a column (polish.css). It must never
       outlive the page being on screen in script mode, or a hidden page
       would keep painting on top of whatever is really on screen. */
    Array.prototype.forEach.call(document.querySelectorAll('.sf-script-page'), function(el){
      if(!isScript() || !el.classList.contains('active')) el.classList.remove('sf-script-page');
    });
    const root = pageRoot();
    if(!root || !root.classList.contains('active')) return;
    const pane = root.querySelector('.fnt-src-pane');
    const ta = pane && pane.querySelector('.fnt-src');
    if(!pane || !ta) return;
    if(root.querySelector('[data-fnt-tools]')) return;

    pane.style.position = 'relative';
    root.classList.add('sf-script-page');

    const bar = document.createElement('div');
    bar.className = 'sf-bar fnt-bar';
    bar.setAttribute('data-fnt-tools', '1');
    bar.innerHTML =
        '<button type="button" class="ol-btn" data-fnt-new-scene title="Start a new scene here — a heading on its own lines, with the place and time offered as you type"><i class="bi bi-plus-lg"></i> New scene</button>'
      + '<button type="button" class="ol-btn" data-fnt-jump title="Jump to a scene"><i class="bi bi-list-ol"></i> Scenes</button>'
      + '<button type="button" class="ol-btn" data-fnt-cast title="Every character, and how much they speak"><i class="bi bi-people"></i> Characters</button>'
      + '<span class="fnt-sp"></span>'
      + '<span class="fnt-st"><i class="bi bi-film"></i><b data-fnt-scenes>0</b> scenes</span>'
      + '<span class="fnt-st"><i class="bi bi-people"></i><b data-fnt-chars>0</b> characters</span>'
      + '<span class="fnt-st"><i class="bi bi-file-earmark-text"></i><b data-fnt-pages>0</b> pages</span>'
      + '<span class="fnt-st"><i class="bi bi-stopwatch"></i><b data-fnt-time>0 min</b></span>'
      + '<span class="fnt-st"><i class="bi bi-type"></i><b data-fnt-words>0</b> words</span>'
      + '<button type="button" class="ol-btn" data-fnt-copy title="Copy the whole script as Fountain text"><i class="bi bi-clipboard"></i> Copy</button>'
      + '<button type="button" class="ol-btn" data-fnt-export title="Save the script as a .fountain file"><i class="bi bi-download"></i> Export</button>'
      + '<button type="button" class="ol-btn ol-btn-icon" data-fnt-more title="More script tools"><i class="bi bi-three-dots"></i></button>';
    const wrap = root.querySelector('.write-wrap') || root;
    if(wrap.parentElement === root) root.insertBefore(bar, wrap);
    else root.insertBefore(bar, root.firstChild);

    const jump = document.createElement('div');
    jump.className = 'fnt-jump';
    jump.hidden = true;
    bar.appendChild(jump);

    const cast = document.createElement('div');
    cast.className = 'fnt-jump fnt-cast';
    cast.hidden = true;
    bar.appendChild(cast);

    /* the title page's fields — the same panel the Scenes list uses */
    const title = document.createElement('div');
    title.className = 'fnt-jump fnt-title';
    title.hidden = true;
    title.innerHTML = TITLE_FIELDS.map(function(f){
        return '<div class="fnt-title-row"><label for="fnt-t-' + f[0] + '">' + f[1] + '</label>'
             + '<input id="fnt-t-' + f[0] + '" data-tf="' + f[0] + '" type="text" spellcheck="false"></div>';
      }).join('')
      + '<div class="fnt-title-acts">'
      + '<button type="button" class="ol-btn" data-fnt-title-done><i class="bi bi-check2"></i> Done</button>'
      + '<button type="button" class="ol-btn" data-fnt-title-clear><i class="bi bi-eraser"></i> Clear</button>'
      + '</div>';
    bar.appendChild(title);

    /* the read-through report — its own panel, on the same row */
    const check = document.createElement('div');
    check.className = 'fnt-jump fnt-check';
    check.hidden = true;
    bar.appendChild(check);

    /* Check and Tidy are wired here rather than with the other buttons
       below, so the whole bar stays one file region to read. */
    bar.addEventListener('click', function(e){
      const b = e.target.closest && e.target.closest('[data-fnt-check],[data-fnt-tidy]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      if(b.hasAttribute('data-fnt-tidy')){ tidyScript(); return; }
      const opening = check.hidden;
      paintCheck();
      closePanels(opening ? check : null);
    });

    /* the elements a script is made of, in the order Tab cycles them */
    const INSERT_ELEMENTS = [
      { kind:'scene',      label:'Scene heading',  keys:'⌘1', text:'INT. LOCATION - DAY' },
      { kind:'action',     label:'Action',         keys:'⌘2', text:'' },
      { kind:'character',  label:'Character',      keys:'⌘3', text:'CHARACTER' },
      { kind:'paren',      label:'Parenthetical',  keys:'⌘4', text:'(beat)' },
      { kind:'dialogue',   label:'Dialogue',       keys:'⌘5', text:'' },
      { kind:'transition', label:'Transition',     keys:'⌘6', text:'CUT TO:' },
      { kind:'fadein',     label:'FADE IN:',       keys:'',   text:'FADE IN:' },
      { kind:'fadeout',    label:'FADE OUT.',      keys:'',   text:'FADE OUT.' }
    ];

    const ins = document.createElement('div');
    ins.className = 'fnt-jump fnt-insert';
    ins.hidden = true;
    ins.innerHTML = INSERT_ELEMENTS.map(function(e){
        return '<button type="button" class="fnt-jump-i" data-fnt-ins="' + e.kind + '">'
          + '<span>' + e.keys + '</span>' + e.label + '</button>';
      }).join('');
    bar.appendChild(ins);

    /* find + replace, in the source itself */
    const find = document.createElement('div');
    find.className = 'fnt-jump fnt-title fnt-find';      find.hidden = true;
      more.hidden = true;
    find.innerHTML =
        '<div class="fnt-title-row"><label for="fnt-find">Find</label><input id="fnt-find" data-fnt-find type="text" spellcheck="false" placeholder="a word or a phrase"></div>'
      + '<div class="fnt-title-row"><label for="fnt-rep">Replace</label><input id="fnt-rep" data-fnt-rep type="text" spellcheck="false" placeholder="leave empty to delete"></div>'
      + '<div class="fnt-title-acts">'
      + '<button type="button" class="ol-btn" data-fnt-find-count><i class="bi bi-search"></i> Count</button>'
      + '<button type="button" class="ol-btn" data-fnt-find-all><i class="bi bi-arrow-repeat"></i> Replace all</button>'
      + '</div>';
    bar.appendChild(find);

    /* ── ⋯ — everything a script needs sometimes, and never mid-sentence ──
       THREE TOOLS, THE COUNTS, AND TWO BUTTONS: New scene · Scenes ·
       Characters, then the script's counts, Copy and Export. Everything
       else that used to crowd the bar — the insert list (which the writer
       opens with ⇧@ as they type), scene numbers, the heading suggestions,
       Find & replace, the title page, Check, Tidy, Import and Print — is
       here, one click behind ⋯. Their handlers are unchanged, so each one
       still works exactly as it did. */
    const more = document.createElement('div');
    more.className = 'fnt-jump fnt-more';
    more.hidden = true;
    more.innerHTML =
        '<button type="button" class="fnt-jump-i" data-fnt-insert><span><i class="bi bi-textarea-t"></i></span>Insert an element<em>⇧@</em></button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-numbers><span><i class="bi bi-123"></i></span>Scene numbers<em>on/off</em></button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-auto><span><i class="bi bi-magic"></i></span>Suggest as I type<em>on/off</em></button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-find-open><span><i class="bi bi-search"></i></span>Find &amp; replace</button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-title><span><i class="bi bi-card-heading"></i></span>Title page</button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-check><span><i class="bi bi-clipboard-check"></i></span>Check the script</button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-tidy><span><i class="bi bi-brush"></i></span>Tidy the formatting</button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-import><span><i class="bi bi-upload"></i></span>Import a file</button>'
      + '<button type="button" class="fnt-jump-i" data-fnt-print><span><i class="bi bi-printer"></i></span>Print / save as PDF</button>';
    bar.appendChild(more);

    /* the overflow's own button, opened like every other panel in the bar */
    bar.querySelector('[data-fnt-more]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = more.hidden;
      closePanels(opening ? more : null);
    });

    /* one block at the caret, on its own lines, with the part worth typing
       over selected — the same shape New scene uses */
    const insertBlock = function(text, selFrom, selTo){
      const at = ta.selectionStart;
      const before = ta.value.slice(0, at);
      const pad = (before === '' || /\n\s*$/.test(before)) ? '' : '\n\n';
      const body = text || '';
      ta.value = before + pad + body + ta.value.slice(ta.selectionEnd);
      const start = before.length + pad.length;
      ta.selectionStart = start + (selFrom == null ? body.length : selFrom);
      ta.selectionEnd   = start + (selTo   == null ? body.length : selTo);
      try{ ta.focus(); }catch(err){}
      if(timer){ clearTimeout(timer); timer = 0; }
      sync();
      if(typeof save === 'function') save();
    };

    const elementText = function(kind){
      const one = INSERT_ELEMENTS.filter(function(e){ return e.kind === kind; })[0];
      return one ? one.text : '';
    };

    const replaceAllInScript = function(needle, replacement, silent){
      const text = String(needle == null ? '' : needle);
      if(!text) return 0;
      const re = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const hits = (ta.value.match(re) || []).length;
      if(hits && !silent){
        ta.value = ta.value.replace(re, String(replacement == null ? '' : replacement));
        if(timer){ clearTimeout(timer); timer = 0; }
        sync();
        if(typeof save === 'function') save();
      }
      return hits;
    };

    const titleInputs = function(){ return title.querySelectorAll('[data-tf]'); };
    const fillTitlePanel = function(){
      const t = titleData();
      Array.prototype.forEach.call(titleInputs(), function(inp){
        inp.value = t[inp.getAttribute('data-tf')] || '';
      });
    };
    let titleTimer = 0;
    const writeTitle = function(){
      const c = currentChapter();
      if(c){
        const t = {};
        Array.prototype.forEach.call(titleInputs(), function(inp){
          t[inp.getAttribute('data-tf')] = String(inp.value || '').trim();
        });
        c.fntTitle = t;
      }
      paintTitle();
      if(titleTimer) clearTimeout(titleTimer);
      titleTimer = setTimeout(function(){
        titleTimer = 0;
        if(typeof save === 'function') save();
      }, 500);
    };
    title.addEventListener('input', function(e){
      if(!e.target.closest || !e.target.closest('[data-tf]')) return;
      writeTitle();
    }, true);
    title.addEventListener('keydown', function(e){
      if(e.key !== 'Enter') return;
      e.preventDefault();
      writeTitle();
    }, true);

    const sug = document.createElement('div');
    sug.className = 'fnt-sug';
    sug.hidden = true;
    pane.appendChild(sug);

    let items = [], active = 0, from = 0, to = 0;
    const closeSug = function(){ items = []; active = 0; sug.hidden = true; };
    const openSug = function(list, f, t){
      items = list; active = 0; from = f; to = t;
      sug.innerHTML = list.map(function(s, i){
        return '<button type="button" class="fnt-sug-i' + (i ? '' : ' on') + '" data-i="' + i + '">' + esc(s) + '</button>';
      }).join('');
      const p = caretPoint(ta);
      sug.style.left = Math.max(0, Math.min(p.x, pane.clientWidth - 220)) + 'px';
      sug.style.top  = Math.max(0, p.y) + 'px';
      sug.hidden = false;
    };
    window.SF_SUGGEST = { open: function(){ return !!(sug && !sug.hidden && items.length); } };

    const accept = function(i){
      const pick = items[i];
      if(pick == null) return false;
      ta.value = ta.value.slice(0, from) + pick + ta.value.slice(to);
      const at = from + pick.length;
      ta.selectionStart = ta.selectionEnd = at;
      closeSug();
      if(timer){ clearTimeout(timer); timer = 0; }
      sync();
      return true;
    };

    const suggest = function(){
      if(!autoOn()) return closeSug();
      const caret = ta.selectionStart;
      const before = ta.value.slice(0, caret);
      const ls = before.lastIndexOf('\n') + 1;
      const line = before.slice(ls);
      const up = line.toUpperCase();
      const trimmed = up.replace(/^[\s.]+/, '');
      const word = (line.match(/[@\p{L}\p{M}][\p{L}\p{M}'\-]*$/u) || [''])[0];
      const wu = word.toUpperCase().replace(/^@/, '');
      let list = [], f = ls, t = caret;

      /* 1 · a scene heading — offer a place and a time */
      if(/^(\.|I|IN|INT|E|EX|EXT|EST|I\/E)/.test(trimmed) && up === up.toUpperCase()
         && !/^INTERCUT/.test(trimmed) && !/\bTO:/.test(trimmed) && trimmed.length <= 30){
        const typedPlace = trimmed.replace(/^(INT|EXT|EST|I\/E|INT\.\/EXT)\.?\s*/, '').replace(/\s*-\s*.*$/, '');
        const ext = !/^I/.test(trimmed);
        const kind = ext ? 'EXT. ' : 'INT. ';
        const pool = bibleNames('locations').concat(PLACES_FALLBACK);
        const hits = pool.filter(function(pl){
          return !typedPlace || pl.indexOf(typedPlace) === 0 || typedPlace.indexOf(pl) === 0;
        }).slice(0, 3);
        if(!hits.length && typedPlace) hits.push(typedPlace);
        hits.forEach(function(pl){
          TIMES.slice(0, 3).forEach(function(tm){ list.push(kind + pl + ' - ' + tm); });
        });
        if(list.length) return openSug(list.slice(0, 7), ls, caret);
      }

      /* 2 · a character name */
      if(wu.length >= 2 && (/^@/.test(line) || /^[A-Z][A-Z0-9@'\- ]{0,44}$/.test(line))){
        const names = bibleNames('characters').concat(
          scriptStats(ta.value).chars.map(function(c){ return c.toUpperCase(); }));
        const hits = [];
        names.forEach(function(n){ if(n.indexOf(wu) === 0 && n !== wu && hits.indexOf(n) < 0) hits.push(n); });
        if(hits.length){
          const single = line.trim().replace(/^@/, '') === word.replace(/^@/, '');
          return openSug(hits.slice(0, 6), single ? ls : ls + line.lastIndexOf(word), caret);
        }
      }

      /* 3 · a transition */
      if(/^[A-Z][A-Z .]{0,15}$/.test(trimmed) && trimmed.length >= 2){
        const hits = TRANSITIONS.filter(function(x){ return x.indexOf(trimmed) === 0 && x !== trimmed; });
        if(hits.length) return openSug(hits.slice(0, 5), ls, caret);
      }

      /* 4 · a parenthetical */
      if(/^\(/.test(line)){
        const hits = BEATS.filter(function(x){ return x.indexOf(line) === 0 && x !== line; });
        if(hits.length) return openSug(hits.slice(0, 5), ls, caret);
      }

      closeSug();
    };

    const paintStats = function(){
      const st = scriptStats(ta.value);
      const put = function(sel, v){ const el = bar.querySelector(sel); if(el) el.textContent = v; };
      put('[data-fnt-scenes]', st.heads.length);
      put('[data-fnt-chars]', st.chars.length);
      put('[data-fnt-pages]', st.pages + (st.eighths ? ' ' + st.eighths + '/8' : ''));
      put('[data-fnt-words]', st.words.toLocaleString());
      /* a script is counted in minutes as well as pages — an eighth of a page
         is an eighth of a minute, and a page is a minute */
      const mins = st.pages + st.eighths / 8;
      put('[data-fnt-time]', (st.words ? Math.max(1, Math.round(mins)) : 0) + ' min');
      return st;
    };

    const paintJump = function(){
      const st = paintStats();
      if(!st.heads.length){
        jump.innerHTML = '<div class="fnt-jump-empty">No scene headings yet — start a line with <b>INT.</b> or <b>EXT.</b></div>';
        return;
      }
      /* each scene carries how much is in it — a scene list that says how
         long each scene runs is the one a writer actually rewrites by */
      const lines = ta.value.split('\n');
      jump.innerHTML = st.heads.map(function(h, i){
        const nextAt = (i + 1 < st.heads.length) ? st.heads[i + 1].line : lines.length;
        let words = 0;
        for(let n = h.line + 1; n < nextAt; n++){
          const s = String(lines[n] || '').trim();
          if(s) words += s.split(/\s+/).length;
        }
        const pages = Math.max(1, Math.round(words / 180 * 10) / 10);
        return '<button type="button" class="fnt-jump-i" data-line="' + h.line + '">'
          + '<span>' + String(i + 1).padStart(2, '0') + '</span>' + esc(h.title)
          + '<em>' + (words ? words.toLocaleString() + ' words · ' + pages + ' pp' : 'empty') + '</em></button>';
      }).join('');
      Array.prototype.forEach.call(jump.querySelectorAll('[data-line]'), function(b){
        b.addEventListener('click', function(){
          const line = parseInt(b.dataset.line, 10) || 0;
          const lines = ta.value.split('\n');
          let at = 0;
          for(let i = 0; i < line && i < lines.length; i++) at += lines[i].length + 1;
          ta.focus();
          ta.selectionStart = ta.selectionEnd = Math.min(at, ta.value.length);
          const cs = window.getComputedStyle(ta);
          ta.scrollTop = Math.max(0, (line - 3) * (parseFloat(cs.lineHeight) || 20));
          jump.hidden = true;
        });
      });
    };

    const paintCast = function(){
      const rows = castReport(ta.value);
      if(!rows.length){
        cast.innerHTML = '<div class="fnt-jump-empty">Nobody speaks yet — write a name in caps on its own line, then the line under it.</div>';
        return;
      }
      cast.innerHTML = rows.map(function(c){
        return '<div class="fnt-cast-row" data-fnt-cast-go="' + esc(c.name) + '">'
          + '<span class="fnt-cast-name">' + esc(c.name) + '</span>'
          + '<span class="fnt-cast-meta">' + c.speeches + (c.speeches === 1 ? ' speech' : ' speeches')
          + ' · ' + c.words.toLocaleString() + ' words</span>'
          + '</div>';
      }).join('');
      /* clicking a name jumps to that character's first line */
      Array.prototype.forEach.call(cast.querySelectorAll('[data-fnt-cast-go]'), function(row){
        row.addEventListener('click', function(){
          const name = row.getAttribute('data-fnt-cast-go');
          const lines = ta.value.split('\n');
          const at = lines.findIndex(function(l){
            const s = l.trim();
            return isCharacter(s) && s.replace(/^@\s?/, '').toUpperCase().indexOf(name) === 0;
          });
          if(at < 0) return;
          let pos = 0;
          for(let i = 0; i < at; i++) pos += lines[i].length + 1;
          ta.focus();
          ta.selectionStart = ta.selectionEnd = Math.min(pos, ta.value.length);
          const cs = window.getComputedStyle(ta);
          ta.scrollTop = Math.max(0, (at - 3) * (parseFloat(cs.lineHeight) || 20));
          cast.hidden = true;
        });
      });
    };

    /* jump the caret to a source line and bring it into view */
    const goToLine = function(line){
      const lines = ta.value.split('\n');
      let at = 0;
      for(let i = 0; i < line && i < lines.length; i++) at += lines[i].length + 1;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = Math.min(at, ta.value.length);
      const cs = window.getComputedStyle(ta);
      ta.scrollTop = Math.max(0, (line - 3) * (parseFloat(cs.lineHeight) || 20));
    };

    /* ═══ the read-through report ═══

       A script is not read like prose: what matters is where the reader
       stops. This walks the page the way a script editor does — every
       scene gets a slug with a time of day, every scene earns its keep,
       no speech runs longer than a take, no cue is invented twice — and
       every finding carries the source line, so the row jumps there. */
    const paintCheck = function(){
      const lines = ta.value.replace(/\r\n?/g, '\n').split('\n');
      const st = scriptStats(ta.value);
      const voices = castReport(ta.value);
      const issues = [];
      const add = function(line, sev, text, detail){
        issues.push({ line: line, sev: sev, text: text, detail: detail || '' });
      };

      /* the slugs, and what each scene holds */
      const scenes = st.heads.map(function(h, i){
        return { line: h.line, title: h.title, end: (i + 1 < st.heads.length ? st.heads[i + 1].line : lines.length) };
      });

      scenes.forEach(function(sc, i){
        const slug = String(sc.title || '').trim();
        /* a slug with no " - TIME" is a slug a director has to guess at */
        if(!/\s-\s*\S/.test(slug)) add(sc.line, 2, 'No time of day', 'add " - DAY" or " - NIGHT"');
        if(/[a-z]/.test(slug.replace(/^\.[^\s]*\s?/, ''))){
          add(sc.line, 1, 'Heading not in caps', 'Tidy will cap it');
        }
        let cues = 0, words = 0, spoken = 0, who = null;
        for(let n = sc.line + 1; n < sc.end; n++){
          const s = String(lines[n] || '').trim();
          if(!s){ who = null; continue; }
          words += s.split(/\s+/).length;
          if(isHeading(s) || isTransition(s)){ who = null; continue; }
          if(cueish(s)){
            cues++;
            if(s !== s.toUpperCase()) add(n, 1, 'Cue not in caps: ' + s, 'Tidy will cap it');
            who = s.replace(/^@\s?/, '');
            continue;
          }
          if(/^\(.*\)$/.test(s)) continue;
          if(who) spoken += s.split(/\s+/).length;
        }
        if(scenes.length > 2 && !spoken){
          add(sc.line, 3, 'Scene ' + (i + 1) + ' has no dialogue', words + (words === 1 ? ' word' : ' words') + ' — a beat with nobody speaking');
        }
        if(words && words < 40){
          add(sc.line, 1, 'Scene ' + (i + 1) + ' is under five seconds', words + ' words');
        }
        const prev = scenes[i - 1];
        if(prev && String(prev.title || '').trim().toUpperCase() === slug.toUpperCase()){
          add(sc.line, 2, 'Same slug twice in a row', 'the reader will assume the scene never changed');
        }
      });

      /* action walls, speeches that would not read in one take, and
         commas of action smuggled into a parenthetical */
      let who = null, speech = 0, speechAt = 0, block = 0, blockAt = 0;
      const closeSpeech = function(){
        if(speech > 8) add(speechAt, 2, 'A speech of ' + speech + ' lines', 'unplayable in one take — break it on a beat');
        speech = 0;
      };
      const closeBlock = function(){
        if(block > 8) add(blockAt, 2, 'A block of ' + block + ' lines of action', 'a wall of text — the page wants air');
        block = 0;
      };
      lines.forEach(function(raw, i){
        const s = raw.trim();
        if(!s){ closeSpeech(); closeBlock(); who = null; return; }
        if(isHeading(s) || isTransition(s)){ closeSpeech(); closeBlock(); who = null; return; }
        if(isCharacter(s)){ closeSpeech(); closeBlock(); who = s; return; }
        if(/^\(.*\)$/.test(s)){
          if(s.length > 48) add(i, 1, 'A long parenthetical', 'over 48 characters — that\'s action, not an aside');
          return;
        }
        if(who){ speech++; if(speech === 1) speechAt = i; closeBlock(); return; }
        block++; if(block === 1) blockAt = i;
      });
      closeSpeech(); closeBlock();

      /* who speaks, and how little */
      voices.forEach(function(c){
        if(c.speeches === 1 && voices.length > 1){
          add(-1, 0, c.name + ' speaks once', c.words + (c.words === 1 ? ' word' : ' words') + ' in the whole script');
        }
      });

      /* the runtime — the number a producer asks for first */
      const mins = st.pages + st.eighths / 8;
      /* an eighth of a page is a page, so a script shorter than one shows
         "3/8 pages" rather than "0 3/8" */
      const pageLabel = (st.pages ? st.pages + (st.eighths ? ' ' + st.eighths + '/8' : '') : st.eighths + '/8') + ' pages';
      const summary = st.heads.length
        ? st.heads.length + (st.heads.length === 1 ? ' scene' : ' scenes') + ' · ' + pageLabel + ' ≈ '
          + Math.max(1, Math.round(mins)) + ' min · ' + voices.length
          + (voices.length === 1 ? ' voice' : ' voices') + ' · ' + st.words.toLocaleString() + ' words'
        : 'No scene headings yet — start a line with INT. or EXT.';

      const weight = function(sev){ return sev >= 3 ? '!!' : (sev === 2 ? '!' : '·'); };
      const rows = issues.sort(function(a, b){ return b.sev - a.sev; });
      check.innerHTML =
          '<div class="fnt-cast-row"><span class="fnt-cast-name">Read-through</span>'
        + '<span class="fnt-cast-meta">' + esc(summary) + '</span></div>'
        + (rows.length
            ? rows.map(function(f){
                return '<button type="button" class="fnt-jump-i' + (f.line < 0 ? ' off' : '') + '"'
                  + (f.line < 0 ? ' disabled' : ' data-line="' + f.line + '"') + '>'
                  + '<span>' + weight(f.sev) + '</span>' + esc(f.text)
                  + (f.detail ? '<em>' + esc(f.detail) + '</em>' : '') + '</button>';
              }).join('')
            : '<div class="fnt-jump-empty">Nothing to catch — the slugs, the speeches and the scenes all read clean.</div>');

      Array.prototype.forEach.call(check.querySelectorAll('[data-line]'), function(b){
        b.addEventListener('click', function(){
          goToLine(parseInt(b.dataset.line, 10) || 0);
          check.hidden = true;
        });
      });
    };

    /* ═══ Tidy ═══

       The pass everybody does by hand before a read-through: headings and
       cues in caps, one blank line between elements, no trailing spaces.
       Only a character cue that is already a cue is capped, so a stray
       capitalised word in action is left alone. One undo step, because the
       edit goes through the field's own insert path. */
    const tidyScript = function(){
      const lines = ta.value.replace(/\r\n?/g, '\n').split('\n')
        .map(function(l){ return l.replace(/[ \t]+$/, ''); });
      const out = [];
      let caps = 0, cues = 0;
      for(let i = 0; i < lines.length; i++){
        const t = lines[i].trim();
        if(!t){
          if(out.length && out[out.length - 1] !== '') out.push('');
          continue;
        }
        const next = String(lines[i + 1] || '').trim();
        const blank = function(){ if(out.length && out[out.length - 1] !== '') out.push(''); };
        if(isHeading(t) && !isTransition(t)){
          const scene = t.toUpperCase();
          blank(); out.push(scene);
          if(scene !== t) caps++;
          continue;
        }
        if(isTransition(t)){
          const tr = t.toUpperCase();
          blank(); out.push(tr);
          if(tr !== t) caps++;
          continue;
        }
        /* a cue only counts when speech follows it — that is what makes a
           line a character and not just a shout in the middle of action */
        if(isCueLine(t, next)){
          const name = t.toUpperCase();
          blank(); out.push(name);
          if(name !== t) cues++;
          continue;
        }
        out.push(t);
      }
      while(out.length && out[out.length - 1] === '') out.pop();
      const next = out.join('\n');
      if(next === ta.value){
        if(typeof toast === 'function') toast('Already tidy');
        return;
      }
      /* going through execCommand keeps the field's own undo history, so
         Ctrl+Z puts the script back the way it was */
      let done = false;
      try{
        ta.focus();
        ta.selectionStart = 0;
        ta.selectionEnd = ta.value.length;
        done = document.execCommand && document.execCommand('insertText', false, next);
      }catch(e){ done = false; }
      if(!done){
        ta.value = next;
      }
      if(timer){ clearTimeout(timer); timer = 0; }
      sync();
      if(typeof save === 'function') save();
      const bits = [];
      if(caps) bits.push(caps + (caps === 1 ? ' heading' : ' headings') + ' capped');
      if(cues) bits.push(cues + (cues === 1 ? ' cue' : ' cues') + ' capped');
      if(typeof toast === 'function') toast('Tidied' + (bits.length ? ' — ' + bits.join(', ') : ''));
    };

    const closePanels = function(keep){
      jump.hidden = true;
      cast.hidden = true;
      title.hidden = true;
      check.hidden = true;
      ins.hidden = true;
      find.hidden = true;
      if(keep) keep.hidden = false;
    };

    bar.querySelector('[data-fnt-insert]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = ins.hidden;
      closePanels(opening ? ins : null);
    });
    ins.addEventListener('click', function(e){
      const b = e.target.closest('[data-fnt-ins]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      const kind = b.getAttribute('data-fnt-ins');
      const text = elementText(kind);
      ins.hidden = true;
      if(kind === 'character'){ insertBlock(text, 0, text.length); return; }
      if(kind === 'paren'){ insertBlock(text, 1, Math.max(1, text.length - 1)); return; }
      if(kind === 'scene'){ insertBlock(text, 5, text.length); return; }
      insertBlock(text);
    });
    bar.querySelector('[data-fnt-find-open]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = find.hidden;
      closePanels(opening ? find : null);
      if(opening){
        const first = find.querySelector('[data-fnt-find]');
        if(first) setTimeout(function(){ try{ first.focus(); }catch(err){} }, 30);
      }
    });
    find.addEventListener('click', function(e){
      const count = e.target.closest('[data-fnt-find-count]');
      const all = e.target.closest('[data-fnt-find-all]');
      if(!count && !all) return;
      e.preventDefault(); e.stopPropagation();
      const q = find.querySelector('[data-fnt-find]');
      const r = find.querySelector('[data-fnt-rep]');
      const needle = q ? q.value : '';
      if(!needle){ if(typeof toast === 'function') toast('Type what to find first', 'warn'); return; }
      if(count){
        const n = replaceAllInScript(needle, '', true);
        if(typeof toast === 'function') toast(n ? n + (n === 1 ? ' match' : ' matches') : 'No matches');
        return;
      }
      const n = replaceAllInScript(needle, r ? r.value : '', false);
      if(typeof toast === 'function') toast(n ? 'Replaced ' + n + (n === 1 ? ' match' : ' matches') : 'No matches');
    });
    find.addEventListener('keydown', function(e){
      if(e.key !== 'Enter') return;
      e.preventDefault();
      const all = find.querySelector('[data-fnt-find-all]');
      if(all) all.click();
    }, true);

    bar.querySelector('[data-fnt-title]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = title.hidden;
      fillTitlePanel();
      jump.hidden = true;
      cast.hidden = true;
      ins.hidden = true;
      find.hidden = true;
      title.hidden = !opening;
      if(opening){
        const first = title.querySelector('[data-tf="title"]');
        if(first) setTimeout(function(){ try{ first.focus(); }catch(err){} }, 30);
      }
    });
    title.querySelector('[data-fnt-title-done]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      writeTitle();
      title.hidden = true;
      if(typeof toast === 'function') toast('Title page saved');
    });
    title.querySelector('[data-fnt-title-clear]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const c = currentChapter();
      if(c) c.fntTitle = {};
      Array.prototype.forEach.call(titleInputs(), function(inp){ inp.value = ''; });
      paintTitle();
      if(typeof save === 'function') save();
      if(typeof toast === 'function') toast('Title page cleared');
    });
    /* ── New scene ──
       A scene is a heading in the script, not a new document: this drops
       INT. LOCATION - DAY onto its own lines at the caret and leaves the
       caret on it, so the suggestion list offers the place and the time
       (the Bible's locations first) without a keystroke. */
    const newScene = function(){
      const at = ta.selectionStart;
      const before = ta.value.slice(0, at);
      const pad = (before === '' || /\n\s*$/.test(before)) ? '' : '\n\n';
      const text = 'INT. LOCATION - DAY';
      ta.value = before + pad + text + ta.value.slice(ta.selectionEnd);
      const end = before.length + pad.length + text.length;
      ta.selectionStart = ta.selectionEnd = end;
      try{ ta.focus(); }catch(err){}
      if(timer){ clearTimeout(timer); timer = 0; }
      sync();
      scheduleSuggest();
    };
    bar.querySelector('[data-fnt-new-scene]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      newScene();
    });
    bar.querySelector('[data-fnt-import]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      importScript(ta);
    });
    bar.querySelector('[data-fnt-print]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      printScript();
    });
    bar.querySelector('[data-fnt-jump]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = jump.hidden;
      paintJump();
      closePanels(opening ? jump : null);
    });
    bar.querySelector('[data-fnt-cast]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = cast.hidden;
      paintCast();
      closePanels(opening ? cast : null);
    });
    bar.querySelector('[data-fnt-auto]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      S.config.fntAuto = !autoOn();
      if(typeof save === 'function') save();
      syncSwitch(bar.querySelector('[data-fnt-auto]'), autoOn());
      if(!S.config.fntAuto) closeSug();
      if(typeof toast === 'function') toast(S.config.fntAuto ? 'Suggestions on' : 'Suggestions off');
    });
    /* scene numbers are drawn by the stylesheet, so they never touch the
       text that gets saved — the toggle only changes the preview's class */
    bar.querySelector('[data-fnt-numbers]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      S.config.fntNumbers = !numbersOn();
      if(typeof save === 'function') save();
      paintNumbers();
      syncSwitch(bar.querySelector('[data-fnt-numbers]'), numbersOn());
      if(typeof toast === 'function') toast(numbersOn() ? 'Scene numbers on' : 'Scene numbers off');
    });
    bar.querySelector('[data-fnt-copy]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      copyScript(ta.value);
    });
    bar.querySelector('[data-fnt-export]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      exportScript(ta.value);
    });

    syncSwitch(bar.querySelector('[data-fnt-auto]'), autoOn());
    syncSwitch(bar.querySelector('[data-fnt-numbers]'), numbersOn());

    /* clicking an offer takes it */
    sug.addEventListener('mousedown', function(e){
      const b = e.target.closest('[data-i]');
      if(!b) return;
      e.preventDefault();
      accept(parseInt(b.dataset.i, 10));
    }, true);

    /* keyboard while the list is open */
    ta.addEventListener('keydown', function(e){
      if(sug.hidden || !items.length) return;
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault(); e.stopPropagation();
        active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        Array.prototype.forEach.call(sug.querySelectorAll('.fnt-sug-i'), function(b, i){ b.classList.toggle('on', i === active); });
        return;
      }
      if(e.key === 'Tab' || e.key === 'Enter'){
        e.preventDefault(); e.stopPropagation();
        accept(active);
        return;
      }
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeSug(); return; }
      if(e.key === ' '){ setTimeout(suggest, 0); }
    }, true);

    let sTimer = 0;
    const scheduleSuggest = function(){
      if(sTimer) clearTimeout(sTimer);
      sTimer = setTimeout(function(){ sTimer = 0; try{ suggest(); }catch(err){} }, 110);
    };
    ta.addEventListener('input', function(){ paintStats(); scheduleSuggest(); }, true);
    ta.addEventListener('blur', function(){ closeSug(); jump.hidden = true; }, true);
    ta.addEventListener('scroll', function(){ if(!sug.hidden) closeSug(); }, true);

    paintStats();
    paintNumbers();
    paintTitle();
  };

  /* mount after every load, and once on a slow beat as a safety net */
  const baseLoad = window.SF_FOUNTAIN.load;
  window.SF_FOUNTAIN.load = function(){
    const r = baseLoad.apply(this, arguments);
    try{ mount(); }catch(e){ console.warn('script bar failed:', e); }
    return r;
  };
  setInterval(function(){
    if(!isScript()) return;
    try{ mount(); }catch(e){}
  }, 900);

  /* The script page used to send you away from Outline — “the Fountain
     source IS the outline”. It no longer does: Outline is a page in
     Screenplay like anywhere else (state.js lists it), and kicking the
     writer off it made the page look missing from the mode. */

  if(document.body) setTimeout(function(){ try{ load(); }catch(e){} }, 200);
  else document.addEventListener('DOMContentLoaded', function(){ setTimeout(load, 200); });
})();
