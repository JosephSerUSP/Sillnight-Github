import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const sourceIndex = join(repoRoot, 'index.html');
const threeSource = join(repoRoot, 'node_modules', 'three', 'build', 'three.min.js');

await rm(distDir, { recursive: true, force: true });
await mkdir(join(distDir, 'vendor'), { recursive: true });
await cp(join(repoRoot, 'src'), join(distDir, 'src'), { recursive: true });
await copyFile(threeSource, join(distDir, 'vendor', 'three.min.js'));

const index = await readFile(sourceIndex, 'utf8');
const builtIndex = index.replace(
  'node_modules/three/build/three.min.js',
  'vendor/three.min.js'
);

if (builtIndex === index) {
  throw new Error('Three.js runtime path was not found in index.html; build contract is stale.');
}

await writeFile(join(distDir, 'index.html'), builtIndex);
console.log('Built static Sillnight runtime in dist/ with pinned Three.js r128.');
