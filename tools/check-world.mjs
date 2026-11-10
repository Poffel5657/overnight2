// Prüft die Gebiete in content/regions auf Fehler, die man im Spiel sonst erst spät sieht.
// Aufruf: node tools/check-world.mjs   (Exit-Code 1 bei Fehlern)
// Der Nightwright führt das vor jedem Commit aus, der ein Gebiet ändert.

import { REGION as KINDLE } from '../content/regions/kindle.js';
import { TILE_TYPES } from '../content/tiles.js';
import { SPRITES } from '../content/sprites.js';
import { MOBS } from '../content/mobs.js';
import { TALK } from '../content/npcs.js';

// Objekte mit Dach oder hohen Wänden: Figuren brauchen ein freies Feld Abstand,
// sonst verdeckt das Gebäude sie aus manchen Kamerawinkeln.
const TALL = new Set(['house', 'chapel', 'workshop']);
const errors = [];

function check(region) {
  const H = region.tiles.length;
  const W = region.tiles[0].length;
  const err = (msg) => errors.push(`${region.id}: ${msg}`);

  region.tiles.forEach((row, y) => {
    if (row.length !== W) err(`Reihe ${y} ist ${row.length} statt ${W} Zeichen lang`);
    if (region.heights[y]?.length !== W) err(`Höhenreihe ${y} hat die falsche Länge`);
    for (const ch of row) if (!TILE_TYPES[ch]) err(`unbekanntes Geländezeichen '${ch}' in Reihe ${y}`);
  });
  if (region.heights.length !== H) err('Höhenraster hat die falsche Anzahl Reihen');

  const tile = (x, y) => region.tiles[y]?.[x];
  const occupied = new Map();
  for (const o of region.objects) {
    const w = o.w || 1, d = o.d || 1;
    if (o.x < 1 || o.y < 1 || o.x + w > W - 1 || o.y + d > H - 1) err(`${o.type} bei ${o.x},${o.y} ragt aus der Karte`);
    for (let y = o.y; y < o.y + d; y++) {
      for (let x = o.x; x < o.x + w; x++) {
        if (TILE_TYPES[tile(x, y)]?.water) err(`${o.type} bei ${o.x},${o.y} steht im Wasser (${x},${y})`);
        if (occupied.has(`${x},${y}`)) err(`${o.type} bei ${o.x},${o.y} überlappt ${occupied.get(`${x},${y}`)}`);
        occupied.set(`${x},${y}`, `${o.type} bei ${o.x},${o.y}`);
      }
    }
  }

  const nearTall = (x, y) => region.objects.find((o) => TALL.has(o.type)
    && x >= o.x - 1 && x <= o.x + (o.w || 1) && y >= o.y - 1 && y <= o.y + (o.d || 1));
  const spawnOk = (kind, e) => {
    const t = TILE_TYPES[tile(e.x, e.y)];
    if (!t?.walk) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} steht auf '${tile(e.x, e.y)}' (nicht begehbar)`);
    if (occupied.has(`${e.x},${e.y}`)) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} steht in ${occupied.get(`${e.x},${e.y}`)}`);
    const tall = nearTall(e.x, e.y);
    if (tall) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} klebt an ${tall.type} bei ${tall.x},${tall.y} (ein Feld Abstand lassen)`);
  };
  for (const n of region.npcs) {
    spawnOk('Figur', n);
    if (!SPRITES[n.sprite]) err(`Figur ${n.id} hat kein Sprite '${n.sprite}'`);
    if (!TALK[n.id]?.start) err(`Figur ${n.id} hat kein Gespräch (TALK.${n.id}.start)`);
  }
  for (const m of region.mobs) {
    spawnOk('Wesen', m);
    if (!MOBS[m.type]) err(`unbekanntes Wesen '${m.type}'`);
  }
  spawnOk('Start', { id: 'start', ...region.start });
  spawnOk('Aufwachpunkt', { id: 'respawn', ...region.respawn });
}

for (const [name, s] of Object.entries(SPRITES)) {
  const rows = [s.rows, ...(s.frames || [])];
  for (const r of rows) if (new Set(r.map((x) => x.length)).size > 1) errors.push(`Sprite ${name}: Reihen unterschiedlich lang`);
  for (const r of [...s.rows, ...(s.walk || []), ...(s.frames || []).flat()]) {
    for (const ch of r) if (ch !== '.' && !s.palette[ch]) errors.push(`Sprite ${name}: Zeichen '${ch}' fehlt in der Palette`);
  }
}

check(KINDLE);
if (errors.length) {
  console.error(errors.map((e) => `FEHLER ${e}`).join('\n'));
  process.exit(1);
}
console.log('Welt in Ordnung.');
