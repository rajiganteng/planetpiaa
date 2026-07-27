// ============================================================
// ONLY FOR U — dunia kecil 3D berisi kenangan
// ------------------------------------------------------------
// GANTI DI SINI kalau mau ubah nama / teks judul:
const RECIPIENT_NAME = "Kakaa Piaaa";
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

// ---------- soft circular sprite texture (fixes hard pixel/square dots) ----------
function makeDotTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
const dotTexture = makeDotTexture();

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
    opacity, depthWrite: false, map: dotTexture, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

const starsNear = makeStars(2200, 90, 220, 1.5, 0xffffff, 0.9);
const starsFar = makeStars(3500, 220, 420, 2.0, 0xaab4ff, 0.6);
scene.add(starsNear, starsFar);

// ---------- round particle planet (red/orange "sun-like" core) ----------
function buildPlanet() {
  const COUNT = 14000;
  const RADIUS = 9.5;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const deep = new THREE.Color(0x5c0a10);
  const mid = new THREE.Color(0xd8391f);
  const hot = new THREE.Color(0xffb15a);

  for (let i = 0; i < COUNT; i++) {
    // uniform-ish fill of a sphere, with a fuzzy/noisy surface
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const s = Math.cbrt(Math.random()); // 0 (core) -> 1 (surface)
    const noise = 0.9 + Math.random() * 0.14; // fuzzy edge, not a perfect sphere
    const r = RADIUS * s * noise;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = new THREE.Color();
    if (s > 0.86) c.copy(hot); else if (s > 0.4) c.copy(mid); else c.copy(deep);
    c.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.05);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.5, vertexColors: true, transparent: true, opacity: 0.95,
    depthWrite: false, blending: THREE.AdditiveBlending, map: dotTexture,
  });
  const points = new THREE.Points(geo, mat);
  points.position.y = 1.5;
  return points;
}

const planet = buildPlanet();
world.add(planet);

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
    size: 0.42, vertexColors: true, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, map: dotTexture,
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

// Preload each of the 10 source photos ONCE and reuse the texture object
// across many small floating cubes — this is how we get "banyak foto"
// (lots of photos on screen, grouped in clusters) without re-downloading
// or re-decoding the same image over and over.
const photoTextures = [];
for (let i = 1; i <= PHOTO_COUNT; i++) {
  const tex = texLoader.load(`assets/photos/${i}.png`);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  photoTextures.push(tex);
}

const photoGroup = new THREE.Group();
const floaters = [];

// How many floating photo-cubes to scatter in total, and how many
// "clusters" (little groups of photos near each other, like the examples
// you gave: 1,5,2,9 in one spot / 2,3,4,7 in another / 1,7,2,8 elsewhere).
const FLOATER_COUNT = 42;
const CLUSTER_COUNT = 9;

const clusters = Array.from({ length: CLUSTER_COUNT }, () => ({
  angle: Math.random() * Math.PI * 2,
  radius: 14 + Math.random() * 9,
  baseY: (Math.random() - 0.5) * 7,
}));

for (let i = 0; i < FLOATER_COUNT; i++) {
  const cluster = clusters[i % CLUSTER_COUNT];
  const photoIdx = Math.floor(Math.random() * PHOTO_COUNT);
  const photoMat = new THREE.MeshBasicMaterial({ map: photoTextures[photoIdx] });

  // smaller cards than before, so the scene doesn't feel cluttered with
  // oversized photos
  const size = 1.35 + Math.random() * 0.75;
  const depth = size * 0.16;
  // Box faces order: +x,-x,+y,-y,+z,-z
  const materials = [whiteMat, whiteMat, whiteMat, whiteMat, photoMat, whiteMat];
  const geo = new THREE.BoxGeometry(size, size, depth);
  const cube = new THREE.Mesh(geo, materials);

  const angle = cluster.angle + (Math.random() - 0.5) * 0.6;
  const radius = cluster.radius + (Math.random() - 0.5) * 4.5;
  const baseY = cluster.baseY + (Math.random() - 0.5) * 3.4;

  cube.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
  cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

  cube.userData = {
    baseY,
    phase: Math.random() * Math.PI * 2,
    bobSpeed: 0.4 + Math.random() * 0.5,
    bobAmp: 0.5 + Math.random() * 0.7,
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

// ---------- cinematic intro animation ----------
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const CAM_START = new THREE.Vector3(0, 70, 165);
const CAM_END = camera.position.clone();
const TARGET_FIXED = new THREE.Vector3(0, 2, 0);
const INTRO_DUR = 2.8;

controls.target.copy(TARGET_FIXED);
controls.enabled = false;
camera.position.copy(CAM_START);
camera.lookAt(TARGET_FIXED);
world.scale.setScalar(0.001);
starsNear.material.opacity = 0;
starsFar.material.opacity = 0;
const STAR_NEAR_OP = 0.9, STAR_FAR_OP = 0.6;

let introStart = null;
let introFinished = false;
function startIntro() { introStart = performance.now(); }

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
  startIntro();
  setTimeout(() => {
    hintEl.classList.add('show');
    setTimeout(() => { hintEl.classList.remove('show'); }, 4200);
  }, INTRO_DUR * 1000 * 0.6);
}
manager.onLoad = () => setTimeout(hideLoading, 350);
// safety net in case something never fires onLoad
setTimeout(hideLoading, 6000);

// ---------- animation loop ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // -------- intro: camera dolly-in + planet "pop" + starfield fade --------
  // IMPORTANT: this block must stop touching camera.position/lookAt once the
  // intro is finished, otherwise it fights OrbitControls every frame and the
  // view looks "stuck" (can't be dragged) even though controls are enabled.
  let introP = 1; // 1 = fully settled
  if (introStart !== null && !introFinished) {
    const elapsed = (performance.now() - introStart) / 1000;
    introP = Math.min(1, elapsed / INTRO_DUR);

    camera.position.lerpVectors(CAM_START, CAM_END, easeOutCubic(introP));
    camera.lookAt(TARGET_FIXED);

    const scaleP = Math.min(1, elapsed / (INTRO_DUR * 0.8));
    world.scale.setScalar(Math.max(0.001, easeOutBack(scaleP)));

    starsNear.material.opacity = STAR_NEAR_OP * Math.min(1, elapsed / 1.3);
    starsFar.material.opacity = STAR_FAR_OP * Math.min(1, elapsed / 1.8);

    if (introP >= 1) {
      introFinished = true;
      world.scale.setScalar(1);
      starsNear.material.opacity = STAR_NEAR_OP;
      starsFar.material.opacity = STAR_FAR_OP;
      controls.enabled = true;
      controls.update();
    }
  }

  // extra unwind spin during intro settles into the normal slow tumble
  world.rotation.y = t * 0.09 + (1 - introP) * Math.PI * 4;
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

  if (controls.enabled) controls.update();
  renderer.render(scene, camera);
}

animate();
