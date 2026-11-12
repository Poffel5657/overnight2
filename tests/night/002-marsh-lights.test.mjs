// Nacht 2, Nachschlag: „Lights That Eat Lights“ (Mothwick, ab Stufe 23, nachts). Will-o'-wisps im Sinkmarsh
// tragen Wisp Cores, deren Licht nach Norden zieht. Füllt die Lücke 22 bis 28.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran } from './helpers.mjs';

const Q = QUESTS.marsh_lights;

test('Lights That Eat Lights: nachts Irrlichter, Kerne, Mothwick', () => {
  const w = S.createWorld(REGION, 321);
  w.daylight = 0;
  const p = veteran(w, 'a', {
    cls: 'flarecaster', level: 24,
    equip: { main: 'glim_lens', head: 'glim_hood', body: 'shell_coat', feet: 'glim_boots', lantern: 'glim_lantern' },
    bag: [{ id: 'moss_salve', n: 15 }, { id: 'lily_oil', n: 8 }],
  });
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'worried');
  assert.equal(p.quests.marsh_lights.step, 0);
  applyIntent(w, 'a', { t: 'bye' });

  const rot = ['sear', 'cinder_brand', 'flare_bolt', 'glare', 'starfall'];
  let kills = 0, low = p.maxHp + 100;
  for (let round = 0; round < 60 && p.quests.marsh_lights.step < 2; round++) {
    const m = w.mobs.filter((x) => x.type === 'will_o_wisp' && !x.dead)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, 30); continue; }
    applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    for (let i = 0; i < 600 && !m.dead; i++) {
      if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
      else if (p.oil < 30) { const s = p.bag.findIndex((x) => x?.id === 'lily_oil'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
      applyIntent(w, 'a', { t: 'ability', id: rot[i % rot.length] });
      if (!p.target && !m.dead) applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
      run(w, 1);
      low = Math.min(low, p.hp + p.oil);
    }
    if (m.dead) kills++;
  }
  assert.ok(kills >= Q.steps[0].n);
  assert.equal(p.quests.marsh_lights.step, 2, 'Kerne gesammelt');
  assert.ok(low < p.maxHp + 100, 'die Irrlichter haben Leben oder Öl gekostet');

  const xp = p.classes.flarecaster.xp;
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'wisp cores');
  assert.equal(p.quests.marsh_lights.done, true);
  assert.ok(p.classes.flarecaster.xp >= xp + Q.reward.xp);
});

test('Bei Tag und unter Stufe 23 bietet Mothwick die Quest nicht an', () => {
  const w = S.createWorld(REGION, 322);
  w.daylight = 0;
  veteran(w, 'a', { level: 20 });
  talk(w, 'a', 'mothwick');
  assert.ok(!options(w, 'a').some((t) => t.includes('worried')));
  w.daylight = 1;
  veteran(w, 'b', { level: 25 });
  talk(w, 'b', 'mothwick');
  assert.ok(!options(w, 'b').some((t) => t.includes('worried')));
});

test('Wisp Cores werden zum Wisplight Draught (Alchemie 24)', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const r = RECIPES.a_wisp_draught;
  const w = S.createWorld(REGION, 323);
  w.daylight = 0;
  const p = veteran(w, 'a', {
    level: 24, profs: { alchemy: { level: r.level, xp: P.xpForLevel(r.level) } },
    bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })),
  });
  const still = w.objects.find((o) => o.type === 'station' && o.station === 'still');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: still.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: still.id, recipe: 'a_wisp_draught', n: 1 });
  run(w, 30);
  assert.equal(P.countItem(p, 'wisp_draught'), 1);
  p.oil = 10;
  applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((s) => s?.id === 'wisp_draught') });
  run(w, 2);
  assert.ok(p.oil >= 50 && p.glowUntil > w.tick, 'Öl und Glühen');
});
