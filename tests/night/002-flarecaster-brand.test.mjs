// Nacht 2, Dauerauftrag Klassen: Flarecaster bis Stufe 16. Glare (10) blendet aus der Ferne,
// Cinder Brand (13) lässt das Ziel nachbrennen (neue Wirkung burn), Starfall (16) trifft eine große Fläche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES } from '../../content/abilities.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { describeAbility } from '../../shared/describe.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

const levelOf = (id) => CLASSES.flarecaster.abilities.find(([a]) => a === id)[1];
const NEW = ['glare', 'cinder_brand', 'starfall'];

test('Glare, Cinder Brand und Starfall kommen mit der Stufe auf die Leiste', () => {
  const w = S.createWorld(REGION, 221);
  const p = veteran(w, 'a', { cls: 'flarecaster', level: levelOf('glare') - 1, equip: { main: 'brass_lens' } });
  for (const id of NEW) assert.ok(!P.barOf(p).includes(id));
  for (const id of NEW) {
    P.gainClassXp(p, P.xpForLevel(levelOf(id)) - p.classes.flarecaster.xp);
    assert.ok(P.barOf(p).includes(id), `${id} ab Stufe ${levelOf(id)}`);
    assert.ok(describeAbility(id).effect.length > 10);
  }
  assert.ok(describeAbility('cinder_brand').effect.includes('burns'));
  assert.ok(describeAbility('glare').effect.includes('cannot attack'));
});

// Ein Wolf aus Hushwood, der Flarecaster steht in Reichweite
function setup(seed, level) {
  const w = S.createWorld(REGION, seed);
  w.daylight = 0;
  const p = veteran(w, 'a', { cls: 'flarecaster', level, equip: { main: 'glim_lens', head: 'brass_hood', body: 'brass_coat', feet: 'brass_boots', lantern: 'brass_lantern' }, bag: [{ id: 'bitter_tonic', n: 10 }] });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  for (const [dx, dy] of [[0, 4], [0, -4], [4, 0], [-4, 0], [3, 3], [-3, 3]]) {
    if (S.walkable(w, wolf.x + dx, wolf.y + dy)) { p.x = wolf.x + dx; p.y = wolf.y + dy; break; }
  }
  applyIntent(w, 'a', { t: 'target', id: wolf.id });
  return { w, p, wolf };
}

function cast(w, p, id) {
  applyIntent(w, 'a', { t: 'ability', id });
  for (let i = 0; i < 16 && !(p.cds[id] > w.tick); i++) run(w, 1);
  assert.ok(p.cds[id] > w.tick, `${id} ausgelöst`);
}

test('Cinder Brand: Treffer, dann brennt der Wolf weiter, auch ohne weitere Schläge', () => {
  const { w, p, wolf } = setup(222, levelOf('cinder_brand'));
  const oil = p.oil;
  cast(w, p, 'cinder_brand');
  assert.ok(p.oil <= oil - ABILITIES.cinder_brand.oil, 'kostet Öl');
  assert.ok(wolf.burn, 'brennt');
  // Nichts mehr tun: Der Wolf verliert trotzdem Leben
  applyIntent(w, 'a', { t: 'target', id: null });
  p.target = null; p.engaged = false;
  const hp = wolf.hp;
  run(w, ABILITIES.cinder_brand.burn.ticks);
  assert.ok(wolf.hp < hp || wolf.dead, 'Nachbrennen macht Schaden');
  assert.ok(hp - wolf.hp >= ABILITIES.cinder_brand.burn.dmg * 3, 'mehrere Brandschläge');
  run(w, 10);
  assert.equal(wolf.burn, null, 'das Feuer geht aus');
});

test('Glare blendet aus der Ferne; Flarecaster 16 besiegt einen Hushwood-Wolf mit allem', () => {
  const { w, p, wolf } = setup(223, levelOf('starfall'));
  cast(w, p, 'glare');
  assert.ok(wolf.dazzleUntil > w.tick - 2, 'geblendet');
  const rot = ['starfall', 'cinder_brand', 'sear', 'flare_bolt', 'glare', 'sunspot'];
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: wolf.id, action: 'attack' });
  for (let i = 0; i < 900 && !wolf.dead; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const slot = p.bag.findIndex((s) => s?.id === 'bitter_tonic');
      if (slot >= 0) applyIntent(w, 'a', { t: 'use', slot });
    }
    applyIntent(w, 'a', { t: 'ability', id: rot[i % rot.length] });
    run(w, 1);
  }
  assert.ok(wolf.dead, 'der Wolf fällt');
  assert.ok(p.oil < 100, 'es hat Öl gekostet');
});

test('Starfall trifft alles in der Fläche', () => {
  const { w, p, wolf } = setup(224, levelOf('starfall'));
  const other = w.mobs.find((m) => m !== wolf && !m.dead);
  other.x = wolf.x; other.y = wolf.y + 1;
  const a = wolf.hp, b = other.hp;
  cast(w, p, 'starfall');
  assert.ok(wolf.hp < a && other.hp < b, 'beide getroffen');
});
