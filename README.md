# Game Editor

This is a web-based tool for editing game server configuration files.

## Setup

1.  **Place your game server's data files into the `data` directory.** The directory structure should be preserved. For example, `Monster/MonsterSpawn.xml` should be placed at `data/Monster/MonsterSpawn.xml`.
2.  **Install dependencies.** Run `npm install` to install the required Node.js packages.
3.  **Run the server.** Run `node server.js` to start the application.
4.  **Access the editor.** Open your web browser and navigate to `http://localhost:3000`.

## Configuration

All file paths are configured in `config.json`. By default, they are set to relative paths pointing to the `data` directory. You can change these paths if your server files are located elsewhere.
