import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const asteroids = [];

export function loadAsteroids(scene, path, count, minRadius, maxRadius) {
  const loader = new GLTFLoader();
  loader.load(path, gltf => {
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        for (let i = 0; i < count / 12; i++) {
          const asteroid = child.clone();
          const radius = THREE.MathUtils.randFloat(minRadius, maxRadius);
          const angle = Math.random() * Math.PI * 2;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          asteroid.position.set(x, 0, z);
          asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
          scene.add(asteroid);
          asteroids.push(asteroid);
        }
      }
    });
  });
}

export function animateAsteroids(speed) {
  asteroids.forEach(asteroid => {
    asteroid.rotation.y += 0.0001;
    const x = asteroid.position.x;
    const z = asteroid.position.z;
    asteroid.position.x = x * Math.cos(0.0001 * speed) + z * Math.sin(0.0001 * speed);
    asteroid.position.z = z * Math.cos(0.0001 * speed) - x * Math.sin(0.0001 * speed);
  });
}
