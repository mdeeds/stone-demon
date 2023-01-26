import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { AmbientOcclusionMesh } from "./ambientOcclusionMesh";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

export class Game {

  // As is our convention, the universe is moved around the player, and the player is in world space:
  //
  // World (Scene)
  // +-- Player
  // | +-- Camera
  // + tail
  // +-- Universe

  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private scene = new THREE.Scene();
  private universe = new THREE.Group();
  private tail = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial({ color: 'brown' }));
  private antiTail = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial({ color: 'black' }));
  private player = new THREE.Group();

  constructor() {
    document.body.innerHTML = "";

    this.setUpCamera();
    this.setUpRenderer();
    this.setUpFloor();
  }

  // TypeError: Failed to execute 'drawImage' on 
  // 'CanvasRenderingContext2D': The provided value is not of type 
  // '(CSSImageValue or HTMLCanvasElement or HTMLImageElement or 
  // HTMLVideoElement or ImageBitmap or OffscreenCanvas or 
  // SVGImageElement or VideoFrame)'.

  private setUpCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75, /*aspect=*/1.0, /*near=*/0.1,
      /*far=*/20000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -100);
    this.player.add(this.camera);
    this.scene.add(this.player);
    this.scene.add(this.tail);
    this.scene.add(this.antiTail);
    this.scene.add(this.universe);

    this.tail.position.set(0, 0, 1.0);
    this.antiTail.position.set(0, 0, -1.0);
  }

  private reversePositions(att: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
    for (let i = 0; i < att.count / 2; ++i) {
      const j = (att.count - 1) - i;
      const oldI = att.getX(i);
      const oldJ = att.getX(j);
      att.setX(i, oldJ);
      att.setX(j, oldI);
    }
  }

  private setUpFloor() {
    let boxBGeometry = new THREE.BoxGeometry(10, 10, 10, 32, 32, 32);
    const boxGeometry = BufferGeometryUtils.mergeVertices(boxBGeometry, 0.01);
    this.reversePositions(boxGeometry.getIndex());
    boxGeometry.computeVertexNormals();

    const floor = new AmbientOcclusionMesh(boxGeometry,
      32, this.scene, this.renderer,
      new THREE.Color('#aaa'), new THREE.Color('#000'));
    this.scene.add(floor);

    const lightGeometry = BufferGeometryUtils.mergeVertices(
      new THREE.BoxGeometry(10, 0.1, 10), 0.01);
    lightGeometry.computeVertexNormals();
    const light = new AmbientOcclusionMesh(
      lightGeometry,
      16, this.scene, this.renderer,
      new THREE.Color('#111'), new THREE.Color(0.005, 0.005, 0.005));
    light.position.set(0, 5, 0);
    this.scene.add(light);

    const light2Geometry = BufferGeometryUtils.mergeVertices(
      new THREE.IcosahedronGeometry(0.4, 1), 0.01);
    light2Geometry.computeVertexNormals();
    const light2 = new AmbientOcclusionMesh(
      light2Geometry,
      16, this.scene, this.renderer,
      new THREE.Color('#111'), new THREE.Color('#dea'));
    light2.position.set(-0.5, 2.2, -3.5);
    this.scene.add(light2);

    const ballGeometry = BufferGeometryUtils.mergeVertices(
      new THREE.IcosahedronGeometry(0.7, 2), 0.01);
    ballGeometry.computeVertexNormals();
    const ball = new AmbientOcclusionMesh(
      ballGeometry,
      32, this.scene, this.renderer,
      new THREE.Color('#f44'), new THREE.Color('#000'));
    ball.position.set(0.6, 0, -4.7);
    this.scene.add(ball);

    const ball2Geometry = BufferGeometryUtils.mergeVertices(
      new THREE.IcosahedronGeometry(1.5, 1), 0.01);
    ball2Geometry.computeVertexNormals();
    const ball2 = new AmbientOcclusionMesh(
      ball2Geometry,
      32, this.scene, this.renderer,
      new THREE.Color('#44f'), new THREE.Color('#000'));
    ball2.position.set(-1.8, 0.5, -5.1);
    this.scene.add(ball2);

    const updateF = () => {
      console.time('update');
      floor.update();
      ball.update();
      ball2.update();
      console.timeEnd('update');
      setTimeout(updateF, 1000);
    };

    setTimeout(updateF, 0);
  }

  private setUpRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(1024, 1024);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    const clock = new THREE.Clock();
    let elapsedS = 0;
    let frameCount = 0;

    const delta = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      ++frameCount;
      this.renderer.render(this.scene, this.camera);
    });
  }
}