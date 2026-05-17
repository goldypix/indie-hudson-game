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
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `hudson-idle-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `hudson-run-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `hudson-jump-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `indie-suck-${i}`),
      ...[1, 2, 3, 4, 5, 6].map(i => `coin-${i}`),
      ...[1, 2, 3, 4].map(i => `flag-${i}`),
      'cloud', 'tree', 'bush', 'flower', 'platform-strip', 'hills', 'ground-tile'
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
      frames: [7, 8, 9].map(i => ({ key: `indie-jump-${i}` })),
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
    this.scene.start('Level1');
  }

}
