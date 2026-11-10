// Die Drowned Chapel: eine ältere Kapelle unter den Ruinen von Sinkmarsh. Dunkel (indoor), nur Kohlebecken
// halten Wesen fern. Im Kirchenschiff brennt das falsche Licht des Lamplighters.
import { TILES, HEIGHTS } from './drowned-chapel-terrain.js';
import { ARRIVE } from './kindle.js';

export const REGION = {
  id: 'drowned_chapel',
  name: 'DROWNED CHAPEL',
  indoor: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: { x: 18, y: 36 },
  // Wer hier unterliegt, wacht am Lagerfeuer in Kindle auf.
  deathTo: { region: 'kindle', ...ARRIVE.respawn },
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'kindle', tx: ARRIVE.stairs.x, ty: ARRIVE.stairs.y, x: 18, y: 38, name: 'the stairs up', look: 'stairs' },
    { type: 'brazier', x: 15, y: 31, light: 4, name: 'a brazier' },
    { type: 'brazier', x: 21, y: 31, light: 4, name: 'a brazier' },
    { type: 'brazier', x: 13, y: 14, light: 3.5, name: 'a brazier' },
    { type: 'brazier', x: 23, y: 14, light: 3.5, name: 'a brazier' },
    { type: 'chest', chest: 'chapel', x: 5, y: 20, name: 'a drowned chest' },
    { type: 'chest', chest: 'chapel', x: 31, y: 20, name: 'a drowned chest' },
    { type: 'false_light', x: 17, y: 3, w: 3, d: 1, light: 6, name: 'the False Light' },
    // Kohlebecken im Kirchenschiff: Der Lamplighter löscht sie in Phase 2, man zündet sie wieder an.
    { type: 'brazier', x: 9, y: 7, light: 4, name: 'a nave brazier' },
    { type: 'brazier', x: 27, y: 7, light: 4, name: 'a nave brazier' },
    { type: 'brazier', x: 13, y: 11, light: 4, name: 'a nave brazier' },
    { type: 'brazier', x: 23, y: 11, light: 4, name: 'a nave brazier' },
  ],
  npcs: [],
  mobs: [
    { type: 'drowned_pilgrim', x: 8, y: 22 },
    { type: 'drowned_pilgrim', x: 10, y: 26 },
    { type: 'drowned_pilgrim', x: 28, y: 22 },
    { type: 'drowned_pilgrim', x: 27, y: 26 },
    { type: 'drowned_pilgrim', x: 15, y: 17 },
    { type: 'drowned_pilgrim', x: 21, y: 17 },
    { type: 'lamplighter', x: 18, y: 6 },
  ],
};
