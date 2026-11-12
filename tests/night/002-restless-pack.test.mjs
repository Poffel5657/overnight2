// Nacht 2, vom Nightwright (Bogen): Wölfe wandern aus Hushwood heraus. Ama schickt Spieler ab Stufe 5
// an den Waldrand nordwestlich der Felder, Haskel riecht fremden Rauch im Fell.
// Neues Wesen (Restless Wolf, Stufe 7) füllt die Lücke zwischen Greylingen und Hushwood-Wölfen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import { RECIPES } from '../../content/recipes.js';
import { BEACON_FUEL } from '../../content/dailies.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran } from './helpers.mjs';

const Q = QUESTS.restless_pack;

// Kämpfen wie ein Spieler: angreifen, Fähigkeiten drücken, bei wenig Leben einen Trank trinken.
function brawl(w, pid, mob, abilities, ticks = 900) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  let drank = 0;
  for (let i = 0; i < ticks && !mob.dead; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const slot = p.bag.findIndex((s) => s?.id === 'bitter_tonic');
      if (slot >= 0) { applyIntent(w, pid, { t: 'use', slot }); drank++; }
    }
    applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
  return drank;
}

test('Restless Wolf: Rolle normal auf Stufe 7, zwischen Greyling und Hushwood-Wolf', () => {
  const r = MOBS.restless_wolf, g = MOBS.greyling, wf = MOBS.wolf;
  assert.ok(r.level > g.level && r.level < wf.level);
  assert.ok(r.hp > g.hp && r.hp < wf.hp);
  assert.ok(r.xp > g.xp && r.xp < wf.xp);
  assert.ok(r.special.delay >= 4, 'faire Vorwarnung');
  // Die Wölfe leben am Waldrand, nicht im Dorf
  const homes = REGION.mobs.filter((m) => m.type === 'restless_wolf');
  assert.ok(homes.length >= 5);
  for (const m of homes) assert.ok(Math.hypot(m.x - 49.5, m.y - 49.5) > 15, 'weit genug vom Dorf');
  // Das Fell hat einen Zweck: Quest, Gefallen, Leuchtfeuer und ein Rezept
  assert.ok(BEACON_FUEL.singed_tuft > 0);
  assert.ok(Object.values(RECIPES).some((rc) => rc.inputs.singed_tuft));
});

test('The Restless Pack: Ama, Wölfe am Waldrand, Fell sammeln, Haskel, zurück zu Ama', () => {
  const w = S.createWorld(REGION, 202);
  w.daylight = 1;
  // Zu jung: nur ein Hinweis
  veteran(w, 'y', { level: 3 });
  talk(w, 'y', 'ama');
  choose(w, 'y', 'looking north');
  assert.equal(w.players.get('y').quests.restless_pack, undefined);
  S.removePlayer(w, 'y');

  // Stufe 7 mit Schrott-Ausrüstung, wie man sie dann hat
  const p = veteran(w, 'a', {
    level: 7, cls: 'warden',
    equip: { main: 'scrap_shield', head: 'scrap_hood', body: 'scrap_coat', feet: 'scrap_boots' },
    bag: [{ id: 'bitter_tonic', n: 12 }],
  });
  talk(w, 'a', 'ama');
  choose(w, 'a', 'looking north');
  assert.equal(p.quests.restless_pack.step, 0);
  applyIntent(w, 'a', { t: 'bye' });

  // Zu den Wölfen laufen und kämpfen (Wesen leben jenseits des Bachs, man kommt zu Fuß hin)
  let kills = 0, drank = 0, minHp = p.maxHp;
  for (let round = 0; round < 40 && (p.quests.restless_pack.step < 2) && !p.quests.restless_pack.done; round++) {
    const wolf = w.mobs.filter((m) => m.type === 'restless_wolf' && !m.dead)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!wolf) { run(w, 20); continue; }
    const before = p.hp;
    drank += brawl(w, 'a', wolf, ['bash', 'shield_slam', 'brace']);
    minHp = Math.min(minHp, p.hp, before);
    if (wolf.dead) kills++;
  }
  assert.ok(kills >= Q.steps[0].n, `mindestens ${Q.steps[0].n} Wölfe (${kills})`);
  assert.ok(P.countItem(p, 'singed_tuft') >= Q.steps[1].n, 'genug Fell');
  assert.equal(p.quests.restless_pack.step, 2, 'Kill- und Sammelschritt erledigt');
  assert.ok(drank > 0 || minHp < p.maxHp, 'die Wölfe haben etwas gekostet');

  // Hoch zu Haskel (den Weg nach Norden), dann zurück zu Ama
  talk(w, 'a', 'haskel');
  choose(w, 'a', 'Smell this fur');
  assert.equal(p.quests.restless_pack.step, 3);
  assert.equal(P.countItem(p, 'singed_tuft') >= 0, true);
  const xp = p.classes.warden.xp, gold = p.gold;
  talk(w, 'a', 'ama');
  choose(w, 'a', 'Haskel smelled');
  assert.equal(p.quests.restless_pack.done, true);
  assert.ok(p.classes.warden.xp >= xp + Q.reward.xp);
  assert.ok(p.gold >= gold + Q.reward.gold);
  for (const [id, n] of Object.entries(Q.reward.items)) assert.ok(P.countItem(p, id) >= n || p.equip.feet === id, `${id} bekommen`);

  // Danach erzählt Haskel weiter
  talk(w, 'a', 'haskel');
  assert.ok(options(w, 'a').some((t) => t.includes('Wolves are out')));
});

test('Singed Tuft: Tinkerer machen die Smoke-Ruff Hood, sie gibt Licht', () => {
  const w = S.createWorld(REGION, 203);
  const r = RECIPES.t_ruff_hood;
  const p = veteran(w, 'a', {
    level: 7, profs: { tinkering: { level: r.level, xp: P.xpForLevel(r.level) } },
    bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })),
  });
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 't_ruff_hood', n: 1 });
  run(w, 30);
  assert.equal(P.countItem(p, 'ruff_hood'), 1, 'hergestellt');
  const before = P.lanternBonus(p);
  const slot = p.bag.findIndex((s) => s?.id === 'ruff_hood');
  applyIntent(w, 'a', { t: 'use', slot });
  assert.equal(p.equip.head, 'ruff_hood');
  assert.equal(P.lanternBonus(p), before + ITEMS.ruff_hood.light, 'Licht aus der Kapuze zählt');
});
