function applyReplacements(e) {
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.hasAttribute('contenteditable')) {
        
        chrome.storage.sync.get(['replacements'], function(result) {
            const replacements = result.replacements || {};
            const isContentEditable = e.target.hasAttribute('contenteditable');
            
            // Get text and preserve HTML for contenteditable
            const text = isContentEditable 
                ? e.target.innerHTML 
                : e.target.value;
            
            const cursorPos = isContentEditable 
                ? getContentEditableCaretPosition(e.target)
                : e.target.selectionStart;
                
            let newText = text;
            let offsetAdjustment = 0;
            
            // Process replacements
            for (const [shortcut, phrase] of Object.entries(replacements)) {
                if (text.includes(shortcut)) {
                    // For contenteditable, we need to handle HTML entities
                    const escapedShortcut = isContentEditable 
                        ? escapeRegExp(shortcut).replace(/\n/g, '<br>?\\s*')
                        : escapeRegExp(shortcut);
                        
                    const regex = new RegExp(escapedShortcut, 'g');
                    
                    // For contenteditable, preserve line breaks in replacement
                    const replacementText = isContentEditable 
                        ? phrase.replace(/\n/g, '<br>') 
                        : phrase;
                    
                    let match;
                    // Find all matches before cursor position
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = text;
                    const plainText = tempDiv.textContent;
                    
                    while ((match = regex.exec(text)) !== null) {
                        const matchIndex = getPlainTextIndex(text.substring(0, match.index));
                        if (matchIndex < cursorPos) {
                            const lengthDiff = phrase.length - shortcut.length;
                            offsetAdjustment += lengthDiff;
                        }
                    }
                    
                    newText = newText.replace(regex, replacementText);
                }
            }
            
            if (text !== newText) {
                const newCursorPos = cursorPos + offsetAdjustment;
                
                // Apply changes while preserving structure
                if (isContentEditable) {
                    e.target.innerHTML = newText;
                    setContentEditableCaretPosition(e.target, newCursorPos);
                } else {
                    e.target.value = newText;
                    e.target.setSelectionRange(newCursorPos, newCursorPos);
                }
                
                // Dispatch input event
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: newText
                });
                e.target.dispatchEvent(inputEvent);
            }
        });
    }
}

// Helper function to get plain text index from HTML
function getPlainTextIndex(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent.length;
}

// Helper function to get caret position in contenteditable elements
function getContentEditableCaretPosition(element) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    // Convert HTML to plain text for position calculation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = preCaretRange.cloneContents().innerHTML;
    return tempDiv.textContent.length;
}

// Helper function to set caret position in contenteditable elements
function setContentEditableCaretPosition(element, position) {
    const range = document.createRange();
    const sel = window.getSelection();
    
    let currentPos = 0;
    let found = false;
    
    function traverseNodes(node) {
        if (found) return;
        
        if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.length;
            if (currentPos + nodeLength >= position) {
                range.setStart(node, position - currentPos);
                range.collapse(true);
                found = true;
                return;
            }
            currentPos += nodeLength;
        } else {
            for (const childNode of node.childNodes) {
                traverseNodes(childNode);
            }
        }
    }
    
    traverseNodes(element);
    
    if (!found) {
        range.selectNodeContents(element);
        range.collapse(false);
    }
    
    sel.removeAllRanges();
    sel.addRange(range);
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('input', applyReplacements);