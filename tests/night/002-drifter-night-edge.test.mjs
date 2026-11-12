// Nacht 2, Nachschlag: Drifter bis Stufe 16. Cheap Shot (10) blendet, Night Edge (13) schneidet im Dunkeln
// tiefer (neue Eigenschaft dark), Caltrops (16) hält alles im Umkreis fest (burst mit root).
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

const levelOf = (id) => CLASSES.drifter.abilities.find(([a]) => a === id)[1];
const NEW = ['cheap_shot', 'night_edge', 'caltrops'];

test('Cheap Shot, Night Edge und Caltrops kommen mit der Stufe', () => {
  const w = S.createWorld(REGION, 241);
  const p = veteran(w, 'a', { cls: 'drifter', level: levelOf('cheap_shot') - 1, equip: { main: 'brass_shivs' } });
  for (const id of NEW) {
    assert.ok(!P.barOf(p).includes(id));
    P.gainClassXp(p, P.xpForLevel(levelOf(id)) - p.classes.drifter.xp);
    assert.ok(P.barOf(p).includes(id), id);
  }
  assert.ok(describeAbility('night_edge').effect.includes('In the dark'));
  assert.ok(describeAbility('caltrops').effect.includes('stuck'));
});

// Drifter steht neben einem Hushwood-Wolf
function setup(seed, daylight) {
  const w = S.createWorld(REGION, seed);
  w.daylight = daylight;
  const p = veteran(w, 'a', { cls: 'drifter', level: 16, equip: { main: 'glim_shivs', head: 'brass_hood', body: 'brass_coat', feet: 'brass_boots' }, bag: [{ id: 'moss_salve', n: 10 }] });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
    if (S.walkable(w, wolf.x + dx, wolf.y + dy)) { p.x = wolf.x + dx; p.y = wolf.y + dy; break; }
  }
  applyIntent(w, 'a', { t: 'target', id: wolf.id });
  return { w, p, wolf };
}

function castOnce(w, p, id) {
  applyIntent(w, 'a', { t: 'ability', id });
  for (let i = 0; i < 16 && !(p.cds[id] > w.tick); i++) run(w, 1);
  assert.ok(p.cds[id] > w.tick, `${id} ausgelöst`);
}

test('Night Edge schneidet nachts im Wald tiefer als bei Tag', () => {
  const avg = (daylight) => {
    let sum = 0;
    for (let s = 0; s < 12; s++) {
      const { w, p, wolf } = setup(250 + s, daylight);
      wolf.hp = wolf.maxHp = 9999;
      const before = wolf.hp;
      castOnce(w, p, 'night_edge');
      sum += before - wolf.hp;
      assert.equal(S.inDark(w, p), daylight < 0.5);
    }
    return sum / 12;
  };
  const day = avg(1), night = avg(0);
  assert.ok(night > day * 1.25, `nachts mehr Schaden (${night} gegen ${day}, Faktor ${ABILITIES.night_edge.dark})`);
});

test('Caltrops hält fest, Cheap Shot blendet; Drifter 16 besiegt einen Wolf in der Nacht', () => {
  const { w, p, wolf } = setup(260, 0);
  castOnce(w, p, 'caltrops');
  assert.ok(wolf.rootUntil > w.tick, 'steckt fest');
  castOnce(w, p, 'cheap_shot');
  assert.ok(wolf.dazzleUntil >= w.tick - 4, 'geblendet');
  const rot = ['night_edge', 'twin_cut', 'cheap_shot', 'slash', 'caltrops'];
  for (let i = 0; i < 900 && !wolf.dead; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const slot = p.bag.findIndex((s) => s?.id === 'moss_salve');
      if (slot >= 0) applyIntent(w, 'a', { t: 'use', slot });
    }
    if (!p.target) applyIntent(w, 'a', { t: 'act', kind: 'mob', id: wolf.id, action: 'attack' });
    applyIntent(w, 'a', { t: 'ability', id: rot[i % rot.length] });
    run(w, 1);
  }
  assert.ok(wolf.dead, 'der Wolf fällt');
});
