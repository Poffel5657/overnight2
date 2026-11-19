// Nacht 9, Dauerauftrag Klassen (Warden) und Nachschlag: alle acht Wege auf 74.
// Warden: Open Door (Lightsworn: Nahschlag, blendet, heilt die Leute dahinter), Shut Gate (Ironwall: Nahschlag, hält fest,
// härter gegen Festsitzende). Mender: Warm Threshold, Banked Pyre. Flarecaster: Long Noon, Split Dawn. Drifter: Moonset Cut, Peg Line.
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

const NEW = { lightsworn: 'open_door', ironwall: 'shut_gate', hearthkeeper: 'warm_threshold', ashbinder: 'banked_pyre', sunwright: 'long_noon', prismist: 'split_dawn', nightblade: 'moonset_cut', snarewright: 'peg_line' };
const TEACHER = { warden: 'ama', mender: 'tallow', flarecaster: 'wren', drifter: 'stranger' };

test('Auf 74 lernt jeder Weg aller vier Klassen etwas Neues, beim Lehrer gewählt', () => {
  for (const [cls, npc] of Object.entries(TEACHER)) {
    for (const [spec, sp] of Object.entries(CLASSES[cls].specs)) {
      const ab = NEW[spec];
      assert.deepEqual(sp.abilities.find(([a]) => a === ab), [ab, 74], `${spec}: ${ab} auf 74`);
      assert.ok(describeAbility(ab).effect.length > 30, `${ab} erklärt sich`);
      const w = S.createWorld(REGION, 901);
      const p = veteran(w, 'a', { cls, level: 73 });
      talk(w, 'a', npc);
      choose(w, 'a', 'path of my own');
      choose(w, 'a', `${sp.name}:`);
      assert.ok(!P.knownAbilities(p).includes(ab), 'auf 73 noch nicht');
      const q = veteran(w, 'b', { cls, level: 74 });
      talk(w, 'b', npc);
      choose(w, 'b', 'path of my own');
      choose(w, 'b', `${sp.name}:`);
      assert.ok(P.knownAbilities(q).includes(ab), `${spec}: auf 74 gelernt`);
    }
  }
});

function setup(seed, cls, spec) {
  const w = S.createWorld(regionFor('sumps'), seed);
  const p = veteran(w, 'a', { cls, level: 74 });
  const m = w.mobs.find((x) => x.type === 'drain_rat');
  for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
  p.specs = { [cls]: spec };
  m.hp = m.maxHp = 100000;
  return { w, p, m };
}

function beside(w, p, m, d = 1) {
  p.x = m.x - d; p.y = m.y;
  if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - d; }
}

function cast(w, pid, id, m) {
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
  applyIntent(w, pid, { t: 'ability', id });
  for (let i = 0; i < 20 && w.players.get(pid).queued; i++) run(w, 1);
}

test('Open Door: ein Schlag, der blendet und die Leute dahinter heilt', () => {
  const { w, p, m } = setup(902, 'warden', 'lightsworn');
  beside(w, p, m);
  const f = veteran(w, 'f', { cls: 'mender', level: 60 });
  f.x = p.x; f.y = p.y; f.hp = 50;
  const hp0 = m.hp;
  cast(w, 'a', 'open_door', m);
  assert.ok(m.hp < hp0, 'trifft');
  assert.ok(m.dazzleUntil > w.tick - 1, 'blendet');
  assert.ok(f.hp >= 50 + ABILITIES.open_door.mend - 1, `Freund heilt (${f.hp})`);
});

test('Shut Gate hält fest und trifft Festsitzende härter', () => {
  const { w, p, m } = setup(903, 'warden', 'ironwall');
  beside(w, p, m);
  let hp0 = m.hp;
  cast(w, 'a', 'shut_gate', m);
  const first = hp0 - m.hp;
  assert.ok(m.rootUntil > w.tick, 'sitzt fest');
  p.cds.shut_gate = 0;
  p.gcdUntil = 0;
  hp0 = m.hp;
  const seen = [];
  applyIntent(w, 'a', { t: 'ability', id: 'shut_gate' });
  for (let i = 0; i < 20 && p.queued; i++) run(w, 1, (ev) => seen.push(...ev));
  assert.ok(seen.some((e) => e.text === 'EXPLOIT'), 'EXPLOIT gegen Festsitzende');
  assert.ok(first > 0 && hp0 - m.hp > 0);
});

test('Warm Threshold heilt alle in der Nähe über Zeit; Banked Pyre setzt den Boden in Brand', () => {
  {
    const { w, p } = setup(904, 'mender', 'hearthkeeper');
    const f = veteran(w, 'f', { cls: 'warden', level: 60 });
    f.x = p.x; f.y = p.y; f.hp = 50;
    applyIntent(w, 'a', { t: 'ability', id: 'warm_threshold' });
    run(w, 12);
    assert.ok(f.hp > 50 + ABILITIES.warm_threshold.heal * 2, `Freund heilt über Zeit (${f.hp})`);
  }
  {
    const { w, p, m } = setup(905, 'mender', 'ashbinder');
    beside(w, p, m, 3);
    cast(w, 'a', 'banked_pyre', m);
    assert.ok(m.burn && m.burn.left > 0, 'brennt');
  }
});

test('Long Noon, Split Dawn, Moonset Cut und Peg Line wirken wie beschrieben', () => {
  {
    const { w, p, m } = setup(906, 'flarecaster', 'sunwright');
    beside(w, p, m, 4);
    const hp0 = m.hp;
    cast(w, 'a', 'long_noon', m);
    assert.ok(m.hp < hp0 && m.dazzleUntil > w.tick - 1, 'trifft aus der Ferne und blendet');
  }
  {
    const { w, p, m } = setup(907, 'flarecaster', 'prismist');
    beside(w, p, m, 1);
    cast(w, 'a', 'split_dawn', m);
    assert.ok(m.dazzleUntil > w.tick - 1 && m.rootUntil > w.tick - 1, 'blendet und hält fest');
  }
  {
    const { w, p, m } = setup(908, 'drifter', 'nightblade');
    w.daylight = 0;
    beside(w, p, m);
    const hp0 = m.hp;
    cast(w, 'a', 'moonset_cut', m);
    const lvl = 74;
    assert.ok(hp0 - m.hp >= ABILITIES.moonset_cut.hit[0] + Math.floor(lvl / 2), `tief im Dunkeln (${hp0 - m.hp})`);
  }
  {
    const { w, p, m } = setup(909, 'drifter', 'snarewright');
    beside(w, p, m, 3);
    cast(w, 'a', 'peg_line', m);
    assert.ok(m.rootUntil > w.tick, 'sitzt fest');
  }
});

test('Warden schon auf 78: Lamp on the Hook bindet alles und schützt die Leute dahinter, Last Stone heilt und hält', () => {
  assert.deepEqual(CLASSES.warden.specs.lightsworn.abilities.find(([a]) => a === 'lamp_on_the_hook'), ['lamp_on_the_hook', 78]);
  assert.deepEqual(CLASSES.warden.specs.ironwall.abilities.find(([a]) => a === 'last_stone'), ['last_stone', 78]);
  {
    const { w, p, m } = setup(910, 'warden', 'lightsworn');
    p.classes.warden.level = 78;
    beside(w, p, m, 2);
    applyIntent(w, 'a', { t: 'ability', id: 'lamp_on_the_hook' });
    run(w, 1);
    assert.equal(m.angryAt, 'a', 'bindet');
  }
  {
    const { w, p } = setup(911, 'warden', 'ironwall');
    p.classes.warden.level = 78;
    p.hp = 50;
    applyIntent(w, 'a', { t: 'ability', id: 'last_stone' });
    run(w, 1);
    assert.ok(p.hp >= 50 + ABILITIES.last_stone.heal - 1, `heilt (${p.hp})`);
  }
});

test('Mender schon auf 78: Open Hearth heilt alle in der Nähe sofort, Cinder Wake brennt lange', () => {
  assert.deepEqual(CLASSES.mender.specs.hearthkeeper.abilities.find(([a]) => a === 'open_hearth'), ['open_hearth', 78]);
  assert.deepEqual(CLASSES.mender.specs.ashbinder.abilities.find(([a]) => a === 'cinder_wake'), ['cinder_wake', 78]);
  {
    const { w, p } = setup(912, 'mender', 'hearthkeeper');
    p.classes.mender.level = 78;
    const f = veteran(w, 'f', { cls: 'warden', level: 60 });
    f.x = p.x; f.y = p.y; f.hp = 40;
    applyIntent(w, 'a', { t: 'ability', id: 'open_hearth' });
    run(w, 1);
    assert.ok(f.hp >= 40 + ABILITIES.open_hearth.heal - 1, `Freund heilt (${f.hp})`);
  }
  {
    const { w, p, m } = setup(913, 'mender', 'ashbinder');
    p.classes.mender.level = 78;
    beside(w, p, m, 4);
    cast(w, 'a', 'cinder_wake', m);
    assert.ok(m.burn && m.burn.left > 0, 'brennt');
  }
});

test('Flarecaster und Drifter schon auf 78: High Window, Stained Glass, No Moon, Carrier\'s Knot', () => {
  const NEW78 = { sunwright: 'high_window', prismist: 'stained_glass', nightblade: 'no_moon', snarewright: 'carriers_knot' };
  for (const [cls, spec] of [['flarecaster', 'sunwright'], ['flarecaster', 'prismist'], ['drifter', 'nightblade'], ['drifter', 'snarewright']]) {
    const id = NEW78[spec];
    assert.deepEqual(CLASSES[cls].specs[spec].abilities.find(([a]) => a === id), [id, 78]);
    assert.ok(describeAbility(id).effect.length > 30);
    const { w, p, m } = setup(914, cls, spec);
    p.classes[cls].level = 78;
    w.daylight = 0;
    beside(w, p, m, cls === 'drifter' && spec === 'nightblade' ? 1 : 3);
    const hp0 = m.hp;
    cast(w, 'a', id, m);
    assert.ok(m.hp < hp0, `${id} trifft`);
  }
});
