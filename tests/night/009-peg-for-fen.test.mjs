// Nacht 9, Nachschlag (niedrige Stufen): „A Peg for Fen“. Fen will einen Pflock wie die Träger: Totholz spalten, Rook brennt
// den Namen (und eine Gans) hinein, Brindle steckt ihn in den ersten Steinmann, zurück zu Fen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, veteran, actOn } from './helpers.mjs';

test('A Peg for Fen: Fen, Totholz, Rook, Brindle, Fen (Stufe 4)', () => {
  const w = S.createWorld(regionFor('kindle'), 971);
  w.date = '2026-11-20';
  const p = veteran(w, 'a', { level: 4 });
  talk(w, 'a', 'fen');
  choose(w, 'a', 'planning something');
  assert.equal(p.quests.a_peg_for_fen.step, 0);
  // Das nächste Totholz am Waldrand
  const df = w.objects.filter((o) => o.type === 'deadfall').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  actOn(w, 'a', df, 'use');
  run(w, 2);
  assert.equal(p.quests.a_peg_for_fen.step, 1, 'ein Scheit');
  talk(w, 'a', 'rook');
  choose(w, 'a', 'name burnt');
  assert.equal(P.countItem(p, 'fens_peg'), 1);
  talk(w, 'a', 'brindle');
  choose(w, 'a', 'Fen made a peg');
  assert.equal(P.countItem(p, 'fens_peg'), 0);
  const gold0 = p.gold;
  talk(w, 'a', 'fen');
  choose(w, 'a', 'Your peg');
  assert.ok(p.quests.a_peg_for_fen.done);
  assert.equal(p.gold, gold0 + QUESTS.a_peg_for_fen.reward.gold);
  assert.ok(p.travel === undefined && p.hp > 0, 'unterwegs nichts passiert');
});
