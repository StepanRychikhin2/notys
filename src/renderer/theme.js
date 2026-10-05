// Застосовує кольорову тему, шрифт і клас вибраного краю.
import { $ } from './utils.js';
import { ico } from './icons.js';

export function applyLook(settings) {
  const dark = settings.theme === 'auto'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : settings.theme === 'dark';
  document.body.classList.toggle('dark', dark);
  document.body.classList.toggle('light', !dark);
  document.body.style.setProperty('--font', `'${settings.font}', 'Segoe UI', sans-serif`);
  document.body.style.setProperty('--fs', settings.fontSize + 'px');
}

export function applyEdge(settings) {
  document.body.dataset.edge = settings.edge;
  $('#b-fold').innerHTML = ico(settings.edge === 'top' ? 'up' : settings.edge);
}
