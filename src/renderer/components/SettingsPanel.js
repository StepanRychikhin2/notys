// Відображає чернетку налаштувань і зберігає її лише кнопкою «Зберегти».
import { state, emit, subscribe } from '../state.js';
import { $, clone, esc } from '../utils.js';
import { applyLook } from '../theme.js';

const isDirty = () => JSON.stringify(state.draft) !== JSON.stringify(state.S);
const row = (label, control, sub = '') =>
  `<div class="row"><div>${label}${sub ? `<small>${sub}</small>` : ''}</div>${control}</div>`;
const segment = (key, options, value) =>
  `<div class="seg">${options.map(([v, label]) => `<button data-seg="${key}" data-v="${v}" class="${v === value ? 'on' : ''}">${label}</button>`).join('')}</div>`;
const switcher = (key, on) =>
  `<button class="sw ${on ? 'on' : ''}" data-sw="${key}" role="switch" aria-checked="${on}"></button>`;
const numberInput = (key, min, max, value, step) =>
  `<div class="num"><input type="range" data-r="${key}" min="${min}" max="${max}" step="${step}" value="${value}"><input type="number" data-n="${key}" min="${min}" max="${max}" value="${value}"></div>`;

export function init() {
  const view = $('#v-settings');
  view.addEventListener('click', onClick);
  view.addEventListener('input', onInput);
  view.addEventListener('change', onChange);
  subscribe((type, message) => {
    if (type === 'settings:status' && state.view === 'settings') updateFoot(message);
    if (type === 'settings:draft' && state.view === 'settings') updateFoot();
  });
}

export function render(message) {
  const draft = state.draft;
  const dock = draft.dock[draft.edge];
  const sizeLabel = draft.edge !== 'top' ? 'На всю висоту' : 'На всю ширину';
  $('#v-settings').innerHTML = `<div class="set">
    <div class="grp">Розташування</div>
    ${row('Край екрана', segment('edge', [['left', 'Ліво'], ['top', 'Верх'], ['right', 'Право'], ['floating', 'Вільне']], draft.mode === 'floating' ? 'floating' : draft.edge))}
    ${row('Ширина, px', numberInput('w', 280, 1400, dock.w, 10))}
    ${row('Висота, px', numberInput('h', 200, 1600, dock.h, 10))}
    ${row(sizeLabel, switcher('full', dock.full), 'ігнорує розмір вздовж краю')}
    ${row('Положення вздовж краю', segment('align', [['start', 'Початок'], ['center', 'Центр'], ['end', 'Кінець']], draft.align))}
    <div class="grp">Вигляд</div>
    ${row('Тема', segment('theme', [['dark', 'Темна'], ['light', 'Світла'], ['auto', 'Авто']], draft.theme))}
    ${row('Шрифт', '<input type="text" id="font" list="fonts"><datalist id="fonts"><option>Segoe UI Variable Text</option><option>Segoe UI</option><option>Calibri</option><option>Georgia</option><option>Cambria</option><option>Cascadia Code</option><option>Consolas</option></datalist>')}
    ${row('Розмір тексту', numberInput('fontSize', 12, 24, draft.fontSize, 1))}
    <div class="grp">Поведінка</div>
    ${row('Гаряча клавіша', '<input type="text" id="hk" readonly>', 'клікни й натисни комбінацію')}
    ${row('Ховати при втраті фокуса', switcher('autoHide', draft.autoHide))}
    ${row('Запускати з Windows', switcher('autostart', draft.autostart))}
    ${row('Папка нотаток', '<button class="btn" id="pick">Змінити</button>', esc(draft.notesDir))}
    ${row('Програма', '<button class="btn" id="quit">Вийти</button>')}
  </div>
  <div class="foot"><span id="status"></span><button class="btn" id="cancel">Скасувати</button><button class="btn pri" id="save">Зберегти</button></div>`;
  $('#font').value = draft.font;
  $('#hk').value = draft.hotkey;
  updateFoot(message);
  emit('settings:rendered');
}

export function updateFoot(message) {
  $('#save').disabled = !isDirty();
  $('#cancel').disabled = !isDirty();
  $('#status').textContent = message ?? (isDirty() ? 'Є незбережені зміни' : '');
}

function setDraft(key, value) {
  if (key === 'edge') {
    if (value === 'floating') state.draft.mode = 'floating';
    else { state.draft.mode = 'docked'; state.draft.edge = value; }
  }
  else if (['w', 'h', 'full'].includes(key)) state.draft.dock[state.draft.edge][key] = value;
  else state.draft[key] = value;
  if (key === 'align') state.draft.dock[state.draft.edge].off = null;
  if (['theme', 'font', 'fontSize'].includes(key)) applyLook(state.draft);
  emit('settings:draft', key);
}

async function onClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.seg) {
    setDraft(button.dataset.seg, button.dataset.v);
    render();
  } else if (button.dataset.sw) {
    const key = button.dataset.sw;
    const value = key === 'full' ? state.draft.dock[state.draft.edge].full : state.draft[key];
    setDraft(key, !value);
    render();
  } else if (button.id === 'pick') {
    const folder = await api.pickFolder();
    if (folder) { setDraft('notesDir', folder); render(); }
  } else if (button.id === 'cancel') {
    state.draft = clone(state.S);
    applyLook(state.S);
    render();
  } else if (button.id === 'quit') api.quit();
  else if (button.id === 'save') await saveDraft();
}

function onInput(event) {
  const input = event.target;
  const key = input.dataset.r || input.dataset.n;
  if (!key) return;
  const value = +input.value;
  setDraft(key, value);
  const paired = $('#v-settings').querySelector(input.dataset.r
    ? `[data-n="${key}"]`
    : `[data-r="${key}"]`);
  if (paired) paired.value = value;
  updateFoot();
}

function onChange(event) {
  if (event.target.id !== 'font') return;
  setDraft('font', event.target.value.trim() || 'Segoe UI');
  updateFoot();
}

async function saveDraft() {
  const oldDirectory = state.S.notesDir;
  const result = await api.save(state.draft);
  state.S = result.settings;
  state.draft = clone(state.S);
  applyLook(state.S);
  const message = !result.ok
    ? 'Не вдалося записати файл: ' + result.error
    : !result.hotkeyOk
      ? 'Збережено, але ця комбінація зайнята'
      : 'Збережено ✓';
  emit('settings:saved', { oldDirectory, result });
  render(message);
}
