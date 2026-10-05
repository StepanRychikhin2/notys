// Зберігає SVG-іконки та створює розмітку піктограм.
export const ICON = {
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M12 17v5M8 3h8l-1.5 6.5L18 13v2H6v-2l3.5-3.5z"/>',
  gear: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  trash: '<path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3"/>'
};

export const ico = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
