import { Config } from '../Config.js';

/**
 * Service for handling game audio (BGM and SFX).
 * Utilizes the HTML5 Audio API.
 */
export class AudioService {
    constructor() {
        /** @type {HTMLAudioElement|null} */
        this.bgm = null;
        /** @type {string|null} */
        this.currentBgmName = null;

        // Settings from Config
        this.masterVolume = Config.Audio?.MasterVolume ?? 1.0;
        this.bgmVolume = Config.Audio?.BgmVolume ?? 0.5;
        this.sfxVolume = Config.Audio?.SfxVolume ?? 0.8;
    }

    /**
     * Plays a Background Music file.
     * @param {string} filename - The name of the file in src/assets/audio/music/
     */
    playBgm(filename) {
        if (this.currentBgmName === filename && this.bgm && !this.bgm.paused) return;

        this.stopBgm();

        // Determine path - simplistic approach, assuming flat structure
        const path = `src/assets/audio/music/${filename}`;

        this.bgm = new Audio(path);
        this.bgm.loop = true;
        this.updateBgmVolume();

        this.bgm.onerror = () => {
            console.warn(`AudioService: Failed to load BGM ${filename} at ${path}`);
        };

        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`AudioService: Autoplay prevented or error for ${filename}: ${error}`);
            });
        }

        this.currentBgmName = filename;
    }

    /**
     * Stops the currently playing BGM.
     */
    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgm = null;
            this.currentBgmName = null;
        }
    }

    /**
     * Plays a Sound Effect.
     * @param {string} filename - The name of the file in src/assets/audio/sfx/
     */
    playSe(filename) {
        const path = `src/assets/audio/sfx/${filename}`;
        const se = new Audio(path);
        se.volume = this.masterVolume * this.sfxVolume;

        se.onerror = () => {
             console.warn(`AudioService: Failed to load SE ${filename} at ${path}`);
        };

        const playPromise = se.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Ignore AbortError which happens if we stop it immediately, or other playback errors
                if (error.name !== 'AbortError') {
                     console.warn(`AudioService: SE error for ${filename}: ${error}`);
                }
            });
        }
    }

    updateBgmVolume() {
        if (this.bgm) {
            this.bgm.volume = this.masterVolume * this.bgmVolume;
        }
    }

    /**
     * Updates the master volume.
     * @param {number} value - Volume from 0.0 to 1.0
     */
    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        this.updateBgmVolume();
    }
}
