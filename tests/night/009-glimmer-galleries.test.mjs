// Nacht 9, Nachschlag: The Glimmer Galleries unter Copperdeep (Stufe 55 bis 60). Brack gibt „Forty Crates“ (ab 55):
// durch den alten Schacht hinab, fünf Lode Crawler, der Begleitzettel in der Ladebucht, drei Lampless Miners, zurück zu Brack.
// Dazu: Deep Lode (Salvage 44) und die Lode Lantern (Lampwright 48).
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor, REGION_IDS } from '../../content/regions/index.js';
import { MOBS } from '../../content/mobs.js';
import { ITEMS } from '../../content/items.js';
import { NODES } from '../../content/nodes.js';
import { RECIPES } from '../../content/recipes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Was man um 54/55 realistisch trägt (Overflow Run, Tinkering 42–47)
const GEAR = { main: 'run_iron_shield', head: 'culvert_hood', body: 'culvert_coat', feet: 'culvert_boots', lantern: 'pump_lamp' };
const WARDEN = ['dawn_vow', 'oath_of_embers', 'lamp_and_anvil', 'hallowed_ground', 'anvil_blow', 'bash', 'shield_slam', 'beacon_slam', 'stand_fast'];

// Zwischen zwei Kämpfen einen Trank, wenn das Leben knapp ist (wie ein Spieler)
function patchUp(w, pid) {
  const p = w.players.get(pid);
  for (let k = 0; k < 3 && p.hp < p.maxHp * 0.7; k++) {
    const s = p.bag.findIndex((x) => x?.id === 'culvert_draught');
    if (s < 0) break;
    applyIntent(w, pid, { t: 'use', slot: s });
    run(w, 6);
  }
}

function fight(w, pid, mob, ticks = 2500) {
  patchUp(w, pid);
  const p = w.players.get(pid);
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead && p.hp > 0 && !p.travel; i++) {
    // Aus angekündigten Flächen gehen
    const tele = w.telegraphs.find((x) => x.tiles.some((c) => c.x === p.x && c.y === p.y));
    if (tele) {
      const free = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].map(([a, b]) => ({ x: p.x + a, y: p.y + b }))
        .find((c) => S.walkable(w, c.x, c.y) && !tele.tiles.some((q) => q.x === c.x && q.y === c.y));
      if (free) { applyIntent(w, pid, { t: 'walk', x: free.x, y: free.y }); run(w, 1); continue; }
    }
    // Die Miners trinken aus der Laterne: rechtzeitig Öl nachgießen, sonst wird es dunkel
    if (p.oil < 30 && P.countItem(p, 'lamp_oil')) {
      applyIntent(w, pid, { t: 'use', slot: p.bag.findIndex((x) => x?.id === 'lamp_oil') });
    } else if (p.hp < p.maxHp * 0.55) {
      const s = p.bag.findIndex((x) => x?.id === 'culvert_draught');
      if (s >= 0) applyIntent(w, pid, { t: 'use', slot: s });
    } else applyIntent(w, pid, { t: 'ability', id: WARDEN[i % WARDEN.length] });
    if (!p.target && !mob.dead) applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
    run(w, 1);
  }
}

test('Die Galleries: eigenes Gebiet, Stufe 55 bis 60, faire Angriffe, Erfahrung passt zur Kurve', () => {
  assert.ok(REGION_IDS.includes('galleries'));
  const r = regionFor('galleries');
  assert.equal(r.name, 'THE GLIMMER GALLERIES');
  for (const id of ['lode_crawler', 'lampless_miner']) {
    const m = MOBS[id];
    assert.ok(m.level >= 55 && m.level <= 60);
    assert.ok(m.special.delay >= 4, `${id} warnt vor`);
    assert.ok(r.mobs.some((x) => x.type === id));
  }
  assert.ok(MOBS.lode_crawler.xp > MOBS.culvert_leech.xp && MOBS.lampless_miner.xp > MOBS.lode_crawler.xp, 'mehr Erfahrung als im Overflow Run');
  assert.equal(NODES.deep_lode.level, 44);
  assert.ok(ITEMS.lode_lantern.light > ITEMS.pump_lamp.light, 'die Lode Lantern lohnt sich');
  assert.equal(RECIPES.l_lode_lantern.out[0], 'lode_lantern');
  assert.ok(r.objects.some((o) => o.type === 'plaque' && /BACK MONDAY/.test(o.text)), 'die Tafel an der letzten Wand');
});

test('Forty Crates: Brack, der alte Schacht, Crawler, der Zettel, Miners, Brack', () => {
  const k = S.createWorld(regionFor('kindle'), 961);
  k.date = '2026-11-20';
  const done = { kindling: { done: true } };
  // Unter 52 bleibt der Schacht zu, unter 55 gibt Brack nur einen Hinweis
  let p = veteran(k, 'a', { level: 51, quests: done });
  const shaft = k.objects.find((o) => o.type === 'door' && o.to === 'galleries');
  actOn(k, 'a', shaft, 'enter');
  assert.equal(p.travel, undefined, 'unter 52 zu');
  talk(k, 'a', 'brack');
  choose(k, 'a', 'other shaft');
  assert.equal(p.dialog.page, 'fc_early');
  S.removePlayer(k, 'a');
  p = veteran(k, 'a', { level: 55, equip: GEAR, quests: done, bag: [{ id: 'culvert_draught', n: 16 }, { id: 'lamp_oil', n: 8 }] });
  p.specs = { warden: 'lightsworn' };
  talk(k, 'a', 'brack');
  choose(k, 'a', 'other shaft');
  assert.equal(p.quests.forty_crates.step, 0);
  actOn(k, 'a', shaft, 'enter');
  assert.equal(p.travel?.region, 'galleries');

  const w = S.createWorld(regionFor('galleries'), 962);
  w.date = k.date;
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(k, 'a'));
  const start = P.countItem(p, 'culvert_draught');
  let lowest = p.maxHp;
  for (let n = 0; n < 5; n++) {
    const m = w.mobs.filter((x) => x.type === 'lode_crawler' && !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.lode_crawler.respawn + 2); n--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead, `Crawler ${n + 1} fällt (Spieler ${p.hp}/${p.maxHp})`);
    lowest = Math.min(lowest, p.hp);
    for (const foe of w.mobs.filter((x) => !x.dead && x.angryAt === 'a')) fight(w, 'a', foe);
  }
  assert.equal(p.quests.forty_crates.step, 1, 'fünf Crawler');
  const niche = w.objects.find((o) => o.type === 'shrine' && o.quest === 'forty_crates');
  for (let n = 0; n < 4 && !P.countItem(p, 'hollow_tag'); n++) {
    for (const foe of w.mobs.filter((x) => !x.dead && x.angryAt === 'a')) fight(w, 'a', foe);
    actOn(w, 'a', niche, 'search');
    run(w, 1);
  }
  assert.equal(P.countItem(p, 'hollow_tag'), 1, 'der Zettel');
  assert.equal(p.quests.forty_crates.step, 2);
  for (let n = 0; n < 3; n++) {
    const m = w.mobs.filter((x) => x.type === 'lampless_miner' && !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.lampless_miner.respawn + 2); n--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead, `Miner ${n + 1} fällt (Spieler ${p.hp}/${p.maxHp} bei ${p.x},${p.y}, Miner ${m.hp}/${m.maxHp} bei ${m.x},${m.y}, Ziel ${p.target})`);
    lowest = Math.min(lowest, p.hp);
    for (const foe of w.mobs.filter((x) => !x.dead && x.angryAt === 'a')) fight(w, 'a', foe);
  }
  assert.equal(p.quests.forty_crates.step, 3, 'drei Miners');
  assert.equal(p.travel, undefined, 'überlebt');
  const used = start - P.countItem(p, 'culvert_draught');
  const oilUsed = 8 - P.countItem(p, 'lamp_oil');
  assert.ok(used >= 1 || oilUsed >= 1 || lowest < p.maxHp * 0.6, `es kostet etwas (Tränke ${used}, Öl ${oilUsed}, tiefster Stand ${lowest}/${p.maxHp})`);
  assert.ok(P.countItem(p, 'lode_glimmer') >= 1, 'Lode Glimmer als Beute');
  // Hinauf zu Brack
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 'enter');
  const k2 = S.createWorld(regionFor('kindle'), 963);
  p = S.addPlayer(k2, 'a', 'a', S.removePlayer(w, 'a'));
  talk(k2, 'a', 'brack');
  choose(k2, 'a', 'crate tag');
  assert.ok(p.quests.forty_crates.done);
  assert.equal(P.countItem(p, 'loaders_hood'), 1);
});

test('Deep Lode: Salvage 44 sammelt Lode Glimmer; daraus Lode Lantern, Lens, Coat und Shivs', async () => {
  const w = S.createWorld(regionFor('galleries'), 964);
  for (const m of w.mobs) { m.dead = true; m.deadUntil = 1e9; }
  const lv = NODES.deep_lode.level;
  const p = veteran(w, 'a', { level: 55, profs: { salvage: { level: lv, xp: P.xpForLevel(lv) } } });
  const nodes = w.objects.filter((o) => o.type === 'node' && o.node === 'deep_lode');
  assert.equal(nodes.length, 3);
  for (const o of nodes) {
    actOn(w, 'a', o, 'gather');
    run(w, 60);
  }
  assert.ok(P.countItem(p, 'lode_glimmer') >= 4, `Lode Glimmer (${P.countItem(p, 'lode_glimmer')})`);
  // An Wrens Lampenbank in Kindle
  // An den Stationen in Kindle: Lode Lantern und Lode Lens (Lampwright), Lode Coat und Lode Shivs (Tinkering)
  const { PROFESSIONS } = await import('../../content/professions.js');
  for (const rid of ['l_lode_lantern', 'l_lode_lens', 't_lode_coat', 't_lode_shivs']) {
    const r = RECIPES[rid];
    const k = S.createWorld(regionFor('kindle'), 965);
    const bag = Object.entries(r.inputs).map(([id, n]) => ({ id, n }));
    const q = veteran(k, 'a', { level: 55, profs: { [r.prof]: { level: r.level, xp: P.xpForLevel(r.level) } }, bag });
    const bench = k.objects.find((o) => o.type === 'station' && o.station === PROFESSIONS[r.prof].station);
    actOn(k, 'a', bench, 'use');
    applyIntent(k, 'a', { t: 'craft', obj: bench.id, recipe: rid, n: 1 });
    run(k, 30);
    assert.equal(P.countItem(q, r.out[0]), 1, `${r.out[0]} hergestellt`);
  }
  assert.ok(ITEMS.lode_coat.defence > ITEMS.culvert_coat.defence);
  assert.ok(ITEMS.lode_shivs.power > ITEMS.run_iron_shivs.power && ITEMS.lode_lens.power > ITEMS.run_iron_lens.power);
});

test('Gefallen für die Galleries: vier Lode Crawler für Brack zählen am Tag, an dem er am Brett hängt', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  assert.ok(FAVOURS.lode_for_brack && FAVOURS.crawlers_off_the_lode);
  // Der erste Tag ab dem 20.11., an dem der Kampf-Gefallen gezogen wird
  let date = null;
  for (let d = 0; d < 400 && !date; d++) {
    const day = new Date(Date.UTC(2026, 10, 20 + d)).toISOString().slice(0, 10);
    if (favoursFor(day).includes('crawlers_off_the_lode')) date = day;
  }
  assert.ok(date, 'hängt irgendwann am Brett');
  const w = S.createWorld(regionFor('galleries'), 966);
  w.date = date;
  const p = veteran(w, 'a', { level: 58, equip: GEAR, bag: [{ id: 'culvert_draught', n: 10 }, { id: 'lamp_oil', n: 4 }] });
  p.specs = { warden: 'lightsworn' };
  const gold0 = p.gold;
  for (let n = 0; n < FAVOURS.crawlers_off_the_lode.n; n++) {
    const m = w.mobs.filter((x) => x.type === 'lode_crawler' && !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, MOBS.lode_crawler.respawn + 2); n--; continue; }
    fight(w, 'a', m);
    assert.ok(m.dead);
  }
  assert.ok(p.daily.done.includes('crawlers_off_the_lode'), 'Gefallen erledigt');
  assert.ok(p.gold >= gold0 + FAVOURS.crawlers_off_the_lode.reward.gold, 'Lohn');
});
