import { ReactiveComponent } from './ReactiveComponent.js';

/**
 * A reactive HP Gauge component.
 */
export class HPGauge extends ReactiveComponent {
    /**
     * @param {Game_Battler} battler - The battler to track.
     * @param {boolean} showText - Whether to show HP text.
     */
    constructor(battler, showText = true) {
        super('div', 'w-full space-y-0.5');
        this.battler = battler;
        this.showText = showText;
        this.render();

        if (this.battler) {
            this.subscribe(this.battler, 'change:hp', () => this.update());
        }
    }

    render() {
        this.element.innerHTML = '';

        const hp = this.battler ? this.battler.hp : 0;
        const maxhp = this.battler ? this.battler.mhp : 1;
        const hpPct = (hp / maxhp) * 100;
        const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

        if (this.showText) {
             const textDiv = document.createElement('div');
             textDiv.className = 'text-[10px] text-right text-gray-500';
             textDiv.textContent = `${hp}/${maxhp}`;
             this.element.appendChild(textDiv);
             this._textElement = textDiv;
        }

        const barContainer = document.createElement('div');
        barContainer.className = 'w-full h-1 bg-gray-800';

        const bar = document.createElement('div');
        bar.className = `${hpColor} h-full transition-all duration-300`;
        bar.style.width = `${hpPct}%`;

        barContainer.appendChild(bar);
        this.element.appendChild(barContainer);
        this._barElement = bar;
    }

    update() {
        if (!this.battler) return;
        const hp = this.battler.hp;
        const maxhp = this.battler.mhp;
        const hpPct = (hp / maxhp) * 100;
        const hpColor = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';

        if (this._textElement) {
            this._textElement.textContent = `${hp}/${maxhp}`;
        }
        if (this._barElement) {
            this._barElement.style.width = `${hpPct}%`;
            // Update color class if needed (this is a bit tricky with class replacement, keeping it simple for now)
            // A full re-render is easier for color change, or explicit class manipulation
            this._barElement.className = `${hpColor} h-full transition-all duration-300`;
        }
    }
}

/**
 * A reactive MP Gauge component.
 */
export class MPGauge extends ReactiveComponent {
    /**
     * @param {Game_Battler} battler - The battler to track.
     * @param {boolean} showText - Whether to show MP text.
     */
    constructor(battler, showText = true) {
        super('div', 'w-full space-y-0.5');
        this.battler = battler;
        this.showText = showText;
        this.render();

        if (this.battler) {
            this.subscribe(this.battler, 'change:mp', () => this.update());
        }
    }

    render() {
        this.element.innerHTML = '';
        const mp = this.battler ? this.battler.mp : 0;
        const maxmp = this.battler ? this.battler.mmp : 0;

        // If no MP, hide or show empty?
        if (maxmp <= 0) {
            this.element.style.display = 'none';
            return;
        }

        const mpPct = (mp / maxmp) * 100;

        if (this.showText) {
             const textDiv = document.createElement('div');
             textDiv.className = 'text-[10px] text-right text-gray-500';
             textDiv.textContent = `MP ${mp}/${maxmp}`;
             this.element.appendChild(textDiv);
             this._textElement = textDiv;
        }

        const barContainer = document.createElement('div');
        barContainer.className = 'w-full h-1 bg-gray-800';

        const bar = document.createElement('div');
        bar.className = 'bg-indigo-500 h-full transition-all duration-300';
        bar.style.width = `${mpPct}%`;

        barContainer.appendChild(bar);
        this.element.appendChild(barContainer);
        this._barElement = bar;
    }

    update() {
        if (!this.battler) return;
        const mp = this.battler.mp;
        const maxmp = this.battler.mmp;
        const mpPct = (mp / maxmp) * 100;

        if (this._textElement) {
            this._textElement.textContent = `MP ${mp}/${maxmp}`;
        }
        if (this._barElement) {
            this._barElement.style.width = `${mpPct}%`;
        }
    }
}
