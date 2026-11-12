// Alle Gebiete. Jedes Gebiet ist ein eigener Raum auf dem Server (Durable Object pro id).
// Türen (Objekt type 'door' mit to, tx, ty) führen von einem Gebiet ins andere.
// regionFor(id, date) liefert das Gebiet; der Drift wird jeden Tag aus dem Datum neu gewürfelt.
import { REGION as kindle } from './kindle.js';
import { REGION as drownedChapel } from './drowned-chapel.js';
import { REGION as kindleInside } from './kindle-inside.js';
import { driftFor } from './drift.js';
import { REGION as cinderford } from './cinderford.js';
import { mazeFor, floorOf, MAZE_FLOORS } from './maze.js';

export const STATIC_REGIONS = { kindle, kindle_inside: kindleInside, drowned_chapel: drownedChapel, cinderford };
// Feste Gebiete. Dazu kommen die Stockwerke des Labyrinths maze_1 bis maze_99 (isRegionId).
export const REGION_IDS = ['kindle', 'kindle_inside', 'drowned_chapel', 'drift', 'cinderford'];

export function isRegionId(id) {
  if (REGION_IDS.includes(id)) return true;
  const f = floorOf(id);
  return f >= 1 && f <= MAZE_FLOORS;
}
export const HOME_REGION = 'kindle';

export function regionFor(id, date) {
  if (id === 'drift') return driftFor(date);
  const f = floorOf(id);
  if (f >= 1 && f <= MAZE_FLOORS) return mazeFor(f, date);
  return STATIC_REGIONS[id] || null;
}

// Alle Figuren aller festen Gebiete (für Namen in Fenstern).
export function allNpcs() {
  return Object.values(STATIC_REGIONS).flatMap((r) => r.npcs);
}
