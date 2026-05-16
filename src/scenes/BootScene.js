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
    for (let i = 1; i <= 7; i++) {
      const n = String(i).padStart(2, '0');
      this.load.image(`rock-run-${i}`, `assets/sprites/rock-run-v1/rock-run_${n}.png`);
    }

    this.load.image('cloud', 'assets/world/cloud_01_v01.png');
    this.load.image('tree', 'assets/world/tree_01_v01.png');
    this.load.image('bush', 'assets/world/bush_01_v01.png');
    this.load.image('flower', 'assets/world/flower_01_v01.png');
    this.load.image('platform-strip', 'assets/world/platform_v01.png');

    this.makeCoinTexture();
    this.makeGroundTexture();
    this.makeFlagTexture();
  }

  create() {
    const smooth = [
      ...this.idleFrames.map(i => `indie-idle-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `indie-run-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `indie-jump-${i}`),
      ...[1, 2, 3, 4, 5, 6, 7].map(i => `rock-run-${i}`),
      'cloud', 'tree', 'bush', 'flower', 'platform-strip'
    ];
    smooth.forEach(key => {
      const tex = this.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    });

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff0000, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture('blank', 1, 1);
    g.destroy();

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
      key: 'indie-jump',
      frames: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ key: `indie-jump-${i}` })),
      frameRate: 18,
      repeat: 0
    });
    this.anims.create({
      key: 'rock-run',
      frames: [1, 2, 3, 4, 5, 6, 7].map(i => ({ key: `rock-run-${i}` })),
      frameRate: 10,
      repeat: -1
    });
    this.scene.start('Level1');
  }

  makeCoinTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFD700);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xFFEC8B);
    g.fillCircle(13, 13, 4);
    g.lineStyle(2, 0xB8860B);
    g.strokeCircle(16, 16, 14);
    g.generateTexture('coin', 32, 32);
    g.destroy();
  }

  makeGroundTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6BA84F);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x8B5A3C);
    g.fillRect(0, 16, 64, 48);
    g.fillStyle(0x5A3A26);
    g.fillCircle(20, 40, 3);
    g.fillCircle(48, 52, 4);
    g.fillCircle(12, 56, 2);
    g.generateTexture('ground', 64, 64);
    g.destroy();
  }

  makeFlagTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x666666);
    g.fillRect(28, 0, 6, 200);
    g.fillStyle(0xE63946);
    g.fillTriangle(34, 10, 90, 35, 34, 60);
    g.fillStyle(0x444444);
    g.fillRect(20, 192, 22, 8);
    g.generateTexture('flag', 96, 200);
    g.destroy();
  }

}
