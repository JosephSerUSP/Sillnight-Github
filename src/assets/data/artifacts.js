export const artifacts = {
    'vitality_crystal': {
        name: 'Vitality Crystal',
        description: 'Increases Max HP of all party members by 20%.',
        cost: 500,
        traits: [
            { type: 'param_rate', code: 0, value: 1.2 }
        ]
    },
    'ancient_coin': {
        name: 'Ancient Coin',
        description: 'Increases Gold gain by 50%.',
        cost: 800,
        traits: [
            { type: 'gold_rate', value: 1.5 }
        ]
    },
    'vampire_fang': {
        name: 'Vampire Fang',
        description: 'Heal 5 HP after winning a battle.',
        cost: 600,
        traits: [
            { type: 'post_battle_heal', formula: '5' }
        ]
    },
    'berserker_idol': {
        name: 'Berserker Idol',
        description: 'Increases Physical Damage by 15% but decreases Defense by 10%.',
        cost: 700,
        traits: [
             { type: 'param_rate', code: 2, value: 1.15 }, // ATK
             { type: 'param_rate', code: 3, value: 0.90 }  // DEF
        ]
    }
};
