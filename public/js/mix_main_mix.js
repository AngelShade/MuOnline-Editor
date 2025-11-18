/**
 * @file Contains all logic for parsing, manipulating, and rendering the Main Mix (Mix.xml) data.
 * @namespace MixMainMix
 * @description Global object holding all functions for the Main Mix editor tab.
 * Assumes access to global variables and functions from the main editor script,
 * such as `mixData`, `pushUndo`, `saveToCache`, `renderEditor`, `getItemName`, etc.
 */
// Global placeholder for Main Mix data and functions
// NOTE: This file assumes global access to mixData, originalXmlHeaders,
// pushUndo, saveToCache, renderTabControls, getCatAndIndex, getItemName, and parseItemType
const MixMainMix = {};

/**
 * Parses the Mix.xml string and populates the `mixData.main` array.
 * NOTE: This implementation is read-only for item groups due to complexity.
 * @param {string} xmlText The XML content of Mix.xml.
 */
MixMainMix.parseMix = function(xmlText) {
    mixData.main = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Store header (if needed, though this is done in parseAllData in the main file)
    // We keep this line just to ensure we catch the XML data structure for consistency.
    originalXmlHeaders.main = xmlText.match(/^[\s\S]*?(?=<Mixes>)/i)?.[0] || '<?xml version="1.0" encoding="utf-8"?>\n';

    for (let mix of xmlDoc.getElementsByTagName('Mix')) {
        const maxRates = [];
        if (mix.hasAttribute('MaxRate1')) {
            let i = 1;
            while (mix.hasAttribute(`MaxRate${i}`)) {
                maxRates.push(mix.getAttribute(`MaxRate${i}`));
                i++;
            }
        } else if (mix.hasAttribute('MaxRate')) {
            maxRates.push(mix.getAttribute('MaxRate'));
        }

        const mixEntry = {
            ID: mix.getAttribute('ID'),
            ReqMoney: mix.getAttribute('ReqMoney'),
            MaxRates: maxRates,
            groups: []
        };
        for (let group of mix.getElementsByTagName('Group')) {
            const groupEntry = {
                Index: group.getAttribute('Index'),
                data: []
            };
            for (let data of group.getElementsByTagName('Data')) {
                groupEntry.data.push({
                    ItemMin: data.getAttribute('ItemMin'), // Flat ID of min item
                    ItemMax: data.getAttribute('ItemMax'), // Flat ID of max item
                    LevelMin: data.getAttribute('LevelMin'),
                    LevelMax: data.getAttribute('LevelMax'),
                    OptMin: data.getAttribute('OptMin'),
                    OptMax: data.getAttribute('OptMax'),
                    CountMin: data.getAttribute('CountMin'),
                    CountMax: data.getAttribute('CountMax'),
                    ItemType: data.getAttribute('ItemType'),
                    KindA: data.getAttribute('KindA') || '', // Ensure KindA is present but empty if missing
                });
            }
            mixEntry.groups.push(groupEntry);
        }
        mixData.main.push(mixEntry);
    }
};

/**
 * Updates a top-level value in a specific Mix.xml data entry.
 * @param {number} index The index of the mix entry in `mixData.main`.
 * @param {string} field The property name to update (e.g., 'ReqMoney', 'MaxRate_0').
 * @param {string} value The new value to set.
 */
MixMainMix.updateMixValue = function(index, field, value) {
    if (mixData.main[index]) {
        pushUndo();
        // Handle MaxRates array update
        if (field.startsWith('MaxRate_')) {
            const rateIndex = parseInt(field.split('_')[1], 10);
            mixData.main[index].MaxRates[rateIndex] = value;
        } else {
            mixData.main[index][field] = value;
        }
        mixData.main[index].isModified = true;
        // No renderEditor call here to preserve input focus
        saveToCache();
    }
};

/**
 * Calculates the Flat ID from Category and Index.
 * @param {number} cat Category ID.
 * @param {number} index Index ID.
 * @returns {number} The calculated Flat ID.
 */
MixMainMix.calculateFlatId = function(cat, index) {
    return (parseInt(cat, 10) * 512) + parseInt(index, 10);
};

/**
 * Updates a specific data field for an item requirement within a group.
 * @param {number} mixIndex The index of the mix entry.
 * @param {number} groupIndex The index of the group within the mix.
 * @param {number} dataIndex The index of the item data element within the group.
 * @param {string} field The property name to update (e.g., 'ItemMin', 'LevelMax').
 * @param {string} value The new value for the field.
 */
MixMainMix.updateGroupData = function(mixIndex, groupIndex, dataIndex, field, value) {
    if (mixData.main[mixIndex] && mixData.main[mixIndex].groups[groupIndex] && mixData.main[mixIndex].groups[groupIndex].data[dataIndex]) {
        pushUndo();

        // Find the specific data object
        const dataObj = mixData.main[mixIndex].groups[groupIndex].data[dataIndex];
        dataObj[field] = value.toString(); // Ensure attribute value is string

        mixData.main[mixIndex].isModified = true;
        // Re-render to show updated item name if ItemMin/ItemMax changed, but not for every input
        if (field === 'ItemMin' || field === 'ItemMax' || field === 'ItemType') {
            renderEditor();
        } else {
            saveToCache();
        }
    }
};

/**
 * Handles the callback from the item search modal for updating `ItemMin` or `ItemMax`.
 * This function is the entry point for item selection via the modal.
 * @param {number} cat The selected item's category.
 * @param {number} index The selected item's index.
 * @param {object} context The context object passed from the modal opener.
 * @param {number} context.mixIndex The index of the mix.
 * @param {number} context.groupIndex The index of the group.
 * @param {number} context.dataIndex The index of the data element.
 * @param {string} context.field The field being updated ('ItemMin' or 'ItemMax').
 */
MixMainMix.handleItemModalCallback = function(cat, index, context) {
    const { mixIndex, groupIndex, dataIndex, field } = context;
    const flatId = MixMainMix.calculateFlatId(cat, index);

    // Use the existing updateGroupData to ensure undo history is tracked correctly
    MixMainMix.updateGroupData(mixIndex, groupIndex, dataIndex, field, flatId);
    // updateGroupData calls renderEditor if ItemMin/ItemMax changes.
};

/**
 * Adds a new item requirement (`<Data>`) to a specified group.
 * @param {number} mixIndex The index of the mix entry.
 * @param {number} groupIndex The index of the group within the mix.
 */
MixMainMix.addItemToGroup = function(mixIndex, groupIndex) {
    if (mixData.main[mixIndex] && mixData.main[mixIndex].groups[groupIndex]) {
        pushUndo();
        const group = mixData.main[mixIndex].groups[groupIndex];

        const newItem = {
            // Default placeholder values: Any Item (0, 0) x1 -> Flat ID 0
            ItemMin: "0", ItemMax: "0", LevelMin: "0", LevelMax: "255",
            OptMin: "0", OptMax: "255", CountMin: "1", CountMax: "1",
            ItemType: "0", KindA: ""
        };
        group.data.push(newItem);
        mixData.main[mixIndex].isModified = true;
        renderEditor();
        saveToCache();
    }
};

/**
 * Removes an item requirement (`<Data>`) from a specified group after user confirmation.
 * @param {number} mixIndex The index of the mix entry.
 * @param {number} groupIndex The index of the group within the mix.
 * @param {number} dataIndex The index of the data item to remove.
 */
MixMainMix.removeItemFromGroup = function(mixIndex, groupIndex, dataIndex) {
    if (mixData.main[mixIndex] && mixData.main[mixIndex].groups[groupIndex] && mixData.main[mixIndex].groups[groupIndex].data.length > 0) {
        confirmAction('Remove Item Rule?', 'Are you sure you want to remove this specific item requirement? This cannot be undone.', () => {
            pushUndo();
            const group = mixData.main[mixIndex].groups[groupIndex];
            group.data.splice(dataIndex, 1);
            mixData.main[mixIndex].isModified = true;
            renderEditor();
            saveToCache();
        });
    }
};


/**
 * Adds a new, empty requirement group (`<Group>`) to a mix entry.
 * The new group will have one default item rule.
 * @param {number} mixIndex The index of the mix entry in `mixData.main`.
 */
MixMainMix.addGroup = function(mixIndex) {
    if (mixData.main[mixIndex]) {
        pushUndo();
        const mix = mixData.main[mixIndex];
        // Determine the next available group index (Index attribute is a string)
        const currentIndices = mix.groups.map(g => parseInt(g.Index, 10)).filter(i => !isNaN(i));
        const nextIndex = currentIndices.length > 0 ? Math.max(...currentIndices) + 1 : 1;

        const newGroup = {
            Index: nextIndex.toString(),
            data: [{
                // Default placeholder values for a single item requirement
                ItemMin: "0", ItemMax: "0", LevelMin: "0", LevelMax: "255",
                OptMin: "0", OptMax: "255", CountMin: "1", CountMax: "1",
                ItemType: "0", KindA: ""
            }]
        };
        mix.groups.push(newGroup);
        mix.isModified = true;
        renderEditor(); // Rerender to show the new group
        saveToCache();
    }
};

/**
 * Removes the last requirement group (`<Group>`) from a mix entry after user confirmation.
 * @param {number} mixIndex The index of the mix entry in `mixData.main`.
 */
MixMainMix.removeGroup = function(mixIndex) {
    if (mixData.main[mixIndex] && mixData.main[mixIndex].groups.length > 0) {
        confirmAction('Remove Last Group?', 'Are you sure you want to remove the last requirement group? All its contained item rules will be lost.', () => {
            pushUndo();
            const mix = mixData.main[mixIndex];
            mix.groups.pop();
            mix.isModified = true;
            renderEditor();
            saveToCache();
        });
    }
};

/**
 * Generates the XML content for Mix.xml from the in-memory data.
 * NOTE: The structure of the <Group> and <Data> tags are preserved exactly as parsed.
 * @returns {string} The generated XML string.
 */
MixMainMix.generateMixXml = function() {
    let xml = originalXmlHeaders.main;
    xml += '<Mixes>\n';

    mixData.main.forEach(mix => {
        let mixAttributes = `ID="${mix.ID}" ReqMoney="${mix.ReqMoney}"`;

        // Output MaxRate or MaxRate1-N
        if (mix.MaxRates.length === 1) {
            mixAttributes += ` MaxRate="${mix.MaxRates[0]}"`;
        } else if (mix.MaxRates.length > 1) {
            mix.MaxRates.forEach((rate, i) => {
                mixAttributes += ` MaxRate${i + 1}="${rate}"`;
            });
        }

        xml += `\t<Mix ${mixAttributes}>\n`;

        mix.groups.forEach(group => {
            xml += `\t\t<Group Index ="${group.Index}" >\n`;
            group.data.forEach(data => {
                let dataAttributes = `ItemMin="${data.ItemMin}" ItemMax="${data.ItemMax}" LevelMin="${data.LevelMin}" LevelMax="${data.LevelMax}" OptMin="${data.OptMin}" OptMax="${data.OptMax}" CountMin="${data.CountMin}" CountMax="${data.CountMax}" ItemType="${data.ItemType}"`;
                if (data.KindA) {
                    dataAttributes += ` KindA="${data.KindA}"`;
                }
                xml += `\t\t\t<Data ${dataAttributes} />\n`;
            });
            xml += `\t\t</Group>\n`;
        });
        xml += `\t</Mix>\n`;
    });

    xml += '</Mixes>\n';
    return xml;
};

/**
 * Renders the content for the Main Mixes tab.
 * @returns {string} HTML content for the tab.
 */
MixMainMix.renderMainMixTab = function() {
    // Labels corresponding to MaxRate1, MaxRate2, ...
    const mixRateLabels = ['Normal Rate', 'Exc/Set Rate', 'Socket Rate', 'Pentagram Rate'];

    // Note: renderTabControls and other helpers are expected to be global functions
    let html = `
        ${renderTabControls('Main Mixes (Mix.xml)', 'Core Chaos Machine recipes. All attributes are now editable. Click on ItemMin/ItemMax labels to use the Item Search Modal.', 'Mix.xml', false)}
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">Mod</th>
                        <th style="width: 80px;">Mix ID</th>
                        <th style="width: 150px;">Cost (Zen)</th>
                        <th style="width: 200px;">Max Rate(s)</th>
                        <th>Required Items (Groups/Rules)</th>
                    </tr>
                </thead>
                <tbody>
                    ${mixData.main.map((mix, mixIndex) => {
                        const isModified = mix.isModified ? 'row-modified' : '';
                        const removeDisabled = mix.groups.length === 0;

                        return `
                            <tr class="${isModified}">
                                <td>${mix.isModified ? '<i data-lucide="pencil-line" style="color:var(--accent-amber);"></i>' : ''}</td>
                                <td>
                                    <input type="number" class="inline-input" style="width: 100%;"
                                           value="${mix.ID}"
                                           onchange="MixMainMix.updateMixValue(${mixIndex}, 'ID', this.value)">
                                </td>
                                <td>
                                    <input type="number" class="inline-input" style="width: 100%;"
                                           value="${mix.ReqMoney}"
                                           onchange="MixMainMix.updateMixValue(${mixIndex}, 'ReqMoney', this.value)">
                                </td>
                                <td>
                                    ${mix.MaxRates.map((rate, i) => {
                                        const label = mixRateLabels[i] || `Rate ${i + 1}`;
                                        return `<div style="display: flex; gap: 5px; align-items: center; margin-bottom: 5px;">
                                            <span style="font-size: 11px; color: var(--text-secondary); width: 80px;">${label}:</span>
                                            <input type="number" class="inline-input" style="width: 60px;"
                                                   value="${rate}"
                                                   onchange="MixMainMix.updateMixValue(${mixIndex}, 'MaxRate_${i}', this.value)"
                                                   title="${label}">
                                            <span style="font-size: 14px; color: var(--accent-green);">%</span>
                                        </div>`;
                                    }).join('')}
                                </td>
                                <td>
                                    <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                                        <button class="btn btn-outline btn-sm" onclick="MixMainMix.addGroup(${mixIndex})" title="Add new requirement group (e.g., Group 3)">
                                            <i data-lucide="plus"></i> Add Group
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="MixMainMix.removeGroup(${mixIndex})" ${removeDisabled ? 'disabled' : ''} title="Remove the last requirement group">
                                            <i data-lucide="minus"></i> Remove Last Group
                                        </button>
                                    </div>
                                    ${mix.groups.map((g, groupIndex) => `
                                        <div class="req-item-group" style="border-left-color: var(--accent-green);">
                                            <strong style="display: flex; justify-content: space-between; align-items: center;">
                                                Group ${g.Index}:
                                                <button class="btn btn-outline btn-sm" onclick="MixMainMix.addItemToGroup(${mixIndex}, ${groupIndex})" title="Add new item rule to this group" style="background: rgba(0, 170, 255, 0.1);">
                                                    <i data-lucide="square-plus"></i> Add Item Rule
                                                </button>
                                            </strong>
                                            ${g.data.map((d, dataIndex) => {
                                                const itemMinId = parseInt(d.ItemMin, 10);
                                                const itemMaxId = parseInt(d.ItemMax, 10);
                                                const { cat: minCat, index: minIndex } = getCatAndIndex(itemMinId);
                                                const { cat: maxCat, index: maxIndex } = getCatAndIndex(itemMaxId);

                                                const itemNameMin = getItemName(minCat, minIndex);
                                                const itemNameMax = getItemName(maxCat, maxIndex);
                                                const isRange = itemMinId !== itemMaxId;
                                                const isSingleItem = !isRange;

                                                // Determine ItemType display
                                                const itemTypeFlags = parseItemType(d.ItemType);

                                                return `
                                                    <div class="req-item glass-effect" style="border: 1px solid rgba(0, 170, 255, 0.2); border-radius: 6px; padding: 8px; margin-bottom: 5px;">
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                                            <span class="req-item-name" style="color: ${isSingleItem ? 'var(--accent-green)' : 'var(--accent-amber)'}; font-size: 14px;">
                                                                ${isSingleItem ? itemNameMin : 'Item Range'}
                                                            </span>
                                                            <button class="action-btn btn-delete" title="Remove Item Rule" onclick="MixMainMix.removeItemFromGroup(${mixIndex}, ${groupIndex}, ${dataIndex})">
                                                                <i data-lucide="x-circle"></i>
                                                            </button>
                                                        </div>

                                                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                                            <!-- ItemMin/Max -->
                                                            <div title="ItemMin Flat ID (${minCat}, ${minIndex})">
                                                                <label style="font-size: 10px; color: var(--text-secondary); cursor: pointer;"
                                                                    onclick="openItemModal({
                                                                        type: 'main',
                                                                        mixIndex: ${mixIndex},
                                                                        groupIndex: ${groupIndex},
                                                                        dataIndex: ${dataIndex},
                                                                        field: 'ItemMin',
                                                                        callback: MixMainMix.handleItemModalCallback
                                                                    })">
                                                                    <i data-lucide="search" style="width: 10px; height: 10px; margin-right: 3px;"></i>ItemMin (Flat ID)
                                                                </label>
                                                                <input type="number" class="inline-input" value="${d.ItemMin}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'ItemMin', this.value)">
                                                            </div>
                                                            <div title="ItemMax Flat ID (${maxCat}, ${maxIndex})">
                                                                <label style="font-size: 10px; color: var(--text-secondary); cursor: pointer;"
                                                                    onclick="openItemModal({
                                                                        type: 'main',
                                                                        mixIndex: ${mixIndex},
                                                                        groupIndex: ${groupIndex},
                                                                        dataIndex: ${dataIndex},
                                                                        field: 'ItemMax',
                                                                        callback: MixMainMix.handleItemModalCallback
                                                                    })">
                                                                    <i data-lucide="search" style="width: 10px; height: 10px; margin-right: 3px;"></i>ItemMax (Flat ID)
                                                                </label>
                                                                <input type="number" class="inline-input" value="${d.ItemMax}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'ItemMax', this.value)">
                                                            </div>

                                                            <!-- CountMin/Max -->
                                                            <div title="CountMin" >
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Count Min</label>
                                                                <input type="number" class="inline-input" value="${d.CountMin}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'CountMin', this.value)">
                                                            </div>
                                                            <div title="CountMax">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Count Max</label>
                                                                <input type="number" class="inline-input" value="${d.CountMax}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'CountMax', this.value)">
                                                            </div>

                                                            <!-- LevelMin/Max -->
                                                            <div title="LevelMin">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Lvl Min</label>
                                                                <input type="number" class="inline-input" value="${d.LevelMin}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'LevelMin', this.value)">
                                                            </div>
                                                            <div title="LevelMax">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Lvl Max</label>
                                                                <input type="number" class="inline-input" value="${d.LevelMax}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'LevelMax', this.value)">
                                                            </div>

                                                            <!-- OptMin/Max -->
                                                            <div title="OptMin">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Opt Min</label>
                                                                <input type="number" class="inline-input" value="${d.OptMin}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'OptMin', this.value)">
                                                            </div>
                                                            <div title="OptMax">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">Opt Max</label>
                                                                <input type="number" class="inline-input" value="${d.OptMax}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'OptMax', this.value)">
                                                            </div>

                                                            <!-- ItemType/KindA -->
                                                            <div title="ItemType (Bitwise flags)">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">ItemType (Flags)</label>
                                                                <input type="number" class="inline-input" value="${d.ItemType}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'ItemType', this.value)"
                                                                    title="${itemTypeFlags}">
                                                            </div>
                                                            <div title="KindA (Optional Attribute)">
                                                                <label style="font-size: 10px; color: var(--text-secondary);">KindA (Optional)</label>
                                                                <input type="number" class="inline-input" value="${d.KindA}"
                                                                    onchange="MixMainMix.updateGroupData(${mixIndex}, ${groupIndex}, ${dataIndex}, 'KindA', this.value)">
                                                            </div>
                                                        </div>

                                                        <!-- Item Name Hint -->
                                                        <div style="margin-top: 5px; font-size: 12px; color: var(--text-secondary); border-top: 1px dashed rgba(0, 170, 255, 0.1); padding-top: 5px;">
                                                            Rule: ${isSingleItem ? itemNameMin : `${itemNameMin} to ${itemNameMax}`}
                                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    `).join('')}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <p style="color: var(--accent-amber); margin-top: -15px;">Tip: ItemMin/ItemMax are Flat IDs. ItemType is a bitwise flag (e.g., 1=Exc, 4=Set, 16=Socket).</p>
    `;
    return html;
};