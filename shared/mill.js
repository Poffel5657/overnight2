// The Old Mill (Tag 5): Mahlen am Mühlstein. Regeln in content/mill.js. Jeder darf mahlen (kein Beruf).
import { MILL } from '../content/mill.js';
import { ITEMS } from '../content/items.js';
import { tell, float } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { oncePerDay } from './community.js';

export function grindAtMill(world, p) {
  const g = MILL.grinds.find((r) => P.hasAll(p, r.inputs));
  if (!g) return tell(world, p.id, MILL.nothing, 'sys');
  const [out, n] = g.out;
  if (P.bagFull(p) && !(ITEMS[out].stack && P.countItem(p, out))) return tell(world, p.id, 'Your bag is full.', 'hurt');
  for (const [id, k] of Object.entries(g.inputs)) P.takeItem(p, id, k);
  P.addItem(p, out, n);
  tell(world, p.id, g.text, 'good');
  float(world, p.id, `+${n} ${ITEMS[out].name}`, 'info', p.id);
  questEvent(world, p, 'action', { action: 'grind' });
  if (!oncePerDay(world, p, `mill:${world.date}`)) return;
  tell(world, p.id, MILL.first, 'sys');
  grantXp(world, p, MILL.xp + MILL.xpPerLevel * P.classLevel(p));
}
