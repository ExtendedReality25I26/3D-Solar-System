// setup.js
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';

export function initSetup() {
  // Scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-175, 115, 5);

  // Renderer
  const renderer = new THREE.WebGL1Renderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.75;
  controls.screenSpacePanning = false;

  // Loaders
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const loadTexture = new THREE.TextureLoader();

  // Postprocessing composer
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Outline pass
  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 1;
  outlinePass.visibleEdgeColor.set(0xffffff);
  outlinePass.hiddenEdgeColor.set(0x190a05);
  composer.addPass(outlinePass);

  // Bloom pass
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
  bloomPass.threshold = 1;
  bloomPass.radius = 0.9;
  composer.addPass(bloomPass);

  // Ambient light
  const lightAmbient = new THREE.AmbientLight(0x222222, 6);
  scene.add(lightAmbient);

  // Background stars (cube texture)
  scene.background = cubeTextureLoader.load([
    bgTexture3,
    bgTexture1,
    bgTexture2,
    bgTexture2,
    bgTexture4,
    bgTexture2
  ]);

  // GUI
  const gui = new dat.GUI({ autoPlace: false });
  const customContainer = document.getElementById('gui-container');
  if (customContainer) customContainer.appendChild(gui.domElement);

  // Settings object (shared)
  const settings = {
    timeScale: 1.0, // 1 jour par seconde par défaut
    sunIntensity: 1.9
  };

  // Raycaster + mouse
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Attach resize listener (main.py will call render loop, but resizing here is fine)
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    controls,
    composer,
    outlinePass,
    loadTexture,
    settings,
    gui,
    raycaster,
    mouse
  };
}
