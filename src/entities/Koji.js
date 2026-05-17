class Koji extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'koji-idle-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.97);

    this.displayHeightTarget = 60;
    const texH = this.texture.getSourceImage().height;
    const texW = this.texture.getSourceImage().width;
    this.setScale(this.displayHeightTarget / texH);

    const bw = texW * 0.55;
    const bh = texH * 0.70;
    this.body.setSize(bw, bh).setOffset((texW - bw) / 2, texH * 0.97 - bh);

    this.speed = 220;
    this.followGap = 70;
    this.facing = 1;

    this.play('koji-idle');
  }

  update(target) {
    if (!this.active || !target) return;

    const dx = target.x - this.x;
    const dist = Math.abs(dx);

    if (dist > this.followGap) {
      const dir = Math.sign(dx);
      this.setVelocityX(dir * this.speed);
      this.facing = dir;
      this.setFlipX(dir < 0);
      if (this.anims.currentAnim?.key !== 'koji-walk') this.play('koji-walk');
    } else {
      this.setVelocityX(0);
      if (this.anims.currentAnim?.key !== 'koji-idle') this.play('koji-idle');
    }
  }
}
