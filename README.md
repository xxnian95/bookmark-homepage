# Browser Homepage

A beautiful, customizable browser homepage with a hierarchical bookmark management system. Store and organize your bookmarks locally in your browser with support for folders, drag-and-drop, and favicon display.

## Features

### 📚 Hierarchical Bookmark System

- **3-level folder structure** - Organize bookmarks in nested folders up to 3 levels deep
- **Visual navigation** - Navigate through folders with side-by-side panes
- **Folder icons** - Easy visual identification of folders vs bookmarks

### 🎨 Modern UI

- **Beautiful gradient design** - Modern, eye-catching interface
- **Favicon display** - Automatic favicon loading for all bookmarks
- **Responsive layout** - Works on different screen sizes
- **Smooth animations** - Polished user experience

### 🖱️ Drag and Drop

- **Reorder bookmarks** - Drag items to reorganize
- **Move to folders** - Drag bookmarks into folders
- **Visual feedback** - Clear indicators during drag operations
- **Validation** - Prevents invalid moves (e.g., moving folder into itself)

### 💾 Local Storage

- **Browser-based storage** - All bookmarks stored in browser's localStorage
- **No server required** - Works completely offline
- **Automatic saving** - Changes saved instantly
- **Export/Import** - Backup and restore your bookmarks

### 🔧 Management Features

- **Add/Edit/Delete** - Full CRUD operations for bookmarks and folders
- **Tree view** - Visual tree representation in management modal
- **Search-friendly** - Quick access to all your bookmarks

## Getting Started

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser

That's it! No build process or dependencies required.

### Setting as Browser Homepage

#### Chrome/Edge

1. Open Settings → On startup
2. Select "Open a specific page or set of pages"
3. Click "Add a new page"
4. Enter the file path: `file:///path/to/index.html`
   - Or use: `file:///Users/yourname/codes/z-homepage/index.html`

#### Firefox

1. Open Preferences → Home
2. Under "Homepage", select "Custom URLs"
3. Enter the file path: `file:///path/to/index.html`

## Usage

### Adding Bookmarks

1. Click **"Manage Bookmarks"** button
2. Click **"Add Bookmark"**
3. Enter the bookmark name and URL
4. Select a parent folder (optional)
5. Click **"Save"**

### Adding Folders

1. Click **"Manage Bookmarks"** button
2. Click **"Add Folder"**
3. Enter the folder name
4. Select a parent folder (optional)
5. Click **"Save"**

### Navigating Folders

- Click on any folder in the navigation panes to view its contents
- Up to 3 levels of folders are supported
- Use the navigation panes to move between folder levels

### Drag and Drop

- **Drag any bookmark or folder** by clicking and holding
- **Drop on a folder** to move the item into that folder
- **Drop on empty space** to move to the root level
- Visual feedback shows valid drop zones

### Export/Import

#### Export Bookmarks

1. Click **"Export"** button
2. A JSON file (`bookmarks.json`) will be downloaded
3. Save this file as a backup

#### Import Bookmarks

1. Click **"Import"** button
2. Select a previously exported `bookmarks.json` file
3. Confirm to replace existing bookmarks (if any)

## File Structure

```
z-homepage/
├── index.html      # Main HTML file
├── styles.css      # Styling and layout
├── script.js       # Application logic
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

## Data Storage

Bookmarks are stored in the browser's **localStorage** under the key `homepageBookmarks`. This means:

- ✅ Data persists between browser sessions
- ✅ No server or internet connection required
- ✅ Data is stored locally on your machine
- ⚠️ Data is browser-specific (not synced across browsers)
- ⚠️ Clearing browser data will remove bookmarks

### Backup Recommendation

Regularly export your bookmarks using the **Export** button to create backups.

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Other modern browsers

## Technical Details

### Storage Format

Bookmarks are stored as JSON with the following structure:

```json
[
  {
    "id": "unique-id",
    "name": "Bookmark Name",
    "url": "https://example.com",
    "type": "bookmark",
    "parent": "parent-folder-id"
  },
  {
    "id": "folder-id",
    "name": "Folder Name",
    "type": "folder",
    "parent": ""
  }
]
```

### Favicon Service

The application uses Google's favicon service to display website icons:

- `https://www.google.com/s2/favicons?domain=example.com&sz=32`
- Falls back to a default icon if favicon cannot be loaded

## License

This project is open source and available for personal use.

## Contributing

Feel free to fork, modify, and use this project for your own needs. Suggestions and improvements are welcome!
