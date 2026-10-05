// Читає, перевіряє та зберігає settings.json у сумісному форматі.
const fs = require('node:fs');

const EDGES = ['left', 'right', 'top'];
const DEFAULTS = {
  mode: 'docked', floating: { x: 0, y: 0, w: 520, h: 600 },
  edge: 'right', align: 'center', theme: 'dark', font: 'Segoe UI Variable Text', fontSize: 15,
  hotkey: 'CommandOrControl+Alt+N', autoHide: true, autostart: false, notesDir: '',
  dock: {
    left: { w: 400, h: 700, full: true, off: null },
    right: { w: 400, h: 700, full: true, off: null },
    top: { w: 820, h: 380, full: false, off: null }
  }
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.round(+value) || min));
let filePath, settings, screen;

function initSettingsStore(pathToSettings, electronScreen) { filePath = pathToSettings; screen = electronScreen; }
function sanitize(value) {
  const result = { ...DEFAULTS, ...value, floating: { ...DEFAULTS.floating, ...(value.floating || {}) }, dock: { ...DEFAULTS.dock, ...(value.dock || {}) } };
  if (!['docked', 'floating'].includes(result.mode)) result.mode = 'docked';
  if (!EDGES.includes(result.edge)) result.edge = 'right';
  if (!['start', 'center', 'end'].includes(result.align)) result.align = 'center';
  for (const edge of EDGES) {
    const dock = result.dock[edge] = { ...DEFAULTS.dock[edge], ...(result.dock[edge] || {}) };
    dock.w = clamp(dock.w, 280, 1400);
    dock.h = clamp(dock.h, 200, 1600);
    dock.full = !!dock.full;
    const offset = Number(dock.off);
    dock.off = dock.off == null ? null : Number.isFinite(offset) ? Math.max(0, Math.round(offset)) : 0;
  }
  const floating = result.floating;
  floating.w = clamp(floating.w, 280, 1400);
  floating.h = clamp(floating.h, 200, 1600);
  const displays = screen?.getAllDisplays?.() || [];
  const fits = display => floating.x >= display.workArea.x && floating.y >= display.workArea.y &&
    floating.x + floating.w <= display.workArea.x + display.workArea.width &&
    floating.y + floating.h <= display.workArea.y + display.workArea.height;
  const display = displays.find(fits);
  if (display) {
    floating.x = Math.round(floating.x);
    floating.y = Math.round(floating.y);
    floating.w = Math.min(floating.w, display.workArea.width);
    floating.h = Math.min(floating.h, display.workArea.height);
  } else if (displays.length) {
    const area = (displays.find(item => item.bounds.x === 0 && item.bounds.y === 0) || displays[0]).workArea;
    floating.w = Math.min(floating.w, area.width);
    floating.h = Math.min(floating.h, area.height);
    floating.x = Math.round(area.x + (area.width - floating.w) / 2);
    floating.y = Math.round(area.y + (area.height - floating.h) / 2);
  } else {
    floating.x = Math.round(Number(floating.x) || 0);
    floating.y = Math.round(Number(floating.y) || 0);
  }
  result.fontSize = clamp(result.fontSize, 12, 24);
  return result;
}
function loadSettings(documentsPath) {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch {}
  settings = sanitize(saved);
  if (!settings.notesDir) settings.notesDir = require('node:path').join(documentsPath, 'SideNotes');
  fs.mkdirSync(settings.notesDir, { recursive: true });
  return settings;
}
function getSettings() { return settings; }
function persist() {
  try {
    settings = sanitize(settings);
    fs.mkdirSync(require('node:path').dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    return null;
  } catch (error) { return error.message; }
}
function saveSettings(draft) {
  settings = sanitize({ ...settings, ...draft, dock: { ...settings.dock, ...(draft.dock || {}) } });
  if (!settings.notesDir) settings.notesDir = require('node:path').join(require('electron').app.getPath('documents'), 'SideNotes');
  try { fs.mkdirSync(settings.notesDir, { recursive: true }); } catch {}
  const error = persist();
  return { ok: !error, error, settings };
}

module.exports = { DEFAULTS, clamp, initSettingsStore, loadSettings, getSettings, sanitize, persist, saveSettings };
