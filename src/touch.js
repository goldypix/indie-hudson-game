(() => {
  const send = (type, key, keyCode) => {
    window.dispatchEvent(new KeyboardEvent(type, {
      key, code: key, keyCode, which: keyCode, bubbles: true
    }));
  };

  document.querySelectorAll('#touch-controls .btn').forEach(btn => {
    const key = btn.dataset.key;
    const keyCode = parseInt(btn.dataset.keycode, 10);
    let pressed = false;

    const down = (e) => {
      if (e) e.preventDefault();
      if (pressed) return;
      pressed = true;
      btn.classList.add('pressed');
      send('keydown', key, keyCode);
      if (e && e.pointerId !== undefined && btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };
    const up = (e) => {
      if (e) e.preventDefault();
      if (!pressed) return;
      pressed = false;
      btn.classList.remove('pressed');
      send('keyup', key, keyCode);
    };

    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('touchmove', e => {
    if (e.target.closest && e.target.closest('#touch-controls')) e.preventDefault();
  }, { passive: false });
})();
