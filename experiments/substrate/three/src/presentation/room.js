import * as THREE from "three";

export const WORLD_WIDTH = 320;
export const WORLD_HEIGHT = 180;

/**
 * The control keeps the incumbent's unusual material responsibility visible.
 * This is not THREE.Fog: it injects a view-depth blend into a built-in
 * MeshStandardMaterial and exposes uniforms that the application updates.
 */
export function createControlFogMaterial(color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: options.roughness ?? 0.88,
    metalness: options.metalness ?? 0.04
  });
  const fogColor = new THREE.Color(options.fogColor ?? 0x111522);
  const fogNear = options.fogNear ?? 3.2;
  const fogFar = options.fogFar ?? 12;
  const fogStrength = options.fogStrength ?? 0.82;
  const baseKey = material.customProgramCacheKey?.() ?? "";

  material.customProgramCacheKey = () => `${baseKey}|control-fog-v1`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uControlFogColor = { value: fogColor };
    shader.uniforms.uControlFogNear = { value: fogNear };
    shader.uniforms.uControlFogFar = { value: fogFar };
    shader.uniforms.uControlFogStrength = { value: fogStrength };
    shader.uniforms.uControlFogTime = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>\nvarying float vControlFogDepth;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
      vec4 controlFogViewPosition = modelViewMatrix * vec4(transformed, 1.0);
      vControlFogDepth = -controlFogViewPosition.z;
      #include <project_vertex>
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `
      #include <common>
      varying float vControlFogDepth;
      uniform vec3 uControlFogColor;
      uniform float uControlFogNear;
      uniform float uControlFogFar;
      uniform float uControlFogStrength;
      uniform float uControlFogTime;
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
      float controlFogDistance = smoothstep(uControlFogNear, uControlFogFar, vControlFogDepth);
      float controlFogPulse = 0.025 * sin(uControlFogTime + vControlFogDepth * 0.45);
      float controlFogAmount = clamp(controlFogDistance * uControlFogStrength + controlFogPulse, 0.0, 0.94);
      diffuseColor.rgb = mix(diffuseColor.rgb, uControlFogColor, controlFogAmount);
      #include <dithering_fragment>
      `
    );

    material.userData.controlFogUniforms = shader.uniforms;
  };

  material.userData.controlFog = {
    injection: "MeshStandardMaterial.onBeforeCompile",
    shaderVersion: "control-fog-v1",
    fogNear,
    fogFar,
    fogStrength
  };
  return material;
}

function slotPosition(slot, side) {
  const index = Number(slot.split("_")[1]) - 1;
  const x = (index - 1) * 2.1;
  const z = side === "party" ? (slot.startsWith("front") ? 1.4 : 2.55) : (slot.startsWith("front") ? -1.3 : -2.25);
  return new THREE.Vector3(x, 0.52, z);
}

export class RoomRenderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(47, WORLD_WIDTH / WORLD_HEIGHT, 0.1, 40);
    this.camera.position.set(0, 6.1, 10.5);
    this.camera.lookAt(0, 0.25, 0);
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power"
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(WORLD_WIDTH, WORLD_HEIGHT, false);
    this.renderer.setClearColor(0x090c13, 1);
    this.renderer.domElement.dataset.renderer = "WebGLRenderer";
    this.renderer.domElement.dataset.logicalResolution = `${WORLD_WIDTH}x${WORLD_HEIGHT}`;
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.imageRendering = "pixelated";
    this.container.replaceChildren(this.renderer.domElement);

    this.fogMaterials = [];
    this.actors = new Map();
    this.clock = new THREE.Clock();
    this.renderCount = 0;
    this.buildRoom();
    const tick = () => {
      this.renderFrame();
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  buildRoom() {
    const ambient = new THREE.HemisphereLight(0x9aabc8, 0x16131f, 1.2);
    this.scene.add(ambient);

    const moon = new THREE.DirectionalLight(0xb3c8ff, 2.2);
    moon.position.set(-3, 7, 5);
    this.scene.add(moon);

    const floorMaterial = this.trackMaterial(createControlFogMaterial(0x343c45, {
      fogColor: 0x0f1420,
      fogNear: 3,
      fogFar: 11,
      fogStrength: 0.72
    }));
    const wallMaterial = this.trackMaterial(createControlFogMaterial(0x50535b, {
      fogColor: 0x111522,
      fogNear: 2,
      fogFar: 9,
      fogStrength: 0.9
    }));
    const trimMaterial = this.trackMaterial(createControlFogMaterial(0x8a6f52, {
      fogColor: 0x1d1820,
      fogNear: 2,
      fogFar: 10,
      fogStrength: 0.8
    }));

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 8.2), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const wallGeometry = new THREE.BoxGeometry(10.5, 2.3, 0.35);
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 1.05, -3.9);
    this.scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.3, 8.2), wallMaterial);
    leftWall.position.set(-5.1, 1.05, 0);
    this.scene.add(leftWall);
    const rightWall = leftWall.clone();
    rightWall.position.x = 5.1;
    this.scene.add(rightWall);

    for (const x of [-4.15, 4.15]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.1, 0.72), trimMaterial);
      pillar.position.set(x, 1.45, -3.45);
      this.scene.add(pillar);
    }

    for (const z of [-2.8, -1.1, 0.6, 2.3]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.88), trimMaterial);
      seam.position.set(0, 0.012, z);
      this.scene.add(seam);
    }

    const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.38, 6), trimMaterial);
    altar.position.set(0, 0.19, -2.8);
    this.scene.add(altar);

    const enemyLight = new THREE.PointLight(0x9d5360, 14, 7, 2);
    enemyLight.position.set(0, 1.8, -2.5);
    this.scene.add(enemyLight);
    const partyLight = new THREE.PointLight(0x5d9ea2, 8, 6, 2);
    partyLight.position.set(0, 1.4, 1.7);
    this.scene.add(partyLight);
  }

  trackMaterial(material) {
    this.fogMaterials.push(material);
    return material;
  }

  materialFor(unit, isEnemy) {
    const color = isEnemy ? (unit.id === "iron_maw" ? 0x8d5456 : 0xb07855) : ({
      nurse: 0xb6d8d4,
      pixie: 0xb99ad5,
      skeleton: 0xc3c4c2,
      golem: 0x8e969f,
      lich: 0x7777b5,
      no7: 0xd5bd75
    }[unit.id] ?? 0xa4acb3);
    return this.trackMaterial(createControlFogMaterial(color, {
      fogColor: isEnemy ? 0x24161f : 0x111c26,
      fogNear: 3.8,
      fogFar: 12,
      fogStrength: 0.74,
      roughness: 0.75
    }));
  }

  shapeFor(unit, isEnemy) {
    if (isEnemy) return unit.id === "iron_maw"
      ? new THREE.BoxGeometry(1.12, 1.15, 1.12)
      : new THREE.ConeGeometry(0.72, 1.35, 6);
    return unit.id === "golem"
      ? new THREE.BoxGeometry(1.12, 1.25, 1.12)
      : new THREE.IcosahedronGeometry(0.68, 0);
  }

  updateBattle(state) {
    const desired = [...state.party.map((unit) => ({ unit, side: "party" })), ...state.enemies.map((unit) => ({ unit, side: "enemy" }))];
    const wantedIds = new Set(desired.map(({ unit }) => unit.id));

    for (const [id, mesh] of this.actors) {
      if (!wantedIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.actors.delete(id);
      }
    }

    for (const { unit, side } of desired) {
      const isEnemy = side === "enemy";
      let mesh = this.actors.get(unit.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.shapeFor(unit, isEnemy), this.materialFor(unit, isEnemy));
        mesh.userData.unitId = unit.id;
        this.actors.set(unit.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.copy(slotPosition(unit.slot, side));
      mesh.scale.y = unit.hp > 0 ? 1 : 0.35;
      mesh.material.color.multiplyScalar(unit.hp > 0 ? 1 : 0.45);
    }

    // Render once synchronously when a semantic snapshot is presented. The
    // loop continues to animate fog, but first paint must not depend on a
    // browser frame callback arriving before a screenshot or inspection.
    this.renderFrame();
  }

  renderFrame() {
    this.renderCount += 1;
    const elapsed = this.clock.getElapsedTime();
    for (const material of this.fogMaterials) {
      const uniforms = material.userData.controlFogUniforms;
      if (uniforms?.uControlFogTime) uniforms.uControlFogTime.value = elapsed;
    }
    this.renderer.render(this.scene, this.camera);
    // Force the first-paint/evidence path to flush the WebGL command stream.
    // This is a deliberate control cost: screenshots should inspect the
    // rendered room, not a browser compositor race.
    this.renderer.getContext().finish();
  }
}
