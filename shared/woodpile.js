// Ama's Woodpile (Tag 6): Totholz spalten und am Stapel neben dem Leuchtfeuer nachlegen. Regeln in content/woodpile.js.
// Jeder darf es, ohne Beruf. Gestapeltes Holz zählt für den Tageszähler des Leuchtfeuers (wie Füttern).
import { WOODPILE } from '../content/woodpile.js';
import { BEACON_FUEL, BEACON_GOAL } from '../content/dailies.js';
import { ITEMS } from '../content/items.js';
import { tell, emit, float } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { dailyOf } from './community.js';

// Totholz: einmal am Tag pro Stelle und Spieler (Schlüssel in dailyOf().chests, wie Truhen).
export function splitDeadfall(world, p, o) {
  const d = dailyOf(world, p);
  d.chests = d.chests || [];
  const key = `deadfall:${o.id}`;
  if (d.chests.includes(key)) return tell(world, p.id, WOODPILE.spent, 'sys');
  const log = WOODPILE.log;
  if (P.bagFull(p) && !P.countItem(p, log)) return tell(world, p.id, 'Your bag is full.', 'hurt');
  d.chests.push(key);
  P.addItem(p, log, WOODPILE.logs);
  tell(world, p.id, WOODPILE.split, 'good');
  float(world, p.id, `+${WOODPILE.logs} ${ITEMS[log].name}`, 'info', p.id);
  questEvent(world, p, 'action', { action: 'split' });
}

// Am Stapel: alle Scheite auf einmal. Zählt für das Leuchtfeuer (world.community.beacon, outbox 'beacon').
export function stackWoodpile(world, p) {
  const log = WOODPILE.log;
  const k = P.countItem(p, log);
  if (k < 1) return tell(world, p.id, WOODPILE.nothing, 'sys');
  P.takeItem(p, log, k);
  const add = BEACON_FUEL[log] * k;
  const before = world.community.beacon;
  world.community.beacon += add;
  world.outbox.push({ kind: 'beacon', date: world.date, add });
  tell(world, p.id, `You stack ${k} ${k === 1 ? 'log' : 'logs'} on Ama's woodpile. The Beacon will eat well tonight. (+${add})`, 'good');
  emit(world, { type: 'community', community: world.community });
  if (before < BEACON_GOAL && world.community.beacon >= BEACON_GOAL) {
    emit(world, { type: 'log', text: 'The woodpile is as high as Ama. The Beacon blazes, and the Grey steps back.', cls: 'good' });
  }
  questEvent(world, p, 'action', { action: 'stack' });
  const d = dailyOf(world, p);
  d.chests = d.chests || [];
  const key = `woodpile:${world.date}`;
  if (d.chests.includes(key)) return;
  d.chests.push(key);
  tell(world, p.id, WOODPILE.first, 'sys');
  grantXp(world, p, WOODPILE.xp + WOODPILE.xpPerLevel * P.classLevel(p));
}
