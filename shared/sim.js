// Die Welt eines Gebiets im Takt. Reine Logik ohne DOM und ohne Netzwerk: Sie läuft auf dem Server
// (Durable Object pro Gebiet) und für den Offline-Modus im Browser. Spieler schicken nur Absichten
// (walkTo, interact, useAbility, …). step() rechnet einen Takt und gibt Ereignisse zurück:
// Ereignisse mit `to` gehen nur an diesen Spieler, alle anderen an alle im Gebiet.

import { TILE_TYPES } from '../content/tiles.js';
import { MOBS } from '../content/mobs.js';
import { ABILITIES, GCD } from '../content/abilities.js';
import { EXAMINE } from '../content/npcs.js';
import { findPath, stepToward, cheb } from './path.js';

export const TICK_MS = 300;
const OIL_PER_TICK = 0.15;
const SWING_EVERY = 4;
const OIL_LIGHT_COST = 15;
export const MAX_LEVEL = 50;

export function lanternRadius(oil) {
  return oil > 0 ? 2.4 + 3.4 * (oil / 100) : 1.5;
}

export function xpForLevel(level) {
  return Math.round(20 * Math.pow(level - 1, 1.6));
}

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ---------- Aufbau ----------

// Objekte eines Gebiets mit ihren IDs (o0, o1, …). Auch der Browser nutzt das, damit IDs übereinstimmen.
export function regionObjects(region) {
  return region.objects.map((o, i) => ({
    ...o, id: 'o' + i, w: o.w || 1, d: o.d || 1, lit: o.type !== 'signal',
  }));
}

export function createWorld(region, seed = 1234) {
  const h = region.tiles.length;
  const w = region.tiles[0].length;
  const walk = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      walk[y * w + x] = TILE_TYPES[region.tiles[y][x]]?.walk ? 1 : 0;
    }
  }
  const objects = regionObjects(region);
  for (const o of objects) {
    for (let y = o.y; y < o.y + o.d; y++) for (let x = o.x; x < o.x + o.w; x++) walk[y * w + x] = 0;
  }
  const world = {
    w, h, walk, region, objects,
    tick: 0,
    rand: makeRng(seed),
    events: [],
    telegraphs: [],
    nextTelegraph: 1,
    lights: [],
    // Tageslicht 0 bis 1, setzt der Server (oder der Offline-Modus) nach der echten Uhrzeit.
    daylight: 0,
    npcs: [],
    mobs: [],
    players: new Map(),
  };
  refreshLights(world);

  world.npcs = region.npcs.map((n) => {
    const p = nearestWalkable(world, n.x, n.y);
    return { ...n, kind: 'npc', x: p.x, y: p.y, px: p.x, py: p.y, home: p };
  });
  world.mobs = region.mobs.map((m, i) => {
    const p = nearestWalkable(world, m.x, m.y);
    const def = MOBS[m.type];
    return {
      id: 'm' + i, kind: 'mob', type: m.type, def, name: def.name, sprite: def.sprite,
      x: p.x, y: p.y, px: p.x, py: p.y, home: p,
      hp: def.hp, maxHp: def.hp, nextAttack: 0, attacks: 0,
      scaredUntil: 0, deadUntil: 0, dead: false, angryAt: null, returning: false,
    };
  });
  return world;
}

// Neuer Spieler im Gebiet. save: gespeicherter Stand (siehe saveOf) oder null für einen Neuling.
export function addPlayer(world, id, name, save = null) {
  const r = world.region;
  const at = save && walkable(world, save.x, save.y) ? save : nearestWalkable(world, r.start.x, r.start.y);
  const level = clampInt(save?.level, 1, MAX_LEVEL, 1);
  const maxHp = 30 + (level - 1) * 3;
  const p = {
    id, kind: 'player', name, sprite: 'player',
    x: at.x, y: at.y, px: at.x, py: at.y,
    hp: clampInt(save?.hp, 1, maxHp, maxHp), maxHp,
    oil: Math.min(100, Math.max(0, Number(save?.oil ?? 100) || 0)),
    xp: clampInt(save?.xp, 0, 1e9, 0), level,
    path: [], goal: null, target: null, engaged: false,
    gcdUntil: 0, cds: {}, queued: null, braceUntil: 0, nextSwing: 0,
    warnedOil: 0,
  };
  world.players.set(id, p);
  return p;
}

export function removePlayer(world, id) {
  const p = world.players.get(id);
  if (!p) return null;
  world.players.delete(id);
  for (const m of world.mobs) if (m.angryAt === id) m.angryAt = null;
  world.telegraphs = world.telegraphs.filter((t) => t.victim !== id);
  return saveOf(p);
}

// Was vom Spieler gespeichert wird. Bei neuen Feldern hier ergänzen und in addPlayer prüfen.
export function saveOf(p) {
  return { v: 1, x: p.x, y: p.y, hp: Math.max(1, p.hp), oil: Math.round(p.oil * 10) / 10, xp: p.xp, level: p.level };
}

function clampInt(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

export function walkable(world, x, y) {
  return Number.isInteger(x) && Number.isInteger(y)
    && x >= 0 && y >= 0 && x < world.w && y < world.h && world.walk[y * world.w + x] === 1;
}

function nearestWalkable(world, x, y) {
  for (let r = 0; r < 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (walkable(world, x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  return { x, y };
}

function refreshLights(world) {
  world.lights = world.objects
    .filter((o) => o.light && o.lit)
    .map((o) => ({ id: o.id, x: o.x + o.w / 2, y: o.y + o.d / 2, r: o.light }));
}

// Licht an einem Feld von festen Lichtquellen (ohne Laternen), 0 bis 1.
export function staticLightAt(world, x, y) {
  let lit = 0;
  for (const l of world.lights) {
    const d = Math.hypot(x + 0.5 - l.x, y + 0.5 - l.y);
    lit = Math.max(lit, 1 - smoothstep(l.r * 0.35, l.r, d));
  }
  return lit;
}

export function objectActions(o) {
  switch (o.type) {
    case 'beacon': return [['refill', 'Fill lantern'], ['examine', 'Examine']];
    case 'signal': return o.lit ? [['examine', 'Examine']] : [['light', 'Light'], ['examine', 'Examine']];
    case 'campfire': return [['rest', 'Rest'], ['examine', 'Examine']];
    default: return [['examine', 'Examine']];
  }
}

export function findEntity(world, ref) {
  if (!ref) return null;
  if (ref.kind === 'npc') return world.npcs.find((n) => n.id === ref.id) || null;
  if (ref.kind === 'mob') return world.mobs.find((m) => m.id === ref.id) || null;
  if (ref.kind === 'object') return world.objects.find((o) => o.id === ref.id) || null;
  return null;
}

// ---------- Absichten der Spieler ----------

function tell(world, to, text, cls = '') {
  world.events.push({ to, type: 'log', text, cls });
}

export function walkTo(world, pid, x, y) {
  const p = world.players.get(pid);
  if (!p || !Number.isInteger(x) || !Number.isInteger(y)) return;
  p.goal = null;
  p.engaged = false;
  const path = findPath(world.w, world.h, (a, b) => walkable(world, a, b), p.x, p.y,
    (a, b) => (a === x && b === y) || (!walkable(world, x, y) && cheb(a, b, x, y) <= 1), x, y);
  p.path = path || [];
}

export function interact(world, pid, ref, action) {
  const p = world.players.get(pid);
  const target = findEntity(world, ref);
  if (!p || !target) return;
  if (action === 'examine') {
    const text = ref.kind === 'mob' ? target.def.examine
      : ref.kind === 'object' ? (target.type === 'signal' && target.lit ? EXAMINE.signalLit : EXAMINE[target.type])
        : `${target.name}.`;
    tell(world, pid, text || 'Nothing remarkable.', 'sys');
    return;
  }
  if (ref.kind === 'mob') {
    if (target.dead) return;
    p.target = target.id;
    p.engaged = true;
    p.goal = null;
    return;
  }
  p.engaged = false;
  p.goal = { ref, action };
  p.path = [];
}

export function setTarget(world, pid, id) {
  const p = world.players.get(pid);
  if (!p) return;
  p.target = id && world.mobs.some((m) => m.id === id && !m.dead) ? id : null;
  if (!p.target) p.engaged = false;
}

export function cycleTarget(world, pid) {
  const p = world.players.get(pid);
  if (!p) return;
  const near = world.mobs
    .filter((m) => !m.dead && cheb(m.x, m.y, p.x, p.y) <= 10)
    .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  if (!near.length) {
    p.target = null;
    return;
  }
  const i = near.findIndex((m) => m.id === p.target);
  p.target = near[(i + 1) % near.length].id;
}

export function useAbility(world, pid, abilityId) {
  const p = world.players.get(pid);
  if (!p || !Object.hasOwn(ABILITIES, abilityId)) return;
  p.queued = abilityId;
}

export function dialogAction(world, pid, npcId, action) {
  const p = world.players.get(pid);
  const npc = world.npcs.find((n) => n.id === npcId);
  if (!p || !npc || cheb(npc.x, npc.y, p.x, p.y) > 2) return;
  if (action === 'refill' && npcId === 'ama') {
    p.oil = 100;
    p.warnedOil = 0;
    tell(world, pid, 'Ama tops up your lantern without being asked twice.', 'good');
  }
}

// ---------- Takt ----------

// Ereignisse sammeln sich in world.events, auch zwischen zwei Takten (Betrachten, Dialog).
// Wer sie verschickt hat, leert die Liste mit drainEvents().
export function step(world) {
  world.tick++;
  for (const p of world.players.values()) { p.px = p.x; p.py = p.y; }
  for (const e of world.npcs) { e.px = e.x; e.py = e.y; }
  for (const e of world.mobs) { e.px = e.x; e.py = e.y; }

  for (const p of world.players.values()) updatePlayer(world, p);
  for (const m of world.mobs) updateMob(world, m);
  for (const n of world.npcs) updateNpc(world, n);
  resolveTelegraphs(world);
  return world.events;
}

export function drainEvents(world) {
  world.events = [];
}

function rectAdjacent(o, x, y) {
  const inside = x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.d;
  if (inside) return false;
  return x >= o.x - 1 && x <= o.x + o.w && y >= o.y - 1 && y <= o.y + o.d;
}

function goalReached(world, goal, x, y) {
  const t = findEntity(world, goal.ref);
  if (!t) return true;
  if (goal.ref.kind === 'object') return rectAdjacent(t, x, y);
  return cheb(t.x, t.y, x, y) <= 1 && !(t.x === x && t.y === y);
}

function pathFor(world, p, isGoal, hx, hy) {
  return findPath(world.w, world.h, (a, b) => walkable(world, a, b), p.x, p.y, isGoal, hx, hy) || [];
}

function updatePlayer(world, p) {
  const target = p.target ? world.mobs.find((m) => m.id === p.target) : null;
  if (p.target && (!target || target.dead)) {
    p.target = null;
    p.engaged = false;
  }

  // Ziel einer Interaktion: hinlaufen, dann handeln.
  if (p.goal) {
    if (goalReached(world, p.goal, p.x, p.y)) {
      doAction(world, p, p.goal);
      p.goal = null;
      p.path = [];
    } else {
      const t = findEntity(world, p.goal.ref);
      p.path = pathFor(world, p, (a, b) => goalReached(world, p.goal, a, b), t.x, t.y);
      if (!p.path.length) {
        tell(world, p.id, 'You cannot reach that.', 'sys');
        p.goal = null;
      }
    }
  }

  // Im Kampf: an das Ziel heran und automatisch zuschlagen.
  if (p.engaged && target) {
    const d = cheb(p.x, p.y, target.x, target.y);
    if (d <= 1) {
      p.path = [];
      if (world.tick >= p.nextSwing) {
        p.nextSwing = world.tick + SWING_EVERY;
        hitMob(world, p, target, roll(world, 1, 2) + Math.floor(p.level / 3));
      }
    } else {
      p.path = pathFor(world, p, (a, b) => cheb(a, b, target.x, target.y) <= 1 && !(a === target.x && b === target.y), target.x, target.y);
    }
  }

  if (p.path.length) {
    const next = p.path.shift();
    if (walkable(world, next.x, next.y)) {
      p.x = next.x;
      p.y = next.y;
    } else {
      p.path = [];
    }
  }

  // Fähigkeit aus der Warteschlange, sobald Abklingzeiten es zulassen.
  if (p.queued && world.tick >= p.gcdUntil && world.tick >= (p.cds[p.queued] || 0)) {
    const id = p.queued;
    p.queued = null;
    if (castAbility(world, p, id)) {
      p.gcdUntil = world.tick + GCD;
      p.cds[id] = world.tick + Math.max(ABILITIES[id].cd, GCD);
    }
  }

  // Öl brennt nur draußen und nur, wenn es dunkel ist. Das Leuchtfeuer wärmt das Dorf.
  const beacon = world.objects.find((o) => o.type === 'beacon');
  const fromBeacon = Math.hypot(p.x + 0.5 - (beacon.x + beacon.w / 2), p.y + 0.5 - (beacon.y + beacon.d / 2));
  if (fromBeacon > world.region.safeRadius && world.daylight < 0.5) {
    p.oil = Math.max(0, p.oil - OIL_PER_TICK);
    if (p.oil <= 25 && p.warnedOil < 1) {
      p.warnedOil = 1;
      tell(world, p.id, 'Your lantern gutters. Oil is running low.', 'hurt');
    }
    if (p.oil <= 0 && p.warnedOil < 2) {
      p.warnedOil = 2;
      tell(world, p.id, 'Your lantern goes out. The Grey leans in.', 'hurt');
    }
  }
}

function doAction(world, p, goal) {
  const t = findEntity(world, goal.ref);
  if (goal.ref.kind === 'npc') {
    world.events.push({ to: p.id, type: 'dialog', npc: t.id, page: 'start' });
    return;
  }
  if (goal.ref.kind !== 'object') return;
  if (goal.action === 'refill' && t.type === 'beacon') {
    p.oil = 100;
    p.warnedOil = 0;
    tell(world, p.id, 'You fill your lantern from the Beacon. It burns gold again.', 'good');
  } else if (goal.action === 'light' && t.type === 'signal' && !t.lit) {
    if (p.oil < OIL_LIGHT_COST) {
      tell(world, p.id, `You need ${OIL_LIGHT_COST} oil to light this.`, 'sys');
      return;
    }
    p.oil -= OIL_LIGHT_COST;
    t.lit = true;
    refreshLights(world);
    world.events.push({ type: 'lit', id: t.id });
    world.events.push({ type: 'log', text: `${p.name} lit a signal fire. The Grey takes a step back.`, cls: 'good' });
  } else if (goal.action === 'rest' && t.type === 'campfire') {
    p.hp = p.maxHp;
    tell(world, p.id, 'You warm your hands. Much better.', 'good');
  }
}

function roll(world, a, b) {
  return a + Math.floor(world.rand() * (b - a + 1));
}

function castAbility(world, p, id) {
  const a = ABILITIES[id];
  const target = p.target ? world.mobs.find((m) => m.id === p.target && !m.dead) : null;
  if (a.kind === 'melee') {
    if (!target) { tell(world, p.id, 'No target. Click a creature or press TAB.', 'sys'); return false; }
    if (cheb(p.x, p.y, target.x, target.y) > 1) { tell(world, p.id, 'Too far away.', 'sys'); p.engaged = true; return false; }
    hitMob(world, p, target, roll(world, a.hit[0], a.hit[1]) + Math.floor(p.level / 2));
    world.events.push({ type: 'cast', id, by: p.id });
    return true;
  }
  if (a.kind === 'burst') {
    if (p.oil < a.oil) { tell(world, p.id, 'Not enough oil to flare.', 'sys'); return false; }
    p.oil -= a.oil;
    world.events.push({ type: 'cast', id, by: p.id });
    tell(world, p.id, a.text);
    for (const m of world.mobs) {
      if (m.dead || Math.hypot(m.x - p.x, m.y - p.y) > a.radius) continue;
      m.scaredUntil = world.tick + a.scare;
      dropTelegraphs(world, (t) => t.mob === m.id);
      hitMob(world, p, m, roll(world, a.hit[0], a.hit[1]));
    }
    return true;
  }
  if (a.kind === 'self') {
    if (a.heal) {
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + a.heal);
      world.events.push({ type: 'float', ent: p.id, text: `+${p.hp - before}`, cls: 'heal' });
    }
    if (a.brace) p.braceUntil = world.tick + a.brace;
    world.events.push({ type: 'cast', id, by: p.id });
    tell(world, p.id, a.text);
    return true;
  }
  return false;
}

function dropTelegraphs(world, match) {
  world.telegraphs = world.telegraphs.filter((t) => {
    if (!match(t)) return true;
    world.events.push({ type: 'telegraphEnd', id: t.id });
    return false;
  });
}

function hitMob(world, p, m, dmg) {
  m.hp -= dmg;
  if (!m.angryAt) m.angryAt = p.id;
  world.events.push({ type: 'float', ent: m.id, text: String(dmg) });
  if (m.hp > 0) return;
  m.dead = true;
  m.hp = 0;
  m.angryAt = null;
  m.deadUntil = world.tick + m.def.respawn;
  dropTelegraphs(world, (t) => t.mob === m.id);
  world.events.push({ type: 'death', ent: m.id });
  tell(world, p.id, m.type === 'greyling' ? 'The Greyling comes apart into fog.' : `The ${m.name} gives up.`, 'good');
  gainXp(world, p, m.def.xp);
}

function gainXp(world, p, n) {
  if (p.level >= MAX_LEVEL) return;
  p.xp += n;
  world.events.push({ to: p.id, type: 'float', ent: p.id, text: `+${n} XP`, cls: 'info' });
  while (p.level < MAX_LEVEL && p.xp >= xpForLevel(p.level + 1)) {
    p.level++;
    p.maxHp += 3;
    p.hp = p.maxHp;
    tell(world, p.id, `Warden level ${p.level}. You feel steadier.`, 'good');
  }
}

function hurtPlayer(world, p, dmg, by) {
  if (world.tick < p.braceUntil) dmg = Math.ceil(dmg / 2);
  if (p.oil <= 0) dmg = Math.ceil(dmg * 1.5);
  p.hp -= dmg;
  world.events.push({ type: 'float', ent: p.id, text: String(dmg) });
  if (p.hp > 0) return;
  // Milde Niederlage: am Lagerfeuer aufwachen, alles behalten.
  const r = nearestWalkable(world, world.region.respawn.x, world.region.respawn.y);
  p.x = p.px = r.x;
  p.y = p.py = r.y;
  p.hp = p.maxHp;
  p.oil = Math.max(p.oil, 50);
  p.path = [];
  p.goal = null;
  p.target = null;
  p.engaged = false;
  dropTelegraphs(world, (t) => t.victim === p.id);
  for (const m of world.mobs) if (m.angryAt === p.id) m.angryAt = null;
  world.events.push({ to: p.id, type: 'respawn' });
  tell(world, p.id, `${by} got the better of you. You wake by the campfire. Someone has tucked you in.`, 'hurt');
}

// Greylinge suchen sich den nächsten Spieler im Dunkeln, Tiere nur den, der sie geärgert hat.
function pickVictim(world, m, aggro) {
  const isGreyling = m.def.ai !== 'animal';
  if (m.angryAt) {
    const p = world.players.get(m.angryAt);
    if (p && !(isGreyling && staticLightAt(world, p.x, p.y) >= 0.5)) return p;
    m.angryAt = null;
  }
  if (!isGreyling) return null;
  let best = null;
  let bestD = Infinity;
  for (const p of world.players.values()) {
    const d = cheb(m.x, m.y, p.x, p.y);
    if (d > aggro || d >= bestD) continue;
    if (staticLightAt(world, p.x, p.y) >= 0.5) continue;
    best = p;
    bestD = d;
  }
  return best;
}

function updateMob(world, m) {
  const def = m.def;
  if (m.dead) {
    if (world.tick >= m.deadUntil) {
      m.dead = false;
      m.hp = m.maxHp;
      m.x = m.px = m.home.x;
      m.y = m.py = m.home.y;
      m.angryAt = null;
      m.returning = false;
    }
    return;
  }
  const isGreyling = def.ai !== 'animal';
  const occupiedByPlayer = (x, y) => {
    for (const p of world.players.values()) if (p.x === x && p.y === y) return true;
    return false;
  };
  // Greylinge meiden helles Licht wie eine Wand.
  const canWalk = (x, y) => walkable(world, x, y) && !occupiedByPlayer(x, y)
    && (!isGreyling || staticLightAt(world, x, y) < 0.5);
  const move = (tx, ty, away = false) => {
    const s = stepToward(canWalk, m.x, m.y, tx, ty, away);
    if (s) { m.x = s.x; m.y = s.y; }
  };

  if (cheb(m.x, m.y, m.home.x, m.home.y) > def.leash) m.returning = true;
  if (m.returning) {
    m.angryAt = null;
    move(m.home.x, m.home.y);
    if (cheb(m.x, m.y, m.home.x, m.home.y) <= 1) {
      m.returning = false;
      m.hp = m.maxHp;
    }
    return;
  }
  if (world.tick < m.scaredUntil) {
    const scarer = [...world.players.values()].sort((a, b) => cheb(m.x, m.y, a.x, a.y) - cheb(m.x, m.y, b.x, b.y))[0];
    if (scarer) move(scarer.x, scarer.y, true);
    return;
  }

  // Tagsüber sind Greylinge weniger mutig.
  const aggro = def.aggro * (1 - 0.5 * world.daylight);
  const p = pickVictim(world, m, aggro);
  if (!p) {
    if (world.rand() < 0.12) move(m.home.x + roll(world, -3, 3), m.home.y + roll(world, -3, 3));
    return;
  }
  m.angryAt = p.id;
  if (cheb(m.x, m.y, p.x, p.y) > 1) {
    move(p.x, p.y);
    return;
  }
  if (world.tick < m.nextAttack) return;
  m.attacks++;
  const lunge = def.lunge;
  if (lunge && m.attacks % lunge.every === 0) {
    const tiles = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
      .filter((t) => walkable(world, t.x, t.y));
    const t = { id: world.nextTelegraph++, mob: m.id, victim: p.id, tiles, at: world.tick + lunge.delay, hit: lunge.hit };
    world.telegraphs.push(t);
    world.events.push({ type: 'telegraph', t: { id: t.id, tiles } });
    tell(world, p.id, lunge.text, 'hurt');
    m.nextAttack = world.tick + lunge.delay + def.attackEvery;
    return;
  }
  m.nextAttack = world.tick + def.attackEvery;
  hurtPlayer(world, p, roll(world, def.hit[0], def.hit[1]), `A ${def.name}`);
}

function updateNpc(world, n) {
  if (!n.wander || world.rand() > 0.06) return;
  const tx = n.home.x + roll(world, -n.wander, n.wander);
  const ty = n.home.y + roll(world, -n.wander, n.wander);
  const free = (x, y) => {
    if (!walkable(world, x, y)) return false;
    for (const p of world.players.values()) if (p.x === x && p.y === y) return false;
    return true;
  };
  const s = stepToward(free, n.x, n.y, tx, ty);
  if (s) { n.x = s.x; n.y = s.y; }
}

// Angekündigte Angriffe treffen jeden Spieler, der beim Einschlag auf einem markierten Feld steht.
function resolveTelegraphs(world) {
  const due = world.telegraphs.filter((t) => t.at <= world.tick);
  if (!due.length) return;
  world.telegraphs = world.telegraphs.filter((t) => t.at > world.tick);
  for (const t of due) {
    world.events.push({ type: 'telegraphEnd', id: t.id });
    const m = world.mobs.find((x) => x.id === t.mob);
    if (!m || m.dead || world.tick < m.scaredUntil) continue;
    let hitAny = false;
    for (const p of world.players.values()) {
      if (!t.tiles.some((tile) => tile.x === p.x && tile.y === p.y)) continue;
      hitAny = true;
      tell(world, p.id, 'The Greyling lunges and catches you!', 'hurt');
      hurtPlayer(world, p, roll(world, t.hit[0], t.hit[1]), 'A Greyling');
    }
    if (!hitAny && world.players.has(t.victim)) tell(world, t.victim, 'You step aside. The Greyling lunges at nothing.', 'good');
  }
}
