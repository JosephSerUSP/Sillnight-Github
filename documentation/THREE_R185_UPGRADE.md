# Three.js r185.1 Upgrade — Visual Compatibility Gate

**Status:** draft production upgrade under #304  
**Target package:** `three@0.185.1`  
**Renderer:** `WebGLRenderer` remains authoritative

## Purpose

PRs #321–#323 deliberately separated package ownership, the Three runtime boundary, and ESM bootstrap from the library-version change. This stage finally changes the Three.js revision while holding those architectural decisions constant.

The goal is not to modernize Sillnight's look by accident. The first successful r185 build should preserve the appearance and behavior authored under r128 closely enough that later color/lighting changes can be evaluated as intentional visual decisions.

## Fixed variables

This upgrade must retain:

- the existing ESM/import-map/bootstrap architecture;
- one Three runtime instance;
- `WebGLRenderer`;
- 480x270 internal 3D rendering;
- pixel ratio 1;
- antialias disabled;
- `preserveDrawingBuffer` enabled;
- current assets, cameras, UI, gameplay and scene composition;
- the existing FogMaterial and PearlescentMaterial strategies unless a concrete r185 incompatibility is demonstrated;
- the temporary `globalThis.THREE` compatibility alias for presentation systems not yet migrated to explicit imports.

WebGPU, TSL and a broad renderer rewrite are not part of this stage.

## Compatibility profile already applied

### Color management

Modern Three enables color management and sRGB output semantics that were not active in Sillnight's r128 runtime. During this upgrade:

- `THREE.ColorManagement.enabled = false`;
- `renderer.outputColorSpace = THREE.LinearSRGBColorSpace`;
- `renderer.toneMapping = THREE.NoToneMapping`.

This is intentionally a **legacy authored-look profile**, not a claim that the modern defaults are undesirable. A future visual PR may compare modern color management deliberately after the renderer upgrade is stable.

## Known migration deltas that require real visual evidence

The upstream migration path from r128 to r185 contains several changes that can affect Sillnight despite the core API remaining compatible.

### Light units

Modern Three removed legacy light-unit behavior. Existing Sillnight light intensities were authored under the older scale, so exploration and battle lighting must be compared against current `main` rather than accepted merely because the scene renders.

If the r185 scene is consistently darker and the evidence matches the documented Three light-unit migration, prefer a focused compatibility correction at the existing light call sites rather than retuning the art by eye. Candidate compatibility values to validate are the legacy intensities multiplied by `Math.PI`.

### Point-light decay

Modern `PointLight` defaults use physically correct decay. Sillnight's exploration player light was authored under the older default. If its radius/falloff differs, explicitly testing `decay = 1` is the compatibility restoration path to compare before changing any other authored value.

### InstancedMesh frustum culling

Modern Three performs frustum culling for `InstancedMesh` differently from the old runtime. Sillnight builds floor/wall instance matrices dynamically and does not currently maintain explicit instance bounds. If floor or wall groups disappear at camera angles where r128 rendered them, first test `frustumCulled = false` on those two map meshes as the compatibility restoration before redesigning geometry ownership.

### Material/shader chunks

Sillnight's custom fog and pearlescent effects patch built-in materials through `onBeforeCompile()`. The shader anchors currently used by the project remain available in r185, but successful JavaScript boot is not sufficient evidence. The upgrade verifier compiles a representative FogMaterial through the real r185 renderer and requires the injected uniforms/varyings to survive compilation.

The local visual pass should also exercise any current pearlescent material that is reachable without inventing new content.

## Verification

Install the pinned package and run:

```bash
npm ci
npx playwright install chromium
npm run build
npm run verify:three-r185-upgrade
```

The automated upgrade smoke verifies source and built `dist/` runtimes, including:

- runtime revision matching the pinned package;
- package ESM ownership and no classic/CDN Three runtime;
- a WebGL2 context;
- the r128-authored-look color compatibility profile;
- renderer resolution/context flags;
- real FogMaterial shader compilation;
- source and built application boot;
- temporary screenshots for human inspection.

## Required local comparison before merge

Automated smoke is necessary but not enough because Three's lighting/color changes are specifically visual.

Capture a baseline from current `main`, then compare the upgrade branch using the **same real Sillnight content** where practical:

1. exploration at the same map/player position;
2. visible fog boundary and player light;
3. current UI over the world;
4. a fixed battle encounter with the same units and battle ground;
5. an Effekseer action/effect if it can be triggered deterministically;
6. a pearlescent material if current content exposes one.

Treat unexplained visual changes as regressions, not improvements.

If a known compatibility delta is confirmed, fix only that delta on the upgrade branch and repeat the comparison. Do not mix aesthetic retuning into this PR.

## Completion criterion

The upgrade is ready only when:

- `three@0.185.1` is the actual source and built runtime;
- the automated source/dist upgrade smoke passes;
- FogMaterial compiles without shader errors;
- representative current Sillnight exploration and battle visuals have been compared to r128 `main`;
- any remaining visible delta is either eliminated by a narrowly justified compatibility shim or explicitly understood and accepted;
- no gameplay or UI redesign has been introduced.

Only after this upgrade is stable should #304 consider whether modern Three color management, modern light units, or further removal of ambient `THREE` access are worthwhile as separate changes.
