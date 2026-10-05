// Ініціалізує компоненти, пов’язує дії та обробляє події main-процесу.
import { state, emit, subscribe } from './state.js';
import { $, clone } from './utils.js';
import { applyLook, applyEdge } from './theme.js';
import * as Header from './components/Header.js';
import * as NoteEditor from './components/NoteEditor.js';
import * as NoteList from './components/NoteList.js';
import * as SettingsPanel from './components/SettingsPanel.js';
import * as HotkeyInput from './components/HotkeyInput.js';
import * as ResizeGrip from './components/ResizeGrip.js';
import * as Handle from './components/Handle.js';

function show(view) {
  state.view = view;
  for (const name of ['editor', 'list', 'settings']) {
    $('#v-' + name).classList.toggle('show', name === view);
  }
  Header.render();
  if (view === 'list') { NoteList.render({ open: openNote, remove: removeNote }); $('#q').focus(); }
  if (view === 'settings') { SettingsPanel.render(); $('#b-set').classList.add('on'); }
  if (view === 'editor') { NoteEditor.render(); NoteEditor.focus(); }
}

async function openNote(id) {
  await NoteEditor.flush();
  state.cur = id;
  show('editor');
}
async function newNote() {
  await NoteEditor.flush();
  const id = await api.create();
  state.notes.unshift({ id, text: '', mtime: Date.now() });
  await openNote(id);
}
async function openLatest() {
  if (state.notes.length) await openNote(state.notes[0].id);
  else await newNote();
}
async function removeNote(id) {
  await NoteEditor.flush();
  await api.remove(id);
  state.notes = state.notes.filter(note => note.id !== id);
  if (state.cur === id) { state.cur = null; $('#ed').value = ''; }
  NoteList.render({ open: openNote, remove: removeNote });
  Header.render();
}
function togglePin() {
  state.pinned = !state.pinned;
  $('#b-pin').classList.toggle('on', state.pinned);
  api.pin(state.pinned);
}

Header.init({
  toggleList: () => show(state.view === 'list' ? 'editor' : 'list'),
  newNote,
  toggleSettings: () => show(state.view === 'settings' ? 'editor' : 'settings'),
  togglePin
});
NoteEditor.init();
NoteList.init({ open: openNote, remove: removeNote });
SettingsPanel.init();
HotkeyInput.init();
ResizeGrip.init();
Handle.init();

subscribe((type, value) => {
  if (type === 'settings:saved' && value.oldDirectory !== state.S.notesDir) {
    api.list().then(notes => {
      state.notes = notes;
      state.cur = null;
      $('#ed').value = '';
      NoteEditor.updateMeta(true);
    });
  }
});

api.on('state', message => {
  if (message.mode) document.body.classList.toggle('floating', message.mode === 'floating');
  if (message.open) {
    Handle.hide();
    document.body.classList.remove('open');
    void $('#panel').offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('open')));
  } else document.body.classList.remove('open');
});
api.on('handle', Handle.show);
api.on('mode', mode => {
  if (!document.body.classList.contains('header-dragging'))
    document.body.classList.toggle('floating', mode === 'floating');
  if (mode === 'floating') Handle.hide();
});
api.on('magnet', active => document.body.classList.toggle('magnet', active));
api.on('flush', NoteEditor.flush);
api.on('focus-editor', () => {
  if (state.view === 'editor') NoteEditor.focus();
  else if (state.view === 'list') $('#q').focus();
});
api.on('settings', settings => {
  state.S = settings;
  if (JSON.stringify(state.draft) === JSON.stringify(state.S)) state.draft = clone(settings);
  else state.draft.dock = clone(settings.dock);
  applyEdge(settings);
  document.body.classList.toggle('floating', settings.mode === 'floating');
  if (state.view === 'settings') SettingsPanel.render();
});

addEventListener('keydown', event => {
  if (event.key === 'Escape') state.view === 'editor' ? api.collapse() : show('editor');
  if (event.ctrlKey && event.key.toLowerCase() === 'n') { event.preventDefault(); newNote(); }
  if (event.ctrlKey && event.key.toLowerCase() === 'f') { event.preventDefault(); show('list'); }
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.S) applyLook(state.draft || state.S);
});

(async () => {
  state.S = await api.getSettings();
  state.draft = clone(state.S);
  state.notes = await api.list();
  applyLook(state.S);
  applyEdge(state.S);
  await openLatest();
})();
