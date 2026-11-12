// Nacht 2, Nachschlag: Choir Wraiths (Stufe 36) in den Seitenschiffen der Drowned Chapel, zwischen den
// Pilgern (32) und dem Lamplighter (40). Gefallen „quiet_the_choir“ bei Tallow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { FAVOURS } from '../../content/dailies.js';
import * as S from '../../shared/sim.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

test('Choir Wraith: Stufe zwischen Pilger und Lamplighter, weit genug vom Boss, Warden 36 gewinnt mit Einsatz', () => {
  const c = MOBS.choir_wraith;
  assert.ok(c.level > MOBS.drowned_pilgrim.level && c.level < MOBS.lamplighter.level);
  assert.ok(c.special.delay >= 4);
  assert.equal(FAVOURS.quiet_the_choir.mob, 'choir_wraith');
  const region = regionFor('drowned_chapel');
  const boss = region.mobs.find((m) => m.type === 'lamplighter');
  for (const m of region.mobs.filter((x) => x.type === 'choir_wraith')) {
    assert.ok(Math.hypot(m.x - boss.x, m.y - boss.y) > MOBS.lamplighter.aggro + c.leash + 2, 'zieht den Boss nicht mit');
  }

  const w = S.createWorld(region, 361);
  const p = veteran(w, 'a', {
    level: 36, equip: { main: 'greyglass_shield', head: 'greyglass_hood', body: 'choir_mantle', feet: 'greyglass_boots', lantern: 'greyglass_lantern' },
    bag: [{ id: 'moss_salve', n: 10 }],
  });
  const wr = w.mobs.find((m) => m.type === 'choir_wraith');
  const lamp = w.mobs.find((m) => m.type === 'lamplighter');
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: wr.id, action: 'attack' });
  let low = p.hp;
  for (let i = 0; i < 1500 && !wr.dead; i++) {
    if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
    if (!p.target && !wr.dead) applyIntent(w, 'a', { t: 'act', kind: 'mob', id: wr.id, action: 'attack' });
    applyIntent(w, 'a', { t: 'ability', id: ['bash', 'shield_slam', 'beacon_slam', 'stand_fast'][i % 4] });
    run(w, 1);
    low = Math.min(low, p.hp);
    assert.notEqual(lamp.angryAt, 'a', 'der Lamplighter bleibt ruhig');
  }
  assert.ok(wr.dead, 'der Wraith fällt');
  assert.ok(low < p.maxHp, 'es hat etwas gekostet');
});

test('Tinkering 30: Wraithsilk Hood aus Wraith-Beute, besser als Greyglass', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const { ITEMS } = await import('../../content/items.js');
  const P = await import('../../shared/player.js');
  const { REGION } = await import('../../content/regions/kindle.js');
  const r = RECIPES.t_wraithsilk_hood;
  assert.ok(MOBS.choir_wraith.drops.some(([id]) => r.inputs[id]), 'Wraiths liefern Zutaten');
  assert.ok(ITEMS.wraithsilk_hood.defence > ITEMS.greyglass_hood.defence);
  assert.ok(ITEMS.wardstone_boots.defence > ITEMS.greyglass_boots.defence);
  const w = S.createWorld(REGION, 362);
  const p = veteran(w, 'a', {
    level: 30, profs: { tinkering: { level: r.level, xp: P.xpForLevel(r.level) } },
    bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })),
  });
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 't_wraithsilk_hood', n: 1 });
  run(w, 30);
  assert.equal(P.countItem(p, 'wraithsilk_hood'), 1);
});
