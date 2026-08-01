
const TITLE_TEXT = "Only For U, Kakaaa Piaaaaa🤍";

const PHOTO_COUNT = 20;

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
const LESGO_SOUND_SRC = 'assets/audio/lesgo-sfx.mp3';

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

const lesgoSfx = new Audio(LESGO_SOUND_SRC);
lesgoSfx.preload = 'auto';
lesgoSfx.addEventListener('error', () => {
  console.warn('Sound effect tidak ditemukan/gagal dimuat:', LESGO_SOUND_SRC, '— letakkan file di', LESGO_SOUND_SRC);
});

function safePlay(el) {
  try { el.currentTime = 0; } catch (e) {}
  try {
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function playYesSound() { safePlay(yesSfx); }
function playDodgeSound() { safePlay(noSfx); }
function playLesgoSound() { safePlay(lesgoSfx); }

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

// iOS/mobile browsers can silently drop the WebGL context when the app is
// minimized (backgrounded) and then restored, especially with a heavier
// scene like this one. Without handling this, the canvas comes back with
// stale/empty GPU buffers — most visibly the heart planet's vertex-colored
// points rendering solid black. preventDefault() on "lost" tells the
// browser we want it restored; on "restored" we force every geometry
// attribute and material/texture to re-upload to the GPU.
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
}, false);
renderer.domElement.addEventListener('webglcontextrestored', () => {
  scene.traverse((obj) => {
    if (obj.geometry) {
      const attrs = obj.geometry.attributes;
      for (const key in attrs) attrs[key].needsUpdate = true;
    }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        m.needsUpdate = true;
        if (m.map) m.map.needsUpdate = true;
      }
    }
  });
}, false);

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
controls.zoomSpeed = 1.3;
controls.rotateSpeed = 0.85;
controls.minDistance = 16;
controls.maxDistance = 520;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.86;
controls.autoRotate = false;
controls.target.set(0, 2, 0);

const world = new THREE.Group();
scene.add(world);

// Only the photo cards use a lit material (MeshStandardMaterial); everything
// else in the scene (points, sprites) is unlit and unaffected by these.
const ambientLight = new THREE.AmbientLight(0xfff6ec, 0.65);
scene.add(ambientLight);
const keyLight = new THREE.DirectionalLight(0xfff2d8, 1.0);
keyLight.position.set(40, 70, 35);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9fc2ff, 0.4);
fillLight.position.set(-45, -15, -30);
scene.add(fillLight);

function makeDotTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.65)');
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
  const flickers = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.6 + Math.random() * 0.9;
    flickers[i] = 0.15 + Math.random() * 0.4;
  }
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aFlicker', new THREE.BufferAttribute(flickers, 1));

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uSpeed = { value: speed };
    shader.uniforms.uStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPhase;\nattribute float aSpeed;\nattribute float aFlicker;\nuniform float uTime;\nuniform float uSpeed;\nuniform float uStrength;\nvarying float vTwinkle;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n' +
        'float twBase = 0.5 + 0.5 * sin(uTime * uSpeed * aSpeed + aPhase * 6.2831852);\n' +
        'float twBeat = 0.5 + 0.5 * sin(uTime * uSpeed * aFlicker * 3.1 + aPhase * 3.7);\n' +
        'float twCombined = pow(twBase * twBeat, 1.6);\n' +
        'vTwinkle = 1.0 - uStrength + uStrength * twCombined;'
      )
      .replace('gl_PointSize = size;', 'gl_PointSize = size * (0.35 + 0.9 * vTwinkle);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTwinkle;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * mix(0.12, 1.0, vTwinkle) );');
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
addTwinkle(starsNear, 1.1, 0.55);
addTwinkle(starsFar, 0.9, 0.5);
scene.add(starsNear, starsFar);

function makeGlowSprite(colorHex, size, x, y, z, opacity) {
  // NOTE: ctx.createRadialGradient() gets dithered by some browsers (notably
  // iOS Safari) to avoid banding, which shows up as visible speckle/dot
  // noise once the texture is stretched across a huge sprite. Writing the
  // pixels ourselves avoids that dithering entirely, giving a clean glow.
  const RES = 512;
  const c = document.createElement('canvas');
  c.width = c.height = RES;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(RES, RES);
  const col = new THREE.Color(colorHex);
  const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
  const cx = RES / 2, cy = RES / 2, maxD = RES / 2;
  for (let py = 0; py < RES; py++) {
    for (let px = 0; px < RES; px++) {
      const dx = px - cx, dy = py - cy;
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / maxD);
      const a = Math.max(0, opacity * Math.pow(1 - d, 2.2));
      const idx = (py * RES + px) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  sprite.position.set(x, y, z);
  return sprite;
}

const nebulaColors = [
  0x9b5cff, // violet
  0x33e6a8, // emerald teal
  0xffb23f, // warm gold
  0xff5f7e, // rose red
  0x4f8dff, // ocean blue
  0xff5cd0, // magenta pink
  0x6de1ff, // cyan
  0xffd166, // soft amber
  0xb388ff, // lavender
];
const nebulaSprites = [];
for (let i = 0; i < nebulaColors.length; i++) {
  const angle = (i / nebulaColors.length) * Math.PI * 2 + Math.random() * 0.5;
  // only a touch brighter than the original ambient look — this is
  // background glow, the focused light on the planet comes from the
  // dedicated backlight sprite below, not from brightening everything.
  const dist = 320 + Math.random() * 140;
  const sprite = makeGlowSprite(
    nebulaColors[i],
    380 + Math.random() * 160,
    Math.cos(angle) * dist,
    (Math.random() - 0.5) * 160,
    Math.sin(angle) * dist,
    0.30 + Math.random() * 0.08
  );
  sprite.userData = { phase: Math.random() * Math.PI * 2, speed: 0.05 + Math.random() * 0.05, opacityMult: 1 };
  nebulaSprites.push(sprite);
  scene.add(sprite);
}

// A dedicated warm glow tucked just behind the heart planet — this is the
// "spotlight" that should read as actually illuminating it. It's added to
// `world` (not `scene`) so it rotates and scales together with the planet;
// adding it to the static scene was the bug that made it drift away from
// the planet and end up floating among the photos as the scene spins.
const planetBacklight = makeGlowSprite(0xffb347, 190, 0, 6, -70, 0.9);
planetBacklight.userData = { phase: 0, speed: 0.04, opacityMult: 1.7 };
nebulaSprites.push(planetBacklight);
world.add(planetBacklight);

const shootingStarGeo = new THREE.BufferGeometry();
const SHOOTING_STAR_SEGMENTS = 28;
shootingStarGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SHOOTING_STAR_SEGMENTS * 3), 3));
const shootingStarMat = new THREE.LineBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
});
const shootingStarLine = new THREE.Line(shootingStarGeo, shootingStarMat);
scene.add(shootingStarLine);

const shootingStarHeadGeo = new THREE.BufferGeometry();
shootingStarHeadGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
const shootingStarHeadMat = new THREE.PointsMaterial({
  color: 0xffffff, size: 3.6, map: dotTexture, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const shootingStarHead = new THREE.Points(shootingStarHeadGeo, shootingStarHeadMat);
scene.add(shootingStarHead);

const SHOOTING_STAR_COLORS = [0xffffff, 0x7ff2ff, 0xffcf5c, 0xff6fd8, 0xa07cff, 0x7dffb0, 0xff8f6f];

let shootingStar = null;
function spawnShootingStar() {
  const startAngle = Math.random() * Math.PI * 2;
  const startHeight = 40 + Math.random() * 70;
  const startDist = 190 + Math.random() * 90;
  const start = new THREE.Vector3(Math.cos(startAngle) * startDist, startHeight, Math.sin(startAngle) * startDist);

  // aim through a point close to the planet, not just a distant background streak
  const target = new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 16);
  const dir = target.clone().sub(start).normalize();

  const color = SHOOTING_STAR_COLORS[Math.floor(Math.random() * SHOOTING_STAR_COLORS.length)];
  shootingStarMat.color.set(color);
  shootingStarHeadMat.color.set(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.55));

  shootingStar = { start, dir, speed: 140 + Math.random() * 40, life: 0, dur: 2.4 + Math.random() * 0.5 };
}
let nextShootingStarAt = 5;

function buildPlanet() {
  const COUNT = 32000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const deep = new THREE.Color(0x5a000d);
  const mid = new THREE.Color(0xb8001f);

  const SCALE = 8.6;
  const BOUND_X = 1.35, BOUND_Y_TOP = 1.25, BOUND_Y_BOTTOM = 1.5;

  let filled = 0;
  let guard = 0;
  while (filled < COUNT && guard < COUNT * 40) {
    guard++;
    const x = (Math.random() * 2 - 1) * BOUND_X;
    const yRaw = Math.random() * (BOUND_Y_TOP + BOUND_Y_BOTTOM) - BOUND_Y_BOTTOM;
    const yImplicit = yRaw;
    const a = x * x + yImplicit * yImplicit - 1;
    const inside = a * a * a - x * x * yImplicit * yImplicit * yImplicit <= 0;
    if (!inside) continue;

    const localWidth = 1 - Math.min(1, Math.abs(yRaw) / BOUND_Y_BOTTOM) * 0.4;
    const depth = (0.5 + Math.random() * 0.5) * 2.6 * localWidth;

    const i = filled;
    positions[i * 3] = x * SCALE;
    positions[i * 3 + 1] = yRaw * SCALE;
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth * SCALE * 0.34;

    // same red tone everywhere (matches the outer/edge color) so there's
    // no radial-gradient "circle" showing through the middle of the heart
    const c = mid.clone().lerp(deep, Math.random() * 0.35);
    c.offsetHSL((Math.random() - 0.5) * 0.012, 0.04, (Math.random() - 0.5) * 0.05);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    filled++;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.58, vertexColors: true, transparent: true, opacity: 0.99,
    depthWrite: false, blending: THREE.NormalBlending, map: dotTexture,
  });
  const points = new THREE.Points(geo, mat);
  points.position.y = 1.5;
  return points;
}

const planet = buildPlanet();
addTwinkle(planet, 1.9, 0.62);
world.add(planet);

function buildRing() {
  const COUNT = 9500;
  const rInner = 15.5, rOuter = 26;
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
addTwinkle(ring, 1.6, 0.72);
ring.renderOrder = 1;
world.add(ring);
planet.renderOrder = 2;

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

// --- Photo layout ---
// Nothing floats near the heart planet itself — every photo sits outside
// the white ring. Density is naturally highest just past the ring (so it
// still reads as a boundary around it) and smoothly thins out further away,
// using one continuous random distribution instead of separate zones, so
// there's no hard seam and no perfectly-touching "grid" look — just a
// natural gradient that blends into the rest of the photos.

const RING_OUTER = 26; // must match buildRing()
const FIELD_R_MIN = RING_OUTER + 6; // bigger clear gap before photos start
const FIELD_R_MAX = 125;
const FIELD_R_BIAS = 1.45; // gentler bias than before — still denser near FIELD_R_MIN but not clustered/touching

const FLOATER_COUNT = 6000;

const CARD_W = 1;
const CARD_H = CARD_W * (16 / 9);
const CARD_DEPTH = 0.07;
const cardGeometry = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_DEPTH);

const perPhotoCapacity = Math.ceil(FLOATER_COUNT / PHOTO_COUNT) + 1;
const instancedMeshes = photoTextures.map((tex) => {
  const photoMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.04 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xf3ecdf, roughness: 0.75, metalness: 0.02 });
  // BoxGeometry face group order: +x,-x,+y,-y,+z,-z — front/back get the
  // photo, the 4 thin side faces get a plain card-stock edge color.
  const materials = [edgeMat, edgeMat, edgeMat, edgeMat, photoMat, photoMat];
  const mesh = new THREE.InstancedMesh(cardGeometry, materials, perPhotoCapacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  world.add(mesh);
  return mesh;
});

const photoAssignment = [];
for (let p = 0; p < PHOTO_COUNT; p++) {
  for (let k = 0; k < Math.ceil(FLOATER_COUNT / PHOTO_COUNT); k++) photoAssignment.push(p);
}
for (let i = photoAssignment.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [photoAssignment[i], photoAssignment[j]] = [photoAssignment[j], photoAssignment[i]];
}
for (let i = 1; i < photoAssignment.length; i++) {
  if (photoAssignment[i] === photoAssignment[i - 1]) {
    const swapWith = (i + 7) % photoAssignment.length;
    if (photoAssignment[swapWith] !== photoAssignment[i - 1]) {
      [photoAssignment[i], photoAssignment[swapWith]] = [photoAssignment[swapWith], photoAssignment[i]];
    }
  }
}

const floaters = [];
const dummy = new THREE.Object3D();

for (let i = 0; i < FLOATER_COUNT; i++) {
  const photoIdx = photoAssignment[i];
  const mesh = instancedMeshes[photoIdx];
  const instanceId = mesh.count++;

  const depthT = Math.pow(Math.random(), FIELD_R_BIAS);
  const radius = FIELD_R_MIN + depthT * (FIELD_R_MAX - FIELD_R_MIN);
  const angle = Math.random() * Math.PI * 2;
  // tighter vertical spread near the ring (keeps the "boundary" feel there),
  // opening up gradually further out for natural depth
  const baseY = (Math.random() - 0.5) * (2.6 + depthT * 11);
  const scale = 0.75 + Math.random() * 0.85;
  const posX = Math.cos(angle) * radius;
  const posZ = Math.sin(angle) * radius;
  const facingY = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.7;
  const tiltX = (Math.random() - 0.5) * 0.26;
  const tiltZ = (Math.random() - 0.5) * 0.22;
  const bobAmp = 0.4 + Math.random() * 0.6;
  const wobbleAmp = 0.05 + Math.random() * 0.06;
  const spinSpeed = 0.04 + Math.random() * 0.06;

  const card = {
    mesh, instanceId,
    posX, posZ,
    scale,
    baseY,
    baseRotX: tiltX,
    baseRotZ: tiltZ,
    curRotY: facingY,
    spinSpeed,
    phase: Math.random() * Math.PI * 2,
    bobSpeed: 0.4 + Math.random() * 0.5,
    bobAmp,
    wobbleAmp,
  };

  dummy.position.set(card.posX, card.baseY, card.posZ);
  dummy.rotation.set(card.baseRotX, card.curRotY, card.baseRotZ);
  dummy.scale.setScalar(card.scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(instanceId, dummy.matrix);

  floaters.push(card);
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
  { t: 0.00, az: REST_AZIMUTH + 3.4, pol: REST_POLAR - 0.28, r: REST_RADIUS + 90 },
  { t: 0.10, az: REST_AZIMUTH + 2.5, pol: REST_POLAR - 0.24, r: REST_RADIUS + 60 },
  { t: 0.20, az: REST_AZIMUTH + 1.6, pol: REST_POLAR - 0.10, r: REST_RADIUS + 35 },
  { t: 0.30, az: REST_AZIMUTH + 0.85, pol: REST_POLAR + 0.15, r: REST_RADIUS + 10 },
  { t: 0.40, az: REST_AZIMUTH + 0.30, pol: REST_POLAR - 0.07, r: REST_RADIUS - 18 },
  { t: 0.50, az: REST_AZIMUTH - 0.50, pol: REST_POLAR + 0.18, r: REST_RADIUS + 22 },
  { t: 0.60, az: REST_AZIMUTH - 1.00, pol: REST_POLAR - 0.04, r: REST_RADIUS - 10 },
  { t: 0.70, az: REST_AZIMUTH - 0.40, pol: REST_POLAR + 0.09, r: REST_RADIUS + 14 },
  { t: 0.80, az: REST_AZIMUTH + 0.15, pol: REST_POLAR - 0.03, r: REST_RADIUS - 6 },
  { t: 0.90, az: REST_AZIMUTH - 0.04, pol: REST_POLAR + 0.02, r: REST_RADIUS + 4 },
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
const loadingProgressEl = document.getElementById('loadingProgress');
const LOADING_PHOTO_TOTAL = 20;

function hideLoading() {
  if (hidden) return;
  hidden = true;
  loadingEl.classList.add('hide');
  welcomeCardEl.classList.add('show');
}

const LESGO_DELAY_MS = 700;
getInBtn.addEventListener('click', () => {
  if (getInBtn.disabled) return;
  getInBtn.disabled = true;
  playLesgoSound();
  setTimeout(() => {
    welcomeCardEl.classList.remove('show');
    startIntro();
    setTimeout(() => {
      hintEl.classList.add('show');
      setTimeout(() => { hintEl.classList.remove('show'); }, 4200);
    }, INTRO_DUR * 1000 * 0.95);
  }, LESGO_DELAY_MS);
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
    const step = Math.min(LOADING_PHOTO_TOTAL, Math.floor((elapsed / MIN_LOADING_MS) * LOADING_PHOTO_TOTAL) + 1);
    loadingProgressEl.textContent = `Mengunduh foto manusya cantiq ${step}/${LOADING_PHOTO_TOTAL}`;
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

  for (const sp of nebulaSprites) {
    const mat = sp.material;
    const mult = sp.userData.opacityMult || 1;
    mat.opacity = mult * (0.34 + 0.09 * Math.sin(t * sp.userData.speed + sp.userData.phase));
  }

  if (introFinished) {
    nextShootingStarAt -= (t - (animate._lastT || t));
    if (nextShootingStarAt <= 0 && !shootingStar) {
      spawnShootingStar();
      nextShootingStarAt = 5;
    }
  }
  animate._lastT = t;

  if (shootingStar) {
    shootingStar.life += 1 / 60;
    const p = shootingStar.life / shootingStar.dur;
    if (p >= 1) {
      shootingStar = null;
      shootingStarMat.opacity = 0;
      shootingStarHeadMat.opacity = 0;
    } else {
      const headPos = shootingStar.start.clone().addScaledVector(shootingStar.dir, shootingStar.speed * shootingStar.life);
      const posAttr = shootingStarGeo.attributes.position;
      for (let s = 0; s < SHOOTING_STAR_SEGMENTS; s++) {
        const trailBack = (s / (SHOOTING_STAR_SEGMENTS - 1)) * 22;
        const trailPos = headPos.clone().addScaledVector(shootingStar.dir, -trailBack);
        posAttr.setXYZ(s, trailPos.x, trailPos.y, trailPos.z);
      }
      posAttr.needsUpdate = true;
      const fadeIn = Math.min(1, p / 0.12);
      const fadeOut = Math.min(1, (1 - p) / 0.25);
      const alpha = Math.min(fadeIn, fadeOut);
      shootingStarMat.opacity = alpha * 0.85;
      shootingStarHeadMat.opacity = alpha;
      shootingStarHeadGeo.attributes.position.setXYZ(0, headPos.x, headPos.y, headPos.z);
      shootingStarHeadGeo.attributes.position.needsUpdate = true;
    }
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
