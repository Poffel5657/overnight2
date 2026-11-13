// Nacht 3, Nachschlag aus Gebet 6: Rooks Werkstatt ist doppelt so groß. Drinnen steht die gute Werkbank,
// und Tansy, Rooks Lehrling, bringt Salvage und Tinkering bei.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { RECIPES } from '../../content/recipes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

test('In die Werkstatt, bei Tansy Tinkering lernen, an der guten Werkbank herstellen', () => {
  const w = S.createWorld(REGION, 351);
  veteran(w, 'a', { level: 4, bag: [{ id: 'scrap', n: 6 }] });
  const shop = w.objects.find((o) => o.type === 'workshop');
  actOn(w, 'a', shop, 'enter');
  const save = S.removePlayer(w, 'a');
  const inside = S.createWorld(regionFor('kindle_inside'), 352);
  const p = S.addPlayer(inside, 'a', 'a', save);
  assert.equal(inside.region.zoneAt(p.x, p.y), 'ROOK\'S WORKSHOP');

  talk(inside, 'a', 'tansy');
  choose(inside, 'a', 'Teach me tinkering');
  assert.ok(p.profs.tinkering, 'Tinkering gelernt');
  const bench = inside.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  assert.ok(bench, 'gute Werkbank drinnen');
  assert.equal(inside.region.zoneAt(bench.x, bench.y), 'ROOK\'S WORKSHOP');
  applyIntent(inside, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  run(inside, 60);
  applyIntent(inside, 'a', { t: 'craft', obj: bench.id, recipe: 't_scrap_hood', n: 1 });
  assert.equal(P.countItem(p, 'scrap_hood'), 1, 'drinnen hergestellt');
  assert.equal(P.countItem(p, 'scrap'), 6 - RECIPES.t_scrap_hood.inputs.scrap);

  // Die Tür hinaus führt vor die Werkstatt
  const door = inside.objects.filter((o) => o.type === 'door').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  actOn(inside, 'a', door, 'enter');
  assert.equal(p.travel?.region, 'kindle');
  assert.ok(Math.hypot(p.travel.x - shop.x, p.travel.y - shop.y) < 5);
});
