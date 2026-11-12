// Alles am Spieler, was gespeichert wird: Klassen, Beutel, Ausrüstung, Gold, Berufe, Quests, Leisten.
// Reine Funktionen auf dem Spieler-Objekt. Der Spielstand (saveOf/loadInto) ist versioniert.

import { ITEMS, SLOTS, BAG_SIZE, UNARMED_DELAY } from '../content/items.js';
import { CLASSES, WANDERER, SPEC_LEVEL } from '../content/classes.js';
import { ABILITIES } from '../content/abilities.js';
import { PROFESSIONS, MAX_PROFESSIONS, PROF_MAX_LEVEL } from '../content/professions.js';
import { QUESTS } from '../content/quests.js';
import { INN } from '../content/tavern.js';
import { cleanStash } from './stash.js';

export const SAVE_VERSION = 2;
export const MAX_LEVEL = 99;
export const BAR_SIZE = 9;

// Erfahrungskurve (seit 2026-11-11 steiler, Chris' Wunsch): Die Stufe L kostet bis Stufe 50
// 40 * 1.1^(L-2) + 10 * (L-2) Erfahrung (Stufe 50: gut 54.000 insgesamt). Danach wächst sie langsamer
// (3 % pro Stufe), sonst wäre 99 unerreichbar: Stufe 99 braucht insgesamt gut 540.000. Gilt für Klassen und Berufe.
export function xpStep(level) {
  if (level <= 1) return 0;
  if (level <= 50) return Math.round(40 * Math.pow(1.1, level - 2) + 10 * (level - 2));
  return Math.round(xpStep(50) * Math.pow(1.03, level - 50));
}
const XP_TABLE = [0, 0];
for (let l = 2; l <= 100; l++) XP_TABLE[l] = XP_TABLE[l - 1] + xpStep(l);
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return XP_TABLE[Math.min(100, level)];
}
// Stufe, die zu einer Menge Erfahrung passt (beim Laden: die Stufe folgt immer der Erfahrung)
export function levelForXp(xp, max) {
  let l = 1;
  while (l < max && xp >= xpForLevel(l + 1)) l++;
  return l;
}

export const classDef = (p) => (p.cls ? CLASSES[p.cls] : WANDERER);
export const classLevel = (p) => (p.cls ? p.classes[p.cls]?.level ?? 1 : 1);
export const bestClassLevel = (p) => Math.max(0, ...Object.values(p.classes).map((c) => c.level));

export function maxHpOf(p) {
  const def = classDef(p);
  return def.hp + (classLevel(p) - 1) * def.hpPerLevel;
}

export function equipped(p, slot) {
  const id = p.equip[slot];
  return id ? ITEMS[id] : null;
}

// Takte zwischen zwei automatischen Angriffen (Tempo der Hauptwaffe).
export function swingDelay(p) {
  const w = p.equip?.main && ITEMS[p.equip.main];
  return w?.delay ?? UNARMED_DELAY;
}

export function weaponPower(p) {
  return equipped(p, 'main')?.power ?? 0;
}

export function defenceOf(p) {
  let d = 0;
  for (const slot of SLOTS) d += equipped(p, slot)?.defence ?? 0;
  return d;
}

// Reichweite der Laterne plus Licht aus anderer Ausrüstung (z. B. Choir Mantle, Smoke-Ruff Hood).
export function lanternBonus(p) {
  let extra = 0;
  for (const slot of SLOTS) if (slot !== 'lantern') extra += equipped(p, slot)?.light ?? 0;
  return (equipped(p, 'lantern')?.light ?? -1) + extra;
}

export function oilBurn(p) {
  return equipped(p, 'lantern')?.burn ?? 1;
}

// Fähigkeiten, die die aktive Klasse auf ihrer Stufe kann.
// Spezialisierung der aktiven Klasse (ab SPEC_LEVEL) oder null
export function specOf(p) {
  const id = p.cls && p.specs?.[p.cls];
  return id ? CLASSES[p.cls]?.specs?.[id] ?? null : null;
}

export function knownAbilities(p) {
  const lvl = classLevel(p);
  const all = [...classDef(p).abilities, ...(specOf(p)?.abilities ?? [])];
  return all.filter(([, need]) => need <= lvl).map(([id]) => id);
}

export function barKey(p) {
  return p.cls || 'wanderer';
}

// Leiste der aktiven Klasse. Neu gelernte Fähigkeiten rücken in das erste freie Feld.
export function barOf(p) {
  const key = barKey(p);
  let bar = p.bars[key];
  if (!Array.isArray(bar) || bar.length !== BAR_SIZE) {
    bar = Array(BAR_SIZE).fill(null);
    p.bars[key] = bar;
  }
  const known = knownAbilities(p);
  for (let i = 0; i < BAR_SIZE; i++) if (bar[i] && !known.includes(bar[i]) && !bar[i].startsWith('item:')) bar[i] = null;
  for (const id of known) {
    if (bar.includes(id)) continue;
    const free = bar.indexOf(null);
    if (free >= 0) bar[free] = id;
  }
  return bar;
}

// ---------- Beutel ----------

export function countItem(p, id) {
  let n = 0;
  for (const s of p.bag) if (s && s.id === id) n += s.n;
  return n;
}

// Legt Gegenstände in den Beutel. Gibt zurück, wie viele nicht mehr hineinpassten.
export function addItem(p, id, n = 1) {
  const def = ITEMS[id];
  if (!def || n <= 0) return n;
  if (def.stack) {
    const slot = p.bag.find((s) => s && s.id === id);
    if (slot) { slot.n += n; return 0; }
    const free = p.bag.findIndex((s) => !s);
    if (free >= 0) { p.bag[free] = { id, n }; return 0; }
    if (p.bag.length < BAG_SIZE) { p.bag.push({ id, n }); return 0; }
    return n;
  }
  let left = n;
  while (left > 0) {
    const free = p.bag.findIndex((s) => !s);
    if (free >= 0) p.bag[free] = { id, n: 1 };
    else if (p.bag.length < BAG_SIZE) p.bag.push({ id, n: 1 });
    else break;
    left--;
  }
  return left;
}

export function takeItem(p, id, n = 1) {
  if (countItem(p, id) < n) return false;
  let left = n;
  for (let i = 0; i < p.bag.length && left > 0; i++) {
    const s = p.bag[i];
    if (!s || s.id !== id) continue;
    const t = Math.min(left, s.n);
    s.n -= t;
    left -= t;
    if (s.n <= 0) p.bag[i] = null;
  }
  return true;
}

export function hasAll(p, items) {
  return Object.entries(items).every(([id, n]) => countItem(p, id) >= n);
}

export function bagFull(p) {
  return p.bag.filter(Boolean).length >= BAG_SIZE;
}

// ---------- Klassen ----------

export function unlockClass(p, cls) {
  if (!CLASSES[cls] || p.classes[cls]) return false;
  p.classes[cls] = { level: 1, xp: 0 };
  return true;
}

// Aussehen: Jede Klasse hat ein eigenes Sprite, ohne Klasse der Wanderer.
export function spriteOf(p) {
  return p.cls && CLASSES[p.cls] ? `player_${p.cls}` : 'player';
}

// Aktive Klasse wechseln (beim Anlegen einer Hauptwaffe). HP bleiben anteilig erhalten.
export function setClass(p, cls) {
  const frac = p.maxHp ? p.hp / p.maxHp : 1;
  p.cls = cls;
  p.sprite = spriteOf(p);
  p.maxHp = maxHpOf(p);
  p.hp = Math.max(1, Math.round(p.maxHp * frac));
  barOf(p);
}

// Erfahrung für die aktive Klasse. Gibt die neu erreichten Stufen zurück (leer, wenn keine).
export function gainClassXp(p, n) {
  const c = p.cls && p.classes[p.cls];
  if (!c || c.level >= MAX_LEVEL || n <= 0) return [];
  c.xp += n;
  const ups = [];
  while (c.level < MAX_LEVEL && c.xp >= xpForLevel(c.level + 1)) ups.push(++c.level);
  if (ups.length) {
    p.maxHp = maxHpOf(p);
    p.hp = p.maxHp;
    barOf(p);
  }
  return ups;
}

// ---------- Berufe ----------

export function canLearnProf(p, prof) {
  return PROFESSIONS[prof] && !p.profs[prof] && Object.keys(p.profs).length < MAX_PROFESSIONS;
}

export function profLevel(p, prof) {
  return p.profs[prof]?.level ?? 0;
}

// Gibt die neue Stufe zurück, wenn eine erreicht wurde, sonst 0.
export function gainProfXp(p, prof, n) {
  const pr = p.profs[prof];
  if (!pr || pr.level >= PROF_MAX_LEVEL) return 0;
  pr.xp += n;
  let up = 0;
  while (pr.level < PROF_MAX_LEVEL && pr.xp >= xpForLevel(pr.level + 1)) up = ++pr.level;
  return up;
}

// ---------- Spielstand ----------

function clampInt(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function cleanLevels(src, known, max) {
  const out = {};
  if (!src || typeof src !== 'object') return out;
  for (const [k, v] of Object.entries(src)) {
    if (!Object.hasOwn(known, k)) continue;
    // Die Stufe wird aus der Erfahrung berechnet, damit Spielstände zur aktuellen Kurve passen.
    const xp = clampInt(v?.xp, 0, 1e9, 0);
    out[k] = { level: levelForXp(xp, max), xp };
  }
  return out;
}

// Ältere Spielstände auf die aktuelle Version bringen. Fehlende Felder bekommen Standardwerte.
export function migrate(save) {
  if (!save || typeof save !== 'object') return null;
  if (!save.v || save.v === 1) {
    // Version 1 (Prototyp): eine namenlose Kampfstufe. Sie wird zur Warden-Stufe.
    return {
      v: 2, x: save.x, y: save.y, hp: save.hp, oil: save.oil, gold: 0,
      cls: 'warden', classes: { warden: { level: save.level ?? 1, xp: Math.max(Number(save.xp) || 0, xpForLevel(save.level ?? 1)) } },
      bag: [], equip: { main: 'scrap_shield', lantern: 'tin_lantern' }, profs: {},
      quests: { kindling: { done: true } }, bars: {},
    };
  }
  return save;
}

// Überträgt einen (geprüften) Spielstand auf einen frischen Spieler.
export function loadInto(p, raw) {
  const save = migrate(raw);
  if (!save) return;
  p.classes = cleanLevels(save.classes, CLASSES, MAX_LEVEL);
  p.cls = save.cls && p.classes[save.cls] ? save.cls : null;
  // Spezialisierungen: nur bekannte, nur für Klassen ab SPEC_LEVEL
  p.specs = {};
  for (const [cls, id] of Object.entries(save.specs || {})) {
    if (p.classes[cls]?.level >= SPEC_LEVEL && typeof id === 'string' && Object.hasOwn(CLASSES[cls]?.specs ?? {}, id)) p.specs[cls] = id;
  }
  p.profs = cleanLevels(save.profs, PROFESSIONS, PROF_MAX_LEVEL);
  while (Object.keys(p.profs).length > MAX_PROFESSIONS) delete p.profs[Object.keys(p.profs).pop()];
  p.gold = clampInt(save.gold, 0, 1e9, 0);
  p.oil = Math.min(100, Math.max(0, Number(save.oil ?? 100) || 0));
  p.bag = [];
  for (const s of Array.isArray(save.bag) ? save.bag.slice(0, BAG_SIZE) : []) {
    if (s && ITEMS[s.id]) addItem(p, s.id, clampInt(s.n, 1, 9999, 1));
  }
  p.equip = {};
  for (const slot of SLOTS) {
    const id = save.equip?.[slot];
    if (id && ITEMS[id]?.slot === slot) p.equip[slot] = id;
  }
  // Die Hauptwaffe muss zur aktiven Klasse passen.
  if (p.equip.main && ITEMS[p.equip.main].cls !== p.cls) {
    addItem(p, p.equip.main);
    delete p.equip.main;
  }
  p.quests = {};
  for (const [id, q] of Object.entries(save.quests || {})) {
    if (!QUESTS[id]) continue;
    if (q?.done) p.quests[id] = { done: true };
    else p.quests[id] = { step: clampInt(q?.step, 0, QUESTS[id].steps.length - 1, 0), n: clampInt(q?.n, 0, 999, 0) };
  }
  p.bars = {};
  for (const [k, bar] of Object.entries(save.bars || {})) {
    if (!(k === 'wanderer' || CLASSES[k]) || !Array.isArray(bar)) continue;
    p.bars[k] = Array.from({ length: BAR_SIZE }, (_, i) => {
      const v = bar[i];
      if (typeof v !== 'string') return null;
      if (Object.hasOwn(ABILITIES, v)) return v;
      if (v.startsWith('item:') && ITEMS[v.slice(5)]?.use) return v;
      return null;
    });
  }
  // Tagesstand (Gefallen, Spenden, Gebet). Gilt nur für das gespeicherte Datum.
  const d = save.daily;
  if (d && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
    p.daily = {
      date: d.date,
      kills: Object.fromEntries(Object.entries(d.kills || {}).filter(([k]) => typeof k === 'string' && k.length < 32).map(([k, v]) => [k, clampInt(v, 0, 999, 0)])),
      done: Array.isArray(d.done) ? d.done.filter((x) => typeof x === 'string' && x.length < 32).slice(0, 10) : [],
      voted: typeof d.voted === 'string' && /^[a-z0-9-]{1,32}$/.test(d.voted) ? d.voted : null,
      prayed: !!d.prayed,
      chests: Array.isArray(d.chests) ? d.chests.filter((x) => typeof x === 'string' && x.length < 48).slice(0, 50) : [],
    };
  }
  // Taverne: eigene Truhe und ausgeruht (Siege mit mehr Erfahrung). Alte Stände: leer bzw. 0.
  p.stash = cleanStash(save.stash);
  p.rested = clampInt(save.rested, 0, INN.rested, 0);
  // Unending Maze: tiefstes Stockwerk, zu dem man hinunter darf (alte Stände: 1)
  p.mazeDeep = clampInt(save.mazeDeep, 1, 99, 1);
  p.maxHp = maxHpOf(p);
  p.hp = clampInt(save.hp, 1, p.maxHp, p.maxHp);
  barOf(p);
}

export function saveOf(p) {
  return {
    v: SAVE_VERSION,
    x: p.x, y: p.y, hp: Math.max(1, p.hp), oil: Math.round(p.oil * 10) / 10, gold: p.gold,
    cls: p.cls, classes: p.classes, specs: p.specs ?? {}, bag: p.bag.filter(Boolean), equip: p.equip,
    profs: p.profs, quests: p.quests, bars: p.bars, daily: p.daily ?? null,
    stash: p.stash ?? [], rested: p.rested ?? 0, mazeDeep: p.mazeDeep ?? 1,
  };
}

// Was der Browser über den eigenen Charakter wissen muss (für Fenster und Leiste).
export function stateOf(p) {
  return {
    cls: p.cls, classes: p.classes, specs: p.specs ?? {}, bag: p.bag, equip: p.equip, gold: p.gold,
    profs: p.profs, quests: p.quests, bar: barOf(p), defence: defenceOf(p), power: weaponPower(p),
    daily: p.daily ?? null, stash: p.stash ?? [], rested: p.rested ?? 0, mazeDeep: p.mazeDeep ?? 1,
  };
}
