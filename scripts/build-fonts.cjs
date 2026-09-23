/* ═══════════════════════════════════════════════════════════
   VENDOR THE WRITING FONTS

   The app's typefaces used to come from fonts.googleapis.com on every
   load. Online that is invisible; offline — and in the packaged desktop
   build, which has no network — every family silently falls back to the
   generic `serif` / `sans-serif` / `monospace`, so picking a font (or
   Intermixing taking a turn) changes nothing but metrics. That is the
   bug this fixes: the fonts are downloaded once into vendor/webfonts/,
   beside the icon fonts, and served from the app from then on.

   The family list is FAMILIES below — the same request the page used to
   make, plus the writing faces added since. It is the single source of
   truth: every family named there must also be in state.js FONTS (or be
   used by the interface), or it is dead weight in the repo.

   Files are cached: a face already on disk is never re-downloaded, so a
   run after adding one family only fetches that family.

   Usage:  node scripts/build-fonts.cjs
   ═══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'vendor', 'webfonts');

/* Google only hands out woff2 to a browser it recognises, and only then
   does it list every subset a family carries (with a legacy UA it serves
   ttf and just one block per weight). */
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* Subsets we do not ship: `math` and `symbols` are large and the app
   never writes them, and every other subset a family offers is kept so
   the multi-script languages in Settings all render. */
const SKIP = /^(math|symbols)$/;

/* The writing faces, grouped as the app groups them. */
const FAMILIES = [
  /* — the interface and the app's own display face — */
  'Inter:wght@400;500;600;700;800',
  'Fraunces:wght@500;600;700',

  /* — serif: the prose faces — */
  'Merriweather:wght@400;700;900',
  'Playfair+Display:wght@500;700;900',
  'Lora:wght@400;500;700',
  'Crimson+Text:wght@400;600',
  'Crimson+Pro:wght@400;600',
  'EB+Garamond:wght@400;500;600',
  'Cormorant+Garamond:wght@400;500;600',
  'Source+Serif+4:wght@400;600',
  'IBM+Plex+Serif:wght@400;500;600',
  'Libre+Baskerville:wght@400;700',
  'Alegreya:wght@400;600',
  'Bitter:wght@400;600',
  'Cardo:wght@400;700',
  'Domine:wght@400;600',
  'Gentium+Book+Plus:wght@400;700',
  'Literata:wght@400;600',
  'Newsreader:wght@400;600',
  'PT+Serif:wght@400;700',
  'Petrona:wght@400;600',
  'Spectral:wght@400;600',
  'Vollkorn:wght@400;600',
  'Bodoni+Moda:wght@400;600',
  'Faustina:wght@400;600',
  'Gelasio:wght@400;600',
  'Tinos:wght@400;700',
  'Cinzel:wght@400;600',

  /* — sans — */
  'Fira+Sans:wght@400;500;600',
  'Libre+Franklin:wght@400;600',
  'Nunito:wght@400;600',
  'Open+Sans:wght@400;600',
  'Public+Sans:wght@400;600',
  'Roboto:wght@400;500;700',
  'Space+Grotesk:wght@400;600',
  'Work+Sans:wght@400;500;600',
  'Manrope:wght@400;600',
  'DM+Sans:wght@400;600',
  'Figtree:wght@400;600',
  'Plus+Jakarta+Sans:wght@400;600',
  'Outfit:wght@400;600',
  'Sora:wght@400;600',

  /* — mono and slab — */
  'JetBrains+Mono:wght@400;500;600',
  'Courier+Prime:wght@400;700',
  'IBM+Plex+Mono:wght@400;500',
  'Space+Mono:wght@400;700',
  'Roboto+Mono:wght@400;600',
  'Zilla+Slab:wght@400;600',
  'Roboto+Slab:wght@400;600',
  'Arvo:wght@400;700',

  /* — hand — */
  'Caveat:wght@400;600',
  'Dancing+Script:wght@400;600',
  'Kalam:wght@400;700',
  'Patrick+Hand:wght@400',

  /* — the scripts the language setting writes in — */
  'Noto+Serif+Devanagari:wght@400;600',
  'Noto+Serif+Tamil:wght@400;600',
  'Noto+Serif+Bengali:wght@400;600',
  'Noto+Serif+Telugu:wght@400;600'
];

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function get(url, asBuffer){
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if(!res.ok) throw new Error(url + ' → HTTP ' + res.status);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.text();
}

/* One @font-face block, with the subset comment that precedes it. */
function parse(css){
  const out = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/gi;
  let m;
  while((m = re.exec(css))){
    const subset = m[1].toLowerCase();
    const body = m[2];
    const pick = key => (new RegExp(key + '\\s*:\\s*([^;]+);').exec(body) || [])[1];
    const src = /url\((https:[^)]+)\)/.exec(body);
    if(!src) continue;
    out.push({
      subset,
      family: (pick('font-family') || '').replace(/['"]/g, '').trim(),
      style:  (pick('font-style') || 'normal').trim(),
      weight: (pick('font-weight') || '400').trim(),
      display:(pick('font-display') || 'swap').trim(),
      range:  (pick('unicode-range') || '').trim(),
      url:    src[1],
      head:   /variation-settings|font-stretch/.test(body)
    });
  }
  return out;
}

async function main(){
  fs.mkdirSync(OUT, { recursive: true });
  console.log(FAMILIES.length + ' families\n');

  const faces = [];
  const failed = [];
  let bytes = 0, fetched = 0;

  for(const spec of FAMILIES){
    let blocks;
    try{
      const css = await get('https://fonts.googleapis.com/css2?family=' + spec + '&display=swap');
      blocks = parse(css).filter(b => !SKIP.test(b.subset));
    }catch(e){
      console.log('  ! ' + spec.split(':')[0].replace(/\+/g, ' ') + ' — ' + e.message);
      failed.push(spec.split(':')[0].replace(/\+/g, ' '));
      continue;
    }
    let kept = 0;
    for(const b of blocks){
      const file = slug(b.family) + '-' + b.subset + '-' + slug(b.weight) + (b.style === 'italic' ? '-italic' : '') + '.woff2';
      const dest = path.join(OUT, file);
      if(fs.existsSync(dest) && fs.statSync(dest).size > 0){
        bytes += fs.statSync(dest).size;
      }else{
        try{
          const buf = await get(b.url, true);
          fs.writeFileSync(dest, buf);
          bytes += buf.length;
          fetched++;
        }catch(e){
          console.log('  ! ' + file + ' — ' + e.message);
          continue;
        }
      }
      kept++;
      faces.push({ ...b, file });
    }
    console.log('  ' + spec.split(':')[0].replace(/\+/g, ' ') + ' — ' + kept + ' faces');
  }

  const sheet = ['/* generated by scripts/build-fonts.cjs — do not edit by hand.',
    '   ' + faces.length + ' faces, served from vendor/webfonts. No network needed. */', ''];
  for(const f of faces){
    sheet.push('@font-face{'
      + 'font-family:"' + f.family + '";'
      + 'font-style:' + f.style + ';'
      + 'font-weight:' + f.weight + ';'
      + 'font-display:' + f.display + ';'
      + 'src:url("' + f.file + '") format("woff2");'
      + (f.range ? 'unicode-range:' + f.range + ';' : '')
      + '}');
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), sheet.join('\n') + '\n');

  console.log('\n' + faces.length + ' faces written (' + fetched + ' downloaded this run)');
  console.log('total ' + (bytes / 1048576).toFixed(2) + ' MB in vendor/webfonts/');
  if(failed.length) console.log('families that failed: ' + failed.join(', '));
}

main().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
