function applyReplacements(e) {
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.hasAttribute('contenteditable')) {
        
        chrome.storage.sync.get(['replacements'], function(result) {
            const replacements = result.replacements || {};
            const text = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' 
                ? e.target.value 
                : e.target.textContent;
            let newText = text;
            
            // Store cursor position and selection
            const isContentEditable = e.target.hasAttribute('contenteditable');
            const cursorPos = isContentEditable 
                ? getContentEditableCaretPosition(e.target)
                : e.target.selectionStart;
            let offsetAdjustment = 0;
            
            for (const [shortcut, phrase] of Object.entries(replacements)) {
                if (text.includes(shortcut)) {
                    const regex = new RegExp(escapeRegExp(shortcut), 'g');
                    let match;
                    let lastIndex = 0;
                    
                    // Find all matches before cursor position
                    while ((match = regex.exec(text)) !== null) {
                        const matchIndex = match.index;
                        if (matchIndex < cursorPos) {
                            const lengthDiff = phrase.length - shortcut.length;
                            offsetAdjustment += lengthDiff;
                        }
                        lastIndex = regex.lastIndex;
                    }
                    
                    newText = newText.replace(regex, phrase);
                }
            }
            
            if (text !== newText) {
                // Calculate new cursor position
                const newCursorPos = cursorPos + offsetAdjustment;
                
                // Apply the text change
                if (isContentEditable) {
                    e.target.textContent = newText;
                    setContentEditableCaretPosition(e.target, newCursorPos);
                } else {
                    e.target.value = newText;
                    // Immediately set selection range
                    e.target.setSelectionRange(newCursorPos, newCursorPos);
                    
                    // Also schedule a delayed selection range set as backup
                    requestAnimationFrame(() => {
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                    });
                }
                
                // Dispatch input event to ensure site's handlers are triggered
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

// Helper function to get caret position in contenteditable elements
function getContentEditableCaretPosition(element) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
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
        // If position wasn't found, set to end
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