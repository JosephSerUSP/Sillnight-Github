// ------------------- DATA DEFINITIONS -------------------
export const Data = {
    // Configuration constants controlling core parameters.
    config: {
        tileSize: 48,
        viewDistance: 5,
        mapWidth: 30,
        mapHeight: 20,
        baseGoldPerEnemy: 20,
        baseXpPerEnemy: 5
    },
    // Element symbols used for skills and creatures. Elements can stack.
    elements: { R: '🔴', G: '🟢', B: '🔵', W: '⚪', K: '⚫' },
    // Skills are defined declaratively here. Each skill has a
    // category (damage/heal/guard), a target selection rule, a base power,
    // scaling factors, an optional element, and a chosen animation.
    skills: {
        wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         speed: 2,  effect: 'wait',  animation: 'flash' },
        attack: { id: 'attack', name: 'Attack',      category: 'damage', target: 'enemy-single', speed: 0,  power: 4, scaling: 2,   animation: 'flash' },
        guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effect: 'guard', animation: 'flash' },

        attackRow: { id: 'attackRow', name: 'Attack Row', category: 'damage', target: 'enemy-row',   speed: 0,  power: 3, scaling: 1.5, animation: 'flash' },
        cure:      { id: 'cure',      name: 'Cure',       category: 'heal',   target: 'ally-single', speed: 1,  power: 4, scaling: 2,   element: 'W', animation: 'cure' },

        tornado:   { id: 'tornado',   name: 'Tornado',    category: 'damage', target: 'enemy-all',   speed: -1, power: 4, scaling: 1,   element: 'G', animation: 'tornado' },
        thunder:   { id: 'thunder',   name: '🟢Thunder',   category: 'damage', target: 'enemy-single',speed: 1,  power: 6, scaling: 2,   element: 'G', animation: 'thunder' },
        ray:       { id: 'ray',       name: 'Ray',        category: 'damage', target: 'enemy-single',speed: 0,  power: 2, scaling: 1,   repeat: 3,   element: 'W', animation: 'flash' },
        curse:     { id: 'curse',     name: 'Curse',      category: 'damage', target: 'enemy-single',speed: 0,  power: 16,scaling: 2,   element: 'K', animation: 'flash' },

        apocalypse: {
            id: 'apocalypse',
            name: 'Apocalypse',
            category: 'damage',
            target: 'enemy-all',
            speed: -2,               // Very slow, very strong
            power: 8,
            scaling: 2.5,
            element: 'K',
            animation: 'apocalypse'
        },
        anvil: {
            id: 'anvil',
            name: 'Anvil Drop',
            category: 'damage',
            target: 'enemy-single',
            speed: -1,               // Heavy, slightly slower
            power: 9,
            scaling: 2.2,
            element: 'R',
            animation: 'anvil'
        },

        cosmicRay: {
            id: 'cosmicRay',
            name: 'Cosmic Ray',
            category: 'damage',
            target: 'enemy-single',
            speed: 1,                // Snappy snipe
            power: 5,
            scaling: 2,
            element: 'W',
            animation: 'cosmicRay'
        },
        gravityWell: {
            id: 'gravityWell',
            name: 'Gravity Well',
            category: 'damage',
            target: 'enemy-all',
            speed: -1,
            power: 3,
            scaling: 1.8,
            element: 'B',
            animation: 'gravityWell'
        },

        // --- Waiter: hybrid row attacker & single-target healer ---
        silverTray: {
            id: 'silverTray',
            name: 'Silver Tray',
            category: 'damage',
            target: 'enemy-row',
            speed: 0,
            power: 4,
            scaling: 1.6,
            element: 'K',
            animation: 'silverTray'
        },
        serveDrink: {
            id: 'serveDrink',
            name: 'Serve Drink',
            category: 'heal',
            target: 'ally-single',
            speed: 1,
            power: 3,
            scaling: 1.5,
            element: 'W',
            animation: 'serveDrink'
        },

        // --- Inori: single-target premium healer + holy nuke ---
        latexPrayer: {
            id: 'latexPrayer',
            name: 'Latex Prayer',
            category: 'heal',
            target: 'ally-single',
            speed: 0,
            power: 6,
            scaling: 2.5,
            element: 'W',
            animation: 'latexPrayer'
        },
        divineBolt: {
            id: 'divineBolt',
            name: 'Divine Bolt',
            category: 'damage',
            target: 'enemy-single',
            speed: 1,
            power: 6,
            scaling: 2.2,
            element: 'W',
            animation: 'divineBolt'
        },

        // --- Slumber: dreamy AoE caster ---
        sleepMist: {
            id: 'sleepMist',
            name: 'Sleep Mist',
            category: 'damage',
            target: 'enemy-all',
            speed: 0,
            power: 3,
            scaling: 1.6,
            element: 'B',
            animation: 'sleepMist'
        },

        // --- Shiva: ice row control (plus Apocalypse) ---
        diamondDust: {
            id: 'diamondDust',
            name: 'Diamond Dust',
            category: 'damage',
            target: 'enemy-row',
            speed: 0,
            power: 5,
            scaling: 2.0,
            element: 'B',
            animation: 'diamondDust'
        },

        // --- Shadow Servant: surgical dark ST burst ---
        shadowSpike: {
            id: 'shadowSpike',
            name: 'Shadow Spike',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 7,
            scaling: 2.0,
            element: 'K',
            animation: 'shadowSpike'
        },

        // --- Ifrit: big fire AoE ---
        hellfire: {
            id: 'hellfire',
            name: 'Hellfire',
            category: 'damage',
            target: 'enemy-all',
            speed: -1,
            power: 5,
            scaling: 2.0,
            element: 'R',
            animation: 'hellfire'
        },

        // --- Nurse: risky ST poke + fast triage heal ---
        injection: {
            id: 'injection',
            name: 'Injection',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 5,
            scaling: 1.8,
            element: 'K',
            animation: 'injection'
        },
        triage: {
            id: 'triage',
            name: 'Triage',
            category: 'heal',
            target: 'ally-single',
            speed: 2,
            power: 4,
            scaling: 2.0,
            element: 'W',
            animation: 'triage'
        },

        // --- No. 7: ultra-fast multi-hit row pressure ---
        windBlades: {
            id: 'windBlades',
            name: 'Wind Blades',
            category: 'damage',
            target: 'enemy-row',
            speed: 2,
            power: 4,
            scaling: 1.5,
            repeat: 2,
            element: 'G',
            animation: 'windBlades'
        },

        // --- Masque: single-target dark pressure ---
        maskTear: {
            id: 'maskTear',
            name: 'Mask Tear',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 6,
            scaling: 2.0,
            element: 'K',
            animation: 'maskTear'
        },

        // --- Joulart: greedy self-sustain ---
        feast: {
            id: 'feast',
            name: 'Feast',
            category: 'heal',
            target: 'self',
            speed: 0,
            power: 5,
            scaling: 1.5,
            element: 'R',
            animation: 'feast'
        }
    },

    
    // Effekseer effect registry. Each entry can optionally reference an .efkefc file,
    // but still provides a text fallback so effects remain visible when assets are
    // missing or while they load.
    effects: {
        default: { icon: '✨', duration: 900 },
        slash: { icon: '💥', duration: 800 },
        heal: { icon: '✚', duration: 1000 },
        thunder: { icon: '⚡', duration: 1100, scale: 1.2 },
        volley: { icon: '❄️', duration: 1000, scale: 1.1 },
        ritual: { icon: '☄️', duration: 1400, scale: 1.3 }
    },

    // RPG Maker MV-style action sequences. Steps are run in order, combining sprite
    // motions and Effekseer effects before applying damage/healing payloads.
    actionSequences: {
        default: {
            steps: [
                { type: 'cast', subject: 'actor', effect: 'default', wait: 250 },
                { type: 'impact', subject: 'targets', effect: 'slash', apply: true, wait: 450 }
            ]
        },
        heal: {
            steps: [
                { type: 'cast', subject: 'actor', effect: 'heal', wait: 300 },
                { type: 'impact', subject: 'targets', effect: 'heal', apply: true, wait: 350 }
            ]
        },
        thunder: {
            steps: [
                { type: 'cast', subject: 'actor', effect: 'thunder', wait: 200 },
                { type: 'impact', subject: 'targets', effect: 'thunder', apply: true, wait: 500 }
            ]
        },
        volley: {
            steps: [
                { type: 'cast', subject: 'actor', effect: 'volley', wait: 200 },
                { type: 'impact', subject: 'targets', effect: 'volley', apply: true, wait: 550 }
            ]
        },
        ritual: {
            steps: [
                { type: 'cast', subject: 'actor', effect: 'ritual', wait: 400 },
                { type: 'wait', wait: 250 },
                { type: 'impact', subject: 'targets', effect: 'ritual', apply: true, wait: 600 }
            ]
        }
    },

    creatures: {
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
            // Row-freeze plus huge all-enemy finisher
            acts: [
                ['diamondDust', 'attack'],
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
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
            passive: null,
            // Big row/ ST damage and greedy self-heal
            acts: [
                ['attackRow', 'anvil'],
                ['feast', 'anvil']
            ]
        }

    },
    // Equipment definitions for single-slot equipment. hpBonus is a multiplier on max HP; powerBonus can influence future scaling if needed.
    equipment: {
        hpBoost1: { id: 'hp_boost1', name: 'Vitality Seal 1', description: '+10% Max HP', hpBonus: 0.1, cost: 125 },
        hpBoost2: { id: 'hp_boost2', name: 'Vitality Seal 2', description: '+20% Max HP', hpBonus: 0.2, cost: 400 },
        hpBoost3: { id: 'hp_boost3', name: 'Vitality Seal 3', description: '+30% Max HP', hpBonus: 0.3, cost: 2800 },
        expBoost1: { id: 'exp_boost', name: 'Golden Egg', description: 'earn 10% more XP from battles', xpBonus: 0.5, cost: 15000 },
        rabbitsFoot: { id: 'rabbits_foot', name: "Rabbit's Foot", description: 'greatly improves Critical Hit chance', critBonus: 0.15, cost: 250 },
        strawDoll: { id: 'straw_doll', name: 'Straw Doll', description: 'can survive a fatal blow once per battle', surviveKO:1, cost: 2500 },
        angelCurio: { id: 'angel_curio', name: 'Angel Curio', description: 'Breaks to revive unit with 100% HP upon death', reviveOnKO: true, cost: 5000 },
        charmMagic: { id: 'charm_magic', name: 'Arcane Charm', description: '+1 Power', powerBonus: 1, cost: 120 },
        holySwordGram: { id: 'holy_sword_gram', name: 'Holy Sword Gram', description: '+3 Power, user becomes ⚪ elemental', powerBonus: 3, elementChange: 'W', cost: 1500 },
        darkScepterLucille: { id: 'dark_scepter_lucille', name: 'Dark Scepter Lucille', description: '+3 Power, user becomes ⚫ elemental', powerBonus: 3, elementChange: 'K', cost: 1500 },
        marsEmblem: { id: 'mars_emblem', name: 'Mars Emblem', description: '+3 Power, user becomes 🔴 elemental', powerBonus: 3, elementChange: 'R', cost: 1500 },
        mercuryCrest: { id: 'mercury_crest', name: 'Mercury Crest', description: 'restores 1HP every turn, user becomes 🔵 elemental', elementChange: 'B', hpRegen: 1, cost: 1500 },
        hermesBoots: { id: 'hermes_boots', name: "Hermes' Boots", description: 'all actions gain Speed +2, user becomes 🟢 elemental', speedBonus: 2, elementChange: 'G', cost: 1500 }
    },
    // Consumable item definitions. healRatio defines percent of max HP to heal; reviveHpRatio defines percent restored on revival.
    items: {
        potionSmall: { id: 'potion_small', name: 'Small Potion', description: 'Heals 30% HP', healRatio: 0.3, cost: 30 },
        lifeIncense: { id: 'life_incense', name: 'Life Incense', description: 'Raises MaxHP by 2.', increase:[ 'maxHp', 2 ], cost: 200 },
        wisdomIncense: { id: 'wisdom_incense', name: 'Wisdom Incense', description: 'Raises Level by 1.', increase:[ 'level', 1 ], cost: 2500 },
        reviveLeaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', reviveHpRatio: 0.5, cost: 200 }
    }
};

// Normalize skill and effect data with defaults so the database stays tight and every
// field has a predictable value.
const skillDefaults = {
    category: 'damage',
    target: 'enemy-single',
    speed: 0,
    power: 0,
    scaling: 1,
    repeat: 1,
    element: null,
    actionSequence: null
};

Object.keys(Data.skills).forEach((id) => {
    const s = Data.skills[id];
    Data.skills[id] = { ...skillDefaults, ...s };
    if (!Data.skills[id].actionSequence) {
        if (Data.skills[id].category === 'heal') Data.skills[id].actionSequence = 'heal';
        else Data.skills[id].actionSequence = 'default';
    }
});

Object.entries({
    thunder: 'thunder',
    cosmicRay: 'thunder',
    shadowSpike: 'thunder',
    maskTear: 'thunder',
    tornado: 'volley',
    diamondDust: 'volley',
    gravityWell: 'volley',
    windBlades: 'volley',
    sleepMist: 'volley',
    hellfire: 'ritual',
    anvil: 'ritual',
    apocalypse: 'ritual'
}).forEach(([skillId, seq]) => {
    if (Data.skills[skillId]) Data.skills[skillId].actionSequence = seq;
});

const effectDefaults = { icon: '✨', file: null, scale: 1, speed: 1, duration: 600 };
Object.keys(Data.effects).forEach((key) => {
    Data.effects[key] = { id: key, ...effectDefaults, ...Data.effects[key] };
});

const stepDefaults = { type: 'wait', wait: 300, subject: 'targets', effect: 'default', apply: false };
Object.keys(Data.actionSequences).forEach((key) => {
    const seq = Data.actionSequences[key];
    seq.steps = (seq.steps || []).map((step) => ({ ...stepDefaults, ...step }));
});

