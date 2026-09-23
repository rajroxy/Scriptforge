/* ═══════════════════════════════════════════════════════════
   ScriptForge — the round button's menus, corrected

   Loaded after pages-fix.js and polish.js, so everything it changes is
   theirs to change and it only has to say what is different:

     1 NAMES BY FORM    the Outline page names its units the way the form
                        does — a novel has chapters and subchapters, a
                        screenplay has scenes and sub-scenes — and the two
                        naming jobs ask for a DESCRIPTION, which is what the
                        writer actually wants there, not a second title.

     2 THE PLAN BOARD   "Beat ideas" is "Beat the board": it fills the board
                        you are looking at with the beats it is missing.

     3 TEXT & LANGUAGE  Translate is on the manuscript and the screenplay,
                        where the writing is. It is off the plan board, the
                        Bible, the canvas and the board — those pages ask
                        about the book, and a translate chip in the middle
                        of them is one more thing to read past.

     4 WHICH PAGE       the two outline jobs know which page and which form
                        they were asked from, so a screenplay gets scenes.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const F  = function(){ return window.AI_FNS || (window.AI_FNS = {}); };
  const pageId = function(){ try{ return S.page || ''; }catch(e){ return ''; } };
  const modeId = function(){
    try{ if(S.mode) return S.mode; }catch(e){}
    try{ return document.body.getAttribute('data-writing-mode') || 'novel'; }catch(e){}
    return 'novel';
  };
  /* the form that writes in scenes rather than chapters */
  const isScreenplay = function(){
    return ['screenplay', 'tv', 'stage', 'script'].indexOf(modeId()) >= 0;
  };
  /* the pages whose unit is a SCENE in the form's own language */
  const units = function(){
    if(isScreenplay()) return { one:'Scene', many:'Scenes', sub:'Sub-scene', subs:'Sub-scenes' };
    return { one:'Chapter', many:'Chapters', sub:'Subchapter', subs:'Subchapters' };
  };

  /* ═══ 1 · NAMES BY FORM ═══
     SF_FAB_AI is the app's own table and the option objects inside it are
     plain objects, so its labels are re-written in place on every render —
     no second copy of the menu to drift out of step. */
  const relabel = function(){
    let table = null;
    try{ table = SF_FAB_AI; }catch(e){ table = null; }
    if(!table) return;
    const u = units();

    /* ── outline ── */
    if(Array.isArray(table.outline)){
      table.outline.forEach(function(o){
        if(!o || !o.fn) return;
        if(o.fn === 'olChapterTitles'){
          o.label = u.one + ' description';
          o.desc  = 'Describe what every ' + u.one.toLowerCase() + ' covers, from your outline';
        }else if(o.fn === 'olSubTitles'){
          o.label = u.sub + ' description';
          o.desc  = 'Describe what happens in each ' + u.sub.toLowerCase();
        }else if(o.fn === 'olStructure'){
          o.desc = 'Is the ' + u.one.toLowerCase() + ' order working? What should move?';
        }
      });
    }

    /* ── plan ── */
    if(Array.isArray(table.plan)){
      table.plan.forEach(function(o){
        if(!o || o.fn !== 'planBeats') return;
        o.label = 'Beat the board';
        o.desc  = 'Fill this board — the beats it is still missing, in order';
      });
    }
  };

  /* ═══ 3 · TEXT & LANGUAGE ═══
     Only the pages the writer types prose on keep Translate. The panel is
     drawn by pages-fix.js; this reads the finished panel and takes the
     section off the pages that should not carry it. */
  const KEEP_TEXT = ['manuscript', 'script', 'screenplay', 'write'];
  const trimTextSection = function(){
    const body = document.getElementById('fabAIBody');
    if(!body) return;
    const keep = KEEP_TEXT.indexOf(pageId()) >= 0;
    if(keep) return;

    /* the section header and everything of its own that follows it, up to
       the next section — the translate chip is the one it holds today */
    Array.prototype.forEach.call(body.querySelectorAll('.fab-ai-sec'), function(sec){
      const label = String(sec.textContent || '').trim().toLowerCase();
      if(label !== 'text') return;
      let node = sec.nextElementSibling;
      const doomed = [sec];
      while(node && !(node.classList && node.classList.contains('fab-ai-sec'))){
        doomed.push(node);
        node = node.nextElementSibling;
      }
      /* a chip that is the last thing in the panel belongs to the section
         above only if there is no header left at all — otherwise it is the
         section's own and goes with it */
      doomed.forEach(function(n){
        if(n && n.parentNode === body) body.removeChild(n);
      });
    });
  };

  /* ── wrap the renderer ── */
  if(typeof window.renderFabAI === 'function'){
    const orig = window.renderFabAI;
    const wrapped = function(){
      relabel();
      const r = orig.apply(this, arguments);
      try{ trimTextSection(); }catch(e){}
      return r;
    };
    wrapped.__sfTrimmed = true;
    window.renderFabAI = wrapped;
  }

  /* the panel is also drawn from app.js's own renderer on some pages; the
     trim is cheap and idempotent, so it runs on every open of the menu */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('#fabBtn, [data-act="fab-ai"]')) setTimeout(trimTextSection, 0);
  }, true);
  document.addEventListener('contextmenu', function(e){
    if(e.target && e.target.closest && e.target.closest('#fabBtn')) setTimeout(trimTextSection, 0);
  }, true);
  document.addEventListener('DOMContentLoaded', relabel);
  relabel();

  /* ═══ 4 · THE TWO OUTLINE JOBS ═══
     They used to ask for a TITLE, which is what the Outline page already
     has a field for — the writer picked the option and got back the thing
     they had just written. They ask for a description now, in the form's
     own words, and they are told what the project is before they answer. */
  const brief = function(){
    try{ return (typeof sfProjectBrief === 'function') ? sfProjectBrief() : ''; }catch(e){ return ''; }
  };
  const ask = function(title, sub, prompt){
    try{
      if(typeof sfAsk === 'function') return sfAsk(title, sub, prompt);
    }catch(e){}
  };

  const olChapter = function(){
    const u = units();
    ask(u.one + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: write a short DESCRIPTION of what each ' + u.one.toLowerCase() +
      ' covers, one per ' + u.one.toLowerCase() + ' listed in the structure above.\n' +
      'Rules:\n' +
      '- Two or three sentences each: what happens, and what it is for in the whole.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where the outline is still empty for a ' + u.one.toLowerCase() + ', write "not yet planned" and nothing more.\n' +
      '- No titles, no numbering of your own, no praise.\n' +
      'Reply as a plain list — "' + u.one + ' 1 — description" — and nothing else.');
  };

  const olSub = function(){
    const u = units();
    ask(u.sub + ' description', 'From your outline',
      'You are a story editor writing reference notes on a writer\u2019s own outline.\n\n' +
      brief() + '\n\n' +
      'Task: for every ' + u.one.toLowerCase() + ' above that has ' + u.subs.toLowerCase() +
      ', write a short DESCRIPTION of each ' + u.sub.toLowerCase() + '.\n' +
      'Rules:\n' +
      '- One or two sentences each: what happens in it, in order.\n' +
      '- Use only what the outline, the plan, the Bible and the drafts actually say. Never invent events, names or places.\n' +
      '- Where one is still empty, write "not yet planned".\n' +
      '- No titles, no praise, no suggestions.\n' +
      'Reply as a plain list — "' + u.one + ' — ' + u.sub + ': description" — and nothing else.');
  };

  /* the order check speaks in the form's own words too, and reads the whole
     project before it judges the order */
  const olOrder = function(){
    const u = units();
    const one = u.one.toLowerCase(), subs = u.subs.toLowerCase();
    ask('Structure check', 'Outline',
      'You are a developmental editor.\n\n' + brief() + '\n\n' +
      'Task: read the ' + one + ' and ' + subs + ' order above against everything you were given — the plan, the Bible, the drafts — and tell the writer, plainly:\n' +
      '1. what the order is doing well, in one or two lines,\n' +
      '2. which ' + one + ' or ' + u.sub.toLowerCase() + ' is in the wrong place, and where it should go,\n' +
      '3. the single change that would help most.\n' +
      'Judge only from what is actually in the project. If the outline is too thin to judge, say so in one line instead of inventing structure.\n' +
      'Under 250 words. No praise padding.');
  };

  /* swapped onto the shared table, so the panel, the keyboard and anything
     else that calls them by name all reach the same two functions */
  F().olChapterTitles = olChapter;
  F().olSubTitles     = olSub;
  F().olStructure     = olOrder;
})();
