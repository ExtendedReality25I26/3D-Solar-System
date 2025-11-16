import * as THREE from 'three';

// Shared raycaster and mouse vector
export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

/**
 * Updates the mouse position based on the current pointer location.
 * This is used for raycasting in normalized device coordinates.
 */
export function handleMouseMove(event) {
  event.preventDefault();
  updateMousePosition(event);
}

/**
 * Internal helper to update the shared mouse vector.
 */
function updateMousePosition(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Updates the raycaster with the current mouse position and camera.
 * Ensures the camera is valid before proceeding.
 */
export function updateRaycaster(camera) {
  if (!isValidCamera(camera)) {
    console.error('Raycaster error: camera is undefined or invalid');
    return;
  }
  raycaster.setFromCamera(mouse, camera);
}

/**
 * Highlights the object under the mouse by updating the outline pass.
 */
export function outlineSelection(targets, outlinePass) {
  if (!Array.isArray(targets) || targets.length === 0) return;

  const intersects = raycaster.intersectObjects(targets);
  outlinePass.selectedObjects = [];

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.name === 'EarthAtmosphere') {
      outlinePass.selectedObjects = [targets.find(p => p.name === 'Earth')];
    } else if (obj.name === 'VenusAtmosphere') {
      outlinePass.selectedObjects = [targets.find(p => p.name === 'Venus')];
    } else {
      outlinePass.selectedObjects = [obj];
    }
  }
}

/**
 * Handles mouse click interactions for selecting planets.
 * Performs raycasting and camera repositioning based on selection.
 */
export function handleMouseDown(
  event,
  camera,
  controls,
  raycastTargets,
  settings,
  identifyPlanet,
  closeInfoNoZoomOut,
  setTargetCameraPosition
) {
  event.preventDefault();
  updateMousePosition(event);

  if (!isValidCamera(camera)) {
    console.error('Raycaster error: camera is undefined or invalid');
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const selectedPlanet = identifyPlanet(clickedObject);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      settings.accelerationOrbit = 0;

      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition);

      const offset = selectedPlanet.offset || 20;
      const targetCameraPosition = planetPosition.clone().add(
        camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset)
      );
      setTargetCameraPosition(selectedPlanet, targetCameraPosition);
    }
  }
}

/**
 * Utility to validate camera type.
 */
function isValidCamera(camera) {
  return camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera;
}
