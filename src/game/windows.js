
// rmmz_windows.js equivalent: window classes and shell UI for Stillnight.
// All DOM-facing UI code lives here; scenes/controllers orchestrate which windows are visible.

import { Data } from './data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';

export class Window_Base {
    constructor(root) {
        this.root = root || document.createElement('div');
    }
    open(parent) {
        (parent || document.body).appendChild(this.root);
    }
    close() { this.root.remove(); }
    show() { this.root.classList.remove('hidden'); }
    hide() { this.root.classList.add('hidden'); }
    refresh() {}
}

export class Window_Selectable extends Window_Base {
    constructor(root) {
        super(root);
        this.index = 0;
        this.items = [];
    }
    moveSelection(delta) {
        if (this.items.length === 0) return;
        this.index = (this.index + delta + this.items.length) % this.items.length;
        this.refresh();
    }
}

export function createUI(systems) {
    const Systems = systems;
    const UI = { 

        activeModalUnit: null,
        equipmentPickerPreset: null,
        updateHUD() {
            document.getElementById('hud-floor').innerText = GameState.run.floor;
            document.getElementById('hud-gold').innerText = GameState.run.gold;
        },
        spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
            const url = resolveAssetPath(unit?.spriteAsset);
            if (url) {
                return `<img src="${url}" alt="${unit?.name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
            }
            return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
        },
        renderParty() {
            const grid = document.getElementById('party-grid');
            grid.innerHTML = '';
            GameState.party.activeSlots.forEach((u, i) => {
                const div = document.createElement('div');
                div.className = 'party-slot relative flex flex-col p-1';
                if (u) {
                    const maxhp = Systems.Battle.getMaxHp(u);
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
                                    if (GameState.ui.mode === 'BATTLE') {
                                        Systems.Battle.swapUnits(idx, i);
                                    } else {
                                        // Swap outside battle
                                        const u1 = GameState.party.activeSlots[idx];
                                        const u2 = GameState.party.activeSlots[i];
                                        GameState.party.activeSlots[idx] = u2;
                                        GameState.party.activeSlots[i] = u1;
                                        if (GameState.party.activeSlots[idx]) GameState.party.activeSlots[idx].slotIndex = idx;
                                        if (GameState.party.activeSlots[i]) GameState.party.activeSlots[i].slotIndex = i;
                                        this.renderParty();
                                    }
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
                                if (GameState.ui.mode === 'BATTLE') {
                                    GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                                    Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
                                }
                            }
                        }
                    };
                }
                grid.appendChild(div);
            });
            this.updateHUD();
        },
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
        },
        // Party modal toggles. Shows roster reserve and active slots.
        toggleParty() {
            const modal = document.getElementById('party-modal');
            const isOpen = !modal.classList.contains('hidden');
            modal.classList.toggle('hidden');
            if (!isOpen) {
                // Render reserve list (all roster not active)
                const reserveEl = document.getElementById('reserve-list');
                const activeEl = document.getElementById('active-list');
                reserveEl.innerHTML = '';
                activeEl.innerHTML = '';
                // Determine active uids
                const activeSet = new Set(GameState.party.activeSlots.filter(Boolean).map(u => u.uid));
                const reserve = GameState.roster.filter(u => !activeSet.has(u.uid));
                // Reserve list
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
                            UI.renderParty();
                            this.toggleParty();
                        } else {
                            alert('No empty slot! Try swapping.');
                        }
                    };
                    row.appendChild(btn);
                    reserveEl.appendChild(row);
                });
                // Active list for swapping
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
                            UI.renderParty();
                            this.toggleParty();
                        };
                        row.appendChild(btn);
                    } else {
                        row.innerHTML = '<div class="text-gray-600">(EMPTY)</div>';
                    }
                    activeEl.appendChild(row);
                });
            }
        },
        toggleInventory() {
            const modal = document.getElementById('inventory-modal');
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                const list = document.getElementById('inventory-list');
                list.innerHTML = '';
                // Render equipment
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
                            UI.startEquipFlow(id);
                        };
                        row.appendChild(btn);
                        list.appendChild(row);
                    });
                }
                // Render items
                const itemKeys = Object.keys(GameState.inventory.items);
                if (itemKeys.length > 0) {
                    const itTitle = document.createElement('div');
                    itTitle.className = 'text-yellow-400 mb-2 mt-4';
                    itTitle.innerText = 'Items';
                    list.appendChild(itTitle);
                    itemKeys.forEach(id => {
                        const count = GameState.inventory.items[id];
                        const def = Data.items[id];
                        const row = document.createElement('div');
                        row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                        row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                        const btn = document.createElement('button');
                        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                        btn.innerText = 'USE';
                        btn.onclick = () => {
                            alert('Item usage will be implemented in battle soon.');
                        };
                        row.appendChild(btn);
                        list.appendChild(row);
                    });
                }
                if (itemKeys.length === 0 && eqKeys.length === 0) {
                    const none = document.createElement('div');
                    none.className = 'text-gray-500';
                    none.innerText = 'No items.';
                    list.appendChild(none);
                }
            }
        },
        showCreatureModal(unit) {
            this.activeModalUnit = unit;
            this.equipmentPickerPreset = null;
            this.renderStatusModal();
            document.getElementById('creature-modal').classList.remove('hidden');
        },
        renderStatusModal() {
            const unit = this.activeModalUnit;
            if (!unit) return;
            const def = Data.creatures[unit.speciesId];
            document.getElementById('modal-sprite').innerHTML = this.spriteMarkup(unit, 'h-full w-full object-contain');
            document.getElementById('modal-name').innerText = unit.name;
            document.getElementById('modal-lvl').innerText = unit.level;
            document.getElementById('modal-temperament').innerText = `Temperament: ${def.temperament.toUpperCase()}`;
            document.getElementById('modal-race').innerText = def.race || 'Unknown';
            const elementList = unit.elements && unit.elements.length > 0 ? unit.elements : (def.elements || []);
            const elems = elementList.length > 0 ? elementList.map(e => Data.elements[e] || '?').join(' ') : '—';
            document.getElementById('modal-elements').innerText = elems;
            document.getElementById('modal-passive').innerText = def.passive || 'Details coming soon.';
            document.getElementById('modal-desc').innerText = def.description;
            const maxhp = Systems.Battle.getMaxHp(unit);
            document.getElementById('modal-hp').innerText = `${unit.hp}/${maxhp}`;
            document.getElementById('modal-xp').innerText = `${unit.exp}`;
            const actList = document.getElementById('modal-actions');
            actList.innerHTML = '';
            const acts = [...unit.acts[0], ...(unit.acts[1] || [])];
            acts.forEach(a => {
                const div = document.createElement('div');
                div.className = 'flex gap-2 items-center border border-gray-700 bg-gray-900 px-2 py-1';
                const skill = Data.skills[a] || Data.skills[a.toLowerCase()];
                const label = skill ? skill.name : a;
                const elementIcon = skill?.element ? Data.elements[skill.element] || '' : '';
                div.innerHTML = `<span class="bg-gray-800 px-1 border border-gray-600 text-xs flex items-center gap-1">${elementIcon ? `<span>${elementIcon}</span>` : ''}<span>${label}</span></span>`;
                actList.appendChild(div);
            });
            const equipButton = document.getElementById('modal-equip-slot');
            const equipDef = unit.equipmentId ? Data.equipment[unit.equipmentId] : null;
            equipButton.innerHTML = equipDef ? `<span>${equipDef.name}</span><span class="text-xs text-gray-400">Tap to swap</span>` : `<span class="text-gray-400">Empty slot</span><span class="text-xs">Tap to equip</span>`;
            equipButton.onclick = () => this.openEquipmentPicker();
            document.getElementById('equipment-empty-hint').classList.remove('hidden');
            document.getElementById('modal-close-picker').classList.add('hidden');
            const optionsGrid = document.getElementById('equipment-options');
            optionsGrid.innerHTML = '';
        },
        buildEquipmentOptions(unit) {
            const options = [];
            Object.entries(GameState.inventory.equipment).forEach(([id, count]) => {
                if (count > 0) options.push({ id, source: 'inventory', count });
            });
            GameState.roster.forEach(u => {
                if (u.equipmentId && u.uid !== unit.uid) {
                    options.push({ id: u.equipmentId, source: 'unit', owner: u });
                }
            });
            return options;
        },
        startEquipFlow(equipmentId) {
            const count = GameState.inventory.equipment[equipmentId] || 0;
            if (count <= 0) return;
            if (!document.getElementById('inventory-modal').classList.contains('hidden')) {
                this.toggleInventory();
            }
            const center = document.getElementById('center-modal');
            center.classList.remove('hidden');
            center.innerHTML = '';
            const box = document.createElement('div');
            box.className = 'rpg-window bg-[#0a0a0a] border border-yellow-700 p-4 w-2/3';
            box.innerHTML = `<div class="flex justify-between items-center mb-3"><div class="text-lg text-yellow-300">Choose a creature to equip ${Data.equipment[equipmentId].name}</div><button class="text-red-500" onclick="Game.Views.UI.closeCenterModal()">Cancel</button></div>`;
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 gap-2 max-h-64 overflow-y-auto';
            GameState.roster.forEach(u => {
                const card = document.createElement('button');
                card.className = 'rpg-window border border-gray-700 bg-gray-900 hover:border-yellow-500 flex flex-col items-start text-left px-3 py-2';
                card.innerHTML = `${this.spriteMarkup(u, 'h-12 w-12 object-contain text-2xl')}<div class="text-yellow-100">${u.name}</div><div class="text-xs text-gray-500">Lv${u.level}</div>`;
                card.onclick = () => {
                    this.equipmentPickerPreset = { id: equipmentId, source: 'inventory' };
                    this.showCreatureModal(u);
                    this.openEquipmentPicker();
                    this.closeCenterModal();
                };
                grid.appendChild(card);
            });
            box.appendChild(grid);
            center.appendChild(box);
        },
        closeCenterModal() {
            const center = document.getElementById('center-modal');
            center.classList.add('hidden');
            center.innerHTML = '';
        },
        openEquipmentPicker() {
            const unit = this.activeModalUnit;
            if (!unit) return;
            const optionsGrid = document.getElementById('equipment-options');
            optionsGrid.innerHTML = '';
            const hint = document.getElementById('equipment-empty-hint');
            hint.classList.add('hidden');
            document.getElementById('modal-close-picker').classList.remove('hidden');
            const options = this.buildEquipmentOptions(unit);
            const unequipCard = document.createElement('div');
            unequipCard.className = 'border border-gray-700 bg-gray-900 p-3 flex flex-col gap-1';
            unequipCard.innerHTML = `<div class="text-sm text-gray-300">No equipment</div><div class="text-xs text-gray-500">Remove any currently equipped item.</div>`;
            unequipCard.onclick = () => this.unequipUnit(unit);
            optionsGrid.appendChild(unequipCard);
            if (options.length === 0) {
                const none = document.createElement('div');
                none.className = 'text-gray-500 text-sm col-span-2';
                none.innerText = 'No equipment available. Visit shops to buy gear.';
                optionsGrid.appendChild(none);
            }
            options.forEach(opt => {
                const def = Data.equipment[opt.id];
                const card = document.createElement('div');
                card.className = 'border border-gray-700 bg-gray-900 p-3 flex flex-col gap-1 hover:border-yellow-400 cursor-pointer';
                let subtitle = def.description;
                if (opt.source === 'unit') subtitle = `Equipped by ${opt.owner.name}`;
                if (opt.source === 'inventory' && opt.count > 1) subtitle += ` (x${opt.count})`;
                if (this.equipmentPickerPreset && this.equipmentPickerPreset.id === opt.id && this.equipmentPickerPreset.source === opt.source) {
                    card.classList.add('border-yellow-500');
                }
                card.innerHTML = `<div class="flex justify-between items-center"><div class="text-yellow-200">${def.name}</div><span class="text-xs text-gray-500 uppercase">${opt.source}</span></div><div class="text-xs text-gray-400 leading-tight">${subtitle}</div>`;
                card.onclick = () => {
                    if (opt.source === 'unit') this.transferEquipment(unit, opt.owner, def.id);
                    else this.equipFromInventory(unit, def.id);
                };
                optionsGrid.appendChild(card);
            });
        },
        closeEquipmentPicker() {
            document.getElementById('equipment-empty-hint').classList.remove('hidden');
            document.getElementById('modal-close-picker').classList.add('hidden');
            document.getElementById('equipment-options').innerHTML = '';
            this.equipmentPickerPreset = null;
        },
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
        },
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
        },
        unequipUnit(unit) {
            if (!unit.equipmentId) return;
            const previous = unit.equipmentId;
            unit.equipmentId = null;
            GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
            this.recomputeHp(unit);
            Log.add(`${unit.name} removed ${Data.equipment[previous].name}.`);
            this.renderParty();
            this.renderStatusModal();
        },
        recomputeHp(unit) {
            const maxhp = Systems.Battle.getMaxHp(unit);
            if (unit.hp > maxhp) unit.hp = maxhp;
        },
        switchScene(toBattle) {
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
                    if (Systems.sceneHooks?.returnToExplore && (GameState.ui.mode === 'BATTLE' || GameState.ui.mode === 'BATTLE_WIN')) {
                        Systems.sceneHooks.returnToExplore();
                    }
                    elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                    elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                    ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                    if (GameState.ui.mode === 'BATTLE_WIN') GameState.ui.mode = 'EXPLORE';
                    Systems.Explore.render();
                }
                swipe.className = 'swipe-clear';
                setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
            }, 600);
        },
        showBanner(text) {
            const banner = document.getElementById('battle-banner');
            document.getElementById('banner-text').innerText = text;
            banner.classList.remove('opacity-0');
            setTimeout(() => banner.classList.add('opacity-0'), 2500);
        },
        togglePlayerTurn(active) {
            const ind = document.getElementById('turn-indicator');
            const btn = document.getElementById('btn-player-turn');
            if (active) {
                ind.innerText = 'PLAYER INPUT PHASE';
                ind.classList.remove('hidden');
                btn.innerText = 'RESUME (SPACE)';
                btn.classList.add('bg-yellow-900', 'text-white');
                btn.onclick = () => Systems.Battle.resumeAuto();
            } else {
                ind.classList.add('hidden');
                btn.classList.remove('bg-yellow-900', 'text-white');
                btn.innerText = 'STOP ROUND (SPACE)';
                btn.onclick = () => Systems.Battle.requestPlayerTurn();
            }
        },
        showModal(html) {
            const m = document.getElementById('center-modal');
            m.innerHTML = html;
            m.classList.remove('hidden');
        },
        closeModal() {
            document.getElementById('center-modal').classList.add('hidden');
        },
        closeEvent() {
            document.getElementById('event-modal').classList.add('hidden');
        }
    };
    return UI;
}
