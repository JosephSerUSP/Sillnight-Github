import { Config } from '../Config.js';

export class AudioService {
    constructor() {
        this.bgm = null;
        this.bgmName = '';

        this.volumes = {
            master: Config.Audio.MasterVolume,
            bgm: Config.Audio.BgmVolume,
            sfx: Config.Audio.SfxVolume
        };

        this.basePath = 'src/assets/audio/';
    }

    setMasterVolume(val) { this.setVolume('master', val); }
    setBgmVolume(val) { this.setVolume('bgm', val); }
    setSfxVolume(val) { this.setVolume('sfx', val); }

    setVolume(type, value) {
        if (this.volumes[type] !== undefined) {
            this.volumes[type] = Math.max(0, Math.min(1, value));
            if (type === 'master' || type === 'bgm') {
                if (this.bgm) {
                    this.bgm.volume = this.volumes.master * this.volumes.bgm;
                }
            }
        }
    }

    _resolvePath(folder, name) {
        if (name.includes('.')) {
            return `${this.basePath}${folder}/${name}`;
        }
        // Default extensions
        const ext = folder === 'music' ? 'mp3' : 'wav';
        return `${this.basePath}${folder}/${name}.${ext}`;
    }

    playBgm(name, fadeTime = 0) {
        if (this.bgmName === name) return;

        this.stopBgm(fadeTime);

        if (!name) return;

        this.bgmName = name;
        const url = this._resolvePath('music', name);

        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = this.volumes.master * this.volumes.bgm;

        audio.play().catch(e => {
            // Browsers block autoplay until user interaction
            if (e.name !== 'NotAllowedError') {
                console.warn(`AudioService: Failed to play BGM '${name}' at ${url}:`, e);
            }
        });

        this.bgm = audio;
    }

    stopBgm(fadeTime = 0) {
        if (!this.bgm) return;

        const audio = this.bgm;
        this.bgm = null;
        this.bgmName = '';

        if (fadeTime > 0) {
            const startVol = audio.volume;
            const duration = fadeTime * 1000;
            const startTime = performance.now();

            const fade = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                audio.volume = startVol * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(fade);
                } else {
                    audio.pause();
                }
            };
            requestAnimationFrame(fade);
        } else {
            audio.pause();
        }
    }

    playSfx(name) {
        if (!name) return;

        const url = this._resolvePath('sfx', name);
        const audio = new Audio(url);
        audio.volume = this.volumes.master * this.volumes.sfx;

        audio.play().catch(e => {
             if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                 console.warn(`AudioService: Failed to play SFX '${name}' at ${url}:`, e);
             }
        });
    }
}
