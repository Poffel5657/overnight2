// Nacht 7, vom Nightwright (Bogen „The Second Light“): „A Lamp Gone Out“. Der Stranger zeigt nachts seine erloschene
// grüne Laterne. Glimmer aus Copperdeep, Wren setzt das Glas neu, Ama zündet sie nachts am Leuchtfeuer an, und zurück
// beim Stranger wirft er einen Schatten und sagt, woher er kommt. Fen, Brindle und Tallow reagieren.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { QUESTS } from '../../content/quests.js';
import { MOBS } from '../../content/mobs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { run, talk, choose, veteran, options, fight } from './helpers.mjs';

test('A Lamp Gone Out: nachts beim Stranger, Glimmer aus Copperdeep, Wren, Ama am Leuchtfeuer, zurück zum Stranger', () => {
  const w = S.createWorld(REGION, 711);
  w.date = '2026-11-18';
  w.daylight = 1;
  const p = veteran(w, 'a', { level: 24, equip: { main: 'glim_shield' } });

  // Bei Tag zeigt er nichts, unter 15 auch nicht
  talk(w, 'a', 'stranger');
  assert.ok(!options(w, 'a').some((t) => t.includes('under your coat')), 'bei Tag nicht');
  w.daylight = 0.1;
  veteran(w, 'kid', { level: 8 });
  talk(w, 'kid', 'stranger');
  choose(w, 'kid', 'under your coat');
  assert.equal(w.players.get('kid').dialog.page, 'lg_early');

  talk(w, 'a', 'stranger');
  choose(w, 'a', 'under your coat');
  assert.equal(p.dialog.page, 'lg_offer');
  assert.equal(P.countItem(p, 'strangers_lamp'), 1, 'die kalte Laterne');
  assert.equal(p.quests.lamp_gone_out.step, 0);

  // Glimmer: in Copperdeep tragen ihn Käfer und der Old Foreman. Kämpfen, bis drei im Beutel sind.
  const carriers = Object.entries(MOBS).filter(([, m]) => m.drops?.some(([id]) => id === 'glimmer')).map(([id]) => id);
  w.daylight = 1;
  for (let k = 0; k < 60 && P.countItem(p, 'glimmer') < 3; k++) {
    const m = w.mobs.filter((x) => !x.dead && carriers.includes(x.type) && (MOBS[x.type].level ?? 1) <= 26 && !MOBS[x.type].boss)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m) { run(w, 30); continue; }
    fight(w, 'a', m, ['bash', 'shield_slam']);
    run(w, 2);
  }
  assert.ok(P.countItem(p, 'glimmer') >= 3, 'drei Glimmer erkämpft');
  assert.equal(p.quests.lamp_gone_out.step, 1);

  talk(w, 'a', 'wren');
  choose(w, 'a', 'Stranger\'s lamp');
  assert.equal(p.dialog.page, 'lg_wren');
  assert.equal(p.quests.lamp_gone_out.step, 2);

  // Ama: bei Tag nicht
  talk(w, 'a', 'ama');
  choose(w, 'a', 'light this lamp');
  assert.equal(p.dialog.page, 'lg_ama_day');
  assert.equal(p.quests.lamp_gone_out.step, 2);
  w.daylight = 0.1;
  talk(w, 'a', 'ama');
  choose(w, 'a', 'light this lamp');
  assert.equal(p.dialog.page, 'lg_ama');
  assert.equal(p.quests.lamp_gone_out.step, 3);

  const xp = p.classes.warden.xp;
  talk(w, 'a', 'stranger');
  choose(w, 'a', 'lit from the Beacon');
  assert.equal(p.dialog.page, 'lg_done');
  assert.ok(p.quests.lamp_gone_out.done);
  assert.equal(P.countItem(p, 'strangers_lamp'), 0);
  assert.ok(p.classes.warden.xp > xp);
  assert.ok(QUESTS.lamp_gone_out.reward.xp > 0);

  for (const [npc, frag, page] of [['stranger', 'Where is home', 'lg_after'], ['fen', 'Stranger tonight', 'lg_fen'], ['brindle', 'shadow now', 'lg_brindle'], ['tallow', 'shadow now', 'lg_tallow']]) {
    talk(w, 'a', npc);
    choose(w, 'a', frag);
    assert.equal(p.dialog.page, page, npc);
  }
});

test('Aufräumnacht: Tallows Lightsworn-Segen und Wennas Gebet haben wieder eigene Seiten', async () => {
  const { TALK } = await import('../../content/npcs.js');
  assert.ok(TALK.tallow.ls_tallow.text.includes('birch-bark'), 'Wennas Gebet');
  assert.ok(TALK.tallow.lsw_tallow.text.includes('shield'), 'Segen für Lightsworn');
});
