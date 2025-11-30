export class RenderManager {
    constructor() {
        if (RenderManager.instance) return RenderManager.instance;
        RenderManager.instance = this;

        // Fixed PS1 Style Resolution (480x270)
        this.width = 480;
        this.height = 270;

        this.renderer = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false
        });

        this.renderer.setPixelRatio(1); // Force 1:1 pixel ratio
        this.renderer.setSize(this.width, this.height, false);
        this.renderer.domElement.id = 'shared-canvas-3d';

        // Ensure canvas scales up
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.imageRendering = 'pixelated';

        this.initialized = true;
    }

    getRenderer() {
        if (!this.initialized) this.init();
        return this.renderer;
    }

    resize() {
        if (!this.renderer) return;

        // Resolution is fixed 480x270, but we might need to re-apply it if something changed it?
        // Actually, existing code just re-asserts the size.

        const aspect = this.width / this.height;
        this.renderer.setSize(this.width, this.height, false);
        return aspect;
    }

    /**
     * Clears the renderer.
     * @param {boolean} color - Clear color buffer.
     * @param {boolean} depth - Clear depth buffer.
     * @param {boolean} stencil - Clear stencil buffer.
     */
    clear(color = true, depth = true, stencil = true) {
        if (this.renderer) {
            this.renderer.clear(color, depth, stencil);
        }
    }

    /**
     * Attach the renderer canvas to a container.
     * @param {string|HTMLElement} containerIdOrElement
     */
    attachTo(containerIdOrElement) {
        if (!this.renderer) this.init();
        const container = typeof containerIdOrElement === 'string'
            ? document.getElementById(containerIdOrElement)
            : containerIdOrElement;

        if (container) {
            // Only append if not already there to avoid unnecessary DOM ops
            if (container.firstChild !== this.renderer.domElement) {
                container.innerHTML = '';
                container.appendChild(this.renderer.domElement);
            }
        }
    }
}
