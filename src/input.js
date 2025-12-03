import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.lookDelta = new THREE.Vector2();
    this.moveVector = new THREE.Vector3();
    this.interactQueued = false;
    this.dragging = false;
    this.lastPointer = null;

    this.joystick = document.getElementById('joystick');
    this.knob = this.joystick.querySelector('.knob');
    this.interactButton = document.getElementById('interact-btn');
    this.isMobile = window.matchMedia('(max-width: 900px)').matches;
    this.lookTouch = false;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (key === 'e') this.queueInteract();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('mousedown', (e) => this.startDrag(e));
    window.addEventListener('mousemove', (e) => this.onDrag(e));
    window.addEventListener('mouseup', () => this.stopDrag());
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.handleTouchEnd());

    this.interactButton.addEventListener('click', () => this.queueInteract());
  }

  startDrag(event) {
    if (event.target === this.interactButton) return;
    this.dragging = true;
    this.lastPointer = new THREE.Vector2(event.clientX, event.clientY);
  }

  onDrag(event) {
    if (!this.dragging) return;
    const current = new THREE.Vector2(event.clientX, event.clientY);
    const delta = current.clone().sub(this.lastPointer);
    this.lookDelta.add(delta);
    this.lastPointer = current;
  }

  stopDrag() {
    this.dragging = false;
    this.lastPointer = null;
  }

  handleTouchStart(event) {
    if (!this.isMobile) return;
    const touch = event.touches[0];
    if (!touch) return;
    if (event.target === this.interactButton) return;

    const leftZone = window.innerWidth * 0.7;
    const rect = this.joystick.getBoundingClientRect();
    if (touch.clientX < leftZone) {
      this.touchOrigin = new THREE.Vector2(touch.clientX, touch.clientY);
      this.joystick.style.display = 'block';
      this.joystick.style.left = `${this.touchOrigin.x - rect.width / 2}px`;
      this.joystick.style.top = `${this.touchOrigin.y - rect.height / 2}px`;
    } else {
      this.dragging = true;
      this.lookTouch = true;
      this.lastPointer = new THREE.Vector2(touch.clientX, touch.clientY);
    }
  }

  handleTouchMove(event) {
    if (!this.isMobile) return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    const current = new THREE.Vector2(touch.clientX, touch.clientY);

    if (this.touchOrigin) {
      const delta = current.clone().sub(this.touchOrigin);
      const maxDist = 80;
      const clamped = delta.clone().clampLength(0, maxDist);
      this.knob.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
      this.moveVector.set(clamped.x / maxDist, 0, -clamped.y / maxDist);
    } else if (this.lookTouch && this.dragging) {
      const delta = current.clone().sub(this.lastPointer);
      this.lookDelta.add(delta);
      this.lastPointer = current;
    }
  }

  handleTouchEnd() {
    if (!this.isMobile) return;
    this.moveVector.set(0, 0, 0);
    this.touchOrigin = null;
    this.knob.style.transform = 'translate(0px, 0px)';
    this.joystick.style.display = 'block';
    this.lookTouch = false;
    this.stopDrag();
  }

  queueInteract() {
    this.interactQueued = true;
  }

  consumeInteract() {
    if (this.interactQueued) {
      this.interactQueued = false;
      return true;
    }
    return false;
  }

  getMoveVector() {
    const dir = new THREE.Vector3();
    if (this.keys.has('w') || this.keys.has('arrowup')) dir.z -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dir.z += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dir.x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dir.x += 1;

    if (dir.lengthSq() === 0 && this.moveVector.lengthSq() > 0) {
      dir.copy(this.moveVector);
    }

    return dir;
  }

  getLookDelta() {
    const delta = this.lookDelta.clone();
    this.lookDelta.set(0, 0);
    return delta;
  }
}
