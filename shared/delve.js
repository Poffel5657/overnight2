// The Unending Maze (seit 2026-11-13): Was passiert, wenn ein Keeper fällt. Jeder, der Erfahrung für den Sieg
// bekommt (Mitkämpfer und Gruppe in der Nähe), darf danach die Treppe zum nächsten Stockwerk nehmen (p.mazeDeep).
// Delvemaster Sorrel in Cinderford lässt einen später an jedem fünften erreichten Stockwerk wieder einsteigen.
// Karten und Wesen stehen in content/regions/maze.js.

import { tell } from './events.js';
import { questEvent } from './talk.js';
import { MAZE_FLOORS } from '../content/regions/maze.js';

// Quest-Aktionen: keeper (irgendein Keeper), keeper_5 / keeper_10 / … (ein Keeper mindestens so tief).
export const KEEPER_MILESTONES = [5, 10, 20];

export function keeperFell(world, p, floor) {
  const next = Math.min(MAZE_FLOORS, floor + 1);
  if (floor < MAZE_FLOORS && (p.mazeDeep ?? 1) < next) {
    p.mazeDeep = next;
    tell(world, p.id, `The stairs down to turn ${next} will open for you now.`, 'good');
    if (next % 5 === 1 && next > 1) tell(world, p.id, `Delvemaster Sorrel can send you straight down to turn ${next} from now on.`, 'good');
  } else if (floor >= MAZE_FLOORS) {
    tell(world, p.id, 'There are no more stairs. For now.', 'good');
  }
  questEvent(world, p, 'action', { action: 'keeper' });
  for (const m of KEEPER_MILESTONES) if (floor >= m) questEvent(world, p, 'action', { action: `keeper_${m}` });
}

