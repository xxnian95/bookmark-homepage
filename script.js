// Bookmark data structure
let bookmarks = [];
let currentPath = [];
let editingItem = null;
let fileName = 'bookmarks.json';
const STORAGE_KEY = 'homepageBookmarks';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadBookmarks();
    renderNavigation();
    
    // Add some default bookmarks if empty
    if (bookmarks.length === 0) {
        addDefaultBookmarks();
        saveBookmarks();
    }
    
    updateFileStatus();
    
    // Refresh all icons on page load
    refreshAllIcons();
});

// Load bookmarks from localStorage
function loadBookmarks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            bookmarks = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading bookmarks from localStorage:', e);
        }
    }
}

// Save bookmarks to localStorage
function saveBookmarks() {
    try {
        const data = JSON.stringify(bookmarks, null, 2);
        localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
        console.error('Error saving bookmarks to localStorage:', e);
        alert('Error saving bookmarks. Storage may be full.');
    }
}

// Export bookmarks to file (download)
function exportBookmarks() {
    try {
        const data = JSON.stringify(bookmarks, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        // Small delay before cleanup to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        showFileStatus('Bookmarks exported successfully', 'success');
    } catch (e) {
        console.error('Error exporting bookmarks:', e);
        showFileStatus('Error exporting bookmarks', 'error');
    }
}

// Add default bookmarks
function addDefaultBookmarks() {
    bookmarks = [
        { id: '1', name: 'Google', url: 'https://www.google.com', type: 'bookmark', parent: '' },
        { id: '2', name: 'GitHub', url: 'https://www.github.com', type: 'bookmark', parent: '' },
        { id: '3', name: 'Development', type: 'folder', parent: '', children: [] },
        { id: '4', name: 'Stack Overflow', url: 'https://stackoverflow.com', type: 'bookmark', parent: '3' },
        { id: '5', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'bookmark', parent: '3' }
    ];
    saveBookmarks();
}

// Setup event listeners
function setupEventListeners() {
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportBookmarks);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileImport);
    
    // Management modal
    document.getElementById('manageBtn').addEventListener('click', () => {
        document.getElementById('manageModal').classList.add('active');
        renderBookmarkTree();
    });
    
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('manageModal').classList.remove('active');
    });
    
    // Bookmark modal
    document.getElementById('addBookmarkBtn').addEventListener('click', () => {
        editingItem = null;
        document.getElementById('bookmarkModalTitle').textContent = 'Add Bookmark';
        document.getElementById('bookmarkForm').reset();
        document.getElementById('bookmarkUrl').style.display = 'block';
        document.querySelector('label[for="bookmarkUrl"]').style.display = 'block';
        populateParentSelect();
        document.getElementById('bookmarkModal').classList.add('active');
    });
    
    document.getElementById('addFolderBtn').addEventListener('click', () => {
        editingItem = null;
        document.getElementById('bookmarkModalTitle').textContent = 'Add Folder';
        document.getElementById('bookmarkForm').reset();
        document.getElementById('bookmarkUrl').style.display = 'none';
        document.querySelector('label[for="bookmarkUrl"]').style.display = 'none';
        populateParentSelect();
        document.getElementById('bookmarkModal').classList.add('active');
    });
    
    document.getElementById('closeBookmarkModal').addEventListener('click', () => {
        document.getElementById('bookmarkModal').classList.remove('active');
    });
    
    document.getElementById('cancelBookmarkBtn').addEventListener('click', () => {
        document.getElementById('bookmarkModal').classList.remove('active');
    });
    
    // Bookmark form submission
    document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBookmarkItem();
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const manageModal = document.getElementById('manageModal');
        const bookmarkModal = document.getElementById('bookmarkModal');
        if (e.target === manageModal) {
            manageModal.classList.remove('active');
        }
        if (e.target === bookmarkModal) {
            bookmarkModal.classList.remove('active');
        }
    });
}

// Render navigation panes
function renderNavigation() {
    // Clear all panes
    for (let i = 1; i <= 3; i++) {
        const list = document.getElementById(`list${i}`);
        const pane = document.getElementById(`pane${i}`);
        list.innerHTML = '';
        pane.style.display = 'none';
        pane.classList.remove('active');
    }
    
    // Show first pane with root items
    const rootItems = getItemsByParent('');
    renderList(1, rootItems, 'Bookmarks');
    document.getElementById('pane1').style.display = 'block';
    document.getElementById('pane1').classList.add('active');
}

// Get items by parent
function getItemsByParent(parentId) {
    return bookmarks.filter(item => item.parent === parentId);
}

// Get favicon URL for a bookmark
function getFaviconUrl(url, useCacheBust = true) {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Use Google's favicon service
        // Add timestamp for cache-busting if requested
        const cacheBust = useCacheBust ? `&t=${Date.now()}` : '';
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32${cacheBust}`;
    } catch (e) {
        // If URL parsing fails, try to extract domain manually
        const match = url.match(/https?:\/\/([^\/]+)/);
        if (match) {
            const domain = match[1];
            const cacheBust = useCacheBust ? `&t=${Date.now()}` : '';
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32${cacheBust}`;
        }
        return '';
    }
}

// Refresh all icons on the page
async function refreshAllIcons() {
    const bookmarkItems = bookmarks.filter(item => item.type === 'bookmark' && item.url);
    
    if (bookmarkItems.length === 0) return;
    
    // Refresh icons with a small delay between requests to avoid rate limiting
    for (const item of bookmarkItems) {
        await refreshIconForBookmark(item);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Refresh icon for a specific bookmark
async function refreshIconForBookmark(item) {
    if (!item || !item.url) return;
    
    const newIconUrl = getFaviconUrl(item.url, true); // Use cache-busting
    
    // Find all icon elements for this bookmark
    const iconElements = document.querySelectorAll(`img.bookmark-icon[data-domain="${item.url}"]`);
    
    if (iconElements.length === 0) return;
    
    // Test if the new icon URL loads successfully
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load icon'));
            img.src = newIconUrl;
            
            // Timeout after 3 seconds
            setTimeout(() => reject(new Error('Timeout')), 3000);
        });
        
        // If successful, update all matching icons
        iconElements.forEach(imgEl => {
            if (imgEl.src !== newIconUrl) {
                imgEl.src = newIconUrl;
            }
        });
    } catch (e) {
        // Icon failed to load, keep the existing one
        console.log(`Failed to refresh icon for ${item.url}:`, e.message);
    }
}

// Render a list in a pane
function renderList(level, items, title) {
    const list = document.getElementById(`list${level}`);
    const pane = document.getElementById(`pane${level}`);
    const paneTitle = pane.querySelector('h2');
    
    paneTitle.textContent = title || 'Bookmarks';
    list.innerHTML = '';
    
    if (items.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'drop-zone-empty';
        emptyLi.textContent = 'No items (drop here to add)';
        emptyLi.style.padding = '20px';
        emptyLi.style.color = '#999';
        emptyLi.style.textAlign = 'center';
        emptyLi.dataset.parent = getCurrentParentId(level);
        setupDropZone(emptyLi, level);
        list.appendChild(emptyLi);
        return;
    }
    
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `bookmark-item ${item.type}`;
        li.dataset.id = item.id;
        li.draggable = true;
        
        if (item.type === 'folder') {
            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="folder-icon">📁</span>
                <span class="item-content">${item.name}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="editItem('${item.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
                </div>
            `;
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.actions') && !e.target.closest('.drag-handle')) {
                    navigateToFolder(item, level);
                }
            });
        } else {
            const iconUrl = getFaviconUrl(item.url);
            const defaultIcon = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23999%27 d=%27M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z%27/%3E%3C/svg%3E';
            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <img src="${iconUrl}" alt="" class="bookmark-icon" data-domain="${item.url}" onerror="this.onerror=null; this.src='${defaultIcon}';" loading="lazy">
                <a href="${item.url}" target="_blank">
                    <span>${item.name}</span>
                </a>
                <div class="actions">
                    <button class="edit-btn" onclick="event.stopPropagation(); editItem('${item.id}')">Edit</button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteItem('${item.id}')">Delete</button>
                </div>
            `;
        }
        
        setupDragAndDrop(li, item, level);
        list.appendChild(li);
    });
}

// Get current parent ID for a level
function getCurrentParentId(level) {
    if (level === 1) return '';
    // Find the parent based on current path
    const parentLevel = level - 1;
    const parentPane = document.getElementById(`pane${parentLevel}`);
    if (parentPane && parentPane.dataset.currentFolderId) {
        return parentPane.dataset.currentFolderId;
    }
    return '';
}

// Setup drag and drop for an item
function setupDragAndDrop(element, item, level) {
    const parentId = getCurrentParentId(level);
    
    // Drag start
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: item.id,
            type: item.type,
            currentParent: item.parent || parentId
        }));
        element.classList.add('dragging');
        e.stopPropagation();
    });
    
    // Drag end
    element.addEventListener('dragend', (e) => {
        element.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drop-zone'));
    });
    
    // Make it a drop zone
    setupDropZone(element, level, item);
}

// Setup drop zone
function setupDropZone(element, level, item = null) {
    const parentId = item ? item.parent || getCurrentParentId(level) : getCurrentParentId(level);
    
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Check if we have the right data type
        if (!e.dataTransfer.types.includes('application/json')) {
            return;
        }
        
        // We can't read data in dragover, but we can show visual feedback
        // Validation will happen in drop handler
        element.classList.add('drag-over');
        if (item && item.type === 'folder') {
            element.classList.add('drop-zone');
        }
    });
    
    element.addEventListener('dragleave', (e) => {
        element.classList.remove('drag-over', 'drop-zone');
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        element.classList.remove('drag-over', 'drop-zone');
        
        const dragData = e.dataTransfer.getData('application/json');
        if (!dragData) return;
        
        try {
            const draggedItem = JSON.parse(dragData);
            const draggedItemObj = bookmarks.find(b => b.id === draggedItem.id);
            
            if (!draggedItemObj) return;
            
            // Determine new parent
            let newParent = parentId || '';
            if (item && item.type === 'folder') {
                newParent = item.id;
            }
            
            // Don't allow moving to itself or its descendants
            if (item && item.id === draggedItemObj.id) {
                return;
            }
            if (item && item.type === 'folder' && isDescendant(item.id, draggedItemObj.id)) {
                alert('Cannot move a folder into itself or its descendants');
                return;
            }
            
            // Update parent
            draggedItemObj.parent = newParent;
            
            saveBookmarks();
            renderNavigation();
            
            // If we're in management modal, refresh it too
            if (document.getElementById('manageModal').classList.contains('active')) {
                renderBookmarkTree();
            }
        } catch (e) {
            console.error('Error handling drop:', e);
        }
    });
}

// Navigate to a folder
function navigateToFolder(folder, currentLevel) {
    if (currentLevel >= 3) {
        alert('Maximum depth of 3 levels reached');
        return;
    }
    
    // Update current path
    currentPath = currentPath.slice(0, currentLevel - 1);
    currentPath.push(folder);
    
    // Hide panes beyond current level
    for (let i = currentLevel + 1; i <= 3; i++) {
        const pane = document.getElementById(`pane${i}`);
        pane.style.display = 'none';
        pane.classList.remove('active');
        pane.dataset.currentFolderId = '';
    }
    
    // Show next pane
    const nextLevel = currentLevel + 1;
    const nextPane = document.getElementById(`pane${nextLevel}`);
    const children = getItemsByParent(folder.id);
    
    nextPane.dataset.currentFolderId = folder.id;
    renderList(nextLevel, children, folder.name);
    nextPane.style.display = 'block';
    nextPane.classList.add('active');
    
    // Update active state
    document.getElementById(`pane${currentLevel}`).classList.remove('active');
}

// Populate parent select dropdown
function populateParentSelect() {
    const select = document.getElementById('bookmarkParent');
    select.innerHTML = '<option value="">Root</option>';
    
    function addFolderOptions(folders, prefix = '') {
        folders.forEach(folder => {
            if (folder.type === 'folder') {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = prefix + folder.name;
                // Don't allow selecting the item being edited or its children
                if (editingItem && (editingItem.id === folder.id || isDescendant(editingItem.id, folder.id))) {
                    option.disabled = true;
                }
                select.appendChild(option);
                
                const children = getItemsByParent(folder.id);
                const folderChildren = children.filter(item => item.type === 'folder');
                if (folderChildren.length > 0) {
                    addFolderOptions(folderChildren, prefix + folder.name + ' / ');
                }
            }
        });
    }
    
    const rootFolders = getItemsByParent('').filter(item => item.type === 'folder');
    addFolderOptions(rootFolders);
    
    // Set current parent if editing
    if (editingItem) {
        select.value = editingItem.parent || '';
    }
}

// Check if an item is a descendant of another
function isDescendant(itemId, ancestorId) {
    const item = bookmarks.find(b => b.id === itemId);
    if (!item || !item.parent) return false;
    if (item.parent === ancestorId) return true;
    return isDescendant(item.parent, ancestorId);
}

// Render bookmark tree in management modal
function renderBookmarkTree() {
    const tree = document.getElementById('bookmarkTree');
    tree.innerHTML = '';
    
    function renderTreeItems(items, parentElement, level = 0) {
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'tree-item ' + item.type;
            div.style.paddingLeft = `${level * 20 + 10}px`;
            div.dataset.id = item.id;
            div.draggable = true;
            
            const content = document.createElement('div');
            content.className = 'tree-item-content';
            
            if (item.type === 'folder') {
                content.innerHTML = `<span class="drag-handle">☰</span> <span class="folder-icon">📁</span> <strong>${item.name}</strong>`;
            } else {
                const iconUrl = getFaviconUrl(item.url);
                const defaultIcon = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23999%27 d=%27M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z%27/%3E%3C/svg%3E';
                content.innerHTML = `<span class="drag-handle">☰</span> <img src="${iconUrl}" alt="" class="bookmark-icon" data-domain="${item.url}" onerror="this.onerror=null; this.src='${defaultIcon}';" loading="lazy"> <a href="${item.url}" target="_blank">${item.name}</a>`;
            }
            
            const actions = document.createElement('div');
            actions.className = 'tree-item-actions';
            actions.innerHTML = `
                <button class="edit-btn" onclick="editItem('${item.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
            `;
            
            div.appendChild(content);
            div.appendChild(actions);
            
            // Setup drag and drop for tree items
            setupTreeDragAndDrop(div, item, level);
            
            parentElement.appendChild(div);
            
            if (item.type === 'folder') {
                const children = getItemsByParent(item.id);
                if (children.length > 0) {
                    renderTreeItems(children, parentElement, level + 1);
                }
            }
        });
    }
    
    const rootItems = getItemsByParent('');
    if (rootItems.length === 0) {
        tree.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No bookmarks yet. Add some to get started!</p>';
    } else {
        renderTreeItems(rootItems, tree);
    }
}

// Setup drag and drop for tree items in management modal
function setupTreeDragAndDrop(element, item, level) {
    const parentId = item.parent || '';
    
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: item.id,
            type: item.type,
            currentParent: parentId
        }));
        element.classList.add('dragging');
    });
    
    element.addEventListener('dragend', (e) => {
        element.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drop-zone'));
    });
    
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Check if we have the right data type
        if (!e.dataTransfer.types.includes('application/json')) {
            return;
        }
        
        // We can't read data in dragover, but we can show visual feedback
        // Validation will happen in drop handler
        element.classList.add('drag-over');
        if (item.type === 'folder') {
            element.classList.add('drop-zone');
        }
    });
    
    element.addEventListener('dragleave', (e) => {
        element.classList.remove('drag-over', 'drop-zone');
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        element.classList.remove('drag-over', 'drop-zone');
        
        const dragData = e.dataTransfer.getData('application/json');
        if (!dragData) return;
        
        try {
            const draggedItem = JSON.parse(dragData);
            const draggedItemObj = bookmarks.find(b => b.id === draggedItem.id);
            
            if (!draggedItemObj) return;
            
            let newParent = '';
            if (item.type === 'folder') {
                newParent = item.id;
            } else {
                // If dropping on a non-folder, use its parent
                newParent = item.parent || '';
            }
            
            if (item.id === draggedItemObj.id) {
                return;
            }
            if (item.type === 'folder' && isDescendant(item.id, draggedItemObj.id)) {
                alert('Cannot move a folder into itself or its descendants');
                return;
            }
            
            draggedItemObj.parent = newParent;
            
            saveBookmarks();
            renderBookmarkTree();
            renderNavigation();
        } catch (e) {
            console.error('Error handling drop:', e);
        }
    });
}

// Save bookmark item
async function saveBookmarkItem() {
    const name = document.getElementById('bookmarkName').value.trim();
    const url = document.getElementById('bookmarkUrl').value.trim();
    const parent = document.getElementById('bookmarkParent').value;
    const isFolder = document.getElementById('bookmarkModalTitle').textContent.includes('Folder');
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    if (!isFolder && !url) {
        alert('Please enter a URL');
        return;
    }
    
    if (editingItem) {
        // Update existing item
        editingItem.name = name;
        if (!isFolder) {
            editingItem.url = url;
        }
        editingItem.parent = parent;
    } else {
        // Create new item
        const newItem = {
            id: Date.now().toString(),
            name: name,
            type: isFolder ? 'folder' : 'bookmark',
            parent: parent || ''
        };
        
        if (!isFolder) {
            newItem.url = url;
        }
        
        bookmarks.push(newItem);
    }
    
    saveBookmarks();
    renderNavigation();
    renderBookmarkTree();
    document.getElementById('bookmarkModal').classList.remove('active');
}

// Edit item
function editItem(id) {
    editingItem = bookmarks.find(b => b.id === id);
    if (!editingItem) return;
    
    const isFolder = editingItem.type === 'folder';
    document.getElementById('bookmarkModalTitle').textContent = `Edit ${isFolder ? 'Folder' : 'Bookmark'}`;
    document.getElementById('bookmarkName').value = editingItem.name;
    
    if (isFolder) {
        document.getElementById('bookmarkUrl').style.display = 'none';
        document.querySelector('label[for="bookmarkUrl"]').style.display = 'none';
    } else {
        document.getElementById('bookmarkUrl').style.display = 'block';
        document.querySelector('label[for="bookmarkUrl"]').style.display = 'block';
        document.getElementById('bookmarkUrl').value = editingItem.url || '';
    }
    
    populateParentSelect();
    document.getElementById('bookmarkModal').classList.add('active');
}

// Delete item
function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item? This will also delete all its children.')) {
        return;
    }
    
    function deleteRecursive(itemId) {
        const children = getItemsByParent(itemId);
        children.forEach(child => {
            deleteRecursive(child.id);
        });
        bookmarks = bookmarks.filter(b => b.id !== itemId);
    }
    
    deleteRecursive(id);
    saveBookmarks();
    renderNavigation();
    renderBookmarkTree();
}

// Import bookmarks from file
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const importedBookmarks = JSON.parse(text);
        
        // Validate the imported data
        if (!Array.isArray(importedBookmarks)) {
            throw new Error('Invalid bookmark file format');
        }
        
        // Ask for confirmation if there are existing bookmarks
        if (bookmarks.length > 0) {
            if (!confirm('This will replace all existing bookmarks. Continue?')) {
                event.target.value = '';
                return;
            }
        }
        
        bookmarks = importedBookmarks;
        saveBookmarks();
        renderNavigation();
        showFileStatus(`Bookmarks imported successfully from ${file.name}`, 'success');
    } catch (e) {
        console.error('Error importing bookmarks:', e);
        showFileStatus('Error importing bookmarks. Please check the file format.', 'error');
    }
    
    // Reset input
    event.target.value = '';
}

function updateFileStatus() {
    const statusEl = document.getElementById('fileStatus');
    const count = bookmarks.length;
    statusEl.textContent = `Bookmarks stored in browser (${count} item${count !== 1 ? 's' : ''})`;
    statusEl.className = 'file-status active';
}

function showFileStatus(message, type = 'info') {
    const statusEl = document.getElementById('fileStatus');
    statusEl.textContent = message;
    statusEl.className = `file-status ${type}`;
    setTimeout(() => {
        updateFileStatus();
    }, 3000);
}

// Make functions available globally for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
