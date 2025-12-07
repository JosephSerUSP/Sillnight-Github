# Deep Gameplay Analysis & Emergence Report

## 1. System Overview & Core Loops

The current gameplay loop relies on a traditional RPG structure (Explore -> Random Encounter -> Battle -> Loot/XP -> Upgrade). However, several underlying mechanics offer room for significant depth and emergent complexity that are currently underutilized or implicitly defined.

### 1.1 Combat Architecture
*   **Turn System:** Agility-based, interleaved turns (not Phase-based).
*   **Action Economy:** 1 Action per turn. Speed determines frequency/order.
*   **Damage Model:** `(Base + Power) * Element * Crit * Guard`.
*   **Elements:** 5-cycle (G, B, R, W, K) with double-dip scaling for multi-element units.
*   **Progression:** XP (Level Up -> Stats) + Gold (Equipment/Units).

## 2. Emergent Depth Opportunities

### 2.1 The "Element Stacking" Mechanic
**Discovery:** The code (`Game_Action.calcElementRate`) iterates through *all* elements a target possesses. If a target has `['G', 'G']` (Double Green), a Red attack (Strong vs Green) applies the 1.25x multiplier *twice*, resulting in `1.56x` damage. Conversely, a Green attack (Resist) applies 0.75x twice (`0.56x`).
**Implication:** This creates a hidden "Tiered Weakness" system.
**Recommendation:** Explicitly expose "Pure" or "Dual" types (e.g., "High Fey" = Double Green) to reward elemental mastery. Allow equipment to *add* an element rather than just *replace* it, enabling "Risk/Reward" builds (e.g., Wear 'Leaf Cloak' to gain Green resist, but become doubly weak to Fire).

### 2.2 Row-Based Formation (The "Lost" Mechanic)
**Discovery:** `creatures.js` defines `acts` as `[[FrontRowActs], [BackRowActs]]`. However, `BattleManager.js` currently merges these into a single list: `[...unit.acts[0], ...unit.acts[1]]`.
**Implication:** The data supports a position-matters system (e.g., Golems only blocking in front, throwing rocks from back), but the engine ignores it.
**Recommendation:**
1.  **Enforce Row Logic:** In `processNextTurn`, check `unit.slotIndex`. If `< 3`, use `acts[0]`. If `>= 3`, use `acts[1]`.
2.  **Tactical Movement:** Allow the "Move" command to shift units between rows during battle. A player could move a fragile caster to the back to unlock their powerful "Back Row Only" spells, or move a tank to the front to unlock "Guard".

### 2.3 The "Interrupt" Meta
**Discovery:** The `BattleManager` allows a player to "Request Turn" (`SPACE` key) which pauses the auto-battle loop *after* the current action.
**Implication:** This is currently a reactive "Emergency Brake". It can be evolved into a "Combo Breaker" mechanic.
**Recommendation:**
*   **Telegraphing:** Visually indicate who moves next. If a Boss is charging a "Super Move" (via a State or visual cue), the player must Interrupt and Defend or Stun.
*   **Active Time Events:** Give a bonus for interrupting at the *perfect* moment (e.g., just before an enemy attacks).

### 2.4 Traits & Build Diversity
**Discovery:** `Game_Actor` correctly aggregates traits from Species + Passives + Equipment. `Game_Enemy` uses Species + Passives.
**Implication:** The infrastructure for complex builds exists.
**Recommendation:**
*   **Synergy Traits:** Create traits that trigger off specific conditions.
    *   *Examples:* "Adrenaline" (Speed +50% when HP < 30%), "Conductive" (When hit by Thunder, cast Thunder on self), "Blood Pact" (Spells cost HP instead of MP).
*   **Artifacts as Global Passives:** The memory mentioned artifacts but `artifacts.js` was missing. Implementing "Party-Wide Artifacts" (e.g., "All allies gain +10% XP but take +10% Dmg") adds strategic layers to exploration.

## 3. Scenario Simulation

### Scenario A: The "Phalanx" Strategy
*   **Setup:** 3 Golems in Front Row (Guard focus), 3 Archers/Mages in Back Row.
*   **Current State:** Not possible because `BattleManager` ignores row logic. Golems might attack randomly.
*   **With Refactor:** Golems strictly use `acts[0]` (Guard/Ram), creating a wall. Mages use `acts[1]` (Nuke). The player *must* use "Row Attack" skills or "Piercing" attacks to break the formation.

### Scenario B: The "Elemental Glass Cannon"
*   **Setup:** Player equips "Mercury Crest" (Blue Element) on a Shiva (Innate Blue).
*   **Result:** Unit is effectively "Double Blue".
*   **Trade-off:** Takes 0.56x damage from Ice (Immune-ish) but takes 1.56x damage from Fire.
*   **Strategy:** Great for "Ice Dungeon", suicide in "Fire Dungeon". This encourages loadout swapping per zone.

### Scenario C: The "Interrupt" Healer
*   **Context:** Boss casts "Apocalypse" (Slow cast, Speed -2).
*   **Meta:** Player sees Boss turn is coming up last.
*   **Action:** Player hits `SPACE`. Wait for Boss to *start* animation? No, turns are discrete.
*   **Refined Meta:** Player sees Boss is "Charging" (State). Player interrupts, swaps in a Tank or casts "Mass Barrier", then resumes auto-battle.

## 4. Balancing & Code Health

### 4.1 Damage Formula
*   Current: `(Power + Bonus) * Multipliers`.
*   Issue: Flat scaling (`a.level * 2`) falls off or becomes overpowered depending on the curve.
*   **Fix:** Introduce `a.mat` (Magic Attack) and `a.atk` (Phys Attack) stats distinct from general "Power". Currently, `power` lumps them together.

### 4.2 Missing Components
*   **CampaignManager:** Referenced in documentation/memory but absent from the codebase. Progression logic seems currently hardcoded or missing.
*   **Artifacts:** `src/assets/data/artifacts.js` is missing, despite being referenced. Re-implementing this would add significant depth (global passives).

### 4.3 Code Refactoring Targets
1.  **`BattleManager.processNextTurn`:** Split logic for `acts[0]` vs `acts[1]` based on `slotIndex`.
2.  **`Game_BattlerBase`:** Explicitly define `addState` logic (currently relies partly on string checks in `Game_Action`).
3.  **`Game_Action`:** Centralize "Guard" check. Currently, it checks for a state named 'guarding' but the system uses IDs. Unify to use State IDs (e.g., Guard = State 2).

## 5. Conclusion
The engine is robust but plays it safe. By "turning on" the dormant Row Logic and leaning into the "Element Stacking" math, the game gains significant tactical depth without writing new assets. The "Interrupt" system is the unique hook—shifting it from a UI convenience to a core gameplay mechanic (Active Time Strategy) would define the game's identity.
