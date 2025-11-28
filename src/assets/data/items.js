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
    reviveLeaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', cost: 200, effects: [{ type: 'revive', formula: '0.5' }] },

    // Campaign Items
    aetherVial: { id: 'aether_vial', name: 'Aether Vial', description: 'Restores 50 MP', cost: 100, effects: [{ type: 'mp_heal', formula: '50' }] },
    stabilityAnchor: { id: 'stability_anchor', name: 'Stability Anchor', description: 'An artifact that stabilizes local space.', cost: 500, effects: [] },
    voidDust: { id: 'void_dust', name: 'Void Dust', description: 'Sparkling dust from the void.', cost: 50, effects: [] },
    crystalShard: { id: 'crystal_shard', name: 'Crystal Shard', description: 'A jagged piece of magical crystal.', cost: 75, effects: [] },
    mossyKey: { id: 'mossy_key', name: 'Mossy Key', description: 'Opens chests in the Ruins.', cost: 0, effects: [] },
    crystallineKey: { id: 'crystalline_key', name: 'Crystalline Key', description: 'Opens chests in the Caverns.', cost: 0, effects: [] },
    voidKey: { id: 'void_key', name: 'Void Key', description: 'Opens chests in the Void.', cost: 0, effects: [] },
    guildBadge: { id: 'guild_badge', name: 'Guild Badge', description: 'Proof of membership.', cost: 500, effects: [] },
    ancientText: { id: 'ancient_text', name: 'Ancient Text', description: 'Contains lore about the Spire.', cost: 100, effects: [] },
    stabilizerKit: { id: 'stabilizer_kit', name: 'Stabilizer Kit', description: 'Revives ally with full HP.', cost: 1000, effects: [{ type: 'revive', formula: '1.0' }] }
};
