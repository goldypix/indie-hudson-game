class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.idleFrames = [2, 3, 4, 5, 6, 7, 8];
    for (const i of this.idleFrames) {
      const n = String(i).padStart(2, '0');
      this.load.image(`indie-idle-${i}`, `assets/sprites/indie-idle-v01/indie-idle-v01_${n}.png`);
    }
    for (let i = 1; i <= 8; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`indie-run-${i}`, `assets/sprites/indie-run-v2/indie-run-v2_${n}.png`);
    }
    for (let i = 1; i <= 9; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`indie-jump-${i}`, `assets/sprites/indie-jump-v01/indie-jump-v01_${n}.png`);
    }
    for (let i = 1; i <= 10; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`indie-suck-${i}`, `assets/sprites/indie-suck-in-rock-v01/indie-suck-in-rock-v01_${n}.png`);
    }
    for (let i = 1; i <= 7; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`rock-run-${i}`, `assets/sprites/rock-run-v1/rock-run_${n}.png`);
    }
    for (let i = 1; i <= 4; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`rock-break-${i}`, `assets/sprites/rock-break-v01/rock-break-v01_${n}.png`);
    }
    for (let i = 1; i <= 4; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`koji-idle-${i}`, `assets/sprites/koji-idle-v01/koji-idle-v01_${n}.png`);
      this.load.image(`koji-walk-${i}`, `assets/sprites/koji-walk-v01/koji-walk-v01_${n}.png`);
    }
    for (let i = 1; i <= 8; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`hudson-idle-${i}`, `assets/sprites/hudson-idle-v01/hudson-idle-v01_${n}.png`);
      this.load.image(`hudson-run-${i}`,  `assets/sprites/hudson-run-v01/hudson-run-v01_${n}.png`);
    }
    for (let i = 1; i <= 9; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`hudson-jump-${i}`, `assets/sprites/hudson-jump-v01/hudson-jump-v01_${n}.png`);
    }

    this.load.image('cloud', 'assets/world/cloud_01_v01.png');
    this.load.image('tree', 'assets/world/tree_01_v01.png');
    this.load.image('bush', 'assets/world/bush_01_v01.png');
    this.load.image('flower', 'assets/world/flower_01_v01.png');
    this.load.image('platform-strip', 'assets/world/platform_v01.png');
    this.load.image('hills', 'assets/backgrounds/hills-tile-blurred-v04.jpg');
    this.load.image('ground-tile', 'assets/backgrounds/ground-tile-v01.png');
    this.load.image('title', 'assets/ui/title-v1.png');

    for (const character of Object.keys(VOICE_FILES)) {
      for (const key of VOICE_FILES[character]) {
        const file = encodeURIComponent(key) + '.wav';
        this.load.audio(key, `assets/audio/kids-voices/${file}`);
      }
    }

    this.load.audio('music-1', 'assets/audio/songs/' + encodeURIComponent('Mossy Coin Trail 1') + '.mp3');
    this.load.audio('music-2', 'assets/audio/songs/' + encodeURIComponent('Mossy Coin Trail 2') + '.mp3');

    this.load.audio('sfx-coin',        'assets/audio/game-sfx/coin.mp3');
    this.load.audio('sfx-rock-crumble','assets/audio/game-sfx/rock-crumble.wav');
    this.load.audio('sfx-step-grass',  'assets/audio/game-sfx/generic-step-grass1.m4a');
    this.load.audio('sfx-indie-step-wood',  'assets/audio/game-sfx/indie-step-wood.mp3');
    this.load.audio('sfx-hudson-step-wood', 'assets/audio/game-sfx/hudson-step-wood.m4a');
    this.load.audio('sfx-jump-1', 'assets/audio/game-sfx/jump1.mp3');
    this.load.audio('sfx-jump-2', 'assets/audio/game-sfx/jump2.mp3');
    this.load.audio('sfx-jump-3', 'assets/audio/game-sfx/jump3.mp3');
    this.load.audio('sfx-jump-4', 'assets/audio/game-sfx/jump4.mp3');
    this.load.audio('sfx-bump',   'assets/audio/game-sfx/bump2.m4a');

    for (let i = 1; i <= 6; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`coin-${i}`, `assets/coin-v01/coin-v01_${n}.png`);
    }
    for (let i = 1; i <= 4; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`flag-${i}`, `assets/flag-v01/flag-v01_${n}.png`);
    }

  }

  create() {
    const smooth = [
      ...this.idleFrames.map(i => `indie-idle-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `indie-run-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `indie-jump-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `indie-suck-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7].map(i => `rock-run-${i}`),
      ...[1, 2, 3, 4].map(i => `rock-break-${i}`),
      ...[1, 2, 3, 4].map(i => `koji-idle-${i}`),
      ...[1, 2, 3, 4].map(i => `koji-walk-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `hudson-idle-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `hudson-run-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `hudson-jump-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `indie-suck-${i}`),
      ...[1, 2, 3, 4, 5, 6].map(i => `coin-${i}`),
      ...[1, 2, 3, 4].map(i => `flag-${i}`),
      'cloud', 'tree', 'bush', 'flower', 'platform-strip', 'hills', 'ground-tile', 'title'
    ];
    smooth.forEach(key => {
      const tex = this.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    });


    this.anims.create({
      key: 'indie-idle',
      frames: this.idleFrames.map(i => ({ key: `indie-idle-${i}` })),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'indie-run',
      frames: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ key: `indie-run-${i}` })),
      frameRate: 14,
      repeat: -1
    });
    this.anims.create({
      key: 'indie-jump-rise',
      frames: [1, 2, 3, 4].map(i => ({ key: `indie-jump-${i}` })),
      frameRate: 18,
      repeat: 0
    });
    this.anims.create({
      key: 'indie-jump-land',
      frames: [8, 9].map(i => ({ key: `indie-jump-${i}` })),
      frameRate: 14,
      repeat: 0
    });
    this.anims.create({
      key: 'indie-suck',
      frames: [1, 2, 3, 4].map(i => ({ key: `indie-suck-${i}` })),
      frameRate: 14,
      repeat: 0
    });
    this.anims.create({
      key: 'indie-cheeks-full',
      frames: [7, 8, 9, 10].map(i => ({ key: `indie-suck-${i}` })),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: 'rock-run',
      frames: [1, 2, 3, 4, 5, 6, 7].map(i => ({ key: `rock-run-${i}` })),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'rock-break',
      frames: [1, 2, 3, 4].map(i => ({ key: `rock-break-${i}` })),
      frameRate: 9,
      repeat: 0
    });
    this.anims.create({
      key: 'koji-idle',
      frames: [1, 2, 3, 4].map(i => ({ key: `koji-idle-${i}` })),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'koji-walk',
      frames: [1, 2, 3, 4].map(i => ({ key: `koji-walk-${i}` })),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'hudson-idle',
      frames: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ key: `hudson-idle-${i}` })),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'hudson-run',
      frames: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ key: `hudson-run-${i}` })),
      frameRate: 14,
      repeat: -1
    });
    this.anims.create({
      key: 'hudson-jump-rise',
      frames: [1, 2, 3, 4].map(i => ({ key: `hudson-jump-${i}` })),
      frameRate: 18,
      repeat: 0
    });
    this.anims.create({
      key: 'hudson-jump-land',
      frames: [7, 8, 9].map(i => ({ key: `hudson-jump-${i}` })),
      frameRate: 14,
      repeat: 0
    });
    this.anims.create({
      key: 'coin-spin',
      frames: [1, 2, 3, 4, 5, 6].map(i => ({ key: `coin-${i}` })),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'flag-wave',
      frames: [1, 2, 3, 4].map(i => ({ key: `flag-${i}` })),
      frameRate: 6,
      repeat: -1
    });
    this.scene.start('Menu');
  }

}
