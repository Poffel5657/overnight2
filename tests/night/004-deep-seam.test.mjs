// Nacht 4, Nachschlag: Inhalt für Stufe 36 bis 40 in der Oberwelt. Seam Lurker im tiefen Flöz von Copperdeep
// (Stufe 38, Rolle normal) und Flints Quest „The Deep Seam“ (Cinderford, Copperdeep, Brack, zurück zu Flint).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran } from './helpers.mjs';

const GEAR = { main: 'greyglass_shield', head: 'wraithsilk_hood', body: 'greyglass_coat', feet: 'wardstone_boots', lantern: 'greyglass_lantern' };

function fightWithSalves(w, pid, mob, abilities, ticks = 1500) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const s = p.bag.findIndex((x) => x?.id === 'moss_salve');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

test('Seam Lurker: Stufe 38, fair angekündigt, im tiefen Flöz von Copperdeep, frisst Cinder Iron', () => {
  const m = MOBS.seam_lurker;
  assert.equal(m.level, 38);
  assert.ok(m.special.delay >= 4, 'Vorwarnung mindestens 4 Takte');
  assert.ok(m.drops.some(([id]) => id === 'cinder_iron'));
  const homes = REGION.mobs.filter((x) => x.type === 'seam_lurker');
  assert.equal(homes.length, 3);
  for (const h of homes) assert.equal(REGION.zoneAt(h.x, h.y), 'COPPERDEEP');
  // Erfahrung passend zur Kurve: Choir Wraith (36) < Lurker < Lamplighter-Gegend
  assert.ok(m.xp > MOBS.choir_wraith.xp && m.hp > MOBS.choir_wraith.hp);
});

test('The Deep Seam: Flint, vier Lurker (Warden 36 mit Greyglass), Brack, zwei Bars zurück', () => {
  // Bei Flint in Cinderford
  let w = S.createWorld(regionFor('cinderford'), 461);
  w.date = '2026-11-15';
  let p = veteran(w, 'a', { level: 30 });
  talk(w, 'a', 'flint');
  choose(w, 'a', 'good iron come from');
  assert.equal(p.dialog.page, 'ds_early', 'unter 36 zu früh');
  S.removePlayer(w, 'a');
  p = veteran(w, 'a', { level: 36, equip: GEAR, bag: [{ id: 'moss_salve', n: 14 }] });
  talk(w, 'a', 'flint');
  choose(w, 'a', 'good iron come from');
  assert.equal(p.quests.deep_seam.step, 0);

  // Nach Copperdeep (der Weg ist in 002-cinderford-maze gespielt)
  const save = S.removePlayer(w, 'a');
  w = S.createWorld(REGION, 462);
  w.daylight = 1;
  p = S.addPlayer(w, 'a', 'a', save);
  const lurkers = w.mobs.filter((m) => m.type === 'seam_lurker');
  p.x = 96; p.y = 33;
  const salvesBefore = P.countItem(p, 'moss_salve');
  let lowest = p.maxHp;
  for (let k = 0; k < 4; k++) {
    const m = lurkers.filter((x) => !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.seam_lurker.respawn + 2); k--; continue; }
    const start = p.hp;
    fightWithSalves(w, 'a', m, ['anvil_blow', 'bash', 'shield_slam', 'beacon_slam', 'stand_fast']);
    assert.ok(m.dead, `Lurker ${k + 1} fällt`);
    lowest = Math.min(lowest, p.hp, start);
    p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.8)); // Pause am Fels zwischen den Kämpfen
  }
  assert.equal(p.quests.deep_seam.step, 1, 'vier Lurker');
  const used = salvesBefore - P.countItem(p, 'moss_salve');
  assert.ok(used >= 1 || lowest < p.maxHp * 0.6, `es kostet etwas (Tränke ${used}, tiefstes Leben ${lowest}/${p.maxHp})`);

  talk(w, 'a', 'brack');
  choose(w, 'a', 'deep seam');
  assert.ok(p.quests.deep_seam.step >= 2, 'Brack weiß vom Flöz');
  // Cinder Iron aus den Lurkern (weiterkämpfen, bis zwei da sind)
  for (let k = 0; k < 20 && P.countItem(p, 'cinder_iron') < 2; k++) {
    const m = lurkers.filter((x) => !x.dead)[0];
    if (!m) { run(w, MOBS.seam_lurker.respawn + 2); continue; }
    p.x = m.x - 1; p.y = m.y; if (!S.walkable(w, p.x, p.y)) p.y = m.y - 1;
    p.hp = p.maxHp;
    fightWithSalves(w, 'a', m, ['anvil_blow', 'bash', 'shield_slam']);
    run(w, 2);
  }
  assert.ok(P.countItem(p, 'cinder_iron') >= 2, 'Lurker tragen Cinder Iron');
  assert.equal(p.quests.deep_seam.step, 3);

  // Zurück zu Flint
  const c = S.createWorld(regionFor('cinderford'), 463);
  const q = S.addPlayer(c, 'a', 'a', P.saveOf(p));
  const xp = q.classes.warden.xp;
  talk(c, 'a', 'flint');
  choose(c, 'a', 'Two bars');
  assert.equal(q.quests.deep_seam.done, true);
  assert.ok(q.classes.warden.xp >= xp + QUESTS.deep_seam.reward.xp);
});

test('Unter Stufe und mit älterer Ausrüstung kostet ein Lurker deutlich mehr', () => {
  const lost = (level, equip) => {
    let sum = 0;
    for (let k = 0; k < 6; k++) {
      const w = S.createWorld(REGION, 470 + k);
      w.daylight = 1;
      const p = veteran(w, 'a', { level, equip });
      const m = w.mobs.find((x) => x.type === 'seam_lurker');
      p.x = m.x - 1; p.y = m.y; if (!S.walkable(w, p.x, p.y)) p.y = m.y - 1;
      const hp = p.hp;
      fightWithSalves(w, 'a', m, ['bash', 'shield_slam', 'beacon_slam'], 900);
      sum += (hp - Math.max(0, p.hp)) / hp;
    }
    return sum / 6;
  };
  const low = lost(26, { main: 'glim_shield', body: 'glim_coat' });
  const high = lost(36, GEAR);
  assert.ok(low > high, `Stufe 26 verliert mehr (${Math.round(low * 100)} % gegen ${Math.round(high * 100)} %)`);
  assert.ok(high > 0.15, 'auch auf Stufe 36 kostet es Leben');
});

test('Gefallen: zwei Lurker für Flint, ein Cinder Iron für Rook (am Brett in Kindle)', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  const find = (id) => {
    for (let d = 1; d <= 400; d++) {
      const s = new Date(Date.UTC(2026, 10, 14) + d * 864e5).toISOString().slice(0, 10);
      if (favoursFor(s).includes(id)) return s;
    }
    return null;
  };
  const killDay = find('lurkers_for_flint');
  assert.ok(killDay, 'der Lurker-Gefallen kommt vor');
  let w = S.createWorld(REGION, 465);
  w.date = killDay;
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 36, equip: GEAR, bag: [{ id: 'moss_salve', n: 10 }] });
  const gold = p.gold;
  for (let k = 0; k < FAVOURS.lurkers_for_flint.n; k++) {
    const m = w.mobs.filter((x) => x.type === 'seam_lurker' && !x.dead)[0];
    p.x = m.x - 1; p.y = m.y; if (!S.walkable(w, p.x, p.y)) p.y = m.y - 1;
    p.hp = p.maxHp;
    fightWithSalves(w, 'a', m, ['anvil_blow', 'bash', 'shield_slam']);
    assert.ok(m.dead);
  }
  assert.ok(p.daily.done.includes('lurkers_for_flint'));
  assert.ok(p.gold >= gold + FAVOURS.lurkers_for_flint.reward.gold);

  const bringDay = find('iron_for_rook');
  assert.ok(bringDay, 'der Eisen-Gefallen kommt vor');
  w = S.createWorld(REGION, 466);
  w.date = bringDay;
  const q = veteran(w, 'b', { level: 10, bag: [{ id: 'cinder_iron', n: 1 }] });
  const board = w.objects.find((o) => o.type === 'board');
  applyIntent(w, 'b', { t: 'act', kind: 'object', id: board.id, action: 'read' });
  for (let i = 0; i < 400 && q.goal; i++) run(w, 1);
  const g2 = q.gold;
  applyIntent(w, 'b', { t: 'favour', id: 'iron_for_rook' });
  run(w, 1);
  assert.equal(P.countItem(q, 'cinder_iron'), 0);
  assert.equal(q.gold, g2 + FAVOURS.iron_for_rook.reward.gold);
});
