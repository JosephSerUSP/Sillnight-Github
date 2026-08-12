# Explicit Three.js Consumers

**Status:** incremental renderer-boundary cleanup under #304  
**Depends on:** the validated r185 upgrade in #324

## Purpose

`ThreeRuntime.js` is the authoritative package/runtime boundary for Three.js. The temporary `globalThis.THREE` alias exists only so large legacy presentation modules can migrate incrementally; it should not remain the default dependency mechanism for new or touched code.

This slice moves two support-layer consumers to explicit ownership:

- `MaterialFactory` imports `{ THREE }` from `ThreeRuntime.js`;
- `EffekseerSystem` imports `{ THREE }` from `ThreeRuntime.js`.

They no longer depend on ambient `window.THREE` / `globalThis.THREE` access.

## Why these two first

Both are important renderer-adjacent boundaries but small enough to migrate without obscuring behavioral review:

- `MaterialFactory` creates the materials consumed by exploration, fog and pearlescent effects;
- `EffekseerSystem` builds Three matrices/vectors around the shared WebGL context and is sensitive to using the same Three runtime instance as the renderer.

Moving them first proves that explicit runtime ownership works across material creation and external WebGL integration before touching the much larger `ExploreSystem` and `BattleRenderSystem` files.

## Compatibility bridge remains

The global alias remains intentionally present after this slice because `ExploreSystem` and `BattleRenderSystem` still consume ambient `THREE` extensively.

Do not remove the bridge until those remaining production consumers are explicitly migrated and validated. The desired progression is:

```text
ThreeRuntime (authoritative ESM runtime)
        |
        +--> RenderManager          explicit
        +--> FogMaterial            explicit
        +--> MaterialFactory        explicit
        +--> EffekseerSystem        explicit
        |
        +--> globalThis.THREE       temporary bridge
                 |
                 +--> ExploreSystem
                 +--> BattleRenderSystem
```

The next cleanup slice should migrate the large exploration/battle renderers with real source/dist visual smoke. Only after that should bridge removal be considered.

## Verification

Run after building:

```bash
npm run build
npm run verify:three-explicit-consumers
```

The command checks that the migrated support consumers import `ThreeRuntime` explicitly and do not reach ambient Three, then reuses the full Three r185 runtime verification covering source/dist boot, runtime identity, renderer invariants and FogMaterial shader compilation.

No visual, gameplay, asset, shader, camera or renderer-setting changes are intended by this slice.
