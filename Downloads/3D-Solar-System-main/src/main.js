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

import { createAllPlanets, raycastTargets, sun, sunMat, settings, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto } from './planets/planets.js';
import { animateMoons } from './moons/animateMoons.js';
import { loadAsteroids, animateAsteroids } from './Loadasteroids/loadAsteroids.js';

import { updateRaycaster, outlineSelection } from './interaction/raycasting.js';
import { updateCameraZoom, handleGestureResults, setupGestureControl } from './interaction/gestureControl.js';
import { updateCameraMovement, showPlanetInfo, closeInfo, closeInfoNoZoomOut } from './interaction/planetSelection.js';
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

// Fonction pour animer les orbites elliptiques
function animateEllipticalOrbit(planetObj, baseSpeed) {
  const orbitData = planetObj.planet3d.orbitData;
  if (!orbitData) return;
  
  // Increment de l'angle orbital
  orbitData.angle += baseSpeed * settings.accelerationOrbit;
  
  // Calcul de la position elliptique selon les lois de Kepler
  const a = orbitData.semiMajorAxis;
  const b = orbitData.semiMinorAxis;
  
  // Position elliptique - suivre le chemin de l'ellipse
  const x = a * Math.cos(orbitData.angle);
  const z = b * Math.sin(orbitData.angle);
  
  // Déplacer la planète pour qu'elle suive l'orbite elliptique
  planetObj.planet.position.set(x, 0, z);
  
  // S'assurer que les anneaux et atmosphères suivent aussi
  if (planetObj.Ring) {
    planetObj.Ring.position.set(x, 0, z);
  }
  if (planetObj.Atmosphere) {
    // L'atmosphère est déjà attachée à la planète, pas besoin de la déplacer
  }
}

// Animation loop
function animate() {
  // Rotation du soleil
  sun.rotateY(0.001 * settings.acceleration);
  
  // Rotation des planètes sur elles-mêmes (spin)
  mercury.planet.rotateY(0.001 * settings.acceleration);
  venus.planet.rotateY(0.0005 * settings.acceleration);
  venus.Atmosphere?.rotateY(0.0005 * settings.acceleration);
  earth.planet.rotateY(0.005 * settings.acceleration);
  earth.Atmosphere?.rotateY(0.001 * settings.acceleration);
  mars.planet.rotateY(0.01 * settings.acceleration);
  jupiter.planet.rotateY(0.005 * settings.acceleration);
  saturn.planet.rotateY(0.01 * settings.acceleration);
  uranus.planet.rotateY(0.005 * settings.acceleration);
  neptune.planet.rotateY(0.005 * settings.acceleration);
  pluto.planet.rotateY(0.001 * settings.acceleration);

  // Animation des orbites elliptiques réalistes
  animateEllipticalOrbit(mercury, 0.0113);   // Le plus rapide
  animateEllipticalOrbit(venus, 0.0062);
  animateEllipticalOrbit(earth, 0.001);      // Référence
  animateEllipticalOrbit(mars, 0.00053);
  animateEllipticalOrbit(jupiter, 0.00084);
  animateEllipticalOrbit(saturn, 0.00034);
  animateEllipticalOrbit(uranus, 0.00012);
  animateEllipticalOrbit(neptune, 0.00006);  // Le plus lent
  animateEllipticalOrbit(pluto, 0.000041);
  
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
