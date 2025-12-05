# Engine Architecture Assessment and Refactoring Plan

## 1. Executive Summary

The current engine architecture utilizes a Hybrid Compositional pattern typical of RPG development: singleton Managers control flow (`BattleManager`), while object-oriented Classes represent entities (`Game_Battler`, `Game_Action`).

While functional, the architecture **severely violates the core design philosophy** outlined in `gameDesign.md`, specifically regarding the flexibility of Effects and Traits. The current implementation relies on hardcoded logic within core classes (`Game_Action.js`, `BattleManager.js`), making the addition of "Novel Effects" and "Novel Traits" (a primary requirement) impossible without modifying engine code.

## 2. Architectural Integrity

### Strengths
*   **Data-Driven Foundations:** The engine correctly separates data (`src/assets/data/`) from logic for the most part.
*   **Trait Aggregation:** The `traitObjects()` pattern in `Game_BattlerBase` effectively aggregates sources of stats (Species, Equipment, Passives).
*   **Hybrid Layout System:** The UI's use of `Window_Base` with `LayoutManagers` is a robust and flexible approach for DOM-based interfaces.

### Structural Flaws (Critical)
1.  **Rigid Effect Implementation (`Game_Action.js`):**
    *   The `apply()` method uses a hardcoded `switch` statement to handle effect types (`hp_damage`, `hp_heal`, `add_status`).
    *   Adding a new effect (e.g., "Drain MP") requires modifying the core `Game_Action` class.
    *   Damage formulas handle specific stats (`atk`, `def`) explicitly, limiting the creation of skills that might use novel stats (e.g., `luk` based attacks) without code changes.

2.  **Hardcoded Trait Logic (`Game_Battler.js`, `BattleManager.js`):**
    *   Traits like `survive_ko`, `revive_on_ko`, and `turn_heal` are hardcoded into `BattleManager` or `Game_Battler` logic using explicit `if` checks.
    *   This violates the "Open/Closed Principle" and makes adding complex traits (like "Mug") difficult and error-prone.

3.  **Monolithic BattleManager:**
    *   `BattleManager` acts as a "God Object," handling turn order, AI decision making, UI updates, Scene 3D control, and victory conditions.
    *   This coupling makes unit testing difficult and increases the risk of regressions when modifying battle flow.

### Minor Flaws
*   **Inconsistent Event Handling:** While an `Observer` exists, it is underutilized. Some events are fired via `Observer`, while others are direct method calls or hardcoded checks.
*   **UI/Logic Coupling in Managers:** `BattleManager` directly manipulates `window.Game.Windows.BattleLog` and `Systems.Battle3D`, making it hard to run battle logic in isolation (e.g., for headless testing).

## 3. Comparison with GameDesign.md

| Feature | Design Goal | Current Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Effects** | Flexible, support novel effects without hardcoding. | Hardcoded `switch` in `Game_Action`. | **FAIL** |
| **Traits** | Flexible, support novel traits without hardcoding. | Hardcoded checks in `BattleManager`/`Battler`. | **FAIL** |
| **Complex Actions** | e.g., "Mug" (Effect + Trait trigger). | Not supported generically. | **FAIL** |
| **Trait Objects** | Battlers inherit traits from Equip/Passives. | Implemented via `traitObjects()`. | **PASS** |
| **Summoner** | PC has unique actions/MP drain. | Basics exist, but implementation details are scattered. | **PARTIAL** |

## 4. Refactoring Plan

To achieve the "maximum flexibility and leanliness" requested, we must move from a **Hardcoded** architecture to a **Registry/Strategy** pattern.

### Phase 1: The Effect Registry (High Priority)
**Goal:** Remove `switch` statements from `Game_Action`.

1.  **Create `EffectSystem` (`src/game/systems/EffectSystem.js`):**
    *   Maintain a registry of effect handlers: `handlers = { 'hp_damage': fn, 'add_status': fn }`.
    *   Expose a method `register(type, handler)`.
    *   Expose a method `apply(effect, subject, target, context)`.
2.  **Refactor `Game_Action`:**
    *   Remove the `switch (effect.type)` block in `apply()`.
    *   Delegate execution to `EffectSystem.apply()`.
3.  **Benefit:** New effects can be added by simply registering a new handler function, even from external mods or data files.

### Phase 2: The Trait Event System (High Priority)
**Goal:** Remove hardcoded trait checks in `BattleManager` and `Game_Battler`.

1.  **Expand `Game_Battler.handleTrait`:**
    *   Instead of a switch statement for `onTurnStart`, `onUnitDeath`, etc., use a lookup strategy similar to Phase 1.
    *   Implement a `TraitTriggerSystem` that maps trigger names (`onDamage`, `onDeath`) to handler functions.
2.  **Standardize Triggers:**
    *   Ensure `BattleManager` fires events for *everything*: `onBeforeAction`, `onAfterAction`, `onDamageTaken`, `onHealingReceived`.
    *   Traits simply subscribe to these events via the battler's `triggerTraits` mechanism.
3.  **Complex Traits:**
    *   Implement "Mug" as a trait that listens to `onDamageDealt`. When fired, it executes an effect (Gain Gold).

### Phase 3: Battle Logic Separation (Medium Priority)
**Goal:** Slim down `BattleManager`.

1.  **Extract `BattleTurnManager`:**
    *   Move `processNextTurn`, queue management, and speed sorting to a dedicated class.
2.  **Extract `BattleAI`:**
    *   Move the logic for choosing actions (`temperament` checks, random selection) to `src/game/ai/BattleAI.js`.

## 5. Immediate Action Items (Next Steps)

1.  **Implement Phase 1:** Create `EffectSystem` and refactor `Game_Action.js`.
2.  **Implement Phase 2:** Refactor `Game_Battler.handleTrait` to use a dynamic lookup.
