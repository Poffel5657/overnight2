// Nacht 5, aus der Abstimmung („old-mill“): The Old Mill am Bach in Fernmeadow. Jeder mahlt am Mühlstein
// Gerste zu Mehl, Hollis backt daraus Millbread, und nachts liegt fremde Gerste im Trichter („Who Grinds at Night“).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { MILL } from '../../content/mill.js';
import { ITEMS } from '../../content/items.js';
import { objectActions } from '../../shared/sim.js';
import { describeItem } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn, fight } from './helpers.mjs';

// Zum Objekt laufen und handeln, dabei die eigenen Meldungen sammeln.
function actSeen(w, pid, obj, action) {
  const seen = [];
  const grab = (ev) => seen.push(...ev.filter((e) => e.type === 'log' && e.to === pid).map((e) => e.text));
  applyIntent(w, pid, { t: 'act', kind: 'object', id: obj.id, action });
  for (let i = 0; i < 400 && w.players.get(pid).goal; i++) run(w, 1, grab);
  run(w, 2, grab);
  return seen;
}

function enterTavern(w, pid) {
  const tavern = w.objects.find((o) => o.type === 'tavern');
  actOn(w, pid, tavern, 'enter');
  assert.equal(w.players.get(pid).travel?.region, 'kindle_inside');
  const d = S.createWorld(regionFor('kindle_inside'), 541);
  d.date = w.date;
  const q = S.addPlayer(d, pid, pid, S.removePlayer(w, pid));
  return { d, q };
}

function leave(d, pid, seed) {
  const door = d.objects.find((o) => o.type === 'door' && o.to === 'kindle' && d.region.zoneAt(o.x, o.y) === 'THE LANTERN & LARK')
    || d.objects.find((o) => o.type === 'door' && o.to === 'kindle');
  actOn(d, pid, door, 'enter');
  const w = S.createWorld(REGION, seed);
  w.date = d.date;
  const p = S.addPlayer(w, pid, pid, S.removePlayer(d, pid));
  return { w, p };
}

test('Die Mühle steht am Bach, mit Weg von der Straße, Mühlstein und Trichter davor', () => {
  const mill = REGION.objects.find((o) => o.type === 'mill');
  assert.ok(mill);
  assert.equal(REGION.zoneAt(mill.x, mill.y), 'FERNMEADOW');
  // Wasser direkt östlich (das Rad hängt im Bach)
  const east = [...Array(mill.d)].some((_, k) => REGION.tiles[mill.y + k].slice(mill.x + mill.w, mill.x + mill.w + 3).includes('~'));
  assert.ok(east, 'der Bach fließt neben der Mühle');
  // Weg von der Straße bis vor die Tür
  const front = { x: mill.x + 1, y: mill.y + mill.d };
  assert.equal(REGION.tiles[front.y][front.x], '=');
  let y = front.y;
  while (y > 0 && [...REGION.tiles[y]].slice(mill.x - 1, mill.x + 2).includes('=')) y--;
  assert.ok(y <= 49, 'der Weg reicht bis zur Straße');
  const stone = REGION.objects.find((o) => o.type === 'millstone');
  assert.deepEqual(objectActions(stone)[0], ['use', 'Grind']);
  assert.ok(Math.hypot(stone.x - mill.x, stone.y - mill.y) < 6);
  // Wenna steht bei der Mühle, nicht vor der Tür
  const wenna = REGION.npcs.find((n) => n.id === 'wenna');
  assert.ok(Math.hypot(wenna.x - mill.x, wenna.y - mill.y) < 7);
  assert.ok(!(wenna.x === front.x && wenna.y === front.y));
});

test('Mahlen: ohne Gerste nichts, zwei Gerste werden ein Mehl, einmal am Tag gibt es Erfahrung', () => {
  const w = S.createWorld(REGION, 542);
  w.date = '2026-11-16';
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 5, bag: [{ id: 'barley', n: 5 }] });
  const stone = w.objects.find((o) => o.type === 'millstone');
  const xp0 = p.classes.warden.xp;
  const seen = actSeen(w, 'a', stone, 'use');
  assert.equal(P.countItem(p, 'mill_flour'), 1);
  assert.equal(P.countItem(p, 'barley'), 3);
  assert.ok(p.classes.warden.xp > xp0, 'Erfahrung beim ersten Mahlen');
  assert.ok(seen.some((t) => t.includes('flour')), seen.join(' | '));
  const xp1 = p.classes.warden.xp;
  actOn(w, 'a', stone, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, 'mill_flour'), 2);
  assert.equal(p.classes.warden.xp, xp1, 'nur einmal am Tag');
  const none = actSeen(w, 'a', stone, 'use');
  assert.equal(P.countItem(p, 'barley'), 1);
  assert.equal(P.countItem(p, 'mill_flour'), 2, 'eine Gerste reicht nicht');
  // Die Beschreibung der Gerste sagt, was die Mühle daraus macht
  assert.ok(describeItem('barley').uses.some((u) => u.includes('Old Mill')));
  assert.equal(MILL.grinds[0].inputs.barley, 2);
  assert.ok(none.some((t) => t.includes('want barley')), none.join(' | '));
});

test('Who Grinds at Night: Marrow, Krähen-Gerste, mahlen, Hollis backt, nachts der Trichter, zurück zu Marrow', () => {
  let w = S.createWorld(REGION, 543);
  w.date = '2026-11-16';
  w.daylight = 1;
  let p = veteran(w, 'a', { level: 3 });
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'Flour on doorsteps');
  assert.equal(p.quests.who_grinds.step, 0);

  // Krähen auf den Feldern tragen Gerste (oder man kauft sie bei Marrow)
  for (let k = 0; k < 12 && P.countItem(p, 'barley') < 2; k++) {
    const crow = w.mobs.filter((m) => m.type === 'crow' && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!crow) { run(w, 30); continue; }
    fight(w, 'a', crow, ['bash']);
    run(w, 2);
  }
  assert.ok(P.countItem(p, 'barley') >= 2, 'Gerste von Krähen');
  assert.equal(p.quests.who_grinds.step, 1);

  const stone = w.objects.find((o) => o.type === 'millstone');
  actOn(w, 'a', stone, 'use');
  run(w, 2);
  assert.equal(p.quests.who_grinds.step, 2, 'gemahlen');

  // Hollis in der Taverne
  const t = enterTavern(w, 'a');
  talk(t.d, 'a', 'hollis');
  choose(t.d, 'a', 'Is this your flour');
  assert.equal(t.q.quests.who_grinds.step, 3);
  assert.equal(P.countItem(t.q, 'millbread'), 2);
  ({ w, p } = leave(t.d, 'a', 544));

  // Bei Tag ist der Trichter leer
  w.daylight = 1;
  const hopper = w.objects.find((o) => o.type === 'shrine' && o.quest === 'who_grinds');
  const daySeen = actSeen(w, 'a', hopper, 'search');
  assert.equal(P.countItem(p, 'hollow_barley'), 0);
  assert.ok(daySeen.some((x) => x.includes('at night')), daySeen.join(' | '));
  // Nachts: graue Gerste, nach Torf
  w.daylight = 0.1;
  actOn(w, 'a', hopper, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'hollow_barley'), 1);
  assert.equal(p.quests.who_grinds.step, 4);

  w.daylight = 1;
  const xp = p.classes.warden.xp;
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'mill hopper');
  assert.equal(p.quests.who_grinds.done, true);
  assert.ok(p.classes.warden.xp >= xp + QUESTS.who_grinds.reward.xp);
  assert.ok(P.countItem(p, 'mill_flour') >= 2, 'Mehl als Lohn');

  // Danach backt Hollis jederzeit: ein Mehl, zwei Brote
  const t2 = enterTavern(w, 'a');
  const before = P.countItem(t2.q, 'millbread');
  talk(t2.d, 'a', 'hollis');
  choose(t2.d, 'a', 'bake this flour');
  assert.equal(P.countItem(t2.q, 'millbread'), before + 2);
  // Millbread heilt und hilft der Laterne
  assert.ok(ITEMS.millbread.use.heal > ITEMS.bread.use.heal && ITEMS.millbread.use.oil > 0);
});

test('Gerste gibt es auch bei Marrow zu kaufen', () => {
  const w = S.createWorld(REGION, 545);
  const p = veteran(w, 'a', { level: 2, gold: 50 });
  talk(w, 'a', 'marrow');
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'barley', n: 2 });
  run(w, 1);
  assert.equal(P.countItem(p, 'barley'), 2);
});

test('Nachschlag: Die Mühle mahlt grünes Glas zu Grit, Wren gießt daraus die Hollow-Glass Lantern (Lampwright 22)', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const w = S.createWorld(REGION, 546);
  w.date = '2026-11-16';
  const r = RECIPES.l_hollow_glass_lantern;
  const p = veteran(w, 'a', { level: 14, profs: { lampwright: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: [{ id: 'green_shard', n: 6 }, { id: 'brass_bits', n: 2 }, { id: 'survey_notes', n: 1 }] });
  const stone = w.objects.find((o) => o.type === 'millstone');
  actOn(w, 'a', stone, 'use');
  actOn(w, 'a', stone, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, 'glass_grit'), 2, 'zweimal gemahlen');
  assert.equal(P.countItem(p, 'green_shard'), 0);
  talk(w, 'a', 'wren');
  choose(w, 'a', 'grit makes lanterns');
  assert.equal(p.dialog.page, 'grit');
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'lampbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 'l_hollow_glass_lantern', n: 1 });
  run(w, 1);
  assert.equal(P.countItem(p, 'hollow_glass_lantern') + (p.equip.lantern === 'hollow_glass_lantern' ? 1 : 0), 1);
  assert.ok(ITEMS.hollow_glass_lantern.light > ITEMS.glim_lantern.light);
});
