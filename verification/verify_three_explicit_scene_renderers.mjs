import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sceneRenderers = [
  'src/game/systems/ExploreSystem.js',
  'src/game/systems/BattleRenderSystem.js'
];

for (const relativePath of sceneRenderers) {
  const source = await readFile(join(repoRoot, relativePath), 'utf8');
  if (!source.includes("import { THREE } from '../runtime/ThreeRuntime.js';")) {
    throw new Error(`${relativePath} is not an explicit ThreeRuntime consumer.`);
  }
  if (/\b(?:window|globalThis)\.THREE\b/.test(source)) {
    throw new Error(`${relativePath} still reaches ambient Three directly.`);
  }
}

console.log('Explicit scene-renderer ThreeRuntime checks passed:', sceneRenderers);

// Keep the support-consumer contract and the full source/dist r185 renderer,
// shader, ESM identity and visual-compatibility smoke as prerequisites.
await import('./verify_three_explicit_consumers.mjs');
