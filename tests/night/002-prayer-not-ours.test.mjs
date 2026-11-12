// Nacht 2, vom Nightwright (Bogen): Im Opferkasten der Kapelle liegt ein fremdes Gebet auf Rindenpapier.
// Tallow schickt Spieler zum Kasten, zu Pell und nachts zu Mothwick, dann zurück.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { TALK } from '../../content/npcs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

const Q = QUESTS.prayer_not_ours;

test('A Prayer Not Ours: Tallow, Opferkasten in der Kapelle, Pell, Mothwick bei Nacht, Tallow', () => {
  let w = S.createWorld(REGION, 211);
  w.daylight = 1;
  veteran(w, 'a', { level: 4 });
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'new at the altar');
  assert.equal(w.players.get('a').quests.prayer_not_ours.step, 0);

  // Ohne den Zettel hat Pell nichts zu lesen
  talk(w, 'a', 'pell');
  assert.ok(!options(w, 'a').some((t) => t.includes('Whose hand')));

  // In die Kapelle gehen und im Opferkasten suchen
  const chapel = w.objects.find((o) => o.type === 'chapel');
  actOn(w, 'a', chapel, 'enter');
  assert.equal(w.players.get('a').travel?.region, 'kindle_inside');
  let save = S.removePlayer(w, 'a');
  const inside = S.createWorld(regionFor('kindle_inside'), 212);
  const q = S.addPlayer(inside, 'a', 'a', save);
  const box = inside.objects.find((o) => o.type === 'shrine' && o.gives === 'prayer_slip');
  assert.ok(box, 'Opferkasten steht in der Kapelle');
  const evs = [];
  applyIntent(inside, 'a', { t: 'act', kind: 'object', id: box.id, action: 'search' });
  for (let i = 0; i < 400 && q.goal; i++) run(inside, 1, (e) => evs.push(...e));
  assert.equal(P.countItem(q, 'prayer_slip'), 1, 'Gebet gefunden');
  assert.ok(evs.some((e) => e.text === box.found), 'eigene Meldung beim Finden');
  assert.equal(q.quests.prayer_not_ours.step, 1);

  // Zurück nach draußen
  const exit = inside.objects.find((o) => o.type === 'door' && Math.hypot(o.x - q.x, o.y - q.y) < 20);
  actOn(inside, 'a', exit, 'enter');
  assert.equal(q.travel?.region, 'kindle');
  save = S.removePlayer(inside, 'a');
  w = S.createWorld(REGION, 213);
  w.daylight = 1;
  const p = S.addPlayer(w, 'a', 'a', save);

  talk(w, 'a', 'pell');
  choose(w, 'a', 'Whose hand');
  assert.equal(p.quests.prayer_not_ours.step, 2);

  // Bei Tag vertröstet Mothwick, bei Nacht erkennt sie das Papier
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'this paper');
  assert.equal(p.dialog.page, 'po_day');
  assert.equal(p.quests.prayer_not_ours.step, 2);
  w.daylight = 0;
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'this paper');
  assert.equal(p.quests.prayer_not_ours.step, 3);
  choose(w, 'a', 'green lantern');
  assert.equal(p.dialog.page, 'po_green');

  const xp = p.classes.warden.xp;
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'folded prayer');
  assert.equal(p.quests.prayer_not_ours.done, true);
  assert.equal(P.countItem(p, 'prayer_slip'), 0, 'das Gebet bleibt auf dem Altar');
  assert.ok(p.classes.warden.xp >= xp + Q.reward.xp);
  assert.ok(P.countItem(p, 'glow_draught') >= Q.reward.items.glow_draught);
  // Tallows Hinweis zum Beten ist nicht mehr veraltet
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'want to pray');
  assert.equal(p.dialog.page, 'pray');
  assert.ok(!TALK.tallow.pray.text.includes('opens soon'));
});
