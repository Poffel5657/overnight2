// Nacht 1, Abstimmung: der Nachtmarkt. Mothwick verkauft nur im Dunkeln; ihre Quest bringt Moonwick,
// aus dem Lampwrights Moon Candles machen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { SHOPS, buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import { QUESTS } from '../../content/quests.js';
import { RECIPES } from '../../content/recipes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn, fight } from './helpers.mjs';

const shop = SHOPS.mothwick;

test('Nachtmarkt: bei Tag geschlossen, nach Einbruch der Dunkelheit offen', () => {
  const w = S.createWorld(REGION, 3);
  const p = veteran(w, 'a', { level: 5, gold: 400 });
  w.daylight = 1;
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'Show me your wares');
  assert.equal(p.dialog?.page, 'closed', 'bei Tag nur ein Hinweis');
  applyIntent(w, 'a', { t: 'buy', shop: 'mothwick', item: 'moth_lantern', n: 1 });
  assert.equal(P.countItem(p, 'moth_lantern'), 0, 'bei Tag kein Kauf');

  w.daylight = 0;
  talk(w, 'a', 'mothwick');
  const evs = [];
  choose(w, 'a', 'Show me your wares');
  evs.push(...w.events);
  assert.ok(evs.some((e) => e.type === 'shop' && e.shop === 'mothwick'), 'Händlerfenster öffnet sich');
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'buy', shop: 'mothwick', item: 'moth_lantern', n: 1 });
  assert.equal(P.countItem(p, 'moth_lantern'), 1);
  assert.equal(p.gold, gold - buyPrice(ITEMS.moth_lantern.value));
  for (const id of shop.sells) assert.ok(ITEMS[id], `${id} gibt es`);

  // Die Laterne anlegen: mehr Licht als die Zinnlaterne, weniger Öl
  const slot = p.bag.findIndex((s) => s?.id === 'moth_lantern');
  applyIntent(w, 'a', { t: 'use', slot });
  assert.equal(p.equip.lantern, 'moth_lantern');
  assert.ok(P.lanternBonus(p) > ITEMS.tin_lantern.light);
  assert.ok(P.oilBurn(p) < ITEMS.tin_lantern.burn);
});

test('Wisps for the Wicks: Greylinge jagen, bei Mothwick abgeben, Moon Candle herstellen und benutzen', () => {
  const w = S.createWorld(REGION, 5);
  w.daylight = 0;
  const lvl = RECIPES.l_moon_candle.level;
  const p = veteran(w, 'a', {
    level: 8, equip: { main: 'brass_shield', body: 'brass_coat' },
    profs: { lampwright: { level: lvl, xp: P.xpForLevel(lvl) }, foraging: { level: 3, xp: P.xpForLevel(3) } },
    bag: [{ id: 'wax_comb', n: 2 }, { id: 'bitter_tonic', n: 10 }],
  });
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'Do you need anything');
  assert.equal(S.saveOf(p).quests.wisps_for_wicks.step, 0);
  const need = QUESTS.wisps_for_wicks.steps[0].n;

  // Greylinge jagen, bis genug Wisps im Beutel sind
  for (let round = 0; round < 40 && P.countItem(p, 'grey_wisp') < need; round++) {
    const g = w.mobs.filter((m) => m.type === 'greyling' && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!g) { run(w, 50); continue; }
    fight(w, 'a', g, ['bash', 'item:bitter_tonic', 'bash']);
  }
  assert.ok(P.countItem(p, 'grey_wisp') >= need, 'genug Wisps gesammelt');
  assert.equal(p.quests.wisps_for_wicks.step, 1);

  // Bei Tag kein Handel, auch keine Abgabe
  w.daylight = 1;
  talk(w, 'a', 'mothwick');
  assert.ok(!options(w, 'a').some((t) => t.includes('Three wisps')), 'Abgabe nur nachts');
  w.daylight = 0;
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'Three wisps');
  assert.equal(p.quests.wisps_for_wicks.done, true);
  assert.ok(P.countItem(p, 'moonwick') >= 2, 'Moonwick bekommen');

  // An der Lampenbank zwei Moon Candles herstellen und eine benutzen
  const bench = w.objects.find((o) => o.station === 'lampbench');
  actOn(w, 'a', bench, 'use');
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 'l_moon_candle', n: 1 });
  assert.ok(P.countItem(p, 'moon_candle') >= 1 + RECIPES.l_moon_candle.out[1], 'Kerzen hergestellt');
  p.oil = 10;
  applyIntent(w, 'a', { t: 'ability', id: 'item:moon_candle' });
  run(w, 6);
  assert.ok(p.glowUntil > w.tick, 'leuchtet');
  assert.ok(p.oil > 10, 'Öl nachgefüllt');
});
