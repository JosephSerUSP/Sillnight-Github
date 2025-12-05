# Refactor Changes

## Phase 1: Decoupling and Infrastructure
* **New System Classes:**
    * `src/game/systems/BattleRenderSystem.js`: Encapsulates 3D battle rendering logic (formerly `Systems.Battle3D`).
    * `src/game/systems/EventSystem.js`: Handles event logic and `Game_Interpreter` wrapping (formerly part of `Systems.Events`).
* **Systems Aggregator:**
    * Updated `src/game/systems.js` to import and instantiate these new classes, maintaining the `Systems` global object for backward compatibility but removing the monolithic object literal implementation.

## Phase 2: UI Standardization
* **New Window Classes:**
    * `src/game/window/shop.js`: Implements `Window_Shop` inheriting from `Window_Selectable`.
    * `src/game/window/recruit.js`: Implements `Window_Recruit` inheriting from `Window_Selectable`.
* **Main Integration:**
    * Registered new windows in `src/game/main.js`.
* **Refactoring:**
    * Updated `Systems.Events.showShop` and `showRecruit` to use the new window instances (`window.Game.Windows.Shop.show()`) instead of manual DOM manipulation.

## Phase 3: Logic Consolidation
* **Trait Logic:**
    * Moved passive trigger logic from `Systems.Triggers` to `Game_Battler.js` and `Game_BattlerBase.js`.
    * Implemented `triggerTraits(eventName, ...args)` and `handleTrait` methods on `Game_Battler` to encapsulate behavior.
    * `Systems.Triggers.fire` now delegates to `Game_Battler.triggerTraits`.
* **Event Logic:**
    * Moved procedural generation logic (`generateShopStock`, `generateRecruitOffers`) to `EventSystem.js`.
    * Updated `Systems.Events` to call these methods on `Systems.Event`.

## Miscellaneous
* **Layout Manager:**
    * Added `addRaw` method to `LayoutManager` to support adding raw HTMLElements directly.
    * Fixed exports in `src/game/layout/index.js`.
* **Bug Fixes:**
    * Added null checks in `Window_Shop` to prevent crashes when looking up invalid item IDs.
    * Fixed circular dependency and invalid import in `src/game/systems/BattleRenderSystem.js` by removing the unused `Systems` import.
