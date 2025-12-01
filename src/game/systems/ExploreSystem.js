import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        const geo = new THREE.PlaneGeometry(0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
        for (let i = 0; i < 50; i++) {
            const p = new THREE.Mesh(geo, mat.clone());
            p.visible = false;
            scene.add(p);
            this.particles.push({ mesh: p, life: 0, velocity: new THREE.Vector3() });
        }
    }

    spawnBurst(x, y, color, count = 10) {
        let spawned = 0;
        for (let p of this.particles) {
            if (p.life <= 0 && spawned < count) {
                p.mesh.visible = true;
                p.mesh.position.set(x, 0.5, y);
                p.mesh.material.color.setHex(color);
                p.mesh.material.opacity = 1;
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.05 + Math.random() * 0.05;
                p.velocity.set(Math.cos(angle) * speed, (Math.random() * 0.1), Math.sin(angle) * speed);
                p.life = 1.0;
                spawned++;
            }
        }
    }

    spawnSparkle(x, y) {
        let count = 5;
        let spawned = 0;
        for (let p of this.particles) {
            if (p.life <= 0 && spawned < count) {
                p.mesh.visible = true;
                p.mesh.position.set(x + (Math.random() - 0.5) * 0.5, 0.2, y + (Math.random() - 0.5) * 0.5);
                p.mesh.material.color.setHex(0xffff00);
                p.mesh.material.opacity = 1;
                p.life = 1.5;
                p.velocity.set(0, 0.03 + Math.random() * 0.02, 0);
                spawned++;
            }
        }
    }

    update() {
        for (let p of this.particles) {
            if (p.life > 0) {
                p.life -= 0.02;
                p.mesh.position.add(p.velocity);
                p.mesh.material.opacity = Math.min(1, p.life);
                p.mesh.rotation.z += 0.1;
                if (p.life <= 0) p.mesh.visible = false;
            }
        }
    }
}

export class ExploreSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.playerMesh = null;
        this.mapGroup = null;
        this.dynamicGroup = null;
        this.instancedFloor = null;
        this.instancedWalls = null;
        this.particles = null;
        this.moveLerpStart = new THREE.Vector3();
        this.moveLerpEnd = new THREE.Vector3();
        this.moveLerpProgress = 1;
        this.isAnimating = false;
        this.playerTarget = new THREE.Vector3();
        this.cameraLookCurrent = new THREE.Vector3();
        this.initialized = false;
        this.playerLight = null;
        this.matPlayer = null;
    }

    /** Initializes the exploration system. */
    init() {
        // Get shared renderer
        if (window.Game && window.Game.RenderManager) {
            window.Game.RenderManager.attachTo('explore-container');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x051015, 0.05);

        // Fixed PS1 Style Resolution (480x270)
        const targetW = 480;
        const targetH = 270;
        const aspect = targetW / targetH;

        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

        // Light setup
        this.scene.add(new THREE.AmbientLight(0x222222));
        const dirLight = new THREE.DirectionalLight(0x555555, 0.6);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this.playerLight = new THREE.PointLight(0x004444, 1.5, 15);
        this.scene.add(this.playerLight);

        const geo = new THREE.OctahedronGeometry(0.35);
        this.matPlayer = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x001133 });
        this.playerMesh = new THREE.Mesh(geo, this.matPlayer);
        this.playerMesh.userData.uid = 'player';
        this.scene.add(this.playerMesh);

        this.mapGroup = new THREE.Group();
        this.scene.add(this.mapGroup);

        this.dynamicGroup = new THREE.Group();
        this.scene.add(this.dynamicGroup);

        this.particles = new ParticleSystem(this.scene);

        this.initialized = true;
        this.rebuildLevel();
        this.animate();
    }

    /** Rebuilds the 3D map based on window.$gameMap */
    rebuildLevel() {
        if (!this.scene) return;
        this.mapGroup.clear();
        // Access Game_Map data directly
        if (!window.$gameMap) return;
        const mapData = window.$gameMap._data; // Direct access or via getter if exposed? _data is internal but accessible.
        // Actually Game_Map doesn't expose data via getter, only tileAt.
        // But for batch rendering, we need the whole grid.
        // Let's rely on _data for now as Game_Map is a trusted class.

        const map = mapData;
        const height = map.length;
        const width = map[0].length;
        const count = width * height;

        const geoFloor = new THREE.PlaneGeometry(0.95, 0.95);
        const matFloor = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.instancedFloor = new THREE.InstancedMesh(geoFloor, matFloor, count);

        const geoBlock = new THREE.BoxGeometry(0.95, 1, 0.95);
        const matWall = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        this.instancedWalls = new THREE.InstancedMesh(geoBlock, matWall, count);

        const dummy = new THREE.Object3D();
        let fIdx = 0, wIdx = 0;

        const hasFloorNeighbor = (x, y) => {
            const check = (nx, ny) => nx >= 0 && nx < width && ny >= 0 && ny < height && map[ny][nx] !== 1;
            return check(x + 1, y) || check(x - 1, y) || check(x, y + 1) || check(x, y - 1);
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (tile === 0 || tile >= 2) {
                    // Floor
                    dummy.position.set(x, 0, y);
                    dummy.rotation.set(-Math.PI / 2, 0, 0);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    this.instancedFloor.setMatrixAt(fIdx++, dummy.matrix);

                    // Special Static Tiles (Stairs)
                    if (tile === 3) {
                        const numSteps = 5;
                        const maxH = 0.4;
                        const sliceW = 0.8 / numSteps;
                        for (let s = 0; s < numSteps; s++) {
                            const h = maxH * (numSteps - s) / numSteps;
                            const yPos = h / 2;
                            const zPos = y - 0.4 + (s * sliceW) + (sliceW / 2);
                            const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, sliceW * 0.9), new THREE.MeshPhongMaterial({ color: 0x00ffaa, flatShading: true }));
                            step.position.set(x, yPos, zPos);
                            this.mapGroup.add(step);
                        }
                    }
                } else if (tile === 1) {
                    // Wall
                    if (hasFloorNeighbor(x, y)) {
                        dummy.position.set(x, 0.5, y);
                        dummy.rotation.set(0, 0, 0);
                        dummy.scale.set(1, 1, 1);
                        dummy.updateMatrix();
                        this.instancedWalls.setMatrixAt(wIdx++, dummy.matrix);
                    }
                }
            }
        }

        this.instancedFloor.count = fIdx;
        this.instancedWalls.count = wIdx;
        this.instancedFloor.instanceMatrix.needsUpdate = true;
        this.instancedWalls.instanceMatrix.needsUpdate = true;
        this.mapGroup.add(this.instancedFloor);
        this.mapGroup.add(this.instancedWalls);

        // Initial dynamic sync
        this.syncDynamic();

        const startX = window.$gameMap.playerPos.x;
        const startY = window.$gameMap.playerPos.y;
        this.playerMesh.position.set(startX, 0.5, startY);
        this.playerTarget.set(startX, 0.5, startY);
        this.cameraLookCurrent.set(startX, 0, startY);
        this.moveLerpProgress = 1;
        this.isAnimating = false;
    }

    /**
     * Synchronizes dynamic elements (enemies, loot, etc.) without rebuilding static geometry.
     */
    syncDynamic() {
        // Remove existing dynamic objects
        if (!this.dynamicGroup) {
            this.dynamicGroup = new THREE.Group();
            this.scene.add(this.dynamicGroup);
        }
        this.dynamicGroup.clear();

        if (!window.$gameMap) return;
        const map = window.$gameMap._data;
        const height = map.length;
        const width = map[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (tile === 2) { // Enemy
                    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                } else if (tile === 4) { // Gold
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshPhongMaterial({ color: 0xffd700 }));
                    mesh.position.set(x, 0.25, y);
                    this.dynamicGroup.add(mesh);
                } else if (tile === 5) { // Shop
                    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
                    mesh.position.set(x, 0.1, y);
                    this.dynamicGroup.add(mesh);
                }
                // Recruit(6), Shrine(7), Trap(8) can have markers too if desired
                else if (tile === 6) { // Recruit
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                } else if (tile === 7) { // Shrine
                    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshPhongMaterial({ color: 0xffffff }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                }
            }
        }
    }

    /** Resizes the canvas to match the window dimensions. */
    resize() {
        // Handled by RenderManager mostly, but we update camera aspect
        if (!this.camera) return;
        const targetW = 480;
        const targetH = 270;
        const aspect = targetW / targetH;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Moves the player in the given direction.
     * @param {number} dx - The change in X.
     * @param {number} dy - The change in Y.
     */
    move(dx, dy) {
        if (window.Game.ui.mode !== 'EXPLORE' || window.Game.ui.formationMode) return;
        if (this.isAnimating) return;

        const newX = window.$gameMap.playerPos.x + dx;
        const newY = window.$gameMap.playerPos.y + dy;
        const tile = window.$gameMap.tileAt(newX, newY);

        if (tile !== 1) {
            // Update Logical Position
            window.$gameMap._playerPos = { x: newX, y: newY };

            // Trigger Animation
            this.moveLerpStart.copy(this.playerMesh.position);
            this.moveLerpEnd.set(newX, 0.5, newY);
            this.moveLerpProgress = 0;
            this.playerTarget.set(newX, 0.5, newY);
            this.isAnimating = true;

            // Trigger events after delay or checkTile handles it
            this.checkTile(tile);
        }
    }

    /**
     * Checks the tile the player landed on and triggers its effect.
     * @param {number} code - The tile code.
     */
    checkTile(code) {
        this.resolveTile(code);
        window.Game.Windows.HUD.refresh();
        // Rebuild if map changed (e.g. loot picked up, floor changed)
        // resolveTile for gold/shop/etc sets tile to 0
        if (code === 2 || code === 3 || code === 4 || code === 5 || code === 6 || code === 7 || code === 8) {
            if (code !== 3) {
                // Only sync dynamic objects if not changing floor
                setTimeout(() => this.syncDynamic(), 300);
            }
        }
    }

    /**
     * Resolves the effect of stepping on a specific tile code.
     * @param {number} code - The tile code.
     */
    resolveTile(code) {
        const map = window.$gameMap;
        const pos = map.playerPos;

        if (code === 2) {
            map.setTile(pos.x, pos.y, 0);
            window.Game.BattleManager.startEncounter();
        } else if (code === 3) {
            map.floor++;
            Log.add('Descended...');
            // Generate new floor via Game_Map
            map.generateFloor();
            // Then rebuild 3D scene
            this.rebuildLevel();
        } else if (code === 4) {
            const treasure = Data.events.treasure;
            const amt = treasure.gold.base
                + Math.floor(Math.random() * treasure.gold.random)
                + treasure.gold.perFloor * map.floor;
            window.$gameParty.gainGold(amt);
            map.setTile(pos.x, pos.y, 0);
            Log.loot(`Found ${amt} Gold!`);
        } else if (code === 5) {
            map.setTile(pos.x, pos.y, 0);
            window.Game.Systems.Events.shop();
        } else if (code === 6) {
            map.setTile(pos.x, pos.y, 0);
            window.Game.Systems.Events.recruit();
        } else if (code === 7) {
            map.setTile(pos.x, pos.y, 0);
            window.Game.Systems.Events.shrine();
        } else if (code === 8) {
            map.setTile(pos.x, pos.y, 0);
            window.Game.Systems.Events.trap();
        }
    }

    /**
     * Main animation loop.
     */
    animate() {
        if (window.Game.ui.mode === 'EXPLORE') {
            requestAnimationFrame(() => this.animate());
        } else {
            requestAnimationFrame(() => this.animate());
        }

        if (!this.scene || !this.camera) return;

        // Movement Interpolation
        if (this.moveLerpProgress < 1) {
            this.moveLerpProgress += 0.06;
            if (this.moveLerpProgress > 1) this.moveLerpProgress = 1;

            this.playerMesh.position.lerpVectors(this.moveLerpStart, this.moveLerpEnd, this.moveLerpProgress);

            // Rotate player mesh
            this.playerMesh.rotation.y = this.moveLerpProgress * Math.PI * 2;

            if (this.moveLerpProgress === 1) {
                this.isAnimating = false;
                this.playerMesh.rotation.y = 0;
            }
        } else {
            this.playerMesh.position.lerp(this.playerTarget, 0.3);
        }

        // Bobbing effect
        this.playerMesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.05;
        this.playerLight.position.copy(this.playerMesh.position).add(new THREE.Vector3(0, 1, 0));

        // Camera follow
        const lx = this.playerTarget.x;
        const lz = this.playerTarget.z;
        this.cameraLookCurrent.x += (lx - this.cameraLookCurrent.x) * 0.1;
        this.cameraLookCurrent.z += (lz - this.cameraLookCurrent.z) * 0.1;

        const tx = this.playerTarget.x;
        const tz = this.playerTarget.z + 6;
        const ty = 6;

        this.camera.position.x += (tx - this.camera.position.x) * 0.1;
        this.camera.position.z += (tz - this.camera.position.z) * 0.1;
        this.camera.position.y += (ty - this.camera.position.y) * 0.1;
        this.camera.lookAt(this.cameraLookCurrent.x, 0, this.cameraLookCurrent.z - 2);

        this.particles.update();

        // Render using shared renderer
        const renderer = window.Game.RenderManager.getRenderer();
        if (renderer && window.Game.ui.mode === 'EXPLORE') {
            renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Helper to get generateFloor access if called from outside?
     * No, callers should use Game_Map then call rebuildLevel.
     * Or better, this wrapper:
     */
    generateAndRebuild() {
         if (window.$gameMap) {
             window.$gameMap.generateFloor();
             this.rebuildLevel();
         }
    }
}
