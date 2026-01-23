export const Party = {
    initial: {
        creatures: [
            { species: 'inori', minLevel: 1, maxLevel: 3 },
            { species: 'shiva', minLevel: 1, maxLevel: 3 },
            { species: 'nurse', minLevel: 1, maxLevel: 3 },
        ],
        count: 3,
        inventory: {
            items: [
                { id: 'potion_small', quantity: 3, chance: 1.0 },
                { id: 'revive_leaf', quantity: 1, chance: 1.0 }
            ],
            equipment: [
                { id: 'hp_boost1', quantity: 1, chance: 1.0 },
                { id: 'rabbits_foot', quantity: 1, chance: 0.5 },
                { id: 'charm_magic', quantity: 1, chance: 0.4 },
                { id: 'hermes_boots', quantity: 1, chance: 0.3 },
                { id: 'mars_emblem', quantity: 1, chance: 0.3 },
                { id: 'mercury_crest', quantity: 1, chance: 0.3 },
                { id: 'exp_boost', quantity: 1, chance: 0.1 },
                { id: 'straw_doll', quantity: 1, chance: 0.2 },
                { id: 'holy_sword_gram', quantity: 1, chance: 0.05 },
                { id: 'dark_scepter_lucille', quantity: 1, chance: 0.05 }
            ]
        }
    }
};
