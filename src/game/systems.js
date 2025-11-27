import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';
import { UI } from './windows.js';

// ------------------- SYSTEMS DEFINITIONS -------------------

export const Systems = {
    sceneHooks: { onBattleStart: null, onBattleEnd: null },

    Effekseer: {
        context: null,
        initPromise: null,
        cache: {},
        zToYUpMatrix: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
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
        preload() {
            const effectPromises = Object.entries(Data.effects).map(([name, path]) => {
                return this.loadEffect(name, path);
            });
            return Promise.all(effectPromises);
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

    Map: {
        tileAt(x, y) {
            const map = $gameMap.tiles;
            if (!map[y] || map[y][x] === undefined) return 1;
            return map[y][x];
        },
        resolveTile(code) {
            const pos = $gameMap.playerPos;
            if (code === 2) { 
                $gameMap.tiles[pos.y][pos.x] = 0;
                Systems.Battle.startEncounter();
            } else if (code === 3) { 
                // $gameSystem.floor++;
                Log.add('Descended...');
                // $gameMap.generateFloor($gameSystem.floor);
            } else if (code === 4) { 
                const treasure = Data.events.treasure;
                const amt = treasure.gold.base
                    + Math.floor(Math.random() * treasure.gold.random)
                    // + treasure.gold.perFloor * $gameSystem.floor;
                $gameParty.gainGold(amt);
                $gameMap.tiles[pos.y][pos.x] = 0;
                Log.loot(`Found ${amt} Gold!`);
            } else if (code === 5) { 
                $gameMap.tiles[pos.y][pos.x] = 0;
                Systems.Events.shop();
            } else if (code === 6) { 
                $gameMap.tiles[pos.y][pos.x] = 0;
                Systems.Events.recruit();
            } else if (code === 7) { 
                $gameMap.tiles[pos.y][pos.x] = 0;
                Systems.Events.shrine();
            } else if (code === 8) { 
                $gameMap.tiles[pos.y][pos.x] = 0;
                Systems.Events.trap();
            }
        }
    },

    Explore: {
        init() { this.resize(); },
        resize() {
            const canvas = document.getElementById('explore-canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.render();
        },
        move(dx, dy) {
            // if ($gameSystem.ui.mode !== 'EXPLORE' || $gameSystem.ui.formationMode) return;
            const newX = $gameMap.playerPos.x + dx;
            const newY = $gameMap.playerPos.y + dy;
            const tile = Systems.Map.tileAt(newX, newY);
            if (tile !== 1) {
                $gameMap.playerPos = { x: newX, y: newY };
                this.checkTile(tile);
                this.render();
            }
        },
        checkTile(code) {
            Systems.Map.resolveTile(code);
            UI.updateHUD();
        },
        render() {
            const canvas = document.getElementById('explore-canvas');
            const ctx = canvas.getContext('2d');
            const mapCfg = Data.dungeons.default.map;
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, w, h);
            
            const offsetX = (w / 2) - ($gameMap.playerPos.x * mapCfg.tileSize);
            const offsetY = (h / 2) - ($gameMap.playerPos.y * mapCfg.tileSize);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            
            for (let y = 0; y < mapCfg.height; y++) {
                for (let x = 0; x < mapCfg.width; x++) {
                    const dist = Math.hypot(x - $gameMap.playerPos.x, y - $gameMap.playerPos.y);
                    if (dist < mapCfg.viewDistance) $gameMap._visited[y][x] = true;
                    if (!$gameMap._visited[y][x]) continue;
                    
                    const tile = $gameMap.tiles[y][x];
                    const px = x * mapCfg.tileSize;
                    const py = y * mapCfg.tileSize;
                    
                    if (tile === 1) {
                        ctx.fillStyle = '#333';
                        ctx.fillRect(px, py, mapCfg.tileSize, mapCfg.tileSize);
                        ctx.strokeStyle = '#111';
                        ctx.strokeRect(px, py, mapCfg.tileSize, mapCfg.tileSize);
                    } else {
                        ctx.fillStyle = '#1a1a1a';
                        ctx.fillRect(px, py, mapCfg.tileSize, mapCfg.tileSize);
                        ctx.strokeStyle = '#222';
                        ctx.strokeRect(px, py, mapCfg.tileSize, mapCfg.tileSize);
                        
                        ctx.font = '32px serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const cx = px + mapCfg.tileSize / 2;
                        const cy = py + mapCfg.tileSize / 2;
                        if (tile === 2) ctx.fillText('👹', cx, cy);
                        else if (tile === 3) ctx.fillText('🪜', cx, cy);
                        else if (tile === 4) ctx.fillText('💰', cx, cy);
                        else if (tile === 5) ctx.fillText('🛒', cx, cy);
                        else if (tile === 6) ctx.fillText('🤝', cx, cy);
                        else if (tile === 7) ctx.fillText('⛪', cx, cy);
                        else if (tile === 8) ctx.fillText('☠️', cx, cy);
                    }
                    if (dist >= mapCfg.viewDistance) {
                        ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        ctx.fillRect(px, py, mapCfg.tileSize, mapCfg.tileSize);
                    }
                }
            }
            const playerX = $gameMap.playerPos.x * mapCfg.tileSize;
            const playerY = $gameMap.playerPos.y * mapCfg.tileSize;
            ctx.font = '36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 15;
            ctx.fillText('🧙‍♂️', playerX + mapCfg.tileSize / 2, playerY + mapCfg.tileSize / 2);
            ctx.restore();
        }
    },

    Events: {
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
        shop() {
            Log.add('You discover a mysterious merchant.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
            const shopData = Data.events.shop;
            const stock = [];
            for (let i = 0; i < shopData.stock.count.items; i++) {
                const pool = shopData.stock.pools.items;
                const key = pool[Math.floor(Math.random() * pool.length)];
                if (Data.items[key]) stock.push({ type: 'item', id: key });
            }
            for (let i = 0; i < shopData.stock.count.equipment; i++) {
                const pool = shopData.stock.pools.equipment;
                const key = pool[Math.floor(Math.random() * pool.length)];
                if (Data.equipment[key]) stock.push({ type: 'equip', id: key });
            }

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
                    if ($gameParty.gold >= price) {
                        $gameParty.gainGold(-price);
                        $gameParty.gainItem(def, 1, s.type === 'equip');
                        Log.loot(`Bought ${def.name}.`);
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
            const leaveBtn = document.createElement('button');
            leaveBtn.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700';
            leaveBtn.innerText = 'Leave';
            leaveBtn.onclick = () => { Systems.Events.close(); };
            container.appendChild(leaveBtn);
            this.show('SHOP', container);
        },
        recruit() {
            Log.add('You encounter a wandering soul.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
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
                    const floor = 1; // Placeholder
                    const actor = new Game_Actor(def.id, floor);
                    const emptySlot = $gameParty.firstEmptySlot();
                    if (emptySlot !== -1) {
                        $gameParty.addActor(actor, emptySlot);
                        Log.add(`${actor.name()} joins your party.`);
                    } else {
                        $gameParty.addActorToRoster(actor);
                        Log.add(`${actor.name()} waits in reserve.`);
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
        shrine() {
            Log.add('You find a glowing shrine.');
            $gameParty.members.forEach(actor => {
                actor.applyHealing(actor.getMaxHp());
            });
            UI.renderParty();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-green-500 text-xl">Your party feels rejuvenated.</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('SHRINE', msg);
        },
        trap() {
            Log.add('A hidden trap triggers!');
            $gameParty.activeMembers.forEach(actor => {
                const dmg = Math.ceil(actor.getMaxHp() * 0.2);
                actor._hp = Math.max(0, actor.hp - dmg);
                if (actor.hp === 0) Log.battle(`${actor.name()} was knocked out by the trap!`);
            });
            UI.renderParty();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-red-500 text-xl">A trap harms your party!</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('TRAP', msg);
        }
    },

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
        damageLabels: [], // Track damage numbers

        init() {
            const container = document.getElementById('three-container');
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a0a);
            
            this.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.up.set(0, 0, 1);
            
            this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(this.renderer.domElement);
            
            Systems.Effekseer.init(this.renderer);
            
            const amb = new THREE.AmbientLight(0xffffff, 0.6);
            const dir = new THREE.DirectionalLight(0xffffff, 0.8);
            dir.position.set(10, -10, 20);
            this.scene.add(amb);
            this.scene.add(dir);
            
            const grid = new THREE.GridHelper(30, 30, 0x444444, 0x111111);
            grid.rotation.x = Math.PI / 2;
            this.scene.add(grid);
            
            this.textureLoader = new THREE.TextureLoader();
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.animate();
        },
        resize() {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        },
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
                    sprite.userData.uid = unit.uid;
                    sprite.userData.baseScale = baseScale;
                    sprite.userData.baseZ = baseScale.y / 2;
                    
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
            if (window.$gameSystem && $gameSystem.uiMode === 'BATTLE_WIN') {
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

            // Update damage labels every frame
            this.updateDamageLabels();
        },
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
        },
        
// Physics-based Damage Numbers (The "Final Fantasy" Bounce)
showDamageNumber(uid, val, isCrit = false) {
            if (val === 0) return;
            const sprite = this.sprites[uid];
            if (!sprite) return;

            const valStr = Math.abs(val).toString();
            const prefix = ''; 
            
            // 1. Setup Spacing (WIDER)
            const spacing = 0.35; // Increased from 0.25
            const totalWidth = (valStr.length - 1) * spacing;
            const startX = -(totalWidth / 2);

            // 2. Setup Spawn Position (Knee/Waist height)
            const basePos = sprite.position.clone();
            basePos.z += (sprite.userData.baseScale.y * 0.25); 

            // 3. Physics Setup (Subtle)
            const sharedVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01, 
                (Math.random() - 0.5) * 0.01, 
                0.06 + (Math.random() * 0.02)
            );

            for (let i = 0; i < valStr.length; i++) {
                const char = valStr[i];
                
                const el = document.createElement('div');
                el.className = 'damage-number';
                el.innerText = (i === 0 ? prefix : '') + char;
                el.style.opacity = '0'; 

                if (val > 0) {
                     el.style.color = '#4ade80';
                } else {
                    el.style.color = isCrit ? '#ffcc00' : '#ffffff'; 
                    if (isCrit) el.style.fontSize = '3rem';
                }

                document.getElementById('battle-ui-overlay').appendChild(el);

                const digitPos = basePos.clone();
                digitPos.x += startX + (i * spacing);

                this.damageLabels.push({
                    el: el,
                    worldPos: digitPos,
                    offset: new THREE.Vector3(0, 0, 0),
                    velocity: sharedVelocity.clone(), 
                    gravity: 0.008, 
                    elasticity: 0.5,
                    floorHit: false,
                    life: 60,
                    wait: i * 3 
                });
            }
        },

        updateDamageLabels() {
            if (this.damageLabels.length === 0) return;

            for (let i = this.damageLabels.length - 1; i >= 0; i--) {
                const label = this.damageLabels[i];

                if (label.wait > 0) {
                    label.wait--;
                    continue; 
                } else {
                    if (label.el.style.opacity === '0') label.el.style.opacity = '1';
                }

                // Apply velocity to offset
                label.velocity.z -= label.gravity;
                label.offset.add(label.velocity);

                // Floor Logic
                const floorLevel = -1.25; 

                if (label.offset.z <= floorLevel) {
                    label.offset.z = floorLevel; // Clamp to floor
                    
                    if (!label.floorHit) {
                        // First Bounce: Reverse vertical velocity
                        label.velocity.z *= -label.elasticity;
                        label.floorHit = true;
                    } else {
                        // Second Hit (Slide): Kill ALL movement (X, Y, Z)
                        // This stops the drifting immediately.
                        label.velocity.set(0, 0, 0);
                        label.gravity = 0; // Disable gravity so it doesn't build up negative Z
                    }
                }

                const currentWorldPos = label.worldPos.clone().add(label.offset);
                currentWorldPos.project(this.camera);

                const width = window.innerWidth;
                const height = window.innerHeight;
                
                const x = (currentWorldPos.x * 0.5 + 0.5) * width;
                const y = (-(currentWorldPos.y * 0.5) + 0.5) * height;

                label.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

                label.life--;
                if (label.life < 15) {
                    label.el.style.opacity = (label.life / 15).toString();
                }

                if (label.life <= 0) {
                    label.el.remove();
                    this.damageLabels.splice(i, 1);
                }
            }
        },
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
    },

    Triggers: {
        fire(eventName, ...args) {
            const allUnits = [...($gameParty.activeMembers || []), ...(window.$gameTroop?.members() || [])];
            allUnits.forEach(unit => {
                if(unit.hp <= 0) return;
                const unitWithStats = Systems.Battle.getUnitWithStats(unit);
                const traits = [];
                const species = Data.creatures[unit.speciesId];
                if (species && species.passives) {
                    species.passives.forEach(passiveId => {
                        const passive = Data.passives[passiveId];
                        if (passive) traits.push(...passive.traits);
                    });
                }
                if (unit.equipmentId) {
                    const equipment = Data.equipment[unit.equipmentId];
                    if (equipment) traits.push(...equipment.traits);
                }
                traits.forEach(trait => {
                    this.handleTrait(eventName, trait, unit, ...args);
                });
            });
        },
        handleTrait(eventName, trait, unit, ...args) {
            switch (eventName) {
                case 'onBattleEnd':
                    if(unit.evadeBonus) unit.evadeBonus = 0;
                    if (trait.type === 'post_battle_heal') {
                        const healAmount = Math.floor(Math.pow(Math.random(), 2) * unit.level) + 1;
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + healAmount);
                        Log.add(`${unit.name()} was healed by Soothing Breeze.`);
                    } else if (trait.type === 'post_battle_leech') {
                        const party = args[0];
                        const adjacent = this.getAdjacentUnits(unit, party);
                        let totalDamage = 0;
                        adjacent.forEach(target => {
                            const damage = parseInt(trait.formula) || 0;
                            target.hp = Math.max(0, target.hp - damage);
                            totalDamage += damage;
                            Log.add(`${unit.name()} leeched ${damage} HP from ${target.name()}.`);
                        });
                        const leechHeal = Math.floor(totalDamage / 2);
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + leechHeal);
                        Log.add(`${unit.name()} recovered ${leechHeal} HP.`);
                    }
                    break;
                case 'onTurnStart':
                    if (trait.type === 'turn_heal') {
                        const healAmount = parseInt(trait.formula) || 0;
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + healAmount);
                    }
                    break;
                case 'onUnitDeath':
                    if (trait.type === 'on_death_cast') {
                        const [deadUnit] = args;
                        if (deadUnit.uid === unit.uid) {
                            const skill = Data.skills[trait.skill.toLowerCase()];
                            if (skill) {
                                const enemies = $gameTroop.members().filter(e => e.hp > 0);
                                Systems.Battle.applyEffects(skill, unit, enemies);
                                Log.battle(`${unit.name()} casts ${skill.name} upon death!`);
                            }
                        }
                    }
                    break;
                case 'onUnitEvade':
                     if (trait.type === 'evade_bonus') {
                        const [evadingUnit] = args;
                        if (evadingUnit.uid === unit.uid) {
                            const maxBonus = Math.floor(unit.level / 2);
                            if(!unit.evadeBonus) unit.evadeBonus = 0;
                            if(unit.evadeBonus < maxBonus){
                                unit.evadeBonus += 1;
                                Log.battle(`${unit.name()} gained +1 bonus from evading!`);
                            }
                        }
                    }
                    break;
            }
        },
        getAdjacentUnits(unit, party) {
            const adjacent = [];
            const index = unit.slotIndex;
            if(index === -1) return [];
            const potentialAdjacent = [
                index - 1, 
                index + 1, 
                index - 3, 
                index + 3  
            ];
            potentialAdjacent.forEach(adjIndex => {
                if(index % 3 === 0 && adjIndex === index-1) return;
                if(index % 3 === 2 && adjIndex === index+1) return;
                const adjacentUnit = party.find(u => u && u.slotIndex === adjIndex);
                if(adjacentUnit) adjacent.push(adjacentUnit);
            });
            return adjacent;
        }
    },

    Battle: {
        elementStrengths: { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' },
        elementWeaknesses: { G: 'R', B: 'G', R: 'B', W: 'W', K: 'K' },
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
        calculateEffectValue(effect, action, a, b) {
            if (!effect.formula) return 0;
            let value = 0;
            try {
                value = Math.floor(eval(effect.formula));
            } catch (e) {
                console.error('Error evaluating formula:', effect.formula, e);
                return 0;
            }
            const element = action.element;
            const attackerWithStats = this.getUnitWithStats(a);
            const attackMult = this.elementMultiplier(element, attackerWithStats, 'attacker');
            const defenderWithStats = this.getUnitWithStats(b);
            const defenseMult = this.elementMultiplier(element, defenderWithStats, 'defender');

            const baseDamage = value + attackerWithStats.power_bonus;
            let finalValue = Math.floor(baseDamage * attackMult * defenseMult);

            const evadeChance = (defenderWithStats.evade_chance || 0);
            if (Math.random() < evadeChance) {
                Systems.Triggers.fire('onUnitEvade', b);
                return 0;
            }

            const critChance = (Data.config.baseCritChance || 0.05) + (attackerWithStats.crit_bonus_percent || 0);
            if (Math.random() < critChance) {
                finalValue = Math.floor(finalValue * (Data.config.baseCritMultiplier || 1.5));
                Log.battle('> Critical Hit!');
            }

            if (effect.type === 'hp_damage' && b.status?.includes('guarding')) {
                finalValue = Math.floor(finalValue / 2);
                Log.battle('> Guarding!');
            }
            return finalValue;
        },
        applyEffects(action, user, targets) {
            const results = [];
            (action.effects || []).forEach(effect => {
                targets.forEach(target => {
                    let value = 0;
                    if (effect.type !== 'add_status') {
                        value = this.calculateEffectValue(effect, action, user, target);
                    }
                    results.push({ target, value, effect });
                });
            });
            return results;
        },
        getUnitWithStats(unit) {
            const unitWithStats = { ...unit };
            if (unit.elements) unitWithStats.elements = [...unit.elements];
            if (unit.status) unitWithStats.status = [...unit.status];

            unitWithStats.power_bonus = 0;
            unitWithStats.speed_bonus = 0;
            unitWithStats.crit_bonus_percent = 0;
            unitWithStats.survive_ko_chance = 0;
            unitWithStats.revive_on_ko_chance = 0;
            unitWithStats.revive_on_ko_percent = 0;
            unitWithStats.xp_bonus_percent = 0;

            const processTraits = (traits) => {
              traits.forEach(trait => {
                switch (trait.type) {
                    case 'hp_bonus_percent': break;
                    case 'power_bonus': unitWithStats.power_bonus += parseInt(trait.formula) || 0; break;
                    case 'speed_bonus': unitWithStats.speed_bonus += parseInt(trait.formula) || 0; break;
                    case 'element_change': unitWithStats.elements = [trait.element]; break;
                    case 'crit_bonus_percent': unitWithStats.crit_bonus_percent += parseFloat(trait.formula) || 0; break;
                    case 'survive_ko': unitWithStats.survive_ko_chance += parseFloat(trait.formula) || 0; break;
                    case 'revive_on_ko':
                        unitWithStats.revive_on_ko_chance += parseFloat(trait.chance) || 0;
                        unitWithStats.revive_on_ko_percent += parseFloat(trait.formula) || 0;
                        break;
                    case 'xp_bonus_percent': unitWithStats.xp_bonus_percent += parseFloat(trait.formula) || 0; break;
                }
              });
            }

            if (unit.equipmentId) {
                const equipment = Data.equipment[unit.equipmentId];
                if (equipment) processTraits(equipment.traits);
            }
            const species = Data.creatures[unit.speciesId];
            if (species && species.passives) {
                species.passives.forEach(passiveId => {
                    const passive = Data.passives[passiveId];
                    if (passive) processTraits(passive.traits);
                });
            }
            return unitWithStats;
        },
        getMaxHp(unit) {
            const def = Data.creatures[unit.speciesId];
            let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
            if (unit.equipmentId) {
                const eq = Data.equipment[unit.equipmentId];
                if (eq) {
                    eq.traits.forEach(trait => {
                        if (trait.type === 'hp_bonus_percent') {
                            baseMax = Math.round(baseMax * (1 + parseFloat(trait.formula)));
                        }
                    });
                }
            }
            return baseMax + (unit.maxHpBonus || 0);
        },
        startEncounter() {
            const swipe = document.getElementById('swipe-overlay');
            swipe.className = 'swipe-down';
            setTimeout(() => {
                Systems.sceneHooks?.onBattleStart?.();
                $gameSystem.uiMode = 'BATTLE';
                UI.switchScene(true);
                Systems.Battle3D.cameraState.angle = -Math.PI / 4;
                Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
                Systems.Battle3D.setFocus('neutral');
                Systems.Battle3D.resize();

                const floor = $gameSystem.floor;
                const dungeon = Data.dungeons.default;
                const enc = dungeon.encounters;
                const pool = enc.pools.find(p => floor >= p.floors[0] && floor <= p.floors[1]);
                const enemyTypes = pool ? pool.enemies : [];
                const enemyCount = Math.floor(Math.random() * (enc.count.max - enc.count.min + 1)) + enc.count.min;
                const troopEnemies = [];
                for (let i = 0; i < enemyCount; i++) {
                    troopEnemies.push(enemyTypes[Math.floor(Math.random() * enemyTypes.length)]);
                }
                $gameTroop.setup(troopEnemies);

                window.$gameBattle = {
                    allies: $gameParty.activeMembers,
                    enemies: $gameTroop.members(),
                    queue: [],
                    turnIndex: 0,
                    roundCount: 0,
                    playerTurnRequested: false,
                    phase: 'INIT'
                };

                Systems.Battle3D.setupScene($gameBattle.allies, $gameBattle.enemies);
                Log.battle(`Enemies: ${$gameTroop.members().map(e => e.name()).join(', ')}`);
                UI.showBanner('ENCOUNTER');
                swipe.className = 'swipe-clear';
                setTimeout(() => {
                    swipe.className = 'swipe-reset';
                    setTimeout(() => Systems.Battle.nextRound(), 1500);
                }, 600);
            }, 600);
        },
        nextRound() {
            if (!$gameBattle) return;
            $gameBattle.roundCount++;
            $gameBattle.phase = 'ROUND_START';
            Systems.Battle3D.setFocus('neutral');
            if ($gameParty.activeMembers.every(u => u.hp <= 0)) return this.end(false);
            if ($gameTroop.members().every(u => u.hp <= 0)) return this.end(true);

            [...$gameParty.activeMembers, ...$gameTroop.members()].forEach(u => {
                if (u.status) {
                    u.status = u.status.filter(s => s !== 'guarding');
                }
            });

            Log.battle(`--- Round ${$gameBattle.roundCount} ---`);
            if ($gameBattle.playerTurnRequested) {
                $gameBattle.phase = 'PLAYER_INPUT';
                $gameBattle.playerTurnRequested = false;
                UI.togglePlayerTurn(true);
                Log.battle('Waiting for orders...');
                return;
            }
            const allUnits = [...$gameParty.activeMembers, ...$gameTroop.members()]
                .filter(u => u.hp > 0)
                .map(u => {
                    const unitWithStats = this.getUnitWithStats(u);
                    return { ...u, speed: unitWithStats.speed_bonus };
                });

            allUnits.sort((a, b) => b.speed - a.speed || Math.random() - 0.5);
            $gameBattle.queue = allUnits;
            $gameBattle.turnIndex = 0;
            this.processNextTurn();
        },
        requestPlayerTurn() {
            if ($gameSystem.uiMode === 'BATTLE') {
                $gameBattle.playerTurnRequested = true;
                Log.add('Interrupt queued.');
                const btn = document.getElementById('btn-player-turn');
                btn.classList.add('border-green-500', 'text-green-500');
                btn.innerText = 'QUEUED';
            }
        },
        resumeAuto() {
            UI.togglePlayerTurn(false);
            $gameBattle.playerTurnRequested = false;
            const btn = document.getElementById('btn-player-turn');
            btn.classList.remove('border-green-500', 'text-green-500');
            btn.innerText = 'STOP ROUND (SPACE)';
            this.processNextTurn();
        },
        swapUnits(idx1, idx2) {
            $gameParty.swapOrder(idx1, idx2);
            UI.renderParty();
            if ($gameSystem.uiMode === 'BATTLE') {
                $gameBattle.allies = $gameParty.activeMembers;
                Systems.Battle3D.setupScene($gameBattle.allies, $gameBattle.enemies);
            }
            Log.add('Formation changed.');
        },
        processNextTurn() {
            UI.renderParty();
            if ($gameBattle.turnIndex >= $gameBattle.queue.length) {
                setTimeout(() => this.nextRound(), 1000);
                return;
            }
            const unit = $gameBattle.queue[$gameBattle.turnIndex++];
            if (unit.hp <= 0) {
                this.processNextTurn();
                return;
            }
            Systems.Triggers.fire('onTurnStart', unit);
            const isAlly = $gameParty.members.includes(unit);
            Systems.Battle3D.setFocus(isAlly ? 'ally' : 'enemy');
            const enemies = isAlly ? $gameTroop.members() : $gameParty.activeMembers;
            const friends = isAlly ? $gameParty.activeMembers : $gameTroop.members();
            const possibleActs = [...unit.acts[0], ...(unit.acts[1] || [])];
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

            let action = null;
            const chosenLower = chosen.toLowerCase();
            const skillKey = Object.keys(Data.skills).find(k => k.toLowerCase() === chosenLower);
            const itemKey = Object.keys(Data.items).find(k => k.toLowerCase() === chosenLower);

            if (skillKey) action = Data.skills[skillKey];
            else if (itemKey) action = Data.items[itemKey];
            else action = Data.skills['attack'];

            let targets = [];
            const validEnemies = enemies.filter(u => u.hp > 0);
            const validFriends = friends.filter(u => u.hp > 0);
            if (action.target === 'self') targets = [unit];
            else if (action.target === 'ally-single') targets = [validFriends.sort((a, b) => a.hp - b.hp)[0]];
            else if (action.target === 'enemy-all') targets = validEnemies;
            else if (action.target === 'enemy-row') {
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
            UI.showBanner(`${unit.name()} used ${action.name}!`);
            const results = this.applyEffects(action, unit, targets);

            if (results.length === 0) {
                Log.battle(`> ${unit.name()} used ${action.name}!`);
            }

            const script = Data.actionScripts[action.script] || Data.actionScripts.attack || [];
            const applyResults = () => {
                results.forEach(({ target, value, effect }) => {
                    if (!target) return;
                    switch (effect.type) {
                        case 'hp_damage':
                            let dealtDamage = value;
                            let newHp = target.hp - dealtDamage;
                            const defenderWithStats = Systems.Battle.getUnitWithStats(target);
                            if (newHp <= 0) {
                                if (Math.random() < (defenderWithStats.survive_ko_chance || 0)) {
                                    newHp = 1;
                                    dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                                    Log.battle(`> ${target.name()} survives with 1 HP!`);
                                }
                            }
                            target.hp = Math.max(0, newHp);
                            if (dealtDamage > 0) {
                                Log.battle(`> ${unit.name()} hits ${target.name()} for ${dealtDamage}.`);
                                Systems.Battle3D.showDamageNumber(target.uid, -dealtDamage);
                                Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', shake: 0.8, opacity: 0.7, color: 0xffffff}]);
                            }
                            if (target.hp <= 0) {
                                Log.battle(`> ${target.name()} was defeated!`);
                                Systems.Battle3D.playDeathFade(target.uid);
                                Systems.Triggers.fire('onUnitDeath', target);
                                if (Math.random() < (defenderWithStats.revive_on_ko_chance || 0)) {
                                    const revivePercent = defenderWithStats.revive_on_ko_percent || 0.5;
                                    const revivedHp = Math.floor(Systems.Battle.getMaxHp(target) * revivePercent);
                                    target.hp = revivedHp;
                                    Log.battle(`> ${target.name()} was revived with ${revivedHp} HP!`);
                                    const revivedTs = Systems.Battle3D.sprites[target.uid];
                                    if (revivedTs) revivedTs.visible = true;
                                }
                            }
                            break;
                        case 'hp_heal':
                            const maxhp = Systems.Battle.getMaxHp(target);
                            target.hp = Math.min(maxhp, target.hp + value);
                            Log.battle(`> ${target.name()} healed for ${value}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, value);
                            Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', opacity: 0.5, color: 0x00ff00}]);
                            break;
                        case 'hp_heal_ratio':
                            const maxHpRatio = Systems.Battle.getMaxHp(target);
                            const healAmount = Math.floor(maxHpRatio * parseFloat(effect.formula));
                            target.hp = Math.min(maxHpRatio, target.hp + healAmount);
                            Log.battle(`> ${target.name()} healed for ${healAmount}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, healAmount);
                            break;
                        case 'revive':
                            if (target.hp <= 0) {
                                const revivedHp = Math.floor(Systems.Battle.getMaxHp(target) * parseFloat(effect.formula));
                                target.hp = revivedHp;
                                Log.battle(`> ${target.name()} was revived with ${revivedHp} HP.`);
                                const ts = Systems.Battle3D.sprites[target.uid];
                                if (ts) ts.visible = true;
                            }
                            break;
                        case 'increase_max_hp':
                            const bonus = parseInt(effect.formula);
                            target.maxHpBonus = (target.maxHpBonus || 0) + bonus;
                            target.hp += bonus;
                            Log.battle(`> ${target.name()}'s Max HP increased by ${bonus}.`);
                            break;
                        case 'add_status':
                            if (Math.random() < (effect.chance || 1)) {
                                if (!target.status) target.status = [];
                                if (!target.status.includes(effect.status)) {
                                    target.status.push(effect.status);
                                }
                                Log.battle(`> ${target.name()} is now ${effect.status}.`);
                            }
                            break;
                    }
                });
                UI.renderParty();
                if ($gameParty.activeMembers.every(u => u.hp <= 0) || $gameTroop.members().every(u => u.hp <= 0)) {
                    $gameBattle.turnIndex = 999;
                }
            };
            Systems.Battle3D.playAnim(unit.uid, script, {
                targets,
                onApply: applyResults,
                onComplete: () => setTimeout(() => this.processNextTurn(), 600)
            });
        },
        end(win) {
            document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                UI.showBanner('VICTORY');
                $gameSystem.uiMode = 'BATTLE_WIN';
                Systems.sceneHooks?.onBattleEnd?.();
                Systems.Triggers.fire('onBattleEnd', [...$gameParty.activeMembers, ...$gameTroop.members()].filter(u => u && u.hp > 0));
                Systems.Battle3D.setFocus('victory');
                const gold = $gameTroop.members().length * Data.config.baseGoldPerEnemy * $gameSystem.floor;
                const baseXp = $gameTroop.members().length * Data.config.baseXpPerEnemy * $gameSystem.floor;
                $gameParty.gainGold(gold);
                let finalXp = baseXp;
                $gameParty.activeMembers.forEach(p => {
                    if (p) {
                        const unitWithStats = this.getUnitWithStats(p);
                        finalXp = Math.round(baseXp * (1 + (unitWithStats.xp_bonus_percent || 0)));
                        p.exp = (p.exp || 0) + finalXp;
                        const def = Data.creatures[p.speciesId];
                        let levelCost = def.xpCurve * p.level;
                        let levelUpOccurred = false;
                        while (p.exp >= levelCost) {
                            p.exp -= levelCost;
                            p.level++;
                            levelCost = def.xpCurve * p.level;
                            levelUpOccurred = true;
                        }
                        if (levelUpOccurred) Log.add(`${p.name()} Lv UP -> ${p.level}!`);
                    }
                });
                $gameParty.activeMembers.forEach(p => {
                    if (p) {
                        p.applyHealing(Math.floor(p.getMaxHp() * 0.25));
                    }
                });
                UI.updateHUD();
                UI.showModal(`
                    <div class="text-yellow-500 text-2xl mb-4">VICTORY</div>
                    <div class="text-white">Found ${gold} Gold</div>
                    <div class="text-white">Party +${finalXp} XP</div>
                    <button class="mt-4 border border-white px-4 py-2 hover:bg-gray-800" onclick="Game.Views.UI.closeModal(); Game.Views.UI.switchScene(false);">CONTINUE</button>
                `);
            } else {
                $gameSystem.uiMode = 'EXPLORE';
                Systems.Battle3D.setFocus('neutral');
                UI.showModal(`
                    <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
                    <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
                `);
            }
        }
    },
};