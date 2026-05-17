class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1'); }

  create() {
    this.cameras.main.setZoom((window.GAME_DPR || 1) * 1.25);
    this.worldWidth = 3400;
    this.worldHeight = 720;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    const hillsTexH = 967;
    const bgScale = this.scale.height / hillsTexH;
    this.bgHills = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'hills')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);
    this.bgHills.tileScaleX = bgScale;
    this.bgHills.tileScaleY = bgScale;

    const cloudCount = Phaser.Math.Between(18, 24);
    for (let i = 0; i < cloudCount; i++) {
      this.add.image(
        Phaser.Math.Between(40, this.worldWidth - 40),
        Phaser.Math.Between(80, 400),
        'cloud'
      )
        .setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.55))
        .setScale(Phaser.Math.FloatBetween(0.28, 1.10))
        .setAlpha(Phaser.Math.FloatBetween(0.80, 1))
        .setFlipX(Math.random() < 0.5)
        .setDepth(-50);
    }


    this.platforms = this.physics.add.staticGroup();
    const gTileW = 200;
    const gTileH = 72;
    for (let x = 0; x < this.worldWidth + gTileW; x += gTileW) {
      this.platforms.create(x, 656 + gTileH / 2, 'ground-tile').refreshBody();
    }

    const platformList = [
      [480,  500, 0.32],
      [950,  450, 0.30],
      [1150, 490, 0.28],
      [1600, 420, 0.36],
      [2050, 470, 0.30],
      [2450, 430, 0.28],
      [2950, 490, 0.34]
    ];
    const platformBoxes = [];
    platformList.forEach(([x, y, scale]) => {
      const p = this.platforms.create(x, y, 'platform-strip');
      p.setScale(scale);
      p.refreshBody();
      const tightW = p.displayWidth * 0.86;
      p.body.setSize(tightW, p.displayHeight);
      p.body.position.x = p.x - tightW / 2;
      platformBoxes.push({ x, w: p.displayWidth });
    });

    const isOnPlatform = (x) => platformBoxes.some(b => Math.abs(b.x - x) < (b.w / 2 + 30));

    const bushCount = Phaser.Math.Between(10, 16);
    for (let i = 0; i < bushCount; i++) {
      let bx; let tries = 0;
      do { bx = Phaser.Math.Between(40, this.worldWidth - 40); tries++; }
      while (isOnPlatform(bx) && tries < 8);
      this.add.image(bx, Phaser.Math.Between(668, 674), 'bush')
        .setOrigin(0.5, 1)
        .setScale(Phaser.Math.FloatBetween(0.32, 0.55))
        .setFlipX(Math.random() < 0.5)
        .setDepth(-2);
    }

    const flowerCount = Phaser.Math.Between(14, 22);
    for (let i = 0; i < flowerCount; i++) {
      let fx; let tries = 0;
      do { fx = Phaser.Math.Between(20, this.worldWidth - 20); tries++; }
      while (isOnPlatform(fx) && tries < 8);
      this.add.image(fx, Phaser.Math.Between(666, 672), 'flower')
        .setOrigin(0.5, 1)
        .setScale(Phaser.Math.FloatBetween(0.17, 0.28))
        .setFlipX(Math.random() < 0.5)
        .setDepth(-1);
    }

    this.coins = this.physics.add.group({ allowGravity: false });
    const coinPositions = [
      [480, 460],
      [950, 410], [1150, 450],
      [1600, 380],
      [2050, 430],
      [2450, 390],
      [2950, 450],
      [250, 600], [720, 600], [1380, 600], [1850, 600], [2700, 600], [3250, 600]
    ];
    coinPositions.forEach(([x, y]) => {
      const c = this.coins.create(x, y, 'coin-1');
      c.setScale(0.45);
      c.play({ key: 'coin-spin', startFrame: Phaser.Math.Between(0, 5) });
    });

    this.rocks = this.physics.add.group();
    this.scheduleNextRock();

    this.projectiles = this.physics.add.group({ allowGravity: false });

    this.flag = this.physics.add.staticSprite(this.worldWidth - 150, 670, 'flag-1');
    this.flag.setOrigin(0.5, 1).setScale(0.85).refreshBody();
    this.flag.body.setSize(40, 120).setOffset(80, 30);
    this.flag.play('flag-wave');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,Q,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    this.gamepads = new GamepadManager();
    this.gamepads.attachDebugUI(this);
    const padIndie  = this.gamepads.slots[0];
    const padHudson = this.gamepads.slots[1];

    const indieLeft  = new CompositeKey([this.cursors.left,  padIndie.left]);
    const indieRight = new CompositeKey([this.cursors.right, padIndie.right]);
    const indieJump  = new CompositeKey([this.cursors.up, this.keys.SPACE, padIndie.jump]);
    const indieEat   = new CompositeKey([this.keys.E, padIndie.eat]);

    const hudsonLeft  = new CompositeKey([this.keys.A, padHudson.left]);
    const hudsonRight = new CompositeKey([this.keys.D, padHudson.right]);
    const hudsonJump  = new CompositeKey([this.keys.W, padHudson.jump]);

    this.restartKey = new CompositeKey([padIndie.restart, padHudson.restart]);

    this.compositeKeys = [
      indieLeft, indieRight, indieJump, indieEat,
      hudsonLeft, hudsonRight, hudsonJump,
      this.restartKey
    ];

    this.player = new Player(this, 100, 500, {
      spritePrefix: 'indie',
      initialFrame: 2,
      controls: {
        left: indieLeft,
        right: indieRight,
        jump: [indieJump],
        eat: indieEat
      },
      canEat: true
    });
    this.hudson = new Player(this, 200, 500, {
      spritePrefix: 'hudson',
      initialFrame: 1,
      animDisplayHeights: {
        'hudson-idle': 124,
        'hudson-run': 124,
        'hudson-jump-rise': 175,
        'hudson-jump-land': 175
      },
      controls: {
        left: hudsonLeft,
        right: hudsonRight,
        jump: [hudsonJump],
        eat: null
      },
      canEat: false
    });

    this.physics.add.collider(this.player,  this.platforms);
    this.physics.add.collider(this.hudson,  this.platforms);
    this.physics.add.collider(this.rocks,   this.platforms, null, (rock, plat) => plat.texture.key === 'ground-tile');
    this.physics.add.collider(this.projectiles, this.platforms, (p) => p.destroy());
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.hudson, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.rocks, this.handleRockHit, null, this);
    this.physics.add.overlap(this.hudson, this.rocks, this.handleRockHit, null, this);
    this.physics.add.overlap(this.projectiles, this.rocks, (p, r) => { p.destroy(); r.squish(); this.bumpScore(2); }, null, this);
    this.physics.add.overlap(this.player, this.flag, this.winLevel, null, this);
    this.physics.add.overlap(this.hudson, this.flag, this.winLevel, null, this);

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setRoundPixels(true);
    this.cameraTarget = this.add.zone(150, 656, 1, 1);
    this.cameras.main.startFollow(this.cameraTarget, true, 1, 1);

    this.score = 0;
    this.lives = 5;
    this.finished = false;

    const uiStyle = { fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 5, fontFamily: 'system-ui, sans-serif' };
    this.scoreText = this.add.text(20, 16, 'Coins: 0', uiStyle).setScrollFactor(0).setDepth(100);
    this.livesText = this.add.text(20, 52, 'Lives: 5', { ...uiStyle, color: '#ff8aa0' }).setScrollFactor(0).setDepth(100);
    this.hint = this.add.text(20, 92,
      'Indie: Arrows + Space jump, E eat    Hudson: WASD (W = jump)    R: restart    Gamepads supported (F1 = debug)',
      { fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontFamily: 'system-ui, sans-serif' }
    ).setScrollFactor(0).setDepth(100);
  }

  update(time) {
    if (this.gamepads) this.gamepads.update();
    if (this.compositeKeys) this.compositeKeys.forEach(k => k.update());
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }
    if (this.bgHills) {
      this.bgHills.tilePositionX = this.cameras.main.scrollX * 0.35;
    }
    if (this.player && this.hudson && this.cameraTarget) {
      this.cameraTarget.x = Math.round((this.player.x + this.hudson.x) / 2);
      this.cameraTarget.y = Math.round((this.player.y + this.hudson.y) / 2);
    }

    if (this.finished) return;
    this.player.update(time);
    if (this.hudson) this.hudson.update(time);
    this.rocks.children.iterate(r => { if (r && r.active) r.update(); });

    const cam = this.cameras.main;
    const view = cam.worldView;
    const margin = 60;
    const edgeLeft = view.x + margin;
    const edgeRight = view.x + view.width - margin;
    [this.player, this.hudson].forEach(p => {
      if (p.x <= edgeLeft && p.body.velocity.x < 0) p.setVelocityX(0);
      if (p.x >= edgeRight && p.body.velocity.x > 0) p.setVelocityX(0);
    });
  }

  scheduleNextRock() {
    const delay = Phaser.Math.Between(2000, 10000);
    this.time.delayedCall(delay, () => {
      if (this.finished) return;
      this.spawnRock();
      this.scheduleNextRock();
    });
  }

  spawnRock() {
    if (!this.player) return;
    if (this.rocks.countActive(true) >= 3) return;
    const r = new Rock(this, this.worldWidth - 30, 600);
    this.rocks.add(r);
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

    if (player.isSucking() && !player.cheeksFull) {
      player.eatRock(rock);
      return;
    }

    const stomp = player.body.velocity.y > 0 && player.y < rock.y;
    if (stomp) {
      rock.squish();
      const visibleRockTopY = rock.y - rock.displayHeight / 2;
      const animKey = (player.anims.currentAnim && player.anims.currentAnim.key) || '';
      const tuckedFeetOffsetByAnim = {
        'indie-jump-rise': -28,
        'indie-jump-land': -8
      };
      const feetOffset = tuckedFeetOffsetByAnim[animKey] || 0;
      player.y = visibleRockTopY - feetOffset;
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
