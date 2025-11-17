// interactions.js
import * as THREE from 'three';

// Note: this module expects mediapipe Hands & Camera to be globally available
// (e.g., included via <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/..."></script>)
// If you load them via modules, adjust accordingly.

export function initInteractions({
  camera,
  controls,
  raycaster,
  mouse,
  gui,
  settings,
  scene,
  outlinePass,
  planetsObj
}) {
  // state
  let selectedPlanet = null;
  let isMovingTowardsPlanet = false;
  let targetCameraPosition = new THREE.Vector3();
  let offset = 50;
  let isZoomingOut = false;
  let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);

  // helpers for planet identify
  function identifyPlanet(clickedObject) {
    const { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto } = planetsObj.planets;
    if (!clickedObject) return null;

    if (clickedObject.material === mercury.planet.material) {
      offset = 10; return mercury;
    } else if (clickedObject === venus.Atmosphere) {
      offset = 25; return venus;
    } else if (clickedObject === earth.Atmosphere) {
      offset = 25; return earth;
    } else if (clickedObject.material === mars.planet.material) {
      offset = 15; return mars;
    } else if (clickedObject.material === jupiter.planet.material) {
      offset = 50; return jupiter;
    } else if (clickedObject.material === saturn.planet.material) {
      offset = 50; return saturn;
    } else if (clickedObject.material === uranus.planet.material) {
      offset = 25; return uranus;
    } else if (clickedObject.material === neptune.planet.material) {
      offset = 20; return neptune;
    } else if (clickedObject.material === pluto.planet.material) {
      offset = 10; return pluto;
    }
    return null;
  }

  function showPlanetInfo(planetName) {
    const info = document.getElementById('planetInfo');
    const nameEl = document.getElementById('planetName');
    const details = document.getElementById('planetDetails');
    if (!info || !nameEl || !details) return;

    nameEl.innerText = planetName;
    const pd = planetsObj.planetData[planetName];
    details.innerText = `Radius: ${pd.radius}\nTilt: ${pd.tilt}\nRotation: ${pd.rotation}\nOrbit: ${pd.orbit}\nDistance: ${pd.distance}\nMoons: ${pd.moons}\nInfo: ${pd.info}`;

    info.style.display = 'block';
  }

  function closeInfo() {
    const info = document.getElementById('planetInfo');
    if (info) info.style.display = 'none';
    settings.accelerationOrbit = 1;
    isZoomingOut = true;
    controls.target.set(0, 0, 0);
  }

  function closeInfoNoZoomOut() {
    const info = document.getElementById('planetInfo');
    if (info) info.style.display = 'none';
    settings.accelerationOrbit = 1;
  }

  // Mouse move handler (update mouse vector)
  function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  // Mouse down (click) to select planet
  function onDocumentMouseDown(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetsObj.raycastTargets);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const planet = identifyPlanet(clickedObject);
      if (planet) {
        selectedPlanet = planet;
        closeInfoNoZoomOut();
        settings.accelerationOrbit = 0;
        const planetPosition = new THREE.Vector3();
        planet.planet.getWorldPosition(planetPosition);
        controls.target.copy(planetPosition);
        camera.lookAt(planetPosition);
        targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
        isMovingTowardsPlanet = true;
      }
    }
  }

  // Expose helper used by main animate loop
  function updateOnFrame() {
    // outlines
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetsObj.raycastTargets);
    outlinePass.selectedObjects = [];
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj === planetsObj.planets.earth.Atmosphere) {
        outlinePass.selectedObjects = [planetsObj.planets.earth.planet];
      } else if (obj === planetsObj.planets.venus.Atmosphere) {
        outlinePass.selectedObjects = [planetsObj.planets.venus.planet];
      } else {
        outlinePass.selectedObjects = [obj];
      }
    }

    // zoom moving
    if (isMovingTowardsPlanet && selectedPlanet) {
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

  // Gesture controls via MediaPipe Hands (if available globally)
  function setupGestureControls() {
    const videoElement = document.getElementById('gesture-video');
    if (!videoElement || typeof Hands === 'undefined' || typeof Camera === 'undefined') {
      // Mediapipe not available — skip gesture setup
      return;
    }

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);

    const cameraFeed = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
    cameraFeed.start();

    // Allow two-hands if needed
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    function onHandResults(results) {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness[index].label; // 'Left' or 'Right'
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dx = thumbTip.x - indexTip.x;
        const dy = thumbTip.y - indexTip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (handedness === 'Right') {
          // Control sun intensity using pinch distance
          const intensity = THREE.MathUtils.clamp(10 - distance * 30, 1, 10);
          settings.sunIntensity = intensity;
          if (planetsObj.sunMat) planetsObj.sunMat.emissiveIntensity = intensity;

          // Sync GUI controller if available
          if (gui && gui.__controllers) {
            gui.__controllers.forEach(controller => {
              if (controller.property === 'sunIntensity') controller.setValue(intensity);
            });
          }
        }

        if (handedness === 'Left') {
          // Zoom control
          const zoomFactor = THREE.MathUtils.clamp(1 - distance * 2, 0.5, 2);
          camera.zoom = zoomFactor;
          camera.updateProjectionMatrix();

          // Planet selection via pointing
          const idx = landmarks[8];
          const gestureX = idx.x * 2 - 1;
          const gestureY = -idx.y * 2 + 1;
          const gestureVector = new THREE.Vector2(gestureX, gestureY);
          raycaster.setFromCamera(gestureVector, camera);
          const intersects = raycaster.intersectObjects(planetsObj.raycastTargets);

          if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const planet = identifyPlanet(clickedObject);
            if (planet) {
              selectedPlanet = planet;
              closeInfoNoZoomOut();
              const planetPos = new THREE.Vector3();
              planet.planet.getWorldPosition(planetPos);
              controls.target.copy(planetPos);
              camera.lookAt(planetPos);
              targetCameraPosition.copy(planetPos).add(camera.position.clone().sub(planetPos).normalize().multiplyScalar(offset));
              isMovingTowardsPlanet = true;
            }
          }
        }
      });
    }
  }

  // Event listeners
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onDocumentMouseDown, false);

  // expose functions required by main loop
  return {
    updateOnFrame,
    setupGestureControls,
    closeInfo
  };
}
