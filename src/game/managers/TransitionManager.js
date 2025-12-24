import { TransitionMaterials } from '../materials/TransitionMaterials.js';
import { RenderManager } from './RenderManager.js';
import { Config } from '../Config.js';
import * as Systems from '../systems.js';

export class TransitionManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.plane = null;
        this.renderer = null;
        this.renderTarget = null;

        // State
        this.activeMaterial = null;
        this.isAnimating = false;
        this.transitionCallback = null;
        this.startTime = 0;
        this.duration = 1000;

        // Materials
        this.matSwirl = null;
        this.matCutIn = null;
        this.matWipe = null;
    }

    init() {
        if (!window.Game || !window.Game.RenderManager) return;
        this.renderer = window.Game.RenderManager.getRenderer();

        // Setup Orthographic Scene for Fullscreen effects
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);

        // Initialize Materials
        this.matSwirl = new THREE.ShaderMaterial(TransitionMaterials.Swirl);
        this.matCutIn = new THREE.ShaderMaterial(TransitionMaterials.CutIn);
        this.matCutIn.transparent = true; // CutIn is an overlay
        this.matWipe = new THREE.ShaderMaterial(TransitionMaterials.DistortWipe);

        // Default to Swirl initially (or dummy)
        this.plane = new THREE.Mesh(geometry, this.matSwirl);
        this.scene.add(this.plane);

        // Setup RenderTarget for screen capture
        const width = Config.Resolution.RenderWidth;
        const height = Config.Resolution.RenderHeight;
        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
    }

    /**
     * Captures the current content of the renderer to a texture.
     * @param {THREE.Scene} sourceScene
     * @param {THREE.Camera} sourceCamera
     */
    captureScreen(sourceScene, sourceCamera) {
        if (!this.renderer || !sourceScene || !sourceCamera) return;

        // Temporarily render to target
        const oldTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.clear();
        this.renderer.render(sourceScene, sourceCamera);
        this.renderer.setRenderTarget(oldTarget);

        return this.renderTarget.texture;
    }

    /**
     * Runs the "Swirl to Battle" transition.
     * @param {THREE.Scene} currentScene
     * @param {THREE.Camera} currentCamera
     * @returns {Promise<void>}
     */
    runBattleStart(currentScene, currentCamera) {
        return new Promise((resolve) => {
            if (!this.renderer) { resolve(); return; }

            // 1. Capture Screen
            const texture = this.captureScreen(currentScene, currentCamera);

            // 2. Setup Material
            this.activeMaterial = this.matSwirl;
            this.activeMaterial.uniforms.tDiffuse.value = texture;
            this.activeMaterial.uniforms.uProgress.value = 0.0;
            const aspect = Config.Resolution.RenderWidth / Config.Resolution.RenderHeight;
            this.activeMaterial.uniforms.uAspectRatio.value = aspect;

            this.plane.material = this.activeMaterial;

            // 3. Start Animation Loop
            this.startTime = performance.now();
            this.duration = 1500; // 1.5s swirl
            this.transitionCallback = resolve;

            // Hijack render loop
            window.Game.ui.transitioning = true;
            this.isAnimating = true;

            this._animateSwirl();
        });
    }

    _animateSwirl() {
        if (!this.isAnimating) return;

        const now = performance.now();
        const elapsed = now - this.startTime;
        const progress = Math.min(1.0, elapsed / this.duration);

        // Easing? Linear is fine for swirl usually
        this.activeMaterial.uniforms.uProgress.value = progress;

        // Render Transition Plane
        this.renderer.render(this.scene, this.camera);

        if (progress < 1.0) {
            requestAnimationFrame(() => this._animateSwirl());
        } else {
            // Finish
            this.isAnimating = false;
            // Note: We leave window.Game.ui.transitioning = true because the NEXT step (Intro) picks it up
            if (this.transitionCallback) this.transitionCallback();
        }
    }

    /**
     * Runs the "Cut In" Battle Intro.
     * Renders the underlying Battle Scene + The Overlay.
     * @returns {Promise<void>}
     */
    runBattleIntro() {
        return new Promise((resolve) => {
            if (!this.renderer) { resolve(); return; }

            // Setup Material
            this.activeMaterial = this.matCutIn;
            this.activeMaterial.uniforms.uProgress.value = 0.0; // Closed

            this.plane.material = this.activeMaterial;

            this.startTime = performance.now();
            this.duration = 2000; // 2s open
            this.transitionCallback = resolve;

            // Assume Scene has already switched to Battle, so BattleRenderSystem is active
            // But we need to control the loop to overlay.
            window.Game.ui.transitioning = true;
            this.isAnimating = true;

            this._animateIntro();
        });
    }

    _animateIntro() {
        if (!this.isAnimating) return;

        const now = performance.now();
        const elapsed = now - this.startTime;
        const progress = Math.min(1.0, elapsed / this.duration);

        // Ease Out Quart for dramatic opening
        const ease = 1 - Math.pow(1 - progress, 4);

        this.activeMaterial.uniforms.uProgress.value = ease;

        // 1. Render Battle Scene (Manually)
        // We need to access BattleRenderSystem's scene/camera
        const battleSys = Systems.Battle3D;
        if (battleSys && battleSys.scene && battleSys.camera) {
            // Update Camera Easing logic manually here or assume BattleRenderSystem.updateIntroCamera() is called?
            // Let's call the update method on the system if it exists
            if (battleSys.updateIntroCamera) battleSys.updateIntroCamera();

            this.renderer.autoClear = true;
            this.renderer.render(battleSys.scene, battleSys.camera);
        }

        // 2. Render Overlay (No Clear)
        this.renderer.autoClear = false;
        this.renderer.render(this.scene, this.camera);
        this.renderer.autoClear = true; // Restore

        if (progress < 1.0) {
            requestAnimationFrame(() => this._animateIntro());
        } else {
            this.isAnimating = false;
            window.Game.ui.transitioning = false; // Release control
            if (this.transitionCallback) this.transitionCallback();
        }
    }

    /**
     * Map Transfer Wipe (Out then In).
     * @param {Function} middleCallback - Called when screen is fully black (to change map).
     */
    runMapTransfer(middleCallback) {
        return new Promise(async (resolve) => {
            if (!this.renderer) { if(middleCallback) middleCallback(); resolve(); return; }

            window.Game.ui.transitioning = true;
            this.isAnimating = true;

            // Part 1: Wipe Out (To Black)
            // Capture current map
            const exploreSys = Systems.Explore;
            const tex = this.captureScreen(exploreSys.scene, exploreSys.camera);

            this.activeMaterial = this.matWipe;
            this.activeMaterial.uniforms.tDiffuse.value = tex;
            this.activeMaterial.uniforms.uProgress.value = 0.0;
            this.activeMaterial.uniforms.uTime.value = 0.0;

            this.plane.material = this.activeMaterial;

            await this._animateWipe(0.0, 1.0); // Animate 0 -> 1

            // Middle: Change Map
            if (middleCallback) middleCallback();

            // Wait a frame for map to rebuild?
            await new Promise(r => requestAnimationFrame(r));

            // Part 2: Wipe In (From Black)
            // For Wipe In, we want to show the NEW map appearing.
            // But our shader "masks" to black based on progress.
            // If we capture the NEW map, and animate uProgress 1 -> 0, it will reveal the map.

            // Capture NEW map
            const newTex = this.captureScreen(exploreSys.scene, exploreSys.camera);
            this.activeMaterial.uniforms.tDiffuse.value = newTex;
            this.activeMaterial.uniforms.uProgress.value = 1.0;

            await this._animateWipe(1.0, 0.0); // Animate 1 -> 0

            this.isAnimating = false;
            window.Game.ui.transitioning = false;
            resolve();
        });
    }

    _animateWipe(from, to) {
        return new Promise(resolve => {
            const start = performance.now();
            const duration = 1000;

            const loop = () => {
                const now = performance.now();
                const p = Math.min(1.0, (now - start) / duration);
                const val = from + (to - from) * p;

                this.activeMaterial.uniforms.uProgress.value = val;
                this.activeMaterial.uniforms.uTime.value = now * 0.001;

                this.renderer.render(this.scene, this.camera);

                if (p < 1.0) {
                    requestAnimationFrame(loop);
                } else {
                    resolve();
                }
            };
            loop();
        });
    }
}
