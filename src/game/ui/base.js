export class WindowBase {
  constructor({ title = '', className = '' } = {}) {
    this.root = document.createElement('div');
    this.root.className = `sn-window ${className}`.trim();
    this.root.tabIndex = -1;
    this.header = document.createElement('div');
    this.header.className = 'sn-window__header';
    this.header.textContent = title;
    this.content = document.createElement('div');
    this.content.className = 'sn-window__content';
    this.root.appendChild(this.header);
    this.root.appendChild(this.content);
    this.isOpen = false;
  }

  open(parent) {
    if (this.isOpen) return;
    this.isOpen = true;
    if (parent) parent.appendChild(this.root);
    this.show();
    this.refresh();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.remove();
  }

  show() { this.root.style.display = ''; }
  hide() { this.root.style.display = 'none'; }

  refresh() {}
}

export class WindowSelectable extends WindowBase {
  constructor(opts = {}) {
    super(opts);
    this.index = 0;
    this.handlers = {};
    this.items = [];
    this.content.classList.add('sn-list');
    this.root.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  maxItems() { return this.items.length; }

  setHandler(symbol, fn) { this.handlers[symbol] = fn; }

  callHandler(symbol) { if (this.handlers[symbol]) this.handlers[symbol](); }

  onKeyDown(e) {
    if (e.key === 'ArrowDown') { this.select((this.index + 1) % this.maxItems()); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.select((this.index - 1 + this.maxItems()) % this.maxItems()); e.preventDefault(); }
    else if (e.key === 'Enter') { this.callHandler('ok'); }
    else if (e.key === 'Escape') { this.callHandler('cancel'); }
  }

  select(index) {
    this.index = index;
    const children = Array.from(this.content.children);
    children.forEach((el, idx) => {
      el.classList.toggle('sn-list__item--selected', idx === this.index);
    });
  }
}
