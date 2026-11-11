// Gemeinschaft: tägliche Gefallen, das Leuchtfeuer füttern, Beten und Spenden in der Kapelle.
// Was dauerhaft gespeichert werden muss (Gebete, Spenden, Brennstoff), landet in world.outbox;
// der Server schreibt es in die Datenbank. Gebetstext ist fremder Text: Er wird nur gespeichert und
// anderen Spielern nie gezeigt.

import { FAVOURS, FAVOURS_PER_DAY, BEACON_FUEL, BEACON_GOAL } from '../content/dailies.js';
import { BALLOT } from '../content/ballot.js';
import { ITEMS } from '../content/items.js';
import { tell, emit } from './events.js';
import { grantXp } from './talk.js';
import * as P from './player.js';

export const PRAYER_MAX = 300;
// Steuerzeichen, unsichtbare Zeichen und Schreibrichtungs-Tricks fliegen aus Gebeten heraus.
const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069]', 'g');
const NEAR = 2;

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Die Gefallen eines Tages: für alle gleich, aus dem Datum gewürfelt.
export function favoursFor(date) {
  const ids = Object.keys(FAVOURS).sort();
  const out = [];
  let h = hash(date);
  while (out.length < Math.min(FAVOURS_PER_DAY, ids.length)) {
    const id = ids[h % ids.length];
    if (!out.includes(id)) out.push(id);
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  }
  return out;
}

// Tagesstand des Spielers; ein neuer Tag fängt frisch an.
export function dailyOf(world, p) {
  if (!p.daily || p.daily.date !== world.date) {
    p.daily = { date: world.date, kills: {}, done: [], voted: null, prayed: false };
  }
  return p.daily;
}

function near(world, p, type) {
  const o = world.objects.find((x) => x.type === type);
  return o && p.x >= o.x - NEAR && p.x <= o.x + o.w - 1 + NEAR && p.y >= o.y - NEAR && p.y <= o.y + o.d - 1 + NEAR;
}

function complete(world, p, id) {
  const f = FAVOURS[id];
  const d = dailyOf(world, p);
  d.done.push(id);
  p.gold += f.reward.gold;
  tell(world, p.id, `Favour done: ${f.text} +${f.reward.gold} gold.`, 'good');
  if (f.reward.xp) grantXp(world, p, f.reward.xp);
}

export function onKill(world, p, mob) {
  const d = dailyOf(world, p);
  for (const id of favoursFor(world.date)) {
    const f = FAVOURS[id];
    if (f.type !== 'kill' || f.mob !== mob || d.done.includes(id)) continue;
    d.kills[id] = (d.kills[id] || 0) + 1;
    if (d.kills[id] >= f.n) complete(world, p, id);
  }
}

export function handIn(world, p, id) {
  const f = FAVOURS[id];
  const d = dailyOf(world, p);
  if (!f || f.type !== 'bring' || d.done.includes(id) || !favoursFor(world.date).includes(id)) return;
  if (!near(world, p, 'board')) return tell(world, p.id, 'Hand favours in at the Notice Board.', 'sys');
  if (!P.takeItem(p, f.item, f.n)) return tell(world, p.id, `You need ${f.n} ${ITEMS[f.item].name}.`, 'sys');
  complete(world, p, id);
}

// ---------- Leuchtfeuer ----------

export function feedBeacon(world, p, item, n) {
  const pts = BEACON_FUEL[item];
  if (!pts || !near(world, p, 'beacon')) return;
  const k = Math.min(n, P.countItem(p, item));
  if (k < 1) return;
  P.takeItem(p, item, k);
  const before = world.community.beacon;
  world.community.beacon += pts * k;
  world.outbox.push({ kind: 'beacon', date: world.date, add: pts * k });
  tell(world, p.id, `You feed the Beacon. It roars a little. (+${pts * k})`, 'good');
  emit(world, { type: 'community', community: world.community });
  if (before < BEACON_GOAL && world.community.beacon >= BEACON_GOAL) {
    emit(world, { type: 'log', text: 'The Beacon blazes. Tonight the Grey will have to step back further.', cls: 'good' });
  }
}

// ---------- Kapelle ----------

export function cleanPrayer(text) {
  if (typeof text !== 'string') return null;
  // Nur druckbare Zeichen, Leerraum zusammenfassen, Länge begrenzen.
  const t = text.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
  if (t.length < 3) return null;
  return t.slice(0, PRAYER_MAX);
}

// ---------- Sprechen ----------
// Kein Chatverlauf: Gesagtes erscheint nur kurz als Blase über dem Kopf (alle im Gebiet sehen es).
export const CHAT_MAX = 80;
const CHAT_GAP = 6; // Takte zwischen zwei Sätzen (1,8 s)

export function chat(world, p, text) {
  if (typeof text !== 'string') return;
  const t = text.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
  if (!t) return;
  if (world.tick < (p.chatAt || 0)) return tell(world, p.id, 'Not so fast. Let the last words settle.', 'sys');
  p.chatAt = world.tick + CHAT_GAP;
  emit(world, { type: 'chat', ent: p.id, text: t });
}

export function pray(world, p, text) {
  if (!near(world, p, 'altar')) return;
  const d = dailyOf(world, p);
  if (d.prayed) return tell(world, p.id, 'You have already prayed today. The Nightwright is busy, and so is Tallow.', 'sys');
  const clean = cleanPrayer(text);
  if (!clean) return tell(world, p.id, 'A prayer needs a few words at least.', 'sys');
  d.prayed = true;
  world.outbox.push({ kind: 'prayer', pid: p.id, date: world.date, text: clean });
  tell(world, p.id, 'Your prayer goes up with the smoke. If it is answered, you will hear of it.', 'good');
}

// Abstimmen am Altar: eine Stimme pro Spieler und Tag. Gold kauft keine Stimmen.
export function vote(world, p, option) {
  if (!near(world, p, 'altar')) return;
  if (!BALLOT.options.some((o) => o.id === option)) return;
  const d = dailyOf(world, p);
  if (d.voted) return tell(world, p.id, 'You have spoken today. One voice a day, for everyone. Come back tomorrow.', 'sys');
  d.voted = option;
  world.community.ballot[option] = (world.community.ballot[option] || 0) + 1;
  world.outbox.push({ kind: 'vote', pid: p.id, ballot: BALLOT.day, option });
  tell(world, p.id, 'You drop a white stone into the box. One voice, heard like any other.', 'good');
  emit(world, { type: 'community', community: world.community });
}
