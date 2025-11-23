import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { planetsConfig } from './data/planetsConfig.js';

export function createPlanets(scene, loadTexture, settings, gui) {
  
  // Helper: Création d'une planète
  function createPlanet(name, config) {
    const { physical, assets, moons: moonConfigs } = config;
    let material;

    // --- 1. Gestion des Matériaux ---
    if (name === 'Earth' && assets.customShader) {
      // Shader Terre (Jour/Nuit)
      material = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: loadTexture.load(assets.map) },
          nightTexture: { value: loadTexture.load(assets.nightMap) },
          sunPosition: { value: new THREE.Vector3(0, 0, 0) }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vSunDirection;
          uniform vec3 sunPosition;
          void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
            vSunDirection = normalize(sunPosition - worldPosition.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vSunDirection;
          void main() {
            float intensity = max(dot(vNormal, vSunDirection), 0.0);
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv) * 0.2;
            gl_FragColor = mix(nightColor, dayColor, intensity);
          }
        `
      });
    } else if (name === 'Sun' && assets.emissive) {
      // Soleil
      material = new THREE.MeshStandardMaterial({
        emissive: assets.emissiveColor,
        emissiveMap: loadTexture.load(assets.map),
        emissiveIntensity: assets.emissiveIntensity
      });
    } else if (assets.bump) {
      // Avec Bump Map
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map),
        bumpMap: loadTexture.load(assets.bump),
        bumpScale: 0.7
      });
    } else {
      // Standard
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map)
      });
    }

    // --- 2. Géométrie et Mesh ---
    const geometry = new THREE.SphereGeometry(physical.radius, 32, 20);
    const planet = new THREE.Mesh(geometry, material);
    const planet3d = new THREE.Object3D(); // Conteneur pour position orbitale
    const planetSystem = new THREE.Group(); // Conteneur pour inclinaison et lunes

    // --- 3. Calculs de Kepler (Orbites Elliptiques) ---
    let ellipticalData = {};
    if (name !== 'Sun') {
      const a = physical.distance; // Demi-grand axe
      const e = physical.eccentricity || 0; // Excentricité
      const b = a * Math.sqrt(1 - e * e); // Demi-petit axe
      const c = a * e; // Distance focale
      
      ellipticalData = { a, b, c, eccentricity: e };
      
      // Position initiale (sera mise à jour par main.js)
      planet.position.set(0, 0, 0);
      
      // Inclinaison de la planète (Axial Tilt)
      planet.rotation.z = (physical.tilt || 0) * Math.PI / 180;

      // --- 4. Dessin de l'orbite (Visuel) ---
      const ellipsePoints = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = a * Math.cos(theta) - c;
        const z = b * Math.sin(theta);
        ellipsePoints.push(new THREE.Vector3(x, 0, z));
      }
      
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.15 
      });
      const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      // orbit.rotation.x = Math.PI / 2; // SUPPRIMER CETTE LIGNE
      orbit.rotation.x = Math.PI / 2; // Garde-la uniquement si tu veux que l'orbite soit verticale, mais ici on veut du plat :
      orbit.rotation.x = 0; // OU mets simplement 0
      scene.add(orbit);
    } else {
      planet.position.set(0, 0, 0);
    }

    // Stockage des données pour l'animation
    planet.animationData = {
      angle: Math.random() * Math.PI * 2, // Angle de départ aléatoire
      ...ellipticalData
    };

    planetSystem.add(planet);

    // --- 5. Anneaux ---
    let Ring;
    if (assets.hasRings) {
      const ringData = assets.rings;
      const RingGeo = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, 64);
      const RingMat = new THREE.MeshStandardMaterial({
        map: loadTexture.load(ringData.texture),
        side: THREE.DoubleSide,
        transparent: true
      });
      Ring = new THREE.Mesh(RingGeo, RingMat);
      Ring.rotation.x = -0.5 * Math.PI;
      Ring.rotation.y = -(physical.tilt || 0) * Math.PI / 180;
      planetSystem.add(Ring);
    }

    // --- 6. Atmosphère ---
    let Atmosphere;
    if (assets.atmosphere) {
      const atmosphereGeom = new THREE.SphereGeometry(physical.radius + 0.15, 32, 20);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.atmosphere),
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
      Atmosphere.rotation.z = (physical.tilt || 0) * Math.PI / 180;
      planet.add(Atmosphere); // Attaché à la planète
    }

    // --- 7. Lunes ---
    let moons = [];
    if (moonConfigs) {
      moons = moonConfigs.map(moonConfig => {
        // On prépare l'objet lune
        const moonObj = { 
          ...moonConfig, 
          angle: Math.random() * Math.PI * 2,
          mesh: null 
        };

        if (moonConfig.modelPath) {
          // Modèle GLTF (chargement asynchrone géré dans main ou ici via callback)
          // Pour l'instant on retourne la config, le mesh sera injecté via loadObject plus tard
          // ou on laisse main.js gérer le chargement GLTF spécifique.
        } else {
          // Lune Mesh Standard
          const moonMaterial = moonConfig.bump 
            ? new THREE.MeshStandardMaterial({
                map: loadTexture.load(moonConfig.texture),
                bumpMap: loadTexture.load(moonConfig.bump),
                bumpScale: 0.5
              })
            : new THREE.MeshStandardMaterial({
                map: loadTexture.load(moonConfig.texture)
              });
          
          const moonGeometry = new THREE.SphereGeometry(moonConfig.size, 32, 20);
          const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
          
          // Position initiale relative
          moonMesh.position.set(moonConfig.orbitRadius, 0, 0);
          planetSystem.add(moonMesh);
          moonObj.mesh = moonMesh;
        }
        return moonObj;
      });
    }

    // --- 8. Lumière Soleil ---
    let pointLight = null;
    if (name === 'Sun' && config.light?.enabled) {
      pointLight = new THREE.PointLight(
        config.light.color,
        config.light.intensity,
        config.light.distance,
        config.light.decay
      );
      scene.add(pointLight);
    }

    planet3d.add(planetSystem);
    scene.add(planet3d);
    
    return { 
      name, 
      planet, 
      planet3d, 
      Atmosphere, 
      moons, 
      planetSystem, 
      Ring,
      pointLight,
      config // IMPORTANT: On passe toute la config pour main.js
    };
  }

  // --- Initialisation Globale ---
  const celestialBodies = {};
  const raycastTargets = [];
  
  Object.entries(planetsConfig).forEach(([name, config]) => {
    const body = createPlanet(name, config);
    
    if (name === 'Sun') {
      celestialBodies.sun = body.planet;
      celestialBodies.sunMat = body.planet.material;
      celestialBodies.pointLight = body.pointLight;
      // Le soleil a aussi besoin de sa config pour la rotation
      celestialBodies.sun.config = config; 
    } else {
      celestialBodies[name.toLowerCase()] = body;
      raycastTargets.push(body.planet);
      if (body.Atmosphere) raycastTargets.push(body.Atmosphere);
    }
  });

  // Références pour compatibilité
  celestialBodies.earthMaterial = celestialBodies.earth?.planet.material;

  // Données pour l'UI
  const planetData = {};
  Object.entries(planetsConfig).forEach(([name, config]) => {
    planetData[name] = config.info;
  });

  // Helpers externes
  function loadObject(path, positionX, scale, callback) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(positionX, 0, 0);
      obj.scale.set(scale, scale, scale);
      // On n'ajoute pas à la scène ici si c'est une lune, le callback gérera l'ajout au parent
      if (callback) callback(obj);
      else scene.add(obj);
    }, undefined, function (error) {
      console.error('Error loading GLTF:', error);
    });
  }

  const asteroids = [];
  function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          for (let i = 0; i < numberOfAsteroids / 12; i++) {
            const asteroid = child.clone();
            const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
            const angle = Math.random() * Math.PI * 2;
            const x = orbitRadius * Math.cos(angle);
            const z = orbitRadius * Math.sin(angle);
            
            asteroid.position.set(x, 0, z);
            asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
            asteroid.rotation.y = Math.random() * Math.PI;
            
            scene.add(asteroid);
            asteroids.push(asteroid);
          }
        }
      });
    }, undefined, console.error);
  }

  // Structure de retour unifiée
  const planets = {
    mercury: celestialBodies.mercury,
    venus: celestialBodies.venus,
    earth: celestialBodies.earth,
    mars: celestialBodies.mars,
    jupiter: celestialBodies.jupiter,
    saturn: celestialBodies.saturn,
    uranus: celestialBodies.uranus,
    neptune: celestialBodies.neptune,
    pluto: celestialBodies.pluto
  };

  // Extraction des lunes pour accès facile dans main.js
  const jupiterMoons = planets.jupiter?.moons || [];
  const marsMoons = planets.mars?.moons || [];

  return {
    sun: celestialBodies.sun,
    sunMat: celestialBodies.sunMat,
    pointLight: celestialBodies.pointLight,
    earthMaterial: celestialBodies.earthMaterial,
    planets,
    jupiterMoons,
    marsMoons,
    planetData,
    raycastTargets,
    loadObject,
    loadAsteroids,
    asteroids
  };
}