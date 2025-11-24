// windows.js - similar to rmmz_windows.js. Contains all window classes and the ShellUI facade.
// Add new windows here; scenes/controllers should reuse this persistent shell rather than creating DOM repeatedly.

import { GameState } from './state.js';
import { Data } from './data.js';
import { Log } from './log.js';
import { SimpleEmitter, resolveAssetPath } from './core.js';
import { computeMaxHp } from './objects.js';
import { SceneManager } from './managers.js';

export class Window_Base {
    constructor(title = '') {
        this.root = document.createElement('div');
        this.root.className = 'sn-window rpg-window flex flex-col bg-black/90';
        this.header = document.createElement('div');
        this.header.className = 'sn-window__header rpg-header text-sm text-gray-400';
        this.header.innerText = title;
        this.content = document.createElement('div');
        this.content.className = 'sn-window__content flex-1';
        this.root.append(this.header, this.content);
    }
    open(parent) {
        parent?.appendChild(this.root);
    }
    close() { this.root.remove(); }
    show() { this.root.classList.remove('hidden'); }
    hide() { this.root.classList.add('hidden'); }
    refresh() {}
}

export class Window_Selectable extends Window_Base {
    constructor(title = '') {
        super(title);
        this.items = [];
        this.index = 0;
    }
    select(index) {
        this.index = index;
        this.refresh();
    }
}

class Window_Log extends Window_Base {
    constructor() {
        super('LOG');
        this.content.id = 'game-log';
        this.content.className = 'p-2 overflow-y-auto text-sm font-mono leading-tight space-y-1 no-scrollbar text-gray-300 flex-grow';
    }
    add(entry) {
        const div = document.createElement('div');
        div.innerHTML = entry;
        this.content.appendChild(div);
        this.content.scrollTop = this.content.scrollHeight;
    }
}

class Window_PartySummary extends Window_Base {
    constructor(ui) {
        super('PARTY STATUS');
        this.ui = ui;
        this.indicator = document.createElement('span');
        this.indicator.id = 'turn-indicator';
        this.indicator.className = 'text-xs text-yellow-500 hidden mode-overlay px-2';
        this.header.classList.add('flex', 'justify-between');
        this.header.appendChild(this.indicator);
        this.grid = document.createElement('div');
        this.grid.id = 'party-grid';
        this.grid.className = 'flex-grow grid grid-rows-2 grid-cols-3 gap-1 p-1';
        this.content.classList.add('h-full');
        this.content.appendChild(this.grid);
    }

    refresh() { this.ui.renderPartyGrid(this.grid); }
}

class Window_LogContainer extends Window_Base {
    constructor(logWindow) {
        super('');
        this.header.classList.add('hidden');
        this.content.className = 'flex flex-col bg-black/90 min-h-0 flex-1';
        this.content.appendChild(logWindow.root);
    }
}

export class ShellUI extends SimpleEmitter {
    constructor() {
        super();
        this.systems = null;
        this.logWindow = new Window_Log();
        this.partyWindow = new Window_PartySummary(this);
        this.hud = document.getElementById('hud-floor') ? null : null;
    }

    attachSystems(systems) {
        this.systems = systems;
    }

    initializeShell() {
        // Hook existing DOM instead of rebuilding everything.
        const logWrap = document.getElementById('game-log');
        if (logWrap) this.logWindow.content = logWrap;
        const grid = document.getElementById('party-grid');
        if (grid) this.partyWindow.grid = grid;
        const indicator = document.getElementById('turn-indicator');
        if (indicator) this.partyWindow.indicator = indicator;
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        const url = resolveAssetPath(unit?.spriteAsset);
        if (url) {
            return `<img src="${url}" alt="${unit?.name || 'creature'}" class="sprite-img ${sizeClasses} ${extraClasses}">`;
        }
        return `<span class="${sizeClasses} ${textClass} ${extraClasses} flex items-center justify-center">${unit?.sprite || ''}</span>`;
    }

    updateHUD() {
        const floor = document.getElementById('hud-floor');
        const gold = document.getElementById('hud-gold');
        if (floor) floor.innerText = GameState.run.floor;
        if (gold) gold.innerText = GameState.run.gold;
    }

    renderParty() { this.partyWindow.refresh(); }

    renderPartyGrid(gridEl) {
        const grid = gridEl || document.getElementById('party-grid');
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
                div.onclick = () => {
                    if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
                        const selected = document.querySelector('.party-slot.selected');
                        if (selected) {
                            const idx = parseInt(selected.dataset.idx);
                            selected.classList.remove('selected');
                            if (idx !== i) {
                                this.emit('party-swap', { from: idx, to: i });
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
                            selected.classList.remove('selected');
                            if (idx !== i) {
                                this.emit('party-swap', { from: idx, to: i });
                            }
                        }
                    }
                };
            }
            grid.appendChild(div);
        });
    }

    toggleParty() {
        const modal = document.getElementById('party-modal');
        if (!modal) return;
        modal.classList.toggle('hidden');
        this.renderParty();
    }

    toggleInventory() {
        const modal = document.getElementById('inventory-modal');
        if (!modal) return;
        modal.classList.toggle('hidden');
        this.renderInventory();
    }

    toggleFormationMode() {
        GameState.ui.formationMode = !GameState.ui.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if (GameState.ui.formationMode) {
            ind.innerText = 'FORMATION MODE';
            ind.classList.remove('hidden');
            btn?.classList.add('bg-yellow-900', 'text-white');
        } else {
            ind?.classList.add('hidden');
            btn?.classList.remove('bg-yellow-900', 'text-white');
            const selected = document.querySelector('.party-slot.selected');
            if (selected) selected.classList.remove('selected');
        }
    }

    renderInventory() {
        const invList = document.getElementById('inventory-list');
        const eqList = document.getElementById('inventory-equip');
        if (!invList || !eqList) return;
        invList.innerHTML = '';
        eqList.innerHTML = '';
        Object.entries(GameState.inventory.items).forEach(([id, count]) => {
            const def = Data.items[id];
            const row = document.createElement('div');
            row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
            row.innerHTML = `<div><div class="text-yellow-200">${def.name}</div><div class="text-xs text-gray-500">${def.description}</div></div><div class="text-xs">x${count}</div>`;
            invList.appendChild(row);
        });
        Object.entries(GameState.inventory.equipment).forEach(([id, count]) => {
            const def = Data.equipment[id];
            const row = document.createElement('div');
            row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
            row.innerHTML = `<div><div class="text-yellow-200">${def.name}</div><div class="text-xs text-gray-500">${def.description}</div></div><div class="text-xs">x${count}</div>`;
            row.onclick = () => this.startEquipFlow(id);
            eqList.appendChild(row);
        });
    }

    showCreatureModal(unit) {
        const modal = document.getElementById('unit-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.activeModalUnit = unit;
        document.getElementById('unit-name').innerText = unit.name;
        document.getElementById('unit-level').innerText = `Lv ${unit.level}`;
        document.getElementById('unit-hp').innerText = `${unit.hp}/${computeMaxHp(unit)}`;
        document.getElementById('unit-sprite').innerHTML = this.spriteMarkup(unit, 'h-20 w-20 object-contain text-4xl', '','text-6xl');
        this.renderStatusModal();
    }

    closeCreatureModal() {
        const modal = document.getElementById('unit-modal');
        if (modal) modal.classList.add('hidden');
        this.activeModalUnit = null;
    }

    renderStatusModal() {
        if (!this.activeModalUnit) return;
        const unit = this.activeModalUnit;
        document.getElementById('unit-hp').innerText = `${unit.hp}/${computeMaxHp(unit)}`;
        const equipButton = document.getElementById('equip-slot');
        const equipDef = unit.equipmentId ? Data.equipment[unit.equipmentId] : null;
        equipButton.innerHTML = equipDef ? `<span>${equipDef.name}</span><span class="text-xs text-gray-400">Tap to swap</span>` : `<span class="text-gray-400">Empty slot</span><span class="text-xs">Tap to equip</span>`;
        equipButton.onclick = () => this.openEquipmentPicker();
        document.getElementById('equipment-empty-hint')?.classList.remove('hidden');
        document.getElementById('modal-close-picker')?.classList.add('hidden');
        document.getElementById('equipment-options').innerHTML = '';
    }

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
    }

    startEquipFlow(equipmentId) {
        const count = GameState.inventory.equipment[equipmentId] || 0;
        if (count <= 0) return;
        const center = document.getElementById('center-modal');
        center?.classList.remove('hidden');
        if (!center) return;
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
    }

    closeCenterModal() {
        const center = document.getElementById('center-modal');
        center?.classList.add('hidden');
        if (center) center.innerHTML = '';
    }

    openEquipmentPicker() {
        const unit = this.activeModalUnit;
        if (!unit) return;
        const optionsGrid = document.getElementById('equipment-options');
        if (!optionsGrid) return;
        optionsGrid.innerHTML = '';
        const hint = document.getElementById('equipment-empty-hint');
        hint?.classList.add('hidden');
        document.getElementById('modal-close-picker')?.classList.remove('hidden');
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
    }

    closeEquipmentPicker() {
        document.getElementById('equipment-empty-hint')?.classList.remove('hidden');
        document.getElementById('modal-close-picker')?.classList.add('hidden');
        const list = document.getElementById('equipment-options');
        if (list) list.innerHTML = '';
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
        target.equipmentId = equipmentId;
        owner.equipmentId = null;
        if (previous) GameState.inventory.equipment[previous] = (GameState.inventory.equipment[previous] || 0) + 1;
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
        const maxhp = computeMaxHp(unit);
        if (unit.hp > maxhp) unit.hp = maxhp;
    }

    switchScene(toBattle) {
        if (toBattle) {
            this.showBattleLayer();
            SceneManager.change('battle');
        } else {
            this.showExploreLayer();
            SceneManager.change('explore');
            if (GameState.ui.mode === 'BATTLE_WIN') GameState.ui.mode = 'EXPLORE';
            this.systems?.Explore.render();
        }
    }

    showExploreLayer() {
        const elExp = document.getElementById('explore-layer');
        const elBat = document.getElementById('battle-layer');
        const ctrls = document.getElementById('battle-controls');
        const eCtrls = document.getElementById('explore-controls');
        elBat?.classList.add('hidden-scene');
        elBat?.classList.remove('active-scene');
        elExp?.classList.remove('hidden-scene');
        elExp?.classList.add('active-scene');
        ctrls?.classList.add('hidden');
        eCtrls?.classList.remove('hidden');
    }

    showBattleLayer() {
        const swipe = document.getElementById('swipe-overlay');
        swipe.className = 'swipe-down';
        setTimeout(() => {
            const elExp = document.getElementById('explore-layer');
            const elBat = document.getElementById('battle-layer');
            const ctrls = document.getElementById('battle-controls');
            const eCtrls = document.getElementById('explore-controls');
            elExp?.classList.remove('active-scene'); elExp?.classList.add('hidden-scene');
            elBat?.classList.remove('hidden-scene'); elBat?.classList.add('active-scene');
            ctrls?.classList.remove('hidden'); eCtrls?.classList.add('hidden');
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
            btn.onclick = () => this.systems?.Battle.resumeAuto();
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            btn.innerText = 'STOP ROUND (SPACE)';
            btn.onclick = () => this.systems?.Battle.requestPlayerTurn();
        }
    }

    showModal(html) {
        const m = document.getElementById('center-modal');
        if (!m) return;
        m.innerHTML = html;
        m.classList.remove('hidden');
    }

    closeModal() { document.getElementById('center-modal')?.classList.add('hidden'); }
    closeEvent() { document.getElementById('event-modal')?.classList.add('hidden'); }
}

export const UI = new ShellUI();

export function setUISystems(systems) {
    UI.attachSystems(systems);
}
