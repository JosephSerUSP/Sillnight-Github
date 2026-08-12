# Three.js ESM Runtime — r128 Boundary

**Status:** production architecture slice under #304  
**Three.js version:** `0.128.0` remains intentionally unchanged

## Purpose

This slice changes **module ownership**, not renderer behavior and not the Three.js version.

After #321, Sillnight owned an exact npm-pinned r128 runtime. After #322, `RenderManager` and `FogMaterial` consumed that runtime through an explicit `ThreeRuntime` adapter. This step moves the authoritative runtime itself from the classic/global `three.min.js` build to Three's package ESM build, `three.module.js`.

The production shape becomes:

```text
three@0.128.0 / build/three.module.js
                 |
                 v
          ThreeRuntime.js
            /         \
           v           v
   explicit imports   temporary global alias
   RenderManager      legacy Explore/Battle code
   FogMaterial
```

There is only **one Three.js runtime instance**. `globalThis.THREE` remains temporarily available, but it points to the exact ESM module namespace and is no longer the source of truth.

## Bootstrap order

`index.html` defines an import map for the bare `three` specifier and starts `src/game/bootstrap.js`.

`bootstrap.js` imports `ThreeRuntime` first. `ThreeRuntime` imports `three`, validates the package runtime, installs the temporary compatibility global, and records diagnostics. Only then does bootstrap dynamically import `main.js`.

This order lets larger presentation systems keep using ambient `THREE` without loading a second classic build.

## Source and built runtime

Source development resolves:

```text
three -> ./node_modules/three/build/three.module.js
```

`npm run build` copies that exact file to:

```text
dist/vendor/three.module.js
```

and rewrites the built import map to:

```text
three -> ./vendor/three.module.js
```

The built application therefore remains self-contained with respect to Three.js and does not need `node_modules` at runtime.

## Compatibility constraints

This PR intentionally preserves:

- Three revision 128;
- `WebGLRenderer`;
- the 480x270 internal render surface;
- pixel ratio 1;
- antialias disabled;
- `preserveDrawingBuffer` enabled;
- existing exploration/battle systems;
- existing shader source and `FogMaterial.onBeforeCompile()` behavior;
- assets, filtering, cameras, UI and gameplay.

The temporary `globalThis.THREE` alias is migration debt. Do not remove it until all remaining ambient-Three presentation consumers have either migrated to `ThreeRuntime` or been proven unnecessary.

## Verification

Run:

```bash
npm run build
npm run verify:three-esm-runtime
```

The verifier boots both the source tree and built `dist/` application and proves:

- the package ESM build is actually requested;
- no classic Three build is requested;
- no Three CDN request occurs;
- source and built import maps point at the intended ESM files;
- the built module matches the pinned npm module byte-for-byte;
- the global compatibility alias is the exact ESM namespace;
- `RenderManager` and `FogMaterial` use that same runtime;
- Stage A renderer invariants remain unchanged;
- real Sillnight reaches `Game.ready` without page errors.

Temporary screenshots are captured for visual sanity inspection but are not committed.

## Next gate

Only after this r128 ESM path is validated should the package version itself change.

The next version-upgrade PR should change **one major variable**: Three.js revision. It should keep `WebGLRenderer`, preserve this ESM/bootstrap boundary, exercise real exploration and battle content, compile the real fog/material path, and compare representative before/after screenshots. Any visible delta must be treated as evidence to explain rather than an automatic improvement.
