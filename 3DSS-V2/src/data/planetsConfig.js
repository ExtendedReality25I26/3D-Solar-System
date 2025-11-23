// src/data/planetsConfig.js
export const planetsConfig = {
  Sun: {
    physical: {
      radius: 697 / 40,  // 40 times smaller scale
      distance: 0,       // At origin
      tilt: 0,
      eccentricity: 0,
      rotationPeriod: 27, // Jours
      orbitPeriod: 0    // Le Soleil n'orbite pas
    },
    animation: {
      rotationSpeed: 0.001,
      orbitSpeed: 0
    },
    assets: {
      map: '/images/sun.jpg',
      emissive: true,
      emissiveColor: 0xFFF88F,
      emissiveIntensity: 1.9
    },
    light: {
      enabled: true,
      color: 0xFDFFD3,
      intensity: 1200,
      distance: 400,
      decay: 1.4
    },
    info: {
      radius: '695,700 km',
      tilt: '7.25°',
      rotation: '25-35 Earth days',
      orbit: 'N/A',
      distance: 'Center of solar system',
      moons: '0',
      description: 'The star at the center of our solar system, providing light and heat to all planets.'
    }
  },

  Mercury: {
    physical: {
      radius: 2.4,
      distance: 40,
      tilt: 0,
      eccentricity: 0.205, // Orbite très elliptique
      rotationPeriod: 58.6,
      orbitPeriod: 88
    },
    animation: {
      rotationSpeed: 0.001,
      orbitSpeed: 0.004
    },
    assets: {
      map: '/images/mercurymap.jpg',
      bump: '/images/mercurybump.jpg'
    },
    info: {
      radius: '2,439.7 km',
      tilt: '0.034°',
      rotation: '58.6 Earth days',
      orbit: '88 Earth days',
      distance: '57.9 million km',
      moons: '0',
      description: 'The smallest planet in our solar system and nearest to the Sun.'
    }
  },

  Venus: {
    physical: {
      radius: 6.1,
      distance: 65,
      tilt: 3,
      eccentricity: 0.007,
      rotationPeriod: -243, // Négatif car elle tourne à l'envers
      orbitPeriod: 224.7 // Orbite presque circulaire
    },
    animation: {
      rotationSpeed: 0.001639,
      orbitSpeed: 0.001639
    },
    assets: {
      map: '/images/venusmap.jpg',
      bump: '/images/venusmap.jpg',
      atmosphere: '/images/venus_atmosphere.jpg'
    },
    info: {
      radius: '6,051.8 km',
      tilt: '177.4°',
      rotation: '243 Earth days',
      orbit: '225 Earth days',
      distance: '108.2 million km',
      moons: '0',
      description: 'Second planet from the Sun, known for its extreme temperatures and thick atmosphere.'
    }
  },

  Earth: {
    physical: {
      radius: 6.4,
      distance: 90,
      tilt: 23,
      eccentricity: 0.017,// Légèrement elliptique
      rotationPeriod: 1,
      orbitPeriod: 365.25 
    },
    animation: {
      rotationSpeed: 0.005,
      orbitSpeed: 0.001,
      atmosphereRotationSpeed: 0.001
    },
    assets: {
      map: '/images/earth_daymap.jpg',
      nightMap: '/images/earth_nightmap.jpg',
      atmosphere: '/images/earth_atmosphere.jpg',
      customShader: true  // Flag for special shader material
    },
    moons: [
      {
        size: 1.6,
        texture: '/images/moonmap.jpg',
        bump: '/images/moonbump.jpg',
        orbitRadius: 10,
        orbitPeriod: 27.3, // La lune met ~27 jours
      }
    ],
    info: {
      radius: '6,371 km',
      tilt: '23.5°',
      rotation: '24 hours',
      orbit: '365 days',
      distance: '150 million km',
      moons: '1 (Moon)',
      description: 'Third planet from the Sun and the only known planet to harbor life.'
    }
  },

  Mars: {
    physical: {
      radius: 3.4,
      distance: 115,
      tilt: 25,
      eccentricity: 0.094,
      rotationPeriod: 1.03,
      orbitPeriod: 687 // Modérément elliptique
    },
    animation: {
      rotationSpeed: 0.01,
      orbitSpeed: 0.00053
    },
    assets: {
      map: '/images/marsmap.jpg',
      bump: '/images/marsbump.jpg'
    },
    moons: [
      {
        modelPath: '/images/mars/phobos.glb',
        scale: 0.1,
        orbitRadius: 5,
        orbitPeriod: 0.32,
        position: 100
      },
      {
        modelPath: '/images/mars/deimos.glb',
        scale: 0.1,
        orbitRadius: 9,
        orbitPeriod: 1.26,
        position: 120
      }
    ],
    info: {
      radius: '3,389.5 km',
      tilt: '25.19°',
      rotation: '1.03 Earth days',
      orbit: '687 Earth days',
      distance: '227.9 million km',
      moons: '2 (Phobos and Deimos)',
      description: 'Known as the Red Planet, famous for its reddish appearance and potential for human colonization.'
    }
  },

  Jupiter: {
    physical: {
      radius: 69 / 4,
      distance: 200,
      tilt: 3,
      eccentricity: 0.049,
      rotationPeriod: 0.41,
      orbitPeriod: 4333 // Légèrement elliptique
    },
    animation: {
      rotationSpeed: 0.005,
      orbitSpeed: 0.000084
    },
    assets: {
      map: '/images/jupiter.jpg'
    },
    moons: [
      { size: 1.6, texture: '/images/jupiterIo.jpg', orbitRadius: 20, orbitPeriod: 1.77 },
      { size: 1.4, texture: '/images/jupiterEuropa.jpg', orbitRadius: 24, orbitPeriod: 3.55 },
      { size: 2, texture: '/images/jupiterGanymede.jpg', orbitRadius: 28, orbitPeriod: 7.15 },
      { size: 1.7, texture: '/images/jupiterCallisto.jpg', orbitRadius: 32, orbitPeriod: 16.69 }
    ],
    info: {
      radius: '69,911 km',
      tilt: '3.13°',
      rotation: '9.9 hours',
      orbit: '12 Earth years',
      distance: '778.5 million km',
      moons: '95 known moons',
      description: 'The largest planet in our solar system, known for its Great Red Spot.'
    }
  },

  Saturn: {
    physical: {
      radius: 58 / 4,
      distance: 270,
      tilt: 26,
      eccentricity: 0.057,
      rotationPeriod: 0.45,
      orbitPeriod: 10759 // Légèrement elliptique
    },
    animation: {
      rotationSpeed: 0.01,
      orbitSpeed: 0.000034
    },
    assets: {
      map: '/images/saturnmap.jpg',
      hasRings: true,
      rings: {
        innerRadius: 18,
        outerRadius: 29,
        texture: '/images/saturn_ring.png'
      }
    },
    info: {
      radius: '58,232 km',
      tilt: '26.73°',
      rotation: '10.7 hours',
      orbit: '29.5 Earth years',
      distance: '1.4 billion km',
      moons: '146 known moons',
      description: 'Distinguished by its extensive ring system, the second-largest planet in our solar system.'
    }
  },

  Uranus: {
    physical: {
      radius: 25 / 4,
      distance: 320,
      tilt: 82,
      eccentricity: 0.046,
      rotationPeriod: -0.72,
      orbitPeriod: 3068 // Presque circulaire
    },
    animation: {
      rotationSpeed: 0.005,
      orbitSpeed: 0.0000119
    },
    assets: {
      map: '/images/uranus.jpg',
      hasRings: true,
      rings: {
        innerRadius: 6,
        outerRadius: 8,
        texture: '/images/uranus_ring.png'
      }
    },
    info: {
      radius: '25,362 km',
      tilt: '97.77°',
      rotation: '17.2 hours',
      orbit: '84 Earth years',
      distance: '2.9 billion km',
      moons: '27 known moons',
      description: 'Known for its unique sideways rotation and pale blue color.'
    }
  },

  Neptune: {
    physical: {
      radius: 24 / 4,
      distance: 340,
      tilt: 28,
      eccentricity: 0.011,
      rotationPeriod: 0.67,
      orbitPeriod: 60190 // Presque circulaire
    },
    animation: {
      rotationSpeed: 0.005,
      orbitSpeed: 0.00000606
    },
    assets: {
      map: '/images/neptune.jpg'
    },
    info: {
      radius: '24,622 km',
      tilt: '28.32°',
      rotation: '16.1 hours',
      orbit: '165 Earth years',
      distance: '4.5 billion km',
      moons: '14 known moons',
      description: 'The most distant planet from the Sun in our solar system, known for its deep blue color.'
    }
  },

  Pluto: {
    physical: {
      radius: 3,
      distance: 440,
      tilt: 57,
      eccentricity: 0.244,
      rotationPeriod: -6.39,
      orbitPeriod: 90560 // Très elliptique
    },
    animation: {
      rotationSpeed: 0.001,
      orbitSpeed: 0.00000403
    },
    assets: {
      map: '/images/plutomap.jpg'
    },
    info: {
      radius: '1,188.3 km',
      tilt: '122.53°',
      rotation: '6.4 Earth days',
      orbit: '248 Earth years',
      distance: '5.9 billion km',
      moons: '5',
      description: 'Originally classified as the ninth planet, Pluto is now considered a dwarf planet.'
    }
  }
};