// Nacht 3, Abstimmung: der Snail Cup. Fünf Schnecken (Duchess und Thistle neu), Pokal-Quest bei Mabb
// (drei gewonnene Wetten), am Wochenende Cup Day mit höherem Einsatz. Die Quoten prüft 001-snail-races.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { RACE, isCupDay } from '../../content/races.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { runUntil, talk, choose, options, veteran } from './helpers.mjs';

test('Fünf Schnecken stehen auf eigenen Bahnen und laufen mit', () => {
  const w = S.createWorld(REGION, 321);
  for (const id of ['duchess', 'thistle']) assert.ok(RACE.snails[id], `${id} läuft mit`);
  const rows = new Set();
  for (const id of Object.keys(RACE.snails)) {
    const n = w.npcs.find((x) => x.id === `snail_${id}`);
    assert.ok(n, `Figur für ${id}`);
    assert.equal(n.x, RACE.startX);
    rows.add(n.y);
  }
  assert.equal(rows.size, Object.keys(RACE.snails).length, 'jede Schnecke hat ihre Bahn');
});

test('Cup Day nur am Wochenende: dann nimmt Mabb den hohen Einsatz', () => {
  assert.ok(isCupDay('2026-11-14'), 'Samstag');
  assert.ok(isCupDay('2026-11-15'), 'Sonntag');
  assert.ok(!isCupDay('2026-11-16'), 'Montag');
  const w = S.createWorld(REGION, 322);
  w.date = '2026-11-16';
  const p = veteran(w, 'a', { level: 3, gold: 200 });
  talk(w, 'a', 'mabb'); choose(w, 'a', 'place a bet');
  assert.ok(!options(w, 'a').some((t) => t.includes('for the Cup')), 'werktags kein Cup-Einsatz');
  applyIntent(w, 'a', { t: 'bye' });
  w.date = '2026-11-14';
  talk(w, 'a', 'mabb'); choose(w, 'a', 'place a bet');
  choose(w, 'a', `${RACE.cup.stake} gold on ${RACE.snails.duchess.name}, for the Cup`);
  assert.equal(p.gold, 200 - RACE.cup.stake);
  assert.equal(w.race.bets.get('a').gold, RACE.cup.stake);
});

test('The Snail Cup: drei Wetten gewinnen, Pokal tragen', () => {
  const w = S.createWorld(REGION, 323);
  w.date = '2026-11-16';
  const p = veteran(w, 'a', { level: 3, gold: 2000, quests: { kindling: { done: true }, off_to_races: { done: true } } });
  talk(w, 'a', 'mabb');
  choose(w, 'a', 'trophy');
  assert.equal(p.quests.snail_cup.step, 0);
  const stake = RACE.stakes[0];
  let races = 0;
  let wins = 0;
  // Immer auf den Favoriten setzen und zusehen, bis drei Wetten gewonnen sind
  while (!(p.quests.snail_cup.step >= 3) && races < 80) {
    runUntil(w, () => w.race?.phase === 'open', 400);
    talk(w, 'a', 'mabb'); choose(w, 'a', 'place a bet');
    choose(w, 'a', `${stake} gold on ${RACE.snails.bramble.name}.`);
    applyIntent(w, 'a', { t: 'bye' });
    const g = p.gold;
    runUntil(w, () => w.race.phase === 'done', RACE.every + 400);
    races++;
    if (w.race.winner === 'bramble') { wins++; assert.equal(p.gold, g + stake * RACE.snails.bramble.odds); }
    assert.equal(p.quests.snail_cup.step, Math.min(3, wins), 'jeder Sieg zählt, Niederlagen nicht');
  }
  assert.equal(p.quests.snail_cup.step, 3, `drei Siege (nach ${races} Rennen)`);
  talk(w, 'a', 'mabb');
  choose(w, 'a', 'Three wins');
  assert.equal(p.quests.snail_cup.done, true);
  assert.equal(P.countItem(p, 'snail_cup'), QUESTS.snail_cup.reward.items.snail_cup);
  // Der Pokal ist ein Hut
  const slot = p.bag.findIndex((s) => s?.id === 'snail_cup');
  applyIntent(w, 'a', { t: 'use', slot });
  assert.equal(p.equip.head, 'snail_cup');
  assert.equal(ITEMS.snail_cup.slot, 'head');
});
