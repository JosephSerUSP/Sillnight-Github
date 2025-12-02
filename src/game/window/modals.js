import { Data } from '../../assets/data/data.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';
import { Log } from '../log.js';

/**
 * Window for displaying creature details and managing equipment.
 */
export class Window_CreatureModal extends Window_Selectable {
    constructor() {
        super();
        this.root.id = 'creature-modal';
        this.root.className = 'hidden absolute inset-0 bg-black/60 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm';

        // Append to game container to ensure it's in the DOM
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.root);
        } else {
             console.warn('Window_CreatureModal: game-container not found');
        }

        this.root.onclick = (event) => {
            if(event.target === this.root) this.hide();
        };
    }

    initialize() {
        super.initialize();
        this._ui = {};
        this._unit = null;
        this.createLayout();

        // Event Delegation for Equip Slot
        this._ui.equipSlot.addEventListener('click', () => {
             if (this._unit && this._unit.equipmentId) {
                 this.unequipUnit(this._unit);
             } else if (this._unit) {
                 this.startEquipFlow(null);
             }
        });
    }

    createLayout() {
        // Clear root
        this.root.innerHTML = '';

        // Main Window Frame
        const win = this.createEl('div', 'rpg-window w-4/5 h-4/5 flex flex-col bg-[#111] relative overflow-hidden', this.root);

        // Header
        const header = this.createEl('div', 'rpg-header flex justify-between items-center', win);
        this.createEl('span', 'tracking-widest', header).innerText = 'CREATURE STATUS';
        const closeBtn = this.createEl('button', 'text-red-500 font-bold px-2', header);
        closeBtn.innerText = 'X';
        closeBtn.onclick = () => {
            this.hide();
        };

        // Content Container
        const content = this.createEl('div', 'flex flex-row h-full p-4 gap-4 relative', win);

        // Structure
        const leftCol = this.createEl('div', 'w-2/5 flex flex-col gap-3 border-r border-gray-800 pr-4', content);
        this.createLeftColumn(leftCol);

        const rightCol = this.createEl('div', 'w-3/5 flex flex-col gap-3 relative', content);
        this.createRightColumn(rightCol);
    }

    createLeftColumn(parent) {
        // Sprite Box
        const spriteBox = this.createEl('div', 'w-full aspect-square border-2 border-dashed border-gray-700 flex items-center justify-center text-7xl bg-black/60 shadow-inner status-sprite-frame', parent);
        this._ui.sprite = this.createEl('span', 'status-sprite', spriteBox);

        // Info Box
        const infoBox = this.createEl('div', 'text-center w-full space-y-1', parent);
        this._ui.name = this.createEl('h2', 'text-2xl text-yellow-400 tracking-widest', infoBox);

        const lvlDiv = this.createEl('div', 'text-[10px] text-gray-400', infoBox);
        lvlDiv.innerText = 'Lv. ';
        this._ui.lvl = this.createEl('span', '', lvlDiv);

        this._ui.temperament = this.createEl('div', 'text-[10px] text-gray-500', infoBox);
    }

    createRightColumn(parent) {
        this.createStatsGrid(parent);
        this.createDetailsGrid(parent);
        this.createActionsList(parent);
        this.createEquipmentLibrary(parent);
    }

    createStatsGrid(parent) {
        const statsGrid = this.createEl('div', 'grid grid-cols-3 gap-3 text-base', parent);

        // HP
        const hpBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', statsGrid);
        this.createEl('div', 'text-[10px] text-gray-500', hpBox).innerText = 'HP';
        this._ui.hp = this.createEl('div', 'text-green-400 text-lg', hpBox);

        // XP
        const xpBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', statsGrid);
        this.createEl('div', 'text-[10px] text-gray-500', xpBox).innerText = 'XP';
        this._ui.xp = this.createEl('div', 'text-blue-400 text-lg', xpBox);

        // Equipment Slot
        const equipBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', statsGrid);
        this.createEl('div', 'text-[10px] text-gray-500', equipBox).innerText = 'EQUIPMENT';
        this._ui.equipSlot = this.createEl('button', 'mt-1 w-full text-left flex items-center justify-between px-2 py-1 border border-gray-600 bg-gray-900 hover:border-yellow-400 hover:text-yellow-200 transition-colors', equipBox);
    }

    createDetailsGrid(parent) {
        const detailsGrid = this.createEl('div', 'grid grid-cols-3 gap-3 text-[10px]', parent);

        // Race
        const raceBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', detailsGrid);
        this.createEl('div', 'text-[10px] text-gray-500', raceBox).innerText = 'RACE';
        this._ui.race = this.createEl('div', 'text-yellow-200 text-sm', raceBox);

        // Elements
        const elemBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', detailsGrid);
        const elemHeader = this.createEl('div', 'flex items-center justify-between text-[10px] text-gray-500', elemBox);
        this.createEl('span', '', elemHeader).innerText = 'ELEMENTS';
        this.createEl('span', 'text-[8px] text-gray-600', elemHeader).innerText = 'future feature';
        this._ui.elements = this.createEl('div', 'text-sm', elemBox);

        // Passive
        const passBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 border border-gray-700', detailsGrid);
        const passHeader = this.createEl('div', 'flex items-center justify-between text-[10px] text-gray-500', passBox);
        this.createEl('span', '', passHeader).innerText = 'PASSIVE';
        this.createEl('span', 'text-[8px] text-gray-600', passHeader).innerText = 'coming soon';
        this._ui.passive = this.createEl('div', 'text-gray-300 text-[10px] leading-tight', passBox);
    }

    createActionsList(parent) {
        const actionsContainer = this.createEl('div', '', parent);
        const actionsHeader = this.createEl('div', 'flex justify-between items-center border-b border-gray-700 pb-1 mb-2', actionsContainer);
        this.createEl('h3', 'text-gray-300 tracking-wide', actionsHeader).innerText = 'ACTIONS';
        this.createEl('span', 'text-[10px] text-gray-500', actionsHeader).innerText = 'Known skills';
        this._ui.actions = this.createEl('div', 'grid grid-cols-2 gap-2 text-[10px]', actionsContainer);

        // Lore
        const loreBox = this.createEl('div', 'rpg-window bg-black/70 px-3 py-2 text-[10px] text-left border border-gray-700', parent);
        this.createEl('div', 'text-gray-400 text-[8px] mb-1', loreBox).innerText = 'LORE';
        this._ui.desc = this.createEl('div', 'leading-tight text-gray-300', loreBox);
    }

    createEquipmentLibrary(parent) {
        const libBox = this.createEl('div', 'flex-grow rpg-window bg-black/70 border border-gray-700 p-3 flex flex-col gap-2 overflow-hidden', parent);
        const libHeader = this.createEl('div', 'flex justify-between items-center', libBox);
        this.createEl('h3', 'text-gray-300 tracking-wide', libHeader).innerText = 'EQUIPMENT LIBRARY';

        this._ui.closePicker = this.createEl('button', 'hidden text-[10px] text-gray-400 hover:text-white', libHeader);
        this._ui.closePicker.innerText = 'Close Picker';
        this._ui.closePicker.onclick = () => this.endEquipFlow();

        this._ui.equipHint = this.createEl('div', 'text-[10px] text-gray-500', libBox);
        this._ui.equipHint.innerText = 'Tap the equipment slot above to browse what this creature can wear.';

        this._ui.equipOptions = this.createEl('div', 'grid grid-cols-2 gap-2 overflow-y-auto pr-1 hidden', libBox);
    }

    /**
     * Sets the unit to display in the modal.
     * @param {Object} unit - The unit to display.
     */
    setUnit(unit) {
        this._unit = unit;
        this.endEquipFlow(); // Reset state
        this.refresh();
    }

    /**
     * Toggles the visibility of the modal.
     */
    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    startEquipFlow(id) {
        this._ui.equipHint.classList.add('hidden');
        this._ui.equipOptions.classList.remove('hidden');
        this._ui.closePicker.classList.remove('hidden');

        // Populate options
        const list = window.$gameParty.roster.map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys(window.$gameParty.inventory.equipment).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];

        const first = this._unit;
        this.equipmentPickerPreset = id ? { id, source: 'inventory' } : null;

        this._ui.equipOptions.innerHTML = '';

        // If empty
        if (options.length === 0) {
             const emptyMsg = this.createEl('div', 'col-span-2 text-gray-500 text-center py-4', this._ui.equipOptions);
             emptyMsg.innerText = 'No equipment available.';
             return;
        }

        options.forEach(opt => {
            const def = Data.equipment[opt.id];
            const name = typeof opt.owner?.name === 'function' ? opt.owner.name() : opt.owner?.name;
            const subtitle = opt.source === 'unit' ? `Held by ${name}` : 'Inventory';

            const cardInner = this.createEl('div', 'rpg-window bg-black/60 border border-gray-700 p-2 cursor-pointer hover:border-yellow-400', this._ui.equipOptions);

            if (this.equipmentPickerPreset && this.equipmentPickerPreset.id === opt.id && this.equipmentPickerPreset.source === opt.source) {
                cardInner.classList.add('border-yellow-500');
            }

            cardInner.innerHTML = `<div class="flex justify-between items-center"><div class="text-yellow-200">${def.name}</div><span class="text-[10px] text-gray-500 uppercase">${opt.source}</span></div><div class="text-[10px] text-gray-400 leading-tight">${subtitle}</div>`;
            cardInner.addEventListener('click', () => {
                if (opt.source === 'unit') this.transferEquipment(first, opt.owner, def.id);
                else this.equipFromInventory(first, def.id);
                this.endEquipFlow();
            });
        });
    }

    endEquipFlow() {
        this._ui.equipHint.classList.remove('hidden');
        this._ui.equipOptions.classList.add('hidden');
        this._ui.closePicker.classList.add('hidden');
    }

    // Legacy support if anything calls closeCenterModal
    closeCenterModal() {
        this.endEquipFlow();
    }

    equipFromInventory(target, equipmentId) {
        if (!window.$gameParty.hasItem(equipmentId)) return;
        const previous = target.equipmentId;

        // Remove item from inventory
        window.$gameParty.loseItem(equipmentId, 1);

        if (previous) {
            window.$gameParty.gainItem(previous, 1);
        }

        target.equipmentId = equipmentId;
        this.recomputeHp(target);

        const name = typeof target.name === 'function' ? target.name() : target.name;
        Log.add(`${name} equipped ${Data.equipment[equipmentId].name}.`);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        this.refresh();
    }

    transferEquipment(target, owner, equipmentId) {
        const previous = target.equipmentId;
        if (previous === equipmentId && owner.uid === target.uid) return;
        if (previous) {
            window.$gameParty.gainItem(previous, 1);
        }
        if (owner && owner.equipmentId === equipmentId) {
            owner.equipmentId = null;
            this.recomputeHp(owner);
        }
        target.equipmentId = equipmentId;
        this.recomputeHp(target);
        const name = typeof target.name === 'function' ? target.name() : target.name;
        const ownerName = typeof owner.name === 'function' ? owner.name() : owner.name;
        Log.add(`${name} borrowed ${Data.equipment[equipmentId].name} from ${ownerName}.`);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        this.refresh();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        window.$gameParty.gainItem(previous, 1);
        this.recomputeHp(unit);
        const name = typeof unit.name === 'function' ? unit.name() : unit.name;
        Log.add(`${name} removed ${Data.equipment[previous].name}.`);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        this.refresh();
    }

    recomputeHp(unit) {
        if (typeof unit.refresh === 'function') {
            unit.refresh();
        } else {
            const maxhp = unit.mhp || 1;
            if (unit.hp > maxhp) unit.hp = maxhp;
        }
    }

    /**
     * Updates the modal content with the current unit's details.
     */
    refresh() {
        if (!this._unit) return;
        const unit = this._unit;
        const def = Data.creatures[unit.speciesId];

        let maxhp = 0;
        if (typeof unit.mhp === 'number') maxhp = unit.mhp;
        else if (typeof unit.mhp === 'function') maxhp = unit.mhp();
        else maxhp = 1;

        const name = typeof unit.name === 'function' ? unit.name() : unit.name;

        // Sprite
        this._ui.sprite.innerHTML = spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');

        // Info
        this._ui.name.innerText = name;
        this._ui.lvl.innerText = unit.level || 1;
        this._ui.temperament.innerText = def.temperament;

        // Stats
        this._ui.hp.innerText = `${unit.hp}/${maxhp}`;
        this._ui.xp.innerText = `${unit.exp ?? 0}`;
        this._ui.race.innerText = def.race;
        this._ui.elements.innerText = (unit.elements || []).join(', ');

        // Passive
        if (this._ui.passive) {
            this._ui.passive.innerHTML = '';
            if (def.passives && def.passives.length > 0) {
                def.passives.forEach(passiveId => {
                    const passive = Data.passives[passiveId];
                    if (passive) {
                        const passiveEl = this.createEl('div', '', this._ui.passive);
                        passiveEl.innerHTML = `<div class="text-yellow-200">${passive.name}</div> <div class="text-[10px] text-gray-400">${passive.description}</div>`;
                    }
                });
            } else {
                this._ui.passive.innerText = '—';
            }
        }

        this._ui.desc.innerText = def.description;

        // Actions
        if (this._ui.actions) {
            this._ui.actions.innerHTML = '';
            // acts is [[skillId, ...], [skillId, ...]] for Game_Actor/creatures
            // Flatten unique skills for display
            const uniqueSkills = new Set();
            (def.acts || []).flat().forEach(id => {
                if (id !== 'wait' && id !== 'guard') uniqueSkills.add(id);
            });

            uniqueSkills.forEach(skillId => {
                const skill = Data.skills[skillId];
                if (skill) {
                    const card = this.createEl('div', 'rpg-window px-3 py-2 bg-black/70 border border-gray-700', this._ui.actions);
                    card.innerHTML = `<div class="text-yellow-200">${skill.name}</div><div class="text-[10px] text-gray-400">${skill.description || ''}</div>`;
                }
            });
        }

        // Equipment Button
        if (this._ui.equipSlot) {
            if (unit.equipmentId) {
                const eq = Data.equipment[unit.equipmentId];
                this._ui.equipSlot.innerText = eq ? eq.name : 'Unknown';
            } else {
                this._ui.equipSlot.innerText = '[ Empty ]';
            }
        }
    }
}

/**
 * Window for displaying the party's inventory.
 */
export class Window_Inventory extends Window_Selectable {
    constructor() {
        super('inventory-modal');
    }

    initialize() {
        super.initialize();
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    refresh() {
        const list = this.root.querySelector('#inventory-list');
        if (!list) return;

        list.innerHTML = '';
        const eqKeys = Object.keys(window.$gameParty.inventory.equipment);

        if (eqKeys.length > 0) {
            const eqTitle = this.createEl('div', 'text-yellow-400 mb-2', list);
            eqTitle.innerText = 'Equipment';

            eqKeys.forEach(id => {
                const count = window.$gameParty.inventory.equipment[id];
                const def = Data.equipment[id];
                const row = this.createEl('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1', list);
                // Inherit font size
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-[10px] text-gray-400">x${count}</span><div class="text-[10px] text-gray-500">${def.description}</div></div>`;

                const btn = this.createEl('button', 'text-[10px] border border-gray-600 px-2 py-1 hover:bg-white hover:text-black', row);
                btn.innerText = 'EQUIP';
                btn.addEventListener('click', () => {
                    window.Game.Windows.CreatureModal.startEquipFlow(id);
                });
            });
        }

        const itemKeys = Object.keys(window.$gameParty.inventory.items);
        if (itemKeys.length > 0) {
            const itmTitle = this.createEl('div', 'text-yellow-400 mt-4 mb-2', list);
            itmTitle.innerText = 'Items';

            itemKeys.forEach(id => {
                const count = window.$gameParty.inventory.items[id];
                const def = Data.items[id];
                const row = this.createEl('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1', list);
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-[10px] text-gray-400">x${count}</span><div class="text-[10px] text-gray-500">${def.description}</div></div>`;

                const btn = this.createEl('button', 'text-[10px] border border-gray-600 px-2 py-1 hover:bg-white hover:text-black', row);
                btn.innerText = 'USE';
                btn.addEventListener('click', () => alert('Item usage coming soon'));
            });
        }
    }
}

/**
 * Window for managing party formation and reserves.
 */
export class Window_PartyMenu extends Window_Selectable {
    constructor() {
        super('party-modal');
    }

    initialize() {
        super.initialize();
        const container = this.root.querySelector('#party-menu-container');
        if (container) {
            container.addEventListener('click', (e) => {
                const target = e.target.closest('.party-menu-slot');
                if (target) {
                    this.onPartySlotClick(target);
                }
            });
        }
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    onPartySlotClick(element) {
        const selected = this.root.querySelector('.party-menu-slot.selected');

        if (selected) {
            const fromUid = selected.dataset.uid;
            const fromIndex = parseInt(selected.dataset.index);
            const fromIsReserved = selected.dataset.isReserved === 'true';

            const toUid = element.dataset.uid;
            const toIndex = parseInt(element.dataset.index);
            const toIsReserved = element.dataset.isReserved === 'true';

            selected.classList.remove('selected');

            if (fromUid === toUid) return;

            const fromUnit = fromIsReserved ? window.$gameParty.roster.find(u => u.uid === fromUid) : window.$gameParty.activeSlots[fromIndex];
            const toUnit = toIsReserved ? window.$gameParty.roster.find(u => u.uid === toUid) : window.$gameParty.activeSlots[toIndex];

            // Enforce party limit
            const activePartySize = window.$gameParty.activeSlots.filter(u => u !== null).length;
            if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= 4) {
                alert("Your active party is full. Swap a member out before adding a new one.");
                return;
            }

            // Swap logic
            if (fromIsReserved && !toIsReserved) { // Reserve -> Active
                window.$gameParty.activeSlots[toIndex] = fromUnit;
                if(toUnit) toUnit.slotIndex = -1;
                fromUnit.slotIndex = toIndex;

            } else if (!fromIsReserved && toIsReserved) { // Active -> Reserve
                window.$gameParty.activeSlots[fromIndex] = toUnit;
                if (toUnit) {
                    toUnit.slotIndex = fromIndex;
                }
                fromUnit.slotIndex = -1;

            } else if (!fromIsReserved && !toIsReserved) { // Active <-> Active
                [window.$gameParty.activeSlots[fromIndex], window.$gameParty.activeSlots[toIndex]] = [toUnit, fromUnit];
                if (fromUnit) fromUnit.slotIndex = toIndex;
                if (toUnit) toUnit.slotIndex = fromIndex;
            }

            this.refresh();
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        } else {
            element.classList.add('selected');
        }
    }

    refresh() {
        const container = this.root.querySelector('#party-menu-container');
        if (!container) return;

        container.innerHTML = '';
        const columns = 7;
        const rows = 5;
        const totalSlots = columns * rows;

        const activeSet = new Set(window.$gameParty.activeSlots.filter(Boolean).map(u => u.uid));
        const reserveUnits = window.$gameParty.roster.filter(u => !activeSet.has(u.uid));
        let reserveUnitIndex = 0;

        for (let i = 0; i < totalSlots; i++) {
            const row = Math.floor(i / columns);
            const col = i % columns;

            let unit = null;
            let index = -1;
            let isReserved = true;
            let isEmptyActiveSlot = false;

            if (row < 2 && col < 3) {
                const activeSlotIndex = row * 3 + col;
                unit = window.$gameParty.activeSlots[activeSlotIndex];
                index = activeSlotIndex;
                isReserved = false;
                if (!unit) {
                    isEmptyActiveSlot = true;
                }
            } else {
                if (reserveUnitIndex < reserveUnits.length) {
                    unit = reserveUnits[reserveUnitIndex];
                    reserveUnitIndex++;
                }
            }

            const div = document.createElement('div');
            let baseClasses = 'party-menu-slot relative flex flex-col p-1';
            if (!isReserved) {
                baseClasses += ' bg-gray-800/50';
            }
            div.className = baseClasses;

            div.dataset.uid = unit ? unit.uid : `empty_${index}`;
            div.dataset.index = index;
            div.dataset.isReserved = isReserved;

            if (unit) {
                div.innerHTML = renderCreaturePanel(unit);
            } else {
                 if (isEmptyActiveSlot) {
                    div.innerHTML = '<span class="m-auto text-gray-600 text-[10px]">EMPTY</span>';
                 } else {
                    div.style.visibility = 'hidden';
                 }
            }
            container.appendChild(div);
        }
    }
}
