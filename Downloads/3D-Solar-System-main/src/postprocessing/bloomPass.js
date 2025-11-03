import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default function createBloomPass() {
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
  bloomPass.threshold = 1;
  bloomPass.radius = 0.9;
  return bloomPass;
}
