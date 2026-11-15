// Nacht 5, vom Nightwright (Bogen „The Second Light“): Wenna, eine verirrte Trägerin, schläft tagsüber in der
// Old Mill und mahlt nachts ihr letztes Korn. „The Last Sack“: Brot, ihre Laterne am Leuchtfeuer füllen,
// Tallow nach dem Gebet unter dem weißen Stein fragen, zurück zu ihr. Ama, Fen und der Stranger reagieren.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, veteran, actOn, options } from './helpers.mjs';

test('The Last Sack: Wenna schläft am Tag, nachts Brot, Laterne am Leuchtfeuer, Tallow, zurück zu Wenna', () => {
  const w = S.createWorld(REGION, 551);
  w.date = '2026-11-16';
  w.daylight = 1;
  // Wer „Who Grinds at Night“ gelöst hat, hat zwei Millbread vom Lohn
  const p = veteran(w, 'a', { level: 12, quests: { kindling: { done: true }, who_grinds: { done: true } }, bag: [{ id: 'millbread', n: 2 }] });

  // Bei Tag schläft sie
  talk(w, 'a', 'wenna');
  assert.deepEqual(options(w, 'a').filter((t) => t.includes('grinds')), [], 'bei Tag keine Quest');
  choose(w, 'a', 'Hello');
  assert.equal(p.dialog.page, 'w_day');

  // Nachts
  w.daylight = 0.1;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'one who grinds at night');
  assert.ok(p.quests.the_last_sack, 'Quest beginnt');
  // have-Schritt erledigt sich mit dem Brot im Beutel
  assert.equal(p.quests.the_last_sack.step, 1);
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Bread');
  assert.equal(P.countItem(p, 'millbread'), 0);
  assert.equal(P.countItem(p, 'wennas_lantern'), 1);
  assert.equal(p.quests.the_last_sack.step, 2);

  // Ama, Fen und der Stranger wissen davon
  for (const [npc, frag, page] of [['ama', 'carrier hiding', 'ls_ama'], ['fen', 'carrier in the old mill', 'fen_wenna'], ['stranger', 'called Wenna', 'ls_stranger']]) {
    talk(w, 'a', npc);
    choose(w, 'a', frag);
    assert.equal(p.dialog?.page, page);
  }

  // Am Leuchtfeuer füllen
  const beacon = w.objects.find((o) => o.type === 'beacon');
  actOn(w, 'a', beacon, 'refill');
  run(w, 2);
  assert.equal(p.quests.the_last_sack.step, 3);

  // Tallow und das Gebet unter dem weißen Stein
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'prayer under a white stone');
  assert.equal(p.quests.the_last_sack.step, 4);

  // Bei Tag geht es nicht weiter, nachts schon
  w.daylight = 1;
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('Your lantern')), 'bei Tag schläft sie');
  w.daylight = 0.1;
  const xp = p.classes.warden.xp;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Your lantern, lit');
  assert.equal(p.quests.the_last_sack.done, true);
  assert.equal(P.countItem(p, 'wennas_lantern'), 0);
  assert.ok(P.countItem(p, 'hollow_ration') >= 2, 'Torfbrot als Dank');
  assert.ok(p.classes.warden.xp >= xp + QUESTS.the_last_sack.reward.xp);

  // Danach: Ama hört, dass das Feuer im Norden hungert
  talk(w, 'a', 'ama');
  choose(w, 'a', 'going hungry');
  assert.equal(p.dialog.page, 'ls_ama_after');
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Where will you go');
  assert.equal(p.dialog.page, 'w_after');
});

test('Wenna kommt erst nach „Who Grinds at Night“ ins Gespräch', () => {
  const w = S.createWorld(REGION, 552);
  w.daylight = 0.1;
  const p = veteran(w, 'a', { level: 3 });
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('grinds')));
  choose(w, 'a', 'Who are you');
  assert.equal(p.dialog.page, 'w_shy');
  assert.equal(p.quests.the_last_sack, undefined);
});

test('Nachschlag: Brindle, Mothwick, Coyne und Pip wissen von Wenna und der Mühle', async () => {
  const { regionFor } = await import('../../content/regions/index.js');
  const { BARKS } = await import('../../content/barks.js');
  const w = S.createWorld(REGION, 553);
  w.daylight = 0.1;
  const p = veteran(w, 'a', { level: 20, quests: { kindling: { done: true }, who_grinds: { done: true }, the_last_sack: { step: 2, n: 0 } } });
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'carriers is in the old mill');
  assert.equal(p.dialog.page, 'br_wenna');
  p.quests.the_last_sack = { done: true };
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'called Wenna');
  assert.equal(p.dialog.page, 'mw_wenna');
  // Coyne im Counting House
  const house = w.objects.find((o) => o.name === 'the Counting House');
  actOn(w, 'a', house, 'enter');
  const d = S.createWorld(regionFor('kindle_inside'), 554);
  const q = S.addPlayer(d, 'a', 'a', S.removePlayer(w, 'a'));
  talk(d, 'a', 'coyne');
  choose(d, 'a', 'share in the old mill');
  assert.equal(q.dialog.page, 'cy_mill');
  assert.ok(BARKS.band_pip.lines.some((l) => l.includes('mill')));
});

test('Nachschlag: Wenna sagt, wie viele Träger losgingen (nur nachts, während der Quest)', () => {
  const w = S.createWorld(REGION, 555);
  w.daylight = 0.1;
  const p = veteran(w, 'a', { level: 10, quests: { kindling: { done: true }, who_grinds: { done: true }, the_last_sack: { step: 2, n: 0 } } });
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'how many of you set out');
  assert.equal(p.dialog.page, 'w_count');
  w.daylight = 1;
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('how many')), 'bei Tag schläft sie');
});
