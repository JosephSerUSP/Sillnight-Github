# Animation Pacing Analysis

## Issue Description
Battle animations, specifically long-duration effects like `Flare`, were observed to execute their game logic effects (e.g., damage application) significantly earlier than the visual climax of the animation. This created a disconnect where damage numbers appeared while the animation was just starting.

## Current Logic Analysis

The `BattleRenderSystem` orchestrates animations using a step-based sequence defined in `src/assets/data/data.js`. The pacing logic relies on the `effect` step, which:
1.  Triggers `EffekseerSystem.play()`.
2.  Waits for the animation to complete using `EffekseerSystem.exists(handle)`.
3.  Proceeds to the `apply` step only when `exists` returns `false`.

### The Failure Chain

Two distinct issues were identified contributing to the premature completion:

1.  **Race Condition (Resolved):**
    - The `exists()` check was originally performed synchronously immediately after `play()`.
    - In some frames, the Effekseer engine had not yet registered the new instance, causing `exists` to return `false` instantly.
    - **Fix:** Implemented `requestAnimationFrame` to delay the first check by one frame.

2.  **Handle Type Mismatch (Critical):**
    - `EffekseerSystem.play()` returns a JavaScript wrapper object (`EffekseerHandle`) containing the native WASM handle (integer) in a `.native` property.
    - `EffekseerSystem.exists()` passed this *object* directly to the underlying `context.exists()` function.
    - The underlying WASM binding expects a primitive integer. Receiving an object caused it to return `false` (invalid handle) immediately.
    - **Consequence:** The system believed the animation finished immediately after it started, thus proceeding to the `apply` step instantly.

## Alternative Approaches

While the fix involves correctly unwrapping the handle, other approaches for animation pacing were considered:

1.  **Explicit Duration (`wait` step):**
    - **Logic:** Manually define `duration: 3000` in the `effect` step in `data.js`.
    - **Pros:** Precise control over pacing regardless of visual rendering.
    - **Cons:** Rigid; requires manual tuning for every effect. If the visual asset changes, the data must be updated.

2.  **Event Triggers (Not supported by current wrapper):**
    - **Logic:** Have the Effekseer effect emit a "Trigger" event at a specific keyframe.
    - **Pros:** Perfectly synchronized with visual events (e.g., explosion impact).
    - **Cons:** Requires engine support for Effekseer triggers, which is not currently exposed in `EffekseerSystem.js`.

3.  **Hybrid Approach (Current Best Practice):**
    - Rely on `exists()` for the total duration (ensuring the sequence doesn't end prematurely).
    - Use `wait` steps *before* the `apply` step if the `apply` needs to happen mid-animation, or rely on the natural end of the animation if the effect is short.
    - **Correction:** The current `Flare` script puts `apply` *after* the effect. Since `Flare` is a long animation, we rely on `exists()` returning true for the duration. Once `exists()` works correctly, `apply` will happen at the *end* of the animation.

    *Note: If the desired behavior is for damage to happen at the climax (middle), the script structure in `data.js` would need to change (e.g., spawn effect non-blocking -> wait duration -> apply -> wait remaining), but fixing `exists` is the prerequisite for any reliable pacing.*

## Conclusion

The primary cause of the pacing issue is the **Handle Type Mismatch**. The `EffekseerSystem` must be updated to unwrap `EffekseerHandle` objects before querying the WASM context.
