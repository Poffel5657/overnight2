// Kindle, das Dorf am Leuchtfeuer, und die Wiesen von Fernmeadow drumherum.
// Koordinaten: x = Spalte, y = Reihe im Raster aus kindle-terrain.js.
import { TILES, HEIGHTS } from './kindle-terrain.js';

export const REGION = {
  id: 'kindle',
  name: 'KINDLE',
  tiles: TILES,
  heights: HEIGHTS,
  start: { x: 28, y: 31 },
  respawn: { x: 30, y: 36 },
  // Ab hier gilt man als "im Dorf": das Leuchtfeuer füllt die Laterne nicht automatisch,
  // aber hier verbrennt kein Öl.
  safeRadius: 10,
  objects: [
    { type: 'beacon', x: 27, y: 27, w: 2, d: 2, light: 11, name: 'the Beacon' },
    { type: 'chapel', x: 19, y: 16, w: 5, d: 6, name: 'the Chapel' },
    { type: 'house', x: 32, y: 16, w: 4, d: 4, roof: '#7a3b26' },
    { type: 'house', x: 35, y: 21, w: 3, d: 3, roof: '#6b4a2a' },
    { type: 'house', x: 17, y: 32, w: 3, d: 3, roof: '#5f4a3a' },
    { type: 'house', x: 33, y: 33, w: 3, d: 3, roof: '#7a3b26' },
    { type: 'workshop', x: 37, y: 29, w: 4, d: 3, name: 'the Workshop' },
    { type: 'stall', x: 16, y: 23, w: 3, d: 2, name: 'a market stall', awning: '#8a2f2f' },
    { type: 'stall', x: 16, y: 29, w: 3, d: 2, name: 'a market stall', awning: '#2f5a8a' },
    { type: 'campfire', x: 31, y: 37, light: 3.5, name: 'the Campfire' },
    { type: 'signal', x: 29, y: 3, light: 5, name: 'a signal fire' },
    { type: 'signal', x: 52, y: 29, light: 5, name: 'a signal fire' },
    { type: 'signal', x: 3, y: 26, light: 5, name: 'a signal fire' },
    { type: 'signal', x: 30, y: 51, light: 5, name: 'a signal fire' },
  ],
  npcs: [
    { id: 'ama', name: 'Warden Ama', sprite: 'ama', x: 26, y: 25 },
    { id: 'tallow', name: 'Brother Tallow', sprite: 'tallow', x: 24, y: 20 },
    { id: 'pell', name: 'Pell the Crier', sprite: 'pell', x: 23, y: 30 },
    { id: 'fen', name: 'Fen', sprite: 'fen', x: 31, y: 31, wander: 3 },
    { id: 'stranger', name: 'the Stranger', sprite: 'stranger', x: 34, y: 25 },
    { id: 'rook', name: 'Old Rook', sprite: 'rook', x: 36, y: 31 },
  ],
  mobs: [
    { type: 'greyling', x: 12, y: 8 },
    { type: 'greyling', x: 40, y: 7 },
    { type: 'greyling', x: 48, y: 40 },
    { type: 'greyling', x: 18, y: 45 },
    { type: 'greyling', x: 34, y: 49 },
    { type: 'greyling', x: 4, y: 40 },
    { type: 'greyling', x: 50, y: 17 },
    { type: 'crow', x: 37, y: 41 },
    { type: 'crow', x: 21, y: 39 },
    { type: 'crow', x: 44, y: 24 },
  ],
};
