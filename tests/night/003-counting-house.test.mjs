// Nacht 3, aus den Gebeten: das Counting House. Coyne verkauft Anteile an Geschäften in Kindle, jeder Anteil
// bringt einmal am Tag Gold, Teilhaber bekommen beim Händler zusätzliche Ware. Dazu Abels alte Truhe:
// ein Rätsel mit drei Symbolrädern, den Zettel findet man unter einer Diele in Abels altem Haus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { regionFor } from '../../content/regions/index.js';
import { QUESTS } from '../../content/quests.js';
import { VENTURES, SHARE_MAX } from '../../content/ventures.js';
import { shopStock, buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, talk, choose, options, veteran, actOn } from './helpers.mjs';

// Durch eine Tür gehen und im Zielgebiet weiterspielen (wie der Server: speichern, neues Gebiet, laden).
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
const exitNear = (w, p) => w.objects.filter((o) => o.type === 'door').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];

test('Counting House: Anteil kaufen, Ware für Teilhaber, Ausschüttung einmal am Tag, A Stake in Kindle', () => {
  const v = VENTURES.marrow;
  let w = S.createWorld(REGION, 301);
  w.date = '2026-11-14';
  veteran(w, 'a', { level: 6, gold: v.price * 4 + 50 });
  // Ohne Anteil verkauft Marrow nur seine normale Ware
  for (const id of v.perks) assert.ok(!shopStock('marrow', w.date).includes(id), `${id} gibt es bei Marrow sonst nicht`);

  const house = w.objects.find((o) => o.name === 'the Counting House');
  assert.ok(house?.inside, 'Counting House steht in Kindle und hat einen Innenraum');
  w = through(w, 'a', house, 302);
  assert.equal(w.region.zoneAt(w.players.get('a').x, w.players.get('a').y), 'THE COUNTING HOUSE');
  const p = w.players.get('a');

  talk(w, 'a', 'coyne');
  choose(w, 'a', 'counting house, in Kindle');
  assert.equal(p.quests.stake_in_kindle.step, 0);
  choose(w, 'a', 'what I can buy');
  const gold = p.gold;
  choose(w, 'a', `share in ${v.name}`);
  assert.equal(p.gold, gold - v.price, 'Anteil kostet Gold');
  assert.equal(p.shares.marrow, 1);
  assert.equal(p.quests.stake_in_kindle.step, 1, 'Kauf zählt für die Quest');
  // Höchstens SHARE_MAX Anteile
  for (let i = 1; i < SHARE_MAX + 1; i++) {
    talk(w, 'a', 'coyne'); choose(w, 'a', 'buy a share');
    if (options(w, 'a').some((t) => t.includes(v.name))) choose(w, 'a', `share in ${v.name}`);
  }
  assert.equal(p.shares.marrow, SHARE_MAX, 'nicht mehr als SHARE_MAX');
  talk(w, 'a', 'coyne'); choose(w, 'a', 'buy a share');
  assert.ok(!options(w, 'a').some((t) => t.includes(v.name)), 'Marrow ist voll');

  // Ausschüttung: einmal am Tag
  const before = p.gold;
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'share of the takings');
  assert.equal(p.gold, before + v.dividend * SHARE_MAX, 'Ausschüttung pro Anteil');
  talk(w, 'a', 'coyne');
  assert.ok(!options(w, 'a').some((t) => t.includes('share of the takings')), 'heute nicht noch einmal');
  // Coyne liest den Stand vor
  const told = [];
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'What do I own');
  run(w, 1, (ev) => told.push(...ev.filter((e) => e.to === 'a').map((e) => e.text)));
  assert.ok(told.some((t) => t?.includes(`${SHARE_MAX} of ${SHARE_MAX} shares`)), 'Anteile im Log');
  w.date = '2026-11-15';
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'share of the takings');
  assert.equal(p.gold, before + 2 * v.dividend * SHARE_MAX, 'am nächsten Tag wieder');

  // Hinaus zu Marrow: Ware für Teilhaber kaufen und von der Teilhaberschaft erzählen
  w = through(w, 'a', exitNear(w, p), 303);
  const q = w.players.get('a');
  assert.equal(q.shares.marrow, SHARE_MAX, 'Anteile überleben den Ortswechsel');
  talk(w, 'a', 'marrow');
  choose(w, 'a', 'partner now');
  assert.equal(q.quests.stake_in_kindle.done, true);
  let shopEv = null;
  talk(w, 'a', 'marrow');
  applyIntent(w, 'a', { t: 'say', i: 0 });
  run(w, 2, (ev) => { shopEv = ev.find((e) => e.type === 'shop' && e.to === 'a') ?? shopEv; });
  assert.ok(shopEv, 'Händlerfenster geht auf');
  for (const id of v.perks) assert.ok(shopEv.stock.includes(id), `Teilhaber sehen ${id}`);
  const perk = v.perks[0];
  const g = q.gold;
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: perk, n: 1 });
  assert.equal(P.countItem(q, perk), 1, 'Ware für Teilhaber gekauft');
  assert.equal(q.gold, g - buyPrice(ITEMS[perk].value));

  // Wer keinen Anteil hat, kann sie nicht kaufen
  const r = veteran(w, 'b', { level: 6, gold: 500 });
  r.x = q.x; r.y = q.y;
  applyIntent(w, 'b', { t: 'buy', shop: 'marrow', item: perk, n: 1 });
  assert.equal(P.countItem(r, perk), 0);

  // Spielstand: Anteile bleiben, alte Stände ohne Anteile laden ohne Fehler
  const save = P.saveOf(q);
  assert.equal(save.shares.marrow, SHARE_MAX);
  const w2 = S.createWorld(REGION, 304);
  const back = S.addPlayer(w2, 'c', 'c', save);
  assert.equal(back.shares.marrow, SHARE_MAX);
  assert.equal(back.dividendDay, '2026-11-15');
  const old = { ...save };
  delete old.shares; delete old.dividendDay;
  const fresh = S.addPlayer(w2, 'd', 'd', old);
  assert.deepEqual(fresh.shares, {});
  const junk = S.addPlayer(w2, 'e', 'e', { ...save, shares: { marrow: 99, nonsense: 2 } });
  assert.deepEqual(junk.shares, { marrow: SHARE_MAX }, 'unbekannte Geschäfte fallen weg, zu viele Anteile werden gekappt');
});

test('The Old Strongbox: Zettel unter der Diele, falsche Räder bleiben zu, richtige öffnen und schenken einen Anteil', () => {
  let w = S.createWorld(regionFor('kindle_inside'), 311);
  const p = veteran(w, 'a', { level: 3, gold: 0 });
  const cs = w.npcs.find((n) => n.id === 'coyne');
  p.x = cs.x; p.y = cs.y + 2;
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'iron box');
  assert.equal(p.quests.old_strongbox.step, 0);
  talk(w, 'a', 'coyne');
  assert.ok(!options(w, 'a').some((t) => t.includes('try the dials')), 'ohne Zettel keine Räder');

  // Der Zettel liegt unter einer Diele im Haus beim Lagerfeuer (Haus 4): hinaus, hinüber, hinein
  w = through(w, 'a', exitNear(w, p), 312);
  const house4 = w.objects.find((o) => o.inside && o.x === 55 && o.y === 55);
  w = through(w, 'a', house4, 313);
  const q = w.players.get('a');
  const board = w.objects.find((o) => o.gives === 'abels_riddle');
  assert.ok(board, 'lockere Diele');
  actOn(w, 'a', board, 'search');
  assert.equal(P.countItem(q, 'abels_riddle'), 1, 'Abels Zettel gefunden');
  assert.equal(q.quests.old_strongbox.step, 1);
  assert.ok(ITEMS.abels_riddle.text.includes('Warden'), 'das Rätsel steht auf dem Zettel');

  // Hinweise geben die, die es wissen
  w = through(w, 'a', exitNear(w, q), 314);
  talk(w, 'a', 'ama'); choose(w, 'a', 'besides a shield');
  assert.equal(w.players.get('a').dialog.page, 'sb_ama', 'Ama erklärt, was ein Warden trägt');

  const house1 = w.objects.find((o) => o.name === 'the Counting House');
  w = through(w, 'a', house1, 315);
  const r = w.players.get('a');
  // Falsch: Laterne, Schild, Motte -> bleibt zu
  talk(w, 'a', 'coyne'); choose(w, 'a', 'try the dials');
  choose(w, 'a', 'to the lantern'); choose(w, 'a', 'to the shield'); choose(w, 'a', 'to the moth');
  assert.equal(r.dialog.page, 'stuck');
  assert.equal(r.quests.old_strongbox.step, 1, 'falsch: nichts passiert');
  // Ein falsches erstes Rad lässt sich nicht durch zwei richtige retten
  choose(w, 'a', 'Try again');
  choose(w, 'a', 'to the wolf'); choose(w, 'a', 'to the bell'); choose(w, 'a', 'to the moth');
  assert.equal(r.dialog.page, 'stuck');
  // Richtig: Laterne, Glocke, Motte
  const xp = r.classes.warden.xp;
  choose(w, 'a', 'Try again');
  choose(w, 'a', 'to the lantern'); choose(w, 'a', 'to the bell'); choose(w, 'a', 'to the moth');
  assert.equal(r.dialog.page, 'opened');
  assert.equal(r.quests.old_strongbox.done, true);
  assert.equal(P.countItem(r, 'abels_riddle'), 0, 'Zettel bleibt bei Coyne');
  assert.equal(r.gold, QUESTS.old_strongbox.reward.gold);
  assert.ok(r.classes.warden.xp >= xp + QUESTS.old_strongbox.reward.xp);
  assert.equal(r.shares.marrow, 1, 'Abels Anteil gehört jetzt dem Spieler');
});

test("Abel's Three Caches: drei Verstecke nach Rätseln, in der richtigen Reihenfolge", () => {
  let w = S.createWorld(regionFor('kindle_inside'), 316);
  const p = veteran(w, 'a', { level: 20, gold: 0, quests: { kindling: { done: true }, old_strongbox: { done: true } }, equip: { main: 'glim_shield', body: 'brass_coat', head: 'glim_hood' } });
  const cs = w.npcs.find((n) => n.id === 'coyne');
  p.x = cs.x; p.y = cs.y + 2;
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'anything else in the box');
  assert.equal(p.quests.abels_caches.step, 0);
  w = through(w, 'a', exitNear(w, p), 317);
  w.daylight = 1;
  const q = w.players.get('a');
  const caches = w.objects.filter((o) => o.quest === 'abels_caches').sort((a, b) => a.step - b.step);
  assert.equal(caches.length, 3);
  // Das zweite Versteck gibt nichts, solange das erste nicht gefunden ist
  actOn(w, 'a', caches[1], 'search');
  assert.equal(P.countItem(q, 'abels_purse_2'), 0, 'Reihenfolge zählt');
  // Die Hinweise passen zu den Orten
  const fire = (name) => w.objects.find((o) => o.type === 'campfire' && o.name.includes(name));
  assert.ok(Math.hypot(caches[0].x - fire('woodcutters').x, caches[0].y - fire('woodcutters').y) <= 3.5, 'beim Holzfällerfeuer');
  assert.ok(caches[1].x < 8, 'am Ende des alten Wegs');
  assert.ok(Math.hypot(caches[2].x - fire('mine').x, caches[2].y - fire('mine').y) <= 3.5, 'beim Minenfeuer');
  for (let i = 0; i < 3; i++) {
    q.hp = q.maxHp;
    actOn(w, 'a', caches[i], 'search');
    for (let k = 0; k < 5 && !P.countItem(q, `abels_purse_${i + 1}`); k++) { q.hp = q.maxHp; q.target = null; actOn(w, 'a', caches[i], 'search'); }
    assert.equal(P.countItem(q, `abels_purse_${i + 1}`), 1, `Versteck ${i + 1}`);
    run(w, 2);
  }
  assert.equal(q.quests.abels_caches.step, 3);
  const house1 = w.objects.find((o) => o.name === 'the Counting House');
  w = through(w, 'a', house1, 318);
  const r = w.players.get('a');
  talk(w, 'a', 'coyne');
  choose(w, 'a', 'Three purses');
  assert.equal(r.quests.abels_caches.done, true);
  for (let i = 1; i <= 3; i++) assert.equal(P.countItem(r, `abels_purse_${i}`), 0);
  assert.ok(r.gold >= QUESTS.abels_caches.reward.gold);
});
