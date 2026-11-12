// Nacht 2, Nachschlag: Stufe 24 für alle: Warden Last Light, Mender Kindred Glow, Flarecaster Prism Ward,
// Drifter Gutter Strike.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES } from '../../content/abilities.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

const lvl = (cls, id) => CLASSES[cls].abilities.find(([a]) => a === id)[1];

function cast(w, pid, id) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'ability', id });
  for (let i = 0; i < 12 && !(p.cds[id] > w.tick); i++) run(w, 1);
  assert.ok(p.cds[id] > w.tick, `${id} ausgelöst`);
}

test('Last Light: Warden heilt und hält lange stand', () => {
  const w = S.createWorld(REGION, 351);
  const p = veteran(w, 'a', { level: lvl('warden', 'last_light') - 1 });
  assert.ok(!P.barOf(p).includes('last_light'));
  P.gainClassXp(p, P.xpForLevel(lvl('warden', 'last_light')) - p.classes.warden.xp);
  assert.ok(P.barOf(p).includes('last_light'));
  p.hp = 20;
  cast(w, 'a', 'last_light');
  assert.ok(p.hp >= 20 + ABILITIES.last_light.heal - 1);
  assert.ok(p.braceUntil > w.tick + ABILITIES.last_light.brace - 4);
});

test('Kindred Glow: Mender wärmt alle im weiten Umkreis über Zeit', () => {
  const w = S.createWorld(REGION, 352);
  const m = veteran(w, 'a', { cls: 'mender', level: lvl('mender', 'kindred_glow'), equip: { main: 'glim_staff' } });
  const far = veteran(w, 'b', { level: 20 });
  far.x = m.x + 4; far.y = m.y;
  if (!S.walkable(w, far.x, far.y)) { far.x = m.x - 4; }
  far.hp = 10;
  cast(w, 'a', 'kindred_glow');
  run(w, ABILITIES.kindred_glow.ticks);
  assert.ok(far.hp > 10 + ABILITIES.kindred_glow.heal * 5, 'Verbündeter vier Felder weg wird über Zeit geheilt');
});

test('Prism Ward schützt Flarecaster und Freund; Gutter Strike trifft nachts härter', () => {
  const w = S.createWorld(REGION, 353);
  w.daylight = 0;
  const f = veteran(w, 'a', { cls: 'flarecaster', level: 24, equip: { main: 'glim_lens' } });
  const friend = veteran(w, 'b', { level: 24 });
  friend.x = f.x + 1; friend.y = f.y;
  if (!S.walkable(w, friend.x, friend.y)) friend.x = f.x - 1;
  cast(w, 'a', 'prism_ward');
  assert.ok(f.braceUntil > w.tick && friend.braceUntil > w.tick);

  for (const c of Object.values(CLASSES)) assert.ok(c.abilities.some(([, l]) => l === 24), `${c.name} hat etwas auf 24`);
  assert.ok(ABILITIES.gutter_strike.dark > ABILITIES.night_edge.dark);
  const d = veteran(w, 'c', { cls: 'drifter', level: 24, equip: { main: 'glim_shivs' } });
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (S.walkable(w, wolf.x + dx, wolf.y + dy)) { d.x = wolf.x + dx; d.y = wolf.y + dy; break; }
  }
  wolf.hp = wolf.maxHp = 9999;
  applyIntent(w, 'c', { t: 'target', id: wolf.id });
  const hp = wolf.hp;
  cast(w, 'c', 'gutter_strike');
  assert.ok(hp - wolf.hp >= ABILITIES.gutter_strike.hit[0], 'trifft hart');
});
