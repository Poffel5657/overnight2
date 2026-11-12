// Nacht 2, Nachschlag: Mothwicks Ware wechselt jede Nacht (zwei Dinge aus einem Vorrat, für alle gleich).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { SHOPS, shopStock, buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { talk, choose, veteran } from './helpers.mjs';

const M = SHOPS.mothwick;

test('Wechselnde Ware: jeden Tag feste Ware plus zwei andere aus dem Vorrat', () => {
  const seen = new Set();
  for (let d = 1; d <= 30; d++) {
    const date = `2026-12-${String(d).padStart(2, '0')}`;
    const stock = shopStock('mothwick', date);
    assert.deepEqual(stock, shopStock('mothwick', date), 'für alle gleich');
    for (const id of M.sells) assert.ok(stock.includes(id));
    const extra = stock.filter((id) => !M.sells.includes(id));
    assert.equal(extra.length, M.rotating.perDay);
    for (const id of extra) { assert.ok(M.rotating.pool.includes(id)); assert.ok(ITEMS[id]); seen.add(id); }
  }
  assert.ok(seen.size >= M.rotating.pool.length - 2, 'über einen Monat kommt fast alles einmal');
  assert.deepEqual(shopStock('hollis', '2026-12-01'), SHOPS.hollis.sells, 'andere Händler unverändert');
});

test('Nachts bei Mothwick: das Fenster zeigt die Ware der Nacht, nur die lässt sich kaufen', () => {
  const w = S.createWorld(REGION, 270);
  w.daylight = 0;
  w.date = '2026-11-13';
  const p = veteran(w, 'a', { level: 5, gold: 500 });
  talk(w, 'a', 'mothwick');
  choose(w, 'a', 'new tonight');
  const evs = [];
  choose(w, 'a', 'Show me');
  evs.push(...w.events);
  const ev = evs.find((e) => e.type === 'shop');
  assert.ok(ev, 'Händlerfenster');
  assert.deepEqual(ev.stock, shopStock('mothwick', w.date));
  const tonight = ev.stock.find((id) => !M.sells.includes(id));
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'buy', shop: 'mothwick', item: tonight, n: 1 });
  assert.equal(P.countItem(p, tonight), 1, 'Ware der Nacht gekauft');
  assert.equal(p.gold, gold - buyPrice(ITEMS[tonight].value));
  const notTonight = M.rotating.pool.find((id) => !ev.stock.includes(id));
  applyIntent(w, 'a', { t: 'buy', shop: 'mothwick', item: notTonight, n: 1 });
  assert.equal(P.countItem(p, notTonight), 0, 'was heute nicht da ist, gibt es nicht');
});
