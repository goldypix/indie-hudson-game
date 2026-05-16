const DPR = Math.min(3, window.devicePixelRatio || 1);
window.GAME_DPR = DPR;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280 * DPR,
    height: 720 * DPR
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1400 },
      debug: false
    }
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  scene: [BootScene, Level1Scene]
};

window.__game = new Phaser.Game(config);
