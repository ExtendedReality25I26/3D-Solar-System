// Real orbital mechanics for realistic planet movement
import * as THREE from 'three';

// Real orbital data (simplified)
export const orbitalData = {
  Mercury: {
    semiMajorAxis: 40,     // Scaled distance
    eccentricity: 0.2056,  // Real eccentricity
    orbitalPeriod: 88,     // Earth days
    inclination: 7.0       // Degrees
  },
  Venus: {
    semiMajorAxis: 65,
    eccentricity: 0.0068,
    orbitalPeriod: 225,
    inclination: 3.4
  },
  Earth: {
    semiMajorAxis: 90,     // Reference distance
    eccentricity: 0.0167,  // Real eccentricity
    orbitalPeriod: 365,    // Reference period (1 Earth year)
    inclination: 0.0       // Reference inclination
  },
  Mars: {
    semiMajorAxis: 115,
    eccentricity: 0.0934,
    orbitalPeriod: 687,
    inclination: 1.85
  },
  Jupiter: {
    semiMajorAxis: 200,
    eccentricity: 0.0484,
    orbitalPeriod: 4333,   // ~12 Earth years
    inclination: 1.3
  },
  Saturn: {
    semiMajorAxis: 270,
    eccentricity: 0.0539,
    orbitalPeriod: 10759,  // ~29.5 Earth years
    inclination: 2.5
  },
  Uranus: {
    semiMajorAxis: 320,
    eccentricity: 0.0463,
    orbitalPeriod: 30687,  // ~84 Earth years
    inclination: 0.8
  },
  Neptune: {
    semiMajorAxis: 340,
    eccentricity: 0.0094,
    orbitalPeriod: 60190,  // ~165 Earth years
    inclination: 1.8
  },
  Pluto: {
    semiMajorAxis: 350,
    eccentricity: 0.2488,
    orbitalPeriod: 90520,  // ~248 Earth years
    inclination: 17.2
  }
};

export class RealOrbitController {
  constructor() {
    this.time = 0;
    this.earthOrbitSpeed = 0.005; // Augmenté de 0.001 à 0.005 pour un mouvement plus visible
    this.planets = {};
  }

  // Initialize a planet's orbital parameters
  // Add a planet to the orbital system
  addPlanet(name, planetObject) {
    const data = orbitalData[name];
    if (!data) {
      console.warn(`No orbital data found for planet: ${name}`);
      return;
    }

    this.planets[name] = {
      object: planetObject,
      data: data,
      currentAngle: Math.random() * Math.PI * 2, // Random starting position
      orbitalSpeed: this.earthOrbitSpeed * (365 / data.orbitalPeriod),
      position: new THREE.Vector3() // Initialize position
    };
    
    console.log(`✅ Added ${name} to real orbit system - Speed: ${this.planets[name].orbitalSpeed.toFixed(4)}`);
  }

  // Calculate elliptical orbit position
  calculateEllipticalPosition(semiMajorAxis, eccentricity, angle) {
    // Ellipse equation in parametric form
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    const x = semiMajorAxis * Math.cos(angle);
    const z = semiMinorAxis * Math.sin(angle);
    return { x, z };
  }

  // Update all planetary positions
  update(deltaTime, accelerationOrbit = 1) {
    this.time += deltaTime;

    Object.entries(this.planets).forEach(([name, planet]) => {
      // Update orbital angle based on real speed
      planet.currentAngle += planet.orbitalSpeed * accelerationOrbit * deltaTime;

      // Calculate elliptical position
      const pos = this.calculateEllipticalPosition(
        planet.data.semiMajorAxis,
        planet.data.eccentricity,
        planet.currentAngle
      );

      // Apply orbital inclination
      const inclinationRad = planet.data.inclination * Math.PI / 180;
      const y = pos.z * Math.sin(inclinationRad);
      const z = pos.z * Math.cos(inclinationRad);

      // Store the calculated position for the planet3d object (orbital container)
      planet.position = new THREE.Vector3(pos.x, y, z);

      // Validate position (avoid NaN or extreme values)
      if (isNaN(pos.x) || isNaN(y) || isNaN(z) || 
          Math.abs(pos.x) > 1000 || Math.abs(y) > 1000 || Math.abs(z) > 1000) {
        console.warn(`⚠️ Invalid position for ${name}:`, pos.x, y, z);
        return;
      }

      // Update planet3d position (this moves the entire planetary system)
      if (planet.object && planet.object.planet3d) {
        planet.object.planet3d.position.copy(planet.position);
      }
    });
  }

  // Create elliptical orbit path for visualization
  createOrbitPath(name, scene) {
    const data = orbitalData[name];
    if (!data) return;

    const points = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const pos = this.calculateEllipticalPosition(
        data.semiMajorAxis,
        data.eccentricity,
        angle
      );
      
      // Apply inclination
      const inclinationRad = data.inclination * Math.PI / 180;
      const y = pos.z * Math.sin(inclinationRad);
      const z = pos.z * Math.cos(inclinationRad);
      
      points.push(new THREE.Vector3(pos.x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.1 
    });
    const orbit = new THREE.Line(geometry, material);
    scene.add(orbit);

    return orbit;
  }

  // Get current orbital velocity (for display purposes)
  getCurrentVelocity(name) {
    const planet = this.planets[name];
    if (!planet) return 0;
    
    // Calculate current distance from sun (for elliptical orbits, velocity varies)
    const currentPos = this.calculateEllipticalPosition(
      planet.data.semiMajorAxis,
      planet.data.eccentricity,
      planet.currentAngle
    );
    const distance = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
    
    // Kepler's laws: closer to sun = faster orbital velocity
    const baseVelocity = planet.orbitalSpeed;
    const velocityFactor = planet.data.semiMajorAxis / distance;
    
    return baseVelocity * velocityFactor;
  }
}