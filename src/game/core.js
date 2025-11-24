// rmmz_core.js equivalent: shared helpers and utilities for Stillnight.
// Add cross-cutting functions here (math, rng, asset resolution) to keep other modules lean.

export function resolveAssetPath(assetPath) {
    if (!assetPath) return null;
    const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedPath.startsWith('src/') ? normalizedPath : `src/${normalizedPath}`;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
