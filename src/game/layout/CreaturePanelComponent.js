import { Component } from './Component.js';
import { spriteMarkup } from '../window/common.js';

export class CreaturePanelComponent extends Component {
    constructor(unit) {
        super('div', 'h-full flex flex-col relative'); // Add basic flex column style
        this.unit = unit;
        this.render(); // Initial render
        this.listen('battler:change', this.onBattlerChange.bind(this));
    }

    render() {
        if (!this.unit) {
            this.setHtml('');
            return;
        }

        const unit = this.unit;
        // Handle class vs raw object (logic copied from renderCreaturePanel)
        const name = typeof unit.name === 'function' ? unit.name() : unit.name;
        const level = unit.level || 1;
        const hp = unit.hp;

        let maxhp = 0;
        if (typeof unit.mhp === 'number') maxhp = unit.mhp;
        else if (typeof unit.mhp === 'function') maxhp = unit.mhp();
        else maxhp = 1;

        const hpPct = Math.max(0, Math.min(100, (hp / maxhp) * 100));
        const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

        // XP Progress
        const getXpForNextLevel = (lvl) => Math.round(100 * Math.pow(lvl, 1.1));
        const currentLvlXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
        const nextLvlXp = getXpForNextLevel(level);
        const xpInCurrentLvl = (unit.exp || 0) - currentLvlXp;
        const xpForThisLvl = nextLvlXp - currentLvlXp;
        const xpPct = Math.max(0, Math.min(100, (xpInCurrentLvl / xpForThisLvl) * 100));

        const maxMp = typeof unit.mmp === 'number' ? unit.mmp : (typeof unit.mmp === 'function' ? unit.mmp() : 0);
        const hasMp = maxMp > 0;
        const mpPct = hasMp ? Math.max(0, Math.min(100, (unit.mp / maxMp) * 100)) : 0;

        const html = `
            <div class="flex justify-between text-gray-300">
                <span class="truncate min-w-0">${name}</span> <span class="text-[10px] ml-1 whitespace-nowrap">Lv${level}</span>
            </div>
            <div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">${spriteMarkup(unit, 'h-16 w-16 object-contain', '', 'text-2xl')}</div>
            <div class="mt-auto w-full space-y-0.5">
                <div class="text-[10px] text-right text-gray-500">${hp}/${maxhp}</div>
                <div class="w-full h-1 bg-gray-800"><div class="${hpColor} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
                ${hasMp ? `<div class="text-[10px] text-right text-gray-500">MP ${unit.mp}/${maxMp}</div>
                <div class="w-full h-1 bg-gray-800"><div class="bg-indigo-500 h-full" style="width:${mpPct}%"></div></div>` : ''}
                <div class="w-full h-1 bg-gray-800"><div class="bg-blue-500 h-full" style="width:${xpPct}%"></div></div>
            </div>
        `;

        this.setHtml(html);
    }

    onBattlerChange(payload) {
        if (payload.unit === this.unit) {
            this.requestUpdate();
        }
    }

    requestUpdate() {
        if (this._updatePending) return;
        this._updatePending = true;
        requestAnimationFrame(() => {
            this._updatePending = false;
            this.render();
        });
    }
}
