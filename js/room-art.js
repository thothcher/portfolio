// The painted things in the room: Tbilisi at dusk outside the window, the
// portrait in the digital frame, and what the laptop is showing.

import { GLYPHS, mulberry32, canvasTexture } from './room-kit.js';

/* ------------------------------------------------------- Tbilisi at dusk */

const ridgeAt = (u) =>
  0.022 +
  0.105 * Math.exp(-Math.pow((u - 0.4) / 0.17, 2)) +
  0.04 * Math.exp(-Math.pow((u - 0.7) / 0.06, 2)) +
  0.03 * Math.exp(-Math.pow((u - 0.9) / 0.05, 2)) +
  0.028 * Math.exp(-Math.pow((u - 0.08) / 0.13, 2)) +
  Math.sin(u * 61) * 0.0025 +
  Math.sin(u * 23 + 1) * 0.004;

// Where the TV tower stands on the panorama (u, v in 0..1 from the top-left).
// The scene reads this to hang the blinking beacon in the right spot.
export const TOWER = { u: 0.418, h: 0.2 };
TOWER.vBase = 0.5 - ridgeAt(TOWER.u);
TOWER.vTop = TOWER.vBase - TOWER.h;

export function tbilisiTexture(W, H) {
  const rnd = mulberry32(1958);
  return canvasTexture(W, H, (g, w, h) => {
    const hy = h * 0.5;
    const S = w / 3072; // everything is sized for a 3072 canvas
    const dot = (x, y, r, c, a = 1) => {
      g.globalAlpha = a;
      g.fillStyle = c;
      g.beginPath();
      g.arc(x, y, r, 0, 6.2832);
      g.fill();
    };
    const glow = (x, y, r, c, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, c);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a;
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
      g.globalAlpha = 1;
    };

    // sky: the last of the light behind Mtatsminda
    const sky = g.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#04060f');
    sky.addColorStop(0.3, '#080d22');
    sky.addColorStop(0.62, '#161a40');
    sky.addColorStop(0.8, '#3a2550');
    sky.addColorStop(0.91, '#8a3f3f');
    sky.addColorStop(1, '#d9763c');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, hy + 2);
    glow(w * 0.36, hy - h * 0.05, w * 0.3, 'rgba(255,150,70,0.55)', 0.8);
    glow(w * 0.36, hy - h * 0.02, w * 0.12, 'rgba(255,205,130,0.6)', 0.7);
    for (let i = 0; i < 260; i++) dot(rnd() * w, rnd() * hy * 0.62, (0.5 + rnd() * 0.9) * S, '#dfe6ff', 0.25 + rnd() * 0.6);
    // thin cloud bars catching the glow
    for (let i = 0; i < 9; i++) {
      const cx = rnd() * w, cy = hy - h * (0.07 + rnd() * 0.17), cw = (240 + rnd() * 520) * S;
      const gr = g.createLinearGradient(cx - cw, 0, cx + cw, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.5, 'rgba(255,140,90,0.16)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(cx - cw, cy, cw * 2, (3 + rnd() * 7) * S);
    }
    g.globalAlpha = 1;

    // far range
    g.fillStyle = '#191634';
    g.beginPath();
    g.moveTo(0, hy);
    for (let x = 0; x <= w; x += 8) {
      const u = x / w;
      g.lineTo(x, hy - h * (0.03 + Math.sin(u * 9) * 0.008 + Math.sin(u * 31 + 2) * 0.004 + 0.02 * Math.exp(-Math.pow((u - 0.6) / 0.2, 2))));
    }
    g.lineTo(w, hy);
    g.fill();

    // ground
    g.fillStyle = '#05060b';
    g.fillRect(0, hy, w, h - hy);

    // Mtatsminda and the lower ridges
    const rg = g.createLinearGradient(0, hy - h * 0.13, 0, hy);
    rg.addColorStop(0, '#0d0c1c');
    rg.addColorStop(1, '#07070e');
    g.fillStyle = rg;
    g.beginPath();
    g.moveTo(0, hy + 2);
    for (let x = 0; x <= w; x += 4) g.lineTo(x, hy - h * ridgeAt(x / w));
    g.lineTo(w, hy + 2);
    g.fill();
    const ry = (u) => hy - h * ridgeAt(u);
    // houses scattered up the slopes
    for (let i = 0; i < 1500; i++) {
      const u = rnd(), top = ry(u), y = hy - (hy - top) * Math.pow(rnd(), 2.2) * 0.8;
      dot(u * w, y, (0.6 + rnd() * 0.8) * S, rnd() > 0.2 ? '#ffb463' : '#fff0d6', 0.35 + rnd() * 0.55);
    }

    // funicular: a string of lights from the top station down to the city
    const fu0 = 0.385, fu1 = 0.452;
    for (let i = 0; i <= 46; i++) {
      const t = i / 46, u = fu0 + (fu1 - fu0) * t;
      dot(u * w, ry(fu0) + (hy - ry(fu0)) * Math.pow(t, 0.85), 1.5 * S, '#ffd9a0', 0.9);
    }
    // top station
    g.globalAlpha = 1;
    g.shadowColor = '#ffb060';
    g.shadowBlur = 18 * S;
    g.fillStyle = '#ffd7a0';
    g.fillRect(fu0 * w - 34 * S, ry(fu0) - 13 * S, 62 * S, 11 * S);
    g.fillStyle = '#ffb872';
    for (let i = 0; i < 9; i++) g.fillRect(fu0 * w - 32 * S + i * 6.6 * S, ry(fu0) - 2 * S, 3 * S, 7 * S);
    // ferris wheel in the park
    const fx = 0.352 * w, fr = 30 * S, fyc = ry(0.352) - fr - 6 * S;
    g.strokeStyle = '#ff7ad0';
    g.lineWidth = 2 * S;
    g.shadowColor = '#ff5ac0';
    g.beginPath();
    g.arc(fx, fyc, fr, 0, 6.2832);
    g.stroke();
    g.lineWidth = 1 * S;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(fx, fyc);
      g.lineTo(fx + Math.cos(i * 0.785) * fr, fyc + Math.sin(i * 0.785) * fr);
      g.stroke();
    }
    for (let i = 0; i < 16; i++) dot(fx + Math.cos(i * 0.3927) * fr, fyc + Math.sin(i * 0.3927) * fr, 2 * S, i % 2 ? '#9fe0ff' : '#fff2c0');
    g.globalAlpha = 1;

    // the TV tower: a mast, a leaning leg, a lattice of light
    {
      const tx = TOWER.u * w, by = TOWER.vBase * h + 4 * S, ty = TOWER.vTop * h, th = by - ty;
      const leg = tx - th * 0.2; // foot of the slanted support
      glow(tx, ty + th * 0.45, th * 0.6, 'rgba(255,200,140,0.5)', 0.5);
      g.shadowColor = '#ffd9a8';
      g.shadowBlur = 14 * S;
      g.strokeStyle = '#ffe9c8';
      g.lineCap = 'round';
      const line = (x1, y1, x2, y2, lw) => {
        g.lineWidth = lw * S;
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.stroke();
      };
      const shaftTop = ty + th * 0.36;
      line(tx - 7 * S, by, tx - 4 * S, shaftTop, 2.4);
      line(tx + 7 * S, by, tx + 4 * S, shaftTop, 2.4);
      line(leg, by + 6 * S, tx - 3 * S, ty + th * 0.47, 2.6);
      line(leg + 14 * S, by + 6 * S, tx + 1 * S, ty + th * 0.5, 1.6);
      for (let i = 0; i < 16; i++) {
        const a = by - (by - shaftTop) * (i / 16), b = by - (by - shaftTop) * ((i + 1) / 16);
        const wa = 7 - 3 * (i / 16), wb = 7 - 3 * ((i + 1) / 16);
        line(tx - wa * S, a, tx + wb * S, b, 0.9);
        line(tx + wa * S, a, tx - wb * S, b, 0.9);
      }
      // the decks
      g.fillStyle = '#fff3da';
      g.fillRect(tx - 13 * S, ty + th * 0.44, 26 * S, 7 * S);
      g.fillRect(tx - 9 * S, ty + th * 0.36, 18 * S, 5 * S);
      // antenna, banded red and white
      for (let i = 0; i < 12; i++) {
        g.fillStyle = i % 2 ? '#ff5a4a' : '#fff0e0';
        const y0 = ty + (shaftTop - ty) * (i / 12);
        g.fillRect(tx - (1.2 + i * 0.12) * S, y0, (2.4 + i * 0.24) * S, (shaftTop - ty) / 12 + 1);
      }
      g.shadowBlur = 0;
      // the sparkle the tower is known for
      for (let i = 0; i < 150; i++) {
        const t = rnd(), y = by - (by - ty) * t, sp = (t < 0.64 ? 8 - 4 * t : 2) * S;
        dot(tx + (rnd() - 0.5) * 2 * sp, y, (0.8 + rnd() * 0.9) * S, '#ffffff', 0.5 + rnd() * 0.5);
      }
      for (let i = 0; i < 40; i++) {
        const t = rnd();
        dot(leg + (tx - leg) * t + (rnd() - 0.5) * 8 * S, by + 6 * S - (by + 6 * S - (ty + th * 0.48)) * t, 1 * S, '#fff', 0.7);
      }
    }
    g.globalAlpha = 1;
    g.shadowBlur = 0;

    // Narikala on its ridge, the statue beside it, Sameba on the far hill
    {
      g.shadowColor = '#ffb050';
      g.shadowBlur = 16 * S;
      g.strokeStyle = '#ffc77a';
      g.lineWidth = 3 * S;
      g.lineJoin = 'miter';
      g.beginPath();
      let k = 0;
      for (let u = 0.672; u <= 0.735; u += 0.0035, k++) {
        const x = u * w, y = ry(u) - 3 * S;
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
        if (k % 4 === 0) {
          g.lineTo(x, y - 11 * S);
          g.lineTo(x + 6 * S, y - 11 * S);
          g.lineTo(x + 6 * S, y);
        }
      }
      g.stroke();
      g.fillStyle = '#e8f4ff';
      g.shadowColor = '#bfe0ff';
      g.fillRect(0.655 * w, ry(0.655) - 30 * S, 3 * S, 28 * S);
      g.fillRect(0.655 * w - 5 * S, ry(0.655) - 22 * S, 13 * S, 2.5 * S);
      const sx = 0.9 * w, sy = ry(0.9);
      g.fillStyle = '#ffcf7a';
      g.shadowColor = '#ffb040';
      g.shadowBlur = 22 * S;
      g.fillRect(sx - 22 * S, sy - 20 * S, 44 * S, 20 * S);
      g.fillRect(sx - 9 * S, sy - 44 * S, 18 * S, 26 * S);
      g.beginPath();
      g.moveTo(sx - 11 * S, sy - 44 * S);
      g.lineTo(sx, sy - 66 * S);
      g.lineTo(sx + 11 * S, sy - 44 * S);
      g.fill();
      g.fillRect(sx - 0.8 * S, sy - 76 * S, 1.6 * S, 12 * S);
      g.shadowBlur = 0;
    }

    // the river: a dark ribbon winding down to the bottom edge
    const river = (t) => ({ x: w * (0.6 + 0.16 * Math.sin(t * 2.6 + 0.3) + 0.1 * t), half: (8 + 150 * t * t) * S });
    const yOf = (t) => hy + 6 * S + t * (h - hy - 6 * S);
    const inRiver = (x, t) => {
      const r = river(t);
      return Math.abs(x - r.x) < r.half;
    };

    // value noise for dark parks and bright districts
    const N = 48, grid = Array.from({ length: N * N }, () => rnd());
    const noise = (x, y) => {
      const fx = Math.min(0.999, Math.max(0, x)) * (N - 1), fy = Math.min(0.999, Math.max(0, y)) * (N - 1);
      const ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
      const a = grid[iy * N + ix], b = grid[iy * N + ix + 1], c = grid[(iy + 1) * N + ix], d = grid[(iy + 1) * N + ix + 1];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    };
    const WARM = ['#ffb463', '#ff9a3c', '#ffc37a', '#ffd9a0', '#ff8a30'];
    const pickCol = () => {
      const r = rnd();
      return r < 0.74 ? WARM[(rnd() * 5) | 0] : r < 0.9 ? '#fff3dc' : r < 0.96 ? '#9fd0ff' : r < 0.98 ? '#ff5a5a' : '#7dffb0';
    };

    // city lights, tiny and dense at the horizon, larger and looser close by
    const COUNT = Math.round(26000 * S * S + 6000);
    for (let i = 0; i < COUNT; i++) {
      const t = Math.pow(rnd(), 1.9), x = rnd() * w;
      if (inRiver(x, t)) continue;
      if (noise(x / w, t) < 0.3 + t * 0.12) continue;
      dot(x, yOf(t), (0.55 + t * 2.1 + rnd() * 0.5) * S, pickCol(), 0.35 + rnd() * 0.65);
    }
    // streets: dotted sodium lines
    for (let i = 0; i < 38; i++) {
      let x = rnd() * w, t = 0.02 + Math.pow(rnd(), 1.5) * 0.9;
      const dx = (rnd() < 0.5 ? -1 : 1) * (0.4 + rnd()), dt = (rnd() - 0.35) * 0.012, n = 30 + rnd() * 90, bright = rnd() < 0.25;
      for (let k = 0; k < n; k++) {
        x += dx * (6 + t * 22) * S;
        t += dt * (0.3 + t);
        if (t < 0.005 || t > 1 || x < 0 || x > w) break;
        if (inRiver(x, t)) continue;
        dot(x, yOf(t), (0.9 + t * 2.4) * S * (bright ? 1.3 : 1), bright ? '#ffe2b0' : '#ffa648', bright ? 1 : 0.8);
      }
    }
    g.globalAlpha = 1;

    // river water and what it reflects
    g.fillStyle = '#04060e';
    g.beginPath();
    for (let i = 0; i <= 50; i++) {
      const r = river(i / 50);
      g.lineTo(r.x - r.half, yOf(i / 50));
    }
    for (let i = 50; i >= 0; i--) {
      const r = river(i / 50);
      g.lineTo(r.x + r.half, yOf(i / 50));
    }
    g.fill();
    for (let i = 0; i < 520; i++) {
      const t = Math.pow(rnd(), 1.3), r = river(t), side = rnd() < 0.5 ? -1 : 1;
      const x = r.x + side * r.half * (1 - rnd() * 0.35), len = (4 + t * 46) * S * (0.4 + rnd());
      const gr = g.createLinearGradient(0, yOf(t), 0, yOf(t) + len);
      gr.addColorStop(0, rnd() > 0.2 ? 'rgba(255,170,90,0.6)' : 'rgba(170,215,255,0.6)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x, yOf(t), (1 + t * 3) * S, len);
      if (i % 3 === 0) dot(r.x + side * (r.half + 2 * S), yOf(t), (1 + t * 2.2) * S, '#ffd9a0', 0.9);
    }
    g.globalAlpha = 1;
    // bridges; the bright arc is the Peace Bridge
    [[0.16, 0], [0.34, 1], [0.55, 0], [0.8, 0]].forEach(([t, peace]) => {
      const r = river(t), y = yOf(t), n = 10 + t * 20;
      for (let k = 0; k <= n; k++) {
        const u = k / n, x = r.x - r.half * 1.15 + r.half * 2.3 * u;
        dot(x, y - (peace ? Math.sin(u * Math.PI) * r.half * 0.45 : 0), (1.2 + t * 2.6) * S, peace ? '#bfeaff' : '#ffc37a', 1);
      }
      if (peace) glow(r.x, y - r.half * 0.2, r.half * 1.6, 'rgba(150,220,255,0.5)', 0.7);
    });
    g.globalAlpha = 1;

    // nearer blocks, as dark slabs with lit windows
    const blocks = [];
    for (let i = 0; i < 150; i++) {
      const t = 0.3 + Math.pow(rnd(), 0.8) * 0.72, x = rnd() * w;
      if (inRiver(x, Math.min(1, t)) || inRiver(x + 60 * S, Math.min(1, t))) continue;
      blocks.push({ x, t, bw: (22 + rnd() * 60) * (0.35 + t * 1.5) * S, bh: (22 + rnd() * 110) * (0.3 + t * 1.5) * S });
    }
    blocks.sort((a, b) => a.t - b.t);
    for (const b of blocks) {
      const y = yOf(b.t), l = 6 + ((rnd() * 8) | 0);
      g.fillStyle = `rgb(${l},${l + 1},${l + 7})`;
      g.fillRect(b.x, y - b.bh, b.bw, b.bh + 40 * S);
      const cw = (3.2 + b.t * 5) * S, chh = (4.5 + b.t * 7) * S, warm = rnd() > 0.2 ? '#ffb86a' : '#dfeaff', lit = 0.12 + rnd() * 0.3;
      for (let yy = y - b.bh + chh * 0.6; yy < y - chh; yy += chh * 1.7)
        for (let xx = b.x + cw * 0.6; xx < b.x + b.bw - cw; xx += cw * 1.7)
          if (rnd() < lit) {
            g.globalAlpha = 0.45 + rnd() * 0.55;
            g.fillStyle = rnd() > 0.12 ? warm : '#8fd0ff';
            g.fillRect(xx, yy, cw, chh);
          }
      g.globalAlpha = 1;
      if (rnd() < 0.2) dot(b.x + b.bw / 2, y - b.bh - 2 * S, 1.6 * S, '#ff4a3a', 1);
    }
    g.globalAlpha = 1;

    // haze where the city meets the ridge, and darkness at the bottom edge
    const haze = g.createLinearGradient(0, hy - h * 0.03, 0, hy + h * 0.1);
    haze.addColorStop(0, 'rgba(120,60,70,0)');
    haze.addColorStop(0.35, 'rgba(150,80,70,0.2)');
    haze.addColorStop(1, 'rgba(30,25,60,0)');
    g.fillStyle = haze;
    g.fillRect(0, hy - h * 0.03, w, h * 0.13);
    const bot = g.createLinearGradient(0, h * 0.86, 0, h);
    bot.addColorStop(0, 'rgba(4,6,15,0)');
    bot.addColorStop(1, 'rgba(4,6,15,1)');
    g.fillStyle = bot;
    g.fillRect(0, h * 0.86, w, h * 0.14);
  });
}

/* -------------------------------------------- the portrait, as a graphic */

// Turns the photo into a halftone: the studio backdrop is flooded away, the
// figure is rebuilt from dots, and faint code runs behind it.
// [across, down, size] as fractions of the photo: lobe, then two up the rim
const EARRINGS = [[0.727, 0.452, 0.62], [0.742, 0.431, 0.54], [0.754, 0.409, 0.48]];

export function drawPortrait(g, w, h, img) {
  const rnd = mulberry32(77);
  g.fillStyle = '#060403';
  g.fillRect(0, 0, w, h);
  g.font = `600 ${Math.round(w / 46)}px "MS Gothic", "Yu Gothic", monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  const cell = w / 34;
  for (let cx = 0; cx < 34; cx++) {
    const len = 6 + ((rnd() * 22) | 0), start = (rnd() * 50) | 0;
    for (let k = 0; k < len; k++) {
      g.fillStyle = `rgba(255,${90 + ((rnd() * 60) | 0)},20,${0.05 + (k / len) * 0.2})`;
      g.fillText(GLYPHS[(rnd() * GLYPHS.length) | 0], cx * cell + cell / 2, ((start + k) % 50) * cell * 0.92);
    }
  }
  if (img) {
    const cols = 92, rows = Math.round(cols * (h / w));
    const c = document.createElement('canvas');
    c.width = cols;
    c.height = rows;
    const cg = c.getContext('2d', { willReadFrequently: true });
    // crop to head and shoulders
    const sw = img.naturalWidth * 0.86, sh = sw * (h / w), sx = (img.naturalWidth - sw) / 2, sy = img.naturalHeight * 0.085;
    cg.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    const d = cg.getImageData(0, 0, cols, rows).data;
    const L = new Float32Array(cols * rows), bg = new Uint8Array(cols * rows);
    const isBack = (i) => {
      const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      return mx > 120 && mx - mn < 26;
    };
    for (let i = 0; i < cols * rows; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    // flood the backdrop in from the top and the upper sides
    const stack = [];
    for (let x = 0; x < cols; x++) stack.push(x);
    for (let y = 0; y < rows * 0.55; y++) stack.push(y * cols, y * cols + cols - 1);
    while (stack.length) {
      const i = stack.pop();
      if (bg[i] || !isBack(i)) continue;
      bg[i] = 1;
      const x = i % cols, y = (i / cols) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < cols - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - cols);
      if (y < rows - 1) stack.push(i + cols);
    }
    const px = w / cols;
    // silhouette first, so the dark jacket still reads against the wall
    g.fillStyle = '#170b05';
    for (let i = 0; i < cols * rows; i++) if (!bg[i]) g.fillRect((i % cols) * px - 0.5, ((i / cols) | 0) * px - 0.5, px + 1, px + 1);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (bg[i]) continue;
        const l = Math.pow(L[i], 0.9);
        const r = px * 0.56 * Math.sqrt(Math.max(0.03, l));
        g.fillStyle = l > 0.72 ? '#ffe9cf' : l > 0.45 ? '#ffb070' : l > 0.22 ? '#ff6a1a' : '#b53a08';
        g.beginPath();
        g.arc((x + 0.5 + (y % 2 ? 0.25 : -0.25)) * px, (y + 0.5) * px, r, 0, 6.2832);
        g.fill();
      }
    }
    // three small earrings up the rim of the ear, placed on the photo itself
    for (const [u, v, k] of EARRINGS) {
      const ex = ((u * img.naturalWidth - sx) / sw) * w, ey = ((v * img.naturalHeight - sy) / sh) * h, er = px * k;
      g.fillStyle = '#170b05';
      g.beginPath();
      g.arc(ex, ey, er * 1.7, 0, 6.2832);
      g.fill();
      const halo = g.createRadialGradient(ex, ey, 0, ex, ey, er * 3.2);
      halo.addColorStop(0, 'rgba(255,240,220,0.55)');
      halo.addColorStop(1, 'rgba(255,240,220,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(ex, ey, er * 3.2, 0, 6.2832);
      g.fill();
      g.fillStyle = '#fffaf2';
      g.beginPath();
      g.arc(ex, ey, er, 0, 6.2832);
      g.fill();
    }
  }
  // frame chrome
  const m = w * 0.04;
  g.fillStyle = 'rgba(6,4,3,0.82)';
  g.fillRect(0, h - m * 3.1, w, m * 3.1);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#ffe9cf';
  g.font = `600 ${Math.round(w * 0.05)}px Geist, Arial, sans-serif`;
  g.fillText('Givi Vakhtangishvili', m, h - m * 1.55);
  g.fillStyle = '#ff6a1a';
  g.font = `600 ${Math.round(w * 0.026)}px "Geist Mono", Consolas, monospace`;
  g.fillText('SUBJECT 001  /  RENDERED, NOT PHOTOGRAPHED', m, h - m * 0.62);
  g.fillText('REC', m, m * 1.3);
  g.beginPath();
  g.arc(m * 2.75, m * 1.08, m * 0.22, 0, 6.2832);
  g.fill();
  g.strokeStyle = 'rgba(255,106,26,0.5)';
  g.lineWidth = 2;
  for (const [x, sx2] of [[m, 1], [w - m, -1]]) {
    g.beginPath();
    g.moveTo(x, m * 2.8);
    g.lineTo(x, m * 1.8);
    g.lineTo(x + sx2 * m, m * 1.8);
    g.stroke();
  }
}

/* -------------------------------------------------- the laptop's screen */

export function drawLaptop(g, w, h, projects, images) {
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  const m = w * 0.035;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = '#e6e6e6';
  g.font = `600 ${w * 0.017}px Geist, Arial, sans-serif`;
  g.fillText('givi_', m, m * 0.95);
  g.fillStyle = '#757575';
  g.textAlign = 'right';
  g.fillText(`Work (${projects.length})   Archive   Students`, w - m, m * 0.95);
  g.textAlign = 'left';
  g.fillStyle = 'rgba(230,230,230,0.25)';
  g.fillRect(m, m * 1.35, w - m * 2, 1);
  g.fillStyle = '#e6e6e6';
  g.font = `600 ${w * 0.05}px Geist, Arial, sans-serif`;
  g.fillText('Selected work', m, m * 3.3);
  const cols = 3, gap = w * 0.014, cw = (w - m * 2 - gap * (cols - 1)) / cols, ih = cw * 0.6, rh = ih + w * 0.04, top = m * 3.9;
  projects.forEach((p, i) => {
    const x = m + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * rh;
    if (y > h) return;
    g.fillStyle = '#1a1a1a';
    g.fillRect(x, y, cw, ih);
    const im = images[i];
    if (im && im.complete && im.naturalWidth) {
      const ar = im.naturalWidth / im.naturalHeight, tar = cw / ih;
      const sw = ar > tar ? im.naturalHeight * tar : im.naturalWidth, sh = ar > tar ? im.naturalHeight : im.naturalWidth / tar;
      g.drawImage(im, (im.naturalWidth - sw) / 2, 0, sw, sh, x, y, cw, ih);
    }
    g.strokeStyle = 'rgba(230,230,230,0.2)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, cw - 1, ih - 1);
    g.fillStyle = '#e6e6e6';
    g.font = `600 ${w * 0.016}px Geist, Arial, sans-serif`;
    g.fillText(p.title, x, y + ih + w * 0.022);
  });
}

export function keyboardTexture() {
  return canvasTexture(512, 352, (g, w) => {
    g.fillStyle = '#15151b';
    g.fillRect(0, 0, w, 352);
    g.fillStyle = '#08080b';
    const kw = 30, kh = 28, x0 = 24, y0 = 26;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 15; c++) {
        if (r === 4 && c > 3 && c < 10) continue;
        g.fillRect(x0 + c * (kw + 1.2), y0 + r * (kh + 3), kw - 2, kh);
      }
    g.fillRect(x0 + 4 * (kw + 1.2), y0 + 4 * (kh + 3), 6 * (kw + 1.2) - 3, kh);
    g.fillStyle = 'rgba(255,220,180,0.3)';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) g.fillRect(x0 + c * (kw + 1.2) + 5, y0 + r * (kh + 3) + 6, 6, 2);
    g.strokeStyle = 'rgba(184,122,74,0.6)';
    g.lineWidth = 2;
    g.strokeRect(w / 2 - 92, 206, 184, 124);
  });
}
