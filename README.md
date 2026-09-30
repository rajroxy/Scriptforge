# Writer

A local-first writing studio: draft, outline, plan, bible, kanban, canvas, mind
map, manuscript and a reader — with your own AI keys, your data kept on the
machine (localStorage in the browser, the app's own userData folder on the
desktop).

## Run it in the browser

```bash
bun install
bun run dev          # http://localhost:3000
```

`scripts/serve.ts` is a zero-dependency static server. The app is plain
`index.html` + JS/CSS at the repo root — no build step.

## Run it as a desktop app

```bash
bun install
bun run desktop      # opens the app in its own window
```

`main.cjs` is the Electron entry point. It serves the app itself through
`desktop-server.cjs`, so nothing else has to be running and a packaged build
needs no dependencies on the user's machine:

- `GET /api/dict` — Merriam-Webster lookup; the key stays in the process
  (set `MW_API_KEY`, or paste a key in Settings → Environment)
- `POST /api/publish` + `GET /r/<id>` — the hosted reader link
- `GET /api/env-check` — which service keys the environment provides

Extras the desktop build adds to the app:

- window size and position remembered between launches
- native Save / Open dialogs (`FS.saveFile` / `FS.openFile`)
- the JSON autosave rewritten in place at
  `Documents/ScriptForge Backups/<project>-autosave.json` — no more
  `untitled (1).json`

Point the window at a dev server instead (hot reload while you work):

```bash
SF_APP_URL=http://localhost:3000 bun run desktop
```

### Package it

```bash
bun add -d electron-builder
bunx electron-builder          # installers land in release/
```

Targets are configured in `package.json` → `build` (dmg/zip, nsis, AppImage/deb).
Set `productName` and `appId` there before shipping, and sign the builds for
macOS/Windows if you plan to distribute them widely.

## Data

| What | Where |
| --- | --- |
| Projects, settings, prompts | localStorage (browser and desktop) |
| JSON autosave | `Documents/ScriptForge Backups/` (desktop) or a file you link (browser) |
| Published books | `<userData>/.published/` (desktop) or `<repo>/.published/` (server) |

## The pages

Mode decides what a project is — a **novel** works in chapters and subchapters,
a **screenplay** in scenes, and the pages rename themselves to match. Both
share the same shell:

| Page | What it is for |
| --- | --- |
| Inspire | The project's idea board, prompts and genres |
| Outline | The chapter list, one card per section |
| Plan | Beat boards — several per project, each a board of cards |
| Bible | Characters, places, every fact the book has to keep straight |
| Kanban | The same sections as cards on a board, to move around |
| Canvas | A mind map of the story's threads, with links between cards |
| Manuscript | The writing surface: a section strip, a formatting bar, the page |
| Book | The tree of sections on the left, the reader on the right, and Publish |
| Statistics | Words, pages, chapters, projects and the daily line |

### Writing

The manuscript's own keys, and the script page's:

| Keys | Does |
| --- | --- |
| `⇧Q` | The paragraph-style menu (a script opens its element list) |
| `⇧E` | The advanced formatting panel — `←` `→` and `↑` `↓` walk its chips |
| `⌘/Ctrl + 1…3` | Heading 1–3, and `⌘/Ctrl + 0` back to a paragraph (novel) |
| `⌘/Ctrl + 1…6` | Scene heading, action, character, parenthetical, dialogue, transition (script) |
| `Tab` | In a script, cycle the element of the line you are on |
| `⌘/Ctrl + F` | Find and replace |

`⇧Q`, `⇧E`, `⌘1…6` and `Tab` are the app's own keys while the caret is in the
writing surface, so a capital `Q` or `E` there is typed with the menu shut.

Intermixing fonts (IMF) mixes the faces of the sentence you are typing across
three families, by letter, word or sentence — the list is grouped Serif · Sans
· Mono · Slab, and every face in it has to hold up at body size. Its switch
sits in the card's own head, the panel stays open while the three faces are
set, and each face is fetched as it is picked — so a pick is the face itself
and not its fallback, which is what made three different picks type the same.

The three rows are the three the rotation uses, and a row left alone is not
empty: it reads as its group's own face (a Serif, a Sans, a Mono), exactly as
the preview in the panel draws it. So **one pick is enough for the mixing to be
visible** — set Font 1, and the letters you type already alternate between three
different faces — and the preview can never promise a face the typing will not
use. While mixing is on, the writing bar's own Font picker rests greyed — dimmed,
with a “not allowed” pointer — and it is handed straight back the moment mixing
is switched off. Its presses are left alone: it is greyed because it is not the
control being used, not taken away. Nothing else in either bar moves.

The script page wears the manuscript's own two bars: the writing toolbar, with
the font and size the manuscript keeps there, and the scene strip under it,
flush with it — one card, the exact shape the manuscript's own two rows make.
Its Font list is a screenplay's and nothing else: the three screenplay faces
(Courier Prime · Courier New · Courier Final Draft). The full novel list comes
back with the novel.

The Book mark on the script page opens the book, exactly as it does on the
manuscript, and every mark in the scene strip wears the same grey chip: notes,
book, utilities, split, overlay, the archive mark, find and the IMF button. That
chip is not written by a stylesheet — five sheets have an opinion about these
marks and three of them re-append themselves last — but set on the elements
themselves, so no sheet in any file can take it off again. The split screen is
not offered on the script page at all: a screenplay is written in one column.

### The archive

The archive button in the section strip (the manuscript and the script both
wear it) keeps the text you delete: every string that was on a writing surface
and is not any more, with when it went and where it was. It is not an undo
history — it holds the writing itself, including the runs <kbd>Ctrl</kbd> +
<kbd>Z</kbd> can no longer reach: an undo that takes back more than you meant,
or work you only notice is missing in the next session. A run of Backspace or
Delete in one place is one entry; a deletion anywhere else is its own.

| Button | Does |
| --- | --- |
| Insert | Puts the piece back at the caret |
| Copy | Copies the piece |
| ✕ | Forgets the piece |
| Clipboard (header) | Copies the whole archive |
| Trash (header) | Empties it, after asking |

It is the page's own, the way the app separates everything else: opened from
the manuscript it holds what the novel lost, opened from the script page what
the screenplay lost — so a cut scene never sits in a column with a cut
paragraph. The count in the head says how many pieces that archive holds, and
the badge on the mark is the same number, so the mark can never count pieces
the panel it opens does not show.

It lives in the same config the app already saves, so it survives the session.

### Publishing a book

The Book page's reader carries the edit marks — done editing, ready to publish,
and the publish panel. Those marks, and the back-to-manuscript mark in the
section card beside them, wear the same grey chip every other icon in the app
wears: they used to rest transparent and only show a box under the pointer,
which left four bare glyphs beside a page of chipped ones.

In the publish panel's **Delivery** tab there is a **Book cover**: pick a JPG or
PNG and it is shrunk to 1400px on its long edge, kept with the project, used as
the cover of the delivered `.epub` and by the read link. It can be replaced or
removed at any time.

### Appearance

Settings → Appearance is the palette and the type: the two dark palettes
(**Blue** and **Yellow**), the interface font, the writing face with its size,
spacing and measure. Nothing is written over the app's own theme, and nothing
can be — the Windows and macOS looks an earlier build offered are gone, and a
profile that still carries one is handed the app's own tokens on its next load.

## How the front end is put together

No build step: `index.html` loads the CSS and the scripts at the repo root, in
order, and each file is a plain script.

| File | Owns |
| --- | --- |
| `theme.css` · `app.css` · `pages.css` | Tokens and layout, then the app shell, then the pages |
| `state.js` | The data model, the font and language tables, persistence |
| `pages.js` | Every page renderer, the overlay panes, the advanced panel |
| `write.js` | The writing surface: the toolbar, IMF, the element menu, commands |
| `fountain-script.js` | The script page — Fountain source, scene list, cast, counts |
| `split.js` · `mindmap.js` · `notes.js` · `kb-*.js` · `plan-boards.js` | Split screen, canvas, notes, boards and the plan page |
| `settings.js` | Settings, and the dropdown card behind every `<select>` |
| `final-fix.js` | The last layer: it re-places, re-colours and re-labels markup the layers under it draw, and every rule in it exists because something above it read wrong. Scripts and stylesheets carry a `?v=` in `index.html` — bump it when a file changes |

## Read-only panes

The overlay panes (Split screen's second pane, the overlay window) load the app
again with `?sfView=1` in an iframe. That flag sets `window.SF_VIEW` and puts
`.sf-view` on `<html>` and `<body>`, which is how a pane knows to draw the
chrome, take no writes and keep the app's own header and footer.
