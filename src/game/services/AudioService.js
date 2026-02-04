import { Config } from '../Config.js';

/**
 * Service for handling game audio (BGM and SFX).
 */
export class AudioService {
    constructor() {
        /** @type {HTMLAudioElement|null} */
        this._bgm = null;
        /** @type {string|null} */
        this._bgmPath = null;
    }

    /**
     * @returns {number} The master volume multiplier.
     */
    get masterVolume() {
        return Config.Audio ? Config.Audio.MasterVolume : 1.0;
    }

    /**
     * Plays a Background Music track.
     * @param {string} path - The path to the audio file.
     * @param {number} [volume=1.0] - Relative volume for this track.
     */
    playBgm(path, volume = 1.0) {
        if (this._bgmPath === path && this._bgm && !this._bgm.paused) return;

        this.stopBgm();

        this._bgmPath = path;
        this._bgm = new Audio(path);
        this._bgm.loop = true;
        this._bgm.volume = Math.max(0, Math.min(1, volume * (Config.Audio ? Config.Audio.BgmVolume : 0.5) * this.masterVolume));

        this._bgm.play().catch(e => {
            console.warn('AudioService: BGM playback failed or was blocked:', e);
        });
    }

    /**
     * Stops the current BGM.
     */
    stopBgm() {
        if (this._bgm) {
            this._bgm.pause();
            this._bgm.currentTime = 0;
            this._bgm = null;
        }
        this._bgmPath = null;
    }

    /**
     * Plays a Sound Effect.
     * @param {string} path - The path to the audio file.
     * @param {number} [volume=1.0] - Relative volume for this sfx.
     */
    playSfx(path, volume = 1.0) {
        const sfx = new Audio(path);
        sfx.volume = Math.max(0, Math.min(1, volume * (Config.Audio ? Config.Audio.SfxVolume : 0.8) * this.masterVolume));
        sfx.play().catch(e => {
            console.warn('AudioService: SFX playback failed or was blocked:', e);
        });
    }
}
