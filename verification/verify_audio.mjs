import { AudioService } from '../src/game/services/AudioService.js';
import { Services } from '../src/game/ServiceLocator.js';
import { Config } from '../src/game/Config.js';
import assert from 'assert';

// --- Mocks ---

class MockAudio {
    constructor(src) {
        this.src = src;
        this.volume = 1.0;
        this.loop = false;
        this.paused = true;
        MockAudio.instances.push(this);
    }

    async play() {
        this.paused = false;
        MockAudio.calls.push(`play:${this.src}`);
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
        MockAudio.calls.push(`pause:${this.src}`);
    }
}
MockAudio.instances = [];
MockAudio.calls = [];

global.Audio = MockAudio;

// --- Test ---

console.log("Starting AudioService verification...");

// 1. Initialize Service
const audio = new AudioService();
assert.ok(audio, "AudioService instance created");

// 2. Register Service (simulating main.js)
Services.register('AudioService', audio);

// 3. Test Play BGM
console.log("Testing playBgm...");
audio.playBgm('Battle1');
assert.strictEqual(audio.bgmName, 'Battle1', "BGM Name set");
assert.ok(audio.bgm instanceof MockAudio, "BGM Audio instance created");
assert.ok(!audio.bgm.paused, "BGM is playing");
assert.ok(audio.bgm.loop, "BGM is looping");
assert.ok(MockAudio.calls.includes('play:src/assets/audio/music/Battle1.mp3'), "Play called with correct URL");

// 4. Test Play SFX via Method
console.log("Testing playSfx...");
MockAudio.calls = []; // Clear log
audio.playSfx('Cursor1');
assert.ok(MockAudio.instances.length > 1, "New Audio instance created for SFX");
assert.ok(MockAudio.calls.includes('play:src/assets/audio/sfx/Cursor1.mp3'), "SFX Play called");

// 5. Test Event Trigger (UI)
console.log("Testing Event Trigger (UI)...");
MockAudio.calls = [];
Services.events.emit('ui:ok');
// Map 'ok' -> 'Decision1'
assert.ok(MockAudio.calls.some(c => c.includes('Decision1.mp3')), "Event ui:ok triggered Decision1 SFX");

// 6. Test Event Trigger (Battle)
console.log("Testing Event Trigger (Battle)...");
MockAudio.calls = [];
Services.events.emit('battle:damage_dealt');
// Map 'damage_dealt' -> 'Damage1'
assert.ok(MockAudio.calls.some(c => c.includes('Damage1.mp3')), "Event battle:damage_dealt triggered Damage1 SFX");

// 7. Test Volume Control
console.log("Testing Volume...");
Config.Audio = { MasterVolume: 0.5, BgmVolume: 1.0, SfxVolume: 1.0 };
audio.updateBgmVolume();
assert.strictEqual(audio.bgm.volume, 0.5, "BGM volume updated based on master volume");

Config.Audio.MasterVolume = 1.0;
Config.Audio.BgmVolume = 0.5;
audio.updateBgmVolume();
assert.strictEqual(audio.bgm.volume, 0.5, "BGM volume updated based on bgm volume");

console.log("AudioService verification passed!");
