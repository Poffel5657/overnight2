// Schneckenrennen in Kindle: Mabb nimmt Wetten an (Gesprächswirkung { bet: [schnecke, gold] }), alle paar
// Minuten laufen drei Schnecken (Figuren snail_<id>) ihre Bahn, und wer auf den Sieger gesetzt hat, bekommt
// Einsatz mal Quote. Zahlen in content/races.js. Zufall nur über world.rand.

import { RACE } from '../content/races.js';
import { tell, emit, float } from './events.js';
import { questEvent } from './talk.js';
import { cheb } from './path.js';

const npcOf = (world, id) => world.npcs.find((n) => n.id === `snail_${id}`);

// Stand des Rennens in diesem Gebiet (oder null, wenn hier keins läuft).
export function raceOf(world) {
  if (world.region.id !== RACE.region || !world.npcs.some((n) => n.id === RACE.keeper)) return null;
  if (!world.race) world.race = { phase: 'open', at: world.tick + RACE.every, bets: new Map(), pos: {}, winner: null };
  return world.race;
}

// Wer das Rennen mitbekommt: alle mit Wette und alle in der Nähe von Mabb.
function announce(world, text, cls = 'sys') {
  const r = world.race;
  const keeper = world.npcs.find((n) => n.id === RACE.keeper);
  for (const p of world.players.values()) {
    if (r.bets.has(p.id) || (keeper && cheb(keeper.x, keeper.y, p.x, p.y) <= RACE.watch)) tell(world, p.id, text, cls);
  }
}

function shout(world, text) {
  emit(world, { type: 'chat', ent: RACE.keeper, text });
}

export function secondsToStart(world) {
  const r = raceOf(world);
  if (!r) return 0;
  return r.phase === 'open' ? Math.max(0, Math.ceil(((r.at - world.tick) * 300) / 1000)) : 0;
}

export function placeBet(world, p, snail, gold) {
  const r = raceOf(world);
  const s = RACE.snails[snail];
  if (!r || !s || !RACE.stakes.includes(gold)) return;
  if (r.phase !== 'open') return tell(world, p.id, 'The snails are already running. Wait for the next race.', 'sys');
  if (r.bets.has(p.id)) return tell(world, p.id, 'You already have a stone on this race. One bet a race.', 'sys');
  if (p.gold < gold) return tell(world, p.id, `That bet is ${gold} gold. You have ${p.gold}.`, 'sys');
  p.gold -= gold;
  r.bets.set(p.id, { snail, gold });
  tell(world, p.id, `Mabb chalks it up: ${gold} gold on ${s.name}, pays ${gold * s.odds}. The race starts in about ${secondsToStart(world)}s. Stay and watch.`, 'good');
  questEvent(world, p, 'action', { action: 'bet' });
}

// Wer das Gebiet verlässt, bekommt seinen Einsatz zurück.
export function refundBet(world, p) {
  const r = world.race;
  const b = r?.bets.get(p.id);
  if (!b) return;
  r.bets.delete(p.id);
  p.gold += b.gold;
}

function resetSnails(world) {
  for (const id of Object.keys(RACE.snails)) {
    const n = npcOf(world, id);
    if (n) n.x = RACE.startX;
  }
}

export function tickRace(world) {
  const r = raceOf(world);
  if (!r) return;
  if (r.phase === 'open') {
    if (world.tick === r.at - 34 && r.bets.size) shout(world, 'Last bets! The snails are getting restless.');
    if (world.tick < r.at) return;
    r.phase = 'run';
    r.pos = Object.fromEntries(Object.keys(RACE.snails).map((id) => [id, 0]));
    resetSnails(world);
    shout(world, 'And they are off! In a manner of speaking.');
    announce(world, 'Mabb rings a tiny bell. The snails set off.');
    return;
  }
  if (r.phase === 'run') {
    if ((world.tick - r.at) % RACE.stepEvery) return;
    const len = RACE.finishX - RACE.startX;
    const done = [];
    for (const [id, s] of Object.entries(RACE.snails)) {
      const roll = world.rand();
      const step = roll < s.burst ? 2 : roll < s.burst + s.pace ? 1 : 0;
      r.pos[id] = Math.min(len, r.pos[id] + step);
      const n = npcOf(world, id);
      if (n) n.x = RACE.startX + r.pos[id];
      if (r.pos[id] >= len) done.push(id);
    }
    if (!done.length) return;
    const winner = done[Math.floor(world.rand() * done.length)];
    settle(world, r, winner);
    return;
  }
  // phase 'done': kurz stehen lassen, dann zurück an den Start und Wetten für das nächste Rennen.
  if (world.tick >= r.at) {
    resetSnails(world);
    r.phase = 'open';
    r.at = world.tick + RACE.every;
  }
}

function settle(world, r, winner) {
  const s = RACE.snails[winner];
  r.winner = winner;
  shout(world, `${s.name} wins! ${s.name} has no idea.`);
  announce(world, `${s.name} crosses the line first.`, 'good');
  for (const [pid, b] of r.bets) {
    const p = world.players.get(pid);
    if (!p) continue;
    if (b.snail === winner) {
      const win = b.gold * s.odds;
      p.gold += win;
      tell(world, pid, `Your snail won! Mabb counts out ${win} gold.`, 'good');
      float(world, pid, `+${win} gold`, 'info', pid);
    } else {
      tell(world, pid, `${RACE.snails[b.snail].name} was not in a hurry. Your ${b.gold} gold stays with Mabb.`, 'sys');
    }
    questEvent(world, p, 'action', { action: 'race' });
  }
  r.bets.clear();
  r.phase = 'done';
  r.at = world.tick + 12;
}
