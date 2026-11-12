// Gespräche und Quests auf dem Server. Der Browser zeigt nur Text aus content/npcs.js und schickt,
// welche Antwort (Nummer) gewählt wurde. Bedingungen und Wirkungen prüft und führt nur der Server aus.

import { TALK } from '../content/npcs.js';
import { QUESTS } from '../content/quests.js';
import { CLASSES, SPEC_LEVEL } from '../content/classes.js';
import { ITEMS } from '../content/items.js';
import { PROFESSIONS, MAX_PROFESSIONS } from '../content/professions.js';
import { cheb } from './path.js';
import { tell, emit } from './events.js';
import * as P from './player.js';
import { placeBet } from './races.js';
import { INN } from '../content/tavern.js';
import { shopStock } from '../content/shops.js';

export const TALK_RANGE = 2;

// 'none', 'done' oder die Nummer des laufenden Schritts.
export function questState(p, id) {
  const q = p.quests[id];
  if (!q) return 'none';
  return q.done ? 'done' : q.step;
}

function questMatches(p, want) {
  for (const [id, expect] of Object.entries(want)) {
    const st = questState(p, id);
    if (expect === 'active' ? typeof st !== 'number' : st !== expect) return false;
  }
  return true;
}

// world ist optional: Der Browser prüft ohne Welt (für ! und ?), dann zählen night/day nicht.
export function conditionHolds(p, cond = {}, world = null) {
  if (cond.quest && !questMatches(p, cond.quest)) return false;
  if (cond.noClass && p.cls) return false;
  if (cond.hasClass && !p.cls) return false;
  if (cond.classLevel && P.bestClassLevel(p) < cond.classLevel) return false;
  if (cond.below && P.bestClassLevel(p) >= cond.below) return false;
  if (cond.unlocked && !p.classes[cond.unlocked]) return false;
  if (cond.locked && p.classes[cond.locked]) return false;
  if (cond.prof && !p.profs[cond.prof]) return false;
  if (cond.noProf && p.profs[cond.noProf]) return false;
  if (cond.profSlot && Object.keys(p.profs).length >= MAX_PROFESSIONS) return false;
  if (cond.has && !P.hasAll(p, cond.has)) return false;
  if (cond.gold && (p.gold ?? 0) < cond.gold) return false;
  // Tageszeit: night = nach Einbruch der Dunkelheit (wie bei Quest-Schritten mit night)
  if (world && cond.night && world.daylight >= 0.5) return false;
  if (world && cond.day && world.daylight < 0.5) return false;
  // Spezialisierung: specLevel = aktive Klasse hat SPEC_LEVEL erreicht; noSpec / hasSpec für die aktive Klasse
  if (cond.specLevel && P.classLevel(p) < SPEC_LEVEL) return false;
  if (cond.noSpec && p.specs?.[p.cls]) return false;
  if (cond.hasSpec && !p.specs?.[p.cls]) return false;
  return true;
}

export function visibleOptions(p, npcId, pageKey, world = null) {
  const page = TALK[npcId]?.[pageKey];
  if (!page) return [];
  return page.options.map((o, i) => (conditionHolds(p, o.if, world) ? i : -1)).filter((i) => i >= 0);
}

export function openTalk(world, p, npcId, pageKey = 'start') {
  const options = visibleOptions(p, npcId, pageKey, world);
  if (!options.length) return closeTalk(world, p);
  p.dialog = { npc: npcId, page: pageKey, options };
  emit(world, { to: p.id, type: 'dialog', npc: npcId, page: pageKey, options });
}

export function closeTalk(world, p) {
  if (!p.dialog) return;
  p.dialog = null;
  emit(world, { to: p.id, type: 'dialogEnd' });
}

// Spieler wählt Antwort Nummer i (Index in page.options).
export function say(world, p, i) {
  const d = p.dialog;
  if (!d || !d.options.includes(i)) return;
  const npc = world.npcs.find((n) => n.id === d.npc);
  if (!npc || cheb(npc.x, npc.y, p.x, p.y) > TALK_RANGE) return closeTalk(world, p);
  const opt = TALK[d.npc][d.page].options[i];
  // Bedingungen noch einmal prüfen: zwischen Anzeigen und Klicken kann sich der Beutel geändert haben.
  if (!conditionHolds(p, opt.if, world)) return openTalk(world, p, d.npc, d.page);
  for (const eff of opt.do || []) applyEffect(world, p, eff);
  if (opt.to) openTalk(world, p, d.npc, opt.to);
  else closeTalk(world, p);
}

function giveItems(world, p, items) {
  for (const [id, n] of Object.entries(items)) {
    const lost = P.addItem(p, id, n);
    const def = ITEMS[id];
    // Eine Laterne wandert gleich an den Gürtel, wenn dort noch keine hängt.
    if (def.slot === 'lantern' && !p.equip.lantern && P.takeItem(p, id, 1)) p.equip.lantern = id;
    if (lost < n) tell(world, p.id, `You get ${def.name}${n - lost > 1 ? ` x${n - lost}` : ''}.`, 'good');
    if (lost) tell(world, p.id, `Your bag is full. ${def.name}${lost > 1 ? ` x${lost}` : ''} had to stay behind.`, 'hurt');
  }
}

// Für Tests: eine Gesprächswirkung direkt anwenden
export function applyEffectForTest(world, p, eff) { applyEffect(world, p, eff); }

function applyEffect(world, p, eff) {
  if (eff.start) startQuest(world, p, eff.start);
  if (eff.advance) advanceQuest(world, p, eff.advance);
  if (eff.take) for (const [id, n] of Object.entries(eff.take)) P.takeItem(p, id, n);
  if (eff.give) giveItems(world, p, eff.give);
  if (eff.chooseClass && !p.cls && CLASSES[eff.chooseClass]) {
    const cls = eff.chooseClass;
    P.unlockClass(p, cls);
    P.setClass(p, cls);
    p.equip.main = CLASSES[cls].starter;
    p.hp = p.maxHp;
    tell(world, p.id, `You are a ${CLASSES[cls].name} now. ${CLASSES[cls].text}`, 'good');
  }
  if (eff.chooseSpec && p.cls && !p.specs?.[p.cls] && P.classLevel(p) >= SPEC_LEVEL && CLASSES[p.cls].specs?.[eff.chooseSpec]) {
    p.specs = { ...(p.specs || {}), [p.cls]: eff.chooseSpec };
    P.barOf(p);
    const spec = CLASSES[p.cls].specs[eff.chooseSpec];
    tell(world, p.id, `You walk the path of the ${spec.name} now. ${spec.text || ''}`.trim(), 'good');
  }
  if (eff.learn && P.canLearnProf(p, eff.learn)) {
    p.profs[eff.learn] = { level: 1, xp: 0 };
    tell(world, p.id, `You learned ${PROFESSIONS[eff.learn].name}.`, 'good');
  }
  if (eff.unlearn && p.profs[eff.unlearn]) {
    delete p.profs[eff.unlearn];
    tell(world, p.id, `You forgot ${PROFESSIONS[eff.unlearn].name}.`, 'sys');
  }
  if (eff.refill) {
    p.oil = 100;
    p.warnedOil = 0;
    questEvent(world, p, 'action', { action: 'refill' });
  }
  if (eff.shop) emit(world, { to: p.id, type: 'shop', shop: eff.shop, stock: shopStock(eff.shop, world.date) });
  if (eff.bet) placeBet(world, p, eff.bet[0], eff.bet[1]);
}

// ---------- Quests ----------

export function startQuest(world, p, id) {
  const q = QUESTS[id];
  if (!q || p.quests[id]) return;
  p.quests[id] = { step: 0, n: 0 };
  tell(world, p.id, `New quest: ${q.name}. ${q.steps[0].text}`, 'good');
  checkHave(world, p);
}

export function advanceQuest(world, p, id) {
  const q = QUESTS[id];
  const st = p.quests[id];
  if (!q || !st || st.done) return;
  if (st.step + 1 >= q.steps.length) return completeQuest(world, p, id);
  st.step++;
  st.n = 0;
  tell(world, p.id, `${q.name}: ${q.steps[st.step].text}`, 'good');
  checkHave(world, p);
}

function completeQuest(world, p, id) {
  const q = QUESTS[id];
  p.quests[id] = { done: true };
  tell(world, p.id, `Quest complete: ${q.name}.`, 'good');
  const r = q.reward || {};
  if (r.unlock && P.unlockClass(p, r.unlock)) {
    giveItems(world, p, { [CLASSES[r.unlock].starter]: 1 });
    tell(world, p.id, `You can take up the ${CLASSES[r.unlock].name} calling. Hold its weapon in Kindle to switch.`, 'good');
  }
  if (r.gold) {
    p.gold += r.gold;
    tell(world, p.id, `+${r.gold} gold.`, 'good');
  }
  if (r.items) giveItems(world, p, r.items);
  if (r.xp) grantXp(world, p, r.xp);
}

// rested: Sieg über ein Wesen nach einer Nacht in der Taverne (siehe content/tavern.js)
export function grantXp(world, p, n, { kill = false } = {}) {
  if (!p.cls) return;
  if (kill && p.rested > 0) {
    n = Math.round(n * (1 + INN.bonus));
    p.rested--;
    if (p.rested === 0) tell(world, p.id, 'The good night\'s sleep has worn off.', 'sys');
  }
  emit(world, { to: p.id, type: 'float', ent: p.id, text: `+${n} XP`, cls: 'info' });
  for (const lvl of P.gainClassXp(p, n)) {
    tell(world, p.id, `${CLASSES[p.cls].name} level ${lvl}.`, 'good');
    const learned = CLASSES[p.cls].abilities.filter(([, need]) => need === lvl);
    for (const [ab] of learned) tell(world, p.id, `New ability on your bar: ${ab.replace(/_/g, ' ')}.`, 'good');
  }
}

// Fortschritt melden: kind = 'kill' {mob} | 'action' {action}. night: es ist dunkel.
export function questEvent(world, p, kind, data) {
  for (const [id, st] of Object.entries(p.quests)) {
    if (st.done) continue;
    const step = QUESTS[id].steps[st.step];
    if (step.type !== kind) continue;
    if (kind === 'kill') {
      if (step.mob !== data.mob || (step.night && world.daylight >= 0.5)) continue;
      st.n++;
      if (st.n >= step.n) advanceQuest(world, p, id);
      else tell(world, p.id, `${QUESTS[id].name}: ${st.n}/${step.n}.`, 'sys');
    } else if (kind === 'action' && step.action === data.action) {
      advanceQuest(world, p, id);
    }
  }
}

// have-Schritte erledigen sich, sobald genug im Beutel ist.
export function checkHave(world, p) {
  for (const [id, st] of Object.entries(p.quests)) {
    if (st.done) continue;
    const step = QUESTS[id].steps[st.step];
    if (step.type === 'have' && P.countItem(p, step.item) >= step.n) advanceQuest(world, p, id);
  }
}
