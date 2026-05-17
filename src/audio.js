// Voice key catalogue. Keys must match what's loaded in BootScene.
// Each key resolves to: assets/audio/kids-voices/<key>.wav
const VOICE_FILES = {
  indie: [
    'indie-hup', 'indie-yip', 'indie-yipeee1', 'indie-hee', 'indie-huhh', 'indie-yup',
    'indie-hello', 'indie-hurt', 'indie-eat', 'indie-breathin', 'indie-a-coin',
    'indie-watchoutfortherock', 'indie-cmon koji', 'indie-lets-go-hudson',
    'indie-game-over', 'indie-game-over2',
    'rd17_002_indie-ooooo', 'rd17_004_indie-ouch', 'rd17_006_indie-oof',
    'rd17_014_indie-ha2', 'rd17_017_indie-he', 'rd17_019_indie-ha', 'rd17_027_indie-whoa',
    'rd17_042_indie-try-again',
    'indie-rd17_045_lets-go-hudson', 'indie-rd17_046_koji-follow-me-okay'
  ],
  hudson: [
    'hudson-jump', 'hudson-ha', 'hudson-yahoo1',
    'hudson-ouch', 'hudson-ouch2', 'hudson-ow', 'hudson-ooof',
    'hudson-plegh', 'hudson-the-rock',
    'hudson-gimme-that-coin', 'hudson-i-want-the-coin', 'hudson-oh-coin',
    'hudson-follow-us-koji', 'hudson-game over', 'hudson-try-again'
  ]
};

// Logical voice categories → list of audio keys (from VOICE_FILES above).
const VOICE_LINES = {
  indie: {
    jump:        ['indie-hup', 'indie-yip', 'indie-yipeee1', 'indie-hee', 'indie-huhh', 'indie-yup', 'rd17_014_indie-ha2', 'rd17_017_indie-he', 'rd17_019_indie-ha', 'rd17_027_indie-whoa'],
    hurt:        ['indie-hurt', 'rd17_002_indie-ooooo', 'rd17_004_indie-ouch', 'rd17_006_indie-oof'],
    coin:        ['indie-a-coin'],
    eat:         ['indie-eat', 'indie-breathin'],
    spit:        ['indie-watchoutfortherock'],
    gameOver:    ['indie-game-over', 'indie-game-over2', 'rd17_042_indie-try-again'],
    callKoji:    ['indie-cmon koji', 'indie-rd17_046_koji-follow-me-okay'],
    callPartner: ['indie-lets-go-hudson', 'indie-rd17_045_lets-go-hudson']
  },
  hudson: {
    jump:        ['hudson-jump', 'hudson-ha', 'hudson-yahoo1'],
    hurt:        ['hudson-ouch', 'hudson-ouch2', 'hudson-ow', 'hudson-ooof'],
    coin:        ['hudson-gimme-that-coin', 'hudson-i-want-the-coin', 'hudson-oh-coin'],
    eat:         [],
    spit:        ['hudson-plegh', 'hudson-the-rock'],
    gameOver:    ['hudson-game over', 'hudson-try-again'],
    callKoji:    ['hudson-follow-us-koji'],
    callPartner: []
  }
};

const MusicPlayer = {
  current: null,
  order: null,
  idx: 0,
  soundManager: null,
  start(soundManager) {
    if (this.current && this.current.isPlaying) return;
    const tracks = ['music-1', 'music-2'].filter(k => soundManager.game.cache.audio.exists(k));
    if (tracks.length === 0) return;
    this.order = Phaser.Utils.Array.Shuffle(tracks.slice());
    this.idx = 0;
    this.soundManager = soundManager;
    this._playNext();
  },
  _playNext() {
    if (this.current) {
      this.current.stop();
      this.current.destroy();
    }
    const key = this.order[this.idx];
    this.current = this.soundManager.add(key, { volume: 0.375, loop: false });
    this.current.once('complete', () => {
      this.idx = (this.idx + 1) % this.order.length;
      this._playNext();
    });
    this.current.play();
  },
  stop() {
    if (this.current) {
      this.current.stop();
      this.current.destroy();
      this.current = null;
    }
  }
};

class VoiceHelper {
  constructor(scene) {
    this.scene = scene;
    this.lastByCategory = {};
    this.minGapMs = 350;
  }

  play(character, category, opts = {}) {
    const lines = VOICE_LINES[character]?.[category];
    if (!lines || lines.length === 0) return;
    const now = this.scene.time.now;
    const key = `${character}:${category}`;
    if (now - (this.lastByCategory[key] || 0) < this.minGapMs) return;
    if (Math.random() > (opts.chance ?? 1)) return;
    const available = lines.filter(k => this.scene.cache.audio.exists(k));
    if (available.length === 0) return;
    const soundKey = Phaser.Utils.Array.GetRandom(available);
    this.scene.sound.play(soundKey, { volume: opts.volume ?? 0.8 });
    this.lastByCategory[key] = now;
  }

  playForRandomActive(activeCharacters, category, opts = {}) {
    if (!activeCharacters || activeCharacters.length === 0) return;
    const character = Phaser.Utils.Array.GetRandom(activeCharacters);
    this.play(character, category, opts);
  }
}
