// Nacht 8 (Abstimmung „north-road-fires“): The Stone Road. Brindle gibt „Stone by Stone“ (ab 24): Öl mitnehmen,
// durch den Durchgang hinter dem ersten Stein in die Steinstraße, den dritten, fünften und siebten Stein anzünden,
// zurück zu Brindle. Dazu: die Wesen der Straße (Cairn Creeper 27, Ash Moth 30), Torf stechen, Peat Oil, Road Lamp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { ITEMS } from '../../content/items.js';
import { RECIPES } from '../../content/recipes.js';
import { NODES } from '../../content/nodes.js';
import { QUESTS } from '../../content/quests.js';
import { BEACON_FUEL } from '../../content/dailies.js';
import { ROAD } from '../../content/road.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Was man um Stufe 26 bis 30 realistisch trägt
const GEAR = { main: 'greyglass_shield', head: 'wraithsilk_hood', body: 'choir_mantle', feet: 'wardstone_boots', lantern: 'greyglass_lantern' };
const WARDEN = ['anvil_blow', 'last_light', 'beacon_slam', 'shield_slam', 'bash', 'stand_fast', 'lantern_hook'];

function fight(w, pid, mob, ticks = 1500) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0; i++) {
    if (p.hp < p.maxHp * 0.45) {
      const s = p.bag.findIndex((x) => x?.id === 'hearth_salve');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: WARDEN[i % WARDEN.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

test('Die Steinstraße: eigenes Gebiet, Stufe 26 bis 34, faire Angriffe, Steine 2 bis 7', () => {
  const r = regionFor('stone_road');
  assert.equal(r.name, 'THE STONE ROAD');
  const stones = r.objects.filter((o) => o.type === 'signal' && o.stone).map((o) => o.stone);
  assert.deepEqual(stones, [2, 3, 4, 5, 6, 7]);
  for (const id of ['cairn_creeper', 'ash_moth', 'hollow_warden']) {
    const m = MOBS[id];
    for (const sp of m.specials || [m.special]) assert.ok(sp.delay >= 4, `${id} warnt vor`);
    assert.ok(r.mobs.some((x) => x.type === id), `${id} lebt dort`);
  }
  assert.ok(MOBS.cairn_creeper.level < MOBS.ash_moth.level && MOBS.ash_moth.level < MOBS.hollow_warden.level);
  assert.ok(MOBS.ash_moth.xp > MOBS.cairn_creeper.xp && MOBS.cairn_creeper.xp > MOBS.bog_toad.xp - 10, 'Erfahrung passt zur Stufe');
  assert.equal(r.zoneAt(20, 6), 'THE CARRIERS\' REST');
  assert.ok(r.murk > 0 && r.murk < 1, 'es wird nie ganz hell');
});

test('Stone by Stone: Brindle, Öl, der Durchgang, drei Steine, zurück zu Brindle', () => {
  let k = S.createWorld(regionFor('kindle'), 811);
  k.date = '2026-11-19';
  k.daylight = 0;
  // Zu früh: unter 24 nur ein Hinweis, unter 20 bleibt der Durchgang zu
  let p = veteran(k, 'a', { level: 19 });
  const gate = k.objects.find((o) => o.type === 'door' && o.to === 'stone_road');
  actOn(k, 'a', gate, 'enter');
  assert.equal(p.travel, undefined, 'unter 20 zu');
  talk(k, 'a', 'brindle');
  choose(k, 'a', 'fires on the stones');
  assert.equal(p.dialog.page, 'sb_early');
  S.removePlayer(k, 'a');

  p = veteran(k, 'a', { level: 27, equip: GEAR, bag: [{ id: 'hearth_salve', n: 10 }] });
  talk(k, 'a', 'brindle');
  choose(k, 'a', 'fires on the stones');
  assert.equal(p.quests.stone_by_stone.step, 0);
  // Öl kaufen: Marrow verkauft Lampenöl
  p.gold = 100;
  talk(k, 'a', 'marrow');
  choose(k, 'a', 'Show me your wares');
  for (let i = 0; i < 4; i++) applyIntent(k, 'a', { t: 'buy', shop: 'marrow', item: 'lamp_oil' });
  run(k, 2);
  assert.ok(P.countItem(p, 'lamp_oil') >= 3, `Öl gekauft (${P.countItem(p, 'lamp_oil')})`);
  assert.equal(p.quests.stone_by_stone.step, 1, 'drei Flaschen Öl');
  actOn(k, 'a', gate, 'enter');
  assert.equal(p.travel?.region, 'stone_road');

  const w = S.createWorld(regionFor('stone_road'), 812);
  w.date = '2026-11-19';
  w.daylight = 0;
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(k, 'a'));
  assert.equal(w.region.zoneAt(p.x, p.y), 'THE STONE ROAD');
  const lit = [];
  const logs = [];
  // Der Reihe nach alle Steine anzünden; wer im Weg steht, wird bekämpft. Öl aus dem Beutel nachfüllen.
  for (const n of [2, 3, 4, 5, 6, 7]) {
    const stone = w.objects.find((o) => o.stone === n);
    for (let tries = 0; tries < 8 && !stone.lit; tries++) {
      if (p.oil < 30) {
        const s = p.bag.findIndex((x) => x?.id === 'lamp_oil');
        if (s >= 0) { applyIntent(w, 'a', { t: 'use', slot: s }); run(w, 5); }
      }
      applyIntent(w, 'a', { t: 'act', kind: 'object', id: stone.id, action: 'light' });
      for (let i = 0; i < 400 && p.goal; i++) {
        run(w, 1, (ev) => logs.push(...ev.filter((e) => e.type === 'log').map((e) => e.text)));
        const foe = w.mobs.find((m) => !m.dead && m.angryAt === 'a');
        if (foe) { fight(w, 'a', foe); applyIntent(w, 'a', { t: 'act', kind: 'object', id: stone.id, action: 'light' }); }
        if (p.travel) break;
      }
      assert.equal(p.travel, undefined, `überlebt bis zum ${n}. Stein (hp ${p.hp})`);
    }
    assert.ok(stone.lit, `Stein ${n} brennt`);
    lit.push(n);
  }
  assert.equal(p.quests.stone_by_stone.step, 4, 'dritter, fünfter, siebter Stein');
  assert.ok(logs.includes(ROAD.allLit), 'alle hören, dass die ganze Straße brennt');
  assert.ok(lit.length === 6);
  // Ein zweiter Spieler an einem brennenden Stein: zählt trotzdem für seine Quest
  const q = veteran(w, 'b', { level: 30, quests: { kindling: { done: true }, stone_by_stone: { step: 1, n: 0 } } });
  actOn(w, 'b', w.objects.find((o) => o.stone === 3), 'light');
  assert.equal(q.quests.stone_by_stone.step, 2, 'schon brennend zählt');
  // Zurück nach Kindle
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 'enter');
  assert.equal(p.travel?.region, 'kindle');
  k = S.createWorld(regionFor('kindle'), 813);
  const r = S.addPlayer(k, 'a', 'a', S.removePlayer(w, 'a'));
  talk(k, 'a', 'brindle');
  choose(k, 'a', 'seventh stone is burning');
  assert.ok(r.quests.stone_by_stone.done);
  assert.equal(P.countItem(r, 'cairnwalker_cloak'), 1);
  assert.ok(ITEMS.cairnwalker_cloak.defence >= ITEMS.choir_mantle.defence, 'der Mantel lohnt sich');
  talk(k, 'a', 'haskel');
  choose(k, 'a', 'fires on the stones');
  assert.equal(r.dialog.page, 'sb_haskel');
});

test('Cairn Creeper und Ash Moth: mit Ausrüstung von Stufe 28 zu schaffen, und es kostet', () => {
  for (const [id, level] of [['cairn_creeper', 27], ['ash_moth', 30]]) {
    const w = S.createWorld(regionFor('stone_road'), 814);
    w.daylight = 0;
    const m = w.mobs.find((x) => x.type === id);
    for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
    const p = veteran(w, 'a', { level, equip: GEAR, bag: [{ id: 'hearth_salve', n: 6 }] });
    p.x = m.x; p.y = m.y + 2;
    if (!S.walkable(w, p.x, p.y)) p.y = m.y - 2;
    const oil = p.oil;
    let lowest = p.hp;
    applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    for (let i = 0; i < 1500 && !m.dead && p.hp > 0; i++) {
      applyIntent(w, 'a', { t: 'ability', id: WARDEN[i % WARDEN.length] });
      run(w, 1);
      lowest = Math.min(lowest, p.hp);
    }
    assert.ok(m.dead, `${id} fällt`);
    assert.ok(lowest < p.maxHp * 0.95 || p.oil < oil - 5, `${id} kostet etwas (hp ${lowest}/${p.maxHp}, Öl ${p.oil})`);
  }
});

test('Torf stechen (Foraging 33), Peat Oil (Alchemie 31), Road Lamp (Lampwright 36), Torf füttert das Leuchtfeuer', () => {
  const w = S.createWorld(regionFor('stone_road'), 815);
  for (const o of w.mobs) { o.dead = true; o.deadUntil = 1e9; }
  const p = veteran(w, 'a', { level: 34, profs: { foraging: { level: NODES.peat_cut.level, xp: P.xpForLevel(NODES.peat_cut.level) } } });
  const cut = w.objects.find((o) => o.type === 'node' && o.node === 'peat_cut');
  actOn(w, 'a', cut, 'gather');
  run(w, 60);
  assert.ok(P.countItem(p, 'peat_brick') >= 2, `Torf gestochen (${P.countItem(p, 'peat_brick')})`);
  assert.ok(BEACON_FUEL.peat_brick > 0, 'Torf brennt im Leuchtfeuer');

  for (const [rid, station] of [['a_peat_oil', 'still'], ['l_road_lamp', 'lampbench']]) {
    const r = RECIPES[rid];
    const k = S.createWorld(regionFor('kindle'), 816);
    const bag = Object.entries(r.inputs).map(([id, n]) => ({ id, n }));
    const q = veteran(k, 'a', { level: 40, profs: { [r.prof]: { level: r.level, xp: P.xpForLevel(r.level) } }, bag });
    const bench = k.objects.find((o) => o.type === 'station' && o.station === station);
    actOn(k, 'a', bench, 'use');
    applyIntent(k, 'a', { t: 'craft', obj: bench.id, recipe: rid, n: 1 });
    run(k, 30);
    assert.equal(P.countItem(q, r.out[0]), r.out[1], `${r.out[0]} hergestellt`);
  }
  assert.ok(ITEMS.peat_oil.use.oil > ITEMS.lamp_oil.use.oil, 'Peat Oil hält länger');
  assert.ok(ITEMS.road_lamp.light > ITEMS.cinder_lantern.light && ITEMS.road_lamp.light < ITEMS.weir_lamp.light, 'Road Lamp passt zwischen Cinder Iron und Weir Lamp');
  assert.ok(MOBS.ash_moth.drops.some(([id]) => id === 'moth_dust'), 'Mottenstaub von Ash Moths');
  assert.ok(QUESTS.stone_by_stone.reward.items.cairnwalker_cloak);
});

test('Seven Fires for Fen (Nachschlag, niedrige Stufe): nachts auf den Ausguck, Brindle fragen, Fen erzählen', () => {
  const w = S.createWorld(regionFor('kindle'), 817);
  w.date = '2026-11-19';
  w.daylight = 0;
  const p = veteran(w, 'a', { level: 6 });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'fires on the stones');
  assert.equal(p.quests.fens_fires.step, 0);
  actOn(w, 'a', w.objects.find((o) => o.type === 'lookout'), 'use');
  assert.equal(p.quests.fens_fires.step, 1, 'nachts auf dem Ausguck');
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'how many fires');
  talk(w, 'a', 'fen');
  choose(w, 'a', 'counted the fires');
  assert.ok(p.quests.fens_fires.done);
  assert.equal(P.countItem(p, 'bread'), 2);
});

test('Nachschlag: Alchemie 40 bis 48 aus Mottenstaub und Torf, jedes Rezept besser als das davor', () => {
  const heal = (id) => ITEMS[id].use.heal ?? 0;
  for (const rid of ['a_moth_draught', 'a_culvert_draught', 'a_peat_tonic']) {
    const r = RECIPES[rid];
    const k = S.createWorld(regionFor('kindle'), 818);
    const bag = Object.entries(r.inputs).map(([id, n]) => ({ id, n }));
    const q = veteran(k, 'a', { level: 50, profs: { alchemy: { level: r.level, xp: P.xpForLevel(r.level) } }, bag });
    const still = k.objects.find((o) => o.type === 'station' && o.station === 'still');
    actOn(k, 'a', still, 'use');
    applyIntent(k, 'a', { t: 'craft', obj: still.id, recipe: rid, n: 1 });
    run(k, 30);
    assert.equal(P.countItem(q, r.out[0]), r.out[1], `${r.out[0]} gebraut`);
  }
  assert.ok(heal('culvert_draught') > heal('sluice_draught') && heal('peat_tonic') > heal('culvert_draught'), 'heilt mehr als die Stufe davor');
  assert.ok(ITEMS.moth_draught.use.glow > ITEMS.wisp_draught.use.glow, 'leuchtet länger als der Wisplight Draught');
});
