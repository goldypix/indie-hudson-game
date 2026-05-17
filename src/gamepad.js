// Standard Gamepad API mapping (W3C). Button indices:
//   0 bottom face   1 right face   2 left face   3 top face
//   4 L1            5 R1           6 L2          7 R2
//   8 Select        9 Start       10 L3         11 R3
//  12 D-Up         13 D-Down      14 D-Left     15 D-Right    16 Home
//
// On Switch Pro / Joy-Con / 8BitDo in Switch mode, browsers usually still
// expose the bottom face button at index 0 (so "B" on the physical pad
// reports as 0, which is what we want for jump). The debug overlay (F1)
// shows the live button index — if a controller reports differently we add
// an override in MAPPING_OVERRIDES keyed by a substring of gamepad.id.
const STANDARD_MAPPING = {
  jump:    [0],
  eat:     [2],
  restart: [9],
  left:    [14],
  right:   [15],
  up:      [12],
  down:    [13],
};

const MAPPING_OVERRIDES = [
  // Example: { match: '8bitdo zero', map: { jump: [1], eat: [3], ... } }
];

function mappingFor(gamepad) {
  const id = (gamepad && gamepad.id ? gamepad.id : '').toLowerCase();
  for (const o of MAPPING_OVERRIDES) {
    if (id.includes(o.match)) return { ...STANDARD_MAPPING, ...o.map };
  }
  return STANDARD_MAPPING;
}

class VirtualKey {
  constructor() {
    this.isDown = false;
    this._justDown = false;
    this._prev = false;
  }
  setDown(down) {
    const d = !!down;
    if (d && !this._prev) this._justDown = true;
    this.isDown = d;
    this._prev = d;
  }
}

class CompositeKey {
  constructor(sources) {
    this.sources = sources;
    this.isDown = false;
    this._justDown = false;
    this._prev = false;
  }
  update() {
    let down = false;
    for (const s of this.sources) {
      if (s && s.isDown) { down = true; break; }
    }
    if (down && !this._prev) this._justDown = true;
    this.isDown = down;
    this._prev = down;
  }
}

class GamepadSlot {
  constructor(index) {
    this.index = index;
    this.connected = false;
    this.id = null;
    this.left = new VirtualKey();
    this.right = new VirtualKey();
    this.up = new VirtualKey();
    this.down = new VirtualKey();
    this.jump = new VirtualKey();
    this.eat = new VirtualKey();
    this.restart = new VirtualKey();
  }
  poll(gp) {
    if (!gp) {
      this.connected = false;
      this.id = null;
      this.left.setDown(false); this.right.setDown(false);
      this.up.setDown(false);   this.down.setDown(false);
      this.jump.setDown(false); this.eat.setDown(false);
      this.restart.setDown(false);
      return;
    }
    this.connected = true;
    this.id = gp.id;
    const map = mappingFor(gp);
    const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes || [];
    const axisX = ax[0] || 0;
    const axisY = ax[1] || 0;
    const dz = 0.35;

    this.left.setDown(map.left.some(btn)   || axisX < -dz);
    this.right.setDown(map.right.some(btn) || axisX >  dz);
    this.up.setDown(map.up.some(btn)       || axisY < -dz);
    this.down.setDown(map.down.some(btn)   || axisY >  dz);
    this.jump.setDown(map.jump.some(btn));
    this.eat.setDown(map.eat.some(btn));
    this.restart.setDown(map.restart.some(btn));
  }
}

class GamepadManager {
  constructor() {
    this.slots = [new GamepadSlot(0), new GamepadSlot(1)];
    this.debugVisible = false;
    this.debugText = null;
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[gamepad connected]', e.gamepad.index, e.gamepad.id);
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('[gamepad disconnected]', e.gamepad.index, e.gamepad.id);
    });
  }
  update() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.slots[0].poll(pads[0]);
    this.slots[1].poll(pads[1]);
    if (this.debugVisible && this.debugText) {
      this.debugText.setText(this.formatDebug(pads));
    }
  }
  formatDebug(pads) {
    const labels = ['Slot 0 (Indie)', 'Slot 1 (Hudson)', 'Slot 2', 'Slot 3'];
    const lines = ['GAMEPAD DEBUG'];
    for (let i = 0; i < 4; i++) {
      const gp = pads[i];
      if (!gp) { lines.push(`${labels[i]}: —`); continue; }
      const pressed = [];
      gp.buttons.forEach((b, idx) => { if (b.pressed) pressed.push(idx); });
      const axes = (gp.axes || []).map(a => a.toFixed(2)).join(', ');
      lines.push(`${labels[i]}: ${gp.id}`);
      lines.push(`  buttons: [${pressed.join(',') || '—'}]`);
      lines.push(`  axes: [${axes}]`);
    }
    return lines.join('\n');
  }
  attachDebugUI(scene) {
    this.debugText = scene.add.text(20, 130, 'GAMEPAD DEBUG\n(waiting...)', {
      fontSize: '13px', color: '#ffff00',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 6, y: 4 },
      stroke: '#000', strokeThickness: 2,
      fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(1000).setVisible(false);
    const toggle = () => {
      this.debugVisible = !this.debugVisible;
      this.debugText.setVisible(this.debugVisible);
    };
    scene.input.keyboard.on('keydown-ZERO', toggle);
    scene.input.keyboard.on('keydown-NUMPAD_ZERO', toggle);
    scene.input.keyboard.on('keydown-MINUS', toggle);
  }
}

window.GamepadManager = GamepadManager;
window.CompositeKey = CompositeKey;
