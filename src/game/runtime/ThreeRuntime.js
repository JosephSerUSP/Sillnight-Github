import * as THREE from 'three';

if (!THREE || typeof THREE.WebGLRenderer !== 'function') {
    throw new Error('ThreeRuntime requires the pinned Three.js ESM runtime.');
}

if (globalThis.THREE && globalThis.THREE !== THREE) {
    throw new Error('Multiple Three.js runtime instances were detected during bootstrap.');
}

// Stage B upgrades the library before changing Sillnight's authored look.
// Three enabled color management by default after r128; keep the legacy
// interpretation for this compatibility pass so the version upgrade can be
// evaluated independently from an intentional color-pipeline redesign.
if (THREE.ColorManagement) {
    THREE.ColorManagement.enabled = false;
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
    visualCompatibilityProfile: 'r128-authored-look',
    colorManagementEnabled: THREE.ColorManagement?.enabled ?? null,
    revision: String(THREE.REVISION)
});

globalThis.__SILLNIGHT_THREE_RUNTIME__ = threeRuntimeInfo;
