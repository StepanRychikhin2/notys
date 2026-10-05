// Відображає редактор, лічильник слів і відкладає автозбереження на 350 мс.
import { state } from '../state.js';
import { $, titleOf } from '../utils.js';

export function init() {
  $('#ed').addEventListener('input', () => {
    const note = state.notes.find(item => item.id === state.cur);
    if (!note) return;
    note.text = $('#ed').value;
    note.mtime = Date.now();
    $('#title').textContent = titleOf(note.text);
    updateMeta(false);
    clearTimeout(state.timer);
    state.timer = setTimeout(flush, 350);
  });
}

export function render() {
  const note = state.notes.find(item => item.id === state.cur);
  $('#ed').value = note?.text ?? '';
  updateMeta(true);
}

export function focus() { $('#ed').focus(); }
export function updateMeta(saved) {
  const words = $('#ed').value.trim().split(/\s+/).filter(Boolean).length;
  $('#words').textContent = words + ' сл.';
  $('#saved').textContent = saved ? 'Збережено' : 'Зберігаю…';
}

export function flush() {
  if (!state.timer) return Promise.resolve();
  clearTimeout(state.timer);
  state.timer = null;
  const note = state.notes.find(item => item.id === state.cur);
  if (!note) return Promise.resolve();
  return api.write(note.id, note.text).then(() => updateMeta(true));
}
