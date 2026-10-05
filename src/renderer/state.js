// Зберігає спільний стан renderer і надсилає події підписникам.
export const state = {
  S: null,
  draft: null,
  notes: [],
  cur: null,
  view: 'editor',
  pinned: false,
  timer: null,
  dragging: false
};

const listeners = new Set();
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function emit(type, value) {
  for (const listener of listeners) listener(type, value, state);
}
