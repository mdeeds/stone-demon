import * as THREE from 'three';

export class AmbientOcclusionMesh extends THREE.Mesh {
  private renderTarget: THREE.WebGLRenderTarget;
  private camera: THREE.PerspectiveCamera;
  private context: CanvasRenderingContext2D;
  private buffer: Uint8Array;

  constructor(
    geometry: THREE.BufferGeometry,
    resolution: number,
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
    baseColor: THREE.Color, emissive: THREE.Color) {

    super(geometry,
      new THREE.ShaderMaterial({
        uniforms: {
          emissive: { value: new THREE.Color().copy(emissive) },
        },
        vertexShader: `
        varying vec3 vColor;
        uniform vec3 emissive;
        attribute vec3 light;
        attribute vec3 color;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vColor = light * color + emissive;
        }
            `,
        fragmentShader: `
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
            `,
        side: THREE.DoubleSide,
      }));

    this.buffer = new Uint8Array(4 * resolution * resolution);

    // const positions = geometry.getAttribute('position');
    // let maxIndex = 0;
    // for (let i = 0; i < geometry.index.count; ++i) {
    //   maxIndex = Math.max(geometry.index.getX(i), maxIndex);
    // }
    const size = geometry.getAttribute('position').count;

    const colors = new THREE.BufferAttribute(
      new Float32Array(size * 3), 3);
    const light = new THREE.BufferAttribute(
      new Float32Array(size * 3), 3);

    for (let i = 0; i < colors.count; ++i) {
      colors.setXYZ(i, baseColor.r, baseColor.g, baseColor.b);
      light.setXYZ(i, 0, 0, 0);
    }
    geometry.setAttribute('color', colors);
    geometry.setAttribute('light', light);
    colors.needsUpdate = true;
    light.needsUpdate = true;

    // Initialize the render target
    this.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);

    // Initialize the camera
    this.camera = new THREE.PerspectiveCamera(120, 1, 0.001, 1000);
    this.camera.position.set(0, 0, 0);
    // Create a canvas and a 2D context
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;
    this.context = canvas.getContext("2d");
  }

  private getMeanColor(
    colors: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    i: number) {

    this.renderer.readRenderTargetPixels(
      this.renderTarget, 0, 0, this.renderTarget.width, this.renderTarget.height,
      this.buffer);

    // Calculate the average color
    let red = 0, green = 0, blue = 0;
    for (let i = 0; i < this.buffer.length; i += 4) {
      red += this.buffer[i];
      green += this.buffer[i + 1];
      blue += this.buffer[i + 2];
    }
    let pixelCount = this.buffer.length / 4;
    red /= pixelCount;
    green /= pixelCount;
    blue /= pixelCount;

    colors.setXYZ(i, red / 255, green / 255, blue / 255);
    // console.log(`${[red, green, blue]}`);
  }

  public update() {
    //update the camera and scene for each vertex
    const vertices = this.geometry.getAttribute('position');
    const normals = this.geometry.getAttribute('normal');
    const light = this.geometry.getAttribute('light');

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let i = 0; i < vertices.count; i++) {
      vertex.fromBufferAttribute(vertices, i);
      normal.fromBufferAttribute(normals, i);
      normal.setLength(0.05);
      vertex.add(normal);
      this.camera.position.copy(vertex);
      this.camera.position.applyMatrix4(this.matrixWorld);
      vertex.add(normal);
      this.camera.lookAt(vertex);
      // console.log(`${[vertex.x, vertex.y, vertex.z]}`);
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.getMeanColor(light, i);
    }
    light.needsUpdate = true;
    this.renderer.setRenderTarget(null);
  }
}
