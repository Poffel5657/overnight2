// Die Drowned Chapel: eine ältere Kapelle unter den Ruinen von Sinkmarsh. Dunkel (indoor), nur Kohlebecken
// halten Wesen fern. Im Kirchenschiff brennt das falsche Licht des Lamplighters.
import { TILES, HEIGHTS } from './drowned-chapel-terrain.js';

export const REGION = {
  id: 'drowned_chapel',
  name: 'DROWNED CHAPEL',
  indoor: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: { x: 18, y: 36 },
  // Wer hier unterliegt, wacht am Lagerfeuer in Kindle auf.
  deathTo: { region: 'kindle', x: 30, y: 36 },
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'kindle', tx: 26, ty: 50, x: 18, y: 38, name: 'the stairs up', look: 'stairs' },
    { type: 'brazier', x: 15, y: 31, light: 4, name: 'a brazier' },
    { type: 'brazier', x: 21, y: 31, light: 4, name: 'a brazier' },
    { type: 'brazier', x: 13, y: 14, light: 3.5, name: 'a brazier' },
    { type: 'brazier', x: 23, y: 14, light: 3.5, name: 'a brazier' },
    { type: 'false_light', x: 17, y: 3, w: 3, d: 1, light: 6, name: 'the False Light' },
  ],
  npcs: [],
  mobs: [
    { type: 'greyling', x: 8, y: 22 },
    { type: 'greyling', x: 28, y: 25 },
    { type: 'greyling', x: 18, y: 17 },
  ],
};
