export class WindowBase {
    constructor(title = '', options = {}) {
        this.root = document.createElement('div');
        this.root.classList.add('sn-window');
        if (options.size) this.root.classList.add(`sn-window--${options.size}`);
        if (options.classes) this.root.classList.add(...options.classes);
        this.visible = false;

        this.header = document.createElement('div');
        this.header.className = 'sn-window__header';
        this.titleEl = document.createElement('span');
        this.titleEl.textContent = title;
        this.header.appendChild(this.titleEl);

        this.content = document.createElement('div');
        this.content.className = 'sn-window__content';

        this.root.appendChild(this.header);
        this.root.appendChild(this.content);
    }

    setTitle(text) {
        this.titleEl.textContent = text;
    }

    open(parent) {
        if (parent && !this.root.parentElement) {
            parent.appendChild(this.root);
        }
        this.show();
        this.refresh();
    }

    close() {
        this.hide();
        if (this.root.parentElement) {
            this.root.parentElement.removeChild(this.root);
        }
    }

    show() {
        this.root.style.display = '';
        this.visible = true;
    }

    hide() {
        this.root.style.display = 'none';
        this.visible = false;
    }

    refresh() {}
}

export class WindowSelectable extends WindowBase {
    constructor(title = '', options = {}) {
        super(title, options);
        this.index = 0;
        this.items = [];
        this.handlers = {};
        this.itemElements = [];
        this._boundKey = this.onKeyDown.bind(this);
    }

    setItems(items) {
        this.items = items || [];
        this.index = 0;
        this.refresh();
    }

    maxItems() {
        return this.items.length;
    }

    setHandler(symbol, fn) {
        this.handlers[symbol] = fn;
    }

    activate(target = document) {
        target.addEventListener('keydown', this._boundKey);
    }

    deactivate(target = document) {
        target.removeEventListener('keydown', this._boundKey);
    }

    onKeyDown(event) {
        if (!this.visible) return;
        if (event.key === 'ArrowUp') {
            this.cursorUp();
            event.preventDefault();
        } else if (event.key === 'ArrowDown') {
            this.cursorDown();
            event.preventDefault();
        } else if (event.key === 'Enter') {
            this.processOk();
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.processCancel();
            event.preventDefault();
        }
    }

    cursorUp() {
        if (this.maxItems() === 0) return;
        this.index = (this.index - 1 + this.maxItems()) % this.maxItems();
        this.updateSelection();
    }

    cursorDown() {
        if (this.maxItems() === 0) return;
        this.index = (this.index + 1) % this.maxItems();
        this.updateSelection();
    }

    processOk() {
        if (this.handlers.ok) this.handlers.ok(this.index);
    }

    processCancel() {
        if (this.handlers.cancel) this.handlers.cancel();
    }

    setItemElements(elements) {
        this.itemElements = elements;
        this.updateSelection();
    }

    updateSelection() {
        this.itemElements.forEach((el, idx) => {
            if (!el) return;
            if (idx === this.index) el.classList.add('sn-list__item--selected');
            else el.classList.remove('sn-list__item--selected');
        });
    }
}
