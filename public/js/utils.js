// Shared utility functions

/**
 * Displays a confirmation modal with a specified title, message, and action.
 * @param {string} title - The title of the confirmation modal.
 * @param {string} message - The message to display in the modal body.
 * @param {function} onConfirm - The callback function to execute when the confirm button is clicked.
 * @param {string} [buttonClass='btn-danger'] - The CSS class for the confirm button.
 */
function confirmAction(title, message, onConfirm, buttonClass = 'btn-danger') {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.className = `btn ${buttonClass}`;
    confirmButton.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
    document.getElementById('confirmModal').classList.add('show');
    lucide.createIcons();
}

/**
 * Closes the confirmation modal.
 */
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

/**
 * Initializes the author lock feature. If an author name is found in local storage,
 * it renders the author controls and loads data. Otherwise, it displays a modal to
 * prompt for the author's name.
 */
function initializeAuthorLock() {
    const authorName = localStorage.getItem('spawnEditorAuthor');
    if (authorName && authorName.trim() !== '') {
        renderAuthorControls();
        loadData();
    } else {
        document.getElementById('authorModal').classList.add('show');
        lucide.createIcons();
    }
}

/**
 * Saves the initial author name from the author modal to local storage.
 */
function saveInitialAuthorName() {
    const authorInput = document.getElementById('initialAuthorName');
    const authorName = authorInput.value.trim();
    if (authorName) {
        localStorage.setItem('spawnEditorAuthor', authorName);
        document.getElementById('authorModal').classList.remove('show');
        renderAuthorControls();
        loadData();
    }
}

/**
 * Renders the author controls, displaying the author's name and setting up the edit functionality.
 */
function renderAuthorControls() {
    const authorName = localStorage.getItem('spawnEditorAuthor') || 'Unknown';
    document.getElementById('authorNameDisplay').textContent = authorName;
    document.getElementById('authorNameInput').value = authorName;
    toggleAuthorEdit(false);
    lucide.createIcons();
}

/**
 * Toggles the author display between view and edit mode.
 * @param {boolean} isEditing - True to switch to edit mode, false to switch to view mode.
 */
function toggleAuthorEdit(isEditing) {
    document.getElementById('authorDisplayView').style.display = isEditing ? 'none' : 'flex';
    document.getElementById('authorEditView').style.display = isEditing ? 'flex' : 'none';
    if (isEditing) {
        document.getElementById('authorNameInput').focus();
    }
}

/**
 * Saves the updated author name from the edit input to local storage.
 */
function saveAuthorName() {
    const authorName = document.getElementById('authorNameInput').value.trim();
    if (authorName) {
        localStorage.setItem('spawnEditorAuthor', authorName);
        renderAuthorControls();
        const displayName = document.getElementById('authorNameDisplay');
        displayName.style.transition = 'none';
        displayName.style.backgroundColor = 'rgba(0, 255, 155, 0.2)';
        setTimeout(() => {
            displayName.style.transition = 'background-color 0.5s ease';
            displayName.style.backgroundColor = 'transparent';
        }, 100);
    } else {
        showStatus("Author name cannot be empty.", true);
    }
}

/**
 * Retrieves the author's name from local storage.
 * @returns {string} The author's name, or 'Unknown Editor' if not set.
 */
function getAuthorName() { return localStorage.getItem('spawnEditorAuthor') || 'Unknown Editor'; }

/**
 * Displays a status message at the bottom of the page.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - True to display an error message style.
 * @param {boolean} [isWarning=false] - True to display a warning message style.
 * @param {boolean} [isInfo=false] - True to display an info message style.
 * @param {object[]} [controls=null] - An array of control objects to add to the status bar, each with `text`, `className`, and `onClick` properties.
 */
function showStatus(message, isError = false, isWarning = false, isInfo = false, controls = null) {
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = ''; // Clear previous content

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    statusBar.appendChild(messageEl);

    let typeClass = 'status-bar-success';
    if (isError) typeClass = 'status-bar-error';
    else if (isWarning) typeClass = 'status-bar-warning';
    else if (isInfo) typeClass = 'status-bar-info';

    statusBar.className = `status-bar ${typeClass}`;
    statusBar.style.display = 'block';

    if (controls) {
        const controlsEl = document.createElement('div');
        controlsEl.className = 'status-bar-controls';
        controls.forEach(control => {
            const btn = document.createElement('button');
            btn.textContent = control.text;
            btn.className = control.className;
            btn.onclick = control.onClick;
            controlsEl.appendChild(btn);
            lucide.createIcons(); // To render icons if any
        });
        statusBar.appendChild(controlsEl);
    } else {
        setTimeout(() => { statusBar.style.display = 'none'; }, 5000);
    }
}

/**
 * Displays a confirmation modal to clear local storage for a given key.
 * @param {string} cacheKey - The local storage key to remove.
 */
function confirmClearCache(cacheKey) {
    confirmAction(
        'Clear Local Cache?',
        'This will delete all your unsaved local changes and reload the latest data from the server. This action cannot be undone.',
        () => {
            localStorage.removeItem(cacheKey);
            showStatus('Local cache cleared. Reloading from server...', false, false, true);
            location.reload();
        }
    );
}
