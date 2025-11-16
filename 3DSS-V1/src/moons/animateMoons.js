import * as THREE from 'three';
import { earth, mars, jupiter } from '../planets/planets.js';

export function animateMoons() {
  const time = performance.now();
  const tiltAngle = 5 * Math.PI / 180;

  if (earth.moons) {
    earth.moons.forEach(moon => {
      const x = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
      const y = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
      const z = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);
      moon.mesh.position.set(x, y, z);
      moon.mesh.rotateY(0.01);
    });
  }

  if (mars.moons) {
    mars.moons.forEach(moon => {
      if (moon.mesh) {
        const x = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
        const y = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
        const z = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
        moon.mesh.position.set(x, y, z);
        moon.mesh.rotateY(0.001);
      }
    });
  }

  if (jupiter.moons) {
    jupiter.moons.forEach(moon => {
      const x = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
      const y = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
      const z = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
      moon.mesh.position.set(x, y, z);
      moon.mesh.rotateY(0.01);
    });
  }
}
