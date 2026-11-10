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
  // Innenräume und Ruinen
  'f': { name: 'flagstone', color: '#6a6660', walk: true },
  'F': { name: 'mossy flagstone', color: '#56604e', walk: true },
  'w': { name: 'shallow water', color: '#2f5a5a', walk: true },
  '#': { name: 'wall', color: '#4a4844', walk: false, object: 'wall' },
  // Hügel und Mine
  's': { name: 'stone', color: '#7a7268', walk: true },
  'g': { name: 'gravel', color: '#8a7a62', walk: true },
  // Sumpf
  'm': { name: 'mud', color: '#4a4a2a', walk: true },
  // Der Drift: Grund im Nebel
  'd': { name: 'drift ground', color: '#5a5c60', walk: true },
  'x': { name: 'the Grey', color: '#2a2c30', walk: false },
};

// Höhenzeichen: a = -1, b = 0 … j = 8 (in halben Einheiten).
export const HEIGHT_STEP = 0.5;
export function heightFromChar(ch) {
  const i = 'abcdefghij'.indexOf(ch);
  return (i < 0 ? 1 : i - 1) * HEIGHT_STEP;
}
