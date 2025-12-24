
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

        // Event Delegation for Equip Slot (if still needed, though I'll attach handler directly)
    }

    createLayout() {
        // Clear root
        this.root.innerHTML = '';

        // Main Window Frame: Compact width/height for a denser look
        const winComponent = new Component('div', 'rpg-window w-2/3 h-3/4 bg-[#111] relative overflow-hidden flex flex-col');
        this.root.appendChild(winComponent.element);

        // Header
        this.createHeader(winComponent); // Header is now part of the frame layout

        // Main Content Container (Row)
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

        // Sprite Box
        const spriteBox = new Component('div', 'w-full aspect-square border-2 border-dashed border-gray-700 flex items-center justify-center bg-black/60 shadow-inner status-sprite-frame relative');
        leftCol.element.appendChild(spriteBox.element);

        this._ui.sprite = document.createElement('span');
        this._ui.sprite.className = 'status-sprite';
        spriteBox.element.appendChild(this._ui.sprite);

        // Name & Compact Info
        const infoBox = new Component('div', 'text-center w-full space-y-0.5');
        leftCol.element.appendChild(infoBox.element);

        this._ui.name = document.createElement('h2');
        this._ui.name.className = 'text-xl text-yellow-400 tracking-widest font-bold';
        infoBox.element.appendChild(this._ui.name);

        this._ui.details = document.createElement('div');
        this._ui.details.className = 'text-[10px] text-gray-400 flex justify-center gap-2';
        infoBox.element.appendChild(this._ui.details); // Holds Lv, Race, Temperament

        // XP Bar (Visual)
        const xpContainer = document.createElement('div');
        xpContainer.className = 'w-full bg-gray-900 h-1.5 mt-1 border border-gray-700 relative';
        this._ui.xpBar = document.createElement('div');
        this._ui.xpBar.className = 'bg-blue-500 h-full w-0';
        xpContainer.appendChild(this._ui.xpBar);
        infoBox.element.appendChild(xpContainer);

        this._ui.xpText = document.createElement('div');
        this._ui.xpText.className = 'text-[8px] text-gray-500';
        infoBox.element.appendChild(this._ui.xpText);

        // Lore (Moved to left column to fill space)
        const loreBox = new Component('div', 'mt-2 text-[9px] text-gray-400 italic leading-tight border-t border-gray-800 pt-2');
        this._ui.desc = document.createElement('div');
        loreBox.element.appendChild(this._ui.desc);
        leftCol.element.appendChild(loreBox.element);
    }

    createRightColumn(parentComponent) {
        const rightCol = new Component('div', 'flex flex-col gap-3 flex-grow relative overflow-y-auto no-scrollbar');
        parentComponent.element.appendChild(rightCol.element);

        // Combined Stats Row
        const statsRow = new Component('div', 'grid grid-cols-2 gap-2');
        rightCol.element.appendChild(statsRow.element);

        // HP Box
        const hpBox = new Component('div', 'bg-black/40 border border-gray-700 px-2 py-1 flex justify-between items-center');
        hpBox.element.innerHTML = '<span class="text-[10px] text-gray-500">HP</span>';
        this._ui.hp = document.createElement('span');
        this._ui.hp.className = 'text-green-400 font-mono';
        hpBox.element.appendChild(this._ui.hp);
        statsRow.element.appendChild(hpBox.element);

        // Elements Box
        const elemBox = new Component('div', 'bg-black/40 border border-gray-700 px-2 py-1 flex justify-between items-center');
        elemBox.element.innerHTML = '<span class="text-[10px] text-gray-500">ELM</span>';
        this._ui.elements = document.createElement('span');
        this._ui.elements.className = 'text-gray-300 text-[10px]';
        elemBox.element.appendChild(this._ui.elements);
        statsRow.element.appendChild(elemBox.element);

        // Equipment (Compact)
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

        // Passives & Actions
        this.createCompactActions(rightCol);
        this.createEquipmentLibrary(rightCol);
    }

    createCompactActions(parentComponent) {
        // Passives
        const passContainer = new Component('div', 'text-[10px]');
        passContainer.element.innerHTML = '<div class="text-gray-500 mb-0.5">PASSIVE</div>';
        this._ui.passive = document.createElement('div');
        this._ui.passive.className = 'text-gray-300 bg-black/40 p-1 border border-gray-800 mb-2';
        passContainer.element.appendChild(this._ui.passive);
        parentComponent.element.appendChild(passContainer.element);

        // Actions
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
        this._ui.libraryBox = libBox.element; // Keep ref to toggle visibility

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

        // Preview Pane (Bottom)
        this._ui.previewPane = document.createElement('div');
        this._ui.previewPane.className = 'border-t border-gray-600 pt-2 hidden flex-col gap-1 text-[10px] text-gray-300';
        libBox.element.appendChild(this._ui.previewPane);

        // No hint needed, flows are explicit
        this._ui.equipHint = document.createElement('div');
        this._ui.equipHint.style.display = 'none';
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
        if (this._ui.libraryBox) {
            this._ui.libraryBox.classList.remove('hidden');
            this._ui.libraryBox.classList.add('flex');
            // Reset preview
            if (this._ui.previewPane) {
                this._ui.previewPane.innerHTML = '';
                this._ui.previewPane.classList.add('hidden');
                this._ui.previewPane.classList.remove('flex');
            }
        }

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

        // Logic to preview stats
        // We clone the unit roughly to see diff
        // But cloning game objects is hard.
        // Better to just calculate expected changes or list traits.

        // Show Traits
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

        // Warning if held
        if (option.source === 'unit' && option.owner) {
            const warn = document.createElement('div');
            warn.className = 'text-red-400 mb-2 border border-red-900 bg-red-900/20 p-1';
            const ownerName = typeof option.owner.name === 'function' ? option.owner.name() : option.owner.name;
            warn.innerText = `Currently held by ${ownerName}. Swap?`;
            pane.appendChild(warn);
        }

        // Buttons
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

    // Legacy support if anything calls closeCenterModal
    closeCenterModal() {
        this.endEquipFlow();
    }

    equipFromInventory(target, equipmentId) {
        if (!window.$gameParty.hasEquipment(equipmentId)) return;
        const previous = target.equipmentId;

        // Remove item from inventory
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

    /**
     * Updates the modal content with the current unit's details.
     */
    refresh() {
        if (!this._unit) return;
        const unit = this._unit;
        // Use Registry
        const def = Services.get('CreatureRegistry').get(unit.speciesId);

        let maxhp = 0;
        if (typeof unit.mhp === 'number') maxhp = unit.mhp;
        else if (typeof unit.mhp === 'function') maxhp = unit.mhp();
        else maxhp = 1;

        const name = typeof unit.name === 'function' ? unit.name() : unit.name;

        // Sprite
        this._ui.sprite.innerHTML = spriteMarkup(unit, 'h-28 w-28 object-contain', 'status-sprite');

        // Info
        this._ui.name.innerText = name;
        this._ui.details.innerText = `Lv.${unit.level || 1} | ${def.race} | ${def.temperament}`;

        // XP Bar
        // Simple visual mock for now, assuming next level needs 100 * level
        const xpNeeded = (unit.level || 1) * 100;
        const xpCurrent = unit.exp || 0;
        const xpPct = Math.min(100, Math.max(0, (xpCurrent / xpNeeded) * 100));
        this._ui.xpBar.style.width = `${xpPct}%`;
        this._ui.xpText.innerText = `${xpCurrent} / ${xpNeeded} XP`;

        // Stats
        this._ui.hp.innerText = `${unit.hp}/${maxhp}`;
        this._ui.elements.innerText = (unit.elements || []).join(', ');

        // Passive
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
                const skill = Services.get('SkillRegistry').get(skillId);
                if (skill) {
                    const card = this.createEl('div', 'rpg-window px-3 py-2 bg-black/70 border border-gray-700', this._ui.actions);
                    card.innerHTML = `<div class="text-yellow-200">${skill.name}</div><div class="text-[10px] text-gray-400">${skill.description || ''}</div>`;
                }
            });
        }

        // Equipment Button
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

        // Window Frame
        this.frame = new WindowFrameComponent('w-1/2 h-2/3 flex flex-col bg-[#0a0a0a]');
        this.root.appendChild(this.frame.element);

        // Layout
        this.layout = new FlexLayout(this.frame.element, { direction: 'column' });

        // Header
        const header = new Component('div', 'rpg-header flex justify-between');
        const title = new TextComponent('INVENTORY');
        const closeBtn = new ButtonComponent('X', () => this.hide(), 'text-red-500 px-2 hover:bg-red-900 border-none');

        header.element.appendChild(title.element);
        header.element.appendChild(closeBtn.element);
        this.layout.add(header);

        // Content
        this.listContainer = new Component('div', 'flex-grow p-4 overflow-y-auto no-scrollbar');
        this.layout.add(this.listContainer, { grow: 1 });

        // Target Picker (Hidden by default)
        this.targetPicker = new Component('div', 'hidden absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20');
        this.frame.element.appendChild(this.targetPicker.element);
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.refresh();
            this.show();
        } else {
            this.hide();
        }
    }

    refresh() {
        if (!this.listContainer) return;
        this.listContainer.element.innerHTML = '';

        if (this.targetPicker) {
            this.targetPicker.element.classList.add('hidden');
            this.targetPicker.element.innerHTML = '';
        }

        const eqKeys = Object.keys(window.$gameParty.inventory.equipment);

        if (eqKeys.length > 0) {
            const eqTitle = new Component('div', 'text-yellow-400 mb-2');
            eqTitle.element.innerText = 'Equipment';
            this.listContainer.element.appendChild(eqTitle.element);

            eqKeys.forEach(id => {
                const count = window.$gameParty.inventory.equipment[id];
                const def = Services.get('EquipmentRegistry').get(id);
                if (!def) return;
                const row = new Component('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1');
                row.element.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-[10px] text-gray-400">x${count}</span><div class="text-[10px] text-gray-500">${def.description}</div></div>`;

                const btn = new ButtonComponent('EQUIP', () => {
                     window.Game.Windows.CreatureModal.startEquipFlow(id);
                }, 'text-[10px] border border-gray-600 px-2 py-1 hover:bg-white hover:text-black');

                row.element.appendChild(btn.element);
                this.listContainer.element.appendChild(row.element);
            });
        }

        const itemKeys = Object.keys(window.$gameParty.inventory.items);
        if (itemKeys.length > 0) {
            const itmTitle = new Component('div', 'text-yellow-400 mt-4 mb-2');
            itmTitle.element.innerText = 'Items';
            this.listContainer.element.appendChild(itmTitle.element);

            itemKeys.forEach(id => {
                const count = window.$gameParty.inventory.items[id];
                const def = Services.get('ItemRegistry').get(id);
                if (!def) return;
                const row = new Component('div', 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1');
                row.element.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-[10px] text-gray-400">x${count}</span><div class="text-[10px] text-gray-500">${def.description}</div></div>`;

                const btn = new ButtonComponent('USE', () => {
                     this.showTargetPicker(id, def);
                }, 'text-[10px] border border-gray-600 px-2 py-1 hover:bg-white hover:text-black');
                row.element.appendChild(btn.element);
                this.listContainer.element.appendChild(row.element);
            });
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

        // Execute Action
        const action = new Game_Action(target);
        action._subject = target;
        action.setItem(itemDef);

        // Check conditions
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

        // Apply results
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
        this.createLayout();
    }

    createLayout() {
        this.root.innerHTML = '';

        // Frame
        this.frame = new WindowFrameComponent('w-2/3 h-3/4 flex flex-col bg-[#0a0a0a]');
        this.root.appendChild(this.frame.element);

        const layout = new FlexLayout(this.frame.element, { direction: 'column' });

        // Header
        const header = new Component('div', 'rpg-header flex justify-between');
        const title = new TextComponent('PARTY / RESERVE');
        const closeBtn = new ButtonComponent('X', () => this.hide(), 'text-red-500 px-2 hover:bg-red-900 border-none');

        header.element.appendChild(title.element);
        header.element.appendChild(closeBtn.element);
        layout.add(header);

        // Hint
        const hint = new Component('div', 'p-2 text-[10px] text-gray-400 border-b border-gray-700');
        hint.element.innerText = 'Click a unit to select it, then click another unit or an empty slot to swap them.';
        layout.add(hint);

        // Grid Container
        this.gridContainer = new Component('div', 'p-2 overflow-y-auto no-scrollbar flex-grow');
        layout.add(this.gridContainer, { grow: 1 });

        // Using GridLayout for the content
        this.grid = new GridLayout(this.gridContainer.element, {
            columns: 'repeat(3, 1fr) 0.8fr repeat(3, 1fr)',
            rows: 'repeat(5, minmax(0, 1fr))',
            gap: 4
        });

        // Event delegation on container
        this.gridContainer.element.addEventListener('click', (e) => {
            const target = e.target.closest('.party-menu-slot');
            if (target) {
                this.onPartySlotClick(target);
            }
        });
    }

    toggle() {
        if (this.root.classList.contains('hidden')) {
            this.refresh();
            this.show();
        } else {
            this.hide();
        }
    }

    onPartySlotClick(element) {
        if (element.dataset.locked === 'true') {
            const selected = this.root.querySelector('.party-menu-slot.selected');
            if (selected) selected.classList.remove('selected');
            return;
        }
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
            const activePartySize = window.$gameParty.activeCreatureCount();
            if (fromIsReserved && !toIsReserved && !toUnit && activePartySize >= window.$gameParty.maxCreatureSlots()) {
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
        if (!this.grid) return;
        this.grid.clear();

        const columns = 7;
        const rows = 5;
        const activeSlots = window.$gameParty.activeSlots;
        const activeSet = new Set(activeSlots.filter(Boolean).map(u => u.uid));
        const reserveUnits = window.$gameParty.roster.filter(u => !activeSet.has(u.uid));
        let reserveUnitIndex = 0;

        const formationPositions = [];
        for (let i = 0; i < 6; i++) {
            formationPositions.push({
                index: i,
                col: (i % 3) + 1,
                row: Math.floor(i / 3) + 1
            });
        }

        const summonerIndex = window.$gameParty.summonerSlotIndex();
        formationPositions.push({
            index: summonerIndex,
            col: 4,
            row: 1,
            rowSpan: 2,
            className: 'summoner-slot'
        });

        const usedCells = new Set();
        formationPositions.forEach(pos => {
            const rowsCovered = pos.rowSpan ? pos.rowSpan : 1;
            for (let r = 0; r < rowsCovered; r++) {
                usedCells.add(`${pos.col}-${pos.row + r}`);
            }
        });

        const reservePositions = [];
        for (let row = 1; row <= rows; row++) {
            for (let col = 1; col <= columns; col++) {
                if (usedCells.has(`${col}-${row}`)) continue;
                reservePositions.push({ col, row });
            }
        }

        const addSlot = ({ unit, index, isReserved, position, isEmptyActiveSlot, extraClass }) => {
            const div = document.createElement('div');
            let baseClasses = 'party-menu-slot relative flex flex-col p-1';
            if (!isReserved) {
                baseClasses += ' bg-gray-800/50';
            }
            if (extraClass) {
                baseClasses += ` ${extraClass}`;
            }
            div.className = baseClasses;

            const emptyId = `empty_${index}_${position.col}_${position.row}`;
            div.dataset.uid = unit ? unit.uid : emptyId;
            div.dataset.index = index;
            div.dataset.isReserved = isReserved;
            div.dataset.locked = unit?.isSummoner ? 'true' : 'false';

            if (unit) {
                div.innerHTML = renderCreaturePanel(unit);
            } else if (isEmptyActiveSlot) {
                div.innerHTML = '<span class="m-auto text-gray-600 text-[10px]">EMPTY</span>';
            } else {
                div.style.visibility = 'hidden';
            }

            const rowValue = position.rowSpan ? `${position.row} / span ${position.rowSpan}` : position.row;
            this.grid.add(div, { col: position.col, row: rowValue });
        };

        formationPositions.forEach(pos => {
            const unit = activeSlots[pos.index];
            const isEmptyActiveSlot = !unit;
            addSlot({
                unit,
                index: pos.index,
                isReserved: false,
                position: pos,
                isEmptyActiveSlot,
                extraClass: pos.className
            });
        });

        reservePositions.forEach(pos => {
            const unit = reserveUnitIndex < reserveUnits.length ? reserveUnits[reserveUnitIndex++] : null;
            addSlot({
                unit,
                index: -1,
                isReserved: true,
                position: pos,
                isEmptyActiveSlot: !unit,
                extraClass: null
            });
        });
    }
}
