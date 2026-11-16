// Nacht 6, Nachschlag: the Spillway, der Überlauf unter der Zisterne der Sumps (Stufe 46 bis 50). Hesk gibt
// „Below the Weir“ (ab 46, nach „The Drains“): vier Weir Eels, die Tafel der Überlaufwärter, das Old Sluicegate
// (Boss allein mit Einsatz), zurück zu Hesk. Lohn: Spillway Mail (Rüstung für 48 bis 50).
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Was man auf 46 bis 49 realistisch trägt: Meisterschild, Sumpwalker, Weir Lamp, Sluice Draughts
const GEAR = { main: 'masterwork_shield', head: 'sumpwalker_hood', body: 'sumpwalker_coat', feet: 'sumpwalker_boots', lantern: 'weir_lamp' };
const WARDEN = ['lamp_and_anvil', 'hallowed_ground', 'anvil_blow', 'bash', 'shield_slam', 'beacon_slam', 'stand_fast'];

function fight(w, pid, mob, ticks = 2500) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0; i++) {
    if (p.hp < p.maxHp * 0.55) {
      const s = p.bag.findIndex((x) => x?.id === 'sluice_draught');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: WARDEN[i % WARDEN.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

test('Der Spillway: Stufe 46 bis 50, fair angekündigt, eigener Name, unter der Zisterne', () => {
  const eel = MOBS.weir_eel;
  const gate = MOBS.old_sluicegate;
  assert.ok(eel.level === 47 && gate.level === 49);
  assert.ok(eel.special.delay >= 4);
  for (const sp of gate.specials) assert.ok(sp.delay >= 4);
  assert.ok(gate.xp > MOBS.the_undertow.xp && eel.xp > MOBS.silt_crawler.xp, 'Erfahrung wächst mit der Stufe');
  const r = regionFor('sumps');
  const g = r.mobs.find((m) => m.type === 'old_sluicegate');
  assert.equal(r.zoneAt(g.x, g.y), 'THE SPILLWAY');
  assert.equal(r.zoneAt(r.start.x, r.start.y), 'THE SUMPS');
  assert.ok(ITEMS.spillway_mail.defence > ITEMS.sumpwalker_coat.defence, 'die neue Rüstung ist besser als Sumpwalker');
});

test('Below the Weir: Hesk, vier Eels, die Tafel, das Old Sluicegate, zurück zu Hesk', () => {
  let c = S.createWorld(regionFor('cinderford'), 661);
  c.date = '2026-11-17';
  const done = { kindling: { done: true }, the_drains: { done: true } };
  let p = veteran(c, 'a', { level: 44, equip: GEAR, quests: done });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'below the cistern');
  assert.equal(p.dialog.page, 'sw_early', 'unter 46 zu früh');
  S.removePlayer(c, 'a');

  p = veteran(c, 'a', { level: 49, equip: GEAR, quests: done, bag: [{ id: 'sluice_draught', n: 14 }] });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'below the cistern');
  assert.equal(p.quests.below_the_weir.step, 0);
  const grate = c.objects.find((o) => o.type === 'door' && o.to === 'sumps');
  actOn(c, 'a', grate, 'enter');
  assert.equal(p.travel?.region, 'sumps');

  const w = S.createWorld(regionFor('sumps'), 662);
  w.date = '2026-11-17';
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(c, 'a'));
  // Die Wesen oben lassen wir in Ruhe (die sind in 005-sumps gespielt): hinunter in den Spillway
  for (const m of w.mobs) if (!['weir_eel', 'old_sluicegate'].includes(m.type)) { m.dead = true; m.deadUntil = 1e9; }
  const slate = w.objects.find((o) => o.type === 'shrine' && o.quest === 'below_the_weir');
  const draughts = P.countItem(p, 'sluice_draught');
  let lowest = p.maxHp;
  for (let k = 0; k < 4; k++) {
    const m = w.mobs.filter((x) => x.type === 'weir_eel' && !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.weir_eel.respawn + 2); k--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead, `Eel ${k + 1} fällt`);
    assert.equal(w.region.zoneAt(m.x, m.y), 'THE SPILLWAY');
    lowest = Math.min(lowest, p.hp);
  }
  assert.equal(p.quests.below_the_weir.step, 1, 'vier Eels');

  // Die Tafel am Überlauf; wer dabei angegriffen wird, wehrt sich
  for (let k = 0; k < 6 && P.countItem(p, 'spillway_slate') < 1; k++) {
    const foe = w.mobs.find((m) => !m.dead && m.angryAt === 'a');
    if (foe) fight(w, 'a', foe);
    actOn(w, 'a', slate, 'search');
    run(w, 2);
  }
  assert.equal(P.countItem(p, 'spillway_slate'), 1, 'die Tafel hing am Nagel');
  assert.equal(p.quests.below_the_weir.step, 2);

  // Das Old Sluicegate: allein mit Einsatz. Vorher trinkt man sich voll, wie jeder vor einem Boss.
  for (let k = 0; k < 3 && p.hp < p.maxHp * 0.8; k++) {
    applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((x) => x?.id === 'sluice_draught') });
    run(w, 6);
  }
  const gate = w.mobs.find((m) => m.type === 'old_sluicegate');
  for (let k = 0; k < 3 && !gate.dead; k++) {
    fight(w, 'a', gate, 3000);
    lowest = Math.min(lowest, p.hp);
  }
  assert.ok(gate.dead, 'das Sluicegate steht still');
  assert.equal(p.quests.below_the_weir.step, 3);
  const used = draughts - P.countItem(p, 'sluice_draught');
  assert.ok(used >= 1 || lowest < p.maxHp * 0.7, `es kostet etwas (Tränke ${used})`);

  // Hinauf zu Hesk
  const ladder = w.objects.find((o) => o.type === 'door' && o.to === 'cinderford');
  actOn(w, 'a', ladder, 'enter');
  assert.equal(p.travel?.region, 'cinderford');
  c = S.createWorld(regionFor('cinderford'), 663);
  const q = S.addPlayer(c, 'a', 'a', S.removePlayer(w, 'a'));
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'stopped walking');
  assert.equal(q.dialog.page, 'sw_done');
  assert.ok(q.quests.below_the_weir.done);
  assert.equal(P.countItem(q, 'spillway_mail'), 1, 'Lohn: Spillway Mail');
  assert.equal(P.countItem(q, 'spillway_slate'), 0, 'die Tafel bleibt bei Hesk');
});

test('Gefallen „eels_for_hesk“: drei Eels an einem Tag, an dem er dran ist', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  let date = null;
  for (let d = new Date('2026-11-17T12:00:00Z'); !date; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (favoursFor(iso).includes('eels_for_hesk')) date = iso;
  }
  const w = S.createWorld(regionFor('sumps'), 664);
  w.date = date;
  const p = veteran(w, 'a', { level: 49, equip: GEAR, bag: [{ id: 'sluice_draught', n: 10 }] });
  for (const m of w.mobs) if (m.type !== 'weir_eel') { m.dead = true; m.deadUntil = 1e9; }
  const gold = p.gold;
  for (let k = 0; k < FAVOURS.eels_for_hesk.n; k++) {
    const m = w.mobs.filter((x) => x.type === 'weir_eel' && !x.dead)[0];
    if (!m) { run(w, MOBS.weir_eel.respawn + 2); k--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead);
  }
  assert.ok(p.gold >= gold + FAVOURS.eels_for_hesk.reward.gold, `Gefallen am ${date} erledigt`);
});
