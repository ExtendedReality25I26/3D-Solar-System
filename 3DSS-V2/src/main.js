import * as THREE from 'three';
import { initSetup } from './setup.js';
import { createPlanets } from './planets.js';
import { initInteractions } from './interactions.js';

(async function main() {
  // 1. Setup
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

  // Horloge pour le temps unifié
  const clock = new THREE.Clock();

  // 2. Création des planètes
  const planetsObj = createPlanets(scene, loadTexture, settings, gui);

  // 3. Configuration GUI (Temps Scientifique)
  if (gui) {
    // Contrôle de l'échelle de temps (Jours par seconde)
    gui.add(settings, 'timeScale', 0, 150, 0.1)
       .name('Jours / Sec')
       .listen(); // Met à jour l'UI si on change la valeur par code

    gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
      if (planetsObj.sunMat) planetsObj.sunMat.emissiveIntensity = value;
    });
  }

  // 4. Initialisation des interactions
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

  interactions.setupGestureControls();

  // 5. Chargement des modèles externes (Lunes de Mars)
  if (planetsObj.marsMoons) {
    planetsObj.marsMoons.forEach(moon => {
      if (moon.modelPath) {
        planetsObj.loadObject(moon.modelPath, moon.position || 10, moon.scale, function (loadedModel) {
          moon.mesh = loadedModel;
          // On ajoute au système planétaire de Mars pour qu'elles suivent la planète
          if (planetsObj.planets.mars && planetsObj.planets.mars.planetSystem) {
            planetsObj.planets.mars.planetSystem.add(moon.mesh);
            
            // Ombres
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

  // 6. Chargement des astéroïdes
  planetsObj.loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 180);
  planetsObj.loadAsteroids('/asteroids/asteroidPack.glb', 3000, 560, 620);

  // 7. Gestion des ombres (Shadows)
  try {
    Object.values(planetsObj.planets).forEach(p => {
      if (p && p.planet) {
        p.planet.castShadow = true;
        p.planet.receiveShadow = true;
      }
      if (p && p.Atmosphere) {
        p.Atmosphere.castShadow = true;
        p.Atmosphere.receiveShadow = true;
      }
      if (p && p.Ring) {
        p.Ring.receiveShadow = true;
      }
    });
  } catch (e) {
    console.warn('Shadow assignment warning:', e);
  }

  // ====================================================
  // BOUCLE D'ANIMATION UNIFIÉE (SCIENTIFIQUE)
  // ====================================================
  function animate() {
    // A. Calcul du temps écoulé
    const dt = clock.getDelta();
    const simulatedDays = dt * settings.timeScale;

    // B. Rotation du Soleil (Période ~27 jours)
    if (planetsObj.sun) {
      // Si config dispo, sinon valeur par défaut
      const period = planetsObj.sun.config?.physical?.rotationPeriod || 27;
      planetsObj.sun.rotateY((simulatedDays / period) * 2 * Math.PI);
    }

    // C. Animation des Planètes (Rotation + Orbite Kepler)
    const planets = planetsObj.planets;
    Object.values(planets).forEach(planetObj => {
      if (!planetObj || !planetObj.planet) return;

      const planet = planetObj.planet;
      const animData = planet.animationData;
      const config = planetObj.config ? planetObj.config.physical : null;

      if (animData && config) {
        // 1. Rotation sur elle-même (Jour/Nuit)
        if (config.rotationPeriod && config.rotationPeriod !== 0) {
           planet.rotateY((simulatedDays / config.rotationPeriod) * 2 * Math.PI);
        }

        // 2. Orbite autour du Soleil (Année)
        if (config.orbitPeriod && config.orbitPeriod > 0) {
          // Mise à jour de l'angle orbital
          animData.angle += (simulatedDays / config.orbitPeriod) * 2 * Math.PI;
          
          // Calcul Kepler (Ellipse)
          const x = animData.a * Math.cos(animData.angle) - animData.c;
          const z = animData.b * Math.sin(animData.angle);
          
          // Déplacement du conteneur 3D de la planète
          planetObj.planet3d.position.set(x, 0, z);
        }

        // 3. Atmosphère (rotation légèrement différente pour effet visuel)
        if (planetObj.Atmosphere) {
           const atmosSpeed = config.rotationPeriod ? config.rotationPeriod * 1.1 : 100;
           planetObj.Atmosphere.rotateY((simulatedDays / atmosSpeed) * 2 * Math.PI);
        }
      }
    });

    // D. Animation des Lunes (Générique)
    const updateMoon = (moon) => {
      // On supporte soit moon.mesh (créé dans planets.js) soit moon.mesh (chargé via GLTF)
      const mesh = moon.mesh;
      if (!mesh) return;

      // Initialisation angle si manquant
      if (typeof moon.angle === 'undefined') moon.angle = Math.random() * Math.PI * 2;
      
      // Période orbitale (défaut 27 jours)
      const period = moon.orbitPeriod || 27;
      
      // Avancement orbital
      moon.angle += (simulatedDays / period) * 2 * Math.PI;
      
      // Position circulaire relative à la planète mère
      // (Les lunes sont dans le groupe planetSystem, donc coordonnées locales)
      const x = moon.orbitRadius * Math.cos(moon.angle);
      const z = moon.orbitRadius * Math.sin(moon.angle);
      
      mesh.position.set(x, 0, z);
      
      // Rotation de la lune sur elle-même (Verrouillage gravitationnel simulé)
      mesh.rotateY((simulatedDays / period) * 2 * Math.PI);
    };

    // Appliquer aux lunes de la Terre
    if (planets.earth && planets.earth.moons) {
      planets.earth.moons.forEach(updateMoon);
    }
    // Appliquer aux lunes de Mars
    if (planetsObj.marsMoons) {
      planetsObj.marsMoons.forEach(updateMoon);
    }
    // Appliquer aux lunes de Jupiter
    if (planetsObj.jupiterMoons) {
      planetsObj.jupiterMoons.forEach(updateMoon);
    }

    // E. Astéroïdes (Rotation simple de fond)
    if (planetsObj.asteroids) {
      planetsObj.asteroids.forEach(asteroid => {
        // Rotation lente autour du soleil
        const orbitSpeed = 0.0001 * settings.timeScale; 
        const x = asteroid.position.x;
        const z = asteroid.position.z;
        
        // Rotation vectorielle 2D
        asteroid.position.x = x * Math.cos(orbitSpeed) - z * Math.sin(orbitSpeed);
        asteroid.position.z = x * Math.sin(orbitSpeed) + z * Math.cos(orbitSpeed);
        
        // Rotation sur eux-mêmes
        asteroid.rotation.y += 0.01 * settings.timeScale;
      });
    }

    // F. Mises à jour finales
    interactions.updateOnFrame();
    controls.update();
    composer.render();

    requestAnimationFrame(animate);
  }

  animate();
})();