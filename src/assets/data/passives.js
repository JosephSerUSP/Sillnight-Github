export const defaultPassive = {
    name: 'Unnamed Passive',
    description: '',
    traits: []
};

export const Passives = {
    soothingBreeze: {
        id: 'soothingBreeze',
        name: 'Soothing Breeze',
        description: "Restores a random amount of HP from 1 up to the creature's level (weighted towards 1) after every battle.",
        traits: [{ type: 'post_battle_heal', formula: 'level' }]
    },
    highVitality: {
        id: 'highVitality',
        name: 'High Vitality',
        description: 'Restores 1hp whenever any creature acts in battle.',
        traits: [{ type: 'turn_heal', formula: '1' }]
    },
    flyHigh: {
        id: 'flyHigh',
        name: 'Fly High',
        description: "Gain +1 bonus every time this creature successfully evades, up to a maximum of (creature's level / 2). This resets when the battle ends.",
        traits: [{ type: 'evade_bonus', formula: '1' }]
    },
    devilLeech: {
        id: 'devilLeech',
        name: 'Devil Leech',
        description: 'At the end of every battle, the creature deals 2 damage to every adjacent creature, and restores half that amount to itself.',
        traits: [{ type: 'post_battle_leech', formula: '2' }]
    },
    exploder: {
        id: 'exploder',
        name: 'Exploder',
        description: 'When dying, automatically cast Apocalypse.',
        traits: [{ type: 'on_death_cast', skill: 'Apocalypse' }]
    }
};
