// Передає main-процесу координати перетягування внутрішнього краю панелі.
import { state, emit } from '../state.js';
import { $ } from '../utils.js';

export function init() {
  for (const grip of document.querySelectorAll('[data-part], [data-float-part]')) {
    const part = grip.dataset.floatPart || grip.dataset.part;
    grip.onpointerdown = event => {
      state.dragging = true;
      grip.setPointerCapture(event.pointerId);
      document.body.classList.add('dragging');
      emit('resize:start');
      if (grip.dataset.floatPart) api.resizeStart(event.screenX, event.screenY, part);
    };
    grip.onpointermove = event => {
      if (state.dragging) api.resize(event.screenX, event.screenY, part);
    };
    grip.onpointerup = () => {
      state.dragging = false;
      document.body.classList.remove('dragging');
      api.resizeEnd();
      emit('resize:end');
    };
  }
}
