import * as THREE from 'three';
import './style.css';

const CELL = 3.2;
const LIMIT = 10;
const COUNT = LIMIT * 2 + 1;
const DIRECTIONS = [
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
];
const obstacleCells = [
  [-7, -8], [-3, -8], [3, -7], [8, -8],
  [-9, -4], [-5, -3], [4, -3], [8, -2],
  [-8, 1], [-3, 0], [3, 1], [7, 2],
  [-8, 6], [-4, 5], [4, 5], [8, 7],
  [-5, 9], [6, 9],
];
const obstacles = new Set(obstacleCells.map(([x, z]) => `${x},${z}`));
const $ = (selector) => document.querySelector(selector);
const ui = {
  canvas: $('#game'), radar: $('#radar'), overlay: $('#overlay'),
  title: $('#overlay-title'), kicker: $('#overlay-kicker'),
  copy: $('#overlay-copy'), result: $('#overlay-result'),
  controls: $('#overlay-controls'), start: $('#start-button'),
  startLabel: $('#start-label'), status: $('#status-label'),
  clock: $('#time-label'), score: $('#score'), energy: $('#energy-count'),
  length: $('#length-count'), speed: $('#speed-label'),
  speedFill: $('#speed-fill'), coords: $('#radar-coords'),
  sound: $('#sound-button'), soundState: $('#sound-state'),
  overlaySound: $('#overlay-sound'), overlaySoundState: $('#overlay-sound-state'),
  flash: $('#flash'), message: $('#message'),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07111f);
scene.fog = new THREE.FogExp2(0x07111f, 0.011);
const camera = new THREE.PerspectiveCamera(73, 1, 0.08, 250);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const cyan = 0x32e9e5;
const pink = 0xff408c;
const blue = 0x2697ff;
const tileMat = new THREE.MeshStandardMaterial({ color: 0x101b29, roughness: 0.38, metalness: 0.72 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x0b1624, roughness: 0.47, metalness: 0.65 });
const cyanGlow = new THREE.MeshBasicMaterial({ color: cyan });
const pinkGlow = new THREE.MeshBasicMaterial({ color: pink });
const blueGlow = new THREE.MeshBasicMaterial({ color: blue });

let seed = 92731;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function rand(min, max) { return min + random() * (max - min); }
function cellWorld(cell) { return { x: cell.x * CELL, z: cell.z * CELL }; }
function key(cell) { return `${cell.x},${cell.z}`; }
function box(w, h, d, material, x = 0, y = 0, z = 0, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
function line(points, color, opacity = 1) {
  const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
  const object = new THREE.Line(geometry, material);
  scene.add(object);
  return object;
}

scene.add(new THREE.HemisphereLight(0x5c8fff, 0x080b15, 2.1));
const moonlight = new THREE.DirectionalLight(0xafd2ff, 1.45);
moonlight.position.set(-18, 55, -35);
scene.add(moonlight);
const pinkLight = new THREE.PointLight(pink, 30, 45, 2);
pinkLight.position.set(-24, 8, -20);
scene.add(pinkLight);
const cyanLight = new THREE.PointLight(cyan, 25, 46, 2);
cyanLight.position.set(24, 7, 5);
scene.add(cyanLight);

// The street, city, signs, rain and serpent are all generated at runtime.
function makeStreet() {
  box(340, 0.16, 340, new THREE.MeshStandardMaterial({ color: 0x050c16, metalness: 0.55, roughness: 0.32 }), 0, -0.26, 0);
  const tileGeo = new THREE.BoxGeometry(CELL - 0.07, 0.08, CELL - 0.07);
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, COUNT * COUNT);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let index = 0;
  for (let z = -LIMIT; z <= LIMIT; z++) {
    for (let x = -LIMIT; x <= LIMIT; x++) {
      dummy.position.set(x * CELL, -0.09, z * CELL);
      dummy.updateMatrix();
      tiles.setMatrixAt(index, dummy.matrix);
      const v = rand(0.75, 1.28);
      color.setRGB(0.047 * v, 0.08 * v, 0.125 * v);
      tiles.setColorAt(index++, color);
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  scene.add(tiles);

  const extent = (LIMIT + 0.5) * CELL;
  for (let n = -LIMIT; n <= LIMIT + 1; n++) {
    const p = (n - 0.5) * CELL;
    line([[p, -0.03, -extent], [p, -0.03, extent]], 0x15546b, 0.4);
    line([[-extent, -0.03, p], [extent, -0.03, p]], 0x15546b, 0.4);
  }

  const border = extent + 0.25;
  for (const side of [-1, 1]) {
    box(extent * 2 + 1, 0.3, 0.42, darkMat, 0, 0.1, side * border);
    box(0.42, 0.3, extent * 2 + 1, darkMat, side * border, 0.1, 0);
    box(extent * 2 + 1, 0.07, 0.12, cyanGlow, 0, 0.31, side * border);
    box(0.12, 0.07, extent * 2 + 1, cyanGlow, side * border, 0.31, 0);
  }
  for (let n = -LIMIT; n <= LIMIT; n += 2) {
    for (const side of [-1, 1]) {
      box(0.16, 1.25, 0.16, darkMat, n * CELL, 0.73, side * border);
      box(0.2, 0.12, 0.2, pinkGlow, n * CELL, 1.38, side * border);
      box(0.16, 1.25, 0.16, darkMat, side * border, 0.73, n * CELL);
      box(0.2, 0.12, 0.2, pinkGlow, side * border, 1.38, n * CELL);
    }
  }
  for (let i = 0; i < 24; i++) {
    const x = rand(-extent, extent), z = rand(-extent, extent);
    const stripe = box(0.05, 0.012, rand(0.5, 1.6), i % 4 === 0 ? pinkGlow : blueGlow, x, -0.039, z);
    stripe.material = stripe.material.clone();
    stripe.material.transparent = true;
    stripe.material.opacity = 0.25;
  }
}

function facadeTexture(variant) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = ['#07101c', '#091324', '#0b1020', '#071722'][variant];
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 250; y += 15) {
    for (let x = 9; x < 124; x += 17) {
      const chance = random();
      ctx.fillStyle = chance > 0.68 ? (variant % 2 ? '#267b9e' : '#8d346e') : '#111f30';
      ctx.fillRect(x, y, 9, 6);
      if (chance > 0.9) {
        ctx.fillStyle = variant % 2 ? '#81d9e5' : '#eb76a8';
        ctx.fillRect(x + 1, y + 1, 7, 4);
      }
    }
  }
  ctx.fillStyle = '#123347';
  for (let y = 0; y < 256; y += 48) ctx.fillRect(0, y, 128, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function signTexture(large, small, hue) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071322';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = hue;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = hue;
  ctx.fillRect(20, 20, 472, 216);
  ctx.globalAlpha = 1;
  ctx.shadowColor = hue;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#f5fcff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 108px Arial, sans-serif';
  ctx.fillText(large, 256, 146);
  ctx.shadowBlur = 0;
  ctx.fillStyle = hue;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.letterSpacing = '7px';
  ctx.fillText(small, 256, 208);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCity() {
  const faces = Array.from({ length: 4 }, (_, i) => new THREE.MeshStandardMaterial({
    map: facadeTexture(i), emissive: [0x142944, 0x0c3445, 0x321a36, 0x102d41][i], emissiveIntensity: 0.65,
    metalness: 0.25, roughness: 0.84,
  }));
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x111e2c, metalness: 0.7, roughness: 0.35 });
  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 115; i++) {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(41, 117);
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    if (Math.abs(x) < 37 && Math.abs(z) < 37) continue;
    const w = rand(5, 12), d = rand(5, 13), h = rand(14, 58);
    const mesh = new THREE.Mesh(buildingGeo, faces[i % 4]);
    mesh.position.set(x, h / 2 - 0.18, z);
    mesh.scale.set(w, h, d);
    scene.add(mesh);
    box(w + 0.4, 0.35, d + 0.4, roofMat, x, h, z);
    if (i % 4 === 0) {
      box(w + 0.5, 0.12, 0.12, i % 8 === 0 ? pinkGlow : cyanGlow, x, h - 0.4, z - d / 2 - 0.08);
    }
    if (i % 11 === 0) {
      box(0.1, 2.5, 0.1, roofMat, x, h + 1.3, z);
      box(0.35, 0.35, 0.35, pinkGlow, x, h + 2.6, z);
    }
  }

  const signs = [
    { x: -27, z: -39, y: 13, text: '未来', sub: 'FUTURE / 2099', color: '#ff4698' },
    { x: 25, z: -41, y: 15, text: '東京', sub: 'TOKYO GRID', color: '#32eae7' },
    { x: -41, z: -7, y: 10, text: '電力', sub: 'PURE ENERGY', color: '#2ca5ff' },
    { x: 43, z: 15, y: 12, text: '蛇', sub: 'NEON SERPENT', color: '#ff4698' },
    { x: 3, z: 42, y: 11, text: '夜市', sub: 'NIGHT MARKET', color: '#32eae7' },
  ];
  for (const data of signs) {
    const material = new THREE.MeshBasicMaterial({ map: signTexture(data.text, data.sub, data.color), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), material);
    mesh.position.set(data.x, data.y, data.z);
    mesh.lookAt(0, data.y, 0);
    scene.add(mesh);
    const light = new THREE.PointLight(new THREE.Color(data.color), 10, 22, 2);
    light.position.copy(mesh.position);
    scene.add(light);
  }

  // Air lanes give the skyline depth without external models or textures.
  for (let i = 0; i < 11; i++) {
    const x = rand(-100, 100), z = rand(-100, 100), y = rand(16, 43);
    const strip = box(rand(3, 9), 0.05, 0.06, i % 2 ? cyanGlow : pinkGlow, x, y, z);
    strip.rotation.y = rand(0, Math.PI * 2);
  }
}

function makeObstacles() {
  const shell = new THREE.MeshStandardMaterial({ color: 0x19253b, metalness: 0.8, roughness: 0.28, emissive: 0x140b22, emissiveIntensity: 0.5 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x3f2f50, metalness: 0.75, roughness: 0.4, emissive: 0x651e4e, emissiveIntensity: 0.7 });
  obstacleCells.forEach(([cx, cz], i) => {
    const x = cx * CELL, z = cz * CELL;
    const h = i % 3 === 0 ? 2.65 : 2.1;
    box(2.35, h, 2.35, shell, x, h / 2, z);
    box(2.49, 0.13, 2.49, panel, x, h - 0.18, z);
    box(2.55, 0.065, 2.55, pinkGlow, x, h + 0.055, z);
    for (const side of [-1, 1]) {
      box(0.08, h - 0.35, 0.08, pinkGlow, x + side * 1.2, h / 2, z - 1.2);
      box(0.08, h - 0.35, 0.08, pinkGlow, x + side * 1.2, h / 2, z + 1.2);
    }
    box(1.1, 0.15, 0.04, blueGlow, x, h * 0.53, z - 1.2);
  });
}

const rainCount = 270;
const rainPosition = new Float32Array(rainCount * 6);
function resetRainDrop(i, high = false) {
  const base = i * 6;
  const x = rand(-60, 60), y = high ? rand(2, 32) : 32, z = rand(-60, 60);
  rainPosition[base] = x; rainPosition[base + 1] = y; rainPosition[base + 2] = z;
  rainPosition[base + 3] = x - 0.12; rainPosition[base + 4] = y - rand(0.4, 1.3); rainPosition[base + 5] = z;
}
for (let i = 0; i < rainCount; i++) resetRainDrop(i, true);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPosition, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x60afcf, transparent: true, opacity: 0.24 }));
scene.add(rain);

function createSegment(isHead) {
  const group = new THREE.Group();
  const surface = new THREE.MeshStandardMaterial({
    color: isHead ? 0x063f4a : 0x0b343e, metalness: 0.78, roughness: 0.24,
    emissive: isHead ? 0x047881 : 0x0c5964, emissiveIntensity: 0.62,
  });
  box(isHead ? 2.1 : 1.96, isHead ? 0.78 : 0.66, isHead ? 2.2 : 1.95, surface, 0, 0.85, 0, group);
  box(1.55, 0.09, isHead ? 1.8 : 1.53, cyanGlow, 0, isHead ? 1.28 : 1.21, 0, group);
  for (const side of [-1, 1]) {
    box(0.12, 0.13, 1.64, cyanGlow, side * 0.92, 1.03, 0, group);
    if (isHead) box(0.34, 0.19, 0.1, pinkGlow, side * 0.56, 0.89, -1.15, group);
  }
  if (isHead) {
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x2cc4bc, emissive: cyan, emissiveIntensity: 1.2 });
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 4), hornMat);
      horn.position.set(side * 0.75, 1.52, -0.6);
      group.add(horn);
    }
  }
  scene.add(group);
  return group;
}

function createCore() {
  const group = new THREE.Group();
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.53, 1), new THREE.MeshStandardMaterial({
    color: 0xffb8d5, emissive: pink, emissiveIntensity: 2.4, metalness: 0.1, roughness: 0.18,
  }));
  group.add(inner);
  const cageMat = new THREE.MeshBasicMaterial({ color: 0xff5ca9, wireframe: true, transparent: true, opacity: 0.85 });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 0), cageMat));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.026, 6, 48), pinkGlow);
  ring.rotation.x = 0.6;
  group.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.022, 6, 48), cyanGlow);
  ring2.rotation.set(1.2, 0.35, 0.4);
  group.add(ring2);
  const light = new THREE.PointLight(pink, 15, 11, 2);
  group.add(light);
  scene.add(group);
  return group;
}

makeStreet();
makeCity();
makeObstacles();
const coreMesh = createCore();
const segmentMeshes = [];
const radarContext = ui.radar.getContext('2d');
let snake = [];
let fromSnake = [];
let directionIndex = 0;
let previousDirectionIndex = 0;
let core = { x: 0, z: -2 };
let turnQueue = [];
let state = 'intro';
let score = 0;
let energyCount = 0;
let elapsed = 0;
let accumulator = 0;
let boost = false;
let soundEnabled = false;
let audioContext = null;
let messageTimer = null;
let flashTimer = null;
let best = 0;
try { best = Number(localStorage.getItem('neon-serpent-best') || 0) || 0; } catch { /* Storage is optional. */ }

function audioTone(frequency, duration, type = 'sine', volume = 0.035, glide = 0) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (glide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, frequency + glide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch { soundEnabled = false; updateSoundButton(); }
}
function updateSoundButton() {
  ui.soundState.textContent = soundEnabled ? 'ON' : 'OFF';
  ui.overlaySoundState.textContent = soundEnabled ? 'ON' : 'OFF';
  ui.sound.classList.toggle('active', soundEnabled);
  ui.overlaySound.classList.toggle('active', soundEnabled);
  ui.sound.setAttribute('aria-label', soundEnabled ? 'Disable sound' : 'Enable sound');
}
function flash(danger = false) {
  clearTimeout(flashTimer);
  ui.flash.classList.remove('active', 'danger');
  void ui.flash.offsetWidth;
  ui.flash.classList.toggle('danger', danger);
  ui.flash.classList.add('active');
  flashTimer = setTimeout(() => ui.flash.classList.remove('active'), 70);
}
function message(text) {
  clearTimeout(messageTimer);
  ui.message.textContent = text;
  ui.message.classList.add('show');
  messageTimer = setTimeout(() => ui.message.classList.remove('show'), 1000);
}
function interval() { return Math.max(0.112, 0.225 - energyCount * 0.008); }
function updateHud() {
  ui.score.textContent = String(score).padStart(5, '0');
  ui.energy.textContent = String(energyCount).padStart(2, '0');
  ui.length.textContent = String(snake.length).padStart(2, '0');
  const level = Math.min(5, 1 + Math.floor(energyCount / 3));
  ui.speed.textContent = boost && state === 'playing' ? 'BOOST' : `${String(level).padStart(2, '0')} / 05`;
  ui.speedFill.style.width = `${level * 20}%`;
  ui.coords.textContent = `X ${String(snake[0].x).padStart(2, '0')} / Z ${String(snake[0].z).padStart(2, '0')}`;
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(Math.floor(elapsed % 60)).padStart(2, '0');
  ui.clock.textContent = `${minutes}:${seconds}`;
}
function placeCore() {
  const candidates = [];
  for (let z = -LIMIT; z <= LIMIT; z++) {
    for (let x = -LIMIT; x <= LIMIT; x++) {
      const cell = { x, z };
      if (obstacles.has(key(cell)) || snake.some((part) => part.x === x && part.z === z)) continue;
      const distance = Math.abs(x - snake[0].x) + Math.abs(z - snake[0].z);
      if (distance >= 5) candidates.push(cell);
    }
  }
  core = candidates[Math.floor(Math.random() * candidates.length)] || { x: 0, z: -2 };
  coreMesh.position.set(core.x * CELL, 1.65, core.z * CELL);
}
function resetGame() {
  snake = [{ x: 0, z: 6 }, { x: 0, z: 7 }, { x: 0, z: 8 }, { x: 0, z: 9 }];
  fromSnake = snake.map((part) => ({ ...part }));
  directionIndex = 0;
  previousDirectionIndex = 0;
  turnQueue = [];
  score = 0;
  energyCount = 0;
  elapsed = 0;
  accumulator = 0;
  boost = false;
  core = { x: 0, z: -2 };
  coreMesh.position.set(core.x * CELL, 1.65, core.z * CELL);
  while (segmentMeshes.length > snake.length) {
    const mesh = segmentMeshes.pop();
    scene.remove(mesh);
  }
  while (segmentMeshes.length < snake.length) segmentMeshes.push(createSegment(segmentMeshes.length === 0));
  updateSnakeVisuals(0);
  updateHud();
}
function showOverlay(mode) {
  state = mode;
  ui.overlay.classList.remove('hidden');
  ui.result.hidden = true;
  ui.controls.hidden = false;
  if (mode === 'paused') {
    ui.kicker.textContent = 'CONNECTION HELD // 02';
    ui.title.innerHTML = 'RUN<br><em>PAUSED</em>';
    ui.copy.textContent = 'The city can wait. Your trail cannot.';
    ui.startLabel.textContent = 'RESUME RUN';
    ui.status.textContent = 'SYSTEM PAUSED';
  } else if (mode === 'gameover') {
    ui.kicker.textContent = 'SIGNAL TERMINATED // 03';
    ui.title.innerHTML = 'SIGNAL<br><em>LOST</em>';
    ui.copy.textContent = 'Every trail ends. Start a new one.';
    ui.result.hidden = false;
    ui.result.innerHTML = `<span>FINAL SCORE</span><strong>${String(score).padStart(5, '0')}</strong><span>BEST ${String(best).padStart(5, '0')}</span>`;
    ui.controls.hidden = true;
    ui.startLabel.textContent = 'RUN AGAIN';
    ui.status.textContent = 'SIGNAL LOST';
  }
}
function startOrResume() {
  if (state !== 'paused') resetGame();
  state = 'playing';
  ui.status.textContent = 'SYSTEM ONLINE';
  ui.overlay.classList.add('hidden');
  audioTone(180, 0.17, 'sawtooth', 0.02, 360);
  setTimeout(() => audioTone(440, 0.2, 'sine', 0.03, 220), 110);
}
function crash(reason) {
  state = 'gameover';
  boost = false;
  fromSnake = snake.map((part) => ({ ...part }));
  previousDirectionIndex = directionIndex;
  accumulator = 0;
  flash(true);
  audioTone(180, 0.42, 'sawtooth', 0.055, -160);
  message(reason);
  if (score > best) {
    best = score;
    try { localStorage.setItem('neon-serpent-best', String(best)); } catch { /* Storage is optional. */ }
  }
  showOverlay('gameover');
}
function step() {
  previousDirectionIndex = directionIndex;
  if (turnQueue.length) directionIndex = (directionIndex + turnQueue.shift() + 4) % 4;
  const vector = DIRECTIONS[directionIndex];
  const next = { x: snake[0].x + vector.x, z: snake[0].z + vector.z };
  const hitWall = Math.abs(next.x) > LIMIT || Math.abs(next.z) > LIMIT;
  const hitObstacle = obstacles.has(key(next));
  const eating = next.x === core.x && next.z === core.z;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  const hitBody = bodyToCheck.some((part) => part.x === next.x && part.z === next.z);
  if (hitWall || hitObstacle || hitBody) {
    crash(hitBody ? 'TRAIL COLLISION' : hitWall ? 'PERIMETER BREACH' : 'OBSTACLE IMPACT');
    return;
  }

  fromSnake = snake.map((part) => ({ ...part }));
  snake.unshift(next);
  if (!eating) snake.pop();
  else {
    energyCount++;
    score += 100 + (energyCount - 1) * 20;
    segmentMeshes.push(createSegment(false));
    placeCore();
    flash();
    message(`ENERGY +${100 + (energyCount - 1) * 20}`);
    audioTone(440, 0.16, 'sine', 0.045, 350);
    setTimeout(() => audioTone(660, 0.2, 'sine', 0.026, 260), 95);
  }
  if (directionIndex !== previousDirectionIndex) audioTone(210, 0.055, 'triangle', 0.012, 90);
  updateHud();
}
function updateSnakeVisuals(progress) {
  const t = Math.max(0, Math.min(1, progress));
  const eased = t * t * (3 - 2 * t);
  snake.forEach((part, index) => {
    const from = fromSnake[Math.min(index, fromSnake.length - 1)] || part;
    const mesh = segmentMeshes[index];
    mesh.position.set(THREE.MathUtils.lerp(from.x, part.x, eased) * CELL, 0, THREE.MathUtils.lerp(from.z, part.z, eased) * CELL);
    if (index === 0) mesh.rotation.y = -(directionIndex * Math.PI) / 2;
    else {
      const ahead = snake[index - 1];
      const dx = ahead.x - part.x, dz = ahead.z - part.z;
      if (dx || dz) mesh.rotation.y = -Math.atan2(dx, -dz);
    }
  });
  const from = fromSnake[0] || snake[0];
  const head = snake[0];
  const x = THREE.MathUtils.lerp(from.x, head.x, eased) * CELL;
  const z = THREE.MathUtils.lerp(from.z, head.z, eased) * CELL;
  let delta = directionIndex - previousDirectionIndex;
  if (delta > 2) delta -= 4;
  if (delta < -2) delta += 4;
  const angle = (previousDirectionIndex + delta * eased) * Math.PI / 2;
  const forwardX = Math.sin(angle), forwardZ = -Math.cos(angle);
  const bob = state === 'playing' ? Math.sin(elapsed * 16) * 0.035 : 0;
  camera.position.set(x + forwardX * 0.54, 2.22 + bob, z + forwardZ * 0.54);
  camera.lookAt(x + forwardX * 12, 1.9 + bob, z + forwardZ * 12);
}
function drawRadar(time) {
  const ctx = radarContext;
  const size = ui.radar.width;
  const pad = 9;
  const stepSize = (size - pad * 2) / COUNT;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#071421';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#14405b';
  ctx.lineWidth = 0.7;
  for (let i = 0; i <= COUNT; i++) {
    const p = pad + i * stepSize;
    ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, size - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(size - pad, p); ctx.stroke();
  }
  function spot(cell) {
    return { x: pad + (cell.x + LIMIT + 0.5) * stepSize, y: pad + (cell.z + LIMIT + 0.5) * stepSize };
  }
  for (const [x, z] of obstacleCells) {
    const p = spot({ x, z });
    ctx.fillStyle = '#6d526d';
    ctx.fillRect(p.x - 3.4, p.y - 3.4, 6.8, 6.8);
  }
  snake.slice(1).forEach((part, i) => {
    const p = spot(part);
    ctx.fillStyle = i % 2 ? '#15908f' : '#23b6b3';
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  });
  const target = spot(core);
  ctx.fillStyle = '#ff5da8';
  ctx.shadowColor = '#ff388e';
  ctx.shadowBlur = 8 + Math.sin(time * 5) * 4;
  ctx.beginPath(); ctx.arc(target.x, target.y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  const head = spot(snake[0]);
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(directionIndex * Math.PI / 2);
  ctx.fillStyle = '#77fff2';
  ctx.shadowColor = '#27fff1'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 5); ctx.lineTo(0, 3); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#38c6d14f';
  ctx.strokeRect(pad - 1, pad - 1, size - pad * 2 + 2, size - pad * 2 + 2);
}

function queueTurn(turn) {
  if (state !== 'playing') return;
  if (turnQueue.length < 2) turnQueue.push(turn);
}
window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  if (event.repeat && event.code !== 'KeyW' && event.code !== 'ArrowUp') return;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') queueTurn(-1);
  if (event.code === 'KeyD' || event.code === 'ArrowRight') queueTurn(1);
  if (event.code === 'KeyW' || event.code === 'ArrowUp') { boost = true; updateHud(); }
  if (event.code === 'Space' || event.code === 'Escape') {
    if (state === 'playing') showOverlay('paused');
    else if (state === 'paused') startOrResume();
  }
  if (event.code === 'Enter' && state !== 'playing') startOrResume();
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') { boost = false; updateHud(); }
});
ui.start.addEventListener('click', startOrResume);
function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundButton();
  audioTone(520, 0.08, 'sine', 0.025, 130);
}
ui.sound.addEventListener('click', toggleSound);
ui.overlaySound.addEventListener('click', toggleSound);
$('#turn-left').addEventListener('click', () => queueTurn(-1));
$('#turn-right').addEventListener('click', () => queueTurn(1));
$('#touch-pause').addEventListener('click', () => {
  if (state === 'playing') showOverlay('paused');
  else if (state === 'paused') startOrResume();
});
window.addEventListener('blur', () => { if (state === 'playing') showOverlay('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') showOverlay('paused'); });

function resize() {
  const width = window.innerWidth, height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();
resetGame();
let lastFrame = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastFrame) / 1000, 0.25);
  lastFrame = now;
  const time = now / 1000;
  if (state === 'playing') {
    elapsed += dt;
    accumulator += dt * (boost ? 1.55 : 1);
    const beat = interval();
    while (accumulator >= beat && state === 'playing') {
      accumulator -= beat;
      step();
    }
    updateHud();
  }
  updateSnakeVisuals(accumulator / interval());
  coreMesh.position.y = 1.65 + Math.sin(time * 2.5) * 0.22;
  coreMesh.rotation.y += dt * 0.75;
  coreMesh.children[2].rotation.z += dt * 0.7;
  for (let i = 0; i < rainCount; i++) {
    const base = i * 6;
    rainPosition[base + 1] -= dt * 19;
    rainPosition[base + 4] -= dt * 19;
    if (rainPosition[base + 1] < 0) resetRainDrop(i);
  }
  rainGeo.attributes.position.needsUpdate = true;
  drawRadar(time);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
