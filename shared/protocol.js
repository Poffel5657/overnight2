// Nachrichten zwischen Browser und Gebiets-Server. Der Server prüft jede Absicht hier,
// bevor sie die Simulation erreicht: feste Typen, ganze Zahlen, kurze IDs, kein Freitext.

import { walkTo, interact, useAbility, setTarget, cycleTarget, setBar, lightBonusOf } from './sim.js';
import { say, closeTalk } from './talk.js';
import { handIn, feedBeacon, pray, donate, PRAYER_MAX } from './community.js';
import { useSlot, unequip, dropSlot, craft, buy, sell } from './trade.js';
import { stateOf } from './player.js';
import { SLOTS } from '../content/items.js';
import { CONTENT_SIG } from './version.js';

const ID = /^[a-z0-9_]{1,24}$/;
const BAR_ID = /^(item:)?[a-z0-9_]{1,24}$/;
const ACTIONS = new Set(['attack', 'talk', 'examine', 'refill', 'light', 'rest', 'gather', 'use', 'read', 'feed', 'pray', 'enter', 'open', 'search']);
const OPTION = /^[a-z0-9-]{1,32}$/;
const KINDS = new Set(['npc', 'mob', 'object']);
const MAX_COORD = 1024;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const coord = (v) => int(v, 0, MAX_COORD);

// Gibt eine bereinigte Absicht zurück oder null.
export function parseIntent(raw) {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  let m;
  try { m = JSON.parse(raw); } catch { return null; }
  if (!m || typeof m !== 'object') return null;
  switch (m.t) {
    case 'hello': return typeof m.token === 'string' && m.token.length <= 128
      ? { t: 'hello', token: m.token, sig: typeof m.sig === 'string' && m.sig.length <= 16 ? m.sig : null } : null;
    case 'walk': return coord(m.x) && coord(m.y) ? { t: 'walk', x: m.x, y: m.y } : null;
    case 'act': return KINDS.has(m.kind) && ID.test(String(m.id)) && ACTIONS.has(m.action) ? { t: 'act', kind: m.kind, id: m.id, action: m.action } : null;
    case 'ability': return BAR_ID.test(String(m.id)) ? { t: 'ability', id: m.id } : null;
    case 'target': return m.id === null || ID.test(String(m.id)) ? { t: 'target', id: m.id } : null;
    case 'cycle': return { t: 'cycle' };
    case 'say': return int(m.i, 0, 31) ? { t: 'say', i: m.i } : null;
    case 'bye': return { t: 'bye' };
    case 'use': case 'drop': return int(m.slot, 0, 63) ? { t: m.t, slot: m.slot } : null;
    case 'unequip': return SLOTS.includes(m.slot) ? { t: 'unequip', slot: m.slot } : null;
    case 'craft': return ID.test(String(m.obj)) && ID.test(String(m.recipe)) && int(m.n, 1, 10) ? { t: 'craft', obj: m.obj, recipe: m.recipe, n: m.n } : null;
    case 'buy': return ID.test(String(m.shop)) && ID.test(String(m.item)) && int(m.n, 1, 20) ? { t: 'buy', shop: m.shop, item: m.item, n: m.n } : null;
    case 'sell': return ID.test(String(m.shop)) && int(m.slot, 0, 63) && int(m.n, 1, 9999) ? { t: 'sell', shop: m.shop, slot: m.slot, n: m.n } : null;
    case 'bar': return int(m.slot, 0, 8) && (m.id === null || BAR_ID.test(String(m.id))) ? { t: 'bar', slot: m.slot, id: m.id } : null;
    case 'favour': return ID.test(String(m.id)) ? { t: 'favour', id: m.id } : null;
    case 'feed': return ID.test(String(m.item)) && int(m.n, 1, 999) ? { t: 'feed', item: m.item, n: m.n } : null;
    case 'pray': return typeof m.text === 'string' && m.text.length <= PRAYER_MAX * 2 ? { t: 'pray', text: m.text } : null;
    case 'donate': return OPTION.test(String(m.option)) && int(m.gold, 1, 1000) ? { t: 'donate', option: m.option, gold: m.gold } : null;
    case 'ping': return { t: 'ping' };
    default: return null;
  }
}

export function applyIntent(world, pid, m) {
  const p = world.players.get(pid);
  if (!p) return;
  switch (m.t) {
    case 'walk': walkTo(world, pid, m.x, m.y); break;
    case 'act': interact(world, pid, { kind: m.kind, id: m.id }, m.action); break;
    case 'ability': useAbility(world, pid, m.id); break;
    case 'target': setTarget(world, pid, m.id); break;
    case 'cycle': cycleTarget(world, pid); break;
    case 'say': say(world, p, m.i); break;
    case 'bye': closeTalk(world, p); break;
    case 'use': useSlot(world, p, m.slot); break;
    case 'drop': dropSlot(world, p, m.slot); break;
    case 'unequip': unequip(world, p, m.slot); break;
    case 'craft': craft(world, p, m.obj, m.recipe, m.n); break;
    case 'buy': buy(world, p, m.shop, m.item, m.n); break;
    case 'sell': sell(world, p, m.shop, m.slot, m.n); break;
    case 'bar': setBar(world, pid, m.slot, m.id); break;
    case 'favour': handIn(world, p, m.id); break;
    case 'feed': feedBeacon(world, p, m.item, m.n); break;
    case 'pray': pray(world, p, m.text); break;
    case 'donate': donate(world, p, m.option, m.gold); break;
    default: break;
  }
}

function metaOf(e) {
  return { id: e.id, kind: e.kind, sprite: e.sprite, name: e.name, maxHp: e.maxHp ?? 0, type: e.type ?? null, level: e.def?.level ?? null };
}

function allEntities(world) {
  return [...world.players.values(), ...world.npcs, ...world.mobs];
}

// Begrüßung nach dem Einloggen: wer man ist und der Zustand, der sich nicht jeden Takt ändert.
export function welcomeFor(world, pid) {
  return {
    t: 'welcome',
    you: pid,
    name: world.players.get(pid)?.name,
    region: world.region.id,
    regionDate: world.region.date ?? null,
    tick: world.tick,
    lit: world.objects.filter((o) => o.lit).map((o) => o.id),
    depleted: world.objects.filter((o) => o.type === 'node' && o.left <= 0).map((o) => o.id),
    telegraphs: world.telegraphs.map((t) => ({ id: t.id, tiles: t.tiles })),
    community: world.community,
    date: world.date,
    sig: CONTENT_SIG,
  };
}

// Ein Takt für einen Spieler. known: pro Verbindung, merkt sich bekannte IDs und den zuletzt
// geschickten Charakterstand (der nur bei Änderungen mitkommt).
// Flags pro Figur: 1 = besiegt, 2 = geblendet, 4 = festgesetzt.
export function tickFor(world, pid, known) {
  const p = world.players.get(pid);
  const ents = [];
  const spawn = [];
  const seen = new Set();
  for (const e of allEntities(world)) {
    seen.add(e.id);
    if (!known.has(e.id)) {
      known.add(e.id);
      spawn.push(metaOf(e));
    }
    const flags = (e.dead ? 1 : 0) | (e.scaredUntil > world.tick || e.dazzleUntil > world.tick ? 2 : 0) | (e.rootUntil > world.tick ? 4 : 0);
    ents.push([e.id, e.x, e.y, e.hp ?? 0, flags, e.maxHp ?? 0]);
  }
  const gone = [];
  for (const id of known) {
    if (!seen.has(id)) {
      known.delete(id);
      gone.push(id);
    }
  }
  const events = [];
  for (const e of world.events) {
    if (e.to && e.to !== pid) continue;
    const { to, ...rest } = e;
    events.push(rest);
  }
  let state;
  if (p) {
    const s = JSON.stringify(stateOf(p));
    if (s !== known.lastState) {
      known.lastState = s;
      state = JSON.parse(s);
    }
  }
  return {
    t: 'tick',
    tick: world.tick,
    ents,
    spawn,
    gone,
    events,
    state,
    me: p && {
      hp: p.hp, maxHp: p.maxHp, oil: Math.round(p.oil * 10) / 10, gold: p.gold,
      level: p.cls ? p.classes[p.cls].level : 1, xp: p.cls ? p.classes[p.cls].xp : 0, cls: p.cls,
      target: p.target, engaged: p.engaged, gcdUntil: p.gcdUntil, cds: p.cds, braceUntil: p.braceUntil, queued: p.queued,
      light: Math.round(lightBonusOf(p, world.tick) * 10) / 10, gathering: !!p.gather,
    },
  };
}
