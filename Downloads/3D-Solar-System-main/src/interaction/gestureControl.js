import * as THREE from 'three';
import { raycaster } from './raycasting.js';
import { identifyPlanet, closeInfoNoZoomOut } from './planetSelection.js';

let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let targetCameraPosition = new THREE.Vector3();

export function setupGestureControl(onResultsCallback) {
  const video = document.getElementById('gesture-video');
  
  const { Hands } = window;
  const { Camera } = window;
  
  const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(onResultsCallback);

  const cameraFeed = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480
  });
  
  cameraFeed.start().catch(console.error);
  
  return { hands, cameraFeed, video };
}

export function handleGestureResults(results, camera, raycastTargets, settings, sunMat, gui, controls) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

  results.multiHandLandmarks.forEach((landmarks, index) => {
    const handedness = results.multiHandedness[index].label;
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (handedness === 'Right') {
      // MAIN DROITE : Contrôle de l'intensité du soleil
      const intensity = THREE.MathUtils.clamp(10 - distance * 30, 1, 10);
      settings.sunIntensity = intensity;
      sunMat.emissiveIntensity = intensity;
      gui.__controllers.forEach(c => {
        if (c.property === 'sunIntensity') c.setValue(intensity);
      });
    }

    if (handedness === 'Left') {
      // MAIN GAUCHE : Zoom caméra et sélection planètes
      const zoomFactor = THREE.MathUtils.clamp(1 - distance * 2, 0.5, 2);
      camera.zoom = zoomFactor;
      camera.updateProjectionMatrix();

      const gestureX = indexTip.x * 2 - 1;
      const gestureY = -indexTip.y * 2 + 1;
      const gestureVector = new THREE.Vector2(gestureX, gestureY);
      raycaster.setFromCamera(gestureVector, camera);
      const intersects = raycaster.intersectObjects(raycastTargets);

      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        const planet = identifyPlanet(clicked);
        if (planet) {
          selectedPlanet = planet;
          closeInfoNoZoomOut();
          const pos = new THREE.Vector3();
          planet.planet.getWorldPosition(pos);
          controls.target.copy(pos);
          camera.lookAt(pos);

          const offset = planet.offset || 20;
          targetCameraPosition.copy(pos).add(
            camera.position.clone().sub(pos).normalize().multiplyScalar(offset)
          );
          isMovingTowardsPlanet = true;
        }
      }
    }
  });
}

export function updateCameraZoom(camera, controls, showPlanetInfo) {
  if (isMovingTowardsPlanet) {
    camera.position.lerp(targetCameraPosition, 0.03);
    if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      if (selectedPlanet) showPlanetInfo(selectedPlanet.name);
    }
  }
}
