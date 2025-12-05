# Architecture Assessment & Radical Rewrite Proposal

## 1. Executive Summary

The current engine utilizes a **Hybrid Compositional** architecture for its UI (Windows/Scenes) which is robust and effective. However, the **Battle System** (`BattleManager`, `Game_Action`, `Game_Battler`) suffers from significant structural flaws that hinder the scalability and flexibility outlined in `documentation/gameDesign.md`.

The core issue is the **tight coupling between Game Logic and Visual Presentation**. Currently, the game state is mutated *inside* animation callbacks, meaning the game cannot run without the 3D renderer, and mechanics are hardcoded into procedural switch-statements rather than being data-driven.

This proposal outlines a radical rewrite to decouple the **Battle Model** (Logic) from the **Battle View** (3D/UI), introducing a scalable **Effect/Trait System** and elevating `Game_Action` to a central command role.

---

## 2. Assessment of Current Architecture

### 2.1 Structural Integrity: C-
*   **UI/Scenes (A-):** The Window and Scene system is well-structured, following a proven inheritance pattern (`Scene_Base`, `Window_Selectable`) with good separation of concerns.
*   **Battle Logic (D):** The `BattleManager` is a monolithic singleton that mixes:
    *   **State Management:** (`queue`, `allies` arrays).
    *   **Flow Control:** (`nextRound`, `processNextTurn`).
    *   **View Orchestration:** (Direct calls to `Systems.Battle3D`).
    *   **Game Logic:** (Hardcoded effect application inside animation callbacks).
*   **Data/Entity (B):** `Game_BattlerBase` and `Game_Battler` are decent foundations, using a trait-based parameter system similar to modern RPG engines.

### 2.2 Critical Flaws
1.  **Visual-Dependent Logic (The "Animation Lock"):**
    *   *Current:* `Game_Action.apply()` calculates numbers, but the actual state change (HP reduction) happens in a callback passed to `Battle3D.playAnim`.
    *   *Consequence:* You cannot unit test battle logic without mocking the entire 3D rendering engine. AI cannot simulate future turns.
2.  **Rigid Effect System:**
    *   *Current:* Effects are strings like `'hp_damage'` handled in a giant `switch` statement in `BattleManager`.
    *   *Consequence:* Adding a new effect (e.g., "Mug" or "Drain") requires modifying the core Manager. The `gameDesign.md` vision of "flexible, novel effects" is impossible.
3.  **Procedural Trait Handling:**
    *   *Current:* `Game_Battler.handleTrait` contains hardcoded logic for specific traits (e.g., `post_battle_heal`).
    *   *Consequence:* Traits are not data-driven.

### 2.3 Comparison to `gameDesign.md`
The design document calls for:
*   **Flexible Effects:** "I should be able to cover novel effects without hardcoding them."
*   **Dynamic Traits:** "Traits triggering Effects... e.g., Mug: Gains gold equal to damage dealt."
*   **Status:** *Not Implemented.* The current system is hardcoded and procedural.

---

## 3. Radical Rewrite Proposal

We will transition to a **Model-View-Controller (MVC)** inspired architecture for the battle system.

### 3.1 Core Principles
1.  **Logic First:** The battle result is calculated instantly and completely in the "Model" layer.
2.  **Event Driven View:** The "View" layer receives a recording of what happened and plays it back.
3.  **Command Pattern:** `Game_Action` becomes a self-contained Command that executes Effects.

### 3.2 New Class Structure

#### A. The Model (State & Logic)
*   **`Game_Battle` (New):**
    *   Replaces the static `BattleManager` state.
    *   Holds `allies`, `enemies`, `turnQueue`, `log`.
    *   Methods: `nextTurn()`, `evaluateAction(action)`.
    *   *Serializable:* Can be saved/loaded.
*   **`Game_Battler` (Refactor):**
    *   Removes `handleTrait` switch-cases.
    *   Adds `addTraitListener(trigger, callback)` or similar observer pattern.
*   **`Game_Action` (Rewrite):**
    *   **The Orchestrator.**
    *   Instead of returning `{target, value}`, it executes a pipeline:
        1.  `prepare()`: Validate costs, targets.
        2.  `execute()`: Run the `Effect` logic.
        3.  `finalize()`: Trigger post-action traits.
    *   Generates a **`BattleResult`** object.

#### B. The Effect System (The "Flexible" Goal)
*   **`Effect` (Base Class):**
    *   `apply(source, target, context)`
*   **`EffectRegistry`:**
    *   Maps keys (e.g., `'damage'`, `'heal'`, `'mug'`) to Effect Classes/Functions.
    *   Allows defining new effects in data files without touching engine code.

#### C. The View (Presentation)
*   **`BattleManager` (Controller):**
    *   Coordinates the `Game_Battle` (Model) and `Scene_Battle` (View).
    *   Loop:
        1.  Ask Model for next action.
        2.  Model calculates result (instantly).
        3.  Manager passes `BattleResult` to `Visualizer`.
        4.  Wait for `Visualizer` to finish.
        5.  Repeat.

### 3.3 Proposed `Game_Action` Architecture

```javascript
// Pseudo-code for the new Game_Action

class Game_Action {
    constructor(subject) {
        this.subject = subject;
        this.item = null;
        this.results = []; // Array of atomic events
    }

    execute() {
        const targets = this.makeTargets();

        // 1. Pre-Action Triggers (Start of cast)
        this.subject.trigger('beforeAction', this);

        targets.forEach(target => {
            // 2. Calculate Hit/Miss/Crit
            const hitResult = this.calculateHit(target);

            if (hitResult.isHit) {
                // 3. Apply all Effects defined in Item Data
                this.item.effects.forEach(effectData => {
                    const EffectClass = EffectRegistry.get(effectData.type);
                    const effect = new EffectClass(effectData, this.subject, target);

                    // The Effect calculates and applies changes to the Model IMMEDIATELY
                    // AND pushes a "Visual Event" to this.results
                    const event = effect.apply();
                    this.results.push(event);
                });
            } else {
                this.results.push({ type: 'miss', target: target.uid });
            }
        });

        // 4. Post-Action Triggers (Mug, Counter-Attack, etc.)
        this.subject.trigger('afterAction', this);

        return this.results;
    }
}
```

### 3.4 Data-Driven Trait System

Instead of hardcoding `case 'mug'`, we use a Listener system.

**Data Definition:**
```javascript
{
    code: 'trait_trigger',
    trigger: 'after_damage_dealt',
    effect: { type: 'gain_gold', amount: 'damage * 1' } // Dynamic Formula
}
```

**Engine Logic:**
When `Game_Battler` takes damage, it emits an event. The `TraitSystem` listens and executes the attached Effect.

---

## 4. Implementation Roadmap

### Phase 1: Decoupling (The "Action" Refactor)
1.  **Refactor `Game_Action.apply()`**: Move state mutation logic (HP changes) out of `BattleManager` and into `Game_Action`.
2.  **Create `BattleResult`**: `Game_Action` should return a comprehensive object describing *everything* that happened.
3.  **Update `BattleManager`**: Modify the loop to `action.apply()` -> `get result` -> `Systems.Battle3D.play(result)`.

### Phase 2: The Registry (The "Effect" Refactor)
1.  Create `src/game/registries/EffectRegistry.js`.
2.  Migrate hardcoded effects ('hp_damage', 'heal') into standalone modules.
3.  Update `Game_Action` to use the Registry.

### Phase 3: The Event System (The "Trait" Refactor)
1.  Implement an Event Emitter on `Game_Battler`.
2.  Wire Traits to listen to these events.

---

## 5. Conclusion
This rewrite addresses the "Visual Lock" flaw and aligns the engine with the modular, data-driven goals of `gameDesign.md`. By elevating `Game_Action` to a primary controller of logic, we enable complex, compound skills and traits without bloating the core loop.
