// Nacht 3, vom Nightwright (Bogen „The Second Light“): Brindle sieht Lichter am Nordrand. Ein Tragegestell
// mit Kerbholz, Grey Gnawer (Stufe 17), Brot aus Torfrauch, Wren liest das Kerbholz, der Stranger isst das Brot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import { LOOKOUT } from '../../content/lookout.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn, fight } from './helpers.mjs';

const Q = QUESTS.carriers_dark;
const done = { kindling: { done: true }, eyes_north: { done: true } };

test('Carriers in the Dark: Brindle, Gestell, Gnawer, Brot, Wren, Stranger, Brindle', () => {
  const w = S.createWorld(REGION, 331);
  w.daylight = 1;
  // Zu früh: Brindle vertröstet
  veteran(w, 'young', { level: 12, quests: done });
  const brindle = w.npcs.find((n) => n.id === 'brindle');
  const y = w.players.get('young');
  y.x = brindle.x; y.y = brindle.y + 1;
  talk(w, 'young', 'brindle'); choose(w, 'young', 'new up north');
  assert.equal(y.dialog.page, 'cd_early');
  S.removePlayer(w, 'young');

  // Stufe 18 mit Glimsteel, wie man um diese Zeit herumläuft
  const p = veteran(w, 'a', { level: 18, quests: done, equip: { main: 'glim_shield', head: 'glim_hood', feet: 'glim_boots', body: 'brass_coat' }, bag: [{ id: 'moss_salve', n: 10 }] });
  p.x = brindle.x; p.y = brindle.y + 1;
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'new up north');
  assert.equal(p.quests.carriers_dark.step, 0);

  // Das Gestell am Bach westlich der kalten Laterne
  const frame = w.objects.find((o) => o.gives === 'tally_stick');
  assert.ok(frame && frame.x < 39, 'Gestell westlich der kalten Laterne');
  actOn(w, 'a', frame, 'search');
  assert.equal(P.countItem(p, 'tally_stick'), 1);
  assert.equal(p.quests.carriers_dark.step, 1);

  // Gnawer: vier besiegen, bis zwei Rationen im Beutel sind. Das kostet Leben.
  const def = MOBS.grey_gnawer;
  assert.equal(def.level, 17);
  let kills = 0;
  let lost = 0;
  for (let i = 0; i < 40 && !(p.quests.carriers_dark.step >= 3); i++) {
    const g = w.mobs.filter((m) => m.type === 'grey_gnawer' && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!g) { run(w, 20); continue; }
    p.hp = p.maxHp;
    fight(w, 'a', g, ['bash', 'shield_slam', 'stand_fast'], 900);
    assert.ok(g.dead, 'Gnawer fällt');
    if (process.env.PROBE) console.log('gnawer', p.maxHp - p.hp);
    lost += p.maxHp - p.hp;
    kills++;
    run(w, 3);
  }
  assert.ok(kills >= 4, 'mindestens vier Gnawer');
  assert.ok(lost > 0, 'der Sieg kostet Leben');
  assert.equal(p.quests.carriers_dark.step, 3, `Rationen gesammelt nach ${kills} Gnawern`);
  assert.ok(P.countItem(p, 'hollow_ration') >= 2);

  // In Kindle: Wren liest das Kerbholz, der Stranger nimmt das Brot
  talk(w, 'a', 'stranger');
  assert.ok(!options(w, 'a').some((t) => t.includes('dropped this bread')), 'erst zu Wren');
  talk(w, 'a', 'wren'); choose(w, 'a', 'tally stick');
  assert.equal(p.quests.carriers_dark.step, 4);
  const bread = P.countItem(p, 'hollow_ration');
  talk(w, 'a', 'stranger'); choose(w, 'a', 'dropped this bread');
  assert.equal(p.quests.carriers_dark.step, 5);
  assert.equal(P.countItem(p, 'hollow_ration'), bread - 1, 'der Stranger isst eins');
  choose(w, 'a', 'Who are they');

  const xp = p.classes.warden.xp;
  talk(w, 'a', 'brindle'); choose(w, 'a', 'followed the carriers');
  assert.equal(p.quests.carriers_dark.done, true);
  assert.ok(p.classes.warden.xp >= xp + Q.reward.xp);
  assert.equal(P.countItem(p, 'carriers_wraps'), 1);
  talk(w, 'a', 'brindle'); choose(w, 'a', 'carriers again');
  assert.equal(p.dialog.page, 'cd_after');

  // Das Brot heilt
  p.hp = 10;
  const slot = p.bag.findIndex((s) => s?.id === 'hollow_ration');
  applyIntent(w, 'a', { t: 'use', slot });
  run(w, 6);
  assert.ok(p.hp > 10, 'das Brot heilt');
  // Vom Ausguck sieht man die Träger
  assert.ok(LOOKOUT.night.includes('tiny lights move'));
});

test('Gefallen am Nordrand: drei Gnawer für Brindle', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  let date = null;
  for (let d = 1; d <= 300 && !date; d++) {
    const s = new Date(Date.UTC(2026, 10, 14) + d * 864e5).toISOString().slice(0, 10);
    if (favoursFor(s).includes('thin_gnawers')) date = s;
  }
  assert.ok(date, 'der Gefallen kommt vor');
  const w = S.createWorld(REGION, 332);
  w.date = date;
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 20, quests: done, equip: { main: 'glim_shield', body: 'brass_coat' } });
  const gold = p.gold;
  for (let i = 0; i < 3; i++) {
    const g = w.mobs.filter((m) => m.type === 'grey_gnawer' && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    p.hp = p.maxHp;
    fight(w, 'a', g, ['bash', 'shield_slam'], 900);
    assert.ok(g.dead);
  }
  assert.equal(p.gold >= gold + FAVOURS.thin_gnawers.reward.gold, true, 'Gefallen erledigt');
  assert.ok(p.daily.done.includes('thin_gnawers'));
});

test('Carrier\'s Wraps nachbauen (Tinkering 18), Ama und Fen reden über die Träger', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const r = RECIPES.t_carriers_wraps;
  const w = S.createWorld(REGION, 333);
  const p = veteran(w, 'a', { level: 18, quests: { ...done, carriers_dark: { done: true } }, profs: { tinkering: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })) });
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  run(w, 60);
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 't_carriers_wraps', n: 1 });
  assert.equal(P.countItem(p, 'carriers_wraps'), 1);
  talk(w, 'a', 'ama'); choose(w, 'a', 'about the carriers');
  assert.equal(p.dialog.page, 'ama_carriers');
  talk(w, 'a', 'fen'); choose(w, 'a', 'people on the north edge');
  assert.equal(p.dialog.page, 'fen_carriers');
});
