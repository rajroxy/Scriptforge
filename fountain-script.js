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

  const SCRIPT_MODES = ['screenplay', 'tv', 'stage', 'comic'];
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
          e.preventDefault();
          const at = ta.selectionStart;
          ta.value = ta.value.slice(0, at) + '    ' + ta.value.slice(ta.selectionEnd);
          ta.selectionStart = ta.selectionEnd = at + 4;
          if(timer) clearTimeout(timer);
          timer = setTimeout(function(){ timer = 0; sync(); }, 220);
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

  /* the bar, the Scenes menu and the suggestion box, once per page */
  const mount = function(){
    const root = pageRoot();
    if(!root || !root.classList.contains('active')) return;
    const pane = root.querySelector('.fnt-src-pane');
    const ta = pane && pane.querySelector('.fnt-src');
    if(!pane || !ta) return;
    if(pane.querySelector('[data-fnt-tools]')) return;

    pane.style.position = 'relative';

    const bar = document.createElement('div');
    bar.className = 'fnt-tools';
    bar.setAttribute('data-fnt-tools', '1');
    bar.innerHTML =
        '<span class="fnt-st"><i class="bi bi-film"></i><b data-fnt-scenes>0</b> scenes</span>'
      + '<span class="fnt-st"><i class="bi bi-people"></i><b data-fnt-chars>0</b> characters</span>'
      + '<span class="fnt-st"><i class="bi bi-file-earmark-text"></i><b data-fnt-pages>0</b> pages</span>'
      + '<span class="fnt-st"><i class="bi bi-type"></i><b data-fnt-words>0</b> words</span>'
      + '<span class="fnt-sp"></span>'
      + '<button type="button" class="fnt-btn" data-fnt-jump title="Jump to a scene"><i class="bi bi-list-ol"></i> Scenes</button>'
      + '<label class="fnt-auto" title="Suggest scene headings, characters, transitions and parentheticals as you type">'
      +   '<input type="checkbox" data-fnt-auto' + (autoOn() ? ' checked' : '') + '><i class="bi bi-magic"></i></label>';
    pane.appendChild(bar);

    const jump = document.createElement('div');
    jump.className = 'fnt-jump';
    jump.hidden = true;
    pane.appendChild(jump);

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
      return st;
    };

    const paintJump = function(){
      const st = paintStats();
      if(!st.heads.length){
        jump.innerHTML = '<div class="fnt-jump-empty">No scene headings yet — start a line with <b>INT.</b> or <b>EXT.</b></div>';
        return;
      }
      jump.innerHTML = st.heads.map(function(h, i){
        return '<button type="button" class="fnt-jump-i" data-line="' + h.line + '">'
          + '<span>' + String(i + 1).padStart(2, '0') + '</span>' + esc(h.title) + '</button>';
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

    bar.querySelector('[data-fnt-jump]').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const opening = jump.hidden;
      paintJump();
      jump.hidden = !opening;
    });
    bar.querySelector('[data-fnt-auto]').addEventListener('change', function(e){
      S.config.fntAuto = !!e.target.checked;
      if(typeof save === 'function') save();
      if(!S.config.fntAuto) closeSug();
      if(typeof toast === 'function') toast(S.config.fntAuto ? 'Suggestions on' : 'Suggestions off');
    });

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

  /* a script has no Outline page — never leave one on screen */
  const leaveOutline = function(){
    try{
      if(isScript() && S.page === 'outline' && typeof goPage === 'function') goPage('draft');
    }catch(e){}
  };
  const baseLoad2 = window.SF_FOUNTAIN.load;
  window.SF_FOUNTAIN.load = function(){
    leaveOutline();
    return baseLoad2.apply(this, arguments);
  };

  if(document.body) setTimeout(function(){ try{ load(); }catch(e){} }, 200);
  else document.addEventListener('DOMContentLoaded', function(){ setTimeout(load, 200); });
})();
