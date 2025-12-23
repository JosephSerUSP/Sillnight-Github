
export const Creatures = {
    // --- Base Templates ---
    base_creature: {
        id: 'base_creature',
        atk: 100, def: 100, mat: 100, mdf: 100,
        hpGrowth: 0.20,
        mpGrowth: 0.05,
        xpCurve: 10,
        elements: [],
        passives: [],
        acts: [['wait']]
    },

    base_undead: {
        id: 'base_undead',
        parent: 'base_creature',
        race: 'Undead',
        elements: ['K'], // Dark affinity
        temperament: 'ruthless'
    },

    base_fey: {
        id: 'base_fey',
        parent: 'base_creature',
        race: 'Fey',
        elements: ['G'], // Wind/Nature affinity
        temperament: 'kind',
        passives: ['soothingBreeze']
    },

    base_human: {
        id: 'base_human',
        parent: 'base_creature',
        race: 'Human',
        temperament: 'free'
    },

    base_elemental: {
        id: 'base_elemental',
        parent: 'base_creature',
        race: 'Elemental',
        temperament: 'ruthless'
    },

    base_eldritch: {
        id: 'base_eldritch',
        parent: 'base_creature',
        race: 'Eldritch',
        temperament: 'free'
    },

    base_construct: {
        id: 'base_construct',
        parent: 'base_creature',
        race: 'Construct',
        temperament: 'free',
        passives: ['highVitality']
    },

    // --- Concrete Creatures ---

    summoner: {
        id: 'summoner',
        parent: 'base_human',
        name: 'Summoner',
        description: 'A conduit between worlds who anchors the party and channels mana to sustain allies.',
        sprite: '🔮',
        spriteAsset: 'assets/images/creatures/Summoner.png',
        baseHp: 26,
        hpGrowth: 0.12,
        baseMp: 820,
        mpGrowth: 0.02,
        xpCurve: 12,
        baseXp: 0,
        cost: 0,
        race: 'Mystic',
        temperament: 'kind',
        elements: [],
        atk: 90, def: 100, mat: 110, mdf: 115,
        acts: [
            ['guard', 'attack'],
            ['wait']
        ]
    },

    pixie: {
        id: 'pixie',
        parent: 'base_fey',
        name: 'Pixie',
        description: "A flicker of innocent light in the deep gloom. Their minds know no distinction between the conscious and unconscious, and as such, they say as they please.",
        sprite: '🧚',
        spriteAsset: 'assets/images/creatures/Pixie.png',
        baseHp: 12,
        hpGrowth: 0.15,
        xpCurve: 10,
        baseXp: 2,
        cost: 100,
        elements: ['G', 'G'], // Double nature
        atk: 80, def: 80, mat: 120, mdf: 120,
        acts: [
            ['attack'],
            ['cure']
        ]
    },

    goblin: {
        id: 'goblin',
        parent: 'base_creature',
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
        passives: ['devilLeech'],
        atk: 105, def: 95, mat: 80, mdf: 80,
        acts: [
            ['attack', 'wait'],
            ['guard']
        ]
    },

    skeleton: {
        id: 'skeleton',
        parent: 'base_undead',
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
        elements: [], // Override base undead dark affinity
        atk: 110, def: 90, mat: 80, mdf: 80,
        acts: [
            ['attack'],
            ['guard', 'attack']
        ]
    },

    angel: {
        id: 'angel',
        parent: 'base_creature',
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
        atk: 100, def: 100, mat: 115, mdf: 120,
        acts: [
            ['cure'],
            ['ray', 'attack']
        ]
    },

    titania: {
        id: 'titania',
        parent: 'base_fey',
        name: 'Titania',
        description: "The capricious Queen of the Fae. Her realm is woven from dreams and shadows, and her beauty holds the terrifying power of untamed nature and ancient magic.",
        sprite: '🧚‍♀️',
        spriteAsset: 'assets/images/creatures/Titania.png',
        baseHp: 30,
        hpGrowth: 0.25,
        xpCurve: 18,
        baseXp: 10,
        cost: 500,
        elements: ['G'],
        atk: 90, def: 100, mat: 130, mdf: 130,
        acts: [
            ['tornado', 'cure'],
            ['thunder']
        ]
    },

    golem: {
        id: 'golem',
        parent: 'base_construct',
        name: 'Golem',
        description: "A crude mass of clay and stone given life through a sacred word or binding ritual. It moves with devastating, methodical force, feeling no pain or fear.",
        sprite: '🗿',
        spriteAsset: 'assets/images/creatures/Golem.png',
        baseHp: 40,
        hpGrowth: 0.30,
        xpCurve: 20,
        baseXp: 8,
        cost: 400,
        elements: ['R'],
        atk: 120, def: 140, mat: 60, mdf: 80,
        acts: [
            ['wait'],
            ['attackRow']
        ]
    },

    lich: {
        id: 'lich',
        parent: 'base_undead',
        name: 'Lich',
        description: "A sorcerer who cheated death by shackling their soul to a physical vessel. Their power grows with every blasphemous ritual, and their gaze is eternal winter.",
        sprite: '🩻',
        spriteAsset: 'assets/images/creatures/LichKing.png',
        baseHp: 35,
        hpGrowth: 0.28,
        xpCurve: 22,
        baseXp: 12,
        cost: 600,
        elements: ['K'],
        atk: 90, def: 100, mat: 140, mdf: 120,
        acts: [
            ['curse'],
            ['attack']
        ]
    },

    stargazer: {
        id: 'stargazer',
        parent: 'base_eldritch',
        name: 'Stargazer',
        description: "Its single eye, unreadable, holds thoughts incomprehensible to most. It drifts silently through the void, observing the cosmos with an alien intellect.",
        sprite: '👁️',
        spriteAsset: 'assets/images/creatures/Stargazer.png',
        baseHp: 28,
        hpGrowth: 0.24,
        xpCurve: 16,
        baseXp: 7,
        cost: 350,
        elements: ['B'],
        atk: 100, def: 100, mat: 120, mdf: 120,
        acts: [
            ['cosmicRay', 'ray'],
            ['gravityWell', 'wait']
        ]
    },

    waiter: {
        id: 'waiter',
        parent: 'base_undead',
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
        elements: [], // Override default undead 'K'
        atk: 105, def: 95, mat: 95, mdf: 105,
        acts: [
            ['silverTray', 'attack'],
            ['serveDrink', 'cure']
        ]
    },

    inori: {
        id: 'inori',
        parent: 'base_human',
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
        elements: ['W'],
        passives: ['highVitality'],
        atk: 90, def: 110, mat: 120, mdf: 120,
        acts: [
            ['latexPrayer', 'cure'],
            ['divineBolt', 'thunder']
        ]
    },

    slumber: {
        id: 'slumber',
        parent: 'base_eldritch',
        name: 'Slumber',
        description: "Though its appearance is that of a mere baby, this being has lived for many a lifetime. It dreams of worlds beyond imagination.",
        sprite: '👶',
        spriteAsset: 'assets/images/creatures/Slumber.png',
        baseHp: 32,
        hpGrowth: 0.26,
        xpCurve: 17,
        baseXp: 9,
        cost: 450,
        elements: ['G'],
        atk: 80, def: 90, mat: 135, mdf: 120,
        acts: [
            ['sleepMist', 'wait'],
            ['tornado', 'cure']
        ]
    },

    shiva: {
        id: 'shiva',
        parent: 'base_elemental',
        name: 'Shiva',
        description: "The embodiment of ice and winter, this majestic entity commands the frozen elements with grace and power. Its presence chills the air and stills the heart.",
        sprite: '❄️',
        spriteAsset: 'assets/images/creatures/Shiva.png',
        baseHp: 38,
        hpGrowth: 0.29,
        xpCurve: 19,
        baseXp: 11,
        cost: 550,
        elements: ['B'],
        atk: 100, def: 110, mat: 140, mdf: 120,
        acts: [
            ['diamondDust', 'wait'],
            ['apocalypse']
        ]
    },

    shadowServant: {
        id: 'shadowServant',
        parent: 'base_undead',
        name: 'Shadow Servant',
        description: "A wraith-like entity bound to serve its master in death as in life. It moves silently, a living shadow that drains the warmth and hope from those it encounters.",
        sprite: '👤',
        spriteAsset: 'assets/images/creatures/ShadowServant.png',
        baseHp: 34,
        hpGrowth: 0.27,
        xpCurve: 18,
        baseXp: 10,
        cost: 500,
        elements: ['K'],
        atk: 115, def: 95, mat: 115, mdf: 100,
        acts: [
            ['shadowSpike', 'anvil'],
            ['curse']
        ]
    },

    ifrit: {
        id: 'ifrit',
        parent: 'base_elemental',
        name: 'Ifrit',
        description: "A fiery spirit of immense power and temper. It embodies the destructive and transformative aspects of fire, often appearing as a towering figure wreathed in flames.",
        sprite: '🔥',
        spriteAsset: 'assets/images/creatures/ifrit.png',
        baseHp: 42,
        hpGrowth: 0.32,
        xpCurve: 21,
        baseXp: 13,
        cost: 650,
        elements: ['R'],
        passives: ['exploder'],
        atk: 130, def: 110, mat: 120, mdf: 90,
        acts: [
            ['attackRow', 'hellfire'],
            ['hellfire', 'thunder']
        ]
    },

    nurse: {
        id: 'nurse',
        parent: 'base_human',
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
        elements: ['W'],
        atk: 105, def: 95, mat: 105, mdf: 100,
        acts: [
            ['injection', 'attack'],
            ['triage', 'cure']
        ]
    },

    no7: {
        id: 'no7',
        parent: 'base_human',
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
        elements: ['G'],
        passives: ['flyHigh'],
        atk: 125, def: 100, mat: 80, mdf: 90,
        acts: [
            ['windBlades', 'attack'],
            ['attack', 'windBlades']
        ]
    },

    masque: {
        id: 'masque',
        parent: 'base_creature',
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
        atk: 100, def: 100, mat: 120, mdf: 110,
        acts: [
            ['maskTear', 'ray'],
            ['curse', 'maskTear']
        ]
    },

    joulart: {
        id: 'joulart',
        parent: 'base_creature',
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
        atk: 135, def: 120, mat: 70, mdf: 80,
        acts: [
            ['attackRow', 'anvil'],
            ['feast', 'anvil']
        ]
    }
};
