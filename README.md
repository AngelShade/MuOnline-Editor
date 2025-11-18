# MU Online Web Editor

This project is a web-based suite of tools designed to edit common configuration files for a MU Online game server. It provides a user-friendly interface for managing complex XML and INI files, reducing the need for manual text editing and minimizing the risk of syntax errors.

## Features

-   **Modular Design**: Separate editors for different server configurations.
-   **Web-Based Interface**: Access the editor from any modern web browser on the local network.
-   **Data-Centric Views**: Tools are designed to present data in an intuitive, easy-to-manage format.
-   **Automatic Backups**: Automatically creates timestamped backups of any file before saving changes.
-   **Local Caching**: In-progress edits are saved to the browser's local storage, preventing data loss on refresh.

## Available Editors

The dashboard provides access to the following modules:

-   **Monster Spawn Editor**: Manage monster spawn points across all maps.
-   **Monster Drop Editor**: Configure item drops from `EachMonsterMapDrop` files.
-   **Drop Rate Editor**: Adjust server-wide Zen drop rates and Excellent Option probabilities.
-   **Shop Manager**: Configure NPC shop inventories and item prices.
-   **Chaos Mix Editor**: Manage Chaos Machine recipes for item upgrades, jewel packing, and more.
-   **Event Scheduler** (Coming Soon): A tool for scheduling in-game events.

## Tech Stack

-   **Backend**: Node.js with Express for serving files and handling API requests.
-   **Frontend**: Vanilla HTML, CSS, and JavaScript. No frameworks.
-   **Icons**: [Lucide Icons](https://lucide.dev/)

## Setup

1.  **Prerequisites**: You must have [Node.js](https://nodejs.org/) (version 18 or higher) installed.

2.  **Install Dependencies**: Open a terminal in the project root and run the following command:
    ```bash
    npm install
    ```

3.  **Configure Data Files**:
    -   Place your game server's data files into the `data` directory, preserving the original folder structure (e.g., `data/Monster/MonsterSetBase.xml`).
    -   The required file paths are defined in `config.json`. You can modify this file if your data is stored in a different location. The server will check for the existence of these files on startup.

4.  **Run the Server**:
    ```bash
    node server.js
    ```
    The server will start, and you should see a confirmation message in the console indicating that it's running on `http://localhost:3000`.

5.  **Access the Editor**: Open your web browser and navigate to `http://localhost:3000`. You will be greeted by the main dashboard, where you can select an editor to begin.

## How to Use

-   **Select a Module**: Click on any of the available editor cards on the dashboard to launch that tool.
-   **Author Name**: Most editors will prompt for an author name on the first visit. This is used to tag changes in the XML files for auditing purposes.
-   **Editing**: Each editor has its own interface for modifying data. Changes are typically saved to your browser's local storage automatically.
-   **Saving to Server**: To make your changes permanent, you must click the **Save** button within the editor. This will send the data to the server, which then overwrites the corresponding file in the `data` directory and creates a backup.

## Development

-   **Server**: The main server logic is in `server.js`. This file handles API routes for reading and writing files.
-   **Frontend**: Each editor is a standalone HTML file in the project root (e.g., `shopeditor.html`). Client-side JavaScript is embedded within `<script>` tags in these files or located in the `public/js` directory.
-   **Styling**: All styles are in `public/css/style.css`.
