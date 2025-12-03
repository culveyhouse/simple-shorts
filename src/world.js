import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class World {
  constructor(seed, { mapSize } = {}) {
    this.seed = seed;
    this.worldSize = mapSize ?? 140;
    this.gridResolution = 96;
    this.heightMap = [];
    this.heightScale = 6;
    this.noiseScale = 14;
    this.rng = mulberry32(hashString(seed));
    this.mesh = this.buildTerrain();
    this.campGroup = this.buildCamp();
  }

  noise(x, z) {
    const scaledX = x / this.noiseScale;
    const scaledZ = z / this.noiseScale;
    const xi = Math.floor(scaledX);
    const zi = Math.floor(scaledZ);
    const xf = scaledX - xi;
    const zf = scaledZ - zi;

    const v00 = this.valueAt(xi, zi);
    const v10 = this.valueAt(xi + 1, zi);
    const v01 = this.valueAt(xi, zi + 1);
    const v11 = this.valueAt(xi + 1, zi + 1);

    const x1 = lerp(v00, v10, xf);
    const x2 = lerp(v01, v11, xf);
    return lerp(x1, x2, zf);
  }

  valueAt(x, z) {
    const h = hashString(`${x},${z},${this.seed}`);
    const rand = mulberry32(h);
    return rand();
  }

  getHeight(x, z) {
    const base = this.noise(x + 50, z + 50) * this.heightScale;
    const detail = this.noise(x * 2.5 + 100, z * 2.5 + 100) * 1.5;
    return base + detail;
  }

  buildTerrain() {
    const size = this.worldSize;
    const segments = this.gridResolution;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = this.getHeight(x, z);
      positions.setY(i, y);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ color: '#6dbb65', flatShading: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    return mesh;
  }

  buildCamp() {
    const group = new THREE.Group();

    const padGeometry = new THREE.CylinderGeometry(3, 3, 0.6, 6);
    const padMaterial = new THREE.MeshLambertMaterial({ color: '#cfc2a2', flatShading: true });
    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(0, this.getHeight(0, 0) + 0.3, 0);
    pad.receiveShadow = true;
    group.add(pad);

    const tent = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 4),
      new THREE.MeshLambertMaterial({ color: '#f2f5f7', flatShading: true })
    );
    tent.position.set(-1.2, pad.position.y + 1.5, 0.4);
    tent.castShadow = true;
    group.add(tent);

    const fireBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 0.4, 5),
      new THREE.MeshLambertMaterial({ color: '#6b4b3e', flatShading: true })
    );
    fireBase.position.set(1.6, pad.position.y + 0.2, -1);
    fireBase.castShadow = true;
    fireBase.receiveShadow = true;
    group.add(fireBase);

    const flameGeo = new THREE.SphereGeometry(0.6, 6, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: '#ffb347' });
    this.flame = new THREE.Mesh(flameGeo, flameMat);
    this.flame.position.set(1.6, pad.position.y + 0.9, -1);
    group.add(this.flame);

    group.name = 'camp';
    return group;
  }

  updateCampFire(delta) {
    if (!this.flame) return;
    this.flame.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.08);
    this.flame.position.y += Math.sin(performance.now() * 0.005) * delta * 0.4;
  }

  samplePositionAwayFromCamp(minDistance = 10, maxRadius = this.worldSize * 0.45) {
    let attempts = 0;
    while (attempts < 50) {
      const angle = this.rng() * Math.PI * 2;
      const radius = minDistance + this.rng() * (maxRadius - minDistance);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.getHeight(x, z);
      if (Number.isFinite(y)) {
        return new THREE.Vector3(x, y, z);
      }
      attempts += 1;
    }
    return new THREE.Vector3(0, this.getHeight(0, 0), 0);
  }

  placeResources(resourceManager) {
    const resourceTypes = ['wood', 'stone', 'corn'];
    const totalPerType = 15;
    resourceTypes.forEach((type) => {
      for (let i = 0; i < totalPerType; i += 1) {
        const pos = this.samplePositionAwayFromCamp(12);
        resourceManager.spawnResource(type, pos);
      }
    });
  }
}
