/**
 * Base class for all game scenes.
 * Manages access to systems, windows, and handles scene transitions.
 */
export class Scene {
    /**
     * @param {Object} systems - The game systems.
     * @param {Object} windows - The game windows.
     */
    constructor(systems, windows) {
        this.systems = systems;
        this.windows = windows;
    }

    /**
     * Handles the visual transition between battle and explore scenes.
     * Manages CSS classes for visibility and a swipe overlay effect.
     * @param {boolean} toBattle - If true, transitions to the battle scene. If false, transitions to the explore scene.
     * @param {Function} [onExploreRefresh] - Optional callback to execute when returning to the explore scene.
     */
    switchScene(toBattle, onExploreRefresh) {
        const swipe = document.getElementById('swipe-overlay');
        swipe.className = 'swipe-down';
        setTimeout(() => {
            const elExp = document.getElementById('explore-layer');
            const elBat = document.getElementById('battle-layer');
            const ctrls = document.getElementById('battle-controls');
            const eCtrls = document.getElementById('explore-controls');
            if (toBattle) {
                elExp.classList.remove('active-scene'); elExp.classList.add('hidden-scene');
                elBat.classList.remove('hidden-scene'); elBat.classList.add('active-scene');
                ctrls.classList.remove('hidden'); eCtrls.classList.add('hidden');
                // Attach renderer to battle container
                if (window.Game && window.Game.RenderManager) {
                     window.Game.RenderManager.attachTo('three-container');
                }
            } else {
                elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                // Attach renderer to explore container
                if (window.Game && window.Game.RenderManager) {
                     window.Game.RenderManager.attachTo('explore-container');
                }
                if (onExploreRefresh) onExploreRefresh();
            }
            swipe.className = 'swipe-clear';
            setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
        }, 600);
    }
}
