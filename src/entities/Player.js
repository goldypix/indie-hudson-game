class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, opts = {}) {
    const prefix = opts.spritePrefix || 'indie';
    const initialFrame = opts.initialFrame || 2;
    super(scene, x, y, `${prefix}-idle-${initialFrame}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene_ = scene;
    this.prefix = prefix;
    this.controls = opts.controls || null;
    this.canEat = opts.canEat !== false;

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.97);

    this.animDisplayHeights = opts.animDisplayHeights || {
      [`${prefix}-idle`]: 140,
      [`${prefix}-run`]:  140,
      [`${prefix}-jump-rise`]: 202,
      [`${prefix}-jump-land`]: 202,
      [`${prefix}-suck`]:         140,
      [`${prefix}-cheeks-full`]:  140
    };
    this.applyDisplayHeight();
    this.refreshBody();

    this.speed = opts.speed || 280;
    this.jumpVelocity = opts.jumpVelocity || -640;
    this.maxJumps = 2;
    this.jumpsLeft = this.maxJumps;
    this.wasGroundedLastFrame = false;
    this.facing = 1;

    this.state_ = 'idle';
    this.cheeksFull = false;
    this.invulnerableUntil = 0;

    this.play(`${prefix}-idle`);
  }

  applyDisplayHeight() {
    const key = (this.anims.currentAnim && this.anims.currentAnim.key) || `${this.prefix}-idle`;
    const target = this.animDisplayHeights[key] || 140;
    const texH = this.texture.getSourceImage().height;
    this.setScale(target / texH);
  }

  refreshBody() {
    const w = this.texture.getSourceImage().width;
    const h = this.texture.getSourceImage().height;
    const bw = w * 0.30;
    const bh = h * 0.82;
    this.body.setSize(bw, bh).setOffset((w - bw) / 2, h * 0.97 - bh);
  }

  setStateLabel(s) {
    if (this.state_ === s) return;
    this.state_ = s;

    if (s === 'hurt') this.setTint(0xFF4444);
    else if (!this.invulnerableUntil) this.clearTint();

    let animKey;
    if (s === 'running') animKey = `${this.prefix}-run`;
    else if (s === 'jumping' || s === 'falling') animKey = `${this.prefix}-jump-rise`;
    else if (s === 'landing') animKey = `${this.prefix}-jump-land`;
    else if (s === 'sucking') animKey = `${this.prefix}-suck`;
    else if (s === 'cheeksFull') animKey = `${this.prefix}-cheeks-full`;
    else animKey = `${this.prefix}-idle`;

    if (!this.scene_.anims.exists(animKey)) animKey = `${this.prefix}-idle`;

    const current = this.anims.currentAnim;
    const loopingNotPlaying = current && current.key === animKey && current.repeat === -1 && !this.anims.isPlaying;
    if (!current || current.key !== animKey || loopingNotPlaying) {
      this.play(animKey, true);
      this.applyDisplayHeight();
      this.refreshBody();
    }
  }

  update(time) {
    const c = this.controls;
    if (!c) return;
    const left  = c.left  && c.left.isDown;
    const right = c.right && c.right.isDown;
    const jumpKeys = c.jump || [];
    const jump = jumpKeys.some(k => k && Phaser.Input.Keyboard.JustDown(k));
    const eatHeld        = this.canEat && c.eat && c.eat.isDown;
    const eatJustPressed = this.canEat && c.eat && Phaser.Input.Keyboard.JustDown(c.eat);

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
      if (isDouble && this.scene_.anims.exists(`${this.prefix}-jump-rise`)) {
        this.play(`${this.prefix}-jump-rise`);
      }
      this.scene_.voice?.play(this.prefix, 'jump', { chance: 0.55 });
    }

    if (this.canEat) {
      if (this.cheeksFull && eatJustPressed) {
        this.spit();
      } else if (eatHeld && !this.cheeksFull) {
        this.applySuckPull();
      } else if (this.suckTarget) {
        if (this.suckTarget.active && this.suckTarget.body) this.suckTarget.body.allowGravity = true;
        this.suckTarget.beingSucked = false;
        this.suckTarget = null;
      }
    }

    const playingLand = this.anims.currentAnim && this.anims.currentAnim.key === `${this.prefix}-jump-land` && this.anims.isPlaying;
    if (this.cheeksFull) {
      this.setStateLabel('cheeksFull');
    } else if (!grounded) {
      this.setStateLabel(this.body.velocity.y < 0 ? 'jumping' : 'falling');
    } else if (eatHeld) {
      this.setStateLabel('sucking');
    } else if (!wasGrounded && grounded) {
      this.setStateLabel('landing');
    } else if (playingLand) {
      // hold while landing crouch plays out
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

    if (this.state_ === 'running' && grounded) {
      const stepInterval = 280;
      if (time - (this.lastStepTime || 0) > stepInterval) {
        this.lastStepTime = time;
        const surface = this.currentSurface || 'grass';
        const key = surface === 'wood' ? `sfx-${this.prefix}-step-wood` : 'sfx-step-grass';
        if (this.scene_.cache.audio.exists(key)) this.scene_.sound.play(key, { volume: 0.35 });
      }
    }

    this.wasGroundedLastFrame = grounded;
  }

  applySuckPull() {
    let nearest = null;
    let nearestDist = Infinity;
    this.scene_.rocks.children.iterate(r => {
      if (!r || !r.active) return;
      const dx = r.x - this.x;
      if (this.facing * dx <= 0) return;
      const dy = r.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 360 && d < nearestDist) {
        nearestDist = d;
        nearest = r;
      }
    });

    if (this.suckTarget && this.suckTarget !== nearest) {
      if (this.suckTarget.active && this.suckTarget.body) this.suckTarget.body.allowGravity = true;
      this.suckTarget.beingSucked = false;
      this.suckTarget = null;
    }
    if (!nearest) return;
    this.suckTarget = nearest;

    const dx = this.x - nearest.x;
    const dy = (this.y - 50) - nearest.y;
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    let pullSpeed;
    if (d > 90) {
      pullSpeed = 250 + 500 * (1 - d / 360);
    } else {
      pullSpeed = 1400;
    }
    nearest.beingSucked = true;
    if (nearest.body) nearest.body.allowGravity = false;
    nearest.setVelocity((dx / d) * pullSpeed, (dy / d) * pullSpeed);

    if (d < 40 && !nearest.shrunkBeforeEat) {
      nearest.shrunkBeforeEat = true;
      nearest.setScale(nearest.scaleX * 0.5);
    } else if (nearest.shrunkBeforeEat) {
      this.eatRock(nearest);
    }
  }

  isSucking() {
    return this.state_ === 'sucking';
  }

  eatRock(rock) {
    if (this.cheeksFull) return false;
    this.cheeksFull = true;
    this.setStateLabel('cheeksFull');
    rock.disableBody(true, true);
    this.scene_.voice?.play(this.prefix, 'eat');
    return true;
  }

  spit() {
    if (!this.cheeksFull) return;
    this.cheeksFull = false;
    this.scene_.spawnProjectile(this.x + this.facing * 40, this.y - 50, this.facing);
    this.scene_.voice?.play(this.prefix, 'spit');
  }

  takeDamage(time) {
    if (this.invulnerableUntil) return false;
    this.invulnerableUntil = time + 1500;
    this.setTint(0xFF4444);
    this.setAlpha(0.6);
    this.setVelocityY(-320);
    this.setVelocityX(this.facing * -260);
    this.scene_.voice?.play(this.prefix, 'hurt');
    return true;
  }
}
