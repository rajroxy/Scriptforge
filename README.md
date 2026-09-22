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
