// Die Steinstraße (Tag 8): Feuer auf den Steinmännern. Regeln und Texte in content/road.js.
import { ROAD } from '../content/road.js';
import { tell, emit } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { oncePerDay } from './community.js';

// Nach „Light“ an einem Steinmann (signal mit stone). fresh = gerade eben angezündet (nicht schon vorher an).
export function stoneFire(world, p, t, fresh) {
  questEvent(world, p, 'action', { action: `stone_${t.stone}` });
  if (!fresh) return;
  tell(world, p.id, ROAD.lit(t.name), 'info');
  if (oncePerDay(world, p, `stone:${t.stone}:${world.date}`)) grantXp(world, p, ROAD.xp + ROAD.xpPerLevel * P.classLevel(p));
  const stones = world.objects.filter((o) => o.type === 'signal' && o.stone);
  if (stones.every((o) => o.lit)) emit(world, { type: 'log', text: ROAD.allLit, cls: 'good' });
}
