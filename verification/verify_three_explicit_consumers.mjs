import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const consumers = [
  'src/game/materials/MaterialFactory.js',
  'src/game/systems/EffekseerSystem.js'
];

for (const relativePath of consumers) {
  const source = await readFile(join(repoRoot, relativePath), 'utf8');
  if (!source.includes("import { THREE } from '../runtime/ThreeRuntime.js';")) {
    throw new Error(`${relativePath} is not an explicit ThreeRuntime consumer.`);
  }
  if (/\b(?:window|globalThis)\.THREE\b/.test(source)) {
    throw new Error(`${relativePath} still reaches ambient Three directly.`);
  }
}

console.log('Explicit ThreeRuntime consumer checks passed:', consumers);

// Reuse the full source/dist runtime, renderer, shader and visual-contract smoke.
await import('./verify_three_esm_runtime.mjs');
