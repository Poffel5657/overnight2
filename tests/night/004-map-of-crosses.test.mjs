// Nacht 4, Nachschlag (Gebet 5, Rätsel): Die Karte voller Kreuze im leeren Haus südwestlich des Leuchtfeuers.
// Fen deutet sie, vom Ausguck sieht man nachts, wo der Kreis ist, Brindle vergleicht mit ihrem Buch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

function through(w, pid, door, seed) {
  actOn(w, pid, door, 'enter');
  const to = w.players.get(pid).travel?.region;
  assert.ok(to, `${door.name} führt woandershin`);
  const save = S.removePlayer(w, pid);
  const next = S.createWorld(regionFor(to), seed);
  next.date = w.date;
  next.daylight = w.daylight;
  S.addPlayer(next, pid, pid, save);
  return next;
}

test('The Map of Crosses: Haus, Fen, Ausguck bei Nacht, Brindle', () => {
  const quests = { kindling: { done: true }, not_from_here: { done: true }, eyes_north: { done: true } };
  let w = S.createWorld(REGION, 481);
  w.daylight = 1;
  let p = veteran(w, 'a', { level: 12, quests });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'empty house');
  assert.equal(p.quests.map_of_crosses.step, 0);

  // Das Haus südwestlich des Leuchtfeuers
  const house = w.objects.find((o) => o.inside && Math.hypot(o.x - 41, o.y - 55) < 4);
  assert.ok(house, 'ein Haus südwestlich des Leuchtfeuers');
  w = through(w, 'a', house, 482);
  p = w.players.get('a');
  const map = w.objects.find((o) => o.quest === 'map_of_crosses');
  assert.ok(map);
  actOn(w, 'a', map, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'crossed_map'), 1);
  assert.equal(p.quests.map_of_crosses.step, 1);
  const exit = w.objects.filter((o) => o.type === 'door' && o.to === 'kindle').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  w = through(w, 'a', exit, 483);
  p = w.players.get('a');

  talk(w, 'a', 'fen');
  choose(w, 'a', 'map full of crosses');
  assert.equal(p.quests.map_of_crosses.step, 2);

  // Auf den Ausguck: bei Tag zählt es nicht, nachts schon
  const tower = w.objects.find((o) => o.type === 'lookout');
  actOn(w, 'a', tower, 'use');
  run(w, 2);
  assert.equal(p.quests.map_of_crosses.step, 2, 'bei Tag sieht man nichts');
  w.daylight = 0.1;
  actOn(w, 'a', tower, 'use');
  run(w, 2);
  assert.equal(p.quests.map_of_crosses.step, 3);

  const xp = p.classes.warden.xp;
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'where this circle is');
  assert.equal(p.quests.map_of_crosses.done, true);
  assert.equal(P.countItem(p, 'crossed_map'), 0, 'Brindle behält die Karte');
  assert.ok(p.classes.warden.xp >= xp + QUESTS.map_of_crosses.reward.xp);
});
