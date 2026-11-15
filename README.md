# Givi Vakhtangishvili — portfolio

A static site: no build step, no CDN. Open it through any local server
(VS Code Live Server works; ES modules do not load from `file://`).

## Structure

- `index.html` — the page, and the panels that open inside the room
- `css/site.css` — all styles and design tokens (colours, type scale, spacing)
- `js/data.js` — **projects, archive, students, skills, bio, links, radio stations. Edit content here.**
- `js/main.js` — rendering, scroll reveals, room panels, radio, archive preview
- `js/room.js` — the 3D room: layout, lights, camera views, interaction
- `js/room-art.js` — the painted textures: Tbilisi at dusk, the portrait, the laptop screen
- `js/room-kit.js` — helpers, material textures, the small screens, the lens shader
- `js/audio.js` — WebAudio piano and guitar
- `vendor/three/` — three.js r187, vendored
- `fonts/` — Geist and Geist Mono (SIL OFL)
- `imgs/work/` — compressed thumbnails

## The room

A top-floor studio above Tbilisi, a little before eight in the evening.
Everything is built in code: no 3D models. You start at the back of the room
with all of it in view. Arrow keys walk and turn (W A S D also walk and
sidestep), dragging looks around. Click to walk up to things:

- **Portrait** — skills, bio and links open beside it. Also behind "About" in the nav.
- **Laptop** — the projects as a live grid on its screen; every card opens the project.
- **Piano** — click keys, drag for a glissando, or type `A S D F G H J K` (black keys on `W E T Y U`).
- **Guitar** — sweep across the strings, press on the frets, pick a chord, `Space` to strum.
- **Radio** — on every time the site opens (if the browser refuses sound before the visitor has touched the page, it starts with their first click, tap or key press). Play, change station, volume. Cool jazz, lounge and house only. Pausing lasts for the visit only.
- **Armchair or window** — sit down and look at the city.
- Inkblot, floor lamp, neon and the old monitors react as well. Incense burns on the desk.

`Esc` or "Back to the room" returns to the middle. Now and then something
flickers into green code. That is on purpose.

## Previous version

The old site is kept untouched as `index.old.html` with `style.css`,
`cursor.js`, `totopbtn.js`, `thanks.html` and `mail_handler.php`.
