import { planetData } from '../planets/planetData.js';

export function showPlanetInfo(name) {
  const info = document.getElementById('planetInfo');
  const title = document.getElementById('planetName');
  const details = document.getElementById('planetDetails');
  const data = planetData[name];

  title.innerText = name;
  details.innerText = `Radius: ${data.radius}\nTilt: ${data.tilt}\nRotation: ${data.rotation}\nOrbit: ${data.orbit}\nDistance: ${data.distance}\nMoons: ${data.moons}\nInfo: ${data.info}`;
  info.style.display = 'block';
}

export function closeInfo() {
  document.getElementById('planetInfo').style.display = 'none';
}

export function closeInfoNoZoomOut() {
  document.getElementById('planetInfo').style.display = 'none';
}
