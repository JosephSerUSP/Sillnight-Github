// core.js - similar to rmmz_core.js. Shared utilities and constants for the game.
// Add new helpers here when multiple systems/scenes/windows need them.

export const Core = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// Simple event emitter to decouple UI from scenes/systems.
export class SimpleEmitter {
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
        set.forEach(fn => fn(payload));
    }
}

export function resolveAssetPath(assetPath) {
    if (!assetPath) return null;
    const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedPath.startsWith('src/') ? normalizedPath : `src/${normalizedPath}`;
}
