// Переміщує панель вільно, притягує до краю та зберігає її режим.
function createWindowMover({ win, screen, getSettings, isOpen, persist, relayout, send }) {
  let drag = null;
  let magnet = null;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function moveStart(x, y) {
    if (!isOpen() || win.isDestroyed()) return;
    const bounds = win.getBounds();
    drag = { x: x - bounds.x, y: y - bounds.y, bounds, mode: getSettings().mode, edge: getSettings().edge };
    magnet = drag.mode === 'docked' ? drag.edge : null;
  }
  function move(x, y) {
    if (!drag || !isOpen() || win.isDestroyed()) return;
    const screenPoint = { x: Math.round(x), y: Math.round(y) };
    const display = screen.getDisplayNearestPoint(screenPoint);
    const area = display.workArea;
    const old = win.getBounds();
    const width = Math.min(old.width, area.width);
    const height = Math.min(old.height, area.height);
    const rect = {
      x: clamp(Math.round(x - drag.x), area.x, area.x + area.width - width),
      y: clamp(Math.round(y - drag.y), area.y, area.y + area.height - height),
      width, height
    };
    const gap = edge => edge === 'top' ? rect.y - area.y
      : edge === 'left' ? rect.x - area.x : area.x + area.width - rect.x - rect.width;
    const touching = ['top', 'left', 'right'].find(edge => gap(edge) <= 10);
    if (touching) magnet = touching;
    else if (magnet && gap(magnet) > 28) magnet = null;
    if (magnet) {
      if (magnet === 'top') rect.y = area.y;
      if (magnet === 'left') rect.x = area.x;
      if (magnet === 'right') rect.x = area.x + area.width - rect.width;
    }
    const settings = getSettings();
    if (drag.mode === 'docked' && !magnet) settings.mode = 'floating';
    else if (magnet) settings.mode = 'docked';
    send('magnet', !!magnet);
    send('mode', settings.mode);
    win.setBounds(rect);
    drag.display = display;
    drag.rect = rect;
  }
  function moveEnd() {
    if (!drag || win.isDestroyed()) return;
    const final = drag.rect || win.getBounds();
    const settings = getSettings();
    const display = drag.display || screen.getDisplayMatching(final);
    const area = display.workArea;
    if (magnet) {
      settings.mode = 'docked';
      settings.edge = magnet;
      const dock = settings.dock[magnet];
      dock.w = final.width;
      dock.h = final.height;
      dock.full = false;
      dock.off = magnet === 'top' ? final.x - area.x : final.y - area.y;
    } else {
      settings.mode = 'floating';
      settings.floating = { x: final.x, y: final.y, w: final.width, h: final.height };
    }
    drag = null;
    send('magnet', false);
    magnet = null;
    persist();
    relayout(display);
  }

  return { moveStart, move, moveEnd };
}

module.exports = { createWindowMover };
