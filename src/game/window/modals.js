import { Data } from '../../assets/data/data.js';
import { $gameParty } from '../globals.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';
import { Log } from '../log.js';

export class Window_CreatureModal extends Window_Selectable {
    constructor() {
        super(document.getElementById('creature-modal'));
        this._unit = null;
        this.root.querySelector('#modal-equip-slot').addEventListener('click', () => {
            if (this._unit.equipmentId) {
                this.unequipUnit(this._unit);
            } else {
                this.startEquipFlow(null);
            }
        });
    }

    setUnit(unit) {
        this._unit = unit;
        this.refresh();
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    startEquipFlow(id) {
        const box = document.getElementById('center-modal');
        box.classList.remove('hidden');
        box.classList.add('pointer-events-auto');
        const list = $gameParty.roster().map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys($gameParty.equipment()).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];
        const first = this._unit || $gameParty.actors().find(Boolean);
        this.equipmentPickerPreset = id ? { id, source: 'inventory' } : null;
        box.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'rpg-window w-1/2 bg-black/90 p-4 border border-gray-700 text-sm';
        card.innerHTML = `<div class="flex justify-between items-center mb-3"><div class="text-lg text-yellow-300">Choose a creature to equip ${id ? Data.equipment[id].name : 'item'}</div><button class="text-red-500" onclick="window.Game.Windows.CreatureModal.closeCenterModal()">Cancel</button></div>`;
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-2';
        options.forEach(opt => {
            const def = Data.equipment[opt.id];
            const subtitle = opt.source === 'unit' ? `Held by ${opt.owner.name()}` : 'Inventory';
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
        document.getElementById('center-modal').classList.add('hidden');
        document.getElementById('center-modal').innerHTML = '';
    }

    equipFromInventory(target, equipmentId) {
        const count = $gameParty.equipment()[equipmentId] || 0;
        if (count <= 0) return;
        const previous = target.equipmentId;
        if (previous) {
            $gameParty.gainEquipment(previous, 1);
        }
        $gameParty.loseEquipment(equipmentId, 1);
        target.equipmentId = equipmentId;
        this.recomputeHp(target);
        Log.add(`${target.name()} equipped ${Data.equipment[equipmentId].name}.`);
        window.Game.Windows.Party.refresh();
        this.refresh();
    }

    transferEquipment(target, owner, equipmentId) {
        const previous = target.equipmentId;
        if (previous === equipmentId && owner.uid === target.uid) return;
        if (previous) {
            $gameParty.gainEquipment(previous, 1);
        }
        if (owner && owner.equipmentId === equipmentId) {
            owner.equipmentId = null;
            this.recomputeHp(owner);
        }
        target.equipmentId = equipmentId;
        this.recomputeHp(target);
        Log.add(`${target.name()} borrowed ${Data.equipment[equipmentId].name} from ${owner.name()}.`);
        window.Game.Windows.Party.refresh();
        this.refresh();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        $gameParty.gainEquipment(previous, 1);
        this.recomputeHp(unit);
        Log.add(`${unit.name()} removed ${Data.equipment[previous].name}.`);
        window.Game.Windows.Party.refresh();
        this.refresh();
    }

    recomputeHp(unit) {
        const maxhp = unit.mhp();
        if (unit.hp > maxhp) unit.hp = maxhp;
    }

    refresh() {
        if (!this._unit) return;
        const unit = this._unit;
        const def = Data.creatures[unit.speciesId];
        const maxhp = unit.mhp();

        this.root.querySelector('#modal-sprite').innerHTML = spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');
        this.root.querySelector('#modal-name').innerText = unit.name();
        this.root.querySelector('#modal-lvl').innerText = unit.level;
        this.root.querySelector('#modal-temperament').innerText = def.temperament;
        this.root.querySelector('#modal-hp').innerText = `${unit.hp}/${maxhp}`;
        this.root.querySelector('#modal-xp').innerText = `${unit.exp ?? 0}`;
        this.root.querySelector('#modal-race').innerText = def.race;
        this.root.querySelector('#modal-elements').innerText = (unit.elements || []).join(', ');
        const passiveContainer = this.root.querySelector('#modal-passive');
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
        this.root.querySelector('#modal-desc').innerText = def.description;
        const actions = this.root.querySelector('#modal-actions');
        actions.innerHTML = '';
        (def.acts || []).forEach(act => {
            const card = document.createElement('div');
            card.className = 'rpg-window px-3 py-2 bg-black/70 border border-gray-700';
            card.innerHTML = `<div class="text-yellow-200">${act.name}</div><div class="text-xs text-gray-400">${act.description}</div>`;
            actions.appendChild(card);
        });
        const equipBtn = this.root.querySelector('#modal-equip-slot');
        if (unit.equipmentId) {
            const eq = Data.equipment[unit.equipmentId];
            equipBtn.innerText = eq.name;
        } else {
            equipBtn.innerText = '[ Empty ]';
        }
    }
}

export class Window_Inventory extends Window_Selectable {
    constructor() {
        super(document.getElementById('inventory-modal'));
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
        list.innerHTML = '';
        const eqKeys = Object.keys($gameParty.equipment());
        if (eqKeys.length > 0) {
            const eqTitle = document.createElement('div');
            eqTitle.className = 'text-yellow-400 mb-2';
            eqTitle.innerText = 'Equipment';
            list.appendChild(eqTitle);
            eqKeys.forEach(id => {
                const count = $gameParty.equipment()[id];
                const def = Data.equipment[id];
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'EQUIP';
                btn.addEventListener('click', () => {
                    window.Game.Windows.CreatureModal.startEquipFlow(id);
                });
                row.appendChild(btn);
                list.appendChild(row);
            });
        }
        const itemKeys = Object.keys($gameParty.items());
        if (itemKeys.length > 0) {
            const itmTitle = document.createElement('div');
            itmTitle.className = 'text-yellow-400 mt-4 mb-2';
            itmTitle.innerText = 'Items';
            list.appendChild(itmTitle);
            itemKeys.forEach(id => {
                const count = $gameParty.items()[id];
                const def = Data.items[id];
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'USE';
                btn.addEventListener('click', () => alert('Item usage coming soon'));
                row.appendChild(btn);
                list.appendChild(row);
            });
        }
    }
}

export class Window_PartyMenu extends Window_Selectable {
    constructor() {
        super(document.getElementById('party-modal'));
        this.root.querySelector('#party-menu-container').addEventListener('click', (e) => {
            const target = e.target.closest('.party-menu-slot');
            if (target) {
                this.onPartySlotClick(target);
            }
        });
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

            const fromUnit = fromIsReserved ? $gameParty.roster().find(u => u.uid === fromUid) : $gameParty.actors()[fromIndex];
            const toUnit = toIsReserved ? $gameParty.roster().find(u => u.uid === toUid) : $gameParty.actors()[toIndex];

            // Enforce party limit
            const activePartySize = $gameParty.actors().filter(u => u !== null).length;
            if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= 4) {
                alert("Your active party is full. Swap a member out before adding a new one.");
                return;
            }

            // Swap logic
            if (fromIsReserved && !toIsReserved) { // Reserve -> Active
                $gameParty.actors()[toIndex] = fromUnit;
                if(toUnit) toUnit.slotIndex = -1;
                fromUnit.slotIndex = toIndex;

            } else if (!fromIsReserved && toIsReserved) { // Active -> Reserve
                $gameParty.actors()[fromIndex] = toUnit;
                toUnit.slotIndex = fromIndex;
                fromUnit.slotIndex = -1;

            } else if (!fromIsReserved && !toIsReserved) { // Active <-> Active
                [$gameParty.actors()[fromIndex], $gameParty.actors()[toIndex]] = [toUnit, fromUnit];
                if (fromUnit) fromUnit.slotIndex = toIndex;
                if (toUnit) toUnit.slotIndex = fromIndex;
            }

            this.refresh();
            window.Game.Windows.Party.refresh();
        } else {
            element.classList.add('selected');
        }
    }

    refresh() {
        const container = this.root.querySelector('#party-menu-container');
        container.innerHTML = '';
        const columns = 7;
        const rows = 5;
        const totalSlots = columns * rows;

        const activeSet = new Set($gameParty.actors().filter(Boolean).map(u => u.uid));
        const reserveUnits = $gameParty.roster().filter(u => !activeSet.has(u.uid));
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
                unit = $gameParty.actors()[activeSlotIndex];
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
