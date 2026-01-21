import { Component } from './Component.js';
import { GaugeComponent } from './GaugeComponent.js';
import { spriteMarkup } from '../window/common.js';

export class CreaturePanelComponent extends Component {
    constructor(unit) {
        super('div', 'flex flex-col h-full w-full relative select-none');
        this.unit = unit;
        this.setup();

        // Subscribe to changes
        this.listen('battler:change', this.onBattlerChange.bind(this));
    }

    setup() {
        if (!this.unit) {
             this.setHtml('<span class="m-auto text-gray-800 text-xs">EMPTY</span>');
             return;
        }

        // --- Structure ---
        // Header: Name + Level
        const header = new Component('div', 'flex justify-between text-gray-300');
        this.nameLabel = new Component('span');
        this.nameLabel.setText(this.getName());

        this.levelLabel = new Component('span', 'text-[10px]');
        this.levelLabel.setText(`Lv${this.unit.level || 1}`);

        header.element.appendChild(this.nameLabel.element);
        header.element.appendChild(this.levelLabel.element);
        this.element.appendChild(header.element);

        // Sprite (Background)
        const spriteContainer = new Component('div', 'absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none');
        spriteContainer.setHtml(spriteMarkup(this.unit, 'h-16 w-16 object-contain', '', 'text-2xl'));
        this.element.appendChild(spriteContainer.element);

        // Footer: Gauges
        const footer = new Component('div', 'mt-auto w-full space-y-0.5');
        this.element.appendChild(footer.element);

        // HP Text
        this.hpText = new Component('div', 'text-[10px] text-right text-gray-500');
        this.hpText.setText(`${this.unit.hp}/${this.getMaxHp()}`);
        footer.element.appendChild(this.hpText.element);

        // HP Gauge
        this.hpGauge = new GaugeComponent(this.getHpColor());
        this.hpGauge.setup(this.unit.hp, this.getMaxHp());
        footer.element.appendChild(this.hpGauge.element);

        // MP Gauge
        const maxMp = this.getMaxMp();
        if (maxMp > 0) {
            this.mpText = new Component('div', 'text-[10px] text-right text-gray-500');
            this.mpText.setText(`MP ${this.unit.mp}/${maxMp}`);
            footer.element.appendChild(this.mpText.element);

            this.mpGauge = new GaugeComponent('bg-indigo-500');
            this.mpGauge.setup(this.unit.mp, maxMp);
            footer.element.appendChild(this.mpGauge.element);
        }

        // XP Gauge
        this.xpGauge = new GaugeComponent('bg-blue-500');
        this.updateXpGauge();
        footer.element.appendChild(this.xpGauge.element);
    }

    // Helpers to get data safely (handling class vs object)
    getName() {
        return typeof this.unit.name === 'function' ? this.unit.name() : this.unit.name;
    }

    getMaxHp() {
        if (typeof this.unit.mhp === 'number') return this.unit.mhp;
        if (typeof this.unit.mhp === 'function') return this.unit.mhp();
        return 1;
    }

    getMaxMp() {
        if (typeof this.unit.mmp === 'number') return this.unit.mmp;
        if (typeof this.unit.mmp === 'function') return this.unit.mmp();
        return 0;
    }

    getHpColor() {
        const pct = (this.unit.hp / this.getMaxHp()) * 100;
        return pct < 30 ? 'bg-red-600' : 'bg-green-600';
    }

    updateXpGauge() {
        const level = this.unit.level || 1;
        const getXpForNextLevel = (lvl) => Math.round(100 * Math.pow(lvl, 1.1));
        const currentLvlXp = level > 1 ? getXpForNextLevel(level - 1) : 0;
        const nextLvlXp = getXpForNextLevel(level);
        const xpInCurrentLvl = (this.unit.exp || 0) - currentLvlXp;
        const xpForThisLvl = nextLvlXp - currentLvlXp;

        this.xpGauge.setup(xpInCurrentLvl, xpForThisLvl);
    }

    onBattlerChange(payload) {
        if (payload.unit !== this.unit) return;

        if (payload.property === 'hp') {
            this.hpGauge.setValue(payload.value);
            this.hpGauge.setColor(this.getHpColor());
            this.hpText.setText(`${payload.value}/${this.getMaxHp()}`);
        } else if (payload.property === 'mp') {
            if (this.mpGauge) {
                this.mpGauge.setValue(payload.value);
                this.mpText.setText(`MP ${payload.value}/${this.getMaxMp()}`);
            }
        }
        // Handle TP if needed
    }
}
