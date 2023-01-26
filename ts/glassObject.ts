import * as THREE from "three";
import { EnvironmentMapGenerator } from "./environmentMapGenerator";

export class GlassObject extends THREE.Object3D {
  private env: EnvironmentMapGenerator;
  constructor(modelName: string, scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    super();
    this.env = new EnvironmentMapGenerator(1024, scene, renderer);

    const texture = this.env.getTexture();
    texture.mapping = THREE.CubeRefractionMapping;

    const glassMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: texture,
      refractionRatio: 0.98
    });

  }

  update() {
    const p = new THREE.Vector3();
    this.getWorldPosition(p);
    this.env.update(p);
  }
}