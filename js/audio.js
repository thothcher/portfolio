// Tiny WebAudio synth for the room: piano and guitar. No samples, no files.
// The context is only created on the first click, so nothing plays uninvited.

let ctx = null;
let out = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;

    // A short feedback delay stands in for the room.
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.13;
    const fb = ctx.createGain();
    fb.gain.value = 0.24;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1800;

    out = ctx.createGain();
    out.connect(master);
    out.connect(delay);
    delay.connect(damp).connect(fb).connect(delay);
    damp.connect(wet).connect(master);
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function pianoNote(midi, when, vel = 1) {
  const f = mtof(midi);
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(5200, f * 7), when);
  lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2), when + 1.6);

  const partials = [
    ['triangle', 1, 0.5],
    ['sine', 2.001, 0.16],
    ['sine', 3.004, 0.06],
  ];
  for (const [type, ratio, level] of partials) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type;
    o.frequency.value = f * ratio;
    og.gain.value = level;
    o.connect(og).connect(lp);
    o.start(when);
    o.stop(when + 3);
  }
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.32 * vel, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 2.8);
  lp.connect(g).connect(out);
}

/** One piano key. */
export function playKey(midi, vel = 1) {
  if (!audio()) return;
  pianoNote(midi, ctx.currentTime + 0.004, vel);
}

// Karplus-Strong plucked string, rendered once per pitch and cached.
const stringCache = new Map();
function stringBuffer(freq) {
  if (stringCache.has(freq)) return stringCache.get(freq);
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * 2.4);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const white = Math.random() * 2 - 1;
    prev = prev * 0.55 + white * 0.45; // soften the pick
    d[i] = prev;
  }
  for (let i = N; i < len; i++) d[i] = 0.4975 * (d[i - N] + d[i - N + 1]);
  stringCache.set(freq, buf);
  return buf;
}

/** One plucked string. */
export function pluck(midi, vel = 1) {
  if (!audio()) return;
  const src = ctx.createBufferSource();
  src.buffer = stringBuffer(mtof(midi));
  const g = ctx.createGain();
  g.gain.value = 0.34 * vel;
  src.connect(g).connect(out);
  src.start(ctx.currentTime + 0.004);
}

export function playClick() {
  if (!audio()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = 1900;
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.04);
}
