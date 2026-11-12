// Gebete 3 und 4 (2026-11-13, nach Tag 2): doppelt so großer Beutel, die zweite Stadt Cinderford am alten Weg
// nach Westen und darunter das Unending Maze (jeden Tag neu gewürfelte Stockwerke, zufällige Keeper als Bosse).
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor, isRegionId } from '../../content/regions/index.js';
import { ARRIVE } from '../../content/regions/kindle.js';
import { mazeStart, keeperFor, floorLevel, MAZE_FLOORS } from '../../content/regions/maze.js';
import { BAG_SIZE } from '../../content/items.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

const DATE = '2026-11-14';

// Wie der Server: Spieler verlässt das Gebiet über p.travel und wird im Zielgebiet mit seinem Stand geladen.
function hop(w, pid, seed = 5) {
  const p = w.players.get(pid);
  assert.ok(p.travel, 'unterwegs');
  const save = S.removePlayer(w, pid);
  const w2 = S.createWorld(regionFor(save.region, DATE), seed);
  w2.date = DATE;
  S.addPlayer(w2, pid, pid, save);
  return w2;
}

function world(id, seed = 3) {
  const w = S.createWorld(regionFor(id, DATE), seed);
  w.date = DATE;
  return w;
}

const door = (w, to) => w.objects.find((o) => o.type === 'door' && o.to === to);

test('Gebet 3: Der Beutel fasst doppelt so viel, alte Stände bleiben heil', () => {
  assert.equal(BAG_SIZE, 48);
  const w = world('kindle');
  // 30 einzelne Hauben (stapeln nicht): früher wären 6 davon beim Laden verloren gegangen.
  const p = veteran(w, 'a', { bag: Array.from({ length: 30 }, () => ({ id: 'scrap_hood', n: 1 })) });
  assert.equal(P.countItem(p, 'scrap_hood'), 30);
  for (let i = 0; i < 18; i++) P.addItem(p, 'scrap_coat');
  assert.ok(P.bagFull(p));
  assert.equal(P.addItem(p, 'scrap_boots'), 1, 'der 49. Platz gibt es nicht');
});

test('Der alte Weg: Corra erzählt davon, die Tür im Westen führt nach Cinderford, Sorrel begrüßt einen', () => {
  const inside = world('kindle_inside');
  const p = veteran(inside, 'a', { level: 3 });
  p.x = 16; p.y = 27;
  talk(inside, 'a', 'band_corra');
  choose(inside, 'a', 'old road');
  assert.equal(p.quests.old_road_west.step, 0);

  // Draußen in Kindle, am Lagerfeuer: bis ans Ende des Wegs laufen und hinuntergehen
  const save = S.saveFor(inside, 'a');
  const kindle = world('kindle');
  S.addPlayer(kindle, 'a', 'a', { ...save, x: ARRIVE.respawn.x, y: ARRIVE.respawn.y });
  const q = kindle.players.get('a');
  const west = door(kindle, 'cinderford');
  assert.ok(west, 'Tür nach Cinderford');
  actOn(kindle, 'a', west, 'enter');
  for (let i = 0; i < 400 && !q.travel; i++) { if (q.hp < q.maxHp / 2) q.hp = q.maxHp; actOn(kindle, 'a', west, 'enter'); }
  assert.equal(q.travel?.region, 'cinderford');

  const cf = hop(kindle, 'a');
  const r = cf.players.get('a');
  talk(cf, 'a', 'sorrel');
  choose(cf, 'a', 'Corra sent me');
  assert.deepEqual(r.quests.old_road_west, { done: true });
  assert.ok(P.countItem(r, 'cinder_cake') >= 2);
  // Und wieder hinauf: die Stufen führen ans Ende des Wegs in Kindle
  actOn(cf, 'a', door(cf, 'kindle'), 'enter');
  assert.equal(r.travel?.region, 'kindle');
  assert.deepEqual([r.travel.x, r.travel.y], [ARRIVE.west.x, ARRIVE.west.y]);
});

// Kampf wie ein Spieler: wer einen angreift, wird zuerst erledigt, sonst geht es zum Ziel; bei wenig Leben ein Trank.
function delve(w, pid, goal, abilities, ticks = 6000) {
  const p = w.players.get(pid);
  let low = 1;
  for (let i = 0; i < ticks && !goal.dead && !p.travel; i++) {
    const foe = w.mobs.find((m) => !m.dead && m.angryAt === pid) || goal;
    if (p.target?.id !== foe.id || !p.engaged) applyIntent(w, pid, { t: 'act', kind: 'mob', id: foe.id, action: 'attack' });
    if (p.hp < p.maxHp * 0.4) {
      const s = p.bag.findIndex((x) => x && ['bitter_tonic', 'cinder_cake', 'moss_salve'].includes(x.id));
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    }
    // aus angekündigten Flächen treten
    const tele = w.telegraphs.find((t) => t.tiles.some((c) => c.x === p.x && c.y === p.y));
    if (tele) {
      const free = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].map(([a, b]) => ({ x: p.x + a, y: p.y + b }))
        .find((c) => S.walkable(w, c.x, c.y) && !tele.tiles.some((t) => t.x === c.x && t.y === c.y));
      if (free) applyIntent(w, pid, { t: 'walk', x: free.x, y: free.y });
    } else if (abilities.length) {
      for (const ab of abilities) if ((p.cds[ab] || 0) <= w.tick && P.knownAbilities(p).includes(ab)) { applyIntent(w, pid, { t: 'ability', id: ab }); break; }
    }
    if (p.oil < 30) { const s = p.bag.findIndex((x) => x?.id === 'lamp_oil'); if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s }); }
    run(w, 1);
    low = Math.min(low, p.hp / p.maxHp);
  }
  return low;
}

test('The First Turn: hinunter, die Treppe ist zu, der Keeper fällt, dann geht es tiefer', () => {
  const cf = world('cinderford');
  const lvl = 7;
  const p = veteran(cf, 'a', {
    level: lvl, equip: { main: 'brass_shield', head: 'scrap_hood', body: 'scrap_coat' },
    bag: [{ id: 'bitter_tonic', n: 8 }, { id: 'lamp_oil', n: 4 }],
  });
  talk(cf, 'a', 'sorrel');
  choose(cf, 'a', 'Any work');
  assert.equal(p.quests.first_turn.step, 0);
  actOn(cf, 'a', door(cf, 'maze_1'), 'enter');
  assert.equal(p.travel?.region, 'maze_1');

  const m1 = hop(cf, 'a');
  const q = m1.players.get('a');
  assert.deepEqual([q.x, q.y], [mazeStart(1).x, mazeStart(1).y]);
  const keeper = m1.mobs.find((m) => m.type === 'maze_keeper');
  assert.equal(keeper.def.level, floorLevel(1) + 2);
  // Die Treppe hinunter bleibt zu, solange der Keeper steht
  const stairs = door(m1, 'maze_2');
  actOn(m1, 'a', stairs, 'enter');
  assert.ok(!q.travel, 'Treppe ist zu');

  const low = delve(m1, 'a', keeper, ['shield_slam', 'brace', 'bash']);
  assert.ok(keeper.dead, `${keeper.name} fällt`);
  assert.ok(low < 0.9, 'es hat etwas gekostet');
  assert.equal(q.mazeDeep, 2);
  assert.equal(q.quests.first_turn.step, 1);
  assert.ok(P.countItem(q, 'turnstone') >= 1, 'Turnstones vom Keeper');

  actOn(m1, 'a', stairs, 'enter');
  assert.equal(q.travel?.region, 'maze_2');
  assert.deepEqual([q.travel.x, q.travel.y], [mazeStart(2).x, mazeStart(2).y]);
  // Der Spielstand merkt sich die Tiefe
  const save = S.saveFor(m1, 'a');
  assert.equal(save.mazeDeep, 2);
  const m2 = hop(m1, 'a');
  assert.equal(m2.players.get('a').mazeDeep, 2);
});

test('Hesk: Turnstones gegen Ausrüstung, nur was man sich leisten kann', () => {
  const cf = world('cinderford');
  const p = veteran(cf, 'a', { level: 10, bag: [{ id: 'turnstone', n: 4 }] });
  talk(cf, 'a', 'hesk');
  choose(cf, 'a', 'What do turnstones buy');
  const opts = options(cf, 'a');
  assert.ok(opts.some((o) => o.includes('Hood')));
  assert.ok(!opts.some((o) => o.includes('Coat')), 'den Mantel gibt es erst ab 10');
  choose(cf, 'a', 'Hood');
  assert.equal(P.countItem(p, 'delvers_hood'), 1);
  assert.equal(P.countItem(p, 'turnstone'), 0);
});

test('Sorrel schickt einen nur an Stockwerke, die man schon erreicht hat', () => {
  const cf = world('cinderford');
  const p = veteran(cf, 'a', { level: 30 });
  p.mazeDeep = 12; // wie nach einem Sieg über den Keeper des 11. Stockwerks (siehe Test oben für den Spielweg)
  talk(cf, 'a', 'sorrel');
  choose(cf, 'a', 'Send me down');
  const opts = options(cf, 'a');
  for (const want of ['first', '6th', '11th']) assert.ok(opts.some((o) => o.includes(want)), want);
  assert.ok(!opts.some((o) => o.includes('16th')));
  choose(cf, 'a', '11th');
  assert.equal(p.travel?.region, 'maze_11');
  assert.deepEqual([p.travel.x, p.travel.y], [mazeStart(11).x, mazeStart(11).y]);
});

test('Chalk and String: Turn Chalk von Labyrinth-Wesen, Ivy gibt ihre Lampe', () => {
  const cf = world('cinderford');
  const p = veteran(cf, 'a', { level: 26, equip: { main: 'glim_shield', body: 'glim_coat' }, bag: [{ id: 'moss_salve', n: 10 }, { id: 'lamp_oil', n: 10 }] });
  talk(cf, 'a', 'ivy');
  choose(cf, 'a', 'Can I help');
  assert.equal(p.quests.chalk_and_string.step, 0);
  p.mazeDeep = 9;
  talk(cf, 'a', 'sorrel');
  choose(cf, 'a', 'Send me down');
  choose(cf, 'a', '6th');
  let w = hop(cf, 'a');
  const q = w.players.get('a');
  for (let round = 0; round < 40 && q.quests.chalk_and_string.step === 0; round++) {
    const prey = w.mobs.filter((m) => !m.dead && m.type !== 'maze_keeper')
      .sort((a, b) => Math.hypot(a.x - q.x, a.y - q.y) - Math.hypot(b.x - q.x, b.y - q.y))[0];
    if (!prey) { run(w, 50); continue; }
    delve(w, 'a', prey, ['shield_slam', 'bash'], 1500);
    assert.ok(!q.travel, `nicht unterlegen (${JSON.stringify(q.travel)} hp ${q.hp})`);
  }
  assert.equal(q.quests.chalk_and_string.step, 1, 'fünf Stück Turn Chalk');
  q.travel = { region: 'cinderford', x: 21, y: 18 }; // Seil hinauf (Spielweg der Tür ist oben getestet)
  const back = hop(w, 'a');
  talk(back, 'a', 'ivy');
  choose(back, 'a', 'turn chalk');
  assert.equal(P.countItem(back.players.get('a'), 'delvers_lamp'), 1);
});

test('Keeper: jeden Tag andere, faire Vorwarnung, große Keeper alle fünf Stockwerke, unten ist Schluss', () => {
  const names = new Set();
  for (const date of ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']) {
    for (let f = 1; f <= 12; f++) {
      const r = regionFor(`maze_${f}`, date);
      const k = r.mobs.find((m) => m.type === 'maze_keeper').def;
      names.add(k.name);
      assert.ok(k.name.startsWith('The '));
      for (const s of k.specials) assert.ok(s.delay >= 4);
      assert.equal(k.great, f % 5 === 0);
      // gleiches Datum, gleiches Stockwerk: gleiche Karte (Server und Browser sehen dasselbe)
      assert.deepEqual(regionFor(`maze_${f}`, date).tiles, r.tiles);
    }
  }
  assert.ok(names.size > 20, `viele verschiedene Keeper (${names.size})`);
  const rand = () => 0.5;
  assert.ok(keeperFor(10, rand).hp > keeperFor(11, rand).hp, 'der große Keeper ist zäher als der nächste normale');
  assert.equal(floorLevel(MAZE_FLOORS), 99);
  const last = regionFor(`maze_${MAZE_FLOORS}`, DATE);
  assert.ok(!last.objects.some((o) => o.type === 'door' && o.to?.startsWith('maze_')), 'keine Treppe unter dem letzten Stockwerk');
  assert.ok(isRegionId('maze_1') && isRegionId('maze_99') && isRegionId('cinderford'));
  assert.ok(!isRegionId('maze_0') && !isRegionId('maze_100') && !isRegionId('maze_01'));
  assert.ok(QUESTS.deeper_still.steps.some((s) => s.action === 'keeper_5'));
});

test('Alter Spielstand ohne Labyrinth-Tiefe lädt mit Stockwerk 1', () => {
  const w = world('kindle');
  const p = S.addPlayer(w, 'old', 'old', { v: 2, x: 50, y: 53, gold: 5, cls: 'warden', classes: { warden: { level: 4, xp: P.xpForLevel(4) } }, bag: [], equip: {}, quests: {} });
  assert.equal(p.mazeDeep, 1);
  assert.equal(P.saveOf(p).mazeDeep, 1);
});
