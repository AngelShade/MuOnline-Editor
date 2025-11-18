document.addEventListener('DOMContentLoaded', () => {
    const eventListContainer = document.getElementById('event-list');
    const saveButton = document.getElementById('save-events');
    let events = []; // This will hold our array of event objects
    let originalXmlContent = '';

    // --- 1. Fetch and Render ---
    fetch('/api/event-data')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            console.log('API response received');
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            originalXmlContent = data.eventDataXml;
            events = parseEventXml(data.eventDataXml);
            console.log('Events parsed:', events);
            renderEventEditor();
            console.log('Event editor rendered');
        })
        .catch(error => {
            console.error('Error fetching event data:', error);
            eventListContainer.innerHTML = `<p style="color: var(--accent-pink);">Error loading event data. Please check the server logs.</p>`;
        });

    // --- 2. XML Parsing ---
    function parseEventXml(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const parsedEvents = [];

        // Handle standard <Event> nodes
        xmlDoc.querySelectorAll('Event').forEach(node => {
            parsedEvents.push({
                type: 'Event',
                id: node.getAttribute('id'),
                name: node.getAttribute('name'),
                start_time: node.getAttribute('start_time'),
                duration: node.getAttribute('duration'),
                enabled: node.getAttribute('enabled') === 'true'
            });
        });

        return parsedEvents;
    }

    // --- 3. UI Rendering ---
    function renderEventEditor() {
        eventListContainer.innerHTML = ''; // Clear previous content

        if (events.length === 0) {
            eventListContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No Events Found</h3>
                    <p>There are no events configured yet. Add one to get started.</p>
                </div>`;
        } else {
            events.forEach((event, index) => {
                const eventCard = document.createElement('div');
                eventCard.className = 'module-card glass-effect';
                eventCard.innerHTML = `
                    <div class="form-grid" data-index="${index}">
                        <div class="form-group">
                            <label>Event Name</label>
                            <input type="text" class="inline-input" data-property="name" value="${event.name || ''}">
                        </div>
                        <div class="form-group">
                            <label>Start Time (HH:MM)</label>
                            <input type="text" class="inline-input" data-property="start_time" value="${event.start_time || ''}" placeholder="e.g., 14:30">
                        </div>
                        <div class="form-group">
                            <label>Duration (minutes)</label>
                            <input type="number" class="inline-input" data-property="duration" value="${event.duration || '0'}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Enabled</label>
                            <input type="checkbox" data-property="enabled" ${event.enabled ? 'checked' : ''}>
                        </div>
                        <div class="form-group full-width" style="text-align: right;">
                            <button class="btn btn-danger btn-sm" data-index="${index}"><i data-lucide="trash-2"></i> Remove</button>
                        </div>
                    </div>`;
                eventListContainer.appendChild(eventCard);
            });
        }

        // Add "Add New Event" button
        const addEventButton = document.createElement('button');
        addEventButton.innerHTML = '<i data-lucide="plus"></i> Add New Event';
        addEventButton.className = 'btn btn-primary';
        addEventButton.style.marginTop = '20px';
        eventListContainer.appendChild(addEventButton);

        lucide.createIcons();
        addEventListeners();
    }

    // --- 4. Event Listeners ---
    function addEventListeners() {
        // Add event listener for the "Add New Event" button
        eventListContainer.querySelector('.btn-primary').addEventListener('click', () => {
            const newId = events.length > 0 ? Math.max(...events.map(e => parseInt(e.id))) + 1 : 1;
            events.push({
                type: 'Event',
                id: newId.toString(),
                name: 'New Event',
                start_time: '00:00',
                duration: '10',
                enabled: false
            });
            renderEventEditor();
        });

        // Add listeners for removing events
        eventListContainer.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                events.splice(index, 1);
                renderEventEditor();
            });
        });

        // Add listeners for input changes
        eventListContainer.querySelectorAll('.inline-input, input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.closest('.form-grid').dataset.index, 10);
                const property = e.target.dataset.property;

                if (e.target.type === 'checkbox') {
                    events[index][property] = e.target.checked;
                } else {
                    events[index][property] = e.target.value;
                }
            });
        });
    }

    // --- 5. Save Logic ---
    saveButton.addEventListener('click', () => {
        const newXmlContent = generateXmlFromData();

        if (newXmlContent === originalXmlContent) {
            alert('No changes to save.');
            return;
        }

        fetch('/api/save-event-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newXmlContent: newXmlContent }),
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(() => {
            alert('Event data saved successfully!');
            originalXmlContent = newXmlContent; // Update original content after successful save
        })
        .catch(error => {
            console.error('Error saving event data:', error);
            alert('Error saving event data. Please check the console for details.');
        });
    });

    // --- 6. Data to XML Generation ---
    function generateXmlFromData() {
        let xmlString = '<?xml version="1.0" encoding="utf-8"?>\n<Events>\n';

        events.forEach(event => {
            if (event.type === 'Event') {
                xmlString += `    <Event id="${event.id}" name="${event.name}" start_time="${event.start_time}" duration="${event.duration}" enabled="${event.enabled}" />\n`;
            }
        });

        xmlString += '</Events>';
        return xmlString;
    }
});
