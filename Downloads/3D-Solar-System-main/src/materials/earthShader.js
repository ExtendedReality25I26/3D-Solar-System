import * as THREE from 'three';
import { loadTexture } from '../textures/loader.js';

const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { type: 't', value: loadTexture.load('/images/earth_daymap.jpg') },
    nightTexture: { type: 't', value: loadTexture.load('/images/earth_nightmap.jpg') },
    sunPosition: { type: 'v3', value: new THREE.Vector3(0, 0, 0) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;
    uniform vec3 sunPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;
    void main() {
      float intensity = max(dot(vNormal, vSunDirection), 0.0);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv) * 0.2;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});

export default earthMaterial;
