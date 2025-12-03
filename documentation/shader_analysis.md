# Shader Analysis: Fog of War Displacement

## Issue Description
The user reported that the vertical displacement of wall tiles, which is supposed to be inversely proportional to the "visibility" (fog) value, was not working. While the alpha modulation (transparency) worked correctly, the geometry remained flat.

## Investigation
A deep analysis of `src/game/materials/FogMaterial.js` and runtime shader inspection revealed the following:

1.  **Fog Implementation**:
    -   A `THREE.LuminanceFormat` texture (`uFogMap`) stores visibility data (0..255).
    -   The Vertex Shader reads this texture to determine displacement.
    -   The Fragment Shader reads this texture to determine opacity.

2.  **Shader Logic (Previous)**:
    ```glsl
    float getFogValVS(sampler2D map, vec2 uv) {
        #ifdef GL_EXT_shader_texture_lod
            return texture2DLodEXT(map, uv, 0.0).r;
        #else
            return texture2D(map, uv).r;
        #endif
    }
    ```

3.  **Runtime Environment**:
    -   Context: **WebGL 2** (`WebGL2RenderingContext`).
    -   `GL_EXT_shader_texture_lod`: **False** (Not needed/supported in WebGL 2 as it's core functionality).
    -   `texture2D`: In WebGL 2 (GLSL ES 3.00), `texture2D` is deprecated/removed in favor of `texture`. Three.js may provide compatibility aliases, but relying on them for Vertex Shader texture fetching (which requires explicit LOD handling) is fragile.

4.  **Root Cause**:
    The code relied on `GL_EXT_shader_texture_lod` to trigger the "correct" LOD-based lookup. Since the environment is WebGL 2, the extension is absent, causing the code to fall back to `texture2D(map, uv)`.
    In a Vertex Shader, standard texture sampling (without explicit LOD) is potentially undefined or prone to returning default values (like 1.0 or 0.0) depending on the driver implementation, because vertex shaders lack the partial derivatives required to calculate mipmap levels.

    The Fragment Shader worked because fragment shaders *can* calculate derivatives and implicit LODs.

## Solution
The shader function `getFogValVS` needs to be robust across WebGL generations.
-   **WebGL 2 (GLSL ES 3.00)**: Use `textureLod(map, uv, 0.0)`.
-   **WebGL 1 + Extension**: Use `texture2DLodEXT(map, uv, 0.0)`.
-   **WebGL 1 (Fallback)**: Use `texture2D(map, uv)` (risky, but unavoidable without extensions).

The fix involves checking the GLSL version in the shader:

```glsl
float getFogValVS(sampler2D map, vec2 uv) {
    #if __VERSION__ >= 300
        return textureLod(map, uv, 0.0).r;
    #elif defined(GL_EXT_shader_texture_lod)
        return texture2DLodEXT(map, uv, 0.0).r;
    #else
        return texture2D(map, uv).r;
    #endif
}
```

This ensures that in a modern WebGL 2 context (the project's standard), the correct intrinsic function is used to fetch texture data in the Vertex Shader.
