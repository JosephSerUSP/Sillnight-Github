export const Creatures = {
    pixie: {
        id: 'pixie',
        name: 'Pixie',
        description: "A flicker of innocent light in the deep gloom. Their minds know no distinction between the conscious and unconscious, and as such, they say as they please.",
        sprite: '🧚',
        spriteAsset: 'assets/images/creatures/Pixie.png',
        baseHp: 12,
        hpGrowth: 0.15,
        xpCurve: 10,
        baseXp: 2,
        cost: 100,
        temperament: 'kind',
        race: 'Fey',
        elements: ['G', 'G'],
        passives: ['soothingBreeze'],
        atk: 80, def: 80, mat: 120, mdf: 120,
        acts: [
            ['attack'],
            ['cure']
        ]
    },
    goblin: {
        id: 'goblin',
        name: 'Goblin',
        description: "Grinning wide with avarice and malice, this scuttling horror will snatch any opportunity to make a profit, even if it means sacrificing an ally.",
        sprite: '👺',
        spriteAsset: 'assets/images/creatures/Goblin.png',
        baseHp: 18,
        hpGrowth: 0.20,
        xpCurve: 12,
        baseXp: 3,
        cost: 150,
        temperament: 'selfish',
        race: 'Unknown',
        elements: [],
        passives: ['devilLeech'],
        atk: 105, def: 95, mat: 80, mdf: 80,
        acts: [
            ['attack', 'wait'],
            ['guard']
        ]
    },
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton',
        description: "Animated by residual will or dark sorcery, these rattling bones are eternally bound to wander the abyss, devoid of emotion but not instinct.",
        sprite: '💀',
        spriteAsset: 'assets/images/creatures/Skeleton.png',
        baseHp: 14,
        hpGrowth: 0.18,
        xpCurve: 10,
        baseXp: 2,
        cost: 120,
        temperament: 'free',
        race: 'Undead',
        elements: [],
        passives: [],
        atk: 110, def: 90, mat: 80, mdf: 80,
        acts: [
            ['attack'],
            ['guard', 'attack']
        ]
    },
    angel: {
        id: 'angel',
        name: 'Angel',
        description: "A seraphic figure whose radiant purity often masks a chilling, unwavering obedience to an incomprehensible divine will. Mercy is not guaranteed.",
        sprite: '😇',
        spriteAsset: 'assets/images/creatures/Angel.png',
        baseHp: 20,
        hpGrowth: 0.22,
        xpCurve: 15,
        baseXp: 5,
        cost: 300,
        temperament: 'kind',
        race: 'Celestial',
        elements: [],
        passives: [],
        atk: 100, def: 100, mat: 115, mdf: 120,
        acts: [
            ['cure'],
            ['ray', 'attack']
        ]
    },
    titania: {
        id: 'titania',
        name: 'Titania',
        description: "The capricious Queen of the Fae. Her realm is woven from dreams and shadows, and her beauty holds the terrifying power of untamed nature and ancient magic.",
        sprite: '🧚‍♀️',
        spriteAsset: 'assets/images/creatures/Titania.png',
        baseHp: 30,
        hpGrowth: 0.25,
        xpCurve: 18,
        baseXp: 10,
        cost: 500,
        temperament: 'kind',
        race: 'Fey',
        elements: ['G'],
        passives: ['soothingBreeze'],
        atk: 90, def: 100, mat: 130, mdf: 130,
        acts: [
            ['tornado', 'cure'],
            ['thunder']
        ]
    },
    golem: {
        id: 'golem',
        name: 'Golem',
        description: "A crude mass of clay and stone given life through a sacred word or binding ritual. It moves with devastating, methodical force, feeling no pain or fear.",
        sprite: '🗿',
        spriteAsset: 'assets/images/creatures/Golem.png',
        baseHp: 40,
        hpGrowth: 0.30,
        xpCurve: 20,
        baseXp: 8,
        cost: 400,
        temperament: 'free',
        race: 'Construct',
        elements: ['R'],
        passives: ['highVitality'],
        atk: 120, def: 140, mat: 60, mdf: 80,
        acts: [
            ['wait'],
            ['attackRow']
        ]
    },
    lich: {
        id: 'lich',
        name: 'Lich',
        description: "A sorcerer who cheated death by shackling their soul to a physical vessel. Their power grows with every blasphemous ritual, and their gaze is eternal winter.",
        sprite: '🩻',
        spriteAsset: 'assets/images/creatures/LichKing.png',
        baseHp: 35,
        hpGrowth: 0.28,
        xpCurve: 22,
        baseXp: 12,
        cost: 600,
        temperament: 'ruthless',
        race: 'Undead',
        elements: ['K'],
        passives: [],
        atk: 90, def: 100, mat: 140, mdf: 120,
        acts: [
            ['curse'],
            ['attack']
        ]
    },
    stargazer: {
        id: 'stargazer',
        name: 'Stargazer',
        description: "Its single eye, unreadable, holds thoughts incomprehensible to most. It drifts silently through the void, observing the cosmos with an alien intellect.",
        sprite: '👁️',
        spriteAsset: 'assets/images/creatures/Stargazer.png',
        baseHp: 28,
        hpGrowth: 0.24,
        xpCurve: 16,
        baseXp: 7,
        cost: 350,
        temperament: 'free',
        race: 'Eldritch',
        elements: ['B'],
        passives: [],
        atk: 100, def: 100, mat: 120, mdf: 120,
        // Front: single-target snipe; Back: slower AoE control
        acts: [
            ['cosmicRay', 'ray'],
            ['gravityWell', 'wait']
        ]
    },

    waiter: {
        id: 'waiter',
        name: 'Waiter',
        description: "This gallant, tuxedoed man's charm is undeniable, if not for his decaying skin. God knows what's under his serving tray.",
        sprite: '🧑‍🍳',
        spriteAsset: 'assets/images/creatures/Waiter.png',
        baseHp: 22,
        hpGrowth: 0.21,
        xpCurve: 14,
        baseXp: 4,
        cost: 250,
        temperament: 'kind',
        race: 'Undead',
        elements: [],
        passives: [],
        atk: 105, def: 95, mat: 95, mdf: 105,
        // Front: row bash; Back: double-duty healer
        acts: [
            ['silverTray', 'attack'],
            ['serveDrink', 'cure']
        ]
    },

    inori: {
        id: 'inori',
        name: 'Inori',
        description: "Their prayers are muddled by the thick latex covering every inch of their body. The tubes connected to their back connect to God knows where.",
        sprite: '🧑‍🎤',
        spriteAsset: 'assets/images/creatures/Inori.png',
        baseHp: 26,
        hpGrowth: 0.23,
        xpCurve: 15,
        baseXp: 6,
        cost: 300,
        temperament: 'kind',
        race: 'Human',
        elements: ['W'],
        passives: ['highVitality'],
        atk: 90, def: 110, mat: 120, mdf: 120,
        // Front: premium heals; Back: holy nukes
        acts: [
            ['latexPrayer', 'cure'],
            ['divineBolt', 'thunder']
        ]
    },

    slumber: {
        id: 'slumber',
        name: 'Slumber',
        description: "Though its appearance is that of a mere baby, this being has lived for many a lifetime. It dreams of worlds beyond imagination.",
        sprite: '👶',
        spriteAsset: 'assets/images/creatures/Slumber.png',
        baseHp: 32,
        hpGrowth: 0.26,
        xpCurve: 17,
        baseXp: 9,
        cost: 450,
        temperament: 'free',
        race: 'Eldritch',
        elements: ['G'],
        passives: [],
        atk: 80, def: 90, mat: 135, mdf: 120,
        // Front: dreamy AoE caster; Back: wind + healing
        acts: [
            ['sleepMist', 'wait'],
            ['tornado', 'cure']
        ]
    },

    shiva: {
        id: 'shiva',
        name: 'Shiva',
        description: "The embodiment of ice and winter, this majestic entity commands the frozen elements with grace and power. Its presence chills the air and stills the heart.",
        sprite: '❄️',
        spriteAsset: 'assets/images/creatures/Shiva.png',
        baseHp: 38,
        hpGrowth: 0.29,
        xpCurve: 19,
        baseXp: 11,
        cost: 550,
        temperament: 'ruthless',
        race: 'Elemental',
        elements: ['B'],
        passives: [],
        atk: 100, def: 110, mat: 140, mdf: 120,
        // Row-freeze plus huge all-enemy finisher
        acts: [
            ['diamondDust', 'wait'],
            ['apocalypse']
        ]
    },

    shadowServant: {
        id: 'shadowServant',
        name: 'Shadow Servant',
        description: "A wraith-like entity bound to serve its master in death as in life. It moves silently, a living shadow that drains the warmth and hope from those it encounters.",
        sprite: '👤',
        spriteAsset: 'assets/images/creatures/ShadowServant.png',
        baseHp: 34,
        hpGrowth: 0.27,
        xpCurve: 18,
        baseXp: 10,
        cost: 500,
        temperament: 'ruthless',
        race: 'Undead',
        elements: ['K'],
        passives: [],
        atk: 115, def: 95, mat: 115, mdf: 100,
        // Heavy ST physical plus dark nuke
        acts: [
            ['shadowSpike', 'anvil'],
            ['curse']
        ]
    },

    ifrit: {
        id: 'ifrit',
        name: 'Ifrit',
        description: "A fiery spirit of immense power and temper. It embodies the destructive and transformative aspects of fire, often appearing as a towering figure wreathed in flames.",
        sprite: '🔥',
        spriteAsset: 'assets/images/creatures/ifrit.png',
        baseHp: 42,
        hpGrowth: 0.32,
        xpCurve: 21,
        baseXp: 13,
        cost: 650,
        temperament: 'ruthless',
        race: 'Elemental',
        elements: ['R'],
        passives: ['exploder'],
        atk: 130, def: 110, mat: 120, mdf: 90,
        // Row pressure and huge fire AoE
        acts: [
            ['attackRow', 'hellfire'],
            ['hellfire', 'thunder']
        ]
    },

    nurse: {
        id: 'nurse',
        name: 'Nurse',
        description: "Its oversized needle glistens under the dim light, promising both healing and harm. Approach with caution; its intentions are as enigmatic as its appearance.",
        sprite: '🧑‍⚕️',
        spriteAsset: 'assets/images/creatures/Nurse.png',
        baseHp: 24,
        hpGrowth: 0.22,
        xpCurve: 13,
        baseXp: 5,
        cost: 280,
        temperament: 'kind',
        race: 'Human',
        elements: ['W'],
        passives: [],
        atk: 105, def: 95, mat: 105, mdf: 100,
        // Front: poke & pressure; Back: fast heals
        acts: [
            ['injection', 'attack'],
            ['triage', 'cure']
        ]
    },

    no7: {
        id: 'no7',
        name: 'No. 7',
        description: "The only part of his muscular form that is obscured is his face, hidden beneath a horrifying hat. He whirls like the wind, delivering swift and deadly strikes.",
        sprite: '🥷',
        spriteAsset: 'assets/images/creatures/No7.png',
        baseHp: 36,
        hpGrowth: 0.28,
        xpCurve: 18,
        baseXp: 9,
        cost: 480,
        temperament: 'ruthless',
        race: 'Human',
        elements: ['G'],
        passives: ['flyHigh'],
        atk: 125, def: 100, mat: 80, mdf: 90,
        // Always aggressive, very fast row DPS
        acts: [
            ['windBlades', 'attack'],
            ['attack', 'windBlades']
        ]
    },

    masque: {
        id: 'masque',
        name: 'Masque',
        description: "Beneath the twin masks lies a pulsating, brain-like mass. Is its pain shared? Is it even sentient? No one knows.",
        sprite: '🎭',
        spriteAsset: 'assets/images/creatures/masque.png',
        baseHp: 30,
        hpGrowth: 0.25,
        xpCurve: 16,
        baseXp: 7,
        cost: 350,
        temperament: 'free',
        race: 'Unknown',
        elements: ['K'],
        passives: [],
        atk: 100, def: 100, mat: 120, mdf: 110,
        // Dark single-target pressure + curse
        acts: [
            ['maskTear', 'ray'],
            ['curse', 'maskTear']
        ]
    },

    joulart: {
        id: 'joulart',
        name: 'Joulart',
        description: "Clothes would only hinder such a being that thrives on feasting eyes. His heavy body moves with surprising agility, crushing all who dare oppose him.",
        sprite: '🍰',
        spriteAsset: 'assets/images/creatures/Joulart.png',
        baseHp: 44,
        hpGrowth: 0.33,
        xpCurve: 22,
        baseXp: 14,
        cost: 700,
        temperament: 'selfish',
        race: 'Beast',
        elements: ['R'],
        passives: [],
        atk: 135, def: 120, mat: 70, mdf: 80,
        // Big row/ ST damage and greedy self-heal
        acts: [
            ['attackRow', 'anvil'],
            ['feast', 'anvil']
        ]
    }
};
