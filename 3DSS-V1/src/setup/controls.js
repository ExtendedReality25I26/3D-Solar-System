import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.75;
  controls.screenSpacePanning = false;
  return controls;
}
