import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

const container = document.getElementById('visualization');
container.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);

new OrbitControls(camera, renderer.domElement);

const detail = 12;
const loader = new THREE.TextureLoader();
// const texture = loader.load("/static/images/earthlights4k.jpg");

// // Apply texture filtering for sharper details
// texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Use maximum anisotropy supported by the GPU
// texture.minFilter = THREE.LinearMipMapLinearFilter; // Smooth mipmap scaling
// texture.magFilter = THREE.LinearFilter; 
const geometry = new THREE.SphereGeometry(1, 64, 64); // 64 segments for smoothness
const material = new THREE.MeshPhongMaterial({
  map: loader.load("/static/images/earthmap2k.jpg"),
  shininess: 10,
});

const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate() {
  requestAnimationFrame(animate);

  // lightsMesh.rotation.y += 0.002;
  // cloudsMesh.rotation.y += 0.0023;
  // glowMesh.rotation.y += 0.002;
  // stars.rotation.y -= 0.0002;
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);