// Nacht 2, Nachschlag: Warden bekommt Bulwark (Stufe 20): alle Wesen im Umkreis greifen den Warden an,
// er und Verbündete in der Nähe nehmen kurz halben Schaden (taunt mit brace).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { describeAbility } from '../../shared/describe.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

const LVL = CLASSES.warden.abilities.find(([a]) => a === 'bulwark')[1];

test('Bulwark: ab Stufe 20, holt die Wölfe vom Flarecaster weg und schützt ihn', () => {
  const w = S.createWorld(REGION, 291);
  w.daylight = 0;
  const p = veteran(w, 'a', { level: LVL - 1, equip: { main: 'glim_shield', body: 'glim_coat' } });
  assert.ok(!P.barOf(p).includes('bulwark'));
  P.gainClassXp(p, P.xpForLevel(LVL) - p.classes.warden.xp);
  assert.ok(P.barOf(p).includes('bulwark'));
  assert.ok(describeAbility('bulwark').effect.includes('half damage'));

  const ally = veteran(w, 'b', { cls: 'flarecaster', level: 20, equip: { main: 'glim_lens' } });
  const wolves = w.mobs.filter((m) => m.type === 'wolf').slice(0, 2);
  const at = wolves[0];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (S.walkable(w, at.x + dx, at.y + dy)) { p.x = at.x + dx; p.y = at.y + dy; break; }
  }
  ally.x = p.x; ally.y = p.y;
  wolves[1].x = at.x; wolves[1].y = at.y;
  for (const m of wolves) m.angryAt = 'b';
  applyIntent(w, 'a', { t: 'ability', id: 'bulwark' });
  for (let i = 0; i < 12 && !(p.cds.bulwark > w.tick); i++) run(w, 1);
  assert.ok(p.cds.bulwark > w.tick, 'Bulwark ausgelöst');
  for (const m of wolves) assert.equal(m.angryAt, 'a', 'Wölfe wenden sich dem Warden zu');
  assert.ok(ally.braceUntil > w.tick && p.braceUntil > w.tick, 'beide stehen geschützt');
});
