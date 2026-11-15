// Nacht 5, Nachschlag: Verdigris für Lampwright (Stab 38, Linse 39) und Alchemie (Sluice Draught 36),
// zwei neue Gefallen (Ratten für Hesk in den Sumps, Mehl für Hollis), Pell ruft die Nacht aus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { RECIPES } from '../../content/recipes.js';
import { ITEMS } from '../../content/items.js';
import { FAVOURS } from '../../content/dailies.js';
import { favoursFor } from '../../shared/community.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

function craftAt(station, rid, prof) {
  const r = RECIPES[rid];
  const w = S.createWorld(REGION, 580);
  const p = veteran(w, 'a', { level: 40, profs: { [prof]: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: Object.entries(r.inputs).map(([id, n]) => ({ id, n })) });
  const st = w.objects.find((o) => o.type === 'station' && o.station === station);
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: st.id, action: 'use' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1);
  applyIntent(w, 'a', { t: 'craft', obj: st.id, recipe: rid, n: 1 });
  run(w, 1);
  return { w, p, r };
}

test('Lampwright 38 und 39: Verdigris-Stab und -Linse, eine Stufe über Cinder Iron', () => {
  for (const [rid, out] of [['l_verdigris_staff', 'verdigris_staff'], ['l_verdigris_lens', 'verdigris_lens']]) {
    const { p } = craftAt('lampbench', rid, 'lampwright');
    assert.equal(P.countItem(p, out), 1, `${out} an der Linsenbank`);
  }
  assert.ok(ITEMS.verdigris_staff.heal > ITEMS.cinder_staff.heal);
  assert.ok(ITEMS.verdigris_lens.power > ITEMS.cinder_lens.power);
});

test('Alchemie 36: Sluice Draught heilt mehr als die Deep Seam Tonic und füllt Öl', () => {
  const { w, p, r } = craftAt('still', 'a_sluice_draught', 'alchemy');
  assert.equal(P.countItem(p, 'sluice_draught'), r.out[1]);
  assert.ok(ITEMS.sluice_draught.use.heal > ITEMS.seam_tonic.use.heal);
  p.hp = 10;
  p.oil = 10;
  applyIntent(w, 'a', { t: 'use', slot: p.bag.findIndex((s) => s?.id === 'sluice_draught') });
  run(w, 6);
  assert.ok(p.hp > 100 && p.oil > 30);
});

function dayWith(id) {
  for (let d = 1; d <= 500; d++) {
    const s = new Date(Date.UTC(2026, 10, 15) + d * 864e5).toISOString().slice(0, 10);
    if (favoursFor(s).includes(id)) return s;
  }
  return null;
}

test('Gefallen: Mehl für Hollis am Brett in Kindle abgeben', () => {
  const day = dayWith('flour_for_hollis');
  assert.ok(day, 'der Mehl-Gefallen kommt vor');
  const w = S.createWorld(REGION, 581);
  w.date = day;
  const p = veteran(w, 'a', { level: 6, bag: [{ id: 'mill_flour', n: FAVOURS.flour_for_hollis.n }] });
  const board = w.objects.find((o) => o.type === 'board');
  actOn(w, 'a', board, 'read');
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'favour', id: 'flour_for_hollis' });
  run(w, 1);
  assert.equal(P.countItem(p, 'mill_flour'), 0);
  assert.equal(p.gold, gold + FAVOURS.flour_for_hollis.reward.gold);
});

test('Gefallen: drei Drain Rats für Hesk, in den Sumps', () => {
  const day = dayWith('rats_for_hesk');
  assert.ok(day, 'der Ratten-Gefallen kommt vor');
  const w = S.createWorld(regionFor('sumps'), 582);
  w.date = day;
  const p = veteran(w, 'a', { level: 42, equip: { main: 'masterwork_shield', body: 'masterwork_coat', head: 'masterwork_hood', feet: 'masterwork_boots' } });
  // Wer einen Gefallen erledigen will, schaut zuerst aufs Brett: hier zählt er ab dem Kampf
  const gold = p.gold;
  for (let k = 0; k < FAVOURS.rats_for_hesk.n; k++) {
    const m = w.mobs.filter((x) => x.type === 'drain_rat' && !x.dead)[0];
    p.x = m.x - 1; p.y = m.y;
    if (!S.walkable(w, p.x, p.y)) { p.x = m.x; p.y = m.y - 1; }
    p.hp = p.maxHp;
    applyIntent(w, 'a', { t: 'act', kind: 'mob', id: m.id, action: 'attack' });
    for (let i = 0; i < 600 && !m.dead; i++) { applyIntent(w, 'a', { t: 'ability', id: ['hallowed_ground', 'anvil_blow', 'bash'][i % 3] }); run(w, 1); }
    assert.ok(m.dead);
  }
  assert.ok(p.daily.done.includes('rats_for_hesk'));
  assert.ok(p.gold >= gold + FAVOURS.rats_for_hesk.reward.gold);
});

test('Pell ruft die Mühle und die Sumps aus, Hollis kennt das Gerücht', () => {
  const w = S.createWorld(REGION, 583);
  const p = veteran(w, 'a', { level: 2 });
  talk(w, 'a', 'pell');
  assert.equal(p.dialog.page, 'start');
  // In die Taverne gehen und Hollis nach Gerüchten fragen, bis zum neuesten
  const tavern = w.objects.find((o) => o.type === 'tavern');
  actOn(w, 'a', tavern, 'enter');
  const d = S.createWorld(regionFor('kindle_inside'), 584);
  const q = S.addPlayer(d, 'a', 'a', S.removePlayer(w, 'a'));
  talk(d, 'a', 'hollis');
  for (const step of ['Heard anything', 'Anything else', 'And?', 'Anything newer', 'And?']) choose(d, 'a', step);
  assert.equal(q.dialog?.page, 'rumour5');
});

test('Nachschlag: Fundstellen in den Sumps für Salvage 38, Cartography 36 und Foraging 36', async () => {
  const { NODES } = await import('../../content/nodes.js');
  for (const [node, prof, item] of [['verdigris_pipe', 'salvage', 'verdigris'], ['sluice_mark', 'cartography', 'survey_notes'], ['lampcap_cluster', 'foraging', 'nightcap']]) {
    const lvl = NODES[node].level;
    const w = S.createWorld(regionFor('sumps'), 590);
    // Wesen in Ruhe lassen: Wer sammelt, achtet auf Abstand (hier: alle fort, damit nur das Sammeln zählt)
    for (const m of w.mobs) { m.dead = true; m.deadUntil = 1e9; }
    const spot = w.objects.find((o) => o.type === 'node' && o.node === node);
    const low = veteran(w, 'b', { level: 40, profs: { [prof]: { level: lvl - 1, xp: P.xpForLevel(lvl - 1) } } });
    actOn(w, 'b', spot, 'gather');
    for (let i = 0; i < 200 && low.gather; i++) run(w, 1);
    assert.equal(P.countItem(low, item), 0, `${node}: unter Stufe ${lvl} nichts`);
    S.removePlayer(w, 'b');
    const p = veteran(w, 'a', { level: 40, profs: { [prof]: { level: lvl + 4, xp: P.xpForLevel(lvl + 4) } } });
    actOn(w, 'a', spot, 'gather');
    for (let i = 0; i < 400 && p.gather; i++) run(w, 1);
    assert.ok(P.countItem(p, item) >= 1, `${node}: ${item} gesammelt`);
  }
});

test('Nachschlag: Gefallen „The Undertow noch einmal“ kommt vor und zählt den Boss in den Sumps', () => {
  const day = dayWith('undertow_again');
  assert.ok(day, 'der Boss-Gefallen kommt vor');
  const w = S.createWorld(regionFor('sumps'), 585);
  w.date = day;
  // Zu zweit, wie der Gefallen rät: Warden und Mender auf 42 mit Meisterstücken
  const t = veteran(w, 't', { cls: 'warden', level: 42, equip: { main: 'masterwork_shield', body: 'masterwork_coat', head: 'masterwork_hood', feet: 'masterwork_boots' } });
  const m = veteran(w, 'm', { cls: 'mender', level: 42, equip: { main: 'cinder_staff', body: 'masterwork_coat' } });
  const boss = w.mobs.find((x) => x.type === 'the_undertow');
  for (const o of w.mobs) if (o !== boss) { o.dead = true; o.deadUntil = 1e9; }
  t.x = boss.x - 1; t.y = boss.y;
  m.x = boss.x - 3; m.y = boss.y;
  applyIntent(w, 't', { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
  applyIntent(w, 'm', { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
  const gold = t.gold;
  for (let i = 0; i < 2500 && !boss.dead && t.hp > 0; i++) {
    applyIntent(w, 't', { t: 'ability', id: ['hallowed_ground', 'anvil_blow', 'bash', 'shield_slam', 'stand_fast'][i % 5] });
    applyIntent(w, 'm', { t: 'ability', id: ['ember_mend', 'vesper_bell', 'banked_hearth', 'ember_touch'][i % 4] });
    run(w, 1);
  }
  assert.ok(boss.dead, 'zu zweit fällt The Undertow');
  assert.ok(t.daily.done.includes('undertow_again'));
  assert.ok(t.gold >= gold + FAVOURS.undertow_again.reward.gold);
});
