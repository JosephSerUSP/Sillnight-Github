// Main editor script
import { Creatures } from '../src/assets/data/creatures.js';
import { Dungeons } from '../src/assets/data/dungeon.js';
import { Events } from '../src/assets/data/events.js';
import { Equipment } from '../src/assets/data/equipment.js';
import { Items } from '../src/assets/data/items.js';
import { Party } from '../src/assets/data/party.js';
import { Skills } from '../src/assets/data/skills.js';
import { Passives } from '../src/assets/data/passives.js';
import { Materials } from '../src/assets/data/materials.js';

const DataStore = {
    creatures: Creatures,
    dungeons: Dungeons,
    events: Events,
    equipment: Equipment,
    items: Items,
    party: Party,
    skills: Skills,
    passives: Passives,
    materials: Materials
};

let currentType = null;
let currentId = null;
let currentData = null;

const typeList = document.getElementById('data-type-list');
const entryList = document.getElementById('entry-list');
const searchInput = document.getElementById('search');
const editorTitle = document.getElementById('editor-title');
const editorForm = document.getElementById('editor-form');
const rawJson = document.getElementById('raw-json');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');
const btnNew = document.getElementById('btn-new');
const btnExport = document.getElementById('btn-export');

function init() {
    typeList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
            e.target.classList.add('active');
            currentType = e.target.dataset.type;
            loadEntries();
            clearEditor();
        }
    });

    searchInput.addEventListener('input', loadEntries);

    entryList.addEventListener('click', (e) => {
        let target = e.target;
        while(target && target.tagName !== 'LI' && target !== entryList) {
            target = target.parentElement;
        }
        if (target && target.tagName === 'LI') {
            document.querySelectorAll('#entry-list li').forEach(li => li.classList.remove('active'));
            target.classList.add('active');
            currentId = target.dataset.id;
            loadEditor();
        }
    });

    btnSave.addEventListener('click', saveEntry);
    btnDelete.addEventListener('click', deleteEntry);
    btnNew.addEventListener('click', createNewEntry);
    btnExport.addEventListener('click', exportData);

    if(typeList.firstElementChild) {
        typeList.firstElementChild.click();
    }
}

function loadEntries() {
    if (!currentType) return;

    entryList.innerHTML = '';
    const data = DataStore[currentType];
    const filter = searchInput.value.toLowerCase();

    const keys = Object.keys(data).sort();

    keys.forEach(key => {
        const item = data[key];
        const name = item.name || item.id || key;

        if (name.toLowerCase().includes(filter) || key.toLowerCase().includes(filter)) {
            const li = document.createElement('li');
            li.dataset.id = key;
            li.textContent = `${name} (${key})`;
            if (key === currentId) {
                li.classList.add('active');
            }
            entryList.appendChild(li);
        }
    });
}

function clearEditor() {
    currentId = null;
    currentData = null;
    editorTitle.textContent = 'Select an entry';
    editorForm.innerHTML = '';
    rawJson.style.display = 'none';
    btnSave.disabled = true;
    btnDelete.disabled = true;
}

function loadEditor() {
    if (!currentType || !currentId) return;

    currentData = JSON.parse(JSON.stringify(DataStore[currentType][currentId]));

    editorTitle.textContent = `Editing: ${currentData.name || currentId}`;
    btnSave.disabled = false;
    btnDelete.disabled = false;

    buildForm();
}

function buildForm() {
    editorForm.innerHTML = '';
    rawJson.style.display = 'none'; // Keep hidden, prefer UI

    // Create UI elements based on data keys
    const keys = Object.keys(currentData);

    // Ensure ID is always editable at top
    if (!keys.includes('id')) {
         keys.unshift('id');
    }

    keys.forEach(key => {
        const val = currentData[key];
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        group.appendChild(label);

        if (Array.isArray(val)) {
            // Handle arrays (simple strings for now)
            const container = document.createElement('div');
            container.className = 'array-container';

            const renderArray = () => {
                container.innerHTML = '';
                currentData[key].forEach((item, index) => {
                    const row = document.createElement('div');
                    row.className = 'array-item';

                    if(Array.isArray(item)) {
                        // Nested array e.g. acts
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = JSON.stringify(item);
                        input.onchange = (e) => {
                            try {
                                currentData[key][index] = JSON.parse(e.target.value);
                                btnSave.disabled = false;
                            } catch(err) {
                                e.target.style.borderColor = 'red';
                            }
                        };
                        row.appendChild(input);
                    } else if (typeof item === 'object') {
                         const input = document.createElement('input');
                        input.type = 'text';
                        input.value = JSON.stringify(item);
                        input.onchange = (e) => {
                            try {
                                currentData[key][index] = JSON.parse(e.target.value);
                                btnSave.disabled = false;
                            } catch(err) {
                                e.target.style.borderColor = 'red';
                            }
                        };
                        row.appendChild(input);
                    } else {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = item;
                        input.onchange = (e) => {
                            currentData[key][index] = e.target.value;
                            btnSave.disabled = false;
                        };
                        row.appendChild(input);
                    }


                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'X';
                    delBtn.onclick = () => {
                        currentData[key].splice(index, 1);
                        renderArray();
                        btnSave.disabled = false;
                    };
                    row.appendChild(delBtn);
                    container.appendChild(row);
                });

                const addBtn = document.createElement('button');
                addBtn.className = 'add-array-btn';
                addBtn.textContent = 'Add Item';
                addBtn.onclick = () => {
                    currentData[key].push("");
                    renderArray();
                    btnSave.disabled = false;
                };
                container.appendChild(addBtn);
            };

            renderArray();
            group.appendChild(container);

        } else if (typeof val === 'number') {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = val;
            input.step = 'any';
            input.onchange = (e) => {
                currentData[key] = parseFloat(e.target.value);
                btnSave.disabled = false;
            };
            group.appendChild(input);
        } else if (typeof val === 'boolean') {
            const select = document.createElement('select');
            const optTrue = document.createElement('option');
            optTrue.value = "true";
            optTrue.textContent = "True";
            const optFalse = document.createElement('option');
            optFalse.value = "false";
            optFalse.textContent = "False";
            select.appendChild(optTrue);
            select.appendChild(optFalse);
            select.value = val ? "true" : "false";
            select.onchange = (e) => {
                currentData[key] = e.target.value === "true";
                btnSave.disabled = false;
            };
            group.appendChild(select);
        } else if (typeof val === 'object' && val !== null) {
            // Complex object, fallback to text for now
            const textarea = document.createElement('textarea');
            textarea.value = JSON.stringify(val, null, 2);
            textarea.onchange = (e) => {
                try {
                    currentData[key] = JSON.parse(e.target.value);
                    textarea.style.borderColor = '#202225';
                    btnSave.disabled = false;
                } catch(err) {
                    textarea.style.borderColor = 'red';
                    btnSave.disabled = true;
                }
            };
            group.appendChild(textarea);
        } else {
            // String or fallback
            if(key === 'description') {
                 const textarea = document.createElement('textarea');
                textarea.value = val;
                textarea.onchange = (e) => {
                    currentData[key] = e.target.value;
                    btnSave.disabled = false;
                };
                group.appendChild(textarea);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = val || '';
                if (key === 'id') {
                    // ID requires special handling to update the key in the datastore
                    // For now, allow editing but warn
                    // A better way is to handle ID change during save
                }
                input.onchange = (e) => {
                    currentData[key] = e.target.value;
                    btnSave.disabled = false;
                };
                group.appendChild(input);
            }
        }

        editorForm.appendChild(group);
    });

    // Add raw JSON toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Toggle Raw JSON';
    toggleBtn.style.marginTop = '20px';
    toggleBtn.onclick = () => {
        if(rawJson.style.display === 'none') {
            rawJson.value = JSON.stringify(currentData, null, 4);
            rawJson.style.display = 'block';
            editorForm.style.display = 'none';
        } else {
            // Try to parse back
            try {
                currentData = JSON.parse(rawJson.value);
                buildForm(); // Re-render UI
            } catch (e) {
                alert('Invalid JSON');
            }
        }
    };
    editorForm.appendChild(toggleBtn);

    rawJson.oninput = () => {
        try {
            const parsed = JSON.parse(rawJson.value);
            rawJson.style.borderColor = '#202225';
            btnSave.disabled = false;
            // Don't update currentData on every keystroke, wait for toggle/save
        } catch(e) {
            rawJson.style.borderColor = 'red';
            btnSave.disabled = true;
        }
    }
}

async function saveEntry() {
    if (!currentType || !currentId || !currentData) return;

    try {
        if(rawJson.style.display === 'block') {
             currentData = JSON.parse(rawJson.value);
        }

        if(currentData.id && currentData.id !== currentId) {
            delete DataStore[currentType][currentId];
            currentId = currentData.id;
        }

        DataStore[currentType][currentId] = JSON.parse(JSON.stringify(currentData));

        // Auto-save to server
        await saveToServer();

        loadEntries();
        const item = Array.from(entryList.children).find(li => li.dataset.id === currentId);
        if(item) item.classList.add('active');

        // Re-render form in case we were in JSON mode
        if(rawJson.style.display === 'block') {
             buildForm();
        }

    } catch (e) {
        alert('Invalid data: ' + e.message);
    }
}

async function deleteEntry() {
    if (!currentType || !currentId) return;

    if (confirm(`Delete ${currentId}?`)) {
        delete DataStore[currentType][currentId];
        await saveToServer();
        clearEditor();
        loadEntries();
    }
}

function createNewEntry() {
    if (!currentType) return;

    const newId = prompt('Enter new ID:');
    if (!newId) return;
    if (DataStore[currentType][newId]) {
        alert('ID already exists!');
        return;
    }

    DataStore[currentType][newId] = { id: newId, name: 'New Entry' };
    currentId = newId;
    loadEntries();

    const item = Array.from(entryList.children).find(li => li.dataset.id === currentId);
    if(item) item.click();
}

async function exportData() {
    await saveToServer();
    alert('All changes saved to disk!');
}

async function saveToServer() {
    if (!currentType) return;

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: currentType,
                data: DataStore[currentType]
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (err) {
        console.error('Failed to save to server:', err);
        alert('Failed to save to server. Is the Node server running?');
    }
}

init();
