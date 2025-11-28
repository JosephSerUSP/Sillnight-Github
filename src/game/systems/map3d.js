import { GameState } from '../state.js';
import { Data } from '../../assets/data/data.js';
import { resolveAssetPath } from '../core.js';
import { Systems } from '../systems.js';

export const Map3D = {
    scene: null,
    camera: null,
    renderer: null,
    group: null, // Container for map objects
    playerSprite: null,
    sprites: {}, // Map entities
    textureLoader: null,
    textureCache: {},
    isInitialized: false,

    // Configuration
    tileSize: 2,
    wallHeight: 2,

    /**
     * Initializes the 3D map system.
     * @param {THREE.WebGLRenderer} [existingRenderer] - Optional existing renderer to reuse.
     */
    init(existingRenderer) {
        if (this.isInitialized) return;

        const container = document.getElementById('three-container'); // We reuse the container

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505); // Dark background like the 2D map

        // Camera Setup
        // Use a perspective camera looking down at an angle
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, -10, 10);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);

        // Renderer Setup
        if (existingRenderer) {
            this.renderer = existingRenderer;
        } else {
            // Check if Systems.Battle3D has one we can steal?
            // Better to let the caller handle this, but for now fallback to creating one if needed
            // Ideally we shouldn't have two renderers.
            this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if (container) {
                container.innerHTML = ''; // Clear any existing renderer if we are creating a new one (brute force)
                container.appendChild(this.renderer.domElement);
            }
        }

        // Lighting
        const amb = new THREE.AmbientLight(0xffffff, 0.3);
        const dir = new THREE.DirectionalLight(0xffffff, 0.7);
        dir.position.set(5, -5, 10);
        this.scene.add(amb);
        this.scene.add(dir);

        // Group for level geometry
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.textureLoader = new THREE.TextureLoader();

        this.isInitialized = true;
    },

    /**
     * Builds the 3D representation of the current floor.
     */
    buildLevel() {
        if (!this.scene) return;

        // Clear previous level
        this.group.clear();
        this.sprites = {};
        this.playerSprite = null;

        const map = GameState.exploration.map;
        const width = GameState.exploration.map[0].length;
        const height = GameState.exploration.map.length;

        // Geometries and Materials
        const wallGeo = new THREE.BoxGeometry(this.tileSize, this.tileSize, this.wallHeight);
        const floorGeo = new THREE.PlaneGeometry(this.tileSize, this.tileSize);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        // Iterate map data
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const code = map[y][x];
                const posX = x * this.tileSize;
                const posY = -y * this.tileSize; // Flip Y for 3D coords

                // Floor (always present unless it's a void, but currently map is solid)
                const floor = new THREE.Mesh(floorGeo, floorMat);
                floor.position.set(posX, posY, 0);
                this.group.add(floor);

                if (code === 1) {
                    // Wall
                    const wall = new THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(posX, posY, this.wallHeight / 2);
                    this.group.add(wall);
                } else if (code > 1) {
                    // Entity (2=Enemy, 3=Stairs, 4=Treasure, etc.)
                    this.createEntitySprite(x, y, code);
                }
            }
        }

        // Create Player Sprite
        this.createPlayerSprite();

        // Initial Camera Update
        this.updateCamera();
    },

    /**
     * Creates a sprite for an entity on the map.
     */
    createEntitySprite(x, y, code) {
        let char = '?';
        let color = '#ffffff';

        // Mapping from 2D render logic
        if (code === 2) { char = '👹'; color = '#ff0000'; } // Enemy
        else if (code === 3) { char = '🪜'; color = '#aaaaaa'; } // Stairs
        else if (code === 4) { char = '💰'; color = '#ffd700'; } // Treasure
        else if (code === 5) { char = '🛒'; color = '#00ff00'; } // Shop
        else if (code === 6) { char = '🤝'; color = '#00ffff'; } // Recruit
        else if (code === 7) { char = '⛪'; color = '#ffffff'; } // Shrine
        else if (code === 8) { char = '☠️'; color = '#555555'; } // Trap

        const texture = this.createEmojiTexture(char, color);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);

        // Position
        const posX = x * this.tileSize;
        const posY = -y * this.tileSize;
        sprite.position.set(posX, posY, this.tileSize / 2);
        sprite.scale.set(this.tileSize * 0.8, this.tileSize * 0.8, 1);

        this.group.add(sprite);

        // Store reference if needed for updates (key by "x,y"?)
        this.sprites[`${x},${y}`] = sprite;
    },

    /**
     * Creates the player sprite.
     */
    createPlayerSprite() {
        const texture = this.createEmojiTexture('🧙‍♂️', '#d4af37');
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.playerSprite = new THREE.Sprite(mat);

        const p = GameState.exploration.playerPos;
        this.playerSprite.position.set(p.x * this.tileSize, -p.y * this.tileSize, this.tileSize / 2);
        this.playerSprite.scale.set(this.tileSize * 0.8, this.tileSize * 0.8, 1);

        this.group.add(this.playerSprite);
    },

    /**
     * Helper to create a texture from an emoji.
     */
    createEmojiTexture(char, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '90px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        // Shadow for better visibility
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(char, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    },

    /**
     * Updates the system (called every frame when active).
     */
    update() {
        if (!this.isInitialized) return;

        // Update player position visually (lerp for smoothness if desired, but instant for now)
        const p = GameState.exploration.playerPos;
        const targetX = p.x * this.tileSize;
        const targetY = -p.y * this.tileSize;

        if (this.playerSprite) {
            // Simple lerp or direct set
            this.playerSprite.position.x += (targetX - this.playerSprite.position.x) * 0.2;
            this.playerSprite.position.y += (targetY - this.playerSprite.position.y) * 0.2;
        }

        this.updateCamera();

        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * Updates the camera position to follow the player.
     */
    updateCamera() {
        if (!this.playerSprite) return;

        const targetX = this.playerSprite.position.x;
        const targetY = this.playerSprite.position.y - 8; // Offset Y to see "up"
        const targetZ = 12;

        this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;

        this.camera.lookAt(this.playerSprite.position.x, this.playerSprite.position.y, 0);
    },

    /**
     * Handle resize.
     */
    resize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};
