import * as THREE from 'three';

if (!THREE || typeof THREE.WebGLRenderer !== 'function') {
    throw new Error('ThreeRuntime requires the pinned Three.js ESM runtime.');
}

if (globalThis.THREE && globalThis.THREE !== THREE) {
    throw new Error('Multiple Three.js runtime instances were detected during bootstrap.');
}

// Temporary compatibility alias for larger presentation systems that still
// consume ambient THREE. The ESM module above is authoritative; this global is
// only a bridge and must always point to the exact same module namespace.
globalThis.THREE = THREE;

export { THREE };

export const threeRuntimeInfo = Object.freeze({
    source: 'package-esm-compatibility-bridge',
    moduleSpecifier: 'three',
    compatibilityGlobal: true,
    revision: String(THREE.REVISION)
});

globalThis.__SILLNIGHT_THREE_RUNTIME__ = threeRuntimeInfo;
