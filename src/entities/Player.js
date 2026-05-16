class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'indie-idle-2');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene_ = scene;
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 1);

    this.animDisplayHeights = {
      'indie-idle': 140,
      'indie-run':  140,
      'indie-jump-rise': 202,
      'indie-jump-land': 202
    };
    this.applyDisplayHeight();
    this.refreshBody();

    this.speed = 280;
    this.jumpVelocity = -640;
    this.maxJumps = 2;
    this.jumpsLeft = this.maxJumps;
    this.wasGroundedLastFrame = false;
    this.facing = 1;

    this.state_ = 'idle';
    this.cheeksFull = false;
    this.invulnerableUntil = 0;

    this.play('indie-idle');
  }

  applyDisplayHeight() {
    const key = (this.anims.currentAnim && this.anims.currentAnim.key) || 'indie-idle';
    const target = this.animDisplayHeights[key] || 140;
    const texH = this.texture.getSourceImage().height;
    this.setScale(target / texH);
  }

  refreshBody() {
    const w = this.texture.getSourceImage().width;
    const h = this.texture.getSourceImage().height;
    const bw = w * 0.30;
    const bh = h * 0.82;
    this.body.setSize(bw, bh).setOffset((w - bw) / 2, h - bh);
  }

  setStateLabel(s) {
    if (this.state_ === s) return;
    this.state_ = s;

    if (s === 'mouthOpen') this.setTint(0xFFAACC);
    else if (s === 'cheeksFull') this.setTint(0xFFE066);
    else if (s === 'hurt') this.setTint(0xFF4444);
    else if (!this.invulnerableUntil) this.clearTint();

    let animKey;
    if (s === 'running') animKey = 'indie-run';
    else if (s === 'jumping' || s === 'falling') animKey = 'indie-jump-rise';
    else if (s === 'landing') animKey = 'indie-jump-land';
    else animKey = 'indie-idle';

    const current = this.anims.currentAnim;
    const loopingNotPlaying = current && current.key === animKey && current.repeat === -1 && !this.anims.isPlaying;
    if (!current || current.key !== animKey || loopingNotPlaying) {
      this.play(animKey, true);
      this.applyDisplayHeight();
      this.refreshBody();
    }
  }

  update(cursors, keys, time) {
    const left = cursors.left.isDown || keys.A.isDown;
    const right = cursors.right.isDown || keys.D.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(cursors.up)
      || Phaser.Input.Keyboard.JustDown(keys.W)
      || Phaser.Input.Keyboard.JustDown(keys.SPACE);
    const eatHeld = keys.E.isDown;
    const eatJustPressed = Phaser.Input.Keyboard.JustDown(keys.E);

    if (left) {
      this.setVelocityX(-this.speed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(this.speed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const grounded = this.body.blocked.down;
    const wasGrounded = this.wasGroundedLastFrame;
    if (grounded && !wasGrounded) {
      this.jumpsLeft = this.maxJumps;
    }

    if (jump && this.jumpsLeft > 0) {
      const isDouble = this.jumpsLeft < this.maxJumps;
      this.setVelocityY(this.jumpVelocity * (isDouble ? 0.88 : 1));
      this.jumpsLeft--;
    }

    if (this.cheeksFull) {
      if (eatJustPressed) this.spit();
    }

    const playingLand = this.anims.currentAnim && this.anims.currentAnim.key === 'indie-jump-land' && this.anims.isPlaying;
    if (this.cheeksFull) {
      this.setStateLabel('cheeksFull');
    } else if (eatHeld) {
      this.setStateLabel('mouthOpen');
    } else if (!grounded) {
      this.setStateLabel(this.body.velocity.y < 0 ? 'jumping' : 'falling');
    } else if (!wasGrounded && grounded) {
      this.setStateLabel('landing');
    } else if (playingLand) {
      // hold while the landing crouch plays out
    } else if (left || right) {
      this.setStateLabel('running');
    } else {
      this.setStateLabel('idle');
    }

    if (this.invulnerableUntil && time > this.invulnerableUntil) {
      this.invulnerableUntil = 0;
      this.clearTint();
      this.setAlpha(1);
    }

    this.wasGroundedLastFrame = grounded;
  }

  isMouthOpen() {
    return this.state_ === 'mouthOpen';
  }

  eatRock(rock) {
    if (this.cheeksFull) return false;
    this.cheeksFull = true;
    this.setStateLabel('cheeksFull');
    rock.disableBody(true, true);
    return true;
  }

  spit() {
    if (!this.cheeksFull) return;
    this.cheeksFull = false;
    this.scene_.spawnProjectile(this.x + this.facing * 40, this.y - 10, this.facing);
  }

  takeDamage(time) {
    if (this.invulnerableUntil) return false;
    this.invulnerableUntil = time + 1500;
    this.setTint(0xFF4444);
    this.setAlpha(0.6);
    this.setVelocityY(-320);
    this.setVelocityX(this.facing * -260);
    return true;
  }
}
