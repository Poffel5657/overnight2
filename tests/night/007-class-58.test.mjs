// Nacht 7, Dauerauftrag Klassen (Warden) und Nachschlag: alle Wege auf 58 und 62.
// Warden: Dawn Vow (Lightsworn, neu: ein Nahschlag mit mend heilt die Leute dahinter), Anvil Fall (Ironwall, gegen Festsitzende).
// Mender: Ember Vigil (Hearthkeeper, lange Wärme), Pyre Ring (Ashbinder, ein Ring aus Glut).
// Dazu die Fehler aus dem Code-Review der Aufräumnacht: Scheite direkt ins Feuer zählen für Amas Tafel,
// schon gespaltenes Totholz zählt für eine später angenommene Quest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES } from '../../content/abilities.js';
import { describeAbility } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

const NEW = { lightsworn: 'dawn_vow', ironwall: 'anvil_fall', hearthkeeper: 'ember_vigil', ashbinder: 'pyre_ring', sunwright: 'high_noon', prismist: 'spectrum', nightblade: 'eclipse_cut', snarewright: 'wire_lash' };
const TEACHER = { warden: 'ama', mender: 'tallow', flarecaster: 'wren', drifter: 'stranger' };

test('Auf 58 lernt jeder Weg aller vier Klassen etwas Neues, beim Lehrer gewählt', () => {
  for (const [cls, npc] of Object.entries(TEACHER)) {
    for (const [spec, sp] of Object.entries(CLASSES[cls].specs)) {
      const ab = NEW[spec];
      assert.deepEqual(sp.abilities.find(([a]) => a === ab), [ab, 58], `${spec}: ${ab} auf 58`);
      assert.ok(describeAbility(ab).effect.length > 30, `${ab} erklärt sich`);
      const w = S.createWorld(REGION, 720);
      const p = veteran(w, 'a', { cls, level: 57 });
      talk(w, 'a', npc);
      choose(w, 'a', 'path of my own');
      choose(w, 'a', `${sp.name}:`);
      assert.ok(!P.knownAbilities(p).includes(ab), 'auf 57 noch nicht');
      const q = veteran(w, 'b', { cls, level: 58 });
      talk(w, 'b', npc);
      choose(w, 'b', 'path of my own');
      choose(w, 'b', `${sp.name}:`);
      assert.ok(P.knownAbilities(q).includes(ab), `${spec}: auf 58 gelernt`);
    }
  }
  assert.match(describeAbility('dawn_vow').effect, /allies within .* heal/);
});

function setup(seed, cls, spec) {
  const w = S.createWorld(regionFor('sumps'), seed);
  const p = veteran(w, 'a', { cls, level: 58 });
  const m = w.mobs.find((x) => x.type === 'drain_rat');
  for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
  p.specs = { [cls]: spec };
  return { w, p, m };
}

function beside(w, p, m, d = 1) {
  p.x = m.x - d; p.y = m.y;
  if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - d; }
}

test('Dawn Vow: ein Schlag, und die Leute dahinter heilen; Anvil Fall trifft Festsitzende härter', () => {
  {
    const { w, p, m } = setup(721, 'warden', 'lightsworn');
    const f = veteran(w, 'f', { cls: 'drifter', level: 50 });
    beside(w, p, m);
    f.x = p.x; f.y = p.y + 1;
    if (!S.walkable(w, f.x, f.y)) f.y = p.y - 1;
    f.hp = 40;
    applyIntent(w, 'a', { t: 'target', id: m.id });
    const hp = m.hp;
    applyIntent(w, 'a', { t: 'ability', id: 'dawn_vow' });
    run(w, 1);
    assert.ok(m.hp < hp, 'trifft');
    assert.ok(f.hp >= 40 + ABILITIES.dawn_vow.mend, `Freund heilt (${f.hp})`);
  }
  {
    // Gleicher Schlag, einmal frei, einmal festgehalten (Cinder Bastion hält fest): festgehalten tut es mehr weh
    const dmg = [];
    for (const pin of [false, true]) {
      const { w, p, m } = setup(722, 'warden', 'ironwall');
      beside(w, p, m);
      applyIntent(w, 'a', { t: 'target', id: m.id });
      if (pin) { applyIntent(w, 'a', { t: 'ability', id: 'cinder_bastion' }); run(w, 5); }
      const hp = m.hp;
      w.rand = () => 0.5;
      applyIntent(w, 'a', { t: 'ability', id: 'anvil_fall' });
      run(w, 1);
      dmg.push(hp - m.hp);
      assert.ok(w.tick < m.rootUntil, 'hält fest');
    }
    assert.ok(dmg[1] > dmg[0], `festgehalten härter (${dmg.join(' < ')})`);
  }
});

test('Ember Vigil wärmt lange, Pyre Ring legt Glut um den Mender', () => {
  {
    const { w, p } = setup(723, 'mender', 'hearthkeeper');
    const f = veteran(w, 'f', { cls: 'warden', level: 50 });
    f.x = p.x; f.y = p.y;
    f.hp = 40;
    applyIntent(w, 'a', { t: 'ability', id: 'ember_vigil' });
    run(w, ABILITIES.ember_vigil.ticks);
    assert.ok(f.hp >= 40 + ABILITIES.ember_vigil.heal * 5, `wärmt über Zeit (${f.hp})`);
  }
  {
    const { w, p, m } = setup(724, 'mender', 'ashbinder');
    beside(w, p, m, 2);
    const hp = m.hp;
    applyIntent(w, 'a', { t: 'ability', id: 'pyre_ring' });
    run(w, 1);
    assert.ok(m.hp < hp, 'trifft');
    assert.ok(m.burn?.left > 0, 'brennt');
  }
});

test('Spectrum blendet und zündet an, Wire Lash holt heran und hält fest', () => {
  {
    const { w, p, m } = setup(726, 'flarecaster', 'prismist');
    beside(w, p, m, 3);
    applyIntent(w, 'a', { t: 'target', id: m.id });
    applyIntent(w, 'a', { t: 'ability', id: 'spectrum' });
    run(w, 1);
    assert.ok(w.tick < m.dazzleUntil && m.burn?.left > 0, 'geblendet und brennt');
  }
  {
    const { w, p, m } = setup(727, 'drifter', 'snarewright');
    beside(w, p, m, 3);
    applyIntent(w, 'a', { t: 'target', id: m.id });
    applyIntent(w, 'a', { t: 'ability', id: 'wire_lash' });
    run(w, 1);
    assert.ok(Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) <= 1, 'herangeholt');
    assert.ok(w.tick < m.rootUntil, 'hält fest');
  }
});

test('Warden auf 62: Sunward Oath (Fläche, heilt) und Cinder Chain (holt heran)', () => {
  assert.deepEqual(CLASSES.warden.specs.lightsworn.abilities.at(-1), ['sunward_oath', 62]);
  assert.deepEqual(CLASSES.warden.specs.ironwall.abilities.at(-1), ['cinder_chain', 62]);
  {
    const w = S.createWorld(regionFor('sumps'), 728);
    const p = veteran(w, 'a', { cls: 'warden', level: 62 });
    p.specs = { warden: 'lightsworn' };
    assert.ok(P.knownAbilities(p).includes('sunward_oath'));
    const m = w.mobs.find((x) => x.type === 'drain_rat');
    for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
    beside(w, p, m);
    const f = veteran(w, 'f', { cls: 'mender', level: 50 });
    f.x = p.x; f.y = p.y; f.hp = 40;
    applyIntent(w, 'a', { t: 'ability', id: 'sunward_oath' });
    run(w, 1);
    assert.ok(m.burn?.left > 0 && w.tick < m.dazzleUntil && m.angryAt === 'a', 'brennt, geblendet, gebunden');
    assert.ok(f.hp >= 40 + ABILITIES.sunward_oath.mend, 'Freund heilt');
  }
  {
    const w = S.createWorld(regionFor('sumps'), 729);
    const p = veteran(w, 'a', { cls: 'warden', level: 62 });
    p.specs = { warden: 'ironwall' };
    const m = w.mobs.find((x) => x.type === 'drain_rat');
    for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
    beside(w, p, m, 4);
    applyIntent(w, 'a', { t: 'target', id: m.id });
    applyIntent(w, 'a', { t: 'ability', id: 'cinder_chain' });
    run(w, 1);
    assert.ok(Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) <= 1 && w.tick < m.rootUntil, 'herangeholt und fest');
  }
});

test('Auf 62 hat jeder Weg etwas Neues, und es erklärt sich', () => {
  for (const def of Object.values(CLASSES)) {
    for (const sp of Object.values(def.specs)) {
      const [ab, lvl] = sp.abilities.at(-1);
      assert.equal(lvl, 62, `${sp.name} bis 62`);
      assert.ok(describeAbility(ab).effect.length > 30, ab);
    }
  }
  const { w, p, m } = setup(730, 'drifter', 'snarewright');
  p.classes.drifter = { level: 62, xp: P.xpForLevel(62) };
  assert.ok(P.knownAbilities(p).includes('snare_web'));
  beside(w, p, m, 3);
  applyIntent(w, 'a', { t: 'target', id: m.id });
  applyIntent(w, 'a', { t: 'ability', id: 'snare_web' });
  run(w, 1);
  assert.ok(w.tick < m.rootUntil, 'Snare Web hält fest');
});

test('Review: Scheite direkt ins Leuchtfeuer zählen für Amas Tafel und die Quest; gespaltenes Totholz zählt nachträglich', () => {
  const w = S.createWorld(REGION, 725);
  w.date = '2026-11-18';
  const p = veteran(w, 'a', { level: 5, quests: { kindling: { done: true } } });
  // Erst Totholz spalten, dann die Quest annehmen: der zweite Versuch an derselben Stelle zählt für Schritt 1
  const dead = w.objects.filter((o) => o.type === 'deadfall').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  actOn(w, 'a', dead, 'use');
  run(w, 2);
  const logs = P.countItem(p, 'split_log');
  assert.ok(logs > 0);
  talk(w, 'a', 'ama');
  choose(w, 'a', 'woodpile by the Beacon');
  assert.equal(p.quests.the_woodpile.step, 0);
  actOn(w, 'a', dead, 'use');
  run(w, 2);
  assert.equal(p.quests.the_woodpile.step, 1, 'zählt, obwohl die Stelle heute leer ist');
  // Füttern über das Leuchtfeuer-Fenster
  const beacon = w.objects.find((o) => o.type === 'beacon');
  actOn(w, 'a', beacon, 'feed');
  const n = P.countItem(p, 'split_log');
  applyIntent(w, 'a', { t: 'feed', item: 'split_log', n });
  run(w, 1);
  assert.equal(P.countItem(p, 'split_log'), 0);
  assert.equal(p.stacked, n, 'Amas Tafel zählt mit');
  assert.equal(p.quests.the_woodpile.step, 2, 'zählt als Stapeln');
});
