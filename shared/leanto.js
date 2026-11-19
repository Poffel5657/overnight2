// Der Unterstand am Rastplatz der Träger (Tag 9). Regeln in content/leanto.js.
import { LEANTO } from '../content/leanto.js';
import { ITEMS } from '../content/items.js';
import { tell, emit, float } from './events.js';
import * as P from './player.js';
import { questEvent, grantXp } from './talk.js';
import { oncePerDay } from './community.js';

// Stand des Tages (nur im Speicher; ein neuer Tag fängt bei null an).
export function leantoOf(world) {
  if (!world.leanto || world.leanto.date !== world.date) {
    // Ein neuer Tag: die Lampe im Unterstand ist aus (falls die Welt nicht ohnehin neu gebaut wurde)
    if (world.leanto) for (const o of world.objects) if (o.type === 'leanto' && o.lit) { o.lit = false; emit(world, { type: 'lit', id: o.id, lit: false }); }
    world.leanto = { date: world.date, n: 0 };
  }
  return world.leanto;
}

export function leantoStands(world) {
  return leantoOf(world).n >= LEANTO.goal;
}

// Waffenruhe: Wesen mit truce greifen niemanden von selbst an, solange der Unterstand steht.
export function truceHolds(world, m) {
  return !!m.def.truce && !!world.leanto && leantoStands(world);
}

export function mendLeanto(world, p, o) {
  const st = leantoOf(world);
  const left = [];
  let points = 0;
  for (const [id, worth] of Object.entries(LEANTO.takes)) {
    const k = Math.min(P.countItem(p, id), LEANTO.maxEach);
    if (k < 1) continue;
    P.takeItem(p, id, k);
    points += worth * k;
    left.push(`${k} ${ITEMS[id].name}`);
  }
  if (!points) {
    tell(world, p.id, st.n >= LEANTO.goal ? LEANTO.standing : LEANTO.nothing, 'sys');
    // Steht er schon, zählt Hinsehen trotzdem für Quests, die Flicken verlangen
    if (st.n >= LEANTO.goal) questEvent(world, p, 'action', { action: 'mend' });
    return 0;
  }
  const was = st.n;
  st.n += points;
  p.mended = (p.mended ?? 0) + points;
  tell(world, p.id, LEANTO.mended(left.join(', '), st.n, LEANTO.goal), 'good');
  float(world, p.id, `+${points} lean-to`, 'info', p.id);
  questEvent(world, p, 'action', { action: 'mend' });
  if (oncePerDay(world, p, `leanto:${world.date}`)) {
    tell(world, p.id, LEANTO.first, 'sys');
    grantXp(world, p, LEANTO.xp + LEANTO.xpPerLevel * P.classLevel(p));
  }
  if (was < LEANTO.goal && st.n >= LEANTO.goal) {
    o.lit = true;
    emit(world, { type: 'lit', id: o.id, lit: true });
    emit(world, { type: 'log', text: LEANTO.built, cls: 'good' });
    // Wer gerade angegriffen wird, behält seinen Kampf; alle anderen Wardens lassen ab
    for (const m of world.mobs) if (m.def.truce && !m.hitters?.size) m.angryAt = null;
    for (const q of world.players.values()) questEvent(world, q, 'action', { action: 'leanto' });
  }
  return points;
}

// Am Herd der Träger rasten: wie am Lagerfeuer; steht der Unterstand, einmal am Tag ausgeruht.
export function restAtHearth(world, p) {
  if (!leantoStands(world)) return false;
  questEvent(world, p, 'action', { action: 'rest_road' });
  if (!oncePerDay(world, p, `hearth:${world.date}`)) {
    tell(world, p.id, LEANTO.restAgain, 'sys');
    return true;
  }
  p.rested = Math.max(p.rested ?? 0, LEANTO.rested);
  p.oil = 100;
  p.warnedOil = 0;
  tell(world, p.id, `${LEANTO.restBuilt} Rested: the next ${LEANTO.rested} victories give more experience.`, 'good');
  return true;
}
