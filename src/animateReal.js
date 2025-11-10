// Real planetary animation with elliptical orbits
import {
  sun, mercury, venus, earth, mars,
  jupiter, saturn, uranus, neptune, pluto,
  settings, raycastTargets, realOrbitController
} from './planets/planets.js';

import { animateMoons } from './moons/animateMoons.js';
import { animateAsteroids } from './Loadasteroids/loadAsteroids.js';
import { updateRaycaster, outlineSelection } from './interaction/raycasting.js';
import { updateCameraMovement } from './interaction/planetSelection.js';

// Real rotation speeds (relative to Earth = 1)
const realRotationSpeeds = {
  sun: 0.004,      // ~25 Earth days rotation
  mercury: 0.017,  // 58.6 Earth days rotation
  venus: -0.004,   // 243 Earth days rotation (retrograde)
  earth: 1.0,      // 24 hours (reference)
  mars: 0.97,      // 24.6 hours
  jupiter: 2.4,    // 9.9 hours
  saturn: 2.3,     // 10.7 hours
  uranus: 1.4,     // 17.2 hours
  neptune: 1.5,    // 16.1 hours
  pluto: 0.16      // 6.4 Earth days
};

let lastTime = 0;

export default function animateReal(camera, controls, composer, outlinePass) {
  function loop(currentTime) {
    // Calculate delta time in seconds
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Convert to appropriate scale for animation (1 second = 1 Earth day in simulation)
    const scaledDeltaTime = deltaTime * 0.001;

    // Rotate planets on their axes with real speeds
    sun.rotateY(realRotationSpeeds.sun * settings.acceleration * scaledDeltaTime);
    mercury.planet.rotateY(realRotationSpeeds.mercury * settings.acceleration * scaledDeltaTime);
    venus.planet.rotateY(realRotationSpeeds.venus * settings.acceleration * scaledDeltaTime);
    venus.Atmosphere?.rotateY(realRotationSpeeds.venus * settings.acceleration * scaledDeltaTime);
    earth.planet.rotateY(realRotationSpeeds.earth * settings.acceleration * scaledDeltaTime);
    earth.Atmosphere?.rotateY(realRotationSpeeds.earth * 0.8 * settings.acceleration * scaledDeltaTime);
    mars.planet.rotateY(realRotationSpeeds.mars * settings.acceleration * scaledDeltaTime);
    jupiter.planet.rotateY(realRotationSpeeds.jupiter * settings.acceleration * scaledDeltaTime);
    saturn.planet.rotateY(realRotationSpeeds.saturn * settings.acceleration * scaledDeltaTime);
    uranus.planet.rotateY(realRotationSpeeds.uranus * settings.acceleration * scaledDeltaTime);
    neptune.planet.rotateY(realRotationSpeeds.neptune * settings.acceleration * scaledDeltaTime);
    pluto.planet.rotateY(realRotationSpeeds.pluto * settings.acceleration * scaledDeltaTime);

    // Update real orbital positions
    realOrbitController.update(scaledDeltaTime, settings.accelerationOrbit);

    // Animate moons and asteroids
    animateMoons();
    animateAsteroids(settings.accelerationOrbit);

    // Raycasting and outline
    updateRaycaster(camera);
    outlineSelection(raycastTargets, outlinePass);

    // Camera movement
    updateCameraMovement(camera, controls);

    controls.update();
    composer.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// Function to display current orbital information
export function displayOrbitInfo() {
  const info = {
    Mercury: {
      velocity: realOrbitController.getCurrentVelocity('Mercury'),
      period: '88 Earth days'
    },
    Venus: {
      velocity: realOrbitController.getCurrentVelocity('Venus'), 
      period: '225 Earth days'
    },
    Earth: {
      velocity: realOrbitController.getCurrentVelocity('Earth'),
      period: '365 Earth days (Reference)'
    },
    Mars: {
      velocity: realOrbitController.getCurrentVelocity('Mars'),
      period: '687 Earth days'
    },
    Jupiter: {
      velocity: realOrbitController.getCurrentVelocity('Jupiter'),
      period: '12 Earth years'
    },
    Saturn: {
      velocity: realOrbitController.getCurrentVelocity('Saturn'),
      period: '29.5 Earth years'
    },
    Uranus: {
      velocity: realOrbitController.getCurrentVelocity('Uranus'),
      period: '84 Earth years'
    },
    Neptune: {
      velocity: realOrbitController.getCurrentVelocity('Neptune'),
      period: '165 Earth years'
    },
    Pluto: {
      velocity: realOrbitController.getCurrentVelocity('Pluto'),
      period: '248 Earth years'
    }
  };

  console.log('Current Orbital Velocities (relative to Earth):', info);
  return info;
}