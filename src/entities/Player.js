class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'indie-idle-2');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene_ = scene;
    this.setCollideWorldBounds(true);

    this.targetDisplayHeight = 140;
    this.applyDisplayHeight();
    this.refreshBody();

    this.speed = 280;
    this.jumpVelocity = -640;
    this.facing = 1;

    this.state_ = 'idle';
    this.cheeksFull = false;
    this.invulnerableUntil = 0;

    this.play('indie-idle');
  }

  applyDisplayHeight() {
    const texH = this.texture.getSourceImage().height;
    const s = this.targetDisplayHeight / texH;
    this.setScale(s);
  }

  refreshBody() {
    const w = this.texture.getSourceImage().width;
    const h = this.texture.getSourceImage().height;
    const bw = w * 0.32;
    const bh = h * 0.92;
    this.body.setSize(bw, bh).setOffset((w - bw) / 2, h - bh);
  }

  setStateLabel(s) {
    if (this.state_ === s) return;
    const prev = this.state_;
    this.state_ = s;

    if (s === 'mouthOpen') this.setTint(0xFFAACC);
    else if (s === 'cheeksFull') this.setTint(0xFFE066);
    else if (s === 'hurt') this.setTint(0xFF4444);
    else if (!this.invulnerableUntil) this.clearTint();

    const animKey = (s === 'running') ? 'indie-run' : 'indie-idle';
    const current = this.anims.currentAnim;
    if (!current || current.key !== animKey || !this.anims.isPlaying) {
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

    if (jump && this.body.blocked.down) {
      this.setVelocityY(this.jumpVelocity);
    }

    if (this.cheeksFull) {
      if (eatJustPressed) this.spit();
    }

    if (this.cheeksFull) {
      this.setStateLabel('cheeksFull');
    } else if (eatHeld) {
      this.setStateLabel('mouthOpen');
    } else if (!this.body.blocked.down) {
      this.setStateLabel(this.body.velocity.y < 0 ? 'jumping' : 'falling');
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
