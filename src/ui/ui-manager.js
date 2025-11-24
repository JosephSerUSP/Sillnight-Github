import { SceneBattle, SceneExplore } from './scenes.js';
import { Log } from '../game/log.js';
import {
    WindowBattleBanner,
    WindowCenterModal,
    WindowControls,
    WindowCreatureStatus,
    WindowEvent,
    WindowHUD,
    WindowInventory,
    WindowLog,
    WindowPartyManage,
    WindowPartyStatus,
    createSpriteEl
} from './windows.js';

export class UIManager {
    constructor({ state, data, resolveAssetPath }) {
        this.state = state;
        this.data = data;
        this.resolveAssetPath = resolveAssetPath;
        this.systems = null;
        this.activeModalUnit = null;
        this.equipmentPickerPreset = null;
    }

    bindSystems(systems) {
        this.systems = systems;
    }

    init() {
        this.uiRoot = document.getElementById('ui-layer');
        this.modalRoot = document.getElementById('modal-layer');

        this.hudWindow = new WindowHUD();
        this.bannerWindow = new WindowBattleBanner();
        this.logWindow = new WindowLog();
        this.controlsWindow = new WindowControls();
        this.partyWindow = new WindowPartyStatus(this.resolveAssetPath);
        this.inventoryWindow = new WindowInventory();
        this.inventoryWindow.bind(this.data, this.state);
        this.partyManageWindow = new WindowPartyManage(this.resolveAssetPath);
        this.partyManageWindow.bind(this.state);
        this.statusWindow = new WindowCreatureStatus(this.resolveAssetPath);
        this.statusWindow.bind(this.data, this.state);
        this.eventWindow = new WindowEvent();
        this.centerModal = new WindowCenterModal();

        this.controlsWindow.setHandler('party', () => this.toggleParty());
        this.controlsWindow.setHandler('inventory', () => this.toggleInventory());
        this.controlsWindow.setHandler('formation', () => this.toggleFormationMode());
        this.controlsWindow.setHandler('turn', (active) => {
            if (active) this.systems?.Battle.resumeAuto();
            else this.systems?.Battle.requestPlayerTurn();
        });

        this.partyWindow.onSlot = (idx, unit) => this.handlePartySlot(idx, unit);

        this.inventoryWindow.onEquip = (equipmentId) => this.startEquipFlow(equipmentId);

        this.partyManageWindow.onSet = (unit) => this.setActiveSlot(unit);
        this.partyManageWindow.onRemove = (idx) => this.removeActiveSlot(idx);

        this.statusWindow.onOpenEquip = (unit) => this.openEquipmentPicker(unit);

        this.layout();
        this.createScenes();
        this.updateHUD();
    }

    layout() {
        if (!this.uiRoot) return;
        // Top HUD
        const topLeft = document.createElement('div');
        topLeft.style.position = 'absolute';
        topLeft.style.top = '16px';
        topLeft.style.left = '16px';
        topLeft.style.pointerEvents = 'auto';
        this.hudWindow.open(topLeft);
        this.uiRoot.appendChild(topLeft);

        // Banner at top center
        const bannerHolder = document.createElement('div');
        bannerHolder.style.position = 'absolute';
        bannerHolder.style.top = '24px';
        bannerHolder.style.left = '50%';
        bannerHolder.style.transform = 'translateX(-50%)';
        bannerHolder.style.pointerEvents = 'none';
        this.bannerWindow.open(bannerHolder);
        this.uiRoot.appendChild(bannerHolder);

        // Bottom layout
        const bottomRow = document.createElement('div');
        bottomRow.style.position = 'absolute';
        bottomRow.style.left = '16px';
        bottomRow.style.right = '16px';
        bottomRow.style.bottom = '16px';
        bottomRow.style.display = 'flex';
        bottomRow.style.justifyContent = 'space-between';
        bottomRow.style.alignItems = 'flex-end';
        bottomRow.style.gap = '12px';
        bottomRow.style.pointerEvents = 'none';

        const leftCol = document.createElement('div');
        leftCol.style.width = '32%';
        leftCol.style.height = '260px';
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.gap = '8px';
        leftCol.style.pointerEvents = 'auto';

        this.logWindow.root.style.flex = '1';
        this.logWindow.open(leftCol);

        this.controlsWindow.root.style.height = '56px';
        this.controlsWindow.open(leftCol);

        const rightCol = document.createElement('div');
        rightCol.style.width = '32%';
        rightCol.style.height = '260px';
        rightCol.style.pointerEvents = 'auto';
        this.partyWindow.root.style.height = '100%';
        this.partyWindow.open(rightCol);

        bottomRow.appendChild(leftCol);
        bottomRow.appendChild(rightCol);
        this.uiRoot.appendChild(bottomRow);
    }

    createScenes() {
        this.scenes = {
            explore: new SceneExplore(this),
            battle: new SceneBattle(this)
        };
        this.currentScene = this.scenes.explore;
        this.currentScene.enter();
    }

    switchScene(toBattle) {
        const swipe = document.getElementById('swipe-overlay');
        swipe.className = 'swipe-down';
        setTimeout(() => {
            const elExp = document.getElementById('explore-layer');
            const elBat = document.getElementById('battle-layer');
            if (toBattle) {
                elExp.classList.remove('sn-layer--active');
                elExp.classList.add('sn-layer--hidden');
                elBat.classList.remove('sn-layer--hidden');
                elBat.classList.add('sn-layer--active');
                this.changeScene('battle');
                this.state.ui.mode = 'BATTLE';
            } else {
                elBat.classList.add('sn-layer--hidden');
                elBat.classList.remove('sn-layer--active');
                elExp.classList.remove('sn-layer--hidden');
                elExp.classList.add('sn-layer--active');
                this.changeScene('explore');
                this.state.ui.mode = 'EXPLORE';
                this.systems?.Explore.render();
            }
            swipe.className = 'swipe-clear';
            setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
        }, 600);
    }

    changeScene(name) {
        if (this.currentScene) this.currentScene.exit();
        this.currentScene = this.scenes[name];
        if (this.currentScene) this.currentScene.enter();
    }

    updateHUD() {
        this.hudWindow.setData(this.state.run.floor, this.state.run.gold);
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'sn-title') {
        const sizeToken = (tokens) => {
            if (tokens.includes('h-16') || tokens.includes('w-16')) return '64px';
            if (tokens.includes('h-12') || tokens.includes('w-12')) return '48px';
            if (tokens.includes('h-8') || tokens.includes('w-8')) return '32px';
            return '40px';
        };
        const size = sizeToken(sizeClasses.split(' '));
        const url = this.resolveAssetPath(unit?.spriteAsset);
        if (url) {
            return `<img src="${url}" alt="${unit?.name || 'creature'}" class="sprite-img ${extraClasses}" style="width:${size};height:${size};">`;
        }
        return `<span class="${textClass} ${extraClasses}" style="display:inline-flex;align-items:center;justify-content:center;width:${size};height:${size};">${unit?.sprite || ''}</span>`;
    }

    renderParty() {
        this.partyWindow.setParty(this.state.party.activeSlots);
        this.updateHUD();
    }

    handlePartySlot(idx, unit) {
        const swapMode = (this.state.battle && this.state.battle.phase === 'PLAYER_INPUT') || this.state.ui.formationMode;
        if (swapMode) {
            if (this.selectedSlot === undefined) this.selectedSlot = null;
            if (this.selectedSlot === null) {
                this.selectedSlot = idx;
                this.partyWindow.setSelection(idx);
            } else {
                if (this.selectedSlot !== idx) {
                    if (this.state.ui.mode === 'BATTLE') {
                        this.systems?.Battle.swapUnits(this.selectedSlot, idx);
                    } else {
                        const u1 = this.state.party.activeSlots[this.selectedSlot];
                        const u2 = this.state.party.activeSlots[idx];
                        this.state.party.activeSlots[this.selectedSlot] = u2;
                        this.state.party.activeSlots[idx] = u1;
                        if (this.state.party.activeSlots[this.selectedSlot]) this.state.party.activeSlots[this.selectedSlot].slotIndex = this.selectedSlot;
                        if (this.state.party.activeSlots[idx]) this.state.party.activeSlots[idx].slotIndex = idx;
                        this.renderParty();
                    }
                }
                this.selectedSlot = null;
                this.partyWindow.setSelection(null);
            }
        } else if (unit) {
            this.showCreatureModal(unit);
        }
    }

    toggleFormationMode() {
        if (this.state.ui.mode === 'BATTLE') return;
        this.state.ui.formationMode = !this.state.ui.formationMode;
        this.controlsWindow.setMode(this.state.ui.mode, this.state.ui.formationMode);
        if (!this.state.ui.formationMode) {
            this.partyWindow.setSelection(null);
            this.selectedSlot = null;
        }
    }

    toggleParty() {
        if (this.partyManageWindow.modalWrapper.wrapper.parentElement) {
            this.partyManageWindow.close();
        } else {
            this.partyManageWindow.refresh();
            this.partyManageWindow.open(this.modalRoot);
        }
    }

    toggleInventory() {
        if (this.inventoryWindow.modalWrapper.wrapper.parentElement) {
            this.inventoryWindow.close();
        } else {
            this.inventoryWindow.refresh();
            this.inventoryWindow.open(this.modalRoot);
        }
    }

    setActiveSlot(unit) {
        const empty = this.state.party.activeSlots.findIndex(s => s === null);
        if (empty !== -1) {
            this.state.party.activeSlots[empty] = unit;
            unit.slotIndex = empty;
            this.renderParty();
            this.partyManageWindow.refresh();
        }
    }

    removeActiveSlot(idx) {
        this.state.party.activeSlots[idx] = null;
        this.renderParty();
        this.partyManageWindow.refresh();
    }

    showCreatureModal(unit) {
        this.activeModalUnit = unit;
        this.statusWindow.setUnit(unit);
        this.statusWindow.open(this.modalRoot);
    }

    startEquipFlow(equipmentId) {
        const count = this.state.inventory.equipment[equipmentId] || 0;
        if (count <= 0) return;
        const modalContent = document.createElement('div');
        modalContent.className = 'sn-column';
        const title = document.createElement('div');
        title.className = 'sn-title';
        title.textContent = `Equip ${this.data.equipment[equipmentId].name}`;
        modalContent.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'sn-grid';
        this.state.roster.forEach(u => {
            const card = document.createElement('button');
            card.className = 'sn-list__item';
            card.appendChild(createSpriteEl(u, this.resolveAssetPath, '32px'));
            const text = document.createElement('div');
            text.innerHTML = `<div>${u.name}</div><div class="sn-hint">Lv${u.level}</div>`;
            card.appendChild(text);
            card.onclick = () => {
                this.equipmentPickerPreset = { id: equipmentId, source: 'inventory' };
                this.showCreatureModal(u);
                this.openEquipmentPicker(u);
                this.closeCenterModal();
            };
            grid.appendChild(card);
        });
        modalContent.appendChild(grid);
        this.centerModal.setTitle('EQUIP TO');
        this.centerModal.setHtml('');
        this.centerModal.content.appendChild(modalContent);
        this.centerModal.open(this.modalRoot);
    }

    closeCenterModal() {
        this.centerModal.close();
    }

    buildEquipmentOptions(unit) {
        const options = [];
        Object.entries(this.state.inventory.equipment).forEach(([id, count]) => {
            if (count > 0) options.push({ id, source: 'inventory', count });
        });
        this.state.roster.forEach(u => {
            if (u.equipmentId && u.uid !== unit.uid) {
                options.push({ id: u.equipmentId, source: 'unit', owner: u });
            }
        });
        return options;
    }

    openEquipmentPicker(unit) {
        const options = this.buildEquipmentOptions(unit);
        const content = document.createElement('div');
        content.className = 'sn-column';
        const header = document.createElement('div');
        header.className = 'sn-flex-space';
        header.innerHTML = `<span class="sn-title">Equipment Library</span><button class="sn-button">Close</button>`;
        content.appendChild(header);
        header.querySelector('button').onclick = () => this.closeCenterModal();
        const grid = document.createElement('div');
        grid.className = 'sn-grid';
        const noneCard = document.createElement('div');
        noneCard.className = 'sn-list__item';
        noneCard.innerHTML = '<div>Remove equipment</div>';
        noneCard.onclick = () => { this.unequipUnit(unit); this.closeCenterModal(); };
        grid.appendChild(noneCard);
        if (options.length === 0) {
            const none = document.createElement('div');
            none.className = 'sn-text-dim';
            none.textContent = 'No equipment available.';
            grid.appendChild(none);
        }
        options.forEach(opt => {
            const def = this.data.equipment[opt.id];
            const card = document.createElement('div');
            card.className = 'sn-list__item';
            let subtitle = def.description;
            if (opt.source === 'unit') subtitle = `Equipped by ${opt.owner.name}`;
            if (opt.source === 'inventory' && opt.count > 1) subtitle += ` (x${opt.count})`;
            card.innerHTML = `<div><div>${def.name}</div><div class="sn-hint">${subtitle}</div></div><span class="sn-text-dim">${opt.source}</span>`;
            card.onclick = () => {
                if (opt.source === 'unit') this.transferEquipment(unit, opt.owner, def.id);
                else this.equipFromInventory(unit, def.id);
                this.closeCenterModal();
            };
            grid.appendChild(card);
        });
        content.appendChild(grid);
        this.centerModal.setTitle('EQUIPMENT');
        this.centerModal.setHtml('');
        this.centerModal.content.appendChild(content);
        this.centerModal.open(this.modalRoot);
    }

    equipFromInventory(target, equipmentId) {
        const count = this.state.inventory.equipment[equipmentId] || 0;
        if (count <= 0) return;
        const previous = target.equipmentId;
        if (previous) {
            this.state.inventory.equipment[previous] = (this.state.inventory.equipment[previous] || 0) + 1;
        }
        this.state.inventory.equipment[equipmentId] = count - 1;
        if (this.state.inventory.equipment[equipmentId] <= 0) delete this.state.inventory.equipment[equipmentId];
        target.equipmentId = equipmentId;
        this.recomputeHp(target);
        this.renderParty();
        this.statusWindow.setUnit(target);
        Log.add(`${target.name} equipped ${this.data.equipment[equipmentId].name}.`);
    }

    transferEquipment(target, owner, equipmentId) {
        const previous = target.equipmentId;
        if (previous === equipmentId && owner.uid === target.uid) return;
        if (previous) {
            this.state.inventory.equipment[previous] = (this.state.inventory.equipment[previous] || 0) + 1;
        }
        if (owner && owner.equipmentId === equipmentId) {
            owner.equipmentId = null;
            this.recomputeHp(owner);
        }
        target.equipmentId = equipmentId;
        this.recomputeHp(target);
        this.renderParty();
        this.statusWindow.setUnit(target);
        Log.add(`${target.name} borrowed ${this.data.equipment[equipmentId].name}.`);
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        this.state.inventory.equipment[previous] = (this.state.inventory.equipment[previous] || 0) + 1;
        this.recomputeHp(unit);
        this.renderParty();
        this.statusWindow.setUnit(unit);
        Log.add(`${unit.name} removed ${this.data.equipment[previous].name}.`);
    }

    recomputeHp(unit) {
        const maxhp = this.systems?.Battle.getMaxHp(unit) ?? unit.maxhp ?? unit.hp;
        if (unit.hp > maxhp) unit.hp = maxhp;
    }

    showBanner(text) {
        this.bannerWindow.show(text);
    }

    togglePlayerTurn(active) {
        this.controlsWindow.setMode('BATTLE', false);
        this.controlsWindow.setTurnState(active);
    }

    showModal(html) {
        this.centerModal.setTitle('NOTICE');
        this.centerModal.setHtml(html);
        this.centerModal.open(this.modalRoot);
    }

    closeModal() {
        this.centerModal.close();
    }

    closeEvent() {
        this.eventWindow.close();
    }

    showEvent(title, content) {
        this.eventWindow.setContent(title, content);
        this.eventWindow.open(this.modalRoot);
    }

    addLogEntry(text, colorClass = '#cbd5e1') {
        this.logWindow.addEntry(text, colorClass);
    }
}
