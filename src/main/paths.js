// Налаштовує каталог даних застосунку та шлях до його налаштувань.
const path = require('node:path');

function configurePaths(app) {
  app.setPath('userData', path.join(app.getPath('appData'), 'SideNotes'));
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
}

function settingsPath(app) {
  return path.join(app.getPath('userData'), 'settings.json');
}

module.exports = { configurePaths, settingsPath };
