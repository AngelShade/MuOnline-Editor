# MuOnline-Editor

A small collection of static editors for MuOnline-related data built with HTML and JavaScript. This repository provides several single-file web editors and a Node.js helper script. Open the HTML files in a browser to use the editors; see below for details.

Overview
- Static, client-side tools written in plain HTML and JavaScript.
- No build system required for the front-end files.
- A Node.js file (server.js) is included for optional local hosting or utilities — inspect before running.

Repository files
- .gitattributes — Git attributes file (repository configuration).
- index.html — Landing page / primary UI for the editor collection.
- mixeditor.html — Monster/MI editor UI (large single-file HTML + JS app).
- mix_main_mix.js — Supporting JavaScript used by the editors.
- monsterdropeditor.html — Monster drop editor UI.
- monsterspawneditor.html — Monster spawn editor UI.
- shopeditor.html — Shop editor UI.
- zendropeditor.html — Zen drop / currency drop editor UI.
- server.js — Optional Node.js helper/server. Review the script before running; it may be used to serve files locally or provide utilities.

Getting started
1. Clone the repository:
   git clone https://github.com/AngelShade/MuOnline-Editor.git
2. Open an editor in your browser:
   - Recommended: Serve the files from a local HTTP server and open http://localhost:8000/index.html
     - Python 3: python -m http.server 8000
     - Node (http-server): npx http-server -p 8000
   - Alternative: Open any of the *.html files directly (double-click -> browser). Note that some browsers restrict certain file:// operations.
3. Optional Node server:
   - Inspect server.js before running.
   - If appropriate, run with Node.js (example): node server.js

Usage
- The HTML pages provide UI for editing various MuOnline data types (mix, monster drops, spawns, shops, zen drops).
- These editors operate in the browser and do not include built-in persistence. Use the UI to export or copy data, or wire the project to a backend to save edits.

Development
- Edit the .html and .js files directly; the project uses plain client-side code.
- If you add build tooling (npm, bundlers), add a package.json and update this README with build steps.

Contributing
- Open issues to report bugs or request features.
- Send pull requests with clear titles and descriptions. Keep changes small and focused.
- Follow the coding style used in the repo: primarily plain JavaScript and HTML.

Security
- This is a client-side project. If you run server.js or any server component, review the code and ensure you understand what it does before executing.

License
- The repository did not include a license previously. This repository now includes an MIT license (see LICENSE) so others can reuse the code. If you prefer a different license, replace the LICENSE file with your preferred terms.

Contact
- Repository owner: AngelShade
