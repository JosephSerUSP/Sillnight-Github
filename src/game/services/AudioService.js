import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

/**
 * Service for handling game audio (BGM and SFX).
 * Subscribes to global events to trigger sounds automatically.
 */
export class AudioService {
    constructor() {
        this.bgm = null;
        this.currentBgmName = null;

        // Bind methods
        this.onBattleStart = this.onBattleStart.bind(this);
        this.onVictory = this.onVictory.bind(this);
        this.onDefeat = this.onDefeat.bind(this);
        this.onDamageDealt = this.onDamageDealt.bind(this);

        this.subscribe();
    }

    subscribe() {
        const events = Services.events;
        events.on('battle:start', this.onBattleStart);
        events.on('battle:victory', this.onVictory);
        events.on('battle:defeat', this.onDefeat);
        events.on('battle:damage_dealt', this.onDamageDealt);
    }

    onBattleStart() {
        this.playBgm('Battle1');
    }

    onVictory() {
        this.playBgm('Victory1', false);
    }

    onDefeat() {
        this.playBgm('GameOver', false);
    }

    onDamageDealt() {
        this.playSfx('Hit1');
    }

    /**
     * Plays background music.
     * @param {string} name - The name of the music file (without extension).
     * @param {boolean} loop - Whether to loop the music.
     */
    playBgm(name, loop = true) {
        if (this.currentBgmName === name && this.bgm && !this.bgm.paused) return;

        this.stopBgm();

        const path = `src/assets/audio/music/${name}.mp3`;
        this.bgm = new Audio(path);
        this.bgm.loop = loop;
        this.currentBgmName = name;

        this.updateVolume();

        this.bgm.play().catch(e => {
            console.warn(`AudioService: Failed to play BGM "${name}".`, e.message);
        });
    }

    /**
     * Stops the current background music.
     */
    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
            this.currentBgmName = null;
        }
    }

    /**
     * Plays a sound effect.
     * @param {string} name - The name of the SFX file (without extension).
     */
    playSfx(name) {
        const path = `src/assets/audio/sfx/${name}.wav`;
        const sfx = new Audio(path);

        const master = Config.Audio?.MasterVolume ?? 1.0;
        const sfxVol = Config.Audio?.SfxVolume ?? 0.8;
        sfx.volume = master * sfxVol;

        sfx.play().catch(() => {
            // Ignore missing SFX to prevent console spam
        });
    }

    /**
     * Updates the volume of the current BGM.
     */
    updateVolume() {
        if (this.bgm) {
            const master = Config.Audio?.MasterVolume ?? 1.0;
            const bgmVol = Config.Audio?.BgmVolume ?? 0.5;
            this.bgm.volume = master * bgmVol;
        }
    }
}
