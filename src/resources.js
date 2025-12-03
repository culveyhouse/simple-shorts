import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

const RESOURCE_COLORS = {
  wood: '#6f4c32',
  stone: '#9da4b5',
  corn: '#f8e36b',
};

const TARGET = 10;

export class ResourceManager {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.nodes = [];
    this.counters = { wood: 0, stone: 0, corn: 0 };
    this.compassTarget = null;
  }

  spawnResource(type, position) {
    const mesh = this.buildMesh(type);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = type;
    this.nodes.push(mesh);
  }

  buildMesh(type) {
    if (type === 'wood') {
      const geo = new THREE.CylinderGeometry(0.5, 0.6, 2.2, 6);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RESOURCE_COLORS[type], flatShading: true }));
    }
    if (type === 'stone') {
      const geo = new THREE.DodecahedronGeometry(0.9, 0);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RESOURCE_COLORS[type], flatShading: true }));
    }
    const geo = new THREE.ConeGeometry(0.6, 1.6, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RESOURCE_COLORS[type], flatShading: true }));
    mesh.rotation.x = Math.PI;
    return mesh;
  }

  addToScene(scene) {
    this.nodes.forEach((mesh) => scene.add(mesh));
  }

  tryCollect(player, interacted) {
    const proximityNode = this.findClosestWithin(player.position, 1.4);
    if (proximityNode) {
      this.collectNode(proximityNode);
      return true;
    }

    if (!interacted && !this.autoCollectTouch(player)) return false;
    const node = this.findClosestWithin(player.position, 3.2);
    if (!node) return false;
    this.collectNode(node);
    return true;
  }

  autoCollectTouch(player) {
    // Allow tap-to-collect on mobile when close enough
    const node = this.findClosestWithin(player.position, 2.6);
    if (node && this.world && window.matchMedia('(max-width: 900px)').matches) {
      return true;
    }
    return false;
  }

  collectNode(node) {
    const type = node.userData.type;
    this.counters[type] += 1;
    node.visible = false;
    this.nodes = this.nodes.filter((n) => n !== node);
    this.scene.remove(node);
  }

  findClosestWithin(origin, maxDistance) {
    let closest = null;
    let bestDist = maxDistance;
    this.nodes.forEach((node) => {
      const dist = origin.distanceTo(node.position);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = node;
      }
    });
    return closest;
  }

  updateCompass(playerPos, ui) {
    if (this.hasWon()) {
      ui.setCompass('All done!');
      return;
    }
    let target = this.compassTarget;
    if (!target || !this.nodes.includes(target)) {
      target = this.findNearestNeeded(playerPos);
      this.compassTarget = target;
    }
    if (!target) {
      ui.setCompass('Explore to find resources');
      return;
    }
    const dir = target.position.clone().sub(playerPos);
    const distance = dir.length();
    dir.normalize();
    const angle = Math.atan2(dir.x, dir.z);
    const degrees = THREE.MathUtils.radToDeg(angle);
    ui.setCompass(`Nearest cache: ${distance.toFixed(1)}m at ${degrees.toFixed(0)}°`);
  }

  findNearestNeeded(playerPos) {
    const missingTypes = ['wood', 'stone', 'corn'].filter((t) => this.counters[t] < TARGET);
    let closest = null;
    let best = Infinity;
    this.nodes.forEach((node) => {
      if (!missingTypes.includes(node.userData.type)) return;
      const d = playerPos.distanceTo(node.position);
      if (d < best) {
        best = d;
        closest = node;
      }
    });
    return closest;
  }

  hasWon() {
    return this.counters.wood >= TARGET && this.counters.stone >= TARGET && this.counters.corn >= TARGET;
  }
}
