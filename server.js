const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');
const config = require('./config.json');

const app = express();
const PORT = 3000; // The port your server will run on. Ensure it's open.

// --- Path Resolution ---
// Resolve all paths from config.json relative to the application's root directory
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
const EVENT_DIR = resolvePath(config.EVENT_DIR || 'data/Event');
const EVENT_BACKUP_DIR = resolvePath(config.EVENT_BACKUP_DIR || path.join('data', 'Event', 'Backups'));

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

// Explicitly serve the HTML files from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/monsterspawneditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'monsterspawneditor.html'));
});

app.get('/shopeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'shopeditor.html'));
});

app.get('/mixeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'mixeditor.html'));
});

app.get('/monsterdropeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'monsterdropeditor.html'));
});

app.get('/zendropeditor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'zendropeditor.html'));
});

app.get('/eventscheduler.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'eventscheduler.html'));
});


// --- Helper Functions ---
/**
 * Creates a timestamped backup of a file.
 * @param {string} filePath - The full path to the file to back up.
 * @param {string} backupDir - The directory to store the backup in.
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
 * Read the top-of-file header from a text/XML/INI file without parsing the entire content.
 * Returns an object { header: string, body: string }
 */
async function readFileHeader(filePath, maxChars = 10000) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const sample = content.slice(0, maxChars);

        // If XML and has leading comment blocks <!-- ... -->, extract them
        const xmlCommentMatch = sample.match(/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--([\s\S]*?)-->\s*)+/);
        if (xmlCommentMatch) {
            // Collect consecutive comment blocks
            const commentBlocks = [];
            const commentRegex = /<!--([\s\S]*?)-->/g;
            let m;
            while ((m = commentRegex.exec(sample)) !== null) {
                commentBlocks.push(m[1].trim());
            }
            const header = commentBlocks.join('\n');
            const restIndex = sample.indexOf('-->') + 3;
            const body = content.slice(restIndex).trimStart();
            return { header: header.trim(), body };
        }

        // Otherwise, read lines until a blank line or a non-comment line (for INI-like or code files)
        const lines = sample.split(/\r?\n/);
        const headerLines = [];
        let i = 0;
        for (; i < lines.length; i++) {
            const ln = lines[i];
            if (ln.trim() === '') break;
            // consider comment markers
            if (/^\s*(?:\/\/|;|#)/.test(ln) || /^\s*\/\*/.test(ln) || /^\s*<!--/.test(ln)) {
                headerLines.push(ln.replace(/^\s*(?:\/\/|;|#)\s?/, '').replace(/^\s*<!--\s?/, '').replace(/-->\s*$/, ''));
                continue;
            }
            // For INI files, lines like [Section] or key=value at top could be part of header as well
            if (/^[a-zA-Z0-9_\[\];#\-\s=:,]+$/.test(ln) && ln.length < 200) {
                headerLines.push(ln);
                continue;
            }
            // otherwise stop
            break;
        }

        const header = headerLines.join('\n').trim();
        const body = content.slice(i ? content.indexOf(lines[i]) : 0).trimStart();
        return { header, body };
    } catch (err) {
        return { header: '', body: '' };
    }
}

/**
 * Parse a simple header block into key/value pairs.
 * Supports lines like `Key=Value`, `Key: Value`, `key value` and CSV-like directives.
 */
function parseHeaderToKV(header) {
    if (!header) return {};
    const lines = header.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out = {};
    for (const ln of lines) {
        // key = value
        const mEq = ln.match(/^([^=:\s]+)\s*=\s*(.+)$/);
        if (mEq) { out[mEq[1]] = mEq[2]; continue; }

        const mColon = ln.match(/^([^:]+):\s*(.+)$/);
        if (mColon) { out[mColon[1].trim()] = mColon[2].trim(); continue; }

        const mSpace = ln.match(/^([A-Za-z0-9_]+)\s+(.+)$/);
        if (mSpace) { out[mSpace[1]] = mSpace[2]; continue; }

        // fallback: push as raw line entries
        const key = `line_${Object.keys(out).length+1}`;
        out[key] = ln;
    }
    return out;
}

// Route to get the spawn and monster list files
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

// Route for Combined Drop Rate Editor Data
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

// Route for Shop Editor Data
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

// --- Route to get individual shop file content ---
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

// Route for Mix Editor Data
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

// --- NEW: Route for Monster Map Drop Editor Data ---
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

// --- NEW: Route to get single map drop file content ---
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


// --- Event Scheduler API ---
app.get('/api/event-data', async (req, res) => {
    try {
        // Ensure event directory exists
        await fs.access(EVENT_DIR);

        // Read Event.ini if present
        const eventIniPath = path.join(EVENT_DIR, 'Event.ini');
        let eventIni = '';
        try {
            await fs.access(eventIniPath);
            eventIni = await fs.readFile(eventIniPath, 'utf8');
        } catch (e) {
            // file may not exist; that's fine
            eventIni = '';
        }

        // Read other useful event files if present
        const invasionMonstersPath = path.join(EVENT_DIR, 'InvasionMonsters.xml');
        const invasionManagerPath = path.join(EVENT_DIR, 'InvasionManager.xml');
        const eventSeasonManagerPath = path.join(EVENT_DIR, 'EventSeasonManager.xml');

        const invasionMonsters = await (async () => {
            try { await fs.access(invasionMonstersPath); return await fs.readFile(invasionMonstersPath, 'utf8'); } catch { return ''; }
        })();
        const invasionManager = await (async () => {
            try { await fs.access(invasionManagerPath); return await fs.readFile(invasionManagerPath, 'utf8'); } catch { return ''; }
        })();
        const eventSeasonManager = await (async () => {
            try { await fs.access(eventSeasonManagerPath); return await fs.readFile(eventSeasonManagerPath, 'utf8'); } catch { return ''; }
        })();

        // List subfolders and files for discovery
        const entries = await fs.readdir(EVENT_DIR, { withFileTypes: true });
        const files = [];
        const dirs = [];
        for (const e of entries) {
            if (e.isDirectory()) dirs.push(e.name);
            else files.push(e.name);
        }

        // For each file present, attempt to extract a header and parse it
        const fileDetails = [];
        for (const f of files) {
            const fp = path.join(EVENT_DIR, f);
            try {
                const { header } = await readFileHeader(fp);
                const parsed = parseHeaderToKV(header);
                fileDetails.push({ filename: f, header, parsed });
            } catch (e) {
                fileDetails.push({ filename: f, header: '', parsed: {} });
            }
        }

        res.json({
            eventIni,
            invasionMonsters,
            invasionManager,
            eventSeasonManager,
            files,
            dirs,
            fileDetails
        });
    } catch (error) {
        console.error('Error reading Event directory:', error);
        if (error.code === 'ENOENT') {
            res.status(500).send(`Error: Event directory not found: ${EVENT_DIR}`);
        } else {
            res.status(500).send('Error: Could not read Event directory.');
        }
    }
});

// Serve raw event file content by filename (safe basename only)
app.get('/api/event-file', async (req, res) => {
    const { filename } = req.query;
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).send('Invalid filename');
    }
    const filePath = path.join(EVENT_DIR, filename);
    try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        // If parse query param present, include header and parsed metadata
        if (req.query.parse === '1' || req.query.parse === 'true') {
            const { header, body } = await readFileHeader(filePath);
            const parsed = parseHeaderToKV(header);
            res.json({ filename, header, parsed, body, raw: content });
            return;
        }

        res.header('Content-Type', 'text/plain');
        res.send(content);
    } catch (err) {
        console.error(`Error reading event file ${filename}:`, err);
        res.status(404).send('File not found');
    }
});


app.post('/api/save-event-data', async (req, res) => {
    const { filename, newContent } = req.body;
    // If no filename provided, default to Event.ini
    const target = filename ? path.join(EVENT_DIR, filename) : path.join(EVENT_DIR, 'Event.ini');

    if (!newContent) return res.status(400).send('Error: No content provided.');

    try {
        // Ensure event dir exists
        await fs.mkdir(EVENT_DIR, { recursive: true });
        await createBackup(target, EVENT_BACKUP_DIR);
        await fs.writeFile(target, newContent, 'utf8');
        console.log(`Saved event data to ${target}`);
        res.status(200).send('Saved');
    } catch (error) {
        console.error('Error saving event data:', error);
        res.status(500).send('Error: Could not save event data.');
    }
});

// --- End Event Scheduler API ---


// --- SAVE ENDPOINTS ---

// Save route for MonsterSpawn.xml
app.post('/api/save', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        await createBackup(MONSTER_SPAWN_PATH, MONSTER_BACKUP_DIR);
        await fs.writeFile(MONSTER_SPAWN_PATH, newXmlContent, 'utf8');
        console.log('MonsterSpawn.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (MonsterSpawn):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

// Save route for ItemExcellentOptions.xml
app.post('/api/save-excellent-options', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        await createBackup(ITEM_EXCELLENT_OPTIONS_PATH, ZEN_BACKUP_DIR); // Reusing Zen backup directory
        await fs.writeFile(ITEM_EXCELLENT_OPTIONS_PATH, newXmlContent, 'utf8');
        console.log('ItemExcellentOptions.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (ItemExcellentOptions):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

// Save route for ZenDrop.xml
app.post('/api/save-zendrop', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        await createBackup(ZEN_DROP_PATH, ZEN_BACKUP_DIR);
        await fs.writeFile(ZEN_DROP_PATH, newXmlContent, 'utf8');
        console.log('ZenDrop.xml saved successfully.');
        res.status(200).send('File saved successfully.');
    } catch (error) {
        console.error('Error during save operation (ZenDrop):', error);
        res.status(500).send('Error: Could not save file to disk.');
    }
});

// Save route for individual shop files
app.post('/api/save-shop-file/:filename', async (req, res) => {
    const { filename } = req.params;
    const { newXmlContent } = req.body;
    if (!newXmlContent) return res.status(400).send('Error: No XML content provided.');
    if (!filename || !/^[a-zA-Z0-9_()-\.]+\.xml$/.test(filename)) {
        return res.status(400).send('Error: Invalid shop filename.');
    }
    const filePath = path.join(SHOPS_DIR, filename);
    try {
        console.log(`[SHOP FILE SAVE START] Attempting to save ${filename}...`); 
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

// Save route for the master ShopList.xml
app.post('/api/save-shoplist', async (req, res) => {
    const { newXmlContent } = req.body;
    if (!newXmlContent) {
        return res.status(400).send('Error: No XML content provided.');
    }
    try {
        console.log(`[SHOPLIST SAVE START] Attempting to save ShopList.xml...`);
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

// Generic Save Route for Mix Editor Files
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

// --- NEW: Save Route for Monster Map Drop Files ---
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


// Start the server
app.listen(PORT, async () => {
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
        
        console.log('All file paths verified.');
        
        console.log(`Spawn Editor server running on http://localhost:${PORT}`);
        
        // Log all directories and backups
        console.log(`Monster Backups will be saved to: ${MONSTER_BACKUP_DIR}`);
        console.log(`Zen Backups will be saved to: ${ZEN_BACKUP_DIR}`);
        console.log(`Shop Backups will be saved to: ${SHOPS_BACKUP_DIR}`);
        console.log(`Mix Backups will be saved to: ${MIX_BACKUP_DIR}`);
        console.log(`Map Drop Backups will be saved to: ${MAP_DROP_BACKUP_DIR}`); // Added log

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