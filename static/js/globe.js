import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { addSatellites } from "./debris.js";

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
earthGroup.rotation.z = 0; 
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
  map: loader.load("/static/images/earthmap4k.jpg"),
  shininess: 10,
});

const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("/static/images/earthlights4k.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("/static/images/earthcloudmap.jpg"),
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  alphaMap: loader.load("/static/images/earthcloudmaptrans.jpg"),
  // alphaTest: 0.3,
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
// scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

addSatellites(scene, camera, renderer);

function animate() {
  requestAnimationFrame(animate);

  // lightsMesh.rotation.y += 0.002;
  // cloudsMesh.rotation.y += 0.0023;
  // glowMesh.rotation.y += 0.002;
  // stars.rotation.y -= 0.0002;
  renderer.render(scene, camera);
}

function createStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });

  const starVertices = [];
  const minDistance = 175;
  for (let i = 0; i < 10000; i++) {
    let x, y, z;
    do {
      x = THREE.MathUtils.randFloatSpread(2000);
      y = THREE.MathUtils.randFloatSpread(2000);
      z = THREE.MathUtils.randFloatSpread(2000);
    } while (Math.sqrt(x * x + y * y + z * z) < minDistance);

    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

createStarField();

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);