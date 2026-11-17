// Ama's Woodpile (Tag 6): Totholz spalten und am Stapel neben dem Leuchtfeuer nachlegen. Regeln in content/woodpile.js.
// Jeder darf es, ohne Beruf. Gestapeltes Holz zählt für den Tageszähler des Leuchtfeuers (wie Füttern).
import { WOODPILE } from '../content/woodpile.js';
import { BEACON_FUEL } from '../content/dailies.js';
import { ITEMS } from '../content/items.js';
import { tell, float } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { dailyOf, oncePerDay, addBeaconFuel } from './community.js';

// Totholz: einmal am Tag pro Stelle und Spieler (Schlüssel in dailyOf().chests, wie Truhen).
export function splitDeadfall(world, p, o) {
  // Schlüssel mit Gebiet (Tag 7): Objekt-IDs sind Listenplätze und wiederholen sich in anderen Gebieten
  const key = `deadfall:${world.region.id}:${o.id}`;
  if (dailyOf(world, p).chests.includes(key)) {
    // Schon gespalten: zählt trotzdem für eine Quest, die man erst danach angenommen hat (Tag 7, Review)
    questEvent(world, p, 'action', { action: 'split' });
    return tell(world, p.id, WOODPILE.spent, 'sys');
  }
  const log = WOODPILE.log;
  if (P.bagFull(p) && !P.countItem(p, log)) return tell(world, p.id, 'Your bag is full.', 'hurt');
  oncePerDay(world, p, key);
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
  p.stacked = (p.stacked ?? 0) + k;
  const add = BEACON_FUEL[log] * k;
  tell(world, p.id, `You stack ${k} ${k === 1 ? 'log' : 'logs'} on Ama's woodpile. The Beacon will eat well tonight. (+${add})`, 'good');
  addBeaconFuel(world, add, 'The woodpile is as high as Ama. The Beacon blazes, and the Grey steps back.');
  questEvent(world, p, 'action', { action: 'stack' });
  if (!oncePerDay(world, p, `woodpile:${world.date}`)) return;
  tell(world, p.id, WOODPILE.first, 'sys');
  grantXp(world, p, WOODPILE.xp + WOODPILE.xpPerLevel * P.classLevel(p));
}
