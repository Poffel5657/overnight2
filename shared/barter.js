// Handel zwischen zwei Spielern im selben Gebiet:
// 1. A fragt B (nah beieinander).  2. B nimmt an.  3. Beide legen Gegenstände und Gold ins Angebot.
// 4. Jede Änderung hebt beide Zusagen auf.  5. Sagen beide zu, tauscht der Server alles auf einmal,
//    nachdem er Besitz und Platz im Beutel geprüft hat. Ausgerüstetes zählt nicht, nur der Beutel.
import { ITEMS } from '../content/items.js';
import * as P from './player.js';
import { emit, tell } from './events.js';

export const TRADE_RANGE = 4;      // Felder, um zu fragen
const TRADE_BREAK = 7;             // Felder, ab denen ein offener Handel abbricht
const ASK_TICKS = 100;             // eine Anfrage gilt 30 Sekunden
export const TRADE_MAX_KINDS = 8;  // verschiedene Gegenstände pro Angebot

const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const partnerOf = (world, p) => (p.trade ? world.players.get(p.trade.with) : null);

function view(world, p) {
  const q = partnerOf(world, p);
  if (!q || !p.trade?.open) return;
  emit(world, {
    to: p.id, type: 'trade', with: q.id, name: q.name,
    mine: { items: p.trade.items, gold: p.trade.gold, ok: p.trade.ok },
    theirs: { items: q.trade.items, gold: q.trade.gold, ok: q.trade.ok },
  });
}

export function cancelTrade(world, p, why = null) {
  const q = partnerOf(world, p);
  for (const x of [p, q]) {
    if (!x?.trade) continue;
    x.trade = null;
    emit(world, { to: x.id, type: 'tradeEnd' });
  }
  if (why) {
    tell(world, p.id, why, 'sys');
    if (q) tell(world, q.id, why, 'sys');
  }
}

export function askTrade(world, p, otherId) {
  const q = world.players.get(otherId);
  if (!q || q === p) return;
  if (p.trade) cancelTrade(world, p);
  if (q.trade) return tell(world, p.id, `${q.name} is busy trading.`, 'sys');
  if (dist(p, q) > TRADE_RANGE) return tell(world, p.id, `Get closer to ${q.name} to trade.`, 'sys');
  p.trade = { with: q.id, asking: true, until: world.tick + ASK_TICKS };
  emit(world, { to: q.id, type: 'tradeAsk', from: p.id, name: p.name });
  tell(world, p.id, `You ask ${q.name} to trade.`, 'sys');
}

export function answerTrade(world, q, fromId, yes) {
  const p = world.players.get(fromId);
  if (!p || p.trade?.with !== q.id || !p.trade.asking || q.trade) return;
  if (!yes) {
    p.trade = null;
    return tell(world, p.id, `${q.name} does not want to trade.`, 'sys');
  }
  if (dist(p, q) > TRADE_RANGE) {
    p.trade = null;
    return tell(world, q.id, `${p.name} is too far away now.`, 'sys');
  }
  for (const [x, y] of [[p, q], [q, p]]) x.trade = { with: y.id, open: true, items: {}, gold: 0, ok: false };
  view(world, p);
  view(world, q);
}

// Neues Angebot. items: { id: Anzahl }, gold: Zahl. Mehr als man hat, wird gekappt.
export function setOffer(world, p, items, gold) {
  const q = partnerOf(world, p);
  if (!q || !p.trade?.open) return;
  const clean = {};
  for (const [id, n] of Object.entries(items || {}).slice(0, TRADE_MAX_KINDS)) {
    if (!ITEMS[id] || !Number.isInteger(n) || n < 1) continue;
    const have = P.countItem(p, id);
    if (have > 0) clean[id] = Math.min(n, have);
  }
  p.trade.items = clean;
  p.trade.gold = Math.max(0, Math.min(p.gold, Number.isInteger(gold) ? gold : 0));
  p.trade.ok = false;
  q.trade.ok = false;
  view(world, p);
  view(world, q);
}

// Probelauf auf Kopien: Hat jeder, was er gibt, und passt, was er bekommt?
function fits(p, give, get) {
  const copy = { bag: p.bag.map((s) => (s ? { ...s } : s)) };
  for (const [id, n] of Object.entries(give.items)) if (!P.takeItem(copy, id, n)) return false;
  for (const [id, n] of Object.entries(get.items)) if (P.addItem(copy, id, n) > 0) return false;
  return p.gold >= give.gold;
}

export function confirmTrade(world, p) {
  const q = partnerOf(world, p);
  if (!q || !p.trade?.open) return;
  p.trade.ok = true;
  if (!q.trade.ok) { view(world, p); view(world, q); return; }
  const a = p.trade;
  const b = q.trade;
  if (!fits(p, a, b) || !fits(q, b, a)) {
    a.ok = false;
    b.ok = false;
    tell(world, p.id, 'The trade does not work out: something is missing, or a bag is too full.', 'sys');
    tell(world, q.id, 'The trade does not work out: something is missing, or a bag is too full.', 'sys');
    view(world, p);
    view(world, q);
    return;
  }
  for (const [id, n] of Object.entries(a.items)) P.takeItem(p, id, n);
  for (const [id, n] of Object.entries(b.items)) P.takeItem(q, id, n);
  for (const [id, n] of Object.entries(b.items)) P.addItem(p, id, n);
  for (const [id, n] of Object.entries(a.items)) P.addItem(q, id, n);
  p.gold += b.gold - a.gold;
  q.gold += a.gold - b.gold;
  p.trade = null;
  q.trade = null;
  for (const x of [p, q]) {
    emit(world, { to: x.id, type: 'tradeEnd', done: true });
    tell(world, x.id, `Trade with ${(x === p ? q : p).name} done. A firm handshake.`, 'good');
  }
}

// Jeder Takt: Anfrage verfällt, Partner weg oder zu weit -> abbrechen.
export function tickTrade(world, p) {
  if (!p.trade) return;
  const q = partnerOf(world, p);
  if (p.trade.asking) {
    if (!q || world.tick > p.trade.until) p.trade = null;
    return;
  }
  if (!q || p.travel || q.travel || dist(p, q) > TRADE_BREAK) cancelTrade(world, p, 'The trade is off: you drifted apart.');
}
