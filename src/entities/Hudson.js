class Hudson extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, leader) {
    super(scene, x, y, 'hudson-idle-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.97);

    this.leader = leader;
    this.followDistance = 110;
    this.speed = 280;
    this.animHeights = { 'hudson-idle': 124, 'hudson-run': 124 };
    this.state_ = 'idle';

    this.applyDisplayHeight();
    this.refreshBody();
    this.play('hudson-idle');
  }

  applyDisplayHeight() {
    const key = (this.anims.currentAnim && this.anims.currentAnim.key) || 'hudson-idle';
    const target = this.animHeights[key] || 124;
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
    const animKey = (s === 'running') ? 'hudson-run' : 'hudson-idle';
    const current = this.anims.currentAnim;
    if (!current || current.key !== animKey) {
      this.play(animKey, true);
      this.applyDisplayHeight();
      this.refreshBody();
    }
  }

  update() {
    if (!this.leader) return;
    const facing = this.leader.facing || 1;
    const desired = this.leader.x - facing * this.followDistance;
    const dx = desired - this.x;

    if (Math.abs(dx) > 12) {
      const targetSpeed = Math.sign(dx) * Math.min(this.speed, Math.abs(dx) * 5);
      this.setVelocityX(targetSpeed);
      this.setFlipX(dx < 0);
      this.setStateLabel('running');
    } else {
      this.setVelocityX(0);
      this.setFlipX(facing < 0);
      this.setStateLabel('idle');
    }
  }
}
