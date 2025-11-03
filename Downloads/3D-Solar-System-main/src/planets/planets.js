import { createPlanet } from './createPlanet.js';
import { loadTexture } from '../textures/loader.js';
import { earthMoon } from '../moons/earthMoons.js';
import { marsMoons } from '../moons/marsMoons.js';
import { jupiterMoons } from '../moons/jupiterMoons.js';
import earthMaterial from '../materials/earthShader.js';
import * as THREE from 'three';

export const settings = {
  accelerationOrbit: 1,
  acceleration: 1,
  sunIntensity: 1.9
};

export const sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load('/images/sun.jpg'),
  emissiveIntensity: settings.sunIntensity
});

const sunSize = 697 / 40;
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
export const sun = new THREE.Mesh(sunGeom, sunMat);

// Distances orbitales RÉDUITES et excentricités DRAMATIQUES pour effet visuel spectaculaire
export const mercury = createPlanet('Mercury', 2.4, 40, 0, '/images/mercurymap.jpg', '/images/mercurybump.jpg', null, null, null, 0.6);
export const venus = createPlanet('Venus', 6.1, 65, 3, '/images/venusmap.jpg', '/images/venusmap.jpg', null, '/images/venus_atmosphere.jpg', null, 0.4);
export const earth = createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, '/images/earth_atmosphere.jpg', earthMoon, 0.3);
export const mars = createPlanet('Mars', 3.4, 115, 25, '/images/marsmap.jpg', '/images/marsbump.jpg', null, null, null, 0.5);
export const jupiter = createPlanet('Jupiter', 69 / 4, 200, 3, '/images/jupiter.jpg', null, null, null, jupiterMoons, 0.2);
export const saturn = createPlanet('Saturn', 58 / 4, 270, 26, '/images/saturnmap.jpg', null, {
  innerRadius: 18,
  outerRadius: 29,
  texture: '/images/saturn_ring.png'
}, null, null, 0.25);
export const uranus = createPlanet('Uranus', 25 / 4, 320, 82, '/images/uranus.jpg', null, {
  innerRadius: 6,
  outerRadius: 8,
  texture: '/images/uranus_ring.png'
}, null, null, 0.15);
export const neptune = createPlanet('Neptune', 24 / 4, 360, 28, '/images/neptune.jpg', null, null, null, null, 0.1);
export const pluto = createPlanet('Pluto', 1, 400, 57, '/images/plutomap.jpg', null, null, null, null, 0.7);

export const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere,
  earth.planet, earth.Atmosphere, mars.planet,
  jupiter.planet, saturn.planet, uranus.planet,
  neptune.planet, pluto.planet
];

export function createAllPlanets(scene) {
  scene.add(sun);
  scene.add(mercury.planet3d);
  scene.add(venus.planet3d);
  scene.add(earth.planet3d);
  scene.add(mars.planet3d);
  scene.add(jupiter.planet3d);
  scene.add(saturn.planet3d);
  scene.add(uranus.planet3d);
  scene.add(neptune.planet3d);
  scene.add(pluto.planet3d);
}
