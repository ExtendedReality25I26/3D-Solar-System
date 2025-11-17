
![License](https://img.shields.io/badge/license-MIT-green)
![NPM Version](https://img.shields.io/npm/v/three)
![Vite](https://img.shields.io/badge/Vite-dev-server-blue)

# 3DSS-V2 — Modular 3D Solar System Simulation 🌌

This repository contains **3DSS-V2**, the second version of the 3D Solar System simulation.  
It is a complete refactor of `3DSS-V1`, rebuilt with a clean **ES module architecture** and modern development practices using **Vite**.  
The goal of this version is to improve scalability, maintainability, and performance while keeping the simulation interactive and visually engaging.

---

## 🚀 Features
- ES module-based architecture for modularity and clarity
- Realistic orbital motion and planetary rendering
- Dedicated modules for planets, moons, asteroids, textures, and interactions
- Vite-powered development environment for fast builds and hot reload
- Improved separation of concerns and cleaner project structure
- Ready for future enhancements and scalability

---

## 🛠️ Project Structure
```
3DSS-V2/
├── images/                                
│
├── public/                                 # Static assets accessible by the browser
│   ├── asteroids/                          # Asteroid field sprites, rock textures
│   └── images/                             # Global textures: planets, moons, sun, maps, normals, speculars
│                                           # ✔ Earth maps, gas giant textures, rocky planet textures, etc.
│                                           # Used by planets.js via TextureLoader
│
├── src/                                    # Main source code (modular ES modules)
│   ├── setup.js                            # Scene, camera, renderer, lights, controls, bloom, passes
│                                           # Initializes the 3D environment and exports core objects
│
│   ├── planets.js                          # Planet creation + materials + edgy 3D visuals
│                                           # Handles:
│                                           #   ✔ Loading textures from /images/
│                                           #   ✔ Planet meshes + atmospheres + fresnel glow
│                                           #   ✔ Orbital animation logic
│                                           #   ✔ Sun emissive material and glare
│
│   ├── interactions.js                     # Mouse interaction + raycasting + planet selection
│                                           # Handles:
│                                           #   ✔ Hover outline
│                                           #   ✔ Click to focus planet
│                                           #   ✔ Smooth camera transitions
│                                           #   ✔ Info panel events
│
│   ├── test-errors/                        # Error logs, debugging utilities, experimental tests
│
│   └── main.js                             # Application entry point
│                                           #   ✔ Imports setup, planets, interactions
│                                           #   ✔ Animation loop (requestAnimationFrame)
│                                           #   ✔ Updates orbits, rotations, and postprocessing
│
├── index.html                              # HTML container that loads main.js (type="module")
│
├── style.css                               # Global UI styles, typography, layout controls
│
├── package.json                            # Project metadata + dependencies (three.js, server, tooling)
├── package-lock.json                       # Locked dependency versions
│
└── README.md                                # Documentation, usage instructions, development notes

```
---

