import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export default function createOutlinePass(scene, camera) {
  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 1;
  outlinePass.visibleEdgeColor.set(0xffffff);
  outlinePass.hiddenEdgeColor.set(0x190a05);
  return outlinePass;
}
