// Nacht 2, Nachschlag: Mender bekommt Smoulder (Stufe 20): Glut auf allem im Umkreis, das nachbrennt
// (burst mit burn). Ein Mender allein kommt damit gegen zwei Wölfe voran.
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

const LVL = CLASSES.mender.abilities.find(([a]) => a === 'smoulder')[1];

test('Smoulder: ab Stufe 20, zwei Wölfe brennen nach, ohne dass der Mender weiter zuschlägt', () => {
  const w = S.createWorld(REGION, 311);
  w.daylight = 1;
  const p = veteran(w, 'a', { cls: 'mender', level: LVL - 1, equip: { main: 'glim_staff', body: 'glim_coat' } });
  assert.ok(!P.barOf(p).includes('smoulder'));
  P.gainClassXp(p, P.xpForLevel(LVL) - p.classes.mender.xp);
  assert.ok(P.barOf(p).includes('smoulder'));
  assert.ok(describeAbility('smoulder').effect.includes('burns'));

  const wolves = w.mobs.filter((m) => m.type === 'wolf').slice(0, 2);
  const at = wolves[0];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (S.walkable(w, at.x + dx, at.y + dy)) { p.x = at.x + dx; p.y = at.y + dy; break; }
  }
  wolves[1].x = p.x + (p.x - at.x); wolves[1].y = p.y + (p.y - at.y);
  applyIntent(w, 'a', { t: 'ability', id: 'smoulder' });
  for (let i = 0; i < 12 && !(p.cds.smoulder > w.tick); i++) run(w, 1);
  assert.ok(p.cds.smoulder > w.tick, 'Smoulder ausgelöst');
  for (const m of wolves) assert.ok(m.burn, 'brennt');
  const hp = wolves.map((m) => m.hp);
  run(w, ABILITIES.smoulder.burn.ticks);
  wolves.forEach((m, i) => assert.ok(m.dead || m.hp < hp[i], 'Nachbrennen trifft beide'));
});
