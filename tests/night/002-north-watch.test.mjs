// Nacht 2, Abstimmung: der Ausguck „The North Watch“ am Nordrand von Hushwood. Haskel schickt Spieler ab
// Stufe 10 zu seiner Schwester Brindle: Wolfsfelle für den Windschutz, Wren schleift eine Linse, nachts
// hinaufklettern und nach Norden schauen. Danach gibt der Ausguck einmal pro Nacht ein wenig Erfahrung.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { LOOKOUT } from '../../content/lookout.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

const Q = QUESTS.eyes_north;

function brawl(w, pid, mob, abilities, ticks = 900) {
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead; i++) {
    if (p.hp < p.maxHp * 0.4) {
      const slot = p.bag.findIndex((s) => s?.id === 'moss_salve');
      if (slot >= 0) applyIntent(w, pid, { t: 'use', slot });
    }
    applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

// Wesen der Art jagen, bis genug von item im Beutel ist
function hunt(w, pid, type, item, n, abilities) {
  const p = w.players.get(pid);
  for (let round = 0; round < 40 && P.countItem(p, item) < n; round++) {
    const m = w.mobs.filter((x) => x.type === type && !x.dead)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, 20); continue; }
    brawl(w, pid, m, abilities);
  }
}

test('The North Watch steht am Nordrand, Brindle daneben, nicht im Weg', () => {
  const tower = REGION.objects.find((o) => o.type === 'lookout');
  assert.ok(tower && tower.y < 10, 'am Nordrand');
  assert.equal(REGION.zoneAt(tower.x + 1, tower.y + 1), 'THE NORTH WATCH');
  const b = REGION.npcs.find((n) => n.id === 'brindle');
  assert.ok(Math.hypot(b.x - tower.x, b.y - tower.y) <= 4, 'Brindle steht am Turm');
  const w = S.createWorld(REGION, 230);
  const t = w.objects.find((o) => o.type === 'lookout');
  assert.deepEqual(S.objectActions(t).map(([a]) => a), ['use', 'examine']);
});

test('Eyes on the North: Haskel, Brindle, Felle, Wren, Linse, nachts schauen, Brindle', () => {
  const w = S.createWorld(REGION, 231);
  w.daylight = 1;
  veteran(w, 'y', { level: 8 });
  talk(w, 'y', 'haskel');
  choose(w, 'y', 'watching that glow');
  assert.equal(w.players.get('y').quests.eyes_north, undefined, 'zu jung');
  S.removePlayer(w, 'y');

  // Stufe 12 Warden mit Messing-Ausrüstung
  const p = veteran(w, 'a', {
    level: 12, equip: { main: 'brass_shield', head: 'brass_hood', body: 'brass_coat', feet: 'brass_boots', lantern: 'brass_lantern' },
    bag: [{ id: 'moss_salve', n: 10 }],
  });
  talk(w, 'a', 'haskel');
  choose(w, 'a', 'watching that glow');
  assert.equal(p.quests.eyes_north.step, 0);
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'Haskel sent me');
  assert.equal(p.quests.eyes_north.step, 1);

  // Drei Wolfsfelle in Hushwood
  hunt(w, 'a', 'wolf', 'wolf_pelt', 3, ['bash', 'shield_slam', 'stand_fast']);
  assert.ok(P.countItem(p, 'wolf_pelt') >= 3, 'Felle gesammelt');
  assert.equal(p.quests.eyes_north.step, 2);
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'Three wolf pelts');
  assert.equal(p.quests.eyes_north.step, 3);

  // Wisps von Greylingen, dann zu Wren
  hunt(w, 'a', 'greyling', 'grey_wisp', 3, ['bash']);
  assert.equal(p.quests.eyes_north.step, 4);
  talk(w, 'a', 'wren');
  choose(w, 'a', 'spyglass lens');
  assert.equal(P.countItem(p, 'spyglass_lens'), 1);
  run(w, 2);
  assert.equal(p.quests.eyes_north.step, 6, 'Linse dabei');
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'spyglass lens');
  assert.equal(p.quests.eyes_north.step, 7);

  // Bei Tag sieht man nichts
  const tower = w.objects.find((o) => o.type === 'lookout');
  let evs = [];
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: tower.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1, (e) => evs.push(...e));
  assert.ok(evs.some((e) => e.text === LOOKOUT.day));
  assert.equal(p.quests.eyes_north.step, 7);

  // Nachts: das Licht im Norden, Erfahrung einmal pro Nacht
  w.daylight = 0;
  evs = [];
  const xp = p.classes.warden.xp;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: tower.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1, (e) => evs.push(...e));
  assert.ok(evs.some((e) => e.text === LOOKOUT.night));
  assert.equal(p.quests.eyes_north.step, 8);
  assert.ok(p.classes.warden.xp > xp, 'Erfahrung für die Wache');
  const xp2 = p.classes.warden.xp;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: tower.id, action: 'use' });
  run(w, 3);
  assert.equal(p.classes.warden.xp, xp2, 'nur einmal pro Nacht');

  talk(w, 'a', 'brindle');
  const gold = p.gold;
  choose(w, 'a', 'I saw it');
  assert.equal(p.quests.eyes_north.done, true);
  assert.ok(p.gold >= gold + Q.reward.gold);
  assert.equal(P.countItem(p, 'watchers_hood'), 1);
  // Die Kapuze gibt Licht
  const before = P.lanternBonus(p);
  applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((s) => s?.id === 'watchers_hood') });
  assert.equal(p.equip.head, 'watchers_hood');
  assert.equal(P.lanternBonus(p), before + ITEMS.watchers_hood.light);
  talk(w, 'a', 'brindle');
  assert.ok(!options(w, 'a').some((t) => t.includes('I saw it')));
  choose(w, 'a', 'read your book');
  assert.equal(p.dialog.page, 'book');
});

test('North Cairn: Cartography 26 am Nordrand, Notizen und manchmal grünes Glas', async () => {
  const { NODES } = await import('../../content/nodes.js');
  const lvl = NODES.north_cairn.level;
  assert.equal(NODES.north_cairn.extra[0], 'green_shard');
  const w = S.createWorld(REGION, 232);
  w.daylight = 1;
  const c = w.objects.find((o) => o.type === 'node' && o.node === 'north_cairn');
  assert.ok(c.y < 10, 'am Nordrand');
  const p = veteran(w, 'a', {
    level: 26, equip: { main: 'greyglass_shield', head: 'greyglass_hood', body: 'shell_coat', feet: 'greyglass_boots' },
    bag: [{ id: 'moss_salve', n: 10 }], profs: { cartography: { level: lvl, xp: P.xpForLevel(lvl) } },
  });
  // Wer beim Sammeln angegriffen wird, wehrt sich und fängt dann neu an (wie ein Spieler)
  for (let tries = 0; tries < 8 && P.countItem(p, 'survey_notes') < 1; tries++) {
    applyIntent(w, 'a', { t: 'act', kind: 'object', id: c.id, action: 'gather' });
    for (let i = 0; i < 800 && (p.goal || p.gather); i++) {
      if (p.hp < p.maxHp * 0.4) { const s = p.bag.findIndex((x) => x?.id === 'moss_salve'); if (s >= 0) applyIntent(w, 'a', { t: 'use', slot: s }); }
      run(w, 1);
    }
    const foe = w.mobs.find((m) => !m.dead && m.angryAt === 'a');
    if (foe) {
      applyIntent(w, 'a', { t: 'act', kind: 'mob', id: foe.id, action: 'attack' });
      for (let i = 0; i < 600 && !foe.dead; i++) { applyIntent(w, 'a', { t: 'ability', id: ['bash', 'shield_slam'][i % 2] }); run(w, 1); }
    }
  }
  assert.ok(P.countItem(p, 'survey_notes') >= 1, 'Notizen');
});
