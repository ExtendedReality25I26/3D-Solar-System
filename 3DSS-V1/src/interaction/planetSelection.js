import * as THREE from 'three';
import { raycaster, mouse } from './raycasting.js';
import { planetData } from '../planets/planetData.js';

let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let isZoomingOut = false;
let targetCameraPosition = new THREE.Vector3();
let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);
let offset = 20;

export function handleMouseDown(event, camera, controls, raycastTargets, settings) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    selectedPlanet = identifyPlanet(clicked);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      settings.accelerationOrbit = 0;

      const pos = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(pos);
      controls.target.copy(pos);
      camera.lookAt(pos);
      targetCameraPosition.copy(pos).add(camera.position.clone().sub(pos).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  }
}

export function identifyPlanet(obj) {
  const match = obj.userData.planetRef;
  if (match) {
    offset = match.offset || 20;
    return match;
  }
  return null;
}

export function updateCameraMovement(camera, controls) {
  if (isMovingTowardsPlanet) {
    camera.position.lerp(targetCameraPosition, 0.03);
    if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      showPlanetInfo(selectedPlanet.name);
    }
  } else if (isZoomingOut) {
    camera.position.lerp(zoomOutTargetPosition, 0.05);
    if (camera.position.distanceTo(zoomOutTargetPosition) < 1) {
      isZoomingOut = false;
    }
  }
}

export function showPlanetInfo(name) {
  const info = document.getElementById('planetInfo');
  const title = document.getElementById('planetName');
  const details = document.getElementById('planetDetails');
  const data = planetData[name];

  title.innerText = name;
  details.innerText = `Radius: ${data.radius}\nTilt: ${data.tilt}\nRotation: ${data.rotation}\nOrbit: ${data.orbit}\nDistance: ${data.distance}\nMoons: ${data.moons}\nInfo: ${data.info}`;
  info.style.display = 'block';
}

export function closeInfo() {
  document.getElementById('planetInfo').style.display = 'none';
  isZoomingOut = true;
}

export function closeInfoNoZoomOut() {
  document.getElementById('planetInfo').style.display = 'none';
}
