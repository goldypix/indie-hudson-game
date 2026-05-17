# Handoff — Next session pick-up

Last session ended at commit **7a98ba8**, deployed and live at
**https://goldypix.github.io/indie-hudson-game/** and
**https://goldy.xyz/indie-and-hudson-game/** (Cloudflare Worker proxy).

## What shipped this session

- **Mobile single-player mode** — on touch devices (matchMedia
  `hover: none and pointer: coarse`), the menu skips the 1P/2P step and
  goes straight to INDIE/HUDSON. In 1P mode the unselected character
  spawns as a follower that walks toward the leader at 95% speed (no
  jumps, teleport-rescue if it falls >700px behind). Camera focuses on
  the leader only; the 2P edge-clamp is skipped. Wired via new
  `opts.follow = { leader, gap }` on Player.
  → commit b51366c

- **Mobile end-screen buttons** — game-over and win screens render
  REPLAY / MENU tap buttons on touch devices instead of the
  "Press R / Press M" keyboard hint. Desktop flow unchanged.
  → commit b51366c

- **Follower immunity to rocks** — `handleRockHit` early-returns when
  `player.follow` is set, so the AI partner can't be killed off-screen.
  → commit 950735f

- **Indie jump glitch fix** — user was seeing Indie flash "sideways and
  large" mid-air on mobile. Culprit was `indie-jump-v01_07.png` (the
  deep landing crouch — body bent ~90°) playing as part of jump-land.
  Dropped frame 7 from the anim. Bumped jump-rise/land display height
  to 188 (~7% taller than idle's 140, down from the previous 44% pop
  at 202). jump-rise still holds frame 4 (apex tuck) — that was the
  pose the user actually wants to see.
  → commits 950735f, 7a98ba8

- **Defensive rotation guard** — `Player.update` zeros `this.rotation`
  each frame. Cheap safety net; turned out the perceived "rotation"
  was the bent-over landing frame, not an actual transform, but the
  guard stays in as belt-and-braces.
  → commit b51366c

## Architecture additions worth knowing

### 1P-mode follower wiring (Level1Scene)

In 1P mode, **both** Indie and Hudson always spawn. `indieIsFollower`
and `hudsonIsFollower` flip based on `this.character`. The follower
gets `controls: null` and `opts.follow = { leader, gap: 90 }`. The
non-follower gets the normal CompositeKey wiring.

`this.leader` is set to the controlled character (null in 2P). Camera
target update reads `this.leader ? [this.leader] : this.players`.
Edge-clamp gated on `this.mode === '2p' && this.players.length > 1`.

### Player follow mode

`Player.update()` short-circuits to `followUpdate()` when `this.follow`
is set. followUpdate computes dx from `follow.leader.x`, walks toward
it at `speed * 0.95` until within `gap`, animates running/idle. No jump
AI — by design, the user explicitly chose "Just follows, partner can
get stuck. Simpler." If `dist > 700`, teleport to `leader.x - dir*gap`.

### End-screen helper

`Level1Scene.showEndScreen(lines, color)` centralises win/lose UI.
Uses `isTouchOnly()` (same matchMedia query as MenuScene) to pick
between keyboard hint text and tappable REPLAY / MENU buttons.

## Architecture from prior sessions (still current)

### Menu → Level1 data flow
`MenuScene.select()` calls `this.scene.start('Level1', { mode, character })`.
`Level1Scene.init(data)` reads it. In 1P mode both characters are now
constructed but only one is controlled (see above).

In 1P (desktop) the controlled character is wired with BOTH keyboard
schemes (arrows + space AND WASD) plus both gamepad slots.

### Audio
- `src/audio.js` defines `VOICE_FILES`, `VOICE_LINES`, `VoiceHelper`,
  `MusicPlayer`. `MusicPlayer.start()` is idempotent across scenes.
- `callKoji` / `callPartner` / `spit` voice categories are protected —
  they block other voice samples while playing (tracked via
  `VoiceHelper.activeProtected`).
- Player.update plays jump SFX (always, random 1-4), jump voice (65%),
  footsteps every 280ms while running+grounded (surface tracked via
  the platforms collider callback), bump on rising edge of
  `body.blocked.left/right`.

### Deploy plumbing
- Push to `main` → GitHub Pages rebuilds (~1 min)
- `goldy.xyz/indie-and-hudson-game/*` is a Cloudflare Worker proxy
  (`indie-and-hudson-proxy`) on account `Andrewgoldsmith@gmail.com's
  Account`, zone `aca2275cbe3e5999400e0398e6c55bb9`. Strips the prefix,
  proxies to `goldypix.github.io/indie-hudson-game/`.

## Open / parked

The user has **work-in-progress on main** that wasn't part of this
session — left untouched:

- Modified `assets/sprites/indie-jump-v01/indie-jump-v01_07.png`
  (the deep crouch frame). Even though the anim no longer references
  frame 7, the user appears to be revising the source PNG itself —
  may plan to bring it back into the anim once tamed.
- New `assets/sprites/indie-shoot-pebbles/` and `assets/sprites/pebbles/`
  directories — looks like a new shooting / projectile mechanic.
- Deleted `assets/sprites/hudson-jump-v01/_sheet_transparent.png`
  (cleanup).

If picking up: ask the user what state this WIP is in before touching
those paths.

A separate stale worktree exists at
`.claude/worktrees/gifted-northcutt-5463c9/` from an unrelated earlier
session. Leave alone unless you know what it's for.

## Gotchas

- **Asset paths with spaces** (e.g. `indie-cmon koji.wav`,
  `Mossy Coin Trail 1.mp3`) are loaded via `encodeURIComponent(key)` so
  Phaser fetches them as `%20`-encoded URLs.
- **OG image** at `assets/ui/og-preview.jpg`. WhatsApp caches link
  previews aggressively; force re-scrape via
  https://developers.facebook.com/tools/debug/.
- **Voice / music autoplay** is gated by the browser until first user
  interaction; the very first jump on a fresh page load may swallow
  its SFX.
- **Preview-MCP loader** stalls in headless mode loading this game's
  ~90 assets — testing has to be done in a real browser. Don't trust
  preview MCP screenshots for verification.
- **In 1P mode the partner can collect coins** (intentional — overlap
  still fires) but is **immune to rocks** and won't trigger win on flag
  touch in practice (leader gets there first, since follower trails).
- All prior session gotchas in CLAUDE.md still apply (gitignore for
  root jpgs, don't recreate anim keys, etc.).
