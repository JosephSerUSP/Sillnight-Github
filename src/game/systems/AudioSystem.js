import { resolveAssetPath } from '../core.js';
import { Log } from '../log.js';

/**
 * System for managing and playing audio (BGM, BGS, ME, SE).
 */
export class AudioSystem {
    constructor() {
        /** @type {HTMLAudioElement|null} */
        this.bgm = null;
        /** @type {string|null} */
        this.currentBgmKey = null;

        this.config = {
            bgmVolume: 0.5,
            seVolume: 0.5,
            masterVolume: 1.0,
            muted: false
        };
    }

    /**
     * Plays a Background Music track.
     * @param {string} key - The filename key (e.g. 'battle-theme'). Assumes .mp3 if no extension.
     */
    playBgm(key) {
        if (this.config.muted) return;
        if (!key) {
            this.stopBgm();
            return;
        }

        // If already playing this track, ignore
        if (this.currentBgmKey === key && this.bgm && !this.bgm.paused) {
            return;
        }

        this.stopBgm();

        const ext = key.includes('.') ? '' : '.mp3';
        // If key starts with src, use it, else assume src/assets/audio/
        let path = key;
        if (!key.startsWith('src/')) {
             path = `src/assets/audio/${key}${ext}`;
        }
        const resolved = resolveAssetPath(path);

        this.bgm = new Audio(resolved);
        this.bgm.loop = true;
        this.bgm.volume = this.config.bgmVolume * this.config.masterVolume;

        this.bgm.play().catch(e => {
            // Common error: user interaction required, or file missing
            Log.warn(`AudioSystem: Failed to play BGM '${key}'. ${e.message}`);
        });
        this.currentBgmKey = key;
    }

    /**
     * Stops the current BGM.
     */
    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgm = null;
            this.currentBgmKey = null;
        }
    }

    /**
     * Plays a Sound Effect.
     * @param {string} key - The filename key (e.g. 'hit'). Assumes .wav if no extension.
     */
    playSe(key) {
        if (this.config.muted) return;
        if (!key) return;

        const ext = key.includes('.') ? '' : '.wav';
        let path = key;
        if (!key.startsWith('src/')) {
             path = `src/assets/audio/${key}${ext}`;
        }
        const resolved = resolveAssetPath(path);

        const audio = new Audio(resolved);
        audio.volume = this.config.seVolume * this.config.masterVolume;
        audio.play().catch(e => {
             // Suppress spammy errors for SE if files missing, or verify file exists first?
             // For now, catch is enough.
        });
    }
}
