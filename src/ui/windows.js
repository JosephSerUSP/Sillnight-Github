import { WindowBase } from './base.js';

export const createGauge = (value, max) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const gauge = document.createElement('div');
    gauge.className = 'sn-gauge';
    const fill = document.createElement('div');
    fill.className = 'sn-gauge__fill';
    if (pct < 30) fill.classList.add('sn-gauge__fill--danger');
    fill.style.width = `${pct}%`;
    gauge.appendChild(fill);
    return gauge;
};

export const createSpriteEl = (unit, resolveAssetPath, sizeClass = '48px', extraClass = '') => {
    const wrapper = document.createElement('div');
    wrapper.className = `sn-sprite ${extraClass}`;
    wrapper.style.width = sizeClass;
    wrapper.style.height = sizeClass;
    const url = resolveAssetPath(unit?.spriteAsset);
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = unit?.name || 'creature';
        wrapper.appendChild(img);
    } else {
        const span = document.createElement('span');
        span.textContent = unit?.sprite || '?';
        wrapper.appendChild(span);
    }
    return wrapper;
};

class ModalWrapper {
    constructor(card) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'sn-modal-overlay';
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.wrapper.style.pointerEvents = 'auto';
        this.wrapper.appendChild(this.backdrop);
        this.card = card;
        this.card.classList.add('sn-modal-card');
        this.wrapper.appendChild(this.card);
    }

    mount(parent) {
        if (parent && !this.wrapper.parentElement) parent.appendChild(this.wrapper);
    }

    unmount() {
        if (this.wrapper.parentElement) this.wrapper.parentElement.removeChild(this.wrapper);
    }
}

export class WindowHUD extends WindowBase {
    constructor() {
        super('HUD', { size: 'small' });
        this.floor = 1;
        this.gold = 0;
    }

    setData(floor, gold) {
        this.floor = floor;
        this.gold = gold;
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'sn-flex-space';
        row.innerHTML = `<span class="sn-text-highlight">FLOOR</span> <span>${this.floor}</span> <span class="sn-text-highlight">G</span> <span>${this.gold}</span>`;
        this.content.appendChild(row);
    }
}

export class WindowBattleBanner {
    constructor() {
        this.root = document.createElement('div');
        this.root.className = 'sn-banner is-hidden';
        this.timeout = null;
    }

    open(parent) {
        if (parent && !this.root.parentElement) parent.appendChild(this.root);
    }

    show(text) {
        this.root.textContent = text;
        this.root.classList.remove('is-hidden');
        this.root.classList.add('is-visible');
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.hide(), 2500);
    }

    hide() {
        this.root.classList.add('is-hidden');
        this.root.classList.remove('is-visible');
    }
}

export class WindowLog extends WindowBase {
    constructor() {
        super('LOG', { size: 'medium' });
        this.entries = [];
    }

    addEntry(text, color = '#cbd5e1') {
        this.entries.push({ text, color });
        if (this.entries.length > 120) this.entries.shift();
        this.refresh();
        this.content.scrollTop = this.content.scrollHeight;
    }

    refresh() {
        this.content.innerHTML = '';
        const list = document.createElement('div');
        list.className = 'sn-log sn-no-scrollbar';
        this.entries.forEach(entry => {
            const line = document.createElement('div');
            line.className = 'sn-log__line';
            line.style.color = entry.color;
            line.textContent = `> ${entry.text}`;
            list.appendChild(line);
        });
        this.content.appendChild(list);
    }
}

export class WindowControls extends WindowBase {
    constructor() {
        super('CONTROLS', { size: 'medium' });
        this.handlers = {};
        this.mode = 'EXPLORE';
        this.formation = false;
        this.turnActive = false;
    }

    setHandler(symbol, fn) {
        this.handlers[symbol] = fn;
    }

    setMode(mode, formation) {
        this.mode = mode;
        this.formation = !!formation;
        this.refresh();
    }

    setTurnState(active) {
        this.turnActive = active;
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'sn-controls';
        if (this.mode === 'BATTLE') {
            const btnTurn = document.createElement('button');
            btnTurn.className = 'sn-button sn-button--primary';
            btnTurn.textContent = this.turnActive ? 'RESUME (SPACE)' : 'STOP ROUND (SPACE)';
            btnTurn.onclick = () => this.handlers.turn && this.handlers.turn(this.turnActive);
            row.append(btnTurn);
        } else {
            const btnParty = document.createElement('button');
            btnParty.className = 'sn-button';
            btnParty.textContent = 'PARTY (P)';
            btnParty.onclick = () => this.handlers.party && this.handlers.party();

            const btnFormation = document.createElement('button');
            btnFormation.className = 'sn-button';
            btnFormation.textContent = this.formation ? 'FORMATION ON' : 'FORMATION';
            btnFormation.onclick = () => this.handlers.formation && this.handlers.formation();

            const btnInventory = document.createElement('button');
            btnInventory.className = 'sn-button';
            btnInventory.textContent = 'BAG (B)';
            btnInventory.onclick = () => this.handlers.inventory && this.handlers.inventory();

            row.append(btnParty, btnFormation, btnInventory);
        }

        const modeRow = document.createElement('div');
        modeRow.className = 'sn-flex-space sn-hint';
        modeRow.innerHTML = `<span>MODE: ${this.mode}</span><span>${this.formation ? 'FORMATION MODE' : ''}</span>`;

        this.content.appendChild(row);
        this.content.appendChild(modeRow);
    }
}

export class WindowPartyStatus extends WindowBase {
    constructor(resolveAssetPath) {
        super('PARTY STATUS', { size: 'large' });
        this.resolveAssetPath = resolveAssetPath;
        this.slots = [];
        this.selectedIndex = null;
        this.onSlot = null;
    }

    setParty(slots) {
        this.slots = slots;
        this.refresh();
    }

    setSelection(idx) {
        this.selectedIndex = idx;
        const slots = this.content.querySelectorAll('.sn-slot');
        slots.forEach((el, i) => {
            if (i === idx) el.classList.add('is-selected');
            else el.classList.remove('is-selected');
        });
    }

    refresh() {
        this.content.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'sn-grid sn-grid--party';
        this.slots.forEach((u, idx) => {
            const slot = document.createElement('div');
            slot.className = 'sn-slot';
            if (idx === this.selectedIndex) slot.classList.add('is-selected');
            if (u) {
                const maxhp = u.maxhp || u.hp || 1;
                const title = document.createElement('div');
                title.className = 'sn-slot__title';
                title.innerHTML = `<span>${u.name}</span><span>Lv${u.level}</span>`;
                const sprite = document.createElement('div');
                sprite.className = 'sn-slot__sprite';
                const spr = createSpriteEl(u, this.resolveAssetPath, '64px');
                sprite.appendChild(spr);
                const gauge = createGauge(u.hp, maxhp);
                const footer = document.createElement('div');
                footer.className = 'sn-slot__footer';
                footer.textContent = `${u.hp}/${maxhp}`;
                slot.append(title, sprite, gauge, footer);
            } else {
                const empty = document.createElement('div');
                empty.style.margin = 'auto';
                empty.className = 'sn-text-dim';
                empty.textContent = 'EMPTY';
                slot.appendChild(empty);
            }
            slot.onclick = () => this.onSlot && this.onSlot(idx, u);
            grid.appendChild(slot);
        });
        this.content.appendChild(grid);
    }
}

class WindowModalBase extends WindowBase {
    constructor(title, options = {}) {
        super(title, options);
        this.modalWrapper = new ModalWrapper(this.root);
    }

    open(parent) {
        this.modalWrapper.mount(parent);
        super.open();
    }

    close() {
        super.close();
        this.modalWrapper.unmount();
    }
}

export class WindowInventory extends WindowModalBase {
    constructor() {
        super('INVENTORY', { size: 'large' });
        this.data = null;
        this.state = null;
        this.onEquip = null;
    }

    bind(data, state) {
        this.data = data;
        this.state = state;
    }

    refresh() {
        this.content.innerHTML = '';
        const list = document.createElement('div');
        list.className = 'sn-column sn-no-scrollbar';
        if (!this.state || !this.data) return;
        const equipmentKeys = Object.keys(this.state.inventory.equipment || {});
        const itemKeys = Object.keys(this.state.inventory.items || {});

        if (equipmentKeys.length > 0) {
            const title = document.createElement('div');
            title.className = 'sn-title';
            title.textContent = 'Equipment';
            list.appendChild(title);
            equipmentKeys.forEach(id => {
                const count = this.state.inventory.equipment[id];
                const def = this.data.equipment[id];
                const row = document.createElement('div');
                row.className = 'sn-list__item';
                row.innerHTML = `<div><div>${def.name}</div><div class="sn-hint">${def.description}</div></div><span class="sn-text-dim">x${count}</span>`;
                const btn = document.createElement('button');
                btn.className = 'sn-button sn-button--primary';
                btn.textContent = 'EQUIP';
                btn.onclick = () => this.onEquip && this.onEquip(id);
                row.appendChild(btn);
                list.appendChild(row);
            });
        }

        if (itemKeys.length > 0) {
            const title = document.createElement('div');
            title.className = 'sn-title';
            title.textContent = 'Items';
            list.appendChild(title);
            itemKeys.forEach(id => {
                const count = this.state.inventory.items[id];
                const def = this.data.items[id];
                const row = document.createElement('div');
                row.className = 'sn-list__item';
                row.innerHTML = `<div><div>${def.name}</div><div class="sn-hint">${def.description}</div></div><span class="sn-text-dim">x${count}</span>`;
                list.appendChild(row);
            });
        }

        if (equipmentKeys.length === 0 && itemKeys.length === 0) {
            const none = document.createElement('div');
            none.className = 'sn-text-dim';
            none.textContent = 'No items.';
            list.appendChild(none);
        }

        this.content.appendChild(list);
    }
}

export class WindowPartyManage extends WindowModalBase {
    constructor(resolveAssetPath) {
        super('PARTY / RESERVE', { size: 'large' });
        this.resolveAssetPath = resolveAssetPath;
        this.state = null;
        this.onSet = null;
        this.onRemove = null;
    }

    bind(state) {
        this.state = state;
    }

    refresh() {
        this.content.innerHTML = '';
        if (!this.state) return;
        const layout = document.createElement('div');
        layout.className = 'sn-row';

        const reserve = document.createElement('div');
        reserve.className = 'sn-column sn-no-scrollbar';
        reserve.style.flex = '1';
        const active = document.createElement('div');
        active.className = 'sn-column sn-no-scrollbar';
        active.style.flex = '1';

        const activeSet = new Set(this.state.party.activeSlots.filter(Boolean).map(u => u.uid));
        const reserveList = this.state.roster.filter(u => !activeSet.has(u.uid));

        reserveList.forEach(u => {
            const row = document.createElement('div');
            row.className = 'sn-list__item';
            const info = document.createElement('div');
            info.className = 'sn-row';
            info.appendChild(createSpriteEl(u, this.resolveAssetPath, '32px'));
            const text = document.createElement('div');
            text.innerHTML = `<div>${u.name}</div><div class="sn-hint">Lv${u.level}</div>`;
            info.appendChild(text);
            row.appendChild(info);
            const btn = document.createElement('button');
            btn.className = 'sn-button sn-button--primary';
            btn.textContent = 'SET';
            btn.onclick = () => this.onSet && this.onSet(u);
            row.appendChild(btn);
            reserve.appendChild(row);
        });

        this.state.party.activeSlots.forEach((u, idx) => {
            const row = document.createElement('div');
            row.className = 'sn-list__item';
            if (u) {
                const info = document.createElement('div');
                info.className = 'sn-row';
                info.appendChild(createSpriteEl(u, this.resolveAssetPath, '32px'));
                const text = document.createElement('div');
                text.innerHTML = `<div>${u.name}</div><div class="sn-hint">Lv${u.level}</div>`;
                info.appendChild(text);
                row.appendChild(info);
                const btn = document.createElement('button');
                btn.className = 'sn-button';
                btn.textContent = 'REMOVE';
                btn.onclick = () => this.onRemove && this.onRemove(idx);
                row.appendChild(btn);
            } else {
                const empty = document.createElement('div');
                empty.className = 'sn-text-dim';
                empty.textContent = '(EMPTY)';
                row.appendChild(empty);
            }
            active.appendChild(row);
        });

        layout.append(reserve, active);
        this.content.appendChild(layout);
    }
}

export class WindowCreatureStatus extends WindowModalBase {
    constructor(resolveAssetPath) {
        super('CREATURE STATUS', { size: 'large' });
        this.resolveAssetPath = resolveAssetPath;
        this.unit = null;
        this.data = null;
        this.state = null;
        this.onOpenEquip = null;
        this.onUnequip = null;
        this.onPickEquip = null;
    }

    bind(data, state) {
        this.data = data;
        this.state = state;
    }

    setUnit(unit) {
        this.unit = unit;
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = '';
        if (!this.unit || !this.data) return;
        const def = this.data.creatures[this.unit.speciesId];
        const wrapper = document.createElement('div');
        wrapper.className = 'sn-row';

        const left = document.createElement('div');
        left.className = 'sn-column';
        left.style.width = '40%';
        const spriteFrame = document.createElement('div');
        spriteFrame.className = 'sn-sprite-frame';
        spriteFrame.style.aspectRatio = '1 / 1';
        spriteFrame.appendChild(createSpriteEl(this.unit, this.resolveAssetPath, '120px'));
        left.appendChild(spriteFrame);
        const name = document.createElement('div');
        name.className = 'sn-title';
        name.textContent = this.unit.name;
        left.appendChild(name);
        const level = document.createElement('div');
        level.className = 'sn-text-dim';
        level.textContent = `Lv ${this.unit.level}`;
        left.appendChild(level);

        const right = document.createElement('div');
        right.className = 'sn-column';
        right.style.flex = '1';

        const statsRow = document.createElement('div');
        statsRow.className = 'sn-row';
        const hpCard = document.createElement('div');
        hpCard.className = 'sn-window sn-window--small';
        const hpHeader = document.createElement('div');
        hpHeader.className = 'sn-window__header';
        hpHeader.textContent = 'HP';
        const hpContent = document.createElement('div');
        hpContent.className = 'sn-window__content';
        const maxhp = this.unit.maxhp || this.unit.hp || 1;
        hpContent.textContent = `${this.unit.hp}/${maxhp}`;
        hpCard.append(hpHeader, hpContent);

        const xpCard = document.createElement('div');
        xpCard.className = 'sn-window sn-window--small';
        const xpHeader = document.createElement('div');
        xpHeader.className = 'sn-window__header';
        xpHeader.textContent = 'XP';
        const xpContent = document.createElement('div');
        xpContent.className = 'sn-window__content';
        xpContent.textContent = `${this.unit.exp}`;
        xpCard.append(xpHeader, xpContent);

        const equipCard = document.createElement('div');
        equipCard.className = 'sn-window sn-window--small';
        const eqHeader = document.createElement('div');
        eqHeader.className = 'sn-window__header';
        eqHeader.textContent = 'EQUIPMENT';
        const eqContent = document.createElement('div');
        eqContent.className = 'sn-window__content';
        const btn = document.createElement('button');
        btn.className = 'sn-button sn-button--primary';
        const equipDef = this.unit.equipmentId ? this.data.equipment[this.unit.equipmentId] : null;
        btn.textContent = equipDef ? equipDef.name : 'Empty slot';
        btn.onclick = () => this.onOpenEquip && this.onOpenEquip(this.unit);
        eqContent.appendChild(btn);
        equipCard.append(eqHeader, eqContent);

        statsRow.append(hpCard, xpCard, equipCard);

        const lore = document.createElement('div');
        lore.className = 'sn-window';
        const loreHeader = document.createElement('div');
        loreHeader.className = 'sn-window__header';
        loreHeader.textContent = 'LORE';
        const loreContent = document.createElement('div');
        loreContent.className = 'sn-window__content';
        loreContent.textContent = def.description;
        lore.append(loreHeader, loreContent);

        const actionsHeader = document.createElement('div');
        actionsHeader.className = 'sn-flex-space sn-text-dim';
        actionsHeader.innerHTML = `<span>ACTIONS</span><span class="sn-hint">Known skills</span>`;
        const actionsGrid = document.createElement('div');
        actionsGrid.className = 'sn-grid';
        const acts = [...this.unit.acts[0], ...(this.unit.acts[1] || [])];
        acts.forEach(a => {
            const skill = this.data.skills[a] || this.data.skills[a?.toLowerCase?.()];
            const card = document.createElement('div');
            card.className = 'sn-list__item';
            card.textContent = skill ? skill.name : a;
            actionsGrid.appendChild(card);
        });

        right.append(statsRow, actionsHeader, actionsGrid, lore);
        wrapper.append(left, right);
        this.content.appendChild(wrapper);
    }
}

export class WindowEvent extends WindowModalBase {
    constructor() {
        super('EVENT', { size: 'large' });
    }

    setContent(title, node) {
        this.setTitle(title);
        this.content.innerHTML = '';
        if (typeof node === 'string') {
            this.content.innerHTML = node;
        } else {
            this.content.appendChild(node);
        }
    }
}

export class WindowCenterModal extends WindowModalBase {
    constructor() {
        super('NOTICE', { size: 'medium' });
    }

    setHtml(html) {
        this.content.innerHTML = html;
    }
}
