# Gameplay Expansion Guide: A Symphony of Systems

## 1. Introduction: A Philosophy of Depth, Not Bloat

This guide outlines a vision for the game's future based on a single core principle: creating deep, emergent gameplay by making existing systems interact in new and surprising ways. We will not add features for the sake of it. Instead, we will unlock the hidden potential within your current codebase—the unique `acts` structure, the creature `temperaments`, the `traits` on equipment—to create a truly "SaGa-like" experience where the whole is greater than the sum of its parts.

Our inspirations remain *SaGa*, *Valkyrie Profile*, *Shin Megami Tensei*, and *Legend of Mana*, but our focus is on how to achieve their *spirit* of systemic depth with the tools we already have.

---

## 2. Evolving Combat: The "Act Cadence" System

Your `creatures.js` defines creatures with two distinct `acts` arrays. Currently, this is used for front/back row selection. Let's evolve this into a core combat mechanic that creates a strategic rhythm, or "cadence," to every battle.

### The Proposal: Act Cadence

Instead of a simple row choice, the two `acts` arrays represent two combat stances: an **Initiating Stance** (the first array) and a **Follow-up Stance** (the second array).

1.  A creature can only use actions from their **Initiating Stance** by default.
2.  Using an Initiating action unlocks the **Follow-up Stance** for their next turn.
3.  Using a Follow-up action is powerful, but it locks the creature out of their Follow-up Stance, forcing them to use an Initiating action again on their next turn.

**Example: The Pixie**
*   `acts: [['attack'], ['cure']]`
*   **Turn 1:** Pixie can only use `attack`. She does so. Her Follow-up Stance (`['cure']`) is now unlocked.
*   **Turn 2:** Pixie can now use `cure`. She uses it, healing an ally. This was a Follow-up action, so her Follow-up Stance is now locked again.
*   **Turn 3:** Pixie must use `attack` again to re-enable her ability to `cure`.

### Justification:

This system instantly reframes every creature's design into a strategic puzzle. It leverages the *exact data structure* you've already built, giving it profound mechanical weight without adding a single new skill or stat.

*   **Creates Tactical Choice:** Do you use the Stargazer's powerful single-target `cosmicRay` now, knowing you'll have to use its weaker `gravityWell` next turn to set up again?
*   **Deepens Creature Design:** A creature like the Goblin (`acts: [['attack', 'wait'], ['guard']]`) becomes a high-risk character who can attack from his Initiating Stance, but must then spend a turn on `guard` to regain access to his primary attacks. This perfectly matches his "scuttling horror" description.
*   **Inspired by Valkyrie Profile:** This mirrors the combo-oriented systems of games like *Valkyrie Profile*, where the order of operations is everything. Planning your party's turn-by-turn "cadence" becomes the central challenge of combat.

---

## 3. Meaningful Exploration: A Living Dungeon

Your dungeon is a grid, and your creatures have `race` and `temperament` properties. Let's connect these to make exploration a game of observation and strategy, not just movement.

### The Proposal: Ecological Encounters

Remove random encounters. Instead, enemy groups are visible on the map, and their behavior is dictated by their properties. The dungeon becomes a dynamic ecosystem.

*   **Temperament as Behavior:**
    *   `kind` (Pixie, Angel): These creatures are neutral. They won't attack unless you initiate combat. You could potentially interact with them for buffs or information.
    *   `selfish` (Goblin, Joulart): These creatures will actively move towards visible treasure chests on the map and attempt to "claim" them before you can.
    *   `ruthless` (Shiva, Ifrit): These are aggressive hunters that will pursue the party once they are within a certain line of sight.
    *   `free` (Skeleton, Golem): These creatures have fixed patrol patterns, acting as environmental puzzles to navigate around.
*   **Race as Interaction:**
    *   `Fey` creatures might create magical barriers that block paths until they are defeated or appeased.
    *   `Undead` creatures might be invisible until you step on a "graveyard" tile, triggering an ambush.
    *   `Constructs` like the Golem could be dormant obstacles, only activating if you try to take an item they are "guarding."

### Justification:

This gives immediate, tangible gameplay purpose to the flavor text and data points you've already written.

*   **Reduces Grinding:** Players have more agency over when and how they engage in combat, making it feel less like a grind and more like a deliberate choice.
*   **Emergent Puzzles:** The interaction between different creature behaviors can create complex, unscripted challenges. What happens when a `ruthless` Shadow Servant chases you into the path of a `free` Skeleton patrol?
*   **Inspired by SMT & Azure Dreams:** This captures the feeling of navigating a dangerous world filled with active entities from *Shin Megami Tensei* and the risk/reward decisions of exploring the tower in *Azure Dreams*.

---

## 4. Synergistic Equipment: Traits as a Chemistry Set

Your `equipment.js` `traits` system is the perfect foundation for deep, build-defining customization. Let's make traits interact with each other and the world's elemental system.

### The Proposal: Trait Chemistry

Introduce mechanics where traits can combine or be modified, turning equipment into a strategic chemistry set.

1.  **Trait Synergy:** When two specific pieces of equipment are worn together, their traits combine to create a new, unlisted bonus effect. This encourages experimentation.
    *   **Example:** A creature is equipped with `rabbits_foot` (`crit_bonus_percent`) and `straw_doll` (`survive_ko`). This combination unlocks the "Desperate Strike" hidden trait: when the `survive_ko` effect is triggered, the creature's next attack is a guaranteed critical hit.
2.  **Elemental Infusion:** Instead of equipment having a fixed element change, make it a modifiable property. Creatures can drop "Elemental Essences" (e.g., a fiery Ifrit drops a "Mars Essence"). At a hub, you can use this essence to "infuse" a piece of equipment.
    *   **Example:** You have the `holy_sword_gram` (+3 Power, becomes ⚪). You infuse it with a Mars Essence. It now becomes the "Flaming Sword Gram" (+3 Power, becomes 🔴, and gains a new trait: `chance_to_burn`).

### Justification:

This transforms loot from a simple stat upgrade into a source of exciting, build-defining possibilities.

*   **Rewards Player Knowledge:** Discovering and documenting Trait Synergies becomes a core part of mastering the game, creating a rewarding loop for dedicated players.
*   **Meaningful Crafting:** Elemental Infusion provides a direct, logical link between the creatures you fight and the gear you can create, making monster hunting much more purposeful.
*   **Inspired by Legend of Mana:** This captures the spirit of *Legend of Mana*'s deep and esoteric crafting and material systems, where combining the right ingredients could yield incredible results.

By focusing on these three pillars, we can create an incredibly deep and replayable experience by building upon the strong, unique foundation you've already created.