// Die Innenräume von Kindle: Kapelle (mit dem Altar), Old Rooks Werkstatt, drei Wohnhäuser und die
// Taverne „The Lantern & Lark“ (Gastwirt Hollis, die Band, Truhen und Betten; Regeln in content/tavern.js).
// Alle Räume liegen in einem Gebiet. Man betritt sie über das Gebäude in Kindle ("Enter"),
// die Tür im Raum führt zurück vor dasselbe Gebäude. Drinnen brennt kein Öl (sheltered).
import { TILES, HEIGHTS } from './kindle-inside-terrain.js';

// Wo man draußen wieder herauskommt (vor der Tür des Gebäudes in Kindle)
export const OUTSIDE = {
  chapel: { x: 43, y: 44 },
  house1: { x: 55, y: 42 },
  house3: { x: 40, y: 57 },
  house4: { x: 56, y: 58 },
  workshop: { x: 60, y: 54 },
  tavern: { x: 62, y: 42 },
};
// Wo man drinnen ankommt
export const INSIDE = {
  chapel: { x: 6, y: 15 },
  workshop: { x: 23, y: 6 },
  house1: { x: 36, y: 4 },
  house3: { x: 36, y: 14 },
  house4: { x: 48, y: 14 },
  tavern: { x: 28, y: 29 },
};

const exit = (key, x, y) => ({ type: 'door', look: 'door', to: 'kindle', tx: OUTSIDE[key].x, ty: OUTSIDE[key].y, x, y, name: 'the door' });

// Name des Raums für die Statusanzeige
function zoneAt(x, y) {
  if (y >= 18) return 'THE LANTERN & LARK';
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

    // Taverne „The Lantern & Lark“: Tresen oben links, Bühne links, Tische in der Mitte,
    // Truhen an der rechten Wand, Betten hinter dem Vorhang rechts unten.
    exit('tavern', 28, 30),
    { type: 'table', x: 18, y: 21, w: 5, name: 'the bar', text: 'A long bar, sticky in a comforting way. Hollis polishes it whether it needs it or not.' },
    { type: 'shelf', x: 17, y: 20, name: 'a shelf of bottles', text: 'Bottles of every colour. Most are ale. One is labelled "DO NOT".' },
    { type: 'barrel', x: 24, y: 20, name: 'an ale barrel', text: 'Ember Ale. The barrel is warm to the touch.' },
    { type: 'barrel', x: 25, y: 20, name: 'an ale barrel', text: 'This one says "STEW" in chalk. Nobody asks.' },
    { type: 'hearth', x: 37, y: 20, light: 8, name: 'the tavern hearth', text: 'A big, roaring hearth. Wet cloaks steam in front of it.' },
    { type: 'candles', x: 16, y: 23, light: 6, name: 'stage candles', text: 'Candles along the edge of a tiny stage. The band keeps knocking them over.' },
    { type: 'table', x: 27, y: 23, w: 2, name: 'a table', text: 'Carved into the wood: "Bramble was robbed".' },
    { type: 'table', x: 32, y: 23, w: 2, name: 'a table', text: 'Someone has left half a game of cards. The other half has left too.' },
    { type: 'table', x: 27, y: 26, w: 2, name: 'a table', text: 'A ring of mug stains, like a little map of evenings.' },
    { type: 'candles', x: 32, y: 26, light: 5, name: 'a candle on a table', text: 'A fat candle in a bottle. It has been burning since before you got here.' },
    { type: 'candles', x: 24, y: 22, light: 6, name: 'candles on the bar', text: 'A row of stubby candles at the end of the bar, so Hollis can see who is ordering.' },
    { type: 'candles', x: 29, y: 21, light: 5, name: 'a hanging lantern', text: 'A lantern on a hook in the beam. Moths have opinions about it.' },
    { type: 'candles', x: 39, y: 27, light: 4.5, name: 'a lantern by the chests', text: 'A lantern by the chests, so nobody takes the wrong thing. Nobody can. Hollis lights it anyway.' },
    { type: 'stash', x: 40, y: 22, name: 'your chest', text: 'An iron-bound chest with your name chalked on the lid. Hollis keeps one for every regular.' },
    { type: 'stash', x: 40, y: 25, name: 'your chest', text: 'An iron-bound chest. Every one of them opens to your own things. Hollis says not to think about it.' },
    { type: 'inn_bed', x: 34, y: 29, w: 2, name: 'a rented bed', text: 'A real bed, with real blankets, behind a curtain. It smells of soap and woodsmoke.' },
    { type: 'inn_bed', x: 37, y: 29, w: 2, name: 'a rented bed', text: 'A bed behind a patched curtain. The band is still faintly audible. That is part of the charm.' },
  ],
  npcs: [
    { id: 'hollis', name: 'Hollis the Innkeeper', sprite: 'hollis', x: 20, y: 20 },
    { id: 'band_corra', name: 'Corra the Fiddler', sprite: 'band_corra', x: 16, y: 25 },
    { id: 'band_oswin', name: 'Oswin the Drummer', sprite: 'band_oswin', x: 17, y: 28 },
    { id: 'band_pip', name: 'Pip the Piper', sprite: 'band_pip', x: 19, y: 24 },
  ],
  mobs: [],
};
