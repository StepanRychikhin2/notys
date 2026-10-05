// Змінює розмір вільного вікна або прикріпленої панелі.
function createWindowResizer({ win, screen, getSettings, isOpen, getDisplay, getRect, persist, send }) {
  let grab = null;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.round(+value) || min));

  function resize(x, y, part = 'depth', phase = 'move') {
    if (!isOpen()) return;
    if (getSettings().mode === 'floating') {
      if (phase === 'start') { grab = { ...win.getBounds(), pointerX: x, pointerY: y }; return; }
      if (!grab) return;
      const bounds = grab;
      const dx = x - bounds.pointerX, dy = y - bounds.pointerY;
      const left = part.includes('left'), right = part.includes('right');
      const top = part.includes('top'), bottom = part.includes('bottom');
      const next = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      const area = screen.getDisplayMatching(bounds).workArea;
      const rightEdge = bounds.x + bounds.width, bottomEdge = bounds.y + bounds.height;
      if (left) { next.x = clamp(bounds.x + dx, area.x, rightEdge - Math.min(280, area.width)); next.width = rightEdge - next.x; }
      if (right) { const end = clamp(rightEdge + dx, bounds.x + Math.min(280, area.width), area.x + area.width); next.width = end - bounds.x; }
      if (top) { next.y = clamp(bounds.y + dy, area.y, bottomEdge - Math.min(200, area.height)); next.height = bottomEdge - next.y; }
      if (bottom) { const end = clamp(bottomEdge + dy, bounds.y + Math.min(200, area.height), area.y + area.height); next.height = end - bounds.y; }
      getSettings().floating = { x: next.x, y: next.y, w: next.width, h: next.height };
      win.setBounds(next);
      return;
    }
    if (phase === 'start') return;
    const area = getDisplay().workArea;
    const edge = getSettings().edge;
    const dock = getSettings().dock[edge];
    const alongSide = edge !== 'top';
    if (part === 'start' || part === 'end') {
      const rect = getRect();
      const startArea = alongSide ? area.y : area.x;
      const total = alongSide ? area.height : area.width;
      const minimum = alongSide ? 200 : 280;
      const start = alongSide ? rect.y : rect.x;
      const length = alongSide ? rect.height : rect.width;
      const cursor = alongSide ? y : x;
      let nextStart = start;
      let nextLength = length;
      if (part === 'end') nextLength = clamp(cursor - start, minimum, startArea + total - start);
      else { nextStart = clamp(cursor, startArea, start + length - minimum); nextLength = start + length - nextStart; }
      dock[alongSide ? 'h' : 'w'] = nextLength;
      dock.off = nextStart - startArea;
      dock.full = false;
    } else if (edge === 'left') dock.w = clamp(x - area.x, 280, area.width);
    else if (edge === 'right') dock.w = clamp(area.x + area.width - x, 280, area.width);
    else dock.h = clamp(y - area.y, 200, area.height);
    win.setBounds(getRect());
  }

  function resizeEnd() {
    grab = null;
    persist();
    send('settings', getSettings());
  }
  return { resize, resizeEnd };
}

module.exports = { createWindowResizer };
