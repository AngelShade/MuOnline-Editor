## Purpose
Give concise, actionable guidance so an AI coding agent can be productive immediately in this repo.

## Big picture
- **What this repo is:** A small Node.js/Express web editor that serves static HTML editors (root-level HTML files) and exposes JSON APIs to read/write game server configuration files stored under `data/`.
- **Runtime:** Single-process Express server in `server.js` listening on port `3000` by default. Static assets served from `public/` and multiple HTML editors exist at repository root (e.g. `index.html`, `mixeditor.html`, `monsterspawneditor.html`, `shopeditor.html`, `monsterdropeditor.html`, `zendropeditor.html`).
- **Data flow:** Frontend fetches editor data from endpoints under `/api/*`. The server reads XML/INI files from paths configured in `config.json`, may create timestamped backups, and writes updated content back to disk via `/api/*` POST save endpoints.

## Key files & where to look
- `server.js` — All API routes, request validation, backup logic (`createBackup`), and startup file-path checks. Primary source of truth for how the front-end and filesystem interact.
- `config.json` — Maps logical names to relative file and directory paths (e.g. `MONSTER_SPAWN_PATH`, `MIX_DIR`, `EACH_MONSTER_MAP_DROP_DIR`). Resolve these relative to repo root when testing.
- `README.md` — Quick start: `npm install` then `node server.js` (the repo does not provide npm `scripts`).
- `public/` — Static assets; root HTML files are served directly by `server.js`.
 

## Dev commands (explicit)
- Install deps: `npm install`.
- Start server: `node server.js` (server listens on `http://localhost:3000`).

## Environment
- **Node version:** This project requires Node >= 18 (see `package-lock.json` engines). Use Node 18+ or `nvm use 18`.


## Important runtime/operational details (do not change lightly)
- On startup `server.js` checks that all configured paths exist. If a required file/directory is missing it logs the missing path and exits (process.exit(1)). Ensure the `data/` directory mirrors the original server structure before starting.
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
- This repository includes end-to-end tests in `tests/`, but test tooling is optional and not required for normal development. If you later re-enable tests, ensure test runners and browsers are installed.

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
