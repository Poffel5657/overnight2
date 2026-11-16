// Nacht 6, Abstimmung „beacon-stockpile“: Ama's Woodpile. Ama gibt „The Woodpile“, Totholz am Waldrand spaltet
// jeder ohne Beruf (einmal am Tag pro Stelle), am Stapel legt man alle Scheite auf einmal nach: Sie zählen für
// den Tageszähler des Leuchtfeuers, das erste Stapeln am Tag gibt Erfahrung. Haskel weiß, wo Totholz liegt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { WOODPILE } from '../../content/woodpile.js';
import { BEACON_FUEL } from '../../content/dailies.js';
import { QUESTS } from '../../content/quests.js';
import { describeItem } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, veteran, actOn, options } from './helpers.mjs';

test('The Woodpile: Ama, Totholz spalten, am Stapel nachlegen, das Leuchtfeuer zählt mit', () => {
  const w = S.createWorld(REGION, 601);
  w.date = '2026-11-17';
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 3 });
  const log = WOODPILE.log;

  // Ama erklärt den Stapel und gibt ein Scheit als Muster
  talk(w, 'a', 'ama');
  choose(w, 'a', 'woodpile');
  assert.equal(p.dialog.page, 'wp_offer');
  assert.ok(p.quests.the_woodpile, 'Quest beginnt');
  assert.equal(P.countItem(p, log), 1);
  talk(w, 'a', 'ama');
  assert.ok(!options(w, 'a').some((t) => t.includes('woodpile by the Beacon')), 'nur einmal');

  // Haskel weiß, wo Totholz liegt
  talk(w, 'a', 'haskel');
  choose(w, 'a', 'dry wood');
  assert.equal(p.dialog.page, 'wp_haskel');

  // Totholz am Waldrand westlich der Felder (nahe am Dorf) spalten
  const deadfalls = w.objects.filter((o) => o.type === 'deadfall');
  assert.ok(deadfalls.length >= 4, 'mehrere Stellen mit Totholz');
  assert.deepEqual(S.objectActions(deadfalls[0]).map(([a]) => a), ['use', 'examine']);
  const near = deadfalls.reduce((a, b) => (Math.hypot(b.x - 50, b.y - 50) < Math.hypot(a.x - 50, a.y - 50) ? b : a));
  actOn(w, 'a', near, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, log), 1 + WOODPILE.logs, 'Scheite im Beutel');
  assert.equal(p.quests.the_woodpile.step, 1);
  // Dieselbe Stelle gibt heute nichts mehr
  actOn(w, 'a', near, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, log), 1 + WOODPILE.logs, 'heute nicht noch einmal');
  // Eine zweite Stelle schon
  const other = deadfalls.find((o) => o !== near && o.y > 25);
  actOn(w, 'a', other, 'use');
  run(w, 2);
  const k = P.countItem(p, log);
  assert.equal(k, 1 + 2 * WOODPILE.logs);

  // Am Stapel: alle Scheite auf einmal, Leuchtfeuer zählt, einmal Erfahrung
  const pile = w.objects.find((o) => o.type === 'woodpile');
  assert.ok(pile, 'der Stapel steht in Kindle');
  const beacon = w.objects.find((o) => o.type === 'beacon');
  assert.ok(Math.hypot(pile.x - beacon.x, pile.y - beacon.y) <= 4, 'gleich neben dem Leuchtfeuer');
  const before = w.community.beacon;
  const xp0 = p.classes.warden.xp;
  actOn(w, 'a', pile, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, log), 0, 'alles gestapelt');
  assert.equal(w.community.beacon, before + k * BEACON_FUEL[log], 'zählt für das Leuchtfeuer');
  assert.ok(w.outbox.some((o) => o.kind === 'beacon' && o.add === k * BEACON_FUEL[log]), 'wird gespeichert');
  assert.ok(p.classes.warden.xp > xp0, 'erstes Stapeln am Tag gibt Erfahrung');
  assert.equal(p.quests.the_woodpile.step, 2);

  talk(w, 'a', 'ama');
  choose(w, 'a', 'Logs on the pile');
  assert.ok(p.quests.the_woodpile.done, 'Quest fertig');
  assert.ok(P.countItem(p, 'lamp_oil') >= QUESTS.the_woodpile.reward.items.lamp_oil);
  talk(w, 'a', 'ama');
  choose(w, 'a', 'How high');
  assert.equal(p.dialog.page, 'wp_after');

  // Ohne Scheite sagt der Stapel, wo es Holz gibt; ein zweites Stapeln am selben Tag gibt keine Erfahrung mehr
  actOn(w, 'a', pile, 'use');
  run(w, 2);
  const third = deadfalls.find((o) => o !== near && o !== other);
  actOn(w, 'a', third, 'use');
  run(w, 2);
  const xp1 = p.classes.warden.xp;
  actOn(w, 'a', pile, 'use');
  run(w, 2);
  assert.equal(p.classes.warden.xp, xp1, 'Erfahrung nur einmal am Tag');

  // Am nächsten Tag gibt das Totholz wieder Holz
  w.date = '2026-11-18';
  actOn(w, 'a', near, 'use');
  run(w, 2);
  assert.equal(P.countItem(p, log), WOODPILE.logs, 'neuer Tag, neues Holz');

  // Der Gegenstand erklärt sich
  assert.ok(describeItem(log).uses.some((u) => u.includes('Beacon')));
});

test('Totholz liegt dort, wo Wald ist, nicht im Dorf', () => {
  const w = S.createWorld(REGION, 602);
  for (const o of w.objects.filter((x) => x.type === 'deadfall')) {
    assert.ok(Math.hypot(o.x - 49.5, o.y - 49.5) > 14, `Totholz bei ${o.x},${o.y} liegt außerhalb von Kindle`);
  }
});

test('Gefallen „logs_for_ama“: an einem Tag, an dem er dran ist, Scheite am Brett abgeben', async () => {
  const { favoursFor } = await import('../../shared/community.js');
  const { FAVOURS } = await import('../../content/dailies.js');
  const { applyIntent } = await import('../../shared/protocol.js');
  let date = null;
  for (let d = new Date('2026-11-17T12:00:00Z'); !date; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (favoursFor(iso).includes('logs_for_ama')) date = iso;
  }
  const w = S.createWorld(REGION, 603);
  w.date = date;
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 4 });
  const f = FAVOURS.logs_for_ama;
  // Zwei Stellen Totholz geben genug Scheite
  for (const o of w.objects.filter((x) => x.type === 'deadfall' && x.y > 25).slice(0, 2)) { actOn(w, 'a', o, 'use'); run(w, 2); }
  assert.ok(P.countItem(p, 'split_log') >= f.n);
  const board = w.objects.find((o) => o.type === 'board');
  actOn(w, 'a', board, 'read');
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'favour', id: 'logs_for_ama' });
  run(w, 1);
  assert.equal(p.gold, gold + f.reward.gold, `Gefallen am ${date} erledigt`);
});

test('Carrier\'s Lamp nachbauen: Wren erklärt sie, Lampwright 16 macht sie aus Grit, einem Scheit und Wachs', async () => {
  const { RECIPES } = await import('../../content/recipes.js');
  const { applyIntent } = await import('../../shared/protocol.js');
  const w = S.createWorld(REGION, 604);
  w.date = '2026-11-17';
  w.daylight = 1;
  const r = RECIPES.l_carriers_lamp;
  const p = veteran(w, 'a', { level: 16, profs: { lampwright: { level: r.level, xp: P.xpForLevel(r.level) } }, bag: [{ id: 'carriers_lamp', n: 1 }, { id: 'glass_grit', n: 1 }, { id: 'wax_comb', n: 1 }] });
  talk(w, 'a', 'wren');
  choose(w, 'a', 'carrier\'s lamp');
  assert.equal(p.dialog.page, 'cl_wren');
  // Das Scheit kommt vom Totholz
  const df = w.objects.find((o) => o.type === 'deadfall' && o.y > 25);
  actOn(w, 'a', df, 'use');
  run(w, 2);
  const bench = w.objects.find((o) => o.station === 'lampbench');
  actOn(w, 'a', bench, 'use');
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 'l_carriers_lamp', n: 1 });
  assert.equal(P.countItem(p, 'carriers_lamp'), 2, 'eine zweite Lampe');
  assert.equal(P.countItem(p, 'split_log'), WOODPILE.logs - 1, 'ein Scheit verbraucht');
});

test('Ama\'s Tally: Scheite zählen über Tage im Spielstand, bei vierzig gibt es die Woodward\'s Hood; alte Stände starten bei 0', () => {
  // Alter Stand ohne Feld
  const old = S.createWorld(REGION, 605);
  const o = S.addPlayer(old, 'o', 'o', { v: 2, x: 50, y: 53, hp: 30, oil: 100, cls: 'warden', classes: { warden: { level: 3, xp: P.xpForLevel(3) } }, bag: [], equip: {}, quests: { kindling: { done: true } } });
  assert.equal(o.stacked, 0);
  assert.equal(P.saveOf(o).stacked, 0);

  let date = new Date('2026-11-17T12:00:00Z');
  const iso = () => date.toISOString().slice(0, 10);
  let w = S.createWorld(REGION, 606);
  w.date = iso();
  w.daylight = 1;
  let p = veteran(w, 'a', { level: 8, quests: { kindling: { done: true }, the_woodpile: { done: true } } });
  talk(w, 'a', 'ama');
  choose(w, 'a', 'tally board');
  assert.equal(p.dialog.page, 'at_offer');
  const pile = w.objects.find((x) => x.type === 'woodpile');
  // Tag für Tag Totholz spalten und stapeln, zwischendurch ausloggen und wiederkommen
  for (let day = 0; p.stacked < WOODPILE.tally && day < 20; day++) {
    for (const df of w.objects.filter((x) => x.type === 'deadfall')) { actOn(w, 'a', df, 'use'); run(w, 2); }
    actOn(w, 'a', pile, 'use');
    run(w, 2);
    const save = JSON.parse(JSON.stringify(S.removePlayer(w, 'a')));
    date.setUTCDate(date.getUTCDate() + 1);
    w = S.createWorld(REGION, 607 + day);
    w.date = iso();
    w.daylight = 1;
    p = S.addPlayer(w, 'a', 'a', save);
    if (p.stacked < WOODPILE.tally) {
      talk(w, 'a', 'ama');
      assert.ok(!options(w, 'a').some((t) => t.includes('Forty lines')), 'erst bei vierzig');
    }
  }
  assert.ok(p.stacked >= WOODPILE.tally, `vierzig gestapelt (${p.stacked})`);
  talk(w, 'a', 'ama');
  choose(w, 'a', 'Forty lines');
  assert.ok(p.quests.amas_tally.done);
  assert.equal(P.countItem(p, 'woodward_hood'), 1);
});
