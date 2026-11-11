// Beschreibung einer Fähigkeit (und weiter unten eines Gegenstands) aus ihren Daten (content/abilities.js), damit die Zahlen immer stimmen.
// Ergebnis: { flavor, effect, cost } als kurze englische Sätze für Tooltip und Charakterfenster.
import { ABILITIES, GCD } from '../content/abilities.js';
import { ITEMS, UNARMED_DELAY } from '../content/items.js';
import { CLASSES } from '../content/classes.js';
import { RECIPES } from '../content/recipes.js';
import { PROFESSIONS } from '../content/professions.js';
import { BEACON_FUEL } from '../content/dailies.js';

const TICK_S = 0.3;
const secs = (ticks) => `${Math.round(ticks * TICK_S * 10) / 10}s`;
const range = (h) => (h[0] === h[1] ? `${h[0]}` : `${h[0]}–${h[1]}`);
const tiles = (n) => `${n} ${n === 1 ? 'tile' : 'tiles'}`;

export function describeAbility(id) {
  const a = ABILITIES[id];
  if (!a) return null;
  const dmg = a.hit ? `${range(a.hit)} damage (+ ${a.power ? 'weapon power and ' : ''}half your level)` : '';
  let effect;
  switch (a.kind) {
    case 'melee':
      effect = `Strike a creature next to you for ${dmg}.${a.dazzle ? ` It cannot attack for ${secs(a.dazzle)}.` : ''}`;
      break;
    case 'ranged':
      effect = `Hit a creature up to ${tiles(a.range)} away for ${dmg}.`;
      break;
    case 'zone':
      effect = `Pick a creature up to ${tiles(a.range)} away: everything within ${tiles(a.radius)} of it takes ${dmg}.`;
      break;
    case 'burst':
      effect = `Everything within ${tiles(a.radius)} of you takes ${dmg} and flees for ${secs(a.scare)}. Their charged attacks fizzle.`;
      break;
    case 'self':
      effect = [a.heal ? `Heal yourself for ${a.heal}.` : '', a.brace ? `Take half damage for ${secs(a.brace)}.` : ''].filter(Boolean).join(' ');
      break;
    case 'aura':
      effect = [
        a.heal ? `Heal yourself and allies within ${tiles(a.radius)} for ${a.heal} (+ your staff's healing).` : '',
        a.brace ? `You and allies within ${tiles(a.radius)} take half damage for ${secs(a.brace)}.` : '',
      ].filter(Boolean).join(' ');
      break;
    case 'hot':
      effect = `You and allies within ${tiles(a.radius)} heal ${a.heal} every 0.6s for ${secs(a.ticks)} (${a.heal * Math.ceil(a.ticks / 2)} in total, + half your staff's healing each time).`;
      break;
    case 'taunt':
      effect = `Every creature within ${tiles(a.radius)} turns on you for 3.6s.`;
      break;
    case 'dash':
      effect = `Jump ${tiles(a.dist)} away from your target and step out of the fight.`;
      break;
    case 'snare':
      effect = `Pin a creature up to ${tiles(a.range)} away in place for ${secs(a.root)}.`;
      break;
    case 'fade':
      effect = `Creatures lose track of you for ${secs(a.ticks)}, unless you stand in bright light.`;
      break;
    default:
      effect = '';
  }
  const parts = [];
  if (a.oil) parts.push(`Costs ${a.oil} oil`);
  parts.push(a.cd > GCD ? `Cooldown ${secs(a.cd)}` : `No cooldown beyond the shared ${secs(GCD)}`);
  return { name: a.name, flavor: a.desc || '', effect, cost: `${parts.join('. ')}.` };
}

// ---------- Gegenstände ----------

const SLOT_LABEL = { main: 'Main hand', head: 'Head', body: 'Body', feet: 'Feet', lantern: 'Lantern' };

// Beschreibung eines Gegenstands aus seinen Daten: { name, kind, flavor, stats: [], uses: [], value }
export function describeItem(id) {
  const it = ITEMS[id];
  if (!it) return null;
  const stats = [];
  let kind = 'Material';
  if (it.slot) {
    kind = SLOT_LABEL[it.slot] || it.slot;
    if (it.slot === 'main' && it.cls) kind += ` · ${CLASSES[it.cls]?.name ?? it.cls} weapon`;
    if (it.power) stats.push(`Power ${it.power}`);
    if (it.defence) stats.push(`Defence ${it.defence}`);
    if (it.heal) stats.push(`Healing +${it.heal}`);
    if (it.slot === 'main') stats.push(`Attacks every ${secs(it.delay ?? UNARMED_DELAY)}`);
    if (it.slot === 'lantern') {
      stats.push(it.light ? `Light +${it.light} tiles` : 'Light: plain');
      stats.push(it.burn === 1 ? 'Burns oil at the usual rate' : `Burns ${Math.round((1 - it.burn) * 100)}% less oil`);
    }
  } else if (it.use) {
    kind = 'Usable';
    if (it.use.heal) stats.push(`Heals ${it.use.heal}`);
    if (it.use.oil) stats.push(`Refills ${it.use.oil} oil`);
    if (it.use.glow) stats.push(`Lantern shines 1.5 tiles further for ${secs(it.use.glow)}`);
  }
  const uses = [];
  const makes = Object.values(RECIPES).filter((r) => r.inputs[id]).map((r) => ITEMS[r.out[0]]?.name).filter(Boolean);
  if (makes.length) uses.push(`Used to make: ${[...new Set(makes)].slice(0, 4).join(', ')}${makes.length > 4 ? ' …' : ''}`);
  const made = Object.values(RECIPES).find((r) => r.out[0] === id);
  if (made) uses.push(`Made by ${PROFESSIONS[made.prof]?.name ?? made.prof} (level ${made.level})`);
  if (BEACON_FUEL[id]) uses.push(`Feeds the Beacon (+${BEACON_FUEL[id]})`);
  return {
    name: it.name,
    kind: it.stack ? `${kind} · stacks` : kind,
    flavor: it.text || '',
    stats,
    uses,
    value: it.value ? `Sells for ${Math.max(1, Math.floor(it.value / 2))} gold` : 'Cannot be sold',
  };
}
