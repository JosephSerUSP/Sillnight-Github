export const defaultEquipment = {
    name: 'Unnamed Equipment',
    description: '',
    cost: 0,
    traits: []
};

export const Equipment = {
    hpBoost1: { id: 'hpBoost1', name: 'Vitality Seal 1', description: '+10% Max HP', cost: 125, traits: [{ type: 'hp_bonus_percent', formula: '0.1' }] },
    hpBoost2: { id: 'hpBoost2', name: 'Vitality Seal 2', description: '+20% Max HP', cost: 400, traits: [{ type: 'hp_bonus_percent', formula: '0.2' }] },
    hpBoost3: { id: 'hpBoost3', name: 'Vitality Seal 3', description: '+30% Max HP', cost: 2800, traits: [{ type: 'hp_bonus_percent', formula: '0.3' }] },
    expBoost1: { id: 'expBoost1', name: 'Golden Egg', description: 'earn 10% more XP from battles', cost: 15000, traits: [{ type: 'xp_bonus_percent', formula: '0.5' }] },
    rabbitsFoot: { id: 'rabbitsFoot', name: "Rabbit's Foot", description: 'greatly improves Critical Hit chance', cost: 250, traits: [{ type: 'crit_bonus_percent', formula: '0.15' }] },
    strawDoll: { id: 'strawDoll', name: 'Straw Doll', description: 'can survive a fatal blow once per battle', cost: 2500, traits: [{ type: 'survive_ko', formula: '1' }] },
    angelCurio: { id: 'angelCurio', name: 'Angel Curio', description: 'Breaks to revive unit with 100% HP upon death', cost: 5000, traits: [{ type: 'revive_on_ko', formula: '1', chance: 1 }] },
    charmMagic: { id: 'charmMagic', name: 'Arcane Charm', description: '+1 Power', cost: 120, traits: [{ type: 'power_bonus', formula: '1' }] },
    holySwordGram: { id: 'holySwordGram', name: 'Holy Sword Gram', description: '+3 Power, user becomes ⚪ elemental', cost: 1500, traits: [{ type: 'power_bonus', formula: '3' }, { type: 'element_change', element: 'W' }] },
    darkScepterLucille: { id: 'darkScepterLucille', name: 'Dark Scepter Lucille', description: '+3 Power, user becomes ⚫ elemental', cost: 1500, traits: [{ type: 'power_bonus', formula: '3' }, { type: 'element_change', element: 'K' }] },
    marsEmblem: { id: 'marsEmblem', name: 'Mars Emblem', description: '+3 Power, user becomes 🔴 elemental', cost: 1500, traits: [{ type: 'power_bonus', formula: '3' }, { type: 'element_change', element: 'R' }] },
    mercuryCrest: { id: 'mercuryCrest', name: 'Mercury Crest', description: 'restores 1HP every turn, user becomes 🔵 elemental', cost: 1500, traits: [{ type: 'hp_regen', formula: '1' }, { type: 'element_change', element: 'B' }] },
    hermesBoots: { id: 'hermesBoots', name: "Hermes' Boots", description: 'all actions gain Speed +2, user becomes 🟢 elemental', cost: 1500, traits: [{ type: 'speed_bonus', formula: '2' }, { type: 'element_change', element: 'G' }] }
};
