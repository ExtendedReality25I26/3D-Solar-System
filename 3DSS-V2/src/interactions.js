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
  // alignment detection state
  let alignmentLine = null;
  let alignmentDistanceLabels = [];
  const alignmentThreshold = 0.15; // angle threshold in radians (~8.6 degrees)
  // audio state
  let currentAudio = null;
  let backgroundAudio = null;

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

  // Play audio for a planet
  function playPlanetAudio(planetName) {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Map planet names to audio files
    const audioMap = {
      'Earth': 'audio-info/earth-info-ai-assistance.wav', 
      'Mars': 'audio-info/mars-info-ai-assistance.wav',
      'Venus': 'audio-info/venus-info-ai-assistance.wav',
      'Mercury': 'audio-info/mercury-info-ai-assistance.wav',
      'Jupiter': 'audio-info/jupiter-info-ai-assistance.wav',
      'Saturn': 'audio-info/saturn-info-ai-assistance.wav',
    };

    const audioFile = audioMap[planetName];
    if (!audioFile) return; // No audio for this planet

    // Create or reuse audio element
    if (!currentAudio) {
      currentAudio = new Audio();
      currentAudio.volume = 0.7; // Set volume to 70%
    }

    // Set source and play
    currentAudio.src = audioFile;
    currentAudio.play().catch(err => {
      console.warn(`Could not play audio: ${err}`);
    });
  }

  // Check for planetary alignment (3+ planets aligned with sun)
  function checkPlanetaryAlignment() {
    const planets = Object.values(planetsObj.planets);
    const alignedPlanets = [];
    
    // Get sun position (at origin)
    const sunPos = new THREE.Vector3(0, 0, 0);
    
    // Check each planet's angle from sun
    const planetAngles = planets.map(p => {
      if (!p || !p.planet) return null;
      const worldPos = new THREE.Vector3();
      p.planet.getWorldPosition(worldPos);
      const angleFromSun = Math.atan2(worldPos.z, worldPos.x);
      return { planet: p, position: worldPos, angle: angleFromSun, distance: worldPos.length() };
    }).filter(p => p !== null);
    
    // Sort by angle
    planetAngles.sort((a, b) => a.angle - b.angle);
    
    // Find groups of aligned planets
    for (let i = 0; i < planetAngles.length; i++) {
      const group = [planetAngles[i]];
      
      for (let j = i + 1; j < planetAngles.length; j++) {
        const angleDiff = Math.abs(planetAngles[j].angle - planetAngles[i].angle);
        // Check if aligned (within threshold or nearly opposite)
        if (angleDiff < alignmentThreshold || Math.abs(angleDiff - Math.PI) < alignmentThreshold) {
          group.push(planetAngles[j]);
        }
      }
      
      // If 3 or more planets aligned, create visualization
      if (group.length >= 3) {
        return group.sort((a, b) => a.distance - b.distance);
      }
    }
    
    return null;
  }

  // Create or update alignment line visualization
  function updateAlignmentVisualization(alignedPlanets) {
    // Remove old visualization
    if (alignmentLine) {
      scene.remove(alignmentLine);
      alignmentLine = null;
    }
    alignmentDistanceLabels.forEach(label => {
      if (label.element && label.element.parentNode) {
        label.element.parentNode.removeChild(label.element);
      }
    });
    alignmentDistanceLabels = [];
    
    if (!alignedPlanets || alignedPlanets.length < 3) return;
    
    // Create colorful gradient line
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Extend line beyond planets for visual effect
    const firstPlanet = alignedPlanets[0];
    const lastPlanet = alignedPlanets[alignedPlanets.length - 1];
    const direction = lastPlanet.position.clone().sub(firstPlanet.position).normalize();
    
    const lineStart = firstPlanet.position.clone().sub(direction.clone().multiplyScalar(20));
    const lineEnd = lastPlanet.position.clone().add(direction.clone().multiplyScalar(20));
    
    // Add line segments with gradient colors
    const segmentCount = alignedPlanets.length - 1;
    for (let i = 0; i < alignedPlanets.length; i++) {
      positions.push(alignedPlanets[i].position.x, alignedPlanets[i].position.y, alignedPlanets[i].position.z);
      
      // Rainbow colors for each planet
      const hue = (i / alignedPlanets.length) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 4,
      fog: false
    });
    
    alignmentLine = new THREE.LineSegments(geometry, material);
    scene.add(alignmentLine);
    
    // Add distance labels at center of each segment
    for (let i = 0; i < alignedPlanets.length; i++) {
      const planet = alignedPlanets[i];
      const distance = planet.distance.toFixed(2);
      
      // Create HTML label
      const label = document.createElement('div');
      label.style.position = 'fixed';
      label.style.padding = '4px 8px';
      label.style.background = 'rgba(0, 0, 0, 0.7)';
      label.style.color = '#fff';
      label.style.fontSize = '12px';
      label.style.borderRadius = '4px';
      label.style.border = '1px solid rgba(100, 200, 255, 0.6)';
      label.style.pointerEvents = 'none';
      label.style.whiteSpace = 'nowrap';
      label.style.zIndex = '9998';
      label.innerText = `${planet.planet.name}: ${distance}`;
      document.body.appendChild(label);
      
      alignmentDistanceLabels.push({ planet, element: label });
    }
  }

  // Update alignment label positions
  function updateAlignmentLabels() {
    alignmentDistanceLabels.forEach(({ planet, element }) => {
      if (!element) return;
      const worldPos = planet.position;
      const projected = worldPos.clone().project(camera);
      const screenX = (projected.x + 1) / 2 * window.innerWidth;
      const screenY = (-projected.y + 1) / 2 * window.innerHeight;
      element.style.left = `${Math.round(screenX - element.clientWidth / 2)}px`;
      element.style.top = `${Math.round(screenY - 25)}px`;
    });
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
  let lastAnimationColor = { hue: 0, sat: 100, light: 50 };

  function createOrShowFollowPanel(planetName) {
    if (!followPanel) {
      followPanel = document.createElement('div');
      followPanel.id = 'orbit-follow-panel';
      followPanel.style.position = 'fixed';
      followPanel.style.pointerEvents = 'none';
      followPanel.style.minWidth = '200px';
      followPanel.style.padding = '10px 12px';
      followPanel.style.background = 'rgba(10, 10, 20, 0.4)';
      followPanel.style.color = '#fff';
      followPanel.style.border = '2px solid rgba(100, 170, 255, 0.4)';
      followPanel.style.borderRadius = '8px';
      followPanel.style.fontFamily = 'Arial, sans-serif';
      followPanel.style.fontSize = '12px';
      followPanel.style.backdropFilter = 'blur(8px)';
      followPanel.style.zIndex = '9999';
      followPanel.style.boxShadow = '0 0 20px rgba(100, 170, 255, 0.2)';

      const title = document.createElement('div');
      title.id = 'orbit-follow-title';
      title.style.fontWeight = '700';
      title.style.marginBottom = '8px';
      title.style.fontSize = '14px';
      title.style.textShadow = '0 0 10px rgba(100, 170, 255, 0.4)';
      followPanel.appendChild(title);

      // Helper function to create styled info row container
      const createInfoRow = (id) => {
        const row = document.createElement('div');
        row.id = id;
        row.style.padding = '6px 8px';
        row.style.marginBottom = '4px';
        row.style.background = 'rgba(100, 170, 255, 0.08)';
        row.style.border = '1px solid rgba(100, 170, 255, 0.3)';
        row.style.borderRadius = '4px';
        row.style.fontSize = '12px';
        row.style.color = 'rgba(200, 220, 255, 0.9)';
        row.style.transition = 'all 0.3s ease';
        return row;
      };

      const thetaRow = createInfoRow('orbit-follow-theta');
      followPanel.appendChild(thetaRow);

      const periodRow = createInfoRow('orbit-follow-period');
      followPanel.appendChild(periodRow);

      const distRow = createInfoRow('orbit-follow-distance');
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

    // Update follow panel with dynamic color animation synchronized to orbit highlight
    if (highlightedOrbit) {
      const t = performance.now() * 0.001;
      // Cycle through orbit colors: cyan → blue → green → magenta → orange (5 colors, ~4 sec cycle)
      const colorCycle = [
        { h: 180, s: 100, l: 50 },  // cyan
        { h: 220, s: 100, l: 50 },  // blue
        { h: 140, s: 100, l: 45 },  // green
        { h: 300, s: 100, l: 50 },  // magenta
        { h: 30,  s: 100, l: 50 }   // orange
      ];
      const cycleTime = 2.0; // 2 seconds per full cycle through colors
      const cycleIndex = (t / cycleTime) % colorCycle.length;
      const colorIdx = Math.floor(cycleIndex);
      const nextColorIdx = (colorIdx + 1) % colorCycle.length;
      const blend = cycleIndex - colorIdx;

      const current = colorCycle[colorIdx];
      const next = colorCycle[nextColorIdx];
      const h = current.h + (next.h - current.h) * blend;
      const s = current.s + (next.s - current.s) * blend;
      const l = current.l + (next.l - current.l) * blend;

      lastAnimationColor = { hue: h, sat: s, light: l };

      // Apply animated color to panel border and shadow
      followPanel.style.borderColor = `hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, 0.6)`;
      followPanel.style.boxShadow = `0 0 20px hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, 0.5), inset 0 0 10px hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${(l - 10).toFixed(0)}%, 0.1)`;

      // Apply color to each info row with slight transparency and glow
      const rows = ['orbit-follow-theta', 'orbit-follow-period', 'orbit-follow-distance'];
      rows.forEach((id, idx) => {
        const row = document.getElementById(id);
        if (row) {
          // Stagger animation for visual effect
          const staggledH = (h + idx * 15) % 360;
          row.style.borderColor = `hsla(${staggledH.toFixed(0)}, ${s.toFixed(0)}%, ${Math.min(l + 10, 70).toFixed(0)}%, 0.7)`;
          row.style.background = `hsla(${staggledH.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, 0.1)`;
          row.style.boxShadow = `inset 0 0 8px hsla(${staggledH.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, 0.2), 0 0 8px hsla(${staggledH.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, 0.15)`;
          row.style.color = `hsla(${staggledH.toFixed(0)}, ${(s - 20).toFixed(0)}%, ${Math.min(l + 30, 90).toFixed(0)}%, 0.95)`;
        }
      });
    }

    const proj = worldPos.clone().project(camera);
    const screenX = (proj.x + 1) / 2 * window.innerWidth;
    const screenY = (-proj.y + 1) / 2 * window.innerHeight;
    const offsetY = 20;
    followPanel.style.left = `${Math.round(screenX - followPanel.clientWidth / 2)}px`;
    followPanel.style.top = `${Math.round(screenY + offsetY)}px`;

    // Depth-based visibility: panel fades and goes behind when planet is behind sun (negative z)
    const panelZ = proj.z; // ranges from -1 (far) to 1 (near)
    
    // Camera distance-based visibility: minimize and disappear when zooming out
    const cameraDistance = camera.position.length();
    const minZoomDistance = 150; // distance where panel fully visible
    const maxZoomDistance = 400; // distance where panel starts to disappear
    
    let zoomOpacity = 1;
    let zoomScale = 1;
    
    if (cameraDistance > minZoomDistance) {
      // Gradually fade and shrink as camera zooms out
      const zoomFactor = (cameraDistance - minZoomDistance) / (maxZoomDistance - minZoomDistance);
      zoomOpacity = Math.max(0, 1 - zoomFactor); // 1 at minZoom, 0 at maxZoom
      zoomScale = Math.max(0.3, 1 - zoomFactor * 0.7); // scales from 1 to 0.3
    }
    
    // When planet is behind (panelZ < -0.3), reduce opacity and add blur effect
    let depthOpacity = 1;
    let depthBlur = 0;
    let depthScale = 1;
    
    if (panelZ < -0.3) {
      // Behind sun: gradually fade out
      depthOpacity = Math.max(0.15, 1 + panelZ * 1.5); // scales from ~0.15 to 1
      depthBlur = Math.min(10, (-panelZ) * 20);
      depthScale = 0.9;
    }
    
    // Combine zoom and depth effects
    const finalOpacity = zoomOpacity * depthOpacity;
    const finalScale = zoomScale * depthScale;
    
    followPanel.style.opacity = finalOpacity.toFixed(2);
    followPanel.style.filter = `blur(${depthBlur.toFixed(1)}px)`;
    followPanel.style.transform = `scale(${finalScale})`;
    followPanel.style.pointerEvents = finalOpacity < 0.1 ? 'none' : 'auto';
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

  // Double-click handler to hide follow panel
  function onDocumentDoubleClick(event) {
    event.preventDefault();
    hideFollowPanel();
    // Also restore orbit highlighting
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
    selectedPlanet = null;
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
        // play audio for the planet if available
        playPlanetAudio(planet.name);
      }
    }
  }

  // Expose helper used by main animate loop
  function updateOnFrame() {
    // Check for planetary alignment and update visualization
    const alignedPlanets = checkPlanetaryAlignment();
    if (alignedPlanets) {
      updateAlignmentVisualization(alignedPlanets);
      updateAlignmentLabels();
    } else if (alignmentLine) {
      // Remove alignment line if no alignment detected
      scene.remove(alignmentLine);
      alignmentLine = null;
      alignmentDistanceLabels.forEach(label => {
        if (label.element && label.element.parentNode) {
          label.element.parentNode.removeChild(label.element);
        }
      });
      alignmentDistanceLabels = [];
    }

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
  window.addEventListener('dblclick', onDocumentDoubleClick, false);

  // expose functions required by main loop
  return {
    updateOnFrame,
    setupGestureControls,
    closeInfo
  };
}
 