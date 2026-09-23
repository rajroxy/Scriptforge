/* ═══════════════════════════════════════════════════════════
   ScriptForge — what the assistant already knows

   Every AI request carries the project, in the order the writer built it:

       the prompt page  →  the drafts (and the chat on them)  →
       the outline  →  the plan / beat board  →  the board  →
       the reference page  →  the Bible  →  what is on screen now

   so the answer at each stage is written by something that has read the
   stages before it. The Outline page sees the drafts and the chat about
   them; the Plan sees the outline; the manuscript sees the plan. The board
   and the reference page are always carried, because they are the record
   the rest of the book is checked against.

   It is built fresh from the ACTIVE project and the ACTIVE workspace on
   every request, and nothing is cached — so a second project, or a second
   workspace inside this one, is a different book to the assistant, with no
   way for one to leak into the other.

   This layer only adds to the brief the app already builds (sfProjectBrief
   in pages-fix.js, which carries the title, the form, the structure, the
   Bible, the beats and the current section). It runs after every other
   script, and both AI doors — callAI, and the Draft chat's own request
   builder — read the result.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const CAP = 5200;                 /* the chain's own ceiling, in characters */

  const data = function(){
    try{ return (typeof D === 'function') ? (D() || null) : null; }catch(e){ return null; }
  };
  const projOf = function(){
    try{
      const d = D();
      return (d.projects || []).filter(function(p){ return p.id === d.currentProject; })[0] || null;
    }catch(e){ return null; }
  };
  const flat = function(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  const cut = function(s, n){
    const t = flat(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  const html = function(s){ return flat(String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')); };
  const words = function(s){
    try{ if(typeof olWords === 'function') return olWords(s); }catch(e){}
    return flat(s).split(' ').filter(Boolean).length;
  };

  /* ── the drafts, with their prose: what the writing actually says ── */
  const drafts = function(d){
    const list = (d && Array.isArray(d.drafts)) ? d.drafts : [];
    if(!list.length) return '';
    return list.slice(0, 8).map(function(x, i){
      const body = html(x.body);
      return (i + 1) + '. ' + cut(x.title || 'Untitled', 60) + ' (' + words(body).toLocaleString() + ' words)' +
             (body ? '\n   "' + cut(body, 240) + '"' : '');
    }).join('\n');
  };

  /* ── what has already been said about it, on the draft page ── */
  const chat = function(d){
    const list = (d && Array.isArray(d.aiChats)) ? d.aiChats : [];
    if(!list.length) return '';
    /* the chat the writer is in, or the one used most recently */
    let c = d.aiChatActive ? list.filter(function(x){ return x && x.id === d.aiChatActive; })[0] : null;
    if(!c) c = list[list.length - 1];
    if(!c || !Array.isArray(c.messages) || !c.messages.length) return '';
    const tail = c.messages.slice(-8).map(function(m){
      return (m.role === 'user' ? 'Writer: ' : 'Assistant: ') + cut(m.text, 260);
    }).join('\n');
    const name = c.title ? '“' + cut(c.title, 50) + '”' : 'the chat';
    return name + ':\n' + tail;
  };

  /* ── the board: which list each piece stands in ──
     The cards are the same ones the Board page draws: every chapter and
     every subchapter, in the list it has been moved to. */
  const board = function(d){
    let proj = null, cols = [], state = {};
    try{ proj = (typeof kbProj === 'function') ? kbProj() : null; }catch(e){}
    try{ cols = (typeof kbColumns === 'function') ? kbColumns() : []; }catch(e){}
    try{
      state = (proj && proj.kanban) || {};
      if(state && Array.isArray(state.columns)) state = {};       /* the old shape */
    }catch(e){ state = {}; }
    if(!proj || !cols.length) return '';

    const cards = [];
    ((d && d.chapters) || []).forEach(function(c, i){
      cards.push({ id:c.id, title:c.title || ('Chapter ' + (i + 1)), body:c.content });
      (c.children || []).forEach(function(x, j){
        cards.push({ id:x.id, title:x.title || ('Subchapter ' + (j + 1)), body:x.content });
      });
    });
    if(!cards.length) return '';

    /* a card with no explicit list sits where the app would put it: drafted
       once it has words, in the first list before that */
    const auto = cols[0] ? cols[0].id : '';
    const drafted = cols[1] ? cols[1].id : auto;
    const out = [];
    cols.forEach(function(col){
      const inCol = cards.filter(function(c){
        const st = state[c.id];
        const at = (st && cols.some(function(x){ return x.id === st; })) ? st
                 : (words(c.body) > 0 ? drafted : auto);
        return at === col.id;
      });
      if(!inCol.length) return;
      out.push(col.name + ': ' + inCol.slice(0, 14).map(function(c){
        return cut(c.title, 50) + (words(c.body) ? ' (' + words(c.body) + 'w)' : '');
      }).join(', '));
    });
    return out.join('\n');
  };

  /* ── the reference page: what the writer looked up and kept ── */
  const refs = function(d){
    const list = (d && Array.isArray(d.references)) ? d.references : [];
    if(!list.length) return '';
    return list.slice(0, 20).map(function(r){
      const t = cut(r.title || r.name || r.url || 'Reference', 70);
      const note = cut(r.note || r.summary || r.text || '', 90);
      return '- ' + t + (note ? ' — ' + note : '');
    }).join('\n');
  };

  /* ── the plan, when the beads are not already in the brief ── */
  const plan = function(d){
    const list = (d && Array.isArray(d.beats)) ? d.beats : [];
    if(!list.length) return '';
    return list.slice(0, 30).map(function(b, i){
      return (i + 1) + '. [' + (b.type || 'beat') + '] ' + cut(b.text || b.title || '', 110);
    }).join('\n');
  };

  const chain = function(){
    const d = data();
    if(!d) return '';
    const out = [];
    const push = function(head, body){ if(body) out.push(head + ':\n' + body); };

    push('DRAFTS IN THIS PROJECT', drafts(d));
    push('WHAT HAS ALREADY BEEN SAID ABOUT IT (the draft page chat)', chat(d));
    /* the structure, the beats and the Bible are in the brief above; the
       plan gets its own lines here when the brief could not carry them all */
    push('PLAN — BEAT BOARD', plan(d));
    push('THE BOARD (which list each piece stands in)', board(d));
    push('REFERENCE PAGE — kept by the writer', refs(d));

    let text = out.join('\n\n');
    if(text.length > CAP) text = text.slice(0, CAP - 1) + '…';
    return text;
  };

  const head = '\n\nTHE PROJECT SO FAR — the stages this one comes after, each one a ' +
               'separate part of the same book. Use it. Do not invent anything that ' +
               'contradicts it, and do not restate it back to the writer.\n';

  if(typeof window.sfProjectBrief === 'function' && !window.sfProjectBrief.__sfChain){
    const orig = window.sfProjectBrief;
    const wrapped = function(){
      let base = '';
      try{ base = String(orig.apply(this, arguments) || ''); }catch(e){ base = ''; }
      let more = '';
      try{ more = chain(); }catch(e){ more = ''; }
      return more ? (base + head + more) : base;
    };
    wrapped.__sfChain = true;
    window.sfProjectBrief = wrapped;
  }
})();
