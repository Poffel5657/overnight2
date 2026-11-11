// Nacht 1, der Bogen: Fen sieht nachts ein Licht hinter Hushwood. Die kalte Laterne am Nordrand,
// Wren erkennt fremdes Glas, der Stranger spricht vom hungrigen Feuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

test('Not From Here: erst ab Stufe 10, dann Laterne, Wren, Stranger, Fen', () => {
  const w = S.createWorld(REGION, 21);
  w.daylight = 1;
  const young = veteran(w, 'y', { level: 6 });
  talk(w, 'y', 'fen');
  choose(w, 'y', 'staring north');
  assert.equal(young.quests.not_from_here, undefined, 'zu jung: nur ein Hinweis');
  S.removePlayer(w, 'y');

  const p = veteran(w, 'a', { level: 14, equip: { main: 'glim_shield', head: 'brass_hood', body: 'glim_coat', feet: 'brass_boots' }, bag: [{ id: 'moss_salve', n: 10 }] });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'staring north');
  assert.equal(p.quests.not_from_here.step, 0);

  // Ohne Quest gibt die Laterne nichts her; mit Quest das Glas
  const lantern = w.objects.find((o) => o.type === 'shrine' && o.gives === 'cold_glass');
  assert.ok(lantern.y < 10, 'am Nordrand von Hushwood');
  actOn(w, 'a', lantern, 'search');
  run(w, 2);
  assert.equal(P.countItem(p, 'cold_glass'), 1, 'Glas gefunden');
  assert.equal(p.quests.not_from_here.step, 1, 'have-Schritt erledigt');

  // Zurück nach Kindle (zu Fuß), Wren fragen
  talk(w, 'a', 'wren');
  choose(w, 'a', 'this glass');
  assert.equal(p.quests.not_from_here.step, 2);
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'came from the north');
  assert.equal(P.countItem(p, 'cold_glass'), 0, 'der Stranger behält das Glas');
  assert.equal(p.quests.not_from_here.step, 3);
  talk(w, 'a', 'fen');
  const xp = p.classes.warden.xp;
  choose(w, 'a', 'light in the north');
  assert.equal(p.quests.not_from_here.done, true);
  assert.ok(p.classes.warden.xp >= xp + QUESTS.not_from_here.reward.xp);
  assert.ok(P.countItem(p, 'dusk_draught') >= 2);

  // Danach ist die Laterne leer, aber sie sagt es
  const evs = [];
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: lantern.id, action: 'search' });
  for (let i = 0; i < 400 && p.goal; i++) run(w, 1, (e) => evs.push(...e));
  assert.ok(evs.some((e) => e.type === 'log' && e.text === lantern.empty));
});

test('Haskel und Mothwick erzählen vom Licht im Norden', () => {
  const w = S.createWorld(REGION, 22);
  veteran(w, 'a', { level: 3 });
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'Where do you come from');
  assert.ok(options(w, 'a').some((t) => t.includes('light in the north')));
  talk(w, 'a', 'haskel');
  choose(w, 'a', 'anything odd');
  assert.equal(w.players.get('a').dialog.page, 'h_light');
  assert.ok(REGION.farLight, 'der Schein ist nachts über dem Nordrand zu sehen');
});
