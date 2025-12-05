import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';


export class Player {
  constructor(world, input, turnAssistConfig = {}) {
    this.world = world;
    this.input = input;
    this.turnAssistConfig = turnAssistConfig;
    this.position = new THREE.Vector3(0, world.getHeight(0, 0) + 2.6, 0);
    this.velocity = new THREE.Vector3();
    this.speed = 16;
    this.yaw = 0;
    this.pitch = -0.28;
    this.targetCameraOffset = new THREE.Vector3(0, 5, 10);
    this.atBoundary = false;
    this.boundaryMargin = 5; // Distance from edge to start showing warning

    const bodyGeo = new THREE.CapsuleGeometry(0.7, 1.4, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f6e8c3', flatShading: true });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(this.position);
  }

  update(delta, camera) {
    this.handleRotation(delta);
    this.handleMovement(delta);
    this.updateCamera(camera, delta);
    this.applyGroundSnap();
    this.mesh.position.copy(this.position);
  }

  handleRotation(delta) {
    const look = this.input.getLookDelta();
    this.yaw -= look.x * 0.003;
    this.pitch -= look.y * 0.003;
    this.pitch = Math.min(Math.max(this.pitch, -1.1), 0.2);
  }

  handleMovement(delta) {
    const dir = this.input.getMoveVector();
    if (dir.lengthSq() > 0) {
      dir.normalize();

      const yawOnlyRot = new THREE.Euler(0, this.yaw, 0, 'YXZ');
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(yawOnlyRot).setY(0).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveDir = new THREE.Vector3();
      moveDir.addScaledVector(forward, -dir.z);
      moveDir.addScaledVector(right, dir.x);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        this.velocity.copy(moveDir).multiplyScalar(this.speed * delta);
        this.position.add(this.velocity);
        this.clampToBoundary();
        this.gentlyTurnToward(moveDir, delta);
      }
    } else {
      this.velocity.setScalar(0);
    }

    this.checkBoundaryProximity();
    this.alignToCamera();
  }

  clampToBoundary() {
    const halfSize = this.world.worldSize / 2;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -halfSize, halfSize);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -halfSize, halfSize);
  }

  checkBoundaryProximity() {
    const halfSize = this.world.worldSize / 2;
    const margin = this.boundaryMargin;
    const atEdge =
      Math.abs(this.position.x) >= halfSize - margin ||
      Math.abs(this.position.z) >= halfSize - margin;
    this.atBoundary = atEdge;
  }

  gentlyTurnToward(direction, delta) {
    const desiredYaw = Math.atan2(-direction.x, -direction.z);
    const diff = this.normalizeAngle(desiredYaw - this.yaw);
    const maxAssist = this.turnAssistConfig.arcRadians ?? Math.PI / 5;
    if (Math.abs(diff) > maxAssist) return;
    const assistScale = this.turnAssistConfig.strengthScale ?? 5;
    const assistCap = this.turnAssistConfig.strengthMax ?? 0.18;
    const assist = Math.min(assistScale * delta, assistCap);
    this.yaw = this.normalizeAngle(this.yaw + diff * assist);
  }

  normalizeAngle(angle) {
    return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
  }

  alignToCamera() {
    this.mesh.rotation.y = this.yaw;
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
