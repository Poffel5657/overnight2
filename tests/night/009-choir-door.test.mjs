// Nacht 9, Nachschlag (aus Gebet 8, Zettel „chapel-riddle-room“): The Choir Door. Tallow (ab 36, nach „The Drowned Choir“)
// schickt einen zur Tür unter der Chortreppe der Drowned Chapel. Der Cantor fragt dreimal; die Antworten stehen auf drei
// Tafeln (Glocke, Fisch, Lampe), die Reihenfolge an der Wand bei der Treppe. Falsch = von vorn. Dahinter Truhe und Stimmgabel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

const GEAR = { main: 'greyglass_shield', head: 'wraithsilk_hood', body: 'choir_mantle', feet: 'wardstone_boots', lantern: 'greyglass_lantern' };
const WARDEN = ['anvil_blow', 'last_light', 'beacon_slam', 'shield_slam', 'bash', 'stand_fast', 'lantern_hook'];

function fight(w, pid, mob, ticks = 1500) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0 && !p.travel; i++) {
    if (p.hp < p.maxHp * 0.45) {
      const s = p.bag.findIndex((x) => x?.id === 'hearth_salve');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: WARDEN[i % WARDEN.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

// Untersuchen und lesen, was dort steht (wie ein Spieler: hinlaufen, Examine, Log lesen)
function read(w, pid, o) {
  applyIntent(w, pid, { t: 'act', kind: 'object', id: o.id, action: 'examine' });
  const seen = [];
  for (let i = 0; i < 400 && w.players.get(pid).goal; i++) run(w, 1, (ev) => seen.push(...ev));
  run(w, 1, (ev) => seen.push(...ev));
  return seen.filter((e) => e.text).map((e) => e.text).join(' ');
}

test('The Choir Door: Tallow, die Tafeln, der Cantor (falsch, dann richtig), die Tür, die Stimmgabel, Tallow', () => {
  const k = S.createWorld(regionFor('kindle'), 951);
  k.date = '2026-11-20';
  const done = { kindling: { done: true }, older_prayer: { done: true }, drowned_choir: { done: true } };
  let p = veteran(k, 'a', { cls: 'warden', level: 35, quests: done });
  talk(k, 'a', 'tallow');
  choose(k, 'a', 'anything about a door');
  assert.equal(p.dialog.page, 'cd_early', 'unter 36 zu früh');
  S.removePlayer(k, 'a');
  p = veteran(k, 'a', { cls: 'warden', level: 38, quests: done, equip: GEAR, bag: [{ id: 'hearth_salve', n: 6 }] });
  talk(k, 'a', 'tallow');
  choose(k, 'a', 'anything about a door');
  assert.equal(p.quests.the_choir_door.step, 0);

  const w = S.createWorld(regionFor('drowned_chapel'), 952);
  w.date = k.date;
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(k, 'a'));
  const door = w.objects.find((o) => o.type === 'door' && o.to === 'drowned_chapel' && o.needs);
  // Die Tür ist zu
  actOn(w, 'a', door, 'enter');
  assert.equal(p.travel, undefined, 'ohne Antwort zu');
  // Die Tafeln lesen (die Sänger in den Seitenschiffen mögen keine Leser)
  const plaques = w.objects.filter((o) => o.type === 'plaque');
  assert.equal(plaques.length, 4, 'drei Tafeln und die Regel');
  const text = {};
  for (const o of plaques) {
    for (const m of w.mobs.filter((x) => !x.dead && Math.hypot(x.x - o.x, x.y - o.y) < 7)) fight(w, 'a', m);
    text[o.name] = read(w, 'a', o);
  }
  assert.match(text['a hymn plaque with a bell'], /KNEEL/);
  assert.match(text['a hymn plaque with a fish'], /CARRY/);
  assert.match(text['a hymn plaque with a lamp'], /DOES NOT SLEEP/);
  assert.match(text['the cantor\'s rule'], /BELL SINGS LOW/);
  // Vor der Tür: die Sänger im westlichen Seitenschiff
  for (const m of w.mobs.filter((x) => !x.dead && Math.hypot(x.x - door.x, x.y - door.y) < 8)) fight(w, 'a', m);
  assert.ok(!p.travel, `steht noch (hp ${p.hp})`);
  // Erst falsch (Fisch zuerst): von vorn
  talk(w, 'a', 'cantor');
  choose(w, 'a', 'Listen.');
  choose(w, 'a', 'The ones who carry.');
  assert.equal(p.dialog.page, 'c_wrong');
  assert.equal(p.quests.the_choir_door.step, 0);
  choose(w, 'a', 'Start again.');
  // Glocke tief, Fisch dazwischen, Lampe oben
  choose(w, 'a', 'Listen.');
  choose(w, 'a', 'The ones who kneel.');
  choose(w, 'a', 'The ones who carry.');
  choose(w, 'a', 'The one who does not sleep.');
  assert.equal(p.dialog.page, 'c_right');
  assert.equal(p.quests.the_choir_door.step, 1);
  applyIntent(w, 'a', { t: 'bye' });
  // Durch die Tür (im selben Gebiet, in die Sakristei)
  actOn(w, 'a', door, 'enter');
  assert.deepEqual([p.travel?.region, p.travel?.x, p.travel?.y], ['drowned_chapel', door.tx, door.ty]);
  const w2 = S.createWorld(regionFor('drowned_chapel'), 953);
  w2.date = w.date;
  p = S.addPlayer(w2, 'a', 'a', S.removePlayer(w, 'a'));
  assert.deepEqual([p.x, p.y], [door.tx, door.ty]);
  // Die Truhe des Chors und die Nische
  const gold0 = p.gold;
  actOn(w2, 'a', w2.objects.find((o) => o.type === 'chest' && o.chest === 'choir_vault'), 'open');
  assert.ok(p.gold > gold0, 'die Truhe des Chors');
  actOn(w2, 'a', w2.objects.find((o) => o.type === 'shrine' && o.quest === 'the_choir_door'), 'search');
  run(w2, 1);
  assert.equal(P.countItem(p, 'fortieth_voice'), 1, 'die Stimmgabel');
  assert.equal(p.quests.the_choir_door.step, 2);
  // Zurück durch die Tür und hinauf; die Tür bleibt offen
  const back = w2.objects.find((o) => o.type === 'door' && o.to === 'drowned_chapel' && !o.needs);
  actOn(w2, 'a', back, 'enter');
  assert.equal(p.travel?.region, 'drowned_chapel');
  const k2 = S.createWorld(regionFor('kindle'), 954);
  p = S.addPlayer(k2, 'a', 'a', S.removePlayer(w2, 'a'));
  talk(k2, 'a', 'tallow');
  choose(k2, 'a', 'behind the choir door');
  assert.ok(p.quests.the_choir_door.done);
  assert.equal(P.countItem(p, 'cantor_stole'), 1);
  // Nach der Quest öffnet der Cantor sofort
  assert.ok(MOBS.choir_wraith.level >= 36);
});
