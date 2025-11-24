import { Data } from '../data.js';
import { GameState } from '../state.js';
import { WindowBase, WindowSelectable } from './base.js';

const formatGauge = (value, max, css) => {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return `<div class="sn-gauge ${css}"><div class="sn-gauge__fill" style="width:${pct}%"></div></div>`;
};

export class WindowFloorInfo extends WindowBase {
  constructor() {
    super({ title: 'FLOOR', className: 'sn-window--small' });
  }

  refresh() {
    this.content.innerHTML = `<div class="sn-pair"><span>Floor</span><span>${GameState.run.floor}</span></div>
      <div class="sn-pair"><span>Gold</span><span>${GameState.run.gold}</span></div>`;
  }
}

export class WindowLog extends WindowBase {
  constructor() {
    super({ title: 'LOG' });
    this.content.classList.add('sn-log', 'no-scrollbar');
  }

  setEntries(entries) {
    this.entries = entries;
    this.refresh();
  }

  refresh() {
    this.content.innerHTML = '';
    (this.entries || []).forEach(entry => {
      const row = document.createElement('div');
      row.className = `sn-log__entry ${entry.color || ''}`.trim();
      row.textContent = `> ${entry.text}`;
      this.content.appendChild(row);
    });
    this.content.scrollTop = this.content.scrollHeight;
  }
}

export class WindowPartyStatus extends WindowBase {
  constructor({ onSelect }) {
    super({ title: 'PARTY STATUS' });
    this.onSelect = onSelect;
    this.partyLayer = document.createElement('div');
    this.partyLayer.className = 'sn-party-grid sn-scroll no-scrollbar';
    this.content.appendChild(this.partyLayer);
  }

  refresh() {
    this.partyLayer.innerHTML = '';
    GameState.party.activeSlots.forEach((unit, idx) => {
      const card = document.createElement('div');
      card.className = 'sn-party-card';
      if (!unit) {
        card.innerHTML = `<div class="sn-window__label">EMPTY</div>`;
      } else {
        const maxhp = unit.maxhp || 1;
        card.innerHTML = `<div class="sn-sprite-frame" style="height:48px;width:48px;">${spriteMarkup(unit)}</div>
          <div class="sn-ui__grid" style="grid-template-rows: repeat(3, auto);">
            <div class="sn-pair"><span>${unit.name}</span><span class="sn-tag">Lv${unit.level}</span></div>
            ${formatGauge(unit.hp, maxhp, 'sn-gauge--hp')}
            <div class="sn-pair sn-keyhint">Slot ${idx + 1}</div>
          </div>`;
      }
      card.onclick = () => this.onSelect && this.onSelect(unit, idx);
      this.partyLayer.appendChild(card);
    });
  }
}

export class WindowPartyManage extends WindowBase {
  constructor({ onClose, onSet, onRemove }) {
    super({ title: 'PARTY / RESERVE', className: 'sn-window--large' });
    this.onClose = onClose;
    this.onSet = onSet;
    this.onRemove = onRemove;
    this.root.style.height = '420px';
    this.content.innerHTML = `<div class="sn-two-column" style="height:100%">
      <div class="sn-scroll no-scrollbar" id="sn-reserve"></div>
      <div class="sn-scroll no-scrollbar" id="sn-active"></div>
    </div>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sn-button sn-ui__interactive';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => this.onClose && this.onClose();
    this.root.appendChild(closeBtn);
  }

  refresh() {
    const reserveEl = this.content.querySelector('#sn-reserve');
    const activeEl = this.content.querySelector('#sn-active');
    reserveEl.innerHTML = '';
    activeEl.innerHTML = '';
    const activeSet = new Set(GameState.party.activeSlots.filter(Boolean).map(u => u.uid));
    const reserve = GameState.roster.filter(u => !activeSet.has(u.uid));
    reserve.forEach(u => {
      const row = document.createElement('div');
      row.className = 'sn-list__item';
      row.innerHTML = `<div class="sn-ui__grid" style="grid-template-columns:40px 1fr;align-items:center;gap:8px;">
        <div class="sn-sprite-frame" style="width:40px;height:40px;">${spriteMarkup(u)}</div>
        <div>
          <div>${u.name}</div>
          <div class="sn-window__label">Lv${u.level}</div>
        </div>
      </div>`;
      const btn = document.createElement('button');
      btn.className = 'sn-button sn-ui__interactive';
      btn.textContent = 'Set';
      btn.onclick = () => this.onSet && this.onSet(u);
      row.appendChild(btn);
      reserveEl.appendChild(row);
    });
    GameState.party.activeSlots.forEach((u, idx) => {
      const row = document.createElement('div');
      row.className = 'sn-list__item';
      if (u) {
        row.innerHTML = `<div class="sn-ui__grid" style="grid-template-columns:40px 1fr;align-items:center;gap:8px;">
          <div class="sn-sprite-frame" style="width:40px;height:40px;">${spriteMarkup(u)}</div>
          <div><div>${u.name}</div><div class="sn-window__label">Lv${u.level}</div></div>
        </div>`;
        const btn = document.createElement('button');
        btn.className = 'sn-button sn-ui__interactive';
        btn.textContent = 'Remove';
        btn.onclick = () => this.onRemove && this.onRemove(idx);
        row.appendChild(btn);
      } else {
        row.innerHTML = '<div class="sn-window__label">(Empty Slot)</div>';
      }
      activeEl.appendChild(row);
    });
  }
}

export class WindowInventory extends WindowBase {
  constructor({ onEquip, onClose }) {
    super({ title: 'INVENTORY', className: 'sn-window--large' });
    this.onEquip = onEquip;
    this.onClose = onClose;
    this.root.style.height = '380px';
    this.list = document.createElement('div');
    this.list.className = 'sn-scroll no-scrollbar';
    this.content.appendChild(this.list);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sn-button sn-ui__interactive';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => this.onClose && this.onClose();
    this.root.appendChild(closeBtn);
  }

  refresh() {
    this.list.innerHTML = '';
    const eqKeys = Object.keys(GameState.inventory.equipment);
    if (eqKeys.length > 0) {
      const header = document.createElement('div');
      header.className = 'sn-tag';
      header.textContent = 'Equipment';
      this.list.appendChild(header);
      eqKeys.forEach(id => {
        const def = Data.equipment[id];
        const row = document.createElement('div');
        row.className = 'sn-list__item';
        row.innerHTML = `<div><div>${def.name}</div><div class="sn-window__label">${def.description}</div></div><div class="sn-tag">x${GameState.inventory.equipment[id]}</div>`;
        const btn = document.createElement('button');
        btn.className = 'sn-button sn-ui__interactive';
        btn.textContent = 'Equip';
        btn.onclick = () => this.onEquip && this.onEquip(id);
        row.appendChild(btn);
        this.list.appendChild(row);
      });
    }
    const itemKeys = Object.keys(GameState.inventory.items);
    if (itemKeys.length > 0) {
      const header = document.createElement('div');
      header.className = 'sn-tag';
      header.textContent = 'Items';
      this.list.appendChild(header);
      itemKeys.forEach(id => {
        const def = Data.items[id];
        const row = document.createElement('div');
        row.className = 'sn-list__item';
        row.innerHTML = `<div><div>${def.name}</div><div class="sn-window__label">${def.description}</div></div><div class="sn-tag">x${GameState.inventory.items[id]}</div>`;
        this.list.appendChild(row);
      });
    }
  }
}

export class WindowCreatureStatus extends WindowBase {
  constructor({ onClose, onPickEquipment }) {
    super({ title: 'CREATURE STATUS', className: 'sn-window--large' });
    this.onClose = onClose;
    this.onPickEquipment = onPickEquipment;
    this.root.style.height = '480px';
  }

  setUnit(unit) { this.unit = unit; this.refresh(); }

  renderActions(unit) {
    const actions = unit.acts || [];
    return `<div class="sn-ui__grid" style="grid-template-columns: repeat(2, 1fr); gap:8px;">${actions.map(a => `<div class="sn-window__section"><div>${a.name}</div><div class="sn-window__label">${a.description || ''}</div></div>`).join('')}</div>`;
  }

  refresh() {
    if (!this.unit) { this.content.innerHTML = '<div class="sn-window__label">No creature selected.</div>'; return; }
    const unit = this.unit;
    const equipDef = unit.equipmentId ? Data.equipment[unit.equipmentId] : null;
    this.content.innerHTML = `<div class="sn-modal__body">
      <div style="width:40%; display:flex; flex-direction:column; gap:12px; border-right:1px solid #222; padding-right:12px;">
        <div class="sn-sprite-frame" style="height:200px;">${spriteMarkup(unit)}</div>
        <div>
          <div class="sn-pair"><span>${unit.name}</span><span class="sn-tag">Lv${unit.level}</span></div>
          <div class="sn-window__label">${Data.creatures[unit.speciesId]?.temperament || ''}</div>
        </div>
      </div>
      <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
        <div class="sn-ui__grid" style="grid-template-columns: repeat(3,1fr); gap:8px;">
          <div class="sn-window__section"><div class="sn-window__label">HP</div><div>${unit.hp}/${unit.maxhp}</div>${formatGauge(unit.hp, unit.maxhp, 'sn-gauge--hp')}</div>
          <div class="sn-window__section"><div class="sn-window__label">XP</div><div>${unit.exp}</div>${formatGauge(unit.exp, 100, 'sn-gauge--xp')}</div>
          <div class="sn-window__section"><div class="sn-window__label">Equipment</div><button class="sn-button sn-ui__interactive" id="sn-equip-slot">${equipDef ? equipDef.name : 'Empty'}</button></div>
        </div>
        <div class="sn-ui__grid" style="grid-template-columns: repeat(3,1fr); gap:8px;">
          <div class="sn-window__section"><div class="sn-window__label">Race</div><div>${Data.creatures[unit.speciesId]?.name || unit.speciesId}</div></div>
          <div class="sn-window__section"><div class="sn-window__label">Elements</div><div>${(unit.elements || []).join(', ') || '-'}</div></div>
          <div class="sn-window__section"><div class="sn-window__label">Passive</div><div class="sn-window__label">coming soon</div></div>
        </div>
        <div class="sn-window__section">
          <div class="sn-window__label">Actions</div>
          ${this.renderActions(unit)}
        </div>
      </div>
    </div>`;
    const slotBtn = this.content.querySelector('#sn-equip-slot');
    if (slotBtn) slotBtn.onclick = () => this.onPickEquipment && this.onPickEquipment(unit);
  }
}

export class WindowEvent extends WindowBase {
  constructor({ onClose }) {
    super({ title: 'EVENT', className: 'sn-window--medium' });
    this.onClose = onClose;
    this.root.style.maxHeight = '420px';
    const btn = document.createElement('button');
    btn.className = 'sn-button sn-ui__interactive';
    btn.textContent = 'Close';
    btn.onclick = () => this.onClose && this.onClose();
    this.root.appendChild(btn);
  }

  setContent(title, content) {
    this.header.textContent = title;
    this.content.innerHTML = '';
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.content.appendChild(content);
    }
  }
}

export function spriteMarkup(unit) {
  if (!unit) return '<div class="sn-window__label">(empty)</div>';
  const src = unit.spriteAsset ? unit.spriteAsset : (unit.sprite || '');
  const normalized = src ? src.replace(/^\.\//, '').replace(/^\//, '') : '';
  const path = normalized.startsWith('src/') ? normalized : `src/${normalized}`;
  return `<img src="${path}" alt="${unit.name}" />`;
}

export class WindowControls extends WindowBase {
  constructor({ onParty, onFormation, onInventory, onStop }) {
    super({ title: 'CONTROLS', className: 'sn-window--medium' });
    this.handlers = { onParty, onFormation, onInventory, onStop };
    this.content.classList.add('sn-ui__grid');
  }

  refresh() {
    this.content.innerHTML = '';
    const mkBtn = (label, handler) => {
      const btn = document.createElement('button');
      btn.className = 'sn-button sn-ui__interactive';
      btn.textContent = label;
      btn.onclick = handler;
      return btn;
    };
    this.content.appendChild(mkBtn('PARTY (P)', this.handlers.onParty));
    this.content.appendChild(mkBtn('FORMATION', this.handlers.onFormation));
    this.content.appendChild(mkBtn('BAG (B)', this.handlers.onInventory));
    if (this.handlers.onStop) {
      this.content.appendChild(mkBtn('STOP ROUND (SPACE)', this.handlers.onStop));
    }
  }
}
