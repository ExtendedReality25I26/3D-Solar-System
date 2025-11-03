import * as THREE from 'three';

import scene from './setup/scene.js';
import camera from './setup/camera.js';
import renderer from './setup/renderer.js';
import createControls from './setup/controls.js';
import { createAmbientLight, createSunLight } from './setup/lighting.js';

import createComposer from './postprocessing/composer.js';
import createOutlinePass from './postprocessing/outlinePass.js';
import createBloomPass from './postprocessing/bloomPass.js';

import { loadTexture, cubeTextureLoader } from './textures/loader.js';

import { createAllPlanets, raycastTargets, sun, sunMat, settings } from './planets/planets.js';
import { animateMoons } from './moons/animateMoons.js';
import { loadAsteroids, animateAsteroids } from './Loadasteroids/loadAsteroids.js';

import { updateRaycaster, outlineSelection } from './interaction/raycasting.js';
import { updateCameraZoom, handleGestureResults } from './interaction/gestureControl.js';
import { updateCameraMovement, showPlanetInfo, closeInfo, closeInfoNoZoomOut } from './interaction/planetSelection.js';
import { setupGestureControl } from './interaction/gestureControl.js';
import { handleMouseDown } from './interaction/raycasting.js';


// Declare and initialize mouse vector
const mouse = new THREE.Vector2();

// Controls and postprocessing
const controls = createControls(camera, renderer);
const composer = createComposer(renderer, scene, camera);
const outlinePass = createOutlinePass(scene, camera);
const bloomPass = createBloomPass();

composer.addPass(outlinePass);
composer.addPass(bloomPass);

// Lighting
scene.add(createAmbientLight());
scene.add(createSunLight());

// Renderer setup
document.body.appendChild(renderer.domElement);
scene.background = cubeTextureLoader.load([
  '/images/3.jpg', '/images/1.jpg', '/images/2.jpg',
  '/images/2.jpg', '/images/4.jpg', '/images/2.jpg'
]);

// GUI setup
import * as dat from 'dat.gui';
const gui = new dat.GUI({ autoPlace: false });
document.getElementById('gui-container').appendChild(gui.domElement);
gui.add(settings, 'accelerationOrbit', 0, 10);
gui.add(settings, 'acceleration', 0, 10);
gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
  sunMat.emissiveIntensity = value;
});

// Load planets and asteroids
createAllPlanets(scene);
loadAsteroids(scene, '/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids(scene, '/asteroids/asteroidPack.glb', 3000, 352, 370);

// Animation loop
function animate() {
  sun.rotateY(0.001 * settings.acceleration);
  animateMoons();
  animateAsteroids(settings.accelerationOrbit);
  updateRaycaster(camera);
  outlineSelection(raycastTargets, outlinePass);
  updateCameraMovement(camera, controls);
  updateCameraZoom(camera, controls, showPlanetInfo);
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

// Mouse move handler to update mouse coordinates
function handleMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Event listeners
window.addEventListener('mousemove', handleMouseMove, false);
window.addEventListener('mousedown', handleMouseDown, false);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
window.closeInfo = closeInfo;

// Gesture setup
setupGestureControl((results) => {
  handleGestureResults(results, camera, raycastTargets, settings, sunMat, gui, controls);
});
