# Three.js Runtime — Stage A

**Status:** production infrastructure step under #304  
**Three.js version:** `0.128.0` (r128), intentionally matching the pre-change CDN runtime

## Purpose

Stage A changes **ownership**, not renderer semantics.

Sillnight now treats Three.js as a pinned npm runtime dependency and produces a self-contained static `dist/` build. It does not upgrade Three.js, change `WebGLRenderer`, alter shader/material behavior, or redesign renderer consumers.

The goal is to remove accidental CDN ownership before attempting any version upgrade.

## Runtime ownership

### npm owns

- the exact Three.js package version used by production;
- reproducible installation through `package-lock.json`.

### `RenderManager` owns

- creation of the shared `THREE.WebGLRenderer`;
- the fixed 480×270 internal render size;
- `pixelRatio = 1`;
- `antialias = false`;
- `preserveDrawingBuffer = true` for transition captures;
- the shared renderer canvas lifecycle and resize reassertion.

### presentation systems currently own

`ExploreSystem`, `BattleRenderSystem`, materials, and other presentation code still use the legacy global `THREE` namespace. Stage A deliberately preserves that contract to minimize semantic risk.

This global access is **explicit migration debt**, not the desired final boundary. A later step may convert individual presentation modules to explicit imports/adapters once the pinned runtime and verification surface are stable.

## Development runtime

After `npm install`, `index.html` loads:

`node_modules/three/build/three.min.js`

instead of the previous public cdnjs r128 URL.

This keeps the exact classic/global r128 semantics used by the current code while removing the external Three.js network dependency.

Tailwind and the VT323 webfont remain external in Stage A; they are unrelated to renderer semantics and are not silently folded into this change.

## Build

Run:

```bash
npm run build
```

The build:

1. recreates `dist/`;
2. copies the current `src/` runtime tree unchanged;
3. copies the pinned npm Three.js build to `dist/vendor/three.min.js`;
4. rewrites only the Three.js script path in the built `index.html`.

The source `index.html` remains convenient for local static serving after `npm install`, while `dist/` does not require `node_modules/` at runtime.

## Verification contract

Run:

```bash
npm run verify:three-stage-a
```

The browser smoke boots the **actual Sillnight application** and asserts:

- `THREE.REVISION === "128"`;
- the shared renderer is still a `WebGLRenderer`;
- the internal canvas remains 480×270;
- pixel ratio remains 1;
- antialiasing remains disabled;
- `preserveDrawingBuffer` remains enabled;
- no page errors occur during boot.

This is intentionally a semantic/runtime smoke rather than a new visual baseline. Stage B should add before/after visual evidence when the Three.js version itself changes.

## Stage B gate

Stage B may evaluate a newer Three.js release only after Stage A is validated.

It must:

- keep `WebGLRenderer` initially;
- use actual Sillnight exploration/battle assets and material behavior;
- inspect `FogMaterial` / `onBeforeCompile()` compatibility explicitly;
- compare representative screenshots before and after the version change;
- treat any visual delta as evidence requiring explanation, not as an automatic improvement.

No generic plugin framework is justified by Stage A.
