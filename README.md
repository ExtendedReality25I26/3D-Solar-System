# 3D Solar System

An interactive 3D visualization of our solar system built with Three.js, featuring realistic planet models, animations, and interactive elements.

## 🌟 Features

- Realistic 3D models of all planets in the solar system
- Interactive planet selection and information display
- Accurate planetary orbits and rotations
- Natural moon systems for Earth, Mars, and Jupiter
- Asteroid belt visualization
- Post-processing effects including bloom and outlines
- Gesture controls for better interaction
- Realistic planet materials and shaders
- Detailed planet information on selection

## 🚀 Technologies Used

- Three.js - 3D graphics library
- Vite - Build tool and development server
- dat.GUI - Debug interface
- PostProcessing - Visual effects

## 📦 Installation

To test this project without cloning the entire repository, you can use [DownGit](https://downgit.github.io/#/home) to download only the `3DSS-V2` folder:

1. Visit the DownGit link generator:  
   👉 [https://downgit.github.io/#/home](https://downgit.github.io/#/home)

2. Paste the following GitHub folder URL into the input box:
    https://github.com/ExtendedReality25I26/3D-Solar-System/tree/main/3DSS-V2

3. Click **Download** to get the folder as a ZIP file.

---

Once downloaded:

```bash
# Unzip the folder
cd 3DSS-V2

# Install dependencies
npm install

# Start development server
npm run dev

```

## 🎮 Usage

- **Orbit**: Click and drag to orbit around the solar system
- **Zoom**: Use mouse wheel to zoom in/out



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

## 🔧 Configuration

The project includes several configurable aspects:
- Planet properties in `planets.js`
- Camera and controls settings in `setup.js`

## 🎨 Features in Detail

- **Realistic Planet Materials**: Custom shaders for Earth and other planets
- **Dynamic Lighting**: Realistic sun-based lighting system
- **Moon Systems**: Accurate orbital patterns for planetary moons
-


## � Resources

- **Three.js Documentation**
  - [Three.js Official Docs](https://threejs.org/docs/)
  - [Three.js Examples](https://threejs.org/examples/)
  - [Three.js Fundamentals](https://threejs.org/manual/)

- **Solar System Data**
  - [NASA Solar System Exploration](https://solarsystem.nasa.gov/)
  - [Solar System Scope](https://www.solarsystemscope.com/)
  - [ToReview]https://discourse.threejs.org/t/realistic-browser-based-solar-system-simulation-built-using-three-js/26541/2

- **Texture Resources**
  - [Solar System Textures](https://www.solarsystemscope.com/textures/)
  - [NASA Visible Earth](https://visibleearth.nasa.gov/)


- **Learning Materials**
  - [WebGL Fundamentals](https://webglfundamentals.org/)
  - [Shader Programming Guide](https://thebookofshaders.com/)
  




**ExtendedReality25I26**

- GitHub: [@ExtendedReality25I26](https://github.com/ExtendedReality25I26)




