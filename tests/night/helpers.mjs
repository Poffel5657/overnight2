// Helfer für die Nachttests: spielen wie ein Spieler über applyIntent (Muster aus tests/unit/sim.test.mjs).
import assert from 'node:assert/strict';
import { TALK } from '../../content/npcs.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';

export function run(world, n, onTick) {
  for (let i = 0; i < n; i++) {
    S.step(world);
    onTick?.(world.events);
    S.drainEvents(world);
  }
}

// Läuft, bis cond() stimmt (oder n Takte vorbei sind). Gibt alle Ereignisse zurück.
export function runUntil(world, cond, n = 600) {
  const seen = [];
  for (let i = 0; i < n && !cond(); i++) run(world, 1, (ev) => seen.push(...ev));
  return seen;
}

export function talk(w, pid, npc) {
  applyIntent(w, pid, { t: 'bye' });
  applyIntent(w, pid, { t: 'act', kind: 'npc', id: npc, action: 'talk' });
  for (let i = 0; i < 400 && w.players.get(pid).dialog?.npc !== npc; i++) run(w, 1);
  assert.equal(w.players.get(pid).dialog?.npc, npc, `Gespräch mit ${npc} beginnt`);
}

export function options(w, pid) {
  const d = w.players.get(pid).dialog;
  return d ? d.options.map((k) => TALK[d.npc][d.page].options[k].text) : [];
}

export function choose(w, pid, fragment) {
  const p = w.players.get(pid);
  const d = p.dialog;
  assert.ok(d, 'Gespräch offen');
  const i = d.options.find((k) => TALK[d.npc][d.page].options[k].text.includes(fragment));
  assert.notEqual(i, undefined, `Antwort "${fragment}" auf ${d.npc}/${d.page} (da: ${options(w, pid).join(' | ')})`);
  applyIntent(w, pid, { t: 'say', i });
}

// Ein Spieler mit Spielstand (so, als käme er mit diesem Stand zurück).
export function veteran(w, pid, { cls = 'warden', level = 1, gold = 0, quests = { kindling: { done: true } }, equip = {}, profs = {}, bag = [] } = {}) {
  const save = {
    v: 2, x: w.region.start.x, y: w.region.start.y, hp: 9999, oil: 100, gold, cls,
    classes: { [cls]: { level, xp: P.xpForLevel(level) } },
    bag, equip: { lantern: 'tin_lantern', ...equip }, profs, quests, bars: {},
  };
  return S.addPlayer(w, pid, pid, save);
}

// Bis zum Objekt laufen und dort handeln.
export function actOn(w, pid, obj, action) {
  applyIntent(w, pid, { t: 'act', kind: 'object', id: obj.id, action });
  for (let i = 0; i < 400 && w.players.get(pid).goal; i++) run(w, 1);
}

export function fight(w, pid, mob, abilities = [], ticks = 600) {
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < ticks && !mob.dead; i++) {
    if (abilities.length) applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    run(w, 1);
  }
}
