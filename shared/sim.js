// Die Welt eines Gebiets im Takt. Reine Logik ohne DOM und ohne Netzwerk: Sie läuft auf dem Server
// (Durable Object pro Gebiet) und für den Offline-Modus im Browser. Spieler schicken nur Absichten
// (walkTo, interact, useAbility, …). step() rechnet einen Takt; Ereignisse sammeln sich in world.events
// (mit `to` nur für diesen Spieler) und werden nach dem Versenden mit drainEvents() geleert.
// Spielerdaten: shared/player.js. Gespräche und Quests: shared/talk.js. Gegenstände: shared/trade.js.

import { TILE_TYPES } from '../content/tiles.js';
import { MOBS } from '../content/mobs.js';
import { ABILITIES, GCD } from '../content/abilities.js';
import { EXAMINE } from '../content/npcs.js';
import { NODES } from '../content/nodes.js';
import { ITEMS, UNARMED_DELAY } from '../content/items.js';
import { findPath, stepToward, cheb } from './path.js';
import { tell, emit, float } from './events.js';
import * as P from './player.js';
import { openTalk, closeTalk, questEvent, grantXp, checkHave, conditionHolds, TALK_RANGE } from './talk.js';
import { CHESTS } from '../content/chests.js';
import { startGather, tickGather, tickNodes, consume, inVillage } from './trade.js';
import { onKill, dailyOf } from './community.js';
import { berlinDate } from './daylight.js';
import { tickTrade, cancelTrade } from './barter.js';
import { partyHere, tickParty } from './party.js';
import { tickRace, refundBet } from './races.js';
import { INN } from '../content/tavern.js';

export { saveOf, xpForLevel, MAX_LEVEL } from './player.js';

export const TICK_MS = 300;
const OIL_PER_TICK = 0.15;
// Vorgemerkte Handlungen verfallen nach so vielen Takten (z. B. wenn man das Ziel nie erreicht).
const QUEUE_TTL = 12;
const OIL_LIGHT_COST = { signal: 15, brazier: 10 };
const SHARE_RANGE = 12;

// Reichweite der Laterne in Feldern. bonus: aus der Laterne (content/items.js) und Leuchttränken.
export function lanternRadius(oil, bonus = 0) {
  return Math.max(1.2, (oil > 0 ? 2.4 + 3.4 * (oil / 100) : 1.5) + bonus);
}

export function lightBonusOf(p, tick) {
  return P.lanternBonus(p) + (p.glowUntil > tick ? 1.5 : 0);
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
  return region.objects.map((o, i) => {
    const obj = { ...o, id: 'o' + i, w: o.w || 1, d: o.d || 1, lit: o.type !== 'signal' };
    if (o.type === 'node') {
      obj.name = NODES[o.node].name;
      obj.left = NODES[o.node].yields;
      obj.respawnAt = 0;
    }
    return obj;
  });
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
    // Berliner Datum (setzt der Server jeden Takt), Gemeinschaftsstand und was gespeichert werden muss.
    date: berlinDate(new Date()),
    community: { beacon: 0, ballot: {} },
    outbox: [],
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
      scaredUntil: 0, dazzleUntil: 0, rootUntil: 0, deadUntil: 0, dead: false,
      angryAt: null, tauntUntil: 0, returning: false, hitters: new Set(),
    };
  });
  return world;
}

// Neuer Spieler im Gebiet. save: gespeicherter Stand (saveOf) oder null für einen Neuling.
export function addPlayer(world, id, name, save = null) {
  const r = world.region;
  const p = {
    id, kind: 'player', name, sprite: 'player',
    x: 0, y: 0, px: 0, py: 0,
    hp: 30, maxHp: 30, oil: 100, gold: 0,
    cls: null, classes: {}, specs: {}, bag: [], equip: {}, profs: {}, quests: {}, bars: {},
    path: [], goal: null, target: null, engaged: false,
    gcdUntil: 0, swingAt: 0, cds: {}, queued: null, queuedUntil: 0, braceUntil: 0,
    glowUntil: 0, fadeUntil: 0, hots: [], dialog: null, gather: null,
    warnedOil: 0,
  };
  if (save) P.loadInto(p, save);
  else P.barOf(p);
  p.sprite = P.spriteOf(p);
  const at = save && walkable(world, save.x, save.y) ? save : nearestWalkable(world, r.start.x, r.start.y);
  p.x = p.px = at.x;
  p.y = p.py = at.y;
  world.players.set(id, p);
  return p;
}

// Spielstand eines Spielers im Gebiet (auf Reisen schon mit dem Ziel).
export function saveFor(world, id) {
  const p = world.players.get(id);
  if (!p) return null;
  const save = P.saveOf(p);
  save.region = p.travel?.region ?? world.region.id;
  if (p.travel) { save.x = p.travel.x; save.y = p.travel.y; }
  return save;
}

export function removePlayer(world, id) {
  const p = world.players.get(id);
  if (!p) return null;
  // Eine offene Wette beim Schneckenrennen geht zurück, wer geht, verliert nichts.
  refundBet(world, p);
  const save = saveFor(world, id);
  if (p.trade) cancelTrade(world, p, `${p.name} has left. The trade is off.`);
  world.players.delete(id);
  for (const m of world.mobs) {
    if (m.angryAt === id) m.angryAt = null;
    m.hitters.delete(id);
  }
  world.telegraphs = world.telegraphs.filter((t) => t.victim !== id);
  return save;
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

// Bosse mit snuff löschen alle Lichter im Gebiet; besiegt oder zurückgesetzt brennen sie wieder.
function setAllLights(world, lit) {
  for (const o of world.objects) {
    if (!o.light || o.type === 'signal' || o.lit === lit) continue;
    o.lit = lit;
    emit(world, { type: 'lit', id: o.id, lit });
  }
  refreshLights(world);
}

function resetBoss(world, m) {
  if (!m.def.boss) return;
  if (m.phase2 && m.def.boss.snuff) setAllLights(world, true);
  m.phase2 = false;
  m.fightSince = 0;
  m.enraged = false;
}

// Wut eines Bosses: Wie stark trifft er gerade? (1 = normal)
function bossMult(world, m) {
  const e = m.def.boss?.enrage;
  if (!e || !m.fightSince) return 1;
  if (world.tick - m.fightSince < e.after) return 1;
  if (!m.enraged) {
    m.enraged = true;
    emit(world, { type: 'log', text: e.text, cls: 'hurt' });
  }
  return e.mult;
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
  // Gebäude mit Innenraum (content/regions/kindle-inside.js)
  if (o.inside) return [['enter', 'Enter'], ['examine', 'Examine']];
  switch (o.type) {
    case 'beacon': return [['refill', 'Fill lantern'], ['feed', 'Feed'], ['examine', 'Examine']];
    case 'board': return [['read', 'Read'], ['examine', 'Examine']];
    case 'door': return [['enter', o.look === 'stairs' ? 'Climb' : 'Enter'], ['examine', 'Examine']];
    case 'chest': return [['open', 'Open'], ['examine', 'Examine']];
    case 'shrine': return [['search', 'Search'], ['examine', 'Examine']];
    case 'find': return [['search', 'Look closer'], ['examine', 'Examine']];
    case 'altar': return [['pray', 'Pray at'], ['examine', 'Examine']];
    case 'signal':
    case 'brazier': return o.lit ? [['examine', 'Examine']] : [['light', 'Light'], ['examine', 'Examine']];
    case 'campfire': return [['rest', 'Rest'], ['examine', 'Examine']];
    case 'stash': return [['open', 'Open'], ['examine', 'Examine']];
    case 'inn_bed': return [['rest', `Sleep (${INN.price} gold)`], ['examine', 'Examine']];
    case 'station': return [['use', 'Use'], ['examine', 'Examine']];
    case 'node': return [['gather', NODES[o.node].verb], ['examine', 'Examine']];
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

export function walkTo(world, pid, x, y) {
  const p = world.players.get(pid);
  if (!p || !Number.isInteger(x) || !Number.isInteger(y)) return;
  p.goal = null;
  p.engaged = false;
  p.gather = null;
  const path = findPath(world.w, world.h, (a, b) => walkable(world, a, b), p.x, p.y,
    (a, b) => (a === x && b === y) || (!walkable(world, x, y) && cheb(a, b, x, y) <= 1), x, y);
  p.path = path || [];
}

export function interact(world, pid, ref, action) {
  const p = world.players.get(pid);
  const target = findEntity(world, ref);
  if (!p || !target) return;
  if (action === 'examine') {
    let text;
    if (ref.kind === 'mob') text = target.def.examine;
    else if (ref.kind === 'npc') text = `${target.name}.`;
    else if (target.type === 'signal' && target.lit) text = EXAMINE.signalLit;
    else if (target.type === 'node') text = target.left > 0 ? `${NODES[target.node].name}. ${EXAMINE.node}` : EXAMINE.depleted;
    else if (target.type === 'station') text = EXAMINE[target.station];
    else if (target.type === 'find') text = `${target.name[0].toUpperCase()}${target.name.slice(1)}. Something about it is worth a closer look.`;
    else text = target.text || EXAMINE[target.type];
    tell(world, pid, text || 'Nothing remarkable.', 'sys');
    return;
  }
  if (ref.kind === 'mob') {
    if (target.dead) return;
    p.target = target.id;
    p.engaged = true;
    p.goal = null;
    p.gather = null;
    return;
  }
  p.engaged = false;
  p.gather = null;
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

// Fähigkeit oder Gegenstand von der Leiste ('item:bread') vormerken. Sie wird ausgeführt, sobald die
// globale Abklingzeit vorbei ist; es gibt immer nur eine Handlung pro globaler Abklingzeit.
export function useAbility(world, pid, id) {
  const p = world.players.get(pid);
  if (!p || typeof id !== 'string') return;
  if (id.startsWith('item:')) {
    const item = id.slice(5);
    if (!ITEMS[item]?.use) return;
    if (P.countItem(p, item) < 1) return tell(world, p.id, `You have no ${ITEMS[item].name}.`, 'sys');
    queue(p, world, id);
    return;
  }
  if (!Object.hasOwn(ABILITIES, id) || !P.knownAbilities(p).includes(id)) return;
  const ready = p.cds[id] || 0;
  if (ready > world.tick + GCD) {
    tell(world, p.id, `${ABILITIES[id].name} is not ready yet (${Math.ceil(((ready - world.tick) * TICK_MS) / 1000)}s).`, 'sys');
    return;
  }
  queue(p, world, id);
}

export function queue(p, world, id) {
  p.queued = id;
  p.queuedUntil = world.tick + QUEUE_TTL;
}

// Leiste belegen: Fähigkeit der aktiven Klasse, benutzbarer Gegenstand oder leer.
export function setBar(world, pid, slot, id) {
  const p = world.players.get(pid);
  if (!p || !Number.isInteger(slot) || slot < 0 || slot >= P.BAR_SIZE) return;
  const bar = P.barOf(p);
  if (id === null) { bar[slot] = null; return; }
  const ok = id.startsWith('item:') ? !!ITEMS[id.slice(5)]?.use : P.knownAbilities(p).includes(id);
  if (!ok) return;
  const was = bar.indexOf(id);
  if (was >= 0) bar[was] = bar[slot];
  bar[slot] = id;
}

// ---------- Takt ----------

export function step(world) {
  world.tick++;
  for (const p of world.players.values()) { p.px = p.x; p.py = p.y; }
  for (const e of world.npcs) { e.px = e.x; e.py = e.y; }
  for (const e of world.mobs) { e.px = e.x; e.py = e.y; }

  for (const p of world.players.values()) updatePlayer(world, p);
  for (const m of world.mobs) updateMob(world, m);
  for (const n of world.npcs) updateNpc(world, n);
  resolveTelegraphs(world);
  tickNodes(world);
  tickRace(world);
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

  // An das Ziel heran: im Kampf oder wenn eine vorgemerkte Fähigkeit es braucht.
  // Fernkämpfer (Flarecaster) bleiben auf Abstand.
  const qa = p.queued && !p.queued.startsWith('item:') ? ABILITIES[p.queued] : null;
  const qaNeedsTarget = qa && NEEDS_TARGET.has(qa.kind);
  let inReach = false;
  if (target && (p.engaged || qaNeedsTarget)) {
    const reach = qaNeedsTarget ? (qa.kind === 'melee' ? 1 : qa.range) : (p.cls === 'flarecaster' ? 4 : 1);
    inReach = cheb(p.x, p.y, target.x, target.y) <= reach;
    if (inReach) p.path = [];
    else p.path = pathFor(world, p, (a, b) => cheb(a, b, target.x, target.y) <= reach && !(a === target.x && b === target.y), target.x, target.y);
  }

  if (p.travel) return;
  if (p.path.length) {
    const next = p.path.shift();
    if (walkable(world, next.x, next.y)) {
      p.x = next.x;
      p.y = next.y;
      if (p.dialog) {
        const n = world.npcs.find((x) => x.id === p.dialog.npc);
        if (!n || cheb(n.x, n.y, p.x, p.y) > TALK_RANGE) closeTalk(world, p);
      }
    } else {
      p.path = [];
    }
  }

  // Automatischer Angriff im Takt der Waffe, unabhängig von der globalen Abklingzeit.
  // Langsame Waffen treffen seltener, dafür härter (Schaden skaliert mit dem Tempo).
  if (p.engaged && target && inReach && world.tick >= p.swingAt) {
    const delay = P.swingDelay(p);
    p.swingAt = world.tick + delay;
    emit(world, { type: 'cast', id: 'swing', by: p.id, at: target.id });
    const base = roll(world, 1, 3) + Math.ceil(P.weaponPower(p) / 2) + Math.floor(P.classLevel(p) / 3);
    hitMob(world, p, target, Math.max(1, Math.round((base * delay) / UNARMED_DELAY)));
  }

  // Fähigkeiten und Gegenstände: eine pro globaler Abklingzeit. Starke Fähigkeiten haben
  // zusätzlich eine eigene Abklingzeit (cd), die erst ablaufen muss.
  if (p.queued && world.tick > p.queuedUntil) p.queued = null;
  if (world.tick >= p.gcdUntil) {
    if (p.queued?.startsWith('item:')) {
      const id = p.queued;
      p.queued = null;
      if (consume(world, p, id.slice(5))) p.gcdUntil = world.tick + GCD;
    } else if (p.queued && world.tick >= (p.cds[p.queued] || 0)) {
      const id = p.queued;
      const r = castAbility(world, p, id);
      // 'far': Ziel noch nicht in Reichweite, vorgemerkt lassen und hinlaufen.
      if (r !== 'far') p.queued = null;
      if (r === true) {
        p.gcdUntil = world.tick + GCD;
        p.cds[id] = world.tick + Math.max(ABILITIES[id].cd, GCD);
      }
    }
  }

  // Heilung über Zeit
  if (p.hots.length && world.tick % 2 === 0) {
    for (const h of p.hots) {
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + h.heal);
      if (p.hp > before) float(world, p.id, `+${p.hp - before}`, 'heal');
      h.left -= 2;
    }
    p.hots = p.hots.filter((h) => h.left > 0);
  }

  tickGather(world, p);
  tickTrade(world, p);
  tickParty(world, p);
  // have-Schritte von Quests: egal, wie die Dinge in den Beutel kamen.
  checkHave(world, p);

  // Öl brennt nur draußen und nur, wenn es dunkel ist. Das Leuchtfeuer wärmt das Dorf.
  if (!inVillage(world, p) && world.daylight < 0.5) {
    p.oil = Math.max(0, p.oil - OIL_PER_TICK * P.oilBurn(p));
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
    openTalk(world, p, t.id);
    return;
  }
  if (goal.ref.kind !== 'object') return;
  if (goal.action === 'refill' && t.type === 'beacon') {
    p.oil = 100;
    p.warnedOil = 0;
    tell(world, p.id, 'You fill your lantern from the Beacon. It burns gold again.', 'good');
    questEvent(world, p, 'action', { action: 'refill' });
  } else if (goal.action === 'light' && (t.type === 'signal' || t.type === 'brazier') && !t.lit) {
    const cost = OIL_LIGHT_COST[t.type];
    if (p.oil < cost) {
      tell(world, p.id, `You need ${cost} oil to light this.`, 'sys');
      return;
    }
    p.oil -= cost;
    t.lit = true;
    refreshLights(world);
    emit(world, { type: 'lit', id: t.id, lit: true });
    emit(world, { type: 'log', text: t.type === 'signal' ? `${p.name} lit a signal fire. The Grey takes a step back.` : `${p.name} relights a brazier.`, cls: 'good' });
    if (t.type === 'signal') questEvent(world, p, 'action', { action: 'light' });
  } else if (goal.action === 'light' && t.type === 'signal' && t.lit) {
    // Schon an: zählt trotzdem für Quests, damit niemand auf ein dunkles Feuer warten muss.
    tell(world, p.id, 'This one is already burning. You warm your hands and feel useful.', 'sys');
    questEvent(world, p, 'action', { action: 'light' });
  } else if (goal.action === 'open' && t.type === 'stash') {
    emit(world, { to: p.id, type: 'window', win: 'stash' });
  } else if (goal.action === 'rest' && t.type === 'inn_bed') {
    sleepAtInn(world, p);
  } else if (goal.action === 'rest' && t.type === 'campfire') {
    p.hp = p.maxHp;
    tell(world, p.id, 'You warm your hands. Much better.', 'good');
    questEvent(world, p, 'action', { action: 'rest' });
  } else if (goal.action === 'gather' && t.type === 'node') {
    startGather(world, p, t);
  } else if (goal.action === 'use' && t.type === 'station') {
    emit(world, { to: p.id, type: 'craft', obj: t.id, station: t.station });
  } else if (goal.action === 'enter' && t.inside) {
    travel(world, p, { region: t.inside.region, x: t.inside.x, y: t.inside.y });
  } else if (goal.action === 'enter' && t.type === 'door') {
    if (t.needs && !conditionHolds(p, t.needs, world)) {
      tell(world, p.id, t.locked || 'The way is shut.', 'sys');
      return;
    }
    travel(world, p, { region: t.to, x: t.tx, y: t.ty });
  } else if (goal.action === 'open' && t.type === 'chest') {
    openChest(world, p, t);
  } else if (goal.action === 'search' && t.type === 'find') {
    const d = dailyOf(world, p);
    d.chests = d.chests || [];
    tell(world, p.id, t.text, 'sys');
    if (!d.chests.includes(`find:${world.date}`)) {
      d.chests.push(`find:${world.date}`);
      tell(world, p.id, 'You will remember this. Pell would want to hear about it.', 'good');
      grantXp(world, p, 80 + 10 * P.classLevel(p));
    }
  } else if (goal.action === 'search' && t.type === 'shrine') {
    const st = p.quests[t.quest];
    if (st && !st.done && st.step === t.step && P.countItem(p, t.gives) === 0) {
      P.addItem(p, t.gives, 1);
      tell(world, p.id, `Under the old candles you find ${ITEMS[t.gives].name}.`, 'good');
    } else {
      tell(world, p.id, t.empty || 'Old candles, cold wax, and the feeling of being listened to.', 'sys');
    }
  } else if (goal.action === 'read' && t.type === 'board') {
    dailyOf(world, p);
    emit(world, { to: p.id, type: 'window', win: 'board' });
  } else if (goal.action === 'feed' && t.type === 'beacon') {
    emit(world, { to: p.id, type: 'window', win: 'beacon' });
  } else if (goal.action === 'pray' && t.type === 'altar') {
    dailyOf(world, p);
    emit(world, { to: p.id, type: 'window', win: 'altar' });
  }
}

// In ein anderes Gebiet wechseln. Der Server speichert, trennt und verbindet den Spieler neu.
export function travel(world, p, to) {
  p.travel = to;
  p.path = [];
  p.goal = null;
  p.target = null;
  p.engaged = false;
  closeTalk(world, p);
  emit(world, { to: p.id, type: 'travel', region: to.region });
}

// „The Lamplighter“ heißt schon so; alle anderen bekommen den Artikel.
function theName(name) { return name.startsWith('The ') ? name : `The ${name}`; }
function aName(name) { return name.startsWith('The ') ? name : `A ${name}`; }

function roll(world, a, b) {
  return a + Math.floor(world.rand() * (b - a + 1));
}

function abilityDamage(world, p, a) {
  return roll(world, a.hit[0], a.hit[1]) + (a.power ? P.weaponPower(p) : 0) + Math.floor(P.classLevel(p) / 2);
}

function alliesNear(world, p, radius) {
  return [...world.players.values()].filter((q) => Math.hypot(q.x - p.x, q.y - p.y) <= radius);
}

const NEEDS_TARGET = new Set(['melee', 'ranged', 'snare', 'zone']);

function castAbility(world, p, id) {
  const a = ABILITIES[id];
  const target = p.target ? world.mobs.find((m) => m.id === p.target && !m.dead) : null;
  if (a.oil && p.oil < a.oil) { tell(world, p.id, 'Not enough oil.', 'sys'); return false; }
  const needsTarget = NEEDS_TARGET.has(a.kind);
  if (needsTarget && !target) { tell(world, p.id, 'No target. Click a creature or press TAB.', 'sys'); return false; }
  const range = a.kind === 'melee' ? 1 : a.range;
  if (needsTarget && cheb(p.x, p.y, target.x, target.y) > range) return 'far';
  if (a.oil) p.oil -= a.oil;
  emit(world, { type: 'cast', id, by: p.id, at: target?.id ?? null });
  if (a.text) tell(world, p.id, a.text);

  switch (a.kind) {
    case 'melee':
    case 'ranged':
      if (a.dazzle) target.dazzleUntil = world.tick + a.dazzle;
      hitMob(world, p, target, abilityDamage(world, p, a));
      break;
    case 'zone':
      for (const m of world.mobs) {
        if (!m.dead && Math.hypot(m.x - target.x, m.y - target.y) <= a.radius) hitMob(world, p, m, abilityDamage(world, p, a));
      }
      break;
    case 'burst':
      for (const m of world.mobs) {
        if (m.dead || Math.hypot(m.x - p.x, m.y - p.y) > a.radius) continue;
        if (a.scare) {
          m.scaredUntil = world.tick + a.scare;
          dropTelegraphs(world, (t) => t.mob === m.id);
        }
        // Geblendet: kann kurz nicht angreifen, angekündigte Angriffe verpuffen.
        if (a.dazzle) m.dazzleUntil = world.tick + a.dazzle;
        // hold: Wer getroffen wird, hält sich an den Werfer (wie Taunt), gut für Beschützer.
        if (a.hold) {
          m.angryAt = p.id;
          m.tauntUntil = world.tick + 12;
        }
        hitMob(world, p, m, abilityDamage(world, p, a));
      }
      break;
    case 'self':
      if (a.heal) healPlayer(world, p, a.heal);
      if (a.brace) p.braceUntil = world.tick + a.brace;
      break;
    case 'aura': {
      const bonus = P.equipped(p, 'main')?.heal ?? 0;
      for (const q of alliesNear(world, p, a.radius)) {
        if (a.heal) healPlayer(world, q, a.heal + bonus);
        if (a.brace) q.braceUntil = Math.max(q.braceUntil, world.tick + a.brace);
      }
      break;
    }
    case 'hot': {
      const bonus = Math.ceil((P.equipped(p, 'main')?.heal ?? 0) / 2);
      for (const q of alliesNear(world, p, a.radius)) q.hots.push({ heal: a.heal + bonus, left: a.ticks });
      break;
    }
    case 'taunt':
      for (const m of world.mobs) {
        if (m.dead || Math.hypot(m.x - p.x, m.y - p.y) > a.radius) continue;
        m.angryAt = p.id;
        m.tauntUntil = world.tick + 12;
        m.hitters.add(p.id);
      }
      break;
    case 'dash': {
      const from = target || { x: p.x, y: p.y + 1 };
      for (let i = 0; i < a.dist; i++) {
        const s = stepToward((x, y) => walkable(world, x, y), p.x, p.y, from.x, from.y, true);
        if (s) { p.x = s.x; p.y = s.y; }
      }
      p.path = [];
      p.engaged = false;
      break;
    }
    case 'snare':
      target.rootUntil = world.tick + a.root;
      target.hitters.add(p.id);
      break;
    case 'fade':
      p.fadeUntil = world.tick + a.ticks;
      for (const m of world.mobs) if (m.angryAt === p.id && m.tauntUntil <= world.tick) m.angryAt = null;
      p.engaged = false;
      break;
    default:
      return false;
  }
  return true;
}

function healPlayer(world, q, n) {
  const before = q.hp;
  q.hp = Math.min(q.maxHp, q.hp + n);
  if (q.hp > before) float(world, q.id, `+${q.hp - before}`, 'heal');
}

function dropTelegraphs(world, match) {
  world.telegraphs = world.telegraphs.filter((t) => {
    if (!match(t)) return true;
    emit(world, { type: 'telegraphEnd', id: t.id });
    return false;
  });
}

function hitMob(world, p, m, dmg) {
  const boss = m.def.boss;
  // Im Dunkeln ist ein Boss in Phase 2 verhüllt: weniger Schaden, bis man ihn ins Licht lockt.
  if (boss?.shroud && m.phase2 && staticLightAt(world, m.x, m.y) < 0.4) {
    dmg = Math.max(1, Math.round(dmg * boss.shroud));
    if ((m.shroudTold || 0) < world.tick) {
      m.shroudTold = world.tick + 15;
      tell(world, p.id, `${m.name} is shrouded in the dark. Relight the braziers and draw him into the light.`, 'hurt');
    }
  }
  m.hp -= dmg;
  if (boss && !m.phase2 && m.hp > 0 && m.hp <= m.maxHp * boss.phase2At) {
    m.phase2 = true;
    emit(world, { type: 'log', text: boss.phase2Text, cls: 'hurt' });
    if (boss.snuff) setAllLights(world, false);
  }
  m.hitters.add(p.id);
  if (!m.angryAt) m.angryAt = p.id;
  float(world, m.id, String(dmg));
  if (m.hp > 0) return;
  m.dead = true;
  m.hp = 0;
  m.angryAt = null;
  m.deadUntil = world.tick + m.def.respawn;
  dropTelegraphs(world, (t) => t.mob === m.id);
  emit(world, { type: 'death', ent: m.id });
  if (boss) {
    resetBoss(world, m);
    emit(world, { type: 'log', text: boss.deathText, cls: 'good' });
  }
  // Alle, die mitgekämpft haben, und ihre Gruppe in der Nähe bekommen Erfahrung und Quest-Fortschritt
  // (so zählt es auch für Heiler und Beschützer, die selbst nicht zuschlagen).
  const credit = new Set();
  for (const pid of m.hitters) {
    const q = world.players.get(pid);
    if (!q) continue;
    credit.add(q);
    for (const r of partyHere(world, q)) credit.add(r);
  }
  for (const q of credit) {
    if (cheb(q.x, q.y, m.x, m.y) > SHARE_RANGE) continue;
    tell(world, q.id, m.type === 'greyling' ? 'The Greyling comes apart into fog.' : `${theName(m.name)} falls.`, 'good');
    grantXp(world, q, m.def.xp, { kill: true });
    questEvent(world, q, 'kill', { mob: m.type });
    onKill(world, q, m.type);
  }
  m.hitters.clear();
  loot(world, p, m);
}

// Taverne: eine Nacht im Bett. Kostet Gold, füllt Leben und Öl, danach ausgeruht.
function sleepAtInn(world, p) {
  if (p.gold < INN.price) return tell(world, p.id, `A bed is ${INN.price} gold. Hollis is kind, but not that kind.`, 'sys');
  p.gold -= INN.price;
  p.hp = p.maxHp;
  p.oil = 100;
  p.warnedOil = 0;
  p.rested = INN.rested;
  tell(world, p.id, `You sleep like a log. The band plays you out of a dream. Rested: the next ${INN.rested} victories give ${Math.round(INN.bonus * 100)}% more experience.`, 'good');
  questEvent(world, p, 'action', { action: 'sleep' });
}

// Truhen: einmal am Tag pro Spieler.
function openChest(world, p, t) {
  const d = dailyOf(world, p);
  d.chests = d.chests || [];
  const key = `${world.region.id}:${t.id}`;
  if (d.chests.includes(key)) return tell(world, p.id, 'You already emptied this one today.', 'sys');
  d.chests.push(key);
  const c = CHESTS[t.chest];
  const g = roll(world, c.gold[0], c.gold[1]);
  p.gold += g;
  tell(world, p.id, `The chest creaks open. +${g} gold.`, 'good');
  for (const [id, chance, a, b] of c.items) {
    if (world.rand() >= chance) continue;
    const n = roll(world, a, b);
    if (P.addItem(p, id, n) < n) tell(world, p.id, `Inside: ${ITEMS[id].name}${n > 1 ? ` x${n}` : ''}.`, 'good');
  }
}

// Beute geht an den, der den letzten Schlag gesetzt hat.
function loot(world, p, m) {
  const def = m.def;
  if (def.gold) {
    const g = roll(world, def.gold[0], def.gold[1]);
    if (g > 0) {
      p.gold += g;
      float(world, p.id, `+${g} gold`, 'info', p.id);
    }
  }
  for (const [id, chance, a, b] of def.drops || []) {
    if (world.rand() >= chance) continue;
    const n = roll(world, a, b);
    const lost = P.addItem(p, id, n);
    if (lost < n) tell(world, p.id, `Loot: ${ITEMS[id].name}${n - lost > 1 ? ` x${n - lost}` : ''}.`, 'good');
    if (lost) tell(world, p.id, 'Your bag is full.', 'hurt');
  }
  // have-Schritte prüfen (z. B. grey wisps für Wrens Prüfung)
  checkHave(world, p);
}

function hurtPlayer(world, p, dmg, by) {
  // Rüstung fängt höchstens die Hälfte eines Schlags ab.
  dmg = Math.max(Math.ceil(dmg / 2), dmg - P.defenceOf(p));
  if (world.tick < p.braceUntil) dmg = Math.ceil(dmg / 2);
  if (p.oil <= 0) dmg = Math.ceil(dmg * 1.5);
  p.hp -= dmg;
  float(world, p.id, String(dmg));
  p.gather = null;
  if (p.hp > 0) return;
  // Milde Niederlage: am Lagerfeuer aufwachen, alles behalten.
  // Aufwachen am Lagerfeuer des Gebiets; ohne eigenes Lagerfeuer geht es weiter unten nach Kindle.
  if (world.region.respawn) {
    const r = nearestWalkable(world, world.region.respawn.x, world.region.respawn.y);
    p.x = p.px = r.x;
    p.y = p.py = r.y;
  }
  p.hp = p.maxHp;
  p.oil = Math.max(p.oil, 50);
  p.path = [];
  p.goal = null;
  p.target = null;
  p.engaged = false;
  p.hots = [];
  closeTalk(world, p);
  dropTelegraphs(world, (t) => t.victim === p.id);
  for (const m of world.mobs) {
    if (m.angryAt === p.id) m.angryAt = null;
    m.hitters.delete(p.id);
  }
  tell(world, p.id, `${by} got the better of you. You wake by the campfire. Someone has tucked you in.`, 'hurt');
  // In fremden Gebieten wacht man in Kindle auf.
  if (world.region.deathTo) travel(world, p, world.region.deathTo);
  else emit(world, { to: p.id, type: 'respawn' });
}

// Im Lichtkreis des Leuchtfeuers (Dorf)? Bestien kommen nicht hinein.
function villageAt(world, x, y) {
  if (world.region.sheltered) return true;
  const b = world.objects.find((o) => o.type === 'beacon');
  return !!b && Math.hypot(x + 0.5 - (b.x + b.w / 2), y + 0.5 - (b.y + b.d / 2)) <= world.region.safeRadius;
}

// Wer ist für dieses Wesen gerade erreichbar? Grau-Wesen meiden helles Licht, Bestien das Dorf,
// Tiere wehren sich nur. Wer verblasst ist (Fade), wird übersehen, solange er nicht im Licht steht.
function safeFrom(world, m, p) {
  if (m.def.ai === 'grey') return staticLightAt(world, p.x, p.y) >= 0.5;
  if (m.def.ai === 'beast') return villageAt(world, p.x, p.y);
  return false;
}

function pickVictim(world, m, aggro) {
  const hidden = (p) => p.fadeUntil > world.tick && staticLightAt(world, p.x, p.y) < 0.3;
  if (m.angryAt) {
    const p = world.players.get(m.angryAt);
    const forced = m.tauntUntil > world.tick;
    if (p && (forced || (!hidden(p) && !safeFrom(world, m, p)))) return p;
    m.angryAt = null;
  }
  if (m.def.ai === 'animal') return null;
  let best = null;
  let bestD = Infinity;
  for (const p of world.players.values()) {
    const d = cheb(m.x, m.y, p.x, p.y);
    if (d > aggro || d >= bestD || hidden(p) || safeFrom(world, m, p)) continue;
    best = p;
    bestD = d;
  }
  return best;
}

// Felder eines angekündigten Angriffs.
function specialTiles(world, m, p, pattern) {
  let raw;
  if (pattern === 'ring') {
    raw = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) raw.push({ x: m.x + dx, y: m.y + dy });
  } else if (pattern === 'line') {
    const sx = Math.sign(p.x - m.x), sy = Math.sign(p.y - m.y);
    raw = [1, 2, 3].map((k) => ({ x: m.x + sx * k, y: m.y + sy * k }));
  } else if (pattern === 'bigplus') {
    raw = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }));
  } else {
    raw = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }));
  }
  return raw.filter((t) => walkable(world, t.x, t.y));
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
      m.hitters.clear();
      m.phase2 = false;
    }
    return;
  }
  const occupiedByPlayer = (x, y) => {
    for (const p of world.players.values()) if (p.x === x && p.y === y) return true;
    return false;
  };
  // Grau-Wesen meiden helles Licht wie eine Wand, Bestien das Dorf.
  const canWalk = (x, y) => walkable(world, x, y) && !occupiedByPlayer(x, y)
    && !(def.ai === 'grey' && staticLightAt(world, x, y) >= 0.5)
    && !(def.ai === 'beast' && villageAt(world, x, y));
  // Langsame Wesen gehen nur jeden n-ten Takt, ortsfeste nie.
  const every = def.moveEvery ?? 1;
  const rooted = world.tick < m.rootUntil || every === 0 || world.tick % every !== 0;
  const move = (tx, ty, away = false) => {
    if (rooted) return;
    const s = stepToward(canWalk, m.x, m.y, tx, ty, away);
    if (s) { m.x = s.x; m.y = s.y; }
  };

  if (cheb(m.x, m.y, m.home.x, m.home.y) > def.leash && m.tauntUntil <= world.tick) m.returning = true;
  if (m.returning) {
    m.angryAt = null;
    m.hitters.clear();
    resetBoss(world, m);
    move(m.home.x, m.home.y);
    if (cheb(m.x, m.y, m.home.x, m.home.y) <= 1 || rooted) {
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
  // Ein Boss ohne Gegner heilt sich und zündet die Lichter wieder an.
  if (!p && def.boss && m.hp < m.maxHp) {
    m.hp = m.maxHp;
    resetBoss(world, m);
  }
  if (!p) {
    if (world.rand() < 0.12) move(m.home.x + roll(world, -3, 3), m.home.y + roll(world, -3, 3));
    return;
  }
  m.angryAt = p.id;
  if (def.boss && !m.fightSince) m.fightSince = world.tick;
  if (cheb(m.x, m.y, p.x, p.y) > 1) {
    move(p.x, p.y);
    return;
  }
  if (world.tick < m.nextAttack || world.tick < m.dazzleUntil) return;
  const mult = bossMult(world, m);
  m.attacks++;
  const specs = def.specials || (def.special ? [def.special] : []);
  const spEvery = def.specialEvery ?? def.special?.every ?? 0;
  const sp = spEvery && m.attacks % spEvery === 0 ? specs[(m.attacks / spEvery - 1) % specs.length] : null;
  if (sp) {
    const tiles = specialTiles(world, m, p, sp.pattern);
    const t = { id: world.nextTelegraph++, mob: m.id, victim: p.id, tiles, at: world.tick + sp.delay, hit: sp.hit.map((h) => Math.round(h * mult)), name: def.name };
    world.telegraphs.push(t);
    emit(world, { type: 'telegraph', t: { id: t.id, tiles, ms: sp.delay * TICK_MS } });
    tell(world, p.id, sp.text, 'hurt');
    m.nextAttack = world.tick + sp.delay + def.attackEvery;
    return;
  }
  m.nextAttack = world.tick + def.attackEvery;
  if (def.drainOil && p.oil > 0) {
    p.oil = Math.max(0, p.oil - def.drainOil);
    tell(world, p.id, `${theName(def.name)} drinks from your lantern. (-${def.drainOil} oil)`, 'hurt');
  }
  hurtPlayer(world, p, Math.round(roll(world, def.hit[0], def.hit[1]) * mult), aName(def.name));
}

function updateNpc(world, n) {
  if (!n.wander || world.rand() > 0.06) return;
  // Wer gerade mit jemandem redet, bleibt stehen.
  for (const p of world.players.values()) if (p.dialog?.npc === n.id) return;
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
    emit(world, { type: 'telegraphEnd', id: t.id });
    const m = world.mobs.find((x) => x.id === t.mob);
    if (!m || m.dead || world.tick < m.scaredUntil || world.tick < m.dazzleUntil) continue;
    let hitAny = false;
    for (const p of world.players.values()) {
      if (!t.tiles.some((tile) => tile.x === p.x && tile.y === p.y)) continue;
      hitAny = true;
      tell(world, p.id, `${theName(t.name)} strikes where you stand!`, 'hurt');
      hurtPlayer(world, p, roll(world, t.hit[0], t.hit[1]), aName(t.name));
    }
    if (!hitAny && world.players.has(t.victim)) tell(world, t.victim, `You step aside. ${theName(t.name)} strikes at nothing.`, 'good');
  }
}
