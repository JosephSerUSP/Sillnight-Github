export const Events = {
    // Defines the data for various in-game events.
    shop: {
        // Defines the stock for the shop.
        stock: {
            // Number of items to pick from the pools.
            count: { items: 2, equipment: 1 },
            // Pools of items that can appear in the shop.
            // In the future, we could have different pools for different floors.
            pools: {
                items: ['potion', 'antidote', 'phoenixdown'],
                equipment: ['hpBoost1', 'charmMagic', 'rabbitsFoot', 'strawDoll']
            }
        }
    },
    treasure: {
        // Defines the gold amount for treasure chests.
        gold: {
            // base amount + (a random value between 0 and random) + (perFloor * floor)
            base: 0,
            random: 50,
            perFloor: 20
        }
    }
};
