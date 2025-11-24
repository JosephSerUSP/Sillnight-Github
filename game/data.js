// Game data definitions for Stillnight
export const Data = {
    config: {
        tileSize: 48,
        viewDistance: 5,
        mapWidth: 30,
        mapHeight: 20,
        baseGoldPerEnemy: 20,
        baseXpPerEnemy: 5
    },
    elements: { R: '🔴', G: '🟢', B: '🔵', W: '⚪', K: '⚫' },
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
    creatures: {
        pixie: { id: 'pixie', name: 'Pixie', sprite: '🧚', baseHp: 12, hpGrowth: 0.15, xpCurve: 10, baseXp: 2, cost: 100, temperament: 'kind', acts: [ ['attack'], ['cure'] ] },
        goblin: { id: 'goblin', name: 'Goblin', sprite: '👺', baseHp: 18, hpGrowth: 0.20, xpCurve: 12, baseXp: 3, cost: 150, temperament: 'selfish', acts: [ ['attack', 'wait'], ['guard'] ] },
        skeleton: { id: 'skeleton', name: 'Skeleton', sprite: '💀', baseHp: 14, hpGrowth: 0.18, xpCurve: 10, baseXp: 2, cost: 120, temperament: 'free', acts: [ ['attack'], ['guard', 'attack'] ] },
        angel: { id: 'angel', name: 'Angel', sprite: '😇', baseHp: 20, hpGrowth: 0.22, xpCurve: 15, baseXp: 5, cost: 300, temperament: 'kind', acts: [ ['cure'], ['ray', 'attack'] ] },
        titania: { id: 'titania', name: 'Titania', sprite: '🧚‍♀️', baseHp: 30, hpGrowth: 0.25, xpCurve: 18, baseXp: 10, cost: 500, temperament: 'kind', acts: [ ['tornado', 'cure'], ['thunder'] ] },
        golem: { id: 'golem', name: 'Golem', sprite: '🗿', baseHp: 40, hpGrowth: 0.30, xpCurve: 20, baseXp: 8, cost: 400, temperament: 'free', acts: [ ['wait'], ['attackRow'] ] },
        lich: { id: 'lich', name: 'Lich', sprite: '🩻', baseHp: 35, hpGrowth: 0.28, xpCurve: 22, baseXp: 12, cost: 600, temperament: 'ruthless', acts: [ ['curse'], ['attack'] ] }
    },
    equipment: {
        charm_hp: { id: 'charm_hp', name: 'Vitality Charm', description: '+20% Max HP', hpBonus: 0.2, cost: 150 },
        charm_magic: { id: 'charm_magic', name: 'Arcane Charm', description: '+1 Power', powerBonus: 1, cost: 120 }
    },
    items: {
        potion_small: { id: 'potion_small', name: 'Small Potion', description: 'Heals 30% HP', healRatio: 0.3, cost: 30 },
        revive_leaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', reviveHpRatio: 0.5, cost: 200 }
    }
};
