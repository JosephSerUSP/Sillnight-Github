import { Data } from '../../assets/data/data.js';
import { GameState } from '../state.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';
import { Log } from '../log.js';

/**
 * Window for displaying creature details and managing equipment.
 */
export class Window_CreatureModal extends Window_Selectable {
    constructor() {
        super('creature-modal');
    }

    initialize() {
        super.initialize();
        this._unit = null;
        this.root.addEventListener('click', (e) => {
             if (e.target.id === 'modal-equip-slot' || e.target.closest('#modal-equip-slot')) {
                if (this._unit && this._unit.equipmentId) {
                    this.unequipUnit(this._unit);
                } else if (this._unit) {
                    this.startEquipFlow(null);
                }
             }
        });
    }

    /**
     * Sets the unit to display in the modal.
     * @param {Object} unit - The unit to display.
     */
    setUnit(unit) {
        this._unit = unit;
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

    /**
     * Opens the equipment selection modal.
     * @param {string|null} id - Pre-selected equipment ID (optional).
     */
    startEquipFlow(id) {
        const box = document.getElementById('center-modal');
        box.classList.remove('hidden');
        box.classList.add('pointer-events-auto');

        const list = GameState.roster.map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys(GameState.inventory.equipment).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];

        const first = this._unit || GameState.party.activeSlots.find(Boolean);
        this.equipmentPickerPreset = id ? { id, source: 'inventory' } : null;

        box.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'rpg-window w-1/2 bg-black/90 p-4 border border-gray-700 text-sm';
        card.innerHTML = `<div class="flex justify-between items-center mb-3"><div class="text-lg text-yellow-300">Choose a creature to equip ${id ? Data.equipment[id].name : 'item'}</div><button class="text-red-500" id="btn-cancel-equip">Cancel</button></div>`;
        card.querySelector('#btn-cancel-equip').onclick = () => this.closeCenterModal();

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-2';

        options.forEach(opt => {
            const def = Data.equipment[opt.id];
            const name = typeof opt.owner?.name === 'function' ? opt.owner.name() : opt.owner?.name;
            const subtitle = opt.source === 'unit' ? `Held by ${name}` : 'Inventory';
            const cardInner = document.createElement('div');
            cardInner.className = 'rpg-window bg-black/60 border border-gray-700 p-2 cursor-pointer hover:border-yellow-400';
            if (this.equipmentPickerPreset && this.equipmentPickerPreset.id === opt.id && this.equipmentPickerPreset.source === opt.source) {
                cardInner.classList.add('border-yellow-500');
            }
            cardInner.innerHTML = `<div class="flex justify-between items-center"><div class="text-yellow-200">${def.name}</div><span class="text-xs text-gray-500 uppercase">${opt.source}</span></div><div class="text-xs text-gray-400 leading-tight">${subtitle}</div>`;
            cardInner.addEventListener('click', () => {
                const target = first;
                if (!target) return;
                if (opt.source === 'unit') this.transferEquipment(target, opt.owner, def.id);
                else this.equipFromInventory(target, def.id);
                this.closeCenterModal();
            });
            grid.appendChild(cardInner);
        });
        card.appendChild(grid);
        box.appendChild(card);
    }

    closeCenterModal() {
        const modal = document.getElementById('center-modal');
        modal.classList.add('hidden');
        modal.innerHTML = '';
    }

    equipFromInventory(target, equipmentId) {
        const count = GameState.inventory.equipment[equipmentId] || 0;
        if (count <= 0) return;
        const previous = target.equipmentId;
        if (previous) {
            GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
        }
        GameState.inventory.equipment[equipmentId] = count - 1;
        if (GameState.inventory.equipment[equipmentId] <= 0) delete GameState.inventory.equipment[equipmentId];
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
            GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
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
        GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
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

        const setText = (sel, txt) => { const el = this.root.querySelector(sel); if(el) el.innerText = txt; };
        const setHTML = (sel, htm) => { const el = this.root.querySelector(sel); if(el) el.innerHTML = htm; };

        let maxhp = 0;
        if (typeof unit.mhp === 'number') maxhp = unit.mhp;
        else if (typeof unit.mhp === 'function') maxhp = unit.mhp();
        else maxhp = 1;

        const name = typeof unit.name === 'function' ? unit.name() : unit.name;

        setHTML('#modal-sprite', spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite'));
        setText('#modal-name', name);
        setText('#modal-lvl', unit.level || 1);
        setText('#modal-temperament', def.temperament);
        setText('#modal-hp', `${unit.hp}/${maxhp}`);
        setText('#modal-xp', `${unit.exp ?? 0}`);
        setText('#modal-race', def.race);
        setText('#modal-elements', (unit.elements || []).join(', '));

        const passiveContainer = this.root.querySelector('#modal-passive');
        if (passiveContainer) {
            if (def.passives && def.passives.length > 0) {
                passiveContainer.innerHTML = '';
                def.passives.forEach(passiveId => {
                    const passive = Data.passives[passiveId];
                    if (passive) {
                        const passiveEl = document.createElement('div');
                        passiveEl.className = 'text-xs';
                        passiveEl.innerHTML = `<div class="text-yellow-200">${passive.name}</div> <div class="text-gray-400">${passive.description}</div>`;
                        passiveContainer.appendChild(passiveEl);
                    }
                });
            } else {
                passiveContainer.innerText = '—';
            }
        }

        setText('#modal-desc', def.description);

        const actions = this.root.querySelector('#modal-actions');
        if (actions) {
            actions.innerHTML = '';
            (def.acts || []).forEach(act => {
                const card = document.createElement('div');
                card.className = 'rpg-window px-3 py-2 bg-black/70 border border-gray-700';
                card.innerHTML = `<div class="text-yellow-200">${act.name}</div><div class="text-xs text-gray-400">${act.description}</div>`;
                actions.appendChild(card);
            });
        }

        const equipBtn = this.root.querySelector('#modal-equip-slot');
        if (equipBtn) {
            if (unit.equipmentId) {
                const eq = Data.equipment[unit.equipmentId];
                equipBtn.innerText = eq ? eq.name : 'Unknown';
            } else {
                equipBtn.innerText = '[ Empty ]';
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
        const eqKeys = Object.keys(GameState.inventory.equipment);

        if (eqKeys.length > 0) {
            const eqTitle = this.createEl('div', 'text-yellow-400 mb-2', list);
            eqTitle.innerText = 'Equipment';

            eqKeys.forEach(id => {
                const count = GameState.inventory.equipment[id];
                const def = Data.equipment[id];
                const row = this.createEl('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1', list);
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;

                const btn = this.createEl('button', 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black', row);
                btn.innerText = 'EQUIP';
                btn.addEventListener('click', () => {
                    window.Game.Windows.CreatureModal.startEquipFlow(id);
                });
            });
        }

        const itemKeys = Object.keys(GameState.inventory.items);
        if (itemKeys.length > 0) {
            const itmTitle = this.createEl('div', 'text-yellow-400 mt-4 mb-2', list);
            itmTitle.innerText = 'Items';

            itemKeys.forEach(id => {
                const count = GameState.inventory.items[id];
                const def = Data.items[id];
                const row = this.createEl('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1', list);
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;

                const btn = this.createEl('button', 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black', row);
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

            const fromUnit = fromIsReserved ? GameState.roster.find(u => u.uid === fromUid) : GameState.party.activeSlots[fromIndex];
            const toUnit = toIsReserved ? GameState.roster.find(u => u.uid === toUid) : GameState.party.activeSlots[toIndex];

            // Enforce party limit
            const activePartySize = GameState.party.activeSlots.filter(u => u !== null).length;
            if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= 4) {
                alert("Your active party is full. Swap a member out before adding a new one.");
                return;
            }

            // Swap logic
            if (fromIsReserved && !toIsReserved) { // Reserve -> Active
                GameState.party.activeSlots[toIndex] = fromUnit;
                if(toUnit) toUnit.slotIndex = -1;
                fromUnit.slotIndex = toIndex;

            } else if (!fromIsReserved && toIsReserved) { // Active -> Reserve
                GameState.party.activeSlots[fromIndex] = toUnit;
                if (toUnit) {
                    toUnit.slotIndex = fromIndex;
                }
                fromUnit.slotIndex = -1;

            } else if (!fromIsReserved && !toIsReserved) { // Active <-> Active
                [GameState.party.activeSlots[fromIndex], GameState.party.activeSlots[toIndex]] = [toUnit, fromUnit];
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

        const activeSet = new Set(GameState.party.activeSlots.filter(Boolean).map(u => u.uid));
        const reserveUnits = GameState.roster.filter(u => !activeSet.has(u.uid));
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
                unit = GameState.party.activeSlots[activeSlotIndex];
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
                    div.innerHTML = '<span class="m-auto text-gray-600 text-xs">EMPTY</span>';
                 } else {
                    div.style.visibility = 'hidden';
                 }
            }
            container.appendChild(div);
        }
    }
}
