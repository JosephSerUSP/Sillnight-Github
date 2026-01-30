import { AudioService } from '../src/game/services/AudioService.js';
import { Config } from '../src/game/Config.js';

// Mock Audio
global.Audio = class {
    constructor(url) {
        this.url = url;
        this.volume = 1;
        this.loop = false;
        console.log(`[MockAudio] Created: ${url}`);
    }
    play() {
        console.log(`[MockAudio] Play: ${this.url}`);
        return Promise.resolve();
    }
    pause() {
        console.log(`[MockAudio] Pause: ${this.url}`);
    }
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.performance = { now: () => Date.now() };

console.log("Starting AudioService verification...");

const audio = new AudioService();
console.log("AudioService instantiated.");

// Test Play BGM
audio.playBgm('test_theme');
if (audio.bgmName !== 'test_theme') throw new Error("BGM name mismatch");

// Test Volume
audio.setMasterVolume(0.5);
if (audio.volumes.master !== 0.5) throw new Error("Master volume mismatch");

// Test Play SFX
audio.playSfx('test_hit');

console.log("AudioService verification passed!");
