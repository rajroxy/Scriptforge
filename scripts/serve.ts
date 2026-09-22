/**
 * Static server for the ScriptForge web app (index.html + plain JS/CSS at the repo root).
 *
 * Zero dependencies — uses only node:http / node:fs, so it runs under Bun or Node.
 *   bun scripts/serve.ts          → http://0.0.0.0:3000
 *   PORT=4000 bun scripts/serve.ts
 */
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
};

/** Map a request URL to a file inside ROOT, or null if it escapes the root. */
function resolveRequestPath(url: string): string | null {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const candidate = resolve(join(ROOT, normalize(pathname)));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;
  return candidate;
}

function send(res: ServerResponse, status: number, body: string, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

/* ═══════════════════════════════════════════════════════════
   PUBLISHED BOOKS — a hosted read link with a shareable URL
   POST /api/publish      { title, author, …, sections:[{title,html}] }
                          → { url: "/r/<id>", id }
   GET  /r/<id>           the reader page
   GET  /api/publish/<id> the stored payload
   Stored as JSON in <root>/.published/<id>.json
   ═══════════════════════════════════════════════════════════ */
const PUB_DIR = join(ROOT, ".published");

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 24 * 1024 * 1024) { reject(new Error("payload too large")); req.destroy(); }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const pubEsc = (v: unknown) =>
  String(v == null ? "" : v)
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function readerPage(book: any): string {
  const sections = Array.isArray(book.sections) ? book.sections : [];
  const nav = sections.map((s: any, i: number) =>
    `<li><a href="#s${i + 1}">${pubEsc(s.title || "Section " + (i + 1))}</a></li>`).join("");
  const body = sections.map((s: any, i: number) =>
    `<section id="s${i + 1}"><h2 class="st">${pubEsc(s.title || "Section " + (i + 1))}</h2>${s.html || ""}</section>`).join("");
  const readNext = book.readNext && book.readNext.url
    ? `<div class="rn"><span>Read next</span><a href="${pubEsc(book.readNext.url)}">${pubEsc(book.readNext.label || book.readNext.url)}</a></div>`
    : "";
  const front = book.dedication ? `<p class="ded">${pubEsc(book.dedication)}</p>` : "";
  return `<!doctype html><html lang="${pubEsc(book.language || "en")}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pubEsc(book.title || "Untitled")}</title>
<style>
  body{margin:0;background:#141312;color:#e7e2da;font:16px/1.75 Georgia,serif}
  .wrap{max-width:720px;margin:0 auto;padding:56px 24px 120px}
  .tp{text-align:center;margin:40px 0 64px}
  .tp h1{font-size:2.4rem;margin:0 0 10px;letter-spacing:-.02em}
  .tp .sub{color:#a49d93;font-size:1.05rem;margin:0 0 18px}
  .tp .by{font-style:italic;color:#a49d93;margin:0}
  .tp .ser{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#8b847b;margin:16px 0 0}
  .ded{font-style:italic;color:#a49d93;text-align:center;margin:0 0 56px}
  .toc{margin:0 0 56px;padding:18px 22px;border-radius:12px;background:#1c1a19}
  .toc h3{margin:0 0 10px;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:#8b847b;font-family:system-ui,sans-serif}
  .toc ol{margin:0;padding-left:20px}.toc a{color:#e7e2da;text-decoration:none}.toc a:hover{text-decoration:underline}
  section{margin:0 0 44px}
  .st{font-family:system-ui,sans-serif;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#8b847b;margin:0 0 18px;font-weight:600}
  p{margin:0 0 1em;text-indent:1.4em}p:first-of-type,section>p:first-child{text-indent:0}
  h1,h2,h3{font-family:system-ui,sans-serif;line-height:1.25}
  blockquote{margin:1.4em 2em;font-style:italic;color:#a49d93}
  hr{border:0;height:1px;background:#2c2a28;margin:2em 0}
  .rn{margin-top:64px;padding-top:22px;border-top:1px solid #2c2a28;display:flex;gap:10px;align-items:baseline;font-family:system-ui,sans-serif;font-size:.85rem}
  .rn span{color:#8b847b;letter-spacing:.12em;text-transform:uppercase;font-size:.7rem}
  .rn a{color:#7fb2ff;text-decoration:none}.rn a:hover{text-decoration:underline}
  .ft{margin-top:56px;color:#6f6862;font-size:.75rem;font-family:system-ui,sans-serif;text-align:center}
</style></head><body><div class="wrap">
  <div class="tp"><h1>${pubEsc(book.title || "Untitled")}</h1>
  ${book.subtitle ? `<p class="sub">${pubEsc(book.subtitle)}</p>` : ""}
  ${book.author ? `<p class="by">by ${pubEsc(book.author)}</p>` : ""}
  ${book.series ? `<p class="ser">${pubEsc(book.series)}</p>` : ""}</div>
  ${front}
  ${nav ? `<div class="toc"><h3>Contents</h3><ol>${nav}</ol></div>` : ""}
  ${body}
  ${readNext}
  <p class="ft">${pubEsc(book.title || "")}${book.author ? " · " + pubEsc(book.author) : ""}${book.isbn ? " · ISBN " + pubEsc(book.isbn) : ""}</p>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════════
   DICTIONARY — Merriam-Webster (Collegiate)
   GET /api/dict?word=<word>
   The key never reaches the browser: it is read here from the
   server env as MW_API_KEY.
     → { ok:true, source:"Merriam-Webster", word, phonetic, entries:[{pos,defs:[{def,example}]}] }
     → { ok:false, reason:"no-key" | "not-found" | "error", suggestions?:string[] }
   ═══════════════════════════════════════════════════════════ */
const MW_ENV_KEY = process.env.MW_API_KEY ?? "";
/* a key saved in the app Settings → Environment arrives as ?key=… and is used
   only when the host environment does not define one of its own */
function mwKeyFor(url: URL): string {
  const fromQuery = (url.searchParams.get("key") ?? "").trim();
  return MW_ENV_KEY || fromQuery;
}
const MW_BASE = "https://dictionaryapi.com/api/v3/references/collegiate/json/";

function mwClean(v: unknown): string {
  return String(v ?? "")
    .replace(/\{([^{}]*)\}/g, "$1")      // {it}emphasis{/it} → emphasis
    .replace(/\{[a-z]+\}/gi, "")         // leftover tags
    .replace(/\s+/g, " ")
    .trim();
}

async function mwLookup(word: string, key: string) {
  const r = await fetch(MW_BASE + encodeURIComponent(word) + "?key=" + encodeURIComponent(key));
  if (!r.ok) return { ok: false as const, reason: "error", status: r.status };
  const data: any = await r.json();
  if (!Array.isArray(data) || !data.length) return { ok: false as const, reason: "not-found" };
  /* an unknown word comes back as a list of spelling suggestions */
  if (typeof data[0] === "string") return { ok: false as const, reason: "not-found", suggestions: data.slice(0, 8) };

  const entries: { pos: string; defs: { def: string; example?: string }[] }[] = [];
  for (const e of data.slice(0, 4)) {
    const defs: { def: string; example?: string }[] = [];
    for (const d of (e.shortdef as string[]) || []) defs.push({ def: mwClean(d) });
    for (const dt of (e.def as any[]) || []) {
      for (const sseq of (dt && dt.sseq) || []) {
        for (const pair of sseq || []) {
          const sense = Array.isArray(pair) && pair[0] === "sense" ? pair[1] : null;
          if (!sense) continue;
          const parts = (sense.dt || []) as any[][];
          const text = parts.map((x) => mwClean(x[1])).join(" ").replace(/\s+/g, " ").trim();
          const ex = parts.map((x) => (x[0] === "vis" ? x[1]?.[0]?.t ?? null : null)).find(Boolean) ?? undefined;
          if (text) defs.push({ def: text, example: ex ? mwClean(ex) : undefined });
        }
      }
    }
    const uniq: { def: string; example?: string }[] = [];
    const seen = new Set<string>();
    for (const d of defs) if (d.def && !seen.has(d.def)) { seen.add(d.def); uniq.push(d); }
    entries.push({ pos: mwClean((e.fl as string) || ""), defs: uniq.slice(0, 4) });
  }
  const prs = data[0].hwi?.prs?.[0]?.mw ?? "";
  return {
    ok: true as const,
    source: "Merriam-Webster",
    word: mwClean(data[0].hwi?.hw || word).replace(/\*/g, "·"),
    phonetic: prs ? "/" + mwClean(prs) + "/" : "",
    entries: entries.filter((e) => e.defs.length),
  };
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  /* ── published books ── */
  if (req.method === "POST" && url.pathname === "/api/publish") {
    try {
      const payload = JSON.parse(await readBody(req));
      const raw = String(payload.title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "book";
      const id = raw + "-" + Math.random().toString(36).slice(2, 8);
      payload.publishedAt = new Date().toISOString();
      await mkdir(PUB_DIR, { recursive: true });
      await writeFile(join(PUB_DIR, id + ".json"), JSON.stringify(payload), "utf8");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: true, id, url: "/r/" + id }));
    } catch (err: any) {
      send(res, 400, JSON.stringify({ ok: false, error: String(err && err.message || err) }), "application/json; charset=utf-8");
    }
    return;
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/publish/")) {
    const id = url.pathname.slice("/api/publish/".length).replace(/[^a-z0-9-]/gi, "");
    try {
      const raw = await readFile(join(PUB_DIR, id + ".json"), "utf8");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(raw);
    } catch {
      send(res, 404, JSON.stringify({ ok: false, error: "not found" }), "application/json; charset=utf-8");
    }
    return;
  }
  if (req.method === "GET" && url.pathname.startsWith("/r/")) {
    const id = url.pathname.slice(3).replace(/[^a-z0-9-]/gi, "");
    try {
      const book = JSON.parse(await readFile(join(PUB_DIR, id + ".json"), "utf8"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(readerPage(book));
    } catch {
      send(res, 404, "This read link does not exist (any more).");
    }
    return;
  }

  /* ── which service keys the environment provides (names only, never values) ── */
  if (req.method === "GET" && url.pathname === "/api/env-check") {
    const names = [
      "MW_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY", "EXA_API_KEY", "UNSPLASH_ACCESS_KEY"
    ];
    const keys: Record<string, boolean> = {};
    for (const n of names) keys[n] = !!process.env[n];
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify({ ok: true, keys }));
    return;
  }

  /* ── Merriam-Webster dictionary (key stays server-side) ── */
  if (req.method === "GET" && url.pathname === "/api/dict") {
    const word = (url.searchParams.get("word") ?? "").trim().slice(0, 60);
    const json = (body: unknown) => {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(body));
    };
    if (!word) return json({ ok: false, reason: "no-word" });
    const key = mwKeyFor(url);
    if (!key) return json({ ok: false, reason: "no-key" });
    try {
      json(await mwLookup(word, key));
    } catch (err: any) {
      json({ ok: false, reason: "error", error: String(err?.message || err) });
    }
    return;
  }

  const requested = resolveRequestPath(req.url ?? "/");
  if (!requested) return send(res, 403, "Forbidden");

  let filePath = requested;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
    const file = await stat(filePath);
    if (!file.isFile()) return send(res, 404, "Not found");

    res.writeHead(200, {
      "content-type": MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "content-length": file.size,
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    send(res, 404, `Not found: ${requested.slice(ROOT.length) || "/"}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ScriptForge serving ${ROOT} at http://${HOST}:${PORT}/`);
});
