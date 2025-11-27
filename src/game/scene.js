export class Scene {
    constructor(systems, windows) {
        this.systems = systems;
        this.windows = windows;
    }

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
            } else {
                elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                if (onExploreRefresh) onExploreRefresh();
            }
            swipe.className = 'swipe-clear';
            setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
        }, 600);
    }
}
