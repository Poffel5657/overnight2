// Die Taverne „The Lantern & Lark“: Weg hinein, Truhe (übersteht Speichern), Bett (ausgeruht),
// Hollis verkauft Essen, Oswins Trommel-Quest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { INN, STASH_SIZE } from '../../content/tavern.js';
import { MOBS } from '../../content/mobs.js';
import { QUESTS } from '../../content/quests.js';
import { buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn, fight } from './helpers.mjs';

// Von Kindle in die Taverne laufen und dort weiterspielen
function enterTavern(w, pid) {
  const tavern = w.objects.find((o) => o.type === 'tavern');
  actOn(w, pid, tavern, 'enter');
  const p = w.players.get(pid);
  assert.equal(p.travel?.region, 'kindle_inside');
  const save = S.removePlayer(w, pid);
  const d = S.createWorld(regionFor('kindle_inside'), 61);
  const q = S.addPlayer(d, pid, pid, save);
  assert.equal(d.region.zoneAt(q.x, q.y), 'THE LANTERN & LARK');
  return d;
}

test('Truhe: einlagern, holen, übersteht Speichern; nur in der Taverne', () => {
  const w = S.createWorld(REGION, 60);
  const p = veteran(w, 'a', { level: 5, gold: 50, bag: [{ id: 'scrap', n: 12 }, { id: 'brass_hood', n: 1 }] });
  // Draußen geht nichts
  applyIntent(w, 'a', { t: 'stash', op: 'put', slot: 0, n: 5 });
  assert.equal(P.countItem(p, 'scrap'), 12);

  const d = enterTavern(w, 'a');
  const chest = d.objects.find((o) => o.type === 'stash');
  const evs = [];
  applyIntent(d, 'a', { t: 'act', kind: 'object', id: chest.id, action: 'open' });
  for (let i = 0; i < 400 && d.players.get('a').goal; i++) run(d, 1, (e) => evs.push(...e));
  assert.ok(evs.some((e) => e.type === 'window' && e.win === 'stash'), 'Truhen-Fenster geht auf');

  const q = d.players.get('a');
  const scrapSlot = q.bag.findIndex((s) => s?.id === 'scrap');
  applyIntent(d, 'a', { t: 'stash', op: 'put', slot: scrapSlot, n: 5 });
  const hoodSlot = q.bag.findIndex((s) => s?.id === 'brass_hood');
  applyIntent(d, 'a', { t: 'stash', op: 'put', slot: hoodSlot, n: 1 });
  assert.equal(P.countItem(q, 'scrap'), 7);
  assert.equal(P.countItem(q, 'brass_hood'), 0);
  assert.deepEqual(q.stash.map((s) => [s.id, s.n]), [['scrap', 5], ['brass_hood', 1]]);

  // Speichern und neu laden
  const save = S.removePlayer(d, 'a');
  const d2 = S.createWorld(regionFor('kindle_inside'), 62);
  const r = S.addPlayer(d2, 'a', 'a', JSON.parse(JSON.stringify(save)));
  assert.deepEqual(r.stash.map((s) => [s.id, s.n]), [['scrap', 5], ['brass_hood', 1]]);
  applyIntent(d2, 'a', { t: 'stash', op: 'take', slot: 0, n: 5 });
  assert.equal(P.countItem(r, 'scrap'), 12);
  assert.equal(r.stash.length, 1);

  // Alte Spielstände ohne Truhe laden leer; Unsinn wird verworfen
  const old = S.addPlayer(d2, 'b', 'b', { v: 2, cls: 'warden', classes: { warden: { level: 1, xp: 0 } } });
  assert.deepEqual(old.stash, []);
  assert.equal(old.rested, 0);
  const junk = S.addPlayer(d2, 'c', 'c', { v: 2, stash: [{ id: 'nope', n: 3 }, ...Array.from({ length: 60 }, () => ({ id: 'brass_hood', n: 1 }))] });
  assert.equal(junk.stash.length, STASH_SIZE);
});

test('Hollis verkauft Stew, das Bett kostet Gold, füllt auf und macht ausgeruht', () => {
  const w = S.createWorld(REGION, 63);
  veteran(w, 'a', { level: 14, gold: 40, equip: { main: 'glim_shield', body: 'glim_coat' } });
  const d = enterTavern(w, 'a');
  const p = d.players.get('a');

  talk(d, 'a', 'hollis');
  choose(d, 'a', 'Can I get a bed');
  talk(d, 'a', 'hollis');
  const evs = [];
  choose(d, 'a', 'What have you got');
  run(d, 1, (e) => evs.push(...e));
  applyIntent(d, 'a', { t: 'buy', shop: 'hollis', item: 'hearth_stew', n: 1 });
  run(d, 1);
  assert.equal(P.countItem(p, 'hearth_stew'), 1);
  assert.equal(p.gold, 40 - buyPrice(ITEMS.hearth_stew.value));

  p.hp = 5; p.oil = 10;
  const gold = p.gold;
  const bed = d.objects.find((o) => o.type === 'inn_bed');
  actOn(d, 'a', bed, 'rest');
  assert.equal(p.gold, gold - INN.price);
  assert.equal(p.hp, p.maxHp);
  assert.equal(p.oil, 100);
  assert.equal(p.rested, INN.rested);

  // Ohne Gold kein Bett
  p.gold = INN.price - 1;
  p.hp = 5;
  actOn(d, 'a', bed, 'rest');
  assert.equal(p.hp, 5);
  assert.equal(p.gold, INN.price - 1);
});

test('Ausgeruht: Siege geben mehr Erfahrung, bis der Vorrat leer ist', () => {
  const w = S.createWorld(REGION, 64);
  w.daylight = 0;
  const p = veteran(w, 'a', { level: 14, equip: { main: 'glim_shield', head: 'brass_hood', body: 'glim_coat', feet: 'brass_boots' } });
  p.rested = 1; // wie nach einer Nacht, nur kürzer (Zahlen kommen aus content/)
  const kill = () => {
    const wolf = w.mobs.find((m) => m.type === 'wolf' && !m.dead);
    p.x = wolf.x; p.y = wolf.y + 1;
    if (!S.walkable(w, p.x, p.y)) p.y = wolf.y - 1;
    const xp = p.classes.warden.xp;
    fight(w, 'a', wolf, ['bash', 'shield_slam', 'stand_fast']);
    assert.ok(wolf.dead);
    p.hp = p.maxHp;
    return p.classes.warden.xp - xp;
  };
  assert.equal(kill(), Math.round(MOBS.wolf.xp * (1 + INN.bonus)), 'ausgeruht');
  assert.equal(p.rested, 0);
  assert.equal(kill(), MOBS.wolf.xp, 'danach normal');
});

test('Oswins Trommel: zwei Wolfsfelle bringen Ale und Stew', () => {
  const w = S.createWorld(REGION, 65);
  veteran(w, 'a', { level: 12, bag: [{ id: 'wolf_pelt', n: 2 }] });
  const d = enterTavern(w, 'a');
  const p = d.players.get('a');
  talk(d, 'a', 'band_oswin');
  choose(d, 'a', 'What happened to your drum');
  assert.equal(p.quests.skin_for_the_drum.step, 1, 'Felle schon im Beutel');
  talk(d, 'a', 'band_oswin');
  choose(d, 'a', 'Two wolf pelts');
  assert.equal(p.quests.skin_for_the_drum.done, true);
  assert.equal(P.countItem(p, 'wolf_pelt'), 0);
  assert.equal(P.countItem(p, 'ember_ale'), QUESTS.skin_for_the_drum.reward.items.ember_ale);
});
