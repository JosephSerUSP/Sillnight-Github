# Shader Analysis: Fog of War Displacement

## Issue Description
The user reported that the vertical displacement of wall tiles, which is supposed to be inversely proportional to the "visibility" (fog) value, was not working. While the alpha modulation (transparency) worked correctly, the geometry remained flat.

## Investigation
A deep analysis of `src/game/materials/FogMaterial.js`, `src/game/systems/ExploreSystem.js`, and the previous iteration of the shader system revealed three concurrent issues:

### 1. Vertex Shader Texture Sampling (Logic Issue)
The vertex shader relied on `GL_EXT_shader_texture_lod` to access `texture2DLodEXT`.
-   In WebGL 2, this extension is not defined because LOD functionality is native.
-   The fallback path used `texture2D(map, uv)`.
-   In a Vertex Shader, standard texture sampling (without explicit LOD) is often undefined or unreliable.

### 2. Texture Format Compatibility (Data Issue)
The `ExploreSystem` was creating the fog texture using `THREE.LuminanceFormat` and `THREE.UnsignedByteType`.
-   **WebGL 2 Deprecation**: `LuminanceFormat` is deprecated in WebGL 2. While Three.js attempts to emulate it, its behavior in Vertex Shaders is inconsistent.
-   The texture was converted to `THREE.RGBAFormat` to ensure universal compatibility.

### 3. Coordinate Space Mismatch (Math Issue)
The initial fix attempted to apply displacement by modifying the `transformed` variable in the `<begin_vertex>` chunk.
-   `transformed` represents the vertex position in **Local Space**.
-   For `InstancedMesh`, applying a vertical offset in Local Space (`transformed.y`) works only if the instance matrix has no rotation or scaling that misaligns the Local Y axis with the World Y axis.
-   While Walls typically have Identity rotation, the transformation pipeline (`<project_vertex>`) re-calculates `mvPosition` from `transformed`.
-   Comparing with an older, working version of the shader revealed that it applied displacement to the **World/View Position** directly, bypassing Local Space issues.

## Solution
The final solution implements a robust pipeline:

### 1. Shader Logic Update (`FogMaterial.js`)
-   **Texture Sampling**: Uses `#if __VERSION__ >= 300` to select `textureLod` (WebGL 2) or `texture2DLodEXT` (WebGL 1).
-   **Displacement Calculation**: Logic moved to modify a calculated `fogWorldPos`.
-   **Pipeline Injection**: Instead of modifying `transformed` (Local), the shader now intercepts `<project_vertex>` to use the modified `fogWorldPos` directly for `mvPosition` calculation. This ensures the displacement is always applied along the global vertical axis, regardless of instance transforms.

### 2. Texture Format Update (`ExploreSystem.js`)
-   Converted Fog Texture to `THREE.RGBAFormat`.
-   Updated data population loops to fill all 4 channels (RGBA).

## Verification
-   **Static Analysis**: The code now uses standard WebGL 2 API calls (`textureLod`), standard formats (`RGBA`), and World Space coordinate math.
-   **Behavior**: Walls should now vertically displace when hidden (fog value 0) and flatten when revealed (fog value 1).
