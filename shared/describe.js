// Beschreibung einer Fähigkeit aus ihren Daten (content/abilities.js), damit die Zahlen immer stimmen.
// Ergebnis: { flavor, effect, cost } als kurze englische Sätze für Tooltip und Charakterfenster.
import { ABILITIES, GCD } from '../content/abilities.js';

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
