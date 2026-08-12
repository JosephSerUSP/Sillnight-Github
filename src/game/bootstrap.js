import { THREE, threeRuntimeInfo } from './runtime/ThreeRuntime.js';

if (globalThis.THREE !== THREE) {
    throw new Error('Sillnight Three.js compatibility bridge did not initialize correctly.');
}

if (threeRuntimeInfo.source !== 'package-esm-compatibility-bridge') {
    throw new Error(`Unexpected Three.js runtime source: ${threeRuntimeInfo.source}`);
}

// Import the application only after the compatibility bridge exists. This lets
// legacy Explore/Battle presentation modules continue using ambient THREE while
// the authoritative runtime is already the package ESM module.
await import('./main.js');
