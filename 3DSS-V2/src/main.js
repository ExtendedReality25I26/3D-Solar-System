// main.js
import { initSetup } from './setup.js';
import { createPlanets } from './planets.js';
import { initInteractions } from './interactions.js';

(async function main() {
  // Setup
  const {
    scene,
    camera,
    renderer,
    controls,
    composer,
    outlinePass,
    loadTexture,
    settings,
    gui,
    raycaster,
    mouse
  } = initSetup();

  // Create planets & objects
  const planetsObj = createPlanets(scene, loadTexture, settings, gui);

  // Configure GUI controllers (link sunIntensity to sunMat later)
  if (gui) {
    gui.add(settings, 'accelerationOrbit', 0, 10).onChange(() => {});
    gui.add(settings, 'acceleration', 0, 10).onChange(() => {});
    gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
      if (planetsObj.sunMat) planetsObj.sunMat.emissiveIntensity = value;
    });
  }

  // Initialize interactions
  const interactions = initInteractions({
    camera,
    controls,
    raycaster,
    mouse,
    gui,
    settings,
    scene,
    outlinePass,
    planetsObj
  });

  // Start gesture controls (if mediapipe available)
  interactions.setupGestureControls();

  // Load external models (Mars moons) if any
  if (planetsObj.marsMoons) {
    planetsObj.marsMoons.forEach(moon => {
      if (moon.modelPath) {
        planetsObj.loadObject(moon.modelPath, moon.position, moon.scale, function (loadedModel) {
          moon.mesh = loadedModel;
          if (planetsObj.planets.mars && planetsObj.planets.mars.planetSystem) {
            planetsObj.planets.mars.planetSystem.add(moon.mesh);
            moon.mesh.traverse(child => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }
        });
      }
    });
  }

  // Load asteroids (two belts as in original)
  planetsObj.loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
  planetsObj.loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);

  // Physical data for realistic rotation/orbit speeds
  const earthSpinBase = 0.005;  // base spin speed for Earth (visual tuning)
  const earthOrbitBase = 0.001; // base orbit speed for Earth (visual tuning)

  const physical = {
    mercury:  { rotH: 1407.6,  orbD: 87.969 },
    venus:    { rotH: -5832.5, orbD: 224.701 },
    earth:    { rotH: 23.934,  orbD: 365.256 },
    mars:     { rotH: 24.623,  orbD: 686.98 },
    jupiter:  { rotH: 9.925,   orbD: 4332.59 },
    saturn:   { rotH: 10.656,  orbD: 10759 },
    uranus:   { rotH: -17.24,  orbD: 30687 },
    neptune:  { rotH: 16.11,   orbD: 60190 },
    pluto:    { rotH: -153.29, orbD: 90560 }
  };

  function spinSpeed(name) {
    const earthRot = physical.earth.rotH;
    const rot = physical[name].rotH;
    const ratio = earthRot / Math.abs(rot);
    const sign = rot < 0 ? -1 : 1; // retrograde rotation
    return earthSpinBase * ratio * sign * settings.acceleration;
  }

  function orbitSpeed(name) {
    const earthOrb = physical.earth.orbD;
    const orb = physical[name].orbD;
    const ratio = earthOrb / orb;
    return earthOrbitBase * ratio * settings.accelerationOrbit;
  }

  // shadow properties (some basic assignment - adapt to what's present)
  try {
    if (planetsObj.planets.earth.planet) {
      planetsObj.planets.earth.planet.castShadow = true;
      planetsObj.planets.earth.planet.receiveShadow = true;
    }
    if (planetsObj.planets.earth.Atmosphere) {
      planetsObj.planets.earth.Atmosphere.castShadow = true;
      planetsObj.planets.earth.Atmosphere.receiveShadow = true;
    }
    // assign shadows for moons and other planets if created
    Object.values(planetsObj.planets).forEach(p => {
      if (p && p.planet) {
        p.planet.castShadow = true;
        p.planet.receiveShadow = true;
      }
      if (p && p.Ring) {
        p.Ring.receiveShadow = true;
      }
    });
  } catch (e) {
    console.warn('Shadow assignment skipped for some objects:', e);
  }

  // animation loop: uses settings & planetsObj with scientifically accurate speeds
  function animate() {
    // rotating planets around the sun and itself
    if (planetsObj.sun) planetsObj.sun.rotateY(0.001 * settings.acceleration);

    const p = planetsObj.planets;
    if (p.mercury) {
      p.mercury.planet.rotateY(spinSpeed('mercury'));
      if (p.mercury.planet3d) p.mercury.planet3d.rotateY(orbitSpeed('mercury'));
    }
    if (p.venus) {
      p.venus.planet.rotateY(spinSpeed('venus'));
      if (p.venus.Atmosphere) p.venus.Atmosphere.rotateY(spinSpeed('venus'));
      if (p.venus.planet3d) p.venus.planet3d.rotateY(orbitSpeed('venus'));
    }
    if (p.earth) {
      p.earth.planet.rotateY(spinSpeed('earth'));
      if (p.earth.Atmosphere) p.earth.Atmosphere.rotateY(spinSpeed('earth') * 0.2);
      if (p.earth.planet3d) p.earth.planet3d.rotateY(orbitSpeed('earth'));
    }
    if (p.mars) {
      p.mars.planet.rotateY(spinSpeed('mars'));
      if (p.mars.planet3d) p.mars.planet3d.rotateY(orbitSpeed('mars'));
    }
    if (p.jupiter) {
      p.jupiter.planet.rotateY(spinSpeed('jupiter'));
      if (p.jupiter.planet3d) p.jupiter.planet3d.rotateY(orbitSpeed('jupiter'));
    }
    if (p.saturn) {
      p.saturn.planet.rotateY(spinSpeed('saturn'));
      if (p.saturn.planet3d) p.saturn.planet3d.rotateY(orbitSpeed('saturn'));
    }
    if (p.uranus) {
      p.uranus.planet.rotateY(spinSpeed('uranus'));
      if (p.uranus.planet3d) p.uranus.planet3d.rotateY(orbitSpeed('uranus'));
    }
    if (p.neptune) {
      p.neptune.planet.rotateY(spinSpeed('neptune'));
      if (p.neptune.planet3d) p.neptune.planet3d.rotateY(orbitSpeed('neptune'));
    }
    if (p.pluto) {
      p.pluto.planet.rotateY(spinSpeed('pluto'));
      if (p.pluto.planet3d) p.pluto.planet3d.rotateY(orbitSpeed('pluto'));
    }

    // Animate Earth's moon(s)
    if (p.earth && p.earth.moons) {
      p.earth.moons.forEach(moon => {
        const time = performance.now();
        const tiltAngle = 5 * Math.PI / 180;
        const moonX = p.earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
        const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
        const moonZ = p.earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);
        if (moon.mesh) {
          moon.mesh.position.set(moonX, moonY, moonZ);
          moon.mesh.rotateY(0.01);
        }
      });
    }

    // Mars' moons (GLTF loaded)
    if (planetsObj.marsMoons) {
      planetsObj.marsMoons.forEach(moon => {
        if (moon.mesh) {
          const time = performance.now();
          const moonX = p.mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
          const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          const moonZ = p.mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          moon.mesh.position.set(moonX, moonY, moonZ);
          moon.mesh.rotateY(0.001);
        }
      });
    }

    // Jupiter's moons
    if (planetsObj.jupiterMoons) {
      planetsObj.jupiterMoons.forEach(moon => {
        if (moon.mesh) {
          const time = performance.now();
          const moonX = p.jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
          const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          const moonZ = p.jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          moon.mesh.position.set(moonX, moonY, moonZ);
          moon.mesh.rotateY(0.01);
        }
      });
    }

    // Animate asteroids (if any)
    if (planetsObj.asteroids) {
      planetsObj.asteroids.forEach(asteroid => {
        asteroid.rotation.y += 0.0001;
        const cos = Math.cos(0.0001 * settings.accelerationOrbit);
        const sin = Math.sin(0.0001 * settings.accelerationOrbit);
        const x = asteroid.position.x;
        const z = asteroid.position.z;
        asteroid.position.x = x * cos + z * sin;
        asteroid.position.z = z * cos - x * sin;
      });
    }

    // interactions per-frame updates (outlines, zooms, selection)
    interactions.updateOnFrame();

    // update controls and render
    controls.update();
    composer.render();

    requestAnimationFrame(animate);
  }

  animate();
})();
