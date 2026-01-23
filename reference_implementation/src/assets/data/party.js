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
                { id: 'potionSmall', quantity: 3, chance: 1.0 },
                { id: 'reviveLeaf', quantity: 1, chance: 1.0 }
            ],
            equipment: [
                { id: 'hpBoost1', quantity: 1, chance: 1.0 },
                { id: 'rabbitsFoot', quantity: 1, chance: 0.5 }
            ]
        }
    }
};
