# Drift Report

This document records discrepancies between the intended design (`gameDesign.md`, `ARCHITECTURE.md`, `REFACTOR_PLAN.md`) and the actual codebase state.

## Discrepancies Found

### 1. Missing Audio Service
*   **Design:** `REFACTOR_PLAN.md` states that `AudioService` is registered in `Game.Services` and `AudioManager` listens to events. Memory indicated `src/game/services/AudioService.js` existed.
*   **Actual:** `src/game/services/` directory did not exist. `AudioService` was not found in the codebase. `Game.init` did not register it.
*   **Resolution:** `AudioService` framework is being implemented and registered during maintenance.

### 2. Config.js Missing Audio Settings
*   **Design:** Memory indicated `Config.js` contained `Audio` settings (MasterVolume, BgmVolume, SfxVolume).
*   **Actual:** `src/game/Config.js` contained only `Resolution`, `Debug`, `Battle`, and `Rewards`.
*   **Resolution:** `Audio` settings are being added to `Config.js`.

### 3. Dynamic Tooltips Not Implemented
*   **Design:** `REFACTOR_PLAN.md` claims a feature "Dynamic Tooltips" where the registry generates descriptions based on actual effects.
*   **Actual:** `Window_CreatureModal` and `Window_Inventory` rely on static `description` strings from data definitions.
*   **Resolution:** Marked as a future feature; documentation updated to reflect current state.

### 4. Legacy/Missing Directories
*   **Design:** Documentation implies a cleaner structure.
*   **Actual:** `reference_implementation/` exists (containing old engine). `documentation/DRIFT_REPORT.md` itself was missing.
*   **Resolution:** `DRIFT_REPORT.md` restored.
