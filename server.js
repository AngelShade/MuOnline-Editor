const express = require('express');
const fs = require('fs').promises;
const fsMain = require('fs');
const cors = require('cors');
const path = require('path');
const config = require('./config.json');
const LOG_FILE = path.join(__dirname, 'server.log');

const app = express();
const PORT = config.SERVER_PORT || 3000;
const IP = config.SERVER_IP || 'localhost';

// --- Logging Setup ---
const logStream = fsMain.createWriteStream(LOG_FILE, { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;

function timestamp() {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

console.log = function (...args) {
    const msg = `[${timestamp()}] [INFO] ${args.join(' ')}`;
    logStream.write(msg + '\n');
    originalLog.apply(console, args);
};

console.error = function (...args) {
    const msg = `[${timestamp()}] [ERROR] ${args.join(' ')}`;
    logStream.write(msg + '\n');
    originalError.apply(console, args);
};
// ---------------------

// --- Path Resolution ---
/**
 * Resolves a relative path from the application's root directory.
 * @param {string} relativePath - The relative path to resolve.
 * @returns {string} The absolute path.
 */
const resolvePath = (relativePath) => path.resolve(__dirname, relativePath);

const MONSTER_SPAWN_PATH = resolvePath(config.MONSTER_SPAWN_PATH);
const MONSTER_LIST_PATH = resolvePath(config.MONSTER_LIST_PATH);
const MONSTER_BACKUP_DIR = resolvePath(config.MONSTER_BACKUP_DIR);
const ZEN_DROP_PATH = resolvePath(config.ZEN_DROP_PATH);
const ZEN_BACKUP_DIR = resolvePath(config.ZEN_BACKUP_DIR);
const ITEM_EXCELLENT_OPTIONS_PATH = resolvePath(config.ITEM_EXCELLENT_OPTIONS_PATH);
const ITEM_LIST_PATH = resolvePath(config.ITEM_LIST_PATH);
const SHOP_LIST_PATH = resolvePath(config.SHOP_LIST_PATH);
const SHOPS_DIR = resolvePath(config.SHOPS_DIR);
const SHOPS_BACKUP_DIR = resolvePath(config.SHOPS_BACKUP_DIR);
const ITEM_STACK_PATH = resolvePath(config.ITEM_STACK_PATH);
const MIX_DIR = resolvePath(config.MIX_DIR);
const MIX_BACKUP_DIR = resolvePath(config.MIX_BACKUP_DIR);
const EACH_MONSTER_MAP_DROP_DIR = resolvePath(config.EACH_MONSTER_MAP_DROP_DIR);
const MAP_DROP_BACKUP_DIR = resolvePath(config.MAP_DROP_BACKUP_DIR);
const MASTERY_EXC_OPTIONS_PATH = resolvePath(config.MASTERY_EXC_OPTIONS_PATH);
const PENTAGRAM_DROP_RATE_PATH = resolvePath(config.PENTAGRAM_DROP_RATE_PATH);
const SOCKET_ITEM_DROP_RATES_PATH = resolvePath(config.SOCKET_ITEM_DROP_RATES_PATH);
const ITEM_DROP_RATE_CONTROL_PATH = resolvePath(config.ITEM_DROP_RATE_CONTROL_PATH);
const EVENT_SCHEDULE_PATH = resolvePath(config.EVENT_SCHEDULE_PATH);
const EVENT_BACKUP_DIR = resolvePath(config.EVENT_BACKUP_DIR);

// --- Mix Editor Paths ---
const MIX_PATH = path.join(MIX_DIR, 'Mix.xml');
const ANGEL_WEAPON_UPGRADE_PATH = path.join(MIX_DIR, 'AngelWeaponUpgrade.xml');
const MASTERY_ITEM_MIX_PATH = path.join(MIX_DIR, 'MasteryItemMix.xml');
const MIX_DISABLE_PATH = path.join(MIX_DIR, 'MixDisable.xml');
const MIX_JEWEL_TEMPLATE_PATH = path.join(MIX_DIR, 'MixJewelTemplate.xml');
const MIX_LUCKY_TEMPLATE_PATH = path.join(MIX_DIR, 'MixLuckyTemplate.xml');
const MIX_SPELL_STONE_PATH = path.join(MIX_DIR, 'MixSpellStone.xml');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Static File Serving ---
// Serve static assets from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * @api {get} / Request main editor page
 * @apiName GetIndex
 * @apiGroup Static
 *
 * @apiSuccess {File} index.html The main editor page.
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * @api {get} /index.html Request main editor page
 * @apiName GetIndexHTML
 * @apiGroup Static
 *
 * @apiSuccess {File} index.html The main editor page.
 */
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * @api {get} /monsterspawneditor.html Request monster spawn editor page
 * @apiName GetMonsterSpawnEditor
 * @apiGroup Static
 *
 * @apiSuccess {File} monsterspawneditor.html The monster spawn editor page.
 */
app.get('/monsterspawneditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'monsterspawneditor.html'));
});

/**
 * @api {get} /shopeditor.html Request shop editor page
 * @apiName GetShopEditor
 * @apiGroup Static
 *
 * @apiSuccess {File} shopeditor.html The shop editor page.
 */
app.get('/shopeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'shopeditor.html'));
});

/**
 * @api {get} /mixeditor.html Request mix editor page
 * @apiName GetMixEditor
 * @apiGroup Static
 *
 * @apiSuccess {File} mixeditor.html The mix editor page.
 */
app.get('/mixeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'mixeditor.html'));
});

// Serve the dashboard (renamed from index.html)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

/**
 * @api {get} /monsterdropeditor.html Request monster drop editor page
 * @apiName GetMonsterDropEditor
 * @apiGroup Static
 *
 * @apiSuccess {File} monsterdropeditor.html The monster drop editor page.
 */
app.get('/monsterdropeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'monsterdropeditor.html'));
});

/**
 * @api {get} /zendropeditor.html Request zen drop editor page
 * @apiName GetZenDropEditor
 * @apiGroup Static
 *
 * @apiSuccess {File} zendropeditor.html The zen drop editor page.
 */
app.get('/zendropeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'zendropeditor.html'));
});

app.get('/mix_main_mix.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'mix_main_mix.js'));
});

app.get('/eventscheduler.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'eventscheduler.html'));
});


// --- Helper Functions ---
/**
 * Creates a timestamped backup of a file.
 * @param {string} filePath - The full path to the file to back up.
 * @param {string} backupDir - The directory to store the backup in.
 * @returns {Promise<void>}
 */
async function createBackup(filePath, backupDir) {
    try {
        // Ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });

        // Get timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, ''); // YYYY-MM-DDTHH-MM-SS
        const fileName = path.basename(filePath);
        const backupPath = path.join(backupDir, `${fileName}_${timestamp}.bak`);

        // Copy the file
        await fs.copyFile(filePath, backupPath);
        console.log(`Successfully created backup at: ${backupPath}`);
    } catch (error) {
        console.error(`Error creating backup for ${filePath}:`, error);
        // We don't throw here, saving is more critical than backing up
        // But we must log the error.
    }
}

/**
 * @api {get} /api/files Get Monster Spawn and List Files
 * @apiName GetMonsterFiles
 * @apiGroup MonsterSpawnEditor
 *
 * @apiSuccess {Object} data The monster spawn and list files.
 * @apiSuccess {String} data.monsterSpawnXml The content of MonsterSpawn.xml.
 * @apiSuccess {String} data.monsterListXml The content of MonsterList.xml.
 *
 * @apiError {String} 500 A required file was not found or could not be read.
 */
app.get('/api/files', async (req, res) => {
    try {
        // Ensure files exist before trying to read them
        await fs.access(MONSTER_SPAWN_PATH);
        await fs.access(MONSTER_LIST_PATH);
        
        const monsterSpawnXml = await fs.readFile(MONSTER_SPAWN_PATH, 'utf8');
        const monsterListXml = await fs.readFile(MONSTER_LIST_PATH, 'utf8');
        res.json({ monsterSpawnXml, monsterListXml });
    } catch (error) {
        console.error('Error reading monster files:', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: A required file was not found. Check paths in server.js. Missing: ${error.path}`);
        } else {
            res.status(500).send('Error: Could not read server files. Check permissions and paths in server.js');
        }
    }
});

/**
 * @api {get} /api/drop-data Get Drop Rate Editor Data
 * @apiName GetDropData
 * @apiGroup ZenDropEditor
 *
 * @apiSuccess {Object} data The drop rate editor data.
 * @apiSuccess {String} data.zenDropXml The content of ZenDrop.xml.
 * @apiSuccess {String} data.itemExcellentOptionsXml The content of ItemExcellentOptions.xml.
 * @apiSuccess {String} data.itemListXml The content of ItemList.xml.
 *
 * @apiError {String} 500 A required file was not found or could not be read.
 */
app.get('/api/drop-data', async (req, res) => {
    try {
        // Check access for all required files for the Drop Editor, including ItemList.xml
        await fs.access(ZEN_DROP_PATH);
        await fs.access(ITEM_EXCELLENT_OPTIONS_PATH);
        await fs.access(ITEM_LIST_PATH); // <-- **CRITICAL FIX: Check access for ItemList**
        
        const zenDropXml = await fs.readFile(ZEN_DROP_PATH, 'utf8');
        const itemExcellentOptionsXml = await fs.readFile(ITEM_EXCELLENT_OPTIONS_PATH, 'utf8');
        const itemListXml = await fs.readFile(ITEM_LIST_PATH, 'utf8'); // <-- **CRITICAL FIX: Read ItemList.xml**
        
        // **CRITICAL FIX: Send all three files back**
        res.json({ zenDropXml, itemExcellentOptionsXml, itemListXml }); 
    } catch (error) {
        console.error('Error reading Drop Rate files (ZenDrop.xml, ItemExcellentOptions.xml, or ItemList.xml):', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: A required file was not found. Check paths in server.js. Missing: ${error.path}`);
        } else {
            res.status(500).send('Error: Could not read drop rate server files. Check permissions and paths in server.js');
        }
    }
});

/**
 * @api {get} /api/shop-data Get Shop Editor Data
 * @apiName GetShopData
 * @apiGroup ShopEditor
 *
 * @apiSuccess {Object} data The shop editor data.
 * @apiSuccess {String} data.shopListXml The content of ShopList.xml.
 * @apiSuccess {String} data.itemListXml The content of ItemList.xml.
 * @apiSuccess {String} data.itemExcellentOptionsXml The content of ItemExcellentOptions.xml.
 * @apiSuccess {String} data.itemStackXml The content of ItemStack.xml.
 *
 * @apiError {String} 500 A required file was not found or could not be read.
 */
app.get('/api/shop-data', async (req, res) => {
    try {
        await fs.access(SHOP_LIST_PATH);
        await fs.access(ITEM_LIST_PATH);
        await fs.access(ITEM_EXCELLENT_OPTIONS_PATH);
        await fs.access(ITEM_STACK_PATH);

        const shopListXml = await fs.readFile(SHOP_LIST_PATH, 'utf8');
        const itemListXml = await fs.readFile(ITEM_LIST_PATH, 'utf8');
        const itemExcellentOptionsXml = await fs.readFile(ITEM_EXCELLENT_OPTIONS_PATH, 'utf8');
        const itemStackXml = await fs.readFile(ITEM_STACK_PATH, 'utf8');
        
        // This is the correct list of files for the shop editor now.
        res.json({ shopListXml, itemListXml, itemExcellentOptionsXml, itemStackXml });
    } catch (error) {
        console.error('Error reading shop data files:', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: A required file was not found. Missing: ${error.path}`);
        } else {
            res.status(500).send('Error: Could not read server files for shop editor.');
        }
    }
});

/**
 * @api {get} /api/shop-file/:filename Get individual shop file content
 * @apiName GetShopFile
 * @apiGroup ShopEditor
 *
 * @apiParam {String} filename The name of the shop file to retrieve.
 *
 * @apiSuccess {Object} data The shop file content.
 * @apiSuccess {String} data.shopFileXml The content of the requested shop file.
 *
 * @apiError {String} 400 Invalid shop filename.
 * @apiError {String} 404 Shop file not found.
 * @apiError {String} 500 Could not read shop file.
 */
app.get('/api/shop-file/:filename', async (req, res) => {
    const { filename } = req.params;

    // Security check: Ensure filename is valid and doesn't try to escape the directory
    if (!filename || !/^Shop\(\d+\)_.+\.xml$/.test(filename)) {
        console.error(`Invalid shop filename requested: ${filename}`);
        return res.status(400).send('Error: Invalid shop filename.');
    }

    const filePath = path.join(SHOPS_DIR, filename);

    try {
        await fs.access(filePath);
        const shopFileXml = await fs.readFile(filePath, 'utf8');
        res.json({ shopFileXml });
    } catch (error) {
        console.error(`Error reading shop file ${filename}:`, error);
        if (error.code === 'ENOENT') {
            res.status(404).send(`Error: Shop file not found: ${filename}`);
        } else {
            res.status(500).send(`Error: Could not read shop file ${filename}.`);
        }
    }
});

/**
 * @api {get} /api/mix-data Get Mix Editor Data
 * @apiName GetMixData
 * @apiGroup MixEditor
 *
 * @apiSuccess {Object} data The mix editor data.
 * @apiSuccess {String} data.itemListXml The content of ItemList.xml.
 * @apiSuccess {String} data.mixXml The content of Mix.xml.
 * @apiSuccess {String} data.angelWeaponUpgradeXml The content of AngelWeaponUpgrade.xml.
 * @apiSuccess {String} data.masteryItemMixXml The content of MasteryItemMix.xml.
 * @apiSuccess {String} data.mixDisableXml The content of MixDisable.xml.
 * @apiSuccess {String} data.mixJewelTemplateXml The content of MixJewelTemplate.xml.
 * @apiSuccess {String} data.mixLuckyTemplateXml The content of MixLuckyTemplate.xml.
 * @apiSuccess {String} data.mixSpellStoneXml The content of MixSpellStone.xml.
 *
 * @apiError {String} 500 A required file was not found or could not be read.
 */
app.get('/api/mix-data', async (req, res) => {
    try {
        // This is the critical dependency for item names
        await fs.access(ITEM_LIST_PATH); 
        const itemListXml = await fs.readFile(ITEM_LIST_PATH, 'utf8');

        // Read all 7 mix files
        await fs.access(MIX_PATH);
        const mixXml = await fs.readFile(MIX_PATH, 'utf8');
        
        await fs.access(ANGEL_WEAPON_UPGRADE_PATH);
        const angelWeaponUpgradeXml = await fs.readFile(ANGEL_WEAPON_UPGRADE_PATH, 'utf8');
        
        await fs.access(MASTERY_ITEM_MIX_PATH);
        const masteryItemMixXml = await fs.readFile(MASTERY_ITEM_MIX_PATH, 'utf8');
        
        await fs.access(MIX_DISABLE_PATH);
        const mixDisableXml = await fs.readFile(MIX_DISABLE_PATH, 'utf8');
        
        await fs.access(MIX_JEWEL_TEMPLATE_PATH);
        const mixJewelTemplateXml = await fs.readFile(MIX_JEWEL_TEMPLATE_PATH, 'utf8');
        
        await fs.access(MIX_LUCKY_TEMPLATE_PATH);
        const mixLuckyTemplateXml = await fs.readFile(MIX_LUCKY_TEMPLATE_PATH, 'utf8');
        
        await fs.access(MIX_SPELL_STONE_PATH);
        const mixSpellStoneXml = await fs.readFile(MIX_SPELL_STONE_PATH, 'utf8');

        res.json({
            itemListXml,
            mixXml,
            angelWeaponUpgradeXml,
            masteryItemMixXml,
            mixDisableXml,
            mixJewelTemplateXml,
            mixLuckyTemplateXml,
            mixSpellStoneXml
        });

    } catch (error) {
        console.error('Error reading Mix Editor files:', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: A required file was not found for the Mix Editor. Missing: ${error.path}`);
        } else {
            res.status(500).send('Error: Could not read server files for Mix editor.');
        }
    }
});

/**
 * @api {get} /api/map-drop-data Get Monster Map Drop Editor Data
 * @apiName GetMapDropData
 * @apiGroup MonsterDropEditor
 *
 * @apiSuccess {Object} data The monster map drop editor data.
 * @apiSuccess {String} data.monsterListXml The content of MonsterList.xml.
 * @apiSuccess {String} data.itemListXml The content of ItemList.xml.
 * @apiSuccess {String} data.masteryExcOptionsXml The content of MasteryExcOptions.xml.
 * @apiSuccess {String} data.pentagramDropRateXml The content of PentagramDropRate.xml.
 * @apiSuccess {String} data.socketItemDropRatesXml The content of SocketItemDropRates.xml.
 * @apiSuccess {String} data.itemDropRateControlIni The content of ItemDropRateControl.ini.
 * @apiSuccess {String[]} data.mapDropFiles An array of map drop filenames.
 *
 * @apiError {String} 500 A required file or directory was not found or could not be read.
 */
app.get('/api/map-drop-data', async (req, res) => {
    try {
        // 1. Read dependencies
        await fs.access(MONSTER_LIST_PATH);
        const monsterListXml = await fs.readFile(MONSTER_LIST_PATH, 'utf8');
        
        await fs.access(ITEM_LIST_PATH);
        const itemListXml = await fs.readFile(ITEM_LIST_PATH, 'utf8');

        // 2. Read new context files
        await fs.access(MASTERY_EXC_OPTIONS_PATH);
        const masteryExcOptionsXml = await fs.readFile(MASTERY_EXC_OPTIONS_PATH, 'utf8');

        await fs.access(PENTAGRAM_DROP_RATE_PATH);
        const pentagramDropRateXml = await fs.readFile(PENTAGRAM_DROP_RATE_PATH, 'utf8');

        await fs.access(SOCKET_ITEM_DROP_RATES_PATH);
        const socketItemDropRatesXml = await fs.readFile(SOCKET_ITEM_DROP_RATES_PATH, 'utf8');

        await fs.access(ITEM_DROP_RATE_CONTROL_PATH);
        const itemDropRateControlIni = await fs.readFile(ITEM_DROP_RATE_CONTROL_PATH, 'utf8');
        
        // 3. Read all map drop *filenames* from the directory
        await fs.access(EACH_MONSTER_MAP_DROP_DIR);
        const files = await fs.readdir(EACH_MONSTER_MAP_DROP_DIR);
        
        const mapDropFiles = []; // Send as an array of filenames
        
        for (const file of files) {
            // Filter for only the XML files we want
            if (file.startsWith('MonsterMap_') && file.endsWith('_Bag.xml')) {
                mapDropFiles.push(file);
            }
        }
        
        res.json({
            monsterListXml,
            itemListXml,
            masteryExcOptionsXml, // Add new files to response
            pentagramDropRateXml,
            socketItemDropRatesXml,
            itemDropRateControlIni,
            mapDropFiles // This is an array of filenames: ["MonsterMap_(0)_Bag.xml", ...]
        });

    } catch (error) {
        console.error('Error reading Map Drop Editor files:', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: A required file or directory was not found for the Map Drop Editor. Missing: ${error.path}`);
        } else {
            res.status(500).send('Error: Could not read server files for Map Drop editor.');
        }
    }
});
// --- End of new route ---

/**
 * @api {get} /api/map-drop-file-content Get single map drop file content
 * @apiName GetMapDropFileContent
 * @apiGroup MonsterDropEditor
 *
 * @apiParam {String} filename The name of the map drop file to retrieve.
 *
 * @apiSuccess {String} fileContent The content of the requested map drop file.
 *
 * @apiError {String} 400 Invalid map drop filename.
 * @apiError {String} 404 File not found.
 * @apiError {String} 500 Could not read file.
 */
app.get('/api/map-drop-file-content', async (req, res) => {
    const { filename } = req.query;

    // Security check: Ensure filename is valid and doesn't try to escape the directory
    if (!filename || !/^MonsterMap_\(\d+\)_Bag\.xml$/.test(filename)) {
        console.error(`Invalid filename requested: ${filename}`);
        return res.status(400).send('Error: Invalid map drop filename.');
    }

    const filePath = path.join(EACH_MONSTER_MAP_DROP_DIR, filename);

    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf8');
        res.header('Content-Type', 'text/xml');
        res.send(fileContent);
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        if (error.code === 'ENOENT') {
            res.status(404).send(`Error: File not found: ${filename}`);
        } else {
            res.status(500).send(`Error: Could not read file ${filename}.`);
        }
    }
});
// --- End of new route ---

// --- Event Manager API ---

/**
 * @api {get} /api/event-data Get All Event Data
 * @apiName GetEventData
 * @apiGroup EventScheduler
 *
 * @apiDescription Aggregates all necessary data for the Event Scheduler, including:
 * - Event.ini
 * - EventSeasonManager.xml
 * - InvasionManager.xml
 * - InvasionMonsters.xml
 * - MonsterList.xml (for reference)
 * - ItemList.xml (for reference)
 * - List of available modular event folders
 */
app.get('/api/event-data', async (req, res) => {
    try {
        // Ensure the event directory exists
        await fs.access(EVENT_SCHEDULE_PATH);

        // helper to safely read file or return empty string
        const safeRead = async (filePath) => {
            try {
                return await fs.readFile(filePath, 'utf8');
            } catch (e) {
                console.warn(`Warning: Could not read ${filePath}: ${e.message}`);
                return '';
            }
        };

        const [
            eventIni,
            eventSeasonManager,
            invasionManager,
            invasionMonsters,
            monsterList,
            itemList
        ] = await Promise.all([
            safeRead(path.join(EVENT_SCHEDULE_PATH, 'Event.ini')),
            safeRead(path.join(EVENT_SCHEDULE_PATH, 'EventSeasonManager.xml')),
            safeRead(path.join(EVENT_SCHEDULE_PATH, 'InvasionManager.xml')),
            safeRead(path.join(EVENT_SCHEDULE_PATH, 'InvasionMonsters.xml')),
            safeRead(MONSTER_LIST_PATH),
            safeRead(ITEM_LIST_PATH)
        ]);

        // Scan for modular event subdirectories
        const dirents = await fs.readdir(EVENT_SCHEDULE_PATH, { withFileTypes: true });
        const modularEvents = dirents
            .filter(dirent => dirent.isDirectory() && dirent.name !== 'Backups')
            .map(dirent => dirent.name);

        res.json({
            eventIni,
            eventSeasonManager,
            invasionManager,
            invasionMonsters,
            monsterList,
            itemList,
            modularEvents
        });

    } catch (error) {
        console.error('Error reading event data:', error);
        res.status(500).send(`Error reading event data: ${error.message}`);
    }
});

/**
 * @api {get} /api/modular-event-file Get Modular Event File Content
 * @apiParam {String} folder The folder name (e.g., 'ChaosCastle')
 * @apiParam {String} filename The filename (e.g., 'ChaosCastle.xml')
 */
app.get('/api/modular-event-file', async (req, res) => {
    const { folder, filename } = req.query;

    if (!folder || !filename) {
        return res.status(400).send('Missing folder or filename');
    }

    // Security check: prevent directory traversal
    if (folder.includes('..') || filename.includes('..') || folder.includes('/') || filename.includes('/')) {
        return res.status(400).send('Invalid path');
    }

    const filePath = path.join(EVENT_SCHEDULE_PATH, folder, filename);

    try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        res.send(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(444).send(`File not found: ${folder}/${filename}`); // Using 444 to indicate expected missing file (no response) or custom handling on front end if needed, but 404 is standard. 404 might trigger global error handlers.
        } else {
             console.error(`Error reading modular file ${folder}/${filename}:`, error);
             res.status(500).send(`Error reading file: ${error.message}`);
        }
    }
});

/**
 * @api {post} /api/save-event-file Save Core Event File
 * @apiParam {String} filename The filename (e.g., 'Event.ini')
 * @apiParam {String} content The new content
 */
app.post('/api/save-event-file', async (req, res) => {
    const { filename, content } = req.body;
    
    if (!filename || content === undefined) {
        return res.status(400).send('Missing filename or content');
    }

    // Allowed core files
    const allowedFiles = ['Event.ini', 'EventSeasonManager.xml', 'InvasionManager.xml', 'InvasionMonsters.xml'];
    if (!allowedFiles.includes(filename)) {
         return res.status(400).send('Invalid core event filename');
    }

    const filePath = path.join(EVENT_SCHEDULE_PATH, filename);

    try {
        // Backup
        console.log(`[UPDATE] Saving core event file: ${filename} (${content.length} bytes)`);
        await createBackup(filePath, EVENT_BACKUP_DIR);
        // Save
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Saved core event file: ${filename}`);
        res.send('File saved successfully');
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
        res.status(500).send(`Error saving file: ${error.message}`);
    }
});

/**
 * @api {post} /api/save-modular-event-file Save Modular Event File
 * @apiParam {String} folder The folder name
 * @apiParam {String} filename The filename
 * @apiParam {String} content The new content
 */
app.post('/api/save-modular-event-file', async (req, res) => {
    const { folder, filename, content } = req.body;

    if (!folder || !filename || content === undefined) {
         return res.status(400).send('Missing folder, filename, or content');
    }

    // Security checks
    if (folder.includes('..') || filename.includes('..')) {
         return res.status(400).send('Invalid path parameters');
    }

    const folderPath = path.join(EVENT_SCHEDULE_PATH, folder);
    const filePath = path.join(folderPath, filename);
    const backupDir = path.join(EVENT_BACKUP_DIR, folder); // Nested backup structure

    try {
        // Ensure folder exists (should exist if we are saving inside it, but good to check access)
         await fs.access(folderPath);

        // Backup
        console.log(`[UPDATE] Saving modular event file: ${folder}/${filename} (${content.length} bytes)`);
        await createBackup(filePath, backupDir);
        
        // Save
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Saved modular event file: ${folder}/${filename}`);
        res.send('File saved successfully');

    } catch (error) {
         console.error(`Error saving modular file ${folder}/${filename}:`, error);
         res.status(500).send(`Error saving file: ${error.message}`);
    }
});


// --- SAVE ENDPOINTS ---

/**
 * @api {post} /api/save Save MonsterSpawn.xml
 * @apiName SaveMonsterSpawn
 * @apiGroup MonsterSpawnEditor
 *
 * @apiParam {String} newXmlContent The new content of MonsterSpawn.xml.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided.
 * @apiError {String} 500 Could not save file to disk.
 */
app.post('/api/save', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        console.log(`[UPDATE] Saving MonsterSpawn.xml (${newXmlContent.length} bytes)`);
        await createBackup(MONSTER_SPAWN_PATH, MONSTER_BACKUP_DIR);
        await fs.writeFile(MONSTER_SPAWN_PATH, newXmlContent, 'utf8');
        console.log('MonsterSpawn.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (MonsterSpawn):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

/**
 * @api {post} /api/save-excellent-options Save ItemExcellentOptions.xml
 * @apiName SaveExcellentOptions
 * @apiGroup ZenDropEditor
 *
 * @apiParam {String} newXmlContent The new content of ItemExcellentOptions.xml.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided.
 * @apiError {String} 500 Could not save file to disk.
 */
app.post('/api/save-excellent-options', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        console.log(`[UPDATE] Saving ItemExcellentOptions.xml (${newXmlContent.length} bytes)`);
        await createBackup(ITEM_EXCELLENT_OPTIONS_PATH, ZEN_BACKUP_DIR); // Reusing Zen backup directory
        await fs.writeFile(ITEM_EXCELLENT_OPTIONS_PATH, newXmlContent, 'utf8');
        console.log('ItemExcellentOptions.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (ItemExcellentOptions):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

/**
 * @api {post} /api/save-zendrop Save ZenDrop.xml
 * @apiName SaveZenDrop
 * @apiGroup ZenDropEditor
 *
 * @apiParam {String} newXmlContent The new content of ZenDrop.xml.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided.
 * @apiError {String} 500 Could not save file to disk.
 */
app.post('/api/save-zendrop', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        console.log(`[UPDATE] Saving ZenDrop.xml (${newXmlContent.length} bytes)`);
        await createBackup(ZEN_DROP_PATH, ZEN_BACKUP_DIR);
        await fs.writeFile(ZEN_DROP_PATH, newXmlContent, 'utf8');
        console.log('ZenDrop.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (ZenDrop):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

/**
 * @api {post} /api/save-shop-file/:filename Save individual shop file
 * @apiName SaveShopFile
 * @apiGroup ShopEditor
 *
 * @apiParam {String} filename The name of the shop file to save.
 * @apiParam {String} newXmlContent The new content of the shop file.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided or invalid shop filename.
 * @apiError {String} 500 Could not save shop file to disk.
 */
app.post('/api/save-shop-file/:filename', async (req, res) => {
    const { filename } = req.params;
    const { newXmlContent } = req.body;
    if (!newXmlContent) return res.status(400).send('Error: No XML content provided.');
    if (!filename || !/^[a-zA-Z0-9_()-\.]+\.xml$/.test(filename)) {
        return res.status(400).send('Error: Invalid shop filename.');
    }
    const filePath = path.join(SHOPS_DIR, filename);
    try {
        console.log(`[SHOP FILE SAVE START] Attempting to save ${filename} (${newXmlContent.length} bytes)...`); 
        await createBackup(filePath, SHOPS_BACKUP_DIR);
        console.log(`[SHOP FILE SAVE STEP 1] Backup created.`); 

        await fs.writeFile(filePath, newXmlContent, 'utf8');
        console.log(`[SHOP FILE SAVE STEP 2] File content written to disk.`); 
        
        console.log(`[SHOP FILE SAVE END] Sending success response to client.`); 
        res.status(200).send('File saved successfully.');
        
        console.log(`[SHOP FILE SAVE COMPLETE] Response sent successfully.`); 
    } catch (error) {
        console.error(`[SHOP FILE SAVE ERROR] Error during save operation for ${filename}:`, error);
        res.status(500).send('Error: Could not save shop file to disk.');
    }
});

/**
 * @api {post} /api/save-shoplist Save ShopList.xml
 * @apiName SaveShopList
 * @apiGroup ShopEditor
 *
 * @apiParam {String} newXmlContent The new content of ShopList.xml.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided.
 * @apiError {String} 500 Could not save file to disk.
 */
app.post('/api/save-shoplist', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        console.log(`[SHOPLIST SAVE START] Attempting to save ShopList.xml (${newXmlContent.length} bytes)...`);
        await createBackup(SHOP_LIST_PATH, SHOPS_BACKUP_DIR);
        console.log(`[SHOPLIST SAVE STEP 1] Backup created.`);
        
        await fs.writeFile(SHOP_LIST_PATH, newXmlContent, 'utf8');
        console.log(`[SHOPLIST SAVE STEP 2] File content written to disk.`);
        
        console.log(`[SHOPLIST SAVE END] Sending success response to client.`);
        res.status(200).send('File saved successfully.');
        
        console.log(`[SHOPLIST SAVE COMPLETE] Response sent successfully.`);
    } catch (error) {
        console.error('Error during save operation (ShopList):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

/**
 * @api {post} /api/save-mix-file Save Mix Editor File
 * @apiName SaveMixFile
 * @apiGroup MixEditor
 *
 * @apiParam {String} filename The name of the mix file to save.
 * @apiParam {String} newXmlContent The new content of the mix file.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 Missing filename or XML content, or invalid filename.
 * @apiError {String} 500 Could not save mix file to disk.
 */
app.post('/api/save-mix-file', async (req, res) => {
    const { filename, newXmlContent } = req.body;
    if (!filename || !newXmlContent) {
        return res.status(400).send('Error: Missing filename or XML content.');
    }

    let filePath;
    // Determine the correct file path based on the filename
    switch (filename) {
        case 'Mix.xml': filePath = MIX_PATH; break;
        case 'AngelWeaponUpgrade.xml': filePath = ANGEL_WEAPON_UPGRADE_PATH; break;
        case 'MasteryItemMix.xml': filePath = MASTERY_ITEM_MIX_PATH; break;
        case 'MixDisable.xml': filePath = MIX_DISABLE_PATH; break;
        case 'MixJewelTemplate.xml': filePath = MIX_JEWEL_TEMPLATE_PATH; break;
        case 'MixLuckyTemplate.xml': filePath = MIX_LUCKY_TEMPLATE_PATH; break;
        case 'MixSpellStone.xml': filePath = MIX_SPELL_STONE_PATH; break;
        default:
            console.error(`Unknown filename provided to save-mix-file: ${filename}`);
            return res.status(400).send('Error: Invalid or unknown filename.');
    }

    try {
        // Backup the specific file
        console.log(`[UPDATE] Saving mix file: ${filename} (${newXmlContent.length} bytes)`);
        await createBackup(filePath, MIX_BACKUP_DIR);
        // Write the new content
        await fs.writeFile(filePath, newXmlContent, 'utf8');
        
        console.log(`Mix file ${filename} saved successfully.`);
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error(`Error during save operation for ${filename}:`, error);
        res.status(500).send('Error: Could not save mix file to disk.');
    }
});

/**
 * @api {post} /api/save-map-drop-file Save Monster Map Drop File
 * @apiName SaveMapDropFile
 * @apiGroup MonsterDropEditor
 *
 * @apiParam {String} filename The name of the map drop file to save.
 * @apiParam {String} newXmlContent The new content of the map drop file.
 *
 * @apiSuccess {String} 200 File saved successfully.
 *
 * @apiError {String} 400 No XML content provided or invalid map drop filename.
 * @apiError {String} 500 Could not save map drop file to disk.
 */
app.post('/api/save-map-drop-file', async (req, res) => {
    const { filename, newXmlContent } = req.body;
    
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    // Security check: Ensure filename is valid and doesn't try to escape the directory
    if (!filename || !/^MonsterMap_\(\d+\)_Bag\.xml$/.test(filename)) {
        console.error(`Invalid filename provided to save-map-drop-file: ${filename}`);
        return res.status(400).send('Error: Invalid map drop filename.');
    }

    const filePath = path.join(EACH_MONSTER_MAP_DROP_DIR, filename);

    try {
        // Backup the specific file
        console.log(`[UPDATE] Saving map drop file: ${filename} (${newXmlContent.length} bytes)`);
        await createBackup(filePath, MAP_DROP_BACKUP_DIR);
        // Write the new content
        await fs.writeFile(filePath, newXmlContent, 'utf8');
        
        console.log(`Map Drop file ${filename} saved successfully.`);
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error(`Error during save operation for ${filename}:`, error);
        res.status(500).send('Error: Could not save map drop file to disk.');
    }
});
// --- End of new save route ---

app.post('/api/save-event-data', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        await createBackup(EVENT_SCHEDULE_PATH, EVENT_BACKUP_DIR);
        await fs.writeFile(EVENT_SCHEDULE_PATH, newXmlContent, 'utf8');
        console.log('Event data saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (Event Data):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

/**
 * @api {get} /api/config Get Server Configuration
 * @apiName GetConfig
 * @apiGroup ConfigEditor
 *
 * @apiSuccess {Object} config The current server configuration.
 */
app.get('/api/config', (req, res) => {
    // Read the file fresh each time to ensure we get the latest on-disk state
    try {
        const currentConfig = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
        res.json(currentConfig);
    } catch (error) {
        console.error('Error reading config.json:', error);
        res.status(500).send('Error reading configuration file.');
    }
});

/**
 * @api {post} /api/config Save Server Configuration
 * @apiName SaveConfig
 * @apiGroup ConfigEditor
 *
 * @apiParam {Object} newConfig The new configuration object.
 *
 * @apiSuccess {String} 200 Configuration saved successfully.
 */
app.post('/api/config', async (req, res) => {
    const newConfig = req.body;
    if (!newConfig) {
        return res.status(400).send('Error: No configuration provided.');
    }

    try {
        const configPath = path.join(__dirname, 'config.json');
        
        
        console.log(`[UPDATE] Saving Server Configuration...`);

        // Validation: Ensure essential keys exist
        if (!newConfig.SERVER_PORT) {
             return res.status(400).send('Error: SERVER_PORT is required.');
        }

        // Write to file
        await fs.writeFile(configPath, JSON.stringify(newConfig, null, 4), 'utf8');
        
        console.log('Configuration saved successfully.');
        res.status(200).send('Configuration saved successfully. Please restart the server for changes to take effect.');
    } catch (error) {
        console.error('Error saving config.json:', error);
        res.status(500).send('Error saving configuration file.');
    }
});

/**
 * @api {get} /configeditor.html Request config editor page
 */
app.get('/configeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'configeditor.html'));
});


// --- System Dialogs ---
/**
 * @api {get} /api/browse-folder Open Native Folder Browser
 * @apiName BrowseFolder
 * @apiGroup System
 * @apiSuccess {Object} data The selected folder path.
 */
app.get('/api/browse-folder', (req, res) => {
    const { exec } = require('child_process');
    // PowerShell command to open a folder picker dialog
    // PowerShell command to open a folder picker dialog (flattened to single line for exec compatibility)
    const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = "Select your MU Online Data Folder"; $f.ShowNewFolderButton = $true; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }`;

    // Execute PowerShell command expecting Single Threaded Apartment (required for WinForms)
    exec(`powershell -NoProfile -Sta -Command "${psCommand.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`[BROWSE ERROR] Execution error: ${error.message}`);
            console.error(`[BROWSE ERROR] Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Failed to open folder picker' });
        }
        
        const selectedPath = stdout.trim();
        // Check if stdout actually has a path or if it's empty (cancelled)
        if (selectedPath) {
            res.json({ path: selectedPath });
        } else {
            // User cancelled
            res.json({ cancelled: true });
        }
    });
});

// --- Server Control Endpoints ---
app.post('/api/restart', (req, res) => {
    console.log('Restart requested via API...');
    res.json({ status: 'restarting', message: 'Server is restarting...' });
    
    // Allow response to be sent before exiting
    setTimeout(() => {
        console.log('Exiting with code 10 (RESTART)...');
        process.exit(10); // Code 10 will be caught by the batch script to trigger restart
    });
});

app.post('/api/shutdown', (req, res) => {
    console.log('Shutdown requested via API...');
    res.json({ status: 'shutdown', message: 'Server is shutting down...' });
    
    // Allow response to be sent before exiting
    setTimeout(() => {
        console.log('Exiting with code 0 (SHUTDOWN)...');
        process.exit(0); 
    }, 1000);
});

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await fs.readFile(LOG_FILE, 'utf8');
        // Return last 200 lines
        const lines = logs.split('\n');
        const recentLogs = lines.slice(-200).join('\n');
        res.send(recentLogs);
    } catch (error) {
        // If log file doesn't exist yet, just return empty
        if (error.code === 'ENOENT') return res.send('');
        res.status(500).send('Error reading logs: ' + error.message);
    }
});

app.get('/api/status', (req, res) => {
    // Server is ready if we can respond to this request
    res.json({ ready: true, uptime: process.uptime() });
});
// ------------------------------

/**
 * Starts the Express server and listens for connections on the specified port.
 * It also performs a startup check to ensure all required files and directories are accessible.
 * @param {number} PORT - The port to listen on.
 * @param {Function} callback - The callback function to execute once the server is running.
 */
app.listen(PORT, IP, async () => {
    try {
        // Check file paths on startup
        console.log('Checking file paths...');
        await fs.access(MONSTER_SPAWN_PATH);
        await fs.access(MONSTER_LIST_PATH);
        await fs.access(ZEN_DROP_PATH);
        await fs.access(ITEM_LIST_PATH);
        await fs.access(SHOP_LIST_PATH);
        await fs.access(SHOPS_DIR);
        await fs.access(ITEM_EXCELLENT_OPTIONS_PATH);
        await fs.access(ITEM_STACK_PATH);
        
        // Check Mix Editor paths
        await fs.access(MIX_PATH);
        await fs.access(ANGEL_WEAPON_UPGRADE_PATH);
        await fs.access(MASTERY_ITEM_MIX_PATH);
        await fs.access(MIX_DISABLE_PATH);
        await fs.access(MIX_JEWEL_TEMPLATE_PATH);
        await fs.access(MIX_LUCKY_TEMPLATE_PATH);
        await fs.access(MIX_SPELL_STONE_PATH);
        
        // --- Check Map Drop paths ---
        await fs.access(EACH_MONSTER_MAP_DROP_DIR);
        
        // --- Check context file paths ---
        await fs.access(MASTERY_EXC_OPTIONS_PATH);
        await fs.access(PENTAGRAM_DROP_RATE_PATH);
        await fs.access(SOCKET_ITEM_DROP_RATES_PATH);
        await fs.access(ITEM_DROP_RATE_CONTROL_PATH);
        await fs.access(EVENT_SCHEDULE_PATH);
        
        console.log('All file paths verified.');
        
        console.log(`Spawn Editor server running on http://localhost:${PORT}`);
        
        // Auto-open browser
        const { exec } = require('child_process');
        const startCommand = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
        exec(`${startCommand} http://localhost:${PORT}`);
        
        // Log all directories and backups
        console.log(`Monster Backups will be saved to: ${MONSTER_BACKUP_DIR}`);
        console.log(`Zen Backups will be saved to: ${ZEN_BACKUP_DIR}`);
        console.log(`Shop Backups will be saved to: ${SHOPS_BACKUP_DIR}`);
        console.log(`Mix Backups will be saved to: ${MIX_BACKUP_DIR}`);
        console.log(`Map Drop Backups will be saved to: ${MAP_DROP_BACKUP_DIR}`); // Added log
        console.log(`Event Backups will be saved to: ${EVENT_BACKUP_DIR}`);

    } catch (error) {
        console.error('--- !!! SERVER STARTUP FAILED !!! ---');
        if (error.code === 'ENOENT') {
            console.error(`Error: A required file path is invalid. Check your \`server.js\` config.`);
            console.error(`File not found: ${error.path}`);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        process.exit(1); // Exit if paths are bad
    }
});