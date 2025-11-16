import * as THREE from 'three';

export function createAmbientLight() {
  return new THREE.AmbientLight(0x222222, 6);
}

export function createSunLight() {
  const pointLight = new THREE.PointLight(0xFDFFD3, 1200, 400, 1.4);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 1024;
  pointLight.shadow.mapSize.height = 1024;
  pointLight.shadow.camera.near = 10;
  pointLight.shadow.camera.far = 20;
  return pointLight;
}
