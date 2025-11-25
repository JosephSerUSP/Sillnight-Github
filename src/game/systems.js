import { Data } from '../assets/data/data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';
import { UI } from './windows.js';

// ------------------- SYSTEMS DEFINITIONS -------------------
// All gameplay logic is organized under a single Systems object. Each system operates
// exclusively on GameState and Data, without direct DOM manipulation.

export const Systems = {
    sceneHooks: { onBattleStart: null, onBattleEnd: null },
    Effekseer: {
        context: null,
        initPromise: null,
        cache: {},
        // Rotation matrix to convert the game's Z-up coordinates to Effekseer's Y-up system.
        zToYUpMatrix: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
        // Inverse rotation for converting Effekseer-space camera matrices back to world space.
        yToZUpMatrix: new THREE.Matrix4().makeRotationX(Math.PI / 2),
        convertToEffekseerPosition(position = { x: 0, y: 0, z: 0 }) {
            const vec = new THREE.Vector3(position.x, position.y, position.z);
            vec.applyMatrix4(this.zToYUpMatrix);
            return { x: vec.x, y: vec.y, z: vec.z };
        },
        init(renderer) {
            if (!window.effekseer || !renderer) return Promise.resolve(null);
            if (this.context) return Promise.resolve(this.context);
            if (this.initPromise) return this.initPromise;

            const wasmPath = resolveAssetPath('src/libs/effekseer.wasm');

            this.initPromise = new Promise((resolve) => {
                if (!wasmPath || typeof effekseer.initRuntime !== 'function') {
                    console.warn('Effekseer runtime is unavailable.');
                    resolve(null);
                    return;
                }

                const onload = () => {
                    this.context = effekseer.createContext();
                    const gl = renderer.getContext();
                    if (!this.context || !gl) {
                        console.warn('Failed to create Effekseer context.');
                        resolve(null);
                        return;
                    }
                    this.context.init(gl, { instanceMaxCount: 256, squareMaxCount: 2048 });
                    this.context.setRestorationOfStatesFlag(true);
                    resolve(this.context);
                };

                const onerror = (err) => {
                    console.error('Effekseer runtime initialization failed.', err);
                    resolve(null);
                };

                effekseer.initRuntime(wasmPath, onload, onerror);
            });

            return this.initPromise;
        },
        loadEffect(name, path) {
            if (!path) return Promise.resolve(null);
            const ready = this.initPromise || Promise.resolve(this.context);
            return ready.then(() => {
                if (!this.context) return null;
                if (this.cache[name]) return this.cache[name];
                const resolved = resolveAssetPath(path);
                if (!resolved) return null;
                const p = new Promise((resolve) => {
                    const effect = this.context.loadEffect(resolved, 1.0, (efk) => resolve(efk || effect || null));
                    if (effect && typeof effect.then !== 'function') {
                        resolve(effect);
                    }
                });
                this.cache[name] = p;
                return p;
            });
        },
        play(name, position) {
            const path = Data.effects?.[name];
            if (!path) return Promise.resolve(null);
            const ready = this.initPromise || Promise.resolve(this.context);
            return ready.then(() => this.loadEffect(name, path)).then(effect => {
                if (!effect || !this.context) return null;
                const effekseerPos = this.convertToEffekseerPosition(position);
                return this.context.play(effect, effekseerPos.x, effekseerPos.y, effekseerPos.z);
            });
        },
        update(camera) {
            if (!this.context || !camera) return;
            // Convert the camera's world-space view matrix into Effekseer's Y-up space so
            // that effects and sprites line up. Because effect positions are rotated into
            // Effekseer space (Z-up -> Y-up), we need to apply the inverse rotation when
            // supplying the view matrix: view = M_view_world * R^-1.
            // Use the inverse rotation on the camera side (V = Vz * R^-1) so the view
            // cancels the position conversion instead of rotating twice.
            const viewMatrix = new THREE.Matrix4().multiplyMatrices(
                camera.matrixWorldInverse,
                this.yToZUpMatrix
            );
            this.context.setProjectionMatrix(camera.projectionMatrix.elements);
            this.context.setCameraMatrix(viewMatrix.elements);
            this.context.update();
            this.context.draw();
        }
    },
    /*
     * Map system: generates and manages dungeon floors, and resolves tile effects.
     */
    Map: {
        generateFloor() {
            const cfg = Data.config;
            // Initialize map filled with walls (code 1)
            const map = Array(cfg.mapHeight).fill().map(() => Array(cfg.mapWidth).fill(1));
            let x = Math.floor(cfg.mapWidth / 2);
            let y = Math.floor(cfg.mapHeight / 2);
            GameState.exploration.playerPos = { x, y };
            // Carve a random path to create open floor tiles (code 0)
            const steps = 400;
            for (let i = 0; i < steps; i++) {
                map[y][x] = 0;
                const dir = Math.floor(Math.random() * 4);
                if (dir === 0 && y > 1) y--;
                else if (dir === 1 && y < cfg.mapHeight - 2) y++;
                else if (dir === 2 && x > 1) x--;
                else if (dir === 3 && x < cfg.mapWidth - 2) x++;
            }
            // Collect empty floor tiles to place features on them
            const emptyTiles = [];
            for (let ry = 0; ry < cfg.mapHeight; ry++) {
                for (let rx = 0; rx < cfg.mapWidth; rx++) {
                    if (map[ry][rx] === 0 && (rx !== GameState.exploration.playerPos.x || ry !== GameState.exploration.playerPos.y)) {
                        emptyTiles.push({ x: rx, y: ry });
                    }
                }
            }
            // Helper to place a number of tiles with a given code
            function place(code, count) {
                for (let i = 0; i < count; i++) {
                    if (emptyTiles.length === 0) break;
                    const idx = Math.floor(Math.random() * emptyTiles.length);
                    const tile = emptyTiles.splice(idx, 1)[0];
                    map[tile.y][tile.x] = code;
                }
            }
            // Place enemies (code 2), stairs (3), treasure (4)
            place(2, 5 + GameState.run.floor);
            place(3, 1);
            place(4, 2);
            // Place shops (5), recruit (6), shrine (7), trap (8). Increase counts with floor.
            const eventCount = Math.max(1, Math.floor(GameState.run.floor / 2));
            place(5, eventCount); // shops
            place(6, eventCount); // recruits
            place(7, 1); // one shrine per floor
            place(8, eventCount); // traps
            // Save to GameState
            GameState.exploration.map = map;
            GameState.exploration.visited = Array(cfg.mapHeight).fill().map(() => Array(cfg.mapWidth).fill(false));
            Log.add(`Floor ${GameState.run.floor} generated.`);
        },
        // Returns the tile code at the given coordinates, or 1 if out of bounds
        tileAt(x, y) {
            const map = GameState.exploration.map;
            if (!map[y] || map[y][x] === undefined) return 1;
            return map[y][x];
        },
        // Resolves effects when the player steps on a tile. Modifies game state.
        resolveTile(code) {
            if (code === 2) { // enemy
                // Clear the tile so encounters don't repeat
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Battle.startEncounter();
            } else if (code === 3) { // stairs
                GameState.run.floor++;
                Log.add('Descended...');
                Systems.Map.generateFloor();
            } else if (code === 4) { // treasure
                const amt = Math.floor(Math.random() * 50) + 20 * GameState.run.floor;
                GameState.run.gold += amt;
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Log.loot(`Found ${amt} Gold!`);
            } else if (code === 5) { // shop
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.shop();
            } else if (code === 6) { // recruit
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.recruit();
            } else if (code === 7) { // shrine
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.shrine();
            } else if (code === 8) { // trap
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.trap();
            }
        }
    },
    /*
     * Exploration system: handles movement and field-of-view updates. Has no DOM.
     */
    Explore: {
        init() {
            // Called once to set canvas size and draw initial view
            this.resize();
        },
        resize() {
            const canvas = document.getElementById('explore-canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.render();
        },
        move(dx, dy) {
            if (GameState.ui.mode !== 'EXPLORE' || GameState.ui.formationMode) return;
            const newX = GameState.exploration.playerPos.x + dx;
            const newY = GameState.exploration.playerPos.y + dy;
            const tile = Systems.Map.tileAt(newX, newY);
            if (tile !== 1) {
                GameState.exploration.playerPos = { x: newX, y: newY };
                this.checkTile(tile);
                this.render();
            }
        },
        checkTile(code) {
            // Resolve what happens when stepping on this tile
            Systems.Map.resolveTile(code);
            // Update HUD after potential gold change
            UI.updateHUD();
        },
        render() {
            const canvas = document.getElementById('explore-canvas');
            const ctx = canvas.getContext('2d');
            const cfg = Data.config;
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, w, h);
            // Center offset to keep player in the middle of screen
            const offsetX = (w / 2) - (GameState.exploration.playerPos.x * cfg.tileSize);
            const offsetY = (h / 2) - (GameState.exploration.playerPos.y * cfg.tileSize);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            // Draw map tiles with fog-of-war
            for (let y = 0; y < cfg.mapHeight; y++) {
                for (let x = 0; x < cfg.mapWidth; x++) {
                    const dist = Math.hypot(x - GameState.exploration.playerPos.x, y - GameState.exploration.playerPos.y);
                    if (dist < cfg.viewDistance) GameState.exploration.visited[y][x] = true;
                    if (!GameState.exploration.visited[y][x]) continue;
                    const tile = GameState.exploration.map[y][x];
                    const px = x * cfg.tileSize;
                    const py = y * cfg.tileSize;
                    // Walls vs floor
                    if (tile === 1) {
                        ctx.fillStyle = '#333';
                        ctx.fillRect(px, py, cfg.tileSize, cfg.tileSize);
                        ctx.strokeStyle = '#111';
                        ctx.strokeRect(px, py, cfg.tileSize, cfg.tileSize);
                    } else {
                        ctx.fillStyle = '#1a1a1a';
                        ctx.fillRect(px, py, cfg.tileSize, cfg.tileSize);
                        ctx.strokeStyle = '#222';
                        ctx.strokeRect(px, py, cfg.tileSize, cfg.tileSize);
                        // Draw icons for special tiles
                        ctx.font = '32px serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const cx = px + cfg.tileSize / 2;
                        const cy = py + cfg.tileSize / 2;
                        if (tile === 2) ctx.fillText('👹', cx, cy);
                        else if (tile === 3) ctx.fillText('🪜', cx, cy);
                        else if (tile === 4) ctx.fillText('💰', cx, cy);
                        else if (tile === 5) ctx.fillText('🛒', cx, cy);
                        else if (tile === 6) ctx.fillText('🤝', cx, cy);
                        else if (tile === 7) ctx.fillText('⛪', cx, cy);
                        else if (tile === 8) ctx.fillText('☠️', cx, cy);
                    }
                    // Draw fog beyond view distance
                    if (dist >= cfg.viewDistance) {
                        ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        ctx.fillRect(px, py, cfg.tileSize, cfg.tileSize);
                    }
                }
            }
            // Draw the player
            const playerX = GameState.exploration.playerPos.x * cfg.tileSize;
            const playerY = GameState.exploration.playerPos.y * cfg.tileSize;
            ctx.font = '36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 15;
            ctx.fillText('🧙‍♂️', playerX + cfg.tileSize / 2, playerY + cfg.tileSize / 2);
            ctx.restore();
        }
    },
    /*
     * Event system: handles shops, recruitment, shrines, and traps.
     */
    Events: {
        // Helper to display a modal for events
        show(title, content) {
            const modal = document.getElementById('event-modal');
            const tEl = document.getElementById('event-title');
            const cEl = document.getElementById('event-content');
            tEl.innerText = title;
            cEl.innerHTML = '';
            if (typeof content === 'string') cEl.innerHTML = content;
            else cEl.appendChild(content);
            modal.classList.remove('hidden');
        },
        close() {
            document.getElementById('event-modal').classList.add('hidden');
        },
        // Shop event: sell items and equipment
        shop() {
            Log.add('You discover a mysterious merchant.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
            // Build list of stock: random subset of items and equipment
            const stock = [];
            const itemKeys = Object.keys(Data.items);
            const equipKeys = Object.keys(Data.equipment);
            // pick 2 items and 1 equipment
            for (let i = 0; i < 2; i++) {
                const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                stock.push({ type: 'item', id: key });
            }
            const eqKey = equipKeys[Math.floor(Math.random() * equipKeys.length)];
            stock.push({ type: 'equip', id: eqKey });
            stock.forEach(s => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
                let def, name, desc, price;
                if (s.type === 'item') {
                    def = Data.items[s.id]; name = def.name; desc = def.description; price = def.cost;
                } else {
                    def = Data.equipment[s.id]; name = def.name; desc = def.description; price = def.cost;
                }
                row.innerHTML = `<div class="flex flex-col"><span class="text-yellow-100">${name}</span><span class="text-xs text-gray-500">${desc}</span><span class="text-xs text-gray-400">${price} G</span></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'BUY';
                btn.onclick = () => {
                    if (GameState.run.gold >= price) {
                        GameState.run.gold -= price;
                        // Add to inventory
                        if (s.type === 'item') {
                            GameState.inventory.items[s.id] = (GameState.inventory.items[s.id] || 0) + 1;
                            Log.loot(`Bought ${def.name}.`);
                        } else {
                            GameState.inventory.equipment[s.id] = (GameState.inventory.equipment[s.id] || 0) + 1;
                            Log.loot(`Bought ${def.name}.`);
                        }
                        UI.updateHUD();
                        btn.disabled = true;
                        btn.innerText = 'SOLD';
                    } else {
                        alert('Not enough gold!');
                    }
                };
                row.appendChild(btn);
                container.appendChild(row);
            });
            // Add leave button
            const leaveBtn = document.createElement('button');
            leaveBtn.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700';
            leaveBtn.innerText = 'Leave';
            leaveBtn.onclick = () => { Systems.Events.close(); };
            container.appendChild(leaveBtn);
            this.show('SHOP', container);
        },
        // Recruit event: offer one or two creatures to join
        recruit() {
            Log.add('You encounter a wandering soul.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
            // random set of recruits (1 or 2)
            const count = Math.random() < 0.5 ? 1 : 2;
            const speciesList = Object.keys(Data.creatures);
            const offers = [];
            for (let i = 0; i < count; i++) {
                const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
                offers.push(Data.creatures[sp]);
            }
            offers.forEach(def => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
                row.innerHTML = `<div class="flex items-center gap-2">${UI.spriteMarkup(def, 'h-10 w-10 object-contain')}<div><div class="text-yellow-100">${def.name}</div><div class="text-xs text-gray-500">HP ${def.baseHp}</div></div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'RECRUIT';
                btn.onclick = () => {
                    const empty = GameState.party.activeSlots.findIndex(u => u === null);
                    // Create instance
                    const unit = {
                        uid: 'n' + Date.now() + '_' + Math.random().toString(16).slice(2),
                        speciesId: def.id,
                        name: def.name,
                        sprite: def.sprite,
                        spriteAsset: def.spriteAsset,
                        level: GameState.run.floor,
                        maxhp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        hp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        exp: 0,
                        temperament: def.temperament,
                        elements: def.elements ? [...def.elements] : [],
                        acts: def.acts,
                        equipmentId: null,
                        slotIndex: -1
                    };
                    GameState.roster.push(unit);
                    if (empty !== -1) {
                        unit.slotIndex = empty;
                        GameState.party.activeSlots[empty] = unit;
                        Log.add(`${unit.name} joins your party.`);
                    } else {
                        Log.add(`${unit.name} waits in reserve.`);
                    }
                    UI.renderParty();
                    btn.disabled = true;
                    btn.innerText = 'TAKEN';
                };
                row.appendChild(btn);
                container.appendChild(row);
            });
            const leave = document.createElement('button');
            leave.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700';
            leave.innerText = 'Leave';
            leave.onclick = () => { Systems.Events.close(); };
            container.appendChild(leave);
            this.show('RECRUIT', container);
        },
        // Shrine event: heal and revive party
        shrine() {
            Log.add('You find a glowing shrine.');
            // Heal all roster members to full and revive if dead
            GameState.roster.forEach(u => {
                const def = Data.creatures[u.speciesId];
                u.maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (u.level - 1)));
                u.hp = u.maxhp;
            });
            UI.renderParty();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-green-500 text-xl">Your party feels rejuvenated.</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('SHRINE', msg);
        },
        // Trap event: damages all active party members
        trap() {
            Log.add('A hidden trap triggers!');
            const damage = (u) => {
                // deal 20% of maxhp
                const maxhp = Systems.Battle.getMaxHp(u);
                const dmg = Math.ceil(maxhp * 0.2);
                u.hp = Math.max(0, u.hp - dmg);
                if (u.hp === 0) Log.battle(`${u.name} was knocked out by the trap!`);
            };
            GameState.party.activeSlots.forEach(u => { if (u) damage(u); });
            UI.renderParty();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-red-500 text-xl">A trap harms your party!</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('TRAP', msg);
        }
    },
    /*
     * 3D Battle renderer: responsible for all Three.js rendering. It converts
     *  battle data into sprites and animations. This module does not touch
     *  GameState.Battle except to read it; it emits events via callbacks.
     */
    Battle3D: {
        scene: null,
        camera: null,
        renderer: null,
        group: null,
        sprites: {},
        textureLoader: null,
        textureCache: {},
        spriteScaleFactor: 3,
        cameraState: { angle: -Math.PI / 4, targetAngle: -Math.PI / 4, targetX: 0, targetY: 0 },
        init() {
            const container = document.getElementById('three-container');
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a0a);
            // Setup camera
            this.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.up.set(0, 0, 1);
            // Setup renderer
            this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(this.renderer.domElement);
            Systems.Effekseer.init(this.renderer);
            // Lighting
            const amb = new THREE.AmbientLight(0xffffff, 0.6);
            const dir = new THREE.DirectionalLight(0xffffff, 0.8);
            dir.position.set(10, -10, 20);
            this.scene.add(amb);
            this.scene.add(dir);
            // Grid helper for floor
            const grid = new THREE.GridHelper(30, 30, 0x444444, 0x111111);
            grid.rotation.x = Math.PI / 2;
            this.scene.add(grid);
            this.textureLoader = new THREE.TextureLoader();
            // Group to hold sprites
            this.group = new THREE.Group();
            this.scene.add(this.group);
            // Begin animation loop
            this.animate();
        },
        resize() {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        },
        // Converts an array of ally and enemy instances into Three.js sprites.
        setupScene(allies, enemies) {
            this.group.clear();
            this.sprites = {};
            const getPos = (isEnemy, slot) => {
                const rowOffset = isEnemy ? 2.5 : -2.5;
                const backOffset = isEnemy ? 2 : -2;
                const xMap = [-2, 0, 2];
                const isBack = slot > 2;
                const col = slot % 3;
                return { x: xMap[col], y: rowOffset + (isBack ? backOffset : 0) };
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
                const pos = getPos(isEnemy, unit.slotIndex);
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
                    sprite.userData.baseScale = baseScale;
                    sprite.userData.baseZ = baseScale.y / 2;
                    // Add drop shadow
                    const shadow = new THREE.Mesh(
                        new THREE.CircleGeometry(0.8, 16),
                        new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true })
                    );
                    shadow.position.set(pos.x, pos.y, 0.05);
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
        },
        // Adjust camera focus based on stage of battle
        setFocus(type) {
            const BASE = -Math.PI / 4;
            const SHIFT = Math.PI / 12;
            if (type === 'ally') {
                this.cameraState.targetAngle = BASE - SHIFT;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            } else if (type === 'enemy') {
                this.cameraState.targetAngle = BASE + SHIFT;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            } else if (type === 'victory') {
                this.cameraState.targetAngle = this.cameraState.angle + Math.PI * 2;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = -3.5;
            } else {
                if (this.cameraState.angle > Math.PI * 2 || this.cameraState.angle < -Math.PI * 2) {
                    this.cameraState.angle = BASE;
                }
                this.cameraState.targetAngle = BASE;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            }
        },
        animate() {
            requestAnimationFrame(() => this.animate());
            const cs = this.cameraState;
            if (GameState.ui.mode === 'BATTLE_WIN') {
                cs.angle += 0.005;
            } else {
                cs.angle += (cs.targetAngle - cs.angle) * 0.05;
            }
            const R = 28.28;
            const Z_HEIGHT = 16;
            this.camera.position.x = cs.targetX + Math.cos(cs.angle) * R;
            this.camera.position.y = cs.targetY + Math.sin(cs.angle) * R;
            this.camera.position.z = Z_HEIGHT;
            this.camera.lookAt(cs.targetX, cs.targetY, 2);
            this.renderer.render(this.scene, this.camera);
            Systems.Effekseer.update(this.camera);
        },
        // Converts world coordinates to screen coordinates for UI overlays
        toScreen(obj) {
            const vec = new THREE.Vector3();
            obj.updateMatrixWorld();
            this.camera.updateMatrixWorld();
            vec.setFromMatrixPosition(obj.matrixWorld);
            vec.project(this.camera);
            const width = this.renderer.domElement.width;
            const height = this.renderer.domElement.height;
            return {
                x: (vec.x * 0.5 + 0.5) * width,
                y: (-(vec.y * 0.5) + 0.5) * height
            };
        },
        // Resets a sprite to default appearance
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
        },
        // Executes a high-level action sequence, triggering Effekseer effects and timing
        // callbacks when damage/heal application should occur.
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
                wait: (step) => wait(step.duration || 300),
                jump: (step) => new Promise(resolve => {
                    let t = 0;
                    const axis = 'z';
                    const startPos = sprite.position[axis];
                    const interval = 30;
                    const amp = step.height || 0.8;
                    const duration = step.duration || 500;
                    const jump = setInterval(() => {
                        t += interval;
                        const progress = Math.min(1, t / duration);
                        sprite.position[axis] = startPos + Math.sin(progress * Math.PI) * amp;
                        if (progress >= 1) {
                            clearInterval(jump);
                            sprite.position[axis] = startPos;
                            resolve();
                        }
                    }, interval);
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
                    const interval = 30;
                    let elapsed = 0;
                    const move = setInterval(() => {
                        elapsed += interval;
                        const p = Math.min(1, elapsed / duration);
                        sprite.position.x = origin.x + (destination.x - origin.x) * p;
                        sprite.position.y = origin.y + (destination.y - origin.y) * p;
                        if (p >= 1) { clearInterval(move); resolve(); }
                    }, interval);
                }),
                retreat: (step) => new Promise(resolve => {
                    const duration = step.duration || 250;
                    const interval = 30;
                    const start = sprite.position.clone();
                    let elapsed = 0;
                    const move = setInterval(() => {
                        elapsed += interval;
                        const p = Math.min(1, elapsed / duration);
                        sprite.position.lerpVectors(start, origin, p);
                        if (p >= 1) { clearInterval(move); sprite.position.copy(origin); resolve(); }
                    }, interval);
                }),
                effect: (step) => {
                    const boundSprites = step.bind === 'target' ? targets.map(t => this.sprites[t.uid]).filter(Boolean) : [sprite];
                    const plays = boundSprites.map(sp => {
                        const pos = { x: sp.position.x, y: sp.position.y, z: sp.position.z + (step.height || 1) };
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
        },
        showDamageNumber(uid, val) {
            if (val === 0) return;
            const sprite = this.sprites[uid];
            if (!sprite) return;
            const screenPos = this.toScreen(sprite);
            const el = document.createElement('div');
            el.className = `damage-number ${val < 0 ? 'text-green-400' : 'text-white'}`;
            el.innerText = Math.abs(val);
            el.style.left = (screenPos.x / window.devicePixelRatio) + 'px';
            el.style.top = (screenPos.y / window.devicePixelRatio) + 'px';
            document.getElementById('battle-ui-overlay').appendChild(el);
            setTimeout(() => el.remove(), 1500);
        },
        // Helper to create a billboard sprite with optional shadow
        createBillboard(text, x, y, z, scale = 1.0) {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, 128, 128);
            ctx.font = '80px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 0;
            ctx.fillText(text, 64, 64);
            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(x, y, z + 1.5 * scale);
            sprite.scale.set(3 * scale, 3 * scale, 1);
            if (scale >= 1.0) {
                const shadow = new THREE.Mesh(
                    new THREE.CircleGeometry(0.8 * scale, 16),
                    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true })
                );
                shadow.position.set(x, y, 0.05);
                const group = new THREE.Group();
                group.add(sprite);
                group.add(shadow);
                return group;
            } else {
                const group = new THREE.Group();
                group.add(sprite);
                return group;
            }
        }
    },
    /*
     * Battle system: orchestrates the turn-based combat loop. It uses Data and
     * GameState to determine combatants, their actions, and outcomes. It
     * interacts with UI and Battle3D modules via callbacks to present the
     * fight to the player.
    */
    Battle: {
        elementStrengths: { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' },
        elementWeaknesses: { G: 'R', B: 'G', R: 'B', W: 'W', K: 'K' },
        // Computes how a single element instance interacts with an action's element.
        elementRelation(actionElement, creatureElement, role) {
            if (!actionElement || !creatureElement) return 1;
            const strongAgainst = this.elementStrengths[actionElement];
            const weakAgainst = this.elementWeaknesses[actionElement];
            if (role === 'attacker') {
                if (creatureElement === actionElement) return 1.25;
                if (this.elementStrengths[creatureElement] === actionElement) return 0.75;
                return 1;
            }
            if (creatureElement === actionElement && (creatureElement === 'W' || creatureElement === 'K')) return 0.75;
            if (strongAgainst === creatureElement) return 1.25;
            if (weakAgainst === creatureElement || this.elementStrengths[creatureElement] === actionElement) return 0.75;
            return 1;
        },
        elementMultiplier(actionElement, unit, role) {
            if (!actionElement) return 1;
            const elems = unit.elements || [];
            return elems.reduce((mult, e) => mult * this.elementRelation(actionElement, e, role), 1);
        },
        calculateActionValue(action, unit, target) {
            if (action.category === 'effect') return 0;
            const pow = action.power || 0;
            const sc = action.scaling || 0;
            const base = Math.floor(pow + sc * unit.level);
            const element = action.element;
            const attackMult = this.elementMultiplier(element, unit, 'attacker');
            const defenseMult = this.elementMultiplier(element, target, 'defender');
            let value = Math.floor(base * attackMult * defenseMult);
            if (action.category === 'heal') value = -value;
            return value;
        },
        getMaxHp(unit) {
            const def = Data.creatures[unit.speciesId];
            let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
            // apply equipment bonus
            if (unit.equipmentId) {
                const eq = Data.equipment[unit.equipmentId];
                if (eq && eq.hpBonus) baseMax = Math.round(baseMax * (1 + eq.hpBonus));
            }
            return baseMax;
        },
        startEncounter() {
            // Trigger a screen wipe and transition to battle
            const swipe = document.getElementById('swipe-overlay');
            swipe.className = 'swipe-down';
            setTimeout(() => {
                // Initialize battle state
                Systems.sceneHooks?.onBattleStart?.();
                GameState.ui.mode = 'BATTLE';
                UI.switchScene(true);
                // Reset camera state
                Systems.Battle3D.cameraState.angle = -Math.PI / 4;
                Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
                Systems.Battle3D.setFocus('neutral');
                Systems.Battle3D.resize();
                // Build allies from active party
                const allies = GameState.party.activeSlots.filter(u => u !== null).map(u => u);
                // Generate random enemies based on floor level
                const enemyCount = Math.floor(Math.random() * 3) + 1;
                const enemyTypes = ['goblin', 'skeleton', 'pixie', 'golem', 'lich','inori','nurse','waiter','ifrit','shiva'];
                const enemies = [];
                for (let i = 0; i < enemyCount; i++) {
                    const type = enemyTypes[Math.floor(Math.random() * Math.min(enemyTypes.length, GameState.run.floor + 1))];
                    const def = Data.creatures[type];
                    // Level scaling: base HP times a factor per floor
                    const mult = 1 + (GameState.run.floor * 0.1);
                    enemies.push({
                        uid: `e${i}_${Date.now()}`,
                        speciesId: type,
                        name: def.name,
                        sprite: def.sprite,
                        spriteAsset: def.spriteAsset,
                        level: GameState.run.floor,
                        hp: Math.floor(def.baseHp * mult),
                        maxhp: Math.floor(def.baseHp * mult),
                        temperament: def.temperament,
                        elements: def.elements ? [...def.elements] : [],
                        acts: def.acts,
                        slotIndex: i
                    });
                }
                // Initialize battle state structure
                GameState.battle = {
                    allies: allies,
                    enemies: enemies,
                    queue: [],
                    turnIndex: 0,
                    roundCount: 0,
                    playerTurnRequested: false,
                    phase: 'INIT'
                };
                // Setup 3D scene for battle
                Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
                Log.battle(`Enemies: ${enemies.map(e => e.name).join(', ')}`);
                UI.showBanner('ENCOUNTER');
                // Swipe up and begin after delay
                swipe.className = 'swipe-clear';
                setTimeout(() => {
                    swipe.className = 'swipe-reset';
                    setTimeout(() => Systems.Battle.nextRound(), 1500);
                }, 600);
            }, 600);
        },
        nextRound() {
            if (!GameState.battle) return;
            GameState.battle.roundCount++;
            GameState.battle.phase = 'ROUND_START';
            Systems.Battle3D.setFocus('neutral');
            if (GameState.battle.allies.every(u => u.hp <= 0)) return this.end(false);
            if (GameState.battle.enemies.every(u => u.hp <= 0)) return this.end(true);
            Log.battle(`--- Round ${GameState.battle.roundCount} ---`);
            if (GameState.battle.playerTurnRequested) {
                GameState.battle.phase = 'PLAYER_INPUT';
                GameState.battle.playerTurnRequested = false;
                UI.togglePlayerTurn(true);
                Log.battle('Waiting for orders...');
                return;
            }
            // Build action queue randomly from all living units
            const allUnits = [...GameState.battle.allies, ...GameState.battle.enemies].filter(u => u.hp > 0);
            GameState.battle.queue = allUnits.sort(() => Math.random() - 0.5);
            GameState.battle.turnIndex = 0;
            this.processNextTurn();
        },
        requestPlayerTurn() {
            if (GameState.ui.mode === 'BATTLE') {
                GameState.battle.playerTurnRequested = true;
                Log.add('Interrupt queued.');
                const btn = document.getElementById('btn-player-turn');
                btn.classList.add('border-green-500', 'text-green-500');
                btn.innerText = 'QUEUED';
            }
        },
        resumeAuto() {
            // Resume auto-battle after player input
            UI.togglePlayerTurn(false);
            GameState.battle.playerTurnRequested = false;
            const btn = document.getElementById('btn-player-turn');
            btn.classList.remove('border-green-500', 'text-green-500');
            btn.innerText = 'STOP ROUND (SPACE)';
            this.processNextTurn();
        },
        // Swap units when the player reorganizes the formation during battle
        swapUnits(idx1, idx2) {
            const u1 = GameState.party.activeSlots[idx1];
            const u2 = GameState.party.activeSlots[idx2];
            GameState.party.activeSlots[idx1] = u2;
            GameState.party.activeSlots[idx2] = u1;
            if (GameState.party.activeSlots[idx1]) GameState.party.activeSlots[idx1].slotIndex = idx1;
            if (GameState.party.activeSlots[idx2]) GameState.party.activeSlots[idx2].slotIndex = idx2;
            UI.renderParty();
            if (GameState.ui.mode === 'BATTLE') {
                GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
            }
            Log.add('Formation changed.');
        },
        processNextTurn() {
            UI.renderParty();
            if (GameState.battle.turnIndex >= GameState.battle.queue.length) {
                setTimeout(() => this.nextRound(), 1000);
                return;
            }
            const unit = GameState.battle.queue[GameState.battle.turnIndex++];
            if (unit.hp <= 0) {
                this.processNextTurn();
                return;
            }
            const isAlly = GameState.battle.allies.includes(unit);
            Systems.Battle3D.setFocus(isAlly ? 'ally' : 'enemy');
            const enemies = isAlly ? GameState.battle.enemies : GameState.battle.allies;
            const friends = isAlly ? GameState.battle.allies : GameState.battle.enemies;
            // Flatten acts grid for available skills
            const possibleActs = [...unit.acts[0], ...(unit.acts[1] || [])];
            // Simple AI: choose heal if temperament is kind and a friend is hurt
            let chosen = null;
            if (unit.temperament === 'kind') {
                const hurt = friends.filter(f => f.hp < f.maxhp).sort((a, b) => a.hp - b.hp)[0];
                if (hurt && hurt.hp < hurt.maxhp * 0.6) {
                    for (const a of possibleActs) {
                        const skill = Data.skills[a.toLowerCase()];
                        if (skill && skill.category === 'heal') { chosen = a; break; }
                    }
                }
            }
            if (!chosen) {
                chosen = possibleActs[Math.floor(Math.random() * possibleActs.length)];
            }
            const action = Data.skills[chosen.toLowerCase()] || Data.skills['attack'];
            let targets = [];
            const validEnemies = enemies.filter(u => u.hp > 0);
            const validFriends = friends.filter(u => u.hp > 0);
            // Target selection based on action.target
            if (action.target === 'self') targets = [unit];
            else if (action.target === 'ally-single') targets = [validFriends.sort((a, b) => a.hp - b.hp)[0]];
            else if (action.target === 'enemy-all') targets = validEnemies;
            else if (action.target === 'enemy-row') {
                // All enemies in the front or back row (slotIndex < 3 = front; >=3 = back)
                const frontRow = validEnemies.filter(e => e.slotIndex < 3);
                const backRow = validEnemies.filter(e => e.slotIndex >= 3);
                targets = frontRow.length > 0 ? frontRow : backRow;
            } else {
                targets = [validEnemies[Math.floor(Math.random() * validEnemies.length)]];
            }
            if (targets.length === 0 || !targets[0]) {
                this.processNextTurn();
                return;
            }
            // Show banner for the action
            UI.showBanner(`${unit.name} used ${action.name}!`);
            const results = targets.map(t => ({ target: t, value: this.calculateActionValue(action, unit, t) }));
            const script = Data.actionScripts[action.script] || Data.actionScripts.attack || [];
            const applyResults = () => {
                if (action.category === 'effect' && action.id !== 'wait') {
                    Log.battle(`> ${unit.name} stands ready.`);
                }
                results.forEach(({ target, value }) => {
                    if (!target) return;
                    if (value < 0) {
                        const maxhp = Systems.Battle.getMaxHp(target);
                        target.hp = Math.min(maxhp, target.hp - value);
                        Log.battle(`> ${target.name} healed for ${Math.abs(value)}.`);
                    } else if (value > 0) {
                        target.hp = Math.max(0, target.hp - value);
                        Log.battle(`> ${unit.name} hits ${target.name} for ${value}.`);
                        if (target.hp <= 0) {
                            Log.battle(`> ${target.name} was defeated!`);
                            const ts = Systems.Battle3D.sprites[target.uid];
                            if (ts) ts.visible = false;
                        }
                    }
                    Systems.Battle3D.showDamageNumber(target.uid, value);
                });
                // Re-render party HP bars and check for end-of-battle
                UI.renderParty();
                if (GameState.battle.allies.every(u => u.hp <= 0) || GameState.battle.enemies.every(u => u.hp <= 0)) {
                    GameState.battle.turnIndex = 999;
                }
            };

            Systems.Battle3D.playAnim(unit.uid, script, {
                targets,
                onApply: applyResults,
                onComplete: () => setTimeout(() => this.processNextTurn(), 600)
            });
        },
        end(win) {
            // Clear all UI overlays
            document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                UI.showBanner('VICTORY');
                GameState.ui.mode = 'BATTLE_WIN';
                Systems.sceneHooks?.onBattleEnd?.();
                Systems.Battle3D.setFocus('victory');
                // Calculate rewards
                const gold = GameState.battle.enemies.length * Data.config.baseGoldPerEnemy * GameState.run.floor;
                const xp = GameState.battle.enemies.length * Data.config.baseXpPerEnemy * GameState.run.floor;
                GameState.run.gold += gold;
                GameState.party.activeSlots.forEach(p => {
                    if (p) {
                        // Add XP and level up if necessary
                        p.exp = (p.exp || 0) + xp;
                        const def = Data.creatures[p.speciesId];
                        let levelCost = def.xpCurve * p.level;
                        let levelUpOccurred = false;
                        while (p.exp >= levelCost) {
                            p.exp -= levelCost;
                            p.level++;
                            // update maxhp using growth formula
                            const newMax = Math.round(def.baseHp * (1 + def.hpGrowth * (p.level - 1)));
                            p.maxhp = newMax;
                            p.hp = newMax;
                            levelCost = def.xpCurve * p.level;
                            levelUpOccurred = true;
                        }
                        if (levelUpOccurred) Log.add(`${p.name} Lv UP -> ${p.level}!`);
                    }
                });
                // Between battles recovery: heal 25% of maxhp
                GameState.party.activeSlots.forEach(p => {
                    if (p) {
                        const maxhp = Systems.Battle.getMaxHp(p);
                        const heal = Math.floor(maxhp * 0.25);
                        p.hp = Math.min(maxhp, p.hp + heal);
                    }
                });
                UI.updateHUD();
                UI.showModal(`
                    <div class="text-yellow-500 text-2xl mb-4">VICTORY</div>
                    <div class="text-white">Found ${gold} Gold</div>
                    <div class="text-white">Party +${xp} XP</div>
                    <button class="mt-4 border border-white px-4 py-2 hover:bg-gray-800" onclick="Game.Views.UI.closeModal(); Game.Views.UI.switchScene(false);">CONTINUE</button>
                `);
            } else {
                GameState.ui.mode = 'EXPLORE';
                Systems.Battle3D.setFocus('neutral');
                UI.showModal(`
                    <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
                    <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
                `);
            }
        }
    },
};
