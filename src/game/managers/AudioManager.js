import { Services } from '../ServiceLocator.js';

export class AudioManager {
    constructor() {
        this._enabled = true;
        this._bgm = null;
    }

    init() {
        this.setupSubscriptions();
        console.log("AudioManager initialized.");
    }

    setupSubscriptions() {
        Services.events.on('battler:hp_change', ({ diff }) => {
            if (diff < 0) {
                this.playSe('hit');
            } else if (diff > 0) {
                this.playSe('heal');
            }
        });
    }

    playSe(key) {
        if (!this._enabled) return;
        // console.log(`[Audio] Play SE: ${key}`);
    }

    playBgm(key) {
        if (!this._enabled) return;
        // console.log(`[Audio] Play BGM: ${key}`);
    }
}
