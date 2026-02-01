import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';
import { resolveAssetPath } from '../core.js';

/**
 * Service for handling background music (BGM) and sound effects (SFX).
 * Utilizes the native HTML5 Audio API.
 */
export class AudioService {
    constructor() {
        /** @type {HTMLAudioElement|null} */
        this.bgm = null;
        this.bgmName = null;

        // Mapping from event/action types to SFX filenames (without path/extension)
        this.sfxMap = {
            'cursor': 'Cursor1',
            'ok': 'Decision1',
            'cancel': 'Cancel1',
            'damage': 'Damage1',
            'miss': 'Miss',
            'victory': 'Victory1',
            'defeat': 'GameOver'
        };

        this.setupListeners();
    }

    /**
     * Sets up event listeners for automatic audio triggers.
     */
    setupListeners() {
        const events = Services.events;

        // Battle Events
        events.on('battle:start', () => this.playBgm('Battle1'));
        events.on('battle:victory', () => {
            this.stopBgm();
            this.playSfx(this.sfxMap.victory);
        });
        events.on('battle:damage_dealt', () => this.playSfx(this.sfxMap.damage));
        events.on('battle:action_missed', () => this.playSfx(this.sfxMap.miss));

        // UI Events
        events.on('ui:cursor', () => this.playSfx(this.sfxMap.cursor));
        events.on('ui:ok', () => this.playSfx(this.sfxMap.ok));
        events.on('ui:cancel', () => this.playSfx(this.sfxMap.cancel));
    }

    /**
     * Plays a BGM track.
     * @param {string} name - The filename of the BGM (without path/extension).
     */
    playBgm(name) {
        if (!name) return;
        if (this.bgmName === name && this.bgm && !this.bgm.paused) return;

        this.stopBgm();
        this.bgmName = name;

        // Assume files are in src/assets/audio/music/ and are .mp3
        // resolveAssetPath prepends 'src/' if needed.
        // We pass 'assets/audio/music/...' so it becomes 'src/assets/audio/music/...'
        const url = resolveAssetPath(`assets/audio/music/${name}.mp3`);

        this.bgm = new Audio(url);
        this.bgm.loop = true;
        this.updateBgmVolume();

        this.bgm.play().catch(e => {
            console.warn(`AudioService: Failed to play BGM '${name}' (Assets missing?):`, e);
        });
    }

    /**
     * Stops the currently playing BGM.
     */
    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
            this.bgmName = null;
        }
    }

    /**
     * Plays a sound effect.
     * @param {string} name - The filename of the SFX (without path/extension).
     * @param {number} [volume=1.0] - Relative volume (0.0 to 1.0).
     */
    playSfx(name, volume = 1.0) {
        if (!name) return;

        const url = resolveAssetPath(`assets/audio/sfx/${name}.mp3`);
        const sfx = new Audio(url);

        const masterVol = Config.Audio?.MasterVolume ?? 1.0;
        const sfxVol = Config.Audio?.SfxVolume ?? 0.8;

        sfx.volume = Math.max(0, Math.min(1, masterVol * sfxVol * volume));

        sfx.play().catch(e => {
             // Silence errors for missing SFX to avoid console noise during dev
             // console.warn(`AudioService: Failed to play SFX '${name}':`, e);
        });
    }

    /**
     * Updates the volume of the current BGM based on Config.
     */
    updateBgmVolume() {
        if (this.bgm) {
            const masterVol = Config.Audio?.MasterVolume ?? 1.0;
            const bgmVol = Config.Audio?.BgmVolume ?? 0.5;
            this.bgm.volume = Math.max(0, Math.min(1, masterVol * bgmVol));
        }
    }
}
