import { LayoutManager } from './LayoutManager.js';

/**
 * Layout manager using CSS Flexbox.
 */
export class FlexLayout extends LayoutManager {
    /**
     * @param {HTMLElement} container
     * @param {Object} [config]
     * @param {string} [config.direction='row'] - 'row' or 'column'.
     * @param {string} [config.justify='flex-start'] - 'flex-start', 'center', 'space-between', etc.
     * @param {string} [config.align='stretch'] - 'stretch', 'center', 'flex-start', etc.
     * @param {string} [config.wrap='nowrap'] - 'nowrap', 'wrap'.
     * @param {string|number} [config.gap='0'] - Gap between items.
     */
    constructor(container, config = {}) {
        super(container);
        this.config = {
            direction: config.direction || 'row',
            justify: config.justify || 'flex-start',
            align: config.align || 'stretch',
            wrap: config.wrap || 'nowrap',
            gap: config.gap || 0
        };
        this.updateContainerStyle();
    }

    updateContainerStyle() {
        this.container.style.display = 'flex';
        this.container.style.flexDirection = this.config.direction;
        this.container.style.justifyContent = this.config.justify;
        this.container.style.alignItems = this.config.align;
        this.container.style.flexWrap = this.config.wrap;
        this.container.style.gap = typeof this.config.gap === 'number' ? `${this.config.gap}px` : this.config.gap;
    }

    /**
     * @param {HTMLElement} element
     * @param {Object} options
     * @param {string|number} [options.grow] - Flex grow.
     * @param {string|number} [options.shrink] - Flex shrink.
     * @param {string|number} [options.basis] - Flex basis.
     * @param {string} [options.alignSelf] - Align self.
     */
    applyStyle(element, options) {
        if (options.grow !== undefined) element.style.flexGrow = options.grow;
        if (options.shrink !== undefined) element.style.flexShrink = options.shrink;
        if (options.basis !== undefined) element.style.flexBasis = typeof options.basis === 'number' ? `${options.basis}px` : options.basis;
        if (options.alignSelf !== undefined) element.style.alignSelf = options.alignSelf;
    }
}
