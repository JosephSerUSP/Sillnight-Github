// verification/verify_audio.js
import { AudioService } from '../src/game/services/AudioService.js';
import { Config } from '../src/game/Config.js';

// Mock global Audio
global.Audio = class {
    constructor(path) {
        this.path = path;
        this.loop = false;
        this.volume = 1.0;
        this.paused = true;
        this.currentTime = 0;
    }
    play() {
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
};

console.log("Starting AudioService verification...");

// Verify Config
if (!Config.Audio) throw new Error("Config.Audio is missing");
if (Config.Audio.MasterVolume !== 1.0) throw new Error("Config.Audio.MasterVolume incorrect");
if (Config.Audio.BgmVolume !== 0.5) throw new Error("Config.Audio.BgmVolume incorrect");
if (Config.Audio.SfxVolume !== 0.8) throw new Error("Config.Audio.SfxVolume incorrect");
console.log("Config verification passed.");

// Instantiate Service
const audio = new AudioService();
if (!audio) throw new Error("Failed to instantiate AudioService");

// Test playBgm
audio.playBgm('test_bgm.mp3');
if (audio.bgm.path !== 'src/assets/audio/music/test_bgm.mp3') throw new Error("BGM path incorrect: " + audio.bgm.path);
if (!audio.bgm.loop) throw new Error("BGM should loop");
if (audio.bgm.volume !== 0.5) throw new Error("BGM volume incorrect: " + audio.bgm.volume); // 1.0 * 0.5
if (audio.currentBgmName !== 'test_bgm.mp3') throw new Error("currentBgmName incorrect");

console.log("playBgm verification passed.");

// Test stopBgm
audio.stopBgm();
if (audio.bgm !== null) throw new Error("BGM should be null after stop");
if (audio.currentBgmName !== null) throw new Error("currentBgmName should be null after stop");

console.log("stopBgm verification passed.");

// Test playSe
try {
    audio.playSe('test_se.wav');
    console.log("playSe verification passed.");
} catch (e) {
    throw new Error("playSe failed: " + e.message);
}

console.log("AudioService verification complete.");
