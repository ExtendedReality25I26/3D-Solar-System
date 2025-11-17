import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// textures & maps used by planets + sun + moons
import sunTexture from '/public/images/sun.jpg';
import mercuryTexture from '/public/images/mercurymap.jpg';
import mercuryBump from '/public/images/mercurybump.jpg';
import venusTexture from '/public/images/venusmap.jpg';
import venusBump from '/public/images/venusmap.jpg';
import venusAtmosphere from '/public/images/venus_atmosphere.jpg';
import earthTexture from '/public/images/earth_daymap.jpg';
import earthNightTexture from '/public/images/earth_nightmap.jpg';
import earthAtmosphere from '/public/images/earth_atmosphere.jpg';
import earthMoonTexture from '/public/images/moonmap.jpg';
import earthMoonBump from '/public/images/moonbump.jpg';
import marsTexture from '/public/images/marsmap.jpg';
import marsBump from '/public/images/marsbump.jpg';
import jupiterTexture from '/public/images/jupiter.jpg';
import ioTexture from '/public/images/jupiterIo.jpg';
import europaTexture from '/public/images/jupiterEuropa.jpg';
import ganymedeTexture from '/public/images/jupiterGanymede.jpg';
import callistoTexture from '/public/images/jupiterCallisto.jpg';
import saturnTexture from '/public/images/saturnmap.jpg';
import satRingTexture from '/public/images/saturn_ring.png';
import uranusTexture from '/public/images/uranus.jpg';
import uraRingTexture from '/public/images/uranus_ring.png';
import neptuneTexture from '/public/images/neptune.jpg';
import plutoTexture from '/public/images/plutomap.jpg';

export function createPlanets(scene, loadTexture, settings, gui) {
  // Helper: createPlanet (mostly copied from original, adapted to closure)
  function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons) {
    let material;
    if (texture instanceof THREE.Material) {
      material = texture;
    } else if (bump) {
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(texture),
        bumpMap: loadTexture.load(bump),
        bumpScale: 0.7
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(texture)
      });
    }

    const name = planetName;
    const geometry = new THREE.SphereGeometry(size, 32, 20);
    const planet = new THREE.Mesh(geometry, material);
    const planet3d = new THREE.Object3D();
    const planetSystem = new THREE.Group();
    planetSystem.add(planet);
    let Atmosphere;
    let Ring;
    planet.position.x = position;
    planet.rotation.z = tilt * Math.PI / 180;

    // orbit path
    const orbitPath = new THREE.EllipseCurve(
      0, 0,
      position, position,
      0, 2 * Math.PI,
      false,
      0
    );
    const pathPoints = orbitPath.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 });
    const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    planetSystem.add(orbit);

    // rings
    if (ring) {
      const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 30);
      const RingMat = new THREE.MeshStandardMaterial({
        map: loadTexture.load(ring.texture),
        side: THREE.DoubleSide
      });
      Ring = new THREE.Mesh(RingGeo, RingMat);
      planetSystem.add(Ring);
      Ring.position.x = position;
      Ring.rotation.x = -0.5 * Math.PI;
      Ring.rotation.y = -tilt * Math.PI / 180;
    }

    // atmosphere
    if (atmosphere) {
      const atmosphereGeom = new THREE.SphereGeometry(size + 0.1, 32, 20);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: loadTexture.load(atmosphere),
        transparent: true,
        opacity: 0.4,
        depthTest: true,
        depthWrite: false
      });
      Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
      Atmosphere.rotation.z = 0.41;
      planet.add(Atmosphere);
    }

    // moons: add simple mesh moons or preloaded models attached externally
    if (moons) {
      moons.forEach(moon => {
        let moonMaterial;
        if (moon.bump) {
          moonMaterial = new THREE.MeshStandardMaterial({
            map: loadTexture.load(moon.texture),
            bumpMap: loadTexture.load(moon.bump),
            bumpScale: 0.5
          });
        } else {
          moonMaterial = new THREE.MeshStandardMaterial({
            map: loadTexture.load(moon.texture)
          });
        }
        const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        const moonOrbitDistance = size * 1.5;
        moonMesh.position.set(moonOrbitDistance, 0, 0);
        planetSystem.add(moonMesh);
        moon.mesh = moonMesh;
      });
    }

    planet3d.add(planetSystem);
    scene.add(planet3d);
    return { name, planet, planet3d, Atmosphere, moons, planetSystem, Ring };
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
