// managers.js - similar to rmmz_managers.js. Hosts scene/input management utilities.
// Add new managers here (SceneManager, InputManager, etc.).

export const SceneManager = {
    scenes: new Map(),
    current: null,
    register(name, scene) {
        this.scenes.set(name, scene);
    },
    change(name) {
        const next = this.scenes.get(name);
        if (!next) return;
        if (this.current?.stop) this.current.stop();
        this.current = next;
        if (this.current?.start) this.current.start();
    },
    handleAction(action) {
        if (this.current?.handleAction) this.current.handleAction(action);
    }
};

export const InputManager = {
    bindings: new Map(),
    attach() {
        window.addEventListener('keydown', (e) => {
            const action = this.bindings.get(e.key.toLowerCase());
            if (action) {
                e.preventDefault();
                SceneManager.handleAction(action);
            }
        });
    },
    bind(key, action) {
        this.bindings.set(key.toLowerCase(), action);
    }
};
