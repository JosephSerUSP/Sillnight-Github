import { ReactiveComponent } from './ReactiveComponent.js';

export class FloorDisplay extends ReactiveComponent {
    constructor() {
        super('div', '');
        this.render();
        if (window.$gameMap) {
            this.subscribe(window.$gameMap, 'change:floor', () => this.update());
        }
    }

    render() {
        const floor = window.$gameMap ? window.$gameMap.floor : 1;
        this.setHtml(`FLOOR <span class="text-white">${floor}</span>`);
    }

    update() {
        const floor = window.$gameMap ? window.$gameMap.floor : 1;
        this.setHtml(`FLOOR <span class="text-white">${floor}</span>`);
    }

    refresh() {
        this.update();
    }
}

export class GoldDisplay extends ReactiveComponent {
    constructor() {
        super('div', '');
        this.render();
        if (window.$gameParty) {
            this.subscribe(window.$gameParty, 'change:gold', () => this.update());
        }
    }

    render() {
        const gold = window.$gameParty ? window.$gameParty.gold : 0;
        this.setHtml(`GOLD <span class="text-white">${gold}</span>`);
    }

    update() {
        const gold = window.$gameParty ? window.$gameParty.gold : 0;
        this.setHtml(`GOLD <span class="text-white">${gold}</span>`);
    }

    refresh() {
        this.update();
    }
}
