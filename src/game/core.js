// Core utilities for the Stillnight client (similar to rmmz_core.js).
// Use this module for shared helpers (math, RNG, DOM guards) that multiple systems rely on.
// To add new helpers, export plain functions here rather than duplicating logic elsewhere.

export const RNG = {
    randInt(min, max) {
        const low = Math.ceil(min);
        const high = Math.floor(max);
        return Math.floor(Math.random() * (high - low + 1)) + low;
    },
    choice(list) {
        if (!Array.isArray(list) || list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)];
    }
};

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function resolveAssetPath(assetPath) {
    if (!assetPath) return null;
    const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedPath.startsWith('src/') ? normalizedPath : `src/${normalizedPath}`;
}

export class SimpleEventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
    }

    off(event, handler) {
        const set = this.listeners.get(event);
        if (set) set.delete(handler);
    }

    emit(event, payload) {
        const set = this.listeners.get(event);
        if (!set) return;
        set.forEach(cb => cb(payload));
    }
}
