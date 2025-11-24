// core.js - similar to rmmz_core.js
// Provides shared helpers/constants used across systems, scenes, and windows.
// To add new helpers, export pure utilities here to avoid duplication.

export const Core = {
    rng(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    },
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
};

export const resolveAssetPath = (assetPath) => {
    if (!assetPath) return null;
    const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedPath.startsWith('src/') ? normalizedPath : `src/${normalizedPath}`;
};

export const createUid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
