// Містить спільні селектори, копіювання та форматування нотаток.
export const $ = selector => document.querySelector(selector);
export const clone = value => JSON.parse(JSON.stringify(value));
export const esc = text => String(text).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
export const titleOf = text =>
  (text.split('\n').find(line => line.trim()) || 'Нова нотатка')
    .replace(/^#+\s*/, '').slice(0, 70);
export const previewOf = text =>
  (text.split('\n').filter(line => line.trim())[1] || '').slice(0, 90);
export const dateOf = ms => new Date(ms).toLocaleDateString('uk-UA', {
  day: 'numeric', month: 'short'
});
