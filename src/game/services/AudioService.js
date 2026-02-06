import { Config } from '../Config.js';
import { Services } from '../ServiceLocator.js';

/**
 * Service for handling audio playback (BGM, SE).
 * Subscribes to Game Events to trigger sounds automatically.
 */
export class AudioService {
    constructor() {
        /** @type {HTMLAudioElement|null} */
        this._bgmAudio = null;

        this.masterVolume = Config.Audio?.MasterVolume ?? 1.0;
        this.bgmVolume = Config.Audio?.BgmVolume ?? 0.5;
        this.sfxVolume = Config.Audio?.SfxVolume ?? 0.8;

        this._subscribeToEvents();
    }

    _subscribeToEvents() {
        // Battle Events
        Services.events.on('battle:damage_dealt', () => this.playSe('damage'));
        Services.events.on('battle:action_missed', () => this.playSe('miss'));
        Services.events.on('battle:victory', () => this.playBgm('victory', false));
        Services.events.on('battle:defeat', () => this.playSe('defeat'));

        // UI Events
        Services.events.on('ui:cursor', () => this.playSe('cursor'));
        Services.events.on('ui:ok', () => this.playSe('decision'));
        Services.events.on('ui:cancel', () => this.playSe('cancel'));
        Services.events.on('ui:buzzer', () => this.playSe('buzzer'));
    }

    /**
     * Plays a background music track.
     * @param {string} name - The filename (without extension) in src/assets/audio/music/
     * @param {boolean} [loop=true] - Whether to loop the track.
     */
    playBgm(name, loop = true) {
        this.stopBgm();

        // Defaulting to .ogg, could be configurable
        const path = `src/assets/audio/music/${name}.ogg`;

        this._bgmAudio = new Audio(path);
        this._bgmAudio.volume = this.masterVolume * this.bgmVolume;
        this._bgmAudio.loop = loop;

        this._bgmAudio.play().catch(e => {
            // Common error: user hasn't interacted with document yet.
            console.warn(`AudioService: Failed to play BGM '${name}' at ${path}.`, e.message);
        });
    }

    /**
     * Stops the current BGM.
     */
    stopBgm() {
        if (this._bgmAudio) {
            this._bgmAudio.pause();
            this._bgmAudio = null;
        }
    }

    /**
     * Plays a sound effect.
     * @param {string} name - The filename (without extension) in src/assets/audio/sfx/
     */
    playSe(name) {
        const path = `src/assets/audio/sfx/${name}.ogg`;
        const audio = new Audio(path);
        audio.volume = this.masterVolume * this.sfxVolume;

        audio.play().catch(e => {
             // Often fails if files are missing or no user interaction.
             // We silence it to avoid spamming console in this dev phase.
             // console.warn(`AudioService: Failed to play SE '${name}'`, e.message);
        });
    }
}
