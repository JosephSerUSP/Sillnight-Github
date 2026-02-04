# Architectural Drift Report

This document records identified discrepancies between the codebase and the design specifications, as well as significant refactors undertaken to resolve them.

## Maintenance - [Current Date]

### 1. Audio System Integration
*   **Discrepancy:** `AudioService` was referenced in `ARCHITECTURE.md` and `Config.js` but was missing from the codebase.
*   **Resolution:** Implemented `src/game/services/AudioService.js` using the HTML5 `Audio` API. Updated `Config.js` to include audio volume settings. Registered the service in `src/game/main.js`.

### 2. Element System Logic
*   **Discrepancy:** `Game_Action.calcElementRate` used a hardcoded legacy map for element strengths/weaknesses (`@legacy` tag), violating the data-driven design principle requiring `ELEMENT_RATE` traits.
*   **Resolution:**
    *   Refactored `Game_Action.calcElementRate` to use `TraitRegistry.traitsPi(target, 'ELEMENT_RATE', actionElement)`.
    *   Updated `CreatureRegistry` to automatically inject `ELEMENT_RATE` traits into creature definitions based on their `elements` array, preserving the intended strength/weakness logic (Resistance: 0.75, Weakness: 1.25) while enabling future overrides via custom traits.

### 3. UI Component Gaps
*   **Discrepancy:** `Window_Party` lacked the `setHelpText` implementation required by `Window_Selectable`.
*   **Resolution:** Added `setHelpText` to `Window_Party.js` and updated the `index.html` structure to include a footer element for displaying help text.
