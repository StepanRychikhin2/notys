// Передає renderer мінімальний API для IPC без доступу до Node.js.
const { contextBridge, ipcRenderer } = require('electron');
const inv = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('api', {
  getSettings: () => inv('settings:get'),
  save: draft => inv('settings:save', draft),
  list: () => inv('notes:list'),
  create: () => inv('notes:create'),
  write: (id, text) => inv('notes:write', id, text),
  remove: id => inv('notes:remove', id),
  pickFolder: () => inv('dialog:folder'),
  collapse: () => ipcRenderer.send('win:collapse'),
  expand: () => ipcRenderer.send('win:expand'),
  pin: value => ipcRenderer.send('win:pin', value),
  quit: () => ipcRenderer.send('win:quit'),
  resize: (x, y, part, phase = 'move') => ipcRenderer.send('win:resize', { x, y, part, phase }),
  resizeStart: (x, y, part) => ipcRenderer.send('win:resize', { x, y, part, phase: 'start' }),
  moveStart: (x, y) => ipcRenderer.send('win:move-start', { x, y }),
  move: (x, y) => ipcRenderer.send('win:move', { x, y }),
  moveEnd: () => ipcRenderer.send('win:move-end'),
  resizeEnd: () => ipcRenderer.send('win:resize-end'),
  on: (channel, callback) => ipcRenderer.on(channel, (_event, data) => callback(data))
});
