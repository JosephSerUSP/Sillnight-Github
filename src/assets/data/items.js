export const Equipment = {
    hpBoost1: { id: 'hp_boost1', name: 'Vitality Seal 1', description: '+10% Max HP', hpBonus: 0.1, cost: 125 },
    hpBoost2: { id: 'hp_boost2', name: 'Vitality Seal 2', description: '+20% Max HP', hpBonus: 0.2, cost: 400 },
    hpBoost3: { id: 'hp_boost3', name: 'Vitality Seal 3', description: '+30% Max HP', hpBonus: 0.3, cost: 2800 },
    expBoost1: { id: 'exp_boost', name: 'Golden Egg', description: 'earn 10% more XP from battles', xpBonus: 0.5, cost: 15000 },
    rabbitsFoot: { id: 'rabbits_foot', name: "Rabbit's Foot", description: 'greatly improves Critical Hit chance', critBonus: 0.15, cost: 250 },
    strawDoll: { id: 'straw_doll', name: 'Straw Doll', description: 'can survive a fatal blow once per battle', surviveKO:1, cost: 2500 },
    angelCurio: { id: 'angel_curio', name: 'Angel Curio', description: 'Breaks to revive unit with 100% HP upon death', reviveOnKO: true, cost: 5000 },
    charmMagic: { id: 'charm_magic', name: 'Arcane Charm', description: '+1 Power', powerBonus: 1, cost: 120 },
    holySwordGram: { id: 'holy_sword_gram', name: 'Holy Sword Gram', description: '+3 Power, user becomes ⚪ elemental', powerBonus: 3, elementChange: 'W', cost: 1500 },
    darkScepterLucille: { id: 'dark_scepter_lucille', name: 'Dark Scepter Lucille', description: '+3 Power, user becomes ⚫ elemental', powerBonus: 3, elementChange: 'K', cost: 1500 },
    marsEmblem: { id: 'mars_emblem', name: 'Mars Emblem', description: '+3 Power, user becomes 🔴 elemental', powerBonus: 3, elementChange: 'R', cost: 1500 },
    mercuryCrest: { id: 'mercury_crest', name: 'Mercury Crest', description: 'restores 1HP every turn, user becomes 🔵 elemental', elementChange: 'B', hpRegen: 1, cost: 1500 },
    hermesBoots: { id: 'hermes_boots', name: "Hermes' Boots", description: 'all actions gain Speed +2, user becomes 🟢 elemental', speedBonus: 2, elementChange: 'G', cost: 1500 }
};

export const Items = {
    potionSmall: { id: 'potion_small', name: 'Small Potion', description: 'Heals 30% HP', healRatio: 0.3, cost: 30 },
    lifeIncense: { id: 'life_incense', name: 'Life Incense', description: 'Raises MaxHP by 2.', increase:[ 'maxHp', 2 ], cost: 200 },
    wisdomIncense: { id: 'wisdom_incense', name: 'Wisdom Incense', description: 'Raises Level by 1.', increase:[ 'level', 1], cost: 2500 },
    reviveLeaf: { id: 'revive_leaf', name: 'Revive Leaf', description: 'Revives to 50% HP', reviveHpRatio: 0.5, cost: 200 }
};
