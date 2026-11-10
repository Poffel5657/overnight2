// Alle Gebiete. Jedes Gebiet ist ein eigener Raum auf dem Server (Durable Object pro id).
// Türen (Objekt type 'door' mit to, tx, ty) führen von einem Gebiet ins andere.
// regionFor(id, date) liefert das Gebiet; der Drift wird jeden Tag aus dem Datum neu gewürfelt.
import { REGION as kindle } from './kindle.js';
import { REGION as drownedChapel } from './drowned-chapel.js';
import { driftFor } from './drift.js';

export const STATIC_REGIONS = { kindle, drowned_chapel: drownedChapel };
export const REGION_IDS = ['kindle', 'drowned_chapel', 'drift'];
export const HOME_REGION = 'kindle';

export function regionFor(id, date) {
  if (id === 'drift') return driftFor(date);
  return STATIC_REGIONS[id] || null;
}

// Alle Figuren aller festen Gebiete (für Namen in Fenstern).
export function allNpcs() {
  return Object.values(STATIC_REGIONS).flatMap((r) => r.npcs);
}
