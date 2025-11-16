import {
  sun, mercury, venus, earth, mars,
  jupiter, saturn, uranus, neptune, pluto,
  settings, raycastTargets
} from './planets/planets.js';

import { animateMoons } from './moons/animateMoons.js';
import { animateAsteroids } from './Loadasteroids/loadAsteroids.js';
import { raycaster, mouse, updateRaycaster, outlineSelection } from './interaction/raycasting.js';
import { updateCameraMovement } from './interaction/planetSelection.js';

export default function animate(camera, controls, composer, outlinePass) {
  function loop() {
    // Rotate planets and sun
    sun.rotateY(0.001 * settings.acceleration);
    mercury.planet.rotateY(0.001 * settings.acceleration);
    mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
    venus.planet.rotateY(0.0005 * settings.acceleration);
    venus.Atmosphere?.rotateY(0.0005 * settings.acceleration);
    venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
    earth.planet.rotateY(0.005 * settings.acceleration);
    earth.Atmosphere?.rotateY(0.001 * settings.acceleration);
    earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
    mars.planet.rotateY(0.01 * settings.acceleration);
    mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
    jupiter.planet.rotateY(0.005 * settings.acceleration);
    jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
    saturn.planet.rotateY(0.01 * settings.acceleration);
    saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
    uranus.planet.rotateY(0.005 * settings.acceleration);
    uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
    neptune.planet.rotateY(0.005 * settings.acceleration);
    neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
    pluto.planet.rotateY(0.001 * settings.acceleration);
    pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit);

    // Animate moons and asteroids
    animateMoons();
    animateAsteroids(settings.accelerationOrbit);

    // Raycasting and outline
    updateRaycaster(mouse, camera);
    outlineSelection(raycastTargets, outlinePass);

    // Camera movement
    updateCameraMovement(camera, controls);

    controls.update();
    composer.render();
    requestAnimationFrame(loop);
  }

  loop();
}
