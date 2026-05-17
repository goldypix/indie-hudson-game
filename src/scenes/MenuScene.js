const MENU_BASE_COLOR = '#f3e2b6';
const MENU_FOCUS_COLOR = '#f5c63a';

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#49b8f7');
    MusicPlayer.start(this.sound);

    const W = this.scale.width;
    const H = this.scale.height;

    const titleTex = this.textures.get('title').getSourceImage();
    const titleAspect = titleTex.width / titleTex.height;
    const titleH = Math.min(H * 0.54, titleTex.height);
    const titleW = titleH * titleAspect;
    this.add.image(W / 2, H * 0.08, 'title')
      .setOrigin(0.5, 0)
      .setDisplaySize(titleW, titleH);

    this.step = 'count';
    this.focusIndex = 0;
    this.buttons = [];

    this.input.keyboard.on('keydown', (e) => this.handleKey(e));

    this.gamepads = new GamepadManager();
    const padA = this.gamepads.slots[0];
    const padB = this.gamepads.slots[1];
    this.navLeft  = new CompositeKey([padA.left,  padB.left]);
    this.navRight = new CompositeKey([padA.right, padB.right]);
    this.navJump  = new CompositeKey([padA.jump,  padB.jump]);

    this.renderMenu();
  }

  renderMenu() {
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];

    const W = this.scale.width;
    const H = this.scale.height;
    const labels = this.step === 'count'
      ? ['1 PLAYER', '2 PLAYERS']
      : ['INDIE', 'HUDSON'];

    const fontSize = Math.round(H * 0.05);
    const fontStyle = {
      fontSize: `${fontSize}px`,
      color: MENU_BASE_COLOR,
      fontFamily: 'Impact, "Arial Black", "Helvetica Neue", sans-serif',
      fontStyle: 'bold'
    };

    const gapEms = 2;
    const probes = labels.map(l => this.add.text(0, 0, l, fontStyle).setVisible(false));
    const widths = probes.map(p => p.width);
    const gapWidth = fontSize * gapEms;
    const totalW = widths.reduce((a, b) => a + b, 0) + gapWidth * (labels.length - 1);
    probes.forEach(p => p.destroy());

    const y = H * 0.80;
    let x = (W - totalW) / 2;
    labels.forEach((label, i) => {
      const centerX = x + widths[i] / 2;
      const t = this.add.text(centerX, y, label, fontStyle).setOrigin(0.5, 0.5);
      t.setInteractive();
      t.on('pointerover', () => this.setFocus(i));
      t.on('pointerdown', () => this.select(i));
      this.buttons.push(t);
      x += widths[i] + gapWidth;
    });

    this.focusIndex = 0;
    this.refreshFocus();
  }

  refreshFocus() {
    this.buttons.forEach((b, i) => {
      const focused = i === this.focusIndex;
      if (focused) {
        b.setColor(MENU_FOCUS_COLOR);
        b.setShadow(-3, 3, 'rgba(0,0,0,0.63)', 7, false, true);
        b.setScale(1.10);
      } else {
        b.setColor(MENU_BASE_COLOR);
        b.setShadow(0, 0, '#000', 0, false, false);
        b.setScale(1.0);
      }
    });
  }

  setFocus(i) {
    if (i === this.focusIndex) return;
    this.focusIndex = i;
    this.refreshFocus();
  }

  select(i) {
    this.setFocus(i);
    if (this.step === 'count') {
      if (i === 0) {
        this.step = 'char';
        this.renderMenu();
      } else {
        this.scene.start('Level1', { mode: '2p', character: null });
      }
    } else {
      const character = i === 0 ? 'indie' : 'hudson';
      this.scene.start('Level1', { mode: '1p', character });
    }
  }

  handleKey(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      this.setFocus((this.focusIndex - 1 + this.buttons.length) % this.buttons.length);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      this.setFocus((this.focusIndex + 1) % this.buttons.length);
    } else if (k === 'Enter' || k === ' ') {
      this.select(this.focusIndex);
    } else if (k === 'Escape' && this.step === 'char') {
      this.step = 'count';
      this.renderMenu();
    } else if (k === 'p' || k === 'P') {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    }
  }

  update() {
    if (!this.gamepads) return;
    this.gamepads.update();
    this.navLeft.update();
    this.navRight.update();
    this.navJump.update();
    if (this.navLeft._justDown) {
      this.navLeft._justDown = false;
      this.setFocus((this.focusIndex - 1 + this.buttons.length) % this.buttons.length);
    }
    if (this.navRight._justDown) {
      this.navRight._justDown = false;
      this.setFocus((this.focusIndex + 1) % this.buttons.length);
    }
    if (this.navJump._justDown) {
      this.navJump._justDown = false;
      this.select(this.focusIndex);
    }
  }
}
