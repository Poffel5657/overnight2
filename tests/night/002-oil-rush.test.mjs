// Nacht 2, Nachschlag: „The Oil Rush“ (Marrow, ab Stufe 26). Kindle hortet Öl wegen des Lichts im Norden;
// Marrow braucht Lilienzwiebeln aus dem Sinkmarsh, die Bog Toads sitzen darauf.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran } from './helpers.mjs';

const Q = QUESTS.oil_rush;

test('The Oil Rush: Marrow, vier Bog Toads, drei Zwiebeln, Marrow', () => {
  const w = S.createWorld(REGION, 341);
  w.daylight = 1;
  veteran(w, 'y', { level: 20 });
  talk(w, 'y', 'marrow');
  choose(w, 'y', 'Business good');
  assert.equal(w.players.get('y').quests.oil_rush, undefined, 'zu jung');
  S.removePlayer(w, 'y');

  const p = veteran(w, 'a', {
    level: 27, equip: { main: 'greyglass_shield', head: 'greyglass_hood', body: 'shell_coat', feet: 'greyglass_boots', lantern: 'glim_lantern' },
    bag: [{ id: 'moss_salve', n: 15 }],
  });
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'Business good');
  assert.equal(p.quests.oil_rush.step, 0);
  applyIntent(w, 'a', { t: 'bye' });

  let low = p.maxHp;
  for (let round = 0; round < 60 && p.quests.oil_rush.step < 2; round++) {
    const m = w.mobs.filter((x) => x.type === 'bog_toad' && !x.dead)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, 30); continue; }
    applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    for (let i = 0; i < 900 && !m.dead; i++) {
      if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
      applyIntent(w, 'a', { t: 'ability', id: ['bash', 'shield_slam', 'beacon_slam', 'stand_fast', 'bulwark'][i % 5] });
      if (!p.target && !m.dead) applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
      run(w, 1);
      low = Math.min(low, p.hp);
    }
  }
  assert.equal(p.quests.oil_rush.step, 2, 'Toads und Zwiebeln');
  assert.ok(low < p.maxHp, 'die Kröten haben etwas gekostet');
  const xp = p.classes.warden.xp, gold = p.gold;
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'fewer toads');
  assert.equal(p.quests.oil_rush.done, true);
  assert.ok(p.classes.warden.xp >= xp + Q.reward.xp && p.gold >= gold + Q.reward.gold);
  assert.ok(P.countItem(p, 'lily_oil') >= Q.reward.items.lily_oil);
  talk(w, 'a', 'marrow');
  assert.ok(!options(w, 'a').some((t) => t.includes('Business good')));
});

test('Drowned Garden: Foraging 26 im tiefen Sinkmarsh gibt Nightcaps', async () => {
  const { NODES } = await import('../../content/nodes.js');
  const lvl = NODES.drowned_garden.level;
  const w = S.createWorld(REGION, 342);
  w.daylight = 1;
  const g = w.objects.find((o) => o.type === 'node' && o.node === 'drowned_garden');
  assert.equal(REGION.zoneAt(g.x, g.y), 'SINKMARSH');
  const p = veteran(w, 'a', {
    level: 30, equip: { main: 'greyglass_shield', head: 'greyglass_hood', body: 'shell_coat', feet: 'greyglass_boots' },
    bag: [{ id: 'moss_salve', n: 10 }], profs: { foraging: { level: lvl, xp: P.xpForLevel(lvl) } },
  });
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: g.id, action: 'gather' });
  for (let i = 0; i < 800 && (p.goal || p.gather); i++) {
    if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
    run(w, 1);
  }
  assert.ok(P.countItem(p, 'nightcap') >= 1, 'Nightcap gesammelt');
});
