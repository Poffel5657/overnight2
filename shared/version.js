// Prüfsumme über alle Inhalte. Browser und Server vergleichen sie beim Anmelden:
// Ist der Server älter als die Seite, startet sein Gebietsraum neu (und läuft dann mit der neuen Version);
// ist die Seite älter, bekommt der Spieler den Hinweis, neu zu laden.
import { STATIC_REGIONS } from '../content/regions/index.js';
import { ITEMS } from '../content/items.js';
import { MOBS } from '../content/mobs.js';
import { RECIPES } from '../content/recipes.js';
import { QUESTS } from '../content/quests.js';
import { ABILITIES } from '../content/abilities.js';
import { CLASSES } from '../content/classes.js';
import { NODES } from '../content/nodes.js';
import { TALK } from '../content/npcs.js';
import { CHRONICLE } from '../content/chronicle.js';
import { BALLOT } from '../content/ballot.js';

function fnv(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const regions = Object.values(STATIC_REGIONS).map((r) => ({ id: r.id, tiles: r.tiles, objects: r.objects, npcs: r.npcs, mobs: r.mobs }));
export const CONTENT_SIG = fnv(JSON.stringify([regions, ITEMS, MOBS, RECIPES, QUESTS, ABILITIES, CLASSES, NODES, TALK, CHRONICLE, BALLOT]));
