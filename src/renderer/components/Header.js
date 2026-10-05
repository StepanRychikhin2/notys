// Керує кнопками шапки, її заголовком та активним станом піктограм.
import { state } from '../state.js';
import { $, titleOf } from '../utils.js';
import { ico } from '../icons.js';

export function init(actions) {
  for (const [id, icon] of [['b-list', 'list'], ['b-new', 'plus'], ['b-pin', 'pin'], ['b-set', 'gear']]) {
    $('#' + id).innerHTML = ico(icon);
  }
  $('#b-list').onclick = actions.toggleList;
  $('#b-new').onclick = actions.newNote;
  $('#b-set').onclick = actions.toggleSettings;
  $('#b-fold').onclick = () => api.collapse();
  $('#b-pin').onclick = actions.togglePin;
  let down = false;
  let moving = false;
  let startX = 0;
  let startY = 0;
  rootHeader().onpointerdown = event => {
    if (event.target.closest('button')) return;
    down = true;
    startX = event.screenX;
    startY = event.screenY;
    rootHeader().setPointerCapture(event.pointerId);
  };
  rootHeader().onpointermove = event => {
    if (!down) return;
    if (!moving) {
      if (Math.hypot(event.screenX - startX, event.screenY - startY) < 4) return;
      moving = true;
      api.moveStart(startX, startY);
      document.body.classList.add('header-dragging');
      document.body.classList.add('floating');
    }
    api.move(event.screenX, event.screenY);
  };
  const endMove = () => {
    if (moving) {
      api.moveEnd();
      document.body.classList.remove('header-dragging');
      document.body.classList.remove('floating');
    }
    down = false;
    moving = false;
  };
  rootHeader().onpointerup = endMove;
  rootHeader().onpointercancel = endMove;
}

function rootHeader() { return $('header'); }

export function render() {
  const { view, S, cur, pinned } = state;
  $('#title').textContent = view === 'list'
    ? 'Нотатки'
    : view === 'settings'
      ? 'Налаштування'
      : titleOf($('#ed').value);
  $('#b-set').classList.toggle('on', view === 'settings');
  $('#b-pin').classList.toggle('on', pinned);
  if (S) $('#b-fold').innerHTML = ico(S.edge === 'top' ? 'up' : S.edge);
  if (cur === null && view === 'editor') $('#title').textContent = titleOf('');
}
