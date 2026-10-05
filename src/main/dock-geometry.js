// Обчислює прямокутники панелі та ручки без залежності від стану Electron.
function expandedRect(display, settings) {
  const area = display.workArea;
  const edge = settings.edge;
  const align = settings.align;
  const dock = settings.dock[edge];
  const width = Math.min(dock.w, area.width);
  const height = Math.min(dock.h, area.height);
  const place = (length, total, start) => dock.full
    ? start
    : dock.off != null
      ? start + Math.min(Math.max(0, dock.off), Math.max(0, total - length))
      : align === 'start'
        ? start
        : align === 'end'
          ? start + total - length
          : start + Math.round((total - length) / 2);
  if (edge === 'top') {
    const w = dock.full ? area.width : width;
    return {
      x: place(w, area.width, area.x), y: area.y, width: w, height
    };
  }
  const h = dock.full ? area.height : height;
  return {
    x: edge === 'left' ? area.x : area.x + area.width - width,
    y: place(h, area.height, area.y), width, height: h
  };
}

function handleRect(rect, edge) {
  const thickness = 12;
  if (edge === 'top') {
    const length = Math.min(120, rect.width);
    return {
      x: rect.x + Math.round((rect.width - length) / 2),
      y: rect.y, width: length, height: thickness
    };
  }
  const length = Math.min(120, rect.height);
  return {
    x: edge === 'left' ? rect.x : rect.x + rect.width - thickness,
    y: rect.y + Math.round((rect.height - length) / 2),
    width: thickness, height: length
  };
}

module.exports = { expandedRect, handleRect };
