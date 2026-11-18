// Nacht 8, vom Nightwright (Bogen „The Second Light“, Akt 2): „Not Thieves“. Ama fehlen Scheite; oben an der Steinstraße
// bewachen Hollow Wardens (Gruppen-Wesen, Stufe 34) Kindles Holz am Rastplatz der Träger. Eine Gruppe besiegt einen,
// findet das Scheit mit Amas Kreide, der Stranger erklärt, Ama zieht ihren Schluss. Danach „Beads for Home“.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

const ROT = {
  warden: ['taunt', 'anvil_blow', 'last_light', 'beacon_slam', 'shield_slam', 'bash', 'stand_fast'],
  mender: ['banked_hearth', 'ember_mend', 'kindred_glow', 'rekindle', 'warmth', 'cinder_bloom', 'staff_rap'],
  flarecaster: ['flashpoint', 'noonbrand', 'sunlance', 'cinder_brand', 'sear', 'flare_bolt'],
  drifter: ['hamstring', 'lampblack_cut', 'gutter_strike', 'night_edge', 'twin_cut', 'slash'],
};
const GEAR = {
  warden: { main: 'greyglass_shield', head: 'wraithsilk_hood', body: 'choir_mantle', feet: 'wardstone_boots', lantern: 'greyglass_lantern' },
  mender: { main: 'greyglass_staff', head: 'wraithsilk_hood', body: 'greyglass_coat', feet: 'greyglass_boots', lantern: 'greyglass_lantern' },
  flarecaster: { main: 'greyglass_lens', head: 'greyglass_hood', body: 'greyglass_coat', feet: 'greyglass_boots', lantern: 'greyglass_lantern' },
  drifter: { main: 'greyglass_shivs', head: 'greyglass_hood', body: 'greyglass_coat', feet: 'greyglass_boots', lantern: 'greyglass_lantern' },
};

// Eine Gruppe kämpft gegen ein Wesen: jeder greift an, drückt seine Fähigkeiten, geht aus angekündigten Flächen.
function groupFight(w, ids, mob, ticks = 2000) {
  for (let t = 0; t < ticks && !mob.dead; t++) {
    for (const id of ids) {
      const p = w.players.get(id);
      if (!p || p.hp <= 0 || p.travel) continue;
      const tele = w.telegraphs.find((x) => x.tiles.some((c) => c.x === p.x && c.y === p.y));
      if (tele) {
        const free = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].map(([a, b]) => ({ x: p.x + a, y: p.y + b }))
          .find((c) => S.walkable(w, c.x, c.y) && !tele.tiles.some((q) => q.x === c.x && q.y === c.y));
        if (free) { applyIntent(w, id, { t: 'walk', x: free.x, y: free.y }); continue; }
      }
      if (!p.engaged || p.target !== mob.id) applyIntent(w, id, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
      const rot = ROT[p.cls];
      applyIntent(w, id, { t: 'ability', id: rot[t % rot.length] });
    }
    run(w, 1);
  }
}

function party(w, ids) {
  // Gruppe über Einladung und Annahme (wie Spieler)
  for (const id of ids.slice(1)) {
    applyIntent(w, ids[0], { t: 'partyInvite', id });
    applyIntent(w, id, { t: 'partyAnswer', from: ids[0], yes: true });
  }
  run(w, 1);
}

test('Hollow Wardens sind eine Gruppenaufgabe: allein auf 34 kaum, zu viert auf 34 gut', () => {
  const m0 = MOBS.hollow_warden;
  assert.ok(m0.level === 34 && m0.fallText, 'Stufe 34, weicht zurück statt zu sterben');
  // Allein
  {
    const w = S.createWorld(regionFor('stone_road'), 821);
    w.daylight = 0;
    const m = w.mobs.find((x) => x.type === 'hollow_warden');
    for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
    const p = veteran(w, 'a', { cls: 'warden', level: 34, equip: GEAR.warden });
    p.x = m.x; p.y = m.y + 2;
    groupFight(w, ['a'], m, 1200);
    assert.ok(!m.dead || p.travel, `allein auf 34 zu viel (Warden ${m.hp}/${m.maxHp}, Spieler ${p.hp})`);
  }
  // Zu viert
  {
    const w = S.createWorld(regionFor('stone_road'), 822);
    w.daylight = 0;
    const m = w.mobs.find((x) => x.type === 'hollow_warden');
    for (const o of w.mobs) if (o !== m) { o.dead = true; o.deadUntil = 1e9; }
    const ids = ['w', 'm', 'f', 'd'];
    const cls = ['warden', 'mender', 'flarecaster', 'drifter'];
    ids.forEach((id, i) => {
      const p = veteran(w, id, { cls: cls[i], level: 34, equip: GEAR[cls[i]] });
      p.x = m.x + (i % 2 ? 1 : -1); p.y = m.y + 2 + (i > 1 ? 1 : 0);
      if (!S.walkable(w, p.x, p.y)) p.y = m.y + 2;
    });
    party(w, ids);
    const t0 = w.tick;
    groupFight(w, ids, m, 1200);
    assert.ok(m.dead, `zu viert fällt er (${m.hp}/${m.maxHp})`);
    const secs = (w.tick - t0) * S.TICK_MS / 1000;
    assert.ok(secs > 15 && secs < 240, `dauert eine Weile (${secs}s)`);
    assert.ok(ids.every((id) => !w.players.get(id).travel), 'alle stehen noch');
  }
});

test('Not Thieves: Ama, der Rastplatz, ein Hollow Warden, das Scheit, der Stranger, Ama; dann Beads for Home', () => {
  let k = S.createWorld(regionFor('kindle'), 823);
  k.date = '2026-11-19';
  k.daylight = 0;
  const done = { kindling: { done: true }, the_woodpile: { done: true } };
  let p = veteran(k, 'a', { cls: 'warden', level: 27, quests: done });
  talk(k, 'a', 'ama');
  choose(k, 'a', 'wrong with the pile');
  assert.equal(p.dialog.page, 'nt_early', 'unter 28 zu früh');
  S.removePlayer(k, 'a');
  p = veteran(k, 'a', { cls: 'warden', level: 34, quests: done, equip: GEAR.warden });
  talk(k, 'a', 'ama');
  choose(k, 'a', 'wrong with the pile');
  assert.equal(p.quests.not_thieves.step, 0);
  actOn(k, 'a', k.objects.find((o) => o.type === 'door' && o.to === 'stone_road'), 'enter');
  assert.equal(p.travel?.region, 'stone_road');

  const w = S.createWorld(regionFor('stone_road'), 824);
  w.date = '2026-11-19';
  w.daylight = 0;
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(k, 'a'));
  // Die Straße hinauf bis zum Rastplatz, ohne sich mit Creepern und Motten aufzuhalten (die sind in einem anderen Test)
  for (const m of w.mobs) if (m.type !== 'hollow_warden') { m.dead = true; m.deadUntil = 1e9; }
  // Bis an den Rand der Lichtung, wo die Straße hinaufkommt
  applyIntent(w, 'a', { t: 'walk', x: 24, y: 10 });
  run(w, 200);
  assert.equal(w.region.zoneAt(p.x, p.y), 'THE CARRIERS\' REST', `oben angekommen (${p.x},${p.y})`);
  // Freunde kommen nach (drei andere Berufungen, Stufe 34)
  const ids = ['a', 'm', 'f', 'd'];
  ['mender', 'flarecaster', 'drifter'].forEach((cls, i) => {
    const q = veteran(w, ids[i + 1], { cls, level: 34, equip: GEAR[cls], quests: done });
    q.x = p.x + i - 1; q.y = p.y + 1;
    if (!S.walkable(w, q.x, q.y)) { q.x = p.x; q.y = p.y; }
  });
  party(w, ids);
  // Der Warden, der am Holzstapel steht
  const stackObj = w.objects.find((o) => o.type === 'shrine' && o.quest === 'not_thieves');
  const target = w.mobs.filter((m) => m.type === 'hollow_warden').sort((a, b) => Math.hypot(a.x - stackObj.x, a.y - stackObj.y) - Math.hypot(b.x - stackObj.x, b.y - stackObj.y))[0];
  assert.ok(!w.mobs.some((m) => m.angryAt), `am Rand der Lichtung bemerkt einen noch keiner (${p.x},${p.y}; ${w.mobs.filter((m) => m.angryAt).map((m) => m.type + '@' + m.x + ',' + m.y).join(' ')})`);
  const seen = [];
  for (let k2 = 0; k2 < 3 && !target.dead; k2++) {
    groupFight(w, ids, target, 1200);
    // Wer sonst noch angreift, wird auch bekämpft
    for (const m of w.mobs.filter((x) => !x.dead && x.angryAt && x !== target)) groupFight(w, ids, m, 1200);
  }
  assert.ok(target.dead, 'ein Hollow Warden weicht zurück');
  assert.equal(p.quests.not_thieves.step, 1, 'für die ganze Gruppe gezählt');
  // Die anderen Wardens kommen mit; erst wenn alles ruhig ist, das Holz durchsuchen
  for (const m of w.mobs.filter((x) => !x.dead && x.angryAt)) groupFight(w, ids, m, 1500);
  const stack = w.objects.find((o) => o.type === 'shrine' && o.quest === 'not_thieves');
  actOn(w, 'a', stack, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'chalked_log'), 1, `das Scheit mit Amas Kreide (bei ${p.x},${p.y}, Stapel ${stack.x},${stack.y}, hp ${p.hp}, travel ${JSON.stringify(p.travel)}, Schritt ${p.quests.not_thieves.step}, Wardens ${w.mobs.filter((x) => x.type === 'hollow_warden').map((x) => x.dead + ':' + x.angryAt).join(' ')})`);
  assert.equal(p.quests.not_thieves.step, 2);
  // Perlen: die Wardens tragen sie. So lange in der Gruppe kämpfen, bis drei beisammen sind.
  for (let k3 = 0; k3 < 12 && P.countItem(p, 'hollow_bead') < 3; k3++) {
    const m = w.mobs.find((x) => x.type === 'hollow_warden' && !x.dead);
    if (!m) { run(w, MOBS.hollow_warden.respawn + 2); continue; }
    groupFight(w, ids, m, 1500);
    for (const x of w.mobs.filter((x) => !x.dead && x.angryAt)) groupFight(w, ids, x, 1500);
  }
  const beads = P.countItem(p, 'hollow_bead') + ids.slice(1).reduce((n, id) => n + P.countItem(w.players.get(id), 'hollow_bead'), 0);
  assert.ok(beads >= 3, `Perlen gefunden (${beads})`);
  // Wer sie hat, gibt sie 'a' (Handel ist eine eigene Mechanik; hier reicht, dass die Gruppe sie hat)
  for (const id of ids.slice(1)) {
    const q = w.players.get(id);
    const n = P.countItem(q, 'hollow_bead');
    if (n && P.countItem(p, 'hollow_bead') < 3) { P.takeItem(q, 'hollow_bead', n); P.addItem(p, 'hollow_bead', n); }
  }
  assert.ok(P.countItem(p, 'peat_brick') + ids.slice(1).reduce((n, id) => n + P.countItem(w.players.get(id), 'peat_brick'), 0) >= 1, 'Torf als Beute');
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 'enter');
  assert.equal(p.travel?.region, 'kindle');

  k = S.createWorld(regionFor('kindle'), 825);
  k.date = '2026-11-19';
  k.daylight = 0;
  const r = S.addPlayer(k, 'a', 'a', S.removePlayer(w, 'a'));
  talk(k, 'a', 'stranger');
  choose(k, 'a', 'camp on the Stone Road');
  assert.equal(r.quests.not_thieves.step, 3);
  talk(k, 'a', 'ama');
  choose(k, 'a', 'top of the Stone Road');
  assert.ok(r.quests.not_thieves.done);
  assert.equal(P.countItem(r, 'chalked_log'), 0, 'Ama nimmt ihr Scheit zurück');
  assert.ok(P.countItem(r, 'peat_oil') >= 2);
  talk(k, 'a', 'ama');
  choose(k, 'a', 'guard on the pile');
  assert.equal(r.dialog.page, 'nt_after');
  // Beads for Home
  talk(k, 'a', 'stranger');
  choose(k, 'a', 'green beads');
  assert.equal(r.quests.beads_for_home.step, 1, 'drei Perlen sind schon im Beutel');
  talk(k, 'a', 'stranger');
  choose(k, 'a', 'Three of their beads');
  assert.ok(r.quests.beads_for_home.done);
  assert.equal(P.countItem(r, 'hollow_string'), 1);
  assert.ok(ITEMS.hollow_string.slot === 'head');
});

test('Die Welt redet darüber: Tallow über die Wardens, Mothwick über die Motten, Wren über Mottenstaub', () => {
  const w = S.createWorld(regionFor('kindle'), 826);
  w.date = '2026-11-19';
  w.daylight = 0;
  const p = veteran(w, 'a', { level: 36, quests: { kindling: { done: true }, not_thieves: { done: true }, stone_by_stone: { done: true } }, bag: [{ id: 'moth_dust', n: 1 }] });
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'walk the road with a lamp');
  assert.equal(p.dialog.page, 'nt_tallow');
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'moths as big as crows');
  assert.equal(p.dialog.page, 'mw_moths');
  talk(w, 'a', 'wren');
  choose(w, 'a', 'moth dust glows');
  assert.equal(p.dialog.page, 'md_wren');
});

test('Hollis hat ein achtes Gerücht (die Steinstraße)', () => {
  // Durch die Tür der Taverne hinein
  const k = S.createWorld(regionFor('kindle'), 827);
  veteran(k, 'a', { level: 10 });
  actOn(k, 'a', k.objects.find((o) => o.type === 'tavern'), 'enter');
  const save = S.removePlayer(k, 'a');
  const w = S.createWorld(regionFor('kindle_inside'), 828);
  const p = S.addPlayer(w, 'a', 'a', save);
  talk(w, 'a', 'hollis');
  choose(w, 'a', 'Heard anything');
  for (const t of ['Anything else', 'And?', 'Anything newer', 'And?', 'Anything newer', 'Anything newer', 'Anything newer']) choose(w, 'a', t);
  assert.equal(p.dialog.page, 'rumour8');
});
