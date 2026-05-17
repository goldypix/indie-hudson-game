# Handoff — Next session pick-up

Last session ended at commit **02b7db0**, deployed and live at
**https://goldypix.github.io/indie-hudson-game/** and
**https://goldy.xyz/indie-and-hudson-game/** (Cloudflare Worker proxy).

## What shipped this session

- **Protected voice lines** — `callKoji`, `callPartner`, and `spit`
  categories now block other voice samples while playing. A jump/coin/
  hurt mid-phrase no-ops instead of talking over "koji follow me",
  "let's go hudson", or "watch out for the rock". Tracked via
  `VoiceHelper.activeProtected`, cleared on `complete`/`stop`.
  → commit 9b78d07 (PR #1)

## What shipped previous session

- **Menu scene** at startup: title image + 1P/2P → Indie/Hudson select.
  Keyboard / gamepad / touch nav. M key returns to menu from gameplay.
  → commit 08c55c3
- **Koji** — dog companion entity that follows whichever player is
  furthest right. → commit e88ee25
- **Rock-break animation** (4 frames @ 9fps) plays on stomp/projectile
  hit, then fades over 800ms after a 3s hold. → commit e88ee25
- **Cloud parallax** — bigger clouds get higher scrollFactor + depth
  so they "feel" closer and move faster. → commit 08c55c3
- **Background** — fit hills tile to visible camera height in world
  space; swapped to taller `hills-tile-blurred-v04.jpg` for more sky.
  Sky-blue game backgroundColor set to `#49b8f7` so it matches when
  jumping above the hills tile. → commit 716146a
- **Audio system** — voices (jump/hurt/coin/eat/spit/gameOver/callKoji/
  callPartner), two-track shuffled music (`Mossy Coin Trail 1/2` @ 0.375
  volume, persists across scene transitions via `MusicPlayer` singleton),
  game SFX (coin, rock-crumble, surface-aware footsteps grass/wood,
  random jump SFX 1-4 every jump, bump on side-wall hits).
  → commits 08c55c3, 6b52c45
- **Hotkeys** — P toggles fullscreen via Fullscreen API, O toggles a
  tiny FPS counter (top-right, off by default). → commit c66bc06
- **Open Graph / Twitter card** — sharing the URL in WhatsApp / iMessage
  / Twitter renders the game logo as a rich preview card.
  → commit ae24a24

## Architecture additions worth knowing

### Menu → Level1 data flow
`MenuScene.select()` calls `this.scene.start('Level1', { mode, character })`.
`Level1Scene.init(data)` reads it, then `create()` conditionally builds
`this.indie` / `this.hudson` (either may be null) and `this.players` =
filtered non-null array. All iteration is over `this.players` — no more
`this.player` global.

In 1P mode, the single character is wired with BOTH keyboard schemes
(arrows + space AND WASD) plus both gamepad slots — so whoever you pick,
all controls work.

### Audio
- `src/audio.js` defines `VOICE_FILES` (loader catalogue), `VOICE_LINES`
  (category → list of keys), `VoiceHelper` (random pick + 350ms gap per
  category + cache existence check), and `MusicPlayer` (module-level
  singleton that survives scene transitions).
- `MusicPlayer.start(this.sound)` is idempotent — called from both
  `MenuScene.create()` and `Level1Scene.create()`; no-ops if already
  playing.
- Player.update plays jump SFX (always, random 1-4), jump voice (65%
  chance), footsteps every 280ms while running+grounded (surface tracked
  via the platforms collider callback setting `player.currentSurface =
  platform.texture.key === 'ground-tile' ? 'grass' : 'wood'`), and bump
  on the rising edge of `body.blocked.left/right` while moving.

### Deploy plumbing
- Push to `main` → GitHub Pages rebuilds (~1 min)
- `goldy.xyz/indie-and-hudson-game/*` is a **Cloudflare Worker proxy**
  (`indie-and-hudson-proxy`) on account `Andrewgoldsmith@gmail.com's
  Account`, zone `aca2275cbe3e5999400e0398e6c55bb9`. Two routes bound:
  `goldy.xyz/indie-and-hudson-game` and `.../*`. Worker strips the
  prefix and proxies to `goldypix.github.io/indie-hudson-game/`.

## Open / parked

Nothing material. All session asks landed.

A separate stale worktree exists at
`.claude/worktrees/gifted-northcutt-5463c9/` from an unrelated earlier
session, pinned at commit e88ee25. Leave alone unless you know what
it's for.

## Gotchas

- **Asset paths with spaces** (e.g. `indie-cmon koji.wav`,
  `Mossy Coin Trail 1.mp3`) are loaded via `encodeURIComponent(key)` so
  Phaser fetches them as `%20`-encoded URLs. The Python dev server +
  GitHub Pages decode this fine — no need to rename the files.
- **OG image** lives at `assets/ui/og-preview.jpg` (213 KB, 1200-wide,
  flattened JPG of the title PNG). WhatsApp caches link previews
  aggressively; if a preview looks wrong, force a re-scrape via
  https://developers.facebook.com/tools/debug/.
- **Voice / music autoplay** is gated by the browser until first user
  interaction. Phaser auto-unlocks on first click/keypress/touch, but
  the very first jump on a fresh page load may swallow its SFX.
- **Preview-MCP loader** stalls in headless mode loading this game's
  ~90 assets — testing has to be done in a real browser at
  `localhost:8123`. Don't trust preview MCP screenshots for verification.
- All prior session gotchas in CLAUDE.md still apply (gitignore for
  root jpgs, don't recreate anim keys, etc.).
