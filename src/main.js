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

  // animation loop: uses settings & planetsObj (keeps same math as original)
  function animate() {
    // rotating planets around the sun and itself
    if (planetsObj.sun) planetsObj.sun.rotateY(0.001 * settings.acceleration);

    const p = planetsObj.planets;
    if (p.mercury) {
      p.mercury.planet.rotateY(0.001 * settings.acceleration);
      if (p.mercury.planet3d) p.mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
    }
    if (p.venus) {
      p.venus.planet.rotateY(0.0005 * settings.acceleration);
      if (p.venus.Atmosphere) p.venus.Atmosphere.rotateY(0.0005 * settings.acceleration);
      if (p.venus.planet3d) p.venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
    }
    if (p.earth) {
      p.earth.planet.rotateY(0.005 * settings.acceleration);
      if (p.earth.Atmosphere) p.earth.Atmosphere.rotateY(0.001 * settings.acceleration);
      if (p.earth.planet3d) p.earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
    }
    if (p.mars) {
      p.mars.planet.rotateY(0.01 * settings.acceleration);
      if (p.mars.planet3d) p.mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
    }
    if (p.jupiter) {
      p.jupiter.planet.rotateY(0.005 * settings.acceleration);
      if (p.jupiter.planet3d) p.jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
    }
    if (p.saturn) {
      p.saturn.planet.rotateY(0.01 * settings.acceleration);
      if (p.saturn.planet3d) p.saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
    }
    if (p.uranus) {
      p.uranus.planet.rotateY(0.005 * settings.acceleration);
      if (p.uranus.planet3d) p.uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
    }
    if (p.neptune) {
      p.neptune.planet.rotateY(0.005 * settings.acceleration);
      if (p.neptune.planet3d) p.neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
    }
    if (p.pluto) {
      p.pluto.planet.rotateY(0.001 * settings.acceleration);
      if (p.pluto.planet3d) p.pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit);
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
