// Створює піктограму SideNotes у системному треї та її меню.
const path = require('node:path');
const { Tray, Menu, nativeImage, shell } = require('electron');

function createTray({ appDirectory, getSettings, toggle }) {
  const tray = new Tray(nativeImage.createFromPath(
    path.join(appDirectory, 'assets', 'icon.png')
  ).resize({ width: 16, height: 16 }));
  tray.setToolTip('SideNotes');
  tray.on('click', toggle);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Відкрити / згорнути', click: toggle },
    { label: 'Папка з нотатками', click: () => shell.openPath(getSettings().notesDir) },
    { type: 'separator' },
    { label: 'Вийти', click: () => require('electron').app.quit() }
  ]));
  return tray;
}

module.exports = { createTray };
