// Запускає SideNotes, гарантує один екземпляр і поєднує модулі main-процесу.
const path = require('node:path');
const { app, screen } = require('electron');
const paths = require('./paths');
const settingsStore = require('./settings-store');
const notesStore = require('./notes-store');
const hotkey = require('./hotkey');
const { createWindowManager } = require('./window-manager');
const { createTray } = require('./tray');
const { registerIpc } = require('./ipc');

paths.configurePaths(app);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let windowManager;
  let tray;
  app.on('second-instance', () => windowManager?.expand());
  app.whenReady().then(() => {
    settingsStore.initSettingsStore(paths.settingsPath(app), screen);
    const settings = settingsStore.loadSettings(app.getPath('documents'));
    const notes = notesStore.initNotesStore(settingsStore.getSettings);
    windowManager = createWindowManager({
      app,
      getSettings: settingsStore.getSettings,
      persist: settingsStore.persist,
      appDirectory: path.resolve(__dirname, '../..')
    });
    app.setLoginItemSettings({ openAtLogin: !!settings.autostart });
    hotkey.registerHotkey(settings.hotkey, () => windowManager.toggle());
    tray = createTray({
      appDirectory: path.resolve(__dirname, '../..'),
      getSettings: settingsStore.getSettings,
      toggle: () => windowManager.toggle()
    });
    registerIpc({ windowManager, settingsStore, hotkey, notesStore, notes });
    screen.on('display-metrics-changed', () => windowManager.relayout());
  });
  app.on('window-all-closed', () => {});
  app.on('will-quit', hotkey.unregisterHotkeys);
  app.on('before-quit', () => tray?.destroy());
}
