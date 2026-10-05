// Захоплює комбінацію клавіш у полі налаштування гарячої клавіші.
import { state, emit } from '../state.js';
import { $ } from '../utils.js';

const KEYS = {
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ' ': 'Space'
};

export function init() {
  $('#v-settings').addEventListener('keydown', event => {
    if (event.target.id !== 'hk') return;
    event.preventDefault();
    event.stopPropagation();
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
    if (!(event.ctrlKey || event.altKey || event.metaKey)) {
      emit('settings:status', 'Додай Ctrl, Alt або Win');
      return;
    }
    const key = KEYS[event.key] || (event.key.length === 1 ? event.key.toUpperCase() : event.key);
    state.draft.hotkey = [
      event.ctrlKey && 'CommandOrControl', event.altKey && 'Alt',
      event.shiftKey && 'Shift', event.metaKey && 'Super', key
    ].filter(Boolean).join('+');
    event.target.value = state.draft.hotkey;
    emit('settings:draft');
  });
}
