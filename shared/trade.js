// Dinge tun mit Gegenständen: sammeln, herstellen, kaufen, verkaufen, benutzen, anlegen.

import { ITEMS } from '../content/items.js';
import { NODES } from '../content/nodes.js';
import { RECIPES } from '../content/recipes.js';
import { PROFESSIONS } from '../content/professions.js';
import { SHOPS } from '../content/shops.js';
import { CLASSES } from '../content/classes.js';
import { cheb } from './path.js';
import { tell, emit, float } from './events.js';
import { questEvent, checkHave, TALK_RANGE } from './talk.js';
import * as P from './player.js';

const GATHER_EVERY = 4;
export const MAX_CRAFT = 10;

// Steht der Spieler im Dorf (Lichtkreis des Leuchtfeuers)? Nur dort wechselt man die Klasse.
export function inVillage(world, p) {
  const b = world.objects.find((o) => o.type === 'beacon');
  if (!b) return false;
  return Math.hypot(p.x + 0.5 - (b.x + b.w / 2), p.y + 0.5 - (b.y + b.d / 2)) <= world.region.safeRadius;
}

function nextTo(o, p) {
  return p.x >= o.x - 1 && p.x <= o.x + o.w && p.y >= o.y - 1 && p.y <= o.y + o.d
    && !(p.x >= o.x && p.x < o.x + o.w && p.y >= o.y && p.y < o.y + o.d);
}

// ---------- Sammeln ----------

export function startGather(world, p, o) {
  const def = NODES[o.node];
  const prof = PROFESSIONS[def.prof];
  if (!p.profs[def.prof]) {
    tell(world, p.id, `You do not know ${prof.name.toLowerCase()}. Ask around in Kindle who teaches it.`, 'sys');
    return;
  }
  if (P.profLevel(p, def.prof) < def.level) {
    tell(world, p.id, `You need ${prof.name} level ${def.level} for this.`, 'sys');
    return;
  }
  if (o.left <= 0) {
    tell(world, p.id, 'Picked clean. Come back later.', 'sys');
    return;
  }
  p.gather = { obj: o.id, next: world.tick + GATHER_EVERY };
  tell(world, p.id, `You start to ${def.verb.toLowerCase()} the ${def.name.toLowerCase()}.`, 'sys');
}

// Läuft jeden Takt. Abbruch, sobald der Spieler sich bewegt, kämpft oder die Stelle leer ist.
export function tickGather(world, p) {
  const g = p.gather;
  if (!g) return;
  const o = world.objects.find((x) => x.id === g.obj);
  if (!o || o.left <= 0 || p.path.length || p.engaged || !nextTo(o, p)) {
    p.gather = null;
    return;
  }
  if (world.tick < g.next) return;
  g.next = world.tick + GATHER_EVERY;
  const def = NODES[o.node];
  const lvl = P.profLevel(p, def.prof);
  if (world.rand() > Math.min(0.95, 0.55 + 0.05 * (lvl - def.level))) return;
  if (P.bagFull(p) && !(ITEMS[def.item].stack && P.countItem(p, def.item))) {
    tell(world, p.id, 'Your bag is full.', 'hurt');
    p.gather = null;
    return;
  }
  P.addItem(p, def.item, 1);
  float(world, p.id, `+1 ${ITEMS[def.item].name}`, 'info', p.id);
  if (def.extra && world.rand() < def.extra[1] && !P.addItem(p, def.extra[0], 1)) {
    tell(world, p.id, `Something glints: ${ITEMS[def.extra[0]].name}!`, 'good');
  }
  const up = P.gainProfXp(p, def.prof, def.xp);
  if (up) tell(world, p.id, `${PROFESSIONS[def.prof].name} level ${up}.`, 'good');
  questEvent(world, p, 'action', { action: 'gather' });
  checkHave(world, p);
  o.left--;
  if (o.left <= 0) {
    o.respawnAt = world.tick + def.respawn;
    emit(world, { type: 'node', id: o.id, left: 0 });
    p.gather = null;
  }
}

// Erschöpfte Fundstellen wachsen nach (für alle gemeinsam).
export function tickNodes(world) {
  for (const o of world.objects) {
    if (o.type !== 'node' || o.left > 0 || world.tick < o.respawnAt) continue;
    o.left = NODES[o.node].yields;
    emit(world, { type: 'node', id: o.id, left: o.left });
  }
}

// ---------- Herstellen ----------

export function recipesFor(station) {
  return Object.entries(RECIPES).filter(([, r]) => PROFESSIONS[r.prof].station === station).map(([id]) => id);
}

export function craft(world, p, objId, recipeId, n = 1) {
  const o = world.objects.find((x) => x.id === objId);
  const r = RECIPES[recipeId];
  if (!o || o.type !== 'station' || !r || PROFESSIONS[r.prof].station !== o.station || !nextTo(o, p)) return;
  const prof = PROFESSIONS[r.prof];
  if (!p.profs[r.prof]) return tell(world, p.id, `You do not know ${prof.name.toLowerCase()}.`, 'sys');
  if (P.profLevel(p, r.prof) < r.level) return tell(world, p.id, `You need ${prof.name} level ${r.level}.`, 'sys');
  const times = Math.max(1, Math.min(MAX_CRAFT, n | 0));
  let made = 0;
  for (let i = 0; i < times; i++) {
    if (!P.hasAll(p, r.inputs)) break;
    for (const [id, k] of Object.entries(r.inputs)) P.takeItem(p, id, k);
    const lost = P.addItem(p, r.out[0], r.out[1]);
    if (lost) {
      // Kein Platz: Zutaten zurück, aufhören.
      for (const [id, k] of Object.entries(r.inputs)) P.addItem(p, id, k);
      P.takeItem(p, r.out[0], r.out[1] - lost);
      tell(world, p.id, 'Your bag is full.', 'hurt');
      break;
    }
    made++;
    const up = P.gainProfXp(p, r.prof, r.xp);
    if (up) tell(world, p.id, `${prof.name} level ${up}.`, 'good');
  }
  if (!made) return tell(world, p.id, 'You are missing something for that.', 'sys');
  const item = ITEMS[r.out[0]];
  tell(world, p.id, `You make ${item.name}${made * r.out[1] > 1 ? ` x${made * r.out[1]}` : ''}.`, 'good');
  questEvent(world, p, 'action', { action: 'craft' });
  checkHave(world, p);
}

// ---------- Händler ----------

function nearShop(world, p, shopId) {
  const shop = SHOPS[shopId];
  const npc = shop && world.npcs.find((x) => x.id === shop.npc);
  return npc && cheb(npc.x, npc.y, p.x, p.y) <= TALK_RANGE ? shop : null;
}

export function buy(world, p, shopId, itemId, n = 1) {
  const shop = nearShop(world, p, shopId);
  if (!shop || !shop.sells.includes(itemId)) return;
  const def = ITEMS[itemId];
  const k = Math.max(1, Math.min(20, n | 0));
  const cost = def.value * k;
  if (p.gold < cost) return tell(world, p.id, `That costs ${cost} gold. You have ${p.gold}.`, 'sys');
  const lost = P.addItem(p, itemId, k);
  const got = k - lost;
  if (!got) return tell(world, p.id, 'Your bag is full.', 'hurt');
  p.gold -= def.value * got;
  tell(world, p.id, `You buy ${def.name}${got > 1 ? ` x${got}` : ''} for ${def.value * got} gold.`, 'good');
  checkHave(world, p);
}

export function sellPrice(id) {
  return Math.max(1, Math.floor((ITEMS[id]?.value ?? 0) / 2));
}

export function sell(world, p, shopId, slot, n = 1) {
  if (!nearShop(world, p, shopId)) return;
  const s = p.bag[slot];
  if (!s || !ITEMS[s.id]?.value) return;
  const k = Math.max(1, Math.min(s.n, n | 0));
  const price = sellPrice(s.id) * k;
  const name = ITEMS[s.id].name;
  P.takeItem(p, s.id, k);
  p.gold += price;
  tell(world, p.id, `You sell ${name}${k > 1 ? ` x${k}` : ''} for ${price} gold.`, 'good');
}

// ---------- Beutel: benutzen und anlegen ----------

// Klick auf einen Beutelplatz: Ausrüstung anlegen, Verbrauchbares benutzen.
export function useSlot(world, p, slot) {
  const s = p.bag[slot];
  if (!s) return;
  const def = ITEMS[s.id];
  if (def.slot) return equipFromBag(world, p, slot);
  if (def.use) return consume(world, p, s.id);
}

export function consume(world, p, id) {
  const def = ITEMS[id];
  if (!def?.use || P.countItem(p, id) < 1) return false;
  if (world.tick < p.gcdUntil) return false;
  P.takeItem(p, id, 1);
  p.gcdUntil = world.tick + 3;
  if (def.use.heal) {
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + def.use.heal);
    float(world, p.id, `+${p.hp - before}`, 'heal');
  }
  if (def.use.oil) {
    p.oil = Math.min(100, p.oil + def.use.oil);
    p.warnedOil = 0;
  }
  if (def.use.glow) p.glowUntil = world.tick + def.use.glow;
  tell(world, p.id, `You use ${def.name}.`, 'sys');
  return true;
}

function equipFromBag(world, p, slot) {
  const s = p.bag[slot];
  const def = ITEMS[s.id];
  if (def.slot === 'main') {
    if (!p.classes[def.cls]) {
      const teacher = world.npcs.find((n) => n.id === CLASSES[def.cls].teacher)?.name ?? 'someone in Kindle';
      return tell(world, p.id, `You do not know how to hold this yet. ${CLASSES[def.cls].name}s learn from ${teacher}.`, 'sys');
    }
    if (def.cls !== p.cls) {
      if (!inVillage(world, p)) return tell(world, p.id, 'Changing your calling takes calm. Do it in Kindle, by the Beacon.', 'sys');
      if (world.mobs.some((m) => m.angryAt === p.id)) return tell(world, p.id, 'Not while something is chasing you.', 'sys');
    }
  }
  const old = p.equip[def.slot];
  p.bag[slot] = null;
  p.equip[def.slot] = s.id;
  if (old) P.addItem(p, old, 1);
  if (def.slot === 'main' && def.cls !== p.cls) {
    P.setClass(p, def.cls);
    p.target = null;
    p.engaged = false;
    tell(world, p.id, `You take up the ${CLASSES[def.cls].name}'s calling (level ${P.classLevel(p)}).`, 'good');
  } else {
    tell(world, p.id, `You put on ${def.name}.`, 'sys');
  }
}

export function unequip(world, p, slot) {
  const id = p.equip[slot];
  if (!id) return;
  if (slot === 'main') return tell(world, p.id, 'Better keep something in your hand. Hold another weapon to switch.', 'sys');
  if (P.bagFull(p)) return tell(world, p.id, 'Your bag is full.', 'hurt');
  delete p.equip[slot];
  P.addItem(p, id, 1);
}

export function dropSlot(world, p, slot) {
  const s = p.bag[slot];
  if (!s) return;
  p.bag[slot] = null;
  tell(world, p.id, `You leave ${ITEMS[s.id].name}${s.n > 1 ? ` x${s.n}` : ''} for the Grey.`, 'sys');
}
