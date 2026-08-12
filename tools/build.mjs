import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const sourceIndex = join(repoRoot, 'index.html');
const threeBuildDir = join(repoRoot, 'node_modules', 'three', 'build');
const threeBuildFiles = ['three.module.js', 'three.core.js'];
const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
const threeVersion = packageJson.dependencies?.three ?? 'unknown';

await rm(distDir, { recursive: true, force: true });
await mkdir(join(distDir, 'vendor'), { recursive: true });
await cp(join(repoRoot, 'src'), join(distDir, 'src'), { recursive: true });
for (const file of threeBuildFiles) {
  await copyFile(join(threeBuildDir, file), join(distDir, 'vendor', file));
}

const index = await readFile(sourceIndex, 'utf8');
const builtIndex = index.replace(
  './node_modules/three/build/three.module.js',
  './vendor/three.module.js'
);

if (builtIndex === index) {
  throw new Error('Three.js ESM import-map path was not found in index.html; build contract is stale.');
}
if (builtIndex.includes('three.min.js')) {
  throw new Error('Built runtime still references the legacy classic Three.js build.');
}

await writeFile(join(distDir, 'index.html'), builtIndex);
console.log(`Built static Sillnight runtime in dist/ with pinned Three.js ${threeVersion} ESM.`);
