class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1'); }

  create() {
    this.cameras.main.setZoom(window.GAME_DPR || 1);
    this.worldWidth = 3400;
    this.worldHeight = 720;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.add.rectangle(0, 0, this.worldWidth, this.worldHeight, 0x87CEEB)
      .setOrigin(0).setScrollFactor(0).setDepth(-100);

    for (let i = 0; i < 10; i++) {
      const x = (i + 1) * (this.worldWidth / 11);
      const y = Phaser.Math.Between(50, 220);
      this.add.image(x, y, 'cloud')
        .setScrollFactor(0.4)
        .setScale(Phaser.Math.FloatBetween(0.18, 0.32))
        .setDepth(-50);
    }

    const treeXs = [180, 760, 1400, 2050, 2700, 3250];
    treeXs.forEach((x, i) => {
      const scale = 0.30 + (i % 2) * 0.06;
      this.add.image(x, 620, 'tree')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.7)
        .setScale(scale)
        .setDepth(-20);
    });

    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < this.worldWidth; x += 64) {
      this.platforms.create(x + 32, 688, 'ground').refreshBody();
    }

    const platformPositions = [
      [400, 576], [528, 576], [656, 576],
      [880, 496], [1008, 496],
      [1240, 416], [1368, 416], [1496, 416],
      [1760, 528], [1888, 528], [2016, 528],
      [2240, 448], [2368, 448],
      [2620, 528], [2748, 528], [2876, 528]
    ];
    platformPositions.forEach(([x, y]) => {
      const p = this.platforms.create(x, y, 'platform-strip', 'platform-one');
      p.setScale(0.22);
      p.refreshBody();
    });

    const bushXs = [220, 540, 950, 1350, 1700, 2100, 2480, 2880, 3200];
    bushXs.forEach(x => {
      this.add.image(x, 660, 'bush')
        .setOrigin(0.5, 1)
        .setScale(0.22)
        .setDepth(-2);
    });

    const flowerXs = [80, 350, 700, 1150, 1580, 1850, 2280, 2640, 3000, 3320];
    flowerXs.forEach(x => {
      this.add.image(x, 666, 'flower')
        .setOrigin(0.5, 1)
        .setScale(0.14)
        .setDepth(-1);
    });

    this.coins = this.physics.add.group({ allowGravity: false });
    const coinPositions = [
      [260, 600], [400, 520], [528, 520], [656, 520],
      [944, 440], [1304, 360], [1432, 360],
      [1760, 472], [1888, 472], [2016, 472],
      [2304, 392], [2680, 472], [2876, 472],
      [3100, 600]
    ];
    coinPositions.forEach(([x, y]) => this.coins.create(x, y, 'coin'));

    this.rocks = this.physics.add.group();
    [780, 1620, 2480].forEach(x => {
      const r = new Rock(this, x, 600);
      this.rocks.add(r);
    });

    this.projectiles = this.physics.add.group({ allowGravity: false });

    this.flag = this.physics.add.staticSprite(this.worldWidth - 150, 556, 'flag');

    this.player = new Player(this, 100, 500);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.rocks, this.platforms);
    this.physics.add.collider(this.projectiles, this.platforms, (p) => p.destroy());
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.rocks, this.handleRockHit, null, this);
    this.physics.add.overlap(this.projectiles, this.rocks, (p, r) => { p.destroy(); r.squish(); this.bumpScore(2); }, null, this);
    this.physics.add.overlap(this.player, this.flag, this.winLevel, null, this);

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    this.score = 0;
    this.lives = 3;
    this.finished = false;

    const uiStyle = { fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 5, fontFamily: 'system-ui, sans-serif' };
    this.scoreText = this.add.text(20, 16, 'Coins: 0', uiStyle).setScrollFactor(0).setDepth(100);
    this.livesText = this.add.text(20, 52, 'Lives: 3', { ...uiStyle, color: '#ff8aa0' }).setScrollFactor(0).setDepth(100);
    this.hint = this.add.text(20, 92,
      'Arrow keys / WASD: move    Up / Space: jump    E: eat (hold) / spit (tap)    R: restart',
      { fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontFamily: 'system-ui, sans-serif' }
    ).setScrollFactor(0).setDepth(100);
  }

  update(time) {
    if (this.finished) return;
    this.player.update(this.cursors, this.keys, time);
    this.rocks.children.iterate(r => { if (r && r.active) r.update(); });
  }

  bumpScore(n) {
    this.score += n;
    this.scoreText.setText(`Coins: ${this.score}`);
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.bumpScore(1);
  }

  handleRockHit(player, rock) {
    if (!rock.active || this.finished) return;

    if (player.isMouthOpen() && !player.cheeksFull) {
      player.eatRock(rock);
      return;
    }

    const stomp = player.body.velocity.y > 0 && player.body.bottom < rock.body.top + 24;
    if (stomp) {
      rock.squish();
      player.setVelocityY(-480);
      this.bumpScore(2);
      return;
    }

    if (player.takeDamage(this.time.now)) {
      this.lives -= 1;
      this.livesText.setText(`Lives: ${this.lives}`);
      if (this.lives <= 0) this.gameOver();
    }
  }

  spawnProjectile(x, y, dir) {
    const p = this.projectiles.create(x, y, 'rock');
    p.setScale(0.6);
    p.setVelocityX(dir * 720);
    p.setVelocityY(-120);
    this.time.delayedCall(2200, () => { if (p && p.active) p.destroy(); });
  }

  gameOver() {
    this.finished = true;
    this.player.setVelocity(0, 0);
    this.add.text(640, 360, 'Game Over\nPress R to try again', {
      fontSize: '56px', color: '#ffffff', stroke: '#000000', strokeThickness: 8,
      align: 'center', fontFamily: 'system-ui, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
  }

  winLevel() {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0);
    this.add.text(640, 360, `You Win!\nCoins: ${this.score}\nPress R to play again`, {
      fontSize: '56px', color: '#FFD700', stroke: '#000000', strokeThickness: 8,
      align: 'center', fontFamily: 'system-ui, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
  }
}
