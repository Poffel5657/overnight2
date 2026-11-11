// Nacht 1, Gebet: Schneckenrennen mit Wetten bei Mabb. Wetten über das Gespräch, das Rennen läuft im Takt,
// Gewinner bekommen Einsatz mal Quote, wer Kindle verlässt, bekommt den Einsatz zurück.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { RACE } from '../../content/races.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import { tickRace } from '../../shared/races.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, runUntil, talk, choose, options, veteran } from './helpers.mjs';

const stake = RACE.stakes[0];

test('Off to the Races: Quest annehmen, wetten, zusehen, abschließen', () => {
  const w = S.createWorld(REGION, 11);
  const p = veteran(w, 'a', { level: 3, gold: 50 });
  talk(w, 'a', 'mabb');
  choose(w, 'a', 'could use a hand');
  assert.equal(p.quests.off_to_races.step, 0);
  choose(w, 'a', 'place a bet');
  const snail = 'tom';
  choose(w, 'a', `${stake} gold on ${RACE.snails[snail].name}`);
  assert.equal(p.gold, 50 - stake, 'Einsatz bezahlt');
  assert.equal(p.quests.off_to_races.step, 1, 'Wette zählt für die Quest');

  // Noch eine Wette im selben Rennen geht nicht
  talk(w, 'a', 'mabb');
  choose(w, 'a', 'place a bet');
  choose(w, 'a', `${stake} gold on ${RACE.snails.bramble.name}`);
  assert.equal(p.gold, 50 - stake, 'eine Wette pro Rennen');
  applyIntent(w, 'a', { t: 'bye' });

  // Die Schnecken bewegen sich wirklich (Figuren laufen die Bahn entlang)
  const npc = (id) => w.npcs.find((n) => n.id === `snail_${id}`);
  const seen = runUntil(w, () => w.race.phase === 'done', RACE.every + 400);
  assert.equal(w.race.phase, 'done', 'Rennen ist durch');
  const winner = w.race.winner;
  assert.equal(npc(winner).x, RACE.finishX, 'Sieger steht im Ziel');
  assert.ok(seen.some((e) => e.type === 'chat' && e.ent === 'mabb'), 'Mabb ruft das Rennen aus');
  const expected = 50 - stake + (winner === snail ? stake * RACE.snails[snail].odds : 0);
  assert.equal(p.gold, expected, 'richtig ausgezahlt');
  assert.equal(p.quests.off_to_races.step, 2);

  talk(w, 'a', 'mabb');
  choose(w, 'a', 'watched my snail');
  assert.equal(p.quests.off_to_races.done, true);
  assert.equal(p.gold, expected + QUESTS.off_to_races.reward.gold);

  // Nach dem Rennen geht es zurück an den Start, neue Wetten sind möglich
  runUntil(w, () => w.race.phase === 'open', 100);
  assert.equal(npc(winner).x, RACE.startX);
  talk(w, 'a', 'mabb');
  assert.ok(options(w, 'a').some((t) => t.includes('place a bet')));
});

test('Wer Kindle vor dem Rennen verlässt, bekommt seinen Einsatz zurück; ohne Gold keine Wette', () => {
  const w = S.createWorld(REGION, 12);
  const p = veteran(w, 'b', { level: 3, gold: stake + 1 });
  talk(w, 'b', 'mabb');
  choose(w, 'b', 'place a bet');
  choose(w, 'b', `${stake} gold on ${RACE.snails.bramble.name}`);
  assert.equal(p.gold, 1);
  const save = S.removePlayer(w, 'b');
  assert.equal(save.gold, stake + 1, 'Einsatz zurück im Spielstand');

  const poor = veteran(w, 'c', { level: 3, gold: stake - 1 });
  talk(w, 'c', 'mabb');
  assert.ok(!options(w, 'c').some((t) => t.includes('place a bet')), 'zu wenig Gold: keine Wette');
  assert.equal(poor.gold, stake - 1);
});

test('Quoten: Auf lange Sicht gewinnt Mabb ein wenig, keine Schnecke ist ein sicheres Geschäft', () => {
  // Nur das Rennen, ohne den Rest der Welt: 4000 Rennen mit den echten Regeln aus shared/races.js
  let s = 7;
  const world = {
    region: { id: RACE.region }, tick: 0, events: [], players: new Map(),
    npcs: [{ id: RACE.keeper, x: 41, y: 59 }, ...Object.keys(RACE.snails).map((id) => ({ id: `snail_${id}`, x: RACE.startX, y: 59 }))],
    rand: () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; },
  };
  const wins = Object.fromEntries(Object.keys(RACE.snails).map((id) => [id, 0]));
  let races = 0;
  while (races < 4000) {
    world.tick++;
    const before = world.race?.phase;
    tickRace(world);
    world.events.length = 0;
    if (before === 'run' && world.race.phase === 'done') { wins[world.race.winner]++; races++; }
  }
  for (const [id, sn] of Object.entries(RACE.snails)) {
    const ev = (wins[id] / races) * sn.odds;
    assert.ok(ev < 1.0, `${sn.name}: Erwartung ${ev.toFixed(2)} unter 1`);
    assert.ok(ev > 0.8, `${sn.name}: Erwartung ${ev.toFixed(2)} lohnt sich noch`);
  }
});
