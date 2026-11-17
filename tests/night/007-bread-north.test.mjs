// Nacht 7, aus der Abstimmung („bread-north“): Kindle schickt Brot und Öl nach Norden. Unter dem ersten Stein am Ende
// der Nordstraße steht eine Kiste (Objekt 'cache', content/cache.js). Quest „Bread to the First Stone“ (Brindle):
// Gerste mahlen, Hollis backt Millbread, Öl kaufen, in die Kiste legen, Ama, Wenna. Danach „A Week of Bread“.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { CACHE } from '../../content/cache.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn, options } from './helpers.mjs';

function walkTo(w, pid, obj, action) {
  const seen = [];
  const grab = (ev) => seen.push(...ev.filter((e) => e.type === 'log' && (e.to === pid || !e.to)).map((e) => e.text));
  for (let k = 0; k < 4 && (k === 0 || w.players.get(pid).goal); k++) {
    applyIntent(w, pid, { t: 'act', kind: 'object', id: obj.id, action });
    for (let i = 0; i < 400 && w.players.get(pid).goal; i++) run(w, 1, grab);
  }
  run(w, 2, grab);
  return seen;
}

function viaTavern(w, pid, seed, inside) {
  actOn(w, pid, w.objects.find((o) => o.type === 'tavern'), 'enter');
  const d = S.createWorld(regionFor('kindle_inside'), seed);
  d.date = w.date;
  const q = S.addPlayer(d, pid, pid, S.removePlayer(w, pid));
  inside(d, q);
  const door = d.objects.find((o) => o.type === 'door' && o.to === 'kindle' && d.region.zoneAt(o.x, o.y) === 'THE LANTERN & LARK');
  actOn(d, pid, door, 'enter');
  const w2 = S.createWorld(REGION, seed + 1);
  w2.date = d.date;
  w2.daylight = w.daylight;
  return { w: w2, p: S.addPlayer(w2, pid, pid, S.removePlayer(d, pid)) };
}

test('Die Kiste steht am ersten Stein neben der Nordstraße, nahe Brindle und dem Ausguck', () => {
  const box = REGION.objects.find((o) => o.type === 'cache');
  assert.ok(box, 'Kiste da');
  const watch = REGION.objects.find((o) => o.type === 'lookout');
  const brindle = REGION.npcs.find((n) => n.id === 'brindle');
  assert.ok(Math.hypot(box.x - watch.x, box.y - watch.y) < 7, 'beim Ausguck');
  assert.ok(Math.hypot(box.x - brindle.x, box.y - brindle.y) < 4, 'Brindle sieht sie');
  assert.equal(REGION.tiles[box.y][box.x + 1], '=', 'gleich neben der Nordstraße');
  // Die Kiste nimmt Brot und Öl, kein Holz
  assert.ok(CACHE.accepts.millbread > CACHE.accepts.bread);
  assert.ok(!CACHE.accepts.split_log);
  for (const id of Object.keys(CACHE.accepts)) assert.ok(ITEMS[id], id);
});

test('Bread to the First Stone: Gerste mahlen, Hollis backt, Öl, die Kiste, Ama, Wenna in der Nacht', () => {
  let w = S.createWorld(REGION, 701);
  w.date = '2026-11-18';
  w.daylight = 1;
  let p = veteran(w, 'a', { level: 12, gold: 80, quests: { kindling: { done: true }, who_grinds: { done: true } } });

  talk(w, 'a', 'brindle');
  choose(w, 'a', 'box under the first stone');
  assert.equal(p.dialog.page, 'bn_offer');
  assert.equal(p.quests.bread_north.step, 0);

  // Gerste kaufen, an der Mühle mahlen
  talk(w, 'a', 'marrow');
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'barley', n: 2 });
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'lamp_oil', n: 1 });
  run(w, 1);
  walkTo(w, 'a', w.objects.find((o) => o.type === 'millstone'), 'use');
  assert.equal(P.countItem(p, 'mill_flour'), 1, 'Mehl gemahlen');

  // Hollis backt
  ({ w, p } = viaTavern(w, 'a', 702, (d) => {
    talk(d, 'a', 'hollis');
    choose(d, 'a', 'bake this flour');
  }));
  assert.equal(P.countItem(p, 'millbread'), 2);
  assert.equal(p.quests.bread_north.step, 2, 'Brot und Öl im Beutel');

  // Holz nimmt die Kiste nicht
  P.addItem(p, 'split_log', 1);
  const box = w.objects.find((o) => o.type === 'cache');
  const seen = walkTo(w, 'a', box, 'use');
  assert.equal(P.countItem(p, 'millbread'), 0, 'Brot liegt in der Kiste');
  assert.equal(P.countItem(p, 'lamp_oil'), 0, 'Öl auch');
  assert.equal(P.countItem(p, 'split_log'), 1, 'Holz bleibt (Amas Stapel)');
  assert.equal(p.sentNorth, 2 * CACHE.accepts.millbread + CACHE.accepts.lamp_oil);
  assert.ok(seen.some((t) => t.includes('Brindle')), 'Brindle sieht es');
  assert.ok(seen.some((t) => t === CACHE.all), 'alle erfahren davon');
  assert.equal(p.quests.bread_north.step, 3);
  // Ein zweites Mal am Tag: kein Brot dabei, nur der Hinweis
  const again = walkTo(w, 'a', box, 'use');
  assert.ok(again.some((t) => t.includes('Wood goes on Ama')));

  // Ama brummt
  talk(w, 'a', 'ama');
  choose(w, 'a', 'bread north');
  assert.equal(p.dialog.page, 'bn_ama');
  assert.equal(p.quests.bread_north.step, 4);

  // Wenna nur nachts
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('first stone')), 'bei Tag schläft sie');
  w.daylight = 0.1;
  const xp = p.classes.warden.xp;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'bread for you at the first stone');
  assert.equal(p.dialog.page, 'bn_wenna');
  assert.ok(p.quests.bread_north.done);
  assert.ok(p.classes.warden.xp > xp, 'Erfahrung');

  // Danach: A Week of Bread, bis sentNorth CACHE.week erreicht
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'carrier\'s load');
  assert.equal(p.quests.week_of_bread.step, 0);
  talk(w, 'a', 'wenna');
  assert.ok(!options(w, 'a').some((t) => t.includes('heavy now')), 'noch zu leicht');
  // Mehr Brot bei Marrow (Brot zählt 1), Öl zählt 2
  w.daylight = 1;
  p.gold += 200;
  talk(w, 'a', 'marrow');
  const need = CACHE.week - p.sentNorth;
  const oil = Math.ceil(need / CACHE.accepts.lamp_oil);
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'lamp_oil', n: oil });
  run(w, 1);
  assert.ok(P.countItem(p, 'lamp_oil') >= oil);
  walkTo(w, 'a', box, 'use');
  assert.ok(p.sentNorth >= CACHE.week);
  w.daylight = 0.1;
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'heavy now');
  assert.equal(p.dialog.page, 'wb_done');
  assert.ok(p.quests.week_of_bread.done);
  assert.equal(P.countItem(p, 'sackcloth_mantle'), 1);
  assert.equal(ITEMS.sackcloth_mantle.slot, 'body');
  assert.ok(QUESTS.week_of_bread.reward.xp > 0);
});

test('Wenna bleibt: nach „Oil for the Road“ erklärt sie, warum; Stranger und Mothwick reden über das Brot', () => {
  const w = S.createWorld(REGION, 703);
  w.daylight = 0.1;
  const p = veteran(w, 'a', { level: 14, quests: { kindling: { done: true }, the_last_sack: { done: true }, oil_for_the_road: { done: true }, bread_north: { step: 3, n: 0 } } });
  talk(w, 'a', 'wenna');
  choose(w, 'a', 'still here');
  assert.equal(p.dialog.page, 'w_stay');
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'bread north');
  assert.equal(p.dialog.page, 'bn_stranger');
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'bread north');
  assert.equal(p.dialog.page, 'mw_bread');
});

test('Alter Spielstand ohne sentNorth lädt mit 0 und speichert es', () => {
  const w = S.createWorld(REGION, 704);
  const p = veteran(w, 'a', { level: 3 });
  assert.equal(p.sentNorth, 0);
  p.sentNorth = 7;
  const back = S.addPlayer(S.createWorld(REGION, 705), 'b', 'b', P.saveOf(p));
  assert.equal(back.sentNorth, 7);
});

test('A Drawing for the Box: Fen gibt eine Zeichnung mit, sie kommt in die Kiste, zurück zu Fen', () => {
  const w = S.createWorld(REGION, 706);
  w.date = '2026-11-18';
  const p = veteran(w, 'a', { level: 3 });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'drawing now');
  assert.equal(p.dialog.page, 'fl_offer');
  assert.equal(P.countItem(p, 'fens_drawing'), 1);
  assert.equal(p.quests.fens_letter.step, 1);
  walkTo(w, 'a', w.objects.find((o) => o.type === 'cache'), 'use');
  assert.equal(P.countItem(p, 'fens_drawing'), 0, 'liegt in der Kiste');
  assert.equal(p.quests.fens_letter.step, 2);
  talk(w, 'a', 'fen');
  choose(w, 'a', 'drawing is in the box');
  assert.ok(p.quests.fens_letter.done);
});

test('Antwort aus dem Norden: Wer schon länger Brot bringt, findet manchmal Torfbrot im Kasten', () => {
  let found = 0;
  for (let k = 0; k < 12; k++) {
    const w = S.createWorld(REGION, 740 + k);
    w.date = `2026-11-${10 + k}`;
    const p = veteran(w, 'a', { level: 10, bag: [{ id: 'lamp_oil', n: CACHE.answerFrom }] });
    walkTo(w, 'a', w.objects.find((o) => o.type === 'cache'), 'use');
    assert.ok(p.sentNorth >= CACHE.answerFrom);
    found += P.countItem(p, CACHE.answer.item);
  }
  assert.ok(found > 0 && found < 12, `manchmal (${found} von 12)`);
});

test('Hollis hat ein siebtes Gerücht: die Kiste auf dem Hügel', () => {
  const w = S.createWorld(REGION, 707);
  veteran(w, 'a', { level: 4 });
  viaTavern(w, 'a', 708, (d, q) => {
    talk(d, 'a', 'hollis');
    choose(d, 'a', 'Heard anything');
    for (const next of ['Anything else?', 'And?', 'Anything newer?', 'And?', 'Anything newer?', 'Anything newer?']) choose(d, 'a', next);
    assert.equal(q.dialog.page, 'rumour7');
  });
});

test('The Stone on the Lid: nachts der Kiesel an der Kiste, Wren liest ihn, Brindle schreibt es auf', () => {
  const w = S.createWorld(REGION, 709);
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 12, quests: { kindling: { done: true }, bread_north: { done: true } } });
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'stone on the lid');
  assert.equal(p.quests.stone_on_the_lid.step, 0);
  const stone = w.objects.find((o) => o.type === 'shrine' && o.quest === 'stone_on_the_lid');
  walkTo(w, 'a', stone, 'search');
  assert.equal(P.countItem(p, 'river_stone'), 0, 'bei Tag nicht');
  w.daylight = 0.1;
  walkTo(w, 'a', stone, 'search');
  assert.equal(P.countItem(p, 'river_stone'), 1);
  assert.equal(p.quests.stone_on_the_lid.step, 1);
  talk(w, 'a', 'wren');
  choose(w, 'a', 'stone like this');
  assert.equal(p.dialog.page, 'sl_wren');
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'Wren read the stone');
  assert.ok(p.quests.stone_on_the_lid.done);
});
