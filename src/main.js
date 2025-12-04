import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { ResourceManager } from './resources.js';
import { UIOverlay } from './ui.js';

const GAME_TUNING = {
  version: 'v0.3.5',
  map: {
    baseSize: 140,
    slider: { min: 1, max: 10, step: 1, default: 1 },
  },
  collection: {
    proximityCollectRange: 1.4,
    interactCollectRange: 9.6,
    touchAutoCollectRange: 7.8,
    interactButtonRange: 3.2,
  },
  turnAssist: {
    arcRadians: Math.PI / 5,
    strengthScale: 5,
    strengthMax: 0.18,
  },
};

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
  constructor({ mapSize }) {
    this.seed = randomSeed();
    this.scene = createScene();
    this.renderer = createRenderer();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.world = new World(this.seed, { mapSize });
    this.tuning = GAME_TUNING;
    this.input = new Input(this.renderer.domElement, this.tuning.collection);
    this.player = new Player(this.world, this.input, this.tuning.turnAssist);
    this.resources = new ResourceManager(this.world, this.scene, this.tuning.collection);
    this.ui = new UIOverlay({
      version: this.tuning.version,
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
    this.gameOver = false;
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
    const nearestDistance = this.resources.getNearestDistance(this.player.position);
    this.input.updateInteractButtonState(nearestDistance);

    const collected = this.resources.tryCollect(this.player, this.input.consumeInteract());
    if (collected) {
      this.ui.updateCounts(this.resources.counters);
      if (this.resources.hasWon() && !this.gameOver) {
        this.gameOver = true;
        this.ui.showWin();
        this.input.disableMobileControls();
      }
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

function setupStartOverlay() {
  const startOverlay = document.getElementById('start-overlay');
  const startButton = document.getElementById('start-btn');
  const slider = document.getElementById('map-size');
  const label = document.getElementById('map-size-value');

  if (!startOverlay || !startButton || !slider || !label) return;

  const updateLabel = () => {
    const multiplier = Number(slider.value);
    const size = Math.round(GAME_TUNING.map.baseSize * multiplier);
    label.textContent = `${size}m (${multiplier}x)`;
  };

  slider.min = `${GAME_TUNING.map.slider.min}`;
  slider.max = `${GAME_TUNING.map.slider.max}`;
  slider.step = `${GAME_TUNING.map.slider.step}`;
  slider.value = `${GAME_TUNING.map.slider.default}`;
  updateLabel();

  slider.addEventListener('input', updateLabel);
  startButton.addEventListener('click', () => {
    startOverlay.style.display = 'none';
    new Game({ mapSize: GAME_TUNING.map.baseSize * Number(slider.value) });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupStartOverlay();
});
