// Nacht 6, vom Nightwright (Bogen „The Second Light“): Wenna will nach Norden. „Oil for the Road“: drei Flaschen
// Öl, in ihrem Namen Holz auf Amas Stapel, nachts vom Ausguck die Steine prüfen, Brindle fragen, zurück zu Wenna.
// Danach ruft Ama „The Beacon Starves“ aus. Stranger und Fen reagieren.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn, options } from './helpers.mjs';

function walkTo(w, pid, obj, action) {
  for (let i = 0; i < 4 && (i === 0 || w.players.get(pid).goal); i++) actOn(w, pid, obj, action);
  run(w, 2);
}

test('Oil for the Road: Öl, Holz in Wennas Namen, Ausguck bei Nacht, Brindle, Wenna; dann ruft Ama aus', () => {
  const w = S.createWorld(REGION, 611);
  w.date = '2026-11-17';
  w.daylight = 1;
  // Wer „The Last Sack“ gelöst hat; Öl kauft man bei Marrow
  const p = veteran(w, 'a', { level: 16, gold: 200, quests: { kindling: { done: true }, who_grinds: { done: true }, the_last_sack: { done: true } } });

  // Bei Tag schläft sie
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('go home')), 'bei Tag nicht');

  // Öl kaufen (Marrow), wie ein Spieler über das Händlerfenster
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'wares');
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'lamp_oil', n: 3 });
  run(w, 1);
  assert.ok(P.countItem(p, 'lamp_oil') >= 3, 'drei Flaschen Öl');

  // Nachts in der Mühle
  w.daylight = 0.1;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'go home');
  assert.equal(p.dialog.page, 'or_offer');
  assert.equal(p.quests.oil_for_the_road.step, 1, 'Öl schon im Beutel');
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Three flasks');
  assert.equal(p.quests.oil_for_the_road.step, 2);

  // Stranger und Fen wissen davon, Ama auch
  for (const [npc, frag, page] of [['stranger', 'leaves tomorrow', 'or_stranger'], ['fen', 'walking home', 'or_fen'], ['ama', 'walking home', 'or_ama']]) {
    talk(w, 'a', npc);
    choose(w, 'a', frag);
    assert.equal(p.dialog?.page, page);
  }

  // Holz in ihrem Namen: Totholz spalten, am Stapel nachlegen
  const deadfall = w.objects.find((o) => o.type === 'deadfall' && o.y > 25);
  walkTo(w, 'a', deadfall, 'use');
  assert.ok(P.countItem(p, 'split_log') > 0);
  walkTo(w, 'a', w.objects.find((o) => o.type === 'woodpile'), 'use');
  assert.equal(p.quests.oil_for_the_road.step, 3);

  // Bei Tag sieht man vom Ausguck nichts; nachts schon
  const lookout = w.objects.find((o) => o.type === 'lookout');
  w.daylight = 1;
  walkTo(w, 'a', lookout, 'use');
  assert.equal(p.quests.oil_for_the_road.step, 3, 'bei Tag nicht');
  w.daylight = 0.1;
  walkTo(w, 'a', lookout, 'use');
  assert.equal(p.quests.oil_for_the_road.step, 4);

  talk(w, 'a', 'brindle');
  choose(w, 'a', 'Is the road clear');
  assert.equal(p.dialog.page, 'or_brindle');
  assert.equal(p.quests.oil_for_the_road.step, 5);

  talk(w, 'a', 'wenna');
  choose(w, 'a', 'Brindle has been watching');
  assert.ok(p.quests.oil_for_the_road.done, 'Quest fertig');
  assert.equal(P.countItem(p, 'carriers_lamp'), 1, 'Wennas Dank: eine Trägerlampe');
  assert.equal(ITEMS.carriers_lamp.slot, 'lantern');
  assert.ok(ITEMS.carriers_lamp.burn < 1, 'spart Öl');
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'When do you leave');
  assert.equal(p.dialog.page, 'or_after');

  // Ama ruft „The Beacon Starves“ aus
  talk(w, 'a', 'ama');
  choose(w, 'a', 'starving');
  assert.equal(p.dialog.page, 'ama_starves');
  assert.ok(QUESTS.oil_for_the_road.reward.xp > 0);
});

