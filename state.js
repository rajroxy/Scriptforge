/* ═══════════════════════════════════════════════════════════
   ScriptForge — State
   20 modes · per-mode data isolation · 16+ pages per mode
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
//   MODES — each with its own page set
// ═══════════════════════════════════════════════════════════

/* The pages that still exist. Timeline, Cast (Characters), Research,
   Dictionary, Board, Notes, Formatting, Canvas and Reader were taken out:
   they are gone from the page registry, so goPage() refuses them and no
   list can name them. Book (notebook) stays — the writing toolbar's Book
   button opens it — as does Import, the editor and every FAB page. */
const BASE_PAGES = ['write','draft','plan','inspire','stats','notebook','import'];const MODES = [
  {
    id: 'novel',
    name: 'Novel',
    icon: 'book',
    desc: 'Long-form prose writing',
    /* ONE kind of novel work. There is no second category: the
       statistics page, the sidebar filters and the project lists all
       read these, so adding one here would invent it everywhere. */
    categories: [
      { id: 'fiction',    name: 'Fiction',     icon: 'book-half',    desc: 'Novels, novellas, and short stories' },
    ],
    editorViews:    ['draft', 'outline', 'plan', 'manuscript', 'kanban', 'bible'],
    fabGroups: [
      { label:'Views', views:[
        { id:'inspire',    name:'Idea',       icon:'lightbulb-fill' },
        { id:'draft',      name:'Draft',      icon:'lightbulb' },
        { id:'outline',    name:'Outline',    icon:'list-nested' },
        { id:'plan',       name:'Plan',       icon:'list-check' },
        { id:'manuscript', name:'Manuscript', icon:'file-earmark-text' }
      ]},
      { label:'Reference', views:[{ id:'bible', name:'Bible', icon:'journal-bookmark' }]},
      { label:'Workflow',  views:[{ id:'kanban', name:'Kanban', icon:'kanban' }]}
    ]
  },

  {
    id: 'screenplay',
    name: 'Screenplay',
    icon: 'film',
    desc: 'Scripted writing',
    categories: [
      { id: 'fiction',    name: 'Fiction',     icon: 'book-half',    desc: 'Screenplays and scripts' },
    ],
    editorViews:    ['draft', 'outline', 'plan', 'manuscript', 'kanban', 'bible'],
    fabGroups: [
      { label:'Views', views:[
        { id:'inspire',    name:'Idea',      icon:'lightbulb-fill' },
        { id:'draft',      name:'Draft',     icon:'lightbulb' },
        { id:'outline',    name:'Outline',   icon:'list-nested' },
        { id:'plan',       name:'Plan',      icon:'list-check' },
        { id:'manuscript', name:'Script',    icon:'file-earmark-text' }
      ]},
      { label:'Reference', views:[{ id:'bible', name:'Bible', icon:'journal-bookmark' }]},
      { label:'Workflow',  views:[{ id:'kanban', name:'Kanban', icon:'kanban' }]}
    ]
  }
];

// ═══════════════════════════════════════════════════════════
//   PAGE META — every page that appears anywhere
// ═══════════════════════════════════════════════════════════

const PAGE_META = {
  // Top-level
  editor:        { name:'Manuscript',    icon:'pencil-fill' },

  // Editor FAB subpages
  draft:         { name:'Draft',         icon:'lightbulb' },
  outline:       { name:'Outline',       icon:'list-nested' },
  manuscript:    { name:'Manuscript',    icon:'file-earmark-text' },
  kanban:        { name:'Kanban',        icon:'kanban' },
  bible:         { name:'Bible',         icon:'journal-bookmark' },
  inspire:       { name:'Idea',          icon:'lightbulb-fill' },
  plan:          { name:'Plan',          icon:'list-check' },

  // Universal
  home:          { name:'Dashboard',     icon:'house-door-fill' },
  overview:      { name:'Overview',      icon:'info-circle' },
  stats:         { name:'Statistics',    icon:'graph-up-arrow' },
  reader:        { name:'Reader',        icon:'book-half' }
};

// ═══════════════════════════════════════════════════════════
//   INTERFACE LANGUAGE — page and menu names (Settings → Language)
//   Real translations for the app's own navigation. Writing tools,
//   panels and prompts stay in English; the interface (and the text
//   direction) follows the language you pick.
// ═══════════════════════════════════════════════════════════

const I18N = {
  en:       { home:'Dashboard', overview:'Overview', stats:'Statistics', reader:'Reader', editor:'Manuscript', draft:'Draft', outline:'Outline', plan:'Plan', manuscript:'Manuscript', kanban:'Kanban', bible:'Bible', inspire:'Idea' },
  hinglish: { home:'Dashboard', overview:'Overview', stats:'Statistics', reader:'Reader', editor:'Editor', draft:'Draft', outline:'Outline', manuscript:'Manuscript', kanban:'Kanban', bible:'Bible' },
  hi:       { home:'डैशबोर्ड', overview:'अवलोकन', stats:'आंकड़े', reader:'पाठक', editor:'संपादक', draft:'ड्राफ़्ट', outline:'रूपरेखा', manuscript:'पांडुलिपि', kanban:'कानबान', bible:'बाइबल' },
  bn:       { home:'ড্যাশবোর্ড', overview:'সারসংক্ষেপ', stats:'পরিসংখ্যান', reader:'পাঠক', editor:'সম্পাদক', draft:'খসড়া', outline:'রূপরেখা', manuscript:'পাণ্ডুলিপি', kanban:'কানবান', bible:'বাইবেল' },
  mr:       { home:'डॅशबोर्ड', overview:'आढावा', stats:'आकडेवारी', reader:'वाचक', editor:'संपादक', draft:'मसुदा', outline:'रूपरेषा', manuscript:'हस्तलिखित', kanban:'कानबान', bible:'बायबल' },
  ta:       { home:'டாஷ்போர்டு', overview:'மேலோட்டம்', stats:'புள்ளிவிவரங்கள்', reader:'வாசிப்பான்', editor:'தொகுப்பான்', draft:'வரைவு', outline:'வரைபடம்', manuscript:'கையெழுத்துப்படி', kanban:'கான்பான்', bible:'பைபிள்' },
  ne:       { home:'ड्यासबोर्ड', overview:'अवलोकन', stats:'तथ्याङ्क', reader:'पाठक', editor:'सम्पादक', draft:'मस्यौदा', outline:'रूपरेखा', manuscript:'पाण्डुलिपि', kanban:'कानबान', bible:'बाइबल' },
  ur:       { home:'ڈیش بورڈ', overview:'جائزہ', stats:'اعداد و شمار', reader:'قاری', editor:'ایڈیٹر', draft:'مسودہ', outline:'خاکہ', manuscript:'مخطوطہ', kanban:'کانبان', bible:'بائبل' },
  es:       { home:'Panel', overview:'Resumen', stats:'Estadísticas', reader:'Lector', editor:'Editor', draft:'Borrador', outline:'Esquema', manuscript:'Manuscrito', kanban:'Kanban', bible:'Biblia' },
  fr:       { home:'Tableau de bord', overview:'Aperçu', stats:'Statistiques', reader:'Lecteur', editor:'Éditeur', draft:'Brouillon', outline:'Plan', manuscript:'Manuscrit', kanban:'Kanban', bible:'Bible' },
  de:       { home:'Übersicht', overview:'Überblick', stats:'Statistik', reader:'Leser', editor:'Editor', draft:'Entwurf', outline:'Gliederung', manuscript:'Manuskript', kanban:'Kanban', bible:'Bibel' },
  it:       { home:'Pannello', overview:'Panoramica', stats:'Statistiche', reader:'Lettore', editor:'Editor', draft:'Bozza', outline:'Scaletta', manuscript:'Manoscritto', kanban:'Kanban', bible:'Bibbia' },
  pt:       { home:'Painel', overview:'Visão geral', stats:'Estatísticas', reader:'Leitor', editor:'Editor', draft:'Rascunho', outline:'Esboço', manuscript:'Manuscrito', kanban:'Kanban', bible:'Bíblia' },
  ru:       { home:'Панель', overview:'Обзор', stats:'Статистика', reader:'Читалка', editor:'Редактор', draft:'Черновик', outline:'План', manuscript:'Рукопись', kanban:'Канбан', bible:'Библия' },
  ar:       { home:'لوحة التحكم', overview:'نظرة عامة', stats:'الإحصاءات', reader:'القارئ', editor:'المحرر', draft:'المسودة', outline:'المخطط', manuscript:'المخطوطة', kanban:'كانبان', bible:'الدليل' },
  tr:       { home:'Panel', overview:'Genel bakış', stats:'İstatistikler', reader:'Okuyucu', editor:'Düzenleyici', draft:'Taslak', outline:'Ana hat', manuscript:'El yazması', kanban:'Kanban', bible:'Kitap' },
  ja:       { home:'ダッシュボード', overview:'概要', stats:'統計', reader:'リーダー', editor:'エディタ', draft:'下書き', outline:'構成', manuscript:'原稿', kanban:'カンバン', bible:'バイブル' },
  zh:       { home:'仪表盘', overview:'概览', stats:'统计', reader:'阅读器', editor:'编辑器', draft:'草稿', outline:'大纲', manuscript:'手稿', kanban:'看板', bible:'设定集' },
  ko:       { home:'대시보드', overview:'개요', stats:'통계', reader:'리더', editor:'편집기', draft:'초안', outline:'구성', manuscript:'원고', kanban:'칸반', bible:'바이블' },
  vi:       { home:'Bảng điều khiển', overview:'Tổng quan', stats:'Thống kê', reader:'Trình đọc', editor:'Trình soạn thảo', draft:'Bản nháp', outline:'Dàn ý', manuscript:'Bản thảo', kanban:'Kanban', bible:'Kinh thánh' },
  id:       { home:'Dasbor', overview:'Ringkasan', stats:'Statistik', reader:'Pembaca', editor:'Editor', draft:'Draf', outline:'Kerangka', manuscript:'Naskah', kanban:'Kanban', bible:'Bibel' }
};

/* the languages offered for the INTERFACE, in their own script */
const UI_LANGS = [
  { code:'en', name:'English', native:'English' }
];


/* t('home') → 'डैशबोर्ड' when the interface language is Hindi.
   Missing keys and English both fall through to the English string. */
function t(key){
  const lang = (S.config && S.config.uiLang) || 'en';
  const dict = I18N[lang];
  if(dict && dict[key]) return dict[key];
  return I18N.en[key] || key;
}
/* the translated name of a page id, with the plain PAGE_META name as backup */
function pname(id){
  /* The writing page answers to three ids — the FAB's 'manuscript', the
     writing renderer's 'write' and the older 'editor' — and it is the
     Manuscript in every mode except Screenplay, where it is the Script.
     'manuscript' is the translated name, so the pick follows the interface
     language for all three. */
  if(id === 'manuscript' || id === 'write' || id === 'editor'){
    if(S.mode === 'screenplay') return 'Script';
    return t('manuscript') || 'Manuscript';
  }
  /* t() answers with the id ITSELF when the dictionary has nothing for it,
     and that is a truthy string — so `t(id) || …` was satisfied by the raw
     id and the PAGE_META name behind it was never read. Canvas is named in
     PAGE_META (mindmap.js registers it) and appears in no dictionary, so the
     command box listed it by its id: “mindmap”. A translation counts only
     when it really is one; otherwise the page's own name wins. */
  const tr = t(id);
  if(tr && tr !== id) return tr;
  return (PAGE_META[id] && PAGE_META[id].name) ? PAGE_META[id].name : id;
}
function uiLangCode(){
  const l = (S.config && S.config.uiLang) || 'en';
  return (l === 'hinglish') ? 'hi-Latn' : l;
}
function isRtlLang(){
  const l = (S.config && S.config.uiLang) || 'en';
  return l === 'ar' || l === 'ur' || l === 'fa' || l === 'he';
}
/* applied on boot and whenever the language changes */
function applyLang(){
  const code = uiLangCode();
  const rtl  = isRtlLang();
  try{ document.documentElement.lang = code; }catch(e){}
  try{ document.documentElement.dir = rtl ? 'rtl' : 'ltr'; }catch(e){}
  document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]').forEach(function(el){
    el.setAttribute('lang', S.config.defaultLang || 'en');
  });
  if(typeof renderNav === 'function') renderNav();
  if(typeof renderModePills === 'function') renderModePills();
  if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
}
window.t = t;
window.pname = pname;
window.applyLang = applyLang;
window.UI_LANGS = UI_LANGS;
window.I18N = I18N;

// ═══════════════════════════════════════════════════════════
//   THEMES · FONTS · LANGUAGES
// ═══════════════════════════════════════════════════════════

//   THREE dark palettes, one per surface temperature. Every one of them is
//   dark — there is no light mode and nothing is derived from anything else.
//   `acc` is a real colour on every one of them (a blue, a violet and an
//   amber), not a near-white: it is what paints the dropdowns, the toggles,
//   the sliders and the solid buttons, so it has to be a colour you can see.
//   `accInk` is the ink that reads on top of that accent.
//   A theme is a full token set applied inline on <html> + <body>, so it
//   never has to fight the cascade.
const THEMES = [
  {
    id:'cool', name:'Blue', c1:'#191b1e', c2:'#7cb0f0', dark:true,
    note:'Cool dark — blue-grey surfaces, a blue accent',
    palette:{
      bg:'#191b1e', s1:'#1f2124', s2:'#26282c', s3:'#2e3035', s4:'#373a3f', s5:'#42454b',
      ov:'rgba(124,176,240,.05)', ovs:'rgba(124,176,240,.09)',
      ink:'#dbe3ee', ink2:'#b0bccc', ink3:'#8794a6', ink4:'#66717f',
      line:'#1f252d', line2:'#283039', line3:'#36414d',
      acc:'#7cb0f0', acc2:'#5b93d6', accInk:'#0b1119', accSoft:'rgba(124,176,240,.12)', accLine:'rgba(124,176,240,.34)',
      grad:'linear-gradient(135deg,#7cb0f0 0%,#3f7ac2 100%)',
      docBg:'#1e2024', docInk:'#d3dce8', caret:'#7cb0f0', sel:'#7cb0f0', selInk:'#0b1119'
    }
  },
  {
    id:'night', name:'Yellow', c1:'#1b1a19', c2:'#f2cb6b', dark:true,
    note:'Warm dark — brown surfaces, a yellow accent',
    palette:{
      bg:'#1b1a19', s1:'#222120', s2:'#292725', s3:'#312e2c', s4:'#3a3734', s5:'#454140',
      ov:'rgba(242,203,107,.05)', ovs:'rgba(242,203,107,.09)',
      ink:'#d9d3cb', ink2:'#b0aaa1', ink3:'#8b857c', ink4:'#6a655e',
      line:'#332f2c', line2:'#3e3a36', line3:'#4c4741',
      acc:'#f2cb6b', acc2:'#d9ab45', accInk:'#1b1610', accSoft:'rgba(242,203,107,.12)', accLine:'rgba(242,203,107,.34)',
      grad:'linear-gradient(135deg,#f2cb6b 0%,#c9971f 100%)',
      docBg:'#211f1d', docInk:'#d3cdc4', caret:'#f2cb6b', sel:'#f2cb6b', selInk:'#1b1610'
    }
  }
];

// Compact palette → the full CSS custom-property set every theme must define
function themeTokens(t){
  const p = t.palette, dark = !!t.dark;
  return {
    '--bg':p.bg, '--surface-1':p.s1, '--surface-2':p.s2, '--surface-3':p.s3,
    '--surface-4':p.s4, '--surface-5':p.s5,
    '--overlay':p.ov, '--overlay-strong':p.ovs,
    '--ink':p.ink, '--ink-2':p.ink2, '--ink-3':p.ink3, '--ink-4':p.ink4,
    '--line':p.line, '--line-2':p.line2, '--line-3':p.line3,
    '--accent':p.acc, '--accent-2':p.acc2, '--accent-soft':p.accSoft,
    '--accent-line':p.accLine, '--accent-ink':p.accInk, '--grad':p.grad,
    '--doc-bg':p.docBg, '--doc-ink':p.docInk,
    '--caret':p.caret, '--sel':p.sel, '--sel-ink':p.selInk,
    '--e-1': dark ? '0 1px 2px rgba(0,0,0,.40)'    : '0 1px 2px rgba(0,0,0,.06)',
    '--e-2': dark ? '0 4px 12px rgba(0,0,0,.45)'   : '0 4px 12px rgba(0,0,0,.08)',
    '--e-3': dark ? '0 8px 24px rgba(0,0,0,.50)'   : '0 8px 24px rgba(0,0,0,.10)',
    '--e-4': dark ? '0 16px 40px rgba(0,0,0,.55)'  : '0 16px 40px rgba(0,0,0,.14)'
  };
}

function themeById(id){
  return THEMES.find(t => t.id === id) || THEMES.find(t => t.id === 'night') || THEMES[0];
}

// Every theme is dark and named by its colour, so this only has to normalise
// a saved id (an old profile may still name 'paper' / 'midnight' / 'auto' /
// 'violet' — they fall back to Yellow instead of breaking boot)
function resolveThemeId(id){
  return THEMES.some(t => t.id === id) ? id : 'night';
}

// Write a theme's tokens onto <html> and <body> (inline beats any stylesheet)
function applyThemeVars(id){
  const tid = resolveThemeId(id);
  const t = themeById(tid);
  const toks = themeTokens(t);
  const html = document.documentElement, body = document.body;
  Object.keys(toks).forEach(k => {
    html.style.setProperty(k, toks[k]);
    body.style.setProperty(k, toks[k]);
  });
  const scheme = t.dark ? 'dark' : 'light';
  html.style.colorScheme = scheme;
  body.style.colorScheme = scheme;
  /* Night is the only palette, so a saved profile that still names one of
     the twenty deleted themes ('paper', 'cobalt', …) is normalised to Night
     here rather than left as a dead id on <body> and in the config. */
  try{ if(S && S.config && S.config.theme !== tid) S.config.theme = tid; }catch(e){}
  body.setAttribute('data-theme', tid);
  body.setAttribute('data-theme-resolved', tid);
  // cache the resolved tokens so the next boot can paint before JS loads
  try{
    localStorage.setItem('sf6_theme', JSON.stringify({ id:tid, resolved:tid, dark:!!t.dark, scheme, tokens:toks }));
  }catch(e){}
  return t;
}

//   AI PROVIDERS — only providers you can use for free (a standing free tier /
//   free API quota, no card and no credit purchase), then models running on
//   your own machine, then bring-your-own-key for anything you already pay for.
//   `base` is an OpenAI-compatible endpoint unless `gemini` is set.
const AI_PROVIDERS = [
  { id:'groq', name:'Groq — fast, free', group:'Free API tiers', base:'https://api.groq.com/openai/v1',
    keyLabel:'Groq API key', keyHint:'Free at console.groq.com', keyPh:'gsk_…',
    about:'Free tier, very fast. Good default for drafting.',
    models:[{id:'llama-3.3-70b-versatile',n:'Llama 3.3 70B'},{id:'llama-3.1-8b-instant',n:'Llama 3.1 8B'},{id:'openai/gpt-oss-120b',n:'GPT-OSS 120B'},{id:'qwen/qwen3-32b',n:'Qwen3 32B'}] },
  { id:'gemini', name:'Google Gemini — free tier', group:'Free API tiers', base:'https://generativelanguage.googleapis.com/v1beta', gemini:true,
    keyLabel:'Gemini API key', keyHint:'Free at aistudio.google.com/apikey', keyPh:'AIza…',
    about:'Free tier with a large context window.',
    models:[{id:'gemini-2.5-flash',n:'Gemini 2.5 Flash'},{id:'gemini-2.5-pro',n:'Gemini 2.5 Pro'},{id:'gemini-2.0-flash',n:'Gemini 2.0 Flash'}] },
  { id:'openrouter', name:'OpenRouter — free models', group:'Free API tiers', base:'https://openrouter.ai/api/v1', freeOnly:true,
    keyLabel:'OpenRouter key', keyHint:'Free at openrouter.ai/keys', keyPh:'sk-or-…',
    about:'One key, many models — the :free ones cost nothing.',
    models:[{id:'meta-llama/llama-3.3-70b-instruct:free',n:'Llama 3.3 70B (free)'},{id:'google/gemini-2.0-flash-exp:free',n:'Gemini 2.0 Flash (free)'},{id:'deepseek/deepseek-r1:free',n:'DeepSeek R1 (free)'},{id:'qwen/qwen3-235b-a22b:free',n:'Qwen3 235B (free)'}] },
  { id:'cerebras', name:'Cerebras — free tier', group:'Free API tiers', base:'https://api.cerebras.ai/v1',
    keyLabel:'Cerebras API key', keyHint:'Free at cloud.cerebras.ai', keyPh:'csk-…',
    about:'Free tier, extremely fast inference.',
    models:[{id:'llama3.1-8b',n:'Llama 3.1 8B'},{id:'llama-3.3-70b',n:'Llama 3.3 70B'},{id:'qwen-3-32b',n:'Qwen3 32B'}] },
  { id:'mistral', name:'Mistral — free tier', group:'Free API tiers', base:'https://api.mistral.ai/v1',
    keyLabel:'Mistral API key', keyHint:'Free at console.mistral.ai', keyPh:'…',
    about:'Free “experiment” tier on La Plateforme.',
    models:[{id:'mistral-small-latest',n:'Mistral Small'},{id:'open-mistral-nemo',n:'Mistral Nemo'},{id:'mistral-large-latest',n:'Mistral Large'}] },
  { id:'sambanova', name:'SambaNova — free tier', group:'Free API tiers', base:'https://api.sambanova.ai/v1',
    keyLabel:'SambaNova API key', keyHint:'Free at cloud.sambanova.ai', keyPh:'…',
    about:'Generous free tier on fast open models.',
    models:[{id:'Meta-Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Meta-Llama-3.1-8B-Instruct',n:'Llama 3.1 8B'},{id:'DeepSeek-R1',n:'DeepSeek R1'}] },
  { id:'together', name:'Together AI — free models', group:'Free API tiers', base:'https://api.together.xyz/v1',
    keyLabel:'Together API key', keyHint:'Free at api.together.ai', keyPh:'…',
    about:'Several models are free forever (look for -Free).',
    models:[{id:'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',n:'Llama 3.3 70B (free)'},{id:'meta-llama/Llama-Vision-Free',n:'Llama Vision (free)'}] },
  { id:'github', name:'GitHub Models — free with a GitHub token', group:'Free API tiers', base:'https://models.inference.ai.azure.com',
    keyLabel:'GitHub personal token', keyHint:'Free at github.com/settings/tokens (needs models:read)', keyPh:'ghp_…',
    about:'Free with any GitHub account — no billing needed.',
    models:[{id:'gpt-4o-mini',n:'GPT-4o mini'},{id:'Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Phi-3.5-MoE-instruct',n:'Phi-3.5 MoE'}] },
  { id:'glm', name:'Zhipu GLM — free tier', group:'Free API tiers', base:'https://open.bigmodel.cn/api/paas/v4',
    keyLabel:'Zhipu API key', keyHint:'Free at open.bigmodel.cn', keyPh:'…',
    about:'GLM-4 Flash is free and strong at long-form text.',
    models:[{id:'glm-4-flash',n:'GLM-4 Flash (free)'},{id:'glm-4-air',n:'GLM-4 Air'}] },
  { id:'qwen', name:'Qwen (DashScope) — free quota', group:'Free API tiers', base:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    keyLabel:'DashScope API key', keyHint:'Free at modelstudio.console.alibabacloud.com', keyPh:'sk-…',
    about:'Free monthly quota, OpenAI-compatible endpoint.',
    models:[{id:'qwen-plus',n:'Qwen Plus'},{id:'qwen-turbo',n:'Qwen Turbo'},{id:'qwen-max',n:'Qwen Max'}] },
  { id:'ovh', name:'OVH AI Endpoints — free', group:'Free API tiers', base:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
    keyLabel:'OVH API key', keyHint:'Free at endpoints.ai.cloud.ovh.net', keyPh:'…',
    about:'Free EU-hosted endpoints, no billing required.',
    models:[{id:'Meta-Llama-3_3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Qwen2.5-72B-Instruct',n:'Qwen2.5 72B'}] },
  { id:'scaleway', name:'Scaleway — free beta', group:'Free API tiers', base:'https://api.scaleway.ai/v1',
    keyLabel:'Scaleway API key', keyHint:'Free public beta at console.scaleway.com', keyPh:'…',
    about:'Free public beta on European-hosted models.',
    models:[{id:'llama-3.3-70b-instruct',n:'Llama 3.3 70B'},{id:'qwen2.5-coder-32b-instruct',n:'Qwen2.5 Coder 32B'}] },
  { id:'nvidia', name:'NVIDIA NIM — free developer credits', group:'Free API tiers', base:'https://integrate.api.nvidia.com/v1',
    keyLabel:'NVIDIA API key', keyHint:'Free at build.nvidia.com (1000 credits)', keyPh:'nvapi-…',
    about:'Free credits with a NVIDIA developer account — strong open models.',
    models:[{id:'meta/llama-3.3-70b-instruct',n:'Llama 3.3 70B'},{id:'nvidia/llama-3.3-nemotron-super-49b-v1',n:'Nemotron Super 49B'},{id:'deepseek-ai/deepseek-r1',n:'DeepSeek R1'},{id:'meta/llama-3.1-8b-instruct',n:'Llama 3.1 8B'}] },
  { id:'nebius', name:'Nebius AI Studio — free credits', group:'Free API tiers', base:'https://api.studio.nebius.com/v1',
    keyLabel:'Nebius API key', keyHint:'Free credits at studio.nebius.com', keyPh:'…',
    about:'Free starting credits on fast open models.',
    models:[{id:'meta-llama/Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Qwen/Qwen3-235B-A22B',n:'Qwen3 235B'},{id:'deepseek-ai/DeepSeek-V3',n:'DeepSeek V3'}] },
  { id:'hyperbolic', name:'Hyperbolic — free credits', group:'Free API tiers', base:'https://api.hyperbolic.xyz/v1',
    keyLabel:'Hyperbolic API key', keyHint:'Free credits at app.hyperbolic.xyz', keyPh:'…',
    about:'Free credits for open models, no card needed to start.',
    models:[{id:'meta-llama/Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Qwen/Qwen2.5-72B-Instruct',n:'Qwen2.5 72B'},{id:'deepseek-ai/DeepSeek-V3',n:'DeepSeek V3'}] },
  { id:'chutes', name:'Chutes — free daily quota', group:'Free API tiers', base:'https://llm.chutes.ai/v1',
    keyLabel:'Chutes API key', keyHint:'Free daily requests at chutes.ai', keyPh:'cpk_…',
    about:'Free daily quota on large open models.',
    models:[{id:'deepseek-ai/DeepSeek-V3-0324',n:'DeepSeek V3'},{id:'Qwen/Qwen3-235B-A22B',n:'Qwen3 235B'},{id:'meta-llama/Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'}] },
  { id:'cloudflare', name:'Cloudflare Workers AI — free daily allowance', group:'Free API tiers', base:'https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1', custom:true,
    keyLabel:'Cloudflare API token', keyHint:'Free daily neurons at dash.cloudflare.com — put your account id in the endpoint', keyPh:'…',
    about:'Free daily allowance. Swap YOUR_ACCOUNT_ID for your Cloudflare account id.',
    models:[{id:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',n:'Llama 3.3 70B'},{id:'@cf/qwen/qwen2.5-coder-32b-instruct',n:'Qwen2.5 Coder 32B'}] },
  { id:'ollama', name:'Ollama — local, no key', group:'Local (your machine)', base:'http://localhost:11434/v1', keyless:true,
    keyLabel:'API key', keyHint:'Not needed — Ollama runs on your machine', keyPh:'(none)',
    about:'Completely free and private. Needs Ollama running locally.',
    models:[{id:'llama3.1',n:'Llama 3.1'},{id:'qwen2.5',n:'Qwen 2.5'},{id:'mistral',n:'Mistral'}] },
  { id:'lmstudio', name:'LM Studio — local, no key', group:'Local (your machine)', base:'http://localhost:1234/v1', keyless:true,
    keyLabel:'API key', keyHint:'Not needed — LM Studio runs on your machine', keyPh:'(none)',
    about:'Completely free and private. Needs LM Studio’s local server.',
    models:[{id:'local-model',n:'Currently loaded model'}] },
  { id:'openai', name:'OpenAI — your own key', group:'Bring your own key', base:'https://api.openai.com/v1',
    keyLabel:'OpenAI API key', keyHint:'platform.openai.com/api-keys', keyPh:'sk-…',
    about:'Use your own paid OpenAI key.',
    models:[{id:'gpt-4o-mini',n:'GPT-4o mini'},{id:'gpt-4o',n:'GPT-4o'},{id:'gpt-4.1-mini',n:'GPT-4.1 mini'}] },
  { id:'deepseek', name:'DeepSeek — your own key', group:'Bring your own key', base:'https://api.deepseek.com/v1',
    keyLabel:'DeepSeek API key', keyHint:'platform.deepseek.com/api_keys', keyPh:'sk-…',
    about:'Cheap keys and strong long-form writing.',
    models:[{id:'deepseek-chat',n:'DeepSeek Chat'},{id:'deepseek-reasoner',n:'DeepSeek Reasoner'}] },
  { id:'xai', name:'xAI Grok — your own key', group:'Bring your own key', base:'https://api.x.ai/v1',
    keyLabel:'xAI API key', keyHint:'console.x.ai', keyPh:'xai-…',
    about:'Grok models with your own key.',
    models:[{id:'grok-3-mini',n:'Grok 3 mini'},{id:'grok-2-1212',n:'Grok 2'}] },
  { id:'moonshot', name:'Moonshot Kimi — your own key', group:'Bring your own key', base:'https://api.moonshot.ai/v1',
    keyLabel:'Moonshot API key', keyHint:'platform.moonshot.ai', keyPh:'sk-…',
    about:'Kimi models — very long context.',
    models:[{id:'kimi-k2-0711-preview',n:'Kimi K2'},{id:'moonshot-v1-128k',n:'Moonshot 128k'}] },
  { id:'perplexity', name:'Perplexity Sonar — your own key', group:'Bring your own key', base:'https://api.perplexity.ai',
    keyLabel:'Perplexity API key', keyHint:'perplexity.ai/settings/api', keyPh:'pplx-…',
    about:'Search-grounded answers with your own key.',
    models:[{id:'sonar',n:'Sonar'},{id:'sonar-pro',n:'Sonar Pro'}] },
  { id:'custom', name:'Custom — any OpenAI-compatible endpoint (BYOK)', group:'Bring your own key', base:'', custom:true,
    keyLabel:'API key', keyHint:'Your own key — stored only in this browser', keyPh:'sk-…',
    about:'Point at any OpenAI-compatible API — a proxy, a self-hosted model, your own gateway.',
    models:[] }
];

function aiProvider(id){ return AI_PROVIDERS.find(p => p.id === (id || S.config.provider)) || AI_PROVIDERS[0]; }

// Key for a provider: new per-provider map first, then the legacy fields
function aiKeyFor(id){
  const p = id || S.config.provider;
  const keys = S.config.aiKeys || {};
  if(keys[p]) return keys[p];
  if(p === 'groq') return S.config.groqKey || '';
  if(p === 'gemini') return S.config.geminiKey || '';
  if(p === 'openrouter') return S.config.openrouterKey || '';
  return '';
}
function aiSetKey(id, val){
  if(!S.config.aiKeys) S.config.aiKeys = {};
  S.config.aiKeys[id] = val;
}
// Endpoint for a provider: per-provider override first, then its default
function aiBaseFor(id){
  const p = id || S.config.provider;
  const bases = S.config.aiBases || {};
  if(bases[p]) return bases[p];
  return aiProvider(p).base || '';
}
// Model: per-provider choice first, then the legacy single model field,
// then the provider's first built-in model
function aiModelFor(id){
  const p = id || S.config.provider;
  const m = S.config.modelByProvider || {};
  if(m[p]) return m[p];
  if(p === S.config.provider && S.config.model) return S.config.model;
  const def = aiProvider(p).models || [];
  return def[0] ? def[0].id : '';
}
function aiSetModel(id, model){
  if(!S.config.modelByProvider) S.config.modelByProvider = {};
  S.config.modelByProvider[id] = model;
  S.config.model = model;
}

const FONTS = [
  {name:'Merriweather',f:"'Merriweather',serif",g:'Serif'},
  {name:'Playfair Display',f:"'Playfair Display',serif",g:'Serif'},
  {name:'Lora',f:"'Lora',serif",g:'Serif'},
  {name:'Crimson Text',f:"'Crimson Text',serif",g:'Serif'},
  {name:'EB Garamond',f:"'EB Garamond',serif",g:'Serif'},
  {name:'Cormorant Garamond',f:"'Cormorant Garamond',serif",g:'Serif'},
  {name:'Source Serif 4',f:"'Source Serif 4',serif",g:'Serif'},
  {name:'IBM Plex Serif',f:"'IBM Plex Serif',serif",g:'Serif'},
  {name:'Libre Baskerville',f:"'Libre Baskerville',serif",g:'Serif'},
  {name:'Crimson Pro',f:"'Crimson Pro',serif",g:'Serif'},
  {name:'Alegreya',f:"'Alegreya',serif",g:'Serif'},
  {name:'Bitter',f:"'Bitter',serif",g:'Serif'},
  {name:'Cardo',f:"'Cardo',serif",g:'Serif'},
  {name:'Domine',f:"'Domine',serif",g:'Serif'},
  {name:'Gentium Book Plus',f:"'Gentium Book Plus',serif",g:'Serif'},
  {name:'Literata',f:"'Literata',serif",g:'Serif'},
  {name:'Newsreader',f:"'Newsreader',serif",g:'Serif'},
  {name:'Petrona',f:"'Petrona',serif",g:'Serif'},
  {name:'PT Serif',f:"'PT Serif',serif",g:'Serif'},
  {name:'Spectral',f:"'Spectral',serif",g:'Serif'},
  {name:'Vollkorn',f:"'Vollkorn',serif",g:'Serif'},
  {name:'Bodoni Moda',f:"'Bodoni Moda',serif",g:'Serif'},
  {name:'Faustina',f:"'Faustina',serif",g:'Serif'},
  {name:'Gelasio',f:"'Gelasio',serif",g:'Serif'},
  {name:'Tinos',f:"'Tinos',serif",g:'Serif'},
  {name:'Cinzel',f:"'Cinzel',serif",g:'Serif'},
  {name:'Inter',f:"'Inter',sans-serif",g:'Sans'},
  {name:'Fira Sans',f:"'Fira Sans',sans-serif",g:'Sans'},
  {name:'Libre Franklin',f:"'Libre Franklin',sans-serif",g:'Sans'},
  {name:'Nunito',f:"'Nunito',sans-serif",g:'Sans'},
  {name:'Open Sans',f:"'Open Sans',sans-serif",g:'Sans'},
  {name:'Public Sans',f:"'Public Sans',sans-serif",g:'Sans'},
  {name:'Roboto',f:"'Roboto',sans-serif",g:'Sans'},
  {name:'Space Grotesk',f:"'Space Grotesk',sans-serif",g:'Sans'},
  {name:'Work Sans',f:"'Work Sans',sans-serif",g:'Sans'},
  {name:'Manrope',f:"'Manrope',sans-serif",g:'Sans'},
  {name:'DM Sans',f:"'DM Sans',sans-serif",g:'Sans'},
  {name:'Figtree',f:"'Figtree',sans-serif",g:'Sans'},
  {name:'Plus Jakarta Sans',f:"'Plus Jakarta Sans',sans-serif",g:'Sans'},
  {name:'Outfit',f:"'Outfit',sans-serif",g:'Sans'},
  {name:'Sora',f:"'Sora',sans-serif",g:'Sans'},
  {name:'JetBrains Mono',f:"'JetBrains Mono',monospace",g:'Mono'},
  {name:'Courier Prime',f:"'Courier Prime',monospace",g:'Mono'},
  {name:'IBM Plex Mono',f:"'IBM Plex Mono',monospace",g:'Mono'},
  {name:'Space Mono',f:"'Space Mono',monospace",g:'Mono'},
  {name:'Roboto Mono',f:"'Roboto Mono',monospace",g:'Mono'},
  {name:'Zilla Slab',f:"'Zilla Slab',serif",g:'Slab'},
  {name:'Roboto Slab',f:"'Roboto Slab',serif",g:'Slab'},
  {name:'Arvo',f:"'Arvo',serif",g:'Slab'},
  {name:'Caveat',f:"'Caveat',cursive",g:'Hand'},
  {name:'Dancing Script',f:"'Dancing Script',cursive",g:'Hand'},
  {name:'Kalam',f:"'Kalam',cursive",g:'Hand'},
  {name:'Patrick Hand',f:"'Patrick Hand',cursive",g:'Hand'},
  {name:'Noto Serif Devanagari',f:"'Noto Serif Devanagari',serif",g:'Indic'},
  {name:'Noto Serif Tamil',f:"'Noto Serif Tamil',serif",g:'Indic'},
  {name:'Noto Serif Bengali',f:"'Noto Serif Bengali',serif",g:'Indic'},
  {name:'Noto Serif Telugu',f:"'Noto Serif Telugu',serif",g:'Indic'}
];

// ═══ Languages — International ═══
const LANGS_INTL = [
  {code:'en',name:'English',flag:'🇬🇧'},
  {code:'es',name:'Spanish',flag:'🇪🇸'},
  {code:'fr',name:'French',flag:'🇫🇷'},
  {code:'de',name:'German',flag:'🇩🇪'},
  {code:'it',name:'Italian',flag:'🇮🇹'},
  {code:'pt',name:'Portuguese',flag:'🇵🇹'},
  {code:'nl',name:'Dutch',flag:'🇳🇱'},
  {code:'sv',name:'Swedish',flag:'🇸🇪'},
  {code:'pl',name:'Polish',flag:'🇵🇱'},
  {code:'tr',name:'Turkish',flag:'🇹🇷'},
  {code:'el',name:'Greek',flag:'🇬🇷'},
  {code:'cs',name:'Czech',flag:'🇨🇿'},
  {code:'ro',name:'Romanian',flag:'🇷🇴'},
  {code:'hu',name:'Hungarian',flag:'🇭🇺'},
  {code:'uk',name:'Ukrainian',flag:'🇺🇦'},
  {code:'ja',name:'Japanese',flag:'🇯🇵'},
  {code:'ko',name:'Korean',flag:'🇰🇷'},
  {code:'zh',name:'Chinese',flag:'🇨🇳'},
  {code:'th',name:'Thai',flag:'🇹🇭'},
  {code:'vi',name:'Vietnamese',flag:'🇻🇳'},
  {code:'id',name:'Indonesian',flag:'🇮🇩'},
  {code:'ms',name:'Malay',flag:'🇲🇾'},
  {code:'fil',name:'Filipino',flag:'🇵🇭'},
  {code:'ar',name:'Arabic',flag:'🇸🇦'},
  {code:'he',name:'Hebrew',flag:'🇮🇱'},
  {code:'fa',name:'Persian',flag:'🇮🇷'},
  {code:'ru',name:'Russian',flag:'🇷🇺'},
  {code:'sw',name:'Swahili',flag:'🇰🇪'}
];

// ═══ Languages — Indian regional ═══
const LANGS_INDIA = [
  { code:'hi', name:'Hindi', flag:'🇮🇳', native:'हिन्दी' }
];

// ═══════════════════════════════════════════════════════════
//   PER-MODE DATA MODEL
// ═══════════════════════════════════════════════════════════

function freshModeData(){
  return {
    currentCategory: null,
    currentProject: null,
    currentChapter: null,
    _expandedProject: null,
    projects: [],
    chapters: [],
    drafts: [],
    notes: [],
    bible: {
      characters: [],
      locations: [],
      items: [],
      scenes: [],
      events: [],
      organizations: []
    },
    references: [],
    beats: [],
    timeline: [],
    kanban: {
      columns: [
        {id:'k1', title:'Ideas',     cards:[]},
        {id:'k2', title:'Drafting',  cards:[]},
        {id:'k3', title:'Editing',   cards:[]},
        {id:'k4', title:'Done',      cards:[]}
      ]
    },
    canvasElements: [],
    versions: [],
    published: [],   // published book records for Notebook shelf
    collections: []  // notebook collections: {id,name,books:[projectIds]}
  };
}

// ═══════════════════════════════════════════════════════════
//   STATE
// ═══════════════════════════════════════════════════════════

const S = {
  config:{
    provider:'groq', model:'llama-3.3-70b-versatile',
    aiKeys:{}, aiBases:{}, modelByProvider:{},
    groqKey:'', geminiKey:'', openrouterKey:'', baseUrl:'',
    wolframAppId:'', merriamKey:'',
    temperature:0.75, maxTokens:4096, availableModels:{},
    color:'minimal',          // color preset: minimal, retro, noir, horror, animated, synthwave, cyberpunk, zen, paper, cinematic, painting
    visualizerAlign:'flex-end',   // 'center' | 'flex-end'   ← bars grow bottom-to-top
    musicProxy:false,           // route catbox URLs through CORS proxy
    style:'vercel',           // style preset: vercel, netflix, linear, flutter, apple, notion, arc, discord, material, windows, macos, figma
    theme:'night',            // color theme id from THEMES (every theme is dark)
    eyeComfort:false,         // light filter over any theme — neutral at 50
    eyeComfortLevel:50,       // 0–100 → cold below 50, normal at 50, warm above 50
    uiBrightness:50,          // 0–100 → dim below 50, normal at 50, bright above 50
    visualScaleVersion:2,
    uiStyle:'modern',         // interface style: modern (the app's own) | flutter (Material 3)
    iconPack:'bootstrap',     // the one icon set the app ships (vendor/bootstrap-icons)
    // ── experimental (Settings → Experimental) ──
    expOverlay:false,         // floating overlay screen instead of the docked split screen
    expMixedFonts:false,      // rotate three fonts while typing
    mixedFonts:['','',''],    // the three fonts ('' = the editor's own font)
    mixedFontScope:'letter',  // 'letter' | 'word' | 'sentence'
    mixedFontPick:0,          // click a Font chip, then type: that font is applied
    expOrganize:false,        // "Organize my words" action in the AI panel + right-click menu
    expHinglish:false,        // Hinglish -> Hindi / English entries inside the Translate option
    overlay:{ open:false, page:'stats', x:null, y:null, w:640, h:420 },
    split:{ w:420 },          // docked split screen: how wide the side column is
    font:'', uiFont:'', fontSize:17, lineHeight:1.75,
    letterSpacing:0, wordSpacing:0, paraSpacing:14,
    fontWeight:'400', textAlign:'left',
    editorWidth:'760px', canvasPad:48,
    autoSave:true, autoVersion:true, autoJson:true, spellCheck:false, smartQuotes:false,
    ghostText:true, suggestionChips:true, autocomplete:true,
    focusMode:false,
    uiLang:'en', uiRtl:false,      // interface language (Settings → Language)
    defaultLang:'en', outputLang:'en',
    liveBarTarget:'devanagari', liveBarActive:false,
    dailyGoal:500, writingLog:{}, openLog:{},
    plugins:{
      hinglish:true, voice:true, wordGoal:true, readingTime:true,
      dictionary:true, thesaurus:true, wikipedia:true,
      websearch:true, imagesearch:true, tts:true,
      wolfram:false, merriam:false, idioms:false, quotes:false, etymology:false
    },
    uiScale:1, layout:'classic',
    /* the round button's two clicks, and which of the project's five
       workspaces are in the rotation (Settings → Custom). A switch per
       workspace; `workspaces` is only the older single flag, read once to
       migrate a profile written before the per-workspace switches. */
    fabLeftClick:true, fabRightClick:true, workspaces:true,
    wsOff:[false,false,false,false,false],
    /* which pages the round button's LEFT click still lists, by page id
       (`fabPages.plan === false` takes Plan out of the menu) */
    fabPages:{},
    /* the project card's own shape, per mode - see homeProjLayout()
       (pages.js) and the two rows in Settings -> General */
    projCardNovel:'tiles', projCardScreenplay:'tiles',
    pickerSources:['editor','chapters','notes','ideas','bible','drafts','references'],
    defaultExport:'md', includeMetadata:true, pageSize:'A4', pageMargins:25,
    authorName:'', authorEmail:'',
    userName:''                /* the name the app greets you by (welcome.js) */
  },
      modes:{},
      mode:'novel',
      category:null,
      page:'draft',
  // FAB menu state
      fabMenuOpen: false
};

// ═══════════════════════════════════════════════════════════
//   DATA ACCESS — current mode's data
// ═══════════════════════════════════════════════════════════

function D(){ return S.modes[S.mode]; }

/* ═══════════════════════════════════════════════════════════
   PER-PROJECT DATA — every project owns its own Views · Reference ·
   Workflow. Point the current mode's working set at the project's own
   copies (same object references, so edits save straight back), and
   give a brand-new project the empty shape it needs.
   ═══════════════════════════════════════════════════════════ */
function useProjectData(proj){
  if(!proj) return null;
  const d = D();
  /* `aiChats` belongs here too: it was left out, so the Draft page's chat
     was ONE list shared by every project — open a second book and the first
     book's conversation was still sitting in it, which is exactly the "it
     does not remember which project" the writer reported. The chats are the
     project's now, like every other list on this line. */
  const lists = ['chapters','drafts','ideas','notes','beats','references','timeline','cast','versions','aiChats'];
  lists.forEach(function(k){ if(!Array.isArray(proj[k])) proj[k] = []; });
  if(!proj.chapters.length){
    proj.chapters.push({ id: (typeof uid === 'function' ? uid() : 'ch' + Date.now()),
                         title:'Chapter 1', content:'', children:[], collapsed:false });
  }
  if(!proj.bible || typeof proj.bible !== 'object'){
    proj.bible = { characters:[], locations:[], items:[], scenes:[], events:[], organizations:[] };
  }
  if(!proj.kanban || typeof proj.kanban !== 'object'){
    proj.kanban = { columns:[
      {id:'k1', title:'Ideas', cards:[]}, {id:'k2', title:'Drafting', cards:[]},
      {id:'k3', title:'Editing', cards:[]}, {id:'k4', title:'Done', cards:[]}
    ]};
  }

  lists.forEach(function(k){ d[k] = proj[k]; });
  d.bible  = proj.bible;
  d.kanban = proj.kanban;

  /* the active chat goes with the chats: a chat id from the book you just
     left is not a chat in this one */
  if(d.aiChatActive && !proj.aiChats.some(function(c){ return c && c.id === d.aiChatActive; })){
    d.aiChatActive = null;
  }

  d.currentProject = proj.id;
  if(proj.category) d.currentCategory = proj.category;
  d.currentChapter = (d.currentChapter && proj.chapters.some(function(c){ return c.id === d.currentChapter; }))
    ? d.currentChapter : proj.chapters[0].id;
  return proj;
}
window.useProjectData = useProjectData;

// Aliases so old code keeps working
Object.defineProperty(window, 'chapters',        {get:()=>D().chapters,          set:v=>D().chapters=v});
Object.defineProperty(window, 'currentChapter',  {get:()=>D().currentChapter,    set:v=>D().currentChapter=v});
Object.defineProperty(window, 'drafts',          {get:()=>D().drafts,            set:v=>D().drafts=v});
Object.defineProperty(window, 'notes',           {get:()=>D().notes,             set:v=>D().notes=v});
Object.defineProperty(window, 'ideas',           {get:()=>D().ideas,             set:v=>D().ideas=v});
Object.defineProperty(window, 'bible',           {get:()=>D().bible,             set:v=>D().bible=v});
Object.defineProperty(window, 'references',      {get:()=>D().references,        set:v=>D().references=v});
Object.defineProperty(window, 'beats',           {get:()=>D().beats,             set:v=>D().beats=v});
Object.defineProperty(window, 'timeline',        {get:()=>D().timeline,          set:v=>D().timeline=v});
Object.defineProperty(window, 'kanban',          {get:()=>D().kanban,            set:v=>D().kanban=v});
Object.defineProperty(window, 'canvasElements',  {get:()=>D().canvasElements,    set:v=>D().canvasElements=v});
Object.defineProperty(window, 'versions',        {get:()=>D().versions,          set:v=>D().versions=v});
Object.defineProperty(window, 'projects',        {get:()=>D().projects,          set:v=>D().projects=v});
Object.defineProperty(window, 'projectId',       {get:()=>D().currentProject,    set:v=>D().currentProject=v});

// ═══════════════════════════════════════════════════════════
//   UTILITIES
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => 'i' + Math.random().toString(36).slice(2,10);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function toast(msg, kind = 'ok'){
  const el = $('toast');
  if(!el) return;
  $('toastMsg').textContent = msg;
  el.className = 'toast show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err' ? 'bi bi-exclamation-triangle-fill' : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function toastLeft(msg, kind){
  kind = kind || 'info';
  const el = document.getElementById('toastLeft');
  if(!el) return;
  const msgEl = document.getElementById('toastLeftMsg');
  if(msgEl) msgEl.textContent = msg;
  el.className = 'toast-left show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err'
    ? 'bi bi-exclamation-triangle-fill'
    : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-info-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 3000);
}
window.toastLeft = toastLeft;

// Chapter tree
function findCh(id, list = D().chapters){
  for(const c of list){
    if(c.id === id) return {ch:c, list};
    if(c.children){ const f = findChIn(id, c); if(f) return f; }
  }
  return null;
}
function findChIn(id, parent){
  if(!parent.children) return null;
  for(const c of parent.children){
    if(c.id === id) return {ch:c, list:parent.children};
    if(c.children){ const f = findChIn(id, c); if(f) return f; }
  }
  return null;
}
function curCh(){
  const f = findCh(D().currentChapter);
  return f ? f.ch : D().chapters[0];
}
function flatChs(list = D().chapters, depth = 0, out = []){
  for(const c of list){
    out.push({ch:c, depth});
    if(c.children && !c.collapsed) flatChs(c.children, depth + 1, out);
  }
  return out;
}
function ensureIds(){
  D().chapters.forEach(c => {
    if(!c.id) c.id = uid();
    if(!c.children) c.children = [];
    if(c.collapsed === undefined) c.collapsed = false;
  });
  if(!D().currentChapter && D().chapters[0]) D().currentChapter = D().chapters[0].id;
}

// Counts
function wordCount(html){
  if(!html) return 0;
  const d = document.createElement('div');
  d.innerHTML = html;
  const t = d.innerText.trim();
  return t ? t.split(/\s+/).length : 0;
}
function totalWords(){
  let n = 0;
  flatChs().forEach(({ch}) => {
    if(ch.id === D().currentChapter) return;
    n += wordCount(ch.content);
  });
  const ed = $('editor');
  if(ed) n += wordCount(ed.innerText);
  return n;
}

function modePages(){
  const m = currentMode();
  if(!m) return BASE_PAGES;
  return ['editor', 'write', 'draft', 'plan', 'inspire', 'stats', 'notebook', 'import']
    .concat(m.editorViews || []);
}
// Mode/page helpers
function currentMode(){
  return MODES.find(m => m.id === S.mode) || MODES[0];
}
function currentPageDef(){
  const def = PAGE_META[S.page] || {name:'Page', icon:'file'};
  return { name: (typeof pname === 'function') ? pname(S.page) : def.name, icon: def.icon };
}

function allLangs(){ return LANGS_INTL.concat(LANGS_INDIA); }
function findLang(code){ return allLangs().find(l => l.code === code); }

// ═══════════════════════════════════════════════════════════
//   PERSISTENCE
// ═══════════════════════════════════════════════════════════

const STORE = {CFG:'sf7_config', DATA:'sf7_data', OLD6:'sf6_data', OLD5:'sfp5_doc'};

// ═══════════════════════════════════════════════════════════
//   SECTION NAMES — Scene / Subscene in screenplay, Chapter /
//   Subchapter everywhere else. A new project seeds its first section
//   as "Chapter 1" whatever the mode is, so the untouched default names
//   are renamed to match the mode. Only the exact defaults are touched —
//   anything the writer named themselves is left alone.
// ═══════════════════════════════════════════════════════════
function renameDefaultSection(title){
  return String(title == null ? '' : title)
    .replace(/^Chapter(\s+\d+)?$/, 'Scene$1')
    .replace(/^Subchapter(\s+\d+)?$/, 'Subscene$1');
}

function normalizeSectionTitles(list){
  const ls = list || (D() && D().chapters) || [];
  const screenplay = S.mode === 'screenplay';
  ls.forEach(c => {
    if(screenplay && typeof c.title === 'string' && c.title){
      const renamed = renameDefaultSection(c.title);
      if(renamed !== c.title) c.title = renamed;
    }
    if(c.children && c.children.length) normalizeSectionTitles(c.children);
  });
}
window.normalizeSectionTitles = normalizeSectionTitles;

// ═══════════════════════════════════════════════════════════
//   DAYS OPENED — one entry per calendar day the app was opened.
//   The Statistics day line fills a circle for each of these days.
//   Keys are local dates (YYYY-MM-DD), so the circle matches the
//   day the person actually saw.
// ═══════════════════════════════════════════════════════════
function dayKey(dt){
  const d = dt || new Date();
  const p = n => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
window.dayKey = dayKey;

function markTodayOpened(){
  if(!S.config.openLog || typeof S.config.openLog !== 'object') S.config.openLog = {};
  const log = S.config.openLog;
  log[dayKey()] = 1;
  /* keep the log bounded — a little over a year of days */
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 400);
  const oldest = dayKey(cutoff);
  Object.keys(log).forEach(k => { if(k < oldest) delete log[k]; });
  save();
}
window.markTodayOpened = markTodayOpened;

/* save() also runs at boot and on page changes, so the "Updated" stamp below
   is gated on a real edit: the editor's own input event flips this flag. */
let sfDocDirty = false;
document.addEventListener('input', function(e){
  const t = e.target;
  if(t && (t.id === 'editor' || (t.closest && t.closest('#editor')))) sfDocDirty = true;
}, true);

function save(){
  /* Overlay panes load the app in a read-only view — they must never write
     over the document the writer is editing in the main window. */
  if(window.SF_VIEW) return;
  normalizeSectionTitles();
   const ed = $('editor');
  if(ed && (S.page === 'write' || S.page === 'manuscript')){
    const c = curCh();
    if(c) c.content = ed.innerHTML;
  }

  /* stamp the open project — this is the "Last updated" date the stats card
     shows, and it is written by the same save() that persists everything else */
  try{
    const d = D();
    const p = (d.projects || []).find(x => x.id === d.currentProject);
        if(p && sfDocDirty) p.updated = Date.now();

  }catch(e){}

  try{
    localStorage.setItem(STORE.CFG, JSON.stringify(S.config));

    localStorage.setItem(STORE.CFG, JSON.stringify(S.config));
    localStorage.setItem(STORE.DATA, JSON.stringify({
      modes: S.modes,
      mode: S.mode,
      page: S.page
    }));
  }catch(e){ console.warn('save failed', e); }
}

  const OK_LANG = ['en','hi'];
  if(!OK_LANG.includes(S.config.defaultLang)) S.config.defaultLang = 'en';
  if(!OK_LANG.includes(S.config.outputLang))  S.config.outputLang  = 'en';
  S.config.uiLang = 'en';

function load(){
  try{
    const cfg = localStorage.getItem(STORE.CFG);
    if(cfg) Object.assign(S.config, JSON.parse(cfg));

    const data = localStorage.getItem(STORE.DATA);
    if(data){
      const d = JSON.parse(data);
      if(d.modes) S.modes = d.modes;
      if(d.mode) S.mode = d.mode;
      S.page = 'draft';
      // Ensure all modes exist
      MODES.forEach(m => {
        if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
      });
    } else {
      migrateOld();
    }
  }catch(e){ console.warn('load failed', e); }
  ensureIds();
  normalizeSectionTitles();
  if(!window.SF_VIEW) markTodayOpened();
}

// ═══════════════════════════════════════════════════════════

function migrateOld(){
  try{
    // Ensure modes exist before migration
    MODES.forEach(m => {
      if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
    });

    const old6 = localStorage.getItem(STORE.OLD6);
    if(old6){
      const d = JSON.parse(old6);
      // v6 had flat data; move into novel mode
      if(d.chapters) S.modes.novel.chapters = d.chapters;
      if(d.currentChapter) S.modes.novel.currentChapter = d.currentChapter;
      if(d.drafts) S.modes.novel.drafts = d.drafts;
      if(d.notes) S.modes.novel.notes = d.notes;
      if(d.ideas) S.modes.novel.ideas = d.ideas;
      if(d.bible) S.modes.novel.bible = d.bible;
      if(d.references) S.modes.novel.references = d.references;
      if(d.beats) S.modes.novel.beats = d.beats;
      if(d.timeline) S.modes.novel.timeline = d.timeline;
      if(d.kanban) S.modes.novel.kanban = d.kanban;
      if(d.canvasElements) S.modes.novel.canvasElements = d.canvasElements;
      if(d.versions) S.modes.novel.versions = d.versions;
      if(d.projects) S.modes.novel.projects = d.projects;
      if(d.mode) S.mode = d.mode;
      if(d.page) S.page = d.page;
      console.log('%c ✓ Migrated from v6', 'color:#10b981');
      save();
      return;
    }
    const old5 = localStorage.getItem(STORE.OLD5);
    if(old5){
      const d = JSON.parse(old5);
      if(d.chapters) S.modes.novel.chapters = d.chapters;
      if(d.currentChapterId) S.modes.novel.currentChapter = d.currentChapterId;
      if(d.notes) S.modes.novel.notes = d.notes;
      if(d.ideas) S.modes.novel.ideas = d.ideas;
      if(d.bible) S.modes.novel.bible = d.bible;
      if(d.versions) S.modes.novel.versions = d.versions;
      if(d.mode) S.mode = d.mode;
      console.log('%c ✓ Migrated from v5', 'color:#10b981');
      save();
    }
  }catch(e){ console.warn('migration failed', e); }
  
        // Ensure all modes exist
      MODES.forEach(m => {
        if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
      });
}

// ═══════════════════════════════════════════════════════════
//   EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════

window.S = S;
window.MODES = MODES;
window.BASE_PAGES = BASE_PAGES;
window.PAGE_META = PAGE_META;
window.THEMES = THEMES;
window.themeById = themeById;
window.themeTokens = themeTokens;
window.resolveThemeId = resolveThemeId;
window.applyThemeVars = applyThemeVars;
window.AI_PROVIDERS = AI_PROVIDERS;
window.aiProvider = aiProvider;
window.aiKeyFor = aiKeyFor;
window.aiSetKey = aiSetKey;
window.aiBaseFor = aiBaseFor;
window.aiModelFor = aiModelFor;
window.aiSetModel = aiSetModel;
window.FONTS = FONTS;
window.LANGS_INTL = LANGS_INTL;
window.LANGS_INDIA = LANGS_INDIA;
window.$ = $;
window.$$ = $$;
window.esc = esc;
window.uid = uid;
window.debounce = debounce;
window.toast = toast;
window.findCh = findCh;
window.curCh = curCh;
window.flatChs = flatChs;
window.wordCount = wordCount;
window.totalWords = totalWords;
window.D = D;
window.currentMode = currentMode;
window.currentPageDef = currentPageDef;
window.modePages = modePages;
window.allLangs = allLangs;
window.findLang = findLang;
window.save = save;
window.load = load;
window.modePages = modePages;

console.log('%c ✓ state.js loaded (' + MODES.length + ' modes · ' + Object.keys(PAGE_META).length + ' pages)', 'color:#10b981;font-weight:600;');
