// Window and shell UI layer (similar to rmmz_windows.js).
// All DOM-related code for the persistent PC-98 shell lives here. Add new window
// types by subclassing Window_Base and wiring them into the ShellUI container.

export class Window_Base {
    constructor(root) {
        this.root = root || document.createElement('div');
    }
    open(parent) {
        (parent || document.body).appendChild(this.root);
        this.show();
    }
    close() {
        this.root.remove();
    }
    show() { this.root.classList.remove('hidden'); }
    hide() { this.root.classList.add('hidden'); }
    refresh() {}
}

export class Window_Selectable extends Window_Base {
    constructor(root) {
        super(root);
        this.items = [];
        this.index = -1;
    }

    select(index) {
        this.index = Math.max(0, Math.min(this.items.length - 1, index));
        this.refresh();
    }

    deselect() {
        this.index = -1;
        this.refresh();
    }

    addHandler(handler, callback) {
        // This is a simple event handler for now, it can be expanded later
        this.root.addEventListener(handler, (e) => {
            // Find the index of the clicked element
            const index = Array.from(this.root.children).indexOf(e.target.closest('.party-slot'));
            if (index !== -1) {
                callback(index);
            }
        });
    }
}
