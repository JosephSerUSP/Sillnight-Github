import { LayoutManager } from './LayoutManager.js';

/**
 * Layout manager using CSS Grid.
 */
export class GridLayout extends LayoutManager {
    /**
     * @param {HTMLElement} container
     * @param {Object} [config]
     * @param {string} [config.columns='1fr'] - Grid template columns (e.g., '1fr 1fr', 'repeat(3, 1fr)').
     * @param {string} [config.rows='auto'] - Grid template rows.
     * @param {string|number} [config.gap='0'] - Grid gap.
     */
    constructor(container, config = {}) {
        super(container);
        this.config = {
            columns: config.columns || '1fr',
            rows: config.rows || 'auto',
            gap: config.gap || 0
        };
        this.updateContainerStyle();
    }

    updateContainerStyle() {
        this.container.style.display = 'grid';
        this.container.style.gridTemplateColumns = this.config.columns;
        this.container.style.gridTemplateRows = this.config.rows;
        this.container.style.gap = typeof this.config.gap === 'number' ? `${this.config.gap}px` : this.config.gap;
    }

    /**
     * @param {HTMLElement} element
     * @param {Object} options
     * @param {string|number} [options.col] - Grid column (e.g., '1 / span 2').
     * @param {string|number} [options.row] - Grid row.
     */
    applyStyle(element, options) {
        if (options.col !== undefined) element.style.gridColumn = options.col;
        if (options.row !== undefined) element.style.gridRow = options.row;
    }
}
