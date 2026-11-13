// Anteile im Counting House (Tag 3). Spielstand: p.shares { venture: Anzahl }, p.dividendDay (Berliner Datum
// der letzten Ausschüttung). Kaufen und Abholen laufen über Gesprächswirkungen bei Coyne (invest, dividend,
// grantShare). Zahlen in content/ventures.js.

import { VENTURES, SHARE_MAX, ventureOfShop } from '../content/ventures.js';
import { shopStock } from '../content/shops.js';
import { tell, float } from './events.js';
import { questEvent } from './talk.js';

export function sharesIn(p, id) {
  return p.shares?.[id] ?? 0;
}

export function totalShares(p) {
  return Object.values(p.shares ?? {}).reduce((a, n) => a + n, 0);
}

// Was ein Händler diesem Spieler heute verkauft: Ware des Tages plus Ware für Teilhaber.
export function stockFor(p, shopId, date) {
  const base = shopStock(shopId, date);
  const v = ventureOfShop(shopId);
  if (!v || !sharesIn(p, v)) return base;
  return [...base, ...VENTURES[v].perks.filter((id) => !base.includes(id))];
}

export function canInvest(p, id) {
  const v = VENTURES[id];
  return !!v && sharesIn(p, id) < SHARE_MAX && (p.gold ?? 0) >= v.price;
}

function addShare(p, id) {
  p.shares = { ...(p.shares ?? {}), [id]: sharesIn(p, id) + 1 };
}

export function invest(world, p, id) {
  const v = VENTURES[id];
  if (!v) return;
  if (sharesIn(p, id) >= SHARE_MAX) return tell(world, p.id, `You already hold ${SHARE_MAX} shares in ${v.name}. Coyne does not sell more.`, 'sys');
  if (p.gold < v.price) return tell(world, p.id, `A share costs ${v.price} gold. You have ${p.gold}.`, 'sys');
  p.gold -= v.price;
  addShare(p, id);
  tell(world, p.id, `Coyne writes your name in the ledger: one share in ${v.name} (${sharesIn(p, id)} of ${SHARE_MAX}). It pays ${v.dividend} gold a day.`, 'good');
  if (sharesIn(p, id) === 1) tell(world, p.id, `As a partner you can now buy extra goods at ${v.name}.`, 'good');
  questEvent(world, p, 'action', { action: 'invest' });
}

// Ein geschenkter Anteil (Abels Schuldschein). Ist das Geschäft voll, gibt es den Preis in Gold.
export function grantShare(world, p, id) {
  const v = VENTURES[id];
  if (!v) return;
  if (sharesIn(p, id) >= SHARE_MAX) {
    p.gold += v.price;
    return tell(world, p.id, `Your shares in ${v.name} are full. Coyne pays the note out instead: +${v.price} gold.`, 'good');
  }
  addShare(p, id);
  tell(world, p.id, `Coyne enters a share in ${v.name} under your name (${sharesIn(p, id)} of ${SHARE_MAX}).`, 'good');
}

export function dividendOf(p) {
  return Object.entries(p.shares ?? {}).reduce((a, [id, n]) => a + (VENTURES[id]?.dividend ?? 0) * n, 0);
}

export function dividendDue(p, date) {
  return totalShares(p) > 0 && p.dividendDay !== date;
}

export function collectDividend(world, p) {
  if (!dividendDue(p, world.date)) return tell(world, p.id, 'Nothing to collect today. The ledger pays out once a day.', 'sys');
  const n = dividendOf(p);
  p.dividendDay = world.date;
  p.gold += n;
  tell(world, p.id, `Coyne counts out your share of yesterday's takings: +${n} gold.`, 'good');
  float(world, p.id, `+${n} gold`, 'info', p.id);
  questEvent(world, p, 'action', { action: 'dividend' });
}

// Coyne liest den Stand vor: Anteile pro Geschäft und was sie am Tag bringen.
export function readLedger(world, p) {
  const rows = Object.entries(p.shares ?? {}).filter(([id, n]) => VENTURES[id] && n > 0);
  if (!rows.length) return tell(world, p.id, 'Coyne runs a finger down the ledger. "Nothing under your name. Yet."', 'sys');
  for (const [id, n] of rows) tell(world, p.id, `${VENTURES[id].name}: ${n} of ${SHARE_MAX} shares, ${VENTURES[id].dividend * n} gold a day.`, 'sys');
  tell(world, p.id, `In all: ${dividendOf(p)} gold a day.${dividendDue(p, world.date) ? ' Today\'s share is waiting for you.' : ' Today\'s share is collected.'}`, 'good');
}
