import { planetData } from '../planets/planetData.js';

export function showPlanetInfo(name) {
  const info = document.getElementById('planetInfo');
  const title = document.getElementById('planetName');
  const details = document.getElementById('planetDetails');
  const data = planetData[name];

  title.innerText = name;
  details.innerText = `Radius: ${data.radius}
Tilt: ${data.tilt}
Rotation: ${data.rotation}
Orbit: ${data.orbit}
Distance: ${data.distance}
Moons: ${data.moons}
Eccentricity: ${data.eccentricity}
Orbital Speed: ${data.orbitSpeed}

Info: ${data.info}`;

  info.style.display = 'block';
}

export function closeInfo() {
  document.getElementById('planetInfo').style.display = 'none';
}

export function closeInfoNoZoomOut() {
  document.getElementById('planetInfo').style.display = 'none';
}
