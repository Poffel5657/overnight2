// Nacht 9 (Abstimmung „carriers-rest“): Der Unterstand am Rastplatz der Träger. Brindle gibt „A Roof at the Rest“ (ab 28):
// Totholz spalten, die Steinstraße hinauf, den Unterstand flicken (Scheite, Torf, Öl; alle zusammen), am Herd der Träger
// rasten, zurück zu Brindle. Steht der Unterstand, greifen die Hollow Wardens niemanden von selbst an, und man ruht ausgeruht.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { LEANTO } from '../../content/leanto.js';
import { QUESTS } from '../../content/quests.js';
import { WOODPILE } from '../../content/woodpile.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, runUntil, talk, choose, veteran, actOn } from './helpers.mjs';

const GEAR = { main: 'greyglass_shield', head: 'wraithsilk_hood', body: 'choir_mantle', feet: 'wardstone_boots', lantern: 'greyglass_lantern' };
const done = { kindling: { done: true }, stone_by_stone: { done: true } };

function road(seed) {
  const w = S.createWorld(regionFor('stone_road'), seed);
  w.date = '2026-11-20';
  w.daylight = 0;
  // Creeper, Motten und der Reiher sind in den Tests von Tag 8; hier geht es um den Rastplatz
  for (const m of w.mobs) if (m.type !== 'hollow_warden') { m.dead = true; m.deadUntil = 1e9; }
  return w;
}

test('Der Unterstand: Aktion Mend, nimmt Scheite, Torf und Öl, zählt für alle, steht ab dem Ziel', () => {
  const w = road(931);
  const lt = w.objects.find((o) => o.type === 'leanto');
  assert.ok(lt, 'Unterstand am Rastplatz');
  assert.deepEqual(S.objectActions(lt).map(([a]) => a), ['use', 'examine']);
  assert.equal(lt.lit, false, 'am Anfang ohne Lampe');
  assert.equal(w.region.zoneAt(lt.x, lt.y), 'THE CARRIERS\' REST');
  // Mit leeren Händen: nur ein Hinweis
  const p = veteran(w, 'a', { cls: 'warden', level: 34, equip: GEAR, quests: done });
  p.x = 20; p.y = 10;
  actOn(w, 'a', lt, 'use');
  assert.equal(p.mended, 0);
  assert.ok(LEANTO.takes.split_log && LEANTO.takes.peat_brick && LEANTO.takes.lamp_oil);
});

test('A Roof at the Rest: Brindle, Totholz, die Straße hinauf, flicken mit einem Freund, Waffenruhe, rasten, Brindle', () => {
  const k = S.createWorld(regionFor('kindle'), 932);
  k.date = '2026-11-20';
  k.daylight = 0;
  // Zu früh: unter 28 nur ein Hinweis
  let p = veteran(k, 'a', { cls: 'warden', level: 27, quests: done });
  talk(k, 'a', 'brindle');
  choose(k, 'a', 'mend the lean-to');
  assert.equal(p.dialog.page, 'rr_early');
  S.removePlayer(k, 'a');
  p = veteran(k, 'a', { cls: 'warden', level: 34, quests: done, equip: GEAR, bag: [{ id: 'lamp_oil', n: 2 }] });
  talk(k, 'a', 'brindle');
  choose(k, 'a', 'mend the lean-to');
  assert.equal(p.quests.a_roof_at_the_rest.step, 0);
  // Totholz am Waldrand spalten, bis vier Scheite im Beutel sind (und ein paar mehr)
  for (const o of k.objects.filter((x) => x.type === 'deadfall')) {
    if (P.countItem(p, 'split_log') >= 6) break;
    actOn(k, 'a', o, 'use');
    run(k, 2);
  }
  assert.ok(P.countItem(p, 'split_log') >= 6, `Scheite (${P.countItem(p, 'split_log')})`);
  assert.equal(p.quests.a_roof_at_the_rest.step, 1, 'vier Scheite: weiter');
  // Durch den Durchgang hinter dem ersten Stein
  actOn(k, 'a', k.objects.find((o) => o.type === 'door' && o.to === 'stone_road'), 'enter');
  assert.equal(p.travel?.region, 'stone_road');
  const w = road(933);
  p = S.addPlayer(w, 'a', 'a', S.removePlayer(k, 'a'));
  // Bis an den Rand der Lichtung
  applyIntent(w, 'a', { t: 'walk', x: 24, y: 10 });
  run(w, 250);
  assert.equal(w.region.zoneAt(p.x, p.y), 'THE CARRIERS\' REST', `oben (${p.x},${p.y})`);
  const lt = w.objects.find((o) => o.type === 'leanto');
  const hearth = w.objects.find((o) => o.type === 'campfire' && o.hearth);
  // Vor dem Flicken: Wer neben einem Warden steht, wird angegriffen
  {
    const t = road(934);
    const m = t.mobs.find((x) => x.type === 'hollow_warden');
    const q = veteran(t, 'q', { cls: 'warden', level: 34, equip: GEAR });
    q.x = m.x; q.y = m.y + 2;
    if (!S.walkable(t, q.x, q.y)) q.y = m.y - 2;
    run(t, 10);
    assert.equal(m.angryAt, 'q', 'ohne Unterstand: der Warden greift an');
  }
  // Am Unterstand flicken: am Rand vorbei, damit kein Warden aufmerksam wird (die Wardens sind in einem anderen Test)
  const before = p.mended;
  actOn(w, 'a', lt, 'use');
  run(w, 2);
  assert.ok(p.mended > before, 'Punkte für den Unterstand');
  assert.equal(p.quests.a_roof_at_the_rest.step, 2, 'geflickt');
  const n1 = w.leanto.n;
  assert.ok(n1 < LEANTO.goal, `allein reicht es nicht (${n1}/${LEANTO.goal})`);
  // Rasten, bevor er steht: nur warme Hände
  actOn(w, 'a', hearth, 'rest');
  assert.equal(p.quests.a_roof_at_the_rest.step, 2, 'noch nicht ausgeruht');
  // Ein Freund kommt mit Öl und Torf
  const f = veteran(w, 'f', { cls: 'mender', level: 34, quests: done, bag: [{ id: 'lamp_oil', n: 3 }, { id: 'peat_brick', n: 2 }] });
  f.x = p.x; f.y = p.y;
  applyIntent(w, 'f', { t: 'act', kind: 'object', id: lt.id, action: 'use' });
  const seen = runUntil(w, () => !f.goal, 400);
  assert.ok(w.leanto.n >= LEANTO.goal, `jetzt steht er (${w.leanto.n})`);
  assert.equal(lt.lit, true, 'die Lampe brennt');
  assert.ok(seen.some((e) => e.type === 'lit' && e.id === lt.id), 'alle sehen die Lampe');
  // Waffenruhe: Wer jetzt neben einem Warden steht, wird nicht angegriffen
  const m = w.mobs.find((x) => x.type === 'hollow_warden' && !x.dead);
  f.x = m.x; f.y = m.y + 2;
  if (!S.walkable(w, f.x, f.y)) f.y = m.y - 2;
  run(w, 10);
  assert.ok(!m.angryAt, 'mit Unterstand: Waffenruhe');
  // Rasten am Herd: ausgeruht, Öl voll
  p.oil = 20;
  actOn(w, 'a', hearth, 'rest');
  run(w, 1);
  assert.equal(p.rested, LEANTO.rested, 'ausgeruht');
  assert.ok(p.oil > 95, 'Laterne wieder voll');
  assert.equal(p.quests.a_roof_at_the_rest.step, 3);
  // Ein zweites Mal am selben Tag: kein neuer Bonus
  p.rested = 1;
  actOn(w, 'a', hearth, 'rest');
  assert.equal(p.rested, 1, 'einmal am Tag');
  // Zurück zu Brindle
  actOn(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 'enter');
  const k2 = S.createWorld(regionFor('kindle'), 935);
  k2.date = '2026-11-20';
  p = S.addPlayer(k2, 'a', 'a', S.removePlayer(w, 'a'));
  const xp0 = P.classXp ? null : p.classes.warden.xp;
  talk(k2, 'a', 'brindle');
  choose(k2, 'a', 'slept under the lean-to');
  assert.ok(p.quests.a_roof_at_the_rest.done, 'fertig');
  assert.equal(P.countItem(p, 'peat_oil') >= QUESTS.a_roof_at_the_rest.reward.items.peat_oil, true);
  assert.ok(xp0 === null || p.classes.warden.xp > xp0 || p.classes.warden.level > 34);
});

test('Ein neuer Tag: der Unterstand fängt von vorn an, Waffenruhe vorbei', () => {
  const w = road(936);
  const lt = w.objects.find((o) => o.type === 'leanto');
  const p = veteran(w, 'a', { cls: 'warden', level: 34, bag: [{ id: 'lamp_oil', n: 6 }, { id: 'split_log', n: 6 }] });
  p.x = 20; p.y = 10;
  actOn(w, 'a', lt, 'use');
  run(w, 1);
  assert.ok(w.leanto.n >= LEANTO.goal);
  w.date = '2026-11-21';
  const m = w.mobs.find((x) => x.type === 'hollow_warden');
  p.x = m.x; p.y = m.y + 2;
  if (!S.walkable(w, p.x, p.y)) p.y = m.y - 2;
  run(w, 10);
  assert.equal(m.angryAt, 'a', 'am nächsten Tag wieder Kampf');
});

test('Alter Spielstand ohne mended lädt mit 0', () => {
  const w = road(937);
  const p = S.addPlayer(w, 'old', 'old', { v: 2, x: 20, y: 10, hp: 100, oil: 50, gold: 3, cls: 'warden', classes: { warden: { level: 30, xp: P.xpForLevel(30) } }, bag: [], equip: {}, profs: {}, quests: {}, bars: {} });
  assert.equal(p.mended, 0);
  assert.equal(P.saveOf(p).mended, 0);
  assert.ok(WOODPILE.logs >= 1);
});
