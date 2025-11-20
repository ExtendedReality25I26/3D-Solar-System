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
  let offset = 50;
  // highlighted orbit reference for dynamic animation
  let highlightedOrbit = null;

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

  // --- Orbit highlight state and helpers ---
  // Map to store original orbit material properties for restoration
  const orbitOriginalStyles = new Map();

  // Find the orbit Line object associated with a planet by searching its parent group
  function findOrbitForPlanet(planet) {
    if (!planet || !planet.planet) return null;
    const parent = planet.planet.parent; // planetSystem
    if (!parent) return null;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.type === 'Line' || child.type === 'LineLoop') {
        return child;
      }
    }
    return null;
  }

  // Highlight a single orbit (and restore others)
  function highlightOrbitFor(planet) {
    // restore all first
    for (const key in planetsObj.planets) {
      const p = planetsObj.planets[key];
      const orbit = findOrbitForPlanet(p);
      if (orbit && orbit.material) {
        const orig = orbitOriginalStyles.get(orbit.uuid);
        if (orig) {
          orbit.material.color.set(orig.color);
          orbit.material.opacity = orig.opacity;
          orbit.material.transparent = orig.transparent;
          orbit.material.needsUpdate = true;
        }
      }
    }

    // set highlight style for selected planet orbit
    const orbit = findOrbitForPlanet(planet);
    if (!orbit) return;
    // save original if not saved
    if (!orbitOriginalStyles.has(orbit.uuid)) {
      orbitOriginalStyles.set(orbit.uuid, {
        color: orbit.material.color ? orbit.material.color.getHex() : 0xffffff,
        opacity: typeof orbit.material.opacity !== 'undefined' ? orbit.material.opacity : 1,
        transparent: !!orbit.material.transparent
      });
    }

    // Apply highlight: blue tint + higher opacity and set as highlightedOrbit
    orbit.material.color.set(0x66aaff);
    orbit.material.opacity = Math.max(orbit.material.opacity || 0.05, 0.25);
    orbit.material.transparent = true;
    orbit.material.blending = THREE.AdditiveBlending;
    orbit.material.needsUpdate = true;
    highlightedOrbit = orbit;
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

  // Create and manage an orbit-following HTML info panel
  let followPanel = null;

  function createOrShowFollowPanel(planetName) {
    if (!followPanel) {
      followPanel = document.createElement('div');
      followPanel.id = 'orbit-follow-panel';
      followPanel.style.position = 'fixed';
      followPanel.style.pointerEvents = 'none';
      followPanel.style.minWidth = '180px';
      followPanel.style.padding = '8px 10px';
      followPanel.style.background = 'rgba(10, 10, 20, 0.6)';
      followPanel.style.color = '#fff';
      followPanel.style.border = '1px solid rgba(255,255,255,0.08)';
      followPanel.style.borderRadius = '6px';
      followPanel.style.fontFamily = 'Arial, sans-serif';
      followPanel.style.fontSize = '13px';
      followPanel.style.backdropFilter = 'blur(4px)';
      followPanel.style.zIndex = '9999';

      const title = document.createElement('div');
      title.id = 'orbit-follow-title';
      title.style.fontWeight = '600';
      title.style.marginBottom = '6px';
      followPanel.appendChild(title);

      const thetaRow = document.createElement('div');
      thetaRow.id = 'orbit-follow-theta';
      followPanel.appendChild(thetaRow);

      const periodRow = document.createElement('div');
      periodRow.id = 'orbit-follow-period';
      followPanel.appendChild(periodRow);

      const distRow = document.createElement('div');
      distRow.id = 'orbit-follow-distance';
      followPanel.appendChild(distRow);

      document.body.appendChild(followPanel);
    }
    document.getElementById('orbit-follow-title').innerText = planetName;
    followPanel.style.display = 'block';
  }

  function hideFollowPanel() {
    if (followPanel) followPanel.style.display = 'none';
  }

  function updateFollowPanel(planet) {
    if (!followPanel || !planet) return;
    const worldPos = new THREE.Vector3();
    planet.planet.getWorldPosition(worldPos);
    const relPos = worldPos.clone();
    const theta = Math.atan2(relPos.z, relPos.x);
    const distance = relPos.length();

    let periodText = 'unknown';
    try {
      const orbitStr = planetsObj.planetData[planet.name] && planetsObj.planetData[planet.name].orbit;
      if (orbitStr) {
        const m = orbitStr.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (m) {
          const days = parseFloat(m[1]);
          periodText = `${days} days`;
        } else {
          periodText = orbitStr;
        }
      }
    } catch (e) {
      periodText = 'unknown';
    }

    document.getElementById('orbit-follow-theta').innerText = `θ: ${theta.toFixed(4)} rad`;
    document.getElementById('orbit-follow-period').innerText = `Period: ${periodText}`;
    document.getElementById('orbit-follow-distance').innerText = `Distance: ${distance.toFixed(2)} units`;

    const proj = worldPos.clone().project(camera);
    const screenX = (proj.x + 1) / 2 * window.innerWidth;
    const screenY = (-proj.y + 1) / 2 * window.innerHeight;
    const offsetY = 20;
    followPanel.style.left = `${Math.round(screenX - followPanel.clientWidth / 2)}px`;
    followPanel.style.top = `${Math.round(screenY + offsetY)}px`;
  }

  function closeInfo() {
    const info = document.getElementById('planetInfo');
    if (info) info.style.display = 'none';
    settings.accelerationOrbit = 1;
    controls.target.set(0, 0, 0);
    // hide follow panel and restore orbit styles
    hideFollowPanel();
    // restore orbit styles
    for (const key in planetsObj.planets) {
      const p = planetsObj.planets[key];
      const orbit = findOrbitForPlanet(p);
      if (orbit && orbit.material) {
        const orig = orbitOriginalStyles.get(orbit.uuid);
        if (orig) {
          orbit.material.color.set(orig.color);
          orbit.material.opacity = orig.opacity;
          orbit.material.transparent = orig.transparent;
          orbit.material.blending = THREE.NormalBlending;
          orbit.material.needsUpdate = true;
        }
      }
    }
    highlightedOrbit = null;
  }

  function closeInfoNoZoomOut() {
    const info = document.getElementById('planetInfo');
    if (info) info.style.display = 'none';
    settings.accelerationOrbit = 1;
    // hide follow panel and restore any highlighted orbit
    hideFollowPanel();
    for (const key in planetsObj.planets) {
      const p = planetsObj.planets[key];
      const orbit = findOrbitForPlanet(p);
      if (orbit && orbit.material) {
        const orig = orbitOriginalStyles.get(orbit.uuid);
        if (orig) {
          orbit.material.color.set(orig.color);
          orbit.material.opacity = orig.opacity;
          orbit.material.transparent = orig.transparent;
          orbit.material.blending = THREE.NormalBlending;
          orbit.material.needsUpdate = true;
        }
      }
    }
    highlightedOrbit = null;
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
        // Select the planet and show info without zooming or stopping orbital motion
        selectedPlanet = planet;
        // highlight this planet's orbit (this also restores previous highlights)
        highlightOrbitFor(planet);
        // show the follow panel beneath the planet
        createOrShowFollowPanel(planet.name);
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

    // Animate highlighted orbit with a subtle blue pulse while keeping planets orbiting
    if (highlightedOrbit) {
      try {
        const t = performance.now() * 0.001;
        const orig = orbitOriginalStyles.get(highlightedOrbit.uuid) || { opacity: 0.03, color: 0xffffff };
        const base = typeof orig.opacity === 'number' ? orig.opacity : 0.03;
        const pulse = base + 0.15 * (0.5 + 0.5 * Math.sin(t * 3));
        highlightedOrbit.material.opacity = THREE.MathUtils.clamp(pulse, 0.05, 1);
        const origColor = new THREE.Color(orig.color);
        const blue = new THREE.Color(0x66aaff);
        const mix = 0.4 + 0.4 * Math.sin(t * 2);
        highlightedOrbit.material.color.lerpColors(origColor, blue, THREE.MathUtils.clamp(mix, 0, 1));
        highlightedOrbit.material.needsUpdate = true;
      } catch (e) {
        // ignore
      }
    }

    // update follow panel if a planet is selected
    if (selectedPlanet) {
      updateFollowPanel(selectedPlanet);
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
