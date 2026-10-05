// Шукає, показує, відкриває та видаляє нотатки зі списку.
import { state } from '../state.js';
import { $, titleOf, previewOf, dateOf } from '../utils.js';
import { ico } from '../icons.js';

export function init(callbacks) {
  $('#q').oninput = () => render(callbacks);
}

export function render(actions) {
  const query = $('#q').value.trim().toLowerCase();
  const items = state.notes.filter(note => !query || note.text.toLowerCase().includes(query));
  const box = $('#list');
  box.innerHTML = items.length
    ? ''
    : `<div class="empty">${query ? 'Нічого не знайдено' : 'Поки що порожньо. Натисни +'}</div>`;
  for (const note of items) {
    const item = document.createElement('div');
    item.className = 'item' + (note.id === state.cur ? ' cur' : '');
    item.innerHTML = `<div class="t"><b></b><span class="p"></span></div><span class="d"></span><button class="ib" title="У кошик">${ico('trash')}</button>`;
    item.querySelector('b').textContent = titleOf(note.text);
    item.querySelector('.p').textContent = previewOf(note.text);
    item.querySelector('.d').textContent = dateOf(note.mtime);
    item.onclick = event => { if (!event.target.closest('.ib')) actions.open(note.id); };
    item.querySelector('.ib').onclick = () => actions.remove(note.id);
    box.appendChild(item);
  }
}
