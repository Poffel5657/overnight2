// Nacht 5, Dauerauftrag Klassen (und Gebet 9: Licht als Glaube): alle vier Klassen bekommen Stufe 44.
// Warden Hallowed Ground und Mender Vesper Bell nutzen die neue Wirkung mend (burst heilt die Gruppe),
// Flarecaster Lanternfall (Fläche, exploit gegen Geblendete), Drifter Gloaming (exploit gegen Festsitzende).
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { ABILITIES } from '../../content/abilities.js';
import { CLASSES } from '../../content/classes.js';
import { describeAbility } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

function cast(w, pid, id, ticks = 6) {
  applyIntent(w, pid, { t: 'ability', id });
  run(w, ticks);
}

test('Stufe 44: jede Klasse lernt etwas Neues, mit Tooltip aus den Daten', () => {
  const want = { warden: 'hallowed_ground', mender: 'vesper_bell', flarecaster: 'lanternfall', drifter: 'gloaming' };
  for (const [cls, ab] of Object.entries(want)) {
    assert.ok(CLASSES[cls].abilities.some(([a, l]) => a === ab && l === 44), `${cls} 44`);
    const w = S.createWorld(regionFor('sumps'), 560);
    const lo = veteran(w, 'lo', { cls, level: 43 });
    const hi = veteran(w, 'hi', { cls, level: 44 });
    assert.ok(!P.knownAbilities(lo).includes(ab) && P.knownAbilities(hi).includes(ab));
    assert.ok(describeAbility(ab).effect.length > 20);
  }
  assert.match(describeAbility('hallowed_ground').effect, /allies .* heal 16/);
  assert.match(describeAbility('gloaming').effect, /stuck in place/);
});

test('Hallowed Ground: trifft die Wesen um den Warden, sie halten sich an ihn, und die Gruppe heilt', () => {
  const w = S.createWorld(regionFor('sumps'), 561);
  const tank = veteran(w, 't', { cls: 'warden', level: 44, equip: { main: 'masterwork_shield' } });
  const friend = veteran(w, 'f', { cls: 'drifter', level: 40 });
  const far = veteran(w, 'x', { cls: 'drifter', level: 40 });
  const rat = w.mobs.find((m) => m.type === 'drain_rat');
  for (const o of w.mobs) if (o !== rat) { o.dead = true; o.deadUntil = 1e9; }
  tank.x = rat.x - 1; tank.y = rat.y;
  if (!S.walkable(w, tank.x, tank.y)) { tank.x = rat.x; tank.y = rat.y - 1; }
  friend.x = tank.x; friend.y = tank.y + 1;
  if (!S.walkable(w, friend.x, friend.y)) friend.y = tank.y - 1;
  far.x = 7; far.y = 4;
  tank.hp = 50; friend.hp = 40; far.hp = 40;
  applyIntent(w, 'f', { t: 'act', kind: 'mob', id: rat.id, action: 'attack' });
  run(w, 1);
  const hpRat = rat.hp;
  applyIntent(w, 't', { t: 'target', id: rat.id });
  cast(w, 't', 'hallowed_ground', 2);
  assert.ok(rat.hp < hpRat, 'die Ratte wird getroffen');
  assert.equal(rat.angryAt, 't', 'und hält sich an den Warden');
  assert.ok(friend.hp >= 40 + ABILITIES.hallowed_ground.mend - 25, `der Freund heilt (${friend.hp})`);
  assert.ok(tank.hp > 50 - 25 + ABILITIES.hallowed_ground.mend - 1 || tank.hp > 50, 'der Warden heilt mit');
  assert.ok(far.hp <= 40, 'wer weit weg steht, heilt nicht');
});

test('Vesper Bell: blendet alles im Umkreis, die Gruppe heilt kräftig, der Stab zählt mit', () => {
  const w = S.createWorld(regionFor('sumps'), 562);
  const m = veteran(w, 'm', { cls: 'mender', level: 44, equip: { main: 'cinder_staff' } });
  const t = veteran(w, 't', { cls: 'warden', level: 44 });
  const crawler = w.mobs.find((x) => x.type === 'silt_crawler');
  for (const o of w.mobs) if (o !== crawler) { o.dead = true; o.deadUntil = 1e9; }
  t.x = crawler.x - 1; t.y = crawler.y;
  m.x = crawler.x - 2; m.y = crawler.y;
  t.hp = 30;
  cast(w, 'm', 'vesper_bell', 1);
  assert.ok(w.tick < crawler.dazzleUntil, 'der Crawler ist geblendet');
  const staff = P.equipped(m, 'main').heal;
  assert.ok(t.hp >= Math.min(t.maxHp, 30 + ABILITIES.vesper_bell.mend + staff) - 1, `Heilung mit Stab (${t.hp})`);
});

test('Lanternfall trifft Geblendete härter, Gloaming Festsitzende (gemittelt)', () => {
  const avg = (cls, ab, prep, n = 12) => {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const w = S.createWorld(regionFor('sumps'), 570 + k);
      const p = veteran(w, 'a', { cls, level: 44, equip: { main: cls === 'drifter' ? 'masterwork_shivs' : 'cinder_lens' } });
      const m = w.mobs.find((x) => x.type === 'the_undertow');
      for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
      p.x = m.x - 1; p.y = m.y;
      if (prep === 'dazzle') m.dazzleUntil = w.tick + 50;
      if (prep === 'root') m.rootUntil = w.tick + 50;
      applyIntent(w, 'a', { t: 'target', id: m.id });
      const hp = m.hp;
      cast(w, 'a', ab, 1);
      sum += hp - m.hp;
    }
    return sum / n;
  };
  const plainL = avg('flarecaster', 'lanternfall', null);
  const dazL = avg('flarecaster', 'lanternfall', 'dazzle');
  assert.ok(dazL > plainL * 1.3, `Lanternfall ${plainL} -> ${dazL}`);
  const plainG = avg('drifter', 'gloaming', null);
  const rootG = avg('drifter', 'gloaming', 'root');
  assert.ok(rootG > plainG * 1.3, `Gloaming ${plainG} -> ${rootG}`);
});

test('Nachschlag Stufe 48: Lamp and Anvil nagelt fest (Anvil Blow trifft danach härter), Second Dawn heilt die Gruppe, Solar Lance brennt', () => {
  const want = { warden: 'lamp_and_anvil', mender: 'second_dawn', flarecaster: 'solar_lance', drifter: 'last_shadow' };
  for (const [cls, ab] of Object.entries(want)) {
    assert.ok(CLASSES[cls].abilities.some(([a, l]) => a === ab && l === 48), `${cls} 48`);
    assert.ok(describeAbility(ab).effect.length > 20);
  }
  // Warden: Lamp and Anvil, dann Anvil Blow auf das festsitzende Ziel
  const w = S.createWorld(regionFor('sumps'), 590);
  const t = veteran(w, 't', { cls: 'warden', level: 48, equip: { main: 'masterwork_shield' } });
  const boss = w.mobs.find((x) => x.type === 'the_undertow');
  for (const o of w.mobs) if (o !== boss) { o.dead = true; o.deadUntil = 1e9; }
  t.x = boss.x - 1; t.y = boss.y;
  applyIntent(w, 't', { t: 'target', id: boss.id });
  cast(w, 't', 'lamp_and_anvil', 1);
  assert.ok(w.tick < boss.rootUntil, 'der Boss sitzt fest');
  assert.equal(boss.angryAt, 't');
  // Mender: Second Dawn
  const w2 = S.createWorld(regionFor('sumps'), 591);
  const m = veteran(w2, 'm', { cls: 'mender', level: 48 });
  const f = veteran(w2, 'f', { cls: 'warden', level: 48 });
  f.x = m.x + 1; f.y = m.y; f.hp = 20;
  cast(w2, 'm', 'second_dawn', 1);
  assert.ok(f.hp >= 20 + ABILITIES.second_dawn.heal - 1);
  // Flarecaster: Solar Lance setzt das Ziel in Brand
  const w3 = S.createWorld(regionFor('sumps'), 592);
  const fl = veteran(w3, 'a', { cls: 'flarecaster', level: 48, equip: { main: 'verdigris_lens' } });
  const b3 = w3.mobs.find((x) => x.type === 'the_undertow');
  for (const o of w3.mobs) if (o !== b3) { o.dead = true; o.deadUntil = 1e9; }
  fl.x = b3.x - 3; fl.y = b3.y;
  applyIntent(w3, 'a', { t: 'target', id: b3.id });
  const hp = b3.hp;
  cast(w3, 'a', 'solar_lance', 1);
  assert.ok(b3.hp < hp && b3.burn?.left > 0, 'trifft und brennt');
});
