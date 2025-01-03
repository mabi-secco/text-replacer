function applyReplacements(e) {
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.hasAttribute('contenteditable')) {
        
        chrome.storage.sync.get(['replacements'], function(result) {
            const replacements = result.replacements || {};
            const isContentEditable = e.target.hasAttribute('contenteditable');
            
            // Store selection before any changes
            let originalRange;
            if (isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    originalRange = selection.getRangeAt(0).cloneRange();
                }
            }
            
            // Get text content
            const text = isContentEditable 
                ? e.target.innerHTML 
                : e.target.value;
            
            let newText = text;
            let replacementMade = false;
            
            // Process replacements
            for (const [shortcut, phrase] of Object.entries(replacements)) {
                if (text.includes(shortcut)) {
                    // For contenteditable, we need to handle HTML line breaks
                    const escapedShortcut = isContentEditable 
                        ? escapeRegExp(shortcut).replace(/\n/g, '<br>?\\s*')
                        : escapeRegExp(shortcut);
                    
                    const regex = new RegExp(escapedShortcut, 'g');
                    
                    // For contenteditable, preserve line breaks in replacement
                    const replacementText = isContentEditable 
                        ? phrase.replace(/\n/g, '<br>') 
                        : phrase;
                    
                    newText = newText.replace(regex, replacementText);
                    replacementMade = true;
                }
            }
            
            if (replacementMade) {
                if (isContentEditable) {
                    // Save the current scroll position
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                    
                    // Update content
                    e.target.innerHTML = newText;
                    
                    // Restore selection if we had one
                    if (originalRange) {
                        const selection = window.getSelection();
                        
                        // Try to find the same text node and offset
                        const nodeIterator = document.createNodeIterator(
                            e.target,
                            NodeFilter.SHOW_TEXT
                        );
                        
                        let currentNode;
                        let found = false;
                        while ((currentNode = nodeIterator.nextNode())) {
                            if (currentNode.textContent === originalRange.startContainer.textContent) {
                                const range = document.createRange();
                                range.setStart(currentNode, originalRange.startOffset);
                                range.setEnd(currentNode, originalRange.startOffset);
                                
                                selection.removeAllRanges();
                                selection.addRange(range);
                                found = true;
                                break;
                            }
                        }
                        
                        // If we couldn't find the exact node, try to get close
                        if (!found) {
                            const range = document.createRange();
                            range.selectNodeContents(e.target);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                    
                    // Restore scroll position
                    window.scrollTo(scrollLeft, scrollTop);
                } else {
                    const cursorPos = e.target.selectionStart;
                    e.target.value = newText;
                    e.target.setSelectionRange(cursorPos, cursorPos);
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

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('input', applyReplacements);