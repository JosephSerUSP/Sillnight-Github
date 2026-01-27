import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

/**
 * Service for managing audio playback (BGM and SFX).
 * Handles volume control, file loading, and EventBus subscriptions.
 */
export class AudioService {
    constructor() {
        this.bgm = null; // The Audio object for the current BGM
        this.currentBgmName = null;

        // Paths
        this.BGM_PATH = 'src/assets/audio/bgm/';
        this.SFX_PATH = 'src/assets/audio/sfx/';

        // Extension
        this.EXT = '.mp3'; // Default to mp3 for now
    }

    /**
     * Initialize the AudioService.
     * Subscribes to Game Events.
     */
    init() {
        console.log("AudioService: Initializing...");
        const bus = Services.events;

        // Battle Events
        bus.on('battle:start', () => this.playBgm('battle_theme'));
        bus.on('battle:victory', () => {
            this.stopBgm(1);
            this.playBgm('victory_theme');
        });
        bus.on('battle:defeat', () => this.stopBgm(2));

        // SFX Events
        bus.on('battle:damage_dealt', () => this.playSfx('hit'));
        // bus.on('battle:action_used', () => this.playSfx('attack')); // Optional

        console.log("AudioService: Subscribed to events.");
    }

    /**
     * Plays a Background Music track.
     * @param {string} name - The name of the BGM file (without extension).
     * @param {number} [fadeTime=0] - Time in seconds to fade in (not fully implemented yet).
     */
    playBgm(name, fadeTime = 0) {
        if (this.currentBgmName === name && this.bgm && !this.bgm.paused) {
            return; // Already playing
        }

        this.stopBgm();

        const path = `${this.BGM_PATH}${name}${this.EXT}`;
        console.log(`AudioService: Playing BGM "${name}" from ${path}`);

        this.bgm = new Audio(path);
        this.bgm.loop = true;
        this.updateVolume();

        // Error handling for missing files
        this.bgm.onerror = () => {
            console.warn(`AudioService: Failed to load BGM "${name}" at ${path}. File might be missing.`);
            this.bgm = null;
            this.currentBgmName = null;
        };

        this.bgm.play().catch(e => {
            // Autoplay policy or other error
            console.warn(`AudioService: Could not play BGM "${name}".`, e);
        });

        this.currentBgmName = name;
    }

    /**
     * Stops the current BGM.
     * @param {number} [fadeTime=0] - Time in seconds to fade out (not fully implemented yet).
     */
    stopBgm(fadeTime = 0) {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
            this.currentBgmName = null;
        }
    }

    /**
     * Plays a Sound Effect.
     * @param {string} name - The name of the SFX file (without extension).
     */
    playSfx(name) {
        const path = `${this.SFX_PATH}${name}${this.EXT}`;
        // console.log(`AudioService: Playing SFX "${name}"`);

        const sfx = new Audio(path);
        sfx.volume = Config.Audio.Master * Config.Audio.SFX;

        sfx.onerror = () => {
            // Suppress error logs for SFX to avoid spamming if files are missing
            // console.warn(`AudioService: Failed to load SFX "${name}".`);
        };

        sfx.play().catch(e => {
            // Ignore autoplay errors for SFX
        });
    }

    /**
     * Updates the volume of the current BGM based on Config.
     */
    updateVolume() {
        if (this.bgm) {
            this.bgm.volume = Config.Audio.Master * Config.Audio.BGM;
        }
    }
}
