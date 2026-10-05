// Відкриває панель натисканням на смужку у згорнутому стані.
import { $ } from '../utils.js';

export function init() { $('#handle').onclick = () => api.expand(); }
export function show() { document.body.classList.add('handle'); }
export function hide() { document.body.classList.remove('handle'); }
