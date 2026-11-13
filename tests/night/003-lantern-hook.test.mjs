// Nacht 3, Dauerauftrag Klassen: Warden Stufe 28 Lantern Hook (neue Wirkung pull), dazu im Nachschlag
// Mender Ember Mend, Flarecaster Noonbrand, Drifter Lampblack Cut (alle Stufe 28).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES } from '../../content/abilities.js';
import { describeAbility } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran, fight } from './helpers.mjs';
import { cheb } from '../../shared/path.js';

const learns = (cls, id, lvl) => CLASSES[cls].abilities.some(([a, l]) => a === id && l === lvl);

test('Stufe 28: jede Klasse lernt etwas Neues, mit Beschreibung', () => {
  assert.ok(learns('warden', 'lantern_hook', 28));
  assert.ok(learns('mender', 'ember_mend', 28));
  assert.ok(learns('flarecaster', 'noonbrand', 28));
  assert.ok(learns('drifter', 'lampblack_cut', 28));
  assert.match(describeAbility('lantern_hook').effect, /dragged to your side/);
  for (const id of ['ember_mend', 'noonbrand', 'lampblack_cut']) assert.ok(describeAbility(id).effect.length > 20);
});

test('Lantern Hook holt einen Wolf aus fünf Feldern vor den Schild und bindet ihn', () => {
  const w = S.createWorld(REGION, 341);
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 28, equip: { main: 'glim_shield' } });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  // Neben den Wolf stellen, aber fünf Felder weit weg, auf ein freies Feld
  let spot = null;
  for (let dx = -5; dx <= 5 && !spot; dx++) for (let dy = -5; dy <= 5 && !spot; dy++) {
    if (cheb(0, 0, dx, dy) === 4 && S.walkable(w, wolf.x + dx, wolf.y + dy)) spot = { x: wolf.x + dx, y: wolf.y + dy };
  }
  p.x = spot.x; p.y = spot.y;
  p.path = []; p.goal = null;
  applyIntent(w, 'a', { t: 'target', id: wolf.id });
  const hp = wolf.hp;
  const oil = p.oil;
  applyIntent(w, 'a', { t: 'ability', id: 'lantern_hook' });
  run(w, 2);
  assert.ok(cheb(p.x, p.y, wolf.x, wolf.y) <= 1, 'Wolf steht neben dem Warden');
  assert.ok(wolf.hp < hp, 'und hat Schaden genommen');
  assert.equal(wolf.angryAt, 'a', 'greift den Warden an');
  assert.equal(p.oil, oil - ABILITIES.lantern_hook.oil);

  // Ein Boss bleibt stehen, wird aber gebunden
  const boss = w.mobs.find((m) => m.def.boss);
  const p2 = veteran(w, 'b', { level: 28, equip: { main: 'glim_shield' } });
  p2.x = boss.x + 3; p2.y = boss.y;
  if (!S.walkable(w, p2.x, p2.y)) { p2.x = boss.x; p2.y = boss.y + 3; }
  const at = { x: boss.x, y: boss.y };
  applyIntent(w, 'b', { t: 'target', id: boss.id });
  applyIntent(w, 'b', { t: 'ability', id: 'lantern_hook' });
  run(w, 1);
  assert.deepEqual({ x: boss.x, y: boss.y }, at, 'Bosse lassen sich nicht ziehen');
  assert.equal(boss.angryAt, 'b');
});

test('Ember Mend heilt den Warden daneben kräftig', () => {
  const w = S.createWorld(REGION, 342);
  const m = veteran(w, 'm', { cls: 'mender', level: 28, equip: { main: 'glim_staff' } });
  const t = veteran(w, 't', { level: 28 });
  t.x = m.x + 1; t.y = m.y;
  t.hp = 20;
  applyIntent(w, 'm', { t: 'ability', id: 'ember_mend' });
  run(w, 2);
  assert.ok(t.hp >= 20 + ABILITIES.ember_mend.heal, 'heilt mindestens den Grundwert');
});

test('Noonbrand und Lampblack Cut: blenden das Ziel und machen ordentlich Schaden', () => {
  const w = S.createWorld(REGION, 343);
  w.daylight = 1;
  for (const [cls, id, main] of [['flarecaster', 'noonbrand', 'glim_lens'], ['drifter', 'lampblack_cut', 'glim_shivs']]) {
    const p = veteran(w, cls, { cls, level: 28, equip: { main } });
    const g = w.mobs.find((m) => m.type === 'grey_gnawer' && !m.dead && !m.angryAt);
    p.x = g.x; p.y = g.y + 1;
    if (!S.walkable(w, p.x, p.y)) { p.x = g.x + 1; p.y = g.y; }
    if (!S.walkable(w, p.x, p.y)) { p.x = g.x - 1; p.y = g.y; }
    applyIntent(w, cls, { t: 'target', id: g.id });
    const hp = g.hp;
    applyIntent(w, cls, { t: 'ability', id });
    run(w, 2);
    assert.ok(g.hp < hp || g.dead, `${id} trifft`);
    assert.ok(g.dead || g.dazzleUntil > w.tick, `${id} blendet`);
    fight(w, cls, g, [id, cls === 'drifter' ? 'slash' : 'flare_bolt']);
    assert.ok(g.dead, `${cls} 28 besiegt einen Gnawer`);
  }
});

test('Mender Stufe 32: Sanctuary heilt und schützt alle im Umkreis', () => {
  const w = S.createWorld(REGION, 344);
  assert.ok(learns('mender', 'sanctuary', 32));
  const m = veteran(w, 'm', { cls: 'mender', level: 32, equip: { main: 'glim_staff' } });
  const a = veteran(w, 'x', { level: 30 });
  const b = veteran(w, 'y', { level: 30 });
  a.x = m.x + 2; a.y = m.y; b.x = m.x; b.y = m.y + 3;
  a.hp = 10; b.hp = 10;
  applyIntent(w, 'm', { t: 'ability', id: 'sanctuary' });
  run(w, 2);
  for (const q of [a, b]) {
    assert.ok(q.hp >= 10 + ABILITIES.sanctuary.heal, 'geheilt');
    assert.ok(q.braceUntil > w.tick, 'geschützt');
  }
});

test('Flarecaster Stufe 32: Corona trifft, blendet und verbrennt alles ringsum', () => {
  const w = S.createWorld(REGION, 345);
  w.daylight = 1;
  assert.ok(learns('flarecaster', 'corona', 32));
  const p = veteran(w, 'f', { cls: 'flarecaster', level: 32, equip: { main: 'glim_lens' } });
  const gs = w.mobs.filter((m) => m.type === 'grey_gnawer').slice(0, 2);
  p.x = gs[0].x; p.y = gs[0].y + 1;
  if (!S.walkable(w, p.x, p.y)) { p.x = gs[0].x + 1; p.y = gs[0].y; }
  const hp = gs[0].hp;
  applyIntent(w, 'f', { t: 'ability', id: 'corona' });
  run(w, 2);
  assert.ok(gs[0].hp < hp, 'getroffen');
  assert.ok(gs[0].dazzleUntil > w.tick, 'geblendet');
  assert.ok(gs[0].burn, 'brennt');
});

test('Stufe 32 für Warden und Drifter: Shield Wall schützt die Gruppe, Vanishing Cut trifft schwer', () => {
  const w = S.createWorld(REGION, 346);
  w.daylight = 1;
  assert.ok(learns('warden', 'shield_wall', 32));
  assert.ok(learns('drifter', 'vanishing_cut', 32));
  const wd = veteran(w, 'w', { level: 32, equip: { main: 'glim_shield' } });
  const f = veteran(w, 'f', { cls: 'flarecaster', level: 30 });
  f.x = wd.x + 2; f.y = wd.y; f.hp = 10;
  applyIntent(w, 'w', { t: 'ability', id: 'shield_wall' });
  run(w, 2);
  assert.ok(f.hp >= 10 + ABILITIES.shield_wall.heal && f.braceUntil > w.tick, 'Gruppe geheilt und geschützt');
  const d = veteran(w, 'd', { cls: 'drifter', level: 32, equip: { main: 'glim_shivs' } });
  const g = w.mobs.find((m) => m.type === 'stone_beetle');
  d.x = g.x; d.y = g.y + 1;
  if (!S.walkable(w, d.x, d.y)) { d.x = g.x + 1; d.y = g.y; }
  applyIntent(w, 'd', { t: 'target', id: g.id });
  const hp = g.hp;
  applyIntent(w, 'd', { t: 'ability', id: 'vanishing_cut' });
  run(w, 2);
  assert.ok(hp - g.hp >= ABILITIES.vanishing_cut.hit[0], 'trifft mindestens den Grundschaden');
});
