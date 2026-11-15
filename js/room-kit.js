// Building blocks for the room: helpers, canvas-drawn textures, the little
// animated screens and the final lens shader. Nothing here touches the scene.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ORANGE = 0xff4d00;
const GLYPHS = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗ0123456789:=*+<>';

/* ------------------------------------------------------------------ utils */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w, h, draw, { repeat = null, color = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });

function mesh(geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (w, h, d, mat, parent, x, y, z, shadow) =>
  mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, shadow);
const rbox = (w, h, d, r, mat, parent, x, y, z) =>
  mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, parent, x, y, z);
const cyl = (rt, rb, h, mat, parent, x, y, z, seg = 20) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, parent, x, y, z);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* --------------------------------------------------------------- textures */

function wallTexture(seed) {
  const rnd = mulberry32(seed);
  return canvasTexture(
    1024,
    512,
    (g, w, h) => {
      g.fillStyle = '#8a8178';
      g.fillRect(0, 0, w, h);
      // large tonal stains
      for (let i = 0; i < 90; i++) {
        const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 180;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        const dark = rnd() > 0.45;
        grad.addColorStop(0, dark ? 'rgba(40,34,30,0.16)' : 'rgba(190,178,160,0.10)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // drips
      for (let i = 0; i < 26; i++) {
        const x = rnd() * w, y = rnd() * h * 0.4, len = 60 + rnd() * 260;
        const grad = g.createLinearGradient(0, y, 0, y + len);
        grad.addColorStop(0, 'rgba(30,24,20,0.20)');
        grad.addColorStop(1, 'rgba(30,24,20,0)');
        g.fillStyle = grad;
        g.fillRect(x, y, 2 + rnd() * 5, len);
      }
      // grit
      for (let i = 0; i < 16000; i++) {
        const v = rnd();
        g.fillStyle = v > 0.5 ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.09)';
        g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
      }
      // formwork seams and tie holes
      g.strokeStyle = 'rgba(20,16,14,0.22)';
      g.lineWidth = 2;
      for (let x = 0; x <= w; x += 256) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
      }
      g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      g.fillStyle = 'rgba(15,12,10,0.4)';
      for (let x = 64; x < w; x += 128) {
        for (const y of [h * 0.25, h * 0.75]) {
          g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
        }
      }
    },
    { repeat: [1, 1] }
  );
}

function floorTexture() {
  const rnd = mulberry32(7);
  return canvasTexture(
    1024,
    1024,
    (g, w, h) => {
      const rows = 10, rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rnd() * 300;
        while (x < w) {
          const len = 260 + rnd() * 380;
          const l = 19 + rnd() * 6;
          g.fillStyle = `hsl(${20 + rnd() * 8}, ${30 + rnd() * 10}%, ${l}%)`;
          g.fillRect(x, r * rh, len, rh);
          // grain
          for (let i = 0; i < 46; i++) {
            g.strokeStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '255,210,160'},${0.03 + rnd() * 0.06})`;
            g.lineWidth = 1;
            const gy = r * rh + rnd() * rh;
            g.beginPath();
            g.moveTo(x, gy);
            g.bezierCurveTo(x + len * 0.3, gy + (rnd() - 0.5) * 8, x + len * 0.6, gy + (rnd() - 0.5) * 8, x + len, gy + (rnd() - 0.5) * 4);
            g.stroke();
          }
          g.fillStyle = 'rgba(0,0,0,0.55)';
          g.fillRect(x + len - 2, r * rh, 2, rh);
          x += len;
        }
        g.fillStyle = 'rgba(0,0,0,0.6)';
        g.fillRect(0, r * rh, w, 2);
      }
    },
    { repeat: [4, 7] }
  );
}

function rugTexture() {
  const rnd = mulberry32(21);
  return canvasTexture(768, 512, (g, w, h) => {
    g.fillStyle = '#5a1712';
    g.fillRect(0, 0, w, h);
    const frame = (inset, color, lw) => {
      g.strokeStyle = color;
      g.lineWidth = lw;
      g.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    };
    frame(14, '#c9a36a', 10);
    frame(34, '#1b2238', 22);
    frame(54, '#c9a36a', 4);
    // border diamonds
    g.fillStyle = '#c9773a';
    for (let x = 50; x < w - 40; x += 34) {
      for (const y of [34, h - 34]) diamond(g, x, y, 9);
    }
    for (let y = 60; y < h - 50; y += 34) {
      for (const x of [34, w - 34]) diamond(g, x, y, 9);
    }
    // field
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 5; j++) {
        const x = 110 + i * 68, y = 110 + j * 73;
        g.fillStyle = (i + j) % 2 ? '#1b2238' : '#c9a36a';
        diamond(g, x, y, 18);
        g.fillStyle = (i + j) % 2 ? '#c9773a' : '#5a1712';
        diamond(g, x, y, 8);
      }
    }
    // central medallion
    g.fillStyle = '#1b2238'; diamond(g, w / 2, h / 2, 120, 0.62);
    g.fillStyle = '#c9a36a'; diamond(g, w / 2, h / 2, 96, 0.62);
    g.fillStyle = '#5a1712'; diamond(g, w / 2, h / 2, 74, 0.62);
    g.fillStyle = '#c9773a'; diamond(g, w / 2, h / 2, 30, 0.62);
    // wear
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,220,180,0.05)';
      g.fillRect(rnd() * w, rnd() * h, 2, 1);
    }
  });
  function diamond(g, x, y, r, sy = 1) {
    g.beginPath();
    g.moveTo(x, y - r * sy); g.lineTo(x + r, y); g.lineTo(x, y + r * sy); g.lineTo(x - r, y);
    g.closePath(); g.fill();
  }
}

function drawInkblot(g, w, h, seed) {
  const rnd = mulberry32(seed);
  g.filter = 'none';
  g.fillStyle = '#e9e1d0';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(14,12,12,0.9)';
  g.filter = 'blur(1.5px)';
  let x = w / 2 - 4, y = h * (0.3 + rnd() * 0.15);
  const blob = (bx, by, r) => {
    g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(w - bx, by, r, 0, Math.PI * 2); g.fill();
  };
  for (let i = 0; i < 70; i++) {
    const r = 5 + rnd() * 22;
    blob(x, y, r);
    x += (rnd() - 0.55) * 30;
    y += (rnd() - 0.42) * 26;
    if (x > w / 2) x = w / 2 - rnd() * 14;
    if (x < w * 0.14) x = w * 0.3;
    if (y > h * 0.84 || y < h * 0.14) y = h * (0.3 + rnd() * 0.4);
  }
  for (let i = 0; i < 40; i++) blob(w * (0.1 + rnd() * 0.4), h * (0.12 + rnd() * 0.76), rnd() * 3.5);
  g.filter = 'none';
}

function mandalaTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e4dccb';
    g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    g.strokeStyle = '#2a1c14';
    g.lineWidth = 1.5;
    for (const r of [112, 96, 60, 26]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < 16; i++) {
      g.rotate(Math.PI / 8);
      g.beginPath(); g.ellipse(0, -60, 14, 36, 0, 0, Math.PI * 2);
      g.strokeStyle = i % 2 ? '#b5461a' : '#2a1c14'; g.stroke();
      g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -112); g.stroke();
    }
    g.strokeRect(-18, -18, 36, 36);
    g.rotate(Math.PI / 4);
    g.strokeRect(-18, -18, 36, 36);
  });
}

function sheetTexture() {
  return canvasTexture(256, 160, (g, w, h) => {
    g.fillStyle = '#eee8da';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#333';
    g.fillStyle = '#222';
    const rnd = mulberry32(12);
    for (let s = 0; s < 4; s++) {
      const y0 = 18 + s * 36;
      g.lineWidth = 0.8;
      for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(12, y0 + l * 4); g.lineTo(w - 12, y0 + l * 4); g.stroke(); }
      for (let x = 26; x < w - 16; x += 9 + rnd() * 8) {
        const ny = y0 + Math.floor(rnd() * 9) * 2;
        g.beginPath(); g.ellipse(x, ny, 2.6, 1.9, -0.4, 0, Math.PI * 2); g.fill();
        g.lineWidth = 1; g.beginPath(); g.moveTo(x + 2.4, ny); g.lineTo(x + 2.4, ny - 11); g.stroke();
      }
      g.fillRect(w / 2, y0, 1, 16);
    }
    g.fillRect(w / 2 - 1, 0, 2, h);
  });
}

function glyphAtlas() {
  const cols = 8, rows = 4, cw = 48, ch = 72;
  const tex = canvasTexture(
    cols * cw,
    rows * ch,
    (g) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, cols * cw, rows * ch);
      g.fillStyle = '#fff';
      g.font = `600 ${ch * 0.74}px "MS Gothic", "Yu Gothic", "Hiragino Kaku Gothic ProN", "Noto Sans JP", monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (let i = 0; i < cols * rows; i++) {
        const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch / 2;
        g.save();
        g.beginPath(); g.rect(x - cw / 2, y - ch / 2, cw, ch); g.clip();
        g.translate(x, y);
        g.scale(-1, 1); // mirrored, like the film
        g.fillText(GLYPHS[i % GLYPHS.length], 0, 2);
        g.restore();
      }
    },
    { color: false }
  );
  tex.anisotropy = 1;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/* ------------------------------------------------------- animated screens */

class RainScreen {
  constructor(size = 256, cell = 16) {
    this.c = document.createElement('canvas');
    this.c.width = this.c.height = size;
    this.g = this.c.getContext('2d');
    this.cell = cell;
    this.cols = Math.ceil(size / cell);
    this.rows = Math.ceil(size / cell);
    this.drops = Array.from({ length: this.cols }, () => Math.random() * -this.rows);
    this.g.fillStyle = '#000';
    this.g.fillRect(0, 0, size, size);
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 40; i++) this.step();
  }
  step() {
    const { g, cell, cols, rows, drops } = this;
    g.fillStyle = 'rgba(0,0,0,0.13)';
    g.fillRect(0, 0, this.c.width, this.c.height);
    g.font = `600 ${cell - 2}px "MS Gothic", "Yu Gothic", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let i = 0; i < cols; i++) {
      const y = Math.floor(drops[i]);
      if (y >= 0) {
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        g.fillStyle = '#d8ffe4';
        g.fillText(ch, i * cell + cell / 2, y * cell);
        if (y > 0) {
          g.fillStyle = '#00e04a';
          g.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * cell + cell / 2, (y - 1) * cell);
        }
      }
      drops[i] += 0.5 + Math.random() * 0.6;
      if (drops[i] > rows + Math.random() * 14) drops[i] = -Math.random() * 6;
    }
    this.tex.needsUpdate = true;
  }
}

class TerminalScreen {
  constructor() {
    this.c = document.createElement('canvas');
    this.c.width = 320;
    this.c.height = 240;
    this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.lines = ['Wake up, visitor...', 'The portfolio has you.', 'Follow the orange dot.', 'Knock, knock.'];
    this.line = 0;
    this.chars = 0;
    this.hold = 0;
    this.blink = 0;
    this.draw();
  }
  step() {
    const text = this.lines[this.line];
    this.blink++;
    if (this.chars < text.length) this.chars++;
    else if (++this.hold > 22) {
      this.hold = 0;
      this.chars = 0;
      this.line = (this.line + 1) % this.lines.length;
    }
    this.draw();
  }
  draw() {
    const { g, c } = this;
    g.fillStyle = '#020603';
    g.fillRect(0, 0, c.width, c.height);
    g.font = '600 22px "Geist Mono", Consolas, monospace';
    g.textBaseline = 'top';
    g.fillStyle = '#39ff7a';
    const text = this.lines[this.line].slice(0, this.chars);
    // wrap at ~20 chars
    const words = text.split(' ');
    const rows = [''];
    for (const w of words) {
      if ((rows[rows.length - 1] + ' ' + w).trim().length > 20) rows.push(w);
      else rows[rows.length - 1] = (rows[rows.length - 1] + ' ' + w).trim();
    }
    rows.forEach((r, i) => g.fillText(r, 22, 34 + i * 30));
    if (this.blink % 4 < 2) {
      const last = rows[rows.length - 1];
      g.fillRect(22 + g.measureText(last).width + 3, 34 + (rows.length - 1) * 30, 12, 22);
    }
    g.fillStyle = 'rgba(57,255,122,0.5)';
    g.font = '600 12px "Geist Mono", Consolas, monospace';
    g.fillText('tty1 — reality.exe', 22, c.height - 28);
    this.tex.needsUpdate = true;
  }
}

class WaveScreen {
  constructor() {
    this.c = document.createElement('canvas');
    this.c.width = 320;
    this.c.height = 240;
    this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.t = 0;
    this.step();
  }
  step() {
    const { g, c } = this;
    this.t += 0.22;
    g.fillStyle = '#010503';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(57,255,122,0.13)';
    g.lineWidth = 1;
    for (let x = 0; x < c.width; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke(); }
    for (let y = 0; y < c.height; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
    const rows = [
      ['α', 62, 9, 0.05, 16],
      ['β', 122, 21, 0.11, 9],
      ['θ', 182, 5, 0.03, 20],
    ];
    g.font = '600 14px "Geist Mono", Consolas, monospace';
    g.fillStyle = '#39ff7a';
    g.strokeStyle = '#39ff7a';
    g.lineWidth = 2;
    for (const [label, y0, f, f2, amp] of rows) {
      g.fillText(label, 10, y0 - 14);
      g.beginPath();
      for (let x = 0; x <= c.width; x += 3) {
        const p = x * 0.02 * f * 0.3 + this.t;
        const y = y0 + Math.sin(p * 1.7) * amp * Math.sin(x * f2 + this.t * 0.4) + Math.sin(p * 4.3) * amp * 0.25;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.fillText('EEG  ch.3', 10, c.height - 14);
    this.tex.needsUpdate = true;
  }
}

/* ------------------------------------------------------------ final pass */

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uGlyphs: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uMatrix: { value: 0 },
    uCell: { value: 10 },
    uExposure: { value: 1 },
    uFade: { value: 0 },
    uGlitch: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uTear: { value: new THREE.Vector3(0, 0, 0) }, // y, height, shift
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform sampler2D uGlyphs;
    uniform vec2 uRes;
    uniform float uTime, uMatrix, uCell, uExposure, uFade;
    uniform vec4 uGlitch[3];
    uniform vec3 uTear;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    vec3 aces(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    void main() {
      vec2 cell = vec2(uCell, uCell * 1.5);
      vec2 gid = floor(gl_FragCoord.xy / cell);
      vec2 guv = fract(gl_FragCoord.xy / cell);
      vec2 cuv = (gid + 0.5) * cell / uRes;

      // where reality gives way: glitch blocks, and the takeover wipe
      float g = 0.0;
      for (int i = 0; i < 3; i++) {
        vec4 r = uGlitch[i];
        g = max(g, step(r.x, cuv.x) * step(cuv.x, r.x + r.z) * step(r.y, cuv.y) * step(cuv.y, r.y + r.w));
      }
      float colOff = hash(vec2(gid.x, 3.0)) * 0.3;
      float wipe = step(1.0 - cuv.y + colOff, uMatrix * 1.32);
      float m = max(g, wipe);

      vec2 uv = vUv;
      float inTear = step(uTear.x, uv.y) * step(uv.y, uTear.x + uTear.y);
      uv.x += inTear * uTear.z;

      vec2 d = uv - 0.5;
      float r2 = dot(d, d);
      vec3 src;
      src.r = texture2D(tDiffuse, uv + d * r2 * 0.005 + vec2(inTear * 0.004, 0.0)).r;
      src.g = texture2D(tDiffuse, uv).g;
      src.b = texture2D(tDiffuse, uv - d * r2 * 0.005).b;
      vec3 col = aces(src * uExposure);

      if (m > 0.0) {
        vec3 cc = aces(texture2D(tDiffuse, cuv).rgb * uExposure);
        float lum = dot(cc, vec3(0.299, 0.587, 0.114));
        float sp = 0.35 + hash(vec2(gid.x, 7.0)) * 0.9;
        float t = fract(gid.y / 40.0 + uTime * sp * 0.33 + hash(vec2(gid.x, 11.0)));
        float trail = pow(1.0 - t, 4.0);
        float head = step(t, 0.03);
        float rate = 1.5 + hash(gid) * 9.0;
        float idx = floor(hash(gid + floor(uTime * rate) * 0.37) * 32.0);
        vec2 auv = (vec2(mod(idx, 8.0), floor(idx / 8.0)) + guv * 0.86 + 0.07) / vec2(8.0, 4.0);
        float gl = texture2D(uGlyphs, auv).r;
        float b = pow(lum, 0.8) * 2.4 + trail * 0.22 + 0.02;
        vec3 mc = vec3(0.08, 1.0, 0.36) * b * gl;
        mc += vec3(0.7, 1.0, 0.82) * head * gl * (0.25 + lum * 2.2);
        mc += vec3(0.0, 0.07, 0.02) * lum;
        col = mix(col, mc, m);
      }

      // lens: vignette, a breath of scanline, grain
      col *= 1.0 - smoothstep(0.18, 0.95, r2 * 1.5) * 0.75;
      col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 1.6);
      col = pow(max(col * uFade, 0.0), vec3(1.0 / 2.2));
      float n = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
      col += n * 0.022;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export {
  ORANGE, GLYPHS, mulberry32, canvasTexture, std, mesh, box, rbox, cyl, clamp, ease,
  wallTexture, floorTexture, rugTexture, drawInkblot, mandalaTexture, sheetTexture, glyphAtlas,
  RainScreen, TerminalScreen, WaveScreen, FinalShader,
};
