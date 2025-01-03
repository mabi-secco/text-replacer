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
            const cursorPos = e.target.selectionStart;
            const selectionEnd = e.target.selectionEnd;
            let offsetAdjustment = 0;
            
            for (const [shortcut, phrase] of Object.entries(replacements)) {
                if (text.includes(shortcut)) {
                    const regex = new RegExp(escapeRegExp(shortcut), 'g');
                    let match;
                    while ((match = regex.exec(newText)) !== null) {
                        const matchIndex = match.index;
                        if (matchIndex < cursorPos) {
                            const lengthDiff = phrase.length - shortcut.length;
                            offsetAdjustment += lengthDiff;
                        }
                    }
                    
                    newText = newText.replace(regex, phrase);
                }
            }
            
            if (text !== newText) {
                // Calculate new cursor position
                const newCursorPos = cursorPos + offsetAdjustment;
                
                // Apply the text change
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    e.target.value = newText;
                } else {
                    e.target.textContent = newText;
                }
                
                // Try multiple methods to set cursor position
                try {
                    // Method 1: Standard method
                    e.target.setSelectionRange(newCursorPos, newCursorPos);
                } catch (err) {
                    try {
                        // Method 2: Create a selection range
                        const range = document.createRange();
                        const sel = window.getSelection();
                        
                        if (e.target.childNodes.length > 0) {
                            range.setStart(e.target.childNodes[0], newCursorPos);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    } catch (err2) {
                        // Method 3: Delayed cursor positioning
                        setTimeout(() => {
                            try {
                                e.target.setSelectionRange(newCursorPos, newCursorPos);
                            } catch (err3) {
                                // If all methods fail, we'll let the site handle cursor positioning
                                console.log('Could not set cursor position');
                            }
                        }, 0);
                    }
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

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('input', applyReplacements);