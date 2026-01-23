import { LayoutManager } from './LayoutManager.js';

/**
 * Layout manager for absolute positioning.
 * Children are positioned using top/left coordinates.
 */
export class AbsoluteLayout extends LayoutManager {
    initialize() {
        this.container.style.position = 'relative';
        this.container.style.display = 'block';
    }

    /**
     * @param {HTMLElement} element
     * @param {Object} options
     * @param {number|string} [options.x] - Left position.
     * @param {number|string} [options.y] - Top position.
     * @param {number|string} [options.width] - Width.
     * @param {number|string} [options.height] - Height.
     */
    applyStyle(element, options) {
        element.style.position = 'absolute';

        if (options.x !== undefined) element.style.left = this.formatUnit(options.x);
        if (options.y !== undefined) element.style.top = this.formatUnit(options.y);
        if (options.width !== undefined) element.style.width = this.formatUnit(options.width);
        if (options.height !== undefined) element.style.height = this.formatUnit(options.height);
    }

    formatUnit(value) {
        return typeof value === 'number' ? `${value}px` : value;
    }
}
