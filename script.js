// Bookmark data structure
let bookmarks = [];
let currentPath = [];
let editingItem = null;
let fileName = 'bookmarks.json';
let searchQuery = '';
const STORAGE_KEY = 'homepageBookmarks';
const SETTINGS_KEY = 'homepageSettings';
const NAVIGATION_STATE_KEY = 'homepageNavigationState';

// Default settings
const DEFAULT_SETTINGS = {
    fontSize: 16,
    itemGap: 8
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applySettings();
    setupEventListeners();
    loadBookmarks();
    
    // Restore navigation state before rendering
    restoreNavigationState();
    renderNavigation();
    
    // Add some default bookmarks if empty
    if (bookmarks.length === 0) {
        addDefaultBookmarks();
        saveBookmarks();
    }
    
    updateFileStatus();
    
    // Save navigation state before page unload (when clicking bookmarks)
    window.addEventListener('beforeunload', () => {
        saveNavigationState();
    });
    
    // Also save state periodically as backup
    setInterval(() => {
        saveNavigationState();
    }, 5000); // Save every 5 seconds
});

// Load bookmarks from localStorage
function loadBookmarks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            bookmarks = JSON.parse(stored);
            // Ensure all bookmarks have required fields (for backward compatibility)
            bookmarks.forEach((bookmark, index) => {
                if (bookmark.accessTime === undefined) {
                    bookmark.accessTime = 0;
                }
                if (bookmark.order === undefined) {
                    bookmark.order = index;
                }
            });
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

// Load settings from localStorage
function loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading settings from localStorage:', e);
        }
    }
    return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving settings to localStorage:', e);
        alert('Error saving settings. Storage may be full.');
    }
}

// Apply settings to the page
function applySettings() {
    const settings = loadSettings();
    const root = document.documentElement;
    root.style.setProperty('--bookmark-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--bookmark-item-gap', `${settings.itemGap}px`);
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
        { id: '1', name: 'Google', url: 'https://www.google.com', type: 'bookmark', parent: '', accessTime: 0, order: 0 },
        { id: '2', name: 'GitHub', url: 'https://www.github.com', type: 'bookmark', parent: '', accessTime: 0, order: 1 },
        { id: '3', name: 'Development', type: 'folder', parent: '', children: [], order: 2 },
        { id: '4', name: 'Stack Overflow', url: 'https://stackoverflow.com', type: 'bookmark', parent: '3', accessTime: 0, order: 0 },
        { id: '5', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'bookmark', parent: '3', accessTime: 0, order: 1 }
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
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchQuery) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderNavigation();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        // Restore navigation state when clearing search
        restoreNavigationState();
        renderNavigation();
    });
    
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
        // Hide delete button when adding
        document.getElementById('deleteBookmarkBtn').style.display = 'none';
        populateParentSelect();
        document.getElementById('bookmarkModal').classList.add('active');
    });
    
    document.getElementById('addFolderBtn').addEventListener('click', () => {
        editingItem = null;
        document.getElementById('bookmarkModalTitle').textContent = 'Add Folder';
        document.getElementById('bookmarkForm').reset();
        document.getElementById('bookmarkUrl').style.display = 'none';
        document.querySelector('label[for="bookmarkUrl"]').style.display = 'none';
        // Hide delete button when adding
        document.getElementById('deleteBookmarkBtn').style.display = 'none';
        populateParentSelect();
        document.getElementById('bookmarkModal').classList.add('active');
    });
    
    document.getElementById('closeBookmarkModal').addEventListener('click', () => {
        document.getElementById('bookmarkModal').classList.remove('active');
    });
    
    document.getElementById('cancelBookmarkBtn').addEventListener('click', () => {
        document.getElementById('bookmarkModal').classList.remove('active');
    });
    
    // Delete button in edit modal
    document.getElementById('deleteBookmarkBtn').addEventListener('click', () => {
        if (editingItem) {
            if (confirm('Are you sure you want to delete this item? This will also delete all its children.')) {
                const itemId = editingItem.id;
                document.getElementById('bookmarkModal').classList.remove('active');
                deleteItem(itemId, true);
            }
        }
    });
    
    // Bookmark form submission
    document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBookmarkItem();
    });
    
    // Auto-fetch page title when URL is entered
    const urlInput = document.getElementById('bookmarkUrl');
    let titleFetchTimeout = null;
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const nameInput = document.getElementById('bookmarkName');
        
        // Clear previous timeout
        if (titleFetchTimeout) {
            clearTimeout(titleFetchTimeout);
        }
        
        // Only fetch if URL looks valid and name is empty
        if (url && !nameInput.value.trim() && (url.startsWith('http://') || url.startsWith('https://'))) {
            // Debounce: wait 500ms after user stops typing
            titleFetchTimeout = setTimeout(() => {
                fetchPageTitle(url, nameInput);
            }, 500);
        }
    });
    
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const settings = loadSettings();
        document.getElementById('fontSize').value = settings.fontSize;
        document.getElementById('itemGap').value = settings.itemGap;
        document.getElementById('settingsModal').classList.add('active');
    });
    
    document.getElementById('closeSettingsModal').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });
    
    document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });
    
    document.getElementById('resetSettingsBtn').addEventListener('click', () => {
        if (confirm('Reset settings to default values?')) {
            saveSettings(DEFAULT_SETTINGS);
            applySettings();
            const settings = loadSettings();
            document.getElementById('fontSize').value = settings.fontSize;
            document.getElementById('itemGap').value = settings.itemGap;
        }
    });
    
    // Settings form submission
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const itemGap = parseInt(document.getElementById('itemGap').value);
        
        if (fontSize < 10 || fontSize > 24) {
            alert('Font size must be between 10 and 24 pixels');
            return;
        }
        
        if (itemGap < 0 || itemGap > 20) {
            alert('Item gap must be between 0 and 20 pixels');
            return;
        }
        
        const settings = {
            fontSize: fontSize,
            itemGap: itemGap
        };
        
        saveSettings(settings);
        applySettings();
        document.getElementById('settingsModal').classList.remove('active');
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const manageModal = document.getElementById('manageModal');
        const bookmarkModal = document.getElementById('bookmarkModal');
        const settingsModal = document.getElementById('settingsModal');
        if (e.target === manageModal) {
            manageModal.classList.remove('active');
        }
        if (e.target === bookmarkModal) {
            bookmarkModal.classList.remove('active');
        }
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
}

// Maximum number of navigation levels supported
const MAX_LEVELS = 10;

// Render navigation panes
function renderNavigation() {
    // Clear all panes
    for (let i = 1; i <= MAX_LEVELS; i++) {
        const list = document.getElementById(`list${i}`);
        const pane = document.getElementById(`pane${i}`);
        if (list && pane) {
            list.innerHTML = '';
            pane.style.display = 'none';
            pane.classList.remove('active');
        }
    }
    
    // If searching, show search results
    if (searchQuery) {
        const searchResults = searchBookmarks(searchQuery);
        renderList(1, searchResults, `Search Results (${searchResults.length})`);
        const pane1 = document.getElementById('pane1');
        if (pane1) {
            pane1.style.display = 'block';
            pane1.classList.add('active');
        }
    } else {
        // Restore navigation path if available
        if (currentPath.length > 0) {
            restoreNavigationPath();
        } else {
            // Show first pane with root items
            const rootItems = getItemsByParent('');
            renderList(1, rootItems, 'Bookmarks');
            const pane1 = document.getElementById('pane1');
            if (pane1) {
                pane1.style.display = 'block';
                pane1.classList.add('active');
            }
        }
    }
}

// Restore navigation path from currentPath
function restoreNavigationPath() {
    // Show root pane first
    const rootItems = getItemsByParent('');
    renderList(1, rootItems, 'Bookmarks');
    const pane1 = document.getElementById('pane1');
    if (pane1) {
        pane1.style.display = 'block';
        pane1.classList.add('active');
    }
    
    // Navigate through the path
    currentPath.forEach((folder, index) => {
        const level = index + 2;
        if (level > MAX_LEVELS) return;
        
        const pane = document.getElementById(`pane${level}`);
        if (!pane) return;
        
        const children = getItemsByParent(folder.id);
        pane.dataset.currentFolderId = folder.id;
        renderList(level, children, folder.name);
        pane.style.display = 'block';
        pane.classList.add('active');
        
        // Remove active from previous pane
        if (index > 0) {
            const prevPane = document.getElementById(`pane${level - 1}`);
            if (prevPane) {
                prevPane.classList.remove('active');
            }
        }
    });
}

// Search bookmarks by name
function searchBookmarks(query) {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    const results = bookmarks.filter(item => {
        return item.name.toLowerCase().includes(lowerQuery);
    });
    
    // Sort by access time (most recent first), then by name
    return results.sort((a, b) => {
        const aTime = a.accessTime || 0;
        const bTime = b.accessTime || 0;
        if (bTime !== aTime) {
            return bTime - aTime; // Most recent first
        }
        // If same access time (or both 0), sort alphabetically
        return a.name.localeCompare(b.name);
    });
}

// Record bookmark access time
function recordBookmarkAccess(bookmarkId) {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
        bookmark.accessTime = Date.now();
        saveBookmarks();
        // Re-render to update emoji icon
        renderNavigation();
    }
}

// Get emoji icon based on access time
function getBookmarkIcon(accessTime) {
    if (!accessTime || accessTime === 0) {
        return '🔗'; // Never accessed
    }
    
    const now = Date.now();
    const timeDiff = now - accessTime;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    if (timeDiff < oneHour) {
        return '🔥'; // Very recent (last hour)
    } else if (timeDiff < oneDay) {
        return '⭐'; // Recent (last day)
    } else if (timeDiff < oneWeek) {
        return '✨'; // This week
    } else if (timeDiff < oneMonth) {
        return '📌'; // This month
    } else {
        return '🔗'; // Older than a month
    }
}

// Get items by parent, sorted by order
function getItemsByParent(parentId) {
    const items = bookmarks.filter(item => item.parent === parentId);
    // Sort by order field (if exists), then by creation/access time
    return items.sort((a, b) => {
        const aOrder = a.order !== undefined ? a.order : Infinity;
        const bOrder = b.order !== undefined ? b.order : Infinity;
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        // If same order, maintain original order (by index in array)
        return bookmarks.indexOf(a) - bookmarks.indexOf(b);
    });
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
        if (searchQuery) {
            emptyLi.textContent = `No bookmarks found matching "${searchQuery}"`;
        } else {
            emptyLi.textContent = 'No items (drop here to add)';
            emptyLi.dataset.parent = getCurrentParentId(level);
            setupDropZone(emptyLi, level);
        }
        emptyLi.style.padding = '20px';
        emptyLi.style.color = '#999';
        emptyLi.style.textAlign = 'center';
        list.appendChild(emptyLi);
        return;
    }
    
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `bookmark-item ${item.type}`;
        li.dataset.id = item.id;
        // Disable drag and drop when searching
        li.draggable = !searchQuery;
        
        if (item.type === 'folder') {
            // Highlight search query in name if searching
            let displayName = item.name;
            if (searchQuery && searchQuery.length > 0) {
                const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                displayName = item.name.replace(regex, '<mark>$1</mark>');
            }
            
            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="folder-icon">📁</span>
                <span class="item-content">${displayName}</span>
                <div class="actions">
                    <button class="edit-icon-btn" onclick="editItem('${item.id}')" title="Edit">✏️</button>
                </div>
            `;
            // Only allow folder navigation if not searching
            if (!searchQuery) {
                li.addEventListener('click', (e) => {
                    if (!e.target.closest('.actions') && !e.target.closest('.drag-handle')) {
                        navigateToFolder(item, level);
                    }
                });
            }
        } else {
            // Use emoji icon for bookmarks based on access time
            // Highlight search query in name if searching
            let displayName = item.name;
            if (searchQuery && searchQuery.length > 0) {
                const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                displayName = item.name.replace(regex, '<mark>$1</mark>');
            }
            
            const bookmarkIcon = getBookmarkIcon(item.accessTime);
            
            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="bookmark-icon">${bookmarkIcon}</span>
                <a href="${item.url}" target="_blank" data-bookmark-id="${item.id}">
                    <span>${displayName}</span>
                </a>
                <div class="actions">
                    <button class="edit-icon-btn" onclick="event.stopPropagation(); editItem('${item.id}')" title="Edit">✏️</button>
                </div>
            `;
            
            // Track access time when bookmark is clicked
            const bookmarkLink = li.querySelector('a[data-bookmark-id]');
            if (bookmarkLink) {
                bookmarkLink.addEventListener('click', () => {
                    recordBookmarkAccess(item.id);
                });
            }
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
        } else if (item) {
            // Show visual feedback for reordering (dropping on non-folder in same list)
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
            
            // Don't allow moving to itself
            if (item && item.id === draggedItemObj.id) {
                return;
            }
            
            // Determine new parent
            let newParent = parentId || '';
            if (item && item.type === 'folder') {
                newParent = item.id;
            }
            
            // Check if we're reordering within the same parent
            const sameParent = (draggedItemObj.parent || '') === newParent;
            
            // Don't allow moving to descendants
            if (item && item.type === 'folder' && isDescendant(item.id, draggedItemObj.id)) {
                alert('Cannot move a folder into itself or its descendants');
                return;
            }
            
            // If same parent, reorder items
            if (sameParent && item) {
                reorderBookmark(draggedItemObj, item, newParent);
            } else {
                // Update parent (moving to different folder)
                draggedItemObj.parent = newParent;
                // Reset order when moving to new parent
                draggedItemObj.order = undefined;
            }
            
            saveBookmarks();
            // Save navigation state before rendering
            saveNavigationState();
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
    if (currentLevel >= MAX_LEVELS) {
        alert(`Maximum depth of ${MAX_LEVELS} levels reached`);
        return;
    }
    
    // Update current path
    currentPath = currentPath.slice(0, currentLevel - 1);
    currentPath.push(folder);
    
    // Save navigation state
    saveNavigationState();
    
    // Hide panes beyond current level
    for (let i = currentLevel + 1; i <= MAX_LEVELS; i++) {
        const pane = document.getElementById(`pane${i}`);
        if (pane) {
            pane.style.display = 'none';
            pane.classList.remove('active');
            pane.dataset.currentFolderId = '';
        }
    }
    
    // Show next pane
    const nextLevel = currentLevel + 1;
    const nextPane = document.getElementById(`pane${nextLevel}`);
    if (!nextPane) {
        alert(`Cannot navigate deeper than ${MAX_LEVELS} levels`);
        return;
    }
    
    const children = getItemsByParent(folder.id);
    nextPane.dataset.currentFolderId = folder.id;
    renderList(nextLevel, children, folder.name);
    nextPane.style.display = 'block';
    nextPane.classList.add('active');
    
    // Update active state
    const currentPane = document.getElementById(`pane${currentLevel}`);
    if (currentPane) {
        currentPane.classList.remove('active');
    }
}

// Save navigation state to localStorage
function saveNavigationState() {
    try {
        // Save only folder IDs and names for reconstruction
        const state = {
            path: currentPath.map(folder => ({
                id: folder.id,
                name: folder.name
            }))
        };
        localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Error saving navigation state:', e);
    }
}

// Restore navigation state from localStorage
function restoreNavigationState() {
    try {
        const stored = localStorage.getItem(NAVIGATION_STATE_KEY);
        if (stored) {
            const state = JSON.parse(stored);
            if (state.path && Array.isArray(state.path)) {
                // Reconstruct folder objects from stored IDs
                currentPath = state.path.map(folderData => {
                    const folder = bookmarks.find(b => b.id === folderData.id && b.type === 'folder');
                    if (folder) {
                        return {
                            id: folder.id,
                            name: folder.name || folderData.name
                        };
                    }
                    return null;
                }).filter(f => f !== null); // Remove any folders that no longer exist
            }
        }
    } catch (e) {
        console.error('Error restoring navigation state:', e);
        currentPath = [];
    }
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

// Reorder bookmark within the same parent
function reorderBookmark(draggedItem, targetItem, parentId) {
    // Get all items in the same parent, sorted by current order
    const siblings = getItemsByParent(parentId);
    
    // Remove dragged item from siblings
    const siblingsWithoutDragged = siblings.filter(s => s.id !== draggedItem.id);
    
    // Find target index
    const targetIndex = siblingsWithoutDragged.findIndex(s => s.id === targetItem.id);
    
    if (targetIndex === -1) return;
    
    // Insert dragged item at target position
    siblingsWithoutDragged.splice(targetIndex, 0, draggedItem);
    
    // Update order for all siblings
    siblingsWithoutDragged.forEach((sibling, index) => {
        sibling.order = index;
    });
    
    // Ensure parent is set
    draggedItem.parent = parentId;
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
                const bookmarkIcon = getBookmarkIcon(item.accessTime);
                content.innerHTML = `<span class="drag-handle">☰</span> <span class="bookmark-icon">${bookmarkIcon}</span> <a href="${item.url}" target="_blank" data-bookmark-id="${item.id}">${item.name}</a>`;
                
                // Track access time when bookmark is clicked in tree view
                const bookmarkLink = content.querySelector('a[data-bookmark-id]');
                if (bookmarkLink) {
                    bookmarkLink.addEventListener('click', () => {
                        recordBookmarkAccess(item.id);
                    });
                }
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

// Fetch page title from URL
async function fetchPageTitle(url, nameInput) {
    if (!url || !nameInput) return;
    
    try {
        // Try to fetch the page title using a CORS proxy or direct fetch
        // Since direct fetch may be blocked by CORS, we'll try multiple methods
        
        // Method 1: Try direct fetch (works for CORS-enabled sites)
        try {
            const response = await fetch(url, { 
                method: 'GET',
                mode: 'no-cors' // This won't give us the content, but we can try
            });
            // Direct fetch with CORS usually won't work, so we'll use method 2
        } catch (e) {
            // CORS blocked, use alternative method
        }
        
        // Method 2: Use a CORS proxy service
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data && data.contents) {
            // Parse the HTML to extract title
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const title = doc.querySelector('title');
            
            if (title && title.textContent.trim()) {
                // Only update if name field is still empty
                if (!nameInput.value.trim()) {
                    nameInput.value = title.textContent.trim();
                }
                return;
            }
        }
    } catch (e) {
        console.log('Could not fetch page title:', e);
    }
    
    // Fallback: Extract domain name as title
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        // Capitalize first letter and use domain as fallback
        if (!nameInput.value.trim()) {
            nameInput.value = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
    } catch (e) {
        // If URL parsing fails, do nothing
    }
}

// Save bookmark item
async function saveBookmarkItem() {
    let name = document.getElementById('bookmarkName').value.trim();
    const url = document.getElementById('bookmarkUrl').value.trim();
    const parent = document.getElementById('bookmarkParent').value;
    const isFolder = document.getElementById('bookmarkModalTitle').textContent.includes('Folder');
    
    if (!isFolder && !url) {
        alert('Please enter a URL');
        return;
    }
    
    // If name is empty and we have a URL, try to fetch the page title
    if (!isFolder && !name && url) {
        // Show loading indicator
        const nameInput = document.getElementById('bookmarkName');
        nameInput.placeholder = 'Fetching page title...';
        
        await fetchPageTitle(url, nameInput);
        name = nameInput.value.trim();
        
        // Reset placeholder
        nameInput.placeholder = '';
    }
    
    // If still no name, use URL domain as fallback
    if (!name && !isFolder && url) {
        try {
            const urlObj = new URL(url);
            name = urlObj.hostname.replace('www.', '');
            name = name.charAt(0).toUpperCase() + name.slice(1);
        } catch (e) {
            name = 'Untitled Bookmark';
        }
    }
    
    if (!name) {
        alert('Please enter a name');
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
        // Create new item with unique ID
        // Use timestamp + random number to ensure uniqueness even if multiple items are added quickly
        const newItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            type: isFolder ? 'folder' : 'bookmark',
            parent: parent || ''
        };
        
        if (!isFolder) {
            newItem.url = url;
            newItem.accessTime = 0; // Initialize access time for new bookmarks
        }
        
        // Set order to append at end of parent's children
        const siblings = getItemsByParent(parent || '');
        newItem.order = siblings.length;
        
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
    
    // Show delete button when editing
    document.getElementById('deleteBookmarkBtn').style.display = 'block';
    
    populateParentSelect();
    document.getElementById('bookmarkModal').classList.add('active');
}

// Delete item
function deleteItem(id) {
    // If called from modal, confirmation is already done
    const skipConfirm = arguments[1] === true;
    
    if (!skipConfirm && !confirm('Are you sure you want to delete this item? This will also delete all its children.')) {
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
    // Save navigation state before rendering
    saveNavigationState();
    renderNavigation();
    renderBookmarkTree();
}

// Parse Chrome bookmarks HTML format
function parseChromeBookmarks(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const result = [];
    let idCounter = 1;
    
    // Helper function to generate unique ID
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idCounter++}`;
    }
    
    // Recursive function to process DL elements (folders)
    function processDL(dlElement, parentId = '') {
        if (!dlElement) return;
        
        const children = Array.from(dlElement.childNodes);
        
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            
            // Skip text nodes and comments
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            
            // Process DT elements (can contain H3 for folders or A for bookmarks)
            if (node.tagName === 'DT') {
                const firstChild = node.firstElementChild;
                
                // Process folder (H3)
                if (firstChild && firstChild.tagName === 'H3') {
                    const h3 = firstChild;
                    const folderName = h3.textContent.trim();
                    
                    if (folderName) {
                        const folderId = generateId();
                        const folder = {
                            id: folderId,
                            name: folderName,
                            type: 'folder',
                            parent: parentId || ''
                        };
                        result.push(folder);
                        
                        // Find the nested DL element (folder contents)
                        // It can be a sibling of the H3 or a child of the DT
                        let nestedDL = null;
                        let nextSibling = h3.nextElementSibling;
                        
                        // Check if DL is a sibling of H3
                        while (nextSibling) {
                            if (nextSibling.tagName === 'DL') {
                                nestedDL = nextSibling;
                                break;
                            }
                            nextSibling = nextSibling.nextElementSibling;
                        }
                        
                        // If not found as sibling, check children of DT
                        if (!nestedDL) {
                            nestedDL = node.querySelector('DL');
                        }
                        
                        // Process nested DL (folder contents)
                        if (nestedDL) {
                            processDL(nestedDL, folderId);
                        }
                    }
                }
                // Process bookmark (A)
                else if (firstChild && firstChild.tagName === 'A') {
                    const a = firstChild;
                    const url = a.getAttribute('HREF');
                    const name = a.textContent.trim();
                    
                    if (url && name) {
                        const parentIdForBookmark = currentFolderId || parentId || '';
                        const bookmark = {
                            id: generateId(),
                            name: name,
                            url: url,
                            type: 'bookmark',
                            parent: parentIdForBookmark,
                            accessTime: 0,
                            order: result.filter(b => b.parent === parentIdForBookmark).length
                        };
                        result.push(bookmark);
                    }
                }
            }
        }
    }
    
    // Find the main DL element (usually inside body or directly in document)
    const mainDL = doc.querySelector('DL') || doc.querySelector('body > DL');
    if (mainDL) {
        processDL(mainDL);
    }
    
    return result;
}

// Import bookmarks from file
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        let importedBookmarks = [];
        
        // Detect file format and parse accordingly
        if (file.name.endsWith('.html') || text.trim().startsWith('<!DOCTYPE') || text.includes('<DT>') || text.includes('<DL>')) {
            // Chrome/Netscape bookmark HTML format
            importedBookmarks = parseChromeBookmarks(text);
            
            if (importedBookmarks.length === 0) {
                throw new Error('No bookmarks found in HTML file');
            }
        } else {
            // JSON format
            importedBookmarks = JSON.parse(text);
            
            // Validate the imported data
            if (!Array.isArray(importedBookmarks)) {
                throw new Error('Invalid bookmark file format');
            }
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
        
        showFileStatus(`Bookmarks imported successfully from ${file.name} (${importedBookmarks.length} items)`, 'success');
    } catch (e) {
        console.error('Error importing bookmarks:', e);
        showFileStatus(`Error importing bookmarks: ${e.message}`, 'error');
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
