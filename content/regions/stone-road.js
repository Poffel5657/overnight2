// The Stone Road (Tag 8, Abstimmung „north-road-fires“): Hinter der Kiste am ersten Stein geht die alte Nordstraße
// weiter, nach Norden durch den Grey, Steinmann für Steinmann. Auf sechs Steinmännern stehen Feuerschalen (Signalfeuer,
// je 15 Öl, brennen für alle, bis die Welt sich nachts erneuert; Quest-Aktion stone_<n>). Stufe 26 bis 34:
// Cairn Creeper (normal, 27), Ash Moth (normal, 30), oben am Rastplatz der Träger die Hollow Wardens (Gruppe, 34).
// Draußen, aber im Nebel (murk): Es wird nie ganz hell. Wer unterliegt, wacht in Kindle auf.
import { TILES, HEIGHTS } from './stone-road-terrain.js';

// Wo man ankommt (unten auf der Lichtung) und wo man in Kindle herauskommt (neben dem Durchgang hinter dem ersten Stein).
export const ROAD_START = { x: 22, y: 56 };
export const ROAD_EXIT = { x: 52, y: 3 };
// Respawn in Kindle (wie ARRIVE.respawn in kindle.js; hier als Zahl, damit es keinen Kreis-Import gibt)
const KINDLE_RESPAWN = { x: 52, y: 58 };

export const REGION = {
  id: 'stone_road',
  name: 'THE STONE ROAD',
  place: 'NORTH OF HUSHWOOD',
  zoneAt: (x, y) => (y <= 11 ? 'THE CARRIERS\' REST' : y <= 17 ? 'THE COLD FORD' : 'THE STONE ROAD'),
  // Im Nebel wird es nie ganz hell (wie im Drift, nur weniger dicht).
  murk: 0.45,
  tiles: TILES,
  heights: HEIGHTS,
  start: ROAD_START,
  deathTo: { region: 'kindle', ...KINDLE_RESPAWN },
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'kindle', tx: ROAD_EXIT.x, ty: ROAD_EXIT.y, x: 24, y: 58, name: 'the road back down to the first stone', look: 'cairns' },
    // Die Steinmänner mit Feuerschalen. Der erste Stein ist der mit der Kiste in Kindle.
    { type: 'signal', look: 'cairn', stone: 2, x: 21, y: 50, light: 5, name: 'the second stone' },
    { type: 'signal', look: 'cairn', stone: 3, x: 18, y: 42, light: 5, name: 'the third stone' },
    { type: 'signal', look: 'cairn', stone: 4, x: 12, y: 34, light: 5, name: 'the fourth stone' },
    { type: 'signal', look: 'cairn', stone: 5, x: 20, y: 26, light: 5, name: 'the fifth stone' },
    { type: 'signal', look: 'cairn', stone: 6, x: 23, y: 19, light: 5, name: 'the sixth stone' },
    { type: 'signal', look: 'cairn', stone: 7, x: 24, y: 13, light: 5, name: 'the seventh stone' },
    // Torfstiche und Totholz am Weg
    { type: 'node', node: 'peat_cut', x: 7, y: 19 },
    { type: 'node', node: 'peat_cut', x: 26, y: 36 },
    { type: 'node', node: 'peat_cut', x: 9, y: 46 },
    // Nachschlag: Kerben der Träger im Fels (Cartography 34)
    { type: 'node', node: 'carrier_notch', x: 23, y: 44 },
    { type: 'node', node: 'carrier_notch', x: 15, y: 24 },
    { type: 'deadfall', x: 14, y: 47, name: 'deadfall', text: 'A birch the Grey pushed over, grey as the fog. Dry right through.' },
    { type: 'deadfall', x: 25, y: 31, name: 'deadfall', text: 'A pine across the ditch beside the road. Somebody has already taken the top half, neatly.' },
    // Der Rastplatz der Träger oben auf der Lichtung
    { type: 'campfire', x: 14, y: 6, light: 3.5, name: 'the carriers\' hearth', text: 'A ring of flat stones round a bed of peat ash, still warm underneath. Somebody kept a fire here very recently, small and careful.' },
    { type: 'house', x: 9, y: 3, w: 3, d: 2, roof: '#4a3a2a', name: 'the carriers\' lean-to', text: 'A lean-to of poles and birch bark against the wind from the north. Inside: dry bracken, a folded blanket, and nobody.' },
    { type: 'peg_board', x: 17, y: 3, name: 'the peg board', text: 'A board on two posts with rows of wooden pegs, a name burnt into each. Most pegs are empty. On the ones that are not hang little strings of green beads. Somebody has carved at the top: TAKE YOUR PEG WHEN YOU GO NORTH. LEAVE IT WHEN YOU GO SOUTH.' },
    { type: 'shrine', look: 'log_stack', x: 18, y: 7, name: 'a stack of logs', gives: 'chalked_log', quest: 'not_thieves', step: 1, text: 'A stack of split logs at the edge of the clearing, bark up, the way Ama stacks them. Too neat for the Grey.', found: 'You pull a log off the stack and turn it over. On the end, in white chalk, a single tally line. Ama\'s chalk. Ama\'s line.', empty: 'Kindle wood, bark up, stacked by somebody who knew how. Most of it has Ama\'s chalk on the end.' },
    { type: 'chest', chest: 'carriers_box', x: 26, y: 7, name: 'a carrier\'s box' },
    { type: 'fallen_stone', x: 17, y: 2, name: 'the eighth stone', text: 'The eighth stone has fallen over, and the road goes on past it into the Grey, thicker here than anywhere you have been. Somebody has set the top stone back on the pile so that it still points north.' },
  ],
  npcs: [],
  mobs: [
    // Cairn Creeper zwischen dem zweiten und dem vierten Stein
    { type: 'cairn_creeper', x: 14, y: 51 },
    { type: 'cairn_creeper', x: 25, y: 47 },
    { type: 'cairn_creeper', x: 11, y: 43 },
    { type: 'cairn_creeper', x: 21, y: 38 },
    { type: 'cairn_creeper', x: 7, y: 37 },
    // Ash Moths zwischen dem vierten Stein und der Furt
    { type: 'ash_moth', x: 8, y: 31 },
    { type: 'ash_moth', x: 24, y: 29 },
    { type: 'ash_moth', x: 14, y: 27 },
    { type: 'ash_moth', x: 27, y: 22 },
    { type: 'ash_moth', x: 11, y: 20 },
    // Die Hollow Wardens am Rastplatz der Träger
    // weit genug auseinander, dass eine Gruppe einen nach dem anderen holen kann
    { type: 'hollow_warden', x: 17, y: 5 },
    { type: 'hollow_warden', x: 14, y: 3 },
    { type: 'hollow_warden', x: 8, y: 9 },
    // Nachschlag Tag 8: the Grey Heron am Bachufer unterhalb der Furt, weit weg von der Straße (ans Ende der Liste)
    { type: 'the_grey_heron', x: 6, y: 17 },
  ],
};
