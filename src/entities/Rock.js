class Rock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'rock-run-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0, 0);

    this.targetDisplayHeight = 72;
    const texH = this.texture.getSourceImage().height;
    const texW = this.texture.getSourceImage().width;
    this.setScale(this.targetDisplayHeight / texH);

    const r = Math.min(texW, texH) * 0.44;
    this.body.setCircle(r, texW / 2 - r, texH / 2 - r);

    this.direction = -1;
    this.speed = 130;

    this.play('rock-run');
  }

  update() {
    if (!this.active) return;
    if (this.beingSucked || this.breaking) return;
    this.setVelocityX(this.direction * this.speed);

    if (this.body.blocked.left || this.body.blocked.right) {
      this.destroy();
    }
  }

  squish() {
    if (this.breaking) return;
    this.breaking = true;
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.y -= 6;
    if (this.scene.cache.audio.exists('sfx-rock-crumble')) this.scene.sound.play('sfx-rock-crumble', { volume: 0.6 });
    this.play('rock-break');
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'rock-break', () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        delay: 3000,
        duration: 800,
        onComplete: () => this.destroy()
      });
    });
  }
}
