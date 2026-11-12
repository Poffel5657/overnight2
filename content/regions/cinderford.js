// Cinderford (seit 2026-11-13, Gebet 4): die zweite Stadt. Sie liegt in einem alten Steinbruch unter dem Hügel
// am Ende des alten Wegs nach Westen, den der Grey jahrelang verschluckt hatte. Ein Leuchtfeuer hat sie nicht:
// Unter dem Fels kommt der Grey kaum hin, und die Laternen der Delver brennen Tag und Nacht. Unten im Steinbruch
// liegt der Eingang ins Unending Maze (content/regions/maze.js). Drinnen brennt kein Öl (sheltered).
import { TILES, HEIGHTS } from './cinderford-terrain.js';
import { ARRIVE } from './kindle.js';
import { CINDER, mazeStart } from './maze.js';

export const REGION = {
  id: 'cinderford',
  name: 'CINDERFORD',
  zoneAt: () => 'CINDERFORD',
  place: 'UNDER THE HILL',
  indoor: true,
  sheltered: true,
  tiles: TILES,
  heights: HEIGHTS,
  start: CINDER.arrive,
  respawn: CINDER.respawn,
  safeRadius: 0,
  objects: [
    { type: 'door', to: 'kindle', tx: ARRIVE.west.x, ty: ARRIVE.west.y, x: 21, y: 3, name: 'the steps up to the old road', look: 'stairs' },
    // Laternen am Platz
    { type: 'brazier', x: 15, y: 15, light: 5, name: 'a street lamp' },
    { type: 'brazier', x: 28, y: 15, light: 5, name: 'a street lamp' },
    { type: 'brazier', x: 15, y: 20, light: 5, name: 'a street lamp' },
    { type: 'brazier', x: 28, y: 20, light: 5, name: 'a street lamp' },
    { type: 'brazier', x: 20, y: 7, light: 4, name: 'a lamp by the steps' },
    { type: 'brazier', x: 24, y: 13, light: 4, name: 'a lamp at the ford' },
    { type: 'brazier', x: 9, y: 19, light: 4.5, name: 'a lamp by Ivy\'s door' },
    { type: 'brazier', x: 9, y: 12, light: 4, name: 'a street lamp' },
    { type: 'brazier', x: 33, y: 19, light: 4.5, name: 'a lamp by the stall' },
    { type: 'brazier', x: 33, y: 24, light: 4, name: 'a street lamp' },
    { type: 'brazier', x: 25, y: 25, light: 4, name: 'a street lamp' },
    { type: 'campfire', x: 24, y: 17, light: 4, name: 'the delvers\' hearth' },
    { type: 'stash', x: 17, y: 19, name: 'the delvers\' lockers', text: 'A row of iron lockers bolted to the quarry wall. Yours opens to the same things as your chest in Kindle. Hesk says not to ask.' },
    // Häuser der Delver
    { type: 'house', x: 5, y: 13, w: 3, d: 3, roof: '#4a3a30', name: 'a delver\'s house' },
    { type: 'house', x: 5, y: 20, w: 3, d: 3, roof: '#5f4a3a', name: 'Ivy\'s house' },
    { type: 'house', x: 36, y: 21, w: 3, d: 3, roof: '#4a3a30', name: 'a delver\'s house' },
    { type: 'table', x: 11, y: 15, name: 'Ivy\'s map table', text: 'A table covered in maps of the Maze, one for every morning. None of them agree. Ivy has written WRONG across most of them, in neat letters.' },
    // Hesk's Stand am Ostweg
    { type: 'stall', x: 34, y: 15, w: 3, d: 2, name: 'Hesk\'s Stall', awning: '#5a4a2a', light: 3, text: 'Rope, oil, chalk, cake, and a shelf of gear with prices in turnstones, not gold.' },
    { type: 'table', x: 25, y: 28, name: 'the Turn Board', text: 'A slab of slate covered in chalk: names, and how deep each delver got. The lowest marks are very small, as if whoever wrote them did not want to boast.' },
    // Der Eingang ins Labyrinth
    { type: 'door', to: 'maze_1', tx: mazeStart(1).x, ty: mazeStart(1).y, x: 21, y: 30, name: 'the Maze Mouth', look: 'stairs' },
    { type: 'brazier', x: 18, y: 29, light: 4, name: 'a lamp at the Maze Mouth' },
  ],
  npcs: [
    { id: 'sorrel', name: 'Delvemaster Sorrel', sprite: 'sorrel', x: 24, y: 29 },
    { id: 'hesk', name: 'Hesk', sprite: 'hesk', x: 35, y: 18 },
    { id: 'ivy', name: 'Old Ivy', sprite: 'ivy', x: 10, y: 17 },
  ],
  mobs: [],
};
