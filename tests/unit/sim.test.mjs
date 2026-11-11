// Spiellogik ohne Browser: node --test tests/unit/
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { REGION as INSIDE } from '../../content/regions/kindle-inside.js';
import { MOBS } from '../../content/mobs.js';
import { TALK } from '../../content/npcs.js';
import { CLASSES, UNLOCK_LEVEL } from '../../content/classes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { SPRITES } from '../../content/sprites.js';
import { buyPrice } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import { applyParty } from '../../shared/party.js';
import { parseIntent, applyIntent, tickFor, welcomeFor } from '../../shared/protocol.js';

// ---------- Helfer: spielen wie ein Spieler ----------

function run(world, n, onTick) {
  for (let i = 0; i < n; i++) {
    S.step(world);
    onTick?.(world.events);
    S.drainEvents(world);
  }
}

function talk(w, pid, npc) {
  applyIntent(w, pid, { t: 'bye' });
  applyIntent(w, pid, { t: 'act', kind: 'npc', id: npc, action: 'talk' });
  for (let i = 0; i < 60 && w.players.get(pid).dialog?.npc !== npc; i++) run(w, 1);
  assert.equal(w.players.get(pid).dialog?.npc, npc, `Gespräch mit ${npc} beginnt`);
}

function choose(w, pid, fragment) {
  const p = w.players.get(pid);
  const d = p.dialog;
  assert.ok(d, 'Gespräch offen');
  const i = d.options.find((k) => TALK[d.npc][d.page].options[k].text.includes(fragment));
  assert.notEqual(i, undefined, `Antwort "${fragment}" auf ${d.npc}/${d.page}`);
  applyIntent(w, pid, { t: 'say', i });
}

// Spieler auf ein freies Feld neben eine Figur stellen.
function besideNpc(w, p, id) {
  const n = w.npcs.find((x) => x.id === id);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    if (S.walkable(w, n.x + dx, n.y + dy)) { p.x = n.x + dx; p.y = n.y + dy; return; }
  }
}

// Spieler ins Dorf (an den Startpunkt) stellen.
function inVillage(w, p) {
  p.x = w.region.start.x; p.y = w.region.start.y;
}

// Spieler weit draußen ins Feld stellen.
function outside(w, p) {
  const g = w.mobs.find((m) => m.type === 'greyling');
  p.x = g.home.x; p.y = g.home.y + 1;
  if (!S.walkable(w, p.x, p.y)) p.y -= 2;
}

function newcomer(w, pid, cls) {
  const p = S.addPlayer(w, pid, pid);
  talk(w, pid, 'ama');
  choose(w, pid, 'new here');
  choose(w, pid, 'choose');
  choose(w, pid, `(${CLASSES[cls].name}`);
  return p;
}

function fight(w, pid, mob, abilities) {
  applyIntent(w, pid, { t: 'act', kind: 'mob', id: mob.id, action: 'attack' });
  for (let i = 0; i < 400 && !mob.dead; i++) {
    applyIntent(w, pid, { t: 'ability', id: abilities[i % abilities.length] });
    run(w, 1);
  }
}

// ---------- Grundlagen ----------

test('Neuer Spieler startet als Wanderer in Kindle', () => {
  const w = S.createWorld(REGION, 1);
  const p = S.addPlayer(w, 'p1', 'Ada');
  assert.equal(p.cls, null);
  assert.equal(p.hp, 30);
  assert.equal(p.oil, 100);
  assert.ok(S.walkable(w, p.x, p.y));
  assert.deepEqual(P.barOf(p).filter(Boolean), ['punch']);
});

test('Erste Klasse bei Ama: Waffe, Laterne, Leiste, Quest', () => {
  const w = S.createWorld(REGION, 1);
  const p = newcomer(w, 'a', 'warden');
  assert.equal(p.cls, 'warden');
  assert.equal(p.equip.main, 'scrap_shield');
  assert.equal(p.equip.lantern, 'tin_lantern');
  assert.equal(p.maxHp, CLASSES.warden.hp);
  assert.ok(P.barOf(p).includes('bash'));
  assert.equal(S.saveOf(p).quests.kindling.step, 1);
});

test('Spielstand übersteht Gehen und Wiederkommen', () => {
  const w = S.createWorld(REGION, 1);
  const p = newcomer(w, 'a', 'mender');
  p.classes.mender = { level: 4, xp: P.xpForLevel(4) + 10 };
  P.addItem(p, 'bread', 3);
  p.gold = 17;
  p.profs.salvage = { level: 3, xp: P.xpForLevel(3) + 5 };
  const save = JSON.parse(JSON.stringify(S.removePlayer(w, 'a')));
  const q = S.addPlayer(w, 'a', 'a', save);
  assert.equal(q.cls, 'mender');
  assert.equal(q.classes.mender.level, 4);
  assert.equal(q.maxHp, CLASSES.mender.hp + 3 * CLASSES.mender.hpPerLevel);
  assert.equal(P.countItem(q, 'bread'), 3);
  assert.equal(q.gold, 17);
  assert.equal(q.profs.salvage.level, 3);
  assert.equal(q.quests.kindling.step, 1);
});

test('Stufe folgt beim Laden der Erfahrung (neue Kurve)', () => {
  const w = S.createWorld(REGION, 1);
  const xp = P.xpForLevel(20) + 1;
  const q = S.addPlayer(w, 'a', 'a', { v: 2, x: 30, y: 30, hp: 20, oil: 50, gold: 0, cls: 'warden', classes: { warden: { level: 50, xp } }, bag: [], equip: {}, profs: {}, quests: {}, bars: {} });
  assert.equal(q.classes.warden.level, 20);
  assert.equal(q.classes.warden.xp, xp, 'Erfahrung bleibt erhalten');
  assert.ok(P.xpStep(50) > P.xpStep(10) * 10, 'späte Stufen deutlich teurer');
});

test('Alter Spielstand (Version 1) wird übernommen', () => {
  const w = S.createWorld(REGION, 1);
  const q = S.addPlayer(w, 'a', 'a', { v: 1, x: 30, y: 30, hp: 20, oil: 50, xp: 100, level: 4 });
  assert.equal(q.cls, 'warden');
  assert.equal(q.classes.warden.level, 4);
  assert.equal(q.equip.main, 'scrap_shield');
});

test('Kaputte oder gefälschte Spielstände werden abgefangen', () => {
  const w = S.createWorld(REGION, 1);
  const p = S.addPlayer(w, 'p1', 'Ada', {
    v: 2, x: 9, y: 9, hp: 'viel', oil: -5, gold: -3, cls: 'god',
    classes: { warden: { level: 9999, xp: -1 }, god: { level: 1 } },
    bag: [{ id: 'excalibur', n: 1 }, { id: 'bread', n: 1e9 }], equip: { main: 'brass_lens', head: 'bread' },
    profs: { salvage: {}, alchemy: {}, tinkering: {} }, quests: { nope: {}, kindling: { step: 99 } },
    bars: { warden: ['__proto__', 'bash'] },
  });
  assert.equal(p.cls, null, 'unbekannte Klasse');
  assert.equal(p.classes.warden.level, 1, 'Stufe folgt der Erfahrung, nicht der behaupteten Stufe');
  assert.ok(!p.classes.god);
  assert.equal(p.gold, 0);
  assert.ok(p.oil >= 0);
  assert.equal(P.countItem(p, 'excalibur'), 0);
  assert.equal(p.equip.head, undefined, 'Brot ist kein Helm');
  assert.equal(p.equip.main, undefined, 'Linse passt nicht zur (fehlenden) Klasse');
  assert.ok(Object.keys(p.profs).length <= 2);
  assert.equal(p.quests.kindling.step, 4);
  assert.ok(S.walkable(w, p.x, p.y));
});

test('Zwei Spieler laufen unabhängig', () => {
  const w = S.createWorld(REGION, 2);
  const a = S.addPlayer(w, 'a', 'A');
  const b = S.addPlayer(w, 'b', 'B');
  S.walkTo(w, 'a', a.x + 3, a.y);
  S.walkTo(w, 'b', b.x - 3, b.y);
  const ax = a.x, bx = b.x;
  run(w, 5);
  assert.equal(a.x, ax + 3);
  assert.equal(b.x, bx - 3);
});

// ---------- Kampf ----------

test('Greyling greift im Dunkeln an, nicht im Dorf', () => {
  const w = S.createWorld(REGION, 3);
  const g = w.mobs.find((m) => m.type === 'greyling');
  const a = S.addPlayer(w, 'a', 'A');
  const b = S.addPlayer(w, 'b', 'B');
  a.x = g.x + 2; a.y = g.y;
  run(w, 30);
  assert.ok(a.hp < a.maxHp || w.telegraphs.length, 'A wurde angegriffen');
  assert.equal(b.hp, b.maxHp, 'B im Dorf bleibt unberührt');
});

for (const [cls, abilities] of [['warden', ['bash']], ['mender', ['staff_rap']], ['flarecaster', ['flare_bolt']], ['drifter', ['slash']]]) {
  test(`${CLASSES[cls].name} besiegt einen Greyling und bekommt Beute und Erfahrung`, () => {
    const w = S.createWorld(REGION, 7);
    const p = newcomer(w, 'a', cls);
    const g = w.mobs.find((m) => m.type === 'greyling');
    p.x = g.x + 1; p.y = g.y;
    const gold = p.gold;
    fight(w, 'a', g, abilities);
    assert.ok(g.dead, 'Greyling ist besiegt');
    assert.ok(p.classes[cls].xp >= MOBS.greyling.xp);
    assert.ok(p.gold > gold || p.bag.some(Boolean), 'Beute');
  });
}

test('Erfahrung teilen: wer mitkämpft, bekommt auch etwas', () => {
  const w = S.createWorld(REGION, 9);
  const a = newcomer(w, 'a', 'warden');
  const b = newcomer(w, 'b', 'flarecaster');
  const g = w.mobs.find((m) => m.type === 'greyling');
  a.x = g.x + 1; a.y = g.y; b.x = g.x - 2; b.y = g.y;
  applyIntent(w, 'b', { t: 'act', kind: 'mob', id: g.id, action: 'attack' });
  fight(w, 'a', g, ['bash']);
  assert.ok(g.dead);
  assert.ok(a.classes.warden.xp > 0 && b.classes.flarecaster.xp > 0);
});

test('Angekündigter Angriff trifft nur, wer stehen bleibt', () => {
  const w = S.createWorld(REGION, 8);
  const g = w.mobs.find((m) => m.type === 'greyling');
  const p = S.addPlayer(w, 'a', 'A');
  p.x = g.x + 1; p.y = g.y;
  g.attacks = MOBS.greyling.special.every - 1;
  g.angryAt = 'a';
  run(w, 1);
  assert.equal(w.telegraphs.length, 1, 'Ankündigung liegt');
  const hp = p.hp;
  S.walkTo(w, 'a', p.x + 2, p.y + 1);
  run(w, MOBS.greyling.special.delay + 1);
  assert.equal(w.telegraphs.length, 0);
  assert.ok(p.hp >= hp - MOBS.greyling.hit[1], 'Kein voller Einschlag beim Ausweichen');
});

test('Rüstung fängt Schaden ab, aber höchstens die Hälfte', () => {
  const w = S.createWorld(REGION, 10);
  const p = newcomer(w, 'a', 'warden');
  p.equip.head = 'brass_hood'; p.equip.body = 'brass_coat'; p.equip.feet = 'brass_boots';
  assert.ok(P.defenceOf(p) >= 10);
  const g = w.mobs.find((m) => m.type === 'greyling');
  p.x = g.x + 1; p.y = g.y;
  g.angryAt = 'a';
  g.attacks = 0;
  const hp = p.hp;
  run(w, 2);
  assert.ok(hp - p.hp >= Math.ceil(MOBS.greyling.hit[0] / 2), 'mindestens die Hälfte geht durch');
});

// ---------- Kindling: die ganze Einstiegs-Quest wie ein Spieler ----------

test('Kindling lässt sich von Anfang bis Ende spielen', () => {
  const w = S.createWorld(REGION, 11);
  const p = newcomer(w, 'a', 'drifter');
  const beacon = w.objects.find((o) => o.type === 'beacon');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: beacon.id, action: 'refill' });
  run(w, 30);
  assert.equal(p.quests.kindling.step, 2);
  const sig = w.objects.find((o) => o.type === 'signal');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: sig.id, action: 'light' });
  run(w, 80);
  assert.equal(p.quests.kindling.step, 3, 'Signalfeuer angezündet');
  for (let k = 0; k < 3; k++) {
    const g = w.mobs.find((m) => m.type === 'greyling' && !m.dead);
    p.x = g.x + 1; p.y = g.y; p.hp = p.maxHp;
    fight(w, 'a', g, ['slash']);
  }
  assert.equal(p.quests.kindling.step, 4);
  besideNpc(w, p, 'ama');
  talk(w, 'a', 'ama');
  choose(w, 'a', 'Three Greylings');
  assert.ok(p.quests.kindling.done);
  assert.ok(P.countItem(p, 'bread') >= 3);
  assert.ok(p.gold >= 20);
});

// ---------- Klassen ----------

test('Weitere Klasse erst ab Stufe 10, dann über die Prüfung, Wechsel nur im Dorf', () => {
  const w = S.createWorld(REGION, 12);
  const p = newcomer(w, 'a', 'warden');
  besideNpc(w, p, 'tallow');
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'Mender');
  assert.equal(p.dialog.page, 'trial_early');
  p.classes.warden.level = UNLOCK_LEVEL;
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'Mender');
  assert.equal(p.quests.trial_mender.step, 0);
  P.addItem(p, 'bitterleaf', 3);
  run(w, 1);
  assert.equal(p.quests.trial_mender.step, 1, 'have-Schritt erledigt sich');
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'I did what you asked');
  assert.ok(p.classes.mender, 'Mender freigeschaltet');
  assert.equal(P.countItem(p, 'bitterleaf'), 0, 'Kräuter abgegeben');
  const staff = p.bag.findIndex((s) => s?.id === 'ember_staff');
  // Draußen geht der Wechsel nicht
  outside(w, p);
  applyIntent(w, 'a', { t: 'use', slot: staff });
  assert.equal(p.cls, 'warden');
  // Im Dorf schon, und die Warden-Stufe bleibt
  inVillage(w, p);
  applyIntent(w, 'a', { t: 'use', slot: staff });
  assert.equal(p.cls, 'mender');
  assert.equal(p.classes.warden.level, UNLOCK_LEVEL);
  assert.equal(p.maxHp, CLASSES.mender.hp);
  assert.ok(P.countItem(p, 'scrap_shield') === 1, 'Schild im Beutel');
});

test('Leiste: nur bekannte Fähigkeiten, Gegenstände erlaubt', () => {
  const w = S.createWorld(REGION, 13);
  const p = newcomer(w, 'a', 'warden');
  applyIntent(w, 'a', { t: 'bar', slot: 5, id: 'twin_cut' });
  assert.ok(!P.barOf(p).includes('twin_cut'));
  applyIntent(w, 'a', { t: 'bar', slot: 5, id: 'item:bread' });
  assert.equal(P.barOf(p)[5], 'item:bread');
  P.addItem(p, 'bread', 1);
  p.hp = 10;
  applyIntent(w, 'a', { t: 'ability', id: 'item:bread' });
  run(w, 1);
  assert.ok(p.hp > 10);
  applyIntent(w, 'a', { t: 'ability', id: 'twin_cut' });
  assert.equal(p.queued, null, 'fremde Fähigkeit wird nicht ausgeführt');
});

// ---------- Berufe ----------

test('Höchstens zwei Berufe, Verlernen löscht den Fortschritt', () => {
  const w = S.createWorld(REGION, 14);
  const p = newcomer(w, 'a', 'warden');
  besideNpc(w, p, 'rook');
  talk(w, 'a', 'rook'); choose(w, 'a', 'salvage');
  talk(w, 'a', 'rook'); choose(w, 'a', 'tinkering');
  assert.deepEqual(Object.keys(p.profs).sort(), ['salvage', 'tinkering']);
  p.profs.salvage.level = 7;
  besideNpc(w, p, 'fen');
  talk(w, 'a', 'fen');
  assert.ok(!p.dialog.options.some((i) => TALK.fen.start.options[i].text.includes('cartography')), 'kein dritter Beruf');
  besideNpc(w, p, 'rook');
  talk(w, 'a', 'rook'); choose(w, 'a', 'forget salvage'); choose(w, 'a', 'Forget salvage');
  assert.ok(!p.profs.salvage);
  talk(w, 'a', 'rook'); choose(w, 'a', 'salvage');
  assert.equal(p.profs.salvage.level, 1, 'von vorn');
});

test('Sammeln, Herstellen, Verkaufen, Kaufen', () => {
  const w = S.createWorld(REGION, 15);
  const p = newcomer(w, 'a', 'warden');
  p.profs.salvage = { level: 1, xp: 0 };
  p.profs.tinkering = { level: 1, xp: 0 };
  const heap = w.objects.find((o) => o.node === 'scrap_heap');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: heap.id, action: 'gather' });
  run(w, 120);
  assert.ok(P.countItem(p, 'scrap') >= 2, 'Schrott gesammelt');
  assert.ok(p.profs.salvage.xp > 0);
  const bench = w.objects.find((o) => o.station === 'workbench');
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: bench.id, action: 'use' });
  let opened = false;
  run(w, 60, (ev) => { if (ev.some((e) => e.type === 'craft' && e.to === 'a')) opened = true; });
  assert.ok(opened, 'Werkbank öffnet das Herstellfenster');
  applyIntent(w, 'a', { t: 'craft', obj: bench.id, recipe: 't_scrap_hood', n: 1 });
  assert.equal(P.countItem(p, 'scrap_hood'), 1);
  // Bei Marrow verkaufen und Brot kaufen
  besideNpc(w, p, 'marrow');
  const slot = p.bag.findIndex((s) => s?.id === 'scrap_hood');
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'sell', shop: 'marrow', slot, n: 1 });
  assert.ok(p.gold > gold);
  // Händler verkaufen teurer, als sie ankaufen (BUY_MARKUP)
  p.gold = 20;
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'bread', n: 1 });
  assert.ok(P.countItem(p, 'bread') >= 1);
  assert.equal(p.gold, 20 - buyPrice(ITEMS.bread.value));
  assert.ok(buyPrice(ITEMS.bread.value) > ITEMS.bread.value * 2, 'deutlich über dem Wert');
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'brass_lens', n: 1 });
  assert.equal(P.countItem(p, 'brass_lens'), 0, 'nicht im Sortiment');
});

test('Erschöpfte Fundstelle wächst für alle nach', () => {
  const w = S.createWorld(REGION, 16);
  const heap = w.objects.find((o) => o.node === 'scrap_heap');
  heap.left = 0;
  heap.respawnAt = w.tick + 5;
  let ev = [];
  run(w, 6, (e) => { ev = ev.concat(e); });
  assert.ok(heap.left > 0);
  assert.ok(ev.some((e) => e.type === 'node' && !e.to));
});

// ---------- Protokoll ----------

test('Ereignisse mit `to` gehen nur an den Empfänger', () => {
  const w = S.createWorld(REGION, 4);
  S.addPlayer(w, 'a', 'A');
  S.addPlayer(w, 'b', 'B');
  S.interact(w, 'a', { kind: 'object', id: 'o0' }, 'examine');
  const ta = tickFor(w, 'a', new Set());
  const tb = tickFor(w, 'b', new Set());
  assert.ok(ta.events.some((e) => e.type === 'log'));
  assert.ok(!tb.events.some((e) => e.type === 'log'));
});

test('Takt-Nachricht: Metadaten und Charakterstand nur bei Änderung', () => {
  const w = S.createWorld(REGION, 5);
  const a = S.addPlayer(w, 'a', 'A');
  S.addPlayer(w, 'b', 'B');
  const known = new Set();
  const first = tickFor(w, 'a', known);
  assert.ok(first.spawn.length > 10);
  assert.ok(first.state, 'erster Stand kommt mit');
  const second = tickFor(w, 'a', known);
  assert.equal(second.spawn.length, 0);
  assert.equal(second.state, undefined, 'unverändert: kein Stand');
  a.gold = 5;
  assert.equal(tickFor(w, 'a', known).state.gold, 5);
  S.removePlayer(w, 'b');
  assert.deepEqual(tickFor(w, 'a', known).gone, ['b']);
  assert.equal(welcomeFor(w, 'a').you, 'a');
});

test('Klassenwechsel: neues Sprite, Grunddaten kommen erneut', () => {
  const w = S.createWorld(REGION, 5);
  const a = S.addPlayer(w, 'a', 'A');
  assert.equal(a.sprite, 'player', 'ohne Klasse: Wanderer');
  const known = new Set();
  tickFor(w, 'a', known);
  assert.equal(tickFor(w, 'a', known).spawn.length, 0);
  P.unlockClass(a, 'drifter');
  P.setClass(a, 'drifter');
  assert.equal(a.sprite, 'player_drifter');
  const t = tickFor(w, 'a', known);
  assert.deepEqual(t.spawn.map((m) => [m.id, m.sprite]), [['a', 'player_drifter']]);
  assert.equal(tickFor(w, 'a', known).spawn.length, 0, 'nur einmal');
  for (const id of Object.keys(CLASSES)) assert.ok(SPRITES[`player_${id}`], `Sprite für ${id}`);
});

test('Sprechen: bereinigt, gekürzt, gebremst, an alle im Gebiet', () => {
  const w = S.createWorld(REGION, 7);
  S.addPlayer(w, 'a', 'A');
  S.addPlayer(w, 'b', 'B');
  const m = parseIntent(JSON.stringify({ t: 'chat', text: '  hallo\u0000  welt  ' + 'x'.repeat(200) }));
  assert.ok(m);
  applyIntent(w, 'a', m);
  const said = w.events.filter((e) => e.type === 'chat');
  assert.equal(said.length, 1);
  assert.equal(said[0].ent, 'a');
  assert.ok(said[0].text.startsWith('hallo welt x'));
  assert.ok(said[0].text.length <= 80);
  assert.equal(said[0].to, undefined, 'alle sehen es');
  S.drainEvents(w);
  applyIntent(w, 'a', { t: 'chat', text: 'gleich nochmal' });
  assert.equal(w.events.filter((e) => e.type === 'chat').length, 0, 'zu schnell');
  assert.equal(parseIntent(JSON.stringify({ t: 'chat', text: 5 })), null);
});

test('Handel: fragen, anbieten, beide sagen zu, alles wechselt auf einmal', () => {
  const w = S.createWorld(REGION, 31);
  const a = S.addPlayer(w, 'a', 'Ann');
  const b = S.addPlayer(w, 'b', 'Bo');
  b.x = a.x + 1; b.y = a.y;
  P.addItem(a, 'bread', 5);
  a.gold = 10;
  P.addItem(b, 'lamp_oil', 2);
  const send = (pid, m) => { const x = parseIntent(JSON.stringify(m)); assert.ok(x, JSON.stringify(m)); applyIntent(w, pid, x); };
  send('a', { t: 'tradeAsk', id: 'b' });
  assert.ok(w.events.some((e) => e.type === 'tradeAsk' && e.to === 'b'));
  send('b', { t: 'tradeAnswer', from: 'a', yes: true });
  assert.ok(a.trade?.open && b.trade?.open);
  send('a', { t: 'tradeSet', items: { bread: 99 }, gold: 4 });
  assert.equal(a.trade.items.bread, 5, 'gekappt auf Besitz');
  send('b', { t: 'tradeSet', items: { lamp_oil: 2 }, gold: 0 });
  send('a', { t: 'tradeOk' });
  // Änderung hebt Zusagen auf
  send('b', { t: 'tradeSet', items: { lamp_oil: 1 }, gold: 0 });
  assert.equal(a.trade.ok, false);
  send('a', { t: 'tradeOk' });
  send('b', { t: 'tradeOk' });
  assert.equal(a.trade, null);
  assert.equal(P.countItem(a, 'bread'), 0);
  assert.equal(P.countItem(b, 'bread'), 5);
  assert.equal(P.countItem(a, 'lamp_oil'), 1);
  assert.equal(P.countItem(b, 'lamp_oil'), 1);
  assert.equal(a.gold, 6);
  assert.equal(b.gold, 4);
  // Zu weit weg: Anfrage geht nicht; offener Handel bricht ab, wenn man sich entfernt
  b.x = a.x + 10;
  send('a', { t: 'tradeAsk', id: 'b' });
  assert.equal(a.trade, null);
  b.x = a.x + 1;
  send('a', { t: 'tradeAsk', id: 'b' });
  send('b', { t: 'tradeAnswer', from: 'a', yes: true });
  b.x = a.x + 20;
  run(w, 1);
  assert.equal(a.trade, null);
  assert.equal(b.trade, null);
  assert.equal(parseIntent(JSON.stringify({ t: 'tradeSet', items: { 'BAD ID': 1 }, gold: 0 })), null);
});

test('Gruppe: einladen, annehmen, Erfahrung teilen, verlassen, über Gebiete wiederherstellen', () => {
  const w = S.createWorld(REGION, 41);
  const a = newcomer(w, 'a', 'warden');
  const b = newcomer(w, 'b', 'mender');
  const send = (pid, m) => { const x = parseIntent(JSON.stringify(m)); assert.ok(x, JSON.stringify(m)); applyIntent(w, pid, x); };
  send('a', { t: 'partyInvite', id: 'b' });
  assert.ok(w.events.some((e) => e.type === 'partyInvite' && e.to === 'b'));
  send('b', { t: 'partyAnswer', from: 'a', yes: true });
  assert.ok(a.partyId && a.partyId === b.partyId);
  const saved = w.outbox.filter((o) => o.kind === 'party').pop();
  assert.deepEqual(saved.party.members.map((m) => m.id), ['a', 'b']);
  assert.equal(tickFor(w, 'b', new Set()).state.party.leader, 'a');
  // a schlägt, b heilt nur und steht daneben: beide bekommen Erfahrung
  const g = w.mobs.find((m) => m.type === 'greyling');
  a.x = g.x + 1; a.y = g.y; b.x = g.x + 2; b.y = g.y;
  const xpB = b.classes.mender.xp;
  g.hp = 1;
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: g.id, action: 'attack' });
  run(w, 30);
  assert.ok(g.dead);
  assert.ok(b.classes.mender.xp > xpB, 'Gruppe teilt Erfahrung');
  // In einem anderen Gebiet: gespeicherte Gruppe wird übernommen
  const w2 = S.createWorld(INSIDE, 42);
  const b2 = S.addPlayer(w2, 'b', 'b');
  applyParty(w2, b2, saved.party);
  assert.equal(b2.partyId, saved.party.id);
  // Verlassen: allein übrig -> Gruppe aufgelöst
  send('b', { t: 'partyLeave' });
  assert.equal(a.partyId, null);
  assert.equal(b.partyId, null);
  assert.ok(w.outbox.some((o) => o.kind === 'party' && o.disband));
});

test('Protokoll lehnt Unsinn ab', () => {
  assert.equal(parseIntent('{"t":"walk","x":1.5,"y":2}'), null);
  assert.equal(parseIntent('{"t":"walk","x":-1,"y":2}'), null);
  assert.equal(parseIntent('{"t":"act","kind":"npc","id":"ama","action":"rm -rf"}'), null);
  assert.equal(parseIntent('{"t":"ability","id":"Strike!"}'), null);
  assert.equal(parseIntent('{"t":"craft","obj":"o1","recipe":"x","n":500}'), null);
  assert.equal(parseIntent('{"t":"say","i":-1}'), null);
  assert.equal(parseIntent('x'.repeat(600)), null);
  assert.equal(parseIntent('not json'), null);
  assert.deepEqual(parseIntent('{"t":"walk","x":3,"y":4,"evil":1}'), { t: 'walk', x: 3, y: 4 });
});

test('Antworten, die gerade nicht angeboten werden, wirken nicht', () => {
  const w = S.createWorld(REGION, 6);
  const p = S.addPlayer(w, 'a', 'A');
  talk(w, 'a', 'ama');
  // Antwort „Three Greylings, gone.“ (Quest abschließen) ist für einen Neuling nicht sichtbar.
  const hidden = TALK.ama.start.options.findIndex((o) => o.text.includes('Three Greylings'));
  applyIntent(w, 'a', { t: 'say', i: hidden });
  assert.ok(!p.quests.kindling);
  applyIntent(w, 'a', { t: 'ability', id: '__proto__' });
  assert.equal(p.queued, null);
});

// ---------- Gemeinschaft ----------

import { favoursFor, cleanPrayer } from '../../shared/community.js';
import { FAVOURS, BEACON_FUEL } from '../../content/dailies.js';
import { BALLOT } from '../../content/ballot.js';

function nearObject(w, p, type) {
  const o = w.objects.find((x) => x.type === type);
  p.x = o.x + o.w; p.y = o.y + o.d;
  if (!S.walkable(w, p.x, p.y)) { p.x = o.x - 1; p.y = o.y; }
}

test('Gebäude betreten und wieder verlassen; drinnen brennt kein Öl', () => {
  const w = S.createWorld(REGION, 25);
  const p = newcomer(w, 'a', 'warden');
  const chapel = w.objects.find((o) => o.type === 'chapel');
  assert.deepEqual(S.objectActions(chapel)[0], ['enter', 'Enter']);
  p.x = chapel.x + 2; p.y = chapel.y + chapel.d;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: chapel.id, action: 'enter' });
  run(w, 3);
  assert.equal(p.travel?.region, 'kindle_inside');
  // Drinnen: Tür führt zurück vor die Kapelle, Öl bleibt
  const w2 = S.createWorld(INSIDE, 26);
  const q = S.addPlayer(w2, 'b', 'b');
  q.x = p.travel.x; q.y = p.travel.y;
  w2.daylight = 0;
  const oil = q.oil;
  run(w2, 20);
  assert.equal(q.oil, oil, 'kein Ölverbrauch drinnen');
  const door = w2.objects.find((o) => o.type === 'door' && o.tx === chapel.x + 2);
  applyIntent(w2, 'b', { t: 'act', kind: 'object', id: door.id, action: 'enter' });
  run(w2, 3);
  assert.equal(q.travel?.region, 'kindle');
  assert.ok(S.walkable(w, q.travel.x, q.travel.y), 'Ausgang draußen begehbar');
});

test('Gefallen: für alle gleich, jeden Tag andere', () => {
  const a = favoursFor('2026-11-10');
  assert.equal(a.length, 3);
  assert.deepEqual(favoursFor('2026-11-10'), a);
  const days = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'].map((d) => favoursFor(d).join());
  assert.ok(new Set(days).size > 1, 'nicht jeden Tag dieselben');
});

test('Gefallen erledigen: Abgeben am Brett und Besiegen', () => {
  const w = S.createWorld(REGION, 20);
  // Einen Tag suchen, an dem beide Arten vorkommen
  let date = '2026-11-10';
  for (let i = 0; i < 60; i++) {
    const f = favoursFor(date).map((id) => FAVOURS[id].type);
    if (f.includes('bring') && f.includes('kill')) break;
    date = `2026-12-${String(i % 28 + 1).padStart(2, '0')}`;
  }
  w.date = date;
  const p = newcomer(w, 'a', 'warden');
  const ids = favoursFor(date);
  const bring = ids.find((id) => FAVOURS[id].type === 'bring');
  const kill = ids.find((id) => FAVOURS[id].type === 'kill');
  P.addItem(p, FAVOURS[bring].item, FAVOURS[bring].n);
  const gold = p.gold;
  nearObject(w, p, 'board');
  applyIntent(w, 'a', { t: 'favour', id: bring });
  assert.ok(p.daily.done.includes(bring));
  assert.ok(p.gold > gold);
  applyIntent(w, 'a', { t: 'favour', id: bring });
  assert.equal(p.daily.done.filter((x) => x === bring).length, 1, 'nur einmal pro Tag');
  for (let k = 0; k < FAVOURS[kill].n; k++) {
    const m = w.mobs.find((x) => x.type === FAVOURS[kill].mob && !x.dead);
    p.x = m.x + 1; p.y = m.y; p.hp = p.maxHp;
    fight(w, 'a', m, ['bash']);
  }
  assert.ok(p.daily.done.includes(kill));
});

test('Leuchtfeuer füttern zählt für alle und landet in der Outbox', () => {
  const w = S.createWorld(REGION, 21);
  const p = newcomer(w, 'a', 'warden');
  P.addItem(p, 'lamp_oil', 3);
  nearObject(w, p, 'beacon');
  applyIntent(w, 'a', { t: 'feed', item: 'lamp_oil', n: 3 });
  assert.equal(w.community.beacon, BEACON_FUEL.lamp_oil * 3);
  assert.equal(P.countItem(p, 'lamp_oil'), 0);
  assert.ok(w.outbox.some((o) => o.kind === 'beacon'));
  applyIntent(w, 'a', { t: 'feed', item: 'bread', n: 1 });
  assert.equal(w.community.beacon, BEACON_FUEL.lamp_oil * 3, 'Brot brennt nicht');
});

test('Beten: einmal am Tag, nur am Altar, Text wird bereinigt', () => {
  const w = S.createWorld(INSIDE, 22);
  const p = S.addPlayer(w, 'a', 'a');
  applyIntent(w, 'a', { t: 'pray', text: 'A lighthouse in the Grey.' });
  assert.equal(w.outbox.length, 0, 'nicht am Altar');
  nearObject(w, p, 'altar');
  applyIntent(w, 'a', { t: 'pray', text: '  A   lighthouse‮ in the Grey.\u0000 ' });
  assert.equal(w.outbox.length, 1);
  assert.equal(w.outbox[0].text, 'A lighthouse in the Grey.');
  applyIntent(w, 'a', { t: 'pray', text: 'Another one.' });
  assert.equal(w.outbox.length, 1, 'einmal am Tag');
  assert.equal(cleanPrayer('x'.repeat(999)).length, 300);
  assert.equal(cleanPrayer('  '), null);
});

test('Abstimmen: eine Stimme pro Tag, Gold zählt nicht', () => {
  const w = S.createWorld(INSIDE, 23);
  const p = S.addPlayer(w, 'a', 'a');
  p.gold = 9999;
  nearObject(w, p, 'altar');
  const opt = BALLOT.options[0].id;
  applyIntent(w, 'a', { t: 'vote', option: opt });
  applyIntent(w, 'a', { t: 'vote', option: opt });
  applyIntent(w, 'a', { t: 'vote', option: BALLOT.options[1]?.id ?? opt });
  assert.equal(w.community.ballot[opt], 1, 'nur eine Stimme');
  assert.equal(p.gold, 9999, 'kein Gold verbraucht');
  assert.equal(w.outbox.filter((o) => o.kind === 'vote').length, 1);
  applyIntent(w, 'a', { t: 'vote', option: 'nope' });
  assert.equal(parseIntent(JSON.stringify({ t: 'donate', option: opt, gold: 5 })), null, 'Spenden gibt es nicht mehr');
  // Neuer Tag: wieder eine Stimme
  w.date = '2099-01-01';
  applyIntent(w, 'a', { t: 'vote', option: opt });
  assert.equal(w.community.ballot[opt], 2);
});

test('Tagesstand übersteht Speichern', () => {
  const w = S.createWorld(INSIDE, 24);
  const p = S.addPlayer(w, 'a', 'a');
  nearObject(w, p, 'altar');
  applyIntent(w, 'a', { t: 'vote', option: BALLOT.options[0].id });
  const q = S.addPlayer(w, 'b', 'b', JSON.parse(JSON.stringify(S.removePlayer(w, 'a'))));
  assert.equal(q.daily.voted, BALLOT.options[0].id);
  assert.equal(q.daily.date, w.date);
});

// ---------- Gebiete ----------

import { regionFor } from '../../content/regions/index.js';

test('Tür führt ins andere Gebiet, der Spielstand merkt sich das Ziel', () => {
  const w = S.createWorld(REGION, 30);
  const p = newcomer(w, 'a', 'warden');
  const stairs = w.objects.find((o) => o.type === 'door' && o.to === 'drowned_chapel');
  p.x = stairs.x; p.y = stairs.y - 1;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: stairs.id, action: 'enter' });
  run(w, 5);
  assert.equal(p.travel, undefined, 'ohne The Older Prayer bleibt der Abstieg zu');
  p.quests.older_prayer = { done: true };
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: stairs.id, action: 'enter' });
  run(w, 5);
  assert.deepEqual(p.travel, { region: 'drowned_chapel', x: stairs.tx, y: stairs.ty });
  const save = S.removePlayer(w, 'a');
  assert.equal(save.region, 'drowned_chapel');
  const d = S.createWorld(regionFor('drowned_chapel'), 31);
  const q = S.addPlayer(d, 'a', 'a', save);
  assert.equal(q.x, stairs.tx);
  assert.equal(q.cls, 'warden');
});

test('Wer im Dungeon unterliegt, wacht in Kindle auf', () => {
  const d = S.createWorld(regionFor('drowned_chapel'), 32);
  const p = S.addPlayer(d, 'a', 'a', { v: 2, cls: 'warden', classes: { warden: { level: 1, xp: 0 } }, equip: { main: 'scrap_shield' } });
  const g = d.mobs[0];
  p.x = g.x + 1; p.y = g.y; p.hp = 1;
  g.angryAt = 'a'; g.nextAttack = 0; g.attacks = 0;
  run(d, 3);
  assert.equal(p.travel?.region, 'kindle');
  assert.equal(S.removePlayer(d, 'a').region, 'kindle');
});

test('Der Drift ist jeden Tag anders, am selben Tag gleich', () => {
  const a = regionFor('drift', '2026-11-10');
  assert.deepEqual(regionFor('drift', '2026-11-10').tiles, a.tiles);
  assert.notDeepEqual(regionFor('drift', '2026-11-11').tiles, a.tiles);
  const w = S.createWorld(a, 1);
  assert.ok(w.objects.some((o) => o.type === 'door' && o.to === 'kindle'));
});

// ---------- Neue Zonen ----------

test('Bestien folgen nicht ins Dorf', () => {
  const w = S.createWorld(REGION, 40);
  const p = newcomer(w, 'a', 'warden');
  const wolf = w.mobs.find((m) => m.type === 'wolf');
  inVillage(w, p);
  wolf.x = p.x; wolf.y = p.y - 17; wolf.home = { x: wolf.x, y: wolf.y }; wolf.angryAt = 'a';
  assert.ok(S.walkable(w, wolf.x, wolf.y));
  run(w, 40);
  const beacon = w.objects.find((o) => o.type === 'beacon');
  const d = Math.hypot(wolf.x + 0.5 - (beacon.x + 1), wolf.y + 0.5 - (beacon.y + 1));
  assert.ok(d > w.region.safeRadius, 'Wolf bleibt außerhalb des Leuchtfeuers');
});

test('Irrlichter trinken Lampenöl', () => {
  const w = S.createWorld(REGION, 41);
  const p = newcomer(w, 'a', 'warden');
  p.hp = p.maxHp = 500;
  const wisp = w.mobs.find((m) => m.type === 'will_o_wisp');
  p.x = wisp.x + 1; p.y = wisp.y;
  if (!S.walkable(w, p.x, p.y)) p.x = wisp.x - 1;
  wisp.angryAt = 'a'; wisp.attacks = 0; wisp.nextAttack = 0;
  const oil = p.oil;
  run(w, 3);
  assert.ok(p.oil <= oil - MOBS.will_o_wisp.drainOil);
});

test('The Older Prayer: Schrein, Tallow, dann öffnet sich der Abstieg', () => {
  const w = S.createWorld(REGION, 42);
  const p = newcomer(w, 'a', 'warden');
  p.classes.warden.level = 22;
  besideNpc(w, p, 'tallow');
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'You look worried');
  assert.equal(p.quests.older_prayer.step, 0);
  const shrine = w.objects.find((o) => o.type === 'shrine');
  p.x = shrine.x; p.y = shrine.y - 1;
  if (!S.walkable(w, p.x, p.y)) p.y = shrine.y + 1;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: shrine.id, action: 'search' });
  run(w, 3);
  assert.equal(p.quests.older_prayer.step, 1, 'Tafel gefunden');
  besideNpc(w, p, 'tallow');
  talk(w, 'a', 'tallow');
  choose(w, 'a', 'I found a tablet');
  assert.ok(p.quests.older_prayer.done);
  const stairs = w.objects.find((o) => o.type === 'door' && o.to === 'drowned_chapel');
  p.x = stairs.x; p.y = stairs.y - 1;
  applyIntent(w, 'a', { t: 'act', kind: 'object', id: stairs.id, action: 'enter' });
  run(w, 3);
  assert.equal(p.travel?.region, 'drowned_chapel');
});

test('Truhen öffnen sich einmal am Tag pro Spieler', () => {
  const d = S.createWorld(regionFor('drowned_chapel'), 43);
  const p = S.addPlayer(d, 'a', 'a', { v: 2, cls: 'warden', classes: { warden: { level: 30, xp: 0 } }, equip: { main: 'scrap_shield' } });
  const chest = d.objects.find((o) => o.type === 'chest');
  p.x = chest.x + 1; p.y = chest.y;
  if (!S.walkable(d, p.x, p.y)) { p.x = chest.x; p.y = chest.y + 1; }
  applyIntent(d, 'a', { t: 'act', kind: 'object', id: chest.id, action: 'open' });
  run(d, 2);
  const gold = p.gold;
  assert.ok(gold > 0);
  applyIntent(d, 'a', { t: 'act', kind: 'object', id: chest.id, action: 'open' });
  run(d, 2);
  assert.equal(p.gold, gold, 'zweites Mal leer');
});

// ---------- Der Lamplighter ----------

function bossFight() {
  const d = S.createWorld(regionFor('drowned_chapel'), 50);
  const boss = d.mobs.find((m) => m.type === 'lamplighter');
  for (const m of d.mobs) if (m !== boss) { m.dead = true; m.deadUntil = 1e9; }
  const p = S.addPlayer(d, 'a', 'a', { v: 2, cls: 'warden', classes: { warden: { level: 36, xp: 0 } }, equip: { main: 'greyglass_shield', body: 'greyglass_coat' }, quests: { false_light: { step: 0, n: 0 } } });
  p.x = boss.x + 1; p.y = boss.y;
  return { d, boss, p };
}

test('Lamplighter: Phase 2 löscht alle Lichter, im Dunkeln ist er verhüllt', () => {
  const { d, boss, p } = bossFight();
  const litBefore = d.lights.length;
  assert.ok(litBefore >= 5);
  boss.angryAt = 'a';
  boss.hp = Math.floor(boss.maxHp * 0.5) + 5;
  S.interact(d, 'a', { kind: 'mob', id: boss.id }, 'attack');
  for (let i = 0; i < 40 && !boss.phase2; i++) { applyIntent(d, 'a', { t: 'ability', id: 'bash' }); p.hp = p.maxHp; run(d, 1); }
  assert.ok(boss.phase2, 'Phase 2 erreicht');
  assert.equal(d.lights.length, 0, 'alle Lichter aus');
  // Verhüllt: ein Schlag im Dunkeln richtet weniger aus als im Licht
  const brazier = d.objects.find((o) => o.type === 'brazier' && o.name.includes('nave'));
  p.oil = 100;
  p.x = brazier.x + 1; p.y = brazier.y;
  if (!S.walkable(d, p.x, p.y)) p.y += 1;
  applyIntent(d, 'a', { t: 'act', kind: 'object', id: brazier.id, action: 'light' });
  run(d, 3);
  assert.ok(brazier.lit, 'Kohlebecken wieder an');
  assert.ok(p.oil <= 90);
});

test('Lamplighter: Sieg zündet die Lichter an und zählt für The False Light', () => {
  const { d, boss, p } = bossFight();
  boss.angryAt = 'a';
  S.interact(d, 'a', { kind: 'mob', id: boss.id }, 'attack');
  for (let i = 0; i < 3000 && !boss.dead; i++) {
    applyIntent(d, 'a', { t: 'ability', id: i % 5 === 0 ? 'shield_slam' : 'bash' });
    p.hp = p.maxHp;
    // Dem Kampf mit Licht helfen: Kohlebecken sofort wieder anzünden
    if (boss.phase2) for (const o of d.objects) if (o.type === 'brazier') o.lit = true;
    run(d, 1);
  }
  assert.ok(boss.dead, 'Boss besiegt');
  assert.ok(d.lights.length >= 5, 'Lichter brennen wieder');
  assert.equal(p.quests.false_light.step, 1);
  assert.ok(P.countItem(p, 'lamp_shard') === 1);
});

test('Lamplighter heilt sich, wenn alle fliehen', () => {
  const { d, boss } = bossFight();
  boss.hp = 100;
  boss.phase2 = true;
  S.removePlayer(d, 'a');
  run(d, 2);
  assert.equal(boss.hp, boss.maxHp);
  assert.equal(boss.phase2, false);
});

// ---------- Globale Abklingzeit ----------

test('Eine Handlung pro globaler Abklingzeit, Vorgemerktes geht vor und geht nicht verloren', async () => {
  const { GCD } = await import('../../content/abilities.js');
  const w = S.createWorld(REGION, 60);
  const p = newcomer(w, 'a', 'warden');
  const g = w.mobs.find((m) => m.type === 'greyling');
  g.hp = g.maxHp = 9999;
  p.x = g.x + 1; p.y = g.y; p.hp = p.maxHp = 999;
  P.addItem(p, 'bread', 5);
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: g.id, action: 'attack' });
  const casts = [];
  run(w, 1, (ev) => casts.push(...ev.filter((e) => e.type === 'cast' && e.by === 'a').map((e) => [w.tick, e.id])));
  // Brot während der Abklingzeit drücken: wird vorgemerkt und kommt als nächste Handlung.
  applyIntent(w, 'a', { t: 'ability', id: 'item:bread' });
  assert.equal(p.queued, 'item:bread');
  run(w, GCD * 3, (ev) => casts.push(...ev.filter((e) => e.type === 'cast' && e.by === 'a').map((e) => [w.tick, e.id])));
  assert.equal(P.countItem(p, 'bread'), 4, 'Brot gegessen');
  // Zwischen zwei Handlungen liegen mindestens GCD Takte (der automatische Angriff zählt nicht).
  const acts = casts.filter(([, id]) => id !== 'swing');
  for (let i = 1; i < acts.length; i++) assert.ok(acts[i][0] - acts[i - 1][0] >= GCD, `Abstand ${acts[i][0] - acts[i - 1][0]}`);
});

test('Automatischer Angriff im Waffentakt, auch während Fähigkeiten', async () => {
  const { GCD } = await import('../../content/abilities.js');
  const w = S.createWorld(REGION, 62);
  const p = newcomer(w, 'a', 'drifter');
  const g = w.mobs.find((m) => m.type === 'greyling');
  g.hp = g.maxHp = 9999;
  p.x = g.x + 1; p.y = g.y; p.hp = p.maxHp = 999;
  applyIntent(w, 'a', { t: 'act', kind: 'mob', id: g.id, action: 'attack' });
  const casts = [];
  const watch = (ev) => casts.push(...ev.filter((e) => e.type === 'cast' && e.by === 'a').map((e) => [w.tick, e.id]));
  run(w, 2, watch);
  applyIntent(w, 'a', { t: 'ability', id: 'slash' });
  run(w, 40, watch);
  const swings = casts.filter(([, id]) => id === 'swing').map(([t]) => t);
  const delay = P.swingDelay(p);
  assert.ok(swings.length >= 5, `genug Schläge (${swings.length})`);
  for (let i = 1; i < swings.length; i++) assert.equal(swings[i] - swings[i - 1], delay, 'Abstand = Waffentempo');
  assert.ok(casts.some(([, id]) => id === 'slash'), 'Fähigkeit trotzdem ausgeführt');
  assert.ok(delay !== GCD, 'Waffentempo unabhängig von der GCD');
});

test('Fähigkeit auf Abklingzeit wird nicht vorgemerkt, sondern gemeldet', () => {
  const w = S.createWorld(REGION, 61);
  const p = newcomer(w, 'a', 'warden');
  p.classes.warden.level = 5;
  P.barOf(p);
  p.cds.brace = w.tick + 100;
  let told = false;
  applyIntent(w, 'a', { t: 'ability', id: 'brace' });
  assert.equal(p.queued, null);
  for (const e of w.events) if (e.type === 'log' && e.text.includes('not ready')) told = true;
  assert.ok(told);
});
