// Legende der Geländezeichen. color = Grundfarbe (Vertex-Farbe), walk = begehbar,
// object = auf diesem Feld steht automatisch ein Objekt (siehe content/objects.js).
export const TILE_TYPES = {
  '.': { name: 'grass', color: '#5b8a3a', walk: true },
  ',': { name: 'dark grass', color: '#46702c', walk: true },
  '"': { name: 'meadow', color: '#79a043', walk: true },
  '=': { name: 'path', color: '#8f6d42', walk: true },
  '_': { name: 'square', color: '#8a8174', walk: true },
  '~': { name: 'water', color: '#2a5672', walk: false, water: true },
  '%': { name: 'marsh', color: '#5a5c32', walk: true },
  'T': { name: 'grass', color: '#46702c', walk: false, object: 'tree' },
  'r': { name: 'grass', color: '#5b8a3a', walk: false, object: 'rock' },
};

// Höhenzeichen: a = -1, b = 0 … j = 8 (in halben Einheiten).
export const HEIGHT_STEP = 0.5;
export function heightFromChar(ch) {
  const i = 'abcdefghij'.indexOf(ch);
  return (i < 0 ? 1 : i - 1) * HEIGHT_STEP;
}
