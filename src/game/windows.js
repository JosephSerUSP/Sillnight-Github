// windows.js - similar to rmmz_windows.js
// Houses all window classes and the persistent ShellUI used by scenes.
// To add a new window, subclass Window_Base and register it inside ShellUI.

import { Data } from './data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { computeMaxHp, recomputeHp, swapPartySlots } from './objects.js';
import { resolveAssetPath } from './core.js';

class Window_Base {
    constructor(rootId) {
        this.root = typeof rootId === 'string' ? document.getElementById(rootId) : rootId;
    }
    open() { this.show(); }
    close() { this.hide(); }
    show() { if (this.root) this.root.classList.remove('hidden'); }
    hide() { if (this.root) this.root.classList.add('hidden'); }
    refresh() {}
}

class Window_Selectable extends Window_Base {
    constructor(rootId) {
        super(rootId);
        this.index = 0;
        this.items = [];
    }
    select(index) {
        this.index = Math.max(0, Math.min(index, this.items.length - 1));
        this.renderSelection();
    }
    renderSelection() {}
    onAction(action) {
        if (action === 'up') this.select(this.index - 1);
        else if (action === 'down') this.select(this.index + 1);
    }
}

class Window_HUD extends Window_Base {
    refresh() {
        document.getElementById('hud-floor').innerText = GameState.run.floor;
        document.getElementById('hud-gold').innerText = GameState.run.gold;
    }
}

class Window_Log extends Window_Base {
    refresh() {
        const log = document.getElementById('game-log');
        if (log) log.scrollTop = log.scrollHeight;
    }
}

class Window_PartySummary extends Window_Base {
    constructor(rootId, shell) {
        super(rootId);
        this.shell = shell;
    }
    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        const url = resolveAssetPath(unit?.spriteAsset);
        if (url) return `<img src="${url}" alt="${unit?.name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
        return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
    }
    refresh() {
        const grid = this.root;
        if (!grid) return;
        grid.innerHTML = '';
        GameState.party.activeSlots.forEach((u, i) => {
            const div = document.createElement('div');
            div.className = 'party-slot relative flex flex-col p-1';
            if (u) {
                const maxhp = computeMaxHp(u);
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
                div.onclick = () => this.shell.handlePartySlotClick(i, u, div);
            } else {
                div.innerHTML = '<span class="m-auto text-gray-800 text-xs">EMPTY</span>';
                div.onclick = () => this.shell.handleEmptySlotClick(i, div);
            }
            grid.appendChild(div);
        });
        this.shell.hud.refresh();
    }
}

class Window_Modal extends Window_Base {
    setContent(html) {
        if (!this.root) return;
        this.root.innerHTML = html;
    }
}

class Window_Event extends Window_Base {
    constructor(rootId, titleId, contentId) {
        super(rootId);
        this.titleEl = document.getElementById(titleId);
        this.contentEl = document.getElementById(contentId);
    }
    showEvent(title, content) {
        if (!this.root) return;
        if (this.titleEl) this.titleEl.innerText = title;
        if (this.contentEl) {
            this.contentEl.innerHTML = '';
            if (typeof content === 'string') this.contentEl.innerHTML = content;
            else this.contentEl.appendChild(content);
        }
        this.show();
    }
}

class ShellUI {
    constructor() {
        this.dependencies = {};
        this.hud = new Window_HUD();
        this.logWindow = new Window_Log();
        this.partySummary = new Window_PartySummary('party-grid', this);
        this.modal = new Window_Modal('center-modal');
        this.eventModal = new Window_Event('event-modal', 'event-title', 'event-content');
    }

    setDependencies(deps) {
        this.dependencies = deps;
    }

    spriteMarkup(...args) {
        return this.partySummary.spriteMarkup(...args);
    }

    refreshAll() {
        this.hud.refresh();
        this.partySummary.refresh();
        this.logWindow.refresh();
    }

    updateHUD() {
        this.hud.refresh();
    }

    renderParty() {
        this.partySummary.refresh();
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

    handlePartySlotClick(index, unit, div) {
        if ((GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') || GameState.ui.formationMode) {
            const selected = document.querySelector('.party-slot.selected');
            if (selected) {
                const idx = parseInt(selected.dataset.idx);
                selected.classList.remove('selected');
                if (idx !== index) {
                    if (GameState.ui.mode === 'BATTLE') {
                        this.dependencies.swapBattleUnits?.(idx, index);
                    } else {
                        swapPartySlots(GameState.party.activeSlots, idx, index);
                        this.renderParty();
                        this.dependencies.refreshBattleScene?.();
                    }
                }
            } else {
                div.classList.add('selected');
                div.dataset.idx = index;
            }
        } else {
            this.showCreatureModal(unit);
        }
    }

    handleEmptySlotClick(index, div) {
        if ((GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') || GameState.ui.formationMode) {
            const selected = document.querySelector('.party-slot.selected');
            if (selected) {
                const idx = parseInt(selected.dataset.idx);
                const u1 = GameState.party.activeSlots[idx];
                GameState.party.activeSlots[idx] = null;
                GameState.party.activeSlots[index] = u1;
                if (u1) u1.slotIndex = index;
                this.renderParty();
                if (GameState.ui.mode === 'BATTLE') {
                    this.dependencies.refreshBattleScene?.();
                }
            }
        }
    }

    toggleParty() {
        const modal = document.getElementById('party-modal');
        const isOpen = !modal.classList.contains('hidden');
        modal.classList.toggle('hidden');
        if (isOpen) return;
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
                    btn.onclick = () => { this.startEquipFlow(id); };
                    row.appendChild(btn);
                    list.appendChild(row);
                });
            }
            const itemKeys = Object.keys(GameState.inventory.items);
            if (itemKeys.length > 0) {
                const title = document.createElement('div');
                title.className = 'text-yellow-400 mb-2 mt-2';
                title.innerText = 'Items';
                list.appendChild(title);
                itemKeys.forEach(id => {
                    const count = GameState.inventory.items[id];
                    const def = Data.items[id];
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                    row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                    list.appendChild(row);
                });
            }
        }
    }

    startEquipFlow(equipmentId) {
        const first = GameState.party.activeSlots.find(u => u);
        if (first) this.showCreatureModal(first, { id: equipmentId, source: 'inventory' });
    }

    closeEquipmentPicker() {
        document.getElementById('equipment-empty-hint').classList.remove('hidden');
        document.getElementById('modal-close-picker').classList.add('hidden');
        document.getElementById('equipment-options').innerHTML = '';
        this.equipmentPickerPreset = null;
    }

    renderStatusModal(preset) {
        const unit = this.activeModalUnit;
        if (!unit) return;
        const def = Data.creatures[unit.speciesId];
        const maxhp = computeMaxHp(unit);
        const spriteEl = document.getElementById('modal-sprite');
        if (spriteEl) spriteEl.innerHTML = this.spriteMarkup(unit, 'h-52 w-52 object-contain', '', 'text-6xl');
        document.getElementById('modal-name').innerText = unit.name;
        document.getElementById('modal-lvl').innerText = unit.level;
        document.getElementById('modal-temperament').innerText = def.temperament;
        document.getElementById('modal-hp').innerText = `${unit.hp}/${maxhp}`;
        document.getElementById('modal-xp').innerText = `${unit.exp || 0}`;
        document.getElementById('modal-race').innerText = def.name;
        document.getElementById('modal-elements').innerText = (def.elements || []).join(' ');
        document.getElementById('modal-passive').innerText = def.passive || '—';
        document.getElementById('modal-desc').innerText = def.description || '';
        const actions = document.getElementById('modal-actions');
        actions.innerHTML = '';
        (def.acts || []).forEach(a => {
            const card = document.createElement('div');
            card.className = 'rpg-window px-3 py-2 bg-black/70 border border-gray-700';
            card.innerHTML = `<div class="flex justify-between text-yellow-200 text-sm"><span>${a.name}</span><span class="text-[10px] text-gray-500">${a.type.toUpperCase()}</span></div><div class="text-xs text-gray-500 leading-tight">${a.description || ''}</div>`;
            actions.appendChild(card);
        });
        const equipBtn = document.getElementById('modal-equip-slot');
        const eq = unit.equipmentId ? Data.equipment[unit.equipmentId] : null;
        equipBtn.innerText = eq ? eq.name : '(none)';
        equipBtn.onclick = () => this.renderEquipmentOptions(unit, preset);
    }

    renderEquipmentOptions(unit, preset) {
        this.equipmentPickerPreset = preset || null;
        const optionsGrid = document.getElementById('equipment-options');
        const emptyHint = document.getElementById('equipment-empty-hint');
        optionsGrid.innerHTML = '';
        const options = [];
        if (unit.equipmentId) options.push({ id: unit.equipmentId, source: 'unit', owner: unit });
        Object.entries(GameState.inventory.equipment).forEach(([id, count]) => {
            if (count > 0) options.push({ id, source: 'bag', owner: null });
        });
        if (options.length === 0) {
            emptyHint.classList.remove('hidden');
            return;
        }
        emptyHint.classList.add('hidden');
        document.getElementById('modal-close-picker').classList.remove('hidden');
        options.forEach(opt => {
            const def = Data.equipment[opt.id];
            const card = document.createElement('div');
            card.className = 'rpg-window p-2 bg-black/70 border border-gray-700 hover:border-yellow-400 cursor-pointer';
            const maxhp = computeMaxHp(unit);
            const newHp = Math.round(maxhp * (1 + (def.hpBonus || 0)));
            const subtitle = `${def.description} (HP ${maxhp}→${newHp})`;
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
    }

    showCreatureModal(unit, preset) {
        this.activeModalUnit = unit;
        document.getElementById('creature-modal').classList.remove('hidden');
        this.renderStatusModal(preset);
    }

    equipFromInventory(target, equipmentId) {
        const count = GameState.inventory.equipment[equipmentId] || 0;
        if (count <= 0) return;
        const previous = target.equipmentId;
        if (previous) GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
        GameState.inventory.equipment[equipmentId] = count - 1;
        if (GameState.inventory.equipment[equipmentId] <= 0) delete GameState.inventory.equipment[equipmentId];
        target.equipmentId = equipmentId;
        recomputeHp(target);
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
            recomputeHp(owner);
        }
        target.equipmentId = equipmentId;
        recomputeHp(target);
        Log.add(`${target.name} borrowed ${Data.equipment[equipmentId].name} from ${owner.name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
        recomputeHp(unit);
        Log.add(`${unit.name} removed ${Data.equipment[previous].name}.`);
        this.renderParty();
        this.renderStatusModal();
    }

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
                elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                if (GameState.ui.mode === 'BATTLE_WIN') GameState.ui.mode = 'EXPLORE';
                this.dependencies.renderExplore?.();
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
            btn.onclick = () => this.dependencies.resumeAuto?.();
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            btn.innerText = 'STOP ROUND (SPACE)';
            btn.onclick = () => this.dependencies.requestPlayerTurn?.();
        }
    }

    showModal(html) {
        this.modal.setContent(html);
        this.modal.show();
    }

    closeModal() { this.modal.hide(); }
    closeEvent() { this.eventModal.hide(); }
}

export const shellUI = new ShellUI();
