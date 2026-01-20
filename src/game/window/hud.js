import { Window_Base } from '../windows.js';
import { FlexLayout } from '../layout/FlexLayout.js';
import { TextComponent } from '../layout/components.js';
import { FloorDisplay, GoldDisplay } from '../layout/hud_components.js';

/**
 * Heads-Up Display window.
 * Shows the current floor and gold amount.
 */
export class Window_HUD extends Window_Base {
    constructor() {
        super('hud');
    }

    initialize() {
        super.initialize();
        this.defineLayout();
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
        this._floorText = new FloorDisplay();

        this._mpText = new TextComponent('MP 0/0');
        this._mpText.setHtml('MP <span class="text-white">0/0</span>');

        // Gold Display (Right)
        this._goldText = new GoldDisplay();

        this.layout.add(this._floorText);
        this.layout.add(this._mpText);
        this.layout.add(this._goldText);
    }

    /**
     * Updates the HUD with current game state values.
     */
    refresh() {
        // Floor and Gold are now reactive (or will be), but MP still needs manual update for now
        // or we can attach a reactive component if we have access to the summoner instance.

        // Update reactive components manually for now until they are fully subscribed
        if (this._floorText.refresh) this._floorText.refresh();
        if (this._goldText.refresh) this._goldText.refresh();

        const summoner = window.$gameParty ? window.$gameParty.summoner : null;

        // If summoner changed, we might need to re-subscribe if we had a reactive component for MP.
        // For now, keep MP text update logic here or move to a component that finds the summoner.
        const mpText = summoner ? `${summoner.mp}/${summoner.mmp}` : '0/0';
        if (this._mpText) this._mpText.setHtml(`MP <span class="text-white">${mpText}</span>`);

        // If we want MP to be reactive, we need the summoner instance.
        // Since the summoner can change (though unlikely for the main player character in this design?),
        // we can set up a listener.
        if (summoner && !this._mpListenerAttached) {
             // Assuming summoner is a Game_Battler with EventEmitter
             // But wait, summoner might be created after HUD initialization.
             // We can check if it has 'on' method.
             if (typeof summoner.on === 'function') {
                 summoner.on('change:mp', (val) => {
                     const mmp = summoner.mmp;
                     this._mpText.setHtml(`MP <span class="text-white">${val}/${mmp}</span>`);
                 });
                 this._mpListenerAttached = true;
             }
        }
    }
}
