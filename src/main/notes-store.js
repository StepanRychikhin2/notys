// Керує Markdown-нотатками та переміщенням видалених файлів у кошик.
const fs = require('node:fs');
const path = require('node:path');
const { shell } = require('electron');

function initNotesStore(getSettings) { return { getSettings }; }
function directory(store) { return store.getSettings().notesDir; }
function ensureDirectory(store) { fs.mkdirSync(directory(store), { recursive: true }); }
function safe(id) {
  return typeof id === 'string' && /^[^\\/:*?"<>|]+$/.test(id) && !id.includes('..');
}
function notePath(store, id) { return path.join(directory(store), id + '.md'); }
function list(store) {
  ensureDirectory(store);
  return fs.readdirSync(directory(store)).filter(file => file.endsWith('.md')).map(file => {
    const full = path.join(directory(store), file);
    return {
      id: file.slice(0, -3),
      text: fs.readFileSync(full, 'utf8'),
      mtime: fs.statSync(full).mtimeMs
    };
  }).sort((a, b) => b.mtime - a.mtime);
}
function create(store) {
  ensureDirectory(store);
  const id = Date.now().toString(36);
  fs.writeFileSync(notePath(store, id), '');
  return id;
}
function write(store, id, text) {
  if (safe(id)) fs.writeFileSync(notePath(store, id), text);
}
async function remove(store, id) {
  if (safe(id)) await shell.trashItem(notePath(store, id));
}

module.exports = { initNotesStore, directory, ensureDirectory, safe, notePath, list, create, write, remove };
