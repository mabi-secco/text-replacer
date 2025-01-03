// Debounce function to improve performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cache regex patterns for better performance
const regexCache = new Map();
function getRegexFromCache(pattern) {
    if (!regexCache.has(pattern)) {
        regexCache.set(pattern, new RegExp(escapeRegExp(pattern), 'g'));
    }
    return regexCache.get(pattern);
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Applies text replacements to the input field
 * @param {Event} e - The input event
 */
function applyReplacements(e) {
    // Check if the target is an editable element
    if (!isEditableElement(e.target)) return;

    chrome.storage.sync.get(['replacements'])
        .then(result => {
            const replacements = result.replacements || {};
            const text = getElementText(e.target);
            let newText = text;
            
            // Store cursor position and selection
            const cursorPos = e.target.selectionStart;
            const selectionEnd = e.target.selectionEnd;
            let offsetAdjustment = 0;
            
            // Process all replacements
            for (const [shortcut, phrase] of Object.entries(replacements)) {
                if (text.includes(shortcut)) {
                    const regex = getRegexFromCache(shortcut);
                    regex.lastIndex = 0; // Reset regex state
                    
                    let match;
                    while ((match = regex.exec(newText)) !== null) {
                        const matchIndex = match.index;
                        if (matchIndex < cursorPos) {
                            offsetAdjustment += phrase.length - shortcut.length;
                        }
                    }
                    
                    newText = newText.replace(regex, phrase);
                }
            }
            
            if (text !== newText) {
                updateElementText(e.target, newText, cursorPos + offsetAdjustment);
            }
        })
        .catch(error => {
            console.error('Error accessing storage:', error);
        });
}

/**
 * Checks if an element is editable
 * @param {HTMLElement} element - The element to check
 * @returns {boolean}
 */
function isEditableElement(element) {
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.hasAttribute('contenteditable');
}

/**
 * Gets text content from an element
 * @param {HTMLElement} element - The element to get text from
 * @returns {string}
 */
function getElementText(element) {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
        ? element.value
        : element.textContent;
}

/**
 * Updates element text and cursor position
 * @param {HTMLElement} element - The element to update
 * @param {string} newText - The new text content
 * @param {number} newCursorPos - The new cursor position
 */
function updateElementText(element, newText, newCursorPos) {
    // Update text content
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = newText;
    } else {
        element.textContent = newText;
    }
    
    // Set cursor position using different methods
    setCursorPosition(element, newCursorPos);
    
    // Dispatch input event
    dispatchInputEvent(element, newText);
}

/**
 * Sets cursor position using multiple fallback methods
 * @param {HTMLElement} element - The element to set cursor in
 * @param {number} position - The cursor position
 */
function setCursorPosition(element, position) {
    const methods = [
        // Method 1: Standard method
        () => element.setSelectionRange(position, position),
        
        // Method 2: Range method
        () => {
            const range = document.createRange();
            const sel = window.getSelection();
            
            if (element.childNodes.length > 0) {
                range.setStart(element.childNodes[0], position);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    ];

    for (const method of methods) {
        try {
            method();
            return;
        } catch (err) {
            continue;
        }
    }

    // Final fallback: Delayed positioning
    setTimeout(() => {
        try {
            element.setSelectionRange(position, position);
        } catch (err) {
            console.warn('Could not set cursor position:', err);
        }
    }, 0);
}

/**
 * Dispatches an input event
 * @param {HTMLElement} element - The element to dispatch event on
 * @param {string} text - The new text content
 */
function dispatchInputEvent(element, text) {
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
    });
    element.dispatchEvent(inputEvent);
}

// Add event listener with debouncing
document.addEventListener('input', debounce(applyReplacements, 100));