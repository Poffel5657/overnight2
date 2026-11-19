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
    // Nachschlag Tag 9 (aus Gebet 8, Zettel „chapel-riddle-room“): die Tür unter der Chortreppe öffnet nur, wer die
    // Antwort der drei Stimmen kennt (der Cantor fragt, Quest „The Choir Door“). Dahinter die Sakristei des Chors.
    { type: 'door', to: 'drowned_chapel', tx: 6, ty: 35, x: 6, y: 28, name: 'a low door under the choir stair', look: 'door', needs: { questAtLeast: { the_choir_door: 1 } }, locked: 'A low door with no handle and no keyhole, only a carved bell where the latch should be. It does not open for pushing. Above it, a stone face with an open mouth waits to hear something.' },
    { type: 'plaque', x: 4, y: 21, name: 'a hymn plaque with a bell', text: 'A slate plaque, half under water, with a bell carved in the corner. Under the bell: WHO HOLDS THE LAMP WHEN THE LAMP IS LOW? THE ONES WHO KNEEL.' },
    { type: 'plaque', x: 32, y: 19, name: 'a hymn plaque with a fish', text: 'A slate plaque green with weed, a fish carved in the corner. Under the fish: WHO HOLDS THE LAMP WHEN THE LAMP IS LOW? THE ONES WHO CARRY.' },
    { type: 'plaque', x: 14, y: 30, name: 'a hymn plaque with a lamp', text: 'A slate plaque by the stairs, dry, with a lamp carved in the corner: WHO HOLDS THE LAMP WHEN THE LAMP IS LOW? THE ONE WHO DOES NOT SLEEP.' },
    { type: 'plaque', x: 22, y: 30, name: 'the cantor\'s rule', text: 'Scratched into the wall by the stairs, small, the way a teacher writes for children: THE BELL SINGS LOW. THE FISH SWIMS BETWEEN. THE LAMP IS HELD ABOVE. NEVER OUT OF ORDER.' },
    // Die Sakristei hinter der Tür
    { type: 'door', to: 'drowned_chapel', tx: 8, ty: 27, x: 6, y: 36, name: 'the low door back to the aisle', look: 'door' },
    { type: 'brazier', x: 10, y: 34, light: 3.5, name: 'a choir candle-stand' },
    { type: 'chest', chest: 'choir_vault', x: 3, y: 31, name: 'the choir\'s strongbox' },
    { type: 'shrine', look: 'niche', x: 9, y: 31, name: 'a niche with a tuning fork', gives: 'fortieth_voice', quest: 'the_choir_door', step: 1, text: 'A niche in the wall, lined with lead. Something small lies on a folded cloth.', found: 'You lift the cloth. Under it, a tuning fork of dark brass. When you touch it, it hums, very softly, the note the whole chapel was built around.', empty: 'An empty niche lined with lead, and a folded cloth. Forty hooks on the wall above it, for forty robes. One hook has a name scratched over it, and the name has been scratched out.' },
  ],
  npcs: [
    // Nachschlag Tag 9: der Cantor, ein Steingesicht über der Tür unter der Chortreppe (fragt nach den drei Stimmen)
    { id: 'cantor', name: 'The Cantor', sprite: 'cantor', x: 7, y: 27 },
  ],
  mobs: [
    { type: 'drowned_pilgrim', x: 8, y: 22 },
    { type: 'drowned_pilgrim', x: 10, y: 26 },
    { type: 'drowned_pilgrim', x: 28, y: 22 },
    { type: 'drowned_pilgrim', x: 27, y: 26 },
    { type: 'drowned_pilgrim', x: 15, y: 17 },
    { type: 'drowned_pilgrim', x: 21, y: 17 },
    // Seit Tag 2: Choir Wraiths in den hinteren Ecken der Seitenschiffe
    { type: 'choir_wraith', x: 6, y: 27 },
    { type: 'choir_wraith', x: 30, y: 27 },
    { type: 'lamplighter', x: 18, y: 6 },
  ],
};
