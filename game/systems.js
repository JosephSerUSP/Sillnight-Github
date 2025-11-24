import { Data } from './data.js';
import { GameState } from './state.js';
import { Log } from './log.js';

const Systems = {
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
            Systems.UI.updateHUD();
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
                        Systems.UI.updateHUD();
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
                row.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">${def.sprite}</span><div><div class="text-yellow-100">${def.name}</div><div class="text-xs text-gray-500">HP ${def.baseHp}</div></div></div>`;
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
                        level: GameState.run.floor,
                        maxhp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        hp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        exp: 0,
                        temperament: def.temperament,
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
                    Systems.UI.renderParty();
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
            Systems.UI.renderParty();
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
            Systems.UI.renderParty();
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
            const createSprite = (unit, isEnemy) => {
                if (!unit) return;
                const pos = getPos(isEnemy, unit.slotIndex);
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
                const tex = new THREE.CanvasTexture(canvas);
                tex.magFilter = THREE.NearestFilter;
                const mat = new THREE.SpriteMaterial({ map: tex });
                const sprite = new THREE.Sprite(mat);
                sprite.position.set(pos.x, pos.y, 1.5);
                sprite.scale.set(3, 3, 1);
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
                sprite.scale.set(3, 3, 1);
            }
        },
        // Plays various battle animations based on action type and value. Accepts a callback
        // to be invoked after the animation completes.
        playAnim(uid, type, val, cb) {
            const sprite = this.sprites[uid];
            if (!sprite) { if (cb) cb(); return; }
            // Ensure sprite resets before each animation
            this.resetSprite(uid);
            if (type === 'jump') {
                let t = 0;
                const startZ = sprite.position.z;
                const jump = setInterval(() => {
                    t += 0.6;
                    sprite.position.z = startZ + Math.sin(t) * 0.75;
                    if (t >= Math.PI) {
                        clearInterval(jump);
                        sprite.position.z = startZ;
                        if (cb) cb();
                    }
                }, 30);
            } else if (type === 'flash') {
                sprite.material.blending = THREE.AdditiveBlending;
                const targetColor = val < 0 ? 0x00ff00 : (val > 0 ? 0xff0000 : 0x8888ff);
                let count = 0;
                const f = setInterval(() => {
                    count++;
                    if (count % 2 === 0) sprite.material.color.setHex(0xffffff);
                    else sprite.material.color.setHex(targetColor);
                    if (count > 5) {
                        clearInterval(f);
                        this.resetSprite(uid);
                        if (cb) cb();
                    }
                }, 50);
            } else if (type === 'thunder') {
                // Create cloud billboard
                const cloudGrp = this.createBillboard('⛈️', sprite.position.x, sprite.position.y, sprite.position.z + 0.5, 0.8);
                const cloudSprite = cloudGrp.children[0];
                cloudSprite.material.blending = THREE.AdditiveBlending;
                this.group.add(cloudGrp);
                let ct = 0;
                const anim = setInterval(() => {
                    ct += 0.1;
                    cloudSprite.position.z += 0.05;
                    cloudSprite.material.opacity = Math.max(0, 1 - ct * 0.5);
                    if (ct > 0.5 && ct < 1.5) {
                        sprite.material.blending = THREE.AdditiveBlending;
                        sprite.material.color.setHex(ct % 0.2 < 0.1 ? 0xffff00 : 0xffffff);
                    }
                    if (ct > 2) {
                        clearInterval(anim);
                        this.group.remove(cloudGrp);
                        this.resetSprite(uid);
                        if (cb) cb();
                    }
                }, 30);
            } else if (type === 'cure') {
                // Sparkles swirl down and heal
                const sparkles = [];
                for (let i = 0; i < 3; i++) {
                    const s = this.createBillboard('✨', sprite.position.x, sprite.position.y, sprite.position.z + 3, 0.5);
                    s.children[0].material.blending = THREE.AdditiveBlending;
                    this.group.add(s);
                    sparkles.push({ m: s, ang: i * (Math.PI * 2 / 3) });
                }
                let t = 0;
                const anim = setInterval(() => {
                    t += 0.1;
                    sparkles.forEach(s => {
                        s.ang += 0.3;
                        s.m.children[0].position.z -= 0.1;
                        s.m.children[0].position.x = sprite.position.x + Math.cos(s.ang) * 0.5;
                        s.m.children[0].position.y = sprite.position.y + Math.sin(s.ang) * 0.5;
                    });
                    if (t > 3) {
                        clearInterval(anim);
                        sparkles.forEach(s => this.group.remove(s.m));
                        if (cb) cb();
                    }
                }, 30);
            } else if (type === 'tornado') {
                let t = 0;
                const startZ = sprite.position.z;
                const startX = sprite.position.x;
                const leaves = [];
                for (let i = 0; i < 4; i++) {
                    const l = this.createBillboard('🍃', startX, sprite.position.y, startZ + Math.random(), 0.4);
                    this.group.add(l);
                    leaves.push({ m: l, ang: i * (Math.PI / 2) });
                }
                const lift = setInterval(() => {
                    t += 0.1;
                    if (t < Math.PI) sprite.position.z = startZ + Math.sin(t * 0.5) * 3;
                    leaves.forEach(l => {
                        l.ang += 0.4;
                        l.m.children[0].position.x = sprite.position.x + Math.cos(l.ang) * 1;
                        l.m.children[0].position.y = sprite.position.y + Math.sin(l.ang) * 1;
                        l.m.children[0].position.z = sprite.position.z + 0.5;
                    });
                    sprite.position.x = startX + Math.cos(t * 4) * 0.2;
                    if (t > 4) {
                        clearInterval(lift);
                        sprite.position.z = startZ;
                        sprite.position.x = startX;
                        leaves.forEach(l => this.group.remove(l.m));
                        let bt = 0;
                        const bounce = setInterval(() => {
                            bt += 0.5;
                            sprite.position.z = startZ + Math.abs(Math.sin(bt)) * 0.5 * (Math.PI - bt);
                            if (bt >= Math.PI) {
                                clearInterval(bounce);
                                sprite.position.z = startZ;
                                if (cb) cb();
                            }
                        }, 30);
                    }
                }, 30);
            } else if (type === 'hit') {
                // Shake horizontally and display damage numbers
                let jiggle = 0;
                const baseX = sprite.position.x;
                const shake = setInterval(() => {
                    jiggle++;
                    sprite.position.x = baseX + (Math.random() - 0.5) * 0.4;
                    if (jiggle > 8) {
                        clearInterval(shake);
                        sprite.position.x = baseX;
                    }
                }, 40);
                // Show number overlay
                const screenPos = this.toScreen(sprite);
                const el = document.createElement('div');
                el.className = `damage-number ${val < 0 ? 'text-green-400' : 'text-white'}`;
                el.innerText = Math.abs(val);
                el.style.left = (screenPos.x / window.devicePixelRatio) + 'px';
                el.style.top = (screenPos.y / window.devicePixelRatio) + 'px';
                document.getElementById('battle-ui-overlay').appendChild(el);
                setTimeout(() => el.remove(), 1500);
                if (cb) cb();
            } else if (type === 'die') {
                sprite.material.color.setHex(0xff00ff);
                sprite.material.blending = THREE.AdditiveBlending;
                let t = 0;
                const startScaleX = sprite.scale.x;
                const startScaleY = sprite.scale.y;
                const anim = setInterval(() => {
                    t += 0.02;
                    const p = 1 - Math.pow(1 - t, 3);
                    const newH = startScaleY * (1 + p * 2);
                    sprite.scale.x = startScaleX * (1 - p);
                    sprite.scale.y = newH;
                    sprite.position.z = newH / 2;
                    sprite.material.opacity = 1 - p;
                    if (t >= 1) {
                        clearInterval(anim);
                        sprite.visible = false;
                        if (cb) cb();
                    }
                }, 32);
            } else {
                // Unknown animation: just callback
                if (cb) cb();
            }
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
                GameState.ui.mode = 'BATTLE';
                Systems.UI.switchScene(true);
                // Reset camera state
                Systems.Battle3D.cameraState.angle = -Math.PI / 4;
                Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
                Systems.Battle3D.setFocus('neutral');
                Systems.Battle3D.resize();
                // Build allies from active party
                const allies = GameState.party.activeSlots.filter(u => u !== null).map(u => u);
                // Generate random enemies based on floor level
                const enemyCount = Math.floor(Math.random() * 3) + 1;
                const enemyTypes = ['goblin', 'skeleton', 'pixie', 'golem', 'lich'];
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
                        level: GameState.run.floor,
                        hp: Math.floor(def.baseHp * mult),
                        maxhp: Math.floor(def.baseHp * mult),
                        temperament: def.temperament,
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
                Systems.UI.showBanner('ENCOUNTER');
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
                Systems.UI.togglePlayerTurn(true);
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
            Systems.UI.togglePlayerTurn(false);
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
            Systems.UI.renderParty();
            if (GameState.ui.mode === 'BATTLE') {
                GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
            }
            Log.add('Formation changed.');
        },
        processNextTurn() {
            Systems.UI.renderParty();
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
            Systems.UI.showBanner(`${unit.name} used ${action.name}!`);
            // Jump animation before executing
            Systems.Battle3D.playAnim(unit.uid, 'jump', 0);
            setTimeout(() => {
                targets.forEach(t => {
                    let value = 0;
                    if (action.category === 'damage' || action.category === 'heal') {
                        const pow = action.power || 0;
                        const sc = action.scaling || 0;
                        value = Math.floor(pow + sc * unit.level);
                        if (action.category === 'heal') value = -value; // negative for heals
                        const animType = action.animation === 'cure' ? 'cure' : action.animation;
                        const apply = () => {
                            if (value < 0) {
                                const maxhp = Systems.Battle.getMaxHp(t);
                                t.hp = Math.min(maxhp, t.hp - value);
                                Log.battle(`> ${t.name} healed for ${Math.abs(value)}.`);
                                Systems.Battle3D.playAnim(t.uid, 'flash', -1);
                            } else {
                                t.hp = Math.max(0, t.hp - value);
                                Systems.Battle3D.playAnim(t.uid, 'hit', value);
                                Log.battle(`> ${unit.name} hits ${t.name} for ${value}.`);
                                if (t.hp <= 0) {
                                    Systems.Battle3D.playAnim(t.uid, 'die', 0);
                                    Log.battle(`> ${t.name} was defeated!`);
                                }
                            }
                        };
                        if (animType === 'flash') {
                            apply();
                            Systems.Battle3D.playAnim(t.uid, 'flash', value > 0 ? 1 : -1);
                        } else {
                            Systems.Battle3D.playAnim(t.uid, animType, 0, apply);
                        }
                    } else if (action.category === 'effect') {
                        Log.battle(`> ${unit.name} stands ready.`);
                        Systems.Battle3D.playAnim(t.uid, 'flash', 0);
                    }
                });
                // Re-render party HP bars and check for end-of-battle
                Systems.UI.renderParty();
                if (GameState.battle.allies.every(u => u.hp <= 0) || GameState.battle.enemies.every(u => u.hp <= 0)) {
                    GameState.battle.turnIndex = 999;
                }
                const delay = (chosen.toLowerCase() === 'tornado' || chosen.toLowerCase() === 'thunder') ? 1500 : 1000;
                setTimeout(() => this.processNextTurn(), delay);
            }, 600);
        },
        end(win) {
            // Clear all UI overlays
            document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                Systems.UI.showBanner('VICTORY');
                GameState.ui.mode = 'BATTLE_WIN';
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
                Systems.UI.updateHUD();
                Systems.UI.showModal(`
                    <div class="text-yellow-500 text-2xl mb-4">VICTORY</div>
                    <div class="text-white">Found ${gold} Gold</div>
                    <div class="text-white">Party +${xp} XP</div>
                    <button class="mt-4 border border-white px-4 py-2 hover:bg-gray-800" onclick="Systems.UI.closeModal(); Systems.UI.switchScene(false);">CONTINUE</button>
                `);
            } else {
                GameState.ui.mode = 'EXPLORE';
                Systems.Battle3D.setFocus('neutral');
                Systems.UI.showModal(`
                    <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
                    <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
                `);
            }
        }
    },
    /*
     * UI system: all functions that directly manipulate the DOM live here.
     * It renders HUD, party grid, modals, and handles user interactions.
     */
    UI: {
        updateHUD() {
            document.getElementById('hud-floor').innerText = GameState.run.floor;
            document.getElementById('hud-gold').innerText = GameState.run.gold;
        },
        renderParty() {
            const grid = document.getElementById('party-grid');
            grid.innerHTML = '';
            GameState.party.activeSlots.forEach((u, i) => {
                const div = document.createElement('div');
                div.className = 'party-slot relative flex flex-col p-1';
                if (u) {
                    const maxhp = Systems.Battle.getMaxHp(u);
                    const hpPct = (u.hp / maxhp) * 100;
                    const color = hpPct < 30 ? 'bg-red-600' : 'bg-green-600';
                    div.innerHTML = `
                        <div class="flex justify-between text-xs text-gray-300">
                            <span>${u.name}</span> <span class="text-[10px]">Lv${u.level}</span>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center opacity-10 text-3xl pointer-events-none">${u.sprite}</div>
                        <div class="mt-auto w-full h-1 bg-gray-800"><div class="${color} h-full transition-all duration-300" style="width:${hpPct}%"></div></div>
                        <div class="text-[10px] text-right text-gray-500">${u.hp}/${maxhp}</div>
                    `;
                    div.onclick = () => {
                        if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
                            const selected = document.querySelector('.party-slot.selected');
                            if (selected) {
                                const idx = parseInt(selected.dataset.idx);
                                selected.classList.remove('selected');
                                if (idx !== i) {
                                    if (GameState.ui.mode === 'BATTLE') {
                                        Systems.Battle.swapUnits(idx, i);
                                    } else {
                                        // Swap outside battle
                                        const u1 = GameState.party.activeSlots[idx];
                                        const u2 = GameState.party.activeSlots[i];
                                        GameState.party.activeSlots[idx] = u2;
                                        GameState.party.activeSlots[i] = u1;
                                        if (GameState.party.activeSlots[idx]) GameState.party.activeSlots[idx].slotIndex = idx;
                                        if (GameState.party.activeSlots[i]) GameState.party.activeSlots[i].slotIndex = i;
                                        this.renderParty();
                                    }
                                }
                            } else {
                                div.classList.add('selected');
                                div.dataset.idx = i;
                            }
                        } else {
                            this.showCreatureModal(u);
                        }
                    };
                } else {
                    div.innerHTML = '<span class="m-auto text-gray-800 text-xs">EMPTY</span>';
                    div.onclick = () => {
                        if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
                            const selected = document.querySelector('.party-slot.selected');
                            if (selected) {
                                const idx = parseInt(selected.dataset.idx);
                                const u1 = GameState.party.activeSlots[idx];
                                GameState.party.activeSlots[idx] = null;
                                GameState.party.activeSlots[i] = u1;
                                if (u1) u1.slotIndex = i;
                                this.renderParty();
                                if (GameState.ui.mode === 'BATTLE') {
                                    GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                                    Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
                                }
                            }
                        }
                    };
                }
                grid.appendChild(div);
            });
            this.updateHUD();
        },
        toggleFormationMode() {
            if (GameState.ui.mode === 'BATTLE') return;
            GameState.ui.formationMode = !GameState.ui.formationMode;
            const ind = document.getElementById('turn-indicator');
            const btn = document.getElementById('btn-formation');
            if (GameState.ui.formationMode) {
                ind.innerText = 'FORMATION MODE';
                ind.classList.remove('hidden');
                btn.classList.add('bg-yellow-900', 'text-white');
            } else {
                ind.classList.add('hidden');
                btn.classList.remove('bg-yellow-900', 'text-white');
                const sel = document.querySelector('.party-slot.selected');
                if (sel) sel.classList.remove('selected');
            }
        },
        // Party modal toggles. Shows roster reserve and active slots.
        toggleParty() {
            const modal = document.getElementById('party-modal');
            const isOpen = !modal.classList.contains('hidden');
            modal.classList.toggle('hidden');
            if (!isOpen) {
                // Render reserve list (all roster not active)
                const reserveEl = document.getElementById('reserve-list');
                const activeEl = document.getElementById('active-list');
                reserveEl.innerHTML = '';
                activeEl.innerHTML = '';
                // Determine active uids
                const activeSet = new Set(GameState.party.activeSlots.filter(Boolean).map(u => u.uid));
                const reserve = GameState.roster.filter(u => !activeSet.has(u.uid));
                // Reserve list
                reserve.forEach(u => {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                    row.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">${u.sprite}</span><div><div class="text-yellow-100">${u.name}</div><div class="text-xs text-gray-500">Lv${u.level}</div></div></div>`;
                    const btn = document.createElement('button');
                    btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                    btn.innerText = 'SET';
                    btn.onclick = () => {
                        const empty = GameState.party.activeSlots.findIndex(s => s === null);
                        if (empty !== -1) {
                            GameState.party.activeSlots[empty] = u;
                            u.slotIndex = empty;
                            Systems.UI.renderParty();
                            this.toggleParty();
                        } else {
                            alert('No empty slot! Try swapping.');
                        }
                    };
                    row.appendChild(btn);
                    reserveEl.appendChild(row);
                });
                // Active list for swapping
                GameState.party.activeSlots.forEach((u, idx) => {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                    if (u) {
                        row.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">${u.sprite}</span><div><div class="text-yellow-100">${u.name}</div><div class="text-xs text-gray-500">Lv${u.level}</div></div></div>`;
                        const btn = document.createElement('button');
                        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                        btn.innerText = 'REMOVE';
                        btn.onclick = () => {
                            GameState.party.activeSlots[idx] = null;
                            Systems.UI.renderParty();
                            this.toggleParty();
                        };
                        row.appendChild(btn);
                    } else {
                        row.innerHTML = '<div class="text-gray-600">(EMPTY)</div>';
                    }
                    activeEl.appendChild(row);
                });
            }
        },
        toggleInventory() {
            const modal = document.getElementById('inventory-modal');
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                const list = document.getElementById('inventory-list');
                list.innerHTML = '';
                // Render equipment
                const eqKeys = Object.keys(GameState.inventory.equipment);
                if (eqKeys.length > 0) {
                    const eqTitle = document.createElement('div');
                    eqTitle.className = 'text-yellow-400 mb-2';
                    eqTitle.innerText = 'Equipment';
                    list.appendChild(eqTitle);
                    eqKeys.forEach(id => {
                        const count = GameState.inventory.equipment[id];
                        const def = Data.equipment[id];
                        const row = document.createElement('div');
                        row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                        row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                        const btn = document.createElement('button');
                        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                        btn.innerText = 'EQUIP';
                        btn.onclick = () => {
                            // select a party member to equip
                            alert('Select a party member by clicking their slot to equip this item.');
                            // handle equipping on click. We'll set a temporary item to equip; UI will use this equip mode.
                            Systems.UI.pendingEquip = id;
                            // close inventory
                            Systems.UI.toggleInventory();
                        };
                        row.appendChild(btn);
                        list.appendChild(row);
                    });
                }
                // Render items
                const itemKeys = Object.keys(GameState.inventory.items);
                if (itemKeys.length > 0) {
                    const itTitle = document.createElement('div');
                    itTitle.className = 'text-yellow-400 mb-2 mt-4';
                    itTitle.innerText = 'Items';
                    list.appendChild(itTitle);
                    itemKeys.forEach(id => {
                        const count = GameState.inventory.items[id];
                        const def = Data.items[id];
                        const row = document.createElement('div');
                        row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700 mb-1';
                        row.innerHTML = `<div><span class="text-yellow-100">${def.name}</span> <span class="text-xs text-gray-400">x${count}</span><div class="text-xs text-gray-500">${def.description}</div></div>`;
                        const btn = document.createElement('button');
                        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                        btn.innerText = 'USE';
                        btn.onclick = () => {
                            alert('Item usage will be implemented in battle soon.');
                        };
                        row.appendChild(btn);
                        list.appendChild(row);
                    });
                }
                if (itemKeys.length === 0 && eqKeys.length === 0) {
                    const none = document.createElement('div');
                    none.className = 'text-gray-500';
                    none.innerText = 'No items.';
                    list.appendChild(none);
                }
            }
        },
        showCreatureModal(unit) {
            document.getElementById('modal-sprite').innerText = unit.sprite;
            document.getElementById('modal-name').innerText = unit.name;
            document.getElementById('modal-lvl').innerText = unit.level;
            const maxhp = Systems.Battle.getMaxHp(unit);
            document.getElementById('modal-hp').innerText = `${unit.hp}/${maxhp}`;
            document.getElementById('modal-xp').innerText = `${unit.exp}`;
            const actList = document.getElementById('modal-actions');
            actList.innerHTML = '';
            const acts = [...unit.acts[0], ...(unit.acts[1] || [])];
            acts.forEach(a => {
                const div = document.createElement('div');
                div.className = 'flex gap-2';
                div.innerHTML = `<span class="bg-gray-800 px-1 border border-gray-600 text-xs">${Data.skills[a.toLowerCase()].name}</span>`;
                actList.appendChild(div);
            });
            document.getElementById('creature-modal').classList.remove('hidden');
        },
        switchScene(toBattle) {
            const swipe = document.getElementById('swipe-overlay');
            swipe.className = 'swipe-down';
            setTimeout(() => {
                const elExp = document.getElementById('explore-layer');
                const elBat = document.getElementById('battle-layer');
                const ctrls = document.getElementById('battle-controls');
                const eCtrls = document.getElementById('explore-controls');
                if (toBattle) {
                    elExp.classList.remove('active-scene'); elExp.classList.add('hidden-scene');
                    elBat.classList.remove('hidden-scene'); elBat.classList.add('active-scene');
                    ctrls.classList.remove('hidden'); eCtrls.classList.add('hidden');
                } else {
                    elBat.classList.add('hidden-scene'); elBat.classList.remove('active-scene');
                    elExp.classList.remove('hidden-scene'); elExp.classList.add('active-scene');
                    ctrls.classList.add('hidden'); eCtrls.classList.remove('hidden');
                    if (GameState.ui.mode === 'BATTLE_WIN') GameState.ui.mode = 'EXPLORE';
                    Systems.Explore.render();
                }
                swipe.className = 'swipe-clear';
                setTimeout(() => { swipe.className = 'swipe-reset'; }, 600);
            }, 600);
        },
        showBanner(text) {
            const banner = document.getElementById('battle-banner');
            document.getElementById('banner-text').innerText = text;
            banner.classList.remove('opacity-0');
            setTimeout(() => banner.classList.add('opacity-0'), 2500);
        },
        togglePlayerTurn(active) {
            const ind = document.getElementById('turn-indicator');
            const btn = document.getElementById('btn-player-turn');
            if (active) {
                ind.innerText = 'PLAYER INPUT PHASE';
                ind.classList.remove('hidden');
                btn.innerText = 'RESUME (SPACE)';
                btn.classList.add('bg-yellow-900', 'text-white');
                btn.onclick = () => Systems.Battle.resumeAuto();
            } else {
                ind.classList.add('hidden');
                btn.classList.remove('bg-yellow-900', 'text-white');
                btn.innerText = 'STOP ROUND (SPACE)';
                btn.onclick = () => Systems.Battle.requestPlayerTurn();
            }
        },
        showModal(html) {
            const m = document.getElementById('center-modal');
            m.innerHTML = html;
            m.classList.remove('hidden');
        },
        closeModal() {
            document.getElementById('center-modal').classList.add('hidden');
        },
        closeEvent() {
            document.getElementById('event-modal').classList.add('hidden');
        }
    }
};


export { Systems };
