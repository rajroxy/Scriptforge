/* ═══════════════════════════════════════════════════════════
   ai.js — merged file.

   The whole contents of these scripts were moved here, at the bottom, in
   their original load order:
     · ai.js
     · plugins.js
     · tools.js
   Nothing was rewritten, removed or reordered. Because every script
   below was contiguous in index.html, concatenation keeps the exact
   execution order they had as separate files.
   ═══════════════════════════════════════════════════════════ */

/* ══════════ ai.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — AI
   Providers · Mode+page-aware panel · All actions
   ═══════════════════════════════════════════════════════════ */

const AI = {};

// ═══════════════════════════════════════════════════════════
//   PROVIDER
// ═══════════════════════════════════════════════════════════

function aiKey(){ return aiKeyFor(S.config.provider); }

// The provider entry (name, endpoint, whether a key is needed, …)
function curProvider(){ return aiProvider(S.config.provider); }

async function callAI(prompt){
  const p = curProvider();
  const key = aiKey();
  if(!key && !p.keyless) throw new Error(`No API key for ${p.name}. Open Settings → AI.`);
  /* every request carries the register the writer works in — tragedy,
     avant-garde, the emotional — so the answers stay inside it instead of
     pulling the work toward a mainstream shape (Settings → AI → Story type) */
  const style = (typeof window.sfStoryStyleLine === 'function') ? window.sfStoryStyleLine() : '';
  const full = style ? style + '\n\n' + prompt : prompt;
  if(p.gemini) return callGemini(full, key);
  return callOpenAICompat(full, key);
}

async function callGemini(prompt, key){
  const base = aiBaseFor('gemini') || 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${base}/models/${aiModelFor('gemini')}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{ temperature: S.config.temperature, maxOutputTokens: S.config.maxTokens }
    })
  });
  if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || `HTTP ${r.status}`); }
  const d = await r.json();
  const txt = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if(txt) return txt;
  throw new Error('No response');
}

async function callOpenAICompat(prompt, key){
  const p = curProvider();
  const base = aiBaseFor(p.id) || S.config.baseUrl || 'https://api.openai.com/v1';
  if(!base) throw new Error(`No endpoint set for ${p.name}. Open Settings → AI.`);
  const headers = { 'Content-Type':'application/json' };
  if(key) headers['Authorization'] = `Bearer ${key}`;
  if(p.id === 'openrouter') headers['HTTP-Referer'] = location.href;
  const r = await fetch(`${base}/chat/completions`, {
    method:'POST', headers,
    body: JSON.stringify({
      model: aiModelFor(p.id),
      temperature: S.config.temperature,
      max_tokens: S.config.maxTokens,
      messages:[{role:'user', content:prompt}]
    })
  });
  if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || `HTTP ${r.status}`); }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || 'No response';
}

async function fetchModels(){
  const p = curProvider();
  const key = aiKey();
  const base = aiBaseFor(p.id);
  if(!key && !p.keyless){ toast('Enter API key first', 'err'); return []; }
  if(!base){ toast('Set an endpoint first', 'err'); return []; }
  toast('Fetching models…');
  try{
    let models = [];
    if(p.gemini){
      const r = await fetch(`${base}/models?key=${key}`);
      const d = await r.json();
      models = (d.models || [])
        .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1)
        .map(m => ({id:m.name.replace('models/',''), n:m.displayName || m.name}));
    } else {
      const headers = {};
      if(key) headers['Authorization'] = `Bearer ${key}`;
      if(p.id === 'openrouter') headers['HTTP-Referer'] = location.href;
      const r = await fetch(`${base}/models`, {headers});
      const d = await r.json();
      models = (d.data || []).map(m => ({id:m.id, n:m.name || m.id}));
      if(p.freeOnly) models = models.filter(m => m.id.indexOf(':free') !== -1).slice(0, 60);
      else models = models.slice(0, 120);
    }
    if(!models.length) throw new Error('No models');
    S.config.availableModels[S.config.provider] = models;
    save();
    toast(`Loaded ${models.length} models`);
    return models;
  }catch(e){ toast('Failed: ' + e.message, 'err'); return []; }
}

async function testConn(){
  try{
    await callAI('Say "ok" in one word.');
    toast('Connection works ✓');
    return true;
  }catch(e){ toast(e.message, 'err'); return false; }
}

// ═══════════════════════════════════════════════════════════
//   RESULT MODAL
// ═══════════════════════════════════════════════════════════

function showResult(title, sub, content){
  S.aiResult = content;
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  const words = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  scrim.innerHTML = `
    <div class="modal gt-modal">
      <div class="gt-head">
        <span class="gt-title"><i class="bi bi-stars"></i> ${esc(title)}</span>
        ${sub ? `<span class="gt-sub">${esc(sub)}</span>` : ''}
        <span class="gt-meta">${words ? words + ' words' : ''}</span>
        <button class="gt-x" data-result-close="1" title="Close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="gt-body">${esc(content) || '<span class="gt-loading">Working…</span>'}</div>
      <div class="gt-foot">
        <button class="gt-act" data-act="result-copy" title="Copy to the clipboard"><i class="bi bi-clipboard"></i> Copy</button>
        <button class="gt-act" data-act="result-insert" title="Insert at the caret"><i class="bi bi-text-indent-left"></i> Insert</button>
        <button class="gt-act" data-act="result-append" title="Add to the end of the piece"><i class="bi bi-plus-lg"></i> Append</button>
        <span class="gt-spacer"></span>
        <button class="gt-act" data-act="result-retry" title="Run the same request again"><i class="bi bi-arrow-clockwise"></i> Retry</button>
        <button class="gt-act gt-primary" data-act="result-apply" title="Replace the selection"><i class="bi bi-check-lg"></i> Replace</button>
      </div>
    </div>
  `;

  root.appendChild(scrim);

  /* the sheet closes from its own bi-x-lg, like every other panel here */
  const x = scrim.querySelector('[data-result-close]');
  if(x) x.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    closeResult();
  });
}

function closeResult(){
  const root = $('modalRoot');
  root.classList.remove('open');
  root.innerHTML = '';
  S.aiResult = '';
}

function applyResult(){
  if(!S.aiResult) return;
  const ed = $('editor');
  if(!ed) return;
  ed.focus();
  restoreSel();
  const sel = window.getSelection();
  if(sel.rangeCount && !sel.isCollapsed){
    sel.deleteFromDocument();
    sel.getRangeAt(0).insertNode(document.createTextNode(S.aiResult));
  } else {
    ed.innerText = S.aiResult;
  }
  onInput();
  closeResult();
  toast('Applied');
}

function appendResult(){
  if(!S.aiResult) return;
  const ed = $('editor');
  if(!ed) return;
  ed.innerHTML += S.aiResult.split('\n\n').map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
  onInput();
  closeResult();
  toast('Appended');
}

function copyResult(){
  if(S.aiResult) navigator.clipboard.writeText(S.aiResult).then(() => toast('Copied'));
}

/* insert at the caret, leaving whatever is selected alone */
function insertResult(){
  if(!S.aiResult) return;
  const ed = $('editor');
  if(!ed) return;
  ed.focus();
  restoreSel();
  const html = S.aiResult.split('\n\n').map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
  try{ document.execCommand('insertHTML', false, html); }
  catch(err){ document.execCommand('insertText', false, S.aiResult); }
  onInput();
  closeResult();
  toast('Inserted');
}

/* the same request again — useful when a model has a wobble */
function retryResult(){
  const last = S.aiLast;
  if(!last){ toast('Nothing to retry', 'warn'); return; }
  runAI(last.prompt, last.title, last.sub);
}

async function runAI(prompt, title, sub){
  S.aiLast = { prompt:prompt, title:title || 'Result', sub:sub || '' };
  showResult(title || 'Thinking…', sub || '', '');
  try{
    const res = await callAI(prompt);
    showResult(title || 'Result', sub || '', res.trim());
  }catch(e){ showResult('Error', 'Request failed', e.message); }
}

// ═══════════════════════════════════════════════════════════
//   CONTEXT HELPERS
// ═══════════════════════════════════════════════════════════

function selTxt(){ return window.getSelection()?.toString().trim() || ''; }
function edTxt(){ return $('editor')?.innerText.trim() || ''; }
function ctxTxt(){ return selTxt() || edTxt(); }
function langNm(){
  const c = S.config.defaultLang;
  const l = allLangs().find(x => x.code === c);
  return l ? l.name : 'English';
}

// ═══════════════════════════════════════════════════════════
//   ACTIONS PER MODE + PAGE
//   Structure: { mode: { page: [actions] } }
//   Fall back order: mode+page → mode → default
// ═══════════════════════════════════════════════════════════

const AI_MATRIX = {
  novel: {
    write: [
      {fn:'continue', icon:'arrow-right-circle', label:'Continue'},
      {fn:'expand', icon:'arrows-angle-expand', label:'Expand'},
      {fn:'dialogue', icon:'chat-dots', label:'Add dialogue'},
      {fn:'showDontTell', icon:'eye', label:'Show not tell'},
      {fn:'character', icon:'person-badge', label:'Deepen character'},
      {fn:'rewrite', icon:'arrow-repeat', label:'Rewrite'}
    ],
    plan: [
      {fn:'beatSuggest', icon:'list-check', label:'Suggest beats'},
      {fn:'arcCheck', icon:'graph-up-arrow', label:'Check arc'},
      {fn:'pacing', icon:'speedometer2', label:'Check pacing'},
      {fn:'subplotIdeas', icon:'diagram-3', label:'Subplot ideas'}
    ],
    cast: [
      {fn:'characterArc', icon:'graph-up-arrow', label:'Build arc'},
      {fn:'relationshipMap', icon:'diagram-2', label:'Relationships'},
      {fn:'voiceCheck', icon:'chat-quote', label:'Voice check'}
    ],
    timeline: [
      {fn:'chronologyCheck', icon:'clock-history', label:'Check chronology'},
      {fn:'addForeshadow', icon:'moon-stars', label:'Add foreshadow'},
      {fn:'emotionalBeat', icon:'heart', label:'Emotional beat'}
    ]
  },
  screenplay: {
    write: [
      {fn:'sceneDesc', icon:'camera-reels', label:'Scene description'},
      {fn:'dialogue', icon:'chat-dots', label:'Add dialogue'},
      {fn:'conflict', icon:'lightning-charge', label:'Heighten conflict'},
      {fn:'subtext', icon:'chat-quote', label:'Add subtext'},
      {fn:'formatFix', icon:'check2-square', label:'Fix formatting'},
      {fn:'logline', icon:'flag', label:'Write logline'}
    ],
    scenes: [
      {fn:'sceneBreakdown', icon:'list-ol', label:'Break down scenes'},
      {fn:'beatFromScene', icon:'grid', label:'Beat from scenes'},
      {fn:'sceneOrder', icon:'arrow-down-up', label:'Reorder scene'}
    ],
    beatsheet: [
      {fn:'saveTheCat', icon:'grid-3x3', label:'Save the Cat beats'},
      {fn:'threeAct', icon:'diagram-3', label:'Three-act structure'},
      {fn:'beatGenerate', icon:'magic', label:'Generate beats'}
    ],
    shots: [
      {fn:'shotSuggest', icon:'camera-reels', label:'Suggest shots'},
      {fn:'shotStyle', icon:'palette', label:'Shot style'},
      {fn:'coverage', icon:'grid', label:'Coverage plan'}
    ]
  },
};

function getAIActions(){
  const m = S.mode;
  const p = S.page;
  const matrix = AI_MATRIX[m];
  if(matrix){
    if(matrix[p]) return matrix[p];
    if(matrix.write) return matrix.write;
  }
  return [
    {fn:'continue', icon:'arrow-right-circle', label:'Continue'},
    {fn:'expand', icon:'arrows-angle-expand', label:'Expand'},
    {fn:'improve', icon:'stars', label:'Improve'},
    {fn:'rewrite', icon:'arrow-repeat', label:'Rewrite'}
  ];
}

// ═══════════════════════════════════════════════════════════
//   AI FUNCTIONS — universal + mode/page specific
// ═══════════════════════════════════════════════════════════

const AI_FNS = {};

AI_FNS.fixGrammar = async () => {
  const t = edTxt();
  if(!t) return toast('Editor empty', 'warn');
  await runAI(`Fix all grammar, spelling, tense. Convert Hinglish to proper ${langNm()} if needed. Keep meaning.\n\n"""\n${t}\n"""`, 'Grammar fixed', langNm());
};

AI_FNS.translate = async () => {
  const t = ctxTxt();
  if(!t) return toast('Editor empty', 'warn');
  await runAI(`Translate to ${langNm()}. Preserve tone and paragraphs.\n\n"""\n${t}\n"""`, 'Translated', `→ ${langNm()}`);
};

// ── Hinglish ⇄ Hindi / English ──────────────────────────────────────────
// Hinglish is Hindi written in Roman script, usually mixed with English.
// Both directions keep the meaning, the tone and the writer's own words.
AI_FNS.hinglishToHindi = async () => {
  const t = ctxTxt();
  if(!t) return toast('Nothing selected', 'warn');
  await runAI(
    'The text below is Hinglish — Hindi written in Roman script, usually mixed with English words.\n' +
    'Rewrite it as natural Hindi in Devanagari script.\n' +
    'Rules: keep the meaning, the tone and every detail exactly as written; keep proper nouns, place names, brands and technical terms in their usual form; do not summarise, expand, explain or add anything; return only the Hindi text.\n\n"""\n' + t + '\n"""',
    'हिन्दी', 'Hinglish → Hindi (Devanagari)');
};

AI_FNS.hinglishToEnglish = async () => {
  const t = ctxTxt();
  if(!t) return toast('Nothing selected', 'warn');
  await runAI(
    'The text below is Hinglish — Hindi written in Roman script, usually mixed with English words.\n' +
    'Rewrite it as natural, fluent English.\n' +
    'Rules: keep the meaning, the tone and every detail exactly as written; do not summarise, expand, explain or add anything; return only the English text.\n\n"""\n' + t + '\n"""',
    'English', 'Hinglish → English');
};

// ── Organise from the writer's own words (experimental) ─────────────────
// The point is that the paragraph stays YOURS: the AI may only rearrange and
// stitch — it adds a connective word where a sentence would otherwise break.
AI_FNS.organize = async () => {
  const t = ctxTxt();
  if(!t || !t.trim()) return toast('Write or select something first', 'warn');
  await runAI(
    'Reorganise the text below into clear, well-structured paragraphs.\n' +
    'Use the writer\'s own words and phrasing as far as possible. You may add only small connective words (and, but, so, because) where a sentence would otherwise read broken — nothing else.\n' +
    'Never invent facts, characters, places or details that are not already in the text. Keep the voice, the tense and the full meaning.\n' +
    'Your job is ordering, grouping and paragraph breaks: fix the flow without replacing the writing.\n' +
    'Return only the reworked text.\n\n"""\n' + t + '\n"""',
    'Organised', 'Your words, tidied into proper paragraphs');
};

AI_FNS.improve = async () => {
  const t = edTxt();
  if(!t) return toast('Editor empty', 'warn');
  const style = document.querySelector('[data-ai-style]')?.value || 'creative';
  await runAI(`Rewrite to be more ${style}. Keep meaning.\n\n"""\n${t}\n"""`, 'Improved', style);
};

AI_FNS.expand = async () => {
  const t = ctxTxt();
  await runAI(`Expand with more detail.\n\n"""\n${t}\n"""`, 'Expanded', '');
};

AI_FNS.summarize = async () => {
  const t = edTxt();
  if(!t) return toast('Empty', 'warn');
  await runAI(`Summarize concisely.\n\n"""\n${t}\n"""`, 'Summary', '');
};

AI_FNS.rewrite = async () => {
  const t = ctxTxt();
  await runAI(`Rewrite fresh. Same meaning.\n\n"""\n${t}\n"""`, 'Rewritten', '');
};

AI_FNS.continue = async () => {
  const t = edTxt();
  if(!t) return toast('Write something first', 'warn');
  try{
    const res = await callAI(`Continue this ${S.mode} text. Match style. Return only continuation.\n\n"""\n${t.slice(-2500)}\n"""`);
    const ed = $('editor');
    ed.innerHTML += res.split('\n\n').map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
    onInput();
    toast('Continued');
  }catch(e){ toast(e.message, 'err'); }
};

AI_FNS.custom = async () => {
  const inst = document.querySelector('[data-ai-custom]')?.value.trim();
  if(!inst) return toast('Enter instruction', 'warn');
  const t = ctxTxt();
  await runAI(`${inst}\n\n"""\n${t}\n"""`, 'Custom', inst);
};

// Mode-specific (many share base implementation)
function stub(fn, label, prompt){
  AI_FNS[fn] = async () => {
    const t = ctxTxt();
    if(!t && !prompt.includes('generate')) return toast('No text', 'warn');
    await runAI(prompt.replace('{text}', t.slice(-2500)), label, S.mode + ' · ' + S.page);
  };
}

// Screenplay
stub('sceneDesc', 'Scene description', 'Write a vivid cinematic scene description in proper screenplay format. Include INT./EXT., location, time, atmosphere, mood.\n\nContext:\n{text}');
stub('dialogue', 'Dialogue added', 'Add natural character-appropriate dialogue to this scene. Match tone and context.\n\n{text}');
stub('conflict', 'Conflict heightened', 'Suggest 3 ways to heighten conflict and tension. Include dialogue examples.\n\n{text}');
stub('subtext', 'Subtext added', 'Rewrite this dialogue with subtext — what characters really mean beneath the surface.\n\n{text}');
stub('formatFix', 'Format fixed', 'Fix the screenplay formatting following industry conventions (scene headings, action, character names, dialogue, parentheticals, transitions).\n\n{text}');
stub('logline', 'Logline', 'Write a compelling one-sentence logline: "When [inciting incident], a [protagonist] must [goal] before [stakes]."\n\n{text}');
stub('sceneBreakdown', 'Scene breakdown', 'Break these scenes into individual scene beats with location, time, characters, and purpose.\n\n{text}');
stub('beatFromScene', 'Beat from scenes', 'Extract the story beats from these scenes.\n\n{text}');
stub('sceneOrder', 'Scene reorder', 'Suggest better scene ordering for tension and pacing.\n\n{text}');
stub('saveTheCat', 'Save the Cat beats', 'Generate the 15 Save the Cat beats for this story.\n\n{text}');
stub('threeAct', 'Three-act structure', 'Structure this story with three-act breaks and key beats.\n\n{text}');
stub('beatGenerate', 'Beats generated', 'Generate 10 story beats for this outline.\n\n{text}');
stub('shotSuggest', 'Shot suggestions', 'Suggest specific camera shots for these scenes.\n\n{text}');
stub('shotStyle', 'Shot style', 'Suggest a visual style and shot language for this story.\n\n{text}');
stub('coverage', 'Coverage plan', 'Outline a coverage plan for filming this scene.\n\n{text}');

// TV
stub('teaser', 'Teaser', 'Write a compelling TV teaser (cold open). Punchy, hooks the audience.\n\n{text}');
stub('coldOpen', 'Cold open', 'Write a self-contained cold open for a TV episode.\n\n{text}');
stub('actBreak', 'Act break', 'Suggest a cliffhanger act break.\n\n{text}');
stub('episodeArc', 'Episode arc', 'Outline the arc of this episode.\n\n{text}');
stub('seasonThread', 'Season thread', 'Suggest a season-long narrative thread.\n\n{text}');
stub('characterArc', 'Character arc', 'Build a full character arc across episodes.\n\n{text}');

// Stage
stub('stageDir', 'Stage directions', 'Write detailed stage directions: movements, expressions, lighting, sound cues, blocking.\n\n{text}');
stub('monologue', 'Monologue', 'Write a powerful dramatic monologue.\n\n{text}');
stub('blocking', 'Blocking', 'Suggest stage blocking using standard terminology (DS, US, SL, SR).\n\n{text}');
stub('blockSuggest', 'Blocking suggestions', 'Suggest blocking positions for actors.\n\n{text}');
stub('stagePicture', 'Stage picture', 'Describe the stage picture for key moments.\n\n{text}');
stub('movement', 'Movement notes', 'Suggest character movement on stage.\n\n{text}');

// Poetry
stub('rhyme', 'Rhymes', 'Suggest rhyming words and phrases — perfect, near, and slant rhymes.\n\n{text}');
stub('meter', 'Meter analysis', 'Analyze meter/rhythm. Show scansion and suggest improvements.\n\n{text}');
stub('imagery', 'Imagery added', 'Enhance with vivid sensory imagery — sight, sound, smell, touch, taste.\n\n{text}');
stub('metaphor', 'Metaphors', 'Generate 5 powerful metaphors, similes, imagery.\n\n{text}');
stub('volta', 'Volta added', 'Add a volta (turn in argument) to this poem.\n\n{text}');
stub('refrain', 'Refrain', 'Build a repeating refrain.\n\n{text}');
stub('formSuggest', 'Form suggestion', 'Suggest a poetic form that would suit this content.\n\n{text}');
stub('linebreakSuggest', 'Line breaks', 'Suggest better line breaks.\n\n{text}');
stub('enjamb', 'Enjambment', 'Suggest enjambment to improve flow.\n\n{text}');
stub('rhymeFinder', 'Rhymes', 'Find perfect rhymes.\n\n{text}');
stub('nearRhymes', 'Near rhymes', 'Find near rhymes.\n\n{text}');
stub('slantRhymes', 'Slant rhymes', 'Find slant rhymes.\n\n{text}');

// Song
stub('lyrics', 'Lyrics', 'Write song lyrics with verse/chorus structure. Singable and emotional.\n\n{text}');
stub('chorus', 'Chorus', 'Write a catchy memorable chorus.\n\n{text}');
stub('bridge', 'Bridge', 'Write a bridge section with contrast.\n\n{text}');
stub('verseBuild', 'Verse build', 'Build a stronger verse.\n\n{text}');
stub('verseContrast', 'Verse contrast', 'Suggest contrast between verses.\n\n{text}');
stub('hookSuggest', 'Hook', 'Suggest a stronger hook.\n\n{text}');
stub('chorusRepeat', 'Chorus repeat', 'Suggest how to repeat the chorus effectively.\n\n{text}');

// Essay
stub('thesis', 'Thesis', 'Craft 3 strong, arguable thesis statements with rationale.\n\n{text}');
stub('argument', 'Argument', 'Strengthen this argument with evidence, logic, rhetoric.\n\n{text}');
stub('evidence', 'Evidence', 'Suggest supporting evidence, examples, statistics.\n\n{text}');
stub('counter', 'Counterargument', 'Generate counterarguments then rebuttals.\n\n{text}');
stub('conclusion', 'Conclusion', 'Write a strong conclusion that synthesizes.\n\n{text}');
stub('thesisStrong', 'Thesis', 'Strengthen this thesis.\n\n{text}');
stub('thesisOptions', 'Thesis options', 'Give 3 thesis options.\n\n{text}');
stub('thesisArguable', 'Arguable thesis', 'Make this thesis more arguable.\n\n{text}');
stub('evidenceFind', 'Evidence', 'Find evidence to support these claims.\n\n{text}');
stub('evidenceStrong', 'Stronger evidence', 'Strengthen evidence.\n\n{text}');
stub('evidenceSort', 'Sort evidence', 'Sort evidence by strength.\n\n{text}');

// Research
stub('abstract', 'Abstract', 'Write a 150-250 word academic abstract.\n\n{text}');
stub('method', 'Methodology', 'Suggest research methodology: design, sampling, data collection, analysis.\n\n{text}');
stub('formalize', 'Formalized', 'Convert to formal academic language.\n\n{text}');
stub('paraphrase', 'Paraphrased', 'Paraphrase in academic language. Avoid plagiarism.\n\n{text}');
stub('abstractGen', 'Abstract', 'Generate a structured abstract.\n\n{text}');
stub('abstractStruct', 'Abstract structure', 'Suggest abstract structure.\n\n{text}');
stub('keywordsGen', 'Keywords', 'Generate relevant keywords.\n\n{text}');
stub('citationAPA', 'APA citations', 'Format citations in APA.\n\n{text}');
stub('citationMLA', 'MLA citations', 'Format citations in MLA.\n\n{text}');
stub('citationFind', 'Find citations', 'Suggest citations.\n\n{text}');
stub('dataAnalyze', 'Data analysis', 'Analyze this data.\n\n{text}');
stub('dataVisualize', 'Visualize data', 'Suggest visualizations.\n\n{text}');
stub('dataDescribe', 'Describe data', 'Write a description of this data.\n\n{text}');

// Journal
stub('prompt', 'Journal prompt', 'Generate a thoughtful journaling prompt.');
stub('reflect', 'Reflection', 'Reflect on this entry. Identify themes, emotions, insights.\n\n{text}');
stub('gratitude', 'Gratitude', 'Generate gratitude prompts.');
stub('mood', 'Mood analysis', 'Analyze mood and emotional tone.\n\n{text}');
stub('moodPatterns', 'Mood patterns', 'Find emotional patterns.\n\n{text}');
stub('moodSuggest', 'Mood suggestions', 'Suggest habits based on mood.\n\n{text}');

// Blog
stub('hook', 'Hook', 'Generate 5 compelling opening hooks.\n\n{text}');
stub('cta', 'CTA', 'Generate 5 CTAs.\n\n{text}');
stub('headline', 'Headlines', 'Generate 5 headlines.\n\n{text}');
stub('headlineGen', 'Headlines', 'Generate catchy headlines.\n\n{text}');
stub('headlineSEO', 'SEO headlines', 'Generate SEO headlines.\n\n{text}');
stub('headlineHook', 'Clickable hooks', 'Generate clickable hooks.\n\n{text}');
stub('seoAnalyze', 'SEO', 'Analyze for SEO: keywords, meta description, tags.\n\n{text}');
stub('keywordsSEO', 'Keywords', 'Suggest SEO keywords.\n\n{text}');
stub('metaDesc', 'Meta description', 'Write a meta description.\n\n{text}');
stub('inverted', 'Inverted pyramid', 'Restructure using inverted pyramid.\n\n{text}');
stub('factcheck', 'Fact check', 'Review for factual claims needing verification.\n\n{text}');

// Comic
stub('panel', 'Panel description', 'Describe a comic panel: composition, angle, expressions, lighting.');
stub('bubble', 'Bubbles', 'Convert to punchy comic dialogue bubbles.\n\n{text}');
stub('caption', 'Captions', 'Write narrative captions.\n\n{text}');
stub('sfx', 'SFX', 'Generate comic sound effects.');

// Children
stub('simplify', 'Simplified', 'Simplify for ages 4-8.\n\n{text}');
stub('rhymeStory', 'Rhyming story', 'Rewrite as a rhyming children\'s tale.\n\n{text}');
stub('moral', 'Moral', 'Suggest an age-appropriate moral.\n\n{text}');
stub('illustrate', 'Illustration notes', 'Suggest illustrations for each scene.\n\n{text}');

// Code
stub('explain', 'Code explained', 'Explain this code clearly.\n\n{text}');
stub('refactor', 'Refactored', 'Refactor for readability and performance.\n\n{text}');
stub('debug', 'Debug analysis', 'Find bugs and provide fixes.\n\n{text}');
stub('document', 'Documented', 'Add documentation and comments.\n\n{text}');

// Novel plan
stub('beatSuggest', 'Beats suggested', 'Suggest story beats for this outline.\n\n{text}');
stub('arcCheck', 'Arc check', 'Check the story arc for pacing and coherence.\n\n{text}');
stub('pacing', 'Pacing', 'Analyze pacing.\n\n{text}');
stub('subplotIdeas', 'Subplot ideas', 'Suggest subplots.\n\n{text}');
stub('characterArc', 'Character arc', 'Build a detailed character arc.\n\n{text}');
stub('relationshipMap', 'Relationships', 'Map relationships between characters.\n\n{text}');
stub('voiceCheck', 'Voice check', 'Check character voice consistency.\n\n{text}');
stub('chronologyCheck', 'Chronology', 'Check chronological consistency.\n\n{text}');
stub('addForeshadow', 'Foreshadowing', 'Suggest foreshadowing.\n\n{text}');
stub('emotionalBeat', 'Emotional beats', 'Add emotional beats.\n\n{text}');

// Memoir
stub('memoryPrompts', 'Memory prompts', 'Suggest memory prompts for this passage.\n\n{text}');
stub('timelineAnchor', 'Timeline anchor', 'Suggest how to anchor this to a timeline.\n\n{text}');

// Speech
stub('cueCards', 'Cue cards', 'Generate cue cards for this speech.\n\n{text}');
stub('timing', 'Timing', 'Estimate speaking time and suggest pacing.\n\n{text}');
stub('opening', 'Opening', 'Write a strong opening.\n\n{text}');
stub('closing', 'Closing', 'Write a strong closing.\n\n{text}');

// Recipe
stub('ingredientList', 'Ingredients', 'Format an ingredient list.\n\n{text}');
stub('stepDetail', 'Steps', 'Detail the steps clearly.\n\n{text}');
stub('tips', 'Tips', 'Add tips and tricks.\n\n{text}');
stub('variations', 'Variations', 'Suggest variations.\n\n{text}');

// Scripture
stub('commentary', 'Commentary', 'Write commentary on this passage.\n\n{text}');
stub('crossref', 'Cross-refs', 'Suggest cross-references.\n\n{text}');
stub('application', 'Application', 'Suggest personal application.\n\n{text}');

// Interview
stub('questionGen', 'Questions', 'Generate interview questions.\n\n{text}');
stub('followupGen', 'Follow-ups', 'Generate follow-up questions.\n\n{text}');
stub('showDontTell', 'Show not tell', 'Rewrite following "show, don\'t tell".\n\n{text}');
stub('character', 'Character depth', 'Deepen this character.\n\n{text}');

// ═══════════════════════════════════════════════════════════
//   AI PANEL — mode + page aware
// ═══════════════════════════════════════════════════════════

function buildAIPanel(){
  const panel = $('aiPanel');
  const body = $('aiBody');
  if(!panel || !body) return;

  const actions = getAIActions();
  const modeName = currentMode()?.name || 'Novel';
  const pageName = currentPageDef()?.name || 'Write';

  body.innerHTML = `
    <div class="ai-label">${modeName} · ${pageName}</div>

    <div class="ai-chips">
      <button class="ai-chip primary" data-ai="fixGrammar"><i class="bi bi-magic"></i> Fix</button>
      <button class="ai-chip" data-ai="translate"><i class="bi bi-translate"></i> Translate</button>
      <button class="ai-chip" data-ai="improve"><i class="bi bi-stars"></i> Improve</button>
      <button class="ai-chip" data-ai="summarize"><i class="bi bi-card-text"></i> Summarize</button>
    </div>

    <div class="ai-label" data-ai-translate-sub hidden>Hinglish → Hindi / English</div>
    <div class="ai-chips" data-ai-translate-sub hidden style="margin-left:14px;">
      <button class="ai-chip" data-ai="hinglishToHindi"><i class="bi bi-arrow-return-right"></i> Hinglish → हिन्दी</button>
      <button class="ai-chip" data-ai="hinglishToEnglish"><i class="bi bi-arrow-return-right"></i> Hinglish → English</button>
    </div>

    ${S.config.expOrganize ? `
      <div class="ai-label">From your own words</div>
      <div class="ai-chips">
        <button class="ai-chip" data-ai="organize"><i class="bi bi-list-nested"></i> Organise my words</button>
      </div>
    ` : ''}

    <div style="display:flex;gap:6px;">
      <select class="ai-select" data-ai-style style="flex:1;">
        <option value="creative">Creative</option>
        <option value="formal">Formal</option>
        <option value="casual">Casual</option>
        <option value="poetic">Poetic</option>
        <option value="dramatic">Dramatic</option>
        <option value="simple">Simple</option>
      </select>
      <select class="ai-select" data-ai-lang style="flex:1;"></select>
    </div>

    <div class="ai-label">Actions for ${pageName}</div>
    <div class="ai-chips">
      ${actions.map(a => `<button class="ai-chip" data-ai="${a.fn}"><i class="bi bi-${a.icon}"></i> ${a.label}</button>`).join('')}
    </div>

    <div class="ai-label">Custom instruction</div>
    <div style="display:flex;gap:6px;">
      <input class="ai-input" data-ai-custom placeholder="Ask anything…">
      <button class="ai-chip primary" data-ai="custom"><i class="bi bi-send"></i></button>
    </div>
  `;

  // Populate lang select with grouped Intl / Indian
   const langSel = body.querySelector('[data-ai-lang]');
  if(langSel){
    [ {code:'en',name:'English',flag:'🇬🇧'}, {code:'hi',name:'Hindi',flag:'🇮🇳'} ].forEach(l => {
      const o = document.createElement('option');
      o.value = l.code; o.textContent = `${l.flag} ${l.name}`;
      if(l.code === S.config.defaultLang) o.selected = true;
      langSel.appendChild(o);
    });
    langSel.addEventListener('change', e => {
      S.config.defaultLang = e.target.value;
      save();
    });
  }
}


function toggleAIPanel(){
  const p = $('aiPanel');
  if(!p) return;
  const isOpen = p.classList.contains('open');
  if(isOpen){
    p.classList.remove('open');
  } else {
    buildAIPanel();
    p.classList.add('open');
  }
}

function initAIDrag(){
  const head = $('aiHead');
  const panel = $('aiPanel');
  if(!head || !panel) return;
  let dragging = false, ox = 0, oy = 0;
  const start = (x, y) => {
    dragging = true;
    const r = panel.getBoundingClientRect();
    ox = x - r.left;
    oy = y - r.top;
    panel.style.right = 'auto';
    panel.style.left = r.left + 'px';
    panel.style.top = r.top + 'px';
  };
  const move = (x, y) => {
    if(!dragging) return;
    panel.style.left = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, x - ox)) + 'px';
    panel.style.top = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, y - oy)) + 'px';
  };
  head.addEventListener('mousedown', e => {
    if(e.target.closest('button')) return;
    start(e.clientX, e.clientY);
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  document.addEventListener('mouseup', () => { dragging = false; });
}

// Called by write.js on input — refresh panel if open
AI.onEditorChange = function(){
  const p = $('aiPanel');
  if(p && p.classList.contains('open')){
    // optional: could auto-refresh suggestions
  }
};

// ═══════════════════════════════════════════════════════════
//   EVENT WIRING
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;
  const aiEl = t.closest('[data-ai]');
  if(aiEl){
    e.preventDefault();
    const fn = aiEl.dataset.ai;
    // the right-click FAB panel manages Translate itself (app.js opens the
    // translator popup instead of running the action)
    if(!(aiEl.closest('.fab-ai') && fn === 'translate') && AI_FNS[fn]) AI_FNS[fn]();
    return;
  }
  // Translate toggles the Hinglish sub-options inside the panel
  if(t.closest('.ai-chips') && t.closest('.panel-shell, .ai-panel') && t.textContent.trim() === 'Translate'){
    e.preventDefault();
    document.querySelectorAll('[data-ai-translate-sub]').forEach(el => { el.hidden = !el.hidden; });
    return;
  }
  if(t.closest('[data-act="result-close"]')){ closeResult(); return; }
  if(t.closest('[data-act="result-apply"]')){ applyResult(); return; }
  if(t.closest('[data-act="result-append"]')){ appendResult(); return; }
  if(t.closest('[data-act="result-copy"]')){ copyResult(); return; }
  if(t.closest('[data-act="result-insert"]')){ insertResult(); return; }
  if(t.closest('[data-act="result-retry"]')){ retryResult(); return; }
  if(t.closest('[data-act="ai-toggle"]')){ e.preventDefault(); toggleAIPanel(); return; }
  if(t.closest('[data-act="ai-close"]')){ $('aiPanel')?.classList.remove('open'); return; }
  if(t.closest('[data-act="ai-min"]')){
    const p = $('aiPanel');
    if(p) p.classList.toggle('min');
  }
}, true);

// ═══════════════════════════════════════════════════════════
//   EXPORT
// ═══════════════════════════════════════════════════════════

window.AI = AI;
window.AI_FNS = AI_FNS;
window.callAI = callAI;
window.fetchModels = fetchModels;
window.testConn = testConn;
window.runAI = runAI;
window.showResult = showResult;
window.closeResult = closeResult;
window.applyResult = applyResult;
window.appendResult = appendResult;
window.copyResult = copyResult;
window.buildAIPanel = buildAIPanel;
window.toggleAIPanel = toggleAIPanel;
window.initAIDrag = initAIDrag;
window.selTxt = selTxt;
window.edTxt = edTxt;
window.ctxTxt = ctxTxt;
window.langNm = langNm;
window.getAIActions = getAIActions;
window.AI_MATRIX = AI_MATRIX;
window.AI_EXP = function(){ return !!S.config.expOrganize; };

console.log('%c ✓ ai.js loaded (mode+page aware)', 'color:#10b981;font-weight:600;');


/* ══════════ plugins.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Plugins
   Wolfram · Dictionary · Image · Web · More
   Everything renders inline (no browser tabs)
   ═══════════════════════════════════════════════════════════ */

const PLUGINS = {};

// ═══════════════════════════════════════════════════════════
//   WEB SEARCH — inline results
// ═══════════════════════════════════════════════════════════

PLUGINS.openWebSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-head modal-head-bare">
        <h2 class="sr-only">Text search</h2>
        <button class="icon-btn v-close" data-act="ws-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input class="tb-input" id="wsQuery" placeholder="Search the web…" style="flex:1;">
          <button class="btn btn-primary" data-act="ws-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div class="chips" style="margin-bottom:16px;">
          <button class="chip on" data-ws-src="ddg"><i class="bi bi-search"></i> DuckDuckGo</button>
          <button class="chip" data-ws-src="wiki"><i class="bi bi-book"></i> Wikipedia</button>
          <button class="chip" data-ws-src="dict"><i class="bi bi-file-text"></i> Dictionary</button>
          <button class="chip" data-ws-src="thes"><i class="bi bi-shuffle"></i> Thesaurus</button>
          <button class="chip" data-ws-src="wolf"><i class="bi bi-calculator"></i> Wolfram</button>
          <button class="chip" data-ws-src="idiom"><i class="bi bi-chat-quote"></i> Idioms</button>
          <button class="chip" data-ws-src="quote"><i class="bi bi-quote"></i> Quotes</button>
          <button class="chip" data-ws-src="images"><i class="bi bi-image"></i> Images</button>
          <button class="chip" data-ws-src="books"><i class="bi bi-book-half"></i> Books</button>
        </div>
        <div id="wsResults">
          Type a query and click a source. Results appear here — never leaves the app.
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  const srcBtns = scrim.querySelectorAll('[data-ws-src]');
  srcBtns.forEach(b => {
    b.addEventListener('click', () => {
      srcBtns.forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      PLUGINS._wsSrc = b.dataset.wsSrc;
      if($('wsQuery')?.value.trim()) PLUGINS.runSearch(b.dataset.wsSrc);
    });
  });
  PLUGINS._wsSrc = 'ddg';
  $('wsQuery').focus();
  $('wsQuery').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); PLUGINS.runSearch(PLUGINS._wsSrc); }
  });
};

PLUGINS.runSearch = async function(src){
  const q = $('wsQuery')?.value.trim();
  if(!q){ toast('Enter a query', 'warn'); return; }
  const box = $('wsResults');
  if(!box) return;
  if(src === 'images'){ return PLUGINS.renderImagesInline(q, box); }
  box.innerHTML = '<div class="spin" style="display:inline-block;width:22px;height:22px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;"></div> Searching…';

  try{
    if(src === 'wiki') return PLUGINS.renderWiki(q, box);
    if(src === 'dict') return PLUGINS.renderDict(q, box);
    if(src === 'thes') return PLUGINS.renderThes(q, box);
    if(src === 'wolf') return PLUGINS.renderWolfram(q, box);
    if(src === 'idiom') return PLUGINS.renderIdioms(q, box);
    if(src === 'quote') return PLUGINS.renderQuotes(q, box);
    if(src === 'books') return PLUGINS.renderBooks(q, box);
    return PLUGINS.renderDDG(q, box);
  }catch(e){
    box.innerHTML = `<div style="color:var(--err);">${esc(e.message)}</div>`;
  }
};

PLUGINS.renderWiki = async function(q, box){
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
  if(!r.ok) throw new Error('Not found');
  const d = await r.json();
  box.innerHTML = `
    <div style="font-size:18px;font-weight:700;color:var(--ink);margin-bottom:8px;">${esc(d.title)}</div>
    ${d.thumbnail ? `<img src="${esc(d.thumbnail.source)}" style="max-width:200px;border-radius:8px;margin-bottom:12px;">` : ''}
    <div style="line-height:1.75;">${esc(d.extract)}</div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;gap:10px;font-size:11.5px;">
      <button class="btn btn-ghost" data-ref-from-wiki="${esc(d.title)}"><i class="bi bi-bookmark-plus"></i> Save as reference</button>
      <a href="${esc(d.content_urls?.desktop?.page || '#')}" target="_blank" rel="noopener" style="color:var(--info);display:flex;align-items:center;gap:4px;">
        <i class="bi bi-box-arrow-up-right"></i> Open full article
      </a>
    </div>
  `;
  const saveBtn = box.querySelector('[data-ref-from-wiki]');
  if(saveBtn){
    saveBtn.addEventListener('click', () => {
      D().references.push({
        id: uid(), type: 'url', title: d.title,
        url: d.content_urls?.desktop?.page || '',
        content: d.extract, created: Date.now()
      });
      save();
      toast('Reference saved');
      closeModal();
    });
  }
};

PLUGINS.renderDict = async function(q, box){
  // Try dictionaryapi.dev first
  try{
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
    if(r.ok){
      const d = await r.json();
      const w = d[0];
      let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);">${esc(w.word)}</div>`;
      if(w.phonetic) html += `<div class="muted" style="margin-bottom:10px;">${esc(w.phonetic)}</div>`;
      w.meanings.slice(0, 4).forEach(m => {
        html += `<div style="margin-top:12px;font-weight:600;color:var(--ink);">${esc(m.partOfSpeech)}</div>`;
        m.definitions.slice(0, 3).forEach(def => {
          html += `<div style="margin-top:5px;line-height:1.6;">• ${esc(def.definition)}</div>`;
          if(def.example) html += `<div style="margin-left:14px;font-style:italic;color:var(--ink-3);font-size:12px;">"${esc(def.example)}"</div>`;
        });
      });
      box.innerHTML = html;
      return;
    }
  }catch(e){}
  // Fallback: Wiktionary
  const r2 = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(q)}`);
  if(!r2.ok) throw new Error('Word not found');
  const d2 = await r2.json();
  const en = d2.en?.[0];
  if(!en) throw new Error('Not in Wiktionary');
  let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);margin-bottom:10px;">${esc(q)}</div>`;
  html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">${esc(en.partOfSpeech)}</div>`;
  (en.definitions || []).slice(0, 5).forEach(def => {
    html += `<div style="margin-top:5px;line-height:1.6;">• ${esc(def.definition.replace(/<[^>]+>/g, ''))}</div>`;
  });
  box.innerHTML = html;
};

PLUGINS.renderThes = async function(q, box){
  const [syn, rhy, ant] = await Promise.all([
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=30`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=25`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(q)}&max=15`).then(r => r.json())
  ]);
  let html = `<div style="font-size:18px;font-weight:700;color:var(--accent-2);margin-bottom:16px;">${esc(q)}</div>`;
  if(syn.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Synonyms</div>
      <div class="chips" style="margin-bottom:18px;">
        ${syn.slice(0, 24).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(ant.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Antonyms</div>
      <div class="chips" style="margin-bottom:18px;">
        ${ant.slice(0, 12).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(rhy.length){
    html += `<div style="font-weight:600;margin-bottom:8px;color:var(--ink);">Rhymes</div>
      <div class="chips">
        ${rhy.slice(0, 20).map(s => `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`).join('')}
      </div>`;
  }
  if(!syn.length && !rhy.length && !ant.length) html += `<div class="muted">No results.</div>`;
  box.innerHTML = html;
};

PLUGINS.renderWolfram = async function(q, box){
  const appId = S.config.wolframAppId;
  if(!appId){
    box.innerHTML = `
      <div style="padding:12px;background:var(--surface-3);border-radius:10px;border-left:3px solid var(--warn);">
        <div style="font-weight:700;color:var(--warn);margin-bottom:6px;"><i class="bi bi-exclamation-triangle"></i> Wolfram AppID required</div>
        <div style="line-height:1.6;margin-bottom:12px;">Wolfram Alpha is free but needs an AppID. Get yours at <a href="https://developer.wolframalpha.com/" target="_blank" rel="noopener">developer.wolframalpha.com</a> → sign up → get AppID.</div>
        <div style="display:flex;gap:8px;">
          <input class="tb-input" id="wolfIdInput" placeholder="Paste your AppID..." style="flex:1;padding:8px 12px;font-size:12px;">
          <button class="btn btn-primary" id="wolfSave">Save</button>
        </div>
      </div>`;
    $('wolfSave')?.addEventListener('click', () => {
      const v = $('wolfIdInput')?.value.trim();
      if(!v) return;
      S.config.wolframAppId = v;
      save();
      toast('AppID saved');
      PLUGINS.renderWolfram(q, box);
    });
    return;
  }
  const url = `https://api.wolframalpha.com/v1/result?i=${encodeURIComponent(q)}&appid=${appId}`;
  const r = await fetch(url);
  if(r.status === 501){ box.innerHTML = `<div class="muted">Wolfram couldn't interpret that. Try a different query.</div>`; return; }
  if(r.status === 403){ box.innerHTML = `<div style="color:var(--err);">Invalid AppID. Check your Wolfram AppID in Settings → AI.</div>`; return; }
  if(!r.ok) throw new Error(`Wolfram error ${r.status}`);
  const txt = await r.text();
  box.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--ink-3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Wolfram result</div>
    <div style="font-size:17px;line-height:1.6;color:var(--ink);">${esc(txt)}</div>
  `;
};

/* ── Public-domain books — Project Gutenberg, through the free Gutendex API.
   Search a title, an author or a subject, keep the book as a reference. ── */
PLUGINS.renderBooks = async function(q, box){
  const r = await fetch('https://gutendex.com/books?search=' + encodeURIComponent(q));
  if(!r.ok) throw new Error('Book search failed');
  const d = await r.json();
  const list = (d.results || []).slice(0, 8);
  if(!list.length){ box.innerHTML = '<div class="muted">No public-domain book matched that.</div>'; return; }

  box.innerHTML = '<div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-4);margin-bottom:8px;">Project Gutenberg</div>'
    + list.map(function(b){
        const author = (b.authors && b.authors[0] && b.authors[0].name) || 'Unknown';
        const page   = 'https://www.gutenberg.org/ebooks/' + b.id;
        return '<div style="padding:9px 0;border-top:1px solid var(--line);">'
          + '<div style="font-weight:600;color:var(--ink);">' + esc(b.title) + '</div>'
          + '<div class="muted" style="font-size:11.5px;margin:2px 0 6px;">' + esc(author)
          + (b.download_count ? ' · ' + b.download_count.toLocaleString() + ' downloads' : '') + '</div>'
          + '<div style="display:flex;gap:10px;align-items:center;">'
          +   '<button class="btn btn-ghost" data-gut-save="' + b.id + '"><i class="bi bi-bookmark-plus"></i> Save as reference</button>'
          +   '<a href="' + page + '" target="_blank" rel="noopener" style="color:var(--info);display:flex;align-items:center;gap:4px;font-size:11.5px;"><i class="bi bi-box-arrow-up-right"></i> Read it</a>'
          + '</div></div>';
      }).join('');

  box.querySelectorAll('[data-gut-save]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const id = btn.dataset.gutSave;
      const item = list.filter(function(b){ return String(b.id) === String(id); })[0];
      if(!item) return;
      const author = (item.authors && item.authors[0] && item.authors[0].name) || 'Unknown';
      const page   = 'https://www.gutenberg.org/ebooks/' + item.id;
      const d0 = (typeof D === 'function') ? D() : null;
      if(!d0) return;
      if(!Array.isArray(d0.references)) d0.references = [];
      d0.references.push({ id: uid(), type:'url', title: item.title + ' — ' + author, url: page, content:'', created: Date.now() });
      if(typeof save === 'function') save();
      if(typeof toast === 'function') toast('Reference saved');
      closeModal();
    });
  });
};

PLUGINS.renderIdioms = async function(q, box){
  // Use Datamuse to find similar words, then show idiomatic
  const [syn, tags] = await Promise.all([
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=20`).then(r => r.json()),
    fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q + ' idiom')}&max=10`).then(r => r.json())
  ]);
  let html = `<div style="font-size:16px;font-weight:700;color:var(--accent-2);margin-bottom:14px;">Related to "${esc(q)}"</div>`;
  html += `<div class="chips">`;
  [...syn.slice(0, 15), ...tags.slice(0, 8)].forEach(s => {
    html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`;
  });
  html += `</div>`;
  box.innerHTML = html;
};

PLUGINS.renderQuotes = async function(q, box){
  // Quotes: use ZenQuotes API (free, CORS-friendly)
  try{
    const r = await fetch('https://zenquotes.io/api/random');
    const d = await r.json();
    if(Array.isArray(d) && d[0]){
      box.innerHTML = `
        <div style="font-size:16px;line-height:1.7;font-style:italic;color:var(--ink);margin-bottom:14px;">"${esc(d[0].q)}"</div>
        <div style="font-size:13px;color:var(--ink-3);">— ${esc(d[0].a)}</div>
        <div style="margin-top:16px;">
          <button class="btn btn-ghost" id="qNew"><i class="bi bi-shuffle"></i> Another quote</button>
        </div>`;
      $('qNew')?.addEventListener('click', () => PLUGINS.renderQuotes(q, box));
      return;
    }
  }catch(e){}
  // Fallback: static set
  const fallback = [
    {q:'The scariest moment is always just before you start.', a:'Stephen King'},
    {q:'There is nothing to writing. All you do is sit down at a typewriter and bleed.', a:'Ernest Hemingway'},
    {q:'You can always edit a bad page. You can\'t edit a blank page.', a:'Jodi Picoult'},
    {q:'If there\'s a book that you want to read, but it hasn\'t been written yet, then you must write it.', a:'Toni Morrison'},
    {q:'Start writing, no matter what. The water does not flow until the faucet is turned on.', a:'Louis L\'Amour'}
  ];
  const pick = fallback[Math.floor(Math.random() * fallback.length)];
  box.innerHTML = `
    <div style="font-size:16px;line-height:1.7;font-style:italic;color:var(--ink);margin-bottom:14px;">"${esc(pick.q)}"</div>
    <div style="font-size:13px;color:var(--ink-3);">— ${esc(pick.a)}</div>
    <div style="margin-top:16px;">
      <button class="btn btn-ghost" id="qNew"><i class="bi bi-shuffle"></i> Another quote</button>
    </div>`;
  $('qNew')?.addEventListener('click', () => PLUGINS.renderQuotes(q, box));
};

/* Images tab — the image-search gallery, inline in the web search panel */
PLUGINS.renderImagesInline = async function(q, box){
  box.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';
  const oldImg = PLUGINS._imgGridSave;
  try{
    // reuse the existing image-search pipeline against a temp grid
    const tmp = document.createElement('div');
    tmp.id = 'imgGrid';
    tmp.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;';
    box.innerHTML = '';
    box.appendChild(tmp);
    // runImageSearch reads #imgQuery and #imgGrid — provide them
    let qi = $('imgQuery');
    const created = !qi;
    if(created){
      qi = document.createElement('input');
      qi.id = 'imgQuery';
      qi.style.display = 'none';
      document.body.appendChild(qi);
    }
    qi.value = q;
    const realGrid = $('imgGrid');
    await PLUGINS.runImageSearchInto(tmp, q);
    if(created) qi.remove();
  }catch(e){
    box.innerHTML = '<div class="muted" style="padding:20px;">Image search failed: ' + esc(e.message) + '</div>';
  }
};

/* Core of runImageSearch that writes into any given grid element */
PLUGINS.runImageSearchInto = async function(g, q){
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';
  try{
    // Wikimedia commons search
    const src = PLUGINS._imgSrc || 'commons';
    if(src === 'unsplash'){
      g.innerHTML = '';
      for(let i = 0; i < 12; i++){
        const url = `https://source.unsplash.com/400x300/?${encodeURIComponent(q)}&sig=${Date.now() + i}`;
        const card = document.createElement('div');
        card.style.cssText = 'border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;';
        card.innerHTML = `<img src="${url}" loading="lazy" style="width:100%;height:110px;object-fit:cover;display:block;">`;
        card.onclick = () => { insertHTML(`<img src="${url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); toast('Inserted'); };
        g.appendChild(card);
      }
      return;
    }
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap%20${encodeURIComponent(q)}&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query && d.query.pages ? Object.values(d.query.pages) : [];
    if(!pages.length){ g.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px;">No images found.</div>'; return; }
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo && p.imageinfo[0];
      if(!info) return;
      const url = info.thumburl || info.url;
      const card = document.createElement('div');
      card.style.cssText = 'border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;';
      card.innerHTML = `<img src="${esc(url)}" loading="lazy" style="width:100%;height:110px;object-fit:cover;display:block;">`;
      card.onclick = () => { insertHTML(`<img src="${esc(url)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); toast('Inserted'); };
      g.appendChild(card);
    });
  }catch(e){
    g.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:30px;">Image search failed: ' + esc(e.message) + '</div>';
  }
};

PLUGINS.renderDDG = async function(q, box){
  const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
  const d = await r.json();
  let html = '';
  if(d.AbstractText){
    html += `<div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:8px;">${esc(d.Heading || q)}</div>`;
    html += `<div style="line-height:1.75;margin-bottom:14px;">${esc(d.AbstractText)}</div>`;
    if(d.AbstractSource) html += `<div class="tiny muted" style="margin-bottom:12px;">Source: ${esc(d.AbstractSource)}</div>`;
    if(d.AbstractURL) html += `<a href="${esc(d.AbstractURL)}" target="_blank" rel="noopener" style="color:var(--info);font-size:12px;display:inline-flex;align-items:center;gap:4px;margin-bottom:14px;"><i class="bi bi-box-arrow-up-right"></i> Read full</a>`;
  }
  if(d.RelatedTopics?.length){
    html += `<div style="font-weight:600;color:var(--ink);margin:16px 0 10px;">Related</div>`;
    d.RelatedTopics.slice(0, 8).forEach(rt => {
      if(rt.Text){
        const title = rt.Text.split(' - ')[0];
        const snippet = rt.Text.split(' - ')[1] || '';
        html += `<div style="padding:10px 0;border-bottom:1px solid var(--line);">
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">${esc(title)}</div>
          ${snippet ? `<div style="font-size:12px;color:var(--ink-3);">${esc(snippet.slice(0, 160))}</div>` : ''}
          ${rt.FirstURL ? `<a href="${esc(rt.FirstURL)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--info);margin-top:4px;display:inline-block;">${esc(rt.FirstURL.slice(0, 50))}…</a>` : ''}
        </div>`;
      }
    });
  }
  if(!html){
    html = '<div class="muted" style="padding:20px;text-align:center;">No instant answer for "' + esc(q) + '". Try Wikipedia or another source above.</div>';
  }
  box.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════
//   IMAGE SEARCH — inline gallery, insert directly
// ═══════════════════════════════════════════════════════════

PLUGINS.openImageSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-head modal-head-bare">
        <h2 class="sr-only">Image search</h2>
        <button class="icon-btn v-close" data-act="img-close">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input class="tb-input" id="imgQuery" placeholder="Search images…" style="flex:1;">
          <button class="btn btn-primary" data-act="img-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div class="chips" style="margin-bottom:14px;">
          <button class="chip on" data-img-src="commons"><i class="bi bi-globe"></i> Wikimedia</button>
          <button class="chip" data-img-src="unsplash"><i class="bi bi-image"></i> Unsplash</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input class="tb-input" id="imgUrl" placeholder="Or paste an image URL…" style="flex:1;">
          <button class="btn btn-ghost" data-act="img-url"><i class="bi bi-check-lg"></i> Insert URL</button>
        </div>
        <div id="imgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
          <div class="muted" style="grid-column:1/-1;text-align:center;padding:32px 12px;font-size:12.5px;color:var(--ink-4);">Search or paste a URL above.</div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  PLUGINS._imgSrc = 'commons';
  scrim.querySelectorAll('[data-img-src]').forEach(b => {
    b.addEventListener('click', () => {
      scrim.querySelectorAll('[data-img-src]').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      PLUGINS._imgSrc = b.dataset.imgSrc;
    });
  });
  $('imgQuery').focus();
  $('imgQuery').addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); PLUGINS.runImageSearch(); }
  });
};

PLUGINS.runImageSearch = async function(){
  const q = $('imgQuery')?.value.trim();
  if(!q) return toast('Enter search term', 'warn');
  const g = $('imgGrid');
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:26px;height:26px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';

  try{
    if(PLUGINS._imgSrc === 'unsplash'){
      // Unsplash source (no key) — direct URLs
      g.innerHTML = '';
      for(let i = 0; i < 12; i++){
        const url = `https://source.unsplash.com/400x300/?${encodeURIComponent(q)}&sig=${Math.random()}`;
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:100%;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 160ms;';
        img.onmouseenter = () => img.style.transform = 'scale(1.04)';
        img.onmouseleave = () => img.style.transform = '';
        img.onclick = () => {
          insertHTML(`<img src="${url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
          closeModal();
          toast('Image inserted');
        };
        g.appendChild(img);
      }
      return;
    }
    // Wikimedia Commons (reliable)
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query?.pages ? Object.values(d.query.pages) : [];
    if(!pages.length) throw new Error('No results');
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo?.[0];
      if(!info) return;
      const img = document.createElement('img');
      img.src = info.thumburl;
      img.style.cssText = 'width:100%;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 160ms;border:2px solid transparent;';
      img.onmouseenter = () => { img.style.transform = 'scale(1.04)'; img.style.borderColor = 'var(--accent)'; };
      img.onmouseleave = () => { img.style.transform = ''; img.style.borderColor = 'transparent'; };
      img.onclick = () => {
        insertHTML(`<img src="${info.url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
        closeModal();
        toast('Image inserted');
      };
      g.appendChild(img);
    });
  }catch(e){
    g.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--err);">
        ${esc(e.message)}
      </div>
      <div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;">
        <a href="https://unsplash.com/s/photos/${encodeURIComponent(q)}" target="_blank" rel="noopener">Open Unsplash →</a>
      </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
//   HINGLISH TRANSLITERATION (rules-based, offline)
// ═══════════════════════════════════════════════════════════

const HING_MAP = {
  'namaste':'नमस्ते','kaise':'कैसे','kya':'क्या','kyun':'क्यों','hai':'है','hain':'हैं',
  'tha':'था','thi':'थी','the':'थे','main':'मैं','hum':'हम','tum':'तुम','aap':'आप',
  'woh':'वह','yeh':'यह','mera':'मेरा','meri':'मेरी','aur':'और','lekin':'लेकिन',
  'bhi':'भी','bahut':'बहुत','thoda':'थोड़ा','achha':'अच्छा','khana':'खाना','pani':'पानी',
  'dost':'दोस्त','pyaar':'प्यार','dil':'दिल','zindagi':'ज़िंदगी','khushi':'खुशी',
  'aaj':'आज','kal':'कल','abhi':'अभी','phir':'फिर','baad':'बाद','pehle':'पहले',
  'ek':'एक','do':'दो','teen':'तीन','char':'चार','paanch':'पाँच','das':'दस',
  'sab':'सब','kuch':'कुछ','koi':'कोई','har':'हर','naam':'नाम','baat':'बात',
  'ghar':'घर','shahar':'शहर','kitab':'किताब','kalam':'कलम','paisa':'पैसा'
};

const DEV_MATRA = {'aa':'ा','ee':'ी','ii':'ी','oo':'ू','uu':'ू','ai':'ै','au':'ौ','a':'','i':'ि','u':'ु','e':'े','o':'ो'};
const DEV_CONS = {'kh':'ख','gh':'घ','chh':'छ','ch':'च','jh':'झ','th':'थ','dh':'ध','ph':'फ','bh':'भ','sh':'श','ksh':'क्ष','tr':'त्र','gy':'ज्ञ','k':'क','g':'ग','c':'च','j':'ज','t':'त','d':'द','n':'न','p':'प','f':'फ़','b':'ब','m':'म','y':'य','r':'र','l':'ल','v':'व','w':'व','s':'स','h':'ह','z':'ज़','q':'क़','x':'क्स'};
const DEV_VOW = {'aa':'आ','ai':'ऐ','au':'औ','ee':'ई','ii':'ई','oo':'ऊ','uu':'ऊ','a':'अ','i':'इ','u':'उ','e':'ए','o':'ओ'};

function hinglishToDev(text){
  if(!text) return '';
  return text.split(/(\s+)/).map(tok => {
    if(/^\s+$/.test(tok)) return tok;
    const m = tok.match(/^([^\w]*)(.*?)([^\w]*)$/);
    if(!m) return tok;
    const [, pre, core, suf] = m;
    if(!core) return tok;
    const lower = core.toLowerCase();
    if(HING_MAP[lower]) return pre + HING_MAP[lower] + suf;
    return pre + transWord(lower) + suf;
  }).join('');
}

function transWord(word){
  let r = '', i = 0;
  while(i < word.length){
    let ok = false;
    for(const len of [3, 2, 1]){
      const c = word.substr(i, len);
      if(DEV_CONS[c]){
        r += DEV_CONS[c]; i += len;
        let hasV = false;
        for(const vl of [3, 2, 1]){
          const v = word.substr(i, vl);
          if(DEV_MATRA[v] !== undefined){ r += DEV_MATRA[v]; i += vl; hasV = true; break; }
        }
        if(!hasV && i < word.length && !/\s/.test(word[i])){
          const nc = word.substr(i, 2);
          if(DEV_CONS[nc] || DEV_CONS[word[i]]) r += '्';
        }
        ok = true; break;
      }
      if(DEV_VOW[c] && i === 0){ r += DEV_VOW[c]; i += len; ok = true; break; }
    }
    if(!ok){ r += word[i]; i++; }
  }
  return r;
}

function updateLivePreview(text){
  const p = $('livePreview');
  if(!p) return;
  if(!text.trim()){ p.textContent = 'Waiting for input...'; p.classList.add('empty'); return; }
  const target = S.config.liveBarTarget;
  p.textContent = target === 'devanagari' ? hinglishToDev(text) : text;
  p.classList.remove('empty');
}

PLUGINS.openLiveBar = function(){
  if(!S.config.plugins.hinglish) return toast('Hinglish plugin is off', 'warn');
  S.config.liveBarActive = true;
  $('liveBar')?.classList.add('visible');
};
PLUGINS.closeLiveBar = function(){
  S.config.liveBarActive = false;
  $('liveBar')?.classList.remove('visible');
  S.liveBuffer = '';
  updateLivePreview('');
};
PLUGINS.toggleLiveBar = function(){
  S.config.liveBarActive ? PLUGINS.closeLiveBar() : PLUGINS.openLiveBar();
};
PLUGINS.cycleLiveTarget = function(){
  S.config.liveBarTarget = S.config.liveBarTarget === 'devanagari' ? 'english' : 'devanagari';
  const el = $('liveTarget');
  if(el) el.textContent = S.config.liveBarTarget === 'devanagari' ? 'देवनागरी' : 'English';
  updateLivePreview(S.liveBuffer || '');
};
PLUGINS.acceptLive = function(){
  if(!S.liveBuffer?.trim()) return toast('Nothing to insert', 'warn');
  const out = S.config.liveBarTarget === 'devanagari' ? hinglishToDev(S.liveBuffer) : S.liveBuffer;
  insertHTML(out);
  S.liveBuffer = '';
  updateLivePreview('');
  toast('Inserted');
};

// ═══════════════════════════════════════════════════════════
//   VOICE
// ═══════════════════════════════════════════════════════════

PLUGINS.initVoice = function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ S.voiceSupported = false; return; }
  S.voiceSupported = true;
  S.voiceRecog = new SR();
  S.voiceRecog.continuous = true;
  S.voiceRecog.interimResults = true;
  S.voiceRecog.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
  S.voiceRecog.onresult = e => {
    let txt = '';
    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal) txt += e.results[i][0].transcript;
    }
    if(txt) insertHTML(txt + ' ');
  };
  S.voiceRecog.onerror = e => {
    S.voiceListening = false;
    if(e.error === 'not-allowed') toast('Microphone denied', 'err');
    else if(e.error !== 'no-speech') toast('Voice error: ' + e.error, 'err');
  };
  S.voiceRecog.onend = () => { S.voiceListening = false; };
};

PLUGINS.toggleVoice = function(){
  if(S.config.plugins && S.config.plugins.voice === false){ toast('Voice dictation is off', 'warn'); return; }
  if(!S.voiceSupported){ toast('Voice not supported. Try Chrome.', 'err'); return; }
  if(!S.voiceRecog) PLUGINS.initVoice();
  try{
    if(S.voiceListening){ S.voiceRecog.stop(); S.voiceListening = false; toast('Voice stopped'); }
    else { S.voiceRecog.start(); S.voiceListening = true; toast('Listening…'); }
  }catch(e){ toast('Already listening', 'warn'); }
};

// ═══════════════════════════════════════════════════════════
//   TEXT-TO-SPEECH — read a passage, the selection, or the editor
// ═══════════════════════════════════════════════════════════

PLUGINS.speak = function(text){
  if(!('speechSynthesis' in window)){ toast('Speech not supported in this build', 'err'); return false; }
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if(!t){ toast('Nothing to read', 'warn'); return false; }
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t.slice(0, 8000));
    u.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
    u.rate = 1; u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ toast('Could not read aloud', 'err'); return false; }
};

PLUGINS.stopSpeaking = function(){
  try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
};

PLUGINS.speakEditor = function(){
  if(S.config.plugins && S.config.plugins.tts === false){ toast('Text-to-speech is off', 'warn'); return; }
  if(window.speechSynthesis && window.speechSynthesis.speaking){ PLUGINS.stopSpeaking(); toast('Stopped'); return; }
  const ed = $('editor');
  const sel = window.getSelection();
  let text = '';
  if(sel && !sel.isCollapsed && ed && ed.contains(sel.anchorNode)) text = sel.toString();
  if(!text && ed) text = (ed.innerText || ed.textContent || '');
  if(PLUGINS.speak(text)) toast('Reading aloud');
};

// ═══════════════════════════════════════════════════════════
//   EVENT WIRING
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;
  if(t.closest('[data-act="web-search"]')){ e.preventDefault(); PLUGINS.openWebSearch(); return; }
  if(t.closest('[data-act="image-search"]')){ e.preventDefault(); PLUGINS.openImageSearch(); return; }
  if(t.closest('[data-act="ws-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="ws-run"]')){ e.preventDefault(); PLUGINS.runSearch(PLUGINS._wsSrc || 'ddg'); return; }
  if(t.closest('[data-act="img-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="img-run"]')){ e.preventDefault(); PLUGINS.runImageSearch(); return; }
  if(t.closest('[data-act="img-url"]')){
    const u = $('imgUrl')?.value.trim();
    if(u){ insertHTML(`<img src="${esc(u)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); closeModal(); toast('Inserted'); }
    return;
  }
  if(t.closest('[data-act="dict-go"]')){ e.preventDefault(); runDictLookup(); return; }
  if(t.closest('[data-act="rhyme-go"]')){
    e.preventDefault();
    const q = $('rhymeQuery')?.value.trim();
    if(q){
      fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=25`)
        .then(r => r.json())
        .then(d => {
          $('rhymeResults').innerHTML = d.length
            ? `<div class="chips">${d.map(x => `<span class="chip" style="cursor:default;">${esc(x.word)}</span>`).join('')}</div>`
            : '<div class="muted">No rhymes found.</div>';
        });
    }
    return;
  }
  if(t.closest('[data-act="toggle-voice"]')){ e.preventDefault(); PLUGINS.toggleVoice(); return; }
  if(t.closest('[data-act="toggle-tts"]')){ e.preventDefault(); PLUGINS.speakEditor(); return; }
  if(t.closest('[data-act="toggle-live"]')){ e.preventDefault(); PLUGINS.toggleLiveBar(); return; }
  if(t.closest('[data-act="live-cycle"]')){ e.preventDefault(); PLUGINS.cycleLiveTarget(); return; }
  if(t.closest('[data-act="live-accept"]')){ e.preventDefault(); PLUGINS.acceptLive(); return; }
  if(t.closest('[data-act="live-close"]')){ e.preventDefault(); PLUGINS.closeLiveBar(); return; }
  if(t.closest('[data-act="new-prompt"]')){
    e.preventDefault();
    const prompts = [
      'Write a scene that takes place entirely in a single elevator ride.',
      'Describe a character only through what they carry in their pockets.',
      'Two people meet after 20 years. One is dying. Neither knows the other knows.',
      'Write a conversation where neither person says what they actually mean.',
      'A letter that was never meant to be sent.',
      'Describe a place you\'ve never been, but feel you remember.',
      'Write the same scene twice — once as comedy, once as tragedy.',
      'A character discovers they\'ve been misremembering a pivotal event.',
      'Write a scene where the weather is a character.',
      'Two rivals forced to cooperate. Neither will speak first.'
    ];
    $('inspireBox').innerHTML = `<div style="font-size:16px;line-height:1.75;color:var(--ink);">${prompts[Math.floor(Math.random() * prompts.length)]}</div>`;
    return;
  }
}, true);

// Voice preview during typing
document.addEventListener('input', e => {
  const ed = $('editor');
  if(e.target !== ed) return;
  if(!S.config.plugins.hinglish || !S.config.liveBarActive) return;
  const sel = window.getSelection();
  if(!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if(node.nodeType !== 3) return;
  const before = node.textContent.slice(0, range.startOffset);
  const lastLine = before.split(/\n/).pop() || '';
  const words = lastLine.split(/\s+/).slice(-8).join(' ');
  S.liveBuffer = words;
  updateLivePreview(words);
});

// ═══════════════════════════════════════════════════════════
//   EXPORT
// ═══════════════════════════════════════════════════════════

window.PLUGINS = PLUGINS;
window.hinglishToDev = hinglishToDev;
window.updateLivePreview = updateLivePreview;

console.log('%c ✓ plugins.js loaded', 'color:#10b981;font-weight:600;');


/* ══════════ tools.js ══════════ */
/* ═══════════════════════════════════════════════════════════
   ScriptForge — Tools
   Voice · Dictionary · Web · Canvas · Projects · Snapshots
   ═══════════════════════════════════════════════════════════ */

const TOOLS = {};

// ═══════════════════════════════════════════════════════════
//   VOICE DICTATION (fixed)
// ═══════════════════════════════════════════════════════════

TOOLS.initVoice = function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    S.voiceSupported = false;
    return;
  }
  S.voiceSupported = true;
  S.voiceRecog = new SR();
  S.voiceRecog.continuous = true;
  S.voiceRecog.interimResults = true;
  S.voiceRecog.lang = S.config.defaultLang === 'hi' ? 'hi-IN' : 'en-US';
  S.voiceRecog.onresult = e => {
    let transcript = '';
    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal) transcript += e.results[i][0].transcript;
    }
    if(transcript){
      const ed = $('editor');
      if(ed){
        ed.focus();
        document.execCommand('insertText', false, transcript + ' ');
        onEditorInput();
      }
    }
  };
  S.voiceRecog.onerror = e => {
    S.voiceListening = false;
    if(e.error === 'not-allowed') toast('Microphone access denied', 'err');
    else if(e.error === 'no-speech') toast('No speech detected', 'warn');
    else toast('Voice error: ' + e.error, 'err');
  };
  S.voiceRecog.onend = () => {
    S.voiceListening = false;
  };
};

TOOLS.toggleVoice = function(){
  if(!S.voiceSupported){
    toast('Voice not supported. Try Chrome or Edge.', 'err');
    return;
  }
  if(!S.voiceRecog) TOOLS.initVoice();
  try{
    if(S.voiceListening){
      S.voiceRecog.stop();
      S.voiceListening = false;
      toast('Voice stopped');
    } else {
      S.voiceRecog.start();
      S.voiceListening = true;
      toast('Listening… speak now');
    }
  }catch(e){ toast('Already listening', 'warn'); }
};

// ═══════════════════════════════════════════════════════════
//   WEB SEARCH — INLINE (not in browser)
// ═══════════════════════════════════════════════════════════

TOOLS.openWebSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:800px;">
      <div class="modal-head">
        <h2><i class="bi bi-globe2" style="color:var(--accent-2);"></i> Web research</h2>
        <button class="icon-btn" data-act="ws-close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="wsQuery" placeholder="Search…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-primary" data-act="ws-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
          <button class="chip" data-ws-src="duckduckgo"><i class="bi bi-search"></i> DuckDuckGo</button>
          <button class="chip" data-ws-src="wikipedia"><i class="bi bi-book"></i> Wikipedia</button>
          <button class="chip" data-ws-src="dictionary"><i class="bi bi-file-text"></i> Dictionary</button>
          <button class="chip" data-ws-src="thesaurus"><i class="bi bi-shuffle"></i> Thesaurus</button>
          <button class="chip" data-ws-src="wolfram"><i class="bi bi-calculator"></i> Wolfram</button>
        </div>
        <div id="wsResults" style="min-height:200px;background:var(--surface-2);border-radius:10px;padding:16px;font-size:13px;color:var(--ink-2);">
          Type a query, then click a source — or the search button.
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  $('wsQuery')?.focus();
  $('wsQuery')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); runSearch('duckduckgo'); }
  });
  document.querySelectorAll('[data-ws-src]').forEach(b => {
    b.addEventListener('click', () => runSearch(b.dataset.wsSrc));
  });
};

async function runSearch(source){
  const q = $('wsQuery')?.value.trim();
  if(!q){ toast('Enter a query', 'warn'); return; }
  const box = $('wsResults');
  if(!box) return;
  box.innerHTML = '<div class="spin" style="display:inline-block;width:20px;height:20px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;"></div> Loading…';

  try{
    if(source === 'wikipedia'){
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if(!r.ok) throw new Error('Not found');
      const d = await r.json();
      box.innerHTML = `
        <div style="font-weight:700;font-size:15px;color:var(--ink);margin-bottom:8px;">${esc(d.title)}</div>
        ${d.thumbnail ? `<img src="${esc(d.thumbnail.source)}" style="max-width:100%;border-radius:8px;margin-bottom:12px;">` : ''}
        <div style="line-height:1.7;">${esc(d.extract)}</div>
        <div style="margin-top:14px;font-size:11.5px;">
          <a href="${esc(d.content_urls?.desktop?.page || '')}" target="_blank" rel="noopener">Open full article on Wikipedia →</a>
        </div>
      `;
    } else if(source === 'dictionary'){
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
      if(!r.ok) throw new Error('Not found');
      const d = await r.json();
      const w = d[0];
      let html = `<div style="font-size:20px;font-weight:700;color:var(--accent-2);margin-bottom:4px;">${esc(w.word)}</div>`;
      if(w.phonetic) html += `<div style="color:var(--ink-3);margin-bottom:12px;">${esc(w.phonetic)}</div>`;
      w.meanings.slice(0, 3).forEach(m => {
        html += `<div style="margin-top:10px;font-weight:600;color:var(--ink);">${esc(m.partOfSpeech)}</div>`;
        m.definitions.slice(0, 3).forEach(d => {
          html += `<div style="margin-top:4px;line-height:1.6;">• ${esc(d.definition)}</div>`;
        });
      });
      box.innerHTML = html;
    } else if(source === 'thesaurus'){
      const r = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(q)}&max=25`);
      const d = await r.json();
      const r2 = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(q)}&max=20`);
      const d2 = await r2.json();
      let html = `<div style="font-size:18px;font-weight:700;color:var(--accent-2);margin-bottom:14px;">${esc(q)}</div>`;
      if(d.length){
        html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">Synonyms</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">`;
        d.slice(0, 20).forEach(s => html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`);
        html += `</div>`;
      }
      if(d2.length){
        html += `<div style="font-weight:600;color:var(--ink);margin-bottom:8px;">Rhymes</div><div style="display:flex;gap:6px;flex-wrap:wrap;">`;
        d2.slice(0, 15).forEach(s => html += `<span class="chip" style="cursor:default;">${esc(s.word)}</span>`);
        html += `</div>`;
      }
      box.innerHTML = html;
    } else if(source === 'wolfram'){
      box.innerHTML = `<div style="line-height:1.7;">Wolfram Alpha needs a free AppID. <a href="https://developer.wolframalpha.com/" target="_blank">Get one here</a>, then paste it in Settings → AI.</div>`;
    } else {
      // DuckDuckGo Instant Answer API (JSON, no key required)
      const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
      const d = await r.json();
      let html = '';
      if(d.AbstractText){
        html += `<div style="font-weight:700;color:var(--ink);margin-bottom:6px;">${esc(d.Heading || q)}</div>`;
        html += `<div style="line-height:1.7;margin-bottom:14px;">${esc(d.AbstractText)}</div>`;
        if(d.AbstractURL) html += `<a href="${esc(d.AbstractURL)}" target="_blank" rel="noopener">Read full page →</a>`;
      }
      if(d.RelatedTopics?.length){
        html += `<div style="font-weight:600;color:var(--ink);margin:16px 0 8px;">Related</div>`;
        d.RelatedTopics.slice(0, 6).forEach(rt => {
          if(rt.Text){
            html += `<div style="padding:8px 0;border-bottom:1px solid var(--line);">
              <a href="${esc(rt.FirstURL || '#')}" target="_blank" rel="noopener" style="font-weight:600;">${esc(rt.Text.split(' - ')[0])}</a>
              <div style="font-size:11.5px;color:var(--ink-3);margin-top:2px;">${esc((rt.Text.split(' - ')[1] || '').slice(0, 160))}</div>
            </div>`;
          }
        });
      }
      if(!html){
        html = `<div class="muted">No instant answer for "<strong>${esc(q)}</strong>".</div>
                <div style="margin-top:12px;"><a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Open in DuckDuckGo →</a></div>`;
      }
      box.innerHTML = html;
    }
  }catch(e){
    box.innerHTML = `<div style="color:var(--err);">${esc(e.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════
//   IMAGE SEARCH — INLINE gallery
// ═══════════════════════════════════════════════════════════

TOOLS.openImageSearch = function(){
  const root = $('modalRoot');
  root.innerHTML = '';
  root.classList.add('open');

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim';
  scrim.innerHTML = `
    <div class="modal" style="max-width:840px;">
      <div class="modal-head">
        <h2><i class="bi bi-image" style="color:var(--accent-2);"></i> Insert image</h2>
        <button class="icon-btn" data-act="img-close"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="imgQuery" placeholder="Search Unsplash…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-primary" data-act="img-run"><i class="bi bi-search"></i> Search</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input class="tb-input" id="imgUrl" placeholder="Or paste image URL…" style="flex:1;padding:10px 14px;font-size:13.5px;">
          <button class="btn btn-ghost" data-act="img-url"><i class="bi bi-check-lg"></i> Insert URL</button>
        </div>
        <div id="imgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;max-height:400px;overflow-y:auto;">
          <div class="muted" style="grid-column:1/-1;text-align:center;padding:40px;">Search for images above, or paste a URL.</div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(scrim);
  $('imgQuery')?.focus();
  $('imgQuery')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); runImageSearch(); }
  });
};

async function runImageSearch(){
  const q = $('imgQuery')?.value.trim();
  if(!q) return toast('Enter a search term', 'warn');
  const g = $('imgGrid');
  if(!g) return;
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spin" style="width:24px;height:24px;border:2px solid var(--line-2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';

  // Use Wikimedia Commons search — free, CORS-friendly
  try{
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=18&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query?.pages ? Object.values(d.query.pages) : [];
    if(!pages.length) throw new Error('No results');
    g.innerHTML = '';
    pages.forEach(p => {
      const info = p.imageinfo?.[0];
      if(!info) return;
      const img = document.createElement('img');
      img.src = info.thumburl;
      img.style.cssText = 'width:100%;height:140px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform 140ms;border:2px solid transparent;';
      img.onmouseenter = () => img.style.transform = 'scale(1.04)';
      img.onmouseleave = () => img.style.transform = '';
      img.onclick = () => {
        insertHTML(`<img src="${info.url}" style="max-width:100%;border-radius:8px;margin:12px 0;">`);
        closeModal();
        toast('Image inserted');
      };
      g.appendChild(img);
    });
  }catch(e){
    g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--err);">${esc(e.message)}</div>
      <div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;">
        <a href="https://unsplash.com/s/photos/${encodeURIComponent(q)}" target="_blank">Open Unsplash →</a>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════════════
//   CANVAS — freehand drawing
// ═══════════════════════════════════════════════════════════

let cx = {
  tool:'pen',
  color:'#7c5cff',
  drawing:false,
  curStroke:null,
  canvas:null,
  ctx:null,
  dpr:1
};

TOOLS.initCanvas = function(){
  const stage = $('cxStage');
  const canvas = $('cxCanvas');
  if(!stage || !canvas) return;

  cx.canvas = canvas;
  cx.ctx = canvas.getContext('2d');
  cx.dpr = window.devicePixelRatio || 1;

  const resize = () => {
    const r = stage.getBoundingClientRect();
    canvas.width = r.width * cx.dpr;
    canvas.height = r.height * cx.dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    cx.ctx.setTransform(cx.dpr, 0, 0, cx.dpr, 0, 0);
    redrawCanvas();
  };
  resize();
  window.addEventListener('resize', resize);

  const colorInput = $('cxColor');
  if(colorInput){
    cx.color = colorInput.value;
    colorInput.addEventListener('input', e => { cx.color = e.target.value; });
  }

  document.querySelectorAll('[data-cx-tool]').forEach(b => {
    b.addEventListener('click', () => {
      cx.tool = b.dataset.cxTool;
      document.querySelectorAll('[data-cx-tool]').forEach(x => x.classList.remove('btn-primary'));
      if(cx.tool !== 'text') b.classList.add('btn-primary');
      canvas.style.cursor = cx.tool === 'text' ? 'text' : 'crosshair';
    });
  });

  document.querySelector('[data-cx-clear]')?.addEventListener('click', () => {
    if(!confirm('Clear the canvas?')) return;
    S.canvasElements = [];
    redrawCanvas();
    save();
  });

  document.querySelector('[data-cx-export]')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'canvas-' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  const getPos = e => {
    const r = canvas.getBoundingClientRect();
    return {x: (e.clientX - r.left), y: (e.clientY - r.top)};
  };

  canvas.addEventListener('mousedown', e => {
    if(cx.tool === 'select') return;
    if(cx.tool === 'text'){
      const txt = prompt('Text:');
      if(txt){
        const p = getPos(e);
        S.canvasElements.push({type:'text', x:p.x, y:p.y, text:txt, color:cx.color, size:16});
        redrawCanvas();
        save();
      }
      return;
    }
    if(cx.tool === 'pen' || cx.tool === 'arrow'){
      cx.drawing = true;
      cx.curStroke = {
        type: cx.tool === 'pen' ? 'line' : 'arrow',
        points:[getPos(e)],
        color: cx.color,
        width: 2
      };
      S.canvasElements.push(cx.curStroke);
    }
  });

  canvas.addEventListener('mousemove', e => {
    if(!cx.drawing || !cx.curStroke) return;
    cx.curStroke.points.push(getPos(e));
    redrawCanvas();
  });

  canvas.addEventListener('mouseup', () => {
    if(cx.drawing){
      cx.drawing = false;
      cx.curStroke = null;
      save();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if(cx.drawing){
      cx.drawing = false;
      cx.curStroke = null;
      save();
    }
  });

  redrawCanvas();
};

function redrawCanvas(){
  if(!cx.ctx || !cx.canvas) return;
  const ctx = cx.ctx;
  const w = cx.canvas.width / cx.dpr;
  const h = cx.canvas.height / cx.dpr;
  ctx.clearRect(0, 0, w, h);

  (S.canvasElements || []).forEach(el => {
    ctx.strokeStyle = el.color || '#7c5cff';
    ctx.fillStyle = el.color || '#7c5cff';
    ctx.lineWidth = el.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if(el.type === 'line'){
      ctx.beginPath();
      el.points.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } else if(el.type === 'arrow' && el.points.length >= 2){
      ctx.beginPath();
      el.points.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      const p1 = el.points[el.points.length - 2];
      const p2 = el.points[el.points.length - 1];
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const len = 12;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - len * Math.cos(ang - Math.PI/6), p2.y - len * Math.sin(ang - Math.PI/6));
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - len * Math.cos(ang + Math.PI/6), p2.y - len * Math.sin(ang + Math.PI/6));
      ctx.stroke();
    } else if(el.type === 'text'){
      ctx.font = `${el.size || 16}px Inter, sans-serif`;
      ctx.textBaseline = 'top';
      el.text.split('\n').forEach((line, i) => {
        ctx.fillText(line, el.x, el.y + i * (el.size || 16) * 1.3);
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════
//   PROJECTS & SNAPSHOTS
// ═══════════════════════════════════════════════════════════

/* Opening a project always goes through the same place, so every entry point
   (tools menu, pages overlay, info panel) loads that project's own data. */
TOOLS.openProject = function(pid){
  if(typeof openProjectById === 'function'){ openProjectById(pid); return; }
  const proj = (D().projects || []).find(function(p){ return p.id === pid; });
  if(!proj) return;
  useProjectData(proj);
  save();
  if(typeof goPage === 'function') goPage('inspire');
};

TOOLS.newProject = async function(){
  const name = await askPrompt('Project name:', 'Untitled');
  if(!name) return;

  const d  = D();
  const id = uid();
  const chapterId = uid();
  const category = d.currentCategory || currentMode()?.categories?.[0]?.id || 'fiction';

  // Duplicate names within a category are not allowed
  if((d.projects || []).some(p => p.category === category && p.name.toLowerCase() === name.trim().toLowerCase())){
    toast('A project named "' + name.trim() + '" already exists in this category', 'warn');
    return;
  }
  // Cap each category at 5 recent projects
  const catProjects = (d.projects || []).filter(p => p.category === category);
  if(catProjects.length >= 5){
    toast('Category is full — 5 recent projects max', 'warn');
    return;
  }

  const project = {
    id, name, category, mode: S.mode, created: Date.now(),
    chapters: [{ id: chapterId, title: 'Chapter 1', content: '', children: [], collapsed: false }],
    drafts: [], ideas: [], notes: [], beats: [], cast: [], references: [], timeline: [],
    bible: { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] },
    kanban: { columns: [
      {id:'k1', title:'Ideas', cards:[]}, {id:'k2', title:'Drafting', cards:[]},
      {id:'k3', title:'Editing', cards:[]}, {id:'k4', title:'Done', cards:[]}
    ]}
  };

  if(!Array.isArray(d.projects)) d.projects = [];
  d.projects.unshift(project);
  d.currentProject  = id;
  d.currentCategory = category;

  /* every project owns its own Views · Reference · Workflow data — point
     the working set at this project's copies (same object references, so
     edits save straight back onto the project) */
  useProjectData(project);
  d.currentChapter = chapterId;

  save();
  if(typeof togglePagesOverlay === 'function') togglePagesOverlay(false);
  if(typeof hideInfoPanel === 'function') hideInfoPanel();
  goPage('inspire');
  toast('Project created');
};


function askPrompt(msg, def = ''){
  return new Promise(resolve => {
    const root = $('modalRoot');
    root.innerHTML = '';
    root.classList.add('open');
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-head"><h2>${esc(msg)}</h2></div>
        <div class="modal-body">
          <input class="tb-input" id="askInput" style="width:100%;padding:10px 12px;font-size:13.5px;">
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" id="askCancel">Cancel</button>
          <button class="btn btn-primary" id="askOk">OK</button>
        </div>
      </div>`;
    root.appendChild(scrim);
    const inp = $('askInput');
    inp.value = def; inp.focus(); inp.select();
    const done = v => { root.innerHTML = ''; root.classList.remove('open'); resolve(v); };
    $('askOk').onclick     = () => done(inp.value.trim() || null);
    $('askCancel').onclick = () => done(null);
    inp.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); done(inp.value.trim() || null); }
      if(e.key === 'Escape'){ e.preventDefault(); done(null); }
    });
  });
}
window.askPrompt = askPrompt;


// ═══════════════════════════════════════════════════════════
//   REFERENCES
// ═══════════════════════════════════════════════════════════

TOOLS.addUrl = async function(){
  const url = prompt('URL to reference:');
  if(!url) return;
  toast('Fetching…');
  let title = url, content = '';
  try{
    const r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url));
    const d = await r.json();
    const tmp = document.createElement('div');
    tmp.innerHTML = d.contents || '';
    tmp.querySelectorAll('script,style,nav,footer,header').forEach(n => n.remove());
    title = (tmp.querySelector('title')?.textContent || url).trim();
    content = (tmp.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 20000);
  }catch(e){
    content = '[Could not fetch content]';
  }
  D().references.push({id: uid(), type:'url', title, url, content, created: Date.now()});
  save();
  renderReferences();
  toast('Reference added');
};

TOOLS.addRefFromNote = function(){
  if(!D().notes.length) return toast('No notes available', 'warn');
  const list = D().notes.map((n, i) => `${i+1}. ${n.title || 'Untitled'}`).join('\n');
  const pick = parseInt(prompt('Link a note:\n' + list + '\n\nEnter number:'));
  if(!pick || pick < 1 || pick > D().notes.length) return;
  const n = D().notes[pick - 1];
  D().references.push({
    id: uid(), type:'note', title: n.title || 'Note',
    content: n.content || '', created: Date.now()
  });
  save();
  renderReferences();
  toast('Note linked');
};

TOOLS.viewReference = function(i){
  const r = D().references[i];
  if(!r) return;
  showResult(r.title, r.url || 'Reference', r.content || '(empty)');
};

TOOLS.deleteReference = function(i){
  if(!confirm('Delete this reference?')) return;
  D().references.splice(i, 1);
  save();
  renderReferences();
};

// ═══════════════════════════════════════════════════════════
//   DRAFT / NOTE / IDEA HELPERS
// ═══════════════════════════════════════════════════════════

/* The draft list lives on the project — D().drafts — not on S. Everything
   here used to write to S.drafts / S.chapters, which do not exist, so the
   New draft button (and adding a draft to a chapter) threw and did nothing. */
TOOLS.addDraft = function(){
  D().drafts.unshift({
    id: uid(), title:'', body:'',
    created: Date.now()
  });
  save();
  renderDrafts();
};

TOOLS.draftToChapter = function(i){
  const d = D().drafts[i];
  if(!d) return;
  const title = d.title || 'From draft';
  D().chapters.push({
    id: uid(),
    title,
    content: d.body.split('\n\n').map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join(''),
    children:[], collapsed:false
  });
  save();
  toast('Draft moved to chapter');
};

// ═══════════════════════════════════════════════════════════
//   EVENT WIRING (all tool-related clicks)
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const t = e.target;

  // Voice
  if(t.closest('[data-act="toggle-voice"]')){ e.preventDefault(); TOOLS.toggleVoice(); return; }

  // Web search / images
  if(t.closest('[data-act="search-web"]')){ e.preventDefault(); TOOLS.openWebSearch(); return; }
  if(t.closest('[data-act="search-images"]')){ e.preventDefault(); TOOLS.openImageSearch(); return; }
  if(t.closest('[data-act="ws-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="ws-run"]')){ e.preventDefault(); runSearch('duckduckgo'); return; }
  if(t.closest('[data-act="img-close"]')){ closeModal(); return; }
  if(t.closest('[data-act="img-run"]')){ e.preventDefault(); runImageSearch(); return; }
  if(t.closest('[data-act="img-url"]')){
    const u = $('imgUrl')?.value.trim();
    if(u){ insertHTML(`<img src="${esc(u)}" style="max-width:100%;border-radius:8px;margin:12px 0;">`); closeModal(); toast('Image inserted'); }
    return;
  }

  // Projects & snapshots
  if(t.closest('[data-act="new-project"]')){ e.preventDefault(); TOOLS.newProject(); return; }
  if(t.closest('[data-act="snapshot"]')){ e.preventDefault(); TOOLS.snapshot(); return; }

  const projEl = t.closest('[data-open-project]');
  if(projEl){ e.preventDefault(); TOOLS.openProject(projEl.dataset.openProject); return; }

  const rsEl = t.closest('[data-snap-restore]');
  if(rsEl){ e.preventDefault(); TOOLS.restoreSnapshot(parseInt(rsEl.dataset.snapRestore)); return; }
  const rdEl = t.closest('[data-snap-del]');
  if(rdEl){
    const i = parseInt(rdEl.dataset.snapDel);
    if(confirm('Delete this snapshot?')){
      (D().versions || []).splice(i, 1);
      save();
      renderSnapshots();
    }
    return;
  }

  // Drafts
  if(t.closest('[data-act="add-draft"]')){ e.preventDefault(); TOOLS.addDraft(); return; }
  const ddEl = t.closest('[data-draft-del]');
  if(ddEl){
    D().drafts.splice(parseInt(ddEl.dataset.draftDel), 1);
    save();
    renderDrafts();
    return;
  }
  const dchEl = t.closest('[data-draft-to-ch]');
  if(dchEl){ e.preventDefault(); TOOLS.draftToChapter(parseInt(dchEl.dataset.draftToCh)); return; }

  // References
  if(t.closest('[data-act="add-url"]')){ e.preventDefault(); TOOLS.addUrl(); return; }
  if(t.closest('[data-act="add-ref-note"]')){ e.preventDefault(); TOOLS.addRefFromNote(); return; }
  const rvEl = t.closest('[data-ref-view]');
  if(rvEl){ e.preventDefault(); TOOLS.viewReference(parseInt(rvEl.dataset.refView)); return; }
  const rdEl2 = t.closest('[data-ref-del]');
  if(rdEl2){ e.preventDefault(); TOOLS.deleteReference(parseInt(rdEl2.dataset.refDel)); return; }

  // Beats
  if(t.closest('[data-act="add-beat"]')){
    D().beats.push({id:uid(), text:'', level:0, type:'beat'});
    save(); renderBeats(); return;
  }
  if(t.closest('[data-act="preset-plan"]')){
    e.preventDefault();
    const beats = D().beats;
    if(beats.length && !confirm('Add the preset beats to your plan?')) return;
    const preset = [
      { type:'act',  text:'Act I — Setup' },
      { type:'beat', text:'Opening image' },
      { type:'beat', text:'Inciting incident' },
      { type:'beat', text:'Call to adventure' },
      { type:'beat', text:'Debate' },
      { type:'act',  text:'Act II — Confrontation' },
      { type:'beat', text:'Break into two' },
      { type:'beat', text:'Fun and games' },
      { type:'beat', text:'Midpoint' },
      { type:'beat', text:'Bad forces close in' },
      { type:'beat', text:'All is lost' },
      { type:'beat', text:'Dark night of the soul' },
      { type:'act',  text:'Act III — Resolution' },
      { type:'beat', text:'Break into three' },
      { type:'beat', text:'Finale' },
      { type:'beat', text:'Final image' }
    ];
    preset.forEach(function(b){ beats.push({ id: uid(), text: b.text, level: 0, type: b.type }); });
    save(); renderBeats();
    if(typeof toast === 'function') toast('Preset beats added');
    return;
  }
  const biEl = t.closest('[data-beat-indent]');
  if(biEl){ const b = D().beats[parseInt(biEl.dataset.beatIndent)]; if(b){ b.level = Math.min(5, (b.level || 0) + 1); save(); renderBeats(); } return; }
  const boEl = t.closest('[data-beat-outdent]');
  if(boEl){ const b = D().beats[parseInt(boEl.dataset.beatOutdent)]; if(b){ b.level = Math.max(0, (b.level || 0) - 1); save(); renderBeats(); } return; }
  const bdEl = t.closest('[data-beat-del]');
  if(bdEl){ D().beats.splice(parseInt(bdEl.dataset.beatDel), 1); save(); renderBeats(); return; }

  // Timeline
  if(t.closest('[data-act="add-event"]')){
    const title = prompt('Event title:'); if(!title) return;
    const date = prompt('Date marker (optional):') || '';
    const desc = prompt('Description (optional):') || '';
    D().timeline.push({id:uid(), title, date, desc});
    save(); renderTimeline(); return;
  }
  const teEl = t.closest('[data-event-edit]');
  if(teEl){
    const i = parseInt(teEl.dataset.eventEdit);
    const ev = D().timeline[i];
    const title = prompt('Title:', ev.title); if(title === null) return;
    ev.title = title;
    const date = prompt('Date:', ev.date || ''); if(date !== null) ev.date = date;
    const desc = prompt('Description:', ev.desc || ''); if(desc !== null) ev.desc = desc;
    save(); renderTimeline(); return;
  }
  const tdEl = t.closest('[data-event-del]');
  if(tdEl){
    const i = parseInt(tdEl.dataset.eventDel);
    if(confirm('Delete event?')){ D().timeline.splice(i, 1); save(); renderTimeline(); }
    return;
  }

  // Cast
  if(t.closest('[data-act="add-cast"]')){
    S.bible.push({id:uid(), name:'', type:'character', details:''});
    save(); renderCast(); return;
  }
  const cdEl = t.closest('[data-cast-del]');
  if(cdEl){ S.bible.splice(parseInt(cdEl.dataset.castDel), 1); save(); renderCast(); return; }

  // Kanban
  if(t.closest('[data-act="add-column"]')){
    const title = prompt('Column name:', 'New Column'); if(!title) return;
    D().kanban.columns.push({id:uid(), title, cards:[]});
    save(); renderKanban(); return;
  }
  const ccEl = t.closest('[data-col-del]');
  if(ccEl){
    const i = D().kanban.columns.findIndex(c => c.id === ccEl.dataset.colDel);
    if(i >= 0 && confirm('Delete column and its cards?')){ D().kanban.columns.splice(i, 1); save(); renderKanban(); }
    return;
  }
  const caEl = t.closest('[data-card-add]');
  if(caEl){
    const col = D().kanban.columns.find(c => c.id === caEl.dataset.cardAdd);
    if(!col) return;
    const title = prompt('Card title:'); if(!title) return;
    col.cards.push({id:uid(), title, desc:''});
    save(); renderKanban(); return;
  }
  const ceEl = t.closest('[data-card-edit]');
  if(ceEl){
    const cardId = ceEl.dataset.cardEdit;
    let found = null;
    D().kanban.columns.forEach(c => { const k = c.cards.find(x => x.id === cardId); if(k) found = k; });
    if(!found) return;
    const title = prompt('Title:', found.title); if(title === null) return;
    found.title = title;
    const desc = prompt('Description:', found.desc || ''); if(desc !== null) found.desc = desc;
    save(); renderKanban(); return;
  }
  const cddEl = t.closest('[data-card-del]');
  if(cddEl){
    const cardId = cddEl.dataset.cardDel;
    D().kanban.columns.forEach(c => { c.cards = c.cards.filter(x => x.id !== cardId); });
    save(); renderKanban(); return;
  }
}, true);

// ═══ Drag drop for kanban ═══
function moveCard(cardId, fromCol, toCol){
  if(fromCol === toCol) return;
  const f = D().kanban.columns.find(c => c.id === fromCol);
  const t = D().kanban.columns.find(c => c.id === toCol);
  if(!f || !t) return;
  const i = f.cards.findIndex(c => c.id === cardId);
  if(i < 0) return;
  const [card] = f.cards.splice(i, 1);
  t.cards.push(card);
  save();
  renderKanban();
}

// ═══ Input delegation for editable fields ═══
document.addEventListener('input', e => {
  const t = e.target;

  const dt = t.closest('[data-draft-title]');
  if(dt){ D().drafts[parseInt(dt.dataset.draftTitle)].title = t.value; debouncedSave(); return; }
  const db = t.closest('[data-draft-body]');
  if(db){ D().drafts[parseInt(db.dataset.draftBody)].body = t.value; debouncedSave(); return; }

  const cn = t.closest('[data-cast-name]');
  if(cn){ S.bible[parseInt(cn.dataset.castName)].name = t.value; debouncedSave(); return; }
  const cd = t.closest('[data-cast-details]');
  if(cd){ S.bible[parseInt(cd.dataset.castDetails)].details = t.value; debouncedSave(); return; }

  const bt = t.closest('[data-beat-text]');
  if(bt){ const b = D().beats[parseInt(bt.dataset.beatText)]; if(b){ b.text = t.value; debouncedSave(); } return; }

  const ct = t.closest('[data-col-title]');
  if(ct){
    const c = D().kanban.columns.find(x => x.id === ct.dataset.colTitle);
    if(c){ c.title = t.value; debouncedSave(); }
    return;
  }
});

const debouncedSave = debounce(() => save(), 800);

// ═══ Selects ═══
document.addEventListener('change', e => {
  const t = e.target;
  const ct = t.closest('[data-cast-type]');
  if(ct){ S.bible[parseInt(ct.dataset.castType)].type = t.value; save(); return; }
  const bt = t.closest('[data-beat-type]');
  if(bt){ const b = D().beats[parseInt(bt.dataset.beatType)]; if(b){ b.type = t.value; save(); } return; }
});

// ═══ Close modal helper ═══
function closeModal(){
  const root = $('modalRoot');
  root.classList.remove('open');
  root.innerHTML = '';
}

// ═══ Expose ═══
window.TOOLS = TOOLS;
window.runSearch = runSearch;
window.runImageSearch = runImageSearch;
window.redrawCanvas = redrawCanvas;
window.moveCard = moveCard;
window.closeModal = closeModal;

console.log('%c ✓ tools.js loaded', 'color:#10b981;font-weight:600;');

