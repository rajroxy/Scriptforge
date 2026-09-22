/* ═══════════════════════════════════════════════════════════
   ScriptForge — Idea page, take two.

   · The left panel is a grid of cards. “Prompt me” fills five of them
     with five different prompts (three across, two rows).
   · The sixth card is the writer's own: type anything in it, press
     Enter (or the send button), and the AI writes the five prompts
     from what you wrote instead of from the project alone.
   · Every dropdown on this page (Prompt AI → Focus / Tone) and on the
     Plan board (each beat's type) wears the app’s own dropdown card.
   ═══════════════════════════════════════════════════════════ */
(function(){
  if(typeof PAGE_RENDERERS === 'undefined' || typeof PAGE_RENDERERS.inspire !== 'function') return;

  const CARDS = 5;                      /* prompt cards … */
  let slots = ['', '', '', '', ''];
  let brief = '';                       /* … and the sixth card's text */
  let sel = 0;
  let busy = false;                     /* the AI is writing right now */

  const esc2 = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const cfg = function(){
    if(!S.config.ideaAI) S.config.ideaAI = {};
    if(!S.config.ideaAI.focus) S.config.ideaAI.focus = 'any';
    if(!S.config.ideaAI.tone)  S.config.ideaAI.tone  = 'Creative';
    return S.config.ideaAI;
  };
  const FOCUS_NAME = { any:'Any', scene:'Scene', character:'Character', dialogue:'Dialogue', structure:'Structure' };

  const current = function(){ return slots[sel] || ''; };

  const copyText = function(txt){
    txt = String(txt || '');
    if(!txt) return;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt);
        if(typeof toast === 'function') toast('Copied');
        return;
      }
    }catch(e){ /* fall through to the old path */ }
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); if(typeof toast === 'function') toast('Copied'); }catch(e){}
    ta.remove();
  };

  /* ── the cards ── */
  const paint = function(){
    const box = document.getElementById('ideaCards');
    if(!box) return;

    const cards = slots.map(function(txt, i){
      const on  = (txt && i === sel) ? ' on' : '';
      const body = txt ? '<p>' + esc2(txt) + '</p>' : '';
      return '<article class="idea-slot' + on + '" data-ic-slot="' + i + '">'
        + body
        + '<div class="idea-slot-acts">'
        +   '<button class="ol-tool" data-ic-copy="' + i + '" title="Copy this prompt"><i class="bi bi-clipboard"></i></button>'
        +   '<button class="ol-tool" data-ic-save="' + i + '" title="Keep this prompt"><i class="bi bi-bookmark-plus"></i></button>'
        + '</div>'
        + '</article>';
    });

    /* the sixth card: type anything and the AI writes prompts from it */
    cards.push(
      '<article class="idea-slot idea-slot-brief" data-ic-brief="1">'
      + '<textarea class="idea-brief-input" data-ic-brief-input rows="3"'
      +   ' placeholder="Type anything here \u2014 the AI writes prompts from it\u2026">' + esc2(brief) + '</textarea>'
      + '<div class="idea-slot-acts">'
      +   '<button class="ol-tool" data-ic-brief-send="1" title="Write prompts from this"><i class="bi bi-send"></i></button>'
      + '</div>'
      + '</article>'
    );

    box.innerHTML = cards.join('');
  };

  const note = function(html, cls){
    const box = document.getElementById('ideaCards');
    if(!box) return;
    box.innerHTML = '<div class="idea-slot idea-slot-ghost"><p class="' + cls + '">' + html + '</p></div>';
  };

  /* ── the sixth card, busy: the spinner rides in its corner, so the text
        you typed stays where it is (no repaint while the AI thinks) ── */
  const setBusy = function(on){
    const card = document.querySelector('[data-ic-brief]');
    if(card) card.classList.toggle('is-busy', !!on);
    const btn = document.querySelector('[data-ic-brief-send]');
    if(btn){
      btn.title = on ? 'Writing…' : 'Write prompts from this';
      const ic = btn.querySelector('i');
      if(ic) ic.className = on ? 'bi bi-arrow-repeat' : 'bi bi-send';
    }
  };

  /* ── prompts written on this machine, from your note and the project.
        This is the floor under the sixth card: even with no API key the
        card always produces five usable prompts. ── */
  const localPrompts = function(own){
    const d = (typeof D === 'function') ? D() : {};
    const cast = ((d.bible && d.bible.characters) || [])
      .map(function(c){ return c && c.name; }).filter(Boolean);
    const places = ((d.bible && d.bible.places) || [])
      .map(function(p){ return p && p.name; }).filter(Boolean);
    const who   = cast.length   ? cast[Math.floor(Math.random() * cast.length)]     : 'your protagonist';
    const other = cast.length > 1 ? cast.filter(function(n){ return n !== who; })[0] : 'someone who disagrees';
    const where = places.length ? places[Math.floor(Math.random() * places.length)] : 'the place nobody wants to go back to';
    const subj  = own || 'the thing this project keeps circling';
    const focus = (S.config.ideaAI && S.config.ideaAI.focus) || 'any';

    const set = [
      'Write the scene this is built around: ' + subj + '. Keep it under 500 words.',
      'Put ' + subj + ' in ' + who + '’s mouth — and never let them name it out loud.',
      'Open on the moment just before ' + subj + ' and end on the moment just after.',
      'Send ' + who + ' to ' + where + ' with exactly one reason: ' + subj + '.',
      'Let ' + other + ' want the opposite of ' + subj + ' — and let them win the scene.',
      'Write ' + subj + ' twice: once as comedy, once as the worst night of ' + who + '’s life.',
      'Show ' + subj + ' through five objects and no adjectives.',
      'Write the conversation where ' + who + ' and ' + other + ' both think they are helping.'
    ];
    if(focus === 'dialogue')       set.unshift('Write the argument about ' + subj + ' where neither says what they mean.');
    if(focus === 'character')      set.unshift('Show ' + who + ' through how they treat a stranger while ' + subj + ' is happening.');
    if(focus === 'structure')      set.unshift('Sketch the midpoint that reverses what ' + who + ' wants from ' + subj + '.');
    if(focus === 'scene')          set.unshift('Set ' + subj + ' in ' + where + ' — the weather doing half the work.');

    const start = Math.floor(Math.random() * Math.max(1, set.length - CARDS));
    return set.slice(start, start + CARDS);
  };

  /* ── ask the AI for prompts (and fall back to the local set) ── */
  const ask = async function(fromBrief){
    if(busy) return;
    const c = cfg();
    const focus = FOCUS_NAME[c.focus] || 'Any';
    const own = (typeof fromBrief === 'string') ? fromBrief.trim() : '';
    busy = true;
    setBusy(true);
    try{
      const res = await callAI(
        'You write writing prompts for one specific project.\n\n' + sfProjectBrief() + '\n\n' +
        (own ? 'What the writer wants prompts about: ' + own + '\n\n' : '') +
        'Task: write FIVE different, fresh, specific prompts for this writer.\n' +
        'Focus: ' + focus + '.  Tone: ' + c.tone + '.\n' +
        'Rules: each under 40 words, one idea each, no numbering, no bullets, no preamble, ' +
        'use the names and places from the project when they fit.\n' +
        'Return only the five prompts, one per line.');
      const lines = String(res || '').split('\n')
        .map(function(s){
          return String(s)
            .replace(/^\s*(?:[-*\u2022\u00b7]|\d+[.)])\s*/, '')   /* bullets + numbering */
            .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, '') /* stray quotes */
            .trim();
        })
        .filter(Boolean)
        .slice(0, CARDS);
      if(lines.length < 1) throw new Error('The AI sent nothing back');
      slots = [0, 1, 2, 3, 4].map(function(i){ return lines[i] || ''; });
      sel = 0;
    }catch(err){
      /* no key, no network, or an empty answer — write them here instead of
         leaving five empty cards on screen */
      slots = localPrompts(own);
      sel = 0;
      if(typeof toast === 'function'){
        toast('Wrote these on this machine — ' + (err && err.message ? err.message : 'AI unavailable'), 'warn');
      }
    }finally{
      busy = false;
      setBusy(false);
    }
    paint();
  };

  /* ── keep a prompt (a card’s own Save lands here) ── */
  const keep = function(txt){
    txt = String(txt || '');
    if(!txt){ if(typeof toast === 'function') toast('Nothing to save yet', 'warn'); return; }
    if(!Array.isArray(S.config.savedPrompts)) S.config.savedPrompts = [];
    const has = S.config.savedPrompts.some(function(p){
      return ((typeof p === 'string') ? p : (p && p.text)) === txt;
    });
    if(has){ if(typeof toast === 'function') toast('Already saved'); return; }

    const words = txt.replace(/\s+/g, ' ').trim().split(' ');
    const title = (words.slice(0, 6).join(' ') + (words.length > 6 ? '\u2026' : '')) || 'Untitled prompt';
    S.config.savedPrompts.unshift({ title:title, text:txt });
    if(typeof save === 'function') save();
    if(typeof toast === 'function') toast('Prompt saved');

    /* repaint the page so the Saved prompts list carries the new entry */
    const root = document.getElementById('page-inspire');
    if(root) PAGE_RENDERERS.inspire(root);
    else paint();
  };

  /* ── the page ── */
  const orig = PAGE_RENDERERS.inspire;
  PAGE_RENDERERS.inspire = function(root){
    orig(root);
    if(!root || !root.querySelector) return;

    /* one big card → the card grid */
    const box = root.querySelector('#inspireBox');
    if(box){
      box.hidden = true;
      box.id = 'inspireBoxOld';
      box.className = '';
      const grid = document.createElement('div');
      grid.className = 'idea-cards';
      grid.id = 'ideaCards';
      box.parentNode.insertBefore(grid, box);
    }

    /* the bar’s own buttons belong to this layer now */
    const pb = root.querySelector('[data-idea="prompt"]');
    if(pb){ pb.removeAttribute('data-idea'); pb.setAttribute('data-ic-prompt', '1'); }

    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(root);
    paint();
  };

  /* ── clicks — registered after the layer above, so a saved prompt has
        already become “current” by the time we repaint ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(!t || !t.closest) return;

    /* a saved prompt opened: the layer above has already made it “current”,
       so drop it into the card you are on */
    if(t.closest('[data-idea-open]')){
      const txt = (window.SF_IDEA && window.SF_IDEA.current) ? window.SF_IDEA.current() : '';
      if(txt){ slots[sel] = txt; paint(); }
      return;
    }

    if(t.closest('[data-ic-prompt]')){ e.preventDefault(); e.stopPropagation(); ask(); return; }

    if(t.closest('[data-ic-brief-send]')){
      e.preventDefault(); e.stopPropagation();
      const ta = document.querySelector('[data-ic-brief-input]');
      if(ta) brief = ta.value;                       /* the live text, never a stale copy */
      if(!brief.trim()){ if(typeof toast === 'function') toast('Type something first', 'warn'); return; }
      ask(brief);
      return;
    }

    /* anywhere in the sixth card puts the cursor in its text */
    if(t.closest('[data-ic-brief]')){
      const ta = document.querySelector('[data-ic-brief-input]');
      if(ta && !t.closest('.idea-slot-acts')) ta.focus();
      return;
    }

    const cp = t.closest('[data-ic-copy]');
    if(cp){ e.preventDefault(); e.stopPropagation(); copyText(slots[parseInt(cp.dataset.icCopy, 10)] || ''); return; }

    const sv = t.closest('[data-ic-save]');
    if(sv){ e.preventDefault(); e.stopPropagation(); keep(slots[parseInt(sv.dataset.icSave, 10)] || ''); return; }

    const sl = t.closest('[data-ic-slot]');
    if(sl){
      e.preventDefault();
      const i = parseInt(sl.dataset.icSlot, 10);
      if(!isNaN(i) && slots[i]){ sel = i; paint(); }
      return;
    }
  }, true);

  /* the brief card: keep every keystroke, Enter sends */
  document.addEventListener('input', function(e){
    const t = e.target;
    if(t && t.dataset && t.dataset.icBriefInput){ brief = t.value; }
  }, true);

  document.addEventListener('keydown', function(e){
    const t = e.target;
    if(!t || !t.dataset || !t.dataset.icBriefInput) return;
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      brief = t.value;
      if(brief.trim()) ask(brief);
      else if(typeof toast === 'function') toast('Type something first', 'warn');
    }
  }, true);

  /* ── Plan board — every beat’s type picker wears the app’s dropdown card.
     The dropdown component is wired to <select class="sel">, so the board’s
     selects get that class before they are enhanced. ── */
  const skinBoard = function(){
    const board = document.getElementById('beatList');
    if(!board) return;
    Array.prototype.slice.call(board.querySelectorAll('select.beat-type')).forEach(function(s){
      s.classList.add('sel');
    });
    if(typeof window.enhanceSelects === 'function') window.enhanceSelects(board);
  };

  if(typeof window.renderBeats === 'function'){
    const rb = window.renderBeats;
    window.renderBeats = function(){
      const r = rb.apply(this, arguments);
      skinBoard();
      return r;
    };
  }

  /* the board’s own click handler redraws it — keep that path skinned too */
  document.addEventListener('change', function(e){
    if(e.target && e.target.classList && e.target.classList.contains('beat-type')) setTimeout(skinBoard, 0);
  }, true);

  /* ── keep the open list fully visible ──
     The board scrolls and the cards are small, so an open dropdown raises its
     own card and flips the list above the title when there is no room below. ── */
  document.addEventListener('click', function(e){
    const board = document.getElementById('beatList');
    if(!board) return;
    const t = e.target;

    if(!t || !t.closest || !t.closest('#beatList .dd-card')){
      Array.prototype.slice.call(board.querySelectorAll('.beat-card.beat-open')).forEach(function(c){
        c.classList.remove('beat-open');
      });
      return;
    }

    setTimeout(function(){
      const bRect = board.getBoundingClientRect();
      Array.prototype.slice.call(board.querySelectorAll('.beat-card')).forEach(function(cardEl){
        const card = cardEl.querySelector('.dd-card');
        if(!card) return;
        const open = card.classList.contains('open');
        cardEl.classList.toggle('beat-open', open);
        if(!open){ card.classList.remove('dd-up'); return; }
        const roomBelow = bRect.bottom - card.getBoundingClientRect().bottom;
        card.classList.toggle('dd-up', roomBelow < 190);
      });
    }, 0);
  }, true);
})();
