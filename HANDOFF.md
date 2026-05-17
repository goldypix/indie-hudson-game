# Handoff — Next session pick-up

Last session ended at commit **278b200**, deployed and live at
**https://goldypix.github.io/indie-hudson-game/**

## Open / parked work

### ⚠️ Unfinished gamepad support (parked in a worktree)
There is a parallel git worktree at `.claude/worktrees/affectionate-dewdney-929031/`
on branch `claude/affectionate-dewdney-929031` (at commit 1f733cf, behind main)
containing **uncommitted work for Standard Gamepad API support**:

- New file: `src/gamepad.js` (156 lines) — `GamepadManager`, `CompositeKey` wrappers,
  Standard Mapping for D-pad + face buttons, debug overlay on F1
- Modified `src/scenes/Level1Scene.js` — wires two gamepad slots (one per player)
  alongside keyboard input, with composite keys so keyboard + pad both work
- Modified `index.html` — adds `<script src="src/gamepad.js">`

**Decision needed:** salvage this into a feature branch off current main, or scrap it.
If salvaging: the integration was designed before the Player class refactor that
landed in main (commit 56572d4) which already takes a `controls` opts object —
the merge will need to translate `CompositeKey` wrappers into the new opts pattern.

### 🐛 Background image still cropped (user's last message before wrap)
User reported the new `assets/backgrounds/hills-tile-blurred-v03.jpg` background is
"missing heaps" — can't see the blue sky at the top. Current implementation in
`Level1Scene.js`:

```js
const hillsTexH = 967;
const bgScale = this.scale.height / hillsTexH;
this.bgHills = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'hills')
  .setOrigin(0, 0).setScrollFactor(0).setDepth(-100);
this.bgHills.tileScaleX = bgScale;
this.bgHills.tileScaleY = bgScale;
```

This *should* render the texture at exactly canvas height (1440 px), but the user
sees lots of the image missing. Possible angles to try:
- Camera zoom 2.5 may be applied to `scrollFactor 0` objects in a way I didn't
  account for — verify by eval'ing the actual rendered pixel bounds
- Try a regular Image + manual tile placement (two side-by-side copies, scrolled
  via `setScrollFactor(0.3, 0)` for parallax)
- Try Scale.ENVELOP mode so the canvas itself fills the viewport — would remove
  the FIT letterbox bars that may be causing the perception of "missing"

## What shipped this session (highlights)

- **Two-player co-op:** Indie (arrows + E) and Hudson (WASD); refactored `Player`
  class to accept `opts` (spritePrefix, controls, animDisplayHeights, canEat)
  → commit 56572d4
- **Suck-rock mechanic:** hold E pulls nearest rock with accelerating velocity,
  shrinks 50% on snap-in, plays `indie-suck` then `indie-cheeks-full` chew loop;
  tap E with full cheeks → spits projectile → commits 8ac869b, 6bcbc50
- **Camera midpoint follow:** virtual zone target between both players +
  hard velocity clamp at viewport edges — players stuck at edges until partner
  catches up → commit 1f4d8c8
- **Random rock spawning** from world end every 2–10s, max 3 active; rocks
  destroy at world walls → commits 2d5a5bb, 4be92cb
- **Performance fixes:** assets resized via `sips -Z`, DPR cap at 2, `roundPixels`
  + `setRoundPixels(true)` on camera, integer-rounded cameraTarget to kill
  sub-pixel shimmer → commit 278b200
- **Hudson auto-follow companion replaced with player-controlled Hudson** sharing
  rock damage with Indie (shared lives pool, 5 lives) → commit 56572d4
- **New assets integrated:** `hills-tile-blurred-v03.jpg` BG, `indie-suck-in-rock-v01`
  frames (1–4 suck, 7–10 chew), Hudson idle+run+jump sprites, `coin-v01`, `flag-v01`

## Gotchas

- **Gitignore for JPGs:** root-level `.jpeg`/`.jpg` is ignored (test screenshots)
  but `assets/**/*.jpg` is NOT — that bit me once when `hills-tile-blurred-v03.jpg`
  failed to deploy because of an over-broad ignore. Current pattern is `/*.jpeg`,
  `/*.jpg` (leading slash = root only).
- **Phaser `cam.scrollY` reads as `-288`** when world height < camera viewport height
  in canvas-pixels-divided-by-zoom terms, but `cam.worldView.y` is the truth.
  Use `worldView` for "what camera actually shows," not `scrollX/Y`.
- **`startFollow(zone, true, 1, 1)`** on a virtual midpoint zone is the working
  pattern for two-player camera. Setting `cam.scrollX/Y` directly does not stick.
- **Indie's body top is at sprite.y − 115** (origin 0.97, body 82% of texture).
  Platforms with body bottom > 541 will block her head when running. All current
  platform y values are ≤ 500.
- **Phaser `anims.create()` silently no-ops if the key already exists** — duplicate
  `create()` calls leave the FIRST definition winning. Bit me with `indie-suck`.
- **Local preview**: `./start.command` boots `python3 server.py 8123` (no-cache
  headers + Chrome auto-open). Cache busting is also done via runtime `?v={ts}`
  query strings on every `<script>` tag in `index.html`.

## Next-session first move

1. **Wrap up the BG bug** — user's last unresolved complaint
2. **Decide on the gamepad worktree** — merge into main or scrap
3. The Hudson chat-bubble dialogue / story bits are still untouched if you want
   to take the project further (the original spec mentioned this as a phase-2 goal)
