// Nacht 6, Dauerauftrag Klassen (und Nachschlag): Spezialisierungen ab Stufe 50. Jede Klasse wählt beim Lehrer
// einen von zwei Wegen (Warden bei Ama: Lightsworn oder Ironwall; Mender bei Tallow; Flarecaster bei Wren;
// Drifter beim Stranger), mit je einer Fähigkeit auf 50. Neue Wirkung: zone kann blenden, festhalten und anzünden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { ABILITIES } from '../../content/abilities.js';
import { CLASSES, SPEC_LEVEL } from '../../content/classes.js';
import { describeAbility } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, options } from './helpers.mjs';

const TEACHER = { warden: 'ama', mender: 'tallow', flarecaster: 'wren', drifter: 'stranger' };

test('Jede Klasse hat zwei Wege ab 50 mit eigener Fähigkeit und Tooltip', () => {
  for (const [cls, def] of Object.entries(CLASSES)) {
    const specs = Object.entries(def.specs);
    assert.equal(specs.length, 2, `${cls}: zwei Wege`);
    for (const [, sp] of specs) {
      assert.ok(sp.name && sp.text);
      for (const [ab, lvl] of sp.abilities) {
        assert.ok(ABILITIES[ab], `${ab} existiert`);
        assert.ok(lvl >= SPEC_LEVEL);
        assert.ok(describeAbility(ab).effect.length > 20, `${ab} erklärt sich`);
      }
    }
  }
  assert.ok(CLASSES.warden.specs.lightsworn, 'Lightsworn (Gebet 9) ist ein Weg des Wardens');
  assert.match(describeAbility('prism_storm').effect, /cannot attack/);
  assert.match(describeAbility('tangle_wire').effect, /stuck in place/);
  assert.match(describeAbility('ash_bloom').effect, /burns/);
});

test('Wahl beim Lehrer: erst ab 50, nur mit der Waffe der Klasse, nur einmal, dann ist die Fähigkeit da', () => {
  for (const [cls, npc] of Object.entries(TEACHER)) {
    const w = S.createWorld(REGION, 620);
    const lo = veteran(w, 'lo', { cls, level: SPEC_LEVEL - 1 });
    talk(w, 'lo', npc);
    assert.ok(!options(w, 'lo').some((t) => t.includes('path of my own')), `${cls}: unter 50 nicht`);
    // Eine andere Klasse auf 50 in der Hand: auch nicht
    const other = Object.keys(TEACHER).find((c) => c !== cls);
    veteran(w, 'ot', { cls: other, level: SPEC_LEVEL });
    talk(w, 'ot', npc);
    assert.ok(!options(w, 'ot').some((t) => t.includes('path of my own')), `${cls}: nicht mit fremder Waffe`);

    const p = veteran(w, 'a', { cls, level: SPEC_LEVEL });
    const [[id, sp], [id2, sp2]] = Object.entries(CLASSES[cls].specs);
    const ab = sp.abilities[0][0];
    assert.ok(!P.knownAbilities(p).includes(ab));
    talk(w, 'a', npc);
    choose(w, 'a', 'path of my own');
    assert.equal(p.dialog.page, 'spec_choose');
    assert.ok(options(w, 'a').some((t) => t.startsWith(sp2.name)), 'beide Wege stehen zur Wahl');
    choose(w, 'a', `${sp.name}:`);
    assert.equal(p.specs[cls], id);
    assert.ok(P.knownAbilities(p).includes(ab), `${cls}: ${ab} gelernt`);
    assert.ok(!P.knownAbilities(p).includes(CLASSES[cls].specs[id2].abilities[0][0]), 'der andere Weg nicht');
    talk(w, 'a', npc);
    assert.ok(!options(w, 'a').some((t) => t.includes('path of my own')), 'nur einmal');
    choose(w, 'a', 'path I chose');
    assert.equal(p.dialog.page, 'spec_mine');

    // Der Weg bleibt im Spielstand
    const back = S.addPlayer(S.createWorld(REGION, 621), 'b', 'b', JSON.parse(JSON.stringify(P.saveOf(p))));
    assert.equal(back.specs[cls], id);
  }
});

function setup(seed, cls, spec, mobType = 'drain_rat', extra = {}) {
  const w = S.createWorld(regionFor('sumps'), seed);
  const p = veteran(w, 'a', { cls, level: SPEC_LEVEL, ...extra });
  p.specs = { [cls]: spec };
  const m = w.mobs.find((x) => x.type === mobType);
  for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
  return { w, p, m };
}

function cast(w, pid, id, ticks = 2) {
  applyIntent(w, pid, { t: 'ability', id });
  run(w, ticks);
}

test('zone blendet (Prism Storm), hält fest (Tangle Wire) und zündet an (Ash Bloom)', () => {
  for (const [cls, spec, ab, check] of [
    ['flarecaster', 'prismist', 'prism_storm', (w, m) => w.tick < m.dazzleUntil],
    ['drifter', 'snarewright', 'tangle_wire', (w, m) => w.tick < m.rootUntil],
    ['mender', 'ashbinder', 'ash_bloom', (w, m) => m.burn && m.burn.left > 0],
  ]) {
    const { w, p, m } = setup(630, cls, spec);
    p.x = m.x - 3; p.y = m.y;
    if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - 3; }
    applyIntent(w, 'a', { t: 'target', id: m.id });
    const hp = m.hp;
    cast(w, 'a', ab, 1);
    assert.ok(m.hp < hp, `${ab} trifft`);
    assert.ok(check(w, m), `${ab} wirkt`);
  }
});

test('Lightsworn und Ironwall: Oath of Embers heilt die Gruppe, Cinder Bastion bindet und schützt', () => {
  {
    const { w, p, m } = setup(640, 'warden', 'lightsworn');
    const f = veteran(w, 'f', { cls: 'drifter', level: 46 });
    p.x = m.x - 1; p.y = m.y;
    if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - 1; }
    f.x = p.x; f.y = p.y + 1;
    if (!S.walkable(w, f.x, f.y)) f.y = p.y - 1;
    f.hp = 40;
    const hp = m.hp;
    cast(w, 'a', 'oath_of_embers', 1);
    assert.ok(m.hp < hp, 'trifft');
    assert.equal(m.angryAt, 'a', 'hält sich an den Warden');
    assert.ok(w.tick < m.dazzleUntil, 'geblendet');
    assert.ok(f.hp > 40, `Freund heilt (${f.hp})`);
  }
  {
    const { w, p, m } = setup(641, 'warden', 'ironwall');
    const f = veteran(w, 'f', { cls: 'mender', level: 46 });
    p.x = m.x - 2; p.y = m.y;
    if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - 2; }
    f.x = p.x; f.y = p.y + 1;
    if (!S.walkable(w, f.x, f.y)) f.y = p.y - 1;
    applyIntent(w, 'f', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    run(w, 1);
    cast(w, 'a', 'cinder_bastion', 1);
    assert.equal(m.angryAt, 'a', 'bindet');
    assert.ok(w.tick < m.rootUntil, 'hält fest');
    assert.ok(f.braceUntil > w.tick, 'wer dahinter steht, nimmt halben Schaden');
    assert.ok(p.braceUntil > w.tick, 'der Warden auch');
  }
});

test('Mit dem Weg kämpfen: Ein Lightsworn-Warden auf 50 schlägt den Undertow allein, es kostet', () => {
  // Ausrüstung, die man auf 50 realistisch hat: Meisterschild, Sumpwalker, Weir Lamp, ein paar Sluice Draughts
  const { w, p, m } = setup(650, 'warden', 'lightsworn', 'the_undertow', { equip: { main: 'masterwork_shield', lantern: 'weir_lamp' }, bag: [{ id: 'sluice_draught', n: 4 }] });
  const start = p.hp;
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
  const rot = ['oath_of_embers', 'lamp_and_anvil', 'anvil_blow', 'hallowed_ground', 'shield_slam', 'bash'];
  let low = p.hp;
  for (let i = 0; i < 1200 && !m.dead && p.hp > 0; i++) {
    if (i % 2 === 0) applyIntent(w, 'a', { t: 'ability', id: rot[(i / 2) % rot.length] });
    if (p.hp < p.maxHp * 0.35 && P.countItem(p, 'sluice_draught')) applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((s) => s?.id === 'sluice_draught') });
    run(w, 1);
    low = Math.min(low, p.hp);
  }
  assert.ok(m.dead, 'der Undertow fällt');
  assert.ok(low < start * 0.9, `es kostet (tiefster Stand ${low} von ${start})`);
});

test('Warden-Wege auf 54: Lantern Oath (Lightsworn) wärmt die Gruppe lange, Anvil Stance (Ironwall) hält aus', () => {
  const w = S.createWorld(REGION, 660);
  const ls = veteran(w, 'l', { cls: 'warden', level: 54 });
  talk(w, 'l', 'ama');
  choose(w, 'l', 'path of my own');
  choose(w, 'l', 'Lightsworn:');
  assert.ok(P.knownAbilities(ls).includes('lantern_oath') && !P.knownAbilities(ls).includes('anvil_stance'));
  const iw = veteran(w, 'i', { cls: 'warden', level: 53 });
  talk(w, 'i', 'ama');
  choose(w, 'i', 'path of my own');
  choose(w, 'i', 'Ironwall:');
  assert.ok(!P.knownAbilities(iw).includes('anvil_stance'), 'erst ab 54');
  // Wirkung: Lantern Oath heilt einen Freund über Zeit
  const f = veteran(w, 'f', { cls: 'mender', level: 40 });
  f.x = ls.x + 1; f.y = ls.y;
  if (!S.walkable(w, f.x, f.y)) f.x = ls.x - 1;
  f.hp = 30;
  applyIntent(w, 'l', { t: 'ability', id: 'lantern_oath' });
  run(w, 12);
  assert.ok(f.hp >= 30 + 3 * ABILITIES.lantern_oath.heal, `Freund wird warm (${f.hp})`);
  assert.match(describeAbility('anvil_stance').effect, /half damage/);
});

test('Alle Wege haben auf 54 eine zweite Fähigkeit, die man vorher nicht hat', () => {
  for (const [cls, def] of Object.entries(CLASSES)) {
    for (const [id, sp] of Object.entries(def.specs)) {
      const at54 = sp.abilities.filter(([, l]) => l === 54).map(([a]) => a);
      assert.equal(at54.length, 1, `${cls}/${id}: eine Fähigkeit auf 54`);
      const w = S.createWorld(REGION, 670);
      const p53 = veteran(w, 'x', { cls, level: 53 });
      const p54 = veteran(w, 'y', { cls, level: 54 });
      p53.specs = { [cls]: id }; p54.specs = { [cls]: id };
      assert.ok(!P.knownAbilities(p53).includes(at54[0]) && P.knownAbilities(p54).includes(at54[0]));
      assert.ok(describeAbility(at54[0]).effect.length > 20);
    }
  }
});
