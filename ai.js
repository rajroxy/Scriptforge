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
  if(p.gemini) return callGemini(prompt, key);
  return callOpenAICompat(prompt, key);
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
        <button class="icon-btn gt-x" data-act="result-close" title="Close (Esc)"><i class="bi bi-x-lg"></i></button>
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
