
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';
import { Log } from '../log.js';
import { FlexLayout } from '../layout/FlexLayout.js';
import { GridLayout } from '../layout/GridLayout.js';
import { Component } from '../layout/Component.js';
import { TextComponent, ButtonComponent, WindowFrameComponent } from '../layout/components.js';
import { Game_Action } from '../classes/Game_Action.js';
import { Services } from '../ServiceLocator.js';

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
    }

    createLayout() {
        this.root.innerHTML = '';
        const winComponent = new Component('div', 'rpg-window w-2/3 h-3/4 bg-[#111] relative overflow-hidden flex flex-col');
        this.root.appendChild(winComponent.element);

        this.createHeader(winComponent);

        const contentContainer = new Component('div', 'flex-grow flex flex-row gap-4 p-4 overflow-hidden');
        winComponent.element.appendChild(contentContainer.element);

        this.createLeftColumn(contentContainer);
        this.createRightColumn(contentContainer);
    }

    createHeader(parentComponent) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'rpg-header flex justify-between items-center px-2 py-1 shrink-0';

        const title = document.createElement('div');
        title.innerText = 'CREATURE STATUS';
        title.className = 'tracking-widest';
        headerContainer.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'X';
        closeBtn.className = 'text-red-500 font-bold px-2 hover:text-red-400';
        closeBtn.onclick = () => this.hide();
        headerContainer.appendChild(closeBtn);

        parentComponent.element.appendChild(headerContainer);
    }

    createLeftColumn(parentComponent) {
        const leftCol = new Component('div', 'flex flex-col gap-2 w-1/3 shrink-0 border-r border-gray-800 pr-4');
        parentComponent.element.appendChild(leftCol.element);

        const spriteBox = new Component('div', 'w-full aspect-square border-2 border-dashed border-gray-700 flex items-center justify-center bg-black/60 shadow-inner status-sprite-frame relative');
        leftCol.element.appendChild(spriteBox.element);

        this._ui.sprite = document.createElement('span');
        this._ui.sprite.className = 'status-sprite';
        spriteBox.element.appendChild(this._ui.sprite);

        const infoBox = new Component('div', 'text-center w-full space-y-0.5');
        leftCol.element.appendChild(infoBox.element);

        this._ui.name = document.createElement('h2');
        this._ui.name.className = 'text-xl text-yellow-400 tracking-widest font-bold';
        infoBox.element.appendChild(this._ui.name);

        this._ui.details = document.createElement('div');
        this._ui.details.className = 'text-[10px] text-gray-400 flex justify-center gap-2';
        infoBox.element.appendChild(this._ui.details);

        const xpContainer = document.createElement('div');
        xpContainer.className = 'w-full bg-gray-900 h-1.5 mt-1 border border-gray-700 relative';
        this._ui.xpBar = document.createElement('div');
        this._ui.xpBar.className = 'bg-blue-500 h-full w-0';
        xpContainer.appendChild(this._ui.xpBar);
        infoBox.element.appendChild(xpContainer);

        this._ui.xpText = document.createElement('div');
        this._ui.xpText.className = 'text-[8px] text-gray-500';
        infoBox.element.appendChild(this._ui.xpText);

        const loreBox = new Component('div', 'mt-2 text-[9px] text-gray-400 italic leading-tight border-t border-gray-800 pt-2');
        this._ui.desc = document.createElement('div');
        loreBox.element.appendChild(this._ui.desc);
        leftCol.element.appendChild(loreBox.element);
    }

    createRightColumn(parentComponent) {
        const rightCol = new Component('div', 'flex flex-col gap-3 flex-grow relative overflow-y-auto no-scrollbar');
        parentComponent.element.appendChild(rightCol.element);

        const statsRow = new Component('div', 'grid grid-cols-2 gap-2');
        rightCol.element.appendChild(statsRow.element);

        const hpBox = new Component('div', 'bg-black/40 border border-gray-700 px-2 py-1 flex justify-between items-center');
        hpBox.element.innerHTML = '<span class="text-[10px] text-gray-500">HP</span>';
        this._ui.hp = document.createElement('span');
        this._ui.hp.className = 'text-green-400 font-mono';
        hpBox.element.appendChild(this._ui.hp);
        statsRow.element.appendChild(hpBox.element);

        const elemBox = new Component('div', 'bg-black/40 border border-gray-700 px-2 py-1 flex justify-between items-center');
        elemBox.element.innerHTML = '<span class="text-[10px] text-gray-500">ELM</span>';
        this._ui.elements = document.createElement('span');
        this._ui.elements.className = 'text-gray-300 text-[10px]';
        elemBox.element.appendChild(this._ui.elements);
        statsRow.element.appendChild(elemBox.element);

        const equipRow = new Component('div', 'bg-black/40 border border-gray-700 px-2 py-1 flex items-center gap-2 cursor-pointer hover:border-yellow-400 transition-colors');
        equipRow.element.innerHTML = '<span class="text-[10px] text-gray-500 w-10 shrink-0">EQUIP</span>';
        this._ui.equipSlot = document.createElement('div');
        this._ui.equipSlot.className = 'flex-grow text-yellow-200 text-sm truncate';
        equipRow.element.appendChild(this._ui.equipSlot);
        rightCol.element.appendChild(equipRow.element);

        equipRow.element.addEventListener('click', () => {
             if (this._unit && this._unit.equipmentId) {
                 this.unequipUnit(this._unit);
             } else if (this._unit) {
                 this.startEquipFlow(null);
             }
        });

        this.createCompactActions(rightCol);
        this.createEquipmentLibrary(rightCol);
    }

    createCompactActions(parentComponent) {
        const passContainer = new Component('div', 'text-[10px]');
        passContainer.element.innerHTML = '<div class="text-gray-500 mb-0.5">PASSIVE</div>';
        this._ui.passive = document.createElement('div');
        this._ui.passive.className = 'text-gray-300 bg-black/40 p-1 border border-gray-800 mb-2';
        passContainer.element.appendChild(this._ui.passive);
        parentComponent.element.appendChild(passContainer.element);

        const actContainer = new Component('div', 'text-[10px]');
        actContainer.element.innerHTML = '<div class="text-gray-500 mb-0.5">ACTIONS</div>';
        this._ui.actions = document.createElement('div');
        this._ui.actions.className = 'grid grid-cols-2 gap-1';
        actContainer.element.appendChild(this._ui.actions);
        parentComponent.element.appendChild(actContainer.element);
    }

    createEquipmentLibrary(parentComponent) {
        const libBox = new Component('div', 'hidden flex-col gap-2 bg-black/80 border border-gray-700 p-2 absolute inset-0 z-10');
        parentComponent.element.appendChild(libBox.element);
        this._ui.libraryBox = libBox.element;

        const libHeader = document.createElement('div');
        libHeader.className = 'flex justify-between items-center border-b border-gray-600 pb-1 mb-1';
        libHeader.innerHTML = '<h3 class="text-gray-300 tracking-wide text-[10px]">EQUIPMENT</h3>';
        libBox.element.appendChild(libHeader);

        this._ui.closePicker = document.createElement('button');
        this._ui.closePicker.className = 'text-[10px] text-red-400 hover:text-red-200';
        this._ui.closePicker.innerText = 'CLOSE';
        this._ui.closePicker.onclick = () => this.endEquipFlow();
        libHeader.appendChild(this._ui.closePicker);

        this._ui.equipOptions = document.createElement('div');
        this._ui.equipOptions.className = 'grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-grow';
        libBox.element.appendChild(this._ui.equipOptions);

        this._ui.previewPane = document.createElement('div');
        this._ui.previewPane.className = 'border-t border-gray-600 pt-2 hidden flex-col gap-1 text-[10px] text-gray-300';
        libBox.element.appendChild(this._ui.previewPane);

        this._ui.equipHint = document.createElement('div');
        this._ui.equipHint.style.display = 'none';
    }

    setUnit(unit) {
        this._unit = unit;
        this.endEquipFlow();
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
        if (this._ui.libraryBox) {
            this._ui.libraryBox.classList.remove('hidden');
            this._ui.libraryBox.classList.add('flex');
            if (this._ui.previewPane) {
                this._ui.previewPane.innerHTML = '';
                this._ui.previewPane.classList.add('hidden');
                this._ui.previewPane.classList.remove('flex');
            }
        }

        const list = window.$gameParty.roster.map(u => ({ owner: u, id: u.equipmentId, source: 'unit' })).filter(x => x.id);
        const inv = Object.keys(window.$gameParty.inventory.equipment).map(key => ({ owner: null, id: key, source: 'inventory' }));
        const options = [...list, ...inv];

        const first = this._unit;
        this.equipmentPickerPreset = id ? { id, source: 'inventory' } : null;

        this._ui.equipOptions.innerHTML = '';

        if (options.length === 0) {
             const emptyMsg = this.createEl('div', 'col-span-2 text-gray-500 text-center py-4', this._ui.equipOptions);
             emptyMsg.innerText = 'No equipment available.';
             return;
        }

        options.forEach(opt => {
            const def = Services.get('EquipmentRegistry').get(opt.id);
            const name = typeof opt.owner?.name === 'function' ? opt.owner.name() : opt.owner?.name;
            const subtitle = opt.source === 'unit' ? `Held by ${name}` : 'Inventory';

            const cardInner = this.createEl('div', 'rpg-window bg-black/60 border border-gray-700 p-2 cursor-pointer hover:border-yellow-400', this._ui.equipOptions);

            if (this.equipmentPickerPreset && this.equipmentPickerPreset.id === opt.id && this.equipmentPickerPreset.source === opt.source) {
                cardInner.classList.add('border-yellow-500');
            }

            cardInner.innerHTML = `<div class="flex justify-between items-center"><div class="text-yellow-200">${def.name}</div><span class="text-[10px] text-gray-500 uppercase">${opt.source}</span></div><div class="text-[10px] text-gray-400 leading-tight">${subtitle}</div>`;
            cardInner.addEventListener('click', () => {
                this.showEquipPreview(first, opt, def);
            });
        });
    }

    showEquipPreview(target, option, equipmentDef) {
        const pane = this._ui.previewPane;
        pane.innerHTML = '';
        pane.classList.remove('hidden');
        pane.classList.add('flex');

        const traits = equipmentDef.traits || [];
        const traitsHtml = traits.map(t => {
            if (t.type === 'hp_bonus_percent') return `Max HP +${Math.round(parseFloat(t.formula)*100)}%`;
            if (t.type === 'xp_bonus_percent') return `XP Gain +${Math.round(parseFloat(t.formula)*100)}%`;
            if (t.type === 'power_bonus') return `Power +${t.formula}`;
            if (t.type === 'speed_bonus') return `Speed +${t.formula}`;
            return t.type.replace(/_/g, ' ');
        }).join(', ');

        const info = document.createElement('div');
        info.className = 'text-yellow-100 font-bold mb-1';
        info.innerText = `Preview: ${equipmentDef.name}`;
        pane.appendChild(info);

        const desc = document.createElement('div');
        desc.className = 'italic text-gray-400 mb-2';
        desc.innerText = equipmentDef.description || traitsHtml;
        pane.appendChild(desc);

        if (option.source === 'unit' && option.owner) {
            const warn = document.createElement('div');
            warn.className = 'text-red-400 mb-2 border border-red-900 bg-red-900/20 p-1';
            const ownerName = typeof option.owner.name === 'function' ? option.owner.name() : option.owner.name;
            warn.innerText = `Currently held by ${ownerName}. Swap?`;
            pane.appendChild(warn);
        }

        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 justify-end mt-1';
        pane.appendChild(btnRow);

        const btnCancel = new ButtonComponent('CANCEL', () => {
            pane.classList.add('hidden');
            pane.classList.remove('flex');
        }, 'text-gray-400 border border-gray-600 px-2 py-1 text-[10px] hover:text-white').element;

        const btnConfirm = new ButtonComponent('EQUIP', () => {
             if (option.source === 'unit') this.transferEquipment(target, option.owner, equipmentDef.id);
             else this.equipFromInventory(target, equipmentDef.id);
             this.endEquipFlow();
        }, 'text-black bg-yellow-500 border border-yellow-600 px-2 py-1 text-[10px] hover:bg-yellow-400').element;

        btnRow.appendChild(btnCancel);
        btnRow.appendChild(btnConfirm);
    }

    endEquipFlow() {
        if (this._ui.libraryBox) {
            this._ui.libraryBox.classList.add('hidden');
            this._ui.libraryBox.classList.remove('flex');
        }
    }

    equipFromInventory(target, equipmentId) {
        if (!window.$gameParty.hasEquipment(equipmentId)) return;
        const previous = target.equipmentId;

        window.$gameParty.loseEquipment(equipmentId, 1);

        if (previous) {
            window.$gameParty.gainEquipment(previous, 1);
        }

        target.equipmentId = equipmentId;
        this.recomputeHp(target);

        const def = Services.get('EquipmentRegistry').get(equipmentId);
        const name = typeof target.name === 'function' ? target.name() : target.name;
        Log.add(`${name} equipped ${def.name}.`);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        this.refresh();
    }

    transferEquipment(target, owner, equipmentId) {
        const previous = target.equipmentId;
        if (previous === equipmentId && owner.uid === target.uid) return;
        if (previous) {
            window.$gameParty.gainEquipment(previous, 1);
        }
        if (owner && owner.equipmentId === equipmentId) {
            owner.equipmentId = null;
            this.recomputeHp(owner);
        }
        target.equipmentId = equipmentId;
        this.recomputeHp(target);

        const def = Services.get('EquipmentRegistry').get(equipmentId);
        const name = typeof target.name === 'function' ? target.name() : target.name;
        const ownerName = typeof owner.name === 'function' ? owner.name() : owner.name;
        Log.add(`${name} borrowed ${def.name} from ${ownerName}.`);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        this.refresh();
    }

    unequipUnit(unit) {
        if (!unit.equipmentId) return;
        const previous = unit.equipmentId;
        unit.equipmentId = null;
        window.$gameParty.gainEquipment(previous, 1);
        this.recomputeHp(unit);
        const def = Services.get('EquipmentRegistry').get(previous);
        const name = typeof unit.name === 'function' ? unit.name() : unit.name;
        Log.add(`${name} removed ${def.name}.`);
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

    refresh() {
        if (!this._unit) return;
        const unit = this._unit;
        const def = Services.get('CreatureRegistry').get(unit.speciesId);

        let maxhp = 0;
        if (typeof unit.mhp === 'number') maxhp = unit.mhp;
        else if (typeof unit.mhp === 'function') maxhp = unit.mhp();
        else maxhp = 1;

        const name = typeof unit.name === 'function' ? unit.name() : unit.name;

        this._ui.sprite.innerHTML = spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');
        this._ui.name.innerText = name;
        this._ui.details.innerText = `Lv.${unit.level || 1} | ${def.race} | ${def.temperament}`;

        const xpNeeded = (unit.level || 1) * 100;
        const xpCurrent = unit.exp || 0;
        const xpPct = Math.min(100, Math.max(0, (xpCurrent / xpNeeded) * 100));
        this._ui.xpBar.style.width = `${xpPct}%`;
        this._ui.xpText.innerText = `${xpCurrent} / ${xpNeeded} XP`;

        this._ui.hp.innerText = `${unit.hp}/${maxhp}`;
        this._ui.elements.innerText = (unit.elements || []).join(', ');

        if (this._ui.passive) {
            this._ui.passive.innerHTML = '';
            if (def.passives && def.passives.length > 0) {
                def.passives.forEach(passiveId => {
                    const passive = Services.get('PassiveRegistry').get(passiveId);
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

        if (this._ui.actions) {
            this._ui.actions.innerHTML = '';
            const uniqueSkills = new Set();
            (def.acts || []).flat().forEach(id => {
                if (id !== 'wait' && id !== 'guard') uniqueSkills.add(id);
            });

            uniqueSkills.forEach(skillId => {
                const skill = Services.get('SkillRegistry').get(skillId);
                if (skill) {
                    const card = this.createEl('div', 'rpg-window px-3 py-2 bg-black/70 border border-gray-700', this._ui.actions);
                    card.innerHTML = `<div class="text-yellow-200">${skill.name}</div><div class="text-[10px] text-gray-400">${skill.description || ''}</div>`;
                }
            });
        }

        if (this._ui.equipSlot) {
            if (unit.equipmentId) {
                const eq = Services.get('EquipmentRegistry').get(unit.equipmentId);
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
        super();
        this.root.id = 'inventory-modal';
        this.root.className = 'hidden absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm';

        const container = document.getElementById('game-container');
        if (container) container.appendChild(this.root);
    }

    initialize() {
        super.initialize();
        this.createLayout();
    }

    createLayout() {
        this.root.innerHTML = '';

        this.frame = new WindowFrameComponent('w-1/2 h-2/3 flex flex-col bg-[#0a0a0a]');
        this.root.appendChild(this.frame.element);

        this.layout = new FlexLayout(this.frame.element, { direction: 'column' });

        const header = new Component('div', 'rpg-header flex justify-between');
        const title = new TextComponent('INVENTORY');
        const closeBtn = new ButtonComponent('X', () => this.hide(), 'text-red-500 px-2 hover:bg-red-900 border-none');

        header.element.appendChild(title.element);
        header.element.appendChild(closeBtn.element);
        this.layout.add(header);

        this.listContainer = new Component('div', 'flex-grow p-4 overflow-y-auto no-scrollbar');
        this.layout.add(this.listContainer, { grow: 1 });

        // Help Text Footer
        this._helpTextComponent = new Component('div', 'bg-[#1a1a1a] border-t border-gray-700 p-2 text-xs text-gray-300 italic min-h-[3rem]');
        this.layout.add(this._helpTextComponent);

        this.targetPicker = new Component('div', 'hidden absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20');
        this.frame.element.appendChild(this.targetPicker.element);
    }

    setHelpText(text) {
        if (this._helpTextComponent) {
            this._helpTextComponent.element.innerText = text || '';
        }
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.show();
            this.select(0);
        } else {
            this.hide();
        }
    }

    refresh() {
        this._items = [];
        const equipment = window.$gameParty.inventory.equipment;
        const items = window.$gameParty.inventory.items;

        Object.keys(equipment).forEach(id => {
            this._items.push({ type: 'equipment', id, count: equipment[id] });
        });
        Object.keys(items).forEach(id => {
            this._items.push({ type: 'item', id, count: items[id] });
        });

        super.refresh();
    }

    clear() {
        if (this.listContainer) {
            this.listContainer.element.innerHTML = '';
        }
    }

    drawItem(index) {
        if (!this.listContainer) return;
        const item = this._items[index];
        if (!item) return;

        // Lookup Def
        let def;
        if (item.type === 'equipment') def = Services.get('EquipmentRegistry').get(item.id);
        else def = Services.get('ItemRegistry').get(item.id);

        item.description = def.description;
        item.name = def.name;

        const row = new Component('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1');
        if (this._index === index) {
            row.addClass('border-yellow-400');
            row.addClass('bg-gray-800');
        }

        // Removed inline description to de-clutter, as per new help strategy
        row.element.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-[10px] text-gray-400">x${item.count}</span></div>`;

        const btnText = item.type === 'equipment' ? 'EQUIP' : 'USE';
        const btn = new ButtonComponent(btnText, () => {
             this.select(index);
             this.processOk();
        }, 'text-[10px] border border-gray-600 px-2 py-1 hover:bg-white hover:text-black');

        row.element.appendChild(btn.element);
        this.listContainer.element.appendChild(row.element);
    }

    processOk() {
        const index = this._index;
        const item = this._items[index];
        if (!item) return;

        if (item.type === 'equipment') {
            window.Game.Windows.CreatureModal.startEquipFlow(item.id);
        } else {
            const def = Services.get('ItemRegistry').get(item.id);
            this.showTargetPicker(item.id, def);
        }
    }

    showTargetPicker(itemId, itemDef) {
        if (!this.targetPicker) return;
        const picker = this.targetPicker.element;
        picker.innerHTML = '';
        picker.classList.remove('hidden');
        picker.classList.add('flex');

        const label = document.createElement('div');
        label.className = 'text-yellow-200 mb-4 text-sm';
        label.innerText = `Use ${itemDef.name} on whom?`;
        picker.appendChild(label);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-2 w-full px-8';
        picker.appendChild(grid);

        window.$gameParty.activeSlots.forEach(unit => {
             if (!unit) return;

             const btn = document.createElement('button');
             btn.className = 'bg-gray-800 border border-gray-600 p-2 text-left hover:border-yellow-400 flex justify-between items-center';

             const name = typeof unit.name === 'function' ? unit.name() : unit.name;
             const hpPct = Math.round((unit.hp / unit.mhp) * 100);

             btn.innerHTML = `<span>${name}</span> <span class="text-[10px] text-gray-400">HP ${unit.hp}/${unit.mhp}</span>`;

             btn.onclick = () => {
                 this.useItem(unit, itemId);
                 picker.classList.add('hidden');
             };

             grid.appendChild(btn);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'mt-4 text-red-400 text-xs hover:text-white';
        cancelBtn.innerText = 'CANCEL';
        cancelBtn.onclick = () => picker.classList.add('hidden');
        picker.appendChild(cancelBtn);
    }

    useItem(target, itemId) {
        if (!window.$gameParty.hasItem(itemId)) return;
        const itemDef = Services.get('ItemRegistry').get(itemId);

        const action = new Game_Action(target);
        action._subject = target;
        action.setItem(itemDef);

        const effects = itemDef.effects || [];
        const isRevive = effects.some(e => e.type === 'revive');
        const isHeal = effects.some(e => e.type.includes('heal'));

        if (target.hp === 0 && !isRevive) {
            Log.add(`${target.name} is incapacitated.`);
            return;
        }
        if (target.hp === target.mhp && isHeal && !isRevive) {
             Log.add(`${target.name} is already healthy.`);
             return;
        }
        if (target.hp > 0 && isRevive) {
             Log.add(`${target.name} is not incapacitated.`);
             return;
        }

        const results = action.apply(target);

        let used = false;
        results.forEach(res => {
            if (res.effect.type.includes('heal') || res.effect.type === 'revive' || res.effect.type === 'increase_max_hp' || res.effect.type === 'increase_level') {
                const oldHp = target.hp;

                if (res.effect.type === 'revive' && target.hp === 0) {
                     target.hp += res.value;
                     target.removeState('ko');
                } else if (res.effect.type === 'increase_max_hp') {
                     target.maxHpBonus = (target.maxHpBonus || 0) + res.value;
                     target.hp += res.value;
                     Log.add(`${target.name}'s Max HP increased!`);
                } else if (res.effect.type === 'increase_level') {
                     target.levelUp();
                     Log.add(`${target.name} leveled up!`);
                } else {
                     target.hp += res.value;
                }

                if (target.hp > target.mhp) target.hp = target.mhp;

                if (target.hp !== oldHp || res.effect.type === 'increase_max_hp' || res.effect.type === 'increase_level') {
                    used = true;
                    const diff = target.hp - oldHp;
                    if (diff > 0) {
                         if (window.Game.Windows.Party) window.Game.Windows.Party.onUnitHpChange(target, diff);
                    }
                }
            }
        });

        if (used) {
            window.$gameParty.loseItem(itemId, 1);
            Log.add(`Used ${itemDef.name} on ${target.name}.`);
            this.refresh();
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        } else {
             Log.add('No effect.');
        }
    }
}

/**
 * Window for managing party formation and reserves.
 */
export class Window_PartyMenu extends Window_Selectable {
    constructor() {
        super();
        this.root.id = 'party-modal';
        this.root.className = 'hidden absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm';

        const container = document.getElementById('game-container');
        if (container) container.appendChild(this.root);
    }

    initialize() {
        super.initialize();
        this._pendingSwapIndex = -1;
        this.createLayout();
    }

    maxCols() { return 6; }

    createLayout() {
        this.root.innerHTML = '';

        this.frame = new WindowFrameComponent('w-2/3 h-3/4 flex flex-col bg-[#0a0a0a]');
        this.root.appendChild(this.frame.element);

        const layout = new FlexLayout(this.frame.element, { direction: 'column' });

        const header = new Component('div', 'rpg-header flex justify-between');
        const title = new TextComponent('PARTY / RESERVE');
        const closeBtn = new ButtonComponent('X', () => this.hide(), 'text-red-500 px-2 hover:bg-red-900 border-none');

        header.element.appendChild(title.element);
        header.element.appendChild(closeBtn.element);
        layout.add(header);

        const hint = new Component('div', 'p-2 text-[10px] text-gray-400 border-b border-gray-700');
        hint.element.innerText = 'Arrows to move, Space/Enter to select/swap, Esc to close.';
        layout.add(hint);

        this.gridContainer = new Component('div', 'p-2 overflow-y-auto no-scrollbar flex-grow');
        layout.add(this.gridContainer, { grow: 1 });

        this.grid = new GridLayout(this.gridContainer.element, {
            columns: 'repeat(6, 1fr)',
            rows: 'repeat(5, minmax(0, 1fr))',
            gap: 4
        });

        // Help Text Footer
        this._helpTextComponent = new Component('div', 'bg-[#1a1a1a] border-t border-gray-700 p-2 text-xs text-gray-300 italic min-h-[3rem]');
        this._helpTextComponent.element.id = 'party-help-text';
        layout.add(this._helpTextComponent);
    }

    setHelpText(text) {
        if (this._helpTextComponent) {
            this._helpTextComponent.element.innerText = text || '';
        }
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.refresh();
            this.show();
            this.select(0);
        } else {
            this.hide();
        }
    }

    clear() {
        if (this.grid) this.grid.clear();
    }

    refresh() {
        if (!this.grid) return;
        this.grid.clear();

        const activeSlots = window.$gameParty.activeSlots;

        const activeSet = new Set(activeSlots.filter(Boolean).map(u => u.uid));
        const reserveUnits = window.$gameParty.roster.filter(u => !activeSet.has(u.uid));
        let reserveUnitIndex = 0;

        this._items = [];
        for (let row = 1; row <= 5; row++) {
            for (let col = 1; col <= 6; col++) {
                let item = { row, col, type: 'empty' };

                if (col <= 3 && row <= 2) {
                    const slotIdx = (row - 1) * 3 + (col - 1);
                    item.type = 'active';
                    item.index = slotIdx;
                    item.unit = activeSlots[slotIdx];
                } else {
                    item.type = 'reserve';
                    item.unit = reserveUnitIndex < reserveUnits.length ? reserveUnits[reserveUnitIndex++] : null;
                    item.isReserved = true;
                }

                // Add description for Help Window
                if (item.unit) {
                    const def = Services.get('CreatureRegistry').get(item.unit.speciesId);
                    item.description = def ? def.description : '';
                    item.name = typeof item.unit.name === 'function' ? item.unit.name() : item.unit.name;
                }

                this._items.push(item);
            }
        }

        super.refresh();
    }

    drawItem(index) {
        const item = this._items[index];
        if (!item) return;

        const div = document.createElement('div');
        let baseClasses = 'party-menu-slot relative flex flex-col p-1';
        if (item.type === 'active') baseClasses += ' bg-gray-800/50';

        div.className = baseClasses;

        let isSelected = (this._index === index);
        if (isSelected) div.classList.add('selected', 'border', 'border-yellow-400');
        if (this._pendingSwapIndex === index) div.classList.add('border-green-500', 'border-2');

        if (item.unit) {
             div.innerHTML = renderCreaturePanel(item.unit);
        } else {
             div.innerHTML = '<span class="m-auto text-gray-600 text-[10px]">EMPTY</span>';
        }

        const options = { col: item.col, row: item.row };
        this.grid.add(div, options);
    }

    processOk() {
        const index = this._index;
        const item = this._items[index];
        if (!item) return;

        if (this._pendingSwapIndex === -1) {
            this._pendingSwapIndex = index;
            this.refresh();
        } else {
            const fromItem = this._items[this._pendingSwapIndex];
            const toItem = item;

            this.executeSwap(fromItem, toItem);
            this._pendingSwapIndex = -1;
            this.refresh();
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        }
    }

    processCancel() {
        if (this._pendingSwapIndex !== -1) {
            this._pendingSwapIndex = -1;
            this.refresh();
        } else {
            super.processCancel();
        }
    }

    executeSwap(fromItem, toItem) {
        // Logic copied/adapted from onPartySlotClick

        const fromIsReserved = (fromItem.type === 'reserve');
        const toIsReserved = (toItem.type === 'reserve');

        const fromUnit = fromItem.unit;
        const toUnit = toItem.unit; // Might be null (Empty slot)

        const activePartySize = window.$gameParty.activeCreatureCount();
        if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= window.$gameParty.maxCreatureSlots()) {
             alert("Active party is full.");
             return;
        }

        const fromIndex = fromItem.type === 'active' ? fromItem.index : -1;
        const toIndex = toItem.type === 'active' ? toItem.index : -1;

        if (fromIsReserved && !toIsReserved) { // Reserve -> Active
             window.$gameParty.activeSlots[toIndex] = fromUnit;
             if(toUnit) toUnit.slotIndex = -1;
             fromUnit.slotIndex = toIndex;
        } else if (!fromIsReserved && toIsReserved) { // Active -> Reserve
             window.$gameParty.activeSlots[fromIndex] = toUnit;
             if (toUnit) toUnit.slotIndex = fromIndex;
             fromUnit.slotIndex = -1;
        } else if (!fromIsReserved && !toIsReserved) { // Active <-> Active
             window.$gameParty.swapOrder(fromIndex, toIndex);
        } else if (fromIsReserved && toIsReserved) {
             // Reserve <-> Reserve (No-op visually unless roster reordered)
        }
    }
}
