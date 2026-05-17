# Indie & Hudson Game — project conventions

A side-scrolling platformer with Andrew's kids Indie (6) and Hudson (3) as
characters. Phaser 3 via CDN, no build step.

**Live:** https://goldypix.github.io/indie-hudson-game/
**Custom domain:** https://goldy.xyz/indie-and-hudson-game/ (Cloudflare
Worker `indie-and-hudson-proxy` strips the prefix and proxies to GitHub
Pages — see HANDOFF.md for zone/account IDs)
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
index.html              # game shell, script loader, viewport meta, touch UI, OG tags
server.py               # no-cache static server for local dev
start.command           # double-clickable launcher (macOS)
src/
  main.js               # Phaser.Game config (DPR, scale, render, scene list)
  gamepad.js            # GamepadManager, VirtualKey, CompositeKey (KB+pad OR)
  audio.js              # VOICE_FILES, VOICE_LINES, VoiceHelper, MusicPlayer
  touch.js              # touch-button → keyboard-event bridge for mobile
  entities/
    Player.js           # Generic player class — used for both Indie + Hudson
    Rock.js             # Rolling rock enemy
    Koji.js             # Dog companion (follows rightmost active player)
  scenes/
    BootScene.js        # asset preload + all anim definitions, starts Menu
    MenuScene.js        # title + 1P/2P → Indie/Hudson select
    Level1Scene.js      # world layout, physics, camera, level1 logic
assets/
  sprites/<char>-<anim>-v<n>/<file>_NN.png   # all character + enemy frames
  backgrounds/                                # hills + ground tiles
  world/                                      # bush, flower, cloud, platform
  coin-v01/, flag-v01/                        # collectibles
  ui/                                         # title-v1.png, og-preview.jpg
  audio/
    kids-voices/                              # per-character voice lines
    songs/                                    # background music tracks
    game-sfx/                                 # coin, rock-crumble, steps, jump, bump
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
  the integer-rounded midpoint of `this.players` (1 or 2 entries depending
  on the menu selection). Don't set `cam.scrollX/Y` directly — it doesn't
  stick reliably with Phaser bounds + zoom.
- **Player velocity is clamped at viewport edges** (margin 60) in 2P mode
  only — that's the co-op camera lock; each player gets velocity-zeroed
  if pushing past the edge, partner has to walk in the same direction to
  free them. In 1P mode the clamp is skipped.

## Players, mode, and the activeCharacters array

The game can run 1P (Indie or Hudson) or 2P. `MenuScene` chooses; data flows
into `Level1Scene.init(data)` as `{ mode: '1p'|'2p', character: 'indie'|'hudson'|null }`.

- `this.indie` / `this.hudson` are either Player instances or `null`.
- `this.players` = `[this.indie, this.hudson].filter(Boolean)` — iterate
  this for update / collider / camera logic. There is no `this.player`.
- `this.activeCharacters` = `this.players.map(p => p.prefix)` — used by
  `VoiceHelper.playForRandomActive(...)` to pick which character voices an
  ambient line.
- In 1P mode the single Player gets BOTH keyboard schemes (arrows+space AND
  WASD) plus both gamepad slots merged into its CompositeKeys.

## Audio

- `MusicPlayer` (in `src/audio.js`) is a module-level singleton — call
  `MusicPlayer.start(this.sound)` from any scene; it no-ops if already
  playing, so it survives Menu ↔ Level1 transitions seamlessly.
- `VoiceHelper` is per-scene (`this.voice = new VoiceHelper(this)`). It
  enforces a 350ms gap per category and only plays sounds present in
  `cache.audio` — missing files no-op silently.
- **Protected categories** (`callKoji`, `callPartner`, `spit`) block all
  other voice samples while one is playing — they're full phrases and
  must finish before another line can start. See `PROTECTED_VOICE_CATEGORIES`
  in `src/audio.js`.
- Hotkeys: **P** = fullscreen toggle, **O** = FPS overlay toggle,
  **R** = restart level (with current mode/character), **M** = back to menu.

## Deploy

- `git push` to `main` → GitHub Pages rebuilds automatically (~1 min)
- `goldy.xyz/indie-and-hudson-game/*` picks up the change automatically
  via the Cloudflare Worker proxy (no extra deploy step)
- No CI, no tests, no build step

## Don't

- Commit any `*.jpeg` or `*.jpg` at root (they're debug screenshots from
  Playwright; gitignored as `/*.jpg /*.jpeg`)
- Use `Phaser.anims.create()` with a key that already exists — it silently
  no-ops, leaving the older definition winning
- Set `cam.scrollY` directly — use a follow target instead
- Add `console.log` and forget about it (gets caught by the wrap secrets+debug
  sweep, but easier to just not)
