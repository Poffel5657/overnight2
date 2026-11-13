// Die eigene Truhe in der Taverne. Reine Logik: Einlagern aus dem Beutel, Holen in den Beutel.
// Nur in Reichweite einer Truhe (Objekt 'stash'). Gegenstände gehen nie verloren: passt etwas
// nicht mehr hinein, bleibt es, wo es war.
import { ITEMS } from '../content/items.js';
import { STASH_SIZE } from '../content/tavern.js';
import * as P from './player.js';
import { tell } from './events.js';

const REACH = 2;

export function nearStash(world, p) {
  return world.objects.some((o) => o.type === 'stash' && Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)) <= REACH);
}

// Legt n Stück in die Truhe. Gibt zurück, wie viele nicht passten.
export function addToStash(stash, id, n) {
  const def = ITEMS[id];
  if (!def || n <= 0) return n;
  if (def.stack) {
    const slot = stash.find((s) => s.id === id);
    if (slot) { slot.n += n; return 0; }
    if (stash.length < STASH_SIZE) { stash.push({ id, n }); return 0; }
    return n;
  }
  let left = n;
  while (left > 0 && stash.length < STASH_SIZE) { stash.push({ id, n: 1 }); left--; }
  return left;
}

// Beutelfach slot (ganz oder n Stück) in die Truhe
export function stashPut(world, p, slot, n) {
  if (!nearStash(world, p)) return tell(world, p.id, 'Your chest is in the tavern.', 'sys');
  const s = p.bag[slot];
  if (!s) return;
  const want = Math.min(n, s.n);
  const left = addToStash(p.stash, s.id, want);
  const moved = want - left;
  if (moved <= 0) return tell(world, p.id, 'Your chest is full.', 'sys');
  s.n -= moved;
  if (s.n <= 0) p.bag[slot] = null;
  if (left > 0) tell(world, p.id, 'Your chest is full. The rest stays in your bag.', 'sys');
}

// Truhenfach index (n Stück) in den Beutel
export function stashTake(world, p, index, n) {
  if (!nearStash(world, p)) return tell(world, p.id, 'Your chest is in the tavern.', 'sys');
  const s = p.stash[index];
  if (!s) return;
  const want = Math.min(n, s.n);
  const left = P.addItem(p, s.id, want);
  const moved = want - left;
  if (moved <= 0) return tell(world, p.id, 'Your bag is full.', 'sys');
  s.n -= moved;
  if (s.n <= 0) p.stash.splice(index, 1);
  if (left > 0) tell(world, p.id, 'Your bag is full. The rest stays in the chest.', 'sys');
}

// ---------- Herstellen mit Truhe (Chris' Wunsch, 2026-11-13) ----------
// Zutaten kommen erst aus dem Beutel, dann aus der Truhe. Die Truhe zählt überall, nicht nur
// in der Taverne (jede Truhe öffnet sich zu den eigenen Sachen).

export function stashCount(p, id) {
  return (p.stash || []).reduce((n, s) => n + (s.id === id ? s.n : 0), 0);
}

export function hasAllWithStash(p, items) {
  return Object.entries(items).every(([id, n]) => P.countItem(p, id) + stashCount(p, id) >= n);
}

// Nimmt alle Zutaten. Gibt zurück, was woher kam ({ bag: {id: n}, stash: {id: n} }), oder null.
export function takeWithStash(p, items) {
  if (!hasAllWithStash(p, items)) return null;
  p.stash ??= [];
  const from = { bag: {}, stash: {} };
  for (const [id, n] of Object.entries(items)) {
    const inBag = Math.min(n, P.countItem(p, id));
    if (inBag) { P.takeItem(p, id, inBag); from.bag[id] = inBag; }
    let left = n - inBag;
    if (left) from.stash[id] = left;
    for (let i = p.stash.length - 1; i >= 0 && left > 0; i--) {
      const s = p.stash[i];
      if (s.id !== id) continue;
      const t = Math.min(left, s.n);
      s.n -= t;
      left -= t;
      if (s.n <= 0) p.stash.splice(i, 1);
    }
  }
  return from;
}

// Legt Genommenes zurück, wohin es gehörte.
export function giveBack(p, from) {
  for (const [id, n] of Object.entries(from.bag)) P.addItem(p, id, n);
  p.stash ??= [];
  for (const [id, n] of Object.entries(from.stash)) addToStash(p.stash, id, n);
}

// Aus dem Spielstand: nur bekannte Gegenstände, höchstens STASH_SIZE Fächer
export function cleanStash(raw) {
  const out = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    if (!s || !ITEMS[s.id]) continue;
    const n = Number.isInteger(s.n) ? Math.max(1, Math.min(99999, s.n)) : 1;
    addToStash(out, s.id, n);
  }
  return out;
}
