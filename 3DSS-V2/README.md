
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
├── images/ # Visual assets 
├── public/ # Static files served directly 
│ └── asteroids/ 
│ └── images/ # Asteroid-related images 
├── src/ # Source code (modular components) 
│ ├── planets/ # Planet rendering and orbital logic 
│ ├── moons/ # Moon rendering and orbital logic 
│ ├── asteroids/ # Asteroid belt and objects 
│ ├── interaction/ # User interaction and controls 
│ ├── materials/ # Shaders and materials 
│ ├── textures/ # Texture maps 
│ └── main.js # Entry point 
├── index.html # Main HTML file 
├── style.css # Global styles 
├── package.json # Project metadata and dependencies 
├── package-lock.json # Dependency lock file 
├── README.md # Project documentation
```
---

