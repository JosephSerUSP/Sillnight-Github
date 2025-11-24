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
    // Element symbols used for skills (currently cosmetic).
    elements: { R: '🔴', G: '🟢', B: '🔵', W: '⚪', K: '⚫' },
    // Skills are defined declaratively here. Each skill has a
    // category (damage/heal/guard), a target selection rule, a base power,
    // scaling factors, an optional element, and a chosen animation.
    skills: {
        wait: { id: 'wait', name: 'Wait', category: 'effect', target: 'self', speed: 2, effect: 'wait', animation: 'flash' },
        attack: { id: 'attack', name: 'Attack', category: 'damage', target: 'enemy-single', speed: 0, power: 4, scaling: 2, animation: 'flash' },
        guard: { id: 'guard', name: 'Guard', category: 'effect', target: 'self', speed: 2, effect: 'guard', animation: 'flash' },
        attackRow: { id: 'attackRow', name: 'Attack Row', category: 'damage', target: 'enemy-row', speed: 0, power: 3, scaling: 1.5, animation: 'flash' },
        cure: { id: 'cure', name: 'Cure', category: 'heal', target: 'ally-single', speed: 1, power: 4, scaling: 2, element: 'W', animation: 'cure' },
        tornado: { id: 'tornado', name: 'Tornado', category: 'damage', target: 'enemy-all', speed: -1, power: 4, scaling: 1, element: 'G', animation: 'tornado' },
        thunder: { id: 'thunder', name: 'Thunder', category: 'damage', target: 'enemy-single', speed: 1, power: 6, scaling: 2, element: 'G', animation: 'thunder' },
        ray: { id: 'ray', name: 'Ray', category: 'damage', target: 'enemy-single', speed: 0, power: 2, scaling: 1, repeat: 3, element: 'W', animation: 'flash' },
        curse: { id: 'curse', name: 'Curse', category: 'damage', target: 'enemy-single', speed: 0, power: 16, scaling: 2, element: 'K', animation: 'flash' }
    },
    // Animation registry: describes how each battle animation behaves. Systems.Battle3D
    // uses these definitions to dispatch reusable animation steps instead of hard-coded
    // branches.
    animations: {
        jump: {
            steps: [
                { type: 'verticalSine', axis: 'z', amplitude: 0.75, speed: 0.6, duration: Math.PI, interval: 30 }
            ]
        },
        flash: {
            steps: [
                { type: 'colorPulse', blend: 'additive', colors: { negative: 0x00ff00, positive: 0xff0000, neutral: 0x8888ff }, cycles: 6, interval: 50 }
            ]
        },
        thunder: {
            steps: [
                {
                    type: 'iconAbove',
                    icon: '⛈️',
                    scale: 0.8,
                    behavior: 'riseFade',
                    startHeight: 0.8,
                    stayDuration: 0.2,
                    riseSpeed: 0.05,
                    fadeRate: 0.6,
                    flashStart: 0.4,
                    flashEnd: 1.4,
                    flashColors: [0xffff00, 0xffffff],
                    timeStep: 0.1,
                    interval: 30,
                    ttl: 2
                }
            ]
        },
        cure: {
            steps: [
                { type: 'sparkleSpiral', count: 3, angularVelocity: 0.3, descent: 0.1, duration: 3, interval: 30, scale: 0.5 }
            ]
        },
        tornado: {
            steps: [
                {
                    type: 'parallel',
                    steps: [
                        { type: 'lift', height: 3, duration: 2.5, wobble: { axis: 'x', amplitude: 0.25, frequency: 4 }, bounce: { amplitude: 0.5, duration: 1 }, interval: 30 },
                        { type: 'orbitBillboards', icon: '🍃', count: 4, scale: 0.4, radius: 1, angularVelocity: 0.4, verticalOffset: 0.5, duration: 2.5, interval: 30 }
                    ]
                }
            ]
        },
        hit: {
            steps: [
                { type: 'shake', axis: 'x', magnitude: 0.4, iterations: 8, interval: 40 },
                { type: 'damageNumber' }
            ]
        },
        die: {
            steps: [
                { type: 'scaleFade', duration: 1, interval: 32, scaleIncrease: 2 }
            ]
        },
        apocalypse: {
            steps: [
                { type: 'colorPulse', blend: 'additive', colors: { neutral: 0xff4400 }, cycles: 8, interval: 60 },
                {
                    type: 'parallel',
                    steps: [
                        { type: 'lift', height: 2.5, duration: 2.5, wobble: { axis: 'x', amplitude: 0.3, frequency: 5 }, bounce: { amplitude: 0.8, duration: 1 }, interval: 32 },
                        { type: 'orbitBillboards', icon: '☄️', count: 6, scale: 0.6, radius: 1.6, angularVelocity: 0.5, verticalOffset: 0.6, jitter: 0.2, duration: 2.5, interval: 32, fadeOut: true }
                    ]
                },
                { type: 'shake', axis: 'y', magnitude: 0.5, iterations: 6, interval: 50 }
            ]
        },
        anvil: {
            steps: [
                {
                    type: 'iconAbove',
                    icon: '🪨',
                    scale: 0.9,
                    behavior: 'easeDrop',
                    startHeight: 3,
                    landHeight: 0.8,
                    ease: 0.08,
                    impactBounce: { amplitude: 0.6, duration: 0.7 },
                    fadeAfterImpact: true,
                    interval: 24
                },
                { type: 'shake', axis: 'x', magnitude: 0.35, iterations: 6, interval: 35 }
            ]
        }
    },
    // Creatures database defines base stats and move sets for each species.
    // Extended with hpGrowth (per level) and xpCurve (xp cost per level).
    creatures: {
        pixie: { id: 'pixie', name: 'Pixie', sprite: '🧚', baseHp: 12, hpGrowth: 0.15, xpCurve: 10, baseXp: 2, cost: 100, temperament: 'kind', acts: [ ['attack'], ['cure'] ] },
        goblin: { id: 'goblin', name: 'Goblin', sprite: '👺', baseHp: 18, hpGrowth: 0.20, xpCurve: 12, baseXp: 3, cost: 150, temperament: 'selfish', acts: [ ['attack', 'wait'], ['guard'] ] },
        skeleton: { id: 'skeleton', name: 'Skeleton', sprite: '💀', baseHp: 14, hpGrowth: 0.18, xpCurve: 10, baseXp: 2, cost: 120, temperament: 'free', acts: [ ['attack'], ['guard', 'attack'] ] },
        angel: { id: 'angel', name: 'Angel', sprite: '😇', baseHp: 20, hpGrowth: 0.22, xpCurve: 15, baseXp: 5, cost: 300, temperament: 'kind', acts: [ ['cure'], ['ray', 'attack'] ] },
        titania: { id: 'titania', name: 'Titania', sprite: '🧚‍♀️', baseHp: 30, hpGrowth: 0.25, xpCurve: 18, baseXp: 10, cost: 500, temperament: 'kind', acts: [ ['tornado', 'cure'], ['thunder'] ] },
        golem: { id: 'golem', name: 'Golem', sprite: '🗿', baseHp: 40, hpGrowth: 0.30, xpCurve: 20, baseXp: 8, cost: 400, temperament: 'free', acts: [ ['wait'], ['attackRow'] ] },
        lich: { id: 'lich', name: 'Lich', sprite: '🩻', baseHp: 35, hpGrowth: 0.28, xpCurve: 22, baseXp: 12, cost: 600, temperament: 'ruthless', acts: [ ['curse'], ['attack'] ] }
    },
    // Equipment definitions for single-slot equipment. hpBonus is a multiplier on max HP; powerBonus can influence future scaling if needed.
    equipment: {
        charm_hp: { id: 'charm_hp', name: 'Vitality Charm', description: '+20% Max HP', hpBonus: 0.2, cost: 150 },
        charm_magic: { id: 'charm_magic', name: 'Arcane Charm', description: '+1 Power', powerBonus: 1, cost: 120 }
    },
    // Consumable item definitions. healRatio defines percent of max HP to heal; reviveHpRatio defines percent restored on revival.
    items: {
        potion_small: { id: 'potion_small', name: 'Small Potion', description: 'Heals 30% HP', healRatio: 0.3, cost: 30 },
        revive_leaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', reviveHpRatio: 0.5, cost: 200 }
    }
};

