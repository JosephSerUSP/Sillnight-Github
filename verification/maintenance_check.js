
// Mock Browser Environment & Dependencies
global.window = {};
global.document = {
    createElement: () => ({ style: {} }),
    getElementById: () => null
};
global.Audio = class MockAudio {
    play() { return Promise.resolve(); }
    pause() {}
};
global.THREE = {
    Vector3: class { constructor() {} },
    Matrix4: class {
        constructor() {}
        makeRotationX() { return this; }
        makeTranslation() { return this; }
        multiply() { return this; }
    },
    Scene: class { constructor() {} },
    PerspectiveCamera: class { constructor() {} },
    WebGLRenderer: class { constructor() { this.domElement = {}; } },
    Group: class { constructor() {} },
    AmbientLight: class { constructor() {} },
    DirectionalLight: class { constructor() {} },
    Clock: class { constructor() {} },
    LoadingManager: class { constructor() {} },
    TextureLoader: class { constructor() {} },
};

// Also mock Effekseer
global.effekseer = {
    createContext: () => ({}),
    initRuntime: () => {}
};

async function runTests() {
    console.log("Starting Maintenance Verification...");

    // Dynamic imports to ensure mocks are ready
    const { Services } = await import('../src/game/ServiceLocator.js');
    const { Config } = await import('../src/game/Config.js');
    const { AudioService } = await import('../src/game/services/AudioService.js');
    const { CreatureRegistry } = await import('../src/game/registries/CreatureRegistry.js');
    const { TraitRegistry } = await import('../src/game/registries/TraitRegistry.js');
    const { Game_Action } = await import('../src/game/classes/Game_Action.js');

    let passed = true;

    // 1. Verify Audio Config
    if (Config.Audio && Config.Audio.MasterVolume === 1.0) {
        console.log("PASS: Config.Audio exists.");
    } else {
        console.error("FAIL: Config.Audio missing or incorrect.");
        passed = false;
    }

    // 2. Verify AudioService Registration
    Services.register('AudioService', new AudioService());
    const audioService = Services.get('AudioService');
    if (audioService && typeof audioService.playBgm === 'function') {
        console.log("PASS: AudioService registered and has methods.");
    } else {
        console.error("FAIL: AudioService not working.");
        passed = false;
    }

    // 3. Verify Element Logic (Data-Driven)
    Services.register('TraitRegistry', new TraitRegistry());
    const creatureRegistry = new CreatureRegistry();

    const mockCreatureData = {
        id: 'mock_fire_creature',
        elements: ['R'] // Fire
    };

    creatureRegistry.register('mock_fire_creature', mockCreatureData);

    const resolvedCreature = creatureRegistry.get('mock_fire_creature');

    if (resolvedCreature.traits && resolvedCreature.traits.some(t => t.code === 'ELEMENT_RATE')) {
        console.log("PASS: CreatureRegistry injected ELEMENT_RATE traits.");
    } else {
        console.error("FAIL: CreatureRegistry did not inject traits.");
        passed = false;
        console.log("Resolved Traits:", resolvedCreature.traits);
    }

    // Verify Specific Rates
    // Mock Battler
    const mockBattler = {
        traitObjects: () => [resolvedCreature],
        paramBase: () => 0,
        paramPlus: () => 0,
        paramRate: () => 1,
        paramBuffRate: () => 1
    };

    const traitRegistry = Services.get('TraitRegistry');

    // Test logic: Fire (R)
    // Resist Self (R) = 0.75
    // Weak to Blue (B) = 1.25 (Since Blue > Red)
    // Resist Green (G) = 0.75 (Since Red > Green)

    const rateSelf = traitRegistry.traitsPi(mockBattler, 'ELEMENT_RATE', 'R');
    const rateWeak = traitRegistry.traitsPi(mockBattler, 'ELEMENT_RATE', 'B');
    const rateResist = traitRegistry.traitsPi(mockBattler, 'ELEMENT_RATE', 'G');

    if (rateSelf === 0.75) console.log("PASS: Fire Resists Fire (0.75)");
    else { console.error(`FAIL: Fire vs Fire rate is ${rateSelf}`); passed = false; }

    if (rateWeak === 1.25) console.log("PASS: Fire Weak to Blue (1.25)");
    else { console.error(`FAIL: Fire vs Blue rate is ${rateWeak}`); passed = false; }

    if (rateResist === 0.75) console.log("PASS: Fire Resists Green (0.75)");
    else { console.error(`FAIL: Fire vs Green rate is ${rateResist}`); passed = false; }

    // 4. Verify Game_Action uses logic
    const mockAction = new Game_Action({ });
    mockAction.item = () => ({ element: 'B' }); // Action is Blue (Water)

    // Target is Fire. Blue > Fire. Should be 1.25.
    const finalRate = mockAction.calcElementRate(mockBattler);
    if (finalRate === 1.25) {
        console.log("PASS: Game_Action.calcElementRate returned correct value via Registry.");
    } else {
        console.error(`FAIL: Game_Action.calcElementRate returned ${finalRate}, expected 1.25`);
        passed = false;
    }

    if (passed) {
        console.log("ALL CHECKS PASSED.");
        process.exit(0);
    } else {
        console.error("SOME CHECKS FAILED.");
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
