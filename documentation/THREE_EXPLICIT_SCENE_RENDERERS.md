# Explicit Three.js Scene Renderers

**Status:** incremental renderer-boundary cleanup under #304  
**Depends on:** #324 and #325

## Purpose

`ThreeRuntime.js` is the authoritative Three.js package/runtime boundary. After #325, the remaining production systems that still depended on the ambient `globalThis.THREE` compatibility alias were the two large scene renderers:

- `ExploreSystem`;
- `BattleRenderSystem`.

This slice gives both modules explicit ownership by importing `{ THREE }` from `ThreeRuntime.js`.

No rendering behavior, scene composition, lighting value, camera, shader, asset, gameplay or UI behavior is intentionally changed.

## Runtime shape after this slice

```text
ThreeRuntime (authoritative ESM runtime)
        |
        +--> RenderManager             explicit
        +--> FogMaterial               explicit
        +--> MaterialFactory           explicit
        +--> EffekseerSystem           explicit
        +--> ExploreSystem             explicit
        +--> BattleRenderSystem        explicit
        |
        +--> globalThis.THREE          compatibility alias only
```

The global alias deliberately remains for one more step. Its removal should be a separate PR that first proves no production module still depends on ambient Three. Keeping bridge removal separate makes any bootstrap failure immediately attributable.

## Verification

Run:

```bash
npm run build
npm run verify:three-explicit-scene-renderers
```

The verification chain checks:

1. `ExploreSystem` and `BattleRenderSystem` import `ThreeRuntime` explicitly;
2. neither reaches `window.THREE` or `globalThis.THREE` directly;
3. the support consumers migrated in #325 remain explicit;
4. source and built `dist/` still boot on the pinned r185 runtime;
5. renderer invariants and the r128-authored-look compatibility profile remain intact;
6. `FogMaterial` still compiles through the real renderer.

Because these are the two primary production scene renderers, local validation should also inspect real exploration and a fixed battle before merge. The expected visual result is no change from validated #324.

## Next step

After this slice is validated and merged, search the production tree for any remaining ambient Three dependency. If none remains, remove the `globalThis.THREE` compatibility alias from `ThreeRuntime.js` in a separate, tightly verified PR.
