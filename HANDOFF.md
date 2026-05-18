# Handoff — Next session pick-up

Last session ended at commit **4713e8c**, deployed and live at
**https://goldypix.github.io/indie-hudson-game/** and
**https://goldy.xyz/indie-and-hudson-game/** (Cloudflare Worker proxy).

## What shipped this session

- **Hudson coin voice — 2× louder, 25% more frequent** —
  `Level1Scene.collectCoin` now branches on `player.prefix`. Hudson
  plays at `volume: 1.6` with `chance: 0.4375`; Indie's coin line is
  unchanged (chance 0.35, default volume 0.8). One-line code change.
  → commit 4713e8c

  Tested in browser by user; perceived loudness + frequency confirmed.
  Caveat: Phaser doesn't hard-clamp volume at 1.0, so `1.6` will
  amplify ~2× as intended but could clip if the source WAVs are
  loud-mastered. If clipping shows up, bump the WAV gain in an editor
  and dial this back down to ≤ 1.0.

## Architecture from prior sessions (still current)

### Menu → Level1 data flow
`MenuScene.select()` calls `this.scene.start('Level1', { mode, character })`.
`Level1Scene.init(data)` reads it. In 1P mode both characters are
constructed but only one is controlled. In 1P (desktop) the controlled
character is wired with BOTH keyboard schemes (arrows + space AND WASD)
plus both gamepad slots.

### Audio
- `src/audio.js` defines `VOICE_FILES`, `VOICE_LINES`, `VoiceHelper`,
  `MusicPlayer`. `MusicPlayer.start()` is idempotent across scenes.
- `callKoji` / `callPartner` / `spit` voice categories are protected —
  they block other voice samples while playing.
- `VoiceHelper.play(character, category, opts)` accepts `opts.chance`
  (default 1) and `opts.volume` (default 0.8). Per-character behavior
  at the call site (see Hudson coin tweak above for the pattern).

### Pea-shooter (Indie hold-E to suck, release to shoot pebbles)
Detail in commit 4a77b9c. `Player.spit()` uses `delayedCall`-driven
phases (wind-up @ 235ms → 4 pebbles @ 250ms apart → recovery anim →
unlock at ~1.5s). `Player.shooting` lock + `update()` early-return
keeps the state machine from clobbering shoot anims mid-sequence.

### Deploy plumbing
- Push to `main` → GitHub Pages rebuilds (~1 min)
- `goldy.xyz/indie-and-hudson-game/*` is a Cloudflare Worker proxy
  (`indie-and-hudson-proxy`) on account `Andrewgoldsmith@gmail.com's
  Account`, zone `aca2275cbe3e5999400e0398e6c55bb9`.

## Open / parked

The user has **WIP on main not from this or last session**, left
deliberately uncommitted across multiple wraps:

- Modified `assets/sprites/indie-jump-v01/indie-jump-v01_07.png` (deep
  crouch frame revision — 25-byte binary delta)
- Deleted `assets/sprites/hudson-jump-v01/_sheet_transparent.png`
  (cleanup of a debug artifact that got accidentally committed in
  commit 2d5a5bb)

Ask before touching either.

A stale worktree exists at `.claude/worktrees/gifted-northcutt-5463c9/`
from an unrelated earlier session. Leave alone unless you know what
it's for.

## Gotchas

- **Claude Preview MCP can't fully boot this game.** The iframe's
  `AudioContext` is suspended until first interaction, so Phaser's
  `decodeAudioData` calls stall on ~45 of the voice files. Boot scene
  stays at ~73% forever, never transitions to Menu. **Verification of
  game feel has to happen in a real browser via `./start.command`.**
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
- **Phaser `volume` is not clamped at 1.0** — values >1 amplify but
  can clip on output if source audio is already loud-mastered. Watch
  for distortion when bumping voice line volumes.
- All prior session gotchas in CLAUDE.md still apply.
