import { Component } from './Component.js';

export class GaugeComponent extends Component {
    constructor(colorClass = 'bg-white', heightClass = 'h-1') {
        super('div', 'w-full bg-gray-800');
        this.addClass(heightClass);

        // Inner bar
        this.bar = document.createElement('div');
        this.bar.className = `${colorClass} h-full transition-all duration-300`;
        this.bar.style.width = '0%';
        this.element.appendChild(this.bar);

        this._value = 0;
        this._max = 1;
    }

    setup(value, max) {
        this._value = value;
        this._max = max;
        this.updateWidth();
    }

    setValue(value) {
        this._value = value;
        this.updateWidth();
    }

    setMax(max) {
        this._max = max;
        this.updateWidth();
    }

    setColor(colorClass) {
        this.bar.className = `${colorClass} h-full transition-all duration-300`;
    }

    updateWidth() {
        let pct = 0;
        if (this._max > 0) {
            pct = Math.min(100, Math.max(0, (this._value / this._max) * 100));
        }
        this.bar.style.width = `${pct}%`;
    }
}
