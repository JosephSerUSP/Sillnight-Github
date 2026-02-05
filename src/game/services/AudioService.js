import { Config } from '../Config.js';

/**
 * Service for handling background music and sound effects.
 * Uses HTML5 Audio API.
 */
export class AudioService {
    constructor() {
        this._bgm = null;
        this._bgmUrl = null;
    }

    /**
     * Plays background music.
     * @param {string} url - Path to the audio file.
     */
    playBgm(url) {
        if (this._bgmUrl === url && this._bgm && !this._bgm.paused) {
            return;
        }

        this.stopBgm();

        this._bgmUrl = url;
        if (!url) return;

        if (typeof Audio !== 'undefined') {
            this._bgm = new Audio(url);
            this._bgm.loop = true;
            this.updateBgmVolume();

            this._bgm.play().catch(e => {
                console.warn(`AudioService: Failed to play BGM '${url}':`, e);
            });
        } else {
            console.log(`[AudioService] playBgm: ${url}`);
        }
    }

    /**
     * Stops the current background music.
     */
    stopBgm() {
        if (this._bgm) {
            this._bgm.pause();
            this._bgm.currentTime = 0;
            this._bgm = null;
        }
        this._bgmUrl = null;
    }

    /**
     * Plays a sound effect (fire and forget).
     * @param {string} url - Path to the audio file.
     */
    playSfx(url) {
        if (!url) return;

        if (typeof Audio !== 'undefined') {
            const sfx = new Audio(url);
            sfx.volume = this._calcVolume('sfx');
            sfx.play().catch(e => {
                console.warn(`AudioService: Failed to play SFX '${url}':`, e);
            });
        } else {
            console.log(`[AudioService] playSfx: ${url}`);
        }
    }

    /**
     * Sets volume settings in Config and updates active audio.
     * @param {string} key - 'MasterVolume', 'BgmVolume', or 'SfxVolume'.
     * @param {number} value - Volume between 0.0 and 1.0.
     */
    setVolume(key, value) {
        if (Config.Audio.hasOwnProperty(key)) {
             Config.Audio[key] = Math.max(0, Math.min(1, value));
             if (key === 'MasterVolume' || key === 'BgmVolume') {
                 this.updateBgmVolume();
             }
        }
    }

    updateBgmVolume() {
        if (this._bgm) {
            this._bgm.volume = this._calcVolume('bgm');
        }
    }

    _calcVolume(type) {
        const master = Config.Audio.MasterVolume;
        if (type === 'bgm') return master * Config.Audio.BgmVolume;
        if (type === 'sfx') return master * Config.Audio.SfxVolume;
        return master;
    }
}
