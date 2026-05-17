class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1'); }

  init(data) {
    this.mode = (data && data.mode) || '2p';
    this.character = (data && data.character) || null;
  }

  create() {
    this.cameras.main.setZoom((window.GAME_DPR || 1) * 1.25);
    this.worldWidth = 3400;
    this.worldHeight = 720;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    const hillsTexH = 1014;
    const cam = this.cameras.main;
    const visibleH = cam.height / cam.zoom;
    const bgScale = visibleH / hillsTexH;
    this.bgHills = this.add.tileSprite(0, this.worldHeight - visibleH, this.worldWidth, visibleH, 'hills')
      .setOrigin(0, 0)
      .setScrollFactor(0.35, 1)
      .setDepth(-100);
    this.bgHills.tileScaleX = bgScale;
    this.bgHills.tileScaleY = bgScale;

    const cloudCount = Phaser.Math.Between(18, 24);
    const minScale = 0.28;
    const maxScale = 1.10;
    for (let i = 0; i < cloudCount; i++) {
      const scale = Phaser.Math.FloatBetween(minScale, maxScale);
      const t = (scale - minScale) / (maxScale - minScale);
      const scrollFactor = Phaser.Math.Linear(0.25, 0.75, t);
      const depth = -60 + t * 15;
      const alpha = Phaser.Math.Linear(0.75, 1.0, t);
      this.add.image(
        Phaser.Math.Between(40, this.worldWidth - 40),
        Phaser.Math.Between(80, 400),
        'cloud'
      )
        .setScrollFactor(scrollFactor)
        .setScale(scale)
        .setAlpha(alpha)
        .setFlipX(Math.random() < 0.5)
        .setDepth(depth);
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
      [720, 600], [1380, 600], [1850, 600], [2700, 600], [3250, 600]
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
    this.input.keyboard.on('keydown-R', () => this.scene.restart({ mode: this.mode, character: this.character }));
    this.input.keyboard.on('keydown-M', () => this.scene.start('Menu'));
    this.input.keyboard.on('keydown-P', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    this.gamepads = new GamepadManager();
    this.gamepads.attachDebugUI(this);
    const padA = this.gamepads.slots[0];
    const padB = this.gamepads.slots[1];

    const indieActive  = this.mode === '2p' || this.character === 'indie';
    const hudsonActive = this.mode === '2p' || this.character === 'hudson';

    const indieSources = this.mode === '2p'
      ? { left: [this.cursors.left, padA.left], right: [this.cursors.right, padA.right], jump: [this.cursors.up, this.keys.SPACE, padA.jump], eat: [this.keys.E, padA.eat] }
      : { left: [this.cursors.left, this.keys.A, padA.left, padB.left], right: [this.cursors.right, this.keys.D, padA.right, padB.right], jump: [this.cursors.up, this.keys.SPACE, this.keys.W, padA.jump, padB.jump], eat: [this.keys.E, padA.eat, padB.eat] };

    const hudsonSources = this.mode === '2p'
      ? { left: [this.keys.A, padB.left], right: [this.keys.D, padB.right], jump: [this.keys.W, padB.jump], eat: [] }
      : { left: [this.cursors.left, this.keys.A, padA.left, padB.left], right: [this.cursors.right, this.keys.D, padA.right, padB.right], jump: [this.cursors.up, this.keys.SPACE, this.keys.W, padA.jump, padB.jump], eat: [] };

    const indieLeft  = new CompositeKey(indieSources.left);
    const indieRight = new CompositeKey(indieSources.right);
    const indieJump  = new CompositeKey(indieSources.jump);
    const indieEat   = new CompositeKey(indieSources.eat);

    const hudsonLeft  = new CompositeKey(hudsonSources.left);
    const hudsonRight = new CompositeKey(hudsonSources.right);
    const hudsonJump  = new CompositeKey(hudsonSources.jump);

    this.restartKey = new CompositeKey([padA.restart, padB.restart]);

    this.compositeKeys = [
      indieLeft, indieRight, indieJump, indieEat,
      hudsonLeft, hudsonRight, hudsonJump,
      this.restartKey
    ];

    const soloX = 150;
    this.indie = indieActive ? new Player(this, this.mode === '2p' ? 100 : soloX, 500, {
      spritePrefix: 'indie',
      initialFrame: 2,
      controls: { left: indieLeft, right: indieRight, jump: [indieJump], eat: indieEat },
      canEat: true
    }) : null;

    this.hudson = hudsonActive ? new Player(this, this.mode === '2p' ? 200 : soloX, 500, {
      spritePrefix: 'hudson',
      initialFrame: 1,
      animDisplayHeights: {
        'hudson-idle': 124,
        'hudson-run': 124,
        'hudson-jump-rise': 149,
        'hudson-jump-land': 149
      },
      controls: { left: hudsonLeft, right: hudsonRight, jump: [hudsonJump], eat: null },
      canEat: false
    }) : null;

    this.players = [this.indie, this.hudson].filter(Boolean);
    this.activeCharacters = this.players.map(p => p.prefix);
    this.voice = new VoiceHelper(this);

    this.koji = new Koji(this, 80, 620);
    this.scheduleNextCallout();
    MusicPlayer.start(this.sound);
    this.time.delayedCall(1200, () => {
      if (this.finished || this.activeCharacters.length === 0) return;
      const choices = this.activeCharacters.length > 1 ? ['callKoji', 'callPartner'] : ['callKoji'];
      this.voice.playForRandomActive(this.activeCharacters, Phaser.Utils.Array.GetRandom(choices));
    });

    this.physics.add.collider(this.koji, this.platforms);
    this.physics.add.collider(this.rocks, this.platforms, null, (rock, plat) => plat.texture.key === 'ground-tile');
    this.physics.add.collider(this.projectiles, this.platforms, (p) => p.destroy());
    this.physics.add.overlap(this.projectiles, this.rocks, (p, r) => { p.destroy(); r.squish(); this.bumpScore(2); }, null, this);

    this.players.forEach(p => {
      this.physics.add.collider(p, this.platforms, (player, platform) => {
        player.currentSurface = platform.texture.key === 'ground-tile' ? 'grass' : 'wood';
      });
      this.physics.add.overlap(p, this.coins, this.collectCoin, null, this);
      this.physics.add.overlap(p, this.rocks, this.handleRockHit, null, this);
      this.physics.add.overlap(p, this.flag, this.winLevel, null, this);
    });

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

    this.fpsText = this.add.text(this.scale.width - 20, 16, '', { fontSize: '18px', color: '#9efb9e', stroke: '#000000', strokeThickness: 3, fontFamily: 'system-ui, sans-serif' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setVisible(false);
    this.input.keyboard.on('keydown-O', () => this.fpsText.setVisible(!this.fpsText.visible));
  }

  update(time) {
    if (this.gamepads) this.gamepads.update();
    if (this.compositeKeys) this.compositeKeys.forEach(k => k.update());
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }
    if (this.players.length > 0 && this.cameraTarget) {
      const sumX = this.players.reduce((s, p) => s + p.x, 0);
      const sumY = this.players.reduce((s, p) => s + p.y, 0);
      this.cameraTarget.x = Math.round(sumX / this.players.length);
      this.cameraTarget.y = Math.round(sumY / this.players.length);
    }
    if (this.fpsText && this.fpsText.visible) {
      this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
    }

    if (this.finished) return;
    this.players.forEach(p => p.update(time));
    if (this.koji && this.players.length > 0) {
      const lead = this.players.reduce((a, b) => b.x > a.x ? b : a);
      this.koji.update(lead);
    }
    this.rocks.children.iterate(r => { if (r && r.active) r.update(); });

    if (this.players.length > 1) {
      const cam = this.cameras.main;
      const view = cam.worldView;
      const margin = 60;
      const edgeLeft = view.x + margin;
      const edgeRight = view.x + view.width - margin;
      this.players.forEach(p => {
        if (p.x <= edgeLeft && p.body.velocity.x < 0) p.setVelocityX(0);
        if (p.x >= edgeRight && p.body.velocity.x > 0) p.setVelocityX(0);
      });
    }
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
    if (this.players.length === 0) return;
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
    if (this.cache.audio.exists('sfx-coin')) this.sound.play('sfx-coin', { volume: 0.55 });
    this.voice.play(player.prefix, 'coin', { chance: 0.35 });
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
    this.players.forEach(p => p.setVelocity(0, 0));
    this.voice.playForRandomActive(this.activeCharacters, 'gameOver');
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over\nPress R to try again\nPress M for menu', {
      fontSize: '56px', color: '#ffffff', stroke: '#000000', strokeThickness: 8,
      align: 'center', fontFamily: 'system-ui, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
  }

  winLevel() {
    if (this.finished) return;
    this.finished = true;
    this.players.forEach(p => p.setVelocity(0, 0));
    this.voice.playForRandomActive(this.activeCharacters, 'jump');
    this.add.text(this.scale.width / 2, this.scale.height / 2, `You Win!\nCoins: ${this.score}\nPress R to play again\nPress M for menu`, {
      fontSize: '56px', color: '#FFD700', stroke: '#000000', strokeThickness: 8,
      align: 'center', fontFamily: 'system-ui, sans-serif'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
  }

  scheduleNextCallout() {
    const delay = Phaser.Math.Between(15000, 35000);
    this.time.delayedCall(delay, () => {
      if (this.finished || this.activeCharacters.length === 0) {
        this.scheduleNextCallout();
        return;
      }
      const categories = this.activeCharacters.length > 1
        ? ['callKoji', 'callPartner']
        : ['callKoji'];
      const cat = Phaser.Utils.Array.GetRandom(categories);
      this.voice.playForRandomActive(this.activeCharacters, cat);
      this.scheduleNextCallout();
    });
  }
}
