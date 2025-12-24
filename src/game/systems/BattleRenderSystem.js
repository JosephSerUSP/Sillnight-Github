import { resolveAssetPath } from '../core.js';
import * as Systems from '../systems.js';
import { Config } from '../Config.js';

export class BattleRenderSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.group = null;
        this.sprites = {};
        this.textureLoader = null;
        this.textureCache = {};
        this.spriteScaleFactor = 3;
        this.groundMesh = null;
        this.defaultGround = 'src/assets/images/battlefield/floors/RuinedTile1.png';
        this.currentGroundPath = null;
        this.cameraState = { angle: -Math.PI / 4, targetAngle: -Math.PI / 4, targetX: 0, targetY: 0 };
    }

    /** Initializes the 3D scene. */
    init() {
         // Get shared renderer
         if (window.Game && window.Game.RenderManager) {
            // Ensure Effekseer init works.
            if (Systems.Effekseer) {
                Systems.Effekseer.init(window.Game.RenderManager.getRenderer());
            }
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Fixed Resolution 480x270
        const targetW = Config.Resolution.RenderWidth;
        const targetH = Config.Resolution.RenderHeight;
        const aspect = targetW / targetH;

        this.camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 1000);
        this.camera.up.set(0, 0, 1);

        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(10, -10, 20);
        this.scene.add(amb);
        this.scene.add(dir);

        this.textureLoader = new THREE.TextureLoader();
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Initialize ground
        this.setGroundTexture(this.defaultGround);

        this.animate();
    }

    /**
     * Sets the ground texture for the battle scene.
     * @param {string} path - The path to the texture image.
     */
    setGroundTexture(path) {
        if (!path) return;
        const resolved = resolveAssetPath(path);
        if (this.currentGroundPath === resolved && this.groundMesh) return;

        this.currentGroundPath = resolved;
        const loader = this.textureLoader || new THREE.TextureLoader();

        loader.load(resolved, (tex) => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;

            if (this.groundMesh) {
                this.groundMesh.material.map = tex;
                this.groundMesh.material.transparent = true;
                this.groundMesh.material.needsUpdate = true;
                this.groundMesh.renderOrder = -1;
            } else {
                const geom = new THREE.PlaneGeometry(60, 60);
                const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1.0, metalness: 0.0, transparent: true });
                this.groundMesh = new THREE.Mesh(geom, mat);
                this.groundMesh.receiveShadow = true;
                this.groundMesh.position.z = -0.05;
                this.groundMesh.renderOrder = -1;
                if (this.scene) this.scene.add(this.groundMesh);
            }
        });
    }

    /** Resizes the renderer and camera aspect ratio. */
    resize() {
        if (!this.camera) return;
        const targetW = Config.Resolution.RenderWidth;
        const targetH = Config.Resolution.RenderHeight;
        const aspect = targetW / targetH;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Sets up the battle scene with ally and enemy sprites.
     * @param {Array<Object>} allies - The list of ally units.
     * @param {Array<Object>} enemies - The list of enemy units.
     */
    setupScene(allies, enemies) {
        const mapOverride = window.$gameMap?.visuals?.battleGround;
        this.setGroundTexture(mapOverride || this.defaultGround);

        this.group.clear();
        this.sprites = {};
        const getPos = (isEnemy, unit) => {
            const rowOffset = isEnemy ? 2.5 : -2.5;
            const backOffset = isEnemy ? 2 : -2;
            const xMap = [-2, 0, 2];
            const col = unit.slotIndex % 3;
            const row = Math.floor(unit.slotIndex / 3);

            if (!isEnemy && unit.isSummoner) {
                return {
                    x: 0,
                    y: rowOffset + (backOffset * 2.5)
                };
            }

            return { x: xMap[col], y: rowOffset + (backOffset * row) };
        };
        const loadTexture = (assetPath, ready) => {
            if (!assetPath || !this.textureLoader) return ready(null);
            const resolvedPath = resolveAssetPath(assetPath);
            if (!resolvedPath) return ready(null);
            if (this.textureCache[resolvedPath]) return ready(this.textureCache[resolvedPath]);
            this.textureLoader.load(
                resolvedPath,
                (texture) => {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    this.textureCache[resolvedPath] = texture;
                    ready(texture);
                },
                undefined,
                () => ready(null)
            );
        };
        const computeSpriteScale = (texture) => {
            const aspect = (texture?.image?.width && texture?.image?.height)
                ? texture.image.width / texture.image.height
                : 1;
            const referencePixelHeight = 64;
            const targetHeight = (texture?.image?.height)
                ? Math.max(1, Math.round((texture.image.height / referencePixelHeight) * this.spriteScaleFactor))
                : this.spriteScaleFactor;
            return { x: targetHeight * aspect, y: targetHeight };
        };
        const createSprite = (unit, isEnemy) => {
            if (!unit) return;
            const pos = getPos(isEnemy, unit);
            const addSpriteToScene = (texture) => {
                if (!texture) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 128; canvas.height = 128;
                    const cx = canvas.getContext('2d');
                    cx.font = '90px serif';
                    cx.textAlign = 'center';
                    cx.textBaseline = 'middle';
                    cx.fillStyle = 'white';
                    cx.shadowColor = 'black';
                    cx.shadowBlur = 4;
                    cx.fillText(unit.sprite, 64, 74);
                    texture = new THREE.CanvasTexture(canvas);
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                }
                const mat = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    depthWrite: false,
                    alphaTest: 0.01
                });
                const sprite = new THREE.Sprite(mat);
                const baseScale = computeSpriteScale(texture);
                sprite.scale.set(baseScale.x, baseScale.y, 1);
                sprite.position.set(pos.x, pos.y, baseScale.y / 2);
                sprite.userData.uid = unit.uid;
                sprite.userData.baseScale = baseScale;
                sprite.userData.baseZ = baseScale.y / 2;

                const shadow = new THREE.Mesh(
                    new THREE.CircleGeometry(0.8, 16),
                    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true })
                );
                shadow.position.set(pos.x, pos.y, -0.04);
                shadow.renderOrder = -0.5;
                this.group.add(sprite);
                this.group.add(shadow);
                this.sprites[unit.uid] = sprite;
            };
            if (unit.spriteAsset) {
                loadTexture(unit.spriteAsset, addSpriteToScene);
            } else {
                addSpriteToScene(null);
            }
        };
        allies.forEach(u => createSprite(u, false));
        enemies.forEach(u => createSprite(u, true));
    }

    /**
     * Moves the camera focus to a specific target type.
     * @param {string} type - 'ally', 'enemy', 'victory', 'unit', or default.
     * @param {string} [targetUid] - The UID of the unit to focus on (if type is 'unit').
     */
    setFocus(type, targetUid) {
        const BASE = -Math.PI / 4;
        const SHIFT = Math.PI / 12;
        if (type === 'ally') {
            this.cameraState.targetAngle = BASE - SHIFT;
            this.cameraState.targetX = 0;
            this.cameraState.targetY = 0;
            this.cameraState.zoom = false;
        } else if (type === 'enemy') {
            this.cameraState.targetAngle = BASE + SHIFT;
            this.cameraState.targetX = 0;
            this.cameraState.targetY = 0;
            this.cameraState.zoom = false;
        } else if (type === 'victory') {
            this.cameraState.targetAngle = this.cameraState.angle + Math.PI * 2;
            this.cameraState.targetX = 0;
            this.cameraState.targetY = -3.5;
            this.cameraState.zoom = false;
        } else if (type === 'unit' && targetUid) {
            const sprite = this.sprites[targetUid];
            if (sprite) {
                this.cameraState.targetAngle = this.cameraState.angle + Math.PI * 2; // Continue rotation
                this.cameraState.targetX = sprite.position.x;
                this.cameraState.targetY = sprite.position.y;
                this.cameraState.zoom = true;
            }
        } else {
            if (this.cameraState.angle > Math.PI * 2 || this.cameraState.angle < -Math.PI * 2) {
                this.cameraState.angle = BASE;
            }
            this.cameraState.targetAngle = BASE;
            this.cameraState.targetX = 0;
            this.cameraState.targetY = 0;
            this.cameraState.zoom = false;
        }
    }

    /**
     * Dims all sprites except the specified one.
     * @param {string} exceptUid - The UID of the unit to keep bright.
     */
    dimOthers(exceptUid) {
        Object.values(this.sprites).forEach(sprite => {
            if (sprite.userData.uid !== exceptUid) {
                sprite.material.opacity = 0.2;
            } else {
                sprite.material.opacity = 1.0;
            }
        });
    }

    /**
     * Resets all visual changes (opacity, etc).
     */
    resetVisuals() {
        Object.values(this.sprites).forEach(sprite => {
            sprite.material.opacity = 1.0;
            sprite.material.color.setHex(0xffffff);
        });
    }

    /**
     * Main animation loop for the 3D scene.
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        const cs = this.cameraState;
        if (window.Game.ui.mode === 'BATTLE_WIN') {
            cs.angle += 0.005;
        } else {
            cs.angle += (cs.targetAngle - cs.angle) * 0.05;
        }

        // Drive Scene Updates
        if (window.Game && window.Game.SceneManager) {
            window.Game.SceneManager.update();
        }

        // If zooming in (for level up), reduce R and Z height
        let R = 28.28;
        let Z_HEIGHT = 16;

        if (cs.zoom) {
            R = 10.0;
            Z_HEIGHT = 5.0;
        }

        this.camera.position.x = cs.targetX + Math.cos(cs.angle) * R;
        this.camera.position.y = cs.targetY + Math.sin(cs.angle) * R;
        // Smooth Z transition could be added here, but direct assignment for now
        this.camera.position.z = this.camera.position.z + (Z_HEIGHT - this.camera.position.z) * 0.1;

        this.camera.lookAt(cs.targetX, cs.targetY, 2);

        const renderer = window.Game.RenderManager.getRenderer();
        if (renderer && (window.Game.ui.mode === 'BATTLE' || window.Game.ui.mode === 'BATTLE_WIN')) {
            renderer.render(this.scene, this.camera);
            if (Systems.Effekseer) {
                Systems.Effekseer.update(this.camera);
            }
        }
    }

    /**
     * Projects a 3D object's position to 2D screen coordinates.
     * @param {THREE.Object3D} obj - The object to project.
     * @returns {Object} The {x, y} screen coordinates.
     */
    toScreen(obj) {
        const vec = new THREE.Vector3();
        obj.updateMatrixWorld();
        this.camera.updateMatrixWorld();
        vec.setFromMatrixPosition(obj.matrixWorld);
        vec.project(this.camera);

        // Map 0..1 coordinates to the UI container size
        const width = Config.Resolution.LogicWidth;
        const height = Config.Resolution.LogicHeight;

        return {
            x: (vec.x * 0.5 + 0.5) * width,
            y: (-(vec.y * 0.5) + 0.5) * height
        };
    }

    /**
     * Resets a sprite's visual state (color, opacity, scale, position).
     * @param {string} uid - The unit ID.
     */
    resetSprite(uid) {
        const sprite = this.sprites[uid];
        if (sprite) {
            sprite.material.color.setHex(0xffffff);
            sprite.material.blending = THREE.NormalBlending;
            sprite.material.opacity = 1.0;
            const baseScale = sprite.userData?.baseScale || { x: this.spriteScaleFactor, y: this.spriteScaleFactor };
            sprite.scale.set(baseScale.x, baseScale.y, 1);
            const baseZ = sprite.userData?.baseZ ?? baseScale.y / 2;
            sprite.position.z = baseZ;
        }
    }

    /**
     * Plays a death fade animation for a unit.
     * @param {string} uid - The unit ID.
     */
    playDeathFade(uid) {
        const sprite = this.sprites[uid];
        if (!sprite) return;

        const duration = 800;
        let startTime = null;
        const startZ = sprite.position.z;
        const baseHeight = sprite.userData.baseScale.y;

        const animateFade = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const p = Math.min(1, elapsed / duration);

            const easeIn = p * p;
            const easeOut = p * (2 - p);

            sprite.material.blending = THREE.AdditiveBlending;
            sprite.material.color.setHex(0xff00ff);

            const newScaleX = sprite.userData.baseScale.x * (1 - easeIn);
            const newScaleY = baseHeight * (1 + easeOut * 2);

            sprite.scale.x = newScaleX;
            sprite.scale.y = newScaleY;

            const heightDifference = newScaleY - baseHeight;
            sprite.position.z = startZ + (heightDifference / 2);

            sprite.material.opacity = 1 - easeIn;

            if (p < 1) {
                requestAnimationFrame(animateFade);
            } else {
                sprite.visible = false;
            }
        };
        requestAnimationFrame(animateFade);
    }

    /**
     * Shows a bouncing damage number above a unit.
     * @param {string} uid - The unit ID.
     * @param {number} val - The damage value.
     * @param {boolean} [isCrit=false] - Whether it was a critical hit.
     */
    showDamageNumber(uid, val, isCrit = false) {
        if (val === 0) return;
        const sprite = this.sprites[uid];
        if (!sprite) return;

        // Get screen position of the sprite head/top
        const headPos = sprite.position.clone();
        headPos.z += (sprite.userData.baseScale.y * 0.5);

        // Re-implement toScreen logic inline for vector since toScreen takes object
        const vec = headPos.clone();
        vec.project(this.camera);
        const width = Config.Resolution.LogicWidth;
        const height = Config.Resolution.LogicHeight;
        const x = (vec.x * 0.5 + 0.5) * width;
        const y = (-(vec.y * 0.5) + 0.5) * height;

        import('../PopupManager.js').then(({ PopupManager }) => {
            PopupManager.spawn(x, y, val, isCrit);
        });
    }

    /**
     * Plays a sequence of animations for a unit.
     * @param {string} uid - The unit ID.
     * @param {Array<Object>} steps - The animation steps.
     * @param {Object} [context={}] - Context containing targets and callbacks.
     */
    playAnim(uid, steps = [], context = {}) {
        const sprite = this.sprites[uid];
        if (!sprite) { context.onComplete?.(); return; }
        this.resetSprite(uid);
        const origin = sprite.position.clone();
        const targets = context.targets || [];

        const wait = (ms) => new Promise(res => setTimeout(res, ms));
        const averageTargetPosition = () => {
            if (!targets.length) return { x: origin.x, y: origin.y, z: origin.z };
            const total = targets.reduce((acc, t) => {
                const ts = this.sprites[t.uid];
                if (ts) {
                    acc.x += ts.position.x;
                    acc.y += ts.position.y;
                    acc.z += ts.position.z;
                    acc.count++;
                }
                return acc;
            }, { x: 0, y: 0, z: 0, count: 0 });
            const divisor = Math.max(1, total.count);
            return { x: total.x / divisor, y: total.y / divisor, z: total.z / divisor };
        };

        const stepHandlers = {
            // FIXED FEEDBACK HANDLER (Flicker Shake)
            feedback: (step) => new Promise(resolve => {
                const boundSprites = step.bind === 'target' ? targets.map(t => this.sprites[t.uid]).filter(Boolean) : [sprite];
                const startPositions = boundSprites.map(sp => sp.position.clone());
                const duration = step.duration || 250;
                let startTime = null;

                const animateFlash = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    const p = Math.min(1, elapsed / duration);
                    const isFlashFrame = Math.floor(elapsed / 40) % 2 === 0;
                    const currentShake = (step.shake || 0) * (1 - p);

                    boundSprites.forEach((sp, i) => {
                        const base = startPositions[i];
                        if (currentShake > 0) {
                            sp.position.x = base.x + (Math.random() - 0.5) * currentShake;
                            sp.position.y = base.y + (Math.random() - 0.5) * currentShake;
                        }
                        if (step.color) {
                            if (isFlashFrame) {
                                sp.material.color.setHex(step.color);
                                sp.material.blending = THREE.AdditiveBlending;
                            } else {
                                sp.material.color.setHex(0xffffff);
                                sp.material.blending = THREE.NormalBlending;
                            }
                        }
                    });

                    if (p < 1) {
                        requestAnimationFrame(animateFlash);
                    } else {
                        boundSprites.forEach((sp, i) => {
                            sp.position.copy(startPositions[i]);
                            this.resetSprite(sp.userData.uid);
                        });
                        resolve();
                    }
                };
                requestAnimationFrame(animateFlash);
            }),
            wait: (step) => wait(step.duration || 300),
            jump: (step) => new Promise(resolve => {
                const axis = 'z';
                const startPos = sprite.position[axis];
                const amp = step.height || 0.8;
                const duration = step.duration || 500;
                let startTime = null;
                const animateJump = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    const progress = Math.min(1, elapsed / duration);
                    sprite.position[axis] = startPos + Math.sin(progress * Math.PI) * amp;
                    if (progress < 1) {
                        requestAnimationFrame(animateJump);
                    } else {
                        sprite.position[axis] = startPos;
                        resolve();
                    }
                };
                requestAnimationFrame(animateJump);
            }),
            approach: (step) => new Promise(resolve => {
                const targetPos = averageTargetPosition();
                const dir = new THREE.Vector3(targetPos.x - origin.x, targetPos.y - origin.y, 0);
                if (dir.length() === 0) { resolve(); return; }
                dir.normalize();
                dir.multiplyScalar(step.distance || 1);
                const destination = {
                    x: origin.x + dir.x,
                    y: origin.y + dir.y,
                    z: sprite.position.z
                };
                const duration = step.duration || 250;
                let startTime = null;
                const animateMove = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    const p = Math.min(1, elapsed / duration);
                    sprite.position.x = origin.x + (destination.x - origin.x) * p;
                    sprite.position.y = origin.y + (destination.y - origin.y) * p;
                    if (p < 1) {
                        requestAnimationFrame(animateMove);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(animateMove);
            }),
            retreat: (step) => new Promise(resolve => {
                const duration = step.duration || 250;
                const start = sprite.position.clone();
                let startTime = null;
                const animateMove = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    const p = Math.min(1, elapsed / duration);
                    sprite.position.lerpVectors(start, origin, p);
                    if (p < 1) {
                        requestAnimationFrame(animateMove);
                    } else {
                        sprite.position.copy(origin);
                        resolve();
                    }
                };
                requestAnimationFrame(animateMove);
            }),
            effect: (step) => {
                const boundSprites = step.bind === 'target' ? targets.map(t => this.sprites[t.uid]).filter(Boolean) : [sprite];
                const plays = boundSprites.map(sp => {
                    const anchor = step.anchor ?? 0.5;
                    const zOffset = sp.position.z - sp.userData.baseZ;
                    const zPos = zOffset + (sp.userData.baseScale.y * anchor);
                    const pos = { x: sp.position.x, y: sp.position.y, z: zPos };
                    return Systems.Effekseer.play(step.effect, pos);
                });
                const hold = step.hold ?? 300;
                return Promise.all(plays).then(() => wait(hold));
            },
            apply: (step) => {
                context.onApply?.();
                return wait(step?.duration || 0);
            }
        };

        const runStep = (idx) => {
            if (idx >= steps.length) {
                sprite.position.copy(origin);
                context.onComplete?.();
                return;
            }
            const step = steps[idx];
            const handler = stepHandlers[step.type];
            (handler ? handler(step) : Promise.resolve()).then(() => runStep(idx + 1));
        };

        if (steps.length === 0) { context.onComplete?.(); return; }
        runStep(0);
    }
}
