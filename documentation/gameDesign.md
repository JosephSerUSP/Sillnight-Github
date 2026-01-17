# Game Design Document

**Status:** Prescriptive / North Star
**Description:** This document dictates the intended gameplay mechanics and rules for **Stillnight**. Where the current codebase diverges from this document, the code is considered "Work in Progress" or "Legacy" and should be refactored to match this design.

---

## 1. Core Concepts

### 1.1. The Summoner (Player Character)
The PC acts as the anchor for the party.
*   **MP as Oxygen:** The Summoner has **MMP** (Max MP) and current **MP**.
    *   **Exploration:** Every action (step taken, interaction) drains MP.
    *   **Drain (`mpd`):** Each summoned creature has an `mpd` stat. The Summoner loses MP equal to the sum of all active creatures' `mpd` every turn/step.
    *   **Penalty:** When MP hits 0, creatures gain penalties (damage reduction, failure rates) and eventually lose HP per step.
*   **Battle Role:**
    *   The Summoner does not act in the standard turn order.
    *   **End of Round Action:** After all units have acted, the Summoner can:
        *   **Use Item:** Consumable from inventory.
        *   **Cast Spell:** Specialized PC-only magic (costs MP).
        *   **Change Formation:** Move units between Active/Reserve.
        *   **Flee:** Attempt to escape (costs MP/Gold).
    *   **Targeting:** The Summoner is untargetable unless all creatures are downed or in reserve.

### 1.2. Battlers (Creatures & Enemies)
Units that fight in battle. They act autonomously based on user commands or AI.

#### Core Parameters
*   **`mhp` (Max HP):** Maximum health.
*   **`mpd` (MP Drain):** (Creatures only) Amount of Summoner MP consumed per action/step.
*   **`atk` (Attack):** Multiplier for physical output (Base 10 = 100%).
*   **`mat` (Magic):** Multiplier for magical output.
*   **`def` (Defense):** Multiplier for incoming physical damage.
*   **`mdf` (Resist):** Multiplier for incoming magical damage.
*   **`mxa` (Max Actions):** Maximum number of learnable Actions (default 4).
*   **`mxp` (Max Passives):** Maximum number of learnable Passives (default 2).
*   **`ele` (Elements):** Array of aligned elements (e.g., `['Fire', 'Fire']` = Double Fire).
    *   **Offense:** 1.25x damage for each matching element instance.
    *   **Defense:** 1.25x damage taken for Weakness, 0.75x for Resistance.
    *   **Cycle:** `G (Green) > B (Blue) > R (Red) > G`. `W (White) <> K (Black)` are mutually weak.

> **Implementation Gap:** Current codebase uses standard RPG stats (`agi`, `luk`) and lacks `mpd`/`mxa`/`mxp`. `Game_BattlerBase` needs refactoring to support these design-specific parameters.

---

## 2. Effect & Trait System

The game logic is built on **Effects** (Active changes) and **Traits** (Passive modifiers).

### 2.1. Effects
Direct changes applied by Actions.
*   **`learnAction`:** Teaches a specific action.
*   **`learnPassive`:** Teaches a passive trait.
*   **`elementAdd`:** Adds an element to alignment.
*   **`elementChange`:** Replaces all elements.
*   **Standard RPG Effects:** Damage HP, Heal HP, Add State, Remove State.
    *   *Note on Damage:* The engine evaluates the formula (e.g., `4 + 2 * a.lvl`) and then applies a **Stat Multiplier** `(User.atk / Target.def)` to the result.

### 2.2. Traits
Static modifiers found on Equipment, Passives, and States.
*   **`hit`:** Hit chance modifier (Default 0 = 100%).
*   **`eva`:** Evasion chance (Default 0 = 0%).
*   **`cri`:** Crit chance (Default 0 = 0%).
*   **`eleAdd` / `eleChg`:** Modify elemental alignment.
*   **`paramMod`:** Modify core stats (`atk`, `def`, etc.).
*   **`actionMod`:** Modify properties of actions (e.g., speed, cost).
*   **`trigger: effect`:** Execute an Effect on condition (e.g., "Heal 10% HP on Battle Win").

> **Tooltips:** Descriptions must be generated dynamically. A "Mythril Sword" description should automatically append "Increases ATK by 5" based on its traits.

---

## 3. Objects

### 3.1. Actions (Skills, Spells, Items)
The primary means of interaction in battle.
*   **Types:**
    *   **Skills:** Used by Creatures (Free/Cost varies).
    *   **Spells:** Used by Summoner (Cost MP).
    *   **Items:** Consumable (Consumed on use).
*   **Properties:**
    *   **`asp` (Action Speed):** The **primary determinant** of turn order.
        *   *Design Note:* Fast attacks (Dagger Slash) should act before slow attacks (Hammer Smash), regardless of who is using them.
    *   **`ele` (Element):** Elemental alignment of the attack.
    *   **`cnd` (Condition):** Prerequisite (e.g., "HP < 50%", "Front Row").

> **Implementation Gap:** Current `BattleManager` sorts by Unit Speed (`agi`). It needs to be refactored to sort by the selected Action's `asp` (with unit speed as a tiebreaker or secondary modifier).

### 3.2. Trait Objects
Entities that carry Traits.
1.  **Passives:** Innate or learned skills.
2.  **Equipment:** Items equipped to creatures.
    *   *Property:* `price` (Shop cost).
3.  **States:** Temporary buffs/debuffs.
    *   *Expiry:* Flexible (Turns, Time, Triggers).
4.  **Battlers:** The units themselves.

---

## 4. Example Mechanics

### Complex Action: "Potion Rain"
*   **Condition:** Inventory contains "Potion".
*   **Cost:** Consume 1 "Potion".
*   **Effect:** Restore HP (Potion value) to **All Allies**.
*   **Mod:** Effect * 0.75 per target.

### Complex Trait: "Mug"
*   **Trigger:** On Damage Dealt.
*   **Effect:** Gain Gold equal to damage dealt.
