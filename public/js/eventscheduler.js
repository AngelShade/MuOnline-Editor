document.addEventListener('DOMContentLoaded', () => {
    const categoryList = document.getElementById('category-list');
    const eventTableContainer = document.getElementById('event-table-container');
    const categorySearch = document.getElementById('category-search');
    const eventSearch = document.getElementById('event-search');
    const addEventButton = document.getElementById('add-event');
    const deleteSelectedButton = document.getElementById('delete-selected');
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const saveModalButton = document.getElementById('save-modal');
    const cancelModalButton = document.getElementById('cancel-modal');
    const closeModalButton = document.getElementById('close-modal');

    let allData = {};
    let activeCategory = null;
    let activeCategoryMetadata = null; // To store XML root tag, node names etc.
    let editingIndex = null;

    // --- 1. INITIALIZATION ---
    async function initialize() {
        try {
            const response = await fetch('/api/event-data');
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const data = await response.json();
            parseAllData(data);
            renderCategories();
            addEventListeners();
        } catch (error) {
            console.error('Failed to initialize editor:', error);
            eventTableContainer.innerHTML = `<p style="color: var(--accent-pink);">Failed to load event data. Please check server logs.</p>`;
        }
    }

    // --- 2. DATA PARSING ---
    function parseAllData(data) {
        const parser = new DOMParser();
        allData = {
            'Event.xml': parseGenericXml(parser, data.eventDataXml, 'Event'),
            'InvasionManager.xml': parseInvasionManagerXml(parser, data.invasionManagerXml),
            'Event.ini': parseIni(data.eventIni),
            'EventSeasonManager.xml': parseGenericXml(parser, data.eventSeasonManagerXml, 'Event'),
            'InvasionMonsters.xml': parseInvasionMonstersXml(parser, data.invasionMonstersXml)
        };
    }

    function parseGenericXml(parser, xmlString, nodeName) {
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const rootElement = xmlDoc.documentElement;
        const items = [];
        xmlDoc.querySelectorAll(nodeName).forEach(node => {
            const item = { attributes: {} };
            for (const attr of node.attributes) {
                item.attributes[attr.name] = attr.value;
            }
            items.push(item);
        });
        return { type: 'xml', data: items, metadata: { rootTag: rootElement.tagName, nodeName } };
    }

    function parseInvasionManagerXml(parser, xmlString) {
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const rootElement = xmlDoc.documentElement;
        const invasions = {};
        xmlDoc.querySelectorAll('Invasion').forEach(node => {
            const index = node.getAttribute('Index');
            if (!invasions[index]) invasions[index] = { attributes: { Index: index, Name: node.getAttribute('Name') }, children: [] };
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const childData = { tagName: child.tagName, attributes: {} };
                    for (const attr of child.attributes) {
                        childData.attributes[attr.name] = attr.value;
                    }
                    invasions[index].children.push(childData);
                }
            });
        });
        return { type: 'xml-grouped', data: Object.values(invasions), metadata: { rootTag: rootElement.tagName, nodeName: 'Invasion' } };
    }

    function parseInvasionMonstersXml(parser, xmlString) {
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const rootElement = xmlDoc.documentElement;
        const invasions = {};
        xmlDoc.querySelectorAll('Invasion').forEach(node => {
            const index = node.getAttribute('Index');
            if (!invasions[index]) invasions[index] = { attributes: { Index: index, Name: node.getAttribute('Name') }, children: [] };
            node.querySelectorAll('Monster').forEach(monsterNode => {
                const monsterData = { tagName: 'Monster', attributes: {} };
                for (const attr of monsterNode.attributes) {
                    monsterData.attributes[attr.name] = attr.value;
                }
                invasions[index].children.push(monsterData);
            });
        });
        return { type: 'xml-grouped', data: Object.values(invasions), metadata: { rootTag: rootElement.tagName, nodeName: 'Invasion' } };
    }

    function parseIni(iniString) {
        const sections = {};
        if (!iniString) return { type: 'ini', data: [] };
        let currentSection = null;
        // Fix for inconsistent line endings
        iniString.replace(/\\r\\n/g, '\\n').split('\\n').forEach(line => {
            line = line.trim();
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.substring(1, line.length - 1);
                sections[currentSection] = { attributes: { Section: currentSection } }; // Use a consistent key for the section name
            } else if (currentSection && line.includes('=')) {
                const [key, value] = line.split('=').map(s => s.trim());
                if (key) sections[currentSection].attributes[key] = value;
            }
        });
        return { type: 'ini', data: Object.values(sections) };
    }


    // --- 3. UI RENDERING ---
    function renderCategories() {
        categoryList.innerHTML = '';
        const searchTerm = categorySearch.value.toLowerCase();
        Object.keys(allData).filter(key => key.toLowerCase().includes(searchTerm)).forEach(key => {
            const div = document.createElement('div');
            div.className = 'map-item';
            div.textContent = key;
            div.dataset.key = key;
            div.addEventListener('click', () => selectCategory(key));
            categoryList.appendChild(div);
        });
    }

    function selectCategory(key) {
        activeCategory = key;
        activeCategoryMetadata = allData[key].metadata || null; // Store metadata for saving
        document.querySelectorAll('#category-list .map-item').forEach(el => {
            el.classList.toggle('active', el.dataset.key === key);
        });
        renderTable();
    }

    function renderTable() {
        if (!activeCategory) {
            eventTableContainer.innerHTML = `<div class="empty-state"><h3>Select a category</h3><p>Choose a file from the list on the left to start editing.</p></div>`;
            return;
        }

        const { type, data } = allData[activeCategory];
        if (!data || data.length === 0) {
            eventTableContainer.innerHTML = `<div class="empty-state"><h3>No data found</h3><p>This file appears to be empty. Click 'Add Event' to create a new entry.</p></div><table><thead></thead><tbody></tbody></table>`;
            return;
        }

        const headers = Array.from(data.reduce((acc, item) => {
            Object.keys(item.attributes).forEach(key => acc.add(key));
            return acc;
        }, new Set()));


        let html = `
            <table>
                <thead>
                    <tr>
                        <th><input type="checkbox" id="select-all"></th>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const searchTerm = eventSearch.value.toLowerCase();
        data.forEach((item, index) => {
            const values = Object.values(item.attributes).join(' ').toLowerCase();
            if (searchTerm && !values.includes(searchTerm)) return;

            html += `
                <tr data-index="${index}">
                    <td><input type="checkbox" class="row-select"></td>
                    ${headers.map(h => `<td>${item.attributes[h] || ''}</td>`).join('')}
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="openModal(${index})"><i data-lucide="edit"></i></button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        eventTableContainer.innerHTML = html;
        lucide.createIcons();
    }

    // --- 4. MODAL ---
    window.openModal = (index) => {
        editingIndex = index;
        const isAdding = index === null;
        const dataSet = allData[activeCategory]?.data || [];

        // Determine headers from the entire dataset, not just the first item
        const headers = Array.from(dataSet.reduce((acc, item) => {
            Object.keys(item.attributes).forEach(key => acc.add(key));
            return acc;
        }, new Set()));

        const item = isAdding ? { attributes: {} } : dataSet[index];
        modalTitle.textContent = isAdding ? 'Add New Entry' : 'Edit Entry';

        let formHtml = '';
        headers.forEach(key => {
            formHtml += `
                <div class="form-group">
                    <label>${key}</label>
                    <input type="text" id="modal-${key}" class="inline-input" value="${item.attributes[key] || ''}">
                </div>
            `;
        });

        modalBody.innerHTML = formHtml;
        modal.style.display = 'flex';
    };

    function closeModal() {
        modal.style.display = 'none';
        editingIndex = null;
    }

    function saveModal() {
        const dataSet = allData[activeCategory].data;
        const headers = Array.from(dataSet.reduce((acc, item) => {
            Object.keys(item.attributes).forEach(key => acc.add(key));
            return acc;
        }, new Set()));

        const item = (editingIndex === null) ? { attributes: {} } : dataSet[editingIndex];

        headers.forEach(key => {
            const input = document.getElementById(`modal-${key}`);
            if (input) item.attributes[key] = input.value;
        });

        if (editingIndex === null) {
            dataSet.push(item);
        }

        renderTable();
        closeModal();
    }

    // --- 5. EVENT LISTENERS & ACTIONS ---
    function addEventListeners() {
        categorySearch.addEventListener('input', renderCategories);
        eventSearch.addEventListener('input', renderTable);
        addEventButton.addEventListener('click', () => openModal(null));
        deleteSelectedButton.addEventListener('click', deleteSelected);
        document.getElementById('save-category').addEventListener('click', saveActiveCategory);

        eventTableContainer.addEventListener('change', (e) => {
            if (e.target.id === 'select-all') {
                document.querySelectorAll('.row-select').forEach(cb => cb.checked = e.target.checked);
            }
        });

        closeModalButton.addEventListener('click', closeModal);
        cancelModalButton.addEventListener('click', closeModal);
        saveModalButton.addEventListener('click', saveModal);
    }

    function deleteSelected() {
        const indicesToDelete = [];
        document.querySelectorAll('.row-select:checked').forEach(cb => {
            indicesToDelete.push(parseInt(cb.closest('tr').dataset.index, 10));
        });

        if (indicesToDelete.length === 0) return;

        indicesToDelete.sort((a, b) => b - a).forEach(index => {
            allData[activeCategory].data.splice(index, 1);
        });

        renderTable();
    }

    // --- 6. SAVE TO SERVER ---
    function escapeXml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    window.saveActiveCategory = async () => {
        if (!activeCategory) return;

        let content = '';
        const { type, data } = allData[activeCategory];

        if ((type === 'xml' || type === 'xml-grouped') && activeCategoryMetadata) {
            const { rootTag, nodeName } = activeCategoryMetadata;
            content = `<?xml version="1.0" encoding="utf-8"?>\\n<${rootTag}>\\n`;
            data.forEach(item => {
                let attrs = Object.entries(item.attributes).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(' ');
                if (item.children && item.children.length > 0) {
                    content += `  <${nodeName} ${attrs}>\\n`;
                    item.children.forEach(child => {
                        let childAttrs = Object.entries(child.attributes).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(' ');
                        content += `    <${child.tagName} ${childAttrs}/>\\n`;
                    });
                    content += `  </${nodeName}>\\n`;
                } else {
                    content += `  <${nodeName} ${attrs}/>\\n`;
                }
            });
            content += `</${rootTag}>\\n`;
        } else if (type === 'ini') {
            data.forEach(section => {
                content += `[${section.attributes.Section}]\\n`;
                Object.entries(section.attributes).forEach(([key, value]) => {
                    if (key !== 'Section') {
                        content += `${key}=${value}\\n`;
                    }
                });
                content += '\\n';
            });
        }

        try {
            const response = await fetch('/api/save-event-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: activeCategory, content }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            alert(`${activeCategory} saved successfully!`);
        } catch (error) {
            console.error(`Failed to save ${activeCategory}:`, error);
            alert(`Failed to save ${activeCategory}. See console for details.`);
        }
    };

    // --- KICK IT OFF ---
    initialize();
});
