// Nacht 2, Nachschlag: Flarecaster Sunlance (20, weitester Schuss) und Drifter Smoke Bomb (20, blendet
// alles im Umkreis und verschwindet). Damit haben alle vier Klassen Fähigkeiten bis Stufe 20.
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

test('Alle vier Klassen haben etwas Neues auf Stufe 20', () => {
  for (const c of Object.values(CLASSES)) assert.ok(c.abilities.some(([, l]) => l === 20), c.name);
  for (const id of ['sunlance', 'smoke_bomb']) assert.ok(describeAbility(id).effect.length > 10);
});

function nearWolf(seed, cls, main, dist) {
  const w = S.createWorld(REGION, seed);
  w.daylight = 0;
  const p = veteran(w, 'a', { cls, level: 20, equip: { main, body: 'glim_coat' } });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  for (const [dx, dy] of [[dist, 0], [-dist, 0], [0, dist], [0, -dist]]) {
    if (S.walkable(w, wolf.x + dx, wolf.y + dy)) { p.x = wolf.x + dx; p.y = wolf.y + dy; break; }
  }
  applyIntent(w, 'a', { t: 'target', id: wolf.id });
  return { w, p, wolf };
}

test('Sunlance trifft auf 7 Felder, weiter als Sear', () => {
  assert.ok(ABILITIES.sunlance.range > ABILITIES.sear.range);
  const { w, p, wolf } = nearWolf(331, 'flarecaster', 'glim_lens', 7);
  const hp = wolf.hp;
  applyIntent(w, 'a', { t: 'ability', id: 'sunlance' });
  for (let i = 0; i < 12 && !(p.cds.sunlance > w.tick); i++) run(w, 1);
  assert.ok(p.cds.sunlance > w.tick, 'ausgelöst');
  assert.ok(wolf.hp < hp || wolf.dead, 'getroffen');
});

test('Smoke Bomb blendet den Wolf, verwirft seinen Ansturm und lässt den Drifter verschwinden', () => {
  const { w, p, wolf } = nearWolf(332, 'drifter', 'glim_shivs', 1);
  wolf.angryAt = 'a';
  wolf.attacks = 2; // nächster Angriff ist der angekündigte
  for (let i = 0; i < 20 && !w.telegraphs.some((t) => t.mob === wolf.id); i++) run(w, 1);
  assert.ok(w.telegraphs.some((t) => t.mob === wolf.id), 'der Wolf kündigt an');
  applyIntent(w, 'a', { t: 'ability', id: 'smoke_bomb' });
  for (let i = 0; i < 6 && !(p.cds.smoke_bomb > w.tick); i++) run(w, 1);
  assert.ok(p.cds.smoke_bomb > w.tick, 'ausgelöst');
  assert.ok(!w.telegraphs.some((t) => t.mob === wolf.id), 'Ansturm verpufft');
  assert.ok(wolf.dazzleUntil > w.tick - 6 && p.fadeUntil > w.tick, 'geblendet und verschwunden');
});
