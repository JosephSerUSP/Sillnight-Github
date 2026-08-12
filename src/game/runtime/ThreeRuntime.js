const THREE = globalThis.THREE;

if (!THREE || typeof THREE.WebGLRenderer !== 'function') {
    throw new Error('ThreeRuntime requires the pinned Three.js runtime to be loaded before game modules.');
}

/**
 * Single compatibility boundary for the production Three.js runtime.
 *
 * Stage A still loads r128 as a classic script, so this adapter currently
 * captures that global once and exports it as an explicit module dependency.
 * Renderer/material consumers should import from here instead of reaching for
 * global THREE directly. A later ESM/version migration can then change this
 * boundary without rewriting those consumers again.
 */
export { THREE };

export const threeRuntimeInfo = Object.freeze({
    source: 'legacy-global-adapter',
    revision: String(THREE.REVISION)
});
