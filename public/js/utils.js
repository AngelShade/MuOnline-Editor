// Shared utility functions

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

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

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

function renderAuthorControls() {
    const authorName = localStorage.getItem('spawnEditorAuthor') || 'Unknown';
    document.getElementById('authorNameDisplay').textContent = authorName;
    document.getElementById('authorNameInput').value = authorName;
    toggleAuthorEdit(false);
    lucide.createIcons();
}

function toggleAuthorEdit(isEditing) {
    document.getElementById('authorDisplayView').style.display = isEditing ? 'none' : 'flex';
    document.getElementById('authorEditView').style.display = isEditing ? 'flex' : 'none';
    if (isEditing) {
        document.getElementById('authorNameInput').focus();
    }
}

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

function getAuthorName() { return localStorage.getItem('spawnEditorAuthor') || 'Unknown Editor'; }

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
