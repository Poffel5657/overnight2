// Nacht 4, aus den Gebeten (Gebet 7): Flint, ein Bergmann in Cinderford, verkauft Schrott, Messing und Glimmer.
// Ein Anteil an seinem Karren (bei Coyne in Kindle) macht seine Ware pro Anteil billiger und gibt Cinder Iron.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { VENTURES, SHARE_MAX } from '../../content/ventures.js';
import { SHOPS, buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import { priceFor } from '../../shared/ventures.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

function through(w, pid, door, seed) {
  actOn(w, pid, door, 'enter');
  const to = w.players.get(pid).travel?.region;
  assert.ok(to, `${door.name} führt woandershin`);
  const save = S.removePlayer(w, pid);
  const next = S.createWorld(regionFor(to), seed);
  next.date = w.date;
  S.addPlayer(next, pid, pid, save);
  return next;
}

test('Flint in Cinderford: Erz kaufen, Anteil bei Coyne, danach billiger und mit Cinder Iron', () => {
  const v = VENTURES.flint;
  assert.ok(v.discount > 0 && v.perks.includes('cinder_iron'));
  for (const id of ['scrap', 'brass_bits', 'glimmer']) assert.ok(SHOPS.flint.sells.includes(id), `Flint verkauft ${id}`);

  // Kindle: über den alten Weg nach Cinderford
  let w = S.createWorld(REGION, 401);
  w.date = '2026-11-15';
  veteran(w, 'a', { level: 12, gold: 2000 });
  const west = w.objects.find((o) => o.type === 'door' && o.to === 'cinderford');
  w = through(w, 'a', west, 402);
  let p = w.players.get('a');
  const flint = w.npcs.find((n) => n.id === 'flint');
  assert.ok(flint, 'Flint steht in Cinderford');
  const cart = w.objects.find((o) => o.name === "Flint's Ore Cart");
  assert.ok(cart && Math.hypot(cart.x + 1 - flint.x, cart.y + 1 - flint.y) <= 2.5, 'Flint steht an seinem Karren');

  // Ohne Anteil: voller Preis, kein Cinder Iron
  talk(w, 'a', 'flint');
  choose(w, 'a', 'Show me what you dug');
  let gold = p.gold;
  applyIntent(w, 'a', { t: 'buy', shop: 'flint', item: 'glimmer', n: 1 });
  assert.equal(P.countItem(p, 'glimmer'), 1);
  const full = buyPrice(ITEMS.glimmer.value);
  assert.equal(gold - p.gold, full, 'voller Preis');
  applyIntent(w, 'a', { t: 'buy', shop: 'flint', item: 'cinder_iron', n: 1 });
  assert.equal(P.countItem(p, 'cinder_iron'), 0, 'Cinder Iron nur für Teilhaber');

  talk(w, 'a', 'flint');
  choose(w, 'a', 'Why so expensive');
  assert.equal(p.quests.flints_partner.step, 0);

  // Zurück nach Kindle, ins Counting House zu Coyne
  w = through(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'kindle'), 403);
  const house = w.objects.find((o) => o.name === 'the Counting House');
  w = through(w, 'a', house, 404);
  p = w.players.get('a');
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'buy a share');
  gold = p.gold;
  choose(w, 'a', `share in ${v.name}`);
  assert.equal(p.gold, gold - v.price);
  assert.equal(p.shares.flint, 1);
  assert.equal(p.quests.flints_partner.step, 1, 'Anteil an Flints Karren zählt für die Quest');
  // Noch zwei Anteile: drei Zehntel billiger
  for (let i = 1; i < SHARE_MAX; i++) { talk(w, 'a', 'coyne'); choose(w, 'a', 'buy a share'); choose(w, 'a', `share in ${v.name}`); }
  assert.equal(p.shares.flint, SHARE_MAX);

  // Wieder hinunter nach Cinderford
  const exit = w.objects.filter((o) => o.type === 'door' && o.to === 'kindle').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  w = through(w, 'a', exit, 405);
  w = through(w, 'a', w.objects.find((o) => o.type === 'door' && o.to === 'cinderford'), 406);
  p = w.players.get('a');
  talk(w, 'a', 'flint');
  choose(w, 'a', 'You have a partner now');
  assert.equal(p.quests.flints_partner.done, true);
  assert.ok(P.countItem(p, 'cinder_iron') >= QUESTS.flints_partner.reward.items.cinder_iron);

  talk(w, 'a', 'flint');
  choose(w, 'a', 'Partner prices');
  gold = p.gold;
  applyIntent(w, 'a', { t: 'buy', shop: 'flint', item: 'glimmer', n: 1 });
  const paid = gold - p.gold;
  assert.equal(paid, priceFor(p, 'flint', 'glimmer'));
  assert.ok(paid < full, `Teilhaber zahlen weniger (${paid} statt ${full})`);
  assert.equal(paid, Math.ceil(full * (1 - v.discount * SHARE_MAX)));
  const iron = P.countItem(p, 'cinder_iron');
  applyIntent(w, 'a', { t: 'buy', shop: 'flint', item: 'cinder_iron', n: 2 });
  assert.equal(P.countItem(p, 'cinder_iron'), iron + 2, 'Teilhaber kaufen Cinder Iron');

  // Andere Händler bleiben beim alten Preis
  assert.equal(priceFor(p, 'hesk', 'lamp_oil'), buyPrice(ITEMS.lamp_oil.value));
  // Alter Spielstand ohne Anteil an Flint lädt
  const save = P.saveOf(p);
  delete save.shares.flint;
  const q = S.addPlayer(S.createWorld(REGION, 407), 'b', 'b', save);
  assert.equal(q.shares.flint ?? 0, 0);
  assert.equal(priceFor(q, 'flint', 'glimmer'), full);
});

test('Three Wheels: Flint braucht ein Rad, Rook macht es aus Schrott', () => {
  let w = S.createWorld(regionFor('cinderford'), 408);
  let p = veteran(w, 'a', { level: 5, bag: [{ id: 'scrap', n: 5 }] });
  talk(w, 'a', 'flint');
  choose(w, 'a', 'cart wobbles');
  assert.equal(p.quests.three_wheels.step, 1, 'fünf Schrott sind schon da');
  const save = S.removePlayer(w, 'a');
  w = S.createWorld(REGION, 409);
  p = S.addPlayer(w, 'a', 'a', save);
  talk(w, 'a', 'rook');
  choose(w, 'a', 'cart wheel');
  assert.equal(P.countItem(p, 'cart_wheel'), 1);
  assert.equal(P.countItem(p, 'scrap'), 0);
  const back = S.createWorld(regionFor('cinderford'), 410);
  const q = S.addPlayer(back, 'a', 'a', S.removePlayer(w, 'a'));
  talk(back, 'a', 'flint');
  choose(back, 'a', 'fourth wheel');
  assert.equal(q.quests.three_wheels.done, true);
  assert.ok(P.countItem(q, 'brass_bits') >= QUESTS.three_wheels.reward.items.brass_bits);
});
