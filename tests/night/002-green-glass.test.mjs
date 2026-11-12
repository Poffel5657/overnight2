// Nacht 2, Nachschlag (Bogen): Grüne Glasscherben in Hushwood. Wölfe und Moosgeister tragen sie, Fen will sie
// sehen (Gespräch, Gefallen), Lampwrights schleifen daraus eine Linse für Flarecaster.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { RECIPES } from '../../content/recipes.js';
import { ITEMS } from '../../content/items.js';
import { FAVOURS } from '../../content/dailies.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, options, veteran } from './helpers.mjs';

test('Scherben jagen, Fen zeigen, Linse schleifen', () => {
  const w = S.createWorld(REGION, 301);
  w.daylight = 1;
  const r = RECIPES.l_green_lens;
  const p = veteran(w, 'a', {
    cls: 'warden', level: 16, equip: { main: 'glim_shield', head: 'brass_hood', body: 'glim_coat', feet: 'brass_boots' },
    profs: { lampwright: { level: r.level, xp: P.xpForLevel(r.level) } },
    quests: { kindling: { done: true }, not_from_here: { done: true } },
    bag: [{ id: 'moss_salve', n: 20 }, { id: 'brass_bits', n: 2 }],
  });
  for (let round = 0; round < 80 && P.countItem(p, 'green_shard') < r.inputs.green_shard; round++) {
    const m = w.mobs.filter((x) => (x.type === 'wolf' || x.type === 'moss_spirit') && !x.dead)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, 30); continue; }
    applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    for (let i = 0; i < 600 && !m.dead; i++) {
      if (p.hp < p.maxHp * 0.4) {
        const slot = p.bag.findIndex((s) => s?.id === 'moss_salve');
        if (slot >= 0) applyIntent(w, 'a', { t: 'use', slot });
      }
      applyIntent(w, 'a', { t: 'ability', id: ['bash', 'shield_slam', 'stand_fast'][i % 3] });
      if (!p.target && !m.dead) applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
      run(w, 1);
    }
  }
  assert.ok(P.countItem(p, 'green_shard') >= r.inputs.green_shard, 'genug Scherben');
  assert.equal(FAVOURS.shards_for_fen.item, 'green_shard', 'Fen hat einen Gefallen dafür');

  talk(w, 'a', 'fen');
  assert.ok(options(w, 'a').some((t) => t.includes('green glass')), 'Fen will davon hören');

  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'lampbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 600 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 'l_green_lens', n: 1 });
  run(w, 30);
  assert.equal(P.countItem(p, 'green_lens'), 1, 'Linse geschliffen');
  assert.ok(ITEMS.green_lens.power > ITEMS.brass_lens.power && ITEMS.green_lens.power < ITEMS.glim_lens.power, 'liegt zwischen Messing und Glimsteel');
});
