// Реєструє IPC-канали та передає всі дії відповідним модулям.
const { ipcMain, dialog, app } = require('electron');

function registerIpc({ windowManager, settingsStore, hotkey, notesStore, notes }) {
  const {
    win, toggle, expand, collapse, resize, resizeEnd, moveStart, move, moveEnd,
    setPinned, withBusy, relayout
  } = windowManager;
  const { getSettings, saveSettings } = settingsStore;
  const toggleHotkey = () => toggle();

  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_, draft) => {
    const oldSettings = getSettings();
    let result = saveSettings(draft);
    const hotkeyOk = hotkey.reregisterHotkey(oldSettings.hotkey, result.settings.hotkey, toggleHotkey);
    if (!hotkeyOk) result = saveSettings({ ...result.settings, hotkey: oldSettings.hotkey });
    app.setLoginItemSettings({ openAtLogin: !!result.settings.autostart });
    notesStore.ensureDirectory(notes);
    relayout();
    return { ...result, hotkeyOk, settings: getSettings() };
  });
  ipcMain.handle('notes:list', () => notesStore.list(notes));
  ipcMain.handle('notes:create', () => notesStore.create(notes));
  ipcMain.handle('notes:write', (_, id, text) => notesStore.write(notes, id, text));
  ipcMain.handle('notes:remove', (_, id) => notesStore.remove(notes, id));
  ipcMain.handle('dialog:folder', async () => {
    const result = await withBusy(() => dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory']
    }));
    win.focus();
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.on('win:resize', (_, point) => resize(point.x, point.y, point.part, point.phase));
  ipcMain.on('win:resize-end', resizeEnd);
  ipcMain.on('win:move-start', (_, point) => moveStart(point.x, point.y));
  ipcMain.on('win:move', (_, point) => move(point.x, point.y));
  ipcMain.on('win:move-end', moveEnd);
  ipcMain.on('win:collapse', collapse);
  ipcMain.on('win:expand', expand);
  ipcMain.on('win:pin', (_, value) => setPinned(value));
  ipcMain.on('win:quit', () => app.quit());
}

module.exports = { registerIpc };
