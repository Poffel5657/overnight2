// Malt Pixel-Icons aus content/icons.js einmal in ein kleines Bild und gibt es als <img> heraus.
import { SHAPES, PALETTES, ITEM_ICONS, ABILITY_ICONS } from '../content/icons.js';

const cache = new Map();

export function iconURL(kind, id) {
  const key = `${kind}:${id}`;
  if (cache.has(key)) return cache.get(key);
  const def = kind === 'item' ? ITEM_ICONS[id] : ABILITY_ICONS[id];
  const rows = def && SHAPES[def[0]];
  const pal = def && PALETTES[def[1]];
  let url = null;
  if (rows && pal) {
    const c = document.createElement('canvas');
    c.width = 12;
    c.height = 12;
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.' || !pal[ch]) return;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(x, y, 1, 1);
      });
    });
    url = c.toDataURL();
  }
  cache.set(key, url);
  return url;
}

// Icon als Bild; ohne Icon fällt es auf das alte Zeichen zurück.
export function iconEl(kind, id, fallback = '?', cls = 'icon') {
  const url = iconURL(kind, id);
  if (!url) {
    const s = document.createElement('span');
    s.className = 'glyph';
    s.textContent = fallback;
    return s;
  }
  const img = document.createElement('img');
  img.className = cls;
  img.src = url;
  img.alt = '';
  img.draggable = false;
  return img;
}
