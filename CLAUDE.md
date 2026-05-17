# Indie & Hudson Game — project conventions

A side-scrolling platformer with Andrew's kids Indie (6) and Hudson (3) as
characters. Phaser 3 via CDN, no build step.

**Live:** https://goldypix.github.io/indie-hudson-game/
**Local:** double-click `start.command` (boots `python3 server.py 8123` with
no-cache headers + opens Chrome)

## Tech stack

- **Phaser 3.80.1** loaded from jsdelivr CDN
- **No bundler / no npm**. All `src/*.js` files load as classic scripts (each
  defines a global class). Order in `index.html`: entities → scenes → main.
- **Runtime cache busting** — `index.html` appends `?v={Date.now()}` to every
  script tag so edits always reload fresh.
- **Local dev server**: `server.py` is a SimpleHTTPServer subclass that adds
  `Cache-Control: no-store`. Port 8123. Run via `./start.command`.

## File layout

```
index.html              # game shell, script loader, viewport meta, touch UI
server.py               # no-cache static server for local dev
start.command           # double-clickable launcher (macOS)
src/
  main.js               # Phaser.Game config (DPR, scale, render, scene list)
  entities/
    Player.js           # Generic player class — used for both Indie + Hudson
    Rock.js             # Rolling rock enemy
  scenes/
    BootScene.js        # asset preload + all anim definitions
    Level1Scene.js      # world layout, physics, camera, level1 logic
  touch.js              # touch-button → keyboard-event bridge for mobile
assets/
  sprites/<char>-<anim>-v<n>/<file>_NN.png   # all character + enemy frames
  backgrounds/                                # hills + ground tiles
  world/                                      # bush, flower, cloud, platform
  coin-v01/, flag-v01/                        # collectibles
references/                                   # source images, not deployed
```

## Asset conventions

- **Source-of-truth resolution: optimized via `sips -Z`** at integration time
  (e.g. Indie idle frames resized to ~460 tall) — keeps texture memory sane on
  mobile GPUs.
- **Filenames keep `-v01` versioning** in the folder name; frames inside use
  zero-padded indices: `_01.png`, `_02.png`, …
- **Texture keys in code** follow pattern `<char>-<anim>-<index>`
  (e.g. `indie-idle-2`, `hudson-jump-5`).
- **Animation keys** follow `<char>-<anim>` (e.g. `indie-suck`,
  `hudson-jump-rise`).
- **Per-frame display height** is controlled per-animation via
  `Player.animDisplayHeights` map — different source-image heights would
  otherwise cause size pops between animations.

## Player class is generic

Both Indie and Hudson are instances of the same `Player` class. Differences are
passed via opts:

```js
new Player(scene, x, y, {
  spritePrefix: 'indie',
  initialFrame: 2,
  controls: { left, right, jump: [...], eat },
  animDisplayHeights: { 'indie-idle': 140, ... },
  canEat: true
});
```

`canEat: false` for Hudson — the suck/spit logic short-circuits and the
`-suck` / `-cheeks-full` anims are never played.

## Physics conventions

- **Arcade physics** with `gravity.y: 1400`, `roundPixels: true`,
  `setRoundPixels(true)` on the camera, no `pixelArt`, `mipmapFilter: 'LINEAR'`.
- **Players: origin (0.5, 0.97)** — sprite.y = visible feet line. Body is
  30% width × 82% height, offset so body bottom = sprite.y.
- **Camera DPR scaling**: game canvas is `1280 * DPR × 720 * DPR` (DPR capped
  at 2); camera zoom = `DPR * 1.25` so world units stay consistent across
  devices.
- **Camera follows a virtual zone** (`cameraTarget`) updated each frame to
  the integer-rounded midpoint between both players. Don't set `cam.scrollX/Y`
  directly — it doesn't stick reliably with Phaser bounds + zoom.
- **Player velocity is clamped at viewport edges** (margin 60) — that's how
  the co-op camera lock works. Each player gets velocity-zeroed if pushing
  past the edge; partner needs to walk in same direction to free them.

## Deploy

- `git push` to `main` → GitHub Pages rebuilds automatically (~1 min)
- No CI, no tests, no build step

## Don't

- Commit any `*.jpeg` or `*.jpg` at root (they're debug screenshots from
  Playwright; gitignored as `/*.jpg /*.jpeg`)
- Use `Phaser.anims.create()` with a key that already exists — it silently
  no-ops, leaving the older definition winning
- Set `cam.scrollY` directly — use a follow target instead
- Add `console.log` and forget about it (gets caught by the wrap secrets+debug
  sweep, but easier to just not)
