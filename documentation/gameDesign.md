# Game Design Document

**NOTE: This document dictates the intended design and behavior of the game moving forward. It serves as the specification for future development. Where the current codebase differs from this document, the codebase should eventually be refactored to match this design.**

---

## 1. Core Philosophies

*   **Flexibility:** The engine must support novel effects and traits without hardcoding. Designers should be able to script new behaviors via data.
*   **Tactical Turn Order:** Turn order is dynamic and primarily determined by the *Actions* chosen, not just the unit's base stats.

---

## 2. Effects & Traits

### Effects
Directly affect battlers (HP, States, Parameters, etc.).
*   `learnAction`: Teaches an action to a creature.
*   `learnPassive`: Teaches a passive to a creature.
*   `elementAdd`: Adds a new element to the battler.
*   `elementChange`: Changes all elements of this battler to the target element.
*   **Goal:** Effects must be composable. Example: `changeMaxActions` should be possible via a generic effect system even if not explicitly hardcoded.

### Traits
Static modifiers on Equipment, Passives, and States.
*   `hit_bonus`: Flat bonus to hit chance (0 = +0%, 10 = +10%).
*   `evade_chance`: Chance to evade physical attacks.
*   `crit_bonus_percent`: Chance to inflict critical hits (Default 0.05).
*   `element_change`: Changes the battler's elemental affinity.
*   `PARAM_PLUS`: Additive bonus to parameters (e.g., +10 ATK).
*   `PARAM_RATE`: Multiplicative bonus to parameters (e.g., x1.2 DEF).
*   `trigger`: Traits can execute Effects on triggers (e.g., `onBattleEnd`, `onTurnStart`).

**Dynamic Descriptions:**
Both Effects and Traits must generate description strings automatically.
*   *Example:* A "Mythril Sword" description ("Legendary ore...") automatically appends "Increases ATK by 5" based on its traits.

---

## 3. Data Structures

### Trait Objects
All trait objects (Passives, Equipment, States, Battlers) share:
*   `condition`: A logic check required for traits to be active.

#### 1. Passives
Innate or learned traits. Subject `a` and `b` are the same.

#### 2. Equipment
Items equipped to creatures.
*   `price`: Shop cost.

#### 3. States
Temporary modifiers.
*   **Expiry:** Must be flexible (turns, steps, triggers).

#### 4. Battlers (Allies & Enemies)
The core units.
*   **Core Parameters:**
    *   `mhp` (Max HP)
    *   `mmp` (Max MP)
    *   `atk` (Attack Power - Physical)
    *   `def` (Defense - Physical)
    *   `mat` (Magic Attack)
    *   `mdf` (Magic Defense)
    *   `agi` (Agility - Base speed, influences evasion/turn ties)
    *   `luk` (Luck - State rates, critical avoidance)
*   **Derived Stats:**
    *   `level`, `exp`
    *   `ele` (Elements)

---

## 4. Action System

### Action Properties
Actions (Skills & Items) are the core of combat.
*   `asp` (**Action Speed**): The **primary** determinant of turn order. Fast attacks (high ASP) go before slow powerful ones (low ASP), regardless of the user's base Agility.
*   `ele` (Element): Damage multiplier (1.25x for same-element match).
*   `cnd` (Condition): Requirements (e.g., "Front Row", "HP < 50%").
*   `stat`: The offensive parameter used (`atk` or `mat`).

### Types
1.  **Skills:** Used by creatures. Default cost: None/MP.
2.  **Spells:** Used by PC (Summoner). Default cost: MP.
3.  **Items:** Used by PC. Default cost: Consumable.

### Complex Action Examples (Design Goals)
*   **Potion Rain:**
    *   *Condition:* Inventory has healing item.
    *   *Cost:* Consumes item.
    *   *Effect:* Apply item effect to ALL party members (75% efficacy).

### Complex Trait Examples
*   **Mug:**
    *   *Trigger:* On dealing damage.
    *   *Effect:* Gain gold equal to damage dealt.

---

## 5. The Summoner (Player Character)

*   **Role:** The anchor. If the Summoner dies, the run might be over or compromised.
*   **MP as Oxygen:**
    *   Moving in the dungeon drains MP.
    *   MP = 0 leads to "suffocation" (stat penalties, HP loss).
*   **Combat:**
    *   Acts *outside* the regular turn flow (Instant or End of Round).
    *   Commands: Use Item, Formation, Spell, Flee.
    *   **Flee:** Infinite attempts, costs money/MP, chance increases per attempt.
    *   **Targeting:** Enemies target Summoner only if all creatures are down/shielding.
