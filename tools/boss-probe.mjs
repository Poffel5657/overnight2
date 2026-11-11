// Probespieler für Bosse und starke Wesen: Gruppen kämpfen in der echten Simulation gegen ein Wesen.
// Sie drücken Fähigkeiten nach Abklingzeit, gehen aus angekündigten Flächen, Tote bleiben tot.
// Aufruf: node tools/boss-probe.mjs [wesen] [gebiet]   (Standard: lamplighter drowned_chapel)
import * as S from '../shared/sim.js';
import * as P from '../shared/player.js';
import { applyIntent } from '../shared/protocol.js';
import { regionFor } from '../content/regions/index.js';
import { CLASSES } from '../content/classes.js';

const ROT = { warden: ['shield_slam', 'brace', 'bash'], mender: ['ember_touch', 'warmth', 'glow', 'staff_rap'], flarecaster: ['sear', 'sunspot', 'flare_bolt'], drifter: ['twin_cut', 'slash'] };
const MOB = process.argv[2] || 'lamplighter';
const REGION_ID = process.argv[3] || 'drowned_chapel';
function fight(team, label, seed = 7) {
  const d = S.createWorld(regionFor(REGION_ID, '2026-01-01'), seed);
  const boss = d.mobs.find((m) => m.type === MOB);
  if (!boss) throw new Error(`Kein Wesen ${MOB} in ${REGION_ID}`);
  for (const m of d.mobs) if (m !== boss) { m.dead = true; m.deadUntil = 1e9; }
  const ps = team.map(([cls, lvl, gear], i) => {
    const equip = gear ? { main: { warden: 'greyglass_shield', mender: 'greyglass_staff', flarecaster: 'greyglass_lens', drifter: 'greyglass_shivs' }[cls], body: 'greyglass_coat' } : { main: CLASSES[cls].starter };
    const p = S.addPlayer(d, 'p' + i, cls, { v: 2, cls, classes: { [cls]: { level: lvl, xp: P.xpForLevel(lvl) } }, equip, quests: {} });
    p.x = boss.x + (i % 2 ? 1 : -1); p.y = boss.y + (i > 1 ? 1 : 0); p.oil = 100;
    applyIntent(d, p.id, { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
    return p;
  });
  let t = 0;
  let deaths = 0;
  const gone = new Set();
  for (; t < 4000 && !boss.dead && ps.some((p) => !gone.has(p.id)); t++) {
    for (const p of ps) {
      if (gone.has(p.id)) continue;
      // aus angekündigten Flächen gehen
      const tele = d.telegraphs.find((x) => x.tiles.some((c) => c.x === p.x && c.y === p.y));
      if (tele) { const free = [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].map(([a,b]) => ({ x: p.x+a, y: p.y+b })).find((c) => S.walkable(d, c.x, c.y) && !tele.tiles.some((q) => q.x === c.x && q.y === c.y)); if (free) applyIntent(d, p.id, { t: 'walk', x: free.x, y: free.y }); continue; }
      if (!p.engaged) applyIntent(d, p.id, { t: 'act', kind: 'mob', id: boss.id, action: 'attack' });
      for (const ab of ROT[p.cls]) if ((p.cds[ab] || 0) <= d.tick && P.knownAbilities(p).includes(ab)) { applyIntent(d, p.id, { t: 'ability', id: ab }); break; }
      p.oil = 100;
    }
    S.step(d);
    for (const e of d.events) if (e.type === 'log' && /got the better of you/.test(e.text || '')) { deaths++; gone.add(e.to); }
    S.drainEvents(d);
    for (const id of gone) { const q = d.players.get(id); if (q) q.hp = 0; }
    // Kohlebecken anzünden lassen wir weg (schwerer Fall)
  }
  const alive = ps.filter((p) => !gone.has(p.id)).length;
  console.log(`${MOB}: ${label.padEnd(40)} ${boss.dead ? 'SIEG' : 'NIEDERLAGE'} nach ${(t * 0.3).toFixed(0)}s, Boss ${Math.max(0, boss.hp)}/${boss.maxHp}, lebend ${alive}/${ps.length}`);
}
fight([['warden', 26, false], ['drifter', 26, false]], '2x Stufe 26 ohne Ausrüstung');
fight([['warden', 38, true], ['mender', 38, true], ['drifter', 38, true], ['flarecaster', 38, true]], '4x Stufe 38 mit Ausrüstung');
fight([['warden', 38, true], ['mender', 38, true]], '2x Stufe 38 mit Ausrüstung (Tank+Heiler)');
fight([['warden', 45, true], ['mender', 45, true], ['drifter', 45, true], ['flarecaster', 45, true]], '4x Stufe 45 mit Ausrüstung');
