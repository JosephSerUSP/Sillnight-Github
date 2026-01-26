import { Log } from '../log.js';

export class AudioSystem {
    constructor() {
        this.bgm = null;
        this.currentBgmName = null;
        this.volume = {
            bgm: 0.5,
            sfx: 0.7
        };
        // Check if Audio is supported (browser environment)
        this.enabled = typeof Audio !== 'undefined';
    }

    playBgm(name) {
        if (!this.enabled) return;
        if (this.currentBgmName === name) return;
        this.stopBgm();

        const path = `src/assets/audio/music/${name}.mp3`;
        try {
            this.bgm = new Audio(path);
            this.bgm.loop = true;
            this.bgm.volume = this.volume.bgm;

            // Audio.play() returns a promise. We must handle it.
            const promise = this.bgm.play();
            if (promise !== undefined) {
                promise.then(() => {
                    this.currentBgmName = name;
                    // console.log(`[AudioSystem] Playing BGM: ${name}`);
                }).catch(e => {
                    // Autoplay policy or missing file
                    console.warn(`[AudioSystem] Failed to play BGM ${name}: ${e.message}`);
                    this.bgm = null;
                    this.currentBgmName = null;
                });
            }
        } catch (e) {
             console.warn(`[AudioSystem] Error initializing BGM ${name}: ${e.message}`);
        }
    }

    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
            this.currentBgmName = null;
        }
    }

    playSe(name) {
        if (!this.enabled) return;
        const path = `src/assets/audio/sfx/${name}.mp3`;
        try {
            const sfx = new Audio(path);
            sfx.volume = this.volume.sfx;
            const promise = sfx.play();
            if (promise !== undefined) {
                promise.catch(e => {
                     // Suppress errors for missing SFX to avoid console noise
                });
            }
        } catch (e) {
            // Ignore
        }
    }
}
