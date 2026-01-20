import { ReactiveComponent } from './ReactiveComponent.js';
import { HPGauge, MPGauge } from './gauges.js';
import { resolveAssetPath } from '../core.js';

export class PartySlotComponent extends ReactiveComponent {
    constructor(unit, index, onClick) {
        // Base styling for slot
        super('div', 'party-slot relative flex flex-col p-1 cursor-pointer hover:bg-white/10');
        this.unit = unit;
        this.index = index;

        // Track whether this is a summoner slot (for border styling)
        if (unit?.isSummoner) {
            this.addClass('summoner-slot');
            this.addClass('border-indigo-400');
        }

        // Render content
        if (unit) {
            this.renderUnit(unit);
        } else {
            this.setHtml('<span class="m-auto text-gray-800 text-xs">EMPTY</span>');
        }

        // Click handling
        if (onClick) {
            this.on('click', () => onClick(index));
        }
    }

    renderUnit(unit) {
        this.element.innerHTML = '';

        // Name and Level
        const name = typeof unit.name === 'function' ? unit.name() : unit.name;
        const level = unit.level || 1;

        const header = document.createElement('div');
        header.className = 'flex justify-between text-gray-300';
        header.innerHTML = `<span>${name}</span> <span class="text-[10px]">Lv${level}</span>`;
        this.element.appendChild(header);

        // Sprite (Background)
        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none';

        const spriteAsset = typeof unit?.spriteAsset === 'function' ? unit.spriteAsset() : unit?.spriteAsset;
        const sprite = typeof unit?.sprite === 'function' ? unit.sprite() : unit?.sprite;

        const url = resolveAssetPath(spriteAsset);
        if (url) {
            spriteDiv.innerHTML = `<img src="${url}" alt="${name || 'creature'}" class="sprite-img h-16 w-16 object-contain">`;
        } else {
            spriteDiv.innerHTML = `<span class="text-2xl h-16 w-16 flex items-center justify-center">${sprite || ''}</span>`;
        }
        this.element.appendChild(spriteDiv);

        // Gauges Container
        const gaugesDiv = document.createElement('div');
        gaugesDiv.className = 'mt-auto w-full space-y-0.5';
        this.element.appendChild(gaugesDiv);

        // HP Gauge (Reactive)
        const hpGauge = new HPGauge(unit, true);
        gaugesDiv.appendChild(hpGauge.element);
        // We need to keep track of child components to destroy them properly
        this._childComponents = this._childComponents || [];
        this._childComponents.push(hpGauge);

        // MP Gauge (Reactive) - Only if MP > 0
        const maxMp = typeof unit.mmp === 'number' ? unit.mmp : (typeof unit.mmp === 'function' ? unit.mmp() : 0);
        if (maxMp > 0) {
            const mpGauge = new MPGauge(unit, true);
            gaugesDiv.appendChild(mpGauge.element);
            this._childComponents.push(mpGauge);
        }

        // XP Gauge (Static for now, or we can make it reactive later)
        const xpGauge = this.createXpGauge(unit);
        gaugesDiv.appendChild(xpGauge);
    }

    createXpGauge(unit) {
        const xpDiv = document.createElement('div');
        xpDiv.className = 'w-full h-1 bg-gray-800';

        const level = unit.level || 1;
        const getXpForNextLevel = (lvl) => Math.round(100 * Math.pow(lvl, 1.1));
        const currentLvlXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
        const nextLvlXp = getXpForNextLevel(level);
        const xpInCurrentLvl = (unit.exp || 0) - currentLvlXp;
        const xpForThisLvl = nextLvlXp - currentLvlXp;
        const xpPct = (xpInCurrentLvl / xpForThisLvl) * 100;

        const bar = document.createElement('div');
        bar.className = 'bg-blue-500 h-full';
        bar.style.width = `${Math.min(100, Math.max(0, xpPct))}%`;

        xpDiv.appendChild(bar);
        return xpDiv;
    }

    setSelected(selected) {
        if (selected) {
            this.addClass('selected');
            // Assuming 'selected' class does the styling, otherwise:
            this.addClass('border-yellow-500');
            this.addClass('border');
        } else {
            this.removeClass('selected');
            this.removeClass('border-yellow-500');
            this.removeClass('border');
        }
    }

    destroy() {
        if (this._childComponents) {
            this._childComponents.forEach(c => c.destroy());
        }
        super.destroy();
    }
}
