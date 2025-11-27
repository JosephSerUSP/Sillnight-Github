// Window and shell UI layer (similar to rmmz_windows.js).
// All DOM-related code for the persistent PC-98 shell lives here. Add new window
// types by subclassing Window_Base and wiring them into the ShellUI container.

import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { getXpProgress } from './objects.js';
import { resolveAssetPath } from './core.js';

export class Window_Base {
    constructor(root) {
        this.root = root || document.createElement('div');
    }
    open(parent) {
        (parent || document.body).appendChild(this.root);
        this.show();
    }
    close() {
        this.root.remove();
    }
    show() { this.root.classList.remove('hidden'); }
    hide() { this.root.classList.add('hidden'); }
    refresh() {}
}

export class Window_Selectable extends Window_Base {
    constructor(root) {
        super(root);
        this.items = [];
        this.index = 0;
    }
    select(index) {
        this.index = Math.max(0, Math.min(this.items.length - 1, index));
        this.refresh();
    }
}

class ShellUI {
    constructor() {
        this.activeModalUnit = null;
        this.equipmentPickerPreset = null;
        this.bindings = {
            onRequestTurn: null,
            onResumeTurn: null
        };
    }

    bindTurnHandlers(handlers) {
        this.bindings = { ...this.bindings, ...handlers };
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        const url = resolveAssetPath(unit?.spriteAsset);
        if (url) {
            return `<img src="${url}" alt="${unit?.name() || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
        }
        return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
    }

    updateHUD() {
        document.getElementById('hud-floor').innerText = $gameSystem.floor;
        document.getElementById('hud-gold').innerText = $gameParty.gold;
    }

    renderCreaturePanel(unit) {
        if (!unit) return '';

        const maxhp = unit.getMaxHp();
        const hpPct = (unit.hp / maxhp) * 100;
        const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';
        const xpPct = getXpProgress(unit);

        return `
            <div class="flex justify-between text-xs text-gray-300">
                <span>${unit.name()}</span> <span class="text-[10px]">Lv${unit.level}</span>
            </div>
            <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${this.spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-3xl')}</div>
            <div class="mt-auto w-full space-y-0.5">
            <div class="text-[10px] text-right text-gray-500">${unit.hp}/${maxhp}</div>
                <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
                <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
            </div>

        `;
    }

    renderParty() {
        const grid = document.getElementById('party-grid');
        grid.innerHTML = '';
        $gameParty.activeSlots.forEach((u, i) => {
            const div = document.createElement('div');
            div.className = 'party-slot relative flex flex-col p-1';
            if (u) {
                div.innerHTML = this.renderCreaturePanel(u);
                div.onclick = () => {
                    if (window.$gameBattle && $gameBattle.phase === 'PLAYER_INPUT') {
                        const selected = document.querySelector('.party-slot.selected');
                        if (selected) {
                            const idx = parseInt(selected.dataset.idx);
                            selected.classList.remove('selected');
                            if (idx !== i) {
                                $gameParty.swapOrder(idx, i);
                                this.renderParty();
                            }
                        } else {
                            div.classList.add('selected');
                            div.dataset.idx = i;
                        }
                    } else {
                        this.showCreatureModal(u);
                    }
                };
            } else {
                div.innerHTML = '<span class="m-auto text-gray-800 text-xs">EMPTY</span>';
                div.onclick = () => {
                    if (window.$gameBattle && $gameBattle.phase === 'PLAYER_INPUT') {
                        const selected = document.querySelector('.party-slot.selected');
                        if (selected) {
                            const idx = parseInt(selected.dataset.idx);
                            $gameParty.swapOrder(idx, i);
                            this.renderParty();
                        }
                    }
                };
            }
            grid.appendChild(div);
        });
        this.updateHUD();
    }

    toggleFormationMode() {
        if ($gameSystem.uiMode === 'BATTLE') return;
        $gameSystem.formationMode = !$gameSystem.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if ($gameSystem.formationMode) {
            ind.innerText = 'FORMATION MODE';
            ind.classList.remove('hidden');
            btn.classList.add('bg-yellow-900', 'text-white');
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            const sel = document.querySelector('.party-slot.selected');
            if (sel) sel.classList.remove('selected');
        }
    }

    toggleParty() {
        const modal = document.getElementById('party-modal');
        const isOpen = !modal.classList.contains('hidden');
        modal.classList.toggle('hidden');

        if (!isOpen) {
            this.renderPartyMenu();
        } else {
            // Clear selection when closing
            const selected = document.querySelector('.party-menu-slot.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
        }
    }

    renderPartyMenu() {
        const container = document.getElementById('party-menu-container');
        container.innerHTML = '';
        const columns = 7;
        const rows = 5;
        const totalSlots = columns * rows;

        const activeSet = new Set($gameParty.activeMembers.filter(Boolean).map(u => u.uid));
        const reserveUnits = $gameParty.members.filter(u => !activeSet.has(u.uid));
        let reserveUnitIndex = 0;

        for (let i = 0; i < totalSlots; i++) {
            const row = Math.floor(i / columns);
            const col = i % columns;

            let unit = null;
            let index = -1;
            let isReserved = true;
            let isEmptyActiveSlot = false;

            // Determine if the slot is for an active party member
            if (row < 2 && col < 3) {
                const activeSlotIndex = row * 3 + col;
                unit = $gameParty.activeMembers[activeSlotIndex];
                index = activeSlotIndex;
                isReserved = false;
                if (!unit) {
                    isEmptyActiveSlot = true;
                }
            } else {
                // This slot is for a reserve unit, if available
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
                div.innerHTML = this.renderCreaturePanel(unit);
                 div.onclick = () => this.onPartySlotClick(div);
            } else {
                 if (isEmptyActiveSlot) {
                    div.innerHTML = '<span class="m-auto text-gray-600 text-xs">EMPTY</span>';
                    div.onclick = () => this.onPartySlotClick(div);
                 } else {
                    // Empty reserve slot, make it invisible and non-interactive
                    div.style.visibility = 'hidden';
                 }
            }

            container.appendChild(div);
        }
    }

    onPartySlotClick(element) {
        const selected = document.querySelector('.party-menu-slot.selected');

        if (selected) {
            const fromUid = selected.dataset.uid;
            const fromIndex = parseInt(selected.dataset.index);
            const fromIsReserved = selected.dataset.isReserved === 'true';

            const toUid = element.dataset.uid;
            const toIndex = parseInt(element.dataset.index);
            const toIsReserved = element.dataset.isReserved === 'true';

            selected.classList.remove('selected');

            if (fromUid === toUid) return;

            const fromUnit = fromIsReserved ? $gameParty.members.find(u => u.uid === fromUid) : $gameParty.activeMembers[fromIndex];
            const toUnit = toIsReserved ? $gameParty.members.find(u => u.uid === toUid) : $gameParty.activeMembers[toIndex];

            // Enforce party limit
            const activePartySize = $gameParty.activeMembers.filter(u => u !== null).length;
            if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= 4) {
                alert("Your active party is full. Swap a member out before adding a new one.");
                return;
            }

            // Swap logic
            if (fromIsReserved && !toIsReserved) { // Reserve -> Active
                $gameParty.swapToActive(fromUnit, toIndex);
            } else if (!fromIsReserved && toIsReserved) { // Active -> Reserve
                $gameParty.swapToReserve(fromUnit, toUnit);
            } else if (!fromIsReserved && !toIsReserved) { // Active <-> Active
                $gameParty.swapOrder(fromIndex, toIndex);
            }

            this.renderPartyMenu();
            this.renderParty();
        } else {
            element.classList.add('selected');
        }
    }

    toggleInventory() {
        const modal = document.getElementById('inventory-modal');
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            const list = document.getElementById('inventory-list');
            list.innerHTML = '';
            const eqKeys = Object.keys($gameParty.equipment);
            if (eqKeys.length > 0) {
                const eqTitle = document.createElement('div');
                eqTitle.className = 'text-yellow-400 mb-2';
                eqTitle.innerText = 'Equipment';
                list.appendChild(eqTitle);
                eqKeys.forEach(id => {
                    const count = $gameParty.equipment[id];
                    const def = Data.equipment[id];
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                    row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                    const btn = document.createElement('button');
                    btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                    btn.innerText = 'EQUIP';
                    btn.onclick = () => {
                        this.startEquipFlow(id);
                    };
                    row.appendChild(btn);
                    list.appendChild(row);
                });
            }
            const itemKeys = Object.keys($gameParty.items);
            if (itemKeys.length > 0) {
                const itmTitle = document.createElement('div');
                itmTitle.className = 'text-yellow-400 mt-4 mb-2';
                itmTitle.innerText = 'Items';
                list.appendChild(itmTitle);
                itemKeys.forEach(id => {
                    const count = $gameParty.items[id];
                    const def = Data.items[id];
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                    row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                    const btn = document.createElement('button');
                    btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                    btn.innerText = 'USE';
                    btn.onclick = () => alert('Item usage coming soon');
                    row.appendChild(btn);
                    list.appendChild(row);
                });
            }
        }
    }

    showCreatureModal(unit) {
        this.activeModalUnit = unit;
        document.getElementById('creature-modal').classList.remove('hidden');
        this.renderStatusModal();
    }

    renderStatusModal() {
        const unit = this.activeModalUnit;
        if (!unit) return;
        const def = Data.creatures[unit.speciesId];
        const maxhp = unit.getMaxHp();
        document.getElementById('modal-sprite').innerHTML = this.spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');
        document.getElementById('modal-name').innerText = unit.name();
        document.getElementById('modal-lvl').innerText = unit.level;
        document.getElementById('modal-temperament').innerText = def.temperament;
        document.getElementById('modal-hp').innerText = `${unit.hp}/${maxhp}`;
        document.getElementById('modal-xp').innerText = `${unit.exp ?? 0}`;
        document.getElementById('modal-race').innerText = def.race;
        document.getElementById('modal-elements').innerText = (unit.elements || []).join(', ');
        const passiveContainer = document.getElementById('modal-passive');
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
        document.getElementById('modal-desc').innerText = def.description;
        const actions = document.getElementById('modal-actions');
        actions.innerHTML = '';
        (def.acts || []).forEach(act => {
            const card = document.createElement('div');
            card.className = 'rpg-window px-3 py-2 bg-black/70 border border-gray-700';
            card.innerHTML = `<div class="text-yellow-200">${act.name}</div><div class="text-xs text-gray-400">${act.description}</div>`;
            actions.appendChild(card);
        });
        const equipBtn = document.getElementById('modal-equip-slot');
        if (unit.equipmentId) {
            const eq = Data.equipment[unit.equipmentId];
            equipBtn.innerText = eq.name;
            equipBtn.onclick = () => this.unequipUnit(unit);
        } else {
            equipBtn.innerText = '[ Empty ]';
            equipBtn.onclick = () => this.startEquipFlow(null);
        }
    }

    startEquipFlow(id) {
        const box = document.getElementById('center-modal');
        box.classList.remove('hidden');
        box.classList.add('pointer-events-auto');
        const list = $gameParty.members.map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys($gameParty.equipment).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];
        const first = this.activeModalUnit || $gameParty.activeMembers.find(Boolean);
        this.equipmentPickerPreset = id ? { id, source: 'inventory' } : null;
        box.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'rpg-window w-1/2 bg-black/90 p-4 border border-gray-700 text-sm';
        card.innerHTML = `<div class="flex justify-between items-center mb-3"><div class="text-lg text-yellow-300">Choose a creature to equip ${id ? Data.equipment[id].name : 'item'}</div><button class="text-red-500" onclick="Game.Views.UI.closeCenterModal()">Cancel</button></div>`;
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-2';
        options.forEach(opt => {
            const def = Data.equipment[opt.id];
            const subtitle = opt.source === 'unit' ? `Held by ${opt.owner.name}` : 'Inventory';
            const cardInner = document.createElement('div');
            cardInner.className = 'rpg-window bg-black/60 border border-gray-700 p-2 cursor-pointer hover:border-yellow-400';
            if (this.equipmentPickerPreset && this.equipmentPickerPreset.id === opt.id && this.equipmentPickerPreset.source === opt.source) {
                cardInner.classList.add('border-yellow-500');
            }
            cardInner.innerHTML = `<div class="flex justify-between items-center"><div class="text-yellow-200">${def.name}</div><span class="text-xs text-gray-500 uppercase">${opt.source}</span></div><div class="text-xs text-gray-400 leading-tight">${subtitle}</div>`;
            cardInner.onclick = () => {
                const target = first;
                if (!target) return;
                if (opt.source === 'unit') this.transferEquipment(target, opt.owner, def.id);
                else this.equipFromInventory(target, def.id);
                this.closeCenterModal();
            };
            grid.appendChild(cardInner);
        });
        card.appendChild(grid);
        box.appendChild(card);
    }

    closeCenterModal() {
        document.getElementById('center-modal').classList.add('hidden');
        document.getElementById('center-modal').innerHTML = '';
    }

    closeEquipmentPicker() {
        document.getElementById('equipment-empty-hint').classList.remove('hidden');
        document.getElementById('modal-close-picker').classList.add('hidden');
        document.getElementById('equipment-options').innerHTML = '';
        this.equipmentPickerPreset = null;
    }

    equipFromInventory(target, equipmentId) {
        $gameParty.equipItem(target, equipmentId);
        this.recomputeHp(target);
        Log.add(`${target.name()} equipped ${Data.equipment[equipmentId].name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    transferEquipment(target, owner, equipmentId) {
        $gameParty.transferEquipment(target, owner, equipmentId);
        this.recomputeHp(target);
        this.recomputeHp(owner);
        Log.add(`${target.name()} borrowed ${Data.equipment[equipmentId].name} from ${owner.name()}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        $gameParty.unequipItem(unit);
        this.recomputeHp(unit);
        Log.add(`${unit.name()} removed ${Data.equipment[previous].name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    recomputeHp(unit) {
        const maxhp = unit.getMaxHp();
        if (unit.hp > maxhp) unit.hp = maxhp;
    }

    switchScene(toBattle, onExploreRefresh) {
        const swipe = document.getElementById('swipe-overlay');
        swipe.className = 'swipe-down';
        setTimeout(() => {
            const elExp = document.getElementById('explore-layer');
            const elBat = document.getElementById('battle-layer');
            const ctrls = document.getElementById('battle-controls');
            const eCtrls = document.getElementById('explore-controls');
            if (toBattle) {
                elExp.classList.remove('active-scene'); elExp.classList.add('hidden-scene');
                elBat.classList.remove('hidden-scene'); elBat.classList.add('active-scene');
                ctrls.classList.remove('hidden'); eCtrls.classList.add('hidden');
            } else {
                elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                if (onExploreRefresh) onExploreRefresh();
            }
            swipe.className = 'swipe-clear';
            setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
        }, 600);
    }

    showBanner(text) {
        const banner = document.getElementById('battle-banner');
        document.getElementById('banner-text').innerText = text;
        banner.classList.remove('opacity-0');
        setTimeout(() => banner.classList.add('opacity-0'), 2500);
    }

    togglePlayerTurn(active) {
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-player-turn');
        if (active) {
            ind.innerText = 'PLAYER INPUT PHASE';
            ind.classList.remove('hidden');
            btn.innerText = 'RESUME (SPACE)';
            btn.classList.add('bg-yellow-900', 'text-white');
            btn.onclick = () => this.bindings.onResumeTurn && this.bindings.onResumeTurn();
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            btn.innerText = 'STOP ROUND (SPACE)';
            btn.onclick = () => this.bindings.onRequestTurn && this.bindings.onRequestTurn();
        }
    }

    showModal(html) {
        const m = document.getElementById('center-modal');
        m.innerHTML = html;
        m.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('center-modal').classList.add('hidden');
    }

    closeEvent() {
        document.getElementById('event-modal').classList.add('hidden');
    }
}

export const UI = new ShellUI();
