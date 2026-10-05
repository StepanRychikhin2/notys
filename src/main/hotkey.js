// Реєструє глобальну клавішу й відновлює попередню, якщо нова зайнята.
const { globalShortcut } = require('electron');

function registerHotkey(accelerator, toggle) {
  try { return globalShortcut.register(accelerator, toggle); }
  catch { return false; }
}
function reregisterHotkey(oldAccelerator, accelerator, toggle) {
  if (accelerator === oldAccelerator && globalShortcut.isRegistered(accelerator)) return true;
  globalShortcut.unregisterAll();
  const ok = registerHotkey(accelerator, toggle);
  if (!ok) registerHotkey(oldAccelerator, toggle);
  return ok;
}
function unregisterHotkeys() { globalShortcut.unregisterAll(); }

module.exports = { registerHotkey, reregisterHotkey, unregisterHotkeys };
