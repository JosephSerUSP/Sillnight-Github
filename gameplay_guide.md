# Gameplay Expansion Guide: A SaGa for the Abyss

## 1. Introduction: The Guiding Philosophy

This guide outlines a vision for the game's future, drawing inspiration from classics like *SaGa*, *Shin Megami Tensei*, *Dungeon Encounters*, and *Diablo*. The core philosophy is to create a gameplay loop that is:

*   **Deep & Systemic:** Focus on intricate, interconnected systems that players can slowly master.
*   **Player-Driven:** Emphasize non-linear progression and organic character growth that reacts to player actions.
*   **Highly Strategic:** Make combat a series of interesting puzzles where preparation and clever tactics are paramount.
*   **Infinitely Replayable:** Use procedural generation and emergent gameplay to ensure no two runs are the same.

The existing foundation is strong. We have distinct exploration and battle modes, a roster of unique creatures, and systems for skills, equipment, and passives. Let's expand on these to create something truly special.

---

## 2. Core Systems Expansion: Beyond Levels and Stats

The heart of a SaGa-like experience is its unconventional character progression. Players should feel that their characters are growing as a direct result of their actions, not just by grinding XP.

### A. The "Spark" System: Organic Skill Learning (SaGa-inspired)

Instead of creatures having a fixed `acts` list, they should have the ability to "Spark" (or "Glimmer") new skills in the heat of battle.

*   **How it Works:**
    1.  A creature has a pool of basic actions (e.g., `attack`).
    2.  When using an action, there is a small chance they will suddenly learn and use a new, related skill. For example, using `attack` might Spark a more powerful `anvil` or a multi-hit `windBlades`.
    3.  The chance to Spark a new skill is higher when fighting more powerful enemies.
*   **Implementation:**
    *   Modify the `Creatures` data structure to include a `sparkable_skills` list, mapping basic actions to potential new ones.
    *   During the battle logic, after a skill is selected but before it executes, run a check against a "Spark Chance" formula. If successful, replace the action for that turn and permanently add the new skill to the creature's `acts` list.

### B. "Press Turn" Combat: Rewarding Weaknesses (SMT-inspired)

The current elemental system (`elements` array) is perfect for a more dynamic and strategic combat system.

*   **How it Works:**
    1.  At the start of the player's turn, the party gets a number of action icons equal to the number of active party members.
    2.  Using an action consumes one icon.
    3.  **Crucially:** If an action strikes an enemy's elemental weakness, it only consumes *half* an icon (represented as a flashing icon), effectively granting an extra action.
    4.  If an action is nullified, resisted, or misses, it consumes *all remaining* action icons, ending the turn prematurely.
*   **Implementation:**
    *   The `BattleManager` needs a new turn-tracking mechanic for "Press Turn" icons.
    *   The skill execution logic must return a result (e.g., `NORMAL`, `WEAKNESS`, `RESIST`, `MISS`) that the `BattleManager` uses to determine how many icons to consume.
    *   This makes combat a thrilling puzzle of managing your turns to maximize actions.

### C. Creature Negotiation & Fusion (SMT-inspired)

Your rich roster of creatures is begging for a deeper acquisition system.

*   **Negotiation:**
    *   Instead of just fighting, allow players to talk to enemies.
    *   This could be a new battle command that initiates a dialogue. Based on the creature's `temperament` ('kind', 'selfish', 'ruthless'), they will ask for items, HP, or money.
    *   Success recruits the creature to your roster. Failure might enrage them or cause them to flee.
*   **Fusion:**
    *   Implement a "Fusion Chamber" in a central hub (see Section 3).
    *   Allow players to combine two creatures. The result inherits skills, passives, and potentially stats from its "parents."
    *   Use the `race` property to create fusion rules (e.g., Fey + Undead = Eldritch). This creates a deep meta-game of collecting and breeding the perfect team.

---

## 3. World & Exploration: The Living Labyrinth

Exploration should be as compelling and dangerous as combat. Let's take cues from *Dungeon Encounters* and roguelikes.

### A. The Grid as the World (Dungeon Encounters-inspired)

Make the dungeon grid the central mechanic of exploration. Don't just treat it as empty space to traverse.

*   **Numbered Events:** Populate the map grid with hexadecimal numbers. Each number corresponds to a specific event, encounter, or piece of lore.
    *   `0A`: A fixed combat encounter.
    *   `1B`: An NPC with a quest or a cryptic clue.
    *   `3F`: A hidden item.
    *   `FF`: A powerful, optional boss.
*   **Ability Stations:** Introduce special tiles that grant new exploration abilities, such as revealing nearby numbers, teleporting between explored tiles, or restoring party resources.
*   **Procedural Generation:** Use the existing `dungeon.js` and `maps.js` to create procedurally generated floors. This ensures infinite replayability, in the style of *Diablo* and *Azure Dreams*.

### B. A Central Hub (Azure Dreams-inspired)

Give the player a persistent home base to return to between dungeon runs.

*   **The Sanctuary:** A small, safe area that can be upgraded.
*   **Facilities:** Players can spend resources gathered in the dungeon to build new facilities:
    *   **Fusion Chamber:** For creature fusion.
    *   **Blacksmith:** For crafting and upgrading equipment (see Section 4).
    *   **Archive:** To review discovered lore and creature data.
    *   **Tavern:** To manage the party and recruit new, basic creature types.

---

## 4. Itemization & Crafting: The Spoils of War

Loot is a powerful motivator. Let's make equipment more exciting and customizable.

### A. Meaningful Loot (Diablo-inspired)

Expand the `Equipment` system to be more dynamic.

*   **Rarity Tiers:** Introduce item rarity (Common, Magic, Rare, Legendary). Higher rarity items should have more, and more powerful, `traits`.
*   **Unique Traits:** Create Legendary items with truly game-changing effects that can define a character's build.
    *   *Ex: "Dark Scepter Lucille" could have a new trait: "All ⚫ elemental skills now drain HP."*
    *   *Ex: "Hermes' Boots" could grant a trait: "The first action performed each turn costs 0 AP."*

### B. The Workshop (Star Ocean/Legend of Mana-inspired)

Implement a deep crafting system at the Sanctuary.

*   **Material Drops:** Have enemies drop crafting materials in addition to XP.
*   **Tempering:** Allow players to combine equipment. For example, sacrifice a "Vitality Seal 1" to transfer its `hp_bonus_percent` trait onto a "Holy Sword Gram." This gives players ultimate control over their gear.
*   **Item Creation:** Discover recipes within the dungeon to craft entirely new pieces of equipment that can't be found otherwise.

---

## 5. A Sample Gameplay Loop

So, how does this all come together?

1.  **Prepare:** The player starts at the **Sanctuary**. They review their party, fuse a Pixie and a Goblin to create a new creature, and use the Workshop to add a `crit_bonus_percent` trait to their main damage dealer's weapon.
2.  **Explore:** They enter the procedurally generated dungeon. They move carefully across the grid, avoiding a known difficult encounter (`0E`) to first reach an ability station (`2C`) that reveals a portion of the map.
3.  **Combat:** They run into an encounter. The enemy group has a Golem, which is weak to 🔴. Their creature with "Mars Emblem" strikes the Golem's weakness, gaining an extra action via the **Press Turn** system. They use this extra action to heal. During the fight, their Angel uses `cure` so often that it suddenly **Sparks** a new, more powerful healing spell: `triage`.
4.  **Discover:** After the battle, they land on a lore tile (`1F`) that reveals a fragment of the world's history. They find a rare new sword with a unique trait.
5.  **Return:** Their inventory is full and their resources are low. They use a town portal item to return to the **Sanctuary**. They use their new materials to upgrade the Workshop, check their new creature's stats, and prepare for the next delve into the abyss.

This loop combines deep strategy, meaningful progression, and the thrill of discovery, creating a truly compelling and expansive gameplay experience.
