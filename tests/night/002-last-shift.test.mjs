// Nacht 2, Nachschlag: The Old Foreman, der verlassene Vorarbeiter von Copperdeep (Einzel-Boss Stufe 21).
// Brack schickt Spieler ab Stufe 18 (nach „The Singing Seam“) hin; sein Hauptbuch erzählt von Glimmer,
// der früher nach Norden ging, „for the Hollow fire“. Der Stranger reagiert darauf.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran } from './helpers.mjs';

const Q = QUESTS.last_shift;
const GEAR = { main: 'glim_shield', head: 'glim_hood', body: 'glim_coat', feet: 'glim_boots', lantern: 'brass_lantern' };

// Kämpfen mit Tränken; nach Ankündigungen einen Schritt zur Seite (wie ein aufmerksamer Spieler)
function bossFight(w, pid, mob, abilities, potion, ticks = 3000) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  let dodged = 0;
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0; i++) {
    const t = w.telegraphs.find((x) => x.mob === mob.id && x.tiles.some((c) => c.x === p.x && c.y === p.y));
    if (t && t.at - w.tick <= 4 && !p.path.length) {
      const free = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]]
        .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
        .find((c) => S.walkable(w, c.x, c.y) && !t.tiles.some((tt) => tt.x === c.x && tt.y === c.y));
      if (free) { S.walkTo(w, pid, free.x, free.y); dodged++; }
    } else if (!p.path.length && !p.engaged) {
      applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    }
    if (p.hp < p.maxHp * 0.45) {
      const slot = p.bag.findIndex((s) => s?.id === potion);
      if (slot >= 0) applyIntent(w, pid, { t: 'use', slot });
    }
    applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    run(w, 1);
  }
  return { dodged };
}

test('The Old Foreman: Einzel-Boss mit eigenen Angriffen, fairer Vorwarnung, lebt in Copperdeep', () => {
  const m = MOBS.old_foreman;
  assert.ok(m.specials.length >= 2 && m.specials.every((s) => s.delay >= 4));
  const home = REGION.mobs.find((x) => x.type === 'old_foreman');
  assert.equal(REGION.zoneAt(home.x, home.y), 'COPPERDEEP');
  assert.ok(m.xp > MOBS.pit_worm.xp * 4, 'lohnt sich');
});

test('The Last Shift: Brack, allein gegen den Foreman (Stufe 21, Glimsteel), Hauptbuch, Brack, Stranger', () => {
  const w = S.createWorld(REGION, 281);
  w.daylight = 1;
  const p = veteran(w, 'a', {
    level: 21, equip: GEAR, bag: [{ id: 'moss_salve', n: 12 }],
    quests: { kindling: { done: true }, singing_seam: { done: true } },
  });
  talk(w, 'a', 'brack');
  choose(w, 'a', 'north-east');
  assert.equal(p.quests.last_shift.step, 0);
  applyIntent(w, 'a', { t: 'bye' });

  const boss = w.mobs.find((m) => m.type === 'old_foreman');
  const start = w.tick;
  bossFight(w, 'a', boss, ['bash', 'shield_slam', 'beacon_slam', 'stand_fast', 'brace'], 'moss_salve');
  const drank = 12 - P.countItem(p, 'moss_salve');
  assert.ok(boss.dead, 'der Foreman fällt');
  const secs = (w.tick - start) * 0.3;
  assert.ok(drank >= 1, `es kostet Tränke (${drank})`);
  assert.ok(secs > 30 && secs < 240, `ein ordentlicher Kampf (${Math.round(secs)} s)`);
  run(w, 2);
  assert.equal(p.quests.last_shift.step, 2, 'Hauptbuch dabei');

  talk(w, 'a', 'brack');
  const xp = p.classes.warden.xp;
  choose(w, 'a', 'Foreman is resting');
  assert.equal(p.quests.last_shift.done, true);
  assert.ok(p.classes.warden.xp >= xp + Q.reward.xp);
  choose(w, 'a', 'Hollow fire');
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'Hollow fire');
  assert.equal(p.dialog.page, 'hollow');
});

test('Zu jung oder ohne Ausrüstung ist der Foreman zu viel', () => {
  const w = S.createWorld(REGION, 282);
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 14, equip: { main: 'brass_shield', lantern: 'brass_lantern' }, bag: [{ id: 'bitter_tonic', n: 3 }] });
  talk(w, 'a', 'brack');
  assert.ok(!options(w, 'a').some((t) => t.includes('north-east')) || (choose(w, 'a', 'north-east'), p.quests.last_shift === undefined));
  applyIntent(w, 'a', { t: 'bye' });
  const boss = w.mobs.find((m) => m.type === 'old_foreman');
  bossFight(w, 'a', boss, ['bash', 'shield_slam', 'brace'], 'bitter_tonic', 2000);
  assert.ok(!boss.dead, 'Stufe 14 ohne Rüstung schafft ihn nicht');
});

test('Gefallen foreman_again: zu zweit ist der Foreman schneller erledigt', async () => {
  const { FAVOURS } = await import('../../content/dailies.js');
  const f = FAVOURS.foreman_again;
  assert.equal(f.type, 'kill');
  assert.equal(f.mob, 'old_foreman');
  const time = (n) => {
    const w = S.createWorld(REGION, 283);
    w.daylight = 1;
    const ids = ['a', 'b'].slice(0, n);
    for (const id of ids) veteran(w, id, { level: 21, equip: GEAR, bag: [{ id: 'moss_salve', n: 12 }] });
    const boss = w.mobs.find((m) => m.type === 'old_foreman');
    for (const id of ids) applyIntent(w, id, { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
    let t = 0;
    for (; t < 3000 && !boss.dead; t++) {
      for (const id of ids) {
        const p = w.players.get(id);
        if (p.hp < p.maxHp * 0.45) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, id, { t: 'use', slot: s }); }
        if (!p.target && !boss.dead) applyIntent(w, id, { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
        applyIntent(w, id, { t: 'ability', id: ['bash', 'shield_slam', 'beacon_slam', 'stand_fast'][t % 4] });
      }
      run(w, 1);
    }
    assert.ok(boss.dead, `${n} Spieler schaffen ihn`);
    return t;
  };
  assert.ok(time(2) < time(1) * 0.8, 'zu zweit deutlich schneller');
});

test('Old Shaft: Salvage 26 holt Glimmer neben dem Foreman, darunter geht nichts', async () => {
  const { NODES } = await import('../../content/nodes.js');
  const lvl = NODES.old_shaft.level;
  const w = S.createWorld(REGION, 284);
  w.daylight = 1;
  const shaft = w.objects.find((o) => o.type === 'node' && o.node === 'old_shaft');
  assert.equal(REGION.zoneAt(shaft.x, shaft.y), 'COPPERDEEP');
  const low = veteran(w, 'b', { level: 30, equip: GEAR, profs: { salvage: { level: lvl - 1, xp: P.xpForLevel(lvl - 1) } } });
  applyIntent(w, 'b', { t: 'act', kind: 'object', id: shaft.id, action: 'gather' });
  for (let i = 0; i < 600 && (low.goal || low.gather); i++) run(w, 1);
  assert.equal(P.countItem(low, 'glimmer'), 0, 'zu wenig Salvage');
  S.removePlayer(w, 'b');
  const p = veteran(w, 'a', { level: 30, equip: GEAR, bag: [{ id: 'moss_salve', n: 10 }], profs: { salvage: { level: lvl, xp: P.xpForLevel(lvl) } } });
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: shaft.id, action: 'gather' });
  for (let i = 0; i < 600 && (p.goal || p.gather); i++) {
    if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
    run(w, 1);
  }
  assert.ok(P.countItem(p, 'glimmer') >= 1, 'Glimmer aus dem alten Schacht');
});
