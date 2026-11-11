// Die Innenräume von Kindle: Kapelle (mit dem Altar), Old Rooks Werkstatt und vier Wohnhäuser.
// Alle Räume liegen in einem Gebiet. Man betritt sie über das Gebäude in Kindle ("Enter"),
// die Tür im Raum führt zurück vor dasselbe Gebäude. Drinnen brennt kein Öl (sheltered).
import { TILES, HEIGHTS } from './kindle-inside-terrain.js';

// Wo man draußen wieder herauskommt (vor der Tür des Gebäudes in Kindle)
export const OUTSIDE = {
  chapel: { x: 43, y: 44 },
  house1: { x: 55, y: 42 },
  house2: { x: 58, y: 46 },
  house3: { x: 40, y: 57 },
  house4: { x: 56, y: 58 },
  workshop: { x: 60, y: 54 },
};
// Wo man drinnen ankommt
export const INSIDE = {
  chapel: { x: 6, y: 15 },
  workshop: { x: 23, y: 6 },
  house1: { x: 36, y: 4 },
  house2: { x: 48, y: 4 },
  house3: { x: 36, y: 14 },
  house4: { x: 48, y: 14 },
};

const exit = (key, x, y) => ({ type: 'door', look: 'door', to: 'kindle', tx: OUTSIDE[key].x, ty: OUTSIDE[key].y, x, y, name: 'the door' });

// Name des Raums für die Statusanzeige
function zoneAt(x) {
  if (x <= 12) return 'THE CHAPEL';
  if (x <= 29) return 'ROOK\'S WORKSHOP';
  return 'A HOUSE IN KINDLE';
}

export const REGION = {
  id: 'kindle_inside',
  name: 'KINDLE',
  zoneAt,
  place: 'INDOORS',
  indoor: true,
  sheltered: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: INSIDE.chapel,
  respawn: INSIDE.chapel,
  safeRadius: 0,
  objects: [
    // Kapelle: Altar vorn, Kerzen, Bänke
    exit('chapel', 6, 16),
    { type: 'altar', x: 5, y: 2, w: 2, d: 1, name: 'the Altar' },
    { type: 'candles', x: 2, y: 1, light: 4, name: 'votive candles', text: 'Dozens of small candles. Every one is somebody\'s wish. Some are very small wishes.' },
    { type: 'candles', x: 9, y: 1, light: 4, name: 'votive candles', text: 'The wax has run into shapes. One of them looks like a lantern, if you squint.' },
    { type: 'pew', x: 2, y: 5, w: 3, name: 'a pew', text: 'A worn pew. The wood is polished by years of sitting and waiting.' },
    { type: 'pew', x: 7, y: 5, w: 3, name: 'a pew', text: 'Someone carved a tiny Beacon into the armrest.' },
    { type: 'pew', x: 2, y: 8, w: 3, name: 'a pew', text: 'A worn pew.' },
    { type: 'pew', x: 7, y: 8, w: 3, name: 'a pew', text: 'A worn pew. It creaks in a friendly way.' },
    { type: 'pew', x: 2, y: 11, w: 3, name: 'a pew', text: 'A worn pew.' },
    { type: 'pew', x: 7, y: 11, w: 3, name: 'a pew', text: 'A hymn sheet is wedged under the seat. Most of the words are "light".' },
    { type: 'candles', x: 1, y: 14, light: 3, name: 'candles', text: 'Candles by the door, for those who leave in the dark.' },
    { type: 'candles', x: 11, y: 14, light: 3, name: 'candles', text: 'Candles by the door, for those who leave in the dark.' },

    // Old Rooks Werkstatt
    exit('workshop', 23, 7),
    { type: 'hearth', x: 26, y: 1, light: 5, name: 'the forge', text: 'Rook\'s little forge. It is never quite out.' },
    { type: 'table', x: 20, y: 2, w: 2, name: 'a cluttered table', text: 'Half a hinge, a third of a clock and a whole lot of springs.' },
    { type: 'shelf', x: 19, y: 5, name: 'a shelf of parts', text: 'Jars of screws, sorted by a system only Rook understands.' },
    { type: 'barrel', x: 27, y: 5, name: 'a barrel', text: 'A barrel of scrap. It rattles when the wind blows.' },

    // Haus 1
    exit('house1', 36, 5),
    { type: 'hearth', x: 34, y: 1, light: 4.5, name: 'the hearth', text: 'A small fire. The kettle on it has seen better centuries.' },
    { type: 'bed', x: 38, y: 1, w: 2, name: 'a bed', text: 'A narrow bed under a patchwork quilt.' },
    { type: 'table', x: 38, y: 4, name: 'a table', text: 'Two bowls, one spoon. Someone is in a hurry.' },
    // Haus 2
    exit('house2', 48, 5),
    { type: 'hearth', x: 51, y: 1, light: 4.5, name: 'the hearth', text: 'The hearth crackles. A sock is drying on the grate.' },
    { type: 'bed', x: 46, y: 1, w: 2, name: 'a bed', text: 'Neatly made. Suspiciously neatly.' },
    { type: 'shelf', x: 50, y: 4, name: 'a shelf', text: 'Jars of preserved bitterleaf and one jar of something that moves.' },
    // Haus 3
    exit('house3', 36, 15),
    { type: 'hearth', x: 34, y: 11, light: 4.5, name: 'the hearth', text: 'The fire is low. Someone sleeps late here.' },
    { type: 'bed', x: 38, y: 11, w: 2, name: 'a bed', text: 'Unmade. A map of the Grey is pinned above it, full of crosses.' },
    { type: 'barrel', x: 39, y: 14, name: 'a rain barrel', text: 'Rainwater. It tastes faintly of smoke.' },
    // Haus 4
    exit('house4', 48, 15),
    { type: 'hearth', x: 51, y: 11, light: 4.5, name: 'the hearth', text: 'A warm hearth and a cat-shaped dent in the rug.' },
    { type: 'bed', x: 46, y: 11, w: 2, name: 'a bed', text: 'A bed with far too many pillows.' },
    { type: 'table', x: 50, y: 14, name: 'a table', text: 'A half-finished letter: "Dear Mother, the fog is fine, the people are fine, I am fine..."' },
  ],
  npcs: [],
  mobs: [],
};
