// The room: a top-floor studio above Tbilisi, a little before eight in the
// evening. Built entirely from code. No models; every surface is a primitive
// and every texture is drawn on a canvas.
//
// You stand in the middle and can turn all the way round. Things you can walk
// up to: the portrait (who I am), the laptop (the work), the piano and the
// guitar (both playable), the radio, the armchair (sit and look at the city).
// Things that are wrong on purpose: the flickers, and now and then the view.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { playKey, pluck, playClick } from './audio.js';
import {
  ORANGE, mulberry32, canvasTexture, std, mesh, box, rbox, cyl, clamp, ease,
  wallTexture, floorTexture, rugTexture, drawInkblot, mandalaTexture, sheetTexture, glyphAtlas,
  RainScreen, TerminalScreen, WaveScreen, FinalShader,
} from './room-kit.js';
import { TOWER, tbilisiTexture, drawPortrait, drawLaptop, keyboardTexture } from './room-art.js';

const R = { hw: 5, hd: 4, h: 3.3 }; // half width (x), half depth (z), height
const WIN = { z0: -4, z1: 1.4, y0: 0.32, y1: 3.02 }; // the glass on the east wall
const SOUTH = 9.6; // the back wall, behind where you come in
const START = { x: 0, z: 8.3 };
const TAU = Math.PI * 2;
const noop = () => {};

export const GUITAR_CHORDS = {
  Open: [0, 0, 0, 0, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  C: [-1, 3, 2, 0, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  F: [1, 3, 3, 2, 1, 1],
};
const OPEN_STRINGS = [40, 45, 50, 55, 59, 64];
// computer keys to piano keys, one and a bit octaves up from middle C
const KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76 };

export function createRoom(canvas, opts = {}) {
  const { onHover = noop, onMatrixRequest = noop, onReady = noop, onView = noop, onScreenRect = noop, projects = [], portrait = '' } = opts;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060f);
  scene.fog = new THREE.FogExp2(0x070504, 0.022);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.08, 140);
  camera.rotation.order = 'YXZ';

  const interactives = [];
  const desyncable = [];
  const act = (obj, name) => { obj.userData.act = name; interactives.push(obj); return obj; };

  /* ---- shell ---- */
  const W = R.hw * 2, D = SOUTH + R.hd, ZMID = (SOUTH - R.hd) / 2;
  const wallMat = (seed, rep) => {
    const t = wallTexture(seed);
    t.repeat.set(rep[0], rep[1]);
    return std(0xa8957f, { map: t, roughness: 0.96 });
  };
  const floorTex = floorTexture();
  floorTex.repeat.set(3.4, 7.5);
  const floor = mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: floorTex, roughness: 0.42, metalness: 0.05 }), scene, 0, 0, ZMID, false);
  floor.rotation.x = -Math.PI / 2;
  const ceiling = mesh(new THREE.PlaneGeometry(W, D), std(0x2b2622, { roughness: 1 }), scene, 0, R.h, ZMID, false);
  ceiling.rotation.x = Math.PI / 2;
  mesh(new THREE.PlaneGeometry(W, R.h), wallMat(1, [1.7, 0.8]), scene, 0, R.h / 2, -R.hd, false);
  mesh(new THREE.PlaneGeometry(W, R.h), wallMat(2, [1.7, 0.8]), scene, 0, R.h / 2, SOUTH, false).rotation.y = Math.PI;
  mesh(new THREE.PlaneGeometry(D, R.h), wallMat(3, [2.3, 0.8]), scene, -R.hw, R.h / 2, ZMID, false).rotation.y = Math.PI / 2;
  // east wall: a solid pier, then glass from floor to ceiling
  const pierW = SOUTH - WIN.z1;
  mesh(new THREE.PlaneGeometry(pierW, R.h), wallMat(4, [1.4, 0.8]), scene, R.hw, R.h / 2, WIN.z1 + pierW / 2, false).rotation.y = -Math.PI / 2;
  const winLen = WIN.z1 - WIN.z0, winMid = (WIN.z0 + WIN.z1) / 2;
  const frameMat = std(0x120e0b, { roughness: 0.55, metalness: 0.4 });
  box(0.3, WIN.y0, winLen, std(0x1c1511, { roughness: 0.8 }), scene, R.hw + 0.05, WIN.y0 / 2, winMid, false);
  box(0.3, R.h - WIN.y1, winLen, std(0x1c1511, { roughness: 0.8 }), scene, R.hw + 0.05, (R.h + WIN.y1) / 2, winMid, false);
  box(0.26, 0.03, winLen, std(0x24150d, { roughness: 0.5 }), scene, R.hw - 0.06, WIN.y0 + 0.015, winMid, false);
  for (let i = 0; i <= 4; i++) box(0.07, WIN.y1 - WIN.y0, 0.07, frameMat, scene, R.hw - 0.03, (WIN.y0 + WIN.y1) / 2, WIN.z0 + 0.035 + (i * (winLen - 0.07)) / 4, false);
  box(0.07, 0.05, winLen, frameMat, scene, R.hw - 0.03, WIN.y1 - 0.025, winMid, false);
  const glass = mesh(
    new THREE.PlaneGeometry(winLen, WIN.y1 - WIN.y0),
    new THREE.MeshBasicMaterial({ color: 0x8fa4d0, transparent: true, opacity: 0.035, depthWrite: false }),
    scene, R.hw - 0.03, (WIN.y0 + WIN.y1) / 2, winMid, false
  );
  glass.rotation.y = -Math.PI / 2;
  glass.castShadow = false;
  act(glass, 'window');

  const darkWood = std(0x24150d, { roughness: 0.6 });
  box(W, 0.12, 0.03, darkWood, scene, 0, 0.06, -R.hd + 0.015, false);
  box(W, 0.12, 0.03, darkWood, scene, 0, 0.06, SOUTH - 0.015, false);
  box(0.03, 0.12, D, darkWood, scene, -R.hw + 0.015, 0.06, ZMID, false);
  for (const z of [-3, -1, 1, 3, 5, 7, 9]) box(W, 0.18, 0.16, std(0x1c120c, { roughness: 0.9 }), scene, 0, R.h - 0.09, z, false);

  // curtains, pushed to the sides
  const curtainMat = std(0x3b2a22, { roughness: 1, side: THREE.DoubleSide });
  for (const z of [WIN.z0 + 0.42, WIN.z1 + 0.36]) { // the second one is drawn back over the wall, clear of the view
    const geo = new THREE.PlaneGeometry(0.8, WIN.y1 - 0.1, 32, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 44) * 0.035);
    geo.computeVertexNormals();
    const c = mesh(geo, curtainMat, scene, R.hw - 0.2, (WIN.y1 - 0.1) / 2 + 0.03, z);
    c.rotation.y = -Math.PI / 2;
  }
  cyl(0.012, 0.012, winLen + 0.9, frameMat, scene, R.hw - 0.2, WIN.y1 - 0.05, winMid + 0.4, 8).rotation.x = Math.PI / 2;

  // a door, so there is a way in
  {
    const door = new THREE.Group();
    door.position.set(-R.hw + 0.02, 0, 2.5);
    door.rotation.y = Math.PI / 2;
    scene.add(door);
    box(1.06, 2.2, 0.05, darkWood, door, 0, 1.1, 0, false);
    box(0.92, 2.1, 0.04, std(0x3a2416, { roughness: 0.55 }), door, 0, 1.06, 0.02, false);
    for (const y of [0.55, 1.55]) box(0.66, 0.7, 0.012, std(0x2f1c11, { roughness: 0.6 }), door, 0, y, 0.042, false);
    cyl(0.022, 0.022, 0.06, std(0xb08a3c, { metalness: 0.9, roughness: 0.3 }), door, 0.36, 1.02, 0.07, 12).rotation.x = Math.PI / 2;
  }

  /* ---- the city ---- */
  const SKY = { cx: 0, cy: 1.55, cz: winMid, r: 54, arc: 2.15 };
  const skyH = (SKY.r * SKY.arc) / 2; // the painting is 2:1
  const skyTex = small ? tbilisiTexture(2048, 1024) : tbilisiTexture(3072, 1536);
  skyTex.wrapS = THREE.RepeatWrapping;
  skyTex.repeat.x = -1; // seen from inside the cylinder, so flip it back
  skyTex.offset.x = 1;
  const skyGeo = new THREE.CylinderGeometry(SKY.r, SKY.r, skyH, 64, 1, true, Math.PI / 2 - SKY.arc / 2, SKY.arc);
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, color: new THREE.Color(1.3, 1.3, 1.3) }));
  sky.position.set(SKY.cx, SKY.cy, SKY.cz);
  scene.add(sky);
  // a point on the painting, in world space
  const skyPos = (u, v, inset = 0.6) => {
    const th = Math.PI / 2 + SKY.arc / 2 - u * SKY.arc, r = SKY.r - inset;
    return new THREE.Vector3(SKY.cx + Math.sin(th) * r, SKY.cy + (0.5 - v) * skyH, SKY.cz + Math.cos(th) * r);
  };
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 0.5, 0.3), fog: false });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), beaconMat);
  beacon.position.copy(skyPos(TOWER.u, TOWER.vTop - 0.004));
  const strobeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4), fog: false });
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), strobeMat);
  strobe.position.copy(skyPos(TOWER.u, TOWER.vTop + TOWER.h * 0.4));
  scene.add(beacon, strobe);

  // what the view is really made of; it shows for a blink, now and then
  const rain = new RainScreen(256, 16);
  const rainB = new RainScreen(256, 20);
  const skyRainTex = rain.tex.clone();
  skyRainTex.wrapS = skyRainTex.wrapT = THREE.RepeatWrapping;
  skyRainTex.repeat.set(26, 9);
  const skyRain = new THREE.Mesh(
    new THREE.CylinderGeometry(SKY.r - 1.2, SKY.r - 1.2, skyH, 48, 1, true, Math.PI / 2 - SKY.arc / 2, SKY.arc),
    new THREE.MeshBasicMaterial({ map: skyRainTex, side: THREE.BackSide, fog: false, color: new THREE.Color(1.3, 1.3, 1.3) })
  );
  skyRain.position.copy(sky.position);
  skyRain.visible = false;
  scene.add(skyRain);
  let skyRainUntil = 0;

  /* ---- lights ---- */
  scene.add(new THREE.HemisphereLight(0x34293a, 0x0c0705, 0.95));
  const softShadow = (l) => {
    l.castShadow = true;
    l.shadow.mapSize.set(1024, 1024);
    l.shadow.bias = -0.0006;
    l.shadow.normalBias = 0.03;
    l.shadow.radius = 4;
  };
  // dusk coming in through the glass
  const dusk = new THREE.SpotLight(0x5673c4, 30, 13, 0.95, 1, 1.3);
  dusk.position.set(R.hw + 2.2, 3.3, winMid);
  dusk.target.position.set(1.2, 0, winMid + 0.3);
  scene.add(dusk, dusk.target);
  const duskFill = new THREE.PointLight(0x7a5a8a, 5, 9, 1.6);
  duskFill.position.set(R.hw - 0.9, 1.5, winMid);
  scene.add(duskFill);

  // pendant
  const bulbPos = new THREE.Vector3(-0.5, 2.5, -1.7);
  const bulbLight = new THREE.SpotLight(0xffac62, 62, 10, 1.12, 1, 1.6);
  bulbLight.position.copy(bulbPos);
  bulbLight.target.position.set(bulbPos.x, 0, bulbPos.z);
  softShadow(bulbLight);
  scene.add(bulbLight, bulbLight.target);
  box(0.012, R.h - bulbPos.y - 0.1, 0.012, std(0x0a0a0a), scene, bulbPos.x, (R.h + bulbPos.y + 0.1) / 2, bulbPos.z, false);
  mesh(new THREE.CylinderGeometry(0.04, 0.21, 0.17, 28, 1, true), std(0x15110d, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide, emissive: 0x3a1c08 }), scene, bulbPos.x, bulbPos.y + 0.06, bulbPos.z, false);
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.5, 0.45) });
  mesh(new THREE.SphereGeometry(0.05, 16, 12), bulbMat, scene, bulbPos.x, bulbPos.y, bulbPos.z, false);

  /* ---- neon ---- */
  const neonGroup = new THREE.Group();
  neonGroup.position.set(-1.9, 2.66, -R.hd + 0.06);
  scene.add(neonGroup);
  const neonCanvas = document.createElement('canvas');
  neonCanvas.width = 1280;
  neonCanvas.height = 256;
  const neonTex = new THREE.CanvasTexture(neonCanvas);
  neonTex.colorSpace = THREE.SRGBColorSpace;
  neonTex.anisotropy = 8;
  const drawNeon = () => {
    const g = neonCanvas.getContext('2d');
    g.clearRect(0, 0, 1280, 256);
    g.font = '500 150px Geist, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    try { g.letterSpacing = '2px'; } catch (e) { /* older browsers */ }
    g.shadowColor = '#ff4d00';
    g.shadowBlur = 38;
    g.fillStyle = '#ff4d00';
    g.fillText('know thyself', 640, 128);
    g.fillText('know thyself', 640, 128);
    g.shadowBlur = 6;
    g.fillStyle = '#ffb48a';
    g.fillText('know thyself', 640, 128);
    neonTex.needsUpdate = true;
  };
  drawNeon();
  const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.8, 1.8, 1.8) });
  act(mesh(new THREE.PlaneGeometry(3.0, 0.6), neonMat, neonGroup, 0, 0, 0, false), 'neon');
  for (const x of [-1.3, -0.45, 0.45, 1.3]) cyl(0.008, 0.008, 0.06, std(0x111111), neonGroup, x, -0.24, -0.03, 6).rotation.x = Math.PI / 2;
  const neonLight = new THREE.PointLight(ORANGE, 5, 7.5, 1.8);
  neonLight.position.set(-1.9, 2.6, -R.hd + 0.7);
  scene.add(neonLight);
  let neonFlicker = 0;

  /* ---- piano ---- */
  const piano = new THREE.Group();
  piano.position.set(-1.9, 0, -R.hd + 0.36);
  scene.add(piano);
  const lacquer = std(0x120a07, { roughness: 0.22, metalness: 0.1 });
  const brass = std(0xb08a3c, { metalness: 0.9, roughness: 0.3 });
  const bookCols = [0x6b2a1e, 0x2c3a2e, 0x8a6a34, 0x1d2640, 0x4a1c2a, 0x7a7060, 0x34241a];
  box(1.56, 1.2, 0.38, lacquer, piano, 0, 0.6, -0.12);
  box(1.6, 0.04, 0.46, lacquer, piano, 0, 1.22, -0.1);
  box(1.56, 0.09, 0.32, lacquer, piano, 0, 0.675, 0.2);
  for (const s of [-1, 1]) {
    box(0.06, 0.2, 0.32, lacquer, piano, s * 0.75, 0.8, 0.2);
    box(0.075, 0.63, 0.075, lacquer, piano, s * 0.74, 0.315, 0.31);
  }
  box(1.56, 0.12, 0.06, lacquer, piano, 0, 0.06, 0.09);
  box(1.44, 0.15, 0.02, lacquer, piano, 0, 0.82, 0.075).rotation.x = -0.12;
  box(0.74, 0.27, 0.012, lacquer, piano, 0, 1.03, 0.085).rotation.x = -0.2;
  mesh(new THREE.PlaneGeometry(0.46, 0.29), std(0xa89f8e, { map: sheetTexture(), roughness: 0.9 }), piano, 0, 1.045, 0.098, false).rotation.x = -0.2;
  for (const x of [-0.1, 0, 0.1]) box(0.035, 0.012, 0.09, brass, piano, x, 0.03, 0.16);
  box(1.44, 0.004, 0.012, std(0x7a1010, { roughness: 0.9 }), piano, 0, 0.722, 0.125, false);

  const WHITE = 28, KW = 1.4 / WHITE;
  const whiteMat = std(0xe9e2d2, { roughness: 0.3 });
  const blackMat = std(0x0a0a0a, { roughness: 0.25 });
  const keys = new Map(); // midi -> mesh
  const keyMeshes = [];
  const addKey = (k, midi) => { k.userData.y0 = k.position.y; k.userData.midi = midi; keys.set(midi, k); keyMeshes.push(k); };
  const whiteOffsets = [0, 2, 4, 5, 7, 9, 11];
  for (let i = 0; i < WHITE; i++) {
    const x = -0.7 + KW * (i + 0.5);
    const midi = 48 + Math.floor(i / 7) * 12 + whiteOffsets[i % 7];
    addKey(box(KW - 0.004, 0.022, 0.15, whiteMat, piano, x, 0.731, 0.262, false), midi);
    if ([0, 1, 3, 4, 5].includes(i % 7) && i < WHITE - 1) addKey(box(KW * 0.56, 0.03, 0.095, blackMat, piano, x + KW / 2, 0.75, 0.234, false), midi + 1);
  }
  const metro = mesh(new THREE.CylinderGeometry(0.018, 0.06, 0.19, 4), std(0x3a2214, { roughness: 0.4 }), piano, 0.5, 1.335, -0.1);
  metro.rotation.y = Math.PI / 4;
  const metroArm = new THREE.Group();
  metroArm.position.set(0.5, 1.26, -0.055);
  piano.add(metroArm);
  box(0.004, 0.17, 0.004, brass, metroArm, 0, 0.085, 0, false);
  box(0.016, 0.02, 0.008, brass, metroArm, 0, 0.12, 0, false);
  [[-0.5, 0.3, 0.03, 0], [-0.5, 0.27, 0.025, 0.2], [-0.48, 0.25, 0.035, -0.15]].forEach(([x, w, h, r], i) => {
    box(w, h, 0.2, std(bookCols[i + 1], { roughness: 0.8 }), piano, x, 1.255 + i * 0.031, -0.1).rotation.y = r;
  });
  act(piano, 'piano');
  desyncable.push(piano);
  const pressed = []; // {k, at}

  const bench = new THREE.Group();
  bench.position.set(-1.9, 0, -R.hd + 1.2);
  bench.rotation.y = 0.06;
  scene.add(bench);
  rbox(0.9, 0.08, 0.36, 0.03, std(0x3a1f12, { roughness: 0.5 }), bench, 0, 0.47, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.05, 0.43, 0.05, lacquer, bench, sx * 0.4, 0.215, sz * 0.13);
  desyncable.push(bench);

  /* ---- guitar ---- */
  const guitar = new THREE.Group();
  guitar.position.set(0.55, 0.14, -R.hd + 0.42);
  guitar.rotation.set(-0.2, -0.1, 0.03);
  scene.add(guitar);
  const GF = 0.098; // z of the soundboard
  const STR_Z = GF + 0.014, STR_SP = 0.0095, NUT_Y = 1.05, SADDLE_Y = 0.13;
  const fretYs = [];
  {
    const half = [[0.1, 0.004], [0.176, 0.055], [0.197, 0.15], [0.168, 0.24], [0.127, 0.292], [0.131, 0.35], [0.15, 0.41], [0.116, 0.474]];
    const pts = [
      ...half.map(([x, y]) => new THREE.Vector2(x, y)),
      new THREE.Vector2(0, 0.492),
      ...half.slice().reverse().map(([x, y]) => new THREE.Vector2(-x, y)),
      new THREE.Vector2(0, 0),
    ];
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.splineThru(pts);
    const BD = 0.09, BV = 0.008;
    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: BD, bevelEnabled: true, bevelSize: BV, bevelThickness: BV, bevelSegments: 3, curveSegments: 40 });
    mesh(bodyGeo, [std(0xc07a35, { roughness: 0.35 }), std(0x4a2210, { roughness: 0.35 })], guitar, 0, 0, 0);
    mesh(new THREE.CircleGeometry(0.047, 32), new THREE.MeshBasicMaterial({ color: 0x030201 }), guitar, 0, 0.315, GF + 0.001, false).castShadow = false;
    mesh(new THREE.RingGeometry(0.052, 0.064, 40), std(0x2a140a, { roughness: 0.5 }), guitar, 0, 0.315, GF + 0.0012, false);
    box(0.16, 0.022, 0.012, std(0x1a0d07, { roughness: 0.5 }), guitar, 0, SADDLE_Y, GF + 0.006);
    const neckMat = std(0x5a3018, { roughness: 0.45 });
    box(0.064, 0.58, 0.024, neckMat, guitar, 0, 0.76, GF - 0.008);
    box(0.062, 0.68, 0.006, std(0x140c08, { roughness: 0.6 }), guitar, 0, 0.71, GF + 0.007);
    const fretMat = std(0xb8b0a0, { metalness: 0.9, roughness: 0.3 });
    let fy = NUT_Y;
    for (let i = 0; i < 13; i++) {
      fy -= 0.058 * Math.pow(0.944, i);
      fretYs.push(fy);
      box(0.062, 0.003, 0.003, fretMat, guitar, 0, fy, GF + 0.011, false);
    }
    for (const n of [2, 4, 6, 8]) mesh(new THREE.CircleGeometry(0.004, 10), std(0xd8d0c0), guitar, 0, (fretYs[n] + fretYs[n + 1]) / 2, GF + 0.0105, false);
    box(0.09, 0.17, 0.018, neckMat, guitar, 0, 1.135, GF - 0.018).rotation.x = -0.14;
    box(0.064, 0.008, 0.008, std(0xe8e0cc), guitar, 0, NUT_Y, GF + 0.009, false);
    for (let i = 0; i < 6; i++) {
      const s = i < 3 ? -1 : 1;
      cyl(0.008, 0.008, 0.022, fretMat, guitar, s * 0.056, 1.09 + (i % 3) * 0.045, GF - 0.022, 8).rotation.z = Math.PI / 2;
    }
  }
  const strings = [];
  const stringMat = std(0xe2d2a8, { metalness: 0.9, roughness: 0.25, emissive: 0x4a3614 });
  for (let i = 0; i < 6; i++) {
    const s = box(0.0015 + (5 - i) * 0.00035, NUT_Y - SADDLE_Y + 0.01, 0.0015, stringMat, guitar, (i - 2.5) * STR_SP, (NUT_Y + SADDLE_Y) / 2, STR_Z, false);
    s.userData.x0 = s.position.x;
    s.userData.vib = 0;
    strings.push(s);
  }
  const standMat = std(0x101010, { metalness: 0.7, roughness: 0.4 });
  const stand = new THREE.Group();
  stand.position.set(0.55, 0, -R.hd + 0.48);
  scene.add(stand);
  cyl(0.012, 0.012, 0.8, standMat, stand, 0, 0.42, -0.2, 8).rotation.x = -0.25;
  for (const s of [-1, 1]) {
    cyl(0.01, 0.01, 0.42, standMat, stand, s * 0.13, 0.07, 0.02, 8).rotation.set(Math.PI / 2 - 0.25, 0, s * 0.5);
    cyl(0.012, 0.012, 0.12, standMat, stand, s * 0.09, 0.13, 0.1, 8).rotation.x = Math.PI / 2;
  }
  act(guitar, 'guitar');
  desyncable.push(guitar);
  let chord = GUITAR_CHORDS.Open;

  /* ---- the radio ---- */
  const radio = new THREE.Group();
  radio.position.set(3.05, 0, -R.hd + 0.3);
  radio.rotation.y = -0.1;
  scene.add(radio);
  const walnut = std(0x4a2a16, { roughness: 0.4 });
  rbox(0.86, 0.5, 0.34, 0.03, walnut, radio, 0, 0.53, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.022, 0.012, 0.3, darkWood, radio, sx * 0.36, 0.15, sz * 0.11, 8).rotation.z = -sx * 0.1;
  mesh(new THREE.PlaneGeometry(0.5, 0.4), std(0x2e261c, { roughness: 1 }), radio, -0.14, 0.53, 0.172, false);
  for (let i = 0; i < 9; i++) box(0.5, 0.012, 0.012, walnut, radio, -0.14, 0.35 + i * 0.045, 0.18, false);
  const cone = mesh(new THREE.CircleGeometry(0.15, 32), std(0x14110e, { roughness: 0.9 }), radio, -0.14, 0.53, 0.1735, false);
  mesh(new THREE.RingGeometry(0.15, 0.165, 32), std(0x2a2118, { metalness: 0.6, roughness: 0.4 }), radio, -0.14, 0.53, 0.174, false);
  mesh(new THREE.CircleGeometry(0.045, 20), std(0x0a0908, { roughness: 0.6 }), cone, 0, 0, 0.001, false);
  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = 256;
  dialCanvas.height = 128;
  const dialTex = new THREE.CanvasTexture(dialCanvas);
  dialTex.colorSpace = THREE.SRGBColorSpace;
  const radioState = { on: false, name: '', genre: '' };
  const drawDial = () => {
    const g = dialCanvas.getContext('2d');
    g.fillStyle = radioState.on ? '#2a1404' : '#0c0703';
    g.fillRect(0, 0, 256, 128);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = radioState.on ? '#ffb45a' : '#5a3a1a';
    g.font = '600 26px "Geist Mono", Consolas, monospace';
    g.fillText(radioState.on ? radioState.name.toUpperCase().slice(0, 15) : 'RADIO', 128, 44);
    g.font = '600 17px "Geist Mono", Consolas, monospace';
    g.fillText(radioState.on ? radioState.genre.toUpperCase() : 'CLICK TO TUNE IN', 128, 80);
    g.fillStyle = radioState.on ? '#ff6a1a' : '#3a2410';
    for (let i = 0; i < 25; i++) g.fillRect(18 + i * 9.2, 104, 2, i % 5 ? 7 : 13);
    dialTex.needsUpdate = true;
  };
  drawDial();
  const dialMat = new THREE.MeshBasicMaterial({ map: dialTex, color: new THREE.Color(1.5, 1.5, 1.5) });
  mesh(new THREE.PlaneGeometry(0.26, 0.13), dialMat, radio, 0.26, 0.64, 0.172, false);
  for (const x of [0.19, 0.33]) {
    cyl(0.032, 0.032, 0.03, brass, radio, x, 0.45, 0.18, 20).rotation.x = Math.PI / 2;
    box(0.004, 0.024, 0.004, std(0x1a1008), radio, x, 0.462, 0.196, false);
  }
  // a record leaning against it
  const sleeve = box(0.31, 0.31, 0.006, std(0x8a3a1c, { roughness: 0.7 }), radio, 0.62, 0.17, 0.02);
  sleeve.rotation.set(-0.2, 0.3, 0);
  const radioWash = new THREE.PointLight(0xff9a50, 3.2, 4.5, 1.8);
  radioWash.position.set(2.5, 1.25, -R.hd + 1.3);
  scene.add(radioWash);
  act(radio, 'radio');
  desyncable.push(radio);

  /* ---- the portrait ---- */
  const picFrame = new THREE.Group();
  picFrame.position.set(1.85, 1.95, -R.hd + 0.03);
  scene.add(picFrame);
  const FW = 0.95, FH = 1.25;
  box(FW + 0.05, FH + 0.05, 0.04, std(0x0a0a0a, { roughness: 0.3, metalness: 0.5 }), picFrame, 0, 0, 0);
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 760;
  faceCanvas.height = 1000;
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 8;
  let faceImg = null;
  const drawFace = () => { drawPortrait(faceCanvas.getContext('2d'), 760, 1000, faceImg); faceTex.needsUpdate = true; };
  drawFace();
  if (portrait) {
    const im = new Image();
    im.onload = () => { faceImg = im; drawFace(); };
    im.src = portrait;
  }
  mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ map: faceTex, color: new THREE.Color(1.25, 1.25, 1.25) }), picFrame, 0, 0, 0.021, false);
  act(picFrame, 'me');
  desyncable.push(picFrame);

  // shelf with a trailing plant, right of the frame
  box(0.9, 0.03, 0.2, darkWood, scene, 3.35, 1.62, -R.hd + 0.1);
  [[3.05, 0.2, 0.04], [3.12, 0.24, 0.035], [3.18, 0.21, 0.03], [3.24, 0.23, 0.04]].forEach(([x, h, w], i) => box(w, h, 0.14, std(bookCols[(i * 3) % 7], { roughness: 0.85 }), scene, x, 1.635 + h / 2, -R.hd + 0.1));

  /* ---- desk and laptop ---- */
  const desk = new THREE.Group();
  desk.position.set(-2.55, 0, 1.3);
  desk.rotation.y = 0.3; // the laptop looks back at the way in, so the work is the first thing you see
  scene.add(desk);
  const steel = std(0x111111, { metalness: 0.7, roughness: 0.4 });
  const DESK_Y = 0.75;
  rbox(1.7, 0.04, 0.72, 0.008, std(0x6a4426, { roughness: 0.45 }), desk, 0, DESK_Y - 0.02, 0);
  for (const s of [-1, 1]) {
    box(0.035, DESK_Y - 0.04, 0.035, steel, desk, s * 0.78, (DESK_Y - 0.04) / 2, 0.3);
    box(0.035, DESK_Y - 0.04, 0.035, steel, desk, s * 0.78, (DESK_Y - 0.04) / 2, -0.3);
    box(0.035, 0.035, 0.6, steel, desk, s * 0.78, 0.1, 0);
  }
  box(1.56, 0.035, 0.035, steel, desk, 0, 0.1, -0.3);

  const laptop = new THREE.Group();
  laptop.position.set(0, DESK_Y, 0.04);
  laptop.rotation.y = 0.04;
  desk.add(laptop);
  const LW = 0.312, LD = 0.214, SCR_W = 0.292, SCR_H = 0.19, LS = 1.25;
  laptop.scale.setScalar(LS);
  const night = std(0x15151b, { roughness: 0.35, metalness: 0.7 });
  const copper = std(0xc98a55, { roughness: 0.25, metalness: 1, emissive: 0x2a1408 });
  box(LW + 0.003, 0.004, LD + 0.003, copper, laptop, 0, 0.004, 0); // the gem-cut edge
  box(LW, 0.011, LD, night, laptop, 0, 0.0095, 0);
  mesh(new THREE.PlaneGeometry(LW - 0.012, LD - 0.012), std(0xffffff, { map: keyboardTexture(), roughness: 0.5, metalness: 0.4 }), laptop, 0, 0.0152, 0, false).rotation.x = -Math.PI / 2;
  const lid = new THREE.Group();
  lid.position.set(0, 0.016, -LD / 2 + 0.004);
  lid.rotation.x = -0.3;
  laptop.add(lid);
  box(LW, LD, 0.006, night, lid, 0, LD / 2, 0);
  box(LW + 0.002, 0.004, 0.008, copper, lid, 0, 0.002, 0);
  cyl(0.005, 0.005, LW * 0.8, copper, laptop, 0, 0.016, -LD / 2 + 0.004, 10).rotation.z = Math.PI / 2;
  const lapCanvas = document.createElement('canvas');
  lapCanvas.width = 1200;
  lapCanvas.height = 780;
  const lapTex = new THREE.CanvasTexture(lapCanvas);
  lapTex.colorSpace = THREE.SRGBColorSpace;
  lapTex.anisotropy = 8;
  const lapImages = projects.map((p) => {
    const im = new Image();
    im.onload = () => drawLap();
    im.src = p.image;
    return im;
  });
  let lapQueued = false;
  function drawLap() {
    if (lapQueued) return;
    lapQueued = true;
    setTimeout(() => {
      lapQueued = false;
      drawLaptop(lapCanvas.getContext('2d'), 1200, 780, projects, lapImages);
      lapTex.needsUpdate = true;
    }, 120);
  }
  drawLaptop(lapCanvas.getContext('2d'), 1200, 780, projects, lapImages);
  const lapScreen = mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: lapTex, color: new THREE.Color(0.95, 0.95, 0.95) }), lid, 0, LD / 2 + 0.002, 0.0035, false);
  act(laptop, 'laptop');
  desyncable.push(laptop);

  // desk lamp
  {
    const dl = new THREE.Group();
    dl.position.set(-0.62, DESK_Y, -0.18);
    desk.add(dl);
    cyl(0.07, 0.075, 0.016, steel, dl, 0, 0.008, 0, 20);
    cyl(0.007, 0.007, 0.36, steel, dl, 0.04, 0.18, 0, 8).rotation.z = -0.22;
    cyl(0.007, 0.007, 0.26, steel, dl, 0.16, 0.39, 0.04, 8).rotation.set(0.35, 0, -1.2);
    const head = mesh(new THREE.CylinderGeometry(0.03, 0.07, 0.1, 20, 1, true), std(0x15110d, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide, emissive: 0x6a3410 }), dl, 0.28, 0.41, 0.08, false);
    head.rotation.set(0.3, 0, -0.5);
    mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1.2) }), dl, 0.29, 0.39, 0.085, false);
    const spot = new THREE.SpotLight(0xffb070, 7, 3.4, 1.0, 0.8, 1.6);
    spot.position.set(0.29, 0.4, 0.085);
    spot.target.position.set(0.5, 0, 0.16);
    dl.add(spot, spot.target);
  }
  // mug, notebook, pen
  cyl(0.04, 0.034, 0.085, std(0x1c1c1c, { roughness: 0.35 }), desk, 0.45, DESK_Y + 0.0425, 0.14, 16);
  mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 14, Math.PI), std(0x1c1c1c, { roughness: 0.35 }), desk, 0.492, DESK_Y + 0.045, 0.14).rotation.z = -Math.PI / 2;
  box(0.2, 0.014, 0.27, std(0x8a3a1c, { roughness: 0.8 }), desk, -0.36, DESK_Y + 0.007, 0.14).rotation.y = 0.2;
  cyl(0.004, 0.004, 0.14, brass, desk, -0.34, DESK_Y + 0.018, 0.15, 6).rotation.set(Math.PI / 2, 0, 0.5);

  // stool
  cyl(0.19, 0.19, 0.05, std(0x5c2f16, { roughness: 0.6 }), desk, 0.05, 0.47, 0.72, 24);
  for (let i = 0; i < 3; i++) cyl(0.014, 0.012, 0.46, steel, desk, 0.05 + Math.cos(i * 2.094) * 0.13, 0.225, 0.72 + Math.sin(i * 2.094) * 0.13, 8);

  // incense: a stick in a wooden holder, a live ember, a thread of smoke
  const INC = { x: 0.42, z: 0.24 };
  box(0.2, 0.012, 0.035, std(0x3a2416, { roughness: 0.6 }), desk, INC.x, DESK_Y + 0.006, INC.z).rotation.y = 0.35;
  const stick = cyl(0.0014, 0.0014, 0.2, std(0x6a4a30, { roughness: 0.9 }), desk, INC.x + 0.02, DESK_Y + 0.105, INC.z, 5);
  stick.rotation.z = -0.3;
  const emberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 1.4, 0.3) });
  const ember = mesh(new THREE.SphereGeometry(0.0032, 8, 6), emberMat, desk, INC.x + 0.02 + Math.sin(0.3) * 0.1, DESK_Y + 0.105 + Math.cos(0.3) * 0.1, INC.z, false);
  const SMOKE = 70;
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SMOKE * 3), 3));
  smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from({ length: SMOKE }, (_, i) => (i + Math.random() * 0.6) / SMOKE), 1));
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale;
      varying float vA;
      void main() {
        float t = fract(uTime * 0.085 + aSeed);
        float h = t * 0.62;
        // straight for a hand's width, then it starts to wander
        float w = smoothstep(0.06, 0.5, t);
        vec3 p = vec3(
          sin(h * 9.0 + uTime * 0.5 + aSeed * 3.0) * 0.045 * w + 0.07 * t * t,
          h,
          cos(h * 7.0 + uTime * 0.37 + aSeed * 5.0) * 0.035 * w);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * (0.006 + 0.075 * t) / -mv.z;
        vA = smoothstep(0.0, 0.05, t) * pow(1.0 - t, 1.6);
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vec3(0.85, 0.8, 0.9), a * a * vA * 0.06);
      }`,
  });
  const smoke = new THREE.Points(smokeGeo, smokeMat);
  smoke.frustumCulled = false;
  smoke.position.copy(ember.position);
  desk.add(smoke);

  const entryLight = new THREE.PointLight(0xffa35c, 7, 8, 1.7);
  entryLight.position.set(0.4, 2.7, 6.2);
  scene.add(entryLight);

  // mandala, on the west wall above the monitors
  const mandala = new THREE.Group();
  mandala.position.set(-R.hw + 0.03, 2.35, 4.9);
  mandala.rotation.y = Math.PI / 2;
  scene.add(mandala);
  box(0.66, 0.66, 0.04, std(0x1a100a, { roughness: 0.5 }), mandala, 0, 0, 0);
  mesh(new THREE.PlaneGeometry(0.56, 0.56), std(0xffffff, { map: mandalaTexture(), roughness: 0.9 }), mandala, 0, 0, 0.022, false);

  const deskWash = new THREE.PointLight(0xffa060, 3.2, 5.5, 1.8);
  deskWash.position.set(-2.3, 2.3, 2.3);
  scene.add(deskWash);

  // a sconce on the west wall, between the books and the door
  {
    const sc = new THREE.Group();
    sc.position.set(-R.hw + 0.02, 1.95, 0.75);
    scene.add(sc);
    box(0.03, 0.2, 0.09, brass, sc, 0, 0, 0, false);
    cyl(0.008, 0.008, 0.14, brass, sc, 0.07, 0.02, 0, 8).rotation.z = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.5, 0.7) }), sc, 0.15, 0.04, 0, false);
    const l = new THREE.PointLight(0xffa35c, 9, 7, 1.7);
    l.position.set(0.35, 0.1, 0);
    sc.add(l);
  }

  /* ---- inkblot, on the wall beside the glass ---- */
  const inkCanvas = document.createElement('canvas');
  inkCanvas.width = 264;
  inkCanvas.height = 340;
  const inkTex = new THREE.CanvasTexture(inkCanvas);
  inkTex.colorSpace = THREE.SRGBColorSpace;
  inkTex.anisotropy = 8;
  let inkSeed = 4;
  const redrawInk = () => { drawInkblot(inkCanvas.getContext('2d'), 264, 340, inkSeed++); inkTex.needsUpdate = true; };
  redrawInk();
  const ink = new THREE.Group();
  ink.position.set(R.hw - 0.03, 1.62, 2.75);
  ink.rotation.y = -Math.PI / 2;
  scene.add(ink);
  box(0.92, 1.16, 0.045, std(0x1a100a, { roughness: 0.5 }), ink, 0, 0, 0);
  mesh(new THREE.PlaneGeometry(0.8, 1.04), std(0xffffff, { map: inkTex, roughness: 0.9 }), ink, 0, 0, 0.024, false);
  act(ink, 'ink');
  const picture = new THREE.SpotLight(0xffb070, 16, 5, 0.5, 0.8, 1.5);
  picture.position.set(R.hw - 1.3, 3.0, 2.75);
  picture.target = ink;
  scene.add(picture);

  /* ---- CRTs, against the south wall ---- */
  const crts = new THREE.Group();
  crts.position.set(-R.hw + 0.42, 0, 4.9);
  crts.rotation.y = Math.PI / 2 - 0.05;
  scene.add(crts);
  box(1.8, 0.42, 0.62, std(0x1d130c, { roughness: 0.6 }), crts, 0, 0.21, 0);
  box(1.86, 0.03, 0.66, std(0x2a1b10, { roughness: 0.5 }), crts, 0, 0.435, 0);
  const term = new TerminalScreen();
  const wave = new WaveScreen();
  const caseMat = std(0x7d7667, { roughness: 0.7 });
  const caseDark = std(0x2a2824, { roughness: 0.6 });
  const crt = (w, h, d, x, y, tex, mat = caseMat) => {
    const gr = new THREE.Group();
    gr.position.set(x, y, 0);
    crts.add(gr);
    rbox(w, h, d, 0.035, mat, gr, 0, 0, 0);
    mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.8), new THREE.MeshBasicMaterial({ color: 0x050505 }), gr, -w * 0.02, h * 0.03, d / 2 + 0.001, false);
    mesh(new THREE.PlaneGeometry(w * 0.76, h * 0.68), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.55, 1.55, 1.55) }), gr, -w * 0.02, h * 0.03, d / 2 + 0.002, false);
    cyl(0.012, 0.012, 0.012, std(0x111111), gr, w * 0.4, -h * 0.4, d / 2, 8).rotation.x = Math.PI / 2;
    return gr;
  };
  crt(0.78, 0.6, 0.56, -0.45, 0.75, term.tex, caseDark);
  crt(0.78, 0.6, 0.56, 0.4, 0.75, rainB.tex);
  const crtGlitch = crt(0.66, 0.5, 0.5, -0.1, 1.3, wave.tex);
  act(crts, 'crt');
  desyncable.push(crtGlitch);
  const crtLight = new THREE.PointLight(0x4dff8e, 1.4, 3.6, 1.8);
  crtLight.position.set(-R.hw + 1.4, 1.0, 4.9);
  scene.add(crtLight);

  /* ---- reading corner ---- */
  const rug = mesh(new THREE.PlaneGeometry(4.4, 2.9), std(0xffffff, { map: rugTexture(), roughness: 1 }), scene, 2.7, 0.012, 1.15, false);
  rug.rotation.x = -Math.PI / 2;
  rug.rotation.z = 0.04;

  const CHAIR = { x: 1.9, z: 1.6, ry: Math.PI / 2 + 0.12 };
  const chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z);
  chair.rotation.y = CHAIR.ry;
  scene.add(chair);
  const leather = std(0x5c2f16, { roughness: 0.62 });
  rbox(0.86, 0.26, 0.82, 0.07, leather, chair, 0, 0.3, 0);
  rbox(0.66, 0.14, 0.64, 0.06, std(0x6a3719, { roughness: 0.65 }), chair, 0, 0.47, 0.06);
  rbox(0.86, 0.86, 0.22, 0.09, leather, chair, 0, 0.76, -0.36).rotation.x = -0.16;
  for (const s of [-1, 1]) {
    rbox(0.2, 0.46, 0.84, 0.08, leather, chair, s * 0.5, 0.42, 0.0);
    for (const z of [-0.33, 0.33]) cyl(0.025, 0.018, 0.14, darkWood, chair, s * 0.42, 0.07, z, 8);
  }
  act(chair, 'chair');
  desyncable.push(chair);

  // side table with the phrenology head
  const table = new THREE.Group();
  table.position.set(2.05, 0, 2.55);
  scene.add(table);
  cyl(0.3, 0.3, 0.03, darkWood, table, 0, 0.56, 0, 28);
  cyl(0.025, 0.025, 0.55, darkWood, table, 0, 0.28, 0, 10);
  cyl(0.18, 0.2, 0.025, darkWood, table, 0, 0.0125, 0, 20);
  const headPts = [[0, 0], [0.075, 0], [0.075, 0.018], [0.03, 0.034], [0.034, 0.075], [0.055, 0.105], [0.076, 0.155], [0.082, 0.205], [0.072, 0.255], [0.042, 0.29], [0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y));
  const phren = mesh(new THREE.LatheGeometry(headPts, 28), std(0x8f887a, { roughness: 0.7 }), table, -0.06, 0.575, -0.04);
  phren.scale.set(1.15, 1.15, 1.3);
  const band = mesh(new THREE.TorusGeometry(0.094, 0.0025, 6, 32), std(0x1a1a1a), table, -0.06, 0.575 + 0.2 * 1.15, -0.04, false);
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 1.13, 1);
  cyl(0.04, 0.034, 0.085, std(0x1c1c1c, { roughness: 0.35 }), table, 0.14, 0.6175, 0.1, 16);
  desyncable.push(phren);

  // low table in front of the glass
  const low = new THREE.Group();
  low.position.set(3.45, 0, 1.35);
  scene.add(low);
  cyl(0.45, 0.45, 0.035, std(0x3a2416, { roughness: 0.4 }), low, 0, 0.36, 0, 36);
  for (let i = 0; i < 3; i++) cyl(0.018, 0.012, 0.35, steel, low, Math.cos(i * 2.094) * 0.3, 0.175, Math.sin(i * 2.094) * 0.3, 8);
  box(0.28, 0.03, 0.2, std(bookCols[3], { roughness: 0.85 }), low, -0.12, 0.393, 0.08).rotation.y = 0.4;
  box(0.24, 0.025, 0.18, std(bookCols[0], { roughness: 0.85 }), low, -0.11, 0.42, 0.08).rotation.y = 0.2;
  cyl(0.045, 0.038, 0.07, std(0xd9d2c2, { roughness: 0.4 }), low, 0.18, 0.413, -0.1, 16);

  [[0.3, 0.045, 0.22, 0.1], [0.27, 0.035, 0.2, -0.3], [0.29, 0.05, 0.21, 0.25], [0.22, 0.03, 0.17, -0.05]].reduce((y, [w, h, d, r], i) => {
    box(w, h, d, std(bookCols[(i * 2) % bookCols.length], { roughness: 0.85 }), scene, 2.85, y + h / 2, 2.45).rotation.y = r;
    return y + h;
  }, 0.014);

  // floor lamp
  const LAMP = { x: 1.3, z: 2.6 };
  const lamp = new THREE.Group();
  lamp.position.set(LAMP.x, 0, LAMP.z);
  scene.add(lamp);
  const lampMetal = std(0x2a2118, { metalness: 0.8, roughness: 0.35 });
  cyl(0.17, 0.19, 0.03, lampMetal, lamp, 0, 0.015, 0, 24);
  cyl(0.012, 0.012, 1.55, lampMetal, lamp, 0, 0.79, 0, 8);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, emissive: new THREE.Color(1.0, 0.42, 0.1), emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.9 });
  mesh(new THREE.CylinderGeometry(0.13, 0.23, 0.3, 28, 1, true), shadeMat, lamp, 0, 1.62, 0, false);
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1.2) });
  mesh(new THREE.SphereGeometry(0.04, 12, 10), lampBulbMat, lamp, 0, 1.58, 0, false);
  const lampSpot = new THREE.SpotLight(0xffa25e, 30, 8, 1.2, 0.8, 1.6);
  lampSpot.position.set(LAMP.x, 1.6, LAMP.z);
  lampSpot.target.position.set(LAMP.x + 0.6, 0, LAMP.z - 0.9);
  softShadow(lampSpot);
  scene.add(lampSpot, lampSpot.target);
  const lampGlow = new THREE.PointLight(0xff9a4d, 2.6, 5.5, 1.8);
  lampGlow.position.set(LAMP.x, 1.95, LAMP.z);
  scene.add(lampGlow);
  act(lamp, 'lamp');
  desyncable.push(lamp);
  let lampOn = 1, lampTarget = 1;

  // telescope, because of the view
  {
    const tel = new THREE.Group();
    tel.position.set(4.1, 0, -2.75);
    tel.rotation.y = 0.35;
    scene.add(tel);
    for (let i = 0; i < 3; i++) {
      const leg = cyl(0.012, 0.012, 1.25, darkWood, tel, Math.cos(i * 2.094) * 0.2, 0.6, Math.sin(i * 2.094) * 0.2, 8);
      leg.rotation.set(Math.sin(i * 2.094) * 0.33, 0, -Math.cos(i * 2.094) * 0.33);
    }
    cyl(0.03, 0.03, 0.06, brass, tel, 0, 1.2, 0, 12);
    const tube = new THREE.Group();
    tube.position.set(0, 1.27, 0);
    tube.rotation.z = -Math.PI / 2 + 0.22;
    tel.add(tube);
    cyl(0.045, 0.038, 0.62, brass, tube, 0, 0.08, 0, 20);
    cyl(0.052, 0.052, 0.06, std(0x1a1008, { roughness: 0.4 }), tube, 0, 0.4, 0, 20);
    cyl(0.02, 0.024, 0.12, std(0x1a1008, { roughness: 0.4 }), tube, 0, -0.28, 0, 12);
    desyncable.push(tel);
  }

  // bookshelf on the west wall
  const shelf = new THREE.Group();
  shelf.position.set(-R.hw + 0.2, 0, -1.3);
  shelf.rotation.y = Math.PI / 2;
  scene.add(shelf);
  const SHELF_H = 2.5;
  {
    const SW = 2.9, SD = 0.34, N = 5;
    const wood = std(0x2a190e, { roughness: 0.65 });
    box(0.05, SHELF_H, SD, wood, shelf, -SW / 2, SHELF_H / 2, 0);
    box(0.05, SHELF_H, SD, wood, shelf, SW / 2, SHELF_H / 2, 0);
    box(SW, SHELF_H, 0.02, std(0x150c07), shelf, 0, SHELF_H / 2, -SD / 2 + 0.01);
    const gap = (SHELF_H - 0.1) / N;
    const rnd = mulberry32(99);
    const dummy = new THREE.Object3D();
    const list = [];
    for (let s = 0; s <= N; s++) {
      const y = 0.08 + s * gap;
      box(SW, 0.035, SD, wood, shelf, 0, y, 0);
      if (s === N) break;
      let x = -SW / 2 + 0.06;
      while (x < SW / 2 - 0.1) {
        if (rnd() < 0.07) { x += 0.08 + rnd() * 0.2; continue; }
        const w = 0.028 + rnd() * 0.04, h = gap * (0.5 + rnd() * 0.36), d = 0.19 + rnd() * 0.06;
        const lean = rnd() < 0.08 ? (rnd() - 0.5) * 0.35 : 0;
        list.push({ x: x + w / 2, y: y + 0.018 + h / 2, w, h, d, lean, c: bookCols[(rnd() * bookCols.length) | 0], l: 0.55 + rnd() * 0.6 });
        x += w + 0.003 + Math.abs(lean) * 0.1;
      }
    }
    const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0xffffff, { roughness: 0.82 }), list.length);
    const col = new THREE.Color();
    list.forEach((b, i) => {
      dummy.position.set(b.x, b.y, 0.03);
      dummy.rotation.set(0, 0, b.lean);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      books.setMatrixAt(i, dummy.matrix);
      books.setColorAt(i, col.set(b.c).multiplyScalar(b.l));
    });
    books.castShadow = books.receiveShadow = true;
    shelf.add(books);
  }

  /* ---- plants ---- */
  const leafMats = [0x1f4a22, 0x2a5a2a, 0x18401f, 0x356a30].map((c) => std(c, { roughness: 0.55, side: THREE.DoubleSide }));
  const soil = std(0x1a120c, { roughness: 1 });
  const leafGeos = new Map();
  const leafGeo = (len, wid) => {
    const key = `${len.toFixed(2)}_${wid.toFixed(3)}`;
    if (leafGeos.has(key)) return leafGeos.get(key);
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(wid, len * 0.12, wid * 0.95, len * 0.68, 0, len);
    s.bezierCurveTo(-wid * 0.95, len * 0.68, -wid, len * 0.12, 0, 0);
    const g = new THREE.ShapeGeometry(s, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow(p.getY(i) / len, 2) * len * 0.2 + (Math.abs(p.getX(i)) / wid) * wid * 0.3);
    g.computeVertexNormals();
    leafGeos.set(key, g);
    return g;
  };
  const q = (v, step) => Math.round(v / step) * step;
  const addLeaf = (parent, x, y, z, yaw, tilt, len, wid, mat) => {
    const m = mesh(leafGeo(q(len, 0.02), q(wid, 0.005)), mat, parent, x, y, z);
    m.rotation.order = 'YXZ';
    m.rotation.set(tilt, yaw, 0);
    return m;
  };
  const pot = (g, r, h, mat) => {
    cyl(r, r * 0.76, h, mat, g, 0, h / 2, 0, 24);
    cyl(r * 0.93, r * 0.93, 0.012, soil, g, 0, h - 0.014, 0, 20);
  };
  const plantAt = (x, y, z, parent = scene) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  const terracotta = std(0x8a4a2a, { roughness: 0.8 });
  const ceramic = std(0xd9d2c2, { roughness: 0.35 });
  const blackPot = std(0x151311, { roughness: 0.5 });

  function monstera(x, z, seed, scale = 1) {
    const g = plantAt(x, 0, z);
    g.scale.setScalar(scale);
    const rnd = mulberry32(seed);
    pot(g, 0.2, 0.34, blackPot);
    for (let i = 0; i < 13; i++) {
      const pv = new THREE.Group();
      pv.position.set(0, 0.32, 0);
      pv.rotation.order = 'YXZ';
      pv.rotation.set(0.18 + rnd() * 0.5, i * 2.4 + rnd() * 0.4, 0);
      g.add(pv);
      const sh = 0.32 + rnd() * 0.62;
      cyl(0.006, 0.008, sh, leafMats[2], pv, 0, sh / 2, 0, 5);
      addLeaf(pv, 0, sh, 0, 0, 0.7 + rnd() * 0.6, 0.24 + rnd() * 0.14, 0.1 + rnd() * 0.05, leafMats[i % 4]);
    }
    desyncable.push(g);
    return g;
  }
  function snake(x, z, seed) {
    const g = plantAt(x, 0, z);
    const rnd = mulberry32(seed);
    pot(g, 0.15, 0.24, ceramic);
    for (let i = 0; i < 11; i++) {
      const a = rnd() * TAU, r = rnd() * 0.07;
      addLeaf(g, Math.cos(a) * r, 0.22, Math.sin(a) * r, a + rnd(), 0.04 + rnd() * 0.24, 0.5 + rnd() * 0.45, 0.04 + rnd() * 0.015, leafMats[i % 4]);
    }
    return g;
  }
  function ficus(x, z, seed) {
    const g = plantAt(x, 0, z);
    const rnd = mulberry32(seed);
    pot(g, 0.22, 0.4, terracotta);
    const trunk = cyl(0.016, 0.026, 1.5, std(0x3a2a1c, { roughness: 0.9 }), g, 0.02, 1.1, 0, 8);
    trunk.rotation.z = -0.04;
    for (let i = 0; i < 30; i++) {
      const y = 0.95 + rnd() * 1.05, a = i * 2.4 + rnd();
      addLeaf(g, 0.02 + Math.cos(a) * 0.03, y, Math.sin(a) * 0.03, -a + Math.PI / 2, 0.75 + rnd() * 0.75, 0.24 + rnd() * 0.1, 0.085 + rnd() * 0.03, leafMats[i % 4]);
    }
    desyncable.push(g);
    return g;
  }
  function pothos(parent, x, y, z, seed, vines = 3, len = 9) {
    const g = plantAt(x, y, z, parent);
    const rnd = mulberry32(seed);
    pot(g, 0.075, 0.11, ceramic);
    for (let i = 0; i < 9; i++) addLeaf(g, 0, 0.1, 0, rnd() * TAU, 0.5 + rnd() * 0.8, 0.09, 0.04, leafMats[i % 4]);
    for (let v = 0; v < vines; v++) {
      const a = (v / vines) * Math.PI - Math.PI / 2 + (rnd() - 0.5) * 0.6; // spill over the front
      let px = Math.sin(a) * 0.07, pz = Math.cos(a) * 0.07, py = 0.1;
      const n = len - ((rnd() * 3) | 0);
      for (let k = 0; k < n; k++) {
        px += Math.sin(a) * 0.012 + (rnd() - 0.5) * 0.02;
        pz += Math.cos(a) * (k < 2 ? 0.04 : 0.004);
        py -= k < 1 ? 0.02 : 0.075;
        addLeaf(g, px, py, pz, a + (rnd() - 0.5) * 1.6, 2.2 + rnd() * 0.7, 0.085, 0.038, leafMats[(k + v) % 4]);
      }
    }
    return g;
  }
  function succulent(parent, x, y, z, seed) {
    const g = plantAt(x, y, z, parent);
    const rnd = mulberry32(seed);
    pot(g, 0.05, 0.06, terracotta);
    for (let i = 0; i < 10; i++) addLeaf(g, 0, 0.055, 0, i * 2.4, 0.5 + (i / 10) * 0.7 + rnd() * 0.2, 0.07, 0.022, leafMats[i % 4]);
    return g;
  }
  ficus(-4.3, -3.3, 11);
  snake(-0.5, -3.6, 12);
  monstera(4.35, 3.5, 13, 0.9);
  monstera(-4.3, 6.6, 14, 0.85);
  ficus(4.3, 6.3, 21);
  snake(-4.4, 3.45, 22);
  snake(4.5, 1.72, 17);
  pothos(scene, 3.55, 1.635, -R.hd + 0.11, 15, 3, 9);
  pothos(shelf, 1.05, SHELF_H + 0.0, 0.02, 16, 3, 10);
  succulent(desk, 0.68, DESK_Y, -0.2, 18);
  succulent(low, 0.05, 0.378, 0.2, 19);

  /* ---- dust ---- */
  const DUST = 200;
  const dustGeo = new THREE.BufferGeometry();
  {
    const p = new Float32Array(DUST * 3);
    const rnd = mulberry32(55);
    for (let i = 0; i < DUST; i++) {
      p[i * 3] = -4.6 + rnd() * 9.2;
      p[i * 3 + 1] = 0.2 + rnd() * 2.9;
      p[i * 3 + 2] = -3.7 + rnd() * 11;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  }
  const moteTex = canvasTexture(32, 32, (g) => {
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, '#fff');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
  });
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: moteTex, color: new THREE.Color(1.6, 1.0, 0.55), size: 0.014, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---- post ---- */
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: small ? 2 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.62, 0.75, 1.0);
  composer.addPass(bloom);
  const final = new ShaderPass(FinalShader);
  final.uniforms.uGlyphs.value = glyphAtlas();
  final.uniforms.uGlitch.value = [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()];
  final.uniforms.uTear.value = new THREE.Vector3();
  final.uniforms.uExposure.value = 1.15;
  composer.addPass(final);
  const U = final.uniforms;

  /* ---- matrix tells ---- */
  const wireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1.5, 0.45), wireframe: true });
  const desyncs = [];
  function desync(obj, ms) {
    if (obj.userData.desynced) return;
    obj.userData.desynced = true;
    const stash = [];
    obj.traverse((o) => {
      if (o.isMesh) { stash.push([o, o.material]); o.material = wireMat; }
    });
    desyncs.push({ obj, stash, until: performance.now() + ms });
  }
  function settleDesyncs(now) {
    for (let i = desyncs.length - 1; i >= 0; i--) {
      const d = desyncs[i];
      if (now >= d.until) {
        d.stash.forEach(([o, m]) => (o.material = m));
        d.obj.userData.desynced = false;
        desyncs.splice(i, 1);
      }
    }
  }
  const glitches = []; // {slot, until}
  function blockGlitch() {
    const n = 1 + ((Math.random() * 3) | 0);
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const w = 0.05 + Math.random() * 0.22, h = 0.03 + Math.random() * 0.16;
      U.uGlitch.value[i].set(Math.random() * (1 - w), 0.08 + Math.random() * (0.84 - h), w, h);
      glitches.push({ slot: i, until: now + 90 + Math.random() * 240 });
    }
    if (Math.random() < 0.6) {
      U.uTear.value.set(Math.random() * 0.9, 0.01 + Math.random() * 0.05, (Math.random() - 0.5) * 0.06);
      glitches.push({ slot: -1, until: now + 70 + Math.random() * 120 });
    }
  }
  const cityFlash = (now) => { skyRainUntil = now + 140 + Math.random() * 260; };
  let nextTell = performance.now() + 6000;
  function tell(now) {
    if (now < nextTell || matrixTarget === 1 || reduced) return;
    nextTell = now + 4200 + Math.random() * 5600;
    const r = Math.random();
    if (r < 0.45) blockGlitch();
    else if (r < 0.82) desync(desyncable[(Math.random() * desyncable.length) | 0], 110 + Math.random() * 260);
    else cityFlash(now);
  }

  /* ---- camera and views ---- */
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpN = new THREE.Vector3();
  const V = (x, y, z, yaw, pitch, roll = 0) => ({ pos: new THREE.Vector3(x, y, z), yaw, pitch, roll });
  const walk = { x: START.x, z: START.z }; // where you are standing
  const held = new Set(); // movement keys currently down
  // things you cannot walk through: [x, z, radius]
  const SOLID = [[-2.55, 1.3, 1.15], [1.9, 1.6, 0.8], [3.45, 1.35, 0.65], [1.3, 2.6, 0.4], [2.05, 2.55, 0.45], [-1.9, -2.8, 0.7], [4.1, -2.75, 0.55], [0.55, -3.5, 0.6]];
  // stand `dist` in front of a surface and look straight at it
  function facing(obj, local, dist, roll = 0) {
    obj.updateWorldMatrix(true, false);
    const target = obj.localToWorld(tmpA.copy(local));
    obj.getWorldDirection(tmpN); // the surface's +z, in world space
    const pos = target.clone().addScaledVector(tmpN, dist);
    return { pos, yaw: Math.atan2(tmpN.x, tmpN.z), pitch: Math.asin(clamp(-tmpN.y, -1, 1)), roll };
  }
  function viewFor(name) {
    const tall = camera.aspect < 1;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    switch (name) {
      case 'me':
        return tall ? V(1.85, 1.55, -R.hd + 2.4, 0, -0.23) : V(2.62, 1.95, -R.hd + 2.3, 0, 0);
      case 'laptop': {
        const d = Math.max((SCR_H * LS) / 0.8 / (2 * tanV), (SCR_W * LS) / 0.92 / (2 * tanV * camera.aspect));
        return facing(lapScreen, new THREE.Vector3(0, 0, 0), d);
      }
      case 'piano':
        return tall ? V(-1.9, 1.75, -R.hd + 1.75, 0, -0.72) : V(-1.9, 1.62, -R.hd + 1.62, 0, -0.69);
      case 'guitar':
        return tall ? facing(guitar, new THREE.Vector3(0, 0.6, STR_Z), 1.25) : facing(guitar, new THREE.Vector3(0, 0.6, STR_Z), 0.66, -Math.PI / 2);
      case 'chair':
        return V(CHAIR.x + Math.sin(CHAIR.ry) * 0.05, 1.14, CHAIR.z + Math.cos(CHAIR.ry) * 0.05, CHAIR.ry + Math.PI, 0.05);
      case 'radio':
        return V(2.78, 1.02, -R.hd + 1.95, -0.16, -0.3);
      default:
        return V(walk.x, 1.6, walk.z, 0, -0.03);
    }
  }
  // how far each view lets you turn: [yaw, pitch down, pitch up]
  const FREEDOM = { home: [Infinity, 0.6, 0.5], chair: [Infinity, 0.6, 0.6], piano: [0.5, 0.25, 0.5] };
  const cam = { pos: new THREE.Vector3(START.x, 1.6, START.z + (reduced ? 0 : 0.9)), yaw: 0, pitch: -0.03, roll: 0 };
  const look = { yaw: 0, pitch: 0 };
  let view = 'home', base = viewFor('home'), viewSince = 0;
  let intro = 0;

  function go(name) {
    if (name === view) return;
    const b = viewFor(name);
    if (name === 'home') {
      look.yaw = cam.yaw; // keep facing whatever you just left
      look.pitch = 0;
    } else {
      b.yaw += TAU * Math.round((cam.yaw - b.yaw) / TAU);
      look.yaw = look.pitch = 0;
    }
    view = name;
    base = b;
    viewSince = performance.now();
    intro = 0;
    strumPrev = null;
    onHover(null);
    onView(name);
  }
  const back = () => go('home');

  /* ---- interaction ---- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const mouse = { x: 0, y: 0, cx: 0, cy: 0, dirty: false, inside: false };
  const ptr = { down: false, mode: '', drag: false, sx: 0, sy: 0, lx: 0, ly: 0, lastKey: null, type: 'mouse' };
  let hovered = null;
  const LABELS = {
    piano: 'Play the piano', guitar: 'Play the guitar', chair: 'Take a seat', window: 'Sit and watch the city', me: 'Who lives here',
    laptop: 'Open the work', radio: 'Radio', ink: 'What do you see?', crt: 'Wake up', lamp: 'Light', neon: 'Know thyself',
  };

  function pick() {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(interactives, true)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !o.userData.act) o = o.parent;
    return o ? o.userData.act : null;
  }
  function pickKey() {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(keyMeshes, false)[0];
    return hit ? hit.object : null;
  }
  function hitKey(k, vel = 1) {
    if (!k) return;
    playKey(k.userData.midi, vel);
    pressed.push({ k, at: performance.now() });
  }
  // where the pointer meets the plane of the strings, in the guitar's own space
  const inv = new THREE.Matrix4();
  function guitarPoint() {
    ray.setFromCamera(ndc, camera);
    inv.copy(guitar.matrixWorld).invert();
    const o = tmpA.copy(ray.ray.origin).applyMatrix4(inv);
    const d = tmpB.copy(ray.ray.direction).transformDirection(inv);
    if (Math.abs(d.z) < 1e-5) return null;
    const t = (STR_Z - o.z) / d.z;
    if (t < 0) return null;
    const x = o.x + d.x * t, y = o.y + d.y * t;
    if (y < SADDLE_Y - 0.01 || y > NUT_Y + 0.01) return null;
    return { s: x / STR_SP + 2.5, y };
  }
  function pluckString(i, y, vel = 1) {
    let fret = chord[i];
    if (y > 0.5) fret = fretYs.filter((f) => f > y).length + 1; // a finger on the fretboard
    if (y > NUT_Y - 0.004) fret = 0;
    if (fret < 0) return; // muted in this chord
    pluck(OPEN_STRINGS[i] + fret, vel);
    strings[i].userData.vib = 1;
  }
  let strumPrev = null;
  function strumMove() {
    const p = guitarPoint();
    if (p && strumPrev) {
      const a = Math.min(p.s, strumPrev.s), b = Math.max(p.s, strumPrev.s);
      if (b - a < 6) {
        const hits = [];
        for (let i = 0; i < 6; i++) if (a < i && b >= i) hits.push(i);
        if (p.s < strumPrev.s) hits.reverse();
        hits.forEach((i) => pluckString(i, p.y, 0.9));
      }
    }
    strumPrev = p && p.s > -1.5 && p.s < 6.5 ? p : null;
  }
  function strumClick() {
    const p = guitarPoint();
    if (!p) return false;
    const i = Math.round(p.s);
    if (i < 0 || i > 5 || Math.abs(p.s - i) > 0.5) return false;
    pluckString(i, p.y);
    return true;
  }
  function strumAll(up = false) {
    const order = up ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
    order.forEach((i, n) => setTimeout(() => pluckString(i, 0.3, 0.9), n * 28));
  }

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    mouse.cx = e.clientX;
    mouse.cy = e.clientY;
    mouse.x = ndc.x;
    mouse.y = ndc.y;
  }
  const onDown = (e) => {
    if (e.button > 0) return;
    setPointer(e);
    intro = 0;
    ptr.down = true;
    ptr.drag = false;
    ptr.type = e.pointerType;
    ptr.sx = ptr.lx = e.clientX;
    ptr.sy = ptr.ly = e.clientY;
    ptr.mode = 'look';
    ptr.lastKey = null;
    if (view === 'piano') {
      const k = pickKey();
      if (k) { ptr.mode = 'keys'; ptr.lastKey = k; hitKey(k); }
    } else if (view === 'guitar') {
      strumPrev = guitarPoint();
      if (strumClick()) ptr.mode = 'strum';
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
  };
  const onMove = (e) => {
    setPointer(e);
    mouse.dirty = true;
    mouse.inside = true;
    if (ptr.down) {
      const dx = e.clientX - ptr.lx, dy = e.clientY - ptr.ly;
      ptr.lx = e.clientX;
      ptr.ly = e.clientY;
      if (Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) ptr.drag = true;
      if (ptr.mode === 'keys') {
        const k = pickKey();
        if (k && k !== ptr.lastKey) { ptr.lastKey = k; hitKey(k, 0.85); }
      } else if (ptr.mode === 'look' && ptr.drag && FREEDOM[view]) {
        const f = FREEDOM[view];
        const sens = (THREE.MathUtils.degToRad(camera.fov) / (canvas.clientHeight || 1)) * 1.15;
        look.yaw = clamp(look.yaw + dx * sens, -f[0], f[0]);
        if (ptr.type === 'mouse') look.pitch = clamp(look.pitch + dy * sens, -f[1], f[2]);
      }
    }
    if (view === 'guitar' && (ptr.type !== 'touch' || ptr.down) && (e.pointerType === 'mouse' || ptr.down)) strumMove();
  };
  const onUp = (e) => {
    if (!ptr.down) return;
    ptr.down = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* fine */ }
    if (e.type === 'pointercancel') return;
    if (!ptr.drag && ptr.mode === 'look') {
      setPointer(e);
      const a = pick();
      if (a) actions[a]();
    }
    if (e.pointerType !== 'mouse') strumPrev = null;
  };
  const onLeave = () => { mouse.inside = false; hovered = null; strumPrev = null; onHover(null); canvas.style.cursor = ''; };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  const onKeyDown = (e) => {
    if (e.repeat && MOVE.has(e.key.length === 1 ? e.key.toLowerCase() : e.key) && held.size) return e.preventDefault();
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || scroll > 0.6) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'Escape' && view !== 'home') return back();
    if (view === 'piano' && KEYMAP[k]) { e.preventDefault(); return hitKey(keys.get(KEYMAP[k])); }
    if (view === 'guitar' && (k === ' ' || k === 'ArrowDown' || k === 'ArrowUp')) { e.preventDefault(); return strumAll(k === 'ArrowUp'); }
    // arrows walk and turn; W A S D walk and sidestep. Only while the room is on screen.
    if (MOVE.has(k) && FREEDOM[view] && scroll < 0.3 && (k.startsWith('Arrow') || view === 'home')) {
      e.preventDefault();
      held.add(k);
    }
  };
  const MOVE = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);
  const onKeyUp = (e) => held.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const onBlur = () => held.clear();
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('blur', onBlur);

  const actions = {
    piano: () => go('piano'),
    guitar: () => go('guitar'),
    chair: () => go('chair'),
    window: () => go('chair'),
    me: () => go('me'),
    laptop: () => go('laptop'),
    radio: () => { playClick(); go('radio'); },
    ink() { redrawInk(); playClick(); desync(ink, 90); },
    lamp() { lampTarget = lampTarget ? 0 : 1; playClick(); },
    neon() { neonFlicker = 1; playClick(); },
    crt() { playClick(); onMatrixRequest(); },
  };

  /* ---- sizing ---- */
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    const pr = renderer.getPixelRatio();
    U.uRes.value.set(w * pr, h * pr);
    U.uCell.value = Math.round((w < 700 ? 7 : 9) * pr);
    const aspect = w / h;
    camera.aspect = aspect;
    const hfov = THREE.MathUtils.degToRad(aspect < 1 ? 44 : 64);
    const v = 2 * Math.atan(Math.tan(hfov / 2) / aspect);
    camera.fov = clamp(THREE.MathUtils.radToDeg(v), 32, 74);
    camera.updateProjectionMatrix();
    smokeMat.uniforms.uScale.value = (h * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const b = viewFor(view);
    if (view !== 'home') b.yaw += TAU * Math.round((base.yaw - b.yaw) / TAU);
    base = b;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // where the laptop's screen sits on the page, so the real grid can lie on it
  const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
  function screenRect() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [sx, sy] of corners) {
      tmpA.set((sx * SCR_W) / 2, (sy * SCR_H) / 2, 0);
      lapScreen.localToWorld(tmpA).project(camera);
      const px = (tmpA.x * 0.5 + 0.5) * w, py = (-tmpA.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ---- loop ---- */
  let matrix = 0, matrixTarget = 0;
  let running = false, visible = true, raf = 0;
  let last = performance.now(), time = 0, screenClock = 0, fade = 0, frames = 0;
  let scroll = 0;
  const targetPos = new THREE.Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05); // a frame can be stamped before the clock we started from
    last = now;
    time += dt;

    // screens tick at ~12fps
    screenClock += dt;
    if (screenClock > 0.082) {
      screenClock = 0;
      rain.step();
      rainB.step();
      skyRainTex.needsUpdate = true;
      term.step();
      wave.step();
    }

    // keys
    for (let i = pressed.length - 1; i >= 0; i--) {
      const p = pressed[i];
      const a = (now - p.at) / 1000;
      const down = a < 0.05 ? a / 0.05 : Math.max(0, 1 - (a - 0.05) / 0.35);
      p.k.position.y = p.k.userData.y0 - down * 0.012;
      if (a > 0.42) { p.k.position.y = p.k.userData.y0; pressed.splice(i, 1); }
    }
    // strings
    for (let i = 0; i < 6; i++) {
      const s = strings[i];
      if (s.userData.vib > 0) {
        s.userData.vib = Math.max(0, s.userData.vib - dt * 1.1);
        s.position.x = s.userData.x0 + Math.sin(now * 0.11 + i * 1.7) * 0.0026 * s.userData.vib * s.userData.vib;
      }
    }
    metroArm.rotation.z = reduced ? 0.2 : Math.sin(time * Math.PI * 1.5) * 0.42;
    cone.scale.setScalar(radioState.on && !reduced ? 1 + Math.sin(time * 13) * 0.012 + Math.sin(time * 29) * 0.008 : 1);

    // light life
    const flick = 1 + (Math.sin(time * 13.1) * Math.sin(time * 7.3) > 0.95 ? -0.2 : 0) + Math.sin(time * 2.1) * 0.02;
    bulbLight.intensity = 62 * flick;
    bulbMat.color.setRGB(3.2 * flick, 1.5 * flick, 0.45 * flick);
    let nf = 1 + Math.sin(time * 40) * 0.015;
    if (neonFlicker > 0) { neonFlicker = Math.max(0, neonFlicker - dt * 1.6); nf *= Math.sin(now * 0.06) > 0 ? 1 : 0.15; }
    else if (Math.sin(time * 0.71) * Math.sin(time * 5.3) > 0.985) nf *= 0.4;
    neonMat.color.setScalar(1.8 * nf);
    neonLight.intensity = 5 * nf;
    crtLight.intensity = 1.4 * (0.85 + Math.sin(time * 9) * 0.07 + Math.sin(time * 23) * 0.05);
    lampOn += (lampTarget - lampOn) * Math.min(1, dt * 9);
    lampSpot.intensity = 30 * lampOn;
    lampGlow.intensity = 2.6 * lampOn;
    shadeMat.emissiveIntensity = 0.03 + 0.57 * lampOn;
    lampBulbMat.color.setRGB(0.1 + 4.9 * lampOn, 0.08 + 2.92 * lampOn, 0.05 + 1.15 * lampOn);
    // the tower: a slow red beacon, a quick white strobe
    const bk = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(time * 2.1)), 4);
    beaconMat.color.setRGB(6 * bk, 0.5 * bk, 0.3 * bk);
    strobe.visible = time % 1.6 < 0.09;

    smokeMat.uniforms.uTime.value = reduced ? 3 : time;
    const eb = 0.75 + Math.sin(time * 3.1) * 0.15 + Math.sin(time * 7.7) * 0.1;
    emberMat.color.setRGB(5 * eb, 1.4 * eb, 0.3 * eb);

    dust.rotation.y = time * 0.012;
    dust.position.y = Math.sin(time * 0.2) * 0.08;

    // matrix
    tell(now);
    settleDesyncs(now);
    skyRain.visible = now < skyRainUntil;
    for (let i = glitches.length - 1; i >= 0; i--) {
      if (now >= glitches[i].until) {
        if (glitches[i].slot < 0) U.uTear.value.set(0, 0, 0);
        else U.uGlitch.value[glitches[i].slot].set(0, 0, 0, 0);
        glitches.splice(i, 1);
      }
    }
    matrix += clamp(matrixTarget - matrix, -dt / 1.5, dt / 1.5);
    U.uMatrix.value = matrixTarget ? matrix : matrix * matrix;
    U.uTime.value = time;

    // camera
    if (held.size && FREEDOM[view] && scroll < 0.3) {
      const turn = (held.has('ArrowLeft') ? 1 : 0) - (held.has('ArrowRight') ? 1 : 0);
      look.yaw = clamp(look.yaw + turn * dt * 1.7, -FREEDOM[view][0], FREEDOM[view][0]);
      if (view === 'home') {
        const fwd = (held.has('ArrowUp') || held.has('w') ? 1 : 0) - (held.has('ArrowDown') || held.has('s') ? 1 : 0);
        const side = (held.has('d') ? 1 : 0) - (held.has('a') ? 1 : 0);
        if (fwd || side) {
          const sp = 2.3 * dt, sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
          walk.x = clamp(walk.x + (-sy * fwd + cy * side) * sp, -4.3, 4.3);
          walk.z = clamp(walk.z + (-cy * fwd - sy * side) * sp, -2.9, SOUTH - 0.7);
          for (const [ox, oz, r] of SOLID) {
            const dx = walk.x - ox, dz = walk.z - oz, d = Math.hypot(dx, dz);
            if (d < r && d > 1e-4) { walk.x = ox + (dx / d) * r; walk.z = oz + (dz / d) * r; }
          }
          base.pos.x = walk.x;
          base.pos.z = walk.z;
        }
      }
    }
    const free = FREEDOM[view];
    const still = reduced ? 0 : 1;
    const par = view === 'laptop' ? 0 : free ? 0.045 : 0.02;
    const ty = base.yaw + look.yaw - mouse.x * par * still;
    const tp = clamp(base.pitch + look.pitch + mouse.y * par * 0.5 * still, -1.3, 1.3);
    targetPos.copy(base.pos);
    targetPos.y += (view === 'laptop' ? 0 : Math.sin(time * 0.5) * 0.006 * still) - scroll * 0.3; // no sway at the laptop: the page's grid lies on its screen
    const settled = now - viewSince > 1400;
    const kPos = 1 - Math.exp(-dt * (view === 'home' && settled ? 9 : 3.4));
    const kRot = 1 - Math.exp(-dt * (ptr.down && ptr.drag ? 18 : settled && free ? 7 : 3.4));
    cam.pos.lerp(targetPos, kPos);
    cam.yaw += (ty - cam.yaw) * kRot;
    cam.pitch += (tp - cam.pitch) * kRot;
    cam.roll += (base.roll - cam.roll) * kPos;
    camera.position.copy(cam.pos);
    camera.rotation.set(cam.pitch, cam.yaw, cam.roll);
    camera.updateMatrixWorld();

    if (view === 'laptop') onScreenRect(screenRect(), cam.pos.distanceTo(targetPos) < 0.02);

    // hover
    if (mouse.dirty && mouse.inside && !ptr.down) {
      mouse.dirty = false;
      let a = pick();
      const onKey = view === 'piano' && pickKey();
      if (a === view || onKey) a = null;
      if (a !== hovered || onKey) {
        hovered = a;
        canvas.style.cursor = a || onKey ? 'pointer' : free ? 'grab' : '';
      }
      onHover(a ? LABELS[a] : null, mouse.cx, mouse.cy);
    }

    fade = Math.min(1, fade + dt / 1.4);
    U.uFade.value = ease(fade) * (1 - scroll * 0.6);
    composer.render(dt);
    if (++frames === 2) onReady();
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    cancelAnimationFrame(raf);
    if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  const sync = () => setRunning(visible && !document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();

  // canvases drawn with the page fonts: redraw once those have arrived
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('500 150px Geist'), document.fonts.load('600 40px Geist'), document.fonts.load('600 22px "Geist Mono"')]).then(() => {
      drawNeon();
      drawDial();
      drawFace();
      drawLap();
    });
  }

  return {
    go,
    back,
    get view() { return view; },
    setChord(name) { chord = GUITAR_CHORDS[name] || GUITAR_CHORDS.Open; },
    strum: strumAll,
    setRadio(state) { Object.assign(radioState, state); drawDial(); },
    setMatrix(on) { matrixTarget = on ? 1 : 0; },
    setVisible(on) { visible = on; sync(); },
    setScroll(v) { scroll = clamp(v, 0, 1); },
    glitch: blockGlitch,
    /** test hooks */
    _do(name) { actions[name](); },
    _key(midi) { hitKey(keys.get(midi)); },

    _snap() { fade = 1; intro = 0; viewSince = 0; cam.pos.copy(base.pos); cam.yaw = base.yaw + look.yaw; cam.pitch = base.pitch + look.pitch; cam.roll = base.roll; },
    _look(yaw, pitch = 0) { intro = 0; look.yaw = yaw; look.pitch = pitch; },
    dispose() {
      setRunning(false);
      ro.disconnect();
      document.removeEventListener('visibilitychange', sync);
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      renderer.dispose();
    },
  };
}
