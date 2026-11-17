// Die Vorratskiste am ersten Stein (Tag 7): Brot und Öl für die Träger aus dem Norden. Regeln in content/cache.js.
import { CACHE } from '../content/cache.js';
import { ITEMS } from '../content/items.js';
import { tell, emit, float } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { oncePerDay } from './community.js';

// Legt alles, was die Kiste nimmt, auf einmal hinein. Gibt die Punkte zurück (0 = nichts dabei).
export function leaveAtCache(world, p) {
  const left = [];
  let points = 0;
  for (const [id, worth] of Object.entries(CACHE.accepts)) {
    const k = Math.min(P.countItem(p, id), CACHE.maxEach);
    if (k < 1) continue;
    P.takeItem(p, id, k);
    points += worth * k;
    left.push(`${k} ${ITEMS[id].name}`);
  }
  if (!points) {
    tell(world, p.id, CACHE.nothing, 'sys');
    return 0;
  }
  p.sentNorth = (p.sentNorth ?? 0) + points;
  tell(world, p.id, `You leave ${left.join(', ')} in the box under the first stone, and weight the lid down again.`, 'good');
  float(world, p.id, `+${points} for the road`, 'info', p.id);
  questEvent(world, p, 'action', { action: 'cache' });
  if (oncePerDay(world, p, `cache:${world.date}`)) {
    tell(world, p.id, CACHE.first, 'sys');
    emit(world, { type: 'log', text: CACHE.all, cls: 'info' });
    grantXp(world, p, CACHE.xp + CACHE.xpPerLevel * P.classLevel(p));
    // Antwort aus dem Norden (Tag 7): manchmal liegt etwas im Kasten, für wen schon länger Brot bringt
    const a = CACHE.answer;
    if (p.sentNorth >= CACHE.answerFrom && world.rand() < CACHE.answerChance && (!P.bagFull(p) || P.countItem(p, a.item))) {
      P.addItem(p, a.item, a.n);
      tell(world, p.id, a.text, 'good');
      questEvent(world, p, 'action', { action: 'cache_answer' });
    }
  }
  return points;
}
