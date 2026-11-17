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
  // Tag 6: unter der Zisterne liegt der Überlauf (the Spillway)
  // Tag 7: darunter der Overflow Run (Kanal und Pumpenkammer)
  zoneAt: (x, y) => (y >= 29 ? 'THE OVERFLOW RUN' : y >= 24 && x < 30 ? 'THE SPILLWAY' : 'THE SUMPS'),
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
    // Tag 6, Nachschlag: the Spillway (Stufe 46 bis 50) unter der Zisterne, Durchgang bei x 20/21, y 24
    { type: 'brazier', x: 7, y: 25, light: 3.5, name: 'a lamp niche in the Spillway' },
    { type: 'brazier', x: 26, y: 25, light: 3.5, name: 'a lamp niche in the Spillway' },
    { type: 'shrine', look: 'niche', x: 15, y: 25, name: 'the overflow-keepers\' slate', gives: 'spillway_slate', quest: 'below_the_weir', step: 1, text: 'A small slate hung on a nail over the overflow, where the water used to drop away into the dark.', found: 'You lift the slate off its nail. Chalk, in the same hand as the slate by the ladder: "Overflow runs north. Keep it running. They need it more than we do."', empty: 'An empty nail over the overflow. The water below runs away into the dark, north, by the sound of it.' },
    { type: 'chest', chest: 'sumps', x: 4, y: 28, name: 'an overflow-keeper\'s box' },
    // Tag 7, Nachschlag: the Overflow Run (Stufe 50 bis 54). Zwei Lampen-Nischen, die Kiste der Pumpenwärter und das Tor nach Norden.
    { type: 'brazier', x: 5, y: 30, light: 3.5, name: 'a lamp niche in the Overflow Run' },
    { type: 'brazier', x: 38, y: 33, light: 3.5, name: 'a lamp niche in the Overflow Run' },
    { type: 'chest', chest: 'sumps', x: 38, y: 39, name: 'the pump-keepers\' locker' },
    { type: 'shrine', look: 'niche', x: 38, y: 36, name: 'the north gate', gives: 'gate_rubbing', quest: 'overflow_runs_north', step: 2, text: 'An iron gate in the far wall of the pump chamber, where the culvert turns north and goes on into the dark. Rusted shut. Above it, a carved lamp, and letters cut deep: NORTH, TO THE HOLLOW. KEEP IT RUNNING.', found: 'You press a sheet of Hesk\'s chalk paper to the letters and rub. The words come up white: NORTH, TO THE HOLLOW. KEEP IT RUNNING.', empty: 'NORTH, TO THE HOLLOW. KEEP IT RUNNING. Behind the bars, very far off, water is still moving.' },
    { type: 'table', x: 25, y: 36, name: 'the pump-keepers\' slate', text: 'A slate on an iron bracket by the pump. Chalk columns: barrels pushed north, one line a day. Forty, forty, forty, for years. Then twenty. Then twelve. Then eight. The last line is not a number: "They have stopped asking. Keep it running anyway."' },
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
    // Tag 6, Nachschlag: Weir Eels im Spillway, am Westende das Old Sluicegate (ans Ende der Liste, damit alte Seeds stimmen)
    { type: 'weir_eel', x: 12, y: 26 },
    { type: 'weir_eel', x: 19, y: 28 },
    { type: 'weir_eel', x: 25, y: 26 },
    { type: 'old_sluicegate', x: 5, y: 27 },
    // Tag 7, Nachschlag: Culvert Leeches im Overflow Run, in der Pumpenkammer the Pumpwarden
    { type: 'culvert_leech', x: 14, y: 30 },
    { type: 'culvert_leech', x: 26, y: 31 },
    { type: 'culvert_leech', x: 12, y: 34 },
    { type: 'culvert_leech', x: 22, y: 33 },
    { type: 'culvert_leech', x: 31, y: 34 },
    { type: 'the_pumpwarden', x: 31, y: 38 },
  ],
};
