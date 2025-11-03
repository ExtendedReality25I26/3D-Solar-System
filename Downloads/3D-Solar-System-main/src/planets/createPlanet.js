import * as THREE from 'three';
import { loadTexture } from '../textures/loader.js';

export function createPlanet(name, size, position, tilt, texture, bump, ring, atmosphere, moons, eccentricity = 0) {
  let material;
  if (texture instanceof THREE.Material) {
    material = texture;
  } else if (bump) {
    material = new THREE.MeshPhongMaterial({
      map: loadTexture.load(texture),
      bumpMap: loadTexture.load(bump),
      bumpScale: 0.7
    });
  } else {
    material = new THREE.MeshPhongMaterial({ map: loadTexture.load(texture) });
  }

  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D();
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  
  // Calcul des paramètres d'orbite elliptique réaliste
  const semiMajorAxis = position;  // Demi-grand axe
  const semiMinorAxis = position * Math.sqrt(1 - eccentricity * eccentricity);  // Demi-petit axe
  
  // Position initiale sur l'orbite elliptique
  const initialAngle = Math.random() * 2 * Math.PI;
  const initialX = semiMajorAxis * Math.cos(initialAngle);
  const initialZ = semiMinorAxis * Math.sin(initialAngle);
  
  planet.position.set(initialX, 0, initialZ);
  planet.rotation.z = tilt * Math.PI / 180;
  
  // Création de l'orbite elliptique
  const orbitPath = new THREE.EllipseCurve(
    0, 0,                    // Centre
    semiMajorAxis,           // Rayon X (grand axe)
    semiMinorAxis,           // Rayon Y (petit axe)
    0, 2 * Math.PI,          // Angles complets
    false, 0                 // Sens et rotation
  );
  
  const pathPoints = orbitPath.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  
  // Orbites JAUNES comme dans l'image de référence
  const orbitMaterial = new THREE.LineBasicMaterial({ 
    color: 0xFFFF00,         // JAUNE au lieu de blanc
    transparent: true, 
    opacity: 0.8             // Plus visible
  });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  let Ring, Atmosphere;
  if (ring) {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 30);
    const RingMat = new THREE.MeshStandardMaterial({
      map: loadTexture.load(ring.texture),
      side: THREE.DoubleSide
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    Ring.position.set(initialX, 0, initialZ);  // Même position que la planète
    Ring.rotation.x = -0.5 * Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
    planetSystem.add(Ring);
  }

  if (atmosphere) {
    const atmosphereGeom = new THREE.SphereGeometry(size + 0.1, 32, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map: loadTexture.load(atmosphere),
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false
    });
    Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  if (moons) {
    moons.forEach(moon => {
      let moonMaterial = moon.bump
        ? new THREE.MeshStandardMaterial({
            map: loadTexture.load(moon.texture),
            bumpMap: loadTexture.load(moon.bump),
            bumpScale: 0.5
          })
        : new THREE.MeshStandardMaterial({ map: loadTexture.load(moon.texture) });

      const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      const moonOrbitDistance = size * 1.5;
      moonMesh.position.set(moonOrbitDistance, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }

  planet3d.add(planetSystem);
  
  // Stocker les paramètres orbitaux pour l'animation elliptique
  planet3d.orbitData = {
    semiMajorAxis: semiMajorAxis,
    semiMinorAxis: semiMinorAxis,
    eccentricity: eccentricity,
    angle: initialAngle  // Utiliser le même angle initial
  };
  
  return { name, planet, planet3d, Atmosphere, moons, planetSystem, Ring };
}
