// Nacht 4, aus der Abstimmung (rook-masterwork): Old Rook zeigt einem Meisterstücke an seiner guten Bank in der
// Werkstatt. Meisterstücke (master: true) gehen nur dort und erst nach Rooks Quest; dafür braucht es Cinder Iron.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { RECIPES, MASTERWORK_STEP } from '../../content/recipes.js';
import { ITEMS } from '../../content/items.js';
import { TALK } from '../../content/npcs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
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

function craftAt(w, pid, bench, recipe) {
  applyIntent(w, pid, { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 300 && w.players.get(pid).goal; i++) run(w, 1);
  const seen = [];
  applyIntent(w, pid, { t: 'craft', obj: bench.id, recipe, n: 1 });
  run(w, 1, (ev) => seen.push(...ev.filter((e) => e.type === 'log' && e.to === pid).map((e) => e.text)));
  return seen;
}

test("Rook's Masterwork: Cinder Iron, Tansy hat die Zangen, Meisterstück an der guten Bank, zurück zu Rook", () => {
  const master = Object.entries(RECIPES).filter(([, r]) => r.master);
  assert.ok(master.length >= 5, 'mehrere Meisterstücke');
  for (const [, r] of master) assert.equal(r.prof, 'tinkering');
  const hood = master.find(([, r]) => r.out[0] === 'masterwork_hood');
  const [hid, hr] = hood;
  const bag = [{ id: 'cinder_iron', n: 3 + hr.inputs.cinder_iron * 2 }, ...Object.entries(hr.inputs).filter(([id]) => id !== 'cinder_iron').map(([id, n]) => ({ id, n: n * 2 }))];

  // Zu wenig Tinkering: Rook winkt ab
  let w = S.createWorld(REGION, 411);
  w.date = '2026-11-15';
  const low = veteran(w, 'b', { level: 30, profs: { tinkering: { level: 20, xp: P.xpForLevel(20) } } });
  talk(w, 'b', 'rook');
  choose(w, 'b', 'Teach me masterwork');
  assert.equal(low.dialog.page, 'mw_early');
  assert.equal(low.quests.rook_masterwork, undefined);
  S.removePlayer(w, 'b');

  const p = veteran(w, 'a', { level: 34, bag, profs: { tinkering: { level: 35, xp: P.xpForLevel(35) } } });
  // Ohne Rook geht kein Meisterstück, auch nicht an der Bank im Hof
  const yard = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  let log = craftAt(w, 'a', yard, hid);
  assert.ok(log.some((t) => t.includes('good bench')), `im Hof geht es nicht (${log.join(' | ')})`);
  assert.equal(P.countItem(p, 'masterwork_hood'), 0);

  talk(w, 'a', 'rook');
  choose(w, 'a', 'Teach me masterwork');
  assert.equal(p.quests.rook_masterwork.step, 1, 'drei Bars Cinder Iron im Beutel zählen sofort');
  const iron = P.countItem(p, 'cinder_iron');
  talk(w, 'a', 'rook');
  choose(w, 'a', 'Three bars of cinder iron');
  assert.equal(P.countItem(p, 'cinder_iron'), iron - 3);
  assert.equal(p.quests.rook_masterwork.step, 2);

  // In die Werkstatt zu Tansy und an die gute Bank
  const shop = w.objects.find((o) => o.type === 'workshop');
  w = through(w, 'a', shop, 412);
  let q = w.players.get('a');
  const good = w.objects.find((o) => o.type === 'station' && o.master);
  assert.ok(good, 'Rooks gute Bank steht drinnen');
  log = craftAt(w, 'a', good, hid);
  assert.ok(log.some((t) => t.includes('not shown you')), 'erst nach den Zangen');
  talk(w, 'a', 'tansy');
  choose(w, 'a', 'old tongs');
  assert.equal(q.quests.rook_masterwork.step, MASTERWORK_STEP);
  assert.equal(P.countItem(q, 'rooks_tongs'), 1);
  log = craftAt(w, 'a', good, hid);
  assert.equal(P.countItem(q, 'masterwork_hood'), 1, `Meisterstück gemacht (${log.join(' | ')})`);
  assert.equal(q.quests.rook_masterwork.step, 4, 'Meisterstück zählt für die Quest');
  // Das Meisterstück ist besser als das Beste davor
  assert.ok(ITEMS.masterwork_hood.defence > ITEMS.wraithsilk_hood.defence);
  assert.ok(ITEMS.masterwork_shield.power > ITEMS.greyglass_shield.power);

  // Zurück in den Hof zu Rook
  const exit = w.objects.find((o) => o.type === 'door' && o.to === 'kindle' && Math.hypot(o.x - q.x, o.y - q.y) < 8);
  w = through(w, 'a', exit, 413);
  q = w.players.get('a');
  const xp = q.classes.warden.xp;
  talk(w, 'a', 'rook');
  choose(w, 'a', 'My first masterwork');
  assert.equal(q.quests.rook_masterwork.done, true);
  assert.equal(P.countItem(q, 'rooks_tongs'), 0, 'Rook nimmt seine Zangen');
  assert.ok(q.classes.warden.xp >= xp + QUESTS.rook_masterwork.reward.xp);
  talk(w, 'a', 'rook');
  assert.ok(options(w, 'a').some((t) => t.includes('inside now')));
  // Danach geht es an der guten Bank weiter, im Hof weiterhin nicht
  const yard2 = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  log = craftAt(w, 'a', yard2, hid);
  assert.ok(log.some((t) => t.includes('good bench')));
  // Pell ruft es aus
  talk(w, 'a', 'pell');
  assert.match(TALK.pell[w.players.get('a').dialog.page].text, /masterwork/i);
});

test('Nachschlag: Lampwright 32 baut die Cinder Iron Lantern an der Linsenbank, Wren erzählt davon', () => {
  const r = RECIPES.l_cinder_lantern;
  assert.equal(r.prof, 'lampwright');
  assert.ok(!r.master, 'kein Meisterstück, die Linsenbank reicht');
  const w = S.createWorld(REGION, 415);
  const p = veteran(w, 'a', { level: 30, profs: { lampwright: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })) });
  talk(w, 'a', 'wren');
  choose(w, 'a', 'cinder iron');
  assert.equal(p.dialog.page, 'cinder');
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'lampbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 300 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 'l_cinder_lantern', n: 1 });
  run(w, 1);
  assert.equal(P.countItem(p, 'cinder_lantern'), 1);
  assert.ok(ITEMS.cinder_lantern.light > ITEMS.greyglass_lantern.light);
});
