// Nacht 7, Nachschlag: the Overflow Run unter dem Spillway (Stufe 50 bis 54). Hesk gibt „Overflow Runs North“
// (ab 50, nach „Below the Weir“): fünf Culvert Leeches, die Inschrift am Tor nach Norden, the Pumpwarden (Boss allein
// mit Einsatz), zurück zu Hesk. Lohn: Culvert Boots. Run Iron wird bei Tinkering 42/44 zu Hood und Coat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Was man auf 50 bis 53 realistisch trägt: Meisterschild, Spillway Mail (Lohn von Tag 6), Sumpwalker, Weir Lamp
const GEAR = { main: 'masterwork_shield', head: 'sumpwalker_hood', body: 'spillway_mail', feet: 'sumpwalker_boots', lantern: 'weir_lamp' };
const WARDEN = ['dawn_vow', 'oath_of_embers', 'lamp_and_anvil', 'hallowed_ground', 'anvil_blow', 'bash', 'shield_slam', 'beacon_slam', 'stand_fast'];

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

test('Der Overflow Run: Stufe 50 bis 54, fair angekündigt, eigener Name, unter dem Spillway', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const leech = MOBS.culvert_leech;
  const boss = MOBS.the_pumpwarden;
  assert.ok(leech.level === 52 && boss.level === 54);
  assert.ok(leech.special.delay >= 4);
  for (const sp of boss.specials) assert.ok(sp.delay >= 4);
  assert.ok(boss.xp > MOBS.old_sluicegate.xp && leech.xp > MOBS.weir_eel.xp, 'Erfahrung wächst mit der Stufe');
  const r = regionFor('sumps');
  for (const m of r.mobs.filter((x) => ['culvert_leech', 'the_pumpwarden'].includes(x.type))) assert.equal(r.zoneAt(m.x, m.y), 'THE OVERFLOW RUN');
  assert.ok(ITEMS.culvert_coat.defence > ITEMS.spillway_mail.defence && ITEMS.culvert_hood.defence > ITEMS.sumpwalker_hood.defence);
  assert.ok(RECIPES.t_culvert_hood.inputs.run_iron && RECIPES.t_culvert_coat.inputs.run_iron, 'Run Iron hat einen Zweck');
});

test('Overflow Runs North: Hesk, fünf Leeches, das Tor, the Pumpwarden, zurück zu Hesk', () => {
  let c = S.createWorld(regionFor('cinderford'), 731);
  c.date = '2026-11-18';
  const done = { kindling: { done: true }, the_drains: { done: true }, below_the_weir: { done: true } };
  let p = veteran(c, 'a', { level: 48, equip: GEAR, quests: done });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'overflow go');
  assert.equal(p.dialog.page, 'ow_early', 'unter 50 zu früh');
  S.removePlayer(c, 'a');

  p = veteran(c, 'a', { level: 52, equip: GEAR, quests: done, bag: [{ id: 'sluice_draught', n: 16 }] });
  p.specs = { warden: 'lightsworn' };
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'overflow go');
  assert.equal(p.quests.overflow_runs_north.step, 0);
  actOn(c, 'a', c.objects.find((o) => o.type === 'door' && o.to === 'sumps'), 'enter');
  assert.equal(p.travel?.region, 'sumps');

  const w = S.createWorld(regionFor('sumps'), 732);
  w.date = '2026-11-18';
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(c, 'a'));
  for (const m of w.mobs) if (!['culvert_leech', 'the_pumpwarden'].includes(m.type)) { m.dead = true; m.deadUntil = 1e9; }
  const draughts = P.countItem(p, 'sluice_draught');
  let lowest = p.maxHp;
  for (let k = 0; k < 5; k++) {
    const m = w.mobs.filter((x) => x.type === 'culvert_leech' && !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.culvert_leech.respawn + 2); k--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead, `Leech ${k + 1} fällt`);
    lowest = Math.min(lowest, p.hp);
  }
  assert.equal(p.quests.overflow_runs_north.step, 1, 'fünf Leeches');

  for (let k = 0; k < 3 && p.hp < p.maxHp * 0.8; k++) {
    applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((x) => x?.id === 'sluice_draught') });
    run(w, 6);
  }
  const before = P.countItem(p, 'sluice_draught');
  const boss = w.mobs.find((m) => m.type === 'the_pumpwarden');
  for (let k = 0; k < 3 && !boss.dead; k++) {
    fight(w, 'a', boss, 3000);
    lowest = Math.min(lowest, p.hp);
  }
  assert.ok(boss.dead, `die Pumpe steht still (Boss ${boss.hp}, Spieler ${p.hp}/${p.maxHp}, Tränke vorher ${before}, nachher ${P.countItem(p, 'sluice_draught')})`);
  assert.equal(p.quests.overflow_runs_north.step, 2);
  const used = draughts - P.countItem(p, 'sluice_draught');
  assert.ok(used >= 1 || lowest < p.maxHp * 0.7, `es kostet etwas (Tränke ${used})`);
  assert.ok(P.countItem(p, 'run_iron') >= 2, 'Run Iron vom Pumpwarden');
  const gateText = w.objects.find((o) => o.type === 'shrine' && o.quest === 'overflow_runs_north');
  for (let k = 0; k < 6 && P.countItem(p, 'gate_rubbing') < 1; k++) {
    const foe = w.mobs.find((m) => !m.dead && m.angryAt === 'a');
    if (foe) fight(w, 'a', foe);
    actOn(w, 'a', gateText, 'search');
    run(w, 2);
  }
  assert.equal(P.countItem(p, 'gate_rubbing'), 1, 'Abrieb vom Tor');
  assert.equal(w.region.zoneAt(gateText.x, gateText.y), 'THE OVERFLOW RUN');

  assert.equal(p.quests.overflow_runs_north.step, 3);

  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'cinderford'), 'enter');
  c = S.createWorld(regionFor('cinderford'), 733);
  const q = S.addPlayer(c, 'a', 'a', S.removePlayer(w, 'a'));
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'pump has stopped');
  assert.equal(q.dialog.page, 'ow_done');
  assert.ok(q.quests.overflow_runs_north.done);
  assert.equal(P.countItem(q, 'culvert_boots'), 1);
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'run iron');
  assert.equal(q.dialog.page, 'run_iron');
});

test('Run Iron an der Werkbank: Culvert Hood (Tinkering 42)', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const r = RECIPES.t_culvert_hood;
  const w = S.createWorld(regionFor('kindle'), 734);
  const bag = Object.entries(r.inputs).map(([id, n]) => ({ id, n }));
  const p = veteran(w, 'a', { level: 50, profs: { tinkering: { level: r.level, xp: P.xpForLevel(r.level) } }, bag });
  const bench = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
  actOn(w, 'a', bench, 'use');
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 't_culvert_hood', n: 1 });
  run(w, 30);
  assert.equal(P.countItem(p, 'culvert_hood'), 1);
});

test('Run Iron wird zu Waffen für 50+: Schild und Shivs an der Werkbank, Stab und Linse an der Linsenbank', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const best = { warden: 'masterwork_shield', drifter: 'masterwork_shivs', mender: 'verdigris_staff', flarecaster: 'verdigris_lens' };
  for (const [rid, station] of [['t_run_shield', 'workbench'], ['t_run_shivs', 'workbench'], ['l_run_staff', 'lampbench'], ['l_run_lens', 'lampbench']]) {
    const r = RECIPES[rid];
    const w = S.createWorld(regionFor('kindle'), 735);
    const bag = Object.entries(r.inputs).map(([id, n]) => ({ id, n }));
    const p = veteran(w, 'a', { level: 50, profs: { [r.prof]: { level: r.level, xp: P.xpForLevel(r.level) } }, bag });
    const bench = w.objects.find((o) => o.type === 'station' && o.station === station);
    actOn(w, 'a', bench, 'use');
    applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: rid, n: 1 });
    run(w, 30);
    const out = r.out[0];
    assert.equal(P.countItem(p, out), 1, `${out} hergestellt`);
    const old = ITEMS[best[ITEMS[out].cls]];
    assert.ok(ITEMS[out].power > old.power, `${out} schlägt härter als ${best[ITEMS[out].cls]}`);
  }
});

test('Gefallen „thin_leeches“: drei Culvert Leeches an einem Tag, an dem er dran ist', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  let date = null;
  for (let d = new Date('2026-11-18T12:00:00Z'); !date; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (favoursFor(iso).includes('thin_leeches')) date = iso;
  }
  const w = S.createWorld(regionFor('sumps'), 736);
  w.date = date;
  const p = veteran(w, 'a', { level: 52, equip: GEAR, bag: [{ id: 'sluice_draught', n: 12 }] });
  for (const m of w.mobs) if (m.type !== 'culvert_leech') { m.dead = true; m.deadUntil = 1e9; }
  const gold = p.gold;
  for (let k = 0; k < FAVOURS.thin_leeches.n; k++) {
    const m = w.mobs.filter((x) => x.type === 'culvert_leech' && !x.dead)[0];
    if (!m) { run(w, MOBS.culvert_leech.respawn + 2); k--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead);
  }
  assert.ok(p.gold >= gold + FAVOURS.thin_leeches.reward.gold, `Gefallen am ${date} erledigt`);
});
