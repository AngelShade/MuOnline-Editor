document.addEventListener('DOMContentLoaded', () => {
    const eventTableBody = document.querySelector('#event-table tbody');
    const editForm = document.getElementById('edit-form');
    const addButton = document.getElementById('add-button');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');

    let events = [];

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            events = await response.json();
            renderEvents();
        } catch (error) {
            console.error(error);
            alert('Failed to fetch events. See console for details.');
        }
    };

    const renderEvents = () => {
        eventTableBody.innerHTML = '';
        events.forEach((event, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.id}</td>
                <td>${event.name}</td>
                <td>${event.start_time}</td>
                <td>${event.duration}</td>
                <td>${event.enabled}</td>
                <td>
                    <button class="edit-button" data-index="${index}">Edit</button>
                    <button class="delete-button" data-index="${index}">Delete</button>
                </td>
            `;
            eventTableBody.appendChild(row);
        });
    };

    const showEditForm = (event, index) => {
        document.getElementById('edit-index').value = index;
        document.getElementById('edit-id').value = event.id;
        document.getElementById('edit-name').value = event.name;
        document.getElementById('edit-start-time').value = event.start_time;
        document.getElementById('edit-duration').value = event.duration;
        document.getElementById('edit-enabled').checked = event.enabled;
        editForm.style.display = 'block';
    };

    const hideEditForm = () => {
        editForm.style.display = 'none';
    };

    const saveAllEvents = async () => {
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(events),
            });

            if (!response.ok) {
                throw new Error('Failed to save events');
            }

            hideEditForm();
            renderEvents();
        } catch (error) {
            console.error(error);
            alert('Failed to save events. See console for details.');
        }
    };

    const saveEvent = () => {
        const index = document.getElementById('edit-index').value;
        const event = {
            id: document.getElementById('edit-id').value,
            name: document.getElementById('edit-name').value,
            start_time: document.getElementById('edit-start-time').value,
            duration: document.getElementById('edit-duration').value,
            enabled: document.getElementById('edit-enabled').checked,
        };

        if (index === '-1') {
            events.push(event);
        } else {
            events[index] = event;
        }

        saveAllEvents();
    };

    addButton.addEventListener('click', () => {
        showEditForm({ id: '', name: '', start_time: '', duration: '', enabled: false }, -1);
    });

    saveButton.addEventListener('click', saveEvent);
    cancelButton.addEventListener('click', hideEditForm);

    eventTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-button')) {
            const index = e.target.dataset.index;
            showEditForm(events[index], index);
        }

        if (e.target.classList.contains('delete-button')) {
            const index = e.target.dataset.index;
            events.splice(index, 1);
            saveAllEvents();
        }
    });

    fetchEvents();
});