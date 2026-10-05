// Керує вікном, CSS-переходами, розкладкою та станами показу панелі.
const path = require('node:path');
const { BrowserWindow, screen } = require('electron');
const { expandedRect, handleRect } = require('./dock-geometry');
const { createWindowMover } = require('./window-mover');
const { createWindowResizer } = require('./window-resizer');

function createWindowManager({ app, getSettings, persist, appDirectory }) {
  let win;
  let lastDisplay;
  let open = false;
  let pinned = false;
  let busy = false;
  let openedAt = 0;
  let closeTimer = null;
  const send = (channel, data) => win && !win.isDestroyed() && win.webContents.send(channel, data);
  const currentRect = () => getSettings().mode === 'floating'
    ? { ...getSettings().floating }
    : expandedRect(lastDisplay, getSettings());

  function expand() {
    if (open) return;
    open = true;
    openedAt = Date.now();
    clearTimeout(closeTimer);
    lastDisplay = screen.getDisplayMatching(win.getBounds());
    if (getSettings().mode === 'docked') lastDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    send('state', { open: true, mode: getSettings().mode });
    setTimeout(() => {
      if (!open || win.isDestroyed()) return;
      win.setBounds(currentRect());
      win.show();
      win.focus();
    }, getSettings().mode === 'floating' ? 0 : 30);
    setTimeout(() => send('focus-editor'), getSettings().mode === 'floating' ? 180 : 420);
  }
  function collapse() {
    if (!open) return;
    open = false;
    send('flush');
    send('state', { open: false });
    closeTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        if (getSettings().mode === 'floating') win.hide();
        else {
          win.setBounds(handleRect(currentRect(), getSettings().edge));
          send('handle');
        }
      }
    }, getSettings().mode === 'floating' ? 180 : 280);
  }
  function relayout() {
    lastDisplay = screen.getDisplayMatching(win.getBounds());
    const rect = currentRect();
    if (getSettings().mode === 'floating') {
      win.setBounds(rect);
      send('mode', 'floating');
      if (!open) win.hide();
    } else {
      win.setBounds(open ? rect : handleRect(rect, getSettings().edge));
      send('mode', 'docked');
      if (!open) { send('handle'); win.show(); }
    }
    send('settings', getSettings());
  }
  function withBusy(callback) {
    busy = true;
    return Promise.resolve().then(callback).finally(() => { busy = false; });
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.round(+value) || min));

  lastDisplay = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    ...handleRect(expandedRect(lastDisplay, getSettings()), getSettings().edge),
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    thickFrame: false,
    webPreferences: {
      preload: path.join(appDirectory, 'src', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(appDirectory, 'src', 'renderer', 'index.html'));
  win.webContents.on('did-finish-load', () => {
    if (getSettings().mode === 'docked') send('handle');
    else { send('mode', 'floating'); win.hide(); }
  });
  win.on('blur', () => {
    if (open && getSettings().autoHide && !pinned && !busy && Date.now() - openedAt > 500) collapse();
  });
  const mover = createWindowMover({
    win,
    screen,
    getSettings,
    isOpen: () => open,
    persist,
    send,
    relayout: display => {
      if (display) lastDisplay = display;
      relayout();
    }
  });
  const resizer = createWindowResizer({
    win, screen, getSettings, isOpen: () => open, getDisplay: () => lastDisplay,
    getRect: currentRect, persist, send
  });

  return {
    win, expand, collapse, relayout, ...resizer, withBusy,
    ...mover,
    toggle: () => open ? collapse() : expand(),
    setPinned: value => { pinned = !!value; },
    isOpen: () => open
  };
}

module.exports = { createWindowManager };
