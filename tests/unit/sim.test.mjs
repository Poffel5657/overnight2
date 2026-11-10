// Spiellogik ohne Browser: node --test tests/unit/
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { MOBS } from '../../content/mobs.js';
import { TALK } from '../../content/npcs.js';
import { CLASSES, UNLOCK_LEVEL } from '../../content/classes.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
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
  p.classes.mender = { level: 4, xp: 120 };
  P.addItem(p, 'bread', 3);
  p.gold = 17;
  p.profs.salvage = { level: 3, xp: 50 };
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
  assert.equal(p.classes.warden.level, P.MAX_LEVEL);
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
  g.attacks = MOBS.greyling.lunge.every - 1;
  g.angryAt = 'a';
  run(w, 1);
  assert.equal(w.telegraphs.length, 1, 'Ankündigung liegt');
  const hp = p.hp;
  S.walkTo(w, 'a', p.x + 2, p.y + 1);
  run(w, MOBS.greyling.lunge.delay + 1);
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
  p.x = 27; p.y = 26;
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
  p.x = 25; p.y = 22;
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
  p.x = 10; p.y = 45;
  applyIntent(w, 'a', { t: 'use', slot: staff });
  assert.equal(p.cls, 'warden');
  // Im Dorf schon, und die Warden-Stufe bleibt
  p.x = 28; p.y = 31;
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
  assert.ok(p.hp > 10);
  applyIntent(w, 'a', { t: 'ability', id: 'twin_cut' });
  assert.equal(p.queued, null, 'fremde Fähigkeit wird nicht ausgeführt');
});

// ---------- Berufe ----------

test('Höchstens zwei Berufe, Verlernen löscht den Fortschritt', () => {
  const w = S.createWorld(REGION, 14);
  const p = newcomer(w, 'a', 'warden');
  p.x = 38; p.y = 34;
  talk(w, 'a', 'rook'); choose(w, 'a', 'salvage');
  talk(w, 'a', 'rook'); choose(w, 'a', 'tinkering');
  assert.deepEqual(Object.keys(p.profs).sort(), ['salvage', 'tinkering']);
  p.profs.salvage.level = 7;
  p.x = 30; p.y = 31;
  talk(w, 'a', 'fen');
  assert.ok(!p.dialog.options.some((i) => TALK.fen.start.options[i].text.includes('cartography')), 'kein dritter Beruf');
  p.x = 38; p.y = 34;
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
  p.x = 21; p.y = 24;
  const slot = p.bag.findIndex((s) => s?.id === 'scrap_hood');
  const gold = p.gold;
  applyIntent(w, 'a', { t: 'sell', shop: 'marrow', slot, n: 1 });
  assert.ok(p.gold > gold);
  applyIntent(w, 'a', { t: 'buy', shop: 'marrow', item: 'bread', n: 1 });
  assert.ok(P.countItem(p, 'bread') >= 1);
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
