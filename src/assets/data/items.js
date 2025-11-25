export const defaultItem = {
    name: 'Unnamed Item',
    description: '',
    cost: 0,
    target: 'self',
    effects: []
};

export const Items = {
    potionSmall: { id: 'potion_small', name: 'Small Potion', description: 'Heals 30% HP', cost: 30, effects: [{ type: 'hp_heal_ratio', formula: '0.3' }] },
    lifeIncense: { id: 'life_incense', name: 'Life Incense', description: 'Raises MaxHP by 2.', cost: 200, effects: [{ type: 'increase_max_hp', formula: '2' }] },
    wisdomIncense: { id: 'wisdom_incense', name: 'Wisdom Incense', description: 'Raises Level by 1.', cost: 2500, effects: [{ type: 'increase_level', formula: '1' }] },
    reviveLeaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', cost: 200, effects: [{ type: 'revive', formula: '0.5' }] }
};
