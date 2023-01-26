import * as THREE from 'three';

export class EnvironmentMapGenerator {
  private renderTarget: THREE.WebGLCubeRenderTarget;
  private camera: THREE.CubeCamera;
  private material: THREE.Material;

  constructor(resolution: number, private scene: THREE.Scene, private renderer: THREE.WebGLRenderer) {
    this.renderTarget = new THREE.WebGLCubeRenderTarget(resolution);
    this.renderTarget.texture.type = THREE.HalfFloatType;

    this.camera = new THREE.CubeCamera(1, 1000, this.renderTarget);

    this.material = new THREE.MeshBasicMaterial({
      envMap: this.renderTarget.texture
    });
  }

  public update(position: THREE.Vector3) {
    this.camera.position.copy(position);
    this.camera.update(this.renderer, this.scene);
  }

  public getMaterial(): THREE.Material {
    return this.material;
  }
  public getTexture(): THREE.Texture {
    return this.renderTarget.texture;
  }
}