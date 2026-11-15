// The Sumps (Tag 5, Gebet 9: „Kanäle und Verliese zum Erkunden“). Unter Cinderford laufen die alten Abflüsse
// der Quarrymen: Der Bach der Furt verschwindet am Ostende im Fels, fließt hier durch einen langen Kanal und
// endet am Wehr, wo das Wasser in den Grey fällt. Stufe 40 bis 46: Drain Rats (nebenbei), Silt Crawler (normal)
// und The Undertow am Wehr (Boss, allein mit Einsatz). Dunkel (indoor); die Lampen-Nischen der Quarrymen sind
// Kohlebecken. Wer unterliegt, wacht in Cinderford auf.
import { TILES, HEIGHTS } from './sumps-terrain.js';
import { CINDER } from './maze.js';

// Wo man in Cinderford herauskommt: neben dem Gitter am Ostende der Furt.
export const SUMPS_EXIT = { x: 37, y: 13 };
export const SUMPS_START = { x: 7, y: 4 };

export const REGION = {
  id: 'sumps',
  name: 'THE SUMPS',
  zoneAt: () => 'THE SUMPS',
  place: 'UNDER CINDERFORD',
  indoor: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: SUMPS_START,
  deathTo: { region: 'cinderford', ...CINDER.respawn },
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'cinderford', tx: SUMPS_EXIT.x, ty: SUMPS_EXIT.y, x: 7, y: 2, name: 'the ladder up to Cinderford', look: 'ladder' },
    // Die Lampen-Nischen der Quarrymen: Sie zündeten hier unten Licht an „für die Lampe unter dem Hügel“.
    { type: 'brazier', x: 4, y: 5, light: 4, name: 'a lamp niche' },
    { type: 'brazier', x: 10, y: 5, light: 4, name: 'a lamp niche' },
    { type: 'brazier', x: 15, y: 9, light: 3, name: 'a lamp niche' },
    { type: 'brazier', x: 29, y: 9, light: 3, name: 'a lamp niche' },
    { type: 'brazier', x: 32, y: 15, light: 3.5, name: 'a lamp niche by the weir' },
    { type: 'brazier', x: 40, y: 15, light: 3.5, name: 'a lamp niche by the weir' },
    { type: 'table', x: 9, y: 3, name: 'the sluice-keepers\' slate', text: 'A slate bolted to the wall. Chalk marks: water levels, one per day, for years. The last three read 4, then 9, then 13, and the 13 is underlined twice. Under it, smaller: "Something in the weir. Not opening it again." Somebody has scratched a little dial next to the numbers.' },
    { type: 'chest', chest: 'sumps', x: 12, y: 20, name: 'a sluice-keeper\'s locker' },
    // Nachschlag: die Kiste der Schleusenwärter am Wehr, hinter The Undertow
    { type: 'chest', chest: 'sumps', x: 41, y: 26, name: 'the weir-keeper\'s chest' },
    // Die alte Nische mit dem Schieberad (Quest „The Drains“): der Griff liegt in der Zisterne
    { type: 'shrine', look: 'niche', x: 28, y: 14, name: 'the quarrymen\'s niche', gives: 'sluice_handle', quest: 'the_drains', step: 1, text: 'A deep niche cut into the cistern wall, black with old soot. Somebody carved a lamp over it, and under the lamp a line of words worn almost smooth.', found: 'Behind the soot, on a hook, hangs a heavy iron handle shaped like a spoked wheel. The words under the lamp read: "Light one for the lamp under the hill, and it will light one for you."', empty: 'Soot, a hook, and the carved lamp. The words read: "Light one for the lamp under the hill, and it will light one for you."' },
    // Tag 5, Nachschlag: Fundstellen für Sammelberufe (Salvage 38, Cartography 36, Foraging 36)
    { type: 'node', node: 'verdigris_pipe', x: 3, y: 14 },
    { type: 'node', node: 'verdigris_pipe', x: 41, y: 18 },
    { type: 'node', node: 'sluice_mark', x: 11, y: 7 },
    { type: 'node', node: 'sluice_mark', x: 16, y: 14 },
    { type: 'node', node: 'lampcap_cluster', x: 16, y: 23 },
    { type: 'node', node: 'lampcap_cluster', x: 31, y: 26 },
  ],
  npcs: [],
  mobs: [
    // Drain Rats im Rattennest (Westen) und im Kanal
    { type: 'drain_rat', x: 5, y: 15 },
    { type: 'drain_rat', x: 10, y: 16 },
    { type: 'drain_rat', x: 6, y: 19 },
    { type: 'drain_rat', x: 11, y: 21 },
    { type: 'drain_rat', x: 17, y: 10 },
    { type: 'drain_rat', x: 31, y: 12 },
    // Silt Crawler in der Zisterne und am Ostende des Kanals
    { type: 'silt_crawler', x: 18, y: 16 },
    { type: 'silt_crawler', x: 27, y: 17 },
    { type: 'silt_crawler', x: 18, y: 22 },
    { type: 'silt_crawler', x: 27, y: 22 },
    { type: 'silt_crawler', x: 38, y: 10 },
    // The Undertow am Wehr
    { type: 'the_undertow', x: 36, y: 22 },
  ],
};
