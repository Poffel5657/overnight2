// Nachrichten zwischen Browser und Gebiets-Server. Der Server prüft jede Absicht hier,
// bevor sie die Simulation erreicht: feste Typen, ganze Zahlen, kurze IDs, kein Freitext.

import { walkTo, interact, useAbility, setTarget, cycleTarget, dialogAction } from './sim.js';

const ID = /^[a-z0-9_]{1,24}$/;
const ACTIONS = new Set(['attack', 'talk', 'examine', 'refill', 'light', 'rest']);
const KINDS = new Set(['npc', 'mob', 'object']);
const MAX_COORD = 1024;
const coord = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_COORD;

// Gibt eine bereinigte Absicht zurück oder null.
export function parseIntent(raw) {
  if (typeof raw !== 'string' || raw.length > 512) return null;
  let m;
  try { m = JSON.parse(raw); } catch { return null; }
  if (!m || typeof m !== 'object') return null;
  switch (m.t) {
    case 'hello': return typeof m.token === 'string' && m.token.length <= 128 ? { t: 'hello', token: m.token } : null;
    case 'walk': return coord(m.x) && coord(m.y) ? { t: 'walk', x: m.x, y: m.y } : null;
    case 'act': return KINDS.has(m.kind) && ID.test(String(m.id)) && ACTIONS.has(m.action) ? { t: 'act', kind: m.kind, id: m.id, action: m.action } : null;
    case 'ability': return ID.test(String(m.id)) ? { t: 'ability', id: m.id } : null;
    case 'target': return m.id === null || ID.test(String(m.id)) ? { t: 'target', id: m.id } : null;
    case 'cycle': return { t: 'cycle' };
    case 'dialog': return ID.test(String(m.npc)) && ID.test(String(m.action)) ? { t: 'dialog', npc: m.npc, action: m.action } : null;
    case 'ping': return { t: 'ping' };
    default: return null;
  }
}

export function applyIntent(world, pid, m) {
  switch (m.t) {
    case 'walk': walkTo(world, pid, m.x, m.y); break;
    case 'act': interact(world, pid, { kind: m.kind, id: m.id }, m.action); break;
    case 'ability': useAbility(world, pid, m.id); break;
    case 'target': setTarget(world, pid, m.id); break;
    case 'cycle': cycleTarget(world, pid); break;
    case 'dialog': dialogAction(world, pid, m.npc, m.action); break;
    default: break;
  }
}

function metaOf(e) {
  return { id: e.id, kind: e.kind, sprite: e.sprite, name: e.name, maxHp: e.maxHp ?? 0, type: e.type ?? null };
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
    tick: world.tick,
    lit: world.objects.filter((o) => o.lit).map((o) => o.id),
    telegraphs: world.telegraphs.map((t) => ({ id: t.id, tiles: t.tiles })),
  };
}

// Ein Takt für einen Spieler. known: Set der IDs, die dieser Browser schon kennt (wird hier gepflegt).
// Flags pro Wesen: 1 = besiegt, 2 = geblendet.
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
    const flags = (e.dead ? 1 : 0) | (e.scaredUntil > world.tick ? 2 : 0);
    ents.push([e.id, e.x, e.y, e.hp ?? 0, flags]);
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
  return {
    t: 'tick',
    tick: world.tick,
    ents,
    spawn,
    gone,
    events,
    me: p && {
      hp: p.hp, maxHp: p.maxHp, oil: Math.round(p.oil * 10) / 10, xp: p.xp, level: p.level,
      target: p.target, engaged: p.engaged, gcdUntil: p.gcdUntil, cds: p.cds, braceUntil: p.braceUntil,
    },
  };
}
