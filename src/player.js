import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';


export class Player {
  constructor(world, input) {
    this.world = world;
    this.input = input;
    this.position = new THREE.Vector3(0, world.getHeight(0, 0) + 2.6, 0);
    this.velocity = new THREE.Vector3();
    this.speed = 16;
    this.yaw = 0;
    this.pitch = -0.28;
    this.targetCameraOffset = new THREE.Vector3(0, 5, 10);

    const bodyGeo = new THREE.CapsuleGeometry(0.7, 1.4, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f6e8c3', flatShading: true });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(this.position);
  }

  update(delta, camera) {
    this.handleRotation(delta);
    this.updateCamera(camera, delta);
    this.handleMovement(delta, camera);
    this.applyGroundSnap();
    this.mesh.position.copy(this.position);
  }

  handleRotation(delta) {
    const look = this.input.getLookDelta();
    this.yaw -= look.x * 0.003;
    this.pitch -= look.y * 0.003;
    this.pitch = Math.min(Math.max(this.pitch, -1.1), 0.2);
  }

  handleMovement(delta, camera) {
    const dir = this.input.getMoveVector();
    if (dir.lengthSq() > 0) {
      dir.normalize();

      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveDir = new THREE.Vector3();
      moveDir.addScaledVector(cameraForward, -dir.z);
      moveDir.addScaledVector(cameraRight, dir.x);
      moveDir.normalize();

      this.velocity.copy(moveDir).multiplyScalar(this.speed * delta);
      this.position.add(this.velocity);
    } else {
      this.velocity.setScalar(0);
    }

    this.alignToCamera(camera);
  }

  alignToCamera(camera) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() === 0) return;
    forward.normalize();
    this.mesh.rotation.y = Math.atan2(forward.x, forward.z);
  }

  applyGroundSnap() {
    const groundY = this.world.getHeight(this.position.x, this.position.z);
    const targetY = groundY + 2.4;
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, 0.2);
  }

  updateCamera(camera, delta) {
    const offset = this.targetCameraOffset.clone();
    const rot = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    offset.applyEuler(rot);
    const desiredPos = this.position.clone().add(offset);
    camera.position.lerp(desiredPos, 1 - Math.pow(0.001, delta));
    camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
  }
}
