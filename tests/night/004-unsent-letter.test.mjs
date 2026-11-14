// Nacht 4, Nachschlag (Gebet 5, Rätsel): der halbe Brief in Abels altem Haus. Wer ihn schrieb, steht nur zwischen
// den Zeilen (die Schnecke mit dem Hut, die Mutter mit den falschen Karten): Mabb, und seine Mutter ist Old Ivy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

function through(w, pid, door, seed) {
  actOn(w, pid, door, 'enter');
  const to = w.players.get(pid).travel?.region;
  assert.ok(to, `${door.name} führt woandershin`);
  const save = S.removePlayer(w, pid);
  const next = S.createWorld(regionFor(to), seed);
  next.date = w.date;
  S.addPlayer(next, pid, pid, save);
  return next;
}
const nearestExit = (w, p, to) => w.objects.filter((o) => o.type === 'door' && o.to === to).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];

test('The Unsent Letter: Pell, Abels Haus, Mabb errät man aus dem Brief, Ivy in Cinderford, zurück zu Mabb', () => {
  let w = S.createWorld(REGION, 491);
  w.date = '2026-11-15';
  let p = veteran(w, 'a', { level: 3 });
  talk(w, 'a', 'pell');
  choose(w, 'a', 'Anything I can help');
  assert.equal(p.quests.unsent_letter.step, 0);
  // Mabb bietet nichts an, solange man den Brief nicht hat
  talk(w, 'a', 'mabb');
  assert.ok(!options(w, 'a').some((t) => t.includes('letter')));

  // Abels altes Haus am Lagerfeuer
  const house = w.objects.find((o) => o.inside && Math.hypot(o.x - 57, o.y - 57) < 4);
  assert.ok(house, 'das Haus am Lagerfeuer');
  w = through(w, 'a', house, 492);
  p = w.players.get('a');
  const table = w.objects.find((o) => o.quest === 'unsent_letter');
  actOn(w, 'a', table, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'unsent_letter'), 1);
  assert.match(ITEMS.unsent_letter.text, /hat/);
  assert.match(ITEMS.unsent_letter.text, /maps/);
  w = through(w, 'a', nearestExit(w, p, 'kindle'), 493);
  p = w.players.get('a');

  talk(w, 'a', 'mabb');
  choose(w, 'a', 'write this letter');
  assert.equal(p.quests.unsent_letter.step, 2);
  assert.equal(P.countItem(p, 'unsent_letter'), 1, 'Mabb gibt ihn zurück');

  // Den alten Weg nach Westen hinunter nach Cinderford
  w = through(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'cinderford'), 494);
  p = w.players.get('a');
  talk(w, 'a', 'ivy');
  choose(w, 'a', 'From your son');
  assert.equal(p.quests.unsent_letter.step, 3);
  assert.equal(P.countItem(p, 'unsent_letter'), 0);
  w = through(w, 'a', nearestExit(w, p, 'kindle'), 495);
  p = w.players.get('a');

  const gold = p.gold;
  talk(w, 'a', 'mabb');
  choose(w, 'a', 'mother got your letter');
  assert.equal(p.quests.unsent_letter.done, true);
  assert.equal(p.gold, gold + QUESTS.unsent_letter.reward.gold);
  assert.ok(P.countItem(p, 'cinder_cake') >= QUESTS.unsent_letter.reward.items.cinder_cake);
});
