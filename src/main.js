import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { ResourceManager } from './resources.js';
import { UIOverlay } from './ui.js';

const VERSION = 'v0.2.3';

const canvasContainer = document.body;

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  canvasContainer.appendChild(renderer.domElement);
  return renderer;
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a8d7ff');
  scene.fog = new THREE.FogExp2('#a8d7ff', 0.012);
  return scene;
}

function createLights(scene) {
  const ambient = new THREE.HemisphereLight('#e4efff', '#4d5666', 0.9);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight('#ffffff', 1.1);
  sun.position.set(40, 60, 25);
  sun.castShadow = true;
  const d = 60;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  scene.add(sun);
}

function randomSeed() {
  const bytes = crypto.getRandomValues(new Uint32Array(2));
  return `${bytes[0].toString(16)}-${bytes[1].toString(16)}`;
}

class Game {
  constructor() {
    this.seed = randomSeed();
    this.scene = createScene();
    this.renderer = createRenderer();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.world = new World(this.seed);
    this.input = new Input(this.renderer.domElement);
    this.player = new Player(this.world, this.input);
    this.resources = new ResourceManager(this.world, this.scene);
    this.ui = new UIOverlay({
      version: VERSION,
      seed: this.seed,
      onRestart: () => this.restart(),
    });

    this.scene.add(this.world.mesh);
    this.scene.add(this.world.campGroup);
    this.scene.add(this.player.mesh);
    this.world.placeResources(this.resources);
    this.resources.addToScene(this.scene);

    createLights(this.scene);
    this.lastTime = performance.now();
    window.addEventListener('resize', () => this.onResize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  restart() {
    window.location.reload();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(delta) {
    this.player.update(delta, this.camera);
    const collected = this.resources.tryCollect(this.player, this.input.consumeInteract());
    if (collected) {
      this.ui.updateCounts(this.resources.counters);
      this.resources.updateCompass(this.player.position, this.ui);
      if (this.resources.hasWon()) {
        this.ui.showWin();
      }
    } else {
      this.resources.updateCompass(this.player.position, this.ui);
    }
    this.world.updateCampFire(delta);
  }

  animate() {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
