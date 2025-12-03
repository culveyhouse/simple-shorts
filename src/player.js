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
    this.handleMovement(delta);
    this.mesh.rotation.y = this.yaw + Math.PI;
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
      const rotDir = new THREE.Vector3();
      rotDir.x = dir.x * Math.cos(this.yaw) - dir.z * Math.sin(this.yaw);
      rotDir.z = dir.x * Math.sin(this.yaw) + dir.z * Math.cos(this.yaw);
      rotDir.y = 0;
      this.velocity.copy(rotDir).multiplyScalar(this.speed * delta);
      this.position.add(this.velocity);
    } else {
      this.velocity.setScalar(0);
    }
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
