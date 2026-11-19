// Nacht 9, vom Nightwright (Bogen „The Second Light“, Akt 2): Sedge, ein alter Hollow Warden, sitzt am Herd der Träger.
// Er redet nur mit denen, die am Unterstand mitgeflickt haben. „A Peg Still Hanging“: warme Asche zu Wenna (nachts in der
// Mühle), Wennas Zettel zu Marrow, zurück zu Sedge. Lohn: Warden's Lamp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn, options } from './helpers.mjs';

function road(seed) {
  const w = S.createWorld(regionFor('stone_road'), seed);
  w.date = '2026-11-20';
  w.daylight = 0;
  for (const m of w.mobs) if (m.type !== 'hollow_warden') { m.dead = true; m.deadUntil = 1e9; }
  return w;
}

function hop(from, to, pid, seed) {
  const w = S.createWorld(regionFor(to), seed);
  w.date = from.date;
  w.daylight = from.daylight;
  if (to === 'stone_road') for (const m of w.mobs) if (m.type !== 'hollow_warden') { m.dead = true; m.deadUntil = 1e9; }
  const p = S.addPlayer(w, pid, pid, S.removePlayer(from, pid));
  return { w, p };
}

test('A Peg Still Hanging: flicken, Sedge, Asche zu Wenna, Zettel zu Marrow, zurück zu Sedge', () => {
  let w = road(941);
  const done = { kindling: { done: true }, stone_by_stone: { done: true }, the_last_sack: { done: true }, oil_for_the_road: { done: true } };
  let p = veteran(w, 'a', { cls: 'warden', level: 34, quests: done, bag: [{ id: 'split_log', n: 2 }] });
  // Hinauf zum Rastplatz
  applyIntent(w, 'a', { t: 'walk', x: 24, y: 10 });
  run(w, 250);
  assert.equal(w.region.zoneAt(p.x, p.y), 'THE CARRIERS\' REST');
  assert.ok(w.npcs.some((n) => n.id === 'sedge'), 'Sedge sitzt am Rastplatz');
  // Wer nicht geflickt hat, bekommt nur ein „Hm.“
  talk(w, 'a', 'sedge');
  assert.ok(!options(w, 'a').some((t) => t.includes('peg')), 'ohne Flicken keine Quest');
  choose(w, 'a', 'Who are you?');
  assert.equal(p.dialog.page, 's_cold');
  applyIntent(w, 'a', { t: 'bye' });
  // Zwei Scheite in den Unterstand
  actOn(w, 'a', w.objects.find((o) => o.type === 'leanto'), 'use');
  assert.ok(p.mended >= 1);
  talk(w, 'a', 'sedge');
  choose(w, 'a', 'Who are you?');
  assert.equal(p.dialog.page, 's_name');
  talk(w, 'a', 'sedge');
  choose(w, 'a', 'Whose peg');
  assert.equal(p.quests.a_peg_still_hanging.step, 0);
  assert.equal(P.countItem(p, 'hearth_ash'), 1, 'warme Asche in Birkenrinde');
  // Hinunter nach Kindle, zur Mühle. Am Tag schläft Wenna.
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 'enter');
  ({ w, p } = hop(w, 'kindle', 'a', 942));
  w.daylight = 1;
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('Sedge')), 'am Tag schläft sie');
  w.daylight = 0;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Sedge sent you');
  assert.equal(p.quests.a_peg_still_hanging.step, 1);
  assert.equal(P.countItem(p, 'wennas_note'), 1);
  assert.equal(P.countItem(p, 'hearth_ash'), 0);
  // Zu Marrow
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'left you a note');
  assert.equal(p.quests.a_peg_still_hanging.step, 2);
  assert.equal(P.countItem(p, 'wennas_note'), 0);
  // Wieder hinauf zu Sedge
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'stone_road'), 'enter');
  ({ w, p } = hop(w, 'stone_road', 'a', 943));
  applyIntent(w, 'a', { t: 'walk', x: 24, y: 10 });
  run(w, 250);
  talk(w, 'a', 'sedge');
  choose(w, 'a', 'Wenna got your ash');
  assert.ok(p.quests.a_peg_still_hanging.done, 'fertig');
  assert.equal(P.countItem(p, 'wardens_lamp') + (p.equip.lantern === 'wardens_lamp' ? 1 : 0), 1, 'Sedges Ersatzlampe');
  assert.ok(ITEMS.wardens_lamp.light > ITEMS.greyglass_lantern.light, 'besser als, was man um 34 trägt');
  assert.ok(QUESTS.a_peg_still_hanging.reward.xp > 2000);
  // Danach: Wenna packt
  ({ w, p } = hop(w, 'kindle', 'a', 944));
  w.daylight = 0;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Sedge is waiting');
  assert.equal(p.dialog.page, 'ps_after');
});
