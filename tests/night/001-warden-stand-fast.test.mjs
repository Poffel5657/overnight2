// Nacht 1, Dauerauftrag Klassen: Warden bekommt Stand Fast (Stufe 12) und Beacon Slam (Stufe 16).
// Beacon Slam ist ein Stoß im Nahbereich, der blendet und alles Getroffene an den Warden bindet.
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

const levelOf = (id) => CLASSES.warden.abilities.find(([a]) => a === id)[1];

test('Stand Fast und Beacon Slam kommen mit der Stufe auf die Leiste', () => {
  const w = S.createWorld(REGION, 31);
  const p = veteran(w, 'a', { level: levelOf('stand_fast') - 1 });
  assert.ok(!P.barOf(p).includes('stand_fast'));
  // Eine Stufe durch Erfahrung (wie im Spiel über grantXp beim Besiegen)
  P.gainClassXp(p, P.xpForLevel(levelOf('stand_fast')) - p.classes.warden.xp);
  assert.ok(P.barOf(p).includes('stand_fast'));
  assert.ok(!P.barOf(p).includes('beacon_slam'));
  P.gainClassXp(p, P.xpForLevel(levelOf('beacon_slam')) - p.classes.warden.xp);
  assert.ok(P.barOf(p).includes('beacon_slam'));
  for (const id of ['stand_fast', 'beacon_slam']) assert.ok(describeAbility(id).effect.length > 10, `${id} hat eine Beschreibung`);
  assert.ok(describeAbility('beacon_slam').effect.includes('turns on you'));
});

test('Warden auf Stufe 16 gegen Hushwood-Wölfe: Beacon Slam blendet und bindet, Stand Fast heilt', () => {
  const w = S.createWorld(REGION, 32);
  w.daylight = 0;
  const p = veteran(w, 'a', { level: levelOf('beacon_slam'), equip: { main: 'glim_shield', head: 'brass_hood', body: 'glim_coat', feet: 'brass_boots' } });
  const ally = veteran(w, 'b', { cls: 'flarecaster', level: 16, equip: { main: 'glim_lens' } });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  p.x = wolf.home.x; p.y = wolf.home.y + 1;
  if (!S.walkable(w, p.x, p.y)) p.y = wolf.home.y - 1;
  ally.x = p.x; ally.y = p.y;
  // Der Wolf hat sich den Flarecaster geschnappt; der Warden holt ihn mit Beacon Slam zu sich
  wolf.angryAt = 'b';
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: wolf.id, action: 'attack' });
  run(w, 2);
  const hp = wolf.hp;
  applyIntent(w, 'a', { t: 'ability', id: 'beacon_slam' });
  for (let i = 0; i < 20 && !(p.cds.beacon_slam > w.tick); i++) run(w, 1);
  assert.ok(p.cds.beacon_slam > w.tick, 'Beacon Slam ausgelöst');
  assert.ok(wolf.hp < hp, 'Schaden');
  assert.equal(wolf.angryAt, 'a', 'der Wolf will jetzt den Warden');
  assert.ok(wolf.dazzleUntil > w.tick - 2, 'geblendet');

  // Stand Fast: Heilung und halber Schaden
  p.hp = Math.floor(p.maxHp / 2);
  const before = p.hp;
  applyIntent(w, 'a', { t: 'ability', id: 'stand_fast' });
  for (let i = 0; i < 12 && !(p.cds.stand_fast > w.tick); i++) run(w, 1);
  assert.ok(p.hp > before, 'Stand Fast heilt');
  assert.ok(p.braceUntil > w.tick, 'und stemmt sich');

  // Der Kampf ist zu gewinnen und kostet etwas
  fight(w, 'a', wolf, ['bash', 'shield_slam', 'beacon_slam', 'stand_fast']);
  assert.ok(wolf.dead, 'der Wolf fällt');
  assert.ok(p.hp < p.maxHp || p.oil < 100, 'es hat etwas gekostet');
});
