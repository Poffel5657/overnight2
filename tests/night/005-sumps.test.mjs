// Nacht 5, aus den Gebeten (Gebet 9: Kanäle und Verliese unter der großen Stadt): The Sumps unter Cinderford.
// Hesk schickt Delver ab Stufe 38 durch das Gitter am Ostende der Furt: Drain Rats, der Griff in der Nische
// der Quarrymen, The Undertow am Wehr. Verdigris aus der Beute wird an Rooks Werkbank zu Sumpwalker-Ausrüstung.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { REGION as KINDLE } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import { RECIPES } from '../../content/recipes.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { TALK } from '../../content/npcs.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Ausrüstung, die man auf Stufe 38 bis 44 realistisch hat: Meisterstücke (Tinkering 32-37) und die Cinder-Laterne.
const GEAR = { main: 'masterwork_shield', head: 'masterwork_hood', body: 'masterwork_coat', feet: 'masterwork_boots', lantern: 'cinder_lantern' };
const WARDEN = ['hallowed_ground', 'anvil_blow', 'bash', 'shield_slam', 'beacon_slam', 'stand_fast', 'last_light'];

function fightWithTonics(w, pid, mob, abilities, ticks = 2500) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const s = p.bag.findIndex((x) => x?.id === 'seam_tonic');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

function nearest(w, p, type) {
  return w.mobs.filter((m) => m.type === type && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
}

test('Die Sumps: Stufe 40 bis 46, fair angekündigt, Rollen passen zu den Wesen derselben Stufe', () => {
  const rat = MOBS.drain_rat;
  const crawler = MOBS.silt_crawler;
  const boss = MOBS.the_undertow;
  assert.ok(rat.level === 40 && crawler.level === 43 && boss.level === 46);
  for (const m of [rat, crawler]) assert.ok(m.special.delay >= 4, `${m.name}: Vorwarnung mindestens 4 Takte`);
  for (const sp of boss.specials) assert.ok(sp.delay >= 4);
  assert.ok(boss.boss?.deathText, 'Boss mit eigenem Ende');
  // nebenbei < normal < Boss, und Erfahrung passend zur Kurve (über dem Seam Lurker auf 38)
  assert.ok(rat.hp < crawler.hp && crawler.hp < boss.hp);
  assert.ok(rat.xp < crawler.xp && crawler.xp > MOBS.seam_lurker.xp && boss.xp > crawler.xp * 4);
  const r = regionFor('sumps');
  assert.equal(r.indoor, true);
  assert.equal(r.mobs.filter((m) => m.type === 'the_undertow').length, 1);
  assert.equal(regionFor('cinderford').objects.filter((o) => o.type === 'door' && o.to === 'sumps').length, 1);
});

test('The Drains: Hesk, das Gitter, fünf Ratten, der Griff in der Nische, The Undertow, zurück zu Hesk', () => {
  // Hesk in Cinderford: unter 38 zu früh, und das Gitter bleibt zu
  let c = S.createWorld(regionFor('cinderford'), 501);
  c.date = '2026-11-16';
  let p = veteran(c, 'a', { level: 36, equip: GEAR });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'Where does the ford go');
  assert.equal(p.dialog.page, 'dr_early');
  const grate = c.objects.find((o) => o.type === 'door' && o.to === 'sumps');
  actOn(c, 'a', grate, 'enter');
  run(c, 2);
  assert.ok(!p.travel, 'unter 38 rostet das Gitter zu');
  S.removePlayer(c, 'a');

  p = veteran(c, 'a', { level: 40, equip: GEAR, bag: [{ id: 'seam_tonic', n: 14 }] });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'Where does the ford go');
  assert.equal(p.quests.the_drains.step, 0);
  actOn(c, 'a', grate, 'enter');
  assert.equal(p.travel?.region, 'sumps', 'durch das Gitter hinunter');

  // Unten: die Leiter, Lampen-Nischen, fünf Drain Rats
  const w = S.createWorld(regionFor('sumps'), 502);
  w.date = '2026-11-16';
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(c, 'a'));
  assert.equal(w.region.zoneAt(p.x, p.y), 'THE SUMPS');
  const startTonics = P.countItem(p, 'seam_tonic');
  let lowest = p.maxHp;
  for (let k = 0; k < 5; k++) {
    const m = nearest(w, p, 'drain_rat');
    if (!m) { run(w, MOBS.drain_rat.respawn + 2); k--; continue; }
    fightWithTonics(w, 'a', m, WARDEN);
    assert.ok(m.dead, `Ratte ${k + 1} fällt`);
    lowest = Math.min(lowest, p.hp);
  }
  assert.equal(p.quests.the_drains.step, 1, 'fünf Ratten');

  // Die Nische der Quarrymen in der Zisterne: der Griff
  const niche = w.objects.find((o) => o.type === 'shrine' && o.quest === 'the_drains');
  p.hp = p.maxHp;
  actOn(w, 'a', niche, 'search');
  // In der Zisterne liegen Crawler: Wer angegriffen wird, wehrt sich und sucht weiter
  for (let k = 0; k < 6 && P.countItem(p, 'sluice_handle') < 1; k++) {
    const foe = w.mobs.find((m) => !m.dead && m.angryAt === 'a');
    if (foe) fightWithTonics(w, 'a', foe, WARDEN);
    actOn(w, 'a', niche, 'search');
    run(w, 2);
  }
  assert.equal(P.countItem(p, 'sluice_handle'), 1, 'der Griff hing in der Nische');
  assert.equal(p.quests.the_drains.step, 2);

  // The Undertow am Wehr: allein mit Einsatz (Tränke)
  const boss = w.mobs.find((m) => m.type === 'the_undertow');
  p.hp = p.maxHp;
  for (let k = 0; k < 3 && !boss.dead; k++) {
    fightWithTonics(w, 'a', boss, WARDEN, 3000);
    if (p.hp <= 0) { run(w, 3); p.hp = p.maxHp; }
  }
  assert.ok(boss.dead, 'The Undertow fällt');
  assert.equal(p.quests.the_drains.step, 3);
  const used = startTonics - P.countItem(p, 'seam_tonic');
  assert.ok(used >= 1 || lowest < p.maxHp * 0.7, `es kostet etwas (Tränke ${used})`);
  assert.ok(P.countItem(p, 'verdigris') >= 2, 'Verdigris als Beute');

  // Zurück hinauf zu Hesk
  const ladder = w.objects.find((o) => o.type === 'door' && o.to === 'cinderford');
  actOn(w, 'a', ladder, 'enter');
  assert.equal(p.travel?.region, 'cinderford');
  c = S.createWorld(regionFor('cinderford'), 503);
  const q = S.addPlayer(c, 'a', 'a', S.removePlayer(w, 'a'));
  const xp = q.classes.warden.xp;
  const gold = q.gold;
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'water runs again');
  assert.equal(q.quests.the_drains.done, true);
  assert.equal(P.countItem(q, 'sluice_handle'), 0);
  assert.ok(q.classes.warden.xp >= xp + QUESTS.the_drains.reward.xp);
  assert.equal(q.gold, gold + QUESTS.the_drains.reward.gold);
});

test('Unter Stufe kostet ein Silt Crawler deutlich mehr; Drain Rats sind Nebensache', () => {
  const lost = (level, type, equip) => {
    let sum = 0;
    for (let k = 0; k < 4; k++) {
      const w = S.createWorld(regionFor('sumps'), 510 + k);
      const p = veteran(w, 'a', { level, equip });
      const m = w.mobs.find((x) => x.type === type);
      for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
      p.x = m.x - 1; p.y = m.y; if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - 1; }
      const hp = p.hp;
      fightWithTonics(w, 'a', m, ['bash', 'shield_slam', 'beacon_slam'], 900);
      sum += (hp - Math.max(0, p.hp)) / hp;
    }
    return sum / 4;
  };
  const low = lost(30, 'silt_crawler', { main: 'greyglass_shield', body: 'greyglass_coat' });
  const high = lost(43, 'silt_crawler', GEAR);
  assert.ok(low > high, `Stufe 30 verliert mehr (${Math.round(low * 100)} % gegen ${Math.round(high * 100)} %)`);
  assert.ok(high > 0.05, 'auch auf Stufe 43 kostet es Leben');
  assert.ok(lost(40, 'drain_rat', GEAR) < high + 0.1, 'Ratten sind leichter');
});

test('Verdigris: Tinkering 38 bis 40 macht an der Werkbank in Kindle Sumpwalker-Ausrüstung', () => {
  for (const [rid, out] of [['t_sw_boots', 'sumpwalker_boots'], ['t_sw_hood', 'sumpwalker_hood'], ['t_sw_coat', 'sumpwalker_coat']]) {
    const r = RECIPES[rid];
    assert.ok(r.inputs.verdigris >= 3);
    const w = S.createWorld(KINDLE, 520);
    const p = veteran(w, 'a', { level: 40, profs: { tinkering: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })) });
    // Rook erklärt, wofür das grüne Zeug taugt
    talk(w, 'a', 'rook');
    choose(w, 'a', 'verdigris');
    assert.equal(p.dialog?.page, 'rook_verdigris');
    const bench = w.objects.find((o) => o.type === 'station' && o.station === 'workbench');
    applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
    for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
    applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: rid, n: 1 });
    run(w, 1);
    assert.equal(P.countItem(p, out), 1, `${out} gebaut`);
  }
  // Eine Stufe über den Meisterstücken
  assert.ok(ITEMS.sumpwalker_coat.defence > ITEMS.masterwork_coat.defence);
  assert.ok(ITEMS.sumpwalker_boots.defence > ITEMS.masterwork_boots.defence);
  assert.ok(ITEMS.weir_lamp.light > ITEMS.cinder_lantern.light);
});

test('Die Sumps im Spielstand: wer dort unterliegt, wacht in Cinderford auf; ein alter Stand lädt', () => {
  const r = regionFor('sumps');
  assert.equal(r.deathTo.region, 'cinderford');
  const w = S.createWorld(r, 530);
  // Ein Stand ohne die neuen Felder (wie vor Tag 5) lädt ohne Fehler
  const old = { v: 2, x: r.start.x, y: r.start.y, hp: 50, oil: 40, gold: 3, cls: 'warden', classes: { warden: { level: 41, xp: P.xpForLevel(41) } }, bag: [], equip: {}, profs: {}, quests: {}, bars: {} };
  const p = S.addPlayer(w, 'o', 'o', old);
  assert.ok(P.knownAbilities(p).includes('hallowed_ground') === false, 'Hallowed Ground erst ab 44');
  assert.equal(p.cls, 'warden');
});

test('Nachschlag: The Lamp Under the Hill (Hesk, Sorrel, drei Crawler, Tallow in Kindle, zurück zu Hesk)', () => {
  let c = S.createWorld(regionFor('cinderford'), 540);
  let p = veteran(c, 'a', { level: 43, equip: GEAR, quests: { kindling: { done: true }, the_drains: { done: true } }, bag: [{ id: 'seam_tonic', n: 8 }] });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'lamp under the hill');
  assert.equal(p.quests.lamp_under_the_hill.step, 0);
  talk(c, 'a', 'sorrel');
  choose(c, 'a', 'What is the lamp under the hill');
  assert.equal(p.quests.lamp_under_the_hill.step, 1);

  const grate = c.objects.find((o) => o.type === 'door' && o.to === 'sumps');
  actOn(c, 'a', grate, 'enter');
  const w = S.createWorld(regionFor('sumps'), 541);
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(c, 'a'));
  for (let k = 0; k < 3; k++) {
    const m = nearest(w, p, 'silt_crawler');
    p.hp = p.maxHp;
    fightWithTonics(w, 'a', m, WARDEN);
    assert.ok(m.dead, `Crawler ${k + 1}`);
  }
  assert.equal(p.quests.lamp_under_the_hill.step, 2);

  // Hinauf nach Kindle (der Weg über Cinderford und den alten Weg ist in 002-cinderford-maze gespielt)
  const k = S.createWorld(KINDLE, 542);
  const q = S.addPlayer(k, 'a', 'a', { ...P.saveOf(p), region: 'kindle', x: 50, y: 53 });
  talk(k, 'a', 'tallow');
  choose(k, 'a', 'lamp under the hill');
  assert.equal(q.quests.lamp_under_the_hill.step, 3);

  c = S.createWorld(regionFor('cinderford'), 543);
  const r = S.addPlayer(c, 'a', 'a', P.saveOf(q));
  const xp = r.classes.warden.xp;
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'chapel has an answer');
  assert.equal(r.quests.lamp_under_the_hill.done, true);
  assert.ok(r.classes.warden.xp >= xp + QUESTS.lamp_under_the_hill.reward.xp);
  assert.ok(P.countItem(r, 'sluice_draught') >= 2);
});

test('Nachschlag: Sorrel zählt Hesk, Ivy zeichnet die Sumps (die sich nicht bewegen)', () => {
  const c = S.createWorld(regionFor('cinderford'), 545);
  const p = veteran(c, 'a', { level: 40, quests: { kindling: { done: true }, the_drains: { step: 1, n: 0 } } });
  talk(c, 'a', 'sorrel');
  choose(c, 'a', 'count the Sumps');
  assert.equal(p.dialog.page, 'so_sumps');
  p.quests.the_drains = { done: true };
  talk(c, 'a', 'ivy');
  choose(c, 'a', 'do not move');
  assert.equal(p.dialog.page, 'iv_sumps');
});

test("Nachschlag: Gran's Locker (Rätsel): die Zahlen stehen auf der Tafel in den Sumps, falsche Wege sehen gleich aus", () => {
  let c = S.createWorld(regionFor('cinderford'), 546);
  let p = veteran(c, 'a', { level: 40, quests: { kindling: { done: true }, the_drains: { done: true } } });
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'old locker under your stall');
  assert.equal(p.quests.grans_locker.step, 0);
  // Hinunter und die Tafel lesen
  const grate = c.objects.find((o) => o.type === 'door' && o.to === 'sumps');
  actOn(c, 'a', grate, 'enter');
  const w = S.createWorld(regionFor('sumps'), 547);
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(c, 'a'));
  const slate = w.objects.find((o) => o.type === 'table');
  const seen = [];
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: slate.id, action: 'examine' });
  run(w, 2, (ev) => seen.push(...ev.filter((e) => e.type === 'log' && e.to === 'a').map((e) => e.text)));
  const clue = seen.find((t) => t.includes('slate'));
  assert.ok(clue && /4, then 9, then 13/.test(clue), 'die Tafel nennt die Zahlen');
  // Zurück hinauf
  c = S.createWorld(regionFor('cinderford'), 548);
  const q = S.addPlayer(c, 'a', 'a', { ...P.saveOf(p), region: 'cinderford', x: 35, y: 18 });
  // Erst falsch: sieht gleich aus, endet im Nichts
  talk(c, 'a', 'hesk');
  choose(c, 'a', 'try Gran');
  choose(c, 'a', 'Turn it to 7');
  assert.equal(TALK.hesk[q.dialog.page].text, TALK.hesk.gl_2.text, 'falscher Weg sieht gleich aus');
  choose(c, 'a', 'Turn it to 9');
  choose(c, 'a', 'Turn it to 13');
  assert.equal(q.dialog.page, 'gl_stuck');
  assert.equal(q.quests.grans_locker.step, 0);
  // Dann richtig
  choose(c, 'a', 'Try again');
  choose(c, 'a', 'Turn it to 4');
  choose(c, 'a', 'Turn it to 9');
  choose(c, 'a', 'Turn it to 13');
  assert.equal(q.dialog.page, 'gl_done');
  assert.equal(q.quests.grans_locker.done, true);
  assert.ok(P.countItem(q, 'weir_lamp') === 1 || q.equip.lantern === 'weir_lamp', 'die Weir Lamp');
});
