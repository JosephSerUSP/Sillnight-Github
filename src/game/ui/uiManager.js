import { GameState } from '../state.js';
import { Data } from '../data.js';
import { Log } from '../log.js';
import {
  WindowFloorInfo,
  WindowLog,
  WindowPartyStatus,
  WindowPartyManage,
  WindowInventory,
  WindowCreatureStatus,
  WindowEvent,
  WindowControls,
} from './windows.js';

export class UIManager {
  constructor(systemHooks) {
    this.systemHooks = systemHooks;
    this.root = document.createElement('div');
    this.root.id = 'ui-layer';
    this.root.className = 'sn-layer sn-ui__layer';
    this.root.innerHTML = '';
    this.root.style.zIndex = '10';
    document.body.appendChild(this.root);

    this.modalLayer = document.createElement('div');
    this.modalLayer.className = 'sn-ui__modal sn-ui__layer sn-ui__interactive';
    this.modalLayer.style.display = 'none';
    this.root.appendChild(this.modalLayer);

    this.banner = document.createElement('div');
    this.banner.className = 'sn-overlay sn-overlay__banner';
    this.banner.style.opacity = 0;
    this.banner.style.display = 'flex';
    this.banner.style.justifyContent = 'center';
    this.banner.style.alignItems = 'flex-start';
    this.banner.style.paddingTop = '16px';
    this.root.appendChild(this.banner);

    this.initExploreLayout();
    this.attachLog();
  }

  initExploreLayout() {
    this.hud = document.createElement('div');
    this.hud.className = 'sn-layout__hud sn-ui__interactive';
    this.footer = document.createElement('div');
    this.footer.className = 'sn-layout__footer sn-ui__interactive';

    this.floorInfo = new WindowFloorInfo();
    this.hud.appendChild(this.floorInfo.root);

    this.logWindow = new WindowLog();
    this.controls = new WindowControls({
      onParty: () => this.toggleParty(),
      onFormation: () => this.toggleFormation(),
      onInventory: () => this.toggleInventory(),
      onStop: () => this.systemHooks.requestPlayerTurn && this.systemHooks.requestPlayerTurn(),
    });
    const leftColumn = document.createElement('div');
    leftColumn.className = 'sn-layout__column';
    leftColumn.appendChild(this.logWindow.root);
    leftColumn.appendChild(this.controls.root);

    this.partyStatus = new WindowPartyStatus({ onSelect: (unit) => this.showCreature(unit) });
    const rightColumn = document.createElement('div');
    rightColumn.className = 'sn-layout__column';
    rightColumn.appendChild(this.partyStatus.root);

    this.footer.appendChild(leftColumn);
    this.footer.appendChild(rightColumn);

    this.root.appendChild(this.hud);
    this.root.appendChild(this.footer);
  }

  attachLog() {
    Log.subscribe((entries) => {
      this.logWindow.setEntries(entries);
    });
  }

  refreshAll() {
    this.floorInfo.refresh();
    this.partyStatus.refresh();
    this.controls.refresh();
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.style.opacity = 1;
    setTimeout(() => { this.banner.style.opacity = 0; }, 900);
  }

  toggleParty() {
    if (this.partyModalOpen) { this.closeModal(); return; }
    this.partyModalOpen = true;
    this.modalLayer.innerHTML = '';
    this.partyManage = new WindowPartyManage({
      onClose: () => this.closeModal(),
      onSet: (unit) => {
        const empty = GameState.party.activeSlots.findIndex(s => s === null);
        if (empty !== -1) {
          GameState.party.activeSlots[empty] = unit;
          unit.slotIndex = empty;
          this.refreshParty();
          this.closeModal();
        }
      },
      onRemove: (idx) => { GameState.party.activeSlots[idx] = null; this.refreshParty(); },
    });
    this.partyManage.open(this.modalLayer);
    this.modalLayer.style.display = 'flex';
  }

  toggleInventory() {
    if (this.inventoryOpen) { this.closeModal(); return; }
    this.inventoryOpen = true;
    this.modalLayer.innerHTML = '';
    this.inventoryWindow = new WindowInventory({
      onClose: () => this.closeModal(),
      onEquip: (id) => this.startEquipFlow(id),
    });
    this.inventoryWindow.open(this.modalLayer);
    this.modalLayer.style.display = 'flex';
  }

  toggleFormation() {
    GameState.ui.formationMode = !GameState.ui.formationMode;
    this.showBanner(GameState.ui.formationMode ? 'FORMATION MODE' : 'EXPLORE');
  }

  showCreature(unit) {
    if (!unit) return;
    this.modalLayer.innerHTML = '';
    this.modalLayer.style.display = 'flex';
    this.statusWindow = new WindowCreatureStatus({
      onClose: () => this.closeModal(),
      onPickEquipment: (u) => this.openEquipmentPicker(u),
    });
    this.statusWindow.setUnit(unit);
    this.statusWindow.open(this.modalLayer);
  }

  showEvent(title, content) {
    this.modalLayer.innerHTML = '';
    this.modalLayer.style.display = 'flex';
    this.eventWindow = new WindowEvent({ onClose: () => this.closeModal() });
    this.eventWindow.setContent(title, content);
    this.eventWindow.open(this.modalLayer);
  }

  closeModal() {
    this.modalLayer.innerHTML = '';
    this.modalLayer.style.display = 'none';
    this.partyModalOpen = false;
    this.inventoryOpen = false;
  }

  refreshParty() {
    this.partyStatus.refresh();
    if (this.partyManage) this.partyManage.refresh();
  }

  startEquipFlow(equipmentId) {
    const count = GameState.inventory.equipment[equipmentId] || 0;
    if (count <= 0) return;
    this.modalLayer.innerHTML = '';
    this.modalLayer.style.display = 'flex';
    const chooser = document.createElement('div');
    chooser.className = 'sn-window sn-window--large sn-ui__interactive';
    chooser.innerHTML = `<div class="sn-window__header">Choose Creature</div>`;
    const body = document.createElement('div');
    body.className = 'sn-window__content sn-ui__grid sn-scroll no-scrollbar';
    body.style.maxHeight = '300px';
    GameState.roster.forEach(u => {
      const card = document.createElement('button');
      card.className = 'sn-list__item sn-ui__interactive';
      card.innerHTML = `<div class="sn-ui__grid" style="grid-template-columns:48px 1fr; gap:8px; align-items:center;">` +
        `<div class="sn-sprite-frame" style="width:48px;height:48px;">${this.spriteMarkup(u)}</div>` +
        `<div><div>${u.name}</div><div class="sn-window__label">Lv${u.level}</div></div>` +
        `</div>`;
      card.onclick = () => { this.equipFromInventory(u, equipmentId); this.closeModal(); };
      body.appendChild(card);
    });
    chooser.appendChild(body);
    const close = document.createElement('button');
    close.className = 'sn-button sn-ui__interactive';
    close.textContent = 'Cancel';
    close.onclick = () => this.closeModal();
    chooser.appendChild(close);
    this.modalLayer.appendChild(chooser);
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
    this.refreshParty();
    if (this.statusWindow) this.statusWindow.setUnit(target);
  }

  recomputeHp(unit) {
    const def = Data.creatures[unit.speciesId];
    if (!def) return;
    unit.maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
    if (unit.hp > unit.maxhp) unit.hp = unit.maxhp;
  }

  openEquipmentPicker(unit) {
    this.modalLayer.innerHTML = '';
    this.modalLayer.style.display = 'flex';
    const options = this.buildEquipmentOptions(unit);
    const chooser = new WindowInventory({
      onClose: () => this.closeModal(),
      onEquip: (id) => { this.equipFromInventory(unit, id); this.closeModal(); },
    });
    chooser.refresh = () => {
      chooser.list.innerHTML = '';
      options.forEach(opt => {
        const def = Data.equipment[opt.id];
        const row = document.createElement('div');
        row.className = 'sn-list__item';
        row.innerHTML = `<div><div>${def.name}</div><div class="sn-window__label">${opt.source}</div></div>`;
        row.onclick = () => { this.equipFromInventory(unit, opt.id); this.closeModal(); };
        chooser.list.appendChild(row);
      });
    };
    chooser.open(this.modalLayer);
  }

  buildEquipmentOptions(unit) {
    const opts = [];
    Object.entries(GameState.inventory.equipment).forEach(([id, count]) => { if (count > 0) opts.push({ id, source: 'inventory', count }); });
    GameState.roster.forEach(u => { if (u.equipmentId && u.uid !== unit.uid) opts.push({ id: u.equipmentId, source: `worn by ${u.name}` }); });
    return opts;
  }

  spriteMarkup(u) {
    const src = u.spriteAsset ? u.spriteAsset : (u.sprite || '');
    const normalized = src ? src.replace(/^\.\//, '').replace(/^\//, '') : '';
    const path = normalized.startsWith('src/') ? normalized : `src/${normalized}`;
    return `<img src="${path}" alt="${u.name}" />`;
  }
}

export const UI = new UIManager({
  requestPlayerTurn: null,
});
