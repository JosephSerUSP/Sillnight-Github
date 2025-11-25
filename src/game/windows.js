// Window and shell UI layer (similar to rmmz_windows.js).
// All DOM-related code for the persistent PC-98 shell lives here. Add new window
// types by subclassing Window_Base and wiring them into the ShellUI container.

import { Data } from '../assets/data/data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { getMaxHp } from './objects.js';
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
        this.hasSwitchedOnce = false;
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
            return `<img src="${url}" alt="${unit?.name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
        }
        return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
    }

    updateHUD() {
        document.getElementById('hud-floor').innerText = GameState.run.floor;
        document.getElementById('hud-gold').innerText = GameState.run.gold;
    }

    renderParty() {
        const grid = document.getElementById('party-grid');
        grid.innerHTML = '';
        GameState.party.activeSlots.forEach((u, i) => {
            const div = document.createElement('div');
            div.className = 'party-slot relative flex flex-col p-1';
            if (u) {
                const maxhp = getMaxHp(u);
                const hpPct = (u.hp / maxhp) * 100;
                const color = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';
                div.innerHTML = `
                        <div class="flex justify-between text-xs text-gray-300">
                            <span>${u.name}</span> <span class="text-[10px]">Lv${u.level}</span>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${this.spriteMarkup(u, 'h-16 w-16 object-contain', '', 'text-3xl')}</div>
                        <div class="mt-auto w-full h-1 bg-gray-800"><div class="${color} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
                        <div class="text-[10px] text-right text-gray-500">${u.hp}/${maxhp}</div>
                    `;
                div.onclick = () => {
                    if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
                        const selected = document.querySelector('.party-slot.selected');
                        if (selected) {
                            const idx = parseInt(selected.dataset.idx);
                            selected.classList.remove('selected');
                            if (idx !== i) {
                                const u1 = GameState.party.activeSlots[idx];
                                const u2 = GameState.party.activeSlots[i];
                                GameState.party.activeSlots[idx] = u2;
                                GameState.party.activeSlots[i] = u1;
                                if (GameState.party.activeSlots[idx]) GameState.party.activeSlots[idx].slotIndex = idx;
                                if (GameState.party.activeSlots[i]) GameState.party.activeSlots[i].slotIndex = i;
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
                    if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
                        const selected = document.querySelector('.party-slot.selected');
                        if (selected) {
                            const idx = parseInt(selected.dataset.idx);
                            const u1 = GameState.party.activeSlots[idx];
                            GameState.party.activeSlots[idx] = null;
                            GameState.party.activeSlots[i] = u1;
                            if (u1) u1.slotIndex = i;
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
        if (GameState.ui.mode === 'BATTLE') return;
        GameState.ui.formationMode = !GameState.ui.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if (GameState.ui.formationMode) {
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
            const reserveEl = document.getElementById('reserve-list');
            const activeEl = document.getElementById('active-list');
            reserveEl.innerHTML = '';
            activeEl.innerHTML = '';
            const activeSet = new Set(GameState.party.activeSlots.filter(Boolean).map(u => u.uid));
            const reserve = GameState.roster.filter(u => !activeSet.has(u.uid));
            reserve.forEach(u => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                row.innerHTML = `<div class="flex items-center gap-2">${this.spriteMarkup(u, 'h-10 w-10 object-contain')}<div><div class="text-yellow-100">${u.name}</div><div class="text-xs text-gray-500">Lv${u.level}</div></div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'SET';
                btn.onclick = () => {
                    const empty = GameState.party.activeSlots.findIndex(s => s === null);
                    if (empty !== -1) {
                        GameState.party.activeSlots[empty] = u;
                        u.slotIndex = empty;
                        this.renderParty();
                        this.toggleParty();
                    } else {
                        alert('No empty slot! Try swapping.');
                    }
                };
                row.appendChild(btn);
                reserveEl.appendChild(row);
            });
            GameState.party.activeSlots.forEach((u, idx) => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                if (u) {
                    row.innerHTML = `<div class="flex items-center gap-2">${this.spriteMarkup(u, 'h-10 w-10 object-contain')}<div><div class="text-yellow-100">${u.name}</div><div class="text-xs text-gray-500">Lv${u.level}</div></div></div>`;
                    const btn = document.createElement('button');
                    btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                    btn.innerText = 'REMOVE';
                    btn.onclick = () => {
                        GameState.party.activeSlots[idx] = null;
                        this.renderParty();
                        this.toggleParty();
                    };
                    row.appendChild(btn);
                } else {
                    row.innerHTML = '<div class="text-gray-600">(EMPTY)</div>';
                }
                activeEl.appendChild(row);
            });
        }
    }

    toggleInventory() {
        const modal = document.getElementById('inventory-modal');
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            const list = document.getElementById('inventory-list');
            list.innerHTML = '';
            const eqKeys = Object.keys(GameState.inventory.equipment);
            if (eqKeys.length > 0) {
                const eqTitle = document.createElement('div');
                eqTitle.className = 'text-yellow-400 mb-2';
                eqTitle.innerText = 'Equipment';
                list.appendChild(eqTitle);
                eqKeys.forEach(id => {
                    const count = GameState.inventory.equipment[id];
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
            const itemKeys = Object.keys(GameState.inventory.items);
            if (itemKeys.length > 0) {
                const itmTitle = document.createElement('div');
                itmTitle.className = 'text-yellow-400 mt-4 mb-2';
                itmTitle.innerText = 'Items';
                list.appendChild(itmTitle);
                itemKeys.forEach(id => {
                    const count = GameState.inventory.items[id];
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
        const maxhp = getMaxHp(unit);
        document.getElementById('modal-sprite').innerHTML = this.spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');
        document.getElementById('modal-name').innerText = unit.name;
        document.getElementById('modal-lvl').innerText = unit.level;
        document.getElementById('modal-temperament').innerText = def.temperament;
        document.getElementById('modal-hp').innerText = `${unit.hp}/${maxhp}`;
        document.getElementById('modal-xp').innerText = `${unit.exp ?? 0}`;
        document.getElementById('modal-race').innerText = def.race;
        document.getElementById('modal-elements').innerText = (unit.elements || []).join(', ');
        document.getElementById('modal-passive').innerText = def.passive || '—';
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
        const list = GameState.roster.map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys(GameState.inventory.equipment).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];
        const first = this.activeModalUnit || GameState.party.activeSlots.find(Boolean);
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
        Log.add(`${target.name} equipped ${Data.equipment[equipmentId].name}.`);
        this.renderParty();
        this.renderStatusModal();
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
        Log.add(`${target.name} borrowed ${Data.equipment[equipmentId].name} from ${owner.name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
        this.recomputeHp(unit);
        Log.add(`${unit.name} removed ${Data.equipment[previous].name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    recomputeHp(unit) {
        const maxhp = getMaxHp(unit);
        if (unit.hp > maxhp) unit.hp = maxhp;
    }

    switchScene(toBattle, onMidTransition, options = {}) {
        const swipe = document.getElementById('swipe-overlay');
        const elExp = document.getElementById('explore-layer');
        const elBat = document.getElementById('battle-layer');
        const ctrls = document.getElementById('battle-controls');
        const eCtrls = document.getElementById('explore-controls');
        const { instant = false } = options;

        const setScene = (skipSwipe = false) => {
            if (toBattle) {
                elExp.classList.remove('active-scene'); elExp.classList.add('hidden-scene');
                elBat.classList.remove('hidden-scene'); elBat.classList.add('active-scene');
                ctrls.classList.remove('hidden'); eCtrls.classList.add('hidden');
            } else {
                elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
            }
            if (onMidTransition) onMidTransition();
            if (!skipSwipe) {
                swipe.className = 'swipe-clear';
                setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
            }
            this.hasSwitchedOnce = true;
        };

        if (instant) {
            // First-time scene setups shouldn't flash a transition over already visible content.
            setScene(true);
            swipe.className = 'swipe-reset';
            return;
        }

        swipe.className = 'swipe-down';
        setTimeout(setScene, 600);
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
