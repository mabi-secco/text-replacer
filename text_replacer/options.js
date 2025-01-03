document.addEventListener('DOMContentLoaded', loadReplacements);

document.getElementById('add').addEventListener('click', addReplacement);

function loadReplacements() {
    chrome.storage.sync.get(['replacements'], function(result) {
        const replacements = result.replacements || {};
        updateReplacementsList(replacements);
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
        });
    });
}

function updateReplacementsList(replacements) {
    const list = document.getElementById('replacements-list');
    list.innerHTML = '';

    for (const [shortcut, phrase] of Object.entries(replacements)) {
        const item = document.createElement('div');
        item.className = 'replacement-item';
        item.innerHTML = `
            <span><strong>${shortcut}</strong> → ${phrase}</span>
            <button class="delete" onclick="deleteReplacement('${shortcut}')">Delete</button>
        `;
        list.appendChild(item);
    }
}