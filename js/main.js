import { featured, archive, students, stack, profile, stations } from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗ0123456789:=*+<>';

root.classList.add('js');

/* ----------------------------------------------------------------- render */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ARROW = '<span class="arrow" aria-hidden="true">↗</span>';

$('#featured').innerHTML = featured
  .map(
    (p, i) => `
    <a class="proj rv" href="${esc(p.url)}" target="_blank" rel="noopener">
      <figure class="proj__media">
        <img src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}" loading="lazy" decoding="async" />
      </figure>
      <div class="proj__text">
        <p>${esc(p.text)}</p>
        <ul class="proj__services">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <div class="proj__side">
        <h3 class="proj__title">${esc(p.title)}<sup>(${pad(i + 1)})</sup></h3>
        <span class="proj__go">Visit ${ARROW}</span>
      </div>
    </a>`
  )
  .join('');

$('#archive-list').innerHTML = archive
  .map(
    (p, i) => `
    <li>
      <a class="row rv" href="${esc(p.url)}" target="_blank" rel="noopener" data-peek="${esc(p.image)}">
        <span class="row__n">${pad(i + 1)}</span>
        <span class="row__t">${esc(p.title)}</span>
        <span class="row__k">${esc(p.kind)}</span>
        <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="row__y">${p.year}</span>
        <span class="row__go">${ARROW}</span>
      </a>
    </li>`
  )
  .join('');

$('#student-grid').innerHTML =
  students
    .map(
      (p) => `
    <li class="rv">
      <a class="cell" href="${esc(p.url)}" target="_blank" rel="noopener">
        <figure><img src="${esc(p.image)}" alt="${esc(p.title)} by ${esc(p.by)}" loading="lazy" decoding="async" /></figure>
        <div class="cell__meta">
          <span class="cell__t">${esc(p.title)}</span>
          <span class="cell__y">${p.year}</span>
          <span class="cell__by">${esc(p.by)}</span>
        </div>
      </a>
    </li>`
    )
    .join('') +
  `<li class="rv"><div class="cell cell--next"><canvas data-rain aria-hidden="true"></canvas><p>Next cohort: compiling<span class="caret">_</span></p></div></li>`;

const counts = { featured: featured.length, archive: archive.length, students: students.length };
$$('[data-count]').forEach((el) => (el.textContent = `(${counts[el.dataset.count]})`));
$('#year').textContent = new Date().getFullYear();

/* ----------------------------------------------------------------- reveal */

{
  // stagger siblings that enter together
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.setProperty('--d', `${Math.min(i++, 8) * 0.05}s`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  $$('.rv, .lines').forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------- scramble */

// Decode a label out of matrix glyphs. Only touches the element's own text
// nodes, so nested <sup> counters are left alone.
function scramble(el, duration = 420) {
  if (reduced || el._scrambling) return;
  const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
  if (!node) return;
  const final = node.nodeValue;
  el._scrambling = true;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const shown = Math.floor(final.length * t);
    let out = final.slice(0, shown);
    for (let i = shown; i < final.length; i++) out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    node.nodeValue = t < 1 ? out : final;
    if (t < 1) requestAnimationFrame(tick);
    else el._scrambling = false;
  };
  requestAnimationFrame(tick);
}
$$('[data-scramble]').forEach((el) => {
  // lock the width so neighbours do not shuffle while the glyphs cycle
  el.addEventListener('pointerenter', () => {
    if (el.tagName !== 'LI') {
      el.style.display = 'inline-block';
      el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    }
    scramble(el);
  });
});

/* ------------------------------------------------------------- 2D rain fx */

class Rain {
  constructor(canvas, { cell = 16, fps = 14 } = {}) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.cell = cell;
    this.interval = 1000 / fps;
    this.last = 0;
    this.on = false;
    this.drops = [];
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return;
    this.c.width = w * dpr;
    this.c.height = h * dpr;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
    const cols = Math.ceil(w / this.cell);
    this.drops = Array.from({ length: cols }, () => -Math.random() * (h / this.cell));
    this.g.fillStyle = '#000';
    this.g.fillRect(0, 0, w, h);
  }
  step(now) {
    if (now - this.last < this.interval) return;
    this.last = now;
    const { g, cell, w, h } = this;
    if (!w) return;
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, 0, w, h);
    g.font = `600 ${cell - 3}px "MS Gothic", "Yu Gothic", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let i = 0; i < this.drops.length; i++) {
      const y = Math.floor(this.drops[i]);
      if (y >= 0) {
        g.fillStyle = '#c8ffd8';
        g.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * cell + cell / 2, y * cell);
        g.fillStyle = '#00d646';
        g.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * cell + cell / 2, (y - 1) * cell);
      }
      this.drops[i] += 0.5 + Math.random() * 0.5;
      if (this.drops[i] * cell > h + Math.random() * 400) this.drops[i] = -Math.random() * 8;
    }
  }
}

const rains = $$('[data-rain]').map((c) => {
  const r = new Rain(c, { cell: c.id === 'veil' ? 18 : 15 });
  if (c.id === 'veil') r.isVeil = true;
  else new IntersectionObserver(([e]) => (r.on = e.isIntersecting)).observe(c);
  return r;
});
if (!reduced) {
  const loop = (now) => {
    for (const r of rains) if (r.on) r.step(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else {
  // one still frame is enough
  rains.forEach((r) => { for (let i = 0; i < 60; i++) { r.last = -1e9; r.step(i * 1e6); } });
}

/* ------------------------------------------------------------------- mode */

// There is no switch for this any more. One of the old monitors in the room
// pulls the whole site into the matrix for a few seconds, then lets it go.
let room = null;
let modeTimer = 0;
function setMode(mode) {
  const matrix = mode === 'matrix';
  if ((root.dataset.mode === 'matrix') === matrix) return;
  root.dataset.mode = matrix ? 'matrix' : 'real';
  rains.forEach((r) => r.isVeil && (r.on = matrix));
  room?.setMatrix(matrix);
  $$('[data-scramble], .proj__title, .row__t').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) setTimeout(() => scramble(el, 600), (i % 12) * 30);
  });
}
function wakeUp() {
  clearTimeout(modeTimer);
  if (root.dataset.mode === 'matrix') return setMode('real');
  setMode('matrix');
  modeTimer = setTimeout(() => setMode('real'), 9000);
}

/* ----------------------------------------------------------- room panels */

const hero = $('#hero');
const tip = $('#tip');
const hint = $('#hint');
const HINTS = {
  home: 'Arrow keys to walk, drag to look around. Click anything that catches your eye.',
  me: 'The portrait is drawn from dots, not pixels.',
  laptop: 'Scroll the screen. Every card opens the live project.',
  piano: 'Click the keys, drag for a glissando, or type A S D F G H J K.',
  guitar: 'Sweep across the strings, press on the frets, or hit Space to strum.',
  chair: 'Tbilisi, a little before eight. Drag or use the arrows to look around.',
  radio: 'Lounge, house and cool jazz. Nothing else.',
};

// who lives here
$('#me-skills').innerHTML = stack.map((s) => `<li>${esc(s)}</li>`).join('');
$('#me-name').textContent = profile.name;
$('#me-role').textContent = profile.role;
$('#me-bio').innerHTML = profile.bio.map((p) => `<p>${esc(p)}</p>`).join('');
$('#me-links').innerHTML = profile.links
  .map(([label, url]) => `<a href="${esc(url)}"${url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(label)} ${ARROW}</a>`)
  .join('');

// the laptop: the same three lists as the page below, as one grid
const SHELVES = {
  Selected: featured.map((p) => ({ ...p, meta: p.tags.join(' / ') })),
  Archive: archive.map((p) => ({ ...p, meta: `${p.kind} / ${p.year}` })),
  Students: students.map((p) => ({ ...p, meta: `${p.by} / ${p.year}` })),
};
const screenEl = $('#screen');
const screenIn = $('#screen-in');
const tabs = $('#screen-tabs');
function showShelf(name) {
  $('#screen-title').innerHTML = `${esc(name === 'Selected' ? 'Selected work' : name === 'Students' ? 'Students’ work' : name)}<sup>(${SHELVES[name].length})</sup>`;
  $('#screen-grid').innerHTML = SHELVES[name]
    .map(
      (p) => `
      <li><a href="${esc(p.url)}" target="_blank" rel="noopener">
        <figure><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" /></figure>
        <span class="screen__t">${esc(p.title)} ${ARROW}</span>
        <span class="screen__m">${esc(p.meta)}</span>
      </a></li>`
    )
    .join('');
  $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.shelf === name)));
  $('.screen__scroll', screenEl).scrollTop = 0;
}
tabs.innerHTML = Object.keys(SHELVES)
  .map((n) => `<button type="button" role="tab" data-shelf="${n}">${n}<sup>(${SHELVES[n].length})</sup></button>`)
  .join('');
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-shelf]');
  if (b) showShelf(b.dataset.shelf);
});
showShelf('Selected');

// The grid is laid out at a fixed size and scaled to wherever the 3D screen
// lands, so it reads like a display and not like a popup.
const sheetMode = () => innerWidth < 760;
let lastRect = '';
function placeScreen(r, settled) {
  const key = sheetMode() ? 'sheet' : [r.x, r.y, r.w, r.h].map((v) => Math.round(v * 2)).join();
  screenEl.classList.toggle('is-on', settled);
  if (key === lastRect) return;
  lastRect = key;
  if (sheetMode()) {
    screenEl.style.cssText = '';
    screenIn.style.cssText = '';
  } else {
    const VW = 1180, k = r.w / VW;
    screenEl.style.left = `${r.x}px`;
    screenEl.style.top = `${r.y}px`;
    screenEl.style.width = `${r.w}px`;
    screenEl.style.height = `${r.h}px`;
    screenIn.style.width = `${VW}px`;
    screenIn.style.height = `${r.h / k}px`;
    screenIn.style.transform = `scale(${k})`;
  }
}

// guitar chords
const chordsEl = $('#panel-guitar');
const CHORDS = ['Open', 'Em', 'Am', 'C', 'G', 'D', 'Dm', 'F'];
chordsEl.innerHTML = CHORDS.map((c, i) => `<button type="button" data-chord="${c}" aria-pressed="${i === 0}">${c}</button>`).join('');
chordsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-chord]');
  if (!b) return;
  $$('button', chordsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  room?.setChord(b.dataset.chord);
  room?.strum();
});

/* ------------------------------------------------------------------ radio */

const radio = {
  el: null, // created on the first press of Play, never before
  i: 0,
  vol: 0.6,
  on: false,
  note: '',
};
try {
  radio.i = clampInt(Number(localStorage.getItem('radio.i')) || 0, 0, stations.length - 1);
  const v = Number(localStorage.getItem('radio.vol'));
  if (v > 0 && v <= 1) radio.vol = v;
} catch (e) { /* private mode */ }
function clampInt(v, a, b) { return Math.min(b, Math.max(a, Math.round(v))); }

function radioPaint() {
  const st = stations[radio.i];
  $('#radio-name').textContent = st.name;
  $('#radio-genre').textContent = radio.note || `${st.genre} / ${radio.on ? 'on air' : 'off'}`;
  $('#radio-play').textContent = radio.on ? 'Pause' : 'Play';
  $('#radio-play').setAttribute('aria-pressed', String(radio.on));
  const bars = Math.round(radio.vol * 10);
  $('#radio-vol').innerHTML = Array.from({ length: 10 }, (_, i) => `<i${i < bars ? ' class="on"' : ''}></i>`).join('');
  $('#radio-chip').textContent = radio.on ? '(on)' : '(off)';
  $('#radio-chip').parentElement.classList.toggle('is-on', radio.on);
  room?.setRadio({ on: radio.on, name: st.name, genre: st.genre });
  try {
    localStorage.setItem('radio.i', String(radio.i));
    localStorage.setItem('radio.vol', String(radio.vol));
  } catch (e) { /* private mode */ }
}
function radioPlay(quiet = false) {
  if (!radio.el) {
    radio.el = new Audio();
    radio.el.preload = 'none';
    radio.el.addEventListener('error', () => {
      if (!radio.on) return;
      radio.on = false;
      radio.note = 'No signal. Try another station.';
      radioPaint();
    });
    const onAir = () => { if (radio.on && radio.note) { radio.note = ''; radioPaint(); } };
    radio.el.addEventListener('playing', onAir);
    radio.el.addEventListener('timeupdate', onAir); // sound is moving, whatever the buffer said
    radio.el.addEventListener('waiting', () => { if (radio.on) { radio.note = 'Tuning in…'; radioPaint(); } });
  }
  radio.el.src = stations[radio.i].url;
  radio.el.volume = radio.vol;
  radio.on = true;
  radio.note = 'Tuning in…';
  radio.el.play().catch((err) => {
    radio.on = false;
    // refused before any click: not a fault, it will start on the first touch
    radio.note = quiet && err && err.name === 'NotAllowedError' ? 'Starts with your first click' : 'No signal. Try another station.';
    radioPaint();
  });
  radioPaint();
}
function radioStop() {
  radio.on = false;
  radio.note = '';
  if (radio.el) {
    radio.el.pause();
    radio.el.removeAttribute('src'); // drop the stream instead of buffering it
    radio.el.load();
  }
  radioPaint();
}
function radioTune(step) {
  radio.i = (radio.i + step + stations.length) % stations.length;
  radio.note = '';
  if (radio.on) radioPlay();
  else radioPaint();
}
function radioVolume(step) {
  radio.vol = Math.min(1, Math.max(0.1, Math.round((radio.vol + step) * 10) / 10));
  if (radio.el) radio.el.volume = radio.vol;
  radioPaint();
}
$('#radio-play').addEventListener('click', () => {
  radioWanted = !radio.on;
  rememberRadio(radioWanted);
  if (radio.on) radioStop();
  else radioPlay();
});
$('#radio-prev').addEventListener('click', () => radioTune(-1));
$('#radio-next').addEventListener('click', () => radioTune(1));
$('#radio-down').addEventListener('click', () => radioVolume(-0.1));
$('#radio-up').addEventListener('click', () => radioVolume(0.1));
radioPaint();

// The radio is on every time the site opens. Browsers refuse sound before the
// visitor has touched the page, so the first attempt may be turned down; it is
// then repeated on every touch, click or key press until the stream is playing.
// Pausing only lasts for the visit.
let radioWanted = true;
const rememberRadio = () => { try { localStorage.removeItem('radio.off'); } catch (e) { /* private mode */ } };
rememberRadio();
{
  const EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'];
  const done = () => EVENTS.forEach((n) => removeEventListener(n, kick, true));
  function kick(e) {
    if (!radioWanted) return done();
    if (radio.on) { if (radio.el && !radio.el.paused) done(); return; }
    if (e && e.target instanceof Element && e.target.closest('#radio-play')) return; // that button does it itself
    radioPlay(true);
  }
  EVENTS.forEach((n) => addEventListener(n, kick, true));
  radioPlay(true);
}

/* ------------------------------------------------------------------- room */

function showTip(label, x, y) {
  if (!label) return tip.classList.remove('is-on');
  tip.textContent = label;
  tip.style.transform = `translate(${x + 14}px, ${y + 18}px)`;
  tip.classList.add('is-on');
}
function setView(name) {
  hero.dataset.view = name;
  hint.textContent = HINTS[name] || HINTS.home;
  if (name !== 'laptop') screenEl.classList.remove('is-on');
}
setView('home');

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

async function boot() {
  if (!webglOK()) throw new Error('no webgl');
  const { createRoom } = await import('./room.js');
  room = createRoom($('#room'), {
    projects: featured,
    portrait: 'imgs/work/me.webp',
    onReady: () => hero.classList.add('is-ready'),
    onHover: showTip,
    onView: setView,
    onScreenRect: placeScreen,
    onMatrixRequest: wakeUp,
  });
  room.setMatrix(root.dataset.mode === 'matrix');
  radioPaint();
  window.__room = room;
  window.__radio = radio;

  new IntersectionObserver(([e]) => room.setVisible(e.isIntersecting)).observe(hero);
  const onScroll = () => {
    const s = scrollY / Math.max(1, hero.offsetHeight);
    room.setScroll(s);
    if (s > 0.55 && room.view !== 'home') room.back(); // walked away from it
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#back').addEventListener('click', () => room.back());
  // links that walk you to something in the room
  $$('[data-go]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      room.go(a.dataset.go);
    })
  );
}
boot().catch((err) => {
  console.warn('[room] falling back to a flat hero:', err);
  hero.classList.add('is-flat', 'is-ready');
  $('#boot').textContent = '';
  hint.textContent = 'Your browser kept the 3D room switched off. The rest of the site is all here.';
  // without the room, the About and Radio links simply open their panels
  $$('[data-go]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo({ top: 0 });
      setView(hero.dataset.view === a.dataset.go ? 'home' : a.dataset.go);
    })
  );
  $('#back').addEventListener('click', () => setView('home'));
});

/* ------------------------------------------------------------ archive peek */

{
  const peek = $('#peek');
  const pimg = $('img', peek);
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const follow = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    peek.style.transform = `translate(${x}px, ${y}px)`;
    raf = peek.classList.contains('is-on') || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  const list = $('#archive-list');
  list.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const row = e.target.closest('[data-peek]');
    if (!row) return peek.classList.remove('is-on');
    if (pimg.dataset.src !== row.dataset.peek) {
      pimg.dataset.src = row.dataset.peek;
      pimg.src = row.dataset.peek;
    }
    const w = peek.offsetWidth, h = peek.offsetHeight;
    tx = Math.min(innerWidth - w - 16, e.clientX + 24);
    ty = Math.min(innerHeight - h - 16, Math.max(52, e.clientY - h / 2));
    if (!peek.classList.contains('is-on')) { x = tx; y = ty; }
    peek.classList.add('is-on');
    if (!raf) raf = requestAnimationFrame(follow);
  });
  list.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
}

/* ------------------------------------------------------------------ clock */

{
  const el = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' });
  const tick = () => (el.textContent = `Tbilisi, GE ${fmt.format(new Date())}`);
  tick();
  setInterval(tick, 20000);
}

/* -------------------------------------------------------------- the rabbit */

console.log('%cWake up, developer…', 'color:#00ff41;font:600 14px monospace');
console.log('%cThe room is built from primitives and canvas textures. No models. Have a look around: js/room.js', 'color:#757575');
