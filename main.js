// ============================================================
// ONLY FOR U — dunia kecil 3D berisi kenangan
// ------------------------------------------------------------
// GANTI DI SINI kalau mau ubah nama / teks judul:
const RECIPIENT_NAME = "Kamu";
const TITLE_TEXT = `Only For U, ${RECIPIENT_NAME}`;
// Jumlah foto yang dipakai (mengambil assets/photos/1.png .. N.png)
const PHOTO_COUNT = 10;
// ============================================================

import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const canvas = document.getElementById('scene');
const loadingEl = document.getElementById('loading');
const loadingFill = document.getElementById('loadingFill');
const hintEl = document.getElementById('hint');

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050818);
scene.fog = new THREE.FogExp2(0x050818, 0.0032);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 16, 44);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 22;
controls.maxDistance = 85;
controls.minPolarAngle = Math.PI * 0.12;
controls.maxPolarAngle = Math.PI * 0.86;
controls.autoRotate = false;
controls.target.set(0, 2, 0);

// world group: everything that slowly tumbles together
const world = new THREE.Group();
scene.add(world);

// ---------- starfield (fixed, gentle independent drift) ----------
function makeStars(count, rMin, rMax, size, color, opacity) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size, sizeAttenuation: true, transparent: true,
    opacity, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

const starsNear = makeStars(2200, 90, 220, 0.9, 0xffffff, 0.9);
const starsFar = makeStars(3500, 220, 420, 1.3, 0xaab4ff, 0.6);
scene.add(starsNear, starsFar);

// ---------- heart-shaped particle core (red "planet") ----------
function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

function buildHeart() {
  const COUNT = 9000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const deep = new THREE.Color(0x5c0a10);
  const mid = new THREE.Color(0xc4241f);
  const hot = new THREE.Color(0xff6a4d);

  const SCALE = 0.62; // heart-curve units -> world units
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const { x: bx, y: by } = heartPoint(t);
    const s = Math.cbrt(Math.random()); // fuller toward surface, area-ish uniform
    const depth = Math.sqrt(Math.max(0, 1 - s * s)) * 8 * (0.4 + Math.random() * 0.6);

    const x = bx * s * SCALE;
    const y = (by + 4) * s * SCALE; // +4 lifts the cusp so the heart centers nicer
    const z = (Math.random() - 0.5) * depth * SCALE;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = new THREE.Color();
    if (s > 0.82) c.copy(hot); else if (s > 0.45) c.copy(mid); else c.copy(deep);
    c.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.06);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.34, vertexColors: true, transparent: true, opacity: 0.95,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.position.y = 1.5;
  return points;
}

const heart = buildHeart();
world.add(heart);

// ---------- ring / disc of pale particles around the heart ----------
function buildRing() {
  const COUNT = 7000;
  const rInner = 12.5, rOuter = 25;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const c1 = new THREE.Color(0xe9ecff);
  const c2 = new THREE.Color(0xffffff);

  for (let i = 0; i < COUNT; i++) {
    const r = rInner + Math.random() * (rOuter - rInner);
    const a = Math.random() * Math.PI * 2;
    const taper = 1 - (r - rInner) / (rOuter - rInner) * 0.55;
    const y = (Math.random() - 0.5) * 1.4 * taper;

    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r;

    const c = c1.clone().lerp(c2, Math.random());
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.3, vertexColors: true, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

const ring = buildRing();
world.add(ring);

// ---------- floating photo "polaroid cubes" ----------
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loadingFill.style.width = pct + '%';
};
manager.onError = (url) => console.warn('Gagal memuat:', url);

const texLoader = new THREE.TextureLoader(manager);
const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f3ee });

const photoGroup = new THREE.Group();
const floaters = [];

for (let i = 1; i <= PHOTO_COUNT; i++) {
  const tex = texLoader.load(`assets/photos/${i}.png`);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  const photoMat = new THREE.MeshBasicMaterial({ map: tex });

  const size = 3.0 + Math.random() * 1.4;
  const depth = size * 0.16;
  // Box faces order: +x,-x,+y,-y,+z,-z
  const materials = [whiteMat, whiteMat, whiteMat, whiteMat, photoMat, whiteMat];
  const geo = new THREE.BoxGeometry(size, size, depth);
  const cube = new THREE.Mesh(geo, materials);

  const radius = 13.5 + Math.random() * 13;
  const angle = Math.random() * Math.PI * 2;
  const baseY = (Math.random() - 0.5) * 9;

  cube.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
  cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

  cube.userData = {
    baseY,
    phase: Math.random() * Math.PI * 2,
    bobSpeed: 0.4 + Math.random() * 0.5,
    bobAmp: 0.6 + Math.random() * 0.8,
    rotSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.25,
      (Math.random() - 0.5) * 0.35,
      (Math.random() - 0.5) * 0.2
    ),
  };

  photoGroup.add(cube);
  floaters.push(cube);
}
world.add(photoGroup);

// ---------- title text sprite (part of rotating world, like the reference) ----------
function buildTitle(text) {
  const canvasEl = document.createElement('canvas');
  const W = 1600, H = 300;
  canvasEl.width = W; canvasEl.height = H;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f4f1ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "italic 500 108px 'Playfair Display', Georgia, serif";
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, W / 2, H / 2);

  const tex = new THREE.CanvasTexture(canvasEl);
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const aspect = W / H;
  const height = 4.6;
  const geo = new THREE.PlaneGeometry(height * aspect, height);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 15.5, 0);
  return mesh;
}

let titleMesh = null;
document.fonts && document.fonts.ready
  ? document.fonts.ready.then(() => { titleMesh = buildTitle(TITLE_TEXT); world.add(titleMesh); })
  : (() => { titleMesh = buildTitle(TITLE_TEXT); world.add(titleMesh); })();

// ---------- resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loading screen out ----------
let hidden = false;
function hideLoading() {
  if (hidden) return;
  hidden = true;
  loadingEl.classList.add('hide');
  hintEl.classList.add('show');
  setTimeout(() => { hintEl.classList.remove('show'); }, 4200);
}
manager.onLoad = () => setTimeout(hideLoading, 350);
// safety net in case something never fires onLoad
setTimeout(hideLoading, 6000);

// ---------- animation loop ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  world.rotation.y = t * 0.09;
  world.rotation.x = Math.sin(t * 0.12) * 0.10;
  world.rotation.z = Math.cos(t * 0.09) * 0.05;

  starsNear.rotation.y = t * 0.01;
  starsFar.rotation.y = -t * 0.006;

  for (const cube of floaters) {
    const d = cube.userData;
    cube.position.y = d.baseY + Math.sin(t * d.bobSpeed + d.phase) * d.bobAmp;
    cube.rotation.x += d.rotSpeed.x * 0.01;
    cube.rotation.y += d.rotSpeed.y * 0.01;
    cube.rotation.z += d.rotSpeed.z * 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
