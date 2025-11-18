## Purpose
Give concise, actionable guidance so an AI coding agent can be productive immediately in this repo.

## Big picture
- **What this repo is:** A small Node.js/Express web editor that serves static HTML editors (root-level HTML files) and exposes JSON APIs to read/write game server configuration files stored under `data/`.
- **Runtime:** Single-process Express server in `server.js` listening on port `3000` by default. Static assets served from `public/` and multiple HTML editors exist at repository root (e.g. `index.html`, `mixeditor.html`, `monsterspawneditor.html`, `shopeditor.html`, `monsterdropeditor.html`, `zendropeditor.html`).
- **Data flow:** Frontend fetches editor data from endpoints under `/api/*`. The server reads XML/INI files from paths configured in `config.json`, may create timestamped backups, and writes updated content back to disk via `/api/*` POST save endpoints.

## Current important files (root)
- `index.html` — Main landing/editor page.
- `mixeditor.html` — Mix editor frontend.
- `monsterspawneditor.html` — Monster spawn editor UI.
- `monsterdropeditor.html` — Monster drop / map-drop editor UI.
- `shopeditor.html` — Shop editor UI.
- `zendropeditor.html` — Zen (drop) editor UI.
- `mix_main_mix.js` — Mix editor client script used by the HTML editors.
- `server.js` — Backend server and API implementations.
- `config.json` — Runtime path mappings used by `server.js`.
- `README.md` — Quick start and developer notes.

## Key files & where to look
- `server.js` — All API routes, request validation, backup logic (`createBackup`), and startup file-path checks. Primary source of truth for how the front-end and filesystem interact.
- `config.json` — Maps logical names to relative file and directory paths (e.g. `MONSTER_SPAWN_PATH`, `MIX_DIR`, `EACH_MONSTER_MAP_DROP_DIR`). Resolve these relative to repo root when testing.
- `data/` — The repository data dir containing XML/INI files and many subfolders (e.g., `CashShop/`, `Character/`, `Event/`, `Monster/`, `Mix/`, etc.). The server expects this layout to exist on startup.
- `public/` — Static assets (CSS/JS) served by `server.js`.

## Dev commands (explicit)
- Install deps: `npm install`.
- Start server: `node server.js` (server listens on `http://localhost:3000`).

## Environment
- **Node version:** This project requires Node >= 18 (see `package-lock.json` engines). Use Node 18+ or `nvm use 18`.

## Important runtime/operational details (do not change lightly)
- On startup `server.js` checks that all configured paths exist. If a required file/directory is missing it logs the missing path and exits (process.exit(1)). Ensure the `data/` directory mirrors the expected server structure before starting.
- Backups: `createBackup(filePath, backupDir)` writes timestamped `.bak` files to the configured backup directory (`*_BACKUP_DIR`). Backups are created before writes in all save endpoints.

## API surface and request shapes (examples)
- Read endpoints (GET):
  - `/api/files` → returns `{ monsterSpawnXml, monsterListXml }`
  - `/api/drop-data` → returns `{ zenDropXml, itemExcellentOptionsXml, itemListXml }`
  - `/api/shop-data` → returns `{ shopListXml, itemListXml, itemExcellentOptionsXml, itemStackXml }`
  - `/api/mix-data` → returns many mix-related XMLs and `itemListXml`
  - `/api/map-drop-data` → returns `mapDropFiles` (array of filenames) plus context files
- Save endpoints (POST) — JSON body examples:
  - Save MonsterSpawn: POST `/api/save` with `{ "newXmlContent": "<xml>...</xml>" }`
  - Save named mix file: POST `/api/save-mix-file` with `{ "filename": "Mix.xml", "newXmlContent": "..." }`
  - Save single shop file: POST `/api/save-shop-file/Shop(1)_Something.xml` with `{ "newXmlContent": "..." }`
  - Save map drop file: POST `/api/save-map-drop-file` with `{ "filename": "MonsterMap_(0)_Bag.xml", "newXmlContent": "..." }`

## Validation & naming conventions enforced by server
- Shop filename validation regex: `/^Shop\\(\\d+\\)_.+\\.xml$/` (see `/api/shop-file/:filename` and save handlers).
- Map drop filename validation regex: `/^MonsterMap_\\(\\d+\\)_Bag\\.xml$/` (see `/api/map-drop-file-content` and save handler).
- Many endpoints explicitly `await fs.access(...)` for each required file — the server is strict about presence and permissions.

## Tests & CI notes
- Playwright-based end-to-end tests were previously included. They and related artifacts were removed in recent cleanup. If you want tests back, re-add Playwright and the `tests/` folder, restore `playwright.config.js`, and re-enable test scripts in `package.json`.

## Typical agent tasks and patterns to follow
- When editing `server.js`, prefer updating route-safe filename regexes and backed-up path lists in the same file. Routes and validation live together — change both when adding an editor.
- When adding or changing a frontend editor (HTML/JS), update the corresponding `/api/*` route in `server.js` and ensure the front-end uses the expected JSON keys returned by the route.
- To add a new data file, add a config key to `config.json`, resolve it in `server.js` (use `resolvePath(config.KEY)`), and include it in startup `fs.access` checks and the relevant route(s).

## Examples from this repo (copy/paste-friendly)
- Start server (dev):
  - `npm install`
  - `node server.js`
- Save payload (curl):
  - `curl -X POST http://localhost:3000/api/save -H "Content-Type: application/json" -d '{"newXmlContent":"<Monster />"}'`

## Where to look for follow-up changes
- Add new editor UI → update root HTML + client JS and add/extend `/api/*` handlers in `server.js`.
- Add new data file paths → `config.json`, `server.js` resolvePath and `fs.access` checks, backup dir constant.

If anything here is unclear or you'd like more detail on a specific area (example requests for a route, format of files in `data/`, or test harnesses), tell me which area to expand and I'll iterate.

## Event Scheduler (new module)
- The UI: an `eventscheduler.html` page should let operators create scheduled events (Blood Castle, Devil Square, Invasion, Castle Siege, custom invasions) and map/monster configurations. A basic stub exists at `eventscheduler.html`.
- Backend: add `/api/event-data` (GET) to return `{ events: [...] }` and a save endpoint (POST `/api/save-event-data`) that accepts `{ newEventXmlContent }` or a JSON structure depending on storage format.

## Season and data-file specifics (MuOnline Season 19)
- This editor is targeted at MuOnline Season 19 server files. Many files under `data/` include a small human-readable header at the top describing how the file should be parsed and which other files it references. You do not need to read entire large data blobs to understand the structure — parse the header/comment block at the top first.
- Pattern: open each file and read until the first blank line or a well-known section separator (e.g., `//`, `<!-- -->`, or XML comments). That header usually documents field order, name conventions, and referenced files (for example, a schedule file might list `Event.ini` or `InvasionMonsters.xml`).
- File discovery: to implement an editor, list files in the relevant `data/` subfolders (e.g., `data/Event/`, `data/Event/AllBossTogether/`, `data/Event/ArkaWar/`), read the header of each file to find format metadata, and then only parse the needed fields to present a UI.

## Recommended implementation steps for Event Scheduler
- Add `config.json` keys for any new files (e.g., `EVENT_SCHEDULE_PATH`) and include them in `server.js` startup checks (see existing patterns).
- Backup behavior: follow existing pattern — create timestamped `.bak` in the configured backup dir before writing.
- Minimal API surface to add:
  - GET `/api/event-data` → returns base files and an array of parsed events (from `Event/Event.ini` or similar).
  - POST `/api/save-event-data` → accepts JSON or raw content and writes back, creating backup first.

## Notes for agents
- When adding editors for Season 19 files, always check the top-of-file header comments before assuming field order.
- Prefer minimal parsing for the UI: surface editable fields first (time, repeat, maps, monsters, spawn counts), then provide an advanced raw-edit view for power users.
