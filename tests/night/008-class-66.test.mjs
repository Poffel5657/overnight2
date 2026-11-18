// Nacht 8, Dauerauftrag Klassen (Warden) und Nachschlag: alle acht Wege auf 66.
// Warden: Beacon Vow (Lightsworn, neu: aura mit fuel = Öl für die Laternen der anderen), Cinder Keep (Ironwall).
// Mender: Hearth Ward (Hearthkeeper), Cinder Storm (Ashbinder). Flarecaster: Sunstrike, Prism Cage. Drifter: Starless Cut, Tripwire Ring.
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
import { run, talk, choose, veteran } from './helpers.mjs';

const NEW = { lightsworn: 'beacon_vow', ironwall: 'cinder_keep', hearthkeeper: 'hearth_ward', ashbinder: 'cinder_storm', sunwright: 'sunstrike', prismist: 'prism_cage', nightblade: 'starless_cut', snarewright: 'tripwire_ring' };
const TEACHER = { warden: 'ama', mender: 'tallow', flarecaster: 'wren', drifter: 'stranger' };

test('Auf 66 lernt jeder Weg aller vier Klassen etwas Neues, beim Lehrer gewählt', () => {
  for (const [cls, npc] of Object.entries(TEACHER)) {
    for (const [spec, sp] of Object.entries(CLASSES[cls].specs)) {
      const ab = NEW[spec];
      assert.deepEqual(sp.abilities.find(([a]) => a === ab), [ab, 66], `${spec}: ${ab} auf 66`);
      assert.ok(describeAbility(ab).effect.length > 30, `${ab} erklärt sich`);
      const w = S.createWorld(REGION, 801);
      const p = veteran(w, 'a', { cls, level: 65 });
      talk(w, 'a', npc);
      choose(w, 'a', 'path of my own');
      choose(w, 'a', `${sp.name}:`);
      assert.ok(!P.knownAbilities(p).includes(ab), 'auf 65 noch nicht');
      const q = veteran(w, 'b', { cls, level: 66 });
      talk(w, 'b', npc);
      choose(w, 'b', 'path of my own');
      choose(w, 'b', `${sp.name}:`);
      assert.ok(P.knownAbilities(q).includes(ab), `${spec}: auf 66 gelernt`);
    }
  }
  assert.match(describeAbility('beacon_vow').effect, /oil in their lanterns/);
});

function setup(seed, cls, spec) {
  const w = S.createWorld(regionFor('sumps'), seed);
  const p = veteran(w, 'a', { cls, level: 66 });
  const m = w.mobs.find((x) => x.type === 'drain_rat');
  for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
  p.specs = { [cls]: spec };
  return { w, p, m };
}

function beside(w, p, m, d = 1) {
  p.x = m.x - d; p.y = m.y;
  if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - d; }
}

test('Beacon Vow: die Laternen der Gruppe trinken aus der eigenen, und alle werden warm', () => {
  const { w, p } = setup(802, 'warden', 'lightsworn');
  const f = veteran(w, 'f', { cls: 'flarecaster', level: 60 });
  f.x = p.x; f.y = p.y; f.hp = 40; f.oil = 10;
  const far = veteran(w, 'g', { cls: 'drifter', level: 60 });
  far.oil = 10;
  far.x = p.x + 12;
  if (!S.walkable(w, far.x, far.y)) far.x = p.x - 12;
  const before = p.oil;
  applyIntent(w, 'a', { t: 'ability', id: 'beacon_vow' });
  run(w, 1);
  const a = ABILITIES.beacon_vow;
  assert.ok(f.oil >= 10 + a.fuel - 1, `Freund bekommt Öl (${f.oil})`);
  assert.ok(f.hp >= 40 + a.heal, `Freund heilt (${f.hp})`);
  assert.ok(far.oil < 11, 'wer weit weg steht, nicht');
  assert.ok(p.oil <= before - a.oil + 1, 'kostet das eigene Öl');
});

test('Cinder Keep hält alles fest und schützt die Leute dahinter', () => {
  const { w, p, m } = setup(803, 'warden', 'ironwall');
  beside(w, p, m, 2);
  const f = veteran(w, 'f', { cls: 'mender', level: 60 });
  f.x = p.x; f.y = p.y;
  applyIntent(w, 'a', { t: 'ability', id: 'cinder_keep' });
  run(w, 1);
  assert.equal(m.angryAt, 'a', 'bindet');
  assert.ok(w.tick < m.rootUntil, 'hält fest');
  assert.ok(f.braceUntil > w.tick, 'schützt den Freund');
});

test('Die anderen Wege auf 66 tun, was sie sagen', () => {
  {
    const { w, p, m } = setup(804, 'mender', 'hearthkeeper');
    beside(w, p, m, 2);
    const f = veteran(w, 'f', { cls: 'warden', level: 60 });
    f.x = p.x; f.y = p.y; f.hp = 40;
    const hp = m.hp;
    applyIntent(w, 'a', { t: 'ability', id: 'hearth_ward' });
    run(w, 1);
    assert.ok(m.hp < hp && w.tick < m.dazzleUntil, 'trifft und blendet');
    assert.ok(f.hp >= 40 + ABILITIES.hearth_ward.mend, 'wärmt');
  }
  for (const [cls, spec, ab, check] of [
    ['mender', 'ashbinder', 'cinder_storm', (w, m) => m.burn?.left > 0],
    ['flarecaster', 'sunwright', 'sunstrike', () => true],
    ['flarecaster', 'prismist', 'prism_cage', (w, m) => w.tick < m.dazzleUntil && w.tick < m.rootUntil],
    ['drifter', 'nightblade', 'starless_cut', () => true],
    ['drifter', 'snarewright', 'tripwire_ring', (w, m) => w.tick < m.rootUntil],
  ]) {
    const { w, p, m } = setup(805, cls, spec);
    beside(w, p, m, ['melee', 'burst'].includes(ABILITIES[ab].kind) ? 1 : 3);
    applyIntent(w, 'a', { t: 'target', id: m.id });
    const hp = m.hp;
    applyIntent(w, 'a', { t: 'ability', id: ab });
    run(w, 1);
    assert.ok(m.hp < hp || m.dead, `${ab} trifft`);
    assert.ok(check(w, m), `${ab} wirkt`);
  }
});
