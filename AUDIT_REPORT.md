# Documentation Audit Report

## Inconsistencies & Drift

### 1. Missing Core Stats
*   **Documentation:** `gameDesign.md` lists `mxa` (Max Actions), `mxp` (Max Passives), and `mpd` (MP Drain) as core stats.
*   **Code:** `Game_BattlerBase.js` only initializes `_paramPlus` for the standard 8 stats (0-7). `Game_Actor.js` and `Game_Enemy.js` calculate `paramBase` only for these standard stats (0-7).
*   **Impact:** The code does not support the "MP as Oxygen" mechanics or configurable action limits described in the design document.

### 2. Turn Order Logic
*   **Documentation:** `gameDesign.md` states turn order is primarily determined by `asp` (Action Speed) of the selected action, with unit speed as a tiebreaker.
*   **Code:** `BattleManager.js` (`nextRound`) sorts strictly by unit speed (`b.speed - a.speed`) before actions are even selected.
*   **Impact:** Fast attacks (like Dagger Slash) do not currently act before slow attacks (like Hammer Smash) as intended.

### 3. Element Effectiveness
*   **Documentation:** `gameDesign.md` specifies a simple multiplier: 1.25x for Weakness, 0.75x for Resistance.
*   **Code:** `Game_Action.js` (`calcElementRate`) implements a hardcoded cyclic relationship (G>B>R>G, W<>K).
*   **Impact:** The documented design is generic, while the code is specific and potentially rigid.

### 4. Trait Implementation
*   **Documentation:** `gameDesign.md` lists traits like `hit`, `eva`, `cri`, `eleAdd`, etc.
*   **Code:** `Game_Battler.js` implements getters for `hit`, `eva`, `cri` which call `traitsSum` with specific strings ('hit_bonus', 'evade_chance', 'crit_bonus_percent').
*   **Drift:** The internal implementation matches the spirit, but the naming conventions differ slightly from the high-level design doc (e.g., `evade_chance` vs `eva`).
*   **Observation:** `Game_BattlerBase.js` has `param()` for 0-7. `hit`, `eva`, `cri` are separate properties in `Game_Battler`, not indexed parameters.

### 5. Deprecations & Legacy Code
*   **`BattleManager.js`:** Contains a deprecated fallback for case-insensitive ID lookups (`@deprecated: Fallback for Legacy case-insensitive search`).
*   **`Game_Action.js`:** Uses `eval()` for damage formulas. While common in this genre, it's a security/stability risk that should ideally be flagged or sandboxed.

## Proposed Updates

### Update `gameDesign.md`
Mark "MP as Oxygen" and "Action Speed Turn Order" as **Not Implemented / Planned** to reflect reality.

### Update `BattleManager` Documentation
Clarify that it currently acts as a hybrid controller and sorts by unit speed.

### Cleanup `Game_BattlerBase` JSDoc
Ensure param ID lists match the actual supported range (0-7).
