// Nacht 4 (Gebet 8: mehr zu tun im Kampf) und Dauerauftrag Klassen: Stufe 36 für alle vier Klassen.
// Neue Eigenschaft exploit: mehr Schaden gegen Ziele, die schon brennen, geblendet sind oder festsitzen.
// Jede Klasse kann sich die Lage selbst schaffen (Smoulder, Glare, Snare, Anvil Blow) oder die Gruppe hilft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION } from '../../content/regions/kindle.js';
import { CLASSES } from '../../content/classes.js';
import { ABILITIES, GCD } from '../../content/abilities.js';
import { describeAbility } from '../../shared/describe.js';
import * as S from '../../shared/sim.js';
import * as P from '../../shared/player.js';
import { applyIntent } from '../../shared/protocol.js';
import { run, veteran } from './helpers.mjs';

const NEW = { warden: 'anvil_blow', mender: 'cinder_bloom', flarecaster: 'flashpoint', drifter: 'hamstring' };
const WEAPON = { warden: 'masterwork_shield', mender: 'greyglass_staff', flarecaster: 'greyglass_lens', drifter: 'masterwork_shivs' };

// Ein Spieler neben einem Seam Lurker (die bleiben im Fels stehen), die Fähigkeit wird gewirkt, Schaden gemessen.
function setup(cls, seed) {
  const w = S.createWorld(REGION, seed);
  w.daylight = 1;
  const m = w.mobs.find((x) => x.type === 'seam_lurker');
  const p = veteran(w, 'a', { cls, level: 36, equip: { main: WEAPON[cls], body: 'masterwork_coat' } });
  // Nahkämpfer stehen daneben, Mender und Flarecaster zwei Felder weg (der Lurker bleibt im Fels)
  const d = cls === 'warden' || cls === 'drifter' ? 1 : 2;
  p.x = m.x - d; p.y = m.y;
  if (!S.walkable(w, p.x, p.y)) p.y = m.y - d;
  applyIntent(w, 'a', { t: 'target', id: m.id });
  return { w, p, m };
}

function cast(w, id, m) {
  const out = { dmg: 0, exploit: false };
  applyIntent(w, 'a', { t: 'ability', id });
  for (let i = 0; i < GCD + 1; i++) {
    run(w, 1, (ev) => {
      for (const e of ev) {
        if (e.type === 'float' && e.ent === m.id && e.text === 'EXPLOIT') out.exploit = true;
      }
    });
  }
  return out;
}

test('Stufe 36: jede Klasse hat eine neue Fähigkeit mit exploit, beschrieben im Tooltip', () => {
  for (const [cls, id] of Object.entries(NEW)) {
    const row = CLASSES[cls].abilities.find(([a]) => a === id);
    assert.ok(row, `${cls} hat ${id}`);
    assert.equal(row[1], 36);
    assert.ok(ABILITIES[id].exploit, `${id} nutzt eine Lage aus`);
    assert.match(describeAbility(id).effect, /harder against anything/);
  }
  assert.match(describeAbility('anvil_blow').effect, /stuck in place/);
});

test('Drifter: Hamstring trifft festgesetzte Ziele deutlich härter (Snare, dann Hamstring)', () => {
  const avg = (snare) => {
    let sum = 0;
    let ex = 0;
    for (let k = 0; k < 12; k++) {
      const { w, p, m } = setup('drifter', 430 + k);
      if (snare) cast(w, 'snare', m);
      const hp = m.hp;
      const r = cast(w, 'hamstring', m);
      sum += hp - m.hp;
      if (r.exploit) ex++;
      assert.ok(p.hp > 0);
    }
    return { dmg: sum / 12, ex };
  };
  const plain = avg(false);
  const combo = avg(true);
  assert.equal(plain.ex, 0, 'ohne Snare kein EXPLOIT');
  assert.equal(combo.ex, 12, 'nach Snare immer EXPLOIT');
  assert.ok(combo.dmg > plain.dmg * 1.4, `Combo ${combo.dmg.toFixed(1)} gegen ${plain.dmg.toFixed(1)}`);
});

test('Warden: Anvil Blow nagelt fest, der zweite Schlag trifft das festgenagelte Ziel härter', () => {
  const { w, m } = setup('warden', 440);
  const first = cast(w, 'anvil_blow', m);
  assert.equal(first.exploit, false);
  assert.ok(w.tick < m.rootUntil, 'festgenagelt');
  // so früh wie möglich nachsetzen (Abklingzeit seit dem Wirken)
  run(w, ABILITIES.anvil_blow.cd - GCD - 1);
  const second = cast(w, 'anvil_blow', m);
  assert.equal(second.exploit, true, 'zweiter Schlag nutzt es aus');
});

test('Mender: Cinder Bloom nach Smoulder, Flarecaster: Flashpoint nach Glare', () => {
  {
    const { w, m } = setup('mender', 450);
    assert.equal(cast(w, 'cinder_bloom', m).exploit, false);
    run(w, ABILITIES.cinder_bloom.cd);
    cast(w, 'smoulder', m);
    assert.ok(m.burn, 'Smoulder lässt glimmen');
    assert.equal(cast(w, 'cinder_bloom', m).exploit, true);
  }
  {
    const { w, m } = setup('flarecaster', 451);
    assert.equal(cast(w, 'flashpoint', m).exploit, false);
    run(w, ABILITIES.flashpoint.cd);
    cast(w, 'glare', m);
    assert.equal(cast(w, 'flashpoint', m).exploit, true);
  }
});

test('Gruppe: Was der eine anrichtet, nutzt der andere (Flarecaster blendet, Drifter schneidet)', () => {
  const w = S.createWorld(REGION, 460);
  w.daylight = 1;
  const m = w.mobs.find((x) => x.type === 'seam_lurker');
  const f = veteran(w, 'f', { cls: 'flarecaster', level: 36, equip: { main: WEAPON.flarecaster } });
  const d = veteran(w, 'd', { cls: 'drifter', level: 36, equip: { main: WEAPON.drifter } });
  f.x = m.x - 3; f.y = m.y;
  d.x = m.x - 1; d.y = m.y;
  for (const id of ['f', 'd']) applyIntent(w, id, { t: 'target', id: m.id });
  applyIntent(w, 'f', { t: 'ability', id: 'glare' });
  run(w, 2);
  assert.ok(w.tick < m.dazzleUntil, 'geblendet vom Flarecaster');
  let ex = false;
  applyIntent(w, 'd', { t: 'ability', id: 'hamstring' });
  run(w, 2, (ev) => { if (ev.some((e) => e.type === 'float' && e.ent === m.id && e.text === 'EXPLOIT' && e.to === 'd')) ex = true; });
  assert.ok(ex, 'der Drifter nutzt das Blenden des Flarecasters');
});
