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
                { id: 'revive_leaf', quantity: 1, chance: 0.5 }
            ],
            equipment: [
                { id: 'hp_boost1', quantity: 1, chance: 0.25 },
                { id: 'rabbits_foot', quantity: 1, chance: 0.25 },
                { id: 'charm_magic', quantity: 1, chance: 0.25 },
                { id: 'straw_doll', quantity: 1, chance: 0.1 }
            ]
        }
    }
};
