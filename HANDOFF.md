# Handoff — Next session pick-up

Last session ended at commit **6fef62a** (PR #3 merged), deployed and
live at **https://goldypix.github.io/indie-hudson-game/** and
**https://goldy.xyz/indie-and-hudson-game/** (Cloudflare Worker proxy).

## What shipped this session

- **Indie pea-shooter mechanic** — Indie can now eat a rolling rock,
  hold it, and shoot pebbles back. New `indie-shoot-pre` (wind-up,
  frames 1-4) and `indie-shoot-post` (recovery, frames 5-7) animations
  built from the new `indie-shoot-pebbles` sprite sheet. Pebbles fly
  horizontally with a slight downward bias (`vx = dir*900`, `vy = 140`,
  `gravity.y = -1100` → net gravity ~300), arc into the rolling-rock
  path, and `pebble↔rock` overlap triggers `rock.squish()` + score bump.
  → commit 4a77b9c (PR #3)

- **Input model rewrite for Indie's eat mechanic** — was press-E /
  press-E-again, now hold-E to suck and hold, release-E to shoot.
  `Player.update` tracks `wasEatHeld` and computes `eatJustReleased`
  each frame. Hudson is unaffected (his `canEat` is false).

- **`indie-idle-mouth` loop replaces the old `indie-cheeks-full` anim**
  — cheeks-full was looping suck-frames 7-10 which looked janky. Now
  uses the dedicated `indie-idle-mouth-v01` sprite sheet (was already
  tracked at `assets/indie-idle-mouth-v01/` from a prior session but
  never wired up). Plays as a smooth 6fps loop after rock is eaten.

- **Timer-driven spit sequence** — old version relied on Phaser's
  `animationcomplete-{key}` event to chain the wind-up → pebble fire →
  recovery anims. That was flaky (anim got interrupted by the state
  machine on the same frame as `spit()` returned, causing visible
  suck-frame flicker AND occasional "indie stuck in place" when the
  event didn't fire). Now uses `scene.time.delayedCall` for each phase
  with a hard failsafe that clears the `shooting` lock after ~2.3s.

## Architecture additions worth knowing

### `Player.shooting` lock + early-return

While `this.shooting === true`, `Player.update()` early-returns at the
top (zeros velocityX, keeps tracking grounded + wasEatHeld). This
prevents the state machine from clobbering the shoot animation with
`indie-idle` or `indie-suck`.

Additionally, the moment `spit()` runs (mid-frame inside `update()`),
the update function early-returns BEFORE reaching the state-machine
block — otherwise the same frame's `eatHeld=true` would have triggered
`setStateLabel('sucking')` and overridden the wind-up anim.

### Pea-shooter timing (4 pebbles/sec, 1s hold on frame 4)

In `Player.spit()`:
- `t=0`: play `indie-shoot-pre` (frames 1→4 @ 18fps ≈ 235ms)
- `t=235ms`: Phaser holds on frame 4 (repeat:0 sprites stop on the
  last frame). Pebble #1 fires.
- `t=485ms` / `735ms` / `985ms`: pebbles 2 / 3 / 4
- `t=1235ms`: play `indie-shoot-post` (frames 5→7 @ 14fps)
- `t=~1500ms`: `shooting = false`, normal state machine resumes

### `Level1Scene.spawnPebble(x, y, dir)`

Singular, not a burst. Each call creates one pebble with random
texture (`pebble-1..10`), horizontal velocity, slight initial downward
velocity, reduced gravity, and a 3.5s auto-destroy. Collides with
platforms (destroys on hit), overlaps with rocks (destroys + crumbles
the rock).

## Architecture from prior sessions (still current)

### Menu → Level1 data flow
`MenuScene.select()` calls `this.scene.start('Level1', { mode, character })`.
`Level1Scene.init(data)` reads it. In 1P mode both characters are
constructed but only one is controlled.

In 1P (desktop) the controlled character is wired with BOTH keyboard
schemes (arrows + space AND WASD) plus both gamepad slots.

### Audio
- `src/audio.js` defines `VOICE_FILES`, `VOICE_LINES`, `VoiceHelper`,
  `MusicPlayer`. `MusicPlayer.start()` is idempotent across scenes.
- `callKoji` / `callPartner` / `spit` voice categories are protected —
  they block other voice samples while playing.

### Deploy plumbing
- Push to `main` → GitHub Pages rebuilds (~1 min)
- `goldy.xyz/indie-and-hudson-game/*` is a Cloudflare Worker proxy
  (`indie-and-hudson-proxy`) on account `Andrewgoldsmith@gmail.com's
  Account`, zone `aca2275cbe3e5999400e0398e6c55bb9`.

## Open / parked

The user still has **WIP on main not from this session**:

- Modified `assets/sprites/indie-jump-v01/indie-jump-v01_07.png` (deep
  crouch frame revision)
- Deleted `assets/sprites/hudson-jump-v01/_sheet_transparent.png`

Ask before touching either.

The previously parked `assets/sprites/indie-shoot-pebbles/` and
`assets/sprites/pebbles/` folders are **no longer parked** — this
session committed them as part of the pea-shooter feature.

A separate stale worktree exists at
`.claude/worktrees/gifted-northcutt-5463c9/` from an unrelated earlier
session. Leave alone unless you know what it's for.

## Gotchas

- **Claude Preview MCP can't fully boot this game.** The iframe's
  `AudioContext` is suspended until first interaction, so Phaser's
  `decodeAudioData` calls stall on ~45 of the voice files. Boot scene
  stays at ~73% forever, never transitions to Menu. Workaround for
  inspecting registered anims/textures is to force-empty the load
  queue + manually call `Boot.create()` — enough to verify wiring but
  not enough to drive real gameplay. **Verification of game feel has
  to happen in a real browser via `./start.command`.**
- **Hold-to-suck / release-to-spit:** if user expects the old
  press-twice flow, they may release E too soon (mid-suck) and wonder
  why nothing fires. Release only triggers spit if `cheeksFull` is
  already true.
- **Asset paths with spaces** (`indie-cmon koji.wav`, `Mossy Coin
  Trail 1.mp3`) are loaded via `encodeURIComponent(key)` so Phaser
  fetches them as `%20`-encoded URLs.
- **OG image** at `assets/ui/og-preview.jpg`. WhatsApp caches link
  previews aggressively; force re-scrape via
  https://developers.facebook.com/tools/debug/.
- **Voice / music autoplay** is gated by the browser until first user
  interaction.
- **In 1P mode the partner can collect coins** (intentional) but is
  **immune to rocks** and won't trigger win on flag touch in practice.
- All prior session gotchas in CLAUDE.md still apply.
