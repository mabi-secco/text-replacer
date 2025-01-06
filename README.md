# Text Replacer Chrome Extension

A powerful Chrome extension that automatically replaces text shortcuts with longer phrases as you type. Perfect for frequently used expressions, email templates, or code snippets.

## Features

- **Real-time Text Replacement**: Automatically replaces your shortcuts as you type
- **Works Everywhere**: Compatible with input fields, textareas, and contenteditable elements
- **Smart Cursor Positioning**: Maintains proper cursor position after replacements
- **Sync Across Devices**: Your shortcuts sync across all Chrome instances where you're signed in
- **Performance Optimized**: Uses debouncing and caching for smooth typing experience

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Setting Up Shortcuts

1. Click the extension icon in your Chrome toolbar
2. Click "Options" to open the settings page
3. Add new shortcuts:
   - Enter your shortcut text (e.g., `/sig`)
   - Enter the replacement text (e.g., your email signature)
   - Click "Add" to save

### Using Shortcuts

Simply type your shortcut in any text input field, and it will automatically be replaced with your defined text.

Example:
- Type `/sig` → Gets replaced with your full signature
- Type `/addr` → Gets replaced with your address

### Tips

- Shortcuts are case-sensitive
- You can use multi-line text in both shortcuts and replacements
- Changes sync automatically across devices
- Works in most websites and text editors

## Technical Details

The extension uses:
- Chrome Storage Sync API for cross-device synchronization
- MutationObserver for handling dynamic content
- Debouncing for performance optimization
- Regex caching for faster replacements

## File Structure

```
text_replacer/
├── manifest.json        # Extension configuration
├── content.js          # Main replacement logic
├── options.html        # Settings page HTML
├── options.js          # Settings page logic
└── options.css         # Settings page styles
```

## Privacy

This extension:
- Does not collect any personal data
- Does not transmit any data to external servers
- Only stores your shortcuts in Chrome's sync storage
- Only runs on pages where text input is needed
