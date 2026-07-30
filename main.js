
const TITLE_TEXT = "Only For U, Kakaaa Piaaaaa🤍";

const PHOTO_COUNT = 10;

const AUDIO_SRC = 'assets/audio/song.mp3';
const AUDIO_START = 36;
const AUDIO_EPIC = 46;
const AUDIO_END = 199;
const AUDIO_VOLUME = 0.85;

import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const canvas = document.getElementById('scene');
const loadingEl = document.getElementById('loading');
const loadingFill = document.getElementById('loadingFill');
const hintEl = document.getElementById('hint');
const gateEl = document.getElementById('gate');
const gateYesBtn = document.getElementById('gateYes');
const gateNoBtn = document.getElementById('gateNo');

const YES_SOUND_SRC = 'assets/audio/yes-sfx.mp3';
const NO_SOUND_SRC = 'assets/audio/no-sfx.mp3';

const yesSfx = new Audio(YES_SOUND_SRC);
yesSfx.preload = 'auto';
yesSfx.addEventListener('error', () => {
  console.warn('Sound effect tidak ditemukan/gagal dimuat:', YES_SOUND_SRC, '— letakkan file di', YES_SOUND_SRC);
});

const noSfx = new Audio(NO_SOUND_SRC);
noSfx.preload = 'auto';
noSfx.addEventListener('error', () => {
  console.warn('Sound effect tidak ditemukan/gagal dimuat:', NO_SOUND_SRC, '— letakkan file di', NO_SOUND_SRC);
});

function playYesSound() {
  try {
    yesSfx.currentTime = 0;
    const p = yesSfx.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

function playDodgeSound() {
  try {
    noSfx.currentTime = 0;
    const p = noSfx.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

const bgm = new Audio(AUDIO_SRC);
bgm.preload = 'auto';
bgm.volume = 0;
bgm.addEventListener('error', () => {
  console.warn('Audio tidak ditemukan/gagal dimuat:', AUDIO_SRC, '— letakkan file lagu di', AUDIO_SRC);
});

let bgmFadeRAF = null;
function fadeAudio(from, to, ms, onDone) {
  if (bgmFadeRAF) cancelAnimationFrame(bgmFadeRAF);
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / ms);
    bgm.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    if (p < 1) {
      bgmFadeRAF = requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  bgmFadeRAF = requestAnimationFrame(step);
}

function unlockAudio() {

  const p = bgm.play();
  if (p && p.catch) p.catch(() => {});
  bgm.pause();
  try { bgm.currentTime = AUDIO_START; } catch (e) {}
}

function startBgmPlayback() {
  const begin = () => {
    try { bgm.currentTime = AUDIO_START; } catch (e) {}
    bgm.volume = 0;
    const p = bgm.play();
    if (p && p.catch) p.catch((e) => console.warn('Autoplay musik diblokir:', e));
    fadeAudio(0, AUDIO_VOLUME, 1500);
  };
  if (bgm.readyState >= 1) begin();
  else bgm.addEventListener('loadedmetadata', begin, { once: true });
}

bgm.addEventListener('timeupdate', () => {
  if (bgm.paused) return;
  if (bgm.currentTime >= AUDIO_END) {
    bgm.pause();
    return;
  }
  const FADE_OUT_MS = 800;
  const remaining = (AUDIO_END - bgm.currentTime) * 1000;
  if (remaining <= FADE_OUT_MS && !bgm._fadingOut) {
    bgm._fadingOut = true;
    fadeAudio(bgm.volume, 0, FADE_OUT_MS);
  }
});

function pinGateButtons() {

  const rects = [gateYesBtn, gateNoBtn].map((btn) => btn.getBoundingClientRect());
  [gateYesBtn, gateNoBtn].forEach((btn, i) => {
    const r = rects[i];
    btn.style.position = 'fixed';
    btn.style.left = r.left + 'px';
    btn.style.top = r.top + 'px';
    btn.style.margin = '0';
  });
}
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => requestAnimationFrame(pinGateButtons));
} else {
  requestAnimationFrame(pinGateButtons);
}
setTimeout(pinGateButtons, 350);
window.addEventListener('resize', () => {
  if (!gateEl.classList.contains('hide')) {
    gateNoBtn.style.position = '';
    gateYesBtn.style.position = '';
    gateNoBtn.style.left = gateNoBtn.style.top = '';
    gateYesBtn.style.left = gateYesBtn.style.top = '';
    requestAnimationFrame(pinGateButtons);
  }
});

let lastDodgeAt = 0;
const DODGE_COOLDOWN_MS = 380;
function moveNoButtonAwayFrom(clientX, clientY) {
  const now = performance.now();
  if (now - lastDodgeAt < DODGE_COOLDOWN_MS) return;
  lastDodgeAt = now;

  const btn = gateNoBtn;
  requestAnimationFrame(() => {
    const w = btn.offsetWidth, h = btn.offsetHeight;
    const pad = 20;
    const maxX = Math.max(pad, window.innerWidth - w - pad);
    const maxY = Math.max(pad, window.innerHeight - h - pad);
    let x, y, tries = 0;
    do {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      tries++;
    } while (clientX != null && Math.hypot(x - clientX, y - clientY) < 120 && tries < 8);
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
  });
  playDodgeSound();
}

gateNoBtn.addEventListener('pointerenter', (e) => moveNoButtonAwayFrom(e.clientX, e.clientY));
gateNoBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); moveNoButtonAwayFrom(e.clientX, e.clientY); });
gateNoBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  moveNoButtonAwayFrom(t ? t.clientX : null, t ? t.clientY : null);
}, { passive: false });

document.addEventListener('pointermove', (e) => {
  if (gateEl.classList.contains('hide')) return;
  const r = gateNoBtn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (Math.hypot(e.clientX - cx, e.clientY - cy) < 70) {
    moveNoButtonAwayFrom(e.clientX, e.clientY);
  }
});

let gateDismissed = false;
gateYesBtn.addEventListener('click', () => {
  if (gateDismissed) return;
  gateDismissed = true;
  playYesSound();
  unlockAudio();
  gateEl.classList.add('hide');
  startLoadingSequence();
});

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050818);
scene.fog = new THREE.FogExp2(0x050818, 0.0032);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 22, 62);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = true;
controls.zoomSpeed = 0.9;
controls.rotateSpeed = 0.85;
controls.minDistance = 16;
controls.maxDistance = 260;
controls.minPolarAngle = Math.PI * 0.12;
controls.maxPolarAngle = Math.PI * 0.86;
controls.autoRotate = false;
controls.target.set(0, 2, 0);

const world = new THREE.Group();
scene.add(world);

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

const twinkleMaterials = [];
function addTwinkle(points, speed = 1.2, strength = 0.6) {
  const geometry = points.geometry;
  const material = points.material;
  const count = geometry.attributes.position.count;
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.6 + Math.random() * 0.9;
  }
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uSpeed = { value: speed };
    shader.uniforms.uStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPhase;\nattribute float aSpeed;\nuniform float uTime;\nuniform float uSpeed;\nuniform float uStrength;\nvarying float vTwinkle;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTwinkle = 1.0 - uStrength + uStrength * (0.5 + 0.5 * sin(uTime * uSpeed * aSpeed + aPhase * 6.2831852));')
      .replace('gl_PointSize = size;', 'gl_PointSize = size * (0.4 + 0.8 * vTwinkle);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTwinkle;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * mix(0.2, 1.0, vTwinkle) );');
    material.userData.shader = shader;
  };
  material.needsUpdate = true;
  twinkleMaterials.push(material);
}

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
addTwinkle(starsNear, 1.1, 0.75);
addTwinkle(starsFar, 0.8, 0.7);
scene.add(starsNear, starsFar);

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

function buildPlanet() {
  const COUNT = 15000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const deep = new THREE.Color(0x40000a);
  const mid = new THREE.Color(0x9c0f18);
  const bright = new THREE.Color(0xe23244);

  const SCALE = 0.62;
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const { x: bx, y: by } = heartPoint(t);
    const s = Math.cbrt(Math.random());
    const depth = Math.sqrt(Math.max(0, 1 - s * s)) * 8 * (0.45 + Math.random() * 0.55);

    const x = bx * s * SCALE;
    const y = (by + 4) * s * SCALE;
    const z = (Math.random() - 0.5) * depth * SCALE;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = new THREE.Color();
    if (s > 0.88) c.copy(bright); else if (s > 0.4) c.copy(mid); else c.copy(deep);
    c.offsetHSL((Math.random() - 0.5) * 0.015, 0, (Math.random() - 0.5) * 0.04);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.46, vertexColors: true, transparent: true, opacity: 0.97,
    depthWrite: false, blending: THREE.NormalBlending, map: dotTexture,
  });
  const points = new THREE.Points(geo, mat);
  points.position.y = 1.5;
  return points;
}

const planet = buildPlanet();
addTwinkle(planet, 1.6, 0.5);
world.add(planet);

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
addTwinkle(ring, 1.3, 0.6);
world.add(ring);

const manager = new THREE.LoadingManager();
manager.onError = (url) => console.warn('Gagal memuat:', url);

let assetsLoaded = false;
manager.onLoad = () => { assetsLoaded = true; requestHideLoading(); };

const texLoader = new THREE.TextureLoader(manager);

const photoTextures = [];
for (let i = 1; i <= PHOTO_COUNT; i++) {
  const tex = texLoader.load(`assets/photos/${i}.png`);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  photoTextures.push(tex);
}

const FLOATER_COUNT = 2000;
const RINGS = [
  { radius: 27, ySpread: 2.2, yCenter: -6 },
  { radius: 30, ySpread: 2.3, yCenter: -4 },
  { radius: 33.5, ySpread: 2.5, yCenter: -2 },
  { radius: 37, ySpread: 2.6, yCenter: 0 },
  { radius: 40.5, ySpread: 2.8, yCenter: 2 },
  { radius: 44, ySpread: 3, yCenter: 4 },
  { radius: 48, ySpread: 3.2, yCenter: 6 },
  { radius: 52, ySpread: 3.4, yCenter: 8 },
];
const perRing = Math.ceil(FLOATER_COUNT / RINGS.length);

const CARD_W = 1;
const CARD_H = CARD_W * (16 / 9);
const cardGeometry = new THREE.PlaneGeometry(CARD_W, CARD_H);

const perPhotoCapacity = Math.ceil(FLOATER_COUNT / PHOTO_COUNT) + 1;
const instancedMeshes = photoTextures.map((tex) => {
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(cardGeometry, mat, perPhotoCapacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  world.add(mesh);
  return mesh;
});

const floaters = [];
const dummy = new THREE.Object3D();

let floaterIndex = 0;
for (let ringIdx = 0; ringIdx < RINGS.length; ringIdx++) {
  const ring = RINGS[ringIdx];

  const ringOffset = (ringIdx / RINGS.length) * Math.PI * 2 * 0.33;

  for (let k = 0; k < perRing && floaterIndex < FLOATER_COUNT; k++, floaterIndex++) {
    const photoIdx = floaterIndex % PHOTO_COUNT;
    const mesh = instancedMeshes[photoIdx];
    const instanceId = mesh.count++;

    const scale = 1.05 + Math.random() * 0.6;

    const slice = (Math.PI * 2) / perRing;
    const angle = ringOffset + k * slice + (Math.random() - 0.5) * slice * 0.5;
    const radius = ring.radius + (Math.random() - 0.5) * 3;
    const baseY = ring.yCenter + (Math.random() - 0.5) * ring.ySpread;

    const facingY = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const tiltX = (Math.random() - 0.5) * 0.22;
    const tiltZ = (Math.random() - 0.5) * 0.18;

    const card = {
      mesh, instanceId,
      posX: Math.cos(angle) * radius,
      posZ: Math.sin(angle) * radius,
      scale,
      baseY,
      baseRotX: tiltX,
      baseRotZ: tiltZ,
      curRotY: facingY,
      spinSpeed: 0.05 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      bobSpeed: 0.4 + Math.random() * 0.5,
      bobAmp: 0.5 + Math.random() * 0.6,
      wobbleAmp: 0.06 + Math.random() * 0.05,
    };

    dummy.position.set(card.posX, card.baseY, card.posZ);
    dummy.rotation.set(card.baseRotX, card.curRotY, card.baseRotZ);
    dummy.scale.setScalar(card.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(instanceId, dummy.matrix);

    floaters.push(card);
  }
}
instancedMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });

function buildTitleCanvas(text) {
  const canvasEl = document.createElement('canvas');
  const W = 1800, H = 320;
  canvasEl.width = W; canvasEl.height = H;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f4f1ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "italic 500 96px 'Playfair Display', Georgia, serif";
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvasEl);
  tex.needsUpdate = true;
  return { tex, aspect: W / H };
}

function buildTitle(text) {
  const { tex, aspect } = buildTitleCanvas(text);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const height = 4.6;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), mat);
  mesh.position.set(0, 15.5, 0);
  return mesh;
}

let titleMesh = null;
document.fonts && document.fonts.ready
  ? document.fonts.ready.then(() => { titleMesh = buildTitle(TITLE_TEXT); world.add(titleMesh); })
  : (() => { titleMesh = buildTitle(TITLE_TEXT); world.add(titleMesh); })();

function buildRingLabelTexture(text) {
  const canvasEl = document.createElement('canvas');
  const W = 900, H = 220;
  canvasEl.width = W; canvasEl.height = H;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffd9de';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "italic 700 84px 'Playfair Display', Georgia, serif";
  ctx.shadowColor = 'rgba(255,70,90,0.65)';
  ctx.shadowBlur = 22;
  ctx.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvasEl);
  tex.needsUpdate = true;
  return { tex, aspect: W / H };
}

const textRingGroups = [];
function buildTextRing(text, radius, yPos, count, spinDir) {
  const { tex, aspect } = buildRingLabelTexture(text);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const h = 1.7;
  const w = h * aspect;
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    mesh.rotation.y = angle + Math.PI / 2;
    group.add(mesh);
  }
  group.position.y = yPos;
  group.userData = { baseY: yPos, spinSpeed: spinDir * (0.07 + Math.random() * 0.03), phase: Math.random() * Math.PI * 2 };
  textRingGroups.push(group);
  return group;
}

document.fonts && document.fonts.ready
  ? document.fonts.ready.then(() => {
      world.add(buildTextRing('LOPYUUU PIAAA', 10.5, 0.8, 6, 1));
      world.add(buildTextRing('LOPYUUU PIAAA', 11.5, -0.8, 5, -1));
    })
  : (() => {
      world.add(buildTextRing('LOPYUUU PIAAA', 10.5, 0.8, 6, 1));
      world.add(buildTextRing('LOPYUUU PIAAA', 11.5, -0.8, 5, -1));
    })();

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const TARGET_FIXED = new THREE.Vector3(0, 2, 0);

const INTRO_DUR = Math.max(3, AUDIO_EPIC - AUDIO_START) + 0.4;

const REST_OFFSET = camera.position.clone().sub(TARGET_FIXED);
const REST_RADIUS = REST_OFFSET.length();
const REST_POLAR = Math.acos(THREE.MathUtils.clamp(REST_OFFSET.y / REST_RADIUS, -1, 1));
const REST_AZIMUTH = Math.atan2(REST_OFFSET.x, REST_OFFSET.z);

function sphericalToPos(az, pol, r) {
  return new THREE.Vector3(
    TARGET_FIXED.x + r * Math.sin(pol) * Math.sin(az),
    TARGET_FIXED.y + r * Math.cos(pol),
    TARGET_FIXED.z + r * Math.sin(pol) * Math.cos(az)
  );
}

const FLY_KEYFRAMES = [
  { t: 0.00, az: REST_AZIMUTH + 3.4, pol: REST_POLAR - 0.50, r: REST_RADIUS + 260 },
  { t: 0.10, az: REST_AZIMUTH + 2.5, pol: REST_POLAR - 0.42, r: REST_RADIUS + 150 },
  { t: 0.20, az: REST_AZIMUTH + 1.6, pol: REST_POLAR - 0.15, r: REST_RADIUS + 70 },
  { t: 0.30, az: REST_AZIMUTH + 0.85, pol: REST_POLAR + 0.20, r: REST_RADIUS + 15 },
  { t: 0.40, az: REST_AZIMUTH + 0.30, pol: REST_POLAR - 0.10, r: REST_RADIUS - 25 },
  { t: 0.50, az: REST_AZIMUTH - 0.50, pol: REST_POLAR + 0.25, r: REST_RADIUS + 35 },
  { t: 0.60, az: REST_AZIMUTH - 1.00, pol: REST_POLAR - 0.05, r: REST_RADIUS - 15 },
  { t: 0.70, az: REST_AZIMUTH - 0.40, pol: REST_POLAR + 0.12, r: REST_RADIUS + 20 },
  { t: 0.80, az: REST_AZIMUTH + 0.15, pol: REST_POLAR - 0.04, r: REST_RADIUS - 8 },
  { t: 0.90, az: REST_AZIMUTH - 0.04, pol: REST_POLAR + 0.02, r: REST_RADIUS + 5 },
  { t: 1.00, az: REST_AZIMUTH, pol: REST_POLAR, r: REST_RADIUS },
];

function sampleFlyPath(p) {
  for (let i = 0; i < FLY_KEYFRAMES.length - 1; i++) {
    const a = FLY_KEYFRAMES[i], b = FLY_KEYFRAMES[i + 1];
    if (p >= a.t && p <= b.t) {
      const local = (p - a.t) / (b.t - a.t || 1);
      const e = easeInOutCubic(local);
      return {
        az: THREE.MathUtils.lerp(a.az, b.az, e),
        pol: THREE.MathUtils.lerp(a.pol, b.pol, e),
        r: THREE.MathUtils.lerp(a.r, b.r, e),
      };
    }
  }
  return FLY_KEYFRAMES[FLY_KEYFRAMES.length - 1];
}

controls.target.copy(TARGET_FIXED);
controls.enabled = false;
{
  const startPos = sphericalToPos(FLY_KEYFRAMES[0].az, FLY_KEYFRAMES[0].pol, FLY_KEYFRAMES[0].r);
  camera.position.copy(startPos);
  camera.lookAt(TARGET_FIXED);
}
world.scale.setScalar(0.001);
starsNear.material.opacity = 0;
starsFar.material.opacity = 0;
const STAR_NEAR_OP = 0.9, STAR_FAR_OP = 0.6;

let introStart = null;
let introFinished = false;
function startIntro() { introStart = performance.now(); startBgmPlayback(); }

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const MIN_LOADING_MS = 4000;
let PAGE_LOAD_START = null;
let loadingSequenceStarted = false;
let hidden = false;

const welcomeCardEl = document.getElementById('welcomeCard');
const getInBtn = document.getElementById('getInBtn');

function hideLoading() {
  if (hidden) return;
  hidden = true;
  loadingEl.classList.add('hide');
  welcomeCardEl.classList.add('show');
}

getInBtn.addEventListener('click', () => {
  welcomeCardEl.classList.remove('show');
  startIntro();
  setTimeout(() => {
    hintEl.classList.add('show');
    setTimeout(() => { hintEl.classList.remove('show'); }, 4200);
  }, INTRO_DUR * 1000 * 0.95);
});

function requestHideLoading() {
  if (!loadingSequenceStarted) return;
  const elapsed = performance.now() - PAGE_LOAD_START;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  setTimeout(hideLoading, remaining);
}

function startLoadingSequence() {
  loadingSequenceStarted = true;
  PAGE_LOAD_START = performance.now();

  setTimeout(hideLoading, MIN_LOADING_MS + 2500);

  if (assetsLoaded) requestHideLoading();

  (function tickLoadingBar() {
    const elapsed = performance.now() - PAGE_LOAD_START;
    const pct = Math.min(100, (elapsed / MIN_LOADING_MS) * 100);
    loadingFill.style.width = pct + '%';
    if (!hidden) requestAnimationFrame(tickLoadingBar);
  })();
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  let introP = 1;
  if (introStart !== null && !introFinished) {
    const elapsed = (performance.now() - introStart) / 1000;
    introP = Math.min(1, elapsed / INTRO_DUR);

    const fly = sampleFlyPath(introP);
    camera.position.copy(sphericalToPos(fly.az, fly.pol, fly.r));

    const rollDecay = 1 - easeOutCubic(introP);
    const roll = Math.sin(introP * Math.PI * 3.2) * 0.16 * rollDecay;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(TARGET_FIXED);

    const scaleP = Math.min(1, elapsed / 3.0);
    world.scale.setScalar(Math.max(0.001, easeOutBack(scaleP)));

    starsNear.material.opacity = STAR_NEAR_OP * Math.min(1, elapsed / 1.3);
    starsFar.material.opacity = STAR_FAR_OP * Math.min(1, elapsed / 1.8);

    if (introP >= 1) {
      introFinished = true;
      camera.up.set(0, 1, 0);
      world.scale.setScalar(1);
      starsNear.material.opacity = STAR_NEAR_OP;
      starsFar.material.opacity = STAR_FAR_OP;
      controls.enabled = true;
      controls.update();
    }
  }

  const spinUnwindP = introStart !== null
    ? Math.min(1, (performance.now() - introStart) / 1000 / 3.5)
    : 1;
  world.rotation.y = t * 0.09 + (1 - easeOutCubic(spinUnwindP)) * Math.PI * 3;
  world.rotation.x = Math.sin(t * 0.12) * 0.10;
  world.rotation.z = Math.cos(t * 0.09) * 0.05;

  if (titleMesh) {
    const parentQuat = new THREE.Quaternion().setFromEuler(world.rotation);
    titleMesh.quaternion.copy(parentQuat.clone().invert().multiply(camera.quaternion));
  }

  starsNear.rotation.y = t * 0.01;
  starsFar.rotation.y = -t * 0.006;

  for (const g of textRingGroups) {
    g.rotation.y += g.userData.spinSpeed * 0.016;
    g.position.y = g.userData.baseY + Math.sin(t * 0.35 + g.userData.phase) * 0.6;
  }

  for (const card of floaters) {
    const y = card.baseY + Math.sin(t * card.bobSpeed + card.phase) * card.bobAmp;

    card.curRotY += card.spinSpeed * 0.016;
    const rx = card.baseRotX + Math.sin(t * 0.5 + card.phase) * card.wobbleAmp;
    const rz = card.baseRotZ + Math.cos(t * 0.4 + card.phase) * card.wobbleAmp;

    dummy.position.set(card.posX, y, card.posZ);
    dummy.rotation.set(rx, card.curRotY, rz);
    dummy.scale.setScalar(card.scale);
    dummy.updateMatrix();
    card.mesh.setMatrixAt(card.instanceId, dummy.matrix);
  }
  for (const mesh of instancedMeshes) mesh.instanceMatrix.needsUpdate = true;

  for (const mat of twinkleMaterials) {
    if (mat.userData.shader) mat.userData.shader.uniforms.uTime.value = t;
  }

  if (controls.enabled) controls.update();
  renderer.render(scene, camera);
}

animate();
