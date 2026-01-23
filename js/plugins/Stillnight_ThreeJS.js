/*:
 * @target MZ
 * @plugindesc Renders Map and Battle in 3D using Three.js
 * @author Stillnight
 * @help
 * This plugin replaces Pixi.js rendering for Map and Battle scenes with Three.js.
 *
 * It requires three.min.js in js/libs/.
 */

(() => {
    const pluginName = "Stillnight_ThreeJS";

    // -----------------------------------------------------------------------------
    // Loader: Ensure Three.js is loaded
    // -----------------------------------------------------------------------------
    function loadThreeJS() {
        if (typeof THREE !== 'undefined') return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'js/libs/three.min.js';
            script.async = false;
            script.onload = () => {
                console.log('Three.js loaded successfully.');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Three.js');
                reject(new Error('Failed to load Three.js'));
            };
            document.body.appendChild(script);
        });
    }

    // Initialize Plugin
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        loadThreeJS().then(() => {
            _Scene_Boot_start.call(this);
        });
    };

    // -----------------------------------------------------------------------------
    // Geometry Helper: Merge
    // -----------------------------------------------------------------------------
    function mergeGeometries(geometries) {
        if (geometries.length === 0) return new THREE.BufferGeometry();

        let totalVertices = 0;
        let totalIndices = 0;
        geometries.forEach(g => {
            totalVertices += g.attributes.position.count;
            if (g.index) totalIndices += g.index.count;
        });

        const positionData = new Float32Array(totalVertices * 3);
        const normalData = new Float32Array(totalVertices * 3);
        const uvData = new Float32Array(totalVertices * 2);
        const indexData = totalIndices > 0 ? (totalVertices > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices)) : null;

        let vOffset = 0;
        let iOffset = 0;

        geometries.forEach(g => {
            const pos = g.attributes.position;
            const norm = g.attributes.normal;
            const uv = g.attributes.uv;
            const index = g.index;

            positionData.set(pos.array, vOffset * 3);
            if (norm) normalData.set(norm.array, vOffset * 3);
            if (uv) uvData.set(uv.array, vOffset * 2);

            if (index && indexData) {
                for (let i = 0; i < index.count; i++) {
                    indexData[iOffset + i] = index.getX(i) + vOffset;
                }
                iOffset += index.count;
            }

            vOffset += pos.count;
        });

        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.BufferAttribute(positionData, 3));
        merged.setAttribute('normal', new THREE.BufferAttribute(normalData, 3));
        merged.setAttribute('uv', new THREE.BufferAttribute(uvData, 2));
        if (indexData) merged.setIndex(new THREE.BufferAttribute(indexData, 1));

        return merged;
    }

    // -----------------------------------------------------------------------------
    // ThreeMapSystem
    // -----------------------------------------------------------------------------
    class ThreeMapSystem {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.mapMesh = null;
            this.playerMesh = null;
            this.isReady = false;
        }

        init() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);

            const aspect = Graphics.width / Graphics.height;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            this.camera.position.set(0, 10, 10);
            this.camera.lookAt(0, 0, 0);

            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.renderer.setSize(Graphics.width, Graphics.height);
            this.renderer.domElement.id = 'three-canvas-map';
            this.renderer.domElement.style.zIndex = '0';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';

            document.body.appendChild(this.renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
            dirLight.position.set(5, 10, 5);
            this.scene.add(dirLight);

            this.isReady = true;
        }

        buildMap() {
            if (!this.scene) return;

            if (this.mapMesh) {
                this.scene.remove(this.mapMesh);
                if (this.mapMesh.geometry) this.mapMesh.geometry.dispose();
                this.mapMesh = null;
            }
            if (this.playerMesh) {
                this.scene.remove(this.playerMesh);
                this.playerMesh = null;
            }

            const width = $gameMap.width();
            const height = $gameMap.height();

            // Assuming A5 tileset for simplicity of UV mapping
            let texture = null;
            if ($gameMap.tileset()) {
                const tilesetName = $gameMap.tileset().tilesetNames[4]; // A5
                if (tilesetName) {
                    const bitmap = ImageManager.loadTileset(tilesetName);
                    // Force load check in a real scenario, here we rely on it being cached or loading eventually
                    // Note: If texture isn't ready, UVs will be correct but image might be blank initially.
                    texture = new THREE.TextureLoader().load(bitmap.url);
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                }
            }

            const geometries = [];

            // Helper to update UVs
            // A5 is 8 columns wide (384px / 48px) and usually 16 rows (768px / 48px)
            const COLS = 8;
            const ROWS = 16;
            const UNIT_U = 1 / COLS;
            const UNIT_V = 1 / ROWS;
            const A5_START = 1536;

            const getUVs = (tileId) => {
                let localId = 0;
                if (tileId >= A5_START) localId = tileId - A5_START;
                // Fallback for non-A5: map to index 0
                const col = localId % COLS;
                const row = Math.floor(localId / COLS);
                // UV origin is bottom-left in ThreeJS, top-left in image
                // u: col * unit
                // v: 1 - ((row + 1) * unit)
                const u1 = col * UNIT_U;
                const v1 = 1 - ((row + 1) * UNIT_V);
                const u2 = (col + 1) * UNIT_U;
                const v2 = 1 - (row * UNIT_V);

                // Return [tl, tr, bl, br] ? No, BufferGeometry uv is [u,v, u,v...] per vertex
                // Box faces: Right, Left, Top, Bottom, Front, Back.
                // Plane: usually 2 triangles (TL, BL, TR, TR, BL, BR) or similar quad.
                return { u1, v1, u2, v2 };
            };

            const applyUVs = (geo, tileId) => {
                const { u1, v1, u2, v2 } = getUVs(tileId);
                const uvAttribute = geo.attributes.uv;

                // For a PlaneGeometry(1,1) -> 4 vertices (indexed) or non-indexed?
                // ThreeJS PlaneGeometry is indexed. 4 vertices: TL, TR, BL, BR (order depends)
                // Default: 0: (-.5, .5), 1: (.5, .5), 2: (-.5, -.5), 3: (.5, -.5) ?
                // Let's assume standard UVs are (0,1), (1,1), (0,0), (1,0).

                for (let i = 0; i < uvAttribute.count; i++) {
                    const u = uvAttribute.getX(i);
                    const v = uvAttribute.getY(i);

                    // Remap 0..1 to u1..u2 and v1..v2
                    const newU = u1 + u * (u2 - u1);
                    const newV = v1 + v * (v2 - v1);

                    uvAttribute.setXY(i, newU, newV);
                }
            };

            for (let z = 0; z < height; z++) {
                for (let x = 0; x < width; x++) {
                    const tileId = $gameMap.tileId(x, z, 0); // Layer 0
                    if (tileId === 0) continue; // Empty

                    const isWall = !$gameMap.isPassable(x, z, 2);

                    let geo;
                    if (isWall) {
                        geo = new THREE.BoxGeometry(1, 1, 1);
                        geo.translate(x, 0.5, z); // Apply position
                    } else {
                        geo = new THREE.PlaneGeometry(1, 1);
                        geo.rotateX(-Math.PI / 2);
                        geo.translate(x, 0, z); // Apply position
                    }

                    applyUVs(geo, tileId);
                    geometries.push(geo);
                }
            }

            if (geometries.length > 0) {
                const mergedGeo = mergeGeometries(geometries);
                const mat = new THREE.MeshLambertMaterial({ map: texture });
                if (!isWall) mat.side = THREE.DoubleSide; // Simplify material sharing
                this.mapMesh = new THREE.Mesh(mergedGeo, mat);
                this.scene.add(this.mapMesh);
            }

            // Player Mesh
            const playerGeo = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
            const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            this.playerMesh = new THREE.Mesh(playerGeo, playerMat);
            this.scene.add(this.playerMesh);
        }

        update() {
            if (!this.isReady) return;

            // Update Player Position
            if ($gamePlayer && this.playerMesh) {
                this.playerMesh.position.set($gamePlayer.x, 0.5, $gamePlayer.y);
            }

            // Update Camera
            if ($gamePlayer) {
                const targetX = $gamePlayer.x;
                const targetZ = $gamePlayer.y + 6;
                const targetY = 6;

                this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
                this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
                this.camera.position.y += (targetY - this.camera.position.y) * 0.1;

                this.camera.lookAt($gamePlayer.x, 0, $gamePlayer.y);
            }

            this.renderer.render(this.scene, this.camera);
        }

        destroy() {
            if (this.renderer && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }

    window.ThreeMapSystem = ThreeMapSystem;

    // -----------------------------------------------------------------------------
    // Integration: Scene_Map
    // -----------------------------------------------------------------------------
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);

        // Hide standard tilemap
        if (this._spriteset && this._spriteset._tilemap) {
            this._spriteset._tilemap.visible = false;
        }

        // Hide characters
        if (this._spriteset && this._spriteset._characterSprites) {
            this._spriteset._characterSprites.forEach(sprite => sprite.visible = false);
            // Also need to hide them if they are created dynamically?
            // Better: hide the container if possible, but _characterSprites is array.
            // The container is _tilemap itself usually (characters are children of tilemap or tilemap layer).
            // In RMMZ, Spriteset_Map.createCharacters adds to this._tilemap. So hiding tilemap should hide characters too!
            // Wait, RMMZ Architecture: Spriteset_Map.createTilemap -> this._tilemap. Spriteset_Map.createCharacters -> adds to this._tilemap.
            // So setting this._spriteset._tilemap.visible = false SHOULD hide everything including characters.
        }

        if (!this._threeMapSystem) {
            this._threeMapSystem = new ThreeMapSystem();
            this._threeMapSystem.init();
            this._threeMapSystem.buildMap();
        }
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this._threeMapSystem) {
            this._threeMapSystem.update();
        }
    };

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        _Scene_Map_terminate.call(this);
        if (this._threeMapSystem) {
            this._threeMapSystem.destroy();
            this._threeMapSystem = null;
        }
    };

    // -----------------------------------------------------------------------------
    // ThreeBattleSystem
    // -----------------------------------------------------------------------------
    class ThreeBattleSystem {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.battlerSprites = [];
            this.isReady = false;
        }

        init() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);

            const aspect = Graphics.width / Graphics.height;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            this.camera.position.set(0, 5, 15);
            this.camera.lookAt(0, 0, 0);

            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.renderer.setSize(Graphics.width, Graphics.height);
            this.renderer.domElement.id = 'three-canvas-battle';
            this.renderer.domElement.style.zIndex = '0';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';

            document.body.appendChild(this.renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);
        }

        setupBattle() {
            const bb1Name = $gameMap.battleback1Name();
            if (bb1Name) {
                const bitmap = ImageManager.loadBattleback1(bb1Name);
                if (bitmap.url) {
                    const texture = new THREE.TextureLoader().load(bitmap.url);
                    const geo = new THREE.PlaneGeometry(20, 20);
                    const mat = new THREE.MeshBasicMaterial({ map: texture });
                    const floor = new THREE.Mesh(geo, mat);
                    floor.rotation.x = -Math.PI / 2;
                    floor.position.y = -2;
                    this.scene.add(floor);
                }
            }

            const bb2Name = $gameMap.battleback2Name();
            if (bb2Name) {
                const bitmap = ImageManager.loadBattleback2(bb2Name);
                if (bitmap.url) {
                    const texture = new THREE.TextureLoader().load(bitmap.url);
                    const geo = new THREE.CylinderGeometry(20, 20, 15, 32, 1, true, -Math.PI/2, Math.PI);
                    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
                    const bg = new THREE.Mesh(geo, mat);
                    bg.position.y = 5;
                    bg.rotation.y = -Math.PI / 2;
                    this.scene.add(bg);
                }
            }
        }

        createBattlers() {
            this.battlerSprites = [];

            const createSprite = (battler, x, z) => {
                let name = "";
                let bitmap = null;

                if (battler.isActor()) {
                    name = battler.battlerName();
                    bitmap = ImageManager.loadSvActor(name);
                } else {
                    name = battler.battlerName();
                    bitmap = ImageManager.loadEnemy(name);
                }

                const texture = new THREE.TextureLoader().load(bitmap.url || 'img/system/IconSet.png');
                const mat = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(mat);

                sprite.scale.set(2, 2, 1);

                sprite.position.set(x, -1, z);
                this.scene.add(sprite);
                this.battlerSprites.push({ sprite, battler });
            };

            $gameParty.members().forEach((actor, index) => {
                createSprite(actor, 4 + index, index);
            });

            $gameTroop.members().forEach((enemy, index) => {
                const ex = (enemy.screenX() - Graphics.width / 2) / 50;
                const ez = (enemy.screenY() - Graphics.height / 2) / 50;
                createSprite(enemy, ex, ez);
            });
        }

        update() {
            this.battlerSprites.forEach(({ sprite, battler }) => {
                 sprite.visible = !battler.isHidden();
            });
            this.renderer.render(this.scene, this.camera);
        }

        destroy() {
             if (this.renderer && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }

    window.ThreeBattleSystem = ThreeBattleSystem;

    // -----------------------------------------------------------------------------
    // Integration: Scene_Battle
    // -----------------------------------------------------------------------------
    const _Scene_Battle_createSpriteset = Scene_Battle.prototype.createSpriteset;
    Scene_Battle.prototype.createSpriteset = function() {
        _Scene_Battle_createSpriteset.call(this);

        if (this._spriteset) {
            this._spriteset.visible = false;
        }

        if (!this._threeBattleSystem) {
            this._threeBattleSystem = new ThreeBattleSystem();
            this._threeBattleSystem.init();
            this._threeBattleSystem.setupBattle();
            this._threeBattleSystem.createBattlers();
        }
    };

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        if (this._threeBattleSystem) {
            this._threeBattleSystem.update();
        }
    };

    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        _Scene_Battle_terminate.call(this);
        if (this._threeBattleSystem) {
            this._threeBattleSystem.destroy();
            this._threeBattleSystem = null;
        }
    };

})();
