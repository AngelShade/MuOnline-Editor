# MU Online Web Editor

A set of easy-to-use web tools for editing MU Online server configuration files.
Designed to be simple, visual, and safe to use.

## 🚀 Quick Start Guide (Read This First!)

You do not need to be a programmer to use this. Just follow these 3 steps:

### 1. Install Node.js
You need a free tool called **Node.js** to run this program.
*   **[Download Node.js Here](https://nodejs.org/)** (Version 18 or higher recommended).
*   Install it just like any other program.

### 2. Start the Editor
*   Open the folder where you downloaded this editor.
*   Double-click the file named **`Start-Editor.bat`**.
*   A black window will appear. **Do not close it.** This is the server.
*   The editor should automatically open in your web browser.

### 3. Start Editing!
*   The editor comes with **sample files** so you can test it immediately.
*   Your changes are saved automatically.
*   When you are done, just close the web browser and the black window.

---

## ⚙️ How to Edit Your Server (Configuration)

By default, this editor modifies the "Sample Data" included in the `data/` folder.
If you want to edit your **real** MU Online server files:

1.  Open the editor in your browser.
2.  Click on **Server Configuration** (Module 7).
3.  Change the file paths to point to your server files (e.g., `D:\Muserver\Data\...`).
4.  Click **Save Configuration**.
5.  **Restart the editor** (Close the black window and run `Start-Editor.bat` again).

> **Note:** If you get "File Not Found" errors, it means your paths in Server Configuration are wrong.

---

## 🛠️ Included Tools

*   **Monster Spawn Editor**: Drag-and-drop monsters onto maps.
*   **Shop Manager**: Edit NPC shops visually.
*   **Drop Rate Editor**: Control item drops and zen rates.
*   **Chaos Mix Editor**: Adjust success rates for chaos machine.
*   **Event Scheduler**: Schedule invasions and events.
*   **Monster Drop Editor**: Configure what items monsters drop.

## ⚠️ Troubleshooting

*   **"Node is not recognized"**: You didn't install Node.js (Step 1). Install it and restart your computer.
*   **Browser didn't open**: Open your browser and type `http://localhost:3000` in the address bar.
*   **Screen is stuck**: Press `F5` or `Ctrl+F5` to refresh the page.

---
**Tech Info (For Developers)**
*   Built with Node.js, Express, and Vanilla JS.
*   No database required (edits XML/INI files directly).
