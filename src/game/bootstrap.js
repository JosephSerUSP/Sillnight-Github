import * as THREE from 'three';

// Temporary compatibility bridge for presentation modules that have not yet
// migrated to explicit imports. RenderManager and FogMaterial import the same
// module instance directly, so there is still only one Three.js runtime.
globalThis.THREE = THREE;
globalThis.__SILLNIGHT_THREE_RUNTIME__ = {
    mode: 'esm-import-map',
    revision: THREE.REVISION
};

await import('./main.js');
