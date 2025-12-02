import { Window_Base } from '../windows.js';
import { FlexLayout } from '../layout/FlexLayout.js';
import { TextComponent } from '../layout/components.js';

/**
 * Heads-Up Display window.
 * Shows the current floor and gold amount.
 */
export class Window_HUD extends Window_Base {
    constructor() {
        super('hud');
    }

    defineLayout() {
        // Clear any existing content in the root element (important if attaching to existing DOM)
        this.clear();

        // Use FlexLayout for the main container
        // justify: 'space-between' puts floor on left, gold on right
        this.layout = new FlexLayout(this.root, {
            direction: 'row',
            justify: 'space-between',
            align: 'center',
            gap: '1rem'
        });

        // Ensure root styles for HUD positioning
        this.root.className = 'absolute top-0 left-0 w-full p-2 text-yellow-500 font-mono text-lg pointer-events-none z-10';

        // Floor Display (Left)
        this._floorText = new TextComponent('FLOOR 1');
        this._floorText.setHtml('FLOOR <span class="text-white">1</span>');

        // Gold Display (Right)
        this._goldText = new TextComponent('GOLD 0');
        this._goldText.setHtml('GOLD <span class="text-white">0</span>');

        this.layout.add(this._floorText);
        this.layout.add(this._goldText);
    }

    /**
     * Updates the HUD with current game state values.
     */
    refresh() {
        const floor = window.$gameMap ? window.$gameMap.floor : 1;
        const gold = window.$gameParty ? window.$gameParty.gold : 0;

        if (this._floorText) this._floorText.setHtml(`FLOOR <span class="text-white">${floor}</span>`);
        if (this._goldText) this._goldText.setHtml(`GOLD <span class="text-white">${gold}</span>`);
    }
}
