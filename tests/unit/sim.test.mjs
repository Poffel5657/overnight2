// Spiellogik ohne Browser: node --test tests/unit/
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { MOBS } from '../../content/mobs.js';
import * as S from '../../shared/sim.js';
import { parseIntent, applyIntent, tickFor, welcomeFor } from '../../shared/protocol.js';

function run(world, n, onTick) {
  for (let i = 0; i < n; i++) {
    S.step(world);
    onTick?.(world.events);
    S.drainEvents(world);
  }
}

test('Neuer Spieler startet in Kindle mit vollen Werten', () => {
  const w = S.createWorld(REGION, 1);
  const p = S.addPlayer(w, 'p1', 'Ada');
  assert.equal(p.hp, 30);
  assert.equal(p.oil, 100);
  assert.ok(S.walkable(w, p.x, p.y));
});

test('Spielstand übersteht removePlayer und addPlayer', () => {
  const w = S.createWorld(REGION, 1);
  const p = S.addPlayer(w, 'p1', 'Ada');
  p.xp = 100; p.level = 4; p.oil = 42.25; p.x = 20; p.y = 30;
  const save = S.removePlayer(w, 'p1');
  const q = S.addPlayer(w, 'p1', 'Ada', JSON.parse(JSON.stringify(save)));
  assert.equal(q.level, 4);
  assert.equal(q.xp, 100);
  assert.equal(q.maxHp, 39);
  assert.equal(q.x, 20);
  assert.ok(Math.abs(q.oil - 42.3) < 0.01);
});

test('Kaputte oder fremde Spielstände werden abgefangen', () => {
  const w = S.createWorld(REGION, 1);
  const p = S.addPlayer(w, 'p1', 'Ada', { x: 9, y: 9, hp: 'viel', level: 9999, oil: -5, xp: -3 });
  assert.equal(p.level, S.MAX_LEVEL);
  assert.ok(p.oil >= 0);
  assert.equal(p.xp, 0);
  assert.ok(S.walkable(w, p.x, p.y), 'Startfeld ist begehbar, auch wenn der Spielstand Unsinn enthält');
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

test('Greyling greift den nächsten Spieler im Dunkeln an, nicht im Dorf', () => {
  const w = S.createWorld(REGION, 3);
  const g = w.mobs.find((m) => m.type === 'greyling');
  const a = S.addPlayer(w, 'a', 'A');
  const b = S.addPlayer(w, 'b', 'B');
  a.x = g.x + 2; a.y = g.y; // nah, im Dunkeln
  assert.ok(S.staticLightAt(w, a.x, a.y) < 0.5);
  run(w, 30);
  assert.ok(a.hp < a.maxHp || w.telegraphs.length || a.x !== g.x + 2, 'A wurde angegriffen');
  assert.equal(b.hp, b.maxHp, 'B im Dorf bleibt unberührt');
});

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

test('Takt-Nachricht schickt Metadaten nur beim ersten Mal und meldet Gehende', () => {
  const w = S.createWorld(REGION, 5);
  S.addPlayer(w, 'a', 'A');
  S.addPlayer(w, 'b', 'B');
  const known = new Set();
  const first = tickFor(w, 'a', known);
  assert.ok(first.spawn.length > 10);
  const second = tickFor(w, 'a', known);
  assert.equal(second.spawn.length, 0);
  S.removePlayer(w, 'b');
  const third = tickFor(w, 'a', known);
  assert.deepEqual(third.gone, ['b']);
  assert.equal(welcomeFor(w, 'a').you, 'a');
});

test('Protokoll lehnt Unsinn ab', () => {
  assert.equal(parseIntent('{"t":"walk","x":1.5,"y":2}'), null);
  assert.equal(parseIntent('{"t":"walk","x":-1,"y":2}'), null);
  assert.equal(parseIntent('{"t":"act","kind":"npc","id":"ama","action":"rm -rf"}'), null);
  assert.equal(parseIntent('{"t":"ability","id":"Strike!"}'), null);
  assert.equal(parseIntent('x'.repeat(600)), null);
  assert.equal(parseIntent('not json'), null);
  assert.deepEqual(parseIntent('{"t":"walk","x":3,"y":4,"evil":1}'), { t: 'walk', x: 3, y: 4 });
});

test('Unbekannte Fähigkeiten und Prototyp-Namen tun nichts', () => {
  const w = S.createWorld(REGION, 6);
  const p = S.addPlayer(w, 'a', 'A');
  applyIntent(w, 'a', { t: 'ability', id: '__proto__' });
  applyIntent(w, 'a', { t: 'ability', id: 'constructor' });
  assert.equal(p.queued, null);
  run(w, 2);
});

test('Ein Greyling lässt sich besiegen und gibt Erfahrung', () => {
  const w = S.createWorld(REGION, 7);
  const g = w.mobs.find((m) => m.type === 'greyling');
  const p = S.addPlayer(w, 'a', 'A');
  p.x = g.x + 1; p.y = g.y;
  S.interact(w, 'a', { kind: 'mob', id: g.id }, 'attack');
  for (let i = 0; i < 200 && !g.dead; i++) {
    S.useAbility(w, 'a', 'strike');
    run(w, 1);
  }
  assert.ok(g.dead, 'Greyling ist besiegt');
  assert.ok(p.xp >= MOBS.greyling.xp);
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
  // Zwei Felder weg und warten
  S.walkTo(w, 'a', p.x + 2, p.y + 1);
  run(w, MOBS.greyling.lunge.delay + 1);
  assert.equal(w.telegraphs.length, 0);
  assert.ok(p.hp >= hp - MOBS.greyling.hit[1], 'Kein voller Einschlag beim Ausweichen');
});

test('Signalfeuer anzünden kostet Öl und macht Licht für alle', () => {
  const w = S.createWorld(REGION, 9);
  const p = S.addPlayer(w, 'a', 'A');
  const sig = w.objects.find((o) => o.type === 'signal');
  p.x = sig.x - 1; p.y = sig.y;
  const before = w.lights.length;
  S.interact(w, 'a', { kind: 'object', id: sig.id }, 'light');
  let lit = false;
  run(w, 3, (ev) => { if (ev.some((e) => e.type === 'lit')) lit = true; });
  assert.ok(lit);
  assert.equal(w.lights.length, before + 1);
  assert.ok(p.oil <= 85.01);
});
