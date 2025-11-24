// rmmz_managers.js equivalent: manages scenes and input routing for Stillnight.
// Add new managers here to keep coordination logic centralized.

export const SceneManager = {
    current: null,
    stack: [],
    hooks: {},
    init({ systems, ui }) {
        this.systems = systems;
        this.ui = ui;
    },
    changeScene(scene) {
        if (this.current?.stop) this.current.stop();
        this.current = scene;
        if (this.current?.start) this.current.start();
    },
    push(scene) {
        if (this.current?.pause) this.current.pause();
        this.stack.push(this.current);
        this.changeScene(scene);
    },
    pop() {
        if (this.current?.stop) this.current.stop();
        this.current = this.stack.pop();
        if (this.current?.resume) this.current.resume();
    },
    update(dt) {
        this.current?.update?.(dt);
    },
    handleAction(action) {
        if (!this.current?.onAction) return;
        this.current.onAction(action);
    }
};

export const InputManager = {
    bindings: {
        ArrowUp: 'move-up',
        ArrowDown: 'move-down',
        ArrowLeft: 'move-left',
        ArrowRight: 'move-right',
        Space: 'confirm',
        KeyP: 'party',
        KeyB: 'inventory'
    },
    listeners: [],
    start() {
        const handler = (e) => {
            const action = this.bindings[e.code] || this.bindings[e.key];
            if (!action) return;
            e.preventDefault();
            this.listeners.forEach((fn) => fn(action, e));
        };
        window.addEventListener('keydown', handler);
        this._handler = handler;
    },
    stop() {
        if (this._handler) window.removeEventListener('keydown', this._handler);
    },
    onAction(cb) {
        this.listeners.push(cb);
    }
};
