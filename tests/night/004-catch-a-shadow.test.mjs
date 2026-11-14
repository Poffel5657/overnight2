// Nacht 4, vom Nightwright (Bogen): Fen fängt nachts Schatten am Leuchtfeuer, und der Stranger hat keinen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { LOOKOUT } from '../../content/lookout.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

// Zum Objekt laufen und durchsuchen, dabei die eigenen Meldungen sammeln.
function search(w, pid, obj) {
  const seen = [];
  applyIntent(w, pid, { t: 'act', kind: 'object', id: obj.id, action: 'search' });
  for (let i = 0; i < 400 && w.players.get(pid).goal; i++) run(w, 1, (ev) => seen.push(...ev.filter((e) => e.type === 'log' && e.to === pid).map((e) => e.text)));
  run(w, 2, (ev) => seen.push(...ev.filter((e) => e.type === 'log' && e.to === pid).map((e) => e.text)));
  return seen;
}

test('Catch a Shadow: Kreide von Tallow, eigener Schatten nur nachts, der Stranger wirft keinen', () => {
  const w = S.createWorld(REGION, 421);
  w.date = '2026-11-15';
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 4 });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'drawing on the ground');
  assert.equal(p.quests.catch_a_shadow.step, 0);

  const ring = w.objects.find((o) => o.type === 'shrine' && o.quest === 'catch_a_shadow');
  assert.ok(ring && Math.hypot(ring.x - 50, ring.y - 50) < 5, 'der Kreidekreis liegt am Leuchtfeuer');
  // Ohne Kreide und Quest-Schritt gibt der Kreis nichts her
  actOn(w, 'a', ring, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'shadow_tracing'), 0);

  talk(w, 'a', 'tallow');
  choose(w, 'a', 'Fen needs chalk');
  assert.equal(P.countItem(p, 'chapel_chalk'), 1);
  assert.equal(p.quests.catch_a_shadow.step, 1);

  // Bei Tag wirft das Leuchtfeuer keinen Schatten
  const seen = search(w, 'a', ring);
  assert.equal(P.countItem(p, 'shadow_tracing'), 0, 'nicht bei Tag');
  assert.ok(seen.some((t) => t.includes('after dark')), seen.join(' | '));

  // Nachts: der eigene Schatten
  w.daylight = 0.1;
  actOn(w, 'a', ring, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'shadow_tracing'), 1);
  assert.equal(p.quests.catch_a_shadow.step, 2);
  assert.equal(P.countItem(p, 'chapel_chalk'), 1, 'die Kreide bleibt');

  // Der Stranger: bei Tag weicht er aus, nachts stellt er sich in den Kreis
  w.daylight = 1;
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'Fen wants your shadow');
  assert.equal(p.dialog.page, 'cs_day');
  assert.equal(p.quests.catch_a_shadow.step, 2);
  w.daylight = 0.1;
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'Fen wants your shadow');
  assert.equal(p.dialog.page, 'cs_ring');
  assert.equal(p.quests.catch_a_shadow.step, 3);

  const xp = p.classes.warden.xp;
  talk(w, 'a', 'fen');
  choose(w, 'a', 'no shadow');
  assert.equal(p.quests.catch_a_shadow.done, true);
  assert.ok(p.classes.warden.xp > xp, 'Erfahrung');
  for (const [id, n] of Object.entries(QUESTS.catch_a_shadow.reward.items)) assert.ok(P.countItem(p, id) >= n);

  // Danach: Ama, der Stranger und Tallow (die Kreide zurück) reagieren
  talk(w, 'a', 'ama'); choose(w, 'a', 'no shadow by the Beacon');
  assert.equal(p.dialog.page, 'ama_shadow');
  talk(w, 'a', 'stranger'); choose(w, 'a', 'You have no shadow');
  assert.equal(p.dialog.page, 'cs_none');
  const oil = P.countItem(p, 'lamp_oil');
  talk(w, 'a', 'tallow'); choose(w, 'a', 'chalk back');
  assert.equal(P.countItem(p, 'chapel_chalk'), 0);
  assert.ok(P.countItem(p, 'lamp_oil') > oil);
  // Der Kreis zeigt jetzt die leere Stelle
  const after = search(w, 'a', ring);
  assert.ok(after.some((t) => t.includes('empty space')));
  // Ama rechnet mit mehr Brennstoff, der Ausguck sieht den Schein größer
  talk(w, 'a', 'ama'); choose(w, 'a', 'How is the Beacon');
  assert.equal(p.dialog.page, 'ama_fuel');
  assert.match(LOOKOUT.night, /two thumbs/);
  assert.ok(REGION.farLight.size > 1.25);
});

test('Gerüchte: Hollis und Pip wissen von Rook, Flint und dem fehlenden Schatten', async () => {
  const { REGION: INSIDE } = await import('../../content/regions/kindle-inside.js');
  const w = S.createWorld(INSIDE, 422);
  const p = veteran(w, 'a', { level: 5 });
  // Wie nach dem Hereinkommen durch die Tür der Taverne
  const h = w.npcs.find((n) => n.id === 'hollis');
  p.x = h.x; p.y = h.y + 1; if (!S.walkable(w, p.x, p.y)) p.y = h.y - 1;
  talk(w, 'a', 'hollis');
  choose(w, 'a', 'Heard anything');
  choose(w, 'a', 'Anything else');
  choose(w, 'a', 'And?');
  choose(w, 'a', 'Anything newer');
  assert.equal(p.dialog.page, 'rumour4');
  talk(w, 'a', 'band_pip');
  choose(w, 'a', 'Composing');
  choose(w, 'a', 'new lines');
  assert.equal(p.dialog.page, 'song2');
});
