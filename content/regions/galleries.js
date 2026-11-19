// The Glimmer Galleries (Tag 9, Nachschlag): Unter Copperdeep liegen die alten Glimmer-Stollen, aus denen jede Woche
// vierzig Kisten nach Norden gingen, „for the Hollow fire“ (Hauptbuch des Old Foreman). Der Eingang ist ein alter Schacht
// neben dem Old Shaft im Osten von Copperdeep (ab Stufe 52). Stufe 55 bis 60: Lode Crawler (normal, 55) in den oberen
// Stollen und an der Ladebucht, Lampless Miners (normal, 58) in den unteren. Dunkel (indoor); wer unterliegt, wacht in Kindle auf.
import { TILES, HEIGHTS } from './galleries-terrain.js';

// Wo man in Kindle herauskommt: neben dem Schacht im Osten von Copperdeep.
export const GALLERIES_EXIT = { x: 96, y: 28 };
export const GALLERIES_START = { x: 5, y: 4 };
const KINDLE_RESPAWN = { x: 52, y: 58 };

export const REGION = {
  id: 'galleries',
  name: 'THE GLIMMER GALLERIES',
  place: 'UNDER COPPERDEEP',
  zoneAt: (x, y) => (y >= 23 && x >= 25 ? 'THE LAST FACE' : x <= 13 && y >= 13 ? 'THE LOW GALLERY' : y >= 15 ? 'THE LOADING BAY' : 'THE GLIMMER GALLERIES'),
  indoor: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: GALLERIES_START,
  deathTo: { region: 'kindle', ...KINDLE_RESPAWN },
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'kindle', tx: GALLERIES_EXIT.x, ty: GALLERIES_EXIT.y, x: 5, y: 2, name: 'the ladder up to Copperdeep', look: 'ladder' },
    // Die alten Grubenlampen in Wandnischen: Kohlebecken, die man mit Öl wieder anzündet
    { type: 'brazier', x: 3, y: 5, light: 4, name: 'a miner\'s lamp niche' },
    { type: 'brazier', x: 19, y: 2, light: 3.5, name: 'a miner\'s lamp niche' },
    { type: 'brazier', x: 16, y: 16, light: 3.5, name: 'a lamp niche by the loading bay' },
    { type: 'brazier', x: 2, y: 14, light: 3.5, name: 'a lamp niche in the low gallery' },
    { type: 'brazier', x: 26, y: 28, light: 3.5, name: 'a lamp niche at the last face' },
    // Die Ladebucht: Kisten, ein Kerbbrett, die Nische mit dem Begleitzettel (Quest „Forty Crates“)
    { type: 'table', x: 18, y: 17, name: 'the loaders\' tally board', text: 'A board nailed to a prop, chalked in columns of five. One column per week, forty crates each, for years and years. At the bottom someone has written FOR THE HOLLOW FIRE so many times the chalk has worn a groove.' },
    { type: 'table', x: 30, y: 17, name: 'a stack of empty crates', text: 'Glimmer crates, iron-banded, each stamped with a lamp and an arrow pointing north. All empty. Somebody stacked them very neatly before they left, as if they expected to come back on Monday.' },
    { type: 'shrine', look: 'niche', x: 33, y: 21, name: 'the loaders\' niche', gives: 'hollow_tag', quest: 'forty_crates', step: 1, text: 'A niche in the wall of the loading bay, full of little wooden tags on strings.', found: 'You go through the tags. Most are blank. One, on top, has been filled in and never tied to a crate: forty, glimmer, for the Hollow fire, and a name you do not know, and a date that nobody in Kindle will remember.', empty: 'A niche full of blank wooden tags on strings, ready for crates that never came.' },
    { type: 'chest', chest: 'galleries', x: 35, y: 27, name: 'a miner\'s strongbox' },
    { type: 'plaque', x: 28, y: 25, name: 'a slate at the last face', text: 'A slate hung on a nail at the end of the gallery, where the last shift stopped digging. In chalk, in a big careful hand: LODE STILL GOOD. LAMPS LOW. GONE UP FOR OIL. BACK MONDAY. Under it, in a smaller hand, much later: nobody came back on monday, so we kept digging.' },
    // Fundstellen: Lode-Glimmer (Salvage 44)
    { type: 'node', node: 'deep_lode', x: 29, y: 3 },
    { type: 'node', node: 'deep_lode', x: 3, y: 26 },
    { type: 'node', node: 'deep_lode', x: 37, y: 25 },
  ],
  npcs: [],
  mobs: [
    { type: 'lode_crawler', x: 22, y: 8 },
    { type: 'lode_crawler', x: 28, y: 5 },
    { type: 'lode_crawler', x: 21, y: 4 },
    { type: 'lode_crawler', x: 25, y: 19 },
    { type: 'lode_crawler', x: 21, y: 21 },
    // Lampless Miners in der unteren Galerie und an der letzten Wand, weit genug auseinander, um sie einzeln zu holen
    { type: 'lampless_miner', x: 5, y: 16 },
    { type: 'lampless_miner', x: 10, y: 25 },
    { type: 'lampless_miner', x: 35, y: 26 },
  ],
};
