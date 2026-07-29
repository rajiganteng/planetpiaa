// ============================================================
// ONLY FOR U — dunia kecil 3D berisi kenangan
// ------------------------------------------------------------
// GANTI DI SINI kalau mau ubah teks judul (bisa dibaca dari depan & belakang):
const TITLE_TEXT = "Only For U, Kakaaa Piaaaaa🤍";
// Jumlah foto sumber yang dipakai (assets/photos/1.png .. N.png)
const PHOTO_COUNT = 10;

// ---- musik ----
// Ganti assets/audio/song.mp3 dengan lagu aslimu (nama file boleh sama persis).
// Lagu akan mulai diputar dari detik AUDIO_START, dan otomatis berhenti di
// detik AUDIO_END. AUDIO_EPIC menandai momen "epic" di lagu — animasi masuk
// planet akan pas selesai/menetap tepat di detik itu.
const AUDIO_SRC = 'assets/audio/song.mp3';
const AUDIO_START = 36;   // 0:36
const AUDIO_EPIC = 46;    // 0:46 — bagian epic, animasi intro menetap di sini
const AUDIO_END = 199;    // 3:19 — lagu berhenti di sini
const AUDIO_VOLUME = 0.85;
// ============================================================

import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const canvas = document.getElementById('scene');
const loadingEl = document.getElementById('loading');
const loadingFill = document.getElementById('loadingFill');
const hintEl = document.getElementById('hint');
const gateEl = document.getElementById('gate');
const gateYesBtn = document.getElementById('gateYes');
const gateNoBtn = document.getElementById('gateNo');

// ============================================================
// GATE / GERBANG — "mau lihat cewe tercantik di dunia gak?"
// the "no" button dodges away so it can never actually be pressed.
// Little synthesized sound effects play on each button (no external audio
// file needed): a springy comedic "boiiing" for the dodge, and a cheerful
// little chime for "mauuu😍".
// ============================================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}
// Runs `playFn(ctx)` once the context is actually running. Resuming a
// suspended AudioContext is ASYNC — starting oscillators immediately after
// calling .resume() without waiting for it to finish is one of the ways
// these sound effects were intermittently going silent.
function withRunningAudio(playFn) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'running') playFn(ctx);
  else ctx.resume().then(() => playFn(ctx)).catch(() => {});
}

function playDodgeSound() {
  withRunningAudio((ctx) => {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const gain = ctx.createGain();

    // fast wobble (vibrato) layered on a falling pitch = comedic "boiiing"
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(32, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(70, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.34);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.24, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain).connect(ctx.destination);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.4);
    osc.stop(now + 0.4);
  });
}

function playYesSound() {
  withRunningAudio((ctx) => {
    const now = ctx.currentTime;

    // soft little "pop" attack, like a bubble
    const pop = ctx.createOscillator();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(280, now);
    pop.frequency.exponentialRampToValueAtTime(520, now + 0.07);
    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    popGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.1);
    pop.connect(popGain).connect(ctx.destination);
    pop.start(now);
    pop.stop(now + 0.11);

    // bright sparkly ascending "coin/ding" notes — like a little game
    // pickup sound — spaced apart enough to stay crisp instead of blurring
    const notes = [784.0, 987.77, 1318.5, 1567.98]; // G5, B5, E6, G6
    notes.forEach((freq, i) => {
      const t0 = now + 0.09 + i * 0.11;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.16);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    });
  });
}

// ============================================================
// MUSIK — dimulai bertepatan dengan animasi masuk ke planet utama.
// ============================================================
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
  // Playing (then immediately pausing) inside a real user-gesture handler
  // "unlocks" the element so later programmatic .play() calls (e.g. after
  // the loading screen, with no fresh gesture) are still allowed — this
  // matters especially on iOS Safari.
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

// Pin BOTH buttons to fixed pixel positions right away (matching their
// natural flex layout). This is what keeps "mauuu😍" perfectly still —
// if only the "no" button switched to position:fixed, removing it from the
// flex flow would leave "mauuu😍" alone in the row and the browser would
// re-center it, making it look like it moved.
function pinGateButtons() {
  // measure BOTH rects first, before touching any styles — if we pin one
  // button then measure the next, the first pin already removed it from
  // the flex flow, so the second button's measured position would be
  // wrong (this was the cause of the two buttons ending up overlapping).
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
setTimeout(pinGateButtons, 350); // safety net in case fonts.ready is slow/unavailable
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
function moveNoButtonAwayFrom(clientX, clientY, playSound) {
  const now = performance.now();
  if (now - lastDodgeAt < DODGE_COOLDOWN_MS) return; // avoid spamming sound/movement
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
  // IMPORTANT: only play the sound when this dodge was triggered by a real
  // press attempt (pointerdown/touchstart) — hover-ish events like
  // pointerenter/pointermove are NOT treated as a "user gesture" by
  // browsers, so trying to play audio from those intermittently gets
  // silently blocked. Movement still happens either way; sound is reserved
  // for genuine tap/click attempts so it's reliable every time.
  if (playSound) playDodgeSound();
}

gateNoBtn.addEventListener('pointerenter', (e) => moveNoButtonAwayFrom(e.clientX, e.clientY, false));
gateNoBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); moveNoButtonAwayFrom(e.clientX, e.clientY, true); });
gateNoBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  moveNoButtonAwayFrom(t ? t.clientX : null, t ? t.clientY : null, true);
}, { passive: false });
// also dodge a bit before the pointer even reaches it, on desktop (silent —
// see note above)
document.addEventListener('pointermove', (e) => {
  if (gateEl.classList.contains('hide')) return;
  const r = gateNoBtn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (Math.hypot(e.clientX - cx, e.clientY - cy) < 70) {
    moveNoButtonAwayFrom(e.clientX, e.clientY, false);
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
controls.zoomSpeed = 0.9;
controls.rotateSpeed = 0.85;
controls.minDistance = 15;
controls.maxDistance = 100;
controls.minPolarAngle = Math.PI * 0.12;
controls.maxPolarAngle = Math.PI * 0.86;
controls.autoRotate = false;
controls.target.set(0, 2, 0);

// world group: everything that slowly tumbles together
const world = new THREE.Group();
scene.add(world);

// ---------- soft circular sprite texture (keeps particles round, not blocky) ----------
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

// ---------- per-particle "twinkle" shimmer (position never changes, only
// size/brightness gently pulses per-particle) so the star/ring/planet dots
// don't look flat and static ----------
const twinkleMaterials = [];
function addTwinkle(points, speed = 1.2, strength = 0.4) {
  const geometry = points.geometry;
  const material = points.material;
  const count = geometry.attributes.position.count;
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) phases[i] = Math.random() * Math.PI * 2;
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uSpeed = { value: speed };
    shader.uniforms.uStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPhase;\nuniform float uTime;\nuniform float uSpeed;\nuniform float uStrength;\nvarying float vTwinkle;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTwinkle = 1.0 - uStrength + uStrength * (0.5 + 0.5 * sin(uTime * uSpeed + aPhase * 6.2831852));')
      .replace('gl_PointSize = size;', 'gl_PointSize = size * vTwinkle;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTwinkle;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * mix(0.55, 1.0, vTwinkle) );');
    material.userData.shader = shader;
  };
  material.needsUpdate = true;
  twinkleMaterials.push(material);
}

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
addTwinkle(starsNear, 0.9, 0.5);
addTwinkle(starsFar, 0.6, 0.45);
scene.add(starsNear, starsFar);

// ---------- heart-shaped particle planet — dense, deep red ("merah pekat") ----------
function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

function buildPlanet() {
  const COUNT = 15000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  // dense/solid red palette — kept in the red family only (no orange/yellow)
  // so the planet reads as "merah pekat" rather than a glowing sun.
  const deep = new THREE.Color(0x40000a);
  const mid = new THREE.Color(0x9c0f18);
  const bright = new THREE.Color(0xe23244);

  const SCALE = 0.62;
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const { x: bx, y: by } = heartPoint(t);
    const s = Math.cbrt(Math.random()); // 0 core -> 1 surface, volume-filled
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
addTwinkle(planet, 1.4, 0.35);
world.add(planet);

// ---------- ring / disc of pale particles around the planet ----------
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
addTwinkle(ring, 1.1, 0.4);
world.add(ring);

// ---------- floating photo cards (9:16, portrait, small) ----------
// PERFORMANCE NOTE: with 300+ cards, creating one THREE.Mesh per card (each
// needing up to 6 draw calls for a multi-material box) got very slow —
// hundreds/thousands of draw calls per frame. Instead we use ONE
// THREE.InstancedMesh PER SOURCE PHOTO (so only PHOTO_COUNT = 10 draw calls
// total, no matter how many cards there are), and move each card by
// updating its instance matrix every frame. Cards are simple double-sided
// planes (photo visible from front AND back) rather than boxes, which is
// both cheaper and avoids the "blank white back" problem entirely.
const manager = new THREE.LoadingManager();
manager.onError = (url) => console.warn('Gagal memuat:', url);
// Attach onLoad right away (not later, on the gate button click) — otherwise
// if these tiny textures finish loading while the user is still deciding on
// the gate screen, the completion event would fire with no listener attached
// and get missed entirely, leaving the loading screen stuck on the safety net.
let assetsLoaded = false;
manager.onLoad = () => { assetsLoaded = true; requestHideLoading(); };

const texLoader = new THREE.TextureLoader(manager);

// Preload each of the 10 source photos ONCE and reuse the texture object
// across many small floating cards — this is how we get "banyak foto"
// (lots of photos on screen) without re-downloading the same image over
// and over.
const photoTextures = [];
for (let i = 1; i <= PHOTO_COUNT; i++) {
  const tex = texLoader.load(`assets/photos/${i}.png`);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  photoTextures.push(tex);
}

// How many floating photo-cards to scatter in total. This is intentionally
// MORE than PHOTO_COUNT — the same 10 source photos get reused/randomized
// across many small floating cards.
//
// Positioning uses evenly-spaced angles across a few concentric "rings" at
// different radius/height (with jitter for an organic feel) instead of
// random clusters — that guarantees the photos actually surround the whole
// planet with no big empty gaps, instead of randomly clumping on one side.
//
// IMPORTANT: these radii start well past the white particle ring's outer
// edge (rOuter = 25 in buildRing above) — photos form their OWN layer
// surrounding the white dots from further out, instead of sitting on top
// of / overlapping them.
const FLOATER_COUNT = 400;
const RINGS = [
  { radius: 28, ySpread: 3, yCenter: -2 },
  { radius: 34, ySpread: 3.6, yCenter: 0.5 },
  { radius: 41, ySpread: 4.2, yCenter: 3 },
];
const perRing = Math.ceil(FLOATER_COUNT / RINGS.length);

// 9:16 portrait card — width:height = 9:16
const CARD_W = 1;
const CARD_H = CARD_W * (16 / 9);
const cardGeometry = new THREE.PlaneGeometry(CARD_W, CARD_H);

// one InstancedMesh per source photo
const perPhotoCapacity = Math.ceil(FLOATER_COUNT / PHOTO_COUNT) + 1;
const instancedMeshes = photoTextures.map((tex) => {
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(cardGeometry, mat, perPhotoCapacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0; // grows as we assign cards below
  world.add(mesh);
  return mesh;
});

const floaters = []; // per-card animation state
const dummy = new THREE.Object3D();

let floaterIndex = 0;
for (let ringIdx = 0; ringIdx < RINGS.length; ringIdx++) {
  const ring = RINGS[ringIdx];
  // stagger each ring's starting angle so the rings don't all line up radially
  const ringOffset = (ringIdx / RINGS.length) * Math.PI * 2 * 0.33;

  for (let k = 0; k < perRing && floaterIndex < FLOATER_COUNT; k++, floaterIndex++) {
    const photoIdx = floaterIndex % PHOTO_COUNT; // even spread across the 10 textures
    const mesh = instancedMeshes[photoIdx];
    const instanceId = mesh.count++;

    const scale = 1.0 + Math.random() * 0.55;

    // evenly spaced base angle within this ring + gentle jitter — this is
    // what guarantees full 360° coverage around the planet
    const slice = (Math.PI * 2) / perRing;
    const angle = ringOffset + k * slice + (Math.random() - 0.5) * slice * 0.5;
    const radius = ring.radius + (Math.random() - 0.5) * 3;
    const baseY = ring.yCenter + (Math.random() - 0.5) * ring.ySpread;

    // Face roughly outward/inward with only a SMALL random tilt — enough for
    // an organic, non-uniform look, but never enough to flip the card
    // upside down or edge-on (that's what read as "kebalik" before).
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
      spinSpeed: 0.05 + Math.random() * 0.06, // slow, steady, upright-preserving spin
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

// ---------- title text — always faces the camera (billboard) ----------
// Stays positioned above the tumbling planet (it's still a child of
// `world`, so it orbits along with the planet's slow tumble), but each
// frame we cancel out the parent's rotation on its ORIENTATION only, so the
// text itself always faces the camera directly and is never upside down or
// mirrored.
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

// ---------- cinematic intro animation: multi-phase camera flythrough ----------
// Instead of a single straight dolly-in, the camera swoops toward the planet
// along a curved path, overshoots, swings back out, does a smaller second
// bounce, then settles — all choreographed to land exactly on the "epic"
// moment in the music (AUDIO_EPIC).
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const TARGET_FIXED = new THREE.Vector3(0, 2, 0);
// intro runs exactly as long as it takes the music to go from AUDIO_START to
// AUDIO_EPIC, so the flythrough finishes right as the "epic" part hits
const INTRO_DUR = Math.max(3, AUDIO_EPIC - AUDIO_START) + 0.4;

// describe the camera's resting position (where it ends up / where
// OrbitControls takes over) in spherical terms around TARGET_FIXED
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

// keyframes: [time fraction, azimuth, polar, radius]
// swoop in from far away -> overshoot past the planet -> swing back out the
// other side -> smaller second bounce -> settle at the resting spot
const FLY_KEYFRAMES = [
  { t: 0.00, az: REST_AZIMUTH + 2.6, pol: REST_POLAR - 0.35, r: REST_RADIUS + 210 },
  { t: 0.22, az: REST_AZIMUTH + 1.1, pol: REST_POLAR + 0.10, r: REST_RADIUS + 30 },
  { t: 0.38, az: REST_AZIMUTH + 0.5, pol: REST_POLAR - 0.06, r: REST_RADIUS - 22 },   // overshoot closer
  { t: 0.55, az: REST_AZIMUTH - 0.4, pol: REST_POLAR + 0.08, r: REST_RADIUS + 26 },   // bolak-balik: swing back out + other side
  { t: 0.72, az: REST_AZIMUTH + 0.12, pol: REST_POLAR - 0.03, r: REST_RADIUS - 10 },  // smaller second bounce in
  { t: 0.88, az: REST_AZIMUTH - 0.03, pol: REST_POLAR + 0.015, r: REST_RADIUS + 5 },
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

// ---------- resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// LOADING SEQUENCE — only starts once the gate has been dismissed with
// "mauuu😍". Kept on screen for a guaranteed minimum time (~4s) so the
// spinning-planet loading animation actually gets seen, regardless of how
// fast the (tiny) photo assets finish downloading.
// ============================================================
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
  if (!loadingSequenceStarted) return; // gate not dismissed yet — ignore for now
  const elapsed = performance.now() - PAGE_LOAD_START;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  setTimeout(hideLoading, remaining);
}

function startLoadingSequence() {
  loadingSequenceStarted = true;
  PAGE_LOAD_START = performance.now();
  // safety net in case something never fires onLoad (e.g. a missing photo file)
  setTimeout(hideLoading, MIN_LOADING_MS + 2500);
  // if the (tiny) textures already finished loading while the gate was up,
  // kick the countdown off immediately instead of waiting on an event that
  // already fired in the past
  if (assetsLoaded) requestHideLoading();

  (function tickLoadingBar() {
    const elapsed = performance.now() - PAGE_LOAD_START;
    const pct = Math.min(100, (elapsed / MIN_LOADING_MS) * 100);
    loadingFill.style.width = pct + '%';
    if (!hidden) requestAnimationFrame(tickLoadingBar);
  })();
}

// ---------- animation loop ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // -------- intro: multi-phase camera flythrough + planet "pop" + starfield fade --------
  // IMPORTANT: this block must stop touching camera.position/lookAt once the
  // intro is finished, otherwise it fights OrbitControls every frame and the
  // view looks "stuck" (can't be dragged) even though controls are enabled.
  let introP = 1; // 1 = fully settled
  if (introStart !== null && !introFinished) {
    const elapsed = (performance.now() - introStart) / 1000;
    introP = Math.min(1, elapsed / INTRO_DUR);

    const fly = sampleFlyPath(introP);
    camera.position.copy(sphericalToPos(fly.az, fly.pol, fly.r));
    camera.lookAt(TARGET_FIXED);

    // the planet itself "pops" into being fairly quickly (first ~3s),
    // while the camera keeps swooping around it for the rest of the intro
    const scaleP = Math.min(1, elapsed / 3.0);
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

  // extra unwind spin resolves within the first few seconds, independent of
  // the overall (now longer) intro duration, then settles into a slow tumble
  const spinUnwindP = introStart !== null
    ? Math.min(1, (performance.now() - introStart) / 1000 / 3.5)
    : 1;
  world.rotation.y = t * 0.09 + (1 - easeOutCubic(spinUnwindP)) * Math.PI * 3;
  world.rotation.x = Math.sin(t * 0.12) * 0.10;
  world.rotation.z = Math.cos(t * 0.09) * 0.05;

  // keep the title always facing the camera, regardless of the planet's
  // own tumble (it still travels/orbits with the planet since it's parented
  // to `world` — only its ORIENTATION is corrected here)
  if (titleMesh) {
    const parentQuat = new THREE.Quaternion().setFromEuler(world.rotation);
    titleMesh.quaternion.copy(parentQuat.clone().invert().multiply(camera.quaternion));
  }

  starsNear.rotation.y = t * 0.01;
  starsFar.rotation.y = -t * 0.006;

  for (const card of floaters) {
    const y = card.baseY + Math.sin(t * card.bobSpeed + card.phase) * card.bobAmp;
    // slow continuous spin around Y (never flips the card upside down),
    // plus a small gentle wobble on X/Z for organic life without tumbling
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
