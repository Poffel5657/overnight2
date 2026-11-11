// Nacht 1, Nachschlag: Mender bekommt Cinder Flick (11), Hearth Song (13) und Rekindle (16).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES } from '../../content/abilities.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { describeAbility } from '../../shared/describe.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran, fight } from './helpers.mjs';

const NEW = ['cinder_flick', 'hearth_song', 'rekindle'];
const levelOf = (id) => CLASSES.mender.abilities.find(([a]) => a === id)[1];

test('Die neuen Mender-Fähigkeiten kommen mit der Stufe auf die Leiste', () => {
  const w = S.createWorld(REGION, 41);
  const p = veteran(w, 'a', { cls: 'mender', level: 10, quests: { kindling: { done: true } }, equip: { main: 'ember_staff' } });
  for (const id of NEW) {
    assert.ok(!P.barOf(p).includes(id), `${id} noch nicht da`);
    P.gainClassXp(p, P.xpForLevel(levelOf(id)) - p.classes.mender.xp);
    assert.ok(P.barOf(p).includes(id), `${id} ab Stufe ${levelOf(id)}`);
    assert.ok(describeAbility(id).effect.length > 10, `${id} hat eine Beschreibung`);
  }
});

test('Mender auf Stufe 16 hält einen Warden gegen einen Wolf am Leben und kann selbst zuschlagen', () => {
  const w = S.createWorld(REGION, 42);
  w.daylight = 0;
  const m = veteran(w, 'm', { cls: 'mender', level: 16, equip: { main: 'glim_staff', body: 'glim_coat' } });
  const t = veteran(w, 't', { level: 14, equip: { main: 'glim_shield', head: 'brass_hood', body: 'glim_coat', feet: 'brass_boots' } });
  const wolf = w.mobs.find((x) => x.type === 'wolf');
  t.x = wolf.home.x; t.y = wolf.home.y + 1;
  if (!S.walkable(w, t.x, t.y)) t.y = wolf.home.y - 1;
  m.x = t.x; m.y = t.y;

  // Cinder Flick trifft aus der Entfernung
  m.target = wolf.id;
  const hp0 = wolf.hp;
  applyIntent(w, 'm', { t: 'ability', id: 'cinder_flick' });
  for (let i = 0; i < 12 && !(m.cds.cinder_flick > w.tick); i++) run(w, 1);
  assert.ok(wolf.hp < hp0, 'Cinder Flick macht Schaden');

  // Hearth Song legt Wärme über Zeit auf beide
  applyIntent(w, 'm', { t: 'ability', id: 'hearth_song' });
  for (let i = 0; i < 12 && !(m.cds.hearth_song > w.tick); i++) run(w, 1);
  assert.ok(t.hots.length > 0 && m.hots.length > 0, 'Wärme auf beiden');

  // Rekindle heilt kräftig und dämpft Schaden
  t.hp = Math.floor(t.maxHp / 3);
  const before = t.hp;
  const oil = m.oil;
  applyIntent(w, 'm', { t: 'ability', id: 'rekindle' });
  for (let i = 0; i < 12 && !(m.cds.rekindle > w.tick); i++) run(w, 1);
  assert.ok(t.hp >= before + ABILITIES.rekindle.heal, 'Rekindle heilt den Warden');
  assert.ok(t.braceUntil > w.tick, 'und stemmt ihn');
  assert.ok(m.oil < oil, 'kostet Öl');

  fight(w, 't', wolf, ['bash', 'shield_slam']);
  assert.ok(wolf.dead, 'der Wolf fällt');
  assert.ok(!t.dead, 'der Warden lebt');
});
