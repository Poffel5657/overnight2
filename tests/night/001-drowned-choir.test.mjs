// Nacht 1, Nachschlag: „The Drowned Choir“ bei Tallow (ab Stufe 28, nach The Older Prayer).
// Mire Lurker in tiefem Sinkmarsh, Glockenrahmen im Südwesten, sechs Pilger in der Drowned Chapel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, options, veteran, actOn, fight } from './helpers.mjs';

const GEAR = { main: 'greyglass_shield', head: 'greyglass_hood', body: 'greyglass_coat', feet: 'greyglass_boots' };
const Q = QUESTS.drowned_choir;

// Bis zum Wesen laufen lassen (Startpunkt daneben) und kämpfen; danach Leben auffüllen wie am Lagerfeuer.
function beat(w, pid, mob) {
  const p = w.players.get(pid);
  p.x = mob.x; p.y = mob.y + 1;
  if (!S.walkable(w, p.x, p.y)) p.y = mob.y - 1;
  if (!S.walkable(w, p.x, p.y)) p.x = mob.x + 1, p.y = mob.y;
  const hp = p.hp;
  fight(w, pid, mob, ['bash', 'shield_slam', 'stand_fast']);
  assert.ok(mob.dead, `${mob.type} fällt`);
  assert.ok(!p.dead, 'und der Spieler lebt');
  const cost = hp - p.hp;
  p.hp = p.maxHp;
  return cost;
}

test('Drowned Choir: erst ab 28, Hymnale von Lurkern, Glocke, sechs Pilger, Mantel', () => {
  const w = S.createWorld(REGION, 51);
  w.daylight = 1;
  const young = veteran(w, 'y', { level: 20, quests: { kindling: { done: true }, older_prayer: { done: true } } });
  talk(w, 'y', 'tallow');
  choose(w, 'y', 'anything else');
  assert.equal(young.quests.drowned_choir, undefined, 'zu jung: nur ein Hinweis');
  S.removePlayer(w, 'y');

  const p = veteran(w, 'a', { level: 31, equip: GEAR, quests: { kindling: { done: true }, older_prayer: { done: true } } });
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'anything else');
  assert.equal(p.quests.drowned_choir.step, 0);

  // Ohne Quest-Schritt 2 gibt der Glockenrahmen noch nichts her
  const frame = w.objects.find((o) => o.type === 'shrine' && o.gives === 'choir_bell');
  actOn(w, 'a', frame, 'search');
  assert.equal(P.countItem(p, 'choir_bell'), 0);

  // Mire Lurker jagen, bis drei Hymnale da sind; jeder Kampf kostet etwas
  let costs = 0, kills = 0;
  while (P.countItem(p, 'sodden_hymnal') < 3 && kills < 30) {
    const lurker = w.mobs.find((m) => m.type === 'mire_lurker' && !m.dead);
    if (!lurker) { run(w, 50); continue; }
    costs += beat(w, 'a', lurker);
    kills++;
  }
  assert.ok(P.countItem(p, 'sodden_hymnal') >= 3, `drei Hymnale nach ${kills} Lurkern`);
  assert.ok(costs > 0, 'Lurker tun weh');
  assert.equal(p.quests.drowned_choir.step, 1);

  talk(w, 'a', 'tallow');
  choose(w, 'a', 'Three hymnals');
  assert.equal(p.quests.drowned_choir.step, 2);

  actOn(w, 'a', frame, 'search');
  assert.equal(P.countItem(p, 'choir_bell'), 1, 'Glocke gefunden');
  assert.equal(p.quests.drowned_choir.step, 3);

  // Hinab in die Drowned Chapel
  const stairs = w.objects.find((o) => o.type === 'door' && o.to === 'drowned_chapel');
  actOn(w, 'a', stairs, 'enter');
  assert.equal(p.travel?.region, 'drowned_chapel');
  const save = S.removePlayer(w, 'a');
  const d = S.createWorld(regionFor('drowned_chapel'), 52);
  const q = S.addPlayer(d, 'a', 'a', save);
  for (let n = 0; n < Q.steps[3].n; n++) {
    const pilgrim = d.mobs.find((m) => m.type === 'drowned_pilgrim' && !m.dead);
    beat(d, 'a', pilgrim);
  }
  assert.equal(q.quests.drowned_choir.step, 4, 'der Chor ist still');

  // Zurück nach Kindle und zu Tallow
  const up = d.objects.find((o) => o.type === 'door' && o.to === 'kindle');
  actOn(d, 'a', up, 'enter');
  const back = S.removePlayer(d, 'a');
  const k = S.createWorld(REGION, 53);
  k.daylight = 1;
  const r = S.addPlayer(k, 'a', 'a', back);
  talk(k, 'a', 'tallow');
  const xp = r.classes.warden.xp;
  choose(k, 'a', 'choir is quiet');
  assert.equal(r.quests.drowned_choir.done, true);
  assert.ok(r.classes.warden.xp >= xp + Q.reward.xp);
  assert.equal(P.countItem(r, 'choir_bell'), 0, 'Tallow behält die Glocke');
  assert.equal(P.countItem(r, 'choir_mantle'), 1, 'Choir Mantle bekommen');
  assert.ok(ITEMS.choir_mantle.defence > ITEMS.greyglass_coat.defence, 'besser als der Greyglass-Mantel');
  talk(k, 'a', 'tallow');
  assert.ok(!options(k, 'a').some((o) => o.includes('anything else')), 'keine zweite Runde');
});
