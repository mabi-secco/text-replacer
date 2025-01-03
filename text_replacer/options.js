document.addEventListener('DOMContentLoaded', loadReplacements);

document.getElementById('add').addEventListener('click', addReplacement);

function updateReplacementCount(count) {
    document.getElementById('replacement-count').textContent = count;
}

function loadReplacements() {
    chrome.storage.sync.get(['replacements'], function(result) {
        const replacements = result.replacements || {};
        updateReplacementsList(replacements);
        updateReplacementCount(Object.keys(replacements).length);
    });
}

function addReplacement() {
    const shortcut = document.getElementById('shortcut').value;
    const phrase = document.getElementById('phrase').value;

    if (!shortcut || !phrase) {
        alert('Please fill in both shortcut and phrase fields.');
        return;
    }

    chrome.storage.sync.get(['replacements'], function(result) {
        const replacements = result.replacements || {};
        replacements[shortcut] = phrase;

        chrome.storage.sync.set({
            replacements: replacements
        }, function() {
            document.getElementById('shortcut').value = '';
            document.getElementById('phrase').value = '';
            updateReplacementsList(replacements);
            updateReplacementCount(Object.keys(replacements).length);
        });
    });
}

function deleteReplacement(shortcut) {
    chrome.storage.sync.get(['replacements'], function(result) {
        const replacements = result.replacements || {};
        delete replacements[shortcut];

        chrome.storage.sync.set({
            replacements: replacements
        }, function() {
            updateReplacementsList(replacements);
            updateReplacementCount(Object.keys(replacements).length);
        });
    });
}

function updateReplacementsList(replacements) {
    const list = document.getElementById('replacements-list');
    list.innerHTML = '';

    if (Object.keys(replacements).length === 0) {
        list.innerHTML = `
            <div class="replacement-item" style="justify-content: center; color: var(--text-secondary);">
                No replacements added yet
            </div>
        `;
        return;
    }

    for (const [shortcut, phrase] of Object.entries(replacements)) {
        const item = document.createElement('div');
        item.className = 'replacement-item';
        
        // Create text content div
        const textDiv = document.createElement('div');
        textDiv.className = 'replacement-text';
        textDiv.innerHTML = `
            <span class="shortcut">${escapeHtml(shortcut)}</span>
            <span class="arrow">→</span>
            <span>${escapeHtml(phrase)}</span>
        `;
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteReplacement(shortcut));
        
        // Append elements
        item.appendChild(textDiv);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}