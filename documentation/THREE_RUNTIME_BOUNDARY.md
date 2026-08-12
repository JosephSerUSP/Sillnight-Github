# Three.js Runtime Boundary

**Status:** production architecture slice under #304  
**Runtime version:** `three@0.128.0` remains unchanged

## Purpose

Stage A moved Three.js from an external CDN into pinned npm/build ownership. This follow-up creates the first explicit code boundary around that runtime without changing renderer semantics or upgrading Three.js.

The production shape is now:

```text
pinned r128 classic runtime
          |
          v
    globalThis.THREE
          |
          v
     ThreeRuntime.js
       /        \
      v          v
RenderManager  FogMaterial
```

`ThreeRuntime.js` is the only new compatibility boundary introduced here. It captures the currently loaded global Three namespace once and exports it as an ordinary module dependency.

## Why this matters

Before this slice, renderer/material modules reached directly into the ambient `THREE` global. That makes a future migration to ESM or a newer Three release unnecessarily invasive because runtime ownership and every consumer are coupled together.

After this slice:

- `RenderManager` imports `{ THREE }` from `ThreeRuntime.js`;
- `FogMaterial` imports the same adapter;
- the adapter remains backed by the exact existing r128 global runtime;
- remaining presentation modules may continue using the legacy global temporarily;
- a later ESM/version migration can change the adapter/bootstrap boundary without rewriting the already migrated consumers again.

This is an anti-corruption seam, not a plugin framework.

## Renderer ownership preserved

No renderer semantics change:

- `THREE.WebGLRenderer` remains the renderer;
- internal resolution remains 480x270;
- pixel ratio remains 1;
- antialias remains disabled;
- `preserveDrawingBuffer` remains enabled;
- exploration/battle scene ownership is unchanged;
- shader source is unchanged;
- `FogMaterial.onBeforeCompile()` behavior is unchanged;
- assets, cameras, filtering, UI, and scene composition are unchanged.

## Why FogMaterial is migrated now

`FogMaterial` is the most version-sensitive custom Three integration currently identified because it constructs Three uniform values and modifies built-in shaders through `onBeforeCompile()`.

Routing it through the adapter now makes the future version-upgrade test more meaningful: if a newer Three release breaks this path, the compatibility work is localized around an already explicit renderer/material boundary rather than hidden behind global access.

## Remaining migration debt

Other presentation systems still use ambient `THREE` directly, particularly larger exploration/battle rendering code. That is accepted temporary debt.

Do not mass-convert those files merely for stylistic consistency. Migrate them when a concrete renderer-boundary or version-upgrade task touches them.

The desired progression is:

```text
Stage A: own exact r128 package/build
        |
        v
this slice: explicit runtime adapter + sensitive consumers
        |
        v
future: switch adapter/bootstrap to ESM runtime
        |
        v
future: upgrade Three behind visual/runtime verification
```

## Verification

Run:

```bash
npm run build
npm run verify:three-runtime-boundary
```

The existing Stage A browser smoke is extended to verify both source and built runtimes. It now additionally proves:

- `ThreeRuntime.THREE === window.THREE`;
- `RenderManager` creates its renderer through that adapter namespace;
- the representative `FogMaterial` path consumes the same adapter runtime;
- the Stage A renderer invariants remain intact;
- the real Sillnight source and `dist/` builds still boot without page errors;
- no Three.js CDN request returns.

The screenshots remain temporary sanity evidence rather than a committed visual baseline. A real Three version upgrade must still introduce explicit before/after representative visual evidence.
