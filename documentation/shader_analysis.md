# Shader Analysis: Fog of War Displacement

## Issue Description
The user reported that the vertical displacement of wall tiles, which is supposed to be inversely proportional to the "visibility" (fog) value, was not working. While the alpha modulation (transparency) worked correctly, the geometry remained flat.

## Investigation
A deep analysis of `src/game/materials/FogMaterial.js`, `src/game/systems/ExploreSystem.js`, and a reference implementation ("older approach") provided by the user revealed three key issues:

### 1. Vertex Shader Texture Sampling
The original vertex shader relied on `GL_EXT_shader_texture_lod` and `texture2DLodEXT`.
-   In the project's **WebGL 2** environment, this extension is native/unnecessary, causing the shader to fall back to `texture2D` in the vertex shader.
-   Standard `texture2D` calls in a Vertex Shader are unreliable without explicit LODs because derivatives are undefined.
-   **Fix**: Implemented a robust `getFogValVS` function that checks `#if __VERSION__ >= 300` to use `textureLod` natively, ensuring correct data access.

### 2. Texture Format Compatibility
The `ExploreSystem` created the fog texture using `THREE.LuminanceFormat`.
-   `LuminanceFormat` is deprecated in WebGL 2 and can lead to inconsistent sampling behavior (especially in Vertex Shaders).
-   **Fix**: Converted the texture to `THREE.RGBAFormat` (universal support) and updated the data population loops to fill all 4 channels (R, G, B, A).

### 3. Coordinate Space & Instancing Logic
The initial displacement attempts tried to modify `transformed` (Local Space) in the `<begin_vertex>` chunk.
-   For `InstancedMesh`, local transformations can be tricky depending on how the instance matrix interacts with the projection pipeline.
-   The "older approach" that successfully displaced walls did so by modifying the final `mvPosition` (Model-View Position) in the `<project_vertex>` stage, adding a View-Space offset derived from the global Up vector.
-   **Fix**: The final solution adopts this proven pipeline. It calculates a `fogOffset` based on visibility (sampled via the fixed Texture logic) and adds it directly to `mvPosition` in View Space. This bypasses any ambiguity regarding local vs. global coordinate systems in the instancing pipeline.

## Solution Summary
1.  **Texture**: Updated to `RGBAFormat` for WebGL 2 stability.
2.  **Sampling**: Updated to use `textureLod` for correct vertex shader access.
3.  **Displacement**: Updated to inject a View-Space offset into `<project_vertex>`, guaranteeing correct vertical movement for Instanced Meshes.
