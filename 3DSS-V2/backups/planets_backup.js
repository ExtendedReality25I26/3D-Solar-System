import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { planetsConfig } from './data/planetsConfig.js';

export function createPlanets(scene, loadTexture, settings, gui) {
  // Helper: createPlanet (refactorisé pour utiliser la config)
  function createPlanet(name, config) {
    const { physical, assets, moons: moonConfigs } = config;
    let material;

    // Gestion des cas spéciaux de matériaux
    if (name === 'Earth' && assets.customShader) {
      // Shader spécial pour la Terre (jour/nuit)
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
      // Matériau émissif pour le Soleil
      material = new THREE.MeshStandardMaterial({
        emissive: assets.emissiveColor,
        emissiveMap: loadTexture.load(assets.map),
        emissiveIntensity: assets.emissiveIntensity
      });
    } else if (assets.bump) {
      // Matériau avec bump map
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map),
        bumpMap: loadTexture.load(assets.bump),
        bumpScale: 0.7
      });
    } else {
      // Matériau standard
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map)
      });
    }

    const geometry = new THREE.SphereGeometry(physical.radius, 32, 20);
    const planet = new THREE.Mesh(geometry, material);
    const planet3d = new THREE.Object3D();
    const planetSystem = new THREE.Group();

    // Attachement des données d'animation à l'objet pour usage ultérieur
    planet.animationData = {
      rotationSpeed: config.animation.rotationSpeed,
      orbitSpeed: config.animation.orbitSpeed,
      atmosphereRotationSpeed: config.animation.atmosphereRotationSpeed
    };

    planetSystem.add(planet);
    
    let Atmosphere, Ring;

    // Cas spécial du Soleil (pas d'orbite)
    if (name !== 'Sun') {
      planet.position.x = physical.distance;
      planet.rotation.z = physical.tilt * Math.PI / 180;

      // Orbite visuelle
      const orbitPath = new THREE.EllipseCurve(
        0, 0, physical.distance, physical.distance,
        0, 2 * Math.PI, false, 0
      );
      const pathPoints = orbitPath.getPoints(100);
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, transparent: true, opacity: 0.03 
      });
      const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      planetSystem.add(orbit);
    }

    // Anneaux (Saturne/Uranus)
    if (assets.hasRings) {
      const ringData = assets.rings;
      const RingGeo = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, 30);
      const RingMat = new THREE.MeshStandardMaterial({
        map: loadTexture.load(ringData.texture),
        side: THREE.DoubleSide
      });
      Ring = new THREE.Mesh(RingGeo, RingMat);
      Ring.position.x = physical.distance;
      Ring.rotation.x = -0.5 * Math.PI;
      Ring.rotation.y = -physical.tilt * Math.PI / 180;
      planetSystem.add(Ring);
    }

    // Atmosphère
    if (assets.atmosphere) {
      const atmosphereGeom = new THREE.SphereGeometry(physical.radius + 0.1, 32, 20);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.atmosphere),
        transparent: true,
        opacity: 0.4,
        depthTest: true,
        depthWrite: false
      });
      Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
      Atmosphere.rotation.z = 0.41;
      
      // Attachement des données d'animation pour l'atmosphère
      if (config.animation.atmosphereRotationSpeed) {
        Atmosphere.animationData = {
          rotationSpeed: config.animation.atmosphereRotationSpeed
        };
      }
      
      planet.add(Atmosphere);
    }

    // Lunes (configuration simple ou modèles GLTF)
    let moons = null;
    if (moonConfigs) {
      moons = moonConfigs.map(moonConfig => {
        if (moonConfig.modelPath) {
          // Lune GLTF (Mars)
          return { ...moonConfig, mesh: null };
        } else {
          // Lune simple (Terre, Jupiter)
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
          const moonOrbitDistance = physical.radius * 1.5;
          moonMesh.position.set(moonOrbitDistance, 0, 0);
          planetSystem.add(moonMesh);
          
          return { ...moonConfig, mesh: moonMesh };
        }
      });
    }

    // Lumière pour le Soleil
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
      config // Référence vers la configuration complète
    };
  }

  // SUN
  let sunMat;
  const sunSize = 697 / 40;
  const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
  sunMat = new THREE.MeshStandardMaterial({
    emissive: 0xFFF88F,
    emissiveMap: loadTexture.load(sunTexture),
    emissiveIntensity: settings.sunIntensity
  });
  const sun = new THREE.Mesh(sunGeom, sunMat);
  scene.add(sun);

  // point light in the sun
  const pointLight = new THREE.PointLight(0xFDFFD3, 1200, 400, 1.4);
  scene.add(pointLight);

  // Earth shader material (day/night)
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: loadTexture.load(earthTexture) },
      nightTexture: { value: loadTexture.load(earthNightTexture) },
      sunPosition: { value: sun.position }
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

  // moons definitions
  const earthMoon = [{
    size: 1.6,
    texture: earthMoonTexture,
    bump: earthMoonBump,
    orbitSpeed: 0.001 * settings.accelerationOrbit,
    orbitRadius: 10
  }];

  const marsMoons = [
    {
      modelPath: '/images/mars/phobos.glb',
      scale: 0.1,
      orbitRadius: 5,
      orbitSpeed: 0.002 * settings.accelerationOrbit,
      position: 100,
      mesh: null
    },
    {
      modelPath: '/images/mars/deimos.glb',
      scale: 0.1,
      orbitRadius: 9,
      orbitSpeed: 0.0005 * settings.accelerationOrbit,
      position: 120,
      mesh: null
    }
  ];

  const jupiterMoons = [
    { size: 1.6, texture: ioTexture, orbitRadius: 20, orbitSpeed: 0.0005 * settings.accelerationOrbit },
    { size: 1.4, texture: europaTexture, orbitRadius: 24, orbitSpeed: 0.00025 * settings.accelerationOrbit },
    { size: 2,   texture: ganymedeTexture, orbitRadius: 28, orbitSpeed: 0.000125 * settings.accelerationOrbit },
    { size: 1.7, texture: callistoTexture, orbitRadius: 32, orbitSpeed: 0.00006 * settings.accelerationOrbit }
  ];

  // Create planets
  const mercury = createPlanet('Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
  const venus = createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
  const earth = createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
  const mars = createPlanet('Mars', 3.4, 115, 25, marsTexture, marsBump);
  const jupiter = createPlanet('Jupiter', 69 / 4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
  const saturn = createPlanet('Saturn', 58 / 4, 270, 26, saturnTexture, null, {
    innerRadius: 18,
    outerRadius: 29,
    texture: satRingTexture
  });
  const uranus = createPlanet('Uranus', 25 / 4, 320, 82, uranusTexture, null, {
    innerRadius: 6,
    outerRadius: 8,
    texture: uraRingTexture
  });
  const neptune = createPlanet('Neptune', 24 / 4, 340, 28, neptuneTexture);
  const pluto = createPlanet('Pluto', 1, 350, 57, plutoTexture);

  // planetData (copied)
  const planetData = {
    'Mercury': { radius: '2,439.7 km', tilt: '0.034°', rotation: '58.6 Earth days', orbit: '88 Earth days', distance: '57.9 million km', moons: '0', info: 'The smallest planet...' },
    'Venus':   { radius: '6,051.8 km', tilt: '177.4°', rotation: '243 Earth days', orbit: '225 Earth days', distance: '108.2 million km', moons: '0', info: 'Second planet...' },
    'Earth':   { radius: '6,371 km', tilt: '23.5°', rotation: '24 hours', orbit: '365 days', distance: '150 million km', moons: '1 (Moon)', info: 'Third planet...' },
    'Mars':    { radius: '3,389.5 km', tilt: '25.19°', rotation: '1.03 Earth days', orbit: '687 Earth days', distance: '227.9 million km', moons: '2 (Phobos and Deimos)', info: 'Known as the Red Planet...' },
    'Jupiter': { radius: '69,911 km', tilt: '3.13°', rotation: '9.9 hours', orbit: '12 Earth years', distance: '778.5 million km', moons: '95 known moons', info: 'The largest planet...' },
    'Saturn':  { radius: '58,232 km', tilt: '26.73°', rotation: '10.7 hours', orbit: '29.5 Earth years', distance: '1.4 billion km', moons: '146 known moons', info: 'Distinguished by its rings...' },
    'Uranus':  { radius: '25,362 km', tilt: '97.77°', rotation: '17.2 hours', orbit: '84 Earth years', distance: '2.9 billion km', moons: '27 known moons', info: 'Unique sideways rotation.' },
    'Neptune': { radius: '24,622 km', tilt: '28.32°', rotation: '16.1 hours', orbit: '165 Earth years', distance: '4.5 billion km', moons: '14 known moons', info: 'Most distant planet...' },
    'Pluto':   { radius: '1,188.3 km', tilt: '122.53°', rotation: '6.4 Earth days', orbit: '248 Earth years', distance: '5.9 billion km', moons: '5', info: 'Dwarf planet...' }
  };

  // Raycast targets array
  const raycastTargets = [
    mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere,
    mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
  ];

  // GLTF loader helper for models (asteroids & Mars moons)
  function loadObject(path, positionX, scale, callback) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(positionX, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) callback(obj);
    }, undefined, function (error) {
      console.error('An error happened', error);
    });
  }

  // Asteroids loader (uses GLTF pack)
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
            const y = 0;
            const z = orbitRadius * Math.sin(angle);
            child.receiveShadow = true;
            asteroid.position.set(x, y, z);
            asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
            scene.add(asteroid);
            asteroids.push(asteroid);
          }
        }
      });
    }, undefined, function (error) {
      console.error('An error happened', error);
    });
  }

  // Expose everything needed by interactions & animate loop
  return {
    sun,
    sunMat,
    pointLight,
    earthMaterial,
    planets: { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto },
    jupiterMoons,
    marsMoons,
    planetData,
    raycastTargets,
    loadObject,
    loadAsteroids,
    asteroids
  };
}
